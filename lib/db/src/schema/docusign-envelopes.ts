import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const docusignEnvelopesTable = pgTable("docusign_envelopes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  envelopeId: varchar("envelope_id").notNull().unique(),
  businessId: varchar("business_id"),
  userId: varchar("user_id"),
  type: varchar("type", {
    enum: ["seller_agreement", "founding_agreement", "verification"],
  }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("sent"),
  signerEmail: varchar("signer_email"),
  signerName: varchar("signer_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DocuSignEnvelope = typeof docusignEnvelopesTable.$inferSelect;
export type InsertDocuSignEnvelope = typeof docusignEnvelopesTable.$inferInsert;
