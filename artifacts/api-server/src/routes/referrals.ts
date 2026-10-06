import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { storage } from "../storage";
import {
  checkReferralCodeAvailability,
  getOrCreateMemberReferralProfile,
  ReferralCodeUnavailableError,
  ReferralCodeValidationError,
  setMemberReferralCode,
  normalizeReferralCodeForLookup,
} from "../lib/waitlistReferralLedger";

const router: IRouter = Router();
const MAX_REFERRALS = 20;

type AuthenticatedRequest = Request & {
  user?: { id: string };
  log?: { error: (payload: unknown, message?: string) => void };
};

async function memberForRequest(req: AuthenticatedRequest): Promise<{ id: string; email: string } | null> {
  if (!req.user?.id) return null;
  const user = await storage.getUser(req.user.id);
  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}

function sendReferralError(res: Response, error: unknown): void {
  if (error instanceof ReferralCodeValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof ReferralCodeUnavailableError) {
    res.status(409).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: "Referral codes are unavailable right now. Please try again." });
}

/**
 * Returns a member's active referral code and only their aggregate count of
 * confirmed waitlist signups. The endpoint also creates a server-owned default
 * code for existing members who do not yet have one.
 */
router.get("/referrals/my-code", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const member = await memberForRequest(req);
  if (!member) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    res.json(await getOrCreateMemberReferralProfile({ userId: member.id, email: member.email }));
  } catch (error) {
    req.log?.error({ error }, "Failed to get or create waitlist referral code");
    sendReferralError(res, error);
  }
});

/**
 * This is advisory UI feedback only. The subsequent PUT repeats the validation
 * and receives database-enforced uniqueness inside a transaction.
 */
router.get("/referrals/check-code/:code", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const member = await memberForRequest(req);
  if (!member) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const result = await checkReferralCodeAvailability({
      rawCode: req.params.code,
      userId: member.id,
      email: member.email,
    });
    res.json(result);
  } catch (error) {
    req.log?.error({ error }, "Failed to check waitlist referral code");
    res.status(500).json({ error: "Referral code availability is unavailable right now." });
  }
});

/**
 * Replaces the active code only after the ledger transaction succeeds. Previous
 * codes are retained as retired reservations and cannot be reassigned.
 */
router.put("/referrals/my-code", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const member = await memberForRequest(req);
  if (!member) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const profile = await setMemberReferralCode({
      rawCode: (req.body as { code?: unknown }).code,
      userId: member.id,
      email: member.email,
    });
    res.json(profile);
  } catch (error) {
    req.log?.error({ error }, "Failed to set waitlist referral code");
    sendReferralError(res, error);
  }
});

// Legacy member-to-member tracking remains isolated from the waitlist ledger.
// It does not affect the aggregate confirmed waitlist count returned above.
router.post("/referrals/track", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "code is required" }); return; }
  try {
    const [currentUser] = await db
      .select({ referredByCode: usersTable.referredByCode })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);
    if (currentUser?.referredByCode) {
      res.status(409).json({ error: "You have already applied a referral code." });
      return;
    }
    const [referrer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.referralCode, code.toUpperCase()))
      .limit(1);
    if (!referrer) { res.status(404).json({ error: "Referral code not found" }); return; }
    const cap = referrer.memberType === "business_referral" ? MAX_REFERRALS : null;
    if (cap !== null && (referrer.referralCount ?? 0) >= cap) {
      res.status(409).json({ error: "Referral cap reached for this code" });
      return;
    }
    await db
      .update(usersTable)
      .set({ referralCount: sql`${usersTable.referralCount} + 1` })
      .where(eq(usersTable.id, referrer.id));
    if (req.user.id !== referrer.id) {
      await db
        .update(usersTable)
        .set({ referredByCode: code.toUpperCase() })
        .where(eq(usersTable.id, req.user.id));
    }
    res.json({ ok: true, referrerId: referrer.id });
  } catch (error) {
    req.log?.error({ error }, "Failed to track legacy referral");
    res.status(500).json({ error: "Failed to track referral" });
  }
});

// Keep the existing response shape for the referral landing surface. It returns
// only a first name and membership year, never referral counts or identities.
router.get("/referrals/preview/:code", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validation = normalizeReferralCodeForLookup(req.params.code);
  if (!validation.ok) { res.status(404).json({ error: "Referral code not found" }); return; }
  try {
    const result = await pool.query<{ first_name: string | null; created_at: string | Date | null }>(
      `SELECT COALESCE(u.first_name, w.first_name) AS first_name,
              COALESCE(u.created_at, w.created_at) AS created_at
         FROM waitlist_referral_codes code
         LEFT JOIN users u ON u.id = code.owner_user_id
         LEFT JOIN waitlist_signups w ON w.id = code.owner_waitlist_signup_id
        WHERE code.normalized_code = $1
          AND code.status = 'active'
        LIMIT 1`,
      [validation.normalizedCode],
    );
    const referrer = result.rows[0];
    if (!referrer) { res.status(404).json({ error: "Referral code not found" }); return; }
    res.json({
      firstName: referrer.first_name ?? "A friend",
      memberSince: referrer.created_at ? new Date(referrer.created_at).getFullYear().toString() : null,
    });
  } catch (error) {
    req.log?.error({ error }, "Failed to preview waitlist referral");
    res.status(500).json({ error: "Failed to look up referral" });
  }
});

// Retired codes never redirect to a new owner. Active codes preserve the
// existing URL contract but do not count a click as a confirmed referral.
router.get("/r/:code", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validation = normalizeReferralCodeForLookup(req.params.code);
  if (!validation.ok) { res.redirect("/"); return; }
  try {
    const result = await pool.query<{ normalized_code: string }>(
      `SELECT normalized_code
         FROM waitlist_referral_codes
        WHERE normalized_code = $1
          AND status = 'active'
        LIMIT 1`,
      [validation.normalizedCode],
    );
    if (!result.rows[0]) { res.redirect("/"); return; }
    res.redirect(`/?ref=${encodeURIComponent(validation.displayCode)}`);
  } catch {
    res.redirect("/");
  }
});

export default router;
