import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { businessClarificationContinuation } from "../lib/businessClarificationContinuation";
import { createVoicePlaybackGuard } from "../lib/voicePlaybackGuard";

const travelSource = readFileSync(fileURLToPath(new URL("../app/travel.tsx", import.meta.url)), "utf8");
const hookSource = readFileSync(fileURLToPath(new URL("../hooks/useKinfolk.ts", import.meta.url)), "utf8");
const detailSource = readFileSync(fileURLToPath(new URL("../app/business/[id].tsx", import.meta.url)), "utf8");
const widgetSource = readFileSync(fileURLToPath(new URL("../components/AIChatWidget.tsx", import.meta.url)), "utf8");
const voiceSource = readFileSync(fileURLToPath(new URL("../hooks/useKinfolkVoiceSource.ts", import.meta.url)), "utf8");
const voiceControls = readFileSync(fileURLToPath(new URL("../components/KinfolkVoiceSourceControls.tsx", import.meta.url)), "utf8");
const voiceContract = readFileSync(fileURLToPath(new URL("../lib/kinfolkVoiceSourceContract.ts", import.meta.url)), "utf8");
const settingsSource = readFileSync(fileURLToPath(new URL("../components/KinfolkSettingsControlCenter.tsx", import.meta.url)), "utf8");
const disclosureSource = readFileSync(fileURLToPath(new URL("../components/KinfolkContinuityDisclosure.tsx", import.meta.url)), "utf8");
const inlineMemoryConsentSource = readFileSync(fileURLToPath(new URL("../components/KinfolkInlineMemoryConsent.tsx", import.meta.url)), "utf8");

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
    expect(travelSource).toContain('card.ownershipStatus === "documented"');
    expect(travelSource).toContain("Ownership: documented by source.");
    expect(travelSource).toContain('testID="kinfolk-ownership-documented"');
    expect(travelSource).toContain("Listing: {businessTrustLabel(card)}");
    expect(travelSource).toContain("Why it surfaced:");
    expect(travelSource).toMatch(
      /Ownership not documented\s*—\s*not an ownership-matched\s*recommendation\./,
    );
    expect(travelSource).toMatch(
      /Not ownership-matched\s*—\s*shown only because you chose to broaden\s*this search\./,
    );
    expect(travelSource).toContain("Know before you go:");
    expect(travelSource).toContain("Confirm current hours, services, and availability");
    expect(hookSource).toContain("resultView?: ConversationalBusinessResultView | null");
    expect(hookSource).toContain("const businessCardsAllowed = canRenderKinfolkBusinessCards(responseMeta)");
    expect(hookSource).toContain("resultView: businessCardsAllowed ? data.resultView ?? null : null");
    expect(travelSource).toContain("<ConversationalResultCards view={msg.resultView}");
    expect(travelSource).toContain("recs && !msg.resultView");
    expect(travelSource).toContain("External sources are not MWM-verified business listings.");
  });

  it("opens each compact Kinfolk pick on its MWM business page while retaining quick options", () => {
    expect(widgetSource).toContain("const openRecommendationBusiness = useCallback");
    expect(widgetSource).toContain('pathname: "/business/[id]"');
    expect(widgetSource).toMatch(
      /onPress=\{\s*\(\)\s*=>\s*openRecommendationBusiness\(\s*recommendation\.id\s*\)\s*\}/,
    );
    expect(widgetSource).toContain('accessibilityLabel={`Open ${recommendation.name} on Mapping with Melanin`}');
    expect(widgetSource).toContain("setSelectedRecommendation(recommendation)");
    expect(widgetSource).toContain('accessibilityLabel={`More options for ${recommendation.name}`}');
  });

  it("carries an optional companion note offer through both mobile Kinfolk surfaces", () => {
    expect(hookSource).toContain("companionMemoryOffer?: KinfolkCompanionMemoryOffer | null");
    expect(hookSource).toContain("companionMemoryOffer: data.companionMemoryOffer ?? null");
    expect(widgetSource).toContain("KinfolkCompanionMemoryOfferCard");
    expect(travelSource).toContain("KinfolkCompanionMemoryOfferCard");
  });

  it("uses first-use disclosure and reversible mobile continuity", () => {
    expect(settingsSource).toContain("continuityEnabled: false");
    expect(settingsSource).toContain("/api/kinfolk/continuity");
    expect(settingsSource).toContain("enabled: snapshot.continuityEnabled");
    expect(settingsSource).toContain("KinfolkContinuityDisclosure");
    expect(disclosureSource).toContain("Let Kinfolk remember");
    expect(disclosureSource).toContain("Keep memory off");
    expect(travelSource).toContain("KinfolkSensitiveMemoryConfirmation");
  });

  it("keeps direct memory choices inside the Kinfolk conversation", () => {
    expect(hookSource).toContain("memoryConsentPlan?: InlineMemoryConsentPlan | null");
    expect(hookSource).toContain("inlineMemoryConsent");
    expect(travelSource).toContain("KinfolkInlineMemoryConsent");
    expect(widgetSource).toContain("KinfolkInlineMemoryConsent");
    expect(inlineMemoryConsentSource).toContain("/api/kinfolk/memory-consent");
  });

  it("keeps Kinfolk voice modes discoverable and makes microphone failures visible", () => {
    expect(widgetSource).toContain('router.push("/kinfolk-settings" as never)');
    expect(widgetSource).toContain("Choose Big Cousin, Professor, and other Kinfolk preferences");
    expect(widgetSource).toContain("useKinfolkVoiceSource({ isAuthenticated })");
    expect(widgetSource).toContain("KinfolkVoiceSourceControls");
    expect(voiceContract).toContain("Microphone access is off");
    expect(voiceContract).toContain("Recording did not start");
    expect(voiceControls).toContain("Recording {source.elapsedSeconds}s / 60s");
    expect(voiceSource).toContain("Sending temporary audio for transcription…");
  });

  it("keeps follow-up suggestions readable in both Kinfolk mobile surfaces", () => {
    expect(widgetSource).toMatch(
      /backgroundColor:\s*colors\.secondary,\s*borderColor:\s*colors\.primary/,
    );
    expect(widgetSource).toContain('numberOfLines={2}');
    expect(widgetSource).toMatch(/minHeight:\s*42,\s*maxWidth:\s*280/);
    expect(widgetSource).not.toContain('chipsScroll: { borderTopWidth: 1, maxHeight: 56 }');
    expect(travelSource).toMatch(
      /backgroundColor:\s*colors\.secondary,\s*borderColor:\s*colors\.primary/,
    );
    expect(travelSource).toMatch(/minHeight:\s*40,\s*maxWidth:\s*280/);
  });

  it("shows a searching-city label only for governed local discovery or itinerary answers", () => {
    expect(travelSource).toMatch(
      /msg\.intentClass\s*===\s*"business_discovery"\s*\|\|\s*msg\.intentClass\s*===\s*"travel_planning"/,
    );
    expect(widgetSource).toMatch(
      /item\.intentClass\s*===\s*"business_discovery"\s*\|\|\s*item\.intentClass\s*===\s*"travel_planning"/,
    );
  });

  it("enables the Expo Audio iOS recording session before starting Kinfolk Voice", () => {
    expect(voiceSource).toContain("setAudioModeAsync");
    expect(voiceSource).toContain("allowsRecording: true");
    expect(voiceSource).toContain("playsInSilentMode: true");
    expect(voiceSource.indexOf("allowsRecording: true")).toBeLessThan(
      voiceSource.indexOf("recorder.prepareToRecordAsync()"),
    );
    expect(voiceSource).toContain("allowsRecording: false");
    expect(widgetSource).toContain("widgetVoiceSource.state.phase === \"starting\"");
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
    expect(widgetSource).toContain("if (!voiceGuardRef.current.canPlay(request)");
    expect(widgetSource).toContain("queuedPlaybackRequestRef.current = request");
    expect(widgetSource).toContain("const pendingPlaybackFilesRef = useRef<FileSystem.File[]>([])");
    expect(widgetSource).toContain("clips?: Array<{ audio?: string; spokenText?: string }>");
    expect(widgetSource).toContain("setVoiceOutputStatus(\"Continuing Kinfolk Voice…\")");
    expect(widgetSource).toContain("playerStatus.didJustFinish");
    expect(widgetSource).toContain("player.play()");
    expect(widgetSource).toContain("setListenUri(undefined)");
    // The widget guard blocks playback when it closes or backgrounds. The primary
    // Kinfolk screen additionally cancels its in-flight TTS request on lifecycle change.
    expect(widgetSource).not.toContain("signal: request.signal");
    expect(travelSource).toContain("signal: request.signal");
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

  it("gates primary Kinfolk server-owned audio on active AppState and an armed response", () => {
    expect(travelSource).toContain("const appStateRef = useRef(AppState.currentState)");
    expect(travelSource).toContain("pendingAutoSpeechRef.current = autoSpeechGuardRef.current.begin()");
    expect(travelSource).toContain('stopServerVoice("app_background")');
    expect(travelSource).toContain('appStateRef.current !== "active"');
    expect(travelSource).toContain("if (!autoSpeechGuardRef.current.canPlay(request)");
    expect(travelSource).toContain('`${getApiBase()}/api/kinfolk/speak`');
    expect(travelSource).toContain("useAudioPlayer(voiceAudioUri)");
    expect(travelSource).toContain("serverVoicePlayer.play()");
    expect(travelSource).toContain('stopServerVoice("app_background")');
  });

  it("shows only approved public creator links and opens them on the original platform", () => {
    expect(detailSource).toContain("/api/businesses/${id}/contributions");
    expect(detailSource).toContain("Community posts");
    expect(detailSource).toContain("approvedContributionUrl");
    expect(detailSource).toContain("const openApprovedContribution");
    expect(detailSource).toContain("WebBrowser.openBrowserAsync(url)");
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
