#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ALLOWED_EVIDENCE_FILES = new Set([
  "docs/product/releases/BUILD_105_PROVENANCE.json",
  "docs/product/releases/BUILD_106_ACCEPTANCE.json",
]);

export function verifyReleaseEvidence(repository, reviewedCodeSha, releaseSha) {
  if (!/^[0-9a-f]{40}$/.test(reviewedCodeSha) || !/^[0-9a-f]{40}$/.test(releaseSha)) {
    throw new Error("reviewed code and release evidence identities must be full lowercase Git SHAs");
  }
  if (reviewedCodeSha === releaseSha) {
    throw new Error("release evidence commit must be a strict descendant of the reviewed code commit");
  }
  try {
    execFileSync("git", ["-C", repository, "merge-base", "--is-ancestor", reviewedCodeSha, releaseSha], {
      stdio: "ignore",
    });
  } catch {
    throw new Error("reviewed code SHA is not an ancestor of the release evidence commit");
  }
  const changed = execFileSync("git", ["-C", repository, "diff", "--name-only", `${reviewedCodeSha}..${releaseSha}`], {
    encoding: "utf8",
  }).trim().split("\n").filter(Boolean);
  if (!changed.includes("docs/product/releases/BUILD_106_ACCEPTANCE.json")) {
    throw new Error("release evidence commit must change the Build 106 acceptance record");
  }
  const unexpected = changed.filter((path) => !ALLOWED_EVIDENCE_FILES.has(path));
  if (unexpected.length) {
    throw new Error("application/source changed after the reviewed code commit");
  }
  const commits = execFileSync(
    "git",
    ["-C", repository, "rev-list", "--reverse", `${reviewedCodeSha}..${releaseSha}`],
    { encoding: "utf8" },
  ).trim().split("\n").filter(Boolean);
  for (const commit of commits) {
    const commitPaths = execFileSync(
      "git",
      ["-C", repository, "diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "-m", commit],
      { encoding: "utf8" },
    ).trim().split("\n").filter(Boolean);
    if (commitPaths.some((path) => !ALLOWED_EVIDENCE_FILES.has(path))) {
      throw new Error("an intervening commit changed application/source after review");
    }
  }
  return { changed, commits };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const [repository, reviewedCodeSha, releaseSha] = process.argv.slice(2);
    verifyReleaseEvidence(repository, reviewedCodeSha, releaseSha);
  } catch (error) {
    console.error(`BUILD_106_BLOCKED: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
