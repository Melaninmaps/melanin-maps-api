import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import {
  db,
  kinfolkCuriosityListItemsTable,
  kinfolkCuriosityListsTable,
  type KinfolkCuriosityList,
  type KinfolkCuriosityListItem,
} from "@workspace/db";
import {
  isCuriosityListId,
  openCuriosityItemText,
  openCuriosityListName,
  parseCuriosityItemInput,
  parseCuriosityListInput,
  parseCuriosityListOrderInput,
  parseCuriosityListUseInput,
  parseMemberConfirmation,
  sealCuriosityItemText,
  sealCuriosityListName,
} from "../kinfolk/curiosity-list-policy";
import { PrivateMemoryEncryptionIntegrityError, PrivateMemoryEncryptionUnavailableError } from "../kinfolk/private-memory-encryption";

const router: IRouter = Router();
// BEGIN BOUNDED CURIOSITY LIST ROUTES
function owner(req: Request, res: Response): string | null {
  res.setHeader("Cache-Control", "no-store");
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}
function accessError(res: Response, error: unknown) {
  const unavailable = error instanceof PrivateMemoryEncryptionUnavailableError;
  const crypto = unavailable || error instanceof PrivateMemoryEncryptionIntegrityError;
  res.status(unavailable ? 503 : crypto ? 409 : 503).json({
    error: "Curiosity List could not be securely accessed. Please retry. The record was not changed.",
    code: "CURIOSITY_LIST_SECURE_ACCESS_REQUIRED", recoverable: true,
  });
}
const listOwner = (userId: string, id: string) => and(eq(kinfolkCuriosityListsTable.userId, userId), eq(kinfolkCuriosityListsTable.id, id));
const itemOwner = (userId: string, listId: string, id?: string) => and(
  eq(kinfolkCuriosityListItemsTable.userId, userId), eq(kinfolkCuriosityListItemsTable.listId, listId),
  ...(id ? [eq(kinfolkCuriosityListItemsTable.id, id)] : []),
);
function listView(list: KinfolkCuriosityList, name: string, items: Array<KinfolkCuriosityListItem & { text: string }>) {
  return {
    id: list.id, name, allowKinfolkUse: list.allowKinfolkUse, createdAt: list.createdAt, updatedAt: list.updatedAt,
    items: items.map(({ id, text, position, createdAt, updatedAt }) => ({ id, text, position, createdAt, updatedAt })),
  };
}
// Root databases include `$client`; Drizzle transaction objects expose the same
// query methods but intentionally do not carry that root-only property.
type CuriosityQuerySession = Pick<typeof db, "select" | "insert" | "update" | "delete" | "execute">;
async function selectedList(tx: CuriosityQuerySession, userId: string, listId: string): Promise<KinfolkCuriosityList | null> {
  const [list] = await tx.select().from(kinfolkCuriosityListsTable).where(listOwner(userId, listId)).for("update").limit(1);
  return list ?? null;
}
async function ownerItems(tx: CuriosityQuerySession, userId: string, listId: string): Promise<KinfolkCuriosityListItem[]> {
  return tx.select().from(kinfolkCuriosityListItemsTable).where(itemOwner(userId, listId)).orderBy(asc(kinfolkCuriosityListItemsTable.position));
}
async function lockListPositionWrites(tx: CuriosityQuerySession, listId: string) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`kinfolk-curiosity-list:${listId}`}))`);
}

router.get("/kinfolk/curiosity-lists", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  try {
    const lists = await db.select().from(kinfolkCuriosityListsTable).where(eq(kinfolkCuriosityListsTable.userId, userId)).orderBy(asc(kinfolkCuriosityListsTable.createdAt));
    const views = await Promise.all(lists.map(async (list) => {
      const items = await ownerItems(db, userId, list.id);
      return listView(list, openCuriosityListName(list, userId), items.map((item) => ({ ...item, text: openCuriosityItemText(item, userId) })));
    }));
    res.json({ lists: views });
  } catch (error) { accessError(res, error); }
});

router.post("/kinfolk/curiosity-lists", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  const input = parseCuriosityListInput(req.body);
  if (!input) { res.status(400).json({ error: "Provide a valid private list name and confirm your choice." }); return; }
  try {
    const now = new Date(); const row = { id: randomUUID(), userId, allowKinfolkUse: false, createdAt: now, updatedAt: now };
    const sealed = sealCuriosityListName(input.name, row);
    openCuriosityListName({ ...row, ...sealed }, userId);
    const [saved] = await db.insert(kinfolkCuriosityListsTable).values({ ...row, ...sealed }).returning();
    res.status(201).json({ list: listView(saved!, input.name, []) });
  } catch (error) { accessError(res, error); }
});

router.patch("/kinfolk/curiosity-lists/:listId", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  if (!isCuriosityListId(req.params.listId)) { res.status(404).json({ error: "Curiosity List not found" }); return; }
  const input = parseCuriosityListInput(req.body);
  if (!input) { res.status(400).json({ error: "Provide a valid private list name and confirm your choice." }); return; }
  try {
    const view = await db.transaction(async (tx) => {
      const list = await selectedList(tx, userId, req.params.listId as string);
      if (!list) { res.status(404).json({ error: "Curiosity List not found" }); return; }
      openCuriosityListName(list, userId);
      const sealed = sealCuriosityListName(input.name, list);
      openCuriosityListName({ ...list, ...sealed }, userId);
      const [saved] = await tx.update(kinfolkCuriosityListsTable).set({ ...sealed, updatedAt: new Date() }).where(listOwner(userId, list.id)).returning();
      const items = await ownerItems(tx, userId, list.id);
      return listView(saved!, input.name, items.map((item) => ({ ...item, text: openCuriosityItemText(item, userId) })));
    });
    if (view) res.json({ list: view });
  } catch (error) { accessError(res, error); }
});

router.patch("/kinfolk/curiosity-lists/:listId/kinfolk-use", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  if (!isCuriosityListId(req.params.listId)) { res.status(404).json({ error: "Curiosity List not found" }); return; }
  const input = parseCuriosityListUseInput(req.body);
  if (!input) { res.status(400).json({ error: "Choose the Kinfolk setting and confirm your choice." }); return; }
  try {
    const view = await db.transaction(async (tx) => {
      const list = await selectedList(tx, userId, req.params.listId as string);
      if (!list) { res.status(404).json({ error: "Curiosity List not found" }); return; }
      const name = openCuriosityListName(list, userId);
      const [saved] = await tx.update(kinfolkCuriosityListsTable).set({ allowKinfolkUse: input.allowKinfolkUse, updatedAt: new Date() }).where(listOwner(userId, list.id)).returning();
      const items = await ownerItems(tx, userId, list.id);
      return listView(saved!, name, items.map((item) => ({ ...item, text: openCuriosityItemText(item, userId) })));
    });
    if (view) res.json({ list: view });
  } catch (error) { accessError(res, error); }
});

router.post("/kinfolk/curiosity-lists/:listId/items", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  if (!isCuriosityListId(req.params.listId)) { res.status(404).json({ error: "Curiosity List not found" }); return; }
  const input = parseCuriosityItemInput(req.body);
  if (!input) { res.status(400).json({ error: "Provide a valid private topic and confirm your choice." }); return; }
  try {
    const view = await db.transaction(async (tx) => {
      const listId = req.params.listId as string;
      await lockListPositionWrites(tx, listId);
      const list = await selectedList(tx, userId, listId);
      if (!list) { res.status(404).json({ error: "Curiosity List not found" }); return; }
      openCuriosityListName(list, userId);
      const existing = await ownerItems(tx, userId, list.id);
      const now = new Date(); const row = { id: randomUUID(), listId: list.id, userId, position: existing.length, createdAt: now, updatedAt: now };
      const sealed = sealCuriosityItemText(input.text, row);
      openCuriosityItemText({ ...row, ...sealed }, userId);
      await tx.insert(kinfolkCuriosityListItemsTable).values({ ...row, ...sealed });
      const items = [...existing.map((item) => ({ ...item, text: openCuriosityItemText(item, userId) })), { ...row, ...sealed, text: input.text }];
      return listView(list, openCuriosityListName(list, userId), items);
    });
    if (view) res.status(201).json({ list: view });
  } catch (error) { accessError(res, error); }
});

router.patch("/kinfolk/curiosity-lists/:listId/items/:itemId", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  if (!isCuriosityListId(req.params.listId) || !isCuriosityListId(req.params.itemId)) { res.status(404).json({ error: "Curiosity topic not found" }); return; }
  const input = parseCuriosityItemInput(req.body);
  if (!input) { res.status(400).json({ error: "Provide a valid private topic and confirm your choice." }); return; }
  try {
    const view = await db.transaction(async (tx) => {
      const list = await selectedList(tx, userId, req.params.listId as string);
      if (!list) { res.status(404).json({ error: "Curiosity List not found" }); return; }
      const [item] = await tx.select().from(kinfolkCuriosityListItemsTable).where(itemOwner(userId, list.id, req.params.itemId as string)).for("update").limit(1);
      if (!item) { res.status(404).json({ error: "Curiosity topic not found" }); return; }
      openCuriosityItemText(item, userId);
      const sealed = sealCuriosityItemText(input.text, item);
      openCuriosityItemText({ ...item, ...sealed }, userId);
      await tx.update(kinfolkCuriosityListItemsTable).set({ ...sealed, updatedAt: new Date() }).where(itemOwner(userId, list.id, item.id));
      const items = await ownerItems(tx, userId, list.id);
      return listView(list, openCuriosityListName(list, userId), items.map((current) => ({ ...current, text: current.id === item.id ? input.text : openCuriosityItemText(current, userId) })));
    });
    if (view) res.json({ list: view });
  } catch (error) { accessError(res, error); }
});

router.put("/kinfolk/curiosity-lists/:listId/items/order", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  if (!isCuriosityListId(req.params.listId)) { res.status(404).json({ error: "Curiosity List not found" }); return; }
  const input = parseCuriosityListOrderInput(req.body);
  if (!input) { res.status(400).json({ error: "Provide a complete valid topic order and confirm your choice." }); return; }
  try {
    const view = await db.transaction(async (tx) => {
      const listId = req.params.listId as string;
      await lockListPositionWrites(tx, listId);
      const list = await selectedList(tx, userId, listId);
      if (!list) { res.status(404).json({ error: "Curiosity List not found" }); return; }
      const existing = await ownerItems(tx, userId, list.id);
      if (existing.length !== input.itemIds.length || existing.some((item) => !input.itemIds.includes(item.id))) {
        res.status(400).json({ error: "Provide the complete current topic order." }); return;
      }
      // First move every row to a disjoint valid range, then assign final
      // positions. This keeps the non-negative check valid and makes swaps and
      // rotations collision-safe under the unique (list_id, position) index.
      await tx.update(kinfolkCuriosityListItemsTable).set({ position: sql`${kinfolkCuriosityListItemsTable.position} + 1000000`, updatedAt: new Date() }).where(itemOwner(userId, list.id));
      for (const [position, itemId] of input.itemIds.entries()) {
        await tx.update(kinfolkCuriosityListItemsTable).set({ position, updatedAt: new Date() }).where(itemOwner(userId, list.id, itemId));
      }
      const reordered = await ownerItems(tx, userId, list.id);
      return listView(list, openCuriosityListName(list, userId), reordered.map((item) => ({ ...item, text: openCuriosityItemText(item, userId) })));
    });
    if (view) res.json({ list: view });
  } catch (error) { accessError(res, error); }
});

router.delete("/kinfolk/curiosity-lists/:listId/items/:itemId", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  if (!isCuriosityListId(req.params.listId) || !isCuriosityListId(req.params.itemId)) { res.status(404).json({ error: "Curiosity topic not found" }); return; }
  if (!parseMemberConfirmation(req.body)) { res.status(400).json({ error: "Confirm removal of this private topic." }); return; }
  try {
    const removed = await db.transaction(async (tx) => {
      const list = await selectedList(tx, userId, req.params.listId as string);
      if (!list) { res.status(404).json({ error: "Curiosity List not found" }); return; }
      const [item] = await tx.select().from(kinfolkCuriosityListItemsTable).where(itemOwner(userId, list.id, req.params.itemId as string)).for("update").limit(1);
      if (!item) { res.status(404).json({ error: "Curiosity topic not found" }); return; }
      openCuriosityItemText(item, userId);
      await tx.delete(kinfolkCuriosityListItemsTable).where(itemOwner(userId, list.id, item.id));
      return true;
    });
    if (removed) res.json({ removed: true });
  } catch (error) { accessError(res, error); }
});

router.delete("/kinfolk/curiosity-lists/:listId", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  if (!isCuriosityListId(req.params.listId)) { res.status(404).json({ error: "Curiosity List not found" }); return; }
  if (!parseMemberConfirmation(req.body)) { res.status(400).json({ error: "Confirm removal of this private list." }); return; }
  try {
    const removed = await db.transaction(async (tx) => {
      const list = await selectedList(tx, userId, req.params.listId as string);
      if (!list) { res.status(404).json({ error: "Curiosity List not found" }); return; }
      openCuriosityListName(list, userId);
      await tx.delete(kinfolkCuriosityListsTable).where(listOwner(userId, list.id));
      return true;
    });
    if (removed) res.json({ removed: true });
  } catch (error) { accessError(res, error); }
});
// END BOUNDED CURIOSITY LIST ROUTES
export default router;
