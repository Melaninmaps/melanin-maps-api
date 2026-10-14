import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const KINFOLK_JOURNEY_STATUSES = [
  "draft",
  "review_needed",
  "confirmed",
  "active",
  "completed",
  "archived",
  "deleted",
] as const;
export type KinfolkJourneyStatus = (typeof KINFOLK_JOURNEY_STATUSES)[number];

export const KINFOLK_JOURNEY_ITEM_KINDS = [
  "flight",
  "lodging",
  "transport",
  "reservation",
  "event",
  "place",
  "note",
  "reminder",
] as const;
export type KinfolkJourneyItemKind =
  (typeof KINFOLK_JOURNEY_ITEM_KINDS)[number];

export const KINFOLK_JOURNEY_ITEM_STATUSES = [
  "proposed",
  "tentative",
  "confirmed",
  "cancelled",
  "skipped",
] as const;
export type KinfolkJourneyItemStatus =
  (typeof KINFOLK_JOURNEY_ITEM_STATUSES)[number];

export type KinfolkJourneyRetentionPolicy =
  | "delete_after_trip"
  | "keep_until_deleted"
  | "keep_until_member_changes_it";
export type KinfolkJourneySourceKind =
  | "member_entry"
  | "kinfolk_governed"
  | "confirmation_text"
  | "document"
  | "image"
  | "email"
  | "calendar"
  | "provider";
export type KinfolkJourneyExtractionStatus =
  | "not_requested"
  | "review_needed"
  | "parsed"
  | "confirmed"
  | "conflict"
  | "unavailable"
  | "deleted";

export type KinfolkJourneyMemberPreferences = {
  budget?: "budget" | "mid" | "luxury" | "any";
  pace?: "easy" | "balanced" | "full";
  accessibilityNotes?: string[];
  dietaryNotes?: string[];
  transportNotes?: string[];
  companionSummary?: string | null;
};

export type KinfolkJourneyItemPayload = {
  /** Encrypted server-side before persistence when it contains confirmation or booking detail. */
  encryptedDetails?: string | null;
  /** Safe redacted labels only; never a confirmation code, email body, or credential. */
  publicPreview?: string | null;
  providerReferenceHash?: string | null;
  provenance?: {
    sourceKind: KinfolkJourneySourceKind;
    sourceId?: string | null;
    confidence: "high" | "medium" | "low";
  };
};

export type KinfolkJourneySourceSnapshot = {
  /** Bounded, redacted evidence preview for member review — never raw inbox or document content. */
  evidencePreview?: string | null;
  canonicalBusinessId?: string | null;
  externalUrl?: string | null;
  observedAt?: string | null;
};

export const kinfolkJourneysTable = pgTable(
  "kinfolk_journeys",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    status: varchar("status", { enum: KINFOLK_JOURNEY_STATUSES })
      .$type<KinfolkJourneyStatus>()
      .notNull()
      .default("draft"),
    destinationLabel: varchar("destination_label", { length: 255 }),
    destinationCity: varchar("destination_city", { length: 120 }),
    destinationRegion: varchar("destination_region", { length: 120 }),
    timeZone: varchar("time_zone", { length: 80 }),
    startDate: varchar("start_date", { length: 10 }),
    endDate: varchar("end_date", { length: 10 }),
    preferences: jsonb("preferences")
      .$type<KinfolkJourneyMemberPreferences>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    originKinfolkSessionId: varchar("origin_kinfolk_session_id", {
      length: 36,
    }),
    retentionPolicy: varchar("retention_policy", {
      enum: [
        "delete_after_trip",
        "keep_until_deleted",
        "keep_until_member_changes_it",
      ] as const,
    })
      .$type<KinfolkJourneyRetentionPolicy>()
      .notNull()
      .default("keep_until_deleted"),
    retentionExpiresAt: timestamp("retention_expires_at", {
      withTimezone: true,
    }),
    memberConsentedAt: timestamp("member_consented_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("kinfolk_journeys_user_updated_idx").on(
      table.userId,
      table.updatedAt,
    ),
    index("kinfolk_journeys_user_status_idx").on(table.userId, table.status),
  ],
);

export const kinfolkJourneyItemsTable = pgTable(
  "kinfolk_journey_items",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    journeyId: varchar("journey_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    kind: varchar("kind", { enum: KINFOLK_JOURNEY_ITEM_KINDS })
      .$type<KinfolkJourneyItemKind>()
      .notNull(),
    status: varchar("status", { enum: KINFOLK_JOURNEY_ITEM_STATUSES })
      .$type<KinfolkJourneyItemStatus>()
      .notNull()
      .default("proposed"),
    title: varchar("title", { length: 255 }).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    timeZone: varchar("time_zone", { length: 80 }),
    locationLabel: varchar("location_label", { length: 255 }),
    canonicalBusinessId: varchar("canonical_business_id", { length: 36 }),
    sourceImportId: varchar("source_import_id", { length: 36 }),
    memberConfirmedAt: timestamp("member_confirmed_at", { withTimezone: true }),
    payload: jsonb("payload")
      .$type<KinfolkJourneyItemPayload>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("kinfolk_journey_items_journey_time_idx").on(
      table.journeyId,
      table.startsAt,
    ),
    index("kinfolk_journey_items_user_idx").on(table.userId),
    index("kinfolk_journey_items_business_idx").on(table.canonicalBusinessId),
  ],
);

