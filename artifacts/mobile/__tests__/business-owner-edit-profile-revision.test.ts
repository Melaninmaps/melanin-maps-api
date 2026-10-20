import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const editProfile = readFileSync(
  new URL("../app/business-owner/edit-profile.tsx", import.meta.url),
  "utf8",
);

const loadBlock = editProfile.slice(
  editProfile.indexOf("const load = useCallback"),
  editProfile.indexOf("const isDirty"),
);
const saveBlock = editProfile.slice(
  editProfile.indexOf("const handleSave = async"),
  editProfile.indexOf("// ── Intro video"),
);

describe("native selected Business Profile revision propagation", () => {
  it("retains the canonical updatedAt returned by the selected managed-business read", () => {
    expect(editProfile).toContain("updatedAt?: string | null");
    expect(editProfile).toContain(
      "const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(null);",
    );
    expect(loadBlock).toContain(
      "/api/businesses/mine/managed/${encodeURIComponent(managedBusinessId)}",
    );
    expect(loadBlock).toContain(
      "setExpectedUpdatedAt(managedBusinessId ? b.updatedAt ?? null : null);",
    );
  });

  it("sends the retained revision only with the selected canonical profile PATCH", () => {
    const profileRequest = saveBlock.slice(
      saveBlock.indexOf("const profilePath"),
      saveBlock.indexOf("if (!res.ok)"),
    );
    const revisionPayload = profileRequest.slice(
      profileRequest.indexOf("body: JSON.stringify({"),
      profileRequest.indexOf("}),\n      });"),
    );

    expect(profileRequest).toContain(
      "/api/businesses/mine/managed/${encodeURIComponent(managedBusinessId)}/profile",
    );
    expect(profileRequest).toContain('method: "PATCH", headers');
    expect(revisionPayload).toContain(
      "...(managedBusinessId ? { expectedUpdatedAt } : {}),",
    );
    expect(revisionPayload.indexOf("expectedUpdatedAt")).toBeLessThan(
      revisionPayload.indexOf("name: form.name.trim()"),
    );
    expect(profileRequest).toContain(
      ': "/api/businesses/mine/profile";',
    );
  });

  it("treats every non-OK response, including stale-write 409, as failure before success or navigation", () => {
    const responseFailure = 'if (!res.ok) throw new Error("Save failed");';
    const failureIndex = saveBlock.indexOf(responseFailure);
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
    expect(profileSavedIndex).toBeGreaterThan(failureIndex);
    expect(successBlock).toContain("setOriginal({ ...form });");
    expect(successBlock).toContain("Haptics.notificationAsync");
    expect(successBlock).toContain("router.back()");
    expect(successBlock).toContain("router.replace(");
    expect(catchBlock).toContain('profileSaved ? "Profile saved; address not changed" : "Save failed"');
    expect(catchBlock).not.toContain("setOriginal(");
    expect(catchBlock).not.toContain("Haptics.notificationAsync");
    expect(catchBlock).not.toContain("router.");
  });
});
