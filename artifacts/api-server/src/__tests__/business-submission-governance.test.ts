import express, { type Express, type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { registerSubmissionRoutes } from "../businessIntake/registerSubmissionRoutes";
import { SubmissionRepository, type Submission } from "../businessIntake/submissionRepository";
import { validateSubmission } from "../businessIntake/types";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

function submission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Community Books",
    category: "Books & Media",
    subcategory: "Bookstore",
    description: "A neighborhood bookstore.",
    address: "123 Main Street",
    city: "Philadelphia",
    state: "PA",
    postal_code: "19106",
    country: "USA",
    website: "https://communitybooks.example/",
    phone: "215-555-0100",
    social_profiles: { instagram: "https://www.instagram.com/communitybooks" },
    media_urls: ["https://cdn.example.test/business-photo.jpg"],
    ownership_designations: ["Black / African American-Owned"],
    price_range: "$$",
    hours: "Mon–Fri 9am–5pm",
    tags: ["books", "community"],
    latitude: "39.9526000",
    longitude: "-75.1652000",
    provider_place_id: "provider-place-1",
    location_source: "google_places",
    source_campaign: null,
    source_channel: "web",
    submitter_note: "Recommended by a member.",
    client_request_id: "request-00000001",
    submitted_by_id: "approved-member",
    status: "pending_review",
    reviewed_by_id: null,
    review_note: null,
    matched_business_id: null,
    created_at: "2026-09-04T12:00:00.000Z",
    updated_at: "2026-09-04T12:00:00.000Z",
    ...overrides,
  };
}

function repositoryMock(overrides: Record<string, unknown> = {}) {
  return {
    findPublishedDuplicate: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ submission: submission(), created: true }),
    logAuditEvent: vi.fn().mockResolvedValue(undefined),
    listBySubmitter: vi.fn().mockResolvedValue([submission()]),
    getOwnedById: vi.fn().mockResolvedValue(submission()),
    amendNeedsInfo: vi.fn().mockResolvedValue(submission({ status: "pending_review" })),
    list: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(submission()),
    getByIdForUpdate: vi.fn().mockResolvedValue(submission()),
    decide: vi.fn().mockResolvedValue(submission({ status: "published", matched_business_id: "published-business" })),
    ...overrides,
  };
}

function appWith(
  repository: ReturnType<typeof repositoryMock>,
  mode: "approved" | "unauthenticated" | "unapproved" = "approved",
  transactionPool?: unknown,
): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn() } as any;
    next();
  });
  const approvedMemberMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (mode === "unauthenticated") {
      res.status(401).json({ error: "Sign in to submit a business for review.", code: "AUTH_REQUIRED" });
      return;
    }
    if (mode === "unapproved") {
      res.status(403).json({ error: "An approved community account is required.", code: "ACCOUNT_APPROVAL_REQUIRED" });
      return;
    }
    req.user = { id: "approved-member", role: "tester" } as any;
    next();
  };
  registerSubmissionRoutes(app, {
    repository: repository as any,
    approvedMemberMiddleware,
    ...(transactionPool ? { transactionPool: transactionPool as any } : {}),
    geocode: vi.fn().mockResolvedValue({ lat: "39.95", lng: "-75.16" }),
  });
  return app;
}

