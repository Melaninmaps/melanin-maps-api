import { Router, type IRouter, type Request, type Response } from "express";
import { db, pinnedBusinessItemsTable, businessesTable, usersTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";
import { businessOwnerLinksTable, reviewsTable } from "@workspace/db";
import { isNull } from "drizzle-orm";

const router: IRouter = Router();

const PIN_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

async function getOwnerBusinessId(userId: string): Promise<string | null> {
  const [biz] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.submittedById, userId))
    .limit(1);
  return biz?.id ?? null;
}

/* ------------------------------------------------------------------ */
/* GET /businesses/:id/pinned — public: pinned items for a business    */
/* ------------------------------------------------------------------ */
router.get("/businesses/:id/pinned", async (req: Request, res: Response) => {
  const businessId = String(req.params.id);
  try {
    const items = await db
      .select()
      .from(pinnedBusinessItemsTable)
      .where(and(eq(pinnedBusinessItemsTable.businessId, businessId), eq(pinnedBusinessItemsTable.status, "active")))
      .orderBy(desc(pinnedBusinessItemsTable.pinnedAt))
      .limit(4);

    // Mark expired ones
    const now = Date.now();
    const active = items.filter((i) => new Date(i.expiresAt).getTime() > now);
    res.json({ pinned: active });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/:id/pinned error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* GET /business/pinned — owner: see own pins with expiry status       */
/* ------------------------------------------------------------------ */
router.get("/business/pinned", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  try {
    const businessId = await getOwnerBusinessId(req.user.id);
    if (!businessId) { res.status(404).json({ error: "No business found for this account" }); return; }

    const items = await db
      .select()
      .from(pinnedBusinessItemsTable)
      .where(eq(pinnedBusinessItemsTable.businessId, businessId))
      .orderBy(desc(pinnedBusinessItemsTable.pinnedAt));

    const now = Date.now();
    const enriched = items.map((item) => {
      const expiresMs = new Date(item.expiresAt).getTime();
      const daysLeft = Math.max(0, Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24)));
      const isExpired = expiresMs <= now;
      const isExpiringSoon = !isExpired && daysLeft <= 14;
      return { ...item, daysLeft, isExpired, isExpiringSoon };
    });

    res.json({ pinned: enriched, businessId });
  } catch (err) {
    req.log.error({ err }, "GET /business/pinned error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* POST /business/pinned — owner: pin a review or video                */
/* ------------------------------------------------------------------ */
router.post("/business/pinned", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const {
    itemType, reviewId, reviewText, reviewAuthor, reviewRating,
    reviewInitials, reviewColor, reviewTimeAgo, videoUrl, videoTitle,
  } = req.body as Record<string, unknown>;

  if (itemType !== "review" && itemType !== "video") {
    res.status(400).json({ error: "itemType must be 'review' or 'video'" });
    return;
  }

  try {
    const businessId = await getOwnerBusinessId(req.user.id);
    if (!businessId) { res.status(404).json({ error: "No business found for this account" }); return; }

    // Max 2 active pins total (1 review + 1 video, or 2 of the same type)
    const existing = await db
      .select({ id: pinnedBusinessItemsTable.id, itemType: pinnedBusinessItemsTable.itemType })
      .from(pinnedBusinessItemsTable)
      .where(and(eq(pinnedBusinessItemsTable.businessId, businessId), eq(pinnedBusinessItemsTable.status, "active")));

    const sameType = existing.filter((e) => e.itemType === itemType);
    if (sameType.length >= 1) {
      // Mark existing same-type as replaced
      for (const s of sameType) {
        await db.update(pinnedBusinessItemsTable).set({ status: "replaced" }).where(eq(pinnedBusinessItemsTable.id, s.id));
      }
    }

    const expiresAt = new Date(Date.now() + PIN_DURATION_MS);

    const [item] = await db
      .insert(pinnedBusinessItemsTable)
      .values({
        businessId,
        itemType: itemType as "review" | "video",
        reviewId: typeof reviewId === "string" ? reviewId : null,
        reviewText: typeof reviewText === "string" ? reviewText : null,
        reviewAuthor: typeof reviewAuthor === "string" ? reviewAuthor : null,
        reviewRating: typeof reviewRating === "number" ? reviewRating : null,
        reviewInitials: typeof reviewInitials === "string" ? reviewInitials : null,
        reviewColor: typeof reviewColor === "string" ? reviewColor : null,
        reviewTimeAgo: typeof reviewTimeAgo === "string" ? reviewTimeAgo : null,
        videoUrl: typeof videoUrl === "string" ? videoUrl : null,
        videoTitle: typeof videoTitle === "string" ? videoTitle : null,
        expiresAt,
      })
      .returning();

    res.json({ pinned: item, message: "Pinned for 90 days" });
  } catch (err) {
    req.log.error({ err }, "POST /business/pinned error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* DELETE /business/pinned/:id — owner: unpin an item                  */
/* ------------------------------------------------------------------ */
router.delete("/business/pinned/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const itemId = Number(req.params.id);

  try {
    const businessId = await getOwnerBusinessId(req.user.id);
    if (!businessId) { res.status(404).json({ error: "No business found" }); return; }

    const [item] = await db
      .select({ id: pinnedBusinessItemsTable.id })
      .from(pinnedBusinessItemsTable)
      .where(and(eq(pinnedBusinessItemsTable.id, itemId), eq(pinnedBusinessItemsTable.businessId, businessId)))
      .limit(1);

    if (!item) { res.status(404).json({ error: "Pin not found" }); return; }

    await db.update(pinnedBusinessItemsTable).set({ status: "replaced" }).where(eq(pinnedBusinessItemsTable.id, itemId));
    res.json({ message: "Unpinned" });
  } catch (err) {
    req.log.error({ err }, "DELETE /business/pinned/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* Selected owner routes — explicit target; legacy routes stay above   */
/* ------------------------------------------------------------------ */

function parseSelectedBusinessId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const businessId = value.trim();
  if (!businessId || businessId !== value || businessId.length > 128) return null;
  return businessId;
}

function parsePinnedItemId(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const itemId = Number(value);
  return Number.isSafeInteger(itemId) && itemId > 0 ? itemId : null;
}

function formatPinnedReviewDate(createdAt: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(createdAt);
}

async function resolveSelectedApprovedOwnerBusinessId(
  userId: string,
  requestedBusinessId: unknown,
): Promise<string | null> {
  const businessId = parseSelectedBusinessId(requestedBusinessId);
  if (!businessId) return null;

  const [ownerLink] = await db
    .select({ businessId: businessOwnerLinksTable.businessId })
    .from(businessOwnerLinksTable)
    .where(and(
      eq(businessOwnerLinksTable.userId, userId),
      eq(businessOwnerLinksTable.businessId, businessId),
      eq(businessOwnerLinksTable.role, "owner"),
      eq(businessOwnerLinksTable.status, "approved"),
      isNull(businessOwnerLinksTable.revokedAt),
    ))
    .limit(1);

  return ownerLink?.businessId === businessId ? businessId : null;
}

async function requireSelectedApprovedOwnerBusiness(
  req: Request,
  res: Response,
): Promise<string | null> {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  if (!parseSelectedBusinessId(req.params.businessId)) {
    res.status(400).json({ error: "A valid business selection is required" });
    return null;
  }

  const businessId = await resolveSelectedApprovedOwnerBusinessId(
    String(req.user.id),
    req.params.businessId,
  );
  if (!businessId) {
    // A neutral response avoids revealing whether another member owns the ID.
    res.status(404).json({ error: "Selected business unavailable" });
    return null;
  }

  return businessId;
}

function enrichPinnedItems(items: Awaited<ReturnType<typeof getPinnedItems>>) {
  const now = Date.now();
  return items.map((item) => {
    const expiresMs = new Date(item.expiresAt).getTime();
    const daysLeft = Math.max(0, Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24)));
    const isExpired = expiresMs <= now;
    return {
      ...item,
      daysLeft,
      isExpired,
      isExpiringSoon: !isExpired && daysLeft <= 14,
    };
  });
}

async function getPinnedItems(businessId: string) {
  return db
    .select()
    .from(pinnedBusinessItemsTable)
    .where(eq(pinnedBusinessItemsTable.businessId, businessId))
    .orderBy(desc(pinnedBusinessItemsTable.pinnedAt));
}

router.get(
  "/businesses/mine/managed/:businessId/pinned",
  async (req: Request, res: Response) => {
    try {
      const businessId = await requireSelectedApprovedOwnerBusiness(req, res);
      if (!businessId) return;

      const items = await getPinnedItems(businessId);
      res.json({ pinned: enrichPinnedItems(items), businessId });
    } catch (err) {
      req.log.error({ err }, "GET selected managed business pinned error");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.post(
  "/businesses/mine/managed/:businessId/pinned",
  async (req: Request, res: Response) => {
    try {
      // Authorize the selected owner before reading request item data or pins.
      const businessId = await requireSelectedApprovedOwnerBusiness(req, res);
      if (!businessId) return;

      const body = req.body as Record<string, unknown>;
      const itemType = body.itemType;
      if (itemType !== "review" && itemType !== "video") {
        res.status(400).json({ error: "itemType must be 'review' or 'video'" });
        return;
      }

      let reviewValues: {
        reviewId: string | null;
        reviewText: string | null;
        reviewAuthor: string | null;
        reviewRating: number | null;
        reviewInitials: string | null;
        reviewColor: string | null;
        reviewTimeAgo: string | null;
      } = {
        reviewId: null,
        reviewText: null,
        reviewAuthor: null,
        reviewRating: null,
        reviewInitials: null,
        reviewColor: null,
        reviewTimeAgo: null,
      };

      if (itemType === "review") {
        const reviewId = typeof body.reviewId === "string" ? body.reviewId.trim() : "";
        if (!reviewId) {
          res.status(400).json({ error: "A review selection is required" });
          return;
        }

        // Read the review only through the selected business ID. The client may
        // provide display metadata, but cannot pin an A review into B.
        const [review] = await db
          .select({
            id: reviewsTable.id,
            businessId: reviewsTable.businessId,
            authorName: reviewsTable.authorName,
            rating: reviewsTable.rating,
            text: reviewsTable.text,
            createdAt: reviewsTable.createdAt,
          })
          .from(reviewsTable)
          .where(and(
            eq(reviewsTable.id, reviewId),
            eq(reviewsTable.businessId, businessId),
          ))
          .limit(1);

        if (!review) {
          res.status(404).json({ error: "Review unavailable for selected business" });
          return;
        }

        reviewValues = {
          reviewId: review.id,
          reviewText: review.text,
          reviewAuthor: review.authorName,
          reviewRating: review.rating,
          reviewInitials: review.authorName
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "?",
          reviewColor: null,
          reviewTimeAgo: formatPinnedReviewDate(review.createdAt),
        };
      }

      const existing = await db
        .select({ id: pinnedBusinessItemsTable.id, itemType: pinnedBusinessItemsTable.itemType })
        .from(pinnedBusinessItemsTable)
        .where(and(
          eq(pinnedBusinessItemsTable.businessId, businessId),
          eq(pinnedBusinessItemsTable.status, "active"),
        ));

      for (const item of existing.filter((entry) => entry.itemType === itemType)) {
        await db
          .update(pinnedBusinessItemsTable)
          .set({ status: "replaced" })
          .where(and(
            eq(pinnedBusinessItemsTable.id, item.id),
            eq(pinnedBusinessItemsTable.businessId, businessId),
          ));
      }

      const [pinned] = await db
        .insert(pinnedBusinessItemsTable)
        .values({
          businessId,
          itemType,
          ...reviewValues,
          videoUrl: itemType === "video" && typeof body.videoUrl === "string" ? body.videoUrl : null,
          videoTitle: itemType === "video" && typeof body.videoTitle === "string" ? body.videoTitle : null,
          expiresAt: new Date(Date.now() + PIN_DURATION_MS),
        })
        .returning();

      res.json({ pinned, businessId, message: "Pinned for 90 days" });
    } catch (err) {
      req.log.error({ err }, "POST selected managed business pinned error");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.delete(
  "/businesses/mine/managed/:businessId/pinned/:itemId",
  async (req: Request, res: Response) => {
    try {
      const businessId = await requireSelectedApprovedOwnerBusiness(req, res);
      if (!businessId) return;

      const itemId = parsePinnedItemId(req.params.itemId);
      if (!itemId) {
        res.status(400).json({ error: "A valid pin selection is required" });
        return;
      }

      const [pinned] = await db
        .select({ id: pinnedBusinessItemsTable.id })
        .from(pinnedBusinessItemsTable)
        .where(and(
          eq(pinnedBusinessItemsTable.id, itemId),
          eq(pinnedBusinessItemsTable.businessId, businessId),
        ))
        .limit(1);
      if (!pinned) {
        res.status(404).json({ error: "Pin unavailable for selected business" });
        return;
      }

      await db
        .update(pinnedBusinessItemsTable)
        .set({ status: "replaced" })
        .where(and(
          eq(pinnedBusinessItemsTable.id, itemId),
          eq(pinnedBusinessItemsTable.businessId, businessId),
        ));
      res.json({ businessId, message: "Unpinned" });
    } catch (err) {
      req.log.error({ err }, "DELETE selected managed business pinned error");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
