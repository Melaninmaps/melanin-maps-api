import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, kinfolkCurrentChaptersTable, type KinfolkCurrentChapter } from "@workspace/db";
import { isSensitiveChapterKind, parseCurrentChapterKind } from "@workspace/constants";
import { openChapterNote, parseChapterInput, sealChapterNote } from "../kinfolk/current-chapter-policy";
import { PrivateMemoryEncryptionIntegrityError, PrivateMemoryEncryptionUnavailableError } from "../kinfolk/private-memory-encryption";
import { requireSensitiveMemoryVaultReauth, sensitiveMemoryVaultReauthState } from "../kinfolk/sensitive-memory-vault";

const router: IRouter = Router();
// BEGIN BOUNDED CURRENT CHAPTER ROUTES
function owner(req: Request, res: Response): string | null {
  res.setHeader("Cache-Control", "no-store");
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}
function chapterError(res: Response, error: unknown) {
  const crypto = error instanceof PrivateMemoryEncryptionIntegrityError || error instanceof PrivateMemoryEncryptionUnavailableError;
  res.status(error instanceof PrivateMemoryEncryptionUnavailableError ? 503 : crypto ? 409 : 503).json({
    error: "Current Chapter could not be securely accessed. Please retry. The record was not changed.",
    code: "CURRENT_CHAPTER_SECURE_ACCESS_REQUIRED", recoverable: true,
  });
}
function chapterView(row: KinfolkCurrentChapter, note: string | null, vaultLocked = false) {
  return {
    id: row.id, kind: vaultLocked ? null : parseCurrentChapterKind(row.kind), note,
    isSensitive: row.isSensitive, vaultLocked, allowRelevantUse: row.allowRelevantUse,
    memberConfirmedAt: row.memberConfirmedAt, startedAt: row.startedAt, endedAt: row.endedAt,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}
const ownerRow = (userId: string, id: string) => and(eq(kinfolkCurrentChaptersTable.userId, userId), eq(kinfolkCurrentChaptersTable.id, id));
const validId = (id: unknown): id is string => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

router.get("/kinfolk/current-chapters", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  try {
    const rows = await db.select().from(kinfolkCurrentChaptersTable).where(eq(kinfolkCurrentChaptersTable.userId, userId)).orderBy(desc(kinfolkCurrentChaptersTable.startedAt));
    const unlocked = (await sensitiveMemoryVaultReauthState(req)).reauthenticated;
    const chapters = rows.map((row) => row.isSensitive && !unlocked
      ? chapterView(row, null, true) : chapterView(row, openChapterNote(row, userId)));
    res.json({ chapters });
  } catch (error) { chapterError(res, error); }
});

router.post("/kinfolk/current-chapters", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  const input = parseChapterInput(req.body);
  if (!input) { res.status(400).json({ error: "Choose a valid chapter and explicitly confirm it." }); return; }
  const isSensitive = isSensitiveChapterKind(input.kind);
  if (isSensitive && !input.sensitiveConfirmed) { res.status(400).json({ error: "Explicit sensitive chapter confirmation is required." }); return; }
  try {
    if (isSensitive && !await requireSensitiveMemoryVaultReauth(req, res)) return;
    const now = new Date();
    const row = { id: randomUUID(), userId, kind: input.kind, isSensitive, allowRelevantUse: input.allowRelevantUse,
      memberConfirmedAt: now, startedAt: now, endedAt: null, createdAt: now, updatedAt: now };
    const sealed = sealChapterNote(input.note, row);
    // Verify before the first mutation, including an optional/empty private note.
    openChapterNote({ ...row, ...sealed }, userId);
    const [saved] = await db.insert(kinfolkCurrentChaptersTable).values({ ...row, ...sealed }).returning();
    res.status(201).json({ chapter: chapterView(saved!, input.note) });
  } catch (error) { chapterError(res, error); }
});

router.patch("/kinfolk/current-chapters/:id", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  if (!validId(req.params.id)) { res.status(404).json({ error: "Chapter not found" }); return; }
  try {
    const updated = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(kinfolkCurrentChaptersTable).where(ownerRow(userId, req.params.id as string)).for("update").limit(1);
      if (!existing) { res.status(404).json({ error: "Chapter not found" }); return; }
      const input = parseChapterInput(req.body);
      if (!input) { res.status(400).json({ error: "Choose a valid chapter and explicitly confirm it." }); return; }
      const isSensitive = isSensitiveChapterKind(input.kind);
      if (existing.isSensitive || isSensitive) {
        if (!input.sensitiveConfirmed) { res.status(400).json({ error: "Explicit sensitive chapter confirmation is required." }); return; }
        if (!await requireSensitiveMemoryVaultReauth(req, res)) return;
      }
      openChapterNote(existing, userId);
      const changed = { ...existing, kind: input.kind, isSensitive, allowRelevantUse: input.allowRelevantUse };
      const sealed = sealChapterNote(input.note, changed);
      openChapterNote({ ...changed, ...sealed }, userId);
      const [saved] = await tx.update(kinfolkCurrentChaptersTable).set({
        kind: changed.kind, isSensitive, allowRelevantUse: changed.allowRelevantUse, ...sealed,
        memberConfirmedAt: new Date(), updatedAt: new Date(),
      }).where(ownerRow(userId, existing.id)).returning();
      return chapterView(saved!, input.note);
    });
    if (updated) res.json({ chapter: updated });
  } catch (error) { chapterError(res, error); }
});

router.post("/kinfolk/current-chapters/:id/end", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  if (!validId(req.params.id)) { res.status(404).json({ error: "Chapter not found" }); return; }
  try {
    const ended = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(kinfolkCurrentChaptersTable).where(ownerRow(userId, req.params.id as string)).for("update").limit(1);
      if (!existing) { res.status(404).json({ error: "Chapter not found" }); return; }
      if (req.body?.memberConfirmed !== true) { res.status(400).json({ error: "Explicit confirmation is required to end a chapter." }); return; }
      if (existing.isSensitive && !await requireSensitiveMemoryVaultReauth(req, res)) return;
      const note = openChapterNote(existing, userId);
      if (existing.endedAt) return chapterView(existing, note);
      const [saved] = await tx.update(kinfolkCurrentChaptersTable).set({ endedAt: new Date(), updatedAt: new Date() }).where(ownerRow(userId, existing.id)).returning();
      return chapterView(saved!, note);
    });
    if (ended) res.json({ chapter: ended });
  } catch (error) { chapterError(res, error); }
});

router.delete("/kinfolk/current-chapters/:id", async (req: Request, res: Response) => {
  const userId = owner(req, res); if (!userId) return;
  if (!validId(req.params.id)) { res.status(404).json({ error: "Chapter not found" }); return; }
  try {
    const removed = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(kinfolkCurrentChaptersTable).where(ownerRow(userId, req.params.id as string)).for("update").limit(1);
      if (!existing) { res.status(404).json({ error: "Chapter not found" }); return; }
      if (existing.isSensitive && !await requireSensitiveMemoryVaultReauth(req, res)) return;
      openChapterNote(existing, userId);
      await tx.delete(kinfolkCurrentChaptersTable).where(ownerRow(userId, existing.id));
      return true;
    });
    if (removed) res.json({ removed: true });
  } catch (error) { chapterError(res, error); }
});
// END BOUNDED CURRENT CHAPTER ROUTES
export default router;
