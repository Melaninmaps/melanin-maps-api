import { strict as assert } from "node:assert";
import {
  validatePromotionCandidates,
  enforceEducationalSources,
  safetyEnvelope,
  buildFlywheelEvent,
} from "./MWM_KINFOLK_FOUR_PURPOSE_PATCH";

const catalog = [{
  id: "canonical-1",
  name: "Verified Community Cafe",
  category: "Restaurant",
  city: "Washington DC",
  verified: true,
  evidence: [{ sourceProvider: "google-places", sourceRecordId: "place-1", sourceUrl: "https://maps.google.com/?place_id=place-1" }],
}];

const accepted = validatePromotionCandidates(
  [{ id: "canonical-1", name: "Verified Community Cafe", city: "Washington DC" }],
  catalog,
);
assert.equal(accepted.businesses.length, 1);
assert.equal(accepted.rejected, 0);

const fabricated = validatePromotionCandidates(
  [{ name: "Fictional Cafe", city: "Washington DC", website: "https://fiction.invalid" }],
  catalog,
);
assert.equal(fabricated.businesses.length, 0);
assert.equal(fabricated.rejected, 1);

const grounded = enforceEducationalSources({
  reply: "A source-backed Library answer.",
  modelRecommendations: [],
  catalog,
  sources: [{ id: "lib-1", title: "Library topic", url: "https://example.org/library-topic", label: "library" }],
  libraryAction: { type: "open_library", topicId: "topic-1" },
  intentClass: "education_discovery",
});
assert.equal(grounded.educationalStatus, "grounded");
assert.equal(grounded.sources.length, 1);

const limited = enforceEducationalSources({
  reply: "An answer without a source.",
  modelRecommendations: [],
  catalog,
  sources: [],
  libraryAction: { type: "open_library", topicId: "topic-1" },
  intentClass: "education_discovery",
});
assert.equal(limited.educationalStatus, "limited");
assert.match(limited.reply, /verified source/i);

assert.match(safetyEnvelope("safety_emergency", [] ) ?? "", /official local authorities/i);
assert.match(safetyEnvelope("safety_emergency", [{ id: "s1", title: "Official alert", url: "https://example.gov/alert", label: "official_safety" }]) ?? "", /official local authorities/i);

const e = buildFlywheelEvent({
  userId: "tester-1",
  eventType: "kinfolk_query",
  canonicalSubject: "  Brunch in DC ",
  sourceSurface: "kinfolk_chat",
  sensitive: false,
});
assert.equal(e.canonicalSubject, "brunch in dc");
assert.equal(e.learningEligible, true);
assert.equal(e.eventDay.length, 10);

console.log(JSON.stringify({
  result: "PASS",
  promotionRejectsFabrication: true,
  educationRequiresEvidence: true,
  safetyEnvelopePresent: true,
  flywheelEventNormalized: true,
}, null, 2));
