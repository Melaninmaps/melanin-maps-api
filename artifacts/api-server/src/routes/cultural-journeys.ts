import { Router, type IRouter, type Request, type Response } from "express";
import { culturalJourneyEntriesTable, db, pool } from "@workspace/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  CULTURAL_JOURNEY_DISCLOSURE,
  culturalJourneyEntryView,
  validateCulturalJourneyReflection,
} from "../kinfolk/cultural-journey-policy";

const router: IRouter = Router();

const entryProjection = {
  id: culturalJourneyEntriesTable.id,
  culturalSiteId: culturalJourneyEntriesTable.culturalSiteId,
  siteName: culturalJourneyEntriesTable.siteName,
  sourceLabel: culturalJourneyEntriesTable.sourceLabel,
  libraryQuestion: culturalJourneyEntriesTable.libraryQuestion,
  reflection: culturalJourneyEntriesTable.reflection,
  createdAt: culturalJourneyEntriesTable.createdAt,
  updatedAt: culturalJourneyEntriesTable.updatedAt,
};

function validSiteId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id && id.length <= 128 ? id : null;
}

/**
 * My Cultural Journey stores only an explicit, private member reference to a
 * published cultural site. It does not infer identity, track visits, store a
 * live location, or use a saved entry as Kinfolk memory/context.
 */
router.get("/cultural-journeys", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const entries = await db
      .select(entryProjection)
      .from(culturalJourneyEntriesTable)
      .where(and(
        eq(culturalJourneyEntriesTable.userId, req.user.id),
        isNull(culturalJourneyEntriesTable.removedAt),
      ))
      .orderBy(desc(culturalJourneyEntriesTable.createdAt))
      .limit(100);
    res.setHeader("Cache-Control", "no-store");
    res.json({ disclosure: CULTURAL_JOURNEY_DISCLOSURE, entries: entries.map(culturalJourneyEntryView) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch cultural Journey entries");
    res.status(500).json({ error: "My Cultural Journey is unavailable right now." });
  }
});

router.post("/cultural-journeys/cultural-sites/:siteId", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  if (req.body?.memberConfirmed !== true) {
    res.status(400).json({ error: "Explicit confirmation is required before Kinfolk saves a Cultural Journey entry." });
    return;
  }
  const siteId = validSiteId(req.params.siteId);
  if (!siteId) { res.status(400).json({ error: "Cultural site is required." }); return; }

  try {
    const source = await pool.query<{
      id: string;
      name: string;
      heritage_category: string | null;
    }>(
      `SELECT id, name, heritage_category
       FROM cultural_sites
       WHERE id = $1 AND COALESCE(is_published, TRUE) = TRUE
       LIMIT 1`,
      [siteId],
    );
    const site = source.rows[0];
    if (!site) { res.status(404).json({ error: "Published cultural site not found." }); return; }

    const [existing] = await db
      .select(entryProjection)
      .from(culturalJourneyEntriesTable)
      .where(and(
        eq(culturalJourneyEntriesTable.userId, req.user.id),
        eq(culturalJourneyEntriesTable.culturalSiteId, site.id),
        isNull(culturalJourneyEntriesTable.removedAt),
      ))
      .limit(1);
    if (existing) {
      res.json({ created: false, entry: culturalJourneyEntryView(existing) });
      return;
    }

    const sourceLabel = site.heritage_category?.trim() || "Cultural site";
    const libraryQuestion = `${site.name}: history, context, and reputable sources`;
    const [entry] = await db
      .insert(culturalJourneyEntriesTable)
      .values({
        userId: req.user.id,
        culturalSiteId: site.id,
        siteName: site.name,
        sourceLabel,
        libraryQuestion,
        memberConfirmedAt: new Date(),
      })
      .returning(entryProjection);
    res.status(201).json({ created: true, entry: culturalJourneyEntryView(entry!) });
  } catch (err) {
    req.log.error({ err }, "Failed to save cultural Journey entry");
    res.status(500).json({ error: "Kinfolk could not save that Cultural Journey entry. Nothing was added." });
  }
});

router.patch("/cultural-journeys/entries/:entryId/reflection", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const entryId = validSiteId(req.params.entryId);
  if (!entryId) { res.status(400).json({ error: "Journey entry is required." }); return; }
  const validated = validateCulturalJourneyReflection(req.body ?? {});
  if (!validated.ok) { res.status(400).json({ error: validated.error }); return; }

  try {
    const [entry] = await db
      .update(culturalJourneyEntriesTable)
      .set({
        reflection: validated.value,
        reflectionConfirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(culturalJourneyEntriesTable.id, entryId),
        eq(culturalJourneyEntriesTable.userId, req.user.id),
        isNull(culturalJourneyEntriesTable.removedAt),
      ))
      .returning(entryProjection);
    if (!entry) { res.status(404).json({ error: "Cultural Journey entry not found." }); return; }
    res.json({ entry: culturalJourneyEntryView(entry) });
  } catch (err) {
    req.log.error({ err }, "Failed to save cultural Journey reflection");
    res.status(500).json({ error: "Kinfolk could not save that reflection. Your Journey is unchanged." });
  }
});

router.delete("/cultural-journeys/entries/:entryId", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const entryId = validSiteId(req.params.entryId);
  if (!entryId) { res.status(400).json({ error: "Journey entry is required." }); return; }
  try {
    const [removed] = await db
      .update(culturalJourneyEntriesTable)
      .set({ removedAt: new Date(), updatedAt: new Date() })
      .where(and(
        eq(culturalJourneyEntriesTable.id, entryId),
        eq(culturalJourneyEntriesTable.userId, req.user.id),
        isNull(culturalJourneyEntriesTable.removedAt),
      ))
      .returning({ id: culturalJourneyEntriesTable.id });
    if (!removed) { res.status(404).json({ error: "Cultural Journey entry not found." }); return; }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to remove cultural Journey entry");
    res.status(500).json({ error: "Kinfolk could not remove that Cultural Journey entry." });
  }
});

export default router;
