import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  hasItineraryDays,
  isSerializedItineraryContent,
  KinfolkAssistantText,
  KinfolkItinerary,
  KinfolkSourceLinks,
  KinfolkStaffDemoBadge,
  KINFOLK_RESPONSE_STATUS_STAGES,
  responseStatusForElapsedTime,
  safeExternalSourceHref,
} from "../components/kinfolk/KinfolkChatPresentation";

const travelPageSource = readFileSync(
  fileURLToPath(new URL("../pages/travel.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk chat presentation", () => {
  it("preserves assistant paragraph and list line breaks as safe plain text", () => {
    const content = "A first paragraph.\n\n- First detail\n- Second detail";
    const markup = renderToStaticMarkup(React.createElement(KinfolkAssistantText, { content }));

    expect(markup).toContain("whitespace-pre-wrap");
    expect(markup).toContain("break-words");
    expect(markup).toContain(content);
    expect(markup).not.toContain("dangerouslySetInnerHTML");
  });

  it("uses only truthful elapsed-time status copy and never claims a search", () => {
    expect(KINFOLK_RESPONSE_STATUS_STAGES).toEqual([
      "Understanding your question…",
      "Connecting the conversation…",
      "Putting your answer together…",
    ]);
    expect(responseStatusForElapsedTime(0)).toBe("Understanding your question…");
    expect(responseStatusForElapsedTime(1_500)).toBe("Connecting the conversation…");
    expect(responseStatusForElapsedTime(4_000)).toBe("Putting your answer together…");
    expect(KINFOLK_RESPONSE_STATUS_STAGES.join(" ").toLowerCase()).not.toMatch(/search|web|source/);
  });

  it("does not render per-message cultural or provenance notes while keeping the bottom AI disclaimer", () => {
    expect(travelPageSource).not.toContain('data-testid="kinfolk-provenance-note"');
    expect(travelPageSource).not.toContain('data-testid="kinfolk-source-note"');
    expect(travelPageSource).not.toContain("Would you like Kinfolk to remember that");
    expect(travelPageSource).toContain('<DisclaimerBanner type="ai" className="mt-2 mx-auto max-w-3xl" />');
  });

  it("does not render a resolved-location Searching pill", () => {
    expect(travelPageSource).not.toContain("Searching ");
    expect(travelPageSource).not.toContain("Searching Black");
  });

  it("renders a three-day itinerary naturally, without recommendation cards or raw JSON syntax", () => {
    const markup = renderToStaticMarkup(React.createElement(KinfolkItinerary, {
      itinerary: {
        days: [
          {
            day: 1,
            theme: "Arrive and settle in",
            activities: [{
              time: "10:00 AM",
              title: "Neighborhood welcome walk",
              description: "Start with a relaxed orientation through the district.",
              canonicalVenue: "Freedom Trail Visitor Center",
            }],
            safetyNote: "Keep your phone charged before heading out after dark.",
            packingTips: ["Comfortable walking shoes"],
          },
          {
            day: 2,
            theme: "Food and living history",
            activities: [{
              time: "1:00 PM",
              title: "Long-table lunch",
              description: "Leave time to linger and talk with your hosts.",
            }],
          },
          {
            day: 3,
            theme: "Make the last day count",
            activities: [{
              time: "4:00 PM",
              title: "Closing reflection",
              description: "Choose a calm final stop before your departure.",
            }],
          },
        ],
      },
    }));

    expect((markup.match(/data-testid="kinfolk-itinerary-day"/g) ?? [])).toHaveLength(3);
    expect(markup).toContain("Day 1");
    expect(markup).toContain("Arrive and settle in");
    expect(markup).toContain("10:00 AM");
    expect(markup).toContain("Neighborhood welcome walk");
    expect(markup).toContain("Freedom Trail Visitor Center");
    expect(markup).toContain("Safety note");
    expect(markup).toContain("Packing tips");
    expect(markup).not.toContain("Must-Visit Spots");
    expect(travelPageSource).toContain("itinerary: data.itinerary ?? null");
    expect(travelPageSource).toContain("msg.recommendations && !hasItineraryDays(msg.itinerary)");
    expect(markup).not.toContain('"days"');
    expect(markup).not.toContain("```");
    expect(isSerializedItineraryContent('```json\n{"days": []}\n```')).toBe(true);
    expect(isSerializedItineraryContent('{"days": []}')).toBe(true);
    expect(hasItineraryDays({ days: [] })).toBe(false);
  });

  it("shows the staff demo quality badge only for the staff-demo response metadata", () => {
    const staffDemoMarkup = renderToStaticMarkup(React.createElement(KinfolkStaffDemoBadge, {
      experience: { mode: "staff_demo", label: "Staff demo", qualityTier: "quality", contextTurns: 6 },
    }));
    const standardMarkup = renderToStaticMarkup(React.createElement(KinfolkStaffDemoBadge, {
      experience: null,
    }));

    expect(staffDemoMarkup).toContain("Staff demo");
    expect(staffDemoMarkup).toContain("Quality conversation");
    expect(standardMarkup).toBe("");
  });

  it("keeps citations as safe external links and rejects unsafe protocols", () => {
    const markup = renderToStaticMarkup(React.createElement(KinfolkSourceLinks, {
      sources: [
        { title: "Trusted source", url: "https://example.com/research" },
        { title: "Unsafe source", url: "javascript:alert(1)" },
      ],
    }));

    expect(markup).toContain('href="https://example.com/research"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain("Trusted source");
    expect(markup).not.toContain("Unsafe source");
    expect(safeExternalSourceHref("javascript:alert(1)")).toBeNull();
  });
});
