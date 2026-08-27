/**
 * Age Assurance Routes
 *
 * GET  /api/age-assurance  — return member's current band (never DOB)
 * PUT  /api/age-assurance  — self-attest a band (13_15 / 16_17 / 18_plus)
 *
 * Design rules:
 * - Never accept or return users.date_of_birth.
 * - Never accept under_13 from the standard member flow.
 * - Kinfolk/Library receive only the derived audienceBand, not this raw record.
 */

import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

const permittedBands = new Set(["13_15", "16_17", "18_plus"]);

router.get("/age-assurance", async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: "Authentication required" });
  const userId = req.user.id;
  try {
    const r = await pool.query(
      `SELECT age_band, assurance_method, policy_version, assured_at
         FROM user_age_assurance WHERE user_id = $1`,
      [userId],
    );
    const row = r.rows[0] ?? {
      age_band: "unknown",
      assurance_method: "unconfirmed",
      policy_version: "age-assurance-v1",
      assured_at: null,
    };
    // Intentionally never return users.date_of_birth.
    return res.json({
      ageBand: row.age_band,
      assuranceMethod: row.assurance_method,
      policyVersion: row.policy_version,
      assuredAt: row.assured_at,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    return res.status(500).json({ error: "Failed to load age assurance", detail: msg });
  }
});

router.put("/age-assurance", async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: "Authentication required" });
  const userId = req.user.id;
  const { ageBand, attested } = req.body ?? {};

  if (!permittedBands.has(ageBand) || attested !== true) {
    return res.status(400).json({
      error: "Select a valid age range (13–15, 16–17, or 18+) and confirm it is accurate.",
    });
  }

  try {
    await pool.query(
      `INSERT INTO user_age_assurance
         (user_id, age_band, assurance_method, policy_version, assured_at)
       VALUES ($1, $2, 'self_attested_band', 'age-assurance-v1', now())
       ON CONFLICT (user_id) DO UPDATE SET
         age_band = EXCLUDED.age_band,
         assurance_method = EXCLUDED.assurance_method,
         policy_version = EXCLUDED.policy_version,
         assured_at = EXCLUDED.assured_at,
         updated_at = now()`,
      [userId, ageBand],
    );
    return res.json({ ok: true, ageBand });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    return res.status(500).json({ error: "Failed to save age assurance", detail: msg });
  }
});

export default router;
