import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  getSession,
  getSessionId,
  logAuthEvent,
  updateSession,
} from "../lib/auth";

/** A short, session-scoped window prevents an old general login from unlocking a vault. */
export const SENSITIVE_MEMORY_VAULT_REAUTH_TTL_MS = 10 * 60 * 1_000;

export type SensitiveVaultReauthResult =
  | { ok: true; expiresAt: string }
  | { ok: false; status: 400 | 401 | 403 | 409; code: string; error: string };

function requestSessionOwner(req: Request): { sid: string; userId: string } | null {
  const sid = getSessionId(req);
  const userId = req.user?.id;
  return sid && userId ? { sid, userId } : null;
}

export async function sensitiveMemoryVaultReauthState(req: Request): Promise<{
  reauthenticated: boolean;
  expiresAt: string | null;
}> {
  const owner = requestSessionOwner(req);
  if (!owner) return { reauthenticated: false, expiresAt: null };
  const session = await getSession(owner.sid);
  if (!session || session.user.id !== owner.userId) return { reauthenticated: false, expiresAt: null };
  const timestamp = session.sensitiveMemoryVaultReauthenticatedAt;
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return { reauthenticated: false, expiresAt: null };
  }
  const expiresAt = timestamp + SENSITIVE_MEMORY_VAULT_REAUTH_TTL_MS;
  return {
    reauthenticated: expiresAt > Date.now(),
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export async function requireSensitiveMemoryVaultReauth(
  req: Request,
  res: Response,
): Promise<boolean> {
  const state = await sensitiveMemoryVaultReauthState(req);
  if (state.reauthenticated) return true;
  res.status(403).json({
    error: "Recent password confirmation is required before Kinfolk can open or change a sensitive private memory.",
    code: "SENSITIVE_MEMORY_REAUTH_REQUIRED",
    reauthenticated: false,
  });
  return false;
}

/**
 * Reauthentication intentionally supports only an existing local password. OIDC,
 * Apple, and passkey sessions fail closed until a provider-specific fresh-auth
 * assertion can be verified server-side; accepting a long-lived login token here
 * would not satisfy the vault's recent-authentication boundary.
 */
export async function reauthenticateSensitiveMemoryVault(
  req: Request,
  password: unknown,
): Promise<SensitiveVaultReauthResult> {
  const owner = requestSessionOwner(req);
  if (!owner) {
    return { ok: false, status: 401, code: "AUTHENTICATION_REQUIRED", error: "Authentication required" };
  }
  if (typeof password !== "string" || password.length === 0 || password.length > 512) {
    return { ok: false, status: 400, code: "SENSITIVE_MEMORY_PASSWORD_REQUIRED", error: "Enter your current password to open the sensitive memory vault." };
  }

  const session = await getSession(owner.sid);
  if (!session || session.user.id !== owner.userId) {
    return { ok: false, status: 401, code: "AUTHENTICATION_REQUIRED", error: "Authentication required" };
  }
  const [user] = await db
    .select({ passwordHash: usersTable.passwordHash })
    .from(usersTable)
    .where(eq(usersTable.id, owner.userId))
    .limit(1);
  if (!user?.passwordHash) {
    return {
      ok: false,
      status: 409,
      code: "SENSITIVE_MEMORY_REAUTH_UNAVAILABLE",
      error: "This sign-in method cannot confirm a recent password yet. Sensitive memory remains locked until a supported fresh-authentication method is available.",
    };
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await logAuthEvent(owner.userId, "SENSITIVE_MEMORY_VAULT_REAUTH_FAILED", req.ip ?? null, req.get("user-agent") ?? null, { method: "password" });
    return { ok: false, status: 403, code: "SENSITIVE_MEMORY_REAUTH_FAILED", error: "Password confirmation failed. Sensitive memory remains locked." };
  }

  const reauthenticatedAt = Date.now();
  await updateSession(owner.sid, { ...session, sensitiveMemoryVaultReauthenticatedAt: reauthenticatedAt });
  await logAuthEvent(owner.userId, "SENSITIVE_MEMORY_VAULT_REAUTH_SUCCEEDED", req.ip ?? null, req.get("user-agent") ?? null, { method: "password" });
  return {
    ok: true,
    expiresAt: new Date(reauthenticatedAt + SENSITIVE_MEMORY_VAULT_REAUTH_TTL_MS).toISOString(),
  };
}
