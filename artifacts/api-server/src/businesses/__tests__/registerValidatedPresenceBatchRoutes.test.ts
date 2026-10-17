import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { registerValidatedPresenceBatchRoutes } from "../registerValidatedPresenceBatchRoutes";

const inputRow = {
  originalRowNumber: 2,
  businessName: "Community Books",
  city: "Philadelphia",
  state: "PA",
  phone: "215-555-0100",
  authorizedOwnershipStatus: "Black / African American-Owned",
  authorizedOwnershipBasis: "The retained source explicitly identifies the business as Black-owned.",
  authorizedOwnershipSourceName: "Validated directory source",
  authorizedOwnershipSourceEvidence: "The source names Community Books and marks it Black-owned.",
  qualifyingPresenceType: "website; social",
  qualifyingUrls: "https://communitybooks.example | https://www.instagram.com/communitybooks",
  validationRoute: "Validated official presence from the recorded source.",
  validationTier: "Likely business-controlled website or name-matched social profile.",
  businessNameEvidence: "Community Books appears on the official site.",
  locationEvidence: "Philadelphia appears on the official site.",
  sourceUrl: "https://directory.example/community-books",
  auditCaveat: "Website/social confirmation only. No record changed during validation.",
};

const matchedBusiness = {
  id: "business-1",
  name: "Community Books",
  city: "Philadelphia",
  state: "PA",
  phone: null,
  website: null,
  instagram: null,
  tiktok: null,
  facebook: null,
  twitter: null,
  youtube: null,
  pinterest: null,
  description: null,
  address: "123 Walnut Street",
  hours: null,
  price_range: null,
  category: "Books & Media",
  subcategory: "Bookstore",
  tags: [],
  vibes: [],
  ownership_designations: [],
  listing_status: "archived",
  status: "suspended",
  promotion_eligible: false,
  featured: false,
  promoted_until: null,
  is_duplicate: false,
  permanently_hidden: false,
  permanently_closed: false,
  catalog_state: "ready",
  is_kinfolk_current: true,
  in_delete_queue: false,
  in_delete_review: false,
  archive_before_state: {
    listingStatus: "live_unclaimed",
    status: "active",
    promotionEligible: false,
    featured: false,
    promotedUntil: null,
  },
};

function makeDatabase(overrides: Partial<typeof matchedBusiness> = {}) {
  const query = vi.fn(async (statement: string) => {
    if (statement.includes("FROM businesses b")) return { rows: [{ ...matchedBusiness, ...overrides }] };
    if (statement.includes("UPDATE businesses SET")) return { rows: [{ ...matchedBusiness, ...overrides, ownership_designations: ["Black / African American-Owned"] }] };
    if (statement.includes("INSERT INTO business_catalog_cohort_memberships")) return { rows: [{ business_id: "business-1", state: "removed", reason: "outside Kinfolk Current" }] };
    return { rows: [] };
  });
  const client = { query, release: vi.fn() };
  return { query, connect: vi.fn().mockResolvedValue(client), client };
}

function appWith(role: "admin" | "member", database = makeDatabase()) {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: "admin-user", role, email: `${role}@example.test` } as any;
    req.log = { error: vi.fn() } as any;
    next();
  });
  registerValidatedPresenceBatchRoutes(app, database as any);
  return { app, database };
}

