import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk client request trace wiring", () => {
  it("logs only the validated opaque trace when a chat request reaches the API", () => {
    expect(route).toContain('parseKinfolkClientTrace(req.get("x-kinfolk-client-trace"))');
    expect(route).toContain('{ route: "kinfolk.chat", clientTrace }');
    expect(route).toContain('"kinfolk client request received"');
  });
});
