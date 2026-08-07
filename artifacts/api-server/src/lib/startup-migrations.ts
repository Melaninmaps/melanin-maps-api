/**
 * Startup migrations — add columns to the production DB that the Drizzle schema
 * defines but that may be missing from older Railway deployments.
 *
 * Every statement uses ADD COLUMN IF NOT EXISTS so it is safe to run on every
 * boot and is idempotent.  Failures are logged but do NOT crash the server —
 * the server starts and existing functionality continues; only the new columns
 * would be absent.
 */
import { pool } from "@workspace/db";
import type { Logger } from "pino";

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
    // Seed 12 Philadelphia demo businesses so the map has pins from day one.
    // ON CONFLICT (name, city) DO NOTHING makes this fully idempotent.
    // listing_status is set to live_unclaimed so the map query includes them.
    name: "demo_businesses_philly_seed",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name='businesses' AND constraint_name='businesses_name_city_unique'
        ) THEN
          ALTER TABLE businesses ADD CONSTRAINT businesses_name_city_unique UNIQUE (name, city);
        END IF;
      END $$;

      INSERT INTO businesses
        (id, name, description, category, subcategory, address, city, state,
         latitude, longitude, black_owned, ownership_designations,
         confidence_score, verified, price_range, business_status, listing_status)
      VALUES
        (gen_random_uuid(),'Kinfolk Kitchen','[DEMO] A beloved gathering spot serving Southern and West African–inspired comfort food. Family recipes, community events, and a warm welcome for everyone.','Food','Restaurant','1400 South St','Philadelphia','PA','39.9416','-75.1650',true,'["black-owned"]'::jsonb,75,false,'$$','community','live_unclaimed'),
        (gen_random_uuid(),'Akosua''s Cloth & Culture','[DEMO] Handcrafted West African textiles, kente cloth, and contemporary Afro-diasporic fashion.','Retail','Fashion','3210 Girard Ave','Philadelphia','PA','39.9665','-75.1730',true,'["black-owned","african-diaspora-owned"]'::jsonb,75,false,'$$','community','live_unclaimed'),
        (gen_random_uuid(),'Yard Style Caribbean Grill','[DEMO] Jerk chicken, oxtail, and roti made from family recipes brought from Kingston and Port of Spain.','Food','Caribbean','5523 Germantown Ave','Philadelphia','PA','39.9980','-75.1720',true,'["black-owned","caribbean-owned"]'::jsonb,75,false,'$','community','live_unclaimed'),
        (gen_random_uuid(),'Casa Hernández Panadería','[DEMO] Mexican and Puerto Rican baked goods, pan dulce, and fresh empanadas. A community anchor for over a decade.','Food','Bakery','2812 N 5th St','Philadelphia','PA','39.9810','-75.1350',false,'["hispanic-owned","latino-owned"]'::jsonb,75,false,'$','community','live_unclaimed'),
        (gen_random_uuid(),'Lenape Roots Wellness','[DEMO] Holistic wellness rooted in Indigenous traditions — herbal medicine, mindfulness practices, and educational programs.','Health','Wellness','1200 E Columbia Ave','Philadelphia','PA','39.9740','-75.1210',false,'["indigenous-owned","native-american-owned"]'::jsonb,75,false,'$$','community','live_unclaimed'),
        (gen_random_uuid(),'Samira''s Moroccan Table','[DEMO] Slow-cooked tagines, fresh mint tea, and warm hospitality from a Casablanca native.','Food','Restaurant','734 S 9th St','Philadelphia','PA','39.9352','-75.1534',false,'["middle-eastern-owned","north-african-owned","immigrant-owned"]'::jsonb,75,false,'$$','community','live_unclaimed'),
        (gen_random_uuid(),'New Arrival Market','[DEMO] A multicultural grocery stocking ingredients from over 30 countries, founded by first-generation immigrants.','Retail','Grocery','1840 Point Breeze Ave','Philadelphia','PA','39.9291','-75.1720',false,'["immigrant-owned"]'::jsonb,75,false,'$','community','live_unclaimed'),
        (gen_random_uuid(),'Her Collective Studio','[DEMO] Women-owned beauty and wellness studio specializing in natural hair care, skincare, and holistic self-care.','Beauty','Salon','4512 Baltimore Ave','Philadelphia','PA','39.9447','-75.2045',false,'["women-owned"]'::jsonb,75,false,'$$','community','live_unclaimed'),
        (gen_random_uuid(),'Prism Books & Community Space','[DEMO] An LGBTQ+-owned independent bookstore, event venue, and safe space celebrating queer literature.','Retail','Bookstore','704 S 4th St','Philadelphia','PA','39.9418','-75.1480',false,'["lgbtq-owned"]'::jsonb,75,false,'$$','community','live_unclaimed'),
        (gen_random_uuid(),'Accessibility First Consulting','[DEMO] Disability-owned consulting firm specializing in ADA compliance, accessible design, and inclusive workplace strategy.','Services','Consulting','1500 Market St','Philadelphia','PA','39.9530','-75.1653',false,'["disability-owned"]'::jsonb,75,false,'$$$','community','live_unclaimed'),
        (gen_random_uuid(),'Honor Grounds Coffee','[DEMO] Veteran-owned coffee shop and community meeting space. Single-origin roasts and a standing welcome for all who have served.','Food','Café','1910 Passyunk Ave','Philadelphia','PA','39.9280','-75.1720',false,'["veteran-owned"]'::jsonb,75,false,'$','community','live_unclaimed'),
        (gen_random_uuid(),'The Gathering Place','[DEMO] A multicultural community restaurant co-owned by Black, LGBTQ+, and women founders. Food, art, and storytelling.','Food','Restaurant','2100 Fairmount Ave','Philadelphia','PA','39.9635','-75.1723',true,'["black-owned","women-owned","lgbtq-owned"]'::jsonb,75,false,'$$','community','live_unclaimed')
      ON CONFLICT (name, city) DO NOTHING`,
  },
  {
    // Backfill: set any remaining staged Philadelphia businesses to live_unclaimed
    name: "businesses_philly_live_unclaimed",
    sql: `UPDATE businesses SET listing_status = 'live_unclaimed'
          WHERE city ILIKE '%Philadelphia%' AND state ILIKE '%PA%'
          AND (listing_status IS NULL OR listing_status = 'staged')`,
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
}
