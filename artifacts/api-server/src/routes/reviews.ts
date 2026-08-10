import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { db, pool, reviewsTable, pointsLedgerTable, POINTS_VALUES, businessInvitesTable, businessesTable, usersTable, mentorshipProfilesTable } from "@workspace/db";
import { computeTrustLevel, getReviewWeight, computeWeightedRating } from "@workspace/db/trust";
import { eq, desc, and, ne, gte, sql, inArray } from "drizzle-orm";
import { sendPushToUser, sendPushToUsersWithSavedBusiness, sendThreeStarAlert, sendBuzzAlert, sendNegativeReviewAlertIfThreshold } from "../lib/pushNotifications";
import { reviewLimiter } from "../middleware/rateLimiter";
import { requireTrust } from "../middleware/requireTrust";
import { checkContent, redactForLog } from "../lib/contentFilter";
import { scoreReview, type RiskResult } from "../lib/reviewRiskScoring";
import { objectStorageClient } from "../lib/objectStorage";

const reviewPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => { cb(null, file.mimetype.startsWith("image/")); },
});

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
        ne(reviewsTable.status, "pending_review"),
        ne(reviewsTable.status, "pending_verification"),
        ne(reviewsTable.status, "rejected"),
        gte(reviewsTable.createdAt, sixMonthsAgo),
      ))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(50);

    const userIds = [...new Set(reviews.map((r) => r.userId).filter(Boolean))] as string[];
    const [trustData, businessRow] = await Promise.all([
      userIds.length > 0
        ? db.select({
            id: usersTable.id,
            trustLevel: usersTable.trustLevel,
            identityVerified: usersTable.identityVerified,
            identityVerifiedAt: usersTable.identityVerifiedAt,
            policyViolationsCount: usersTable.policyViolationsCount,
            helpfulReviewsCount: usersTable.helpfulReviewsCount,
            createdAt: usersTable.createdAt,
            reputationScore: usersTable.reputationScore,
            homeCity: usersTable.homeCity,
            isInfluencer: usersTable.isInfluencer,
          }).from(usersTable).where(inArray(usersTable.id, userIds))
        : Promise.resolve([]),
      db.select({ city: businessesTable.city, state: businessesTable.state })
        .from(businessesTable)
        .where(eq(businessesTable.id, businessId))
        .limit(1),
    ]);

    const trustMap = new Map(trustData.map((u) => [u.id, {
      level: computeTrustLevel(u),
      homeCity: u.homeCity,
      isInfluencer: u.isInfluencer,
    }]));
    const bizCity = businessRow[0]?.city?.toLowerCase().trim() ?? null;
    const bizState = businessRow[0]?.state?.toLowerCase().trim() ?? null;

    const currentUserId = req.user?.id ?? null;
    const enriched = reviews.map((r) => {
      const td = r.userId ? trustMap.get(r.userId) : null;
      return {
        ...r,
        isOwnReview: currentUserId !== null && r.userId === currentUserId,
        authorTrustLevel: td?.level ?? 1,
        authorIsInfluencer: td?.isInfluencer ?? false,
      };
    });

    // Compute source breakdown stats
    const statsVerified = enriched.filter((r) => r.authorTrustLevel >= 2).length;
    const statsInfluencer = enriched.filter((r) => r.authorIsInfluencer).length;
    let statsLocal = 0, statsTraveler = 0;
    if (bizCity || bizState) {
      for (const r of enriched) {
        const td = r.userId ? trustMap.get(r.userId) : null;
        const rc = td?.homeCity?.toLowerCase().trim();
        if (!rc) continue;
        const isLocal = (bizCity && rc.includes(bizCity)) || (bizState && rc.includes(bizState!));
        if (isLocal) statsLocal++; else statsTraveler++;
      }
    }

    const weightedRating = computeWeightedRating(
      enriched.map((r) => ({ rating: r.rating, weight: r.weight ?? "1" }))
    );

    res.json({
      reviews: enriched,
      weightedRating,
      stats: {
        total: enriched.length,
        verified: statsVerified,
        influencer: statsInfluencer,
        local: statsLocal,
        traveler: statsTraveler,
        weightedAverage: weightedRating,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch reviews");
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// ─── POST /reviews/photos — upload a review photo to GCS ─────────────────────
router.post("/reviews/photos", reviewPhotoUpload.single("photo"), async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) { res.status(500).json({ error: "Object storage not configured" }); return; }

  const { buffer, mimetype } = req.file;
  const ext = mimetype.split("/")[1] ?? "jpg";
  const objectKey = `reviews/${req.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const bucket = objectStorageClient.bucket(bucketId);
    const gcsFile = bucket.file(objectKey);
    await gcsFile.save(buffer, { contentType: mimetype });
    await gcsFile.makePublic();
    const url = `https://storage.googleapis.com/${bucketId}/${objectKey}`;
    res.json({ url });
  } catch (err) {
    req.log.error({ err }, "Failed to upload review photo");
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

router.post("/reviews", reviewLimiter, requireTrust, async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { businessId, rating, text, wouldReturnAlone, socialHandle, socialPlatform, businessName, videoUrl, nonMinorityOwned, communitySupport, website, location, isAnonymous, recommendsAsEmployer, volunteerAsMentor, nowHiringUrl, photos, reviewBadge } =
    req.body as Record<string, unknown>;

  const ratingNum = Number(rating);
  // reviewBadge alone is a complete, valid review — rating is derived from the badge.
  const hasRating = rating != null && !isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5;
  const hasBadge = typeof reviewBadge === "string" && reviewBadge.trim().length > 0;
  if (!businessId || (!hasRating && !hasBadge)) {
    res.status(400).json({ error: "businessId required; provide rating (1–5) or a review badge" });
    return;
  }
  // Derive rating from badge when not explicitly provided
  const effectiveRating = hasRating ? ratingNum : (() => {
    const b = String(reviewBadge);
    if (["worth_every_visit","grandma_approved","felt_at_home","great_service","would_go_back"].includes(b)) return 5;
    if (b === "mixed_feelings") return 3;
    return 2;
  })();

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
      isInfluencer: usersTable.isInfluencer,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);

  const trustLevel = userRow ? (computeTrustLevel(userRow) as 1 | 2 | 3 | 4) : 1;
  const reviewWeight = getReviewWeight(trustLevel, false, false, userRow?.isInfluencer ?? false);

  const [bizRow] = await db
    .select({ blackOwned: businessesTable.blackOwned })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId as string))
    .limit(1);

  const isMinorityOwned = bizRow?.blackOwned === true;
  const hasVideo = typeof videoUrl === "string" && videoUrl.trim().length > 0;
  const isNegative = effectiveRating <= 3;

  // ── Risk scoring (minority-owned businesses only) ────────────────────────
  // For non-minority businesses: always post immediately — delaying a safety
  // report about a non-minority-owned business is itself a safety hazard.
  let riskResult: RiskResult = { score: 0, level: "low", reasons: [], verificationBadge: null };
  if (isMinorityOwned && typeof text === "string" && text.trim().length > 0) {
    const [userRow] = await db
      .select({ createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);
    const [countRow] = await db
      .select({ cnt: sql<string>`COUNT(*)` })
      .from(reviewsTable)
      .where(eq(reviewsTable.userId, req.user.id));
    const accountAgeDays = userRow?.createdAt
      ? (Date.now() - new Date(userRow.createdAt).getTime()) / 86_400_000
      : 0;
    const priorReviewCount = parseInt(countRow?.cnt ?? "0", 10);
    riskResult = scoreReview({ text: typeof text === "string" ? text.trim() : "", rating: effectiveRating, accountAgeDays, priorReviewCount });
  }

  function resolveStatus(): string {
    if (hasVideo) return "pending_video";
    // Non-minority-owned: always publish immediately (safety hazard to delay)
    if (!isMinorityOwned) return isNegative ? "pending_review" : (effectiveRating === 5 ? "auto_approved" : "posted");
    // Minority-owned: apply risk-based gating
    if (riskResult.level === "high") return "pending_verification";
    if (effectiveRating === 5) return "auto_approved";
    return "posted";
  }

  const resolvedStatus = resolveStatus();
  const isPendingVerification = resolvedStatus === "pending_verification";

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
        rating: effectiveRating,
        text: typeof text === "string" ? text : null,
        wouldReturnAlone: typeof wouldReturnAlone === "boolean" ? wouldReturnAlone : null,
        socialHandle: cleanHandle,
        socialPlatform: cleanHandle ? cleanPlatform : null,
        videoUrl: hasVideo ? (videoUrl as string).trim() : null,
        status: resolvedStatus,
        riskScore: riskResult.score,
        moderationLevel: riskResult.level,
        moderationReasons: riskResult.reasons.length > 0 ? riskResult.reasons : null,
        verificationBadge: riskResult.verificationBadge ?? null,
        nonMinorityOwned: nonMinorityOwned === true,
        recommendsAsEmployer: nonMinorityOwned === true && recommendsAsEmployer === true,
        nowHiringUrl: nonMinorityOwned === true && recommendsAsEmployer === true && typeof nowHiringUrl === "string" && nowHiringUrl.trim() ? nowHiringUrl.trim() : null,
        communitySupport: typeof communitySupport === "number" && !nonMinorityOwned ? communitySupport : null,
        website: typeof website === "string" && website.trim() ? website.trim() : null,
        location: typeof location === "string" && location.trim() ? location.trim() : null,
        photos: Array.isArray(photos) ? (photos as unknown[]).filter((p): p is string => typeof p === "string").slice(0, 6) : null,
        weight: String(reviewWeight),
      })
      .returning();

    await db.insert(pointsLedgerTable).values({
      userId: req.user.id,
      action: "review",
      points: POINTS_VALUES.review,
      entityId: review.id,
    });

    // Persist review_badge — not yet in Drizzle schema
    if (hasBadge) {
      await pool.query(
        `UPDATE reviews SET review_badge = $1 WHERE id = $2`,
        [String(reviewBadge), review.id]
      );
    }

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
        rating: effectiveRating,
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
      if (effectiveRating <= 3 && biz?.name) {
        sendNegativeReviewAlertIfThreshold(businessId as string, biz.name, req.user.id).catch(() => {});
      }
    }

    // Skip push notifications for held reviews — the review isn't live yet
    if (!isPendingVerification) {
      if (biz?.submittedById && biz.submittedById !== req.user.id) {
        const ownerTitle = effectiveRating === 5 ? "New 5-Star Review!" : "New Review";
        const ownerBody = effectiveRating === 5
          ? `Your business received a perfect 5-star review on Mapping With Melanin!`
          : `Someone left a ${effectiveRating}-star review for ${biz.name ?? "your business"}.`;
        sendPushToUser(biz.submittedById, { title: ownerTitle, body: ownerBody, data: { screen: "business", id: businessId } }).catch(() => {});
      }
      sendPushToUsersWithSavedBusiness(businessId as string, { title: "New Review", body: `A new review was posted for ${biz?.name ?? "a saved business"}.`, data: { screen: "business", id: businessId } }).catch(() => {});
    }

    res.status(201).json({
      review,
      pointsEarned: POINTS_VALUES.review,
      invite,
      pendingVerification: isPendingVerification,
      moderationLevel: riskResult.level,
    });
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
  const { text, rating, reviewBadge } = req.body as { text?: string; rating?: number; reviewBadge?: string };

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

    // Persist review_badge separately (not in Drizzle schema yet)
    if (typeof reviewBadge === "string" && reviewBadge.trim()) {
      await pool.query(
        `UPDATE reviews SET review_badge = $1 WHERE id = $2 AND user_id = $3`,
        [reviewBadge.trim(), reviewId, req.user.id]
      );
    }

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

