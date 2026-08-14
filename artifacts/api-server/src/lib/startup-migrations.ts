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
import { COVERAGE_EXPANSION, type SeedBiz } from "./seeds/coverage-expansion.js";
import { LAUNDRY_SEED_V1, type LaundrySeedBiz } from "./seeds/laundry-seed-v1.js";
import { MURALS_DIASPORA_V1, type MuralSite } from "./seeds/murals-diaspora-v1.js";
import { MONUMENTS_CULTURAL_V1, type CulturalTourSite } from "./seeds/monuments-cultural-v1.js";
import { FOOD_TRUCKS_V1 } from "./seeds/food-trucks-v1.js";
import { DISPENSARIES_V1 } from "./seeds/dispensaries-v1.js";
import { GAP_COVERAGE_V2 } from "./seeds/gap-coverage-v2.js";
import { FINAL_MICRO_SEED } from "./seeds/final-micro-seed.js";
import { LA_DIASPORA_V1 } from "./seeds/la-diaspora-v1.js";
import { EAST_COAST_DIASPORA_V1 } from "./seeds/east-coast-diaspora-v1.js";
import { SOUTH_DIASPORA_V1 } from "./seeds/south-diaspora-v1.js";
import { MIDWEST_WEST_DIASPORA_V1 } from "./seeds/midwest-west-diaspora-v1.js";
import { PHUKET_INTERNATIONAL_CULTURAL_V1 } from "../data/phuket-international-cultural-v1.js";
import { PHUKET_KNOWLEDGE_TOPICS_V1 } from "./seeds/phuket-knowledge-topics-v1.js";
import { PRIORITY_CULTURAL_V1 } from "../data/priority-cities-cultural-v1.js";
import { SOUTH_CULTURAL_V1 } from "../data/south-cities-cultural-v1.js";
import { PRIORITY_PRACTICAL_V1 } from "./seeds/priority-practical-v1.js";
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
import { COMMUNITY_EVENTS_EXPANSION_SEED } from "../data/community-events-expansion-seed";
import { COMMUNITY_EVENTS_EXPANSION_2_SEED } from "../data/community-events-expansion-2-seed";
import { TOUR_CULTURAL_SITES_SEED } from "../data/tour-cultural-sites-seed";
import { CULTURAL_PHRASES_SEED } from "../data/cultural-phrases-seed";
import { FOUNDER_CURATED_BUSINESSES_SEED } from "../data/founder-curated-businesses-seed";
import { ensureDiasporaFaithSites } from "./ensure-diaspora-faith-sites";
import {
  ensureLibraryEvidenceBatchB,
  ensureLibraryEvidenceBatchC,
  ensureLibraryEvidenceBatchD,
} from "./library-evidence-seed.js";

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
    // Wrapped in DO $$ guard: DROP NOT NULL fails if column is already nullable.
    name: "businesses_state_nullable_v1",
    sql: `DO $$ BEGIN
      IF (SELECT is_nullable FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='state') = 'NO' THEN
        ALTER TABLE businesses ALTER COLUMN state DROP NOT NULL;
      END IF;
    END $$`,
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
    // cultural_sites was originally created via Drizzle schema push on dev only.
    // Railway prod never had it. This CREATE TABLE IF NOT EXISTS creates it on any
    // DB that missed the Drizzle push, then the ALTER TABLE entries below add extra cols.
    name: "create_cultural_sites_table",
    sql: `CREATE TABLE IF NOT EXISTS cultural_sites (
      id                   VARCHAR       PRIMARY KEY DEFAULT gen_random_uuid(),
      name                 VARCHAR(255)  NOT NULL,
      description          TEXT          NOT NULL DEFAULT '',
      category             VARCHAR(100)  NOT NULL DEFAULT 'Heritage',
      heritage_category    VARCHAR(100),
      subcategory          VARCHAR(100),
      ethnic_community     VARCHAR(100),
      cultural_community   VARCHAR(100),
      visit_tip            TEXT,
      content_note         TEXT,
      pin_type             VARCHAR(100),
      listing_status       VARCHAR(50)   DEFAULT 'staged',
      approximate_location BOOLEAN       DEFAULT FALSE,
      city                 VARCHAR(100)  NOT NULL DEFAULT '',
      state                VARCHAR(50)   NOT NULL DEFAULT '',
      address              VARCHAR(255),
      latitude             NUMERIC(10,7),
      longitude            NUMERIC(10,7),
      era                  VARCHAR(100),
      significance         TEXT,
      image_url            VARCHAR(500),
      external_url         VARCHAR(500),
      is_verified          BOOLEAN       NOT NULL DEFAULT true,
      year_established     INTEGER,
      is_accessible        BOOLEAN       DEFAULT false,
      is_family_friendly   BOOLEAN       DEFAULT true,
      admission_free       BOOLEAN       DEFAULT true,
      audio_guide          BOOLEAN       DEFAULT false,
      verified_source      VARCHAR(255),
      country              VARCHAR(100)  DEFAULT 'United States',
      has_pending_edit     BOOLEAN       NOT NULL DEFAULT false,
      founded_year         TEXT,
      status               VARCHAR(50)   DEFAULT 'live_unclaimed',
      source               TEXT,
      is_featured          BOOLEAN       DEFAULT false,
      created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )`,
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
    // Wrapped in DO $$ guard: DROP NOT NULL fails if columns are already nullable.
    name: "cultural_sites_lat_lng_nullable",
    sql: `DO $$ BEGIN
      IF (SELECT is_nullable FROM information_schema.columns
          WHERE table_schema='public' AND table_name='cultural_sites' AND column_name='latitude') = 'NO' THEN
        ALTER TABLE cultural_sites ALTER COLUMN latitude DROP NOT NULL;
      END IF;
      IF (SELECT is_nullable FROM information_schema.columns
          WHERE table_schema='public' AND table_name='cultural_sites' AND column_name='longitude') = 'NO' THEN
        ALTER TABLE cultural_sites ALTER COLUMN longitude DROP NOT NULL;
      END IF;
    END $$`,
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
    // Demo businesses removed — replaced with real diaspora community listings.
    // This migration is kept as a no-op so the name stays tracked and the block
    // is never re-executed with the old INSERT logic on older Railway instances.
    name: "demo_businesses_philly_seed_v2",
    sql: `SELECT 1 -- demo businesses retired; real listings loaded via runEveryBoot diaspora seeds`,
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
      state TEXT NOT NULL DEFAULT '',
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
      state TEXT NOT NULL DEFAULT '',
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
      state TEXT NOT NULL DEFAULT '',
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
    // Widen state column so international sites (e.g. "Phuket Province") fit.
    // Wrapped in DO $$ guard: ALTER COLUMN TYPE TEXT fails if column is already TEXT.
    name: "tour_cultural_sites_state_text_v1",
    sql: `DO $$ BEGIN
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='tour_cultural_sites' AND column_name='state') != 'text' THEN
        ALTER TABLE tour_cultural_sites ALTER COLUMN state TYPE TEXT USING state::text;
      END IF;
    END $$`,
  },
  {
    // Hardcoded coordinates for all 20 international diaspora sites seeded from
    // phuket-international-cultural-v1.ts — Nominatim fails on many of these
    // addresses. WHERE latitude IS NULL makes this idempotent.
    name: "intl_diaspora_sites_coords_v1",
    sql: `
      UPDATE tour_cultural_sites AS t
      SET latitude = c.lat, longitude = c.lng
      FROM (VALUES
        ('elmina castle',                                                                        5.0845,   -1.3504),
        ('maison des esclaves (house of slaves) — gorée island',                               14.6686,  -17.3997),
        ('robben island',                                                                      -33.8072,  18.3679),
        ('bob marley museum',                                                                   17.9926,  -76.7837),
        ('marcus garvey birthplace and monument',                                               18.4337,  -77.2027),
        ('soweto — vilakazi street and the hector pieterson museum',                           -26.2498,  27.8537),
        ('bois caïman — birthplace of the haitian revolution',                                  19.6450,  -72.1780),
        ('alhambra palace — monument to african islamic civilization in europe',                37.1760,   -3.5880),
        ('siddis of india — african descendants in gujarat and karnataka',                      21.1500,   70.7500),
        ('great zimbabwe — the ancient african city that embarrassed colonialism',             -20.2671,   30.9332),
        ('timbuktu — city of 700,000 manuscripts and the university of sankore',               16.7714,   -3.0079),
        ('angkor wat and the khmer empire heritage',                                            13.4125,  103.8670),
        ('chichen itza — maya astronomical city',                                               20.6843,  -88.5678),
        ('zócalo (constitution square) — built on tenochtitlan',                               19.4326,  -99.1332),
        ('machu picchu — inca city in the clouds',                                             -13.1631,  -72.5449),
        ('zeitz mocaa — museum of contemporary art africa, cape town',                        -33.9041,   18.4213),
        ('alhambra''s broader context — the north african church fathers and early christianity',37.1760,  -3.5880),
        ('toussaint l''ouverture memorial — place du champ de mars, port-au-prince',           18.5432,  -72.3395),
        ('cape coast castle',                                                                    5.1042,   -1.2476),
        ('medina of fez — the world''s oldest living university city',                         34.0643,   -5.0073)
      ) AS c(name_lower, lat, lng)
      WHERE LOWER(t.name) = c.name_lower
        AND t.latitude IS NULL
    `,
  },
  {
    name: "phuket_cultural_sites_coords_v1",
    sql: `
      UPDATE tour_cultural_sites AS t
      SET latitude = c.lat, longitude = c.lng
      FROM (VALUES
        ('wat chalong (wat chaiyathararam)',                                                    7.8446,  98.3378),
        ('big buddha (phra puttamingmongkol akenakkiri)',                                       7.8274,  98.3106),
        ('heroines monument — chan and mook (thao thepkrasattri and thao srisoonthorn)',        8.0159,  98.3016),
        ('old phuket town (sino-portuguese heritage district)',                                 7.8889,  98.3975),
        ('jui tui shrine (shrine of the serene light)',                                         7.8884,  98.3930),
        ('thalang national museum',                                                             8.0153,  98.3125),
        ('urak lawoi (sea gypsy) village — ban rawai',                                         7.7770,  98.3249),
        ('phuket vegetarian festival — jui tui shrine & nine emperor gods procession',         7.8884,  98.3930),
        ('chinpracha house',                                                                    7.8891,  98.3944),
        ('kathu mining museum and the tin mining heritage district',                            7.9166,  98.3218),
        ('koh panyee — floating muslim village, phang nga bay',                                8.2735,  98.5009),
        ('promthep cape and the andaman sea trade route outlook',                              7.7618,  98.3051),
        ('phuket''s malay muslim heritage — chao fa west and karon mosque',                   7.8468,  98.2990),
        ('2004 tsunami memorial — ban nam khem and phuket international memorial',             9.1430,  98.2560),
        ('khao phra thaeo national park — last virgin rainforest on phuket',                   8.0739,  98.3627),
        ('wat phra thong — the half-buried golden buddha',                                     8.0283,  98.3145),
        ('srivijayan empire heritage — the maritime kingdom that built the andaman world',     8.0153,  98.3125),
        ('phuket''s connection to british colonial penang — the straits chinese network',      7.8889,  98.3975),
        ('phuket rubber plantation heritage — early 20th-century agricultural revolution',     8.0000,  98.3300),
        ('andaman sea coral reefs and marine biodiversity — the extraordinary underwater world',7.8206,  98.3424),
        ('moken people''s astronomical and tidal knowledge — indigenous navigation science',   7.7770,  98.3249),
        ('phuket''s islamic sultanate connections — the malay peninsula maritime world',       7.8870,  98.3920),
        ('environmental justice frontlines — phuket''s conservation and development conflicts',7.8800,  98.3900),
        ('karon and kata beaches — remaining fishing village culture',                         7.8468,  98.2990),
        ('patong beach — from coconut plantation to black travel culture',                     7.8968,  98.2968)
      ) AS c(name_lower, lat, lng)
      WHERE LOWER(t.name) = c.name_lower
        AND t.latitude IS NULL
    `,
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
    // Jamaica country-level and city-level context for KinfolkAI (#183).
    // Users often say "Jamaica" (country) not just "Negril" or "Montego Bay."
    name: "city_profiles_jamaica_v1",
    sql: `INSERT INTO city_profiles (city_slug, city_name, brief_context, historical_context)
VALUES
  ('jamaica','Jamaica','Jamaica — birthplace of reggae, dancehall, Rastafari, and one of the most visited Caribbean islands by the African diaspora — is a place of profound cultural homecoming for Black American travelers.','Jamaica is an island nation in the Caribbean Sea, approximately 90 miles south of Cuba and 100 miles west of Haiti. The island is the third-largest in the Caribbean (after Cuba and Hispaniola). Kingston, the capital and largest city, sits on a natural harbor on the southeastern coast and is the cultural and political heart of the island. Montego Bay (MoBay), on the northwest coast, is the tourist gateway with the island''s busiest international airport (Sangster International). Ocho Rios (Ochi), on the north coast, is known for waterfalls (Dunn''s River Falls), dolphin attractions, and cruise ship activity. Negril, on the western tip, is the laid-back beach capital. Jamaica has had enormous cultural influence on the world far beyond its size: Bob Marley, Marcus Garvey (father of Pan-Africanism), Louise Bennett-Coverley (Miss Lou), and the entire global reggae and dancehall movements all emerged here. The Rastafari movement, centered in the Ethiopian Orthodox tradition and Haile Selassie''s legacy, originates in Jamaica. For Black American travelers, Jamaica carries deep resonance as a majority-Black nation that achieved independence in 1962 and whose culture has shaped everything from music to food to language. Key experiences: Blue Mountains coffee tour (Kingston area), Dunn''s River Falls (Ocho Rios), Seven Mile Beach (Negril), Rick''s Cafe cliff diving (Negril), Bob Marley Museum (Kingston), Rose Hall Great House (Montego Bay). Local food: jerk chicken and pork (best from roadside jerk pans), ackee and saltfish (national dish), curry goat, oxtail, festival (fried dough), bammy (cassava flatbread), fresh coconut water, Blue Mountain coffee, Red Stripe and Dragon Stout. Language: English is the official language; Jamaican Patois (Patwa) is widely spoken — "wah gwaan" (what''s going on), "irie" (everything is good), "bless up" (take care). Safety context: Exercise general awareness in Kingston''s inner-city communities; resort areas and tourist corridors are well-patrolled. Jamaica Constabulary Force''s Tourist Patrol Division monitors beach and resort areas. Currency: Jamaican Dollar (JMD); USD widely accepted in tourist areas (1 USD ≈ 155 JMD). Best time: December–April (dry season). Hurricane season: June–November.'),
  ('montego-bay','Montego Bay, Jamaica','Montego Bay — Jamaica''s second city and tourist gateway — is where most Black American travelers land, with Hip Strip beach clubs, Rose Hall''s complex history, and a direct window into Jamaican everyday life just minutes from the resort strip.','Montego Bay (affectionately called MoBay) is the capital of St. James Parish on Jamaica''s northwest coast. Sangster International Airport is the busiest in the Caribbean by passenger volume and receives direct flights from dozens of North American and European cities. The Hip Strip (Gloucester Avenue) is the tourist corridor — running parallel to Doctor''s Cave Beach and lined with restaurants, craft markets, and beach clubs. Doctor''s Cave Beach, with its crystal-clear water and fine white sand, is the social center of Montego Bay beach life. Rose Hall Great House, a restored Georgian plantation house perched on a hill outside the city, is one of Jamaica''s most visited historic sites — the legend of the "White Witch of Rose Hall" (Annie Palmer) obscures a far more important story: the enslaved people who built and worked the plantation and whose descendants still live in the surrounding communities. Falmouth, 40 minutes east, is an exceptionally well-preserved Georgian town built almost entirely during the peak of the sugar and slavery era — the most complete Georgian town in the Western Hemisphere and a UNESCO World Heritage Site candidate. AYS (Are You Serious) Beach Club and Pier One are popular gathering spots for the Black travel community. Best time: December–April.'),
  ('ocho-rios','Ocho Rios, Jamaica','Ocho Rios is Jamaica''s activity capital on the north coast — Dunn''s River Falls, river tubing, Blue Hole, and the closest city to the reggae heritage sites of the St. Ann parish where Bob Marley was born.','Ocho Rios (Ochi) is located in St. Ann Parish on Jamaica''s north coast, approximately 67 miles east of Montego Bay and 54 miles north of Kingston. The city is heavily visited by cruise ships (Royal Caribbean operates a major terminal here) but has a genuine local community. Dunn''s River Falls — a terraced limestone waterfall that visitors can climb in chains of strangers holding hands — is one of Jamaica''s most iconic experiences. Blue Hole (the Secret Falls) offers a more intimate, jungle waterfall experience with rope swings and natural pools. The Mystic Mountain attraction offers bobsled rides and zip lines above the rainforest canopy. Nine Mile, Bob Marley''s birthplace in the hills of St. Ann, is a pilgrimage site for reggae lovers about 40 minutes from Ocho Rios. The town of Ocho Rios itself has a craft market (arguably the most aggressive vendor environment in Jamaica — know your prices and be firm), the Soni''s Plaza shopping area, and a strip of local jerk spots that surpass anything in the tourist zone. Coyaba River Garden, Dolphin Cove, and the Prospect Plantation offer additional nature and cultural experiences.')
ON CONFLICT (city_slug) DO NOTHING`,
  },
  {
    // Barbados and Bahamas — two of the most-visited Caribbean nations by Black travelers.
    name: "city_profiles_caribbean_v1",
    sql: `INSERT INTO city_profiles (city_slug, city_name, brief_context, historical_context)
VALUES
  ('barbados','Barbados','Barbados — Bim — is one of the most culturally distinct islands in the Caribbean, birthplace of Rihanna and the Crop Over festival, with a sophisticated food and rum culture and a majority-Black population that has built one of the Caribbean''s most stable, prosperous societies.','Barbados is a sovereign island nation located in the western Atlantic Ocean, east of the Caribbean Sea and just north of Trinidad and Tobago. It became a republic in 2021 (while remaining in the Commonwealth), with Dame Sandra Mason as its first President. The island''s majority-Black population is the descendants of enslaved Africans brought to work the British sugar plantations — a history that is deeply integrated into Barbadian identity and commemorated at sites including the Barbados Museum, St. Nicholas Abbey (a working plantation-turned-museum), and the Human Cannons memorial at Carlisle Bay. Bridgetown, the capital, includes the historic Garrison (UNESCO World Heritage Site) and the Chamberlain Bridge over the Careenage. Barbados has one of the highest literacy rates in the world and a per-capita income that significantly exceeds most Caribbean nations. Mount Gay Rum Distillery (est. 1703 — the world''s oldest rum brand) offers tours. The Oistins Fish Fry (Friday night) is the island''s most beloved community gathering — open-air grills, flying fish, Banks beer, and soca. Holetown (St. James) and Speightstown are the west coast resort and dining corridors. Rockley (Christ Church) and Worthing Beach on the south coast are popular and less expensive than the west. Crop Over Festival (July–August) is one of the Caribbean''s great cultural celebrations, culminating in Kadooment Day with costumed bands, music, and street parade. Rihanna (born Robyn Rihanna Fenty) is a national hero of Barbados — literally. Flight connections: direct from New York (JFK, EWR), Miami, Toronto, London.'),
  ('bahamas','Nassau, Bahamas','Nassau and Paradise Island sit at the heart of a 700-island archipelago — the Bahamas is the closest tropical Caribbean escape from the US East Coast, home to Atlantis, swimming pigs, the Junkanoo cultural tradition, and a historically proud Bahamian Black majority.','Nassau is the capital of the Commonwealth of The Bahamas, located on New Providence Island. The city is divided between downtown Nassau (the historic commercial and government center) and Cable Beach (the hotel and resort strip), with the ultra-resort Paradise Island (connected by bridge) home to the Atlantis resort. The Bahamas gained independence from Britain in 1973, and its majority-Black population (90%+) has built a stable parliamentary democracy. Junkanoo — the Bahamas'' most significant cultural festival — takes place on Boxing Day (December 26) and New Year''s Day with elaborate costumed processions, goombay drums, cowbells, and brass through downtown Nassau. The Junkanoo Museum in downtown Nassau tells the history of this African-derived masquerade tradition. Nassau''s historic district includes the Straw Market (craft vendors), Government House (painted pink, official residence), the British Colonial Hotel (historic landmark), and the Queen''s Staircase (65 steps carved by enslaved people from limestone). Exuma — the Out Islands chain about 90 miles from Nassau — is famous for the swimming pigs of Big Major Cay, swimming with nurse sharks at Compass Cay, and some of the most pristine water in the world. Day trips from Nassau to Exuma are popular (35-minute flight or water taxi). Cable Beach''s Baha Mar resort complex includes multiple hotels, a casino, and beach club. Currency: Bahamian Dollar (pegged 1:1 to USD). Water taxis to Paradise Island run from downtown Nassau.')
ON CONFLICT (city_slug) DO NOTHING`,
  },
  {
    // Deep cultural enrichment for all 20 priority test cities.
    // Upgrades brief_context AND historical_context unconditionally (no WHERE guard)
    // so this is the authoritative version — update this entry to improve any city.
    // The brief_context is the warm first-visit welcome moment shown to the member.
    // The historical_context is the full cultural layer injected into KinfolkAI.
    name: "city_profiles_priority_cities_deep_v1",
    sql: `INSERT INTO city_profiles (city_slug, city_name, brief_context, historical_context)
VALUES
  ('philadelphia','Philadelphia',
   'Black Philadelphians wrote the first chapter of Black freedom in America — the Free African Society (1787), Mother Bethel A.M.E. (1794), and an Underground Railroad network that made this city a destination, not just a stop.',
   'Philadelphia is the oldest city of the Black freedom tradition in America. The Free African Society, founded in 1787 by Richard Allen and Absalom Jones, was the first independent Black civic organization in the Western Hemisphere. Mother Bethel A.M.E. Church — founded 1794, still standing at 6th and Lombard — is the oldest parcel of land continuously owned by Black Americans anywhere in the country. The city was a primary terminus of the Underground Railroad, with activist David Ruggles, William Still (who documented hundreds of freedom seekers), and a network of Black Philadelphia families providing shelter. The Please Touch Museum in Fairmount Park and the African American Museum in Philadelphia (AAMP) are anchor cultural institutions. The Mural Arts Program has produced over 4,000 murals, many celebrating Black Philadelphia history. Key neighborhoods: West Philadelphia (vibrant, historically middle-class Black community anchored by Clark Park and Baltimore Avenue); North Philadelphia (deeply rooted, home to community murals, Germantown, and the historic Nicetown corridor); South Philadelphia (historically Italian but with deep Black roots along South Street). Philly has one of the most vibrant Black restaurant scenes on the East Coast — from soul food at Delilah''s to fine dining at Cadence. The city''s West African, Caribbean (particularly Jamaican and Trinidadian), and Afro-Latino communities add depth to every neighborhood. Temple University and Cheyney University (Pennsylvania''s HBCU, 1837 — the nation''s oldest HBCU) anchor the academic tradition. The city''s jazz tradition (John Coltrane, McCoy Tyner, Patti LaBelle all claimed Philly) lives on in venues like Chris'' Jazz Cafe.'),

  ('washington-dc','Washington DC',
   'DC has always had two cities — the one on the monuments and the one that built everything behind them. The second city has always been Black, and it has always been extraordinary.',
   'Washington DC''s Black community is one of the oldest and most accomplished in American history. The U Street corridor — nicknamed "Black Broadway" in the early 20th century — hosted Duke Ellington (born two blocks away at 1212 T Street NW), Cab Calloway, Billie Holiday, and Louis Armstrong in clubs and theaters that operated parallel to segregated downtown DC. Howard University (1867) is one of the most celebrated HBCUs in the world, the alma mater of Thurgood Marshall, Toni Morrison, Kamala Harris, Chadwick Boseman, and hundreds of civil rights leaders. The Ben''s Chili Bowl on U Street (1958) is one of the most iconic Black-owned businesses in America — a cultural landmark that served as a gathering point during the 1968 uprising and never closed. The Anacostia neighborhood on the eastern bank of the Anacostia River is one of the oldest continuously Black neighborhoods in DC, home to the Anacostia Community Museum (the first Smithsonian museum in a historically Black neighborhood) and the Frederick Douglass National Historic Site (Cedar Hill). The Shaw neighborhood, once the heart of DC''s Black middle class, is undergoing intense gentrification but maintains cultural anchors including the African American Civil War Memorial and Museum. DC is home to the largest Ethiopian diaspora community in the United States — the Adams Morgan, U Street, and Columbia Heights neighborhoods have become "Little Ethiopia," with the highest concentration of Ethiopian restaurants outside Addis Ababa. The city''s Caribbean community (particularly Jamaican and Trinidadian) is centered in Ward 8 and Prince George''s County across the Maryland border. Georgetown was built on the labor of enslaved people whose descendants fought to have that history acknowledged — a reckoning that is still ongoing.'),

  ('phuket','Phuket, Thailand',
   'Phuket is where members of the diaspora come to exhale — turquoise water, genuine Thai hospitality, and a Black travel community that has made this island their own in the last decade.',
   'Phuket is Thailand''s largest island, located in the Andaman Sea off the western coast of the Thai-Malay Peninsula. The island has a multicultural history shaped by Chinese, Malay, and Thai communities — visible in the Sino-Portuguese shophouse architecture of Phuket Old Town and the Hokkien-influenced shrines throughout the city. For travelers of the African diaspora, Phuket has become a global bucket-list destination — accessible from the US via a one-stop connection through Seoul, Tokyo, or Dubai. The beach geography divides the island into dramatically different zones: Patong (the most commercial, with Walking Street nightlife, beach clubs, and international restaurants); Kata and Karon (family-oriented, quieter); Kamala (upscale, home to beach clubs like Bliss and Café del Mar); Surin (luxury resorts and chill vibes); and Rawai (working fishing village, local restaurants, affordable stays). The night markets are essential: Lard Yai (Sunday Walking Street in Old Town) is the largest, operating every Sunday evening with local food, crafts, and live music; Naka Market (Saturday); Chillva Market (Thursday–Sunday, great for younger crowd). Thai food context: pad thai is the tourist staple, but pad see ew, khao pad (fried rice), laab, som tam (papaya salad), and fresh seafood from the day boats are what locals eat. Spice levels are real — "mai pet" means "not spicy." The island''s wellness culture includes world-class Thai massage (Wat Po tradition) and detox/yoga retreats at places like SHA Plus-certified spas. Beach clubs that have drawn Black travelers: YONA Beach Club (Karon), Catch Beach Club (Surin), Café del Mar (Kamala). Key experiences: longtail boat to James Bond Island (Phang Nga Bay), island-hopping to Phi Phi (Ton Sai Bay), Elephant Jungle Sanctuary (ethical, no riding), Old Town exploration. Practical: tuk-tuks are negotiable; Grab (ride share) is more reliable; SIM card at the airport; baht is the currency (1 USD ≈ 35 THB). The Thai concept of "sanuk" — finding joy in everything — is the local operating system.'),

  ('columbia','Columbia',
   'Two of the South''s most respected HBCUs — Allen University and Benedict College — sit blocks apart in Columbia, and the civil rights movement''s student generation was forged on these streets.',
   'Columbia, South Carolina has been a cornerstone of African American higher education since Reconstruction. Allen University (1870, A.M.E. Church) and Benedict College (1870, Baptist) both stand in the historically Black Waverly neighborhood, making Columbia one of the only cities in America with two HBCUs within walking distance of each other. The Waverly Historic District itself is a model of post-Civil War Black professional and community life — developed by educators, ministers, and businesspeople who built a self-sufficient community adjacent to the university campuses. The city was a site of early civil rights action: the Orangeburg Massacre (1968, nearby Orangeburg) was one of the first instances of law enforcement killing student protesters in American history, predating Kent State by two years. Columbia''s Bull Street corridor and the Vista neighborhood are centers of nightlife and culture. The international community adds significant texture: the city''s "International Corridor" along Decker Boulevard hosts Caribbean, Ethiopian, Filipino, Brazilian, and Vietnamese restaurants and businesses that reflect Columbia''s growing immigrant population. Fort Jackson, the largest US Army training base, brings a constantly rotating multicultural population. The South Carolina State Museum tells the full arc of the state''s history including its African American chapters. Key community touchpoints: Mt. Pilgrim Baptist Church, the Modjeska Monteith Simkins House (civil rights leader), and the Mann-Simons Site (a formerly enslaved woman''s home that became a community institution for 80+ years).'),

  ('charlotte','Charlotte',
   'Queen City has become one of the fastest-growing hubs for Black wealth in the South — Johnson C. Smith University has been anchoring that tradition since 1867, and the community that built Second Ward hasn''t forgotten what was taken.',
   'Charlotte''s Second Ward — known as "Brooklyn" — was one of the South''s most self-sufficient Black neighborhoods before it was demolished for urban renewal between 1960 and 1972. At its peak, Brooklyn housed 1,000 Black-owned businesses, churches, schools, and community organizations on less than one square mile. The Harvey B. Gantt Center for African-American Arts + Culture (named for Charlotte''s first Black mayor) preserves this history and serves as the cultural anchor for the contemporary Black arts community. Johnson C. Smith University (1867), a historically Black university in the Beatties Ford Road corridor, has anchored Black intellectual life in Charlotte for over 150 years. Today Charlotte is home to one of the fastest-growing Black professional populations in the country, driven by the banking and finance sector (Bank of America and Wells Fargo both headquartered here), healthcare, and tech. The University City area has a large South Asian and international tech community; the west side has one of the most vibrant Hispanic populations in the Carolinas — particularly the Salud neighborhood. The NoDa arts district and South End have vibrant nightlife and food scenes with growing Black-owned restaurant presence. Key community institutions: Friendship Missionary Baptist Church (historic civil rights congregation), the Black Political Caucus of Charlotte-Mecklenburg, and the East Side neighborhoods of Grier Heights and Druid Hills which remained Black through the gentrification pressure that displaced other communities.'),

  ('raleigh','Raleigh',
   'North Carolina''s capital sits in the middle of one of the most significant HBCU corridors in America — Shaw, St. Augustine''s, and NC Central are all within 30 minutes of each other, and the community they built is still thriving.',
   'Raleigh is the center of the Research Triangle region along with Durham and Chapel Hill — and its relationship to the adjacent Black communities of Durham makes the two cities inseparable in their cultural story. Shaw University (1865), located in downtown Raleigh, was founded by Henry Martin Tupper and is the oldest HBCU in the South; it was also the birthplace of the Student Nonviolent Coordinating Committee (SNCC), founded at Shaw in 1960 during the sit-in movement. St. Augustine''s University (1867), also in Raleigh, is an HBCU founded by the Episcopal Church. The Idlewild neighborhood on the South Side was historically Raleigh''s center of Black residential and commercial life. Raleigh''s Black community has grown significantly with the Research Triangle''s tech and pharmaceutical boom — Black professionals from across the country have relocated here, making it one of the top-10 metros for Black in-migration in the 2010s. The city''s food scene has a growing Black-owned restaurant corridor in the East and Southeast. Nearby Durham — 30 minutes west — is where the deepest Black institutional history lives: North Carolina Central University (HBCU), Hayti Heritage Center, the Stagville Plantation (the largest enslaved community in antebellum NC), and the Black Wall Street corridor on Parrish Street. Raleigh and Durham together represent one of the most dynamic Black middle-class and intellectual communities in the contemporary South.'),

  ('richmond','Richmond',
   'Virginia''s former Confederate capital was built on Black labor — and Jackson Ward, once called the Harlem of the South, is proof that the community which built this city also built something beautiful for itself.',
   'Richmond carries more contradictions per square mile than almost any city in America. It was the capital of the Confederacy, built almost entirely by enslaved Black labor — and it is also home to Jackson Ward, one of the wealthiest and most culturally vibrant Black communities in American history, known as "the Harlem of the South" and "the Wall Street of Black America" in the late 19th and early 20th centuries. Maggie Lena Walker, born in Richmond, became the first Black woman to charter and serve as president of a bank in the United States (St. Luke Penny Savings Bank, 1903) — her home is now a National Historic Site on Leigh Street. Bill "Bojangles" Robinson — the legendary tap dancer — was born in Richmond''s Jackson Ward. Shockoe Bottom, a neighborhood near the James River, was the second-largest slave-trading center in the United States — a fact the city is still actively grappling with through the Shockoe Bottom Slavery Heritage Site effort. The Virginia Museum of History & Culture and the Black History Museum and Cultural Center of Virginia both tell important chapters of this story. Virginia Union University (1865), an HBCU in the Barton Heights neighborhood, has anchored Black higher education. Today Richmond''s Scott''s Addition, Church Hill, and Manchester neighborhoods have a vibrant arts and food scene with growing Black-owned businesses. The city''s Ethiopian community is centered in the Willow Lawn area of Henrico County, while a growing Guatemalan and Salvadoran population has settled in South Richmond.'),

  ('birmingham','Birmingham',
   'They called it Bombingham — and the community that organized in the face of state terror in 1963 didn''t just survive, it changed the world. Come and understand what courage actually looks like.',
   'Birmingham was the primary battlefield of the 1963 Civil Rights Campaign, where demonstrators — many of them children as young as 6 — faced fire hoses and police dogs in Kelly Ingram Park. Images broadcast globally accelerated the Civil Rights Act of 1964. On September 15, 1963, a KKK bomb destroyed the 16th Street Baptist Church during Sunday school, killing four young girls: Addie Mae Collins, Cynthia Wesley, Carole Robertson, and Carol Denise McNair. The church, restored to its 1963 appearance, remains an active congregation and a sacred site. The Birmingham Civil Rights Institute (BCRI) is one of the most comprehensive civil rights museums in the world, located across the street from Kelly Ingram Park. The 4th Avenue Business District — once called "Little Harlem of the South" — was Birmingham''s Black commercial and cultural corridor during segregation, home to jazz clubs, Black-owned hotels, and fraternal organizations. Miles College (1898), an HBCU in Fairfield, and the Birmingham campus of Alabama A&M are anchor institutions. The city''s Black community has faced severe economic challenges since the decline of the steel industry, but a cultural renaissance centered in the Woodlawn and Avondale neighborhoods — with community-led food halls, art galleries, and events — reflects extraordinary resilience. The Sloss Furnaces National Historic Landmark tells the story of the convict leasing system in which Black men were forced to work in brutal industrial conditions. Birmingham''s growing Latino community, primarily from Mexico and Central America, is centered in the Gardendale and Bessemer areas.'),

  ('atlanta','Atlanta',
   'They called it the Black Mecca for a reason — and with Spelman, Morehouse, Clark Atlanta, and the birthplace of Dr. King all in the same city, the receipts are there for anyone who wants to look.',
   'Atlanta is the undisputed capital of Black American culture, business, and political power in the contemporary era. The Atlanta University Center Consortium — the largest historically Black college consortium in the world — includes Spelman College, Morehouse College, Clark Atlanta University, Morehouse School of Medicine, and Morris Brown College, all within walking distance of each other in the West End/Vine City area. Dr. Martin Luther King Jr. was born at 501 Auburn Avenue NE on January 15, 1929; his birth home, the Ebenezer Baptist Church (where he and his father both preached), and the MLK National Historical Park are all within two blocks of each other on "Sweet Auburn." Sweet Auburn Avenue was dubbed "the richest Negro street in the world" by Fortune Magazine in 1956, anchored by Citizens Trust Company (still Black-owned), the Royal Peacock club (where James Brown, Little Richard, and Aretha Franklin all performed), and dozens of Black professional offices. The National Center for Civil and Human Rights (in downtown Atlanta, adjacent to the World of Coca-Cola) has a powerful interactive exhibition including the lunch counter sit-in simulation. Key contemporary Black Atlanta neighborhoods: West End (cultural anchor, home to the AUCC and growing Black restaurant scene including Slutty Vegan''s flagship); Vine City (where Dr. King lived as an adult); Old Fourth Ward (gentrifying, mixed, home to Ponce City Market); East Point and College Park (Black middle-class suburbs with strong community identity). The Bluff (English Avenue) tells the harder economic story. Atlanta''s Nigerian community is one of the largest in the Southeast; the city also has significant Ghanaian, West Indian, and Brazilian populations in Chamblee/Doraville (DeKalb County).'),

  ('new-orleans','New Orleans',
   'New Orleans is where West African drumming, Caribbean rhythm, French cuisine, and Indigenous land converged over 300 years and created something the world has been trying to copy ever since. Congo Square is where it started.',
   'New Orleans is the most culturally layered city in America, and most of those layers are Black. Congo Square — now Louis Armstrong Park in the Tremé — is the spiritual birthplace of jazz: the only place in the antebellum South where enslaved Africans were permitted to gather, sing, drum, and maintain West African cultural traditions on Sunday afternoons. Those Sunday gatherings preserved the drum patterns and call-and-response traditions that became the root of jazz, blues, and ultimately all of American popular music. The Tremé neighborhood (pronounced "treh-MAY") is the oldest continuously inhabited Black neighborhood in the United States, dating to the 1790s when free people of color — a class that had significant legal rights in French and Spanish colonial Louisiana — built homes, churches, and benevolent societies. The city''s unique Black Creole identity — shaped by the intersection of West African (particularly Fon, Yoruba, and Wolof), French, Spanish, Caribbean, and Indigenous cultures — is distinct from any other Black community in America. The Mardi Gras Indian tradition (Black men and women who spend the year hand-beading elaborate suits in honor of Indigenous peoples who sheltered escaped enslaved people) is one of the most extraordinary cultural traditions in the world. The Super Sunday gatherings in March are when these suits are revealed. The second line tradition (community brass band parades through neighborhoods on Sundays) is still alive in neighborhoods like Central City, Tremé, and Treme''s 7th Ward. Key cultural institutions: the Backstreet Cultural Museum (Mardi Gras Indians and second lines), the New Orleans Jazz Museum, Dooky Chase''s Restaurant (the civil rights movement''s gathering place), Dillard University (HBCU, 1869), and Xavier University (the only historically Black Catholic university in the Western Hemisphere). The Vietnamese American community in Village de l''Est (New Orleans East) and the Honduran and Central American communities in Metairie and Kenner add more layers to the city''s diaspora story.'),

  ('baton-rouge','Baton Rouge',
   'Southern University — one of the largest HBCUs in America — sits on a bluff above the Mississippi here, and the city that surrounds it has a Creole culture and civil rights legacy that runs deeper than most people outside Louisiana know.',
   'Baton Rouge carries a civil rights legacy that is often overshadowed by its larger neighbor New Orleans, but the city''s activism predated many famous national moments. The 1953 Baton Rouge Bus Boycott — organized by Rev. T.J. Jemison of Mt. Zion Baptist Church — was the first successful mass bus boycott in American history, predating the Montgomery boycott by two years and directly inspiring Dr. King''s strategy. Southern University and A&M College (1880) is one of the largest HBCUs in the United States, with a main campus on Scott''s Bluff above the Mississippi River and a medical school, law center, and multiple branch campuses. The Southern University campus is itself a cultural landmark — the Jaguar marching band is legendary in HBCU culture. The city''s North Baton Rouge neighborhoods (Scotlandville, Zion City, and the communities surrounding Southern University) have a distinct Black Creole character shaped by generations of cultural exchange between African American, Creole, and Cajun communities along the Mississippi River bayous. The city''s relationship with the petrochemical industry (the "Cancer Alley" corridor between Baton Rouge and New Orleans) is a significant environmental justice story — Black and working-class communities in St. Gabriel and Geismar bear disproportionate health burdens. The Rural Life Museum at LSU provides important agricultural and enslaved labor context. Key community institutions: The Southern University Museum of Art, the NAACP Baton Rouge branch (one of the oldest in the South), and the Galvez Street Corridor which anchors Black commercial life in North Baton Rouge.'),

  ('mobile','Mobile',
   'Alabama''s oldest city has a deep Black Creole history that rarely gets the spotlight it deserves — and Africatown, founded by survivors of the last slave ship to reach American shores, is one of the most historically significant communities in the world.',
   'Mobile is Alabama''s only port city and its oldest, founded in 1702 by the French as the first capital of Louisiana Territory. Its Black community therefore has roots in French and Spanish colonial rule — a Catholic, Creole tradition distinct from the Protestant, Anglo-American experience of most Deep South Black communities. Africatown — officially Historic Plateau — was founded in 1866 by 32 survivors of the Clotilda, the last known slave ship to illegally transport Africans to the United States (in 1860, 50 years after the slave trade was banned). The survivors, led by Cudjo Lewis (the last survivor, who died in 1935), built their own community, elected their own mayor, built their own church (Union Missionary Baptist Church, still standing), and maintained Yoruba cultural traditions for generations. The wreck of the Clotilda was located in the Mobile River in 2019 — one of the most significant archaeological discoveries in American history. The Africatown Heritage Museum and the Clotilda Memorial are anchors of community memory. Mobile''s Mardi Gras tradition predates New Orleans'' by several years — the city was celebrating Mardi Gras from 1703, and its Strikers''  band organization and the Black Mobilians who developed their own parallel celebration (Mardi Gras on Davis Avenue) created a distinct tradition. Davis Avenue was Mobile''s Black commercial corridor, home to clubs where the Muscle Shoals sound artists performed. Bishop State Community College has served Mobile''s Black community since 1927. The city''s growing Latino community (primarily from Honduras, Mexico, and Guatemala) has added new neighborhoods along Government Boulevard.'),

  ('los-angeles','Los Angeles',
   'From Central Avenue''s jazz heyday to Leimert Park''s poetry scene to Compton''s musical revolution — LA''s Black geography is spread across the basin, and every neighborhood tells a different chapter of the same determined story.',
   'Los Angeles''s Black community grew from approximately 3,000 in 1900 to over 750,000 by 1970 — one of the most dramatic demographic transformations in American urban history, driven by World War II defense industry jobs at the Kaiser shipyards and Douglas Aircraft. The Central Avenue corridor (from Downtown to Watts) was the "Harlem of the West" from the 1920s through the 1940s — home to the Dunbar Hotel (where Black entertainers stayed when they were barred from Hollywood hotels), the Club Alabam, and dozens of Black-owned businesses. The Watts neighborhood was the site of the 1965 Uprising — six days of rebellion following a traffic stop that exposed the depth of LAPD brutality and economic exclusion. The Leimert Park neighborhood became the cultural heart of Black LA in the 1990s and 2000s — the World Stage, the Vision Theatre, and the weekly drum circles on Degnan Boulevard were epicenters of Black arts, jazz, hip-hop, and spoken word culture. Compton''s story is inseparable from the birth of West Coast hip-hop: NWA, Dr. Dre, Ice Cube, and the gangsta rap genre emerged from Compton''s economic devastation and the crack epidemic''s impact on South Central communities. Today Inglewood (home of SoFi Stadium), Mid-City, and View Park-Windsor Hills (historically one of the highest-income Black neighborhoods in the country) are key community anchors. Los Angeles also has the largest Belizean diaspora community in the world (Belize City immigrants settled heavily in South Central from the 1970s onward); a significant Jamaican community in Compton and Inglewood; and growing West African and Ethiopian communities in Mid-Wilshire. California Eagle Park in Watts preserves the site of one of the most important Black newspapers in the West.'),

  ('houston','Houston',
   'Houston''s Third Ward is sacred ground — Texas Southern University, Project Row Houses, and Beyoncé''s hometown roots all trace back to the same community that has been holding it down since Reconstruction.',
   'Houston''s Black community is one of the most dynamic and diverse in the country — spread across Third Ward (the historic cultural anchor), Sunnyside, Missouri City, and the Beltway 8 corridor''s growing West African and Nigerian enclave communities. Third Ward, immediately southeast of downtown, is the historic heart of Black Houston: Texas Southern University (1947, HBCU) anchors the neighborhood academically; Project Row Houses (founded 1993 by artist Rick Lowe) is one of the most innovative community art and social service installations in America, using historic shotgun houses as gallery and housing space. Emancipation Park — built in 1872 by four freed Black men who purchased the land specifically for Juneteenth celebrations — is in Third Ward and is one of the oldest Black-owned parks in the United States. Juneteenth (June 19, 1865, when Union soldiers arrived in Galveston, Texas to enforce the Emancipation Proclamation) was a Texas tradition before it became a national holiday — Houston''s Juneteenth celebrations are among the largest in the country. Frenchtown (Fifth Ward) preserves a distinct Black Creole identity brought by Creole families from Louisiana who settled along the bayou in the early 20th century. Houston''s Nigerian community is one of the largest outside Nigeria — estimates suggest 50,000-100,000 Nigerian-born residents, concentrated along the Beltway 8/Bissonnet corridor in Southwest Houston. The Alief and Sharpstown areas have significant West African (Ghanaian, Liberian, Cameroonian), Caribbean, and Central American communities. Key cultural institutions: The Buffalo Soldiers National Museum (Buffalo Soldiers were stationed at Texas forts after the Civil War), the Ensemble Theatre (Houston''s oldest Black theater company), and the Houston Museum of African American Culture. Beyoncé Knowles-Carter was born in Houston and formed Destiny''s Child here — her cultural impact on the city is acknowledged throughout.'),

  ('miami','Miami',
   'Overtown was Harlem South — where Ella Fitzgerald, Louis Armstrong, and Nat King Cole slept when they couldn''t stay on Miami Beach — and Little Haiti and Liberty City carry that tradition of Black determination forward today.',
   'Miami''s Black history is multi-layered in ways unlike any other American city because of the intersection of African American Southern tradition, Caribbean (primarily Haitian and Jamaican) immigration, and Afro-Latino (particularly Afro-Cuban and Afro-Colombian) communities that rarely share the same cultural framework but all call Miami home. Overtown — historically called "Colored Town" — was Miami''s segregated Black neighborhood from the 1890s through the 1960s, when the construction of I-95 directly through its center destroyed over 40 city blocks and displaced 40,000 residents. Before that destruction, Overtown was called "the Harlem of the South" — home to the Lyric Theatre (1913, still standing and restored), where Ella Fitzgerald, Josephine Baker, Nat King Cole, and Louis Armstrong performed for Black audiences since they were barred from Miami Beach''s hotels and clubs. Little Haiti (formerly known as Lemon City) is the largest Haitian community in the United States, concentrated along NE 2nd Avenue from about 42nd Street to 83rd Street. The Caribbean Marketplace is a cultural anchor. The Haitian community in Miami fled the Duvalier dictatorship and boat people crises of the 1970s and 1980s — their presence transformed the cultural character of North Miami and Broward County. Liberty City — the historically African American neighborhood made famous in the film "Moonlight" — has been a center of community organizing, cultural production, and resilience through devastating economic challenges. Key community institutions: WDNA-FM Jazz Radio, Tigertail Productions, Miami Urban Beats Festival, and the Black Archives History and Research Foundation. The city''s Afro-Cuban community bridges African American and Latino Miami — a cultural synthesis unlike anywhere else.'),

  ('montgomery','Montgomery',
   'This is where Rosa Parks refused to move, where 40,000 Black Montgomerians walked for 381 days, and where the Civil Rights Movement proved that organized community action could change the law of the land.',
   'Montgomery, Alabama is the ground zero of the modern Civil Rights Movement and carries the full weight of American history''s contradictions in one compact city. It was the first capital of the Confederacy (February 1861) before Richmond was chosen, and it was the city where the movement that dismantled segregation found its defining moment. The Rosa Parks Museum at Troy University marks the corner of Montgomery Street and Dexter Avenue where Rosa Parks was arrested on December 1, 1955. Dexter Avenue King Memorial Baptist Church — where Dr. King served as pastor from 1954 to 1960 — is two blocks from the Alabama State Capitol, one of the most loaded geographic juxtapositions in the country. The church''s basement was the organizing center of the 1955-56 Montgomery Bus Boycott, the 381-day mass action that ended bus segregation and established Dr. King as the movement''s national leader. The Equal Justice Initiative''s two institutions — the Legacy Museum (on the site of a former warehouse where enslaved people were warehoused) and the National Memorial for Peace and Justice (the world''s first memorial to victims of lynching) — have transformed Montgomery into one of the most important sites of racial reckoning and truth-telling in the world. Alabama State University (1867), an HBCU, has been the anchor of Montgomery''s Black academic community through every era. The city''s Black Belt geography extends into the surrounding counties — a region where enslaved people worked some of the most profitable cotton plantations in the South, and whose descendants maintain communities of extraordinary cultural depth. The Selma to Montgomery National Historic Trail traces the route of the 1965 Voting Rights marches.'),

  ('allentown','Allentown',
   'Pennsylvania''s third-largest city has one of the most vibrant Puerto Rican communities on the East Coast — a diaspora story of migration, resilience, and cultural pride that has remade this post-industrial city.',
   'Allentown sits in the Lehigh Valley, 60 miles north of Philadelphia, and its story since the 1950s is inseparable from the Great Migration of Puerto Rican families who came to work in the steel mills and manufacturing plants that once defined the region. Today Allentown is approximately 55% Hispanic, with the Puerto Rican community representing the largest share — one of the highest concentrations of Puerto Rican Americans in any US city outside of New York and Hartford. The 7th Street corridor (La Calle 7) is the cultural heart of Allentown''s Latino community, lined with Puerto Rican restaurants, botanicas, bakeries, and community organizations. The Puerto Rican Cultural Center of the Lehigh Valley is a landmark institution. The African American community in Allentown is centered in the West End and has deep roots in the city''s industrial history — the two communities have shared neighborhoods, schools, and struggles for decades, creating a unique Black-Latin solidarity culture. The Baum School of Art and the ArtsWalk corridor reflect a community-driven arts investment. Key annual events: the Puerto Rican Cultural Festival (June), the MLK Day Parade, and the Allentown Gospel Jubilee. The city has experienced significant challenges from deindustrialization and the opioid crisis, but community organizing — particularly through the One Allentown Coalition and local faith communities — has maintained a resilient civic culture.'),

  ('harrisburg','Harrisburg',
   'Pennsylvania''s capital city was a critical node on the Underground Railroad — William Whipper''s home in Columbia (just up the Susquehanna River) was one of the most active stations in the state, and Harrisburg''s Black community has been rooted here since before the Civil War.',
   'Harrisburg sits on the east bank of the Susquehanna River and has been a significant African American community since the early 19th century. The city was a key station on the Underground Railroad — Harrisburg''s Black community, organized through the Wesley Union A.M.E. Zion Church, provided shelter and assistance to freedom seekers crossing the Mason-Dixon Line en route to the North. The Midtown neighborhood has historically been the center of Black cultural and commercial life, with churches, barbershops, and community organizations that have anchored the community through multiple eras. Bethel A.M.E. Church (founded 1820) is one of the oldest Black congregations in the state. The Pennsylvania State Archives and the State Museum of Pennsylvania hold significant records of African American life in the Commonwealth. Today Harrisburg''s Black community shares the city with a large Puerto Rican community (particularly in the South Allison Hill and Midtown neighborhoods) and growing West African and Sudanese refugee communities in Uptown. Capital Area Community Action Agency and numerous faith-based organizations are the primary vehicles for community mutual aid. The city''s Susquehanna River waterfront has been revitalized with events including the Multicultural Festival that brings together Harrisburg''s diverse communities. Messiah University and Penn State Harrisburg serve the region''s academic needs, though no HBCU is located in the city itself. Nearby Lincoln University (Oxford, PA) — the nation''s first degree-granting HBCU (1854) — serves the broader region.'),

  ('willow-grove','Willow Grove',
   'Montgomery County''s Willow Grove is one of the most diverse suburban communities in the Philadelphia metro — home to Black military families who settled near the former Willow Grove Naval Air Station and a growing West African community that has transformed the area.',
   'Willow Grove is an unincorporated community in Upper Moreland Township, Montgomery County, about 15 miles north of Philadelphia. The Willow Grove Naval Air Station (NASJRB Willow Grove, closed 2011 in BRAC) anchored the community for decades — the base''s presence attracted Black military families who settled permanently in the area, creating a stable African American middle-class community in what had historically been a segregated suburban landscape. The closure of the base has led to significant redevelopment, with the Willow Grove Park Mall area evolving into a mixed retail and residential district. The community''s West African population — particularly Nigerians, Ghanaians, and Liberians — has grown substantially since the 1990s, with churches, restaurants, and cultural organizations establishing presence along York Road and Welsh Road. The Hatboro-Horsham School District serves the area and has navigated growing diversity with a community-driven inclusion effort. The Korean, South Asian, and Latino communities in adjacent Horsham and Hatfield townships add to the suburban multicultural character of the region. Key community anchors: Springfield Township''s diverse business corridor, the Abington Memorial Hospital (major employer in the community), and the Montgomery County NAACP chapter. For members visiting from out of town, Willow Grove is a practical base for exploring Philadelphia while staying in a quieter, family-oriented environment.'),

  ('springfield','Springfield',
   'Western Massachusetts''s largest city has one of the most historically significant Puerto Rican communities in New England — and a Black community with deep roots in the Connecticut River valley that stretches back to the Great Migration.',
   'Springfield is the largest city in western Massachusetts and the cultural capital of the Connecticut River valley. Its Black community grew primarily during the Great Migration of the 1920s-1940s, with families from the South settling in the North End and Old Hill neighborhoods to work in the manufacturing and armory industries that defined the region. The Springfield Armory (now a National Historic Site) was one of the most significant industrial employers — its workforce became one of the most integrated in New England during World War II. The Mason Square neighborhood is the historic heart of Black Springfield — anchored by churches including Trinity United Methodist Church and the Springfield Urban League. The Puerto Rican community in Springfield is the second-largest in New England (after Hartford), concentrated in the North End and McKnight neighborhoods. The Puerto Rican Parade of Greater Springfield (typically June) is one of the largest cultural celebrations in western New England. The Springfield Museums complex includes the Dr. Seuss National Memorial Garden (Springfield-born) and the Connecticut Valley Historical Museum, which holds significant African American genealogical records for the region. Springfield College and American International College (AIC) are major higher education institutions in the city. The Connecticut River Greenway and Forest Park provide significant outdoor gathering space. Key community institutions: the NAACP Springfield Branch (founded 1915), the Urban League of Springfield, and the Brightwood/Memorial Square neighborhoods which remain centers of Afro-Caribbean and Black community life.')
ON CONFLICT (city_slug) DO UPDATE SET
  brief_context     = EXCLUDED.brief_context,
  historical_context = EXCLUDED.historical_context,
  city_name         = EXCLUDED.city_name`,
  },
  {
    // Business safety experience submissions — one row per user per business.
    // The displayed safety stats on every business page are live aggregates from this table.
    // Fields mirror SafetySurveyData from the mobile app.
    name: "create_business_safety_submissions",
    sql: `CREATE TABLE IF NOT EXISTS business_safety_submissions (
      id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id         VARCHAR     NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      user_id             VARCHAR     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      overall_safety      INTEGER     NOT NULL CHECK (overall_safety BETWEEN 1 AND 5),
      return_alone        INTEGER     NOT NULL CHECK (return_alone BETWEEN 1 AND 5),
      would_recommend     INTEGER     NOT NULL CHECK (would_recommend BETWEEN 1 AND 5),
      belonging_rating    INTEGER     CHECK (belonging_rating BETWEEN 1 AND 5),
      time_of_day         VARCHAR(20),
      group_type          VARCHAR(30),
      incident_occurred   BOOLEAN     NOT NULL DEFAULT false,
      incident_categories TEXT[],
      incident_severity   VARCHAR(20),
      comments            TEXT,
      submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, business_id)
    )`,
  },
  {
    // Trusted Safety Share — main share configuration table.
    // owner_id = traveler who enables the feature.
    // contact can be MWM user (contact_type='mwm_user'), SMS (phone), or email.
    // status lifecycle: pending → active (contact accepts) → paused_home / revoked.
    // invite_token is used for non-MWM contacts to accept via a link.
    name: "create_trusted_safety_shares",
    sql: `CREATE TABLE IF NOT EXISTS trusted_safety_shares (
      id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id          VARCHAR     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact_type      VARCHAR(20) NOT NULL DEFAULT 'phone',
      contact_user_id   VARCHAR     REFERENCES users(id) ON DELETE SET NULL,
      contact_name      VARCHAR(100) NOT NULL,
      contact_phone     VARCHAR(50),
      contact_email     VARCHAR(255),
      owner_enabled     BOOLEAN     NOT NULL DEFAULT true,
      contact_accepted  BOOLEAN     NOT NULL DEFAULT false,
      status            VARCHAR(30) NOT NULL DEFAULT 'pending',
      invite_token      UUID        UNIQUE DEFAULT gen_random_uuid(),
      invite_expires_at TIMESTAMPTZ,
      activated_at      TIMESTAMPTZ,
      revoked_at        TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    // Audit log of every alert sent via Trusted Safety Share.
    // One row per contact notified per alert event.
    name: "create_trusted_safety_alert_log",
    sql: `CREATE TABLE IF NOT EXISTS trusted_safety_alert_log (
      id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      share_id              UUID        NOT NULL REFERENCES trusted_safety_shares(id) ON DELETE CASCADE,
      owner_id              VARCHAR     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      alert_type            VARCHAR(50) NOT NULL,
      alert_source          VARCHAR(50) NOT NULL DEFAULT 'mwm_community',
      alert_title           TEXT        NOT NULL,
      alert_body            TEXT        NOT NULL,
      location_city         VARCHAR(100),
      location_region       VARCHAR(100),
      contact_delivery_method VARCHAR(20),
      delivery_status       VARCHAR(20) NOT NULL DEFAULT 'pending',
      error_message         TEXT,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    // a Stripe subscription. Password: MWM-invite-2026!
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
             '$2b$08$ofLtRbXbdrBoQm4nfLz.fut.KCmGZyMBGWVJx4U/4FOfzIOfZ1prO',
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
  {
    // Dedicated Manus AI tester account — created Aug 2026.
    // Email:    manus@mappingwithmelanin.com
    // Password: MWM-Manus-2026!
    // Role:     tester (sees tester-only demo businesses + all live listings)
    // Tier:     founding (full feature access, no Stripe subscription required)
    // ON CONFLICT DO UPDATE so credentials self-heal if manually edited.
    name: "ensure_manus_ai_tester_v1",
    sql: `INSERT INTO users
            (id, email, first_name, last_name, password_hash,
             email_verified, agree_to_terms, profile_setup_complete,
             member_type, approved, role, home_city, must_change_password)
          VALUES
            (gen_random_uuid(),
             'manus@mappingwithmelanin.com',
             'Manus', 'AI',
             '$2b$08$DTYSXXrFt8ZPTKx3uzBD3edNsvgL/yNNMAKqRiYE.g6nvdVaWa.Yi',
             true, true, true,
             'founding', true, 'tester', 'Philadelphia', false)
          ON CONFLICT (email) DO UPDATE SET
            password_hash          = EXCLUDED.password_hash,
            first_name             = EXCLUDED.first_name,
            last_name              = EXCLUDED.last_name,
            role                   = EXCLUDED.role,
            member_type            = EXCLUDED.member_type,
            approved               = EXCLUDED.approved,
            email_verified         = EXCLUDED.email_verified,
            profile_setup_complete = EXCLUDED.profile_setup_complete,
            must_change_password   = false,
            updated_at             = NOW()`,
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
  // Universal password: MWM-invite-2026! (bcrypt cost=8)
  // must_change_password=true so they are forced to set their own password on
  // first login. Also sets must_change_password=true on the Manus tester.
  // ON CONFLICT DO NOTHING — never overwrites a user who already set their own password.
  {
    name: "tester_universal_accounts_v1",
    sql: `
      -- Universal password hash: bcrypt(cost=8) of "MWM-invite-2026!"
      DO $$
      DECLARE
        universal_hash TEXT := '$2b$08$ofLtRbXbdrBoQm4nfLz.fut.KCmGZyMBGWVJx4U/4FOfzIOfZ1prO';
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
        password_hash        = '$2b$08$ofLtRbXbdrBoQm4nfLz.fut.KCmGZyMBGWVJx4U/4FOfzIOfZ1prO',
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
        h TEXT := '$2b$08$ofLtRbXbdrBoQm4nfLz.fut.KCmGZyMBGWVJx4U/4FOfzIOfZ1prO';
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
          'trinalindsaytester@gmail.com',
          'manus.tester@mappingwithmelanin.com'
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
        SELECT 1 FROM knowledge_topics WHERE topic_name = v.n
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
        h TEXT := '$2b$08$ofLtRbXbdrBoQm4nfLz.fut.KCmGZyMBGWVJx4U/4FOfzIOfZ1prO';
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
  // NOTE: tester_verification_cleanup_v1 and tester_clean_slate_v2 REMOVED.
  // Both were mistakenly left in the MIGRATIONS array which runs on every boot
  // (there is no migration tracking table — every entry runs every restart).
  // This caused tester accounts to be deleted on every server start, which is
  // why no tester could log in. Tester accounts are now managed exclusively by
  // tester_accounts_restore_v1 (UPSERT above). Do not add any DELETE FROM users
  // logic to this array — it will execute on every deploy and every crash-restart.
  {
    // Deduplicate Bangkok, Phuket, Sickle Cell Disease, and Faith & Spirituality in
    // knowledge_topics. The seed_southeast_asia_library_topics_v1 migration had a bug:
    // it checked WHERE NOT EXISTS ... AND category = 'country' but the existing rows
    // have category = 'geography', so a new row was created on every boot.
    // This migration is idempotent: UPDATE and DELETE affect 0 rows once dedup is done.
    name: "deduplicate_geography_topics_v1",
    sql: `
      DO $$
      DECLARE
        canonical_id TEXT;
        nc_ids       TEXT[];
      BEGIN
        -- Helper pattern for each topic:
        --   1. Find canonical (oldest) id.
        --   2. Collect non-canonical ids.
        --   3. Delete topic_relationships that would conflict after re-parenting
        --      (i.e. the canonical already owns that child/parent pair).
        --   4. Delete remaining non-canonical topic_relationships outright.
        --   5. Migrate library_entity_connections and knowledge_sources.
        --   6. Delete non-canonical topic rows.
        -- All steps are safe no-ops when only 1 copy exists.

        -- Bangkok
        SELECT id INTO canonical_id FROM knowledge_topics
          WHERE topic_name = 'Bangkok' ORDER BY created_at ASC LIMIT 1;
        IF canonical_id IS NOT NULL THEN
          SELECT ARRAY(SELECT id FROM knowledge_topics WHERE topic_name='Bangkok' AND id<>canonical_id) INTO nc_ids;
          IF array_length(nc_ids,1) > 0 THEN
            DELETE FROM topic_relationships
              WHERE (parent_topic_id = ANY(nc_ids) OR child_topic_id = ANY(nc_ids));
            UPDATE library_entity_connections SET topic_id = canonical_id WHERE topic_id = ANY(nc_ids);
            UPDATE knowledge_sources SET topic_id = canonical_id WHERE topic_id = ANY(nc_ids);
            DELETE FROM knowledge_topics WHERE id = ANY(nc_ids);
          END IF;
        END IF;

        -- Phuket
        SELECT id INTO canonical_id FROM knowledge_topics
          WHERE topic_name = 'Phuket' ORDER BY created_at ASC LIMIT 1;
        IF canonical_id IS NOT NULL THEN
          SELECT ARRAY(SELECT id FROM knowledge_topics WHERE topic_name='Phuket' AND id<>canonical_id) INTO nc_ids;
          IF array_length(nc_ids,1) > 0 THEN
            DELETE FROM topic_relationships
              WHERE (parent_topic_id = ANY(nc_ids) OR child_topic_id = ANY(nc_ids));
            UPDATE library_entity_connections SET topic_id = canonical_id WHERE topic_id = ANY(nc_ids);
            UPDATE knowledge_sources SET topic_id = canonical_id WHERE topic_id = ANY(nc_ids);
            DELETE FROM knowledge_topics WHERE id = ANY(nc_ids);
          END IF;
        END IF;

        -- Sickle Cell Disease
        SELECT id INTO canonical_id FROM knowledge_topics
          WHERE topic_name = 'Sickle Cell Disease' ORDER BY created_at ASC LIMIT 1;
        IF canonical_id IS NOT NULL THEN
          SELECT ARRAY(SELECT id FROM knowledge_topics WHERE topic_name='Sickle Cell Disease' AND id<>canonical_id) INTO nc_ids;
          IF array_length(nc_ids,1) > 0 THEN
            UPDATE library_entity_connections SET topic_id = canonical_id WHERE topic_id = ANY(nc_ids);
            UPDATE knowledge_sources SET topic_id = canonical_id WHERE topic_id = ANY(nc_ids);
            DELETE FROM knowledge_topics WHERE id = ANY(nc_ids);
          END IF;
        END IF;

        -- Faith & Spirituality
        SELECT id INTO canonical_id FROM knowledge_topics
          WHERE topic_name = 'Faith & Spirituality' ORDER BY created_at ASC LIMIT 1;
        IF canonical_id IS NOT NULL THEN
          SELECT ARRAY(SELECT id FROM knowledge_topics WHERE topic_name='Faith & Spirituality' AND id<>canonical_id) INTO nc_ids;
          IF array_length(nc_ids,1) > 0 THEN
            UPDATE library_entity_connections SET topic_id = canonical_id WHERE topic_id = ANY(nc_ids);
            UPDATE knowledge_sources SET topic_id = canonical_id WHERE topic_id = ANY(nc_ids);
            DELETE FROM knowledge_topics WHERE id = ANY(nc_ids);
          END IF;
        END IF;
      END $$;
    `,
  },
  {
    // user_library_interests — tracks which topics a user has followed or saved.
    // Powers KinfolkAI cross-pollination: when a user follows "Ethiopia" in the Library,
    // KinfolkAI surfaces Ethiopian businesses and events in travel/businesses conversations.
    name: "user_library_interests_v1",
    sql: `
      CREATE TABLE IF NOT EXISTS user_library_interests (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, topic_name)
      );
      CREATE INDEX IF NOT EXISTS idx_user_library_interests_user ON user_library_interests(user_id);
    `,
  },
  {
    // circle_saves — shared wishlist items added by Circle members (per Manus KinfolkAI Circles spec)
    // save_type: 'business' | 'destination' | 'experience' | 'library_topic'
    name: "circle_saves_v1",
    sql: `
      CREATE TABLE IF NOT EXISTS circle_saves (
        id          SERIAL PRIMARY KEY,
        circle_id   INTEGER NOT NULL REFERENCES kinfolk_circles(id) ON DELETE CASCADE,
        saved_by    TEXT NOT NULL,
        save_type   TEXT NOT NULL DEFAULT 'destination',
        reference_id TEXT,
        reference_name TEXT NOT NULL,
        notes       TEXT,
        saved_at    TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_circle_saves_circle ON circle_saves(circle_id);
    `,
  },
  {
    // circle_itineraries — KinfolkAI-generated itineraries for Circles
    // shared_plan: spine (group moments); individual_plans: keyed by member name
    name: "circle_itineraries_v1",
    sql: `
      CREATE TABLE IF NOT EXISTS circle_itineraries (
        id              SERIAL PRIMARY KEY,
        circle_id       INTEGER NOT NULL REFERENCES kinfolk_circles(id) ON DELETE CASCADE,
        created_by      TEXT NOT NULL,
        title           TEXT NOT NULL,
        destination     TEXT,
        start_date      TEXT,
        end_date        TEXT,
        shared_plan     JSONB DEFAULT '{}'::jsonb,
        individual_plans JSONB DEFAULT '{}'::jsonb,
        created_at      TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_circle_itineraries_circle ON circle_itineraries(circle_id);
    `,
  },
  {
    // business_endorsement_taps — THE REAL tag endorsements by users (idempotent — table may already exist)
    name: "business_endorsement_taps_v1",
    sql: `
      CREATE TABLE IF NOT EXISTS business_endorsement_taps (
        id          SERIAL PRIMARY KEY,
        business_id TEXT NOT NULL,
        user_id     TEXT NOT NULL,
        tag_key     TEXT NOT NULL,
        tapped_at   TIMESTAMP DEFAULT NOW(),
        UNIQUE (business_id, user_id, tag_key)
      );
      CREATE INDEX IF NOT EXISTS idx_endorsement_taps_biz ON business_endorsement_taps(business_id);
      CREATE INDEX IF NOT EXISTS idx_endorsement_taps_user ON business_endorsement_taps(user_id);
    `,
  },
  {
    // Privacy Intelligence settings on user_preferences
    // kinfolk_proactivity: high (suggests without being asked) | medium (context-relevant only) | reactive (never volunteers)
    // kinfolk_learning_categories: JSONB array of categories user has opted Kinfolk learning into
    // kinfolk_privacy_settings: JSONB blob for full granular control (what Kinfolk learns vs where it surfaces)
    name: "kinfolk_privacy_settings_v1",
    sql: `
      ALTER TABLE user_preferences
        ADD COLUMN IF NOT EXISTS kinfolk_proactivity VARCHAR(20) NOT NULL DEFAULT 'medium',
        ADD COLUMN IF NOT EXISTS kinfolk_learning_categories JSONB DEFAULT '["travel","food","culture","community","business"]'::jsonb,
        ADD COLUMN IF NOT EXISTS kinfolk_privacy_settings JSONB DEFAULT '{
          "learnHealth": true,
          "learnTravel": true,
          "learnFood": true,
          "learnBusiness": true,
          "learnCommunity": true,
          "surfaceInCircles": true,
          "surfaceInLibrary": true,
          "surfaceInProfile": false
        }'::jsonb;
    `,
  },
  {
    // Comprehensive cultural city profile for Phuket — provides KinfolkAI with
    // deep historical and cultural context when travelers ask about the island.
    // Uses ON CONFLICT DO UPDATE to upgrade the thin brief_context written by
    // city_profiles_international_v1 with this richer, research-backed version.
    name: "city_profiles_phuket_cultural_v1",
    sql: `INSERT INTO city_profiles (city_slug, city_name, brief_context, historical_context)
VALUES (
  'phuket',
  'Phuket, Thailand',
  'Phuket is Thailand''s largest island and one of the world''s great crossroads civilizations — a place where Srivijayan empire trade routes, Malay Muslim fishing communities, Hokkien Chinese tin miners, British colonial merchants, and the Thai royal state layered their histories onto the same coastline over 2,000 years, producing a culture more complex and original than any of its individual parts. The island''s Peranakan (Baba-Nyonya) identity — born from Chinese-Malay intermarriage during the 19th-century tin boom — gave rise to the Sino-Portuguese architecture of Old Phuket Town, the extraordinary Vegetarian Festival (200 years of unbroken practice), and a fusion cuisine that draws on four different cultural traditions. The Urak Lawoi (Sea Gypsy) people have navigated these Andaman waters for 5,000 years and their traditional ecological knowledge famously saved their communities during the 2004 tsunami that reshaped the island''s coastline and consciousness. The 1785 defense of Thalang Fort by Chan (Thao Thepkrasattri) and Mook (Thao Srisoonthorn) — two women who organized the island''s resistance to a Burmese invasion — is commemorated by the only major monument in Thailand dedicated to women who commanded a successful military defense. Phuket''s beaches (Patong, Kata, Karon, Kamala) are extraordinary, but the island''s full cultural weight requires time in Old Town, at Wat Chalong, at the Rawai Sea Gypsy village, and at the Thalang Museum that holds it all together.',
  'Phuket Province sits at the northern mouth of the Malacca Strait — the most strategically important maritime passage in Asia — and has been a way-station for trade between the Indian Ocean and the South China Sea for at least 2,000 years. The island was known to Arab, Indian, and Chinese traders as Junk Ceylon (from the Malay Ujung Salang, "cape of Salang"), appearing on Ptolemy''s 2nd-century CE maps and in the accounts of Arab geographers as a provisioning stop on the route between the Bay of Bengal and the Chinese ports. Between the 7th and 13th centuries, the Srivijayan maritime empire — based in Sumatra and controlling the sea lanes between India and China — exerted cultural influence across the Andaman coast, seeding the temple architecture, Sanskrit literacy, and Buddhist traditions that still define the region''s spiritual landscape. The island''s Malay Muslim community traces its roots to the seafaring communities of the Malay Peninsula and the Islamic sultanates that governed the southern peninsula before Thai royal authority consolidated its control in the 18th–19th centuries; approximately 35% of Phuket''s historical population was Malay Muslim, and their culinary, architectural, and spiritual traditions are woven through the island''s culture in ways that are often invisible to short-stay visitors. The Chinese tin mining era (roughly 1850–1950) was the most economically transformative period in Phuket''s modern history: Hokkien and Hakka mining clans (kongsi) controlled different territorial zones, built the temples and shrines that dominate the island''s religious landscape, and created the Peranakan hybrid culture through intermarriage with Malay women. The 1876 Coolie Rebellion (Ang Yi Uprising) was one of the most significant labor uprisings in 19th-century Southeast Asia. British colonial Penang — established in 1786, just across the Andaman Sea — was the commercial and educational hub that Phuket''s Chinese elite connected to, creating the Anglophone, culturally hybrid "King''s Chinese" class whose wealth built the Sino-Portuguese mansions of Old Town. The rubber plantation era (from 1899 onward) replaced the exhausted tin economy and created the landscape of Phuket''s interior, with smallholder families rather than labor gangs as the social unit. The 2004 Indian Ocean tsunami struck Phuket''s western coast on December 26, killing thousands and permanently altering the island''s relationship to the sea; the survival of the Urak Lawoi community through traditional ecological knowledge was documented internationally and validated indigenous science in ways that academic research had not. The contemporary Phuket that 10 million tourists visit annually is built on this layered history — understanding it transforms the island from a beach destination into one of the most culturally rich travel experiences in Asia.'
)
ON CONFLICT (city_slug) DO UPDATE SET
  brief_context       = EXCLUDED.brief_context,
  historical_context  = EXCLUDED.historical_context`,
  },

  // ── moon.mayes444@gmail.com — approved tester (admin_invite, Aug 11 2026)
  {
    name: "tester_moon_mayes_v1",
    sql: `INSERT INTO pending_tester_emails (email, tester_access_source)
          VALUES ('moon.mayes444@gmail.com', 'admin_invite')
          ON CONFLICT (email) DO NOTHING`,
  },

  // ── family_ai_usage — tracks AI quota consumption per circle/user per month.
  // Required by checkAiPool() (called on every non-free KinfolkAI chat request).
  // Missing table causes an instant "KinfolkAI chat failed" for all navigator/
  // trailblazer users. CREATE IF NOT EXISTS is safe to run every boot.
  {
    name: "family_ai_usage_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS family_ai_usage (
      circle_id   VARCHAR NOT NULL,
      year_month  VARCHAR(7) NOT NULL,
      requests_used INTEGER NOT NULL DEFAULT 0,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (circle_id, year_month)
    )`,
  },

  // ── voice_usage — tracks TTS character consumption per user per month.
  // Required by checkVoiceUsage() / incrementVoiceChars(). Missing table causes
  // "KinfolkAI chat failed" when the TTS speak endpoint is called by paid users.
  {
    name: "voice_usage_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS voice_usage (
      user_id     VARCHAR NOT NULL,
      year_month  VARCHAR(7) NOT NULL,
      chars_used  INTEGER NOT NULL DEFAULT 0,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, year_month)
    )`,
  },

  // ── kinfolk_delivery_profiles — stores explicit member delivery preferences.
  // Used by loadAdaptiveDeliveryProfile(); falls back to safe defaults when absent.
  // Columns mirror AdaptiveDeliveryProfile in adaptive-tone-and-audience-filter.ts.
  {
    name: "kinfolk_delivery_profiles_v1",
    sql: `CREATE TABLE IF NOT EXISTS kinfolk_delivery_profiles (
      user_id                          VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      detail_level                     VARCHAR(20)  NOT NULL DEFAULT 'standard',
      tone_preference                  VARCHAR(30)  NOT NULL DEFAULT 'default',
      learning_mode                    VARCHAR(20)  NOT NULL DEFAULT 'guided',
      notification_cadence             VARCHAR(30)  NOT NULL DEFAULT 'essential_only',
      age_band                         VARCHAR(20)  NOT NULL DEFAULT 'unknown',
      regional_language_opt_in         BOOLEAN      NOT NULL DEFAULT false,
      regional_reference               VARCHAR(100),
      allow_related_branches           BOOLEAN      NOT NULL DEFAULT false,
      allow_non_sensitive_recommendations BOOLEAN   NOT NULL DEFAULT false,
      allow_civic_safety_updates       BOOLEAN      NOT NULL DEFAULT false,
      created_at                       TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at                       TIMESTAMPTZ  NOT NULL DEFAULT now()
    )`,
  },

  // ── Mapping With Melanin — canonical platform listing in the production directory
  // The MWM platform itself should appear in its own community directory.
  // Uses a stable deterministic ID so ON CONFLICT self-heals on every deploy.
  {
    name: "mwm_platform_listing_v1",
    sql: `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state,
             latitude, longitude, website, instagram, tiktok,
             description, status, verified, black_owned, confidence_score,
             profile_status, business_status)
          VALUES
            ('c678e359-0000-4000-8000-000000000001',
             'Mapping With Melanin',
             'Community Organization',
             'Community Tech Platform',
             '1600 Market St',
             'Philadelphia', 'PA',
             39.9526, -75.1652,
             'https://mappingwithmelanin.com',
             'mapping_with_melanin',
             'mapping.with.mela',
             'Mapping With Melanin™ is a community-powered platform connecting Black travelers and residents with verified Black-owned businesses, cultural heritage sites, community events, and safety resources across the United States and beyond.',
             'active', true, true, 100,
             'complete', 'community')
          ON CONFLICT (id) DO UPDATE SET
            name         = EXCLUDED.name,
            website      = EXCLUDED.website,
            instagram    = EXCLUDED.instagram,
            tiktok       = EXCLUDED.tiktok,
            verified     = EXCLUDED.verified,
            black_owned  = EXCLUDED.black_owned,
            status       = EXCLUDED.status,
            updated_at   = NOW()`,
  },
  {
    name: "add_is_load_test_to_users",
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_load_test boolean NOT NULL DEFAULT false`,
  },
  {
    // Idempotent: after first run city is 'Horsham', subsequent boots touch 0 rows
    name: "dukes_cafe_city_fix_v1",
    sql: `UPDATE businesses
          SET city='Horsham', state='PA', address='Horsham, PA 19044',
              black_owned=true,
              ownership_designations='["black-owned"]'::jsonb
          WHERE LOWER(name)='duke''s cafe' AND city='Willow Grove'`,
  },
  // ── Community feedback — real member-backed vibes + captions ───────────────
  {
    name: "business_member_feedback_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS business_member_feedback (
      id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
      business_id TEXT        NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
      member_id   TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind        TEXT        NOT NULL CHECK (kind IN ('vibe', 'caption')),
      key         TEXT        NOT NULL,
      status      TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'pending_review', 'removed')),
      is_load_test BOOLEAN    NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (business_id, member_id, kind, key)
    )`,
  },
  {
    name: "business_member_feedback_index_v1",
    sql: `CREATE INDEX IF NOT EXISTS idx_bmf_aggregate
      ON business_member_feedback (business_id, kind, key, status)
      WHERE status = 'active' AND is_load_test = FALSE`,
  },
  // ── Library Growth Engine (Aug 12 2026) ──────────────────────────────────
  {
    name: "library_growth_signals_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS library_growth_signals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      canonical_subject TEXT NOT NULL,
      canonical_subject_key TEXT NOT NULL,
      suggested_category TEXT NOT NULL,
      suggested_node_type TEXT NOT NULL DEFAULT 'chapter'
        CHECK (suggested_node_type IN ('book','volume','chapter','subchapter','geography','general')),
      suggested_parent_topic_id TEXT NULL REFERENCES knowledge_topics(id) ON DELETE SET NULL,
      geography_scope TEXT NULL,
      source_surface TEXT NOT NULL DEFAULT 'kinfolk_chat'
        CHECK (source_surface IN ('kinfolk_chat','universal_search','library_search','map_search')),
      user_fingerprint TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      learning_eligible BOOLEAN NOT NULL DEFAULT TRUE,
      sensitivity_tier TEXT NOT NULL DEFAULT 'standard'
        CHECK (sensitivity_tier IN ('standard','professional','sensitive','excluded')),
      is_load_test BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "library_growth_signals_indices_v1",
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS library_growth_signals_one_per_subject_user_day
      ON library_growth_signals (canonical_subject_key, user_fingerprint)
      WHERE learning_eligible = TRUE AND is_load_test = FALSE;
    CREATE INDEX IF NOT EXISTS library_growth_signals_aggregate_idx
      ON library_growth_signals (canonical_subject_key, suggested_category, occurred_at DESC)
      WHERE learning_eligible = TRUE AND is_load_test = FALSE`,
  },
  {
    name: "library_growth_candidates_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS library_growth_candidates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      canonical_subject TEXT NOT NULL,
      canonical_subject_key TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      desired_node_type TEXT NOT NULL
        CHECK (desired_node_type IN ('book','volume','chapter','subchapter','geography','general')),
      parent_topic_id TEXT NULL REFERENCES knowledge_topics(id) ON DELETE SET NULL,
      geography_scope TEXT NULL,
      distinct_user_count INTEGER NOT NULL DEFAULT 0,
      signal_count INTEGER NOT NULL DEFAULT 0,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sensitivity_tier TEXT NOT NULL DEFAULT 'standard'
        CHECK (sensitivity_tier IN ('standard','professional','sensitive')),
      proposed_status TEXT NOT NULL DEFAULT 'pending_threshold'
        CHECK (proposed_status IN ('pending_threshold','pending_review','approved','materialized','rejected','expired')),
      rationale JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "library_growth_candidates_trigger_v1",
    sql: `CREATE INDEX IF NOT EXISTS library_growth_candidates_review_idx
      ON library_growth_candidates (proposed_status, distinct_user_count DESC, last_seen_at DESC);
    CREATE OR REPLACE FUNCTION set_library_growth_candidate_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS trg_library_growth_candidate_updated_at ON library_growth_candidates;
    CREATE TRIGGER trg_library_growth_candidate_updated_at
      BEFORE UPDATE ON library_growth_candidates
      FOR EACH ROW EXECUTE FUNCTION set_library_growth_candidate_updated_at()`,
  },
  {
    name: "library_growth_decisions_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS library_growth_decisions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      candidate_id UUID NOT NULL REFERENCES library_growth_candidates(id) ON DELETE CASCADE,
      decision TEXT NOT NULL CHECK (decision IN ('approved','rejected','materialized','merged','expired')),
      decided_by_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      reason TEXT NOT NULL,
      materialized_topic_id TEXT NULL REFERENCES knowledge_topics(id) ON DELETE SET NULL,
      evidence_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS library_growth_decisions_candidate_idx
      ON library_growth_decisions (candidate_id, created_at DESC)`,
  },

  // ── Track 2: Library Evidence Link Health ────────────────────────────────
  // Adds transport-layer health state to knowledge_sources so the Library UI
  // never directs a member to a known-stale external URL.
  {
    name: "knowledge_sources_link_health_v1",
    sql: `ALTER TABLE knowledge_sources
      ADD COLUMN IF NOT EXISTS link_status varchar(30) DEFAULT 'unchecked',
      ADD COLUMN IF NOT EXISTS last_checked_at timestamptz,
      ADD COLUMN IF NOT EXISTS last_http_status integer,
      ADD COLUMN IF NOT EXISTS last_final_url text,
      ADD COLUMN IF NOT EXISTS last_check_error text,
      ADD COLUMN IF NOT EXISTS link_reviewed_by varchar(255),
      ADD COLUMN IF NOT EXISTS link_reviewed_at timestamptz,
      ADD COLUMN IF NOT EXISTS replaced_source_url text`,
  },

  // ── Track 3: Community Business Listing & Claim Workflow v2 ─────────────
  // Four independent state dimensions on businesses (additive, never drops data).
  {
    name: "community_business_claims_v2_businesses_cols",
    sql: `ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS listing_origin varchar(30),
      ADD COLUMN IF NOT EXISTS publication_status varchar(30),
      ADD COLUMN IF NOT EXISTS ownership_control_status varchar(30),
      ADD COLUMN IF NOT EXISTS verification_status varchar(30),
      ADD COLUMN IF NOT EXISTS contributed_by_user_id varchar(255),
      ADD COLUMN IF NOT EXISTS source_summary text,
      ADD COLUMN IF NOT EXISTS service_area varchar(255),
      ADD COLUMN IF NOT EXISTS public_location_kind varchar(30),
      ADD COLUMN IF NOT EXISTS public_contact_channel varchar(30),
      ADD COLUMN IF NOT EXISTS public_contact_value text`,
  },
  // Allow service-area, online, and home-based providers without a physical address.
  {
    // Wrapped in DO $$ guard: DROP NOT NULL fails if column is already nullable.
    name: "community_business_claims_v2_address_nullable",
    sql: `DO $$ BEGIN
      IF (SELECT is_nullable FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='address') = 'NO' THEN
        ALTER TABLE businesses ALTER COLUMN address DROP NOT NULL;
      END IF;
    END $$`,
  },
  {
    // Wrapped in DO $$ guard: DROP NOT NULL fails if column is already nullable.
    name: "community_business_claims_v2_lat_nullable",
    sql: `DO $$ BEGIN
      IF (SELECT is_nullable FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='latitude') = 'NO' THEN
        ALTER TABLE businesses ALTER COLUMN latitude DROP NOT NULL;
      END IF;
    END $$`,
  },
  {
    // Wrapped in DO $$ guard: DROP NOT NULL fails if column is already nullable.
    name: "community_business_claims_v2_lng_nullable",
    sql: `DO $$ BEGIN
      IF (SELECT is_nullable FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='longitude') = 'NO' THEN
        ALTER TABLE businesses ALTER COLUMN longitude DROP NOT NULL;
      END IF;
    END $$`,
  },
  // Conservative backfill — only touches rows where the new columns are NULL.
  // Does NOT migrate contributed_by_user_id from submitted_by_id (requires manual classification).
  {
    name: "community_business_claims_v2_backfill",
    sql: `UPDATE businesses
      SET
        listing_origin = COALESCE(listing_origin,
          CASE data_source
            WHEN 'community_submission' THEN 'community_added'
            WHEN 'admin_entry'          THEN 'admin_added'
            ELSE 'imported'
          END),
        publication_status = COALESCE(publication_status,
          CASE WHEN status = 'active' THEN 'live' ELSE 'pending_review' END),
        ownership_control_status = COALESCE(ownership_control_status,
          CASE WHEN listing_status = 'live_claimed' THEN 'claimed' ELSE 'unclaimed' END),
        verification_status = COALESCE(verification_status,
          CASE WHEN verified = true THEN 'verified' ELSE 'not_requested' END),
        public_location_kind = COALESCE(public_location_kind,
          CASE
            WHEN latitude IS NOT NULL AND longitude IS NOT NULL
             AND latitude != 0 AND longitude != 0 THEN 'address'
            ELSE 'unknown'
          END)
      WHERE listing_origin IS NULL
         OR publication_status IS NULL
         OR ownership_control_status IS NULL
         OR verification_status IS NULL`,
  },
  // Source provenance table — one row per public source used to support a listing.
  {
    name: "community_business_claims_v2_listing_sources",
    sql: `CREATE TABLE IF NOT EXISTS business_listing_sources (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id varchar(255) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      source_type varchar(40) NOT NULL,
      source_url text,
      source_label varchar(255),
      field_coverage jsonb NOT NULL DEFAULT '[]'::jsonb,
      confidence varchar(15) NOT NULL DEFAULT 'medium',
      captured_at timestamptz NOT NULL DEFAULT now(),
      captured_by_user_id varchar(255),
      is_current boolean NOT NULL DEFAULT true
    );
    CREATE INDEX IF NOT EXISTS business_listing_sources_business_idx
      ON business_listing_sources (business_id, is_current)`,
  },
  // Outreach records — append-only draft/audit table. SENDING IS DISABLED IN RELEASE 1.
  {
    name: "community_business_claims_v2_outreach_table",
    sql: `CREATE TABLE IF NOT EXISTS business_owner_outreach (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id varchar(255) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      source_id uuid REFERENCES business_listing_sources(id),
      channel varchar(30) NOT NULL,
      public_destination text NOT NULL,
      status varchar(30) NOT NULL DEFAULT 'draft',
      prepared_by varchar(255),
      approved_by varchar(255),
      template_version varchar(50),
      message_snapshot text,
      opt_out_reason text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  // Claim record enrichment — evidence + review audit trail.
  {
    name: "community_business_claims_v2_claims_cols",
    sql: `ALTER TABLE business_claims
      ADD COLUMN IF NOT EXISTS claim_type varchar(30) NOT NULL DEFAULT 'ownership_control',
      ADD COLUMN IF NOT EXISTS verification_method varchar(40),
      ADD COLUMN IF NOT EXISTS evidence_url text,
      ADD COLUMN IF NOT EXISTS evidence_summary text,
      ADD COLUMN IF NOT EXISTS attested_at timestamptz,
      ADD COLUMN IF NOT EXISTS reviewed_by varchar(255),
      ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
      ADD COLUMN IF NOT EXISTS decision_reason text,
      ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz`,
  },
  // Owner link enrichment — approval + revocation audit trail.
  {
    name: "community_business_claims_v2_owner_links_cols",
    sql: `ALTER TABLE business_owner_links
      ADD COLUMN IF NOT EXISTS claim_id varchar(255),
      ADD COLUMN IF NOT EXISTS approved_by varchar(255),
      ADD COLUMN IF NOT EXISTS approved_at timestamptz,
      ADD COLUMN IF NOT EXISTS revoked_by varchar(255),
      ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
      ADD COLUMN IF NOT EXISTS revocation_reason text`,
  },
  // Review queue index for admin claim dashboard.
  {
    name: "community_business_claims_v2_review_queue_idx",
    sql: `CREATE INDEX IF NOT EXISTS business_claims_review_queue_idx
      ON business_claims (status, created_at DESC)`,
  },

  // ── kinfolk_entities UNIQUE(canonical_name) — prevents duplicate seeding ──
  // Without this, ON CONFLICT (canonical_name) cannot be used and each server
  // restart creates a new entity row for every seeded entity.
  // Dedup step runs first because Railway DB accumulated duplicates before this
  // constraint was introduced — a bare ALTER TABLE would fail with "could not
  // create unique index … duplicate key value".
  {
    name: "kinfolk_entities_unique_canonical_name_v2",
    sql: `DO $$
      BEGIN
        -- 1. Remove duplicate canonical_names — keep the oldest row per name
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'kinfolk_entities'
        ) THEN
          DELETE FROM kinfolk_entities
          WHERE id NOT IN (
            SELECT DISTINCT ON (lower(canonical_name)) id
            FROM kinfolk_entities
            ORDER BY lower(canonical_name), created_at ASC NULLS LAST, id ASC
          );
          -- 2. Add UNIQUE constraint only if it doesn't already exist
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'kinfolk_entities_canonical_name_unique'
              AND conrelid = 'kinfolk_entities'::regclass
          ) THEN
            ALTER TABLE kinfolk_entities
              ADD CONSTRAINT kinfolk_entities_canonical_name_unique UNIQUE (canonical_name);
          END IF;
        END IF;
      EXCEPTION WHEN others THEN
        NULL; -- table may not exist; ignore
      END
    $$`,
  },

  // ── pgvector extension ────────────────────────────────────────────────────
  // Required for Kinfolk semantic retrieval (task #295).
  // Stop condition: if this errors on Railway, vector layer is unavailable —
  // check Railway logs for "pgvector_extension" to verify Railway support.
  {
    name: "pgvector_extension",
    sql: `CREATE EXTENSION IF NOT EXISTS vector`,
  },

  // ── Kinfolk Cultural Documents — vector + full-text retrieval store ────────
  // entity_id/source_id are text (not uuid) to match kinfolk_entities.id and
  // kinfolk_source_records.id which both use text PKs (gen_random_uuid()::text).
  // No FK constraints — kinfolk_entities is created by ensureKinfolkEntityRegistry
  // which runs after all startup migrations; an FK at migration time would fail.
  {
    name: "kinfolk_cultural_documents_v1",
    sql: `CREATE TABLE IF NOT EXISTS kinfolk_cultural_documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_id text,
      source_id text,
      document_type varchar(48) NOT NULL DEFAULT 'summary'
        CHECK (document_type IN ('summary','biography','event','place','topic','factsheet')),
      language_code varchar(16) NOT NULL DEFAULT 'en',
      geography_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
      category text,
      sensitivity_tier varchar(24) NOT NULL DEFAULT 'standard'
        CHECK (sensitivity_tier IN ('standard','public_interest','sensitive','regulated','excluded')),
      content text NOT NULL,
      content_tsv tsvector NOT NULL DEFAULT to_tsvector('english', ''),
      embedding_status varchar(24) NOT NULL DEFAULT 'pending'
        CHECK (embedding_status IN ('pending','ready','failed','stale','held')),
      status varchar(24) NOT NULL DEFAULT 'held'
        CHECK (status IN ('held','active','deprecated','needs_review')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "kinfolk_cultural_documents_embedding_col",
    sql: `ALTER TABLE kinfolk_cultural_documents
      ADD COLUMN IF NOT EXISTS embedding vector(1536),
      ADD COLUMN IF NOT EXISTS embedding_model text,
      ADD COLUMN IF NOT EXISTS embedding_version text`,
  },
  {
    name: "kinfolk_cultural_documents_tsv_idx",
    sql: `CREATE INDEX IF NOT EXISTS kinfolk_cultural_docs_tsv_idx
      ON kinfolk_cultural_documents USING gin (content_tsv)`,
  },
  {
    name: "kinfolk_cultural_documents_status_idx",
    sql: `CREATE INDEX IF NOT EXISTS kinfolk_cultural_docs_status_idx
      ON kinfolk_cultural_documents (status, embedding_status, language_code)`,
  },
  // HNSW index for cosine similarity — only created after vector extension confirmed
  {
    name: "kinfolk_cultural_documents_hnsw_idx",
    sql: `CREATE INDEX IF NOT EXISTS kinfolk_cultural_docs_hnsw_idx
      ON kinfolk_cultural_documents USING hnsw (embedding vector_cosine_ops)
      WHERE status = 'active' AND embedding_status = 'ready'`,
  },
  // Trigger to keep content_tsv in sync with content
  {
    name: "kinfolk_cultural_documents_tsv_trigger",
    sql: `CREATE OR REPLACE FUNCTION kinfolk_update_content_tsv()
      RETURNS trigger AS $$
      BEGIN
        NEW.content_tsv := to_tsvector('english', coalesce(NEW.content, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      DROP TRIGGER IF EXISTS kinfolk_content_tsv_update ON kinfolk_cultural_documents;
      CREATE TRIGGER kinfolk_content_tsv_update
        BEFORE INSERT OR UPDATE ON kinfolk_cultural_documents
        FOR EACH ROW EXECUTE FUNCTION kinfolk_update_content_tsv()`,
  },

  // ── Fix kinfolk_cultural_documents entity_id/source_id type mismatch ────────
  // Earlier deployments created entity_id/source_id as uuid while parent keys
  // (kinfolk_entities.id, kinfolk_source_records.id) are text. Convert in-place.
  {
    name: "kinfolk_cultural_documents_text_type_fix_v1",
    sql: `DO $$
      BEGIN
        IF to_regclass('public.kinfolk_cultural_documents') IS NOT NULL THEN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='kinfolk_cultural_documents'
              AND column_name='entity_id' AND udt_name<>'text'
          ) THEN
            ALTER TABLE public.kinfolk_cultural_documents
              ALTER COLUMN entity_id TYPE text USING entity_id::text;
          END IF;
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='kinfolk_cultural_documents'
              AND column_name='source_id' AND udt_name<>'text'
          ) THEN
            ALTER TABLE public.kinfolk_cultural_documents
              ALTER COLUMN source_id TYPE text USING source_id::text;
          END IF;
        END IF;
      EXCEPTION WHEN others THEN NULL;
      END
    $$`,
  },

  // ── Stripe schema recovery — creates stripe.accounts if stripe-replit-sync  ─
  // migrations failed or the schema was lost between Railway deploys. The table
  // shape matches stripe-replit-sync@1.0.0 migration 0046_sync_status_per_account.
  {
    name: "stripe_accounts_recovery_v1",
    sql: `DO $$
      BEGIN
        CREATE SCHEMA IF NOT EXISTS stripe;
        CREATE TABLE IF NOT EXISTS stripe.accounts (
          id                 text PRIMARY KEY,
          raw_data           jsonb NOT NULL,
          first_synced_at    timestamptz NOT NULL DEFAULT now(),
          last_synced_at     timestamptz NOT NULL DEFAULT now(),
          updated_at         timestamptz NOT NULL DEFAULT now(),
          business_name      text GENERATED ALWAYS AS
                               ((raw_data->'business_profile'->>'name')::text) STORED,
          email              text GENERATED ALWAYS AS
                               ((raw_data->>'email')::text) STORED,
          type               text GENERATED ALWAYS AS
                               ((raw_data->>'type')::text) STORED,
          charges_enabled    boolean GENERATED ALWAYS AS
                               ((raw_data->>'charges_enabled')::boolean) STORED,
          payouts_enabled    boolean GENERATED ALWAYS AS
                               ((raw_data->>'payouts_enabled')::boolean) STORED,
          details_submitted  boolean GENERATED ALWAYS AS
                               ((raw_data->>'details_submitted')::boolean) STORED,
          country            text GENERATED ALWAYS AS
                               ((raw_data->>'country')::text) STORED,
          default_currency   text GENERATED ALWAYS AS
                               ((raw_data->>'default_currency')::text) STORED,
          created            integer GENERATED ALWAYS AS
                               ((raw_data->>'created')::integer) STORED
        );
        CREATE INDEX IF NOT EXISTS idx_stripe_accounts_business_name
          ON stripe.accounts (business_name);
      EXCEPTION WHEN others THEN NULL;
      END
    $$`,
  },

  // ── Kinfolk Embedding Outbox — async embedding queue ─────────────────────
  {
    name: "kinfolk_embedding_outbox_v1",
    sql: `CREATE TABLE IF NOT EXISTS kinfolk_embedding_outbox (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id uuid NOT NULL REFERENCES kinfolk_cultural_documents(id) ON DELETE CASCADE,
      operation varchar(16) NOT NULL CHECK (operation IN ('upsert','delete','reembed')),
      attempts integer NOT NULL DEFAULT 0,
      available_at timestamptz NOT NULL DEFAULT now(),
      locked_at timestamptz,
      last_error text,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (document_id, operation)
    )`,
  },

  // ── What's Happening — enum types (idempotent via DO blocks) ─────────────
  {
    name: "whats_happening_enum_types",
    sql: `
      DO $$ BEGIN
        CREATE TYPE happening_submission_status AS ENUM (
          'member_submitted','source_checked','developing',
          'context_ready','held','rejected','archived'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE happening_source_tier AS ENUM ('A','B','C','D');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE happening_sensitivity_tier AS ENUM (
          'standard','public_interest','sensitive','regulated','excluded'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE happening_safety_case_status AS ENUM (
          'candidate_received','source_checked','needs_corroboration',
          'active_monitoring','official_imminent','resolved_or_archived','held_or_rejected'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE happening_safety_case_class AS ENUM (
          'civil_unrest','armed_conflict_or_terrorism','violent_incident',
          'natural_disaster_or_severe_weather','public_health_disruption',
          'transport_or_infrastructure_disruption','travel_advisory','evacuation_or_shelter'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `,
  },

  // ── What's Happening — submissions table ─────────────────────────────────
  {
    name: "happening_submissions_v1",
    sql: `CREATE TABLE IF NOT EXISTS happening_submissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      submitted_by_user_id varchar NOT NULL,
      submitted_url text NOT NULL,
      canonical_url text,
      member_note varchar(280),
      suggested_geography varchar(160),
      suggested_topic varchar(100),
      status varchar(24) NOT NULL DEFAULT 'member_submitted'
        CHECK (status IN ('member_submitted','source_checked','developing',
                          'context_ready','held','rejected','archived')),
      sensitivity_tier varchar(24) NOT NULL DEFAULT 'standard'
        CHECK (sensitivity_tier IN ('standard','public_interest','sensitive','regulated','excluded')),
      is_load_test boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "happening_submissions_user_idx",
    sql: `CREATE INDEX IF NOT EXISTS happening_submissions_user_idx
      ON happening_submissions (submitted_by_user_id, created_at DESC)`,
  },

  // ── What's Happening — sources table ─────────────────────────────────────
  {
    name: "happening_sources_v1",
    sql: `CREATE TABLE IF NOT EXISTS happening_sources (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_id uuid REFERENCES happening_submissions(id) ON DELETE SET NULL,
      canonical_url text NOT NULL UNIQUE,
      publisher text,
      source_title text,
      source_tier varchar(4) NOT NULL DEFAULT 'D'
        CHECK (source_tier IN ('A','B','C','D')),
      source_language varchar(16),
      published_at timestamptz,
      checked_at timestamptz,
      http_status integer,
      redirect_url text,
      content_hash text,
      source_status varchar(24) NOT NULL DEFAULT 'held'
        CHECK (source_status IN ('held','active','deprecated','needs_review')),
      attribution_excerpt text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "happening_sources_status_idx",
    sql: `CREATE INDEX IF NOT EXISTS happening_sources_status_idx
      ON happening_sources (source_status, source_tier, checked_at DESC)`,
  },

  // ── What's Happening — topics table ──────────────────────────────────────
  {
    name: "happening_topics_v1",
    sql: `CREATE TABLE IF NOT EXISTS happening_topics (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      canonical_title text NOT NULL,
      canonical_key text NOT NULL UNIQUE,
      category varchar(80) NOT NULL,
      geography_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
      language_codes text[] NOT NULL DEFAULT '{}',
      sensitivity_tier varchar(24) NOT NULL DEFAULT 'standard'
        CHECK (sensitivity_tier IN ('standard','public_interest','sensitive','regulated','excluded')),
      status varchar(24) NOT NULL DEFAULT 'pending_review'
        CHECK (status IN ('pending_review','active','held','archived','context_ready')),
      current_summary text,
      summary_source_count integer NOT NULL DEFAULT 0,
      first_seen_at timestamptz NOT NULL DEFAULT now(),
      last_updated_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  },

  // ── What's Happening — topic-source links ────────────────────────────────
  {
    name: "happening_topic_sources_v1",
    sql: `CREATE TABLE IF NOT EXISTS happening_topic_sources (
      topic_id uuid NOT NULL REFERENCES happening_topics(id) ON DELETE CASCADE,
      source_id uuid NOT NULL REFERENCES happening_sources(id) ON DELETE CASCADE,
      relationship_type varchar(32) NOT NULL
        CHECK (relationship_type IN ('primary','corroborating','background','contradicting')),
      PRIMARY KEY (topic_id, source_id)
    )`,
  },

  // ── What's Happening — topic-Library links ────────────────────────────────
  {
    name: "happening_topic_library_links_v1",
    sql: `CREATE TABLE IF NOT EXISTS happening_topic_library_links (
      topic_id uuid NOT NULL REFERENCES happening_topics(id) ON DELETE CASCADE,
      library_topic_id varchar NOT NULL,
      relationship_type varchar(32) NOT NULL
        CHECK (relationship_type IN ('background','history','civic_process','biography','geography')),
      created_by varchar NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (topic_id, library_topic_id, relationship_type)
    )`,
  },

  // ── Safety Monitoring Cases ───────────────────────────────────────────────
  {
    name: "safety_monitoring_cases_v1",
    sql: `CREATE TABLE IF NOT EXISTS safety_monitoring_cases (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      happening_topic_id uuid REFERENCES happening_topics(id) ON DELETE SET NULL,
      case_class varchar(48) NOT NULL
        CHECK (case_class IN ('civil_unrest','armed_conflict_or_terrorism','violent_incident',
          'natural_disaster_or_severe_weather','public_health_disruption',
          'transport_or_infrastructure_disruption','travel_advisory','evacuation_or_shelter')),
      status varchar(32) NOT NULL DEFAULT 'candidate_received'
        CHECK (status IN ('candidate_received','source_checked','needs_corroboration',
          'active_monitoring','official_imminent','resolved_or_archived','held_or_rejected')),
      severity varchar(16) NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info','elevated','urgent')),
      canonical_title text NOT NULL,
      geography jsonb NOT NULL DEFAULT '{}'::jsonb,
      starts_at timestamptz,
      ends_at timestamptz,
      official_action_text varchar(360),
      official_action_source_id uuid REFERENCES happening_sources(id),
      confidence_reason jsonb NOT NULL DEFAULT '{}'::jsonb,
      requires_curator_review boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      resolved_at timestamptz,
      UNIQUE (happening_topic_id)
    )`,
  },

  // ── Delivery preference tables ────────────────────────────────────────────
  {
    name: "happening_delivery_preferences_v1",
    sql: `CREATE TABLE IF NOT EXISTS happening_delivery_preferences (
      user_id varchar PRIMARY KEY,
      followed_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
      followed_geographies jsonb NOT NULL DEFAULT '[]'::jsonb,
      followed_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
      preferred_languages jsonb NOT NULL DEFAULT '["en"]'::jsonb,
      delivery_mode varchar(16) NOT NULL DEFAULT 'none'
        CHECK (delivery_mode IN ('none','in_feed','digest')),
      allow_public_interest_updates boolean NOT NULL DEFAULT false,
      allow_sensitive_current_events boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "safety_monitoring_preferences_v1",
    sql: `CREATE TABLE IF NOT EXISTS safety_monitoring_preferences (
      user_id varchar PRIMARY KEY,
      followed_geographies jsonb NOT NULL DEFAULT '[]'::jsonb,
      allow_in_app_safety_updates boolean NOT NULL DEFAULT false,
      allow_sensitive_safety_updates boolean NOT NULL DEFAULT false,
      allow_external_safety_notifications boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  },

  // ── Compound tag tokens — Aliases addendum ────────────────────────────────
  {
    name: "compound_tag_tokens_v1",
    sql: `CREATE TABLE IF NOT EXISTS compound_tag_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      display_tag text NOT NULL,
      normalized_tag text NOT NULL UNIQUE,
      tokens text[] NOT NULL DEFAULT '{}',
      entity_candidates text[] NOT NULL DEFAULT '{}',
      place_candidates text[] NOT NULL DEFAULT '{}',
      intent_candidates text[] NOT NULL DEFAULT '{}',
      parse_status varchar(24) NOT NULL DEFAULT 'pending'
        CHECK (parse_status IN ('pending','parsed','failed')),
      post_count integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  {
    name: "compound_tag_tokens_idx",
    sql: `CREATE INDEX IF NOT EXISTS compound_tag_tokens_normalized_idx
      ON compound_tag_tokens (normalized_tag)`,
  },

  // ── Community place aliases — city-scoped neighborhood nicknames ──────────
  {
    name: "community_place_aliases_v1",
    sql: `CREATE TABLE IF NOT EXISTS community_place_aliases (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      alias_text text NOT NULL,
      normalized_alias text NOT NULL,
      parent_city varchar(120) NOT NULL,
      parent_state varchar(80),
      parent_country_code varchar(4) NOT NULL DEFAULT 'US',
      canonical_place_name text NOT NULL,
      canonical_place_id text,
      confidence numeric(4,3) NOT NULL DEFAULT 0.5
        CHECK (confidence >= 0 AND confidence <= 1),
      status varchar(24) NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed','active','held','deprecated')),
      provenance text,
      confirmation_count integer NOT NULL DEFAULT 0,
      confirmation_fingerprints text[] NOT NULL DEFAULT '{}',
      proposed_by_user_id varchar NOT NULL,
      approved_by varchar,
      approved_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (normalized_alias, parent_city, parent_country_code)
    )`,
  },
  {
    name: "community_place_aliases_lookup_idx",
    sql: `CREATE INDEX IF NOT EXISTS community_place_aliases_lookup_idx
      ON community_place_aliases (normalized_alias, parent_city, status)`,
  },

  // ── Age Assurance v1 ─────────────────────────────────────────────────────
  {
    name: "age_assurance_user_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS user_age_assurance (
      user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      age_band VARCHAR(16) NOT NULL DEFAULT 'unknown'
        CHECK (age_band IN ('unknown', 'under_13', '13_15', '16_17', '18_plus')),
      assurance_method VARCHAR(32) NOT NULL DEFAULT 'unconfirmed'
        CHECK (assurance_method IN (
          'unconfirmed', 'self_attested_band', 'self_attested_dob',
          'parental_consent', 'verified_provider'
        )),
      policy_version VARCHAR(64) NOT NULL DEFAULT 'age-assurance-v1',
      assured_at TIMESTAMPTZ,
      next_recheck_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "age_assurance_band_idx",
    sql: `CREATE INDEX IF NOT EXISTS idx_user_age_assurance_band ON user_age_assurance(age_band)`,
  },
  {
    name: "content_audience_policy_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS content_audience_policy (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_type VARCHAR(64) NOT NULL CHECK (resource_type IN (
        'library_topic_version', 'knowledge_article', 'happening_story',
        'community_post', 'community_media', 'kinfolk_response', 'event', 'business_media'
      )),
      resource_id VARCHAR(255) NOT NULL,
      minimum_age_band VARCHAR(16) NOT NULL DEFAULT '13_15'
        CHECK (minimum_age_band IN ('13_15', '16_17', '18_plus')),
      sensitivity_tags TEXT[] NOT NULL DEFAULT '{}',
      graphic_level VARCHAR(16) NOT NULL DEFAULT 'none'
        CHECK (graphic_level IN ('none', 'limited', 'graphic')),
      requires_context_screen BOOLEAN NOT NULL DEFAULT FALSE,
      policy_reason TEXT,
      assigned_by_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(resource_type, resource_id)
    )`,
  },
  {
    name: "age_delivery_audit_events_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS age_delivery_audit_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_type VARCHAR(64) NOT NULL,
      resource_id VARCHAR(255),
      decision VARCHAR(24) NOT NULL
        CHECK (decision IN ('allowed', 'adapted', 'context_screen', 'blocked')),
      audience_band_at_decision VARCHAR(16) NOT NULL,
      policy_version VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "age_delivery_audit_events_idx",
    sql: `CREATE INDEX IF NOT EXISTS idx_age_delivery_events_user_created
      ON age_delivery_audit_events(user_id, created_at DESC)`,
  },

  // ── Kinfolk Depth Learning v1 ────────────────────────────────────────────
  {
    name: "kinfolk_delivery_profiles_adaptive_depth_cols",
    sql: `ALTER TABLE kinfolk_delivery_profiles
      ADD COLUMN IF NOT EXISTS adaptive_depth_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS adaptive_depth_prompt_dismissed_until TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS depth_updated_from VARCHAR(32) NOT NULL DEFAULT 'taste_profile'`,
  },
  {
    name: "kinfolk_depth_feedback_events_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS kinfolk_depth_feedback_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      domain_class VARCHAR(32) NOT NULL CHECK (domain_class IN (
        'general', 'culture', 'education', 'local_discovery', 'current_events',
        'health', 'legal', 'financial', 'safety', 'relationships', 'religion_culture'
      )),
      action VARCHAR(16) NOT NULL CHECK (action IN ('show_more', 'show_less')),
      eligible_for_default_learning BOOLEAN NOT NULL DEFAULT FALSE,
      age_band_at_action VARCHAR(16) NOT NULL
        CHECK (age_band_at_action IN ('unknown', 'under_13', '13_15', '16_17', '18_plus')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "kinfolk_depth_feedback_events_idx",
    sql: `CREATE INDEX IF NOT EXISTS idx_kinfolk_depth_feedback_user_created
      ON kinfolk_depth_feedback_events(user_id, created_at DESC)`,
  },
  {
    name: "kinfolk_answer_plans_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS kinfolk_answer_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_id VARCHAR(255),
      domain_class VARCHAR(32) NOT NULL,
      is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
      audience_band VARCHAR(16) NOT NULL,
      plan_json JSONB NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "kinfolk_answer_plans_expiry_idx",
    sql: `CREATE INDEX IF NOT EXISTS idx_kinfolk_answer_plans_user_expiry
      ON kinfolk_answer_plans(user_id, expires_at DESC)`,
  },

  // ── Library Adaptive Content v1 ──────────────────────────────────────────
  {
    name: "library_topic_versions_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS library_topic_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_id UUID NOT NULL REFERENCES knowledge_topics(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL DEFAULT 1,
      depth VARCHAR(16) NOT NULL DEFAULT 'standard'
        CHECK (depth IN ('brief', 'standard', 'deep', 'deep_non_graphic')),
      domain_policy VARCHAR(32) NOT NULL DEFAULT 'general',
      status VARCHAR(16) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'curator_review', 'published', 'archived')),
      content_json JSONB,
      curator_note TEXT,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(topic_id, depth, status)
    )`,
  },
  {
    name: "library_evidence_claims_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS library_evidence_claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_version_id UUID NOT NULL REFERENCES library_topic_versions(id) ON DELETE CASCADE,
      claim_text TEXT NOT NULL,
      claim_type VARCHAR(32) NOT NULL DEFAULT 'factual',
      confidence VARCHAR(16) NOT NULL DEFAULT 'high'
        CHECK (confidence IN ('high', 'medium', 'low', 'contested')),
      is_graphic BOOLEAN NOT NULL DEFAULT FALSE,
      is_adult_detail BOOLEAN NOT NULL DEFAULT FALSE,
      source_tier VARCHAR(16) NOT NULL DEFAULT 'general',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "library_user_depth_preferences_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS library_user_depth_preferences (
      user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      default_depth VARCHAR(16) NOT NULL DEFAULT 'standard'
        CHECK (default_depth IN ('brief', 'standard', 'deep')),
      updated_from VARCHAR(32) NOT NULL DEFAULT 'default',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  {
    name: "library_depth_events_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS library_depth_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic_id UUID,
      action VARCHAR(16) NOT NULL CHECK (action IN ('show_more', 'show_less')),
      depth_after VARCHAR(16) NOT NULL,
      eligible_for_learning BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  },
  // ── Member Identity Context (sex, gender, pronouns) — Aug 2026 ──────────
  // Private, voluntary, changeable. Never joined into broad user queries.
  {
    name: "user_identity_context_table_v1",
    sql: `CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS user_identity_context (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sex_assigned_at_birth VARCHAR(24)
    CHECK (sex_assigned_at_birth IN ('female','male','intersex','prefer_not_to_say')),
  gender_identity VARCHAR(24)
    CHECK (gender_identity IN ('woman','man','nonbinary','another_identity','prefer_not_to_say')),
  pronoun_set VARCHAR(24)
    CHECK (pronoun_set IN ('she_her','he_him','they_them','use_my_name','custom','prefer_not_to_say')),
  custom_pronouns_ciphertext TEXT,
  custom_pronouns_key_version VARCHAR(32),
  allow_medically_relevant_context BOOLEAN NOT NULL DEFAULT FALSE,
  allow_pronoun_aware_language BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT custom_pronouns_requires_custom_set CHECK (
    (pronoun_set = 'custom' AND custom_pronouns_ciphertext IS NOT NULL)
    OR (pronoun_set <> 'custom' AND custom_pronouns_ciphertext IS NULL)
    OR (pronoun_set IS NULL AND custom_pronouns_ciphertext IS NULL)
  )
)`,
  },
  {
    name: "user_identity_context_audit_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS user_identity_context_audit (
  id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  changed_fields TEXT[] NOT NULL,
  reason VARCHAR(40) NOT NULL CHECK (reason IN ('member_update','privacy_support','account_deletion')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`,
  },
  {
    name: "user_identity_context_audit_idx_v1",
    sql: `CREATE INDEX IF NOT EXISTS user_identity_context_audit_user_idx
      ON user_identity_context_audit(user_id, occurred_at DESC)`,
  },
  {
    name: "business_safety_experiences_gender_context_v1",
    sql: `ALTER TABLE business_safety_experiences
      ADD COLUMN IF NOT EXISTS voluntary_gender_context VARCHAR(24)
        CHECK (voluntary_gender_context IN ('woman','man','nonbinary','another_identity','prefer_not_to_say')),
      ADD COLUMN IF NOT EXISTS gender_context_consent_at TIMESTAMPTZ`,
  },
  // ── Business enrichment columns (Aug 2026) ─────────────────────────────────
  // needs_verification: true when Google Places cannot confirm this business exists.
  // enriched_at: timestamp of last enrichment pass.
  // enrichment_note: human-readable note about enrichment result (e.g. "Could not find online as of 2026-08-13").
  // enrichment_source: which data source was used ('google_places', 'yelp', 'manual').
  {
    name: "businesses_enrichment_cols_v1",
    sql: `ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS needs_verification BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS enrichment_note TEXT,
      ADD COLUMN IF NOT EXISTS enrichment_source VARCHAR(50)`,
  },
  // ── Widen businesses text columns — URLs/addresses can exceed varchar(255) ─────
  {
    // Wrapped in DO $$ guard: ALTER COLUMN TYPE TEXT fails if column is already TEXT.
    name: "businesses_hours_text_v1",
    sql: `DO $$ BEGIN
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='hours') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN hours TYPE TEXT;
      END IF;
    END $$`,
  },
  {
    // Wrapped in DO $$ guard: ALTER COLUMN TYPE TEXT fails if columns are already TEXT.
    // Each column is checked individually so partial completion on a prior boot doesn't fail the whole block.
    name: "businesses_url_cols_text_v1",
    sql: `DO $$ BEGIN
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='website') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN website TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='facebook') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN facebook TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='instagram') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN instagram TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='tiktok') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN tiktok TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='twitter') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN twitter TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='youtube') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN youtube TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='pinterest') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN pinterest TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='address') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN address TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='business_tagline') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN business_tagline TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='hidden_gem_tagline') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN hidden_gem_tagline TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='service_area') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN service_area TYPE TEXT;
      END IF;
      IF (SELECT udt_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='businesses' AND column_name='name') != 'text' THEN
        ALTER TABLE businesses ALTER COLUMN name TYPE TEXT;
      END IF;
    END $$`,
  },
  // ── Recurring events: active_until for auto-expiry (#121) ──────────────────
  // Events with a known end date auto-hide from the map when that date passes.
  // NULL means "show indefinitely while is_active = true" (existing behavior).
  {
    name: "recurring_events_active_until_v1",
    sql: `ALTER TABLE recurring_events
      ADD COLUMN IF NOT EXISTS active_until DATE`,
  },
  // ── Category tag mapping table ──────────────────────────────────────────────
  // Enforces that Community Says / vibe tags shown on a business page match its category.
  // category: main business category (e.g. "Food & Drink", "Beauty & Personal Care")
  // tag_type: 'vibe' or 'endorsement' or 'the_real'
  // tag_name: the tag label
  {
    name: "category_tag_mapping_v1",
    sql: `CREATE TABLE IF NOT EXISTS category_tag_mapping (
      id SERIAL PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      tag_type VARCHAR(20) NOT NULL CHECK (tag_type IN ('vibe','endorsement','the_real')),
      tag_name VARCHAR(100) NOT NULL,
      UNIQUE(category, tag_type, tag_name)
    )`,
  },
  {
    name: "category_tag_mapping_seed_v1",
    sql: `INSERT INTO category_tag_mapping (category, tag_type, tag_name) VALUES
      -- Food & Drink vibes
      ('Food & Drink','vibe','Romantic'),('Food & Drink','vibe','Chill'),('Food & Drink','vibe','Turn Up'),
      ('Food & Drink','vibe','Grown Folks'),('Food & Drink','vibe','Family Time'),('Food & Drink','vibe','Live Music'),
      ('Food & Drink','vibe','Eat Good'),('Food & Drink','vibe','Date Night'),('Food & Drink','vibe','Sunday Brunch'),
      ('Food & Drink','vibe','Late Night'),
      -- Food & Drink endorsements
      ('Food & Drink','endorsement','Seasoned Right'),('Food & Drink','endorsement','Worth The Wait'),
      ('Food & Drink','endorsement','Grandma Approved'),('Food & Drink','endorsement','Made From Scratch'),
      ('Food & Drink','endorsement','Portions Generous'),('Food & Drink','endorsement','Abuela Approved'),
      ('Food & Drink','endorsement','Worth The Drive'),('Food & Drink','endorsement','Cookout Approved'),
      -- Beauty & Personal Care vibes
      ('Beauty & Personal Care','vibe','Soft Life'),('Beauty & Personal Care','vibe','Auntie Energy'),
      ('Beauty & Personal Care','vibe','Main Character Energy'),('Beauty & Personal Care','vibe','Sunday Best'),
      ('Beauty & Personal Care','vibe','Chill & Restore'),('Beauty & Personal Care','vibe','Come As You Are'),
      ('Beauty & Personal Care','vibe','For The Culture'),('Beauty & Personal Care','vibe','Neighborhood Love'),
      ('Beauty & Personal Care','vibe','Luxury Without The Attitude'),
      -- Beauty & Personal Care endorsements
      ('Beauty & Personal Care','endorsement','On Time Every Time'),('Beauty & Personal Care','endorsement','Clean Station'),
      ('Beauty & Personal Care','endorsement','Worth The Price'),('Beauty & Personal Care','endorsement','Blessed Hands'),
      ('Beauty & Personal Care','endorsement','They Know Our Hair'),('Beauty & Personal Care','endorsement','Sharpest Lineup'),
      ('Beauty & Personal Care','endorsement','Fresh To Death'),('Beauty & Personal Care','endorsement','Knows My Texture'),
      ('Beauty & Personal Care','endorsement','Style Lasted'),('Beauty & Personal Care','endorsement','Didn''t Overbook Me'),
      -- Health & Wellness "The Real"
      ('Health & Wellness','the_real','This Doctor Listens'),('Health & Wellness','the_real','Believed My Pain'),
      ('Health & Wellness','the_real','Bedside Manner On Point'),('Health & Wellness','the_real','Made Me Feel Heard'),
      ('Health & Wellness','the_real','Fought For Me'),('Health & Wellness','the_real','Culturally Competent'),
      ('Health & Wellness','the_real','Explained It Plain'),('Health & Wellness','the_real','Didn''t Rush Me'),
      -- Legal & Government "The Real"
      ('Legal & Government','the_real','Fought For Me'),('Legal & Government','the_real','Returned My Calls'),
      ('Legal & Government','the_real','Understood My Situation'),('Legal & Government','the_real','Worth Every Dollar'),
      ('Legal & Government','the_real','Explained The Process'),('Legal & Government','the_real','Actually Showed Up'),
      -- Financial & Business "The Real"
      ('Financial & Business','the_real','Said Yes When Others Said No'),('Financial & Business','the_real','Explained It Plain'),
      ('Financial & Business','the_real','Helped My Credit'),('Financial & Business','the_real','Transparent Fees'),
      ('Financial & Business','the_real','No Predatory Terms'),('Financial & Business','the_real','Built My Business Plan'),
      -- Entertainment & Nightlife vibes
      ('Entertainment & Nightlife','vibe','Turn Up'),('Entertainment & Nightlife','vibe','Grown Folks'),
      ('Entertainment & Nightlife','vibe','Chill'),('Entertainment & Nightlife','vibe','Live Music'),
      ('Entertainment & Nightlife','vibe','Date Night'),('Entertainment & Nightlife','vibe','Late Night'),
      ('Entertainment & Nightlife','vibe','VIP Energy'),('Entertainment & Nightlife','vibe','No Drama'),
      ('Entertainment & Nightlife','vibe','Good Energy Only'),
      -- Entertainment & Nightlife endorsements
      ('Entertainment & Nightlife','endorsement','DJ Knows The Culture'),
      ('Entertainment & Nightlife','endorsement','Security Respectful'),
      ('Entertainment & Nightlife','endorsement','Drinks Worth The Price'),
      ('Entertainment & Nightlife','endorsement','Always A Good Time'),
      ('Entertainment & Nightlife','endorsement','Safe Vibes'),
      -- Retail & Shopping vibes
      ('Retail & Shopping','vibe','Hidden Gem'),('Retail & Shopping','vibe','Curated'),
      ('Retail & Shopping','vibe','For The Culture'),('Retail & Shopping','vibe','Neighborhood Love'),
      ('Retail & Shopping','vibe','Luxury Without The Attitude'),('Retail & Shopping','vibe','Support Small'),
      -- Retail endorsements
      ('Retail & Shopping','endorsement','Found Something Unique'),('Retail & Shopping','endorsement','Prices Fair'),
      ('Retail & Shopping','endorsement','Owner Knows Your Name'),('Retail & Shopping','endorsement','Quality Over Quantity'),
      -- Travel & Hospitality vibes
      ('Travel & Hospitality','vibe','Romantic'),('Travel & Hospitality','vibe','Chill'),
      ('Travel & Hospitality','vibe','Luxury'),('Travel & Hospitality','vibe','Family'),
      ('Travel & Hospitality','vibe','Solo Traveler Friendly'),('Travel & Hospitality','vibe','Hair Friendly'),
      -- Travel endorsements
      ('Travel & Hospitality','endorsement','Felt Safe As A Minority'),('Travel & Hospitality','endorsement','Staff Respectful'),
      ('Travel & Hospitality','endorsement','Clean'),('Travel & Hospitality','endorsement','Worth The Price'),
      -- Professional Services "The Real"
      ('Professional Services','the_real','Delivered On Time'),('Professional Services','the_real','Worth The Investment'),
      ('Professional Services','the_real','Understood My Vision'),('Professional Services','the_real','Exceeded Expectations'),
      -- Home & Property "The Real"
      ('Home & Property','the_real','Fixed It Right The First Time'),('Home & Property','the_real','Fair Price'),
      ('Home & Property','the_real','Showed Up On Time'),('Home & Property','the_real','Clean Work'),
      -- Automotive "The Real"
      ('Automotive & Transportation','the_real','Honest Diagnosis'),('Automotive & Transportation','the_real','Fair Labor Rate'),
      ('Automotive & Transportation','the_real','Didn''t Assume I Don''t Know Cars'),
      ('Automotive & Transportation','the_real','Quick Turnaround'),
      -- Education & Children endorsements (no vibes)
      ('Education & Children','endorsement','My Kids See Themselves'),('Education & Children','endorsement','Culturally Affirming'),
      ('Education & Children','endorsement','Safe For My Baby'),('Education & Children','endorsement','Patient With My Child'),
      -- Faith & Spiritual vibes
      ('Faith & Spiritual','vibe','The Spirit Lives Here'),('Faith & Spiritual','vibe','Community Not Just Congregation'),
      ('Faith & Spiritual','vibe','All Are Welcome And Mean It'),('Faith & Spiritual','vibe','Come As You Are'),
      -- Faith endorsements
      ('Faith & Spiritual','endorsement','Youth Programs Strong'),('Faith & Spiritual','endorsement','Feeds The Community')
      ON CONFLICT DO NOTHING`,
  },

  // ── Delete community posts by test accounts ────────────────────────────────
  // Apple Reviewer, Manus AI testers, and load-test accounts sometimes post
  // during UAT. This runs every boot so test posts never accumulate in prod.
  // The DELETE is scoped to known test emails + is_load_test flag — it is
  // safe to run on every deploy because real member posts have real user IDs
  // that do not match any of these conditions.
  {
    name: "delete_test_account_community_posts_v1",
    sql: `DELETE FROM community_posts
      WHERE author_id IN (
        SELECT id FROM users
        WHERE email IN (
          'apple.reviewer@mappingwithmelanin.com',
          'tester@mwm.com',
          'manus@mappingwithmelanin.com',
          'manus.geo@mappingwithmelanin.com'
        )
        OR is_load_test = true
      )`,
  },

  // ── P0-B: Community test-content quarantine — column + audit table ─────────
  // Adds internal_test_content boolean so posts can be excluded from all feed
  // branches without a hard DELETE. Preserves rollback capability.
  {
    name: "community_posts_internal_test_content_col_v1",
    sql: `ALTER TABLE community_posts
      ADD COLUMN IF NOT EXISTS internal_test_content boolean NOT NULL DEFAULT false`,
  },
  {
    name: "community_post_internal_quarantine_table_v1",
    sql: `CREATE TABLE IF NOT EXISTS community_post_internal_quarantine (
      post_id                    varchar PRIMARY KEY,
      original_visibility        varchar(32),
      original_requires_moderation boolean,
      quarantine_reason          text NOT NULL,
      quarantined_at             timestamptz NOT NULL DEFAULT now(),
      quarantined_by             text NOT NULL DEFAULT 'p0_launch_cleanup_20260813'
    )`,
  },

  // ── P0-B: Quarantine all review/smoke/load-test posts ─────────────────────
  // Catches posts whose author_name is 'Apple Reviewer', 'App Reviewer', etc.
  // even when the user's email address doesn't match the known test-email list
  // (Apple uses private relay addresses for Review accounts).
  // Idempotent: ON CONFLICT DO NOTHING + UPDATE only where internal_test_content=false.
  // Rollback: restore from community_post_internal_quarantine, set internal_test_content=false.
  {
    name: "quarantine_test_reviewer_posts_v1",
    sql: `DO $$
      BEGIN
        -- Record original visibility for each test/reviewer post not yet quarantined
        INSERT INTO community_post_internal_quarantine
          (post_id, original_visibility, original_requires_moderation, quarantine_reason)
        SELECT
          cp.id,
          cp.visibility,
          cp.requires_moderation,
          'load-test/reviewer/smoke-test content excluded from production feed'
        FROM community_posts cp
        LEFT JOIN users u ON u.id = cp.author_id
        WHERE COALESCE(u.is_load_test, false) = true
           OR lower(COALESCE(cp.author_name, '')) IN (
                'apple reviewer', 'app reviewer', 'smoke test', 'load test'
              )
           OR lower(btrim(COALESCE(cp.content, ''))) IN (
                'smoke test post - ignore',
                'smoke test post — ignore'
              )
        ON CONFLICT (post_id) DO NOTHING;

        -- Mark quarantined posts so feed queries can exclude them without re-scanning users
        UPDATE community_posts cp
        SET internal_test_content = true,
            visibility = 'followers_only',
            requires_moderation = true
        FROM community_post_internal_quarantine q
        WHERE q.post_id = cp.id
          AND cp.internal_test_content = false;
      EXCEPTION WHEN others THEN NULL;
      END
    $$`,
  },
  {
    // #121 — Deactivate recurring_events that are past their active_until date.
    // The discoverability-pins query already filters these out, but leaving
    // is_active=true on expired events causes them to appear in other queries
    // (admin lists, search) that only check is_active. Runs every boot; safe
    // because active_until < CURRENT_DATE is a stable past condition.
    name: "deactivate_expired_recurring_events_v1",
    sql: `
      UPDATE recurring_events
      SET    is_active = false,
             updated_at = NOW()
      WHERE  is_active = true
        AND  active_until IS NOT NULL
        AND  active_until < CURRENT_DATE
    `,
  },
  {
    // #320 — Hide confirmed duplicate business records (seeding loop bugs).
    // Uses UPDATE SET status='permanently_hidden' (not DELETE) so data is
    // preserved. Idempotent: once duplicates are hidden the subquery returns
    // only the surviving record, and id != <its own id> matches nothing.
    name: "hide_confirmed_duplicate_businesses_v1",
    sql: `
      -- Duke's Cafe, Horsham PA — 91 copies from seeding loop (keep oldest)
      UPDATE businesses SET status = 'permanently_hidden'
      WHERE  status = 'active'
        AND  lower(name) LIKE '%duke%cafe%'
        AND  lower(city) = 'horsham'
        AND  id != COALESCE(
               (SELECT id FROM businesses
                WHERE  status = 'active'
                  AND  lower(name) LIKE '%duke%cafe%'
                  AND  lower(city) = 'horsham'
                ORDER BY created_at ASC LIMIT 1),
               id
             );

      -- Harold & Belle's, Los Angeles — 2 copies (keep oldest)
      UPDATE businesses SET status = 'permanently_hidden'
      WHERE  status = 'active'
        AND  lower(name) LIKE '%harold%belle%'
        AND  lower(state) = 'ca'
        AND  id != COALESCE(
               (SELECT id FROM businesses
                WHERE  status = 'active'
                  AND  lower(name) LIKE '%harold%belle%'
                  AND  lower(state) = 'ca'
                ORDER BY created_at ASC LIMIT 1),
               id
             );

      -- Roscoe's House of Chicken & Waffles, Los Angeles — 2 copies (keep oldest)
      UPDATE businesses SET status = 'permanently_hidden'
      WHERE  status = 'active'
        AND  lower(name) LIKE '%roscoe%chicken%'
        AND  lower(state) = 'ca'
        AND  id != COALESCE(
               (SELECT id FROM businesses
                WHERE  status = 'active'
                  AND  lower(name) LIKE '%roscoe%chicken%'
                  AND  lower(state) = 'ca'
                ORDER BY created_at ASC LIMIT 1),
               id
             );

      -- Simply Wholesome, Los Angeles — 2 copies (keep oldest)
      UPDATE businesses SET status = 'permanently_hidden'
      WHERE  status = 'active'
        AND  lower(name) LIKE '%simply wholesome%'
        AND  lower(state) = 'ca'
        AND  id != COALESCE(
               (SELECT id FROM businesses
                WHERE  status = 'active'
                  AND  lower(name) LIKE '%simply wholesome%'
                  AND  lower(state) = 'ca'
                ORDER BY created_at ASC LIMIT 1),
               id
             )
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
    ["LA businesses",        () => ensureLABusinesses(log, warn)],
    ["test data cleanup",    () => ensureTestDataRemoved(log, warn)],
    ["coverage expansion",   () => ensureCoverageExpansion(log, warn)],
    ["founder churches",     () => ensureFounderChurches(log, warn)],
    ["phuket full layer",    () => ensurePhuketFullLayer(log, warn)],
    ["category normalize",   () => ensureCategoryNormalization(log, warn)],
    ["gap coverage v2",      () => ensureGapCoverageV2(log, warn)],
    ["final micro seed",     () => ensureFinalMicroSeed(log, warn)],
    // ── Business discoverability — promotes listing_status, sets tags + badges ──
    ["business discoverability", () => ensureBusinessDiscoverability(log, warn)],
    // ── Demo removal — wipes all [DEMO] businesses (safe, checks for member data) ──
    ["demo removal",          () => ensureDemoRemoval(log, warn)],
    // ── Full diaspora expansion — every community, every city ──────────────────────
    ["la diaspora v1",        () => runSeedBatch("LA Diaspora V1", LA_DIASPORA_V1, log, warn)],
    ["east coast diaspora",   () => runSeedBatch("East Coast Diaspora", EAST_COAST_DIASPORA_V1, log, warn)],
    ["south diaspora",        () => runSeedBatch("South Diaspora", SOUTH_DIASPORA_V1, log, warn)],
    ["midwest west diaspora", () => runSeedBatch("Midwest/West Diaspora", MIDWEST_WEST_DIASPORA_V1, log, warn)],
    // ── Priority cities cultural heritage sites (Philly, DC, Richmond, Charlotte, etc.) ──
    ["priority cultural sites", () => runTourCulturalSitesBatch("Priority Cultural V1", PRIORITY_CULTURAL_V1, log, warn)],
    // ── South cities cultural heritage sites (ATL, NOLA, Houston, Miami, Birmingham, etc.) ──
    ["south cultural sites", () => runTourCulturalSitesBatch("South Cultural V1", SOUTH_CULTURAL_V1, log, warn)],
    // ── Priority practical services — dentists, daycares, plumbers, bars ───────
    ["priority practical v1", () => runSeedBatch("Priority Practical V1", PRIORITY_PRACTICAL_V1, log, warn)],
    // ── Phuket + International cultural heritage sites ──────────────────────────
    ["phuket intl cultural sites", () => runTourCulturalSitesBatch("Phuket/Intl Cultural V1", PHUKET_INTERNATIONAL_CULTURAL_V1, log, warn)],
    // ── Phuket + Thailand knowledge topics ────────────────────────────────────
    ["phuket knowledge topics", () => runKnowledgeTopicsBatch("Phuket Knowledge Topics V1", PHUKET_KNOWLEDGE_TOPICS_V1, log, warn)],
    // ── Library evidence — 7 diaspora Books (P0 repair Aug 12 2026) ───────────
    ["library diaspora evidence", () => ensureLibraryDiasporaEvidence(log, warn)],
    // ── Library evidence — Batches B/C/D (remaining categories Aug 12 2026) ───
    ["library evidence batch B",  () => ensureLibraryEvidenceBatchB(log, warn)],
    ["library evidence batch C",  () => ensureLibraryEvidenceBatchC(log, warn)],
    ["library evidence batch D",  () => ensureLibraryEvidenceBatchD(log, warn)],
    // ── Capacity canary — 30 tagged load-test accounts ─────────────────────────
    ["load-test accounts",    () => ensureLoadTestAccounts(log, warn)],
    // ── Discoverability coordinate audit — validate + report per-collection counts ──
    ["discoverability coords v1", () => ensureDiscoverabilityCoordinatesV1(log, warn)],
    // ── Library source link health — marks known-stale URLs, runs initial sweep ──
    ["library link health", () => ensureLibraryLinkHealth(log, warn)],
    // ── Business claims v2 — conflict report + unique index attempt ─────────
    ["business claims v2 indexes", () => ensureBusinessClaimsV2ConflictReport(log, warn)],
    // ── Kinfolk entity registry tables — kinfolk_entities + kinfolk_entity_aliases ──
    ["kinfolk entity registry", () => ensureKinfolkEntityRegistry(log, warn)],
    // ── Education institutions — colleges, universities, HBCUs + seed data ──
    ["education institutions",   () => ensureEducationInstitutions(log, warn)],
    // ── Philadelphia murals — site_type column, site_contributions table, 55 seed murals ──
    ["philadelphia murals",      () => ensurePhiladelphiaMurals(log, warn)],
    // ── Kinfolk cultural context v1 — source registry, entity disambiguation, new columns ──
    ["kinfolk cultural context v1", () => ensureKinfolkCulturalContextV1(log, warn)],
    // ── Minority-owned laundry businesses — every covered city ─────────────────
    ["laundry businesses v1",    () => ensureLaundryBusinesses(log, warn)],
    // ── Diaspora murals — all cities except Philadelphia (already seeded) ───────
    ["murals diaspora v1",       () => ensureMuralsBatch(log, warn)],
    // ── Monuments, museums, spiritual sites — all cities ───────────────────────
    ["monuments cultural v1",    () => ensureCulturalTourSiteBatch(log, warn)],
    // ── Minority-owned food trucks — all cities ────────────────────────────────
    ["food trucks v1",           () => ensureBusinessBatch("food-trucks-v1", FOOD_TRUCKS_V1, log, warn)],
    // ── Minority-owned dispensaries — legal-cannabis jurisdictions only ─────────
    ["dispensaries v1",          () => ensureBusinessBatch("dispensaries-v1", DISPENSARIES_V1, log, warn)],
    // ── Allied partner applications table — 5-stage partner journey (#84) ────
    ["allied partner applications v1", () => ensureAlliedPartnerApplications(log, warn)],
    // ── City-centroid coordinate fallback for events with no address (#100) ──
    ["recurring events city coords v1", () => ensureRecurringEventsCityCoords(log, warn)],
    // ── Business contact completeness — provenance tracking + data-quality index ──
    ["business contact completeness v1", () => ensureBusinessContactCompleteness(log, warn)],
    // ── Sabor website correction — founder-confirmed official domain ───────────
    ["sabor website correction v1", () => ensureSaborWebsiteCorrection(log, warn)],
    // ── Canonical place deduplication — website-aware, reversible, never deletes ─
    ["canonical places v1", () => ensureCanonicalPlacesV1(log, warn)],
    // ── Business dedup schema — adds dedupe_key, normalized_name, is_duplicate cols ─
    ["business dedup schema v1", () => ensureBusinessDedupSchema(log, warn)],
    // ── Business dedup marking — soft-marks 17 known duplicate groups by audit ID ─
    ["business dedup marking v1", () => ensureBusinessDeduplication(log, warn)],
    // ── Business review items — seeds 8 manual-review records + creates table ──────
    ["business review items v1", () => ensureBusinessReviewItems(log, warn)],
    // ── User handles — short @mention identifier for community posts ──────────
    ["user handles v1", () => ensureUserHandles(log, warn)],
    // ── Visibility hardening — public view + canonical dedupe index ───────────
    ["visibility and dedupe hardening v1", () => ensureVisibilityAndDedupeHardening(log, warn)],
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
// Coordinate coverage audit — logs the current coordinate state for all three
// non-business map collections. Does NOT make any external API calls.
//
// NOTE: The public Nominatim batch geocoder that previously ran here was removed
// because OSM policy prohibits boot-time bulk geocoding at rates above 1 req/sec,
// and the batch was issuing requests at ~10 req/sec (100ms sleep).
//
// Records without coordinates are correctly excluded from /api/maps/discoverability-pins
// by the coordinate validity check in that route. No city-centroid fabrication is used.
//
// To geocode remaining records, a licensed provider (Google Geocoding API once
// the key has Geocoding API enabled, OpenCage, or Mapbox) must be used with
// proper credentials, per-request caching, and a one-time offline import — not
// a boot-time loop.
async function geocodeTourContent(
  log: (msg: string) => void,
  _warn: (msg: string) => void
): Promise<void> {
  try {
    const [sites, orgs, events] = await Promise.all([
      pool.query<{ total: string; with_coords: string; missing: string }>(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                  AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
                  AND NOT (latitude = 0 AND longitude = 0)) AS with_coords,
                COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS missing
         FROM tour_cultural_sites`
      ),
      pool.query<{ total: string; with_coords: string; missing: string }>(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                  AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
                  AND NOT (latitude = 0 AND longitude = 0)) AS with_coords,
                COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS missing
         FROM community_organizations`
      ),
      pool.query<{ total: string; with_coords: string; missing: string }>(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                  AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180
                  AND NOT (latitude = 0 AND longitude = 0)) AS with_coords,
                COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS missing
         FROM recurring_events`
      ),
    ]);
    const s = sites.rows[0];
    const o = orgs.rows[0];
    const e = events.rows[0];
    log(`Coordinate coverage audit — tour_cultural_sites: ${s.with_coords}/${s.total} valid (${s.missing} missing) | community_organizations: ${o.with_coords}/${o.total} valid (${o.missing} missing) | recurring_events: ${e.with_coords}/${e.total} valid (${e.missing} missing)`);
  } catch (err: unknown) {
    log(`Coordinate coverage audit skipped: ${err instanceof Error ? err.message : String(err)}`);
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

    // ── Community events expansion — multi-city festivals, markets, gatherings ──
    // ~200 additional events across 20+ cities to bring the map closer to 509 (#100).
    let expInserted = 0; let expSkipped = 0;
    for (const e of COMMUNITY_EVENTS_EXPANSION_SEED) {
      const key = `${e.name.toLowerCase()}|${e.city.toLowerCase()}|${e.state.toLowerCase()}`;
      if (existing.has(key)) { expSkipped++; continue; }
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
        expInserted++;
      } catch (err: unknown) {
        warn(`Community events expansion: failed to insert ${e.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Community events expansion: ${expInserted} inserted, ${expSkipped} already present (seed: ${COMMUNITY_EVENTS_EXPANSION_SEED.length})`);

    // ── Community events expansion 2 — 324 events across 26 more cities (#100) ──
    // Brings total from ~211 → 535 (exceeds 509 goal).
    let exp2Inserted = 0; let exp2Skipped = 0;
    for (const e of COMMUNITY_EVENTS_EXPANSION_2_SEED) {
      const key = `${e.name.toLowerCase()}|${e.city.toLowerCase()}|${e.state.toLowerCase()}`;
      if (existing.has(key)) { exp2Skipped++; continue; }
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
        exp2Inserted++;
      } catch (err2: unknown) {
        warn(`Community events expansion 2: failed to insert ${e.name}: ${err2 instanceof Error ? err2.message : String(err2)}`);
      }
    }
    log(`Community events expansion 2: ${exp2Inserted} inserted, ${exp2Skipped} already present (seed: ${COMMUNITY_EVENTS_EXPANSION_2_SEED.length})`);
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
  // Added Aug 11 2026
  "aniaylar@gmail.com",
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
  // Added Aug 11 2026 — founder-invited tester
  "aniaylar@gmail.com",
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

// ── Library Evidence Seed — 7 diaspora Books (P0 repair Aug 12 2026) ─────────
//
// ROOT CAUSE: The 7 diaspora Library Books were seeded as knowledge_topics (with
// topic cards, descriptions, and trustedSources metadata) but the evidence layer
// (knowledge_sources rows) was never inserted. fetchSources() returned [] for
// every diaspora topic, so the UI showed "We're building this Book" for all 7.
//
// WHAT THIS DOES:
//   Inserts 2–3 real institutional knowledge_sources records per diaspora topic.
//   Uses the same WHERE NOT EXISTS guard as ensureLibraryContentActivation_v1 so
//   it is fully idempotent — runs safely on every boot, never overwrites existing
//   approved community/ambassador contributions.
//
// PROVENANCE RULE (permanent, same as ensurePhiladelphiaKnowledgeGraph):
//   Only authoritative and professional tiers are seeded here.
//   Community and ambassador tiers must come from real member contributions only.
//   No fabricated claims, invented article summaries, or unverified source URLs.
//
// SCOPE: This seeds beginning evidence, not a finished Book. Community evidence
//   remains an additional layer, not a substitute for the platform's evidence layer.

async function ensureLibraryDiasporaEvidence(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    let sourcesAdded = 0;

    // Idempotent insert by topic name + source name (same pattern as sb/st helpers).
    const sd = async (
      topicName: string,
      tier: string,
      sourceName: string,
      sourceUrl: string | null,
      claim: string,
      isPrimary: boolean,
      conf = "high",
    ) => {
      const r = await pool.query(
        `INSERT INTO knowledge_sources
           (id, topic_id, authority_tier, source_name, source_url, claim,
            is_primary, status, confidence, created_at, retrieved_at)
         SELECT gen_random_uuid()::text, kt.id, $2::text, $3::text, $4::text, $5::text,
                $6::boolean, 'active', $7::text, NOW(), NOW()
         FROM knowledge_topics kt
         WHERE kt.topic_name = $1::text
           AND NOT EXISTS (
             SELECT 1 FROM knowledge_sources ks
             WHERE ks.topic_id = kt.id AND ks.source_name = $3::text
           )
         LIMIT 1`,
        [topicName, tier, sourceName, sourceUrl, claim, isPrimary, conf],
      );
      sourcesAdded += r.rowCount ?? 0;
    };

    // ── 1. African Diaspora History ───────────────────────────────────────────
    // Three specific sources mandated by the P0 ticket, mapped to the published
    // topic ID fbfbc161-5121-4eca-a0a4-c35731b010f6 on production (topic name
    // lookup is environment-agnostic and matches that row).
    await sd(
      "African Diaspora History",
      "authoritative",
      "UNESCO — General History of Africa",
      "https://www.unesco.org/en/general-history-africa",
      "The UNESCO General History of Africa is an 8-volume synthesis written by African scholars, documenting African civilizations, the trans-Atlantic slave trade, diaspora dispersal, and global African cultural influence from ancient times to the present. Volume IX covers the African Diaspora and the Global Africa theme.",
      true,
      "verified",
    );
    await sd(
      "African Diaspora History",
      "authoritative",
      "Smithsonian Folklife Festival — African Diaspora",
      "https://festival.si.edu/past-program/1976/african-diaspora",
      "The Smithsonian's 1976 African Diaspora program is an archival and interpretive source documenting cultural continuities and connections among African, Caribbean, Latin American, and Black American communities — one of the Smithsonian's earliest systematic explorations of diaspora culture and identity.",
      false,
      "high",
    );
    await sd(
      "African Diaspora History",
      "authoritative",
      "Smithsonian NMAAHC — Digital Resource Guide",
      "https://nmaahc.si.edu/explore/nmaahc-digital-resource-guide",
      "The Smithsonian National Museum of African American History & Culture Digital Resource Guide curates primary and interpretive digital materials on African American history and the global diaspora — including collections on the Middle Passage, slavery, freedom movements, the Great Migration, and contemporary Black culture.",
      false,
      "high",
    );
    log("Library diaspora evidence: African Diaspora History — 3 sources seeded");

    // ── 2. Black & Diaspora Foodways ─────────────────────────────────────────
    await sd(
      "Black & Diaspora Foodways",
      "authoritative",
      "Smithsonian NMAAHC — African American Food Culture",
      "https://nmaahc.si.edu/explore/stories/african-american-foodways",
      "The NMAAHC documents African American foodways — the culinary traditions brought from West and Central Africa, transformed through the Middle Passage, and carried forward through enslaved cooks, Great Migration kitchens, and contemporary chefs. Covers field peas, okra, rice, sweet potatoes, and the cultural significance of cooking as resistance and community.",
      true,
      "high",
    );
    await sd(
      "Black & Diaspora Foodways",
      "professional",
      "Southern Foodways Alliance — Black Foodways Oral History",
      "https://www.southernfoodways.org",
      "The Southern Foodways Alliance (SFA) at the University of Mississippi Center for the Study of Southern Culture documents the food cultures of the American South through oral histories, essays, and documentary film — with extensive coverage of African American culinary traditions, their West African origins, and their central role in Southern food history.",
      false,
      "high",
    );
    await sd(
      "Black & Diaspora Foodways",
      "professional",
      "Library of Congress — African American Foodways Collection",
      "https://www.loc.gov/collections/federal-writers-project/about-this-collection",
      "The Library of Congress Federal Writers Project (1930s–40s) collected thousands of narratives from formerly enslaved people, including detailed accounts of food preparation, agricultural labor, and culinary knowledge — a primary source archive for understanding the African roots of American food culture.",
      false,
      "verified",
    );
    log("Library diaspora evidence: Black & Diaspora Foodways — 3 sources seeded");

    // ── 3. Cultural Etiquette & Customs ──────────────────────────────────────
    await sd(
      "Cultural Etiquette & Customs",
      "authoritative",
      "Smithsonian Center for Folklife and Cultural Heritage",
      "https://folklife.si.edu",
      "The Smithsonian Center for Folklife and Cultural Heritage researches, presents, and preserves the living traditions and cultural practices of communities around the world — including African American and diaspora traditions, protocols, hospitality customs, and community-specific etiquette rooted in ancestral practice.",
      true,
      "high",
    );
    await sd(
      "Cultural Etiquette & Customs",
      "professional",
      "Cultural Survival — Indigenous and Diaspora Cultural Rights",
      "https://www.culturalsurvival.org",
      "Cultural Survival advocates for the rights of Indigenous and diaspora peoples to maintain their cultural practices, languages, and traditions. Their Quarterly and resources document how diaspora communities preserve cultural etiquette, ceremony protocols, and intergenerational customs in new geographic contexts.",
      false,
      "high",
    );
    log("Library diaspora evidence: Cultural Etiquette & Customs — 2 sources seeded");

    // ── 4. Cultural Preservation & Oral History ───────────────────────────────
    await sd(
      "Cultural Preservation & Oral History",
      "authoritative",
      "American Folklife Center, Library of Congress",
      "https://www.loc.gov/folklife",
      "The American Folklife Center at the Library of Congress holds the world's largest collection of oral history and ethnographic recordings — including the Alan Lomax Collection, the Ex-Slave Narratives, and thousands of hours of African American and diaspora oral history documenting music, storytelling, spiritual practices, and community memory.",
      true,
      "verified",
    );
    await sd(
      "Cultural Preservation & Oral History",
      "authoritative",
      "UNESCO — Intangible Cultural Heritage",
      "https://ich.unesco.org",
      "UNESCO's Convention for the Safeguarding of the Intangible Cultural Heritage (2003) establishes the global framework for preserving oral traditions, performing arts, social practices, and knowledge systems. UNESCO's ICH lists include African and diaspora traditions such as Haitian Vodou, Cuban Rumba, Jamaican Reggae, and Capoeira.",
      false,
      "high",
    );
    await sd(
      "Cultural Preservation & Oral History",
      "professional",
      "Smithsonian Center for Folklife and Cultural Heritage — Oral History",
      "https://folklife.si.edu",
      "The Smithsonian Folklife and Cultural Heritage Center's oral history and documentation programs record living cultural knowledge from master tradition-bearers — including Black American quilters, storytellers, griots, cooks, and musicians — as primary evidence of cultural continuity across generations.",
      false,
      "high",
    );
    log("Library diaspora evidence: Cultural Preservation & Oral History — 3 sources seeded");

    // ── 5. Festivals & Cultural Celebrations ─────────────────────────────────
    await sd(
      "Festivals & Cultural Celebrations",
      "authoritative",
      "Smithsonian Folklife Festival — Annual Cultural Celebration",
      "https://festival.si.edu",
      "The Smithsonian Folklife Festival is one of the world's largest annual public celebrations of living cultural heritage, held on the National Mall in Washington D.C. Since 1967 it has featured African, Caribbean, and Black American cultural traditions — music, foodways, craft, dance, and community practices — presented by tradition-bearers alongside extensive documentation of each culture's festival calendar.",
      true,
      "verified",
    );
    await sd(
      "Festivals & Cultural Celebrations",
      "authoritative",
      "National Endowment for the Arts — Folk and Traditional Arts",
      "https://www.arts.gov/disciplines/folk-traditional-arts",
      "The NEA's Folk and Traditional Arts program supports festivals, celebrations, and cultural events that preserve and present the living traditions of American communities — including African American Juneteenth celebrations, Caribbean Carnival, West African drum and dance festivals, and community gatherings across the diaspora.",
      false,
      "high",
    );
    log("Library diaspora evidence: Festivals & Cultural Celebrations — 2 sources seeded");

    // ── 6. Genealogy & Family History ────────────────────────────────────────
    await sd(
      "Genealogy & Family History",
      "authoritative",
      "National Archives — African American Heritage Research",
      "https://www.archives.gov/research/african-americans",
      "The National Archives holds primary records essential for African American genealogy research — including Freedmen's Bureau records, the 1870 and 1880 census slave schedules, U.S. Colored Troops military service records, Freedmen's Savings Bank records, and immigration manifests documenting the broader African diaspora.",
      true,
      "verified",
    );
    await sd(
      "Genealogy & Family History",
      "authoritative",
      "Smithsonian NMAAHC — Finding African American Family Roots",
      "https://nmaahc.si.edu/explore/initiatives/african-american-genealogy",
      "The NMAAHC provides guidance on tracing African American ancestry and connecting genealogical research to the broader context of enslavement, the Middle Passage, Reconstruction, and migration — offering resources for navigating the documentary challenges created by centuries of deliberate record destruction.",
      false,
      "high",
    );
    log("Library diaspora evidence: Genealogy & Family History — 2 sources seeded");

    // ── 7. Heritage Language Learning ────────────────────────────────────────
    await sd(
      "Heritage Language Learning",
      "authoritative",
      "Center for Applied Linguistics — Heritage Language Research",
      "https://www.cal.org/areas-of-impact/heritage-languages",
      "The Center for Applied Linguistics is the leading U.S. research organization on language in education. Its Heritage Language Research Institute documents the role of heritage language programs in maintaining Yoruba, Twi, Hausa, Swahili, Amharic, Wolof, Haitian Creole, and other diaspora languages — connecting community members to ancestral linguistic identity.",
      true,
      "high",
    );
    await sd(
      "Heritage Language Learning",
      "professional",
      "American Councils for International Education — Heritage Language Programs",
      "https://www.americancouncils.org/programs/heritage-language",
      "American Councils administers Critical Language Scholarship and National Heritage Language Resource Center programs that support learners reconnecting with African, Caribbean, and diaspora community languages — including Swahili, Arabic, Hausa, and Portuguese — as part of cultural identity and family heritage.",
      false,
      "high",
    );
    log("Library diaspora evidence: Heritage Language Learning — 2 sources seeded");

    log(`Library diaspora evidence: total ${sourcesAdded} knowledge_sources inserted across 7 diaspora Books`);

  } catch (err: unknown) {
    warn(`Library diaspora evidence seed failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Capacity canary load-test accounts ────────────────────────────────────────
// 30 isolated accounts for the controlled 30-user production capacity test.
// Safe to run on every boot — ON CONFLICT DO NOTHING means zero-impact once seeded.
// Password: MWM-LoadTest-2026! (bcrypt 12 rounds)
// Cleanup: DELETE FROM users WHERE email LIKE '%@loadtest.mwm.internal%'
async function ensureLoadTestAccounts(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  const HASH = '$2b$12$lh9y6/CoZwR57kjmd5RQ7.oB.of6YSL48XQ9RVHiXycxfz4Gs23zC';
  const accounts = [
    { n:'01', city:'Philadelphia' }, { n:'02', city:'Atlanta' },
    { n:'03', city:'Houston' },      { n:'04', city:'Washington' },
    { n:'05', city:'Los Angeles' },  { n:'06', city:'New York' },
    { n:'07', city:'Chicago' },      { n:'08', city:'New Orleans' },
    { n:'09', city:'Detroit' },      { n:'10', city:'Baltimore' },
    { n:'11', city:'Memphis' },      { n:'12', city:'Dallas' },
    { n:'13', city:'Miami' },        { n:'14', city:'Charlotte' },
    { n:'15', city:'Columbia' },     { n:'16', city:'Birmingham' },
    { n:'17', city:'Oakland' },      { n:'18', city:'Newark' },
    { n:'19', city:'Richmond' },     { n:'20', city:'Nashville' },
    { n:'21', city:'Phuket' },       { n:'22', city:'Phuket' },
    { n:'23', city:'Philadelphia' }, { n:'24', city:'Atlanta' },
    { n:'25', city:'Houston' },      { n:'26', city:'Washington' },
    { n:'27', city:'Los Angeles' },  { n:'28', city:'New York' },
    { n:'29', city:'Chicago' },      { n:'30', city:'Miami' },
  ];
  try {
    // Remove any malformed rows created by the v1 bug (email = "Tester NN" instead of the address)
    const cleaned = await pool.query(
      `DELETE FROM users WHERE email ~ '^Tester \\d+$' AND is_load_test = true RETURNING email`
    );
    if (cleaned.rowCount && cleaned.rowCount > 0) {
      warn(`Load-test cleanup: removed ${cleaned.rowCount} malformed row(s) (email was "Tester NN")`);
    }

    let inserted = 0;
    for (const a of accounts) {
      const email = `mwm-loadtest-${a.n}@loadtest.mwm.internal`;
      const username = `loadtest${a.n}_${a.city.toLowerCase().replace(/[^a-z]/g,'')}`;
      // Param order matches column order: email, last_name, username, home_city, password_hash
      const result = await pool.query(
        `INSERT INTO users
           (email, first_name, last_name, username, home_city,
            password_hash, email_verified, approved, member_type,
            tester_status, tester_access_source, is_load_test,
            created_at, updated_at)
         VALUES ($1,'Load',$2,$3,$4,$5,true,true,'free','active','admin_invite',true,NOW(),NOW())
         ON CONFLICT (email) DO UPDATE SET is_load_test = true, updated_at = NOW()
         RETURNING (xmax = 0) AS inserted`,
        [email, `Tester ${a.n}`, username, a.city, HASH]
      );
      if (result.rows[0]?.inserted) inserted++;
    }
    log(`Load-test accounts: ${inserted} created, ${accounts.length - inserted} already present`);
  } catch (err: unknown) {
    warn(`Load-test account seed failed: ${err instanceof Error ? err.message : String(err)}`);
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
  // bcrypt(cost=8) of "MWM-invite-2026!" — same hash used by tester_universal_accounts_v1
  const UNIVERSAL_HASH = '$2b$08$ofLtRbXbdrBoQm4nfLz.fut.KCmGZyMBGWVJx4U/4FOfzIOfZ1prO';
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
         SELECT gen_random_uuid()::text,$1::text,$2::text,$3::text,$4::text,$5::text,$6::boolean,'active',$7::text,NOW(),NOW()
         WHERE NOT EXISTS (SELECT 1 FROM knowledge_sources WHERE topic_id=$1::text AND source_name=$3::text)`,
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
         SELECT gen_random_uuid()::text, kt.id, $2::text, $3::text, $4::text, $5::text, $6::boolean, 'active', $7::text, NOW(), NOW()
         FROM knowledge_topics kt
         WHERE kt.topic_name = $1::text
           AND NOT EXISTS (SELECT 1 FROM knowledge_sources ks WHERE ks.topic_id = kt.id AND ks.source_name = $3::text)
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
         SELECT gen_random_uuid()::text, $1::text, kt.id, 'contains', 0.8
         FROM knowledge_topics kt
         WHERE kt.category=$2::text AND kt.topic_type='general' AND kt.enabled=true
           AND NOT EXISTS (SELECT 1 FROM topic_relationships tr WHERE tr.parent_topic_id=$1::text AND tr.child_topic_id=kt.id AND tr.relationship_type='contains')`,
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
         VALUES ($1::text,$2::text,$2::text,'country',$3::text,'geography','general',true,'published',60,'professional',$2::text)
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

// ── Los Angeles — Black & diaspora businesses across the metro ─────────────────
// Covers: soul food, BBQ, Ethiopian, Jamaican, Trinidadian, Oaxacan/Afro-Mexican,
// coffee, health food, arts, nightlife, beauty, faith — Leimert Park through Watts,
// Inglewood, Pasadena, Long Beach, Culver City, Hermosa Beach.
// Does NOT duplicate tour seed: Malik Books, Post & Beam, Earle's, Meals by Genet,
// Guelaguetza, Flavors from Afar, Bossa Nova, Wi Spa, Ayara Thai.
async function ensureLABusinesses(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  const LA_BUSINESSES = [
    // ── Soul Food & BBQ — Black American institutions ──────────────────────────
    { name: "Dulan's Soul Food Kitchen", category: "Food", subcategory: "Soul Food", address: "4859 Crenshaw Blvd", city: "Los Angeles", lat: 33.9933, lng: -118.3359, description: "One of LA's most beloved soul food restaurants — Dulan's has fed the Crenshaw community for decades with smothered chicken, candied yams, and black-eyed peas that taste like a Sunday plate from home. A gathering place as much as a restaurant." },
    { name: "Harold & Belle's Restaurant", category: "Food", subcategory: "Creole & Soul Food", address: "2920 W Jefferson Blvd", city: "Los Angeles", lat: 34.0140, lng: -118.3282, description: "A Los Angeles institution since 1969. Harold & Belle's brought the flavors of New Orleans Creole cooking to the West Adams neighborhood and never stopped. Gumbo, crawfish étouffée, and red beans and rice served with the warmth of family." },
    { name: "Phillips Bar-B-Que", category: "Food", subcategory: "BBQ", address: "4307 Leimert Blvd", city: "Los Angeles", lat: 34.0072, lng: -118.3321, description: "Since 1971, Phillips has been the soul of Leimert Park BBQ. Hot links, ribs, and beef brisket slow-smoked over oak — the lines wrap around the corner every weekend and always have. A community pillar and a culinary landmark." },
    { name: "Woody's Bar-B-Que", category: "Food", subcategory: "BBQ", address: "3446 W Slauson Ave", city: "Los Angeles", lat: 33.9930, lng: -118.3387, description: "Woody's has been slinging legendary BBQ on Slauson since 1975. Ribs, hot links, and sliced beef piled onto butcher paper — no-frills, pure flavor. A Hyde Park staple beloved across generations of South LA families." },
    { name: "Bludso's Bar & Que", category: "Food", subcategory: "Texas BBQ", address: "609 N La Brea Ave", city: "Los Angeles", lat: 34.0806, lng: -118.3381, description: "Kevin Bludso brought his Compton roots and Texas BBQ traditions together at this La Brea landmark. Beef ribs, brisket, and Texas-style hot links in a bar setting that's as lively as the food is serious. One of LA's most celebrated pitmasters." },
    { name: "Roscoe's House of Chicken & Waffles", category: "Food", subcategory: "Soul Food", address: "1518 N Gower St", city: "Los Angeles", lat: 34.0985, lng: -118.3262, description: "Herb Hudson opened the original Roscoe's in Hollywood in 1975 and created an LA legend. Chicken and waffles — crispy, golden, smothered — became the city's comfort food symbol. Beloved by the community, musicians, and every president who's passed through." },
    { name: "The Serving Spoon", category: "Food", subcategory: "Soul Food Breakfast", address: "1403 Centinela Ave", city: "Inglewood", lat: 33.9636, lng: -118.3502, description: "Inglewood's favorite breakfast spot — a no-nonsense soul food diner serving grits, catfish and eggs, and the kind of smothered potatoes that make you close your eyes. The Serving Spoon is a community anchor that has never chased trends and never needed to." },
    { name: "Big Mama's Rib Shack", category: "Food", subcategory: "BBQ & Soul Food", address: "1453 N Lake Ave", city: "Pasadena", lat: 34.1475, lng: -118.1123, description: "Big Mama's brought deep-South BBQ tradition to Pasadena and became the heartbeat of the city's Black community dining scene. Ribs, rib tips, and sides cooked with decades of muscle memory — the kind of place where regulars are known by name." },
    { name: "Harriet's Cheesecakes Unlimited", category: "Food", subcategory: "Bakery & Desserts", address: "4440 W Slauson Ave", city: "Los Angeles", lat: 33.9890, lng: -118.3500, description: "For over 30 years, Harriet's has been baking the cheesecakes that show up at every South LA celebration — New York style, sweet potato, peach cobbler, and rotating seasonal flavors. Black-owned and deeply rooted in the community." },
    { name: "Flossie's", category: "Food", subcategory: "Southern Cuisine", address: "2651 E 4th St", city: "Long Beach", lat: 33.7706, lng: -118.1574, description: "A Long Beach institution bringing Southern comfort food — fried catfish, collard greens, oxtails, and peach cobbler — to the heart of the city's historic Black community. Flossie's is the kind of place that makes you feel at home the moment you walk in." },

    // ── Ethiopian & East African — Little Ethiopia corridor ─────────────────────
    { name: "Rahel Ethiopian Vegan Cuisine", category: "Food", subcategory: "Ethiopian Vegan", address: "1047 S Fairfax Ave", city: "Los Angeles", lat: 34.0523, lng: -118.3609, description: "The crown jewel of LA's Little Ethiopia neighborhood — Rahel serves a fully vegan Ethiopian menu of injera, tibs, misir, and gomen that is as ceremonially prepared as it is deeply flavorful. A landmark for plant-based eating that predates the trend by decades." },
    { name: "Awash Ethiopian Restaurant", category: "Food", subcategory: "Ethiopian Cuisine", address: "1012 S Fairfax Ave", city: "Los Angeles", lat: 34.0515, lng: -118.3601, description: "A beloved stalwart of Little Ethiopia — Awash serves generous communal platters of lamb tibs, doro wot, and ayib on hand-made injera. The kind of place where first-timers become regulars and regulars become family." },

    // ── Caribbean & Jamaican ───────────────────────────────────────────────────
    { name: "Coley's Jamaican Restaurant", category: "Food", subcategory: "Jamaican Cuisine", address: "4335 Crenshaw Blvd", city: "Los Angeles", lat: 34.0028, lng: -118.3388, description: "Coley's has been feeding the Crenshaw corridor with authentic Jamaican cooking for years — jerk chicken, curry goat, oxtail, and plantain cooked low and slow with the island's full flavor spectrum. A cornerstone of LA's Caribbean community." },
    { name: "Bridgetown Roti", category: "Food", subcategory: "Trinidadian Caribbean", address: "4556 Eagle Rock Blvd", city: "Los Angeles", lat: 34.1326, lng: -118.2186, description: "Bridgetown brings the flavors of Trinidad and Tobago to Eagle Rock — curry chicken roti, doubles, and pholourie from a kitchen that takes Caribbean food as seriously as any white-tablecloth restaurant. One of the most exciting diaspora kitchens in the city." },

    // ── Afro-Mexican & Latin Diaspora ─────────────────────────────────────────
    { name: "Chichen Itza", category: "Food", subcategory: "Oaxacan Mexican", address: "3655 S Grand Ave", city: "Los Angeles", lat: 34.0266, lng: -118.2853, description: "Tucked inside the Mercado La Paloma community market, Chichen Itza serves Yucatecan Mayan cuisine — cochinita pibil, panuchos, and sopa de lima — representing the Indigenous and African-descended communities of southern Mexico. James Beard-nominated and deeply community-rooted." },

    // ── Coffee, Café & Brunch ──────────────────────────────────────────────────
    { name: "Hilltop Coffee + Kitchen", category: "Food", subcategory: "Coffee & Brunch", address: "3237 W Jefferson Blvd", city: "Los Angeles", lat: 34.0235, lng: -118.3264, description: "A Black-owned coffee shop and brunch destination rooted in the West Adams neighborhood — a community that has resisted displacement for decades. Hilltop is the kind of third place that anchors a block: good coffee, real food, familiar faces." },
    { name: "Highly Likely", category: "Food", subcategory: "Café & Brunch", address: "5011 W Adams Blvd", city: "Los Angeles", lat: 34.0280, lng: -118.3547, description: "A Black-owned café in West Adams that quickly became one of LA's most talked-about brunch spots. Highly Likely is as warm in its welcome as it is creative in its kitchen — the neighborhood's living room, open to everyone." },

    // ── Health Food & Organic ──────────────────────────────────────────────────
    { name: "Simply Wholesome", category: "Health & Wellness", subcategory: "Organic Health Food", address: "4508 W Slauson Ave", city: "Los Angeles", lat: 33.9898, lng: -118.3493, description: "South LA's pioneering health food store and café — Simply Wholesome has been serving organic, vegan, and Caribbean-inspired health food to the Crenshaw community since 1989. A true institution that proved healthy food and Black community have always belonged together." },

    // ── Arts, Culture & Community Institutions ────────────────────────────────
    { name: "World Stage Performance Gallery", category: "Arts & Culture", subcategory: "Jazz & Performing Arts", address: "4321 Degnan Blvd", city: "Los Angeles", lat: 34.0052, lng: -118.3316, description: "Founded by jazz drummer Billy Higgins in 1989, the World Stage is the cultural soul of Leimert Park — a workshop, gallery, and performance space where LA's Black artistic tradition of jazz, poetry, and visual art lives and breathes. The stage where Kamasi Washington came up." },
    { name: "Eso Won Books", category: "Arts & Culture", subcategory: "Black Bookstore", address: "4327 Degnan Blvd", city: "Los Angeles", lat: 34.0052, lng: -118.3319, description: "Eso Won — meaning 'water over stone' — has been LA's premier Black bookstore since 1988. Every major Black author who has passed through Los Angeles has read here. A gathering place for ideas, community, and the literature that sustains both." },
    { name: "The Underground Museum", category: "Arts & Culture", subcategory: "Contemporary Art Gallery", address: "3508 W Washington Blvd", city: "Los Angeles", lat: 34.0183, lng: -118.3354, description: "Founded by artist Noah Davis in 2012, the Underground Museum is a free contemporary art space in the Arlington Heights neighborhood that brought world-class art — including shows from MoMA's collection — to a community that deserved it. Now stewarded by his estate." },
    { name: "Destination Crenshaw", category: "Arts & Culture", subcategory: "Open-Air Art Museum", address: "4100 Crenshaw Blvd", city: "Los Angeles", lat: 34.0010, lng: -118.3380, description: "A 1.3-mile open-air museum celebrating Black Los Angeles — 100 works of art by Black artists installed along Crenshaw Boulevard as the Metro K Line was built. Destination Crenshaw is LA's answer to displacement: a permanent cultural declaration that this corridor belongs to its community." },
    { name: "Museum of African American Art", category: "Arts & Culture", subcategory: "Museum", address: "4005 Crenshaw Blvd", city: "Los Angeles", lat: 34.0033, lng: -118.3363, description: "Founded in 1977, the Museum of African American Art inside Baldwin Hills Crenshaw Plaza houses a significant permanent collection of African American fine art and hosts rotating exhibitions celebrating Black creativity across generations. One of the few museums of its kind west of the Mississippi." },
    { name: "Watts Towers Arts Center", category: "Arts & Culture", subcategory: "Cultural Center", address: "1727 E 107th St", city: "Los Angeles", lat: 33.9393, lng: -118.2416, description: "Adjacent to Simon Rodia's landmark Watts Towers, the Arts Center has been a community hub for creative expression in South LA since 1961. Classes, exhibitions, and the annual Watts Towers Jazz Festival make this one of LA's most beloved community institutions." },

    // ── Nightlife, Music & Entertainment ──────────────────────────────────────
    { name: "Catch One", category: "Entertainment & Recreation", subcategory: "Nightclub", address: "4067 W Pico Blvd", city: "Los Angeles", lat: 34.0376, lng: -118.3349, description: "Opened by Jewel Thais-Williams in 1973, Catch One is one of the longest-running Black LGBTQ+ nightclubs in America — a sanctuary on Pico Boulevard where the community could be fully itself. Through disco, house, R&B, and hip-hop, Catch One has been the heartbeat of Black queer LA for 50 years." },
    { name: "The Lighthouse Café", category: "Entertainment & Recreation", subcategory: "Jazz & Live Music", address: "30 Pier Ave", city: "Hermosa Beach", lat: 33.8591, lng: -118.3995, description: "The Lighthouse has been a pillar of the West Coast jazz scene since 1949 — a venue where Miles Davis, Chet Baker, and Dexter Gordon played when jazz was defining LA's cultural identity. Still hosting live jazz nightly on the Hermosa Beach pier." },
    { name: "Marcus Bar & Grille", category: "Entertainment & Recreation", subcategory: "Bar & Grill", address: "5100 W Century Blvd", city: "Los Angeles", lat: 33.9561, lng: -118.3694, description: "A Black-owned bar and grill near LAX that has become a go-to for travelers, locals, and industry professionals — good food, strong drinks, and the kind of energy that makes you stay longer than planned. A sophisticated gathering spot anchoring the Westchester community." },

    // ── Faith & Spiritual Community ───────────────────────────────────────────
    { name: "Agape International Spiritual Center", category: "Faith & Spirituality", subcategory: "Spiritual Center", address: "5700 Buckingham Pkwy", city: "Culver City", lat: 33.9748, lng: -118.3950, description: "Founded by Rev. Michael Bernard Beckwith in 1986, Agape is one of the most influential spiritual communities in Los Angeles — a trans-denominational center that draws thousands weekly across race and background. Rooted in the New Thought tradition and deeply connected to the Black community that helped build it." },

    // ── Beauty & Personal Care ─────────────────────────────────────────────────
    { name: "Deja Vu Beauty & Hair Salon", category: "Beauty & Personal Care", subcategory: "Black Hair Salon", address: "3815 Crenshaw Blvd", city: "Los Angeles", lat: 34.0096, lng: -118.3378, description: "A Crenshaw District institution for natural hair, relaxers, braids, and locs — Deja Vu is where South LA comes for their crown. The kind of salon where you come for a service and leave with community, conversation, and a style that turns heads." },

    // ── Healthcare & Medical — covering South LA, Watts, Inglewood, Willowbrook ─
    { name: "MLK Community Medical Center", category: "Health & Wellness", subcategory: "Medical Center", address: "1680 E 120th St", city: "Los Angeles", lat: 33.9311, lng: -118.2476, description: "MLK Community Medical Center was built to restore healthcare access to Willowbrook and South LA — a community that lost its hospital and demanded better. A full-service Level II trauma center with emergency care, surgery, and primary services rooted in the community it was built for. Accepting most insurance plans." },
    { name: "Watts Healthcare Corporation", category: "Health & Wellness", subcategory: "Community Health Clinic", address: "10300 Compton Ave", city: "Los Angeles", lat: 33.9458, lng: -118.2473, description: "A federally qualified health center serving the Watts community since 1966 — the same year as the Watts Uprising that demanded dignity and better care. Primary care, dental, behavioral health, and pediatrics for patients regardless of ability to pay. Deeply rooted in the Black community it has served for six decades." },
    { name: "UMMA Community Clinic", category: "Health & Wellness", subcategory: "Community Health Clinic", address: "1001 E 120th St", city: "Los Angeles", lat: 33.9312, lng: -118.2565, description: "UMMA (Unity Mercy Medical Associates) has provided free and low-cost healthcare to the Watts and South LA community since 2007. Primary care, women's health, pediatrics, and mental health services — with a deep commitment to health equity for Black and brown families. No patient is turned away." },
    { name: "St. John's Well Child and Family Center", category: "Health & Wellness", subcategory: "Pediatric & Family Health", address: "5801 S Figueroa St", city: "Los Angeles", lat: 33.9986, lng: -118.2782, description: "St. John's has been providing pediatric primary care, dental, and behavioral health services to South LA children and families for over 40 years. A trusted partner for parents navigating the healthcare system — delivering culturally competent care to the youngest members of the community with deep roots in South LA." },
    { name: "Kedren Community Health Center", category: "Health & Wellness", subcategory: "Mental Health & Counseling", address: "4211 S Avalon Blvd", city: "Los Angeles", lat: 33.9895, lng: -118.2732, description: "One of LA's longest-serving mental health centers — Kedren has provided psychiatric and behavioral health services to South LA's Black community since 1966. Therapy, crisis intervention, substance abuse treatment, and outpatient services delivered with cultural competence and decades of community trust." },
    { name: "Charles R. Drew University Health Sciences Clinic", category: "Health & Wellness", subcategory: "Primary Care Clinic", address: "1731 E 120th St", city: "Los Angeles", lat: 33.9316, lng: -118.2464, description: "The clinical arm of Charles R. Drew University of Medicine and Science — a historically Black university founded after the Watts Uprising to bring medical education and care to South LA. Primary care, OB/GYN, and preventive services for underserved patients with a legacy of health equity research and community service." },
    { name: "Centinela Hospital Medical Center", category: "Health & Wellness", subcategory: "Hospital", address: "555 E Hardy St", city: "Inglewood", lat: 33.9519, lng: -118.3484, description: "Inglewood's primary hospital serving the community with emergency care, maternity services, orthopedics, and cardiac care. A key healthcare anchor for the Inglewood and South Bay Black community — including maternity services for mothers delivering in the South LA area." },
    { name: "Maternal Fetal Care Center at MLK", category: "Health & Wellness", subcategory: "OB/GYN & Maternal Health", address: "1680 E 120th St", city: "Los Angeles", lat: 33.9313, lng: -118.2475, description: "Specialized maternal and fetal care within MLK Community Medical Center — serving high-risk pregnancies and delivering culturally competent OB/GYN care to Black mothers in South LA. Part of a broader mission to close the Black maternal mortality gap through community-rooted care." },
    { name: "The Sycamores South LA Family Resource Center", category: "Health & Wellness", subcategory: "Mental Health & Family Services", address: "10820 S Budlong Ave", city: "Los Angeles", lat: 33.9394, lng: -118.2941, description: "A community mental health organization providing therapy, crisis intervention, and family services to South LA children, teens, and families. Culturally affirming care for the Black community — therapy for kids, parenting support, and trauma-informed counseling for families who have faced systemic barriers to mental healthcare." },
    { name: "QueensCare Health Centers — West Adams", category: "Health & Wellness", subcategory: "Community Health Clinic", address: "4500 W Adams Blvd", city: "Los Angeles", lat: 34.0280, lng: -118.3474, description: "A nonprofit community health center providing primary care, pediatrics, dental, and behavioral health services on a sliding-scale fee — making care accessible to West Adams and South LA families regardless of income or insurance status. Part of the QueensCare network serving LA's underserved communities." },

    // ── Childcare & Early Education ────────────────────────────────────────────
    { name: "LAUSD Head Start — Watts Learning Center", category: "Childcare & Early Education", subcategory: "Early Childhood Education", address: "1260 E 111th St", city: "Los Angeles", lat: 33.9434, lng: -118.2508, description: "A Head Start early childhood program in the Watts community providing free preschool education, health screenings, and family support services to children ages 3–5. One of LA's most important investments in Black children's early development — giving Watts families access to the same quality early education as any family in LA." },

    // ── Professional Services ──────────────────────────────────────────────────
    { name: "Conwell & Kirkpatrick LLP", category: "Professional Services", subcategory: "Law Firm", address: "3699 Wilshire Blvd", city: "Los Angeles", lat: 34.0608, lng: -118.3414, description: "A Black-owned law firm serving the Los Angeles community — specializing in civil rights, employment discrimination, personal injury, and family law. Dedicated to providing quality legal representation to clients who have historically been underrepresented in LA's legal system." },
    { name: "Crenshaw Tax & Accounting Services", category: "Professional Services", subcategory: "Tax & Accounting", address: "3650 W Martin Luther King Jr Blvd", city: "Los Angeles", lat: 34.0006, lng: -118.3349, description: "A Black-owned accounting and tax preparation firm serving South LA families and small business owners — helping the community keep more of what they earn and build generational wealth. Individual returns, small business bookkeeping, and financial planning with a deep understanding of the community's needs." },
  ];

  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(COALESCE(country,'')) AS k FROM businesses`
    );
    const existing = new Set(r.rows.map((row: { k: string }) => row.k));

    let inserted = 0;
    let skipped = 0;

    for (const b of LA_BUSINESSES) {
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|us`;
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
            ($1,$2,$3,$4,$5,$6,'CA','US',
             $7,'[]'::jsonb,false,
             $8,$9,
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
            b.description,
            String(b.lat), String(b.lng),
          ]
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  LA businesses: failed to insert "${b.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`LA businesses guard: ${inserted} inserted, ${skipped} already present`);
  } catch (err: unknown) {
    warn(`LA businesses guard failed: ${err instanceof Error ? err.message : String(err)}`);
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

// ── Generic tour cultural sites batch runner ──────────────────────────────────
// Mirrors ensureTourCulturalSites but accepts any array + batch name.
// Deduplicates by lower(name)|lower(city)|lower(state).
async function runTourCulturalSitesBatch(
  batchName: string,
  sites: Array<{ name: string; city: string; state: string; address: string | null; description: string }>,
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  if (!sites || sites.length === 0) {
    log(`${batchName}: empty seed array — skipping`);
    return;
  }
  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(state) AS k FROM tour_cultural_sites`
    );
    const existing = new Set(r.rows.map((row: { k: string }) => row.k));
    let inserted = 0, skipped = 0;

    for (const s of sites) {
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
        warn(`${batchName}: failed to insert "${s.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`${batchName}: ${inserted} inserted, ${skipped} already present (${sites.length} total in batch)`);
  } catch (err: unknown) {
    warn(`${batchName} seed failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Generic knowledge topics batch runner ─────────────────────────────────────
// Mirrors ensureKnowledgeTopics but accepts any array + batch name.
// Deduplicates by lower(topic_name).
async function runKnowledgeTopicsBatch(
  batchName: string,
  topics: Array<{
    topicName: string;
    category: string;
    description: string;
    keywords: string[];
    notificationPriority: string;
    trustedSources: Array<{ name: string; domain: string }>;
  }>,
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  if (!topics || topics.length === 0) {
    log(`${batchName}: empty seed array — skipping`);
    return;
  }
  try {
    const r = await pool.query(`SELECT LOWER(topic_name) AS n FROM knowledge_topics`);
    const existing = new Set(r.rows.map((row: { n: string }) => row.n));

    const newTopics = topics.filter((t) => !existing.has(t.topicName.toLowerCase()));
    if (newTopics.length === 0) {
      log(`${batchName}: 0 inserted, ${topics.length} already present`);
      return;
    }

    const COLS = 6;
    const placeholders = newTopics
      .map((_, i) => `(gen_random_uuid(),$${i*COLS+1},$${i*COLS+2},$${i*COLS+3},$${i*COLS+4},$${i*COLS+5},$${i*COLS+6}::jsonb,true,'free',NOW())`)
      .join(",");
    const params = newTopics.flatMap((t) => [
      t.topicName,
      t.category,
      t.description,
      t.keywords,
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

    log(`${batchName}: ${newTopics.length} inserted, ${existing.size} already present (${topics.length} total in batch)`);
  } catch (err: unknown) {
    warn(`${batchName} seed failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Generic seed batch runner ────────────────────────────────────────────────
// Shared by all diaspora expansion batches. Deduplicates by name|city|country.
async function runSeedBatch(
  batchName: string,
  businesses: SeedBiz[],
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  if (!businesses || businesses.length === 0) {
    log(`${batchName}: empty seed array — skipping`);
    return;
  }
  try {
    const existing = await pool.query(
      `SELECT LOWER(name) || '|' || LOWER(city) || '|' || LOWER(COALESCE(country,'usa')) AS k FROM businesses`
    );
    const existingKeys = new Set<string>(existing.rows.map((r: { k: string }) => r.k));

    let inserted = 0;
    let skipped = 0;

    for (const b of businesses) {
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${(b.country || 'USA').toLowerCase()}`;
      if (existingKeys.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state, country,
             description, ownership_designations, black_owned,
             latitude, longitude,
             website,
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
             $12,
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
            b.state ?? null,
            b.country || 'USA',
            b.description,
            String(b.lat), String(b.lng),
            b.website ?? null,
          ]
        );
        existingKeys.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  ${batchName}: failed to insert "${b.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    log(`${batchName}: ${inserted} inserted, ${skipped} already present (${businesses.length} total in batch)`);
  } catch (err: unknown) {
    warn(`${batchName} seed failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Remove all [DEMO] businesses ────────────────────────────────────────────
// Runs on every boot — idempotent (no-op once demos are gone).
// Only removes records with no member data attached (reviews, saves, vibe tags).
// ── Ensure all active businesses are discoverable via the public API ───────────
// Promotes listing_status to live_unclaimed for any active businesses that are
// still in demo/live/active status (which the API gate excludes).
// Creates business_identity rows where missing.
// Sets ownership_badges and category-based tags where empty.
// Safe on every boot — all operations are idempotent.
async function ensureBusinessDiscoverability(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    // 1. Promote listing_status so API gate passes
    const promoted = await pool.query(
      `UPDATE businesses
       SET listing_status = 'live_unclaimed'
       WHERE status = 'active'
         AND listing_status IN ('demo', 'live', 'active')
       RETURNING id`
    );
    if (promoted.rowCount && promoted.rowCount > 0) {
      log(`Business discoverability: promoted ${promoted.rowCount} businesses to live_unclaimed`);
    }

    // 2. Create missing business_identity rows
    const identityInsert = await pool.query(
      `INSERT INTO business_identity (business_id)
       SELECT b.id FROM businesses b
       LEFT JOIN business_identity bi ON bi.business_id = b.id
       WHERE b.status = 'active' AND bi.business_id IS NULL
       ON CONFLICT (business_id) DO NOTHING`
    );
    if (identityInsert.rowCount && identityInsert.rowCount > 0) {
      log(`Business discoverability: created ${identityInsert.rowCount} missing business_identity rows`);
    }

    // 3. Set ownership_badges where empty
    await pool.query(
      `UPDATE business_identity
       SET ownership_badges = '["black-owned"]'::jsonb
       WHERE (ownership_badges IS NULL OR ownership_badges = '[]'::jsonb OR ownership_badges::text = 'null')
         AND business_id IN (SELECT id FROM businesses WHERE status = 'active')`
    );

    // 4. Set category-based tags where empty
    await pool.query(
      `UPDATE businesses
       SET tags = CASE
         WHEN category ILIKE '%food%' OR category ILIKE '%restaurant%' OR category ILIKE '%dining%'
           THEN '["restaurant","food","dining","eat local","community food"]'::jsonb
         WHEN category ILIKE '%health%' OR category ILIKE '%wellness%'
           THEN '["health","wellness","self-care","fitness","mental health"]'::jsonb
         WHEN category ILIKE '%arts%' OR category ILIKE '%art%' OR category ILIKE '%culture%' OR category ILIKE '%entertainment%'
           THEN '["art","culture","creative","community arts","entertainment"]'::jsonb
         WHEN category ILIKE '%community%' OR category ILIKE '%organization%' OR category ILIKE '%nonprofit%'
           THEN '["community","nonprofit","local organization","community support","advocacy"]'::jsonb
         WHEN category ILIKE '%professional%' OR category ILIKE '%services%'
           THEN '["professional services","consulting","business services","local expert","services"]'::jsonb
         WHEN category ILIKE '%retail%' OR category ILIKE '%shopping%'
           THEN '["shopping","retail","local shop","boutique","community retail"]'::jsonb
         WHEN category ILIKE '%faith%' OR category ILIKE '%spirit%' OR category ILIKE '%church%'
           THEN '["faith","church","spiritual","worship","community faith"]'::jsonb
         WHEN category ILIKE '%beauty%' OR category ILIKE '%personal care%'
           THEN '["beauty","salon","barber","self-care","grooming","hair"]'::jsonb
         WHEN category ILIKE '%child%' OR category ILIKE '%education%' OR category ILIKE '%learning%'
           THEN '["education","childcare","kids","family","learning","children"]'::jsonb
         WHEN category ILIKE '%travel%' OR category ILIKE '%hospitality%'
           THEN '["travel","hospitality","lodging","tourism","accommodations"]'::jsonb
         WHEN category ILIKE '%legal%' OR category ILIKE '%law%'
           THEN '["legal","attorney","lawyer","legal services","advocacy"]'::jsonb
         WHEN category ILIKE '%home%' OR category ILIKE '%trade%' OR category ILIKE '%property%'
           THEN '["home services","contractor","trades","repair","home improvement"]'::jsonb
         WHEN category ILIKE '%finance%' OR category ILIKE '%financial%'
           THEN '["finance","financial services","banking","investment","money"]'::jsonb
         WHEN category ILIKE '%tech%' OR category ILIKE '%software%' OR category ILIKE '%digital%'
           THEN '["technology","tech","software","digital","IT services"]'::jsonb
         WHEN category ILIKE '%auto%' OR category ILIKE '%vehicle%'
           THEN '["automotive","auto repair","cars","vehicle","mechanic"]'::jsonb
         ELSE '["community business","local","minority-owned","community"]'::jsonb
       END
       WHERE status = 'active'
         AND (tags IS NULL OR tags::text = '[]' OR tags::text = 'null')`
    );

    log('Business discoverability: tags and ownership badges ensured for all active businesses');
  } catch (err: unknown) {
    warn(`Business discoverability guard failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function ensureDemoRemoval(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    const result = await pool.query<{ name: string; city: string }>(
      `DELETE FROM businesses
       WHERE description LIKE '[DEMO]%'
         AND NOT EXISTS (SELECT 1 FROM reviews         WHERE business_id = businesses.id)
         AND NOT EXISTS (SELECT 1 FROM saved_places    WHERE business_id = businesses.id)
         AND NOT EXISTS (SELECT 1 FROM business_vibe_tags WHERE business_id = businesses.id)
       RETURNING name, city`
    );
    if (result.rowCount && result.rowCount > 0) {
      const names = result.rows.map((r) => `${r.name} (${r.city})`).join(', ');
      log(`Demo removal: removed ${result.rowCount} demo listings — ${names}`);
    } else {
      log('Demo removal: platform is clean — no demo listings found');
    }
  } catch (err: unknown) {
    warn(`Demo removal failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Library source link health ────────────────────────────────────────────────
// Phase 1 (Option A): curator-triggered + one-time initial sweep.
// Marks well-known stale URLs as needs_review so the Library never directs a
// member to a dead link. Does NOT send HTTP probes (periodic job is Phase 2).
async function ensureLibraryLinkHealth(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // Known stale: ACS breast cancer page returns 404 as of Aug 2026.
    // Condition is idempotent: only runs when link_status is NULL or 'unchecked'
    // so a curator decision to reinstate is never overwritten.
    const acsFix = await pool.query(
      `UPDATE knowledge_sources
       SET link_status = 'needs_review',
           last_check_error = 'ACS breast cancer URL returned 404 — flagged Aug 2026 audit'
       WHERE source_url LIKE '%cancer.org%breast-cancer%'
         AND status = 'active'
         AND (link_status IS NULL OR link_status = 'unchecked')
       RETURNING id`
    );
    if (acsFix.rowCount && acsFix.rowCount > 0) {
      log(`Library link health: flagged ${acsFix.rowCount} ACS breast cancer source(s) as needs_review`);
    } else {
      log(`Library link health: ACS breast cancer source already reviewed or not found — no change`);
    }

    // Report overall link health state
    const summary = await pool.query<{ link_status: string | null; cnt: string }>(
      `SELECT COALESCE(link_status, 'unchecked') AS link_status, COUNT(*) AS cnt
       FROM knowledge_sources
       WHERE status = 'active'
       GROUP BY COALESCE(link_status, 'unchecked')
       ORDER BY cnt DESC`
    );
    const breakdown = summary.rows.map(r => `${r.link_status}:${r.cnt}`).join(", ");
    log(`Library link health summary: ${breakdown}`);
  } catch (err: unknown) {
    warn(`ensureLibraryLinkHealth failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Business Claims v2 — conflict report + unique index attempt ───────────────
// Produces a pre-migration conflict report to Railway logs, then attempts to
// create the unique indexes. If data conflicts exist the indexes will fail
// gracefully (logged, server continues). Admin must resolve conflicts manually
// before the indexes succeed.
async function ensureBusinessClaimsV2ConflictReport(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // ── Conflict check 1: multiple open claims for the same (business_id, user_id)
    const claimConflicts = await pool.query<{
      business_id: string; user_id: string | null; cnt: string;
    }>(
      `SELECT business_id, user_id, COUNT(*) AS cnt
       FROM business_claims
       WHERE status IN ('pending', 'needs_info')
       GROUP BY business_id, user_id
       HAVING COUNT(*) > 1`
    );
    if (claimConflicts.rowCount && claimConflicts.rowCount > 0) {
      const detail = claimConflicts.rows
        .map(r => `business=${r.business_id} user=${r.user_id ?? "null"} (${r.cnt} open)`)
        .join("; ");
      warn(`Business claims v2 — open-claim conflicts (must resolve before unique index applies): ${detail}`);
    } else {
      log(`Business claims v2 — no open-claim conflicts found`);
    }

    // ── Conflict check 2: multiple active primary owner links for same business_id
    const ownerConflicts = await pool.query<{ business_id: string; cnt: string }>(
      `SELECT business_id, COUNT(*) AS cnt
       FROM business_owner_links
       WHERE role = 'owner' AND status = 'approved' AND revoked_at IS NULL
       GROUP BY business_id
       HAVING COUNT(*) > 1`
    );
    if (ownerConflicts.rowCount && ownerConflicts.rowCount > 0) {
      const detail = ownerConflicts.rows
        .map(r => `business=${r.business_id} (${r.cnt} active owners)`)
        .join("; ");
      warn(`Business owner links v2 — duplicate active owner conflicts: ${detail}`);
    } else {
      log(`Business owner links v2 — no duplicate active owner conflicts found`);
    }

    // ── Attempt unique index creation (fails gracefully if conflicts exist)
    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS business_claims_one_open_per_member_biz
       ON business_claims (business_id, user_id)
       WHERE status IN ('pending', 'needs_info') AND user_id IS NOT NULL`
    );
    log(`Business claims v2 — unique index business_claims_one_open_per_member_biz: OK`);

    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS business_owner_links_one_active_primary_owner
       ON business_owner_links (business_id)
       WHERE role = 'owner' AND status = 'approved' AND revoked_at IS NULL`
    );
    log(`Business claims v2 — unique index business_owner_links_one_active_primary_owner: OK`);

    // Total open claims count for ops awareness
    const totals = await pool.query<{ status: string; cnt: string }>(
      `SELECT status, COUNT(*) AS cnt FROM business_claims GROUP BY status ORDER BY cnt DESC`
    );
    const tStr = totals.rows.map(r => `${r.status}:${r.cnt}`).join(", ");
    log(`Business claims v2 — claim status distribution: ${tStr}`);
  } catch (err: unknown) {
    warn(`ensureBusinessClaimsV2ConflictReport failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Discoverability coordinates audit ─────────────────────────────────────────
// Validates coordinate coverage for the three non-business map collections and
// logs a per-collection proof count that appears in Railway boot logs as evidence.
// Does NOT synthesize city-centroid coordinates — any row missing both a numeric
// coordinate AND a geocodable address is reported but left null.
// Runs AFTER geocodeTourContent so it measures the post-geocode state.
async function ensureDiscoverabilityCoordinatesV1(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    const [sitesR, evtsR, orgsR] = await Promise.all([
      pool.query<{ total: string; with_coords: string; no_coords: string; no_address: string }>(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                            AND latitude  BETWEEN -90  AND 90
                            AND longitude BETWEEN -180 AND 180
                            AND NOT (latitude = 0 AND longitude = 0)) AS with_coords,
          COUNT(*) FILTER (WHERE (latitude IS NULL OR longitude IS NULL)
                            OR (latitude = 0 AND longitude = 0))   AS no_coords,
          COUNT(*) FILTER (WHERE (latitude IS NULL OR longitude IS NULL)
                            OR (latitude = 0 AND longitude = 0)
                            AND address IS NULL)                    AS no_address
        FROM tour_cultural_sites WHERE is_active = true
      `),
      pool.query<{ total: string; with_coords: string; no_coords: string; no_address: string }>(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                            AND latitude  BETWEEN -90  AND 90
                            AND longitude BETWEEN -180 AND 180
                            AND NOT (latitude = 0 AND longitude = 0)) AS with_coords,
          COUNT(*) FILTER (WHERE (latitude IS NULL OR longitude IS NULL)
                            OR (latitude = 0 AND longitude = 0))   AS no_coords,
          COUNT(*) FILTER (WHERE (latitude IS NULL OR longitude IS NULL)
                            OR (latitude = 0 AND longitude = 0)
                            AND address IS NULL AND venue IS NULL)  AS no_address
        FROM recurring_events WHERE is_active = true
      `),
      pool.query<{ total: string; with_coords: string; no_coords: string; no_address: string }>(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                            AND latitude  BETWEEN -90  AND 90
                            AND longitude BETWEEN -180 AND 180
                            AND NOT (latitude = 0 AND longitude = 0)) AS with_coords,
          COUNT(*) FILTER (WHERE (latitude IS NULL OR longitude IS NULL)
                            OR (latitude = 0 AND longitude = 0))   AS no_coords,
          COUNT(*) FILTER (WHERE (latitude IS NULL OR longitude IS NULL)
                            OR (latitude = 0 AND longitude = 0)
                            AND address IS NULL)                    AS no_address
        FROM community_organizations WHERE is_active = true
      `),
    ]);

    const s = sitesR.rows[0];
    const e = evtsR.rows[0];
    const o = orgsR.rows[0];

    log(
      `Discoverability coords v1 — ` +
      `cultural_sites: ${s.with_coords}/${s.total} mapped (${s.no_coords} missing, ${s.no_address} no-address) | ` +
      `recurring_events: ${e.with_coords}/${e.total} mapped (${e.no_coords} missing, ${e.no_address} no-address) | ` +
      `community_orgs: ${o.with_coords}/${o.total} mapped (${o.no_coords} missing, ${o.no_address} no-address)`
    );
  } catch (err: unknown) {
    warn(`ensureDiscoverabilityCoordinatesV1 failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Kinfolk entity registry tables ────────────────────────────────────────────
// Phase 1 schema for kinfolk_entities + kinfolk_entity_aliases. The in-memory
// entity-resolver.ts handles resolution; these tables support Phase 2 DB-backed
// entity management. Created additive — never alters existing rows.
// ── Philadelphia murals + site_type column + site_contributions table ─────────
// Adds site_type discriminator to tour_cultural_sites (default 'landmark'),
// creates site_contributions for community comments/media, and seeds 55
// Philadelphia murals from the Mural Arts Program and public art canon.
async function ensurePhiladelphiaMurals(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // ── schema ────────────────────────────────────────────────────────────────
    await pool.query(`
      ALTER TABLE tour_cultural_sites
        ADD COLUMN IF NOT EXISTS site_type TEXT NOT NULL DEFAULT 'landmark'
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_contributions (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id       UUID        NOT NULL,
        user_id       TEXT        NOT NULL,
        author_name   TEXT,
        comment_text  TEXT        NOT NULL,
        image_url     TEXT,
        video_url     TEXT,
        status        TEXT        NOT NULL DEFAULT 'pending',
        helpful_count INTEGER     NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_site_contrib_site
        ON site_contributions(site_id) WHERE status = 'approved'
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_site_contrib_user
        ON site_contributions(user_id)
    `);

    // ── seed murals ───────────────────────────────────────────────────────────
    // 55 Philadelphia murals. Coordinates are approximate neighborhood-level for
    // all except well-known fixed installations (Magic Gardens, Keith Haring, etc.).
    // Source: Mural Arts Philadelphia public map + public record.
    type MuralRow = { name: string; address: string; description: string; lat: number; lng: number };
    const murals: MuralRow[] = [
      // ── South Street / South Philadelphia ─────────────────────────────────
      {
        name: "Philadelphia's Magic Gardens",
        address: "1020 South St, Philadelphia, PA",
        description: "Isaiah Zagar's immersive mosaic mural environment covering an entire city block on South Street. One of the most visited public art destinations in Philadelphia, built over 14 years with found objects, bicycle wheels, mirror shards, and folk art.",
        lat: 39.9427, lng: -75.1583,
      },
      {
        name: "We The Youth — Keith Haring",
        address: "22nd St & Ellsworth St, Philadelphia, PA",
        description: "Painted by Keith Haring in 1987, one of his last outdoor murals before his death in 1990. Bright primary colors on a school wall in South Philadelphia. Restored and landmarked by the city as a permanent public art installation.",
        lat: 39.9378, lng: -75.1768,
      },
      {
        name: "Tribute to Aretha Franklin",
        address: "1525 Locust St, Philadelphia, PA",
        description: "A Mural Arts Philadelphia tribute to the Queen of Soul, Aretha Franklin, painted after her passing in 2018. Part of a national conversation about honoring Black musical legends in public space.",
        lat: 39.9474, lng: -75.1659,
      },
      {
        name: "William Still — Father of the Underground Railroad",
        address: "South St & 7th St, Philadelphia, PA",
        description: "Honors William Still, a free Black Philadelphian who documented the stories of over 800 freedom seekers on the Underground Railroad. His 1872 book 'The Underground Railroad' remains a primary historical record.",
        lat: 39.9435, lng: -75.1556,
      },
      {
        name: "South Street Stories",
        address: "South St & 4th St, Philadelphia, PA",
        description: "A community narrative mural along South Street celebrating the multicultural history of the corridor — from its 1960s counterculture era to its roots as a Black commercial district known as 'the highway' to Baltimore.",
        lat: 39.9430, lng: -75.1480,
      },
      {
        name: "1947 — Jackie Robinson Integration",
        address: "S Broad St & Carpenter St, Philadelphia, PA",
        description: "Commemorates Jackie Robinson's 1947 integration of Major League Baseball and the role of Black Philadelphia fans and athletes in pushing for integration across American sports.",
        lat: 39.9422, lng: -75.1650,
      },
      {
        name: "Passyunk Pride",
        address: "E Passyunk Ave & Morris St, Philadelphia, PA",
        description: "A neighborhood identity mural on East Passyunk Avenue celebrating the multicultural working-class roots of South Philadelphia and the communities who shaped it.",
        lat: 39.9315, lng: -75.1638,
      },
      {
        name: "Tribute to Frankie Beverly",
        address: "Washington Ave & 2nd St, Philadelphia, PA",
        description: "Honoring Frankie Beverly, born in Philadelphia and founder of Maze featuring Frankie Beverly. His anthem 'Before I Let Go' has been a staple of Black family gatherings for generations.",
        lat: 39.9296, lng: -75.1594,
      },
      {
        name: "Tribute to Sun Ra",
        address: "Passyunk Ave & Federal St, Philadelphia, PA",
        description: "Honoring avant-garde jazz musician Sun Ra, who spent formative years in Philadelphia before his career in Chicago and New York. His Arkestra performed frequently in the city's Black cultural spaces.",
        lat: 39.9390, lng: -75.1592,
      },
      {
        name: "1919 Race Riots Memorial Mural",
        address: "S 20th St & McKean St, Philadelphia, PA",
        description: "A sobering memorial to the Philadelphia race riots of 1918–1919, when Black residents were targeted in South Philadelphia neighborhoods. Part of the Mural Arts Program's Truth, Racial Healing & Transformation series.",
        lat: 39.9287, lng: -75.1583,
      },
      {
        name: "Grays Ferry Neighborhood Roots",
        address: "Grays Ferry Ave & 28th St, Philadelphia, PA",
        description: "Celebrates the deep history of the Grays Ferry neighborhood, one of Philadelphia's oldest corridors, and the Black and Irish working-class families who lived side by side along the Schuylkill River.",
        lat: 39.9255, lng: -75.1825,
      },
      {
        name: "Italian Market Memory",
        address: "9th St & Washington Ave, Philadelphia, PA",
        description: "A tribute to the multi-generational story of the 9th Street Italian Market — the oldest and largest working outdoor market in the United States — and the Black, Latino, and immigrant vendors who make it run.",
        lat: 39.9325, lng: -75.1578,
      },
      {
        name: "Philly Soul",
        address: "S Broad St & Tasker St, Philadelphia, PA",
        description: "Celebrating the Philadelphia soul sound — TSOP (The Sound of Philadelphia) — and the city's outsized contribution to American R&B through artists like The Stylistics, The O'Jays, Harold Melvin & the Blue Notes, and Patti LaBelle.",
        lat: 39.9350, lng: -75.1650,
      },
      {
        name: "Tribute to Patti LaBelle",
        address: "S 20th St & Wharton St, Philadelphia, PA",
        description: "Honoring Patti LaBelle, born Patricia Louise Holte in North Philadelphia, as one of the most powerful voices in American soul and gospel music. She remains deeply connected to her Philadelphia roots.",
        lat: 39.9350, lng: -75.1760,
      },

      // ── Center City / Spring Garden / Broad Street ─────────────────────────
      {
        name: "Hope for the Future — Meg Saligman",
        address: "1522 Spring Garden St, Philadelphia, PA",
        description: "A monumental Mural Arts Philadelphia work by Meg Saligman (1999) spanning several stories on a building at Spring Garden and N 16th St. One of the largest murals in Philadelphia, depicting hands reaching upward against a sky of color.",
        lat: 39.9641, lng: -75.1570,
      },
      {
        name: "Common Thread",
        address: "N Broad St & Fairmount Ave, Philadelphia, PA",
        description: "Part of the Avenue of the Arts initiative, this Mural Arts Philadelphia piece explores the shared threads of community identity across Philadelphia's diverse neighborhoods along the Broad Street corridor.",
        lat: 39.9597, lng: -75.1575,
      },
      {
        name: "MLK — The Dream Lives On",
        address: "N Broad St & Spring Garden St, Philadelphia, PA",
        description: "One of several Mural Arts Philadelphia tributes to Dr. Martin Luther King Jr. along the Broad Street corridor, celebrating his Philadelphia connections and the city's Civil Rights movement.",
        lat: 39.9627, lng: -75.1571,
      },
      {
        name: "Thomas Eakins Tribute",
        address: "22nd St & Market St, Philadelphia, PA",
        description: "A tribute to Philadelphia painter Thomas Eakins, whose realist portraits of Black Philadelphia life in the late 19th century were groundbreaking for their time. His studio was a gathering place for the city's artists.",
        lat: 39.9528, lng: -75.1762,
      },
      {
        name: "Philadelphia Freedom",
        address: "Chestnut St & 15th St, Philadelphia, PA",
        description: "A sweeping Center City mural celebrating Philadelphia as the birthplace of American liberty and exploring the contradiction between that founding promise and the lived experience of Black Philadelphians through history.",
        lat: 39.9496, lng: -75.1634,
      },
      {
        name: "Octavius Catto — Unfinished Revolution",
        address: "S Broad St & Carpenter St, Philadelphia, PA",
        description: "Honors Octavius Catto (1839–1871), a Black civil rights leader, educator, and baseball organizer assassinated on Election Day 1871 while trying to vote. A companion to the Catto statue outside City Hall.",
        lat: 39.9464, lng: -75.1669,
      },

      // ── Historic District / Old City / Bella Vista ─────────────────────────
      {
        name: "Richard Allen & Absalom Jones — Free African Society",
        address: "6th St & Lombard St, Philadelphia, PA",
        description: "Honors Richard Allen and Absalom Jones, founders of the Free African Society (1787) — the first independent Black civic organization in the Western Hemisphere — and Mother Bethel AME Church at this location.",
        lat: 39.9440, lng: -75.1497,
      },
      {
        name: "Free African Society 1787",
        address: "6th St & Pine St, Philadelphia, PA",
        description: "Commemorates the founding of the Free African Society in Philadelphia in 1787, celebrating its founders' vision of Black self-determination and mutual aid that predates the U.S. Constitution.",
        lat: 39.9443, lng: -75.1492,
      },
      {
        name: "Mother Bethel AME Heritage",
        address: "419 S 6th St, Philadelphia, PA",
        description: "Depicts the history of Mother Bethel African Methodist Episcopal Church, the oldest parcel of land continuously owned by Black Americans in the United States, established 1794 by Bishop Richard Allen.",
        lat: 39.9441, lng: -75.1498,
      },
      {
        name: "Harriet Tubman — Moses of Her People",
        address: "N 8th St & Spring Garden St, Philadelphia, PA",
        description: "A powerful portrait mural of Harriet Tubman, celebrating her many trips to Philadelphia on the Underground Railroad and her collaboration with William Still and the Philadelphia Vigilance Committee.",
        lat: 39.9638, lng: -75.1523,
      },

      // ── North Philadelphia (historically Black) ────────────────────────────
      {
        name: "Muhammad Ali — The Greatest",
        address: "Columbia Ave & Ridge Ave, Philadelphia, PA",
        description: "A towering portrait of Muhammad Ali in North Philadelphia, honoring his connection to the Black freedom movement and his visits to the city's Black communities during the Civil Rights era.",
        lat: 39.9780, lng: -75.1720,
      },
      {
        name: "Tribute to John Coltrane",
        address: "N Broad St & Jefferson St, Philadelphia, PA",
        description: "Honoring John Coltrane, who moved to Philadelphia in 1943 and shaped his revolutionary jazz sound in the city's clubs and after-hours spaces before moving to New York. A Love Supreme was composed during his Philadelphia years.",
        lat: 39.9832, lng: -75.1697,
      },
      {
        name: "Cecil B. Moore — Civil Rights Pioneer",
        address: "N Broad St & Cecil B. Moore Ave, Philadelphia, PA",
        description: "Honors Cecil B. Moore, the firebrand NAACP Philadelphia chapter president who led the 1963–1964 picket of Girard College (which had barred Black students from its endowment-funded school) — one of the longest civil rights demonstrations in US history.",
        lat: 39.9803, lng: -75.1577,
      },
      {
        name: "Words, Beats & Life — Hip Hop Heritage",
        address: "N Broad St & Oxford St, Philadelphia, PA",
        description: "Celebrating Philadelphia's contribution to hip-hop culture — from DJ Jazzy Jeff & The Fresh Prince (Will Smith) to Meek Mill — and the role of North Philly block parties and rec centers in shaping the genre.",
        lat: 39.9917, lng: -75.1576,
      },
      {
        name: "Frederick Douglass — Voice of Freedom",
        address: "N 17th St & Diamond St, Philadelphia, PA",
        description: "A portrait mural of Frederick Douglass, celebrating his many visits to Philadelphia and his alliances with Black Philadelphia abolitionists. The city was a key stop on his speaking tours.",
        lat: 39.9870, lng: -75.1590,
      },
      {
        name: "Spirit of Community",
        address: "Cecil B. Moore Ave & 17th St, Philadelphia, PA",
        description: "A community-created mural celebrating the resilience of North Philadelphia neighborhoods and the intergenerational bonds that have sustained Black Philadelphia through urban renewal, disinvestment, and rebuilding.",
        lat: 39.9803, lng: -75.1642,
      },
      {
        name: "Children's Garden Mural",
        address: "Girard Ave & 18th St, Philadelphia, PA",
        description: "A vibrant mural outside a North Philadelphia community garden space, depicting children tending plants and celebrating the connection between Black urban communities and food sovereignty.",
        lat: 39.9736, lng: -75.1695,
      },
      {
        name: "Marcus Garvey — Back to Africa Movement",
        address: "N Broad St & Susquehanna Ave, Philadelphia, PA",
        description: "Honoring Marcus Garvey and his Pan-African vision. Philadelphia had one of the strongest UNIA chapters in the northeastern United States during the 1920s, centered in North Philadelphia.",
        lat: 39.9897, lng: -75.1609,
      },
      {
        name: "Lee Elder — Golf Pioneer",
        address: "N 18th St & Lehigh Ave, Philadelphia, PA",
        description: "Celebrating Lee Elder, who in 1975 became the first Black golfer to play in the Masters Tournament. A tribute to Black athletic excellence and the struggle to access sports historically closed to African Americans.",
        lat: 39.9889, lng: -75.1623,
      },
      {
        name: "Dizzy Gillespie — Bebop Philadelphia",
        address: "N Broad St & Norris St, Philadelphia, PA",
        description: "Honoring Dizzy Gillespie, who spent pivotal years of his career in Philadelphia's jazz clubs and mentored many musicians who would define bebop. His collaborations with Philadelphian Charlie Parker changed American music.",
        lat: 39.9862, lng: -75.1623,
      },
      {
        name: "Nicetown Corridor — Community Resilience",
        address: "Hunting Park Ave & 18th St, Philadelphia, PA",
        description: "A community-driven mural in the Nicetown-Tioga neighborhood celebrating the neighborhood's history as a working-class Black community and its ongoing revival through resident-led investment and organizing.",
        lat: 40.0050, lng: -75.1620,
      },
      {
        name: "North Philly Peace Park Mural",
        address: "N 19th St & Huntingdon St, Philadelphia, PA",
        description: "Surrounding the North Philadelphia Peace Park, this large-scale community mural depicts elders, youth, and ancestors in a cycle of knowledge transfer — a visual prayer for the neighborhood's future.",
        lat: 40.0021, lng: -75.1754,
      },
      {
        name: "Diamond Street Mural",
        address: "33rd St & Diamond St, Philadelphia, PA",
        description: "A North Philadelphia mural at the edge of the Strawberry Mansion neighborhood, celebrating the community's cultural heritage and the families who have shaped the corridor for generations.",
        lat: 39.9920, lng: -75.1860,
      },
      {
        name: "Strawberry Mansion Community Story",
        address: "N 30th St & Dauphin St, Philadelphia, PA",
        description: "Depicts the history of the Strawberry Mansion neighborhood — once a prosperous Jewish community, then a thriving Black middle-class enclave, and now a community working to preserve its legacy and rebuild.",
        lat: 40.0010, lng: -75.1820,
      },
      {
        name: "Strawberry Mansion Bridge Mural",
        address: "Strawberry Mansion Dr & Edgely Dr, Philadelphia, PA",
        description: "A mural on the approach to the historic Strawberry Mansion Bridge in Fairmount Park, celebrating the neighborhood's relationship with the Schuylkill River and the natural landscape of North Philadelphia.",
        lat: 40.0035, lng: -75.1859,
      },

      // ── West Philadelphia ──────────────────────────────────────────────────
      {
        name: "Clark Park Mural — West Philadelphia Roots",
        address: "Chester Ave & 43rd St, Philadelphia, PA",
        description: "Near Clark Park in West Philadelphia, this mural celebrates the neighborhood's identity as a diverse, walkable community with deep Black roots centered on Baltimore Avenue and the park itself.",
        lat: 39.9464, lng: -75.2128,
      },
      {
        name: "West Philly Rising",
        address: "52nd St & Baltimore Ave, Philadelphia, PA",
        description: "A mural on the 52nd Street commercial corridor celebrating West Philadelphia's Black business community and the cultural renaissance taking place along Baltimore Avenue.",
        lat: 39.9487, lng: -75.2168,
      },
      {
        name: "Sankofa — We Must Know Where We Came From",
        address: "46th St & Woodland Ave, Philadelphia, PA",
        description: "Based on the Akan concept of Sankofa — looking back to move forward — this West Philadelphia mural depicts ancestors passing knowledge to younger generations through art, music, and community.",
        lat: 39.9472, lng: -75.2135,
      },
      {
        name: "Malcolm X Park Tribute",
        address: "51st St & Pine St, Philadelphia, PA",
        description: "Near Malcolm X Park in West Philadelphia, this mural celebrates the park's role as a community gathering space and the legacy of Malcolm X's vision of Black self-determination in urban America.",
        lat: 39.9511, lng: -75.2165,
      },
      {
        name: "Tribute to Jazz Masters — West Philadelphia",
        address: "44th St & Baltimore Ave, Philadelphia, PA",
        description: "Celebrating Philadelphia's jazz legends with West Philadelphia roots — including Lee Morgan, Jimmy Heath, and Bobby Timmons — who came of age in the clubs and jam sessions of Black West Philadelphia.",
        lat: 39.9484, lng: -75.2073,
      },
      {
        name: "Roots — Honoring Alex Haley's Legacy",
        address: "46th St & Baltimore Ave, Philadelphia, PA",
        description: "A tribute to Alex Haley's Roots and the broader genealogy movement among African Americans. West Philadelphia has one of the most active genealogy communities in Black America.",
        lat: 39.9462, lng: -75.2100,
      },
      {
        name: "Baltimore Avenue Corridor Mural",
        address: "Baltimore Ave & 50th St, Philadelphia, PA",
        description: "A long-running Mural Arts Philadelphia installation along the Baltimore Avenue corridor celebrating the small businesses, cultural institutions, and diverse communities that line one of West Philadelphia's main arteries.",
        lat: 39.9480, lng: -75.2190,
      },
      {
        name: "Tribute to Bilal — Philadelphia Soul",
        address: "44th St & Chestnut St, Philadelphia, PA",
        description: "Honoring Bilal Oliver, a West Philadelphia native and one of the most influential voices in neo-soul music. His debut album First Born Second (2001) is considered a landmark of the Philadelphia sound.",
        lat: 39.9460, lng: -75.2105,
      },
      {
        name: "Community Garden Mural — Point Breeze",
        address: "22nd St & Federal St, Philadelphia, PA",
        description: "Surrounding a community garden in the Point Breeze neighborhood, this mural depicts the African American tradition of urban gardening and food sovereignty as both survival and cultural expression.",
        lat: 39.9300, lng: -75.1720,
      },

      // ── Germantown / Mt. Airy / Chestnut Hill ─────────────────────────────
      {
        name: "Jump Rope — Eric Okdeh",
        address: "Germantown Ave & Tulpehocken St, Philadelphia, PA",
        description: "By muralist Eric Okdeh, this beloved mural in Germantown depicts children jumping rope on a Philadelphia street — a universal image of childhood joy that resonates deeply with the neighborhood's multigenerational families.",
        lat: 40.0383, lng: -75.1715,
      },
      {
        name: "Germantown Avenue History Mural",
        address: "Germantown Ave & Chelten Ave, Philadelphia, PA",
        description: "Documents the layered history of Germantown Avenue — one of the oldest roads in America — from Lenape pathways to colonial settlement to the vibrant Black community that made Germantown a cultural hub in the 20th century.",
        lat: 40.0297, lng: -75.1684,
      },
      {
        name: "Battle of Germantown Commemorative",
        address: "Germantown Ave & School House Ln, Philadelphia, PA",
        description: "Commemorates the 1777 Battle of Germantown and the often-untold stories of enslaved people and free Black Philadelphians who were present during the Revolutionary War era in this neighborhood.",
        lat: 40.0342, lng: -75.1706,
      },

      // ── Kensington / Fishtown / Northern Liberties ────────────────────────
      {
        name: "Kensington Kindness",
        address: "Kensington Ave & Lehigh Ave, Philadelphia, PA",
        description: "A community-driven mural in the Kensington neighborhood created as part of a public health and community resilience initiative. Depicts local faces, stories of recovery, and hope for the neighborhood's future.",
        lat: 39.9977, lng: -75.1338,
      },
      {
        name: "Fishtown Arts District Mural",
        address: "Girard Ave & Front St, Philadelphia, PA",
        description: "Celebrating Fishtown's transformation into an arts district while honoring the longtime working-class families — many of them Black and Puerto Rican — who made the neighborhood before gentrification.",
        lat: 39.9740, lng: -75.1368,
      },
      {
        name: "Spectrum of Light",
        address: "Kensington Ave & Somerset St, Philadelphia, PA",
        description: "A large-scale Mural Arts Philadelphia installation in Kensington using refracted light imagery to explore themes of hope, healing, and the complexity of human experience in one of the city's most challenged neighborhoods.",
        lat: 39.9983, lng: -75.1298,
      },

      // ── Fairmount / Art Museum area ────────────────────────────────────────
      {
        name: "Fairmount Avenue — Neighborhood Tapestry",
        address: "Fairmount Ave & N 24th St, Philadelphia, PA",
        description: "A mural along Fairmount Avenue celebrating the neighborhood's identity as a mixed community — working class, artistic, and rooted in Philadelphia's long tradition of neighborhood identity along the Benjamin Franklin Parkway corridor.",
        lat: 39.9680, lng: -75.1828,
      },
      {
        name: "Wissahickon Watershed Mural",
        address: "Germantown Ave & Wissahickon Ave, Philadelphia, PA",
        description: "A nature-inspired mural celebrating the Wissahickon Creek watershed and the long tradition of Black families enjoying Fairmount Park's Wissahickon Valley — one of the largest urban parks in the United States.",
        lat: 40.0553, lng: -75.2140,
      },
    ];

    let inserted = 0;
    let skipped  = 0;
    for (const m of murals) {
      const existing = await pool.query(
        `SELECT id FROM tour_cultural_sites
         WHERE LOWER(name) = LOWER($1) AND LOWER(city) = LOWER('Philadelphia')
         LIMIT 1`,
        [m.name],
      );
      if (existing.rows.length > 0) { skipped++; continue; }

      await pool.query(
        `INSERT INTO tour_cultural_sites
           (name, city, state, address, description, latitude, longitude,
            site_type, is_active, tour_source, created_at, updated_at)
         VALUES ($1,'Philadelphia','PA',$2,$3,$4,$5,'mural',true,true,NOW(),NOW())`,
        [m.name, m.address, m.description, m.lat, m.lng],
      );
      inserted++;
    }
    log(`Philadelphia murals: ${inserted} inserted, ${skipped} already present (${murals.length} total)`);
  } catch (err: unknown) {
    warn(`ensurePhiladelphiaMurals failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Generic tour-site batch insert for murals ─────────────────────────────────
// Dedup by LOWER(name)|LOWER(city). site_type always 'mural'.
async function ensureMuralsBatch(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city) AS k FROM tour_cultural_sites`,
    );
    const existing = new Set<string>(r.rows.map((row: { k: string }) => row.k));
    let inserted = 0; let skipped = 0;
    for (const m of MURALS_DIASPORA_V1) {
      const key = `${m.name.toLowerCase()}|${m.city.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO tour_cultural_sites
             (name, city, state, address, description, latitude, longitude,
              site_type, is_active, tour_source, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'mural',true,true,NOW(),NOW())`,
          [m.name, m.city, m.state, m.address, m.description, m.lat, m.lng],
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  murals-diaspora-v1: failed "${m.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Murals diaspora v1: ${inserted} inserted, ${skipped} already present (${MURALS_DIASPORA_V1.length} total)`);
  } catch (err: unknown) {
    warn(`ensureMuralsBatch failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Generic tour-site batch insert for monuments/museums/spiritual ────────────
// Dedup by LOWER(name)|LOWER(city). Uses each site's own siteType field.
async function ensureCulturalTourSiteBatch(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city) AS k FROM tour_cultural_sites`,
    );
    const existing = new Set<string>(r.rows.map((row: { k: string }) => row.k));
    let inserted = 0; let skipped = 0;
    for (const s of MONUMENTS_CULTURAL_V1) {
      const key = `${s.name.toLowerCase()}|${s.city.toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        await pool.query(
          `INSERT INTO tour_cultural_sites
             (name, city, state, address, description, latitude, longitude,
              site_type, is_active, tour_source, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,true,NOW(),NOW())`,
          [s.name, s.city, s.state, s.address, s.description, s.lat, s.lng, s.siteType],
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  monuments-cultural-v1: failed "${s.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Monuments cultural v1: ${inserted} inserted, ${skipped} already present (${MONUMENTS_CULTURAL_V1.length} total)`);
  } catch (err: unknown) {
    warn(`ensureCulturalTourSiteBatch failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Generic business batch insert for food trucks, dispensaries, etc. ─────────
// Uses the full ensureDirectoryBusinesses pattern (ownershipDesignations supported).
// Dedup by LOWER(name)|LOWER(city)|LOWER(state).
async function ensureBusinessBatch(
  label: string,
  businesses: LaundrySeedBiz[],
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(COALESCE(state,'')) AS k FROM businesses`,
    );
    const existing = new Set<string>(r.rows.map((row: { k: string }) => row.k));
    const BLACK_DESIGNATIONS = [
      "Black / African American-Owned", "African-Owned", "West African-Owned",
      "Nigerian-Owned", "Ghanaian-Owned", "Haitian-Owned",
      "Caribbean / West Indian-Owned", "Afro-Caribbean-Owned", "Afro-Latino-Owned",
    ];
    let inserted = 0; let skipped = 0;
    for (const b of businesses) {
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${(b.state ?? "").toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        const isBlack = (b.ownershipDesignations ?? []).some((d: string) => BLACK_DESIGNATIONS.includes(d));
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state, country,
             description, ownership_designations, black_owned,
             latitude, longitude, website,
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
             $9,$10,$11,
             $12,$13,$14,
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
            b.address ?? `${b.city}, ${b.state}`,
            b.city, b.state ?? null, b.country ?? "USA",
            b.description,
            JSON.stringify(b.ownershipDesignations ?? []),
            isBlack,
            String(b.lat), String(b.lng),
            b.website ?? null,
          ],
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  ${label}: failed "${b.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`${label}: ${inserted} inserted, ${skipped} already present (${businesses.length} total)`);
  } catch (err: unknown) {
    warn(`${label} seed failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Minority-owned laundry businesses ────────────────────────────────────────
// Idempotent dedup by name+city+state. Inserts with ownershipDesignations so
// Kinfolk can surface them by ownership when members search for laundry services.
async function ensureLaundryBusinesses(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(city)||'|'||LOWER(COALESCE(state,'')) AS k FROM businesses`,
    );
    const existing = new Set<string>(r.rows.map((row: { k: string }) => row.k));

    let inserted = 0;
    let skipped = 0;

    for (const b of LAUNDRY_SEED_V1) {
      const key = `${b.name.toLowerCase()}|${b.city.toLowerCase()}|${(b.state ?? "").toLowerCase()}`;
      if (existing.has(key)) { skipped++; continue; }
      try {
        const BLACK_DESIGNATIONS = [
          "Black / African American-Owned", "African-Owned", "West African-Owned",
          "Nigerian-Owned", "Ghanaian-Owned", "Haitian-Owned",
          "Caribbean / West Indian-Owned", "Afro-Caribbean-Owned", "Afro-Latino-Owned",
        ];
        const isBlack = (b.ownershipDesignations ?? []).some((d: string) => BLACK_DESIGNATIONS.includes(d));
        await pool.query(
          `INSERT INTO businesses
            (id, name, category, subcategory, address, city, state, country,
             description, ownership_designations, black_owned,
             latitude, longitude, website,
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
             $9,$10,$11,
             $12,$13,$14,
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
            b.address ?? `${b.city}, ${b.state}`,
            b.city, b.state ?? null, b.country ?? "USA",
            b.description,
            JSON.stringify(b.ownershipDesignations ?? []),
            isBlack,
            String(b.lat), String(b.lng),
            b.website ?? null,
          ],
        );
        existing.add(key);
        inserted++;
      } catch (err: unknown) {
        warn(`  Laundry seed: failed to insert "${b.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    log(`Laundry businesses v1: ${inserted} inserted, ${skipped} already present (${LAUNDRY_SEED_V1.length} total)`);
  } catch (err: unknown) {
    warn(`Laundry businesses seed failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Kinfolk Cultural Context v1 ───────────────────────────────────────────────
// Creates/alters the entity disambiguation schema and seeds the 8 founder-reviewed
// source records + 8 entities. All operations are idempotent (IF NOT EXISTS / DO NOTHING).
// MUST run AFTER ensureKinfolkEntityRegistry (which creates the base tables).
async function ensureKinfolkCulturalContextV1(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // ── 1. kinfolk_source_records table ────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kinfolk_source_records (
        id              text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        canonical_url   text        NOT NULL UNIQUE,
        publisher       text        NOT NULL,
        title           text        NOT NULL,
        tier            text        NOT NULL CHECK (tier IN ('A','B','C')),
        claim_scope     text[]      NOT NULL DEFAULT '{}',
        status          text        NOT NULL DEFAULT 'active',
        expected_host   text,
        http_status     integer,
        last_checked_at timestamptz,
        notes           text,
        created_at      timestamptz NOT NULL DEFAULT now(),
        updated_at      timestamptz NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ksr_tier   ON kinfolk_source_records(tier)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ksr_status ON kinfolk_source_records(status)`);

    // ── 2. kinfolk_entities — add missing columns (idempotent) ─────────────────
    for (const [col, def] of [
      ["normalized_name",   "text"],
      ["short_summary",     "text"],
      ["country_codes",     "text[] NOT NULL DEFAULT '{}'"],
      ["language_codes",    "text[] NOT NULL DEFAULT '{}'"],
      ["resolution_status", "text NOT NULL DEFAULT 'active'"],
    ] as const) {
      await pool.query(`
        DO $$ BEGIN
          ALTER TABLE kinfolk_entities ADD COLUMN IF NOT EXISTS ${col} ${def};
        END $$
      `);
    }
    // Rename 'summary' → 'short_summary' safely if old column still present
    await pool.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='kinfolk_entities' AND column_name='summary'
            AND NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name='kinfolk_entities' AND column_name='short_summary'
            )
        ) THEN
          ALTER TABLE kinfolk_entities RENAME COLUMN summary TO short_summary;
        END IF;
      END $$
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ke_resolution_status ON kinfolk_entities(resolution_status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ke_normalized_name   ON kinfolk_entities(lower(normalized_name))`);

    // ── 3. kinfolk_entity_aliases — add missing columns ────────────────────────
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE kinfolk_entity_aliases ADD COLUMN IF NOT EXISTS normalized_alias text;
        ALTER TABLE kinfolk_entity_aliases ADD COLUMN IF NOT EXISTS locale text;
      END $$
    `);

    // ── 4. Relationship + join tables ──────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kinfolk_entity_relationships (
        id                text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        subject_entity_id text        NOT NULL REFERENCES kinfolk_entities(id) ON DELETE CASCADE,
        relationship_type text        NOT NULL,
        object_entity_id  text        REFERENCES kinfolk_entities(id) ON DELETE CASCADE,
        object_label      text,
        source_url        text,
        created_at        timestamptz NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ker_subject ON kinfolk_entity_relationships(subject_entity_id)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS kinfolk_entity_source_links (
        id         text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        entity_id  text        NOT NULL REFERENCES kinfolk_entities(id) ON DELETE CASCADE,
        source_id  text        NOT NULL REFERENCES kinfolk_source_records(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(entity_id, source_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS kinfolk_context_candidates (
        id          text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        session_id  text        NOT NULL,
        query_hash  text        NOT NULL,
        entity_id   text        REFERENCES kinfolk_entities(id) ON DELETE SET NULL,
        score       integer,
        basis       text[],
        created_at  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_kcc_session ON kinfolk_context_candidates(session_id)`);

    // ── 5. education_institutions — add optional tracking columns ─────────────
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE education_institutions ADD COLUMN IF NOT EXISTS source_id text;
        ALTER TABLE education_institutions ADD COLUMN IF NOT EXISTS source_status text;
        ALTER TABLE education_institutions ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
      END $$
    `);

    // ── 6. user_preferences — add cultural affinity + multilingual columns ─────
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS allow_cultural_affinity_ranking boolean NOT NULL DEFAULT false;
        ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS support_priorities text[] NOT NULL DEFAULT '{}';
        ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferred_response_languages text[] NOT NULL DEFAULT '{}';
        ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS multilingual_expansion_mode text NOT NULL DEFAULT 'ask';
      END $$
    `);

    // ── 7. Seed sources ────────────────────────────────────────────────────────
    type SrcRow = { canonical_url: string; publisher: string; title: string; tier: string; claim_scope: string[]; expected_host: string; notes: string };
    const SOURCES: SrcRow[] = [
      { canonical_url: "https://www.sinnersmovie.com/toolkit/",        publisher: "Sinners (Official Film)",                                tier: "A", claim_scope: ["film_credit","director_credit","cast_credit","release_year"],        expected_host: "sinnersmovie.com", notes: "Confirms Ryan Coogler as writer/director; Michael B. Jordan as lead" },
      { canonical_url: "https://www.hbomax.com/movies/sinners/2a072173-2bac-43ba-9933-10eba021ed96", publisher: "HBO Max",               tier: "A", claim_scope: ["film_credit","streaming_availability","release_year"],                 expected_host: "hbomax.com",       notes: "Official streaming page; may redirect" },
      { canonical_url: "https://www.iamtenitra.com/about",              publisher: "Michelle Williams (Artist Official Site)",              tier: "A", claim_scope: ["biography","group_membership","discography","career"],               expected_host: "iamtenitra.com",   notes: "Confirms Michelle Williams as Destiny's Child member" },
      { canonical_url: "https://nollywire.com/names/annie-macaulay-idibia/", publisher: "Nollywire",                                      tier: "B", claim_scope: ["biography","nationality","public_profile"],                           expected_host: "nollywire.com",    notes: "Tier B: reputable Nigerian entertainment publication" },
      { canonical_url: "https://www.instagram.com/annieidibia1/",       publisher: "Annie Macaulay — Public Instagram",                    tier: "C", claim_scope: ["public_identity","social_presence"],                                  expected_host: "instagram.com",    notes: "Tier C verified public creator profile" },
      { canonical_url: "https://sites.ed.gov/whhbcu/one-hundred-and-five-historically-black-colleges-and-universities/", publisher: "White House Initiative on HBCUs", tier: "A", claim_scope: ["hbcu_designation","institution_name","institution_location"], expected_host: "sites.ed.gov", notes: "Authoritative federal HBCU list" },
      { canonical_url: "https://www.temple.edu/",                       publisher: "Temple University",                                    tier: "A", claim_scope: ["institution_name","institution_location","academic_offerings"],       expected_host: "temple.edu",       notes: "Confirms Temple as Philadelphia public research university" },
      { canonical_url: "https://www.allmusic.com/artist/kendrick-lamar-mn0002683148", publisher: "AllMusic",                              tier: "B", claim_scope: ["discography","career_chronology","genre"],                            expected_host: "allmusic.com",     notes: "Tier B: trade publication for cultural-opinion context" },
      { canonical_url: "https://www.allmusic.com/artist/drake-mn0000783338",          publisher: "AllMusic",                              tier: "B", claim_scope: ["discography","career_chronology","genre"],                            expected_host: "allmusic.com",     notes: "Tier B: trade publication for cultural-opinion context" },
    ];
    for (const s of SOURCES) {
      await pool.query(
        `INSERT INTO kinfolk_source_records (canonical_url, publisher, title, tier, claim_scope, status, expected_host, notes)
         VALUES ($1,$2,$3,$4,$5,'active',$6,$7)
         ON CONFLICT (canonical_url) DO UPDATE SET
           publisher=EXCLUDED.publisher, title=EXCLUDED.title, tier=EXCLUDED.tier,
           claim_scope=EXCLUDED.claim_scope, expected_host=EXCLUDED.expected_host,
           notes=EXCLUDED.notes, updated_at=now()`,
        [s.canonical_url, s.publisher, s.canonical_url.split("/").slice(0, 4).join("/"), s.tier, s.claim_scope, s.expected_host, s.notes],
      );
    }

    // ── 8. Seed entities + aliases + source links ──────────────────────────────
    type EntSeed = {
      cn: string; etype: string; nn: string; ss: string; cc: string[]; lc: string[]; tags: string[];
      eraStart?: number; eraEnd?: number;
      aliases: { alias: string; aliasType: string; confidence: number; locale?: string }[];
      sourceUrls: string[];
    };
    const ENTITIES: EntSeed[] = [
      {
        cn: "Sinners (2025 film)", etype: "work", nn: "sinners 2025 film",
        ss: "Sinners is a 2025 horror/drama film written and directed by Ryan Coogler, starring Michael B. Jordan. Released by Warner Bros. and available on HBO Max.",
        cc: ["US"], lc: ["en"], tags: ["black cinema","ryan coogler filmography","michael b jordan","horror","drama","2025 film"], eraStart: 2025,
        aliases: [
          { alias: "Sinners", aliasType: "title", confidence: 0.75 },
          { alias: "Sinners 2025", aliasType: "title", confidence: 0.92 },
          { alias: "Sinners film", aliasType: "title", confidence: 0.92 },
          { alias: "Sinners movie", aliasType: "title", confidence: 0.92 },
        ],
        sourceUrls: ["https://www.sinnersmovie.com/toolkit/", "https://www.hbomax.com/movies/sinners/2a072173-2bac-43ba-9933-10eba021ed96"],
      },
      {
        cn: "Ryan Coogler", etype: "person", nn: "ryan coogler",
        ss: "Ryan Coogler is an American film director and screenwriter from Oakland, California. Known for Fruitvale Station (2013), Creed (2015), Black Panther (2018), Black Panther: Wakanda Forever (2022), and Sinners (2025).",
        cc: ["US"], lc: ["en"], tags: ["black cinema","film director","african american directors","marvel","ryan coogler"], eraStart: 2013,
        aliases: [
          { alias: "Ryan Coogler", aliasType: "full_name", confidence: 0.97 },
          { alias: "Coogler", aliasType: "stage_name", confidence: 0.82 },
        ],
        sourceUrls: ["https://www.sinnersmovie.com/toolkit/"],
      },
      {
        cn: "Michelle Williams (singer)", etype: "person", nn: "michelle williams singer",
        ss: "Michelle Williams is a singer, actress, and Broadway performer born July 23, 1980, in Rockford, Illinois. Best known as a member of Destiny's Child alongside Beyoncé and Kelly Rowland.",
        cc: ["US"], lc: ["en"], tags: ["destinys child","r&b","gospel","black music history","beyonce","kelly rowland","singer","broadway"], eraStart: 2000,
        aliases: [
          { alias: "Michelle Williams", aliasType: "full_name", confidence: 0.62 },
          { alias: "Michelle Williams from Destiny's Child", aliasType: "group_context", confidence: 0.99 },
          { alias: "Michelle Williams Destiny's Child", aliasType: "group_context", confidence: 0.99 },
          { alias: "Michelle Williams singer", aliasType: "group_context", confidence: 0.95 },
        ],
        sourceUrls: ["https://www.iamtenitra.com/about"],
      },
      {
        cn: "Destiny's Child", etype: "group", nn: "destinys child",
        ss: "Destiny's Child was an American R&B girl group formed in Houston, Texas. Classic lineup: Beyoncé Knowles, Kelly Rowland, and Michelle Williams. Hits include Say My Name, Survivor, Bootylicious, Independent Women Part I.",
        cc: ["US"], lc: ["en"], tags: ["r&b","black music history","houston","girl groups","beyonce","kelly rowland"], eraStart: 1990, eraEnd: 2006,
        aliases: [
          { alias: "Destiny's Child", aliasType: "full_name", confidence: 0.97 },
          { alias: "Destinys Child", aliasType: "full_name", confidence: 0.97 },
          { alias: "DC", aliasType: "stage_name", confidence: 0.30 },
        ],
        sourceUrls: ["https://www.iamtenitra.com/about"],
      },
      {
        cn: "Annie Macaulay-Idibia", etype: "person", nn: "annie macaulay idibia",
        ss: "Annie Macaulay-Idibia is a Nigerian-born public figure and entertainer married to 2face Idibia. Publicly known in Nigerian entertainment and social media circles.",
        cc: ["NG"], lc: ["en","yo"], tags: ["nigerian entertainment","nigeria","nollywood adjacent","public figure","annie idibia"], eraStart: 2010,
        aliases: [
          { alias: "Annie", aliasType: "stage_name", confidence: 0.35 },
          { alias: "Annie Macaulay", aliasType: "full_name", confidence: 0.88 },
          { alias: "Annie Idibia", aliasType: "stage_name", confidence: 0.90 },
          { alias: "Annie Macaulay-Idibia", aliasType: "full_name", confidence: 0.95 },
          { alias: "annieidibia1", aliasType: "stage_name", confidence: 0.90 },
        ],
        sourceUrls: ["https://nollywire.com/names/annie-macaulay-idibia/", "https://www.instagram.com/annieidibia1/"],
      },
      {
        cn: "Temple University", etype: "institution", nn: "temple university",
        ss: "Temple University is a public research university in Philadelphia, Pennsylvania. Founded 1884. Located in North Philadelphia. Home to 17 schools and colleges.",
        cc: ["US"], lc: ["en"], tags: ["philadelphia","pennsylvania","public university","research university","north philadelphia"], eraStart: 1884,
        aliases: [
          { alias: "Temple University", aliasType: "full_name", confidence: 0.97 },
          { alias: "Temple", aliasType: "stage_name", confidence: 0.75 },
          { alias: "TU", aliasType: "stage_name", confidence: 0.30 },
          { alias: "Temple Owls", aliasType: "stage_name", confidence: 0.80 },
        ],
        sourceUrls: ["https://www.temple.edu/"],
      },
      {
        cn: "Kendrick Lamar", etype: "person", nn: "kendrick lamar",
        ss: "Kendrick Lamar is an American rapper, songwriter, and record producer from Compton, California. Pulitzer Prize winner (2018). Albums: TPAB, DAMN., Mr. Morale.",
        cc: ["US"], lc: ["en"], tags: ["hip hop","rap","compton","black music","pulitzer","tde","pglan","music artist"], eraStart: 2011,
        aliases: [
          { alias: "Kendrick Lamar", aliasType: "full_name", confidence: 0.97 },
          { alias: "Kendrick", aliasType: "stage_name", confidence: 0.80 },
          { alias: "K.Dot", aliasType: "stage_name", confidence: 0.82 },
        ],
        sourceUrls: ["https://www.allmusic.com/artist/kendrick-lamar-mn0002683148"],
      },
      {
        cn: "Drake (rapper)", etype: "person", nn: "drake rapper",
        ss: "Drake (Aubrey Drake Graham) is a Canadian rapper, singer, songwriter, and actor from Toronto, Ontario. One of the best-selling music artists in history.",
        cc: ["CA"], lc: ["en"], tags: ["hip hop","rap","toronto","ovo","music artist","r&b","pop rap"], eraStart: 2009,
        aliases: [
          { alias: "Drake", aliasType: "stage_name", confidence: 0.83 },
          { alias: "Aubrey Drake Graham", aliasType: "full_name", confidence: 0.95 },
          { alias: "Champagne Papi", aliasType: "stage_name", confidence: 0.85 },
        ],
        sourceUrls: ["https://www.allmusic.com/artist/drake-mn0000783338"],
      },
    ];

    let entitiesInserted = 0;
    let aliasesInserted = 0;
    let linksInserted = 0;

    for (const e of ENTITIES) {
      // Upsert entity — use SELECT-first pattern to avoid dependency on the
      // UNIQUE(canonical_name) constraint (which may not exist if the dedup
      // migration failed on a previous boot due to pre-existing duplicates).
      let entityId: string;
      const existing = await pool.query(
        `SELECT id FROM kinfolk_entities WHERE lower(canonical_name)=lower($1) LIMIT 1`,
        [e.cn],
      );
      if (existing.rows.length > 0) {
        entityId = existing.rows[0].id;
        // Update the row with latest data
        await pool.query(
          `UPDATE kinfolk_entities
             SET normalized_name=$2, short_summary=$3, country_codes=$4,
                 language_codes=$5, cultural_context_tags=$6,
                 era_start=$7, era_end=$8, resolution_status='active', updated_at=now()
           WHERE id=$1`,
          [entityId, e.nn, e.ss, e.cc, e.lc, e.tags, e.eraStart ?? null, e.eraEnd ?? null],
        );
      } else {
        const insRes = await pool.query(
          `INSERT INTO kinfolk_entities
             (canonical_name, entity_type, normalized_name, short_summary,
              country_codes, language_codes, cultural_context_tags,
              era_start, era_end, resolution_status, source_status, last_verified_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active','active',now())
           RETURNING id`,
          [e.cn, e.etype, e.nn, e.ss, e.cc, e.lc, e.tags, e.eraStart ?? null, e.eraEnd ?? null],
        );
        if (insRes.rows.length === 0) continue;
        entityId = insRes.rows[0].id;
        entitiesInserted++;
      }

      // Insert aliases
      for (const a of e.aliases) {
        const normAlias = a.alias.toLowerCase().replace(/[''`]/g, "'").replace(/[^a-z0-9\s'.-]/g, "").trim();
        const res = await pool.query(
          `INSERT INTO kinfolk_entity_aliases
             (entity_id, alias, alias_type, confidence, normalized_alias, locale)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [entityId, a.alias, a.aliasType, a.confidence, normAlias, a.locale ?? null],
        );
        if (res.rows.length > 0) aliasesInserted++;
      }

      // Link sources
      for (const url of e.sourceUrls) {
        const srcRes = await pool.query(
          `SELECT id FROM kinfolk_source_records WHERE canonical_url=$1 LIMIT 1`,
          [url],
        );
        if (srcRes.rows.length === 0) continue;
        const srcId = srcRes.rows[0].id;
        const linkRes = await pool.query(
          `INSERT INTO kinfolk_entity_source_links (entity_id, source_id)
           VALUES ($1,$2)
           ON CONFLICT (entity_id, source_id) DO NOTHING
           RETURNING id`,
          [entityId, srcId],
        );
        if (linkRes.rows.length > 0) linksInserted++;
      }
    }

    log(`ensureKinfolkCulturalContextV1: ${entitiesInserted} entities, ${aliasesInserted} aliases, ${linksInserted} source links seeded`);
  } catch (err: unknown) {
    warn(`ensureKinfolkCulturalContextV1 failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function ensureKinfolkEntityRegistry(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kinfolk_entities (
        id                   text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        canonical_name       text        NOT NULL,
        entity_type          text        NOT NULL,
        summary              text,
        era_start            integer,
        era_end              integer,
        cultural_context_tags text[],
        source_status        text        NOT NULL DEFAULT 'active',
        last_verified_at     timestamptz DEFAULT now(),
        created_at           timestamptz NOT NULL DEFAULT now(),
        updated_at           timestamptz NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kinfolk_entity_aliases (
        id          text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        entity_id   text        NOT NULL REFERENCES kinfolk_entities(id) ON DELETE CASCADE,
        alias       text        NOT NULL,
        alias_type  text        NOT NULL,
        confidence  numeric(3,2) NOT NULL DEFAULT 0.90,
        created_at  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ke_aliases_entity ON kinfolk_entity_aliases(entity_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ke_aliases_alias  ON kinfolk_entity_aliases(lower(alias))`);
    log("ensureKinfolkEntityRegistry: kinfolk_entities + kinfolk_entity_aliases ready");
  } catch (err: unknown) {
    warn(`ensureKinfolkEntityRegistry failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Education institutions + HBCU seed data ───────────────────────────────────
// Creates education_institutions table and seeds Philadelphia-area schools + PA HBCUs
// + top national HBCUs. All INSERT ON CONFLICT DO NOTHING — safe to re-run every boot.
// HBCU source: White House Initiative on HBCUs (sites.ed.gov/whhbcu/...)
// ── Allied partner applications — 5-stage partner journey table ──────────────
async function ensureAlliedPartnerApplications(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // No FK constraints — same pattern as other tables in this codebase
    // (Railway Postgres rejects FK constraints in some configurations)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS allied_partner_applications (
        id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id               UUID NOT NULL,
        submitted_by_user_id      UUID,
        stage                     VARCHAR(30) NOT NULL DEFAULT 'applied'
                                    CHECK (stage IN ('applied','under_review','agreement_pending','active_partner','rejected','withdrawn')),
        contact_name              TEXT NOT NULL,
        contact_email             TEXT NOT NULL,
        contact_phone             TEXT,
        partnership_goal          TEXT NOT NULL,
        audience_description      TEXT,
        additional_info           TEXT,
        community_score_at_apply  INTEGER NOT NULL DEFAULT 0,
        admin_notes               TEXT,
        reviewed_by_admin_id      UUID,
        stage_advanced_at         TIMESTAMPTZ,
        rejected_at               TIMESTAMPTZ,
        rejection_reason          TEXT,
        partner_confirmed_at      TIMESTAMPTZ,
        created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // One open application per business (prevents spam reapply)
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS allied_partner_one_open_per_biz
        ON allied_partner_applications (business_id)
        WHERE stage NOT IN ('rejected','withdrawn')
    `);

    // allied_partner flag on businesses (best-effort — column may already exist)
    await pool.query(`
      ALTER TABLE businesses
        ADD COLUMN IF NOT EXISTS allied_partner       BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS allied_partner_since TIMESTAMPTZ
    `).catch(() => {/* ignore */});

    log("Allied partner applications v1: table + index ready");
  } catch (err: unknown) {
    warn(`ensureAlliedPartnerApplications failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── City-centroid coordinate fallback for recurring events with no address ────
// Events added via the community-events-expansion-seed have descriptive
// city/state but no precise address. This migration assigns the city center
// coordinate so they appear on the discoverability map.
// Coordinates are intentionally approximate — the event card shows the city name.
const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "washington|dc":        { lat: 38.9072,  lng: -77.0369  },
  "washington|md":        { lat: 38.9072,  lng: -77.0369  },
  "atlanta|ga":           { lat: 33.7490,  lng: -84.3880  },
  "houston|tx":           { lat: 29.7604,  lng: -95.3698  },
  "chicago|il":           { lat: 41.8781,  lng: -87.6298  },
  "los angeles|ca":       { lat: 34.0522,  lng: -118.2437 },
  "compton|ca":           { lat: 33.8958,  lng: -118.2201 },
  "inglewood|ca":         { lat: 33.9617,  lng: -118.3531 },
  "new york|ny":          { lat: 40.7128,  lng: -74.0060  },
  "brooklyn|ny":          { lat: 40.6782,  lng: -73.9442  },
  "bronx|ny":             { lat: 40.8448,  lng: -73.8648  },
  "miami|fl":             { lat: 25.7617,  lng: -80.1918  },
  "detroit|mi":           { lat: 42.3314,  lng: -83.0458  },
  "charlotte|nc":         { lat: 35.2271,  lng: -80.8431  },
  "new orleans|la":       { lat: 29.9511,  lng: -90.0715  },
  "baltimore|md":         { lat: 39.2904,  lng: -76.6122  },
  "richmond|va":          { lat: 37.5407,  lng: -77.4360  },
  "nashville|tn":         { lat: 36.1627,  lng: -86.7816  },
  "memphis|tn":           { lat: 35.1495,  lng: -90.0490  },
  "dallas|tx":            { lat: 32.7767,  lng: -96.7970  },
  "fort worth|tx":        { lat: 32.7555,  lng: -97.3308  },
  "columbia|sc":          { lat: 34.0007,  lng: -81.0348  },
  "national harbor|md":   { lat: 38.7873,  lng: -77.0120  },
  "largo|md":             { lat: 38.8929,  lng: -76.8274  },
  "raleigh|nc":           { lat: 35.7796,  lng: -78.6382  },
  "durham|nc":            { lat: 35.9940,  lng: -78.8986  },
  "greensboro|nc":        { lat: 36.0726,  lng: -79.7920  },
  "jacksonville|fl":      { lat: 30.3322,  lng: -81.6557  },
  "las vegas|nv":         { lat: 36.1699,  lng: -115.1398 },
  "birmingham|al":        { lat: 33.5186,  lng: -86.8104  },
  "jackson|ms":           { lat: 32.2988,  lng: -90.1848  },
  "tallahassee|fl":       { lat: 30.4518,  lng: -84.2807  },
  "hampton|va":           { lat: 37.0299,  lng: -76.3452  },
  "tuskegee|al":          { lat: 32.4301,  lng: -85.7042  },
  "prairie view|tx":      { lat: 30.0919,  lng: -95.9827  },
  "grambling|la":         { lat: 32.5268,  lng: -92.7162  },
  "daytona beach|fl":     { lat: 29.2108,  lng: -81.0228  },
  "philadelphia|pa":      { lat: 39.9526,  lng: -75.1652  },
  "baton rouge|la":       { lat: 30.4515,  lng: -91.1871  },
};

async function ensureRecurringEventsCityCoords(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // Find events that still have no coordinates
    const { rows } = await pool.query<{ id: string; city: string; state: string }>(
      `SELECT id, city, state FROM recurring_events
       WHERE (latitude IS NULL OR longitude IS NULL OR (latitude = 0 AND longitude = 0))
         AND is_active = true`
    );
    if (rows.length === 0) { log("City-centroid coords: all events already have coordinates"); return; }

    let updated = 0; let skipped = 0;
    for (const evt of rows) {
      const key = `${evt.city.toLowerCase()}|${evt.state.toLowerCase()}`;
      const centroid = CITY_CENTROIDS[key];
      if (!centroid) { skipped++; continue; }
      // Jitter slightly so events in the same city don't stack on the exact same pixel
      const jitterLat = centroid.lat + (Math.random() - 0.5) * 0.015;
      const jitterLng = centroid.lng + (Math.random() - 0.5) * 0.015;
      await pool.query(
        `UPDATE recurring_events SET latitude = $1, longitude = $2, updated_at = NOW() WHERE id = $3`,
        [jitterLat, jitterLng, evt.id]
      );
      updated++;
    }
    log(`City-centroid coords: ${updated} recurring events updated, ${skipped} cities not in map`);
  } catch (err: unknown) {
    warn(`ensureRecurringEventsCityCoords failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function ensureEducationInstitutions(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS education_institutions (
        id                          text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name                        text        NOT NULL,
        institution_type            text        NOT NULL,
        official_url                text,
        city                        text        NOT NULL,
        state                       text        NOT NULL,
        country                     text        NOT NULL DEFAULT 'USA',
        latitude                    numeric(9,6),
        longitude                   numeric(9,6),
        hbcu_status                 boolean     NOT NULL DEFAULT false,
        minority_serving_designations text[],
        program_tags                text,
        accreditation_source_url    text,
        source_status               text        NOT NULL DEFAULT 'active',
        last_verified_at            timestamptz DEFAULT now(),
        is_active                   boolean     NOT NULL DEFAULT true,
        created_at                  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_edu_city  ON education_institutions(lower(city))`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_edu_state ON education_institutions(lower(state))`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_edu_hbcu  ON education_institutions(hbcu_status) WHERE hbcu_status = true`);

    type SeedRow = { name: string; type: string; url: string; city: string; state: string; lat: number; lng: number; hbcu: boolean; tags: string };
    const seeds: SeedRow[] = [
      // Philadelphia area
      { name: "Temple University",                    type: "university",            url: "https://www.temple.edu",        city: "Philadelphia",   state: "PA", lat: 39.9811, lng: -75.1543, hbcu: false, tags: "business, law, medicine, education, engineering, communications" },
      { name: "University of Pennsylvania",           type: "university",            url: "https://www.upenn.edu",         city: "Philadelphia",   state: "PA", lat: 39.9522, lng: -75.1932, hbcu: false, tags: "medicine, law, business (Wharton), nursing, engineering" },
      { name: "Drexel University",                    type: "university",            url: "https://www.drexel.edu",        city: "Philadelphia",   state: "PA", lat: 39.9566, lng: -75.1875, hbcu: false, tags: "engineering, business, nursing, computer science" },
      { name: "Community College of Philadelphia",    type: "community_college",     url: "https://www.ccp.edu",           city: "Philadelphia",   state: "PA", lat: 39.9583, lng: -75.1613, hbcu: false, tags: "associates degrees, workforce training, transfer pathways" },
      { name: "La Salle University",                  type: "university",            url: "https://www.lasalle.edu",       city: "Philadelphia",   state: "PA", lat: 40.0333, lng: -75.1667, hbcu: false, tags: "business, nursing, education, liberal arts" },
      { name: "Saint Joseph's University",            type: "university",            url: "https://www.sju.edu",           city: "Philadelphia",   state: "PA", lat: 40.0094, lng: -75.2313, hbcu: false, tags: "business, education, health sciences, liberal arts" },
      // PA HBCUs
      { name: "Cheyney University of Pennsylvania",   type: "university",            url: "https://www.cheyney.edu",       city: "Cheyney",        state: "PA", lat: 39.9359, lng: -75.5227, hbcu: true,  tags: "business, education, social work, liberal arts" },
      { name: "Lincoln University",                   type: "university",            url: "https://www.lincoln.edu",       city: "Lincoln University", state: "PA", lat: 39.8070, lng: -75.9278, hbcu: true, tags: "business, education, humanities, sciences, nursing" },
      // National HBCUs
      { name: "Howard University",                    type: "university",            url: "https://home.howard.edu",       city: "Washington",     state: "DC", lat: 38.9218, lng: -77.0200, hbcu: true,  tags: "medicine, law, business, engineering, fine arts, journalism" },
      { name: "Spelman College",                      type: "liberal_arts_college",  url: "https://www.spelman.edu",       city: "Atlanta",        state: "GA", lat: 33.7456, lng: -84.4110, hbcu: true,  tags: "STEM, humanities, social sciences, public health (women's college)" },
      { name: "Morehouse College",                    type: "liberal_arts_college",  url: "https://morehouse.edu",         city: "Atlanta",        state: "GA", lat: 33.7480, lng: -84.4148, hbcu: true,  tags: "business, education, humanities, sciences (men's college)" },
      { name: "Hampton University",                   type: "university",            url: "https://home.hamptonu.edu",     city: "Hampton",        state: "VA", lat: 37.0206, lng: -76.3428, hbcu: true,  tags: "business, engineering, nursing, education, architecture" },
      { name: "Clark Atlanta University",             type: "university",            url: "https://www.cau.edu",           city: "Atlanta",        state: "GA", lat: 33.7522, lng: -84.4144, hbcu: true,  tags: "business, education, social work, arts & sciences" },
      { name: "Florida A&M University",               type: "university",            url: "https://www.famu.edu",          city: "Tallahassee",    state: "FL", lat: 30.4198, lng: -84.2870, hbcu: true,  tags: "pharmacy, engineering, business, law, journalism, agriculture" },
      { name: "North Carolina A&T State University",  type: "university",            url: "https://www.ncat.edu",          city: "Greensboro",     state: "NC", lat: 36.0803, lng: -79.7848, hbcu: true,  tags: "engineering, agriculture, business, education, nursing" },
      { name: "Morgan State University",              type: "university",            url: "https://www.morgan.edu",        city: "Baltimore",      state: "MD", lat: 39.3427, lng: -76.5826, hbcu: true,  tags: "engineering, business, education, social work, public health" },
      { name: "Tuskegee University",                  type: "university",            url: "https://www.tuskegee.edu",      city: "Tuskegee",       state: "AL", lat: 32.4301, lng: -85.7042, hbcu: true,  tags: "engineering, veterinary medicine, nursing, business, agriculture" },
      { name: "Prairie View A&M University",          type: "university",            url: "https://www.pvamu.edu",         city: "Prairie View",   state: "TX", lat: 30.0919, lng: -95.9827, hbcu: true,  tags: "engineering, nursing, business, education, agriculture" },
      { name: "Grambling State University",           type: "university",            url: "https://www.gram.edu",          city: "Grambling",      state: "LA", lat: 32.5268, lng: -92.7162, hbcu: true,  tags: "criminal justice, education, business, nursing, social work" },
      { name: "Bethune-Cookman University",           type: "university",            url: "https://www.cookman.edu",       city: "Daytona Beach",  state: "FL", lat: 29.2111, lng: -81.0203, hbcu: true,  tags: "education, nursing, business, liberal arts" },
      { name: "Xavier University of Louisiana",       type: "university",            url: "https://www.xula.edu",          city: "New Orleans",    state: "LA", lat: 29.9649, lng: -90.1095, hbcu: true,  tags: "pharmacy, pre-med, education, business" },
      { name: "Fisk University",                      type: "liberal_arts_college",  url: "https://www.fisk.edu",          city: "Nashville",      state: "TN", lat: 36.1697, lng: -86.8114, hbcu: true,  tags: "arts & sciences, business, education" },
    ];

    for (const row of seeds) {
      await pool.query(
        `INSERT INTO education_institutions
           (name, institution_type, official_url, city, state,
            latitude, longitude, hbcu_status,
            minority_serving_designations, program_tags, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
         ON CONFLICT DO NOTHING`,
        [row.name, row.type, row.url, row.city, row.state, row.lat, row.lng, row.hbcu,
         row.hbcu ? ["HBCU"] : [], row.tags],
      );
    }

    const hbcuCount = seeds.filter((r) => r.hbcu).length;
    log(`ensureEducationInstitutions: table ready — ${seeds.length} institutions seeded (${seeds.length - hbcuCount} general + ${hbcuCount} HBCUs)`);
  } catch (err: unknown) {
    warn(`ensureEducationInstitutions failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── P1-D: Business contact completeness tracking ─────────────────────────────
// Adds provenance and data-quality columns so the directory can display honest
// "Contact details have not been provided" rather than blank fields, and so
// internal tooling can identify which cities need enrichment attention.
async function ensureBusinessContactCompleteness(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    await pool.query(`
      ALTER TABLE public.businesses
        ADD COLUMN IF NOT EXISTS contact_source_url     text,
        ADD COLUMN IF NOT EXISTS contact_verified_at    timestamptz,
        ADD COLUMN IF NOT EXISTS contact_completeness   varchar(24) NOT NULL DEFAULT 'unknown'
    `);

    await pool.query(`
      UPDATE public.businesses
      SET contact_completeness = CASE
        WHEN coalesce(nullif(trim(phone),   ''), '') <> ''
         AND coalesce(nullif(trim(website), ''), '') <> ''
         AND coalesce(nullif(trim(hours),   ''), '') <> '' THEN 'complete'
        WHEN coalesce(nullif(trim(phone),   ''), '') <> ''
          OR coalesce(nullif(trim(website), ''), '') <> ''
          OR coalesce(nullif(trim(hours),   ''), '') <> '' THEN 'partial'
        ELSE 'unknown'
      END
      WHERE contact_completeness = 'unknown'
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS businesses_contact_completeness_city_idx
        ON public.businesses (city, contact_completeness)
        WHERE status = 'active'
    `);

    log("ensureBusinessContactCompleteness: contact_source_url, contact_verified_at, contact_completeness columns ready");
  } catch (err: unknown) {
    warn(`ensureBusinessContactCompleteness failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Canonical place deduplication — website-aware (v1) ────────────────────────
// Creates a canonical-place identity layer that links business and cultural-site
// source records to one member-facing place. Never deletes source rows.
// Uses official website domain as primary dedup evidence when available;
// falls back to exact name + city + coordinate matching for the Sabor case and
// similar same-city same-place duplicates.
async function ensureCanonicalPlacesV1(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // Extensions
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await pool.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // Text normalizer (name + city matching)
    await pool.query(`
      CREATE OR REPLACE FUNCTION public.mwm_normalize_place_text(value text)
      RETURNS text
      LANGUAGE sql IMMUTABLE PARALLEL SAFE
      AS $$
        SELECT trim(regexp_replace(
          regexp_replace(lower(unaccent(coalesce(value, ''))), '[^a-z0-9]+', ' ', 'g'),
          '\\s+', ' ', 'g'
        ));
      $$
    `);

    // Official website domain normalizer — strips protocol/www/path/query/fragment,
    // rejects social, directory, delivery, reservation, and link-aggregator hosts.
    await pool.query(`
      CREATE OR REPLACE FUNCTION public.mwm_normalize_website_domain(value text)
      RETURNS text
      LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE
      AS $$
      DECLARE host text;
      BEGIN
        IF value IS NULL OR btrim(value) = '' THEN RETURN NULL; END IF;
        host := lower(btrim(value));
        host := regexp_replace(host, '^https?://', '');
        host := regexp_replace(host, '^www\\.', '');
        host := split_part(host, '/', 1);
        host := split_part(host, '?', 1);
        host := split_part(host, '#', 1);
        host := split_part(host, ':', 1);
        IF host = ''
          OR host !~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
          OR host ~ '(^|\\.)(facebook\\.com|instagram\\.com|tiktok\\.com|yelp\\.com|google\\.com|maps\\.google\\.com|tripadvisor\\.com|doordash\\.com|ubereats\\.com|grubhub\\.com|opentable\\.com|resy\\.com|linktr\\.ee)$'
        THEN RETURN NULL; END IF;
        RETURN host;
      END;
      $$
    `);

    // Canonical place tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.canonical_places (
        id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        canonical_name             text NOT NULL,
        normalized_name            text NOT NULL,
        city                       text,
        normalized_city            text,
        state                      text,
        country                    text,
        latitude                   numeric(10,7),
        longitude                  numeric(10,7),
        official_domain            text,
        official_domain_verified_at timestamptz,
        primary_source_type        varchar(40) NOT NULL,
        primary_source_id          text NOT NULL,
        match_status               varchar(24) NOT NULL DEFAULT 'confirmed'
          CHECK (match_status IN ('confirmed', 'needs_review', 'rejected')),
        created_at                 timestamptz NOT NULL DEFAULT now(),
        updated_at                 timestamptz NOT NULL DEFAULT now(),
        UNIQUE (primary_source_type, primary_source_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.canonical_place_sources (
        canonical_place_id uuid NOT NULL REFERENCES public.canonical_places(id) ON DELETE CASCADE,
        source_type        varchar(40) NOT NULL
          CHECK (source_type IN ('business', 'cultural_site', 'tour_cultural_site', 'community_org', 'event')),
        source_id          text NOT NULL,
        source_url         text,
        normalized_domain  text,
        domain_verified_at timestamptz,
        match_confidence   numeric(5,4) NOT NULL DEFAULT 1.0000,
        match_method       varchar(48) NOT NULL
          CHECK (match_method IN (
            'seed_primary', 'exact_name_city', 'exact_name_coordinate',
            'exact_official_domain_location', 'reviewed_merge', 'manual_split'
          )),
        is_primary         boolean NOT NULL DEFAULT false,
        review_note        text,
        created_at         timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (source_type, source_id),
        UNIQUE (canonical_place_id, source_type, source_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.canonical_place_merge_candidates (
        id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        left_source_type           varchar(40) NOT NULL,
        left_source_id             text NOT NULL,
        right_source_type          varchar(40) NOT NULL,
        right_source_id            text NOT NULL,
        normalized_name_similarity numeric(5,4) NOT NULL,
        coordinate_distance_miles  numeric(8,3),
        city_match                 boolean NOT NULL,
        left_official_domain       text,
        right_official_domain      text,
        official_domain_match      boolean NOT NULL DEFAULT false,
        proposed_confidence        numeric(5,4) NOT NULL,
        status                     varchar(24) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'auto_linked', 'approved', 'rejected', 'split')),
        reviewed_by_id             text,
        reviewed_at                timestamptz,
        review_note                text,
        created_at                 timestamptz NOT NULL DEFAULT now(),
        UNIQUE (left_source_type, left_source_id, right_source_type, right_source_id)
      )
    `);

    // Indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS canonical_places_name_trgm_idx ON public.canonical_places USING gin (normalized_name gin_trgm_ops)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS canonical_places_city_idx ON public.canonical_places (normalized_city, state) WHERE match_status = 'confirmed'`);
    await pool.query(`CREATE INDEX IF NOT EXISTS canonical_places_domain_idx ON public.canonical_places (official_domain) WHERE official_domain IS NOT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS canonical_place_sources_canonical_idx ON public.canonical_place_sources (canonical_place_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS canonical_place_candidates_status_idx ON public.canonical_place_merge_candidates (status, proposed_confidence DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS canonical_place_candidates_domain_idx ON public.canonical_place_merge_candidates (official_domain_match, status) WHERE official_domain_match = true`);

    // Seed active businesses as primary canonical places (idempotent upsert)
    const { rowCount: cpRows } = await pool.query(`
      INSERT INTO public.canonical_places (
        canonical_name, normalized_name, city, normalized_city, state, country,
        latitude, longitude, official_domain, official_domain_verified_at,
        primary_source_type, primary_source_id, match_status
      )
      SELECT
        b.name,
        public.mwm_normalize_place_text(b.name),
        b.city,
        public.mwm_normalize_place_text(b.city),
        b.state,
        b.country,
        b.latitude,
        b.longitude,
        public.mwm_normalize_website_domain(b.website),
        NULL,
        'business',
        b.id::text,
        'confirmed'
      FROM public.businesses b
      WHERE b.status = 'active'
        AND coalesce(b.listing_status, 'live_unclaimed') IN ('live_unclaimed', 'live_claimed')
      ON CONFLICT (primary_source_type, primary_source_id) DO UPDATE
      SET
        canonical_name = EXCLUDED.canonical_name,
        normalized_name = EXCLUDED.normalized_name,
        city = EXCLUDED.city,
        normalized_city = EXCLUDED.normalized_city,
        state = EXCLUDED.state,
        country = EXCLUDED.country,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        official_domain = EXCLUDED.official_domain,
        updated_at = now()
    `);

    // Seed business sources (idempotent)
    await pool.query(`
      INSERT INTO public.canonical_place_sources (
        canonical_place_id, source_type, source_id, source_url, normalized_domain,
        domain_verified_at, match_confidence, match_method, is_primary
      )
      SELECT
        cp.id, 'business', b.id::text, b.website,
        public.mwm_normalize_website_domain(b.website),
        NULL, 1.0000, 'seed_primary', true
      FROM public.businesses b
      JOIN public.canonical_places cp
        ON cp.primary_source_type = 'business'
       AND cp.primary_source_id = b.id::text
      WHERE b.status = 'active'
      ON CONFLICT (source_type, source_id) DO UPDATE
      SET
        source_url = EXCLUDED.source_url,
        normalized_domain = EXCLUDED.normalized_domain
    `);

    // Build business ↔ cultural_site merge candidates (idempotent)
    // Joins on: (1) same city OR same official domain, (2) name similarity >= 0.90
    // or same official domain. Conservative threshold avoids merging different branches.
    const { rowCount: candRows } = await pool.query(`
      INSERT INTO public.canonical_place_merge_candidates (
        left_source_type, left_source_id, right_source_type, right_source_id,
        normalized_name_similarity, coordinate_distance_miles, city_match,
        left_official_domain, right_official_domain, official_domain_match,
        proposed_confidence, status
      )
      WITH pairs AS (
        SELECT
          b.id::text AS business_id,
          cs.id::text AS cultural_site_id,
          public.mwm_normalize_website_domain(b.website) AS business_domain,
          public.mwm_normalize_website_domain(cs.verified_source) AS cultural_domain,
          similarity(
            public.mwm_normalize_place_text(b.name),
            public.mwm_normalize_place_text(
              regexp_replace(
                cs.name,
                '\\m' || regexp_replace(cs.city, '([.^$|()[\\]{}*+?\\\\])', '\\\\1', 'g') || '\\M',
                '', 'gi'
              )
            )
          ) AS name_similarity,
          (b.city IS NOT NULL AND cs.city IS NOT NULL
           AND public.mwm_normalize_place_text(b.city)
               = public.mwm_normalize_place_text(cs.city)) AS same_city,
          CASE
            WHEN b.latitude IS NOT NULL AND b.longitude IS NOT NULL
             AND cs.latitude IS NOT NULL AND cs.longitude IS NOT NULL
            THEN 3959 * acos(LEAST(1.0, GREATEST(-1.0,
              cos(radians(b.latitude::double precision))
              * cos(radians(cs.latitude::double precision))
              * cos(radians(cs.longitude::double precision) - radians(b.longitude::double precision))
              + sin(radians(b.latitude::double precision))
              * sin(radians(cs.latitude::double precision))
            )))
            ELSE NULL
          END AS distance_miles
        FROM public.businesses b
        JOIN public.cultural_sites cs
          ON public.mwm_normalize_place_text(b.city) = public.mwm_normalize_place_text(cs.city)
          OR (
            public.mwm_normalize_website_domain(b.website) IS NOT NULL
            AND public.mwm_normalize_website_domain(b.website)
                = public.mwm_normalize_website_domain(cs.verified_source)
          )
        WHERE b.status = 'active'
          AND (
            similarity(public.mwm_normalize_place_text(b.name), public.mwm_normalize_place_text(cs.name)) >= 0.90
            OR (
              public.mwm_normalize_website_domain(b.website) IS NOT NULL
              AND public.mwm_normalize_website_domain(b.website)
                  = public.mwm_normalize_website_domain(cs.verified_source)
            )
          )
      )
      SELECT
        'business', business_id, 'cultural_site', cultural_site_id,
        name_similarity, distance_miles, same_city,
        business_domain, cultural_domain,
        (business_domain IS NOT NULL AND cultural_domain IS NOT NULL AND business_domain = cultural_domain),
        CASE
          WHEN business_domain IS NOT NULL AND cultural_domain IS NOT NULL AND business_domain = cultural_domain
           AND (same_city = true OR distance_miles <= 0.25) THEN 0.9990
          WHEN same_city = true AND name_similarity >= 0.98 AND distance_miles <= 0.25 THEN 0.9950
          WHEN business_domain IS NOT NULL AND cultural_domain IS NOT NULL AND business_domain = cultural_domain THEN 0.8500
          WHEN same_city = true AND name_similarity >= 0.98 THEN 0.9000
          ELSE 0.0000
        END,
        'pending'
      FROM pairs
      WHERE name_similarity >= 0.90
         OR (business_domain IS NOT NULL AND cultural_domain IS NOT NULL AND business_domain = cultural_domain)
      ON CONFLICT (left_source_type, left_source_id, right_source_type, right_source_id) DO UPDATE
      SET
        normalized_name_similarity = EXCLUDED.normalized_name_similarity,
        coordinate_distance_miles  = EXCLUDED.coordinate_distance_miles,
        city_match                 = EXCLUDED.city_match,
        left_official_domain       = EXCLUDED.left_official_domain,
        right_official_domain      = EXCLUDED.right_official_domain,
        official_domain_match      = EXCLUDED.official_domain_match,
        proposed_confidence        = EXCLUDED.proposed_confidence
    `);

    // Auto-link high-confidence candidates (same official domain + location, or
    // exact name + same city + coordinate distance ≤ 0.25 mi).
    await pool.query(`
      WITH auto_approved AS (
        UPDATE public.canonical_place_merge_candidates c
        SET
          status = 'auto_linked',
          reviewed_at = now(),
          review_note = CASE
            WHEN c.official_domain_match
            THEN 'Auto-linked: same official domain and same city/coordinate area'
            ELSE 'Auto-linked: exact normalized name, same city, coordinate distance <= 0.25 mi'
          END
        WHERE c.status = 'pending'
          AND (
            (c.official_domain_match = true AND (c.city_match = true OR c.coordinate_distance_miles <= 0.25))
            OR (c.official_domain_match = false AND c.city_match = true
                AND c.normalized_name_similarity >= 0.9800
                AND c.coordinate_distance_miles <= 0.25)
          )
        RETURNING *
      )
      INSERT INTO public.canonical_place_sources (
        canonical_place_id, source_type, source_id, source_url, normalized_domain,
        domain_verified_at, match_confidence, match_method, is_primary, review_note
      )
      SELECT
        cp.id,
        'cultural_site',
        a.right_source_id,
        cs.verified_source,
        public.mwm_normalize_website_domain(cs.verified_source),
        NULL,
        a.proposed_confidence,
        CASE WHEN a.official_domain_match THEN 'exact_official_domain_location' ELSE 'exact_name_coordinate' END,
        false,
        a.review_note
      FROM auto_approved a
      JOIN public.canonical_places cp
        ON cp.primary_source_type = 'business'
       AND cp.primary_source_id = a.left_source_id
      JOIN public.cultural_sites cs ON cs.id::text = a.right_source_id
      ON CONFLICT (source_type, source_id) DO NOTHING
    `);

    log(`ensureCanonicalPlacesV1: canonical_places ready (${cpRows ?? 0} businesses seeded), ${candRows ?? 0} merge candidates evaluated`);
  } catch (err: unknown) {
    warn(`ensureCanonicalPlacesV1 failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Business dedup schema ─────────────────────────────────────────────────────
// Adds dedupe_key, normalized_name, is_duplicate, duplicate_of_id, and source
// tracking columns. Creates business_review_items table. Idempotent (IF NOT EXISTS).
async function ensureBusinessDedupSchema(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // Schema columns for businesses table
    await pool.query(`
      ALTER TABLE businesses
        ADD COLUMN IF NOT EXISTS normalized_name    text,
        ADD COLUMN IF NOT EXISTS dedupe_key         text,
        ADD COLUMN IF NOT EXISTS duplicate_of_id    uuid,
        ADD COLUMN IF NOT EXISTS is_duplicate       boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS duplicate_reason   text,
        ADD COLUMN IF NOT EXISTS duplicate_marked_at timestamptz,
        ADD COLUMN IF NOT EXISTS source_provider    text,
        ADD COLUMN IF NOT EXISTS source_record_id   text,
        ADD COLUMN IF NOT EXISTS source_url         text,
        ADD COLUMN IF NOT EXISTS retrieved_at       timestamptz,
        ADD COLUMN IF NOT EXISTS evidence           jsonb
    `);

    // Partial unique index: one active canonical row per dedupe_key.
    // ON CONFLICT suppressed — index may already exist.
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS businesses_active_dedupe_key_unique
      ON businesses (dedupe_key)
      WHERE coalesce(is_duplicate, false) = false
        AND coalesce(status, 'active') NOT IN ('duplicate','permanently_hidden')
        AND dedupe_key IS NOT NULL
    `);

    // business_review_items table — holds candidates that need human review
    // before publication. Includes possible duplicates, ownership-unverified
    // candidates, and low-evidence candidates.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_review_items (
        id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        review_type             text NOT NULL DEFAULT 'insufficient_evidence',
        status                  text NOT NULL DEFAULT 'pending',
        candidate_name          text NOT NULL,
        candidate_address       text NOT NULL DEFAULT '',
        candidate_city          text NOT NULL DEFAULT '',
        candidate_state         text NOT NULL DEFAULT '',
        candidate_website       text,
        candidate_phone         text,
        candidate_latitude      double precision,
        candidate_longitude     double precision,
        candidate_category      text,
        candidate_source_provider text,
        candidate_source_url    text,
        evidence                jsonb,
        score                   integer,
        reason                  text,
        requested_attribute     text,
        matched_business_id     text,
        resolved_by             text,
        resolved_at             timestamptz,
        created_at              timestamptz NOT NULL DEFAULT now(),
        updated_at              timestamptz NOT NULL DEFAULT now()
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS bri_status_idx ON business_review_items(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS bri_review_type_idx ON business_review_items(review_type)`);

    log("ensureBusinessDedupSchema: schema ready");
  } catch (err: unknown) {
    warn(`ensureBusinessDedupSchema failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── User handles — short @mention identifier ──────────────────────────────────
// Adds a `handle` column to users, auto-populated from the email prefix so
// existing users immediately have an @mentionable identity without any action.
async function ensureUserHandles(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS handle text`);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_handle_unique ON users(handle)
      WHERE handle IS NOT NULL
    `);
    // Back-fill handles for existing users: email prefix, lower-cased,
    // non-alphanumeric characters replaced with underscores, max 26 chars.
    // ROW_NUMBER() partitioned by base handle guarantees uniqueness when
    // multiple users share the same email-prefix (e.g. two "info@…" accounts).
    // The first user keeps the plain handle; duplicates get _2, _3, etc.
    const { rowCount } = await pool.query(`
      UPDATE users
      SET handle = sub.final_handle
      FROM (
        SELECT
          id,
          base_handle || CASE WHEN rn > 1 THEN '_' || rn::text ELSE '' END AS final_handle
        FROM (
          SELECT
            id,
            LEFT(LOWER(REGEXP_REPLACE(SPLIT_PART(COALESCE(email,''), '@', 1), '[^a-zA-Z0-9]', '_', 'g')), 26) AS base_handle,
            ROW_NUMBER() OVER (
              PARTITION BY LEFT(LOWER(REGEXP_REPLACE(SPLIT_PART(COALESCE(email,''), '@', 1), '[^a-zA-Z0-9]', '_', 'g')), 26)
              ORDER BY created_at ASC NULLS LAST, id
            ) AS rn
          FROM users
          WHERE handle IS NULL AND email IS NOT NULL
        ) ranked
      ) sub
      WHERE users.id = sub.id
    `);
    log(`ensureUserHandles: handle column ready, ${rowCount ?? 0} users back-filled`);
  } catch (err: unknown) {
    warn(`ensureUserHandles failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Visibility hardening — public view + canonical dedupe index ───────────────
// Creates the canonical visibility rule as a PG function, a public_businesses
// view, a filtered index for fast map/list queries, and a unique partial index
// that prevents two non-duplicate rows from sharing the same dedupe_key.
// All statements are idempotent (CREATE OR REPLACE / IF NOT EXISTS).
async function ensureVisibilityAndDedupeHardening(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    await pool.query(`
      CREATE OR REPLACE FUNCTION public.business_is_public(
        p_status text,
        p_listing_status text,
        p_is_duplicate boolean
      ) RETURNS boolean
      LANGUAGE sql
      IMMUTABLE
      AS $$
        SELECT COALESCE(p_is_duplicate, false) = false
           AND COALESCE(p_status, '') NOT IN ('duplicate', 'permanently_hidden', 'removed', 'deleted')
           AND COALESCE(p_listing_status, '') IN ('live_unclaimed', 'live_claimed');
      $$
    `);

    await pool.query(`
      CREATE OR REPLACE VIEW public.public_businesses AS
      SELECT b.*
      FROM public.businesses b
      WHERE public.business_is_public(b.status, b.listing_status, b.is_duplicate)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS businesses_public_visibility_idx
        ON public.businesses (listing_status, status, is_duplicate, created_at DESC)
        WHERE COALESCE(is_duplicate, false) = false
          AND listing_status IN ('live_unclaimed', 'live_claimed')
          AND COALESCE(status, '') NOT IN ('duplicate', 'permanently_hidden', 'removed', 'deleted')
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS businesses_canonical_dedupe_key_unique
        ON public.businesses (dedupe_key)
        WHERE dedupe_key IS NOT NULL
          AND btrim(dedupe_key) <> ''
          AND COALESCE(is_duplicate, false) = false
          AND COALESCE(status, '') NOT IN ('duplicate', 'permanently_hidden', 'removed', 'deleted')
    `);

    log("ensureVisibilityAndDedupeHardening: public_businesses view + indexes ready");
  } catch (err: unknown) {
    warn(`ensureVisibilityAndDedupeHardening failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Business deduplication marking ───────────────────────────────────────────
// Soft-marks the 17 confirmed duplicate groups identified by the Manus full-DB
// audit (2,736 rows). Also backfills is_duplicate=true on Duke's Cafe duplicates
// that were previously marked permanently_hidden. All IDs are from the audit CSV.
async function ensureBusinessDeduplication(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    // 17 confirmed duplicate pairs: { id: duplicate, canonicalId: keep }
    const CONFIRMED_DUPLICATES: Array<{ id: string; canonicalId: string; name: string }> = [
      // Shiloh Baptist Church DC — 2 duplicates
      { id: "b64ebade-3908-48f4-b64f-c997f95b2e8d", canonicalId: "531bc3a2-b142-4b25-8a58-95ccd5f76333", name: "Shiloh Baptist Church DC (variant)" },
      { id: "0c049dbe-65cc-4005-ae1d-f2bce2ec793e", canonicalId: "531bc3a2-b142-4b25-8a58-95ccd5f76333", name: "Shiloh Baptist Church" },
      // Greater Allen A.M.E. Cathedral
      { id: "bd6991b8-50ad-41b5-b84d-02aa8b2ed474", canonicalId: "16f4ea6a-8398-4c7d-b064-ce013e8e8588", name: "Greater Allen AME Cathedral (variant)" },
      // CARECEN DC
      { id: "52ae0d76-dfac-4510-8dbb-bb5c983d9417", canonicalId: "2741dbd9-dacc-4495-8290-e0cf69a8151d", name: "CARECEN DC (variant)" },
      // National Center for Civil and Human Rights
      { id: "ea9e99a7-fe1d-4b39-9e2e-6c839dd433ce", canonicalId: "34de569d-c58b-42fe-95ce-bb103bd157e4", name: "National Center Civil Rights Atlanta (variant)" },
      // Ethiopian Orthodox Tewahedo Church
      { id: "3bc5cd51-fc8d-411b-bd2f-1f4550869f5b", canonicalId: "3ab5ae6d-3c62-4482-b303-f040eb63a7b4", name: "Ethiopian Orthodox Tewahedo Church Bronx (variant)" },
      // People's Community Clinic Austin
      { id: "a0d1a36d-1b8b-4899-808a-90b3e43f92c1", canonicalId: "3f4fb4d6-f316-423c-aa5e-4d6ec0959adb", name: "People's Community Clinic Austin (variant)" },
      // Simply Wholesome
      { id: "5cb738c1-4663-4b0a-a428-0cfaa5b5c093", canonicalId: "39fa282e-d634-415a-a782-313f7475a3b2", name: "Simply Wholesome (variant)" },
      // Masjid Al-Jamia Philadelphia
      { id: "665313ea-4406-433a-a187-ca88a0eceffe", canonicalId: "697dfcaf-daf9-46ed-8d62-647c0c9ccd76", name: "Masjid Al-Jamia Philadelphia (variant)" },
      // DuSable Black History Museum
      { id: "a22cd6c8-c548-4433-8408-527f938ce3fc", canonicalId: "79368b78-162e-4d86-adde-6156f07e42bc", name: "DuSable Museum (variant)" },
      // APEX Museum
      { id: "3b5d5181-5304-4143-bb7a-7a8468a39674", canonicalId: "96a162a9-8a75-46f7-99f7-d0b54bb9d69a", name: "APEX Museum (variant)" },
      // Harold & Belle's Restaurant
      { id: "c19a012f-1718-4612-af3b-261eaa93b6d7", canonicalId: "9e3d9475-8886-4185-b10e-66d8c3c4b90e", name: "Harold & Belle's Restaurant (variant)" },
      // Legacy Museum — Equal Justice Initiative
      { id: "c8e47b91-a13d-42f2-bb03-15b1f2f2c5c0", canonicalId: "9fe78afa-f490-4e46-81b0-15757e882570", name: "Legacy Museum EJI (variant)" },
      // First Baptist Church Montgomery
      { id: "c6191fa7-381a-474d-af0b-66d84fb8c1ec", canonicalId: "a14acf1e-9db8-47a9-bace-f71123088dea", name: "First Baptist Church of Montgomery (variant)" },
      // National Civil Rights Museum at the Lorraine Motel
      { id: "d1001e39-7b1f-446d-9007-0260939c0067", canonicalId: "a6e09d44-c4cc-4a55-ac42-0524ad079fea", name: "National Civil Rights Museum Lorraine Motel (variant)" },
      // National Memorial for Peace and Justice — EJI
      { id: "4893139f-511e-4412-af72-77bcf0f159dc", canonicalId: "d20dc8e0-2ac7-42de-a657-1aa0e5576b11", name: "National Memorial for Peace and Justice EJI (variant)" },
      // National Museum of African American History and Culture
      { id: "6713556a-e66c-4c1a-8d15-1a1b1c7d71ea", canonicalId: "d9b40522-5887-4475-b197-d5fc69aaf597", name: "NMAAHC (variant)" },
    ];

    let marked = 0;
    let skipped = 0;
    const reason = "Confirmed duplicate by full-DB audit (Manus, Aug 2026) — same normalized name and identical coordinates or exact address/city/state";

    for (const { id, canonicalId } of CONFIRMED_DUPLICATES) {
      try {
        const { rowCount } = await pool.query(
          `UPDATE businesses
           SET is_duplicate = true,
               duplicate_of_id = $2,
               duplicate_reason = $3,
               duplicate_marked_at = COALESCE(duplicate_marked_at, NOW()),
               status = CASE WHEN status = 'permanently_hidden' THEN 'permanently_hidden' ELSE 'duplicate' END,
               updated_at = NOW()
           WHERE id = $1
             AND (is_duplicate IS NULL OR is_duplicate = false)`,
          [id, canonicalId, reason],
        );
        if ((rowCount ?? 0) > 0) marked++;
        else skipped++;
      } catch (err2: unknown) {
        warn(`ensureBusinessDeduplication: failed to mark ${id}: ${err2 instanceof Error ? err2.message : String(err2)}`);
      }
    }

    // Duke's Cafe: 93 duplicates were already marked permanently_hidden.
    // Backfill is_duplicate=true + duplicate_of_id so they're consistent with the new schema.
    const DUKES_CANONICAL = "056404ec-1890-4bbd-aa1c-3e293c80ad92";
    const { rowCount: dukesCount } = await pool.query(
      `UPDATE businesses
       SET is_duplicate = true,
           duplicate_of_id = $1::uuid,
           duplicate_reason = $2,
           duplicate_marked_at = COALESCE(duplicate_marked_at, NOW()),
           updated_at = NOW()
       WHERE status = 'permanently_hidden'
         AND lower(name) ILIKE '%duke%cafe%'
         AND id::text <> $1
         AND (is_duplicate IS NULL OR is_duplicate = false)`,
      [DUKES_CANONICAL, reason],
    );

    log(`ensureBusinessDeduplication: ${marked} non-Duke's duplicates soft-marked, ${skipped} already done, ${dukesCount ?? 0} Duke's Cafe records backfilled`);
  } catch (err: unknown) {
    warn(`ensureBusinessDeduplication failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Business review items seed ────────────────────────────────────────────────
// Seeds the 8 manual-review records identified by the audit: 4 pairs that share
// a name but have different coordinates or addresses. Kept visible and active;
// placed here so admins can confirm merge/keep-both via the review queue UI.
async function ensureBusinessReviewItems(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  // Verify the business_review_items table exists before seeding
  try {
    const { rows } = await pool.query(
      `SELECT to_regclass('public.business_review_items') AS t`,
    );
    if (!rows[0]?.t) { warn("ensureBusinessReviewItems: table not yet created, skipping"); return; }
  } catch {
    warn("ensureBusinessReviewItems: cannot check table existence, skipping");
    return;
  }

  const MANUAL_REVIEW_PAIRS: Array<{
    nameA: string; idA: string; addressA: string; latA: number; lngA: number;
    nameB: string; idB: string; addressB: string; latB: number; lngB: number;
    city: string; state: string; category: string; reason: string;
  }> = [
    {
      nameA: "Busy Bee Cafe", idA: "d6789c0a-c678-4d86-8014-03c347008f83",
      addressA: "810 Martin Luther King Jr Dr SW, Atlanta, GA 30314", latA: 33.749000, lngA: -84.388000,
      nameB: "Busy Bee Café", idB: "771b7789-00f8-4163-91f7-82d5bb04bb65",
      addressB: "810 Martin Luther King Jr Dr SW", latB: 33.750100, lngB: -84.412900,
      city: "Atlanta", state: "GA", category: "Food",
      reason: "Same Atlanta address text but coordinates differ materially. May be one business or two listings of the same location.",
    },
    {
      nameA: "Mrs. White's Golden Rule Cafe", idA: "0f331f0d-917d-4eb4-be84-c852aa237a65",
      addressA: "Downtown Phoenix", latA: 33.448400, lngA: -112.074000,
      nameB: "Mrs. White's Golden Rule Café", idB: "7d447753-7eeb-46aa-9b71-dc89aef4f28a",
      addressB: "808 E Jefferson St", latB: 33.443700, lngB: -112.064800,
      city: "Phoenix", state: "AZ", category: "Food",
      reason: "Similar names; one lists 'Downtown Phoenix' as address, the other gives 808 E Jefferson St with different coordinates.",
    },
    {
      nameA: "Roscoe's House of Chicken & Waffles", idA: "9816d35e-06c4-450f-a430-70c96cc2ccd1",
      addressA: "1514 N Gower St", latA: 34.098900, lngA: -118.327100,
      nameB: "Roscoe's House of Chicken & Waffles", idB: "21091f4c-a545-4031-bcf5-88693acce89c",
      addressB: "1518 N Gower St", latB: 34.098500, lngB: -118.326200,
      city: "Los Angeles", state: "CA", category: "Food",
      reason: "1514 vs 1518 N Gower St — may be two separate entrances or a data error. Coordinates are nearly identical.",
    },
    {
      nameA: "Scotchies Jerk Centre — Kingston", idA: "3fccfabe-9685-4728-aa66-959a0db297cd",
      addressA: "Shop 7, Sovereign Centre, Hope Rd", latA: 17.987600, lngA: -76.770700,
      nameB: "Scotchies Jerk Centre Kingston", idB: "c5f3eb48-d233-4b12-9383-e949d94ce02c",
      addressB: "130 E Kings House Rd", latB: 18.005300, lngB: -76.767600,
      city: "Kingston", state: "", category: "Food",
      reason: "Same Kingston name, different addresses and coordinates — may be two real Scotchies locations.",
    },
  ];

  let inserted = 0;
  let skipped = 0;

  for (const pair of MANUAL_REVIEW_PAIRS) {
    // Only insert if neither ID already appears as a matched_business_id or candidate in the queue
    const { rows: existing } = await pool.query(
      `SELECT id FROM business_review_items
       WHERE review_type = 'possible_duplicate'
         AND (matched_business_id = $1 OR matched_business_id = $2
              OR (candidate_name ILIKE $3 AND candidate_city ILIKE $4))
       LIMIT 1`,
      [pair.idA, pair.idB, `%${pair.nameA.split(" ").slice(0, 2).join(" ")}%`, `%${pair.city}%`],
    );
    if (existing.length > 0) { skipped++; continue; }

    try {
      await pool.query(
        `INSERT INTO business_review_items
          (review_type, status, candidate_name, candidate_address, candidate_city,
           candidate_state, candidate_latitude, candidate_longitude, candidate_category,
           candidate_source_provider, reason, matched_business_id, evidence, created_at, updated_at)
         VALUES ('possible_duplicate','pending',$1,$2,$3,$4,$5,$6,$7,'audit',$8,$9,$10::jsonb,NOW(),NOW())`,
        [
          pair.nameA, pair.addressA, pair.city, pair.state,
          pair.latA, pair.lngA, pair.category, pair.reason, pair.idB,
          JSON.stringify([
            { nameA: pair.nameA, idA: pair.idA, addressA: pair.addressA, latA: pair.latA, lngA: pair.lngA },
            { nameB: pair.nameB, idB: pair.idB, addressB: pair.addressB, latB: pair.latB, lngB: pair.lngB },
          ]),
        ],
      );
      inserted++;
    } catch (err2: unknown) {
      warn(`ensureBusinessReviewItems: failed to insert ${pair.nameA}: ${err2 instanceof Error ? err2.message : String(err2)}`);
    }
  }

  log(`ensureBusinessReviewItems: ${inserted} manual-review pairs seeded, ${skipped} already present`);
}

// ── Sabor Latin Street Grill website correction ───────────────────────────────
// Founder-confirmed: https://www.saborlatingrill.com is the official website for
// the Charlotte NC location. Stored here so canonical-place deduplication and
// tester search both surface the correct domain.
async function ensureSaborWebsiteCorrection(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  try {
    const { rowCount } = await pool.query(`
      UPDATE public.businesses
      SET website = 'https://www.saborlatingrill.com',
          updated_at = now()
      WHERE lower(name) ILIKE '%sabor latin street grill%'
        AND lower(city) ILIKE '%charlotte%'
        AND (website IS NULL OR website = '')
    `);
    if ((rowCount ?? 0) > 0) {
      log(`ensureSaborWebsiteCorrection: website set on ${rowCount} Sabor Latin Street Grill Charlotte record(s)`);
    }
  } catch (err: unknown) {
    warn(`ensureSaborWebsiteCorrection failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
