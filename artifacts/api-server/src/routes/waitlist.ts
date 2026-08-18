import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, waitlistTable, usersTable, businessRecommendationsTable, pointsLedgerTable, businessesTable, businessSuggestionsTable, waitlistSafetyReportsTable } from "@workspace/db";
import { and, asc, count, desc, eq, gte, ilike, isNotNull, lt, sql } from "drizzle-orm";
import { waitlistLimiter } from "../middleware/rateLimiter";
import { sendWaitlistConfirmation, sendWelcomeEmail, sendApprovalNotification, sendBusinessRecommendationInvite, sendFriendInvitation, sendBusinessWaitlistInvitation, sendReferralMilestoneUpdate, sendReferralNudge, sendAppLaunchBlast, sendBetaAnnouncementBlast, sendWaitlistInvitation } from "../lib/email";
import { runWeeklyNudge } from "../lib/nudgeScheduler";
import { isAdmin } from "../lib/adminAuth";

const router: IRouter = Router();

// ── Public: join waitlist ────────────────────────────────────────────────────

router.post("/waitlist", waitlistLimiter, async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, city, state, isBusinessOwner, websiteUrl, referralCode, referredBy, familyEmails, cityNomination, previewChoice, utmSource, utmMedium, utmCampaign, niche, platforms, safetyPriorities } = req.body as {
      email?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      state?: string;
      isBusinessOwner?: boolean;
      websiteUrl?: string;
      referralCode?: string;
      referredBy?: string;
      familyEmails?: string[];
      cityNomination?: string;
      previewChoice?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      niche?: string;
      platforms?: string;
      safetyPriorities?: string;
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

    const namePrefix = firstName?.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8)
      || email.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    const digits = Math.floor(1000 + Math.random() * 9000);
    const code = referralCode ?? `MWM-${namePrefix}-${digits}`;
    const primaryEmail = email.toLowerCase().trim();

    // Validate and deduplicate family emails
    const validFamilyEmails = Array.isArray(familyEmails)
      ? familyEmails
          .map(e => String(e).trim().toLowerCase())
          .filter(e => emailRegex.test(e) && e !== primaryEmail)
          .slice(0, 6)
      : [];

    const familyGroupId = validFamilyEmails.length > 0
      ? `fg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      : null;

    await db
      .insert(waitlistTable)
      .values({
        email: primaryEmail,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim().toUpperCase() || null,
        isBusinessOwner: Boolean(isBusinessOwner),
        websiteUrl: websiteUrl?.trim() || null,
        referralCode: code,
        referredBy: referredBy ?? null,
        status: "pending",
        familyGroupId,
        cityNomination: cityNomination?.trim() || null,
        previewChoice: ['safety', 'discovery', 'business', 'community', 'ambassador'].includes(previewChoice ?? '') ? previewChoice : null,
        niche: niche?.trim() || null,
        platforms: platforms?.trim() || null,
        safetyPriorities: safetyPriorities?.trim() || null,
        notes: (utmSource || utmMedium || utmCampaign) ? JSON.stringify({ utmSource, utmMedium, utmCampaign }) : null,
      })
      .onConflictDoNothing();

    const [{ total }] = await db.select({ total: count() }).from(waitlistTable);
    const position = Number(total);
    const [insertedEntry] = await db.select({ id: waitlistTable.id }).from(waitlistTable).where(eq(waitlistTable.email, primaryEmail)).limit(1);
    const entryId = insertedEntry?.id ?? null;

    // Register each family member as a separate waitlist entry, grouped by familyGroupId
    let familyAdded = 0;
    if (validFamilyEmails.length > 0 && familyGroupId) {
      for (const fe of validFamilyEmails) {
        try {
          const feCode = fe.replace(/[@.]/g, "").toUpperCase().slice(0, 8);
          await db
            .insert(waitlistTable)
            .values({
              email: fe,
              familyGroupId,
              referredBy: code,
              referralCode: feCode,
              status: "pending",
            })
            .onConflictDoNothing();
          const [{ total: feTotal }] = await db.select({ total: count() }).from(waitlistTable);
          sendWaitlistConfirmation(fe, Number(feTotal), feCode, "there")
            .catch((err: unknown) => req.log.error({ err, email: fe }, "Failed to send family member confirmation"));
          familyAdded++;
        } catch (err) {
          req.log.error({ err, email: fe }, "Failed to register family member");
        }
      }
    }

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

    res.status(201).json({ success: true, position, referralCode: code, familyAdded, id: entryId });
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
    res.json({ count: 0, cities: [] });
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

// ── Public: city stats ────────────────────────────────────────────────────────
router.get("/waitlist/stats", async (req: Request, res: Response) => {
  const city = String(req.query.city ?? "").trim();
  const THRESHOLDS: Record<string, number> = {
    "charlotte": 1000, "philadelphia": 1000, "atlanta": 1000,
    "houston": 1000, "washington": 1000, "chicago": 1000,
    "new york": 2000, "los angeles": 2000, "miami": 1000,
  };
  const cityKey = city.toLowerCase().split(",")[0].trim();
  const threshold = THRESHOLDS[cityKey] ?? 1000;
  try {
    const memberRows = city
      ? await db.select({ total: count() }).from(waitlistTable).where(ilike(waitlistTable.city, `%${city.split(",")[0].trim()}%`))
      : await db.select({ total: count() }).from(waitlistTable);
    const bizRows = city
      ? await db.select({ total: count() }).from(businessSuggestionsTable).where(ilike(businessSuggestionsTable.city, `%${city.split(",")[0].trim()}%`))
      : await db.select({ total: count() }).from(businessSuggestionsTable);
    const memberCount = Number(memberRows[0]?.total ?? 0);
    const topReferrers = await db
      .select({ firstName: waitlistTable.firstName, referralCode: waitlistTable.referralCode, referrals: count() })
      .from(waitlistTable)
      .where(city ? ilike(waitlistTable.city, `%${city.split(",")[0].trim()}%`) : sql`true`)
      .groupBy(waitlistTable.firstName, waitlistTable.referralCode)
      .orderBy(desc(count()))
      .limit(10);
    res.json({
      city: city || null, memberCount, businessCount: Number(bizRows[0]?.total ?? 0),
      threshold, remaining: Math.max(0, threshold - memberCount),
      topReferrers: topReferrers.map(r => ({ firstName: r.firstName || "Member", referralCode: r.referralCode, referrals: Number(r.referrals) })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch waitlist stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ── Public: city leaderboard ──────────────────────────────────────────────────
router.get("/waitlist/leaderboard", async (req: Request, res: Response) => {
  const TOUR_STOPS = ["charlotte", "philadelphia", "atlanta", "houston", "washington", "chicago"];
  const THRESHOLDS: Record<string, number> = {
    "charlotte": 1000, "philadelphia": 1000, "atlanta": 1000,
    "houston": 1000, "washington": 1000, "chicago": 1000,
    "new york": 2000, "los angeles": 2000, "miami": 1000,
  };
  try {
    const cityRows = await db
      .select({ city: waitlistTable.city, total: count() })
      .from(waitlistTable)
      .where(isNotNull(waitlistTable.city))
      .groupBy(waitlistTable.city)
      .orderBy(desc(count()))
      .limit(20);
    const cities = cityRows.filter(r => r.city).map(r => {
      const cityName = r.city as string;
      const cityKey = cityName.toLowerCase().split(",")[0].trim();
      const threshold = THRESHOLDS[cityKey] ?? 1000;
      const memberCount = Number(r.total);
      return {
        city: cityName, count: memberCount, threshold,
        progress: Math.min(100, Math.round((memberCount / threshold) * 100)),
        isTourStop: TOUR_STOPS.includes(cityKey),
      };
    });
    res.json({ cities });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch leaderboard");
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ── Public: individual referral dashboard (no login required) ─────────────────
router.get("/waitlist/me", async (req: Request, res: Response) => {
  const code = String(req.query.ref ?? "").trim().toUpperCase();
  if (!code) { res.status(400).json({ error: "ref code required" }); return; }
  try {
    const [entry] = await db.select().from(waitlistTable).where(eq(waitlistTable.referralCode, code)).limit(1);
    if (!entry) { res.status(404).json({ error: "Code not found" }); return; }
    const [{ referralCount }] = await db
      .select({ referralCount: count() }).from(waitlistTable).where(eq(waitlistTable.referredBy, code));
    const cnt = Number(referralCount);
    const tier = cnt >= 50 ? "Ambassador" : cnt >= 25 ? "Founding Member" : cnt >= 10 ? "City Champion" : cnt >= 3 ? "Community Builder" : "Member";
    const nextTierAt = cnt < 3 ? 3 : cnt < 10 ? 10 : cnt < 25 ? 25 : cnt < 50 ? 50 : null;
    const referred = await db
      .select({ firstName: waitlistTable.firstName, createdAt: waitlistTable.createdAt })
      .from(waitlistTable)
      .where(eq(waitlistTable.referredBy, code))
      .orderBy(desc(waitlistTable.createdAt))
      .limit(20);
    let cityRank: number | null = null;
    if (entry.city) {
      const prefix = entry.city.split(",")[0].trim();
      const topReferrers = await db
        .select({ referralCode: waitlistTable.referralCode, referrals: count() })
        .from(waitlistTable)
        .where(ilike(waitlistTable.city, `%${prefix}%`))
        .groupBy(waitlistTable.referralCode)
        .orderBy(desc(count()))
        .limit(100);
      const idx = topReferrers.findIndex(r => r.referralCode === code);
      cityRank = idx >= 0 ? idx + 1 : null;
    }
    res.json({
      code, firstName: entry.firstName, city: entry.city, track: entry.previewChoice,
      referralCount: cnt, tier, nextTierAt, cityRank,
      referredUsers: referred.map(r => ({ firstName: r.firstName || "Friend", joinedAt: r.createdAt })),
      referralLink: `https://www.mappingwithmelanin.com/preview?ref=${code}`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch referral stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ── Public: submit a business suggestion ──────────────────────────────────────