router.patch("/admin/reviews/:id/decision", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const id = String(req.params.id);
  const { action } = req.body as { action?: string };
  if (!action || !["approve", "reject"].includes(action)) {
    res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    return;
  }
  try {
    if (action === "reject") {
      const [deleted] = await db.delete(reviewsTable).where(eq(reviewsTable.id, id)).returning({ id: reviewsTable.id });
      if (!deleted) { res.status(404).json({ error: "Review not found" }); return; }
      req.log.info({ reviewId: id, action: "reject", by: req.user?.id }, "Admin rejected pending review");
      res.json({ ok: true, action: "rejected" });
    } else {
      const [updated] = await db
        .update(reviewsTable)
        .set({ status: "posted" })
        .where(eq(reviewsTable.id, id))
        .returning({ id: reviewsTable.id, status: reviewsTable.status });
      if (!updated) { res.status(404).json({ error: "Review not found" }); return; }
      req.log.info({ reviewId: id, action: "approve", by: req.user?.id }, "Admin approved pending review");
      res.json({ ok: true, action: "approved", review: updated });
    }
  } catch (err: any) {
    req.log.error({ err }, "Failed to process review decision");
    res.status(500).json({ error: "Failed to process decision" });
  }
});

// ─── GET /reviews/mine ────────────────────────────────────────────────────────
// Returns the authenticated user's own reviews — count + recent list.
router.get("/reviews/mine", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user!.id;
    const reviews = await db
      .select({
        id: reviewsTable.id,
        businessId: reviewsTable.businessId,
        rating: reviewsTable.rating,
        body: reviewsTable.text,
        badge: reviewsTable.verificationBadge,
        createdAt: reviewsTable.createdAt,
      })
      .from(reviewsTable)
      .where(and(
        eq(reviewsTable.userId, userId),
        ne(reviewsTable.status, "rejected"),
      ))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(100);
    res.json({ reviews, count: reviews.length });
  } catch (err) {
    req.log.error({ err }, "GET /api/reviews/mine error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

