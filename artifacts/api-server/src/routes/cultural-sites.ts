import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { CULTURAL_SITES_SEED } from "../data/cultural-sites-seed";

const router: IRouter = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensureSeeded() {
  const countRes = await pool.query<{ count: string }>("SELECT COUNT(*) FROM cultural_sites");
  const count = parseInt(countRes.rows[0]?.count ?? "0", 10);
  if (count < CULTURAL_SITES_SEED.length) {
    await pool.query("TRUNCATE cultural_sites");
    const cols = [
      "name", "description", "category", "heritage_category", "subcategory",
      "ethnic_community", "city", "state", "address", "latitude", "longitude",
      "era", "significance", "external_url", "year_established",
      "is_accessible", "is_family_friendly", "admission_free", "audio_guide",
      "verified_source", "is_verified",
    ];
    const placeholders = CULTURAL_SITES_SEED.map(
      (_, i) => `(${cols.map((_, j) => `$${i * cols.length + j + 1}`).join(", ")})`,
    ).join(", ");
    const values: unknown[] = [];
    for (const s of CULTURAL_SITES_SEED) {
      values.push(
        s.name, s.description, s.category, s.heritageCategory, s.subcategory ?? null,
        s.ethnicCommunity ?? null, s.city, s.state, s.address ?? null,
        s.latitude, s.longitude, s.era ?? null, s.significance ?? null,
        s.externalUrl ?? null, s.yearEstablished ?? null,
        s.isAccessible ?? false, s.isFamilyFriendly ?? true,
        s.admissionFree ?? true, s.audioGuide ?? false,
        s.verifiedSource ?? null, true,
      );
    }
    await pool.query(
      `INSERT INTO cultural_sites (${cols.join(", ")}) VALUES ${placeholders}`,
      values,
    );
  }
}

// ── GET /cultural-sites ───────────────────────────────────────────────────────

router.get("/cultural-sites", async (req: Request, res: Response) => {
  try {
    await ensureSeeded();

    const { heritageCategory, category, search, state, city, accessible, admissionFree } =
      req.query as Record<string, string | undefined>;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (heritageCategory) {
      conditions.push(`heritage_category = $${idx++}`);
      params.push(heritageCategory);
    }
    if (category) {
      conditions.push(`category = $${idx++}`);
      params.push(category);
    }
    if (state) {
      conditions.push(`state = $${idx++}`);
      params.push(state);
    }
    if (city) {
      conditions.push(`city ILIKE $${idx++}`);
      params.push(`%${city}%`);
    }
    if (accessible === "true") {
      conditions.push(`is_accessible = true`);
    }
    if (admissionFree === "true") {
      conditions.push(`admission_free = true`);
    }
    if (search) {
      conditions.push(
        `(name ILIKE $${idx} OR description ILIKE $${idx} OR city ILIKE $${idx} OR significance ILIKE $${idx})`,
      );
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT id, name, description, category, heritage_category AS "heritageCategory",
             subcategory, ethnic_community AS "ethnicCommunity", city, state, address,
             latitude, longitude, era, significance, image_url AS "imageUrl",
             external_url AS "externalUrl", is_verified AS "isVerified",
             year_established AS "yearEstablished", is_accessible AS "isAccessible",
             is_family_friendly AS "isFamilyFriendly", admission_free AS "admissionFree",
             audio_guide AS "audioGuide", verified_source AS "verifiedSource",
             country, created_at AS "createdAt"
      FROM cultural_sites
      ${where}
      ORDER BY
        CASE heritage_category
          WHEN 'HBCU' THEN 1
          WHEN 'African American Heritage' THEN 2
          WHEN 'Civil Rights' THEN 3
          WHEN 'Native American Heritage' THEN 4
          WHEN 'Hispanic & Latino Heritage' THEN 5
          WHEN 'LGBTQ+ History' THEN 6
          WHEN 'Women''s History' THEN 7
          WHEN 'Cultural Neighborhood' THEN 8
          ELSE 9
        END,
        name ASC
      LIMIT 500
    `;

    const result = await pool.query(sql, params);
    const sites = result.rows;

    // Heritage category summary
    const categorySummary = await pool.query<{ heritage_category: string; count: string }>(
      `SELECT heritage_category, COUNT(*) AS count FROM cultural_sites GROUP BY heritage_category ORDER BY count DESC`,
    );

    res.json({
      sites,
      total: sites.length,
      categories: categorySummary.rows.map((r) => ({
        label: r.heritage_category,
        count: parseInt(r.count, 10),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch cultural sites");
    res.status(500).json({ error: "Failed to fetch cultural sites" });
  }
});

// ── GET /cultural-sites/:id ───────────────────────────────────────────────────

router.get("/cultural-sites/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, category, heritage_category AS "heritageCategory",
              subcategory, ethnic_community AS "ethnicCommunity", city, state, address,
              latitude, longitude, era, significance, image_url AS "imageUrl",
              external_url AS "externalUrl", is_verified AS "isVerified",
              year_established AS "yearEstablished", is_accessible AS "isAccessible",
              is_family_friendly AS "isFamilyFriendly", admission_free AS "admissionFree",
              audio_guide AS "audioGuide", verified_source AS "verifiedSource",
              country, created_at AS "createdAt"
       FROM cultural_sites WHERE id = $1`,
      [req.params.id],
    );
    if (!result.rows[0]) { res.status(404).json({ error: "Site not found" }); return; }
    res.json({ site: result.rows[0] });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch cultural site");
    res.status(500).json({ error: "Failed to fetch site" });
  }
});

// ── POST /cultural-sites/reseed (admin) ───────────────────────────────────────

router.post("/cultural-sites/reseed", async (req: Request, res: Response) => {
  try {
    await pool.query("TRUNCATE cultural_sites");
    const cols = [
      "name", "description", "category", "heritage_category", "subcategory",
      "ethnic_community", "city", "state", "address", "latitude", "longitude",
      "era", "significance", "external_url", "year_established",
      "is_accessible", "is_family_friendly", "admission_free", "audio_guide",
      "verified_source", "is_verified",
    ];
    const placeholders = CULTURAL_SITES_SEED.map(
      (_, i) => `(${cols.map((_, j) => `$${i * cols.length + j + 1}`).join(", ")})`,
    ).join(", ");
    const values: unknown[] = [];
    for (const s of CULTURAL_SITES_SEED) {
      values.push(
        s.name, s.description, s.category, s.heritageCategory, s.subcategory ?? null,
        s.ethnicCommunity ?? null, s.city, s.state, s.address ?? null,
        s.latitude, s.longitude, s.era ?? null, s.significance ?? null,
        s.externalUrl ?? null, s.yearEstablished ?? null,
        s.isAccessible ?? false, s.isFamilyFriendly ?? true,
        s.admissionFree ?? true, s.audioGuide ?? false,
        s.verifiedSource ?? null, true,
      );
    }
    await pool.query(
      `INSERT INTO cultural_sites (${cols.join(", ")}) VALUES ${placeholders}`,
      values,
    );
    res.json({ ok: true, seeded: CULTURAL_SITES_SEED.length });
  } catch (err) {
    req.log.error({ err }, "Reseed failed");
    res.status(500).json({ error: "Reseed failed" });
  }
});

export default router;