router.post("/waitlist/business-suggest", async (req: Request, res: Response) => {
  const { businessName, category, city, website, referralCode: refCode } = req.body as {
    businessName?: string; category?: string; city?: string; website?: string; referralCode?: string;
  };
  if (!businessName?.trim()) { res.status(400).json({ error: "Business name required" }); return; }
  try {
    let waitlistId: string | null = null;
    if (refCode) {
      const [e] = await db.select({ id: waitlistTable.id }).from(waitlistTable)
        .where(eq(waitlistTable.referralCode, refCode.toUpperCase())).limit(1);
      waitlistId = e?.id ?? null;
    }
    await db.insert(businessSuggestionsTable).values({
      waitlistId, referralCode: refCode?.toUpperCase() ?? null,
      businessName: businessName.trim(), category: category?.trim() ?? null,
      city: city?.trim() ?? null, website: website?.trim() ?? null,
    });
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save business suggestion");
    res.status(500).json({ error: "Failed to save suggestion" });
  }
});

// ── Public: submit a pre-launch safety report ─────────────────────────────────
router.post("/waitlist/safety-report", async (req: Request, res: Response) => {
  const { concernType, description, city, referralCode: refCode } = req.body as {
    concernType?: string; description?: string; city?: string; referralCode?: string;
  };
  if (!concernType?.trim() && !description?.trim()) {
    res.status(400).json({ error: "Concern type or description required" }); return;
  }
  try {
    let waitlistId: string | null = null;
    if (refCode) {
      const [e] = await db.select({ id: waitlistTable.id }).from(waitlistTable)
        .where(eq(waitlistTable.referralCode, refCode.toUpperCase())).limit(1);
      waitlistId = e?.id ?? null;
    }
    await db.insert(waitlistSafetyReportsTable).values({
      waitlistId, referralCode: refCode?.toUpperCase() ?? null,
      concernType: concernType?.trim() ?? null, description: description?.trim() ?? null,
      city: city?.trim() ?? null,
    });
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save safety report");
    res.status(500).json({ error: "Failed to save report" });
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
    const statusParam = String(req.query.status ?? "");
    const searchParam = String(req.query.search ?? "").trim().toLowerCase();
    const allowedStatuses = ["pending", "approved", "rejected"];
    const filterByStatus = allowedStatuses.includes(statusParam) ? statusParam : null;

    // Fetch all entries ordered by signup date so position = chronological rank
    const allEntries = await db
      .select()
      .from(waitlistTable)
      .orderBy(asc(waitlistTable.createdAt));

    // Build position map (1-based, signup order across entire list)
    const positionMap = new Map(allEntries.map((e, i) => [e.id, i + 1]));

    // Apply status + search filters
    const filtered = allEntries.filter(e => {
      if (filterByStatus && e.status !== filterByStatus) return false;
      if (searchParam) {
        const haystack = [e.email, e.city, e.referralCode, e.referredBy, e.firstName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchParam)) return false;
      }
      return true;
    });

    const header = [
      "Position", "First Name", "Email", "City", "State",
      "Type", "Referral Code", "Referred By", "Status", "Date Joined",
    ];
    const rows = filtered.map(e => [
      positionMap.get(e.id) ?? "",
      e.firstName ?? "",
      e.email,
      e.city ?? "",
      e.state ?? "",
      e.isBusinessOwner ? "Business" : "Community",
      e.referralCode ?? "",
      e.referredBy ?? "",
      e.status,
      new Date(e.createdAt).toISOString(),
    ]);

    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
    const datePart = new Date().toISOString().slice(0, 10);
    const suffix = filterByStatus ? `-${filterByStatus}` : searchParam ? `-filtered` : "";
    const filename = `waitlist${suffix}-${datePart}.csv`;
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
  const { ids, status, filter } = req.body as {
    ids?: string[];
    status?: string;
    filter?: { status?: string };
  };
  const allowed = ["pending", "approved", "rejected"];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }

  const hasIds = Array.isArray(ids) && ids.length > 0;
  const hasFilter = filter !== undefined && typeof filter === "object";

  if (!hasIds && !hasFilter) {
    res.status(400).json({ error: "Provide either ids array or a filter object" }); return;
  }

  try {
    const { inArray: drizzleInArray } = await import("drizzle-orm");
    const updates = { status, approvedAt: status === "approved" ? new Date() : null };

    let updatedCount = 0;

    if (hasFilter) {
      // Filter-based: update all entries matching the given filter (cross-page bulk)
      const filterStatus = filter!.status;
      const filterAllowed = ["pending", "approved", "rejected"];
      const whereClause = filterStatus && filterAllowed.includes(filterStatus)
        ? eq(waitlistTable.status, filterStatus)
        : undefined;

      const result = whereClause
        ? await db.update(waitlistTable).set(updates).where(whereClause).returning({ id: waitlistTable.id })
        : await db.update(waitlistTable).set(updates).returning({ id: waitlistTable.id });

      updatedCount = result.length;
    } else {
      // ID-based: update specific entries
      await db.update(waitlistTable)
        .set(updates)
        .where(drizzleInArray(waitlistTable.id, ids!));
      updatedCount = ids!.length;
    }

    // Fire approval emails for newly approved entries (filter-based only for explicit IDs; skip for large filter updates to avoid email floods)
    if (status === "approved" && hasIds && ids!.length <= 50) {
      const approvedEntries = await db.select({ id: waitlistTable.id, email: waitlistTable.email, firstName: waitlistTable.firstName })
        .from(waitlistTable)
        .where(drizzleInArray(waitlistTable.id, ids!));
      for (const entry of approvedEntries) {
        if (!entry.email) continue;
        const [existingUser] = await db
          .select({ id: usersTable.id, approved: usersTable.approved })
          .from(usersTable)
          .where(eq(usersTable.email, entry.email.toLowerCase()))
          .limit(1);
        if (existingUser && !existingUser.approved) {
          await db.update(usersTable).set({ approved: true }).where(eq(usersTable.id, existingUser.id));
        }
        sendApprovalNotification(entry.email, entry.firstName ?? null)
          .catch((err: unknown) => req.log.error({ err }, "Failed to send bulk approval email"));
      }
    }

    res.json({ updated: updatedCount });
  } catch (err) {
    req.log.error({ err }, "Failed to bulk update waitlist");
    res.status(500).json({ error: "Failed to bulk update" });
  }
});

