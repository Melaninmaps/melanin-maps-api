import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { db, pool, businessesTable, businessProfileViewsTable, userSettingsTable, usersTable, docusignEnvelopesTable, businessPromotionsTable, businessSearchInquiriesTable } from "@workspace/db";
import { eq, and, or, ilike, desc, sql, gt, count } from "drizzle-orm";
import { sendAddressUpdateNotifications } from "../lib/pushNotifications";
import { createFoundingAgreementEnvelope } from "../lib/docusign";
import { sendFoundingWelcomeEmail, sendSearchInquiryAlert } from "../lib/email";
import { objectStorageClient } from "../lib/objectStorage";

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
    const { category, search, state, handle } = req.query;

    const conditions = [];

    if (category && typeof category === "string" && category !== "All") {
      conditions.push(eq(businessesTable.category, category));
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

    const annotated = businesses
      .map((b) => ({
        ...b,
        featured: b.featured || promotedIdToType.has(b.id),
        promotionType: promotedIdToType.get(b.id) ?? null,
      }))
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        if (b.foundingBusiness !== a.foundingBusiness) return b.foundingBusiness ? 1 : -1;
        return (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0);
      });

    const featuredCount = annotated.filter((b) => b.featured).length;
    res.json({ businesses: annotated, total: annotated.length, featuredCount });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch businesses");
    res.status(500).json({ error: "Failed to fetch businesses" });
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

  const { name, category, subcategory, description, phone, website, hours, instagram, tiktok, facebook, twitter, youtube } = req.body as {
    name?: string; category?: string; subcategory?: string; description?: string;
    phone?: string | null; website?: string | null; hours?: string | null;
    instagram?: string | null; tiktok?: string | null; facebook?: string | null;
    twitter?: string | null; youtube?: string | null;
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

export default router;

