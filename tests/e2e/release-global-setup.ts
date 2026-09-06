import { request, type FullConfig } from "@playwright/test";

export default async function releaseGlobalSetup(config: FullConfig): Promise<void> {
  const expectedSha = process.env.EXPECTED_RELEASE_SHA;
  if (!expectedSha) return;
  if (!/^[0-9a-f]{40}$/.test(expectedSha)) {
    throw new Error("EXPECTED_RELEASE_SHA must be a full lowercase 40-character Git SHA");
  }

  const configuredBase = config.projects[0]?.use?.baseURL;
  if (typeof configuredBase !== "string") {
    throw new Error("Release Playwright requires an explicit baseURL");
  }

  const client = await request.newContext();
  try {
    const response = await client.get(new URL("/api/version", configuredBase).toString());
    if (!response.ok()) {
      throw new Error(`Release server identity endpoint returned HTTP ${response.status()}`);
    }
    const body = await response.json() as {
      built_from_sha?: unknown;
      stale_bundle?: unknown;
    };
    if (body.built_from_sha !== expectedSha || body.stale_bundle !== false) {
      throw new Error("Release server identity does not match the reviewed SHA or reports a stale bundle");
    }
  } finally {
    await client.dispose();
  }
}
