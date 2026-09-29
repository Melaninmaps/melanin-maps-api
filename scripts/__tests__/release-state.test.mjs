import assert from "node:assert/strict";
import test from "node:test";
import {
  STAGES,
  appendTransition,
  createCandidateEvidence,
  validateEvidence,
} from "../release-state.mjs";

const SHA = "a".repeat(40);
const TREE = "b".repeat(40);
const AT = "2026-09-29T22:00:00.000Z";

function stageEvidence(stage) {
  const common = { sourceSha: SHA };
  switch (stage) {
    case "AUTOMATED_TESTED":
      return { ...common, ciRunUrl: "https://ci.example.test/runs/123", commandDigest: "c".repeat(64) };
    case "INTEGRATION_TESTED":
      return { ...common, integrationBaseUrl: "https://staging.example.test", apiVersionSha: SHA, integrationDigest: "d".repeat(64) };
    case "DEVICE_TESTED_IOS":
      return { ...common, easBuildId: "ios-build-123", artifactSha256: "e".repeat(64), deviceEvidenceId: "ios-device-proof-123" };
    case "DEVICE_TESTED_ANDROID":
      return { ...common, easBuildId: "android-build-123", artifactSha256: "f".repeat(64), deviceEvidenceId: "android-device-proof-123" };
    case "FOUNDER_ACCEPTED":
      return { ...common, approvalReference: "founder-approval-123", approvalDigest: "1".repeat(64) };
    case "RELEASED":
      return { ...common, storeEvidenceReference: "store-release-123", liveVersionSha: SHA, liveVersionUrl: "https://api.example.test/api/version" };
    default:
      throw new Error(`unhandled stage ${stage}`);
  }
}

function appendAll() {
  let envelope = createCandidateEvidence({
    candidateId: "rc-aaaaaaaaaaaa-release-gate",
    sourceSha: SHA,
    treeSha: TREE,
    actor: "release-ci",
    at: AT,
  });
  for (const stage of STAGES.slice(1)) {
    envelope = appendTransition(envelope, {
      stage,
      actor: "release-ci",
      at: AT,
      evidence: stageEvidence(stage),
    });
  }
  return envelope;
}

test("accepts the one valid ordered release evidence chain", () => {
  const envelope = appendAll();
  assert.equal(envelope.transitions.length, STAGES.length);
  assert.equal(validateEvidence(envelope, { requireStage: "RELEASED" }).chainDigest, envelope.chainDigest);
});

test("rejects skipped and reordered stages", () => {
  const coded = createCandidateEvidence({
    candidateId: "rc-aaaaaaaaaaaa-release-gate",
    sourceSha: SHA,
    treeSha: TREE,
    actor: "release-ci",
    at: AT,
  });
  assert.throws(
    () => appendTransition(coded, { stage: "INTEGRATION_TESTED", actor: "release-ci", at: AT, evidence: stageEvidence("INTEGRATION_TESTED") }),
    /next stage must be AUTOMATED_TESTED/,
  );
});

test("rejects cross-source evidence and tampered immutable transitions", () => {
  let envelope = createCandidateEvidence({
    candidateId: "rc-aaaaaaaaaaaa-release-gate",
    sourceSha: SHA,
    treeSha: TREE,
    actor: "release-ci",
    at: AT,
  });
  assert.throws(
    () => appendTransition(envelope, {
      stage: "AUTOMATED_TESTED",
      actor: "release-ci",
      at: AT,
      evidence: { ...stageEvidence("AUTOMATED_TESTED"), sourceSha: "b".repeat(40) },
    }),
    /must equal candidate.sourceSha/,
  );
  envelope = appendTransition(envelope, { stage: "AUTOMATED_TESTED", actor: "release-ci", at: AT, evidence: stageEvidence("AUTOMATED_TESTED") });
  const tampered = structuredClone(envelope);
  tampered.transitions[1].evidence.ciRunUrl = "https://attacker.example.test/run";
  assert.throws(() => validateEvidence(tampered), /does not match its immutable transition contents/);
});

test("rejects unsupported fields that could bypass the published schema", () => {
  const envelope = createCandidateEvidence({
    candidateId: "rc-aaaaaaaaaaaa-release-gate",
    sourceSha: SHA,
    treeSha: TREE,
    actor: "release-ci",
    at: AT,
  });
  envelope.emergencyRelease = true;
  assert.throws(() => validateEvidence(envelope), /unsupported field emergencyRelease/);
});

test("requires stage-specific integration, device, founder, and release proof", () => {
  let envelope = createCandidateEvidence({
    candidateId: "rc-aaaaaaaaaaaa-release-gate",
    sourceSha: SHA,
    treeSha: TREE,
    actor: "release-ci",
    at: AT,
  });
  envelope = appendTransition(envelope, { stage: "AUTOMATED_TESTED", actor: "release-ci", at: AT, evidence: stageEvidence("AUTOMATED_TESTED") });
  assert.throws(
    () => appendTransition(envelope, {
      stage: "INTEGRATION_TESTED",
      actor: "release-ci",
      at: AT,
      evidence: { sourceSha: SHA, integrationBaseUrl: "https://staging.example.test", apiVersionSha: SHA },
    }),
    /integrationDigest/,
  );
  assert.throws(() => validateEvidence(envelope, { requireStage: "DEVICE_TESTED_IOS" }), /requires DEVICE_TESTED_IOS/);
});
