import { Router, type IRouter, type Request, type Response } from "express";
import { db, contentFilterViolationsTable, familyCirclesTable, familyCircleMembersTable, notificationsTable } from "@workspace/db";
import type { FamilyMemberPermissions } from "@workspace/db";
import { and, desc, eq, or } from "drizzle-orm";
import { sendPushToUser } from "../lib/pushNotifications";

const router: IRouter = Router();

function makeInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase();
}

function requireAuth(req: Request, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

// ── GET /family/circle ─────────────────────────────────────────────────────
// Returns the caller's family circle — whether they are the owner or a member.
router.get("/family/circle", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;

    // Check if they own a circle
    const [ownedCircle] = await db
      .select()
      .from(familyCirclesTable)
      .where(eq(familyCirclesTable.ownerId, userId))
      .limit(1);

    if (ownedCircle) {
      const members = await db
        .select()
        .from(familyCircleMembersTable)
        .where(eq(familyCircleMembersTable.circleId, ownedCircle.id));
      res.json({ circle: ownedCircle, members, role: "owner" });
      return;
    }

    // Check if they are a member of someone else's circle
    const [membership] = await db
      .select()
      .from(familyCircleMembersTable)
      .where(
        and(
          eq(familyCircleMembersTable.userId, userId),
          eq(familyCircleMembersTable.status, "accepted"),
        ),
      )
      .limit(1);

    if (!membership) {
      res.json({ circle: null, members: [], role: null });
      return;
    }

    const [circle] = await db
      .select()
      .from(familyCirclesTable)
      .where(eq(familyCirclesTable.id, membership.circleId))
      .limit(1);

    const members = await db
      .select()
      .from(familyCircleMembersTable)
      .where(eq(familyCircleMembersTable.circleId, membership.circleId));

    res.json({ circle, members, role: "member", myMembership: membership });
  } catch (err) {
    req.log.error({ err }, "GET /family/circle error");
    res.status(500).json({ error: "Failed to load family circle" });
  }
});

// ── POST /family/circle ────────────────────────────────────────────────────
// Create a new family circle (max one per user).
router.post("/family/circle", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const { name } = req.body as { name?: string };

    const [existing] = await db
      .select({ id: familyCirclesTable.id })
      .from(familyCirclesTable)
      .where(eq(familyCirclesTable.ownerId, userId))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "You already have a family circle" });
      return;
    }

    const [circle] = await db
      .insert(familyCirclesTable)
      .values({
        name: (name ?? "My Family").trim().slice(0, 100) || "My Family",
        ownerId: userId,
        inviteCode: makeInviteCode(),
      })
      .returning();

    res.status(201).json({ circle });
  } catch (err) {
    req.log.error({ err }, "POST /family/circle error");
    res.status(500).json({ error: "Failed to create family circle" });
  }
});

// ── PATCH /family/circle ───────────────────────────────────────────────────
// Rename the circle (owner only).
router.patch("/family/circle", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }

    const [circle] = await db
      .update(familyCirclesTable)
      .set({ name: name.trim().slice(0, 100), updatedAt: new Date() })
      .where(eq(familyCirclesTable.ownerId, req.user!.id))
      .returning();

    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    res.json({ circle });
  } catch (err) {
    req.log.error({ err }, "PATCH /family/circle error");
    res.status(500).json({ error: "Failed to update family circle" });
  }
});

// ── POST /family/circle/invite ─────────────────────────────────────────────
// Owner invites someone by email or display name. Returns the invite link.
router.post("/family/circle/invite", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const { email, displayName } = req.body as { email?: string; displayName?: string };

    const [circle] = await db
      .select()
      .from(familyCirclesTable)
      .where(eq(familyCirclesTable.ownerId, req.user!.id))
      .limit(1);

    if (!circle) { res.status(404).json({ error: "Create a family circle first" }); return; }

    const [member] = await db
      .insert(familyCircleMembersTable)
      .values({
        circleId: circle.id,
        inviteEmail: email?.toLowerCase().trim() || null,
        displayName: displayName?.trim().slice(0, 100) || null,
        role: "member",
        status: "pending",
      })
      .returning();

    const inviteLink = `https://mappingwithmelanin.com/family/join/${circle.inviteCode}`;
    res.status(201).json({ member, inviteCode: circle.inviteCode, inviteLink });
  } catch (err) {
    req.log.error({ err }, "POST /family/circle/invite error");
    res.status(500).json({ error: "Failed to create invite" });
  }
});

// ── GET /family/join/:inviteCode ───────────────────────────────────────────
// Preview an invite (no auth required).
router.get("/family/join/:inviteCode", async (req: Request, res: Response): Promise<void> => {
  try {
    const [circle] = await db
      .select({ id: familyCirclesTable.id, name: familyCirclesTable.name })
      .from(familyCirclesTable)
      .where(eq(familyCirclesTable.inviteCode, String(req.params.inviteCode).toUpperCase()))
      .limit(1);

    if (!circle) { res.status(404).json({ error: "Invite not found" }); return; }
    res.json({ circle });
  } catch (err) {
    req.log.error({ err }, "GET /family/join error");
    res.status(500).json({ error: "Failed to look up invite" });
  }
});

