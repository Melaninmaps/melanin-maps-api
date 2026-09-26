import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(new URL("../routes/kinfolk.ts", import.meta.url), "utf8");
const webMemoryManagerSource = readFileSync(
  new URL("../../../web/src/components/kinfolk/KinfolkMemoryManager.tsx", import.meta.url),
  "utf8",
);
const mobileSettingsSource = readFileSync(
  new URL("../../../mobile/app/kinfolk-settings.tsx", import.meta.url),
  "utf8",
);

describe("Kinfolk practical relevance and member reset contract", () => {
  it("adds current-event relevance only from permitted, non-sensitive context", () => {
    expect(routeSource).toContain("PRACTICAL CURRENT-EVENT RELEVANCE");
    expect(routeSource).toContain("current-turn need or a non-sensitive preference/history signal");
    expect(routeSource).toContain("never as a fact to repeat back or an identity to infer");
    expect(routeSource).toContain("Keep current-event facts impartial, complete for the question asked");
    expect(routeSource).toContain("Never change source selection, causal claims, material uncertainty, or the factual conclusion");
    expect(routeSource).toContain("The factual answer and cited sources always come first");
    expect(routeSource).toContain("Want a gas-price and household-cost breakdown?");
    expect(routeSource).toContain("Want the official military-readiness view?");
    expect(routeSource).toContain("Do not surface a sensitive topic, private memory, hidden profile field");
  });

  it("requires an authenticated member and explicit confirmation before resetting Kinfolk", () => {
    expect(routeSource).toContain('router.delete("/kinfolk/reset"');
    expect(routeSource).toContain("Authentication required");
    expect(routeSource).toContain("KINFOLK_RESET_CONFIRMATION_REQUIRED");
    expect(routeSource).toContain("confirmation !== true");
  });

  it("clears only Kinfolk-owned conversation and learning data and invalidates caches", () => {
    expect(routeSource).toContain(".delete(kinfolkSessionsTable)");
    expect(routeSource).toContain(".delete(kinfolkFeedbackTable)");
    expect(routeSource).toContain(".delete(kinfolkResponseFeedbackTable)");
    expect(routeSource).toContain(".update(kinfolkPrivateMemoriesTable)");
    expect(routeSource).toContain("kinfolkMemoryEnabled: false");
    expect(routeSource).toContain("personalisedSuggestions: false");
    expect(routeSource).toContain("invalidatePrefsCache(userId)");
    expect(routeSource).toContain("invalidateSessionsCache(userId)");
    expect(routeSource).toContain("Community, circles, saves, memberships");
    expect(routeSource).not.toContain(".delete(usersTable)");
  });

  it("exposes the confirmed reset control on both signed-in clients", () => {
    expect(webMemoryManagerSource).toContain('data-testid="reset-kinfolk"');
    expect(webMemoryManagerSource).toContain("Start Kinfolk fresh?");
    expect(webMemoryManagerSource).toContain("api/kinfolk/reset");
    expect(mobileSettingsSource).toContain('accessibilityLabel="Reset Kinfolk"');
    expect(mobileSettingsSource).toContain("Start Kinfolk fresh?");
    expect(mobileSettingsSource).toContain("api/kinfolk/reset");
  });

  it("honors the member's saved Kinfolk Voice when a chat entry point has no turn override", () => {
    expect(routeSource).toContain("voiceMode: requestedVoiceMode");
    expect(routeSource).toContain("savedConversationMode = prefs?.personalityMode");
    expect(routeSource).toContain("requestedVoiceMode ?? savedConversationMode");
    expect(routeSource).toContain("voiceMode: conversationVoiceMode");
    expect(routeSource).toContain("buildLeanGeneralChatPrompt(conversationVoiceMode)");
    expect(routeSource).toContain("buildKinfolkFormalResponseContract()");
    expect(routeSource).toContain('content: systemPromptWithResponseFormat');
    expect(routeSource).toContain("isKinfolkFormalDocumentRequest(message)");
    expect(routeSource).toContain("reply = normalizeKinfolkFormalDocumentReply(reply)");
    expect(routeSource).toContain("buildKinfolkEmotionalCheckInContract(normalizedConversationMode)");
  });
});
