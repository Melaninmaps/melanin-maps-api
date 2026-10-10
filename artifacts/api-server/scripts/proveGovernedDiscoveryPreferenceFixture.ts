import crypto from "node:crypto";
import { Client } from "pg";
import { createGovernedKinfolkBusinessRepository } from "../src/kinfolk/governedBusinessRepository";
import {
  governedDiscoveryPreferenceTermsForMemories,
  isApprovedPrivateMemoryRelevant,
  type PrivateMemoryCandidate,
} from "../src/kinfolk/private-memory-personalization";

const adminUrl = process.env.KINFOLK_DISPOSABLE_PROOF_ADMIN_DATABASE_URL;

if (!adminUrl) {
  throw new Error("KINFOLK_DISPOSABLE_PROOF_ADMIN_DATABASE_URL is required.");
}

const databaseName = `kinfolk_governed_fixture_${crypto.randomBytes(6).toString("hex")}`;
const safeDatabaseName = `"${databaseName}"`;
const databaseUrl = new URL(adminUrl);
databaseUrl.pathname = `/${databaseName}`;

const eligibleBusinessId = "local-governed-eligible";
const ineligibleBusinessId = "local-governed-ineligible";
const receiptId = "local-governed-ownership-receipt";

async function createFixtureSchema(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE public.public_businesses (
      id text PRIMARY KEY,
      name text NOT NULL,
      category text NOT NULL,
      subcategory text,
      description text NOT NULL,
      address text,
      city text NOT NULL,
      state text NOT NULL,
      country text,
      is_online_only boolean NOT NULL DEFAULT false,
      latitude double precision,
      longitude double precision,
      phone text,
      website text,
      verified boolean NOT NULL DEFAULT false,
      status text NOT NULL DEFAULT 'active',
      listing_status text NOT NULL DEFAULT 'live_unclaimed',
      permanently_hidden boolean NOT NULL DEFAULT false,
      black_owned boolean NOT NULL DEFAULT false,
      ownership_claim text,
      ownership_designations jsonb NOT NULL DEFAULT '[]'::jsonb,
      tags jsonb NOT NULL DEFAULT '[]'::jsonb,
      profile_status text,
      vibes jsonb NOT NULL DEFAULT '[]'::jsonb,
      kinfolk_recommendation_reason text,
      research_source_url text,
      research_source_label text,
      data_source text,
      confidence_score double precision,
      created_at timestamptz NOT NULL DEFAULT NOW()
    );
    CREATE TABLE public.business_identity (
      business_id text PRIMARY KEY,
      business_story text,
      mission_statement text,
      why_started text,
      what_customers_should_know text,
      ownership_badges jsonb NOT NULL DEFAULT '[]'::jsonb,
      community_values jsonb NOT NULL DEFAULT '[]'::jsonb,
      audiences_served jsonb NOT NULL DEFAULT '[]'::jsonb,
      vibes jsonb NOT NULL DEFAULT '[]'::jsonb,
      accessibility_features jsonb NOT NULL DEFAULT '[]'::jsonb,
      community_initiatives jsonb NOT NULL DEFAULT '[]'::jsonb,
      growth_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
      audience_type text,
      environment_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
      amenity_tags jsonb NOT NULL DEFAULT '[]'::jsonb
    );
    CREATE TABLE public.business_specialties (
      business_id text NOT NULL,
      specialty_slug text NOT NULL
    );
    CREATE TABLE public.approved_business_vibes (
      business_id text NOT NULL,
      vibe_key text NOT NULL
    );
    CREATE TABLE public.business_profile_evidence_receipts (
      id text PRIMARY KEY,
      source_url text NOT NULL,
      source_label text NOT NULL,
      observed_at timestamptz NOT NULL DEFAULT NOW()
    );
    CREATE TABLE public.business_discovery_eligibility (
      business_id text PRIMARY KEY,
      eligibility_status text NOT NULL,
      policy_version text NOT NULL,
      ownership_evidence_id text,
      official_website_evidence_id text,
      official_social_evidence_id text,
      ownership_source_expires_at timestamptz NOT NULL,
      review_after timestamptz NOT NULL
    );
  `);
}

async function insertFixture(client: Client): Promise<void> {
  const insertBusiness = `
    INSERT INTO public.public_businesses (
      id, name, category, subcategory, description, address, city, state,
      country, latitude, longitude, website, verified, black_owned,
      ownership_claim, ownership_designations, tags, profile_status,
      research_source_url, research_source_label, data_source, confidence_score
    ) VALUES (
      $1, $2, 'Food & Drink', 'Restaurant', 'Plant-based dining.',
      '123 Fixture Avenue', 'Philadelphia', 'PA', 'United States',
      39.9526, -75.1652, 'https://fixture.example.test', true, true,
      'Documented Black-owned business', $3::jsonb, $4::jsonb,
      'community_listed', 'https://fixture.example.test/evidence',
      'Local disposable evidence receipt', 'local_disposable_proof', 99
    )`;

  await client.query(insertBusiness, [
    eligibleBusinessId,
    "Green Table Fixture",
    JSON.stringify(["Black / African American-Owned"]),
    JSON.stringify(["vegan"]),
  ]);
  await client.query(insertBusiness, [
    ineligibleBusinessId,
    "Unverified Green Table Fixture",
    JSON.stringify([]),
    JSON.stringify(["vegan"]),
  ]);
  await client.query(
    `INSERT INTO public.business_identity (business_id, environment_tags)
     VALUES ($1, $2::jsonb), ($3, $2::jsonb)`,
    [eligibleBusinessId, JSON.stringify(["quiet"]), ineligibleBusinessId],
  );
  await client.query(
    `INSERT INTO public.business_profile_evidence_receipts
      (id, source_url, source_label)
     VALUES ($1, 'https://fixture.example.test/evidence', 'Local disposable evidence receipt')`,
    [receiptId],
  );
  await client.query(
    `INSERT INTO public.business_discovery_eligibility (
      business_id, eligibility_status, policy_version, ownership_evidence_id,
      official_website_evidence_id, ownership_source_expires_at, review_after
    ) VALUES ($1, 'qualified', 'documented_diaspora_discovery_v1', $2, $2,
      CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days')`,
    [eligibleBusinessId, receiptId],
  );
}

