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

export const KINFOLK_CONNECTED_APP_CATEGORIES = [
  "travel",
  "health",
  "finance",
  "everyday",
] as const;
export type KinfolkConnectedAppCategory =
  (typeof KINFOLK_CONNECTED_APP_CATEGORIES)[number];

export const KINFOLK_CONNECTED_APP_AUTHORIZATION_MODES = [
  "oauth",
  "native_permission",
  "selected_import",
  "provider_contract",
  "unsupported",
] as const;
export type KinfolkConnectedAppAuthorizationMode =
  (typeof KINFOLK_CONNECTED_APP_AUTHORIZATION_MODES)[number];

export const KINFOLK_CONNECTED_APP_PERMISSION_STATUSES = [
  "requested",
  "authorized",
  "revoked",
  "deleted",
  "unavailable",
] as const;
export type KinfolkConnectedAppPermissionStatus =
  (typeof KINFOLK_CONNECTED_APP_PERMISSION_STATUSES)[number];

/**
 * A consent record is intentionally separate from a provider credential.
 * It records the member's stated purpose and permissions; provider tokens remain
 * encrypted and server-only in the domain-specific connection store.
 */
export const kinfolkConnectedAppPermissionsTable = pgTable(
  "kinfolk_connected_app_permissions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 255 }).notNull(),
    appKey: varchar("app_key", { length: 80 }).notNull(),
    category: varchar("category", {
      enum: KINFOLK_CONNECTED_APP_CATEGORIES,
    })
      .$type<KinfolkConnectedAppCategory>()
      .notNull(),
    authorizationMode: varchar("authorization_mode", {
      enum: KINFOLK_CONNECTED_APP_AUTHORIZATION_MODES,
    })
      .$type<KinfolkConnectedAppAuthorizationMode>()
      .notNull(),
    status: varchar("status", {
      enum: KINFOLK_CONNECTED_APP_PERMISSION_STATUSES,
    })
      .$type<KinfolkConnectedAppPermissionStatus>()
      .notNull()
      .default("requested"),
    purpose: varchar("purpose", { length: 160 }).notNull(),
    dataTypes: jsonb("data_types")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    scopes: jsonb("scopes")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Never returned by settings routes; reserved for future generic providers. */
    tokenEnvelope: text("token_envelope"),
    grantedAt: timestamp("granted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
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
    uniqueIndex("kinfolk_connected_app_permissions_member_unique").on(
      table.userId,
      table.appKey,
      table.purpose,
    ),
    index("kinfolk_connected_app_permissions_member_category_idx").on(
      table.userId,
      table.category,
      table.updatedAt,
    ),
  ],
);

/**
 * A minimal member-scoped permission ledger. It never copies access tokens,
 * provider payloads, imported content, health data, or financial data.
 */
export const kinfolkConnectedAppAuditTable = pgTable(
  "kinfolk_connected_app_audit",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 255 }).notNull(),
    permissionId: varchar("permission_id", { length: 36 }),
    appKey: varchar("app_key", { length: 80 }).notNull(),
    action: varchar("action", { length: 32 }).notNull(),
    /** Safe operational metadata only; no token, provider response, or source text. */
    metadata: jsonb("metadata")
      .$type<Record<string, string | string[]>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("kinfolk_connected_app_audit_member_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("kinfolk_connected_app_audit_permission_idx").on(table.permissionId),
  ],
);

export type KinfolkConnectedAppPermission =
  typeof kinfolkConnectedAppPermissionsTable.$inferSelect;
export type KinfolkConnectedAppAudit =
  typeof kinfolkConnectedAppAuditTable.$inferSelect;
