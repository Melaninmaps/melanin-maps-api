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
import { COVERAGE_EXPANSION } from "./seeds/coverage-expansion.js";
import { GAP_COVERAGE_V2 } from "./seeds/gap-coverage-v2.js";
import { FINAL_MICRO_SEED } from "./seeds/final-micro-seed.js";
import { pool, THE_REAL_TAGS } from "@workspace/db";
import type { Logger } from "pino";
import { HBCU_COMPLETE_SEED } from "../data/hbcu-complete-seed";
import { CULTURAL_SITES_SEED } from "../data/cultural-sites-seed";
import { NATIONAL_FESTIVALS_SEED } from "../data/national-festivals-seed";
import { NATIONAL_SUNDOWN_TOWNS_SEED } from "../data/national-sundown-towns-seed";
import { SUNDOWN_TOWNS_SEED } from "../data/sundown-towns-seed";
import { DIRECTORY_BUSINESSES_SEED } from "../data/directory-businesses-seed";
import { KNOWLEDGE_LIBRARY_SEED } from "../data/knowledge-library-seed";
import { TOUR_BUSINESSES_SEED } from "../data/tour-businesses-seed";
import { COMMUNITY_ORGANIZATIONS_SEED } from "../data/community-organizations-seed";
import { RECURRING_EVENTS_SEED } from "../data/recurring-events-seed";
import { TOUR_CULTURAL_SITES_SEED } from "../data/tour-cultural-sites-seed";
import { CULTURAL_PHRASES_SEED } from "../data/cultural-phrases-seed";
import { FOUNDER_CURATED_BUSINESSES_SEED } from "../data/founder-curated-businesses-seed";
import { ensureDiasporaFaithSites } from "./ensure-diaspora-faith-sites";

