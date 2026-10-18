import {
  communityBusinessIsPublicFunctionIsSafe,
  communityPublicViewDefinitionIsSafe,
} from "./startup-migrations";
import { privatePlacesRuntimeState } from "../kinfolk/private-places-policy";

export const NON_STRICT_STARTUP_SCHEMA_OPERATIONS = [
  "ensureKinfolkPreferredNameSchema",
  "ensureKinfolkQuestionImageSchemaOnly",
  "ensureKinfolkPrivatePlacesSchema",
  "ensureKinfolkTemporaryStaysSchema",
  "ensureDirectoryReconciliationLedgerSchema",
  "ensureFounderMapRestorationSchema",
  "ensureLegacyMapLocationAttestationSchema",
  "ensureInternationalDirectoryOnlyVisibilitySchema",
  "ensureBusinessWebsiteCleanupAuditSchema",
  "ensureAdminBusinessProfileReceiptsAndCatalogSchema",
  "ensureBusinessDeletionHoldSchema",
  "ensureKinfolkCurrentOnlinePresenceReviewSchema",
  "bootstrapDirectoryReviewSchema",
  "ensureRequiredSafetyReportSchema",
] as const;

export const NON_STRICT_PUBLICATION_SCHEMA_OPERATIONS = [
  "ensureRequiredPublicationSchema",
  "ensureCommunityFeedReadSchema",
] as const;

export type NonStrictStartupSchemaOperation =
  (typeof NON_STRICT_STARTUP_SCHEMA_OPERATIONS)[number];
export type NonStrictPublicationSchemaOperation =
  (typeof NON_STRICT_PUBLICATION_SCHEMA_OPERATIONS)[number];

export type StrictFeatureReleaseSchemaReader = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    statement: string,
  ): Promise<{ rows: T[] }>;
};

type RequiredRelation = readonly [
  schema: string,
  relation: string,
  expectedKind?: "r" | "v",
];
type RequiredColumn = readonly [
  schema: string,
  relation: string,
  column: string,
  expectedUdtName?: string,
  expectedNullable?: "YES" | "NO",
];
type RequiredConstraint = readonly [
  schema: string,
  relation: string,
  constraint: string,
  expectedType?: "PRIMARY KEY" | "UNIQUE" | "CHECK" | "FOREIGN KEY",
];
type RequiredIndex = readonly [schema: string, relation: string, index: string];
type RequiredTrigger = readonly [
  schema: string,
  relation: string,
  trigger: string,
  functionName: string,
];
type RequiredFunction = readonly [
  schema: string,
  name: string,
  argumentTypes: string,
  expectedReturnType: string,
  expectedVolatility: "i" | "s" | "v",
  expectedSecurityDefiner: "true" | "false",
];
type RequiredConstraintShape = readonly [
  schema: string,
  relation: string,
  constraint: string,
  requiredTerms: string,
];
type RequiredIndexShape = readonly [
  schema: string,
  relation: string,
  index: string,
  expectedUnique: "true" | "false",
  requiredTerms: string,
];
type RequiredTriggerShape = readonly [
  schema: string,
  relation: string,
  trigger: string,
  requiredTerms: string,
];

const CORE_REQUIRED_RELATIONS: readonly RequiredRelation[] = [
  ["public", "sessions"],
  ["public", "users"],
  ["public", "user_settings"],
  ["public", "kinfolk_private_memories"],
  ["public", "kinfolk_sessions"],
  ["public", "businesses"],
  ["public", "public_businesses", "v"],
  ["public", "safety_reports"],
  ["public", "safety_incidents"],
  ["public", "business_directory_reconciliation_ledger"],
  ["public", "business_map_restoration_outcomes"],
  ["public", "business_legacy_map_location_attestations"],
  ["public", "business_legacy_map_location_attestation_events"],
  ["public", "international_directory_only_visibility_receipts"],
  ["public", "international_directory_only_visibility_audit_events"],
  ["public", "business_website_cleanup_audit_events"],
  ["public", "business_admin_profile_edit_audit_events"],
  ["public", "business_admin_ownership_source_receipts"],
  ["public", "business_profile_field_receipts"],
  ["public", "business_catalog_cohort_memberships"],
  ["public", "business_catalog_cohort_audit_events"],
  ["public", "business_permanent_deletion_audit_events"],
  ["public", "business_deletion_holds"],
  ["public", "business_deletion_hold_events"],
  ["public", "kinfolk_current_online_presence_reviews"],
  ["public", "kinfolk_current_online_presence_review_events"],
  ["public", "business_publication_identities"],
  ["public", "directory_publication_inbox"],
  ["public", "directory_publication_provenance"],
  ["public", "business_duplicate_resolutions"],
  ["public", "business_review_items"],
  ["public", "canonical_record_locations"],
  ["public", "community_business_submissions"],
  ["public", "business_submission_audit_events"],
  ["public", "media_assets"],
  ["public", "community_posts"],
  ["public", "community_post_comments"],
  ["public", "community_post_reactions"],
  ["public", "user_blocks"],
  ["public", "user_follows"],
  ["public", "member_connections"],
  ["public", "business_discovery_eligibility"],
  ["public", "business_discovery_eligibility_audit_events"],
  ["public", "business_profile_evidence_receipts"],
  ["public", "business_directory_reconciliation_audit_events"],
  ["public", "business_source_directory_receipts"],
];

