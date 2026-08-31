/**
 * Library Suggest Route
 *
 * POST /api/library/suggest
 *   Authenticated members can request that a topic be added to the Community Library.
 *   Creates or updates a library_growth_candidates row with proposed_status = 'proposed'.
 *   Admins review via the existing Library Growth workflow.
 *
 * This is the user-facing confirmation of an implicit demand signal — the growth signal
 * was already captured fire-and-forget; this endpoint adds explicit member intent.
 */

import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

const MAX_SUBJECT_LENGTH = 100;
const VALID_CATEGORIES = new Set([
  "health", "legal", "financial", "culture", "education",
  "safety", "travel", "community", "history", "wellness", "general",
]);

router.post("/library/suggest", async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: "Authentication required" });
  const userId = req.user.id;

  const { subject, category, parentTopicHint } = req.body ?? {};
  if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
    return res.status(400).json({ error: "A topic subject is required (3+ characters)." });
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return res.status(400).json({ error: `Topic subject must be under ${MAX_SUBJECT_LENGTH} characters.` });
  }
  const safeCategory = VALID_CATEGORIES.has(category) ? category : "general";
  const canonicalSubject = subject.trim();
  const canonicalSubjectKey = canonicalSubject
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);

  try {
    // Upsert — one candidate per subject key
    const r = await pool.query<{ id: string; proposed_count: number; proposed_status: string }>(
      `INSERT INTO library_growth_candidates
         (canonical_subject, canonical_subject_key, category, desired_node_type,
          proposed_status, proposed_count, proposed_by_user_ids, parent_topic_hint)
       VALUES ($1, $2, $3, 'article', 'proposed', 1, ARRAY[$4]::text[], $5)
       ON CONFLICT (canonical_subject_key) DO UPDATE SET
         proposed_count = library_growth_candidates.proposed_count + 1,
         proposed_by_user_ids = array_append(
           library_growth_candidates.proposed_by_user_ids, $4::text
         ),
         proposed_status = CASE
           WHEN library_growth_candidates.proposed_status IN ('materialized','rejected')
             THEN library_growth_candidates.proposed_status
           ELSE 'proposed'
         END,
         updated_at = now()
       RETURNING id, proposed_count, proposed_status`,
      [canonicalSubject, canonicalSubjectKey, safeCategory, userId, parentTopicHint ?? null],
    );

    const row = r.rows[0];
    if (!row) throw new Error("No row returned from upsert");

    return res.json({
      ok: true,
      candidateId: row.id,
      subject: canonicalSubject,
      category: safeCategory,
      proposedCount: row.proposed_count,
      alreadyMaterialized: row.proposed_status === "materialized",
      message:
        row.proposed_status === "materialized"
          ? "Great news — this topic already exists in the Library."
          : row.proposed_count > 1
          ? `Thanks for confirming. This topic has been requested ${row.proposed_count} times — it's moving up the list.`
          : "Thank you. Your suggestion has been added to the Library review queue.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    return res.status(500).json({ error: "Failed to record Library suggestion", detail: msg });
  }
});

export default router;
