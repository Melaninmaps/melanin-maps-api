import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Private Places edit controls", () => {
  const route = source("../../routes/kinfolk-private-places.ts");
  const web = source("../../../../web/src/components/kinfolk/PrivatePlacesSettings.tsx");
  const mobile = source("../../../../mobile/app/kinfolk-private-places.tsx");

  it("keeps server-side updates owner-scoped and disclosure-gated", () => {
    expect(route).toContain('router.put("/kinfolk/private-places/:id"');
    expect(route).toContain("WHERE id = $1 AND user_id = $2");
    expect(route).toContain("Explicit Google Maps geocoding acknowledgement is required before an address can be updated.");
  });

  it("lets web and mobile update a chosen private place only after deliberate address re-entry", () => {
    for (const surface of [web, mobile]) {
      expect(surface).toContain("editingPlace");
      expect(surface).toContain('editingPlace ? "PUT" : "POST"');
      expect(surface).toContain("setExactAddress(\"\")");
      expect(surface).toContain("Update Private Place");
    }
    expect(web).toContain("It is never displayed back to the browser.");
    expect(mobile).toContain("It is never returned to this screen.");
  });

  it("does not add a route that returns an exact private address to either client", () => {
    expect(route).not.toContain('router.get("/kinfolk/private-places/:id/address"');
    expect(web).not.toContain("exactAddress: place.exactAddress");
    expect(mobile).not.toContain("exactAddress: place.exactAddress");
  });
});
