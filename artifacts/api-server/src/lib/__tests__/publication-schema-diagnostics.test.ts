import { describe, expect, it } from "vitest";
import { summarizeRequiredPublicationSchemaFailure } from "../startup-migrations";

describe("required publication schema failure diagnostics", () => {
  it("preserves structural verification details without raw driver output", () => {
    const reason = summarizeRequiredPublicationSchemaFailure(
      new Error(
        "Community publication schema verification failed: missing tables [none], columns [businesses.tags], indexes [none], malformed indexes [none], public view [public.public_businesses], safe public function [yes], safe public view [yes], media public_url nullable [YES].",
      ),
    );

    expect(reason).toContain("missing tables [none]");
    expect(reason).toContain("columns [businesses.tags]");
  });

  it("does not log unclassified provider or credential text", () => {
    expect(
      summarizeRequiredPublicationSchemaFailure(
        new Error("password=secret DATABASE_URL=postgres://private.example"),
      ),
    ).toBe("required_publication_schema_unclassified");
  });
});
