import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, waitlistTable, usersTable, businessRecommendationsTable, pointsLedgerTable, businessesTable } from "@workspace/db";
import { and, count, desc, eq, gte, ilike, isNotNull, lt, sql } from "drizzle-orm";
import { waitlistLimiter } from "../middleware/rateLimiter";
import { sendWaitlistConfirmation, sendWelcomeEmail, sendApprovalNotification, sendBusinessRecommendationInvite, sendFriendInvitation, sendBusinessWaitlistInvitation, sendReferralMilestoneUpdate, sendReferralNudge } from "../lib/email";

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
    const { email, firstName, lastName, city, state, isBusinessOwner, websiteUrl, referralCode, referredBy } = req.body as {
      email?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      state?: string;
      isBusinessOwner?: boolean;
      websiteUrl?: string;
      referralCode?: string;
      referredBy?: string;
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    if (isBusinessOwner && !websiteUrl?.trim()) {
      res.status(400).json({ error: "Business owners must provide a website or social media link" });
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
        websiteUrl: websiteUrl?.trim() || null,
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

    // Fire referral milestone update to the referrer when someone joins via their code
    if (referredBy?.trim()) {
      const referrerCode = referredBy.trim().toUpperCase();
      (async () => {
        try {
          const [referrer] = await db
            .select()
            .from(waitlistTable)
            .where(eq(waitlistTable.referralCode, referrerCode))
            .limit(1);
          if (!referrer?.email) return;
          const [{ total: referralCount }] = await db
            .select({ total: count() })
            .from(waitlistTable)
            .where(eq(waitlistTable.referredBy, referrerCode));
          let cityTotal = 0;
          if (referrer.city) {
            const [{ total: ct }] = await db
              .select({ total: count() })
              .from(waitlistTable)
              .where(eq(waitlistTable.city, referrer.city));
            cityTotal = Number(ct);
          }
          await sendReferralMilestoneUpdate(
            referrer.email,
            referrer.firstName,
            Number(referralCount),
            cleanFirst,
            referrer.city,
            cityTotal,
            referrerCode,
          );
        } catch (err) {
          req.log.error({ err }, "Failed to send referral milestone update");
        }
      })();
    }

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

// ── Admin: list waitlist entries (paginated, filterable by status) ────────────

router.get("/admin/waitlist", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(String(req.query.pageSize ?? "50"), 10) || 50));
    const statusFilter = String(req.query.status ?? "");
    const allowed = ["pending", "approved", "rejected"];
    const filterByStatus = allowed.includes(statusFilter) ? statusFilter : null;

    const whereClause = filterByStatus ? eq(waitlistTable.status, filterByStatus) : undefined;
    const offset = (page - 1) * pageSize;

    const [entriesResult, totalResult, pendingResult] = await Promise.all([
      filterByStatus
        ? db.select().from(waitlistTable).where(whereClause!).orderBy(asc(waitlistTable.createdAt)).limit(pageSize).offset(offset)
        : db.select().from(waitlistTable).orderBy(asc(waitlistTable.createdAt)).limit(pageSize).offset(offset),
      filterByStatus
        ? db.select({ total: count() }).from(waitlistTable).where(whereClause!)
        : db.select({ total: count() }).from(waitlistTable),
      db.select({ pending: count() }).from(waitlistTable).where(eq(waitlistTable.status, "pending")),
    ]);

    const total = Number(totalResult[0]?.total ?? 0);
    const totalPages = Math.ceil(total / pageSize);

    const allForPositions = await db
      .select({ id: waitlistTable.id })
      .from(waitlistTable)
      .orderBy(asc(waitlistTable.createdAt));
    const positionMap = new Map(allForPositions.map((r, i) => [r.id, i + 1]));

    const entriesWithPosition = entriesResult.map((e) => ({
      ...e,
      position: positionMap.get(e.id) ?? null,
    }));

    res.json({
      entries: entriesWithPosition,
      total,
      page,
      pageSize,
      totalPages,
      pendingCount: Number(pendingResult[0]?.pending ?? 0),
    });
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

    // When approved: also approve their user account (if they have one) and send notification email
    if (status === "approved" && updated.email) {
      const [existingUser] = await db
        .select({ id: usersTable.id, firstName: usersTable.firstName, approved: usersTable.approved })
        .from(usersTable)
        .where(eq(usersTable.email, updated.email.toLowerCase()))
        .limit(1);

      if (existingUser && !existingUser.approved) {
        await db
          .update(usersTable)
          .set({ approved: true })
          .where(eq(usersTable.id, existingUser.id));
      }

      sendApprovalNotification(updated.email, updated.firstName ?? null)
        .catch((err: unknown) => req.log.error({ err }, "Failed to send waitlist approval email"));
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
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const pendingMembers = await db
      .select()
      .from(waitlistTable)
      .where(
        and(
          eq(waitlistTable.status, "pending"),
          isNotNull(waitlistTable.referralCode),
          sql`(${waitlistTable.lastNudgeSentAt} IS NULL OR ${waitlistTable.lastNudgeSentAt} < ${sixDaysAgo})`,
        ),
      )
      .orderBy(waitlistTable.createdAt);

    const [{ newSignupsThisWeek }] = await db
      .select({ newSignupsThisWeek: count() })
      .from(waitlistTable)
      .where(gte(waitlistTable.createdAt, oneWeekAgo));

    const [{ total: totalPending }] = await db
      .select({ total: count() })
      .from(waitlistTable)
      .where(eq(waitlistTable.status, "pending"));

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const member of pendingMembers) {
      if (!member.email || !member.referralCode) {
        skipped++;
        continue;
      }

      const [{ position }] = await db
        .select({ position: count() })
        .from(waitlistTable)
        .where(
          and(
            eq(waitlistTable.status, "pending"),
            lt(waitlistTable.createdAt, member.createdAt),
          ),
        );

      const memberPosition = Number(position) + 1;

      try {
        await sendReferralNudge(
          member.email,
          member.firstName ?? null,
          memberPosition,
          member.referralCode,
          Number(newSignupsThisWeek),
        );

        await db
          .update(waitlistTable)
          .set({ lastNudgeSentAt: new Date() })
          .where(eq(waitlistTable.id, member.id));

        sent++;
      } catch (err) {
        errors.push(member.email);
        req.log.error({ err, email: member.email }, "Failed to send nudge email");
      }
    }

    res.json({
      success: true,
      sent,
      skipped,
      totalPending: Number(totalPending),
      newSignupsThisWeek: Number(newSignupsThisWeek),
      errors: errors.length > 0 ? errors : undefined,
    });
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

// ── Public: recommend a business ─────────────────────────────────────────────

router.post("/waitlist/recommend-business", waitlistLimiter, async (req: Request, res: Response) => {
  const { businessName, website, city, state, category, note, businessEmail } = req.body as {
    businessName?: string; website?: string; city?: string; state?: string;
    category?: string; note?: string; businessEmail?: string;
  };

  if (!businessName?.trim()) {
    res.status(400).json({ error: "Business name is required" }); return;
  }

  const uid = req.user?.id ?? null;
  const recommenderEmail = (req.user as any)?.email ?? null;

  try {
    const [rec] = await db.insert(businessRecommendationsTable).values({
      recommenderUserId: uid,
      recommenderEmail,
      businessName: businessName.trim(),
      website: website?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim().toUpperCase() || null,
      category: category?.trim() || null,
      note: note?.trim() || null,
      businessEmail: businessEmail?.trim().toLowerCase() || null,
    }).returning();

    // Count total recommendations for this business (case-insensitive)
    const [{ total }] = await db
      .select({ total: count() })
      .from(businessRecommendationsTable)
      .where(ilike(businessRecommendationsTable.businessName, businessName.trim()));
    const recommendationCount = Number(total);

    // Award Community Builder Points if authenticated
    let pointsEarned = 0;
    if (uid) {
      pointsEarned = 20;
      await db.insert(pointsLedgerTable).values({
        userId: uid,
        action: "business_recommendation",
        points: pointsEarned,
        entityId: rec.id,
      });
      await db.update(businessRecommendationsTable)
        .set({ pointsAwarded: true })
        .where(eq(businessRecommendationsTable.id, rec.id));
    }

    // Send invite email to business only if they are confirmed minority-owned in our directory
    if (businessEmail?.trim()) {
      const [knownBiz] = await db
        .select({ blackOwned: businessesTable.blackOwned })
        .from(businessesTable)
        .where(ilike(businessesTable.name, businessName.trim()))
        .limit(1);
      const isMinorityOwned = knownBiz?.blackOwned ?? false;
      if (isMinorityOwned) {
        const waitlistLink = `https://mappingwithmelanin.com/waitlist?source=recommended&business=${encodeURIComponent(businessName.trim())}`;
        sendBusinessRecommendationInvite(
          businessEmail.trim().toLowerCase(),
          businessName.trim(),
          recommendationCount,
          waitlistLink,
        ).catch((err: unknown) => req.log.error({ err }, "Failed to send business recommendation invite"));
        await db.update(businessRecommendationsTable)
          .set({ emailSentAt: new Date() })
          .where(eq(businessRecommendationsTable.id, rec.id));
      }
    }

    res.status(201).json({ success: true, recommendationCount, pointsEarned });
  } catch (err) {
    req.log.error({ err }, "Failed to save business recommendation");
    res.status(500).json({ error: "Failed to save recommendation" });
  }
});

// ── Admin: list business recommendations ─────────────────────────────────────

router.get("/admin/business-recommendations", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const recs = await db
      .select()
      .from(businessRecommendationsTable)
      .orderBy(desc(businessRecommendationsTable.createdAt));

    // Group by normalized business name for counts
    const countMap: Record<string, number> = {};
    for (const r of recs) {
      const key = r.businessName.toLowerCase();
      countMap[key] = (countMap[key] ?? 0) + 1;
    }

    const enriched = recs.map((r) => ({
      ...r,
      totalRecommendations: countMap[r.businessName.toLowerCase()] ?? 1,
    }));

    res.json({ recommendations: enriched, total: recs.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch business recommendations");
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

// ── Public: send a friend or business invitation ──────────────────────────────

router.post("/waitlist/invite", waitlistLimiter, async (req: Request, res: Response) => {
  const { referralCode, inviteeEmail, inviteeName, type, businessName } = req.body as {
    referralCode?: string;
    inviteeEmail?: string;
    inviteeName?: string;
    type?: "friend" | "business";
    businessName?: string;
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!inviteeEmail || !emailRegex.test(inviteeEmail)) {
    res.status(400).json({ error: "Valid invitee email is required" }); return;
  }
  if (!referralCode?.trim()) {
    res.status(400).json({ error: "Your referral code is required" }); return;
  }
  if (type === "business" && !businessName?.trim()) {
    res.status(400).json({ error: "Business name is required" }); return;
  }

  try {
    const code = referralCode.trim().toUpperCase();

    // Look up referrer in waitlist_signups first, then users table
    let referrerName = "A community member";
    let referrerFirstName: string | null = null;

    const [waitlistReferrer] = await db
      .select({ firstName: waitlistTable.firstName, lastName: waitlistTable.lastName })
      .from(waitlistTable)
      .where(eq(waitlistTable.referralCode, code))
      .limit(1);

    if (waitlistReferrer) {
      referrerFirstName = waitlistReferrer.firstName ?? null;
      const parts = [waitlistReferrer.firstName, waitlistReferrer.lastName].filter(Boolean);
      if (parts.length) referrerName = parts.join(" ");
    } else {
      const [userReferrer] = await db
        .select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
        .from(usersTable)
        .where(eq(usersTable.referralCode, code))
        .limit(1);
      if (!userReferrer) {
        res.status(404).json({ error: "Referral code not found" }); return;
      }
      referrerFirstName = userReferrer.firstName ?? null;
      const parts = [userReferrer.firstName, userReferrer.lastName].filter(Boolean);
      if (parts.length) referrerName = parts.join(" ");
    }

    const referralLink = `https://mappingwithmelanin.com/?ref=${code}`;
    const cleanInvitee = inviteeEmail.toLowerCase().trim();
    const cleanName = inviteeName?.trim() || null;

    if (type === "business") {
      const joinLink = `https://mappingwithmelanin.com/?ref=${code}&type=business&biz=${encodeURIComponent(businessName!.trim())}`;
      await sendBusinessWaitlistInvitation(cleanInvitee, businessName!.trim(), referrerName, joinLink);
    } else {
      // Insert the friend directly onto the waitlist as a pending community member
      // (skip if they're already on it — don't overwrite an existing entry)
      const nameParts = cleanName ? cleanName.split(" ") : [];
      const friendFirst = nameParts[0] ?? null;
      const friendLast = nameParts.slice(1).join(" ") || null;
      const friendCode = cleanInvitee.replace(/[@.]/g, "").toUpperCase().slice(0, 8);

      await pool.query(
        `INSERT INTO waitlist_signups (email, first_name, last_name, referral_code, referred_by, status, notes)
         VALUES ($1, $2, $3, $4, $5, 'pending', 'Added directly by a community member via friend invite')
         ON CONFLICT (email) DO NOTHING`,
        [cleanInvitee, friendFirst, friendLast, friendCode, code]
      );

      await sendFriendInvitation(cleanInvitee, cleanName, referrerName, referralLink, code);
    }

    res.json({ success: true, referrerName: referrerFirstName ?? referrerName });
  } catch (err) {
    req.log.error({ err }, "Failed to send waitlist invitation");
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

// ── Public: referral leaderboard ──────────────────────────────────────────────

router.get("/waitlist/leaderboard", async (_req: Request, res: Response) => {
  try {
    const { rows: builderRows } = await pool.query<{
      first_name: string | null;
      referral_code: string;
      city: string | null;
      state: string | null;
      referral_count: string;
    }>(`
      SELECT
        w.first_name,
        w.referral_code,
        w.city,
        w.state,
        COUNT(r.id)::int AS referral_count
      FROM waitlist_signups w
      JOIN waitlist_signups r ON r.referred_by = w.referral_code
      WHERE w.referral_code IS NOT NULL
      GROUP BY w.first_name, w.referral_code, w.city, w.state
      ORDER BY COUNT(r.id) DESC
      LIMIT 10
    `);

    const builders = builderRows.map((r, i) => ({
      rank: i + 1,
      firstName: r.first_name ?? "Community Member",
      referralCode: r.referral_code,
      city: r.city,
      state: r.state,
      referralCount: Number(r.referral_count),
    }));

    // Top cities
    const cityRows = await db
      .select({ city: waitlistTable.city, state: waitlistTable.state, total: count() })
      .from(waitlistTable)
      .where(isNotNull(waitlistTable.city))
      .groupBy(waitlistTable.city, waitlistTable.state)
      .orderBy(desc(count()))
      .limit(10);

    const cities = cityRows
      .filter(r => r.city)
      .map((r, i) => ({
        rank: i + 1,
        city: r.city as string,
        state: r.state,
        count: Number(r.total),
      }));

    res.json({ builders, cities });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
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
