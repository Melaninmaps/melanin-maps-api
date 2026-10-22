import { describe, expect, it } from "vitest";
import { isCommunityVerificationIsolatedTest } from "../communityVerificationIsolatedTest";

describe("isCommunityVerificationIsolatedTest", () => {
  it("requires an explicit true value", () => {
    expect(
      isCommunityVerificationIsolatedTest({
        COMMUNITY_VERIFICATION_ISOLATED_TEST: "true",
      }),
    ).toBe(true);

    for (const value of [undefined, "", "false", "TRUE", "1"]) {
      expect(
        isCommunityVerificationIsolatedTest({
          COMMUNITY_VERIFICATION_ISOLATED_TEST: value,
        }),
      ).toBe(false);
    }
  });
});
