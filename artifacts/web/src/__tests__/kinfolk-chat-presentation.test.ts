import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  KinfolkAssistantText,
  KinfolkSourceLinks,
  KinfolkStaffDemoBadge,
  KINFOLK_RESPONSE_STATUS_STAGES,
  responseStatusForElapsedTime,
  safeExternalSourceHref,
} from "../components/kinfolk/KinfolkChatPresentation";

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
