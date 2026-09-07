import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { businessClarificationContinuation } from "../lib/businessClarificationContinuation";
import { createVoicePlaybackGuard } from "../lib/voicePlaybackGuard";

const travelSource = readFileSync(fileURLToPath(new URL("../app/travel.tsx", import.meta.url)), "utf8");
const hookSource = readFileSync(fileURLToPath(new URL("../hooks/useKinfolk.ts", import.meta.url)), "utf8");
const detailSource = readFileSync(fileURLToPath(new URL("../app/business/[id].tsx", import.meta.url)), "utf8");
const widgetSource = readFileSync(fileURLToPath(new URL("../components/AIChatWidget.tsx", import.meta.url)), "utf8");

describe("Expo Kinfolk business demo cards", () => {
  it("supports canonical detail, vetted website, unclaimed status, and match reasons", () => {
    expect(hookSource).toContain("id?: string");
    expect(hookSource).toContain("website?: string | null");
    expect(hookSource).toContain("claimed?: boolean");
    expect(hookSource).toContain("matchReasons?: string[]");
    expect(travelSource).toContain('pathname: "/business/[id]"');
    expect(travelSource).toContain("openExternalUrl(biz.website!)");
    expect(travelSource).toContain("Claimed · Not MWM verified");
    expect(travelSource).toContain("Unclaimed · Not MWM verified");
    expect(travelSource).toContain("MWM verified");
    expect(travelSource).toContain("Why it surfaced:");
    expect(hookSource).toContain("resultView?: ConversationalBusinessResultView | null");
    expect(hookSource).toContain("resultView: data.resultView ?? null");
    expect(travelSource).toContain("<ConversationalResultCards view={msg.resultView}");
    expect(travelSource).toContain("recs && !msg.resultView");
    expect(travelSource).toContain("External sources are not MWM-verified business listings.");
  });

  it("invalidates deferred widget voice responses after background or close", async () => {
    let active = true;
    let open = true;
    const guard = createVoicePlaybackGuard(() => active && open);

    for (const leave of [
      () => { active = false; },
      () => { open = false; },
    ]) {
      active = true;
      open = true;
      let resolveResponse!: () => void;
      const response = new Promise<void>((resolve) => { resolveResponse = resolve; });
      const request = guard.begin();
      let played = false;
      const playback = response.then(() => {
        if (guard.canPlay(request)) played = true;
      });

      leave();
      guard.invalidate("lifecycle_change");
      resolveResponse();
      await playback;

      expect(request.signal.aborted).toBe(true);
      expect(played).toBe(false);
    }
  });

  it("gates widget TTS responses and player playback on active plus open", () => {
    expect(widgetSource).toContain("const openRef = useRef(false)");
    expect(widgetSource).toContain("const appStateRef = useRef(AppState.currentState)");
    expect(widgetSource).toContain('openRef.current && appStateRef.current === "active"');
    expect(widgetSource).toContain('stopPlayback("widget_closed")');
    expect(widgetSource).toContain('stopPlayback("app_background")');
    expect(widgetSource).toContain("signal: request.signal");
    expect(widgetSource).toContain("if (!voiceGuardRef.current.canPlay(request)");
    expect(widgetSource).toContain("queuedPlaybackRequestRef.current = request");
    expect(widgetSource).toContain("player.play()");
    expect(widgetSource).toContain("setListenUri(undefined)");
  });

  it("invalidates deferred travel auto-speech when the app backgrounds", async () => {
    let active = true;
    let voiceOutput = true;
    let resolveReply!: () => void;
    const reply = new Promise<void>((resolve) => { resolveReply = resolve; });
    const guard = createVoicePlaybackGuard(() => active && voiceOutput);
    const request = guard.begin();
    let spoke = false;
    const autoSpeech = reply.then(() => {
      if (guard.canPlay(request)) spoke = true;
    });

    active = false;
    guard.invalidate("app_background");
    resolveReply();
    await autoSpeech;

    expect(request.signal.aborted).toBe(true);
    expect(spoke).toBe(false);
  });

  it("gates travel Speech.speak on active AppState and an armed response", () => {
    expect(travelSource).toContain("const appStateRef = useRef(AppState.currentState)");
    expect(travelSource).toContain("pendingAutoSpeechRef.current = autoSpeechGuardRef.current.begin()");
    expect(travelSource).toContain('autoSpeechGuardRef.current.invalidate("app_background")');
    expect(travelSource).toContain('appStateRef.current !== "active"');
    expect(travelSource).toContain("if (!autoSpeechGuardRef.current.canPlay(request)");
    expect(travelSource).toContain("Speech.speak(last.content");
    expect(travelSource).toContain("Speech.speak(content");
    expect(travelSource).toContain("void Speech.stop()");
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
