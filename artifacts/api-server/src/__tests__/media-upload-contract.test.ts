import express, { type Express, type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MEDIA_UPLOAD_ERROR_CODES,
  registerMediaRoutes,
} from "../media/registerMediaRoutes";
import { getObjectStorageCredentialMode } from "../lib/objectStorage";

type FakeFile = {
  save: ReturnType<typeof vi.fn>;
  makePublic: ReturnType<typeof vi.fn>;
  getSignedUrl: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function createTestApp(file: FakeFile, authenticated = true): Express {
  const app = express();
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (authenticated) (req as any).user = { id: "media-contract-user" };
    (req as any).log = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    };
    next();
  });
  registerMediaRoutes(app, {
    storageClient: {
      bucket: () => ({ file: () => file as any }),
    } as any,
    recordAsset: vi.fn().mockResolvedValue(undefined),
  });
  return app;
}

function workingFile(): FakeFile {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    makePublic: vi.fn().mockResolvedValue(undefined),
    getSignedUrl: vi.fn().mockResolvedValue(["https://signed.example.test/private"]),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("OBJECT_STORAGE_CREDENTIAL_MODE", "adc");
  vi.stubEnv("DEFAULT_OBJECT_STORAGE_BUCKET_ID", "private-media-test");
  vi.stubEnv("PUBLIC_MEDIA_BUCKET_ID", "public-media-test");
  vi.stubEnv("MEDIA_PUBLICATION_MODE", "bucket_iam");
  vi.stubEnv("MEDIA_PUBLIC_BASE_URL", "https://cdn.example.test/community");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("media readiness access", () => {
  it("requires an authenticated session before disclosing media readiness", async () => {
    const response = await request(createTestApp(workingFile(), false))
      .get("/api/media/readiness")
      .set("x-request-id", "readiness-auth-23");

    expect(response.status).toBe(401);
    expect(response.headers["x-request-id"]).toBe("readiness-auth-23");
    expect(response.body).toEqual({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
      requestId: "readiness-auth-23",
    });
    expect(JSON.stringify(response.body)).not.toContain("bucket");
  });
});

describe("POST /api/media/upload error contract", () => {
  it("accepts progressive JPEG MIME and does not call object ACL publication under bucket IAM", async () => {
    const file = workingFile();
    const response = await request(createTestApp(file))
      .post("/api/media/upload?purpose=community_post")
      .set("x-request-id", "jpeg-contract-123")
      .attach("file", Buffer.from("jpeg bytes"), { filename: "community.jfif", contentType: "image/pjpeg" });

    expect(response.status).toBe(201);
    expect(response.headers["x-request-id"]).toBe("jpeg-contract-123");
    expect(response.body).toMatchObject({ type: "image", requestId: "jpeg-contract-123" });
    expect(response.body.url).toMatch(/^https:\/\/cdn\.example\.test\/community\/media-uploads\/images\//);
    expect(file.save).toHaveBeenCalledWith(expect.any(Buffer), { contentType: "image/pjpeg" });
    expect(file.makePublic).not.toHaveBeenCalled();
  });

  it("returns a stable request-correlated missing-configuration error", async () => {
    vi.stubEnv("DEFAULT_OBJECT_STORAGE_BUCKET_ID", "");
    vi.stubEnv("PUBLIC_MEDIA_BUCKET_ID", "");
    vi.stubEnv("MEDIA_PUBLIC_BASE_URL", "");
    vi.stubEnv("MEDIA_PUBLICATION_MODE", "object_acl");

    const response = await request(createTestApp(workingFile()))
      .post("/api/media/upload?purpose=community_post")
      .set("x-request-id", "missing-storage-42")
      .attach("file", Buffer.from("jpeg"), { filename: "photo.jpg", contentType: "image/jpeg" });

    expect(response.status).toBe(503);
    expect(response.headers["x-request-id"]).toBe("missing-storage-42");
    expect(response.body).toEqual({
      error: "Media storage is not configured for this deployment. Contact support with the request ID.",
      code: MEDIA_UPLOAD_ERROR_CODES.STORAGE_NOT_CONFIGURED,
      requestId: "missing-storage-42",
    });
  });

  it("refuses object-ACL publication to the private bucket", async () => {
    vi.stubEnv("MEDIA_PUBLICATION_MODE", "object_acl");
    vi.stubEnv("MEDIA_PUBLIC_BASE_URL", "");
    vi.stubEnv("PUBLIC_MEDIA_BUCKET_ID", "private-media-test");
    const file = workingFile();

    const response = await request(createTestApp(file))
      .post("/api/media/upload?purpose=community_post")
      .attach("file", Buffer.from("jpeg"), { filename: "photo.jpg", contentType: "image/jpeg" });

    expect(response.status).toBe(503);
    expect(response.body.code).toBe(MEDIA_UPLOAD_ERROR_CODES.STORAGE_NOT_CONFIGURED);
    expect(file.save).not.toHaveBeenCalled();
    expect(file.makePublic).not.toHaveBeenCalled();
  });

  it("requires a valid service-account JSON object before reporting storage ready", async () => {
    vi.stubEnv("OBJECT_STORAGE_CREDENTIAL_MODE", "service_account_json");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", JSON.stringify({ type: "service_account", client_email: "media@example.test" }));
    const response = await request(createTestApp(workingFile())).get("/api/media/readiness");

    expect(response.status).toBe(503);
    expect(response.body.credentialMode).toBe("invalid");
    expect(JSON.stringify(response.body)).not.toContain("media@example.test");
  });

  it("distinguishes provider authentication failures without leaking provider messages", async () => {
    const file = workingFile();
    file.save.mockRejectedValue(Object.assign(new Error("private credential value"), { code: 401 }));
    const response = await request(createTestApp(file))
      .post("/api/media/upload?purpose=community_post")
      .set("x-request-id", "provider-auth-7")
      .attach("file", Buffer.from("jpeg"), { filename: "photo.jpeg", contentType: "image/jpeg" });

    expect(response.status).toBe(502);
    expect(response.body.code).toBe(MEDIA_UPLOAD_ERROR_CODES.STORAGE_AUTH_FAILED);
    expect(JSON.stringify(response.body)).not.toContain("private credential value");
  });

  it("distinguishes provider save failure from authentication failure", async () => {
    const file = workingFile();
    file.save.mockRejectedValue(Object.assign(new Error("internal provider detail"), { code: 503 }));
    const response = await request(createTestApp(file))
      .post("/api/media/upload?purpose=community_post")
      .attach("file", Buffer.from("jpeg"), { filename: "photo.jpg", contentType: "image/jpg" });

    expect(response.status).toBe(502);
    expect(response.body.code).toBe(MEDIA_UPLOAD_ERROR_CODES.STORAGE_SAVE_FAILED);
    expect(response.body.requestId).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toContain("internal provider detail");
  });

  it("returns publication failure and removes the orphan when object ACL publication fails", async () => {
    vi.stubEnv("MEDIA_PUBLICATION_MODE", "object_acl");
    vi.stubEnv("MEDIA_PUBLIC_BASE_URL", "");
    vi.stubEnv("PUBLIC_MEDIA_BUCKET_ID", "public-media-acl-test");
    const file = workingFile();
    file.makePublic.mockRejectedValue(Object.assign(new Error("ACL provider detail"), { code: 403 }));

    const response = await request(createTestApp(file))
      .post("/api/media/upload?purpose=community_post")
      .attach("file", Buffer.from("jpeg"), { filename: "photo.jpg", contentType: "image/jpeg" });

    expect(response.status).toBe(502);
    expect(response.body.code).toBe(MEDIA_UPLOAD_ERROR_CODES.PUBLICATION_FAILED);
    expect(file.delete).toHaveBeenCalledWith({ ignoreNotFound: true });
    expect(JSON.stringify(response.body)).not.toContain("ACL provider detail");
  });

  it("returns stable unsupported-type and image-size-limit codes", async () => {
    const app = createTestApp(workingFile());
    const unsupported = await request(app)
      .post("/api/media/upload?purpose=community_post")
      .attach("file", Buffer.from("plain"), { filename: "notes.txt", contentType: "text/plain" });
    expect(unsupported.status).toBe(415);
    expect(unsupported.body.code).toBe(MEDIA_UPLOAD_ERROR_CODES.UNSUPPORTED_TYPE);

    const oversized = await request(app)
      .post("/api/media/upload?purpose=community_post")
      .attach("file", Buffer.alloc(10 * 1024 * 1024 + 1), { filename: "large.jpg", contentType: "image/jpeg" });
    expect(oversized.status).toBe(413);
    expect(oversized.body.code).toBe(MEDIA_UPLOAD_ERROR_CODES.SIZE_LIMIT);
  });
});

describe("object storage credential portability", () => {
  it("uses ADC by default outside Replit and allows an explicit Railway service-account JSON mode", () => {
    vi.stubEnv("REPL_ID", "");
    vi.stubEnv("REPLIT_DEPLOYMENT", "");
    vi.stubEnv("REPLIT_DOMAINS", "");
    vi.stubEnv("OBJECT_STORAGE_CREDENTIAL_MODE", "");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "");
    expect(getObjectStorageCredentialMode()).toBe("adc");

    vi.stubEnv("OBJECT_STORAGE_CREDENTIAL_MODE", "service_account_json");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", JSON.stringify({
      type: "service_account",
      project_id: "railway-project",
      client_email: "media@example.test",
      private_key: "not-used-by-this-unit-test",
    }));
    expect(getObjectStorageCredentialMode()).toBe("service_account_json");
  });

  it("preserves automatic Replit sidecar selection when Replit metadata is present", () => {
    vi.stubEnv("OBJECT_STORAGE_CREDENTIAL_MODE", "");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "");
    vi.stubEnv("REPL_ID", "replit-app-id");
    expect(getObjectStorageCredentialMode()).toBe("replit_sidecar");
  });
});
