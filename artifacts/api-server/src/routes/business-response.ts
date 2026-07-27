import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessResponseLinksTable, safetyReportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const CATEGORY_LABELS: Record<string, string> = {
  safety: "Safety or Conduct Concern",
  discrimination: "Discrimination Concern",
  sundown: "Community Safety Warning",
  business: "Business Experience Concern",
};

/** GET /business-response/:token
 *  Public — returns form metadata for the response page.
 *  Does NOT return the full report description (privacy protection).
 */
router.get("/business-response/:token", async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params as { token: string };

  try {
    const [link] = await db
      .select()
      .from(businessResponseLinksTable)
      .where(eq(businessResponseLinksTable.token, token))
      .limit(1);

    if (!link) {
      res.status(404).json({ error: "This link is invalid or has expired." });
      return;
    }

    if (link.status === "responded") {
      res.json({
        status: "responded",
        businessName: link.businessName,
        respondedAt: link.respondedAt,
        message: "A response has already been submitted for this report.",
      });
      return;
    }

    if (link.status === "expired" || link.expiresAt < new Date()) {
      if (link.status !== "expired") {
        await db
          .update(businessResponseLinksTable)
          .set({ status: "expired" })
          .where(eq(businessResponseLinksTable.token, token));
      }
      res.status(410).json({ error: "This response link has expired." });
      return;
    }

    res.json({
      status: "pending",
      businessName: link.businessName,
      reportCategory: link.reportCategory,
      categoryLabel: CATEGORY_LABELS[link.reportCategory ?? ""] ?? "Community Concern",
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load business response link");
    res.status(500).json({ error: "Failed to load response form" });
  }
});

/** POST /business-response/:token
 *  Public — submits the business response.
 */
router.post("/business-response/:token", async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params as { token: string };
  const { responseStatement, correctiveActions, trustPlan, disputesFacts, disputeDetails } =
    req.body as {
      responseStatement?: string;
      correctiveActions?: string;
      trustPlan?: string;
      disputesFacts?: boolean;
      disputeDetails?: string;
    };

  if (!responseStatement?.trim()) {
    res.status(400).json({ error: "A response statement is required." });
    return;
  }

  try {
    const [link] = await db
      .select()
      .from(businessResponseLinksTable)
      .where(eq(businessResponseLinksTable.token, token))
      .limit(1);

    if (!link) {
      res.status(404).json({ error: "This link is invalid or has expired." });
      return;
    }

    if (link.status === "responded") {
      res.status(409).json({ error: "A response has already been submitted." });
      return;
    }

    if (link.status === "expired" || link.expiresAt < new Date()) {
      res.status(410).json({ error: "This response link has expired." });
      return;
    }

    await db
      .update(businessResponseLinksTable)
      .set({
        status: "responded",
        responseStatement: responseStatement.trim().slice(0, 5000),
        correctiveActions: correctiveActions?.trim().slice(0, 3000) ?? null,
        trustPlan: trustPlan?.trim().slice(0, 3000) ?? null,
        disputesFacts: disputesFacts === true,
        disputeDetails: disputesFacts ? (disputeDetails?.trim().slice(0, 3000) ?? null) : null,
        respondedAt: new Date(),
      })
      .where(eq(businessResponseLinksTable.token, token));

    await db
      .update(safetyReportsTable)
      .set({ status: "business_responded" })
      .where(eq(safetyReportsTable.id, link.reportId));

    res.json({ message: "Your response has been submitted. Our moderation team will review it and it will become visible alongside the community report." });
  } catch (err) {
    req.log.error({ err }, "Failed to submit business response");
    res.status(500).json({ error: "Failed to submit response" });
  }
});

export default router;
