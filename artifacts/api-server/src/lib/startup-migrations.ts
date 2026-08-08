/**
 * Startup migrations — add columns to the production DB that the Drizzle schema
 * defines but that may be missing from older Railway deployments.
 *
 * Every statement uses ADD COLUMN IF NOT EXISTS so it is safe to run on every
 * boot and is idempotent.  Failures are logged but do NOT crash the server —
 * the server starts and existing functionality continues; only the new columns
 * would be absent.
 */
import { randomUUID } from "crypto";
import { pool } from "@workspace/db";
import type { Logger } from "pino";
import { HBCU_COMPLETE_SEED } from "../data/hbcu-complete-seed";
import { CULTURAL_SITES_SEED } from "../data/cultural-sites-seed";
import { NATIONAL_FESTIVALS_SEED } from "../data/national-festivals-seed";
import { NATIONAL_SUNDOWN_TOWNS_SEED } from "../data/national-sundown-towns-seed";
import { SUNDOWN_TOWNS_SEED } from "../data/sundown-towns-seed";
import { DIRECTORY_BUSINESSES_SEED } from "../data/directory-businesses-seed";
import { KNOWLEDGE_LIBRARY_SEED } from "../data/knowledge-library-seed";

const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: "users_trial_reminder_cols",
    sql: `ALTER TABLE users
      ADD COLUMN IF NOT EXISTS trial_reminder_3day_sent_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS trial_reminder_1day_sent_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS trial_expired_email_sent_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS win_back_email_sent_at TIMESTAMPTZ`,
  },
  {
    name: "users_auth_cols",
    sql: `ALTER TABLE users
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS apple_refresh_token TEXT,
      ADD COLUMN IF NOT EXISTS marketing_opt_out BOOLEAN NOT NULL DEFAULT FALSE`,
  },
  {
    name: "users_notif_cols",
    sql: `ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_influencer BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS notif_events BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS notif_business BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS notif_messages BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS notif_reviews BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS notif_community BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS notif_promotions BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS notif_digest BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS notif_tips BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS notif_post_nudges BOOLEAN NOT NULL DEFAULT TRUE`,
  },
  {
    name: "users_quiet_hours_cols",
    sql: `ALTER TABLE users
      ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS quiet_hours_from VARCHAR(10) NOT NULL DEFAULT '10:00 PM',
      ADD COLUMN IF NOT EXISTS quiet_hours_until VARCHAR(10) NOT NULL DEFAULT '8:00 AM'`,
  },
  {
    name: "cultural_sites_tour_guide_cols",
    sql: `ALTER TABLE cultural_sites
      ADD COLUMN IF NOT EXISTS pin_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS visit_tip TEXT,
      ADD COLUMN IF NOT EXISTS listing_status VARCHAR(50) DEFAULT 'staged',
      ADD COLUMN IF NOT EXISTS data_source VARCHAR(100),
      ADD COLUMN IF NOT EXISTS approximate_location BOOLEAN DEFAULT FALSE`,
  },
  {
    name: "cultural_sites_content_cols",
    sql: `ALTER TABLE cultural_sites
      ADD COLUMN IF NOT EXISTS content_note TEXT,
      ADD COLUMN IF NOT EXISTS practical_tips TEXT`,
  },
  {
    name: "cultural_sites_lat_lng_nullable",
    sql: `ALTER TABLE cultural_sites
      ALTER COLUMN latitude DROP NOT NULL,
      ALTER COLUMN longitude DROP NOT NULL`,
  },
  {
    name: "member_agreements_table",
    sql: `CREATE TABLE IF NOT EXISTS member_agreements (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      agreement_version VARCHAR(20) NOT NULL DEFAULT 'v1',
      accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
      platform VARCHAR(20) NOT NULL DEFAULT 'web',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      revoked_at TIMESTAMP
    )`,
  },
  {
    name: "city_launches_table",
    sql: `CREATE TABLE IF NOT EXISTS city_launches (
      id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
      city VARCHAR(100) NOT NULL,
      state VARCHAR(50) NOT NULL,
      slug VARCHAR(120) NOT NULL UNIQUE,
      sequence_order INTEGER NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'planning',
      launch_date TIMESTAMPTZ,
      checklist JSONB NOT NULL DEFAULT '{}',
      notes TEXT,
      rollout_percentage INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "city_launches_auto_advance_col",
    sql: `ALTER TABLE city_launches
      ADD COLUMN IF NOT EXISTS auto_advance BOOLEAN NOT NULL DEFAULT true`,
  },
  {
    name: "city_launch_events_table",
    sql: `CREATE TABLE IF NOT EXISTS city_launch_events (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL,
      recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
      waitlist_size INTEGER NOT NULL DEFAULT 0,
      active_members INTEGER NOT NULL DEFAULT 0,
      businesses_onboarded INTEGER NOT NULL DEFAULT 0,
      events_live INTEGER NOT NULL DEFAULT 0,
      community_posts INTEGER NOT NULL DEFAULT 0,
      UNIQUE (slug, recorded_at)
    )`,
  },
  {
    name: "city_launch_events_index",
    sql: `CREATE INDEX IF NOT EXISTS idx_city_launch_events_slug ON city_launch_events(slug, recorded_at DESC)`,
  },
  {
    name: "events_image_url_col",
    sql: `ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT`,
  },
  {
    // One-time promotion: grant admin role to the founder's production accounts.
    // Uses email list so it's safe on dev (no matching rows = no-op).
    // Idempotent: WHERE role != 'admin' means repeat runs touch nothing.
    name: "founder_admin_promotion",
    sql: `UPDATE users
      SET role = 'admin'
      WHERE lower(email) IN (
        'tlindsay428@yahoo.com',
        'tlindsay428@gmail.com',
        'tlindsay428@aol.com',
        'bigdot6017@gmail.com',
        'kaylacardwell3@gmail.com'
      ) AND role != 'admin'`,
  },
  {
    name: "waitlist_referral_system_cols",
    sql: `ALTER TABLE waitlist_signups
      ADD COLUMN IF NOT EXISTS niche VARCHAR(100),
      ADD COLUMN IF NOT EXISTS platforms TEXT,
      ADD COLUMN IF NOT EXISTS safety_priorities TEXT`,
  },
  {
    name: "business_suggestions_table",
    sql: `CREATE TABLE IF NOT EXISTS business_suggestions (
      id SERIAL PRIMARY KEY,
      waitlist_id VARCHAR(36) REFERENCES waitlist_signups(id),
      referral_code VARCHAR(50),
      business_name VARCHAR(255),
      category VARCHAR(100),
      city VARCHAR(100),
      website VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    name: "waitlist_safety_reports_table",
    sql: `CREATE TABLE IF NOT EXISTS waitlist_safety_reports (
      id SERIAL PRIMARY KEY,
      waitlist_id VARCHAR(36) REFERENCES waitlist_signups(id),
      referral_code VARCHAR(50),
      concern_type VARCHAR(100),
      description TEXT,
      city VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    name: "city_launches_seed",
    sql: `INSERT INTO city_launches (city, state, slug, sequence_order, status, checklist)
      VALUES
        ('Philadelphia', 'PA', 'philadelphia', 1, 'live', '{"pre_launch":{"businesses_seeded":true,"cultural_sites":true,"historical_sites":true,"community_resources":true,"events":true,"city_imagery":true,"moderation_review":true,"kinfolk_city_context":true,"search_validation":true,"map_validation":true,"analytics_enabled":true},"community":{"founding_members":true,"founding_businesses":true,"ambassadors":false,"creators":false,"volunteers":false,"local_organizations":false},"marketing":{"city_landing_page":true,"launch_announcement":true,"social_assets":false,"founder_interview_prompts":false,"local_press_checklist":false,"city_hashtags":false,"referral_campaign":false},"operations":{"feature_flags":true,"rollout_percentage":true,"monitoring":true,"crash_dashboard":true,"waitlist_activation":true,"rollback_plan":false}}'),
        ('Washington', 'DC', 'washington-dc', 2, 'planning', '{"pre_launch":{"businesses_seeded":false,"cultural_sites":false,"historical_sites":false,"community_resources":false,"events":false,"city_imagery":false,"moderation_review":false,"kinfolk_city_context":false,"search_validation":false,"map_validation":false,"analytics_enabled":false},"community":{"founding_members":false,"founding_businesses":false,"ambassadors":false,"creators":false,"volunteers":false,"local_organizations":false},"marketing":{"city_landing_page":false,"launch_announcement":false,"social_assets":false,"founder_interview_prompts":false,"local_press_checklist":false,"city_hashtags":false,"referral_campaign":false},"operations":{"feature_flags":false,"rollout_percentage":false,"monitoring":false,"crash_dashboard":false,"waitlist_activation":false,"rollback_plan":false}}'),
        ('Richmond', 'VA', 'richmond', 3, 'planning', '{"pre_launch":{"businesses_seeded":false,"cultural_sites":false,"historical_sites":false,"community_resources":false,"events":false,"city_imagery":false,"moderation_review":false,"kinfolk_city_context":false,"search_validation":false,"map_validation":false,"analytics_enabled":false},"community":{"founding_members":false,"founding_businesses":false,"ambassadors":false,"creators":false,"volunteers":false,"local_organizations":false},"marketing":{"city_landing_page":false,"launch_announcement":false,"social_assets":false,"founder_interview_prompts":false,"local_press_checklist":false,"city_hashtags":false,"referral_campaign":false},"operations":{"feature_flags":false,"rollout_percentage":false,"monitoring":false,"crash_dashboard":false,"waitlist_activation":false,"rollback_plan":false}}'),
        ('Charlotte', 'NC', 'charlotte', 4, 'planning', '{"pre_launch":{"businesses_seeded":false,"cultural_sites":false,"historical_sites":false,"community_resources":false,"events":false,"city_imagery":false,"moderation_review":false,"kinfolk_city_context":false,"search_validation":false,"map_validation":false,"analytics_enabled":false},"community":{"founding_members":false,"founding_businesses":false,"ambassadors":false,"creators":false,"volunteers":false,"local_organizations":false},"marketing":{"city_landing_page":false,"launch_announcement":false,"social_assets":false,"founder_interview_prompts":false,"local_press_checklist":false,"city_hashtags":false,"referral_campaign":false},"operations":{"feature_flags":false,"rollout_percentage":false,"monitoring":false,"crash_dashboard":false,"waitlist_activation":false,"rollback_plan":false}}'),
        ('Columbia', 'SC', 'columbia', 5, 'planning', '{"pre_launch":{"businesses_seeded":false,"cultural_sites":false,"historical_sites":false,"community_resources":false,"events":false,"city_imagery":false,"moderation_review":false,"kinfolk_city_context":false,"search_validation":false,"map_validation":false,"analytics_enabled":false},"community":{"founding_members":false,"founding_businesses":false,"ambassadors":false,"creators":false,"volunteers":false,"local_organizations":false},"marketing":{"city_landing_page":false,"launch_announcement":false,"social_assets":false,"founder_interview_prompts":false,"local_press_checklist":false,"city_hashtags":false,"referral_campaign":false},"operations":{"feature_flags":false,"rollout_percentage":false,"monitoring":false,"crash_dashboard":false,"waitlist_activation":false,"rollback_plan":false}}'),
        ('Atlanta', 'GA', 'atlanta', 6, 'planning', '{"pre_launch":{"businesses_seeded":false,"cultural_sites":false,"historical_sites":false,"community_resources":false,"events":false,"city_imagery":false,"moderation_review":false,"kinfolk_city_context":false,"search_validation":false,"map_validation":false,"analytics_enabled":false},"community":{"founding_members":false,"founding_businesses":false,"ambassadors":false,"creators":false,"volunteers":false,"local_organizations":false},"marketing":{"city_landing_page":false,"launch_announcement":false,"social_assets":false,"founder_interview_prompts":false,"local_press_checklist":false,"city_hashtags":false,"referral_campaign":false},"operations":{"feature_flags":false,"rollout_percentage":false,"monitoring":false,"crash_dashboard":false,"waitlist_activation":false,"rollback_plan":false}}'),
        ('Birmingham', 'AL', 'birmingham', 7, 'planning', '{"pre_launch":{"businesses_seeded":false,"cultural_sites":false,"historical_sites":false,"community_resources":false,"events":false,"city_imagery":false,"moderation_review":false,"kinfolk_city_context":false,"search_validation":false,"map_validation":false,"analytics_enabled":false},"community":{"founding_members":false,"founding_businesses":false,"ambassadors":false,"creators":false,"volunteers":false,"local_organizations":false},"marketing":{"city_landing_page":false,"launch_announcement":false,"social_assets":false,"founder_interview_prompts":false,"local_press_checklist":false,"city_hashtags":false,"referral_campaign":false},"operations":{"feature_flags":false,"rollout_percentage":false,"monitoring":false,"crash_dashboard":false,"waitlist_activation":false,"rollback_plan":false}}'),
        ('New Orleans', 'LA', 'new-orleans', 8, 'planning', '{"pre_launch":{"businesses_seeded":false,"cultural_sites":false,"historical_sites":false,"community_resources":false,"events":false,"city_imagery":false,"moderation_review":false,"kinfolk_city_context":false,"search_validation":false,"map_validation":false,"analytics_enabled":false},"community":{"founding_members":false,"founding_businesses":false,"ambassadors":false,"creators":false,"volunteers":false,"local_organizations":false},"marketing":{"city_landing_page":false,"launch_announcement":false,"social_assets":false,"founder_interview_prompts":false,"local_press_checklist":false,"city_hashtags":false,"referral_campaign":false},"operations":{"feature_flags":false,"rollout_percentage":false,"monitoring":false,"crash_dashboard":false,"waitlist_activation":false,"rollback_plan":false}}'),
        ('Houston', 'TX', 'houston', 9, 'planning', '{"pre_launch":{"businesses_seeded":false,"cultural_sites":false,"historical_sites":false,"community_resources":false,"events":false,"city_imagery":false,"moderation_review":false,"kinfolk_city_context":false,"search_validation":false,"map_validation":false,"analytics_enabled":false},"community":{"founding_members":false,"founding_businesses":false,"ambassadors":false,"creators":false,"volunteers":false,"local_organizations":false},"marketing":{"city_landing_page":false,"launch_announcement":false,"social_assets":false,"founder_interview_prompts":false,"local_press_checklist":false,"city_hashtags":false,"referral_campaign":false},"operations":{"feature_flags":false,"rollout_percentage":false,"monitoring":false,"crash_dashboard":false,"waitlist_activation":false,"rollback_plan":false}}')
      ON CONFLICT (slug) DO NOTHING`,
  },
  {
    name: "city_profiles_table",
    sql: `CREATE TABLE IF NOT EXISTS city_profiles (
      id SERIAL PRIMARY KEY,
      city_slug VARCHAR(100) NOT NULL REFERENCES city_launches(slug) ON DELETE CASCADE,
      historical_context TEXT NOT NULL,
      brief_context TEXT NOT NULL,
      why_mwm_here TEXT,
      hero_image_url TEXT,
      key_neighborhoods TEXT[] DEFAULT '{}',
      key_figures TEXT[] DEFAULT '{}',
      migration_era VARCHAR(100),
      cultural_anchors TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(city_slug)
    )`,
  },
  {
    name: "cultural_sites_visit_tip_col",
    sql: `ALTER TABLE cultural_sites ADD COLUMN IF NOT EXISTS visit_tip TEXT`,
  },
  {
    name: "cultural_sites_pin_type_col",
    sql: `ALTER TABLE cultural_sites ADD COLUMN IF NOT EXISTS pin_type VARCHAR(100)`,
  },
  {
    name: "cultural_sites_listing_status_col",
    sql: `ALTER TABLE cultural_sites ADD COLUMN IF NOT EXISTS listing_status VARCHAR(50) DEFAULT 'staged'`,
  },
  {
    name: "cultural_sites_cultural_community_col",
    sql: `ALTER TABLE cultural_sites ADD COLUMN IF NOT EXISTS cultural_community VARCHAR(100)`,
  },
  {
    name: "cultural_sites_approx_location_col",
    sql: `ALTER TABLE cultural_sites ADD COLUMN IF NOT EXISTS approximate_location BOOLEAN DEFAULT FALSE`,
  },
  {
    // Backfill: Philadelphia sites go live_unclaimed so the unclaimed banner shows
    name: "cultural_sites_philly_live_unclaimed",
    sql: `UPDATE cultural_sites SET listing_status = 'live_unclaimed'
          WHERE city ILIKE '%Philadelphia%'
          AND (listing_status IS NULL OR listing_status = 'staged')`,
  },
  {
    // Backfill: derive pin_type from heritage_category for legacy rows missing it
    name: "cultural_sites_pin_type_backfill",
    sql: `UPDATE cultural_sites
          SET pin_type = CASE
            WHEN heritage_category = 'HBCU'                      THEN 'HBCU'
            WHEN heritage_category = 'Civil Rights'               THEN 'heritage_landmark'
            WHEN heritage_category = 'African American Heritage'  THEN 'cultural_site'
            WHEN heritage_category = 'Cultural Neighborhood'      THEN 'heritage_district'
            WHEN heritage_category = 'Religious Heritage'         THEN 'cultural_site'
            WHEN heritage_category IN ('Native American Heritage','Hispanic & Latino Heritage',
                                       'LGBTQ+ History','Women''s History','Immigrant Heritage',
                                       'Freedom Trail','Historical Sundown Town')
                                                                  THEN 'cultural_site'
            ELSE 'cultural_site'
          END
          WHERE pin_type IS NULL AND heritage_category IS NOT NULL`,
  },
  {
    // Drop FK so city_profiles can hold all 53+ cities, not just city_launches entries
    name: "city_profiles_drop_fk",
    sql: `ALTER TABLE city_profiles DROP CONSTRAINT IF EXISTS city_profiles_city_slug_fkey`,
  },
  {
    // Add city_name column for direct lookup without joining city_launches
    name: "city_profiles_add_city_name",
    sql: `ALTER TABLE city_profiles ADD COLUMN IF NOT EXISTS city_name VARCHAR(200)`,
  },
  {
    // Ensure listing_status column exists on businesses before seeding or updating it
    name: "businesses_listing_status_col",
    sql: `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS listing_status VARCHAR(50) DEFAULT 'staged'`,
  },
  {
    // Seed 12 Philadelphia demo businesses so the map has gold pins from day one.
    // Uses WHERE NOT EXISTS per row — no unique constraint needed, fully idempotent.
    name: "demo_businesses_philly_seed_v2",
    sql: `DO $seed$
DECLARE biz RECORD;
BEGIN
  FOR biz IN SELECT * FROM (VALUES
    ('Kinfolk Kitchen','[DEMO] A beloved gathering spot serving Southern and West African-inspired comfort food. Family recipes, community events, and a warm welcome for everyone.','Food','Restaurant','1400 South St','Philadelphia','PA','39.9416','-75.1650',true,'["black-owned"]','moderate'),
    ('Akosua''s Cloth & Culture','[DEMO] Handcrafted West African textiles, kente cloth, and contemporary Afro-diasporic fashion.','Retail','Fashion','3210 Girard Ave','Philadelphia','PA','39.9665','-75.1730',true,'["black-owned","african-diaspora-owned"]','moderate'),
    ('Yard Style Caribbean Grill','[DEMO] Jerk chicken, oxtail, and roti made from family recipes brought from Kingston and Port of Spain.','Food','Caribbean','5523 Germantown Ave','Philadelphia','PA','39.9980','-75.1720',true,'["black-owned","caribbean-owned"]','budget'),
    ('Casa Hernandez Panaderia','[DEMO] Mexican and Puerto Rican baked goods, pan dulce, and fresh empanadas. A community anchor for over a decade.','Food','Bakery','2812 N 5th St','Philadelphia','PA','39.9810','-75.1350',false,'["hispanic-owned","latino-owned"]','budget'),
    ('Lenape Roots Wellness','[DEMO] Holistic wellness rooted in Indigenous traditions — herbal medicine, mindfulness, and educational programs.','Health','Wellness','1200 E Columbia Ave','Philadelphia','PA','39.9740','-75.1210',false,'["indigenous-owned","native-american-owned"]','moderate'),
    ('Samira''s Moroccan Table','[DEMO] Slow-cooked tagines, fresh mint tea, and warm hospitality from a Casablanca native.','Food','Restaurant','734 S 9th St','Philadelphia','PA','39.9352','-75.1534',false,'["middle-eastern-owned","north-african-owned","immigrant-owned"]','moderate'),
    ('New Arrival Market','[DEMO] A multicultural grocery stocking ingredients from over 30 countries, founded by first-generation immigrants.','Retail','Grocery','1840 Point Breeze Ave','Philadelphia','PA','39.9291','-75.1720',false,'["immigrant-owned"]','budget'),
    ('Her Collective Studio','[DEMO] Women-owned beauty and wellness studio specializing in natural hair care, skincare, and holistic self-care.','Beauty','Salon','4512 Baltimore Ave','Philadelphia','PA','39.9447','-75.2045',false,'["women-owned"]','moderate'),
    ('Prism Books and Community Space','[DEMO] An LGBTQ+-owned independent bookstore, event venue, and safe space celebrating queer literature.','Retail','Bookstore','704 S 4th St','Philadelphia','PA','39.9418','-75.1480',false,'["lgbtq-owned"]','moderate'),
    ('Accessibility First Consulting','[DEMO] Disability-owned consulting firm specializing in ADA compliance, accessible design, and inclusive workplace strategy.','Services','Consulting','1500 Market St','Philadelphia','PA','39.9530','-75.1653',false,'["disability-owned"]','upscale'),
    ('Honor Grounds Coffee','[DEMO] Veteran-owned coffee shop and community meeting space. Single-origin roasts and a standing welcome for all who have served.','Food','Cafe','1910 Passyunk Ave','Philadelphia','PA','39.9280','-75.1720',false,'["veteran-owned"]','budget'),
    ('The Gathering Place','[DEMO] A multicultural community restaurant co-owned by Black, LGBTQ+, and women founders. Food, art, and storytelling.','Food','Restaurant','2100 Fairmount Ave','Philadelphia','PA','39.9635','-75.1723',true,'["black-owned","women-owned","lgbtq-owned"]','moderate')
  ) AS t(name,description,category,subcategory,address,city,state,latitude,longitude,black_owned,ownership_designations,price_range)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM businesses WHERE name = biz.name AND city = biz.city) THEN
      INSERT INTO businesses
        (id, name, description, category, subcategory, address, city, state,
         latitude, longitude, black_owned, ownership_designations,
         confidence_score, verified, price_range, business_status, listing_status)
      VALUES (
        gen_random_uuid(), biz.name, biz.description, biz.category, biz.subcategory,
        biz.address, biz.city, biz.state, biz.latitude::numeric, biz.longitude::numeric,
        biz.black_owned::boolean, biz.ownership_designations::jsonb,
        75, false, biz.price_range, 'community', 'live_unclaimed'
      );
    END IF;
  END LOOP;
END $seed$`,
  },
  {
    // Backfill: any remaining staged/null Philadelphia businesses → live_unclaimed
    name: "businesses_philly_live_unclaimed",
    sql: `UPDATE businesses SET listing_status = 'live_unclaimed'
          WHERE city ILIKE '%Philadelphia%' AND state ILIKE '%PA%'
          AND (listing_status IS NULL OR listing_status = 'staged')`,
  },
  {
    // Add Cheyney University — nearest HBCU to Philadelphia (~23 miles)
    name: "cultural_sites_cheyney_university",
    sql: `INSERT INTO cultural_sites
        (id, name, description, city, state, latitude, longitude,
         heritage_category, pin_type, listing_status, verified_source,
         admission_free, is_family_friendly, is_accessible)
      SELECT
        gen_random_uuid(),
        'Cheyney University of Pennsylvania',
        'Founded in 1837, Cheyney University is the oldest HBCU in the United States. Originally established as the African Institute by Quaker philanthropist Richard Humphreys, it became a cornerstone of Black higher education in America. Located in Chester County just outside Philadelphia, Cheyney has educated generations of Black scholars, educators, and leaders.',
        'Cheyney', 'PA', '39.9346', '-75.5188',
        'HBCU', 'HBCU', 'live_unclaimed',
        'Pennsylvania State System of Higher Education; HBCU history archives',
        true, true, true
      WHERE NOT EXISTS (
        SELECT 1 FROM cultural_sites WHERE name = 'Cheyney University of Pennsylvania'
      )`,
  },
  {
    // Tour unlock: make ALL businesses visible on the map (staged/pending → live_unclaimed).
    // This lets testers across every East Coast city see real pins immediately.
    // Safe to run repeatedly — only touches rows that are still staged/pending/null.
    name: "businesses_all_live_unclaimed_tour",
    sql: `UPDATE businesses
          SET listing_status = 'live_unclaimed'
          WHERE listing_status IS NULL
             OR listing_status IN ('staged', 'pending')`,
  },
  {
    name: "user_city_welcome_dismissals_table",
    sql: `CREATE TABLE IF NOT EXISTS user_city_welcome_dismissals (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      city_slug VARCHAR(100) NOT NULL,
      dismissed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, city_slug)
    )`,
  },
  {
    // Normalize HBCU category casing — all HBCU records should use uppercase
    // "HBCU" so map/library filters work consistently regardless of query casing.
    // Safe to run repeatedly (UPDATE with explicit value is idempotent).
    name: "cultural_sites_hbcu_category_normalize",
    sql: `UPDATE cultural_sites
          SET category        = 'HBCU',
              heritage_category = 'HBCU'
          WHERE UPPER(COALESCE(category,'')) = 'HBCU'
             OR UPPER(COALESCE(heritage_category,'')) = 'HBCU'`,
  },
  {
    // Fix Smoke & Soul ownership designation — was stored as lowercase "black-owned"
    // instead of the canonical enum value "Black / African American-Owned".
    name: "normalize_smoke_and_soul_ownership",
    sql: `UPDATE businesses
          SET ownership_designations = '["Black / African American-Owned"]'::jsonb,
              black_owned = true
          WHERE LOWER(name) = 'smoke & soul'
            AND ownership_designations::text ILIKE '%black-owned%'
            AND NOT ownership_designations::text ILIKE '%Black / African American%'`,
  },
];

export async function runStartupMigrations(logger?: Logger): Promise<void> {
  const log = (msg: string) =>
    logger ? logger.info(msg) : console.log(`[startup-migrations] ${msg}`);
  const warn = (msg: string) =>
    logger ? logger.warn(msg) : console.warn(`[startup-migrations] ${msg}`);

  log("Running startup schema migrations...");

  let applied = 0;
  let skipped = 0;

  for (const m of MIGRATIONS) {
    try {
      await pool.query(m.sql);
      log(`  ✓ ${m.name}`);
      applied++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // IF NOT EXISTS makes real conflicts impossible; any error here is unexpected
      warn(`  ✗ ${m.name}: ${msg}`);
      skipped++;
    }
  }

  log(
    `Startup migrations complete: ${applied} applied, ${skipped} skipped/errored.`
  );

  // ── Seed Data Integrity Guards ────────────────────────────────────────────
  // IMPORTANT: Run guards SEQUENTIALLY, not in parallel.
  // Each guard does its own pool.query calls. Running them concurrently via
  // Promise.allSettled created 6 simultaneous query streams that exhausted
  // the pool (max:20) on first boot when many records needed inserting.
  // Sequential execution means at most 1 active query at any time here.
  // Each guard uses a single bulk INSERT (not N individual INSERTs) to further
  // reduce round-trips. Any failure is caught and logged — never crashes the server.
  for (const [name, fn] of [
    ["HBCUs",             () => ensureAllHBCUs(log, warn)],
    ["cultural sites",    () => ensureCulturalSites(log, warn)],
    ["festivals",         () => ensureNationalFestivals(log, warn)],
    ["sundown towns",     () => ensureSundownTowns(log, warn)],
    ["dir. businesses",   () => ensureDirectoryBusinesses(log, warn)],
    ["knowledge topics",  () => ensureKnowledgeTopics(log, warn)],
  ] as [string, () => Promise<void>][]) {
    try {
      await fn();
    } catch (err: unknown) {
      warn(`Seed guard "${name}" threw unexpectedly: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

