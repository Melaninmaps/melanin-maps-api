import { Router, type Request, type Response } from "express";
import { db, businessNominationsTable, businessesTable } from "@workspace/db";
import { eq, ilike, and, desc, gte, sql } from "drizzle-orm";
import { getUserTier } from "../middleware/requireMembership";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email)) return true;
  return user.role === "admin";
}

const router = Router();

router.post("/business-nominations", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;

  // Tier gate — requires authenticated paid member
  if (!userId) {
    res.status(401).json({ error: "Sign in to nominate a business." });
    return;
  }
  try {
    const tier = await getUserTier(userId);
    if (tier === "free") {
      res.status(403).json({
        error: "Nominating businesses requires an Explorer+ or higher membership.",
        code: "TIER_LIMIT_REACHED",
        upgradeUrl: "/membership",
      });
      return;
    }
    if (tier === "navigator") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(businessNominationsTable)
        .where(and(
          eq(businessNominationsTable.nominatedByUserId, userId),
          gte(businessNominationsTable.createdAt, startOfMonth),
        ));
      if (count >= 3) {
        res.status(403).json({
          error: "Explorer+ members can nominate up to 3 businesses per month. Upgrade to Navigator for unlimited nominations.",
          code: "TIER_LIMIT_REACHED",
          upgradeUrl: "/membership",
        });
        return;
      }
    }
    // Trailblazer: unlimited
  } catch {
    // If tier check fails, allow through — don't block on infra error
  }

  const {
    businessName, category, city, state, phone, website,
    ownerName, ownerContact, notes, nominatorEmail, blackOwned,
  } = req.body as {
    businessName?: string; category?: string; city?: string; state?: string;
    phone?: string; website?: string; ownerName?: string; ownerContact?: string;
    notes?: string; nominatorEmail?: string; blackOwned?: boolean;
  };

  if (!businessName?.trim() || !city?.trim() || !state?.trim()) {
    res.status(400).json({ error: "businessName, city, and state are required" });
    return;
  }

  const isBlackOwned = blackOwned !== false;

  try {
    const [existing] = await db
      .select({ id: businessesTable.id, name: businessesTable.name })
      .from(businessesTable)
      .where(and(
        ilike(businessesTable.name, businessName.trim()),
        ilike(businessesTable.city, city.trim()),
      ))
      .limit(1);

    if (existing) {
      res.json({
        isDuplicate: true,
        type: "already_listed",
        businessId: existing.id,
        message: "This business is already in the Mapping With Melanin directory!",
      });
      return;
    }

    const [existingNom] = await db
      .select({ id: businessNominationsTable.id })
      .from(businessNominationsTable)
      .where(and(
        ilike(businessNominationsTable.businessName, businessName.trim()),
        ilike(businessNominationsTable.city, city.trim()),
      ))
      .limit(1);

    if (existingNom) {
      res.json({
        isDuplicate: true,
        type: "already_nominated",
        message: "Someone already added this business — thanks for confirming the community demand!",
      });
      return;
    }

    const newBusinessId = crypto.randomUUID();
    const resolvedCategory = category?.trim() || "General";

    await db
      .insert(businessesTable)
      .values({
        id: newBusinessId,
        name: businessName.trim(),
        category: resolvedCategory,
        subcategory: resolvedCategory,
        address: `${city.trim()}, ${state.trim()}`,
        city: city.trim(),
        state: state.trim(),
        description: notes?.trim() || "",
        latitude: "0",
        longitude: "0",
        blackOwned: isBlackOwned,
        confidenceScore: 0,
        verified: false,
        featured: false,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        tags: [],
        reviews: [],
        ownershipDesignations: isBlackOwned ? [] : ["non-minority-owned"],
        verifiedDesignations: [],
        photos: [],
        trustBadges: [],
        status: "active",
        businessStatus: "community",
        submittedById: userId ?? null,
      });

    const [nomination] = await db
      .insert(businessNominationsTable)
      .values({
        nominatedByUserId: userId ?? null,
        nominatorEmail: nominatorEmail?.trim() || null,
        businessName: businessName.trim(),
        category: category?.trim() || null,
        city: city.trim(),
        state: state.trim(),
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        ownerName: isBlackOwned ? (ownerName?.trim() || null) : null,
        ownerContact: isBlackOwned ? (ownerContact?.trim() || null) : null,
        notes: notes?.trim() || null,
        blackOwned: isBlackOwned,
        matchedBusinessId: newBusinessId,
        status: "verified",
      })
      .returning();

    res.status(201).json({ nomination, isDuplicate: false, businessId: newBusinessId });
  } catch (err) {
    req.log.error({ err }, "Failed to submit business nomination");
    res.status(500).json({ error: "Failed to submit nomination" });
  }
});

router.get("/business-nominations/mine", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const nominations = await db
      .select()
      .from(businessNominationsTable)
      .where(eq(businessNominationsTable.nominatedByUserId, userId))
      .orderBy(desc(businessNominationsTable.createdAt));
    res.json({ nominations });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch your nominations");
    res.status(500).json({ error: "Failed to fetch nominations" });
  }
});

router.get("/admin/business-nominations", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const nominations = await db
      .select()
      .from(businessNominationsTable)
      .orderBy(desc(businessNominationsTable.createdAt))
      .limit(500);
    res.json({ nominations });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch nominations");
    res.status(500).json({ error: "Failed to fetch nominations" });
  }
});

router.patch("/admin/business-nominations/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const id = String(req.params.id);
  const { status, matchedBusinessId, referralCredited } = req.body as {
    status?: string; matchedBusinessId?: string; referralCredited?: boolean;
  };
  const allowed = ["pending", "verified", "joined", "duplicate", "declined"];
  if (status && !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  try {
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (matchedBusinessId !== undefined) updates.matchedBusinessId = matchedBusinessId;
    if (referralCredited !== undefined) updates.referralCredited = referralCredited;
    const [updated] = await db
      .update(businessNominationsTable)
      .set(updates)
      .where(eq(businessNominationsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Nomination not found" }); return; }
    res.json({ nomination: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update nomination");
    res.status(500).json({ error: "Failed to update nomination" });
  }
});

export default router;
