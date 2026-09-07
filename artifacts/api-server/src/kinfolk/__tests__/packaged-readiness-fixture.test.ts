import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
// The production build helper is intentionally plain ESM so build.mjs can load it.
// @ts-expect-error JavaScript build helper has no separate declaration file.
import * as readinessAssets from "../../../readiness-assets.mjs";
import { inspectVoiceAudio } from "../voice/audioInspection";

const {
  KINFOLK_READINESS_FIXTURE_RELATIVE_PATH,
  packageKinfolkReadinessFixture,
} = readinessAssets;

const temporaryDirectories: string[] = [];
const apiDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("packaged Kinfolk readiness fixture", () => {
  it("copies the synthetic spoken WAV byte-for-byte into a fresh dist deterministically", async () => {
    const temporaryApi = await mkdtemp(join(tmpdir(), "kinfolk-readiness-package-"));
    temporaryDirectories.push(temporaryApi);
    const source = resolve(apiDirectory, "src", KINFOLK_READINESS_FIXTURE_RELATIVE_PATH);
    const sourceBytes = await readFile(source);
    const isolatedSource = resolve(temporaryApi, "src", KINFOLK_READINESS_FIXTURE_RELATIVE_PATH);
    await mkdir(dirname(isolatedSource), { recursive: true });
    await writeFile(isolatedSource, sourceBytes);

    const first = await packageKinfolkReadinessFixture(temporaryApi);
    const firstBytes = await readFile(first.packaged);
    expect(first.packaged).toBe(resolve(temporaryApi, "dist", KINFOLK_READINESS_FIXTURE_RELATIVE_PATH));
    expect(firstBytes.equals(sourceBytes)).toBe(true);
    await expect(inspectVoiceAudio(firstBytes, "audio/wav", 30_000)).resolves.toMatchObject({
      container: "WAVE",
      durationMs: expect.any(Number),
    });

    await rm(resolve(temporaryApi, "dist"), { recursive: true, force: true });
    const second = await packageKinfolkReadinessFixture(temporaryApi);
    expect((await readFile(second.packaged)).equals(firstBytes)).toBe(true);
  });
});
