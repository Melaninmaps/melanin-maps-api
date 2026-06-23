import { Router, type IRouter, type Request, type Response } from "express";
import { db, waitlistTable } from "@workspace/db";
import { count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { waitlistLimiter } from "../middleware/rateLimiter";
import { sendWaitlistConfirmation, sendWelcomeEmail } from "../lib/email";

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
    const { email, firstName, lastName, city, state, isBusinessOwner, referralCode, referredBy } = req.body as {
      email?: string;
      firstName?: string;
      lastName?: string;
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
        lastName: lastName?.trim() || null,
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

    const cleanEmail = email.toLowerCase().trim();
    const cleanFirst = firstName?.trim() || null;
    const cleanLast = lastName?.trim() || null;
    sendWaitlistConfirmation(cleanEmail, position, code, cleanFirst ?? "there", cleanLast ?? undefined)
      .then(() => db.update(waitlistTable).set({ welcomeEmailSent: true }).where(eq(waitlistTable.referralCode, code)))
      .catch((err: unknown) => req.log.error({ err }, "Failed to send waitlist confirmation email"));
    sendWelcomeEmail(cleanEmail, cleanFirst)
      .catch((err: unknown) => req.log.error({ err }, "Failed to send welcome email"));

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

// ── Admin: export waitlist as CSV ────────────────────────────────────────────

router.get("/admin/waitlist/export", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const entries = await db.select().from(waitlistTable).orderBy(desc(waitlistTable.createdAt));
    const header = ["ID","First Name","Email","City","State","Business Owner","Status","Referral Code","Referred By","Approved At","Signed Up"];
    const rows = entries.map(e => [
      e.id, e.firstName ?? "", e.email, e.city ?? "", e.state ?? "",
      e.isBusinessOwner ? "Yes" : "No", e.status,
      e.referralCode ?? "", e.referredBy ?? "",
      e.approvedAt ? new Date(e.approvedAt).toISOString() : "",
      new Date(e.createdAt).toISOString(),
    ]);
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
    const filename = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "Failed to export waitlist");
    res.status(500).json({ error: "Failed to export waitlist" });
  }
});

// ── Admin: bulk update waitlist entries ──────────────────────────────────────

router.post("/admin/waitlist/bulk", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { ids, status } = req.body as { ids?: string[]; status?: string };
  const allowed = ["pending", "approved", "rejected"];
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "ids must be a non-empty array" }); return;
  }
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  try {
    const { inArray } = await import("drizzle-orm");
    await db.update(waitlistTable)
      .set({ status, approvedAt: status === "approved" ? new Date() : null })
      .where(inArray(waitlistTable.id, ids));
    res.json({ updated: ids.length });
  } catch (err) {
    req.log.error({ err }, "Failed to bulk update waitlist");
    res.status(500).json({ error: "Failed to bulk update" });
  }
});

// ── Admin: send weekly nudge to all pending waitlist members ─────────────────

router.post("/admin/send-weekly-nudge", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { sendReferralNudge } = await import("../lib/email");

    const [{ total }] = await db.select({ total: count() }).from(waitlistTable);
    const totalCount = Number(total);

    const [{ newThisWeek }] = await db
      .select({ newThisWeek: count() })
      .from(waitlistTable)
      .where(eq(waitlistTable.status, "pending"));

    const pendingMembers = await db
      .select({ email: waitlistTable.email, firstName: waitlistTable.firstName, referralCode: waitlistTable.referralCode })
      .from(waitlistTable)
      .where(eq(waitlistTable.status, "pending"))
      .orderBy(waitlistTable.createdAt);

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < pendingMembers.length; i++) {
      const m = pendingMembers[i];
      if (!m.email || !m.referralCode) continue;
      try {
        await sendReferralNudge(
          m.email,
          m.firstName ?? "there",
          i + 1,
          m.referralCode,
          Number(newThisWeek),
        );
        sent++;
      } catch {
        failed++;
      }
    }

    res.json({ sent, failed, total: totalCount, nudgedCount: pendingMembers.length });
  } catch (err) {
    req.log.error({ err }, "Failed to send weekly nudge");
    res.status(500).json({ error: "Failed to send weekly nudge" });
  }
});

// ── Admin: send nudge email preview to self ───────────────────────────────────

