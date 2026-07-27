import { Router, type IRouter, type Request, type Response } from "express";
import { db, wellnessCheckinsTable, wellnessGoalsTable } from "@workspace/db";
import { eq, and, desc, sql, gte } from "drizzle-orm";

const router: IRouter = Router();

// ── POST /wellness/checkin ────────────────────────────────────────────────────
router.post("/wellness/checkin", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { mood, energyLevel, stressLevel, sleepHours, gratitude, intention, note, isPublic } = req.body as Record<string, any>;
  const today = new Date().toISOString().split("T")[0];

  if (mood !== undefined && (mood < 1 || mood > 5)) { res.status(400).json({ error: "mood must be 1–5" }); return; }

  try {
    // Upsert: one check-in per user per day
    const [existing] = await db.select({ id: wellnessCheckinsTable.id })
      .from(wellnessCheckinsTable)
      .where(and(eq(wellnessCheckinsTable.userId, req.user.id), eq(wellnessCheckinsTable.date, today)))
      .limit(1);

    let checkin;
    if (existing) {
      [checkin] = await db.update(wellnessCheckinsTable)
        .set({
          ...(mood !== undefined ? { mood: Number(mood) } : {}),
          ...(energyLevel !== undefined ? { energyLevel: Number(energyLevel) } : {}),
          ...(stressLevel !== undefined ? { stressLevel: Number(stressLevel) } : {}),
          ...(sleepHours !== undefined ? { sleepHours: String(sleepHours) } : {}),
          ...(gratitude !== undefined ? { gratitude: String(gratitude).trim() } : {}),
          ...(intention !== undefined ? { intention: String(intention).trim() } : {}),
          ...(note !== undefined ? { note: String(note).trim() } : {}),
          ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {}),
        })
        .where(eq(wellnessCheckinsTable.id, existing.id))
        .returning();
    } else {
      [checkin] = await db.insert(wellnessCheckinsTable).values({
        userId: req.user.id,
        date: today,
        mood: mood !== undefined ? Number(mood) : null,
        energyLevel: energyLevel !== undefined ? Number(energyLevel) : null,
        stressLevel: stressLevel !== undefined ? Number(stressLevel) : null,
        sleepHours: sleepHours !== undefined ? String(sleepHours) : null,
        gratitude: gratitude ? String(gratitude).trim() : null,
        intention: intention ? String(intention).trim() : null,
        note: note ? String(note).trim() : null,
        isPublic: Boolean(isPublic),
      }).returning();
    }

    // Calculate streak
    const streak = await computeStreak(req.user.id);

    res.json({ checkin, streak, isUpdate: !!existing });
  } catch (err) {
    req.log.error({ err }, "Failed to save wellness check-in");
    res.status(500).json({ error: "Failed to save check-in" });
  }
});

// ── GET /wellness/checkins ────────────────────────────────────────────────────
router.get("/wellness/checkins", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { days: dStr } = req.query as Record<string, string>;
  const days = Math.min(parseInt(dStr ?? "30", 10), 90);
  const since = new Date(Date.now() - days * 86_400_000).toISOString().split("T")[0];

  try {
    const checkins = await db.select().from(wellnessCheckinsTable)
      .where(and(eq(wellnessCheckinsTable.userId, req.user.id), gte(wellnessCheckinsTable.date, since)))
      .orderBy(desc(wellnessCheckinsTable.date)).limit(90);

    const streak = await computeStreak(req.user.id);
    const todayStr = new Date().toISOString().split("T")[0];
    const todayCheckin = checkins.find((c) => c.date === todayStr) ?? null;

    res.json({ checkins, streak, todayCheckin });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch check-ins");
    res.status(500).json({ error: "Failed to fetch check-ins" });
  }
});

// ── GET /wellness/streak ──────────────────────────────────────────────────────
router.get("/wellness/streak", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const streak = await computeStreak(req.user.id);
  res.json({ streak });
});

// ── GET /wellness/goals ───────────────────────────────────────────────────────
router.get("/wellness/goals", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const goals = await db.select().from(wellnessGoalsTable)
      .where(and(eq(wellnessGoalsTable.userId, req.user.id), eq(wellnessGoalsTable.isActive, true)))
      .orderBy(desc(wellnessGoalsTable.createdAt));
    res.json({ goals });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch wellness goals");
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// ── POST /wellness/goals ──────────────────────────────────────────────────────
router.post("/wellness/goals", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { type, title, description, targetValue, unit, frequency, targetDate, isPrivate } = req.body as Record<string, any>;
  if (!type || !title?.trim()) { res.status(400).json({ error: "type and title are required" }); return; }

  try {
    const [goal] = await db.insert(wellnessGoalsTable).values({
      userId: req.user.id,
      type: String(type),
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      targetValue: targetValue !== undefined ? String(targetValue) : null,
      unit: unit ? String(unit).trim() : null,
      frequency: frequency ?? "daily",
      startDate: new Date().toISOString().split("T")[0],
      targetDate: targetDate ? String(targetDate) : null,
      isPrivate: Boolean(isPrivate),
    }).returning();
    res.json({ goal });
  } catch (err) {
    req.log.error({ err }, "Failed to create wellness goal");
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// ── PATCH /wellness/goals/:id ─────────────────────────────────────────────────
router.patch("/wellness/goals/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    const [existing] = await db.select({ userId: wellnessGoalsTable.userId, streakCount: wellnessGoalsTable.streakCount })
      .from(wellnessGoalsTable).where(eq(wellnessGoalsTable.id, id)).limit(1);
    if (!existing || existing.userId !== req.user.id) { res.status(404).json({ error: "Not found" }); return; }

    const { currentValue, isActive, streakIncrement } = req.body as Record<string, any>;
    await db.update(wellnessGoalsTable).set({
      ...(currentValue !== undefined ? { currentValue: String(currentValue) } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      ...(streakIncrement ? { streakCount: sql`${wellnessGoalsTable.streakCount} + 1`, lastCompletedAt: new Date() } : {}),
      updatedAt: new Date(),
    }).where(eq(wellnessGoalsTable.id, id));
    res.json({ updated: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update goal");
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// ── Helper: compute check-in streak ──────────────────────────────────────────
async function computeStreak(userId: string): Promise<number> {
  try {
    const rows = await db.select({ date: wellnessCheckinsTable.date })
      .from(wellnessCheckinsTable)
      .where(eq(wellnessCheckinsTable.userId, userId))
      .orderBy(desc(wellnessCheckinsTable.date))
      .limit(365);

    if (rows.length === 0) return 0;

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

    // Streak must start from today or yesterday
    if (rows[0].date !== today && rows[0].date !== yesterday) return 0;

    let streak = 0;
    let expected = rows[0].date === today ? today : yesterday;

    for (const row of rows) {
      if (row.date === expected) {
        streak++;
        const d = new Date(expected);
        d.setDate(d.getDate() - 1);
        expected = d.toISOString().split("T")[0];
      } else {
        break;
      }
    }
    return streak;
  } catch {
    return 0;
  }
}

export default router;