const CORE_REQUIRED_COLUMNS: readonly RequiredColumn[] = [
  ["public", "user_settings", "user_id"],
  ["public", "user_settings", "kinfolk_memory_enabled"],
  ["public", "user_settings", "kinfolk_continuity_enabled"],
  ["public", "user_settings", "kinfolk_continuity_updated_at"],
  ["public", "user_settings", "kinfolk_continuity_disclosure_decision"],
  ["public", "user_settings", "kinfolk_continuity_disclosure_version"],
  ["public", "user_settings", "kinfolk_continuity_disclosed_at"],
  ["public", "user_settings", "safety_alert_police"],
  ["public", "user_settings", "safety_alert_ice"],
  ["public", "user_settings", "safety_alert_radius_miles"],
  ["public", "user_settings", "updated_at"],
  ["public", "kinfolk_private_memories", "id"],
  ["public", "kinfolk_private_memories", "user_id"],
  ["public", "kinfolk_private_memories", "content"],
  ["public", "kinfolk_private_memories", "purpose"],
  ["public", "kinfolk_private_memories", "consent_granted_at"],
  ["public", "kinfolk_private_memories", "sensitive_consent_granted_at"],
  ["public", "kinfolk_private_memories", "expires_at"],
  ["public", "kinfolk_private_memories", "paused_at"],
  ["public", "kinfolk_private_memories", "revoked_at"],
  ["public", "businesses", "id"],
  ["public", "businesses", "name"],
  ["public", "businesses", "status"],
  ["public", "businesses", "listing_status"],
  ["public", "businesses", "is_duplicate"],
  ["public", "businesses", "permanently_hidden"],
  ["public", "businesses", "data_source"],
  ["public", "businesses", "phone"],
  ["public", "public_businesses", "id"],
  ["public", "public_businesses", "name"],
  ["public", "public_businesses", "status"],
  ["public", "public_businesses", "listing_status"],
  ["public", "public_businesses", "founding_business"],
  ["public", "public_businesses", "confidence_score"],
  ["public", "safety_reports", "encounter_type"],
  ["public", "safety_reports", "incident_city"],
  ["public", "safety_reports", "incident_region"],
  ["public", "safety_reports", "incident_area"],
  ["public", "safety_reports", "incident_location_source"],
  ["public", "safety_reports", "incident_location_precision"],
  ["public", "safety_incidents", "region"],
  ["public", "business_directory_reconciliation_ledger", "business_id"],
  ["public", "business_directory_reconciliation_ledger", "reconciliation_state"],
  ["public", "business_directory_reconciliation_ledger", "reason_code"],
  ["public", "business_directory_reconciliation_ledger", "recommended_action"],
  ["public", "business_map_restoration_outcomes", "business_id"],
  ["public", "business_map_restoration_outcomes", "policy_version"],
  ["public", "business_map_restoration_outcomes", "outcome"],
  ["public", "business_map_restoration_outcomes", "reason"],
  ["public", "international_directory_only_visibility_receipts", "business_id"],
  ["public", "international_directory_only_visibility_receipts", "valid_until"],
  ["public", "international_directory_only_visibility_receipts", "revoked_at"],
  ["public", "international_directory_only_visibility_audit_events", "business_id"],
  ["public", "international_directory_only_visibility_audit_events", "action"],
  ["public", "business_website_cleanup_audit_events", "business_id"],
  ["public", "business_website_cleanup_audit_events", "cleanup_status"],
  ["public", "businesses", "website_cleanup_status"],
  ["public", "businesses", "website_cleanup_at"],
  ["public", "business_profile_field_receipts", "business_id"],
  ["public", "business_profile_field_receipts", "field_name"],
  ["public", "business_profile_field_receipts", "source_url"],
  ["public", "business_catalog_cohort_memberships", "business_id"],
  ["public", "business_catalog_cohort_memberships", "state"],
  ["public", "business_catalog_cohort_memberships", "reason"],
  ["public", "business_catalog_cohort_audit_events", "business_id"],
  ["public", "business_catalog_cohort_audit_events", "action"],
  ["public", "business_catalog_cohort_audit_events", "after_state"],
  ["public", "business_deletion_holds", "business_id"],
  ["public", "business_deletion_holds", "state"],
  ["public", "business_deletion_holds", "delete_after"],
  ["public", "business_deletion_hold_events", "business_id"],
  ["public", "business_deletion_hold_events", "action"],
  ["public", "kinfolk_current_online_presence_reviews", "business_id"],
  ["public", "kinfolk_current_online_presence_reviews", "state"],
  ["public", "kinfolk_current_online_presence_reviews", "verification_evidence"],
  ["public", "kinfolk_current_online_presence_review_events", "business_id"],
  ["public", "kinfolk_current_online_presence_review_events", "action"],
  ["public", "business_publication_identities", "identity_key"],
  ["public", "business_publication_identities", "business_id"],
  ["public", "directory_publication_inbox", "event_key"],
  ["public", "directory_publication_provenance", "event_key"],
  ["public", "business_duplicate_resolutions", "canonical_business_id"],
  ["public", "business_duplicate_resolutions", "superseded_business_id"],
  ["public", "community_posts", "id"],
  ["public", "community_posts", "author_id"],
  ["public", "community_posts", "content"],
  ["public", "community_post_comments", "post_id"],
  ["public", "community_post_reactions", "post_id"],
  ["public", "community_post_reactions", "user_id"],
  ["public", "user_blocks", "blocker_id"],
  ["public", "user_blocks", "blocked_id"],
  ["public", "user_follows", "follower_id"],
  ["public", "user_follows", "following_id"],
  ["public", "user_follows", "status"],
  ["public", "member_connections", "requester_id"],
  ["public", "member_connections", "recipient_id"],
  ["public", "member_connections", "status"],
  ["public", "business_discovery_eligibility", "business_id"],
  ["public", "business_discovery_eligibility", "eligibility_status"],
  ["public", "business_discovery_eligibility", "policy_version"],
  ["public", "business_discovery_eligibility", "ownership_evidence_id"],
  ["public", "business_discovery_eligibility", "official_website_evidence_id"],
  ["public", "business_discovery_eligibility", "official_social_evidence_id"],
  ["public", "business_discovery_eligibility", "ownership_source_expires_at"],
  ["public", "business_discovery_eligibility", "review_after"],
  ["public", "business_discovery_eligibility", "map_pin_evidence_id"],
  ["public", "business_profile_evidence_receipts", "business_id"],
  ["public", "business_directory_reconciliation_audit_events", "business_id"],
  ["public", "business_source_directory_receipts", "business_id"],
];

const CORE_REQUIRED_TYPED_COLUMNS: readonly RequiredColumn[] = [
  ["public", "user_settings", "user_id", "varchar", "NO"],
  ["public", "user_settings", "kinfolk_memory_enabled", "bool", "NO"],
  ["public", "user_settings", "kinfolk_continuity_enabled", "bool", "NO"],
  ["public", "user_settings", "kinfolk_continuity_updated_at", "timestamptz", "YES"],
  ["public", "user_settings", "kinfolk_continuity_disclosure_decision", "varchar", "YES"],
  ["public", "user_settings", "kinfolk_continuity_disclosure_version", "varchar", "YES"],
  ["public", "user_settings", "kinfolk_continuity_disclosed_at", "timestamptz", "YES"],
  ["public", "kinfolk_private_memories", "id", "varchar", "NO"],
  ["public", "kinfolk_private_memories", "user_id", "varchar", "NO"],
  ["public", "kinfolk_private_memories", "consent_granted_at", "timestamptz", "NO"],
  ["public", "kinfolk_private_memories", "paused_at", "timestamptz", "YES"],
  ["public", "kinfolk_private_memories", "revoked_at", "timestamptz", "YES"],
  ["public", "business_discovery_eligibility", "business_id", "varchar", "NO"],
  ["public", "business_discovery_eligibility", "eligibility_status", "text", "NO"],
  ["public", "business_discovery_eligibility", "policy_version", "text", "NO"],
  ["public", "business_discovery_eligibility", "ownership_source_expires_at", "timestamptz", "YES"],
  ["public", "business_discovery_eligibility", "review_after", "timestamptz", "YES"],
];

const CORE_REQUIRED_CONSTRAINTS: readonly RequiredConstraint[] = [
  ["public", "user_settings", "user_settings_kinfolk_continuity_disclosure_decision_check", "CHECK"],
  ["public", "kinfolk_private_memories", "kinfolk_private_memories_pkey", "PRIMARY KEY"],
  ["public", "businesses", "businesses_pkey", "PRIMARY KEY"],
  ["public", "business_deletion_holds", "business_deletion_holds_pkey", "PRIMARY KEY"],
  ["public", "kinfolk_current_online_presence_reviews", "kinfolk_current_online_presence_reviews_pkey", "PRIMARY KEY"],
  ["public", "kinfolk_current_online_presence_review_events", "kinfolk_current_online_presence_review_events_pkey", "PRIMARY KEY"],
  ["public", "business_discovery_eligibility", "business_discovery_eligibility_pkey", "PRIMARY KEY"],
  ["public", "business_discovery_eligibility_audit_events", "business_discovery_eligibility_audit_events_pkey", "PRIMARY KEY"],
  ["public", "business_directory_reconciliation_ledger", "business_directory_reconciliation_ledger_pkey", "PRIMARY KEY"],
  ["public", "business_directory_reconciliation_audit_events", "business_directory_reconciliation_audit_events_pkey", "PRIMARY KEY"],
  ["public", "business_discovery_eligibility", "business_discovery_eligibility_check", "CHECK"],
];

