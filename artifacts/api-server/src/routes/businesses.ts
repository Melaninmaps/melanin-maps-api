import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { db, pool, businessesTable, businessProfileViewsTable, userSettingsTable, usersTable, docusignEnvelopesTable, businessPromotionsTable, businessSearchInquiriesTable, userPreferencesTable, businessClickEventsTable, businessCaptionsTable, contentReportsTable, referenceLinkClicksTable } from "@workspace/db";
import { eq, and, or, ilike, desc, sql, gt, count, inArray, ne } from "drizzle-orm";
import { sendAddressUpdateNotifications } from "../lib/pushNotifications";
import { createFoundingAgreementEnvelope } from "../lib/docusign";
import { sendFoundingWelcomeEmail, sendSearchInquiryAlert } from "../lib/email";
import { objectStorageClient } from "../lib/objectStorage";
import { reportLimiter } from "../middleware/rateLimiter";

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

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

router.get("/businesses", async (req: Request, res: Response) => {
  try {
    const { category, search, state, handle, culturalPreference, ownership } = req.query;

    const conditions = [];

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
      conditions.push(
        or(
          ilike(businessesTable.name, `%${search}%`),
          ilike(businessesTable.city, `%${search}%`),
          ilike(businessesTable.category, `%${search}%`),
          ilike(businessesTable.description, `%${search}%`),
        ),
      );
    }

    if (state && typeof state === "string") {
      conditions.push(ilike(businessesTable.state, `%${state}%`));
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

    const businesses = await db
      .select()
      .from(businessesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        desc(businessesTable.foundingBusiness),
        desc(businessesTable.confidenceScore),
      )
      .limit(200);

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

    res.json({ businesses: withCaptions, total: withCaptions.length, featuredCount });
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

  const VALID_CATEGORIES = [
    "Food & Beverage", "Shopping & Retail", "Beauty & Personal Care",
    "Health & Wellness", "Home & Real Estate", "Home Improvement",
    "Automotive", "Professional Services", "Technology", "Creative Services",
    "Events & Entertainment", "Travel & Hospitality", "Family & Education",
    "Pet Services", "Community & Nonprofits", "Government & Public Resources",
    "Black Professionals", "Online & Mobile Businesses",
    "Home Services", "Real Estate & Housing", "Community & Nonprofit",
  ];

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

    res.json({ business });
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

    res.status(201).json({ business });
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

export default router;

