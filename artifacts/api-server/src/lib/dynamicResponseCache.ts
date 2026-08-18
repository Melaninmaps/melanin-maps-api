import type { Response } from "express";

/**
 * Use for any response whose content changes when community tags, verification
 * status, listings, map pins, or member location context changes.
 *
 * The production logs show 304 responses on map/listing endpoints because the
 * browser revalidates a cached response. no-store removes that revalidation
 * path for these dynamic endpoints until versioned data caching is deliberately
 * implemented.
 */
export function sendDynamicJson(response: Response, payload: unknown, status = 200): Response {
  response.status(status);
  response.setHeader("Cache-Control", "private, no-store, max-age=0");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Vary", "Authorization, Cookie, X-Community-Location");
  response.removeHeader("ETag");
  return response.json(payload);
}
