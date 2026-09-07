import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync(new URL("../../routes/kinfolk.ts", import.meta.url), "utf8");
const start = route.indexOf('router.post("/kinfolk/transcribe"');
const end = route.indexOf('router.post("/kinfolk/speak"', start);
const block = route.slice(start, end);

describe("production Kinfolk transcription route contract", () => {
  it("checks authentication before provider configuration", () => {
    expect(block.indexOf("if (!req.user?.id)")).toBeGreaterThan(-1);
    expect(block.indexOf('process.env["AI_INTEGRATIONS_OPENAI_API_KEY"]')).toBeGreaterThan(block.indexOf("if (!req.user?.id)"));
  });

  it("requires bounded multipart uploads, then inspects actual container duration", () => {
    expect(route).toContain("limits: { fileSize: MAX_VOICE_PAYLOAD_BYTES, files: 1, fields: 2, parts: 3 }");
    expect(block).toContain('req.is("multipart/form-data")');
    expect(block).toContain('error: "AUDIO_MULTIPART_REQUIRED"');
    expect(block).not.toContain('req.is("application/json")');
    expect(block).toContain("await inspectVoiceAudio(buffer, canonicalMimeType, MAX_VOICE_DURATION_MS)");
    expect(block).toContain('const transcriptionModel = kinfolkModel("transcription")');
  });

  it("returns no-retention responses and never logs audio or transcript content", () => {
    expect(block).toContain("audioRetained: false");
    expect(block).not.toMatch(/console\.(?:log|warn|error)\([^\n]*(?:transcript|audio\.toString)/i);
    expect(block).not.toMatch(/req\.log\.(?:info|warn|error)\([^\n]*(?:transcription\.text|transcriptText|buffer\.toString)/i);
  });

  it("never emits raw exception messages, stacks, or Error objects from Kinfolk routes", () => {
    expect(route).toContain("safeKinfolkErrorMetadata(err)");
    expect(route).not.toContain("`msg=${errMsg");
    expect(route).not.toContain("`stack=${errStack");
    expect(route).not.toMatch(/req\.log(?:\?\.|\.)(?:error|warn)\(\{\s*err\s*\}/);
    expect(route).not.toMatch(/console\.(?:error|warn)\([^\n]*(?:\.message|\.stack)/);
  });
});
