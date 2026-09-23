import { describe, expect, it } from "vitest";
import {
  culturalSiteExplorerItem,
  recurringEventExplorerItem,
  resourceExplorerItem,
} from "../cultural-explorer";

describe("Cultural Explorer adapter item contracts", () => {
  it("keeps an HBCU a cultural site with truthful detail, map, and Library actions", () => {
    const item = culturalSiteExplorerItem({
      id: "hbcu-1",
      name: "Howard University",
      heritageCategory: "HBCU",
      category: "University",
      latitude: "38.9227",
      longitude: "-77.0194",
      externalUrl: "https://www.howard.edu/",
    });

    expect(item).toMatchObject({ kind: "cultural_site", tab: "hbcus", name: "Howard University" });
    expect(item.actions).toContainEqual(expect.objectContaining({ type: "cultural_detail", culturalSiteId: "hbcu-1" }));
    expect(item.actions).toContainEqual(expect.objectContaining({ type: "map", culturalSiteId: "hbcu-1" }));
    expect(item.actions).toContainEqual(expect.objectContaining({ type: "library" }));
  });

  it("keeps markets and recurring events out of the cultural-site detail contract", () => {
    const market = recurringEventExplorerItem({ id: "market-1", name: "Sunday Market", category: "market" });
    const event = recurringEventExplorerItem({ id: "event-1", name: "Heritage Festival", category: "festival" });

    expect(market).toMatchObject({ kind: "market", tab: "markets" });
    expect(event).toMatchObject({ kind: "recurring_event", tab: "curated_events" });
    expect(market.actions).toEqual([{ type: "event_list" }]);
    expect(event.actions).toEqual([{ type: "event_list" }]);
    expect(event.actions).not.toContainEqual(expect.objectContaining({ type: "cultural_detail" }));
  });

  it("keeps a curated resource external and never invents a map pin", () => {
    const item = resourceExplorerItem({
      id: "resource-1",
      title: "UNCF Scholarships",
      category: "education",
      url: "https://uncf.org/",
    });

    expect(item).toMatchObject({ kind: "resource", tab: "heritage_resources", latitude: null, longitude: null });
    expect(item.actions).toEqual([{ type: "external", url: "https://uncf.org/" }]);
  });
});
