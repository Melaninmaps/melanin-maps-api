import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../pages/trips.tsx", import.meta.url), "utf8");
const controls = readFileSync(new URL("../components/kinfolk/PrivateAvailabilityBlocks.tsx", import.meta.url), "utf8");

describe("Web private Availability Blocks", () => {
  it("adds the controls to the authenticated Trips surface", () => {
    expect(page).toContain('import PrivateAvailabilityBlocks from "@/components/kinfolk/PrivateAvailabilityBlocks";');
    expect(page).toContain("<PrivateAvailabilityBlocks />");
  });

  it("uses authenticated no-store owner lifecycle and explicit safe preview requests", () => {
    expect(controls).toContain("api/kinfolk/availability-blocks");
    expect(controls).toContain("api/kinfolk/availability-blocks/preview");
    expect(controls).toContain('credentials: "include"');
    expect(controls).toContain('cache: "no-store"');
    expect(controls).toContain('method: editing ? "PUT" : "POST"');
    expect(controls).toContain('method: "DELETE"');
    expect(controls).toContain('method: "POST"');
    expect(controls).toContain("memberConfirmed: true");
    expect(controls).toContain('aria-label="Confirm private availability save"');
    expect(controls).toContain('aria-label="Confirm private availability preview"');
    expect(controls).toContain("window.confirm(\"Delete this private availability block?");
    expect(controls).toContain("hasConflict");
    expect(controls).toContain("conflictCount");
  });

  it("labels the manual/private and no-external-sync boundary, opt-in scope, and truthful safe result", () => {
    for (const contract of [
      "Manual, not a calendar integration.",
      "No external calendar is connected, read, synced, or blocked.",
      "separate future approval gate",
      "only when I deliberately run a manual availability preview",
      "never reveals a label, commitment detail, other member data, or any provider state",
      "never automatically used in Kinfolk chat or memory",
      "canonical IANA time zone",
    ]) expect(controls).toContain(contract);
    expect(controls).toContain('type="datetime-local"');
  });

  it("does not add client storage, automatic chat, provider calls, sharing, or arbitrary calendar URLs", () => {
    for (const forbidden of ["api/kinfolk/chat", "AsyncStorage", "localStorage", "sessionStorage", "googleapis", "calendar.google", "shareId", "http://", "https://"]) {
      expect(controls).not.toContain(forbidden);
    }
  });
});
