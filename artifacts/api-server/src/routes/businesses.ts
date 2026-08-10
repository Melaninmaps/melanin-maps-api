import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { db, pool, businessesTable, businessIdentityTable, businessProfileViewsTable, userSettingsTable, usersTable, docusignEnvelopesTable, businessPromotionsTable, businessSearchInquiriesTable, userPreferencesTable, businessClickEventsTable, businessCaptionsTable, contentReportsTable, referenceLinkClicksTable, BUSINESS_CATEGORY_TAXONOMY, ALL_VALID_CATEGORY_NAMES } from "@workspace/db";
import { eq, and, or, ilike, desc, sql, gt, count, inArray, ne } from "drizzle-orm";
import { withDbRetry } from "../lib/db-retry";
import { sendAddressUpdateNotifications } from "../lib/pushNotifications";
import { createFoundingAgreementEnvelope } from "../lib/docusign";
import { sendFoundingWelcomeEmail, sendSearchInquiryAlert } from "../lib/email";
import { objectStorageClient } from "../lib/objectStorage";
import { reportLimiter } from "../middleware/rateLimiter";
import { requireAuth } from "../middlewares/requireAuth";

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith("video/"));
  },
});

const router: IRouter = Router();
router.use(requireAuth);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

// ── GET /businesses/categories ── master taxonomy (single source of truth) ────
// Returns the full 22-category taxonomy with subcategories.
// Used by web dropdowns, mobile filters, business onboarding, and Excel sheets.
router.get("/businesses/categories", (_req: Request, res: Response) => {
  res.json({
    categories: BUSINESS_CATEGORY_TAXONOMY,
    mainCategories: BUSINESS_CATEGORY_TAXONOMY.map((c) => c.name),
  });
});

// ── Lightweight map-pins endpoint ──────────────────────────────────────────
// Returns ALL active businesses that have valid coordinates, with only the
// minimal fields a map marker needs. No 200-row cap — this is intentional.
// The small payload (id/name/lat/lng/category/city/country) keeps it fast.
router.get("/businesses/map-pins", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query<{
      id: string; name: string; latitude: string; longitude: string;
      category: string | null; subcategory: string | null;
      city: string | null; state: string | null; country: string | null;
      listing_status: string | null;
    }>(`
      SELECT id, name, latitude, longitude, category, subcategory,
             city, state, country, listing_status
      FROM businesses
      WHERE status = 'active'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND latitude != 0
        AND longitude != 0
      ORDER BY confidence_score DESC, created_at DESC
    `);
    res.json({ pins: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to load map pins" });
  }
});

