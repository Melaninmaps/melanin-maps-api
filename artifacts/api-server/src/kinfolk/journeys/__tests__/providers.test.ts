import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertJourneyAuthorizationCallback,
  getJourneyProviderReadiness,
  providerNetworkCallsAllowed,
  startJourneyAuthorization,
} from "../providers";

describe("Journey provider adapters", () => {
  afterEach(() => vi.unstubAllEnvs());

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

  it("does not activate provider network calls when only a provider flag is set", () => {
    vi.stubEnv("KINFOLK_JOURNEYS_PROVIDER_NETWORK_ENABLED", "true");
    expect(providerNetworkCallsAllowed()).toBe(false);
  });

  it("does not start a provider authorization until the Journey feature is enabled", () => {
    vi.stubEnv("GOOGLE_JOURNEYS_OAUTH_CLIENT_ID", "test-client");
    vi.stubEnv("GOOGLE_JOURNEYS_OAUTH_CLIENT_SECRET", "test-secret");
    vi.stubEnv(
      "KINFOLK_JOURNEYS_OAUTH_REDIRECT_BASE",
      "https://www.mappingwithmelanin.com",
    );
    expect(() =>
      startJourneyAuthorization({
        provider: "google_calendar",
        memberId: "member-1",
        requestedAccessMode: "free_busy",
      }),
    ).toThrow("not enabled");
  });

  it("uses PKCE, state, nonce, and a short-lived server transaction when configured", () => {
    vi.stubEnv("KINFOLK_JOURNEYS_ENABLED", "true");
    vi.stubEnv("GOOGLE_JOURNEYS_OAUTH_CLIENT_ID", "test-client");
    vi.stubEnv("GOOGLE_JOURNEYS_OAUTH_CLIENT_SECRET", "test-secret");
    vi.stubEnv(
      "KINFOLK_JOURNEYS_OAUTH_REDIRECT_BASE",
      "https://www.mappingwithmelanin.com",
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
});
