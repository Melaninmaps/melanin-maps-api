import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  detectSocialVideoPlatform,
  getBusinessExperiencePolicy,
  normalizeBusinessExperiencePriceKey,
  OWNERSHIP_DESIGNATIONS,
  OWNERSHIP_FILTER_OPTIONS,
  ownershipDesignationFilterId,
  resolveExperienceChoiceLabel,
  sanitizeSocialVideoPreferences,
} from "@workspace/constants";
import { validateCommunityMediaUrls } from "../community/communityMediaValidation";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("category-aware business experience contract", () => {
  it("offers atmosphere, quick reviews, price, and Pop Out Pics for restaurants", () => {
    const policy = getBusinessExperiencePolicy("Food & Drink", "restaurant");
    expect(policy.atmosphereLabel).toBe("What it feels like here");
    expect(policy.reactionLabel).toBe("Community Says");
    expect(policy.vibeChoices.map((choice) => choice.key)).toContain("pop_out_pics");
    expect(policy.reactionChoices.length).toBeGreaterThan(0);
    expect(policy.priceChoices.map((choice) => choice.key)).toEqual([
      "price_1",
      "price_2",
      "price_3",
      "price_4",
    ]);
  });

  it("does not attach restaurant atmosphere tags to lawyers or other professional services", () => {
    const legal = getBusinessExperiencePolicy("Legal & Government Services", "attorney");
    const professional = getBusinessExperiencePolicy("Professional Services", "consultant");
    expect(legal.reactionLabel).toBe("Community Intelligence");
    expect(legal.vibeChoices).toEqual([]);
    expect(professional.vibeChoices).toEqual([]);
    expect(legal.reactionChoices.length).toBeGreaterThan(0);
  });

  it("returns only approved and explicitly public creator contributions on business details", () => {
    const businessesSource = source("../routes/businesses.ts");
    expect(businessesSource).toContain("bc.status = 'approved' AND bc.is_public = TRUE");
    expect(businessesSource).toContain("const detectedType = detectSocialVideoPlatform(sourceUrl.trim())");
    expect(businessesSource).not.toContain("let detectedType = sourceType");
    expect(businessesSource).toContain("status=$1::text");
    expect(businessesSource).toContain("approved_at=CASE WHEN $1::text='approved'");
    expect(businessesSource).toContain("WHERE id=$4::varchar RETURNING id, status");
    expect(businessesSource).toContain("COALESCE(u.first_name, '')");
    expect(businessesSource).toContain("COALESCE(u.last_name, '')");
    expect(businessesSource).not.toContain("u.display_name AS contributor_name");
    expect(businessesSource).toContain("const allInTags = tokens.map");
    expect(businessesSource).toContain("all tokens in reviewed factual tags");
    expect(businessesSource).toContain("const allInRecord = tokens.map");
    expect(businessesSource).toContain("COALESCE(${businessesTable.city}, '')");
    expect(businessesSource).toContain("tokens may span name + city + specialty");
    expect(businessesSource).toContain("ownershipFilterStorageValues");
    expect(businessesSource).toContain('woman: ["woman-owned", "women-owned"');
    expect(businessesSource).toContain('filter.id === "black-african-american"');
    expect(businessesSource).toContain("fuzzyWouldEscapeRestrictiveFilter");
    expect(businessesSource).toContain("&& !fuzzyWouldEscapeRestrictiveFilter");
    expect(businessesSource).toContain("Tester privileges never expose pending/review rows");
    expect(businessesSource).toContain("LOWER(BTRIM(COALESCE(${businessesTable.city}, ''))) =");
    expect(businessesSource).toContain("UPPER(BTRIM(COALESCE(${businessesTable.state}, ''))) =");
    expect(businessesSource).toContain("asc(businessesTable.name)");
    expect(businessesSource).toContain("asc(businessesTable.id)");
    expect(businessesSource).toContain("CATEGORY_FILTER_ALIASES");
    for (const requiredFoodAlias of [
      '"Food"',
      '"Food & Drink"',
      '"Food Trucks"',
      '"Restaurant"',
      '"Bakery"',
    ]) {
      expect(businessesSource).toContain(requiredFoodAlias);
    }
    expect(businessesSource).toContain("categoryFilterStorageValues(category)");
  });

  it("treats practical specialties as content while extracting a requested city", () => {
    const mapsSource = source("../routes/maps.ts");
    expect(mapsSource).toContain('"bookstore","bookstores","bookshop","bookshops"');
    expect(mapsSource).toContain('"hvac","heating","cooling","airconditioning"');
    expect(mapsSource).toContain('"accountant","accountants","accounting","cpa"');
    expect(mapsSource).toContain('"boardgame","boardgames","gaming","games"');
  });

  it("soft-hides only source-less unreviewed Duke's Cafe seed rows", () => {
    const migrationsSource = source("../lib/startup-migrations.ts");
    expect(migrationsSource).toContain("hide_unreviewed_dukes_cafe_seed_rows_v1");
    expect(migrationsSource).toContain("= 'dukescafe'");
    expect(migrationsSource).toContain("COALESCE(verified, false) = false");
    expect(migrationsSource).toContain("BTRIM(COALESCE(data_source, '')) = ''");
    expect(migrationsSource).toContain("SET status = 'permanently_hidden'");
    expect(migrationsSource).toContain("b.name.trim().toLowerCase() === \"duke's cafe\"");
    expect(migrationsSource).toContain("b.city.trim().toLowerCase() === \"willow grove\"");
    expect(migrationsSource).not.toContain("DELETE FROM businesses WHERE");
  });

  it("maps the stored owner price label to the canonical client-facing key", () => {
    const policy = getBusinessExperiencePolicy("Food & Drink", "restaurant");
    expect(normalizeBusinessExperiencePriceKey(policy, "$$")).toBe("price_2");
    expect(normalizeBusinessExperiencePriceKey(policy, "price_3")).toBe("price_3");
    expect(normalizeBusinessExperiencePriceKey(policy, "unknown")).toBeNull();

    const route = source("../routes/community-feedback.ts");
    expect(route).toContain("normalizeBusinessExperiencePriceKey(policy, business.price_range)");
  });

  it("uses reviewed diaspora wording only when a member explicitly selects it", () => {
    const policy = getBusinessExperiencePolicy("Food & Drink", "restaurant");
    const localizedChoice = policy.reactionChoices.find((choice) => choice.variants.length > 0);
    expect(localizedChoice).toBeDefined();
    if (!localizedChoice) return;

    expect(resolveExperienceChoiceLabel(localizedChoice, "default")).toBe(localizedChoice.label);
    const variant = localizedChoice.variants[0]!;
    expect(resolveExperienceChoiceLabel(localizedChoice, variant.communityCode)).toBe(variant.label);
  });
});