const CORE_REQUIRED_INDEXES: readonly RequiredIndex[] = [
  ["public", "kinfolk_sessions", "kinfolk_sessions_owner_continuity_idx"],
  ["public", "business_deletion_holds", "business_deletion_holds_due_idx"],
  ["public", "kinfolk_current_online_presence_reviews", "kinfolk_current_online_presence_reviews_state_queued_idx"],
  ["public", "businesses", "businesses_canonical_dedupe_key_unique"],
  ["public", "canonical_record_locations", "canonical_record_locations_unique_idx"],
  ["public", "community_business_submissions", "idx_community_business_submissions_owner_request"],
  ["public", "business_discovery_eligibility", "business_discovery_eligibility_qualified_idx"],
  ["public", "business_discovery_eligibility_audit_events", "business_discovery_eligibility_audit_events_business_idx"],
  ["public", "business_profile_evidence_receipts", "business_profile_evidence_receipts_source_field_idx"],
  ["public", "business_source_directory_receipts", "business_source_directory_receipts_business_idx"],
  ["public", "business_directory_reconciliation_ledger", "business_directory_reconciliation_state_reason_idx"],
  ["public", "business_directory_reconciliation_audit_events", "business_directory_reconciliation_audit_events_business_idx"],
];

const CORE_REQUIRED_TRIGGERS: readonly RequiredTrigger[] = [
  ["public", "business_deletion_hold_events", "business_deletion_hold_events_immutable", "prevent_business_deletion_hold_event_mutation"],
  ["public", "businesses", "businesses_prevent_queued_kinfolk_current_review_deletion", "prevent_queued_kinfolk_current_review_deletion"],
  ["public", "businesses", "businesses_prevent_queued_kinfolk_current_review_lifecycle_muta", "prevent_queued_kinfolk_current_review_lifecycle_mutation"],
  ["public", "kinfolk_current_online_presence_review_events", "kinfolk_current_online_presence_review_event_mutation", "prevent_kinfolk_current_online_presence_review_event_mutation"],
  ["public", "business_discovery_eligibility_audit_events", "business_discovery_eligibility_audit_immutable", "prevent_business_discovery_eligibility_audit_mutation"],
  ["public", "business_profile_evidence_receipts", "business_profile_evidence_receipts_stored_address_immutable", "prevent_stored_address_evidence_receipt_mutation"],
  ["public", "business_directory_reconciliation_audit_events", "business_directory_reconciliation_audit_immutable", "prevent_business_directory_reconciliation_audit_mutation"],
  ["public", "businesses", "business_directory_reconciliation_ledger_seed", "seed_business_directory_reconciliation_ledger"],
];

const CORE_REQUIRED_FUNCTIONS: readonly RequiredFunction[] = [
  [
    "public",
    "business_record_is_public",
    "text,text,boolean,boolean,text,text,text,text",
    "boolean",
    "i",
    "false",
  ],
];

const CORE_REQUIRED_CONSTRAINT_SHAPES: readonly RequiredConstraintShape[] = [
  ["public", "user_settings", "user_settings_kinfolk_continuity_disclosure_decision_check", "kinfolk_continuity_disclosure_decision|accepted|declined"],
  ["public", "kinfolk_private_memories", "kinfolk_private_memories_pkey", "primary key|id"],
  ["public", "businesses", "businesses_pkey", "primary key|id"],
  ["public", "business_deletion_holds", "business_deletion_holds_pkey", "primary key|id"],
  ["public", "kinfolk_current_online_presence_reviews", "kinfolk_current_online_presence_reviews_pkey", "primary key|id"],
  ["public", "kinfolk_current_online_presence_review_events", "kinfolk_current_online_presence_review_events_pkey", "primary key|id"],
  ["public", "business_discovery_eligibility", "business_discovery_eligibility_pkey", "primary key|business_id"],
  ["public", "business_discovery_eligibility_audit_events", "business_discovery_eligibility_audit_events_pkey", "primary key|id"],
  ["public", "business_directory_reconciliation_ledger", "business_directory_reconciliation_ledger_pkey", "primary key|business_id"],
  ["public", "business_directory_reconciliation_audit_events", "business_directory_reconciliation_audit_events_pkey", "primary key|id"],
  ["public", "business_discovery_eligibility", "business_discovery_eligibility_check", "eligibility_status|qualified|ownership_evidence_id is not null|jsonb_array_length|ownership_source_expires_at is not null|review_after is not null|official_website_evidence_id is not null|official_social_evidence_id is not null|policy_version|founder_source_directory_ownership_v1|identity_evidence_id is not null"],
];

const CORE_REQUIRED_INDEX_SHAPES: readonly RequiredIndexShape[] = [
  ["public", "kinfolk_sessions", "kinfolk_sessions_owner_continuity_idx", "false", "user_id|continuity_enabled|updated_at desc"],
  ["public", "business_deletion_holds", "business_deletion_holds_due_idx", "false", "state|delete_after|where|pending"],
  ["public", "kinfolk_current_online_presence_reviews", "kinfolk_current_online_presence_reviews_state_queued_idx", "false", "state|queued_at desc"],
  ["public", "businesses", "businesses_canonical_dedupe_key_unique", "true", "dedupe_key|where|is_duplicate|duplicate|permanently_hidden|removed|deleted"],
  ["public", "canonical_record_locations", "canonical_record_locations_unique_idx", "true", "record_type|record_id|city_name|state_code|neighborhood_name"],
  ["public", "community_business_submissions", "idx_community_business_submissions_owner_request", "true", "submitted_by_id|client_request_id|where"],
  ["public", "business_discovery_eligibility", "business_discovery_eligibility_qualified_idx", "false", "eligibility_status|ownership_source_expires_at|review_after"],
  ["public", "business_discovery_eligibility_audit_events", "business_discovery_eligibility_audit_events_business_idx", "false", "business_id|created_at desc"],
  ["public", "business_source_directory_receipts", "business_source_directory_receipts_business_idx", "false", "business_id|observed_at desc"],
  ["public", "business_directory_reconciliation_audit_events", "business_directory_reconciliation_audit_events_business_idx", "false", "business_id|created_at desc"],
  ["public", "business_profile_evidence_receipts", "business_profile_evidence_receipts_source_field_idx", "true", "business_id|field_name|source_sha256|where|source_sha256 is not null"],
  ["public", "business_directory_reconciliation_ledger", "business_directory_reconciliation_state_reason_idx", "false", "reconciliation_state|reason_code|updated_at desc"],
];

const CORE_REQUIRED_TRIGGER_SHAPES: readonly RequiredTriggerShape[] = [
  ["public", "business_deletion_hold_events", "business_deletion_hold_events_immutable", "before delete or update|for each row|prevent_business_deletion_hold_event_mutation"],
  ["public", "businesses", "businesses_prevent_queued_kinfolk_current_review_deletion", "before delete|for each row|prevent_queued_kinfolk_current_review_deletion"],
  ["public", "businesses", "businesses_prevent_queued_kinfolk_current_review_lifecycle_muta", "before update of listing_status, status, promotion_eligible, featured, promoted_until|for each row|prevent_queued_kinfolk_current_review_lifecycle_mutation"],
  ["public", "kinfolk_current_online_presence_review_events", "kinfolk_current_online_presence_review_event_mutation", "before delete or update|for each row|prevent_kinfolk_current_online_presence_review_event_mutation"],
  ["public", "business_discovery_eligibility_audit_events", "business_discovery_eligibility_audit_immutable", "before delete or update|for each row|prevent_business_discovery_eligibility_audit_mutation"],
  ["public", "business_profile_evidence_receipts", "business_profile_evidence_receipts_stored_address_immutable", "before delete or update|for each row|prevent_stored_address_evidence_receipt_mutation"],
  ["public", "business_directory_reconciliation_audit_events", "business_directory_reconciliation_audit_immutable", "before delete or update|for each row|prevent_business_directory_reconciliation_audit_mutation"],
  ["public", "businesses", "business_directory_reconciliation_ledger_seed", "after insert|for each row|seed_business_directory_reconciliation_ledger"],
];

