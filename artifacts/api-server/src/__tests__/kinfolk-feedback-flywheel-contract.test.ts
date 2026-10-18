import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const kinfolkRoute = readFileSync(fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)), "utf8");
const ownerRoute = readFileSync(fileURLToPath(new URL("../routes/business-owner-insights.ts", import.meta.url)), "utf8");
const flywheelEligibility = readFileSync(fileURLToPath(new URL("../businesses/verifiedMinorityFlywheelEligibility.ts", import.meta.url)), "utf8");
const skipFeedbackRoute = readFileSync(fileURLToPath(new URL("../routes/skip-feedback.ts", import.meta.url)), "utf8");
const marketIntelligenceRoute = readFileSync(fileURLToPath(new URL("../routes/kinfolk-intelligence.ts", import.meta.url)), "utf8");
const postNudgeRoute = readFileSync(fileURLToPath(new URL("../routes/post-nudge.ts", import.meta.url)), "utf8");
const attachmentRoute = readFileSync(fileURLToPath(new URL("../routes/canonical-mwm-owner-attachment.ts", import.meta.url)), "utf8");
const migrations = readFileSync(fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)), "utf8");
const webSource = readFileSync(`${root}artifacts/web/src/pages/travel.tsx`, "utf8");
const nativeSource = readFileSync(`${root}artifacts/mobile/components/AIChatWidget.tsx`, "utf8");
const webOwnerDashboard = readFileSync(`${root}artifacts/web/src/pages/business-dashboard.tsx`, "utf8");
const nativeOwnerDashboard = readFileSync(`${root}artifacts/mobile/app/business-owner/index.tsx`, "utf8");

