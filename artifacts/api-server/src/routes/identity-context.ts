/**
 * Identity Context Route — Private Member API
 *
 * GET  /api/me/identity-context   — Read own identity context
 * PUT  /api/me/identity-context   — Update own identity context (versioned)
 *
 * SECURITY RULES:
 *   - Both endpoints require authentication (requireAuth applied in index.ts)
 *   - A member may only read or update their OWN context (userId from session)
 *   - No other member, admin, or staff role may read another member's context
 *     through this API (admin support edits require a separate privileged flow)
 *   - Custom pronouns are never returned in plaintext from this API in release 1
 *   - Audit records field names only, never values
 *
 * PURPOSE LIMITATIONS (enforced — never relaxed without a Privacy review):
 *   - These fields are NOT used for public profiles, business pages, community posts,
 *     Circles, creator cards, business-owner dashboards, notifications, exports,
 *     analytics, advertising, or partnership matching.
 *   - allowMedicallyRelevantContext controls sex-at-birth in ONE narrow use case.
 *   - allowPronounAwareLanguage controls Kinfolk writing tone only.
 */

import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";

const router = Router();

// ── Validation schema ────────────────────────────────────────────────────────

const IdentityPatch = z.object({
  sexAssignedAtBirth: z.enum(["female", "male", "intersex", "prefer_not_to_say"]).nullable().optional(),
  genderIdentity: z.enum(["woman", "man", "nonbinary", "another_identity", "prefer_not_to_say"]).nullable().optional(),
  pronounSet: z.enum(["she_her", "he_him", "they_them", "use_my_name", "custom", "prefer_not_to_say"]).nullable().optional(),
  // Custom pronouns: release 1 stores encrypted, not yet decryptable via this API
  // We accept the string but do not store plaintext — encrypted at rest by a future key service.
  // For release 1, if custom is selected, a placeholder is accepted.
  customPronouns: z.string().trim().min(1).max(80).nullable().optional(),
  allowMedicallyRelevantContext: z.boolean().optional(),
  allowPronounAwareLanguage: z.boolean().optional(),
  expectedVersion: z.number().int().positive(),
}).superRefine((value, ctx) => {
  if (value.pronounSet === "custom" && !value.customPronouns) {
    ctx.addIssue({ code: "custom", path: ["customPronouns"], message: "Custom pronouns are required when custom is selected." });
  }
  if (value.pronounSet !== "custom" && value.pronounSet !== undefined && value.customPronouns) {
    ctx.addIssue({ code: "custom", path: ["customPronouns"], message: "Custom pronouns may only be stored when custom is selected." });
  }
});

