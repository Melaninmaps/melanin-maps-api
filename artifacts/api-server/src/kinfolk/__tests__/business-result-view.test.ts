import { describe, expect, it } from "vitest";
import { buildConversationalBusinessResultView } from "../business-result-view";

describe("conversational governed business result view", () => {
  it("keeps 3–5 governed cards actionable and external findings separate", () => {
    const businesses = Array.from({ length: 6 }, (_, index) => ({
      id: `business-${index}`,
      recordType: "business" as const,
      name: `Bookstore ${index}`,
      category: "Retail",
      subcategory: "Bookstore",
      description: "An independent bookstore.",
      city: "Atlanta",
      stateCode: "GA",
      detailUrl: `/businesses/business-${index}`,
      website: index === 0 ? "https://books.example/" : null,
      phone: null,
      verified: index === 0,
      claimed: index === 0,
      matchReasons: ["subcategory"],
      provenance: "mwm_public_business" as const,
    }));
    const view = buildConversationalBusinessResultView({
      businesses,
      subjectLabel: "bookstores",
      external: [{
        title: "External guide",
        url: "https://guide.example/",
        snippet: "External research",
        sourceHost: "guide.example",
        provenance: "external_web_finding",
        isMwmVerified: false,
      }],
    });
    expect(view.cards).toHaveLength(5);
    expect(view.cards[0]).toMatchObject({
      matchReason: "Matched by subcategory.",
      actions: expect.arrayContaining([{ label: "View details", url: "/businesses/business-0" }]),
      verified: true,
      claimed: true,
    });
    expect(view.seeAll).toEqual({ label: "See all matching listings", count: 6 });
    expect(view.external).toEqual([expect.objectContaining({
      disclaimer: "External finding — not an MWM-verified business listing.",
    })]);
    expect(view.followUp).toContain("Want me");
  });
});