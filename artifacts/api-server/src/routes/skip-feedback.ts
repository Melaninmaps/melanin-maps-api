import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessSkipFeedbackTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

router.post("/businesses/:id/skip-feedback", async (req: Request, res: Response) => {
  try {
    const businessId = String(req.params["id"]);
    const { message } = req.body as { message?: string };

    if (!message?.trim()) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const [business] = await db
      .select({ id: businessesTable.id, feedbackOptIn: businessesTable.feedbackOptIn })
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

    logger.info({ businessId }, "[skip-feedback] feedback submitted");
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

    const [business] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, req.user.id))
      .limit(1);

    if (!business) {
      res.status(404).json({ error: "No business found." });
      return;
    }

    const feedback = await db
      .select()
      .from(businessSkipFeedbackTable)
      .where(eq(businessSkipFeedbackTable.businessId, business.id))
      .orderBy(businessSkipFeedbackTable.createdAt);

    res.json({ feedback });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/mine/skip-feedback error");
    res.status(500).json({ error: "Failed to fetch feedback." });
  }
});

export default router;
