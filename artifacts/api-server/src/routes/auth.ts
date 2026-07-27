import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  ExchangeMobileAuthorizationCodeBody,
  ExchangeMobileAuthorizationCodeResponse,
  LogoutMobileSessionResponse,
} from "@workspace/api-zod";
import { db, usersTable, getPoolStats } from "@workspace/db";
import { withDbRetry } from "../lib/db-retry";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdminReq(req: Request): boolean {
  const user = (req as any).user;
  return !!(user?.email && ADMIN_EMAILS.includes(user.email));
}
function isReservedUsername(username: string): boolean {
  const n = username.toLowerCase().replace(/_/g, "");
  return ["mappingwithmelanin", "melaninmaps", "melaninmap", "melaninmapping", "mappingmelanin"].some(p => n.includes(p));
}
import {
  clearSession,
  getOidcConfig,
  getSession,
  getSessionId,
  createSession,
  deleteSession,
  deleteAllSessionsForUser,
  logAuthEvent,
  SESSION_COOKIE,
  SESSION_TTL,
  ISSUER_URL,
  type SessionData,
} from "../lib/auth";
import jwt from "jsonwebtoken";
import { encryptToken, generateClientSecret, exchangeAuthCode } from "../lib/apple";
import { sendWelcomeEmail, sendPasswordResetEmail, generateUnsubscribeToken } from "../lib/email";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;

// ─── Temporary diagnostic helpers — remove after auth investigation ───────────
function maskEmail(raw: string): string {
  const at = raw.indexOf("@");
  if (at < 0) return "***";
  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : "***";
  const maskedDomain = domain.length > 4 ? `${domain.slice(0, 4)}***` : `${domain.slice(0, 2)}***`;
  return `${maskedLocal}@${maskedDomain}`;
}
function genReqId(): string {
  return crypto.randomBytes(6).toString("hex");
}
// ─────────────────────────────────────────────────────────────────────────────

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

async function upsertUser(claims: Record<string, unknown>) {
  const userData = {
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: (claims.first_name as string) || null,
    lastName: (claims.last_name as string) || null,
    profileImageUrl: (claims.profile_image_url || claims.picture) as
      | string
      | null,
  };

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, userData.id));

  const isNew = !existing;

  const [user] = await db
    .insert(usersTable)
    .values({ ...userData, approved: true })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (isNew && user.email) {
    sendWelcomeEmail(user.email, user.firstName).catch(() => {});
  }

  return user;
}

router.get("/auth/user", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.json({ user: null }); return; }
  try {
    const [dbRow] = await db
      .select({
        dateOfBirth: usersTable.dateOfBirth,
        role: usersTable.role,
        approved: usersTable.approved,
        username: usersTable.username,
        memberType: usersTable.memberType,
        emailVerified: usersTable.emailVerified,
        homeCity: usersTable.homeCity,
        isPrivate: usersTable.isPrivate,
        bio: usersTable.bio,
        showCity: usersTable.showCity,
        allowDm: usersTable.allowDm,
        displayNameFormat: usersTable.displayNameFormat,
        trustLevel: usersTable.trustLevel,
        reputationScore: usersTable.reputationScore,
        profileSetupComplete: usersTable.profileSetupComplete,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id))
      .limit(1);
    res.json({
      user: {
        ...req.user,
        dateOfBirth: dbRow?.dateOfBirth ?? null,
        role: (dbRow?.role ?? req.user!.role) as "user" | "tester" | "admin",
        approved: dbRow?.approved ?? req.user!.approved,
        username: dbRow?.username ?? null,
        memberType: dbRow?.memberType ?? "individual",
        emailVerified: dbRow?.emailVerified ?? false,
        homeCity: dbRow?.homeCity ?? null,
        isPrivate: dbRow?.isPrivate ?? false,
        bio: dbRow?.bio ?? null,
        showCity: dbRow?.showCity ?? true,
        allowDm: dbRow?.allowDm ?? true,
        displayNameFormat: dbRow?.displayNameFormat ?? "full",
        trustLevel: dbRow?.trustLevel ?? 1,
        reputationScore: dbRow?.reputationScore ?? 0,
        profileSetupComplete: dbRow?.profileSetupComplete ?? false,
      },
    });
  } catch {
    res.json({ user: req.user });
  }
});

