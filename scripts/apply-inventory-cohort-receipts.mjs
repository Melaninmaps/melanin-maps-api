#!/usr/bin/env node
/**
 * Writes an observation-only receipt for each current public business.
 *
 * Safety contract:
 * - Requires both --apply and a DATABASE_URL supplied by the deployment host.
 * - Requires the expected count and the offline receipt root hash, so a stale
 *   or incomplete input cannot silently be recorded.
 * - Upserts into the receipt table only. It never updates businesses, removes
 *   data, enables a worker, changes visibility, or creates a public listing.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const { Pool } = pg;
const POLICY_VERSION = "mwm-live-inventory-cohort-reconciliation-v1";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function publicHost(value) {
  if (!String(value ?? "").trim()) return "";
  try {
    return new URL(String(value).trim()).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function strongKey(record) {
  const name = normalize(record.name);
  const city = normalize(record.city);
  const state = normalize(record.state);
  const host = publicHost(record.website ?? record.website_url);
  return name && city && state && host ? `${name}|${city}|${state}|${host}` : "";
}

function basicKey(record) {
  const name = normalize(record.name);
  const city = normalize(record.city);
  const state = normalize(record.state);
  return name && city && state ? `${name}|${city}|${state}` : "";
}

function buildSourceIndexes(receipts) {
  const strong = new Map();
  const basic = new Map();
  for (const receipt of receipts) {
    const identity = receipt.recordIdentity ?? {};
    const strongIdentity = strongKey(identity);
    const basicIdentity = basicKey(identity);
    if (strongIdentity) strong.set(strongIdentity, receipt);
    if (basicIdentity) {
      const values = basic.get(basicIdentity) ?? [];
      values.push(receipt);
      basic.set(basicIdentity, values);
    }
  }
  return { strong, basic };
}

function classifyLiveRow(row, indexes) {
  const exact = indexes.strong.get(strongKey(row));
  const basicMatches = indexes.basic.get(basicKey(row)) ?? [];
  const uniqueMatch = exact ?? (basicMatches.length === 1 ? basicMatches[0] : null);
  let cohort;
  if (uniqueMatch?.cohort === "mwm_source_backed_candidate") cohort = "source_backed_mwm_candidate_live";
  else if (uniqueMatch) cohort = "source_backed_held_live";
  else if (basicMatches.length > 1) cohort = "ambiguous_source_match_live";
  else cohort = "legacy_or_unattributed_live";
  const reasons = cohort === "source_backed_mwm_candidate_live"
    ? ["unique_source_backed_mwm_candidate_match"]
    : cohort === "source_backed_held_live"
      ? [`source_cohort:${uniqueMatch.cohort}`]
      : cohort === "ambiguous_source_match_live"
        ? ["multiple_signed_source_matches"]
        : ["no_unique_match_in_current_signed_packages"];
  const receiptWithoutHash = {
    receiptVersion: POLICY_VERSION,
    businessId: row.id,
    cohort,
    sourceReceiptHash: uniqueMatch?.receiptHash ?? null,
    sourceManifest: uniqueMatch?.sourceManifest ?? null,
    sourceRow: uniqueMatch?.sourceRow ?? null,
    reasons,
  };
  return { ...receiptWithoutHash, receiptHash: sha256(canonicalJson(receiptWithoutHash)) };
}

async function main() {
  if (!process.argv.includes("--apply")) {
    throw new Error("Refusing to write receipts without --apply. This command has no implicit mutation mode.");
  }
  const sourcePath = argValue("--source-receipts");
  const expectedCount = Number(argValue("--expected-live-count"));
  const expectedSourceRootHash = argValue("--expected-source-root-hash");
  if (!sourcePath || !Number.isInteger(expectedCount) || expectedCount < 1 || !expectedSourceRootHash) {
    throw new Error("Required: --source-receipts <file> --expected-live-count <positive integer> --expected-source-root-hash <hash> --apply");
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be configured by the deployment host.");

  const receiptLines = (await readFile(resolve(sourcePath), "utf8")).split(/\r?\n/).filter(Boolean);
  const sourceReceipts = receiptLines.map((line) => JSON.parse(line));
  const actualSourceRootHash = sha256(sourceReceipts.map((receipt) => receipt.receiptHash).join("\n"));
  if (actualSourceRootHash !== expectedSourceRootHash) {
    throw new Error("Source receipt root hash mismatch. Regenerate the preview; do not apply against changed manifests.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const schema = await client.query(`SELECT to_regclass('public.business_inventory_cohort_receipts') AS table_name`);
    if (!schema.rows[0]?.table_name) throw new Error("Receipt schema is absent. Deploy the schema-only migration before applying receipts.");
    const publicRows = await client.query(`
      SELECT id, name, city, state, website
      FROM public.public_businesses
      ORDER BY id ASC
    `);
    if (publicRows.rowCount !== expectedCount) {
      throw new Error(`Live public inventory count mismatch: expected ${expectedCount}, found ${publicRows.rowCount ?? 0}. Refuse to write an incomplete receipt.`);
    }
    const indexes = buildSourceIndexes(sourceReceipts);
    const receipts = publicRows.rows.map((row) => classifyLiveRow(row, indexes));
    const rootHash = sha256(receipts.map((receipt) => receipt.receiptHash).join("\n"));
    const counts = Object.fromEntries(Object.entries(Object.groupBy(receipts, (receipt) => receipt.cohort)).map(([cohort, values]) => [cohort, values.length]));

    await client.query("BEGIN");
    for (const receipt of receipts) {
      await client.query(`
        INSERT INTO public.business_inventory_cohort_receipts
          (business_id, cohort, source_receipt_hash, source_manifest, source_row, reason_codes, receipt_hash, policy_version, observed_at)
        VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,now())
        ON CONFLICT (business_id) DO UPDATE SET
          cohort = EXCLUDED.cohort,
          source_receipt_hash = EXCLUDED.source_receipt_hash,
          source_manifest = EXCLUDED.source_manifest,
          source_row = EXCLUDED.source_row,
          reason_codes = EXCLUDED.reason_codes,
          receipt_hash = EXCLUDED.receipt_hash,
          policy_version = EXCLUDED.policy_version,
          observed_at = now()
      `, [
        receipt.businessId,
        receipt.cohort,
        receipt.sourceReceiptHash,
        receipt.sourceManifest,
        receipt.sourceRow,
        JSON.stringify(receipt.reasons),
        receipt.receiptHash,
        POLICY_VERSION,
      ]);
    }
    const stored = await client.query(`SELECT count(*)::int AS count FROM public.business_inventory_cohort_receipts`);
    if (stored.rows[0]?.count < expectedCount) throw new Error("Receipt table count is below the complete live inventory count.");
    await client.query("COMMIT");
    process.stdout.write(`${JSON.stringify({
      operation: "observation_only_cohort_receipts",
      sideEffects: "receipt_table_upsert_only",
      businessVisibilityChanged: false,
      publicationWorkerEnabled: false,
      expectedLiveCount: expectedCount,
      processedLiveCount: receipts.length,
      rootHash,
      cohortCounts: counts,
    }, null, 2)}\n`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
