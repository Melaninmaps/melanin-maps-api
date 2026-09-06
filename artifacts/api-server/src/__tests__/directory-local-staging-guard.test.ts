import { describe, expect, it } from "vitest";
import { assertDirectoryReviewLocalStaging } from "../directoryImport/localStagingGuard";

const localEnvironment = {
  DIRECTORY_IMPORT_REVIEW_ENABLED: "true",
  DIRECTORY_IMPORT_LOCAL_STAGING: "1",
  DEPLOYMENT_TIER: "local_staging",
  NODE_ENV: "development",
  DATABASE_URL: "postgresql://reviewer:secret@127.0.0.1:5432/mwm_directory_staging",
};

describe("directory review local staging guard", () => {
  it("stays disabled when the feature flag is absent", () => {
    expect(assertDirectoryReviewLocalStaging({ NODE_ENV: "production" })).toBe(false);
  });

  it("allows only the explicitly named loopback staging database", () => {
    expect(assertDirectoryReviewLocalStaging(localEnvironment)).toBe(true);
  });

  it.each([
    [{ ...localEnvironment, DIRECTORY_IMPORT_LOCAL_STAGING: undefined }, "DIRECTORY_IMPORT_LOCAL_STAGING"],
    [{ ...localEnvironment, DEPLOYMENT_TIER: "production" }, "DEPLOYMENT_TIER"],
    [{ ...localEnvironment, NODE_ENV: "production" }, "NODE_ENV"],
    [{ ...localEnvironment, DATABASE_URL: "postgresql://reviewer:secret@db.example.com:5432/mwm_directory_staging" }, "loopback"],
    [{ ...localEnvironment, DATABASE_URL: "postgresql://reviewer:secret@127.0.0.1:5432/production" }, "mwm_directory_staging"],
    [{ ...localEnvironment, DATABASE_URL: "postgresql://reviewer:secret@127.0.0.1:5432/mwm_directory_staging?host=db.example.com" }, "query parameters"],
    [{ ...localEnvironment, DATABASE_URL: "postgresql://reviewer:secret@127.0.0.1:5432/mwm_directory_staging?hostaddr=203.0.113.10" }, "query parameters"],
    [{ ...localEnvironment, DATABASE_URL: "postgresql://reviewer:secret@127.0.0.1:5432/mwm_directory_staging?host=%2Fvar%2Frun%2Fpostgresql" }, "query parameters"],
    [{ ...localEnvironment, DATABASE_URL: "postgresql://reviewer:secret@127.0.0.1:5432/mwm_directory_staging?dbname=production" }, "query parameters"],
    [{ ...localEnvironment, DATABASE_URL: "postgresql://reviewer:secret@127.0.0.1:5432/mwm_directory_staging#override" }, "fragments"],
  ])("rejects a non-isolated configuration", (environment, message) => {
    expect(() => assertDirectoryReviewLocalStaging(environment)).toThrow(message);
  });
});
