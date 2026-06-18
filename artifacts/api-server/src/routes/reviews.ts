import { Router, type IRouter, type Request, type Response } from "express";
import { db, reviewsTable, pointsLedgerTable, POINTS_VALUES } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

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

router.post("/reviews", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { businessId, rating, text, wouldReturnAlone } = req.body as Record<string, unknown>;
  if (!businessId || !rating) {
    res.status(400).json({ error: "businessId and rating required" });
    return;
  }
  try {
    const [review] = await db
      .insert(reviewsTable)
      .values({
        userId: req.user.id,
        businessId: businessId as string,
        authorName:
          [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") ||
          "Community Member",
        rating: Number(rating),
        text: typeof text === "string" ? text : null,
        wouldReturnAlone: typeof wouldReturnAlone === "boolean" ? wouldReturnAlone : null,
      })
      .returning();

    await db.insert(pointsLedgerTable).values({
      userId: req.user.id,
      action: "review",
      points: POINTS_VALUES.review,
      entityId: review.id,
    });

    res.status(201).json({ review, pointsEarned: POINTS_VALUES.review });
  } catch (err) {
    req.log.error({ err }, "Failed to submit review");
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;
