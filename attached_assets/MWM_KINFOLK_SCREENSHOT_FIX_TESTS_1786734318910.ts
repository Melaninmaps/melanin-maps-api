import { strict as assert } from "node:assert";
import { classifyKinfolkRequest } from "./MWM_KINFOLK_BRUNCH_INTENT_PATCH";
import { validateVoiceRecording, voiceErrorForStatus } from "./MWM_KINFOLK_VOICE_PATCH";

const cases = [
  ["Brunch in DC", "business_discovery", "brunch", "DC"],
  ["Heading to DC for the weekend, any brunch spots?", "business_discovery", "brunch", "DC"],
  ["After early church service, where can we brunch in Atlanta?", "business_discovery", "brunch", "Atlanta"],
  ["Any Black-owned brunch spots in Washington DC?", "business_discovery", "brunch", "Washington DC"],
] as const;

for (const [input, route, kind, location] of cases) {
  const result = classifyKinfolkRequest(input);
  assert.equal(result.route, route, input);
  assert.equal(result.discoveryKind, kind, input);
  assert.equal(result.location, location, input);
}

const missingLocation = classifyKinfolkRequest("Brunch spots?");
assert.equal(missingLocation.route, "clarification");
assert.equal(missingLocation.discoveryKind, "brunch");
assert.match(missingLocation.clarification ?? "", /city|neighborhood/i);

const popCultureMustRemainGeneral = classifyKinfolkRequest("Tell me about brunch as a cultural tradition");
assert.equal(popCultureMustRemainGeneral.route, "general_knowledge");

const elevenSeconds = validateVoiceRecording({ durationSeconds: 11, base64Audio: "A".repeat(1000) });
assert.equal(elevenSeconds.ok, true);

const justUnderLimit = validateVoiceRecording({ durationSeconds: 59.9, base64Audio: "A".repeat(1000) });
assert.equal(justUnderLimit.ok, true);

const overLimit = validateVoiceRecording({ durationSeconds: 60.1, base64Audio: "A".repeat(1000) });
assert.equal(overLimit.ok, false);
if (!overLimit.ok) assert.equal(overLimit.code, "VOICE_CLIP_TOO_LONG");

assert.match(voiceErrorForStatus(503), /type your question/i);
assert.match(voiceErrorForStatus(413), /too large/i);

console.log(JSON.stringify({
  result: "PASS",
  brunchRoutes: cases.length,
  clarification: true,
  diasporaContextCase: true,
  voice11SecondsAccepted: true,
  voice60SecondsRejected: true,
  safeTimeoutMessage: true,
}, null, 2));
