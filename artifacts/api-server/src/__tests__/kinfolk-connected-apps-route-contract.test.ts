import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const route = readFileSync(
  resolve(process.cwd(), "src/routes/kinfolk-connected-apps.ts"),
  "utf8",
);
const kinfolkRoute = readFileSync(
  resolve(process.cwd(), "src/routes/kinfolk.ts"),
  "utf8",
);

describe("Kinfolk Connected Apps route contract", () => {
  it("requires an authenticated member and explicit consent", () => {
    expect(route).toContain('router.get("/kinfolk-connected-apps"');
    expect(route).toContain(
      'router.post("/kinfolk-connected-apps/:appKey/permissions"',
    );
    expect(route).toContain("AUTH_REQUIRED");
    expect(route).toContain("EXPLICIT_CONSENT_REQUIRED");
    expect(route).toContain("SENSITIVE_DATA_ACKNOWLEDGEMENT_REQUIRED");
  });

  it("never serializes token envelopes and provides revoke/delete boundaries", () => {
    expect(route).not.toMatch(/tokenEnvelope:\s*permission\.token_envelope/);
    expect(route).toContain(
      'router.post("/kinfolk-connected-apps/:appKey/revoke"',
    );
    expect(route).toContain('router.delete("/kinfolk-connected-apps/:appKey"');
    expect(route).toContain("token_envelope = NULL");
    expect(route).toContain("kinfolk_connected_app_audit");
    expect(route).toContain("consent_recorded");
    expect(route).toContain("authorization_revoked");
    expect(route).toContain("permission_deleted");
    expect(route).toContain("contextual");
  });

  it("clears local authorization on revoke or deletion without deleting a Journey", () => {
    expect(route).toContain("revokeJourneyProviderConnection");
    expect(route).toContain(
      "SET status = 'revoked', token_envelope = NULL, oauth_state_hash = NULL",
    );
    expect(route).toContain("provider_account_ref = NULL");
    expect(route).toContain("selected_calendar_ref = NULL");
    expect(route).toContain(
      "SET status = 'deleted', token_envelope = NULL, deleted_at = NOW()",
    );
    expect(route).toContain(
      "Authorization and any stored provider token envelope were revoked.",
    );
    expect(route).toContain(
      "This action does not silently delete Journey plans",
    );
  });

  it("offers contextual prompts without linking private attachment content to an app", () => {
    expect(kinfolkRoute).toContain(
      "buildContextualConnectedAppsPrompt(message)",
    );
    expect(kinfolkRoute).toContain("connectedAppsPrompt");
    expect(kinfolkRoute).toContain("isPrivateQuestionAttachment\n      ? null");
    expect(kinfolkRoute).toContain(
      "...(connectedAppsPrompt && { connectedAppsPrompt })",
    );
  });
});
