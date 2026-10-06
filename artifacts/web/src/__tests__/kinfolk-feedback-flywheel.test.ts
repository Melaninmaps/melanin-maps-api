import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const travel = readFileSync(`${root}artifacts/web/src/pages/travel.tsx`, "utf8");
const dashboard = readFileSync(`${root}artifacts/web/src/pages/business-dashboard.tsx`, "utf8");

describe("web Kinfolk feedback flywheel", () => {
  it("keeps community need feedback explicit and revocable", () => {
    expect(travel).toContain("I need more help");
    expect(travel).toContain("Choose a broad topic to count toward a private community need");
    expect(travel).toContain("Remove feedback");
    expect(travel).toContain('method: "DELETE"');
    expect(travel).toContain("responseFeedbackNeedDrafts");
  });

  it("discloses the no-automatic-learning and five-member boundary", () => {
    expect(travel).toContain("does not automatically change Kinfolk");
    expect(travel).toContain("at least five different members");
    expect(travel).toContain("never your name, message, note, or chat transcript");
  });

  it("renders only private aggregate owner insights", () => {
    expect(dashboard).toContain("Private Kinfolk community needs");
    expect(dashboard).toContain("kinfolk-community-needs-owner-insight");
    expect(dashboard).toContain("No member identity, message, note, transcript");
  });
});
