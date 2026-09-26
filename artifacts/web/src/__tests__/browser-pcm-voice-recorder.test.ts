import { describe, expect, it } from "vitest";
import { encodePcm16Wav } from "../lib/browserPcmVoiceRecorder";

describe("browser PCM voice capture", () => {
  it("encodes a standards-based mono PCM WAV container", async () => {
    const blob = encodePcm16Wav([new Float32Array([0, 0.5, -0.5, 1, -1])], 16_000);
    expect(blob.type).toBe("audio/wav");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...bytes.slice(8, 12))).toBe("WAVE");
    expect(String.fromCharCode(...bytes.slice(12, 16))).toBe("fmt ");
    expect(String.fromCharCode(...bytes.slice(36, 40))).toBe("data");
    expect(bytes.length).toBe(54);
  });

  it("downsamples browser PCM to the bounded upload sample rate", async () => {
    const blob = encodePcm16Wav([new Float32Array(48_000)], 48_000);
    const view = new DataView(await blob.arrayBuffer());
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint32(40, true)).toBe(32_000);
  });
});
