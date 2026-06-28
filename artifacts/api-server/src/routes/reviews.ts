import { Router, type IRouter, type Request, type Response } from "express";
import { db, reviewsTable, pointsLedgerTable, POINTS_VALUES, businessInvitesTable, businessesTable, usersTable, mentorshipProfilesTable } from "@workspace/db";
import { computeTrustLevel, getReviewWeight } from "@workspace/db/trust";
import { eq, desc, and, ne, gte, sql } from "drizzle-orm";
import { sendPushToUser, sendPushToUsersWithSavedBusiness, sendThreeStarAlert, sendBuzzAlert, sendNegativeReviewAlertIfThreshold } from "../lib/pushNotifications";
import { reviewLimiter } from "../middleware/rateLimiter";
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
      from: "Mapping With Melanin™ <hello@send.mappingwithmelanin.com>",
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
      from: "Mapping With Melanin™ <hello@send.mappingwithmelanin.com>",
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
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(and(
        eq(reviewsTable.businessId, businessId),
        ne(reviewsTable.status, "pending_video"),
        gte(reviewsTable.createdAt, sixMonthsAgo),
      ))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(50);
    const currentUserId = req.user?.id ?? null;
    const enriched = reviews.map((r) => ({ ...r, isOwnReview: currentUserId !== null && r.userId === currentUserId }));
    res.json({ reviews: enriched });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch reviews");
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/reviews", reviewLimiter, requireTrust, async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { businessId, rating, text, wouldReturnAlone, socialHandle, socialPlatform, businessName, videoUrl, nonMinorityOwned, communitySupport, website, location, isAnonymous, recommendsAsEmployer, volunteerAsMentor, nowHiringUrl } =
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

  const [userRow] = await db
    .select({
      trustLevel: usersTable.trustLevel,
      identityVerified: usersTable.identityVerified,
      identityVerifiedAt: usersTable.identityVerifiedAt,
      policyViolationsCount: usersTable.policyViolationsCount,
      helpfulReviewsCount: usersTable.helpfulReviewsCount,
      reputationScore: usersTable.reputationScore,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);

  const trustLevel = userRow ? (computeTrustLevel(userRow) as 1 | 2 | 3 | 4) : 1;
  const reviewWeight = getReviewWeight(trustLevel, false, false);

  try {
    const [review] = await db
      .insert(reviewsTable)
      .values({
        userId: req.user.id,
        businessId: businessId as string,
        authorName:
          isAnonymous === true
            ? "Anonymous Community Member"
            : [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Community Member",
        isAnonymous: isAnonymous === true,
        rating: ratingNum,
        text: typeof text === "string" ? text : null,
        wouldReturnAlone: typeof wouldReturnAlone === "boolean" ? wouldReturnAlone : null,
        socialHandle: cleanHandle,
        socialPlatform: cleanHandle ? cleanPlatform : null,
        videoUrl: typeof videoUrl === "string" && videoUrl.trim() ? videoUrl.trim() : null,
        status: (typeof videoUrl === "string" && videoUrl.trim())
          ? "pending_video"
          : ratingNum === 5
            ? "auto_approved"
            : "posted",
        nonMinorityOwned: nonMinorityOwned === true,
        recommendsAsEmployer: nonMinorityOwned === true && recommendsAsEmployer === true,
        nowHiringUrl: nonMinorityOwned === true && recommendsAsEmployer === true && typeof nowHiringUrl === "string" && nowHiringUrl.trim() ? nowHiringUrl.trim() : null,
        communitySupport: typeof communitySupport === "number" && !nonMinorityOwned ? communitySupport : null,
        website: typeof website === "string" && website.trim() ? website.trim() : null,
        location: typeof location === "string" && location.trim() ? location.trim() : null,
        weight: String(reviewWeight),
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

    if (nonMinorityOwned === true && volunteerAsMentor === true && isAnonymous !== true) {
      const fullName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Community Member";
      await db
        .insert(mentorshipProfilesTable)
        .values({ userId: req.user.id, fullName, role: "mentor", available: true })
        .onConflictDoUpdate({
          target: mentorshipProfilesTable.userId,
          set: { available: true },
        })
        .catch((err) => {
          req.log.warn({ err }, "Failed to upsert mentorship profile from review");
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
      .select({ submittedById: businessesTable.submittedById, name: businessesTable.name, rating: businessesTable.rating })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId as string))
      .limit(1);

    const [aggRow] = await db
      .select({
        avg: sql<string>`AVG(${reviewsTable.rating})`,
        count: sql<string>`COUNT(*)`,
      })
      .from(reviewsTable)
      .where(eq(reviewsTable.businessId, businessId as string));

    if (aggRow) {
      const newAvg = parseFloat(aggRow.avg ?? "0");
      const newCount = parseInt(aggRow.count ?? "0", 10);
      await db
        .update(businessesTable)
        .set({ rating: String(newAvg.toFixed(1)), reviewCount: newCount })
        .where(eq(businessesTable.id, businessId as string));

      const oldAvg = parseFloat(String(biz?.rating ?? "0"));
      const wasThreeStar = oldAvg >= 2.5 && oldAvg < 3.5;
      const isNowThreeStar = newAvg >= 2.5 && newAvg < 3.5;
      if (!wasThreeStar && isNowThreeStar && biz?.name) {
        const direction = oldAvg >= 3.5 ? "dropped" : "rose";
        sendThreeStarAlert(businessId as string, biz.name, direction, req.user.id).catch(() => {});
      }

      // Buzz alert: every 3rd great review (≥4★) milestone, nudge saved supporters
      if (newCount % 3 === 0 && newAvg >= 4.0 && biz?.name) {
        sendBuzzAlert(businessId as string, biz.name, newCount).catch(() => {});
      }
      // Negative review threshold: 3 low-rated (≤3★) approved reviews in 30 days → saved user alert
      if (ratingNum <= 3 && biz?.name) {
        sendNegativeReviewAlertIfThreshold(businessId as string, biz.name, req.user.id).catch(() => {});
      }
    }

    if (biz?.submittedById && biz.submittedById !== req.user.id) {
      const ownerTitle = ratingNum === 5 ? "🌟 Perfect 5-Star Review!" : "New Review ⭐";
      const ownerBody = ratingNum === 5
        ? `Your business received a perfect 5-star review on Mapping With Melanin!`
        : `Someone left a ${ratingNum}-star review for ${biz.name ?? "your business"}.`;
      sendPushToUser(biz.submittedById, { title: ownerTitle, body: ownerBody, data: { screen: "business", id: businessId } }).catch(() => {});
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

// ─── POST /reviews/:id/owner-response ─────────────────────────────────────────
router.post("/reviews/:id/owner-response", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const reviewId = String(req.params.id);
  const { response } = req.body as { response?: string };
  if (!response?.trim()) { res.status(400).json({ error: "Response text is required" }); return; }

  const filter = checkContent(response);
  if (!filter.ok) { res.status(422).json({ error: filter.reason }); return; }

  try {
    const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId)).limit(1);
    if (!review) { res.status(404).json({ error: "Review not found" }); return; }

    const [biz] = await db.select({ submittedById: businessesTable.submittedById }).from(businessesTable).where(eq(businessesTable.id, review.businessId)).limit(1);
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    if (biz.submittedById !== req.user.id && !isAdmin(req)) {
      res.status(403).json({ error: "Only the business owner can respond to reviews" }); return;
    }

    const [updated] = await db
      .update(reviewsTable)
      .set({ ownerResponse: response.trim(), ownerRespondedAt: new Date() })
      .where(eq(reviewsTable.id, reviewId))
      .returning();

    if (review.userId) {
      sendPushToUser(review.userId, {
        title: "Business Owner Responded 💬",
        body: "The owner of a business you reviewed has responded to your feedback.",
        data: { screen: "business", id: review.businessId },
      }).catch(() => {});
    }

    res.json({ review: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to post owner response");
    res.status(500).json({ error: "Failed to post response" });
  }
});

// ─── PATCH /reviews/:id — customer edits their review (allowed after owner responds) ──
router.patch("/reviews/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const reviewId = String(req.params.id);
  const { text, rating } = req.body as { text?: string; rating?: number };

  try {
    const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId)).limit(1);
    if (!review) { res.status(404).json({ error: "Review not found" }); return; }
    if (review.userId !== req.user.id) { res.status(403).json({ error: "You can only edit your own reviews" }); return; }

    if (text && typeof text === "string" && text.trim()) {
      const filter = checkContent(text);
      if (!filter.ok) { res.status(422).json({ error: filter.reason }); return; }
    }

    const updates: Record<string, unknown> = { customerEditedAt: new Date() };
    if (text !== undefined) updates.text = typeof text === "string" ? text.trim() : null;
    if (rating !== undefined) {
      const r = Number(rating);
      if (!isNaN(r) && r >= 1 && r <= 5) updates.rating = r;
    }

    const [updated] = await db.update(reviewsTable).set(updates).where(eq(reviewsTable.id, reviewId)).returning();
    res.json({ review: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to edit review");
    res.status(500).json({ error: "Failed to edit review" });
  }
});

// ─── POST /reviews/:id/approve-video — admin approves a pending_video review ──
router.post("/reviews/:id/approve-video", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }
  const reviewId = String(req.params.id);
  try {
    const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId)).limit(1);
    if (!review) { res.status(404).json({ error: "Review not found" }); return; }
    if (review.status !== "pending_video") { res.status(400).json({ error: "Review is not pending video approval" }); return; }

    const [updated] = await db
      .update(reviewsTable)
      .set({ status: "posted" })
      .where(eq(reviewsTable.id, reviewId))
      .returning();

    if (review.userId) {
      sendPushToUser(review.userId, {
        title: "Your Video Review is Live! 🎉",
        body: "Your video review has been approved and is now visible to the community.",
        data: { screen: "business", id: review.businessId },
      }).catch(() => {});
    }

    res.json({ review: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to approve video review");
    res.status(500).json({ error: "Failed to approve review" });
  }
});

router.get("/admin/reviews", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { businessId, status } = req.query;
  try {
    const conditions = [];
    if (businessId && typeof businessId === "string") conditions.push(eq(reviewsTable.businessId, businessId));
    if (status && typeof status === "string") conditions.push(eq(reviewsTable.status, status as "posted" | "auto_approved" | "pending_video"));
    const rows = await db
      .select({ review: reviewsTable, businessName: businessesTable.name })
      .from(reviewsTable)
      .leftJoin(businessesTable, eq(reviewsTable.businessId, businessesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reviewsTable.createdAt))
      .limit(200);
    const reviews = rows.map((r) => ({ ...r.review, businessName: r.businessName ?? r.review.businessId }));
    res.json({ reviews });
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