// ── Admin: send weekly nudge to all pending waitlist members ─────────────────

router.post("/admin/send-weekly-nudge", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const result = await runWeeklyNudge();
    res.json({
      success: true,
      sent: result.sent,
      skipped: result.skipped,
      totalPending: result.totalPending,
      newSignupsThisWeek: result.newSignupsThisWeek,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to send weekly nudge");
    res.status(500).json({ error: "Failed to send weekly nudge" });
  }
});

// ── Cron: externally-triggered weekly nudge (no session required, key-based auth) ──
// Hit this endpoint from any external cron service (GitHub Actions, Render Cron, etc.)
// Example: GET https://www.melaninmaps.com/api/admin/cron-weekly-nudge?key=YOUR_KEY

router.get("/admin/cron-weekly-nudge", async (req: Request, res: Response) => {
  const cronKey = process.env.ADMIN_CRON_KEY;
  if (!cronKey || req.query.key !== cronKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const result = await runWeeklyNudge();
    res.json({
      success: true,
      sent: result.sent,
      skipped: result.skipped,
      totalPending: result.totalPending,
      newSignupsThisWeek: result.newSignupsThisWeek,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: "Cron nudge failed" });
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

// ── Admin: send Founding Community Preview invitation blast ───────────────────
// Body: { eventDate?, eventTime?, zoomLink?, zoomMeetingId?, dryRun? }
// Pass dryRun:true to get a count without actually sending.
router.post("/admin/send-invitation-blast", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const {
      eventDate,
      eventTime,
      zoomLink,
      zoomMeetingId,
      dryRun = false,
    } = req.body as {
      eventDate?: string;
      eventTime?: string;
      zoomLink?: string;
      zoomMeetingId?: string;
      dryRun?: boolean;
    };

    const recipients = await db
      .select()
      .from(waitlistTable)
      .orderBy(waitlistTable.createdAt);

    if (dryRun) {
      res.json({ dryRun: true, wouldSend: recipients.length });
      return;
    }

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i++) {
      const entry = recipients[i];
      if (!entry.email) { failed++; continue; }
      try {
        await sendWaitlistInvitation(entry.email, entry.firstName ?? null, {
          eventDate,
          eventTime,
          zoomLink,
          zoomMeetingId,
        });
        sent++;
        // Respect Resend rate limits — ~2 emails/sec
        if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));
      } catch {
        failed++;
      }
    }

    res.json({ sent, failed, total: recipients.length });
  } catch (err) {
    req.log.error({ err }, "Failed to send invitation blast");
    res.status(500).json({ error: "Failed to send invitation blast" });
  }
});

