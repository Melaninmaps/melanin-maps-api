import { afterEach, describe, expect, it, vi } from "vitest";
import {
  JourneyTokenVaultError,
  openJourneyToken,
  redactedConnectionState,
  sealJourneyToken,
} from "../token-vault";

describe("Journey token vault", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("requires a configured 256-bit server key", () => {
    expect(() => sealJourneyToken({ refreshToken: "secret" })).toThrow(
      JourneyTokenVaultError,
    );
  });

  it("round-trips a private envelope while public state remains redacted", () => {
    vi.stubEnv(
      "KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY",
      Buffer.alloc(32, 7).toString("base64"),
    );
    const sealed = sealJourneyToken({
      refreshToken: "private-value",
      providerAccount: "private@example.test",
    });
    expect(sealed).not.toContain("private-value");
    expect(openJourneyToken(sealed)).toEqual({
      refreshToken: "private-value",
      providerAccount: "private@example.test",
    });
    expect(
      redactedConnectionState({
        provider: "gmail",
        status: "connected",
        scopes: ["selected_items"],
      }),
    ).toEqual({
      provider: "gmail",
      status: "connected",
      expiresAt: null,
      scopes: ["selected_items"],
      tokenPresent: false,
    });
  });
});
