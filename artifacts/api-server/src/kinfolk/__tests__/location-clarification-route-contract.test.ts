import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);
const discoveryRouteStart = routeSource.indexOf(
  "async function tryAnswerDeterministicBusinessDiscovery",
);
const discoveryRoute = routeSource.slice(
  discoveryRouteStart,
  discoveryRouteStart + 22_000,
);
const chatRoute = routeSource.slice(
  routeSource.indexOf('router.post("/kinfolk/chat"'),
  routeSource.indexOf('router.get("/kinfolk/business-action-plan'),
);

describe("Kinfolk location clarification continuation route contract", () => {
  it("accepts inherited discovery context only from server-owned session history", () => {
    expect(discoveryRoute).toContain("const serverConversationMessages = currentSession?.messages?.length");
    expect(discoveryRoute).toContain(
      "resolveBusinessLocationClarificationFollowUp(serverConversationMessages)",
    );
    expect(discoveryRoute).not.toContain(
      "resolveBusinessLocationClarificationFollowUp(conversationMessages)",
    );
    expect(discoveryRoute).toContain("resolveTurnGeography(input.message, null)");
  });

  it("persists the server-issued location clarification before returning it", () => {
    expect(chatRoute).toContain(
      "const clarificationSessionId = await persistDeterministicDiscoveryTurn({",
    );
    expect(chatRoute).toContain("sessionId: clarificationSessionId");
    expect(chatRoute).toContain("reply: clarificationReply");
  });
});