// ── Admin: send invitation to a specific list of emails ──────────────────────
// Useful for testing or sending to a subset first.
router.post("/admin/send-invitation-to", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const {
      emails,
      eventDate,
      eventTime,
      zoomLink,
      zoomMeetingId,
    } = req.body as {
      emails: string[];
      eventDate?: string;
      eventTime?: string;
      zoomLink?: string;
      zoomMeetingId?: string;
    };

    if (!Array.isArray(emails) || emails.length === 0) {
      res.status(400).json({ error: "emails array required" }); return;
    }

    const results: { email: string; status: "sent" | "failed" }[] = [];

    for (const rawEmail of emails) {
      const email = rawEmail.trim().toLowerCase();
      // Try to find their name from the waitlist
      const [entry] = await db
        .select()
        .from(waitlistTable)
        .where(eq(waitlistTable.email, email))
        .limit(1);
      try {
        await sendWaitlistInvitation(email, entry?.firstName ?? null, {
          eventDate,
          eventTime,
          zoomLink,
          zoomMeetingId,
        });
        results.push({ email, status: "sent" });
      } catch {
        results.push({ email, status: "failed" });
      }
    }

    res.json({ results, sent: results.filter(r => r.status === "sent").length });
  } catch (err) {
    req.log.error({ err }, "Failed to send targeted invitations");
    res.status(500).json({ error: "Failed to send invitations" });
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
    res.json({ builders: [], cities: [] });
  }
});

