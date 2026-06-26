import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessResponseLinksTable, safetyReportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendBusinessResponseInvitation } from "../lib/email";

const router: IRouter = Router();

const SAFETY_CATEGORIES = ["safety", "discrimination", "sundown"];
const CATEGORY_LABELS: Record<string, string> = {
  safety: "Safety or Conduct Concern",
  discrimination: "Discrimination Concern",
  sundown: "Community Safety Warning",
  business: "Business Experience Concern",
};
const TOKEN_EXPIRY_DAYS = 30;

/** POST /reports/:id/send-response-invitation
 *  Moderator/admin endpoint — generates a secure response link and emails the business.
 */
router.post("/reports/:id/send-response-invitation", async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const reportId = req.params["id"] as string;
  const { businessEmail, businessName } = req.body as { businessEmail?: string; businessName?: string };

  if (!businessEmail || !businessName) {
    res.status(400).json({ error: "businessEmail and businessName are required" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(businessEmail)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  try {
    const [report] = await db
      .select()
      .from(safetyReportsTable)
      .where(eq(safetyReportsTable.id, reportId))
      .limit(1);

    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    if (!SAFETY_CATEGORIES.includes(report.category)) {
      res.status(400).json({
        error: "Response invitations are only sent for safety, discrimination, or sundown-related reports.",
        reportCategory: report.category,
      });
      return;
    }

    const existing = await db
      .select({ id: businessResponseLinksTable.id, status: businessResponseLinksTable.status })
      .from(businessResponseLinksTable)
      .where(eq(businessResponseLinksTable.reportId, reportId))
      .limit(1);

    if (existing.length > 0 && existing[0]!.status !== "expired") {
      res.status(409).json({ error: "A response invitation has already been sent for this report." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const [link] = await db
      .insert(businessResponseLinksTable)
      .values({
        token,
        reportId,
        reportCategory: report.category,
        businessName: businessName.trim(),
        businessEmail: businessEmail.trim().toLowerCase(),
        expiresAt,
      })
      .returning();

    const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "mappingwithmelanin.com";
    const responseUrl = `https://${domain}/business-response/${token}`;

    await sendBusinessResponseInvitation(businessEmail.trim(), businessName.trim(), responseUrl, report.category);

    res.status(201).json({
      message: "Response invitation sent successfully.",
      linkId: link!.id,
      expiresAt,
      responseUrl,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to send business response invitation");
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

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
