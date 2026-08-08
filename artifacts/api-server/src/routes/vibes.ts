import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

export const VIBE_LIST = [
  {
    id: "date-night",
    label: "Date Night",
    icon: "heart",
    description: "Romantic, intimate, couples",
    priceHint: "$$-$$$",
  },
  {
    id: "group-hangout",
    label: "Group Hangout",
    icon: "users",
    description: "Lively, social, great for squads",
    priceHint: "$-$$",
  },
  {
    id: "solo-vibes",
    label: "Solo Vibes",
    icon: "user",
    description: "Quiet, chill, recharge energy",
    priceHint: "$-$$",
  },
  {
    id: "bougie-treat",
    label: "Bougie Treat",
    icon: "award",
    description: "Upscale, elevated, special occasion",
    priceHint: "$$$-$$$$",
  },
  {
    id: "hood-classic",
    label: "Hood Classic",
    icon: "home",
    description: "Authentic, local, community staple",
    priceHint: "$-$$",
  },
  {
    id: "soul-food",
    label: "Soul Food",
    icon: "coffee",
    description: "Southern comfort, home cooking, real flavor",
    priceHint: "$-$$",
  },
  {
    id: "late-night",
    label: "Late Night",
    icon: "moon",
    description: "After dark, nightlife, good energy",
    priceHint: "$$-$$$",
  },
  {
    id: "family-time",
    label: "Family Time",
    icon: "smile",
    description: "Kid-friendly, wholesome, all ages",
    priceHint: "$-$$",
  },
  {
    id: "creative-scene",
    label: "Creative Scene",
    icon: "music",
    description: "Art, music, culture, expression",
    priceHint: "$-$$$",
  },
  {
    id: "wellness",
    label: "Wellness",
    icon: "activity",
    description: "Health, spa, spiritual, balance",
    priceHint: "$$-$$$",
  },
  {
    id: "work-and-study",
    label: "Work & Study",
    icon: "book-open",
    description: "Productive, WiFi, focused energy",
    priceHint: "$-$$",
  },
  {
    id: "adventure",
    label: "Adventure Ready",
    icon: "compass",
    description: "Active, explorative, outdoors",
    priceHint: "$-$$",
  },
  // Community endorsement vibes — used by the web business detail page
  {
    id: "hidden_gem",
    label: "Hidden Gem",
    icon: "gem",
    description: "Underrated, secret, worth discovering",
    priceHint: "$-$$$",
  },
  {
    id: "community_staple",
    label: "Community Staple",
    icon: "home",
    description: "A cornerstone of the neighborhood",
    priceHint: "$-$$",
  },
  {
    id: "grandma_approved",
    label: "Grandma Approved",
    icon: "heart",
    description: "Authentic, time-tested, trusted by generations",
    priceHint: "$-$$",
  },
  {
    id: "worth_every_visit",
    label: "Worth Every Visit",
    icon: "star",
    description: "Consistently excellent, never disappoints",
    priceHint: "$-$$$",
  },
  {
    id: "date_night",
    label: "Date Night Worthy",
    icon: "heart",
    description: "Romantic, intimate, great for couples",
    priceHint: "$$-$$$",
  },
  {
    id: "family_friendly",
    label: "Family Friendly",
    icon: "smile",
    description: "Welcoming to all ages, great for families",
    priceHint: "$-$$",
  },
  {
    id: "black_excellence",
    label: "Black Excellence",
    icon: "award",
    description: "Exemplary Black-owned community business",
    priceHint: "$-$$$",
  },
];

// GET /vibes/list — return canonical vibe list
router.get("/vibes/list", (_req, res) => {
  res.json({ vibes: VIBE_LIST });
});

