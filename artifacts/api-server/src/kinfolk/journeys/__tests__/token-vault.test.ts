import { afterEach, describe, expect, it, vi } from "vitest";
import {
  JourneyTokenVaultError,
  opaqueJourneyReference,
  openJourneyToken,
  redactedConnectionState,
  sealJourneyToken,
} from "../token-vault";

const connectionContext = {
  purpose: "provider_connection" as const,
  memberId: "member-1",
  provider: "google_calendar",
  connectionId: "connection-1",
};

describe("Journey token vault", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("requires a configured 256-bit server key", () => {
    expect(() =>
      sealJourneyToken({ refreshToken: "secret" }, connectionContext),
    ).toThrow(JourneyTokenVaultError);
  });

  it("round-trips a private envelope while public state remains redacted", () => {
    vi.stubEnv(
      "KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY",
      Buffer.alloc(32, 7).toString("base64"),
    );
    vi.stubEnv("KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY_ID", "journeys-v1");
    vi.stubEnv(
      "KINFOLK_JOURNEYS_REFERENCE_HMAC_KEY",
      Buffer.alloc(32, 8).toString("base64"),
    );
    const sealed = sealJourneyToken(
      {
        refreshToken: "private-value",
        providerAccount: "private@example.test",
      },
      connectionContext,
    );
    expect(sealed).not.toContain("private-value");
    expect(openJourneyToken(sealed, connectionContext)).toEqual({
      refreshToken: "private-value",
      providerAccount: "private@example.test",
    });
    expect(() =>
      openJourneyToken(sealed, { ...connectionContext, memberId: "member-2" }),
    ).toThrow("secure reconnection");
    expect(
      opaqueJourneyReference({
        memberId: "member-1",
        provider: "google_calendar",
        kind: "calendar",
        value: "private-calendar-id",
      }),
    ).not.toContain("private-calendar-id");
    expect(
      opaqueJourneyReference({
        memberId: "member-1",
        provider: "google_calendar",
        kind: "calendar",
        value: "private-calendar-id",
      }),
    ).not.toEqual(
      opaqueJourneyReference({
        memberId: "member-2",
        provider: "google_calendar",
        kind: "calendar",
        value: "private-calendar-id",
      }),
    );
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
