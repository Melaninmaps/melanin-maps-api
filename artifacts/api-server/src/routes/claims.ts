import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, businessClaimsTable, businessesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendClaimReceived, sendClaimApproved } from "../lib/email.js";

const router: IRouter = Router();

// ── GET /businesses/claim-candidates?name=&city=&state= ───────────────────────
// Step 3 of the disambiguation tree: show every listing with this name in this city
// so the claimant can pick the right one by address.
router.get("/businesses/claim-candidates", async (req: Request, res: Response) => {
  if (!(req as any).user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { name, city, state } = req.query as Record<string, string>;
  if (!name || !city || !state) {
    res.status(400).json({ error: "name, city, and state are required" }); return;
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, name, address, city, state, listing_status, category, description, phone, website
       FROM businesses
       WHERE LOWER(name) = LOWER($1) AND LOWER(city) = LOWER($2) AND LOWER(state) = LOWER($3)
       ORDER BY address ASC`,
      [name.trim(), city.trim(), state.trim()]
    );
    res.json({
      candidates: rows,
      count: rows.length,
      message: rows.length > 1
        ? `Found ${rows.length} listings named "${name}" in ${city}. Please confirm which one is yours by matching the address.`
        : rows.length === 1
          ? `Found 1 listing. Please confirm this is your business before claiming.`
          : `No listings found for "${name}" in ${city}, ${state}. If this is a new business, please submit it first.`,
    });
  } catch (err) {
    req.log.error({ err }, "claim-candidates failed");
    res.status(500).json({ error: "Failed to find claim candidates" });
  }
});

router.post("/businesses/:id/claim", async (req: Request, res: Response) => {
  const businessId = String(req.params.id);
  const { businessName, ownerName, email, phone, role, website, instagramHandle, additionalInfo } = req.body as Record<string, unknown>;
  if (!ownerName || !email || typeof ownerName !== "string" || typeof email !== "string") {
    res.status(400).json({ error: "ownerName and email are required" }); return;
  }

  // Prevent claiming an already-claimed business
  const [existing] = await db
    .select({ id: businessesTable.id, submittedById: businessesTable.submittedById, blackOwned: businessesTable.blackOwned })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);
  if (existing?.submittedById) {
    res.status(409).json({ error: "This business has already been claimed by a verified owner." }); return;
  }

  try {
    const [claim] = await db.insert(businessClaimsTable).values({
      businessId,
      businessName: typeof businessName === "string" ? businessName : null,
      userId: req.user?.id ?? null,
      ownerName,
      email,
      phone: typeof phone === "string" ? phone : null,
      role: typeof role === "string" ? role : "owner",
      website: typeof website === "string" ? website : null,
      instagramHandle: typeof instagramHandle === "string" ? instagramHandle : null,
      additionalInfo: typeof additionalInfo === "string" ? additionalInfo : null,
      status: "pending",
    }).returning();

    // Fire-and-forget: confirmation to claimant + alert to admin
    // Only send confirmation emails for minority-owned businesses
    const bName = (typeof businessName === "string" ? businessName : existing?.id) ?? "your business";
    if (existing?.blackOwned) {
      sendClaimReceived(email, ownerName, bName).catch(() => {});
    }
    sendClaimReceived("hello@mappingwithmelanin.com", `Admin — new claim from ${ownerName}`, `${bName} (${email})`).catch(() => {});

    res.status(201).json({ claim });
  } catch (err) {
    req.log.error({ err }, "Failed to submit business claim");
    res.status(500).json({ error: "Failed to submit claim" });
  }
});

router.get("/admin/claims", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const claims = await db
      .select()
      .from(businessClaimsTable)
      .orderBy(desc(businessClaimsTable.createdAt));
    res.json({ claims });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch claims");
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

router.patch("/admin/claims/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };
  const validStatuses = ["pending", "approved", "rejected", "needs_info"];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  try {
    const [claim] = await db
      .update(businessClaimsTable)
      .set({
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
        updatedAt: new Date(),
      })
      .where(eq(businessClaimsTable.id, id))
      .returning();
    if (!claim) { res.status(404).json({ error: "Claim not found" }); return; }

    // When approved: link the business to this user + notify owner
    if (status === "approved" && claim.businessId) {
      const [claimedBiz] = await db
        .select({ blackOwned: businessesTable.blackOwned })
        .from(businessesTable)
        .where(eq(businessesTable.id, claim.businessId))
        .limit(1);
      db.update(businessesTable)
        .set({
          verified: true,
          status: "active",
          profileStatus: "owner_confirmed",
          ...(claim.userId ? { submittedById: claim.userId } : {}),
        })
        .where(eq(businessesTable.id, claim.businessId))
        .catch(() => {});
      const bName = claim.businessName ?? "your business";
      if (claimedBiz?.blackOwned) {
        sendClaimApproved(claim.email, claim.ownerName, bName).catch(() => {});
      }
    }

    res.json({ claim });
  } catch (err) {
    req.log.error({ err }, "Failed to update claim");
    res.status(500).json({ error: "Failed to update claim" });
  }
});

export default router;
