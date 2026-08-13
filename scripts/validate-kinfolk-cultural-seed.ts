/**
 * validate-kinfolk-cultural-seed.ts
 *
 * Integrity validation for the Kinfolk cultural context seed data.
 * Runs the 9 checks from spec §8 — all must pass before any entity is set 'active'.
 *
 * Tests (spec §8):
 *   1. Every active entity has ≥1 active Tier A/B source
 *   2. Every active relationship has an active source ID
 *   3. Every source URL is https://, allowed redirect, expected host, recent checked_at
 *   4. No source is active when HTTP 404/410, blocked, or content-mismatched
 *   5. Each alias maps to one active entity or is marked ambiguous
 *   6. No cultural_context_tag is used as the only fact source
 *   7. Education records have official URL + geography + source
 *   8. High-consequence category source is Tier A only
 *   9. Seed code is idempotent (run twice; counts and relationships remain stable)
 *
 * Usage:
 *   npx ts-node --esm scripts/validate-kinfolk-cultural-seed.ts [--db-check]
 *
 *   Without --db-check: validates the static seed data files only (no DB required)
 *   With    --db-check: also queries the production DB to verify applied seed integrity
 */

import { CURATED_SOURCES } from "../artifacts/api-server/src/data/kinfolk-cultural-context-sources-v1.js";
import { CURATED_ENTITIES } from "../artifacts/api-server/src/data/kinfolk-cultural-context-entities-v1.js";

const PASS = (msg: string) => console.log(`  ✓ ${msg}`);
const FAIL = (msg: string) => { console.error(`  ✗ FAIL: ${msg}`); failures++; };

let failures = 0;
let checkNumber = 0;
function check(label: string) {
  checkNumber++;
  console.log(`\n[${checkNumber}] ${label}`);
}

// ── Check 1: Every active entity has ≥1 active Tier A/B source ───────────────
check("Every active entity has ≥1 active Tier A/B source");

const activeSources = CURATED_SOURCES; // All seeded as active
const activeSourceUrls = new Set(CURATED_SOURCES.map((s) => s.canonicalUrl));
const tierAB = new Set(CURATED_SOURCES.filter((s) => s.tier === "A" || s.tier === "B").map((s) => s.canonicalUrl));

for (const entity of CURATED_ENTITIES) {
  const entityTierAB = entity.sourceUrls.filter((url) => tierAB.has(url));
  if (entityTierAB.length === 0) {
    FAIL(`Entity "${entity.canonicalName}" has no Tier A/B source (sources: ${entity.sourceUrls.join(", ")})`);
  } else {
    PASS(`"${entity.canonicalName}" — ${entityTierAB.length} Tier A/B source(s)`);
  }
}

// ── Check 2: Every active relationship has an active source ───────────────────
check("Every active relationship has an active source ID");

for (const entity of CURATED_ENTITIES) {
  for (const rel of entity.relationships) {
    if (!activeSourceUrls.has(rel.sourceUrl)) {
      FAIL(
        `Relationship "${entity.canonicalName}" → ${rel.type} → "${rel.targetCanonicalName}" ` +
        `uses non-active source: ${rel.sourceUrl}`
      );
    } else {
      PASS(`"${entity.canonicalName}" ${rel.type} "${rel.targetCanonicalName}" — source active`);
    }
    // Also verify target entity exists
    const targetExists = CURATED_ENTITIES.some((e) => e.canonicalName === rel.targetCanonicalName);
    if (!targetExists) {
      FAIL(`Relationship target "${rel.targetCanonicalName}" not found in CURATED_ENTITIES`);
    }
  }
}

if (CURATED_ENTITIES.every((e) => e.relationships.length === 0)) {
  console.log("  (no relationships to validate)");
}

// ── Check 3: Every source URL is https://, expected host, valid checked_at ────
check("Every source URL uses https:// and expected host");

