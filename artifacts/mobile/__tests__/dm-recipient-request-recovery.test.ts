import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

function between(sourceText: string, start: string, end: string): string {
  return sourceText.split(start)[1]?.split(end)[0] ?? "";
}

const mobileMessages = source("../app/messages.tsx");
const mobileChat = source("../app/chat/[id].tsx");
const webMessages = source("../../web/src/pages/messages.tsx");
const conversations = source("../../api-server/src/routes/conversations.ts");
const recovery = "Couldn't update this message request. Please try again.";

describe("DM recipient request fail-closed recovery", () => {
  it("preserves the existing server recipient, non-requester, direct-message, and block fences", () => {
    const acceptRoute = between(
      conversations,
      'router.post("/conversations/:id/accept"',
      'router.post("/conversations/:id/decline"',
    );
    const declineRoute = between(
      conversations,
      'router.post("/conversations/:id/decline"',
      "// ─── GET",
    );

    for (const route of [acceptRoute, declineRoute]) {
      expect(route).toContain(
        'if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });',
      );
      expect(route).toContain(
        'if (!ids.includes(req.user.id)) return void res.status(403).json({ error: "Forbidden" });',
      );
      expect(route).toContain(
        'if (conv.type !== "dm") return void res.status(400).json({ error: "Not a direct-message request" });',
      );
      expect(route).toContain(
        "if (await dmConversationIsBlocked(conv, req.user.id))",
      );
      expect(route).toContain("if (conv.requestedBy === req.user.id)");
    }
  });

  it("keeps mobile list actions pending on false or thrown hook results and navigates only after acceptance", () => {
    const acceptHandler = between(
      mobileMessages,
      "const handleAccept",
      "const handleDecline",
    );
    const declineHandler = between(
      mobileMessages,
      "const handleDecline",
      "return (",
    );

    expect(mobileMessages).toContain(
      `const REQUEST_ACTION_RECOVERY = "${recovery}";`,
    );
    expect(acceptHandler).toContain(
      "const accepted = await acceptRequest(id);",
    );
    expect(acceptHandler).toContain("if (!accepted)");
    expect(acceptHandler).toContain("Alert.alert(REQUEST_ACTION_RECOVERY);");
    expect(acceptHandler.indexOf("if (!accepted)")).toBeLessThan(
      acceptHandler.indexOf("router.push"),
    );
    expect(declineHandler).toContain(
      "const declined = await declineRequest(id);",
    );
    expect(declineHandler).toContain(
      "if (!declined) Alert.alert(REQUEST_ACTION_RECOVERY);",
    );
    expect(declineHandler).toContain("catch");
  });

  it("requires a valid mobile chat response before local request state or navigation can change", () => {
    const acceptHandler = between(
      mobileChat,
      "const handleAccept",
      "const handleDecline",
    );
    const declineHandler = between(
      mobileChat,
      "const handleDecline",
      "const sendMessage",
    );

    expect(mobileChat).toContain(
      `const REQUEST_ACTION_RECOVERY = "${recovery}";`,
    );
    expect(mobileChat).toContain("function isAcceptedRequestResponse");
    expect(mobileChat).toContain("function isDeclinedRequestResponse");
    expect(acceptHandler).toContain(
      "const payload = (await res.json()) as unknown;",
    );
    expect(acceptHandler).toContain("if (!res.ok)");
    expect(acceptHandler).toContain(
      "if (!isAcceptedRequestResponse(payload, numericId))",
    );
    expect(
      acceptHandler.indexOf("if (!isAcceptedRequestResponse"),
    ).toBeLessThan(acceptHandler.indexOf("setConv("));
    expect(declineHandler).toContain(
      "const payload = (await res.json()) as unknown;",
    );
    expect(declineHandler).toContain(
      "if (!isDeclinedRequestResponse(payload))",
    );
    expect(
      declineHandler.indexOf("if (!isDeclinedRequestResponse"),
    ).toBeLessThan(declineHandler.indexOf("router.back()"));
    expect(`${acceptHandler}\n${declineHandler}`).toContain(
      "setPendingError(REQUEST_ACTION_RECOVERY);",
    );
  });

  it("does not expose a recipient-action server error or change web request state before a valid success response", () => {
    const recipientAction = between(
      webMessages,
      "async function respondToRequest",
      "const isIncomingPending",
    );
    const declineBranch = between(
      recipientAction,
      'if (action === "decline")',
      "} else if",
    );

    expect(webMessages).toContain(
      `const REQUEST_ACTION_RECOVERY = "${recovery}";`,
    );
    expect(recipientAction).not.toContain("payload.error");
    expect(recipientAction).toContain(
      "const payload = (await response.json()) as unknown;",
    );
    expect(recipientAction).toContain("if (!response.ok)");
    expect(recipientAction).toContain(
      "if (!isDeclinedRequestResponse(payload))",
    );
    expect(recipientAction).toContain(
      "isAcceptedRequestResponse(payload, selected.id)",
    );
    expect(recipientAction).toContain(
      'toast({ title: REQUEST_ACTION_RECOVERY, variant: "destructive" });',
    );
    expect(
      recipientAction.indexOf(
        "isAcceptedRequestResponse(payload, selected.id)",
      ),
    ).toBeLessThan(
      recipientAction.indexOf("setConversations((current) => current.map"),
    );
    expect(
      declineBranch.indexOf("if (!isDeclinedRequestResponse(payload))"),
    ).toBeLessThan(
      declineBranch.indexOf("setConversations((current) => current.filter"),
    );
    expect(
      declineBranch.indexOf("if (!isDeclinedRequestResponse(payload))"),
    ).toBeLessThan(declineBranch.indexOf('navigate("/messages")'));
  });

  it("keeps recipient actions visibly limited to incoming pending requests across mobile and web", () => {
    expect(mobileMessages).toContain(
      'c.type === "dm" && c.requestStatus === "pending" && c.requestedBy !== userId',
    );
    expect(mobileChat).toContain(
      "const isIncomingRequest = isPending && conv?.requestedBy !== myUserId;",
    );
    expect(webMessages).toContain(
      'const isIncomingPending = selected?.requestStatus === "pending" && selected.requestedBy !== auth?.user?.id;',
    );
  });

  it("keeps both pending participants read-only until server-authoritative acceptance across web and native", () => {
    const webSend = between(
      webMessages,
      "async function send",
      "async function respondToRequest",
    );
    const nativeOutgoingReadOnly = between(
      mobileChat,
      ") : isOutgoingRequest ? (",
      ") : (",
    );

    expect(webSend).toContain('selected.requestStatus === "pending"');
    expect(webSend.indexOf('selected.requestStatus === "pending"')).toBeLessThan(
      webSend.indexOf("authenticatedFetch"),
    );
    expect(webMessages).toMatch(
      /disabled=\{isIncomingPending\s*\|\|\s*isOutgoingPending\s*\|\|\s*sending\}/,
    );
    expect(webMessages).toMatch(
      /disabled=\{!draft\.trim\(\)\s*\|\|\s*isIncomingPending\s*\|\|\s*isOutgoingPending\s*\|\|\s*sending\}/,
    );
    expect(nativeOutgoingReadOnly).toContain(
      "Waiting for them to accept your request",
    );
    expect(nativeOutgoingReadOnly).not.toContain("TextInput");
    expect(nativeOutgoingReadOnly).not.toContain("sendMessage");
  });
});
