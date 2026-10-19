import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  evaluateCommunityFrequentedScorecard,
  type CommunityFrequentedContribution,
} from "../community-frequented-scorecard-policy";

const NOW = new Date("2026-10-19T13:00:00.000Z");
const FUTURE = new Date("2026-10-20T13:00:00.000Z");
const BUSINESS_ID = "business-public-1";
const CITY = "Minneapolis";
const OWNER_ID = "owner-1";

function contribution(
  contributorId: string,
  kind: CommunityFrequentedContribution["kind"],
  value: CommunityFrequentedContribution["value"],
  overrides: Partial<CommunityFrequentedContribution> = {},
): CommunityFrequentedContribution {
  return {
    contributorId,
    businessOwnerId: OWNER_ID,
    businessId: BUSINESS_ID,
    city: CITY,
    publicCommunityExperienceConsent: true,
    kind,
    value,
    expiresAt: FUTURE,
    ...overrides,
  };
}

function evaluate(contributions: readonly CommunityFrequentedContribution[]) {
  return evaluateCommunityFrequentedScorecard({
    businessId: `  ${BUSINESS_ID.toUpperCase()}  `,
    city: "  minneapolis ",
    now: NOW,
    contributions,
  });
}

describe("Community-Frequented Alternatives + Scorecard V1 policy", () => {
  it("returns only bounded, separately represented public components for exact normalized scope", () => {
    const result = evaluate([
      contribution("member-a", "ownership", "verified"),
      contribution("member-b", "community_experience", "affirmed"),
      contribution("member-c", "confidence", "affirmed"),
      contribution("member-d", "safety_context", "clear"),
      contribution("member-e", "fit", "affirmed"),
    ]);

    expect(result).toEqual({
      status: "available",
      scope: { businessId: BUSINESS_ID, city: "minneapolis" },
      components: {
        ownership: "verified",
        communityExperience: "supported",
        confidence: "supported",
        safetyContext: "clear",
        fit: "supported",
      },
    });
    expect("score" in result).toBe(false);
  });

  it("withholds the scorecard when no accepted confidence evidence exists", () => {
    const result = evaluate([
      contribution("member-a", "community_experience", "affirmed"),
      contribution("member-b", "safety_context", "clear"),
      contribution("member-c", "fit", "affirmed"),
    ]);

    expect(result.status).toBe("withheld");
    expect("scope" in result).toBe(false);
  });

  it("fails closed without explicit consent and never emits contributor identity, raw text, or a hidden score", () => {
    const rawContribution = {
      ...contribution("member-a", "community_experience", "affirmed", {
        publicCommunityExperienceConsent: false,
      }),
      rawText: "I live at a private address and loved this place.",
    } as CommunityFrequentedContribution;
    const result = evaluate([rawContribution, contribution("member-b", "safety_context", "clear")]);
    const serialized = JSON.stringify(result);

    expect(result.status).toBe("withheld");
    expect(serialized).not.toContain("member-a");
    expect(serialized).not.toContain("private address");
    expect(serialized).not.toContain("score");
  });

  it("rejects duplicate contributor signals and owner self-promotion instead of selecting an input-order winner", () => {
    const result = evaluate([
      contribution("member-a", "community_experience", "affirmed"),
      contribution("member-a", "confidence", "affirmed"),
      contribution(OWNER_ID, "safety_context", "clear"),
      contribution("member-b", "fit", "affirmed"),
    ]);

    expect(result.status).toBe("withheld");
    expect("scope" in result).toBe(false);
  });

  it("rejects cross-business and cross-city substitutions", () => {
    const result = evaluate([
      contribution("member-a", "community_experience", "affirmed", { businessId: "business-public-2" }),
      contribution("member-b", "safety_context", "clear", { city: "St. Paul" }),
      contribution("member-c", "fit", "affirmed"),
    ]);

    expect(result.status).toBe("withheld");
    expect("scope" in result).toBe(false);
  });

  it("fails closed for malformed or unknown signals and at-or-before-now expiry", () => {
    const unknownKind = {
      ...contribution("member-a", "community_experience", "affirmed"),
      kind: "unknown_signal",
    } as unknown as CommunityFrequentedContribution;
    const malformedExpiry = contribution("member-b", "safety_context", "clear", {
      expiresAt: "not-a-date",
    });
    const expiresAtNow = contribution("member-c", "fit", "affirmed", { expiresAt: NOW });

    expect(evaluate([unknownKind, malformedExpiry, expiresAtNow]).status).toBe("withheld");
  });

  it("withholds the entire scorecard when accepted public safety context is withheld", () => {
    const result = evaluate([
      contribution("member-a", "community_experience", "affirmed"),
      contribution("member-b", "safety_context", "withheld"),
      contribution("member-c", "fit", "affirmed"),
    ]);

    expect(result.status).toBe("withheld");
    expect("scope" in result).toBe(false);
    expect("score" in result).toBe(false);
  });

  it("keeps the policy dependency-free from DB, routes, providers, private memory, location, and client modules", () => {
    const sourcePath = fileURLToPath(new URL("../community-frequented-scorecard-policy.ts", import.meta.url));
    const source = readFileSync(sourcePath, "utf8");

    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).not.toMatch(/from\s+["'][^"']*(?:@workspace\/db|\/routes\/|provider|private-memory|location|client)[^"']*["']/i);
  });
});
