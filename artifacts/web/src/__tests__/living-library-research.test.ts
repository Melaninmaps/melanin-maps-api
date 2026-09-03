import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { safeLibrarySourceHref } from "../features/library/LibrarySearchPage";

const pageSource = readFileSync(
  fileURLToPath(new URL("../features/library/LibrarySearchPage.tsx", import.meta.url)),
  "utf8",
);

describe("Living Library research presentation", () => {
  it("allows visible HTTPS citations and rejects unsafe source schemes or credentials", () => {
    expect(safeLibrarySourceHref("https://www.loc.gov/item/123")).toBe("https://www.loc.gov/item/123");
    expect(safeLibrarySourceHref("javascript:alert(1)")).toBeNull();
    expect(safeLibrarySourceHref("http://example.org/source")).toBeNull();
    expect(safeLibrarySourceHref("https://name:secret@example.org/source")).toBeNull();
  });

  it("presents a concise overview with accessible See More and See Less controls", () => {
    expect(pageSource).toContain('aria-expanded={expanded}');
    expect(pageSource).toContain('aria-controls={detailsId}');
    expect(pageSource).toContain('expanded ? "See Less" : "See More"');
    expect(pageSource).toContain('className="library-research-overview"');
  });

  it("shows source count, freshness, related branches, and safe new-tab link attributes", () => {
    expect(pageSource).toContain("formattedFreshness(refreshedAt)");
    expect(pageSource).toContain("Related questions and branches");
    expect(pageSource).toContain('rel="noopener noreferrer"');
    expect(pageSource).toContain('target="_blank"');
  });

  it("offers current research for sparse internal coverage without claiming it is approved", () => {
    expect(pageSource).toContain("No approved entry answers this yet.");
    expect(pageSource).toContain("Research this question");
    expect(pageSource).toContain("governed pending candidate—not approved Library content");
    expect(pageSource).toContain('response.webResearch.status !== "not_needed"');
  });

  it("renders an honest retryable provider failure rather than a fake zero-result answer", () => {
    expect(pageSource).toContain("Live research is temporarily unavailable");
    expect(pageSource).toContain("Retry research");
    expect(pageSource).toContain("This is not a zero-result Library answer.");
  });

  it("uses broad bookstore and spiritual examples without assigning identity to a member", () => {
    expect(pageSource).toContain("oldest bookstore in the US");
    expect(pageSource).toContain("life after death");
    expect(pageSource).toContain("Diaspora-centered knowledge");
    expect(pageSource).not.toMatch(/you are (?:black|african|christian|muslim|a woman)/i);
  });
});