router.get("/login", async (req: Request, res: Response) => {
  try {
    const config = await getOidcConfig();
    const callbackUrl = `${getOrigin(req)}/api/callback`;

    const returnTo = getSafeReturnTo(req.query.returnTo);

    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    const redirectTo = oidc.buildAuthorizationUrl(config, {
      redirect_uri: callbackUrl,
      scope: "openid email profile offline_access",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "login consent",
      state,
      nonce,
    });

    setOidcCookie(res, "code_verifier", codeVerifier);
    setOidcCookie(res, "nonce", nonce);
    setOidcCookie(res, "state", state);
    setOidcCookie(res, "return_to", returnTo);

    res.redirect(redirectTo.href);
  } catch (err) {
    req.log.error({ err }, "Failed to initiate login");
    res.status(500).send("Login temporarily unavailable. Please try again.");
  }
});

// Query params are not validated because the OIDC provider may include
// parameters not expressed in the schema.
router.get("/callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const codeVerifier = req.cookies?.code_verifier;
  const nonce = req.cookies?.nonce;
  const expectedState = req.cookies?.state;

  if (!codeVerifier || !expectedState) {
    res.redirect("mappingwithmelanin://auth-complete?error=session_expired");
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch {
    res.redirect("mappingwithmelanin://auth-complete?error=auth_failed");
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  res.clearCookie("code_verifier", { path: "/" });
  res.clearCookie("nonce", { path: "/" });
  res.clearCookie("state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/api/login");
    return;
  }

  const dbUser = await upsertUser(
    claims as unknown as Record<string, unknown>,
  );

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      approved: dbUser.approved,
      role: dbUser.role as "user" | "tester" | "admin",
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.redirect(returnTo);
});

router.get("/logout", async (req: Request, res: Response) => {
  try {
    const config = await getOidcConfig();
    const origin = getOrigin(req);

    const sid = getSessionId(req);
    await clearSession(res, sid);

    const endSessionUrl = oidc.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: origin,
    });

    res.redirect(endSessionUrl.href);
  } catch (err) {
    req.log.error({ err }, "Failed to complete logout");
    res.redirect("/");
  }
});

// ─── GET /mobile-auth/init ── Mobile entry: triggers server-side OIDC flow ──────
// The mobile app opens this URL in a browser. The server handles the full
// Replit OIDC PKCE flow (https redirect_uri accepted), then hands the session
// token back to the app via the mappingwithmelanin:// custom scheme.
router.get("/mobile-auth/init", (_req: Request, res: Response) => {
  res.redirect("/api/login?returnTo=/api/mobile-auth/done");
});

// ─── GET /mobile-auth/done ── Called after callback; hands token to app ─────────
router.get("/mobile-auth/done", (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (!sid) {
    res.redirect("mappingwithmelanin://auth-complete?error=no_session");
    return;
  }
  res.redirect(`mappingwithmelanin://auth-complete?token=${encodeURIComponent(sid)}`);
});

router.post(
  "/mobile-auth/token-exchange",
  async (req: Request, res: Response) => {
    const parsed = ExchangeMobileAuthorizationCodeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid required parameters" });
      return;
    }

    const { code, code_verifier, redirect_uri, state, nonce } = parsed.data;

    try {
      const config = await getOidcConfig();

      const callbackUrl = new URL(redirect_uri);
      callbackUrl.searchParams.set("code", code);
      callbackUrl.searchParams.set("state", state);
      callbackUrl.searchParams.set("iss", ISSUER_URL);

      const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: code_verifier,
        expectedNonce: nonce ?? undefined,
        expectedState: state,
        idTokenExpected: true,
      });

      const claims = tokens.claims();
      if (!claims) {
        res.status(401).json({ error: "No claims in ID token" });
        return;
      }

      const dbUser = await upsertUser(
        claims as unknown as Record<string, unknown>,
      );

      const now = Math.floor(Date.now() / 1000);
      const sessionData: SessionData = {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl,
          approved: dbUser.approved,
          role: dbUser.role as "user" | "tester" | "admin",
        },
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
      };

      const sid = await createSession(sessionData);
      res.json(ExchangeMobileAuthorizationCodeResponse.parse({ token: sid }));
    } catch (err) {
      req.log.error({ err }, "Mobile token exchange error");
      res.status(500).json({ error: "Token exchange failed" });
    }
  },
);

