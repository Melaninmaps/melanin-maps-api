#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const { REQUIRED_ENVIRONMENT, validateEmptyEnvironmentOutput } = require("./validate-build-106-eas-environment.cjs");

function validateBuild107EasEnvironment(projectOutput, accountOutput) {
  validateEmptyEnvironmentOutput(projectOutput, "project");
  validateEmptyEnvironmentOutput(accountOutput, "account");
  return { environment: REQUIRED_ENVIRONMENT, projectVariables: 0, accountVariables: 0 };
}

if (require.main === module) {
  try {
    const [, , projectPath, accountPath] = process.argv;
    assert(projectPath && accountPath, "usage: validate-build-107-eas-environment.cjs <project-output> <account-output>");
    const result = validateBuild107EasEnvironment(
      fs.readFileSync(projectPath, "utf8"),
      fs.readFileSync(accountPath, "utf8"),
    );
    console.log(`Build 107 EAS environment proof passed (${result.environment}, zero remote variables).`);
  } catch (error) {
    console.error(`BUILD_107_BLOCKED: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

module.exports = { validateBuild107EasEnvironment };
