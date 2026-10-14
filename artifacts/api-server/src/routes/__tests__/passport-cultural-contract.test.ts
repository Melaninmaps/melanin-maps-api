import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../passport.ts"),
  "utf8",
);

const migrationSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../migrations/20261014_cultural_passport_moments.sql"),
  "utf8",
);

describe("Cultural Passport route contract", () => {
  it("uses private member-confirmed moments instead of engagement scoring", () => {
    expect(routeSource).toContain("culturalPassportMomentsTable");
    expect(routeSource).toContain("validateCulturalPassportMoment(req.body ?? {})");
    expect(routeSource).toContain("eq(culturalPassportMomentsTable.userId, req.user.id)");
    expect(routeSource).not.toMatch(/pointsLedgerTable|totalEngagements|\blevel\b|businessesSaved|reviewsWritten/);
  });

  it("keeps creation explicit and removal owner-scoped", () => {
    expect(routeSource).toContain("memberConfirmedAt: new Date()");
    expect(routeSource).toContain('router.delete("/users/passport/moments/:id"');
    expect(routeSource).toContain("isNull(culturalPassportMomentsTable.removedAt)");
    expect(routeSource).toContain("Nothing was added to My Passport.");
  });

  it("defines a source-only private-moment migration with no gamification columns", () => {
    expect(migrationSource).toContain("CREATE TABLE IF NOT EXISTS cultural_passport_moments");
    expect(migrationSource).toContain("member_confirmed_at timestamptz NOT NULL");
    const migrationColumns = migrationSource.replace(/^--.*$/gmu, "");
    expect(migrationColumns).not.toMatch(/\bpoints\b|\blevel\b|streak|achievement|completion|progress/);
  });
});
