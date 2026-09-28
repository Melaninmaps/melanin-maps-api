import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GOVERNED_DISCOVERY_V2_RADIUS_REPLY,
  governedDirectorySafetyLimit,
  isGovernedDiscoveryV2Enabled,
  isStrictDocumentedOwnershipDiscoveryRequest,
  requestsCurrentLocalSafetyContext,
  requestsExactRadius,
} from "../governed-discovery-v2";

describe("governed discovery v2 release gate", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is disabled unless production receives the exact enable flag", () => {
    expect(isGovernedDiscoveryV2Enabled({ NODE_ENV: "production" })).toBe(false);
    expect(isGovernedDiscoveryV2Enabled({
      NODE_ENV: "production",
      KINFOLK_GOVERNED_DISCOVERY_V2_ENABLED: "TRUE",
    })).toBe(false);
    expect(isGovernedDiscoveryV2Enabled({
      NODE_ENV: "production",
      KINFOLK_GOVERNED_DISCOVERY_V2_ENABLED: "true",
    })).toBe(true);
  });

  it("activates strict ownership handling only for an explicit designation request", () => {
    expect(isStrictDocumentedOwnershipDiscoveryRequest(
      "Find Black-owned Ethiopian restaurants in Minneapolis",
    )).toBe(true);
    expect(isStrictDocumentedOwnershipDiscoveryRequest(
      "Find a restaurant in Minneapolis",
    )).toBe(false);
    expect(isStrictDocumentedOwnershipDiscoveryRequest(
      "Find a restaurant with Black decor in Minneapolis",
    )).toBe(false);
  });

  it("does not silently label a city result as a requested radius", () => {
    expect(requestsExactRadius("within 10 miles of City Hall")).toBe(true);
    expect(requestsExactRadius("a 10-mile radius around City Hall")).toBe(true);
    expect(requestsExactRadius("a café near City Hall")).toBe(false);
    expect(GOVERNED_DISCOVERY_V2_RADIUS_REPLY).toMatch(/do not.*label city-wide results/i);
  });

  it("keeps a current safety request explicit when strict directory cards lack safety evidence", () => {
    expect(requestsCurrentLocalSafetyContext(
      "Show documented Black-owned lunch restaurants in Houston and current safety guidance",
    )).toBe(true);
    expect(requestsCurrentLocalSafetyContext(
      "Show documented Black-owned lunch restaurants in Houston",
    )).toBe(false);
    expect(requestsCurrentLocalSafetyContext(
      "Show a shellfish-safe Black-owned dinner in Minneapolis",
    )).toBe(false);
    expect(governedDirectorySafetyLimit("Houston")).toMatch(/could not verify a current Houston-specific safety alert/i);
    expect(governedDirectorySafetyLimit("Houston")).toMatch(/will not make a current local-safety claim/i);
  });
});
