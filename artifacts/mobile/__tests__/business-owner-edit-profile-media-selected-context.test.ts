import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../app/business-owner/edit-profile.tsx", import.meta.url),
  "utf8",
);

function handlerSlice(start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("business-owner edit profile selected photo context", () => {
  it("derives selected photo endpoints only from the managed business id and retains the legacy fallback", () => {
    expect(source).toContain(
      'const photoPath = managedBusinessId\n    ? `/api/businesses/mine/managed/${encodeURIComponent(managedBusinessId)}/photos`\n    : "/api/businesses/mine/photos";',
    );
    expect(source).toContain(
      "const managedBusinessId = typeof selectedBusinessId",
    );
    expect(source).toContain("encodeURIComponent(managedBusinessId)");
  });

  it("uses the selected photo route for upload and updates local gallery state only after a successful response", () => {
    const upload = handlerSlice(
      "  const handleAddPhoto = async () => {",
      "\n  const handleSetCover",
    );

    expect(upload).toContain("fetch(`${getApiBase()}${photoPath}`, {");
    expect(upload).toContain('method: "POST"');
    expect(upload).not.toContain(
      "fetch(`${getApiBase()}/api/businesses/mine/photos`",
    );
    expect(upload.indexOf("if (!res.ok)")).toBeLessThan(
      upload.indexOf("setPhotos("),
    );
    expect(upload.indexOf("if (!res.ok)")).toBeLessThan(
      upload.indexOf("setPendingPhotos("),
    );
    expect(upload.indexOf("if (!res.ok)")).toBeLessThan(
      upload.indexOf("setCoverUrl("),
    );
    expect(upload).toContain("finally { setUploadingPhoto(false); }");
  });

  it("uses the selected cover route and never changes the local cover after a failed request", () => {
    const cover = handlerSlice(
      "  const handleSetCover = async",
      "\n  const handleDeletePhoto",
    );

    expect(cover).toContain("fetch(`${getApiBase()}${photoPath}/cover`");
    expect(cover).toContain('method: "PATCH"');
    expect(cover).not.toContain(
      "fetch(`${getApiBase()}/api/businesses/mine/photos/cover`",
    );
    expect(cover.indexOf("if (!res.ok)")).toBeLessThan(
      cover.indexOf("setCoverUrl(url)"),
    );
    expect(cover).toContain(
      'Alert.alert("Cover photo not changed", "Please try again.")',
    );
  });

  it("uses the selected delete route and retains gallery state on failed deletion", () => {
    const deletion = handlerSlice(
      "  const handleDeletePhoto =",
      "\n  // ── Videos",
    );

    expect(deletion).toContain("fetch(`${getApiBase()}${photoPath}`, {");
    expect(deletion).toContain('method: "DELETE"');
    expect(deletion).not.toContain(
      "fetch(`${getApiBase()}/api/businesses/mine/photos`",
    );
    expect(deletion.indexOf("if (!res.ok)")).toBeLessThan(
      deletion.indexOf("setPhotos(d.photos)"),
    );
    expect(deletion.indexOf("if (!res.ok)")).toBeLessThan(
      deletion.indexOf("setCoverUrl(d.imageUrl)"),
    );
    expect(deletion).toContain(
      'Alert.alert("Photo not removed", "Please try again.")',
    );
  });

  it("does not alter video, profile, or schedule endpoints while repairing selected photo context", () => {
    expect(source).toContain("/api/businesses/mine/videos/link");
    expect(source).toContain("/api/businesses/mine/weekly-schedule");
    expect(source).toContain(
      "`/api/businesses/mine/managed/${encodeURIComponent(managedBusinessId)}/profile`",
    );
  });
});
