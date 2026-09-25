import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);
const discovery = readFileSync(
  fileURLToPath(new URL("../kinfolk/local-business-discovery.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk mobile continuity contract", () => {
  it("keeps a bounded current-device conversation available without enabling memory", () => {
    expect(source).toContain("function boundedEphemeralConversation(value: unknown): SessionMessage[]");
    expect(source).toContain("value.slice(-6)");
    expect(source).toContain("conversationContext?: unknown;");
    expect(source).toContain("conversationContext,");
    expect(source).toContain("const conversationMessages = currentSession?.messages?.length");
    expect(source).toContain(": boundedEphemeralConversation(input.conversationContext);");
  });

  it("does not stop a broad salon request before governed inventory is searched", () => {
    expect(source).not.toContain("const clarificationSteps = businessDiscoveryClarification({");
    expect(source).toContain("const discoveryResult = await discoverLocalBusinesses({");
  });

  it("keeps provider implementation details out of member-facing source notes", () => {
    expect(discovery).not.toContain("no web-search provider is configured");
    expect(discovery).toContain("Current external details are unavailable right now.");
  });

  it("uses plain member-facing ownership discovery language", () => {
    expect(source).toContain("I found ${platformCount} ${designationSummary} ${requestedSubjectLabel}");
    expect(source).toContain("const requestedSubjectLabel = subject.dietaryRequirement");
    expect(source).not.toContain("Diaspora Promotion Catalog listings");
  });
});
