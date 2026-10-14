import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(__dirname, path), "utf8");
}

describe("Cultural Journey vertical slice", () => {
  it("allows an explicit Cultural Explorer save before opening the Library handoff", () => {
    const explorer = source("../app/cultural-heritage.tsx");
    expect(explorer).toContain("/api/cultural-journeys/cultural-sites/");
    expect(explorer).toContain("memberConfirmed: true");
    expect(explorer).toContain("I choose to save this site to My Cultural Journey.");
    expect(explorer).toContain("Continue with Kinfolk in the Library");
    expect(explorer).toContain('culturalJourneyId: journeyEntry.id');
    expect(explorer).toContain('research: "false"');
  });

  it("keeps the Library reflection member-confirmed and distinct from memory or research context", () => {
    const library = source("../app/library-research.tsx");
    expect(library).toContain("culturalJourneyId");
    expect(library).toContain("/api/cultural-journeys/entries/");
    expect(library).toContain("memberConfirmed: true, reflection: journeyReflection");
    expect(library).toContain("This private reflection is not added to Kinfolk memory or used to change Library research.");
    expect(library).toContain("I choose to save this private reflection in My Cultural Journey.");
  });

  it("provides a private native browse view with owner API requests, explicit edits, and no automatic journey path", () => {
    const explorer = source("../app/cultural-heritage.tsx");
    const journey = source("../app/cultural-journey.tsx");
    expect(explorer).toContain('router.push("/cultural-journey" as never)');
    expect(journey).toContain('`${getApiBase()}/api/cultural-journeys`');
    expect(journey).toContain("getMemberApiHeaders");
    expect(journey).toContain('credentials: "include"');
    expect(journey).toContain('cache: "no-store"');
    expect(journey).toContain("memberConfirmed: true, reflection: nextReflection");
    expect(journey).toContain('JSON.stringify({ memberConfirmed: true })');
    expect(journey).toContain("Alert.alert");
    expect(journey).toContain("Clear reflection");
    expect(journey).toContain("Nothing saved yet");
    expect(journey).toContain("My Cultural Journey is unavailable");
    expect(journey).toContain("Try again");
    expect(journey).toContain("does not mark a visit");
    expect(journey).toContain("Gentle invitations and nudges are not added here.");
    expect(journey).not.toMatch(/AsyncStorage|SecureStore|localStorage|analytics|posthog|trackExternalClick|achievement|https?:\/\//i);
  });
});