router.post("/admin/nudge-preview", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const user = req.user as { email?: string; firstName?: string } | undefined;
  if (!user?.email) { res.status(400).json({ error: "No admin email found" }); return; }
  try {
    const [{ total }] = await db.select({ total: count() }).from(waitlistTable);
    const topReferrers = await db
      .select({ email: waitlistTable.email, firstName: waitlistTable.firstName, referralCode: waitlistTable.referralCode, referrals: count() })
      .from(waitlistTable)
      .where(isNotNull(waitlistTable.referralCode))
      .groupBy(waitlistTable.email, waitlistTable.firstName, waitlistTable.referralCode)
      .orderBy(desc(count()))
      .limit(5);

    const { sendWaitlistConfirmation } = await import("../lib/email");
    const sampleCode = topReferrers[0]?.referralCode ?? "PREVIEW1";
    const sampleName = topReferrers[0]?.firstName ?? user.firstName ?? "Admin";
    await sendWaitlistConfirmation(user.email, Number(total), sampleCode, sampleName);

    res.json({
      sent: true,
      to: user.email,
      waitlistTotal: Number(total),
      topReferrers: topReferrers.map(r => ({ email: r.email, referrals: Number(r.referrals) })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to send nudge preview");
    res.status(500).json({ error: "Failed to send preview" });
  }
});

// ── Admin: send welcome email blast to all who haven't received one ───────────

router.post("/admin/send-welcome-blast", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { eq: drizzleEq } = await import("drizzle-orm");
    const unsent = await db
      .select()
      .from(waitlistTable)
      .where(drizzleEq(waitlistTable.welcomeEmailSent, false))
      .orderBy(waitlistTable.createdAt);

    const totalOnList = await db.select({ total: count() }).from(waitlistTable);
    const totalCount = Number(totalOnList[0].total);

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < unsent.length; i++) {
      const entry = unsent[i];
      if (!entry.email || !entry.referralCode) { failed++; continue; }
      const position = i + 1;
      try {
        await sendWaitlistConfirmation(
          entry.email,
          position,
          entry.referralCode,
          entry.firstName ?? "there",
        );
        await db.update(waitlistTable)
          .set({ welcomeEmailSent: true })
          .where(drizzleEq(waitlistTable.id, entry.id));
        sent++;
        // Respect Resend rate limits — 2 emails/sec max
        if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));
      } catch {
        failed++;
      }
    }

    res.json({ sent, failed, skipped: totalCount - unsent.length, total: totalCount });
  } catch (err) {
    req.log.error({ err }, "Failed to send welcome blast");
    res.status(500).json({ error: "Failed to send welcome blast" });
  }
});

// ── Admin: force-send waitlist confirmation to specific emails ────────────────
router.post("/admin/send-welcome-to", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { emails } = req.body as { emails: string[] };
    if (!Array.isArray(emails) || emails.length === 0) {
      res.status(400).json({ error: "emails array required" }); return;
    }

    const { eq: drizzleEq } = await import("drizzle-orm");

    // Load all entries ordered by signup date so position = index + 1
    const allEntries = await db.select().from(waitlistTable).orderBy(waitlistTable.createdAt);

    const results: { email: string; status: "sent" | "not_found" | "no_code" | "failed" }[] = [];

    for (const rawEmail of emails) {
      const email = rawEmail.trim().toLowerCase();
      const idx = allEntries.findIndex(e => (e.email ?? "").toLowerCase() === email);

      if (idx === -1) { results.push({ email, status: "not_found" }); continue; }

      const entry = allEntries[idx];
      if (!entry.referralCode) { results.push({ email, status: "no_code" }); continue; }

      try {
        await sendWaitlistConfirmation(
          entry.email!,
          idx + 1,
          entry.referralCode,
          entry.firstName ?? "there",
        );
        // Mark as sent
        await db.update(waitlistTable).set({ welcomeEmailSent: true }).where(drizzleEq(waitlistTable.id, entry.id));
        results.push({ email, status: "sent" });
      } catch {
        results.push({ email, status: "failed" });
      }
    }

    const sent = results.filter(r => r.status === "sent").length;
    const failed = results.filter(r => r.status === "failed").length;
    const notFound = results.filter(r => r.status === "not_found").length;
    res.json({ sent, failed, notFound, results });
  } catch (err) {
    req.log.error({ err }, "Failed to send targeted welcome emails");
    res.status(500).json({ error: "Failed to send targeted welcome emails" });
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
