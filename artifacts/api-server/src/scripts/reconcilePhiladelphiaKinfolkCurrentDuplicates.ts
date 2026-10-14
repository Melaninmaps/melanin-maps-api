#!/usr/bin/env tsx
/**
 * Dry-run-first, transactionally reversible consolidation for a very narrow
 * Philadelphia Kinfolk Current pattern:
 *
 *   pinned canonical profile + source-receipted social-profile duplicate
 *
 * The script never deletes a business. It copies only missing, identity-attested
 * social values into the pinned canonical row, stores fresh immutable receipts
 * and a profile-edit audit event, then moves the retained duplicate into the
 * existing reversible Duplicate vault with a matching review and merge audit.
 *
 * Usage (dry run):
 *   pnpm --filter @workspace/api-server exec tsx src/scripts/reconcilePhiladelphiaKinfolkCurrentDuplicates.ts \
 *     --out /tmp/philadelphia-kinfolk-current-duplicate-preview.json
 *
 * Usage (apply only after reviewing that exact manifest):
 *   pnpm --filter @workspace/api-server exec tsx src/scripts/reconcilePhiladelphiaKinfolkCurrentDuplicates.ts \
 *     --apply \
 *     --manifest /tmp/philadelphia-kinfolk-current-duplicate-preview.json \
 *     --actor <named-admin-user-id> \
 *     --confirm "MERGE PHILADELPHIA KINFOLK CURRENT DUPLICATES"
 */

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pool } from "@workspace/db";
import {
  PHILADELPHIA_KINFOLK_DUPLICATE_RECONCILIATION_POLICY_VERSION,
  SOCIAL_FIELDS,
  buildPhiladelphiaKinfolkCurrentDuplicatePlan,
  type ApprovedDuplicateConsolidation,
  type DuplicateReconciliationPlan,
  type KinfolkCurrentBusinessRecord,
  type ProfileFieldReceipt,
  type SocialField,
} from "../businesses/philadelphiaKinfolkCurrentDuplicateReconciliation";

export const PHILADELPHIA_KINFOLK_DUPLICATE_APPLY_CONFIRMATION =
  "MERGE PHILADELPHIA KINFOLK CURRENT DUPLICATES";
const CHANGE_NOTE =
  "Consolidated a confirmed Philadelphia Kinfolk Current duplicate while preserving the canonical map pin and copying only audited official social profiles.";
const MERGE_REASON =
  "Confirmed high-confidence duplicate in Philadelphia Kinfolk Current; retained the only stored map pin and copied only missing social profiles backed by an identity-attested receipt or exact shared official website domain plus normalized phone legacy provenance.";

type RawBusinessRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  twitter: string | null;
  youtube: string | null;
  pinterest: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  updatedAt: string;
};

type RawReceiptRow = {
  businessId: string;
  fieldName: "instagram" | "facebook" | "tiktok" | "service_tags";
  sourceUrl: string;
  sourceLabel: string;
  observedAt: string;
  confidence: "high" | "medium" | "low";
  note: string | null;
  observedValue: unknown;
};

type Arguments = {
  apply: boolean;
  out: string;
  manifest: string | null;
  actor: string | null;
  confirmation: string | null;
};

export type PhiladelphiaKinfolkCurrentDuplicateManifest = {
  manifestVersion: 1;
  generatedAt: string;
  mode: "dry_run";
  policyVersion: typeof PHILADELPHIA_KINFOLK_DUPLICATE_RECONCILIATION_POLICY_VERSION;
  planHash: string;
  scope: "Philadelphia, PA — Kinfolk Current";
  summary: {
    currentKinfolkRowsRead: number;
    approvedConsolidations: number;
    manualReviewCases: number;
    socialFieldsToCopy: number;
  };
  plan: DuplicateReconciliationPlan;
};

function valueAfter(name: string): string | null {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : null;
  return value && !value.startsWith("--") ? value : null;
}

