import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transpileModule, ScriptTarget } from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteQueueConfirmation, removeFromDeleteQueueConfirmation,
  getDeleteQueueEligibleAt, isDeleteQueueEligible, ensureBusinessDeleteQueueSchema,
} from "../businesses/deleteQueue";
import { cancelBusinessDeletionHold, processDueBusinessDeletionHolds, startBusinessDeletionHoldWorker } from "../businesses/businessDeletionHold";
import { recordKinfolkCurrentOnlinePresenceReviewEvent } from "../businesses/kinfolkCurrentOnlinePresenceReview";

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const admin = source("../routes/admin.ts");
const review = source("../businesses/kinfolkCurrentOnlinePresenceReview.ts");
const queue = source("../businesses/deleteQueue.ts");
const worker = source("../businesses/businessDeletionHold.ts");
const startup = source("../index.ts");
const routes = admin.slice(admin.indexOf("// POST /admin/businesses/delete-queue —"), admin.indexOf("// PATCH /admin/businesses/:id/listing-status —", admin.indexOf("// POST /admin/businesses/delete-queue —")));
const routeJs = transpileModule(routes, { compilerOptions: { target: ScriptTarget.ES2022 } }).outputText;
const now = new Date("2026-10-16T12:00:00.000Z");
const originalReview = {
  business_id: "review-1", state: "queued",
  original_listing_state: { listingStatus: "live_unclaimed", status: "active", promotionEligible: true, featured: true, promotedUntil: "2026-10-20" },
  verification_evidence: { originalLinks: { website: "https://inactive.example" }, websiteVerification: { classification: "REMOVE_CONFIRMED_INACTIVE" } },
  source_manifest: { manifestFingerprint: "immutable-approved-manifest" },
};

// Evaluate only the actual dedicated handler source with entirely fake clients.
// No app/db module is imported and no connection, DDL, or data write can escape.
function harness(options: { held?: boolean; eligibleAt?: string; queuedReview?: boolean; linkedData?: boolean } = {}) {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  let reviewQueued = options.queuedReview ?? false;
  const entry = { business_id: "review-1", source_vault: "archive", eligible_at: options.eligibleAt ?? "2026-10-17T12:00:00.000Z", snapshot: { kinfolkCurrentOnlinePresenceReview: originalReview } };
  const business = {
    id: "review-1", name: "Black-owned retained business", listing_status: reviewQueued ? "staged" : "archived",
    status: "suspended", promotion_eligible: false, featured: false, promoted_until: null,
    is_duplicate: false, permanently_closed: false, snapshot: { id: "review-1", owner: "retained-owner", website: "https://inactive.example" },
  };
  const query = vi.fn(async (sql: string, _values?: unknown[]) => {
    if (sql.includes("DELETE FROM businesses") && options.linkedData) throw Object.assign(new Error("protected linked record"), { code: "23503" });
    if (sql.includes("SET state = 'transferred_to_delete_queue'")) reviewQueued = false;
    if (sql.includes("DELETE FROM business_deletion_holds")) return { rows: [{ delete_after: "2026-10-10", snapshot: { originalReview } }] };
    if (sql.includes("SELECT") && sql.includes("FROM business_delete_queue_entries") && !sql.includes("INSERT INTO")) {
      return { rows: options.held ? [{ ...entry, snapshot: entry, eligible: isDeleteQueueEligible(entry.eligible_at) }] : [] };
    }
    if (sql.includes("SELECT") && sql.includes("FROM kinfolk_current_online_presence_reviews")) {
      return { rows: reviewQueued ? [{ business_id: business.id, snapshot: originalReview }] : [] };
    }
    if (sql.includes("SELECT") && sql.includes("FROM business_inventory_cohort_receipts")) return { rows: [{ business_id: business.id, snapshot: { source: "protected-receipt" } }] };
    if (sql.includes("SELECT") && sql.includes("FROM businesses")) return { rows: [business] };
    return { rows: [] };
  });
  const client = { query, release: vi.fn() };
  const pool = { connect: vi.fn(async () => client) };
  const handlers = new Map<string, (req: any, res: any) => Promise<void>>();
  const router = { post: (path: string, handler: any) => handlers.set(path, handler), delete: (path: string, handler: any) => handlers.set(path, handler) };
  const dependencies = {
    router, pool, isAdmin: (req: any) => req.admin !== false, randomUUID: () => "audit-id",
    ensureBusinessDeleteQueueSchema: async () => {}, ensureListingStatusAuditSchema: async () => {},
    ensureBusinessDeletionHoldSchema: async () => {}, ensureKinfolkCurrentOnlinePresenceReviewSchema: async () => {},
    ensureKinfolkCurrentDeleteReviewTransferSchema: async () => {}, ensureBusinessPermanentDeletionAuditSchema: async () => {},
    cancelBusinessDeletionHold, recordKinfolkCurrentOnlinePresenceReviewEvent,
    recordListingStatusAudit: vi.fn(async () => {}), getDeleteQueueEligibleAt, isDeleteQueueEligible,
    deleteQueueConfirmation, removeFromDeleteQueueConfirmation,
    permanentDeletionConfirmation: (count: number) => `DELETE ${count} ${count === 1 ? "BUSINESS" : "BUSINESSES"}`,
  };
  new Function(...Object.keys(dependencies), routeJs)(...Object.values(dependencies));
  async function invoke(path: string, body: Record<string, unknown>, admin = true) {
    const res = { statusCode: 200, body: {} as any, status(code: number) { this.statusCode = code; return this; }, json(value: unknown) { this.body = value; return this; } };
    await handlers.get(path)!({ body, admin, user: { id: "founder" }, log: { info: vi.fn(), error: vi.fn() } }, res);
    return res;
  }
  return { invoke, query, pool, client };
}