router.get("/businesses", async (req: Request, res: Response) => {
  // Public browsing is allowed. Personalization (preferences, saved status) requires auth.
  // Mutation endpoints (save, tag, vibe, etc.) enforce auth individually below.
  try {
    await withDbRetry(async () => {
    const { category, city, search, state, country, subcategory, handle, culturalPreference, ownership, offset: offsetParam, limit: limitParam, lat: latParam, lng: lngParam, radius: radiusParam } = req.query;
    const offset = Math.max(0, parseInt((offsetParam as string) ?? "0", 10) || 0);
    const pageLimit = Math.min(200, Math.max(1, parseInt((limitParam as string) ?? "200", 10) || 200));

    // Parse optional geo-filter params (lat/lng in decimal degrees, radius in miles)
    const geoLat = latParam ? parseFloat(latParam as string) : null;
    const geoLng = lngParam ? parseFloat(lngParam as string) : null;
    const geoRadiusMi = radiusParam ? parseFloat(radiusParam as string) : 25;
    const hasGeoFilter = geoLat !== null && geoLng !== null && !isNaN(geoLat) && !isNaN(geoLng);

    const conditions = [];

    // ── listing_status gate — real users only see live listings ──────────────
    // Tester accounts see everything; regular users see only live_unclaimed + live_claimed.
    const isTester = (req as any).user?.isTester === true;
    if (!isTester) {
      conditions.push(
        sql`${businessesTable}.listing_status IN ('live_unclaimed', 'live_claimed')`
      );
    }

    if (category && typeof category === "string" && category !== "All") {
      conditions.push(eq(businessesTable.category, category));
    }

    // ownership filter: "black-owned" maps to the blackOwned boolean column;
    // other designations filter against the ownershipDesignations jsonb array.
    if (ownership && typeof ownership === "string") {
      if (ownership === "black-owned") {
        conditions.push(eq(businessesTable.blackOwned, true));
      } else {
        conditions.push(
          sql`${businessesTable.ownershipDesignations} @> ${JSON.stringify([ownership])}::jsonb`
        );
      }
    }

    if (search && typeof search === "string") {
      const q = search.trim();
      const STOP = new Set(["a","an","the","and","or","of","in","at","on","for","to","with","is","by","near","best","good","great"]);
      const tokens = q
        .toLowerCase()
        .split(/\s+/)
        .map(t => t.replace(/[^a-z0-9'&-]/g, ""))
        .filter(t => t.length >= 2 && !STOP.has(t));
      if (tokens.length <= 1) {
        // Single token: standard substring match across all key fields
        conditions.push(
          or(
            ilike(businessesTable.name, `%${q}%`),
            ilike(businessesTable.city, `%${q}%`),
            ilike(businessesTable.category, `%${q}%`),
            ilike(businessesTable.subcategory, `%${q}%`),
            ilike(businessesTable.description, `%${q}%`),
          ),
        );
      } else {
        // Multi-token: satisfy ALL tokens in name (most precise), OR the full
        // phrase in any field. This catches "Pink Table" → both "pink" AND "table"
        // present in the name. Falls through to fuzzy if still zero results.
        const allInName = tokens.map(t => ilike(businessesTable.name, `%${t}%`));
        const allInDesc = tokens.map(t => ilike(businessesTable.description, `%${t}%`));
        conditions.push(
          or(
            and(...allInName),                                          // all tokens in name
            and(...allInDesc),                                          // all tokens in description
            ilike(businessesTable.name, `%${q}%`),                     // full phrase in name
            ilike(businessesTable.description, `%${q}%`),              // full phrase in description
            ilike(businessesTable.category, `%${q}%`),                 // full phrase in category
            ilike(businessesTable.subcategory, `%${q}%`),              // full phrase in subcategory
          ),
        );
      }
    }

    if (city && typeof city === "string") {
      conditions.push(ilike(businessesTable.city, `%${city}%`));
    }

    if (state && typeof state === "string") {
      conditions.push(ilike(businessesTable.state, `%${state}%`));
    }

    if (country && typeof country === "string") {
      conditions.push(ilike(businessesTable.country, `%${country}%`));
    }

    if (subcategory && typeof subcategory === "string") {
      conditions.push(ilike(businessesTable.subcategory, `%${subcategory}%`));
    }

    if (handle && typeof handle === "string") {
      const h = handle.replace(/^@/, "");
      conditions.push(
        or(
          ilike(businessesTable.instagram, `%${h}%`),
          ilike(businessesTable.tiktok, `%${h}%`),
          ilike(businessesTable.twitter, `%${h}%`),
          ilike(businessesTable.facebook, `%${h}%`),
        ),
      );
    }

    // Geo-proximity filter — Haversine great-circle distance (server-side, miles)
    // Only applied when lat + lng are both provided; radius defaults to 25 miles.
    if (hasGeoFilter) {
      const radiusKm = geoRadiusMi * 1.60934;
      conditions.push(
        sql`(
          6371.0 * 2.0 * ASIN(SQRT(
            POWER(SIN((RADIANS(${businessesTable.latitude}::float) - RADIANS(${geoLat})) / 2.0), 2) +
            COS(RADIANS(${geoLat})) * COS(RADIANS(${businessesTable.latitude}::float)) *
            POWER(SIN((RADIANS(${businessesTable.longitude}::float) - RADIANS(${geoLng})) / 2.0), 2)
          ))
        ) <= ${radiusKm}`,
      );
    }

    // True total count for pagination UI
    const [{ total: totalCount }] = await db
      .select({ total: count() })
      .from(businessesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const businesses = await db
      .select()
      .from(businessesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        desc(businessesTable.foundingBusiness),
        desc(businessesTable.confidenceScore),
      )
      .limit(pageLimit)
      .offset(offset);

    // Annotate businesses that have active growth-tool promotions as featured.
    // Only businesses that already matched the search criteria are promoted —
    // no injecting off-topic results.
    const now = new Date();
    const activePromos = await db
      .select({ businessId: businessPromotionsTable.businessId, type: businessPromotionsTable.type })
      .from(businessPromotionsTable)
      .where(
        and(
          eq(businessPromotionsTable.status, "active"),
          gt(businessPromotionsTable.endsAt, now),
        ),
      );
    const promotedIdToType = new Map(activePromos.map((p) => [p.businessId, p.type]));

    // Load caller's cultural preference to boost matching businesses
    let callerPrefs: string[] = [];
    if (culturalPreference && typeof culturalPreference === "string") {
      callerPrefs = [culturalPreference];
    } else if (req.user?.id) {
      try {
        const [prefs] = await db
          .select({ preferredOwnershipTypes: userPreferencesTable.preferredOwnershipTypes })
          .from(userPreferencesTable)
          .where(eq(userPreferencesTable.userId, req.user.id))
          .limit(1);
        callerPrefs = (prefs?.preferredOwnershipTypes as string[] | null) ?? [];
      } catch { /* silent — non-fatal */ }
    }

    const matchesPref = (b: { ownershipDesignations: string[] }) =>
      callerPrefs.length > 0 &&
      callerPrefs.some((p) => (b.ownershipDesignations ?? []).includes(p));

    const annotated = businesses
      .map((b) => ({
        ...b,
        featured: b.featured || promotedIdToType.has(b.id),
        promotionType: promotedIdToType.get(b.id) ?? null,
        culturalMatch: matchesPref(b as any),
      }))
      .sort((a, b) => {
        // 1. Active promotions / featured first (paid bump always wins top slot)
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        // 2. Business membership tier: premium > growth > community
        //    Even promoted businesses show real reviews — tier only affects slot order
        const TIER_RANK: Record<string, number> = { premium: 3, growth: 2, community: 1 };
        const aTier = TIER_RANK[(a as any).businessStatus] ?? 1;
        const bTier = TIER_RANK[(b as any).businessStatus] ?? 1;
        if (bTier !== aTier) return bTier - aTier;
        // 3. Cultural preference match
        if (a.culturalMatch && !b.culturalMatch) return -1;
        if (!a.culturalMatch && b.culturalMatch) return 1;
        // 4. Founding members
        if (b.foundingBusiness !== a.foundingBusiness) return b.foundingBusiness ? 1 : -1;
        // 5. Popularity: confidence score + rating × log(reviewCount+1) boost
        const aScore = (a.confidenceScore ?? 0) + Number((a as any).rating ?? 0) * Math.log(Number((a as any).reviewCount ?? 0) + 1) * 0.1;
        const bScore = (b.confidenceScore ?? 0) + Number((b as any).rating ?? 0) * Math.log(Number((b as any).reviewCount ?? 0) + 1) * 0.1;
        return bScore - aScore;
      });

    const featuredCount = annotated.filter((b) => b.featured).length;

    const bIds = annotated.map((b) => b.id);
    const captionMap = new Map<string, string[]>();
    if (bIds.length > 0) {
      const capRows = await db
        .select({ businessId: businessCaptionsTable.businessId, caption: businessCaptionsTable.caption })
        .from(businessCaptionsTable)
        .where(inArray(businessCaptionsTable.businessId, bIds))
        .orderBy(desc(businessCaptionsTable.createdAt))
        .limit(bIds.length * 3);
      for (const row of capRows) {
        const list = captionMap.get(row.businessId) ?? [];
        if (list.length < 2) { list.push(row.caption); captionMap.set(row.businessId, list); }
      }
    }
    const withCaptions = annotated.map((b) => ({ ...b, topCaptions: captionMap.get(b.id) ?? [] }));

    // ── Fuzzy name fallback — trigram similarity via pg_trgm ─────────────────
    // When a name search returns zero results, try:
    //  1. Per-token ILIKE or trigram similarity (multi-word queries)
    //  2. Full-phrase trigram similarity (single-word or short queries)
    // Falls back silently if pg_trgm is absent.
    let finalResults = withCaptions;
    if (search && typeof search === "string" && withCaptions.length === 0) {
      try {
        const cleanSearch = search.replace(/[^\w\s'-]/gi, " ").trim();
        const STOP = ["a","an","the","and","or","of","in","at","on","for","to","with","is","by","near","best","good","great"];
        const tokens = cleanSearch
          .toLowerCase()
          .split(/\s+/)
          .map(t => t.replace(/[^a-z0-9'&-]/g, ""))
          .filter(t => t.length >= 3 && !STOP.includes(t));

        let fuzzyRes: { rows: Record<string, unknown>[] } = { rows: [] };

        if (tokens.length > 1) {
          // Multi-token fuzzy: any significant token matches by ILIKE or trigram
          const orClauses = tokens.flatMap((t, i) => [
            `b.name ILIKE $${i + 2}`,
            `similarity(LOWER(b.name), LOWER($${tokens.length + i + 2})) > 0.18`,
          ]).join(" OR ");
          const simCols = tokens.map((_, i) => `similarity(LOWER(b.name), LOWER($${tokens.length + i + 2}))`).join(", ");
          const params: unknown[] = [cleanSearch, ...tokens.map(t => `%${t}%`), ...tokens];
          const r = await pool.query<Record<string, unknown>>(
            `SELECT b.*, GREATEST(${simCols}) AS _sim_score
             FROM businesses b
             WHERE b.status = 'active' AND (${orClauses})
             ORDER BY _sim_score DESC, b.confidence_score DESC
             LIMIT 20`,
            params,
          );
          fuzzyRes = r;
        }

        // Always try full-phrase similarity too (catches misspellings)
        if (fuzzyRes.rows.length === 0) {
          fuzzyRes = await pool.query<Record<string, unknown>>(
            `SELECT b.*, similarity(LOWER(b.name), LOWER($1)) AS _sim_score
             FROM businesses b
             WHERE b.status = 'active'
               AND similarity(LOWER(b.name), LOWER($1)) > 0.22
             ORDER BY _sim_score DESC
             LIMIT 15`,
            [cleanSearch],
          );
        }

        if (fuzzyRes.rows.length > 0) {
          finalResults = fuzzyRes.rows.map((r) => ({
            ...r,
            topCaptions: [],
            featured: false,
            promotionType: null,
            culturalMatch: false,
          })) as typeof withCaptions;
        }
      } catch { /* pg_trgm not available — fine */ }
    }

    // When a geo filter was applied, annotate each result with its distance in miles
    const withDistance = hasGeoFilter
      ? finalResults.map((b) => {
          const bLat = parseFloat(String((b as any).latitude ?? "0"));
          const bLng = parseFloat(String((b as any).longitude ?? "0"));
          if (isNaN(bLat) || isNaN(bLng)) return { ...b, distanceMi: null };
          const R = 3958.8; // Earth radius in miles
          const dLat = (bLat - geoLat!) * Math.PI / 180;
          const dLng = (bLng - geoLng!) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(geoLat! * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
          const distanceMi = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return { ...b, distanceMi: Math.round(distanceMi * 10) / 10 };
        })
      : finalResults;

    res.json({ businesses: withDistance, total: Number(totalCount), page: { offset, limit: pageLimit }, featuredCount: withDistance.filter((b: any) => b.featured).length });
    }, req.log, "GET /businesses");
  } catch (err) {
    req.log.error({ err }, "Failed to fetch businesses");
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

// GET /businesses/mention-search?q= — lightweight name search for the @ mention picker
router.get("/businesses/mention-search", async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) { res.json({ businesses: [] }); return; }
    const result = await pool.query<{ id: string; name: string; category: string | null; city: string | null }>(
      `SELECT id, name, category, city FROM businesses
       WHERE name ILIKE $1
         AND listing_status IN ('live_unclaimed', 'live_claimed')
       ORDER BY name
       LIMIT 8`,
      [`%${q}%`]
    );
    res.json({ businesses: result.rows });
  } catch (err) {
    req.log.error({ err }, "mention-search failed");
    res.status(500).json({ businesses: [] });
  }
});

router.post("/businesses/search-inquiry", async (req: any, res: Response) => {
  try {
    const { businessName, city, state, handle, category, contactEmail, contactHandle, notes } = req.body as {
      businessName: string;
      city?: string;
      state?: string;
      handle?: string;
      category?: string;
      contactEmail?: string;
      contactHandle?: string;
      notes?: string;
    };

    if (!businessName?.trim()) {
      res.status(400).json({ error: "businessName is required" });
      return;
    }

    const searcherUserId = req.user?.id ?? null;

    await db.insert(businessSearchInquiriesTable).values({
      businessName: businessName.trim(),
      city: city?.trim() || null,
      state: state?.trim() || null,
      handle: handle?.trim() || null,
      category: category?.trim() || null,
      contactEmail: contactEmail?.trim() || null,
      contactHandle: contactHandle?.trim() || null,
      searcherUserId,
      notes: notes?.trim() || null,
    });

    await sendSearchInquiryAlert({ businessName, city, state, handle, category, contactEmail, contactHandle });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save search inquiry");
    res.status(500).json({ error: "Failed to save search inquiry" });
  }
});

router.get("/businesses/founding/stats", async (req: Request, res: Response) => {
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessesTable)
      .where(eq(businessesTable.foundingBusiness, true));
    const count = row?.count ?? 0;
    const spots = 500;
    res.json({ count, spots, remaining: Math.max(0, spots - count), isFull: count >= spots });
  } catch (err) {
    req.log.error({ err }, "Failed to get founding stats");
    res.status(500).json({ error: "Failed to get founding stats" });
  }
});

router.get("/businesses/mine", async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ business: null });
      return;
    }
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, userId))
      .limit(1);
    res.json({ business: business ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user business");
    res.status(500).json({ error: "Failed to fetch business" });
  }
});

router.patch("/businesses/mine/profile", async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const VALID_CATEGORIES = ALL_VALID_CATEGORY_NAMES;

  const { name, category, subcategory, description, phone, website, hours, instagram, tiktok, facebook, twitter, youtube, pinterest, primarySocialPlatform, businessTagline, ownerName, ownerBio, ownerStory } = req.body as {
    name?: string; category?: string; subcategory?: string; description?: string;
    phone?: string | null; website?: string | null; hours?: string | null;
    instagram?: string | null; tiktok?: string | null; facebook?: string | null;
    twitter?: string | null; youtube?: string | null;
    pinterest?: string | null; primarySocialPlatform?: string | null;
    businessTagline?: string | null; ownerName?: string | null;
    ownerBio?: string | null; ownerStory?: string | null;
  };

  if (category && !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: "Invalid category" }); return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name?.trim()) updates.name = name.trim();
  if (category) { updates.category = category; updates.subcategory = subcategory?.trim() || category; }
  if (description !== undefined) updates.description = description.trim();
  if (phone !== undefined) updates.phone = phone?.trim() || null;
  if (website !== undefined) updates.website = website?.trim() || null;
  if (hours !== undefined) updates.hours = hours?.trim() || null;
  if (instagram !== undefined) updates.instagram = instagram?.trim() || null;
  if (tiktok !== undefined) updates.tiktok = tiktok?.trim() || null;
  if (facebook !== undefined) updates.facebook = facebook?.trim() || null;
  if (twitter !== undefined) updates.twitter = twitter?.trim() || null;
  if (youtube !== undefined) updates.youtube = youtube?.trim() || null;
  if (pinterest !== undefined) updates.pinterest = pinterest?.trim() || null;
  if (primarySocialPlatform !== undefined) updates.primarySocialPlatform = primarySocialPlatform || null;
  if (businessTagline !== undefined) updates.businessTagline = businessTagline?.trim() || null;
  if (ownerName !== undefined) updates.ownerName = ownerName?.trim() || null;
  if (ownerBio !== undefined) updates.ownerBio = ownerBio?.trim() || null;
  if (ownerStory !== undefined) updates.ownerStory = ownerStory?.trim() || null;

  try {
    const [updated] = await db
      .update(businessesTable)
      .set(updates)
      .where(eq(businessesTable.submittedById, String(userId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Business not found" }); return; }
    res.json({ business: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update business profile");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/businesses/mine/photos", photoUpload.single("photo"), async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!req.file) { res.status(400).json({ error: "No photo provided" }); return; }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, photos: businessesTable.photos, pendingPhotos: businessesTable.pendingPhotos })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const currentPhotos = (business.photos as string[]) ?? [];
    const currentPending = (business.pendingPhotos as string[]) ?? [];
    if (currentPhotos.length + currentPending.length >= 10) {
      res.status(400).json({ error: "Maximum of 10 photos allowed (including those pending review)" }); return;
    }

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Object storage not configured" }); return; }

    const { originalname, mimetype, buffer } = req.file;
    const ext = originalname.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext) ? ext : "jpg";
    const objectKey = `business-photos-pending/${business.id}/${randomUUID()}.${safeExt}`;

    const bucket = objectStorageClient.bucket(bucketId);
    const gcsFile = bucket.file(objectKey);
    await gcsFile.save(buffer, { contentType: mimetype });
    await gcsFile.makePublic();

    const photoUrl = `https://storage.googleapis.com/${bucketId}/${objectKey}`;
    const updatedPending = [...currentPending, photoUrl];

    await db
      .update(businessesTable)
      .set({ pendingPhotos: updatedPending, updatedAt: new Date() })
      .where(eq(businessesTable.id, business.id));

    res.status(201).json({
      url: photoUrl,
      pending: true,
      message: "Photo submitted for review. It will appear on your profile once approved.",
      photos: currentPhotos,
      pendingPhotos: updatedPending,
      imageUrl: currentPhotos[0] ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to upload business photo");
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

// Admin: list all businesses with photos awaiting review
router.get("/admin/businesses/pending-photos", async (req: any, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }
  try {
    const businesses = await db
      .select({ id: businessesTable.id, name: businessesTable.name, pendingPhotos: businessesTable.pendingPhotos, blackOwned: businessesTable.blackOwned })
      .from(businessesTable)
      .where(sql`jsonb_array_length(pending_photos) > 0`);
    res.json({ businesses });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch pending photos");
    res.status(500).json({ error: "Failed to fetch pending photos" });
  }
});

// Admin: approve a pending photo — moves it into the live photos array
router.post("/admin/businesses/:id/photos/approve", async (req: any, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }
  const businessId = String(req.params.id);
  const { url } = req.body as { url?: string };
  if (!url) { res.status(400).json({ error: "url is required" }); return; }
  try {
    const [business] = await db
      .select({ photos: businessesTable.photos, pendingPhotos: businessesTable.pendingPhotos, imageUrl: businessesTable.imageUrl })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }
    const pending = (business.pendingPhotos as string[]) ?? [];
    if (!pending.includes(url)) { res.status(400).json({ error: "URL not found in pending photos" }); return; }
    const approved = (business.photos as string[]) ?? [];
    const newPending = pending.filter((p) => p !== url);
    const newApproved = [...approved, url];
    const isFirst = approved.length === 0;
    const [updated] = await db
      .update(businessesTable)
      .set({ photos: newApproved, pendingPhotos: newPending, ...(isFirst ? { imageUrl: url } : {}), updatedAt: new Date() })
      .where(eq(businessesTable.id, businessId))
      .returning();
    res.json({ photos: updated.photos, pendingPhotos: updated.pendingPhotos, imageUrl: updated.imageUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to approve photo");
    res.status(500).json({ error: "Failed to approve photo" });
  }
});

// Admin: reject a pending photo — removes it from the queue and deletes from storage
router.post("/admin/businesses/:id/photos/reject", async (req: any, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }
  const businessId = String(req.params.id);
  const { url } = req.body as { url?: string };
  if (!url) { res.status(400).json({ error: "url is required" }); return; }
  try {
    const [business] = await db
      .select({ pendingPhotos: businessesTable.pendingPhotos })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }
    const pending = (business.pendingPhotos as string[]) ?? [];
    const newPending = pending.filter((p) => p !== url);
    await db.update(businessesTable).set({ pendingPhotos: newPending, updatedAt: new Date() }).where(eq(businessesTable.id, businessId));
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId && url.includes(`storage.googleapis.com/${bucketId}/`)) {
      const objectKey = url.split(`storage.googleapis.com/${bucketId}/`)[1];
      if (objectKey) objectStorageClient.bucket(bucketId).file(objectKey).delete().catch(() => {});
    }
    res.json({ ok: true, pendingPhotos: newPending });
  } catch (err) {
    req.log.error({ err }, "Failed to reject photo");
    res.status(500).json({ error: "Failed to reject photo" });
  }
});

router.delete("/businesses/mine/photos", async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { url } = req.body as { url?: string };
  if (!url) { res.status(400).json({ error: "photo url is required" }); return; }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, photos: businessesTable.photos, imageUrl: businessesTable.imageUrl })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const currentPhotos = (business.photos as string[]) ?? [];
    const updatedPhotos = currentPhotos.filter((p) => p !== url);
    const newImageUrl = business.imageUrl === url ? (updatedPhotos[0] ?? null) : business.imageUrl;

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId && url.includes(`storage.googleapis.com/${bucketId}/`)) {
      const objectKey = url.split(`storage.googleapis.com/${bucketId}/`)[1];
      if (objectKey) {
        objectStorageClient.bucket(bucketId).file(objectKey).delete().catch(() => {});
      }
    }

    const [updated] = await db
      .update(businessesTable)
      .set({ photos: updatedPhotos, imageUrl: newImageUrl, updatedAt: new Date() })
      .where(eq(businessesTable.id, business.id))
      .returning();

    res.json({ photos: updated.photos, imageUrl: updated.imageUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to delete business photo");
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

router.patch("/businesses/mine/photos/cover", async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { url } = req.body as { url?: string };
  if (!url) { res.status(400).json({ error: "photo url is required" }); return; }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, photos: businessesTable.photos })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const currentPhotos = (business.photos as string[]) ?? [];
    if (!currentPhotos.includes(url)) {
      res.status(400).json({ error: "Photo not found in your gallery" }); return;
    }

    const [updated] = await db
      .update(businessesTable)
      .set({ imageUrl: url, updatedAt: new Date() })
      .where(eq(businessesTable.id, business.id))
      .returning();

    res.json({ imageUrl: updated.imageUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to set cover photo");
    res.status(500).json({ error: "Failed to set cover photo" });
  }
});

