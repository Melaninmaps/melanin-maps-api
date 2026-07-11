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
import { db, usersTable } from "@workspace/db";

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
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  ISSUER_URL,
  type SessionData,
} from "../lib/auth";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../lib/email";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;

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
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    res.json({ available: !existing });
  } catch (err) {
    req.log.error({ err }, "GET /api/auth/check-username error");
    res.status(500).json({ available: false, error: "Could not check username" });
  }
});

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post("/auth/register", async (req: Request, res: Response) => {
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

  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      res.status(400).json({ error: "Invalid date of birth." });
      return;
    }
    const ageYears = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageYears < 13) {
      res.status(400).json({ error: "You must be at least 13 years old to use this platform." });
      return;
    }
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // Run email, username checks and password hash in parallel — no sequential waiting
    const [existingEmail, existingUsername, passwordHash] = await Promise.all([
      db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, cleanEmail)).limit(1).then(r => r[0]),
      db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, cleanUsername)).limit(1).then(r => r[0]),
      bcrypt.hash(password, 10),
    ]);

    if (existingEmail) {
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

    res.status(201).json({
      token: sid,
      user: { id: user.id, firstName: user.firstName, username: user.username },
    });
  } catch (err) {
    req.log.error({ err }, "POST /api/auth/register error");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ─── POST /auth/login-email ───────────────────────────────────────────────────
router.post("/auth/login-email", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    if (!user.passwordHash) {
      res.status(401).json({ error: "This account was created with Apple or social sign-in and doesn't have a password yet. Use 'Forgot password?' to set one, or sign in with Apple." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

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
    res.json({ token: sid });
  } catch (err) {
    req.log.error({ err }, "POST /api/auth/login-email error");
    res.status(500).json({ error: "Login failed. Please try again." });
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

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(usersTable)
      .set({ passwordHash, emailVerificationToken: null, emailVerificationExpires: null })
      .where(eq(usersTable.id, user.id));

    res.json({ success: true });
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
  const { identityToken, nonce, appleUserId, email, firstName, lastName } =
    req.body as { identityToken?: string; nonce?: string; appleUserId?: string; email?: string; firstName?: string; lastName?: string };

  if (!identityToken) { res.status(400).json({ error: "identityToken is required." }); return; }

  try {
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
        })
        .returning();
      user = created;
    }

    if (!user.approved) {
      res.status(403).json({ error: "Your account is pending approval." });
      return;
    }

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
    res.json({ token: sid });
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

export default router;
