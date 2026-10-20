import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(
    new URL(
      "../features/businesses/BusinessVoiceProfileEditor.tsx",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("Business Voice editable drafting presentation", () => {
  it("requires a direct request and keeps the result editable and review-only", () => {
    expect(source).toContain("/kinfolk-drafts");
    expect(source).toContain("ownerRequested: true");
    expect(source).toContain("Prepare editable draft");
    expect(source).toContain("Editable draft — owner review required");
    expect(source).toContain("value={editableDraft}");
  });

  it("states that drafting never posts, sends, replies, or changes a business record", () => {
    expect(source).toContain("never posts, sends, replies, or changes your business record");
    expect(source).not.toContain("window.open(");
  });

  it("resets every A-owned Business Voice value before loading B", () => {
    const loadEffect = source.slice(
      source.indexOf("useEffect(() => {"),
      source.indexOf("function toggleTone"),
    );
    const loadStart = loadEffect.indexOf("async function load()");

    expect(source).toContain("const [boundBusinessId, setBoundBusinessId] = useState(businessId);");
    expect(source).toContain("const [boundBusinessEpoch, setBoundBusinessEpoch] = useState(currentBusinessEpoch);");
    expect(source).toContain("const contextReady = boundBusinessId === businessId && boundBusinessEpoch === currentBusinessEpoch;");
    expect(source).toContain("if (loading || !contextReady)");
    for (const reset of [
      "setProfile(EMPTY);",
      "setConfirmed(false);",
      "setLoading(true);",
      "setSaving(false);",
      "setMessage(null);",
      "setDraftKind(\"caption\");",
      "setDraftRequest(\"\");",
      "setDrafting(false);",
      "setEditableDraft(\"\");",
      "setDraftMessage(null);",
      "setBoundBusinessId(loadBusinessId);",
      "setBoundBusinessEpoch(loadBusinessEpoch);",
    ]) {
      expect(loadEffect.indexOf(reset)).toBeGreaterThanOrEqual(0);
      expect(loadEffect.indexOf(reset)).toBeLessThan(loadStart);
    }
    expect(source).toContain("disabled={saving || !confirmed || loading || !contextReady}");
    expect(source).toContain("disabled={drafting || !draftRequest.trim() || loading || !contextReady}");
  });

  it("binds late A load, save, and editable-draft completions to A's exact context generation", () => {
    const loadBlock = source.slice(
      source.indexOf("useEffect(() => {"),
      source.indexOf("function toggleTone"),
    );
    const saveBlock = source.slice(
      source.indexOf("async function save()"),
      source.indexOf("async function requestDraft()"),
    );
    const draftBlock = source.slice(
      source.indexOf("async function requestDraft()"),
      source.indexOf("if (loading || !contextReady)"),
    );

    expect(source).toContain("activeBusinessIdRef.current !== businessId");
    expect(source).toContain("activeBusinessEpochRef.current += 1;");
    expect(source).toContain("return activeBusinessIdRef.current === id && activeBusinessEpochRef.current === epoch;");
    expect(loadBlock).toContain("const loadBusinessId = businessId;");
    expect(loadBlock).toContain("const loadBusinessEpoch = currentBusinessEpoch;");
    expect(loadBlock).toContain("const isCurrent = () => active && isCurrentBusinessContext(loadBusinessId, loadBusinessEpoch);");
    expect(loadBlock).toContain("api/businesses/${loadBusinessId}/kinfolk-voice-profile");
    expect(saveBlock).toContain("const saveBusinessId = businessId;");
    expect(saveBlock).toContain("const saveBusinessEpoch = currentBusinessEpoch;");
    expect(saveBlock).toContain("api/businesses/${saveBusinessId}/kinfolk-voice-profile");
    expect(saveBlock.match(/isCurrentBusinessContext\(saveBusinessId, saveBusinessEpoch\)/g)).toHaveLength(3);
    expect(draftBlock).toContain("const draftBusinessId = businessId;");
    expect(draftBlock).toContain("const draftBusinessEpoch = currentBusinessEpoch;");
    expect(draftBlock).toContain("api/businesses/${draftBusinessId}/kinfolk-drafts");
    expect(draftBlock.match(/isCurrentBusinessContext\(draftBusinessId, draftBusinessEpoch\)/g)).toHaveLength(3);
  });
});