afterEach(() => vi.useRealTimers());

describe("Delete Queue source safeguards", () => {
  it("isolates queue inventory from Archive, Duplicate, Permanently Closed, and Delete Review", () => {
    expect(admin).toContain('status === "delete_queue"');
    expect(admin).toContain("filters.push(`NOT (${activeDeleteQueuePredicate})`)");
    expect(admin).toContain("const permanentlyClosedInventoryWhere");
    expect(admin).toContain("deleteQueueTotal");
    expect(admin).toContain("to_regclass('public.business_delete_queue_entries')");
  });
  it("retains queued-review deletion/lifecycle guards without adding a bypass", () => {
    expect(review).toContain("prevent_queued_kinfolk_current_review_deletion");
    expect(review).toContain("NOT IN ('apply', 'restore')");
    expect(routes).not.toContain("set_config");
    expect(routes).not.toContain("DELETE FROM kinfolk_current_online_presence_reviews");
    expect(review).toContain("CHECK (state IN ('queued', 'restored', 'transferred_to_delete_queue'))");
    expect(queue).toContain("business_delete_queue_events are immutable");
    expect(queue).toContain("must remain nonpublic");
    expect(queue).toContain("original evidence and retention clock are immutable");
    expect(admin).toContain("queued_at + INTERVAL '168 hours' <= NOW()");
    expect(startup).not.toContain("ensureBusinessDeleteQueueSchema");
  });
  it("has no automatic due-hold deletion or expiry timer, including legacy queued reviews", async () => {
    const pool = { query: vi.fn(), connect: vi.fn() };
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    expect(await processDueBusinessDeletionHolds(pool as any, logger)).toEqual({ deleted: 0, missing: 0, blocked: 0 });
    startBusinessDeletionHoldWorker(pool as any, logger)();
    expect(pool.query).not.toHaveBeenCalled();
    expect(pool.connect).not.toHaveBeenCalled();
    expect(worker).not.toContain("DELETE FROM businesses");
    expect(worker).not.toContain("setInterval");
  });
  it("calculates seven full days and rejects invalid eligibility timestamps", () => {
    expect(getDeleteQueueEligibleAt(now).toISOString()).toBe("2026-10-23T12:00:00.000Z");
    expect(isDeleteQueueEligible("2026-10-23T12:00:00.000Z", new Date("2026-10-23T11:59:59.999Z"))).toBe(false);
    expect(isDeleteQueueEligible("2026-10-23T12:00:00.000Z", new Date("2026-10-23T12:00:00.000Z"))).toBe(true);
    expect(isDeleteQueueEligible("invalid", now)).toBe(false);
  });
  it("defines only additive schema structures using a fake client, never a backfill or automatic job", async () => {
    const query = vi.fn(async (_sql: string) => ({}));
    await ensureBusinessDeleteQueueSchema({ query });
    const sql = query.mock.calls.map((call) => String(call[0])).join("\n");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS business_delete_queue_entries");
    expect(sql).toContain("eligible_at >= queued_at + INTERVAL '168 hours'");
    expect(sql).not.toMatch(/(?:UPDATE|DELETE FROM) businesses/);
  });
});

