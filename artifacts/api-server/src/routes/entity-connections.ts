import { Router, type IRouter, type Request, type Response } from "express";
import { db, entityConnectionsTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";

const router: IRouter = Router();

router.post("/connections/entity", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { fromId, fromType, toId, toType, connectionType, strength, label } = req.body as Record<string, unknown>;
  if (!fromId || !fromType || !toId || !toType || !connectionType) {
    res.status(400).json({ error: "fromId, fromType, toId, toType, connectionType required" });
    return;
  }

  try {
    const [connection] = await db
      .insert(entityConnectionsTable)
      .values({
        fromId: fromId as string,
        fromType: fromType as any,
        toId: toId as string,
        toType: toType as any,
        connectionType: connectionType as any,
        strength: typeof strength === "number" ? strength : 1,
        label: typeof label === "string" ? label : undefined,
      })
      .onConflictDoUpdate({
        target: [entityConnectionsTable.fromId, entityConnectionsTable.toId, entityConnectionsTable.connectionType],
        set: {
          strength: typeof strength === "number" ? strength : 1,
          label: typeof label === "string" ? label : undefined,
        },
      })
      .returning();
    res.status(201).json({ connection });
  } catch (err) {
    req.log.error({ err }, "Failed to create entity connection");
    res.status(500).json({ error: "Failed to create entity connection" });
  }
});

router.get("/connections/entity/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { type } = req.query as { type?: string };

  try {
    const connections = await db
      .select()
      .from(entityConnectionsTable)
      .where(
        or(
          and(
            eq(entityConnectionsTable.fromId, id),
            type ? eq(entityConnectionsTable.fromType, type as any) : undefined,
          ),
          and(
            eq(entityConnectionsTable.toId, id),
            type ? eq(entityConnectionsTable.toType, type as any) : undefined,
          ),
        ),
      )
      .limit(50);
    res.json({ connections });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch entity connections");
    res.status(500).json({ error: "Failed to fetch entity connections" });
  }
});

router.delete("/connections/entity/:connectionId", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const connectionId = String(req.params.connectionId);

  try {
    const [deleted] = await db
      .delete(entityConnectionsTable)
      .where(eq(entityConnectionsTable.id, connectionId))
      .returning({ id: entityConnectionsTable.id });
    if (!deleted) { res.status(404).json({ error: "Connection not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete entity connection");
    res.status(500).json({ error: "Failed to delete entity connection" });
  }
});

export default router;
