import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const memberConnections = pgTable("member_connections", {
  id: serial("id").primaryKey(),
  requesterId: text("requester_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  status: text("status").notNull().default("pending"),
  groupId: integer("group_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const trustedContactShares = pgTable("trusted_contact_shares", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").notNull(),
  initiatorId: text("initiator_id").notNull(),
  partnerId: text("partner_id").notNull(),
  trustedContactName: text("trusted_contact_name").notNull(),
  trustedContactEmail: text("trusted_contact_email"),
  trustedContactPhone: text("trusted_contact_phone"),
  initiatorConsented: boolean("initiator_consent").notNull().default(true),
  partnerConsented: boolean("partner_consent").notNull().default(false),
  status: text("status").notNull().default("pending_consent"),
  activatedAt: timestamp("activated_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MemberConnection = typeof memberConnections.$inferSelect;
export type InsertMemberConnection = typeof memberConnections.$inferInsert;
export type TrustedContactShare = typeof trustedContactShares.$inferSelect;
export type InsertTrustedContactShare = typeof trustedContactShares.$inferInsert;
