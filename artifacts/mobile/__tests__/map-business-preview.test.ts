import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const mapViewSource = readFileSync(
  fileURLToPath(new URL("../components/FullMapView.tsx", import.meta.url)),
  "utf8",
);
const pinHookSource = readFileSync(
  fileURLToPath(new URL("../hooks/useCanonicalMapPins.ts", import.meta.url)),
  "utf8",
);

describe("native map business preview", () => {
  it("opens the selected business preview from a pin and provides a direct profile action", () => {
    expect(mapViewSource).toContain("setSelectedBusiness(biz);");
    expect(mapViewSource).toContain('pathname: "/business/[id]"');
    expect(mapViewSource).toContain("View Business");
    expect(mapViewSource).toContain("Directions");
  });

  it("shows canonical category, location, and available public contact links", () => {
    expect(mapViewSource).toContain("selectedBusiness.subcategory");
    expect(mapViewSource).toContain("selectedBusiness.city");
    expect(mapViewSource).toContain("selectedBusiness.website");
    expect(mapViewSource).toContain("selectedBusiness.instagram");
    expect(mapViewSource).toContain("Open ${contact.label} for ${selectedBusiness.name}");
    expect(pinHookSource).toContain("website: typeof pin.website === \"string\"");
    expect(pinHookSource).toContain("instagram: typeof pin.instagram === \"string\"");
    expect(pinHookSource).toContain("facebook: typeof pin.facebook === \"string\"");
    expect(pinHookSource).toContain("tiktok: typeof pin.tiktok === \"string\"");
  });
});
