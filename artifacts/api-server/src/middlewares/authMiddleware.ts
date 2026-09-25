import * as oidc from "openid-client";
import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
import { pool } from "@workspace/db";
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

// The cache is intentionally short. A founder approval, tester grant, archive,
// or suspension must take effect on an existing session promptly rather than
// requiring a re-login or a long polling interval.
const ROLE_CACHE_TTL_MS = 5_000;
interface RoleCache {
  role: string;
  isLoadTest: boolean;
  approved: boolean;
  cachedAt: number;
}
const roleCache = new Map<string, RoleCache>();

/**
 * Controlled-rollout access is derived from the authoritative access ledger,
 * not from a stale session snapshot or a duplicate account boolean. An active,
 * unexpired tester grant and an approved waitlist record are both deliberate
 * access decisions. Suspension remains an explicit block.
 */
export function hasEffectiveRolloutAccess(
  user: Readonly<{
    role: string;
    accountStatus: string | null;
    testerStatus: string | null;
    testingEntitlementEndsAt: Date | null;
    waitlistApproved: boolean;
  }>,
  now = new Date(),
): boolean {
  if (user.accountStatus === "suspended") return false;
  if (user.role === "admin") return true;
  if (
    user.testerStatus === "active" &&
    (!user.testingEntitlementEndsAt || user.testingEntitlementEndsAt > now)
  ) {
    return true;
  }
  return user.waitlistApproved;
}

declare global {
  namespace Express {
    interface User extends AuthUser {
      role: "user" | "tester" | "admin";
      approved: boolean;
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

  // Wrap DB read in try/catch so a transient pool error does NOT destroy the
  // user's session cookie. On DB error we continue unauthenticated this request
  // only — the cookie stays intact so the next request can succeed.
  let session: SessionData | null = null;
  try {
    session = await getSession(sid);
  } catch (err) {
    req.log.warn(
      { event: "SESSION_DB_READ_ERROR", sidPrefix: sid.slice(0, 8) + "…", err },
      "DB error reading session — keeping cookie, continuing unauthenticated this request",
    );
    next();
    return;
  }

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

  // Re-read effective access from the source of truth so a waitlist approval,
  // tester grant, archival, or suspension takes effect for existing sessions.
  // An approved waitlist record or active tester entitlement is itself a
  // deliberate access decision. This keeps App Store/Play enrollment separate
  // from MWM access without stranding an already-approved tester on a stale
  // session flag.
  try {
    const userId = refreshed.user.id;
    const cached = roleCache.get(userId);
    const cacheHit = cached && (Date.now() - cached.cachedAt) < ROLE_CACHE_TTL_MS;

    let freshRole: string | undefined;
    let freshIsLoadTest: boolean | undefined;
    let freshApproved: boolean | undefined;

    if (cacheHit) {
      freshRole = cached.role;
      freshIsLoadTest = cached.isLoadTest;
      freshApproved = cached.approved;
    } else {
      const freshRes = await pool.query<{
        role: string;
        is_load_test: boolean;
        account_status: string | null;
        tester_status: string | null;
        testing_entitlement_ends_at: Date | null;
        waitlist_approved: boolean;
      }>(
        `SELECT u.role,
                u.is_load_test,
                u.account_status,
                u.tester_status,
                u.testing_entitlement_ends_at,
                EXISTS (
                  SELECT 1
                  FROM waitlist_signups w
                  WHERE LOWER(TRIM(w.email)) = LOWER(TRIM(u.email))
                    AND w.status = 'approved'
                ) AS waitlist_approved
           FROM users u
          WHERE u.id = $1
          LIMIT 1`,
        [userId],
      );
      const row = freshRes.rows[0];
      if (row) {
        freshRole = row.role;
        freshIsLoadTest = row.is_load_test ?? false;
        freshApproved = hasEffectiveRolloutAccess({
          role: row.role,
          accountStatus: row.account_status,
          testerStatus: row.tester_status,
          testingEntitlementEndsAt: row.testing_entitlement_ends_at,
          waitlistApproved: row.waitlist_approved === true,
        });
        roleCache.set(userId, {
          role: freshRole,
          isLoadTest: freshIsLoadTest,
          approved: freshApproved,
          cachedAt: Date.now(),
        });
      }
    }

    if (freshRole) {
      const roleChanged = freshRole !== refreshed.user.role;
      const approvalChanged =
        freshApproved !== undefined && freshApproved !== refreshed.user.approved;
      if (roleChanged) {
        refreshed.user.role = freshRole as "user" | "tester" | "admin";
      }
      if (freshApproved !== undefined) {
        refreshed.user.approved = freshApproved;
      }
      refreshed.user.isLoadTest = freshIsLoadTest ?? false;
      if (roleChanged || approvalChanged || refreshed.user.isLoadTest) {
        await updateSession(sid, refreshed);
      }
    }
  } catch {
    // Closed rollout policy: a database failure must never turn a stale session
    // into access. Keep the stored session intact for recovery, but deny this
    // request until the authoritative waitlist/tester check succeeds.
    refreshed.user.approved = false;
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