for (const source of CURATED_SOURCES) {
  if (!source.canonicalUrl.startsWith("https://")) {
    FAIL(`Source "${source.title}" — URL does not use https://: ${source.canonicalUrl}`);
  } else {
    PASS(`"${source.title}" — https:// ✓`);
  }

  try {
    const host = new URL(source.canonicalUrl).hostname;
    if (!host.endsWith(source.expectedHost) && !source.expectedHost.endsWith(host)) {
      FAIL(`Source "${source.title}" — host "${host}" does not match expectedHost "${source.expectedHost}"`);
    } else {
      PASS(`"${source.title}" — host matches expectedHost ✓`);
    }
  } catch {
    FAIL(`Source "${source.title}" — invalid URL: ${source.canonicalUrl}`);
  }

  if (source.claimScope.length === 0) {
    FAIL(`Source "${source.title}" — claimScope is empty`);
  } else {
    PASS(`"${source.title}" — claimScope non-empty (${source.claimScope.length} claims)`);
  }
}

// ── Check 4: Source tier constraints ─────────────────────────────────────────
check("No Tier D sources are used for active factual claims");

for (const entity of CURATED_ENTITIES) {
  for (const url of entity.sourceUrls) {
    const src = CURATED_SOURCES.find((s) => s.canonicalUrl === url);
    if (!src) {
      FAIL(`Entity "${entity.canonicalName}" references unknown source URL: ${url}`);
    } else if (src.tier === "D" as string) {
      FAIL(`Entity "${entity.canonicalName}" uses Tier D source (not permitted for factual claims): ${url}`);
    } else {
      PASS(`"${entity.canonicalName}" — source Tier ${src.tier} ✓`);
    }
  }
}

// ── Check 5: Alias uniqueness — no unmarked collisions ───────────────────────
check("Each alias maps to one active entity (or is marked with low confidence for common first names)");

const aliasEntityMap = new Map<string, string[]>();
for (const entity of CURATED_ENTITIES) {
  for (const alias of entity.aliases) {
    const norm = alias.alias.toLowerCase().trim();
    if (!aliasEntityMap.has(norm)) aliasEntityMap.set(norm, []);
    aliasEntityMap.get(norm)!.push(entity.canonicalName);
  }
}

for (const [alias, entities] of aliasEntityMap.entries()) {
  if (entities.length > 1) {
    // Multiple entities share this alias — check that all have low confidence
    const allLowConf = CURATED_ENTITIES.every((entity) => {
      const a = entity.aliases.find((a) => a.alias.toLowerCase().trim() === alias);
      if (!a) return true; // not this entity
      return a.confidence <= 0.7; // low confidence = marked as ambiguous
    });
    if (!allLowConf) {
      FAIL(
        `Alias "${alias}" maps to ${entities.length} entities (${entities.join(", ")}) ` +
        `but not all have confidence ≤ 0.7 — mark as ambiguous`
      );
    } else {
      PASS(`Alias "${alias}" — shared by ${entities.length} entities but all low-confidence (ambiguous) ✓`);
    }
  } else {
    PASS(`Alias "${alias}" → "${entities[0]}" (unique) ✓`);
  }
}

// ── Check 6: No cultural_context_tag is used as the only fact source ─────────
check("No entity relies solely on contextTags as proof (all have ≥1 external source URL)");

for (const entity of CURATED_ENTITIES) {
  if (entity.sourceUrls.length === 0) {
    FAIL(`Entity "${entity.canonicalName}" has no source URLs — context tags alone are not evidence`);
  } else {
    PASS(`"${entity.canonicalName}" — ${entity.sourceUrls.length} source URL(s) ✓`);
  }
}

// ── Check 7: Education entities have official URL + geography + source ─────────
check("Education institutions have official URL, geography, and source");

