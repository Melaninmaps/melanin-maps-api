import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const adminRoute = source("../routes/admin.ts");
const businessRoutes = source("../routes/businesses.ts");
const adminPublisher = source("../businesses/registerAdminPublishAndClaimRoutes.ts");
const migrations = source("../lib/startup-migrations.ts");
const businessSchema = source("../../../../lib/db/src/schema/businesses.ts");
const adminScreen = source("../../../web/src/pages/admin.tsx");
const adminAddBusiness = source("../../../web/src/components/AdminAddBusiness.tsx");
const adminEditBusiness = source("../../../web/src/components/AdminEditBusiness.tsx");
const publicBusinessDetail = source("../../../web/src/pages/business-detail.tsx");
const mobileBusinessHook = source("../../../mobile/hooks/useBusinesses.ts");
const publicDirectory = source("../../../web/src/pages/businesses.tsx");
const directoryAssembly = source("../../../../scripts/assemble-source-backed-directory-candidates.ts");

describe("administrator full-inventory and reversible duplicate controls", () => {
  it("returns one server-filtered page instead of sending the full inventory to the browser", () => {
    expect(adminRoute).toContain("const DEFAULT_INVENTORY_PAGE_SIZE = 50");
    expect(adminRoute).toContain("const MAX_INVENTORY_PAGE_SIZE = 500");
    expect(adminRoute).toContain("LIMIT $${filterParams.length + 1}");
    expect(adminRoute).toContain("OFFSET $${filterParams.length + 2}");
    expect(adminRoute).toContain("filteredTotal");
    expect(adminRoute).toContain("cityOptions");
    expect(adminRoute).toContain("serviceOptions");
    expect(adminRoute).toContain("inventoryIsTruncated");
    expect(adminRoute).toContain("inventoryLimit");
    expect(adminRoute).toContain("inventoryTotal");
    expect(adminRoute).toContain("SELECT COUNT(*)::text AS total FROM businesses");
    expect(adminRoute).not.toContain("ORDER BY created_at DESC\n       LIMIT 500");
  });

  it("keeps an incomplete additive metadata migration from hiding the full inventory", () => {
    expect(adminRoute).toContain("to_jsonb(businesses)->>'research_source_label'");
    expect(adminRoute).toContain("to_jsonb(businesses)->>'kinfolk_recommendation_reason'");
    expect(adminScreen).toContain("businessInventoryTotal");
    expect(adminScreen).toContain("businessLiveInventoryTotal");
    expect(adminScreen).toContain("Live business inventory");
    expect(adminScreen).toContain("businessInventoryTotalPages");
    expect(adminScreen).toContain("changeBusinessInventoryPage");
    expect(adminScreen).toContain("Loading business inventory");
    expect(adminScreen).toContain("Business inventory rows per page");
    expect(adminScreen).toContain("<option value={100}>100</option>");
    expect(adminScreen).toContain("<option value={500}>500</option>");
    expect(adminScreen).toContain("pageSize: requested === 500 || requested === 250 || requested === 100");
    expect(adminScreen).toContain("Inventory records");
    expect(adminScreen).toContain("live ·");
    expect(adminScreen).toContain("archived ·");
    expect(adminScreen).toContain("duplicates");
  });

  it("bounds exact source receipt enrichment and reports its remaining work separately from new profiles", () => {
    expect(adminRoute).toContain("selectSourceBackedEnrichmentBatch");
    expect(adminRoute).toContain("exactEnrichmentCursor");
    expect(adminRoute).toContain("remainingExactEnrichmentReceiptCount");
    expect(adminRoute).toContain("nextExactEnrichmentCursor");
    expect(adminRoute).toContain("exactMatchesForBatch");
    expect(adminRoute).toContain("legacyMinnesotaCanonicalsForBatch");
    expect(adminScreen).toContain("Existing source receipts to enrich");
    expect(adminScreen).toContain("remainingExactReceipts");
    expect(adminScreen).toContain("exactEnrichmentCursor");
    expect(adminScreen).toContain("while (remainingCreate > 0 || remainingExactReceipts > 0)");
    expect(adminScreen).toContain("exactEnrichmentCursor,");
    expect(adminScreen).toContain("skipExactEnrichment: exactEnrichmentComplete");
    expect(adminRoute).toContain("const skipExactEnrichment = apply && req.body?.skipExactEnrichment === true");
    expect(adminScreen).toContain("No records were merged or deleted");
  });

  it("indexes exact source receipts before a large protected batch is reconciled", () => {
    expect(migrations).toContain("businesses_source_url_receipt_idx");
    expect(migrations).toContain("businesses_research_source_url_receipt_idx");
    expect(migrations).toContain("businesses_active_normalized_name_idx");
    expect(migrations).toContain("CREATE INDEX CONCURRENTLY IF NOT EXISTS");
    expect(adminRoute).toContain("source_url = ANY($3::text[])");
    expect(adminRoute).toContain("research_source_url = ANY($3::text[])");
  });

  it("supports city, service, date-added, and selected-row archive controls in the web dashboard", () => {
    expect(adminScreen).toContain("All cities");
    expect(adminScreen).toContain("All business types and services");
    expect(adminScreen).toContain("businessServiceOptions");
    expect(adminScreen).toContain("applyBusinessInventoryFilters");
    expect(adminScreen).toContain("Added on or after");
    expect(adminScreen).toContain("Added on or before");
    expect(adminScreen).toContain("Archive selected");
    expect(adminScreen).toContain("api/admin/businesses/listing-status");
  });

  it("lets administrators combine multiple normalized city selections without mutating source cities", () => {
    expect(adminRoute).toContain("function parseAdminCityFilters");
    expect(adminRoute).toContain("REGEXP_REPLACE(BTRIM(COALESCE(city, ''))");
    expect(adminRoute).toContain("const cityFilters = parseAdminCityFilters(query.city)");
    expect(adminRoute).toContain("= ANY($${filterParams.length}::text[])");
    expect(adminRoute).toContain("ARRAY_AGG(DISTINCT BTRIM(city) ORDER BY BTRIM(city)) AS variants");
    expect(adminRoute).toContain("appliedFilters");
    expect(adminRoute).toContain("cityFilters,");
    expect(adminScreen).toContain("Cities (select one or more)");
    expect(adminScreen).toContain("toggleBusinessInventoryCity");
    expect(adminScreen).toContain('params.append("city", city)');
    expect(adminScreen).toContain("The inventory response did not confirm the city filter");
    expect(adminScreen).toContain("cityScopedBusinesses");
    expect(adminScreen).toContain("outside the selected city scope, so those rows were withheld");
    expect(adminRoute).toContain("Keep the social-platform alternatives grouped");
    expect(adminRoute).toContain("filters.push(\"(NULLIF(BTRIM(COALESCE(instagram");
  });

  it("keeps same-name duplicate review together with a safe server-side A–Z order", () => {
    expect(adminRoute).toContain('const sort = String(query.sort ?? "name_asc")');
    expect(adminRoute).toContain('sort === "name_asc"');
    expect(adminRoute).toContain("LOWER(name) ASC NULLS LAST, id ASC");
    expect(adminRoute).toContain("created_at DESC, id ASC");
    expect(adminScreen).toContain("Business name A–Z (default)");
    expect(adminScreen).toContain('useState<"added_desc" | "name_asc">("name_asc")');
    expect(adminScreen).toContain('params.set("sort", sortValue)');
  });

  it("opens one paginated full-management inventory while preserving status-specific safeguards", () => {
    expect(adminRoute).toContain('const status = String(query.status ?? "active")');
    expect(adminRoute).toContain("COALESCE(listing_status, 'live_unclaimed') <> 'archived'");
    expect(adminRoute).toContain("const liveInventoryWhere");
    expect(adminRoute).toContain("const archivedInventoryWhere");
    expect(adminRoute).toContain('status === "all"');
    expect(adminRoute).toContain('? "TRUE"');
    expect(adminRoute).toContain("listing_status, is_duplicate, phone");
    expect(adminRoute).toContain("isDuplicate: b.is_duplicate");
    expect(adminRoute).toContain("liveInventoryTotal");
    expect(adminRoute).toContain("archivedInventoryTotal");
    expect(adminRoute).toContain("publicDirectoryTotal");
    expect(adminRoute).toContain("kinfolkRecommendableTotal");
    expect(adminRoute).toContain("FROM public.public_businesses");
    expect(adminScreen).toContain('>("all")');
    expect(adminScreen).toContain('status: "all" as typeof bizStatusFilter');
    expect(adminScreen).toContain("All retained business records");
    expect(adminScreen).toContain("All businesses (");
    expect(adminScreen).toContain('const selectableBusinessRows = bizStatusFilter === "duplicates"');
    expect(adminScreen).toContain("disabled={!selectableBusinessRows.some((business) => business.id === biz.id)}");
    expect(adminScreen).toContain("Select all visible live listings");
    expect(adminScreen).toContain("Edit profile");
    expect(adminScreen).not.toContain("masterInventoryMode");
    expect(adminScreen).not.toContain("Review-only master list");
    expect(adminScreen).not.toContain("Status-specific actions remain protected");
    expect(adminScreen).toContain("Duplicate vault");
    expect(adminScreen).toContain("Archive vault");
    expect(adminScreen).toContain("Public Directory searchable");
    expect(adminScreen).toContain("Current Kinfolk catalog");
    expect(adminScreen).toContain("Archived records in master list");
    expect(adminScreen).toContain("Unhide / restore public listing");
  });

  it("keeps confirmed duplicates in their own all-status vault with guarded deletion only", () => {
    expect(adminRoute).toContain('status === "duplicates"');
    expect(adminRoute).toContain('const duplicateInventoryWhere = "COALESCE(is_duplicate, false) = true"');
    expect(adminRoute).toContain("duplicateInventoryTotal");
    expect(adminRoute).toContain("COALESCE(is_duplicate, false) = false");
    expect(adminScreen).toContain("Duplicate vault");
    expect(adminScreen).toContain("Duplicates &amp; review");
    expect(adminScreen).toContain("Permanently delete selected");
    expect(adminScreen).toContain("Outreach unavailable for retained duplicates");
    expect(adminScreen).toContain('tab !== "reviews" && tab !== "biz-review"');
    expect(adminScreen).toContain("<AdminBusinessReview embedded />");
    expect(adminRoute).toContain('router.delete("/admin/businesses/permanent"');
    expect(adminRoute).toContain("business_permanent_deletion_audit_events");
    expect(adminRoute).toContain("row.listing_status !== \"archived\" && !row.is_duplicate");
    expect(adminRoute).toContain("permanentDeletionConfirmation");
    expect(adminRoute).toContain("Deliberately no CASCADE");
  });

  it("shows administrators website and social links and can isolate missing websites", () => {
    for (const field of ["website", "instagram", "tiktok", "facebook", "twitter", "youtube", "pinterest"]) {
      expect(adminRoute).toContain(field);
      expect(adminScreen).toContain(field);
    }
    expect(adminScreen).toContain("Missing a website");
    expect(adminScreen).toContain("No website or social media");
    expect(adminScreen).toContain("No direct social URL saved (review queue)");
    expect(adminRoute).toContain('link === "social_missing"');
    expect(adminRoute).toContain("not that a business has no social presence");
    expect(adminScreen).toContain("Website &amp; social");
    expect(adminScreen).toContain("Select this page");
  });

  it("scopes source-directory social review to the selected retained batch", () => {
    expect(adminRoute).toContain("sourceBatch?: unknown");
    expect(adminRoute).toContain("const sourceBatch = String(query.sourceBatch ?? \"\").trim().slice(0, 160)");
    expect(adminRoute).toContain("COALESCE(intake_batch_reference, '') = ?");
    expect(adminRoute).toContain("sourceBatch: String(req.query.sourceBatch ?? \"\").trim()");
    expect(adminScreen).toContain("Source directory batch");
    expect(adminScreen).toContain("founder_city_directories_2026_09_27");
    expect(adminScreen).toContain('params.set("sourceBatch", sourceBatchValue)');
    expect(adminScreen).toContain('params.set("sourceBatch", bizSourceBatchFilter)');
    expect(adminScreen).toContain("The inventory response did not confirm the source-batch filter");
  });

  it("filters ownership only by documented Black, Hispanic, or no-tag states", () => {
    expect(adminRoute).toContain('const ownership = String(query.ownership ?? "all")');
    expect(adminRoute).toContain('ownership === "black"');
    expect(adminRoute).toContain('ownership === "hispanic"');
    expect(adminRoute).toContain('ownership === "no_tag"');
    expect(adminRoute).toContain("ownershipDesignationStorageValues");
    expect(adminRoute).toContain("jsonb_array_length(ownership_designations)");
    expect(adminScreen).toContain("Ownership tag");
    expect(adminScreen).toContain("Black / African American-Owned only");
    expect(adminScreen).toContain("Latino / Hispanic-Owned only");
    expect(adminScreen).toContain("No ownership tag");
    expect(adminScreen).toContain('params.set("ownership", ownershipValue)');
    expect(adminScreen).toContain("they never infer identity");
  });

  it("keeps the public directory ownership choices exact and in its API requests", () => {
    expect(publicDirectory).toContain("Black / African American-Owned");
    expect(publicDirectory).toContain("Latino / Hispanic-Owned");
    expect(publicDirectory).toContain("No ownership tag");
    expect(publicDirectory).toContain('params.set("designations", activeOwnership)');
    expect(publicDirectory).toContain('params.set("ownership", "no_tag")');
    expect(publicDirectory).toContain("hasNoRecordedOwnershipTag");
  });

  it("finds a listing by name, key phrase, tag, or public contact handle", () => {
    expect(adminScreen).toContain("Search a business name or key phrase");
    expect(adminScreen).toContain("Search business names and key phrases");
    expect(adminScreen).toContain("Press Enter or select Search");
    expect(adminScreen).toContain("placeholder:text-[#3A1F0E]/70");
    expect(adminScreen).toContain("[color-scheme:light]");
    for (const field of [
      "COALESCE(description, '') ILIKE",
      "COALESCE(tags::text, '') ILIKE",
      "COALESCE(vibes::text, '') ILIKE",
      "COALESCE(website, '') ILIKE",
      "COALESCE(instagram, '') ILIKE",
      "COALESCE(tiktok, '') ILIKE",
      "COALESCE(facebook, '') ILIKE",
    ]) {
      expect(adminRoute).toContain(field);
    }
    expect(adminRoute).toContain("function parseAdminBusinessSearchTerms");
    expect(adminRoute).toContain("function escapeAdminBusinessSearchTerm");
    expect(adminRoute).toContain("ILIKE ${parameter} ESCAPE");
    expect(adminScreen).toContain("Use quotes for one exact phrase");
  });

  it("publishes saved Admin links and profile categories to fresh web and mobile profile reads", () => {
    expect(businessRoutes).toContain('"/admin/businesses/:id/profile"');
    for (const field of ["website", "instagram", "tiktok", "facebook", "category", "subcategory"]) {
      expect(businessRoutes).toContain(`${field}: row.${field}`);
    }
    expect(businessRoutes).toContain("updatedAt: new Date()");
    expect(businessRoutes).toContain("sendDynamicJson(res, {");
    expect(businessRoutes).toContain("const [publicBusiness] = await attachPublicBusinessPresentation([toPublicBusinessRecord(business)]);");
    expect(adminEditBusiness).toContain("Profile saved with an audit receipt.");
    expect(publicBusinessDetail).toContain("refetchOnWindowFocus: true");
    expect(mobileBusinessHook).toContain("useFocusEffect");
    expect(mobileBusinessHook).toContain("/api/businesses/${id}");
  });

  it("keeps ordinary bulk removal reversible while permanent deletion is vault-only and audited", () => {
    expect(adminRoute).toContain("Select between 1 and 500 businesses.");
    expect(adminRoute).toContain("business_listing_status_audit_events");
    expect(adminRoute).toContain("remove_public_discovery");
    expect(adminScreen).toContain("research, source, or Kinfolk context");
    expect(adminRoute).toContain("Select between 1 and 500 archived or duplicate businesses.");
    expect(adminRoute).toContain("Permanent deletion is allowed only for records already in Archive vault or Duplicate vault.");
    expect(adminRoute).toContain("business_permanent_deletion_audit_events");
    expect(adminRoute).toContain('DELETE FROM businesses WHERE id = ANY($1::text[])');
    expect(adminRoute).not.toContain("DELETE FROM businesses CASCADE");
    expect(migrations).toContain("ensureBusinessPermanentDeletionAuditSchema");
  });

  it("retains a source cohort receipt in the private deletion audit before removing only its restrictive link", () => {
    expect(adminRoute).toContain("inventoryCohortReceipt");
    expect(adminRoute).toContain("FROM business_inventory_cohort_receipts");
    expect(adminRoute).toContain("DELETE FROM business_inventory_cohort_receipts WHERE business_id = ANY($1::text[])");
    expect(adminRoute).toContain("every other dependent record remains");
    expect(adminRoute).not.toContain("DELETE FROM business_inventory_cohort_receipts CASCADE");
  });

  it("exports the exact filtered inventory, Archive vault, or deliberate all-inventory scope", () => {
    expect(adminRoute).toContain("compileAdminBusinessInventoryFilters");
    expect(adminRoute).toContain("status !== \"all\"");
    expect(adminRoute).toContain("all-inventory-including-archive");
    expect(adminRoute).not.toContain(".limit(2000)");
    expect(adminScreen).toContain("Export current list CSV");
    expect(adminScreen).toContain("Export all + Archive CSV");
    expect(adminScreen).toContain("status: bizStatusFilter");
    expect(adminScreen).toContain("status=all&sort=name_asc");
  });

  it("restores only selected Archive vault records and leaves the remainder hidden", () => {
    expect(adminScreen).toContain("const restorableFilteredBiz");
    expect(adminScreen).toContain("const restoreSelectedBusinesses");
    expect(adminScreen).toContain("Unhide / restore selected (");
    expect(adminScreen).toContain("All other Archive vault records remain hidden.");
    expect(adminRoute).toContain("Bulk restore accepts only selected records from the Archive vault");
    expect(adminRoute).toContain('row.listing_status !== "archived"');
    expect(adminRoute).toContain("restore_public_discovery");
  });

  it("stores intake evidence and a Kinfolk recommendation context through an archive", () => {
    for (const field of [
      "researchSourceLabel",
      "researchSourceUrl",
      "kinfolkRecommendationReason",
      "intakeBatchReference",
    ]) {
      expect(businessSchema).toContain(field);
      expect(adminPublisher).toContain(field);
      expect(adminAddBusiness).toContain(field);
    }
    expect(migrations).toContain("ensureBusinessIntakeMetadataSchema");
    expect(migrations).toContain("kinfolk_recommendation_reason");
  });

  it("separates the protected historical cohort from the user-supplied national master by receipts", () => {
    expect(adminRoute).toContain('const intakeCohort = String(query.intakeCohort ?? "all").trim()');
    expect(adminRoute).toContain("COMPLETED_COHORT_MANIFEST_CHECKSUM");
    expect(adminRoute).toContain("directory_publication_provenance");
    expect(adminRoute).toContain("completed_cohort_directory_discovery_receipts");
    expect(adminRoute).toContain("national_diaspora_master_18294");
    expect(adminRoute).toContain("intakeCohortOptions");
    expect(adminScreen).toContain("Intake cohort");
    expect(adminScreen).toContain("Protected historical cohort (receipt-backed)");
    expect(adminScreen).toContain("User-supplied national master");
    expect(adminScreen).toContain("Filter businesses by receipt-backed intake cohort");
  });

  it("provides a separate Manus-created review list from affirmative creation receipts only", () => {
    expect(adminRoute).toContain('intakeCohort === "manus_created"');
    expect(adminRoute).toContain("const manusCreatedPredicateParts");
    expect(adminRoute).toContain("manus_created_provenance.outcome = 'created'");
    expect(adminRoute).toContain("manus_created_discovery_receipt.outcome = 'created'");
    expect(adminRoute).toContain("Manus-created research/imports (direct provenance)");
    expect(adminRoute).toContain("Manus-created direct provenance");
    expect(adminRoute).toContain("const isManusCreatedCohort");
    expect(adminRoute).toContain("Provenance narrows the selected inventory scope");
    expect(adminRoute).toContain("if (status === \"duplicates\")");
    expect(adminRoute).toContain("listing_status = 'archived' AND COALESCE(is_duplicate, false) = false");
    expect(adminScreen).toContain("Manus-created review");
    expect(adminScreen).toContain("Direct Manus research/import provenance");
    expect(adminScreen).toContain("Anything you already archived, hid, or retained as a duplicate is excluded here");
    expect(adminScreen).toContain("manus_created");
  });

  it("adds Kinfolk Current as a separately ready catalog without replacing the Admin workflow", () => {
    expect(adminRoute).toContain('intakeCohort === "kinfolk_current"');
    expect(adminRoute).toContain("const kinfolkCurrentPredicate");
    expect(adminRoute).toContain("FROM public.public_businesses AS current_kinfolk");
    expect(adminRoute).toContain('mwmKinfolkCatalogSqlPredicate("current_kinfolk.id")');
    expect(adminRoute).toContain('value: "kinfolk_current"');
    expect(adminRoute).toContain("Kinfolk Current — current public catalog");
    expect(adminRoute).toContain("count: kinfolkRecommendableTotal");
    expect(adminScreen).toContain('"kinfolk_current"');
    expect(adminScreen).toContain("const kinfolkCurrentCohortSelected");
    expect(adminScreen).toContain("Use the same filters, checkboxes, full editor, and reversible archive action");
    expect(adminScreen).toContain("onSaved={() => {");
    expect(adminScreen).toContain("await loadBusinesses();");
  });

  it("maintains a read-only eligibility operational ledger for reconciliation work", () => {
    expect(adminRoute).toContain('router.get("/admin/businesses/eligibility-ledger"');
    expect(adminRoute).toContain("official_presence_unresolved");
    expect(adminRoute).toContain("ownership_not_established");
    expect(adminRoute).toContain("identity_conflict");
    expect(adminRoute).toContain("website_removed");
    expect(adminScreen).toContain("Directory eligibility ledger");
    expect(adminScreen).toContain("socialOnlyPublic");
    expect(adminScreen).toContain("websiteRemoved");
  });

  it("preserves selected live rows and the active query across editor and page navigation", () => {
    expect(adminScreen).toContain("const deselectAllVisibleBusinessListings");
    expect(adminScreen).toContain("...previous,");
    expect(adminScreen).toContain("selectableBusinessRows.forEach((business) => next.delete(business.id));");
    expect(adminScreen).toContain("void loadBusinesses({ page: nextPage });");
    expect(adminScreen).not.toContain("setSelectedBusinessIds(new Set());\n    void loadBusinesses({ page: nextPage });");
    expect(adminScreen).toContain("onClose={() => setEditingBiz(null)}");
    expect(adminScreen).toContain("onSaved={() => {");
    expect(adminScreen).toContain("businessInventoryQueryRef.current");
  });

  it("keeps selections through search and filters until an administrator explicitly clears them", () => {
    expect(adminScreen).not.toContain("setBusinessInventoryPage(1);\n    setSelectedBusinessIds(new Set());\n    void loadBusinesses(query);");
    expect(adminScreen).toContain("const clearBusinessSelection = () => {");
    expect(adminScreen).toContain("onClick={clearBusinessSelection}");
    expect(adminScreen).toContain("Clear selection ({selectedVisibleBusinessCount})");
  });

  it("keeps archive, duplicate, and live status boundaries independent from each intake cohort", () => {
    expect(adminRoute).toContain("Provenance narrows the selected inventory scope");
    expect(adminRoute).toContain("listing_status = 'archived' AND COALESCE(is_duplicate, false) = false");
    expect(adminRoute).toContain("COALESCE(is_duplicate, false) = true");
    expect(adminScreen).toContain("status: next.status ?? bizStatusFilter");
    expect(adminScreen).toContain("Archive vault + a cohort shows only archived records from that cohort");
    expect(adminScreen).toContain("BUSINESS_CATEGORY_TAXONOMY.flatMap");
    expect(adminScreen).toContain("Existing legacy/imported values remain reviewable");
  });

  it("lets an administrator preview and explicitly reconcile each approved source cohort in retry-safe batches", () => {
    expect(adminRoute).toContain('router.post("/admin/directory-intake/source-backed"');
    expect(adminRoute).toContain("requestedBatch");
    expect(adminRoute).toContain("Unknown source-backed intake batch.");
    expect(adminRoute).toContain("requiresExplicitApply");
    expect(adminRoute).toContain("remainingCreateCount");
    expect(adminRoute).toContain("duplicateReviewCreatedCount");
    expect(adminRoute).toContain("heldForDescriptionCount");
    expect(adminRoute).toContain("transaction.insert(businessesTable).values(nextBatch.map");
    expect(adminRoute).toContain("all-or-nothing publication");
    expect(migrations).toContain("ALTER COLUMN duplicate_of_id TYPE text USING duplicate_of_id::text");
    expect(migrations).toContain("data_type = 'uuid'");
    expect(migrations).toContain("DROP VIEW IF EXISTS public.public_businesses");
    expect(adminRoute).toContain("REGEXP_REPLACE(LOWER(COALESCE(name, '')), '[^a-z0-9]+', '', 'g')");
    expect(adminRoute).toContain("dedupe_key = ANY($2::text[])");
    expect(adminScreen).toContain("Founder source directory intake");
    expect(adminScreen).toContain("api/admin/directory-intake/source-backed");
    expect(adminRoute).toContain("mnblackStatewideSourceBackedDirectoryCandidates");
    expect(adminScreen).toContain("MINNESOTA_SOURCE_INTAKE_BATCH");
    expect(adminScreen).toContain("mn_black_business_directory_statewide_2026_09_28");
    expect(adminScreen).toContain("SOURCE_DIRECTORY_INTAKE_BATCH_OPTIONS");
    expect(adminScreen).toContain("Founder 44-state directory source pack");
    expect(adminScreen).toContain("Reconcile a received source-backed directory batch");
    expect(adminScreen).toContain("Enrich exact receipts");
    expect(adminScreen).toContain("sourceDirectoryIntakeBatch");
    expect(adminScreen).toContain("searchable, unclaimed MWM profile");
    expect(adminRoute).toContain("address: retainedAddress");
    expect(adminRoute).toContain("country: retainedCountry");
    expect(adminRoute).toContain("startMinnesotaSourcePinResolution");
    expect(adminRoute).toContain("isMinnesotaSourceBatch");
    expect(adminRoute).toContain("const createdRows = nextBatch.length > 0");
    expect(adminRoute).toContain("matchedExisting.isDuplicate && matchedExisting.duplicateOfId");
    expect(adminRoute).toContain("existingById.get(matchedExisting.duplicateOfId)");
    expect(adminRoute).toContain("buildMinnesotaLegacyCanonicalReconciliations");
    expect(adminRoute).toContain("Current Minneapolis listing");
    expect(adminRoute).toContain("category: publicationFields.category");
    expect(adminRoute).toContain("sourceUrl: candidate.sourceListingUrl ?? candidate.sourceUrl");
    expect(adminRoute).toContain("source-backed directory listing");
    expect(adminRoute).toContain("business-specific detail text on a public card");
    expect(directoryAssembly).toContain("sourceDescription: existing.sourceDescription ?? incoming.sourceDescription ?? null");
    expect(directoryAssembly).toContain("mergeMissingCrawlEvidence");
  });

  it("treats a retained exact research receipt as source evidence, never as a name-only match", () => {
    expect(adminRoute).toContain("OR research_source_url = ANY($3::text[])");
    expect(adminRoute).toContain("sourceUrl: business.sourceUrl ?? business.researchSourceUrl");
    expect(adminRoute).toContain("sourceUrl: existing.sourceUrl ?? candidate.sourceListingUrl ?? candidate.sourceUrl");
    expect(adminRoute).toContain("exactMatchesByRecordAndReceipt");
    expect(adminRoute).toContain("for (const sourceReceipt of [existing.sourceUrl, existing.researchSourceUrl])");
    expect(adminRoute).toContain("const candidatesByListingUrl = new Map<string, SourceBackedDirectoryCandidate[]>()");
    expect(adminRoute).toContain("const candidate: SourceBackedDirectoryCandidate = matchingCandidates[0]!");
    expect(adminRoute).not.toContain("for (const match of plan.duplicateMatches)");
    expect(adminRoute).toContain("exactExistingEnrichedCount = exactMatchesForBatch.length");
    expect(adminRoute).toContain("exactEnrichmentReceiptKeys");
  });

  it("places only exact held source receipts into the reversible Archive vault", () => {
    expect(adminRoute).toContain('router.post("/admin/directory-intake/source-backed/quality-hold"');
    expect(adminRoute).toContain("heldSourceListingUrls.has(existing.sourceUrl ?? existing.researchSourceUrl!)");
    expect(adminRoute).toContain("!existing.isDuplicate");
    expect(adminRoute).toContain('existing.listingStatus !== "archived"');
    expect(adminRoute).toContain("Exact source listing URL only; no name-only, address-only, duplicate-vault, merge, or delete action.");
    expect(adminRoute).toContain("recordListingStatusAudit(client");
    expect(adminRoute).toContain("Held after source crawl: no business-specific source description.");
  });

  it("creates a map pin only from a successfully geocoded supplied street address", () => {
    expect(adminPublisher).toContain("const coordinates = input.address");
    expect(adminPublisher).toContain("if (coordinates)");
    expect(adminPublisher).not.toContain('return { lat: "0", lng: "0" }');
    expect(adminPublisher).toContain("searchable MWM profile without a map pin");
  });

  it("restores only retained approval sources with an audit trail", () => {
    expect(adminRoute).toContain('router.post("/admin/access/reconcile-retained"');
    expect(adminRoute).toContain("RETAINED_ACCESS_CANDIDATES_SQL");
    expect(adminRoute).toContain("u.role = 'admin'");
    expect(adminRoute).toContain("u.tester_status = 'active'");
    expect(adminRoute).toContain("w.status = 'approved'");
    expect(adminRoute).toContain("SET approved = TRUE");
    expect(adminRoute).toContain("admin_access_reconciliation_audit_events");
    expect(adminRoute).toContain("requiresExplicitApply: true");
    expect(adminScreen).toContain("Restore retained access");
  });

});
