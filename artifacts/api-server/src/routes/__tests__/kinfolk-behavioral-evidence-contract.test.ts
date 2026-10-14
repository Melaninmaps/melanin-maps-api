import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routesDir = dirname(fileURLToPath(import.meta.url));
const evidenceRoute = readFileSync(
  resolve(routesDir, "../kinfolk-behavioral-evidence.ts"),
  "utf8",
);
const routeIndex = readFileSync(resolve(routesDir, "../index.ts"), "utf8");
const kinfolkRoute = readFileSync(resolve(routesDir, "../kinfolk.ts"), "utf8");
const runtime = readFileSync(
  resolve(routesDir, "../../kinfolk/behavioral-evidence-runtime.ts"),
  "utf8",
);
const migration = readFileSync(
  resolve(routesDir, "../../../migrations/20261014_kinfolk_behavioral_evidence_source_only.sql"),
  "utf8",
);

function routeSlice(marker: string) {
  const start = kinfolkRoute.indexOf(marker);
  return kinfolkRoute.slice(start, kinfolkRoute.indexOf("\nrouter.", start + marker.length));
}

describe("reviewable behavioral evidence route contract", () => {
  it("mounts only an authenticated owner-scoped, no-store management surface", () => {
    expect(routeIndex).toContain('import kinfolkBehavioralEvidenceRouter from "./kinfolk-behavioral-evidence"');
    expect(routeIndex).toContain("router.use(kinfolkBehavioralEvidenceRouter)");
    expect(evidenceRoute).toContain('res.setHeader("Cache-Control", "no-store")');
    expect(evidenceRoute).toContain('router.get("/kinfolk/behavioral-evidence"');
    expect(evidenceRoute).toContain('router.put("/kinfolk/behavioral-evidence/mode"');
    expect(evidenceRoute).toContain('router.patch(\n  "/kinfolk/behavioral-evidence/:id/approve"');
    expect(evidenceRoute).toContain('router.delete("/kinfolk/behavioral-evidence/:id"');
    expect(evidenceRoute).toContain('router.delete("/kinfolk/behavioral-evidence"');
    expect(evidenceRoute).toContain("Malformed behavioral evidence request");
    expect(evidenceRoute).toContain('res.status(404).json({ error: "Behavioral evidence not found" })');
  });

  it("fails closed while the expressly unexecuted source-only migration is absent", () => {
    expect(evidenceRoute).toContain("KINFOLK_BEHAVIORAL_EVIDENCE_SCHEMA_UNAVAILABLE");
    expect(evidenceRoute).toContain("No behavioral evidence was changed or used.");
    expect(migration).toContain("SOURCE-ONLY / APPROVAL REQUIRED");
    expect(migration).toContain("do not execute automatically");
    expect(migration).not.toMatch(/INSERT\s+INTO|UPDATE\s+kinfolk_|DELETE\s+FROM/iu);
  });

  it("records only after ordinary feedback commits, and never lets evidence failure change feedback", () => {
    const put = routeSlice('router.put("/kinfolk/response-feedback"');
    expect(put).toContain('await client.query("COMMIT")');
    expect(put.indexOf('await client.query("COMMIT")')).toBeLessThan(
      put.indexOf("await recordBehavioralFeedbackSignal"),
    );
    expect(put).toContain("parseBehavioralFeedbackSignal({ reaction, intentClass })");
    expect(put).toContain("await revokeBehavioralFeedbackSignal(req.user.id, priorBehavioralSignal)");
    expect(put).toContain("Kinfolk behavioral evidence recording unavailable after response feedback");
    expect(put).toContain("safeKinfolkErrorMetadata(error)");
    expect(put).not.toMatch(/recordBehavioralFeedbackSignal\([^)]*note/);
    expect(put).not.toMatch(/recordBehavioralFeedbackSignal\([^)]*sessionId/);

    const remove = routeSlice('router.delete("/kinfolk/response-feedback/:messageId"');
    expect(remove).toContain("RETURNING id, reaction, intent_class");
    expect(remove).toContain("await revokeBehavioralFeedbackSignal(");
    expect(remove).toContain("Kinfolk behavioral evidence reconciliation unavailable after feedback revoke");
  });

  it("keeps ledger writes separate from raw feedback content and loads only direct prompt matches", () => {
    expect(runtime).toContain("signalKey: signal.signalKey");
    const recordSignal = runtime.slice(
      runtime.indexOf("export async function recordBehavioralFeedbackSignal"),
      runtime.indexOf("export async function revokeBehavioralFeedbackSignal"),
    );
    expect(recordSignal).not.toMatch(/messageId:|sessionId:|note:|businessName:|location:|responseContent:/);
    expect(runtime).toContain("eq(kinfolkBehavioralEvidenceTable.signalKey, intentClass)");
    expect(runtime).toContain("return []");
    expect(runtime).toContain("logUnavailable(\"chat_load\", error)");

    const chat = routeSlice('router.post("/kinfolk/chat"');
    expect(chat).toContain("loadActiveBehavioralEvidenceForPrompt(req.user.id, intentClass)");
    expect(chat).toContain("buildBehavioralEvidencePrompt(");
    expect(chat).toContain("buildLeanGeneralChatPrompt");
    expect(chat).toContain("behavioralEvidencePrompt");
    expect(chat).not.toMatch(/responseMeta[^\n]*behavioralEvidence|behavioralEvidence[^\n]*responseMeta/);
  });
});
