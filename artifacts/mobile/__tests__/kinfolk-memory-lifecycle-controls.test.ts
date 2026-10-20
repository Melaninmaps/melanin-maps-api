import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const memory = readFileSync(new URL("../app/kinfolk-memory.tsx", import.meta.url), "utf8");
const inlineMemoryConsent = readFileSync(
  new URL("../components/KinfolkInlineMemoryConsent.tsx", import.meta.url),
  "utf8",
);
const sensitiveMemoryConfirmation = readFileSync(
  new URL("../components/KinfolkSensitiveMemoryConfirmation.tsx", import.meta.url),
  "utf8",
);

describe("native generic private-memory lifecycle controls", () => {
  it("lists reviewable paused notes and sends only the owner-scoped pause mutation", () => {
    expect(memory).toContain("/api/kinfolk/memories?includeInactive=true&offset=0");
    expect(memory).toContain("nextOffset");
    expect(memory).toContain("/api/kinfolk/memories/${encodeURIComponent(id)}/pause");
    expect(memory).toContain('method: "PATCH"');
    expect(memory).toContain("body: JSON.stringify({ paused })");
  });

  it("shows truthful pause, resume, and revoke-use states", () => {
    expect(memory).toContain("Pause use");
    expect(memory).toContain("Resume use");
    expect(memory).toContain("Paused — Kinfolk will not use this note until you resume it.");
    expect(memory).toContain("Revoke use");
    expect(memory).not.toContain("Delete this memory permanently");
  });

  it("fails closed with a sign-in error before a revoke request or local removal when authentication is unavailable", () => {
    const revokeMemory = memory.slice(
      memory.indexOf("const revokeMemory = async"),
      memory.indexOf("const saveEdit = async"),
    );
    const missingTokenError = 'if (!token) throw new Error("Please sign in again before revoking memory.");';
    const deleteRequest = "method: \"DELETE\"";
    const localRemoval = "setPrivateMemories((items) => items.filter((item) => item.id !== id))";

    expect(revokeMemory).toContain("try {");
    expect(revokeMemory).toContain(missingTokenError);
    expect(revokeMemory).toContain("} catch (cause) { setMemoryError(");
    expect(revokeMemory).not.toContain("if (!token) return");
    expect(revokeMemory.indexOf(missingTokenError)).toBeLessThan(revokeMemory.indexOf(deleteRequest));
    expect(revokeMemory.indexOf(missingTokenError)).toBeLessThan(revokeMemory.indexOf(localRemoval));
    expect(revokeMemory.indexOf("if (!response.ok)")).toBeLessThan(revokeMemory.indexOf(localRemoval));
  });

  it("labels saved hard requirements so a member can distinguish them from preferences", () => {
    expect(memory).toContain('memory.purpose === "requirement_context"');
    expect(memory).toContain("saved requirement · not silently relaxed");
  });

  it("keeps inline choices while separately confirming sensitive selections", () => {
    expect(inlineMemoryConsent).toContain('"Save all for relevant use"');
    expect(inlineMemoryConsent).toContain("Save only preferences and interests");
    expect(inlineMemoryConsent).toContain("Choose individually");
    expect(inlineMemoryConsent).toContain("Don’t save");
    expect(inlineMemoryConsent).toContain("const saveAll = () => {");
    expect(inlineMemoryConsent).toContain("if (plan.sensitive.length > 0)");
    expect(inlineMemoryConsent).toContain("setSelected(allItems.map((item) => item.id));");
    expect(inlineMemoryConsent).toContain("I agree to save the selected sensitive details for relevant use.");
    expect(inlineMemoryConsent).toContain("selectedSensitive && !sensitiveConsent");
    expect(inlineMemoryConsent).toContain("sensitiveConsent: true");
    expect(inlineMemoryConsent).not.toContain(
      "onPress={() => void save(allItems.map((item) => item.id))}",
    );
  });

  it("keeps sensitive detail behind the separate recent-authentication vault", () => {
    expect(memory).toContain("Sensitive Memory Vault");
    expect(memory).toContain("/api/kinfolk/sensitive-memory-vault/reauth");
    expect(memory).toContain("/api/kinfolk/sensitive-memories/${encodeURIComponent(memory.id)}");
    expect(memory).toContain("Sensitive private memory");
    expect(memory).toContain("Only mention if I ask");
  });

  it("makes the separate sensitive-memory confirmation match its relevant-use promise", () => {
    expect(sensitiveMemoryConfirmation).toContain("sensitiveRestricted: false");
    expect(sensitiveMemoryConfirmation).toContain("Save this sensitive detail for relevant use?");
    expect(sensitiveMemoryConfirmation).toContain("Save for relevant use");
  });

  it("requires fresh password confirmation before either sensitive save path", () => {
    for (const surface of [inlineMemoryConsent, sensitiveMemoryConfirmation]) {
      expect(surface).toContain("/api/kinfolk/sensitive-memory-vault/reauth");
      expect(surface).toContain("Confirm your password");
      expect(surface).toContain("secureTextEntry");
    }
  });
});
