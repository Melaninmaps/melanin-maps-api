import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hookSource = readFileSync(
  new URL("../hooks/useKinfolk.ts", import.meta.url),
  "utf8",
);
const travelSource = readFileSync(
  new URL("../app/travel.tsx", import.meta.url),
  "utf8",
);

describe("Kinfolk life-intent source context on mobile", () => {
  it("lets a signed-in free member use welcome prompts without a subscription gate", () => {
    expect(travelSource).toContain("if (!isAuthenticated) {");
    expect(travelSource).not.toContain("if (!isAuthenticated || !subscription)");
    expect(travelSource).toContain("onChipPress={(t) => void handleSend(t)}");
  });

  it("retains the optional API field and presents it before source actions", () => {
    expect(hookSource).toContain("sourceContext?: string | null");
    expect(hookSource).toContain("sourceContext: data.sourceContext ?? null");
    expect(travelSource).toContain('testID="kinfolk-source-context"');
    expect(travelSource).toContain("Why these sources fit:");
    expect(travelSource.indexOf('testID="kinfolk-source-context"')).toBeLessThan(
      travelSource.indexOf("<Text style={[aiStyles.sourcesTitle"),
    );
  });
});
