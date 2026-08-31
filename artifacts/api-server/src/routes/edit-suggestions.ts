/**
 * Edit Suggestions — lets any logged-in user suggest an edit to any entity.
 * Admin reviews and approves/rejects before anything goes live.
 *
 * POST   /edit-suggestions                     — submit a suggestion (auth required)
 * GET    /edit-suggestions/admin               — admin review queue
 * GET    /edit-suggestions/admin/:id           — single suggestion
 * PATCH  /edit-suggestions/admin/:id           — approve or reject
 * GET    /edit-suggestions/my                  — user's own submitted suggestions
 */
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";

const router = Router();
const routeParam = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] ?? "" : value;

// ── Submit a suggestion ───────────────────────────────────────────────────────
router.post("/edit-suggestions", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const {
      entityType,   // 'business' | 'community_org' | 'recurring_event' | 'cultural_site' | 'city_profile'
      entityId,
      entityName,   // human-readable label for display
      fieldName,    // which field is being suggested (e.g. 'address', 'phone', 'hours')
      currentValue, // what's there now (string, may be null)
      suggestedValue, // what the user thinks it should be
      reason,       // optional: why they're suggesting this
    } = req.body;

    if (!entityType || !entityId || !fieldName || suggestedValue === undefined) {
      return res.status(400).json({ error: "entityType, entityId, fieldName, and suggestedValue are required" });
    }

    const validTypes = ["business", "community_org", "recurring_event", "cultural_site", "city_profile"];
    if (!validTypes.includes(entityType)) {
      return res.status(400).json({ error: `entityType must be one of: ${validTypes.join(", ")}` });
    }

    // Prevent duplicate pending suggestions for the same user + entity + field
    const dup = await pool.query(
      `SELECT id FROM edit_suggestions
       WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3
         AND field_name = $4 AND status = 'pending'`,
      [userId, entityType, String(entityId), fieldName]
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({
        error: "You already have a pending suggestion for this field. Wait for it to be reviewed.",
        existing_id: dup.rows[0].id,
      });
    }

    const r = await pool.query(
      `INSERT INTO edit_suggestions
         (entity_type, entity_id, entity_name, field_name, current_value, suggested_value, reason, user_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
       RETURNING id, entity_type, entity_id, entity_name, field_name, status, created_at`,
      [entityType, String(entityId), entityName || null, fieldName, currentValue || null, String(suggestedValue), reason || null, userId]
    );

    // Mark the parent entity as having a pending edit
    const tableMap: Record<string, string | null> = {
      business: "businesses",
      community_org: "community_organizations",
      recurring_event: "recurring_events",
      cultural_site: "cultural_sites",
      city_profile: "city_profiles",
    };
    const table = tableMap[entityType];
    if (table) {
      const idCol = entityType === "city_profile" ? "city_slug" : "id";
      try {
        await pool.query(
          `UPDATE ${table} SET has_pending_edit = true WHERE ${idCol} = $1`,
          [String(entityId)]
        );
      } catch { /* ignore if column doesn't exist */ }
    }

    return res.status(201).json({
      message: "Thank you — your suggestion has been submitted for review. We'll apply it after verification.",
      suggestion: r.rows[0],
    });
  } catch (err) {
    req.log?.error({ err }, "POST /edit-suggestions failed");
    return res.status(500).json({ error: "Failed to submit suggestion" });
  }
});

// ── User's own suggestions ────────────────────────────────────────────────────
router.get("/edit-suggestions/my", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    const { limit = "20", offset = "0" } = req.query as Record<string, string>;

    const r = await pool.query(
      `SELECT id, entity_type, entity_id, entity_name, field_name,
              current_value, suggested_value, reason, status, admin_notes,
              reviewed_at, created_at
       FROM edit_suggestions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    return res.json({ suggestions: r.rows });
  } catch (err) {
    req.log?.error({ err }, "GET /edit-suggestions/my failed");
    return res.status(500).json({ error: "Failed to fetch your suggestions" });
  }
});

// ── Admin: list all suggestions ───────────────────────────────────────────────
router.get("/edit-suggestions/admin", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const {
      status = "pending",
      entity_type,
      limit = "50",
      offset = "0",
    } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (status !== "all") { conditions.push(`es.status = $${i++}`); params.push(status); }
    if (entity_type) { conditions.push(`es.entity_type = $${i++}`); params.push(entity_type); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows, countRow] = await Promise.all([
      pool.query(
        `SELECT es.id, es.entity_type, es.entity_id, es.entity_name,
                es.field_name, es.current_value, es.suggested_value,
                es.reason, es.status, es.admin_notes, es.reviewed_by,
                es.reviewed_at, es.created_at,
                u.username AS submitted_by_username,
                u.email AS submitted_by_email
         FROM edit_suggestions es
         LEFT JOIN users u ON u.id = es.user_id
         ${where}
         ORDER BY es.created_at DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, parseInt(limit), parseInt(offset)]
      ),
      pool.query(
        `SELECT COUNT(*) FROM edit_suggestions es ${where}`,
        params
      ),
    ]);

    return res.json({
      suggestions: rows.rows,
      total: parseInt(countRow.rows[0].count),
      pending_count: parseInt(
        (await pool.query(`SELECT COUNT(*) FROM edit_suggestions WHERE status = 'pending'`)).rows[0].count
      ),
    });
  } catch (err) {
    req.log?.error({ err }, "GET /edit-suggestions/admin failed");
    return res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// ── Admin: get single suggestion ──────────────────────────────────────────────
router.get("/edit-suggestions/admin/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const r = await pool.query(
      `SELECT es.*, u.username, u.email
       FROM edit_suggestions es
       LEFT JOIN users u ON u.id = es.user_id
       WHERE es.id = $1`,
      [parseInt(routeParam(req.params.id))]
    );
    if (!r.rows[0]) return res.status(404).json({ error: "Suggestion not found" });
    return res.json(r.rows[0]);
  } catch (err) {
    req.log?.error({ err }, "GET /edit-suggestions/admin/:id failed");
    return res.status(500).json({ error: "Failed to fetch suggestion" });
  }
});

