import { Router, type IRouter, type Response } from "express";
import { db, verificationRequestsTable, businessClaimsTable, businessesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

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
  "NMSDC",
  "WBENC",
  "SBA_8a",
  "SBA_HUBZone",
  "NGLCC",
  "Disability_IN",
  "NABOB",
  "NACC",
  "NBCC",
  "State_MWBE",
  "Other",
];

router.post("/verification/submit", async (req: any, res: Response): Promise<void> => {
  const {
    businessName, businessType, ownerName, websiteUrl,
    instagramHandle, yearsInBusiness, city, state, message, email,
    // Level 2
    ownershipPercentage, einNumber, documentsProvided, businessLicenseProvided,
    // Level 3
    certificationOrg, certificationUrl, certificationNumber,
  } = req.body as {
    businessName?: string; businessType?: string; ownerName?: string;
    websiteUrl?: string; instagramHandle?: string; yearsInBusiness?: number;
    city?: string; state?: string; message?: string; email?: string;
    ownershipPercentage?: number; einNumber?: string;
    documentsProvided?: string[]; businessLicenseProvided?: boolean;
    certificationOrg?: string; certificationUrl?: string; certificationNumber?: string;
  };

  const submitterEmail = email ?? req.user?.email;
  if (!businessName?.trim()) { res.status(400).json({ error: "businessName is required" }); return; }
  if (!ownerName?.trim()) { res.status(400).json({ error: "ownerName is required" }); return; }
  if (!submitterEmail?.trim()) { res.status(400).json({ error: "email is required" }); return; }
  if (!businessType || !VALID_TYPES.includes(businessType)) {
    res.status(400).json({ error: "Invalid businessType" }); return;
  }

  // Validate ownership percentage if provided
  if (ownershipPercentage !== undefined) {
    if (typeof ownershipPercentage !== "number" || ownershipPercentage < 51 || ownershipPercentage > 100) {
      res.status(400).json({ error: "ownershipPercentage must be between 51 and 100" }); return;
    }
  }

  // Validate doc types
  const docList: string[] = Array.isArray(documentsProvided)
    ? documentsProvided.filter((d) => VALID_DOC_TYPES.includes(d))
    : [];

  // Validate cert org
  if (certificationOrg && !VALID_CERT_ORGS.includes(certificationOrg)) {
    res.status(400).json({ error: "Invalid certificationOrg" }); return;
  }

  // Determine verification level
  const hasCert = !!(certificationOrg && certificationUrl?.trim());
  const hasOwnershipDocs = ownershipPercentage !== undefined && ownershipPercentage >= 51;
  const verificationLevel = hasCert ? "certified" : hasOwnershipDocs ? "ownership" : "basic";

  // Look up the business claimed by this user so we can link the request
  let resolvedBusinessId: string | null = null;
  if (req.user?.id) {
    const [claim] = await db
      .select({ businessId: businessClaimsTable.businessId })
      .from(businessClaimsTable)
      .where(eq(businessClaimsTable.userId, req.user.id))
      .limit(1);
    resolvedBusinessId = claim?.businessId ?? null;
  }

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
      businessLicenseProvided: businessLicenseProvided ?? false,
      certificationOrg: certificationOrg || null,
      certificationUrl: certificationUrl?.trim() || null,
      certificationNumber: certificationNumber?.trim() || null,
    }).returning();
    res.status(201).json({ request, verificationLevel });
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

    // Cascade: when approved, mark the linked business as verified
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