router.patch("/auth/user/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user!.id;
    const { dateOfBirth } = req.body as { dateOfBirth?: string };
    if (!dateOfBirth) { res.status(400).json({ error: "dateOfBirth is required" }); return; }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) { res.status(400).json({ error: "Invalid date format" }); return; }

    const ageMs = Date.now() - dob.getTime();
    const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    if (ageYears < 13) { res.status(400).json({ error: "You must be at least 13 years old to use this platform." }); return; }
    if (ageYears > 120) { res.status(400).json({ error: "Invalid date of birth." }); return; }

    const [updated] = await db
      .update(usersTable)
      .set({ dateOfBirth: dob })
      .where(eq(usersTable.id, userId))
      .returning({ dateOfBirth: usersTable.dateOfBirth });

    res.json({ dateOfBirth: updated.dateOfBirth });
  } catch (err) {
    req.log.error({ err }, "PATCH /api/auth/user/profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/mobile-auth/logout", async (req: Request, res: Response) => {
  try {
    const sid = getSessionId(req);
    if (sid) {
      await deleteSession(sid);
    }
    res.json(LogoutMobileSessionResponse.parse({ success: true }));
  } catch (err) {
    req.log.error({ err }, "Failed to complete mobile logout");
    res.json(LogoutMobileSessionResponse.parse({ success: true }));
  }
});

// ─── GET /auth/check-username ─────────────────────────────────────────────────
router.get("/auth/check-username", async (req: Request, res: Response) => {
  const raw = typeof req.query.username === "string" ? req.query.username : "";
  const username = raw.toLowerCase().trim();

  if (!username || username.length < 3) {
    res.json({ available: false, error: "At least 3 characters required" });
    return;
  }
  if (username.length > 30) {
    res.json({ available: false, error: "Username must be 30 characters or fewer" });
    return;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    res.json({ available: false, error: "Letters, numbers, and underscores only" });
    return;
  }
  if (isReservedUsername(username) && !isAdminReq(req)) {
    res.json({ available: false, error: "That username is reserved." });
    return;
  }

  try {
    const [existing] = await withDbRetry(
      () =>
        db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.username, username))
          .limit(1),
      req.log,
      "GET /auth/check-username",
    );
    res.json({ available: !existing });
  } catch (err) {
    req.log.error({ err }, "GET /api/auth/check-username error");
    res.status(500).json({ available: false, error: "Could not check username" });
  }
});

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post("/auth/register", async (req: Request, res: Response) => {
  const reqId = genReqId();
  const t0 = Date.now();
  const diagBase = {
    reqId,
    ts: new Date(t0).toISOString(),
    origin: (req.headers["origin"] as string | undefined) ?? req.headers["host"] ?? "unknown",
    ua: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"].slice(0, 150) : "unknown",
  };

  const { firstName, lastName, email, password, username, dateOfBirth, agreeToTerms } =
    req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      username?: string;
      dateOfBirth?: string;
      agreeToTerms?: boolean;
    };

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password || !username?.trim()) {
    res.status(400).json({ error: "First name, last name, email, password, and username are required." });
    return;
  }
  if (!agreeToTerms) {
    res.status(400).json({ error: "You must agree to the Terms of Service." });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }
  const cleanUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
    res.status(400).json({ error: "Username must be 3–30 characters: letters, numbers, and underscores only." });
    return;
  }
  if (isReservedUsername(cleanUsername)) {
    res.status(400).json({ error: "That username is reserved." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  if (!dateOfBirth) {
    res.status(400).json({ error: "Date of birth is required to create an account." });
    return;
  }
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    res.status(400).json({ error: "Invalid date of birth." });
    return;
  }
  const now = new Date();
  if (dob > now) {
    res.status(400).json({ error: "Date of birth cannot be in the future." });
    return;
  }
  // Calendar-based age — correct on the exact birthday, UTC-normalized to
  // avoid timezone-induced day shifts near the 13-year threshold.
  const y = dob.getUTCFullYear(), m = dob.getUTCMonth(), d = dob.getUTCDate();
  const ty = now.getUTCFullYear(), tm = now.getUTCMonth(), td = now.getUTCDate();
  let age = ty - y;
  if (tm < m || (tm === m && td < d)) age--; // birthday not yet reached this year
  if (age > 120) {
    res.status(400).json({ error: "Invalid date of birth." });
    return;
  }
  if (age < 13) {
    res.status(400).json({ error: "You must be at least 13 years old to use this platform." });
    return;
  }

  try {
    await withDbRetry(async () => {
    const cleanEmail = email.trim().toLowerCase();
    const emailMasked = maskEmail(cleanEmail);

    // Run email, username checks and password hash in parallel — no sequential waiting
    const [existingEmail, existingUsername, passwordHash] = await Promise.all([
      db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, cleanEmail)).limit(1).then(r => r[0]),
      db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, cleanUsername)).limit(1).then(r => r[0]),
      bcrypt.hash(password, 8),
    ]);

    if (existingEmail) {
      req.log.info({ ...diagBase, event: "AUTH_REGISTER_DUPLICATE_EMAIL", emailMasked, status: 409, durationMs: Date.now() - t0 }, "auth diagnostic");
      res.status(409).json({ error: "An account with this exact email address already exists. Try signing in instead, or use a different email." });
      return;
    }
    if (existingUsername) {
      res.status(409).json({ error: "That @username is already taken — please choose a different one. Your email address is fine." });
      return;
    }
    const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const [user] = await db
      .insert(usersTable)
      .values({
        email: cleanEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: cleanUsername,
        passwordHash,
        emailVerified: false,
        approved: true,
        agreeToTerms: true,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        referralCode,
      })
      .returning();

    req.log.info({ ...diagBase, event: "AUTH_REGISTER_USER_CREATED", emailMasked, status: 201, durationMs: Date.now() - t0 }, "auth diagnostic");

    sendWelcomeEmail(user.email!, user.firstName).catch(() => {});

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        approved: user.approved,
        role: user.role as "user" | "tester" | "admin",
      },
      access_token: "",
    };
    const sid = await createSession(sessionData);

    // Track whether the HTTP response actually reaches the client
    let responseFinished = false;
    res.on("finish", () => {
      responseFinished = true;
      req.log.info({ ...diagBase, event: "AUTH_REGISTER_RESPONSE_SENT", emailMasked, status: 201, durationMs: Date.now() - t0 }, "auth diagnostic");
    });
    res.on("close", () => {
      if (!responseFinished) {
        req.log.warn({ ...diagBase, event: "AUTH_REGISTER_RESPONSE_ABORTED_OR_FAILED", emailMasked, durationMs: Date.now() - t0 }, "auth diagnostic");
      }
    });

    res.status(201).json({
      token: sid,
      user: { id: user.id, firstName: user.firstName, username: user.username },
    });
    }, req.log, "POST /auth/register");
  } catch (err) {
    req.log.error({ ...diagBase, err, event: "AUTH_REGISTER_ERROR", durationMs: Date.now() - t0 }, "POST /api/auth/register error");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ─── POST /auth/login-email ───────────────────────────────────────────────────
router.post("/auth/login-email", async (req: Request, res: Response) => {
  const reqId = genReqId();
  const t0 = Date.now();
  const diagBase = {
    reqId,
    ts: new Date(t0).toISOString(),
    origin: (req.headers["origin"] as string | undefined) ?? req.headers["host"] ?? "unknown",
    ua: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"].slice(0, 150) : "unknown",
  };

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailMasked = maskEmail(cleanEmail);

  try {
    await withDbRetry(async () => {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, cleanEmail))
      .limit(1);

    if (!user) {
      req.log.warn({ ...diagBase, event: "AUTH_LOGIN_USER_NOT_FOUND", emailMasked, hasPasswordHash: false, status: 401, durationMs: Date.now() - t0 }, "auth diagnostic");
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    if (!user.passwordHash) {
      req.log.warn({ ...diagBase, event: "AUTH_LOGIN_NO_PASSWORD_HASH", emailMasked, hasPasswordHash: false, status: 401, durationMs: Date.now() - t0 }, "auth diagnostic");
      res.status(401).json({
        error: "This account does not have an email password set up yet. Try the sign-in method you originally used, or choose Forgot Password to create one.",
        error_code: "NO_PASSWORD",
      });
      return;
    }

    // Account lockout check — must pass before attempting password verify
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      req.log.warn({ ...diagBase, event: "AUTH_LOGIN_LOCKED", emailMasked, lockedUntilIso: user.lockedUntil.toISOString(), minutesLeft, status: 423, durationMs: Date.now() - t0 }, "auth diagnostic");
      void logAuthEvent(user.id, "AUTH_LOCKED_ATTEMPT", req.ip ?? null, diagBase.ua);
      res.status(423).json({
        error: `Too many failed attempts. Your account is locked for ${minutesLeft} more minute${minutesLeft !== 1 ? "s" : ""}. Use "Forgot password?" to unlock immediately.`,
        locked_until: user.lockedUntil!.toISOString(),
      });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const newCount = (user.failedLoginAttempts ?? 0) + 1;
      let lockedUntil: Date | null = null;
      if (newCount >= 20) {
        lockedUntil = new Date(Date.now() + 60 * 60 * 1000);
      } else if (newCount >= 10) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await db.update(usersTable).set({
        failedLoginAttempts: newCount,
        ...(lockedUntil !== null ? { lockedUntil } : {}),
      }).where(eq(usersTable.id, user.id));
      const lockEvent = lockedUntil ? "AUTH_LOCKOUT_TRIGGERED" : "AUTH_LOGIN_FAILURE";
      void logAuthEvent(user.id, lockEvent, req.ip ?? null, diagBase.ua, { failedAttempts: newCount });
      req.log.warn({ ...diagBase, event: "AUTH_LOGIN_PASSWORD_MISMATCH", emailMasked, hasPasswordHash: true, failedAttempts: newCount, locked: !!lockedUntil, status: 401, durationMs: Date.now() - t0 }, "auth diagnostic");
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Successful authentication — reset lockout counters
    await db.update(usersTable).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(usersTable.id, user.id));
    void logAuthEvent(user.id, "AUTH_LOGIN_SUCCESS", req.ip ?? null, diagBase.ua);

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        approved: user.approved,
        role: user.role as "user" | "tester" | "admin",
      },
      access_token: "",
    };
    const sid = await createSession(sessionData);
    req.log.info({ ...diagBase, event: "AUTH_LOGIN_SUCCESS", emailMasked, hasPasswordHash: true, status: 200, durationMs: Date.now() - t0 }, "auth diagnostic");
    res.json({ token: sid });
    }, req.log, "POST /auth/login-email");
  } catch (err) {
    const pool = getPoolStats();
    req.log.error({ ...diagBase, err, event: "AUTH_LOGIN_ERROR", emailMasked, durationMs: Date.now() - t0, pool }, "POST /api/auth/login-email error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ─── POST /auth/logout-all ────────────────────────────────────────────────────
router.post("/auth/logout-all", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (!sid) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const session = await getSession(sid);
  if (!session) {
    res.status(401).json({ error: "Session not found or expired." });
    return;
  }
  try {
    const count = await deleteAllSessionsForUser(session.user.id);
    const ua = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null;
    void logAuthEvent(session.user.id, "LOGOUT_ALL", req.ip ?? null, ua, { sessionsRevoked: count });
    req.log.info({ event: "AUTH_LOGOUT_ALL", userId: session.user.id, sessionsRevoked: count }, "auth diagnostic");
    res.json({ success: true, sessionsRevoked: count });
  } catch (err) {
    req.log.error({ err }, "POST /api/auth/logout-all error");
    res.status(500).json({ error: "Failed to revoke sessions. Please try again." });
  }
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) { res.status(400).json({ error: "Email is required." }); return; }

  try {
    const [user] = await db
      .select({ id: usersTable.id, firstName: usersTable.firstName, email: usersTable.email, passwordHash: usersTable.passwordHash })
      .from(usersTable)
      .where(ilike(usersTable.email, email.trim()))
      .limit(1);

    // Unknown email — return success to prevent enumeration
    if (!user) {
      res.json({ success: true });
      return;
    }
    // Account exists but has no password (Apple/OIDC signup) — still send a reset
    // code so they can SET a password and gain email/password access going forward

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await db
      .update(usersTable)
      .set({ emailVerificationToken: codeHash, emailVerificationExpires: expires })
      .where(eq(usersTable.id, user.id));

    await sendPasswordResetEmail(user.email!, user.firstName, code);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "POST /api/auth/forgot-password error");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
router.post("/auth/reset-password", async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body as { email?: string; code?: string; newPassword?: string };
  if (!email?.trim() || !code?.trim() || !newPassword) {
    res.status(400).json({ error: "Email, code, and new password are required." });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        emailVerificationToken: usersTable.emailVerificationToken,
        emailVerificationExpires: usersTable.emailVerificationExpires,
      })
      .from(usersTable)
      .where(ilike(usersTable.email, email.trim()))
      .limit(1);

    if (!user || !user.emailVerificationToken || !user.emailVerificationExpires) {
      res.status(400).json({ error: "Invalid or expired reset code." });
      return;
    }
    if (new Date() > user.emailVerificationExpires) {
      res.status(400).json({ error: "Reset code has expired. Please request a new one." });
      return;
    }
    const codeHash = crypto.createHash("sha256").update(code.trim()).digest("hex");
    if (codeHash !== user.emailVerificationToken) {
      res.status(400).json({ error: "Incorrect reset code. Please check your email and try again." });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 8);
    await db
      .update(usersTable)
      .set({ passwordHash, emailVerificationToken: null, emailVerificationExpires: null, failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(usersTable.id, user.id));

    const requestId = genReqId();
    // Internal-only diagnostic log — never returned to the client
    req.log.info({
      event: "AUTH_RESET_SUCCESS",
      requestId,
      emailMasked: maskEmail(email.trim()),
      env: process.env.RAILWAY_ENVIRONMENT ?? process.env.NODE_ENV ?? "unknown",
      dbUrlPrefix: (process.env.DATABASE_URL ?? "").slice(0, 20).replace(/:[^@]*@/, ":***@"),
      ts: new Date().toISOString(),
    }, "password reset completed");

    res.json({ success: true, requestId });
  } catch (err) {
    req.log.error({ err }, "POST /api/auth/reset-password error");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ─── POST /auth/apple ─────────────────────────────────────────────────────────
async function verifyAppleToken(
  identityToken: string,
  rawNonce?: string,
): Promise<{ sub: string; email?: string }> {
  const res = await fetch("https://appleid.apple.com/auth/keys");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { keys } = await res.json() as { keys: any[] };

  const [headerB64] = identityToken.split(".");
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString()) as { kid: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jwk = keys.find((k: any) => k.kid === header.kid);
  if (!jwk) throw new Error("No matching Apple public key");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const publicKey = crypto.createPublicKey({ key: jwk as any, format: "jwk" });
  const pem = publicKey.export({ type: "spki", format: "pem" });

  const payload = jwt.verify(identityToken, pem, {
    algorithms: ["RS256"],
    issuer: "https://appleid.apple.com",
    audience: "com.melaninmaps.app",
  }) as { sub: string; email?: string; nonce?: string };

  // If the client sent a nonce, verify that the SHA-256 hash of the raw nonce
  // matches what Apple embedded in the JWT — this closes the replay-attack vector
  // and satisfies Apple's guideline enforcement on iOS 26+.
  if (rawNonce) {
    const expectedHash = crypto.createHash("sha256").update(rawNonce).digest("hex");
    if (payload.nonce !== expectedHash) {
      throw new Error("Apple identity token nonce mismatch");
    }
  }

  return payload;
}

router.post("/auth/apple", async (req: Request, res: Response) => {
  const { identityToken, nonce, appleUserId, email, firstName, lastName, authorizationCode } =
    req.body as { identityToken?: string; nonce?: string; appleUserId?: string; email?: string; firstName?: string; lastName?: string; authorizationCode?: string };

  if (!identityToken) { res.status(400).json({ error: "identityToken is required." }); return; }

  try {
    await withDbRetry(async () => {
    const payload = await verifyAppleToken(identityToken, nonce);
    const sub = payload.sub;
    const verifiedEmail = email || payload.email;

    // Find by appleId first, then by email
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.appleId, sub))
      .limit(1);

    if (!user && verifiedEmail) {
      const [byEmail] = await db
        .select()
        .from(usersTable)
        .where(ilike(usersTable.email, verifiedEmail))
        .limit(1);
      if (byEmail) {
        await db.update(usersTable).set({ appleId: sub }).where(eq(usersTable.id, byEmail.id));
        user = { ...byEmail, appleId: sub };
      }
    }

    const isNewUser = !user;

    // ── Authorization-code exchange (required for account-deletion revocation) ─
    // Never log the code, access token, refresh token, or private-key content.
    const APPLE_CLIENT_ID = "com.melaninmaps.app";
    const appleSecretsConfigured = !!(
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY &&
      process.env.APPLE_TOKEN_ENCRYPTION_KEY
    );

    let encryptedRefreshToken: string | null = null;

    if (authorizationCode && appleSecretsConfigured) {
      try {
        const privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
        const clientSecret = generateClientSecret(
          process.env.APPLE_TEAM_ID!,
          process.env.APPLE_KEY_ID!,
          privateKey,
          APPLE_CLIENT_ID,
        );
        const { refreshToken } = await exchangeAuthCode(authorizationCode, APPLE_CLIENT_ID, clientSecret);
        encryptedRefreshToken = encryptToken(refreshToken, process.env.APPLE_TOKEN_ENCRYPTION_KEY!);
        req.log.info({ event: "APPLE_TOKEN_EXCHANGED", isNewUser }, "Apple authorization code exchanged and encrypted");
      } catch (exchErr) {
        // Distinguish network failures from Apple API rejections — never log token values.
        // "appleError=" in the message means fetch() completed and Apple responded (even non-2xx).
        // Its absence means fetch() itself threw before a response was received.
        const msg = exchErr instanceof Error ? exchErr.message : "";
        const isNetworkErr = !msg.includes("appleError=");
        const baseEvent = isNetworkErr
          ? "APPLE_TOKEN_EXCHANGE_NETWORK_ERROR"
          : "APPLE_TOKEN_EXCHANGE_APPLE_REJECTED";

        // Extract Apple's sanitized error category — allowlisted so only known Apple error
        // codes reach logs. Any unexpected value is recorded as "unknown".
        const KNOWN_APPLE_ERRORS = new Set([
          "invalid_client", "invalid_grant", "invalid_request",
          "invalid_scope", "unauthorized_client", "unsupported_grant_type", "access_denied",
        ]);
        const httpMatch = msg.match(/HTTP (\d+)/);
        const errMatch  = msg.match(/appleError=(\S+)/);
        const appleHttpStatus = httpMatch ? parseInt(httpMatch[1], 10) : null;
        const rawErrCode      = errMatch  ? errMatch[1]               : "unknown";
        const appleErrorCode  = KNOWN_APPLE_ERRORS.has(rawErrCode) ? rawErrCode : "unknown";

        if (isNewUser) {
          req.log.warn({ event: baseEvent, appleHttpStatus, appleErrorCode },
            "Apple token exchange failed — blocking new account creation");
          res.status(401).json({ error: "Apple authorization could not be verified. Please try Sign in with Apple again." });
          return;
        }
        req.log.warn({ event: baseEvent, appleHttpStatus, appleErrorCode },
          "Apple token exchange failed for existing user — sign-in continues without token refresh");
      }
    } else if (isNewUser && !authorizationCode) {
      req.log.warn({ event: "APPLE_TOKEN_EXCHANGE_LEGACY_NO_CODE" }, "New Apple account without authorization code — old app build, blocking creation");
      res.status(400).json({ error: "Sign in with Apple requires an authorization code. Please try again." });
      return;
    } else if (isNewUser && !appleSecretsConfigured) {
      req.log.error({ event: "APPLE_TOKEN_EXCHANGE_CONFIGURATION_ERROR" }, "Apple credentials not configured — cannot create new account");
      res.status(500).json({ error: "Apple Sign-In is temporarily unavailable. Please try again later." });
      return;
    } else if (!authorizationCode) {
      // Existing user, old app build — sign-in allowed, token not updated
      req.log.info({ event: "APPLE_TOKEN_EXCHANGE_LEGACY_NO_CODE" }, "Existing user sign-in without authorization code — legacy app version");
    } else {
      // Existing user, secrets not configured — sign-in allowed, token not stored
      req.log.warn({ event: "APPLE_TOKEN_EXCHANGE_CONFIGURATION_ERROR" }, "Apple credentials not configured — existing user sign-in continues without token storage");
    }

    if (!user) {
      const cleanFirst = firstName?.trim() || "Apple";
      const cleanLast = lastName?.trim() || "User";
      const baseUsername = `${cleanFirst}${cleanLast}`.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "user";
      const uniqueUsername = `${baseUsername}${String(Math.floor(Math.random() * 9000 + 1000))}`;

      const [created] = await db
        .insert(usersTable)
        .values({
          firstName: cleanFirst,
          lastName: cleanLast,
          email: verifiedEmail ?? `apple_${sub}@melaninmaps.internal`,
          username: uniqueUsername,
          appleId: sub,
          approved: true,
          agreeToTerms: true,
          ...(encryptedRefreshToken ? { appleRefreshToken: encryptedRefreshToken } : {}),
        })
        .returning();
      user = created;
    } else if (encryptedRefreshToken) {
      await db
        .update(usersTable)
        .set({ appleRefreshToken: encryptedRefreshToken })
        .where(eq(usersTable.id, user.id));
    }

    if (!user.approved) {
      res.status(403).json({ error: "Your account is pending approval." });
      return;
    }

    // Clear any lockout state on successful Apple Sign-In
    await db.update(usersTable).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(usersTable.id, user.id));

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        approved: user.approved,
        role: user.role as "user" | "tester" | "admin",
      },
      access_token: "",
    };
    const sid = await createSession(sessionData);
    res.json({ token: sid, profileSetupComplete: user.profileSetupComplete ?? false });
    }, req.log, "POST /auth/apple");
  } catch (err) {
    req.log.error({ err }, "POST /api/auth/apple error");
    res.status(500).json({ error: "Apple Sign-In failed. Please try again." });
  }
});