// ── Admin: approve or reject ──────────────────────────────────────────────────
router.patch("/edit-suggestions/admin/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const { action, admin_notes } = req.body; // action: 'approve' | 'reject'
    const adminUserId = req.user?.id;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    }

    // Fetch the suggestion
    const s = await pool.query(
      `SELECT * FROM edit_suggestions WHERE id = $1`,
      [parseInt(routeParam(req.params.id))]
    );
    if (!s.rows[0]) return res.status(404).json({ error: "Suggestion not found" });
    if (s.rows[0].status !== "pending") {
      return res.status(409).json({ error: `Suggestion is already ${s.rows[0].status}` });
    }

    const suggestion = s.rows[0];

    // If approving, apply the change to the target entity
    if (action === "approve") {
      const tableMap: Record<string, { table: string; idCol: string }> = {
        business:       { table: "businesses",            idCol: "id" },
        community_org:  { table: "community_organizations", idCol: "id" },
        recurring_event:{ table: "recurring_events",      idCol: "id" },
        cultural_site:  { table: "cultural_sites",        idCol: "id" },
        city_profile:   { table: "city_profiles",         idCol: "city_slug" },
      };
      const target = tableMap[suggestion.entity_type];
      if (target) {
        // Build safe column update — only allow known field names to prevent SQL injection
        const ALLOWED_FIELDS: Record<string, string[]> = {
          business: ["name", "address", "city", "state", "phone", "website", "instagram", "facebook", "description", "hours", "latitude", "longitude"],
          community_org: ["name", "mission", "address", "phone", "website", "instagram", "facebook"],
          recurring_event: ["name", "venue", "address", "description", "day_of_week", "start_time", "end_time", "frequency"],
          cultural_site: ["name", "address", "description", "website", "phone"],
          city_profile: ["brief_context", "historical_context", "why_mwm_here"],
        };
        const allowed = ALLOWED_FIELDS[suggestion.entity_type] || [];
        if (!allowed.includes(suggestion.field_name)) {
          return res.status(400).json({ error: `Field '${suggestion.field_name}' is not editable for ${suggestion.entity_type}` });
        }
        try {
          await pool.query(
            `UPDATE ${target.table}
             SET ${suggestion.field_name} = $1,
                 has_pending_edit = false,
                 updated_at = NOW()
             WHERE ${target.idCol} = $2`,
            [suggestion.suggested_value, suggestion.entity_id]
          );
        } catch (applyErr) {
          req.log?.error({ applyErr }, "Failed to apply approved edit");
          return res.status(500).json({ error: "Failed to apply the change to the entity" });
        }
      }
    } else {
      // On reject, clear has_pending_edit if no other pending suggestions exist
      const otherPending = await pool.query(
        `SELECT COUNT(*) FROM edit_suggestions
         WHERE entity_type = $1 AND entity_id = $2 AND status = 'pending' AND id != $3`,
        [suggestion.entity_type, suggestion.entity_id, suggestion.id]
      );
      if (parseInt(otherPending.rows[0].count) === 0) {
        const tableMap: Record<string, { table: string; idCol: string }> = {
          business:       { table: "businesses",            idCol: "id" },
          community_org:  { table: "community_organizations", idCol: "id" },
          recurring_event:{ table: "recurring_events",      idCol: "id" },
          cultural_site:  { table: "cultural_sites",        idCol: "id" },
          city_profile:   { table: "city_profiles",         idCol: "city_slug" },
        };
        const target = tableMap[suggestion.entity_type];
        if (target) {
          try {
            await pool.query(
              `UPDATE ${target.table} SET has_pending_edit = false WHERE ${target.idCol} = $1`,
              [suggestion.entity_id]
            );
          } catch { /* ignore */ }
        }
      }
    }

    // Update suggestion record
    await pool.query(
      `UPDATE edit_suggestions
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4`,
      [action === "approve" ? "approved" : "rejected", admin_notes || null, adminUserId, suggestion.id]
    );

    return res.json({
      message: action === "approve" ? "Suggestion approved and change applied." : "Suggestion rejected.",
      id: suggestion.id,
      action,
    });
  } catch (err) {
    req.log?.error({ err }, "PATCH /edit-suggestions/admin/:id failed");
    return res.status(500).json({ error: "Failed to process suggestion" });
  }
});

export default router;
