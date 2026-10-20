import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessSkipFeedbackTable, businessOwnerLinksTable, conversations as convTable, messages as msgsTable } from "@workspace/db";
import { and, eq, isNull } from "drizzle-orm";
import { checkContent } from "../lib/contentFilter";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const INFLAMMATORY_PATTERNS: RegExp[] = [
  /\byou('re| are) (trash|garbage|terrible|pathetic|disgusting|worthless|a joke|horrible|awful|disgusting)\b/i,
  /\bshut (this place|it) down\b/i,
  /\bnever coming back( here)?\b/i,
  /\bwaste of (time|money|space)\b/i,
  /\bworst (place|business|owner|service|experience) (ever|i've)\b/i,
  /\bterrible (owner|people|person|staff|management)\b/i,
  /\browns? (this place|the business|it)\b/i,
  /\bstay away\b/i,
  /\bscam(mers?)?\b/i,
  /\bsteal(ing)? from\b/i,
  /\bfraud\b/i,
  /\bskip this (place|business)\b/i,
];

function checkBusinessFeedback(text: string): { ok: boolean; reason?: string } {
  const base = checkContent(text);
  if (!base.ok) return { ok: false, reason: base.reason };
  for (const pat of INFLAMMATORY_PATTERNS) {
    if (pat.test(text)) {
      return { ok: false, reason: "Feedback contains language that may be inflammatory or personal. Please focus on specific, actionable suggestions (e.g. parking, accessibility, wait times)." };
    }
  }
  return { ok: true };
}

async function getSelectedOwnedBusiness(userId: string, businessId: string) {
  if (!businessId) return null;
  const [ownerLink] = await db
    .select({ businessId: businessOwnerLinksTable.businessId })
    .from(businessOwnerLinksTable)
    .where(
      and(
        eq(businessOwnerLinksTable.businessId, businessId),
        eq(businessOwnerLinksTable.userId, userId),
        eq(businessOwnerLinksTable.role, "owner"),
        eq(businessOwnerLinksTable.status, "approved"),
        isNull((businessOwnerLinksTable as unknown as { revokedAt: any }).revokedAt),
      ),
    )
    .limit(1);
  if (!ownerLink) return null;

  const [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  return business ?? null;
}

async function deliverToOwnerInbox(businessId: string, ownerId: string, businessName: string, message: string): Promise<void> {
  try {
    const preview = message.length > 80 ? message.slice(0, 77) + "…" : message;
    const now = new Date();

    const [existing] = await db
      .select({ id: convTable.id })
      .from(convTable)
      .where(
        and(
          eq(convTable.businessId, businessId),
          eq(convTable.title, `🔒 Private Feedback — ${businessName}`)
        )
      )
      .limit(1);

    let convId: number;
    if (existing) {
      convId = existing.id;
      await db
        .update(convTable)
        .set({ participantIds: [ownerId] })
        .where(eq(convTable.id, convId));
    } else {
      const [created] = await db
        .insert(convTable)
        .values({
          title: `🔒 Private Feedback — ${businessName}`,
          participantIds: [ownerId],
          businessId,
          lastMessageAt: now,
          lastMessagePreview: preview,
        })
        .returning({ id: convTable.id });
      if (!created) throw new Error("Failed to create feedback conversation");
      convId = created.id;
    }

    await db.insert(msgsTable).values({
      conversationId: convId,
      role: "feedback",
      content: message,
    });

    await db
      .update(convTable)
      .set({ lastMessageAt: now, lastMessagePreview: preview })
      .where(eq(convTable.id, convId));
  } catch (err) {
    logger.error({ err, businessId }, "[skip-feedback] failed to deliver to owner inbox");
  }
}

router.post("/businesses/:id/skip-feedback", async (req: Request, res: Response) => {
  try {
    const businessId = String(req.params["id"]);
    const { message } = req.body as { message?: string };

    if (!message?.trim()) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const [business] = await db
      .select({
        id: businessesTable.id,
        name: businessesTable.name,
        feedbackOptIn: businessesTable.feedbackOptIn,
      })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    if (!business) {
      res.status(404).json({ error: "Business not found." });
      return;
    }

    if (!business.feedbackOptIn) {
      res.status(403).json({ error: "This business has not enabled direct feedback." });
      return;
    }

    const filterResult = checkBusinessFeedback(message.trim());
    const wasFiltered = !filterResult.ok;

    if (wasFiltered) {
      res.status(422).json({ filtered: true, reason: filterResult.reason });
      return;
    }

    await db.insert(businessSkipFeedbackTable).values({
      businessId,
      submittedById: req.user?.id ?? null,
      message: message.trim(),
      wasFiltered: false,
    });

    try {
      const activeOwnerLinks = await db
        .select({ userId: businessOwnerLinksTable.userId })
        .from(businessOwnerLinksTable)
        .where(and(
          eq(businessOwnerLinksTable.businessId, businessId),
          eq(businessOwnerLinksTable.role, "owner"),
          eq(businessOwnerLinksTable.status, "approved"),
          isNull(businessOwnerLinksTable.revokedAt),
        ))
        .limit(2);

      const [approvedOwnerLink] = activeOwnerLinks;
      if (activeOwnerLinks.length === 1 && approvedOwnerLink?.userId) {
        await deliverToOwnerInbox(businessId, approvedOwnerLink.userId, business.name, message.trim());
      }
    } catch (err) {
      logger.error({ err, businessId }, "[skip-feedback] failed to resolve owner delivery recipient");
    }

    logger.info({ businessId }, "[skip-feedback] feedback submitted; owner inbox delivery evaluated under exact-one active-owner policy");
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "POST /businesses/:id/skip-feedback error");
    res.status(500).json({ error: "Failed to submit feedback." });
  }
});

router.patch("/businesses/mine/feedback-opt-in", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    const { enabled } = req.body as { enabled?: boolean };
    if (typeof enabled !== "boolean") {
      res.status(400).json({ error: "enabled (boolean) is required." });
      return;
    }

    const [business] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, req.user.id))
      .limit(1);

    if (!business) {
      res.status(404).json({ error: "No business found for your account." });
      return;
    }

    await db
      .update(businessesTable)
      .set({ feedbackOptIn: enabled })
      .where(eq(businessesTable.id, business.id));

    logger.info({ businessId: business.id, enabled }, "[skip-feedback] opt-in toggled");
    res.json({ success: true, feedbackOptIn: enabled });
  } catch (err) {
    req.log.error({ err }, "PATCH /businesses/mine/feedback-opt-in error");
    res.status(500).json({ error: "Failed to update setting." });
  }
});

