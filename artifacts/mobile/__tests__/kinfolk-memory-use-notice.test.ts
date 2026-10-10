import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const hook = readFileSync(resolve(here, "../hooks/useKinfolk.ts"), "utf8");
const travel = readFileSync(resolve(here, "../app/travel.tsx"), "utf8");
const widget = readFileSync(
  resolve(here, "../components/AIChatWidget.tsx"),
  "utf8",
);
const notice = readFileSync(
  resolve(here, "../components/KinfolkMemoryUseNotice.tsx"),
  "utf8",
);

describe("Kinfolk memory-use member notice", () => {
  it("carries only a generic applied notice through both chat surfaces", () => {
    expect(hook).toContain("memoryUse?: KinfolkMemoryUse | null");
    expect(hook).toContain("memoryUse: data.memoryUse ?? null");
    expect(travel).toContain(
      "<KinfolkMemoryUseNotice memoryUse={item.memoryUse} />",
    );
    expect(widget).toContain(
      "<KinfolkMemoryUseNotice memoryUse={item.memoryUse} />",
    );
  });

  it("does not expose a private note in the display copy", () => {
    expect(notice).toContain("Saved Kinfolk preference used");
    expect(notice).not.toContain("content:");
    expect(notice).not.toContain("memory.content");
  });
});
