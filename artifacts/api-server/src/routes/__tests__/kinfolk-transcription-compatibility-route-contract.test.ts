import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../kinfolk.ts", import.meta.url)),
  "utf8",
);
const routeStart = routeSource.indexOf('router.post("/kinfolk/transcribe"');
const routeEnd = routeSource.indexOf(
  'router.get("/kinfolk/provider-readiness"',
  routeStart,
);
const transcriptionRoute = routeSource.slice(
  routeStart,
  routeEnd === -1 ? routeSource.length : routeEnd,
);

describe("Kinfolk transcription compatibility route", () => {
  it("uses the shared audio helper so model compatibility and abort privacy are preserved", () => {
    expect(routeStart).toBeGreaterThan(-1);
    expect(routeSource).toContain("speechToText,");
    expect(transcriptionRoute).toContain("await speechToText(");
    expect(transcriptionRoute).toContain(
      'model: transcriptionModel as "gpt-4o-mini-transcribe" | "whisper-1"',
    );
    expect(transcriptionRoute).toContain("signal: controller.signal");
    expect(transcriptionRoute).not.toContain(
      "audioOpenai.audio.transcriptions.create(",
    );
  });
});
