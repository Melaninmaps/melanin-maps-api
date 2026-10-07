import { describe, expect, it } from "vitest";
import {
  KINFOLK_IMAGE_CREATION_LABEL,
  createKinfolkImageGenerationRateLimiter,
  decideKinfolkImageCreation,
} from "../image-generation-policy";

describe("Kinfolk ephemeral image creation policy", () => {
  const approvedRequest = {
    brief: "A warm abstract storefront-inspired pattern in gold, terracotta, and deep green.",
    providerDisclosureAccepted: true,
    noRealPersonOrPrivateInfoConfirmed: true,
  };

  it("allows a disclosed non-personal decorative request and keeps the provider prompt constrained", () => {
    const decision = decideKinfolkImageCreation(approvedRequest);
    expect(decision.ok).toBe(true);
    if (!decision.ok) return;
    expect(decision.providerDisclosure).toContain("not saved to Kinfolk memory");
    expect(decision.prompt).toContain("no people, faces, bodies");
    expect(decision.prompt).toContain("letters, words, numbers");
    expect(KINFOLK_IMAGE_CREATION_LABEL).toBe("AI-generated visual");
  });

  it("requires both affirmative disclosures before a prompt reaches the provider", () => {
    const decision = decideKinfolkImageCreation({ ...approvedRequest, providerDisclosureAccepted: false });
    expect(decision).toMatchObject({ ok: false, code: "KINFOLK_IMAGE_CONSENT_REQUIRED" });
  });

  it("blocks person, realism, document, and text-bearing requests without attempting a provider call", () => {
    for (const brief of [
      "A portrait of a real customer for my business.",
      "A realistic photo of a restaurant owner.",
      "A flyer with the date, price, and business logo.",
      "A screenshot of a passport with a new picture.",
    ]) {
      expect(decideKinfolkImageCreation({ ...approvedRequest, brief })).toMatchObject({
        ok: false,
        code: "KINFOLK_IMAGE_REQUEST_UNSUPPORTED",
      });
    }
  });

  it("enforces a per-member cooldown without sharing a limit across members", () => {
    let current = 1_000;
    const limiter = createKinfolkImageGenerationRateLimiter(() => current, 30_000);
    expect(limiter.claim("member-a")).toBeNull();
    expect(limiter.claim("member-a")).toBe(30);
    expect(limiter.claim("member-b")).toBeNull();
    current += 30_001;
    expect(limiter.claim("member-a")).toBeNull();
  });
});