describe("Delete Queue actual handlers with fake SQL clients", () => {
  it("transfers a queued review intact, cancels its legacy hold, and starts a fresh seven days without deleting anything", async () => {
    const h = harness({ queuedReview: true });
    const res = await h.invoke("/admin/businesses/delete-queue", { ids: ["review-1"], source: "kinfolk_current_delete_review", reason: "Founder review", confirmation: deleteQueueConfirmation(1) });
    expect(res.statusCode).toBe(200);
    expect(res.body.eligibleAt).toBe("2026-10-23T12:00:00.000Z");
    const calls = h.query.mock.calls;
    const sql = calls.map(([sql]) => sql);
    const resolved = sql.findIndex((statement) => statement.includes("SET state = 'transferred_to_delete_queue'"));
    const lifecycle = sql.findIndex((statement) => statement.includes("UPDATE businesses"));
    expect(resolved).toBeGreaterThan(sql.findIndex((statement) => statement.includes("DELETE FROM business_deletion_holds")));
    expect(lifecycle).toBeGreaterThan(resolved);
    expect(sql.join("\n")).not.toContain("DELETE FROM businesses");
    expect(sql.join("\n")).not.toContain("DELETE FROM kinfolk_current_online_presence_reviews");
    const receipt = calls.find(([statement]) => statement.includes("INSERT INTO business_delete_queue_entries"))!;
    expect(JSON.parse(String(receipt[1]?.[7])).kinfolkCurrentOnlinePresenceReview).toEqual(originalReview);
    expect(sql).toContain("COMMIT");
    expect(h.client.release).toHaveBeenCalled();
  });
  it("fails closed when the review-screen selection is stale", async () => {
    const h = harness();
    const res = await h.invoke("/admin/businesses/delete-queue", { ids: ["review-1"], source: "kinfolk_current_delete_review", reason: "Founder review", confirmation: deleteQueueConfirmation(1) });
    expect(res.statusCode).toBe(409);
    expect(h.query.mock.calls.some(([sql]) => sql.includes("UPDATE businesses"))).toBe(false);
    expect(h.query.mock.calls.map(([sql]) => sql)).toContain("ROLLBACK");
  });
  it("rejects unauthorized and unconfirmed destructive requests before any connection", async () => {
    const h = harness({ held: true, eligibleAt: "2026-10-09" });
    expect((await h.invoke("/admin/businesses/permanent", { ids: ["review-1"], reason: "Founder review" })).statusCode).toBe(400);
    expect((await h.invoke("/admin/businesses/delete-queue", { ids: ["review-1"] }, false)).statusCode).toBe(403);
    expect(h.pool.connect).not.toHaveBeenCalled();
  });
  it.each([undefined, "2026-10-23T12:00:00.000Z", "invalid"])("rejects nonqueued, held, or invalid-timestamp permanent deletion: %s", async (eligibleAt) => {
    const h = harness({ held: eligibleAt !== undefined, eligibleAt });
    const res = await h.invoke("/admin/businesses/permanent", { ids: ["review-1"], reason: "Founder review", confirmation: "DELETE 1 BUSINESS" });
    expect(res.statusCode).toBe(409);
    expect(h.query.mock.calls.some(([sql]) => sql.includes("DELETE FROM businesses"))).toBe(false);
  });
  it("removing a hold keeps lifecycle nonpublic and never restores the old reviewed state", async () => {
    const h = harness({ held: true });
    const res = await h.invoke("/admin/businesses/delete-queue/remove", { ids: ["review-1"], reason: "Retain record", confirmation: removeFromDeleteQueueConfirmation(1) });
    expect(res.statusCode).toBe(200);
    const sql = h.query.mock.calls.map(([sql]) => sql).join("\n");
    expect(sql).toContain("listing_status = 'archived', status = 'suspended'");
    expect(sql).toContain("promotion_eligible = false, featured = false, promoted_until = NULL");
    expect(sql).toContain("SET removed_at = NOW()");
    expect(sql).not.toContain("live_unclaimed");
    expect(sql).not.toContain("state = 'restored'");
    expect(sql).not.toContain("DELETE FROM businesses");
  });
  it("eligible separately confirmed deletion retains business, review, queue, and cohort evidence before non-cascading deletion", async () => {
    const h = harness({ held: true, eligibleAt: "2026-10-09" });
    const res = await h.invoke("/admin/businesses/permanent", { ids: ["review-1"], reason: "Founder review", confirmation: "DELETE 1 BUSINESS" });
    expect(res.statusCode).toBe(200);
    const calls = h.query.mock.calls;
    const audit = calls.find(([sql]) => sql.includes("INSERT INTO business_permanent_deletion_audit_events"))!;
    const snapshot = JSON.parse(String(audit[1]?.[4]));
    expect(snapshot.business.owner).toBe("retained-owner");
    expect(snapshot.inventoryCohortReceipt.source).toBe("protected-receipt");
    expect(snapshot.deleteQueueEntry.snapshot.kinfolkCurrentOnlinePresenceReview).toEqual(originalReview);
    const sql = calls.map(([sql]) => sql);
    expect(sql.findIndex((sql) => sql.includes("DELETE FROM businesses"))).toBeGreaterThan(sql.findIndex((sql) => sql.includes("INSERT INTO business_permanent_deletion_audit_events")));
    expect(sql.join("\n")).not.toContain("CASCADE");
    expect(sql).toContain("COMMIT");
  });
  it("protected linked data rolls back deletion, queue finalization, and audit changes together", async () => {
    const h = harness({ held: true, eligibleAt: "2026-10-09", linkedData: true });
    const res = await h.invoke("/admin/businesses/permanent", { ids: ["review-1"], reason: "Founder review", confirmation: "DELETE 1 BUSINESS" });
    expect(res.statusCode).toBe(409);
    const sql = h.query.mock.calls.map(([sql]) => sql);
    expect(sql).toContain("ROLLBACK");
    expect(sql).not.toContain("COMMIT");
  });
});
