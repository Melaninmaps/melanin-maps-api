import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, reviewsTable, reviewHelpfulVotesTable, identityVerificationsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { computeTrustLevel, getReviewWeight, getTrustProgress, TRUST_LEVELS } from "@workspace/db/trust";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email)) return true;
  return user.role === "admin";
}

router.get("/users/me/trust", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const [user] = await db
      .select({
        trustLevel: usersTable.trustLevel,
        reputationScore: usersTable.reputationScore,
        identityVerified: usersTable.identityVerified,
        identityVerifiedAt: usersTable.identityVerifiedAt,
        policyViolationsCount: usersTable.policyViolationsCount,
        helpfulReviewsCount: usersTable.helpfulReviewsCount,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const computedLevel = computeTrustLevel(user);

    if (computedLevel !== user.trustLevel && computedLevel > user.trustLevel) {
      await db
        .update(usersTable)
        .set({ trustLevel: computedLevel })
        .where(eq(usersTable.id, req.user.id));
      user.trustLevel = computedLevel;
    }

    const progress = getTrustProgress({ ...user, trustLevel: computedLevel });
    const pendingVerification = await db
      .select({ id: identityVerificationsTable.id, status: identityVerificationsTable.status, submittedAt: identityVerificationsTable.submittedAt })
      .from(identityVerificationsTable)
      .where(eq(identityVerificationsTable.userId, req.user.id))
      .orderBy(sql`${identityVerificationsTable.submittedAt} desc`)
      .limit(1);

    res.json({
      trustLevel: computedLevel,
      levelInfo: TRUST_LEVELS[computedLevel as 1 | 2 | 3 | 4],
      reputationScore: user.reputationScore,
      identityVerified: user.identityVerified,
      identityVerifiedAt: user.identityVerifiedAt,
      helpfulReviewsCount: user.helpfulReviewsCount,
      policyViolationsCount: user.policyViolationsCount,
      progress,
      pendingVerification: pendingVerification[0] ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch trust profile");
    res.status(500).json({ error: "Failed to fetch trust profile" });
  }
});

router.post("/users/identity-verification", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const existing = await db
      .select({ id: identityVerificationsTable.id, status: identityVerificationsTable.status })
      .from(identityVerificationsTable)
      .where(eq(identityVerificationsTable.userId, req.user.id))
      .orderBy(sql`${identityVerificationsTable.submittedAt} desc`)
      .limit(1);

    if (existing[0]?.status === "pending") {
      res.status(409).json({ error: "A verification request is already pending.", code: "PENDING_EXISTS" });
      return;
    }
    if (existing[0]?.status === "approved") {
      res.status(409).json({ error: "Your identity is already verified.", code: "ALREADY_VERIFIED" });
      return;
    }

    const [request] = await db
      .insert(identityVerificationsTable)
      .values({ userId: req.user.id, status: "pending" })
      .returning();

    res.status(201).json({ ok: true, request, message: "Verification request submitted. You will be notified once reviewed." });
  } catch (err) {
    req.log.error({ err }, "Failed to submit identity verification");
    res.status(500).json({ error: "Failed to submit identity verification" });
  }
});

router.post("/reviews/:id/helpful", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const reviewId = String(req.params.id);
  try {
    const [review] = await db
      .select({ id: reviewsTable.id, userId: reviewsTable.userId, helpfulVotes: reviewsTable.helpfulVotes })
      .from(reviewsTable)
      .where(eq(reviewsTable.id, reviewId))
      .limit(1);

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    if (review.userId === req.user.id) {
      res.status(400).json({ error: "You cannot mark your own review as helpful." });
      return;
    }

    try {
      await db.insert(reviewHelpfulVotesTable).values({
        reviewId,
        userId: req.user.id,
      });
    } catch {
      res.status(409).json({ error: "Already marked as helpful.", code: "ALREADY_VOTED" });
      return;
    }

    const [updated] = await db
      .update(reviewsTable)
      .set({ helpfulVotes: sql`${reviewsTable.helpfulVotes} + 1` })
      .where(eq(reviewsTable.id, reviewId))
      .returning({ helpfulVotes: reviewsTable.helpfulVotes });

    if (review.userId) {
      await db
        .update(usersTable)
        .set({
          helpfulReviewsCount: sql`${usersTable.helpfulReviewsCount} + 1`,
          reputationScore: sql`${usersTable.reputationScore} + 5`,
        })
        .where(eq(usersTable.id, review.userId));

      const [reviewer] = await db
        .select({ trustLevel: usersTable.trustLevel, reputationScore: usersTable.reputationScore, identityVerified: usersTable.identityVerified, identityVerifiedAt: usersTable.identityVerifiedAt, policyViolationsCount: usersTable.policyViolationsCount, helpfulReviewsCount: usersTable.helpfulReviewsCount, createdAt: usersTable.createdAt })
        .from(usersTable)
        .where(eq(usersTable.id, review.userId))
        .limit(1);

      if (reviewer) {
        const newLevel = computeTrustLevel(reviewer);
        if (newLevel > reviewer.trustLevel) {
          await db
            .update(usersTable)
            .set({ trustLevel: newLevel })
            .where(eq(usersTable.id, review.userId));
        }
      }
    }

    res.json({ ok: true, helpfulVotes: updated?.helpfulVotes ?? (review.helpfulVotes + 1) });
  } catch (err) {
    req.log.error({ err }, "Failed to mark review as helpful");
    res.status(500).json({ error: "Failed to mark review as helpful" });
  }
});

