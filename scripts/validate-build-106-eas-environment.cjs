"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");

const REQUIRED_ENVIRONMENT = "testflight-staging";

function clean(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, "").replace(/\r/g, "");
}

function validateEmptyEnvironmentOutput(text, label) {
  const output = clean(text);
  assert.match(
    output,
    new RegExp(`Environment:\\s*${REQUIRED_ENVIRONMENT}`, "i"),
    `${label} EAS output did not confirm ${REQUIRED_ENVIRONMENT}`,
  );
  assert.match(
    output,
    /No variables found for this environment\./,
    `${label} ${REQUIRED_ENVIRONMENT} environment must be empty`,
  );
  assert.doesNotMatch(
    output,
    /^\s*[A-Za-z_][A-Za-z0-9_]*=/m,
    `${label} ${REQUIRED_ENVIRONMENT} environment contains a variable`,
  );
  assert.doesNotMatch(
    output,
    /Variables for this project:|Account-wide variables for this account:/,
    `${label} ${REQUIRED_ENVIRONMENT} environment contains inherited variables`,
  );
}

function validateBuild106EasEnvironment(projectOutput, accountOutput) {
  validateEmptyEnvironmentOutput(projectOutput, "project");
  validateEmptyEnvironmentOutput(accountOutput, "account");
  return { environment: REQUIRED_ENVIRONMENT, projectVariables: 0, accountVariables: 0 };
}

if (require.main === module) {
  const [, , projectPath, accountPath] = process.argv;
  assert(projectPath && accountPath, "usage: validate-build-106-eas-environment.cjs <project-output> <account-output>");
  const result = validateBuild106EasEnvironment(
    fs.readFileSync(projectPath, "utf8"),
    fs.readFileSync(accountPath, "utf8"),
  );
  console.log(`Build 106 EAS environment proof passed (${result.environment}, zero remote variables).`);
}

module.exports = { REQUIRED_ENVIRONMENT, validateBuild106EasEnvironment, validateEmptyEnvironmentOutput };
