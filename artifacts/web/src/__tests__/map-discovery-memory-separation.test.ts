import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const map = readFileSync(new URL("../pages/map.tsx", import.meta.url), "utf8");
const directory = readFileSync(new URL("../pages/businesses.tsx", import.meta.url), "utf8");
const explore = readFileSync(new URL("../pages/explore.tsx", import.meta.url), "utf8");

describe("web Map and Discovery memory separation", () => {
  it("does not load or mutate Kinfolk preferences from standalone Map or Directory", () => {
    expect(map).not.toContain("api/kinfolk/preferences");
    expect(directory).not.toContain("api/kinfolk/preferences");
  });

  it("keeps Explore ownership filtering visible, multi-select, and locally clearable", () => {
    expect(explore).toContain("const [selectedOwnership, setSelectedOwnership] = useState<string[]>([]);");
    expect(explore).toContain("previous.includes(id) ? previous.filter");
    expect(explore).toContain("setSelectedOwnership([])");
    expect(explore).toContain("selectedOwnership.every");
  });
});
