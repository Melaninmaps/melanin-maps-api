import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const route = readFileSync(fileURLToPath(new URL("../routes/kinfolk-interest-intelligence.ts", import.meta.url)), "utf8");
const service = readFileSync(fileURLToPath(new URL("../kinfolk/interest-intelligence-service.ts", import.meta.url)), "utf8");
const chatRoute = readFileSync(fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)), "utf8");
const forYouRoute = readFileSync(fileURLToPath(new URL("../routes/for-you.ts", import.meta.url)), "utf8");
const migrations = readFileSync(fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)), "utf8");
const dbSchema = readFileSync(`${root}lib/db/src/schema/kinfolk-interest-intelligence.ts`, "utf8");

describe("Kinfolk interest intelligence contract", () => {
  it("keeps behavioral recognition opt-in, reviewable, and separate from private memory", () => {
    expect(route).toContain('router.put("/kinfolk/interest-intelligence/settings"');
    expect(route).toContain('router.post("/kinfolk/interest-intelligence/interests"');
    expect(route).toContain('router.delete("/kinfolk/interest-intelligence/interests/:interestId"');
    expect(service).toContain("interestRecognitionEnabled: false");
    expect(service).toContain("proactiveDiscoveryEnabled: false");
    expect(service).toContain("Deterministic allow-list only");
    expect(service).not.toContain("kinfolkPrivateMemoriesTable");
  });

  it("uses only governed MWM candidate data and does not invoke a model", () => {
    expect(service).toContain("documentedDiscoveryEligibilitySqlPredicate");
    expect(service).toContain("isUpcomingOneOffEventDate");
    expect(service).toContain("WHERE status = 'active'");
    expect(service).not.toContain("openai.chat");
    expect(forYouRoute).toContain("getInterestIntelligenceForMember");
    expect(forYouRoute).not.toContain("openai");
  });

  it("enforces explicit item-level Circle sharing and recommendation feedback", () => {
    expect(route).toContain('router.post("/kinfolk/circles/:circleId/interests/:interestId/share"');
    expect(route).toContain('router.get("/kinfolk/circles/:circleId/recommendations"');
    expect(route).toContain("automaticSharing: false");
    expect(route).toContain("automaticallyChangesInterestProfile: false");
    expect(service).toContain("assertCircleMembership");
    expect(service).toContain("state !== \"confirmed\" || interest.rows[0].is_temporary");
  });

  it("creates an idempotent release migration and never stores chat text", () => {
    expect(migrations).toContain('name: "kinfolk_interest_intelligence_v1"');
    expect(migrations).toContain("ADD COLUMN IF NOT EXISTS interest_recognition_enabled");
    expect(migrations).toContain("CREATE TABLE IF NOT EXISTS kinfolk_member_interests");
    expect(migrations).toContain("ensureKinfolkInterestIntelligenceSchema");
    expect(route).toContain("ensureKinfolkInterestIntelligenceSchema");
    expect(dbSchema).toContain("kinfolk_member_interests");
    expect(dbSchema).toContain("kinfolk_circle_interest_shares");
    expect(service).toContain("stores no message");
    expect(chatRoute).toContain("recordNonSensitiveInterestSignals");
  });
});
