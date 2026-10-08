import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildConversationalBusinessResultView } from "../business-result-view";

const kinfolkRoute = readFileSync(new URL("../../routes/kinfolk.ts", import.meta.url), "utf8");

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
    expect(view.cards[1]).toMatchObject({ verified: false, claimed: false });
    expect(view.seeAll).toEqual({ label: "See all matching listings", count: 6 });
    expect(view.external).toEqual([expect.objectContaining({
      disclaimer: "External finding — not an MWM-verified business listing.",
    })]);
    expect(view.followUp).toContain("Want me");
  });

  it("returns the concise result view from deterministic business chat", () => {
    const start = kinfolkRoute.indexOf("const discoveryResult = await discoverLocalBusinesses");
    const end = kinfolkRoute.indexOf("return true;", start);
    const block = kinfolkRoute.slice(start, end);
    expect(block).toContain("buildConversationalBusinessResultView({");
    expect(block).toContain("businesses: discoveryResult.discovery.platformBusinesses");
    expect(block).toContain("external: discoveryResult.discovery.webFindings");
    expect(block).toContain("const conciseReply = [strictSafetyLimit, allergySafetyCaveat, conciseDirectoryReply]");
    expect(block).toContain("reply: conciseReply");
    expect(block).not.toContain("reply: discoveryResult.reply");
    expect(block).toContain("resultView,");
    expect(block).toContain("followUpSuggestions: deterministicFollowUps");
  });

  it("keeps documented ownership separate from MWM listing verification", () => {
    const view = buildConversationalBusinessResultView({
      businesses: [{
        id: "documented-business",
        recordType: "business" as const,
        name: "Documented Coffee",
        category: "Food & Drink",
        subcategory: "Coffee shop",
        description: "A coffee listing.",
        city: "Philadelphia",
        stateCode: "PA",
        detailUrl: "/businesses/documented-business",
        website: null,
        phone: null,
        verified: false,
        claimed: false,
        matchReasons: ["ownership designation"],
        provenance: "mwm_public_business" as const,
        ownershipStatus: "documented" as const,
        ownershipEvidence: {
          sourceUrl: "https://directory.example/documented-coffee",
          sourceLabel: "Source directory",
          capturedAt: "2026-10-08T00:00:00.000Z",
        },
      }],
      subjectLabel: "coffee shops",
    });

    expect(view.cards[0]).toMatchObject({
      verified: false,
      claimed: false,
      ownershipStatus: "documented",
      ownershipEvidence: { sourceLabel: "Source directory" },
    });
  });

  it("shows one actionable card for duplicate display candidates without changing records", () => {
    const businesses = [
      {
        id: "salon-a",
        recordType: "business" as const,
        name: "Sister's & Combs",
        category: "Beauty",
        subcategory: "Salon",
        description: "Salon listing.",
        city: "Minneapolis",
        stateCode: "MN",
        detailUrl: "/businesses/salon-a",
        website: null,
        phone: null,
        verified: false,
        claimed: false,
        matchReasons: ["subcategory"],
        provenance: "mwm_public_business" as const,
      },
      {
        id: "salon-b",
        recordType: "business" as const,
        name: "Sisters and Combs",
        category: "Beauty",
        subcategory: "Salon",
        description: "Duplicate display candidate.",
        city: "Minneapolis",
        stateCode: "MN",
        detailUrl: "/businesses/salon-b",
        website: "https://sisters.example/",
        phone: null,
        verified: false,
        claimed: false,
        matchReasons: ["subcategory"],
        provenance: "mwm_public_business" as const,
      },
      {
        id: "actionless",
        recordType: "business" as const,
        name: "Unlinked Salon",
        category: "Beauty",
        subcategory: "Salon",
        description: "No public action.",
        city: "Minneapolis",
        stateCode: "MN",
        detailUrl: "not-a-public-route",
        website: null,
        phone: null,
        verified: false,
        claimed: false,
        matchReasons: ["subcategory"],
        provenance: "mwm_public_business" as const,
      },
    ];
    const view = buildConversationalBusinessResultView({
      businesses,
      subjectLabel: "salons",
    });

    expect(businesses).toHaveLength(3);
    expect(view.cards).toHaveLength(1);
    expect(view.cards[0]).toMatchObject({ id: "salon-a", title: "Sister's & Combs" });
    expect(view.cards[0]?.actions).toEqual([
      { label: "View details", url: "/businesses/salon-a" },
    ]);
  });
});