describe("Kinfolk feedback flywheel contract", () => {
  it("keeps member feedback out of Kinfolk prompt assembly", () => {
    expect(kinfolkRoute).toContain('router.put("/kinfolk/response-feedback"');
    expect(kinfolkRoute).toContain('router.delete("/kinfolk/response-feedback/:messageId"');
    expect(kinfolkRoute).toContain("automaticallyChangesKinfolk: false");
    expect(kinfolkRoute).not.toContain("buildKinfolkResponseFeedbackPrompt");
    expect(kinfolkRoute).not.toContain("responseFeedbackPrompt");
  });

  it("deduplicates, rate-limits, and thresholds only selected broad needs", () => {
    expect(kinfolkRoute).toContain("KINFOLK_FEEDBACK_RATE_LIMIT");
    expect(kinfolkRoute).toContain("WHERE user_id = $1 AND message_id = $2");
    expect(kinfolkRoute).toContain("COUNT(DISTINCT user_id)");
    expect(kinfolkRoute).toContain("ON CONFLICT (business_id, topic_key, threshold)");
    expect(kinfolkRoute).toContain("note = NULL, topic_key = NULL, session_id = NULL");
    expect(migrations).toContain('name: "kinfolk_feedback_flywheel_v1"');
    expect(migrations).toContain("kinfolk_community_need_insights");
  });

  it("repairs only the feedback schema when broad startup writers are intentionally disabled", () => {
    expect(migrations).toContain("export async function ensureKinfolkFeedbackFlywheelSchema");
    expect(migrations).toContain("KINFOLK_FEEDBACK_SCHEMA_MIGRATIONS");
    expect(migrations).toContain("SELECT topic_key, revoked_at FROM kinfolk_response_feedback LIMIT 0");
    expect(kinfolkRoute).toContain("ensureKinfolkFeedbackSchemaForRequest");
    expect(kinfolkRoute).toContain('error: "KINFOLK_FEEDBACK_SCHEMA_UNAVAILABLE"');
  });

  it("requires an active owner link and never permits admin impersonation", () => {
    expect(ownerRoute).toContain('router.get("/businesses/:id/kinfolk-community-needs"');
    expect(ownerRoute).toContain("resolveVerifiedMinorityFlywheelOwner");
    expect(flywheelEligibility).toContain("owner_link.user_id = $2");
    expect(flywheelEligibility).toContain("owner_link.status = 'approved'");
    expect(flywheelEligibility).toContain("owner_link.revoked_at IS NULL");
    expect(ownerRoute).toContain("Approved business owner access is required");
    expect(ownerRoute).not.toContain("isAdmin");
  });

  it("keeps skip feedback aggregate-only and authorizes every business-facing reader", () => {
    expect(skipFeedbackRoute).toContain("reasonCode");
    expect(skipFeedbackRoute).toContain("aggregatePrivateSkipFeedbackSignals");
    expect(skipFeedbackRoute).toContain("resolveVerifiedMinorityFlywheelOwner");
    expect(skipFeedbackRoute).not.toContain("deliverToOwnerInbox");
    expect(skipFeedbackRoute).not.toContain("convTable");
    expect(kinfolkRoute).toContain("requireVerifiedMinorityFlywheelBusinessOwner");
    expect(kinfolkRoute).toContain("PRIVACY-PROTECTED COMMUNITY FEEDBACK");
    expect(kinfolkRoute).toContain("aggregatePrivateSkipFeedbackSignals(skipRows)");
  });

  it("protects business market intelligence and withholds raw member search text", () => {
    expect(marketIntelligenceRoute).toContain("resolveVerifiedMinorityFlywheelOwner");
    expect(marketIntelligenceRoute).toContain("VERIFIED_MINORITY_FLYWHEEL_ELIGIBILITY_REQUIRED");
    expect(marketIntelligenceRoute).toContain("HAVING COUNT(*) >= 5");
    expect(marketIntelligenceRoute).toContain("trendingCategories");
    expect(marketIntelligenceRoute).toContain("Raw member search text is never");
  });

  it("protects timing recommendations with ownership and a minimum aggregate", () => {
    expect(postNudgeRoute).toContain("requireVerifiedMinorityFlywheelOwner");
    expect(postNudgeRoute).toContain("POST_NUDGE_MINIMUM_AGGREGATE");
    expect(postNudgeRoute).toContain("hasSufficientData: false");
    expect(postNudgeRoute).toContain("INSUFFICIENT_AGGREGATE_DATA");
  });

  it("binds general caption assistance to the current owner without using member review text", () => {
    expect(postNudgeRoute).toContain("Approved business owner access is required");
    expect(postNudgeRoute).toContain("business_owner_links");
    expect(postNudgeRoute).not.toContain("reviewsTable");
    expect(postNudgeRoute).not.toContain("reviewSnippets");
    expect(postNudgeRoute).not.toContain("minority-owned");
  });

  it("uses a founder-only, exact-business, append-only attachment operation", () => {
    expect(attachmentRoute).toContain("isAdmin(req) || !isFounderOwnerRequest(req)");
    expect(attachmentRoute).toContain("CANONICAL_MWM_BUSINESS_ID");
    expect(attachmentRoute).toContain("pg_advisory_xact_lock");
    expect(attachmentRoute).toContain("businessStateChanged: false");
    expect(migrations).toContain('name: "canonical_mwm_owner_attachment_audit_v1"');
    expect(migrations).toContain("ensureCanonicalMwmOwnerAttachmentAuditSchema");
    expect(attachmentRoute).toContain("CANONICAL_MWM_OWNER_AUDIT_SCHEMA_UNAVAILABLE");
    expect(migrations).toContain("canonical_mwm_owner_attachment_audit_immutable");
    expect(migrations).toContain("append-only");
  });

  it("offers consented feedback and private owner insights on web and native", () => {
    for (const source of [webSource, nativeSource]) {
      expect(source).toContain("I need more help");
      expect(source).toContain("Remove feedback");
      expect(source).toContain("does not automatically change Kinfolk");
      expect(source).toContain("needs_more_help");
    }
    expect(webOwnerDashboard).toContain("Private Kinfolk community needs");
    expect(nativeOwnerDashboard).toContain("Private Kinfolk community needs");
  });
});
