import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const source = (relative: string) => readFileSync(`${root}/${relative}`, "utf8");

describe("optional official alert preferences", () => {
  it("keeps the same opt-in controls on web and mobile", () => {
    const web = source("artifacts/web/src/pages/notifications.tsx");
    const mobile = source("artifacts/mobile/app/notifications-settings.tsx");

    for (const field of ["notifProductRecalls", "notifPublicHealthAlerts"]) {
      expect(web).toContain(field);
      expect(mobile).toContain(field);
    }
    expect(web).toContain("Open official source");
    expect(web).toContain("not medical advice");
    expect(mobile).toContain("Optional official notices");
  });
});
