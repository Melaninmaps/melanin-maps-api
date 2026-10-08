import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  KinfolkContextualContent,
  KinfolkVisualEvidenceCards,
  safeKinfolkVisualEvidenceAssetPath,
} from "../components/kinfolk/KinfolkChatPresentation";

describe("Kinfolk contextual content", () => {
  it("renders only server-approved visual evidence assets with source and rights disclosure", () => {
    const markup = renderToStaticMarkup(React.createElement(KinfolkVisualEvidenceCards, {
      evidence: [{
        id: "visual-evidence-0001",
        assetPath: "/api/kinfolk/visual-evidence/assets/visual-evidence-0001",
        altText: "A labeled cultural reference image.",
        sourceName: "Example Museum",
        sourcePageUrl: "https://museum.example.org/reference",
        sourceTitle: "Collection record",
        caption: "Source-reviewed cultural reference.",
        subject: "Braided hairstyle",
        category: "cultural",
        sourcePublishedAt: null,
        sourceReviewedAt: "2026-10-08T00:00:00Z",
        rights: "publisher_permission",
        rightsNotice: "Displayed with publisher permission.",
        whyThisImageFits: "The collection record identifies the requested subject.",
      }],
    }));
    expect(markup).toContain('data-testid="kinfolk-visual-evidence"');
    expect(markup).toContain('/api/kinfolk/visual-evidence/assets/visual-evidence-0001');
    expect(markup).toContain("Displayed with publisher permission.");
    expect(markup).toContain("Source: Example Museum");
    expect(markup).toContain('referrerPolicy="no-referrer"');
  });

  it("rejects remote image URLs and displays the server-authored no-image notice", () => {
    expect(safeKinfolkVisualEvidenceAssetPath("https://images.example.org/stock.jpg")).toBeNull();
    const markup = renderToStaticMarkup(React.createElement(KinfolkVisualEvidenceCards, {
      evidence: [{
        id: "remote-image-0001",
        assetPath: "https://images.example.org/stock.jpg",
        altText: "Never render.",
        sourceName: "Unknown",
        sourcePageUrl: "https://images.example.org/source",
        sourceTitle: "Unknown",
        caption: "Never render.",
        subject: "Unknown",
        category: "general",
        sourcePublishedAt: null,
        sourceReviewedAt: "2026-10-08T00:00:00Z",
        rights: "licensed",
        rightsNotice: "Never render.",
        whyThisImageFits: "Never render.",
      }],
      notice: "I don’t have a verified image source for this request, so I won’t show an unverified image.",
    }));
    expect(markup).not.toContain("stock.jpg");
    expect(markup).toContain('data-testid="kinfolk-visual-evidence-notice"');
    expect(markup).toContain("won’t show an unverified image");
  });

  it("keeps the compact recipe details separate from the conversational reply", () => {
    const markup = renderToStaticMarkup(React.createElement(KinfolkContextualContent, {
      structuredContent: {
        kind: "recipe_instructions",
        title: "Pot roast",
        ingredients: ["Chuck roast", "Carrots"],
        steps: ["Brown the roast", "Braise until tender"],
        foodSafety: ["Cook to a safe internal temperature."],
      },
    }));

    expect(markup).toContain('data-testid="kinfolk-recipe-instructions"');
    expect(markup).toContain("Ingredients");
    expect(markup).toContain("Braise until tender");
    expect(markup).toContain("Food safety");
  });

  it("renders consensus, verified media, and related Library connections with safe links only", () => {
    const markup = renderToStaticMarkup(React.createElement(KinfolkContextualContent, {
      structuredContent: {
        kind: "cultural_consensus",
        subject: "A debate",
        conclusion: "The answer depends on the rubric.",
        criteria: ["Critical reception"],
        evidenceFor: ["Documented response"],
        otherDefensibleViews: ["Regional impact"],
        asOf: "2025-01-01",
      },
      mediaLinks: [
        { title: "Verified interview", creator: "Creator", platform: "Video", url: "https://example.com/video", reason: "Primary interview" },
        { title: "Unsafe video", creator: null, platform: "Video", url: "javascript:alert(1)", reason: "Must not render" },
      ],
      relatedConnections: [
        { title: "Library topic", relationship: "Related work", reason: "A supported connection.", href: "/library/topics/music", evidenceUrl: "https://example.com/evidence" },
        { title: "Unsafe connection", relationship: "Nope", reason: "Must not link.", href: "javascript:alert(1)", evidenceUrl: "data:text/html,nope" },
      ],
      researchStatus: { usedInternal: true, usedLiveWeb: true, degraded: false, asOf: "2025-01-01" },
    }));

    expect(markup).toContain('data-testid="kinfolk-cultural-consensus"');
    expect(markup).toContain("Other views");
    expect(markup).toContain('href="https://example.com/video"');
    expect(markup).toContain("Verified interview");
    expect(markup).not.toContain("Unsafe video");
    expect(markup).toContain('href="/library/topics/music"');
    expect(markup).toContain('href="https://example.com/evidence"');
    expect(markup).not.toContain("javascript:");
    expect(markup).not.toContain("data:text");
    expect(markup).toContain('data-testid="kinfolk-research-status"');
    expect(markup).toContain("Updated Jan 1, 2025");
  });
});
