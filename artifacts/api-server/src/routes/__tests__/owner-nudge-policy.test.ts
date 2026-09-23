import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adminRoute = readFileSync(new URL("../admin.ts", import.meta.url), "utf8");
const submissionRoute = readFileSync(new URL("../../businessIntake/registerSubmissionRoutes.ts", import.meta.url), "utf8");
const migrations = readFileSync(new URL("../../lib/startup-migrations.ts", import.meta.url), "utf8");

describe("minority-owner nudge policy", () => {
  it("creates reviewable drafts only for eligible minority-owned unclaimed listings", () => {
    const start = adminRoute.indexOf('"/admin/business-owner-nudges/refresh"');
    const end = adminRoute.indexOf("/**", start);
    const route = adminRoute.slice(start, end);
    expect(start).toBeGreaterThan(-1);
    expect(route).toContain("mwmDiasporaPromotionSqlPredicate(\"b.id\", \"documented_diaspora\")");
    expect(route).toContain("community_reported_ownership = 'minority_owned'");
    expect(route).not.toContain("community_reported_ownership = 'non_minority_owned'");
    expect(route).toContain("owner_claim_status, 'unclaimed'");
    expect(route).toContain("status, prepared_by");
    expect(route).toContain("'draft'");
    expect(route).toContain('delivery: "not_sent"');
    expect(route).not.toContain("sendBusinessOutreach(");
  });

  it("keeps non-minority and undocumented listings out of manual outreach too", () => {
    const start = adminRoute.indexOf('"/admin/businesses/:id/outreach"');
    const end = adminRoute.indexOf('"/admin/business-owner-nudges/refresh"');
    const route = adminRoute.slice(start, end);
    expect(route).toContain("hasDocumentedDiasporaOwnership");
    expect(route).toContain("hasCommunityReportedMinorityOwnership");
    expect(route).toContain("Outreach emails are only sent to minority-owned businesses.");
  });

  it("keeps community-submitted listings unclaimed and never promotion eligible", () => {
    expect(submissionRoute).toContain("unclaimed_community_submission");
    expect(submissionRoute).toContain("false,false,false,'active','live_unclaimed'");
  });

  it("records an idempotent evidence snapshot for review without creating an automated sender", () => {
    expect(migrations).toContain("minority_owner_nudge_drafts_v1");
    expect(migrations).toContain("evidence_snapshot");
    expect(migrations).toContain("business_owner_outreach_open_campaign_idx");
  });
});
