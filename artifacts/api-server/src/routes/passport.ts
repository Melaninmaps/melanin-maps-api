import { Router, type IRouter, type Request, type Response } from "express";
import { culturalPassportMomentsTable, db, usersTable } from "@workspace/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  culturalPassportView,
  validateCulturalPassportMoment,
} from "../kinfolk/cultural-passport-policy";

const router: IRouter = Router();

/**
 * My Passport is a private record of meaningful moments the member explicitly
 * asks to keep. It intentionally never derives levels, points, streaks,
 * achievements, completion, or progress from platform engagement.
 */
router.get("/users/passport", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  try {
    const userId = req.user.id;
    const [[userRow], moments] = await Promise.all([
      db
        .select({ createdAt: usersTable.createdAt, firstName: usersTable.firstName, lastName: usersTable.lastName, username: usersTable.username })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1),
      db
        .select({
          id: culturalPassportMomentsTable.id,
          kind: culturalPassportMomentsTable.kind,
          title: culturalPassportMomentsTable.title,
          note: culturalPassportMomentsTable.note,
          sourceLabel: culturalPassportMomentsTable.sourceLabel,
          sourceUrl: culturalPassportMomentsTable.sourceUrl,
          createdAt: culturalPassportMomentsTable.createdAt,
        })
        .from(culturalPassportMomentsTable)
        .where(and(
          eq(culturalPassportMomentsTable.userId, userId),
          isNull(culturalPassportMomentsTable.removedAt),
        ))
        .orderBy(desc(culturalPassportMomentsTable.createdAt))
        .limit(100),
    ]);

    const displayName = userRow?.firstName
      ? `${userRow.firstName}${userRow.lastName ? ` ${userRow.lastName}` : ""}`
      : (userRow?.username ?? "Community Member");
    const memberSince = userRow?.createdAt
      ? new Date(userRow.createdAt).getFullYear()
      : new Date().getFullYear();

    res.json({ passport: culturalPassportView({ displayName, memberSince, moments }) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch cultural Passport");
    res.status(500).json({ error: "My Passport is unavailable right now." });
  }
});

router.post("/users/passport/moments", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const validated = validateCulturalPassportMoment(req.body ?? {});
  if (!validated.ok) { res.status(400).json({ error: validated.error }); return; }

  try {
    const [moment] = await db
      .insert(culturalPassportMomentsTable)
      .values({
        userId: req.user.id,
        ...validated.value,
        memberConfirmedAt: new Date(),
      })
      .returning({
        id: culturalPassportMomentsTable.id,
        kind: culturalPassportMomentsTable.kind,
        title: culturalPassportMomentsTable.title,
        note: culturalPassportMomentsTable.note,
        sourceLabel: culturalPassportMomentsTable.sourceLabel,
        sourceUrl: culturalPassportMomentsTable.sourceUrl,
        createdAt: culturalPassportMomentsTable.createdAt,
      });

    res.status(201).json({ moment });
  } catch (err) {
    req.log.error({ err }, "Failed to save cultural Passport moment");
    res.status(500).json({ error: "Kinfolk could not save that moment. Nothing was added to My Passport." });
  }
});

router.delete("/users/passport/moments/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  try {
    const [removed] = await db
      .update(culturalPassportMomentsTable)
      .set({ removedAt: new Date() })
      .where(and(
        eq(culturalPassportMomentsTable.id, String(req.params.id)),
        eq(culturalPassportMomentsTable.userId, req.user.id),
        isNull(culturalPassportMomentsTable.removedAt),
      ))
      .returning({ id: culturalPassportMomentsTable.id });

    if (!removed) { res.status(404).json({ error: "Passport moment not found." }); return; }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to remove cultural Passport moment");
    res.status(500).json({ error: "Kinfolk could not remove that Passport moment." });
  }
});

export default router;
