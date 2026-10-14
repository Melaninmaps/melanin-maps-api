import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const page = readFileSync(
  fileURLToPath(new URL("../pages/cultural-journey.tsx", import.meta.url)),
  "utf8",
);
const app = readFileSync(
  fileURLToPath(new URL("../App.tsx", import.meta.url)),
  "utf8",
);
const library = readFileSync(
  fileURLToPath(new URL("../features/library/LivingLibraryHome.tsx", import.meta.url)),
  "utf8",
);

describe("My Cultural Journey Web member view", () => {
  it("is member-gated, reachable from the active Library, and uses only the existing owner API with no-store requests", () => {
    expect(app).toContain('import CulturalJourneyPage from "@/pages/cultural-journey"');
    expect(app).toContain('<Route path="/library/cultural-journey">');
    expect(app).toContain('<Layout><ProtectedRoute><CulturalJourneyPage /></ProtectedRoute></Layout>');
    expect(library).toContain('href="/library/cultural-journey"');
    expect(page).toContain('`${BASE}/api/cultural-journeys`');
    expect(page).toContain('credentials: "include"');
    expect(page).toContain('cache: "no-store"');
    expect(page).toContain('"Cache-Control": "no-store"');
  });

  it("uses source-derived safe fields and makes reflection and deletion explicitly member-confirmed", () => {
    expect(page).toContain("siteName");
    expect(page).toContain("sourceLabel");
    expect(page).toContain("culturalSiteId");
    expect(page).toContain("memberConfirmed: true, reflection: nextReflection");
    expect(page).toContain('JSON.stringify({ memberConfirmed: true })');
    expect(page).toContain("window.confirm");
    expect(page).toContain("Clear reflection");
    expect(page).toContain("setEntries((current) => current.filter");
    expect(page).not.toMatch(/localStorage|sessionStorage|analytics|posthog|trackExternalClick|achievement|points/i);
  });

  it("states the privacy boundary and gives truthful empty, loading, failure, and retry states without an automatic Kinfolk path", () => {
    expect(page).toContain("create private memory");
    expect(page).toContain("infer identity");
    expect(page).toContain("does not mark a visit");
    expect(page).toContain("Gentle invitations and nudges are not added here.");
    expect(page).toContain("Loading your private Journey");
    expect(page).toContain("Nothing saved yet");
    expect(page).toContain("My Cultural Journey is unavailable");
    expect(page).toContain("Try again");
    expect(page).not.toMatch(/chat|message.*Kinfolk.*send/i);
    expect(page).not.toMatch(/https?:\/\//i);
  });
});
