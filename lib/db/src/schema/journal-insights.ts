import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

// ─── Minority / ethnicity designations ───────────────────────────────────────
export const DESIGNATIONS = [
  {
    id: "black",
    label: "Black / African American",
    emoji: "✊🏾",
    keywords: ["Black", "African American", "African-American", "Afro-American", "Black American"],
  },
  {
    id: "latino",
    label: "Latino / Hispanic",
    emoji: "🌎",
    keywords: ["Latino", "Latina", "Latinx", "Hispanic", "Mexican American", "Puerto Rican", "Cuban American"],
  },
  {
    id: "indigenous",
    label: "Indigenous / Native American",
    emoji: "🦅",
    keywords: ["Indigenous", "Native American", "American Indian", "Alaska Native", "First Nations", "Tribal"],
  },
  {
    id: "mena",
    label: "Middle Eastern / Arab",
    emoji: "🌙",
    keywords: ["Middle Eastern", "Arab American", "Arab", "MENA", "North African"],
  },
  {
    id: "multiracial",
    label: "Multiracial / Biracial",
    emoji: "🌈",
    keywords: ["Multiracial", "Biracial", "Mixed race", "Mixed-race"],
  },
] as const;

export type DesignationId = typeof DESIGNATIONS[number]["id"];

// ─── Supported journals ───────────────────────────────────────────────────────
export const INSIGHT_JOURNALS = [
  { id: "nejm",     label: "New England Journal of Medicine", abbrev: "N Engl J Med",    color: "#DC2626" },
  { id: "jama",     label: "JAMA",                            abbrev: "JAMA",             color: "#7C3AED" },
  { id: "lancet",   label: "The Lancet",                      abbrev: "Lancet",           color: "#0891B2" },
  { id: "bmj",      label: "The BMJ",                         abbrev: "BMJ",              color: "#059669" },
  { id: "aim",      label: "Annals of Internal Medicine",     abbrev: "Ann Intern Med",   color: "#D97706" },
  { id: "natmed",   label: "Nature Medicine",                  abbrev: "Nat Med",          color: "#2563EB" },
  { id: "plosmed",  label: "PLOS Medicine",                   abbrev: "PLoS Med",         color: "#16A34A" },
  { id: "jamaopen", label: "JAMA Network Open",               abbrev: "JAMA Netw Open",   color: "#9333EA" },
  { id: "cmaj",     label: "CMAJ",                            abbrev: "CMAJ",             color: "#B91C1C" },
  { id: "ajph",     label: "American Journal of Public Health", abbrev: "Am J Public Health", color: "#0D9488" },
] as const;

export type InsightJournalId = typeof INSIGHT_JOURNALS[number]["id"];

// ─── Journal insights (cached PubMed articles) ────────────────────────────────
export const journalInsightsTable = pgTable("journal_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  pmid: varchar("pmid", { length: 20 }).unique().notNull(),
  title: text("title").notNull(),
  abstract: text("abstract"),
  authors: jsonb("authors").$type<string[]>().notNull().default([]),
  journalId: varchar("journal_id", { length: 50 }).notNull(),
  journalLabel: varchar("journal_label", { length: 255 }),
  journalAbbrev: varchar("journal_abbrev", { length: 100 }),
  pubDate: varchar("pub_date", { length: 50 }),
  doi: varchar("doi", { length: 300 }),
  url: varchar("url", { length: 500 }).notNull(),
  designationIds: jsonb("designation_ids").$type<DesignationId[]>().notNull().default([]),
  healthTopicIds: jsonb("health_topic_ids").$type<string[]>().notNull().default([]),
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  isCurated: boolean("is_curated").notNull().default(false),
  status: varchar("status", { length: 20, enum: ["active", "removed"] }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── User bookmarks of journal insights ──────────────────────────────────────
export const journalInsightBookmarksTable = pgTable("journal_insight_bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  insightId: uuid("insight_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Sync log ────────────────────────────────────────────────────────────────
export const journalSyncLogTable = pgTable("journal_sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  journalId: varchar("journal_id", { length: 50 }),
  articlesFound: integer("articles_found").notNull().default(0),
  articlesInserted: integer("articles_inserted").notNull().default(0),
  error: text("error"),
  ranAt: timestamp("ran_at", { withTimezone: true }).notNull().defaultNow(),
});

export type JournalInsight = typeof journalInsightsTable.$inferSelect;
