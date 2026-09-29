#!/usr/bin/env node
/**
 * Append-only release-evidence validator.
 *
 * This helper validates evidence only. It never invokes EAS, deploys code,
 * updates application data, or promotes a store artifact.
 *
 * Usage:
 *   node scripts/release-state.mjs init --candidate rc-<sha12>-<slug> --sha <40-sha> --tree <40-tree> --actor <actor> --at <ISO> --output <new-file>
 *   node scripts/release-state.mjs transition --input <prior-file> --stage <next-stage> --actor <actor> --at <ISO> --evidence-file <json> --output <new-file>
 *   node scripts/release-state.mjs validate --input <file> [--require-stage <stage>]
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const STAGES = Object.freeze([
  "CODED",
  "AUTOMATED_TESTED",
  "INTEGRATION_TESTED",
  "DEVICE_TESTED_IOS",
  "DEVICE_TESTED_ANDROID",
  "FOUNDER_ACCEPTED",
  "RELEASED",
]);

const FULL_SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const CANDIDATE_ID = /^rc-[a-f0-9]{12,40}-[a-z0-9-]{3,64}$/;
const GENESIS_DIGEST = "0".repeat(64);

function failure(message) {
  const error = new Error(`RELEASE_EVIDENCE_INVALID: ${message}`);
  error.code = "RELEASE_EVIDENCE_INVALID";
  return error;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertOnlyKeys(value, allowedKeys, label) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      throw failure(`${label} contains unsupported field ${key}`);
    }
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw failure(`${label} must be a non-empty string`);
  }
  return value;
}

function requireSha(value, label) {
  if (!FULL_SHA.test(String(value ?? ""))) {
    throw failure(`${label} must be a full lowercase 40-character Git SHA`);
  }
  return value;
}

function requireDigest(value, label) {
  if (!SHA256.test(String(value ?? ""))) {
    throw failure(`${label} must be a lowercase SHA-256 digest`);
  }
  return value;
}

function requireIsoDate(value, label) {
  requireString(value, label);
  if (Number.isNaN(Date.parse(value))) {
    throw failure(`${label} must be an ISO-8601 timestamp`);
  }
  return value;
}

function requireHttps(value, label) {
  const url = new URL(requireString(value, label));
  if (url.protocol !== "https:") {
    throw failure(`${label} must be an HTTPS URL`);
  }
  return value;
}

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function transitionDigest(candidate, transition) {
  return sha256(
    stableJson({
      candidate,
      stage: transition.stage,
      at: transition.at,
      actor: transition.actor,
      evidence: transition.evidence,
      previousDigest: transition.previousDigest,
    }),
  );
}

function validateStageEvidence(stage, evidence, sourceSha) {
  if (!isPlainObject(evidence)) throw failure(`${stage}.evidence must be an object`);
  requireSha(evidence.sourceSha, `${stage}.evidence.sourceSha`);
  if (evidence.sourceSha !== sourceSha) {
    throw failure(`${stage}.evidence.sourceSha must equal candidate.sourceSha`);
  }

  switch (stage) {
    case "CODED":
      requireSha(evidence.treeSha, "CODED.evidence.treeSha");
      if (evidence.clean !== true) throw failure("CODED.evidence.clean must be true");
      break;
    case "AUTOMATED_TESTED":
      requireHttps(evidence.ciRunUrl, "AUTOMATED_TESTED.evidence.ciRunUrl");
      requireDigest(evidence.commandDigest, "AUTOMATED_TESTED.evidence.commandDigest");
      break;
    case "INTEGRATION_TESTED":
      requireHttps(evidence.integrationBaseUrl, "INTEGRATION_TESTED.evidence.integrationBaseUrl");
      requireSha(evidence.apiVersionSha, "INTEGRATION_TESTED.evidence.apiVersionSha");
      if (evidence.apiVersionSha !== sourceSha) {
        throw failure("INTEGRATION_TESTED.evidence.apiVersionSha must equal candidate.sourceSha");
      }
      requireDigest(evidence.integrationDigest, "INTEGRATION_TESTED.evidence.integrationDigest");
      break;
    case "DEVICE_TESTED_IOS":
    case "DEVICE_TESTED_ANDROID":
      requireString(evidence.easBuildId, `${stage}.evidence.easBuildId`);
      requireDigest(evidence.artifactSha256, `${stage}.evidence.artifactSha256`);
      requireString(evidence.deviceEvidenceId, `${stage}.evidence.deviceEvidenceId`);
      if (evidence.deviceEvidenceId.length < 8) {
        throw failure(`${stage}.evidence.deviceEvidenceId must be a non-placeholder reference`);
      }
      break;
    case "FOUNDER_ACCEPTED":
      requireString(evidence.approvalReference, "FOUNDER_ACCEPTED.evidence.approvalReference");
      requireDigest(evidence.approvalDigest, "FOUNDER_ACCEPTED.evidence.approvalDigest");
      break;
    case "RELEASED":
      requireString(evidence.storeEvidenceReference, "RELEASED.evidence.storeEvidenceReference");
      requireSha(evidence.liveVersionSha, "RELEASED.evidence.liveVersionSha");
      if (evidence.liveVersionSha !== sourceSha) {
        throw failure("RELEASED.evidence.liveVersionSha must equal candidate.sourceSha");
      }
      requireHttps(evidence.liveVersionUrl, "RELEASED.evidence.liveVersionUrl");
      break;
    default:
      throw failure(`unsupported stage ${stage}`);
  }
}

export function validateEvidence(envelope, { requireStage } = {}) {
  if (!isPlainObject(envelope)) throw failure("envelope must be an object");
  assertOnlyKeys(envelope, ["version", "candidate", "transitions", "chainDigest"], "envelope");
  if (envelope.version !== 1) throw failure("version must be 1");
  if (!isPlainObject(envelope.candidate)) throw failure("candidate must be an object");
  const { candidate } = envelope;
  assertOnlyKeys(candidate, ["id", "sourceSha", "treeSha"], "candidate");
  if (!CANDIDATE_ID.test(String(candidate.id ?? ""))) {
    throw failure("candidate.id must be rc-<sha-prefix>-<slug>");
  }
  requireSha(candidate.sourceSha, "candidate.sourceSha");
  requireSha(candidate.treeSha, "candidate.treeSha");
  if (!Array.isArray(envelope.transitions) || envelope.transitions.length === 0) {
    throw failure("transitions must contain CODED evidence");
  }

  let previousDigest = GENESIS_DIGEST;
  for (const [index, transition] of envelope.transitions.entries()) {
    if (!isPlainObject(transition)) throw failure(`transition ${index} must be an object`);
    assertOnlyKeys(transition, ["stage", "at", "actor", "evidence", "previousDigest", "digest"], `transition ${index}`);
    const expectedStage = STAGES[index];
    if (transition.stage !== expectedStage) {
      throw failure(`transition ${index} must be ${expectedStage}; received ${transition.stage}`);
    }
    requireIsoDate(transition.at, `${transition.stage}.at`);
    const actor = requireString(transition.actor, `${transition.stage}.actor`);
    if (actor.length > 160) throw failure(`${transition.stage}.actor exceeds 160 characters`);
    if (transition.previousDigest !== previousDigest) {
      throw failure(`${transition.stage}.previousDigest does not match the preceding transition`);
    }
    requireDigest(transition.digest, `${transition.stage}.digest`);
    validateStageEvidence(transition.stage, transition.evidence, candidate.sourceSha);
    const expectedDigest = transitionDigest(candidate, transition);
    if (transition.digest !== expectedDigest) {
      throw failure(`${transition.stage}.digest does not match its immutable transition contents`);
    }
    previousDigest = transition.digest;
  }

  if (envelope.chainDigest !== previousDigest) {
    throw failure("chainDigest does not match the final transition digest");
  }
  requireDigest(envelope.chainDigest, "chainDigest");

  if (requireStage) {
    const index = STAGES.indexOf(requireStage);
    if (index === -1) throw failure(`unknown required stage ${requireStage}`);
    if (envelope.transitions.length - 1 < index) {
      throw failure(`requires ${requireStage}; current stage is ${envelope.transitions.at(-1).stage}`);
    }
  }
  return envelope;
}

export function appendTransition(envelope, { stage, at, actor, evidence }) {
  validateEvidence(envelope);
  const expectedStage = STAGES[envelope.transitions.length];
  if (!expectedStage) throw failure("candidate is already RELEASED; a release evidence chain cannot be reopened");
  if (stage !== expectedStage) {
    throw failure(`next stage must be ${expectedStage}; received ${stage}`);
  }
  const transition = {
    stage,
    at: requireIsoDate(at, `${stage}.at`),
    actor: requireString(actor, `${stage}.actor`),
    evidence,
    previousDigest: envelope.chainDigest,
  };
  validateStageEvidence(stage, evidence, envelope.candidate.sourceSha);
  transition.digest = transitionDigest(envelope.candidate, transition);
  const next = {
    version: 1,
    candidate: { ...envelope.candidate },
    transitions: [...envelope.transitions, transition],
    chainDigest: transition.digest,
  };
  return validateEvidence(next);
}

export function createCandidateEvidence({ candidateId, sourceSha, treeSha, actor, at }) {
  requireSha(sourceSha, "sourceSha");
  requireSha(treeSha, "treeSha");
  if (!CANDIDATE_ID.test(String(candidateId ?? ""))) {
    throw failure("candidateId must be rc-<sha-prefix>-<slug>");
  }
  const empty = {
    version: 1,
    candidate: { id: candidateId, sourceSha, treeSha },
    transitions: [{
      stage: "CODED",
      at: requireIsoDate(at, "CODED.at"),
      actor: requireString(actor, "CODED.actor"),
      evidence: { sourceSha, treeSha, clean: true },
      previousDigest: GENESIS_DIGEST,
      digest: "",
    }],
    chainDigest: "",
  };
  empty.transitions[0].digest = transitionDigest(empty.candidate, empty.transitions[0]);
  empty.chainDigest = empty.transitions[0].digest;
  return validateEvidence(empty);
}

function parseArgs(args) {
  const result = { _: [] };
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) {
      result._.push(token);
      continue;
    }
    const key = token.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw failure(`missing value for --${key}`);
    result[key] = value;
    index += 1;
  }
  return result;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw failure(`unable to read JSON ${file}: ${error.message}`);
  }
}

function writeNewJson(file, value) {
  const output = path.resolve(file);
  if (fs.existsSync(output)) {
    throw failure(`refusing to overwrite existing evidence snapshot ${output}`);
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function usage() {
  return [
    "Usage:",
    "  node scripts/release-state.mjs init --candidate rc-<sha12>-<slug> --sha <40-sha> --tree <40-tree> --actor <actor> --at <ISO> --output <new-file>",
    "  node scripts/release-state.mjs transition --input <prior-file> --stage <next-stage> --actor <actor> --at <ISO> --evidence-file <json> --output <new-file>",
    "  node scripts/release-state.mjs validate --input <file> [--require-stage <stage>]",
  ].join("\n");
}

export function runCli(argv) {
  const [command, ...rest] = argv;
  const options = parseArgs(rest);
  if (!command || command === "--help" || command === "help") {
    console.log(usage());
    return 0;
  }
  if (command === "init") {
    for (const field of ["candidate", "sha", "tree", "actor", "at", "output"]) {
      if (!options[field]) throw failure(`init requires --${field}`);
    }
    const evidence = createCandidateEvidence({
      candidateId: options.candidate,
      sourceSha: options.sha,
      treeSha: options.tree,
      actor: options.actor,
      at: options.at,
    });
    writeNewJson(options.output, evidence);
    console.log(JSON.stringify({ ok: true, stage: "CODED", chainDigest: evidence.chainDigest, output: path.resolve(options.output) }));
    return 0;
  }
  if (command === "transition") {
    for (const field of ["input", "stage", "actor", "at", "evidence-file", "output"]) {
      if (!options[field]) throw failure(`transition requires --${field}`);
    }
    const evidence = appendTransition(readJson(options.input), {
      stage: options.stage,
      actor: options.actor,
      at: options.at,
      evidence: readJson(options["evidence-file"]),
    });
    writeNewJson(options.output, evidence);
    console.log(JSON.stringify({ ok: true, stage: options.stage, chainDigest: evidence.chainDigest, output: path.resolve(options.output) }));
    return 0;
  }
  if (command === "validate") {
    if (!options.input) throw failure("validate requires --input");
    const evidence = validateEvidence(readJson(options.input), { requireStage: options["require-stage"] });
    console.log(JSON.stringify({ ok: true, candidate: evidence.candidate.id, stage: evidence.transitions.at(-1).stage, chainDigest: evidence.chainDigest }));
    return 0;
  }
  throw failure(`unknown command ${command}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = error.code === "RELEASE_EVIDENCE_INVALID" ? 64 : 1;
  }
}
