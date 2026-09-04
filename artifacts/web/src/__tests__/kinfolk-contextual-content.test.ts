import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KinfolkContextualContent } from "../components/kinfolk/KinfolkChatPresentation";

describe("Kinfolk contextual content", () => {
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
    expect(markup).toContain("Research: Library + current sources");
  });
});
