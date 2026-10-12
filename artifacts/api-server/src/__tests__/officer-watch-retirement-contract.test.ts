import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

const routesIndex = source("../routes/index.ts");
const pushNotifications = source("../lib/pushNotifications.ts");

describe("retired officer-tracking boundary", () => {
  it("does not mount individual officer tracking or transfer alerts", () => {
    expect(routesIndex).not.toContain('import officerWatchRouter from "./officer-watch"');
    expect(routesIndex).not.toContain("router.use(officerWatchRouter)");
    expect(pushNotifications).not.toContain("sendPushToUsersInArea");
    expect(pushNotifications).not.toContain("Officer watch area alert");
  });
});
