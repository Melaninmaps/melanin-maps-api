import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { purchaseDisputesTable, businessesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

const VALID_DISPUTE_TYPES = ["not_received", "not_as_described", "fraud", "defective", "other"] as const;
type DisputeType = typeof VALID_DISPUTE_TYPES[number];
const VALID_STATUSES = ["open", "investigating", "resolved", "rejected"] as const;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: Request) {
  return !!req.user?.email && ADMIN_EMAILS.includes(req.user.email);
}

router.post("/disputes", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

    const { businessId, listingId, stripeSessionId, disputeType, description } = req.body as {
      businessId?: string;
      listingId?: string;
      stripeSessionId?: string;
      disputeType?: string;
      description?: string;
    };

    if (!businessId?.trim()) { res.status(400).json({ error: "businessId is required" }); return; }
    if (!disputeType || !VALID_DISPUTE_TYPES.includes(disputeType as DisputeType)) {
      res.status(400).json({ error: `disputeType must be one of: ${VALID_DISPUTE_TYPES.join(", ")}` }); return;
    }
    if (!description?.trim() || description.trim().length < 10) {
      res.status(400).json({ error: "description must be at least 10 characters" }); return;
    }

    const [business] = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.id, businessId));
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }

    const [dispute] = await db.insert(purchaseDisputesTable).values({
      userId: req.user.id,
      businessId,
      listingId: listingId ?? null,
      stripeSessionId: stripeSessionId ?? null,
      disputeType: disputeType as DisputeType,
      description: description.trim(),
      status: "open",
    }).returning();

    res.status(201).json({ dispute });
  } catch (err) {
    req.log.error({ err }, "Failed to create dispute");
    res.status(500).json({ error: "Failed to submit dispute" });
  }
});

router.get("/disputes", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

    const disputes = await db
      .select({
        id: purchaseDisputesTable.id,
        businessId: purchaseDisputesTable.businessId,
        businessName: businessesTable.name,
        listingId: purchaseDisputesTable.listingId,
        disputeType: purchaseDisputesTable.disputeType,
        description: purchaseDisputesTable.description,
        status: purchaseDisputesTable.status,
        adminNotes: purchaseDisputesTable.adminNotes,
        createdAt: purchaseDisputesTable.createdAt,
      })
      .from(purchaseDisputesTable)
      .leftJoin(businessesTable, eq(purchaseDisputesTable.businessId, businessesTable.id))
      .where(eq(purchaseDisputesTable.userId, req.user.id))
      .orderBy(desc(purchaseDisputesTable.createdAt));

    res.json({ disputes });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch disputes");
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

router.get("/admin/disputes", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }

    const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;

    const all = await db
      .select({
        id: purchaseDisputesTable.id,
        userId: purchaseDisputesTable.userId,
        businessId: purchaseDisputesTable.businessId,
        businessName: businessesTable.name,
        listingId: purchaseDisputesTable.listingId,
        stripeSessionId: purchaseDisputesTable.stripeSessionId,
        disputeType: purchaseDisputesTable.disputeType,
        description: purchaseDisputesTable.description,
        status: purchaseDisputesTable.status,
        adminNotes: purchaseDisputesTable.adminNotes,
        createdAt: purchaseDisputesTable.createdAt,
        updatedAt: purchaseDisputesTable.updatedAt,
      })
      .from(purchaseDisputesTable)
      .leftJoin(businessesTable, eq(purchaseDisputesTable.businessId, businessesTable.id))
      .orderBy(desc(purchaseDisputesTable.createdAt));

    const filtered = statusFilter ? all.filter((d) => d.status === statusFilter) : all;

    res.json({ disputes: filtered });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin disputes");
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

router.patch("/admin/disputes/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }

    const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };

    if (status && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }); return;
    }

    const id = String(req.params.id);
    const [existing] = await db.select().from(purchaseDisputesTable).where(eq(purchaseDisputesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Dispute not found" }); return; }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    const [dispute] = await db
      .update(purchaseDisputesTable)
      .set(updates as Parameters<typeof db.update>[0] extends never ? never : any)
      .where(eq(purchaseDisputesTable.id, id))
      .returning();

    res.json({ dispute });
  } catch (err) {
    req.log.error({ err }, "Failed to update dispute");
    res.status(500).json({ error: "Failed to update dispute" });
  }
});

export default router;