// GET /vibes/search — smart ranked business search by vibe + price
router.get("/vibes/search", async (req, res) => {
  try {
    const rawVibes = req.query.vibes as string | string[] | undefined;
    const rawPrices = req.query.price as string | string[] | undefined;
    const city = (req.query.city as string | undefined)?.trim();
    const userId = req.user?.id ?? null;

    const vibes = rawVibes
      ? Array.isArray(rawVibes)
        ? rawVibes
        : rawVibes.split(",").map((v) => v.trim())
      : [];
    const prices = rawPrices
      ? Array.isArray(rawPrices)
        ? rawPrices
        : rawPrices.split(",").map((p) => p.trim())
      : [];

    if (vibes.length === 0) {
      res.json({ businesses: [], message: "No vibes specified" });
      return;
    }

    const params: (string | string[])[] = [vibes];
    let priceClause = "";
    if (prices.length > 0) {
      params.push(prices);
      priceClause = `AND (b.price_range = ANY($${params.length}::text[]))`;
    }

    let cityClause = "";
    if (city) {
      params.push(`%${city}%`);
      cityClause = `AND b.city ILIKE $${params.length}`;
    }

    let savedSubquery = "0";
    if (userId) {
      params.push(userId);
      savedSubquery = `CASE WHEN EXISTS (
        SELECT 1 FROM saved_places sp
        WHERE sp.business_id = b.id AND sp.user_id = $${params.length}
      ) THEN 15 ELSE 0 END`;
    }

    const sql = `
      SELECT
        b.id,
        b.name,
        b.category,
        b.subcategory,
        b.description,
        b.city,
        b.state,
        b.address,
        b.image_url,
        b.price_range,
        b.rating,
        b.review_count,
        b.confidence_score,
        b.verified,
        b.black_owned,
        b.ownership_designations,
        b.vibes,
        b.hours,
        b.phone,
        b.website,
        b.latitude,
        b.longitude,
        b.hidden_gem_label,
        b.hidden_gem_tagline,
        b.business_status,
        b.promoted_until,
        COALESCE((
          SELECT COUNT(*)::int
          FROM business_vibe_tags bvt
          WHERE bvt.business_id = b.id AND bvt.vibe = ANY($1::text[])
        ), 0) AS community_tag_count,
        COALESCE((
          SELECT jsonb_object_agg(vibe_agg.vibe, vibe_agg.cnt)
          FROM (
            SELECT bvt2.vibe, COUNT(*)::int AS cnt
            FROM business_vibe_tags bvt2
            WHERE bvt2.business_id = b.id
            GROUP BY bvt2.vibe
          ) vibe_agg
        ), '{}'::jsonb) AS all_vibe_counts,
        (
          SELECT COUNT(*)::int
          FROM jsonb_array_elements_text(COALESCE(b.vibes, '[]'::jsonb)) v
          WHERE v = ANY($1::text[])
        ) AS owner_vibe_matches,
        ${savedSubquery} AS saved_boost,
        (
          b.rating::float * 2 +
          b.confidence_score::float / 20.0 +
          b.review_count * 0.1 +
          ${savedSubquery} +
          COALESCE((
            SELECT COUNT(*)::int * 2
            FROM business_vibe_tags bvt3
            WHERE bvt3.business_id = b.id AND bvt3.vibe = ANY($1::text[])
          ), 0) +
          (
            SELECT COUNT(*)::int * 5
            FROM jsonb_array_elements_text(COALESCE(b.vibes, '[]'::jsonb)) v
            WHERE v = ANY($1::text[])
          ) +
          CASE
            WHEN b.business_status = 'premium' THEN 8
            WHEN b.business_status = 'growth' THEN 4
            ELSE 0
          END +
          CASE WHEN b.promoted_until IS NOT NULL AND b.promoted_until > NOW() THEN 5 ELSE 0 END
        ) AS total_score
      FROM businesses b
      WHERE b.black_owned = true
        AND b.status = 'active'
        AND (
          EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(COALESCE(b.vibes, '[]'::jsonb)) v
            WHERE v = ANY($1::text[])
          )
          OR EXISTS (
            SELECT 1
            FROM business_vibe_tags bvt4
            WHERE bvt4.business_id = b.id AND bvt4.vibe = ANY($1::text[])
          )
        )
        ${priceClause}
        ${cityClause}
      ORDER BY total_score DESC
      LIMIT 30
    `;

    const result = await pool.query(sql, params);

    res.json({
      businesses: result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        subcategory: r.subcategory,
        description: r.description,
        city: r.city,
        state: r.state,
        address: r.address,
        imageUrl: r.image_url,
        priceRange: r.price_range,
        rating: parseFloat(r.rating ?? "0"),
        reviewCount: r.review_count,
        confidenceScore: r.confidence_score,
        verified: r.verified,
        blackOwned: r.black_owned,
        ownershipDesignations: r.ownership_designations ?? [],
        vibes: r.vibes ?? [],
        hours: r.hours,
        phone: r.phone,
        website: r.website,
        latitude: r.latitude,
        longitude: r.longitude,
        hiddenGemLabel: r.hidden_gem_label,
        hiddenGemTagline: r.hidden_gem_tagline,
        communityTagCount: r.community_tag_count,
        allVibeCounts: r.all_vibe_counts ?? {},
        ownerVibeMatches: r.owner_vibe_matches,
        isSaved: (r.saved_boost as number) > 0,
        rankScore: parseFloat(r.total_score ?? "0"),
      })),
      meta: {
        vibesSearched: vibes,
        pricesFiltered: prices,
        city: city ?? null,
        total: result.rows.length,
      },
    });
  } catch (err) {
    req.log.error({ err }, "vibe search error");
    res.status(500).json({ error: "Search failed" });
  }
});

// GET /vibes/businesses/:id — vibe data for a specific business
router.get("/vibes/businesses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id ?? null;

    const [bizResult, tagsResult, userTagsResult] = await Promise.all([
      pool.query("SELECT vibes FROM businesses WHERE id = $1 AND status = 'active'", [id]),
      pool.query(
        `SELECT vibe, COUNT(*)::int as count
         FROM business_vibe_tags
         WHERE business_id = $1
         GROUP BY vibe
         ORDER BY count DESC`,
        [id],
      ),
      userId
        ? pool.query(
            "SELECT vibe FROM business_vibe_tags WHERE business_id = $1 AND user_id = $2",
            [id, userId],
          )
        : Promise.resolve({ rows: [] }),
    ]);

    if (bizResult.rows.length === 0) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    res.json({
      ownerVibes: bizResult.rows[0].vibes ?? [],
      communityTags: tagsResult.rows.map((r) => ({ vibe: r.vibe, count: r.count })),
      myTags: userTagsResult.rows.map((r: { vibe: string }) => r.vibe),
    });
  } catch (err) {
    req.log.error({ err }, "get vibe data error");
    res.status(500).json({ error: "Failed to load vibe data" });
  }
});

