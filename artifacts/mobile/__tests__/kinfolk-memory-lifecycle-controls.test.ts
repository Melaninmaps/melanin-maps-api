import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const memory = readFileSync(new URL("../app/kinfolk-memory.tsx", import.meta.url), "utf8");

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
});
