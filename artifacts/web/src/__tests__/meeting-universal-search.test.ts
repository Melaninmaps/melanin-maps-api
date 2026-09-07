import React from "react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  UniversalSearchResults,
  safePublicHttpsUrl,
  type UniversalSearchResult,
} from "@/components/UniversalSearchResults";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "..");

function source(path: string): string {
  return readFileSync(resolve(src, path), "utf8");
}

const mixedResult: UniversalSearchResult = {
  query: "Philadelphia community",
  totalResults: 5,
  results: {
    businesses: [{ id: "biz-1", name: "AMINA", city: "Philadelphia", state: "PA", listingStatus: "live_unclaimed" }],
    events: [{ id: "event-1", title: "Community Meeting", city: "Philadelphia", state: "PA" }],
    heritage: [{ id: "heritage-1", name: "Historic Church", city: "Philadelphia", state: "PA", heritage_category: "Faith heritage" }],
    libraryTopics: [{ id: "topic-1", name: "Philadelphia Black History", category: "History" }],
    communityOrgs: [{ id: "org-1", name: "Neighborhood Coalition", city: "Philadelphia", state: "PA", website: "https://example.org/community" }],
  },
};

describe("meeting-ready universal web search", () => {
  it("renders every baseline universal record type with a usable destination", () => {
    const markup = renderToStaticMarkup(React.createElement(UniversalSearchResults, {
      result: mixedResult,
      surface: "Discover",
    }));

    for (const text of [
      "AMINA",
      "Community Meeting",
      "Historic Church",
      "Philadelphia Black History",
      "Neighborhood Coalition",
      "Businesses (1)",
      "Events (1)",
      "Heritage &amp; cultural sites (1)",
      "Library topics &amp; resources (1)",
      "Community organizations (1)",
    ]) {
      expect(markup).toContain(text);
    }

    expect(markup).toContain("/businesses/biz-1");
    expect(markup).toContain("/events?search=Community%20Meeting");
    expect(markup).toContain("/cultural-sites/heritage-1");
    expect(markup).toContain("/library/search?q=Philadelphia%20Black%20History");
    expect(markup).toContain("https://example.org/community");
    expect(markup).toContain("Community/founder-listed · Unclaimed · Not verified");
  });

  it("rejects unsafe outgoing destinations", () => {
    expect(safePublicHttpsUrl("https://example.org/path")).toBe("https://example.org/path");
    for (const value of [
      "http://example.org",
      "https://user:pass@example.org",
      "https://localhost/private",
      "https://127.0.0.1/private",
      "https://10.0.0.2/private",
      "https://169.254.1.2/private",
      "https://192.168.1.2/private",
      "https://[::1]/private",
      "https://[::ffff:169.254.1.1]/private",
      "https://[::ffff:10.0.0.1]/private",
      "javascript:alert(1)",
    ]) {
      expect(safePublicHttpsUrl(value)).toBeNull();
    }
  });

  it("lets Map add only the previously hidden supplementary groups", () => {
    const markup = renderToStaticMarkup(React.createElement(UniversalSearchResults, {
      result: mixedResult,
      surface: "Map",
      compact: true,
      includeKinds: ["Event", "Library topic / resource", "Community organization"],
      hideWhenEmpty: true,
    }));

    expect(markup).toContain("Community Meeting");
    expect(markup).toContain("Philadelphia Black History");
    expect(markup).toContain("Neighborhood Coalition");
    expect(markup).not.toContain("AMINA");
    expect(markup).not.toContain("Historic Church");
  });

  it("does not invent a Community destination when an organization has no safe public website", () => {
    const result: UniversalSearchResult = {
      query: "mutual aid",
      totalResults: 1,
      results: {
        businesses: [],
        events: [],
        heritage: [],
        libraryTopics: [],
        communityOrgs: [{ id: "org-private", name: "Mutual Aid Network", website: "https://127.0.0.1/private" }],
      },
    };
    const markup = renderToStaticMarkup(React.createElement(UniversalSearchResults, {
      result,
      surface: "Discover",
    }));

    expect(markup).toContain("Mutual Aid Network");
    expect(markup).toContain("No public detail link is available yet.");
    expect(markup).not.toContain("/community?");
    expect(markup).not.toContain("127.0.0.1");
  });

  it("mounts the broad Discover page and keeps Businesses on the canonical focused endpoint", () => {
    const app = source("App.tsx");
    const discover = source("pages/discover-universal.tsx");
    const map = source("pages/map.tsx");
    const businesses = source("features/businesses/LocationFirstBusinessDirectory.tsx");
    const events = source("features/events/LocationFirstEvents.tsx");

    expect(app).toContain('import DiscoverUniversal from "@/pages/discover-universal"');
    expect(app).toContain('<Route path="/discover">');
    expect(discover).toContain('surface: "smart_search"');
    expect(discover).toContain('privacy_mode: "discovery_v1"');
    expect(discover).toContain("<UniversalSearchResults result={result} surface=\"Discover\"");
    expect(map).toContain('surface: "smart_search"');
    expect(map).toContain('privacy_mode: "discovery_v1"');
    expect(map).toContain('includeKinds={["Event", "Library topic / resource", "Community organization"]}');
    expect(app).toContain("<LocationFirstBusinessDirectory />");
    expect(businesses).toContain("api/businesses?");
    expect(businesses).not.toContain("api/discovery/v1");
    expect(businesses).toContain("Open this business search on Map");
    expect(businesses).toContain('href="/submit-business"');
    expect(events).toContain('new URLSearchParams(searchString).get("search")');
  });
});
