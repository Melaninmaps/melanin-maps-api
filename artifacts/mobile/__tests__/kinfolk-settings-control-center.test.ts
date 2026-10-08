import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const settings = readFileSync(new URL("../app/settings.tsx", import.meta.url), "utf8");
const kinfolkRoute = readFileSync(new URL("../app/kinfolk-settings.tsx", import.meta.url), "utf8");
const controlCenter = readFileSync(new URL("../components/KinfolkSettingsControlCenter.tsx", import.meta.url), "utf8");
const memory = readFileSync(new URL("../app/kinfolk-memory.tsx", import.meta.url), "utf8");
const privatePlaces = readFileSync(new URL("../app/kinfolk-private-places.tsx", import.meta.url), "utf8");
const temporaryStays = readFileSync(new URL("../app/kinfolk-temporary-stays.tsx", import.meta.url), "utf8");
const exitGuard = readFileSync(new URL("../hooks/useUnsavedKinfolkExitGuard.ts", import.meta.url), "utf8");
const widget = readFileSync(new URL("../components/AIChatWidget.tsx", import.meta.url), "utf8");
const colors = readFileSync(new URL("../constants/colors.ts", import.meta.url), "utf8");
const voicePreflight = readFileSync(new URL("../app/kinfolk-voice-preflight.tsx", import.meta.url), "utf8");
const inlineMemoryConsent = readFileSync(new URL("../components/KinfolkInlineMemoryConsent.tsx", import.meta.url), "utf8");

function paletteColor(palette: "light" | "dark", token: "primary" | "primaryForeground"): string {
  const start = colors.indexOf(`  ${palette}: {`);
  const end = colors.indexOf("  },", start);
  const match = colors.slice(start, end).match(new RegExp(`${token}:\\s*"(#[0-9A-Fa-f]{6})"`));
  if (!match) throw new Error(`Missing ${palette}.${token} color token`);
  return match[1];
}

function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
      .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Build 135 native Kinfolk Settings", () => {
  it("starts Settings with only two collapsed, mutually exclusive accordions", () => {
    expect(settings).toContain('useState<SectionId | null>(null)');
    expect(settings).toContain('id: "account"');
    expect(settings).toContain('id: "app"');
    expect(settings).toContain('current === id ? null : id');
    expect(settings).toContain('accessibilityState={{ expanded }}');
    expect(settings).toContain('label: "KinfolkAI™"');
    expect(settings).toContain('label: "Edit Profile"');
    expect(settings).toContain('label: "Gender & Pronouns"');
    expect(settings).toContain('label: "Change Password"');
    expect(settings).toContain('label: "Connected Accounts"');
    for (const label of ["Notifications", "Video Sources", "Privacy & Safety", "Safety Hub", "Trusted Safety Share", "Dark Mode"]) {
      expect(settings).toContain(`label: "${label}"`);
    }
    expect(settings).not.toContain('title: "Your Spaces"');
    expect(settings).not.toContain('title: "Community"');
    expect(settings).not.toContain('title: "Business"');
  });

  it("uses the dedicated Kinfolk control center and exposes current explicit state", () => {
    expect(kinfolkRoute).toContain('KinfolkSettingsControlCenter');
    for (const label of ["MY PREFERENCES", "Conversation mode", "Voice", "Support preference", "Preferred name", "Saved memories", "EXPLICIT PROFILE DETAILS"]) {
      expect(controlCenter).toContain(label);
    }
    expect(controlCenter).toContain("/api/kinfolk/preferred-name");
    expect(controlCenter).toContain('router.push("/kinfolk-memory" as never)');
    expect(controlCenter).toContain("Accessibility and regional-language preferences are not inferred");
    expect(controlCenter).toContain('router.push("/kinfolk-private-places" as never)');
    expect(controlCenter).toContain("Private Places");
  });

  it("keeps native primary actions readable in both app themes", () => {
    for (const palette of ["light", "dark"] as const) {
      expect(contrastRatio(paletteColor(palette, "primaryForeground"), paletteColor(palette, "primary"))).toBeGreaterThanOrEqual(4.5);
    }
    for (const source of [controlCenter, voicePreflight, inlineMemoryConsent]) {
      expect(source).toContain("colors.primaryForeground");
    }
    expect(controlCenter).not.toContain("PRIMARY_ACTION_INK");
    expect(voicePreflight).not.toContain("PRIMARY_ACTION_INK");
  });

  it("persists settings only through one explicit save transaction and retains a failed draft", () => {
    expect(controlCenter).toContain("savingPromise");
    expect(controlCenter).not.toContain("setTimeout(");
    expect(controlCenter).toContain("Your draft is still here");
    expect(controlCenter).toContain("Promise.all(requests)");
    expect(controlCenter).toContain("setPersisted(copyDraft(snapshot))");
    expect(controlCenter).toContain('body: JSON.stringify({ personalisedSuggestions: snapshot.personalizedSuggestions })');
    expect(controlCenter).toContain('method: "PUT", headers');
    expect(controlCenter).not.toContain("preferredName:");
    expect(controlCenter).not.toContain("privateMemories");
  });

  it("protects iOS Back, Android Back, gesture-back, modal close, and programmatic exits", () => {
    expect(exitGuard).toContain('navigation.addListener("beforeRemove"');
    expect(exitGuard).toContain("event.preventDefault()");
    expect(exitGuard).toContain('text: "Save changes"');
    expect(exitGuard).toContain('text: "Discard changes"');
    expect(exitGuard).toContain('text: "Keep editing"');
    expect(exitGuard).toContain("navigation.dispatch(event.data.action)");
    expect(exitGuard).toContain("allowExitRef");
    expect(controlCenter).toContain("useUnsavedKinfolkExitGuard({ dirty, saving");
    expect(memory).toContain("useUnsavedKinfolkExitGuard({");
    expect(memory).toContain("savePendingDrafts");
    expect(memory).toContain("original: memory.content");
  });

  it("prevents the global chat pill from overlapping Settings content", () => {
    expect(widget).toContain('const onSettingsRoute = ["/settings", "/kinfolk-settings", "/kinfolk-memory", "/kinfolk-private-places", "/kinfolk-temporary-stays"]');
    expect(widget).toContain("|| onSettingsRoute");
  });

  it("keeps native Private Places explicit, encrypted, and outside Kinfolk chat", () => {
    expect(privatePlaces).toContain("Private Places");
    expect(privatePlaces).toContain("api/kinfolk/private-places/status");
    expect(privatePlaces).toContain("googleMapsGeocodingConsent: true");
    expect(privatePlaces).toContain("Use for nearby directory search");
    expect(privatePlaces).toContain("never becomes Kinfolk chat memory");
    expect(privatePlaces).toContain("useUnsavedKinfolkExitGuard");
    expect(privatePlaces).not.toContain("/api/kinfolk/chat");
  });

  it("keeps native Temporary Stays explicit, encrypted, retained only through grace, and outside Kinfolk chat", () => {
    expect(controlCenter).toContain('router.push("/kinfolk-temporary-stays" as never)');
    expect(temporaryStays).toContain("api/kinfolk/temporary-stays/status");
    expect(temporaryStays).toContain("googleMapsGeocodingConsent: true");
    expect(temporaryStays).toContain("postDepartureGraceDays");
    expect(temporaryStays).toContain("/extend");
    expect(temporaryStays).toContain("/active");
    expect(temporaryStays).toContain("useUnsavedKinfolkExitGuard");
    expect(temporaryStays).not.toContain("/api/kinfolk/chat");
  });
});