export const kinfolkJourneySourcesTable = pgTable(
  "kinfolk_journey_sources",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    journeyId: varchar("journey_id", { length: 36 }).notNull(),
    itemId: varchar("item_id", { length: 36 }),
    userId: varchar("user_id", { length: 255 }).notNull(),
    fieldKey: varchar("field_key", { length: 80 }).notNull(),
    sourceKind: varchar("source_kind", {
      enum: [
        "member_entry",
        "kinfolk_governed",
        "confirmation_text",
        "document",
        "image",
        "email",
        "calendar",
        "provider",
      ] as const,
    })
      .$type<KinfolkJourneySourceKind>()
      .notNull(),
    sourceLabel: varchar("source_label", { length: 255 }).notNull(),
    confidence: varchar("confidence", {
      enum: ["high", "medium", "low"] as const,
    })
      .$type<"high" | "medium" | "low">()
      .notNull()
      .default("low"),
    extractionStatus: varchar("extraction_status", {
      enum: [
        "not_requested",
        "review_needed",
        "parsed",
        "confirmed",
        "conflict",
        "unavailable",
        "deleted",
      ] as const,
    })
      .$type<KinfolkJourneyExtractionStatus>()
      .notNull()
      .default("review_needed"),
    sourceFingerprint: varchar("source_fingerprint", { length: 128 }).notNull(),
    snapshot: jsonb("snapshot")
      .$type<KinfolkJourneySourceSnapshot>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    memberConfirmedAt: timestamp("member_confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("kinfolk_journey_sources_journey_idx").on(table.journeyId),
    uniqueIndex("kinfolk_journey_sources_unique_fingerprint").on(
      table.journeyId,
      table.fieldKey,
      table.sourceFingerprint,
    ),
  ],
);

export const kinfolkJourneyImportsTable = pgTable(
  "kinfolk_journey_imports",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    journeyId: varchar("journey_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    sourceKind: varchar("source_kind", {
      enum: [
        "confirmation_text",
        "document",
        "image",
        "email",
        "calendar",
        "provider",
      ] as const,
    })
      .$type<
        Exclude<KinfolkJourneySourceKind, "member_entry" | "kinfolk_governed">
      >()
      .notNull(),
    status: varchar("status", {
      enum: [
        "review_needed",
        "parsed",
        "confirmed",
        "conflict",
        "unavailable",
        "deleted",
      ] as const,
    })
      .$type<Exclude<KinfolkJourneyExtractionStatus, "not_requested">>()
      .notNull()
      .default("review_needed"),
    assetId: varchar("asset_id", { length: 36 }),
    providerMessageHash: varchar("provider_message_hash", { length: 128 }),
    contentDigest: varchar("content_digest", { length: 128 }).notNull(),
    parsedFacts: jsonb("parsed_facts")
      .$type<
        Array<{
          field: string;
          value: string;
          confidence: "high" | "medium" | "low";
          reason: string;
        }>
      >()
      .notNull()
      .default(sql`'[]'::jsonb`),
    memberConsentedAt: timestamp("member_consented_at", {
      withTimezone: true,
    }).notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("kinfolk_journey_imports_journey_idx").on(
      table.journeyId,
      table.createdAt,
    ),
    uniqueIndex("kinfolk_journey_imports_owner_digest").on(
      table.journeyId,
      table.contentDigest,
    ),
  ],
);

export const kinfolkJourneyConnectionsTable = pgTable(
  "kinfolk_journey_connections",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 255 }).notNull(),
    provider: varchar("provider", {
      enum: [
        "google_calendar",
        "microsoft_calendar",
        "gmail",
        "outlook_mail",
        "device_calendar",
        "flight_status",
      ] as const,
    }).notNull(),
    status: varchar("status", {
      enum: [
        "disabled",
        "not_configured",
        "pending_consent",
        "connected",
        "expired",
        "needs_reconnect",
        "revoked",
        "disconnect_pending",
      ] as const,
    })
      .notNull()
      .default("not_configured"),
    accessMode: varchar("access_mode", {
      enum: [
        "free_busy",
        "selected_items",
        "calendar_details",
        "manual",
      ] as const,
    })
      .notNull()
      .default("manual"),
    scopes: jsonb("scopes")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    tokenEnvelope: text("token_envelope"),
    oauthStateHash: varchar("oauth_state_hash", { length: 128 }),
    oauthNonceHash: varchar("oauth_nonce_hash", { length: 128 }),
    consentedAt: timestamp("consented_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("kinfolk_journey_connections_owner_provider").on(
      table.userId,
      table.provider,
    ),
  ],
);

