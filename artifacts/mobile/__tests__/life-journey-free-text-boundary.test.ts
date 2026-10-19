import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lifeJourneySource = readFileSync(
  decodeURIComponent(new URL("../app/life-journey.tsx", import.meta.url).pathname),
  "utf8",
);

function createJourneySource(): string {
  const start = lifeJourneySource.indexOf("const createJourney = async () => {");
  const end = lifeJourneySource.indexOf("const hasExplored", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return lifeJourneySource.slice(start, end);
}

describe("Life Journey legacy free-text boundary", () => {
  it("omits the legacy description key from every normal Journey creation payload", () => {
    const createJourney = createJourneySource();

    expect(createJourney).toContain('fetch(`${apiBase}/api/journeys`, {');
    expect(createJourney).toContain("journeyType: selectedType,");
    expect(createJourney).toContain("city: city.trim(),");
    expect(createJourney).toContain("state: state.trim(),");
    expect(createJourney).toContain(
      'selectedNeeds: selectedNeeds.length > 0 ? selectedNeeds.join(", ") : undefined,',
    );
    expect(createJourney).not.toContain("description:");
    expect(createJourney).not.toContain("description.trim()");
  });

  it("removes unsupported free-text collection rather than silently discarding a member entry", () => {
    expect(lifeJourneySource).not.toContain(
      "const [description, setDescription] = useState(\"\");",
    );
    expect(lifeJourneySource).not.toContain("Anything else KinfolkAI™ should know?");
    expect(lifeJourneySource).not.toContain("onChangeText={setDescription}");
    expect(lifeJourneySource).toContain(
      "Private details are not collected here yet. Choose the help areas above. / Aún no recopilamos detalles privados aquí. Elige las áreas de ayuda de arriba.",
    );
  });
});
