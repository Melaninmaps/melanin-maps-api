import { Router, type IRouter, type Request, type Response } from "express";
import { db, docusignEnvelopesTable, businessesTable, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import {
  createSellerAgreementEnvelope,
  createFoundingAgreementEnvelope,
  createVerificationEnvelope,
  getEnvelopeStatus,
  getEmbeddedSigningUrl,
  docuSignConsentUrl,
} from "../lib/docusign";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: Request) { return !!(req.user as any)?.email && ADMIN_EMAILS.includes((req.user as any).email); }

function baseUrl(): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  return domain ? `https://${domain}` : "";
}

// ── GET /api/docusign/consent-url ─────────────────────────────────────────
// Returns the one-time consent URL an admin needs to visit to authorize JWT auth.
router.get("/docusign/consent-url", (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
  res.json({ url: docuSignConsentUrl() });
});

// ── POST /api/docusign/seller-agreement ───────────────────────────────────
// Business owner calls this to get an embedded signing URL for the Seller Agreement.
router.post("/docusign/seller-agreement", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { businessId } = req.body as { businessId?: string };
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }

  try {
    const [biz] = await db
      .select({ id: businessesTable.id, name: businessesTable.name, submittedById: businessesTable.submittedById, sellerAgreementAcceptedAt: businessesTable.sellerAgreementAcceptedAt })
      .from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);

    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    if (biz.submittedById !== req.user.id && !isAdmin(req)) { res.status(403).json({ error: "Access denied" }); return; }
    if (biz.sellerAgreementAcceptedAt) { res.json({ alreadySigned: true }); return; }

    const [user] = await db.select({ email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);

    if (!user?.email) { res.status(400).json({ error: "User email required for signing" }); return; }

    const ownerName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
    const returnUrl = `${baseUrl()}/api/docusign/signed?type=seller_agreement&businessId=${businessId}`;

    // Check for an existing pending seller-agreement envelope for this specific business
    const [existing] = await db.select().from(docusignEnvelopesTable)
      .where(and(
        eq(docusignEnvelopesTable.businessId, businessId),
        eq(docusignEnvelopesTable.type, "seller_agreement"),
      ))
      .limit(1);

    if (existing && existing.status !== "completed") {
      try {
        const current = await getEnvelopeStatus(existing.envelopeId);
        if (current.status === "completed") {
          await db.update(businessesTable).set({ sellerAgreementAcceptedAt: new Date(), updatedAt: new Date() }).where(eq(businessesTable.id, businessId));
          await db.update(docusignEnvelopesTable).set({ status: "completed", updatedAt: new Date() }).where(eq(docusignEnvelopesTable.envelopeId, existing.envelopeId));
          res.json({ alreadySigned: true }); return;
        }
        // Re-use existing envelope — get a fresh embedded signing URL using the static import
        const signingUrl = await getEmbeddedSigningUrl(existing.envelopeId, user.email, ownerName, req.user.id, returnUrl);
        res.json({ signingUrl, envelopeId: existing.envelopeId }); return;
      } catch { /* fall through to create a new envelope */ }
    }

    const { envelopeId, signingUrl } = await createSellerAgreementEnvelope({
      businessId,
      businessName: biz.name,
      ownerName,
      signerEmail: user.email,
      clientUserId: req.user.id,
      returnUrl,
    });

    await db.insert(docusignEnvelopesTable).values({
      envelopeId,
      businessId,
      userId: req.user.id,
      type: "seller_agreement",
      status: "sent",
      signerEmail: user.email,
      signerName: ownerName,
    }).onConflictDoUpdate({ target: docusignEnvelopesTable.envelopeId, set: { status: "sent" } });

    res.json({ signingUrl, envelopeId });
  } catch (err) {
    req.log.error({ err }, "Failed to create seller agreement envelope");
    res.status(500).json({ error: "Failed to initiate DocuSign signing" });
  }
});

