import { describe, expect, it } from "vitest";
import {
  createKinfolkVoicePlaybackQueue,
  normalizeKinfolkVoicePlaybackPayload,
  type KinfolkVoiceAudioClip,
} from "../lib/kinfolkVoicePlayback";

const clip = (spokenText: string, suffix = spokenText): KinfolkVoiceAudioClip => ({
  audio: `audio-${suffix}`,
  spokenText,
});

describe("Kinfolk Web Listen playback", () => {
  it("keeps a short visible response and spoken clip exactly aligned", () => {
    const payload = normalizeKinfolkVoicePlaybackPayload({
      audio: "audio-short",
      spokenText: "A short Kinfolk answer.",
    });
    expect(payload.clips).toEqual([clip("A short Kinfolk answer.", "short")]);
  });

  it("preserves multi-paragraph text including the final yellow sentence", () => {
    const visible = "First paragraph.\n\nSecond paragraph ends with yellow.";
    const payload = normalizeKinfolkVoicePlaybackPayload({
      spokenText: visible,
      clips: [clip("First paragraph.\n\n", "one"), clip("Second paragraph ends with yellow.", "two")],
    });
    expect(payload.clips.map((entry) => entry.spokenText).join("")).toBe(visible);
  });

  it("automatically advances every long-response clip without omission", () => {
    const clips = Array.from({ length: 5 }, (_, index) => clip(`Part ${index + 1}. `, String(index)));
    const queue = createKinfolkVoicePlaybackQueue(clips);
    expect(queue.start()).toBe(0);
    expect(queue.advance()).toBe(1);
    expect(queue.advance()).toBe(2);
    expect(queue.advance()).toBe(3);
    expect(queue.advance()).toBe(4);
    expect(queue.advance()).toBeNull();
    expect(queue.phase()).toBe("finished");
    expect(clips.map((entry) => entry.spokenText).join("")).toBe("Part 1. Part 2. Part 3. Part 4. Part 5. ");
  });

  it("supports pause, resume, replay, and a new-message interruption", () => {
    const queue = createKinfolkVoicePlaybackQueue([clip("One. "), clip("Two. ")]);
    queue.start();
    expect(queue.pause()).toBe(true);
    expect(queue.phase()).toBe("paused");
    expect(queue.resume()).toBe(0);
    expect(queue.advance()).toBe(1);
    expect(queue.unreadText()).toBe("Two. ");
    queue.interrupt();
    expect(queue.phase()).toBe("interrupted");
    expect(queue.replay()).toBe(0);
    expect(queue.currentClip()?.spokenText).toBe("One. ");
  });

  it("refuses a clip payload that would silently omit visible text", () => {
    expect(() => normalizeKinfolkVoicePlaybackPayload({
      spokenText: "Visible final yellow.",
      clips: [clip("Visible final ")],
    })).toThrow(/full visible answer/i);
  });
});