const PRIVATE_PLACE_RELATIONS: readonly RequiredRelation[] = [
  ["public", "kinfolk_private_places"],
  ["public", "kinfolk_private_place_events"],
  ["public", "kinfolk_temporary_stays"],
];

const PRIVATE_PLACE_COLUMNS: readonly RequiredColumn[] = [
  ["public", "kinfolk_private_places", "id", "uuid", "NO"],
  ["public", "kinfolk_private_places", "user_id", "varchar", "NO"],
  ["public", "kinfolk_private_places", "label", "varchar", "NO"],
  ["public", "kinfolk_private_places", "encrypted_payload", "text", "NO"],
  ["public", "kinfolk_private_places", "encryption_key_version", "varchar", "NO"],
  ["public", "kinfolk_private_places", "geocode_provider", "varchar", "NO"],
  ["public", "kinfolk_private_places", "geocoded_at", "timestamptz", "NO"],
  ["public", "kinfolk_private_places", "disclosure_version", "varchar", "NO"],
  ["public", "kinfolk_private_places", "is_active", "bool", "NO"],
  ["public", "kinfolk_private_places", "created_at", "timestamptz", "NO"],
  ["public", "kinfolk_private_places", "updated_at", "timestamptz", "NO"],
  ["public", "kinfolk_private_place_events", "id", "uuid", "NO"],
  ["public", "kinfolk_private_place_events", "private_place_id", "uuid", "NO"],
  ["public", "kinfolk_private_place_events", "user_id", "varchar", "NO"],
  ["public", "kinfolk_private_place_events", "action", "varchar", "NO"],
  ["public", "kinfolk_private_place_events", "occurred_at", "timestamptz", "NO"],
  ["public", "kinfolk_temporary_stays", "id", "uuid", "NO"],
  ["public", "kinfolk_temporary_stays", "user_id", "varchar", "NO"],
  ["public", "kinfolk_temporary_stays", "label", "varchar", "NO"],
  ["public", "kinfolk_temporary_stays", "encrypted_payload", "text", "NO"],
  ["public", "kinfolk_temporary_stays", "encryption_key_version", "varchar", "NO"],
  ["public", "kinfolk_temporary_stays", "geocode_provider", "varchar", "NO"],
  ["public", "kinfolk_temporary_stays", "geocoded_at", "timestamptz", "NO"],
  ["public", "kinfolk_temporary_stays", "disclosure_version", "varchar", "NO"],
  ["public", "kinfolk_temporary_stays", "is_active", "bool", "NO"],
  ["public", "kinfolk_temporary_stays", "created_at", "timestamptz", "NO"],
  ["public", "kinfolk_temporary_stays", "updated_at", "timestamptz", "NO"],
];

const PRIVATE_PLACE_CONSTRAINTS: readonly RequiredConstraint[] = [
  ["public", "kinfolk_private_places", "kinfolk_private_places_pkey", "PRIMARY KEY"],
  ["public", "kinfolk_private_places", "kinfolk_private_places_owner_label_key", "UNIQUE"],
  ["public", "kinfolk_private_places", "kinfolk_private_places_encrypted_payload_check", "CHECK"],
  ["public", "kinfolk_private_places", "kinfolk_private_places_user_id_fkey", "FOREIGN KEY"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_pkey", "PRIMARY KEY"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_private_place_id_fkey", "FOREIGN KEY"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_user_id_fkey", "FOREIGN KEY"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_action_check", "CHECK"],
  ["public", "kinfolk_temporary_stays", "kinfolk_temporary_stays_pkey", "PRIMARY KEY"],
  ["public", "kinfolk_temporary_stays", "kinfolk_temporary_stays_owner_label_key", "UNIQUE"],
  ["public", "kinfolk_temporary_stays", "kinfolk_temporary_stays_encrypted_payload_check", "CHECK"],
  ["public", "kinfolk_temporary_stays", "kinfolk_temporary_stays_user_id_fkey", "FOREIGN KEY"],
];

const PRIVATE_PLACE_INDEXES: readonly RequiredIndex[] = [
  ["public", "kinfolk_private_places", "kinfolk_private_places_owner_active_idx"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_owner_idx"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_place_idx"],
  ["public", "kinfolk_temporary_stays", "kinfolk_temporary_stays_owner_active_idx"],
];

const PRIVATE_PLACE_FORBIDDEN_COLUMNS: readonly RequiredColumn[] = [
  ["public", "kinfolk_private_places", "exact_address"],
  ["public", "kinfolk_private_places", "address"],
  ["public", "kinfolk_private_places", "latitude"],
  ["public", "kinfolk_private_places", "longitude"],
  ["public", "kinfolk_private_places", "formatted_address"],
  ["public", "kinfolk_private_places", "google_formatted_address"],
  ["public", "kinfolk_temporary_stays", "exact_address"],
  ["public", "kinfolk_temporary_stays", "address"],
  ["public", "kinfolk_temporary_stays", "latitude"],
  ["public", "kinfolk_temporary_stays", "longitude"],
  ["public", "kinfolk_temporary_stays", "formatted_address"],
  ["public", "kinfolk_temporary_stays", "google_formatted_address"],
];

