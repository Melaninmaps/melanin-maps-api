import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const marketplaceSource = readFileSync(
  fileURLToPath(new URL("../pages/marketplace.tsx", import.meta.url)),
  "utf8",
);

const listingSchemaSource = readFileSync(
  fileURLToPath(
    new URL("../../../../lib/db/src/schema/community-listings.ts", import.meta.url),
  ),
  "utf8",
);

const acceptedConditions = ["new", "like_new", "good", "fair"] as const;

describe("Marketplace listing condition contract", () => {
  it("submits the existing database enum tokens while retaining readable labels", () => {
    expect(marketplaceSource).toContain("const [newCondition, setNewCondition] = useState(\"good\")");
    expect(marketplaceSource).toContain(
      "condition: newCondition, city: newCity.trim() || null",
    );
    expect(marketplaceSource).toContain(
      "CONDITIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)",
    );
    expect(marketplaceSource).toContain(
      "formatConditionLabel(selected.condition)",
    );

    for (const condition of acceptedConditions) {
      expect(listingSchemaSource).toContain(`"${condition}"`);
      expect(marketplaceSource).toContain(`value: "${condition}"`);
    }
  });

  it("does not use title-cased labels as submitted enum values", () => {
    expect(marketplaceSource).not.toContain(
      'const CONDITIONS = ["New", "Like New", "Good", "Fair"]',
    );
  });
});
