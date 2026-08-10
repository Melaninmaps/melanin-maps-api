import { Router, type IRouter, type Request, type Response } from "express";
import { db, eventsTable, savedCommunityLocationsTable, notificationsTable, userPreferencesTable } from "@workspace/db";
import { eq, desc, and, ilike, or, gte, sql, isNotNull } from "drizzle-orm";
import { getUserTier } from "../middleware/requireMembership";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/events", async (req: Request, res: Response) => {
  try {
    const { category, search, featured } = req.query;

    const conditions = [];

    if (category && typeof category === "string" && category !== "All") {
      conditions.push(eq(eventsTable.category, category));
    }

    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(eventsTable.title, `%${search}%`),
          ilike(eventsTable.city, `%${search}%`),
          ilike(eventsTable.location, `%${search}%`),
          ilike(eventsTable.description, `%${search}%`),
        ),
      );
    }

    if (featured === "true") {
      conditions.push(eq(eventsTable.featured, true));
    }

    // Show only active events
    conditions.push(eq(eventsTable.status, "active"));

    const rawEvents = await db
      .select()
      .from(eventsTable)
      .where(and(...conditions))
      .orderBy(desc(eventsTable.createdAt))
      .limit(600);

    // Personalize: score by user preferences if authenticated
    let events: Array<typeof rawEvents[0] & { relevanceScore: number }> =
      rawEvents.map(e => ({ ...e, relevanceScore: 0 }));

    if (req.user?.id) {
      try {
        const [prefs] = await db
          .select()
          .from(userPreferencesTable)
          .where(eq(userPreferencesTable.userId, req.user.id));

        if (prefs) {
          const favCats = [
            ...(prefs.favoriteCategories ?? []),
            ...(prefs.culturalInterests ?? []),
          ].map(s => s.toLowerCase());
          const favCities = (prefs.favoriteCities ?? []).map(s => s.toLowerCase());
          const wantsFree = prefs.budgetRange === "budget" || prefs.budgetRange === "free";

          events = events.map(e => {
            let score = 0;
            const eCat = e.category.toLowerCase();
            if (favCats.some(c => eCat.includes(c) || c.includes(eCat))) score += 3;
            const eCity = e.city.toLowerCase();
            if (favCities.some(c => eCity.includes(c) || c.includes(eCity))) score += 2;
            if (wantsFree && e.isFree) score += 1;
            return { ...e, relevanceScore: score };
          });

          // Most relevant first, then newest
          events.sort((a, b) =>
            b.relevanceScore - a.relevanceScore ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        }
      } catch (prefErr) {
        req.log.error({ err: prefErr }, "Failed to fetch user preferences for event ranking");
      }
    }

    // Filter out events whose date has already passed.
    // Dates are stored as human-readable strings ("August 15, 2026").
    // Parse them at request time; exclude anything before today (midnight ET).
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcoming = events.filter(e => {
      try {
        const d = new Date(e.date);
        return !isNaN(d.getTime()) && d >= now;
      } catch {
        return true; // if unparseable, keep the event
      }
    });

    res.json({ events: upcoming });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch events");
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.get("/events/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, id));

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    res.json({ event });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch event");
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

router.post("/events", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Tier gate
    const tier = await getUserTier(req.user.id);
    if (tier === "free") {
      res.status(403).json({
        error: "Hosting events requires an Explorer+ or higher membership.",
        code: "TIER_LIMIT_REACHED",
        upgradeUrl: "/membership",
      });
      return;
    }
    if (tier === "navigator") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(eventsTable)
        .where(and(eq(eventsTable.createdById, req.user.id), gte(eventsTable.createdAt, startOfMonth)));
      if (count >= 3) {
        res.status(403).json({
          error: "Explorer+ members can host up to 3 events per month. Upgrade to Navigator for unlimited events.",
          code: "TIER_LIMIT_REACHED",
          upgradeUrl: "/membership",
        });
        return;
      }
    }
    // Trailblazer: unlimited, no cap

    const {
      title, description, date, dateShort, time, location,
      city, state, category, organizer, price, isFree,
      latitude, longitude, featured,
    } = req.body as Record<string, unknown>;

    if (!title || !date || !city || !state) {
      res.status(400).json({ error: "title, date, city, and state are required" });
      return;
    }

    const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const [event] = await db
      .insert(eventsTable)
      .values({
        id,
        title: title as string,
        description: (description as string | undefined) ?? "",
        date: date as string,
        dateShort: (dateShort as string | undefined) ?? (date as string).slice(0, 6),
        time: (time as string | undefined) ?? "",
        location: (location as string | undefined) ?? "",
        city: city as string,
        state: state as string,
        category: (category as string | undefined) ?? "Cultural",
        organizer: (organizer as string | undefined) ?? "",
        price: (price as string | undefined) ?? "Free",
        isFree: isFree === true || isFree === "true",
        latitude: latitude != null ? String(latitude) : null,
        longitude: longitude != null ? String(longitude) : null,
        featured: featured === true || featured === "true",
        createdById: req.user.id,
      })
      .returning();

    // Fan out community event notifications to users who have this city set as My Community
    try {
      const communityMembers = await db
        .select({ userId: savedCommunityLocationsTable.userId })
        .from(savedCommunityLocationsTable)
        .where(
          and(
            eq(savedCommunityLocationsTable.isMyComm, true),
            ilike(savedCommunityLocationsTable.city, (city as string).trim()),
          ),
        );

      if (communityMembers.length > 0) {
        const notifs = communityMembers
          .filter((m) => m.userId !== req.user!.id)
          .map((m) => ({
            userId: m.userId,
            type: "community" as const,
            title: `New event in your community`,
            body: `${title as string} is happening in ${city as string} on ${date as string}.`,
          }));
        if (notifs.length > 0) {
          await db.insert(notificationsTable).values(notifs);
        }
      }
    } catch (notifErr) {
      req.log.error({ err: notifErr }, "Failed to fan out community event notifications");
    }

    res.status(201).json({ event });
  } catch (err) {
    req.log.error({ err }, "Failed to create event");
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.patch("/events/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const id = String(req.params.id);
    const [existing] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (existing.createdById && existing.createdById !== req.user.id) {
      res.status(403).json({ error: "Not authorized to edit this event" });
      return;
    }

    const {
      title, description, date, dateShort, time, location,
      city, state, category, organizer, price, isFree,
      latitude, longitude, featured, status,
    } = req.body as Record<string, unknown>;

    const updates: Partial<typeof existing> = {};
    if (title != null) updates.title = title as string;
    if (description != null) updates.description = description as string;
    if (date != null) updates.date = date as string;
    if (dateShort != null) updates.dateShort = dateShort as string;
    if (time != null) updates.time = time as string;
    if (location != null) updates.location = location as string;
    if (city != null) updates.city = city as string;
    if (state != null) updates.state = state as string;
    if (category != null) updates.category = category as string;
    if (organizer != null) updates.organizer = organizer as string;
    if (price != null) updates.price = price as string;
    if (isFree != null) updates.isFree = isFree === true || isFree === "true";
    if (latitude != null) updates.latitude = String(latitude);
    if (longitude != null) updates.longitude = String(longitude);
    if (featured != null) updates.featured = featured === true || featured === "true";
    if (status != null) updates.status = status as string;

    const [event] = await db
      .update(eventsTable)
      .set(updates)
      .where(eq(eventsTable.id, id))
      .returning();

    res.json({ event });
  } catch (err) {
    req.log.error({ err }, "Failed to update event");
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/events/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const id = String(req.params.id);
    const [existing] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (existing.createdById && existing.createdById !== req.user.id) {
      res.status(403).json({ error: "Not authorized to delete this event" });
      return;
    }

    await db.delete(eventsTable).where(eq(eventsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete event");
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
