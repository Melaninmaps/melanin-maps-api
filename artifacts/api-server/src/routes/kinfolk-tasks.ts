import { Router, type IRouter, type Request, type Response } from "express";
import { db, kinfolkTaskListsTable, kinfolkTasksTable } from "@workspace/db";
import { eq, and, desc, isNull } from "drizzle-orm";

const router: IRouter = Router();

// ── Lists ──────────────────────────────────────────────────────────────────────

router.get("/kinfolk/lists", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const lists = await db
      .select()
      .from(kinfolkTaskListsTable)
      .where(eq(kinfolkTaskListsTable.userId, req.user.id))
      .orderBy(desc(kinfolkTaskListsTable.createdAt));
    res.json({ lists });
  } catch (err) {
    req.log.error({ err }, "GET /kinfolk/lists error");
    res.status(500).json({ error: "Failed to load lists" });
  }
});

router.post("/kinfolk/lists", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { name, icon } = req.body as { name?: string; icon?: string };
  if (!name?.trim()) { res.status(400).json({ error: "List name required" }); return; }
  try {
    const [list] = await db
      .insert(kinfolkTaskListsTable)
      .values({ userId: req.user.id, name: name.trim(), icon: icon ?? "📋" })
      .returning();
    res.json({ list });
  } catch (err) {
    req.log.error({ err }, "POST /kinfolk/lists error");
    res.status(500).json({ error: "Failed to create list" });
  }
});

router.delete("/kinfolk/lists/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const listId = String(req.params.id);
    await db.delete(kinfolkTasksTable).where(
      and(eq(kinfolkTasksTable.listId, listId), eq(kinfolkTasksTable.userId, req.user.id))
    );
    await db.delete(kinfolkTaskListsTable).where(
      and(eq(kinfolkTaskListsTable.id, listId), eq(kinfolkTaskListsTable.userId, req.user.id))
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /kinfolk/lists/:id error");
    res.status(500).json({ error: "Failed to delete list" });
  }
});

// ── Tasks ──────────────────────────────────────────────────────────────────────

router.get("/kinfolk/tasks", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { listId } = req.query as { listId?: string };
  try {
    const conditions = [eq(kinfolkTasksTable.userId, req.user.id)];
    if (listId === "none") {
      conditions.push(isNull(kinfolkTasksTable.listId));
    } else if (listId) {
      conditions.push(eq(kinfolkTasksTable.listId, listId));
    }
    const tasks = await db
      .select()
      .from(kinfolkTasksTable)
      .where(and(...conditions))
      .orderBy(kinfolkTasksTable.createdAt);
    res.json({ tasks });
  } catch (err) {
    req.log.error({ err }, "GET /kinfolk/tasks error");
    res.status(500).json({ error: "Failed to load tasks" });
  }
});

router.post("/kinfolk/tasks", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { title, notes, listId, dueAt, dueTimeLabel, category } = req.body as {
    title?: string; notes?: string; listId?: string;
    dueAt?: string; dueTimeLabel?: string; category?: string;
  };
  if (!title?.trim()) { res.status(400).json({ error: "Task title required" }); return; }
  try {
    const [task] = await db.insert(kinfolkTasksTable).values({
      userId: req.user.id,
      title: title.trim(),
      notes: notes?.trim() ?? null,
      listId: listId ?? null,
      dueAt: dueAt ? new Date(dueAt) : null,
      dueTimeLabel: dueTimeLabel?.trim() ?? null,
      category: category ?? "other",
    }).returning();
    res.json({ task });
  } catch (err) {
    req.log.error({ err }, "POST /kinfolk/tasks error");
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.post("/kinfolk/tasks/bulk", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { tasks, listId } = req.body as {
    tasks: Array<{ title: string; notes?: string; dueTimeLabel?: string; category?: string }>;
    listId?: string;
  };
  if (!Array.isArray(tasks) || tasks.length === 0) {
    res.status(400).json({ error: "Tasks array required" }); return;
  }
  try {
    const inserted = await db.insert(kinfolkTasksTable).values(
      tasks.map(t => ({
        userId: req.user!.id,
        listId: listId ?? null,
        title: t.title.trim(),
        notes: t.notes?.trim() ?? null,
        dueTimeLabel: t.dueTimeLabel?.trim() ?? null,
        category: t.category ?? "other",
      }))
    ).returning();
    res.json({ tasks: inserted });
  } catch (err) {
    req.log.error({ err }, "POST /kinfolk/tasks/bulk error");
    res.status(500).json({ error: "Failed to create tasks" });
  }
});

router.patch("/kinfolk/tasks/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { isCompleted, title, notes, dueTimeLabel } = req.body as {
    isCompleted?: boolean; title?: string; notes?: string; dueTimeLabel?: string;
  };
  try {
    const updates: Record<string, unknown> = {};
    if (typeof isCompleted === "boolean") {
      updates.isCompleted = isCompleted;
      updates.completedAt = isCompleted ? new Date() : null;
    }
    if (title) updates.title = title.trim();
    if (typeof notes === "string") updates.notes = notes.trim() || null;
    if (typeof dueTimeLabel === "string") updates.dueTimeLabel = dueTimeLabel.trim() || null;

    const [task] = await db
      .update(kinfolkTasksTable)
      .set(updates)
      .where(and(eq(kinfolkTasksTable.id, String(req.params.id)), eq(kinfolkTasksTable.userId, req.user.id)))
      .returning();
    res.json({ task });
  } catch (err) {
    req.log.error({ err }, "PATCH /kinfolk/tasks/:id error");
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/kinfolk/tasks/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    await db.delete(kinfolkTasksTable).where(
      and(eq(kinfolkTasksTable.id, String(req.params.id)), eq(kinfolkTasksTable.userId, req.user.id))
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /kinfolk/tasks/:id error");
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