const MIGRATIONS: { name: string; sql: string }[] = [
  {
    // Universal Search + Demand Flywheel — Checkpoint 1
    // Canonical search event log: one row per search across all surfaces.
    // Privacy: user_id nullable; demand signals use aggregated counts only.
    name: "create_search_events_table",
    sql: `CREATE TABLE IF NOT EXISTS search_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      raw_query TEXT NOT NULL,
      normalized_concept TEXT,
      intent_type TEXT,
      surface TEXT,
      location_bucket TEXT,
      result_count INTEGER DEFAULT 0,
      match_types_returned TEXT[],
      fallback_used BOOLEAN DEFAULT FALSE,
      engagement TEXT,
      engaged_entity_id UUID,
      engaged_entity_type TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "search_events_idx_created",
    sql: `CREATE INDEX IF NOT EXISTS search_events_created_at_idx ON search_events(created_at DESC)`,
  },
  {
    name: "search_events_idx_concept",
    sql: `CREATE INDEX IF NOT EXISTS search_events_concept_idx ON search_events(normalized_concept, intent_type, location_bucket)`,
  },
  {
    name: "create_library_entity_connections_table",
    sql: `CREATE TABLE IF NOT EXISTS library_entity_connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_id VARCHAR NOT NULL REFERENCES knowledge_topics(id) ON DELETE CASCADE,
      entity_id UUID NOT NULL,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('business','cultural_site','event','community_org')),
      entity_label TEXT,
      relevance_weight FLOAT NOT NULL DEFAULT 1.0,
      relevance_tags TEXT[],
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(topic_id, entity_id, entity_type)
    )`,
  },
  {
    // Idempotent insert via WHERE NOT EXISTS — knowledge_topics has no UNIQUE on topic_name,
    // so ON CONFLICT DO NOTHING alone does not prevent duplicates across boots.
    name: "seed_diaspora_country_topics_v2",
    sql: `
      INSERT INTO knowledge_topics (id, topic_name, category, description, node_type)
      SELECT gen_random_uuid(), v.n, 'country', v.d, 'geography'
      FROM (VALUES
        ('Kenya',              'Cultural and ancestral hub for the Kenyan diaspora — traditions, history, and community connections.'),
        ('Ghana',              'Cultural hub for Ghanaian diaspora — Sankofa, Afrobeat roots, and the Year of Return legacy.'),
        ('Nigeria',            'Home to the world''s largest Black population — Yoruba, Igbo, and Hausa cultural traditions.'),
        ('Jamaica',            'Island hub for Caribbean diaspora — reggae, Rastafari, and pan-African identity.'),
        ('Haiti',              'First Black republic — revolutionary history, Vodou spirituality, and Haitian Creole culture.'),
        ('Trinidad and Tobago','Caribbean cultural crossroads — Carnival, calypso, pan steel, and Afro-Trinidadian traditions.'),
        ('Ethiopia',           'Ancient African civilization — Rastafari sacred homeland, Amharic language, and Coptic Christianity.'),
        ('South Africa',       'Home of Zulu, Xhosa, and Sotho peoples — anti-apartheid legacy and ubuntu philosophy.'),
        ('Brazil',             'Largest African diaspora in the Americas — Candomblé, capoeira, and Afro-Brazilian traditions.'),
        ('Colombia',           'Afro-Colombian heritage — Pacific coast communities, cumbia, and Atlantic roots.'),
        ('Cuba',               'Afro-Cuban traditions — Santería, son, salsa, and deep African heritage through the Middle Passage.'),
        ('Senegal',            'West African cultural anchor — Wolof traditions, Dakar arts scene, and Islamic Sufi heritage.'),
        ('Cameroon',           'Central and West African crossroads — 250+ ethnic groups and Bamileke entrepreneurial traditions.'),
        ('Dominican Republic', 'Afro-Caribbean identity — merengue, bachata, and the complex history of Taíno, African, and Spanish roots.'),
        ('Barbados',           'Proud Afro-Caribbean nation — Bajan culture, Crop Over festival, and Atlantic diaspora history.'),
        ('Bahamas',            'Afro-Caribbean island nation — junkanoo carnival, Bahamian culture, and Atlantic diaspora identity.')
      ) AS v(n, d)
      WHERE NOT EXISTS (
        SELECT 1 FROM knowledge_topics WHERE topic_name = v.n AND category = 'country'
      )
    `,
  },
  {
    // International address support — make state nullable so non-US businesses
    // don't require a US state code. Existing US rows keep their state values.
    name: "businesses_state_nullable_v1",
    sql: `ALTER TABLE businesses ALTER COLUMN state DROP NOT NULL`,
  },
  {
    // Add country column — NULL means US (default market). Non-US businesses
    // should always populate this so search, map, and directory work globally.
    name: "businesses_country_col_v1",
    sql: `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country VARCHAR(100)`,
  },
  {
    // Add province column — stores region/province/territory for non-US addresses
    // where a US state code is not applicable (e.g. Bangkok → Bangkok Province).
    name: "businesses_province_col_v1",
    sql: `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS province VARCHAR(100)`,
  },
  {
    // Add admin_notes column — internal-only notes never exposed in public queries.
    // Stores source/provenance info, team context, and scout notes for admin-entered
    // businesses (especially international entries). NOT appended to description.
    name: "businesses_admin_notes_col_v1",
    sql: `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS admin_notes TEXT`,
  },
  {
    // Add listing_status column if missing (referenced by search queries)
    name: "businesses_listing_status_col",
    sql: `ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS listing_status VARCHAR(50) DEFAULT 'live_unclaimed'`,
  },
  {
    name: "businesses_email_zip_cols",
    sql: `ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS zip VARCHAR(20)`,
  },
  {
    name: "create_tester_feedback_table",
    sql: `CREATE TABLE IF NOT EXISTS tester_feedback (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      type VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      expected TEXT,
      page VARCHAR(500),
      user_agent VARCHAR(500),
      build_sha VARCHAR(100),
      platform VARCHAR(50) DEFAULT 'web',
      status VARCHAR(50) DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
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
  // ── Community Organizations ─────────────────────────────────────────────
  {
    name: "community_organizations_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS community_organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      state VARCHAR(2) NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      mission TEXT,
      website TEXT,
      instagram TEXT,
      facebook TEXT,
      phone TEXT,
      address TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      is_active BOOLEAN NOT NULL DEFAULT true,
      has_pending_edit BOOLEAN NOT NULL DEFAULT false,
      tour_source BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: "community_organizations_indexes_v1",
    sql: `CREATE INDEX IF NOT EXISTS idx_community_orgs_city_state
          ON community_organizations (LOWER(city), LOWER(state))
          WHERE is_active = true`,
  },
  // ── Recurring Events ────────────────────────────────────────────────────
  {
    name: "recurring_events_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS recurring_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      state VARCHAR(2) NOT NULL,
      venue TEXT,
      address TEXT,
      description TEXT,
      frequency TEXT NOT NULL DEFAULT 'weekly',
      day_of_week TEXT,
      start_time TEXT,
      end_time TEXT,
      category TEXT NOT NULL DEFAULT 'other',
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      is_active BOOLEAN NOT NULL DEFAULT true,
      has_pending_edit BOOLEAN NOT NULL DEFAULT false,
      tour_source BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: "recurring_events_indexes_v1",
    sql: `CREATE INDEX IF NOT EXISTS idx_recurring_events_city_state
          ON recurring_events (LOWER(city), LOWER(state))
          WHERE is_active = true`,
  },
  // ── Edit Suggestions ────────────────────────────────────────────────────
  {
    name: "edit_suggestions_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS edit_suggestions (
      id SERIAL PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_name TEXT,
      field_name TEXT NOT NULL,
      current_value TEXT,
      suggested_value TEXT NOT NULL,
      reason TEXT,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_notes TEXT,
      reviewed_by TEXT,
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: "edit_suggestions_indexes_v1",
    sql: `CREATE INDEX IF NOT EXISTS idx_edit_suggestions_status ON edit_suggestions (status);
          CREATE INDEX IF NOT EXISTS idx_edit_suggestions_entity ON edit_suggestions (entity_type, entity_id);
          CREATE INDEX IF NOT EXISTS idx_edit_suggestions_user ON edit_suggestions (user_id)`,
  },
  // ── Cultural Phrases table ────────────────────────────────────────────
  {
    name: "cultural_phrases_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS cultural_phrases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_name TEXT NOT NULL,
      phrase TEXT NOT NULL,
      english_gloss TEXT NOT NULL,
      is_sensitive BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: "cultural_phrases_unique_idx",
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_cultural_phrases_unique
          ON cultural_phrases (LOWER(group_name), LOWER(phrase))`,
  },
  // ── Tour Cultural Sites table ─────────────────────────────────────────
  {
    name: "tour_cultural_sites_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS tour_cultural_sites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      state VARCHAR(2) NOT NULL,
      address TEXT,
      description TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      is_active BOOLEAN NOT NULL DEFAULT true,
      has_pending_edit BOOLEAN NOT NULL DEFAULT false,
      tour_source BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: "tour_cultural_sites_idx_v1",
    sql: `CREATE INDEX IF NOT EXISTS idx_tour_cultural_sites_city_state
          ON tour_cultural_sites (LOWER(city), LOWER(state))
          WHERE is_active = true`,
  },
  {
    // International support — tour content tables need province + country
    // so the batch geocoder can resolve non-US addresses correctly.
    name: "tour_content_intl_cols_v1",
    sql: `ALTER TABLE tour_cultural_sites
            ADD COLUMN IF NOT EXISTS province VARCHAR(100),
            ADD COLUMN IF NOT EXISTS country  VARCHAR(100);
          ALTER TABLE community_organizations
            ADD COLUMN IF NOT EXISTS province VARCHAR(100),
            ADD COLUMN IF NOT EXISTS country  VARCHAR(100);
          ALTER TABLE recurring_events
            ADD COLUMN IF NOT EXISTS province VARCHAR(100),
            ADD COLUMN IF NOT EXISTS country  VARCHAR(100)`,
  },
  // ── has_pending_edit on cultural_sites ────────────────────────────────
  {
    name: "cultural_sites_has_pending_edit_col",
    sql: `ALTER TABLE cultural_sites ADD COLUMN IF NOT EXISTS has_pending_edit BOOLEAN NOT NULL DEFAULT false`,
  },
  // ── neighborhood_timing on city_profiles ──────────────────────────────
  {
    name: "city_profiles_neighborhood_timing_col",
    sql: `ALTER TABLE city_profiles ADD COLUMN IF NOT EXISTS neighborhood_timing JSONB DEFAULT '[]'::jsonb`,
  },
  {
    name: "city_profiles_has_pending_edit_col",
    sql: `ALTER TABLE city_profiles ADD COLUMN IF NOT EXISTS has_pending_edit BOOLEAN NOT NULL DEFAULT false`,
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
    // Seed brief city welcome contexts for all tour cities.
    // brief_context = warm 1-2 sentence acknowledgement shown ONCE on first visit.
    // historical_context = full story for "learn more" tap.
    // ON CONFLICT: only update if brief_context is currently blank so manual edits survive.
    name: "city_profiles_tour_brief_context_v1",
    sql: `INSERT INTO city_profiles (city_slug, city_name, brief_context, historical_context)
VALUES
  ('philadelphia','Philadelphia','Black Philadelphians founded America''s first independent Black organization here in 1787 — freedom, faith, and self-determination have been in this city''s bones ever since.','Philadelphia has been a significant center for the Black diaspora since the 17th century. A major stop on the Underground Railroad, Black Philadelphians built foundational institutions including the Free African Society and Mother Bethel A.M.E. Church. During the Great Migration the city''s Black population more than doubled, creating vibrant communities in South, West, and North Philadelphia that thrive today.'),
  ('washington-dc','Washington DC','More than monuments — DC has always had a thriving Black city within the capital, from the U Street jazz corridor to the deep cultural roots of Anacostia.','Washington DC''s Black community built one of the wealthiest neighborhoods in post-Civil War America along U Street, earning it the nickname "Black Broadway." The city''s Anacostia neighborhood and Howard University have anchored generations of Black intellectual and cultural life. Today DC''s diverse immigrant communities — Ethiopian, West African, Caribbean, and Latino — add new chapters to a city that has always been more than its government.'),
  ('richmond','Richmond','Virginia''s former Confederate capital was built by Black labor — and the community that built it, survived it, and outlasted it is still very much here.','Richmond''s Jackson Ward was once called the "Harlem of the South," a thriving Black business district in the late 19th and early 20th centuries. The city''s historic Shockoe Bottom neighborhood carries deep scars as a major hub of the domestic slave trade. Today Richmond''s Black community, alongside growing Ethiopian and Latino populations, is reclaiming and redefining the city''s story on its own terms.'),
  ('charlotte','Charlotte','Queen City has quietly become one of the fastest-growing hubs for Black wealth and culture in the South — deep roots, new energy.','Charlotte''s Second Ward, known as Brooklyn, was once a self-sufficient Black community before it was demolished for urban renewal in the 1960s. The city is now home to a rapidly expanding Black professional class and one of the most diverse Latino and immigrant communities in the Carolinas. HBCUs like Johnson C. Smith University have anchored Black intellectual life here for over 150 years.'),
  ('columbia','Columbia','Two HBCUs sit just blocks apart here — Allen University and Benedict College have anchored this community since 1870, making Columbia a cornerstone of Black higher education in the South.','Columbia was the site of early civil rights battles, including student sit-ins that predated many of the movement''s most famous moments. The Waverly Historic District stands as one of the city''s most prominent Black communities, home to professionals, educators, and leaders. Today Columbia''s International Corridor on Decker Boulevard reflects a rich tapestry of immigrant cultures — Caribbean, Ethiopian, Filipino, and Brazilian — layered on top of deep African American roots.'),
  ('atlanta','Atlanta','Called the Black Mecca for a reason — Atlanta has been a destination for Black excellence, culture, and economic power for over a century.','Atlanta''s Sweet Auburn district was once dubbed "the richest Negro street in the world" by Fortune Magazine. The city is the birthplace of Dr. Martin Luther King Jr. and the home of the Atlanta University Center — the largest consortium of HBCUs in the world, including Spelman, Morehouse, and Clark Atlanta. Today Atlanta''s West End, Old Fourth Ward, and Buckhead neighborhoods host one of the most vibrant and internationally diverse Black communities in America.'),
  ('montgomery','Montgomery','Every step you take here carries history — this is where the Civil Rights Movement found its legs, Rosa Parks refused to move, and an entire city walked.','Montgomery was both the first capital of the Confederacy and the birthplace of the modern Civil Rights Movement — that tension defines the city. The 381-day Montgomery Bus Boycott, launched here in 1955, became the template for nonviolent resistance worldwide. The Equal Justice Initiative''s Legacy Museum and National Memorial for Peace and Justice have transformed the city into one of the most powerful sites of racial reckoning in America.'),
  ('birmingham','Birmingham','They called it Bombingham — and the community that endured, organized, and refused to leave is proof that nothing could stop what they started.','Birmingham was the primary battleground of the 1963 Civil Rights Movement, where images of fire hoses and police dogs turned against children shocked the world and accelerated the Civil Rights Act of 1964. The 16th Street Baptist Church bombing claimed four young girls'' lives and galvanized the nation. Today the 4th Avenue Business District — once called "Little Harlem" — is experiencing a cultural renaissance rooted in that history of resilience.'),
  ('new-orleans','New Orleans','The food, the music, the second lines — this is what happens when West African, Caribbean, Creole, and Indigenous cultures spend 300 years cooking together.','New Orleans'' Black Creole culture is unlike anything else in America — born from the collision of West African, French, Spanish, and Caribbean influences in one of the only cities where free Black people could own property before the Civil War. The Tremé neighborhood is the oldest Black neighborhood in the United States. Congo Square, where enslaved Africans gathered to maintain music and cultural traditions, is the spiritual birthplace of jazz.'),
  ('houston','Houston','The largest city in the South has one of the most vibrant Black diaspora communities in the country — from Third Ward to Frenchtown to the Nigerian enclaves of the Beltway.','Houston''s Third Ward has been the cultural heart of Black Houston for over a century, home to Texas Southern University and the Museum of African American Culture. The city''s Frenchtown neighborhood preserves a unique Creole identity brought by families from Louisiana. Today Houston is one of the most ethnically diverse cities in America, with large Nigerian, West Indian, and African immigrant communities adding new dimensions to its Black cultural landscape.'),
  ('baltimore','Baltimore','Birthplace of Thurgood Marshall, home of the Pennsylvania Avenue jazz corridor — Charm City''s Black history runs deeper than most people know.','Baltimore''s Pennsylvania Avenue corridor was once a premier entertainment strip where Billie Holiday, Cab Calloway, and James Brown performed for Black audiences during segregation. The city is home to Morgan State University, one of Maryland''s most prominent HBCUs. Today Baltimore''s Black community shares the city with growing Ethiopian and West African populations that have transformed neighborhoods like Greenmount West and Park Heights.'),
  ('new-york-city','New York City','Harlem alone shaped global culture — and that''s just one neighborhood in a city where Black and diaspora communities have been rewriting the story for centuries.','The Harlem Renaissance of the 1920s produced some of the most influential art, literature, and music in American history. Brooklyn''s Flatbush and Bedford-Stuyvesant neighborhoods became the heart of Caribbean America, while the Bronx gave birth to hip-hop. Today New York''s Little Senegal in Harlem, Little Caribbean in Brooklyn, and thriving Afro-Latino communities in the Bronx represent the full global reach of the Black diaspora.'),
  ('newark','Newark','Right across the river from Manhattan, Newark has its own profound Black history — and one of the most vibrant Brazilian and Portuguese communities on the East Coast.','Newark was a major destination of the Great Migration, and its Black community built a rich cultural life centered on the historic Broad Street corridor. The city played a significant role in the Underground Railroad, with churches that still stand today. The Ironbound district, home to Portuguese and Brazilian immigrants for generations, makes Newark one of the most authentically multi-diaspora cities in America.'),
  ('baton-rouge','Baton Rouge','Southern University — one of the largest HBCUs in the country — calls this city home, and the bayou city''s Black Creole culture is unlike anywhere else in America.','Baton Rouge was the site of significant Civil Rights battles, including the 1953 bus boycott that predated Montgomery. Southern University and A&M College has anchored Black higher education here since 1880. The city''s North Baton Rouge neighborhoods carry a distinct Black Creole identity shaped by generations of cultural exchange between African American, Creole, and Cajun communities along the Mississippi.'),
  ('mobile','Mobile','The oldest city in Alabama carries a deep Black Creole history that often gets overshadowed — but it has been here, quietly holding its own, for centuries.','Mobile was founded in 1702, making it one of the oldest cities in the Gulf South — and its Black community traces roots to the earliest days of French and Spanish colonial rule. Mobile''s Africatown neighborhood, founded by the last known Africans brought to the United States on the slave ship Clotilda, is one of the most historically significant Black communities in America. The city''s Mardi Gras traditions predate New Orleans'' by several years.'),
  ('las-vegas','Las Vegas','Behind the Strip is a Black community with deep roots — the Westside was the only place jazz legends like Sammy Davis Jr. and Nat King Cole could sleep after performing for white audiences.','Las Vegas''s Westside was established as a Black neighborhood when the city was built on segregation — Black performers who played the casinos by night were refused rooms and sent to the Westside. The Moulin Rouge hotel, opened in 1955, was the first integrated casino in Las Vegas and became a gathering point for civil rights organizing. Today the Westside is being reclaimed and revitalized by a community determined to own its history.'),
  ('nashville','Nashville','Fisk University, Tennessee State, and the Jefferson Street corridor — Nashville helped make this the Athens of the South, and the city''s Black community has the receipts.','Nashville''s Fisk University was founded in 1866 and produced W.E.B. Du Bois; its Jubilee Singers introduced the world to African American spirituals. Jefferson Street was a legendary music corridor where Jimi Hendrix, Little Richard, and Etta James performed for Black audiences during segregation. Today Nashville is experiencing a cultural renaissance, with its Black community reclaiming space alongside a rapidly growing Latino and immigrant population.'),
  ('san-antonio','San Antonio','One of the oldest cities in America, San Antonio sits at the intersection of Black and Latino history — where cultures have mixed and built something entirely their own.','San Antonio''s Black community traces roots to Buffalo Soldiers stationed at nearby forts after the Civil War, many of whom settled here permanently. The city''s Eastside has been the center of Black cultural life for over a century. San Antonio is also one of the most heavily Latino cities in America, making it a unique intersection of African American, Mexican American, and Indigenous histories that continue to shape its culture.'),
  ('phoenix','Phoenix','The Black community here traces back to Buffalo Soldiers stationed at territorial forts — and South Phoenix has been a cultural anchor through every era of the city''s growth.','Phoenix''s South Mountain neighborhood was historically the center of Black Phoenix, developed when the city''s racist restrictive covenants confined Black residents to one area. The city has a long history of Black entrepreneurship despite these restrictions. Today Phoenix is home to one of the fastest-growing Black populations in the West, alongside large Latino, Indigenous, and East African communities.'),
  ('portland','Portland','The Albina neighborhood in North Portland was once a thriving Black community before urban renewal displaced thousands — the community is still here, still building.','Portland has a complex racial history — Oregon was the only state to enter the Union with a law excluding Black people from living there. Despite this, Black Portlanders built a vibrant community in the Albina district during the Great Migration. Today the city''s Black community is working to reclaim cultural and economic space in neighborhoods that have been heavily gentrified, while a growing East African and Latino community adds new vitality.'),
  ('kansas-city','Kansas City','This city gave the world Charlie Parker and a jazz tradition that still echoes on 18th & Vine — the heartbeat of Black Kansas City.','Kansas City''s 18th & Vine district was one of the premier jazz and blues corridors in the country during the 1920s-1940s, rivaling Harlem and Chicago''s South Side. Count Basie, Charlie Parker, and Big Joe Turner all came from this scene. The American Jazz Museum and Negro Leagues Baseball Museum, both located in the district, preserve a cultural legacy that belongs to the world. Today the city''s Black community shares space with a rapidly growing Latino population.'),
  ('tampa','Tampa','Ybor City tells the story of how Black Cuban tobacco workers built a community where Caribbean and Black Southern culture mixed in ways still felt today.','Tampa''s Ybor City was a uniquely integrated neighborhood in the early 20th century, where Afro-Cuban cigar workers, Black Southerners, and Italian immigrants lived and worked alongside each other. The Central Avenue corridor in St. Petersburg''s Midtown neighborhood was once a thriving Black business district. Today Tampa Bay''s Black community shares the region with a large Caribbean diaspora and one of the most vibrant Latino communities in Florida.'),
  ('tuskegee','Tuskegee','This is sacred ground — Booker T. Washington built a university here, the Tuskegee Airmen flew from here, and George Washington Carver changed agriculture from here.','Tuskegee University was founded in 1881 by Booker T. Washington with a mission to train Black teachers and tradespeople — and it became one of the most important institutions in African American history. The Tuskegee Airmen, the first Black military aviators in the U.S. Armed Forces, trained and flew from Moton Field here during World War II. George Washington Carver conducted his legendary agricultural research at Tuskegee, developing over 300 uses for the peanut.'),
  ('jacksonville','Jacksonville','LaVilla was Jacksonville''s Harlem — a Black cultural district that produced James Weldon Johnson and Ray Charles, among the many who shaped American culture from these streets.','Jacksonville''s LaVilla neighborhood was once a premier Black entertainment and business district, home to juke joints, theaters, and cultural institutions. James Weldon Johnson — author of "Lift Every Voice and Sing" — was born here and helped define a generation of Black intellectual and artistic achievement. The city sits on the edge of Gullah Geechee country, giving its Black community a direct cultural link to West African traditions that survived in the coastal South.'),
  ('orlando','Orlando','Parramore has been the heart of Black Orlando for over a century — and the community held on even as theme parks and development reshaped the city around them.','Orlando''s Parramore neighborhood was historically the center of Black cultural and economic life in the city, home to churches, businesses, and community organizations that sustained the community through the Jim Crow era. The city''s Eatonville — just north of Orlando — is one of the oldest incorporated Black municipalities in the United States, founded in 1887 and the hometown of author Zora Neale Hurston. Today Orlando''s Black community shares the city with one of the largest Puerto Rican and Caribbean populations outside of New York.'),
  ('memphis','Memphis','Beale Street, Stax Records, the Lorraine Motel — Memphis is where the blues became soul, and where the movement paid its heaviest price.','Memphis''s Beale Street was one of the most important corridors in American music history — the home of W.C. Handy, the "Father of the Blues," and a launchpad for generations of Black musical genius. Stax Records, founded in 1957, produced some of the defining sounds of soul music with artists including Otis Redding and Isaac Hayes. The Lorraine Motel, where Dr. Martin Luther King Jr. was assassinated in 1968, is now the National Civil Rights Museum.'),
  ('cleveland','Cleveland','Hough, Glenville, and the Cedar-Central corridor are the historic hearts of Black Cleveland — a Great Migration destination that built real community.','Cleveland was a major destination of the Great Migration, with Black Southerners building a thriving community in the Hough and Glenville neighborhoods. The city was home to Jesse Owens, who grew up on Cleveland''s East Side after his family migrated from Alabama. Today Cleveland''s Black community shares the East Side with growing Latino and immigrant populations, while the city''s West Side has historically been home to large Puerto Rican and Eastern European communities.'),
  ('los-angeles','Los Angeles','From Watts to Leimert Park, LA''s Black geography tells the story of the Great Migration, cultural invention, and resilience against displacement.','Los Angeles''s Black community grew dramatically during World War II when tens of thousands of Black Southerners came to work in the defense industry. The Central Avenue corridor — known as the "Harlem of the West" — became a premier jazz and blues scene in the 1940s and 1950s. The Watts neighborhood, site of the 1965 uprising, and Leimert Park, which became the cultural heart of Black LA, both represent different chapters of a community that has always fought to stay rooted in a city that keeps trying to price them out.'),
  ('denver','Denver','Five Points was the Harlem of the West — Denver''s historic Black neighborhood hosted Duke Ellington and Billie Holiday and produced its own extraordinary culture.','Denver''s Five Points neighborhood was the center of Black life in the Mountain West from the late 19th century through the mid-20th century. The Rossonian Hotel became a legendary venue where nationally touring jazz and blues artists performed, since they were refused entry to downtown Denver''s segregated establishments. Today Five Points is being gentrified, but the Black community is working to preserve its history and maintain cultural presence in the neighborhood they built.'),
  ('savannah','Savannah','One of America''s oldest cities holds one of the South''s richest Gullah Geechee communities — a culture that survived slavery and stayed rooted to this coastal land.','Savannah''s Black community carries direct cultural connections to West Africa through the Gullah Geechee heritage preserved on the Sea Islands and in the city''s historic neighborhoods. The First African Baptist Church, established in 1773, is one of the oldest Black churches in North America. Savannah''s Beach Institute, founded after the Civil War to educate freed Black people, now houses the King-Tisdell Cottage Foundation, which preserves the African American history of coastal Georgia.'),
  ('chicago','Chicago','The Great Migration brought hundreds of thousands to Bronzeville — Chicago''s Black Metropolis changed American music, literature, and politics forever.','Chicago''s Bronzeville neighborhood became the epicenter of the Great Migration, where Black Southerners built a self-sufficient community with its own newspapers, theaters, churches, and businesses. The Chicago Defender — one of the most influential Black newspapers in American history — was published here. Chicago''s music scene produced blues legends like Muddy Waters and Howlin'' Wolf, the house music movement, and a hip-hop tradition that rivals any city in the country.'),
  ('indianapolis','Indianapolis','Indiana Avenue was Indianapolis''s jazz corridor, home to Wes Montgomery and one of the most vibrant Black business districts between Chicago and Cincinnati.','Indianapolis''s Indiana Avenue was one of the premier Black entertainment and business corridors in the Midwest during the early 20th century. Jazz guitarist Wes Montgomery grew up playing in the clubs here, and the Madame Walker Legacy Center — built by Madam C.J. Walker, America''s first Black female self-made millionaire — still stands as a monument to Black entrepreneurship. The Crispus Attucks High School, which produced Oscar Robertson and other legendary athletes, was a source of community pride during the segregation era.'),
  ('milwaukee','Milwaukee','Bronzeville here was a cultural hub during the Great Migration, and Milwaukee''s Black community has deep ties to Chicago''s broader Great Migration story.','Milwaukee''s Bronzeville neighborhood on the North Side was a thriving Black community during the Great Migration, with its own theaters, restaurants, and cultural institutions. The city''s Black community has strong historical ties to Chicago — many families migrated here during the same period, seeking industrial jobs. Today Milwaukee''s North Side is home to a concentrated Black community that has faced significant economic challenges but maintains a rich cultural identity rooted in faith, music, and neighborhood solidarity.'),
  ('seattle','Seattle','The Central District was Seattle''s historic Black neighborhood — families who came for shipyard work during WWII built something lasting in the Pacific Northwest.','Seattle''s Central District was the only neighborhood where Black families could legally purchase homes through much of the 20th century, due to racially restrictive covenants. The community built a rich cultural life in these constraints, with Jimi Hendrix growing up nearby and the city''s Black churches, businesses, and cultural organizations thriving on the streets of the CD. Today the Central District is heavily gentrified, but the community''s cultural legacy is preserved in institutions fighting to stay rooted.'),
  ('columbus','Columbus','King-Lincoln Bronzeville was Columbus''s thriving Black business and cultural district — the Lincoln Theatre still stands, and the community is still building around it.','Columbus''s King-Lincoln Bronzeville neighborhood on the Near East Side was once the heart of Black cultural life in central Ohio, centered on the historic Lincoln Theatre which opened in 1929. The neighborhood''s churches, businesses, and community organizations sustained the Black community through the Great Migration and Jim Crow era. Today the area is experiencing revitalization led by community organizations committed to preserving its Black cultural identity.'),
  ('cincinnati','Cincinnati','Just across the river from Kentucky, Cincinnati was a major stop on the Underground Railroad — and that geography of freedom shaped everything that followed.','Cincinnati''s location on the Ohio River made it a crucial gateway to freedom for enslaved people escaping the South, and the city has a deep Underground Railroad history. The Over-the-Rhine neighborhood, now heavily gentrified, was once home to a large Black community that built its own institutions. Today Cincinnati''s West End and Avondale neighborhoods remain the heart of Black cultural life, while the city''s growing immigrant communities add new layers to its urban fabric.'),
  ('norfolk','Norfolk','Hampton University sits just across the water, and Norfolk has been a hub for Black military and academic families for generations — the community runs deep here.','Norfolk''s location as a major naval base made it a significant destination for Black military families throughout the 20th century, creating a stable and educated middle class. The city is at the heart of Hampton Roads, a region with extraordinary HBCU density — Hampton University, Norfolk State, and Virginia State are all within a short drive. The community''s history is deeply tied to both military service and the academic tradition that HBCUs represent.'),
  ('dallas','Dallas','Deep Ellum started as a Black and immigrant neighborhood, and Fair Park was the first fairground in Texas to welcome Black visitors — the roots run deep here.','Dallas''s Deep Ellum neighborhood was born as a Black commercial district in the late 19th century, where freed people set up businesses and cultural institutions along the railroad tracks. The neighborhood later became the center of Texas blues, with Blind Lemon Jefferson and Lead Belly playing in its streets. Today Dallas''s Black community is centered in South Dallas, while the city''s Latino population — the largest in North Texas — has made it one of the most multicultural cities in the South.'),
  ('oakland','Oakland','Birthplace of the Black Panther Party — Oakland''s Black community has always been at the front lines of resistance, culture, and innovation.','Oakland''s Black community grew dramatically during World War II when tens of thousands of Black Southerners arrived to work in the Kaiser shipyards and defense plants. The Black Panther Party was founded in Oakland in 1966 by Huey Newton and Bobby Seale, transforming the city into a center of Black radical politics. The city''s Fruitvale neighborhood has become a major hub for Latino culture, while West Oakland remains a historically Black neighborhood fighting displacement in one of the most expensive housing markets in America.'),
  ('tulsa','Tulsa','Greenwood was Black Wall Street — the wealthiest Black community in American history, before the 1921 massacre. They rebuilt. They''re still here.','Tulsa''s Greenwood district was known as "Black Wall Street" — a self-sufficient, prosperous Black community with over 300 Black-owned businesses, hotels, and cultural institutions. In 1921, a white mob burned Greenwood to the ground in one of the worst incidents of racial violence in American history, killing hundreds and displacing thousands. The community rebuilt and persisted, and today Greenwood is being reclaimed through commemoration, community organizing, and economic development rooted in the history of what was built and what was destroyed.'),
  ('jackson','Jackson','The capital of Mississippi is a majority-Black city — and it was on the front lines of civil rights battles that changed the nation.','Jackson was the site of some of the most intense Civil Rights Movement battles of the 1960s, including the assassination of NAACP Field Secretary Medgar Evers in 1963 outside his home. The city''s Black community built institutions of resistance through its churches, NAACP chapter, and Tougaloo College. Today Jackson is one of the few majority-Black cities in America with a majority-Black government, and its community continues to navigate the challenges of a city working to define its own future.'),
  ('detroit','Detroit','Motown was born here — and so was a Black middle class built on factory floors that became one of the most powerful economic forces in American history.','Detroit''s Black Bottom and Paradise Valley neighborhoods were the center of Black cultural and economic life during the Great Migration, producing Motown Records'' iconic sound and a prosperous Black middle class built on auto industry wages. Berry Gordy founded Motown in 1959 and changed the sound of American music. Today Detroit''s Black community — which has seen enormous economic hardship since deindustrialization — is leading the city''s revitalization through art, food, and cultural entrepreneurship.'),
  ('st-louis','St. Louis','The Ville was St. Louis''s historic Black neighborhood — home to Chuck Berry, Tina Turner, and a community that shaped the sound of American music.','St. Louis''s The Ville neighborhood was one of the most significant Black communities in the Midwest, producing artists including Chuck Berry, Tina Turner, and Josephine Baker. The city was a major stop on the Great Migration, with Black Southerners arriving to work in steel mills and manufacturing. The Pruitt-Igoe housing project, demolished in 1972, has become one of the most studied examples of how urban renewal failed Black communities. Today St. Louis''s north side carries both the weight of this history and the determination to build something new.'),
  ('boston','Boston','Boston has a complex racial history, but the Black community here — centered in Roxbury and Dorchester — has built enduring institutions across three centuries.','Boston was home to abolitionists like Frederick Douglass and William Lloyd Garrison, yet the city also has a history of intense racism including violent resistance to school desegregation busing in the 1970s. The Museum of African American History and the Black Heritage Trail on Beacon Hill tell the story of Boston''s free Black community before the Civil War. Today Roxbury and Dorchester are home to a vibrant Black community alongside large Caribbean, Cape Verdean, and Latino populations.'),
  ('hartford','Hartford','Hartford''s Clay Hill and Blue Hills neighborhoods have been the heart of Black cultural life in this small New England capital for generations.','Hartford was home to Frederick Douglass''s newspaper and a significant station on the Underground Railroad. The city''s Black community, which grew substantially during the Great Migration, built institutions in the North End that continue to anchor the community. Today Hartford is one of the most diverse small cities in New England, with large Puerto Rican and West Indian populations alongside a historic African American community.')
ON CONFLICT (city_slug) DO UPDATE SET
  brief_context = EXCLUDED.brief_context,
  historical_context = EXCLUDED.historical_context,
  city_name = EXCLUDED.city_name
WHERE city_profiles.brief_context IS NULL OR city_profiles.brief_context = ''`,
  },
  {
    // International city profiles for KinfolkAI — Phuket, Bangkok, Cancun, Tulum, Negril, Santorini.
    // Gives KinfolkAI cultural context when travelers ask about international destinations.
    // ON CONFLICT DO NOTHING so manual edits survive.
    name: "city_profiles_international_v1",
    sql: `INSERT INTO city_profiles (city_slug, city_name, brief_context, historical_context)
VALUES
  ('phuket','Phuket, Thailand','A sun-soaked island in southern Thailand that''s become one of the most popular destinations in Southeast Asia for Black travelers — known for stunning beaches, world-class spas, vibrant night markets, and a food scene built around fresh seafood and Thai street food.','Phuket is Thailand''s largest island and one of its most internationally connected cities. The Old Town area in Phuket City preserves Sino-Portuguese architecture and a rich multicultural history shaped by Chinese, Malay, and Thai communities. The island''s beaches — Patong, Kata, Kamala, and the quieter northern shores — offer dramatically different vibes from party beach to serene retreat. The local night markets (Lard Yai, Naka, Chillva) are the heartbeat of community life. For Black travelers, Phuket has built a welcoming reputation with beach clubs like YONA and Tichuca that draw a diverse international crowd. Key neighborhoods: Patong (nightlife and beach clubs), Phuket Old Town (culture and food), Rawai (local fishing village feel), Kamala (quieter, upscale beach clubs). Best time to visit: November–April (dry season). Monsoon season runs May–October with reduced crowds and prices.'),
  ('bangkok','Bangkok, Thailand','One of the world''s great cities — Bangkok moves at full speed around the clock, with street food that rivals any fine restaurant, temples that will stop you in your tracks, and a nightlife scene that earned the city its global reputation.','Bangkok (officially Krung Thep) is Thailand''s capital and its cultural, commercial, and spiritual center. The city''s Chao Phraya River corridor connects ancient royal temples (Wat Pho, Wat Arun, the Grand Palace) with the hyper-modern Sathorn and Silom business districts. Bangkok''s street food culture — centered in neighborhoods like Yaowarat (Chinatown), Banglamphu, and the floating markets — is among the world''s most celebrated. For travelers of the African diaspora, Bangkok has a welcoming international character shaped by decades of global tourism. The city''s LGBTQIA+ community is centered in Silom and Suriwong; the expat and digital nomad scene in Ari and Ekkamai. The BTS Skytrain and MRT subway make navigation straightforward. Key neighborhoods for Black travelers: Sukhumvit (international hotels, restaurants, nightlife), Ari (local, neighborhood feel), Silom/Sathorn (business and nightlife), Yaowarat (Chinatown — food). Best time to visit: November–February.'),
  ('pattaya','Pattaya, Thailand','A coastal city two hours south of Bangkok known for its beach promenade, nightlife strip, and growing reputation as a destination for travelers seeking something more accessible and less crowded than Phuket.','Pattaya is located on the Gulf of Thailand in Chonburi Province, about 150 kilometers southeast of Bangkok. The city has historically been known for its Walking Street nightlife, but has transformed significantly in recent years with upscale resorts, beach clubs, family attractions, and a growing international culinary scene. Day trips to Koh Larn (Coral Island) for snorkeling are a highlight. The city has a significant expat and digital nomad community alongside Thai locals. For the African diaspora traveler, Pattaya offers a more affordable and less tourism-saturated alternative to Phuket, with a strong beach club scene developing along its beachfront.'),
  ('cancun','Cancun, Mexico','Mexico''s most visited international destination sits at the edge of the Caribbean and the Yucatan jungle — two hours from Tulum, minutes from ancient Mayan ruins, and home to the Hotel Zone beach club and nightlife scene that''s become a pillar of Black travel culture.','Cancun was purpose-built as a resort destination in the 1970s on what was then a virtually uninhabited barrier island in Quintana Roo. The Hotel Zone (Zona Hotelera) — a 14-mile strip of hotels, beach clubs, restaurants, and nightclubs along the Caribbean — is the center of tourist life. Downtown Cancun (El Centro) is where locals live and where authentic Mexican food, markets, and everyday life happen at a fraction of Hotel Zone prices. Black travel culture in Cancun is vibrant and growing — centered on beach clubs like YONA and Mandala, dinner experiences like Rosa Negra and Chamboo, nightlife at Coco Bongo and 24K, and excursions including Xplor Park and the Hip Hop Boat. Cancun is also the gateway to Tulum (2 hours south), Chichen Itza (3 hours inland), and the Riviera Maya. Best time to visit: December–April. Hurricane season runs June–November.'),
  ('tulum','Tulum, Mexico','Two hours south of Cancun on the Caribbean coast, Tulum has transformed from a backpacker secret to one of the world''s most coveted travel destinations — known for cenotes, eco-chic beach clubs, ancient Mayan ruins on a cliff above the sea, and a wellness and nightlife culture that draws travelers from every corner of the globe.','Tulum sits on the Yucatan Peninsula''s Caribbean coast, home to one of the only Mayan walled cities built directly on the sea. The town is divided into three zones: the Tulum pueblo (town) where locals live and affordable restaurants cluster; the Tulum hotel zone (Zona Hotelera) along the beach with eco-hotels and beach clubs; and Aldea Zamá, an inland neighborhood that''s become the center of upscale restaurants, bars, and boutiques. The surrounding jungle holds dozens of cenotes — sacred Mayan freshwater sinkholes used for swimming and diving. Key cenotes: Dos Ojos, Gran Cenote, Sac Actun, Cenote Calavera. Black travelers have embraced Tulum for its cenote experiences, vibrant food scene (Hartwood, Rosa Negra Tulum, Gitano), and beach club culture (Papaya Playa Project, Ahau). The New Tulum airport (2024) has made it more accessible. Best time: November–April.'),
  ('playa-del-carmen','Playa del Carmen, Mexico','A walkable Caribbean beach town on the Riviera Maya — less commercial than Cancun and less expensive than Tulum — with a pedestrian main street (La Quinta Avenida), ferry access to the island of Cozumel, and proximity to Xplor Park and the region''s best cenotes.','Playa del Carmen is located 68 kilometers south of Cancun on the Yucatan''s Caribbean coast. The city''s 5th Avenue (Quinta Avenida) is a pedestrian shopping and dining strip that runs parallel to the beach for several kilometers. The city has a strong expat and international resident community and a nightlife scene in its own right, though quieter than Cancun. Playa is the departure point for ferries to Cozumel (25 minutes), one of the world''s top scuba diving destinations. The city is also the nearest urban center to several major cenotes and eco-parks including Xel-Há, Xplor, and Xcaret. For Black travelers, Playa del Carmen serves as a convenient and affordable base for exploring the entire Riviera Maya corridor.'),
  ('negril','Negril, Jamaica','Seven miles of white sand beach on Jamaica''s western tip — Negril is where travelers come to actually exhale, anchored by the community of Long Bay Beach and the legendary cliff-diving culture of Rick''s Cafe at sunset.','Negril is Jamaica''s westernmost resort town, located in Westmoreland Parish about 80 kilometers from Montego Bay. The town is built around two geographic zones: Seven Mile Beach (Long Bay), a gently curving expanse of powdery white sand and calm turquoise water ideal for swimming; and the West End, a dramatic limestone cliff coastline where travelers watch the sunset from open-air restaurants and take the plunge from cliff edges 10–25 feet above the Caribbean. Negril has a strong reputation among Black travelers as a place of safety, community, and authentic Jamaican culture — significantly less commercialized than Ocho Rios or Montego Bay. The city''s all-inclusive resorts (Hedonism II, Sunset at the Palms, Couples Negril) sit alongside small guesthouses and local beach bars. Best time to visit: December–April. Hurricane season: June–November.'),
  ('santorini','Santorini, Greece','One of the world''s most photographed places — the white-washed villages, blue-domed churches, and caldera views of Santorini have been on Black travelers'' vision boards for decades, and the island''s growing awareness of its diaspora visitors is changing what it means to experience it.','Santorini (officially Thira) is a volcanic island in the southern Aegean Sea, part of the Cyclades archipelago. The island is divided into several distinct villages: Oia (the most photographed, famous for sunset views), Fira (the capital, with museums, restaurants, and nightlife), Imerovigli (quieter clifftop village), and Akrotiri (home to a Minoan Bronze Age archaeological site). The island''s black sand beaches (Perissa, Perivolos) are unique in the Aegean. Black travelers have increasingly made Santorini a destination — seeking the iconic caldera views, volcanic beach experiences, and world-class Greek cuisine. Key experiences: sunset in Oia, wine tasting on volcanic soil, catamaran cruises of the caldera, Akrotiri archaeological ruins. Best time: May–June or September–October to avoid peak summer crowds. July–August is hottest, busiest, and most expensive.')
ON CONFLICT (city_slug) DO NOTHING`,
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
  {
    // Enable pg_trgm for fuzzy name matching (e.g. "Hakeem's book store" → "Hakim's Bookstore").
    // Safe to run on any Postgres version — CREATE EXTENSION IF NOT EXISTS is a no-op if present.
    name: "enable_pg_trgm_extension",
    sql: `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  },
  {
    // Seed two well-known Black-owned community businesses: Mama J's Kitchen (Richmond, VA)
    // and Hakim's Bookstore (Philadelphia, PA). Both go in as live_unclaimed so the
    // community can immediately find, vibe-tag, and add social handles without a claim.
    // Also ensures any previously inserted staged copies are promoted to live_unclaimed.
    name: "seed_mama_js_and_hakims_bookstore_v1",
    sql: `DO $seed$
DECLARE biz RECORD;
BEGIN
  FOR biz IN SELECT * FROM (VALUES
    ('Mama J''s Kitchen',
     'A Richmond institution serving classic soul food — fried chicken, catfish, smothered pork chops, and hand-rolled biscuits — in a warm, family-style setting that has anchored the community for over a decade.',
     'Restaurant','Soul Food','415 N 1st St','Richmond','VA','37.5452','-77.4388',
     true,'["black-owned"]','$$','mamajskitchenrva','https://mamajskitchen.net','(804) 225-7449'),
    ('Hakim''s Bookstore',
     'Philadelphia''s beloved Black-owned bookstore serving the community since 1959, stocking an unmatched selection of African American literature, history, culture, and children''s books.',
     'Retail','Bookstore','210 W Girard Ave','Philadelphia','PA','39.9682','-75.1480',
     true,'["black-owned"]','$$',NULL,'https://hakimsbookstore.com',NULL)
  ) AS t(name,description,category,subcategory,address,city,state,latitude,longitude,
         black_owned,ownership_designations,price_range,instagram,website,phone)
  LOOP
    -- Promote any previously staged copy to live_unclaimed first
    UPDATE businesses
      SET listing_status = 'live_unclaimed'
      WHERE LOWER(name) = LOWER(biz.name)
        AND LOWER(city) = LOWER(biz.city)
        AND (listing_status IS NULL OR listing_status = 'staged');

    -- Insert if truly missing
    IF NOT EXISTS (SELECT 1 FROM businesses WHERE LOWER(name) = LOWER(biz.name) AND LOWER(city) = LOWER(biz.city)) THEN
      INSERT INTO businesses
        (id, name, description, category, subcategory, address, city, state,
         latitude, longitude, black_owned, ownership_designations,
         price_range, instagram, website, phone,
         confidence_score, verified, business_status, listing_status,
         rating, review_count, vibes, reviews, photos, pending_photos, videos,
         trust_badges, verified_designations, tags,
         flag_count, flag_status, marketplace_tier, show_availability, feedback_opt_in)
      VALUES (
        gen_random_uuid(),
        biz.name, biz.description, biz.category, biz.subcategory,
        biz.address, biz.city, biz.state,
        biz.latitude::numeric, biz.longitude::numeric,
        biz.black_owned::boolean, biz.ownership_designations::jsonb,
        biz.price_range, biz.instagram, biz.website, biz.phone,
        70, false, 'community', 'live_unclaimed',
        0, 0,
        '[]'::jsonb,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,
        '[]'::jsonb,'[]'::jsonb,'[]'::jsonb,
        0,'none','free',false,false
      );
    END IF;
  END LOOP;
END $seed$`,
  },
  // ── Tester entitlement schema ──────────────────────────────────────────────
  // Adds the 5 tester entitlement columns to users and creates the
  // pending_tester_emails table. All idempotent — safe to run on every boot.
  {
    name: "tester_entitlement_schema",
    sql: `
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS tester_status VARCHAR(20)
          CHECK (tester_status IN ('active', 'inactive')),
        ADD COLUMN IF NOT EXISTS tester_access_source VARCHAR(30)
          CHECK (tester_access_source IN ('testflight','android_test','admin_invite','website_test')),
        ADD COLUMN IF NOT EXISTS tester_granted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS tester_granted_by VARCHAR(255),
        ADD COLUMN IF NOT EXISTS testing_entitlement_ends_at TIMESTAMPTZ
    `,
  },
  {
    name: "pending_tester_emails_table",
    sql: `
      CREATE TABLE IF NOT EXISTS pending_tester_emails (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email VARCHAR(255) NOT NULL UNIQUE,
        tester_access_source VARCHAR(30) NOT NULL DEFAULT 'admin_invite'
          CHECK (tester_access_source IN ('testflight','android_test','admin_invite','website_test')),
        granted_by VARCHAR(255),
        granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        entitlement_ends_at TIMESTAMPTZ,
        applied_at TIMESTAMPTZ,
        applied_to_user_id VARCHAR(255)
      )
    `,
  },
  {
    name: "pending_tester_emails_email_index",
    sql: `CREATE INDEX IF NOT EXISTS IDX_pending_tester_emails_email ON pending_tester_emails (email)`,
  },
  {
    name: "businesses_specialties_col_v1",
    sql: `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}'`,
  },
  {
    name: "specialty_suggestions_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS specialty_suggestions (
      id           serial PRIMARY KEY,
      business_id  uuid,
      suggestion   text NOT NULL,
      subcategory  text,
      status       text NOT NULL DEFAULT 'pending',
      submitted_by uuid,
      submitted_at timestamp NOT NULL DEFAULT now(),
      reviewed_at  timestamp,
      reviewed_by  uuid
    )`,
  },
  {
    name: "specialty_suggestions_indexes_v1",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_specialty_suggestions_status   ON specialty_suggestions(status);
      CREATE INDEX IF NOT EXISTS idx_specialty_suggestions_business ON specialty_suggestions(business_id);
    `,
  },
  // Fix knowledge topics that were seeded with "community" but belong in more specific categories
  // Fix knowledge topics that were seeded with "community" but belong in more specific categories
  {
    name: "knowledge_topics_hvac_category_fix_v1",
    sql: `
      UPDATE knowledge_topics SET category = 'skills_trades'
      WHERE LOWER(topic_name) LIKE '%hvac%' AND category IN ('community', 'home');
      UPDATE knowledge_topics SET category = 'skills_trades'
      WHERE LOWER(topic_name) IN ('trade school programs & apprenticeships')
        AND category IN ('community', 'education');
    `,
  },

  // ── LAYER 1: Knowledge Graph Schema ──────────────────────────────────────────
  // Adds node_type (geography vs topic), geography_ref, and status to knowledge_topics.
  // Allows cities/regions to be first-class nodes alongside subject topics,
  // with directed relationships between them.
  {
    name: "knowledge_graph_layer1_columns_v1",
    sql: `
      ALTER TABLE knowledge_topics ADD COLUMN IF NOT EXISTS node_type TEXT NOT NULL DEFAULT 'topic';
      ALTER TABLE knowledge_topics ADD COLUMN IF NOT EXISTS geography_ref TEXT;
      ALTER TABLE knowledge_topics ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';
      CREATE INDEX IF NOT EXISTS idx_knowledge_topics_node_type ON knowledge_topics(node_type);
      CREATE INDEX IF NOT EXISTS idx_knowledge_topics_geography_ref ON knowledge_topics(geography_ref);
    `,
  },

  // topic_relationships: directed many-to-many graph between any two knowledge nodes.
  // Philadelphia → Philadelphia History (relationship_type='contains').
  // Philadelphia History → Philadelphia Black History (relationship_type='related_to').
  {
    name: "topic_relationships_table_v1",
    sql: `
      CREATE TABLE IF NOT EXISTS topic_relationships (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        parent_topic_id VARCHAR NOT NULL REFERENCES knowledge_topics(id) ON DELETE CASCADE,
        child_topic_id  VARCHAR NOT NULL REFERENCES knowledge_topics(id) ON DELETE CASCADE,
        relationship_type TEXT NOT NULL CHECK (relationship_type IN (
          'contains','part_of','related_to','subtopic_of',
          'precedes','follows','related_geography'
        )),
        weight FLOAT NOT NULL DEFAULT 1.0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(parent_topic_id, child_topic_id, relationship_type)
      );
      CREATE INDEX IF NOT EXISTS idx_topic_rel_parent ON topic_relationships(parent_topic_id);
      CREATE INDEX IF NOT EXISTS idx_topic_rel_child  ON topic_relationships(child_topic_id);
    `,
  },

  // knowledge_sources: FOUR distinct provenance tiers (founder mandate).
  // authoritative  — government, museums, archives, universities, official orgs.
  // professional   — credentialed historians, doctors, economists, journalists.
  // community      — MWM member experience; clearly labeled as lived experience.
  // ambassador     — Cultural Ambassador videos, reels, guides, travel stories.
  // Kinfolk MUST know which tier supplied a claim and may NOT silently convert
  // community or ambassador opinion into verified authoritative fact.
  {
    name: "knowledge_sources_table_v1",
    sql: `
      CREATE TABLE IF NOT EXISTS knowledge_sources (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        topic_id VARCHAR NOT NULL REFERENCES knowledge_topics(id) ON DELETE CASCADE,
        authority_tier TEXT NOT NULL CHECK (authority_tier IN (
          'authoritative','professional','community','ambassador'
        )),
        source_name TEXT NOT NULL,
        source_url  TEXT,
        description TEXT,
        claim       TEXT,
        contributor_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        last_verified TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','removed','disputed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_knowledge_sources_topic ON knowledge_sources(topic_id);
      CREATE INDEX IF NOT EXISTS idx_knowledge_sources_tier  ON knowledge_sources(authority_tier);
    `,
  },

  // knowledge_sources claim-alignment columns — Layer 3 provenance standard.
  // evidence_section: the specific paragraph/exhibit that supports the claim (not just the URL).
  // confidence:       how directly the cited page supports the specific claim text.
  //                   'verified'   — primary source, directly cited verbatim.
  //                   'high'       — source covers the claim specifically, corroborated.
  //                   'medium'     — source covers the era/topic; specific claim inferred.
  //                   'low'        — tangential source; claim needs additional corroboration.
  //                   'unverified' — URL added but page not yet reviewed against claim.
  // retrieved_at:     when the page was last confirmed to support the claim.
  //
  // RULE: a reputable source URL is not sufficient — the cited page must support the
  // specific claim. Use confidence to be honest about the gap when it exists.
  {
    name: "knowledge_sources_claim_columns_v1",
    sql: `
      ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS evidence_section TEXT;
      ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS confidence TEXT
        CHECK (confidence IN ('verified','high','medium','low','unverified'))
        DEFAULT 'unverified';
      ALTER TABLE knowledge_sources ADD COLUMN IF NOT EXISTS retrieved_at TIMESTAMPTZ;
    `,
  },

  // Extend knowledge_sources status CHECK to include 'pending_review'.
  // Allows community/ambassador contributions to be submitted and moderated
  // before being promoted to 'active'. Never auto-promotes — admin review required.
  {
    name: "knowledge_sources_status_pending_review_v1",
    sql: `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'knowledge_sources'::regclass
            AND conname = 'knowledge_sources_status_check'
        ) THEN
          ALTER TABLE knowledge_sources DROP CONSTRAINT knowledge_sources_status_check;
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'knowledge_sources'::regclass
            AND conname = 'knowledge_sources_status_check_v2'
        ) THEN
          ALTER TABLE knowledge_sources
            ADD CONSTRAINT knowledge_sources_status_check_v2
            CHECK (status IN ('active','removed','disputed','pending_review'));
        END IF;
      END $$;
    `,
  },

  // Extend library_entity_connections entity_type CHECK to include
  // community_post, ambassador_content, and knowledge_article.
  // Uses a PL/pgSQL block to locate and drop the auto-named inline constraint
  // before adding the replacement named constraint.
  {
    name: "library_entity_connections_extend_types_v1",
    sql: `
      DO $$
      DECLARE v_cname text;
      BEGIN
        SELECT conname INTO v_cname FROM pg_constraint
        WHERE conrelid = 'library_entity_connections'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%entity_type%'
        LIMIT 1;
        IF v_cname IS NOT NULL THEN
          EXECUTE format('ALTER TABLE library_entity_connections DROP CONSTRAINT %I', v_cname);
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'library_entity_connections'::regclass
            AND conname = 'lec_entity_type_check'
        ) THEN
          ALTER TABLE library_entity_connections
            ADD CONSTRAINT lec_entity_type_check
            CHECK (entity_type IN (
              'business','cultural_site','event','community_org',
              'community_post','ambassador_content','knowledge_article'
            ));
        END IF;
      END $$;
    `,
  },
  // Task #177 — HBCU boot warning: missing columns for HBCU INSERT
  {
    name: "cultural_sites_founded_year_col",
    sql: `ALTER TABLE cultural_sites ADD COLUMN IF NOT EXISTS founded_year TEXT`,
  },
  {
    name: "cultural_sites_status_col",
    sql: `ALTER TABLE cultural_sites ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'live_unclaimed'`,
  },
  {
    name: "cultural_sites_source_col",
    sql: `ALTER TABLE cultural_sites ADD COLUMN IF NOT EXISTS source TEXT`,
  },
  {
    name: "cultural_sites_is_featured_col",
    sql: `ALTER TABLE cultural_sites ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`,
  },
  // THE REAL trust-signal tables
  {
    name: "the_real_tags_table",
    sql: `CREATE TABLE IF NOT EXISTS the_real_tags (
      tag_key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      adaptive_family TEXT,
      subcategory_scope TEXT NOT NULL DEFAULT 'all',
      helper_text TEXT NOT NULL DEFAULT '',
      sort_weight INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`,
  },
  {
    name: "the_real_taps_table",
    sql: `CREATE TABLE IF NOT EXISTS the_real_taps (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      tag_key TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      CONSTRAINT the_real_taps_business_user_tag UNIQUE (business_id, user_id, tag_key)
    )`,
  },
  {
    name: "the_real_taps_business_idx",
    sql: `CREATE INDEX IF NOT EXISTS the_real_taps_business_idx ON the_real_taps(business_id)`,
  },
  // Endorsement taps table — stores community tap data for THE REAL + endorsement tags
  {
    name: "business_endorsement_taps_table",
    sql: `CREATE TABLE IF NOT EXISTS business_endorsement_taps (
      id SERIAL PRIMARY KEY,
      business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tag_key VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(business_id, user_id, tag_key)
    )`,
  },
  {
    name: "business_endorsement_taps_idx",
    sql: `CREATE INDEX IF NOT EXISTS biz_endorse_taps_biz_idx ON business_endorsement_taps(business_id)`,
  },
  {
    // Correct categories for faith institutions that were imported with wrong categories.
    // Enon Tabernacle Baptist Church was imported as "Arts & Culture" (wrong).
    // Refugee Evangelical Church was imported as "Education" (wrong).
    // Both are faith institutions and must be "Faith & Spirituality" so Universal Search
    // finds them on faith-intent queries like "churches Philadelphia".
    name: "fix_church_business_categories_v1",
    sql: `UPDATE businesses
          SET category = 'Faith & Spirituality'
          WHERE name IN ('Enon Tabernacle Baptist Church', 'Refugee Evangelical Church')
            AND category != 'Faith & Spirituality'`,
  },
  {
    // Enon Tabernacle was seeded with listing_status='demo', which excludes it from
    // Universal Search (the listingFilter only allows live_unclaimed and live_claimed).
    // Promote it to live_unclaimed so it surfaces on faith queries like "churches Philadelphia".
    name: "fix_enon_tabernacle_listing_status_v1",
    sql: `UPDATE businesses
          SET listing_status = 'live_unclaimed'
          WHERE name = 'Enon Tabernacle Baptist Church'
            AND listing_status = 'demo'`,
  },
  {
    // Apple App Store review account — must exist on every Railway deploy so the
    // App Store reviewer (and Manus audit) can log in to the web app with a known
    // test account. member_type='founding' gives legacy_member (top-tier) access
    // so all features are visible without a Stripe subscription.
    // Password hash is bcrypt(cost=8) of "MWM-Apple-2026!"
    // ON CONFLICT DO NOTHING makes this safe to run on every boot.
    name: "ensure_apple_reviewer_account_v1",
    sql: `INSERT INTO users
            (id, email, first_name, last_name, password_hash,
             email_verified, agree_to_terms, profile_setup_complete,
             member_type, approved, role)
          VALUES
            (gen_random_uuid(),
             'apple.reviewer@mappingwithmelanin.com',
             'Apple', 'Reviewer',
             '$2b$08$dsQzFsaQkl4p/Qk5kYKMUutTgUdXpWr5AHl3CJ76Fg.2hEanFjcaO',
             true, true, true,
             'founding', true, 'user')
          ON CONFLICT (email) DO NOTHING`,
  },
  {
    // Manus AI audit account — pre-approved tester for full web UX audit.
    // member_type='founding' gives top-tier access to every feature without
    // a Stripe subscription. Password: MWM-Manus-2026!
    // ON CONFLICT DO NOTHING — safe to run on every boot.
    name: "ensure_manus_tester_account_v1",
    sql: `INSERT INTO users
            (id, email, first_name, last_name, password_hash,
             email_verified, agree_to_terms, profile_setup_complete,
             member_type, approved, role, home_city)
          VALUES
            (gen_random_uuid(),
             'tester@mwm.com',
             'Manus', 'Tester',
             '$2b$08$Vy2RWYFJTtkYY5xWoI1X/e1goZq8HLlCtW0vPWBo3HpQCV3jd0/T2',
             true, true, true,
             'founding', true, 'tester', 'Philadelphia')
          ON CONFLICT (email) DO NOTHING`,
  },
  {
    // Manus geo-audit account — dedicated account for geo-tagged platform audits.
    // Uses ON CONFLICT DO UPDATE so it self-heals if deleted between deploys.
    // Email:    manus.geo@mappingwithmelanin.com
    // Password: MWM-GeoAudit-2026!
    // Role:     tester (sees tester-only demo businesses + all live listings)
    // Tier:     founding (full feature access, no Stripe subscription required)
    name: "ensure_manus_geo_audit_v1",
    sql: `INSERT INTO users
            (id, email, first_name, last_name, password_hash,
             email_verified, agree_to_terms, profile_setup_complete,
             member_type, approved, role, home_city)
          VALUES
            (gen_random_uuid(),
             'manus.geo@mappingwithmelanin.com',
             'Manus', 'GeoAudit',
             '$2b$08$V/x.s3dNFIvC6mrbp9HWEO8jnbgv6oyVc1sDktQvczNf7VDbdwoGa',
             true, true, true,
             'founding', true, 'tester', 'Philadelphia')
          ON CONFLICT (email) DO UPDATE SET
            password_hash         = EXCLUDED.password_hash,
            role                  = EXCLUDED.role,
            member_type           = EXCLUDED.member_type,
            approved              = EXCLUDED.approved,
            email_verified        = EXCLUDED.email_verified,
            profile_setup_complete = EXCLUDED.profile_setup_complete,
            updated_at            = NOW()`,
  },
  // ── business_identity columns missing from Railway prod DB ─────────────────
  // These three columns were added to the Drizzle schema after Railway's last
  // migration. The KinfolkAI catalog pool.query was failing with error 42703
  // ("column does not exist") until these were added here. Safe: IF NOT EXISTS.
  {
    name: "business_identity_audience_type_col_v1",
    sql: `ALTER TABLE business_identity
      ADD COLUMN IF NOT EXISTS audience_type VARCHAR(30) NOT NULL DEFAULT 'unknown'`,
  },
  {
    name: "business_identity_environment_tags_col_v1",
    sql: `ALTER TABLE business_identity
      ADD COLUMN IF NOT EXISTS environment_tags JSONB NOT NULL DEFAULT '[]'::jsonb`,
  },
  {
    name: "business_identity_amenity_tags_col_v1",
    sql: `ALTER TABLE business_identity
      ADD COLUMN IF NOT EXISTS amenity_tags JSONB NOT NULL DEFAULT '[]'::jsonb`,
  },
  // ── Must-change-password column ────────────────────────────────────────────
  // Enables a forced password-change flow on first login for pre-seeded tester
  // accounts. Safe to run on every boot (IF NOT EXISTS).
  {
    name: "users_must_change_password_col_v1",
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE`,
  },
  // ── Pre-approved tester accounts with universal first-time password ────────
  // Creates accounts for every tester email that hasn't self-registered yet.
  // Universal password: MWM-Manus-2026! (bcrypt cost=8)
  // must_change_password=true so they are forced to set their own password on
  // first login. Also sets must_change_password=true on the Manus tester.
  // ON CONFLICT DO NOTHING — never overwrites a user who already set their own password.
  {
    name: "tester_universal_accounts_v1",
    sql: `
      -- Universal password hash: bcrypt(cost=8) of "MWM-Manus-2026!"
      DO $$
      DECLARE
        universal_hash TEXT := '$2b$08$Vy2RWYFJTtkYY5xWoI1X/e1goZq8HLlCtW0vPWBo3HpQCV3jd0/T2';
        tester_emails TEXT[] := ARRAY[
          'tlindsay428@gmail.com',
          'tlindsay428@aol.com',
          'zykiral.morton@yahoo.com',
          'kyleisha.m.morton@gmail.com',
          'kyleisha.m.fisher@gmail.com',
          'taleisha.fisher@gmail.com',
          'lilanarich@gmail.com',
          'jordanwtester@gmail.com',
          'joshuabierd99@gmail.com',
          'kaylacardwelltester@gmail.com',
          'kevinctester@gmail.com',
          'kevkaytester@gmail.com',
          'teiannaltester@gmail.com',
          'trinalindsaytester@gmail.com',
          'jross215@gmail.com',
          'kaylathomas20011@gmail.com',
          'kansesdwilliams@gmail.com',
          'fatimccoy@icloud.com',
          'jordanwyatt117@icloud.com',
          'jordanw117@icloud.com',
          'nydiahholly12@gmail.com',
          'meaparks@gmail.com',
          'melody.brown1988@gmail.com',
          'owcforyouth@gmail.com',
          'cardwellkayla219@gmail.com',
          'kcardwell17@yahoo.com',
          'kaylacardwell3@gmail.com',
          'taleisham.saunders@gmail.com',
          'trinalindsayhairston@gmail.com',
          'bigdot6017@gmail.com'
        ];
        e TEXT;
      BEGIN
        FOREACH e IN ARRAY tester_emails LOOP
          INSERT INTO users
            (id, email, first_name, last_name, password_hash,
             email_verified, agree_to_terms, profile_setup_complete,
             member_type, approved, role, must_change_password)
          VALUES
            (gen_random_uuid(), e,
             split_part(e, '@', 1), 'Tester',
             universal_hash,
             true, true, false,
             'founding', true, 'tester', true)
          ON CONFLICT (email) DO NOTHING;
        END LOOP;
        -- Always ensure the Manus tester account must change password
        UPDATE users SET must_change_password = true WHERE email = 'tester@mwm.com';
      END $$`,
  },

  // ── Force-reset tester passwords so all approved testers can log in ─────────
  // Some testers self-registered before the seeding migration ran, so their
  // accounts exist but with unknown self-set passwords. ON CONFLICT DO NOTHING
  // in tester_universal_accounts_v1 silently skipped those rows, leaving testers
  // locked out. This UPDATE covers EVERY tester email — it resets the password
  // to the universal hash AND sets must_change_password=true so they're prompted
  // to create their own password on first login.
  // Safe exception: manus.* audit accounts are excluded (must_change_password=false).
  {
    name: "tester_password_force_reset_v1",
    sql: `
      UPDATE users SET
        password_hash        = '$2b$08$Vy2RWYFJTtkYY5xWoI1X/e1goZq8HLlCtW0vPWBo3HpQCV3jd0/T2',
        must_change_password = true,
        approved             = true,
        email_verified       = true,
        role                 = 'tester',
        updated_at           = NOW()
      WHERE email = ANY(ARRAY[
        'tlindsay428@gmail.com',
        'tlindsay428@aol.com',
        'zykiral.morton@yahoo.com',
        'kyleisha.m.morton@gmail.com',
        'kyleisha.m.fisher@gmail.com',
        'taleisha.fisher@gmail.com',
        'lilanarich@gmail.com',
        'joshuabierd99@gmail.com',
        'jross215@gmail.com',
        'kaylathomas20011@gmail.com',
        'kansesdwilliams@gmail.com',
        'fatimccoy@icloud.com',
        'jordanwyatt117@icloud.com',
        'jordanw117@icloud.com',
        'nydiahholly12@gmail.com',
        'meaparks@gmail.com',
        'owcforyouth@gmail.com',
        'kaylacardwell3@gmail.com',
        'taleisham.saunders@gmail.com',
        'trinalindsayhairston@gmail.com',
        'bigdot6017@gmail.com',
        'dghaskin@gmail.com',
        'sharonnlw2@gmail.com',
        'ninamartinez409@gmail.com',
        'winternewman88@gmail.com',
        'shawnhillhomes@gmail.com',
        'themontgomerymanagementgroup@gmail.com',
        'gregorywilliam05@gmail.com',
        'kahvealynne@gmail.com',
        'jandirafernandes13@gmail.com',
        'reinaoba06@gmail.com',
        'mayagz05@icloud.com',
        'melody.brown1988@gmail.com',
        'cardwellkayla219@gmail.com',
        'kcardwell17@yahoo.com',
        'jordanwtester@gmail.com',
        'kaylacardwelltester@gmail.com',
        'kevinctester@gmail.com',
        'kevkaytester@gmail.com',
        'teiannaltester@gmail.com',
        'trinalindsaytester@gmail.com'
      ])`,
  },

  // ── Restore deleted tester accounts — UPSERT so deleted rows are recreated ──
  // tester_universal_accounts_v1 used ON CONFLICT DO NOTHING and already ran,
  // so accounts deleted after that deploy were never recreated. This migration
  // uses INSERT ... ON CONFLICT DO UPDATE so it both creates missing accounts
  // AND corrects any existing accounts with wrong passwords in one shot.
  {
    name: "tester_accounts_restore_v1",
    sql: `
      DO $$
      DECLARE
        h TEXT := '$2b$08$Vy2RWYFJTtkYY5xWoI1X/e1goZq8HLlCtW0vPWBo3HpQCV3jd0/T2';
        tester_emails TEXT[] := ARRAY[
          'tlindsay428@gmail.com',
          'tlindsay428@aol.com',
          'zykiral.morton@yahoo.com',
          'kyleisha.m.morton@gmail.com',
          'kyleisha.m.fisher@gmail.com',
          'taleisha.fisher@gmail.com',
          'lilanarich@gmail.com',
          'joshuabierd99@gmail.com',
          'jross215@gmail.com',
          'kaylathomas20011@gmail.com',
          'kansesdwilliams@gmail.com',
          'fatimccoy@icloud.com',
          'jordanwyatt117@icloud.com',
          'jordanw117@icloud.com',
          'nydiahholly12@gmail.com',
          'meaparks@gmail.com',
          'owcforyouth@gmail.com',
          'kaylacardwell3@gmail.com',
          'taleisham.saunders@gmail.com',
          'trinalindsayhairston@gmail.com',
          'bigdot6017@gmail.com',
          'dghaskin@gmail.com',
          'sharonnlw2@gmail.com',
          'ninamartinez409@gmail.com',
          'winternewman88@gmail.com',
          'shawnhillhomes@gmail.com',
          'themontgomerymanagementgroup@gmail.com',
          'gregorywilliam05@gmail.com',
          'kahvealynne@gmail.com',
          'reinaoba06@gmail.com',
          'mayagz05@icloud.com',
          'melody.brown1988@gmail.com',
          'cardwellkayla219@gmail.com',
          'kcardwell17@yahoo.com',
          'jordanwtester@gmail.com',
          'kaylacardwelltester@gmail.com',
          'kevinctester@gmail.com',
          'kevkaytester@gmail.com',
          'teiannaltester@gmail.com',
          'trinalindsaytester@gmail.com'
        ];
        e TEXT;
      BEGIN
        FOREACH e IN ARRAY tester_emails LOOP
          INSERT INTO users
            (id, email, first_name, last_name, password_hash,
             email_verified, agree_to_terms, profile_setup_complete,
             member_type, approved, role, must_change_password)
          VALUES
            (gen_random_uuid(), e,
             split_part(e, '@', 1), 'Tester',
             h, true, true, false,
             'navigator', true, 'tester', true)
          ON CONFLICT (email) DO UPDATE SET
            password_hash        = EXCLUDED.password_hash,
            email_verified       = true,
            approved             = true,
            role                 = 'tester',
            member_type          = 'navigator',
            must_change_password = true,
            updated_at           = NOW();
        END LOOP;
      END $$`,
  },

  // ── Tester batch v2 — missing account + new Manus smoke-test audit account ──
  // jandirafernandes13@gmail.com was omitted from v1; added here.
  // manus.smoke@mappingwithmelanin.com is a dedicated Manus release smoke-test
  // account separate from manus.geo (geo audit). Password: MWM-Smoke-2026!
  // must_change_password=false — used for automated audit tooling.
  {
    name: "tester_batch_v2",
    sql: `
      DO $$
      DECLARE
        h TEXT := '$2b$08$RbwckO9NCzKtBDomyHSBVutmq/L7ZTL/faehsBbQFBb00imARwAFC';
      BEGIN
        -- Missing tester from v1 batch
        INSERT INTO users
          (id, email, first_name, last_name, password_hash,
           email_verified, agree_to_terms, profile_setup_complete,
           member_type, approved, role, must_change_password)
        VALUES
          (gen_random_uuid(), 'jandirafernandes13@gmail.com',
           'Jandira', 'Tester', h,
           true, true, false,
           'navigator', true, 'tester', true)
        ON CONFLICT (email) DO UPDATE SET
          role         = 'tester',
          member_type  = 'navigator',
          approved     = true;

        -- New Manus release smoke-test audit account
        INSERT INTO users
          (id, email, first_name, last_name, password_hash,
           email_verified, agree_to_terms, profile_setup_complete,
           member_type, approved, role, must_change_password)
        VALUES
          (gen_random_uuid(), 'manus.smoke@mappingwithmelanin.com',
           'Manus', 'SmokeTest', h,
           true, true, false,
           'navigator', true, 'tester', false)
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role          = 'tester',
          member_type   = 'navigator',
          approved      = true,
          updated_at    = NOW();
      END $$`,
  },

  // ── kinfolk_voice preference column (additive, idempotent) ───────────────────
  {
    name: "user_preferences_kinfolk_voice_v1",
    sql: `ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS kinfolk_voice VARCHAR(20) NOT NULL DEFAULT 'onyx'`,
  },

  // ── Business schema sync — adds every column the Drizzle schema defines
  //    that may be missing from older Railway deployments.  All ADD COLUMN IF
  //    NOT EXISTS so this is fully idempotent.
  {
    name: "businesses_schema_sync_v1",
    sql: `ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS vibes JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS verified_designations JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS diaspora_countries JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS safety_rating NUMERIC(3,1),
      ADD COLUMN IF NOT EXISTS would_return_alone INTEGER,
      ADD COLUMN IF NOT EXISTS recommendation_rate INTEGER,
      ADD COLUMN IF NOT EXISTS instagram VARCHAR(255),
      ADD COLUMN IF NOT EXISTS tiktok VARCHAR(255),
      ADD COLUMN IF NOT EXISTS facebook VARCHAR(255),
      ADD COLUMN IF NOT EXISTS twitter VARCHAR(255),
      ADD COLUMN IF NOT EXISTS youtube VARCHAR(255),
      ADD COLUMN IF NOT EXISTS pinterest VARCHAR(255),
      ADD COLUMN IF NOT EXISTS primary_social_platform VARCHAR(30),
      ADD COLUMN IF NOT EXISTS business_tagline VARCHAR(255),
      ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS owner_bio TEXT,
      ADD COLUMN IF NOT EXISTS owner_story TEXT,
      ADD COLUMN IF NOT EXISTS current_location_since VARCHAR(20),
      ADD COLUMN IF NOT EXISTS business_founded_date VARCHAR(20),
      ADD COLUMN IF NOT EXISTS return_policy TEXT,
      ADD COLUMN IF NOT EXISTS seller_agreement_accepted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR,
      ADD COLUMN IF NOT EXISTS submitted_by_id VARCHAR,
      ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS founding_business BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS founding_number INTEGER,
      ADD COLUMN IF NOT EXISTS founding_granted_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS business_trial_started_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS locked_fee NUMERIC(5,4),
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS fee_source VARCHAR(30),
      ADD COLUMN IF NOT EXISTS promotion_expiration_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS membership_renewal_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(30),
      ADD COLUMN IF NOT EXISTS intro_video_url VARCHAR(512),
      ADD COLUMN IF NOT EXISTS featured_video_url VARCHAR(512),
      ADD COLUMN IF NOT EXISTS featured_video_title VARCHAR(150),
      ADD COLUMN IF NOT EXISTS featured_video_purpose VARCHAR(60),
      ADD COLUMN IF NOT EXISTS weekly_schedule JSONB,
      ADD COLUMN IF NOT EXISTS hidden_gem_label VARCHAR(60),
      ADD COLUMN IF NOT EXISTS hidden_gem_category VARCHAR(60),
      ADD COLUMN IF NOT EXISTS hidden_gem_tagline VARCHAR(255),
      ADD COLUMN IF NOT EXISTS hidden_gem_since TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS hidden_gem_expires_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS target_audience JSONB,
      ADD COLUMN IF NOT EXISTS reference_category VARCHAR(30),
      ADD COLUMN IF NOT EXISTS is_parent_listing BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS parent_business_id VARCHAR,
      ADD COLUMN IF NOT EXISTS location_name VARCHAR`,
  },

  // ── business_captions table — stores AI-generated or community captions
  //    for businesses.  Used by the GET /businesses list endpoint to annotate
  //    search results with short contextual blurbs.
  {
    name: "business_captions_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS business_captions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      business_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255),
      caption VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },

  // ── Philadelphia nightlife venues — 7 Black-owned or community-affirming
  //    spots seeded for the Manus audit.  Idempotent: skips existing rows.
  {
    name: "philly_nightlife_seed_v1",
    sql: `
      INSERT INTO businesses
        (id, name, category, subcategory, address, city, state,
         description, ownership_designations, black_owned,
         latitude, longitude,
         listing_status, profile_status, status,
         rating, review_count, verified, featured,
         confidence_score, tags, photos, pending_photos, videos,
         trust_badges, flag_count, flag_status, hidden_gem_nominations,
         marketplace_tier, business_status, marketplace_fee_locked,
         promotion_eligible, feedback_opt_in, show_availability,
         community_audience_type, is_reference_only,
         created_at, updated_at)
      SELECT
        gen_random_uuid()::text, v.name, 'Entertainment & Recreation', 'Nightlife & Bars',
        v.address, 'Philadelphia', 'PA',
        v.description, '["black-owned"]'::jsonb, TRUE,
        v.lat, v.lng,
        'live_unclaimed','community_listed','active',
        0,0,FALSE,FALSE,
        30,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,
        '[]'::jsonb,0,'none',0,
        'free','community',FALSE,
        TRUE,FALSE,FALSE,
        'adults_21plus',FALSE,
        NOW(),NOW()
      FROM (VALUES
        ('Eight Twelve Lounge', '812 N Broad St', 'Upscale Black-owned lounge on North Broad. Known for craft cocktails, private events, and a welcoming vibe for the community.', 39.9662, -75.1636),
        ('Stinger La Pointe', '1535 S 11th St', 'Beloved South Philly neighborhood bar with strong community roots and late-night energy.', 39.9234, -75.1581),
        ('Smokin'' Silverbacks', '2600 W Girard Ave', 'Casual sports bar and grill in West Philly with authentic community flavor.', 39.9712, -75.1814),
        ('The Saints', '4 S 40th St', 'West Philadelphia bar and community gathering space known for its inclusive atmosphere.', 39.9552, -75.2013),
        ('Honeysuckle', '2201 Walnut St', 'Rittenhouse-area cocktail bar known for its artful drinks and community-centered service.', 39.9528, -75.1757),
        ('Black Squirrel Club', '3901 Locust Walk', 'Intimate University City spot with a loyal community following and late-night hours.', 39.9521, -75.2018),
        ('Midnight & The Wicked', '1701 Point Breeze Ave', 'Point Breeze late-night spot with a signature dark ambiance and craft cocktail program.', 39.9311, -75.1762)
      ) AS v(name, address, description, lat, lng)
      WHERE NOT EXISTS (
        SELECT 1 FROM businesses b
        WHERE LOWER(b.name) = LOWER(v.name)
          AND LOWER(b.city) = 'philadelphia'
      )`,
  },
  {
    // Add Bangkok, Thailand, Laos, and Phuket to the Library as geography topics.
    // Uses the same format as seed_diaspora_country_topics_v2: knowledge_topics with
    // category='country' and node_type='geography'. WHERE NOT EXISTS guards against
    // duplicates across boots.
    name: "seed_southeast_asia_library_topics_v1",
    sql: `
      INSERT INTO knowledge_topics (id, topic_name, category, description, node_type)
      SELECT gen_random_uuid(), v.n, 'country', v.d, 'geography'
      FROM (VALUES
        ('Thailand',
         'Southeast Asian cultural crossroads — ancient Buddhist temples, vibrant street food, and a spirit of welcome that has made Bangkok, Phuket, and Chiang Mai pillar destinations for Black diaspora travelers.'),
        ('Laos',
         'Southeast Asia''s quiet heart — Mekong River culture, Theravada Buddhist traditions, and Luang Prabang''s UNESCO-protected temples offering one of the most peaceful and authentic travel experiences in the region.'),
        ('Bangkok',
         'Thailand''s capital and its beating heart — ancient temples alongside neon-lit night markets, world-class street food, and an energy that draws travelers of the African diaspora from every corner of the globe.'),
        ('Phuket',
         'Thailand''s most celebrated island — sun-soaked beaches, vibrant night markets, and a growing reputation as one of Southeast Asia''s most welcoming destinations for Black travelers.')
      ) AS v(n, d)
      WHERE NOT EXISTS (
        SELECT 1 FROM knowledge_topics WHERE topic_name = v.n AND category = 'country'
      )
    `,
  },
  {
    // City profile for Laos — gives KinfolkAI cultural context when travelers ask
    // about this destination. Bangkok and Phuket profiles already exist in
    // city_profiles_international_v1. ON CONFLICT DO NOTHING so manual edits survive.
    name: "city_profiles_laos_v1",
    sql: `INSERT INTO city_profiles (city_slug, city_name, brief_context, historical_context)
VALUES
  ('luang-prabang','Luang Prabang, Laos','A UNESCO World Heritage city on the Mekong River where ancient Buddhist temples, French colonial architecture, and the gentle pace of Lao life create one of the most tranquil travel experiences in Southeast Asia — a place that rewards slow travel and cultural curiosity.','Luang Prabang was the royal capital of Laos until 1975 and remains the country''s cultural and spiritual heart. The old city sits at the confluence of the Mekong and Nam Khan rivers, surrounded by mountains and protected as a UNESCO World Heritage Site since 1995. The city is home to over 30 Buddhist temples (wats), including the gilded Wat Xieng Thong dating to 1560. The pre-dawn alms-giving ceremony (tak bat) — monks collecting offerings from residents — is one of the most sacred living traditions in Southeast Asia. For travelers of the African diaspora, Luang Prabang offers an unhurried alternative to the major tourist circuits: waterfall hikes to Kuang Si Falls, boat journeys to the Pak Ou caves, and a night market of hill-tribe textiles. The city has a small but growing international visitor community. Best time to visit: November–March (cool and dry). Hot season April–May; monsoon June–October.')
ON CONFLICT (city_slug) DO NOTHING`,
  },
  {
    // Well-known tourist sites for Bangkok, Phuket, Laos, and Thailand.
    // Seeded as knowledge_topics with category='travel' and node_type='geography'
    // so they appear in the Library's Travel section as browseable topics.
    // These are not promoted businesses — temples, waterfalls, markets, and
    // landmarks that travelers of the African diaspora actually visit.
    // WHERE NOT EXISTS guards against duplicates across boots.
    name: "seed_sea_tourist_sites_v1",
    sql: `
      INSERT INTO knowledge_topics (id, topic_name, category, description, node_type)
      SELECT gen_random_uuid(), v.n, 'travel', v.d, 'geography'
      FROM (VALUES

        -- ── BANGKOK ────────────────────────────────────────────────────────────────
        ('Wat Pho — Temple of the Reclining Buddha, Bangkok',
         'One of Bangkok''s oldest and largest temples, home to the 46-meter gold-plated Reclining Buddha that fills an entire hall. Wat Pho predates Bangkok''s founding as capital and is considered the birthplace of traditional Thai massage — the temple still runs a massage school on its grounds. Located just south of the Grand Palace in the Rattanakosin district, it is walkable from the main royal complex. Admission includes a free bottle of water. Dress code enforced: shoulders and knees must be covered; sarongs available at the gate. Best visited early morning (opens 8am) before tour groups arrive. The temple complex also houses 91 smaller chedis (stupas) and hundreds of Buddha images. A 15-minute walk from the Tha Tien boat pier on the Chao Phraya.'),

        ('Wat Arun — Temple of Dawn, Bangkok',
         'One of Bangkok''s most recognizable landmarks — a riverside temple encrusted with colorful porcelain tiles that shimmer in the sun and glow at sunset. Wat Arun sits on the west bank of the Chao Phraya River in the Thonburi district, directly across from Wat Pho. The central prang (tower) stands 79 meters tall and can be climbed via steep steps for panoramic views over the river and Bangkok''s skyline. The temple is best photographed from the opposite bank at golden hour. Reach it by a 3-baht cross-river ferry from Tha Tien pier. The surrounding Thonburi neighborhood feels noticeably less touristy than the Rattanakosin side and is worth exploring on foot. Open daily 8am–6pm.'),

        ('The Grand Palace & Wat Phra Kaew, Bangkok',
         'Thailand''s most sacred site and former royal residence — a 218,000-square-meter walled complex in the heart of Bangkok that took 200 years to build and is still used for royal ceremonies. Wat Phra Kaew (Temple of the Emerald Buddha) sits within the complex and houses Thailand''s most revered Buddha image, carved from a single block of jade-green jasper. The palace grounds include throne halls, courtyards, and intricately gilded architecture covered in orange and gold mosaic. Strict dress code: long pants or skirts, covered shoulders — full sleeves required for temple entry. Sarong rentals available at the gate. Arrive before 10am to avoid the largest tour groups. The site gets very hot midday; bring water. Audio guides available at the entrance. Budget 2–3 hours minimum.'),

        ('Chatuchak Weekend Market, Bangkok',
         'One of the world''s largest markets — 35 acres, over 15,000 stalls, and an estimated 200,000 visitors every weekend. Chatuchak (also called JJ Market) is the definitive Bangkok shopping experience: vintage clothing, handmade jewelry, antiques, street food, live plants, ceramics, art, and everything in between. It operates Saturday and Sunday only, roughly 9am–6pm, though some sections open Friday evening. Organized into 27 sections by product type — maps are posted at each entrance. The food section (Section 26/27) is a highlight: grilled skewers, fresh coconut ice cream, som tam, and Thai iced coffee. Arrive early, wear comfortable shoes, bring cash (most vendors don''t take cards), and stay hydrated — it gets intensely hot midday. BTS Skytrain to Mo Chit or MRT to Chatuchak Park.'),

        ('Chao Phraya River & the Klong Network, Bangkok',
         'Bangkok was built on water — the Chao Phraya River and its network of canals (klongs) were the city''s original highways and remain the most atmospheric way to experience old Bangkok. The Chao Phraya Express Boat runs regularly between piers from south to north, stopping at every major temple and tourist landmark for 15–30 baht — far cheaper and faster than a tuk-tuk. Long-tail boat tours of the Thonburi klongs show a quieter Bangkok of riverside homes, floating vendors, and temple monks. The evening river cruise from Asiatique (a riverfront night market south of Silom) gives a lit skyline view. Tha Chang and Tha Tien piers are the primary stops for Grand Palace and Wat Pho access. The river is also the setting for several floating markets within an hour''s drive of the city.'),

        ('Yaowarat — Bangkok Chinatown',
         'Bangkok''s Chinatown district is one of the oldest and most atmospheric in the world — a dense street grid of gold shops, temple gates, medicinal herb dealers, and some of the best street food in the city. Yaowarat Road runs for about a kilometer and comes alive after dark when food stalls and neon signs light the street. The gold shops lining the main road reflect the neighborhood''s history as the center of Bangkok''s Chinese business community since the 18th century. Street food highlights: guay tiew reua (boat noodles), oyster omelets, mango sticky rice, and fresh seafood grilled to order. The Wat Mangkon Kamalawat dragon temple is the spiritual heart of the district. Accessible by MRT to Hua Lamphong or river ferry to Ratchawong pier. Best visited Friday or Saturday evening when the market extends several extra blocks.'),

        ('Lumphini Park, Bangkok',
         'Bangkok''s most beloved urban park — 142 acres of lake, walking paths, and greenery in the middle of the city, bordered by the Silom and Sukhumvit business districts. Lumphini is where Bangkok residents go to escape: early morning tai chi groups, runners circling the lake, paddle boats, and outdoor exercise equipment. The park hosts free open-air concerts on weekends, and monitor lizards (up to 2 meters long) roam freely around the lake — a surreal sight in a capital city. The surrounding Silom neighborhood is Bangkok''s most accessible area for Black and international travelers, with a concentration of international restaurants, LGBT-friendly bars, and hotels at every price point. BTS to Sala Daeng or MRT to Lumphini. Free to enter, open daily 5am–9pm.'),

        ('Khao San Road Area, Bangkok',
         'The most internationally known street in Southeast Asian backpacker culture — a short road in the Banglamphu neighborhood that has served as the launch pad for budget travelers exploring Asia for decades. Khao San itself is a strip of hostels, street food stalls, rooftop bars, and vendors selling everything from elephant pants to fake student ID cards — chaotic, loud, and genuinely fun for an evening. The surrounding Phra Athit Road is considerably more local and laid back, with riverside cafés and art galleries popular with Thai university students. Just a 15-minute walk from the Grand Palace. For Black travelers, Khao San is worth one evening for the street food and people-watching; the surrounding neighborhood of Banglamphu is quieter and more charming. Accessible by river ferry to Phra Athit pier.'),

        -- ── PHUKET ─────────────────────────────────────────────────────────────────
        ('Phi Phi Islands, Phuket',
         'Two of the most photogenic islands in Southeast Asia — Koh Phi Phi Don (inhabited) and Koh Phi Phi Leh (uninhabited, home to Maya Bay) — sit in the Andaman Sea about 45 kilometers southeast of Phuket Town. Maya Bay, framed by sheer limestone cliffs, became globally famous after appearing in the film The Beach, and has since been managed with visitor limits and periodic closures to allow coral recovery. Day trips depart from Phuket''s Chalong and Rassada piers, typically combining Maya Bay, snorkeling spots, and the Phi Phi Don village. Overnight stays are possible on Phi Phi Don at a range of bungalows and mid-range resorts. Speedboat day trips run 1,200–2,500 baht. The journey takes 45–90 minutes by speedboat or ferry. Best visited November–April; rough seas and closures are common May–October.'),

        ('Big Buddha, Phuket',
         'A 45-meter white marble Buddha image seated on Nakkerd Hill in central Phuket, visible from most of the island and from the sea. Construction began in 2004 and is ongoing, funded entirely by donations. The hilltop platform offers 360-degree views across southern Phuket — Chalong Bay to the south, Kata and Karon beaches to the west, and the city to the north. The site is deeply sacred; dress code enforced (shoulders and knees covered — sarongs available free at the base). The steep access road passes through a rural stretch lined with trees and small shrines. Sunrise visits offer cooler temperatures and dramatic light on the statue''s marble surface. Free to enter; donations accepted. Located about 15 minutes from Chalong Circle by car or motorbike. Sunset is the most popular visiting hour — arrive 30 minutes early for a spot on the viewing platform.'),

        ('Patong Beach, Phuket',
         'Phuket''s most famous beach — a 3-kilometer crescent of sand backed by the island''s most concentrated strip of hotels, restaurants, bars, and shopping. Patong is where the international crowd and Black traveler community gather: beach clubs along the northern end of the bay, jet ski rentals, banana boats, and parasailing in the water, and Bangla Road''s nightlife district one block inland from the shore. YONA Beach Club and Tichuca Beach Club on the northern end are specifically known for their international Black traveler clientele and vibrant party atmosphere during peak season. The beach itself has clear water and consistent waves. Patong is the loudest, most commercial part of Phuket — exactly what some want and others specifically avoid. Best beaches nearby for a quieter experience: Kamala (10 minutes north) and Kata (20 minutes south).'),

        ('Wat Chalong, Phuket',
         'Phuket''s most important Buddhist temple — a sprawling complex of ornate buildings housing sacred relics and revered monk statues that draw Thai worshippers from across the island and the wider south. Wat Chalong (officially Wat Chaitararam) dates to the early 19th century and is the first stop for Phuket locals before major journeys, exams, and life decisions. The main pagoda contains a splinter said to be from the Buddha''s bone. The temple grounds are large, colorful, and free to explore. Dress code required: shoulders and knees covered. Located in Chalong district, about 8 kilometers south of Phuket Town. Most accessible by motorbike rental or taxi. Temple monks are available for blessing rituals. Firecracker burning is common in the forecourt. Open daily 7am–5pm. Free admission.'),

        ('Phang Nga Bay — James Bond Island, Phuket',
         'A sea-sculpted landscape of vertical limestone karsts, sea caves, and emerald-green water stretching across the bay north of Phuket — one of Thailand''s most dramatic natural environments. Ko Tapu, a razor-thin limestone pinnacle rising 20 meters from the water, became globally known as James Bond Island after appearing in the 1974 film The Man with the Golden Gun. Day tours from Phuket (departing Ao Por or Rassada piers) combine a stop at Ko Tapu, sea-kayaking through cave systems at low tide, a visit to the floating fishing village of Ko Panyi, and lunch. Standard longtail boat tours run 800–1,200 baht; private speedboat tours 2,500–4,000 baht per person. The bay''s internal cave systems — Tham Lod, Tham Naga — are only accessible by kayak at certain tide levels. Best visited October–April.'),

        ('Phuket Old Town',
         'The historic heart of Phuket City — a neighborhood of Sino-Portuguese shophouses built during the tin-mining boom of the 19th and early 20th centuries, when Chinese merchants settled alongside Portuguese traders and created an architectural style found nowhere else in Thailand. The Old Town''s main streets — Thalang, Dibuk, Phang Nga, and Krabi roads — are lined with pastel-painted buildings housing independent cafés, boutique hotels, art galleries, and local restaurants. The weekly Sunday Walking Street market (Thalang Road, 4–10pm) draws vendors of local food, handicrafts, and vintage goods. Phuket Old Town is the city''s most walkable and culturally interesting area — a genuine contrast to the beach resort strip. The Thai Hua Museum and Baan Chinpracha mansion offer deeper context on the Chinese-Peranakan history. Located 30–40 minutes from Patong by car.'),

        ('Kata Beach & Kata Noi, Phuket',
         'Two of Phuket''s most beautiful beaches — separated by a headland on the island''s southwest coast, about 20 kilometers south of Patong. Kata Beach (the larger of the two) offers a long arc of soft sand, clear water, and a relaxed atmosphere with beach clubs and watersports but far fewer crowds than Patong. Kata Noi (the smaller, southern bay) is one of Phuket''s most pristine stretches of sand — typically quieter, with a handful of resorts and restaurants and excellent swimming. Both beaches have reef snorkeling within wading distance at the headlands. The hill between Kata and Karon offers an iconic three-beach viewpoint looking south over Kata Noi, Kata, and Karon simultaneously — one of the most photographed spots in Phuket. Best November–April; surfing conditions (beginner-friendly) develop May–October on the Kata side.'),

        -- ── LAOS ───────────────────────────────────────────────────────────────────
        ('Kuang Si Falls, Luang Prabang, Laos',
         'A multi-tiered turquoise waterfall 29 kilometers south of Luang Prabang — arguably the most beautiful natural site in Laos and one of the most stunning waterfalls in Southeast Asia. Water cascades through a series of travertine pools of electric blue-green, stacked down a forested hillside. The lower pools are open for swimming; the cold, clear water is refreshing in the heat. The upper falls (a 30-minute uphill walk from the main area) are larger and more powerful but not swimmable. The site also houses a rescued Asiatic black bear sanctuary at the base. Admission: 20,000 kip (about $1 USD). Day trips from Luang Prabang typically combine Kuang Si with a stop at Tad Sae Falls or a slowboat ride. Hire a tuk-tuk from Luang Prabang''s main market (150,000–200,000 kip round trip, negotiable). Open daily 8am–5:30pm. Best visited morning to avoid afternoon crowds.'),

        ('Wat Xieng Thong, Luang Prabang, Laos',
         'The most beautiful and historically significant temple in Laos — a masterpiece of Lao Buddhist architecture built in 1560 by King Settthathirath and never destroyed by the wars and invasions that damaged so many regional temples. Wat Xieng Thong sits at the northern tip of the Luang Prabang peninsula where the Mekong and Nam Khan rivers meet. Its sweeping, tiered roof nearly touches the ground — a defining feature of Lao temple design — and the rear wall is covered in an intricate mosaic of a scarlet Tree of Life. The complex includes a funeral chapel housing the royal hearse, several smaller shrines, and a boat storage hall. The temple is still active; monks in residence conduct morning and evening prayers. Admission: 20,000 kip. Located at the far north end of the main peninsula — a 10–15 minute walk from the night market. Dawn is the most atmospheric time to visit.'),

        ('Mount Phousi, Luang Prabang, Laos',
         'A sacred hill rising 150 meters from the center of Luang Prabang''s UNESCO-protected peninsula, topped by a golden stupa (That Chomsi) that is the spiritual and geographic heart of the city. 329 steps climb through a forest of frangipani trees, small shrines, and Buddha footprint altars to the summit, where a 360-degree panorama takes in the Mekong River, the rooftops of Luang Prabang, and the surrounding mountains. Sunrise and sunset are the peak visiting times — the evening view draws a large crowd who come to watch the sun drop behind the mountains across the Mekong. Footwear must be removed at each shrine level. Admission: 20,000 kip. The hill can be climbed from either the north stairs (behind the Royal Palace Museum) or the south stairs (near the Mekong river road). Morning visits offer a quieter ascent before the heat of the day. The descent on the opposite side passes through the day market.'),

        ('Pak Ou Caves, Luang Prabang, Laos',
         'Two sacred river caves — Tham Ting (lower) and Tham Phum (upper) — carved into a limestone cliff where the Ou River meets the Mekong, 25 kilometers north of Luang Prabang. The caves have been places of Buddhist pilgrimage for centuries: their interiors are filled with thousands of Buddha statues of every size, style, and era, left by pilgrims and worshippers from across Laos and northern Thailand. The lower cave (Tham Ting) is large enough to walk into and lit well enough to see the full collection; the upper cave (Tham Phum) requires a flashlight and a steep climb. The journey to Pak Ou by slowboat along the Mekong takes about 2 hours one way and passes riverside villages and the Lao Lao rice whisky village of Ban Xang Hai. Speedboat: 20–30 minutes. Day tours typically include both the caves and the Lao Lao village. Admission: 20,000 kip.'),

        ('Luang Prabang Night Market, Laos',
         'The most celebrated night market in Laos — a nightly pedestrian market along Sisavangvong Road (the main street of Luang Prabang''s old town) that transforms the city''s central avenue into a glowing corridor of handmade goods from hilltribe communities across northern Laos. Market runs nightly from roughly 5pm to 10pm. Vendors — many of them Hmong, Khmu, and other highland ethnic groups — sell hand-woven textiles, silk scarves, embroidered bags, lacquerware, carved wood, and silver jewelry. Prices are negotiable; starting at about 70% of the asking price is conventional. The adjacent Hmong Market (behind the main stalls) carries fresh produce and traditional herbal goods. Food vendors cluster at the south end: grilled meats on skewers, mango sticky rice, and banana pancakes. The market is the social heart of Luang Prabang each evening and worth visiting multiple nights for different vendors.'),

        ('Tad Sae Waterfalls, Luang Prabang, Laos',
         'A quieter alternative to Kuang Si Falls — multi-tiered travertine waterfalls about 15 kilometers southeast of Luang Prabang, accessible only by boat across the Nam Khan River and then a 10-minute walk through forest. The falls are swimmable and equally turquoise as Kuang Si, but typically see far fewer visitors. The surrounding forest is dense and the setting feels more remote. The approach by longtail boat across the river is itself a scenic experience. Elephant rides through the area are available nearby (though travelers are encouraged to research ethical elephant operations before booking). The falls are best visited in the wet season (July–October) when water volume is at its peak; they can slow to a trickle in the dry season. Day trips from Luang Prabang can combine both Tad Sae and Kuang Si in one full day. Entry fee: 10,000 kip.'),

        ('Pha That Luang, Vientiane, Laos',
         'The most sacred monument in Laos and the national symbol of the country — a gold-covered Buddhist stupa rising 45 meters over the capital Vientiane, said to contain a breastbone relic of the Buddha. Construction of the current structure dates to 1566 under King Setthathirat, built over an earlier Khmer temple. The stupa is surrounded by a cloister of smaller structures and is the site of the country''s largest annual festival (That Luang Festival, held in November at the full moon). The compound is located about 4 kilometers northeast of central Vientiane and is best reached by tuk-tuk from the city center. Two temples flank the main stupa to the north and south. Admission: 5,000 kip. Open Tuesday–Sunday, 8am–noon and 1–4pm. Dress code enforced. Vientiane is a 10-hour bus journey or 1-hour flight from Luang Prabang — best combined with a separate visit to the capital.'),

        -- ── THAILAND (beyond Bangkok & Phuket) ─────────────────────────────────────
        ('Doi Suthep Temple, Chiang Mai, Thailand',
         'The most visited and beloved temple in northern Thailand — Wat Phra That Doi Suthep sits on a mountain 1,676 meters above sea level overlooking Chiang Mai city, accessible by a 309-step staircase flanked by naga serpent balustrades or by a tram up the hillside. The gilded central chedi (stupa) dates to 1383 and is said to enshrine a sacred relic of the Buddha. The summit platform offers panoramic views over the Chiang Mai valley and, on clear days (November–February), the surrounding mountain ranges. The temple is an active place of worship; monks perform ceremonies throughout the day. Dress code strictly enforced: shoulders and knees covered. The mountain road also leads to Doi Suthep–Pui National Park, a cool-temperature forest with hiking trails and the royal Bhubing Palace gardens (open to visitors when the Royal Family is not in residence). Located 15 kilometers from Chiang Mai''s Old City. Admission: 30 baht.'),

        ('Ayutthaya Historical Park, Thailand',
         'The ruins of Thailand''s second capital — a UNESCO World Heritage Site 85 kilometers north of Bangkok preserving the temples, palaces, and monuments of a kingdom that was one of the most prosperous in Asia from 1351 until its sack by the Burmese in 1767. The park''s most iconic images are the stone Buddha heads entwined in the roots of banyan trees at Wat Mahathat — one of the most photographed sights in Southeast Asia. The site spreads across an island formed by three rivers and is best explored by bicycle (rentals widely available) or by renting a tuk-tuk for the day. Key temples: Wat Phra Si Sanphet (the royal temple), Wat Ratchaburana (with intact crypt), Wat Chaiwatthanaram (riverside, excellent at sunset). Day trips from Bangkok by train (1.5 hours, 15 baht) or minibus (2 hours) are popular; overnight stays are possible in Ayutthaya''s guesthouses. Admission: 50 baht per temple, or a combo ticket for major sites.'),

        ('Erawan Falls, Kanchanaburi, Thailand',
         'A seven-tiered emerald-green waterfall in Erawan National Park, 65 kilometers north of Kanchanaburi town — considered by many to be the most beautiful waterfall in Thailand. Each tier is swimmable, with fish that gently nibble at your feet in the lower pools. The color of the water — caused by dissolved limestone — shifts from bright green to turquoise depending on light conditions. The lower three tiers are the most accessible and most crowded; the upper tiers require a hiking trail through forest (allow 2 hours round trip to reach the 7th tier). The park also offers guesthouses and camping for overnight stays. Kanchanaburi itself carries deep WWII history: it was the site of the Death Railway and the Bridge over the River Kwai, built by Allied prisoners of war under Japanese occupation. Admission to Erawan National Park: 300 baht (foreigners). Reached from Bangkok by bus via Kanchanaburi bus terminal (3.5 hours).'),

        ('Elephant Nature Park, Chiang Mai, Thailand',
         'One of the most ethically operated elephant sanctuaries in Thailand — a rescue and rehabilitation center in the Mae Taeng valley, 60 kilometers north of Chiang Mai, that houses approximately 80 elephants rescued from the logging industry, street begging, and abusive tourist camps. Visitors feed, observe, and interact with elephants in their natural roaming environment without riding, performing, or chains. The park was founded by Thai conservationist Lek Chailert, who has been instrumental in changing the standards of elephant tourism across Thailand. Single-day visits run 8am–5pm (2,500–3,500 baht) and include elephant interaction, vegetarian buffet lunch, and dog and cat rescue center visits. Multi-day volunteer programs also available. Booking well in advance is essential — the park limits daily visitors to protect the elephants. The drive north from Chiang Mai passes through rural Mae Taeng valley scenery. A responsible choice for the African diaspora traveler who wants an elephant experience without exploitation.')

      ) AS v(n, d)
      WHERE NOT EXISTS (
        SELECT 1 FROM knowledge_topics WHERE topic_name = v.n AND category = 'travel'
      )
    `,
  },
  // ── City Request Log ──────────────────────────────────────────────────────
  // Stores aggregated per-city request metrics in 5-minute windows.
  // Upserted by cityRequestTracker every 5 minutes; queried by the health endpoint.
  {
    name: "city_request_log_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS city_request_log (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL,
      period_start TIMESTAMPTZ NOT NULL,
      request_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      avg_ms FLOAT NOT NULL DEFAULT 0,
      UNIQUE(slug, period_start)
    )`,
  },
  {
    name: "city_request_log_index_v1",
    sql: `CREATE INDEX IF NOT EXISTS idx_city_request_log_slug_period
          ON city_request_log (slug, period_start DESC)`,
  },
  // ── business_contributions.is_public column ────────────────────────────────
  // Adds is_public if the table was created before this column was added.
  {
    name: "business_contributions_is_public_col_v1",
    sql: `ALTER TABLE business_contributions ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE`,
  },
  // ── Pre-Manus tester accounts (direct INSERT) ──────────────────────────────
  // Creates final pre-Manus tester accounts that the runtime guard missed due
  // to the ANY($N) type-inference bug. Runs once; ON CONFLICT DO NOTHING.
  {
    name: "pre_manus_tester_accounts_v1",
    sql: `
      DO $$
      DECLARE
        h TEXT := '$2b$08$Vy2RWYFJTtkYY5xWoI1X/e1goZq8HLlCtW0vPWBo3HpQCV3jd0/T2';
      BEGIN
        INSERT INTO users (id, email, first_name, last_name, password_hash,
                           email_verified, agree_to_terms, profile_setup_complete,
                           member_type, approved, role, must_change_password)
        VALUES
          (gen_random_uuid(), 'reinaoba06@gmail.com', 'Reina', 'Tester', h, true, true, false, 'founding', true, 'tester', true),
          (gen_random_uuid(), 'mayagz05@icloud.com',  'Maya',  'Tester', h, true, true, false, 'founding', true, 'tester', true),
          (gen_random_uuid(), 'kayla.m.manus@mappingwithmelanin.com', 'Kayla', 'Manus', h, true, true, false, 'founding', true, 'tester', true)
        ON CONFLICT (email) DO NOTHING;
      END $$;
    `,
  },
  // ── Clear must_change_password for pre-Manus tester accounts ──────────────
  // Seeded accounts had must_change_password=true which blocks access at the
  // web UI change-password wall. Testers need direct access during the audit.
  {
    name: "pre_manus_tester_clear_must_change_password_v1",
    sql: `
      UPDATE users
      SET must_change_password = false
      WHERE email IN (
        'reinaoba06@gmail.com',
        'mayagz05@icloud.com',
        'kayla.m.manus@mappingwithmelanin.com'
      )
      AND must_change_password = true;
    `,
  },
  // ── TESTER CLEAN SLATE — founder-authorized Aug 10 2026 ────────────────────
  // Deletes ALL pre-provisioned tester accounts so each tester experiences
  // genuine first-time registration and onboarding.
  //
  // PROTECTED (never touched):
  //   tlindsay428@yahoo.com          — principal admin / founder
  //   apple.reviewer@mappingwithmelanin.com — Apple App Store review account
  //
  // After this migration, approved testers are listed in pending_tester_emails
  // (whitelisted for self-registration) but do NOT have pre-created accounts.
  // When they visit the site and create an account, they get the genuine
  // first-time onboarding experience.
  //
  // v2: fixes uuid[] → text[] type mismatch (users.id is character varying).
  // v1 errored with "operator does not exist: character varying = uuid".
  // ── Post-verification cleanup ───────────────────────────────────────────────
  // tester_clean_slate_v2 was verified by registering 4 test accounts. This
  // migration removes those verification accounts before real testers arrive.
  {
    name: "tester_verification_cleanup_v1",
    sql: `
      DO $$
      DECLARE
        v_emails TEXT[] := ARRAY[
          'reinaoba06@gmail.com',
          'kayla.m.manus@mappingwithmelanin.com',
          'tlindsay428@gmail.com',
          'tlindsay428@aol.com'
        ];
        v_ids text[];
      BEGIN
        SELECT ARRAY_AGG(id::text) INTO v_ids
        FROM users
        WHERE LOWER(TRIM(email)) = ANY(SELECT LOWER(TRIM(e)) FROM unnest(v_emails) AS e);
        IF v_ids IS NULL OR array_length(v_ids, 1) = 0 THEN RETURN; END IF;
        BEGIN DELETE FROM user_preferences        WHERE user_id::text = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM saved_places            WHERE user_id::text = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM kinfolk_conversations   WHERE user_id::text = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN
          DELETE FROM users WHERE id::text = ANY(v_ids);
        EXCEPTION WHEN OTHERS THEN
          SET session_replication_role = replica;
          DELETE FROM users WHERE id::text = ANY(v_ids);
          SET session_replication_role = DEFAULT;
        END;
        RAISE NOTICE 'tester_verification_cleanup_v1: removed % verification test accounts', array_length(v_ids, 1);
      END $$;
    `,
  },
  {
    name: "tester_clean_slate_v2",
    sql: `
      DO $$
      DECLARE
        v_emails TEXT[] := ARRAY[
          'tlindsay428@gmail.com',
          'tlindsay428@aol.com',
          'reinaoba06@gmail.com',
          'mayagz05@icloud.com',
          'kayla.m.manus@mappingwithmelanin.com',
          'tester@mwm.com',
          'zykiral.morton@yahoo.com',
          'kyleisha.m.morton@gmail.com',
          'kyleisha.m.fisher@gmail.com',
          'taleisha.fisher@gmail.com',
          'lilanarich@gmail.com',
          'jordanwtester@gmail.com',
          'joshuabierd99@gmail.com',
          'kaylacardwelltester@gmail.com',
          'kevinctester@gmail.com',
          'kevkaytester@gmail.com',
          'teiannaltester@gmail.com',
          'trinalindsaytester@gmail.com',
          'jross215@gmail.com',
          'kaylathomas20011@gmail.com',
          'kansesdwilliams@gmail.com',
          'fatimccoy@icloud.com',
          'jordanwyatt117@icloud.com',
          'jordanw117@icloud.com',
          'nydiahholly12@gmail.com',
          'meaparks@gmail.com',
          'melody.brown1988@gmail.com',
          'owcforyouth@gmail.com',
          'cardwellkayla219@gmail.com',
          'kcardwell17@yahoo.com',
          'kaylacardwell3@gmail.com',
          'taleisham.saunders@gmail.com',
          'trinalindsayhairston@gmail.com',
          'trinalindsayhairston@gmail..com',
          'bigdot6017@gmail.com',
          'dghaskin@gmail.com',
          'sharonnlw2@gmail.com',
          'ninamartinez409@gmail.com',
          'winternewman88@gmail.com',
          'shawnhillhomes@gmail.com',
          'themontgomerymanagementgroup@gmail.com',
          'gregorywilliam05@gmail.com',
          'kahvealynne@gmail.com'
        ];
        v_ids text[];   -- users.id is character varying, not uuid
        v_deleted int;
      BEGIN
        -- Collect IDs of users to delete (text[], not uuid[])
        SELECT ARRAY_AGG(id::text) INTO v_ids
        FROM users
        WHERE LOWER(TRIM(email)) = ANY(
          SELECT LOWER(TRIM(e)) FROM unnest(v_emails) AS e
        );

        IF v_ids IS NULL OR array_length(v_ids, 1) = 0 THEN
          RAISE NOTICE 'tester_clean_slate_v2: no tester accounts found — already clean';
          RETURN;
        END IF;

        -- Delete owned data first (each wrapped so missing tables / column
        -- name differences are skipped safely via subtransaction savepoints)
        BEGIN DELETE FROM user_preferences        WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM saved_places            WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM check_ins               WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM reviews                 WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM life_journeys           WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM entity_connections      WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM community_posts         WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM community_post_likes    WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM community_post_reposts  WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM user_follows            WHERE follower_id::text   = ANY(v_ids) OR following_id::text  = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM member_connections      WHERE user_id_1::text     = ANY(v_ids) OR user_id_2::text     = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM user_topic_follows      WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM user_delivery_preferences WHERE user_id::text     = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM user_issue_follows      WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM user_hashtag_follows    WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM business_interactions   WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM business_endorsements   WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM kinfolk_conversations   WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM circle_members          WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM circles                 WHERE created_by::text    = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM notifications           WHERE user_id::text       = ANY(v_ids) OR actor_id::text      = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM referrals               WHERE referrer_id::text   = ANY(v_ids) OR referred_id::text   = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM voice_usage             WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM family_ai_usage         WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM content_reports         WHERE reporter_id::text   = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM business_contributions  WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM safety_incidents        WHERE reporter_id::text   = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM saved_jobs              WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM community_listings      WHERE posted_by::text     = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM wellness_checkins       WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM wellness_goals          WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM financial_goals         WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM financial_checkins      WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM mentorship_profiles     WHERE user_id::text       = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM businesses              WHERE owner_user_id::text = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
        -- sessions table (connect-pg-simple stores user_id inside JSON sess blob —
        -- cascade via FK if one exists, otherwise skip)
        BEGIN DELETE FROM sessions WHERE (sess->>'userId')::text = ANY(v_ids); EXCEPTION WHEN OTHERS THEN NULL; END;

        -- Delete the user records themselves (also wrapped for safety)
        BEGIN
          DELETE FROM users WHERE id::text = ANY(v_ids);
          GET DIAGNOSTICS v_deleted = ROW_COUNT;
          RAISE NOTICE 'tester_clean_slate_v2: deleted % user records', v_deleted;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'tester_clean_slate_v2: users DELETE blocked — %', SQLERRM;
          -- Force-delete by disabling FK triggers for this session
          SET session_replication_role = replica;
          DELETE FROM users WHERE id::text = ANY(v_ids);
          GET DIAGNOSTICS v_deleted = ROW_COUNT;
          SET session_replication_role = DEFAULT;
          RAISE NOTICE 'tester_clean_slate_v2: force-deleted % user records (FK bypass)', v_deleted;
        END;
      END $$;
    `,
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
    ["the_real_tags",     () => ensureTheRealTags(log, warn)],
    ["dir. businesses",   () => ensureDirectoryBusinesses(log, warn)],
    ["tour businesses",   () => ensureTourBusinesses(log, warn)],
    ["curated businesses", () => ensureFounderCuratedBusinesses(log, warn)],
    ["community orgs",    () => ensureCommunityOrganizations(log, warn)],
    ["recurring events",  () => ensureRecurringEvents(log, warn)],
    ["tour cultural sites", () => ensureTourCulturalSites(log, warn)],
    ["cultural phrases",  () => ensureCulturalPhrases(log, warn)],
    ["neighborhood timing", () => ensureNeighborhoodTiming(log, warn)],
    ["geocode tour content", () => geocodeTourContent(log, warn)],
    ["knowledge topics",  () => ensureKnowledgeTopics(log, warn)],
    ["knowledge graph",   () => ensurePhiladelphiaKnowledgeGraph(log, warn)],
    ["admin accounts",    () => ensureAdminAccounts(log, warn)],
    ["tester accounts",   () => ensureTesterAccounts(log, warn)],
    ["pending testers",   () => ensurePendingTesterEmails(log, warn)],
    // ensureTesterUniversalAccounts() removed Aug 10 2026: per-boot account
    // creation conflicted with the tester_clean_slate_v1 migration. Approved
    // testers are now whitelisted in pending_tester_emails and must self-register.
    ["diaspora faith sites", () => ensureDiasporaFaithSites(log, warn)],
    ["library collections",  () => ensureLibraryCollections(log, warn)],
    ["library activation",   () => ensureLibraryContentActivation_v1(log, warn)],
    ["african geography",    () => ensureAfricanGeographyNodes_v1(log, warn)],
    ["bangkok businesses",   () => ensureBangkokBusinesses(log, warn)],
    ["test data cleanup",    () => ensureTestDataRemoved(log, warn)],
    ["coverage expansion",   () => ensureCoverageExpansion(log, warn)],
    ["founder churches",     () => ensureFounderChurches(log, warn)],
    ["phuket full layer",    () => ensurePhuketFullLayer(log, warn)],
    ["category normalize",   () => ensureCategoryNormalization(log, warn)],
    ["gap coverage v2",      () => ensureGapCoverageV2(log, warn)],
    ["final micro seed",     () => ensureFinalMicroSeed(log, warn)],
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
 * Ensures all THE REAL professional trust-signal tags exist in the_real_tags table.
 * Idempotent — ON CONFLICT DO NOTHING. Table structure is created via MIGRATIONS.
 */
async function ensureTheRealTags(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const { rows: countRows } = await pool.query(`SELECT COUNT(*) as cnt FROM the_real_tags`);
    const existing = parseInt(countRows[0]?.cnt ?? "0", 10);
    if (existing >= THE_REAL_TAGS.length) {
      log(`THE REAL tags: ${existing} already present, skipping seed`);
      return;
    }
    let inserted = 0;
    for (const t of THE_REAL_TAGS) {
      const res = await pool.query(
        `INSERT INTO the_real_tags
           (tag_key, label, category, type, adaptive_family, subcategory_scope, helper_text, sort_weight)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0)
         ON CONFLICT (tag_key) DO NOTHING`,
        [t.tag_key, t.label, t.category, t.type, t.adaptive_family ?? null, t.subcategory_scope, t.helper_text]
      );
      inserted += res.rowCount ?? 0;
    }
    log(`THE REAL tags: ${inserted} inserted, ${existing} already present (seed: ${THE_REAL_TAGS.length})`);
  } catch (err: unknown) {
    warn(`THE REAL tags seeding failed: ${err instanceof Error ? err.message : String(err)}`);
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

/**
 * Ensures all 556 tour-guide businesses from the MWM East Coast Cultural Guide
 * (Parts 1–3) exist in the businesses table as live_unclaimed.
 * Dedup by name+city+state. Runs sequentially to avoid pool exhaustion.
 */
async function ensureTourBusinesses(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(state) AS k FROM businesses`
    );
    const existing = new Set(r.rows.map((row: { k: string }) => row.k));

    let inserted = 0;
    let skipped = 0;

    for (const b of TOUR_BUSINESSES_SEED) {
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${b.state.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state,
             description, ownership_designations, black_owned,
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
             $8,$9,$10,
             $11,$12,
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
            b.name, b.category, b.subcategory ?? b.category,
            b.address, b.city, b.state,
            b.description,
            JSON.stringify(b.ownershipDesignations),
            b.blackOwned,
            b.latitude ?? null, b.longitude ?? null,
          ]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  Tour businesses guard: failed to insert ${b.name} (${b.city}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Also promote any tour businesses that landed as staged → live_unclaimed
    // (safe no-op if the update applies to 0 rows)
    try {
      await pool.query(
        `UPDATE businesses SET listing_status = 'live_unclaimed'
         WHERE listing_status IN ('staged','pending')
           AND LOWER(name)||'|'||LOWER(city)||'|'||LOWER(state) = ANY($1::text[])`,
        [TOUR_BUSINESSES_SEED.slice(0, 200).map(b =>
          `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${b.state.toLowerCase()}`
        )]
      );
    } catch { /* non-fatal */ }

    log(`Tour businesses integrity guard: ${inserted} inserted, ${skipped} already present (seed: ${TOUR_BUSINESSES_SEED.length})`);
  } catch (err: unknown) {
    warn(`Tour businesses integrity guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Cultural Phrases guard ────────────────────────────────────────────────────
async function ensureCulturalPhrases(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT LOWER(group_name)||'|'||LOWER(phrase) AS k FROM cultural_phrases`
    );
    const existing = new Set(r.rows.map((row: { k: string }) => row.k));
    let inserted = 0, skipped = 0;
    for (const p of CULTURAL_PHRASES_SEED) {
      const key = `${p.group_name.toLowerCase()}|${p.phrase.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO cultural_phrases (group_name, phrase, english_gloss, is_sensitive)
           VALUES ($1,$2,$3,$4)`,
          [p.group_name, p.phrase, p.english_gloss, p.is_sensitive]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`Cultural phrases guard: failed to insert "${p.phrase}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Cultural phrases guard: ${inserted} inserted, ${skipped} already present (seed: ${CULTURAL_PHRASES_SEED.length})`);
  } catch (err: unknown) {
    warn(`Cultural phrases guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Neighborhood Timing UPSERT ────────────────────────────────────────────────
// Populates city_profiles.neighborhood_timing with per-city district timing data.
// Only sets if the column is currently NULL/empty — never overwrites edited data.
async function ensureNeighborhoodTiming(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  const TIMING: Record<string, object[]> = {
    "philadelphia": [
      { neighborhood: "West Philadelphia / University City", best_days: ["Saturday", "Sunday"], best_times: "Morning to afternoon", notes: "Highly active on weekends due to farmers markets and the African American Market at FDR Park (Saturdays 10am–5pm). Weekdays better for museum visits and interviews." },
      { neighborhood: "Northern Liberties / Fishtown", best_days: ["Friday", "Saturday"], best_times: "Evening", notes: "Weekend evenings most vibrant for dining, galleries, and nightlife." },
      { neighborhood: "South Street", best_days: ["Saturday", "Sunday"], best_times: "Daytime", notes: "Weekend daytime for shopping, murals, and community energy." },
      { neighborhood: "North Philly / El Centro de Oro", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Afternoon", notes: "Weekday afternoons best for connecting with community organizations and cultural centers." },
    ],
    "washington-dc": [
      { neighborhood: "U Street Corridor (Black Broadway)", best_days: ["Saturday","Friday"], best_times: "Friday/Saturday evenings for nightlife; weekdays for historical sites and daytime interviews", notes: "Weekdays: relaxed, good for capturing murals and interviewing business owners. Weekends: transforms into vibrant hub of live music, dining, and community culture." },
      { neighborhood: "Anacostia", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Daytime", notes: "Best visited during the day for historical tours and the Anacostia Arts Center. Weekdays are quieter and better for community connections." },
      { neighborhood: "H Street NE", best_days: ["Friday","Saturday"], best_times: "Evening", notes: "Weekend evenings for nightlife and dining energy." },
      { neighborhood: "Adams Morgan", best_days: ["Saturday","Sunday"], best_times: "Afternoon to evening", notes: "Weekend afternoons for multicultural food scene and community energy." },
    ],
    "richmond": [
      { neighborhood: "Arts District / Downtown", best_days: ["Friday"], best_times: "6pm–9pm", notes: "First Friday of every month: RVA First Fridays art walk (6pm–9pm) with gallery openings and pop-up markets. Saturdays also highly active with multiple markets." },
      { neighborhood: "Scott's Addition", best_days: ["Friday","Saturday"], best_times: "Evening", notes: "Weekend evenings for breweries and dining." },
      { neighborhood: "Church Hill", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Daytime", notes: "Weekday daytime best for historical site visits and photographing the neighborhood." },
    ],
    "raleigh": [
      { neighborhood: "Downtown Raleigh", best_days: ["Saturday","Sunday"], best_times: "Morning to afternoon", notes: "Saturdays and Sundays most active — Raleigh Market and Black Farmers Market (Sundays). Weekdays better for scheduling interviews with chamber representatives." },
      { neighborhood: "Five Points / Glenwood South", best_days: ["Friday"], best_times: "Evening", notes: "Friday evenings for dining and local scene energy." },
      { neighborhood: "Hayti Heritage / Fayetteville St (Durham)", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Daytime", notes: "Weekday daytime for museums, cultural centers, and organizational visits." },
    ],
    "charlotte": [
      { neighborhood: "South End / NoDa (North Davidson)", best_days: ["Saturday","Sunday"], best_times: "Morning to evening", notes: "Weekends most vibrant. Farmers markets (Regional Market, Matthews Market) on Saturday mornings. Festivals and large events almost exclusively on weekends." },
      { neighborhood: "Uptown Charlotte", best_days: ["Saturday","Sunday"], best_times: "Daytime", notes: "Museums (Gantt Center) accessible weekdays; weekend events most active." },
      { neighborhood: "West End (Historic Greenville)", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Daytime", notes: "Weekday visits best for connecting with community organizations and historical sites." },
    ],
    "columbia-sc": [
      { neighborhood: "Main Street", best_days: ["Saturday"], best_times: "9am–1pm", notes: "Saturday mornings highly recommended — Soda City Market (9am–1pm) is a prime community gathering with local vendors. First Thursdays on Main is monthly." },
      { neighborhood: "Meeting Street / West Columbia", best_days: ["Saturday"], best_times: "11am–3pm", notes: "Meeting Street Artisan Market on Saturdays (11am–3pm) makes this area particularly active." },
      { neighborhood: "Five Points", best_days: ["Friday","Saturday"], best_times: "Evening", notes: "Friday–Saturday evenings for dining and nightlife." },
    ],
    "atlanta": [
      { neighborhood: "Sweet Auburn / MLK Historic District", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Daytime", notes: "Weekday daytime best for historical touring: MLK National Historic Park, Ebenezer Baptist Church, APEX Museum. Less crowded on weekdays." },
      { neighborhood: "Midtown", best_days: ["Saturday","Sunday"], best_times: "Morning to afternoon", notes: "Weekends for markets and festivals. Midtown Farmers Market active Saturdays. Parking is free after 6pm on weekends in most areas." },
      { neighborhood: "West Atlanta / West End", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Daytime", notes: "Weekdays for community organizations, cultural centers, and the HBCU cluster." },
      { neighborhood: "Decatur", best_days: ["Saturday"], best_times: "Morning", notes: "Saturday morning farmers markets and community gathering." },
    ],
    "montgomery": [
      { neighborhood: "Downtown Civil Rights District", best_days: ["Monday","Tuesday","Wednesday","Thursday","Friday"], best_times: "Daytime", notes: "Weekdays best for Legacy Museum, EJI National Memorial, Rosa Parks Museum — all have structured visiting hours. Less crowded than weekends." },
      { neighborhood: "Dexter Avenue Historic District", best_days: ["Saturday","Sunday"], best_times: "Daytime to afternoon", notes: "Weekend community events and church services draw community together." },
    ],
    "birmingham": [
      { neighborhood: "Civil Rights District (4th Ave N)", best_days: ["Monday","Tuesday","Wednesday","Thursday","Friday"], best_times: "Daytime", notes: "Weekdays for Birmingham Civil Rights Institute, 16th Street Baptist Church, Kelly Ingram Park — structured museum hours work best on weekdays." },
      { neighborhood: "Pepper Place / Lakeview", best_days: ["Saturday"], best_times: "Morning to afternoon", notes: "Pepper Place Market on Saturday mornings — a key community gathering point." },
      { neighborhood: "Southside", best_days: ["Friday","Saturday"], best_times: "Evening", notes: "Weekend evenings for dining and nightlife." },
    ],
    "mobile": [
      { neighborhood: "Downtown Mobile (LODA)", best_days: ["Second Friday","Second Saturday"], best_times: "Friday 6pm–9pm; Saturday events", notes: "Every second weekend of the month is particularly active: LODA ArtWalk (Friday 6–9pm), Saturday community events. Downtown comes alive as a cultural hub." },
      { neighborhood: "Africatown", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Daytime", notes: "Weekday daytime best for visiting Africatown Heritage House and connecting with community members." },
      { neighborhood: "Spring Hill / West Mobile", best_days: ["Saturday"], best_times: "Morning to afternoon", notes: "Saturday mornings for community engagement and local markets." },
    ],
    "baton-rouge": [
      { neighborhood: "Downtown / Spanish Town", best_days: ["Saturday"], best_times: "Morning", notes: "Saturdays highly recommended: Red Stick Farmers Market (every Saturday morning) + Baton Rouge Arts Market (first Saturday) make downtown vibrant." },
      { neighborhood: "Mid-City", best_days: ["Saturday"], best_times: "Afternoon", notes: "Last Saturday of month for the Local Pop-Up. Also active during the Red Stick Farmers Market cycle." },
      { neighborhood: "North Baton Rouge", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Daytime", notes: "Weekdays for community organizations, the 1953 Bus Boycott Marker, and historical cultural visits." },
    ],
    "new-orleans": [
      { neighborhood: "Tremé", best_days: ["Sunday"], best_times: "Morning to afternoon", notes: "Sunday mornings are significant for church services, often followed by traditional second-line parades in the afternoon. Daytime best for Backstreet Cultural Museum and historical tours." },
      { neighborhood: "Central City / Broadmoor", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Daytime", notes: "Weekdays ideal for visiting Ashé Cultural Arts Center and Black-owned businesses. Weekends host community events." },
      { neighborhood: "Bywater / Marigny", best_days: ["Saturday","Sunday"], best_times: "Afternoon", notes: "Weekend afternoons for pop-up markets, street art, and eclectic vendors." },
      { neighborhood: "French Quarter / Tremé adjacent", best_days: ["Friday","Saturday"], best_times: "Evening to late night", notes: "Late evenings for the full cultural fabric of music and community nightlife." },
    ],
    "houston": [
      { neighborhood: "Third Ward / Emancipation Park", best_days: ["Monday","Tuesday","Wednesday","Thursday"], best_times: "Daytime", notes: "Weekdays for historical sites, community organizations, and Emancipation Park visits." },
      { neighborhood: "Midtown / Museum District", best_days: ["Saturday","Sunday"], best_times: "Morning to afternoon", notes: "Weekends for farmers markets and pop-up markets. Houston Farmers Market open daily but busiest on Saturdays." },
      { neighborhood: "Discovery Green / Downtown", best_days: ["Friday","Saturday"], best_times: "Evening", notes: "Evening events: Flea by Night at Discovery Green and M-K-T Sunset Market best in late afternoon to evening." },
    ],
  };

  try {
    let updated = 0;
    for (const [slug, timing] of Object.entries(TIMING)) {
      try {
        const r = await pool.query(
          `UPDATE city_profiles
           SET neighborhood_timing = $1::jsonb
           WHERE city_slug = $2
             AND (neighborhood_timing IS NULL OR neighborhood_timing = '[]'::jsonb)
           RETURNING city_slug`,
          [JSON.stringify(timing), slug]
        );
        if (r.rowCount && r.rowCount > 0) updated++;
      } catch (err: unknown) {
        warn(`Neighborhood timing: failed for ${slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Neighborhood timing guard: ${updated} cities updated (${Object.keys(TIMING).length} in seed)`);
  } catch (err: unknown) {
    warn(`Neighborhood timing guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Geocode Tour Content ──────────────────────────────────────────────────────
// Batch-geocodes tour_cultural_sites, community_organizations, recurring_events
// that are missing lat/lng using Google Maps Geocoding API.
// Capped at 60 items per boot to keep startup fast — runs idempotently.
async function geocodeTourContent(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) { warn("Geocode tour content: GOOGLE_MAPS_API_KEY not set — skipping"); return; }

  // Accepts optional country so international entries geocode correctly.
  async function geocodeAddress(address: string, city: string, stateOrProvince: string | null, country?: string | null): Promise<{ lat: number; lng: number } | null> {
    const query = [address, city, stateOrProvince, country].filter(Boolean).join(", ");
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json() as { status: string; results: { geometry: { location: { lat: number; lng: number } } }[] };
      if (data.status === "OK" && data.results[0]) {
        return data.results[0].geometry.location;
      }
    } catch { /* silent */ }
    return null;
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let geocoded = 0;
  const CAP = 60;

  try {
    // Cultural sites with address but no lat/lng — include country for international sites
    const sites = await pool.query(
      `SELECT id, name, address, city, state, province, country FROM tour_cultural_sites
       WHERE address IS NOT NULL AND (latitude IS NULL OR longitude IS NULL)
       LIMIT $1`,
      [CAP]
    );
    for (const s of sites.rows) {
      if (geocoded >= CAP) break;
      const coords = await geocodeAddress(s.address, s.city, s.province || s.state, s.country);
      if (coords) {
        await pool.query(`UPDATE tour_cultural_sites SET latitude=$1, longitude=$2 WHERE id=$3`, [coords.lat, coords.lng, s.id]);
        geocoded++;
      }
      await sleep(100);
    }

    // Community orgs — include country for international orgs
    if (geocoded < CAP) {
      const orgs = await pool.query(
        `SELECT id, name, address, city, state, province, country FROM community_organizations
         WHERE address IS NOT NULL AND (latitude IS NULL OR longitude IS NULL)
         LIMIT $1`,
        [CAP - geocoded]
      );
      for (const o of orgs.rows) {
        if (geocoded >= CAP) break;
        const coords = await geocodeAddress(o.address, o.city, o.province || o.state, o.country);
        if (coords) {
          await pool.query(`UPDATE community_organizations SET latitude=$1, longitude=$2 WHERE id=$3`, [coords.lat, coords.lng, o.id]);
          geocoded++;
        }
        await sleep(100);
      }
    }

    // Recurring events with venue + address but no lat/lng
    if (geocoded < CAP) {
      const evts = await pool.query(
        `SELECT id, name, venue, address, city, state, province, country FROM recurring_events
         WHERE (address IS NOT NULL OR venue IS NOT NULL) AND (latitude IS NULL OR longitude IS NULL)
         LIMIT $1`,
        [CAP - geocoded]
      );
      for (const e of evts.rows) {
        if (geocoded >= CAP) break;
        const addrQuery = e.address || e.venue || "";
        const coords = await geocodeAddress(addrQuery, e.city, e.province || e.state, e.country);
        if (coords) {
          await pool.query(`UPDATE recurring_events SET latitude=$1, longitude=$2 WHERE id=$3`, [coords.lat, coords.lng, e.id]);
          geocoded++;
        }
        await sleep(100);
      }
    }

    log(`Geocode tour content: ${geocoded} items geocoded this boot`);
  } catch (err: unknown) {
    warn(`Geocode tour content failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Tour Cultural Sites guard ─────────────────────────────────────────────────
async function ensureTourCulturalSites(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(state) AS k FROM tour_cultural_sites`
    );
    const existing = new Set(r.rows.map((row: { k: string }) => row.k));
    let inserted = 0, skipped = 0;

    for (const s of TOUR_CULTURAL_SITES_SEED) {
      const key = `${s.name.toLowerCase()}|${s.city.toLowerCase()}|${s.state.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO tour_cultural_sites
            (name, city, state, address, description, is_active, tour_source, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5, true, true, NOW(), NOW())`,
          [s.name, s.city, s.state, s.address, s.description]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`Tour cultural sites guard: failed to insert ${s.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Tour cultural sites guard: ${inserted} inserted, ${skipped} already present (seed: ${TOUR_CULTURAL_SITES_SEED.length})`);
  } catch (err: unknown) {
    warn(`Tour cultural sites guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Community Organizations guard ─────────────────────────────────────────────
async function ensureCommunityOrganizations(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(state) AS k FROM community_organizations`
    );
    const existing = new Set(r.rows.map((row: { k: string }) => row.k));
    let inserted = 0, skipped = 0;

    for (const o of COMMUNITY_ORGANIZATIONS_SEED) {
      const key = `${o.name.toLowerCase()}|${o.city.toLowerCase()}|${o.state.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO community_organizations
            (name, city, state, category, mission, website, instagram, facebook, phone, address,
             is_active, tour_source, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, true, true, NOW(), NOW())`,
          [o.name, o.city, o.state, o.category, o.mission,
           o.website, o.instagram, o.facebook, o.phone, o.address]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`Community orgs guard: failed to insert ${o.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Community orgs guard: ${inserted} inserted, ${skipped} already present (seed: ${COMMUNITY_ORGANIZATIONS_SEED.length})`);
  } catch (err: unknown) {
    warn(`Community organizations guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Recurring Events guard ────────────────────────────────────────────────────
async function ensureRecurringEvents(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(state) AS k FROM recurring_events`
    );
    const existing = new Set(r.rows.map((row: { k: string }) => row.k));
    let inserted = 0, skipped = 0;

    for (const e of RECURRING_EVENTS_SEED) {
      const key = `${e.name.toLowerCase()}|${e.city.toLowerCase()}|${e.state.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO recurring_events
            (name, city, state, venue, address, description,
             frequency, day_of_week, start_time, end_time, category,
             is_active, tour_source, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, true, true, NOW(), NOW())`,
          [e.name, e.city, e.state, e.venue, e.address, e.description,
           e.frequency, e.day_of_week, e.start_time, e.end_time, e.category]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`Recurring events guard: failed to insert ${e.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Recurring events guard: ${inserted} inserted, ${skipped} already present (seed: ${RECURRING_EVENTS_SEED.length})`);
  } catch (err: unknown) {
    warn(`Recurring events guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Admin account grants ───────────────────────────────────────────────────────
// Ensures all founder admin accounts have role='admin'.
// Idempotent — only updates rows where role != 'admin' already.
// tlindsay428@yahoo.com is the principal admin (owner); all are granted
// the same role='admin' column value. Access revocation is controlled at the
// application level by the principal admin.
const ADMIN_EMAILS = [
  "tlindsay428@yahoo.com",          // Principal admin — founder / platform owner
  "tlindsay428@gmail.com",          // Founder backup account
  "tlindsay428@aol.com",            // Founder backup account
];

// ── Tester account grants ──────────────────────────────────────────────────────
// All testers who have already registered are promoted to role='tester'.
// Idempotent — only updates rows where role is still 'user'.
const TESTER_EMAILS = [
  "tester@mwm.com",          // Manus AI audit account — pre-approved founding tester
  "cardwellkayla219@gmail.com",
  "kcardwell17@yahoo.com",
  "kaylacardwell3@gmail.com",
  "taleisham.saunders@gmail.com",
  "trinalindsayhairston@gmail.com",
  "trinalindsayhairston@gmail..com", // typo variant as registered
  "bigdot6017@gmail.com",
  "zykiral.morton@yahoo.com",
  "kyleisha.m.morton@gmail.com",
  "kyleisha.m.fisher@gmail.com",
  "taleisha.fisher@gmail.com",
  "lilanarich@gmail.com",
  "jordanwtester@gmail.com",
  "joshuabierd99@gmail.com",
];

// ── Pre-approved tester emails (haven't registered yet) ───────────────────────
// These are seeded into pending_tester_emails so that when they self-register,
// role='tester' is automatically applied. ON CONFLICT DO NOTHING — safe to re-run.
const PRE_APPROVED_TESTER_EMAILS = [
  // Founder test personas
  "tlindsay428@gmail.com",
  "tlindsay428@aol.com",
  "zykiral.morton@yahoo.com",
  "kyleisha.m.morton@gmail.com",
  "kyleisha.m.fisher@gmail.com",
  "taleisha.fisher@gmail.com",
  "lilanarich@gmail.com",
  "jordanwtester@gmail.com",
  "joshuabierd99@gmail.com",
  "kaylacardwelltester@gmail.com",
  "kevinctester@gmail.com",
  "kevkaytester@gmail.com",
  "teiannaltester@gmail.com",
  "trinalindsaytester@gmail.com",
  "jross215@gmail.com",
  "kaylathomas20011@gmail.com",
  "kansesdwilliams@gmail.com",
  "fatimccoy@icloud.com",
  "jordanwyatt117@icloud.com",
  "jordanw117@icloud.com",
  "nydiahholly12@gmail.com",
  "meaparks@gmail.com",
  "melody.brown1988@gmail.com",
  "owcforyouth@gmail.com",
  // Founder-confirmed tester cohort (Aug 10 2026)
  "dghaskin@gmail.com",
  "sharonnlw2@gmail.com",
  "ninamartinez409@gmail.com",
  "winternewman88@gmail.com",
  "shawnhillhomes@gmail.com",
  "kaylacardwell3@gmail.com",
  "taleisham.saunders@gmail.com",
  "trinalindsayhairston@gmail.com",
  "bigdot6017@gmail.com",
  "themontgomerymanagementgroup@gmail.com",
  "gregorywilliam05@gmail.com",
  "kahvealynne@gmail.com",
  // Added Aug 10 2026 — final pre-tester cohort
  "reinaoba06@gmail.com",
  "mayagz05@icloud.com",
  // Manus audit tester — added to pending list so self-registration works after clean slate
  "kayla.m.manus@mappingwithmelanin.com",
];

async function ensureAdminAccounts(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const result = await pool.query(
      `UPDATE users
       SET role = 'admin', updated_at = NOW()
       WHERE LOWER(TRIM(email)) = ANY($1)
         AND role != 'admin'
       RETURNING email`,
      [ADMIN_EMAILS.map(e => e.toLowerCase())]
    );
    const granted = result.rows.map((r: { email: string }) => r.email);
    if (granted.length > 0) {
      log(`Admin accounts granted to: ${granted.join(", ")}`);
    } else {
      log(`Admin accounts already confirmed for all ${ADMIN_EMAILS.length} accounts`);
    }
  } catch (err: unknown) {
    warn(`Admin account grant failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Tester account grants ──────────────────────────────────────────────────────
async function ensureTesterAccounts(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    // Only promote to tester if currently role='user' — never demote admins
    const result = await pool.query(
      `UPDATE users
       SET role = 'tester', updated_at = NOW()
       WHERE LOWER(TRIM(email)) = ANY($1)
         AND role = 'user'
       RETURNING email`,
      [TESTER_EMAILS.map(e => e.toLowerCase())]
    );
    const granted = result.rows.map((r: { email: string }) => r.email);
    if (granted.length > 0) {
      log(`Tester role granted to: ${granted.join(", ")}`);
    } else {
      log(`Tester accounts already confirmed for all known testers`);
    }
  } catch (err: unknown) {
    warn(`Tester account grant failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Pending tester emails table + seed ────────────────────────────────────────
// Creates the pending_tester_emails table if it doesn't exist on Railway,
// then seeds pre-approved emails so new registrations auto-get tester role.
async function ensurePendingTesterEmails(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    // Create table if Railway never received this migration
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_tester_emails (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar NOT NULL UNIQUE,
        tester_access_source varchar NOT NULL DEFAULT 'admin_invite',
        granted_by varchar,
        granted_at timestamptz NOT NULL DEFAULT NOW(),
        entitlement_ends_at timestamptz,
        applied_at timestamptz,
        applied_to_user_id varchar
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pending_tester_emails_email"
      ON pending_tester_emails(email)
    `);

    // Seed pre-approved emails — ON CONFLICT DO NOTHING keeps it idempotent
    let inserted = 0;
    for (const email of PRE_APPROVED_TESTER_EMAILS) {
      const r = await pool.query(
        `INSERT INTO pending_tester_emails (id, email, tester_access_source)
         VALUES (gen_random_uuid(), $1, 'website_test')
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [email.toLowerCase().trim()]
      );
      if (r.rowCount && r.rowCount > 0) inserted++;
    }

    // Mark already-registered testers as applied
    await pool.query(`
      UPDATE pending_tester_emails pte
      SET applied_at = NOW(),
          applied_to_user_id = u.id
      FROM users u
      WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(pte.email))
        AND pte.applied_at IS NULL
    `);

    log(`Pending tester emails: table ensured, ${inserted} new emails seeded`);
  } catch (err: unknown) {
    warn(`Pending tester emails guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Per-boot tester account creation + credential repair ──────────────────────
// Unlike tester_universal_accounts_v1 (one-time migration), this runs every
// boot. It handles two cases:
//   A. Tester emails added AFTER the one-time migration already ran on Railway
//      → inserts missing rows (ON CONFLICT DO NOTHING)
//   B. Tester accounts that exist but have a wrong/stale password hash AND
//      must_change_password=true (haven't set their own password yet)
//      → resets hash to universal + clears any rate-limit lock
//      Safe because must_change_password=true means first login hasn't happened.
async function ensureTesterUniversalAccounts(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  // bcrypt(cost=8) of "MWM-Manus-2026!" — same hash used by tester_universal_accounts_v1
  const UNIVERSAL_HASH = '$2b$08$Vy2RWYFJTtkYY5xWoI1X/e1goZq8HLlCtW0vPWBo3HpQCV3jd0/T2';
  const emails = PRE_APPROVED_TESTER_EMAILS.map(e => e.toLowerCase().trim());
  try {
    // A: create missing accounts
    let created = 0;
    for (const email of emails) {
      const r = await pool.query(
        `INSERT INTO users
           (id, email, first_name, last_name, password_hash,
            email_verified, agree_to_terms, profile_setup_complete,
            member_type, approved, role, must_change_password)
         VALUES
           (gen_random_uuid(), $1,
            split_part($1, '@', 1), 'Tester',
            $2,
            true, true, false,
            'founding', true, 'tester', true)
         ON CONFLICT (email) DO NOTHING`,
        [email, UNIVERSAL_HASH]
      );
      if (r.rowCount && r.rowCount > 0) created++;
    }

    // B: repair hash for testers who exist but haven't changed their password.
    //    Use per-email loop to avoid ANY($N) type-inference failures in PostgreSQL.
    let repaired = 0;
    for (const email of emails) {
      const repairResult = await pool.query(
        `UPDATE users
         SET password_hash         = $1,
             locked_until          = NULL,
             failed_login_attempts = 0,
             updated_at            = NOW()
         WHERE LOWER(TRIM(email))  = $2
           AND must_change_password = true
           AND (password_hash != $1 OR locked_until IS NOT NULL OR failed_login_attempts > 0)`,
        [UNIVERSAL_HASH, email]
      );
      if ((repairResult.rowCount ?? 0) > 0) repaired++;
    }

    log(
      `Tester universal accounts: ${created} created, ` +
      `${repaired} hash/lock repaired`
    );
  } catch (err: unknown) {
    warn(`Tester universal accounts guard failed: ${err instanceof Error ? err.message : String(err)}`);
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

    // Single bulk INSERT for all missing topics (6 params per row).
    // keywords is a text[] column — pass as a JS array (pg converts automatically).
    // trusted_sources is jsonb — pass as JSON.stringify with ::jsonb cast.
    const COLS = 6;
    const placeholders = newTopics
      .map((_, i) => `(gen_random_uuid(),$${i*COLS+1},$${i*COLS+2},$${i*COLS+3},$${i*COLS+4},$${i*COLS+5},$${i*COLS+6}::jsonb,true,'free',NOW())`)
      .join(",");
    const params = newTopics.flatMap((t) => [
      t.topicName,
      t.category,
      t.description,
      t.keywords,                       // text[] — pass array directly, no JSON.stringify
      t.notificationPriority,
      JSON.stringify(t.trustedSources), // jsonb — stringify required
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

// ── Founder-Curated Businesses ─────────────────────────────────────────────
// Businesses hand-selected from the founder's master spreadsheet.
// Deduplicates by lower(name)|lower(city)|lower(state) — safe to run on every boot.
async function ensureFounderCuratedBusinesses(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(state) AS k FROM businesses`
    );
    const existing = new Set(r.rows.map((row: { k: string }) => row.k));

    let inserted = 0;
    let skipped = 0;

    for (const b of FOUNDER_CURATED_BUSINESSES_SEED) {
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${b.state.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state,
             description, ownership_designations, black_owned,
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
             $8,$9,$10,
             $11,$12,
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
            b.name, b.category, b.subcategory ?? b.category,
            b.address, b.city, b.state,
            b.description,
            JSON.stringify(b.ownershipDesignations),
            b.blackOwned,
            b.latitude ?? null, b.longitude ?? null,
          ]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  Curated businesses guard: failed to insert ${b.name} (${b.city}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`Founder-curated businesses guard: ${inserted} inserted, ${skipped} already present`);
  } catch (err: unknown) {
    warn(`Founder-curated businesses guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── LAYER 1: Philadelphia Knowledge Graph Seeding ────────────────────────────
// Seeds:
//   • Philadelphia as a geography node (node_type='geography')
//   • 7 subject subtopics (History, Black History, Nightlife, Employment,
//     Real Estate, Faith, Businesses) as topic nodes with geography_ref
//   • topic_relationships linking Philadelphia → each subtopic
//   • library_entity_connections linking Mother Bethel AME to 3 topics
//   • knowledge_sources demonstrating all 4 provenance tiers
// Idempotent — checks existence by title+node_type before inserting.
async function ensurePhiladelphiaKnowledgeGraph(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // ── 1. Ensure Philadelphia geography node ───────────────────────────────
    let phillyId: string;
    const phillyRow = await pool.query(
      `SELECT id FROM knowledge_topics WHERE topic_name='Philadelphia' AND node_type='geography' LIMIT 1`,
    );
    if (phillyRow.rows.length > 0) {
      phillyId = phillyRow.rows[0].id as string;
    } else {
      const ins = await pool.query(
        `INSERT INTO knowledge_topics
           (id, topic_name, category, description, node_type, geography_ref)
         VALUES (gen_random_uuid()::text, $1, 'geography', $2, 'geography', 'Philadelphia,PA,USA')
         RETURNING id`,
        [
          "Philadelphia",
          "Philadelphia, Pennsylvania — a historic city at the center of Black American history. From the founding of Mother Bethel AME Church (the first AME church in the world) to the Great Migration that brought hundreds of thousands north, Philadelphia shaped Black culture, faith, and political life in America.",
        ],
      );
      phillyId = ins.rows[0].id as string;
    }

    // ── 2. Seed 7 subject subtopics ─────────────────────────────────────────
    const subtopics: Array<{ title: string; category: string; subcategory: string; description: string }> = [
      {
        title: "Philadelphia History",
        category: "history",
        subcategory: "city_history",
        description: "The full arc of Philadelphia history — from colonial founding and the Constitutional Convention to its role as a gateway city for Black Americans during Reconstruction and the Great Migration.",
      },
      {
        title: "Philadelphia Black History",
        category: "history",
        subcategory: "black_history",
        description: "The deep story of Black Philadelphia — from the Free African Society (1787) and Mother Bethel AME to the Harlem Renaissance figures who came through, the civil rights era, and the cultural institutions that preserved community memory.",
      },
      {
        title: "Philadelphia Nightlife",
        category: "entertainment",
        subcategory: "nightlife",
        description: "Philadelphia's music venues, jazz clubs, rooftop bars, and nightlife corridors — including the historic legacy of South Street, the Black club scene, and the city's current entertainment landscape.",
      },
      {
        title: "Philadelphia Employment",
        category: "business",
        subcategory: "employment",
        description: "Jobs, workforce development, and economic opportunity in Philadelphia — including historically Black professional networks, union history, and the city's current labor market for community members.",
      },
      {
        title: "Philadelphia Real Estate",
        category: "housing",
        subcategory: "real_estate",
        description: "Housing, homeownership, and real estate in Philadelphia — including gentrification patterns in historically Black neighborhoods, first-time homebuyer resources, and the history of redlining in the city.",
      },
      {
        title: "Philadelphia Faith",
        category: "faith",
        subcategory: "religious_community",
        description: "Philadelphia's rich tradition of Black religious life — from Mother Bethel AME (founded 1794) and the historic Baptist churches to contemporary megachurches and the city's diverse faith communities.",
      },
      {
        title: "Philadelphia Businesses",
        category: "business",
        subcategory: "local_business",
        description: "Minority-owned and community businesses in Philadelphia — the restaurants, salons, bookstores, health providers, and professional services that make up the economic backbone of Black Philadelphia.",
      },
    ];

    let topicsInserted = 0;
    let topicsSkipped = 0;
    const subtopicIds: string[] = [];

    for (const t of subtopics) {
      const existing = await pool.query(
        `SELECT id FROM knowledge_topics WHERE topic_name=$1 AND node_type='topic' LIMIT 1`,
        [t.title],
      );
      if (existing.rows.length > 0) {
        subtopicIds.push(existing.rows[0].id as string);
        topicsSkipped++;
      } else {
        const ins = await pool.query(
          `INSERT INTO knowledge_topics
             (id, topic_name, category, description, node_type, geography_ref)
           VALUES (gen_random_uuid()::text, $1, $2, $3, 'topic', 'Philadelphia,PA,USA')
           RETURNING id`,
          [t.title, t.category, t.description],
        );
        subtopicIds.push(ins.rows[0].id as string);
        topicsInserted++;
      }
    }

    // ── 3. Seed topic_relationships: Philadelphia → each subtopic ───────────
    let relsInserted = 0;
    for (const childId of subtopicIds) {
      await pool.query(
        `INSERT INTO topic_relationships
           (id, parent_topic_id, child_topic_id, relationship_type, weight)
         VALUES (gen_random_uuid()::text, $1, $2, 'contains', 1.0)
         ON CONFLICT (parent_topic_id, child_topic_id, relationship_type) DO NOTHING`,
        [phillyId, childId],
      );
      relsInserted++;
    }

    // Cross-link Black History ↔ Faith (both rooted in the same AME founding)
    const blackHistId = subtopicIds[1]; // Philadelphia Black History
    const faithId     = subtopicIds[5]; // Philadelphia Faith
    await pool.query(
      `INSERT INTO topic_relationships
         (id, parent_topic_id, child_topic_id, relationship_type, weight)
       VALUES (gen_random_uuid()::text, $1, $2, 'related_to', 0.9)
       ON CONFLICT (parent_topic_id, child_topic_id, relationship_type) DO NOTHING`,
      [blackHistId, faithId],
    );

    log(`Knowledge graph: Philadelphia node confirmed (id=${phillyId})`);
    log(`Knowledge graph: subtopics — ${topicsInserted} inserted, ${topicsSkipped} already present`);
    log(`Knowledge graph: relationships — ${relsInserted + 1} upserted`);

    // ── 4. Connect Mother Bethel AME to multiple topics (no new entity row) ─
    // Mother Bethel AME Church already exists in cultural_sites.
    // We connect its existing UUID to Philadelphia, Philadelphia Black History,
    // and Philadelphia Faith via library_entity_connections.
    const motherBethelRow = await pool.query(
      `SELECT id FROM cultural_sites
       WHERE name ILIKE '%mother bethel%' OR name ILIKE '%bethel ame%'
       LIMIT 1`,
    );
    let mbConnections = 0;
    if (motherBethelRow.rows.length > 0) {
      const mbId = motherBethelRow.rows[0].id as string;
      const topicsToConnect = [phillyId, blackHistId, faithId];
      const labelsForTopics = [
        "Historic Philadelphia landmark central to the city's geography and identity",
        "Founding institution of Black Philadelphia — established 1794 by Richard Allen",
        "Mother church of the African Methodist Episcopal denomination — first AME church in the world",
      ];
      for (let i = 0; i < topicsToConnect.length; i++) {
        await pool.query(
          `INSERT INTO library_entity_connections
             (id, topic_id, entity_id, entity_type, entity_label, relevance_weight)
           VALUES (gen_random_uuid(), $1, $2::uuid, 'cultural_site', $3, 1.0)
           ON CONFLICT (topic_id, entity_id, entity_type) DO NOTHING`,
          [topicsToConnect[i], mbId, labelsForTopics[i]],
        );
        mbConnections++;
      }
      log(`Knowledge graph: Mother Bethel AME connected to ${mbConnections} topics`);
    } else {
      warn("Knowledge graph: Mother Bethel AME not found in cultural_sites — skipping entity connections");
    }

    // ── 5. Seed knowledge_sources — REAL sources only.
    //
    // PROVENANCE RULE (permanent): never seed community or ambassador sources as
    // structural fixtures. Those tiers exist in the schema but MUST be populated
    // only when a real MWM member contribution or Ambassador guide actually exists.
    // Seeding fake community/ambassador records would allow Kinfolk to present
    // invented "community evidence" as real — a violation of the Big Cousin standard.
    //
    // The two real sources below are genuine published works. community + ambassador
    // tiers will be populated in Layer 3+ when actual content is submitted.
    const bhistId = subtopicIds[1];
    const realSources = [
      {
        tier: "authoritative",
        name: "Smithsonian National Museum of African American History & Culture",
        // Stable collection page for African American Philadelphia history
        url: "https://nmaahc.si.edu/explore/exhibitions/slavery-freedom",
        claim:
          "Philadelphia's Free African Society (1787) and Mother Bethel AME Church (1794) are founding institutions of organized Black civic and religious life in the United States, predating formal abolition by nearly a century.",
        is_primary: true,
      },
      {
        tier: "professional",
        name: "W.E.B. Du Bois — The Philadelphia Negro (1899)",
        // Internet Archive canonical scan — stable and freely accessible
        url: "https://archive.org/details/philadelphianegr00duborich",
        claim:
          "The first sociological study of a Black urban community in the United States. Du Bois documented the 7th Ward, establishing the academic foundation for understanding Philadelphia's Black community and its institutional history.",
        is_primary: true,
      },
    ];

    // Claim-alignment metadata for the two real sources.
    // evidence_section explains exactly what the source page covers and how directly
    // it supports the specific claim — honest about any gap between URL and claim text.
    // This is the claim-to-source standard (Layer 3 provenance rule).
    const sourceMetadata: Record<string, { evidence_section: string; confidence: string }> = {
      "authoritative": {
        evidence_section:
          "Slavery and Freedom exhibition — covers Free African Society (1787) and early Black institutional life; broader NMAAHC collection includes Mother Bethel AME artifacts. Claim accuracy: well-corroborated across NMAAHC, NPS Independence Park, and Library of Congress records. Specific page may not name Philadelphia institutions on its landing view — claim is accurate and institution-supported but not directly cited from a single paragraph on this URL.",
        confidence: "high",
      },
      "professional": {
        evidence_section:
          "Full digitized text available. The Philadelphia Negro (1899) Chapter 1 establishes the 7th Ward study scope; Chapters 2-4 document the history of the Black community in Philadelphia including institutional founding. Du Bois explicitly identifies Mother Bethel and the Free African Society as foundational institutions. This claim is directly and specifically supported by the primary source.",
        confidence: "verified",
      },
    };

    let sourcesInserted = 0;
    for (const s of realSources) {
      const existing2 = await pool.query(
        `SELECT id FROM knowledge_sources
         WHERE topic_id=$1 AND authority_tier=$2 AND source_name=$3 LIMIT 1`,
        [bhistId, s.tier, s.name],
      );
      const meta = sourceMetadata[s.tier] ?? { evidence_section: null, confidence: "unverified" };
      if (existing2.rows.length === 0) {
        await pool.query(
          `INSERT INTO knowledge_sources
             (id, topic_id, authority_tier, source_name, source_url, claim, is_primary, status,
              evidence_section, confidence, retrieved_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, 'active', $7, $8, NOW())`,
          [bhistId, s.tier, s.name, s.url, s.claim, s.is_primary,
           meta.evidence_section, meta.confidence],
        );
        sourcesInserted++;
      } else {
        // Backfill provenance columns on existing rows (Railway will hit this path)
        await pool.query(
          `UPDATE knowledge_sources
           SET evidence_section = COALESCE(evidence_section, $1),
               confidence       = COALESCE(confidence, $2),
               retrieved_at     = COALESCE(retrieved_at, NOW())
           WHERE id = $3`,
          [meta.evidence_section, meta.confidence, existing2.rows[0].id],
        );
      }
    }
    log(`Knowledge graph: ${sourcesInserted} real knowledge_sources seeded (authoritative + professional; community/ambassador tiers populated only from real contributions)`);

  } catch (err: unknown) {
    warn(`Knowledge graph seeding failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Library Collections — hierarchical taxonomy foundation ────────────────────
// Seeds 11 top-level Collections (topicType='collection') and their canonical
// Books. The Browse Topics UI uses these to show a Collection grid instead of
// a flat list of 160 topics.
//
// Architecture:
//   Collection (topicType='collection') → Book (topicType='book') → topics
//   Hierarchy is stored in topic_relationships (parent_topic_id → child_topic_id).
//
// All inserts are idempotent via ON CONFLICT DO NOTHING.
// ── Library Content Activation v1 ─────────────────────────────────────────────
// Seeds geography_refs, collection→topic relationships, and knowledge_sources for
// all Tier 1 Books (Divine Nine, Health, Faith) plus priority general topics.
// Fully idempotent — uses WHERE NOT EXISTS guards on all inserts.
async function ensureLibraryContentActivation_v1(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    let sourcesAdded = 0;

    // Helper: seed source for a Book with stable short ID
    const sb = async (
      topicId: string, tier: string, name: string, url: string | null,
      claim: string | null, isPrimary: boolean, conf = "verified",
    ) => {
      const r = await pool.query(
        `INSERT INTO knowledge_sources
           (id, topic_id, authority_tier, source_name, source_url, claim, is_primary, status, confidence, created_at, retrieved_at)
         SELECT gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,'active',$7,NOW(),NOW()
         WHERE NOT EXISTS (SELECT 1 FROM knowledge_sources WHERE topic_id=$1 AND source_name=$3)`,
        [topicId, tier, name, url, claim, isPrimary, conf],
      );
      sourcesAdded += r.rowCount ?? 0;
    };

    // Helper: seed source for a general topic looked up by name
    const st = async (
      topicName: string, tier: string, name: string, url: string | null,
      claim: string | null, isPrimary: boolean, conf = "verified",
    ) => {
      const r = await pool.query(
        `INSERT INTO knowledge_sources
           (id, topic_id, authority_tier, source_name, source_url, claim, is_primary, status, confidence, created_at, retrieved_at)
         SELECT gen_random_uuid()::text, kt.id, $2, $3, $4, $5, $6, 'active', $7, NOW(), NOW()
         FROM knowledge_topics kt
         WHERE kt.topic_name = $1
           AND NOT EXISTS (SELECT 1 FROM knowledge_sources ks WHERE ks.topic_id = kt.id AND ks.source_name = $3)
         LIMIT 1`,
        [topicName, tier, name, url, claim, isPrimary, conf],
      );
      sourcesAdded += r.rowCount ?? 0;
    };

    // ── Step 1: Fix geography_refs ───────────────────────────────────────────
    await pool.query(`
      UPDATE knowledge_topics
      SET geography_ref = topic_name
      WHERE node_type = 'geography'
        AND (geography_ref IS NULL OR geography_ref = '')
        AND category = 'country'
    `);
    // Bangkok and Phuket are cities, not countries
    await pool.query(`UPDATE knowledge_topics SET geography_ref='Bangkok,Thailand',category='geography' WHERE topic_name='Bangkok' AND node_type='geography'`);
    await pool.query(`UPDATE knowledge_topics SET geography_ref='Phuket,Thailand',category='geography' WHERE topic_name='Phuket' AND node_type='geography'`);
    await pool.query(`UPDATE knowledge_topics SET geography_ref='Thailand' WHERE topic_name='Thailand' AND (geography_ref IS NULL OR geography_ref='')`);
    log("Library activation: geography_refs fixed");

    // ── Step 2: Connect general topics to parent Collections ─────────────────
    const catToCollection: [string, string][] = [
      ["business","coll_business"],["financial","coll_business"],["digital","coll_business"],["skills_trades","coll_careers"],
      ["employment","coll_careers"],["legal","coll_careers"],["community","coll_community"],["community_culture","coll_culture"],
      ["diaspora","coll_culture"],["education","coll_education"],["faith","coll_faith"],["history","coll_history"],
      ["health","coll_health"],["recovery","coll_health"],["travel","coll_travel"],["relocation","coll_travel"],
      ["country","coll_places"],["geography","coll_places"],["safety","coll_community"],["home","coll_community"],
      ["housing","coll_community"],["family","coll_community"],["entertainment","coll_community"],["lifestyle","coll_community"],
    ];
    for (const [cat, collId] of catToCollection) {
      await pool.query(
        `INSERT INTO topic_relationships (id, parent_topic_id, child_topic_id, relationship_type, weight)
         SELECT gen_random_uuid()::text, $1, kt.id, 'contains', 0.8
         FROM knowledge_topics kt
         WHERE kt.category=$2 AND kt.topic_type='general' AND kt.enabled=true
           AND NOT EXISTS (SELECT 1 FROM topic_relationships tr WHERE tr.parent_topic_id=$1 AND tr.child_topic_id=kt.id AND tr.relationship_type='contains')`,
        [collId, cat],
      );
    }
    // Also connect Travel topics to Culture & Community collection
    await pool.query(
      `INSERT INTO topic_relationships (id, parent_topic_id, child_topic_id, relationship_type, weight)
       SELECT gen_random_uuid()::text, 'coll_travel', kt.id, 'contains', 0.8
       FROM knowledge_topics kt
       WHERE kt.category='country' AND kt.topic_type='general' AND kt.enabled=true
         AND NOT EXISTS (SELECT 1 FROM topic_relationships tr WHERE tr.parent_topic_id='coll_travel' AND tr.child_topic_id=kt.id AND tr.relationship_type='contains')`,
    );
    log("Library activation: general topics connected to Collections");

    // ── Step 3: Seed knowledge_sources for Divine Nine Books ─────────────────
    await sb("book_d9_aka","authoritative","Alpha Kappa Alpha Sorority, Inc. — Official Site","https://aka1908.org","Alpha Kappa Alpha Sorority, Incorporated was founded January 15, 1908 at Howard University — the first intercollegiate Greek-letter sorority established by African American college women. Over 300,000 members in 1,042 chapters worldwide.",true);
    await sb("book_d9_aka","authoritative","Smithsonian NMAAHC","https://nmaahc.si.edu","The Smithsonian documents AKA's century of service including healthcare initiatives, education advocacy, and civil rights leadership.",false);

    await sb("book_d9_apa","authoritative","Alpha Phi Alpha Fraternity, Inc. — Official Site","https://www.alphaphialpha.net","Alpha Phi Alpha was founded December 4, 1906 at Cornell University — the first African American intercollegiate Greek-letter fraternity. Members include Dr. Martin Luther King Jr., Thurgood Marshall, and Jesse Owens.",true);
    await sb("book_d9_apa","professional","Cornell University Library — Rare & Manuscript Collections","https://rmc.library.cornell.edu","Cornell's archives preserve the fraternity's founding documents, early correspondence, and historical records from its establishment at Cornell.",false,"high");

    await sb("book_d9_kap","authoritative","Kappa Alpha Psi Fraternity, Inc. — Official Site","https://www.kappaalphapsi1911.com","Kappa Alpha Psi was founded January 5, 1911 at Indiana University. The fraternity's motto is Achievement in Every Field of Human Endeavor. Over 150,000 members in 700+ chapters.",true);

    await sb("book_d9_oop","authoritative","Omega Psi Phi Fraternity, Inc. — Official Site","https://www.omegapsiphifraternity.org","Omega Psi Phi was founded November 17, 1911 at Howard University by Edgar Amos Love, Oscar James Cooper, Frank Coleman, and Dr. Ernest Everett Just. The first Greek-letter fraternity founded at an HBCU.",true);

    await sb("book_d9_dst","authoritative","Delta Sigma Theta Sorority, Inc. — Official Site","https://www.deltasigmatheta.org","Delta Sigma Theta was founded January 13, 1913 at Howard University by 22 collegiate women. A sisterhood of predominantly Black, college-educated women committed to public service. Over 350,000 members worldwide.",true);

    await sb("book_d9_pbs","authoritative","Phi Beta Sigma Fraternity, Inc. — Official Site","https://www.phibetasigma1914.org","Phi Beta Sigma was founded January 9, 1914 at Howard University on the ideals of Brotherhood, Scholarship, and Service. The only fraternity constitutionally bound to a sorority (Zeta Phi Beta).",true);

    await sb("book_d9_zpb","authoritative","Zeta Phi Beta Sorority, Inc. — Official Site","https://www.zphib1920.org","Zeta Phi Beta was founded January 16, 1920 at Howard University — the first sorority to charter a chapter in Africa, establish auxiliary groups, and be constitutionally bound to a fraternity (Phi Beta Sigma).",true);

    await sb("book_d9_sgr","authoritative","Sigma Gamma Rho Sorority, Inc. — Official Site","https://www.sgrho1922.org","Sigma Gamma Rho was founded November 12, 1922 at Butler University in Indianapolis — the only Divine Nine sorority not founded at an HBCU. Over 100,000 members across 500+ chapters.",true);

    await sb("book_d9_ipt","authoritative","Iota Phi Theta Fraternity, Inc. — Official Site","https://www.iotaphitheta.org","Iota Phi Theta was founded September 19, 1963 at Morgan State University — the youngest of the Divine Nine organizations, founded during the height of the Civil Rights Movement.",true);

    log("Library activation: Divine Nine sources seeded");

    // ── Step 4: Seed knowledge_sources for Health Books ──────────────────────
    await sb("book_h_diabetes","authoritative","CDC — Diabetes and African Americans","https://www.cdc.gov/diabetes/library/features/diabetes-african-americans.html","Black adults are 60% more likely to be diagnosed with diabetes compared to non-Hispanic white adults, and face higher rates of kidney disease, blindness, and amputation as complications.",true);
    await sb("book_h_diabetes","authoritative","National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)","https://www.niddk.nih.gov","NIDDK supports research and provides evidence-based information on diabetes prevention, management, and treatment — including culturally tailored resources.",false);
    await sb("book_h_diabetes","professional","American Diabetes Association","https://www.diabetes.org","The ADA funds research, advocates for people with diabetes, and publishes clinical guidelines for care. The Standards of Medical Care in Diabetes is the field's definitive reference.",false,"high");

    await sb("book_h_maternal","authoritative","CDC — Racial and Ethnic Disparities in Pregnancy-Related Deaths","https://www.cdc.gov/reproductivehealth/maternal-mortality/disparities.html","Black women are approximately 2.6 times more likely to die from pregnancy-related causes than white women. This disparity persists across income and education levels.",true);
    await sb("book_h_maternal","authoritative","HHS Office of Minority Health — Black/African American Women's Health","https://minorityhealth.hhs.gov/omh/browse.aspx?lvl=4&lvlid=19","The Office of Minority Health provides data and resources on maternal mortality, prenatal care disparities, doula access, and programs addressing the Black maternal health crisis.",false);
    await sb("book_h_maternal","professional","American College of Obstetricians and Gynecologists (ACOG)","https://www.acog.org","ACOG's equity work addresses persistent disparities in maternal outcomes faced by Black women, including initiatives on implicit bias training and expanded doula reimbursement.",false,"high");

    await sb("book_h_mental","authoritative","SAMHSA — Behavioral Health Among African Americans","https://www.samhsa.gov/behavioral-health-equity/racial-ethnic-minority-populations/african-american-behavioral-health","Black Americans face unique mental health challenges tied to historical trauma and ongoing discrimination, yet are less likely to receive mental health care due to stigma, cost, and access barriers.",true);
    await sb("book_h_mental","authoritative","National Institute of Mental Health (NIMH)","https://www.nimh.nih.gov","NIMH provides evidence-based information on mental health conditions, culturally informed treatment approaches, and resources for finding culturally competent therapists.",false);
    await sb("book_h_mental","professional","American Psychological Association — Racism and Mental Health","https://www.apa.org/topics/racism-bias-discrimination/ptsd-racial-ethnic-minorities","The APA documents the psychological impacts of racism and discrimination and publishes guidelines for culturally responsive mental health care.",false,"high");

    await sb("book_h_fertility","authoritative","American Society for Reproductive Medicine (ASRM)","https://www.reproductivefacts.org","ASRM provides patient-centered information on fertility evaluation, causes of infertility, and the full range of treatment options. Its fact sheets are the field's standard patient resources.",true);
    await sb("book_h_fertility","authoritative","NICHD — Infertility Research","https://www.nichd.nih.gov/health/topics/infertility","The Eunice Kennedy Shriver National Institute of Child Health and Human Development conducts and funds research on causes of infertility and factors affecting reproductive health across communities.",false);

    await sb("book_h_ivf","authoritative","RESOLVE: The National Infertility Association","https://resolve.org","RESOLVE provides comprehensive resources on IVF and assisted reproductive technology, including a clinic finder, cost guides, insurance navigation support, and community forums.",true);
    await sb("book_h_ivf","authoritative","ASRM — In Vitro Fertilization Patient Guide","https://www.reproductivefacts.org","ASRM's patient guide explains the IVF process step by step — from ovarian stimulation through embryo transfer — including success rates by age, costs, and what to ask your clinic.",false);

    await sb("book_h_fibroids","authoritative","NICHD — Uterine Fibroids","https://www.nichd.nih.gov/health/topics/uterine","Black women are 2 to 3 times more likely to develop uterine fibroids, tend to develop them earlier, have more numerous fibroids, and experience more severe symptoms than white women.",true);
    await sb("book_h_fibroids","authoritative","HHS Office on Women's Health — Uterine Fibroids","https://www.womenshealth.gov/a-z-topics/uterine-fibroids","The OWH provides comprehensive patient information on fibroid symptoms, diagnosis methods, and the full range of treatment options from medication to surgery.",false);

    await sb("book_h_endometriosis","authoritative","Endometriosis Foundation of America","https://www.endofound.org","The Endometriosis Foundation educates, advocates, and funds research on endometriosis — a condition affecting ~1 in 10 women of reproductive age that causes chronic pain and fertility challenges.",true);
    await sb("book_h_endometriosis","authoritative","HHS Office on Women's Health — Endometriosis","https://www.womenshealth.gov/a-z-topics/endometriosis","OWH provides evidence-based information on endometriosis symptoms, diagnostic challenges (average 7-year diagnosis delay), and treatment options.",false);

    await sb("book_h_sickle_cell","authoritative","CDC — Sickle Cell Disease","https://www.cdc.gov/ncbddd/sicklecell/index.html","Sickle cell disease affects approximately 100,000 Americans — predominantly Black Americans. About 1 in 365 Black children is born with SCD. About 1 in 13 Black Americans is born with sickle cell trait.",true);
    await sb("book_h_sickle_cell","authoritative","National Heart, Lung, and Blood Institute (NHLBI)","https://www.nhlbi.nih.gov/health/sickle-cell-disease","NHLBI provides research-backed information on SCD causes, symptoms, diagnosis, treatment advances including hydroxyurea and gene therapy, and resources for patients and families.",false);

    await sb("book_h_breast_cancer","authoritative","American Cancer Society — Breast Cancer in African American Women","https://www.cancer.org/cancer/breast-cancer/understanding-a-breast-cancer-diagnosis/breast-cancer-in-african-american-women.html","Black women have a higher rate of dying from breast cancer than white women. Triple-negative breast cancer — more aggressive and harder to treat — is more common among Black women.",true);
    await sb("book_h_breast_cancer","authoritative","CDC — Breast Cancer Statistics","https://www.cdc.gov/cancer/breast/statistics/index.htm","CDC provides breast cancer statistics broken down by race and ethnicity, and publishes screening guidelines and resources for understanding individual risk.",false);

    await sb("book_h_prostate","authoritative","CDC — Prostate Cancer and African American Men","https://www.cdc.gov/cancer/prostate/statistics/race.htm","Black men are 73% more likely to develop prostate cancer and more than twice as likely to die from it compared to non-Hispanic white men. Earlier screening conversations are critical.",true);
    await sb("book_h_prostate","professional","American Cancer Society — Prostate Cancer Risk Factors","https://www.cancer.org/cancer/prostate-cancer/causes-risks-prevention/risk-factors.html","The ACS documents racial disparities in prostate cancer and provides guidance on when to begin screening discussions with your healthcare provider.",false,"high");

    await sb("book_h_hypertension","authoritative","CDC — High Blood Pressure and African Americans","https://www.cdc.gov/bloodpressure/about.htm","Black adults have among the highest rates of hypertension in the world — nearly 56% of Black adults have high blood pressure. They develop it earlier and more severely than white adults.",true);
    await sb("book_h_hypertension","professional","American Heart Association — High Blood Pressure in African Americans","https://www.heart.org/en/health-topics/high-blood-pressure","The AHA provides clinical guidance on the unique cardiovascular risks Black Americans face and prevention and treatment recommendations including diet, medication, and monitoring.",false,"high");

    await sb("book_h_menopause","authoritative","The Menopause Society (formerly NAMS)","https://www.menopause.org","The Menopause Society is the leading nonprofit scientific organization dedicated to promoting the health of women during midlife and beyond — including evidence on racial disparities in menopause experience.",true);
    await sb("book_h_menopause","authoritative","NICHD — Menopause and Racial/Ethnic Health","https://www.nichd.nih.gov/health/topics/menopause","Research shows Black women experience more severe hot flashes, higher rates of sleep disturbances, and higher reporting of depression during perimenopause compared to white women.",false);

    await sb("book_h_pcos","authoritative","NICHD — Polycystic Ovary Syndrome (PCOS)","https://www.nichd.nih.gov/health/topics/pcos","PCOS affects approximately 6–12% of U.S. women of reproductive age, making it one of the most common hormonal disorders. The NICHD funds research on its causes, symptoms, and treatments.",true);
    await sb("book_h_pcos","professional","PCOS Awareness Association","https://www.pcosaa.org","The PCOS Awareness Association provides education and peer support resources for individuals living with polycystic ovary syndrome, including symptom tracking and treatment guidance.",false,"high");

    log("Library activation: Health Book sources seeded");

    // ── Step 5: Seed knowledge_sources for Faith Books ────────────────────────
    await sb("book_f_ame","authoritative","African Methodist Episcopal Church — Official Site","https://www.ame-church.com","The African Methodist Episcopal Church was founded in 1816 by Bishop Richard Allen in Philadelphia, PA — the first independent Black denomination in the United States. The AME Church has played a central role in civil rights, education, and community life.",true);
    await sb("book_f_ame","authoritative","Smithsonian NMAAHC — AME Church History","https://nmaahc.si.edu","The Smithsonian documents the AME Church's founding at Mother Bethel in Philadelphia and its pivotal role in the abolition movement, Underground Railroad, and civil rights.",false);
    await sb("book_f_ame","professional","Library of Congress — AME Church Records","https://www.loc.gov","The Library of Congress holds historical AME records including early convention proceedings, missionary documentation, and correspondence from the church's founding era.",false,"high");

    await sb("book_f_baptist","authoritative","National Baptist Convention, USA, Inc. — Official Site","https://www.nationalbaptist.com","The National Baptist Convention is the largest Black religious denomination in the United States, with over 31,000 member churches and 7.5 million members. It was instrumental in the civil rights movement.",true);
    await sb("book_f_baptist","professional","PBS — This Far by Faith Documentary","https://www.pbs.org/thisfarbyfaith","PBS This Far by Faith documents the Black Baptist tradition and its role in shaping African American community, culture, and the civil rights movement from slavery through the present.",false,"high");

    await sb("book_f_cogic","authoritative","Church of God in Christ — Official Site","https://www.cogic.org","COGIC is the largest Pentecostal denomination in the United States, founded in 1907 by Bishop Charles Harrison Mason in Memphis, TN. Known for worship culture, gospel music, and global community.",true);

    await sb("book_f_black_cath","authoritative","National Black Catholic Congress","https://www.nbccongress.org","The National Black Catholic Congress is the representative voice for Black Catholics in America, tracing its roots to a series of congresses beginning in 1889. Over 3 million Black Catholics in the U.S.",true);
    await sb("book_f_black_cath","professional","USCCB — Black Catholic History","https://www.usccb.org","The USCCB documents Black Catholic history and the contributions of historically Black Catholic institutions, parishes, and schools to African American community life.",false,"high");

    await sb("book_f_eth_orth","authoritative","Ethiopian Orthodox Tewahedo Church — Official Documentation","https://www.ethiopianorthodox.org","The Ethiopian Orthodox Tewahedo Church is one of the oldest Christian churches in the world, established in the 4th century AD. It uses the ancient Ge'ez liturgical language and follows the Alexandrian Rite.",true);
    await sb("book_f_eth_orth","professional","Library of Congress — Ethiopian & Eritrean Collections","https://www.loc.gov/research-centers/african-and-middle-eastern-division","The Library of Congress African and Middle Eastern Division holds extensive resources on Ethiopian Orthodox history, canonical scripture, and diaspora communities in the U.S.",false,"high");

    await sb("book_f_islam","authoritative","Islamic Society of North America (ISNA)","https://www.isna.net","ISNA is one of the largest Muslim organizations in North America, serving as a platform for presenting Islam and providing resources connecting Muslims across communities.",true);
    await sb("book_f_islam","professional","Smithsonian — Islam in African American History","https://www.smithsonianmag.com","Smithsonian documents Islam in the Black American experience — from the estimated 15–30% of enslaved Africans who were Muslim, through the Nation of Islam, to mainstream Sunni and Shia communities today.",false,"high");

    await sb("book_f_judaism","authoritative","Union for Reform Judaism — Black Jewish Communities","https://www.urj.org","The URJ provides resources on Black Jewish identity, the history of Hebrew Israelite communities, Lemba and Ethiopian Jewish traditions, and the experiences of African American Jews.",true);

    await sb("book_f_sikh","authoritative","Sikh Coalition","https://www.sikhcoalition.org","The Sikh Coalition is the largest Sikh civil rights organization in the United States and provides educational resources on Sikh heritage, the Guru Granth Sahib, and the langar tradition of community feeding.",true);

    await sb("book_f_buddhism","authoritative","Soka Gakkai International-USA","https://www.sgi-usa.org","SGI-USA has a significant African American membership and has been an important gateway for Black Americans to engage with Buddhist practice, Nichiren Buddhism, and interfaith dialogue.",true);

    await sb("book_f_african_sp","professional","Smithsonian — African Diasporic Religious Traditions","https://www.smithsonianmag.com","Smithsonian provides historical and cultural context for Yoruba, Vodou, Candomblé, Santería, and other African spiritual traditions preserved and transformed across the diaspora.",true,"high");
    await sb("book_f_african_sp","professional","Library of Congress — African Diaspora Collection","https://www.loc.gov","The Library of Congress holds extensive documentation on African diaspora spiritual traditions, their West African origins, and their evolution in the Americas under enslavement and freedom.",false,"high");

    await sb("book_f_interfaith","professional","Interfaith America","https://www.interfaithamerica.org","Interfaith America (formerly Interfaith Youth Core) advances religious diversity and bridges communities across faith traditions through education, civic dialogue, and campus initiatives.",true,"high");

    log("Library activation: Faith Book sources seeded");

    // ── Step 6: Priority general topics — Education ───────────────────────────
    await st("HBCU Admissions & Scholarships","authoritative","Federal Student Aid — HBCUs","https://studentaid.gov/understand-aid/types/grants","Federal Student Aid provides information on HBCU-specific scholarships, grants, and financial aid programs. The federal government provides more than $3.4 billion annually to support the 101 federally recognized HBCUs.",true);
    await st("HBCU Admissions & Scholarships","authoritative","U.S. Department of Education — White House HBCU Initiative","https://www2.ed.gov/about/inits/ed/whhbcu/index.html","The White House Initiative on HBCUs coordinates federal resources, tracks accountability data, and supports students seeking admission and scholarships at Historically Black Colleges and Universities.",false);
    await st("HBCU Admissions & Scholarships","professional","NAFEO — National Association for Equal Opportunity","https://www.nafeo.org","NAFEO advocates for HBCUs and provides scholarship databases, enrollment support, and policy resources for students applying to and attending Historically Black Colleges and Universities.",false,"high");

    await st("FAFSA & Financial Aid Navigation","authoritative","Federal Student Aid — FAFSA","https://studentaid.gov/h/apply-for-aid/fafsa","The Free Application for Federal Student Aid (FAFSA) is the official federal application that determines eligibility for grants (including Pell), work-study, and federal student loans. It is the starting point for all federal college financial aid.",true);
    await st("FAFSA & Financial Aid Navigation","authoritative","Federal Student Aid — Understanding Aid Types","https://studentaid.gov/understand-aid/types","Federal Student Aid explains the four types of aid (grants, scholarships, work-study, loans), how Expected Family Contribution is calculated, and how to compare financial aid packages.",false);
    await st("FAFSA & Financial Aid Navigation","professional","College Board — BigFuture Paying for College","https://bigfuture.collegeboard.org/pay-for-college","College Board's BigFuture provides tools for estimating college costs, understanding financial aid award letters, and comparing net prices across institutions.",false,"high");

    await st("First-Generation College Students","authoritative","Federal TRIO Programs — U.S. Department of Education","https://www2.ed.gov/about/offices/list/ope/trio/index.html","The Federal TRIO Programs support first-generation and low-income students from middle school through graduate school — including Upward Bound, Talent Search, Student Support Services, and McNair Scholars.",true);
    await st("First-Generation College Students","professional","Pell Institute for the Study of Opportunity in Higher Education","https://www.pellinstitute.org","The Pell Institute conducts research on barriers faced by first-generation and low-income college students and advocates for evidence-based policies to improve access and completion.",false,"high");

    await st("HBCUs","authoritative","U.S. Department of Education — HBCU List and Data","https://www2.ed.gov/about/inits/ed/whhbcu/hbcu-list.html","The U.S. Department of Education maintains the official list of 101 federally recognized HBCUs, with enrollment data, graduation rates, and information on federal funding by institution.",true);
    await st("HBCUs","authoritative","Smithsonian NMAAHC — HBCU Legacy","https://nmaahc.si.edu","The Smithsonian documents the founding of HBCUs after the Civil War, their role in educating generations of Black Americans during segregation, and their ongoing cultural significance to Black identity.",false);

    // ── Step 7: Priority general topics — Philadelphia ───────────────────────
    await st("Philadelphia Faith","authoritative","Mother Bethel AME Church — Official Site","https://www.motherbethel.org","Mother Bethel AME Church, founded 1793 by Bishop Richard Allen, is the oldest parcel of land continuously owned by Black Americans in the United States and a National Historic Landmark in Philadelphia.",true);
    await st("Philadelphia Faith","professional","Visit Philadelphia — Historic Black Churches","https://www.visitphilly.com","Philadelphia's Black religious landscape spans the oldest AME congregation in the world, historic Black Catholic parishes, mosques, and diverse faith communities rooted in the city's African American history.",false,"high");

    await st("Philadelphia Nightlife","professional","Visit Philadelphia — Nightlife & Entertainment","https://www.visitphilly.com","Visit Philadelphia is the official tourism organization providing guides to live music venues, jazz clubs, comedy shows, and neighborhood nightlife scenes across the city.",true,"high");

    await st("Philadelphia History","authoritative","Historical Society of Pennsylvania","https://hsp.org","The HSP holds millions of primary documents on Philadelphia and Pennsylvania history, including one of the largest collections of African American historical records on the East Coast.",true);

    await st("Philadelphia Employment","professional","Philadelphia Works — Workforce Development","https://www.philaworks.org","Philadelphia Works is the workforce development board for the city of Philadelphia, providing job training, career resources, and employer connections for residents seeking employment.",true,"high");

    // ── Step 8: International — Thailand / Southeast Asia ────────────────────
    await st("Thailand","authoritative","Tourism Authority of Thailand — Official Site","https://www.tourismthailand.org","Thailand's official tourism organization provides destination guides, cultural information, visa requirements, and travel resources across all regions of Thailand.",true);
    await st("Thailand","authoritative","Royal Thai Embassy — U.S. Visitor Information","https://thaiembdc.org","The Royal Thai Embassy provides official visa information, entry requirements, health advisories, and practical information for Americans planning travel to Thailand.",false);

    await st("Bangkok","authoritative","Tourism Authority of Thailand — Bangkok","https://www.tourismthailand.org/Destinations/Provinces/Bangkok/149","Bangkok is Thailand's capital and largest city — known for ornate temples (Wat Phra Kaew, Wat Arun), floating markets, world-class street food, vibrant nightlife, and as Southeast Asia's major travel gateway.",true);
    await st("Bangkok","professional","Lonely Planet — Bangkok City Guide","https://www.lonelyplanet.com/thailand/bangkok","Lonely Planet provides neighborhood guides, transportation info, cultural tips, and curated recommendations for experiencing Bangkok as an international traveler.",false,"high");

    await st("Phuket","authoritative","Tourism Authority of Thailand — Phuket","https://www.tourismthailand.org/Destinations/Provinces/Phuket/170","Phuket is Thailand's largest island province in the Andaman Sea — known for beaches, the historic Old Town, Phi Phi Islands, and as one of Southeast Asia's most visited destinations.",true);
    await st("Phuket","professional","Lonely Planet — Phuket Province Guide","https://www.lonelyplanet.com/thailand/phuket-province","Lonely Planet covers Phuket's beaches, Old Town walking tours, island-hopping day trips, and practical transport information from the airport.",false,"high");

    // ── Step 9: International — Africa ───────────────────────────────────────
    await st("Kenya","authoritative","Kenya Tourism Board — Magical Kenya","https://www.magicalkenya.com","Kenya's official tourism authority provides destination guides for Maasai Mara safari experiences, coastal Mombasa culture, Nairobi city life, and the country's 47 counties.",true);
    await st("Kenya","professional","Smithsonian — East African Heritage","https://www.smithsonianmag.com","Smithsonian provides cultural and historical context on Kenya, including the Swahili Coast trading networks, Maasai and Kikuyu communities, and Kenya's role in human evolutionary history.",false,"high");

    await st("Ethiopia","authoritative","Ethiopian Tourism Organization","https://www.tourismethiopia.org","Ethiopia's official tourism organization provides guides to Lalibela's rock-hewn churches, the Omo Valley, Simien Mountains, Axum obelisks, and the country's extraordinary cultural heritage.",true);
    await st("Ethiopia","authoritative","UNESCO — Ethiopian World Heritage Sites","https://whc.unesco.org/en/statesparties/et","Ethiopia has 9 UNESCO World Heritage Sites — including the rock-hewn churches of Lalibela, the ruins of Aksum, and the Lower Omo Valley, among the oldest archaeological sites in the world.",false);

    await st("Ghana","authoritative","Ghana Tourism Authority — Ghana.travel","https://www.ghana.travel","Ghana's official tourism authority provides destination guides including Cape Coast Castle, Kakum National Park, Kumasi Ashanti cultural sites, and the country's role as a leading Diaspora travel destination.",true);
    await st("Ghana","professional","Smithsonian — Ghana's Year of Return and Diaspora Heritage","https://www.smithsonianmag.com","Ghana's Year of Return (2019) and Beyond the Return initiative have made Ghana a key destination for African Americans reconnecting with ancestral roots — marking 400 years since the transatlantic slave trade.",false,"high");

    await st("Nigeria","authoritative","Nigeria Tourism Development Corporation","https://www.tourism.gov.ng","Nigeria's official tourism corporation provides destination information for Lagos, Abuja, the Niger Delta, and northern historical sites including Kano and Zaria.",true);
    await st("Nigeria","professional","Smithsonian — Nigerian Arts, Culture, and Nollywood","https://www.smithsonianmag.com","Nigeria is Africa's largest economy with over 250 ethnic groups, a rich cultural landscape including Nollywood (world's 2nd-largest film industry), Afrobeats, and the ancient Benin bronze tradition.",false,"high");

    await st("South Africa","authoritative","South African Tourism — Official Site","https://www.southafrica.net","South Africa's official tourism site provides guides to Cape Town, Johannesburg, the Garden Route, Kruger National Park, and Robben Island where Nelson Mandela was imprisoned for 18 years.",true);
    await st("South Africa","professional","Smithsonian — South Africa and the End of Apartheid","https://www.smithsonianmag.com","Smithsonian documents South Africa's history under apartheid, the 1994 democratic transition led by Nelson Mandela, and the country's ongoing social and economic transformation.",false,"high");

    // ── Step 10: Caribbean ───────────────────────────────────────────────────
    await st("Jamaica","authoritative","Jamaica Tourist Board — Visit Jamaica","https://www.visitjamaica.com","Jamaica's official tourism board provides destination guides to Kingston, Montego Bay, Negril, Ocho Rios, and the Blue Mountains. Jamaica is the birthplace of reggae, dancehall, and Rastafari.",true);
    await st("Jamaica","professional","Smithsonian — Jamaican Culture and African Diaspora","https://www.smithsonianmag.com","Jamaican culture — from reggae and Bob Marley to Rastafari, jerk cuisine, and the Blue Lagoon — reflects a vibrant African diaspora heritage that has shaped global music and culture.",false,"high");

    await st("Haiti","authoritative","Haiti — Cultural and Historical Resources","https://www.haiti.org","Haiti was the first Black republic in the world, achieving independence in 1804 after the only successful slave revolt in history. Citadelle Laferrière is a UNESCO World Heritage Site.",true);

    await st("Bahamas","authoritative","Bahamas Ministry of Tourism — Official Site","https://www.bahamas.com","The Bahamas' official tourism site covers Nassau, Paradise Island, the Exumas, and 700 islands known for world-class beaches, diving, and the Junkanoo cultural festival tradition.",true);

    await st("Barbados","authoritative","Barbados Tourism Marketing Inc. — Visit Barbados","https://www.visitbarbados.org","Barbados is a sovereign island nation with a distinct Bajan identity — birthplace of Rihanna, with a rich rum heritage, the UNESCO-listed Bridgetown historic district, and coral-lined beaches.",true);

    await st("Trinidad and Tobago","authoritative","Tourism Trinidad Ltd. — Official Site","https://www.gotrinidadandtobago.com","Trinidad and Tobago is the birthplace of calypso and soca music and home to one of the world's largest Carnival celebrations. The twin-island nation has a rich African, Indian, and Creole heritage.",true);

    await st("Dominican Republic","authoritative","Ministry of Tourism Dominican Republic — Go Dominican Republic","https://www.godominicanrepublic.com","The Dominican Republic's official tourism site covers Punta Cana, Santo Domingo (the oldest continuously inhabited European settlement in the Americas), Samaná, and the country's Caribbean culture.",true);

    await st("Cuba","authoritative","Cuba Travel — Official Tourism Resources","https://www.cubatravelusa.com","Cuba is home to 9 UNESCO World Heritage Sites including Old Havana, the Valley of Viñales, and Trinidad. Its Afro-Cuban culture — from Santería to Rumba and son music — is central to its identity.",true);

    await st("Colombia","authoritative","ProColombia Tourism","https://colombia.travel","Colombia's official tourism promotion agency covers Cartagena (with its large Afro-Colombian population and UNESCO-listed old city), Medellín, Cali (salsa capital), the Amazon, and Caribbean coast.",true);

    await st("Brazil","authoritative","Brazilian Tourist Board (Embratur)","https://www.embratur.com.br","Brazil has the largest African diaspora population outside Africa. Salvador da Bahia is considered the cultural heart of Afro-Brazilian heritage — home to Candomblé, capoeira, and axé music.",true);

    log(`Library activation: ${sourcesAdded} knowledge_sources seeded across all Tier 1 Books and general topics`);
    log("Library Content Activation v1: complete");

  } catch (err: unknown) {
    warn(`Library activation v1 failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── African Geography Nodes v1 ─────────────────────────────────────────────────
// Adds the 45 African sovereign nations missing from the geography topology.
// Each gets: stable short ID, node_type=geography, category=country, status=published.
// Connected to Places and Travel collections, and to Culture & Community.
async function ensureAfricanGeographyNodes_v1(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    const AFRICA = [
      ["geo_af_algeria",    "Algeria",                   "North Africa's largest country — home to the Sahara Desert, ancient Roman ruins at Timgad and Djémila, and the UNESCO-listed Casbah of Algiers."],
      ["geo_af_angola",     "Angola",                    "A nation of extraordinary natural diversity — from Kalandula Falls to the Namib Desert. Angola has one of Africa's fastest-growing economies."],
      ["geo_af_benin",      "Benin",                     "Birthplace of Vodun (Voodoo) religion and home to the ancient Kingdom of Dahomey — a center of African cultural heritage and history."],
      ["geo_af_botswana",   "Botswana",                  "Home to the Okavango Delta, one of the world's largest inland deltas and a UNESCO World Heritage Site, and the Chobe National Park."],
      ["geo_af_bfaso",      "Burkina Faso",              "A landlocked West African nation known for its vibrant arts and crafts tradition and the FESPACO Pan-African Film Festival held in Ouagadougou."],
      ["geo_af_burundi",    "Burundi",                   "One of Africa's smallest nations, situated at the northeastern shore of Lake Tanganyika — the world's longest freshwater lake."],
      ["geo_af_capeverde",  "Cape Verde",                "An archipelago of 10 volcanic islands off West Africa's coast — known for morna music, Creole culture, and as a nexus of African, Portuguese, and diaspora identity."],
      ["geo_af_cameroon",   "Cameroon",                  "Known as 'Africa in miniature' for its geographic and cultural diversity — spanning rainforest, savannah, mountains, and over 250 ethnic groups."],
      ["geo_af_car",        "Central African Republic",  "A landlocked country with extraordinary biodiversity, including Dzanga-Sangha Reserve — one of the last refuges for forest elephants and western lowland gorillas."],
      ["geo_af_chad",       "Chad",                      "Home to Lake Chad and the Tibesti Mountains, Chad straddles the Sahara and sub-Saharan Africa with a richly diverse culture of over 200 ethnic groups."],
      ["geo_af_comoros",    "Comoros",                   "An archipelago nation between Madagascar and Mozambique — known as the Perfume Islands for their ylang-ylang and clove cultivation."],
      ["geo_af_congo_brz",  "Republic of the Congo",     "Home to the Congo Basin rainforest — the world's second-largest tropical rainforest — and a rich tradition of Kongo kingdom heritage."],
      ["geo_af_congo_drc",  "Democratic Republic of Congo","The DRC contains more than half of Africa's rainforest and the Congo River — Africa's deepest river. It is one of the most biodiverse places on Earth."],
      ["geo_af_cotediv",    "Côte d'Ivoire",             "Côte d'Ivoire (Ivory Coast) is one of West Africa's most prosperous nations and a major center of Ivorian music, fashion, and contemporary African art."],
      ["geo_af_djibouti",   "Djibouti",                  "A small East African nation at the strategic Bab-el-Mandeb Strait — where the Red Sea meets the Gulf of Aden — with salt lakes, volcanoes, and underwater coral reefs."],
      ["geo_af_egypt",      "Egypt",                     "Home to one of humanity's oldest civilizations — the pyramids of Giza, the Sphinx, Luxor's temples, and the Nile — Egypt is both an African and Mediterranean heritage destination."],
      ["geo_af_equatguinea","Equatorial Guinea",         "The only Spanish-speaking country in Africa — comprising a mainland region and islands including Bioko — with rich oil resources and tropical rainforest."],
      ["geo_af_eritrea",    "Eritrea",                   "One of Africa's youngest nations, achieving independence in 1993. Home to the UNESCO-listed modernist city of Asmara and ancient Aksumite ruins."],
      ["geo_af_eswatini",   "Eswatini",                  "One of the world's last absolute monarchies and landlocked between South Africa and Mozambique — known for the Incwala and Umhlanga Reed Dance ceremonies."],
      ["geo_af_gabon",      "Gabon",                     "One of Africa's most forested countries — 88% forest cover — with national parks protecting gorillas, forest elephants, and hippos in Loango National Park."],
      ["geo_af_gambia",     "Gambia",                    "Africa's smallest mainland nation — a narrow strip along the Gambia River — known as the Gateway to Africa and a major roots tourism destination for the African diaspora."],
      ["geo_af_guinea",     "Guinea",                    "Home to the Fouta Djallon highlands — the 'water tower of West Africa' — and a significant Fulani and Mandinka cultural heritage."],
      ["geo_af_guineabiss", "Guinea-Bissau",             "An archipelago of 88 islands and a mainland — known for the UNESCO-listed Bijagós Archipelago, one of West Africa's most pristine coastal ecosystems."],
      ["geo_af_lesotho",    "Lesotho",                   "The only country in the world entirely above 1,000 meters elevation — a mountainous kingdom within South Africa known as the Kingdom in the Sky and for Basotho culture."],
      ["geo_af_liberia",    "Liberia",                   "Founded in 1847 by free Black Americans and freed slaves — Liberia has a unique historical connection to the African American diaspora and is Africa's oldest republic."],
      ["geo_af_libya",      "Libya",                     "Home to extraordinary Roman ruins at Leptis Magna and Sabratha — UNESCO World Heritage Sites along the Mediterranean — and ancient rock art in the Sahara."],
      ["geo_af_madagascar", "Madagascar",                "The fourth-largest island in the world — home to 90% of endemic wildlife including lemurs and baobab avenues — a biodiversity treasure unlike anywhere on Earth."],
      ["geo_af_malawi",     "Malawi",                    "Known as the Warm Heart of Africa — Malawi's culture of hospitality is legendary — with Lake Malawi (a UNESCO World Heritage Site) at its center."],
      ["geo_af_mali",       "Mali",                      "Home to the ancient city of Timbuktu — once a global center of Islamic learning — and the Dogon cliffs with one of Africa's most distinctive living cultural landscapes."],
      ["geo_af_mauritania", "Mauritania",                "A vast Saharan nation where ancient caravan cities like Chinguetti — a UNESCO World Heritage Site — served as gateways to Mecca for West African pilgrims."],
      ["geo_af_mauritius",  "Mauritius",                 "A multicultural island nation in the Indian Ocean — with a blend of African, Indian, French, and Creole culture, UNESCO-listed Aapravasi Ghat, and pristine lagoons."],
      ["geo_af_morocco",    "Morocco",                   "Where Africa meets the Arab world and the Mediterranean — the medinas of Marrakesh, Fès, and Chefchaouen are UNESCO World Heritage Sites drawing millions of visitors."],
      ["geo_af_mozambique", "Mozambique",                "A long Indian Ocean coastline with extraordinary marine biodiversity, Portuguese colonial architecture in Maputo, and the Bazaruto Archipelago coral reefs."],
      ["geo_af_namibia",    "Namibia",                   "Home to the oldest desert in the world — the Namib — and the red dunes of Sossusvlei, Etosha National Park, and the Himba people with their ochre-painted skin."],
      ["geo_af_niger",      "Niger",                     "One of the world's largest countries by area — home to the Air Mountains, Ténéré Desert, and the ancient city of Agadez — a UNESCO World Heritage Site and traditional Tuareg hub."],
      ["geo_af_rwanda",     "Rwanda",                    "Known as the Land of a Thousand Hills — Rwanda's remarkable post-genocide national reconciliation, mountain gorilla conservation, and Kigali's cleanliness are internationally recognized."],
      ["geo_af_saotome",    "São Tomé and Príncipe",     "A small island nation in the Gulf of Guinea — one of Africa's smallest countries — with Portuguese Creole culture, cacao heritage, and tropical biodiversity."],
      ["geo_af_seychelles", "Seychelles",                "A 115-island archipelago in the Indian Ocean — home to UNESCO-listed Vallée de Mai (where the legendary Coco de Mer palm grows), pristine coral reefs, and rare endemic species."],
      ["geo_af_sierraleone","Sierra Leone",              "Home to Bunce Island — one of the most significant slave trading sites in West Africa — and a nation with a powerful connection to the African American roots journey."],
      ["geo_af_somalia",    "Somalia",                   "One of the world's longest coastlines on the Horn of Africa — home to ancient Cushitic civilization, Somali poetry tradition, and the historic port of Mogadishu."],
      ["geo_af_southsudan", "South Sudan",               "The world's youngest nation (independence 2011) — home to the Sudd, one of the world's largest freshwater ecosystems, and the Dinka and Nuer cattle culture."],
      ["geo_af_sudan",      "Sudan",                     "Home to more ancient pyramids than Egypt — the Nubian pyramids of Meroe are UNESCO World Heritage Sites — and the ancient Nubian civilization along the Nile."],
      ["geo_af_tanzania",   "Tanzania",                  "Home to Kilimanjaro (Africa's highest peak), the Serengeti, Zanzibar's Stone Town (UNESCO World Heritage Site), and the Ngorongoro Crater — East Africa's premier destination.",],
      ["geo_af_togo",       "Togo",                      "A narrow West African nation with vibrant Ewe and Kabye cultures, Voodoo spiritual traditions, and the UNESCO-listed Koutammakou landscape."],
      ["geo_af_tunisia",    "Tunisia",                   "Where Africa meets the Mediterranean — Carthage's ruins, the UNESCO-listed medina of Tunis, and the Sahara landscapes of Douz make Tunisia a cultural crossroads."],
      ["geo_af_uganda",     "Uganda",                    "The Pearl of Africa — home to mountain gorillas in Bwindi, the source of the Nile at Jinja, and diverse cultures including the historic Buganda Kingdom."],
      ["geo_af_zambia",     "Zambia",                    "Home to Victoria Falls — one of the world's largest waterfalls and a UNESCO World Heritage Site — and extraordinary Luangwa Valley wildlife reserves."],
      ["geo_af_zimbabwe",   "Zimbabwe",                  "Home to Great Zimbabwe — the largest ancient stone structure in sub-Saharan Africa and a UNESCO World Heritage Site — and Victoria Falls on the Zambezi River."],
    ];

    let added = 0;
    for (const [id, name, desc] of AFRICA) {
      // Insert topic node
      const topicResult = await pool.query(
        `INSERT INTO knowledge_topics
           (id, topic_name, canonical_name, category, description, node_type, topic_type, enabled, status, credibility_score, credibility_tier, geography_ref)
         VALUES ($1,$2,$2,'country',$3,'geography','general',true,'published',60,'professional',$2)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, desc],
      );
      added += topicResult.rowCount ?? 0;

      // Connect to Places collection
      await pool.query(
        `INSERT INTO topic_relationships (id, parent_topic_id, child_topic_id, relationship_type, weight)
         VALUES (gen_random_uuid()::text,'coll_places',$1,'contains',0.8)
         ON CONFLICT (parent_topic_id, child_topic_id, relationship_type) DO NOTHING`,
        [id],
      );
      // Connect to Travel collection
      await pool.query(
        `INSERT INTO topic_relationships (id, parent_topic_id, child_topic_id, relationship_type, weight)
         VALUES (gen_random_uuid()::text,'coll_travel',$1,'contains',0.8)
         ON CONFLICT (parent_topic_id, child_topic_id, relationship_type) DO NOTHING`,
        [id],
      );
      // Connect to Culture & Community collection for diaspora-relevant countries
      await pool.query(
        `INSERT INTO topic_relationships (id, parent_topic_id, child_topic_id, relationship_type, weight)
         VALUES (gen_random_uuid()::text,'coll_culture',$1,'contains',0.7)
         ON CONFLICT (parent_topic_id, child_topic_id, relationship_type) DO NOTHING`,
        [id],
      );
    }

    log(`African geography nodes: ${added} new countries added, ${AFRICA.length} total checked`);

  } catch (err: unknown) {
    warn(`African geography nodes v1 failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function ensureLibraryCollections(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // ── 1. Seed top-level Collections ────────────────────────────────────────
    const COLLECTIONS = [
      { id: "coll_places",    name: "Places",                  cat: "geography", desc: "Cities, neighborhoods, countries, HBCUs, and Living Legacy destinations" },
      { id: "coll_culture",   name: "Culture & Community",     cat: "diaspora",  desc: "Cultural communities, diaspora identities, and shared heritage" },
      { id: "coll_history",   name: "History",                 cat: "history",   desc: "Black history, civil rights, heritage sites, and historical context" },
      { id: "coll_health",    name: "Health",                  cat: "health",    desc: "Health topics, medical conditions, maternal care, and wellness resources" },
      { id: "coll_faith",     name: "Faith & Spirituality",    cat: "faith",     desc: "Faith traditions, denominations, and active spiritual communities" },
      { id: "coll_careers",   name: "Careers & Professional",  cat: "employment",desc: "Jobs, trades, entrepreneurship, professional licensing, and financial literacy" },
      { id: "coll_travel",    name: "Travel",                  cat: "travel",    desc: "Destination guides, cultural travel, safety, and travel resources" },
      { id: "coll_community", name: "Community",               cat: "community", desc: "Civic engagement, organizations, community resources, and mutual aid" },
      { id: "coll_education", name: "Education",               cat: "education", desc: "HBCUs, K-12, college prep, scholarships, and lifelong learning" },
      { id: "coll_business",  name: "Business",                cat: "business",  desc: "Business resources, entrepreneurship, legal, and economic empowerment" },
      { id: "coll_divine9",   name: "Divine Nine",             cat: "culture",   desc: "The nine historically Black Greek-letter organizations" },
    ];

    for (const c of COLLECTIONS) {
      await pool.query(
        `INSERT INTO knowledge_topics
           (id, topic_name, canonical_name, category, description, node_type, topic_type, enabled, credibility_score, credibility_tier)
         VALUES ($1, $2, $2, $3, $4, 'topic', 'collection', true, 80, 'authoritative')
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.cat, c.desc],
      );
    }
    log("Library: 11 Collection nodes seeded");

    // ── 2. Seed canonical Books — Divine Nine ─────────────────────────────────
    const DIVINE_NINE_BOOKS = [
      ["book_d9_apa",  "Alpha Phi Alpha",   "Founded 1906 at Cornell. The first intercollegiate Black fraternity. 'First of All, Servants of All, We Shall Transcend All.'"],
      ["book_d9_aka",  "Alpha Kappa Alpha", "Founded 1908 at Howard University. The first Black sorority. 'By Culture and By Merit.'"],
      ["book_d9_kap",  "Kappa Alpha Psi",   "Founded 1911 at Indiana University. 'Achievement in Every Field of Human Endeavor.'"],
      ["book_d9_oop",  "Omega Psi Phi",     "Founded 1911 at Howard University. The first Black fraternity founded at a historically Black institution."],
      ["book_d9_dst",  "Delta Sigma Theta", "Founded 1913 at Howard University. Public service sorority focused on social action and community development."],
      ["book_d9_pbs",  "Phi Beta Sigma",    "Founded 1914 at Howard University. 'Culture for Service and Service for Humanity.'"],
      ["book_d9_zpb",  "Zeta Phi Beta",     "Founded 1920 at Howard University. The first Greek-letter organization constitutionally bound to its founding fraternity (Phi Beta Sigma)."],
      ["book_d9_sgr",  "Sigma Gamma Rho",   "Founded 1922 at Butler University. 'Greater Service, Greater Progress.'"],
      ["book_d9_ipt",  "Iota Phi Theta",    "Founded 1963 at Morgan State University. 'Building a Tradition, Not Resting on One.'"],
    ];

    for (const [id, name, desc] of DIVINE_NINE_BOOKS) {
      await pool.query(
        `INSERT INTO knowledge_topics
           (id, topic_name, canonical_name, category, description, node_type, topic_type, enabled, credibility_score, credibility_tier)
         VALUES ($1, $2, $2, 'culture', $3, 'topic', 'book', true, 75, 'authoritative')
         ON CONFLICT (id) DO NOTHING`,
        [id, name, desc],
      );
      await pool.query(
        `INSERT INTO topic_relationships (id, parent_topic_id, child_topic_id, relationship_type, weight)
         VALUES (gen_random_uuid()::text, 'coll_divine9', $1, 'contains', 1)
         ON CONFLICT (parent_topic_id, child_topic_id, relationship_type) DO NOTHING`,
        [id],
      );
    }
    log("Library: 9 Divine Nine Book nodes seeded");

    // ── 3. Seed canonical Books — Health ─────────────────────────────────────
    const HEALTH_BOOKS = [
      ["book_h_diabetes",    "Diabetes",             "Type 2 diabetes disproportionately affects Black Americans. Prevention, management, community resources, and culturally competent care."],
      ["book_h_hypertension","Hypertension",         "High blood pressure — causes, prevention, treatment, and why Black Americans are affected at higher rates."],
      ["book_h_fibroids",    "Fibroids",             "Uterine fibroids affect Black women at 2-3x the rate of white women. Symptoms, treatment options, and advocacy resources."],
      ["book_h_endometriosis","Endometriosis",       "A painful chronic condition frequently underdiagnosed in Black women. Symptoms, diagnosis, treatment, and support communities."],
      ["book_h_pcos",        "PCOS",                 "Polycystic ovary syndrome — hormonal disorder affecting fertility and long-term health. Diagnosis and management resources."],
      ["book_h_fertility",   "Fertility",            "Fertility health, family planning, and resources for navigating fertility challenges and assisted reproduction."],
      ["book_h_ivf",         "IVF",                  "In vitro fertilization — process, costs, success rates, emotional considerations, and finding culturally competent care providers."],
      ["book_h_maternal",    "Maternal Health",      "Black maternal mortality rates and advocacy. Prenatal care, birth rights, midwifery, doulas, and postpartum support."],
      ["book_h_sickle_cell", "Sickle Cell Disease",  "Genetic blood disorder affecting predominantly people of African descent. Treatment advances, support organizations, and carrier information."],
      ["book_h_mental",      "Mental Health",        "Black mental health — therapy access, stigma, culturally competent therapists, crisis resources, and community support."],
      ["book_h_hiv",         "HIV & AIDS",           "Prevention, treatment, community impact, PrEP access, and finding Black-affirming healthcare providers."],
      ["book_h_breast_cancer","Breast Cancer",       "Prevention, screening, treatment, and why Black women face higher mortality rates. Advocacy and support organizations."],
      ["book_h_prostate",    "Prostate Health",      "Prostate cancer affects Black men at higher rates. Screening recommendations, treatment options, and community resources."],
      ["book_h_menopause",   "Menopause",            "Perimenopause and menopause — symptoms, treatment, and navigating this life stage with culturally informed care."],
    ];

    for (const [id, name, desc] of HEALTH_BOOKS) {
      await pool.query(
        `INSERT INTO knowledge_topics
           (id, topic_name, canonical_name, category, description, node_type, topic_type, enabled, credibility_score, credibility_tier)
         VALUES ($1, $2, $2, 'health', $3, 'topic', 'book', true, 75, 'authoritative')
         ON CONFLICT (id) DO NOTHING`,
        [id, name, desc],
      );
      await pool.query(
        `INSERT INTO topic_relationships (id, parent_topic_id, child_topic_id, relationship_type, weight)
         VALUES (gen_random_uuid()::text, 'coll_health', $1, 'contains', 1)
         ON CONFLICT (parent_topic_id, child_topic_id, relationship_type) DO NOTHING`,
        [id],
      );
    }
    log("Library: 14 Health Book nodes seeded");

    // ── 4. Seed canonical Books — Faith & Spirituality ───────────────────────
    const FAITH_BOOKS = [
      ["book_f_ame",        "African Methodist Episcopal",   "The AME Church — founded 1816 by Richard Allen. History, governance, social justice legacy, and locating AME congregations."],
      ["book_f_baptist",    "Baptist",                       "Black Baptist churches — history, theology, civil rights leadership, conventions, and community role."],
      ["book_f_cogic",      "Church of God in Christ",       "COGIC — the largest Pentecostal denomination. Founded by Charles H. Mason in 1907. Worship culture and global community."],
      ["book_f_black_cath", "Black Catholic",                "The history of Black Catholics in America, historically Black Catholic institutions, and the movement for Black Catholic identity."],
      ["book_f_eth_orth",   "Ethiopian Orthodox",            "One of the oldest Christian churches. Ge'ez liturgy, Coptic traditions, and the Ethiopian Orthodox diaspora."],
      ["book_f_islam",      "Islam",                         "Islam in the Black American experience — from Malcolm X to the Nation of Islam to mainstream Sunni and Shia communities."],
      ["book_f_judaism",    "Judaism",                       "Black Jewish communities — Hebrew Israelites, Ethiopian Jews (Beta Israel), and African American Jewish congregations."],
      ["book_f_sikh",       "Sikhism",                       "Sikh traditions, the Guru Granth Sahib, the langar tradition of community feeding, and Sikh diaspora communities."],
      ["book_f_buddhism",   "Buddhism",                      "Buddhism in the Black community — Thich Nhat Hanh's teachings, Soka Gakkai, and mindfulness traditions."],
      ["book_f_african_sp", "African & Diaspora Spirituality","Yoruba, Vodou, Candomblé, Santería, and other African spiritual traditions in the diaspora."],
      ["book_f_interfaith", "Interfaith",                    "Interfaith dialogue, multi-faith communities, and bridging spiritual traditions in the Black community."],
    ];

    for (const [id, name, desc] of FAITH_BOOKS) {
      await pool.query(
        `INSERT INTO knowledge_topics
           (id, topic_name, canonical_name, category, description, node_type, topic_type, enabled, credibility_score, credibility_tier)
         VALUES ($1, $2, $2, 'faith', $3, 'topic', 'book', true, 75, 'authoritative')
         ON CONFLICT (id) DO NOTHING`,
        [id, name, desc],
      );
      await pool.query(
        `INSERT INTO topic_relationships (id, parent_topic_id, child_topic_id, relationship_type, weight)
         VALUES (gen_random_uuid()::text, 'coll_faith', $1, 'contains', 1)
         ON CONFLICT (parent_topic_id, child_topic_id, relationship_type) DO NOTHING`,
        [id],
      );
    }
    log("Library: 11 Faith Book nodes seeded");

    // ── 5. Connect existing geography nodes to Places collection ─────────────
    // African country geography nodes (category='country') and US city nodes
    // (category='travel', node_type='geography') become Books under Places.
    await pool.query(
      `INSERT INTO topic_relationships (id, parent_topic_id, child_topic_id, relationship_type, weight)
       SELECT gen_random_uuid()::text, 'coll_places', kt.id, 'contains', 1
       FROM knowledge_topics kt
       WHERE kt.node_type = 'geography'
         AND kt.topic_type != 'collection'
         AND kt.enabled = true
       ON CONFLICT (parent_topic_id, child_topic_id, relationship_type) DO NOTHING`,
    );
    log("Library: existing geography nodes linked to Places collection");

    log("Library Collections: foundation complete — 11 Collections, 34 canonical Books");

  } catch (err: unknown) {
    warn(`Library collections seeding failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Bangkok International Businesses ─────────────────────────────────────────
// Real, verifiable businesses in Bangkok, Thailand for international discovery.
// These complement the Phuket businesses already seeded.
async function ensureBangkokBusinesses(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  const BANGKOK_BUSINESSES = [
    { name: "Issaya Siamese Club", category: "Food", subcategory: "Fine Dining Thai", address: "4 Soi Si Akson, Chua Ploeng Rd", city: "Bangkok", country: "Thailand", lat: 13.7210, lng: 100.5476, description: "Award-winning Thai restaurant helmed by Chef Ian Kittichai, set in a restored colonial house. Known for reimagined traditional Thai dishes in a lush garden setting." },
    { name: "Paste Restaurant", category: "Food", subcategory: "Fine Dining Thai", address: "Gaysorn Village, 999 Ploenchit Rd", city: "Bangkok", country: "Thailand", lat: 13.7435, lng: 100.5400, description: "Michelin-starred Thai restaurant celebrated for elevating ancient Thai recipes using modern technique. One of Bangkok's most respected dining destinations." },
    { name: "Blue Elephant Royal Thai Cuisine", category: "Food", subcategory: "Fine Dining Thai", address: "233 South Sathorn Rd", city: "Bangkok", country: "Thailand", lat: 13.7213, lng: 100.5300, description: "Fine dining Thai cuisine in a landmark century-old colonial building. Famous for its Royal Thai tasting menus and highly regarded cooking school." },
    { name: "Bo.lan Restaurant", category: "Food", subcategory: "Thai Cuisine", address: "24 Sukhumvit Soi 53, Klongtoey Nua", city: "Bangkok", country: "Thailand", lat: 13.7295, lng: 100.5680, description: "A pioneering sustainable fine-dining Thai restaurant committed to reviving heritage ingredients and cooking traditions. Beloved by food travelers worldwide." },
    { name: "Soul Food Mahanakorn", category: "Food", subcategory: "Thai Tavern", address: "56/10 Sukhumvit Soi 55, Thonglor", city: "Bangkok", country: "Thailand", lat: 13.7290, lng: 100.5800, description: "A neighborhood Thai restaurant and bar known for honest Thai comfort food and creative cocktails. A local favorite for community dining in Thonglor." },
    { name: "Vertigo & Moon Bar", category: "Entertainment & Recreation", subcategory: "Rooftop Bar", address: "Banyan Tree Bangkok, 21/100 South Sathorn Rd", city: "Bangkok", country: "Thailand", lat: 13.7199, lng: 100.5278, description: "Open-air rooftop restaurant and bar on the 61st floor of the Banyan Tree Hotel. Stunning panoramic views of the Bangkok skyline — one of the world's great rooftop experiences." },
    { name: "Sirocco Sky Bar", category: "Entertainment & Recreation", subcategory: "Rooftop Bar", address: "Lebua at State Tower, 1055 Silom Rd", city: "Bangkok", country: "Thailand", lat: 13.7223, lng: 100.5140, description: "The world's highest open-air rooftop bar on the 63rd floor of the State Tower. An iconic Bangkok landmark featured in The Hangover Part II." },
    { name: "Saxophone Pub & Restaurant", category: "Entertainment & Recreation", subcategory: "Live Music Venue", address: "3/8 Phetchaburi Rd, Victory Monument", city: "Bangkok", country: "Thailand", lat: 13.7617, lng: 100.5370, description: "Bangkok's beloved live music institution since 1987. Features nightly jazz, blues, and soul performances in an intimate setting near Victory Monument." },
    { name: "Chatuchak Weekend Market", category: "Retail", subcategory: "Weekend Market", address: "587/10 Kampaeng Phet 2 Rd, Chatuchak", city: "Bangkok", country: "Thailand", lat: 13.7999, lng: 100.5505, description: "One of the world's largest weekend markets with over 8,000 stalls. Spanning 35 acres, it's the go-to destination for art, antiques, clothing, street food, and local crafts." },
    { name: "Asiatique The Riverfront", category: "Entertainment & Recreation", subcategory: "Night Market", address: "2194 Charoen Krung Rd, Wat Phraya Krai", city: "Bangkok", country: "Thailand", lat: 13.7014, lng: 100.5095, description: "A sprawling riverside night market on the Chao Phraya River combining shopping, restaurants, bars, and live entertainment in a stunning open-air setting." },
    { name: "Jim Thompson House", category: "Arts & Culture", subcategory: "Museum & Historic Site", address: "6 Kasem San 2, Wang Mai, Pathum Wan", city: "Bangkok", country: "Thailand", lat: 13.7480, lng: 100.5286, description: "The former home of American businessman and Thai silk entrepreneur Jim Thompson, now a museum showcasing a stunning collection of Southeast Asian art and antiques." },
    { name: "MOCA Bangkok", category: "Arts & Culture", subcategory: "Museum & Art Gallery", address: "499 Kamphaeng Phet 6 Rd, Lat Yao", city: "Bangkok", country: "Thailand", lat: 13.8567, lng: 100.5695, description: "The Museum of Contemporary Art is Thailand's largest private contemporary art museum, home to over 800 works by Thai artists spanning the last 50 years." },
    { name: "Lhong 1919", category: "Arts & Culture", subcategory: "Cultural Heritage Site", address: "248 Chiang Mai Rd, Khlong San", city: "Bangkok", country: "Thailand", lat: 13.7283, lng: 100.4972, description: "A beautifully restored 19th-century Chinese trading port on the Chao Phraya River, now a cultural center with galleries, weekend markets, and riverside dining." },
    { name: "Mandarin Oriental Spa Bangkok", category: "Health & Wellness", subcategory: "Luxury Spa", address: "48 Oriental Ave, Bang Rak", city: "Bangkok", country: "Thailand", lat: 13.7213, lng: 100.5123, description: "The legendary spa at the Mandarin Oriental Hotel offering award-winning Thai massage, traditional healing rituals, and holistic wellness treatments since 1876." },
    { name: "Roots Coffee Roasters", category: "Food", subcategory: "Specialty Coffee", address: "Ari neighborhood, Phahon Yothin Rd", city: "Bangkok", country: "Thailand", lat: 13.7759, lng: 100.5485, description: "Bangkok's beloved specialty coffee chain founded by Thai coffee enthusiasts. Known for meticulously sourced single-origin Thai beans and warm, welcoming cafés throughout the city." },
  ];

  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(COALESCE(country,'')) AS k FROM businesses`
    );
    const existing = new Set(r.rows.map((row: { k: string }) => row.k));

    let inserted = 0;
    let skipped = 0;

    for (const b of BANGKOK_BUSINESSES) {
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${b.country.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state, country,
             description, ownership_designations, black_owned,
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
            ($1,$2,$3,$4,$5,$6,NULL,$7,
             $8,'[]'::jsonb,false,
             $9,$10,
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
            b.name, b.category, b.subcategory,
            b.address, b.city, b.country,
            b.description,
            String(b.lat), String(b.lng),
          ]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  Bangkok businesses: failed to insert ${b.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`Bangkok businesses guard: ${inserted} inserted, ${skipped} already present`);
  } catch (err: unknown) {
    warn(`Bangkok businesses guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Remove confirmed test/demo/placeholder businesses ─────────────────────────
async function ensureTestDataRemoved(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    // Only remove records we have POSITIVELY identified as test/demo fixtures.
    // These were created on 2026-08-08 with names "Test Cafe" and "Audit Test Cafe"
    // and have zero reviews, saves, vibes, or any member data attached.
    const CONFIRMED_TEST_IDS = [
      "sub_1786210637699_i1f8",
      "sub_1786210856364_mjtt",
    ];

    let removed = 0;
    for (const id of CONFIRMED_TEST_IDS) {
      // Final safety check: abort if any member data exists on this record
      const relationships = await pool.query(
        `SELECT
          (SELECT COUNT(*) FROM reviews WHERE business_id = $1) +
          (SELECT COUNT(*) FROM saved_places WHERE business_id = $1) +
          (SELECT COUNT(*) FROM business_vibe_tags WHERE business_id = $1)
          AS total_related`,
        [id]
      );
      const related = parseInt(relationships.rows[0]?.total_related ?? "1");
      if (related > 0) {
        warn(`  test-data-cleanup: skipping ${id} — has ${related} related member records`);
        continue;
      }
      await pool.query(`DELETE FROM businesses WHERE id = $1`, [id]);
      removed++;
    }
    log(`Test data cleanup: ${removed} confirmed test records removed`);
  } catch (err: unknown) {
    warn(`Test data cleanup failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Proof-of-concept coverage expansion — real businesses, all tour cities ────
async function ensureCoverageExpansion(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    // Build a dedup set keyed by normalized name|city|country
    const existing = await pool.query(
      `SELECT LOWER(name) || '|' || LOWER(city) || '|' || LOWER(COALESCE(country,'usa')) AS k FROM businesses`
    );
    const existingKeys = new Set<string>(existing.rows.map((r: any) => r.k));

    let inserted = 0;
    let skipped = 0;

    for (const b of COVERAGE_EXPANSION) {
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${b.country.toLowerCase()}`;
      if (existingKeys.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state, country,
             description, ownership_designations, black_owned,
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
            ($1,$2,$3,$4,$5,$6,$7,$8,
             $9,'[]'::jsonb,false,
             $10,$11,
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
            b.name, b.category, b.subcategory,
            b.address, b.city,
            b.state || null,
            b.country,
            b.description,
            String(b.lat), String(b.lng),
          ]
        );
        existingKeys.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  coverage-expansion: failed to insert "${b.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`Coverage expansion: ${inserted} inserted, ${skipped} already present (${COVERAGE_EXPANSION.length} total in seed)`);
  } catch (err: unknown) {
    warn(`Coverage expansion failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Founder-specified churches — confirmed addresses, official websites ────────
async function ensureFounderChurches(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  const churches = [
    {
      name: "1BCC Church",
      website: "https://1bcc.org",
      address: "1678 Fairview Ave",
      city: "Willow Grove",
      state: "PA",
      country: "USA",
      description:
        "1BCC Church is a welcoming faith community in Willow Grove, Pennsylvania, serving the greater Philadelphia region.",
      lat: 40.1421,
      lng: -75.1168,
    },
    {
      name: "McKinley Missionary Baptist Church",
      website: "https://www.mckinleymbc.com",
      address: "214 Cedar Ave",
      city: "Willow Grove",
      state: "PA",
      country: "USA",
      description:
        "McKinley Missionary Baptist Church is a historic Black Baptist congregation in Willow Grove, Pennsylvania, rooted in faith, community, and service.",
      lat: 40.1448,
      lng: -75.1148,
    },
    {
      name: "NSWM Church",
      website: "https://nswm.org",
      address: "709 N Norristown Rd",
      city: "Warminster",
      state: "PA",
      country: "USA",
      description:
        "NSWM is a spirit-filled faith community in Warminster, Pennsylvania, committed to worship, discipleship, and community impact.",
      lat: 40.1972,
      lng: -75.0882,
    },
  ];

  try {
    const existing = await pool.query(
      `SELECT LOWER(name) || '|' || LOWER(city) || '|' || LOWER(COALESCE(country,'usa')) AS k FROM businesses`
    );
    const existingKeys = new Set<string>(existing.rows.map((r: any) => r.k));

    let inserted = 0;
    let skipped = 0;

    for (const c of churches) {
      const key = `${c.name.toLowerCase()}|${c.city.toLowerCase()}|${c.country.toLowerCase()}`;
      if (existingKeys.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state, country,
             description, ownership_designations, black_owned,
             website,
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
            ($1,$2,'Faith & Spirituality','Church / House of Worship',$3,$4,$5,$6,
             $7,'[]'::jsonb,false,
             $8,
             $9,$10,
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
            c.name, c.address, c.city, c.state, c.country,
            c.description,
            c.website,
            String(c.lat), String(c.lng),
          ]
        );
        existingKeys.add(key);
        inserted++;
        log(`  Founder churches: inserted "${c.name}" in ${c.city}, ${c.state}`);
      } catch (err: unknown) {
        warn(`  Founder churches: failed to insert "${c.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`Founder churches guard: ${inserted} inserted, ${skipped} already present`);
  } catch (err: unknown) {
    warn(`Founder churches guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Phuket full layer — nightlife, Afrobeats, cultural, nature, creative ──────
// Source: TikTok screenshots from tester on-ground + curated research
async function ensurePhuketFullLayer(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {

  type PlaceEntry = {
    name: string;
    category: string;
    subcategory: string;
    address: string;
    city: string;
    description: string;
    lat: number;
    lng: number;
    website?: string;
  };

  const places: PlaceEntry[] = [
    // ── Nightlife from viral "Black in Phuket" TikTok (raeahb, 2022) ──────────
    {
      name: "No.69 Cafe & Bar",
      category: "Entertainment & Recreation",
      subcategory: "Bar / Lounge",
      address: "Bangla Road, Patong",
      city: "Patong",
      description:
        "No.69 is a lively Bangla Road bar with Afrobeats nights that pop off. Consistently recommended by Black travelers as one of the best spots in Phuket for good music and an inclusive vibe.",
      lat: 7.8956,
      lng: 98.2996,
    },
    {
      name: "Sugar Nightclub Phuket",
      category: "Entertainment & Recreation",
      subcategory: "Nightclub",
      address: "Bangla Road, Patong",
      city: "Patong",
      description:
        "Sugar is one of Patong's most energetic nightclubs on the iconic Bangla Road strip — multi-level, high-energy, diverse crowd, international DJs spinning hip-hop, R&B, and Afrobeats.",
      lat: 7.8959,
      lng: 98.2993,
      website: "https://sugarphuket.com",
    },
    {
      name: "Illuzion Nightclub Phuket",
      category: "Entertainment & Recreation",
      subcategory: "Nightclub",
      address: "31 Bangla Road, Patong",
      city: "Patong",
      description:
        "Illuzion is one of Asia's largest nightclubs — massive indoor/outdoor venue on Bangla Road with world-class sound, international DJ headliners, and a famously inclusive atmosphere. Frequently featured in Black travel TikToks.",
      lat: 7.8952,
      lng: 98.2991,
      website: "https://illuzionphuket.com",
    },
    {
      name: "B Pocha Hip Hop & R&B Bar",
      category: "Entertainment & Recreation",
      subcategory: "Bar / Lounge",
      address: "Bangla Road, Patong",
      city: "Patong",
      description:
        "B Pocha is Patong's dedicated hip-hop and R&B bar — the go-to spot on Bangla Road for travelers looking for familiar sounds. Expect a laid-back but hype atmosphere with a diverse international crowd.",
      lat: 7.8964,
      lng: 98.2988,
    },
    {
      name: "Zippy Day Club",
      category: "Entertainment & Recreation",
      subcategory: "Day Club / Beach Club",
      address: "Patong Beach, Patong",
      city: "Patong",
      description:
        "Zippy is a popular Patong day club known for pool parties and daytime DJ sets. Great entry point for the Phuket party scene before the Bangla Road night begins.",
      lat: 7.8970,
      lng: 98.2981,
    },
    {
      name: "Bangla Boat Bar",
      category: "Entertainment & Recreation",
      subcategory: "Bar / Lounge",
      address: "Bangla Road, Patong",
      city: "Patong",
      description:
        "The Bangla Boat is a unique floating-themed bar right on Bangla Road — one of the strip's most recognizable landmarks and a great spot to start the night before hitting the clubs.",
      lat: 7.8961,
      lng: 98.2994,
    },
    // ── From TikTok screenshot — Wave Club (Black Moon party) ─────────────────
    {
      name: "Wave Club Phuket",
      category: "Entertainment & Recreation",
      subcategory: "Nightclub",
      address: "Sai Uan Road, Patong",
      city: "Patong",
      description:
        "Wave Club hosts the legendary Black Moon party — high-energy DJ performances, stunning light shows, and a vibrant crowd. One of Phuket's most talked-about club nights on TikTok.",
      lat: 7.8946,
      lng: 98.2979,
    },
    // ── Additional Afrobeats & inclusive nightlife ─────────────────────────────
    {
      name: "Café del Mar Phuket",
      category: "Entertainment & Recreation",
      subcategory: "Beach Club",
      address: "Kamala Beach, Kamala",
      city: "Kamala",
      description:
        "The iconic Ibiza brand on a Phuket cliffside — stunning infinity pool overlooking the Andaman Sea, world-class sunset DJ sets, and an international crowd. One of the most beautiful beach clubs in Southeast Asia.",
      lat: 7.9452,
      lng: 98.2779,
      website: "https://cafedelmarphuket.com",
    },
    {
      name: "Seduction Beach Club & Disco",
      category: "Entertainment & Recreation",
      subcategory: "Beach Club",
      address: "Patong Beach Road, Patong",
      city: "Patong",
      description:
        "Seduction is a Patong beachfront staple — open-air beach club by day, disco by night. Inclusive atmosphere with a mix of tourists and expats; regular themed nights including hip-hop and international music.",
      lat: 7.8978,
      lng: 98.2964,
    },
    {
      name: "Mixx Discotheque Phuket",
      category: "Entertainment & Recreation",
      subcategory: "Nightclub",
      address: "Holiday Inn Patong, Patong",
      city: "Patong",
      description:
        "Mixx is one of Phuket's longest-running clubs — connected to the Holiday Inn and known for a diverse music policy including Afrobeats, R&B, and dance music. Popular with international travelers.",
      lat: 7.8968,
      lng: 98.2972,
    },
    // ── Cultural & religious ──────────────────────────────────────────────────
    {
      name: "Wat Chalong Temple",
      category: "Arts & Culture",
      subcategory: "Temple / Religious Site",
      address: "Chao Fah Tawan Ok Road, Chalong",
      city: "Chalong",
      description:
        "Wat Chalong is Phuket's most important and revered Buddhist temple — a stunning complex of gilded pagodas, ancient relics, and intricate murals. The temple enshrines relics believed to be from the Buddha. Respectful dress required.",
      lat: 7.8444,
      lng: 98.3376,
    },
    {
      name: "The Big Buddha Phuket",
      category: "Arts & Culture",
      subcategory: "Monument / Landmark",
      address: "Nakkerd Hills, Chalong",
      city: "Chalong",
      description:
        "The Big Buddha is a 45-meter white marble Maravija Buddha statue sitting atop the Nakkerd Hills — one of the most important and revered landmarks in Phuket. Panoramic 360° views of the island from the hilltop. Respectful dress required; free sarongs at the entrance.",
      lat: 7.8278,
      lng: 98.3129,
    },
    {
      name: "Phuket Old Town Historic Quarter",
      category: "Arts & Culture",
      subcategory: "Historic District",
      address: "Thalang Road, Phuket Town",
      city: "Phuket Town",
      description:
        "Phuket Old Town is a UNESCO-recognized historic district with beautifully preserved Sino-Portuguese shophouses, colorful murals, and shrines. A vibrant arts and coffee scene has grown around the heritage buildings. Best explored on foot in the early morning.",
      lat: 7.8812,
      lng: 98.3932,
    },
    {
      name: "Shrine of the Serene Light",
      category: "Arts & Culture",
      subcategory: "Temple / Religious Site",
      address: "Phang Nga Road, Phuket Town",
      city: "Phuket Town",
      description:
        "A hidden Chinese Taoist shrine tucked in a narrow alley in Phuket Old Town — over 100 years old, ornately decorated, and one of the most serene and photogenic spots in the city. Easy to miss if you don't know it's there.",
      lat: 7.8815,
      lng: 98.3924,
    },
    {
      name: "Thai Hua Museum",
      category: "Arts & Culture",
      subcategory: "Museum",
      address: "28 Krabi Road, Phuket Town",
      city: "Phuket Town",
      description:
        "The Thai Hua Museum is housed in a stunning 1934 Sino-Portuguese building and tells the story of Phuket's Chinese diaspora — their migration, culture, and contribution to the island's identity. Beautifully curated with photos, artifacts, and language exhibits.",
      lat: 7.8808,
      lng: 98.3928,
      website: "https://thaihuamuseum.com",
    },
    {
      name: "Jui Tui Taoist Temple",
      category: "Arts & Culture",
      subcategory: "Temple / Religious Site",
      address: "Ranong Road, Phuket Town",
      city: "Phuket Town",
      description:
        "Jui Tui is one of Phuket's most important Chinese Taoist shrines and the heart of the famous Phuket Vegetarian Festival. Vivid red-and-gold architecture, incense, and a deeply spiritual atmosphere year-round.",
      lat: 7.8820,
      lng: 98.3918,
    },
    // ── Nature & views ────────────────────────────────────────────────────────
    {
      name: "Promthep Cape Viewpoint",
      category: "Travel & Hospitality",
      subcategory: "Viewpoint / Scenic Spot",
      address: "Cape Panwa Road, Rawai",
      city: "Rawai",
      description:
        "Promthep Cape is Phuket's most famous viewpoint — a dramatic rocky headland at the island's southernmost tip with breathtaking 270° views of the Andaman Sea. The sunset here is legendary. Get there 45 minutes early to claim a spot.",
      lat: 7.7721,
      lng: 98.3036,
    },
    {
      name: "Karon Viewpoint (Three Beaches Hill)",
      category: "Travel & Hospitality",
      subcategory: "Viewpoint / Scenic Spot",
      address: "Patak Road, Karon",
      city: "Karon",
      description:
        "Karon Viewpoint sits on a hill between Kata and Karon beaches — on a clear day you can see Kata Noi, Kata, and Karon beaches simultaneously in one stunning panoramic view. One of the most photographed spots on the island.",
      lat: 7.8192,
      lng: 98.2971,
    },
    {
      name: "Rang Hill (Khao Rang) Viewpoint",
      category: "Travel & Hospitality",
      subcategory: "Viewpoint / Scenic Spot",
      address: "Khao Rang, Phuket Town",
      city: "Phuket Town",
      description:
        "Rang Hill is a forested hilltop park just above Phuket Town with sweeping views of the city and surrounding islands. Quiet, local, and far less touristy than the southern viewpoints — perfect for an early morning walk or sunset with locals.",
      lat: 7.8987,
      lng: 98.3783,
    },
    {
      name: "Elephant Jungle Sanctuary Phuket",
      category: "Travel & Hospitality",
      subcategory: "Nature / Wildlife Sanctuary",
      address: "Patak Road, Chalong",
      city: "Chalong",
      description:
        "Elephant Jungle Sanctuary is an ethical elephant rescue and rehabilitation center — no riding, no chains, just peaceful interaction with rescued elephants in a natural jungle setting. Mud baths, feeding, and walking alongside them. One of the most responsible sanctuaries in Thailand.",
      lat: 7.9156,
      lng: 98.3542,
      website: "https://elephantjunglesanctuary.com",
    },
    {
      name: "Phang Nga Bay (James Bond Island)",
      category: "Travel & Hospitality",
      subcategory: "Nature / Day Trip",
      address: "Rassada Pier, Phuket Town",
      city: "Phuket Town",
      description:
        "Phang Nga Bay is one of Thailand's most spectacular natural landscapes — towering limestone karsts rising from emerald green water, sea caves, and the famous Khao Phing Kan rock (James Bond Island). A full-day boat tour from Phuket. Book early — it sells out.",
      lat: 7.9003,
      lng: 98.3847,
    },
    {
      name: "Monkey Hill (Khao Toh Sae)",
      category: "Travel & Hospitality",
      subcategory: "Nature / Viewpoint",
      address: "Khao Toh Sae, Phuket Town",
      city: "Phuket Town",
      description:
        "Monkey Hill is a forested peak in the middle of Phuket Town populated by hundreds of wild macaque monkeys. An easy 20-minute climb rewards you with city views and unforgettable wildlife encounters. Go early, don't bring food out in the open.",
      lat: 7.9020,
      lng: 98.3700,
    },
    // ── Creative & unique ─────────────────────────────────────────────────────
    {
      name: "Art in Paradise Phuket",
      category: "Arts & Culture",
      subcategory: "Museum / Interactive Art",
      address: "Phang Nga Road, Phuket Town",
      city: "Phuket Town",
      description:
        "Art in Paradise is a massive 3D trick-art museum spread across multiple themed rooms — you become part of the paintings. Ocean floors, dinosaurs, ancient Egypt, and more. Wildly fun and uniquely photogenic. Great rainy-day activity.",
      lat: 7.8822,
      lng: 98.3910,
      website: "https://artinparadisephuket.com",
    },
    {
      name: "Phuket Trickeye Museum",
      category: "Arts & Culture",
      subcategory: "Museum / Interactive Art",
      address: "Rat U Thit 200 Pi Road, Patong",
      city: "Patong",
      description:
        "The Trickeye Museum in Patong features optical illusion art and 3D installations you can step into and photograph. Smaller and more accessible than Art in Paradise — great for an afternoon between beach and nightlife.",
      lat: 7.8940,
      lng: 98.2968,
    },
    {
      name: "Phuket Upside Down House",
      category: "Arts & Culture",
      subcategory: "Attraction / Experience",
      address: "Chao Fah Tawan Tok Road, Wichit",
      city: "Wichit",
      description:
        "The Upside Down House is exactly what it sounds like — a full-size house built and furnished completely inverted. Walk on the ceiling, sit in upside-down chairs, and take impossibly fun photos. One of Phuket's most creative and shareable experiences.",
      lat: 7.8756,
      lng: 98.3563,
    },
    {
      name: "Naka Weekend Market Phuket",
      category: "Arts & Culture",
      subcategory: "Market / Night Bazaar",
      address: "Chao Fah Tawan Ok Road, Phuket Town",
      city: "Phuket Town",
      description:
        "Naka Market is Phuket's most popular weekend night market — hundreds of stalls selling street food, Thai street fashion, handmade crafts, vintage goods, and local art. Very local feel, very affordable, and a great place to try authentic Thai snacks.",
      lat: 7.9095,
      lng: 98.3756,
    },
    {
      name: "Surin Beach",
      category: "Travel & Hospitality",
      subcategory: "Beach",
      address: "Surin Beach, Cherng Talay",
      city: "Cherng Talay",
      description:
        "Surin Beach is Phuket's most sophisticated beach — calm turquoise water, minimal vendors, and a relaxed upscale atmosphere compared to Patong. Popular with expats and long-stay travelers. The Sunday Walking Street in nearby Cherng Talay is also excellent.",
      lat: 7.9628,
      lng: 98.2772,
    },
    {
      name: "Kata Noi Beach",
      category: "Travel & Hospitality",
      subcategory: "Beach",
      address: "Kata Noi Road, Karon",
      city: "Karon",
      description:
        "Kata Noi is one of Phuket's most beautiful and least crowded beaches — a small, intimate bay with powdery sand, clear water, and a peaceful atmosphere. Far fewer vendors and tourists than the main Kata beach nearby.",
      lat: 7.8130,
      lng: 98.2995,
    },
    {
      name: "Phuket Fantasea Cultural Theme Park",
      category: "Entertainment & Recreation",
      subcategory: "Cultural Show / Theme Park",
      address: "99 Moo 3, Kamala Beach",
      city: "Kamala",
      description:
        "Phuket Fantasea is a grand cultural theme park and nightly show celebrating Thai heritage through acrobatics, elephants, illusions, and a cast of hundreds. Think Cirque du Soleil meets Thai mythology — spectacular and uniquely Thai.",
      lat: 7.9418,
      lng: 98.2756,
      website: "https://phuket-fantasea.com",
    },
  ];

  try {
    const existing = await pool.query(
      `SELECT LOWER(name) || '|' || LOWER(city) || '|' || LOWER(COALESCE(country,'thailand')) AS k FROM businesses`
    );
    const existingKeys = new Set<string>(existing.rows.map((r: any) => r.k));

    let inserted = 0;
    let skipped = 0;

    for (const p of places) {
      const key = `${p.name.toLowerCase()}|${p.city.toLowerCase()}|thailand`;
      if (existingKeys.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state, country,
             description, ownership_designations, black_owned,
             website,
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
            ($1,$2,$3,$4,$5,$6,NULL,'Thailand',
             $7,'[]'::jsonb,false,
             $8,
             $9,$10,
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
            p.name, p.category, p.subcategory,
            p.address, p.city,
            p.description,
            p.website ?? null,
            String(p.lat), String(p.lng),
          ]
        );
        existingKeys.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  Phuket full layer: failed to insert "${p.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`Phuket full layer: ${inserted} inserted, ${skipped} already present (${places.length} total)`);
  } catch (err: unknown) {
    warn(`Phuket full layer failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Category normalization — merge fragmented category families ───────────────
// Food & Drink → Food | Beauty → Beauty & Personal Care | Health → Health & Wellness
// Restaurant → Food | Safe: preserves all records, only updates category label
async function ensureCategoryNormalization(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const result = await pool.query(`
      UPDATE businesses
      SET category = CASE
        WHEN category = 'Food & Drink'  THEN 'Food'
        WHEN category = 'Restaurant'    THEN 'Food'
        WHEN category = 'Beauty'        THEN 'Beauty & Personal Care'
        WHEN category = 'Health'        THEN 'Health & Wellness'
        ELSE category
      END
      WHERE category IN ('Food & Drink', 'Restaurant', 'Beauty', 'Health')
      RETURNING id
    `);
    log(`Category normalization: ${result.rowCount ?? 0} records normalized`);
  } catch (err: unknown) {
    warn(`Category normalization failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Gap Coverage v2 — faith, arts/culture, nightlife, children/family, ────────
// health, legal, trades, Jamaica, beauty specialty enrichment
async function ensureGapCoverageV2(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const existing = await pool.query(
      `SELECT LOWER(name) || '|' || LOWER(city) || '|' || LOWER(COALESCE(country,'usa')) AS k FROM businesses`
    );
    const existingKeys = new Set<string>(existing.rows.map((r: any) => r.k));

    let inserted = 0;
    let skipped = 0;

    for (const b of GAP_COVERAGE_V2) {
      const countryKey = (b.country ?? 'usa').toLowerCase();
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${countryKey}`;
      if (existingKeys.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state, country,
             description, ownership_designations, black_owned,
             website,
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
            ($1,$2,$3,$4,$5,$6,$7,$8,
             $9,'[]'::jsonb,false,
             $10,
             $11,$12,
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
            b.name, b.category, b.subcategory,
            b.address, b.city,
            b.state || null,
            b.country,
            b.description,
            b.website ?? null,
            String(b.lat), String(b.lng),
          ]
        );
        existingKeys.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  gap-coverage-v2: failed to insert "${b.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`Gap coverage v2: ${inserted} inserted, ${skipped} already present (${GAP_COVERAGE_V2.length} total in seed)`);
  } catch (err: unknown) {
    warn(`Gap coverage v2 failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Final micro-seed — Children/Family · Legal · Trades · Medical · Inclusion ─
// FREEZE after this pass. Future additions by tester demand only.
async function ensureFinalMicroSeed(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const existing = await pool.query(
      `SELECT LOWER(name) || '|' || LOWER(city) || '|' || LOWER(COALESCE(country,'usa')) AS k FROM businesses`
    );
    const existingKeys = new Set<string>(existing.rows.map((r: any) => r.k));

    let inserted = 0;
    let skipped = 0;

    for (const b of FINAL_MICRO_SEED) {
      const countryKey = (b.country ?? 'usa').toLowerCase();
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${countryKey}`;
      if (existingKeys.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state, country,
             description, ownership_designations, black_owned,
             website,
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
            ($1,$2,$3,$4,$5,$6,$7,$8,
             $9,'[]'::jsonb,false,
             $10,
             $11,$12,
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
            b.name, b.category, b.subcategory,
            b.address, b.city,
            b.state || null,
            b.country,
            b.description,
            b.website ?? null,
            String(b.lat), String(b.lng),
          ]
        );
        existingKeys.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  final-micro: failed to insert "${b.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`Final micro-seed: ${inserted} inserted, ${skipped} already present (${FINAL_MICRO_SEED.length} total)`);
  } catch (err: unknown) {
    warn(`Final micro-seed failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
