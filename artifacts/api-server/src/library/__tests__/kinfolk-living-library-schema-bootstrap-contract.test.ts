import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

const migrations = source("../../lib/startup-migrations.ts");
const startup = source("../../index.ts");
const repository = source("../postgresLibraryRepository.ts");

describe("Kinfolk Living Library pre-traffic read schema", () => {
  it("creates only the Library read relations needed by the ordinary chat lookup", () => {
    const start = migrations.indexOf("export async function ensureKinfolkLivingLibraryReadSchema");
    const end = migrations.indexOf("export async function runStartupMigrations", start);
    const helper = migrations.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(helper).toContain('"living_library_topics_table_v1"');
    expect(helper).toContain('"living_library_entries_table_v1"');
    expect(helper).toContain('"library_entry_facets_v1"');
    expect(helper).toContain('"library_entry_topic_links_v1"');
    expect(helper).toContain("ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'pending'");
    expect(helper).toContain("SELECT id, slug, title, domain, summary, icon_key, active, is_foundational FROM library_topics LIMIT 0");
    expect(helper).not.toMatch(/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
  });

  it("runs before the listener when broad startup migrations are intentionally skipped", () => {
    const bootstrap = startup.indexOf("await ensureKinfolkLivingLibraryReadSchema(logger);");
    const listener = startup.indexOf("const server = host");

    expect(startup).toContain("ensureKinfolkLivingLibraryReadSchema,");
    expect(bootstrap).toBeGreaterThan(-1);
    expect(bootstrap).toBeLessThan(listener);
    expect(startup).toContain("Kinfolk Living Library read schema ready before traffic acceptance");
  });

  it("keeps approved answer retrieval constrained to published, cited Library content", () => {
    expect(repository).toContain("entry.publication_status = 'published'");
    expect(repository).toContain("FROM library_entry_sources");
    expect(repository).toContain("FROM library_entry_facets");
    expect(repository).toContain("LEFT JOIN library_entry_topic_links");
  });
});
