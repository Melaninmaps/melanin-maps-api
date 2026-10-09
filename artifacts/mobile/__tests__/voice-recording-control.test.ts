import { describe, expect, it } from "vitest";
import { createVoiceRecordingControl } from "../lib/voiceRecordingControl";

describe("voice recording upload control", () => {
  it("permits transcription only for an active member-authorized recording", () => {
    const control = createVoiceRecordingControl();
    const session = control.begin();

    expect(control.permitsTranscription(session)).toBe(true);
    expect(control.permitsTranscription(session + 1)).toBe(false);
  });

  it("blocks a late recorder-stop callback after cancellation or interruption", () => {
    const control = createVoiceRecordingControl();
    const session = control.begin();

    control.cancel();

    expect(control.permitsTranscription(session)).toBe(false);
  });

  it("aborts an in-flight transcription when the member closes or cancels recording", () => {
    const control = createVoiceRecordingControl();
    const session = control.begin();
    const request = control.beginTranscription(session);

    control.cancel();

    expect(request?.signal.aborted).toBe(true);
    expect(control.permitsTranscription(session)).toBe(false);
  });

  it("does not allow a completed recording to be uploaded again", () => {
    const control = createVoiceRecordingControl();
    const session = control.begin();

    control.finish(session);

    expect(control.permitsTranscription(session)).toBe(false);
  });

  it("does not revive a cancelled session when a new recording begins", () => {
    const control = createVoiceRecordingControl();
    const cancelledSession = control.begin();
    control.cancel();
    const currentSession = control.begin();

    expect(control.permitsTranscription(cancelledSession)).toBe(false);
    expect(control.permitsTranscription(currentSession)).toBe(true);
  });
});