describe("validated presence batch routes", () => {
  it("requires an administrator before previewing or applying any row", async () => {
    const { app, database } = appWith("member");
    await request(app).post("/admin/businesses/validated-presence-batch/preview").send({ rows: [inputRow] }).expect(403);
    await request(app).post("/admin/businesses/validated-presence-batch/apply").send({ rows: [inputRow] }).expect(403);
    expect(database.query).not.toHaveBeenCalled();
  });

  it("previews an exact archive match without writing, and reports its audited lifecycle/catalog actions", async () => {
    const { app, database } = appWith("admin");
    const response = await request(app).post("/admin/businesses/validated-presence-batch/preview").send({ rows: [inputRow] }).expect(200);
    expect(response.body).toMatchObject({ rowCount: 1, readyCount: 1, skippedCount: 0, confirmation: "APPLY 1 VALIDATED PRESENCE RECORD" });
    expect(response.body.candidates[0]).toMatchObject({
      status: "ready",
      businessId: "business-1",
      restorePublicListing: true,
      excludeFromKinfolkCurrent: true,
    });
    expect(database.connect).not.toHaveBeenCalled();
    expect(database.query.mock.calls.some(([statement]: [string]) => /^\s*UPDATE businesses/i.test(statement))).toBe(false);
  });

  it("requires the untouched preview fingerprint and exact confirmation before applying the small batch", async () => {
    const { app, database } = appWith("admin");
    const preview = await request(app).post("/admin/businesses/validated-presence-batch/preview").send({ rows: [inputRow] }).expect(200);
    await request(app)
      .post("/admin/businesses/validated-presence-batch/apply")
      .send({ rows: [inputRow], batchFingerprint: preview.body.batchFingerprint, confirmation: preview.body.confirmation })
      .expect(200);
    const statements = database.query.mock.calls.map(([statement]: [string]) => statement);
    expect(statements).toContain("BEGIN ISOLATION LEVEL SERIALIZABLE");
    expect(statements).toContain("COMMIT");
    expect(statements.some((statement: string) => statement.includes("business_profile_field_receipts"))).toBe(true);
    expect(statements.some((statement: string) => statement.includes("business_admin_ownership_source_receipts"))).toBe(true);
    expect(statements.some((statement: string) => statement.includes("business_listing_status_audit_events"))).toBe(true);
    expect(statements.some((statement: string) => statement.includes("business_catalog_cohort_audit_events"))).toBe(true);
    expect(statements.some((statement: string) => statement.includes("DELETE FROM businesses"))).toBe(false);
  });

  it("holds active Delete Queue records and permits an approved Minority-Owned row with a public receipt", async () => {
    const { app } = appWith("admin", makeDatabase({ in_delete_queue: true }));
    const preview = await request(app).post("/admin/businesses/validated-presence-batch/preview").send({ rows: [inputRow] }).expect(200);
    expect(preview.body.candidates[0]).toMatchObject({ status: "skipped", reason: expect.stringContaining("Delete Queue") });
    const approved = await request(appWith("admin").app).post("/admin/businesses/validated-presence-batch/preview")
      .send({ rows: [{ ...inputRow, authorizedOwnershipStatus: "Minority-Owned" }] })
      .expect(200);
    expect(approved.body.candidates[0]).toMatchObject({ status: "ready", proposedFields: expect.arrayContaining(["ownership_designations"]) });
  });

  it("limits a local-source row to directly validated presence and leaves ownership unchanged", async () => {
    const { app } = appWith("admin");
    const preview = await request(app).post("/admin/businesses/validated-presence-batch/preview")
      .send({ rows: [{ ...inputRow, sourceUrl: "CURRENT_LOCAL_SEARCH" }] })
      .expect(200);
    expect(preview.body.candidates[0]).toMatchObject({ status: "ready" });
    expect(preview.body.candidates[0].proposedFields).toEqual(expect.arrayContaining(["website", "instagram"]));
    expect(preview.body.candidates[0].proposedFields).not.toEqual(expect.arrayContaining(["phone", "ownership_designations"]));
  });

  it("holds a legacy terminal state even when its listing status is archived", async () => {
    const { app, database } = appWith("admin", makeDatabase({ status: "removed", permanently_hidden: false, permanently_closed: false }));
    const preview = await request(app).post("/admin/businesses/validated-presence-batch/preview").send({ rows: [inputRow] }).expect(200);
    expect(preview.body.candidates[0]).toMatchObject({ status: "skipped", reason: expect.stringContaining("terminal lifecycle") });
    expect(database.connect).not.toHaveBeenCalled();
    expect(database.query.mock.calls.some(([statement]: [string]) => /^\s*UPDATE businesses/i.test(statement))).toBe(false);
  });
});
