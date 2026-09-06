import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable } from "@workspace/db";
import { detectSocialVideoPlatform } from "@workspace/constants";
import { and, eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function uid(req: Request): string | null {
  return (req.user as any)?.id ?? null;
}

const ALLOWED_PURPOSES = [
  "meet_the_owner", "our_story", "customer_experience", "product_demo",
  "service_showcase", "restaurant_tour", "travel_guide", "event_recap",
  "community_story", "behind_the_scenes",
];

// ── PATCH /businesses/:id/featured-video ─────────────────────────────────────
router.patch("/businesses/:id/featured-video", async (req: Request, res: Response) => {
  const user = uid(req);
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }

  const businessId = String(req.params.id);

  // Verify ownership
  const [biz] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(and(
      eq(businessesTable.id, businessId),
      sql<boolean>`EXISTS (
        SELECT 1 FROM business_owner_links bol
         WHERE bol.business_id = ${businessesTable.id}
           AND bol.user_id = ${user}
           AND bol.role = 'owner'
           AND bol.status = 'approved'
           AND bol.revoked_at IS NULL
      )`,
    ))
    .limit(1);

  if (!biz) { res.status(403).json({ error: "Approved business owner access required" }); return; }

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
  if (!detectSocialVideoPlatform(cleanUrl)) {
    res.status(400).json({ error: "Only public YouTube, TikTok, Instagram, Facebook, Twitch, Snapchat, and Vimeo links are supported" });
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