router.post("/businesses/mine/videos", videoUpload.single("video"), async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!req.file) { res.status(400).json({ error: "No video provided" }); return; }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, videos: businessesTable.videos })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const currentVideos = (business.videos as string[]) ?? [];
    if (currentVideos.length >= 5) {
      res.status(400).json({ error: "Maximum of 5 videos allowed" }); return;
    }

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Object storage not configured" }); return; }

    const { originalname, mimetype, buffer } = req.file;
    const ext = originalname.split(".").pop()?.toLowerCase() ?? "mp4";
    const safeExt = ["mp4", "mov", "avi", "webm", "mkv", "m4v"].includes(ext) ? ext : "mp4";
    const objectKey = `business-videos/${business.id}/${randomUUID()}.${safeExt}`;

    const bucket = objectStorageClient.bucket(bucketId);
    const gcsFile = bucket.file(objectKey);
    await gcsFile.save(buffer, { contentType: mimetype });
    await gcsFile.makePublic();

    const videoUrl = `https://storage.googleapis.com/${bucketId}/${objectKey}`;
    const updatedVideos = [...currentVideos, videoUrl];

    const [updated] = await db
      .update(businessesTable)
      .set({ videos: updatedVideos, updatedAt: new Date() })
      .where(eq(businessesTable.id, business.id))
      .returning();

    res.status(201).json({ url: videoUrl, videos: updated.videos });
  } catch (err) {
    req.log.error({ err }, "Failed to upload business video");
    res.status(500).json({ error: "Failed to upload video" });
  }
});

router.post("/businesses/mine/videos/link", async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { url } = req.body as { url?: string };
  if (!url?.trim()) { res.status(400).json({ error: "url is required" }); return; }

  const ALLOWED_HOSTS = ["youtube.com", "youtu.be", "tiktok.com", "instagram.com", "facebook.com", "fb.watch", "vimeo.com"];
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    if (!ALLOWED_HOSTS.some((h) => hostname.includes(h))) {
      res.status(400).json({ error: "Only YouTube, TikTok, Instagram, Facebook, and Vimeo links are accepted" }); return;
    }
  } catch {
    res.status(400).json({ error: "Invalid URL" }); return;
  }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, videos: businessesTable.videos })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const currentVideos = (business.videos as string[]) ?? [];
    if (currentVideos.length >= 5) {
      res.status(400).json({ error: "Maximum of 5 videos allowed" }); return;
    }
    if (currentVideos.includes(url.trim())) {
      res.status(409).json({ error: "This link is already added" }); return;
    }

    const [updated] = await db
      .update(businessesTable)
      .set({ videos: [...currentVideos, url.trim()], updatedAt: new Date() })
      .where(eq(businessesTable.id, business.id))
      .returning();

    res.status(201).json({ url: url.trim(), videos: updated.videos });
  } catch (err) {
    req.log.error({ err }, "Failed to add video link");
    res.status(500).json({ error: "Failed to add link" });
  }
});

router.delete("/businesses/mine/videos", async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { url } = req.body as { url?: string };
  if (!url) { res.status(400).json({ error: "url is required" }); return; }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, videos: businessesTable.videos })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const updatedVideos = ((business.videos as string[]) ?? []).filter((v) => v !== url);

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId && url.includes(`storage.googleapis.com/${bucketId}/`)) {
      const objectKey = url.split(`storage.googleapis.com/${bucketId}/`)[1];
      if (objectKey) objectStorageClient.bucket(bucketId).file(objectKey).delete().catch(() => {});
    }

    const [updated] = await db
      .update(businessesTable)
      .set({ videos: updatedVideos, updatedAt: new Date() })
      .where(eq(businessesTable.id, business.id))
      .returning();

    res.json({ videos: updated.videos });
  } catch (err) {
    req.log.error({ err }, "Failed to delete video");
    res.status(500).json({ error: "Failed to delete video" });
  }
});

// ─── POST /businesses/mine/intro-video — upload hosted owner intro (≤2 min) ──
const introVideoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 }, // 120 MB ≈ 2 min at standard quality
  fileFilter: (_req, file, cb) => { cb(null, file.mimetype.startsWith("video/")); },
});

router.post("/businesses/mine/intro-video", introVideoUpload.single("video"), async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!req.file) { res.status(400).json({ error: "Video file is required" }); return; }

  try {
    const [business] = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Object storage not configured" }); return; }

    const ext = (req.file.originalname.split(".").pop() ?? "mp4").toLowerCase();
    const objectKey = `businesses/${business.id}/intro-video.${ext}`;
    const file = objectStorageClient.bucket(bucketId).file(objectKey);
    await file.save(req.file.buffer, { contentType: req.file.mimetype, resumable: false });

    const introVideoUrl = `https://storage.googleapis.com/${bucketId}/${objectKey}`;
    const [updated] = await db
      .update(businessesTable)
      .set({ introVideoUrl, updatedAt: new Date() })
      .where(eq(businessesTable.id, business.id))
      .returning();

    res.json({ introVideoUrl: updated.introVideoUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to upload intro video");
    res.status(500).json({ error: "Failed to upload intro video" });
  }
});

// ─── DELETE /businesses/mine/intro-video — remove hosted intro video ──────────
router.delete("/businesses/mine/intro-video", async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [business] = await db.select({ id: businessesTable.id, introVideoUrl: businessesTable.introVideoUrl }).from(businessesTable).where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId && business.introVideoUrl?.includes(`storage.googleapis.com/${bucketId}/`)) {
      const objectKey = business.introVideoUrl.split(`storage.googleapis.com/${bucketId}/`)[1];
      if (objectKey) objectStorageClient.bucket(bucketId).file(objectKey).delete().catch(() => {});
    }

    await db.update(businessesTable).set({ introVideoUrl: null, updatedAt: new Date() }).where(eq(businessesTable.id, business.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete intro video");
    res.status(500).json({ error: "Failed to delete intro video" });
  }
});

// ─── POST /businesses/mine/featured-video/upload — host community intro video ──
const featuredVideoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (_req, file, cb) => { cb(null, file.mimetype.startsWith("video/")); },
});

router.post("/businesses/mine/featured-video/upload", featuredVideoUpload.single("video"), async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!req.file) { res.status(400).json({ error: "Video file is required" }); return; }

  try {
    const [business] = await db.select({ id: businessesTable.id, featuredVideoTitle: businessesTable.featuredVideoTitle, featuredVideoPurpose: businessesTable.featuredVideoPurpose })
      .from(businessesTable).where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Object storage not configured" }); return; }

    const ext = (req.file.originalname.split(".").pop() ?? "mp4").toLowerCase();
    const objectKey = `businesses/${business.id}/featured-video.${ext}`;
    const gcsFile = objectStorageClient.bucket(bucketId).file(objectKey);
    await gcsFile.save(req.file.buffer, { contentType: req.file.mimetype, resumable: false });

    const featuredVideoUrl = `https://storage.googleapis.com/${bucketId}/${objectKey}`;
    const [updated] = await db
      .update(businessesTable)
      .set({ featuredVideoUrl, updatedAt: new Date() })
      .where(eq(businessesTable.id, business.id))
      .returning();

    res.json({ featuredVideoUrl: updated.featuredVideoUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to upload featured video");
    res.status(500).json({ error: "Failed to upload featured video" });
  }
});

// ─── DELETE /businesses/mine/featured-video/hosted — remove hosted featured video
router.delete("/businesses/mine/featured-video/hosted", async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [business] = await db.select({ id: businessesTable.id, featuredVideoUrl: businessesTable.featuredVideoUrl })
      .from(businessesTable).where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId && business.featuredVideoUrl?.includes(`storage.googleapis.com/${bucketId}/`)) {
      const objectKey = business.featuredVideoUrl.split(`storage.googleapis.com/${bucketId}/`)[1];
      if (objectKey) objectStorageClient.bucket(bucketId).file(objectKey).delete().catch(() => {});
    }

    await db.update(businessesTable)
      .set({ featuredVideoUrl: null, updatedAt: new Date() })
      .where(eq(businessesTable.id, business.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete hosted featured video");
    res.status(500).json({ error: "Failed to delete hosted featured video" });
  }
});

// ─── PATCH /businesses/mine/weekly-schedule — set calendar availability ────────
router.patch("/businesses/mine/weekly-schedule", async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { weeklySchedule, showAvailability } = req.body as {
    weeklySchedule?: Record<string, { open: string; close: string } | null>;
    showAvailability?: boolean;
  };

  try {
    const [business] = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.submittedById, String(userId)));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (weeklySchedule !== undefined) updates.weeklySchedule = weeklySchedule;
    if (showAvailability !== undefined) updates.showAvailability = showAvailability;

    const [updated] = await db.update(businessesTable).set(updates).where(eq(businessesTable.id, business.id)).returning();
    res.json({ weeklySchedule: updated.weeklySchedule, showAvailability: updated.showAvailability });
  } catch (err) {
    req.log.error({ err }, "Failed to update weekly schedule");
    res.status(500).json({ error: "Failed to update schedule" });
  }
});

