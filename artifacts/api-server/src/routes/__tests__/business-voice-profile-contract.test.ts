import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  fileURLToPath(new URL("../business-voice-profile.ts", import.meta.url)),
  "utf8",
);
const migration = readFileSync(
  fileURLToPath(new URL("../../lib/startup-migrations.ts", import.meta.url)),
  "utf8",
);
const routerIndex = readFileSync(
  fileURLToPath(new URL("../index.ts", import.meta.url)),
  "utf8",
);

describe("Business Voice Profile ownership boundary", () => {
  it("allows profile writes only for approved owners and does not use member content", () => {
    expect(route).toContain("business_owner_links bol");
    expect(route).toContain("bol.role = 'owner'");
    expect(route).toContain("bol.status = 'approved'");
    expect(route).toContain("ownerConfirmed");
    expect(route).not.toMatch(/FROM\s+(?:community_posts|reviews)/i);
    expect(route).not.toMatch(/JOIN\s+(?:community_posts|reviews)/i);
  });

  it("registers only an additive owner-profile table and authenticated routes", () => {
    expect(migration).toContain('name: "business_kinfolk_voice_profiles_v1"');
    expect(migration).toContain("business_kinfolk_voice_profiles");
    expect(routerIndex).toContain(
      'import businessVoiceProfileRouter from "./business-voice-profile"',
    );
    expect(
      routerIndex.indexOf("router.use(businessVoiceProfileRouter)"),
    ).toBeGreaterThan(routerIndex.indexOf("router.use(requireAuth)"));
  });
});
