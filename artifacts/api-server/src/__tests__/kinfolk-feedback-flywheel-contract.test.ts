import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const kinfolkRoute = readFileSync(fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)), "utf8");
const ownerRoute = readFileSync(fileURLToPath(new URL("../routes/business-owner-insights.ts", import.meta.url)), "utf8");
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
    expect(ownerRoute).toContain("user_id = $2");
    expect(ownerRoute).toContain("status = 'approved'");
    expect(ownerRoute).toContain("Approved business owner access is required");
    expect(ownerRoute).not.toContain("isAdmin");
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
