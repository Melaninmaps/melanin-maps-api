import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { Client } from "pg";
import request from "supertest";

/**
 * Disposable, local PostgreSQL acceptance for Kinfolk's actual HTTP route.
 *
 * This harness creates no user-facing content, makes no provider request, and
 * destroys the complete temporary cluster at the end. It proves the catalog
 * query, documented-evidence gate, ownership parser, service hard constraints,
 * response serialization, and medical-care routing without mocks.
 */
const POSTGRES_BIN = "/usr/lib/postgresql/16/bin";
const tempRoot = mkdtempSync(join(tmpdir(), "mwm-kinfolk-discovery-v1-"));
const dataDirectory = join(tempRoot, "postgres");
const socketDirectory = join(tempRoot, "socket");
const port = 57500 + (process.pid % 400);
const databaseUrl = `postgres://mwm_discovery@127.0.0.1:${port}/postgres`;
let client: Client | undefined;

function runPostgres(...args: string[]) {
  execFileSync(join(POSTGRES_BIN, args.shift()!), args, { stdio: "ignore" });
}

async function installSchema(db: Client) {
  await db.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE users (
      id varchar(255) PRIMARY KEY,
      email varchar(255),
      first_name varchar(255),
      last_name varchar(255),
      profile_image_url varchar(255),
      stripe_customer_id varchar(255),
      stripe_subscription_id varchar(255),
      push_token varchar(255),
      is_load_test boolean NOT NULL DEFAULT false,
      approved boolean NOT NULL DEFAULT false,
      account_status varchar(32) NOT NULL DEFAULT 'active',
      lifecycle_updated_at timestamptz,
      lifecycle_updated_by varchar(255),
      lifecycle_reason varchar(500),
      role varchar(32) NOT NULL DEFAULT 'user',
      member_type varchar(32) DEFAULT 'individual',
      trial_ends_at timestamptz,
      trial_reminder_3day_sent_at timestamptz,
      trial_reminder_1day_sent_at timestamptz,
      trial_expired_email_sent_at timestamptz,
      win_back_email_sent_at timestamptz,
      founding_member_number integer,
      username varchar(30),
      referral_code varchar(255),
      referral_count integer NOT NULL DEFAULT 0,
      referred_by_code varchar(255),
      industry varchar(100),
      job_title varchar(150),
      date_of_birth timestamp,
      kinfolk_query_month varchar(7),
      kinfolk_queries_this_month integer NOT NULL DEFAULT 0,
      trust_level integer NOT NULL DEFAULT 1,
      reputation_score integer NOT NULL DEFAULT 0,
      identity_verified boolean NOT NULL DEFAULT false,
      identity_verified_at timestamptz,
      policy_violations_count integer NOT NULL DEFAULT 0,
      helpful_reviews_count integer NOT NULL DEFAULT 0,
      is_private boolean NOT NULL DEFAULT false,
      followers_count integer NOT NULL DEFAULT 0,
      following_count integer NOT NULL DEFAULT 0,
      bio varchar(300),
      home_city varchar(100),
      home_state varchar(2),
      password_hash varchar(255),
      must_change_password boolean NOT NULL DEFAULT false,
      email_verified boolean NOT NULL DEFAULT false,
      email_verification_token varchar(255),
      email_verification_expires timestamptz,
      agree_to_terms boolean NOT NULL DEFAULT false,
      show_city boolean NOT NULL DEFAULT true,
      allow_dm boolean NOT NULL DEFAULT true,
      display_name_format varchar(32) DEFAULT 'full',
      is_influencer boolean NOT NULL DEFAULT false,
      is_business_owner boolean NOT NULL DEFAULT false,
      is_content_creator boolean NOT NULL DEFAULT false,
      is_community_organizer boolean NOT NULL DEFAULT false,
      profile_setup_complete boolean NOT NULL DEFAULT false,
      apple_id varchar(255),
      apple_refresh_token text,
      phone_number varchar(20),
      phone_verified boolean NOT NULL DEFAULT false,
      notif_events boolean NOT NULL DEFAULT true,
      notif_business boolean NOT NULL DEFAULT true,
      notif_messages boolean NOT NULL DEFAULT true,
      notif_reviews boolean NOT NULL DEFAULT true,
      notif_community boolean NOT NULL DEFAULT false,
      notif_promotions boolean NOT NULL DEFAULT false,
      notif_digest boolean NOT NULL DEFAULT true,
      notif_tips boolean NOT NULL DEFAULT false,
      notif_post_nudges boolean NOT NULL DEFAULT true,
      quiet_hours_enabled boolean NOT NULL DEFAULT true,
      quiet_hours_from varchar(10) NOT NULL DEFAULT '10:00 PM',
      quiet_hours_until varchar(10) NOT NULL DEFAULT '8:00 AM',
      marketing_opt_out boolean NOT NULL DEFAULT false,
      failed_login_attempts integer NOT NULL DEFAULT 0,
      locked_until timestamptz,
      tester_status varchar(32),
      tester_access_source varchar(32),
      tester_granted_at timestamptz,
      tester_granted_by varchar(255),
      testing_entitlement_ends_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE user_settings (
      user_id varchar(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      kinfolk_memory_enabled boolean NOT NULL DEFAULT true,
      kinfolk_continuity_enabled boolean NOT NULL DEFAULT false,
      kinfolk_continuity_disclosure_decision varchar(32),
      kinfolk_continuity_disclosure_version varchar(64),
      kinfolk_continuity_disclosed_at timestamptz,
      kinfolk_continuity_updated_at timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE user_preferences (
      user_id varchar(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      recommendation_life_stage varchar(20) NOT NULL DEFAULT 'unspecified',
      favorite_categories jsonb DEFAULT '[]'::jsonb,
      favorite_cities jsonb DEFAULT '[]'::jsonb,
      avoid_categories jsonb DEFAULT '[]'::jsonb,
      budget_range varchar(20) DEFAULT 'any',
      trip_style jsonb DEFAULT '[]'::jsonb,
      travel_companion varchar(30) DEFAULT 'solo',
      dietary_notes text,
      communication_style varchar(20) DEFAULT 'friendly',
      personality_mode varchar(30) DEFAULT 'neighborhood_guide',
      emoji_level varchar(10) DEFAULT 'some',
      humor_level varchar(10) DEFAULT 'light',
      cultural_interests jsonb DEFAULT '[]'::jsonb,
      know_before_you_go boolean DEFAULT true,
      regional_flavor varchar(30) DEFAULT 'off',
      kinfolk_voice varchar(20) NOT NULL DEFAULT 'onyx',
      auto_speak boolean NOT NULL DEFAULT false,
      preferred_ownership_types jsonb DEFAULT '[]'::jsonb,
      support_lens_mode varchar(40) NOT NULL DEFAULT 'all_businesses',
      social_video_platforms jsonb DEFAULT '[]'::jsonb,
      community_feed_display varchar(20) DEFAULT 'mixed',
      diaspora_countries jsonb DEFAULT '[]'::jsonb,
      communities jsonb DEFAULT '[]'::jsonb,
      cultures jsonb DEFAULT '[]'::jsonb,
      preferred_languages jsonb DEFAULT '[]'::jsonb,
      personalization_context_completed_at timestamptz,
      use_member_context_by_default boolean NOT NULL DEFAULT false,
      lifestyle_services jsonb DEFAULT '[]'::jsonb,
      search_history jsonb DEFAULT '[]'::jsonb,
      aave_level smallint DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE kinfolk_delivery_profiles (
      user_id varchar(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      detail_level varchar(20) NOT NULL DEFAULT 'standard',
      tone_preference varchar(20) NOT NULL DEFAULT 'default'
    );
    CREATE TABLE kinfolk_sessions (
      id varchar(255) PRIMARY KEY,
      user_id varchar(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title varchar(255),
      destination varchar(255),
      vibes jsonb DEFAULT '[]'::jsonb,
      messages jsonb DEFAULT '[]'::jsonb,
      share_id varchar(64),
      archived_at timestamptz,
      pinned_at timestamptz,
      is_pinned boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE kinfolk_private_memories (
      id varchar(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id varchar(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content text NOT NULL,
      purpose varchar(64) NOT NULL,
      source_session_id varchar(255),
      is_sensitive boolean NOT NULL DEFAULT false,
      consent_granted_at timestamptz NOT NULL DEFAULT now(),
      sensitive_consent_granted_at timestamptz,
      sensitive_encrypted_content text,
      sensitive_encryption_key_id varchar(64),
      sensitive_restricted boolean NOT NULL DEFAULT true,
      expires_at timestamptz,
      paused_at timestamptz,
      revoked_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE public_businesses (
      id varchar(255) PRIMARY KEY,
      name text NOT NULL,
      category text NOT NULL,
      subcategory text,
      description text NOT NULL,
      address text,
      city text NOT NULL,
      state text,
      country text DEFAULT 'US',
      is_online_only boolean NOT NULL DEFAULT false,
      latitude numeric,
      longitude numeric,
      phone text,
      website text,
      verified boolean NOT NULL DEFAULT false,
      listing_status text,
      status text DEFAULT 'active',
      black_owned boolean NOT NULL DEFAULT false,
      ownership_claim text,
      ownership_designations jsonb NOT NULL DEFAULT '[]'::jsonb,
      tags jsonb NOT NULL DEFAULT '[]'::jsonb,
      vibes jsonb NOT NULL DEFAULT '[]'::jsonb,
      profile_status text,
      kinfolk_recommendation_reason text,
      research_source_url text,
      research_source_label text,
      data_source text,
      confidence_score integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE business_identity (
      business_id varchar(255) PRIMARY KEY,
      business_story text,
      mission_statement text,
      why_started text,
      what_customers_should_know text,
      ownership_badges jsonb DEFAULT '[]'::jsonb,
      community_values jsonb DEFAULT '[]'::jsonb,
      audiences_served jsonb DEFAULT '[]'::jsonb,
      vibes jsonb DEFAULT '[]'::jsonb,
      accessibility_features jsonb DEFAULT '[]'::jsonb,
      community_initiatives jsonb DEFAULT '[]'::jsonb,
      growth_goals jsonb DEFAULT '[]'::jsonb,
      audience_type text,
      environment_tags jsonb DEFAULT '[]'::jsonb,
      amenity_tags jsonb DEFAULT '[]'::jsonb
    );
    CREATE TABLE business_specialties (
      business_id varchar(255) NOT NULL,
      specialty_slug text NOT NULL
    );
    CREATE TABLE approved_business_vibes (
      business_id varchar(255) NOT NULL,
      vibe_key text NOT NULL
    );
    CREATE TABLE business_profile_evidence_receipts (
      id varchar(255) PRIMARY KEY,
      source_url text,
      source_label text,
      observed_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE business_discovery_eligibility (
      business_id varchar(255) NOT NULL,
      eligibility_status text NOT NULL,
      policy_version text NOT NULL,
      identity_evidence_id varchar(255),
      ownership_evidence_id varchar(255),
      official_website_evidence_id varchar(255),
      official_social_evidence_id varchar(255),
      map_pin_evidence_id varchar(255),
      ownership_source_expires_at timestamptz NOT NULL,
      review_after timestamptz NOT NULL
    );
    CREATE TABLE published_map_entities (
      id varchar(255) PRIMARY KEY,
      entity_kind text,
      title text,
      summary text,
      city text,
      state_region text,
      detail_url text,
      website_url text,
      source_url text,
      published_at timestamptz,
      archived_at timestamptz
    );
  `);
}

type Fixture = Readonly<{
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  tags: readonly string[];
  designations: readonly string[];
}>;

async function seedEligibleBusiness(db: Client, fixture: Fixture) {
  const ownershipReceipt = `${fixture.id}-ownership`;
  const officialReceipt = `${fixture.id}-official`;
  await db.query(
    `INSERT INTO public_businesses (
      id, name, category, subcategory, description, address, city, state,
      latitude, longitude, website, verified, listing_status, black_owned,
      ownership_designations, tags, profile_status, confidence_score
    ) VALUES ($1,$2,$3,$4,$5,'100 Test Street','Philadelphia','PA',39.9526,-75.1652,$6,true,'live_claimed',$7,$8::jsonb,$9::jsonb,'claimed',90)`,
    [
      fixture.id,
      fixture.name,
      fixture.category,
      fixture.subcategory,
      fixture.description,
      "https://www.example.com",
      fixture.designations.some((item) => /Black|Caribbean/i.test(item)),
      JSON.stringify(fixture.designations),
      JSON.stringify(fixture.tags),
    ],
  );
  await db.query(
    `INSERT INTO business_profile_evidence_receipts (id, source_url, source_label)
     VALUES ($1,$2,'Synthetic documented source'), ($3,$4,'Synthetic official presence')`,
    [
      ownershipReceipt,
      "https://www.iana.org/domains/reserved",
      officialReceipt,
      "https://www.example.com",
    ],
  );
  await db.query(
    `INSERT INTO business_discovery_eligibility (
      business_id, eligibility_status, policy_version, identity_evidence_id,
      ownership_evidence_id, official_website_evidence_id,
      ownership_source_expires_at, review_after
    ) VALUES ($1,'qualified','documented_diaspora_discovery_v1',$2,$3,$4,now() + interval '30 days',now() + interval '30 days')`,
    [fixture.id, `${fixture.id}-identity`, ownershipReceipt, officialReceipt],
  );
}

async function main() {
  try {
    console.error("[acceptance] starting disposable PostgreSQL");
    runPostgres("initdb", "-D", dataDirectory, "--username=mwm_discovery", "--auth=trust", "--no-locale", "--encoding=UTF8");
    mkdirSync(socketDirectory);
    runPostgres("pg_ctl", "-D", dataDirectory, "-l", join(tempRoot, "postgres.log"), "-o", `-F -p ${port} -h 127.0.0.1 -k ${socketDirectory}`, "-w", "start");
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await installSchema(client);

    const memberId = "disposable-governed-discovery-member";
    await client.query("INSERT INTO users (id, date_of_birth) VALUES ($1, DATE '1980-01-01')", [memberId]);
    await client.query("INSERT INTO user_settings (user_id, kinfolk_memory_enabled) VALUES ($1, true)", [memberId]);
    await client.query("INSERT INTO user_preferences (user_id, support_lens_mode) VALUES ($1, 'all_businesses')", [memberId]);
    await client.query("INSERT INTO kinfolk_delivery_profiles (user_id) VALUES ($1)", [memberId]);

    const ownership = ["Black / African American-Owned"];
    await Promise.all([
      seedEligibleBusiness(client, {
        id: "custom-wig-maker", name: "Custom Crown Studio", category: "Beauty & Wellness", subcategory: "Hair Salon",
        description: "Custom wigs are made, fitted, and styled by appointment.", tags: ["custom wig maker"], designations: ownership,
      }),
      seedEligibleBusiness(client, {
        id: "wig-install-only", name: "Install Only Studio", category: "Beauty & Wellness", subcategory: "Hair Salon",
        description: "Wig installation and styling appointments.", tags: ["wig installation"], designations: ownership,
      }),
      seedEligibleBusiness(client, {
        id: "loc-maintenance", name: "Retwist Care Studio", category: "Beauty & Wellness", subcategory: "Natural Hair",
        description: "Loc maintenance and retwist appointments.", tags: ["loc maintenance"], designations: ownership,
      }),
      seedEligibleBusiness(client, {
        id: "natural-style-only", name: "Natural Style Studio", category: "Beauty & Wellness", subcategory: "Natural Hair",
        description: "Natural-hair styling appointments.", tags: ["natural hair"], designations: ownership,
      }),
      seedEligibleBusiness(client, {
        id: "wash-detangle-braids", name: "Careful Braids Studio", category: "Beauty & Wellness", subcategory: "Braiding",
        description: "Full wash and detangle plus braiding appointments.", tags: ["wash and detangle", "braiding"], designations: ownership,
      }),
      seedEligibleBusiness(client, {
        id: "braids-only", name: "Fast Braids Studio", category: "Beauty & Wellness", subcategory: "Braiding",
        description: "Braiding appointments.", tags: ["braiding"], designations: ownership,
      }),
      seedEligibleBusiness(client, {
        id: "dine-in", name: "Neighborhood Dining Room", category: "Food & Drink", subcategory: "Restaurant",
        description: "Dine-in table service nightly.", tags: ["dine-in"], designations: ownership,
      }),
      seedEligibleBusiness(client, {
        id: "delivery-only", name: "Delivery Kitchen", category: "Food & Drink", subcategory: "Restaurant",
        description: "Delivery and pickup only.", tags: ["delivery"], designations: ownership,
      }),
      seedEligibleBusiness(client, {
        id: "caribbean-owned", name: "Island Owner Table", category: "Food & Drink", subcategory: "Restaurant",
        description: "Caribbean cuisine with dine-in service.", tags: ["Caribbean cuisine", "dine-in"], designations: ["Caribbean / West Indian-Owned"],
      }),
      seedEligibleBusiness(client, {
        id: "caribbean-cuisine-only", name: "Caribbean Cuisine Only", category: "Food & Drink", subcategory: "Restaurant",
        description: "Caribbean cuisine with dine-in service.", tags: ["Caribbean cuisine", "dine-in"], designations: ownership,
      }),
      seedEligibleBusiness(client, {
        id: "unsafe-listing", name: "Unsafe Listing", category: "Beauty & Wellness", subcategory: "Hair Salon",
        description: "This listing promotes a swastika symbol.", tags: ["hair salon"], designations: ownership,
      }),
    ]);
    await client.query("INSERT INTO business_specialties (business_id, specialty_slug) VALUES ('custom-wig-maker','custom-wig-maker'), ('loc-maintenance','loc-maintenance'), ('wash-detangle-braids','wash-and-detangle'), ('wash-detangle-braids','braiding'), ('dine-in','dine-in'), ('caribbean-owned','caribbean-cuisine'), ('caribbean-cuisine-only','caribbean-cuisine')");

    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = databaseUrl;
    process.env.KINFOLK_EXPLICIT_MEMBER_MEMORY_ENABLED = "true";
    process.env.MWM_DOCUMENTED_DISCOVERY_POLICY_MODE = "active";

    const { default: kinfolkRouter } = await import("../routes/kinfolk");
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const syntheticRequest = req as unknown as {
        user?: { id: string };
        log?: { error: () => void; warn: () => void; info: () => void };
      };
      syntheticRequest.user = { id: memberId };
      syntheticRequest.log = {
        error: (...args: unknown[]) => console.error("[acceptance route error]", args.map((arg) => {
          if (arg instanceof Error) return {
            code: (arg as Error & { code?: unknown }).code ?? null,
            errorClass: arg.name,
            message: arg.message,
          };
          if (arg && typeof arg === "object") {
            const detail = arg as { err?: { code?: unknown; message?: unknown; name?: unknown }; code?: unknown; message?: unknown };
            return {
              code: detail.err?.code ?? detail.code ?? null,
              errorClass: detail.err?.name ?? null,
              message: detail.err?.message ?? detail.message ?? null,
            };
          }
          return { code: null, errorClass: null, message: null };
        })),
        warn: () => undefined,
        info: () => undefined,
      };
      next();
    });
    app.use("/api", kinfolkRouter);

    const query = async (message: string) => {
      const response = await request(app)
        .post("/api/kinfolk/chat")
        .send({ message, cityHint: "Philadelphia, PA" });
      assert.equal(response.status, 200, "governed discovery route returns an answer");
      assert.equal(response.body.responseMeta?.answerMode, "governed_discovery", "actual route uses governed discovery");
      return response.body as {
        recommendations?: { businesses?: Array<{ id: string }> } | null;
        discovery?: { platformBusinesses?: Array<{ id: string }> };
      };
    };
    const ids = (response: { discovery?: { platformBusinesses?: Array<{ id: string }> } }) => response.discovery?.platformBusinesses?.map((business) => business.id) ?? [];

    const customWigs = await query("Find a custom wig maker in Philadelphia");
    assert.deepEqual(ids(customWigs), ["custom-wig-maker"], "custom wig request excludes installation-only listing");

    const locMaintenance = await query("Find loc maintenance in Philadelphia");
    assert.deepEqual(ids(locMaintenance), ["loc-maintenance"], "loc maintenance excludes generic natural-hair listing");

    const washDetangle = await query("Find a full wash and detangle with braiding in Philadelphia");
    assert.deepEqual(ids(washDetangle), ["wash-detangle-braids"], "wash-and-detangle request excludes braids-only listing");

    const dineIn = await query("Find a dine-in restaurant in Philadelphia");
    assert.deepEqual(
      ids(dineIn).sort(),
      ["dine-in", "caribbean-cuisine-only", "caribbean-owned"].sort(),
      "dine-in request excludes delivery-only listing",
    );

    const caribbeanOwned = await query("Find Caribbean-owned restaurants in Philadelphia");
    assert.deepEqual(ids(caribbeanOwned), ["caribbean-owned"], "explicit Caribbean ownership excludes cuisine-only listing");

    const safeSalonResults = await query("Find a hair salon in Philadelphia");
    assert.equal(
      ids(safeSalonResults).includes("unsafe-listing"),
      false,
      "hate-symbol listing never surfaces as a normal discovery result",
    );

    const directDental = await request(app)
      .post("/api/kinfolk/chat")
      .send({ message: "Find a pediatric dentist in Philadelphia for my child.", cityHint: "Philadelphia, PA" });
    if (directDental.status !== 200) {
      console.error("[acceptance pediatric dental response]", {
        status: directDental.status,
        code: typeof directDental.body?.code === "string" ? directDental.body.code : null,
        error: typeof directDental.body?.error === "string" ? directDental.body.error : null,
      });
    }
    assert.equal(directDental.status, 200, "pediatric dental route returns authoritative care guidance");
    assert.equal(directDental.body.intentClass, "medical_health", "pediatric dentistry is classified as medical care");
    assert.equal(directDental.body.recommendations, null, "pediatric dental route returns no ordinary business cards");
    assert.equal(
      (directDental.body.sources as Array<{ title?: string }>).some((source) => /American Academy of Pediatric Dentistry/i.test(source.title ?? "")),
      true,
      "pediatric dental route includes the qualified finder",
    );

    console.log(JSON.stringify({
      status: "passed",
      environment: "disposable-local-postgresql-actual-kinfolk-route",
      checks: [
        "custom wig making excludes installation-only salons",
        "loc maintenance excludes generic natural-hair listings",
        "full wash and detangle excludes braids-only listings",
        "dine-in excludes delivery-only listings",
        "explicit Caribbean ownership excludes Caribbean-cuisine-only listings",
        "hate-symbol listing is held out of ordinary discovery",
        "pediatric dental care suppresses ordinary catalog cards and returns a qualified finder",
      ],
    }));
  } finally {
    await client?.end().catch(() => undefined);
    try {
      runPostgres("pg_ctl", "-D", dataDirectory, "-m", "immediate", "-w", "stop");
    } catch {
      // The disposable cluster may not have reached startup after a failed assertion.
    }
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

await main();
