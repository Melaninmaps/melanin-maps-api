import { Router } from "express";
import { pool } from "@workspace/db";
import {
  getBusinessExperiencePolicy,
  getOwnerProfileExperienceChoices,
  normalizeOwnerExperienceKey,
  VIBES_BY_CATEGORY,
} from "@workspace/constants";
import { mwmDiasporaPromotionSqlPredicate } from "../businesses/mwmCoreDiscoveryPolicy";

const router = Router();

type CanonicalVibe = {
  id: string;
  label: string;
  description: string;
  categories: string[];
};

/**
 * The version-controlled VIBES taxonomy is the sole selector/search vocabulary.
 * A VIBE is an atmosphere descriptor, not a category, ownership label, or
 * quality claim. Duplicate labels across eligible categories remain one filter
 * key with their permitted categories returned for clients.
 */
export const VIBE_LIST: CanonicalVibe[] = Object.values(
  Object.entries(VIBES_BY_CATEGORY)
    .flatMap(([category, vibes]) => vibes.map((vibe) => ({
      id: normalizeOwnerExperienceKey(vibe.label),
      label: vibe.label,
      description: vibe.helperText,
      category,
    })))
    .reduce<Record<string, CanonicalVibe>>((all, vibe) => {
      const existing = all[vibe.id];
      if (existing) {
        if (!existing.categories.includes(vibe.category)) existing.categories.push(vibe.category);
      } else {
        all[vibe.id] = {
          id: vibe.id,
          label: vibe.label,
          description: vibe.description,
          categories: [vibe.category],
        };
      }
      return all;
    }, {}),
);

function canonicalVibeKey(value: string): string | null {
  const normalized = normalizeOwnerExperienceKey(value);
  if (VIBE_LIST.some((vibe) => vibe.id === normalized)) return normalized;
  const labelMatch = VIBE_LIST.find((vibe) => vibe.label.toLowerCase() === value.trim().toLowerCase());
  return labelMatch?.id ?? null;
}

function normalizedVibeSql(column: string): string {
  return `lower(regexp_replace(${column}, '[^a-z0-9]+', '_', 'g'))`;
}

// GET /vibes/list — canonical category-aware VIBES for every client.
router.get('/vibes/list', (_req, res) => {
  res.json({ vibes: VIBE_LIST });
});

