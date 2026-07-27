import { boolean, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export interface FamilyMemberPermissions {
  canViewTrips: boolean;
  shareLocation: boolean;
  emergencyContact: boolean;
  sosNotifications: boolean;
  safetyAlerts: boolean;
  approveFriendRequests: boolean;
  messagingEnabled: boolean;
  contentFilter: "none" | "mild" | "strict";
}

export const DEFAULT_PERMISSIONS: FamilyMemberPermissions = {
  canViewTrips: false,
  shareLocation: false,
  emergencyContact: false,
  sosNotifications: true,
  safetyAlerts: true,
  approveFriendRequests: false,
  messagingEnabled: true,
  contentFilter: "none",
};

export const familyCirclesTable = pgTable("family_circles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().default("My Family"),
  ownerId: varchar("owner_id").notNull(),
  inviteCode: varchar("invite_code", { length: 12 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const familyCircleMembersTable = pgTable("family_circle_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => familyCirclesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id"),
  inviteEmail: varchar("invite_email", { length: 255 }),
  displayName: varchar("display_name", { length: 100 }),
  role: varchar("role", { enum: ["owner", "member"] }).notNull().default("member"),
  status: varchar("status", { enum: ["pending", "accepted", "removed"] }).notNull().default("pending"),
  permissions: jsonb("permissions").$type<FamilyMemberPermissions>().notNull().default(sql`'{"canViewTrips":false,"shareLocation":false,"emergencyContact":false,"sosNotifications":true,"safetyAlerts":true,"approveFriendRequests":false,"messagingEnabled":true,"contentFilter":"none"}'::jsonb`),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
});

export type FamilyCircle = typeof familyCirclesTable.$inferSelect;
export type FamilyCircleMember = typeof familyCircleMembersTable.$inferSelect;
export type InsertFamilyCircleMember = typeof familyCircleMembersTable.$inferInsert;