function parseArguments(): Arguments {
  const apply = process.argv.includes("--apply");
  const manifest = valueAfter("--manifest");
  const actor = valueAfter("--actor");
  const confirmation = valueAfter("--confirm");
  const out = resolve(
    valueAfter("--out") ??
      "/tmp/philadelphia-kinfolk-current-duplicate-preview.json",
  );
  if (apply) {
    if (!manifest)
      throw new Error("--apply requires --manifest <reviewed-dry-run.json>");
    if (!actor || actor.length > 255)
      throw new Error("--apply requires a valid --actor <named-admin-user-id>");
    if (confirmation !== PHILADELPHIA_KINFOLK_DUPLICATE_APPLY_CONFIRMATION) {
      throw new Error(
        `--apply requires --confirm ${JSON.stringify(PHILADELPHIA_KINFOLK_DUPLICATE_APPLY_CONFIRMATION)}`,
      );
    }
  }
  return {
    apply,
    out,
    manifest: manifest ? resolve(manifest) : null,
    actor,
    confirmation,
  };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashPlan(plan: DuplicateReconciliationPlan): string {
  return createHash("sha256").update(stableJson(plan)).digest("hex");
}

function mapBusiness(row: RawBusinessRow): KinfolkCurrentBusinessRecord {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    phone: row.phone,
    website: row.website,
    instagram: row.instagram,
    facebook: row.facebook,
    tiktok: row.tiktok,
    twitter: row.twitter,
    youtube: row.youtube,
    pinterest: row.pinterest,
    latitude: row.latitude,
    longitude: row.longitude,
    updatedAt: row.updatedAt,
  };
}

async function loadCurrentKinfolkRecords(): Promise<{
  records: KinfolkCurrentBusinessRecord[];
  receiptsByBusinessId: Map<string, readonly ProfileFieldReceipt[]>;
}> {
  // This reproduces the Kinfolk Current eligibility gate used by the Admin
  // dashboard. The public view excludes archived, duplicate, hidden, and demo
  // records before the script ever evaluates a pair.
  const businesses = await pool.query<RawBusinessRow>(
    `SELECT b.id::text AS id,
            b.name,
            b.address,
            b.city,
            b.state,
            b.phone,
            b.website,
            b.instagram,
            b.facebook,
            b.tiktok,
            b.twitter,
            b.youtube,
            b.pinterest,
            b.latitude,
            b.longitude,
            b.updated_at::text AS "updatedAt"
       FROM public.businesses AS b
       JOIN public.public_businesses AS current_kinfolk ON current_kinfolk.id::text = b.id::text
      WHERE REGEXP_REPLACE(LOWER(BTRIM(COALESCE(b.city, ''))), '[^a-z0-9]+', '', 'g') = 'philadelphia'
        AND REGEXP_REPLACE(LOWER(BTRIM(COALESCE(b.state, ''))), '[^a-z0-9]+', '', 'g') = 'pa'
        AND EXISTS (
          SELECT 1
            FROM public.business_discovery_eligibility AS documented_eligibility
           WHERE documented_eligibility.business_id::text = current_kinfolk.id::text
             AND documented_eligibility.eligibility_status = 'qualified'
             AND documented_eligibility.policy_version = 'documented_diaspora_discovery_v1'
             AND documented_eligibility.ownership_evidence_id IS NOT NULL
             AND (
               documented_eligibility.official_website_evidence_id IS NOT NULL
               OR documented_eligibility.official_social_evidence_id IS NOT NULL
             )
             AND documented_eligibility.ownership_source_expires_at > CURRENT_TIMESTAMP
             AND documented_eligibility.review_after > CURRENT_TIMESTAMP
        )
      ORDER BY b.name ASC, b.id ASC`,
  );
  const records = businesses.rows.map(mapBusiness);
  const ids = records.map((record) => record.id);
  const receiptsByBusinessId = new Map<
    string,
    readonly ProfileFieldReceipt[]
  >();
  if (ids.length === 0) return { records, receiptsByBusinessId };

  const receipts = await pool.query<RawReceiptRow>(
    `SELECT business_id::text AS "businessId",
            field_name AS "fieldName",
            source_url AS "sourceUrl",
            source_label AS "sourceLabel",
            observed_at::text AS "observedAt",
            confidence,
            note,
            observed_value AS "observedValue"
       FROM public.business_profile_field_receipts
      WHERE business_id::text = ANY($1::text[])
        AND field_name IN ('instagram', 'facebook', 'tiktok', 'service_tags')
      ORDER BY business_id ASC, field_name ASC, created_at DESC`,
    [ids],
  );
  for (const row of receipts.rows) {
    const current = receiptsByBusinessId.get(row.businessId) ?? [];
    receiptsByBusinessId.set(row.businessId, [...current, row]);
  }
  return { records, receiptsByBusinessId };
}

