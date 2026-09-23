import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk native voice multipart fallback", () => {
  it("accepts Expo's opaque Blob transport only when a validated declared MIME is supplied", () => {
    expect(source).toContain('file.mimetype === "application/octet-stream"');
    expect(source).toContain("const declaredFormat = declaredMimeType");
    expect(source).toContain("const format = uploadedFormat ?? declaredFormat");
    expect(source).toContain("inspectVoiceAudio(buffer, canonicalMimeType");
  });
});