describe("immediate positive-feedback governance", () => {
  it("limits allowlisted member selections without changing verification", () => {
    const route = source("../routes/community-feedback.ts");
    expect(route).toContain('vibe: 2');
    expect(route).toContain('reaction: 2');
    expect(route).toContain('price: 1');
    expect(route).toContain('status: "published_immediately"');
    expect(route).toContain('verificationEffect: "none"');
    expect(route).toContain("isExperienceChoiceAllowed");
    expect(route).not.toMatch(/UPDATE\s+businesses[\s\S]{0,300}(verified|verified_designations)/i);
  });

  it("keeps community-published listings unclaimed until a real owner claim succeeds", () => {
    const publication = source("../businessIntake/registerSubmissionRoutes.ts");
    expect(publication).toContain("'community','community_listed','unclaimed',NULL");
    expect(publication).toContain("added_by_member_id");
  });

  it("lets claimed owners set only category-aware tags and a valid price point", () => {
    const route = source("../routes/vibes.ts");
    expect(route).toContain("validVibes.length > 2");
    expect(route).toContain("policy.priceChoices.find");
    expect(route).toContain("price_range = CASE WHEN");
    expect(route).toContain("Choose a valid price point.");
  });
});

describe("public social-video provider contract", () => {
  it("recognizes only HTTPS public links from supported providers", () => {
    expect(detectSocialVideoPlatform("https://www.twitch.tv/example/clip/abc")).toBe("twitch");
    expect(detectSocialVideoPlatform("https://www.snapchat.com/spotlight/example")).toBe("snapchat");
    expect(detectSocialVideoPlatform("https://youtu.be/example")).toBe("youtube");
    expect(detectSocialVideoPlatform("http://twitch.tv/example")).toBeNull();
    expect(detectSocialVideoPlatform("https://twitch.tv.evil.example/video")).toBeNull();
  });

  it("sanitizes stored member platform choices", () => {
    expect(sanitizeSocialVideoPreferences(["twitch", "snapchat", "twitch", "unknown"])).toEqual([
      "twitch",
      "snapchat",
    ]);
    expect(sanitizeSocialVideoPreferences("twitch")).toBeNull();
  });

  it("retains Twitch and Snapchat in governed business submissions", () => {
    const intake = source("../businessIntake/types.ts");
    expect(intake).toContain('"twitch"');
    expect(intake).toContain('"snapchat"');
    expect(intake).toContain('"twitch.tv"');
    expect(intake).toContain('"snapchat.com"');
  });

  it("enforces provider hosts or owned ready uploads at the community post server boundary", async () => {
    const ownedUrl = "https://storage.example.test/member-upload.jpg";
    const lookup = async (_userId: string, urls: string[]) => new Set(
      urls.filter((url) => url === ownedUrl),
    );
    const accepted = await validateCommunityMediaUrls([
      "https://www.twitch.tv/example/clip/abc",
      "https://www.snapchat.com/spotlight/example",
      ownedUrl,
    ], "member-1", lookup);
    const rejected = await validateCommunityMediaUrls([
      "http://twitch.tv/example",
      "https://user:pass@twitch.tv/example",
      "https://twitch.tv.evil.example/video",
      "https://127.0.0.1/video",
      "https://example.com/arbitrary-video",
    ], "member-1", lookup);

    expect(accepted.urls).toEqual([
      "https://www.twitch.tv/example/clip/abc",
      "https://www.snapchat.com/spotlight/example",
      ownedUrl,
    ]);
    expect(accepted.rejected).toEqual([]);
    expect(rejected.urls).toEqual([]);
    expect(rejected.rejected).toHaveLength(5);
  });
});

