import { Router, type IRouter, type Request, type Response } from "express";
import { db, waitlistTable } from "@workspace/db";
import { count, desc, eq, isNotNull } from "drizzle-orm";
import { waitlistLimiter } from "../middleware/rateLimiter";
import { sendWaitlistConfirmation } from "../lib/email";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

// ── Public: join waitlist ────────────────────────────────────────────────────

router.post("/waitlist", waitlistLimiter, async (req: Request, res: Response) => {
  try {
    const { email, firstName, city, state, isBusinessOwner, referralCode, referredBy } = req.body as {
      email?: string;
      firstName?: string;
      city?: string;
      state?: string;
      isBusinessOwner?: boolean;
      referralCode?: string;
      referredBy?: string;
    };

    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const code = referralCode ?? email.replace(/[@.]/g, "").toUpperCase().slice(0, 8);

    await db
      .insert(waitlistTable)
      .values({
        email: email.toLowerCase().trim(),
        firstName: firstName?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim().toUpperCase() || null,
        isBusinessOwner: Boolean(isBusinessOwner),
        referralCode: code,
        referredBy: referredBy ?? null,
        status: "pending",
      })
      .onConflictDoNothing();

    const [{ total }] = await db.select({ total: count() }).from(waitlistTable);
    const position = Number(total);

    sendWaitlistConfirmation(email.toLowerCase().trim(), position, code, firstName?.trim() || "there").catch(() => {});

    res.status(201).json({ success: true, position, referralCode: code });
  } catch (err) {
    req.log.error({ err }, "Failed to join waitlist");
    res.status(500).json({ error: "Failed to join waitlist" });
  }
});

router.get("/waitlist/count", async (_req: Request, res: Response) => {
  try {
    const [{ total }] = await db.select({ total: count() }).from(waitlistTable);
    const cityRows = await db
      .select({ city: waitlistTable.city, total: count() })
      .from(waitlistTable)
      .where(isNotNull(waitlistTable.city))
      .groupBy(waitlistTable.city)
      .orderBy(desc(count()))
      .limit(8);
    const cities = cityRows
      .filter(r => r.city)
      .map(r => ({ city: r.city as string, count: Number(r.total) }));
    res.json({ count: Number(total), cities });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch count" });
  }
});

router.get("/waitlist/my-entry", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const user = req.user as { email?: string };
    if (!user.email) { res.json({ entry: null }); return; }

    const [entry] = await db
      .select()
      .from(waitlistTable)
      .where(eq(waitlistTable.email, user.email.toLowerCase()))
      .limit(1);

    if (!entry) { res.json({ entry: null }); return; }

    const [{ referrals }] = await db
      .select({ referrals: count() })
      .from(waitlistTable)
      .where(eq(waitlistTable.referredBy, entry.referralCode ?? ""));

    res.json({ entry: { ...entry, referralCount: Number(referrals) } });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user waitlist entry");
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

router.get("/waitlist/referral-stats/:code", async (req: Request, res: Response) => {
  const code = String(req.params.code).toUpperCase();
  try {
    const [{ referrals }] = await db
      .select({ referrals: count() })
      .from(waitlistTable)
      .where(eq(waitlistTable.referredBy, code));
    res.json({ code, referrals: Number(referrals) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch referral stats");
    res.status(500).json({ error: "Failed to fetch referral stats" });
  }
});

// ── Admin: list waitlist entries ─────────────────────────────────────────────

router.get("/admin/waitlist", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const entries = await db
      .select()
      .from(waitlistTable)
      .orderBy(desc(waitlistTable.createdAt));
    const [{ pending }] = await db
      .select({ pending: count() })
      .from(waitlistTable)
      .where(eq(waitlistTable.status, "pending"));
    res.json({ entries, pendingCount: Number(pending) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch waitlist");
    res.status(500).json({ error: "Failed to fetch waitlist" });
  }
});

// ── Admin: approve / reject a waitlist entry ─────────────────────────────────

router.patch("/admin/waitlist/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const id = String(req.params.id);
  const { status, notes } = req.body as { status?: string; notes?: string };
  const allowed = ["pending", "approved", "rejected"];
  if (status && !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  try {
    const updates: Record<string, unknown> = {};
    if (status) {
      updates.status = status;
      updates.approvedAt = status === "approved" ? new Date() : null;
    }
    if (notes !== undefined) updates.notes = notes;
    const [updated] = await db
      .update(waitlistTable)
      .set(updates)
      .where(eq(waitlistTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    res.json({ entry: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update waitlist entry");
    res.status(500).json({ error: "Failed to update entry" });
  }
});

// ── Admin: check admin status + config ───────────────────────────────────────

router.get("/admin/check", (req: Request, res: Response) => {
  res.json({
    isAdmin: isAdmin(req),
    requireApproval: process.env.REQUIRE_APPROVAL === "true",
  });
});

export default router;