router.get("/businesses/:id", async (req: Request, res: Response) => {
  // Public read — guests can view business details.
  // Write interactions (save, vibe, review) check auth individually at point of use.
  try {
    const id = String(req.params.id);
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, id));

    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    // Fetch Trust Profile identity fields (non-blocking)
    const [identity] = await db
      .select({
        audienceType: businessIdentityTable.audienceType,
        ageRestrictionReasons: businessIdentityTable.ageRestrictionReasons,
        environmentTags: businessIdentityTable.environmentTags,
        amenityTags: businessIdentityTable.amenityTags,
      })
      .from(businessIdentityTable)
      .where(eq(businessIdentityTable.businessId, id))
      .limit(1)
      .catch(() => []);

    const userId = (req as any).user?.id as string | undefined;
    // Fire-and-forget: skip tracking if user has opted out
    void (async () => {
      if (userId) {
        const [settings] = await db
          .select({ profileViewTrackingEnabled: userSettingsTable.profileViewTrackingEnabled })
          .from(userSettingsTable)
          .where(eq(userSettingsTable.userId, userId))
          .limit(1)
          .catch(() => []);
        if (settings?.profileViewTrackingEnabled === false) return;
      }
      db.insert(businessProfileViewsTable)
        .values({ businessId: id, userId: userId ?? null })
        .execute()
        .catch(() => {});
    })();

    res.json({
      business: {
        ...business,
        // Normalize array fields so the web/mobile clients always receive [] not null.
        // photos and pendingPhotos are jsonb columns that default to [] but can be null
        // in older rows that pre-date the column addition.
        photos: Array.isArray(business.photos) ? business.photos : [],
        pendingPhotos: Array.isArray(business.pendingPhotos) ? business.pendingPhotos : [],
        audienceType: identity?.audienceType ?? "unknown",
        ageRestrictionReasons: identity?.ageRestrictionReasons ?? [],
        environmentTags: identity?.environmentTags ?? [],
        amenityTags: identity?.amenityTags ?? [],
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch business");
    res.status(500).json({ error: "Failed to fetch business" });
  }
});

// ── Community Reference listing (verified members only) ───────────────────────
// Adds a non-minority-owned org as a community-sourced reference.
// The business is NEVER promoted, featured, or notified by the platform.
router.post("/businesses/community-reference", async (req: any, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { name, referenceCategory, description, city, state, website, address } =
      req.body as Record<string, unknown>;

    if (!name || !city || !state) {
      res.status(400).json({ error: "name, city, and state are required" });
      return;
    }

    const VALID_CATEGORIES = ["employer", "mentor", "service", "travel", "general"];
    const cat = typeof referenceCategory === "string" ? referenceCategory : "general";
    if (!VALID_CATEGORIES.includes(cat)) {
      res.status(400).json({ error: `referenceCategory must be one of: ${VALID_CATEGORIES.join(", ")}` });
      return;
    }

    const id = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const [business] = await db
      .insert(businessesTable)
      .values({
        id,
        name: (name as string).trim(),
        category: cat,
        subcategory: cat,
        description: typeof description === "string" ? description.trim() : "",
        address: typeof address === "string" ? address.trim() : "",
        city: (city as string).trim(),
        state: (state as string).trim(),
        latitude: "0",
        longitude: "0",
        blackOwned: false,
        isReferenceOnly: true,
        referenceCategory: cat,
        website: typeof website === "string" ? website.trim() : null,
        status: "active",
        submittedById: req.user.id,
        ownershipDesignations: ["non-minority-owned"],
        featured: false,
        verified: false,
        promotionEligible: false,
        feedbackOptIn: false,
      })
      .returning();

    req.log.info({ businessId: business.id, submittedBy: req.user.id }, "Community reference listing created");
    res.status(201).json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to create community reference listing");
    res.status(500).json({ error: "Failed to create reference listing" });
  }
});

