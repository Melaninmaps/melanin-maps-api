import * as oidc from "openid-client";
import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  getSession,
  updateSession,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

// In-memory throttle map: sid → timestamp of last successful session renewal.
// Limits DB writes to at most once per hour per session, preventing write storms
// when many concurrent requests arrive from the same session (e.g. app startup burst).
const renewalThrottle = new Map<string, number>();

declare global {
  namespace Express {
    interface User extends AuthUser {
      role: "user" | "tester" | "admin";
    }

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

async function refreshIfExpired(
  sid: string,
  session: SessionData,
): Promise<SessionData | null> {
  const now = Math.floor(Date.now() / 1000);
  if (!session.expires_at || now <= session.expires_at) return session;

  // Non-OIDC sessions (email/password, Apple Sign-In) have no refresh_token.
  // They rely solely on the DB session TTL — never refresh via OIDC.
  if (!session.refresh_token) return session;

  try {
    const config = await getOidcConfig();
    const tokens = await oidc.refreshTokenGrant(
      config,
      session.refresh_token,
    );
    session.access_token = tokens.access_token;
    session.refresh_token = tokens.refresh_token ?? session.refresh_token;
    session.expires_at = tokens.expiresIn()
      ? now + tokens.expiresIn()!
      : session.expires_at;
    await updateSession(sid, session);
    return session;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getSession(sid);
  if (!session?.user?.id) {
    req.log.warn(
      { event: "SESSION_CLEARED_NO_USER", sidPrefix: sid.slice(0, 8) + "…", hasSession: !!session },
      "clearing session: no user ID found in session data",
    );
    await clearSession(res, sid);
    next();
    return;
  }

  const refreshed = await refreshIfExpired(sid, session);
  if (!refreshed) {
    req.log.warn(
      {
        event: "SESSION_CLEARED_REFRESH_FAILED",
        sidPrefix: sid.slice(0, 8) + "…",
        userId: session.user.id,
        hasExpiresAt: !!session.expires_at,
        hasRefreshToken: !!session.refresh_token,
        expiresAt: session.expires_at,
        nowUnix: Math.floor(Date.now() / 1000),
      },
      "clearing session: OIDC token refresh failed",
    );
    await clearSession(res, sid);
    next();
    return;
  }

  // Re-read role from DB on every request to prevent stale session roles.
  // This ensures role changes (e.g. promoting to admin/tester) take effect
  // immediately without requiring the user to log out and back in.
  try {
    const [freshUser] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, refreshed.user.id))
      .limit(1);
    if (freshUser && freshUser.role && freshUser.role !== refreshed.user.role) {
      refreshed.user.role = freshUser.role as "user" | "tester" | "admin";
      await updateSession(sid, refreshed);
    }
  } catch {
    // If DB lookup fails, serve the existing session role rather than blocking the request
  }

  req.user = refreshed.user;

  // Rolling sessions: extend the DB expiry on every authenticated request so
  // active users are never silently logged out mid-session.
  // Throttled to at most once per hour per session to prevent DB write storms
  // on app-startup bursts (many concurrent requests from the same session).
  const sidPrefix = sid.slice(0, 8) + "…";
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const lastRenewed = renewalThrottle.get(sid);
  const shouldRenew = !lastRenewed || Date.now() - lastRenewed > ONE_HOUR_MS;

  if (shouldRenew) {
    renewalThrottle.set(sid, Date.now());
    const newExpiry = new Date(Date.now() + SESSION_TTL).toISOString();
    updateSession(sid, refreshed)
      .then(() => {
        req.log.info(
          { event: "SESSION_RENEWED", sidPrefix, userId: refreshed.user.id, newExpiry },
          "session expiry extended",
        );
      })
      .catch((err: unknown) => {
        renewalThrottle.delete(sid); // allow retry on next request after a failure
        req.log.warn(
          {
            event: "SESSION_RENEWAL_FAILED",
            sidPrefix,
            userId: refreshed.user.id,
            err,
            impact: "user will be logged out at original session expiry",
          },
          "session renewal failed",
        );
      });
  }

  next();
}
