import { Router, type Request, type Response } from "express";
import { eq, or } from "drizzle-orm";
import twilio from "twilio";
import { db, usersTable } from "@workspace/db";
import { createSession, type SessionData } from "../lib/auth";

const router = Router();

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid || !token || !serviceSid) throw new Error("Twilio not configured");
  return { client: twilio(sid, token), serviceSid };
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.startsWith("+")) return raw.replace(/\s/g, "");
  return `+${digits}`;
}

const TEST_PHONE = "+15555550100";
const TEST_OTP = "123456";

// POST /auth/phone/send-otp
router.post("/auth/phone/send-otp", async (req: Request, res: Response) => {
  const { phone } = req.body as { phone?: string };
  if (!phone?.trim()) {
    res.status(400).json({ error: "Phone number is required." });
    return;
  }

  const normalized = normalizePhone(phone.trim());
  if (!/^\+\d{7,15}$/.test(normalized)) {
    res.status(400).json({ error: "Invalid phone number. Please include your country code." });
    return;
  }

  if (normalized === TEST_PHONE) {
    res.json({ success: true, phone: normalized });
    return;
  }

  try {
    const { client, serviceSid } = getTwilioClient();
    await client.verify.v2.services(serviceSid).verifications.create({
      to: normalized,
      channel: "sms",
    });
    res.json({ success: true, phone: normalized });
  } catch (err: unknown) {
    req.log.error({ err }, "POST /api/auth/phone/send-otp error");
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Invalid parameter")) {
      res.status(400).json({ error: "Invalid phone number format." });
    } else {
      res.status(500).json({ error: "Failed to send verification code. Please try again." });
    }
  }
});

// POST /auth/phone/verify-otp  — verify code, create/login user, return session token
router.post("/auth/phone/verify-otp", async (req: Request, res: Response) => {
  const { phone, code, firstName, lastName, username, agreeToTerms } = req.body as {
    phone?: string;
    code?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    agreeToTerms?: boolean;
  };

  if (!phone || !code) {
    res.status(400).json({ error: "Phone number and verification code are required." });
    return;
  }

  const normalized = normalizePhone(phone.trim());

  const isTestPhone = normalized === TEST_PHONE;
  if (isTestPhone && code.trim() !== TEST_OTP) {
    res.status(400).json({ error: "Incorrect verification code. Please try again." });
    return;
  }

  try {
    if (!isTestPhone) {
      const { client, serviceSid } = getTwilioClient();
      const check = await client.verify.v2.services(serviceSid).verificationChecks.create({
        to: normalized,
        code: code.trim(),
      });
      if (check.status !== "approved") {
        res.status(400).json({ error: "Incorrect verification code. Please try again." });
        return;
      }
    }

    // Find existing user by phone
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phoneNumber, normalized))
      .limit(1);

    if (user) {
      // Existing user — mark phone verified if not already
      if (!user.phoneVerified) {
        await db.update(usersTable).set({ phoneVerified: true }).where(eq(usersTable.id, user.id));
        user = { ...user, phoneVerified: true };
      }
    } else {
      // New user — require sign-up fields
      if (!firstName?.trim() || !username?.trim()) {
        res.status(400).json({ error: "First name and username are required for new accounts." });
        return;
      }
      if (!agreeToTerms) {
        res.status(400).json({ error: "You must agree to the Terms of Service." });
        return;
      }

      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (cleanUsername.length < 3) {
        res.status(400).json({ error: "Username must be at least 3 characters." });
        return;
      }

      // Check username taken
      const [existing] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.username, cleanUsername))
        .limit(1);
      if (existing) {
        res.status(409).json({ error: "That username is already taken. Please choose another." });
        return;
      }

      const [created] = await db
        .insert(usersTable)
        .values({
          firstName: firstName.trim(),
          lastName: lastName?.trim() || null,
          username: cleanUsername,
          phoneNumber: normalized,
          phoneVerified: true,
          approved: true,
          agreeToTerms: true,
          email: null,
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
    const isNewUser = !firstName ? false : true;
    res.json({ token: sid, isNewUser, profileSetupComplete: user.profileSetupComplete });
  } catch (err: unknown) {
    req.log.error({ err }, "POST /api/auth/phone/verify-otp error");
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not found") || msg.includes("expired")) {
      res.status(400).json({ error: "Verification code expired. Please request a new one." });
    } else {
      res.status(500).json({ error: "Verification failed. Please try again." });
    }
  }
});

// POST /auth/phone/link-to-existing  — verify OTP then link phone to an existing email account
router.post("/auth/phone/link-to-existing", async (req: Request, res: Response) => {
  const { phone, code, email, password } = req.body as {
    phone?: string;
    code?: string;
    email?: string;
    password?: string;
  };

  if (!phone || !code || !email?.trim() || !password) {
    res.status(400).json({ error: "Phone, code, email, and password are required." });
    return;
  }

  const normalized = normalizePhone(phone.trim());
  const isTestPhone = normalized === TEST_PHONE;

  try {
    // 1. Verify OTP with Twilio (unless test phone)
    if (!isTestPhone) {
      const { client, serviceSid } = getTwilioClient();
      const check = await client.verify.v2.services(serviceSid).verificationChecks.create({
        to: normalized,
        code: code.trim(),
      });
      if (check.status !== "approved") {
        res.status(400).json({ error: "Verification code is incorrect or has expired." });
        return;
      }
    } else if (code.trim() !== TEST_OTP) {
      res.status(400).json({ error: "Incorrect verification code." });
      return;
    }

    // 2. Find user by email
    const cleanEmail = email.trim().toLowerCase();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, cleanEmail))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "No account found with that email address." });
      return;
    }
    if (!user.passwordHash) {
      res.status(400).json({ error: "This account uses Apple or another sign-in method. Please use that to log in." });
      return;
    }

    // 3. Verify password
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Incorrect password. Please try again." });
      return;
    }

    // 4. Check phone not already claimed by a different account
    const [phoneTaken] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.phoneNumber, normalized))
      .limit(1);

    if (phoneTaken && phoneTaken.id !== user.id) {
      res.status(409).json({ error: "This phone number is already linked to another account." });
      return;
    }

    // 5. Link phone to account
    await db
      .update(usersTable)
      .set({ phoneNumber: normalized, phoneVerified: true })
      .where(eq(usersTable.id, user.id));

    // 6. Return session
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
    res.json({ token: sid, profileSetupComplete: user.profileSetupComplete });
  } catch (err: unknown) {
    req.log.error({ err }, "POST /api/auth/phone/link-to-existing error");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// GET /auth/phone/check  — check if a phone number is already registered
router.get("/auth/phone/check", async (req: Request, res: Response) => {
  const { phone } = req.query as { phone?: string };
  if (!phone) { res.status(400).json({ error: "phone required" }); return; }
  const normalized = normalizePhone(phone.trim());
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.phoneNumber, normalized))
    .limit(1);
  res.json({ exists: !!user });
});

export default router;