const PRIVATE_PLACE_CONSTRAINT_SHAPES: readonly RequiredConstraintShape[] = [
  ["public", "kinfolk_private_places", "kinfolk_private_places_owner_label_key", "unique|user_id|label"],
  ["public", "kinfolk_private_places", "kinfolk_private_places_encrypted_payload_check", "char_length|encrypted_payload|32"],
  ["public", "kinfolk_private_places", "kinfolk_private_places_user_id_fkey", "foreign key|user_id|references users|on delete cascade"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_private_place_id_fkey", "foreign key|private_place_id|references kinfolk_private_places|on delete cascade"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_user_id_fkey", "foreign key|user_id|references users|on delete cascade"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_action_check", "action|created|updated|deactivated|reactivated"],
  ["public", "kinfolk_temporary_stays", "kinfolk_temporary_stays_owner_label_key", "unique|user_id|label"],
  ["public", "kinfolk_temporary_stays", "kinfolk_temporary_stays_encrypted_payload_check", "char_length|encrypted_payload|32"],
  ["public", "kinfolk_temporary_stays", "kinfolk_temporary_stays_user_id_fkey", "foreign key|user_id|references users|on delete cascade"],
];

const PRIVATE_PLACE_INDEX_SHAPES: readonly RequiredIndexShape[] = [
  ["public", "kinfolk_private_places", "kinfolk_private_places_owner_active_idx", "false", "user_id|is_active|updated_at desc"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_owner_idx", "false", "user_id|occurred_at desc"],
  ["public", "kinfolk_private_place_events", "kinfolk_private_place_events_place_idx", "false", "private_place_id|occurred_at desc"],
  ["public", "kinfolk_temporary_stays", "kinfolk_temporary_stays_owner_active_idx", "false", "user_id|is_active|updated_at desc"],
];

const QUESTION_IMAGE_RELATIONS: readonly RequiredRelation[] = [
  ["public", "media_assets"],
];

const QUESTION_IMAGE_COLUMNS: readonly RequiredColumn[] = [
  ["public", "media_assets", "vision_consent_granted_at"],
  ["public", "media_assets", "retention_expires_at"],
  ["public", "media_assets", "deleted_at"],
];

export type StrictFeatureReleaseSchemaRequirements = {
  requireQuestionImageSchema: boolean;
  requirePrivatePlacesSchema: boolean;
};

export function strictFeatureReleaseSchemaRequirementsFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): StrictFeatureReleaseSchemaRequirements {
  return {
    requireQuestionImageSchema: Boolean(environment.KINFOLK_MEDIA_BUCKET_ID?.trim()),
    requirePrivatePlacesSchema: privatePlacesRuntimeState(environment).enabled,
  };
}

function sqlLiteral(value: string | undefined): string {
  return value === undefined ? "NULL" : `'${value}'`;
}

function literalRows(rows: readonly (readonly (string | undefined)[])[]): string {
  return rows
    .map((row) => `(${row.map(sqlLiteral).join(", ")})`)
    .join(",\n      ");
}

type SchemaContract = {
  relations: readonly RequiredRelation[];
  columns: readonly RequiredColumn[];
  exactColumnRelations: readonly RequiredRelation[];
  forbiddenColumns: readonly RequiredColumn[];
  constraints: readonly RequiredConstraint[];
  constraintShapes: readonly RequiredConstraintShape[];
  indexes: readonly RequiredIndex[];
  indexShapes: readonly RequiredIndexShape[];
  triggers: readonly RequiredTrigger[];
  triggerShapes: readonly RequiredTriggerShape[];
  functions: readonly RequiredFunction[];
};

function strictReleaseSchemaContract(
  requirements: StrictFeatureReleaseSchemaRequirements,
): SchemaContract {
  const relations = [...CORE_REQUIRED_RELATIONS];
  const columns = [...CORE_REQUIRED_COLUMNS, ...CORE_REQUIRED_TYPED_COLUMNS];
  const exactColumnRelations: RequiredRelation[] = [];
  const forbiddenColumns: RequiredColumn[] = [];
  const constraints = [...CORE_REQUIRED_CONSTRAINTS];
  const constraintShapes = [...CORE_REQUIRED_CONSTRAINT_SHAPES];
  const indexes = [...CORE_REQUIRED_INDEXES];
  const indexShapes = [...CORE_REQUIRED_INDEX_SHAPES];

  if (requirements.requireQuestionImageSchema) {
    relations.push(...QUESTION_IMAGE_RELATIONS);
    columns.push(...QUESTION_IMAGE_COLUMNS);
  }

  if (requirements.requirePrivatePlacesSchema) {
    relations.push(...PRIVATE_PLACE_RELATIONS);
    columns.push(...PRIVATE_PLACE_COLUMNS);
    exactColumnRelations.push(...PRIVATE_PLACE_RELATIONS);
    forbiddenColumns.push(...PRIVATE_PLACE_FORBIDDEN_COLUMNS);
    constraints.push(...PRIVATE_PLACE_CONSTRAINTS);
    constraintShapes.push(...PRIVATE_PLACE_CONSTRAINT_SHAPES);
    indexes.push(...PRIVATE_PLACE_INDEXES);
    indexShapes.push(...PRIVATE_PLACE_INDEX_SHAPES);
  }

  return {
    relations,
    columns,
    exactColumnRelations,
    forbiddenColumns,
    constraints,
    constraintShapes,
    indexes,
    indexShapes,
    triggers: CORE_REQUIRED_TRIGGERS,
    triggerShapes: CORE_REQUIRED_TRIGGER_SHAPES,
    functions: CORE_REQUIRED_FUNCTIONS,
  };
}

export type StrictFeatureReleaseSchemaStatus = {
  missing_relations: string[] | null;
  invalid_relation_kinds: string[] | null;
  missing_columns: string[] | null;
  unexpected_columns: string[] | null;
  present_forbidden_columns: string[] | null;
  invalid_columns: string[] | null;
  missing_constraints: string[] | null;
  malformed_constraints: string[] | null;
  missing_indexes: string[] | null;
  malformed_indexes: string[] | null;
  missing_triggers: string[] | null;
  malformed_triggers: string[] | null;
  missing_functions: string[] | null;
  invalid_functions: string[] | null;
  public_view_definition?: string | null;
  public_function_definition?: string | null;
  public_function_immutable?: boolean | null;
  public_function_security_definer?: boolean | null;
  public_function_returns_boolean?: boolean | null;
};

const DIRECTORY_REVIEW_SCHEMA_CONTRACT: SchemaContract = {
  relations: [
    ["public", "directory_import_batches", "r"],
    ["public", "directory_import_candidates", "r"],
    ["public", "directory_import_decision_events", "r"],
    ["public", "directory_review_outbox", "r"],
    ["public", "directory_review_acknowledgements", "r"],
  ],
  columns: [
    ["public", "directory_import_batches", "id", "uuid", "NO"],
    ["public", "directory_import_batches", "source_sha256", "text", "NO"],
    ["public", "directory_import_batches", "status", "text", "NO"],
    ["public", "directory_import_candidates", "id", "uuid", "NO"],
    ["public", "directory_import_candidates", "batch_id", "uuid", "NO"],
    ["public", "directory_import_candidates", "status", "text", "NO"],
    ["public", "directory_import_decision_events", "id", "uuid", "NO"],
    ["public", "directory_import_decision_events", "candidate_id", "uuid", "NO"],
    ["public", "directory_import_decision_events", "idempotency_key", "text", "NO"],
    ["public", "directory_review_outbox", "id", "uuid", "NO"],
    ["public", "directory_review_outbox", "event_key", "text", "NO"],
    ["public", "directory_review_outbox", "payload", "jsonb", "NO"],
    ["public", "directory_review_outbox", "status", "text", "NO"],
    ["public", "directory_review_outbox", "attempts", "int4", "NO"],
    ["public", "directory_review_outbox", "available_at", "timestamptz", "NO"],
    ["public", "directory_review_outbox", "lease_token", "text", "YES"],
    ["public", "directory_review_outbox", "lease_until", "timestamptz", "YES"],
    ["public", "directory_review_acknowledgements", "event_key", "text", "NO"],
    ["public", "directory_review_acknowledgements", "payload_hash", "text", "NO"],
    ["public", "directory_review_acknowledgements", "status", "text", "NO"],
  ],
  exactColumnRelations: [],
  forbiddenColumns: [],
  constraints: [
    ["public", "directory_import_batches", "directory_import_batches_pkey", "PRIMARY KEY"],
    ["public", "directory_import_batches", "directory_import_batches_source_sha256_key", "UNIQUE"],
    ["public", "directory_import_candidates", "directory_import_candidates_pkey", "PRIMARY KEY"],
    ["public", "directory_import_candidates", "directory_import_candidates_batch_id_source_row_key", "UNIQUE"],
    ["public", "directory_import_decision_events", "directory_import_decision_events_pkey", "PRIMARY KEY"],
    ["public", "directory_import_decision_events", "directory_import_decision_events_idempotency_key_key", "UNIQUE"],
    ["public", "directory_review_outbox", "directory_review_outbox_pkey", "PRIMARY KEY"],
    ["public", "directory_review_outbox", "directory_review_outbox_event_key_key", "UNIQUE"],
    ["public", "directory_review_outbox", "directory_review_outbox_status_check", "CHECK"],
    ["public", "directory_review_acknowledgements", "directory_review_acknowledgements_pkey", "PRIMARY KEY"],
    ["public", "directory_review_acknowledgements", "directory_review_acknowledgements_status_check", "CHECK"],
  ],
  constraintShapes: [
    ["public", "directory_import_batches", "directory_import_batches_pkey", "primary key|id"],
    ["public", "directory_import_batches", "directory_import_batches_source_sha256_key", "unique|source_sha256"],
    ["public", "directory_import_candidates", "directory_import_candidates_pkey", "primary key|id"],
    ["public", "directory_import_candidates", "directory_import_candidates_batch_id_source_row_key", "unique|batch_id|source_row"],
    ["public", "directory_import_decision_events", "directory_import_decision_events_pkey", "primary key|id"],
    ["public", "directory_import_decision_events", "directory_import_decision_events_idempotency_key_key", "unique|idempotency_key"],
    ["public", "directory_review_outbox", "directory_review_outbox_pkey", "primary key|id"],
    ["public", "directory_review_outbox", "directory_review_outbox_event_key_key", "unique|event_key"],
    ["public", "directory_review_outbox", "directory_review_outbox_status_check", "status|pending|sending|sent|failed"],
    ["public", "directory_review_acknowledgements", "directory_review_acknowledgements_pkey", "primary key|event_key"],
    ["public", "directory_review_acknowledgements", "directory_review_acknowledgements_status_check", "status|accepted|rejected"],
  ],
  indexes: [
    ["public", "directory_review_outbox", "directory_review_outbox_ready"],
  ],
  indexShapes: [
    ["public", "directory_review_outbox", "directory_review_outbox_ready", "false", "available_at|created_at|where|status|pending|failed"],
  ],
  triggers: [],
  triggerShapes: [],
  functions: [],
};

/**
 * Verifies the release's active request-path structures without creating,
 * altering, backfilling, seeding, or repairing anything. Every statement in
 * this preflight is a catalog-only SELECT so a strict release fails closed when
 * staging is incompatible rather than silently changing the database.
 */
async function verifyReadOnlySchemaContract(
  reader: StrictFeatureReleaseSchemaReader,
  contract: SchemaContract,
  description: string,
): Promise<void> {
  const result = await reader.query<StrictFeatureReleaseSchemaStatus>(`
    WITH required_relations(schema_name, relation_name, expected_relkind) AS (
      VALUES
      ${literalRows(contract.relations.map(([schema, relation, kind]) => [schema, relation, kind ?? "r"]))}
    ),
    required_columns(schema_name, relation_name, column_name, expected_udt_name, expected_is_nullable) AS (
      VALUES
      ${literalRows(contract.columns.map(([schema, relation, column, udtName, nullable]) => [schema, relation, column, udtName, nullable]))}
    ),
    exact_column_relations(schema_name, relation_name) AS (
      ${contract.exactColumnRelations.length > 0
        ? `VALUES\n      ${literalRows(contract.exactColumnRelations.map(([schema, relation]) => [schema, relation]))}`
        : "SELECT NULL::text, NULL::text WHERE false"}
    ),
    forbidden_columns(schema_name, relation_name, column_name) AS (
      ${contract.forbiddenColumns.length > 0
        ? `VALUES\n      ${literalRows(contract.forbiddenColumns.map(([schema, relation, column]) => [schema, relation, column]))}`
        : "SELECT NULL::text, NULL::text, NULL::text WHERE false"}
    ),
    required_constraints(schema_name, relation_name, constraint_name, expected_constraint_type) AS (
      VALUES
      ${literalRows(contract.constraints)}
    ),
    required_constraint_shapes(schema_name, relation_name, constraint_name, required_terms) AS (
      ${contract.constraintShapes.length > 0
        ? `VALUES\n      ${literalRows(contract.constraintShapes)}`
        : "SELECT NULL::text, NULL::text, NULL::text, NULL::text WHERE false"}
    ),
    required_indexes(schema_name, relation_name, index_name) AS (
      VALUES
      ${literalRows(contract.indexes)}
    ),
    required_index_shapes(schema_name, relation_name, index_name, expected_unique, required_terms) AS (
      ${contract.indexShapes.length > 0
        ? `VALUES\n      ${literalRows(contract.indexShapes)}`
        : "SELECT NULL::text, NULL::text, NULL::text, NULL::text, NULL::text WHERE false"}
    ),
    required_triggers(schema_name, relation_name, trigger_name, function_name) AS (
      ${contract.triggers.length > 0
        ? `VALUES\n      ${literalRows(contract.triggers)}`
        : "SELECT NULL::text, NULL::text, NULL::text, NULL::text WHERE false"}
    ),
    required_trigger_shapes(schema_name, relation_name, trigger_name, required_terms) AS (
      ${contract.triggerShapes.length > 0
        ? `VALUES\n      ${literalRows(contract.triggerShapes)}`
        : "SELECT NULL::text, NULL::text, NULL::text, NULL::text WHERE false"}
    ),
    required_functions(schema_name, function_name, argument_types, expected_return_type, expected_volatility, expected_security_definer) AS (
      ${contract.functions.length > 0
        ? `VALUES\n      ${literalRows(contract.functions)}`
        : "SELECT NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text WHERE false"}
    ),
    missing_relations AS (
      SELECT format('%I.%I', required.schema_name, required.relation_name) AS name
      FROM required_relations AS required
      LEFT JOIN pg_namespace AS namespace ON namespace.nspname = required.schema_name
      LEFT JOIN pg_class AS relation
        ON relation.relnamespace = namespace.oid
       AND relation.relname = required.relation_name
      WHERE relation.oid IS NULL
    ),
    invalid_relation_kinds AS (
      SELECT format('%I.%I expected %s found %s', required.schema_name, required.relation_name, required.expected_relkind, relation.relkind) AS name
      FROM required_relations AS required
      JOIN pg_namespace AS namespace ON namespace.nspname = required.schema_name
      JOIN pg_class AS relation
        ON relation.relnamespace = namespace.oid
       AND relation.relname = required.relation_name
      WHERE relation.relkind::text <> required.expected_relkind
    ),
    missing_columns AS (
      SELECT format('%I.%I.%I', required.schema_name, required.relation_name, required.column_name) AS name
      FROM required_columns AS required
      LEFT JOIN information_schema.columns AS available
        ON available.table_schema = required.schema_name
       AND available.table_name = required.relation_name
       AND available.column_name = required.column_name
      WHERE available.column_name IS NULL
    ),
    invalid_columns AS (
      SELECT format('%I.%I.%I expected type %s nullable %s found type %s nullable %s', required.schema_name, required.relation_name, required.column_name, required.expected_udt_name, required.expected_is_nullable, available.udt_name, available.is_nullable) AS name
      FROM required_columns AS required
      JOIN information_schema.columns AS available
        ON available.table_schema = required.schema_name
       AND available.table_name = required.relation_name
       AND available.column_name = required.column_name
      WHERE (required.expected_udt_name IS NOT NULL AND available.udt_name <> required.expected_udt_name)
         OR (required.expected_is_nullable IS NOT NULL AND available.is_nullable <> required.expected_is_nullable)
    ),
    unexpected_columns AS (
      SELECT format('%I.%I.%I', available.table_schema, available.table_name, available.column_name) AS name
      FROM information_schema.columns AS available
      JOIN exact_column_relations AS exact_relation
        ON exact_relation.schema_name = available.table_schema
       AND exact_relation.relation_name = available.table_name
      LEFT JOIN required_columns AS required
        ON required.schema_name = available.table_schema
       AND required.relation_name = available.table_name
       AND required.column_name = available.column_name
      WHERE required.column_name IS NULL
    ),
    present_forbidden_columns AS (
      SELECT format('%I.%I.%I', forbidden.schema_name, forbidden.relation_name, forbidden.column_name) AS name
      FROM forbidden_columns AS forbidden
      JOIN information_schema.columns AS available
        ON available.table_schema = forbidden.schema_name
       AND available.table_name = forbidden.relation_name
       AND available.column_name = forbidden.column_name
    ),
    missing_constraints AS (
      SELECT format('%I.%I.%I', required.schema_name, required.relation_name, required.constraint_name) AS name
      FROM required_constraints AS required
      LEFT JOIN information_schema.table_constraints AS available
        ON available.table_schema = required.schema_name
       AND available.table_name = required.relation_name
       AND available.constraint_name = required.constraint_name
       AND (required.expected_constraint_type IS NULL OR available.constraint_type = required.expected_constraint_type)
      WHERE available.constraint_name IS NULL
    ),
    malformed_constraints AS (
      SELECT format('%I.%I.%I', required.schema_name, required.relation_name, required.constraint_name) AS name
      FROM required_constraint_shapes AS required
      JOIN pg_namespace AS namespace ON namespace.nspname = required.schema_name
      JOIN pg_class AS relation
        ON relation.relnamespace = namespace.oid
       AND relation.relname = required.relation_name
      JOIN pg_constraint AS constraint_row
        ON constraint_row.conrelid = relation.oid
       AND constraint_row.conname = required.constraint_name
      WHERE constraint_row.convalidated = false
         OR NOT (
           SELECT bool_and(
             position(term IN regexp_replace(lower(pg_get_constraintdef(constraint_row.oid, true)), '\\s+', ' ', 'g')) > 0
           )
           FROM unnest(string_to_array(required.required_terms, '|')) AS term
         )
    ),
    missing_indexes AS (
      SELECT format('%I.%I.%I', required.schema_name, required.relation_name, required.index_name) AS name
      FROM required_indexes AS required
      LEFT JOIN pg_namespace AS namespace ON namespace.nspname = required.schema_name
      LEFT JOIN pg_class AS relation
        ON relation.relnamespace = namespace.oid
       AND relation.relname = required.relation_name
      WHERE NOT EXISTS (
        SELECT 1
        FROM pg_index AS index_meta
        JOIN pg_class AS index_class ON index_class.oid = index_meta.indexrelid
        WHERE index_meta.indrelid = relation.oid
          AND index_class.relname = required.index_name
          AND index_meta.indisvalid = true
          AND index_meta.indisready = true
      )
    ),
    malformed_indexes AS (
      SELECT format('%I.%I.%I', required.schema_name, required.relation_name, required.index_name) AS name
      FROM required_index_shapes AS required
      JOIN pg_namespace AS namespace ON namespace.nspname = required.schema_name
      JOIN pg_class AS relation
        ON relation.relnamespace = namespace.oid
       AND relation.relname = required.relation_name
      JOIN pg_index AS index_meta ON index_meta.indrelid = relation.oid
      JOIN pg_class AS index_class
        ON index_class.oid = index_meta.indexrelid
       AND index_class.relname = required.index_name
      WHERE index_meta.indisvalid = false
         OR index_meta.indisready = false
         OR index_meta.indisunique::text <> required.expected_unique
         OR NOT (
           SELECT bool_and(
             position(term IN regexp_replace(lower(pg_get_indexdef(index_meta.indexrelid)), '\\s+', ' ', 'g')) > 0
           )
           FROM unnest(string_to_array(required.required_terms, '|')) AS term
         )
    ),
    missing_triggers AS (
      SELECT format('%I.%I.%I', required.schema_name, required.relation_name, required.trigger_name) AS name
      FROM required_triggers AS required
      LEFT JOIN pg_namespace AS namespace ON namespace.nspname = required.schema_name
      LEFT JOIN pg_class AS relation
        ON relation.relnamespace = namespace.oid
       AND relation.relname = required.relation_name
      LEFT JOIN pg_trigger AS trigger
        ON trigger.tgrelid = relation.oid
       AND trigger.tgname = required.trigger_name
       AND trigger.tgisinternal = false
      LEFT JOIN pg_proc AS function_proc
        ON function_proc.oid = trigger.tgfoid
       AND function_proc.proname = required.function_name
      WHERE function_proc.oid IS NULL
    ),
    malformed_triggers AS (
      SELECT format('%I.%I.%I', required.schema_name, required.relation_name, required.trigger_name) AS name
      FROM required_trigger_shapes AS required
      JOIN pg_namespace AS namespace ON namespace.nspname = required.schema_name
      JOIN pg_class AS relation
        ON relation.relnamespace = namespace.oid
       AND relation.relname = required.relation_name
      JOIN pg_trigger AS trigger
        ON trigger.tgrelid = relation.oid
       AND trigger.tgname = required.trigger_name
       AND trigger.tgisinternal = false
      WHERE trigger.tgenabled <> 'O'
         OR NOT (
           SELECT bool_and(
             position(term IN regexp_replace(lower(pg_get_triggerdef(trigger.oid, true)), '\\s+', ' ', 'g')) > 0
           )
           FROM unnest(string_to_array(required.required_terms, '|')) AS term
         )
    ),
    missing_functions AS (
      SELECT format('%I.%I(%s)', required.schema_name, required.function_name, required.argument_types) AS name
      FROM required_functions AS required
      WHERE to_regprocedure(format('%I.%I(%s)', required.schema_name, required.function_name, required.argument_types)) IS NULL
    ),
    invalid_functions AS (
      SELECT format('%I.%I(%s) expected return %s volatility %s security_definer %s', required.schema_name, required.function_name, required.argument_types, required.expected_return_type, required.expected_volatility, required.expected_security_definer) AS name
      FROM required_functions AS required
      JOIN pg_proc AS function_proc
        ON function_proc.oid = to_regprocedure(format('%I.%I(%s)', required.schema_name, required.function_name, required.argument_types))
      WHERE pg_get_function_result(function_proc.oid) <> required.expected_return_type
         OR function_proc.provolatile::text <> required.expected_volatility
         OR function_proc.prosecdef::text <> required.expected_security_definer
    )
    SELECT
      COALESCE((SELECT array_agg(name ORDER BY name) FROM missing_relations), ARRAY[]::text[]) AS missing_relations,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM invalid_relation_kinds), ARRAY[]::text[]) AS invalid_relation_kinds,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM missing_columns), ARRAY[]::text[]) AS missing_columns,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM unexpected_columns), ARRAY[]::text[]) AS unexpected_columns,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM present_forbidden_columns), ARRAY[]::text[]) AS present_forbidden_columns,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM invalid_columns), ARRAY[]::text[]) AS invalid_columns,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM missing_constraints), ARRAY[]::text[]) AS missing_constraints,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM malformed_constraints), ARRAY[]::text[]) AS malformed_constraints,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM missing_indexes), ARRAY[]::text[]) AS missing_indexes,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM malformed_indexes), ARRAY[]::text[]) AS malformed_indexes,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM missing_triggers), ARRAY[]::text[]) AS missing_triggers,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM malformed_triggers), ARRAY[]::text[]) AS malformed_triggers,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM missing_functions), ARRAY[]::text[]) AS missing_functions,
      COALESCE((SELECT array_agg(name ORDER BY name) FROM invalid_functions), ARRAY[]::text[]) AS invalid_functions,
      pg_get_viewdef(to_regclass('public.public_businesses'), true) AS public_view_definition,
      (SELECT procedure.prosrc FROM pg_proc AS procedure
        WHERE procedure.oid = to_regprocedure('public.business_record_is_public(text,text,boolean,boolean,text,text,text,text)')) AS public_function_definition,
      (SELECT procedure.provolatile = 'i' FROM pg_proc AS procedure
        WHERE procedure.oid = to_regprocedure('public.business_record_is_public(text,text,boolean,boolean,text,text,text,text)')) AS public_function_immutable,
      (SELECT procedure.prosecdef FROM pg_proc AS procedure
        WHERE procedure.oid = to_regprocedure('public.business_record_is_public(text,text,boolean,boolean,text,text,text,text)')) AS public_function_security_definer,
      (SELECT pg_get_function_result(procedure.oid) = 'boolean' FROM pg_proc AS procedure
        WHERE procedure.oid = to_regprocedure('public.business_record_is_public(text,text,boolean,boolean,text,text,text,text)')) AS public_function_returns_boolean
  `);

  const status = result.rows[0];
  if (!status) {
    throw new Error(`${description} preflight returned no compatibility status.`);
  }

  const missingRelations = status.missing_relations ?? [];
  const invalidRelationKinds = status.invalid_relation_kinds ?? [];
  const missingColumns = status.missing_columns ?? [];
  const unexpectedColumns = status.unexpected_columns ?? [];
  const presentForbiddenColumns = status.present_forbidden_columns ?? [];
  const invalidColumns = status.invalid_columns ?? [];
  const missingConstraints = status.missing_constraints ?? [];
  const malformedConstraints = status.malformed_constraints ?? [];
  const missingIndexes = status.missing_indexes ?? [];
  const malformedIndexes = status.malformed_indexes ?? [];
  const missingTriggers = status.missing_triggers ?? [];
  const malformedTriggers = status.malformed_triggers ?? [];
  const missingFunctions = status.missing_functions ?? [];
  const invalidFunctions = status.invalid_functions ?? [];
  const hasStructuralFailure = (
    missingRelations.length > 0
    || invalidRelationKinds.length > 0
    || missingColumns.length > 0
    || unexpectedColumns.length > 0
    || presentForbiddenColumns.length > 0
    || invalidColumns.length > 0
    || missingConstraints.length > 0
    || malformedConstraints.length > 0
    || missingIndexes.length > 0
    || malformedIndexes.length > 0
    || missingTriggers.length > 0
    || malformedTriggers.length > 0
    || missingFunctions.length > 0
    || invalidFunctions.length > 0
  );
  const requiresPublicDirectorySafety = contract.functions.some(
    ([schema, name]) => schema === "public" && name === "business_record_is_public",
  );
  const publicDirectorySafetyFailure = !hasStructuralFailure && requiresPublicDirectorySafety && (
    !communityPublicViewDefinitionIsSafe(status.public_view_definition)
    || !communityBusinessIsPublicFunctionIsSafe(status.public_function_definition)
    || status.public_function_immutable !== true
    || status.public_function_security_definer !== false
    || status.public_function_returns_boolean !== true
  );
  if (hasStructuralFailure || publicDirectorySafetyFailure) {
    const details = [
      missingRelations.length > 0 ? `relations: ${missingRelations.join(", ")}` : null,
      invalidRelationKinds.length > 0 ? `relation kinds: ${invalidRelationKinds.join(", ")}` : null,
      missingColumns.length > 0 ? `columns: ${missingColumns.join(", ")}` : null,
      unexpectedColumns.length > 0 ? `unexpected columns: ${unexpectedColumns.join(", ")}` : null,
      presentForbiddenColumns.length > 0 ? `forbidden plaintext columns: ${presentForbiddenColumns.join(", ")}` : null,
      invalidColumns.length > 0 ? `column definitions: ${invalidColumns.join(", ")}` : null,
      missingConstraints.length > 0 ? `constraints: ${missingConstraints.join(", ")}` : null,
      malformedConstraints.length > 0 ? `constraint definitions: ${malformedConstraints.join(", ")}` : null,
      missingIndexes.length > 0 ? `indexes: ${missingIndexes.join(", ")}` : null,
      malformedIndexes.length > 0 ? `index definitions: ${malformedIndexes.join(", ")}` : null,
      missingTriggers.length > 0 ? `triggers: ${missingTriggers.join(", ")}` : null,
      malformedTriggers.length > 0 ? `trigger definitions: ${malformedTriggers.join(", ")}` : null,
      missingFunctions.length > 0 ? `functions: ${missingFunctions.join(", ")}` : null,
      invalidFunctions.length > 0 ? `function definitions: ${invalidFunctions.join(", ")}` : null,
      publicDirectorySafetyFailure ? "public Directory view or predicate function safety" : null,
    ].filter((detail): detail is string => detail !== null);
    throw new Error(`${description} preflight failed (${details.join("; ")}).`);
  }
}

export async function verifyStrictFeatureReleaseSchema(
  reader: StrictFeatureReleaseSchemaReader,
  requirements = strictFeatureReleaseSchemaRequirementsFromEnvironment(),
): Promise<void> {
  await verifyReadOnlySchemaContract(
    reader,
    strictReleaseSchemaContract(requirements),
    "Strict feature-release schema",
  );
}

/**
 * The isolated Directory Review database is optional, but when configured it
 * must already contain its review-only structures. This check intentionally
 * reads the catalog rather than invoking the normal bootstrap writer.
 */
export async function verifyStrictDirectoryReviewSchema(
  reader: StrictFeatureReleaseSchemaReader,
): Promise<void> {
  await verifyReadOnlySchemaContract(
    reader,
    DIRECTORY_REVIEW_SCHEMA_CONTRACT,
    "Strict Directory Review schema",
  );
}

export type FeatureReleaseStartupDependencies = {
  strictFeatureReleaseMode: boolean;
  verifyStrictFeatureReleaseSchema: () => Promise<void>;
  runNonStrictStartupSchemaOperation: (
    operation: NonStrictStartupSchemaOperation,
  ) => Promise<void>;
};

/**
 * Strict mode runs only a read-only schema compatibility preflight. Normal
 * startup preserves the existing ordered bootstrap helpers unchanged.
 */
export async function initializeFeatureReleaseStartup(
  dependencies: FeatureReleaseStartupDependencies,
): Promise<"strict" | "normal"> {
  if (dependencies.strictFeatureReleaseMode) {
    await dependencies.verifyStrictFeatureReleaseSchema();
    return "strict";
  }

  for (const operation of NON_STRICT_STARTUP_SCHEMA_OPERATIONS) {
    await dependencies.runNonStrictStartupSchemaOperation(operation);
  }
  return "normal";
}

export type FeatureReleasePublicationDependencies = {
  strictFeatureReleaseMode: boolean;
  runNonStrictPublicationSchemaOperation: (
    operation: NonStrictPublicationSchemaOperation,
  ) => Promise<void>;
};

export async function initializeFeatureReleasePublicationStartup(
  dependencies: FeatureReleasePublicationDependencies,
): Promise<void> {
  if (dependencies.strictFeatureReleaseMode) return;

  for (const operation of NON_STRICT_PUBLICATION_SCHEMA_OPERATIONS) {
    await dependencies.runNonStrictPublicationSchemaOperation(operation);
  }
}