router.get("/businesses/mine/skip-feedback", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const [approvedOwnerLink] = await db
      .select({ businessId: businessOwnerLinksTable.businessId })
      .from(businessOwnerLinksTable)
      .where(and(
        eq(businessOwnerLinksTable.userId, req.user.id),
        eq(businessOwnerLinksTable.role, "owner"),
        eq(businessOwnerLinksTable.status, "approved"),
        isNull(businessOwnerLinksTable.revokedAt),
      ))
      .limit(1);

    let businessId: string;
    if (approvedOwnerLink) {
      businessId = approvedOwnerLink.businessId;
    } else {
      const [legacyBusiness] = await db
        .select({ id: businessesTable.id })
        .from(businessesTable)
        .where(eq(businessesTable.submittedById, req.user.id))
        .limit(1);

      if (!legacyBusiness) {
        res.status(404).json({ error: "No business found." });
        return;
      }

      const [activeOwnerLink] = await db
        .select({ id: businessOwnerLinksTable.id })
        .from(businessOwnerLinksTable)
        .where(and(
          eq(businessOwnerLinksTable.businessId, legacyBusiness.id),
          eq(businessOwnerLinksTable.role, "owner"),
          eq(businessOwnerLinksTable.status, "approved"),
          isNull(businessOwnerLinksTable.revokedAt),
        ))
        .limit(1);

      if (activeOwnerLink) {
        res.status(404).json({ error: "No business found." });
        return;
      }

      businessId = legacyBusiness.id;
    }

    const feedback = await db
      .select({
        id: businessSkipFeedbackTable.id,
        message: businessSkipFeedbackTable.message,
        createdAt: businessSkipFeedbackTable.createdAt,
      })
      .from(businessSkipFeedbackTable)
      .where(eq(businessSkipFeedbackTable.businessId, businessId))
      .orderBy(businessSkipFeedbackTable.createdAt);

    res.json({ feedback });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/mine/skip-feedback error");
    res.status(500).json({ error: "Failed to fetch feedback." });
  }
});

router.patch(
  "/businesses/mine/managed/:businessId/feedback-opt-in",
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }
      const { enabled } = req.body as { enabled?: boolean };
      if (typeof enabled !== "boolean") {
        res.status(400).json({ error: "enabled (boolean) is required." });
        return;
      }
      const businessId =
        typeof req.params.businessId === "string" ? req.params.businessId.trim() : "";
      const business = await getSelectedOwnedBusiness(req.user.id, businessId);
      if (!business) {
        res.status(404).json({ error: "No business found." });
        return;
      }

      await db
        .update(businessesTable)
        .set({ feedbackOptIn: enabled })
        .where(eq(businessesTable.id, business.id));

      logger.info({ businessId: business.id, enabled }, "[skip-feedback] selected opt-in toggled");
      res.json({ success: true, feedbackOptIn: enabled });
    } catch (err) {
      req.log.error({ err }, "PATCH /businesses/mine/managed/:businessId/feedback-opt-in error");
      res.status(500).json({ error: "Failed to update setting." });
    }
  },
);

router.get(
  "/businesses/mine/managed/:businessId/skip-feedback",
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }
      const businessId =
        typeof req.params.businessId === "string" ? req.params.businessId.trim() : "";
      const business = await getSelectedOwnedBusiness(req.user.id, businessId);
      if (!business) {
        res.status(404).json({ error: "No business found." });
        return;
      }

      const feedback = await db
        .select({
          id: businessSkipFeedbackTable.id,
          message: businessSkipFeedbackTable.message,
          createdAt: businessSkipFeedbackTable.createdAt,
        })
        .from(businessSkipFeedbackTable)
        .where(eq(businessSkipFeedbackTable.businessId, business.id))
        .orderBy(businessSkipFeedbackTable.createdAt);

      res.json({ feedback });
    } catch (err) {
      req.log.error({ err }, "GET /businesses/mine/managed/:businessId/skip-feedback error");
      res.status(500).json({ error: "Failed to fetch feedback." });
    }
  },
);

export default router;
