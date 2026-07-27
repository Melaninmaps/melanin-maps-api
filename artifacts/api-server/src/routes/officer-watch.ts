import { Router, type IRouter, type Request, type Response } from "express";
import { db, flaggedOfficersTable, officerTransfersTable } from "@workspace/db";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { sendPushToUsersInArea } from "../lib/pushNotifications";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return false; }
  return true;
}

function requireAdmin(req: Request, res: Response): boolean {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return false; }
  if (req.user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return false; }
  return true;
}

// ── GET /safety/officer-watch ────────────────────────────────────────────
// Public list of verified flagged officers with their transfer history.
router.get("/safety/officer-watch", async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, state } = req.query as { city?: string; state?: string };

    let query = db.select().from(flaggedOfficersTable).where(eq(flaggedOfficersTable.status, "verified"));

    const officers = await db
      .select()
      .from(flaggedOfficersTable)
      .where(
        and(
          eq(flaggedOfficersTable.status, "verified"),
          city ? or(ilike(flaggedOfficersTable.city, `%${city}%`), ilike(flaggedOfficersTable.state, `%${state ?? ""}`)) : undefined,
        ),
      )
      .orderBy(desc(flaggedOfficersTable.updatedAt))
      .limit(50);

    const officerIds = officers.map((o) => o.id);
    const transfers = officerIds.length > 0
      ? await db
          .select()
          .from(officerTransfersTable)
          .where(inArray(officerTransfersTable.officerId, officerIds))
          .orderBy(desc(officerTransfersTable.createdAt))
      : [];

    const transfersByOfficer = transfers.reduce<Record<number, typeof transfers>>((acc, t) => {
      acc[t.officerId] = acc[t.officerId] ?? [];
      acc[t.officerId].push(t);
      return acc;
    }, {});

    res.json({
      officers: officers.map((o) => ({
        ...o,
        transfers: transfersByOfficer[o.id] ?? [],
      })),
    });
  } catch (err) {
    req.log.error({ err }, "GET /safety/officer-watch error");
    res.status(500).json({ error: "Failed to load officer watch" });
  }
});

// ── POST /safety/officer-watch ─────────────────────────────────────────
// Community members submit a tip. Starts as "pending" until admin verifies.
router.post("/safety/officer-watch", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const { officerName, badgeNumber, department, city, state, offenseType, offenseDescription, offenseDate, sourceUrl } =
      req.body as {
        officerName: string;
        badgeNumber?: string;
        department?: string;
        city?: string;
        state?: string;
        offenseType?: string;
        offenseDescription: string;
        offenseDate?: string;
        sourceUrl?: string;
      };

    if (!officerName?.trim() || !offenseDescription?.trim()) {
      res.status(400).json({ error: "officerName and offenseDescription are required" });
      return;
    }

    const [officer] = await db
      .insert(flaggedOfficersTable)
      .values({
        officerName: officerName.trim(),
        badgeNumber: badgeNumber?.trim() || null,
        department: department?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        offenseType: offenseType?.trim() || null,
        offenseDescription: offenseDescription.trim(),
        offenseDate: offenseDate?.trim() || null,
        sourceUrl: sourceUrl?.trim() || null,
        submittedBy: req.user!.id,
        status: "pending",
      })
      .returning();

    res.status(201).json({ officer, message: "Tip submitted. Our team will review and verify before publishing." });
  } catch (err) {
    req.log.error({ err }, "POST /safety/officer-watch error");
    res.status(500).json({ error: "Failed to submit tip" });
  }
});

// ── PATCH /safety/officer-watch/:id/verify ────────────────────────────
// Admin: verify or reject a pending officer record.
router.patch("/safety/officer-watch/:id/verify", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  try {
    const { status } = req.body as { status: "verified" | "rejected" };
    if (status !== "verified" && status !== "rejected") {
      res.status(400).json({ error: "status must be verified or rejected" });
      return;
    }

    const [officer] = await db
      .update(flaggedOfficersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(flaggedOfficersTable.id, Number(req.params.id)))
      .returning();

    if (!officer) { res.status(404).json({ error: "Officer not found" }); return; }
    res.json({ officer });
  } catch (err) {
    req.log.error({ err }, "PATCH /safety/officer-watch verify error");
    res.status(500).json({ error: "Failed to update officer" });
  }
});

