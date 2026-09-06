import { describe, expect, it } from "vitest";
import { assertLocalDirectoryStagingDatabase } from "../lib/local-directory-staging";

const localEnvironment = {
  DIRECTORY_IMPORT_LOCAL_STAGING: "1",
  DEPLOYMENT_TIER: "local_staging",
  NODE_ENV: "development",
};

describe("review-only importer local staging guard", () => {
  it("accepts the named loopback-only staging database", () => {
    expect(assertLocalDirectoryStagingDatabase(
      "postgresql://reviewer:secret@localhost:5432/mwm_directory_staging_review",
      localEnvironment,
    ).hostname).toBe("localhost");
  });

  it.each([
    ["postgresql://reviewer:secret@localhost:5432/mwm_directory_staging", { ...localEnvironment, DIRECTORY_IMPORT_LOCAL_STAGING: undefined }, "DIRECTORY_IMPORT_LOCAL_STAGING"],
    ["postgresql://reviewer:secret@localhost:5432/mwm_directory_staging", { ...localEnvironment, DEPLOYMENT_TIER: "production" }, "DEPLOYMENT_TIER"],
    ["postgresql://reviewer:secret@localhost:5432/mwm_directory_staging", { ...localEnvironment, NODE_ENV: "production" }, "NODE_ENV"],
    ["postgresql://reviewer:secret@db.example.com:5432/mwm_directory_staging", localEnvironment, "loopback"],
    ["postgresql://reviewer:secret@localhost:5432/production", localEnvironment, "mwm_directory_staging"],
    ["postgresql://reviewer:secret@localhost:5432/mwm_directory_staging?host=db.example.com", localEnvironment, "query parameters"],
    ["postgresql://reviewer:secret@localhost:5432/mwm_directory_staging?hostaddr=203.0.113.10", localEnvironment, "query parameters"],
    ["postgresql://reviewer:secret@localhost:5432/mwm_directory_staging?host=%2Fvar%2Frun%2Fpostgresql", localEnvironment, "query parameters"],
    ["postgresql://reviewer:secret@localhost:5432/mwm_directory_staging?dbname=production", localEnvironment, "query parameters"],
    ["postgresql://reviewer:secret@localhost:5432/mwm_directory_staging#override", localEnvironment, "fragments"],
  ])("rejects unsafe apply configuration", (databaseUrl, environment, message) => {
    expect(() => assertLocalDirectoryStagingDatabase(databaseUrl, environment)).toThrow(message);
  });
});
