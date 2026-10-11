import { timingSafeEqual } from "crypto";
import type { Request } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth.js";

export const OWNER_CLAIM_REVIEWER_FIXTURE_SCOPE = "isolated_staging_validation";
export const OWNER_CLAIM_REVIEWER_FIXTURE_HEADER =
  "x-kinfolk-isolated-owner-claim-reviewer-fixture";

const DISPOSABLE_REVIEWER_EMAIL =
  /^kinfolk-safety-contact-[a-z0-9-]+@example\.test$/i;
const ALLOWED_TTLS_SECONDS = new Set([30, 60, 120, 300, 900]);

export interface OwnerClaimReviewerFixtureEnvironment {
  readonly KINFOLK_MEMORY_STAGING_ISOLATION?: string;
  readonly KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_ENABLED?: string;
  readonly KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_EMAIL?: string;
  readonly KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_SECRET?: string;
  readonly RAILWAY_ENVIRONMENT_NAME?: string;
}

/**
 * This entitlement is deliberately impossible to enable by source alone. It
 * needs the existing isolated-memory boundary, an exact staging runtime name,
 * an explicit one-time gate, a single disposable email binding, and a separate
 * secret. It never writes users.role or ADMIN_EMAILS.
 */
export function isIsolatedOwnerClaimReviewerFixtureEnabled(
  environment: OwnerClaimReviewerFixtureEnvironment = process.env,
): boolean {
  const boundEmail = environment.KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_EMAIL
    ?.trim()
    .toLowerCase();
  const secret = environment.KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_SECRET?.trim();

  return environment.RAILWAY_ENVIRONMENT_NAME === "staging"
    && environment.KINFOLK_MEMORY_STAGING_ISOLATION === "true"
    && environment.KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_ENABLED === "true"
    && Boolean(boundEmail && DISPOSABLE_REVIEWER_EMAIL.test(boundEmail))
    && Boolean(secret && secret.length >= 32);
}

function configuredFixtureEmail(
  environment: OwnerClaimReviewerFixtureEnvironment = process.env,
): string | null {
  if (!isIsolatedOwnerClaimReviewerFixtureEnabled(environment)) return null;
  return environment.KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_EMAIL!.trim().toLowerCase();
}

function hasFixtureSecret(
  request: Request,
  environment: OwnerClaimReviewerFixtureEnvironment = process.env,
): boolean {
  if (!isIsolatedOwnerClaimReviewerFixtureEnabled(environment)) return false;
  const supplied = request.headers[OWNER_CLAIM_REVIEWER_FIXTURE_HEADER];
  const expected = environment.KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_SECRET!;
  if (typeof supplied !== "string") return false;

  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length
    && timingSafeEqual(suppliedBytes, expectedBytes);
}

/**
 * A fixture grant must be made by the one fresh disposable identity bound in
 * the isolated service configuration. The same identity must also know the
 * short-lived setup secret. No other signed-in member can create an entitlement.
 */
export function isBoundOwnerClaimReviewerFixtureRequest(
  request: Request,
  environment: OwnerClaimReviewerFixtureEnvironment = process.env,
): request is Request & { user: { id: string; email: string } } {
  const email = configuredFixtureEmail(environment);
  const user = request.user;
  return Boolean(
    email
      && user?.id
      && typeof user.id === "string"
      && user.email
      && typeof user.email === "string"
      && user.email.trim().toLowerCase() === email
      && hasFixtureSecret(request, environment),
  );
}

export function parseOwnerClaimReviewerFixtureTtl(
  value: unknown,
): number | null {
  if (value === undefined) return 900;
  return typeof value === "number"
    && Number.isInteger(value)
    && ALLOWED_TTLS_SECONDS.has(value)
    ? value
    : null;
}

/**
 * The entitlement is intentionally considered only by the three canonical
 * claim-decision endpoints. It is not a general administrator, cannot read
 * an admin queue, cannot bootstrap an admin, and is ignored once expired.
 */
export async function requireClaimDecisionReviewer(
  request: Request,
): Promise<string | null> {
  if (!request.user?.id || typeof request.user.id !== "string") return null;
  if (isAdmin(request)) return request.user.id;
  if (!isIsolatedOwnerClaimReviewerFixtureEnabled()) return null;

  const boundEmail = configuredFixtureEmail();
  if (!boundEmail || request.user.email?.trim().toLowerCase() !== boundEmail) {
    return null;
  }

  try {
    const result = await pool.query<{ user_id: string }>(
      `SELECT user_id
         FROM owner_claim_reviewer_fixture_entitlements
        WHERE user_id = $1
          AND bound_email = $2
          AND scope = $3
          AND expires_at > NOW()
        LIMIT 1`,
      [request.user.id, boundEmail, OWNER_CLAIM_REVIEWER_FIXTURE_SCOPE],
    );
    return result.rows[0]?.user_id === request.user.id ? request.user.id : null;
  } catch {
    // Missing or malformed isolated-only storage always denies a decision.
    return null;
  }
}
