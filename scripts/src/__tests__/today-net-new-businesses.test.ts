import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { validCoordinates } from "../publish-today-net-new-census-pins";

const root = resolve(import.meta.dirname, "../../..");
const bundle = resolve(root, "data/founder-imports/2026-09-06-today-net-new-businesses");
const manifestPath = resolve(bundle, "today-net-new-business-candidates.jsonl");
const resultsPath = resolve(bundle, "census-geocode-results.jsonl");
const manifest = readFileSync(manifestPath, "utf8").trim().split("\n").map((line) => JSON.parse(line));
const results = readFileSync(resultsPath, "utf8").trim().split("\n").map((line) => JSON.parse(line));
const digest = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

describe("today net-new cumulative business cohort", () => {
  it("locks the exact canonical workbook cohort and excludes the duplicated NYC subset", () => {
    expect(manifest).toHaveLength(3_367);
    expect(new Set(manifest.map((row) => row.sourceRow)).size).toBe(3_367);
    expect(new Set(manifest.map((row) => `${row.name}|${row.city}|${row.state}`.toLowerCase())).size).toBe(3_367);
    expect(digest(manifestPath)).toBe("144ca9d90ca9ea40445e957a62d6bf786d765657411fc40ee3c0b5433260bc49");
  });

  it("routes ordinary businesses, regulated services, and missing-link rows separately", () => {
    const businesses = manifest.filter((row) => row.targetKind === "business");
    expect(businesses).toHaveLength(2_857);
    expect(manifest.filter((row) => row.targetKind === "regulated_review")).toHaveLength(459);
    expect(manifest.filter((row) => row.targetKind === "manual_review")).toHaveLength(51);
    expect(manifest.every((row) => row.address && row.city && row.state && row.rawRecord.country === "USA")).toBe(true);
    expect(businesses.every((row) => row.regulatedProfession === false)).toBe(true);
    expect(businesses.every((row) => [row.website,row.sourceUrl,row.instagramUrl,row.facebookUrl,row.tiktokUrl,row.socialSourceUrl].some(Boolean))).toBe(true);
  });

  it("accepts only exact, non-Null-Island Census address-range coordinates", () => {
    expect(results).toHaveLength(3_367);
    expect(new Set(results.map((row) => row.sourceRow)).size).toBe(3_367);
    expect(digest(resultsPath)).toBe("2dc4e1752853821fc61575f8f574d93b2fbef8453d96e3de3335769623a30a6b");
    const accepted = results.filter((row) => row.accepted);
    expect(accepted).toHaveLength(2_542);
    expect(accepted.filter((row) => row.targetKind === "business")).toHaveLength(2_170);
    expect(accepted.every((row) => row.matchStatus === "Match" && row.matchType === "Exact")).toBe(true);
    expect(accepted.every((row) => validCoordinates(row.latitude,row.longitude))).toBe(true);
    expect(accepted.every((row) => row.coordinatePrecision === "interpolated_address_range" && row.verifiedBusinessLocation === false)).toBe(true);
  });
});

describe("today net-new database safeguards", () => {
  const stageSource = readFileSync(resolve(import.meta.dirname,"../stage-today-net-new-businesses.ts"),"utf8");
  const pinSource = readFileSync(resolve(import.meta.dirname,"../publish-today-net-new-census-pins.ts"),"utf8");

  it("stages only on local directory staging with exact persisted target counts", () => {
    expect(stageSource).toContain("assertLocalDirectoryStagingFromProcess");
    expect(stageSource).toContain("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(stageSource).toContain("TODAY_NET_NEW_STAGING_POSTCONDITION_FAILED");
    expect(stageSource).toContain("Number(row.business)!==2_857");
    expect(stageSource).toContain("Number(row.regulated)!==459");
    expect(stageSource).toContain("Number(row.manual)!==51");
  });

  it("pins only published batch-linked records and preserves existing pins", () => {
    expect(pinSource).toContain("assertLocalDirectoryStagingFromProcess");
    expect(pinSource).toContain("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(pinSource).toContain("p.actor_id=$5");
    expect(pinSource).toContain("b.latitude IS NULL AND b.longitude IS NULL");
    expect(pinSource).toContain("CENSUS_PIN_BUSINESS_UPDATE_POSTCONDITION_FAILED");
    expect(pinSource).toContain("interpolated_address_range");
    expect(pinSource).toContain("verifiedByMwm',false");
    expect(pinSource).toContain("CENSUS_PIN_EXISTING_CANONICAL_LOCATION_CONFLICT");
    expect(pinSource).toContain("CENSUS_PIN_AMBIGUOUS_CANONICAL_LOCATION_ROWS");
    expect(pinSource).toContain("c.latitude IS NULL AND c.longitude IS NULL");
    expect(pinSource).toContain("p.record_id!~$1");
    expect(pinSource).not.toContain("ON CONFLICT(record_type,record_id,city_name,COALESCE(state_code,''),COALESCE(neighborhood_name,'')) DO UPDATE");
  });

  it("rejects production-shaped dry runs before either script can connect", () => {
    for (const script of ["publish-founder-business-inventory.ts","publish-today-net-new-census-pins.ts"]) {
      const result = spawnSync("pnpm",["exec","tsx",resolve(import.meta.dirname,"..",script)],{
        cwd:resolve(root,"scripts"),encoding:"utf8",timeout:20_000,
        env:{...process.env,DIRECTORY_IMPORT_LOCAL_STAGING:"0",DEPLOYMENT_TIER:"production",NODE_ENV:"production",DATABASE_URL:"postgresql://invalid:invalid@203.0.113.1:5432/production"},
      });
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toContain("DIRECTORY_IMPORT_LOCAL_STAGING=1 is required");
      expect(`${result.stdout}\n${result.stderr}`).not.toContain("ECONN");
    }
  }, 60_000);

  it("regenerates derived manifests and the checksum ledger byte-for-byte", () => {
    const scripts = [
      "convert-today-net-new-businesses.py",
      "validate-today-net-new-census-geocoder.py",
      "refresh-today-net-new-checksums.py",
    ];
    const outputs = [manifestPath,resultsPath,resolve(bundle,"conversion-summary.json"),resolve(bundle,"census-geocode-summary.json"),resolve(bundle,"SHA256SUMS")];
    const run = () => {
      for (const script of scripts) {
        const result=spawnSync("python3",[resolve(import.meta.dirname,"..",script)],{cwd:root,encoding:"utf8",timeout:60_000});
        expect(result.status,`${script}: ${result.stderr}`).toBe(0);
      }
      return outputs.map((path)=>digest(path));
    };
    expect(run()).toEqual(run());
  }, 120_000);
});
