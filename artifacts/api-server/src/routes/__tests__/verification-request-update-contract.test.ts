import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => {
  const updates: unknown[] = [];
  const dbUpdate = vi.fn(() => {
    const query: Record<string, unknown> = {
      set: (values: unknown) => {
        updates.push(values);
        return query;
      },
      where: () => query,
      returning: async () => [{ id: "verification-request", businessId: null }],
    };
    return query;
  });
  const multer = Object.assign(
    vi.fn(() => ({
      single: () => (_req: Request, _res: Response, next: NextFunction) =>
        next(),
    })),
    {
      memoryStorage: vi.fn(),
    },
  );
  return { dbUpdate, multer, updates };
});

vi.mock("@workspace/db", () => ({
  db: { update: harness.dbUpdate },
  verificationRequestsTable: { id: "id", createdAt: "created_at" },
  businessClaimsTable: {},
  businessesTable: { id: "id" },
  docusignEnvelopesTable: {},
}));
vi.mock("drizzle-orm", () => ({ and: vi.fn(), desc: vi.fn(), eq: vi.fn() }));
vi.mock("multer", () => ({ default: harness.multer }));
vi.mock("../../lib/adminAuth", () => ({ isAdmin: () => true }));
vi.mock("../../lib/objectStorage", () => ({ objectStorageClient: {} }));
vi.mock("../../lib/docusign", () => ({ createVerificationEnvelope: vi.fn() }));
vi.mock("../../lib/email", () => ({
  sendVerificationSubmissionAdminAlert: vi.fn(),
}));

import verificationRouter from "../verification";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((request: Request, _response: Response, next: NextFunction) => {
    (request as any).log = { error: vi.fn() };
    next();
  });
  app.use("/api", verificationRouter);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  harness.updates.splice(0);
});

describe("verification request admin update validation", () => {
  it.each([
    ["bodyless", undefined],
    ["empty object", {}],
    ["empty status", { status: "" }],
  ])("returns 400 without an update for a %s request", async (_label, body) => {
    let request = supertest(createApp()).patch(
      "/api/admin/verification-requests/verification-request",
    );
    if (body !== undefined) request = request.send(body);
    const response = await request;

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "status or adminNotes is required",
    });
    expect(harness.dbUpdate).not.toHaveBeenCalled();
  });

  it("keeps an empty admin note as an intentional update", async () => {
    const response = await supertest(createApp())
      .patch("/api/admin/verification-requests/verification-request")
      .send({ adminNotes: "" });

    expect(response.status).toBe(200);
    expect(harness.dbUpdate).toHaveBeenCalledTimes(1);
    expect(harness.updates).toEqual([{ adminNotes: "" }]);
  });
});
