import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ownerHome = readFileSync(
  new URL("../app/business-owner/index.tsx", import.meta.url),
  "utf8",
);
const ownerLayout = readFileSync(
  new URL("../app/business-owner/_layout.tsx", import.meta.url),
  "utf8",
);
const voiceScreen = readFileSync(
  new URL("../app/business-owner/kinfolk-voice.tsx", import.meta.url),
  "utf8",
);

describe("native Business Voice Profile and editable drafting", () => {
  it("makes the approved-owner voice editor reachable from Business Admin", () => {
    expect(ownerHome).toContain('id: "kinfolk-voice"');
    expect(ownerHome).toContain('label: "Business Voice & Drafts"');
    expect(ownerHome).toContain('route: "/business-owner/kinfolk-voice"');
    expect(ownerLayout).toContain('name="kinfolk-voice"');
  });

  it("uses only the approved-owner API profile and explicit owner confirmation", () => {
    expect(voiceScreen).toContain("/api/businesses/mine");
    expect(voiceScreen).toContain("/kinfolk-voice-profile");
    expect(voiceScreen).toContain("ownerConfirmed: confirmed");
    expect(voiceScreen).toContain("approved owner of a business listing");
    expect(voiceScreen).toContain("authorized business-provided inputs");
  });

  it("requests an editable-only draft and never exposes a posting action", () => {
    expect(voiceScreen).toContain("/kinfolk-drafts");
    expect(voiceScreen).toContain("ownerRequested: true");
    expect(voiceScreen).toContain("Prepare editable draft");
    expect(voiceScreen).toContain("Editable draft — owner review required");
    expect(voiceScreen).toContain("value={editableDraft}");
    expect(voiceScreen).toContain("never posts, sends, replies, or changes your business record");
    expect(voiceScreen).not.toContain("publishDraft");
    expect(voiceScreen).not.toContain("sendDraft");
  });
});
