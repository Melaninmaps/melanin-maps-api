import { afterEach, describe, expect, it } from "vitest";
import {
  __resetKinfolkConversationForTests,
  clearKinfolkConversation,
  getKinfolkConversation,
  recordKinfolkConversation,
} from "../lib/kinfolkConversationHandoff";
import fs from "node:fs";
import path from "node:path";

afterEach(() => __resetKinfolkConversationForTests());

describe("Kinfolk cross-surface conversation handoff", () => {
  it("hands an opaque floating session to the same account's primary chat only", () => {
    recordKinfolkConversation("member-a", "session-floating", "floating");

    expect(getKinfolkConversation("member-a")).toEqual({
      sessionId: "session-floating",
      surface: "floating",
    });
    expect(getKinfolkConversation("member-b")).toBeNull();
  });

  it("updates the active opaque session without retaining any transcript payload", () => {
    recordKinfolkConversation("member-a", "session-one", "floating");
    recordKinfolkConversation("member-a", "session-two", "primary");

    expect(getKinfolkConversation("member-a")).toEqual({
      sessionId: "session-two",
      surface: "primary",
    });
  });

  it("does not let another account clear an active member session", () => {
    recordKinfolkConversation("member-a", "session-one", "floating");
    clearKinfolkConversation("member-b");

    expect(getKinfolkConversation("member-a")).toEqual({
      sessionId: "session-one",
      surface: "floating",
    });
  });

  it("fails closed for missing account or session identifiers", () => {
    recordKinfolkConversation("", "session-one", "floating");
    recordKinfolkConversation("member-a", "", "floating");

    expect(getKinfolkConversation("member-a")).toBeNull();
  });

  it("wires full-chat continuation through account-scoped handoff rather than transcript storage", () => {
    const root = path.resolve(__dirname, "..");
    const primary = fs.readFileSync(path.join(root, "hooks", "useKinfolk.ts"), "utf8");
    const floating = fs.readFileSync(path.join(root, "components", "AIChatWidget.tsx"), "utf8");
    const handoff = fs.readFileSync(path.join(root, "lib", "kinfolkConversationHandoff.ts"), "utf8");

    expect(primary).toContain('getKinfolkConversation(user?.id)');
    expect(primary).toContain('recordKinfolkConversation(user?.id, data.sessionId, "primary")');
    expect(primary).toContain("void loadSession(handoffSessionToLoad)");
    expect(floating).toContain('recordKinfolkConversation(accountId, data.sessionId, "floating")');
    expect(floating).toContain('router.push("/travel" as never)');
    expect(floating).not.toContain("let sessionId: string | undefined");
    expect(handoff).toContain("never transcript text, attachments, prompts, credentials, or member details");
    expect(handoff).toContain("not written to AsyncStorage or\n * SecureStore");
  });
});
