import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { isAdmin } from "../lib/adminAuth";

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const usedNonces = new Map<string, number>();

export type DirectoryOperator =
  | { ok: true; actorId: string; method: "admin_session" | "service_hmac" }
  | { ok: false; status: 401 | 403 | 503; error: string };

function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function bearerToken(req: Request): string {
  const value = req.header("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

function servicePayload(req: Request, timestamp: string, nonce: string): string {
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? ""
      : JSON.stringify(req.body ?? {});
  const bodyHash = createHash("sha256").update(body).digest("hex");
  return [timestamp, nonce, req.method.toUpperCase(), req.originalUrl, bodyHash].join("\n");
}

export function signDirectoryServiceRequest(
  input: {
    timestamp: string;
    nonce: string;
    method: string;
    originalUrl: string;
    body?: unknown;
  },
  signingSecret: string,
): string {
  const body =
    input.method.toUpperCase() === "GET" || input.method.toUpperCase() === "HEAD"
      ? ""
      : JSON.stringify(input.body ?? {});
  const bodyHash = createHash("sha256").update(body).digest("hex");
  const payload = [
    input.timestamp,
    input.nonce,
    input.method.toUpperCase(),
    input.originalUrl,
    bodyHash,
  ].join("\n");
  return createHmac("sha256", signingSecret).update(payload).digest("hex");
}

export function authorizeDirectoryOperator(req: Request): DirectoryOperator {
  if (req.user && isAdmin(req)) {
    return { ok: true, actorId: req.user.id, method: "admin_session" };
  }

  const serviceToken = process.env.DIRECTORY_SERVICE_TOKEN ?? "";
  const signingSecret = process.env.DIRECTORY_REVIEW_SIGNING_SECRET ?? "";
  if (serviceToken.length < 32 || signingSecret.length < 32) {
    return {
      ok: false,
      status: 503,
      error: "Directory service authorization is not configured.",
    };
  }
  if (!constantTimeEqual(bearerToken(req), serviceToken)) {
    return { ok: false, status: 401, error: "Service authentication required." };
  }

  const timestamp = req.header("x-directory-service-timestamp") ?? "";
  const nonce = req.header("x-directory-service-nonce") ?? "";
  const signature = req.header("x-directory-service-signature") ?? "";
  const timestampMs = Date.parse(timestamp);
  if (
    !timestamp ||
    !nonce ||
    nonce.length < 16 ||
    !Number.isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) > MAX_CLOCK_SKEW_MS
  ) {
    return { ok: false, status: 401, error: "Invalid or expired service request." };
  }

  const now = Date.now();
  for (const [seenNonce, expiresAt] of usedNonces) {
    if (expiresAt <= now) usedNonces.delete(seenNonce);
  }
  if (usedNonces.has(nonce)) {
    return { ok: false, status: 401, error: "Service request nonce was already used." };
  }

  const expected = createHmac("sha256", signingSecret)
    .update(servicePayload(req, timestamp, nonce))
    .digest("hex");
  if (!constantTimeEqual(signature, expected)) {
    return { ok: false, status: 401, error: "Invalid service request signature." };
  }

  usedNonces.set(nonce, now + MAX_CLOCK_SKEW_MS);
  req.log?.info(
    {
      event: "DIRECTORY_SERVICE_AUTHORIZED",
      method: req.method,
      path: req.originalUrl,
      nonceHash: createHash("sha256").update(nonce).digest("hex").slice(0, 16),
    },
    "directory service authorization accepted",
  );
  return { ok: true, actorId: "directory-release-service", method: "service_hmac" };
}