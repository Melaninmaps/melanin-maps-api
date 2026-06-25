import { Router, type IRouter, type Response } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { db, verificationRequestsTable, businessClaimsTable, businessesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { objectStorageClient } from "../lib/objectStorage";
import { createVerificationEnvelope } from "../lib/docusign";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: any) { return req.user?.email && ADMIN_EMAILS.includes(req.user.email); }

const VALID_TYPES = ["restaurant", "retail", "salon", "health", "professional_services", "entertainment", "tech", "nonprofit", "other"];

const VALID_DOC_TYPES = [
  "articles_of_incorporation",
  "ein_confirmation",
  "business_license",
  "ownership_agreement",
  "government_issued_id",
  "other",
];

const VALID_CERT_ORGS = [
  "NMSDC", "WBENC", "SBA_8a", "SBA_HUBZone", "NGLCC",
  "Disability_IN", "NABOB", "NACC", "NBCC", "State_MWBE", "Other",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
    cb(null, allowed.includes(file.mimetype) || file.mimetype.startsWith("image/"));
  },
});

router.post("/verification/upload-document", upload.single("file"), async (req: any, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

  const { originalname, mimetype, buffer, size } = req.file;
  const docType = typeof req.body.docType === "string" ? req.body.docType : "other";
  const ext = originalname.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = ["pdf", "jpg", "jpeg", "png", "heic", "heif"].includes(ext) ? ext : "bin";
  const objectKey = `verification-docs/${randomUUID()}.${safeExt}`;

  try {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Object storage not configured" }); return; }

    const bucket = objectStorageClient.bucket(bucketId);
    const gcsFile = bucket.file(objectKey);
    await gcsFile.save(buffer, {
      contentType: mimetype,
      metadata: { submitterId: String(req.user.id), docType },
    });

    res.status(201).json({
      key: objectKey,
      name: originalname,
      type: docType,
      size,
      mimeType: mimetype,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to upload verification document");
    res.status(500).json({ error: "Failed to upload document" });
  }
});

router.post("/verification/submit", async (req: any, res: Response): Promise<void> => {
  const {
    businessName, businessType, ownerName, websiteUrl,
    instagramHandle, yearsInBusiness, city, state, message, email,
    ownershipPercentage, einNumber, documentsProvided, businessLicenseProvided,
    certificationOrg, certificationUrl, certificationNumber,
    documentUrls,
  } = req.body as {
    businessName?: string; businessType?: string; ownerName?: string;
    websiteUrl?: string; instagramHandle?: string; yearsInBusiness?: number;
    city?: string; state?: string; message?: string; email?: string;
    ownershipPercentage?: number; einNumber?: string;
    documentsProvided?: string[]; businessLicenseProvided?: boolean;
    certificationOrg?: string; certificationUrl?: string; certificationNumber?: string;
    documentUrls?: Array<{ key: string; name: string; type: string; size: number; mimeType: string }>;
  };

  const submitterEmail = email ?? req.user?.email;
  if (!businessName?.trim()) { res.status(400).json({ error: "businessName is required" }); return; }
  if (!ownerName?.trim()) { res.status(400).json({ error: "ownerName is required" }); return; }
  if (!submitterEmail?.trim()) { res.status(400).json({ error: "email is required" }); return; }
  if (!businessType || !VALID_TYPES.includes(businessType)) {
    res.status(400).json({ error: "Invalid businessType" }); return;
  }

  if (ownershipPercentage !== undefined) {
    if (typeof ownershipPercentage !== "number" || ownershipPercentage < 51 || ownershipPercentage > 100) {
      res.status(400).json({ error: "ownershipPercentage must be between 51 and 100" }); return;
    }
  }

  const docList: string[] = Array.isArray(documentsProvided)
    ? documentsProvided.filter((d) => VALID_DOC_TYPES.includes(d))
    : [];

  if (certificationOrg && !VALID_CERT_ORGS.includes(certificationOrg)) {
    res.status(400).json({ error: "Invalid certificationOrg" }); return;
  }

  const hasCert = !!(certificationOrg && certificationUrl?.trim());
  const hasOwnershipDocs = ownershipPercentage !== undefined && ownershipPercentage >= 51;
  const verificationLevel = hasCert ? "certified" : hasOwnershipDocs ? "ownership" : "basic";

  let resolvedBusinessId: string | null = null;
  if (req.user?.id) {
    const [claim] = await db
      .select({ businessId: businessClaimsTable.businessId })
      .from(businessClaimsTable)
      .where(eq(businessClaimsTable.userId, req.user.id))
      .limit(1);
    resolvedBusinessId = claim?.businessId ?? null;
  }

  const uploadedDocs = Array.isArray(documentUrls) ? documentUrls : [];

  try {
    const [request] = await db.insert(verificationRequestsTable).values({
      submitterId: req.user?.id ?? null,
      businessId: resolvedBusinessId,
      businessName: businessName.trim(),
      businessType: businessType as any,
      ownerName: ownerName.trim(),
      websiteUrl: websiteUrl?.trim() || null,
      instagramHandle: instagramHandle?.trim().replace(/^@/, "") || null,
      yearsInBusiness: yearsInBusiness ?? null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      message: message?.slice(0, 2000) || null,
      submitterEmail: submitterEmail.trim(),
      verificationLevel,
      ownershipPercentage: ownershipPercentage ?? null,
      einNumber: einNumber?.trim().replace(/[^0-9-]/g, "") || null,
      documentsProvided: docList.length ? JSON.stringify(docList) : null,
      documentUrls: uploadedDocs.length ? JSON.stringify(uploadedDocs) : null,
      businessLicenseProvided: businessLicenseProvided ?? false,
      certificationOrg: certificationOrg || null,
      certificationUrl: certificationUrl?.trim() || null,
      certificationNumber: certificationNumber?.trim() || null,
    }).returning();
    res.status(201).json({ request, verificationLevel });

    // Async: send verification certification via DocuSign — non-fatal if it fails
    if (req.user?.id && submitterEmail) {
      void (async () => {
        try {
          const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "";
          await createVerificationEnvelope({
            businessName: businessName.trim(),
            ownerName: ownerName.trim(),
            signerEmail: submitterEmail.trim(),
            clientUserId: req.user!.id,
            returnUrl: `https://${domain}/api/docusign/signed?type=verification`,
          });
        } catch (dsErr) {
          req.log?.error?.({ dsErr }, "DocuSign verification cert async trigger failed — non-fatal");
        }
      })();
    }
  } catch (err: any) {
    req.log.error({ err }, "Failed to submit verification request");
    res.status(500).json({ error: "Failed to submit verification request" });
  }
});

router.get("/admin/verification-requests", async (req: any, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const requests = await db.select().from(verificationRequestsTable).orderBy(desc(verificationRequestsTable.createdAt)).limit(200);
    res.json({ requests });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch verification requests");
    res.status(500).json({ error: "Failed to fetch verification requests" });
  }
});

router.get("/admin/verification-requests/:id/document-url", async (req: any, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { key } = req.query as { key?: string };
  if (!key?.startsWith("verification-docs/")) { res.status(400).json({ error: "Invalid key" }); return; }

  try {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Storage not configured" }); return; }
    const bucket = objectStorageClient.bucket(bucketId);
    const [signedUrl] = await bucket.file(key).getSignedUrl({
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });
    res.json({ url: signedUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to generate signed URL");
    res.status(500).json({ error: "Failed to generate document URL" });
  }
});

router.patch("/admin/verification-requests/:id", async (req: any, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };
  const allowed = ["pending", "under_review", "approved", "rejected"];
  if (status && !allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  try {
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    const [updated] = await db.update(verificationRequestsTable).set(updates).where(eq(verificationRequestsTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Request not found" }); return; }

    if (status === "approved" && updated.businessId) {
      await db.update(businessesTable)
        .set({ verified: true })
        .where(eq(businessesTable.id, updated.businessId));
    }

    res.json({ request: updated });
  } catch (err: any) {
    req.log.error({ err }, "Failed to update verification request");
    res.status(500).json({ error: "Failed to update request" });
  }
});

export default router;
