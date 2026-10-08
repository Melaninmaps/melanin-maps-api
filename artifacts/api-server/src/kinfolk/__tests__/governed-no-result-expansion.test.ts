import { describe, expect, it } from "vitest";
import {
  GOVERNED_NO_RESULT_ACTIONS,
  buildGovernedNoResultActionReply,
  buildGovernedNoResultOffer,
  decodeGovernedNoResultAction,
} from "../governed-no-result-expansion";

describe("governed no-result expansion", () => {
  it("keeps the original documentary ownership request strict and offers only explicit branches", () => {
    const offer = buildGovernedNoResultOffer({
      city: "Houston",
      subjectLabel: "mechanic",
      designationLabel: "Black-owned and woman-owned",
      canExpandVerifiedRadius: true,
      stage: "initial",
    });

    expect(offer.keepsOriginalPreference).toBe(true);
    expect(offer.persistsPreferenceChange).toBe(false);
    expect(offer.reply).toMatch(/will not silently broaden/i);
    expect(offer.reply).toMatch(/next available step is a temporary wider radius/i);
    expect(offer.followUpSuggestions).toEqual([
      GOVERNED_NO_RESULT_ACTIONS.expandRadius,
      GOVERNED_NO_RESULT_ACTIONS.keepStrict,
      GOVERNED_NO_RESULT_ACTIONS.openSettings,
      GOVERNED_NO_RESULT_ACTIONS.stop,
    ]);
  });

  it("does not offer ownership-undocumented or non-matching places until documented scope was tried", () => {
    const afterRadius = buildGovernedNoResultOffer({
      city: "Houston", subjectLabel: "mechanic", designationLabel: "Black-owned", canExpandVerifiedRadius: true,
      stage: "after_radius",
    });
    const afterDocumentedScope = buildGovernedNoResultOffer({
      city: "Houston", subjectLabel: "mechanic", designationLabel: "Black-owned", canExpandVerifiedRadius: true,
      stage: "after_documented_scope",
    });
    expect(afterRadius.followUpSuggestions).toContain(GOVERNED_NO_RESULT_ACTIONS.broadenDocumentedScope);
    expect(afterRadius.followUpSuggestions).not.toContain(GOVERNED_NO_RESULT_ACTIONS.showOtherPublicPlaces);
    expect(afterDocumentedScope.followUpSuggestions).toEqual(expect.arrayContaining([
      GOVERNED_NO_RESULT_ACTIONS.showOwnershipUndocumented,
      GOVERNED_NO_RESULT_ACTIONS.showOtherPublicPlaces,
    ]));
  });

  it("requires a server-issued action rather than treating free text as expansion consent", () => {
    const offered = [GOVERNED_NO_RESULT_ACTIONS.showOtherPublicPlaces];
    expect(decodeGovernedNoResultAction({
      message: GOVERNED_NO_RESULT_ACTIONS.showOtherPublicPlaces,
      offeredActions: offered,
    })).toBe("showOtherPublicPlaces");
    expect(decodeGovernedNoResultAction({
      message: "show every place",
      offeredActions: offered,
    })).toBeNull();
    expect(decodeGovernedNoResultAction({
      message: GOVERNED_NO_RESULT_ACTIONS.showOtherPublicPlaces,
      offeredActions: [],
    })).toBeNull();
  });

  it("does not reuse location detail and does not mutate a preference on informational actions", () => {
    const radius = buildGovernedNoResultActionReply({
      action: "expandRadius",
      city: "Houston",
      subjectLabel: "mechanic",
      designationLabel: "Black-owned and woman-owned",
    });
    const settings = buildGovernedNoResultActionReply({
      action: "openSettings",
      city: "Houston",
      subjectLabel: "mechanic",
      designationLabel: "Black-owned and woman-owned",
    });
    expect(radius).toMatch(/public starting point/i);
    expect(radius).toMatch(/only for this search/i);
    expect(settings).toMatch(/has not changed/i);
    expect(settings).toMatch(/remains temporary/i);
  });
});