describe("community business submission input", () => {
  it("normalizes supported socials and ownership while dropping all caller publication flags", () => {
    const input = validateSubmission({
      name: "  Community Books  ",
      category: "Books & Media",
      city: "Philadelphia",
      website: "communitybooks.example",
      instagram: "@communitybooks",
      tiktok: "@communitybooks",
      ownershipDesignations: ["black-owned", "woman-owned"],
      verified: true,
      status: "active",
      listingStatus: "live_claimed",
    });

    expect(input.website).toBe("https://communitybooks.example/");
    expect(input.socialProfiles).toEqual({
      instagram: "https://www.instagram.com/communitybooks",
      tiktok: "https://www.tiktok.com/@communitybooks",
    });
    expect(input.ownershipDesignations).toEqual([
      "Black / African American-Owned",
      "Woman-Owned",
    ]);
    expect(input).not.toHaveProperty("verified");
    expect(input).not.toHaveProperty("status");
    expect(input).not.toHaveProperty("listingStatus");
  });

  it("rejects unsafe, cross-platform, or incomplete URLs and coordinate pairs", () => {
    expect(() => validateSubmission({ name: "A", category: "B", city: "C", website: "javascript:alert(1)" })).toThrow("website must be a valid public web address");
    expect(() => validateSubmission({ name: "A", category: "B", city: "C", instagram: "https://facebook.com/not-instagram" })).toThrow("instagram must link to instagram.com");
    expect(() => validateSubmission({ name: "A", category: "B", city: "C", latitude: 39.9 })).toThrow("latitude and longitude");
    for (const website of [
      "https://localhost:3000/",
      "https://127.0.0.1/",
      "https://169.254.169.254/",
      "https://192.168.1.10/",
      "https://[::1]/",
    ]) {
      expect(() => validateSubmission({ name: "A", category: "B", city: "C", website })).toThrow("public web address");
    }
  });
});

describe("legacy route retirement", () => {
  it("keeps both historical mobile endpoints as review-queue adapters", () => {
    const businesses = source("../routes/businesses.ts");
    const legacyPost = businesses.slice(
      businesses.indexOf('router.post("/businesses", requireApprovedMember'),
      businesses.indexOf('router.patch("/businesses/:id/status"'),
    );
    const nominations = source("../routes/business-nominations.ts");
    const alternate = source("../routes/submit-business.ts");
    const startupMigrations = source("../lib/startup-migrations.ts");

    expect(legacyPost).toContain("communitySubmissionRepository.create");
    expect(legacyPost).not.toContain("insert(businessesTable)");
    expect(legacyPost).not.toContain("live_unclaimed");
    expect(legacyPost).not.toContain("body.isBlackOwned");
    expect(nominations).toContain('router.post("/business-nominations", requireApprovedMember');
    expect(nominations).toContain("communitySubmissionRepository.create");
    expect(nominations).toContain("...body");
    expect(nominations).toContain("ownershipDesignations: body.ownershipDesignations ?? []");
    expect(nominations).not.toContain("insert(businessesTable)");
    expect(nominations).not.toContain('status: "verified"');
    expect(alternate).toContain('router.post("/submit-business", requireApprovedMember');
    expect(alternate).toContain("communitySubmissionRepository.create");
    expect(alternate).not.toContain("contactMessagesTable");
    expect(startupMigrations).toContain("idx_community_business_submissions_pending_identity");
  });
});