// ── POST /api/docusign/founding-agreement/:businessId ─────────────────────
// Admin triggers a Founding Agreement envelope when granting founding status.
router.post("/docusign/founding-agreement/:businessId", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }

  const businessId = String(req.params.businessId);

  try {
    const [biz] = await db
      .select({ id: businessesTable.id, name: businessesTable.name, submittedById: businessesTable.submittedById, foundingNumber: businessesTable.foundingNumber })
      .from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);

    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    if (!biz.submittedById) { res.status(400).json({ error: "Business has no owner" }); return; }

    const [user] = await db.select({ email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(eq(usersTable.id, biz.submittedById)).limit(1);

    if (!user?.email) { res.status(400).json({ error: "Owner email not found" }); return; }

    const ownerName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
    const returnUrl = `${baseUrl()}/api/docusign/signed?type=founding_agreement&businessId=${businessId}`;

    const { envelopeId, signingUrl } = await createFoundingAgreementEnvelope({
      businessId,
      businessName: biz.name,
      ownerName,
      foundingNumber: biz.foundingNumber ?? 1,
      signerEmail: user.email,
      clientUserId: biz.submittedById,
      returnUrl,
    });

    await db.insert(docusignEnvelopesTable).values({
      envelopeId,
      businessId,
      userId: biz.submittedById,
      type: "founding_agreement",
      status: "sent",
      signerEmail: user.email,
      signerName: ownerName,
    }).onConflictDoUpdate({ target: docusignEnvelopesTable.envelopeId, set: { status: "sent" } });

    res.json({ signingUrl, envelopeId, message: "Founding agreement sent" });
  } catch (err) {
    req.log.error({ err }, "Failed to create founding agreement envelope");
    res.status(500).json({ error: "Failed to send founding agreement" });
  }
});

// ── POST /api/docusign/verification-certification ─────────────────────────
// Sends a verification certification to the business owner after they submit docs.
router.post("/docusign/verification-certification", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { businessName, ownerName } = req.body as { businessName?: string; ownerName?: string };
  if (!businessName || !ownerName) { res.status(400).json({ error: "businessName and ownerName required" }); return; }

  try {
    const [user] = await db.select({ email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);

    if (!user?.email) { res.status(400).json({ error: "User email required" }); return; }

    const returnUrl = `${baseUrl()}/api/docusign/signed?type=verification`;

    const { envelopeId, signingUrl } = await createVerificationEnvelope({
      businessName,
      ownerName,
      signerEmail: user.email,
      clientUserId: req.user.id,
      returnUrl,
    });

    await db.insert(docusignEnvelopesTable).values({
      envelopeId,
      userId: req.user.id,
      type: "verification",
      status: "sent",
      signerEmail: user.email,
      signerName: ownerName,
    }).onConflictDoUpdate({ target: docusignEnvelopesTable.envelopeId, set: { status: "sent" } });

    res.json({ signingUrl, envelopeId });
  } catch (err) {
    req.log.error({ err }, "Failed to create verification certification envelope");
    res.status(500).json({ error: "Failed to initiate verification signing" });
  }
});

// ── GET /api/docusign/status/:envelopeId ──────────────────────────────────
router.get("/docusign/status/:envelopeId", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const envelopeId = String(req.params.envelopeId);

  try {
    const [record] = await db.select().from(docusignEnvelopesTable)
      .where(eq(docusignEnvelopesTable.envelopeId, envelopeId)).limit(1);

    if (!record) { res.status(404).json({ error: "Envelope not found" }); return; }
    if (record.userId !== req.user.id && !isAdmin(req)) { res.status(403).json({ error: "Access denied" }); return; }

    const live = await getEnvelopeStatus(envelopeId);

    if (live.status === "completed" && record.status !== "completed") {
      await db.update(docusignEnvelopesTable).set({ status: "completed", updatedAt: new Date() })
        .where(eq(docusignEnvelopesTable.envelopeId, envelopeId));

      if (record.type === "seller_agreement" && record.businessId) {
        await db.update(businessesTable)
          .set({ sellerAgreementAcceptedAt: new Date(), updatedAt: new Date() })
          .where(eq(businessesTable.id, record.businessId));
      }
    }

    res.json({ envelopeId, status: live.status, type: record.type, businessId: record.businessId });
  } catch (err) {
    req.log.error({ err }, "Failed to get envelope status");
    res.status(500).json({ error: "Failed to get envelope status" });
  }
});