// ── POST /businesses/suggest-place — member-facing "Add a Place" ──────────────
// Any approved member can submit a new place (restaurant, venue, salon, temple, etc.)
// on any continent.  Geocodes the address server-side, returns the canonical business
// ID so the client can immediately route to the contribution flow.
router.post("/businesses/suggest-place", async (req: any, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { name, category, subcategory, city, state, country, address, description, website } =
      req.body as Record<string, string | undefined>;

    if (!name?.trim() || !category?.trim() || !city?.trim()) {
      res.status(400).json({ error: "name, category, and city are required" });
      return;
    }

    // ── Soft duplicate check (name + city, case-insensitive) ─────────────────
    const dupeRows = await pool.query(
      `SELECT id, name, city FROM businesses
       WHERE LOWER(name) = LOWER($1) AND LOWER(city) = LOWER($2) AND status != 'removed'
       LIMIT 1`,
      [name.trim(), city.trim()]
    );
    if (dupeRows.rows.length > 0) {
      const existing = dupeRows.rows[0] as { id: string; name: string; city: string };
      res.status(409).json({
        error: "A place with this name already exists in this city.",
        existingId: existing.id,
        existingName: existing.name,
      });
      return;
    }

    // ── Geocode via Google Maps Geocoding API ─────────────────────────────────
    let lat = "0";
    let lng = "0";
    const geoQuery = [address?.trim(), city.trim(), state?.trim(), country?.trim()]
      .filter(Boolean).join(", ");
    const gmKey = process.env.GOOGLE_MAPS_API_KEY;
    if (gmKey && geoQuery) {
      try {
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(geoQuery)}&key=${gmKey}`;
        const geoResp = await fetch(geoUrl);
        const geoData = await geoResp.json() as any;
        if (geoData.status === "OK" && geoData.results?.[0]?.geometry?.location) {
          lat = String(geoData.results[0].geometry.location.lat);
          lng = String(geoData.results[0].geometry.location.lng);
        }
      } catch {
        // geocoding failure is non-fatal — place is still created, pins at 0,0
      }
    }

    const id = `place_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const resolvedCategory = category.trim();
    const resolvedSubcategory = subcategory?.trim() || resolvedCategory;
    const resolvedState = state?.trim() || null;
    // Infer country: if state looks like a US code and no country given, default to USA
    const resolvedCountry = country?.trim() ||
      (resolvedState && resolvedState.length <= 2 ? "USA" : null);
    const resolvedDescription = description?.trim() ||
      `Community-submitted place in ${city.trim()}${resolvedCountry && resolvedCountry !== "USA" ? `, ${resolvedCountry}` : ""}.`;
    const resolvedAddress = address?.trim() || city.trim();

    const insertValues: Record<string, unknown> = {
      id,
      name: name.trim(),
      category: resolvedCategory,
      subcategory: resolvedSubcategory,
      description: resolvedDescription,
      address: resolvedAddress,
      city: city.trim(),
      latitude: lat,
      longitude: lng,
      blackOwned: false,
      isReferenceOnly: false,
      status: "active",
      // live_unclaimed makes the place immediately visible to all approved members
      listingStatus: "live_unclaimed",
      verified: false,
      featured: false,
      promotionEligible: false,
      feedbackOptIn: false,
      submittedById: req.user.id,
      ownershipDesignations: [],
    };
    if (resolvedState) insertValues.state = resolvedState;
    if (resolvedCountry) insertValues.country = resolvedCountry;
    if (website?.trim()) insertValues.website = website.trim();

    const [business] = await db
      .insert(businessesTable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .values(insertValues as any)
      .returning();

    req.log.info(
      { businessId: business.id, submittedBy: req.user.id, city, country: resolvedCountry },
      "Member-submitted place created"
    );
    res.status(201).json({ businessId: business.id, name: business.name, isNew: true });
  } catch (err) {
    req.log.error({ err }, "Failed to create member-submitted place");
    res.status(500).json({ error: "Failed to create place. Please try again." });
  }
});

// ── GET /businesses/duplicate-check — 4-step soft-match for submissions & claims ──
router.get("/businesses/duplicate-check", async (req: Request, res: Response) => {
  if (!(req as any).user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { name, address, city, state } = req.query as Record<string, string>;
  if (!name || !city || !state) {
    res.status(400).json({ error: "name, city, and state are required" }); return;
  }
  try {
    // Step 1: exact match (name + address + city + state)
    const exactParams: unknown[] = [name.trim(), city.trim(), state.trim()];
    let exactWhere = `LOWER(name)=LOWER($1) AND LOWER(city)=LOWER($2) AND LOWER(state)=LOWER($3)`;
    if (address?.trim()) { exactParams.push(address.trim()); exactWhere += ` AND LOWER(address)=LOWER($4)`; }
    const exact = await pool.query(`SELECT id, name, address, city, state, listing_status FROM businesses WHERE ${exactWhere} LIMIT 5`, exactParams);

    // Step 2: same address, any name (possible rename / new tenant)
    const sameAddr = address?.trim()
      ? await pool.query(`SELECT id, name, address, city, state, listing_status FROM businesses WHERE LOWER(address)=LOWER($1) AND LOWER(city)=LOWER($2) AND LOWER(state)=LOWER($3) LIMIT 10`, [address.trim(), city.trim(), state.trim()])
      : { rows: [] };

    // Step 3: same name, same city — could be separate legitimate locations
    const sameName = await pool.query(
      `SELECT id, name, address, city, state, listing_status FROM businesses WHERE LOWER(name)=LOWER($1) AND LOWER(city)=LOWER($2) AND LOWER(state)=LOWER($3) LIMIT 10`,
      [name.trim(), city.trim(), state.trim()]
    );

    // Step 4: fuzzy name at same address (possible rebrand / typo) — pg_trgm similarity
    const fuzzy = address?.trim()
      ? await pool.query(
          `SELECT id, name, address, city, state, listing_status, similarity(LOWER(name), LOWER($1)) AS score
           FROM businesses
           WHERE LOWER(address)=LOWER($2) AND LOWER(city)=LOWER($3) AND LOWER(state)=LOWER($4)
             AND similarity(LOWER(name), LOWER($1)) > 0.5
           ORDER BY score DESC LIMIT 5`,
          [name.trim(), address.trim(), city.trim(), state.trim()]
        ).catch(() => ({ rows: [] }))  // pg_trgm may not be installed
      : { rows: [] };

    const isDuplicate = exact.rows.length > 0 && !!address?.trim();
    res.json({
      isDuplicate,
      step1_exactMatch: exact.rows,
      step2_sameAddress: sameAddr.rows,
      step3_sameName: sameName.rows,
      step4_fuzzy: fuzzy.rows,
      recommendation: isDuplicate
        ? "reject"
        : exact.rows.length > 0
          ? "flag_address"
          : sameName.rows.length > 0
            ? "allow_separate"
            : "allow",
    });
  } catch (err) {
    req.log.error({ err }, "duplicate-check failed");
    res.status(500).json({ error: "Duplicate check failed" });
  }
});

router.post("/businesses", async (req: Request, res: Response) => {
  try {
    const {
      name, category, description, address, city, state,
      phone, website, priceRange, hours, customHours, tags, isBlackOwned,
    } = req.body as Record<string, unknown>;

    if (!name || !category || !address || !city || !state) {
      res.status(400).json({ error: "name, category, address, city, and state are required" });
      return;
    }

    // ── 4-step duplicate detection ────────────────────────────────────────────
    // Step 1: hard reject on exact (name + address + city + state) match
    const exactDup = await pool.query(
      `SELECT id, name FROM businesses
       WHERE LOWER(name)=LOWER($1) AND LOWER(address)=LOWER($2)
         AND LOWER(city)=LOWER($3) AND LOWER(state)=LOWER($4) LIMIT 1`,
      [String(name).trim(), String(address).trim(), String(city).trim(), String(state).trim()]
    );
    if (exactDup.rows.length > 0) {
      res.status(409).json({
        error: "This listing already exists.",
        duplicate: exactDup.rows[0],
        step: 1,
      });
      return;
    }

    // Step 2: same address, different name → flag for admin review (allow but mark)
    const addrDup = await pool.query(
      `SELECT id, name FROM businesses
       WHERE LOWER(address)=LOWER($1) AND LOWER(city)=LOWER($2) AND LOWER(state)=LOWER($3) LIMIT 3`,
      [String(address).trim(), String(city).trim(), String(state).trim()]
    );
    const needsAddressReview = addrDup.rows.length > 0;

    // Step 3: same name, same city, different address → ALLOW (separate location)
    // Step 4: fuzzy name at same address → flag (best-effort, non-blocking)
    const fuzzyFlag = await pool.query(
      `SELECT id, name FROM businesses
       WHERE LOWER(address)=LOWER($1) AND LOWER(city)=LOWER($2) AND LOWER(state)=LOWER($3)
         AND LOWER(name) != LOWER($4)
         AND (similarity(LOWER(name), LOWER($4)) > 0.85)
       LIMIT 3`,
      [String(address).trim(), String(city).trim(), String(state).trim(), String(name).trim()]
    ).catch(() => ({ rows: [] }));
    const needsFuzzyReview = fuzzyFlag.rows.length > 0;

    const finalHours =
      hours === "Custom"
        ? (customHours as string | undefined) ?? null
        : (hours as string | undefined) ?? null;
    const tagArray =
      Array.isArray(tags)
        ? (tags as string[])
        : typeof tags === "string"
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    let referredByCode: string | null = null;
    if (req.user?.id) {
      const [submitter] = await db.select({ referredByCode: usersTable.referredByCode }).from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
      referredByCode = submitter?.referredByCode ?? null;
    }

    // Determine listing_status: live_unclaimed if the city is already launched, else staged
    const cityLaunchRow = await pool.query(
      `SELECT status FROM city_launches WHERE LOWER(city)=LOWER($1) AND LOWER(state)=LOWER($2) LIMIT 1`,
      [String(city).trim(), String(state).trim()]
    );
    const cityIsLive = ["live", "soft_launch"].includes(cityLaunchRow.rows[0]?.status ?? "");
    const listingStatus = cityIsLive ? "live_unclaimed" : "staged";

    const [business] = await db
      .insert(businessesTable)
      .values({
        id,
        name: name as string,
        category: category as string,
        subcategory: category as string,
        description: (description as string | undefined) ?? "",
        address: address as string,
        city: city as string,
        state: state as string,
        latitude: "0",
        longitude: "0",
        tags: tagArray,
        phone: (phone as string | undefined) ?? null,
        website: (website as string | undefined) ?? null,
        hours: finalHours,
        priceRange: (priceRange as string | undefined) ?? null,
        blackOwned: isBlackOwned === true || isBlackOwned === "true",
        status: "pending",
        submittedById: req.user?.id ?? null,
        referredByCode,
      })
      .returning();

    // Set listing_status and data_source (columns added via migration, not in Drizzle schema)
    await pool.query(
      `UPDATE businesses SET listing_status=$1, data_source='community_submission' WHERE id=$2`,
      [listingStatus, business.id]
    );

    res.status(201).json({
      business: { ...business, listingStatus },
      warnings: {
        needsAddressReview,
        needsFuzzyReview,
        sameAddressBusinesses: addrDup.rows,
        fuzzyMatches: fuzzyFlag.rows,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit business listing");
    res.status(500).json({ error: "Failed to submit listing" });
  }
});

router.patch("/businesses/:id/status", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!isAdmin(req)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const id = String(req.params.id);
    const { status } = req.body as { status?: string };

    const allowed = ["active", "rejected", "pending", "suspended"];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
      return;
    }

    const [existing] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const [business] = await db
      .update(businessesTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning();

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to update business status");
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.post("/businesses/:id/view", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id ?? null;
    await db.insert(businessProfileViewsTable).values({ businessId: id, userId });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to record business view");
    res.status(500).json({ error: "Failed to record view" });
  }
});

router.post("/businesses/:id/click", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { clickType } = req.body as { clickType: string };
    const userId = req.user?.id ?? null;
    const VALID_TYPES = [
      "tiktok_visit", "instagram_visit", "youtube_visit", "facebook_visit",
      "pinterest_visit", "website_visit", "phone_call", "directions",
    ];
    if (!VALID_TYPES.includes(clickType)) {
      res.status(400).json({ error: "Invalid click type" }); return;
    }
    await db.insert(businessClickEventsTable).values({ businessId: id, userId, clickType });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to record business click");
    res.status(500).json({ error: "Failed to record click" });
  }
});

// ── Community Reference: outbound link click tracking ─────────────────────────
router.post("/businesses/:id/reference-link-click", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id ?? null;
    const { source, sourceId, referrerUserId } = req.body as {
      source?: string;
      sourceId?: string;
      referrerUserId?: string;
    };
    const VALID_SOURCES = ["community_post", "saved_space", "search", "business_profile", "map", "direct"];
    const resolvedSource = source && VALID_SOURCES.includes(source) ? source : "direct";

    await db.insert(referenceLinkClicksTable).values({
      businessId: id,
      userId,
      source: resolvedSource,
      sourceId: sourceId ?? null,
      referrerUserId: referrerUserId ?? null,
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to record reference link click");
    res.status(500).json({ error: "Failed to record click" });
  }
});

// ── Community Reference: funnel analytics ─────────────────────────────────────
router.get("/businesses/:id/reference-analytics", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    // Total profile views
    const [viewsRow] = await db
      .select({ total: count() })
      .from(businessProfileViewsTable)
      .where(eq(businessProfileViewsTable.businessId, id));

    // Total outbound link clicks
    const [clicksRow] = await db
      .select({ total: count() })
      .from(referenceLinkClicksTable)
      .where(eq(referenceLinkClicksTable.businessId, id));

    // Clicks broken down by source
    const bySource = await db
      .select({ source: referenceLinkClicksTable.source, total: count() })
      .from(referenceLinkClicksTable)
      .where(eq(referenceLinkClicksTable.businessId, id))
      .groupBy(referenceLinkClicksTable.source);

    // Top 5 community members who drove clicks (referrerUserId)
    const topReferrers = await db
      .select({
        referrerUserId: referenceLinkClicksTable.referrerUserId,
        total: count(),
      })
      .from(referenceLinkClicksTable)
      .where(
        and(
          eq(referenceLinkClicksTable.businessId, id),
          sql`${referenceLinkClicksTable.referrerUserId} IS NOT NULL`
        )
      )
      .groupBy(referenceLinkClicksTable.referrerUserId)
      .orderBy(desc(count()))
      .limit(5);

    // Daily click trend — last 30 days
    const dailyTrend = await db
      .select({
        day: sql<string>`DATE(${referenceLinkClicksTable.clickedAt})`.as("day"),
        total: count(),
      })
      .from(referenceLinkClicksTable)
      .where(
        and(
          eq(referenceLinkClicksTable.businessId, id),
          gt(referenceLinkClicksTable.clickedAt, sql`NOW() - INTERVAL '30 days'`)
        )
      )
      .groupBy(sql`DATE(${referenceLinkClicksTable.clickedAt})`)
      .orderBy(sql`DATE(${referenceLinkClicksTable.clickedAt})`);

    res.json({
      totalViews: viewsRow?.total ?? 0,
      totalLinkClicks: clicksRow?.total ?? 0,
      clicksBySource: bySource,
      topReferrers,
      dailyTrend,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch reference analytics");
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.patch("/businesses/:id/address", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

    const id = String(req.params.id);
    const [existing] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Business not found" }); return; }

    const isOwner = existing.submittedById === req.user.id;
    if (!isOwner && !isAdmin(req)) { res.status(403).json({ error: "Access denied" }); return; }

    const { address, city, state, zip } = req.body as { address?: string; city?: string; state?: string; zip?: string };
    if (!address?.trim() || !city?.trim() || !state?.trim()) {
      res.status(400).json({ error: "address, city, and state are required" }); return;
    }

    const oldAddress = `${existing.address}, ${existing.city}, ${existing.state}`;
    const newAddress = `${address.trim()}, ${city.trim()}, ${state.trim()}${zip ? ` ${zip.trim()}` : ""}`;

    const [business] = await db
      .update(businessesTable)
      .set({ address: address.trim(), city: city.trim(), state: state.trim(), updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning();

    void sendAddressUpdateNotifications(id, existing.name, oldAddress, newAddress);

    res.json({ business, notified: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update business address");
    res.status(500).json({ error: "Failed to update address" });
  }
});

router.patch("/businesses/:id/badges", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }

    const id = String(req.params.id);
    const { currentLocationSince, businessFoundedDate, trustBadges } = req.body as {
      currentLocationSince?: string | null;
      businessFoundedDate?: string | null;
      trustBadges?: string[];
    };

    const [existing] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Business not found" }); return; }

    const [business] = await db
      .update(businessesTable)
      .set({
        currentLocationSince: currentLocationSince ?? null,
        businessFoundedDate: businessFoundedDate ?? null,
        trustBadges: Array.isArray(trustBadges) ? trustBadges : existing.trustBadges,
        updatedAt: new Date(),
      })
      .where(eq(businessesTable.id, id))
      .returning();

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to update business badges");
    res.status(500).json({ error: "Failed to update badges" });
  }
});

router.post("/businesses/:id/seller-agreement", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

    const id = String(req.params.id);
    const [existing] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Business not found" }); return; }

    const isOwner = existing.submittedById === req.user.id;
    if (!isOwner && !isAdmin(req)) { res.status(403).json({ error: "Access denied" }); return; }

    const acceptedAt = new Date();
    const [business] = await db
      .update(businessesTable)
      .set({ sellerAgreementAcceptedAt: acceptedAt, updatedAt: acceptedAt })
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id, sellerAgreementAcceptedAt: businessesTable.sellerAgreementAcceptedAt });

    res.json({ acceptedAt: business.sellerAgreementAcceptedAt });
  } catch (err) {
    req.log.error({ err }, "Failed to record seller agreement");
    res.status(500).json({ error: "Failed to record agreement" });
  }
});

router.patch("/businesses/:id/policy", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

    const id = String(req.params.id);
    const [existing] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Business not found" }); return; }

    const isOwner = existing.submittedById === req.user.id;
    if (!isOwner && !isAdmin(req)) { res.status(403).json({ error: "Access denied" }); return; }

    const { returnPolicy } = req.body as { returnPolicy?: string };

    const [business] = await db
      .update(businessesTable)
      .set({ returnPolicy: returnPolicy?.trim() ?? null, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning();

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to update return policy");
    res.status(500).json({ error: "Failed to update policy" });
  }
});

router.patch("/admin/businesses/:id/founding-status", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
    const id = String(req.params.id);
    const { founding } = req.body as { founding?: boolean };
    if (typeof founding !== "boolean") {
      res.status(400).json({ error: "founding must be true or false" }); return;
    }

    let foundingNumber: number | null = null;
    if (founding) {
      const [maxRow] = await db
        .select({ max: sql<number>`coalesce(max(founding_number), 0)::int` })
        .from(businessesTable);
      foundingNumber = (maxRow?.max ?? 0) + 1;
    }

    const [biz] = await db
      .update(businessesTable)
      .set({
        foundingBusiness: founding,
        foundingNumber: founding ? foundingNumber : null,
        foundingGrantedAt: founding ? new Date() : null,
        marketplaceTier: founding ? "premium" : undefined,
        updatedAt: new Date(),
      })
      .where(eq(businessesTable.id, id))
      .returning({
        id: businessesTable.id,
        name: businessesTable.name,
        foundingBusiness: businessesTable.foundingBusiness,
        foundingNumber: businessesTable.foundingNumber,
        foundingGrantedAt: businessesTable.foundingGrantedAt,
        marketplaceTier: businessesTable.marketplaceTier,
      });

    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    res.json(biz);

    // Async post-approval tasks: welcome email + DocuSign agreement
    if (founding && biz.foundingNumber) {
      void (async () => {
        try {
          const [fullBiz] = await db
            .select({ submittedById: businessesTable.submittedById })
            .from(businessesTable).where(eq(businessesTable.id, biz.id)).limit(1);
          if (!fullBiz?.submittedById) return;
          const [owner] = await db
            .select({ email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName })
            .from(usersTable).where(eq(usersTable.id, fullBiz.submittedById)).limit(1);
          if (!owner?.email) return;

          // Send founding welcome email immediately — non-fatal, does not block DocuSign
          void sendFoundingWelcomeEmail(owner.email, owner.firstName, biz.name, biz.foundingNumber!)
            .catch((emailErr: unknown) => req.log.error({ emailErr }, "Founding welcome email failed — non-fatal"));

          // DocuSign founding agreement — separate try/catch so email always fires
          try {
            const ownerName = [owner.firstName, owner.lastName].filter(Boolean).join(" ") || owner.email;
            const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "";
            const returnUrl = `https://${domain}/api/docusign/signed?type=founding_agreement&businessId=${biz.id}`;
            const { envelopeId } = await createFoundingAgreementEnvelope({
              businessId: biz.id,
              businessName: biz.name,
              ownerName,
              foundingNumber: biz.foundingNumber!,
              signerEmail: owner.email,
              clientUserId: fullBiz.submittedById,
              returnUrl,
            });
            await db.insert(docusignEnvelopesTable).values({
              envelopeId,
              businessId: biz.id,
              userId: fullBiz.submittedById,
              type: "founding_agreement",
              status: "sent",
              signerEmail: owner.email,
              signerName: ownerName,
            }).onConflictDoNothing();
          } catch (dsErr) {
            req.log.error({ dsErr }, "DocuSign founding agreement async trigger failed — non-fatal");
          }
        } catch (err) {
          req.log.error({ err }, "Founding async post-approval tasks failed — non-fatal");
        }
      })();
    }
  } catch (err) {
    req.log.error({ err }, "Failed to update founding status");
    res.status(500).json({ error: "Failed to update founding status" });
  }
});

