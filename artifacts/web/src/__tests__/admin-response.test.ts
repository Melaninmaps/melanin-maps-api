import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readAdminJsonObject } from "@/lib/adminResponse";

const adminPage = () => readFileSync(
  fileURLToPath(new URL("../pages/admin.tsx", import.meta.url)),
  "utf8",
);

describe("Admin JSON response handling", () => {
  it("returns a valid successful JSON object", async () => {
    await expect(
      readAdminJsonObject(
        new Response(JSON.stringify({ businesses: [{ id: "business-1" }] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
        "Business inventory",
      ),
    ).resolves.toEqual({ businesses: [{ id: "business-1" }] });
  });

  it("surfaces a rejected API response instead of treating it as empty data", async () => {
    await expect(
      readAdminJsonObject(
        new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "content-type": "application/json" },
        }),
        "Business inventory",
      ),
    ).rejects.toThrow("Business inventory: Forbidden (HTTP 403).");
  });

  it("rejects a non-JSON successful response", async () => {
    await expect(
      readAdminJsonObject(
        new Response("upstream gateway", { status: 200 }),
        "Business inventory",
      ),
    ).rejects.toThrow("Business inventory returned an invalid response.");
  });

  it("rejects a successful JSON array when the dashboard expects an object", async () => {
    await expect(
      readAdminJsonObject(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
        "Business inventory",
      ),
    ).rejects.toThrow("Business inventory returned an invalid response.");
  });

  it("keeps confirmed inventory visible when the Business Inventory request fails", () => {
    const source = adminPage();
    expect(source).toContain('readAdminJsonObject(response, "Business inventory")');
    expect(source).toContain("The previously confirmed inventory remains visible");
    expect(source).toContain(".catch((error) => {");
  });
});
