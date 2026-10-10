import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("contextual Kinfolk route safety wiring", () => {
  it("cancels planning, retrieval, and synthesis for the complete disconnected request lifetime", () => {
    const abortRegistration = routeSource.indexOf('req.once("aborted", abortDisconnectedRequest)');
    const firstAsyncChatWork = routeSource.slice(abortRegistration).search(/\bawait\b/);
    expect(abortRegistration).toBeGreaterThan(0);
    expect(firstAsyncChatWork).toBeGreaterThan(0);
    expect(routeSource).toContain('res.once("close"');
    expect(routeSource).toContain("signal: contextualRequestAbort.signal");
    expect(routeSource).toMatch(/AbortSignal\.any\(\[\s*contextualRequestAbort\.signal,\s*AbortSignal\.timeout\(3_000\),?\s*\]\)/);
    expect(routeSource).toMatch(/AbortSignal\.any\(\[\s*contextualRequestAbort\.signal,\s*AbortSignal\.timeout\(25000\),?\s*\]\)/);
    expect(routeSource).toContain("this.waiters.splice(idx, 1)");
    expect(routeSource).toContain("contextualRequestAbort.signal,");
    expect(routeSource).toContain("await waitForKinfolkRetry(backoffMs, signal)");
    expect(routeSource).toMatch(/retrieveApprovedInternalLibrary\(\{[\s\S]*?signal,/);
  });

  it("fails closed before model synthesis when current evidence is not corroborated", () => {
    const gateIndex = routeSource.search(/contextualEvidenceNeedsFailClosedResponse\(\s*contextualPlan,\s*contextualEvidence,/);
    const promptIndex = routeSource.search(/const baseSystemPrompt\s*=\s*buildSystemPrompt/);
    expect(gateIndex).toBeGreaterThan(0);
    expect(promptIndex).toBeGreaterThan(gateIndex);
    expect(routeSource).toContain("evidence_not_corroborated");
  });

  it("treats retrieved excerpts as untrusted data and blocks protected-context disclosure", () => {
    expect(routeSource).toContain("buildUntrustedEvidenceDataBlock");
    expect(routeSource).toContain("protectContextualOutput");
    expect(routeSource).toContain("renderableValues: [modelPayload.valid ? modelPayload.value : rawContent]");
    expect(routeSource).toContain("recommendations = null");
    expect(routeSource).toContain("promptPrivateMemories.length > 0 && !contextualEvidence");
    expect(routeSource).toContain("contextualEvidence ? [] : promptPrivateMemories");
    expect(routeSource).toMatch(/const historyMessages\s*=\s*contextualEvidence\s*\?\s*\[\]/);
    expect(routeSource).not.toContain("NORMALIZED EVIDENCE (only these URLs support material claims)");
  });

  it("scans ambiguity-classifier JSON and uses server-owned clarification copy", () => {
    expect(routeSource).toContain("const protectedClassifierPayload = protectContextualOutput({");
    expect(routeSource).toMatch(/return protectedClassifierPayload\.blocked\s*\?\s*\{\}\s*:\s*parsedClassifierPayload/);
    expect(routeSource).toContain("Are you asking about food and cooking, a person or cultural topic, a place, or something else?");
    expect(routeSource).not.toContain("sessionId, reply: contextualPlan.clarificationQuestion");
  });

  it("keeps high-risk staff-preview turns in the typed fail-closed evidence path", () => {
    expect(routeSource).toMatch(/contextualResearchEnabled\s*=\s*!isPrivateImageTurn\s*&&\s*\(contextualIntelligenceEnabled\s*\|\|\s*citedResearchRequired\)/);
    expect(routeSource).toContain("if (contextualPlan) {");
    expect(routeSource).not.toContain('if (contextualPlan && evidenceRoute.risk !== "high")');
  });

  it("uses one production binder for structured, media, relationship, evidence, and Library destinations", () => {
    expect(routeSource.match(/const contextualBoundLinks = bindContextualLinksToEvidence\(/g)).toHaveLength(1);
    expect(routeSource).toContain("structuredContent: contextualStructuredContent");
    expect(routeSource).toContain("mediaLinks: contextualMediaLinks");
    expect(routeSource).toContain("relatedConnections: contextualRelatedConnections");
    expect(routeSource).toContain("mediaEvidence: contextualEvidence?.media ?? []");
    expect(routeSource).toMatch(/contextualEvidence\?\.internal\.flatMap\(\(source\)\s*=>\s*source\.libraryPath/);
    expect(routeSource).toContain("libraryPaths: trustedLibraryPaths");
    expect(routeSource).not.toMatch(/mediaLinks:\s*contextualMediaLinks\.filter/);
    expect(routeSource).not.toMatch(/relatedConnections:\s*contextualRelatedConnections\.filter/);
  });
});