router.get("/admin/identity-verifications", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const rows = await db
      .select({
        id: identityVerificationsTable.id,
        userId: identityVerificationsTable.userId,
        status: identityVerificationsTable.status,
        submittedAt: identityVerificationsTable.submittedAt,
        reviewedAt: identityVerificationsTable.reviewedAt,
        adminNotes: identityVerificationsTable.adminNotes,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
      })
      .from(identityVerificationsTable)
      .leftJoin(usersTable, eq(identityVerificationsTable.userId, usersTable.id))
      .orderBy(sql`${identityVerificationsTable.submittedAt} desc`)
      .limit(200);
    res.json({ verifications: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch identity verifications");
    res.status(500).json({ error: "Failed to fetch identity verifications" });
  }
});

router.patch("/admin/identity-verifications/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const id = String(req.params.id);
  const { status, adminNotes } = req.body as { status: string; adminNotes?: string };

  if (status !== "approved" && status !== "rejected") {
    res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    return;
  }

  try {
    const [verification] = await db
      .update(identityVerificationsTable)
      .set({ status: status as "approved" | "rejected", adminNotes: adminNotes ?? null, reviewedAt: new Date(), reviewedBy: req.user?.id })
      .where(eq(identityVerificationsTable.id, id))
      .returning();

    if (!verification) {
      res.status(404).json({ error: "Verification not found" });
      return;
    }

    if (status === "approved") {
      await db
        .update(usersTable)
        .set({ identityVerified: true, identityVerifiedAt: new Date(), trustLevel: 2 })
        .where(and(eq(usersTable.id, verification.userId), eq(usersTable.trustLevel, 1)));
    }

    res.json({ ok: true, verification });
  } catch (err) {
    req.log.error({ err }, "Failed to update identity verification");
    res.status(500).json({ error: "Failed to update identity verification" });
  }
});

router.post("/admin/users/:id/ambassador", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const userId = String(req.params.id);
  try {
    const [user] = await db
      .update(usersTable)
      .set({ trustLevel: 4, reputationScore: sql`GREATEST(${usersTable.reputationScore}, 500)` })
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id, trustLevel: usersTable.trustLevel });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    req.log.info({ userId, grantedBy: req.user?.id }, "Community Ambassador granted");
    res.json({ ok: true, user, message: "Community Ambassador status granted." });
  } catch (err) {
    req.log.error({ err }, "Failed to grant ambassador status");
    res.status(500).json({ error: "Failed to grant ambassador status" });
  }
});

router.post("/admin/users/:id/policy-violation", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const userId = String(req.params.id);
  try {
    const [user] = await db
      .update(usersTable)
      .set({
        policyViolationsCount: sql`${usersTable.policyViolationsCount} + 1`,
        reputationScore: sql`GREATEST(0, ${usersTable.reputationScore} - 25)`,
      })
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id, policyViolationsCount: usersTable.policyViolationsCount, trustLevel: usersTable.trustLevel });

    if (!user) {
      res.status(404).json({ error: "User not found" }); return;
    }

    if (user.trustLevel === 3 && (user.policyViolationsCount ?? 0) > 0) {
      await db
        .update(usersTable)
        .set({ trustLevel: 2 })
        .where(eq(usersTable.id, userId));
    }

    req.log.info({ userId, by: req.user?.id }, "Policy violation recorded");
    res.json({ ok: true, user });
  } catch (err) {
    req.log.error({ err }, "Failed to record policy violation");
    res.status(500).json({ error: "Failed to record policy violation" });
  }
});

export default router;
