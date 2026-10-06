import { describe, expect, it } from "vitest";
import {
  CANONICAL_MWM_BUSINESS_ID,
  COMMUNITY_NEED_THRESHOLD,
  buildCommunityNeedOwnerMessage,
  communityNeedTopicLabel,
  isAggregateCommunityNeed,
  normalizeCommunityNeedTopic,
} from "../community-need-feedback";

describe("Kinfolk community need feedback policy", () => {
  it("requires a member-selected broad topic before a need can aggregate", () => {
    const topic = normalizeCommunityNeedTopic("life_insurance_terms");
    expect(topic).toBe("life_insurance_terms");
    expect(isAggregateCommunityNeed("needs_more_help", topic)).toBe(true);
    expect(isAggregateCommunityNeed("not_helpful", topic)).toBe(false);
    expect(isAggregateCommunityNeed("needs_more_help", null)).toBe(false);
    expect(normalizeCommunityNeedTopic("diagnosis: member detail")).toBeNull();
  });

  it("renders only a broad aggregate after the five-member threshold", () => {
    expect(CANONICAL_MWM_BUSINESS_ID).toBe("c678e359-0000-4000-8000-000000000001");
    expect(COMMUNITY_NEED_THRESHOLD).toBe(5);
    expect(buildCommunityNeedOwnerMessage("life_insurance_terms", 4)).toBeNull();
    expect(buildCommunityNeedOwnerMessage("life_insurance_terms", 5)).toBe(
      "5 community members asked for more help with life-insurance terms.",
    );
    expect(communityNeedTopicLabel("unknown")).toBeNull();
  });
});