// POST /vibes/tag — user adds a vibe tag to a business
router.post("/vibes/tag", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user.id;
    const { businessId, vibe } = req.body as { businessId?: string; vibe?: string };

    if (!businessId || !vibe) {
      res.status(400).json({ error: "businessId and vibe required" });
      return;
    }

    const validVibe = VIBE_LIST.find((v) => v.id === vibe);
    if (!validVibe) {
      res.status(400).json({ error: "Invalid vibe" });
      return;
    }

    await pool.query(
      `INSERT INTO business_vibe_tags (business_id, user_id, vibe)
       VALUES ($1, $2, $3)
       ON CONFLICT ON CONSTRAINT uniq_biz_user_vibe DO NOTHING`,
      [businessId, userId, vibe],
    );

    const countRes = await pool.query(
      "SELECT COUNT(*)::int as count FROM business_vibe_tags WHERE business_id = $1 AND vibe = $2",
      [businessId, vibe],
    );

    res.json({ ok: true, count: (countRes.rows[0] as { count: number }).count });
  } catch (err) {
    req.log.error({ err }, "add vibe tag error");
    res.status(500).json({ error: "Failed to add vibe tag" });
  }
});

// DELETE /vibes/tag — user removes their vibe tag
router.delete("/vibes/tag", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user.id;
    const { businessId, vibe } = req.body as { businessId?: string; vibe?: string };

    if (!businessId || !vibe) {
      res.status(400).json({ error: "businessId and vibe required" });
      return;
    }

    await pool.query(
      "DELETE FROM business_vibe_tags WHERE business_id = $1 AND user_id = $2 AND vibe = $3",
      [businessId, userId, vibe],
    );

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "remove vibe tag error");
    res.status(500).json({ error: "Failed to remove vibe tag" });
  }
});

// PATCH /vibes/businesses/:id/owner-tags — business owner sets their vibes
router.patch("/vibes/businesses/:id/owner-tags", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { vibes } = req.body as { vibes?: string[] };

    if (!Array.isArray(vibes)) {
      res.status(400).json({ error: "vibes must be an array" });
      return;
    }

    const validVibes = vibes.filter((v) => VIBE_LIST.some((vl) => vl.id === v));
    if (validVibes.length > 6) {
      res.status(400).json({ error: "Maximum 6 vibes allowed" });
      return;
    }

    const ownerCheck = await pool.query(
      "SELECT id FROM businesses WHERE id = $1 AND submitted_by_id = $2 AND status = 'active'",
      [id, userId],
    );
    if (ownerCheck.rows.length === 0) {
      res.status(403).json({ error: "Not authorized to update this business" });
      return;
    }

    await pool.query("UPDATE businesses SET vibes = $1::jsonb WHERE id = $2", [
      JSON.stringify(validVibes),
      id,
    ]);

    res.json({ ok: true, vibes: validVibes });
  } catch (err) {
    req.log.error({ err }, "update owner vibes error");
    res.status(500).json({ error: "Failed to update vibes" });
  }
});

// GET /vibes/endorsements/:businessId — top endorsement tags for a business
// Returns only tags that have reached the 10-tap display threshold.
router.get("/endorsements/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const DISPLAY_THRESHOLD = 10;

    const result = await pool.query(
      `SELECT
         t.tag_key,
         COALESCE(et.label, t.tag_key) AS label,
         COUNT(*)::int AS count
       FROM business_endorsement_taps t
       LEFT JOIN endorsement_tags et ON et.tag_key = t.tag_key
       WHERE t.business_id = $1
       GROUP BY t.tag_key, et.label
       HAVING COUNT(*) >= $2
       ORDER BY count DESC
       LIMIT 20`,
      [businessId, DISPLAY_THRESHOLD]
    );

    res.json({
      tags: result.rows.map((r) => ({ tagKey: r.tag_key, label: r.label, count: r.count })),
      threshold: DISPLAY_THRESHOLD,
    });
  } catch (err) {
    req.log.error({ err }, "get endorsement counts error");
    res.status(500).json({ error: "Failed to load endorsement data" });
  }
});

// GET /vibes/my-tags — user's top vibes from their tagging behavior (for Kinfolk AI)
router.get("/vibes/my-tags", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT vibe, COUNT(*)::int as count
       FROM business_vibe_tags
       WHERE user_id = $1
       GROUP BY vibe
       ORDER BY count DESC
       LIMIT 5`,
      [userId],
    );

    res.json({
      topVibes: result.rows.map((r) => ({ vibe: r.vibe, count: r.count })),
    });
  } catch (err) {
    req.log.error({ err }, "get my vibe tags error");
    res.status(500).json({ error: "Failed to load vibe data" });
  }
});

export default router;