export const kinfolkJourneyCollaboratorsTable = pgTable(
  "kinfolk_journey_collaborators",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    journeyId: varchar("journey_id", { length: 36 }).notNull(),
    ownerUserId: varchar("owner_user_id", { length: 255 }).notNull(),
    collaboratorUserId: varchar("collaborator_user_id", { length: 255 }),
    invitationHash: varchar("invitation_hash", { length: 128 }),
    role: varchar("role", { enum: ["viewer", "editor"] as const })
      .notNull()
      .default("viewer"),
    status: varchar("status", {
      enum: ["disabled", "pending", "accepted", "revoked", "expired"] as const,
    })
      .notNull()
      .default("disabled"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("kinfolk_journey_collaborators_owner_idx").on(
      table.ownerUserId,
      table.journeyId,
    ),
  ],
);

export const kinfolkJourneyRemindersTable = pgTable(
  "kinfolk_journey_reminders",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    journeyId: varchar("journey_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    itemId: varchar("item_id", { length: 36 }),
    channel: varchar("channel", { enum: ["in_app", "push", "email"] as const })
      .notNull()
      .default("in_app"),
    state: varchar("state", {
      enum: ["enabled", "paused", "sent", "deleted"] as const,
    })
      .notNull()
      .default("enabled"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("kinfolk_journey_reminders_due_idx").on(table.state, table.dueAt),
    index("kinfolk_journey_reminders_owner_idx").on(
      table.userId,
      table.journeyId,
    ),
  ],
);

export const kinfolkJourneyFlightWatchesTable = pgTable(
  "kinfolk_journey_flight_watches",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    journeyId: varchar("journey_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    itemId: varchar("item_id", { length: 36 }),
    operatingCarrier: varchar("operating_carrier", { length: 3 }).notNull(),
    flightNumber: varchar("flight_number", { length: 4 }).notNull(),
    scheduledDepartureDate: varchar("scheduled_departure_date", {
      length: 10,
    }).notNull(),
    originIata: varchar("origin_iata", { length: 3 }).notNull(),
    destinationIata: varchar("destination_iata", { length: 3 }).notNull(),
    notificationChannel: varchar("notification_channel", {
      enum: ["in_app", "push", "email"] as const,
    })
      .notNull()
      .default("in_app"),
    state: varchar("state", {
      enum: [
        "pending_provider",
        "active",
        "paused",
        "completed",
        "revoked",
        "deleted",
      ] as const,
    })
      .notNull()
      .default("pending_provider"),
    providerKey: varchar("provider_key", { length: 40 }),
    providerReferenceHash: varchar("provider_reference_hash", { length: 128 }),
    lastStatus: jsonb("last_status")
      .$type<{
        state: "unknown" | "on_time" | "delayed" | "cancelled" | "diverted";
        sourceObservedAt: string | null;
        freshUntil: string | null;
        summary: string | null;
      }>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true }),
    freshUntil: timestamp("fresh_until", { withTimezone: true }),
    consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("kinfolk_journey_flight_watches_owner_idx").on(
      table.userId,
      table.journeyId,
    ),
    index("kinfolk_journey_flight_watches_state_idx").on(
      table.state,
      table.scheduledDepartureDate,
    ),
    uniqueIndex("kinfolk_journey_flight_watches_owner_flight")
      .on(
        table.userId,
        table.journeyId,
        table.operatingCarrier,
        table.flightNumber,
        table.scheduledDepartureDate,
        table.originIata,
        table.destinationIata,
      )
      .where(sql`deleted_at IS NULL`),
  ],
);

export const kinfolkJourneyAuditTable = pgTable(
  "kinfolk_journey_audit",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    journeyId: varchar("journey_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, string | number | boolean | null>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("kinfolk_journey_audit_journey_idx").on(
      table.journeyId,
      table.createdAt,
    ),
  ],
);

export type KinfolkJourney = typeof kinfolkJourneysTable.$inferSelect;
export type KinfolkJourneyItem = typeof kinfolkJourneyItemsTable.$inferSelect;
export type KinfolkJourneySource =
  typeof kinfolkJourneySourcesTable.$inferSelect;
export type KinfolkJourneyImport =
  typeof kinfolkJourneyImportsTable.$inferSelect;
export type KinfolkJourneyConnection =
  typeof kinfolkJourneyConnectionsTable.$inferSelect;
export type KinfolkJourneyReminder =
  typeof kinfolkJourneyRemindersTable.$inferSelect;
export type KinfolkJourneyFlightWatch =
  typeof kinfolkJourneyFlightWatchesTable.$inferSelect;
