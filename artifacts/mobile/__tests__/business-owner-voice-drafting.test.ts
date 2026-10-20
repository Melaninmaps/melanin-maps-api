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

  it("uses selected managed-business context before every approved-owner Voice request", () => {
    expect(voiceScreen).toContain("/api/businesses/mine/managed");
    expect(voiceScreen).not.toContain("`${base}/api/businesses/mine`,");
    expect(voiceScreen).toContain("/kinfolk-voice-profile");
    expect(voiceScreen).toContain("encodeURIComponent(selectedBusiness.id)");
    expect(voiceScreen.match(/encodeURIComponent\(businessId\)/g)).toHaveLength(2);
    expect(voiceScreen).toContain("ownerConfirmed: confirmed");
    expect(voiceScreen).toContain("approved owner of a business listing");
    expect(voiceScreen).toContain("authorized business-provided inputs");
  });

  it("requires an explicit local choice for multi-business owners and never auto-selects the first", () => {
    const multipleBranch = voiceScreen.indexOf("if (businesses.length > 1)");
    const singleBusinessProfileLoad = voiceScreen.indexOf(
      "await loadVoiceProfile(businesses[0], base, headers, epoch)",
    );

    expect(multipleBranch).toBeGreaterThan(-1);
    expect(singleBusinessProfileLoad).toBeGreaterThan(multipleBranch);
    expect(voiceScreen).toContain("business-voice-managed-business-selector");
    expect(voiceScreen).toContain("Choose a business before opening Business Voice Profile.");
    expect(voiceScreen).toContain("onPress={() => void selectManagedBusiness(business)}");
    expect(voiceScreen).toContain("await loadVoiceProfile(selectedBusiness, base, headers, epoch)");
  });

  it("clears stale selection, profile, and draft context before reload or a managed-business error", () => {
    expect(voiceScreen).toContain("const requestEpoch = useRef(0)");
    expect(voiceScreen).toContain("const clearSelectedBusinessContext = useCallback");
    expect(voiceScreen).toContain("setBusinessId(null)");
    expect(voiceScreen).toContain("setBusinessName(null)");
    expect(voiceScreen).toContain("setProfile(EMPTY_PROFILE)");
    expect(voiceScreen).toContain("setEditableDraft(\"\")");
    expect(voiceScreen).toContain("setManagedBusinesses([])");
    expect(voiceScreen).toContain("if (epoch !== requestEpoch.current) return");
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
