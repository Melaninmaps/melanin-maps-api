import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export const KINFOLK_READINESS_FIXTURE_RELATIVE_PATH =
  "assets/readiness/kinfolk-readiness-voice.wav";

export function kinfolkReadinessFixturePaths(artifactDir) {
  return {
    source: path.resolve(artifactDir, "src", KINFOLK_READINESS_FIXTURE_RELATIVE_PATH),
    packaged: path.resolve(artifactDir, "dist", KINFOLK_READINESS_FIXTURE_RELATIVE_PATH),
  };
}

export async function packageKinfolkReadinessFixture(artifactDir) {
  const paths = kinfolkReadinessFixturePaths(artifactDir);
  const sourceBytes = await readFile(paths.source);
  await mkdir(path.dirname(paths.packaged), { recursive: true });
  await copyFile(paths.source, paths.packaged);
  const packagedBytes = await readFile(paths.packaged);
  if (!sourceBytes.equals(packagedBytes)) {
    throw new Error("Packaged Kinfolk readiness fixture does not match its source bytes.");
  }
  return paths;
}
