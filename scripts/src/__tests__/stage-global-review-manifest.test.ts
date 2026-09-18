import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../stage-global-review-manifest.ts"), "utf8");
const migrations = readFileSync(resolve(import.meta.dirname, "../../../artifacts/api-server/src/lib/startup-migrations.ts"), "utf8");

describe("global review-only directory staging", () => {
  it("requires summary and destination-health integrity before it can stage", () => {
    expect(source).toContain("Review summary manifest checksum does not match the manifest.");
    expect(source).toContain("Destination-health report does not match the manifest candidate count.");
    expect(source).toContain("--created-by is required to attribute review-only staging.");
    expect(source).toContain("assertLocalDirectoryStagingFromProcess()");
    expect(source).toContain("publicationWrites: 0");
  });

  it("holds unsafe, duplicate, existing, regulated, cultural, and resource records for review", () => {
    expect(source).toContain("regulated_credential_review");
    expect(source).toContain("resource_queue_only");
    expect(source).toContain("cultural_queue_only");
    expect(source).toContain("duplicate_within_batch");
    expect(source).toContain("existing_record_reconciliation");
    expect(source).toContain("status = 'needs_research'");
    expect(source).toContain("matched_business_id = b.id");
  });

  it("gates health only on customer destinations rather than the cited source directory", () => {
    expect(source).toContain("const customerDestinationFields");
    expect(source).toContain('["website", candidate.website]');
    expect(source).toContain('["socialSource", candidate.socialSourceUrl]');
    expect(source).not.toContain('["source", candidate.sourceUrl]');
  });

  it("adds only staging compatibility for international and cultural review records", () => {
    expect(migrations).toContain("allow_review_only_international_directory_candidates_v1");
    expect(migrations).toContain("ALTER COLUMN state DROP NOT NULL");
    expect(migrations).toContain("'cultural_place'");
  });

  it("preserves online-only candidates as searchable listings without map coordinates", () => {
    expect(source).toContain('"online_business"');
    expect(source).toContain('row.targetKind === "online_business"');
    expect(source).toContain('country: candidate.country.trim()');
    expect(migrations).toContain("allow_online_only_directory_businesses_v1");
    expect(migrations).toContain("is_online_only BOOLEAN NOT NULL DEFAULT FALSE");
  });
});