// ── Admin: app launch blast to all waitlist members ───────────────────────────

router.post("/admin/send-launch-blast", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { iosUrl, androidUrl, onlyUnsent } = req.body as {
      iosUrl?: string;
      androidUrl?: string;
      onlyUnsent?: boolean;
    };
    const iosLink = iosUrl || "https://apps.apple.com/app/mapping-with-melanin";
    const androidLink = androidUrl || "https://play.google.com/store/apps/details?id=com.melaninmaps";

    const { eq: drizzleEq } = await import("drizzle-orm");
    const all = await db
      .select()
      .from(waitlistTable)
      .where(onlyUnsent !== false ? drizzleEq(waitlistTable.launchEmailSent, false) : undefined)
      .orderBy(waitlistTable.createdAt);

    const totalOnList = await db.select({ total: count() }).from(waitlistTable);
    const totalCount = Number(totalOnList[0].total);

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < all.length; i++) {
      const entry = all[i];
      if (!entry.email || !entry.referralCode) { failed++; continue; }
      const position = i + 1;
      try {
        await sendAppLaunchBlast(
          entry.email,
          entry.firstName ?? "there",
          position,
          entry.referralCode,
          iosLink,
          androidLink,
        );
        await db.update(waitlistTable)
          .set({ launchEmailSent: true })
          .where(drizzleEq(waitlistTable.id, entry.id));
        sent++;
        if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));
      } catch {
        failed++;
      }
    }

    res.json({
      sent,
      failed,
      skipped: totalCount - all.length,
      total: totalCount,
      message: `Launch blast complete — ${sent} emails sent, ${failed} failed.`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to send launch blast");
    res.status(500).json({ error: "Failed to send launch blast" });
  }
});

// ── Admin: beta announcement blast ────────────────────────────────────────────
router.post("/admin/send-beta-blast", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { betaSignupUrl, onlyUnsent } = req.body as {
      betaSignupUrl?: string;
      onlyUnsent?: boolean;
    };
    const signupUrl = betaSignupUrl || "https://mappingwithmelanin.com/beta";

    const all = await db
      .select()
      .from(waitlistTable)
      .where(onlyUnsent !== false ? eq(waitlistTable.betaEmailSent, false) : undefined)
      .orderBy(waitlistTable.createdAt);

    const totalOnList = await db.select({ total: count() }).from(waitlistTable);
    const totalCount = Number(totalOnList[0].total);

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < all.length; i++) {
      const entry = all[i];
      if (!entry.email) { failed++; continue; }
      try {
        await sendBetaAnnouncementBlast(
          entry.email,
          entry.firstName ?? "there",
          signupUrl,
        );
        await db.update(waitlistTable)
          .set({ betaEmailSent: true })
          .where(eq(waitlistTable.id, entry.id));
        sent++;
        if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));
      } catch {
        failed++;
      }
    }

    res.json({
      sent,
      failed,
      skipped: totalCount - all.length,
      total: totalCount,
      message: `Beta blast complete — ${sent} sent, ${failed} failed.`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to send beta blast");
    res.status(500).json({ error: "Failed to send beta blast" });
  }
});

// ── Public: social media referral (no email needed) ──────────────────────────

