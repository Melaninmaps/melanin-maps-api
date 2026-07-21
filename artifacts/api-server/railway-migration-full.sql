-- =================================================================
-- Mapping With Melanin™ — Railway Production Idempotent Migration
-- Generated: 2026-07-21T14:44:50.028Z
-- Tables:    186 public schema tables
-- Safe:      CREATE IF NOT EXISTS only. No DROP, no ALTER COLUMN,
--            no data changes. Stripe schema excluded (managed separately).
-- Run with:  psql "<RAILWAY_DB_URL>" -f railway-migration-full.sql
-- =================================================================

-- ── SECTION 1: Enum types ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE financial_goal_type AS ENUM (
      'savings',
      'debt_payoff',
      'investment',
      'emergency_fund',
      'business',
      'education',
      'home',
      'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE listing_condition AS ENUM (
      'new',
      'like_new',
      'good',
      'fair',
      'trade_only'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM (
      'active',
      'sold',
      'traded',
      'reserved',
      'removed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM (
      'product',
      'service',
      'skill_trade',
      'digital',
      'free'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE opportunity_source_tier AS ENUM (
      'community_shared',
      'source_confirmed',
      'organization_confirmed',
      'mwm_reviewed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE opportunity_status AS ENUM (
      'active',
      'expired',
      'filled',
      'removed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE opportunity_type AS ENUM (
      'job',
      'housing',
      'scholarship',
      'grant',
      'training',
      'volunteer',
      'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE resource_category AS ENUM (
      'essential_support',
      'education',
      'jobs',
      'business',
      'housing',
      'safety_rights'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE resource_source_tier AS ENUM (
      'official',
      'verified_org',
      'community_confirmed',
      'community_shared'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── SECTION 2: Sequences ───────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.business_ai_plan_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.business_click_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.business_profile_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.business_response_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.business_search_inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.business_skip_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.business_vibe_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.category_waitlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.challenge_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.circle_adventures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.circle_important_dates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.circle_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.circle_nudges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.circle_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.circle_suggestions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.circle_votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.community_list_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.community_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.content_filter_violations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.creator_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.external_click_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.flagged_officers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.group_invites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.group_itineraries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.group_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.group_suggestions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.kinfolk_circles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.kinfolk_search_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.kinfolk_twin_recs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.location_shares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.meetup_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.member_connections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.officer_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.officer_transfers_officer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.pinned_business_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.plate_passes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.profile_recommended_spots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.profile_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.reference_link_clicks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.safety_checkins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.safety_tip_confirmations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.safety_tips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.show_love_nominations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.show_love_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.trip_journals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.trusted_contact_shares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.user_follows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
CREATE SEQUENCE IF NOT EXISTS public.voice_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ── SECTION 3: Tables (CREATE TABLE IF NOT EXISTS) ─────────────────────
CREATE TABLE IF NOT EXISTS public.archive_contributions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    archive_id character varying NOT NULL,
    user_id character varying,
    contributor_name character varying(150),
    type character varying(40) NOT NULL,
    title character varying(255),
    content text NOT NULL,
    media_url text,
    business_id character varying,
    neighborhood character varying(100),
    is_approved boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    upvotes integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.auth_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    event character varying(60) NOT NULL,
    ip_address character varying(100),
    user_agent text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.badge_helpful_votes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    badge_id character varying(100) NOT NULL,
    voter_id character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_ai_plan_cache (
    id integer NOT NULL,
    business_id character varying(255) NOT NULL,
    tier character varying(30) DEFAULT 'navigator'::character varying NOT NULL,
    plan_data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_badges (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying NOT NULL,
    badge_id character varying(50) NOT NULL,
    appreciation_count integer DEFAULT 1 NOT NULL,
    earned_at timestamp with time zone,
    last_updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_broadcasts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying(255) NOT NULL,
    business_name character varying(255) NOT NULL,
    type character varying(20) NOT NULL,
    title character varying(200) NOT NULL,
    body text NOT NULL,
    recipient_count integer DEFAULT 0 NOT NULL,
    delivered_count integer DEFAULT 0 NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    save_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_captions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying(255) NOT NULL,
    user_id character varying(255),
    caption character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_claims (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying(255) NOT NULL,
    business_name character varying(255),
    user_id character varying,
    owner_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(30),
    role character varying(50) DEFAULT 'owner'::character varying,
    website character varying(255),
    instagram_handle character varying(100),
    additional_info text,
    status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_click_events (
    id integer NOT NULL,
    business_id character varying NOT NULL,
    user_id character varying,
    click_type character varying(30) NOT NULL,
    clicked_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_identity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying(255) NOT NULL,
    business_story text,
    mission_statement text,
    why_started text,
    what_customers_should_know text,
    ownership_badges jsonb DEFAULT '[]'::jsonb NOT NULL,
    community_values jsonb DEFAULT '[]'::jsonb NOT NULL,
    audiences_served jsonb DEFAULT '[]'::jsonb NOT NULL,
    accessibility_features jsonb DEFAULT '[]'::jsonb NOT NULL,
    vibes jsonb DEFAULT '[]'::jsonb NOT NULL,
    employee_count integer,
    is_hiring boolean DEFAULT false NOT NULL,
    has_internships boolean DEFAULT false NOT NULL,
    has_volunteer_opportunities boolean DEFAULT false NOT NULL,
    current_highlights jsonb DEFAULT '[]'::jsonb NOT NULL,
    community_initiatives jsonb DEFAULT '[]'::jsonb NOT NULL,
    growth_goals jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    audience_type character varying(30) DEFAULT 'unknown'::character varying NOT NULL,
    age_restriction_reasons jsonb DEFAULT '[]'::jsonb NOT NULL,
    environment_tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    amenity_tags jsonb DEFAULT '[]'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_improvement_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    issue_type character varying(100),
    issue_description text,
    ownership_preferences jsonb DEFAULT '[]'::jsonb NOT NULL,
    service_types jsonb DEFAULT '[]'::jsonb NOT NULL,
    budget character varying(50),
    timeline character varying(50),
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    plan_data jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_insight_surveys (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying,
    business_name character varying(255) NOT NULL,
    business_city character varying(100),
    business_category character varying(100),
    business_address character varying(500),
    is_minority_owned boolean DEFAULT false NOT NULL,
    survey_type character varying(20) NOT NULL,
    submitted_by_user_id character varying,
    responses jsonb NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    moderator_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_invites (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    review_id character varying,
    invited_by_user_id character varying,
    business_id character varying,
    business_name character varying(255),
    social_handle character varying(100) NOT NULL,
    social_platform character varying(30) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    trial_start_date timestamp with time zone DEFAULT now() NOT NULL,
    trial_end_date timestamp with time zone DEFAULT (now() + '60 days'::interval) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_listings (
    id character varying NOT NULL,
    business_id character varying NOT NULL,
    stripe_product_id character varying,
    stripe_price_id character varying,
    name character varying(255) NOT NULL,
    description text,
    price_in_cents integer NOT NULL,
    currency character varying(10) DEFAULT 'usd'::character varying NOT NULL,
    image_url character varying(512),
    category character varying(100),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    listing_type character varying
);

CREATE TABLE IF NOT EXISTS public.business_nominations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    nominated_by_user_id character varying,
    nominator_email character varying(255),
    business_name character varying(255) NOT NULL,
    category character varying(100),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    phone character varying(30),
    website character varying(255),
    owner_name character varying(255),
    owner_contact character varying(255),
    notes text,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    matched_business_id character varying,
    referral_credited boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    black_owned boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_notification_prefs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    business_id character varying(255) NOT NULL,
    enabled_types jsonb DEFAULT '["event", "offer", "community", "emergency"]'::jsonb NOT NULL,
    frequency character varying(20) DEFAULT 'immediate'::character varying NOT NULL,
    paused_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_owner_links (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    business_id character varying NOT NULL,
    role character varying(20) DEFAULT 'owner'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    verified_at timestamp with time zone,
    verified_by character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_profile_views (
    id integer NOT NULL,
    business_id character varying NOT NULL,
    user_id character varying,
    viewed_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_promotions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying NOT NULL,
    type character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    target_category character varying,
    target_city character varying,
    target_neighborhood character varying,
    target_event character varying,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    stripe_session_id character varying,
    price_usd_cents integer,
    duration_days integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    campaign_label character varying,
    campaign_note character varying(500)
);

CREATE TABLE IF NOT EXISTS public.business_recommendations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    recommender_user_id character varying,
    recommender_email character varying(255),
    business_name character varying(255) NOT NULL,
    website character varying(500),
    city character varying(100),
    state character varying(50),
    category character varying(100),
    note text,
    business_email character varying(255),
    email_sent_at timestamp without time zone,
    points_awarded boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_response_links (
    id integer NOT NULL,
    token character varying(64) NOT NULL,
    report_id character varying NOT NULL,
    report_category character varying(64),
    business_name character varying(255) NOT NULL,
    business_email character varying(255) NOT NULL,
    status character varying(32) DEFAULT 'pending'::character varying NOT NULL,
    response_statement text,
    corrective_actions text,
    trust_plan text,
    disputes_facts boolean DEFAULT false,
    dispute_details text,
    expires_at timestamp with time zone NOT NULL,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_search_inquiries (
    id integer NOT NULL,
    business_name character varying(255) NOT NULL,
    city character varying(100),
    state character varying(50),
    handle character varying(255),
    category character varying(100),
    contact_email character varying(255),
    contact_handle character varying(255),
    searcher_user_id character varying(255),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_skip_feedback (
    id integer NOT NULL,
    business_id character varying NOT NULL,
    submitted_by_id character varying,
    message text NOT NULL,
    was_filtered boolean DEFAULT false NOT NULL,
    filtered_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_stories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying NOT NULL,
    author_id character varying NOT NULL,
    author_name character varying(100) NOT NULL,
    content text NOT NULL,
    image_url text,
    story_type character varying(30) DEFAULT 'update'::character varying NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.business_vibe_tags (
    id integer NOT NULL,
    business_id character varying NOT NULL,
    user_id character varying NOT NULL,
    vibe character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.businesses (
    id character varying NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    subcategory character varying(100) NOT NULL,
    address character varying(255) NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(50) NOT NULL,
    rating numeric(3,1) DEFAULT '0'::numeric NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    black_owned boolean DEFAULT false NOT NULL,
    confidence_score integer DEFAULT 0 NOT NULL,
    safety_rating numeric(3,1),
    would_return_alone integer,
    recommendation_rate integer,
    description text NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    reviews jsonb DEFAULT '[]'::jsonb NOT NULL,
    phone character varying(30),
    website character varying(255),
    hours character varying(255),
    price_range character varying(10),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    submitted_by_id character varying,
    ownership_designations jsonb DEFAULT '[]'::jsonb NOT NULL,
    verified_designations jsonb DEFAULT '[]'::jsonb NOT NULL,
    image_url character varying(512),
    photos jsonb DEFAULT '[]'::jsonb NOT NULL,
    feedback_opt_in boolean DEFAULT false NOT NULL,
    promoted_until timestamp with time zone,
    current_location_since character varying(20),
    business_founded_date character varying(20),
    trust_badges jsonb DEFAULT '[]'::jsonb NOT NULL,
    stripe_connect_account_id character varying,
    return_policy text,
    seller_agreement_accepted_at timestamp with time zone,
    marketplace_tier character varying(20) DEFAULT 'free'::character varying NOT NULL,
    founding_business boolean DEFAULT false NOT NULL,
    founding_number integer,
    founding_granted_at timestamp with time zone,
    business_trial_started_at timestamp with time zone,
    business_status character varying(20) DEFAULT 'community'::character varying NOT NULL,
    marketplace_fee_locked boolean DEFAULT false NOT NULL,
    locked_fee numeric(5,4),
    locked_until timestamp with time zone,
    fee_source character varying(30),
    promotion_eligible boolean DEFAULT true NOT NULL,
    promotion_expiration_date timestamp with time zone,
    membership_renewal_date timestamp with time zone,
    videos jsonb DEFAULT '[]'::jsonb NOT NULL,
    instagram character varying(255),
    tiktok character varying(255),
    facebook character varying(255),
    twitter character varying(255),
    youtube character varying(255),
    pending_photos jsonb DEFAULT '[]'::jsonb NOT NULL,
    pinterest character varying(255),
    primary_social_platform character varying(30),
    intro_video_url character varying(512),
    weekly_schedule jsonb,
    show_availability boolean DEFAULT false NOT NULL,
    referred_by_code character varying(30),
    business_tagline character varying(255),
    owner_name character varying(150),
    owner_bio text,
    owner_story text,
    diaspora_countries jsonb DEFAULT '[]'::jsonb,
    featured_video_url character varying(512),
    featured_video_title character varying(150),
    featured_video_purpose character varying(60),
    flag_count integer DEFAULT 0 NOT NULL,
    flag_status character varying(20) DEFAULT 'none'::character varying NOT NULL,
    target_audience jsonb,
    hidden_gem_label character varying(60),
    hidden_gem_category character varying(60),
    hidden_gem_tagline character varying(255),
    hidden_gem_since timestamp with time zone,
    hidden_gem_expires_at timestamp with time zone,
    hidden_gem_nominations integer DEFAULT 0 NOT NULL,
    vibes jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_reference_only boolean DEFAULT false NOT NULL,
    reference_category character varying(30),
    profile_status character varying(30) DEFAULT 'community_listed'::character varying NOT NULL,
    community_audience_type character varying(30) DEFAULT 'unknown'::character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS public.category_waitlist (
    id integer NOT NULL,
    parent_category text NOT NULL,
    subcategory text,
    business_name text,
    email text NOT NULL,
    phone text,
    city text,
    state text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.challenge_applications (
    id integer NOT NULL,
    business_id character varying(100) NOT NULL,
    business_name text NOT NULL,
    business_city character varying(80),
    business_category character varying(80),
    challenge_id character varying(60) NOT NULL,
    challenge_name text NOT NULL,
    owner_name text,
    owner_email text,
    message text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by character varying,
    reviewed_at timestamp without time zone,
    applied_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.challenge_progress (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    challenge_id character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    completed_at timestamp without time zone,
    points_awarded boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.channel_follows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    channel_slug character varying(80) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.check_ins (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    business_id character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_lat numeric(10,7),
    user_lng numeric(10,7),
    verified_location boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.circle_adventures (
    id integer NOT NULL,
    circle_id integer NOT NULL,
    title text NOT NULL,
    adventure_date text NOT NULL,
    places jsonb,
    note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.circle_important_dates (
    id integer NOT NULL,
    circle_id integer NOT NULL,
    added_by_user_id text NOT NULL,
    title text NOT NULL,
    date_type text DEFAULT 'event'::text NOT NULL,
    target_date text NOT NULL,
    target_user_id text,
    target_user_name text,
    notes text,
    is_recurring boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.circle_members (
    id integer NOT NULL,
    circle_id integer NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.circle_nudges (
    id integer NOT NULL,
    circle_id integer NOT NULL,
    sender_id text NOT NULL,
    sender_name text,
    target_member_id text,
    nudge_type text DEFAULT 'check_this_out'::text NOT NULL,
    business_id text,
    business_name text,
    suggestion_id integer,
    message text,
    read_by_user_ids text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.circle_plans (
    id integer NOT NULL,
    circle_id integer NOT NULL,
    created_by text NOT NULL,
    title text NOT NULL,
    plan_date text,
    vibe text,
    budget text,
    availability_windows jsonb,
    itinerary jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    in_count integer DEFAULT 0 NOT NULL,
    maybe_count integer DEFAULT 0 NOT NULL,
    out_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    curator_mode text DEFAULT 'votes'::text NOT NULL,
    curator_member_id text
);

CREATE TABLE IF NOT EXISTS public.circle_suggestions (
    id integer NOT NULL,
    circle_id integer NOT NULL,
    user_id text NOT NULL,
    business_id text,
    place_name text NOT NULL,
    place_type text DEFAULT 'activity'::text NOT NULL,
    note text,
    upvotes integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.circle_votes (
    id integer NOT NULL,
    plan_id integer NOT NULL,
    user_id text NOT NULL,
    vote text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.city_archives (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(50) NOT NULL,
    slug character varying(120) NOT NULL,
    tagline text,
    description text,
    hero_image_url text,
    tour_visited_at timestamp without time zone,
    status character varying(20) DEFAULT 'upcoming'::character varying NOT NULL,
    contribution_count integer DEFAULT 0 NOT NULL,
    nomination_count integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.collection_follows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    collection_id character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.collection_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    collection_id character varying(100) NOT NULL,
    item_type character varying(30) NOT NULL,
    item_id character varying(100) NOT NULL,
    item_name character varying(300),
    item_emoji character varying(10),
    note text,
    display_order integer DEFAULT 0 NOT NULL,
    added_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.collections (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    cover_emoji character varying(10) DEFAULT '📌'::character varying NOT NULL,
    topic_id character varying(100),
    is_public boolean DEFAULT true NOT NULL,
    follow_count integer DEFAULT 0 NOT NULL,
    item_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(30) NOT NULL,
    lat numeric(10,7) NOT NULL,
    lng numeric(10,7) NOT NULL,
    description text,
    reported_by character varying NOT NULL,
    confirmed_count integer DEFAULT 0 NOT NULL,
    cleared_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_appreciations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    review_id character varying,
    business_id character varying NOT NULL,
    business_name character varying(255),
    user_id character varying,
    share_preference character varying(20) DEFAULT 'private'::character varying NOT NULL,
    recognition_tags text[] DEFAULT ARRAY[]::text[],
    encouragement_tags text[] DEFAULT ARRAY[]::text[],
    comment_option character varying(20),
    review_text text,
    appreciation_note text,
    author_name character varying(255),
    sent_to_business boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_boundaries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    target_type character varying(20) NOT NULL,
    target_id character varying NOT NULL,
    target_name character varying(255),
    boundary_types jsonb DEFAULT '[]'::jsonb NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_challenges (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon character varying(10) DEFAULT '🏆'::character varying NOT NULL,
    challenge_type character varying(60) NOT NULL,
    target_count integer DEFAULT 1 NOT NULL,
    points_reward integer DEFAULT 50 NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    completion_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_list_items (
    id integer NOT NULL,
    list_id integer NOT NULL,
    business_id character varying NOT NULL,
    business_name text NOT NULL,
    city character varying(80),
    note text,
    added_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    type public.listing_type NOT NULL,
    title text NOT NULL,
    description text,
    price character varying(50),
    price_type character varying(20) DEFAULT 'fixed'::character varying NOT NULL,
    category character varying(100),
    condition public.listing_condition,
    tags text[],
    city character varying(100),
    state character varying(50),
    zip_code character varying(20),
    is_remote boolean DEFAULT false NOT NULL,
    contact_preference character varying(30) DEFAULT 'app_message'::character varying NOT NULL,
    contact_info character varying(200),
    status public.listing_status DEFAULT 'active'::public.listing_status NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    saved_count integer DEFAULT 0 NOT NULL,
    report_count integer DEFAULT 0 NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    external_url character varying(500),
    photos text[],
    seller_display_name character varying(200)
);

CREATE TABLE IF NOT EXISTS public.community_lists (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    description text,
    category character varying(60),
    cover_emoji text DEFAULT '📍'::text,
    is_public boolean DEFAULT true NOT NULL,
    saved_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_places (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    venue_name character varying(200),
    category character varying(50) DEFAULT 'general'::character varying NOT NULL,
    city character varying(100),
    state character varying(100),
    country character varying(100) DEFAULT 'United States'::character varying NOT NULL,
    lat numeric(10,7),
    lng numeric(10,7),
    post_count integer DEFAULT 1 NOT NULL,
    positive_post_count integer DEFAULT 0 NOT NULL,
    community_rating numeric(3,1) DEFAULT '0'::numeric,
    added_by_user_id character varying,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_post_comments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    post_id character varying NOT NULL,
    author_id character varying,
    author_name character varying(100) NOT NULL,
    author_initials character varying(4) NOT NULL,
    author_color character varying(20) DEFAULT '#3B1F0E'::character varying NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_posts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    author_id character varying,
    author_name character varying(100) NOT NULL,
    author_initials character varying(4) NOT NULL,
    author_color character varying(20) DEFAULT '#3B1F0E'::character varying NOT NULL,
    content text NOT NULL,
    category character varying(50) DEFAULT 'general'::character varying NOT NULL,
    upvotes integer DEFAULT 0 NOT NULL,
    downvotes integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    post_type character varying(30) DEFAULT 'community'::character varying NOT NULL,
    business_id character varying,
    business_name character varying(150),
    business_link text,
    media_urls text,
    saved_place_id character varying,
    comments_count integer DEFAULT 0 NOT NULL,
    visibility character varying(20) DEFAULT 'public'::character varying NOT NULL,
    location_tag character varying(200),
    location_type character varying(30),
    topic_tag character varying(100),
    is_private_topic boolean DEFAULT false NOT NULL,
    has_content_warning boolean DEFAULT false NOT NULL,
    content_warning_type character varying(30),
    link_url text,
    link_title text,
    link_description text,
    link_domain character varying(200),
    link_favicon character varying(10),
    repost_id character varying,
    repost_author_name character varying(100),
    repost_author_initials character varying(4),
    repost_content text,
    audience_rating character varying(20) DEFAULT 'everyone'::character varying NOT NULL,
    rating_reason character varying(200),
    mentioned_business_id character varying,
    mentioned_business_name character varying(150),
    mentioned_business_tag character varying(50),
    mentioned_business_rating integer,
    requires_moderation boolean DEFAULT false NOT NULL,
    is_trusted_author boolean DEFAULT false NOT NULL,
    thread_id character varying,
    thread_position integer DEFAULT 1 NOT NULL,
    thread_total integer DEFAULT 1 NOT NULL,
    location_venue_name character varying(200),
    location_city character varying(100),
    location_country character varying(100),
    location_lat numeric(10,7),
    location_lng numeric(10,7),
    location_place_id character varying,
    hashtags text[]
);

CREATE TABLE IF NOT EXISTS public.community_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    category character varying(100) NOT NULL,
    city character varying(100),
    state character varying(50),
    description text,
    upvotes integer DEFAULT 0 NOT NULL,
    helper_count integer DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'open'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_says (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying NOT NULL,
    user_id character varying NOT NULL,
    tag character varying(60) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_signals (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    entity_id character varying NOT NULL,
    entity_type character varying NOT NULL,
    signal_type character varying NOT NULL,
    city character varying(100),
    journey_type character varying(50),
    context jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_space_listings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    posted_by_id character varying NOT NULL,
    posted_by_name character varying(200),
    title character varying(255) NOT NULL,
    description text,
    address character varying(500),
    neighborhood character varying(200),
    city character varying(100) NOT NULL,
    state character varying(50),
    space_type character varying(30) DEFAULT 'rent'::character varying NOT NULL,
    price_label character varying(100),
    sqft integer,
    listing_url character varying(500),
    agent_name character varying(200),
    agent_phone character varying(30),
    agent_email character varying(255),
    agent_url character varying(500),
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    zip_code character varying(10)
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    form_type character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    subject character varying(255),
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.content_filter_violations (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    channel character varying(50) NOT NULL,
    content_snippet text NOT NULL,
    matched_keywords text[] DEFAULT '{}'::text[] NOT NULL,
    was_blocked boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.content_reports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reporter_id character varying,
    target_type character varying NOT NULL,
    target_id character varying NOT NULL,
    reason character varying NOT NULL,
    description text,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversations (
    id integer NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    participant_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    business_id text,
    last_message_at timestamp with time zone,
    last_message_preview text,
    type character varying DEFAULT 'business'::character varying NOT NULL,
    request_status character varying,
    requested_by text
);

CREATE TABLE IF NOT EXISTS public.creator_profiles (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    bio text,
    categories jsonb DEFAULT '[]'::jsonb NOT NULL,
    platforms jsonb DEFAULT '[]'::jsonb NOT NULL,
    primary_platform character varying(30),
    city character varying(100),
    state character varying(50),
    is_public boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_premier boolean DEFAULT false NOT NULL,
    covered_locations jsonb DEFAULT '[]'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cultural_sites (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(100) DEFAULT 'Heritage'::character varying NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(50) NOT NULL,
    address character varying(255),
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    era character varying(100),
    significance text,
    image_url character varying(500),
    external_url character varying(500),
    is_verified boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    heritage_category character varying(100),
    subcategory character varying(100),
    ethnic_community character varying(100),
    year_established integer,
    is_accessible boolean DEFAULT false,
    is_family_friendly boolean DEFAULT true,
    admission_free boolean DEFAULT true,
    audio_guide boolean DEFAULT false,
    verified_source character varying(255),
    country character varying(100) DEFAULT 'United States'::character varying
);

CREATE TABLE IF NOT EXISTS public.docusign_envelopes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    envelope_id character varying NOT NULL,
    business_id character varying,
    user_id character varying,
    type character varying NOT NULL,
    status character varying(50) DEFAULT 'sent'::character varying NOT NULL,
    signer_email character varying,
    signer_name character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.entity_connections (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    from_id character varying NOT NULL,
    from_type character varying NOT NULL,
    to_id character varying NOT NULL,
    to_type character varying NOT NULL,
    connection_type character varying NOT NULL,
    strength integer DEFAULT 1 NOT NULL,
    label character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
    user_id character varying NOT NULL,
    event_id character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.events (
    id character varying NOT NULL,
    title character varying(255) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    date character varying(50) NOT NULL,
    date_short character varying(20) NOT NULL,
    "time" character varying(100) DEFAULT ''::character varying NOT NULL,
    location character varying(255) DEFAULT ''::character varying NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(50) NOT NULL,
    category character varying(100) DEFAULT 'Cultural'::character varying NOT NULL,
    attendees integer DEFAULT 0 NOT NULL,
    organizer character varying(255) DEFAULT ''::character varying NOT NULL,
    price character varying(50) DEFAULT 'Free'::character varying NOT NULL,
    is_free boolean DEFAULT true NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    featured boolean DEFAULT false NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_by_id character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    audience_rating character varying(20) DEFAULT 'everyone'::character varying NOT NULL,
    rating_reason character varying(200)
);

CREATE TABLE IF NOT EXISTS public.expert_follows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    follower_id character varying(100) NOT NULL,
    expert_id character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expert_profiles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    display_name character varying(150) NOT NULL,
    specialty character varying(100) NOT NULL,
    badge character varying(100) NOT NULL,
    bio text,
    credentials character varying(300),
    avatar_url character varying(500),
    location character varying(100),
    verification_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    follow_count integer DEFAULT 0,
    article_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.external_click_events (
    id integer NOT NULL,
    institution_name character varying(255) NOT NULL,
    institution_type character varying(50) DEFAULT 'other'::character varying NOT NULL,
    institution_url character varying(500),
    reference_type character varying(50) DEFAULT 'direct'::character varying NOT NULL,
    reference_id character varying(255),
    source character varying(50) DEFAULT 'unknown'::character varying NOT NULL,
    is_safety_related boolean DEFAULT false NOT NULL,
    user_id character varying(255),
    city character varying(100),
    state character varying(50),
    clicked_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.family_add_on_seats (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying(255) NOT NULL,
    stripe_subscription_item_id character varying(255),
    stripe_customer_id character varying(255),
    seat_count integer DEFAULT 1 NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.family_ai_usage (
    circle_id character varying(255) NOT NULL,
    year_month character varying(7) NOT NULL,
    requests_used integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.family_circle_members (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    circle_id character varying NOT NULL,
    user_id character varying,
    invite_email character varying(255),
    display_name character varying(100),
    role character varying DEFAULT 'member'::character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    permissions jsonb DEFAULT '{"canViewTrips": false, "safetyAlerts": true, "contentFilter": "none", "shareLocation": false, "emergencyContact": false, "messagingEnabled": true, "sosNotifications": true, "approveFriendRequests": false}'::jsonb NOT NULL,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    joined_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.family_circles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) DEFAULT 'My Family'::character varying NOT NULL,
    owner_id character varying NOT NULL,
    invite_code character varying(12) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.family_settings (
    user_id character varying(255) NOT NULL,
    allow_everyone boolean DEFAULT true NOT NULL,
    allow_teen boolean DEFAULT true NOT NULL,
    allow_young_adult boolean DEFAULT true NOT NULL,
    allow_adult boolean DEFAULT true NOT NULL,
    family_mode_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.financial_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    goal_id uuid,
    amount numeric(12,2) NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    type public.financial_goal_type NOT NULL,
    title text NOT NULL,
    description text,
    target_amount numeric(12,2) NOT NULL,
    current_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    deadline date,
    is_achieved boolean DEFAULT false NOT NULL,
    is_private boolean DEFAULT true NOT NULL,
    motivation_note text,
    milestones jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.flagged_officers (
    id integer NOT NULL,
    officer_name character varying(200) NOT NULL,
    badge_number character varying(50),
    department character varying(200),
    city character varying(100),
    state character varying(100),
    offense_type character varying(100),
    offense_description text NOT NULL,
    offense_date character varying(50),
    source_url text,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    submitted_by character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.flash_deals (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying NOT NULL,
    created_by character varying NOT NULL,
    title character varying(120) NOT NULL,
    description text,
    discount_text character varying(60),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.global_recommendations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    business_id character varying,
    country character varying(100) NOT NULL,
    city character varying(100),
    business_name character varying(255) NOT NULL,
    website character varying(255),
    social_media character varying(255),
    type character varying(50) DEFAULT 'other'::character varying NOT NULL,
    reason text,
    personal_connection text,
    communities jsonb DEFAULT '[]'::jsonb,
    badge character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.group_invites (
    id integer NOT NULL,
    group_id integer NOT NULL,
    invited_by text NOT NULL,
    invited_user_id text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    responded_at timestamp without time zone
);

CREATE TABLE IF NOT EXISTS public.group_itineraries (
    id integer NOT NULL,
    group_id integer NOT NULL,
    title text NOT NULL,
    destination text,
    content jsonb,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.group_reports (
    id integer NOT NULL,
    group_id integer NOT NULL,
    reported_by text NOT NULL,
    target_type text DEFAULT 'group'::text NOT NULL,
    target_id text,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.group_suggestions (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id text NOT NULL,
    type text DEFAULT 'location'::text NOT NULL,
    value text NOT NULL,
    notes text,
    upvotes integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.groups (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    category text DEFAULT 'general'::text NOT NULL,
    member_count integer DEFAULT 0 NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    created_by text,
    city text,
    state text,
    image_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    max_members integer DEFAULT 8 NOT NULL,
    is_age_restricted boolean DEFAULT false NOT NULL,
    audience_preferences jsonb DEFAULT '[]'::jsonb,
    rules jsonb DEFAULT '[]'::jsonb,
    profanity_level text DEFAULT 'moderate'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.guide_follows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    guide_id character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.guide_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    guide_id character varying(100) NOT NULL,
    section_id character varying(100) NOT NULL,
    item_type character varying(30) DEFAULT 'tip'::character varying NOT NULL,
    business_id character varying(100),
    title character varying(200) NOT NULL,
    description text,
    external_url character varying(500),
    external_label character varying(100),
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.guide_sections (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    guide_id character varying(100) NOT NULL,
    title character varying(150) NOT NULL,
    section_emoji character varying(10) DEFAULT '📌'::character varying NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.happening_now_stories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying(300) NOT NULL,
    summary text NOT NULL,
    category character varying(50) DEFAULT 'other'::character varying NOT NULL,
    source_url character varying(500),
    submitted_by character varying(100),
    submitter_name character varying(150),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    confirm_count integer DEFAULT 0 NOT NULL,
    is_admin_post boolean DEFAULT false NOT NULL,
    admin_note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hashtags (
    tag character varying(100) NOT NULL,
    post_count integer DEFAULT 0 NOT NULL,
    weekly_post_count integer DEFAULT 0 NOT NULL,
    last_post_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.health_post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.health_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    physician_id uuid NOT NULL,
    author_user_id character varying(255) NOT NULL,
    title character varying(300) NOT NULL,
    summary text NOT NULL,
    url character varying(2000) NOT NULL,
    source character varying(200) NOT NULL,
    topic_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.help_offers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    request_id character varying NOT NULL,
    user_id character varying NOT NULL,
    offer_types json DEFAULT '[]'::json NOT NULL,
    message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.heritage_stories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    site_id character varying(255) NOT NULL,
    user_id character varying(255),
    author_name character varying(100),
    relationship_type character varying(100) NOT NULL,
    content text NOT NULL,
    video_url character varying(500),
    tags jsonb DEFAULT '[]'::jsonb,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    is_ambassador boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.heritage_support_links (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    site_id character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    url character varying(500) NOT NULL,
    category character varying(50) DEFAULT 'giving'::character varying NOT NULL,
    is_verified boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hidden_gem_nominations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    business_id character varying NOT NULL,
    reason character varying(50) NOT NULL,
    comment text,
    audience_types text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.identity_verifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    admin_notes text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    reviewed_by character varying,
    selfie_key text
);

CREATE TABLE IF NOT EXISTS public.job_listings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    business_name character varying(255) NOT NULL,
    business_id character varying,
    title character varying(255) NOT NULL,
    type character varying(50) DEFAULT 'full_time'::character varying NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(50) NOT NULL,
    description text NOT NULL,
    requirements text,
    salary character varying(100),
    application_url character varying(500),
    contact_email character varying(255),
    posted_by_id character varying,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    posted_by_name character varying(200),
    industry character varying(100),
    is_personal_referral boolean DEFAULT false NOT NULL,
    is_remote boolean DEFAULT false NOT NULL,
    is_hybrid boolean DEFAULT false NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    pay_min numeric(10,2),
    pay_max numeric(10,2),
    pay_type character varying(20),
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.journal_insight_bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    insight_id uuid NOT NULL,
    user_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    pinned boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.journal_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pmid character varying(20) NOT NULL,
    title text NOT NULL,
    abstract text,
    authors jsonb DEFAULT '[]'::jsonb NOT NULL,
    journal_id character varying(50) NOT NULL,
    journal_label character varying(255),
    journal_abbrev character varying(100),
    pub_date character varying(50),
    doi character varying(300),
    url character varying(500) NOT NULL,
    designation_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    health_topic_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    bookmark_count integer DEFAULT 0 NOT NULL,
    is_curated boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    synced_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS public.journal_sync_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_id character varying(50),
    articles_found integer DEFAULT 0 NOT NULL,
    articles_inserted integer DEFAULT 0 NOT NULL,
    error text,
    ran_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kinfolk_circles (
    id integer NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'private'::text NOT NULL,
    privacy text DEFAULT 'invite_only'::text NOT NULL,
    host_user_id text NOT NULL,
    description text,
    emoji text DEFAULT '✨'::text,
    max_members integer DEFAULT 8 NOT NULL,
    city text,
    state text,
    planning_mode text DEFAULT 'open'::text NOT NULL,
    current_curator_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kinfolk_feedback (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    session_id character varying,
    business_name character varying(255) NOT NULL,
    category character varying(100),
    city character varying(100),
    reaction character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kinfolk_search_events (
    id integer NOT NULL,
    user_id character varying,
    query text NOT NULL,
    category character varying(100),
    city character varying(100),
    state character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kinfolk_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title character varying(255),
    destination character varying(255),
    vibes jsonb DEFAULT '[]'::jsonb,
    messages jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    share_id character varying(64)
);

CREATE TABLE IF NOT EXISTS public.kinfolk_task_lists (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(10) DEFAULT '📋'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kinfolk_tasks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    list_id character varying(255),
    title character varying(300) NOT NULL,
    notes text,
    due_at timestamp without time zone,
    due_time_label character varying(150),
    category character varying(50),
    is_completed boolean DEFAULT false NOT NULL,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kinfolk_twin_recs (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    business_id character varying NOT NULL,
    score real DEFAULT 0 NOT NULL,
    twin_count integer DEFAULT 1 NOT NULL,
    twin_cities jsonb DEFAULT '[]'::jsonb,
    reason character varying(255),
    computed_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.knowledge_article_reads (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    article_id character varying(100) NOT NULL,
    topic_id character varying(100),
    read_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.knowledge_articles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying(250) NOT NULL,
    slug character varying(250) NOT NULL,
    summary text NOT NULL,
    content text NOT NULL,
    category character varying(50) NOT NULL,
    subcategory character varying(100),
    tier character varying(20) DEFAULT 'free'::character varying NOT NULL,
    author_id character varying(100),
    author_name character varying(150) DEFAULT 'Editorial'::character varying NOT NULL,
    author_badge character varying(100),
    author_avatar character varying(500),
    tags text[],
    image_url character varying(500),
    read_time_minutes integer DEFAULT 4,
    disclaimer text,
    featured boolean DEFAULT false,
    view_count integer DEFAULT 0,
    status character varying(20) DEFAULT 'published'::character varying NOT NULL,
    published_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    topic_id character varying(100),
    audience_rating character varying(20) DEFAULT 'everyone'::character varying NOT NULL,
    rating_reason character varying(200)
);

CREATE TABLE IF NOT EXISTS public.knowledge_bookmarks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    article_id character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.knowledge_channels (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(80) NOT NULL,
    label character varying(100) NOT NULL,
    icon character varying(10) NOT NULL,
    description text,
    color character varying(20),
    sort_order integer DEFAULT 0 NOT NULL,
    published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.knowledge_topics (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    topic_name character varying(200) NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    tier character varying(20) DEFAULT 'free'::character varying NOT NULL,
    search_frequency_days integer DEFAULT 7 NOT NULL,
    last_searched_at timestamp without time zone,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    parent_category character varying(50),
    keywords text[],
    synonyms text[],
    trusted_sources jsonb,
    notification_priority character varying(20) DEFAULT 'standard'::character varying NOT NULL,
    topic_type character varying(30) DEFAULT 'general'::character varying NOT NULL,
    is_user_created boolean DEFAULT false NOT NULL,
    created_by_user_id character varying(100),
    canonical_name character varying(200),
    entity_type character varying(50),
    ownership_type character varying(30),
    is_minority_owned boolean,
    credibility_score integer DEFAULT 50 NOT NULL,
    credibility_tier character varying(30) DEFAULT 'community'::character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS public.life_journeys (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    journey_type character varying NOT NULL,
    title character varying(255) NOT NULL,
    city character varying(100),
    state character varying(100),
    status character varying DEFAULT 'active'::character varying NOT NULL,
    phases jsonb DEFAULT '[]'::jsonb NOT NULL,
    ai_context character varying(2000),
    kinfolk_session_id character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.location_shares (
    id integer NOT NULL,
    sharer_id character varying NOT NULL,
    share_token character varying(64) NOT NULL,
    recipient_email character varying(255),
    recipient_user_id character varying,
    label character varying(150) DEFAULT 'Live Location'::character varying NOT NULL,
    current_lat double precision,
    current_lng double precision,
    last_updated_at timestamp without time zone,
    expires_at timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.love_notes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    business_id character varying NOT NULL,
    user_id character varying NOT NULL,
    note text NOT NULL,
    upvotes integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    content_link character varying(512)
);

CREATE TABLE IF NOT EXISTS public.marketplace_fee_config (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tier character varying(20) NOT NULL,
    tier_label character varying(50) NOT NULL,
    standard_fee numeric(5,4) DEFAULT 0.1000 NOT NULL,
    promotional_fee numeric(5,4) DEFAULT 0.0700 NOT NULL,
    founding_fee numeric(5,4) DEFAULT 0.0500 NOT NULL,
    promo_active boolean DEFAULT false NOT NULL,
    promo_start_date timestamp with time zone,
    promo_end_date timestamp with time zone,
    promo_description character varying(255),
    updated_by character varying(100),
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text
);

CREATE TABLE IF NOT EXISTS public.marketplace_saved (
    user_id text NOT NULL,
    listing_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.meetup_verifications (
    id integer NOT NULL,
    initiator_id character varying NOT NULL,
    partner_id character varying NOT NULL,
    connection_id integer,
    location text,
    note text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    initiated_at timestamp without time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp without time zone,
    expires_at timestamp without time zone NOT NULL,
    clear_code character varying(100),
    safety_watcher_id character varying,
    safety_watcher_email text,
    cleared_at timestamp without time zone,
    arrival_check_at timestamp without time zone,
    arrival_checked_at timestamp without time zone,
    arrival_check_status character varying(20),
    arrival_alert_sent_at timestamp without time zone,
    home_check_at timestamp without time zone,
    home_checked_at timestamp without time zone,
    home_check_status character varying(20),
    home_alert_sent_at timestamp without time zone,
    safety_friend_name character varying(150),
    safety_friend_email character varying(255)
);

CREATE TABLE IF NOT EXISTS public.member_connections (
    id integer NOT NULL,
    requester_id text NOT NULL,
    recipient_id text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    group_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    responded_at timestamp without time zone
);

CREATE TABLE IF NOT EXISTS public.mentorship_profiles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    full_name character varying(100) NOT NULL,
    bio text,
    industry character varying(80),
    role character varying(20) DEFAULT 'mentor'::character varying NOT NULL,
    expertise text,
    city character varying(80),
    available boolean DEFAULT true NOT NULL,
    linkedin_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    specialties jsonb DEFAULT '[]'::jsonb NOT NULL,
    state character varying(50),
    is_remote boolean DEFAULT true NOT NULL,
    latitude character varying(30),
    longitude character varying(30),
    session_type character varying(20) DEFAULT 'free'::character varying NOT NULL,
    session_rate character varying(100),
    calendly_url text,
    website_url text
);

CREATE TABLE IF NOT EXISTS public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sender_id text
);

CREATE TABLE IF NOT EXISTS public.neighborhood_pins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    label character varying(255) NOT NULL,
    city character varying(255),
    state character varying(100),
    latitude double precision,
    longitude double precision,
    intent_id character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.neighborhood_surveys (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    city character varying(100) NOT NULL,
    neighborhood character varying(255),
    visit_purpose character varying(100) NOT NULL,
    visit_freq character varying(50),
    daytime_safety integer NOT NULL,
    nighttime_safety integer NOT NULL,
    walkability integer,
    transit_safety integer,
    atmosphere character varying(50) NOT NULL,
    police_visibility character varying(50),
    police_impact character varying(50),
    accessibility jsonb DEFAULT '[]'::jsonb NOT NULL,
    tips jsonb DEFAULT '[]'::jsonb NOT NULL,
    comments text,
    safety_score integer DEFAULT 0 NOT NULL,
    community_score integer DEFAULT 0 NOT NULL,
    walkability_score integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    moderator_notes text,
    reviewed_at timestamp with time zone,
    reviewed_by character varying,
    community_rating integer,
    culturally_connected character varying(50),
    linked_business_id character varying,
    nomination_name character varying(255),
    nomination_category character varying(100),
    nomination_social_link character varying(500)
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    topics text[] DEFAULT ARRAY['community'::text, 'safety'::text, 'events'::text, 'business'::text] NOT NULL,
    push_enabled boolean DEFAULT true NOT NULL,
    email_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type character varying DEFAULT 'system'::character varying NOT NULL,
    title character varying(200) NOT NULL,
    body text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    entity_id character varying,
    entity_type character varying(50),
    data jsonb
);

CREATE TABLE IF NOT EXISTS public.officer_transfers (
    id integer NOT NULL,
    officer_id integer NOT NULL,
    from_department character varying(200),
    from_city character varying(100),
    from_state character varying(100),
    to_department character varying(200) NOT NULL,
    to_city character varying(100) NOT NULL,
    to_state character varying(100) NOT NULL,
    transfer_date character varying(50),
    source_url text,
    notes text,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    notified_at timestamp with time zone,
    submitted_by character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pay_it_forward_guides (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    title character varying(200) NOT NULL,
    personal_story text,
    subject_name character varying(200) NOT NULL,
    story_type character varying(50) DEFAULT 'general'::character varying NOT NULL,
    subject_emoji character varying(10) DEFAULT '✨'::character varying NOT NULL,
    experience_context character varying(150),
    city character varying(100),
    is_public boolean DEFAULT true NOT NULL,
    follow_count integer DEFAULT 0 NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    section_count integer DEFAULT 0 NOT NULL,
    item_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physician_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    display_name character varying(200) NOT NULL,
    credentials character varying(100) NOT NULL,
    specialty character varying(150) NOT NULL,
    institution character varying(200),
    license_state character varying(50),
    license_number character varying(100),
    bio text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    verified_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pinned_business_items (
    id integer NOT NULL,
    business_id character varying NOT NULL,
    item_type character varying NOT NULL,
    review_id character varying,
    review_text text,
    review_author character varying(120),
    review_rating integer,
    review_initials character varying(4),
    review_color character varying(12),
    review_time_ago character varying(40),
    video_url text,
    video_title character varying(200),
    pinned_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    notified_expiry boolean DEFAULT false NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS public.plate_passes (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    business_id character varying NOT NULL,
    share_type character varying(20) NOT NULL,
    message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.points_ledger (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    action character varying(50) NOT NULL,
    points integer NOT NULL,
    entity_id character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.points_redemptions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    reward_id character varying(60) NOT NULL,
    reward_title character varying(120) NOT NULL,
    points_cost integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    fulfilled_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.profile_recommended_spots (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    business_id character varying NOT NULL,
    business_name character varying(200),
    business_category character varying(100),
    stance character varying(50),
    blurb text,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profile_tags (
    id integer NOT NULL,
    tagger_id character varying NOT NULL,
    tagged_user_id character varying NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.purchase_disputes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    business_id character varying NOT NULL,
    listing_id character varying,
    stripe_session_id character varying,
    dispute_type character varying NOT NULL,
    description text NOT NULL,
    status character varying DEFAULT 'open'::character varying NOT NULL,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.push_tokens (
    user_id character varying NOT NULL,
    token character varying(500) NOT NULL,
    platform character varying(20) DEFAULT 'unknown'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reference_link_clicks (
    id integer NOT NULL,
    business_id character varying NOT NULL,
    user_id character varying,
    source character varying(30) DEFAULT 'direct'::character varying NOT NULL,
    source_id character varying(255),
    referrer_user_id character varying,
    clicked_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.request_upvotes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    request_id character varying NOT NULL,
    user_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.resource_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    query text,
    category character varying(50),
    keywords text[],
    city character varying(100),
    state character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.resource_opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submitted_by_user_id text,
    type public.opportunity_type NOT NULL,
    title text NOT NULL,
    organization character varying(200),
    city character varying(100),
    state character varying(50),
    zip_code character varying(20),
    is_remote boolean DEFAULT false NOT NULL,
    is_online boolean DEFAULT false NOT NULL,
    description text,
    pay_range character varying(100),
    schedule_type character varying(50),
    lease_length character varying(100),
    rent character varying(50),
    bedrooms integer,
    bathrooms character varying(20),
    application_link text,
    contact_method character varying(200),
    deadline timestamp without time zone,
    available_date timestamp without time zone,
    submitter_role character varying(50),
    is_publicly_posted boolean DEFAULT false,
    is_second_chance boolean DEFAULT false,
    accessibility_features text,
    benefits text,
    personal_note text,
    opportunity_source_tier public.opportunity_source_tier DEFAULT 'community_shared'::public.opportunity_source_tier NOT NULL,
    opportunity_status public.opportunity_status DEFAULT 'active'::public.opportunity_status NOT NULL,
    report_count integer DEFAULT 0 NOT NULL,
    expires_at timestamp without time zone,
    last_confirmed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    category public.resource_category NOT NULL,
    subcategory character varying(100),
    source_tier public.resource_source_tier DEFAULT 'community_shared'::public.resource_source_tier NOT NULL,
    organization character varying(200),
    url text,
    phone character varying(30),
    email character varying(200),
    city character varying(100),
    state character varying(50),
    zip_code character varying(20),
    is_national boolean DEFAULT true NOT NULL,
    keywords text[],
    application_deadline timestamp without time zone,
    expires_at timestamp without time zone,
    last_confirmed_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    report_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    review_id character varying NOT NULL,
    user_id character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    business_id character varying NOT NULL,
    author_name character varying(255) DEFAULT 'Community Member'::character varying NOT NULL,
    rating integer NOT NULL,
    text text,
    would_return_alone boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    social_handle character varying(100),
    social_platform character varying(30),
    video_url character varying(500),
    non_minority_owned boolean DEFAULT false,
    community_support integer,
    website character varying(500),
    location character varying(255),
    is_anonymous boolean DEFAULT false NOT NULL,
    recommends_as_employer boolean DEFAULT false,
    now_hiring_url character varying(500),
    weight numeric(4,2) DEFAULT 1.00 NOT NULL,
    helpful_votes integer DEFAULT 0 NOT NULL,
    verified_purchase boolean DEFAULT false NOT NULL,
    verified_checkin boolean DEFAULT false NOT NULL,
    status character varying(30) DEFAULT 'posted'::character varying NOT NULL,
    owner_response text,
    owner_responded_at timestamp with time zone,
    customer_edited_at timestamp with time zone,
    photos text[],
    risk_score integer DEFAULT 0 NOT NULL,
    moderation_level character varying(20) DEFAULT 'low'::character varying NOT NULL,
    moderation_reasons text[],
    verification_badge character varying(40)
);

CREATE TABLE IF NOT EXISTS public.roadmap_steps (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    roadmap_id character varying(100) NOT NULL,
    category character varying(100) NOT NULL,
    category_emoji character varying(10) DEFAULT '📋'::character varying NOT NULL,
    title character varying(300) NOT NULL,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    is_complete boolean DEFAULT false NOT NULL,
    completed_at timestamp without time zone,
    priority character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    external_url character varying(500),
    external_label character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roadmaps (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    title character varying(300) NOT NULL,
    description text,
    topic_id character varying(100),
    topic_name character varying(200),
    intent character varying(100),
    cover_emoji character varying(10) DEFAULT '🗺️'::character varying NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    is_ai_generated boolean DEFAULT true NOT NULL,
    total_steps integer DEFAULT 0 NOT NULL,
    completed_steps integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.safe_space_preferences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    hide_not_interested boolean DEFAULT true NOT NULL,
    hide_unresolved_alerts boolean DEFAULT false NOT NULL,
    show_would_return_alone boolean DEFAULT false NOT NULL,
    prioritize_minority_owned boolean DEFAULT true NOT NULL,
    hide_previously_reported boolean DEFAULT true NOT NULL,
    safety_alerts_only_saved boolean DEFAULT false NOT NULL,
    pause_dms boolean DEFAULT false NOT NULL,
    require_followers boolean DEFAULT false NOT NULL,
    disable_promo_messages boolean DEFAULT false NOT NULL,
    verified_users_only boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.safety_checkins (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    trusted_contact_name character varying(150) NOT NULL,
    trusted_contact_email character varying(255) NOT NULL,
    scheduled_at timestamp without time zone NOT NULL,
    confirmed_at timestamp without time zone,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    note text,
    location text,
    city character varying(100),
    notified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.safety_incidents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    city character varying(100) NOT NULL,
    neighborhood character varying(255),
    category character varying(100) NOT NULL,
    severity character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    report_count integer DEFAULT 1 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    notifications_sent boolean DEFAULT false NOT NULL,
    triggered_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.safety_reports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reporter_id character varying,
    reporter_name character varying(255) DEFAULT 'Anonymous'::character varying NOT NULL,
    category character varying(100) NOT NULL,
    target_type character varying(50) DEFAULT 'business'::character varying NOT NULL,
    target_id character varying,
    target_name character varying(255) NOT NULL,
    description text,
    severity character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    moderator_notes text,
    reviewed_at timestamp with time zone,
    reviewed_by character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    routing_type character varying(20) DEFAULT 'moderation'::character varying NOT NULL,
    business_response_requested boolean DEFAULT false NOT NULL,
    business_response_deadline timestamp with time zone,
    business_response_text text,
    auto_escalated boolean DEFAULT false NOT NULL,
    incident_categories jsonb DEFAULT '[]'::jsonb NOT NULL,
    incident_parties jsonb DEFAULT '[]'::jsonb NOT NULL,
    incident_severity character varying(20),
    incident_description text,
    evidence_links text
);

CREATE TABLE IF NOT EXISTS public.safety_tip_confirmations (
    id integer NOT NULL,
    tip_id integer NOT NULL,
    user_id character varying NOT NULL,
    user_lat real,
    user_lng real,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.safety_tips (
    id integer NOT NULL,
    submitted_by_id character varying NOT NULL,
    business_name character varying(255),
    address text,
    city character varying(100) NOT NULL,
    state character varying(50),
    lat real NOT NULL,
    lng real NOT NULL,
    description text NOT NULL,
    category character varying(50) DEFAULT 'violence'::character varying NOT NULL,
    confirmation_count integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    alerts_sent boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.saved_community_locations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    label character varying(100) NOT NULL,
    city character varying(100),
    state character varying(50),
    zip_code character varying(10),
    neighborhood character varying(200),
    is_my_community boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    loc_type character varying(20) DEFAULT 'geographic'::character varying NOT NULL,
    industry character varying(100)
);

CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    job_id character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.saved_places (
    user_id character varying NOT NULL,
    business_id character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_public boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.show_love_nominations (
    id integer NOT NULL,
    nominator_id character varying,
    nominee_type character varying(50) DEFAULT 'person'::character varying NOT NULL,
    nominee_name character varying(200) NOT NULL,
    nominee_user_id character varying,
    nominee_business_id character varying,
    nominee_handle character varying(100),
    nominee_image_url character varying(512),
    category character varying(80) NOT NULL,
    what_known_for text[] DEFAULT '{}'::text[] NOT NULL,
    reason text NOT NULL,
    experience text,
    city character varying(100),
    is_public boolean DEFAULT true NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    show_love_count integer DEFAULT 0 NOT NULL,
    support_count integer DEFAULT 0 NOT NULL,
    saved_count integer DEFAULT 0 NOT NULL,
    visited_count integer DEFAULT 0 NOT NULL,
    spotlight_month character varying(7),
    spotlight_type character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.show_love_reactions (
    id integer NOT NULL,
    nomination_id integer NOT NULL,
    user_id character varying NOT NULL,
    reaction_type character varying(30) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.social_invites (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    platform character varying(30) NOT NULL,
    handle_or_url character varying(500) NOT NULL,
    name character varying(200),
    type character varying(20) DEFAULT 'friend'::character varying NOT NULL,
    biz_name character varying(300),
    referral_code character varying(30),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.space_reports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reporter_id character varying,
    space_name character varying(200) NOT NULL,
    address character varying(300),
    city character varying(100) NOT NULL,
    category character varying NOT NULL,
    concern_types text NOT NULL,
    description text NOT NULL,
    is_anonymous boolean DEFAULT true NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.story_confirmations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    story_id character varying(100) NOT NULL,
    user_id character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
    stripe_event_id character varying NOT NULL,
    processed_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.thread_reads (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    post_id character varying NOT NULL,
    read_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.topic_credibility_signals (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    topic_id character varying(100) NOT NULL,
    user_id character varying(100),
    signal_type character varying(30) NOT NULL,
    weight integer DEFAULT 1 NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.topic_issues (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    category character varying(50),
    keywords text[],
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.travel_flights (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    flight_number character varying(20) NOT NULL,
    airline character varying(100),
    departure_date character varying(10) NOT NULL,
    origin character varying(10),
    destination character varying(10),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.trip_journals (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    description text,
    cities text[],
    cover_emoji text DEFAULT '✈️'::text,
    is_public boolean DEFAULT true NOT NULL,
    saved_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.trusted_contact_shares (
    id integer NOT NULL,
    connection_id integer NOT NULL,
    initiator_id text NOT NULL,
    partner_id text NOT NULL,
    trusted_contact_name text NOT NULL,
    trusted_contact_email text,
    trusted_contact_phone text,
    initiator_consent boolean DEFAULT true NOT NULL,
    partner_consent boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending_consent'::text NOT NULL,
    activated_at timestamp without time zone,
    revoked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    achievement_type character varying(60) NOT NULL,
    metadata json,
    earned_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    topic_id character varying(100),
    badge_type character varying(50) NOT NULL,
    badge_name character varying(200) NOT NULL,
    badge_emoji character varying(10) DEFAULT '✦'::character varying NOT NULL,
    description text,
    is_public boolean DEFAULT true NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_volunteered boolean DEFAULT false NOT NULL,
    years_of_experience integer,
    experience_note text,
    earned_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone
);

CREATE TABLE IF NOT EXISTS public.user_delivery_preferences (
    user_id character varying NOT NULL,
    digest_mode character varying(30) DEFAULT 'weekly'::character varying NOT NULL,
    scope character varying(20) DEFAULT 'all'::character varying NOT NULL,
    include_saved_cities boolean DEFAULT false NOT NULL,
    include_saved_businesses boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_follows (
    id integer NOT NULL,
    follower_id character varying NOT NULL,
    following_id character varying NOT NULL,
    status character varying DEFAULT 'accepted'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    accepted_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.user_hashtag_follows (
    user_id character varying NOT NULL,
    hashtag character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_health_topic_follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    topic_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    pinned_topic_ids jsonb DEFAULT '[]'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_issue_follows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    issue_id character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_pinned_to_profile boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_locations (
    user_id character varying NOT NULL,
    lat numeric(10,7) NOT NULL,
    lng numeric(10,7) NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id character varying NOT NULL,
    favorite_categories jsonb DEFAULT '[]'::jsonb,
    favorite_cities jsonb DEFAULT '[]'::jsonb,
    avoid_categories jsonb DEFAULT '[]'::jsonb,
    budget_range character varying(20) DEFAULT 'any'::character varying,
    trip_style jsonb DEFAULT '[]'::jsonb,
    travel_companion character varying(30) DEFAULT 'solo'::character varying,
    dietary_notes text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    communication_style character varying(20) DEFAULT 'friendly'::character varying,
    personality_mode character varying(30) DEFAULT 'neighborhood_guide'::character varying,
    emoji_level character varying(10) DEFAULT 'some'::character varying,
    humor_level character varying(10) DEFAULT 'light'::character varying,
    cultural_interests jsonb DEFAULT '[]'::jsonb,
    know_before_you_go boolean DEFAULT true,
    regional_flavor character varying(30) DEFAULT 'standard'::character varying,
    preferred_ownership_types jsonb DEFAULT '[]'::jsonb,
    search_history jsonb DEFAULT '[]'::jsonb,
    lifestyle_services jsonb DEFAULT '[]'::jsonb,
    diaspora_countries jsonb DEFAULT '[]'::jsonb,
    aave_level smallint DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id character varying NOT NULL,
    notif_events boolean DEFAULT true NOT NULL,
    notif_business boolean DEFAULT true NOT NULL,
    notif_messages boolean DEFAULT true NOT NULL,
    notif_reviews boolean DEFAULT true NOT NULL,
    notif_community boolean DEFAULT false NOT NULL,
    notif_promotions boolean DEFAULT false NOT NULL,
    notif_digest boolean DEFAULT true NOT NULL,
    notif_tips boolean DEFAULT false NOT NULL,
    notif_post_nudges boolean DEFAULT true NOT NULL,
    quiet_hours_enabled boolean DEFAULT true NOT NULL,
    quiet_hours_from character varying(10) DEFAULT '10:00 PM'::character varying NOT NULL,
    quiet_hours_until character varying(10) DEFAULT '8:00 AM'::character varying NOT NULL,
    profile_visibility character varying DEFAULT 'community'::character varying NOT NULL,
    show_location boolean DEFAULT true NOT NULL,
    location_precision character varying DEFAULT 'neighborhood'::character varying NOT NULL,
    activity_status boolean DEFAULT true NOT NULL,
    usage_analytics boolean DEFAULT true NOT NULL,
    personalised_suggestions boolean DEFAULT true NOT NULL,
    kinfolk_memory_enabled boolean DEFAULT true NOT NULL,
    profile_view_tracking_enabled boolean DEFAULT true NOT NULL,
    post_nudges_enabled boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    safety_alert_police boolean DEFAULT true NOT NULL,
    safety_alert_ice boolean DEFAULT true NOT NULL,
    safety_alert_radius_miles integer DEFAULT 5 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_topic_follows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100) NOT NULL,
    topic_id character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_pinned_to_profile boolean DEFAULT false NOT NULL,
    hub_intent character varying(30)
);

CREATE TABLE IF NOT EXISTS public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    push_token character varying,
    approved boolean DEFAULT false NOT NULL,
    role character varying DEFAULT 'user'::character varying NOT NULL,
    member_type character varying DEFAULT 'individual'::character varying,
    trial_ends_at timestamp with time zone,
    founding_member_number integer,
    referral_code character varying,
    referral_count integer DEFAULT 0 NOT NULL,
    date_of_birth timestamp without time zone,
    kinfolk_query_month character varying(7),
    kinfolk_queries_this_month integer DEFAULT 0 NOT NULL,
    industry character varying(100),
    job_title character varying(150),
    trust_level integer DEFAULT 1 NOT NULL,
    reputation_score integer DEFAULT 0 NOT NULL,
    identity_verified boolean DEFAULT false NOT NULL,
    identity_verified_at timestamp with time zone,
    policy_violations_count integer DEFAULT 0 NOT NULL,
    helpful_reviews_count integer DEFAULT 0 NOT NULL,
    username character varying(30),
    is_private boolean DEFAULT false NOT NULL,
    followers_count integer DEFAULT 0 NOT NULL,
    following_count integer DEFAULT 0 NOT NULL,
    bio character varying(300),
    referred_by_code character varying,
    home_city character varying(100),
    password_hash character varying,
    email_verified boolean DEFAULT false NOT NULL,
    email_verification_token character varying,
    email_verification_expires timestamp with time zone,
    agree_to_terms boolean DEFAULT false NOT NULL,
    show_city boolean DEFAULT true NOT NULL,
    allow_dm boolean DEFAULT true NOT NULL,
    display_name_format character varying DEFAULT 'full'::character varying,
    is_business_owner boolean DEFAULT false NOT NULL,
    is_content_creator boolean DEFAULT false NOT NULL,
    is_community_organizer boolean DEFAULT false NOT NULL,
    profile_setup_complete boolean DEFAULT false NOT NULL,
    apple_id character varying,
    phone_number character varying(20),
    phone_verified boolean DEFAULT false NOT NULL,
    is_influencer boolean DEFAULT false NOT NULL,
    trial_reminder_3day_sent_at timestamp with time zone,
    trial_reminder_1day_sent_at timestamp with time zone,
    trial_expired_email_sent_at timestamp with time zone,
    win_back_email_sent_at timestamp with time zone,
    notif_events boolean DEFAULT true NOT NULL,
    notif_business boolean DEFAULT true NOT NULL,
    notif_messages boolean DEFAULT true NOT NULL,
    notif_reviews boolean DEFAULT true NOT NULL,
    notif_community boolean DEFAULT false NOT NULL,
    notif_promotions boolean DEFAULT false NOT NULL,
    notif_digest boolean DEFAULT true NOT NULL,
    notif_tips boolean DEFAULT false NOT NULL,
    notif_post_nudges boolean DEFAULT true NOT NULL,
    quiet_hours_enabled boolean DEFAULT true NOT NULL,
    quiet_hours_from character varying(10) DEFAULT '10:00 PM'::character varying NOT NULL,
    quiet_hours_until character varying(10) DEFAULT '8:00 AM'::character varying NOT NULL,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    marketing_opt_out boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.verification_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    submitter_id character varying,
    business_name character varying NOT NULL,
    business_type character varying NOT NULL,
    owner_name character varying NOT NULL,
    website_url character varying,
    instagram_handle character varying,
    years_in_business integer,
    city character varying,
    state character varying,
    message text,
    submitter_email character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    verification_level character varying DEFAULT 'basic'::character varying NOT NULL,
    ownership_percentage integer,
    ein_number character varying,
    documents_provided text,
    business_license_provided boolean DEFAULT false,
    certification_org character varying,
    certification_url character varying,
    certification_number character varying,
    business_id character varying,
    document_urls text
);

CREATE TABLE IF NOT EXISTS public.voice_usage (
    id integer NOT NULL,
    user_id text NOT NULL,
    year_month text NOT NULL,
    chars_used integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.waitlist_signups (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    referral_code character varying(20),
    referred_by character varying(20),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    city character varying(100),
    state character varying(50),
    is_business_owner boolean DEFAULT false NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    approved_at timestamp without time zone,
    first_name character varying(100),
    welcome_email_sent boolean DEFAULT false NOT NULL,
    last_name character varying(100),
    website_url character varying(500),
    last_nudge_sent_at timestamp without time zone,
    launch_email_sent boolean DEFAULT false NOT NULL,
    beta_email_sent boolean DEFAULT false NOT NULL,
    family_group_id character varying(36),
    city_nomination character varying(150),
    import_batch_id character varying(100)
);

CREATE TABLE IF NOT EXISTS public.wellness_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    date date NOT NULL,
    mood integer,
    energy_level integer,
    stress_level integer,
    sleep_hours numeric(4,1),
    gratitude text,
    intention text,
    note text,
    is_public boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wellness_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    target_value numeric(8,2),
    current_value numeric(8,2) DEFAULT '0'::numeric NOT NULL,
    unit character varying(30),
    frequency character varying(20) DEFAULT 'daily'::character varying NOT NULL,
    start_date date,
    target_date date,
    is_active boolean DEFAULT true NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    streak_count integer DEFAULT 0 NOT NULL,
    last_completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    business_name character varying(255) NOT NULL,
    category character varying(100),
    city character varying(100),
    neighborhood character varying(100),
    description text,
    must_try text,
    session_id character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    country character varying(100),
    destination_type character varying(30) DEFAULT 'business'::character varying,
    non_minority_owned boolean DEFAULT false,
    website character varying(500),
    location character varying(255)
);


-- ── SECTION 4: ADD COLUMN IF NOT EXISTS (handles partial tables) ────────
-- Safe no-op for columns that already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'archive_id'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN archive_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'contributor_name'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN contributor_name character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN type character varying(40) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN title character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'content'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN content text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'media_url'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN media_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN neighborhood character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN is_approved boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'upvotes'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN upvotes integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'archive_contributions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.archive_contributions ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auth_events' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.auth_events ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auth_events' AND column_name = 'event'
  ) THEN
    ALTER TABLE IF EXISTS public.auth_events ADD COLUMN event character varying(60) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auth_events' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE IF EXISTS public.auth_events ADD COLUMN ip_address character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auth_events' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE IF EXISTS public.auth_events ADD COLUMN user_agent text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auth_events' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE IF EXISTS public.auth_events ADD COLUMN metadata jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auth_events' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.auth_events ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'badge_helpful_votes' AND column_name = 'badge_id'
  ) THEN
    ALTER TABLE IF EXISTS public.badge_helpful_votes ADD COLUMN badge_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'badge_helpful_votes' AND column_name = 'voter_id'
  ) THEN
    ALTER TABLE IF EXISTS public.badge_helpful_votes ADD COLUMN voter_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'badge_helpful_votes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.badge_helpful_votes ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_ai_plan_cache' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_ai_plan_cache ADD COLUMN business_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_ai_plan_cache' AND column_name = 'tier'
  ) THEN
    ALTER TABLE IF EXISTS public.business_ai_plan_cache ADD COLUMN tier character varying(30) DEFAULT 'navigator'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_ai_plan_cache' AND column_name = 'plan_data'
  ) THEN
    ALTER TABLE IF EXISTS public.business_ai_plan_cache ADD COLUMN plan_data jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_ai_plan_cache' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_ai_plan_cache ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_badges' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_badges ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_badges' AND column_name = 'badge_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_badges ADD COLUMN badge_id character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_badges' AND column_name = 'appreciation_count'
  ) THEN
    ALTER TABLE IF EXISTS public.business_badges ADD COLUMN appreciation_count integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_badges' AND column_name = 'earned_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_badges ADD COLUMN earned_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_badges' AND column_name = 'last_updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_badges ADD COLUMN last_updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_broadcasts' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_broadcasts ADD COLUMN business_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_broadcasts' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_broadcasts ADD COLUMN business_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_broadcasts' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.business_broadcasts ADD COLUMN type character varying(20) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_broadcasts' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.business_broadcasts ADD COLUMN title character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_broadcasts' AND column_name = 'body'
  ) THEN
    ALTER TABLE IF EXISTS public.business_broadcasts ADD COLUMN body text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_broadcasts' AND column_name = 'recipient_count'
  ) THEN
    ALTER TABLE IF EXISTS public.business_broadcasts ADD COLUMN recipient_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_broadcasts' AND column_name = 'delivered_count'
  ) THEN
    ALTER TABLE IF EXISTS public.business_broadcasts ADD COLUMN delivered_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_broadcasts' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE IF EXISTS public.business_broadcasts ADD COLUMN view_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_broadcasts' AND column_name = 'save_count'
  ) THEN
    ALTER TABLE IF EXISTS public.business_broadcasts ADD COLUMN save_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_broadcasts' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_broadcasts ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_captions' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_captions ADD COLUMN business_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_captions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_captions ADD COLUMN user_id character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_captions' AND column_name = 'caption'
  ) THEN
    ALTER TABLE IF EXISTS public.business_captions ADD COLUMN caption character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_captions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_captions ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN business_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN business_name character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN owner_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'email'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN email character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'phone'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN phone character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'role'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN role character varying(50) DEFAULT 'owner'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'website'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN website character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'instagram_handle'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN instagram_handle character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'additional_info'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN additional_info text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN admin_notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_claims' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_claims ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_click_events' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_click_events ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_click_events' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_click_events ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_click_events' AND column_name = 'click_type'
  ) THEN
    ALTER TABLE IF EXISTS public.business_click_events ADD COLUMN click_type character varying(30) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_click_events' AND column_name = 'clicked_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_click_events ADD COLUMN clicked_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN business_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'business_story'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN business_story text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'mission_statement'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN mission_statement text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'why_started'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN why_started text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'what_customers_should_know'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN what_customers_should_know text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'ownership_badges'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN ownership_badges jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'community_values'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN community_values jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'audiences_served'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN audiences_served jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'accessibility_features'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN accessibility_features jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'vibes'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN vibes jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'employee_count'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN employee_count integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'is_hiring'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN is_hiring boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'has_internships'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN has_internships boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'has_volunteer_opportunities'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN has_volunteer_opportunities boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'current_highlights'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN current_highlights jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'community_initiatives'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN community_initiatives jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'growth_goals'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN growth_goals jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'audience_type'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN audience_type character varying(30) DEFAULT 'unknown'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'age_restriction_reasons'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN age_restriction_reasons jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'environment_tags'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN environment_tags jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_identity' AND column_name = 'amenity_tags'
  ) THEN
    ALTER TABLE IF EXISTS public.business_identity ADD COLUMN amenity_tags jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN business_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'issue_type'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN issue_type character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'issue_description'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN issue_description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'ownership_preferences'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN ownership_preferences jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'service_types'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN service_types jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'budget'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN budget character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'timeline'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN timeline character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN status character varying(50) DEFAULT 'active'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'plan_data'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN plan_data jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_improvement_plans' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_improvement_plans ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN business_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'business_city'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN business_city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'business_category'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN business_category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'business_address'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN business_address character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'is_minority_owned'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN is_minority_owned boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'survey_type'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN survey_type character varying(20) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'submitted_by_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN submitted_by_user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'responses'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN responses jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'moderator_notes'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN moderator_notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_insight_surveys' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_insight_surveys ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'review_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN review_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'invited_by_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN invited_by_user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN business_name character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'social_handle'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN social_handle character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'social_platform'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN social_platform character varying(30) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN status character varying(30) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'trial_start_date'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN trial_start_date timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'trial_end_date'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN trial_end_date timestamp with time zone DEFAULT (now() + '60 days'::interval) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_invites' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_invites ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'stripe_product_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN stripe_product_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN stripe_price_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'price_in_cents'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN price_in_cents integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'currency'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN currency character varying(10) DEFAULT 'usd'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN image_url character varying(512);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'active'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN active boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_listings' AND column_name = 'listing_type'
  ) THEN
    ALTER TABLE IF EXISTS public.business_listings ADD COLUMN listing_type character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'nominated_by_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN nominated_by_user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'nominator_email'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN nominator_email character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN business_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN state character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'phone'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN phone character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'website'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN website character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN owner_name character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'owner_contact'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN owner_contact character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN status character varying(30) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'matched_business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN matched_business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'referral_credited'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN referral_credited boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_nominations' AND column_name = 'black_owned'
  ) THEN
    ALTER TABLE IF EXISTS public.business_nominations ADD COLUMN black_owned boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_notification_prefs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_notification_prefs ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_notification_prefs' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_notification_prefs ADD COLUMN business_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_notification_prefs' AND column_name = 'enabled_types'
  ) THEN
    ALTER TABLE IF EXISTS public.business_notification_prefs ADD COLUMN enabled_types jsonb DEFAULT '["event", "offer", "community", "emergency"]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_notification_prefs' AND column_name = 'frequency'
  ) THEN
    ALTER TABLE IF EXISTS public.business_notification_prefs ADD COLUMN frequency character varying(20) DEFAULT 'immediate'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_notification_prefs' AND column_name = 'paused_until'
  ) THEN
    ALTER TABLE IF EXISTS public.business_notification_prefs ADD COLUMN paused_until timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_notification_prefs' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_notification_prefs ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_notification_prefs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_notification_prefs ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_owner_links' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_owner_links ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_owner_links' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_owner_links ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_owner_links' AND column_name = 'role'
  ) THEN
    ALTER TABLE IF EXISTS public.business_owner_links ADD COLUMN role character varying(20) DEFAULT 'owner'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_owner_links' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.business_owner_links ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_owner_links' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_owner_links ADD COLUMN verified_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_owner_links' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE IF EXISTS public.business_owner_links ADD COLUMN verified_by character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_owner_links' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_owner_links ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_profile_views' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_profile_views ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_profile_views' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_profile_views ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_profile_views' AND column_name = 'viewed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_profile_views ADD COLUMN viewed_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN status character varying DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'target_category'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN target_category character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'target_city'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN target_city character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'target_neighborhood'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN target_neighborhood character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'target_event'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN target_event character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'starts_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN starts_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'ends_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN ends_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN stripe_session_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'price_usd_cents'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN price_usd_cents integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN duration_days integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'campaign_label'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN campaign_label character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_promotions' AND column_name = 'campaign_note'
  ) THEN
    ALTER TABLE IF EXISTS public.business_promotions ADD COLUMN campaign_note character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'recommender_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN recommender_user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'recommender_email'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN recommender_email character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN business_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'website'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN website character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'note'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'business_email'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN business_email character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN email_sent_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'points_awarded'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN points_awarded boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_recommendations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_recommendations ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'token'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN token character varying(64) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'report_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN report_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'report_category'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN report_category character varying(64);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN business_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'business_email'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN business_email character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN status character varying(32) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'response_statement'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN response_statement text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'corrective_actions'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN corrective_actions text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'trust_plan'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN trust_plan text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'disputes_facts'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN disputes_facts boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'dispute_details'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN dispute_details text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN expires_at timestamp with time zone NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'responded_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN responded_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_response_links' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_response_links ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_search_inquiries' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_search_inquiries ADD COLUMN business_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_search_inquiries' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.business_search_inquiries ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_search_inquiries' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.business_search_inquiries ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_search_inquiries' AND column_name = 'handle'
  ) THEN
    ALTER TABLE IF EXISTS public.business_search_inquiries ADD COLUMN handle character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_search_inquiries' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.business_search_inquiries ADD COLUMN category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_search_inquiries' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE IF EXISTS public.business_search_inquiries ADD COLUMN contact_email character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_search_inquiries' AND column_name = 'contact_handle'
  ) THEN
    ALTER TABLE IF EXISTS public.business_search_inquiries ADD COLUMN contact_handle character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_search_inquiries' AND column_name = 'searcher_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_search_inquiries ADD COLUMN searcher_user_id character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_search_inquiries' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.business_search_inquiries ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_search_inquiries' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_search_inquiries ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_skip_feedback' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_skip_feedback ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_skip_feedback' AND column_name = 'submitted_by_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_skip_feedback ADD COLUMN submitted_by_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_skip_feedback' AND column_name = 'message'
  ) THEN
    ALTER TABLE IF EXISTS public.business_skip_feedback ADD COLUMN message text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_skip_feedback' AND column_name = 'was_filtered'
  ) THEN
    ALTER TABLE IF EXISTS public.business_skip_feedback ADD COLUMN was_filtered boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_skip_feedback' AND column_name = 'filtered_reason'
  ) THEN
    ALTER TABLE IF EXISTS public.business_skip_feedback ADD COLUMN filtered_reason text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_skip_feedback' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_skip_feedback ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_stories' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_stories ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_stories' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_stories ADD COLUMN author_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_stories' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE IF EXISTS public.business_stories ADD COLUMN author_name character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_stories' AND column_name = 'content'
  ) THEN
    ALTER TABLE IF EXISTS public.business_stories ADD COLUMN content text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_stories' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE IF EXISTS public.business_stories ADD COLUMN image_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_stories' AND column_name = 'story_type'
  ) THEN
    ALTER TABLE IF EXISTS public.business_stories ADD COLUMN story_type character varying(30) DEFAULT 'update'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_stories' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_stories ADD COLUMN expires_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_stories' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_stories ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_vibe_tags' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_vibe_tags ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_vibe_tags' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.business_vibe_tags ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_vibe_tags' AND column_name = 'vibe'
  ) THEN
    ALTER TABLE IF EXISTS public.business_vibe_tags ADD COLUMN vibe character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'business_vibe_tags' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.business_vibe_tags ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN category character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN subcategory character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'address'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN address character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN state character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'rating'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN rating numeric(3,1) DEFAULT '0'::numeric NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN review_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'verified'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN verified boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'featured'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN featured boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'black_owned'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN black_owned boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN confidence_score integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'safety_rating'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN safety_rating numeric(3,1);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'would_return_alone'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN would_return_alone integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'recommendation_rate'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN recommendation_rate integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN description text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN latitude numeric(10,7) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN longitude numeric(10,7) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'tags'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN tags jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'reviews'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN reviews jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'phone'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN phone character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'website'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN website character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'hours'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN hours character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'price_range'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN price_range character varying(10);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN status character varying(20) DEFAULT 'active'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'submitted_by_id'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN submitted_by_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'ownership_designations'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN ownership_designations jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'verified_designations'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN verified_designations jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN image_url character varying(512);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'photos'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN photos jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'feedback_opt_in'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN feedback_opt_in boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'promoted_until'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN promoted_until timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'current_location_since'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN current_location_since character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'business_founded_date'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN business_founded_date character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'trust_badges'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN trust_badges jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'stripe_connect_account_id'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN stripe_connect_account_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'return_policy'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN return_policy text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'seller_agreement_accepted_at'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN seller_agreement_accepted_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'marketplace_tier'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN marketplace_tier character varying(20) DEFAULT 'free'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'founding_business'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN founding_business boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'founding_number'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN founding_number integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'founding_granted_at'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN founding_granted_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'business_trial_started_at'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN business_trial_started_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'business_status'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN business_status character varying(20) DEFAULT 'community'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'marketplace_fee_locked'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN marketplace_fee_locked boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'locked_fee'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN locked_fee numeric(5,4);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN locked_until timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'fee_source'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN fee_source character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'promotion_eligible'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN promotion_eligible boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'promotion_expiration_date'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN promotion_expiration_date timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'membership_renewal_date'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN membership_renewal_date timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'videos'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN videos jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN instagram character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'tiktok'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN tiktok character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'facebook'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN facebook character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'twitter'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN twitter character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'youtube'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN youtube character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'pending_photos'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN pending_photos jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'pinterest'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN pinterest character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'primary_social_platform'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN primary_social_platform character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'intro_video_url'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN intro_video_url character varying(512);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'weekly_schedule'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN weekly_schedule jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'show_availability'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN show_availability boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'referred_by_code'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN referred_by_code character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'business_tagline'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN business_tagline character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN owner_name character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'owner_bio'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN owner_bio text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'owner_story'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN owner_story text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'diaspora_countries'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN diaspora_countries jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'featured_video_url'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN featured_video_url character varying(512);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'featured_video_title'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN featured_video_title character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'featured_video_purpose'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN featured_video_purpose character varying(60);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'flag_count'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN flag_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'flag_status'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN flag_status character varying(20) DEFAULT 'none'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN target_audience jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'hidden_gem_label'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN hidden_gem_label character varying(60);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'hidden_gem_category'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN hidden_gem_category character varying(60);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'hidden_gem_tagline'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN hidden_gem_tagline character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'hidden_gem_since'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN hidden_gem_since timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'hidden_gem_expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN hidden_gem_expires_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'hidden_gem_nominations'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN hidden_gem_nominations integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'vibes'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN vibes jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'is_reference_only'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN is_reference_only boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'reference_category'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN reference_category character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'profile_status'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN profile_status character varying(30) DEFAULT 'community_listed'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'community_audience_type'
  ) THEN
    ALTER TABLE IF EXISTS public.businesses ADD COLUMN community_audience_type character varying(30) DEFAULT 'unknown'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'category_waitlist' AND column_name = 'parent_category'
  ) THEN
    ALTER TABLE IF EXISTS public.category_waitlist ADD COLUMN parent_category text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'category_waitlist' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE IF EXISTS public.category_waitlist ADD COLUMN subcategory text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'category_waitlist' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.category_waitlist ADD COLUMN business_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'category_waitlist' AND column_name = 'email'
  ) THEN
    ALTER TABLE IF EXISTS public.category_waitlist ADD COLUMN email text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'category_waitlist' AND column_name = 'phone'
  ) THEN
    ALTER TABLE IF EXISTS public.category_waitlist ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'category_waitlist' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.category_waitlist ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'category_waitlist' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.category_waitlist ADD COLUMN state text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'category_waitlist' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.category_waitlist ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN business_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN business_name text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'business_city'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN business_city character varying(80);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'business_category'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN business_category character varying(80);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'challenge_id'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN challenge_id character varying(60) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'challenge_name'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN challenge_name text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN owner_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'owner_email'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN owner_email text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'message'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN message text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN reviewed_by character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN reviewed_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_applications' AND column_name = 'applied_at'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_applications ADD COLUMN applied_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_progress' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_progress ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_progress' AND column_name = 'challenge_id'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_progress ADD COLUMN challenge_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_progress' AND column_name = 'progress'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_progress ADD COLUMN progress integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_progress' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_progress ADD COLUMN completed_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_progress' AND column_name = 'points_awarded'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_progress ADD COLUMN points_awarded boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_progress' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.challenge_progress ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'channel_follows' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.channel_follows ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'channel_follows' AND column_name = 'channel_slug'
  ) THEN
    ALTER TABLE IF EXISTS public.channel_follows ADD COLUMN channel_slug character varying(80) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'channel_follows' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.channel_follows ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'check_ins' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.check_ins ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'check_ins' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.check_ins ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'check_ins' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.check_ins ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'check_ins' AND column_name = 'user_lat'
  ) THEN
    ALTER TABLE IF EXISTS public.check_ins ADD COLUMN user_lat numeric(10,7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'check_ins' AND column_name = 'user_lng'
  ) THEN
    ALTER TABLE IF EXISTS public.check_ins ADD COLUMN user_lng numeric(10,7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'check_ins' AND column_name = 'verified_location'
  ) THEN
    ALTER TABLE IF EXISTS public.check_ins ADD COLUMN verified_location boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_adventures' AND column_name = 'circle_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_adventures ADD COLUMN circle_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_adventures' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_adventures ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_adventures' AND column_name = 'adventure_date'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_adventures ADD COLUMN adventure_date text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_adventures' AND column_name = 'places'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_adventures ADD COLUMN places jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_adventures' AND column_name = 'note'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_adventures ADD COLUMN note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_adventures' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_adventures ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_important_dates' AND column_name = 'circle_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_important_dates ADD COLUMN circle_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_important_dates' AND column_name = 'added_by_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_important_dates ADD COLUMN added_by_user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_important_dates' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_important_dates ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_important_dates' AND column_name = 'date_type'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_important_dates ADD COLUMN date_type text DEFAULT 'event'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_important_dates' AND column_name = 'target_date'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_important_dates ADD COLUMN target_date text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_important_dates' AND column_name = 'target_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_important_dates ADD COLUMN target_user_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_important_dates' AND column_name = 'target_user_name'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_important_dates ADD COLUMN target_user_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_important_dates' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_important_dates ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_important_dates' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_important_dates ADD COLUMN is_recurring boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_important_dates' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_important_dates ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_members' AND column_name = 'circle_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_members ADD COLUMN circle_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_members' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_members ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_members ADD COLUMN role text DEFAULT 'member'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_members' AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_members ADD COLUMN joined_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'circle_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN circle_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'sender_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN sender_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'sender_name'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN sender_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'target_member_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN target_member_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'nudge_type'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN nudge_type text DEFAULT 'check_this_out'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN business_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN business_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'suggestion_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN suggestion_id integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'message'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN message text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'read_by_user_ids'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN read_by_user_ids text[] DEFAULT '{}'::text[] NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_nudges' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_nudges ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'circle_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN circle_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN created_by text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'plan_date'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN plan_date text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'vibe'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN vibe text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'budget'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN budget text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'availability_windows'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN availability_windows jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'itinerary'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN itinerary jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN status text DEFAULT 'draft'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'in_count'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN in_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'maybe_count'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN maybe_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'out_count'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN out_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'curator_mode'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN curator_mode text DEFAULT 'votes'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_plans' AND column_name = 'curator_member_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_plans ADD COLUMN curator_member_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_suggestions' AND column_name = 'circle_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_suggestions ADD COLUMN circle_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_suggestions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_suggestions ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_suggestions' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_suggestions ADD COLUMN business_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_suggestions' AND column_name = 'place_name'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_suggestions ADD COLUMN place_name text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_suggestions' AND column_name = 'place_type'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_suggestions ADD COLUMN place_type text DEFAULT 'activity'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_suggestions' AND column_name = 'note'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_suggestions ADD COLUMN note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_suggestions' AND column_name = 'upvotes'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_suggestions ADD COLUMN upvotes integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_suggestions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_suggestions ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_votes' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_votes ADD COLUMN plan_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_votes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_votes ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_votes' AND column_name = 'vote'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_votes ADD COLUMN vote text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'circle_votes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.circle_votes ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN state character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'slug'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN slug character varying(120) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN tagline text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'hero_image_url'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN hero_image_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'tour_visited_at'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN tour_visited_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN status character varying(20) DEFAULT 'upcoming'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'contribution_count'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN contribution_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'nomination_count'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN nomination_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN is_published boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'city_archives' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.city_archives ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_follows' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_follows ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_follows' AND column_name = 'collection_id'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_follows ADD COLUMN collection_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_follows' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_follows ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_items' AND column_name = 'collection_id'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_items ADD COLUMN collection_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_items' AND column_name = 'item_type'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_items ADD COLUMN item_type character varying(30) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_items' AND column_name = 'item_id'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_items ADD COLUMN item_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_items' AND column_name = 'item_name'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_items ADD COLUMN item_name character varying(300);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_items' AND column_name = 'item_emoji'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_items ADD COLUMN item_emoji character varying(10);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_items' AND column_name = 'note'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_items ADD COLUMN note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_items' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_items ADD COLUMN display_order integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collection_items' AND column_name = 'added_at'
  ) THEN
    ALTER TABLE IF EXISTS public.collection_items ADD COLUMN added_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.collections ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.collections ADD COLUMN title character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.collections ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'cover_emoji'
  ) THEN
    ALTER TABLE IF EXISTS public.collections ADD COLUMN cover_emoji character varying(10) DEFAULT '📌'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE IF EXISTS public.collections ADD COLUMN topic_id character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE IF EXISTS public.collections ADD COLUMN is_public boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'follow_count'
  ) THEN
    ALTER TABLE IF EXISTS public.collections ADD COLUMN follow_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'item_count'
  ) THEN
    ALTER TABLE IF EXISTS public.collections ADD COLUMN item_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.collections ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.collections ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_alerts' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_alerts ADD COLUMN type character varying(30) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_alerts' AND column_name = 'lat'
  ) THEN
    ALTER TABLE IF EXISTS public.community_alerts ADD COLUMN lat numeric(10,7) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_alerts' AND column_name = 'lng'
  ) THEN
    ALTER TABLE IF EXISTS public.community_alerts ADD COLUMN lng numeric(10,7) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_alerts' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.community_alerts ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_alerts' AND column_name = 'reported_by'
  ) THEN
    ALTER TABLE IF EXISTS public.community_alerts ADD COLUMN reported_by character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_alerts' AND column_name = 'confirmed_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_alerts ADD COLUMN confirmed_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_alerts' AND column_name = 'cleared_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_alerts ADD COLUMN cleared_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_alerts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE IF EXISTS public.community_alerts ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_alerts' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_alerts ADD COLUMN expires_at timestamp without time zone NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_alerts' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_alerts ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'review_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN review_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN business_name character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'share_preference'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN share_preference character varying(20) DEFAULT 'private'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'recognition_tags'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN recognition_tags text[] DEFAULT ARRAY[]::text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'encouragement_tags'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN encouragement_tags text[] DEFAULT ARRAY[]::text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'comment_option'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN comment_option character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'review_text'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN review_text text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'appreciation_note'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN appreciation_note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN author_name character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'sent_to_business'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN sent_to_business boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_appreciations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_appreciations ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_boundaries' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_boundaries ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_boundaries' AND column_name = 'target_type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_boundaries ADD COLUMN target_type character varying(20) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_boundaries' AND column_name = 'target_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_boundaries ADD COLUMN target_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_boundaries' AND column_name = 'target_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_boundaries ADD COLUMN target_name character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_boundaries' AND column_name = 'boundary_types'
  ) THEN
    ALTER TABLE IF EXISTS public.community_boundaries ADD COLUMN boundary_types jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_boundaries' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.community_boundaries ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_boundaries' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_boundaries ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN description text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'icon'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN icon character varying(10) DEFAULT '🏆'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'challenge_type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN challenge_type character varying(60) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'target_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN target_count integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'points_reward'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN points_reward integer DEFAULT 50 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN start_date timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN end_date timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'completion_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN completion_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_challenges' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_challenges ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_list_items' AND column_name = 'list_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_list_items ADD COLUMN list_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_list_items' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_list_items ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_list_items' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_list_items ADD COLUMN business_name text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_list_items' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.community_list_items ADD COLUMN city character varying(80);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_list_items' AND column_name = 'note'
  ) THEN
    ALTER TABLE IF EXISTS public.community_list_items ADD COLUMN note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_list_items' AND column_name = 'added_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_list_items ADD COLUMN added_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN type public.listing_type NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'price'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN price character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'price_type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN price_type character varying(20) DEFAULT 'fixed'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'condition'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN condition public.listing_condition;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'tags'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN tags text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN zip_code character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'is_remote'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN is_remote boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'contact_preference'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN contact_preference character varying(30) DEFAULT 'app_message'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN contact_info character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN status public.listing_status DEFAULT 'active'::public.listing_status NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN view_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'saved_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN saved_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'report_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN report_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN expires_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'external_url'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN external_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'photos'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN photos text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_listings' AND column_name = 'seller_display_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_listings ADD COLUMN seller_display_name character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_lists' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_lists ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_lists' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.community_lists ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_lists' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.community_lists ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_lists' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.community_lists ADD COLUMN category character varying(60);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_lists' AND column_name = 'cover_emoji'
  ) THEN
    ALTER TABLE IF EXISTS public.community_lists ADD COLUMN cover_emoji text DEFAULT '📍'::text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_lists' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE IF EXISTS public.community_lists ADD COLUMN is_public boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_lists' AND column_name = 'saved_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_lists ADD COLUMN saved_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_lists' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_lists ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN name character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'venue_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN venue_name character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN category character varying(50) DEFAULT 'general'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN state character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'country'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN country character varying(100) DEFAULT 'United States'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'lat'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN lat numeric(10,7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'lng'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN lng numeric(10,7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'post_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN post_count integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'positive_post_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN positive_post_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'community_rating'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN community_rating numeric(3,1) DEFAULT '0'::numeric;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'added_by_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN added_by_user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN is_verified boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_places' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_places ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_post_comments' AND column_name = 'post_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_post_comments ADD COLUMN post_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_post_comments' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_post_comments ADD COLUMN author_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_post_comments' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_post_comments ADD COLUMN author_name character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_post_comments' AND column_name = 'author_initials'
  ) THEN
    ALTER TABLE IF EXISTS public.community_post_comments ADD COLUMN author_initials character varying(4) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_post_comments' AND column_name = 'author_color'
  ) THEN
    ALTER TABLE IF EXISTS public.community_post_comments ADD COLUMN author_color character varying(20) DEFAULT '#3B1F0E'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_post_comments' AND column_name = 'content'
  ) THEN
    ALTER TABLE IF EXISTS public.community_post_comments ADD COLUMN content text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_post_comments' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_post_comments ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN author_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN author_name character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'author_initials'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN author_initials character varying(4) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'author_color'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN author_color character varying(20) DEFAULT '#3B1F0E'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'content'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN content text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN category character varying(50) DEFAULT 'general'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'upvotes'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN upvotes integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'downvotes'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN downvotes integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'post_type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN post_type character varying(30) DEFAULT 'community'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN business_name character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'business_link'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN business_link text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN media_urls text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'saved_place_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN saved_place_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN comments_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN visibility character varying(20) DEFAULT 'public'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'location_tag'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN location_tag character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'location_type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN location_type character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'topic_tag'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN topic_tag character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'is_private_topic'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN is_private_topic boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'has_content_warning'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN has_content_warning boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'content_warning_type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN content_warning_type character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'link_url'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN link_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'link_title'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN link_title text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'link_description'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN link_description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'link_domain'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN link_domain character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'link_favicon'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN link_favicon character varying(10);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'repost_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN repost_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'repost_author_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN repost_author_name character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'repost_author_initials'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN repost_author_initials character varying(4);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'repost_content'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN repost_content text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'audience_rating'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN audience_rating character varying(20) DEFAULT 'everyone'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'rating_reason'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN rating_reason character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'mentioned_business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN mentioned_business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'mentioned_business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN mentioned_business_name character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'mentioned_business_tag'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN mentioned_business_tag character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'mentioned_business_rating'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN mentioned_business_rating integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'requires_moderation'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN requires_moderation boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'is_trusted_author'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN is_trusted_author boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN thread_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'thread_position'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN thread_position integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'thread_total'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN thread_total integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'location_venue_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN location_venue_name character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'location_city'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN location_city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'location_country'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN location_country character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'location_lat'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN location_lat numeric(10,7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'location_lng'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN location_lng numeric(10,7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'location_place_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN location_place_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_posts' AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE IF EXISTS public.community_posts ADD COLUMN hashtags text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_requests' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_requests ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_requests' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.community_requests ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_requests' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.community_requests ADD COLUMN category character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_requests' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.community_requests ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_requests' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.community_requests ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_requests' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.community_requests ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_requests' AND column_name = 'upvotes'
  ) THEN
    ALTER TABLE IF EXISTS public.community_requests ADD COLUMN upvotes integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_requests' AND column_name = 'helper_count'
  ) THEN
    ALTER TABLE IF EXISTS public.community_requests ADD COLUMN helper_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_requests' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.community_requests ADD COLUMN status character varying(30) DEFAULT 'open'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_requests' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_requests ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_says' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_says ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_says' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_says ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_says' AND column_name = 'tag'
  ) THEN
    ALTER TABLE IF EXISTS public.community_says ADD COLUMN tag character varying(60) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_says' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_says ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_signals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_signals ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_signals' AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_signals ADD COLUMN entity_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_signals' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_signals ADD COLUMN entity_type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_signals' AND column_name = 'signal_type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_signals ADD COLUMN signal_type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_signals' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.community_signals ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_signals' AND column_name = 'journey_type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_signals ADD COLUMN journey_type character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_signals' AND column_name = 'context'
  ) THEN
    ALTER TABLE IF EXISTS public.community_signals ADD COLUMN context jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_signals' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_signals ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'posted_by_id'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN posted_by_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'posted_by_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN posted_by_name character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN title character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'address'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN address character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN neighborhood character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'space_type'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN space_type character varying(30) DEFAULT 'rent'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'price_label'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN price_label character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'sqft'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN sqft integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'listing_url'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN listing_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'agent_name'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN agent_name character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'agent_phone'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN agent_phone character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'agent_email'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN agent_email character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'agent_url'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN agent_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN is_available boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_space_listings' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE IF EXISTS public.community_space_listings ADD COLUMN zip_code character varying(10);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_messages' AND column_name = 'form_type'
  ) THEN
    ALTER TABLE IF EXISTS public.contact_messages ADD COLUMN form_type character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_messages' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.contact_messages ADD COLUMN name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_messages' AND column_name = 'email'
  ) THEN
    ALTER TABLE IF EXISTS public.contact_messages ADD COLUMN email character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_messages' AND column_name = 'subject'
  ) THEN
    ALTER TABLE IF EXISTS public.contact_messages ADD COLUMN subject character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_messages' AND column_name = 'message'
  ) THEN
    ALTER TABLE IF EXISTS public.contact_messages ADD COLUMN message text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_messages' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.contact_messages ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_filter_violations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.content_filter_violations ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_filter_violations' AND column_name = 'channel'
  ) THEN
    ALTER TABLE IF EXISTS public.content_filter_violations ADD COLUMN channel character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_filter_violations' AND column_name = 'content_snippet'
  ) THEN
    ALTER TABLE IF EXISTS public.content_filter_violations ADD COLUMN content_snippet text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_filter_violations' AND column_name = 'matched_keywords'
  ) THEN
    ALTER TABLE IF EXISTS public.content_filter_violations ADD COLUMN matched_keywords text[] DEFAULT '{}'::text[] NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_filter_violations' AND column_name = 'was_blocked'
  ) THEN
    ALTER TABLE IF EXISTS public.content_filter_violations ADD COLUMN was_blocked boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_filter_violations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.content_filter_violations ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_reports' AND column_name = 'reporter_id'
  ) THEN
    ALTER TABLE IF EXISTS public.content_reports ADD COLUMN reporter_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_reports' AND column_name = 'target_type'
  ) THEN
    ALTER TABLE IF EXISTS public.content_reports ADD COLUMN target_type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_reports' AND column_name = 'target_id'
  ) THEN
    ALTER TABLE IF EXISTS public.content_reports ADD COLUMN target_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_reports' AND column_name = 'reason'
  ) THEN
    ALTER TABLE IF EXISTS public.content_reports ADD COLUMN reason character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_reports' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.content_reports ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_reports' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.content_reports ADD COLUMN status character varying DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_reports' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.content_reports ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.conversations ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.conversations ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'participant_ids'
  ) THEN
    ALTER TABLE IF EXISTS public.conversations ADD COLUMN participant_ids jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.conversations ADD COLUMN business_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE IF EXISTS public.conversations ADD COLUMN last_message_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'last_message_preview'
  ) THEN
    ALTER TABLE IF EXISTS public.conversations ADD COLUMN last_message_preview text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.conversations ADD COLUMN type character varying DEFAULT 'business'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'request_status'
  ) THEN
    ALTER TABLE IF EXISTS public.conversations ADD COLUMN request_status character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'requested_by'
  ) THEN
    ALTER TABLE IF EXISTS public.conversations ADD COLUMN requested_by text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN bio text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'categories'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN categories jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'platforms'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN platforms jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'primary_platform'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN primary_platform character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN is_public boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'is_premier'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN is_premier boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'creator_profiles' AND column_name = 'covered_locations'
  ) THEN
    ALTER TABLE IF EXISTS public.creator_profiles ADD COLUMN covered_locations jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN description text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN category character varying(100) DEFAULT 'Heritage'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN state character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'address'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN address character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN latitude numeric(10,7) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN longitude numeric(10,7) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'era'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN era character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'significance'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN significance text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN image_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'external_url'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN external_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN is_verified boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'heritage_category'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN heritage_category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN subcategory character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'ethnic_community'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN ethnic_community character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'year_established'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN year_established integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'is_accessible'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN is_accessible boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'is_family_friendly'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN is_family_friendly boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'admission_free'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN admission_free boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'audio_guide'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN audio_guide boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'verified_source'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN verified_source character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cultural_sites' AND column_name = 'country'
  ) THEN
    ALTER TABLE IF EXISTS public.cultural_sites ADD COLUMN country character varying(100) DEFAULT 'United States'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'docusign_envelopes' AND column_name = 'envelope_id'
  ) THEN
    ALTER TABLE IF EXISTS public.docusign_envelopes ADD COLUMN envelope_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'docusign_envelopes' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.docusign_envelopes ADD COLUMN business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'docusign_envelopes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.docusign_envelopes ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'docusign_envelopes' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.docusign_envelopes ADD COLUMN type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'docusign_envelopes' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.docusign_envelopes ADD COLUMN status character varying(50) DEFAULT 'sent'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'docusign_envelopes' AND column_name = 'signer_email'
  ) THEN
    ALTER TABLE IF EXISTS public.docusign_envelopes ADD COLUMN signer_email character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'docusign_envelopes' AND column_name = 'signer_name'
  ) THEN
    ALTER TABLE IF EXISTS public.docusign_envelopes ADD COLUMN signer_name character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'docusign_envelopes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.docusign_envelopes ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'docusign_envelopes' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.docusign_envelopes ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entity_connections' AND column_name = 'from_id'
  ) THEN
    ALTER TABLE IF EXISTS public.entity_connections ADD COLUMN from_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entity_connections' AND column_name = 'from_type'
  ) THEN
    ALTER TABLE IF EXISTS public.entity_connections ADD COLUMN from_type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entity_connections' AND column_name = 'to_id'
  ) THEN
    ALTER TABLE IF EXISTS public.entity_connections ADD COLUMN to_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entity_connections' AND column_name = 'to_type'
  ) THEN
    ALTER TABLE IF EXISTS public.entity_connections ADD COLUMN to_type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entity_connections' AND column_name = 'connection_type'
  ) THEN
    ALTER TABLE IF EXISTS public.entity_connections ADD COLUMN connection_type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entity_connections' AND column_name = 'strength'
  ) THEN
    ALTER TABLE IF EXISTS public.entity_connections ADD COLUMN strength integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entity_connections' AND column_name = 'label'
  ) THEN
    ALTER TABLE IF EXISTS public.entity_connections ADD COLUMN label character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'entity_connections' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.entity_connections ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_rsvps' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.event_rsvps ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_rsvps' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE IF EXISTS public.event_rsvps ADD COLUMN event_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_rsvps' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.event_rsvps ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN title character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN description text DEFAULT ''::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'date'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN date character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'date_short'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN date_short character varying(20) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'time'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN "time" character varying(100) DEFAULT ''::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'location'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN location character varying(255) DEFAULT ''::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN state character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN category character varying(100) DEFAULT 'Cultural'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'attendees'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN attendees integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'organizer'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN organizer character varying(255) DEFAULT ''::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'price'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN price character varying(50) DEFAULT 'Free'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'is_free'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN is_free boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN latitude numeric(10,7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN longitude numeric(10,7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'featured'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN featured boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN status character varying(20) DEFAULT 'active'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'created_by_id'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN created_by_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'audience_rating'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN audience_rating character varying(20) DEFAULT 'everyone'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'rating_reason'
  ) THEN
    ALTER TABLE IF EXISTS public.events ADD COLUMN rating_reason character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_follows' AND column_name = 'follower_id'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_follows ADD COLUMN follower_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_follows' AND column_name = 'expert_id'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_follows ADD COLUMN expert_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_follows' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_follows ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN display_name character varying(150) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'specialty'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN specialty character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'badge'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN badge character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN bio text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'credentials'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN credentials character varying(300);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN avatar_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN location character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN verification_status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'follow_count'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN follow_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'article_count'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN article_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expert_profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.expert_profiles ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'institution_name'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN institution_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'institution_type'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN institution_type character varying(50) DEFAULT 'other'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'institution_url'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN institution_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'reference_type'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN reference_type character varying(50) DEFAULT 'direct'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN reference_id character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'source'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN source character varying(50) DEFAULT 'unknown'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'is_safety_related'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN is_safety_related boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN user_id character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'external_click_events' AND column_name = 'clicked_at'
  ) THEN
    ALTER TABLE IF EXISTS public.external_click_events ADD COLUMN clicked_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_add_on_seats' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE IF EXISTS public.family_add_on_seats ADD COLUMN owner_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_add_on_seats' AND column_name = 'stripe_subscription_item_id'
  ) THEN
    ALTER TABLE IF EXISTS public.family_add_on_seats ADD COLUMN stripe_subscription_item_id character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_add_on_seats' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE IF EXISTS public.family_add_on_seats ADD COLUMN stripe_customer_id character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_add_on_seats' AND column_name = 'seat_count'
  ) THEN
    ALTER TABLE IF EXISTS public.family_add_on_seats ADD COLUMN seat_count integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_add_on_seats' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.family_add_on_seats ADD COLUMN status character varying(30) DEFAULT 'active'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_add_on_seats' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.family_add_on_seats ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_add_on_seats' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.family_add_on_seats ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_ai_usage' AND column_name = 'circle_id'
  ) THEN
    ALTER TABLE IF EXISTS public.family_ai_usage ADD COLUMN circle_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_ai_usage' AND column_name = 'year_month'
  ) THEN
    ALTER TABLE IF EXISTS public.family_ai_usage ADD COLUMN year_month character varying(7) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_ai_usage' AND column_name = 'requests_used'
  ) THEN
    ALTER TABLE IF EXISTS public.family_ai_usage ADD COLUMN requests_used integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_ai_usage' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.family_ai_usage ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circle_members' AND column_name = 'circle_id'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circle_members ADD COLUMN circle_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circle_members' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circle_members ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circle_members' AND column_name = 'invite_email'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circle_members ADD COLUMN invite_email character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circle_members' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circle_members ADD COLUMN display_name character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circle_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circle_members ADD COLUMN role character varying DEFAULT 'member'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circle_members' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circle_members ADD COLUMN status character varying DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circle_members' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circle_members ADD COLUMN permissions jsonb DEFAULT '{"canViewTrips": false, "safetyAlerts": true, "contentFilter": "none", "shareLocation": false, "emergencyContact": false, "messagingEnabled": true, "sosNotifications": true, "approveFriendRequests": false}'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circle_members' AND column_name = 'invited_at'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circle_members ADD COLUMN invited_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circle_members' AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circle_members ADD COLUMN joined_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circles' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circles ADD COLUMN name character varying(100) DEFAULT 'My Family'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circles' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circles ADD COLUMN owner_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circles' AND column_name = 'invite_code'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circles ADD COLUMN invite_code character varying(12) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circles ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_circles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.family_circles ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_settings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.family_settings ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_settings' AND column_name = 'allow_everyone'
  ) THEN
    ALTER TABLE IF EXISTS public.family_settings ADD COLUMN allow_everyone boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_settings' AND column_name = 'allow_teen'
  ) THEN
    ALTER TABLE IF EXISTS public.family_settings ADD COLUMN allow_teen boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_settings' AND column_name = 'allow_young_adult'
  ) THEN
    ALTER TABLE IF EXISTS public.family_settings ADD COLUMN allow_young_adult boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_settings' AND column_name = 'allow_adult'
  ) THEN
    ALTER TABLE IF EXISTS public.family_settings ADD COLUMN allow_adult boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_settings' AND column_name = 'family_mode_enabled'
  ) THEN
    ALTER TABLE IF EXISTS public.family_settings ADD COLUMN family_mode_enabled boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'family_settings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.family_settings ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_checkins' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_checkins ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_checkins' AND column_name = 'goal_id'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_checkins ADD COLUMN goal_id uuid;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_checkins' AND column_name = 'amount'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_checkins ADD COLUMN amount numeric(12,2) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_checkins' AND column_name = 'note'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_checkins ADD COLUMN note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_checkins' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_checkins ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN type public.financial_goal_type NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'target_amount'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN target_amount numeric(12,2) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'current_amount'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN current_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'currency'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN currency character varying(3) DEFAULT 'USD'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN deadline date;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'is_achieved'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN is_achieved boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN is_private boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'motivation_note'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN motivation_note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'milestones'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN milestones jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_goals' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.financial_goals ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'officer_name'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN officer_name character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'badge_number'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN badge_number character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'department'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN department character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN state character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'offense_type'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN offense_type character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'offense_description'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN offense_description text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'offense_date'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN offense_date character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN source_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN status character varying DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'submitted_by'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN submitted_by character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flagged_officers' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.flagged_officers ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flash_deals' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.flash_deals ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flash_deals' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE IF EXISTS public.flash_deals ADD COLUMN created_by character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flash_deals' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.flash_deals ADD COLUMN title character varying(120) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flash_deals' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.flash_deals ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flash_deals' AND column_name = 'discount_text'
  ) THEN
    ALTER TABLE IF EXISTS public.flash_deals ADD COLUMN discount_text character varying(60);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flash_deals' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.flash_deals ADD COLUMN expires_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flash_deals' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE IF EXISTS public.flash_deals ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'flash_deals' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.flash_deals ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'country'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN country character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN business_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'website'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN website character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'social_media'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN social_media character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN type character varying(50) DEFAULT 'other'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'reason'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN reason text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'personal_connection'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN personal_connection text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'communities'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN communities jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'badge'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN badge character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'global_recommendations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.global_recommendations ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_invites' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE IF EXISTS public.group_invites ADD COLUMN group_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_invites' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE IF EXISTS public.group_invites ADD COLUMN invited_by text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_invites' AND column_name = 'invited_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.group_invites ADD COLUMN invited_user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_invites' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.group_invites ADD COLUMN status text DEFAULT 'pending'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_invites' AND column_name = 'message'
  ) THEN
    ALTER TABLE IF EXISTS public.group_invites ADD COLUMN message text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_invites' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.group_invites ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_invites' AND column_name = 'responded_at'
  ) THEN
    ALTER TABLE IF EXISTS public.group_invites ADD COLUMN responded_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_itineraries' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE IF EXISTS public.group_itineraries ADD COLUMN group_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_itineraries' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.group_itineraries ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_itineraries' AND column_name = 'destination'
  ) THEN
    ALTER TABLE IF EXISTS public.group_itineraries ADD COLUMN destination text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_itineraries' AND column_name = 'content'
  ) THEN
    ALTER TABLE IF EXISTS public.group_itineraries ADD COLUMN content jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_itineraries' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE IF EXISTS public.group_itineraries ADD COLUMN created_by text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_itineraries' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.group_itineraries ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE IF EXISTS public.group_members ADD COLUMN group_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.group_members ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE IF EXISTS public.group_members ADD COLUMN role text DEFAULT 'member'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE IF EXISTS public.group_members ADD COLUMN joined_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_reports' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE IF EXISTS public.group_reports ADD COLUMN group_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_reports' AND column_name = 'reported_by'
  ) THEN
    ALTER TABLE IF EXISTS public.group_reports ADD COLUMN reported_by text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_reports' AND column_name = 'target_type'
  ) THEN
    ALTER TABLE IF EXISTS public.group_reports ADD COLUMN target_type text DEFAULT 'group'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_reports' AND column_name = 'target_id'
  ) THEN
    ALTER TABLE IF EXISTS public.group_reports ADD COLUMN target_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_reports' AND column_name = 'reason'
  ) THEN
    ALTER TABLE IF EXISTS public.group_reports ADD COLUMN reason text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_reports' AND column_name = 'details'
  ) THEN
    ALTER TABLE IF EXISTS public.group_reports ADD COLUMN details text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_reports' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.group_reports ADD COLUMN status text DEFAULT 'pending'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_reports' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.group_reports ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_suggestions' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE IF EXISTS public.group_suggestions ADD COLUMN group_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_suggestions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.group_suggestions ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_suggestions' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.group_suggestions ADD COLUMN type text DEFAULT 'location'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_suggestions' AND column_name = 'value'
  ) THEN
    ALTER TABLE IF EXISTS public.group_suggestions ADD COLUMN value text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_suggestions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.group_suggestions ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_suggestions' AND column_name = 'upvotes'
  ) THEN
    ALTER TABLE IF EXISTS public.group_suggestions ADD COLUMN upvotes integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'group_suggestions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.group_suggestions ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN name text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN category text DEFAULT 'general'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'member_count'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN member_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN is_private boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN created_by text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN state text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN image_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'max_members'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN max_members integer DEFAULT 8 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'is_age_restricted'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN is_age_restricted boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'audience_preferences'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN audience_preferences jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'rules'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN rules jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'profanity_level'
  ) THEN
    ALTER TABLE IF EXISTS public.groups ADD COLUMN profanity_level text DEFAULT 'moderate'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_follows' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_follows ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_follows' AND column_name = 'guide_id'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_follows ADD COLUMN guide_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_follows' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_follows ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_items' AND column_name = 'guide_id'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_items ADD COLUMN guide_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_items' AND column_name = 'section_id'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_items ADD COLUMN section_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_items' AND column_name = 'item_type'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_items ADD COLUMN item_type character varying(30) DEFAULT 'tip'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_items' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_items ADD COLUMN business_id character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_items' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_items ADD COLUMN title character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_items' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_items ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_items' AND column_name = 'external_url'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_items ADD COLUMN external_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_items' AND column_name = 'external_label'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_items ADD COLUMN external_label character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_items' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_items ADD COLUMN display_order integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_items' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_items ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_sections' AND column_name = 'guide_id'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_sections ADD COLUMN guide_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_sections' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_sections ADD COLUMN title character varying(150) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_sections' AND column_name = 'section_emoji'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_sections ADD COLUMN section_emoji character varying(10) DEFAULT '📌'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_sections' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_sections ADD COLUMN display_order integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guide_sections' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.guide_sections ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN title character varying(300) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'summary'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN summary text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN category character varying(50) DEFAULT 'other'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN source_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'submitted_by'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN submitted_by character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'submitter_name'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN submitter_name character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'confirm_count'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN confirm_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'is_admin_post'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN is_admin_post boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'admin_note'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN admin_note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'happening_now_stories' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.happening_now_stories ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hashtags' AND column_name = 'tag'
  ) THEN
    ALTER TABLE IF EXISTS public.hashtags ADD COLUMN tag character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hashtags' AND column_name = 'post_count'
  ) THEN
    ALTER TABLE IF EXISTS public.hashtags ADD COLUMN post_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hashtags' AND column_name = 'weekly_post_count'
  ) THEN
    ALTER TABLE IF EXISTS public.hashtags ADD COLUMN weekly_post_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hashtags' AND column_name = 'last_post_at'
  ) THEN
    ALTER TABLE IF EXISTS public.hashtags ADD COLUMN last_post_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hashtags' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.hashtags ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_post_likes' AND column_name = 'post_id'
  ) THEN
    ALTER TABLE IF EXISTS public.health_post_likes ADD COLUMN post_id uuid NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_post_likes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.health_post_likes ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_post_likes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.health_post_likes ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_posts' AND column_name = 'physician_id'
  ) THEN
    ALTER TABLE IF EXISTS public.health_posts ADD COLUMN physician_id uuid NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_posts' AND column_name = 'author_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.health_posts ADD COLUMN author_user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_posts' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.health_posts ADD COLUMN title character varying(300) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_posts' AND column_name = 'summary'
  ) THEN
    ALTER TABLE IF EXISTS public.health_posts ADD COLUMN summary text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_posts' AND column_name = 'url'
  ) THEN
    ALTER TABLE IF EXISTS public.health_posts ADD COLUMN url character varying(2000) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_posts' AND column_name = 'source'
  ) THEN
    ALTER TABLE IF EXISTS public.health_posts ADD COLUMN source character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_posts' AND column_name = 'topic_ids'
  ) THEN
    ALTER TABLE IF EXISTS public.health_posts ADD COLUMN topic_ids jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_posts' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE IF EXISTS public.health_posts ADD COLUMN like_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_posts' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.health_posts ADD COLUMN status character varying(20) DEFAULT 'active'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'health_posts' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.health_posts ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'help_offers' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE IF EXISTS public.help_offers ADD COLUMN request_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'help_offers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.help_offers ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'help_offers' AND column_name = 'offer_types'
  ) THEN
    ALTER TABLE IF EXISTS public.help_offers ADD COLUMN offer_types json DEFAULT '[]'::json NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'help_offers' AND column_name = 'message'
  ) THEN
    ALTER TABLE IF EXISTS public.help_offers ADD COLUMN message text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'help_offers' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.help_offers ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_stories' AND column_name = 'site_id'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_stories ADD COLUMN site_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_stories' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_stories ADD COLUMN user_id character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_stories' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_stories ADD COLUMN author_name character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_stories' AND column_name = 'relationship_type'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_stories ADD COLUMN relationship_type character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_stories' AND column_name = 'content'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_stories ADD COLUMN content text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_stories' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_stories ADD COLUMN video_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_stories' AND column_name = 'tags'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_stories ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_stories' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_stories ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_stories' AND column_name = 'is_ambassador'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_stories ADD COLUMN is_ambassador boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_stories' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_stories ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_support_links' AND column_name = 'site_id'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_support_links ADD COLUMN site_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_support_links' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_support_links ADD COLUMN title character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_support_links' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_support_links ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_support_links' AND column_name = 'url'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_support_links ADD COLUMN url character varying(500) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_support_links' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_support_links ADD COLUMN category character varying(50) DEFAULT 'giving'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_support_links' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_support_links ADD COLUMN is_verified boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_support_links' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_support_links ADD COLUMN display_order integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heritage_support_links' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.heritage_support_links ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hidden_gem_nominations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.hidden_gem_nominations ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hidden_gem_nominations' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.hidden_gem_nominations ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hidden_gem_nominations' AND column_name = 'reason'
  ) THEN
    ALTER TABLE IF EXISTS public.hidden_gem_nominations ADD COLUMN reason character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hidden_gem_nominations' AND column_name = 'comment'
  ) THEN
    ALTER TABLE IF EXISTS public.hidden_gem_nominations ADD COLUMN comment text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hidden_gem_nominations' AND column_name = 'audience_types'
  ) THEN
    ALTER TABLE IF EXISTS public.hidden_gem_nominations ADD COLUMN audience_types text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hidden_gem_nominations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.hidden_gem_nominations ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'identity_verifications' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.identity_verifications ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'identity_verifications' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.identity_verifications ADD COLUMN status character varying DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'identity_verifications' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE IF EXISTS public.identity_verifications ADD COLUMN admin_notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'identity_verifications' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE IF EXISTS public.identity_verifications ADD COLUMN submitted_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'identity_verifications' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.identity_verifications ADD COLUMN reviewed_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'identity_verifications' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE IF EXISTS public.identity_verifications ADD COLUMN reviewed_by character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'identity_verifications' AND column_name = 'selfie_key'
  ) THEN
    ALTER TABLE IF EXISTS public.identity_verifications ADD COLUMN selfie_key text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN business_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN title character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN type character varying(50) DEFAULT 'full_time'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN state character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN description text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'requirements'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN requirements text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'salary'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN salary character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'application_url'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN application_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN contact_email character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'posted_by_id'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN posted_by_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN status character varying(20) DEFAULT 'active'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN expires_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'posted_by_name'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN posted_by_name character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'industry'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN industry character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'is_personal_referral'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN is_personal_referral boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'is_remote'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN is_remote boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'is_hybrid'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN is_hybrid boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN latitude numeric(10,7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN longitude numeric(10,7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'pay_min'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN pay_min numeric(10,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'pay_max'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN pay_max numeric(10,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'pay_type'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN pay_type character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'tags'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN tags jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_listings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.job_listings ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insight_bookmarks' AND column_name = 'insight_id'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insight_bookmarks ADD COLUMN insight_id uuid NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insight_bookmarks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insight_bookmarks ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insight_bookmarks' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insight_bookmarks ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insight_bookmarks' AND column_name = 'pinned'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insight_bookmarks ADD COLUMN pinned boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'pmid'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN pmid character varying(20) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'abstract'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN abstract text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'authors'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN authors jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'journal_id'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN journal_id character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'journal_label'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN journal_label character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'journal_abbrev'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN journal_abbrev character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'pub_date'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN pub_date character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'doi'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN doi character varying(300);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'url'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN url character varying(500) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'designation_ids'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN designation_ids jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'health_topic_ids'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN health_topic_ids jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'bookmark_count'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN bookmark_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'is_curated'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN is_curated boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'synced_at'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN synced_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_insights' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_insights ADD COLUMN status character varying(20) DEFAULT 'active'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_sync_log' AND column_name = 'journal_id'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_sync_log ADD COLUMN journal_id character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_sync_log' AND column_name = 'articles_found'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_sync_log ADD COLUMN articles_found integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_sync_log' AND column_name = 'articles_inserted'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_sync_log ADD COLUMN articles_inserted integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_sync_log' AND column_name = 'error'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_sync_log ADD COLUMN error text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'journal_sync_log' AND column_name = 'ran_at'
  ) THEN
    ALTER TABLE IF EXISTS public.journal_sync_log ADD COLUMN ran_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN name text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN type text DEFAULT 'private'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'privacy'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN privacy text DEFAULT 'invite_only'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'host_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN host_user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'emoji'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN emoji text DEFAULT '✨'::text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'max_members'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN max_members integer DEFAULT 8 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN state text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'planning_mode'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN planning_mode text DEFAULT 'open'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'current_curator_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN current_curator_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_circles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_circles ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_feedback' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_feedback ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_feedback' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_feedback ADD COLUMN session_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_feedback' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_feedback ADD COLUMN business_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_feedback' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_feedback ADD COLUMN category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_feedback' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_feedback ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_feedback' AND column_name = 'reaction'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_feedback ADD COLUMN reaction character varying(10) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_feedback' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_feedback ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_search_events' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_search_events ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_search_events' AND column_name = 'query'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_search_events ADD COLUMN query text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_search_events' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_search_events ADD COLUMN category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_search_events' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_search_events ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_search_events' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_search_events ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_search_events' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_search_events ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_sessions ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_sessions' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_sessions ADD COLUMN title character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_sessions' AND column_name = 'destination'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_sessions ADD COLUMN destination character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_sessions' AND column_name = 'vibes'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_sessions ADD COLUMN vibes jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_sessions' AND column_name = 'messages'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_sessions ADD COLUMN messages jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_sessions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_sessions ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_sessions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_sessions ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_sessions' AND column_name = 'share_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_sessions ADD COLUMN share_id character varying(64);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_task_lists' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_task_lists ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_task_lists' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_task_lists ADD COLUMN name character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_task_lists' AND column_name = 'icon'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_task_lists ADD COLUMN icon character varying(10) DEFAULT '📋'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_task_lists' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_task_lists ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_tasks ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_tasks' AND column_name = 'list_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_tasks ADD COLUMN list_id character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_tasks' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_tasks ADD COLUMN title character varying(300) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_tasks' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_tasks ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_tasks' AND column_name = 'due_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_tasks ADD COLUMN due_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_tasks' AND column_name = 'due_time_label'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_tasks ADD COLUMN due_time_label character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_tasks' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_tasks ADD COLUMN category character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_tasks' AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_tasks ADD COLUMN is_completed boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_tasks' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_tasks ADD COLUMN completed_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_tasks' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_tasks ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_twin_recs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_twin_recs ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_twin_recs' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_twin_recs ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_twin_recs' AND column_name = 'score'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_twin_recs ADD COLUMN score real DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_twin_recs' AND column_name = 'twin_count'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_twin_recs ADD COLUMN twin_count integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_twin_recs' AND column_name = 'twin_cities'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_twin_recs ADD COLUMN twin_cities jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_twin_recs' AND column_name = 'reason'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_twin_recs ADD COLUMN reason character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kinfolk_twin_recs' AND column_name = 'computed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.kinfolk_twin_recs ADD COLUMN computed_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_article_reads' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_article_reads ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_article_reads' AND column_name = 'article_id'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_article_reads ADD COLUMN article_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_article_reads' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_article_reads ADD COLUMN topic_id character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_article_reads' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_article_reads ADD COLUMN read_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN title character varying(250) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'slug'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN slug character varying(250) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'summary'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN summary text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'content'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN content text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN category character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN subcategory character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'tier'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN tier character varying(20) DEFAULT 'free'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN author_id character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN author_name character varying(150) DEFAULT 'Editorial'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'author_badge'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN author_badge character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'author_avatar'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN author_avatar character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'tags'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN tags text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN image_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'read_time_minutes'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN read_time_minutes integer DEFAULT 4;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'disclaimer'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN disclaimer text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'featured'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN featured boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN view_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN status character varying(20) DEFAULT 'published'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN published_at timestamp without time zone DEFAULT now();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN topic_id character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'audience_rating'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN audience_rating character varying(20) DEFAULT 'everyone'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_articles' AND column_name = 'rating_reason'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_articles ADD COLUMN rating_reason character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_bookmarks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_bookmarks ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_bookmarks' AND column_name = 'article_id'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_bookmarks ADD COLUMN article_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_bookmarks' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_bookmarks ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_channels' AND column_name = 'slug'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_channels ADD COLUMN slug character varying(80) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_channels' AND column_name = 'label'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_channels ADD COLUMN label character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_channels' AND column_name = 'icon'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_channels ADD COLUMN icon character varying(10) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_channels' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_channels ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_channels' AND column_name = 'color'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_channels ADD COLUMN color character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_channels' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_channels ADD COLUMN sort_order integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_channels' AND column_name = 'published'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_channels ADD COLUMN published boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_channels' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_channels ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'topic_name'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN topic_name character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN category character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'tier'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN tier character varying(20) DEFAULT 'free'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'search_frequency_days'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN search_frequency_days integer DEFAULT 7 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'last_searched_at'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN last_searched_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'enabled'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN enabled boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'parent_category'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN parent_category character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'keywords'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN keywords text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'synonyms'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN synonyms text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'trusted_sources'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN trusted_sources jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'notification_priority'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN notification_priority character varying(20) DEFAULT 'standard'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'topic_type'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN topic_type character varying(30) DEFAULT 'general'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'is_user_created'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN is_user_created boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'created_by_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN created_by_user_id character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'canonical_name'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN canonical_name character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN entity_type character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'ownership_type'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN ownership_type character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'is_minority_owned'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN is_minority_owned boolean;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'credibility_score'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN credibility_score integer DEFAULT 50 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'knowledge_topics' AND column_name = 'credibility_tier'
  ) THEN
    ALTER TABLE IF EXISTS public.knowledge_topics ADD COLUMN credibility_tier character varying(30) DEFAULT 'community'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'journey_type'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN journey_type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN title character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN state character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN status character varying DEFAULT 'active'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'phases'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN phases jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'ai_context'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN ai_context character varying(2000);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'kinfolk_session_id'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN kinfolk_session_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'life_journeys' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.life_journeys ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'sharer_id'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN sharer_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN share_token character varying(64) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'recipient_email'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN recipient_email character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'recipient_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN recipient_user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'label'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN label character varying(150) DEFAULT 'Live Location'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'current_lat'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN current_lat double precision;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'current_lng'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN current_lng double precision;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'last_updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN last_updated_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN expires_at timestamp without time zone NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'location_shares' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.location_shares ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'love_notes' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.love_notes ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'love_notes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.love_notes ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'love_notes' AND column_name = 'note'
  ) THEN
    ALTER TABLE IF EXISTS public.love_notes ADD COLUMN note text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'love_notes' AND column_name = 'upvotes'
  ) THEN
    ALTER TABLE IF EXISTS public.love_notes ADD COLUMN upvotes integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'love_notes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.love_notes ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'love_notes' AND column_name = 'content_link'
  ) THEN
    ALTER TABLE IF EXISTS public.love_notes ADD COLUMN content_link character varying(512);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'tier'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN tier character varying(20) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'tier_label'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN tier_label character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'standard_fee'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN standard_fee numeric(5,4) DEFAULT 0.1000 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'promotional_fee'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN promotional_fee numeric(5,4) DEFAULT 0.0700 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'founding_fee'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN founding_fee numeric(5,4) DEFAULT 0.0500 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'promo_active'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN promo_active boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'promo_start_date'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN promo_start_date timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'promo_end_date'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN promo_end_date timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'promo_description'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN promo_description character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN updated_by character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_fee_config' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_fee_config ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_saved' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_saved ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_saved' AND column_name = 'listing_id'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_saved ADD COLUMN listing_id uuid NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketplace_saved' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.marketplace_saved ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'initiator_id'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN initiator_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN partner_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'connection_id'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN connection_id integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'location'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN location text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'note'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'initiated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN initiated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN confirmed_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN expires_at timestamp without time zone NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'clear_code'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN clear_code character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'safety_watcher_id'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN safety_watcher_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'safety_watcher_email'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN safety_watcher_email text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'cleared_at'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN cleared_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'arrival_check_at'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN arrival_check_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'arrival_checked_at'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN arrival_checked_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'arrival_check_status'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN arrival_check_status character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'arrival_alert_sent_at'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN arrival_alert_sent_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'home_check_at'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN home_check_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'home_checked_at'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN home_checked_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'home_check_status'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN home_check_status character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'home_alert_sent_at'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN home_alert_sent_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'safety_friend_name'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN safety_friend_name character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'meetup_verifications' AND column_name = 'safety_friend_email'
  ) THEN
    ALTER TABLE IF EXISTS public.meetup_verifications ADD COLUMN safety_friend_email character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_connections' AND column_name = 'requester_id'
  ) THEN
    ALTER TABLE IF EXISTS public.member_connections ADD COLUMN requester_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_connections' AND column_name = 'recipient_id'
  ) THEN
    ALTER TABLE IF EXISTS public.member_connections ADD COLUMN recipient_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_connections' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.member_connections ADD COLUMN status text DEFAULT 'pending'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_connections' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE IF EXISTS public.member_connections ADD COLUMN group_id integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_connections' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.member_connections ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_connections' AND column_name = 'responded_at'
  ) THEN
    ALTER TABLE IF EXISTS public.member_connections ADD COLUMN responded_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN full_name character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN bio text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'industry'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN industry character varying(80);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN role character varying(20) DEFAULT 'mentor'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'expertise'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN expertise text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN city character varying(80);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'available'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN available boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN linkedin_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN specialties jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'is_remote'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN is_remote boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN latitude character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN longitude character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'session_type'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN session_type character varying(20) DEFAULT 'free'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'session_rate'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN session_rate character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'calendly_url'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN calendly_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mentorship_profiles' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE IF EXISTS public.mentorship_profiles ADD COLUMN website_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE IF EXISTS public.messages ADD COLUMN conversation_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'role'
  ) THEN
    ALTER TABLE IF EXISTS public.messages ADD COLUMN role text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'content'
  ) THEN
    ALTER TABLE IF EXISTS public.messages ADD COLUMN content text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.messages ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'sender_id'
  ) THEN
    ALTER TABLE IF EXISTS public.messages ADD COLUMN sender_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_pins' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_pins ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_pins' AND column_name = 'label'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_pins ADD COLUMN label character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_pins' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_pins ADD COLUMN city character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_pins' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_pins ADD COLUMN state character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_pins' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_pins ADD COLUMN latitude double precision;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_pins' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_pins ADD COLUMN longitude double precision;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_pins' AND column_name = 'intent_id'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_pins ADD COLUMN intent_id character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_pins' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_pins ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_pins' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_pins ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_pins' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_pins ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN neighborhood character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'visit_purpose'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN visit_purpose character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'visit_freq'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN visit_freq character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'daytime_safety'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN daytime_safety integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'nighttime_safety'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN nighttime_safety integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'walkability'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN walkability integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'transit_safety'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN transit_safety integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'atmosphere'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN atmosphere character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'police_visibility'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN police_visibility character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'police_impact'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN police_impact character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'accessibility'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN accessibility jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'tips'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN tips jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'comments'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN comments text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'safety_score'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN safety_score integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'community_score'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN community_score integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'walkability_score'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN walkability_score integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'moderator_notes'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN moderator_notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN reviewed_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN reviewed_by character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'community_rating'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN community_rating integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'culturally_connected'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN culturally_connected character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'linked_business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN linked_business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'nomination_name'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN nomination_name character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'nomination_category'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN nomination_category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neighborhood_surveys' AND column_name = 'nomination_social_link'
  ) THEN
    ALTER TABLE IF EXISTS public.neighborhood_surveys ADD COLUMN nomination_social_link character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.notification_preferences ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'topics'
  ) THEN
    ALTER TABLE IF EXISTS public.notification_preferences ADD COLUMN topics text[] DEFAULT ARRAY['community'::text, 'safety'::text, 'events'::text, 'business'::text] NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'push_enabled'
  ) THEN
    ALTER TABLE IF EXISTS public.notification_preferences ADD COLUMN push_enabled boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'email_enabled'
  ) THEN
    ALTER TABLE IF EXISTS public.notification_preferences ADD COLUMN email_enabled boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.notification_preferences ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.notifications ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.notifications ADD COLUMN type character varying DEFAULT 'system'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.notifications ADD COLUMN title character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'body'
  ) THEN
    ALTER TABLE IF EXISTS public.notifications ADD COLUMN body text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE IF EXISTS public.notifications ADD COLUMN read boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.notifications ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE IF EXISTS public.notifications ADD COLUMN entity_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE IF EXISTS public.notifications ADD COLUMN entity_type character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'data'
  ) THEN
    ALTER TABLE IF EXISTS public.notifications ADD COLUMN data jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'officer_id'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN officer_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'from_department'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN from_department character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'from_city'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN from_city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'from_state'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN from_state character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'to_department'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN to_department character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'to_city'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN to_city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'to_state'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN to_state character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'transfer_date'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN transfer_date character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN source_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN status character varying DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'notified_at'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN notified_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'submitted_by'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN submitted_by character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'officer_transfers' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.officer_transfers ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN title character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'personal_story'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN personal_story text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'subject_name'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN subject_name character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'story_type'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN story_type character varying(50) DEFAULT 'general'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'subject_emoji'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN subject_emoji character varying(10) DEFAULT '✨'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'experience_context'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN experience_context character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN is_public boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'follow_count'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN follow_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN view_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'section_count'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN section_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'item_count'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN item_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pay_it_forward_guides' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.pay_it_forward_guides ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN display_name character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'credentials'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN credentials character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'specialty'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN specialty character varying(150) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'institution'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN institution character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'license_state'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN license_state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'license_number'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN license_number character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN bio text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN verified_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN rejection_reason text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'physician_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.physician_profiles ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'item_type'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN item_type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'review_id'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN review_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'review_text'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN review_text text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'review_author'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN review_author character varying(120);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'review_rating'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN review_rating integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'review_initials'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN review_initials character varying(4);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'review_color'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN review_color character varying(12);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'review_time_ago'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN review_time_ago character varying(40);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN video_url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'video_title'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN video_title character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'pinned_at'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN pinned_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN expires_at timestamp with time zone NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'notified_expiry'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN notified_expiry boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pinned_business_items' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.pinned_business_items ADD COLUMN status character varying DEFAULT 'active'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plate_passes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.plate_passes ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plate_passes' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.plate_passes ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plate_passes' AND column_name = 'share_type'
  ) THEN
    ALTER TABLE IF EXISTS public.plate_passes ADD COLUMN share_type character varying(20) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plate_passes' AND column_name = 'message'
  ) THEN
    ALTER TABLE IF EXISTS public.plate_passes ADD COLUMN message text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plate_passes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.plate_passes ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_ledger' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.points_ledger ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_ledger' AND column_name = 'action'
  ) THEN
    ALTER TABLE IF EXISTS public.points_ledger ADD COLUMN action character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_ledger' AND column_name = 'points'
  ) THEN
    ALTER TABLE IF EXISTS public.points_ledger ADD COLUMN points integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_ledger' AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE IF EXISTS public.points_ledger ADD COLUMN entity_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_ledger' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.points_ledger ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_redemptions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.points_redemptions ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_redemptions' AND column_name = 'reward_id'
  ) THEN
    ALTER TABLE IF EXISTS public.points_redemptions ADD COLUMN reward_id character varying(60) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_redemptions' AND column_name = 'reward_title'
  ) THEN
    ALTER TABLE IF EXISTS public.points_redemptions ADD COLUMN reward_title character varying(120) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_redemptions' AND column_name = 'points_cost'
  ) THEN
    ALTER TABLE IF EXISTS public.points_redemptions ADD COLUMN points_cost integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_redemptions' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.points_redemptions ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_redemptions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.points_redemptions ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_redemptions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.points_redemptions ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'points_redemptions' AND column_name = 'fulfilled_at'
  ) THEN
    ALTER TABLE IF EXISTS public.points_redemptions ADD COLUMN fulfilled_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_recommended_spots' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_recommended_spots ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_recommended_spots' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_recommended_spots ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_recommended_spots' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_recommended_spots ADD COLUMN business_name character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_recommended_spots' AND column_name = 'business_category'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_recommended_spots ADD COLUMN business_category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_recommended_spots' AND column_name = 'stance'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_recommended_spots ADD COLUMN stance character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_recommended_spots' AND column_name = 'blurb'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_recommended_spots ADD COLUMN blurb text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_recommended_spots' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_recommended_spots ADD COLUMN display_order integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_recommended_spots' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_recommended_spots ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_tags' AND column_name = 'tagger_id'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_tags ADD COLUMN tagger_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_tags' AND column_name = 'tagged_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_tags ADD COLUMN tagged_user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_tags' AND column_name = 'content'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_tags ADD COLUMN content text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_tags' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.profile_tags ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_disputes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.purchase_disputes ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_disputes' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.purchase_disputes ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_disputes' AND column_name = 'listing_id'
  ) THEN
    ALTER TABLE IF EXISTS public.purchase_disputes ADD COLUMN listing_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_disputes' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE IF EXISTS public.purchase_disputes ADD COLUMN stripe_session_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_disputes' AND column_name = 'dispute_type'
  ) THEN
    ALTER TABLE IF EXISTS public.purchase_disputes ADD COLUMN dispute_type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_disputes' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.purchase_disputes ADD COLUMN description text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_disputes' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.purchase_disputes ADD COLUMN status character varying DEFAULT 'open'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_disputes' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE IF EXISTS public.purchase_disputes ADD COLUMN admin_notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_disputes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.purchase_disputes ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_disputes' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.purchase_disputes ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'push_tokens' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.push_tokens ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'push_tokens' AND column_name = 'token'
  ) THEN
    ALTER TABLE IF EXISTS public.push_tokens ADD COLUMN token character varying(500) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'push_tokens' AND column_name = 'platform'
  ) THEN
    ALTER TABLE IF EXISTS public.push_tokens ADD COLUMN platform character varying(20) DEFAULT 'unknown'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'push_tokens' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.push_tokens ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'push_tokens' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.push_tokens ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reference_link_clicks' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.reference_link_clicks ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reference_link_clicks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.reference_link_clicks ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reference_link_clicks' AND column_name = 'source'
  ) THEN
    ALTER TABLE IF EXISTS public.reference_link_clicks ADD COLUMN source character varying(30) DEFAULT 'direct'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reference_link_clicks' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE IF EXISTS public.reference_link_clicks ADD COLUMN source_id character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reference_link_clicks' AND column_name = 'referrer_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.reference_link_clicks ADD COLUMN referrer_user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reference_link_clicks' AND column_name = 'clicked_at'
  ) THEN
    ALTER TABLE IF EXISTS public.reference_link_clicks ADD COLUMN clicked_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'request_upvotes' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE IF EXISTS public.request_upvotes ADD COLUMN request_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'request_upvotes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.request_upvotes ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'request_upvotes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.request_upvotes ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_alerts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_alerts ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_alerts' AND column_name = 'query'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_alerts ADD COLUMN query text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_alerts' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_alerts ADD COLUMN category character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_alerts' AND column_name = 'keywords'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_alerts ADD COLUMN keywords text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_alerts' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_alerts ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_alerts' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_alerts ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_alerts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_alerts ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_alerts' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_alerts ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'submitted_by_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN submitted_by_user_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN type public.opportunity_type NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'organization'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN organization character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN zip_code character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'is_remote'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN is_remote boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'is_online'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN is_online boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'pay_range'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN pay_range character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'schedule_type'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN schedule_type character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'lease_length'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN lease_length character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'rent'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN rent character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'bedrooms'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN bedrooms integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'bathrooms'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN bathrooms character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'application_link'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN application_link text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'contact_method'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN contact_method character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN deadline timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'available_date'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN available_date timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'submitter_role'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN submitter_role character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'is_publicly_posted'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN is_publicly_posted boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'is_second_chance'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN is_second_chance boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'accessibility_features'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN accessibility_features text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'benefits'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN benefits text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'personal_note'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN personal_note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'opportunity_source_tier'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN opportunity_source_tier public.opportunity_source_tier DEFAULT 'community_shared'::public.opportunity_source_tier NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'opportunity_status'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN opportunity_status public.opportunity_status DEFAULT 'active'::public.opportunity_status NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'report_count'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN report_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN expires_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'last_confirmed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN last_confirmed_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resource_opportunities' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.resource_opportunities ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN category public.resource_category NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN subcategory character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'source_tier'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN source_tier public.resource_source_tier DEFAULT 'community_shared'::public.resource_source_tier NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'organization'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN organization character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'url'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN url text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'phone'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN phone character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'email'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN email character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN zip_code character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'is_national'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN is_national boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'keywords'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN keywords text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'application_deadline'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN application_deadline timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN expires_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'last_confirmed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN last_confirmed_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'report_count'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN report_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'resources' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.resources ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'review_helpful_votes' AND column_name = 'review_id'
  ) THEN
    ALTER TABLE IF EXISTS public.review_helpful_votes ADD COLUMN review_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'review_helpful_votes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.review_helpful_votes ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'review_helpful_votes' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.review_helpful_votes ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN author_name character varying(255) DEFAULT 'Community Member'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'rating'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN rating integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'text'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN text text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'would_return_alone'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN would_return_alone boolean;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'social_handle'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN social_handle character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'social_platform'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN social_platform character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN video_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'non_minority_owned'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN non_minority_owned boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'community_support'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN community_support integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'website'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN website character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'location'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN location character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN is_anonymous boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'recommends_as_employer'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN recommends_as_employer boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'now_hiring_url'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN now_hiring_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'weight'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN weight numeric(4,2) DEFAULT 1.00 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'helpful_votes'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN helpful_votes integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'verified_purchase'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN verified_purchase boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'verified_checkin'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN verified_checkin boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN status character varying(30) DEFAULT 'posted'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'owner_response'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN owner_response text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'owner_responded_at'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN owner_responded_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'customer_edited_at'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN customer_edited_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'photos'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN photos text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'risk_score'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN risk_score integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'moderation_level'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN moderation_level character varying(20) DEFAULT 'low'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'moderation_reasons'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN moderation_reasons text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'verification_badge'
  ) THEN
    ALTER TABLE IF EXISTS public.reviews ADD COLUMN verification_badge character varying(40);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'roadmap_id'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN roadmap_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN category character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'category_emoji'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN category_emoji character varying(10) DEFAULT '📋'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN title character varying(300) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN display_order integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'is_complete'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN is_complete boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN completed_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'priority'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN priority character varying(20) DEFAULT 'normal'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'external_url'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN external_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'external_label'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN external_label character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_steps' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmap_steps ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN title character varying(300) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN topic_id character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'topic_name'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN topic_name character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'intent'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN intent character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'cover_emoji'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN cover_emoji character varying(10) DEFAULT '🗺️'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN is_public boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'is_ai_generated'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN is_ai_generated boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'total_steps'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN total_steps integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'completed_steps'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN completed_steps integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmaps' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'hide_not_interested'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN hide_not_interested boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'hide_unresolved_alerts'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN hide_unresolved_alerts boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'show_would_return_alone'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN show_would_return_alone boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'prioritize_minority_owned'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN prioritize_minority_owned boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'hide_previously_reported'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN hide_previously_reported boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'safety_alerts_only_saved'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN safety_alerts_only_saved boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'pause_dms'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN pause_dms boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'require_followers'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN require_followers boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'disable_promo_messages'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN disable_promo_messages boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'verified_users_only'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN verified_users_only boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safe_space_preferences' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safe_space_preferences ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'trusted_contact_name'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN trusted_contact_name character varying(150) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'trusted_contact_email'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN trusted_contact_email character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN scheduled_at timestamp without time zone NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN confirmed_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'note'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'location'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN location text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'notified_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN notified_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_checkins' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_checkins ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_incidents' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_incidents ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_incidents' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_incidents ADD COLUMN neighborhood character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_incidents' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_incidents ADD COLUMN category character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_incidents' AND column_name = 'severity'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_incidents ADD COLUMN severity character varying(20) DEFAULT 'medium'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_incidents' AND column_name = 'report_count'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_incidents ADD COLUMN report_count integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_incidents' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_incidents ADD COLUMN status character varying(20) DEFAULT 'active'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_incidents' AND column_name = 'notifications_sent'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_incidents ADD COLUMN notifications_sent boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_incidents' AND column_name = 'triggered_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_incidents ADD COLUMN triggered_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_incidents' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_incidents ADD COLUMN resolved_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_incidents' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_incidents ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'reporter_id'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN reporter_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'reporter_name'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN reporter_name character varying(255) DEFAULT 'Anonymous'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN category character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'target_type'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN target_type character varying(50) DEFAULT 'business'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'target_id'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN target_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'target_name'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN target_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'severity'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN severity character varying(20) DEFAULT 'medium'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'moderator_notes'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN moderator_notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN reviewed_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN reviewed_by character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'routing_type'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN routing_type character varying(20) DEFAULT 'moderation'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'business_response_requested'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN business_response_requested boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'business_response_deadline'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN business_response_deadline timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'business_response_text'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN business_response_text text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'auto_escalated'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN auto_escalated boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'incident_categories'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN incident_categories jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'incident_parties'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN incident_parties jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'incident_severity'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN incident_severity character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'incident_description'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN incident_description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_reports' AND column_name = 'evidence_links'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_reports ADD COLUMN evidence_links text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tip_confirmations' AND column_name = 'tip_id'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tip_confirmations ADD COLUMN tip_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tip_confirmations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tip_confirmations ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tip_confirmations' AND column_name = 'user_lat'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tip_confirmations ADD COLUMN user_lat real;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tip_confirmations' AND column_name = 'user_lng'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tip_confirmations ADD COLUMN user_lng real;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tip_confirmations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tip_confirmations ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'submitted_by_id'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN submitted_by_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN business_name character varying(255);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'address'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN address text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'lat'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN lat real NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'lng'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN lng real NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN description text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN category character varying(50) DEFAULT 'violence'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'confirmation_count'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN confirmation_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'alerts_sent'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN alerts_sent boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'safety_tips' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.safety_tips ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_community_locations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_community_locations ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_community_locations' AND column_name = 'label'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_community_locations ADD COLUMN label character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_community_locations' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_community_locations ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_community_locations' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_community_locations ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_community_locations' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_community_locations ADD COLUMN zip_code character varying(10);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_community_locations' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_community_locations ADD COLUMN neighborhood character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_community_locations' AND column_name = 'is_my_community'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_community_locations ADD COLUMN is_my_community boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_community_locations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_community_locations ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_community_locations' AND column_name = 'loc_type'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_community_locations ADD COLUMN loc_type character varying(20) DEFAULT 'geographic'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_community_locations' AND column_name = 'industry'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_community_locations ADD COLUMN industry character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_jobs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_jobs ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_jobs' AND column_name = 'job_id'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_jobs ADD COLUMN job_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_jobs' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_jobs ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_places' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_places ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_places' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_places ADD COLUMN business_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_places' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_places ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'saved_places' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE IF EXISTS public.saved_places ADD COLUMN is_public boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'sid'
  ) THEN
    ALTER TABLE IF EXISTS public.sessions ADD COLUMN sid character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'sess'
  ) THEN
    ALTER TABLE IF EXISTS public.sessions ADD COLUMN sess jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'expire'
  ) THEN
    ALTER TABLE IF EXISTS public.sessions ADD COLUMN expire timestamp without time zone NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'nominator_id'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN nominator_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'nominee_type'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN nominee_type character varying(50) DEFAULT 'person'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'nominee_name'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN nominee_name character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'nominee_user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN nominee_user_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'nominee_business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN nominee_business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'nominee_handle'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN nominee_handle character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'nominee_image_url'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN nominee_image_url character varying(512);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN category character varying(80) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'what_known_for'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN what_known_for text[] DEFAULT '{}'::text[] NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'reason'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN reason text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'experience'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN experience text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN is_public boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN is_verified boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'show_love_count'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN show_love_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'support_count'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN support_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'saved_count'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN saved_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'visited_count'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN visited_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'spotlight_month'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN spotlight_month character varying(7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'spotlight_type'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN spotlight_type character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_nominations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_nominations ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_reactions' AND column_name = 'nomination_id'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_reactions ADD COLUMN nomination_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_reactions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_reactions ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_reactions' AND column_name = 'reaction_type'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_reactions ADD COLUMN reaction_type character varying(30) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'show_love_reactions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.show_love_reactions ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_invites' AND column_name = 'platform'
  ) THEN
    ALTER TABLE IF EXISTS public.social_invites ADD COLUMN platform character varying(30) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_invites' AND column_name = 'handle_or_url'
  ) THEN
    ALTER TABLE IF EXISTS public.social_invites ADD COLUMN handle_or_url character varying(500) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_invites' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.social_invites ADD COLUMN name character varying(200);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_invites' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.social_invites ADD COLUMN type character varying(20) DEFAULT 'friend'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_invites' AND column_name = 'biz_name'
  ) THEN
    ALTER TABLE IF EXISTS public.social_invites ADD COLUMN biz_name character varying(300);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_invites' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE IF EXISTS public.social_invites ADD COLUMN referral_code character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_invites' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.social_invites ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'space_reports' AND column_name = 'reporter_id'
  ) THEN
    ALTER TABLE IF EXISTS public.space_reports ADD COLUMN reporter_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'space_reports' AND column_name = 'space_name'
  ) THEN
    ALTER TABLE IF EXISTS public.space_reports ADD COLUMN space_name character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'space_reports' AND column_name = 'address'
  ) THEN
    ALTER TABLE IF EXISTS public.space_reports ADD COLUMN address character varying(300);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'space_reports' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.space_reports ADD COLUMN city character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'space_reports' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.space_reports ADD COLUMN category character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'space_reports' AND column_name = 'concern_types'
  ) THEN
    ALTER TABLE IF EXISTS public.space_reports ADD COLUMN concern_types text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'space_reports' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.space_reports ADD COLUMN description text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'space_reports' AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE IF EXISTS public.space_reports ADD COLUMN is_anonymous boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'space_reports' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.space_reports ADD COLUMN status character varying DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'space_reports' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.space_reports ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'story_confirmations' AND column_name = 'story_id'
  ) THEN
    ALTER TABLE IF EXISTS public.story_confirmations ADD COLUMN story_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'story_confirmations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.story_confirmations ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'story_confirmations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.story_confirmations ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stripe_processed_events' AND column_name = 'stripe_event_id'
  ) THEN
    ALTER TABLE IF EXISTS public.stripe_processed_events ADD COLUMN stripe_event_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stripe_processed_events' AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.stripe_processed_events ADD COLUMN processed_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'thread_reads' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.thread_reads ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'thread_reads' AND column_name = 'post_id'
  ) THEN
    ALTER TABLE IF EXISTS public.thread_reads ADD COLUMN post_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'thread_reads' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE IF EXISTS public.thread_reads ADD COLUMN read_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_credibility_signals' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_credibility_signals ADD COLUMN topic_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_credibility_signals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_credibility_signals ADD COLUMN user_id character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_credibility_signals' AND column_name = 'signal_type'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_credibility_signals ADD COLUMN signal_type character varying(30) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_credibility_signals' AND column_name = 'weight'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_credibility_signals ADD COLUMN weight integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_credibility_signals' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_credibility_signals ADD COLUMN metadata jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_credibility_signals' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_credibility_signals ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_issues' AND column_name = 'name'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_issues ADD COLUMN name character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_issues' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_issues ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_issues' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_issues ADD COLUMN category character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_issues' AND column_name = 'keywords'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_issues ADD COLUMN keywords text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_issues' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_issues ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_issues' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_issues ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'topic_issues' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.topic_issues ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'travel_flights' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.travel_flights ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'travel_flights' AND column_name = 'flight_number'
  ) THEN
    ALTER TABLE IF EXISTS public.travel_flights ADD COLUMN flight_number character varying(20) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'travel_flights' AND column_name = 'airline'
  ) THEN
    ALTER TABLE IF EXISTS public.travel_flights ADD COLUMN airline character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'travel_flights' AND column_name = 'departure_date'
  ) THEN
    ALTER TABLE IF EXISTS public.travel_flights ADD COLUMN departure_date character varying(10) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'travel_flights' AND column_name = 'origin'
  ) THEN
    ALTER TABLE IF EXISTS public.travel_flights ADD COLUMN origin character varying(10);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'travel_flights' AND column_name = 'destination'
  ) THEN
    ALTER TABLE IF EXISTS public.travel_flights ADD COLUMN destination character varying(10);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'travel_flights' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.travel_flights ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'travel_flights' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.travel_flights ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trip_journals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.trip_journals ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trip_journals' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.trip_journals ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trip_journals' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.trip_journals ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trip_journals' AND column_name = 'cities'
  ) THEN
    ALTER TABLE IF EXISTS public.trip_journals ADD COLUMN cities text[];
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trip_journals' AND column_name = 'cover_emoji'
  ) THEN
    ALTER TABLE IF EXISTS public.trip_journals ADD COLUMN cover_emoji text DEFAULT '✈️'::text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trip_journals' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE IF EXISTS public.trip_journals ADD COLUMN is_public boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trip_journals' AND column_name = 'saved_count'
  ) THEN
    ALTER TABLE IF EXISTS public.trip_journals ADD COLUMN saved_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trip_journals' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.trip_journals ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'connection_id'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN connection_id integer NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'initiator_id'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN initiator_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN partner_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'trusted_contact_name'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN trusted_contact_name text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'trusted_contact_email'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN trusted_contact_email text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'trusted_contact_phone'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN trusted_contact_phone text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'initiator_consent'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN initiator_consent boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'partner_consent'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN partner_consent boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN status text DEFAULT 'pending_consent'::text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'activated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN activated_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'revoked_at'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN revoked_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trusted_contact_shares' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.trusted_contact_shares ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_achievements' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_achievements ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_achievements' AND column_name = 'achievement_type'
  ) THEN
    ALTER TABLE IF EXISTS public.user_achievements ADD COLUMN achievement_type character varying(60) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_achievements' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE IF EXISTS public.user_achievements ADD COLUMN metadata json;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_achievements' AND column_name = 'earned_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_achievements ADD COLUMN earned_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN topic_id character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'badge_type'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN badge_type character varying(50) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'badge_name'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN badge_name character varying(200) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'badge_emoji'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN badge_emoji character varying(10) DEFAULT '✦'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN is_public boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN is_verified boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'is_volunteered'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN is_volunteered boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'years_of_experience'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN years_of_experience integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'experience_note'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN experience_note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'earned_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN earned_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_badges' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_badges ADD COLUMN expires_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_delivery_preferences' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_delivery_preferences ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_delivery_preferences' AND column_name = 'digest_mode'
  ) THEN
    ALTER TABLE IF EXISTS public.user_delivery_preferences ADD COLUMN digest_mode character varying(30) DEFAULT 'weekly'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_delivery_preferences' AND column_name = 'scope'
  ) THEN
    ALTER TABLE IF EXISTS public.user_delivery_preferences ADD COLUMN scope character varying(20) DEFAULT 'all'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_delivery_preferences' AND column_name = 'include_saved_cities'
  ) THEN
    ALTER TABLE IF EXISTS public.user_delivery_preferences ADD COLUMN include_saved_cities boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_delivery_preferences' AND column_name = 'include_saved_businesses'
  ) THEN
    ALTER TABLE IF EXISTS public.user_delivery_preferences ADD COLUMN include_saved_businesses boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_delivery_preferences' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_delivery_preferences ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_follows' AND column_name = 'follower_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_follows ADD COLUMN follower_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_follows' AND column_name = 'following_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_follows ADD COLUMN following_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_follows' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.user_follows ADD COLUMN status character varying DEFAULT 'accepted'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_follows' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_follows ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_follows' AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_follows ADD COLUMN accepted_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_hashtag_follows' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_hashtag_follows ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_hashtag_follows' AND column_name = 'hashtag'
  ) THEN
    ALTER TABLE IF EXISTS public.user_hashtag_follows ADD COLUMN hashtag character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_hashtag_follows' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_hashtag_follows ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_health_topic_follows' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_health_topic_follows ADD COLUMN user_id character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_health_topic_follows' AND column_name = 'topic_ids'
  ) THEN
    ALTER TABLE IF EXISTS public.user_health_topic_follows ADD COLUMN topic_ids jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_health_topic_follows' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_health_topic_follows ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_health_topic_follows' AND column_name = 'pinned_topic_ids'
  ) THEN
    ALTER TABLE IF EXISTS public.user_health_topic_follows ADD COLUMN pinned_topic_ids jsonb DEFAULT '[]'::jsonb NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_issue_follows' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_issue_follows ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_issue_follows' AND column_name = 'issue_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_issue_follows ADD COLUMN issue_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_issue_follows' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_issue_follows ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_issue_follows' AND column_name = 'is_pinned_to_profile'
  ) THEN
    ALTER TABLE IF EXISTS public.user_issue_follows ADD COLUMN is_pinned_to_profile boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_locations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_locations ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_locations' AND column_name = 'lat'
  ) THEN
    ALTER TABLE IF EXISTS public.user_locations ADD COLUMN lat numeric(10,7) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_locations' AND column_name = 'lng'
  ) THEN
    ALTER TABLE IF EXISTS public.user_locations ADD COLUMN lng numeric(10,7) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_locations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_locations ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'favorite_categories'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN favorite_categories jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'favorite_cities'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN favorite_cities jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'avoid_categories'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN avoid_categories jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'budget_range'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN budget_range character varying(20) DEFAULT 'any'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'trip_style'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN trip_style jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'travel_companion'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN travel_companion character varying(30) DEFAULT 'solo'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'dietary_notes'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN dietary_notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'communication_style'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN communication_style character varying(20) DEFAULT 'friendly'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'personality_mode'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN personality_mode character varying(30) DEFAULT 'neighborhood_guide'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'emoji_level'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN emoji_level character varying(10) DEFAULT 'some'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'humor_level'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN humor_level character varying(10) DEFAULT 'light'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'cultural_interests'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN cultural_interests jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'know_before_you_go'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN know_before_you_go boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'regional_flavor'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN regional_flavor character varying(30) DEFAULT 'standard'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'preferred_ownership_types'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN preferred_ownership_types jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'search_history'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN search_history jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'lifestyle_services'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN lifestyle_services jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'diaspora_countries'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN diaspora_countries jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'aave_level'
  ) THEN
    ALTER TABLE IF EXISTS public.user_preferences ADD COLUMN aave_level smallint DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'notif_events'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN notif_events boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'notif_business'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN notif_business boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'notif_messages'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN notif_messages boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'notif_reviews'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN notif_reviews boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'notif_community'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN notif_community boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'notif_promotions'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN notif_promotions boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'notif_digest'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN notif_digest boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'notif_tips'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN notif_tips boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'notif_post_nudges'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN notif_post_nudges boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'quiet_hours_enabled'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN quiet_hours_enabled boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'quiet_hours_from'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN quiet_hours_from character varying(10) DEFAULT '10:00 PM'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'quiet_hours_until'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN quiet_hours_until character varying(10) DEFAULT '8:00 AM'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'profile_visibility'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN profile_visibility character varying DEFAULT 'community'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'show_location'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN show_location boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'location_precision'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN location_precision character varying DEFAULT 'neighborhood'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'activity_status'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN activity_status boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'usage_analytics'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN usage_analytics boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'personalised_suggestions'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN personalised_suggestions boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'kinfolk_memory_enabled'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN kinfolk_memory_enabled boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'profile_view_tracking_enabled'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN profile_view_tracking_enabled boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'post_nudges_enabled'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN post_nudges_enabled boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'safety_alert_police'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN safety_alert_police boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'safety_alert_ice'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN safety_alert_ice boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'safety_alert_radius_miles'
  ) THEN
    ALTER TABLE IF EXISTS public.user_settings ADD COLUMN safety_alert_radius_miles integer DEFAULT 5 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_topic_follows' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_topic_follows ADD COLUMN user_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_topic_follows' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE IF EXISTS public.user_topic_follows ADD COLUMN topic_id character varying(100) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_topic_follows' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.user_topic_follows ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_topic_follows' AND column_name = 'is_pinned_to_profile'
  ) THEN
    ALTER TABLE IF EXISTS public.user_topic_follows ADD COLUMN is_pinned_to_profile boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_topic_follows' AND column_name = 'hub_intent'
  ) THEN
    ALTER TABLE IF EXISTS public.user_topic_follows ADD COLUMN hub_intent character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN email character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN first_name character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN last_name character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN profile_image_url character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN stripe_customer_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN stripe_subscription_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'push_token'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN push_token character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'approved'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN approved boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN role character varying DEFAULT 'user'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'member_type'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN member_type character varying DEFAULT 'individual'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN trial_ends_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'founding_member_number'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN founding_member_number integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN referral_code character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'referral_count'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN referral_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN date_of_birth timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'kinfolk_query_month'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN kinfolk_query_month character varying(7);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'kinfolk_queries_this_month'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN kinfolk_queries_this_month integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'industry'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN industry character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'job_title'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN job_title character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'trust_level'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN trust_level integer DEFAULT 1 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'reputation_score'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN reputation_score integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'identity_verified'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN identity_verified boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'identity_verified_at'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN identity_verified_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'policy_violations_count'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN policy_violations_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'helpful_reviews_count'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN helpful_reviews_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN username character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN is_private boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'followers_count'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN followers_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'following_count'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN following_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN bio character varying(300);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'referred_by_code'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN referred_by_code character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'home_city'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN home_city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN password_hash character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN email_verified boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_verification_token'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN email_verification_token character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_verification_expires'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN email_verification_expires timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'agree_to_terms'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN agree_to_terms boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'show_city'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN show_city boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'allow_dm'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN allow_dm boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'display_name_format'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN display_name_format character varying DEFAULT 'full'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_business_owner'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN is_business_owner boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_content_creator'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN is_content_creator boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_community_organizer'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN is_community_organizer boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'profile_setup_complete'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN profile_setup_complete boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'apple_id'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN apple_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN phone_number character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN phone_verified boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_influencer'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN is_influencer boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'trial_reminder_3day_sent_at'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN trial_reminder_3day_sent_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'trial_reminder_1day_sent_at'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN trial_reminder_1day_sent_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'trial_expired_email_sent_at'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN trial_expired_email_sent_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'win_back_email_sent_at'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN win_back_email_sent_at timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'notif_events'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN notif_events boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'notif_business'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN notif_business boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'notif_messages'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN notif_messages boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'notif_reviews'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN notif_reviews boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'notif_community'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN notif_community boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'notif_promotions'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN notif_promotions boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'notif_digest'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN notif_digest boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'notif_tips'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN notif_tips boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'notif_post_nudges'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN notif_post_nudges boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'quiet_hours_enabled'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN quiet_hours_enabled boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'quiet_hours_from'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN quiet_hours_from character varying(10) DEFAULT '10:00 PM'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'quiet_hours_until'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN quiet_hours_until character varying(10) DEFAULT '8:00 AM'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN failed_login_attempts integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN locked_until timestamp with time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'marketing_opt_out'
  ) THEN
    ALTER TABLE IF EXISTS public.users ADD COLUMN marketing_opt_out boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'submitter_id'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN submitter_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN business_name character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN business_type character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN owner_name character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN website_url character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'instagram_handle'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN instagram_handle character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'years_in_business'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN years_in_business integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN city character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN state character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'message'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN message text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'submitter_email'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN submitter_email character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN status character varying DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN admin_notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'verification_level'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN verification_level character varying DEFAULT 'basic'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'ownership_percentage'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN ownership_percentage integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'ein_number'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN ein_number character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'documents_provided'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN documents_provided text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'business_license_provided'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN business_license_provided boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'certification_org'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN certification_org character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'certification_url'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN certification_url character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'certification_number'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN certification_number character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN business_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'document_urls'
  ) THEN
    ALTER TABLE IF EXISTS public.verification_requests ADD COLUMN document_urls text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'voice_usage' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.voice_usage ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'voice_usage' AND column_name = 'year_month'
  ) THEN
    ALTER TABLE IF EXISTS public.voice_usage ADD COLUMN year_month text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'voice_usage' AND column_name = 'chars_used'
  ) THEN
    ALTER TABLE IF EXISTS public.voice_usage ADD COLUMN chars_used integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'voice_usage' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.voice_usage ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'email'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN email character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN referral_code character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN referred_by character varying(20);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'state'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN state character varying(50);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'is_business_owner'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN is_business_owner boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'status'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN status character varying(20) DEFAULT 'pending'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN approved_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN first_name character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'welcome_email_sent'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN welcome_email_sent boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN last_name character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN website_url character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'last_nudge_sent_at'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN last_nudge_sent_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'launch_email_sent'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN launch_email_sent boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'beta_email_sent'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN beta_email_sent boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'family_group_id'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN family_group_id character varying(36);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'city_nomination'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN city_nomination character varying(150);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist_signups' AND column_name = 'import_batch_id'
  ) THEN
    ALTER TABLE IF EXISTS public.waitlist_signups ADD COLUMN import_batch_id character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'date'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN date date NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'mood'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN mood integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'energy_level'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN energy_level integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'stress_level'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN stress_level integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'sleep_hours'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN sleep_hours numeric(4,1);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'gratitude'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN gratitude text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'intention'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN intention text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'note'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN note text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN is_public boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_checkins' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_checkins ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN user_id text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'type'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN type text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'title'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN title text NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'target_value'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN target_value numeric(8,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'current_value'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN current_value numeric(8,2) DEFAULT '0'::numeric NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'unit'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN unit character varying(30);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'frequency'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN frequency character varying(20) DEFAULT 'daily'::character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN start_date date;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'target_date'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN target_date date;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN is_private boolean DEFAULT false NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'streak_count'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN streak_count integer DEFAULT 0 NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'last_completed_at'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN last_completed_at timestamp without time zone;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN created_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wellness_goals' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE IF EXISTS public.wellness_goals ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN user_id character varying NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN business_name character varying(255) NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'category'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN category character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'city'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN city character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN neighborhood character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'description'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'must_try'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN must_try text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN session_id character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'notes'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'country'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN country character varying(100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'destination_type'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN destination_type character varying(30) DEFAULT 'business'::character varying;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'non_minority_owned'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN non_minority_owned boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'website'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN website character varying(500);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wishlist_items' AND column_name = 'location'
  ) THEN
    ALTER TABLE IF EXISTS public.wishlist_items ADD COLUMN location character varying(255);
  END IF;
