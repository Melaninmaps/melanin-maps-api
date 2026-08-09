/**
 * FEATURE FLAGS — Mapping With Melanin
 *
 * Controls staged activation of the Universal Search + Demand Flywheel features.
 * The code is complete but higher-risk outputs (demand notifications) remain
 * disabled until their acceptance tests pass.
 *
 * To override at runtime set env var FEATURE_FLAGS_JSON='{"universal_search":true,...}'
 */

interface FeatureFlags {
  /** New unified GET /api/search/universal endpoint */
  universal_search: boolean;
  /** Log every search to the search_events table */
  search_event_logging: boolean;
  /** 55 AU country books in Library (Phase 3) */
  library_country_books: boolean;
  /** Auto-create topic shell when Library search finds nothing */
  library_auto_topic_shells: boolean;
  /** Kinfolk uses universal search service for retrieval */
  kinfolk_universal_retrieval: boolean;
  /** Business demand opportunity notifications (requires privacy_aggregation_proven) */
  business_demand_signals: boolean;
  /** Cultural Ambassador demand opportunity notifications */
  ambassador_demand_signals: boolean;
  /** Behavioral affinity ("people looking for similar also liked…") */
  behavioral_affinity: boolean;
  /** Enhanced Sundown Town History display: archive icon + source + persistent preference */
  sundown_history_enhanced: boolean;
}

const DEFAULTS: FeatureFlags = {
  universal_search: true,
  search_event_logging: true,
  library_country_books: false,
  library_auto_topic_shells: false,
  kinfolk_universal_retrieval: false,
  business_demand_signals: false,   // MUST stay false until privacy aggregation proven
  ambassador_demand_signals: false, // MUST stay false until privacy aggregation proven
  behavioral_affinity: false,
  sundown_history_enhanced: false,
};

function loadFlags(): FeatureFlags {
  const raw = process.env.FEATURE_FLAGS_JSON;
  if (!raw) return DEFAULTS;
  try {
    const overrides = JSON.parse(raw) as Partial<FeatureFlags>;
    return { ...DEFAULTS, ...overrides };
  } catch {
    return DEFAULTS;
  }
}

export const FEATURE_FLAGS: Readonly<FeatureFlags> = loadFlags();