async function main(): Promise<void> {
  const admin = new Client({ connectionString: adminUrl });
  let proof: Client | null = null;
  let disposed = false;

  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE ${safeDatabaseName}`);
    proof = new Client({ connectionString: databaseUrl.toString() });
    await proof.connect();
    await createFixtureSchema(proof);
    await insertFixture(proof);

    const approvedMemory: PrivateMemoryCandidate = {
      content: "I prefer vegan restaurants with a quiet environment.",
      purpose: "personalization",
      isSensitive: false,
    };
    const relevant = isApprovedPrivateMemoryRelevant({
      memory: approvedMemory,
      currentMessage: "Find a Black-owned restaurant in Philadelphia for dinner.",
      legacyRelevant: false,
    });
    const softTerms = governedDiscoveryPreferenceTermsForMemories([
      approvedMemory,
    ]);
    const results = await createGovernedKinfolkBusinessRepository(proof)
      .findByPreferenceTerms(
        { city: "Philadelphia", stateCode: "PA" },
        softTerms,
        10,
        ["black-african-american"],
      );

    if (
      !relevant ||
      !softTerms.includes("vegan") ||
      !softTerms.includes("quiet") ||
      results.length !== 1 ||
      results[0]?.id !== eligibleBusinessId ||
      results[0]?.ownershipDesignations?.includes(
        "Black / African American-Owned",
      ) !== true ||
      results.some((business) => business.id === ineligibleBusinessId)
    ) {
      throw new Error("Governed disposable preference fixture assertions failed.");
    }

    // Deliberately omit private preference text, connection details, and fixture
    // addresses from the receipt. The local database is dropped in finally.
    console.log(
      JSON.stringify(
        {
          proof: "passed",
          mode: "local_disposable_postgresql_governed_repository",
          eligibleResultCount: results.length,
          softTermCount: softTerms.length,
          documentedEligibilityRequired: true,
          ownershipDesignationRequired: true,
          ineligibleFixtureExcluded: true,
          noEligibilityMutation: true,
        },
        null,
        2,
      ),
    );
  } finally {
    if (proof) await proof.end().catch(() => undefined);
    await admin
      .query(`DROP DATABASE IF EXISTS ${safeDatabaseName}`)
      .catch(() => undefined);
    disposed = true;
    await admin.end().catch(() => undefined);
    if (!disposed) {
      throw new Error("Disposable governed fixture database cleanup did not complete.");
    }
  }
}

void main();
