import { Router, type IRouter, type Request, type Response } from "express";
import { db, reviewsTable, pointsLedgerTable, POINTS_VALUES, businessInvitesTable, businessesTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { sendPushToUser, sendPushToUsersWithSavedBusiness } from "../lib/pushNotifications";
import { reviewLimiter } from "../middleware/rateLimiter";
import { requireMembership } from "../middleware/requireMembership";
import { requireTrust } from "../middleware/requireTrust";
import { checkContent, redactForLog } from "../lib/contentFilter";

const router: IRouter = Router();

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter/X",
  tiktok: "TikTok",
  facebook: "Facebook",
};

async function sendVideoReviewNotification(opts: {
  businessName: string;
  reviewerName: string;
  reviewId: string;
  videoUrl: string;
  rating: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "KinfolkAI <noreply@mappingwithmelanin.com>",
      to: ["hello@mappingwithmelanin.com"],
      subject: `New Video Review: ${opts.businessName} — ${opts.rating}★`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #3B1F0E;">🎥 New Review with Video Link</h2>
          <p>A community member just submitted a review with a video link on <strong>Mapping With Melanin</strong>.</p>

          <div style="background: #FBF7F0; border: 1px solid #E8D5B7; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>Business:</strong> ${opts.businessName}</p>
            <p style="margin: 0 0 8px;"><strong>Reviewer:</strong> ${opts.reviewerName}</p>
            <p style="margin: 0 0 8px;"><strong>Rating:</strong> ${"★".repeat(opts.rating)}${"☆".repeat(5 - opts.rating)}</p>
            <p style="margin: 0 0 8px;"><strong>Review ID:</strong> ${opts.reviewId}</p>
          </div>

          <a href="${opts.videoUrl}"
             style="display: inline-block; background: #3B1F0E; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
            Watch Video
          </a>

          <p style="color: #888; font-size: 12px; margin-top: 32px;">Mapping With Melanin™ — Community Discovery Platform</p>
        </div>
      `,
    }),
  });
}

async function sendInviteNotification(opts: {
  businessName: string;
  socialHandle: string;
  socialPlatform: string;
  reviewerName: string;
  inviteId: string;
  trialEndDate: Date;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const platform = PLATFORM_LABELS[opts.socialPlatform] ?? opts.socialPlatform;
  const trialEnd = opts.trialEndDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "KinfolkAI <noreply@mappingwithmelanin.com>",
      to: ["hello@mappingwithmelanin.com"],
      subject: `New Business Invite: ${opts.socialHandle} on ${platform}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #3B1F0E;">🎉 New Business Tagged by Community Member</h2>
          <p>A reviewer just tagged a business on <strong>Mapping With Melanin</strong> and it's ready for an invite!</p>
          
          <div style="background: #FBF7F0; border: 1px solid #E8D5B7; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>Business Handle:</strong> @${opts.socialHandle}</p>
            <p style="margin: 0 0 8px;"><strong>Platform:</strong> ${platform}</p>
            <p style="margin: 0 0 8px;"><strong>Tagged by:</strong> ${opts.reviewerName}</p>
            <p style="margin: 0 0 8px;"><strong>Free Trial Expires:</strong> ${trialEnd}</p>
            <p style="margin: 0;"><strong>Invite ID:</strong> ${opts.inviteId}</p>
          </div>

          <p>Reach out to this business on ${platform} to let them know they've been featured and offer their 60-day free trial on Mapping With Melanin.</p>

          <a href="https://${opts.socialPlatform === "twitter" ? "x.com" : opts.socialPlatform + ".com"}/${opts.socialHandle}" 
             style="display: inline-block; background: #3B1F0E; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
            View @${opts.socialHandle} on ${platform}
          </a>

          <p style="color: #888; font-size: 12px; margin-top: 32px;">Mapping With Melanin™ — Community Discovery Platform</p>
        </div>
      `,
    }),
  });
}

router.get("/reviews/thumbs-up", async (req: Request, res: Response) => {
  try {
    const alerts = await db
      .select({
        businessName: businessesTable.name,
        thumbsUpCount: sql<number>`count(*)::int`,
      })
      .from(reviewsTable)
      .innerJoin(businessesTable, eq(reviewsTable.businessId, businessesTable.id))
      .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .where(and(eq(reviewsTable.wouldReturnAlone, true), eq(usersTable.approved, true)))
      .groupBy(businessesTable.id, businessesTable.name)
      .having(sql`count(*) >= 3`)
      .orderBy(sql`count(*) desc`)
      .limit(200);
    res.json({ alerts });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch thumbs-up alerts");
    res.status(500).json({ error: "Failed to fetch thumbs-up alerts" });
  }
});

router.get("/reviews", async (req: Request, res: Response) => {
  const { businessId } = req.query;
  if (!businessId || typeof businessId !== "string") {
    res.status(400).json({ error: "businessId required" });
    return;
  }
  try {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.businessId, businessId))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(50);
    res.json({ reviews });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch reviews");
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/reviews", reviewLimiter, requireTrust, requireMembership("navigator"), async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { businessId, rating, text, wouldReturnAlone, socialHandle, socialPlatform, businessName, videoUrl, nonMinorityOwned, communitySupport, website, location } =
    req.body as Record<string, unknown>;

  const ratingNum = Number(rating);
  if (!businessId || !rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: "businessId required; rating must be a number 1–5" });
    return;
  }

  const existing = await db
    .select({ id: reviewsTable.id })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.userId, req.user.id), eq(reviewsTable.businessId, businessId as string)))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "You have already reviewed this business.", code: "DUPLICATE_REVIEW" });
    return;
  }

  if (typeof text === "string" && text.trim()) {
    const filter = checkContent(text);
    if (!filter.ok) {
      req.log.warn({ userId: req.user.id, matched: redactForLog(filter.matched) }, "Review blocked by content filter");
      res.status(422).json({ error: filter.reason, code: "CONTENT_POLICY_VIOLATION" });
      return;
    }
  }

  const cleanHandle = typeof socialHandle === "string"
    ? socialHandle.trim().replace(/^@/, "")
    : null;
  const cleanPlatform = typeof socialPlatform === "string" ? socialPlatform : null;

  try {
    const [review] = await db
      .insert(reviewsTable)
      .values({
        userId: req.user.id,
        businessId: businessId as string,
        authorName:
          [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") ||
          "Community Member",
        rating: ratingNum,
        text: typeof text === "string" ? text : null,
        wouldReturnAlone: typeof wouldReturnAlone === "boolean" ? wouldReturnAlone : null,
        socialHandle: cleanHandle,
        socialPlatform: cleanHandle ? cleanPlatform : null,
        videoUrl: typeof videoUrl === "string" && videoUrl.trim() ? videoUrl.trim() : null,
        nonMinorityOwned: nonMinorityOwned === true,
        communitySupport: typeof communitySupport === "number" && !nonMinorityOwned ? communitySupport : null,
        website: typeof website === "string" && website.trim() ? website.trim() : null,
        location: typeof location === "string" && location.trim() ? location.trim() : null,
      })
      .returning();

    await db.insert(pointsLedgerTable).values({
      userId: req.user.id,
      action: "review",
      points: POINTS_VALUES.review,
      entityId: review.id,
    });

    let invite = null;
    if (cleanHandle && cleanPlatform && nonMinorityOwned !== true) {
      const [newInvite] = await db
        .insert(businessInvitesTable)
        .values({
          reviewId: review.id,
          invitedByUserId: req.user.id,
          businessId: businessId as string,
          businessName: typeof businessName === "string" ? businessName : null,
          socialHandle: cleanHandle,
          socialPlatform: cleanPlatform,
          status: "pending",
        })
        .returning();

      invite = newInvite;

      sendInviteNotification({
        businessName: typeof businessName === "string" ? businessName : cleanHandle,
        socialHandle: cleanHandle,
        socialPlatform: cleanPlatform,
        reviewerName: [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Community Member",
        inviteId: newInvite.id,
        trialEndDate: newInvite.trialEndDate,
      }).catch((err) => {
        req.log.warn({ err }, "Failed to send invite notification email");
      });
    }

    const reviewerName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Community Member";

    if (review.videoUrl) {
      sendVideoReviewNotification({
        businessName: typeof businessName === "string" && businessName ? businessName : String(businessId),
        reviewerName,
        reviewId: review.id,
        videoUrl: review.videoUrl,
        rating: ratingNum,
      }).catch((err) => {
        req.log.warn({ err }, "Failed to send video review notification email");
      });
    }

    const [biz] = await db
      .select({ submittedById: businessesTable.submittedById, name: businessesTable.name })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId as string))
      .limit(1);

    if (biz?.submittedById && biz.submittedById !== req.user.id) {
      sendPushToUser(biz.submittedById, { title: "New Review ⭐", body: `Someone left a ${ratingNum}-star review for ${biz.name ?? "your business"}.`, data: { screen: "business", id: businessId } }).catch(() => {});
    }
    sendPushToUsersWithSavedBusiness(businessId as string, { title: "New Review", body: `A new review was posted for ${biz?.name ?? "a saved business"}.`, data: { screen: "business", id: businessId } }).catch(() => {});

    res.status(201).json({ review, pointsEarned: POINTS_VALUES.review, invite });
  } catch (err) {
    req.log.error({ err }, "Failed to submit review");
    res.status(500).json({ error: "Failed to submit review" });
  }
});

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email)) return true;
  return user.role === "admin";
}

router.get("/admin/reviews", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { businessId } = req.query;
  try {
    const rows = businessId && typeof businessId === "string"
      ? await db.select().from(reviewsTable).where(eq(reviewsTable.businessId, businessId)).orderBy(desc(reviewsTable.createdAt)).limit(200)
      : await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt)).limit(200);
    res.json({ reviews: rows });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch admin reviews");
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.delete("/admin/reviews/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const id = String(req.params.id);
  try {
    const [deleted] = await db.delete(reviewsTable).where(eq(reviewsTable.id, id)).returning({ id: reviewsTable.id });
    if (!deleted) { res.status(404).json({ error: "Review not found" }); return; }
    req.log.info({ deletedReviewId: deleted.id, by: (req as any).user?.id }, "Admin deleted review");
    res.json({ ok: true, deleted });
  } catch (err: any) {
    req.log.error({ err }, "Failed to delete review");
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;