// ── Helper: bulk dedup key set from cultural_sites (name|state) ──────────────
async function loadCulturalSiteKeys(): Promise<Set<string>> {
  const r = await pool.query(`SELECT LOWER(name)||'|'||LOWER(state) AS k FROM cultural_sites`);
  return new Set(r.rows.map((row: { k: string }) => row.k));
}

// ── Helper: bulk dedup key set from sundown_towns (name|state) ───────────────
async function loadSundownTownKeys(): Promise<Set<string>> {
  const r = await pool.query(`SELECT LOWER(name)||'|'||LOWER(state) AS k FROM sundown_towns`);
  return new Set(r.rows.map((row: { k: string }) => row.k));
}

/**
 * Ensures all 107 U.S. Dept. of Education recognized HBCUs exist in cultural_sites.
 * Safe to run on every boot — skips any that already exist (matched by name + state).
 * Any regression in HBCU data is self-healed on next deploy.
 */
async function ensureAllHBCUs(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const existing = await loadCulturalSiteKeys();

    const newHBCUs = HBCU_COMPLETE_SEED.filter(
      (h) => !existing.has(`${h.name.toLowerCase()}|${h.state.toLowerCase()}`)
    );

    if (newHBCUs.length === 0) {
      log(`HBCU integrity guard: 0 inserted, ${HBCU_COMPLETE_SEED.length} already present`);
      return;
    }

    // Single bulk INSERT for all missing HBCUs (16 params per row)
    const COLS = 16;
    const placeholders = newHBCUs
      .map((_, i) => `($${i*COLS+1},$${i*COLS+2},$${i*COLS+3},$${i*COLS+4},$${i*COLS+5},$${i*COLS+6},$${i*COLS+7},$${i*COLS+8},$${i*COLS+9},$${i*COLS+10},$${i*COLS+11},$${i*COLS+12},$${i*COLS+13},$${i*COLS+14},$${i*COLS+15},$${i*COLS+16})`)
      .join(",");
    const params = newHBCUs.flatMap((h) => [
      h.name, h.city, h.state,
      h.latitude, h.longitude,
      h.description, h.significance,
      "HBCU",
      h.control === "public" ? "Public HBCU" : "Private HBCU",
      "HBCU", "hbcu",
      h.externalUrl, h.founded,
      "live_unclaimed",
      "U.S. Dept. of Education HBCU List · thehundred-seven.org",
      false,
    ]);

    await pool.query(
      `INSERT INTO cultural_sites
         (name, city, state, latitude, longitude, description, significance,
          category, subcategory, heritage_category, pin_type,
          external_url, founded_year, status, source, is_featured)
       VALUES ${placeholders}`,
      params
    );

    log(`HBCU integrity guard: ${newHBCUs.length} inserted, ${existing.size} already present (seed: ${HBCU_COMPLETE_SEED.length})`);
  } catch (err: unknown) {
    warn(`HBCU integrity guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Ensures all civil-rights landmarks, museums, and cultural sites from the
 * curated CULTURAL_SITES_SEED exist in cultural_sites. Dedup by name+state.
 */
async function ensureCulturalSites(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const existing = await loadCulturalSiteKeys();
    let inserted = 0;
    let skipped = 0;

    for (const s of CULTURAL_SITES_SEED) {
      const key = `${s.name.toLowerCase()}|${s.state.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO cultural_sites
            (id, name, city, state, latitude, longitude, description, significance,
             category, subcategory, heritage_category, pin_type,
             external_url, founded_year, status, source,
             is_accessible, is_family_friendly, admission_free, is_featured)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,false)`,
          [
            randomUUID(),
            s.name, s.city, s.state,
            parseFloat(s.latitude), parseFloat(s.longitude),
            s.description, s.significance ?? null,
            s.category, s.subcategory ?? null, s.heritageCategory,
            s.heritageCategory === "HBCU" ? "hbcu" : "heritage_site",
            s.externalUrl ?? null,
            s.yearEstablished ?? null,
            "live_unclaimed",
            s.verifiedSource ?? "MWM Cultural Research",
            s.isAccessible ?? false,
            s.isFamilyFriendly ?? false,
            s.admissionFree ?? false,
          ]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  Cultural sites guard: failed to insert ${s.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Cultural sites integrity guard: ${inserted} inserted, ${skipped} already present (seed: ${CULTURAL_SITES_SEED.length})`);
  } catch (err: unknown) {
    warn(`Cultural sites integrity guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Ensures all national heritage festivals from NATIONAL_FESTIVALS_SEED exist
 * in cultural_sites with pin_type=heritage_festival. Dedup by name+state.
 */
async function ensureNationalFestivals(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const existing = await loadCulturalSiteKeys();
    let inserted = 0;
    let skipped = 0;

    for (const f of NATIONAL_FESTIVALS_SEED) {
      const key = `${f.name.toLowerCase()}|${f.state.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO cultural_sites
            (id, name, description, category, heritage_category, subcategory,
             ethnic_community, city, state, latitude, longitude, era,
             significance, external_url, pin_type,
             is_accessible, is_family_friendly, admission_free, is_verified,
             verified_source, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
                   true,true,true,true,$16,NOW())`,
          [
            randomUUID(),
            f.name, f.description,
            "Cultural Celebration", f.heritageCategory, "Annual Festival",
            (f as any).ethnicCommunity ?? null,
            f.city, f.state, f.latitude, f.longitude,
            (f as any).typicalMonth ?? null,
            f.significance, (f as any).externalUrl ?? null,
            "heritage_festival",
            "Community Knowledge",
          ]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  Festivals guard: failed to insert ${f.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Festivals integrity guard: ${inserted} inserted, ${skipped} already present (seed: ${NATIONAL_FESTIVALS_SEED.length})`);
  } catch (err: unknown) {
    warn(`Festivals integrity guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Ensures all historical sundown towns from both seed files exist in the
 * sundown_towns table. Dedup by name+state. Creates the table if missing.
 */
async function ensureSundownTowns(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sundown_towns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT,
        state TEXT,
        county TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        confidence_level TEXT DEFAULT 'possible',
        historical_evidence TEXT,
        time_period TEXT,
        excluded_population TEXT DEFAULT 'Black residents',
        source_organization TEXT,
        source_url TEXT,
        current_state TEXT DEFAULT 'historical_neutral',
        report_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const existing = await loadSundownTownKeys();
    let inserted = 0;
    let skipped = 0;

    // Combine both seed lists — national entries + original curated list
    const allSundown = [
      ...NATIONAL_SUNDOWN_TOWNS_SEED,
      // SUNDOWN_TOWNS_SEED targets cultural_sites not sundown_towns table
      // so we only use the national seed for sundown_towns table
    ];

    for (const t of allSundown) {
      const key = `${t.name.toLowerCase()}|${t.state.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO sundown_towns
            (id,name,city,state,county,latitude,longitude,confidence_level,
             historical_evidence,time_period,excluded_population,
             source_organization,current_state)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            randomUUID(),
            t.name, t.city, t.state,
            (t as any).county ?? null,
            t.latitude, t.longitude,
            t.confidence_level,
            t.historical_evidence,
            t.time_period,
            (t as any).excluded_population ?? "African American",
            t.source_organization,
            "historical_neutral",
          ]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  Sundown towns guard: failed to insert ${t.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Sundown towns integrity guard: ${inserted} inserted, ${skipped} already present (seed: ${allSundown.length})`);
  } catch (err: unknown) {
    warn(`Sundown towns integrity guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Ensures all directory businesses from DIRECTORY_BUSINESSES_SEED exist in
 * the businesses table. Dedup by name+city+state.
 */
async function ensureDirectoryBusinesses(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    // Load existing keys (name|city|state)
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(state) AS k FROM businesses`
    );
    const existing = new Set(r.rows.map((row: { k: string }) => row.k));

    let inserted = 0;
    let skipped = 0;

    for (const b of DIRECTORY_BUSINESSES_SEED) {
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${b.state.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        const isBlack = b.ownershipDesignations.some((d: string) =>
          ["Black / African American-Owned","African-Owned","West African-Owned",
           "Nigerian-Owned","Ghanaian-Owned","Liberian-Owned","Ethiopian-Owned",
           "Somali-Owned","East African-Owned","Caribbean / West Indian-Owned",
           "Afro-Caribbean-Owned","Jamaican-Owned","Haitian-Owned",
           "Trinidadian & Tobagonian-Owned","Afro-Latino-Owned"].includes(d)
        );
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state,
             description, website, instagram, tiktok, primary_social_platform,
             ownership_designations, vibes, black_owned,
             latitude, longitude,
             listing_status, profile_status, status,
             rating, review_count, verified, featured,
             confidence_score, tags, photos, pending_photos, videos,
             trust_badges, flag_count, flag_status, hidden_gem_nominations,
             marketplace_tier, business_status, marketplace_fee_locked,
             promotion_eligible, feedback_opt_in, show_availability,
             community_audience_type, is_reference_only,
             created_at, updated_at)
           VALUES
            ($1,$2,$3,$4,$5,$6,$7,
             $8,$9,$10,$11,$12,
             $13,$14,$15,
             $16,$17,
             'live_unclaimed','community_listed','active',
             0,0,false,false,
             0,'[]','[]','[]','[]',
             '[]',0,'none',0,
             'free','community',false,
             true,false,false,
             'unknown',false,
             NOW(),NOW())`,
          [
            randomUUID(),
            b.name, b.category, (b as any).subcategory ?? null,
            (b as any).address ?? `${b.city}, ${b.state}`,
            b.city, b.state,
            (b as any).description ?? `${b.name} — community-listed business in ${b.city}, ${b.state}.`,
            (b as any).website ?? null, (b as any).instagram ?? null, (b as any).tiktok ?? null,
            (b as any).primarySocialPlatform ?? null,
            JSON.stringify(b.ownershipDesignations),
            JSON.stringify((b as any).vibes ?? []),
            isBlack,
            (b as any).latitude ?? null, (b as any).longitude ?? null,
          ]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  Directory businesses guard: failed to insert ${b.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Directory businesses integrity guard: ${inserted} inserted, ${skipped} already present (seed: ${DIRECTORY_BUSINESSES_SEED.length})`);
  } catch (err: unknown) {
    warn(`Directory businesses integrity guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Knowledge Library topic guard ─────────────────────────────────────────────
// Ensures every topic in KNOWLEDGE_LIBRARY_SEED exists in knowledge_topics.
// Deduplication is by lower-cased topic name (same logic as the admin seed endpoint).

async function ensureKnowledgeTopics(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const r = await pool.query(`SELECT LOWER(topic_name) AS n FROM knowledge_topics`);
    const existing = new Set(r.rows.map((row: { n: string }) => row.n));

    const newTopics = KNOWLEDGE_LIBRARY_SEED.filter(
      (t) => !existing.has(t.topicName.toLowerCase())
    );

    if (newTopics.length === 0) {
      log(`Knowledge topics integrity guard: 0 inserted, ${KNOWLEDGE_LIBRARY_SEED.length} already present`);
      return;
    }

    // Single bulk INSERT for all missing topics (6 params per row)
    const COLS = 6;
    const placeholders = newTopics
      .map((_, i) => `(gen_random_uuid(),$${i*COLS+1},$${i*COLS+2},$${i*COLS+3},$${i*COLS+4}::jsonb,$${i*COLS+5},$${i*COLS+6}::jsonb,true,'free',NOW())`)
      .join(",");
    const params = newTopics.flatMap((t) => [
      t.topicName,
      t.category,
      t.description,
      JSON.stringify(t.keywords),
      t.notificationPriority,
      JSON.stringify(t.trustedSources),
    ]);

    await pool.query(
      `INSERT INTO knowledge_topics
         (id, topic_name, category, description, keywords,
          notification_priority, trusted_sources, enabled, tier, created_at)
       VALUES ${placeholders}`,
      params
    );

    log(`Knowledge topics integrity guard: ${newTopics.length} inserted, ${existing.size} already present (seed: ${KNOWLEDGE_LIBRARY_SEED.length})`);
  } catch (err: unknown) {
    warn(`Knowledge topics integrity guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
