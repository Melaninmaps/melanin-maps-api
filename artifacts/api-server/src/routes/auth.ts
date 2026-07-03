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
import { sendWelcomeEmail } from "../lib/email";

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
      },
    });
  } catch {
    res.json({ user: req.user });
  }
});

router.get("/login", async (req: Request, res: Response) => {
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
    res.redirect("/api/login");
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
    res.redirect("/api/login");
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
  const config = await getOidcConfig();
  const origin = getOrigin(req);

  const sid = getSessionId(req);
  await clearSession(res, sid);

  const endSessionUrl = oidc.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: origin,
  });

  res.redirect(endSessionUrl.href);
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
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.json(LogoutMobileSessionResponse.parse({ success: true }));
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

    const [existingEmail] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(ilike(usersTable.email, cleanEmail))
      .limit(1);
    if (existingEmail) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const [existingUsername] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, cleanUsername))
      .limit(1);
    if (existingUsername) {
      res.status(409).json({ error: "That username is already taken." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
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
      .where(ilike(usersTable.email, email.trim()))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    if (!user.passwordHash) {
      res.status(401).json({ error: "This account uses Google Sign-In. Please tap 'Continue with Google' to sign in." });
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

export default router;
