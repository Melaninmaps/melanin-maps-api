import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { CULTURAL_SITES_SEED } from "../data/cultural-sites-seed";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: Request): boolean {
  const user = req.user as { email?: string } | undefined;
  return !!(user?.email && ADMIN_EMAILS.includes(user.email));
}

// ── Seed helpers ──────────────────────────────────────────────────────────────

async function ensureSeeded() {
  const countRes = await pool.query<{ count: string }>("SELECT COUNT(*) FROM cultural_sites");
  const count = parseInt(countRes.rows[0]?.count ?? "0", 10);
  if (count < CULTURAL_SITES_SEED.length) {
    await pool.query("TRUNCATE cultural_sites CASCADE");
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
    await ensureSupportLinksSeeded();
  }
}

type SupportLinkSeed = {
  siteName: string;
  title: string;
  description: string;
  url: string;
  category: string;
  displayOrder: number;
};

const SUPPORT_LINKS_SEED: SupportLinkSeed[] = [
  { siteName: "Howard University", title: "Give to Howard University", description: "Support scholarships, programs, and the university's ongoing mission of excellence.", url: "https://giving.howard.edu", category: "scholarship", displayOrder: 0 },
  { siteName: "Howard University", title: "Howard University Alumni Association", description: "Stay connected and support the Bison community.", url: "https://www.howardalumni.org", category: "alumni_fund", displayOrder: 1 },
  { siteName: "Spelman College", title: "Spelman College Fund", description: "Help Spelman women lead, inspire, and change the world.", url: "https://giving.spelman.edu", category: "scholarship", displayOrder: 0 },
  { siteName: "Morehouse College", title: "Morehouse College Annual Fund", description: "Invest in the next generation of Morehouse Men.", url: "https://giving.morehouse.edu", category: "alumni_fund", displayOrder: 0 },
  { siteName: "Hampton University", title: "Hampton University Foundation", description: "Support Hampton's legacy of excellence and service.", url: "https://www.hamptonu.edu/alumni/give.cfm", category: "giving", displayOrder: 0 },
  { siteName: "Tuskegee University", title: "Give to Tuskegee", description: "Honor Booker T. Washington's legacy through student support.", url: "https://www.tuskegee.edu/support-tu/give-to-tuskegee", category: "giving", displayOrder: 0 },
  { siteName: "Florida Agricultural and Mechanical University", title: "FAMU Alumni Association", description: "Support FAMU's 135+ years of excellence.", url: "https://www.famualumni.org/give", category: "alumni_fund", displayOrder: 0 },
  { siteName: "North Carolina Agricultural and Technical State University", title: "Give to NC A&T", description: "Support Aggie student success and innovation.", url: "https://ncat.edu/give", category: "giving", displayOrder: 0 },
  { siteName: "National Memorial for Peace and Justice", title: "Support the Equal Justice Initiative", description: "Help EJI continue its work on criminal justice reform and racial justice.", url: "https://museumandmemorial.eji.org/give", category: "preservation", displayOrder: 0 },
  { siteName: "National Memorial for Peace and Justice", title: "EJI Community Remembrance Project", description: "Support soil collection and memorial work honoring lynching victims.", url: "https://eji.org/projects/community-remembrance-project/", category: "nonprofit", displayOrder: 1 },
  { siteName: "Whitney Plantation Museum", title: "Support Whitney Plantation", description: "Help preserve America's only slavery-focused museum.", url: "https://www.whitneyplantation.org/support/", category: "preservation", displayOrder: 0 },
  { siteName: "National Civil Rights Museum", title: "Donate to the National Civil Rights Museum", description: "Keep the story of the movement alive for future generations.", url: "https://www.civilrightsmuseum.org/support-us", category: "giving", displayOrder: 0 },
  { siteName: "DuSable Black History Museum and Education Center", title: "Support DuSable Museum", description: "Fund exhibits, education, and the preservation of Black history.", url: "https://www.dusablemuseum.org/support/", category: "giving", displayOrder: 0 },
  { siteName: "National Underground Railroad Freedom Center", title: "Give to the Freedom Center", description: "Support the mission of connecting past freedoms to present-day justice.", url: "https://freedomcenter.org/support", category: "giving", displayOrder: 0 },
  { siteName: "Historically Black Colleges and Universities", title: "HBCU Scholarship Fund", description: "United Negro College Fund — supporting HBCU students nationwide.", url: "https://www.uncf.org/give", category: "scholarship", displayOrder: 0 },
  { siteName: "Martin Luther King Jr. National Historical Park", title: "Support the King Center", description: "Keep Dr. King's legacy alive through education and advocacy.", url: "https://thekingcenter.org/support/", category: "nonprofit", displayOrder: 0 },
  { siteName: "Selma to Montgomery National Historic Trail", title: "National Park Foundation — Selma", description: "Help preserve and protect the Selma to Montgomery Trail.", url: "https://www.nationalparks.org/explore/parks/selma-to-montgomery-national-historic-trail", category: "preservation", displayOrder: 0 },
  { siteName: "Anacostia Community Museum", title: "Support the Anacostia Community Museum", description: "Help tell the history of African American communities in Washington, DC.", url: "https://anacostia.si.edu/support", category: "giving", displayOrder: 0 },
];