// Flat-tier fee schedule (matches connect.ts TIER_FEES)
const FEE_SCHEDULE_DISPLAY = [
  { tier: "free",    label: "Free",    rate: 6, note: "standard listing" },
  { tier: "growth",  label: "Growth",  rate: 5, note: "growing businesses" },
  { tier: "premium", label: "Premium", rate: 3, note: "established sellers" },
];
const FOUNDING_RATE_PERCENT = 3;
const FOUNDING_WINDOW_MS = 3 * 365.25 * 24 * 60 * 60 * 1000; // 3 years
const BUSINESS_TRIAL_DAYS = 180; // 6-month business premium trial
const BUSINESS_TRIAL_MS = BUSINESS_TRIAL_DAYS * 24 * 60 * 60 * 1000;
const TIER_LABELS: Record<string, string> = { free: "Free", growth: "Growth", premium: "Premium" };
const VALID_TIERS = ["free", "growth", "premium"];

router.get("/businesses/:id/marketplace-tier", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
    const id = String(req.params.id);
    const [biz] = await db
      .select({
        id: businessesTable.id,
        submittedById: businessesTable.submittedById,
        marketplaceTier: businessesTable.marketplaceTier,
        foundingBusiness: businessesTable.foundingBusiness,
        foundingGrantedAt: businessesTable.foundingGrantedAt,
        businessTrialStartedAt: businessesTable.businessTrialStartedAt,
      })
      .from(businessesTable).where(eq(businessesTable.id, id)).limit(1);
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    if (biz.submittedById !== req.user.id && !isAdmin(req)) { res.status(403).json({ error: "Access denied" }); return; }

    // Auto-start 180-day business premium trial if not yet started
    let trialStartedAt = biz.businessTrialStartedAt;
    if (!trialStartedAt) {
      trialStartedAt = new Date();
      await db.update(businessesTable)
        .set({ businessTrialStartedAt: trialStartedAt, updatedAt: new Date() })
        .where(eq(businessesTable.id, id));
    }
    const trialEndsAt = new Date(trialStartedAt.getTime() + BUSINESS_TRIAL_MS);
    const trialActive = Date.now() < trialEndsAt.getTime();
    const trialDaysLeft = trialActive ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0;

    const tier = biz.marketplaceTier ?? "free";

    // Check founding status (3-year rate lock)
    let foundingActive = false;
    let foundingExpiresAt: Date | null = null;
    let foundingPremiumUntil: Date | null = null;
    if (biz.foundingBusiness && biz.foundingGrantedAt) {
      const elapsed = Date.now() - new Date(biz.foundingGrantedAt).getTime();
      if (elapsed < FOUNDING_WINDOW_MS) {
        foundingActive = true;
        foundingExpiresAt = new Date(new Date(biz.foundingGrantedAt).getTime() + FOUNDING_WINDOW_MS);
      }
      // Founding businesses get 6 months of premium features from grant date
      const FOUNDING_PREMIUM_MS = 180 * 24 * 60 * 60 * 1000;
      foundingPremiumUntil = new Date(new Date(biz.foundingGrantedAt).getTime() + FOUNDING_PREMIUM_MS);
    }

    res.json({
      tier,
      label: TIER_LABELS[tier] ?? "Free",
      feePercent: foundingActive ? FOUNDING_RATE_PERCENT : null,
      foundingActive,
      foundingExpiresAt: foundingExpiresAt?.toISOString() ?? null,
      foundingPremiumUntil: foundingPremiumUntil?.toISOString() ?? null,
      feeSchedule: FEE_SCHEDULE_DISPLAY,
      trialActive,
      trialEndsAt: trialEndsAt.toISOString(),
      trialDaysLeft,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get marketplace tier");
    res.status(500).json({ error: "Failed to get marketplace tier" });
  }
});

router.patch("/admin/businesses/:id/marketplace-tier", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
    const id = String(req.params.id);
    const { tier } = req.body as { tier?: string };
    if (!tier || !VALID_TIERS.includes(tier)) {
      res.status(400).json({ error: `tier must be one of: ${VALID_TIERS.join(", ")}` });
      return;
    }
    const [biz] = await db
      .update(businessesTable)
      .set({ marketplaceTier: tier, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id, marketplaceTier: businessesTable.marketplaceTier });
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    res.json({ id: biz.id, tier: biz.marketplaceTier, feeSchedule: FEE_SCHEDULE_DISPLAY });
  } catch (err) {
    req.log.error({ err }, "Failed to update marketplace tier");
    res.status(500).json({ error: "Failed to update marketplace tier" });
  }
});

// ── Admin: list pending business submissions ──────────────────────────────────
router.get("/admin/businesses/pending", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
    const { rows } = await pool.query<{
      id: string; name: string; category: string | null;
      city: string | null; state: string | null;
      submitted_by_id: string | null; created_at: string;
      founding_business: boolean;
      submitter_first_name: string | null; submitter_last_name: string | null;
      submitter_email: string | null;
    }>(
      `SELECT b.id, b.name, b.category, b.city, b.state,
              b.submitted_by_id, b.created_at, b.founding_business,
              u.first_name AS submitter_first_name,
              u.last_name  AS submitter_last_name,
              u.email      AS submitter_email
       FROM businesses b
       LEFT JOIN users u ON u.id = b.submitted_by_id
       WHERE b.status = 'pending'
       ORDER BY b.created_at DESC`
    );
    res.json(rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      city: r.city,
      state: r.state,
      submittedById: r.submitted_by_id,
      createdAt: r.created_at,
      foundingBusiness: r.founding_business,
      submittedBy: r.submitter_first_name
        ? [r.submitter_first_name, r.submitter_last_name].filter(Boolean).join(" ")
        : (r.submitter_email ?? "Unknown"),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch pending businesses");
    res.status(500).json({ error: "Failed to fetch pending businesses" });
  }
});

