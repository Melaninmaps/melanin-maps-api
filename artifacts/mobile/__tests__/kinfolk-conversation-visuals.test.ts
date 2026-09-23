import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(
  fileURLToPath(new URL("../app/travel.tsx", import.meta.url)),
  "utf8",
);

function sectionBetween(start: string, end: string) {
  const startIndex = travelSource.indexOf(start);
  const endIndex = travelSource.indexOf(end, startIndex);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return travelSource.slice(startIndex, endIndex);
}

describe("Kinfolk conversation-first visuals", () => {
  it("keeps the compact welcome conversational, progressively disclosed, and connected to Trip Journals", () => {
    const welcome = sectionBetween(
      'function WelcomeScreen({',
      '// ─── Sub-component: Taste Profile Sheet',
    );

    expect(welcome).toContain('testID="kinfolk-conversation-welcome"');
    expect(welcome).toContain("START A CONVERSATION");
    expect(welcome).toContain("More ways to start");
    expect(welcome).toContain("Show fewer prompts");
    expect(welcome).toContain("const visiblePrompts = showMorePrompts ? WELCOME_CHIPS : WELCOME_CHIPS.slice(0, 3)");
    expect(welcome).toContain("Open Trip Journals");
    expect(welcome).toContain('router.push("/journals" as never)');
    expect(welcome).toContain("getDailyQuoteText(\"diaspora\", 2)");
  });

  it("keeps all named conversation entry paths reachable through the compact header actions", () => {
    const header = sectionBetween(
      '      {/* Header */}',
      '      {/* Personalization banner */}',
    );

    expect(header).toContain("Open Kinfolk conversation actions");
    expect(header).toContain("Open saved places");
    expect(header).toContain('router.push("/wishlist" as any)');
    expect(header).toContain("Toggle comparison mode");
    expect(header).toContain("setCompareMode((value) => !value)");
    expect(header).toContain("Open flight tracker");
    expect(header).toContain("setShowFlights(true)");
    expect(header).toContain("Open conversation history");
    expect(header).toContain("setShowHistory(true)");
    expect(header).toContain("Start a new Kinfolk conversation");
    expect(header).toContain("handleNewSession()");
  });

  it("retains business-card and Library action routes alongside the welcome and overflow entries", () => {
    expect(travelSource).toContain("function BusinessCard({");
    expect(travelSource).toContain('pathname: "/business/[id]"');
    expect(travelSource).toContain("function LibraryActionPill({");
    expect(travelSource).toContain('pathname: "/(tabs)/library" as never');
    expect(travelSource).toContain('focus: "evidence"');
  });

  it("retains visible Voice & privacy controls and explicit private-memory and Community consent", () => {
    const composer = sectionBetween(
      '        <TouchableOpacity\n          activeOpacity={0.82}\n          onPress={() => setShowComposerControls',
      '        {voiceInputStatus ? (',
    );

    expect(composer).toContain("Voice &amp; privacy");
    expect(composer).toContain("Kinfolk Voices™");
    expect(composer).toContain("Save this to my private Kinfolk memory");
    expect(composer).toContain("accessibilityState={{ checked: rememberThis }}");
    expect(composer).toContain("Use approved public Community posts");
    expect(composer).toContain("accessibilityState={{ checked: includeCommunityPerspective }}");
    expect(composer).toContain("Community content is perspective, never evidence or a recommendation.");
    expect(travelSource).toContain("const [rememberThis, setRememberThis] = useState(false)");
    expect(travelSource).toContain("const [includeCommunityPerspective, setIncludeCommunityPerspective] = useState(false)");
    expect(composer).toContain("setRememberThis((value) => !value)");
    expect(composer).toContain("setIncludeCommunityPerspective((value) => !value)");
  });
});
