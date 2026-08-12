import * as client from "openid-client";
import crypto from "crypto";
import { type Request, type Response } from "express";
import { db, pool, sessionsTable, authEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthUser } from "@workspace/api-zod";

export const ISSUER_URL = process.env.ISSUER_URL ?? "https://replit.com/oidc";
export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface SessionUser extends AuthUser {
  approved: boolean;
  role: "user" | "tester" | "admin";
  /** true for mwm-loadtest-* accounts — suppresses community/notification side effects */
  isLoadTest?: boolean;
}

export interface SessionData {
  user: SessionUser;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

let oidcConfig: client.Configuration | null = null;

// ── Session read coalescing cache (5-second TTL) ──────────────────────────────
// At 30 concurrent users every authenticated request hits the same sessions table.
// A 5s window coalesces duplicate reads — any two requests for the same SID within
// a 5-second window share a single DB round-trip via an in-flight promise.
// On write (updateSession) or delete (deleteSession/clearSession) the entry is
// invalidated immediately so the next read always sees fresh data.
const SESSION_CACHE_TTL_MS = 5_000;
interface SessionCacheEntry {
  promise: Promise<SessionData | null>;
  expiresAt: number;
}
const sessionCache = new Map<string, SessionCacheEntry>();

function invalidateSessionCache(sid: string): void {
  sessionCache.delete(sid);
}

// Evict stale entries periodically (avoid map growth on long-running instances)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessionCache) {
    if (v.expiresAt <= now) sessionCache.delete(k);
  }
}, 30_000).unref();

export async function getOidcConfig(): Promise<client.Configuration> {
  if (!oidcConfig) {
    oidcConfig = await client.discovery(
      new URL(ISSUER_URL),
      process.env.REPL_ID!,
    );
  }
  return oidcConfig;
}

export async function createSession(data: SessionData): Promise<string> {
  const sid = crypto.randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({
    sid,
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + SESSION_TTL),
  });
  return sid;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  const now = Date.now();
  const cached = sessionCache.get(sid);
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }
  // Issue a new DB read and cache the in-flight promise so concurrent requests
  // for the same SID within the TTL window share a single round-trip.
  const promise = (async (): Promise<SessionData | null> => {
    const [row] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.sid, sid));

    if (!row || row.expire < new Date()) {
      if (row) await deleteSession(sid);
      sessionCache.delete(sid);
      return null;
    }
    return row.sess as unknown as SessionData;
  })();
  sessionCache.set(sid, { promise, expiresAt: now + SESSION_CACHE_TTL_MS });
  return promise;
}

export async function updateSession(
  sid: string,
  data: SessionData,
): Promise<void> {
  invalidateSessionCache(sid);
  await db
    .update(sessionsTable)
    .set({
      sess: data as unknown as Record<string, unknown>,
      expire: new Date(Date.now() + SESSION_TTL),
    })
    .where(eq(sessionsTable.sid, sid));
}

export async function deleteSession(sid: string): Promise<void> {
  invalidateSessionCache(sid);
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}

export async function clearSession(
  res: Response,
  sid?: string,
): Promise<void> {
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[SESSION_COOKIE];
}

export async function deleteAllSessionsForUser(userId: string): Promise<number> {
  const result = await pool.query(
    `DELETE FROM sessions WHERE sess->'user'->>'id' = $1`,
    [userId],
  );
  return (result.rowCount as number | null) ?? 0;
}

export async function logAuthEvent(
  userId: string | null,
  event: string,
  ipAddress: string | null,
  userAgent: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(authEventsTable).values({
      userId,
      event,
      ipAddress,
      userAgent: userAgent ?? null,
      metadata: metadata ?? null,
    });
  } catch {
    // non-fatal — pino logger already captured the event
  }
}