// ── Admin: approve or reject a business submission ────────────────────────────
router.patch("/admin/businesses/:id/status", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
    const id = String(req.params.id);
    const { status } = req.body as { status?: string };
    const ALLOWED = ["active", "approved", "rejected", "pending", "suspended"];
    if (!status || !ALLOWED.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${ALLOWED.join(", ")}` }); return;
    }
    const [biz] = await db
      .update(businessesTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id, name: businessesTable.name, status: businessesTable.status });
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    res.json(biz);
  } catch (err) {
    req.log.error({ err }, "Failed to update business status");
    res.status(500).json({ error: "Failed to update business status" });
  }
});

// ── Community Dispute System ──────────────────────────────────────────────────
// POST /businesses/:id/dispute — community member flags a business as fake/misrepresented
// Inserts a content_report (reason: "fake") and atomically increments flag_count.
// At threshold 3, flag_status transitions to "under_review".
router.post("/businesses/:id/dispute", reportLimiter, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }

  const businessId = String(req.params.id);
  const { description } = req.body as { description?: string };

  try {
    // Check business exists
    const { rows: biz } = await pool.query<{ id: string; name: string; flag_count: number; flag_status: string }>(
      "SELECT id, name, flag_count, flag_status FROM businesses WHERE id = $1",
      [businessId],
    );
    if (!biz.length) { res.status(404).json({ error: "Business not found" }); return; }

    // Check user hasn't already filed a dispute for this business
    const { rows: existing } = await pool.query<{ id: string }>(
      "SELECT id FROM content_reports WHERE reporter_id = $1 AND target_type = 'business' AND target_id = $2 AND reason = 'fake'",
      [user.id, businessId],
    );
    if (existing.length) {
      res.status(409).json({ error: "You have already flagged this business" }); return;
    }

    // Insert the content report
    await pool.query(
      "INSERT INTO content_reports (id, reporter_id, target_type, target_id, reason, description, status) VALUES (gen_random_uuid(), $1, 'business', $2, 'fake', $3, 'pending')",
      [user.id, businessId, description?.slice(0, 1000) ?? null],
    );

    // Atomically increment flag_count and conditionally promote to under_review
    const DISPUTE_THRESHOLD = 3;
    const { rows: updated } = await pool.query<{ flag_count: number; flag_status: string }>(
      `UPDATE businesses
       SET flag_count = flag_count + 1,
           flag_status = CASE
             WHEN flag_count + 1 >= $1 AND flag_status = 'none' THEN 'under_review'
             ELSE flag_status
           END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING flag_count, flag_status`,
      [DISPUTE_THRESHOLD, businessId],
    );

    const newStatus = updated[0]?.flag_status ?? "none";
    const newCount = updated[0]?.flag_count ?? 0;

    res.status(201).json({ flagCount: newCount, flagStatus: newStatus });
  } catch (err) {
    req.log.error({ err }, "Failed to submit business dispute");
    res.status(500).json({ error: "Failed to submit dispute" });
  }
});

// GET /admin/businesses/disputed — list businesses under review or confirmed fake
router.get("/admin/businesses/disputed", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  try {
    const { rows } = await pool.query<{
      id: string; name: string; category: string | null; city: string | null;
      state: string | null; flag_count: number; flag_status: string; created_at: string;
      report_count: string;
    }>(
      `SELECT b.id, b.name, b.category, b.city, b.state, b.flag_count, b.flag_status, b.created_at,
              COUNT(cr.id) AS report_count
       FROM businesses b
       LEFT JOIN content_reports cr ON cr.target_id = b.id AND cr.target_type = 'business' AND cr.reason = 'fake'
       WHERE b.flag_status IN ('under_review', 'confirmed_fake')
       GROUP BY b.id
       ORDER BY b.flag_count DESC, b.created_at DESC`,
    );
    res.json({ businesses: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch disputed businesses");
    res.status(500).json({ error: "Failed to fetch disputed businesses" });
  }
});

// ─── PATCH /admin/businesses/:id/profile ─────────────────────────────────────
// Admin-only: update any field on any business — including social media handles,
// ownership designations, vibes, description, and contact info — regardless of
// whether the business has been claimed by an owner.
router.patch("/admin/businesses/:id/profile", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  const id = String(req.params.id);
  try {
    const {
      name, description, address, city, state, latitude, longitude,
      phone, website, hours, priceRange,
      instagram, tiktok, facebook, twitter, youtube, pinterest, primarySocialPlatform,
      ownerName, businessTagline, ownerBio, ownerStory,
      ownershipDesignations, blackOwned, vibes, tags, category, subcategory,
    } = req.body as Record<string, unknown>;

    // Only include keys explicitly provided in the request body (no accidental nulling)
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (address !== undefined) patch.address = address;
    if (city !== undefined) patch.city = city;
    if (state !== undefined) patch.state = state;
    if (latitude !== undefined) patch.latitude = latitude;
    if (longitude !== undefined) patch.longitude = longitude;
    if (phone !== undefined) patch.phone = phone;
    if (website !== undefined) patch.website = website;
    if (hours !== undefined) patch.hours = hours;
    if (priceRange !== undefined) patch.priceRange = priceRange;
    if (instagram !== undefined) patch.instagram = instagram;
    if (tiktok !== undefined) patch.tiktok = tiktok;
    if (facebook !== undefined) patch.facebook = facebook;
    if (twitter !== undefined) patch.twitter = twitter;
    if (youtube !== undefined) patch.youtube = youtube;
    if (pinterest !== undefined) patch.pinterest = pinterest;
    if (primarySocialPlatform !== undefined) patch.primarySocialPlatform = primarySocialPlatform;
    if (ownerName !== undefined) patch.ownerName = ownerName;
    if (businessTagline !== undefined) patch.businessTagline = businessTagline;
    if (ownerBio !== undefined) patch.ownerBio = ownerBio;
    if (ownerStory !== undefined) patch.ownerStory = ownerStory;
    if (ownershipDesignations !== undefined) patch.ownershipDesignations = ownershipDesignations;
    if (blackOwned !== undefined) patch.blackOwned = blackOwned;
    if (vibes !== undefined) patch.vibes = vibes;
    if (tags !== undefined) patch.tags = tags;
    if (category !== undefined) patch.category = category;
    if (subcategory !== undefined) patch.subcategory = subcategory;

    if (Object.keys(patch).length === 1) {
      res.status(400).json({ error: "No updatable fields provided" }); return;
    }

    const [biz] = await db
      .update(businessesTable)
      .set(patch as Parameters<ReturnType<typeof db.update>["set"]>[0])
      .where(eq(businessesTable.id, id))
      .returning({
        id: businessesTable.id, name: businessesTable.name, instagram: businessesTable.instagram,
        tiktok: businessesTable.tiktok, facebook: businessesTable.facebook, twitter: businessesTable.twitter,
        youtube: businessesTable.youtube, pinterest: businessesTable.pinterest,
        ownershipDesignations: businessesTable.ownershipDesignations, blackOwned: businessesTable.blackOwned,
        vibes: businessesTable.vibes, status: businessesTable.status,
      });

    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    res.json({ business: biz });
  } catch (err) {
    req.log.error({ err }, "Failed to update business profile");
    res.status(500).json({ error: "Failed to update business profile" });
  }
});

// ─── POST /admin/seed-known-businesses ────────────────────────────────────────
// Idempotent: inserts well-known community businesses that are not yet in the DB.
// Protected by admin session OR CRON_SECRET header.
// Any business listed here goes in as active + unclaimed (submittedById = null).
router.post("/admin/seed-known-businesses", async (req: Request, res: Response) => {
  const cronOk = req.headers["x-cron-secret"] === process.env.CRON_SECRET;
  if (!isAdmin(req) && !cronOk) { res.status(403).json({ error: "Admin required" }); return; }

  const KNOWN: Array<{
    name: string; category: string; subcategory: string; address: string; city: string; state: string;
    latitude: string; longitude: string; description: string; phone?: string; website?: string;
    instagram?: string; blackOwned: boolean; ownershipDesignations: string[]; tags: string[];
    priceRange?: string;
  }> = [
    {
      name: "Mama J's Kitchen",
      category: "Restaurant",
      subcategory: "Soul Food",
      address: "415 N 1st St",
      city: "Richmond",
      state: "VA",
      latitude: "37.5452",
      longitude: "-77.4388",
      description: "A Richmond institution serving classic soul food — fried chicken, catfish, smothered pork chops, and hand-rolled biscuits — in a warm, family-style setting that has anchored the community for over a decade.",
      phone: "(804) 225-7449",
      website: "https://mamajskitchen.net",
      instagram: "mamajskitchenrva",
      blackOwned: true,
      ownershipDesignations: ["black-owned"],
      tags: ["Soul Food", "Comfort Food", "Family Friendly", "Dine In", "Takeout", "Richmond Classic"],
      priceRange: "$$",
    },
    {
      name: "Hakim's Bookstore",
      category: "Retail",
      subcategory: "Bookstore",
      address: "210 W Girard Ave",
      city: "Philadelphia",
      state: "PA",
      latitude: "39.9682",
      longitude: "-75.1480",
      description: "Philadelphia's beloved Black-owned bookstore serving the community since 1959, stocking an unmatched selection of African American literature, history, culture, and children's books — operated by Mr. Hakim Rasul, a community institution in his own right.",
      website: "https://hakimsbookstore.com",
      blackOwned: true,
      ownershipDesignations: ["black-owned"],
      tags: ["Books", "African American Literature", "History", "Community", "Gifts", "Cultural"],
      priceRange: "$$",
    },
  ];

  const inserted: string[] = [];
  const skipped: string[] = [];

  for (const biz of KNOWN) {
    try {
      // Check if already exists by name + city (case-insensitive)
      const existing = await pool.query(
        "SELECT id FROM businesses WHERE LOWER(name) = LOWER($1) AND LOWER(city) = LOWER($2) LIMIT 1",
        [biz.name, biz.city],
      );
      if (existing.rows.length > 0) {
        // Already exists — ensure listing_status is live_unclaimed so it appears in search
        await pool.query(
          "UPDATE businesses SET listing_status = 'live_unclaimed' WHERE LOWER(name) = LOWER($1) AND LOWER(city) = LOWER($2)",
          [biz.name, biz.city],
        );
        skipped.push(biz.name);
        continue;
      }

      const newId = randomUUID();
      await pool.query(
        `INSERT INTO businesses
           (id, name, category, subcategory, address, city, state,
            latitude, longitude, description, phone, website, instagram,
            black_owned, ownership_designations, tags, price_range,
            status, listing_status, verified, featured,
            rating, review_count, confidence_score,
            vibes, reviews, photos, pending_photos, videos,
            trust_badges, verified_designations,
            business_status, flag_count, flag_status,
            marketplace_tier, show_availability, feedback_opt_in)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,
            $8,$9,$10,$11,$12,$13,
            $14,$15::jsonb,$16::jsonb,$17,
            'active','live_unclaimed',false,false,
            0,0,60,
            '[]'::jsonb,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,
            '[]'::jsonb,'[]'::jsonb,
            'community',0,'none',
            'free',false,false)
         ON CONFLICT (id) DO NOTHING`,
        [
          newId, biz.name, biz.category, biz.subcategory, biz.address, biz.city, biz.state,
          biz.latitude, biz.longitude, biz.description, biz.phone ?? null, biz.website ?? null, biz.instagram ?? null,
          biz.blackOwned, JSON.stringify(biz.ownershipDesignations), JSON.stringify(biz.tags), biz.priceRange ?? null,
        ],
      );
      inserted.push(biz.name);
    } catch (err) {
      req.log.error({ err, biz: biz.name }, "Failed to seed known business");
    }
  }

  res.json({ inserted, skipped, total: KNOWN.length });
});

// POST /admin/businesses/:id/clear-dispute — admin clears the dispute flag
router.post("/admin/businesses/:id/clear-dispute", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  const id = String(req.params.id);
  try {
    const [biz] = await db
      .update(businessesTable)
      .set({ flagCount: 0, flagStatus: "cleared", updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id, name: businessesTable.name });
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    // Dismiss all pending content reports for this business
    await pool.query(
      "UPDATE content_reports SET status = 'dismissed' WHERE target_id = $1 AND target_type = 'business' AND reason = 'fake' AND status = 'pending'",
      [id],
    );
    res.json({ business: biz, flagStatus: "cleared" });
  } catch (err) {
    req.log.error({ err }, "Failed to clear business dispute");
    res.status(500).json({ error: "Failed to clear dispute" });
  }
});

// ─── POST /admin/businesses/:id/photos/upload ────────────────────────────────
// Admin-direct photo upload. Goes straight to photos[] (skips pending queue).
// Accepts up to 10 files per request; enforces a total-photo limit of 20 per business.
router.post("/admin/businesses/:id/photos/upload", photoUpload.array("photos", 10), async (req: any, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  const id = String(req.params.id);
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) { res.status(400).json({ error: "No photos provided" }); return; }

  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) { res.status(500).json({ error: "Object storage not configured" }); return; }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, photos: businessesTable.photos })
      .from(businessesTable)
      .where(eq(businessesTable.id, id));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const currentPhotos = (business.photos as string[]) ?? [];
    if (currentPhotos.length + files.length > 20) {
      res.status(400).json({ error: `This business already has ${currentPhotos.length} photos. Maximum is 20.` }); return;
    }

    const bucket = objectStorageClient.bucket(bucketId);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext) ? ext : "jpg";
      const objectKey = `business-photos/${id}/${randomUUID()}.${safeExt}`;
      const gcsFile = bucket.file(objectKey);
      await gcsFile.save(file.buffer, { contentType: file.mimetype });
      await gcsFile.makePublic();
      uploadedUrls.push(`https://storage.googleapis.com/${bucketId}/${objectKey}`);
    }

    const updatedPhotos = [...currentPhotos, ...uploadedUrls];
    const [updated] = await db
      .update(businessesTable)
      .set({ photos: updatedPhotos, imageUrl: updatedPhotos[0] ?? null, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id, photos: businessesTable.photos, imageUrl: businessesTable.imageUrl });

    res.status(201).json({
      uploaded: uploadedUrls,
      photos: updated.photos,
      imageUrl: updated.imageUrl,
      message: `${uploadedUrls.length} photo${uploadedUrls.length !== 1 ? "s" : ""} added to business.`,
    });
  } catch (err) {
    req.log.error({ err }, "POST /admin/businesses/:id/photos/upload error");
    res.status(500).json({ error: "Photo upload failed. Please try again." });
  }
});

// ─── POST /admin/businesses/:id/photos/delete ─────────────────────────────────
// Remove a single photo from a business (by URL).
router.post("/admin/businesses/:id/photos/delete", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  const id = String(req.params.id);
  const { url } = req.body as { url?: string };
  if (!url?.trim()) { res.status(400).json({ error: "url is required" }); return; }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, photos: businessesTable.photos })
      .from(businessesTable)
      .where(eq(businessesTable.id, id));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const currentPhotos = (business.photos as string[]) ?? [];
    const updatedPhotos = currentPhotos.filter(p => p !== url);
    const [updated] = await db
      .update(businessesTable)
      .set({ photos: updatedPhotos, imageUrl: updatedPhotos[0] ?? null, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id, photos: businessesTable.photos });

    res.json({ photos: updated.photos });
  } catch (err) {
    req.log.error({ err }, "POST /admin/businesses/:id/photos/delete error");
    res.status(500).json({ error: "Could not remove photo." });
  }
});

// ─── POST /admin/businesses/:id/social-link ──────────────────────────────────
// Admin adds a social media post/video link to a business's videos[] array.
// Accepts links from Instagram, TikTok, YouTube, Facebook, Pinterest, Vimeo.
router.post("/admin/businesses/:id/social-link", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  const id = String(req.params.id);
  const { url } = req.body as { url?: string };
  if (!url?.trim()) { res.status(400).json({ error: "url is required" }); return; }

  const ALLOWED = ["youtube.com", "youtu.be", "tiktok.com", "instagram.com", "facebook.com", "fb.watch", "vimeo.com", "pinterest.com"];
  try {
    const hostname = new URL(url.trim()).hostname.replace("www.", "");
    if (!ALLOWED.some(h => hostname.includes(h))) {
      res.status(400).json({ error: "Supported platforms: YouTube, TikTok, Instagram, Facebook, Pinterest, Vimeo." }); return;
    }
  } catch {
    res.status(400).json({ error: "Invalid URL. Please paste the full link." }); return;
  }

  try {
    const [business] = await db
      .select({ id: businessesTable.id, videos: businessesTable.videos })
      .from(businessesTable)
      .where(eq(businessesTable.id, id));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const current = (business.videos as string[]) ?? [];
    if (current.includes(url.trim())) { res.status(409).json({ error: "This link is already added." }); return; }
    if (current.length >= 10) { res.status(400).json({ error: "Maximum of 10 social media links per business." }); return; }

    const [updated] = await db
      .update(businessesTable)
      .set({ videos: [...current, url.trim()], updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id, videos: businessesTable.videos });

    res.status(201).json({ videos: updated.videos, message: "Social link added." });
  } catch (err) {
    req.log.error({ err }, "POST /admin/businesses/:id/social-link error");
    res.status(500).json({ error: "Could not add social link." });
  }
});

