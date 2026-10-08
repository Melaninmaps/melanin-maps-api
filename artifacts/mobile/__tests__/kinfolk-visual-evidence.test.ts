import { describe, expect, it } from "vitest";
import { kinfolkVerifiedVisualAssetUrl } from "../lib/kinfolkVisualEvidence";

describe("native Kinfolk visual evidence asset guard", () => {
  it("builds a visual URI only from a first-party approved asset path", () => {
    expect(kinfolkVerifiedVisualAssetUrl(
      "/api/kinfolk/visual-evidence/assets/visual-evidence-0001",
      "https://api.melaninmaps.com/",
    )).toBe("https://api.melaninmaps.com/api/kinfolk/visual-evidence/assets/visual-evidence-0001");
  });

  it.each([
    "https://images.example.org/stock.jpg",
    "http://api.melaninmaps.com/api/kinfolk/visual-evidence/assets/visual-evidence-0001",
    "/api/kinfolk/visual-evidence/assets/short",
    "/api/kinfolk/question-images/member-private-image",
  ])("rejects an unapproved visual source: %s", (assetPath) => {
    expect(kinfolkVerifiedVisualAssetUrl(assetPath, "https://api.melaninmaps.com")).toBeNull();
  });
});