END $$;

-- ── SECTION 5: Indexes (CREATE INDEX IF NOT EXISTS) ────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS badge_helpful_votes_unique ON public.badge_helpful_votes USING btree (badge_id, voter_id);
CREATE UNIQUE INDEX IF NOT EXISTS collection_follows_unique ON public.collection_follows USING btree (user_id, collection_id);
CREATE UNIQUE INDEX IF NOT EXISTS collection_items_unique ON public.collection_items USING btree (collection_id, item_type, item_id);
CREATE INDEX IF NOT EXISTS community_signals_city_signal_idx ON public.community_signals USING btree (city, signal_type);
CREATE INDEX IF NOT EXISTS community_signals_entity_idx ON public.community_signals USING btree (entity_id, entity_type);
CREATE INDEX IF NOT EXISTS community_signals_journey_idx ON public.community_signals USING btree (journey_type, city);
CREATE INDEX IF NOT EXISTS community_signals_user_idx ON public.community_signals USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_article_reads_unique ON public.knowledge_article_reads USING btree (user_id, article_id);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications USING btree (user_id, created_at);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications USING btree (user_id, read);
CREATE UNIQUE INDEX IF NOT EXISTS profile_recommended_spots_user_biz_idx ON public.profile_recommended_spots USING btree (user_id, business_id);
CREATE UNIQUE INDEX IF NOT EXISTS profile_tags_tagger_tagged_idx ON public.profile_tags USING btree (tagger_id, tagged_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS story_confirmations_unique ON public.story_confirmations USING btree (story_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_follows_unique_idx ON public.user_follows USING btree (follower_id, following_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_issue_follows_unique ON public.user_issue_follows USING btree (user_id, issue_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_topic_follows_unique ON public.user_topic_follows USING btree (user_id, topic_id);

-- ── SECTION 6: Verification query ──────────────────────────────────────
-- Run this after the migration to confirm table counts:
SELECT schemaname, count(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
GROUP BY schemaname;