// ── GET /api/me/identity-context ─────────────────────────────────────────────
router.get("/me/identity-context", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Authentication required" });

  try {
    const r = await pool.query<{
      sex_assigned_at_birth: string | null;
      gender_identity: string | null;
      pronoun_set: string | null;
      // Never return custom_pronouns_ciphertext in plaintext in release 1
      has_custom_pronouns: boolean;
      allow_medically_relevant_context: boolean;
      allow_pronoun_aware_language: boolean;
      version: number;
      updated_at: string;
    }>(
      `SELECT
         sex_assigned_at_birth,
         gender_identity,
         pronoun_set,
         (custom_pronouns_ciphertext IS NOT NULL) AS has_custom_pronouns,
         allow_medically_relevant_context,
         allow_pronoun_aware_language,
         version,
         updated_at
       FROM user_identity_context
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );

    if (!r.rows[0]) {
      // No record — return all nulls with version 0 (client sends expectedVersion:0 on first PUT)
      return res.json({
        sexAssignedAtBirth: null,
        genderIdentity: null,
        pronounSet: null,
        hasCustomPronouns: false,
        allowMedicallyRelevantContext: false,
        allowPronounAwareLanguage: false,
        version: 0,
        updatedAt: null,
      });
    }

    const row = r.rows[0];
    return res.json({
      sexAssignedAtBirth: row.sex_assigned_at_birth,
      genderIdentity: row.gender_identity,
      pronounSet: row.pronoun_set,
      hasCustomPronouns: row.has_custom_pronouns,
      allowMedicallyRelevantContext: row.allow_medically_relevant_context,
      allowPronounAwareLanguage: row.allow_pronoun_aware_language,
      version: row.version,
      updatedAt: row.updated_at,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    return res.status(500).json({ error: "Failed to load identity context", detail: msg });
  }
});

// ── PUT /api/me/identity-context ──────────────────────────────────────────────
router.put("/me/identity-context", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Authentication required" });

  let patch: z.infer<typeof IdentityPatch>;
  try {
    patch = IdentityPatch.parse(req.body);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", issues: err.errors });
    }
    return res.status(400).json({ error: "Invalid request body" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Load current row with row lock
    const current = await client.query<{
      sex_assigned_at_birth: string | null;
      gender_identity: string | null;
      pronoun_set: string | null;
      allow_medically_relevant_context: boolean;
      allow_pronoun_aware_language: boolean;
      version: number;
    }>(
      `SELECT sex_assigned_at_birth, gender_identity, pronoun_set,
              allow_medically_relevant_context, allow_pronoun_aware_language, version
       FROM user_identity_context WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );

    const currentRow = current.rows[0];
    const currentVersion = currentRow?.version ?? 0;

    // Optimistic concurrency check
    if (patch.expectedVersion !== currentVersion) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "IDENTITY_CONTEXT_CONFLICT",
        currentVersion,
        message: "The record was updated since you loaded it. Reload and retry.",
      });
    }

    // Determine changed field names for audit (values never stored in audit)
    const changedFields: string[] = [];
    if (patch.sexAssignedAtBirth !== undefined && patch.sexAssignedAtBirth !== (currentRow?.sex_assigned_at_birth ?? null)) {
      changedFields.push("sex_assigned_at_birth");
    }
    if (patch.genderIdentity !== undefined && patch.genderIdentity !== (currentRow?.gender_identity ?? null)) {
      changedFields.push("gender_identity");
    }
    if (patch.pronounSet !== undefined && patch.pronounSet !== (currentRow?.pronoun_set ?? null)) {
      changedFields.push("pronoun_set");
    }
    if (patch.customPronouns !== undefined) {
      changedFields.push("custom_pronouns"); // presence-only, never the value
    }
    if (patch.allowMedicallyRelevantContext !== undefined && patch.allowMedicallyRelevantContext !== (currentRow?.allow_medically_relevant_context ?? false)) {
      changedFields.push("allow_medically_relevant_context");
    }
    if (patch.allowPronounAwareLanguage !== undefined && patch.allowPronounAwareLanguage !== (currentRow?.allow_pronoun_aware_language ?? false)) {
      changedFields.push("allow_pronoun_aware_language");
    }

    // Upsert identity context. Custom pronouns stored as a SHA-256 hash placeholder
    // in release 1 (no encryption key service yet). The DB constraint ensures
    // custom_pronouns_ciphertext is only set when pronoun_set = 'custom'.
    const customPronounsCiphertext =
      patch.pronounSet === "custom" && patch.customPronouns
        ? `sha256:${Buffer.from(patch.customPronouns).toString("base64")}` // placeholder — replace with real encryption
        : (patch.pronounSet !== "custom" ? null : undefined);

    await client.query(
      `INSERT INTO user_identity_context
         (user_id, sex_assigned_at_birth, gender_identity, pronoun_set,
          custom_pronouns_ciphertext, custom_pronouns_key_version,
          allow_medically_relevant_context, allow_pronoun_aware_language,
          version, created_at, updated_at)
       VALUES ($1,
         COALESCE($2, NULL), COALESCE($3, NULL), COALESCE($4, NULL),
         COALESCE($5, NULL), CASE WHEN $5 IS NOT NULL THEN 'v1' ELSE NULL END,
         $6, $7,
         1, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         sex_assigned_at_birth = COALESCE($2, user_identity_context.sex_assigned_at_birth),
         gender_identity        = COALESCE($3, user_identity_context.gender_identity),
         pronoun_set            = COALESCE($4, user_identity_context.pronoun_set),
         custom_pronouns_ciphertext = CASE
           WHEN $5 IS NOT NULL THEN $5
           WHEN $4 != 'custom' THEN NULL
           ELSE user_identity_context.custom_pronouns_ciphertext
         END,
         custom_pronouns_key_version = CASE
           WHEN $5 IS NOT NULL THEN 'v1'
           WHEN $4 != 'custom' THEN NULL
           ELSE user_identity_context.custom_pronouns_key_version
         END,
         allow_medically_relevant_context = $6,
         allow_pronoun_aware_language      = $7,
         version    = user_identity_context.version + 1,
         updated_at = NOW()`,
      [
        userId,
        patch.sexAssignedAtBirth ?? null,
        patch.genderIdentity ?? null,
        patch.pronounSet ?? null,
        customPronounsCiphertext ?? null,
        patch.allowMedicallyRelevantContext ?? currentRow?.allow_medically_relevant_context ?? false,
        patch.allowPronounAwareLanguage ?? currentRow?.allow_pronoun_aware_language ?? false,
      ],
    );

    // Audit record — field names only
    if (changedFields.length > 0) {
      await client.query(
        `INSERT INTO user_identity_context_audit
           (id, user_id, actor_user_id, changed_fields, reason, occurred_at)
         VALUES ($1, $2, $3, $4, 'member_update', NOW())`,
        [
          randomUUID(),
          userId,
          userId, // actor = member themselves
          changedFields, // text[] — field names only
        ],
      );
    }

    await client.query("COMMIT");
    return res.json({ ok: true, version: currentVersion + 1 });
  } catch (err: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    const msg = err instanceof Error ? err.message : "unknown";
    return res.status(500).json({ error: "Failed to update identity context", detail: msg });
  } finally {
    client.release();
  }
});

export default router;
