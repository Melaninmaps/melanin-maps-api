import { describe, expect, it } from "vitest";
import {
  VALIDATED_PRESENCE_BATCH_LIMIT,
  ownershipDesignationsForValidatedPresence,
  parseValidatedPresenceBatchRows,
  presencePatchFromValidatedRow,
  validatedPresenceApplyConfirmation,
  validatedPresenceBatchFingerprint,
  validatedPresenceOwnershipReceiptNote,
} from "../validatedPresenceBatch";

function row(overrides: Record<string, unknown> = {}) {
  return {
    originalRowNumber: 2,
    businessName: "Community Books",
    city: "Philadelphia",
    state: "PA",
    phone: "215-555-0100",
    authorizedOwnershipStatus: "Black / African American-Owned",
    authorizedOwnershipBasis: "Explicit Black-owned designation in the retained public source.",
    authorizedOwnershipSourceName: "Current Black-owned business directory",
    authorizedOwnershipSourceEvidence: "The source labels Community Books as Black-owned.",
    qualifyingPresenceType: "website; social",
    qualifyingUrls: "https://communitybooks.example/ | https://www.instagram.com/communitybooks/",
    validationRoute: "Supplied official website revalidated from a live response.",
    validationTier: "Likely business-controlled website or name-matched social profile.",
    businessNameEvidence: "The official site contains Community Books.",
    locationEvidence: "Philadelphia appears on the official site.",
    sourceUrl: "https://directory.example/community-books",
    auditCaveat: "Website/social evidence only. No MWM record changed.",
    ...overrides,
  };
}

describe("validated presence batch policy", () => {
  it("accepts a bounded explicit-ownership batch and creates only supported presence fields", () => {
    const [parsed] = parseValidatedPresenceBatchRows({ rows: [row()] });
    expect(parsed.authorizedOwnershipStatus).toBe("Black / African American-Owned");
    expect(presencePatchFromValidatedRow(parsed)).toEqual({
      website: "https://communitybooks.example/",
      instagram: "https://www.instagram.com/communitybooks/",
      phone: "215-555-0100",
    });
    expect(ownershipDesignationsForValidatedPresence(parsed.authorizedOwnershipStatus)).toEqual(["Black / African American-Owned"]);
    expect(validatedPresenceOwnershipReceiptNote(parsed)).toContain("The source labels Community Books as Black-owned.");
  });

  it("maps all founder-approved ownership designations without inferring other ownership values", () => {
    const [combined] = parseValidatedPresenceBatchRows({ rows: [row({ authorizedOwnershipStatus: "Black / African American-Owned; Latino / Hispanic-Owned" })] });
    expect(ownershipDesignationsForValidatedPresence(combined.authorizedOwnershipStatus)).toEqual([
      "Black / African American-Owned",
      "Latino / Hispanic-Owned",
    ]);
    const [minority] = parseValidatedPresenceBatchRows({ rows: [row({ authorizedOwnershipStatus: "Minority-Owned" })] });
    expect(ownershipDesignationsForValidatedPresence(minority.authorizedOwnershipStatus)).toEqual(["Minority-Owned"]);
    expect(() => parseValidatedPresenceBatchRows({ rows: [row({ authorizedOwnershipStatus: "Women-Owned" })] }))
      .toThrow("Only approved Black / African American-Owned, Latino / Hispanic-Owned, or Minority-Owned");
  });

  it("limits local-source references to website and social presence only", () => {
    const [parsed] = parseValidatedPresenceBatchRows({ rows: [row({ sourceUrl: "CURRENT_LOCAL_SEARCH" })] });
    expect(parsed.sourceUrl).toBeNull();
    expect(presencePatchFromValidatedRow(parsed)).toEqual({
      website: "https://communitybooks.example/",
      instagram: "https://www.instagram.com/communitybooks/",
    });
    expect(() => parseValidatedPresenceBatchRows({ rows: [row({ sourceUrl: "file:///tmp/not-a-source" })] }))
      .toThrow("sourceUrl must be a public http or https URL or an approved local-source reference");
  });

  it("rejects email fields, repeated identities, and batches larger than fifty", () => {
    expect(() => parseValidatedPresenceBatchRows({ rows: [row({ email: "hello@communitybooks.example" })] }))
      .toThrow("do not accept email");
    expect(() => parseValidatedPresenceBatchRows({ rows: [row(), row({ originalRowNumber: 3 })] }))
      .toThrow("unique business name, city, and state");
    expect(() => parseValidatedPresenceBatchRows({ rows: Array.from({ length: VALIDATED_PRESENCE_BATCH_LIMIT + 1 }, (_, index) => row({ originalRowNumber: index + 1, businessName: `Community Books ${index}` })) }))
      .toThrow("between 1 and 50");
  });

  it("uses a stable batch fingerprint and an exact typed confirmation", () => {
    const rows = parseValidatedPresenceBatchRows({ rows: [row()] });
    const first = validatedPresenceBatchFingerprint({ rows, status: "preview" });
    const second = validatedPresenceBatchFingerprint({ status: "preview", rows });
    expect(first).toBe(second);
    expect(validatedPresenceApplyConfirmation(50)).toBe("APPLY 50 VALIDATED PRESENCE RECORDS");
    expect(validatedPresenceApplyConfirmation(1)).toBe("APPLY 1 VALIDATED PRESENCE RECORD");
  });
});