export async function buildPhiladelphiaKinfolkCurrentDuplicateManifest(): Promise<PhiladelphiaKinfolkCurrentDuplicateManifest> {
  const { records, receiptsByBusinessId } = await loadCurrentKinfolkRecords();
  const plan = buildPhiladelphiaKinfolkCurrentDuplicatePlan(
    records,
    receiptsByBusinessId,
  );
  return {
    manifestVersion: 1,
    generatedAt: new Date().toISOString(),
    mode: "dry_run",
    policyVersion: PHILADELPHIA_KINFOLK_DUPLICATE_RECONCILIATION_POLICY_VERSION,
    planHash: hashPlan(plan),
    scope: "Philadelphia, PA — Kinfolk Current",
    summary: {
      currentKinfolkRowsRead: records.length,
      approvedConsolidations: plan.approved.length,
      manualReviewCases: plan.manualReview.length,
      socialFieldsToCopy: plan.approved.reduce(
        (count, candidate) => count + candidate.transfers.length,
        0,
      ),
    },
    plan,
  };
}

function pickSocials(
  row: Record<string, unknown>,
): Record<SocialField, string | null> {
  return Object.fromEntries(
    SOCIAL_FIELDS.map((field) => [
      field,
      typeof row[field] === "string" && row[field].trim() ? row[field] : null,
    ]),
  ) as Record<SocialField, string | null>;
}