// ─── PATCH /auth/user/setup ───────────────────────────────────────────────────
router.patch("/auth/user/setup", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user!.id;
    const {
      homeCity,
      isBusinessOwner,
      isContentCreator,
      isCommunityOrganizer,
      allowDm,
      showCity,
      profileSetupComplete,
    } = req.body as {
      homeCity?: string;
      isBusinessOwner?: boolean;
      isContentCreator?: boolean;
      isCommunityOrganizer?: boolean;
      allowDm?: boolean;
      showCity?: boolean;
      profileSetupComplete?: boolean;
    };

    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (homeCity !== undefined) updates.homeCity = homeCity.trim() || null;
    if (isBusinessOwner !== undefined) updates.isBusinessOwner = isBusinessOwner;
    if (isContentCreator !== undefined) updates.isContentCreator = isContentCreator;
    if (isCommunityOrganizer !== undefined) updates.isCommunityOrganizer = isCommunityOrganizer;
    if (allowDm !== undefined) updates.allowDm = allowDm;
    if (showCity !== undefined) updates.showCity = showCity;
    if (profileSetupComplete !== undefined) updates.profileSetupComplete = profileSetupComplete;

    await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "PATCH /api/auth/user/setup error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/unsubscribe", async (req: Request, res: Response) => {
  const { email, token } = req.body as { email?: string; token?: string };
  if (!email?.trim() || !token) {
    res.status(400).json({ error: "email and token are required." });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const expected = generateUnsubscribeToken(normalizedEmail);
  if (token !== expected) {
    res.status(400).json({ error: "Invalid or expired unsubscribe link." });
    return;
  }
  try {
    await db.update(usersTable).set({ marketingOptOut: true }).where(eq(usersTable.email, normalizedEmail));
    res.json({ success: true, message: "You have been unsubscribed from marketing emails." });
  } catch (err) {
    req.log.error({ err }, "POST /api/auth/unsubscribe error");
    res.status(500).json({ error: "Failed to process unsubscribe request." });
  }
});

export default router;
