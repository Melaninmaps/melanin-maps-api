import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// GET /show-love — list nominations (paginated, optional ?category=&nomineeType=&search=)
router.get("/show-love", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;
  const category = req.query.category as string | undefined;
  const nomineeType = req.query.nomineeType as string | undefined;
  const search = req.query.search as string | undefined;
  const userId = req.user?.id;

  try {
    const conditions: string[] = ["n.is_public = true"];
    const params: unknown[] = [];
    let pi = 1;

    if (category) {
      conditions.push(`n.category = $${pi++}`);
      params.push(category);
    }
    if (nomineeType) {
      conditions.push(`n.nominee_type = $${pi++}`);
      params.push(nomineeType);
    }
    if (search) {
      conditions.push(`(n.nominee_name ILIKE $${pi} OR n.reason ILIKE $${pi})`);
      params.push(`%${search}%`);
      pi++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await pool.query(
      `SELECT n.*,
        u.first_name AS nominator_first_name, u.last_name AS nominator_last_name,
        u.profile_image_url AS nominator_image,
        ${userId ? `(SELECT reaction_type FROM show_love_reactions WHERE nomination_id = n.id AND user_id = $${pi}) AS my_reaction,` : "NULL AS my_reaction,"}
        (n.show_love_count + n.support_count + n.saved_count + n.visited_count) AS total_reactions
       FROM show_love_nominations n
       LEFT JOIN users u ON u.id = n.nominator_id
       ${where}
       ORDER BY total_reactions DESC, n.created_at DESC
       LIMIT $${userId ? pi + 1 : pi} OFFSET $${userId ? pi + 2 : pi + 1}`,
      userId ? [...params, userId, limit, offset] : [...params, limit, offset]
    );

    const countRow = await pool.query(
      `SELECT count(*)::int AS total FROM show_love_nominations n ${where}`,
      params
    );

    res.json({ nominations: rows.rows, total: countRow.rows[0]?.total ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to list show love nominations");
    res.status(500).json({ error: "Failed to list nominations" });
  }
});

// GET /show-love/spotlight — monthly spotlights
router.get("/show-love/spotlight", async (_req: Request, res: Response) => {
  try {
    const month = new Date().toISOString().slice(0, 7); // "2026-07"
    const rows = await pool.query(
      `SELECT n.*, u.first_name AS nominator_first_name, u.last_name AS nominator_last_name
       FROM show_love_nominations n
       LEFT JOIN users u ON u.id = n.nominator_id
       WHERE n.spotlight_month = $1 AND n.is_public = true
       ORDER BY n.show_love_count DESC
       LIMIT 6`,
      [month]
    );
    res.json({ spotlights: rows.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch spotlight" });
  }
});

// GET /show-love/received/:userId — nominations received by a user
router.get("/show-love/received/:userId", async (req: Request, res: Response) => {
  try {
    const rows = await pool.query(
      `SELECT n.*, u.first_name AS nominator_first_name, u.last_name AS nominator_last_name,
        u.profile_image_url AS nominator_image
       FROM show_love_nominations n
       LEFT JOIN users u ON u.id = n.nominator_id
       WHERE n.nominee_user_id = $1 AND n.is_public = true
       ORDER BY n.created_at DESC
       LIMIT 20`,
      [req.params.userId]
    );
    res.json({ nominations: rows.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch received nominations" });
  }
});

// GET /show-love/:id — single nomination with all reactions
router.get("/show-love/:id", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  try {
    const rows = await pool.query(
      `SELECT n.*,
        u.first_name AS nominator_first_name, u.last_name AS nominator_last_name,
        u.profile_image_url AS nominator_image,
        ${userId ? `(SELECT reaction_type FROM show_love_reactions WHERE nomination_id = n.id AND user_id = $2) AS my_reaction` : "NULL AS my_reaction"}
       FROM show_love_nominations n
       LEFT JOIN users u ON u.id = n.nominator_id
       WHERE n.id = $1`,
      userId ? [req.params.id, userId] : [req.params.id]
    );
    if (!rows.rows[0]) { res.status(404).json({ error: "Not found" }); return; }

    // Recent nominators for social proof
    const recentRows = await pool.query(
      `SELECT r.reaction_type, u.first_name, u.last_name, u.profile_image_url
       FROM show_love_reactions r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.nomination_id = $1
       ORDER BY r.created_at DESC LIMIT 8`,
      [req.params.id]
    );

    res.json({ nomination: rows.rows[0], recentReactions: recentRows.rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch show love nomination");
    res.status(500).json({ error: "Failed to fetch nomination" });
  }
});

// POST /show-love — create a nomination
router.post("/show-love", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const {
    nomineeName, nomineeType = "person", nomineeUserId, nomineeBusinessId,
    nomineeHandle, nomineeImageUrl, category, whatKnownFor = [], reason,
    experience, city, isPublic = true,
  } = req.body as {
    nomineeName: string; nomineeType?: string; nomineeUserId?: string;
    nomineeBusinessId?: string; nomineeHandle?: string; nomineeImageUrl?: string;
    category: string; whatKnownFor?: string[]; reason: string;
    experience?: string; city?: string; isPublic?: boolean;
  };

  if (!nomineeName?.trim()) { res.status(400).json({ error: "Nominee name is required" }); return; }
  if (!category?.trim()) { res.status(400).json({ error: "Category is required" }); return; }
  if (!reason?.trim() || reason.length < 20) { res.status(400).json({ error: "Reason must be at least 20 characters" }); return; }
  if (reason.length > 500) { res.status(400).json({ error: "Reason must be under 500 characters" }); return; }

  try {
    const result = await pool.query(
      `INSERT INTO show_love_nominations
        (nominator_id, nominee_type, nominee_name, nominee_user_id, nominee_business_id,
         nominee_handle, nominee_image_url, category, what_known_for, reason, experience, city, is_public)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user.id, nomineeType, nomineeName.trim(), nomineeUserId || null,
        nomineeBusinessId || null, nomineeHandle || null, nomineeImageUrl || null,
        category, whatKnownFor, reason.trim(), experience?.trim() || null, city || null, isPublic,
      ]
    );
    res.status(201).json({ nomination: result.rows[0] });
  } catch (err) {
    req.log.error({ err }, "Failed to create show love nomination");
    res.status(500).json({ error: "Failed to create nomination" });
  }
});

// POST /show-love/:id/react — toggle reaction (show_love | support | saved | visited)
router.post("/show-love/:id/react", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const reactionType = (req.body as { reactionType?: string }).reactionType;
  if (!["show_love", "support", "saved", "visited"].includes(reactionType ?? "")) {
    res.status(400).json({ error: "Invalid reaction type" });
    return;
  }

  const nominationId = Number(req.params.id);
  try {
    // Check for existing reaction
    const existing = await pool.query(
      `SELECT id, reaction_type FROM show_love_reactions WHERE nomination_id = $1 AND user_id = $2`,
      [nominationId, req.user.id]
    );

    const colMap: Record<string, string> = {
      show_love: "show_love_count",
      support: "support_count",
      saved: "saved_count",
      visited: "visited_count",
    };

    if (existing.rows[0]) {
      const prev = existing.rows[0].reaction_type as string;
      if (prev === reactionType) {
        // Remove reaction
        await pool.query(`DELETE FROM show_love_reactions WHERE id = $1`, [existing.rows[0].id]);
        await pool.query(
          `UPDATE show_love_nominations SET ${colMap[prev]} = GREATEST(0, ${colMap[prev]} - 1) WHERE id = $1`,
          [nominationId]
        );
        res.json({ ok: true, action: "removed", reactionType: null });
      } else {
        // Switch reaction
        await pool.query(`UPDATE show_love_reactions SET reaction_type = $1 WHERE id = $2`, [reactionType, existing.rows[0].id]);
        await pool.query(
          `UPDATE show_love_nominations SET ${colMap[prev]} = GREATEST(0, ${colMap[prev]} - 1), ${colMap[reactionType!]} = ${colMap[reactionType!]} + 1 WHERE id = $1`,
          [nominationId]
        );
        res.json({ ok: true, action: "switched", reactionType });
      }
    } else {
      // Add new reaction
      await pool.query(
        `INSERT INTO show_love_reactions (nomination_id, user_id, reaction_type) VALUES ($1,$2,$3)`,
        [nominationId, req.user.id, reactionType]
      );
      await pool.query(
        `UPDATE show_love_nominations SET ${colMap[reactionType!]} = ${colMap[reactionType!]} + 1 WHERE id = $1`,
        [nominationId]
      );
      res.json({ ok: true, action: "added", reactionType });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to react to show love nomination");
    res.status(500).json({ error: "Failed to react" });
  }
});

// DELETE /show-love/:id — delete own nomination
router.delete("/show-love/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const result = await pool.query(
      `DELETE FROM show_love_nominations WHERE id = $1 AND nominator_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) { res.status(404).json({ error: "Not found or not your nomination" }); return; }
    await pool.query(`DELETE FROM show_love_reactions WHERE nomination_id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete show love nomination");
    res.status(500).json({ error: "Failed to delete nomination" });
  }
});

export default router;