// GET /vibes/search — public, canonical VIBES search by atmosphere + price.
router.get('/vibes/search', async (req, res) => {
  try {
    const rawVibes = req.query.vibes as string | string[] | undefined;
    const rawPrices = req.query.price as string | string[] | undefined;
    const city = (req.query.city as string | undefined)?.trim();
    const userId = req.user?.id ?? null;

    const submittedVibes = rawVibes
      ? (Array.isArray(rawVibes) ? rawVibes : rawVibes.split(','))
      : [];
    const vibes = [...new Set(submittedVibes
      .map((value) => canonicalVibeKey(value))
      .filter((value): value is string => Boolean(value)))];
    const prices = rawPrices
      ? (Array.isArray(rawPrices) ? rawPrices : rawPrices.split(',')).map((value) => value.trim())
      : [];

    if (submittedVibes.length > 0 && vibes.length !== submittedVibes.length) {
      res.status(400).json({ error: 'One or more VIBES are not available in the canonical taxonomy' });
      return;
    }
    if (vibes.length === 0) {
      res.json({ businesses: [], message: 'No VIBES specified' });
      return;
    }

    const params: (string | string[])[] = [vibes];
    let priceClause = '';
    if (prices.length > 0) {
      params.push(prices);
      priceClause = `AND b.price_range = ANY($${params.length}::text[])`;
    }
    let cityClause = '';
    if (city) {
      params.push(`%${city}%`);
      cityClause = `AND b.city ILIKE $${params.length}`;
    }
    let savedSubquery = '0';
    if (userId) {
      params.push(userId);
      savedSubquery = `CASE WHEN EXISTS (
        SELECT 1 FROM saved_places sp
        WHERE sp.business_id = b.id AND sp.user_id = $${params.length}
      ) THEN 15 ELSE 0 END`;
    }

    const ownerVibeMatch = `(
      SELECT COUNT(*)::int
      FROM jsonb_array_elements_text(COALESCE(b.vibes, '[]'::jsonb)) v
      WHERE ${normalizedVibeSql('v')} = ANY($1::text[])
    )`;
    const communityVibeMatch = `(
      SELECT COUNT(*)::int
      FROM business_vibe_tags bvt
      WHERE bvt.business_id = b.id
        AND ${normalizedVibeSql('bvt.vibe')} = ANY($1::text[])
    )`;
    const sql = `
      SELECT
        b.id, b.name, b.category, b.subcategory, b.description, b.city, b.state,
        b.address, b.image_url, b.price_range, b.rating, b.review_count,
        b.confidence_score, b.verified, b.ownership_designations, b.vibes,
        b.hours, b.phone, b.website, b.latitude, b.longitude,
        ${communityVibeMatch} AS community_tag_count,
        ${ownerVibeMatch} AS owner_vibe_matches,
        ${savedSubquery} AS saved_boost,
        (
          b.rating::float * 2 +
          b.confidence_score::float / 20.0 +
          b.review_count * 0.1 +
          ${savedSubquery} +
          ${communityVibeMatch} * 2 +
          ${ownerVibeMatch} * 5
        ) AS total_score
      FROM public.public_businesses b
      WHERE (${ownerVibeMatch} > 0 OR ${communityVibeMatch} > 0)
        AND ${mwmDiasporaPromotionSqlPredicate("b.id")}
        ${priceClause}
        ${cityClause}
      ORDER BY total_score DESC, b.name ASC
      LIMIT 30
    `;
    const result = await pool.query(sql, params);

    res.json({
      businesses: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        subcategory: row.subcategory,
        description: row.description,
        city: row.city,
        state: row.state,
        address: row.address,
        imageUrl: row.image_url,
        priceRange: row.price_range,
        rating: parseFloat(row.rating ?? '0'),
        reviewCount: row.review_count,
        confidenceScore: row.confidence_score,
        verified: row.verified,
        ownershipDesignations: row.ownership_designations ?? [],
        vibes: row.vibes ?? [],
        hours: row.hours,
        phone: row.phone,
        website: row.website,
        latitude: row.latitude,
        longitude: row.longitude,
        communityTagCount: row.community_tag_count,
        ownerVibeMatches: row.owner_vibe_matches,
        isSaved: Number(row.saved_boost) > 0,
        rankScore: parseFloat(row.total_score ?? '0'),
      })),
      meta: { vibesSearched: vibes, pricesFiltered: prices, city: city ?? null, total: result.rows.length },
    });
  } catch (err) {
    req.log.error({ err }, 'canonical VIBES search error');
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /vibes/businesses/:id — vibe data for a specific business
router.get("/vibes/businesses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id ?? null;

    const [bizResult, tagsResult, userTagsResult] = await Promise.all([
      pool.query("SELECT vibes FROM public.public_businesses WHERE id = $1", [id]),
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

    const canonicalVibe = canonicalVibeKey(vibe);
    if (!canonicalVibe) {
      res.status(400).json({ error: "Invalid vibe" });
      return;
    }

    const business = await pool.query<{ category: string; subcategory: string | null }>(
      "SELECT category, subcategory FROM public.public_businesses WHERE id = $1",
      [businessId],
    );
    if (!business.rows[0]) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const policy = getBusinessExperiencePolicy(business.rows[0].category, business.rows[0].subcategory);
    if (!policy.vibeChoices.some((choice) => choice.key === canonicalVibe)) {
      res.status(400).json({ error: "This VIBE does not fit this business type" });
      return;
    }

    await pool.query(
      `INSERT INTO business_vibe_tags (business_id, user_id, vibe)
       VALUES ($1, $2, $3)
       ON CONFLICT ON CONSTRAINT uniq_biz_user_vibe DO NOTHING`,
      [businessId, userId, canonicalVibe],
    );

    const countRes = await pool.query(
      "SELECT COUNT(*)::int as count FROM business_vibe_tags WHERE business_id = $1 AND vibe = $2",
      [businessId, canonicalVibe],
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

// POST /vibes/endorse — user taps a THE REAL tag for a business
// Uses business_endorsement_taps table. One tap per user per tag per business (idempotent).
router.post("/vibes/endorse", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user.id;
    const { businessId, tagKey } = req.body as { businessId?: string; tagKey?: string };
    if (!businessId || !tagKey) { res.status(400).json({ error: "businessId and tagKey required" }); return; }

    await pool.query(
      `INSERT INTO business_endorsement_taps (business_id, user_id, tag_key)
       VALUES ($1, $2, $3)
       ON CONFLICT (business_id, user_id, tag_key) DO NOTHING`,
      [businessId, userId, tagKey],
    );
    const countRes = await pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM business_endorsement_taps WHERE business_id = $1 AND tag_key = $2`,
      [businessId, tagKey],
    );
    res.json({ ok: true, count: countRes.rows[0]?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "add endorsement tap error");
    res.status(500).json({ error: "Failed to add endorsement" });
  }
});

// DELETE /vibes/endorse — user removes their THE REAL tag tap
router.delete("/vibes/endorse", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user.id;
    const { businessId, tagKey } = req.body as { businessId?: string; tagKey?: string };
    if (!businessId || !tagKey) { res.status(400).json({ error: "businessId and tagKey required" }); return; }

    await pool.query(
      `DELETE FROM business_endorsement_taps WHERE business_id = $1 AND user_id = $2 AND tag_key = $3`,
      [businessId, userId, tagKey],
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "remove endorsement tap error");
    res.status(500).json({ error: "Failed to remove endorsement" });
  }
});

// PATCH /vibes/businesses/:id/owner-tags — business owner sets their vibes
router.patch("/vibes/businesses/:id/owner-tags", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { vibes, priceKey } = req.body as { vibes?: string[]; priceKey?: string | null };

    if (!Array.isArray(vibes)) {
      res.status(400).json({ error: "vibes must be an array" });
      return;
    }

    const ownerCheck = await pool.query<{ id: string; category: string; subcategory: string | null }>(
      `SELECT b.id, b.category, b.subcategory
         FROM businesses b
        WHERE b.id = $1
          AND b.status = 'active'
          AND EXISTS (
            SELECT 1 FROM business_owner_links bol
             WHERE bol.business_id = b.id
               AND bol.user_id = $2
               AND bol.role = 'owner'
               AND bol.status = 'approved'
               AND bol.revoked_at IS NULL
          )`,
      [id, userId],
    );
    if (ownerCheck.rows.length === 0) {
      res.status(403).json({ error: "Not authorized to update this business" });
      return;
    }

    const policy = getBusinessExperiencePolicy(ownerCheck.rows[0].category, ownerCheck.rows[0].subcategory);
    const allowed = new Set(getOwnerProfileExperienceChoices(policy).map((choice) => choice.key));
    const validVibes = [...new Set(vibes.filter((value): value is string => typeof value === "string" && allowed.has(value)))];
    if (validVibes.length !== vibes.length) {
      res.status(400).json({ error: "One or more profile tags do not fit this business type." });
      return;
    }
    if (validVibes.length > 2) {
      res.status(400).json({ error: "Choose up to 2 owner profile tags." });
      return;
    }

    const selectedPrice = priceKey === null
      ? null
      : policy.priceChoices.find((choice) => choice.key === priceKey)?.label;
    if (priceKey !== undefined && priceKey !== null && !selectedPrice) {
      res.status(400).json({ error: "Choose a valid price point." });
      return;
    }

    await pool.query("UPDATE businesses SET vibes = $1::jsonb, price_range = CASE WHEN $2::boolean THEN $3 ELSE price_range END WHERE id = $4", [
      JSON.stringify(validVibes),
      priceKey !== undefined,
      selectedPrice ?? null,
      id,
    ]);

    res.json({ ok: true, vibes: validVibes, priceRange: priceKey === undefined ? undefined : selectedPrice ?? null });
  } catch (err) {
    req.log.error({ err }, "update owner vibes error");
    res.status(500).json({ error: "Failed to update vibes" });
  }
});

// GET /vibes/endorsements/:businessId — top endorsement tags for a business
// Returns only tags that have reached the 10-tap display threshold.
router.get("/vibes/endorsements/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const DISPLAY_THRESHOLD = 10;

    // NOTE: endorsement_tags is not a DB table — labels come from the tag_key itself.
    // We also check the_real_tags table (which IS seeded) for a friendly label,
    // falling back to INITCAP(REPLACE(tag_key,'_',' ')) for endorsement tags.
    const result = await pool.query(
      `SELECT
         t.tag_key,
         COALESCE(
           rt.label,
           INITCAP(REPLACE(t.tag_key, '_', ' '))
         ) AS label,
         COUNT(*)::int AS count
       FROM business_endorsement_taps t
       LEFT JOIN the_real_tags rt ON rt.tag_key = t.tag_key
       WHERE t.business_id = $1
       GROUP BY t.tag_key, rt.label
       HAVING COUNT(*) >= $2
       ORDER BY count DESC
       LIMIT 20`,
      [businessId, DISPLAY_THRESHOLD]
    );

    // Include which tags the current user has already tapped (for web UI active state)
    let userTags: string[] = [];
    if (req.user?.id) {
      const userRes = await pool.query<{ tag_key: string }>(
        `SELECT tag_key FROM business_endorsement_taps WHERE business_id = $1 AND user_id = $2`,
        [businessId, req.user.id],
      );
      userTags = userRes.rows.map((r) => r.tag_key);
    }

    res.json({
      tags: result.rows.map((r) => ({
        tagKey: r.tag_key,
        label: r.label,
        count: r.count,
        userTapped: userTags.includes(r.tag_key),
      })),
      threshold: DISPLAY_THRESHOLD,
      userTags,
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
