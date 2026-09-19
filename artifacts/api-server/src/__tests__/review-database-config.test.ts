import { describe, expect, it } from "vitest";
import { resolveIsolatedDirectoryReviewConfig } from "../directoryImport/reviewDatabaseConfig";

const environment = {
  DIRECTORY_REVIEW_ENABLED: "1",
  DIRECTORY_REVIEW_SIGNING_SECRET: "review-signing-secret-at-least-32-chars",
  DATABASE_URL: "postgresql://production:secret@production-db.internal:5432/mwm_production",
  DIRECTORY_REVIEW_DATABASE_URL: "postgresql://review:secret@review-db.internal:5432/mwm_directory_review",
};

describe("isolated directory review database configuration", () => {
  it("stays disabled unless explicitly enabled", () => {
    expect(resolveIsolatedDirectoryReviewConfig({ DATABASE_URL: environment.DATABASE_URL })).toBeNull();
  });

  it("accepts a separate review database without exposing credentials", () => {
    expect(resolveIsolatedDirectoryReviewConfig(environment)).toEqual({
      reviewDatabaseUrl: environment.DIRECTORY_REVIEW_DATABASE_URL,
      reviewDatabaseIdentity: "review-db.internal:5432/mwm_directory_review",
    });
  });

  it.each([
    [{ ...environment, DIRECTORY_REVIEW_DATABASE_URL: undefined }, "DIRECTORY_REVIEW_DATABASE_URL"],
    [{ ...environment, DIRECTORY_REVIEW_SIGNING_SECRET: "too-short" }, "DIRECTORY_REVIEW_SIGNING_SECRET"],
    [{ ...environment, DIRECTORY_REVIEW_DATABASE_URL: environment.DATABASE_URL }, "separate"],
    [{ ...environment, DIRECTORY_REVIEW_DATABASE_URL: "https://review.example.com/db" }, "PostgreSQL"],
    [{ ...environment, DIRECTORY_REVIEW_DATABASE_URL: "postgresql://review@review-db.internal" }, "identify a database"],
  ])("rejects unsafe review configuration", (unsafeEnvironment, message) => {
    expect(() => resolveIsolatedDirectoryReviewConfig(unsafeEnvironment)).toThrow(message);
  });
});