// ─── GET /admin/businesses/check-duplicate ───────────────────────────────────
// Checks for possible duplicate businesses by name + city or address.
router.get("/admin/businesses/check-duplicate", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  const name = (req.query.name as string | undefined)?.trim().toLowerCase();
  const city = (req.query.city as string | undefined)?.trim().toLowerCase();
  const state = (req.query.state as string | undefined)?.trim().toLowerCase();
  const address = (req.query.address as string | undefined)?.trim().toLowerCase();

  if (!name && !address) { res.json({ duplicates: [] }); return; }

  try {
    const rows = await pool.query<{ id: string; name: string; city: string | null; state: string | null; address: string | null }>(
      `SELECT id, name, city, state, address FROM businesses
       WHERE status != 'deleted'
         AND (
           (lower(name) % $1 AND (city IS NULL OR lower(city) = $2))
           OR (address IS NOT NULL AND lower(address) % $3)
         )
       LIMIT 5`,
      [name ?? "", city ?? "", address ?? ""]
    );

    if (rows.rows.length === 0) { res.json({ duplicates: [] }); return; }
    res.json({
      duplicates: rows.rows,
      warning: `Found ${rows.rows.length} possible match${rows.rows.length !== 1 ? "es" : ""} — review before adding.`,
    });
  } catch {
    // pg_trgm similarity % may not be available — fall back to ILIKE
    try {
      const rows = await pool.query<{ id: string; name: string }>(
        `SELECT id, name FROM businesses
         WHERE status != 'deleted' AND lower(name) ILIKE $1
         LIMIT 5`,
        [`%${(name ?? "").replace(/%/g, "")}%`]
      );
      res.json({
        duplicates: rows.rows,
        warning: rows.rows.length > 0
          ? `Found ${rows.rows.length} possible match${rows.rows.length !== 1 ? "es" : ""} — review before adding.`
          : undefined,
      });
    } catch (err) {
      res.json({ duplicates: [] }); // Non-blocking
    }
  }
});

// ─── POST /admin/businesses ──────────────────────────────────────────────────
// Admin-only business creation. Saves with data_source='admin_entry'.
// Status defaults to 'active'. Listing status defaults to 'staged' (not public).
// Auto-geocodes the address if a street address + city + state are provided.
router.post("/admin/businesses", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }

  const {
    name, category, subcategory, description,
    address, city, state, zip, phone, email, website,
    hours, priceRange,
    instagram, facebook, tiktok, twitter, youtube, pinterest,
    ownershipDesignations, blackOwned, vibes, tags,
    adminNotes, listingStatus, country, province,
  } = req.body as {
    name?: string; category?: string; subcategory?: string; description?: string;
    address?: string; city?: string; state?: string; zip?: string;
    phone?: string; email?: string; website?: string;
    hours?: string; priceRange?: string;
    instagram?: string; facebook?: string; tiktok?: string;
    twitter?: string; youtube?: string; pinterest?: string;
    ownershipDesignations?: string[]; blackOwned?: boolean;
    vibes?: string[]; tags?: string[]; adminNotes?: string;
    listingStatus?: string; country?: string; province?: string;
  };

  if (!name?.trim()) { res.status(400).json({ error: "Business name is required." }); return; }
  if (!category?.trim()) { res.status(400).json({ error: "Category is required." }); return; }
  if (!city?.trim()) { res.status(400).json({ error: "City is required." }); return; }

  const VALID_LISTING_STATUSES = ["staged", "live_unclaimed", "live_claimed"];
  const finalListingStatus = VALID_LISTING_STATUSES.includes(listingStatus ?? "") ? listingStatus! : "staged";

  const id = randomUUID();

  // Auto-geocode if address provided
  let lat = "0";
  let lng = "0";
  const geoApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (geoApiKey && address?.trim() && city?.trim()) {
    try {
      const geoAddr = encodeURIComponent([address.trim(), city.trim(), province?.trim() || state?.trim(), country?.trim()].filter(Boolean).join(", "));
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${geoAddr}&key=${geoApiKey}`;
      const geoResp = await fetch(geoUrl);
      const geoData = await geoResp.json() as { results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }> };
      const loc = geoData.results?.[0]?.geometry?.location;
      if (loc) { lat = String(loc.lat); lng = String(loc.lng); }
    } catch {
      // Non-fatal — business saved with lat/lng=0; admin can geocode later
    }
  }

  try {
    // Use raw SQL so we can write email, zip, listing_status, data_source —
    // columns added via startup migration that are not yet in the Drizzle schema.
    await pool.query(
      `INSERT INTO businesses (
        id, name, category, subcategory, description,
        address, city, state, latitude, longitude,
        phone, website, hours, price_range,
        instagram, facebook, tiktok, twitter, youtube, pinterest,
        ownership_designations, black_owned, vibes, tags,
        status, submitted_by_id,
        email, zip, listing_status, data_source, country, province
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20,
        $21::text[], $22, $23::text[], $24::text[],
        'active', NULL,
        $25, $26, $27, 'admin_entry', $28, $29
      )`,
      [
        id, name.trim(), category.trim(), (subcategory ?? category).trim(), description?.trim() || "",
        address?.trim() || "", city.trim(), state?.trim() || null, lat, lng,
        phone?.trim() || null, website?.trim() || null, hours?.trim() || null, priceRange || null,
        instagram?.trim() || null, facebook?.trim() || null, tiktok?.trim() || null,
        twitter?.trim() || null, youtube?.trim() || null, pinterest?.trim() || null,
        ownershipDesignations ?? [],
        blackOwned ?? false,
        vibes ?? [],
        tags ?? [],
        email?.trim() || null, zip?.trim() || null, finalListingStatus,
        country?.trim() || null, province?.trim() || null,
      ]
    );

    // Create business_identity row so the business is fully structured
    await pool.query(
      `INSERT INTO business_identity (business_id, community_values, audiences_served, environment_tags, amenity_tags, accessibility_features)
       VALUES ($1, '{}'::text[], '{}'::text[], '{}'::text[], '{}'::text[], '{}'::text[])
       ON CONFLICT (business_id) DO NOTHING`,
      [id]
    );

    // Store admin notes in dedicated internal column — never appended to public description
    if (adminNotes?.trim()) {
      try {
        await pool.query(
          `UPDATE businesses SET admin_notes = $1 WHERE id = $2`,
          [adminNotes.trim(), id]
        );
      } catch { /* Non-fatal — column may not exist on older Railway instances until migration runs */ }
    }

    res.status(201).json({
      business: { id, name: name.trim(), listingStatus: finalListingStatus },
    });
  } catch (err) {
    req.log.error({ err }, "POST /admin/businesses error");
    res.status(500).json({ error: "Failed to create business. Please try again." });
  }
});

// POST /admin/businesses/:id/confirm-fake — admin confirms the business is fake
router.post("/admin/businesses/:id/confirm-fake", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  const id = String(req.params.id);
  try {
    const [biz] = await db
      .update(businessesTable)
      .set({ flagStatus: "confirmed_fake", status: "suspended", updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id, name: businessesTable.name });
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    await pool.query(
      "UPDATE content_reports SET status = 'actioned' WHERE target_id = $1 AND target_type = 'business' AND reason = 'fake' AND status = 'pending'",
      [id],
    );
    res.json({ business: biz, flagStatus: "confirmed_fake" });
  } catch (err) {
    req.log.error({ err }, "Failed to confirm business as fake");
    res.status(500).json({ error: "Failed to confirm fake" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY MEDIA CONTRIBUTIONS
// ─────────────────────────────────────────────────────────────────────────────

// GET /businesses/:id/contributions — public, returns approved contributions
router.get("/:id/contributions", async (req: Request, res: Response): Promise<void> => {
  const businessId = String(req.params.id);
  try {
    const rows = await pool.query<Record<string, unknown>>(
      `SELECT bc.id, bc.media_type, bc.source_type, bc.source_url, bc.caption,
              bc.attribution, bc.created_at,
              u.display_name AS contributor_name, u.profile_image_url AS contributor_avatar
       FROM business_contributions bc
       LEFT JOIN users u ON u.id = bc.user_id
       WHERE bc.business_id = $1 AND bc.status = 'approved' AND bc.is_public = TRUE
       ORDER BY bc.created_at DESC
       LIMIT 50`,
      [businessId],
    );
    res.json({ contributions: rows.rows });
  } catch (err) {
    req.log.error({ err }, "GET contributions failed");
    res.status(500).json({ error: "Failed to load contributions" });
  }
});

// POST /businesses/:id/contributions — authenticated, member submits social URL
router.post("/:id/contributions", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const businessId = String(req.params.id);
  const userId = (req as any).user?.id;
  if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }

  const { mediaType = "social_url", sourceType, sourceUrl, caption, attribution } = req.body ?? {};

  if (!sourceUrl || typeof sourceUrl !== "string") {
    res.status(400).json({ error: "sourceUrl is required" }); return;
  }

  // Validate URL
  try { new URL(sourceUrl); } catch {
    res.status(400).json({ error: "sourceUrl must be a valid URL (e.g. https://www.instagram.com/...)" }); return;
  }

  // Detect source type from URL if not provided
  let detectedType = sourceType ?? "other";
  if (!sourceType) {
    try {
      const host = new URL(sourceUrl).hostname.replace("www.", "");
      if (host.includes("instagram")) detectedType = "instagram";
      else if (host.includes("tiktok")) detectedType = "tiktok";
      else if (host.includes("youtube") || host.includes("youtu.be")) detectedType = "youtube";
      else if (host.includes("vimeo")) detectedType = "vimeo";
      else if (host.includes("facebook") || host.includes("fb.watch")) detectedType = "facebook";
      else if (host.includes("twitter") || host.includes("x.com")) detectedType = "twitter";
    } catch { /* ignore */ }
  }

  // Check business exists
  const biz = await pool.query("SELECT id, name FROM businesses WHERE id = $1 LIMIT 1", [businessId]);
  if (biz.rows.length === 0) { res.status(404).json({ error: "Business not found" }); return; }

  const id = randomUUID();
  try {
    await pool.query(
      `INSERT INTO business_contributions
         (id, business_id, user_id, media_type, source_type, source_url, caption, attribution, status, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', TRUE, NOW(), NOW())`,
      [id, businessId, userId, mediaType, detectedType, sourceUrl.trim(), caption?.trim() ?? null, attribution?.trim() ?? null],
    );
    res.status(201).json({
      contribution: { id, status: "pending", message: "Your contribution has been submitted and will appear after review — usually within 24 hours." },
    });
  } catch (err) {
    req.log.error({ err }, "POST contribution failed");
    res.status(500).json({ error: "Failed to submit contribution. Please try again." });
  }
});

// PATCH /admin/businesses/contributions/:id — admin approves or rejects
router.patch("/admin/contributions/:id", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  const id = String(req.params.id);
  const { status, rejectedReason } = req.body ?? {};
  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "status must be 'approved' or 'rejected'" }); return;
  }
  try {
    const r = await pool.query(
      `UPDATE business_contributions
       SET status=$1, rejected_reason=$2, moderated_by=$3,
           approved_at=CASE WHEN $1='approved' THEN NOW() ELSE NULL END,
           updated_at=NOW()
       WHERE id=$4 RETURNING id, status`,
      [status, rejectedReason ?? null, (req as any).user?.id ?? null, id],
    );
    if (r.rows.length === 0) { res.status(404).json({ error: "Contribution not found" }); return; }
    res.json({ contribution: r.rows[0] });
  } catch (err) {
    req.log.error({ err }, "PATCH contribution failed");
    res.status(500).json({ error: "Failed to update contribution" });
  }
});

// GET /admin/businesses/contributions — list pending for moderation
router.get("/admin/contributions", async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  const status = (req.query.status as string) ?? "pending";
  try {
    const r = await pool.query(
      `SELECT bc.*, b.name AS business_name, u.display_name AS contributor_name, u.email AS contributor_email
       FROM business_contributions bc
       LEFT JOIN businesses b ON b.id = bc.business_id
       LEFT JOIN users u ON u.id = bc.user_id
       WHERE bc.status = $1
       ORDER BY bc.created_at DESC
       LIMIT 100`,
      [status],
    );
    res.json({ contributions: r.rows, count: r.rows.length });
  } catch (err) {
    req.log.error({ err }, "GET admin contributions failed");
    res.status(500).json({ error: "Failed to load contributions" });
  }
});

export default router;


