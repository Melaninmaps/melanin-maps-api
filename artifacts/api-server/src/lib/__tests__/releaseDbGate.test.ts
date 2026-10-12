import { describe, expect, it } from "vitest";
import { resolveReleaseGateDatabaseUrl } from "../releaseDbGate";

const releaseGateEnvironment = (overrides: Record<string, string | undefined> = {}) => ({
  RUN_RELEASE_DB_GATE: "1",
  RELEASE_GATE_DATABASE_URL: "postgres://release:release@127.0.0.1:5432/kinfolk_release",
  ...overrides,
});

describe("release database gate guard", () => {
  it.each([
    "postgres://release:release@127.0.0.1:5432/kinfolk_release",
    "postgresql://release:release@localhost:5432/kinfolk_release",
    "postgres://release:release@[::1]:5432/kinfolk_release",
    "postgres://release:release@kinfolk-release.test:5432/kinfolk_release",
  ])("accepts an explicit isolated target: %s", (releaseDatabaseUrl) => {
    expect(
      resolveReleaseGateDatabaseUrl(
        releaseGateEnvironment({ RELEASE_GATE_DATABASE_URL: releaseDatabaseUrl }),
      ),
    ).toBe(releaseDatabaseUrl);
  });

  it("accepts only recognized PostgreSQL service names when CI=true", () => {
    expect(
      resolveReleaseGateDatabaseUrl(
        releaseGateEnvironment({
          RELEASE_GATE_DATABASE_URL: "postgres://release:release@postgres:5432/kinfolk_release",
          CI: "true",
        }),
      ),
    ).toContain("@postgres:");
  });

  it("requires an explicit acknowledgement", () => {
    expect(() =>
      resolveReleaseGateDatabaseUrl(releaseGateEnvironment({ RUN_RELEASE_DB_GATE: undefined })),
    ).toThrow("RUN_RELEASE_DB_GATE=1");
  });

  it("does not fall back to DATABASE_URL when the release target is absent", () => {
    expect(() =>
      resolveReleaseGateDatabaseUrl(
        releaseGateEnvironment({
          RELEASE_GATE_DATABASE_URL: undefined,
          DATABASE_URL: "postgres://production.example:5432/application",
        }),
      ),
    ).toThrow("RELEASE_GATE_DATABASE_URL is required");
  });

  it.each([
    "postgres://release:release@production.example:5432/kinfolk_release",
    "postgres://release:release@postgres:5432/kinfolk_release",
    "postgres://release:release@db:5432/kinfolk_release",
    "postgres://release:release@postgres:5432/kinfolk_release?sslmode=require",
    "mysql://release:release@127.0.0.1:3306/kinfolk_release",
    "not a connection URL",
  ])("rejects an unsafe or invalid release target: %s", (releaseDatabaseUrl) => {
    expect(() =>
      resolveReleaseGateDatabaseUrl(
        releaseGateEnvironment({ RELEASE_GATE_DATABASE_URL: releaseDatabaseUrl }),
      ),
    ).toThrow();
  });

  it("rejects a CI service host unless CI is exactly true", () => {
    expect(() =>
      resolveReleaseGateDatabaseUrl(
        releaseGateEnvironment({
          RELEASE_GATE_DATABASE_URL: "postgres://release:release@postgresql:5432/kinfolk_release",
          CI: "1",
        }),
      ),
    ).toThrow("host must be loopback or end in .test");
  });
});
