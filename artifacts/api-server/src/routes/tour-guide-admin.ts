/**
 * Admin routes for Tour Guide Businesses
 * All routes require admin authentication via isAdmin(req).
 *
 * GET  /admin/tour-guide              — list all tour guide businesses (filterable)
 * GET  /admin/tour-guide/hidden       — list only hidden (launch_enabled=false) businesses
 * GET  /admin/tour-guide/cities       — city summary with total/visible/hidden counts
 * PATCH /admin/tour-guide/:id/toggle  — toggle launch_enabled for a single business
 * PATCH /admin/tour-guide/:id         — set launch_enabled explicitly for a single business
 * PATCH /admin/tour-guide/community/enable  — enable all businesses matching a diaspora keyword
 * PATCH /admin/tour-guide/community/disable — disable all businesses matching a diaspora keyword
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";

const router: IRouter = Router();

// List all tour guide businesses (with optional filters)
router.get("/admin/tour-guide", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { city, state, launch_enabled, city_type } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (city) { conditions.push(`city ILIKE $${idx++}`); params.push(`%${city}%`); }
    if (state) { conditions.push(`state ILIKE $${idx++}`); params.push(`%${state}%`); }
    if (launch_enabled !== undefined) {
      conditions.push(`launch_enabled = $${idx++}`);
      params.push(launch_enabled === "true");
    }
    if (city_type) { conditions.push(`city_type = $${idx++}`); params.push(String(city_type)); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT * FROM tour_guide_businesses ${where} ORDER BY state, city, name`,
      params
    );

    res.json({ businesses: result.rows, count: result.rowCount });
  } catch (err) {
    console.error("[tour-guide-admin] list error:", err);
    res.status(500).json({ error: "Failed to load tour guide businesses" });
  }
});

// List only hidden businesses
router.get("/admin/tour-guide/hidden", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const result = await pool.query(
      `SELECT * FROM tour_guide_businesses WHERE launch_enabled = false ORDER BY state, city, name`
    );
    res.json({ businesses: result.rows, count: result.rowCount });
  } catch (err) {
    console.error("[tour-guide-admin] hidden error:", err);
    res.status(500).json({ error: "Failed to load hidden businesses" });
  }
});

// City summary with counts
router.get("/admin/tour-guide/cities", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const result = await pool.query(`
      SELECT
        city, state, city_type, parent_hub_city,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE launch_enabled = true)::int AS visible,
        COUNT(*) FILTER (WHERE launch_enabled = false)::int AS hidden
      FROM tour_guide_businesses
      GROUP BY city, state, city_type, parent_hub_city
      ORDER BY state, city
    `);
    res.json({ cities: result.rows });
  } catch (err) {
    console.error("[tour-guide-admin] cities error:", err);
    res.status(500).json({ error: "Failed to load city summary" });
  }
});

// Enable all businesses matching a diaspora community keyword
// Must come before /:id routes to avoid "enable"/"disable" being treated as IDs
router.patch("/admin/tour-guide/community/enable", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { keyword } = req.body as { keyword?: string };
    if (!keyword) { res.status(400).json({ error: "keyword is required" }); return; }
    const result = await pool.query(
      `UPDATE tour_guide_businesses
       SET launch_enabled = true
       WHERE diaspora_community ILIKE $1
       RETURNING id, name, diaspora_community, city, state`,
      [`%${keyword}%`]
    );
    res.json({
      updated: result.rowCount,
      businesses: result.rows,
      message: `Enabled ${result.rowCount} businesses matching "${keyword}"`,
    });
  } catch (err) {
    console.error("[tour-guide-admin] community enable error:", err);
    res.status(500).json({ error: "Failed to enable community" });
  }
});

// Disable all businesses matching a diaspora community keyword
router.patch("/admin/tour-guide/community/disable", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { keyword } = req.body as { keyword?: string };
    if (!keyword) { res.status(400).json({ error: "keyword is required" }); return; }
    const result = await pool.query(
      `UPDATE tour_guide_businesses
       SET launch_enabled = false
       WHERE diaspora_community ILIKE $1
       RETURNING id, name, diaspora_community, city, state`,
      [`%${keyword}%`]
    );
    res.json({
      updated: result.rowCount,
      businesses: result.rows,
      message: `Hidden ${result.rowCount} businesses matching "${keyword}"`,
    });
  } catch (err) {
    console.error("[tour-guide-admin] community disable error:", err);
    res.status(500).json({ error: "Failed to disable community" });
  }
});

// Toggle launch_enabled for a single business
router.patch("/admin/tour-guide/:id/toggle", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE tour_guide_businesses
       SET launch_enabled = NOT launch_enabled
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) { res.status(404).json({ error: "Business not found" }); return; }
    const biz = result.rows[0];
    res.json({
      business: biz,
      message: `${biz.name} is now ${biz.launch_enabled ? "visible" : "hidden"}`,
    });
  } catch (err) {
    console.error("[tour-guide-admin] toggle error:", err);
    res.status(500).json({ error: "Failed to toggle business" });
  }
});

// Explicitly set launch_enabled for a single business
router.patch("/admin/tour-guide/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { id } = req.params;
    const { launch_enabled } = req.body as { launch_enabled?: boolean };
    if (typeof launch_enabled !== "boolean") {
      res.status(400).json({ error: "launch_enabled must be a boolean" }); return;
    }
    const result = await pool.query(
      `UPDATE tour_guide_businesses SET launch_enabled = $1 WHERE id = $2 RETURNING *`,
      [launch_enabled, id]
    );
    if (result.rowCount === 0) { res.status(404).json({ error: "Business not found" }); return; }
    res.json({ business: result.rows[0] });
  } catch (err) {
    console.error("[tour-guide-admin] update error:", err);
    res.status(500).json({ error: "Failed to update business" });
  }
});

export default router;
