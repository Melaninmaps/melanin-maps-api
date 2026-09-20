import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authorizeDirectoryOperator,
  signDirectoryServiceRequest,
} from "../directoryServiceAuth";

function request(overrides: Record<string, unknown> = {}) {
  const headers = (overrides.headers ?? {}) as Record<string, string>;
  return {
    method: "POST",
    originalUrl: "/api/admin/directory-reconciliation",
    body: { mode: "dry-run" },
    user: undefined,
    header(name: string) {
      return headers[name.toLowerCase()];
    },
    log: { info: vi.fn() },
    ...overrides,
  } as any;
}

describe("directory service authorization", () => {
  beforeEach(() => {
    process.env.DIRECTORY_SERVICE_TOKEN = "s".repeat(48);
    process.env.DIRECTORY_REVIEW_SIGNING_SECRET = "h".repeat(48);
  });

  it("requires both the bearer credential and timestamped HMAC", () => {
    const timestamp = new Date().toISOString();
    const nonce = "one-time-nonce-0001";
    const body = { mode: "dry-run" };
    const signature = signDirectoryServiceRequest(
      {
        timestamp,
        nonce,
        method: "POST",
        originalUrl: "/api/admin/directory-reconciliation",
        body,
      },
      process.env.DIRECTORY_REVIEW_SIGNING_SECRET!,
    );
    const result = authorizeDirectoryOperator(
      request({
        body,
        headers: {
          authorization: `Bearer ${process.env.DIRECTORY_SERVICE_TOKEN}`,
          "x-directory-service-timestamp": timestamp,
          "x-directory-service-nonce": nonce,
          "x-directory-service-signature": signature,
        },
      }),
    );
    expect(result).toEqual({
      ok: true,
      actorId: "directory-release-service",
      method: "service_hmac",
    });
  });

  it("rejects a replayed nonce", () => {
    const timestamp = new Date().toISOString();
    const nonce = "one-time-nonce-0002";
    const body = { mode: "dry-run" };
    const signature = signDirectoryServiceRequest(
      {
        timestamp,
        nonce,
        method: "POST",
        originalUrl: "/api/admin/directory-reconciliation",
        body,
      },
      process.env.DIRECTORY_REVIEW_SIGNING_SECRET!,
    );
    const req = () =>
      request({
        body,
        headers: {
          authorization: `Bearer ${process.env.DIRECTORY_SERVICE_TOKEN}`,
          "x-directory-service-timestamp": timestamp,
          "x-directory-service-nonce": nonce,
          "x-directory-service-signature": signature,
        },
      });
    expect(authorizeDirectoryOperator(req()).ok).toBe(true);
    expect(authorizeDirectoryOperator(req())).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("rejects an expired signature", () => {
    const timestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const nonce = "one-time-nonce-0003";
    const signature = signDirectoryServiceRequest(
      {
        timestamp,
        nonce,
        method: "POST",
        originalUrl: "/api/admin/directory-reconciliation",
        body: { mode: "dry-run" },
      },
      process.env.DIRECTORY_REVIEW_SIGNING_SECRET!,
    );
    expect(
      authorizeDirectoryOperator(
        request({
          headers: {
            authorization: `Bearer ${process.env.DIRECTORY_SERVICE_TOKEN}`,
            "x-directory-service-timestamp": timestamp,
            "x-directory-service-nonce": nonce,
            "x-directory-service-signature": signature,
          },
        }),
      ),
    ).toMatchObject({ ok: false, status: 401 });
  });
});