describe("owner-provided support designations", () => {
  it("offers an inclusive governed taxonomy with stable filter IDs", () => {
    expect(OWNERSHIP_DESIGNATIONS.length).toBeGreaterThan(20);
    expect(ownershipDesignationFilterId("Woman-Owned")).toBe("woman");
    expect(ownershipDesignationFilterId("LGBTQIA+-Owned")).toBe("lgbtqia");
    expect(ownershipDesignationFilterId("Veteran-Owned")).toBe("veteran");
    expect(ownershipDesignationFilterId("Disability-Owned")).toBe("disability");
    const governedLabels: readonly string[] = OWNERSHIP_FILTER_OPTIONS.map((item) => item.label);
    expect(governedLabels).not.toContain("Not a governed label");
  });

  it("keeps owner self-identification searchable but separate from verification", () => {
    const route = source("../routes/business-identity.ts");
    expect(route).toContain("OWNERSHIP_DESIGNATIONS");
    expect(route).toContain("ownershipDesignations: data.ownershipBadges");
    expect(route).toContain("business_owner_links");
    expect(route).not.toMatch(/verified_designations\s*=/);
  });

  it("requires an approved unrevoked owner link for identity, price, tags, and featured videos", () => {
    const identity = source("../routes/business-identity.ts");
    const vibes = source("../routes/vibes.ts");
    const featuredVideo = source("../routes/featured-video.ts");
    for (const route of [identity, vibes, featuredVideo]) {
      expect(route).toContain("business_owner_links");
      expect(route).toContain("bol.role = 'owner'");
      expect(route).toContain("bol.status = 'approved'");
      expect(route).toContain("bol.revoked_at IS NULL");
    }
    expect(identity).not.toContain("submittedById");
    expect(vibes).not.toContain("b.submitted_by_id = $2");
    expect(featuredVideo).not.toContain("submittedById");
  });
});

