import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const editProfile = readFileSync(
  new URL("../app/business-owner/edit-profile.tsx", import.meta.url),
  "utf8",
);

const saveBlock = editProfile.slice(
  editProfile.indexOf("const handleSave = async"),
  editProfile.indexOf("// ── Intro video"),
);
const selectedProfilePath =
  "/api/businesses/mine/managed/${encodeURIComponent(managedBusinessId)}/profile";
const legacyProfilePath = '"/api/businesses/mine/profile"';
const nonOkFailure = 'if (!res.ok) throw new Error("Save failed");';
const selectedResponseStart =
  "if (managedBusinessId) {\n        const { business: updated } = await res.json()";

describe("native selected Business Profile successive-save revision refresh", () => {
  it("parses the selected managed PATCH response and adopts its canonical revision before success state", () => {
    const failureIndex = saveBlock.indexOf(nonOkFailure);
    const responseIndex = saveBlock.indexOf(selectedResponseStart);
    const refreshIndex = saveBlock.indexOf(
      "setExpectedUpdatedAt(updated.updatedAt);",
    );
    const profileSavedIndex = saveBlock.indexOf("profileSaved = true;");
    const originalIndex = saveBlock.indexOf("setOriginal({ ...form });");
    const selectedResponseBlock = saveBlock.slice(
      responseIndex,
      profileSavedIndex,
    );

    expect(responseIndex).toBeGreaterThan(failureIndex);
    expect(selectedResponseBlock).toContain(
      "business: { updatedAt?: string | null } | null;",
    );
    expect(selectedResponseBlock).toContain(
      'if (!updated || typeof updated.updatedAt !== "string" || !updated.updatedAt)',
    );
    expect(refreshIndex).toBeGreaterThan(responseIndex);
    expect(refreshIndex).toBeLessThan(profileSavedIndex);
    expect(profileSavedIndex).toBeLessThan(originalIndex);
  });

  it("retains the selected PATCH revision payload so the next selected save uses the refreshed state", () => {
    const profileRequest = saveBlock.slice(
      saveBlock.indexOf("const profilePath"),
      saveBlock.indexOf(nonOkFailure),
    );
    const revisionPayload = profileRequest.slice(
      profileRequest.indexOf("body: JSON.stringify({"),
      profileRequest.indexOf("}),\n      });"),
    );

    expect(profileRequest).toContain(selectedProfilePath);
    expect(revisionPayload).toContain(
      "...(managedBusinessId ? { expectedUpdatedAt } : {}),",
    );
    expect(revisionPayload.indexOf("expectedUpdatedAt")).toBeLessThan(
      revisionPayload.indexOf("name: form.name.trim()"),
    );
    expect(saveBlock).toContain("setExpectedUpdatedAt(updated.updatedAt);");
  });

  it("keeps legacy profile saves free of selected response revision behavior", () => {
    const profilePathBlock = saveBlock.slice(
      saveBlock.indexOf("const profilePath"),
      saveBlock.indexOf(nonOkFailure),
    );
    const selectedResponseBlock = saveBlock.slice(
      saveBlock.indexOf(selectedResponseStart),
      saveBlock.indexOf("profileSaved = true;"),
    );

    expect(profilePathBlock).toContain(legacyProfilePath);
    expect(selectedResponseBlock.indexOf("if (managedBusinessId) {")).toBe(0);
    expect(selectedResponseBlock).toContain("await res.json()");
    expect(
      saveBlock.slice(0, saveBlock.indexOf(selectedResponseStart)),
    ).not.toContain("updated.updatedAt");
  });

  it("preserves non-OK and malformed selected-response failure before success, draft baseline, or navigation", () => {
    const failureIndex = saveBlock.indexOf(nonOkFailure);
    const responseIndex = saveBlock.indexOf(selectedResponseStart);
    const profileSavedIndex = saveBlock.indexOf("profileSaved = true;");
    const successBlock = saveBlock.slice(
      profileSavedIndex,
      saveBlock.indexOf("catch (error)"),
    );
    const catchBlock = saveBlock.slice(
      saveBlock.indexOf("catch (error)"),
      saveBlock.indexOf("finally { setSaving(false); }"),
    );

    expect(failureIndex).toBeGreaterThan(-1);
    expect(responseIndex).toBeGreaterThan(failureIndex);
    expect(profileSavedIndex).toBeGreaterThan(responseIndex);
    expect(successBlock).toContain("setOriginal({ ...form });");
    expect(successBlock).toContain("router.back()");
    expect(successBlock).toContain("router.replace(");
    expect(catchBlock).not.toContain("setOriginal(");
    expect(catchBlock).not.toContain("router.");
  });
});
