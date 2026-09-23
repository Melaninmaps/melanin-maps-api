import { describe, expect, it } from "vitest";
import {
  communityPublicViewDefinitionIsSafe,
  publicationSchemaFailureLogLines,
  summarizeRequiredPublicationSchemaFailure,
} from "../startup-migrations";

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

  it("splits verified structural fields into short safe log lines", () => {
    const lines = publicationSchemaFailureLogLines(
      new Error(
        "Community publication schema verification failed: missing tables [none], columns [businesses.tags], indexes [none], malformed indexes [canonical_record_locations_unique_idx], public view [public.public_businesses], safe public function [yes], safe public view [yes], media public_url nullable [YES].",
      ),
    );

    expect(lines).toContain("publication_schema_missing_columns=[businesses.tags]");
    expect(lines).toContain(
      "publication_schema_malformed_indexes=[canonical_record_locations_unique_idx]",
    );
    expect(lines.join("\n")).not.toMatch(/secret|database_url|postgres:/i);
  });

  it("accepts PostgreSQL's unqualified rendering of the same fail-closed view", () => {
    const canonicalView = `SELECT b.* FROM businesses b
      WHERE business_record_is_public(b.status, b.listing_status, b.is_duplicate, b.permanently_hidden, b.name, b.description, b.data_source, b.phone)
        AND NOT EXISTS (SELECT 1 FROM business_duplicate_resolutions d WHERE d.superseded_business_id = b.id)`;

    expect(communityPublicViewDefinitionIsSafe(canonicalView)).toBe(true);
    expect(
      communityPublicViewDefinitionIsSafe(
        canonicalView.replace("WHERE business_record_is_public", "WHERE NOT business_record_is_public"),
      ),
    ).toBe(false);
  });

  it("accepts PostgreSQL's alias-free and text-cast view rendering only when the full predicate matches", () => {
    const postgresView = `SELECT b.* FROM businesses b
      WHERE business_record_is_public(status::text, listing_status::text, is_duplicate, permanently_hidden, name, description, data_source::text, phone::text)
        AND NOT EXISTS (SELECT 1 FROM business_duplicate_resolutions d WHERE d.superseded_business_id = id)`;

    expect(communityPublicViewDefinitionIsSafe(postgresView)).toBe(true);
    expect(
      communityPublicViewDefinitionIsSafe(
        postgresView.replace("phone::text)", "phone::text) OR true"),
      ),
    ).toBe(false);
  });
});
