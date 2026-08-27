#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] ?? process.cwd());
const requestedBackup = process.argv[3];
const backupsBase = path.join(ROOT, ".task373-backups");

function fail(message) {
  console.error(`TASK373 ROLLBACK ERROR: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(backupsBase)) fail(`No backup directory exists at ${backupsBase}`);

const available = fs
  .readdirSync(backupsBase, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(backupsBase, entry.name, "manifest.json")))
  .map((entry) => entry.name)
  .sort();

if (available.length === 0) fail("No Task #373 backup manifests were found");

const backupName = requestedBackup ?? available.at(-1);
if (!available.includes(backupName)) fail(`Unknown backup ${backupName}; available: ${available.join(", ")}`);

const backupRoot = path.join(backupsBase, backupName);
const manifest = JSON.parse(fs.readFileSync(path.join(backupRoot, "manifest.json"), "utf8"));
const restored = [];

for (const change of manifest.changed ?? []) {
  const source = path.join(backupRoot, change.file);
  const destination = path.join(ROOT, change.file);
  if (!fs.existsSync(source)) fail(`Backup file is missing: ${source}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  restored.push(change.file);
}

console.log(JSON.stringify({ backup: backupRoot, restored }, null, 2));
console.log("TASK373 rollback complete. Review `git diff` and rerun validation.");
