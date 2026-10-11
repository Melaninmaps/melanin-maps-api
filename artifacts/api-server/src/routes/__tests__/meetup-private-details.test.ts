import { afterEach, describe, expect, it } from "vitest";
import { openMeetupVenue, sealMeetupVenue } from "../meetup-private-details";

const originalKey = process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
const originalKeyId = process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID;

afterEach(() => {
  if (originalKey === undefined) delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY;
  else process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY = originalKey;
  if (originalKeyId === undefined) delete process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID;
  else process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID = originalKeyId;
});

describe("private meetup venue encryption", () => {
  it("seals participant-only venue details without a plaintext fallback", () => {
    process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    process.env.KINFOLK_SENSITIVE_MEMORY_ENCRYPTION_KEY_ID = "meetup-test-key";

    const sealed = sealMeetupVenue("Community center room 2");
    expect(sealed).not.toContain("Community center");
    expect(openMeetupVenue(sealed)).toBe("Community center room 2");
  });

  it("fails closed for legacy plaintext or malformed stored venue values", () => {
    expect(openMeetupVenue("Community center room 2")).toBeNull();
    expect(openMeetupVenue('{"version":1,"encryptedContent":"bad"}')).toBeNull();
  });
});