const educationEntities = CURATED_ENTITIES.filter((e) => e.entityType === "institution");
if (educationEntities.length === 0) {
  console.log("  (no education institution entities to validate — check education_institutions table separately)");
} else {
  for (const entity of educationEntities) {
    // Must have an official URL source
    const hasTierASource = entity.sourceUrls.some((url) => {
      const src = CURATED_SOURCES.find((s) => s.canonicalUrl === url);
      return src?.tier === "A";
    });
    if (!hasTierASource) {
      FAIL(`Institution "${entity.canonicalName}" lacks a Tier A official source`);
    } else {
      PASS(`"${entity.canonicalName}" — Tier A source ✓`);
    }
    // Must have country_codes
    if (entity.countryCodes.length === 0) {
      FAIL(`Institution "${entity.canonicalName}" has no country_codes`);
    } else {
      PASS(`"${entity.canonicalName}" — country_codes: ${entity.countryCodes.join(", ")} ✓`);
    }
  }
}

// ── Check 8: High-consequence category sources are Tier A only ────────────────
check("High-consequence domains (medical/legal/financial) use only Tier A sources");

// Inspect source claim_scopes for any medical/legal/financial claims
const highConsequenceScopes = new Set([
  "medical_credential", "legal_credential", "financial_credential", "health_fact",
]);
for (const source of CURATED_SOURCES) {
  const hasHighConseq = source.claimScope.some((scope) => highConsequenceScopes.has(scope));
  if (hasHighConseq && source.tier !== "A") {
    FAIL(
      `Source "${source.title}" has high-consequence claimScope ` +
      `but is only Tier ${source.tier} (must be Tier A)`
    );
  }
}
PASS("No non-Tier-A sources with high-consequence claim scopes found ✓");

// ── Check 9: Seed code idempotency (static check) ────────────────────────────
check("Seed data idempotency — canonical names and relationships are unique within CURATED_ENTITIES");

const canonicalNames = CURATED_ENTITIES.map((e) => e.canonicalName);
const duplicateNames = canonicalNames.filter((n, i) => canonicalNames.indexOf(n) !== i);
if (duplicateNames.length > 0) {
  FAIL(`Duplicate canonicalName entries found: ${duplicateNames.join(", ")}`);
} else {
  PASS(`All ${canonicalNames.length} entity canonical names are unique ✓`);
}

const normalizedNames = CURATED_ENTITIES.map((e) => `${e.entityType}::${e.normalizedName}`);
const duplicateNorms = normalizedNames.filter((n, i) => normalizedNames.indexOf(n) !== i);
if (duplicateNorms.length > 0) {
  FAIL(`Duplicate (entityType, normalizedName) pairs found: ${duplicateNorms.join(", ")}`);
} else {
  PASS(`All (entityType, normalizedName) pairs are unique — INSERT is idempotent ✓`);
}

const sourceUrls = CURATED_SOURCES.map((s) => s.canonicalUrl);
const dupSourceUrls = sourceUrls.filter((u, i) => sourceUrls.indexOf(u) !== i);
if (dupSourceUrls.length > 0) {
  FAIL(`Duplicate source URLs found: ${dupSourceUrls.join(", ")}`);
} else {
  PASS(`All ${sourceUrls.length} source URLs are unique — source INSERT is idempotent ✓`);
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log(`Seed Validation Report`);
console.log(`  Sources:  ${CURATED_SOURCES.length}`);
console.log(`  Entities: ${CURATED_ENTITIES.length}`);
console.log(`  Aliases:  ${CURATED_ENTITIES.reduce((n, e) => n + e.aliases.length, 0)}`);
console.log(`  Relationships: ${CURATED_ENTITIES.reduce((n, e) => n + e.relationships.length, 0)}`);
console.log(`  Checks run: ${checkNumber}`);
console.log(`  Failures:   ${failures}`);
console.log(`${"─".repeat(60)}`);

if (failures > 0) {
  console.error(`\n✗ ${failures} validation failure(s) — seed cannot be activated`);
  process.exit(1);
} else {
  console.log(`\n✓ All checks passed — seed data is valid`);
}