router.post("/waitlist/social-refer", waitlistLimiter, async (req: Request, res: Response) => {
  const { platform, handleOrUrl, name, type, referralCode, bizName } = req.body as {
    platform?: string;
    handleOrUrl?: string;
    name?: string;
    type?: "friend" | "business";
    referralCode?: string;
    bizName?: string;
  };

  if (!platform?.trim() || !handleOrUrl?.trim()) {
    res.status(400).json({ error: "Platform and handle/URL are required" });
    return;
  }
  if (type === "business" && !bizName?.trim()) {
    res.status(400).json({ error: "Business name is required" });
    return;
  }

  const cleanPlatform = platform.trim().toLowerCase();
  const cleanHandle = handleOrUrl.trim();
  const cleanName = name?.trim() || null;
  const cleanType = type === "business" ? "business" : "friend";
  const cleanCode = referralCode?.trim().toUpperCase() || null;
  const cleanBiz = bizName?.trim() || null;

  await pool.query(
    `INSERT INTO social_invites (platform, handle_or_url, name, type, biz_name, referral_code)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [cleanPlatform, cleanHandle, cleanName, cleanType, cleanBiz, cleanCode]
  );

  const displayName = cleanName || cleanHandle;
  let copyMessage = "";
  if (cleanType === "business") {
    copyMessage = `Hey! I wanted to invite ${cleanBiz ?? displayName} to join Mapping With Melanin™ — the app connecting people to trusted Black and minority-owned businesses, safety intel, and community. It's free to list and you get discovered by thousands. Join here: https://mappingwithmelanin.com/?ref=${cleanCode ?? "JOIN"}`;
  } else {
    copyMessage = `Hey ${displayName}! You need to check out Mapping With Melanin™ — it's an app for discovering trusted minority-owned businesses, Community Intelligence from people who've actually been there, and cultural experiences. Join the community here: https://mappingwithmelanin.com/?ref=${cleanCode ?? "JOIN"}`;
  }

  res.json({ success: true, copyMessage });
});

// ── Admin: capability probe ──────────────────────────────────────────────────
// Intentional design: this endpoint always returns HTTP 200 with { isAdmin: true/false }
// for all callers — authenticated or not. It is a capability-probe, not a gated
// resource. The client uses the result to decide whether to render admin UI.
// Protected admin endpoints (POST, PATCH, GET /admin/*) enforce authorization
// with explicit 401/403 responses independently of this check.
router.get("/admin/check", (req: Request, res: Response) => {
  res.json({
    isAdmin: isAdmin(req),
    requireApproval: process.env.REQUIRE_APPROVAL === "true",
  });
});

// ── Admin: waitlist community update blast ────────────────────────────────────
// Accessible via isAdmin session OR CRON_SECRET Bearer token (ops fallback).
// Body: { dryRun?: boolean }
// dryRun:true (default) returns count without sending any email.
router.post("/admin/send-waitlist-update", async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers["authorization"] ?? "";
  const hasCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
  if (!isAdmin(req) && !hasCronAuth) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { dryRun = true } = req.body as { dryRun?: boolean };

  try {
    const { sendWaitlistUpdateEmail } = await import("../lib/email");

    const all = await db
      .select({ id: waitlistTable.id, email: waitlistTable.email, firstName: waitlistTable.firstName })
      .from(waitlistTable)
      .where(isNotNull(waitlistTable.email))
      .orderBy(waitlistTable.createdAt);

    if (dryRun) {
      res.json({
        dryRun: true,
        wouldSendTo: all.length,
        message: `Dry run: would send to ${all.length} waitlist addresses. Call with dryRun:false to send.`,
      });
      return;
    }

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < all.length; i++) {
      const entry = all[i];
      if (!entry.email) { failed++; continue; }
      try {
        await sendWaitlistUpdateEmail(entry.email, entry.firstName ?? "there");
        sent++;
      } catch {
        failed++;
      }
      if (i % 10 === 9) await new Promise(r => setTimeout(r, 600));
    }

    req.log.info({ sent, failed }, "Waitlist update blast complete");
    res.json({
      dryRun: false,
      sent,
      failed,
      total: all.length,
      message: `Update blast complete — ${sent} sent, ${failed} failed.`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to send waitlist update blast");
    res.status(500).json({ error: "Failed to send waitlist update blast" });
  }
});

// ── Admin: pre-import backup to Object Storage ───────────────────────────────
// POST /api/admin/waitlist/backup
// Read-only against the database. Writes three files to Object Storage:
//   backups/waitlist/<batchId>/waitlist-signups-export.csv
//   backups/waitlist/<batchId>/import-dataset.csv
//   backups/waitlist/<batchId>/manifest.json
// Returns the manifest so the caller can verify the backup before approving import.

