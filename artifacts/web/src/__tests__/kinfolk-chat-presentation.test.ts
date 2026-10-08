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
  KinfolkSpokenText,
  KinfolkSourceLinks,
  KinfolkStaffDemoBadge,
  KINFOLK_RESPONSE_STATUS_STAGES,
  kinfolkWorkingElapsedLabel,
  responseStatusForElapsedTime,
  safeExternalSourceHref,
  safeLibraryHref,
} from "../components/kinfolk/KinfolkChatPresentation";
import { businessClarificationContinuation } from "../features/kinfolk/businessClarificationContinuation";
import { createVoicePlaybackGuard } from "../lib/voicePlaybackGuard";

const travelPageSource = readFileSync(
  fileURLToPath(new URL("../pages/travel.tsx", import.meta.url)),
  "utf8",
);
const memoryManagerSource = readFileSync(
  fileURLToPath(new URL("../components/kinfolk/KinfolkMemoryManager.tsx", import.meta.url)),
  "utf8",
);
const disclosureSource = readFileSync(
  fileURLToPath(new URL("../components/kinfolk/KinfolkContinuityDisclosure.tsx", import.meta.url)),
  "utf8",
);
const inlineMemoryConsentSource = readFileSync(
  fileURLToPath(new URL("../components/kinfolk/KinfolkInlineMemoryConsent.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk chat presentation", () => {
  it("continues the original local search for both a clarification answer and Skip", () => {
    expect(businessClarificationContinuation(
      "Find hair in Philadelphia",
      "Loc and natural-hair care in Philadelphia",
    )).toBe("Find hair in Philadelphia — Loc and natural-hair care in Philadelphia");
    expect(businessClarificationContinuation("Find hair in Philadelphia")).toBe(
      "Find hair in Philadelphia — keep this search broad",
    );
  });

  it("preserves assistant paragraph and list line breaks as safe plain text", () => {
    const content = "A first paragraph.\n\n- First detail\n- Second detail";
    const markup = renderToStaticMarkup(React.createElement(KinfolkAssistantText, { content }));

    expect(markup).toContain("whitespace-pre-wrap");
    expect(markup).toContain("break-words");
    expect(markup).toContain(content);
    expect(markup).not.toContain("dangerouslySetInnerHTML");
  });

  it("keeps the exact full audio text visibly available during and after playback", () => {
    const spoken = "First sentence. Second sentence.";
    const playing = renderToStaticMarkup(React.createElement(KinfolkSpokenText, {
      content: spoken,
      phase: "playing",
    }));
    const finished = renderToStaticMarkup(React.createElement(KinfolkSpokenText, {
      content: spoken,
      phase: "finished",
    }));
    const unavailable = renderToStaticMarkup(React.createElement(KinfolkSpokenText, {
      content: spoken,
      phase: "unavailable",
    }));

    expect(playing).toContain('data-testid="kinfolk-spoken-text"');
    expect(playing).toContain("Audio is playing — spoken text");
    expect(playing).toContain(spoken);
    expect(finished).toContain("Audio finished — spoken text");
    expect(finished).toContain(spoken);
    expect(unavailable).toContain("Audio unavailable — spoken text returned");
    expect(unavailable).toContain(spoken);
    expect(travelPageSource).toContain("normalizeKinfolkVoicePlaybackPayload");
    expect(travelPageSource).toContain("createKinfolkVoicePlaybackQueue");
    expect(travelPageSource).toContain("body: JSON.stringify({ text: content, mode: kinfolkMode, requestId: msgId })");
    expect(travelPageSource).toContain("<KinfolkSpokenText content={spokenText.content} phase={spokenText.phase} />");
    expect(travelPageSource).toContain('phase: "unavailable"');
    expect(travelPageSource).toContain("payload.spokenText !== content");
    expect(travelPageSource).toContain("Playback could not continue. Replay the full answer.");
    expect(travelPageSource).toContain('voiceGuardRef.current.invalidate("new_message")');
    expect(travelPageSource).toContain("queue.pause()");
    expect(travelPageSource).toContain("queue.resume()");
    expect(travelPageSource).toContain('"Pause" : spokenText?.messageId === msg.id ? "Replay"');
    expect(travelPageSource).not.toContain("text: content.slice(0, 600)");
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

  it("shows a local elapsed working indicator without claiming research or recommendations", () => {
    expect(kinfolkWorkingElapsedLabel(0)).toBe("Kinfolk is working… 0s");
    expect(kinfolkWorkingElapsedLabel(2.9)).toBe("Kinfolk is working… 2s");
    expect(kinfolkWorkingElapsedLabel(-2)).toBe("Kinfolk is working… 0s");
    expect(travelPageSource).toContain('data-testid="kinfolk-working-elapsed"');
    expect(travelPageSource).toContain("responseElapsedSeconds");
    expect(travelPageSource).toContain("responseElapsedTimerRef");
    expect(travelPageSource).toContain("kinfolkWorkingElapsedLabel(responseElapsedSeconds)");
  });

  it("keeps an imperfect voice transcript member-controlled before the normal Kinfolk chat path", () => {
    expect(travelPageSource).toContain("const originalText = data.meaningReview?.originalText?.trim() || transcript");
    expect(travelPageSource).toContain("setInput(composerValueFromTranscript(originalText))");
    expect(travelPageSource).toContain("nothing is sent until you choose or edit text and press Send");
    expect(travelPageSource).toContain("body: JSON.stringify({ sessionId, message: trimmed");
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

  it("sends a consent-first travel category chip as the member’s next explicit turn", () => {
    expect(travelPageSource).toContain("msg.followUpSuggestions.map((s, i) => (");
    expect(travelPageSource).toContain("onClick={() => send(s)}");
    expect(travelPageSource).not.toContain("followUpSuggestions[0]");
  });

  it("renders an opt-in companion note without changing primary profile data", () => {
    expect(travelPageSource).toContain("KinfolkCompanionMemoryOfferCard");
    expect(travelPageSource).toContain("companionMemoryOffer: data.companionMemoryOffer ?? null");
    expect(travelPageSource).toContain("sessionId={sessionId}");
  });

  it("uses first-use disclosure, immediate opt-out, and reversible web continuity", () => {
    expect(memoryManagerSource).toContain("const [continuityEnabled, setContinuityEnabled] = useState(false)");
    expect(memoryManagerSource).toContain('fetch(`${BASE}api/kinfolk/continuity`, { credentials: "include" })');
    expect(memoryManagerSource).toContain('method: "PUT", credentials: "include"');
    expect(memoryManagerSource).toContain("body: JSON.stringify({ enabled })");
    expect(memoryManagerSource).toContain("Turn it off immediately any time");
    expect(travelPageSource).toContain("KinfolkContinuityDisclosure");
    expect(disclosureSource).toContain("Let Kinfolk remember");
    expect(disclosureSource).toContain("Keep memory off");
    expect(memoryManagerSource).toContain("Confirm sensitive edit");
  });

  it("renders a visible, accessible session-only handoff status", () => {
    expect(travelPageSource).toContain('data-testid="kinfolk-conversation-handoff"');
    expect(travelPageSource).toContain('aria-live="polite"');
    expect(travelPageSource).toContain('aria-atomic="true"');
    expect(travelPageSource).toContain('"Conversation resumed" : "Conversation saved"');
    expect(travelPageSource).toContain("conversationHandoff.summary");
  });

  it("renders direct memory choices inside the Kinfolk conversation", () => {
    expect(travelPageSource).toContain("KinfolkInlineMemoryConsent");
    expect(travelPageSource).toContain("memoryConsentPlan?: KinfolkInlineMemoryConsentPlan | null");
    expect(travelPageSource).toContain("inlineMemoryConsent: data.memoryConsentPlan");
    expect(inlineMemoryConsentSource).toContain("const [sensitiveConsent, setSensitiveConsent]");
    expect(inlineMemoryConsentSource).toContain("sensitiveConsent: savingSensitive");
    expect(inlineMemoryConsentSource).toContain("I separately confirm these selected sensitive details");
  });

  it("renders deterministic business recommendations with active detail and website links", () => {
    expect(travelPageSource).toContain("biz.detailUrl");
    expect(travelPageSource).toContain("View details");
    expect(travelPageSource).toContain("Visit website");
    expect(travelPageSource).toContain('target="_blank" rel="noopener noreferrer"');
    expect(travelPageSource).toContain("Unclaimed · Not MWM verified");
    expect(travelPageSource).toContain("Claimed · Not MWM verified");
    expect(travelPageSource).toContain("MWM verified");
    expect(travelPageSource).toContain("Why it surfaced:");
    expect(travelPageSource).toContain("Know before you go:");
    expect(travelPageSource).toContain("Confirm current hours, services, and availability");
    expect(travelPageSource).toContain('data-testid="kinfolk-business-result-view"');
    expect(travelPageSource).toContain("const businessCardsAllowed = canRenderKinfolkBusinessCards(responseMeta)");
    expect(travelPageSource).toContain("resultView: businessCardsAllowed ? data.resultView ?? null : null");
    expect(travelPageSource).toContain("msg.recommendations && !msg.resultView");
    expect(travelPageSource).toContain("External sources are not MWM-verified business listings.");
    expect(travelPageSource).toContain('card.ownershipStatus === "documented"');
    expect(travelPageSource).toContain("Ownership: documented by source.");
    expect(travelPageSource).toContain('data-testid="kinfolk-ownership-documented"');
    expect(travelPageSource).toContain("Listing: {businessTrustLabel(card)}");
    expect(travelPageSource).toContain("Ownership not documented — not an ownership-matched recommendation.");
    expect(travelPageSource).toContain("Not ownership-matched — shown only because you chose to broaden this search.");
  });

  it("invalidates a deferred browser voice response before hidden-page playback", async () => {
    let visible = true;
    let resolveResponse!: () => void;
    const response = new Promise<void>((resolve) => { resolveResponse = resolve; });
    const guard = createVoicePlaybackGuard(() => visible);
    const request = guard.begin();
    let played = false;

    const playback = response.then(() => {
      if (guard.canPlay(request)) played = true;
    });
    visible = false;
    guard.invalidate("visibilitychange");
    resolveResponse();
    await playback;

    expect(request.signal.aborted).toBe(true);
    expect(played).toBe(false);
  });

  it("aborts and foreground-gates browser voice playback when the page is hidden or left", () => {
    expect(travelPageSource).toContain('document.addEventListener("visibilitychange"');
    expect(travelPageSource).toContain('window.addEventListener("pagehide"');
    expect(travelPageSource).toContain('voiceGuardRef.current.invalidate("page_hidden")');
    expect(travelPageSource).toContain('voiceGuardRef.current.invalidate("unmount")');
    expect(travelPageSource).toContain("signal: request.signal");
    expect(travelPageSource).toContain("if (!voiceGuardRef.current.canPlay(request))");
    expect(travelPageSource).toContain('document.visibilityState !== "visible"');
    expect(travelPageSource).toContain("releaseAudio()");
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
    expect(travelPageSource).toContain("msg.recommendations && !msg.resultView && !hasItineraryDays(msg.itinerary)");
    expect(markup).not.toContain('"days"');
    expect(markup).not.toContain("```");
    expect(isSerializedItineraryContent('```json\n{"days": []}\n```')).toBe(true);
    expect(isSerializedItineraryContent('{"days": []}')).toBe(true);
    expect(hasItineraryDays({ days: [] })).toBe(false);
  });

  it("keeps internal staff quality metadata out of the member conversation", () => {
    const staffDemoMarkup = renderToStaticMarkup(React.createElement(KinfolkStaffDemoBadge, {
      experience: { mode: "staff_demo", label: "Staff demo", qualityTier: "quality", contextTurns: 6 },
    }));
    const standardMarkup = renderToStaticMarkup(React.createElement(KinfolkStaffDemoBadge, {
      experience: null,
    }));

    expect(staffDemoMarkup).toBe("");
    expect(standardMarkup).toBe("");
  });

  it("keeps citations as safe external links and rejects unsafe protocols", () => {
    const markup = renderToStaticMarkup(React.createElement(KinfolkSourceLinks, {
      sources: [
        { title: "Trusted source", url: "https://example.com/research" },
        { title: "Unapproved internal path", url: "/places/for-keeps-books" },
        { title: "Unsafe source", url: "javascript:alert(1)" },
        { title: "Protocol-relative source", url: "//evil.example/path" },
      ],
      onSummarize: () => {},
    }));

    expect(markup).toContain('href="https://example.com/research"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain("Trusted source");
    expect(markup).toContain("Summarize with Kinfolk");
    expect(markup).toContain("Ask Kinfolk to summarize Trusted source");
    expect(markup).not.toContain('href="/places/for-keeps-books"');
    expect(markup).not.toContain("Unapproved internal path");
    expect(markup).not.toContain("Unsafe source");
    expect(markup).not.toContain("Protocol-relative source");
    expect(safeExternalSourceHref("javascript:alert(1)")).toBeNull();
    expect(safeExternalSourceHref("//evil.example/path")).toBeNull();
    for (const unsafe of ["https://localhost/a", "https://intranet/a", "https://service.internal/a", "https://127.0.0.1/a", "https://[::1]/a"]) {
      expect(safeExternalSourceHref(unsafe)).toBeNull();
    }
  });

  it("accepts only canonical internal topic routes as Library actions", () => {
    expect(safeLibraryHref("/library/topics/hip-hop")).toBe("/library/topics/hip-hop");
    expect(safeLibraryHref("/library/topics/health#evidence")).toBe("/library/topics/health#evidence");
    expect(safeLibraryHref("https://untrusted.example/library/topics/hip-hop")).toBeNull();
    expect(safeLibraryHref("/places/not-a-library-topic")).toBeNull();
    expect(safeLibraryHref("//evil.example/library/topics/hip-hop")).toBeNull();
  });
});