// ── GET /api/docusign/signed ───────────────────────────────────────────────
// DocuSign redirects here after signing. Only updates the DB when event=signing_complete.
router.get("/docusign/signed", async (req: Request, res: Response) => {
  const { type, businessId, event } = req.query as { type?: string; businessId?: string; event?: string };

  const signed = event === "signing_complete";

  const messages: Record<string, { title: string; body: string; badge: string }> = {
    seller_agreement: {
      title: signed ? "Seller Agreement Signed!" : "Signing Session Ended",
      body: signed
        ? "You're all set. Return to the Mapping With Melanin app to complete your seller setup."
        : "You did not complete signing. Return to the app and try again when ready.",
      badge: signed ? "✅" : "↩️",
    },
    founding_agreement: {
      title: signed ? "Founding Business Agreement Signed!" : "Signing Session Ended",
      body: signed
        ? "Welcome to the Founding Business Program. Return to the app to see your Founding Business badge."
        : "You did not complete signing. Return to the app and try again when ready.",
      badge: signed ? "⭐" : "↩️",
    },
    verification: {
      title: signed ? "Verification Certified!" : "Signing Session Ended",
      body: signed
        ? "Your certification has been received. Our team will review your verification request shortly."
        : "You did not complete signing. Return to the app and try again when ready.",
      badge: signed ? "✅" : "↩️",
    },
  };

  const msg = messages[type ?? ""] ?? {
    title: signed ? "Document Signed" : "Signing Session Ended",
    body: "Return to the Mapping With Melanin app.",
    badge: signed ? "✅" : "↩️",
  };

  // Only update sellerAgreementAcceptedAt when the user actually completed signing
  if (signed && type === "seller_agreement" && businessId) {
    try {
      // Verify there is a tracked envelope for this business before updating
      const [record] = await db.select({ envelopeId: docusignEnvelopesTable.envelopeId })
        .from(docusignEnvelopesTable)
        .where(and(
          eq(docusignEnvelopesTable.businessId, businessId),
          eq(docusignEnvelopesTable.type, "seller_agreement"),
        ))
        .limit(1);
      if (record) {
        await db.update(businessesTable)
          .set({ sellerAgreementAcceptedAt: new Date(), updatedAt: new Date() })
          .where(eq(businessesTable.id, businessId));
        await db.update(docusignEnvelopesTable)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(docusignEnvelopesTable.envelopeId, record.envelopeId));
      }
    } catch { /* best-effort — webhook is the reliable path */ }
  }

  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${msg.title}</title>
<style>body{font-family:Georgia,serif;background:#faf9f7;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#fff;border-radius:16px;padding:48px 40px;max-width:420px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
h2{color:#2D7A4F;margin-bottom:12px}p{color:#555;line-height:1.7}
.badge{font-size:48px;margin-bottom:16px}</style></head>
<body><div class="card"><div class="badge">${msg.badge}</div><h2>${msg.title}</h2><p>${msg.body}</p></div></body></html>`);
});

// ── POST /api/docusign/webhook ─────────────────────────────────────────────
// DocuSign Connect webhook — configure in DocuSign Admin → Connect → Add Configuration.
// Set Trigger Events: Envelope Completed. Format: JSON.
router.post("/docusign/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body as any;
    const envelopeId: string | undefined = body?.envelopeId ?? body?.data?.envelopeId;
    const status: string | undefined = body?.status ?? body?.data?.envelopeSummary?.status;

    if (!envelopeId || status !== "completed") { res.sendStatus(200); return; }

    const [record] = await db.select().from(docusignEnvelopesTable)
      .where(eq(docusignEnvelopesTable.envelopeId, envelopeId)).limit(1);

    if (!record) { res.sendStatus(200); return; }

    await db.update(docusignEnvelopesTable).set({ status: "completed", updatedAt: new Date() })
      .where(eq(docusignEnvelopesTable.envelopeId, envelopeId));

    if (record.type === "seller_agreement" && record.businessId) {
      await db.update(businessesTable)
        .set({ sellerAgreementAcceptedAt: new Date(), updatedAt: new Date() })
        .where(eq(businessesTable.id, record.businessId));
    }

    res.sendStatus(200);
  } catch (err) {
    req.log.error({ err }, "DocuSign webhook error");
    res.sendStatus(200);
  }
});

export default router;
