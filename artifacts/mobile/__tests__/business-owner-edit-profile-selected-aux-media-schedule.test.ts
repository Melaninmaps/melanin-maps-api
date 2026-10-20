import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const editor = readFileSync(
  new URL("../app/business-owner/edit-profile.tsx", import.meta.url),
  "utf8",
);

describe("native selected business profile auxiliary media and schedule context", () => {
  it("treats route business IDs as selected context only when they are a single nonblank value", () => {
    expect(editor).toContain("useLocalSearchParams<{ businessId?: string | string[] }>()");
    expect(editor).toContain("const isSelectedBusinessMode = selectedBusinessId !== undefined");
    expect(editor).toContain("const hasMalformedSelectedBusinessId");
    expect(editor).toContain("Array.isArray(selectedBusinessId)");
    expect(editor).toContain("Choose a business in Business Admin before editing its profile.");
  });

  it("clears selected profile, media, prompt, schedule, and operation state before each selected reload or invalidation", () => {
    expect(editor).toContain("const clearSelectedBusinessContext = useCallback");
    for (const reset of [
      "setBusinessId(null)",
      "setPhotos([])",
      "setVideos([])",
      "setAddLinkText(\"\")",
      "setIntroVideoUrl(null)",
      "setWeeklySchedule({})",
      "setSaving(false)",
      "setUploadingIntroVideo(false)",
      "setAddingLink(false)",
      "setSavingSchedule(false)",
    ]) {
      expect(editor).toContain(reset);
    }
    expect(editor).toContain("const invalidateSelectedBusinessContext = useCallback");
    expect(editor).toContain("requestEpoch.current += 1");
    expect(editor).toContain("Selected business unavailable");
    expect(editor).toContain('testID="business-owner-edit-profile-context-retry"');
  });

  it("requires the selected profile read to return the exact requested business before enabling selected controls", () => {
    expect(editor).toContain("/api/businesses/mine/managed/${encodeURIComponent(managedBusinessId)}");
    expect(editor).toContain("if (!res.ok) throw new Error(\"Selected business could not be loaded.\")");
    expect(editor).toContain("b.id !== managedBusinessId");
    expect(editor).toContain("activeManagedBusinessId.current !== managedBusinessId");
    expect(editor).toContain("if (isSelectedBusinessMode && selectedContextError)");
  });

  it("binds every selected auxiliary mutation to the explicit managed business ID while retaining legacy paths", () => {
    expect(editor).toContain("const selectedAuxiliaryPath");
    for (const suffix of ["intro-video", "videos/link", "videos", "weekly-schedule"]) {
      expect(editor).toContain(`selectedAuxiliaryPath(selectedId, \"${suffix}\"`);
    }
    expect(editor).toContain('"/api/businesses/mine/intro-video"');
    expect(editor).toContain('"/api/businesses/mine/videos/link"');
    expect(editor).toContain('"/api/businesses/mine/videos"');
    expect(editor).toContain('"/api/businesses/mine/weekly-schedule"');
    expect(editor).toContain("businessId !== managedBusinessId");
  });

  it("fences late selected responses and avoids false selected success on malformed or non-OK effects", () => {
    expect(editor).toContain("const selectedAuxiliaryRequestIsCurrent");
    expect(editor).toContain("epoch === requestEpoch.current");
    expect(editor).toContain("activeManagedBusinessId.current === selectedId");
    expect(editor).toContain("if (!res.ok && selectedId) throw new Error(\"Delete failed\")");
    expect(editor).toContain("if (data.ok !== true) throw new Error(\"Delete failed\")");
    expect(editor).toContain("if (selectedId && !data.introVideoUrl.trim()) throw new Error(\"Upload failed\")");
    expect(editor).toContain("data.showAvailability !== showAvailability");
    expect(editor).toContain("!data.videos.includes(url)");
    expect(editor).toContain("data.videos.includes(url)");
    expect(editor).toContain("invalidateSelectedBusinessContext(\"We couldn't confirm the selected business.");
  });

  it("keeps the legacy external-video deletion branch intact and confines stronger confirmation to selected context", () => {
    expect(editor).toContain("if (!selectedId) {");
    expect(editor).toContain("if (res.ok) {");
    expect(editor).toContain("if (Array.isArray(data.videos) && selectedAuxiliaryRequestIsCurrent(selectedId, epoch)) setVideos(data.videos);");
    expect(editor).toContain("if (!Array.isArray(data.videos) || data.videos.includes(url)) throw new Error(\"Delete failed\")");
  });

  it("keeps media and schedule controls hidden by the selected-context recovery state", () => {
    const recoveryStart = editor.indexOf("Selected business unavailable");
    const normalEditorStart = editor.indexOf("<ScrollView", recoveryStart);
    expect(recoveryStart).toBeGreaterThan(-1);
    expect(normalEditorStart).toBeGreaterThan(recoveryStart);
    const recovery = editor.slice(recoveryStart, normalEditorStart);
    expect(recovery).not.toContain("Upload owner intro");
    expect(recovery).not.toContain("Save schedule");
    expect(recovery).not.toContain("Add video link");
  });
});
