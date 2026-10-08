import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const memoryManager = readFileSync(
  new URL("../components/kinfolk/KinfolkMemoryManager.tsx", import.meta.url),
  "utf8",
);

describe("Web generic private-memory lifecycle controls", () => {
  it("lists reviewable paused notes and uses the owner-scoped pause route", () => {
    expect(memoryManager).toContain("api/kinfolk/memories?includeInactive=true&offset=${offset}");
    expect(memoryManager).toContain("nextOffset");
    expect(memoryManager).toContain("api/kinfolk/memories/${encodeURIComponent(id)}/pause");
    expect(memoryManager).toContain('method: "PATCH"');
    expect(memoryManager).toContain("body: JSON.stringify({ paused })");
  });

  it("shows truthful pause, resume, and revoke-use controls without claiming deletion", () => {
    expect(memoryManager).toContain("Pause use");
    expect(memoryManager).toContain("Resume use");
    expect(memoryManager).toContain("Paused — Kinfolk will not use this memory until you resume it.");
    expect(memoryManager).toContain("Revoke use of this memory");
    expect(memoryManager).not.toContain("Delete this memory permanently");
  });
});
