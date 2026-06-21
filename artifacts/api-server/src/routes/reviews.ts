import { Router, type IRouter, type Request, type Response } from "express";
import { db, reviewsTable, pointsLedgerTable, POINTS_VALUES, businessInvitesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { reviewLimiter } from "../middleware/rateLimiter";

const router: IRouter = Router();

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter/X",
  tiktok: "TikTok",
  facebook: "Facebook",
};

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

router.post("/reviews", reviewLimiter, async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { businessId, rating, text, wouldReturnAlone, socialHandle, socialPlatform, businessName } =
    req.body as Record<string, unknown>;

  const ratingNum = Number(rating);
  if (!businessId || !rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: "businessId required; rating must be a number 1–5" });
    return;
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
      })
      .returning();

    await db.insert(pointsLedgerTable).values({
      userId: req.user.id,
      action: "review",
      points: POINTS_VALUES.review,
      entityId: review.id,
    });

    let invite = null;
    if (cleanHandle && cleanPlatform) {
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

    res.status(201).json({ review, pointsEarned: POINTS_VALUES.review, invite });
  } catch (err) {
    req.log.error({ err }, "Failed to submit review");
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;