// ── POST /family/join/:inviteCode ──────────────────────────────────────────
// Authenticated user accepts the invite and joins the circle.
router.post("/family/join/:inviteCode", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const code = String(req.params.inviteCode).toUpperCase();

    const [circle] = await db
      .select()
      .from(familyCirclesTable)
      .where(eq(familyCirclesTable.inviteCode, code))
      .limit(1);

    if (!circle) { res.status(404).json({ error: "Invite not found" }); return; }
    if (circle.ownerId === userId) { res.status(400).json({ error: "You own this circle" }); return; }

    // Check if already a member
    const [existing] = await db
      .select({ id: familyCircleMembersTable.id, status: familyCircleMembersTable.status })
      .from(familyCircleMembersTable)
      .where(and(eq(familyCircleMembersTable.circleId, circle.id), eq(familyCircleMembersTable.userId, userId)))
      .limit(1);

    if (existing?.status === "accepted") {
      res.json({ ok: true, alreadyMember: true });
      return;
    }

    if (existing) {
      await db
        .update(familyCircleMembersTable)
        .set({ status: "accepted", joinedAt: new Date() })
        .where(eq(familyCircleMembersTable.id, existing.id));
    } else {
      await db.insert(familyCircleMembersTable).values({
        circleId: circle.id,
        userId,
        status: "accepted",
        joinedAt: new Date(),
      });
    }

    // Notify the owner
    sendPushToUser(circle.ownerId, {
      title: "👨‍👩‍👧 A family member joined!",
      body: "Someone just accepted your Family Circle invite.",
      data: { screen: "family-circle", type: "member_joined" },
    }).catch(() => {});
    db.insert(notificationsTable).values({
      userId: circle.ownerId,
      type: "community",
      title: "👨‍👩‍👧 A family member joined!",
      body: "Someone just accepted your Family Circle invite.",
    }).catch(() => {});

    res.json({ ok: true, circleId: circle.id });
  } catch (err) {
    req.log.error({ err }, "POST /family/join error");
    res.status(500).json({ error: "Failed to join family circle" });
  }
});

// ── DELETE /family/circle/members/:memberId ────────────────────────────────
// Owner removes a member.
router.delete("/family/circle/members/:memberId", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const [circle] = await db
      .select({ id: familyCirclesTable.id })
      .from(familyCirclesTable)
      .where(eq(familyCirclesTable.ownerId, req.user!.id))
      .limit(1);

    if (!circle) { res.status(403).json({ error: "Forbidden" }); return; }

    await db
      .update(familyCircleMembersTable)
      .set({ status: "removed" })
      .where(
        and(
          eq(familyCircleMembersTable.id, String(req.params.memberId)),
          eq(familyCircleMembersTable.circleId, circle.id),
        ),
      );

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /family/circle/members error");
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// ── PATCH /family/circle/members/:memberId/permissions ────────────────────
// Owner updates a member's optional safety/sharing permissions.
router.patch("/family/circle/members/:memberId/permissions", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const [circle] = await db
      .select({ id: familyCirclesTable.id })
      .from(familyCirclesTable)
      .where(eq(familyCirclesTable.ownerId, req.user!.id))
      .limit(1);

    if (!circle) { res.status(403).json({ error: "Forbidden" }); return; }

    const [current] = await db
      .select({ permissions: familyCircleMembersTable.permissions })
      .from(familyCircleMembersTable)
      .where(
        and(
          eq(familyCircleMembersTable.id, String(req.params.memberId)),
          eq(familyCircleMembersTable.circleId, circle.id),
        ),
      )
      .limit(1);

    if (!current) { res.status(404).json({ error: "Member not found" }); return; }

    const merged: FamilyMemberPermissions = { ...current.permissions, ...(req.body as Partial<FamilyMemberPermissions>) };

    const [updated] = await db
      .update(familyCircleMembersTable)
      .set({ permissions: merged })
      .where(eq(familyCircleMembersTable.id, String(req.params.memberId)))
      .returning();

    res.json({ member: updated });
  } catch (err) {
    req.log.error({ err }, "PATCH /family/circle/members permissions error");
    res.status(500).json({ error: "Failed to update permissions" });
  }
});

// ── POST /family/circle/leave ──────────────────────────────────────────────
// A member leaves the circle voluntarily.
router.post("/family/circle/leave", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    await db
      .update(familyCircleMembersTable)
      .set({ status: "removed" })
      .where(
        and(
          eq(familyCircleMembersTable.userId, req.user!.id),
          eq(familyCircleMembersTable.status, "accepted"),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "POST /family/circle/leave error");
    res.status(500).json({ error: "Failed to leave circle" });
  }
});

// ── GET /family/violations ─────────────────────────────────────────────────
router.get("/family/violations", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const violations = await db
      .select()
      .from(contentFilterViolationsTable)
      .where(eq(contentFilterViolationsTable.userId, req.user!.id))
      .orderBy(desc(contentFilterViolationsTable.createdAt))
      .limit(100);
    res.json({ violations });
  } catch (err) {
    req.log.error({ err }, "GET /family/violations error");
    res.status(500).json({ error: "Failed to load violations" });
  }
});

export default router;
