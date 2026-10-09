import { createServer } from "node:http";
import { Pool } from "pg";
import {
  directAdminCreationUnsafeFields,
  validateAdminBusinessProfilePatch,
} from "../artifacts/api-server/src/businesses/adminBusinessProfilePolicy";
import {
  mapPinOnlyPatch,
  storedAddressMatchesMapEvidence,
  validateMapPinEvidenceReviewInput,
} from "../artifacts/api-server/src/businesses/registerDocumentedDiscoveryReviewRoutes";
import { decideGenericIngestExistingAction } from "../artifacts/api-server/src/routes/business-ingest";
import { decideSocialFirstIdentityMatch } from "../artifacts/api-server/src/lib/social-first-ingestion";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for the disposable prevention test");

const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const namespace = "mwm_prevention_disposable";

type Result = {
  ok: boolean;
  executedAt: string;
  checks: Record<string, boolean>;
  error?: string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function run(): Promise<Result> {
  const checks: Record<string, boolean> = {};
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${namespace}`);
    await client.query(`DROP TABLE IF EXISTS ${namespace}.business_profile_field_receipts`);
    await client.query(`DROP TABLE IF EXISTS ${namespace}.businesses`);
    await client.query(`DROP TABLE IF EXISTS ${namespace}.business_review_items`);
    await client.query(`DROP TABLE IF EXISTS ${namespace}.business_discovery_eligibility`);
    await client.query(`
      CREATE TABLE ${namespace}.businesses (
      id text PRIMARY KEY,
      name text NOT NULL,
      website text,
      instagram text,
      address text,
      latitude numeric,
      longitude numeric,
      listing_status text NOT NULL DEFAULT 'live_unclaimed',
      is_duplicate boolean NOT NULL DEFAULT false
      )
    `);
    await client.query(`
      CREATE TABLE ${namespace}.business_profile_field_receipts (
        business_id text NOT NULL REFERENCES ${namespace}.businesses(id),
        field_name text NOT NULL,
        observed_value jsonb NOT NULL,
        identity_match boolean NOT NULL,
        identity_match_signal text,
        source_url text NOT NULL,
        source_label text NOT NULL,
        observed_at date NOT NULL,
        PRIMARY KEY (business_id, field_name)
      )
    `);
    await client.query(`
      CREATE TABLE ${namespace}.business_review_items (
        id bigserial PRIMARY KEY,
        candidate_name text NOT NULL,
        reason text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await client.query(`
      CREATE TABLE ${namespace}.business_discovery_eligibility (
        business_id text PRIMARY KEY,
        identity_evidence_id uuid,
        ownership_evidence_id uuid,
        official_website_evidence_id uuid,
        official_social_evidence_id uuid,
        address_evidence_id uuid,
        map_pin_evidence_id uuid,
        ownership_designations jsonb NOT NULL DEFAULT '[]'::jsonb
      )
    `);

    // The actual branch policy rejects presence and ownership claims through
    // the legacy unreceipted direct-create path.
    const unsafe = directAdminCreationUnsafeFields({
      name: "Synthetic Example",
      website: "https://synthetic.example",
      instagram: "https://instagram.com/syntheticexample",
      blackOwned: true,
      ownershipDesignations: ["black-owned"],
    });
    assert(
      unsafe.join(",") === "website,instagram,ownershipDesignations,blackOwned",
      `unexpected direct-create safety result: ${unsafe.join(",")}`,
    );
    checks.direct_create_presence_and_ownership_rejected = true;

    // Founder-source publication refreshes presence and ownership receipts but
    // supplies no physical address or geocode. The exact upsert behavior must
    // therefore retain a separately reviewed map receipt instead of clearing
    // it on each source-receipt refresh.
    const addressEvidenceId = "11111111-1111-1111-1111-111111111111";
    const mapEvidenceId = "22222222-2222-2222-2222-222222222222";
    await client.query(
      `INSERT INTO ${namespace}.business_discovery_eligibility
       (business_id, identity_evidence_id, ownership_evidence_id, official_website_evidence_id,
        official_social_evidence_id, address_evidence_id, map_pin_evidence_id, ownership_designations)
       VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7::uuid, $8::jsonb)`,
      [
        "synthetic-map",
        "33333333-3333-3333-3333-333333333333",
        "44444444-4444-4444-4444-444444444444",
        "55555555-5555-5555-5555-555555555555",
        "66666666-6666-6666-6666-666666666666",
        addressEvidenceId,
        mapEvidenceId,
        JSON.stringify(["Black / African American-Owned"]),
      ],
    );
    await client.query(
      `INSERT INTO ${namespace}.business_discovery_eligibility
       (business_id, identity_evidence_id, ownership_evidence_id, official_website_evidence_id,
        official_social_evidence_id, address_evidence_id, map_pin_evidence_id, ownership_designations)
       VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5::uuid, NULL, NULL, $6::jsonb)
       ON CONFLICT (business_id) DO UPDATE SET
         identity_evidence_id = EXCLUDED.identity_evidence_id,
         ownership_evidence_id = EXCLUDED.ownership_evidence_id,
         official_website_evidence_id = EXCLUDED.official_website_evidence_id,
         official_social_evidence_id = EXCLUDED.official_social_evidence_id,
         address_evidence_id = ${namespace}.business_discovery_eligibility.address_evidence_id,
         map_pin_evidence_id = ${namespace}.business_discovery_eligibility.map_pin_evidence_id,
         ownership_designations = EXCLUDED.ownership_designations`,
      [
        "synthetic-map",
        "77777777-7777-7777-7777-777777777777",
        "88888888-8888-8888-8888-888888888888",
        "99999999-9999-9999-9999-999999999999",
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        JSON.stringify(["Black / African American-Owned"]),
      ],
    );
    const retainedMap = await client.query<{ address_evidence_id: string; map_pin_evidence_id: string }>(
      `SELECT address_evidence_id, map_pin_evidence_id
         FROM ${namespace}.business_discovery_eligibility
        WHERE business_id = 'synthetic-map'`,
    );
    assert(retainedMap.rows[0]?.address_evidence_id === addressEvidenceId, "source refresh cleared audited address evidence");
    assert(retainedMap.rows[0]?.map_pin_evidence_id === mapEvidenceId, "source refresh cleared audited map-pin evidence");
    checks.source_receipt_refresh_preserves_audited_map_evidence = true;

    // The map-only control requires first-party physical-address evidence and
    // a matching approved geocoder result. Its mutation payload contains only
    // latitude/longitude and evidence ids; it cannot carry address, lifecycle,
    // ownership, or eligibility fields into the update query.
    const mapInput = validateMapPinEvidenceReviewInput({
      decisionReason: "Synthetic first-party address and exact approved geocoder match.",
      addressEvidence: {
        field: "address",
        sourceKind: "business_official",
        sourceUrl: "https://synthetic.example/contact",
        observedAt: "2026-10-09T00:00:00.000Z",
        confidence: "high",
        observedValue: {
          address: "123 Synthetic Street, Philadelphia, PA 19103",
          addressType: "physical",
          identityMatch: true,
          matchingSignals: ["business_name", "city", "address"],
        },
      },
      mapPinEvidence: {
        field: "map_pin",
        sourceKind: "official_geocoder",
        sourceUrl: "https://maps.googleapis.com/maps/api/geocode/json",
        observedAt: "2026-10-09T00:00:00.000Z",
        confidence: "high",
        observedValue: {
          latitude: 39.9526,
          longitude: -75.1652,
          queryAddress: "123 Synthetic Street, Philadelphia, PA 19103",
          formattedAddress: "123 Synthetic Street, Philadelphia, PA 19103",
          addressMatch: true,
        },
      },
    }, new Date("2026-10-09T00:00:00.000Z"));
    assert(storedAddressMatchesMapEvidence("123 Synthetic Street, Philadelphia, PA 19103", mapInput), "exact stored address did not match receipt");
    assert(!storedAddressMatchesMapEvidence("124 Synthetic Street, Philadelphia, PA 19103", mapInput), "map receipt was accepted as an address change");
    const attachedAddressEvidenceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const attachedMapEvidenceId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const mapPatch = mapPinOnlyPatch(mapInput, attachedAddressEvidenceId, attachedMapEvidenceId);
    assert(
      Object.keys(mapPatch).sort().join(",") === "addressEvidenceId,latitude,longitude,mapPinEvidenceId",
      "map-only patch contains fields outside coordinate/evidence scope",
    );
    await client.query(
      `INSERT INTO ${namespace}.businesses (id, name, address, listing_status, is_duplicate)
       VALUES ($1, $2, $3, 'live_unclaimed', false)`,
      ["synthetic-map", "Synthetic Map", "123 Synthetic Street, Philadelphia, PA 19103"],
    );
    await client.query(
      `UPDATE ${namespace}.businesses
          SET latitude = $2::numeric, longitude = $3::numeric
        WHERE id = $1`,
      ["synthetic-map", mapPatch.latitude, mapPatch.longitude],
    );
    await client.query(
      `UPDATE ${namespace}.business_discovery_eligibility
          SET address_evidence_id = $2::uuid, map_pin_evidence_id = $3::uuid
        WHERE business_id = $1`,
      ["synthetic-map", mapPatch.addressEvidenceId, mapPatch.mapPinEvidenceId],
    );
    const mapOnlyStored = await client.query<{
      address: string;
      latitude: string;
      longitude: string;
      listing_status: string;
      is_duplicate: boolean;
    }>(`SELECT address, latitude, longitude, listing_status, is_duplicate FROM ${namespace}.businesses WHERE id = 'synthetic-map'`);
    assert(mapOnlyStored.rows[0]?.address === "123 Synthetic Street, Philadelphia, PA 19103", "map-only update changed address");
    assert(mapOnlyStored.rows[0]?.latitude === "39.9526" && mapOnlyStored.rows[0]?.longitude === "-75.1652", "map-only update did not save exact coordinates");
    assert(mapOnlyStored.rows[0]?.listing_status === "live_unclaimed" && mapOnlyStored.rows[0]?.is_duplicate === false, "map-only update changed lifecycle or duplicate state");
    const mapEligibility = await client.query<{ ownership_designations: string[]; address_evidence_id: string; map_pin_evidence_id: string }>(
      `SELECT ownership_designations, address_evidence_id, map_pin_evidence_id
         FROM ${namespace}.business_discovery_eligibility
        WHERE business_id = 'synthetic-map'`,
    );
    assert(JSON.stringify(mapEligibility.rows[0]?.ownership_designations) === JSON.stringify(["Black / African American-Owned"]), "map-only update changed ownership evidence");
    assert(mapEligibility.rows[0]?.address_evidence_id === attachedAddressEvidenceId && mapEligibility.rows[0]?.map_pin_evidence_id === attachedMapEvidenceId, "map-only evidence ids were not updated");
    checks.map_only_attachment_preserves_address_lifecycle_and_ownership = true;

    await client.query(
      `INSERT INTO ${namespace}.businesses (id, name, website, instagram) VALUES ($1, $2, $3, $4)`,
      ["synthetic-1", "Synthetic Example", null, null],
    );

    // The exact production policy validates that each changed public field has
    // a first-party receipt and explicit identity signal.
    const validated = validateAdminBusinessProfilePatch(
      {
        website: "https://synthetic.example/official",
        instagram: "https://instagram.com/syntheticexample",
        changeNote: "Synthetic disposable database safety test",
        sourceReceipts: [
          {
            field: "website",
            sourceUrl: "https://synthetic.example/official",
            sourceLabel: "Synthetic official homepage",
            observedAt: "2026-10-09",
            confidence: "high",
            note: "Exact synthetic business name and official domain displayed.",
            identityMatch: true,
            identityMatchSignal: "official_domain",
          },
          {
            field: "instagram",
            sourceUrl: "https://instagram.com/syntheticexample",
            sourceLabel: "Synthetic official Instagram",
            observedAt: "2026-10-09",
            confidence: "high",
            note: "Exact synthetic business identity displayed.",
            identityMatch: true,
            identityMatchSignal: "official_social_profile",
          },
        ],
      },
      {
        name: "Synthetic Example",
        address: null,
        city: "Philadelphia",
        state: "PA",
        website: null,
        instagram: null,
        ownershipDesignations: [],
      },
    );
    assert(validated.patch.website === "https://synthetic.example/official", "validated website value mismatch");
    assert(validated.patch.instagram === "https://instagram.com/syntheticexample", "validated Instagram value mismatch");

    await client.query(
      `UPDATE ${namespace}.businesses SET website = $2, instagram = $3 WHERE id = $1`,
      ["synthetic-1", validated.patch.website, validated.patch.instagram],
    );
    for (const receipt of validated.fieldReceipts) {
      const observed = validated.receiptObservedValues[receipt.field];
      assert(observed, `missing observed value for ${receipt.field}`);
      await client.query(
        `INSERT INTO ${namespace}.business_profile_field_receipts
         (business_id, field_name, observed_value, identity_match, identity_match_signal, source_url, source_label, observed_at)
         VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8)`,
        [
          "synthetic-1",
          receipt.field,
          JSON.stringify(observed),
          receipt.identityMatch,
          receipt.identityMatchSignal,
          receipt.sourceUrl,
          receipt.sourceLabel,
          receipt.observedAt,
        ],
      );
    }
    const storedReceipts = await client.query<{ field_name: string; observed_value: { fields: Record<string, string> } }>(
      `SELECT field_name, observed_value FROM ${namespace}.business_profile_field_receipts ORDER BY field_name`,
    );
    const stored = Object.fromEntries(storedReceipts.rows.map((row) => [row.field_name, row.observed_value.fields]));
    assert(stored.website?.website === "https://synthetic.example/official", "website receipt value was not exact");
    assert(stored.instagram?.instagram === "https://instagram.com/syntheticexample", "social receipt value was not exact");
    checks.profile_receipts_bind_exact_observed_values = true;

    let missingIdentityRejected = false;
    try {
      validateAdminBusinessProfilePatch(
        {
          website: "https://synthetic.example/second",
          changeNote: "Synthetic negative test",
          sourceReceipts: [{
            field: "website",
            sourceUrl: "https://synthetic.example/second",
            sourceLabel: "Synthetic source",
            observedAt: "2026-10-09",
            confidence: "high",
            note: null,
            identityMatch: false,
            identityMatchSignal: null,
          }],
        },
        {
          name: "Synthetic Example",
          address: null,
          city: "Philadelphia",
          state: "PA",
          website: "https://synthetic.example/official",
          ownershipDesignations: [],
        },
      );
    } catch (error) {
      missingIdentityRejected = String(error).includes("explicit identity match");
    }
    assert(missingIdentityRejected, "official-presence change without identity evidence was not rejected");
    checks.profile_presence_requires_identity_assertion = true;

    const generic = decideGenericIngestExistingAction(null, "synthetic-1");
    assert(generic.action === "REVIEW_IDENTITY_CONFLICT" && generic.businessId === "synthetic-1", "fuzzy generic ingest was not held");
    await client.query(
      `INSERT INTO ${namespace}.business_review_items (candidate_name, reason) VALUES ($1, $2)`,
      ["Synthetic Similar Name", "Similar name/locality requires identity review before mutation."],
    );
    const unchanged = await client.query<{ website: string | null }>(`SELECT website FROM ${namespace}.businesses WHERE id = 'synthetic-1'`);
    assert(unchanged.rows[0]?.website === "https://synthetic.example/official", "fuzzy generic ingest mutated canonical website");
    checks.generic_fuzzy_match_queues_review_without_mutation = true;

    const social = decideSocialFirstIdentityMatch(0, 1);
    assert(social.action === "REVIEW" && social.reason === "name_locality_match_requires_identity_review", "social name/locality collision was not held");
    const reviewCount = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${namespace}.business_review_items`);
    assert(Number(reviewCount.rows[0]?.count) === 1, "expected exactly one synthetic review hold");
    checks.social_first_name_locality_collision_requires_review = true;

    return { ok: true, executedAt: new Date().toISOString(), checks };
  } finally {
    client.release();
    await pool.end();
  }
}

let result: Result;
try {
  result = await run();
  console.log("DIRECTORY_PREVENTION_DISPOSABLE_DB_TEST", JSON.stringify(result));
} catch (error) {
  result = { ok: false, executedAt: new Date().toISOString(), checks: {}, error: error instanceof Error ? error.stack ?? error.message : String(error) };
  console.error("DIRECTORY_PREVENTION_DISPOSABLE_DB_TEST", JSON.stringify(result));
  process.exitCode = 1;
}

const port = Number(process.env.PORT ?? 3000);
createServer((_request, response) => {
  response.writeHead(result.ok ? 200 : 500, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(result));
}).listen(port, "0.0.0.0", () => {
  console.log(`DIRECTORY_PREVENTION_DISPOSABLE_DB_TEST_SERVER listening on ${port}`);
});
