import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const inputFile = resolve(process.argv[2]);
if (!process.argv[2]) throw new Error("Usage: node normalize-third-wave-source-kinds.mjs <jsonl-file>");

const sourceDerivedOnlineOnlyNames = new Set(["FLOWBHM", "SepiaStock"]);
const rows = (await readFile(inputFile, "utf8"))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

for (const row of rows) {
  if (sourceDerivedOnlineOnlyNames.has(row.name) && row.targetKind === "business" && row.address == null) {
    row.targetKind = "online_business";
    row.notes = `${String(row.notes ?? "")} Classification normalized to online_business because the original source notes explicitly describe this record as online-only and supply no physical address.`.trim();
  }
}

const invalid = rows.filter((row) => sourceDerivedOnlineOnlyNames.has(row.name) && row.targetKind !== "online_business");
if (invalid.length) throw new Error(`Could not normalize source-derived online-only records: ${JSON.stringify(invalid.map((row) => row.name))}`);
await writeFile(inputFile, rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ inputFile, normalizedOnlineOnlyNames: [...sourceDerivedOnlineOnlyNames] }, null, 2));