describe("durable submission repository", () => {
  it("persists validated social/media/location fields only after confirming media ownership", async () => {
    const stored = submission();
    const query = vi.fn(async (sql: string, _values?: readonly unknown[]) => {
      if (sql.includes("FROM media_assets")) {
        return { rows: [{ public_url: stored.media_urls[0] }] };
      }
      if (sql.includes("INSERT INTO community_business_submissions")) {
        return { rows: [stored] };
      }
      return { rows: [] };
    });
    const repository = new SubmissionRepository({ query } as any);
    const result = await repository.create(validateSubmission({
      name: stored.name,
      category: stored.category,
      subcategory: stored.subcategory,
      city: stored.city,
      state: stored.state,
      postalCode: stored.postal_code,
      socialProfiles: stored.social_profiles,
      mediaUrls: stored.media_urls,
      latitude: Number(stored.latitude),
      longitude: Number(stored.longitude),
      providerPlaceId: stored.provider_place_id,
      clientRequestId: stored.client_request_id,
    }), "approved-member");

    expect(result).toEqual({ submission: stored, created: true });
    expect(query.mock.calls.some(([sql]) => sql.includes("purpose = 'business_submission'"))).toBe(true);
    const insert = query.mock.calls.find(([sql]) => sql.includes("INSERT INTO community_business_submissions"));
    expect(String(insert?.[0])).toContain("'pending_review'");
    expect(insert?.[1]).toEqual(expect.arrayContaining([
      "19106",
      JSON.stringify(stored.social_profiles),
      JSON.stringify(stored.media_urls),
      stored.provider_place_id,
      stored.client_request_id,
      "approved-member",
    ]));
  });

  it("rejects arbitrary media URLs that do not belong to the submitter", async () => {
    const query = vi.fn(async (_sql: string, _values?: readonly unknown[]) => ({ rows: [] }));
    const repository = new SubmissionRepository({ query } as any);

    await expect(repository.create(validateSubmission({
      name: "Community Books",
      category: "Books",
      city: "Philadelphia",
      mediaUrls: ["https://cdn.example.test/not-owned.jpg"],
    }), "approved-member")).rejects.toThrow("your completed business submission uploads");
    expect(query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO community_business_submissions"))).toBe(false);
  });
});

describe("POST /api/community/business-submissions", () => {
  it("rejects unauthenticated and unapproved callers before repository access", async () => {
    const unauthenticatedRepository = repositoryMock();
    const unauthenticated = await request(appWith(unauthenticatedRepository, "unauthenticated"))
      .post("/api/community/business-submissions")
      .send({ name: "A", category: "B", city: "C" });
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticatedRepository.create).not.toHaveBeenCalled();

    const unapprovedRepository = repositoryMock();
    const unapproved = await request(appWith(unapprovedRepository, "unapproved"))
      .post("/api/community/business-submissions")
      .send({ name: "A", category: "B", city: "C" });
    expect(unapproved.status).toBe(403);
    expect(unapprovedRepository.create).not.toHaveBeenCalled();
  });

  it("stores field-complete approved-member input as pending without opening a publish transaction", async () => {
    const repository = repositoryMock();
    const connect = vi.fn();
    const response = await request(appWith(repository, "approved", { connect }))
      .post("/api/community/business-submissions")
      .set("Idempotency-Key", "request-00000001")
      .send({
        name: "Community Books",
        category: "Books & Media",
        subcategory: "Bookstore",
        city: "Philadelphia",
        state: "PA",
        postalCode: "19106",
        socialProfiles: { instagram: "@communitybooks" },
        mediaUrls: ["https://cdn.example.test/business-photo.jpg"],
        latitude: 39.9526,
        longitude: -75.1652,
        providerPlaceId: "provider-place-1",
        locationSource: "google_places",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      submissionId: submission().id,
      status: "pending_review",
      duplicateRetry: false,
    });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      postalCode: "19106",
      socialProfiles: { instagram: "https://www.instagram.com/communitybooks" },
      mediaUrls: ["https://cdn.example.test/business-photo.jpg"],
      clientRequestId: "request-00000001",
    }), "approved-member");
    expect(connect).not.toHaveBeenCalled();
  });

  it("returns the original submission on retry rather than creating a second review item", async () => {
    const repository = repositoryMock({
      create: vi.fn().mockResolvedValue({ submission: submission(), created: false }),
    });
    const response = await request(appWith(repository))
      .post("/api/community/business-submissions")
      .send({ name: "Community Books", category: "Books", city: "Philadelphia", clientRequestId: "request-00000001" });

    expect(response.status).toBe(200);
    expect(response.body.duplicateRetry).toBe(true);
    expect(repository.logAuditEvent).not.toHaveBeenCalled();
  });
});

