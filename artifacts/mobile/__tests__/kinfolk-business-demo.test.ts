import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { businessClarificationContinuation } from "../lib/businessClarificationContinuation";

const travelSource = readFileSync(fileURLToPath(new URL("../app/travel.tsx", import.meta.url)), "utf8");
const hookSource = readFileSync(fileURLToPath(new URL("../hooks/useKinfolk.ts", import.meta.url)), "utf8");
const detailSource = readFileSync(fileURLToPath(new URL("../app/business/[id].tsx", import.meta.url)), "utf8");

describe("Expo Kinfolk business demo cards", () => {
  it("supports canonical detail, vetted website, unclaimed status, and match reasons", () => {
    expect(hookSource).toContain("id?: string");
    expect(hookSource).toContain("website?: string | null");
    expect(hookSource).toContain("matchReasons?: string[]");
    expect(travelSource).toContain('pathname: "/business/[id]"');
    expect(travelSource).toContain("openExternalUrl(biz.website!)");
    expect(travelSource).toContain("Founder-listed · Unclaimed · Not MWM verified");
    expect(travelSource).toContain("Why it surfaced:");
  });

  it("shows only approved public creator links and opens them on the original platform", () => {
    expect(detailSource).toContain("/api/businesses/${id}/contributions");
    expect(detailSource).toContain("Community creator videos");
    expect(detailSource).toContain("approvedContributionUrl");
    expect(detailSource).toContain("WebBrowser.openBrowserAsync(href)");
  });

  it("continues the original search for both an answer and Skip", () => {
    expect(businessClarificationContinuation(
      "Find hair in Philadelphia",
      "Loc and natural-hair care in Philadelphia",
    )).toBe("Find hair in Philadelphia — Loc and natural-hair care in Philadelphia");
    expect(businessClarificationContinuation("Find hair in Philadelphia")).toBe(
      "Find hair in Philadelphia — keep this search broad",
    );
  });
});