// ── POST /safety/officer-watch/:id/transfer ───────────────────────────
// Admin or community: log a transfer for a flagged officer.
// If the officer is verified, this triggers push notifications to users in the destination area.
router.post("/safety/officer-watch/:id/transfer", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const officerId = Number(req.params.id);
    const { fromDepartment, fromCity, fromState, toDepartment, toCity, toState, transferDate, sourceUrl, notes } =
      req.body as {
        fromDepartment?: string;
        fromCity?: string;
        fromState?: string;
        toDepartment: string;
        toCity: string;
        toState: string;
        transferDate?: string;
        sourceUrl?: string;
        notes?: string;
      };

    if (!toDepartment?.trim() || !toCity?.trim() || !toState?.trim()) {
      res.status(400).json({ error: "toDepartment, toCity, and toState are required" });
      return;
    }

    const [officer] = await db
      .select()
      .from(flaggedOfficersTable)
      .where(eq(flaggedOfficersTable.id, officerId))
      .limit(1);

    if (!officer) { res.status(404).json({ error: "Officer not found" }); return; }

    const isAdminAction = req.user?.role === "admin";
    const transferStatus = isAdminAction ? "verified" : "pending";

    const [transfer] = await db
      .insert(officerTransfersTable)
      .values({
        officerId,
        fromDepartment: fromDepartment?.trim() || null,
        fromCity: fromCity?.trim() || null,
        fromState: fromState?.trim() || null,
        toDepartment: toDepartment.trim(),
        toCity: toCity.trim(),
        toState: toState.trim(),
        transferDate: transferDate?.trim() || null,
        sourceUrl: sourceUrl?.trim() || null,
        notes: notes?.trim() || null,
        submittedBy: req.user!.id,
        status: transferStatus,
      })
      .returning();

    let notifiedCount = 0;

    // Send notifications if the officer is verified AND this is an admin-verified transfer
    if (officer.status === "verified" && isAdminAction) {
      const notifyTitle = "⚠️ Officer Watch Alert";
      const notifyBody = `${officer.officerName} — previously flagged for misconduct — has been transferred to ${toDepartment.trim()} in ${toCity.trim()}, ${toState.trim()}.`;
      notifiedCount = await sendPushToUsersInArea(toCity.trim(), toState.trim(), {
        title: notifyTitle,
        body: notifyBody,
        data: { screen: "officer-watch", officerId, transferId: transfer.id, type: "officer_transfer" },
      });

      await db
        .update(officerTransfersTable)
        .set({ notifiedAt: new Date() })
        .where(eq(officerTransfersTable.id, transfer.id));
    }

    res.status(201).json({ transfer, notifiedCount });
  } catch (err) {
    req.log.error({ err }, "POST /safety/officer-watch transfer error");
    res.status(500).json({ error: "Failed to log transfer" });
  }
});

// ── GET /safety/officer-watch/pending ─────────────────────────────────
// Admin: list pending officer/transfer submissions for review.
router.get("/safety/officer-watch/pending", async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return;
  try {
    const pending = await db
      .select()
      .from(flaggedOfficersTable)
      .where(eq(flaggedOfficersTable.status, "pending"))
      .orderBy(desc(flaggedOfficersTable.createdAt))
      .limit(100);

    const pendingTransfers = await db
      .select()
      .from(officerTransfersTable)
      .where(eq(officerTransfersTable.status, "pending"))
      .orderBy(desc(officerTransfersTable.createdAt))
      .limit(100);

    res.json({ officers: pending, transfers: pendingTransfers });
  } catch (err) {
    req.log.error({ err }, "GET /safety/officer-watch/pending error");
    res.status(500).json({ error: "Failed to load pending submissions" });
  }
});

export default router;
