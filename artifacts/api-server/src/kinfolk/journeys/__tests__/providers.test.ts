import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertJourneyAuthorizationCallback,
  getJourneyProviderReadiness,
  listJourneyProviderCalendars,
  providerNetworkCallsAllowed,
  resolveJourneyProviderAccount,
  startJourneyAuthorization,
} from "../providers";

describe("Journey provider adapters", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports live providers as not configured without exposing credential values", () => {
    const readiness = getJourneyProviderReadiness("google_calendar");
    expect(readiness).toMatchObject({
      provider: "google_calendar",
      status: "not_configured",
    });
    expect(JSON.stringify(readiness)).not.toContain(
      "GOOGLE_JOURNEYS_OAUTH_CLIENT_SECRET",
    );
  });

  it("does not activate commercial flight monitoring by default", () => {
    expect(getJourneyProviderReadiness("flight_status")).toMatchObject({
      status: "disabled",
    });
    expect(providerNetworkCallsAllowed()).toBe(false);
  });

  it("does not misrepresent mailbox-wide provider scopes as selected-message access", () => {
    for (const provider of ["gmail", "outlook_mail"] as const) {
      expect(getJourneyProviderReadiness(provider)).toMatchObject({
        provider,
        status: "disabled",
        accessModes: ["manual"],
      });
    }
  });

  it("uses PKCE, state, nonce, and a short-lived server transaction when configured", () => {
    vi.stubEnv("GOOGLE_JOURNEYS_OAUTH_CLIENT_ID", "test-client");
    vi.stubEnv("GOOGLE_JOURNEYS_OAUTH_CLIENT_SECRET", "test-secret");
    vi.stubEnv(
      "KINFOLK_JOURNEYS_OAUTH_REDIRECT_BASE",
      "https://www.mappingwithmelanin.com",
    );
    vi.stubEnv(
      "KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY",
      Buffer.alloc(32, 3).toString("base64"),
    );
    vi.stubEnv("KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY_ID", "journeys-v1");
    vi.stubEnv(
      "KINFOLK_JOURNEYS_REFERENCE_HMAC_KEY",
      Buffer.alloc(32, 4).toString("base64"),
    );
    const result = startJourneyAuthorization({
      provider: "google_calendar",
      memberId: "member-1",
      requestedAccessMode: "free_busy",
    });
    expect(result.authorizationUrl).toContain("code_challenge=");
    expect(result.authorizationUrl).toContain("state=");
    expect(result.transaction.codeVerifier).not.toEqual(
      result.transaction.state,
    );
    expect(() =>
      assertJourneyAuthorizationCallback({
        storedStateHash: result.transaction.stateHash,
        callbackState: result.transaction.state,
        expiresAt: result.transaction.expiresAt,
      }),
    ).not.toThrow();
    expect(() =>
      assertJourneyAuthorizationCallback({
        storedStateHash: result.transaction.stateHash,
        callbackState: "wrong",
        expiresAt: result.transaction.expiresAt,
      }),
    ).toThrow();
  });

  it("fails closed until the separate encrypted token and opaque-reference stores are configured", () => {
    vi.stubEnv("GOOGLE_JOURNEYS_OAUTH_CLIENT_ID", "test-client");
    vi.stubEnv("GOOGLE_JOURNEYS_OAUTH_CLIENT_SECRET", "test-secret");
    vi.stubEnv(
      "KINFOLK_JOURNEYS_OAUTH_REDIRECT_BASE",
      "https://www.mappingwithmelanin.com",
    );
    const readiness = getJourneyProviderReadiness("google_calendar");
    expect(readiness.status).toBe("not_configured");
    expect(readiness.blockers).toContain(
      "Journey encrypted token storage is not configured.",
    );
    expect(JSON.stringify(readiness)).not.toContain("test-secret");
  });

  it("discovers only source-scoped provider identities and calendars after network activation", async () => {
    vi.stubEnv("GOOGLE_JOURNEYS_OAUTH_CLIENT_ID", "test-client");
    vi.stubEnv("GOOGLE_JOURNEYS_OAUTH_CLIENT_SECRET", "test-secret");
    vi.stubEnv(
      "KINFOLK_JOURNEYS_OAUTH_REDIRECT_BASE",
      "https://www.mappingwithmelanin.com",
    );
    vi.stubEnv("KINFOLK_JOURNEYS_PROVIDER_NETWORK_ENABLED", "true");
    vi.stubEnv(
      "KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY",
      Buffer.alloc(32, 3).toString("base64"),
    );
    vi.stubEnv("KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY_ID", "journeys-v1");
    vi.stubEnv(
      "KINFOLK_JOURNEYS_REFERENCE_HMAC_KEY",
      Buffer.alloc(32, 4).toString("base64"),
    );
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sub: "provider-account" })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [{ id: "calendar-1", summary: "Family calendar" }],
          }),
        ),
      );
    vi.stubGlobal("fetch", fetch);

    await expect(
      resolveJourneyProviderAccount({
        provider: "google_calendar",
        accessToken: "private-token",
      }),
    ).resolves.toEqual({ providerAccountId: "provider-account" });
    await expect(
      listJourneyProviderCalendars({
        provider: "google_calendar",
        accessToken: "private-token",
      }),
    ).resolves.toEqual([
      { providerCalendarId: "calendar-1", label: "Family calendar" },
    ]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
