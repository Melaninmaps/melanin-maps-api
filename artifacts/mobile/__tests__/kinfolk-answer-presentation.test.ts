import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { kinfolkAnswerBlocks } from "../lib/kinfolkAnswerBlocks";

const travelSource = readFileSync(
  fileURLToPath(new URL("../app/travel.tsx", import.meta.url)),
  "utf8",
);
const widgetSource = readFileSync(
  fileURLToPath(new URL("../components/AIChatWidget.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk mobile answer presentation", () => {
  it("preserves safe paragraph, list, step, and code boundaries", () => {
    expect(kinfolkAnswerBlocks("First paragraph.\n\n- One\n- Two\n\n1. First\n2. Second")).toEqual([
      { kind: "paragraph", text: "First paragraph." },
      { kind: "bullets", items: ["One", "Two"] },
      { kind: "steps", items: ["First", "Second"] },
    ]);
    expect(kinfolkAnswerBlocks("```ts\nconst answer = '<b>text</b>';\n```"))
      .toEqual([{ kind: "code", text: "const answer = '<b>text</b>';" }]);
  });

  it("uses the same safe renderer in primary and floating Kinfolk conversations", () => {
    expect(travelSource).toContain('import { KinfolkAnswerText } from "@/components/KinfolkAnswerText"');
    expect(travelSource).toContain("<KinfolkAnswerText");
    expect(travelSource).toContain("content={msg.content}");
    expect(widgetSource).toContain('import { KinfolkAnswerText } from "@/components/KinfolkAnswerText"');
    expect(widgetSource).toContain("<KinfolkAnswerText");
    expect(widgetSource).toContain("content={item.text}");
    expect(widgetSource).not.toContain("renderKinfolkMessageText");
  });
});