router.post("/admin/waitlist/backup", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const { batchId, importDatasetCsv } = req.body as {
    batchId?: string;
    importDatasetCsv?: string;
  };

  if (!batchId || typeof batchId !== "string" || !/^[\w-]+$/.test(batchId)) {
    res.status(400).json({ error: "batchId is required and must be alphanumeric/hyphens only" });
    return;
  }

  try {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      res.status(500).json({ error: "Object storage not configured (DEFAULT_OBJECT_STORAGE_BUCKET_ID missing)" });
      return;
    }

    const { Storage } = await import("@google-cloud/storage");
    const SIDECAR = "http://127.0.0.1:1106";

    const storage = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${SIDECAR}/token`,
        type: "external_account",
        credential_source: {
          url: `${SIDECAR}/credential`,
          format: { type: "json", subject_token_field_name: "access_token" },
        },
        universe_domain: "googleapis.com",
      },
      projectId: "",
    });

    const bucket = storage.bucket(bucketId);
    const prefix = `backups/waitlist/${batchId}`;
    const timestamp = new Date().toISOString();

    // ── 1. Export current production waitlist as CSV ──────────────────────
    const allRows = await db.select().from(waitlistTable).orderBy(asc(waitlistTable.createdAt));

    const csvHeader = [
      "id","email","first_name","last_name","city","state","is_business_owner",
      "website_url","status","referral_code","referred_by","family_group_id",
      "notes","city_nomination","welcome_email_sent","launch_email_sent",
      "beta_email_sent","approved_at","last_nudge_sent_at","created_at","import_batch_id",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const exportCsvRows = allRows.map(r => [
      r.id, r.email, r.firstName, r.lastName, r.city, r.state,
      r.isBusinessOwner, r.websiteUrl, r.status, r.referralCode,
      r.referredBy, r.familyGroupId, r.notes, r.cityNomination,
      r.welcomeEmailSent, r.launchEmailSent, r.betaEmailSent,
      r.approvedAt?.toISOString() ?? "", r.lastNudgeSentAt?.toISOString() ?? "",
      r.createdAt.toISOString(), r.importBatchId,
    ].map(esc).join(","));
    const exportCsvContent = [csvHeader.map(esc).join(","), ...exportCsvRows].join("\n");

    // ── 2. Compute checksums ──────────────────────────────────────────────
    const { createHash } = await import("crypto");
    const exportChecksum = createHash("sha256").update(exportCsvContent).digest("hex");
    const importChecksum = importDatasetCsv
      ? createHash("sha256").update(importDatasetCsv).digest("hex")
      : null;

    // ── 3. Write export CSV ───────────────────────────────────────────────
    const exportFile = bucket.file(`${prefix}/waitlist-signups-export.csv`);
    await exportFile.save(exportCsvContent, {
      contentType: "text/csv",
      metadata: { cacheControl: "no-store", batchId, timestamp },
    });

    // ── 4. Write import dataset CSV (if provided) ─────────────────────────
    let importFileWritten = false;
    if (importDatasetCsv && typeof importDatasetCsv === "string") {
      const importFile = bucket.file(`${prefix}/import-dataset.csv`);
      await importFile.save(importDatasetCsv, {
        contentType: "text/csv",
        metadata: { cacheControl: "no-store", batchId, timestamp },
      });
      importFileWritten = true;
    }

    // ── 5. Write manifest ─────────────────────────────────────────────────
    const manifest = {
      batchId,
      timestamp,
      environment: process.env.NODE_ENV ?? "unknown",
      exportRowCount: allRows.length,
      exportChecksum,
      importDatasetIncluded: importFileWritten,
      importChecksum,
      files: {
        export: `${prefix}/waitlist-signups-export.csv`,
        importDataset: importFileWritten ? `${prefix}/import-dataset.csv` : null,
        manifest: `${prefix}/manifest.json`,
      },
      rollbackNote: `To roll back this import: DELETE FROM waitlist_signups WHERE import_batch_id = '${batchId}'; then restore updated rows from the reconciliation file.`,
    };

    const manifestFile = bucket.file(`${prefix}/manifest.json`);
    await manifestFile.save(JSON.stringify(manifest, null, 2), {
      contentType: "application/json",
      metadata: { cacheControl: "no-store", batchId, timestamp },
    });

    req.log.info({ batchId, exportRowCount: allRows.length }, "Pre-import backup written to Object Storage");

    res.json({
      success: true,
      manifest,
      message: `Backup complete. ${allRows.length} current waitlist rows exported to Object Storage. Backup is NOT in git or Railway.`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to write pre-import backup");
    res.status(500).json({ error: "Backup failed — do not proceed with import until backup is confirmed" });
  }
});

// ── Production Audit ─────────────────────────────────────────────────────────
// Returns counts and overlap data needed to plan a safe waitlist import.
// Uses raw pool.query so it works even before the import_batch_id column
// is pushed to production.
const IMPORT_EMAILS = [
  'j.gries@live.com','teianna.lindsay@prudential.com','sheilasegura@comcast.net',
  'nydiahholly12@gmail.com','lgossett56@hotmail.com','jordanw117@icloud.com',
  'independentjorfan@yahoo.com','shawnhillhomes@gmail.com','mckelvin.william@yahoo.com',
  'reinaoba001@gmail.com','reinagail101@gmail.com','jthrashertricountyoic@gmail.com',
  'jandirafernandes13@gmail.com','nevaehcooper966@gmail.com','starlynn031@gmail.com',
  'darrylleatherbury@gmail.com','tlindsay428@aol.com','cydrich2@gmail.com',
  'ninamartinez409@gmail.com','stc1jro@yahoo.com','daniellejlawson@gmail.com',
  'meaparks@gmail.com','cicinaj2@gmail.com','trina.hairston@honeywellfcu.com',
  'winternewman88@gmail.com','cardwellkayla219@gmail.com','trinalindsayhairston@gmail.com',
  'dcaesar27@gmail.com','tlindsay428@gmail.com','kaylacardwell3@gmail.com',
  'bigdot6017@gmail.com','hello@melaninmaps.app','test@example.com',
  'kyleisha.m.fisher@gmail.com','melody.brown1988@gmail.com','owcforyouth@gmail.com',
  'taleisha.fisher@gmail.com','taleisham.saunders@gmail.com',
  'themontgomerymanagementgroup@gmail.com','gregorywilliam05@gmail.com',
  'jordanwtester@gmail.com','joshuabierd99@gmail.com','kaylacardwelltester@gmail.com',
  'kevinctester@gmail.com','kevkaytester@gmail.com','kyleisha.m.morton@gmail.com',
  'teiannaltester@gmail.com','trinalindsaytester@gmail.com','lilanarich@gmail.com',
  'fatimccoy@icloud.com','jordanwyatt117@icloud.com','jross215@gmail.com',
  'kaylathomas20011@gmail.com','kansesdwilliams@gmail.com','tlindsay428@yahoo.com',
];

router.get("/admin/waitlist/audit", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const placeholders = IMPORT_EMAILS.map((_, i) => `$${i + 1}`).join(", ");

    const [statusRes, usersRes, contentRes, waitlistOverlapRes, userOverlapRes] = await Promise.all([
      // C — waitlist by status
      pool.query<{ status: string; total: string }>(
        `SELECT status, COUNT(*) AS total FROM waitlist_signups GROUP BY status ORDER BY total DESC`
      ),
      // D — users overview
      pool.query<{
        total_users: string; admins: string; testers: string;
        regular_users: string; onboarded: string; has_profile_photo: string;
      }>(
        `SELECT
          COUNT(*) AS total_users,
          COUNT(*) FILTER (WHERE role = 'admin') AS admins,
          COUNT(*) FILTER (WHERE role = 'tester') AS testers,
          COUNT(*) FILTER (WHERE role = 'user') AS regular_users,
          COUNT(*) FILTER (WHERE profile_setup_complete = true) AS onboarded,
          COUNT(*) FILTER (WHERE profile_image_url IS NOT NULL AND profile_image_url != '') AS has_profile_photo
        FROM users`
      ),
      // E — user-generated content
      pool.query<{
        safety_surveys: string; safety_reports: string; community_posts: string;
        events: string; saved_places: string; reviews: string; messages: string;
      }>(
        `SELECT
          (SELECT COUNT(*) FROM neighborhood_surveys) AS safety_surveys,
          (SELECT COUNT(*) FROM safety_reports) AS safety_reports,
          (SELECT COUNT(*) FROM community_posts) AS community_posts,
          (SELECT COUNT(*) FROM events) AS events,
          (SELECT COUNT(*) FROM saved_places) AS saved_places,
          (SELECT COUNT(*) FROM reviews) AS reviews,
          (SELECT COUNT(*) FROM messages) AS messages`
      ),
      // A — which import emails exist in waitlist_signups
      pool.query<{ email: string; status: string; created_at: Date }>(
        `SELECT email, status, created_at
         FROM waitlist_signups
         WHERE LOWER(TRIM(email)) IN (${placeholders})`,
        IMPORT_EMAILS
      ),
      // B — which import emails exist in users
      pool.query<{ email: string; role: string; created_at: Date }>(
        `SELECT email, role, created_at
         FROM users
         WHERE LOWER(TRIM(email)) IN (${placeholders})`,
        IMPORT_EMAILS
      ),
    ]);

    res.json({
      runAt: new Date().toISOString(),
      importEmailCount: IMPORT_EMAILS.length,
      waitlistByStatus: statusRes.rows,
      usersOverview: usersRes.rows[0] ?? null,
      contentCounts: contentRes.rows[0] ?? null,
      waitlistOverlap: {
        count: waitlistOverlapRes.rows.length,
        rows: waitlistOverlapRes.rows,
      },
      userOverlap: {
        count: userOverlapRes.rows.length,
        rows: userOverlapRes.rows,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Audit query failed");
    res.status(500).json({ error: "Audit query failed", detail: String(err) });
  }
});

export default router;
