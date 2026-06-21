import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { groups, groupMembers } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

router.get("/groups", async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(groups)
      .orderBy(desc(groups.memberCount), desc(groups.createdAt));

    let memberGroupIds = new Set<number>();
    if (req.isAuthenticated()) {
      const memberships = await db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(eq(groupMembers.userId, req.user.id));
      memberGroupIds = new Set(memberships.map((m) => m.groupId));
    }

    const result = rows.map((g) => ({
      ...g,
      isMember: memberGroupIds.has(g.id),
    }));

    res.json({ groups: result });
  } catch (err) {
    req.log.error({ err }, "GET /api/groups error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/groups/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [group] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    const members = await db
      .select({ userId: groupMembers.userId, role: groupMembers.role, joinedAt: groupMembers.joinedAt })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, id))
      .limit(20);

    const isMember = req.isAuthenticated()
      ? members.some((m) => m.userId === req.user.id)
      : false;

    res.json({ group: { ...group, isMember }, members });
  } catch (err) {
    req.log.error({ err }, "GET /api/groups/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { name, description, category, city, state, isPrivate } = req.body as {
      name?: string;
      description?: string;
      category?: string;
      city?: string;
      state?: string;
      isPrivate?: boolean;
    };

    if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }

    const userId = req.user!.id;

    const [group] = await db
      .insert(groups)
      .values({
        name: name.trim(),
        description: description?.trim() ?? null,
        category: category ?? "general",
        city: city?.trim() ?? null,
        state: state?.trim() ?? null,
        isPrivate: isPrivate ?? false,
        createdBy: userId,
        memberCount: 1,
      })
      .returning();

    await db.insert(groupMembers).values({
      groupId: group.id,
      userId,
      role: "admin",
    });

    res.status(201).json({ group });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups/:id/join", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user!.id;

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    const [existing] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (existing) { res.status(409).json({ error: "Already a member" }); return; }

    await db.insert(groupMembers).values({ groupId, userId, role: "member" });
    await db
      .update(groups)
      .set({ memberCount: sql`${groups.memberCount} + 1`, updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    res.json({ joined: true, groupId });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups/:id/join error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/groups/:id/leave", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user!.id;

    const deleted = await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .returning();

    if (deleted.length === 0) { res.status(404).json({ error: "Not a member" }); return; }

    await db
      .update(groups)
      .set({ memberCount: sql`greatest(${groups.memberCount} - 1, 0)`, updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    res.json({ left: true, groupId });
  } catch (err) {
    req.log.error({ err }, "DELETE /api/groups/:id/leave error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