describe("founder inventory remains review-only", () => {
  it("stages every candidate without a business or resource publication statement", () => {
    const importer = source("../../../../scripts/src/stage-directory-import.ts");
    expect(importer).toContain("const EXPECTED_ROWS = 18_051");
    expect(importer).toContain("const EXPECTED_LINK_ROWS = 7_455");
    expect(importer).toContain("publicationWrites: 0");
    expect(importer).toContain("directory_import_candidates");
    expect(importer).toContain("REVIEW_REQUIRED_LINK_RESULTS");
    expect(importer).toContain('reasons.push("regulated_profession")');
    expect(importer).toContain('reasons.push("ownership_evidence_review")');
    expect(importer).toContain('reasons.push("duplicate_within_batch")');
    expect(importer).toContain('candidate.offlineProductionNameMatch === "YES"');
    expect(importer).toContain('candidate.requestedAction === "RECONCILE_EXISTING_RECORD"');
    expect(importer).toContain('status = \'needs_research\'');
    expect(importer).toContain('"existing_record_match"');
    expect(importer).toContain('await client.query("BEGIN")');
    expect(importer.indexOf("assertLocalDirectoryStagingFromProcess()")).toBeLessThan(importer.indexOf("pool.connect()"));
    expect(importer).toContain('await insertChunk(client, batchId, chunk)');
    expect(importer).toContain('Number(stagedCount.rows[0]?.count ?? 0) !== EXPECTED_ROWS');
    expect(importer).toContain("SET status = CASE WHEN status = 'completed' THEN status ELSE 'in_review' END");
    expect(importer).toContain('await client.query("COMMIT")');
    expect(importer).toContain('await client.query("ROLLBACK")');
    expect(importer).not.toMatch(/INSERT\s+INTO\s+(businesses|resources|community_resources)/i);
  });

  it("enables review routes only in staging and verifies required schema before listen", () => {
    const app = source("../app.ts");
    const index = source("../index.ts");
    const migrations = source("../lib/startup-migrations.ts");
    expect(app).toContain("assertDirectoryReviewLocalStaging(process.env)");
    expect(index).toContain("const directoryReviewEnabled = assertDirectoryReviewLocalStaging(process.env)");
    expect(index).toContain("await ensureRequiredPublicationSchema(");
    expect(index.indexOf("await ensureRequiredPublicationSchema(")).toBeLessThan(index.indexOf("app.listen(port"));
    expect(index).toContain('const host = process.env["HOST"]?.trim() || undefined');
    expect(index).toContain("app.listen(port, host, onListening)");
    expect(index).toContain(": app.listen(port, onListening)");
    expect(migrations).toContain("Directory publication schema verification failed");
    expect(migrations).toContain("business_publication_identities");
    expect(migrations).toContain('migration.name === "businesses_listing_status_col"');
    expect(migrations.indexOf("await pool.query(listingStatusMigration.sql)")).toBeLessThan(
      migrations.indexOf("await ensureBetaSafetyColumns(log, strictWarn)"),
    );
    const requiredPublicationSection = migrations.slice(
      migrations.indexOf("export async function ensureRequiredPublicationSchema"),
      migrations.indexOf("export async function runStartupMigrations"),
    );
    expect(requiredPublicationSection).toContain("await ensureCanonicalRecordLocations(log, strictWarn)");
    expect(requiredPublicationSection).not.toContain("await ensureLocationFirstDiscovery(log, strictWarn)");
    const publication = source("../directoryImport/registerDirectoryImportRoutes.ts");
    expect(publication).toContain("hostname: address");
    expect(publication).toContain("servername: secure ? url.hostname : undefined");
    expect(publication).toContain("areDirectoryEvidenceAddressesPublic(addresses.map((item) => item.address))");
    expect(publication).toContain("published_record_type = $6::text");
    expect(publication).toContain("published_record_id = $7::text");
    expect(publication).toContain("THEN $7::varchar ELSE matched_business_id END");
    const database = source("../../../../lib/db/src/index.ts");
    expect(database).toContain('typeof value === "function" ? value.bind(instance) : value');
  });
});
