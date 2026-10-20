import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  fileURLToPath(new URL("../businesses.ts", import.meta.url)),
  "utf8",
);

function routeSection(start: string, end: string): string {
  const startIndex = route.indexOf(start);
  const endIndex = route.indexOf(end, startIndex + start.length);
  expect(startIndex, `missing route ${start}`).toBeGreaterThan(-1);
  expect(endIndex, `missing route boundary after ${start}`).toBeGreaterThan(
    startIndex,
  );
  return route.slice(startIndex, endIndex);
}

const selectedExternalVideoAdd = routeSection(
  'router.post("/businesses/mine/managed/:businessId/videos/link"',
  'router.delete("/businesses/mine/managed/:businessId/videos"',
);
const selectedExternalVideoDelete = routeSection(
  'router.delete("/businesses/mine/managed/:businessId/videos"',
  "const introVideoUpload",
);
const selectedIntroVideoUpload = routeSection(
  '"/businesses/mine/managed/:businessId/intro-video",',
  'router.delete(\n  "/businesses/mine/managed/:businessId/intro-video",',
);
const selectedIntroVideoDelete = routeSection(
  'router.delete(\n  "/businesses/mine/managed/:businessId/intro-video",',
  "const featuredVideoUpload",
);
const selectedWeeklySchedule = routeSection(
  '"/businesses/mine/managed/:businessId/weekly-schedule",',
  'router.get("/businesses/:id"',
);

const selectedActions = [
  selectedExternalVideoAdd,
  selectedExternalVideoDelete,
  selectedIntroVideoUpload,
  selectedIntroVideoDelete,
  selectedWeeklySchedule,
];

describe("selected business owner auxiliary media and schedule authority", () => {
  it("retains every legacy endpoint and adds only the five selected managed-business variants", () => {
    for (const legacyPath of [
      '"/businesses/mine/videos/link"',
      '"/businesses/mine/videos"',
      '"/businesses/mine/intro-video"',
      '"/businesses/mine/weekly-schedule"',
    ]) {
      expect(route).toContain(legacyPath);
    }
    for (const selectedPath of [
      '"/businesses/mine/managed/:businessId/videos/link"',
      '"/businesses/mine/managed/:businessId/videos"',
      '"/businesses/mine/managed/:businessId/intro-video"',
      '"/businesses/mine/managed/:businessId/weekly-schedule"',
    ]) {
      expect(route).toContain(selectedPath);
    }
  });

  it("uses the existing approved, owner-role, unrevoked predicate for every selected read and write", () => {
    const predicateStart = route.indexOf("function approvedOwnerPredicate");
    const predicateEnd = route.indexOf(
      "type LegacyManagedBusinessSelection",
      predicateStart,
    );
    const predicate = route.slice(predicateStart, predicateEnd);
    expect(predicate).toContain("bol.role = 'owner'");
    expect(predicate).toContain("bol.status = 'approved'");
    expect(predicate).toContain("bol.revoked_at IS NULL");

    for (const action of selectedActions) {
      expect(action).toContain(
        'const businessId = typeof req.params.businessId === "string" ? req.params.businessId.trim() : "";',
      );
      expect(action).toContain("if (!businessId)");
      expect(action).toContain("approvedOwnerPredicate(String(userId))");
      expect(action).toContain("eq(businessesTable.id, businessId)");
      expect(action).not.toContain("resolveLegacySingleManagedBusiness");
    }
    for (const mutatingAction of [
      selectedExternalVideoAdd,
      selectedExternalVideoDelete,
      selectedIntroVideoUpload,
      selectedIntroVideoDelete,
      selectedWeeklySchedule,
    ]) {
      expect(mutatingAction).toMatch(
        /\.where\(and\(\s*eq\(businessesTable\.id, business\.id\),\s*approvedOwnerPredicate\(String\(userId\)\),/s,
      );
    }
  });

  it("fails closed for anonymous, malformed, outsider, and revoked selected contexts before a selected effect", () => {
    for (const action of selectedActions) {
      expect(action).toContain("if (!userId)");
      expect(action).toContain(
        'res.status(401).json({ error: "Unauthorized" })',
      );
      expect(action).toContain("if (!businessId)");
      expect(action).toContain(
        'res.status(404).json({ error: "Managed business not found." })',
      );
      expect(action).toContain("if (!business)");
    }
  });

  it("authorizes selected intro uploads before storage, rechecks the attachment write, and cleans up an orphaned upload", () => {
    expect(
      selectedIntroVideoUpload.indexOf(
        "approvedOwnerPredicate(String(userId))",
      ),
    ).toBeLessThan(
      selectedIntroVideoUpload.indexOf("objectStorageClient.bucket"),
    );
    expect(selectedIntroVideoUpload).toContain(
      "await file.save(req.file.buffer",
    );
    expect(selectedIntroVideoUpload).toContain(
      "const objectKey = `businesses/${business.id}/intro-video-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;",
    );
    expect(selectedIntroVideoUpload).toContain(
      'const safeExt = /^[a-z0-9]{1,10}$/.test(ext) ? ext : "mp4";',
    );
    expect(selectedIntroVideoUpload).toContain(
      "void file.delete().catch(() => {});",
    );
    expect(selectedIntroVideoUpload).toContain("throw err;");
    expect(selectedIntroVideoUpload).toMatch(
      /\.update\(businessesTable\)[\s\S]*?\.where\(and\([\s\S]*?approvedOwnerPredicate\(String\(userId\)\)/,
    );
  });

  it("removes only a selected business intro key after the guarded database detachment succeeds", () => {
    expect(
      selectedIntroVideoDelete.indexOf(".update(businessesTable)"),
    ).toBeLessThan(selectedIntroVideoDelete.indexOf("objectStorageClient"));
    expect(selectedIntroVideoDelete).toContain(
      ".returning({ id: businessesTable.id })",
    );
    expect(selectedIntroVideoDelete).toContain("if (!updated)");
    expect(selectedIntroVideoDelete).toContain(
      "const selectedIntroVideoPrefix = `businesses/${business.id}/intro-video-`;",
    );
    expect(selectedIntroVideoDelete).toContain(
      "const legacySelectedIntroVideoPrefix = `businesses/${business.id}/intro-video.`;",
    );
    expect(selectedIntroVideoDelete).toContain(
      "business.introVideoUrl.startsWith",
    );
    expect(selectedIntroVideoDelete).not.toContain(
      "business.introVideoUrl?.includes(`storage.googleapis.com/${bucketId}/`)",
    );
  });

  it("preserves the established validation and response shapes for selected external videos and schedules", () => {
    expect(selectedExternalVideoAdd).toContain("Maximum of 5 videos allowed");
    expect(selectedExternalVideoAdd).toContain("This link is already added");
    expect(selectedExternalVideoAdd).toContain(
      "res.status(201).json({ url: url.trim(), videos: updated.videos })",
    );
    expect(selectedExternalVideoDelete).toContain(
      "res.json({ videos: updated.videos })",
    );
    expect(selectedWeeklySchedule).toContain(
      "weeklySchedule: updated.weeklySchedule",
    );
    expect(selectedWeeklySchedule).toContain(
      "showAvailability: updated.showAvailability",
    );
  });
});