export async function applyPhiladelphiaKinfolkCurrentDuplicateManifest(
  manifest: PhiladelphiaKinfolkCurrentDuplicateManifest,
  actor: string,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const candidate of manifest.plan.approved) {
      const locked = await client.query<Record<string, unknown>>(
        `SELECT id::text AS id,
                name,
                address,
                city,
                state,
                phone,
                website,
                instagram,
                facebook,
                tiktok,
                twitter,
                youtube,
                pinterest,
                latitude,
                longitude,
                updated_at::text AS "updatedAt",
                COALESCE(is_duplicate, false) AS "isDuplicate",
                duplicate_of_id AS "duplicateOfId",
                status,
                listing_status AS "listingStatus"
           FROM public.businesses
          WHERE id::text = ANY($1::text[])
          FOR UPDATE`,
        [[candidate.canonicalId, candidate.duplicateId]],
      );
      const canonicalBefore = locked.rows.find(
        (row) => row.id === candidate.canonicalId,
      );
      const duplicateBefore = locked.rows.find(
        (row) => row.id === candidate.duplicateId,
      );
      if (!canonicalBefore || !duplicateBefore) {
        throw new Error(
          `Candidate ${candidate.businessName} no longer has both retained records.`,
        );
      }
      if (
        canonicalBefore.isDuplicate === true ||
        duplicateBefore.isDuplicate === true ||
        canonicalBefore.updatedAt !== candidate.canonicalUpdatedAt ||
        duplicateBefore.updatedAt !== candidate.duplicateUpdatedAt
      ) {
        throw new Error(
          `Candidate ${candidate.businessName} changed after the reviewed dry run; no records were written.`,
        );
      }

      const assignments = candidate.transfers.map(
        (transfer, index) => `${transfer.field} = $${index + 1}`,
      );
      const values: unknown[] = candidate.transfers.map(
        (transfer) => transfer.value,
      );
      values.push(candidate.canonicalId, candidate.canonicalUpdatedAt);
      const canonicalUpdate = await client.query<Record<string, unknown>>(
        `UPDATE public.businesses
            SET ${assignments.join(", ")}, updated_at = NOW()
          WHERE id::text = $${values.length - 1}
            AND updated_at::text = $${values.length}
            AND COALESCE(is_duplicate, false) = false
          RETURNING id::text AS id,
                    name,
                    instagram,
                    facebook,
                    tiktok,
                    twitter,
                    youtube,
                    pinterest,
                    latitude,
                    longitude,
                    updated_at::text AS "updatedAt"`,
        values,
      );
      const canonicalAfter = canonicalUpdate.rows[0];
      if (!canonicalAfter)
        throw new Error(
          `Canonical ${candidate.canonicalId} failed its stale-record guard.`,
        );

      for (const transfer of candidate.transfers) {
        const observedValue = {
          fields: { [transfer.field]: transfer.value },
          identityMatch: (
            transfer.receipt.observedValue as { identityMatch?: unknown }
          )?.identityMatch ?? {
            asserted: true,
            signal: "official_social_profile",
          },
        };
        await client.query(
          `INSERT INTO public.business_profile_field_receipts
             (id, business_id, field_name, source_url, source_label, observed_at, confidence, note, observed_value, actor_user_id)
           VALUES ($1::uuid, $2, $3, $4, $5, $6::date, $7, $8, $9::jsonb, $10)`,
          [
            randomUUID(),
            candidate.canonicalId,
            transfer.receipt.fieldName,
            transfer.receipt.sourceUrl,
            transfer.receipt.sourceLabel,
            transfer.receipt.observedAt,
            transfer.receipt.confidence,
            `Transferred from retained duplicate ${candidate.duplicateId}: ${transfer.receipt.note ?? "official social profile evidence"}`.slice(
              0,
              4000,
            ),
            JSON.stringify(observedValue),
            actor,
          ],
        );
      }

      await client.query(
        `INSERT INTO public.business_admin_profile_edit_audit_events
           (id, business_id, actor_user_id, change_note, changed_fields, before_state, after_state)
         VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb)`,
        [
          randomUUID(),
          candidate.canonicalId,
          actor,
          CHANGE_NOTE,
          JSON.stringify(candidate.transfers.map((transfer) => transfer.field)),
          JSON.stringify({
            id: candidate.canonicalId,
            socials: pickSocials(canonicalBefore),
          }),
          JSON.stringify({
            id: candidate.canonicalId,
            socials: pickSocials(canonicalAfter),
          }),
        ],
      );

      const reviewItemId = randomUUID();
      await client.query(
        `INSERT INTO public.business_review_items
           (id, review_type, status, candidate_name, candidate_address, candidate_city, candidate_state,
            candidate_website, candidate_phone, candidate_latitude, candidate_longitude, candidate_source_provider,
            matched_business_id, evidence, reason)
         VALUES ($1::uuid, 'existing_directory_duplicate', 'pending', $2, $3, $4, $5,
                 $6, $7, $8, $9, 'kinfolk_current_philadelphia_reconciliation', $10, $11::jsonb, $12)`,
        [
          reviewItemId,
          duplicateBefore.name,
          duplicateBefore.address,
          duplicateBefore.city,
          duplicateBefore.state,
          duplicateBefore.website,
          duplicateBefore.phone,
          duplicateBefore.latitude,
          duplicateBefore.longitude,
          candidate.canonicalId,
          JSON.stringify({
            policyVersion:
              PHILADELPHIA_KINFOLK_DUPLICATE_RECONCILIATION_POLICY_VERSION,
            identityReasons: candidate.identityReasons,
            canonicalBusinessId: candidate.canonicalId,
            duplicateBusinessId: candidate.duplicateId,
            copiedSocialFields: candidate.transfers.map((transfer) => ({
              field: transfer.field,
              provenance: transfer.provenance,
            })),
            manifestHash: manifest.planHash,
          }),
          MERGE_REASON,
        ],
      );

      const duplicateUpdate = await client.query<Record<string, unknown>>(
        `UPDATE public.businesses
            SET is_duplicate = true,
                duplicate_of_id = $1,
                duplicate_reason = 'philadelphia_kinfolk_pin_social_reconciliation',
                duplicate_marked_at = NOW(),
                listing_status = 'permanently_hidden',
                status = 'permanently_hidden',
                updated_at = NOW()
          WHERE id::text = $2
            AND updated_at::text = $3
            AND COALESCE(is_duplicate, false) = false
          RETURNING id::text AS id`,
        [
          candidate.canonicalId,
          candidate.duplicateId,
          candidate.duplicateUpdatedAt,
        ],
      );
      if (!duplicateUpdate.rows[0])
        throw new Error(
          `Duplicate ${candidate.duplicateId} failed its stale-record guard.`,
        );

      await client.query(
        `UPDATE public.business_review_items
            SET status = 'merged', resolved_by = $1, resolved_at = NOW(), updated_at = NOW()
          WHERE id = $2::uuid`,
        [actor, reviewItemId],
      );
      await client.query(
        `INSERT INTO public.business_merge_audit_events
           (id, review_item_id, action, duplicate_business_id, canonical_business_id, actor_user_id,
            confirmation_phrase, reason, detail)
         VALUES ($1::uuid, $2::uuid, 'merge', $3, $4, $5, $6, $7, $8::jsonb)`,
        [
          randomUUID(),
          reviewItemId,
          candidate.duplicateId,
          candidate.canonicalId,
          actor,
          PHILADELPHIA_KINFOLK_DUPLICATE_APPLY_CONFIRMATION,
          MERGE_REASON,
          JSON.stringify({
            policyVersion:
              PHILADELPHIA_KINFOLK_DUPLICATE_RECONCILIATION_POLICY_VERSION,
            manifestHash: manifest.planHash,
            identityReasons: candidate.identityReasons,
            copiedSocialFields: candidate.transfers.map((transfer) => ({
              field: transfer.field,
              provenance: transfer.provenance,
            })),
            businessBefore: {
              isDuplicate: duplicateBefore.isDuplicate,
              duplicateOfId: duplicateBefore.duplicateOfId ?? null,
              listingStatus: duplicateBefore.listingStatus,
              status: duplicateBefore.status,
            },
            canonicalBefore: {
              socials: pickSocials(canonicalBefore),
              latitude: canonicalBefore.latitude,
              longitude: canonicalBefore.longitude,
            },
            canonicalAfter: {
              socials: pickSocials(canonicalAfter),
              latitude: canonicalAfter.latitude,
              longitude: canonicalAfter.longitude,
            },
          }),
        ],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function writeManifest(
  path: string,
  manifest: PhiladelphiaKinfolkCurrentDuplicateManifest,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "DATABASE_URL is required; the script must run within the private API service environment.",
    );
  const args = parseArguments();
  const current = await buildPhiladelphiaKinfolkCurrentDuplicateManifest();

  if (!args.apply) {
    await writeManifest(args.out, current);
    process.stdout.write(
      `${JSON.stringify({ mode: current.mode, out: args.out, planHash: current.planHash, summary: current.summary }, null, 2)}\n`,
    );
    return;
  }

  const reviewed = JSON.parse(
    await readFile(args.manifest!, "utf8"),
  ) as PhiladelphiaKinfolkCurrentDuplicateManifest;
  if (
    reviewed.manifestVersion !== 1 ||
    reviewed.mode !== "dry_run" ||
    reviewed.policyVersion !==
      PHILADELPHIA_KINFOLK_DUPLICATE_RECONCILIATION_POLICY_VERSION ||
    reviewed.planHash !== hashPlan(reviewed.plan)
  ) {
    throw new Error(
      "The supplied manifest is not a valid, unmodified dry-run receipt.",
    );
  }
  if (reviewed.planHash !== current.planHash) {
    throw new Error(
      "The current database plan no longer matches the reviewed manifest; run a new dry run and review it before applying.",
    );
  }
  if (reviewed.plan.approved.length === 0) {
    throw new Error(
      "The reviewed manifest contains no safe automatic consolidations; no database action was attempted.",
    );
  }

  await applyPhiladelphiaKinfolkCurrentDuplicateManifest(reviewed, args.actor!);
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: "applied",
        policyVersion:
          PHILADELPHIA_KINFOLK_DUPLICATE_RECONCILIATION_POLICY_VERSION,
        planHash: reviewed.planHash,
        consolidatedRecords: reviewed.plan.approved.length,
        copiedSocialFields: reviewed.plan.approved.reduce(
          (count, candidate) => count + candidate.transfers.length,
          0,
        ),
        manualReviewCasesLeftUntouched: reviewed.plan.manualReview.length,
      },
      null,
      2,
    )}\n`,
  );
}

// This module is imported by the API route. Bundling folds its import.meta.url
// into the server entrypoint, so comparing it to process.argv[1] would execute
// a dry run during API startup. Only an explicit TypeScript script invocation
// can execute the command-line entrypoint.
const invokedAsCli = /(?:^|\/)reconcilePhiladelphiaKinfolkCurrentDuplicates\.ts$/.test(
  process.argv[1] ?? "",
);

if (invokedAsCli) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.stack : String(error));
      process.exitCode = 1;
    })
    .finally(async () => {
      await pool.end().catch(() => undefined);
    });
}
