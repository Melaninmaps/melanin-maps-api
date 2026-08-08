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
import { TOUR_BUSINESSES_SEED } from "../data/tour-businesses-seed";

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
    ["tour businesses",   () => ensureTourBusinesses(log, warn)],
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
            b.name, b.category, b.subcategory ?? null,
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
    await pool.query(
      `UPDATE businesses SET listing_status = 'live_unclaimed'
       WHERE listing_status IN ('staged','pending')
         AND id IN (
           SELECT b.id FROM businesses b
           JOIN (SELECT LOWER(name) AS n, LOWER(city) AS c, LOWER(state) AS s FROM (VALUES ${
             TOUR_BUSINESSES_SEED.slice(0,50).map(b => `('${b.name.replace(/'/g,"''")}','${b.city.replace(/'/g,"''")}','${b.state}')`).join(',')
           }) AS t(n,c,s) ON LOWER(b.name)=t.n AND LOWER(b.city)=t.c AND LOWER(b.state)=t.s
         )`
    );

    log(`Tour businesses integrity guard: ${inserted} inserted, ${skipped} already present (seed: ${TOUR_BUSINESSES_SEED.length})`);
  } catch (err: unknown) {
    warn(`Tour businesses integrity guard failed: ${err instanceof Error ? err.message : String(err)}`);
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