describe("member-owned submission status", () => {
  it("scopes list and detail requests to the authenticated submitter", async () => {
    const repository = repositoryMock();
    const list = await request(appWith(repository)).get("/api/community/business-submissions/mine");
    const detail = await request(appWith(repository)).get(`/api/community/business-submissions/${submission().id}`);

    expect(list.status).toBe(200);
    expect(detail.status).toBe(200);
    expect(list.body.submissions[0]).not.toHaveProperty("reviewed_by_id");
    expect(list.body.submissions[0]).not.toHaveProperty("submitted_by_id");
    expect(detail.body.submission).not.toHaveProperty("client_request_id");
    expect(repository.listBySubmitter).toHaveBeenCalledWith("approved-member");
    expect(repository.getOwnedById).toHaveBeenCalledWith(submission().id, "approved-member");
  });

  it("allows an owner amendment to return a needs-info submission to pending review", async () => {
    const repository = repositoryMock();
    const response = await request(appWith(repository))
      .patch(`/api/community/business-submissions/${submission().id}`)
      .send({ name: "Community Books", category: "Books", city: "Philadelphia" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("pending_review");
    expect(repository.amendNeedsInfo).toHaveBeenCalledWith(
      submission().id,
      "approved-member",
      expect.objectContaining({ name: "Community Books" }),
    );
    expect(repository.logAuditEvent).toHaveBeenCalledWith(
      submission().id,
      "approved-member",
      "member_resubmitted",
    );
  });
});

describe("founder atomic publication", () => {
  it("publishes one active community-listed unclaimed record and commits status together", async () => {
    const repository = repositoryMock();
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("INSERT INTO business_publication_identities")) return { rows: [{ business_id: "published-business" }] };
      if (sql.includes("INSERT INTO businesses")) return { rows: [{ id: "published-business" }] };
      return { rows: [] };
    });
    const release = vi.fn();
    const app = appWith(repository, "approved", { connect: vi.fn().mockResolvedValue({ query, release }) });
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "founder", role: "admin" } as any;
      next();
    });

    // Register a second isolated admin app so the admin identity is set before routes.
    const adminApp = express();
    adminApp.use(express.json());
    adminApp.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "founder", role: "admin" } as any;
      req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn() } as any;
      next();
    });
    registerSubmissionRoutes(adminApp, {
      repository: repository as any,
      transactionPool: { connect: vi.fn().mockResolvedValue({ query, release }) } as any,
      approvedMemberMiddleware: (_req, _res, next) => next(),
      geocode: vi.fn().mockResolvedValue({ lat: "39.95", lng: "-75.16" }),
    });

    const response = await request(adminApp)
      .post(`/api/founder/business-submissions/${submission().id}/decision`)
      .send({ status: "published", reviewNote: "Reviewed" });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("does not mark it verified");
    const businessInsert = query.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO businesses"));
    expect(String(businessInsert?.[0])).toContain("'active','live_unclaimed'");
    expect(String(businessInsert?.[0])).toContain("'community','community_listed','unclaimed'");
    expect(String(businessInsert?.[0])).toContain("'community','community_listed','unclaimed',NULL");
    expect(String(businessInsert?.[0])).toContain("normalized_name, dedupe_key");
    expect(String(businessInsert?.[0])).toContain("false");
    expect(String(businessInsert?.[0])).toContain("'[]'::jsonb,'[]'::jsonb,'[]'::jsonb");
    expect(query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO canonical_record_locations"))).toBe(true);
    expect(query.mock.calls.some(([sql]) => String(sql).includes("pg_advisory_xact_lock"))).toBe(true);
    expect(query.mock.calls.some(([sql]) => String(sql).includes("dedupe_key = $1"))).toBe(true);
    expect(repository.decide).toHaveBeenCalledWith(
      submission().id,
      "founder",
      expect.objectContaining({ status: "published", matchedBusinessId: "published-business" }),
      expect.anything(),
    );
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(expect.arrayContaining(["BEGIN", "COMMIT"]));
    expect(release).toHaveBeenCalledOnce();
  });

  it("rolls back and does not advance submission status when canonical insert fails", async () => {
    const repository = repositoryMock();
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("INSERT INTO business_publication_identities")) return { rows: [{ business_id: "published-business" }] };
      if (sql.includes("INSERT INTO businesses")) throw new Error("insert failed");
      return { rows: [] };
    });
    const release = vi.fn();
    const adminApp = express();
    adminApp.use(express.json());
    adminApp.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "founder", role: "admin" } as any;
      req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn() } as any;
      next();
    });
    registerSubmissionRoutes(adminApp, {
      repository: repository as any,
      transactionPool: { connect: vi.fn().mockResolvedValue({ query, release }) } as any,
      approvedMemberMiddleware: (_req, _res, next) => next(),
      geocode: vi.fn().mockResolvedValue({ lat: "39.95", lng: "-75.16" }),
    });

    const response = await request(adminApp)
      .post(`/api/founder/business-submissions/${submission().id}/decision`)
      .send({ status: "published" });

    expect(response.status).toBe(500);
    expect(repository.decide).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
  });
});