async function ensureSupportLinksSeeded() {
  const countRes = await pool.query<{ count: string }>("SELECT COUNT(*) FROM heritage_support_links");
  const count = parseInt(countRes.rows[0]?.count ?? "0", 10);
  if (count > 0) return;

  for (const link of SUPPORT_LINKS_SEED) {
    await pool.query(
      `INSERT INTO heritage_support_links (site_id, title, description, url, category, display_order)
       SELECT cs.id, $1, $2, $3, $4, $5
       FROM cultural_sites cs WHERE cs.name = $6
       LIMIT 1`,
      [link.title, link.description, link.url, link.category, link.displayOrder, link.siteName],
    ).catch(() => { /* skip if site not found */ });
  }
}

// ── GET /cultural-sites ───────────────────────────────────────────────────────
// Public endpoint — cultural/heritage site data is not private; removing the
// auth gate restores map visibility for authenticated users whose native HTTP
// client does not automatically attach session cookies (React Native fetch).

router.get("/cultural-sites", async (req: Request, res: Response) => {
  try {
    // ensureSeeded() is NOT called here — it holds a DB connection for the entire
    // seed operation (TRUNCATE + multi-row INSERT) on every request, exhausting the
    // pool when the endpoint is called concurrently (e.g. by the health monitor).
    // Seeding is handled at startup via POST /admin/seed-cultural-sites or the
    // initial deployment migration in static-server.mjs.

    const { heritageCategory, category, site_type: siteType, search, state, city, accessible, admissionFree, limit: limitParam } =
      req.query as Record<string, string | undefined>;

    // Default 2000 — returns all seeded records in one shot.
    // Hard cap at 2000 to prevent accidental unbounded queries.
    const rowLimit = Math.min(parseInt(limitParam ?? "2000", 10) || 2000, 2000);

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
    // site_type is the canonical client-facing alias — maps to the category column
    if (siteType) {
      conditions.push(`category = $${idx++}`);
      params.push(siteType);
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
             subcategory, ethnic_community AS "ethnicCommunity",
             cultural_community AS "culturalCommunity",
             visit_tip AS "visitTip", content_note AS "contentNote",
             pin_type AS "pinType", listing_status AS "listingStatus",
             city, state, address,
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
      LIMIT ${rowLimit}
    `;

    const result = await pool.query(sql, params);
    const sites = result.rows;

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
              subcategory, ethnic_community AS "ethnicCommunity",
              cultural_community AS "culturalCommunity",
              visit_tip AS "visitTip", content_note AS "contentNote",
              pin_type AS "pinType", listing_status AS "listingStatus",
              city, state, address,
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

// ── GET /cultural-sites/:id/stories ──────────────────────────────────────────

router.get("/cultural-sites/:id/stories", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, site_id AS "siteId", author_name AS "authorName",
              relationship_type AS "relationshipType", content, video_url AS "videoUrl",
              tags, status, is_ambassador AS "isAmbassador", created_at AS "createdAt"
       FROM heritage_stories
       WHERE site_id = $1 AND status = 'approved'
       ORDER BY is_ambassador DESC, created_at DESC
       LIMIT 50`,
      [req.params.id],
    );
    res.json({ stories: result.rows, total: result.rowCount ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch heritage stories");
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

// ── POST /cultural-sites/:id/stories ─────────────────────────────────────────

router.post("/cultural-sites/:id/stories", async (req: Request, res: Response) => {
  try {
    const { relationshipType, content, authorName, videoUrl, tags } = req.body as {
      relationshipType?: string;
      content?: string;
      authorName?: string;
      videoUrl?: string;
      tags?: string[];
    };

    if (!relationshipType || !content?.trim()) {
      res.status(400).json({ error: "relationshipType and content are required" });
      return;
    }
    if (content.trim().length < 20) {
      res.status(400).json({ error: "Story must be at least 20 characters" });
      return;
    }
    if (content.trim().length > 2000) {
      res.status(400).json({ error: "Story must be under 2000 characters" });
      return;
    }

    // Verify site exists
    const siteCheck = await pool.query("SELECT id FROM cultural_sites WHERE id = $1", [req.params.id]);
    if (!siteCheck.rows[0]) { res.status(404).json({ error: "Site not found" }); return; }

    const userId = (req as Request & { user?: { id: string } }).user?.id ?? null;

    const result = await pool.query(
      `INSERT INTO heritage_stories (site_id, user_id, author_name, relationship_type, content, video_url, tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id`,
      [
        req.params.id,
        userId,
        authorName?.trim() || null,
        relationshipType,
        content.trim(),
        videoUrl?.trim() || null,
        JSON.stringify(tags ?? []),
      ],
    );

    res.status(201).json({
      ok: true,
      storyId: result.rows[0]?.id,
      message: "Your Living Story has been submitted and is pending review. Thank you for sharing your connection to this place.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit heritage story");
    res.status(500).json({ error: "Failed to submit story" });
  }
});

// ── GET /cultural-sites/:id/support-links ─────────────────────────────────────

router.get("/cultural-sites/:id/support-links", async (req: Request, res: Response) => {
  try {
    await ensureSupportLinksSeeded();
    const result = await pool.query(
      `SELECT id, site_id AS "siteId", title, description, url, category,
              is_verified AS "isVerified", display_order AS "displayOrder"
       FROM heritage_support_links
       WHERE site_id = $1
       ORDER BY display_order ASC, created_at ASC`,
      [req.params.id],
    );
    res.json({ links: result.rows, total: result.rowCount ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch support links");
    res.status(500).json({ error: "Failed to fetch support links" });
  }
});

// ── PATCH /cultural-sites/stories/:storyId/moderate (admin) ──────────────────

router.patch("/cultural-sites/stories/:storyId/moderate", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }
    const { status, isAmbassador } = req.body as { status?: string; isAmbassador?: boolean };
    if (!["approved", "rejected", "pending"].includes(status ?? "")) {
      res.status(400).json({ error: "status must be approved, rejected, or pending" });
      return;
    }
    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (status) { updates.push(`status = $${idx++}`); params.push(status); }
    if (typeof isAmbassador === "boolean") { updates.push(`is_ambassador = $${idx++}`); params.push(isAmbassador); }
    if (!updates.length) { res.status(400).json({ error: "Nothing to update" }); return; }
    params.push(req.params.storyId);
    await pool.query(
      `UPDATE heritage_stories SET ${updates.join(", ")} WHERE id = $${idx}`,
      params,
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to moderate story");
    res.status(500).json({ error: "Failed to moderate" });
  }
});

// ── GET /cultural-sites/stories/pending (admin) ───────────────────────────────

router.get("/cultural-sites/stories/pending", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }
    const result = await pool.query(
      `SELECT hs.id, hs.site_id AS "siteId", cs.name AS "siteName",
              hs.author_name AS "authorName", hs.relationship_type AS "relationshipType",
              hs.content, hs.tags, hs.status, hs.is_ambassador AS "isAmbassador",
              hs.created_at AS "createdAt"
       FROM heritage_stories hs
       JOIN cultural_sites cs ON cs.id = hs.site_id
       WHERE hs.status = 'pending'
       ORDER BY hs.created_at ASC
       LIMIT 100`,
    );
    res.json({ stories: result.rows, total: result.rowCount ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch pending stories");
    res.status(500).json({ error: "Failed to fetch pending stories" });
  }
});

// ── POST /cultural-sites/reseed (admin) ───────────────────────────────────────

router.post("/cultural-sites/reseed", async (req: Request, res: Response) => {
  try {
    await pool.query("TRUNCATE cultural_sites CASCADE");
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
    await ensureSupportLinksSeeded();
    res.json({ ok: true, seeded: CULTURAL_SITES_SEED.length });
  } catch (err) {
    req.log.error({ err }, "Reseed failed");
    res.status(500).json({ error: "Reseed failed" });
  }
});

export default router;
