import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { storage } from "../storage";

const router: IRouter = Router();

const MAX_REFERRALS = 20;

function generateCode(userId: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seed = userId.replace(/-/g, "").slice(0, 8);
  let code = "MWM";
  for (let i = 0; i < 6; i++) {
    const idx = parseInt(seed[i] ?? "0", 16) % chars.length;
    code += chars[idx];
  }
  return code;
}

router.get("/referrals/my-code", async (req: any, res): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const user = await storage.getUser(req.user.id);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    if (user.referralCode) {
      res.json({
        referralCode: user.referralCode,
        referralCount: user.referralCount ?? 0,
        maxReferrals: user.memberType === "business_referral" ? MAX_REFERRALS : null,
        referralUrl: `https://mappingwithmelanin.com/r/${user.referralCode}`,
      });
      return;
    }

    const code = generateCode(user.id);
    const [updated] = await db
      .update(usersTable)
      .set({ referralCode: code })
      .where(eq(usersTable.id, user.id))
      .returning();

    res.json({
      referralCode: updated.referralCode,
      referralCount: updated.referralCount ?? 0,
      maxReferrals: updated.memberType === "business_referral" ? MAX_REFERRALS : null,
      referralUrl: `https://mappingwithmelanin.com/r/${updated.referralCode}`,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to get/generate referral code");
    res.status(500).json({ error: "Failed to get referral code" });
  }
});

router.get("/referrals/check-code/:code", async (req: any, res): Promise<void> => {
  const code = (req.params.code ?? "").toUpperCase().replace(/\s/g, "");
  if (!/^[A-Z0-9]{4,20}$/.test(code)) {
    res.json({ available: false, reason: "Code must be 4–20 letters and numbers only." });
    return;
  }
  try {
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.referralCode, code)).limit(1);
    const isOwn = req.user?.id && existing?.id === req.user.id;
    res.json({ available: !existing || isOwn });
  } catch (err: any) {
    req.log.error({ err }, "Failed to check referral code");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/referrals/my-code", async (req: any, res): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "code is required" }); return; }
  const clean = code.toUpperCase().replace(/\s/g, "");
  if (!/^[A-Z0-9]{4,20}$/.test(clean)) {
    res.status(400).json({ error: "Code must be 4–20 letters and numbers only." });
    return;
  }
  try {
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.referralCode, clean)).limit(1);
    if (existing && existing.id !== req.user.id) {
      res.status(409).json({ error: "That code is already taken. Try a different one." });
      return;
    }
    const [updated] = await db
      .update(usersTable)
      .set({ referralCode: clean })
      .where(eq(usersTable.id, req.user.id))
      .returning();
    res.json({
      referralCode: updated.referralCode,
      referralCount: updated.referralCount ?? 0,
      referralUrl: `https://mappingwithmelanin.com/r/${updated.referralCode}`,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to set custom referral code");
    res.status(500).json({ error: "Failed to update referral code" });
  }
});

router.post("/referrals/track", async (req: any, res): Promise<void> => {
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "code is required" }); return; }

  try {
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

    if (req.user?.id && req.user.id !== referrer.id) {
      await db
        .update(usersTable)
        .set({ referredByCode: code.toUpperCase() })
        .where(eq(usersTable.id, req.user.id));
    }

    res.json({ ok: true, referrerId: referrer.id });
  } catch (err: any) {
    req.log.error({ err }, "Failed to track referral");
    res.status(500).json({ error: "Failed to track referral" });
  }
});

router.get("/referrals/preview/:code", async (req, res): Promise<void> => {
  const code = req.params.code?.toUpperCase();
  try {
    const [referrer] = await db
      .select({ firstName: usersTable.firstName, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.referralCode, code))
      .limit(1);

    if (!referrer) { res.status(404).json({ error: "Referral code not found" }); return; }

    res.json({
      firstName: referrer.firstName ?? "A friend",
      memberSince: referrer.createdAt ? new Date(referrer.createdAt).getFullYear().toString() : null,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to preview referral");
    res.status(500).json({ error: "Failed to look up referral" });
  }
});

router.get("/r/:code", async (req, res): Promise<void> => {
  const code = req.params.code?.toUpperCase();
  try {
    const [referrer] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.referralCode, code))
      .limit(1);

    if (referrer) {
      await db
        .update(usersTable)
        .set({ referralCount: sql`${usersTable.referralCount} + 1` })
        .where(eq(usersTable.id, referrer.id));
    }
    res.redirect(`/membership?ref=${code}`);
  } catch {
    res.redirect("/membership");
  }
});

export default router;
