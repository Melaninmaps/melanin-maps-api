/* SURGICAL PATCH 03 — events route compatibility and claim payload compatibility */

// A. routes/index.ts: add a compatibility mount so existing clients using
// /api/community/events stop receiving 404. Keep /api/events as canonical.
//
// router.use("/api", eventsRouter);
// router.use("/api/community", eventsRouter);
//
// If the project mounts routers without the /api prefix, use the equivalent:
// app.use("/api/events", eventsRouter);
// app.use("/api/community/events", eventsRouter);
//
// Do not duplicate business logic. Both paths must invoke the same router.

// B. web/business-detail.tsx: replace the claim body at the submit handler
// around lines 564–618 with the backend field names from routes/claims.ts.
const claimBody = {
  ownerName: ownerName.trim(),
  businessEmail: businessEmail.trim().toLowerCase(),
  verificationMethod,
  officialUrl: website.trim() || undefined,
  socialHandle: instagramHandle.trim() || undefined,
  attestation,
  notes: additionalInfo.trim() || undefined,
};

const claimResponse = await fetch(`/api/businesses/${businessId}/claims`, {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(claimBody),
});

const claimPayload = await claimResponse.json().catch(() => ({}));
if (!claimResponse.ok) {
  throw new Error(String(claimPayload.error ?? `Claim failed (HTTP ${claimResponse.status})`));
}
setClaimSubmitted(true);

// C. If backwards compatibility is required, normalize aliases in routes/claims.ts
// immediately after reading req.body instead of accepting two separate contracts.
const body = req.body as Record<string, unknown>;
const ownerName = String(body.ownerName ?? "").trim();
const businessEmail = String(body.businessEmail ?? "").trim().toLowerCase();
const verificationMethod = String(body.verificationMethod ?? "").trim();
const officialUrl = String(body.officialUrl ?? body.website ?? "").trim() || null;
const socialHandle = String(body.socialHandle ?? body.instagramHandle ?? "").trim() || null;
const notes = String(body.notes ?? body.additionalInfo ?? "").trim() || null;

// Never trust client role/phone fields as ownership proof. Ownership is pending
// until the server-side verification workflow accepts the claim.
