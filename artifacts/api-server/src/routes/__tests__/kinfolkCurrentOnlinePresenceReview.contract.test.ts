import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(__dirname, "../../../../..");
const adminRoute = readFileSync(resolve(repositoryRoot, "artifacts/api-server/src/routes/admin.ts"), "utf8");
const serverStartup = readFileSync(resolve(repositoryRoot, "artifacts/api-server/src/index.ts"), "utf8");
const serverApp = readFileSync(resolve(repositoryRoot, "artifacts/api-server/src/app.ts"), "utf8");
const deletionHoldWorker = readFileSync(resolve(repositoryRoot, "artifacts/api-server/src/businesses/businessDeletionHold.ts"), "utf8");
const reviewModule = readFileSync(resolve(repositoryRoot, "artifacts/api-server/src/businesses/kinfolkCurrentOnlinePresenceReview.ts"), "utf8");
const claimsRoute = readFileSync(resolve(repositoryRoot, "artifacts/api-server/src/routes/claims.ts"), "utf8");
const cityLaunchRoute = readFileSync(resolve(repositoryRoot, "artifacts/api-server/src/routes/city-launch.ts"), "utf8");
const startupMigrations = readFileSync(resolve(repositoryRoot, "artifacts/api-server/src/lib/startup-migrations.ts"), "utf8");

describe("Kinfolk Current online-presence review route", () => {
  it("installs only data-neutral queue structures before traffic", () => {
    expect(serverStartup).toContain("ensureKinfolkCurrentOnlinePresenceReviewSchema(pool)");
    expect(serverStartup).toContain("Kinfolk Current online-presence review schema ready before traffic acceptance");
  });

  it("requires an evidence-bearing manifest and rechecks live catalog scope before any mutation", () => {
    expect(adminRoute).toContain('router.post("/admin/businesses/kinfolk-current/online-presence-apply"');
    expect(adminRoute).toContain("parseKinfolkCurrentOnlinePresenceManifest");
    expect(adminRoute).toContain("APPROVED_KINFOLK_CURRENT_ONLINE_PRESENCE_MANIFEST_FINGERPRINTS");
    expect(adminRoute).toContain("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(adminRoute).toContain("FOR UPDATE");
    expect(adminRoute).toContain("currentKinfolkIds");
    expect(adminRoute).toContain("The website changed after screening.");
    expect(adminRoute).toContain("The verified official social URL changed after screening.");
    expect(adminRoute).toContain("The business identity, website, or social links changed after screening.");
    expect(adminRoute).toContain("currentSnapshotHash: item.currentSnapshotHash");
    expect(serverApp).toContain('"/api/admin/businesses/kinfolk-current/online-presence-apply"');
    expect(serverApp).toContain('express.json({ limit: "3mb" })');
  });

  it("removes only a broken website where social remains active and preserves an immutable receipt", () => {
    expect(adminRoute).toContain("SET website = NULL");
    expect(adminRoute).toContain("website_cleanup_status = 'inactive_broken'");
    expect(adminRoute).toContain("business_website_cleanup_audit_events");
    expect(adminRoute).toContain("verifiedOfficialSocial");
  });

  it("uses a reversible Delete Review queue and restores the exact prior listing state", () => {
    expect(adminRoute).toContain("kinfolk_current_online_presence_reviews");
    expect(adminRoute).toContain("ON CONFLICT (business_id) DO NOTHING");
    expect(adminRoute).toContain("KINFOLK_CURRENT_DELETE_REVIEW_LISTING_STATUS");
    expect(adminRoute).toContain('router.patch("/admin/businesses/kinfolk-current/delete-review/restore"');
    expect(adminRoute).toContain("original_listing_state");
    expect(adminRoute).toContain("state = 'restored'");
    expect(adminRoute).toContain("KINFOLK_CURRENT_DELETE_REVIEW_DELETION_HOLD_REASON");
    expect(adminRoute).toContain("INSERT INTO business_deletion_holds");
    expect(adminRoute).toContain("recordBusinessDeletionHoldEvent(client");
    expect(adminRoute).not.toContain("DELETE FROM businesses WHERE id = ANY($1::text[])");
  });

  it("prevents queued review records from falling through generic lifecycle or deletion paths", () => {
    expect(adminRoute).toContain("A Kinfolk Current Delete Review record must be restored or specifically resolved through review before permanent deletion can be scheduled.");
    expect(adminRoute).toContain("can only be restored through its dedicated review control");
    expect(adminRoute).toContain("cancelBusinessDeletionHold(client");
    expect(deletionHoldWorker).toContain("Business is in Kinfolk Current Delete Review and cannot be permanently deleted");
    expect(deletionHoldWorker).toContain("KINFOLK_CURRENT_DELETE_REVIEW_DELETION_HOLD_REASON");
    expect(deletionHoldWorker).toContain("kinfolkCurrentOnlinePresenceReview: onlinePresenceReviewSnapshot");
    expect(reviewModule).toContain("prevent_queued_kinfolk_current_review_deletion");
    expect(reviewModule).toContain("BEFORE DELETE ON businesses");
    expect(reviewModule).toContain("prevent_queued_kinfolk_current_review_lifecycle_mutation");
    expect(reviewModule).toContain("BEFORE UPDATE OF listing_status, status, promotion_eligible, featured, promoted_until ON businesses");
    expect(adminRoute).toContain("set_config('app.kinfolk_current_review_lifecycle_transition', 'apply', true)");
    expect(adminRoute).toContain("set_config('app.kinfolk_current_review_lifecycle_transition', 'restore', true)");
    expect(claimsRoute).toContain("Resolve or restore that review before changing claim lifecycle state.");
    expect(cityLaunchRoute).toContain("kinfolk_current_online_presence_reviews review");
    expect(startupMigrations).toContain("kinfolk_current_online_presence_reviews review");
  });
});
