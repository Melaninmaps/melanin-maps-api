import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function uid(req: Request): string | null {
  return (req.user as any)?.id ?? null;
}

const ALLOWED_PURPOSES = [
  "meet_the_owner", "our_story", "customer_experience", "product_demo",
  "service_showcase", "restaurant_tour", "travel_guide", "event_recap",
  "community_story", "behind_the_scenes",
];

const ALLOWED_DOMAINS = [
  "youtube.com", "youtu.be", "tiktok.com", "instagram.com",
  "facebook.com", "fb.watch", "vimeo.com",
];

function isAllowedUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch { return false; }
}

// ── PATCH /businesses/:id/featured-video ─────────────────────────────────────
router.patch("/businesses/:id/featured-video", async (req: Request, res: Response) => {
  const user = uid(req);
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }

  const businessId = String(req.params.id);

  // Verify ownership
  const [biz] = await db
    .select({ id: businessesTable.id, submittedById: businessesTable.submittedById })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  if (biz.submittedById !== user) { res.status(403).json({ error: "Not the business owner" }); return; }

  const { videoUrl, videoTitle, videoPurpose } = req.body as {
    videoUrl?: string | null;
    videoTitle?: string | null;
    videoPurpose?: string | null;
  };

  // Allow clearing the video
  if (videoUrl === null || videoUrl === "") {
    await db.update(businessesTable)
      .set({ featuredVideoUrl: null, featuredVideoTitle: null, featuredVideoPurpose: null })
      .where(eq(businessesTable.id, businessId));
    res.json({ success: true, cleared: true });
    return;
  }

  const cleanUrl = videoUrl?.trim();
  if (!cleanUrl) { res.status(400).json({ error: "Video URL is required" }); return; }
  if (!isAllowedUrl(cleanUrl)) {
    res.status(400).json({ error: "Only YouTube, TikTok, Instagram, Facebook, and Vimeo links are supported" });
    return;
  }
  if (videoPurpose && !ALLOWED_PURPOSES.includes(videoPurpose)) {
    res.status(400).json({ error: "Invalid video purpose" }); return;
  }
  const cleanTitle = videoTitle?.trim().slice(0, 150) || null;

  try {
    await db.update(businessesTable)
      .set({
        featuredVideoUrl: cleanUrl,
        featuredVideoTitle: cleanTitle,
        featuredVideoPurpose: videoPurpose ?? null,
      })
      .where(eq(businessesTable.id, businessId));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update featured video");
    res.status(500).json({ error: "Failed to save video" });
  }
});

export default router;
