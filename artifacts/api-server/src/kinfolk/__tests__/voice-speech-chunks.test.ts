import { describe, expect, it } from "vitest";
import {
  KINFOLK_SPEECH_CHUNK_MAX_CHARACTERS,
  splitKinfolkSpeechText,
} from "../voice-speech-chunks";

describe("Kinfolk speech chunking", () => {
  it("keeps a short reply as one exact clip", () => {
    const reply = "A short answer ends with yellow.";
    expect(splitKinfolkSpeechText(reply)).toEqual([reply]);
  });

  it("preserves multi-paragraph visible text exactly", () => {
    const reply = "First paragraph has context.\n\nSecond paragraph has the final yellow detail.";
    const chunks = splitKinfolkSpeechText(reply, 80);
    expect(chunks.join("")).toBe(reply);
    expect(chunks.at(-1)).toContain("yellow detail.");
  });

  it("continues a long reply across lossless provider clips", () => {
    const reply = Array.from({ length: 32 }, (_, index) =>
      `Paragraph ${index + 1} keeps its sentence boundary and useful detail.`,
    ).join("\n\n") + "\n\nThe final visible sentence says yellow.";
    const chunks = splitKinfolkSpeechText(reply, 140);

    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.every((chunk) => chunk.length <= 140)).toBe(true);
    expect(chunks.join("")).toBe(reply);
    expect(chunks.at(-1)).toContain("yellow.");
  });

  it("uses the documented provider-safe default without a member-visible cutoff", () => {
    const reply = "x".repeat(KINFOLK_SPEECH_CHUNK_MAX_CHARACTERS + 25);
    const chunks = splitKinfolkSpeechText(reply);
    expect(chunks).toHaveLength(2);
    expect(chunks.join("")).toBe(reply);
  });
});
