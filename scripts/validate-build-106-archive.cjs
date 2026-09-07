"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const FORBIDDEN_NAMES = new Set([
  ".replit",
  "sedQ6qvzl",
  "credentials.json",
  "google-service-account.json",
  "google-services.json",
  "GoogleService-Info.plist",
  "replit.md",
  "replit.nix",
  "@tlindsay428__workspace.jks",
  "upload_cert.pem",
  "upload_certificate.pem",
  "upload_certificate.txt",
  "upload_keystore.jks",
]);
const FORBIDDEN_EXTENSIONS = new Set([
  ".jks",
  ".keystore",
  ".pem",
  ".p12",
  ".p8",
  ".pfx",
  ".key",
  ".cer",
  ".mobileprovision",
]);
const TEXT_EXTENSIONS = new Set([
  "",
  ".cjs",
  ".css",
  ".env",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".sh",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bappl_[A-Za-z0-9_-]{20,}\b/,
  /\bgoog_[A-Za-z0-9_-]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
];

function isForbiddenRiskyName(base) {
  const lower = base.toLowerCase();
  if (FORBIDDEN_NAMES.has(base) || FORBIDDEN_NAMES.has(lower)) return true;
  if (lower === ".replitignore" || lower === "replit.md" || lower === "replit.nix") return true;
  if (/credential/.test(lower)) return true;
  if (/(?:google[-_.]?)?service[-_.]?account/.test(lower)) return true;
  if (/^upload[-_.]?(?:credential|certificate|cert|key|keystore|profile)/.test(lower)) return true;
  return false;
}

function walk(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      if (entry.isSymbolicLink()) {
        const target = fs.realpathSync(absolute);
        assert(target === root || target.startsWith(`${root}${path.sep}`), `archive symlink escapes root: ${relative}`);
        files.push({ absolute, relative, symlink: true });
      } else if (entry.isDirectory()) {
        visit(absolute);
      } else if (entry.isFile()) {
        files.push({ absolute, relative, symlink: false });
      }
    }
  };
  visit(root);
  return files;
}

function validateBuild106Archive(archivePath) {
  const root = fs.realpathSync(archivePath);
  assert(fs.statSync(root).isDirectory(), "EAS archive inspection output must be a directory");
  const files = walk(root);
  assert(files.length > 0, "EAS archive inspection output is empty");

  for (const file of files) {
    const parts = file.relative.split("/");
    const base = parts.at(-1);
    const extension = path.extname(base).toLowerCase();
    assert(!parts.includes(".git"), `Git metadata entered EAS archive: ${file.relative}`);
    assert(!parts.includes("node_modules"), `node_modules entered EAS archive: ${file.relative}`);
    assert(!parts.includes(".replit-artifact"), `Replit artifact metadata entered EAS archive: ${file.relative}`);
    assert(!isForbiddenRiskyName(base), `credential/config artifact entered EAS archive: ${file.relative}`);
    assert(!FORBIDDEN_EXTENSIONS.has(extension), `signing artifact entered EAS archive: ${file.relative}`);
    assert(!/^\.env(?:\.|$)/.test(base), `environment file entered EAS archive: ${file.relative}`);

    if (file.symlink || !TEXT_EXTENSIONS.has(extension)) continue;
    const stat = fs.statSync(file.absolute);
    if (stat.size > 5 * 1024 * 1024) continue;
    const buffer = fs.readFileSync(file.absolute);
    if (buffer.includes(0)) continue;
    const text = buffer.toString("utf8");
    for (const pattern of SECRET_PATTERNS) {
      assert(!pattern.test(text), `credential-like literal entered EAS archive: ${file.relative}`);
    }
  }

  const relativeNames = new Set(files.map((file) => file.relative));
  const appJson = [...relativeNames].find((name) => name === "app.json" || name === "artifacts/mobile/app.json" || name.endsWith("/artifacts/mobile/app.json"));
  const apiHelper = [...relativeNames].find((name) => name === "lib/api.ts" || name === "artifacts/mobile/lib/api.ts" || name.endsWith("/artifacts/mobile/lib/api.ts"));
  assert(appJson, "mobile app.json missing from EAS archive");
  assert(apiHelper, "canonical mobile API resolver missing from EAS archive");

  return { files: files.length, appJson, apiHelper };
}

if (require.main === module) {
  const [, , archivePath] = process.argv;
  assert(archivePath, "usage: validate-build-106-archive.cjs <archive-directory>");
  const result = validateBuild106Archive(archivePath);
  console.log(`Build 106 EAS archive proof passed (${result.files} files, no credential artifacts).`);
}

module.exports = { validateBuild106Archive };
