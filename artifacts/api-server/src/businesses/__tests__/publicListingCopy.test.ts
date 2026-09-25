import { describe, expect, it } from "vitest";
import {
  sanitizePublicListingCopy,
  sanitizePublicListingCopyOrNull,
} from "../publicListingCopy";

const INTERNAL_VISIT_PHILADELPHIA_NOTE =
  "Large-batch candidate sourced from a current 2026 Visit Philadelphia ownership/operated guide. " +
  "Reconcile exact current address, operating status, parent/child locations, ownership continuity, price, and social/website before public display. " +
  "External guide status does not equal MWM verification.";

describe("public listing copy sanitizer", () => {
  it("removes the internal Visit Philadelphia reconciliation note without changing the source record", () => {
    expect(sanitizePublicListingCopy(INTERNAL_VISIT_PHILADELPHIA_NOTE)).toBe("");
  });

  it("retains member-facing copy while removing internal recommendation/status markers", () => {
    expect(
      sanitizePublicListingCopy(
        `Neighborhood cafe · ${INTERNAL_VISIT_PHILADELPHIA_NOTE} · CURRENT_2026_VISIT_PHILADELPHIA_OWNERSHIP_GUIDE`,
      ),
    ).toBe("Neighborhood cafe");
    expect(sanitizePublicListingCopyOrNull("ELIGIBLE_UNCLAIMED_AFTER_RECONCILIATION")).toBeNull();
  });

  it("leaves ordinary public listing text unchanged", () => {
    expect(sanitizePublicListingCopy("Late-night cafe with patio seating.")).toBe(
      "Late-night cafe with patio seating.",
    );
  });
});
