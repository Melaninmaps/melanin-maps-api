import { timingSafeEqual } from "crypto";
import type { Request } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth.js";

export const ACTIVATION_INVITATION_REVIEWER_FIXTURE_SCOPE = "isolated_staging_activation_invitation_validation";
export const ACTIVATION_INVITATION_REVIEWER_FIXTURE_HEADER =
  "x-kinfolk-isolated-activation-reviewer-fixture";

const DISPOSABLE_REVIEWER_EMAIL =
  /^kinfolk-safety-contact-[a-z0-9-]+@example\.test$/i;
// Resend's documented non-human delivery test mailbox. The fixture deliberately
// refuses all member, waitlist, and arbitrary external addresses.
const RESEND_DELIVERY_TEST_INBOX = "delivered@resend.dev";
const ALLOWED_TTLS_SECONDS = new Set([30, 60, 120, 300, 900]);

export interface ActivationInvitationReviewerFixtureEnvironment {
  readonly KINFOLK_MEMORY_STAGING_ISOLATION?: string;
  readonly KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_ENABLED?: string;
  readonly KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_EMAIL?: string;
  readonly KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_SECRET?: string;
  readonly KINFOLK_ACTIVATION_INVITATION_REVIEWER_TEST_INBOX?: string;
  readonly RAILWAY_ENVIRONMENT_NAME?: string;
}

/**
 * This fixture is a delivery-only staging capability. It is impossible to use
 * for a normal member, actual waitlist record, general admin route, role change,
 * or arbitrary recipient. Its recipient is always Resend's non-human test
 * mailbox; activation-link reading remains intentionally outside this fixture.
 */
export function isIsolatedActivationInvitationReviewerFixtureEnabled(
  environment: ActivationInvitationReviewerFixtureEnvironment = process.env,
): boolean {
  const reviewerEmail = environment.KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_EMAIL
    ?.trim()
    .toLowerCase();
  const secret = environment.KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_SECRET?.trim();
  const testInbox = environment.KINFOLK_ACTIVATION_INVITATION_REVIEWER_TEST_INBOX
    ?.trim()
    .toLowerCase();

  return environment.RAILWAY_ENVIRONMENT_NAME === "staging"
    && environment.KINFOLK_MEMORY_STAGING_ISOLATION === "true"
    && environment.KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_ENABLED === "true"
    && Boolean(reviewerEmail && DISPOSABLE_REVIEWER_EMAIL.test(reviewerEmail))
    && Boolean(secret && secret.length >= 32)
    && testInbox === RESEND_DELIVERY_TEST_INBOX;
}

function configuredReviewerEmail(
  environment: ActivationInvitationReviewerFixtureEnvironment = process.env,
): string | null {
  if (!isIsolatedActivationInvitationReviewerFixtureEnabled(environment)) return null;
  return environment.KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_EMAIL!.trim().toLowerCase();
}

export function configuredActivationDeliveryTestInbox(
  environment: ActivationInvitationReviewerFixtureEnvironment = process.env,
): string | null {
  if (!isIsolatedActivationInvitationReviewerFixtureEnabled(environment)) return null;
  return RESEND_DELIVERY_TEST_INBOX;
}

function hasFixtureSecret(
  request: Request,
  environment: ActivationInvitationReviewerFixtureEnvironment = process.env,
): boolean {
  if (!isIsolatedActivationInvitationReviewerFixtureEnabled(environment)) return false;
  const supplied = request.headers[ACTIVATION_INVITATION_REVIEWER_FIXTURE_HEADER];
  const expected = environment.KINFOLK_ACTIVATION_INVITATION_REVIEWER_FIXTURE_SECRET!;
  if (typeof supplied !== "string") return false;
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length
    && timingSafeEqual(suppliedBytes, expectedBytes);
}

export function isBoundActivationInvitationReviewerFixtureRequest(
  request: Request,
  environment: ActivationInvitationReviewerFixtureEnvironment = process.env,
): request is Request & { user: { id: string; email: string } } {
  const reviewerEmail = configuredReviewerEmail(environment);
  const user = request.user;
  return Boolean(
    reviewerEmail
      && user?.id
      && typeof user.id === "string"
      && typeof user.email === "string"
      && user.email.trim().toLowerCase() === reviewerEmail
      && hasFixtureSecret(request, environment),
  );
}

export function parseActivationInvitationReviewerFixtureTtl(value: unknown): number | null {
  if (value === undefined) return 300;
  return typeof value === "number"
    && Number.isInteger(value)
    && ALLOWED_TTLS_SECONDS.has(value)
    ? value
    : null;
}

export async function hasActivationInvitationReviewerEntitlement(
  request: Request,
): Promise<string | null> {
  if (!request.user?.id || typeof request.user.id !== "string") return null;
  if (isAdmin(request)) return request.user.id;
  if (!isIsolatedActivationInvitationReviewerFixtureEnabled()) return null;

  const reviewerEmail = configuredReviewerEmail();
  if (!reviewerEmail || request.user.email?.trim().toLowerCase() !== reviewerEmail) {
    return null;
  }

  try {
    const result = await pool.query<{ user_id: string }>(
      `SELECT user_id
         FROM activation_invitation_reviewer_fixture_entitlements
        WHERE user_id = $1
          AND bound_email = $2
          AND scope = $3
          AND expires_at > NOW()
        LIMIT 1`,
      [
        request.user.id,
        reviewerEmail,
        ACTIVATION_INVITATION_REVIEWER_FIXTURE_SCOPE,
      ],
    );
    return result.rows[0]?.user_id === request.user.id ? request.user.id : null;
  } catch {
    return null;
  }
}

/**
 * The caller still needs an active, exact-email entitlement and the requested
 * row must be a synthetic Resend delivery fixture. isAdmin() retains its normal
 * unrestricted behavior; this fallback only applies to the three narrow
 * approval/resend/revoke actions wired in waitlist.ts.
 */
export async function requireActivationInvitationReviewer(
  request: Request,
  waitlistId: string,
): Promise<string | null> {
  const reviewerId = await hasActivationInvitationReviewerEntitlement(request);
  if (!reviewerId) return null;
  if (isAdmin(request)) return reviewerId;

  const reviewerEmail = configuredReviewerEmail();
  const testInbox = configuredActivationDeliveryTestInbox();
  if (!reviewerEmail || !testInbox) {
    return null;
  }

  try {
    const result = await pool.query<{ user_id: string }>(
      `SELECT entitlement.user_id
         FROM activation_invitation_reviewer_fixture_entitlements AS entitlement
         JOIN waitlist_signups AS entry ON entry.id = $3
        WHERE entitlement.user_id = $1
          AND entitlement.bound_email = $2
          AND entitlement.scope = $4
          AND entitlement.expires_at > NOW()
          AND entry.is_synthetic_test = true
          AND LOWER(TRIM(entry.email)) = $5
        LIMIT 1`,
      [
        reviewerId,
        reviewerEmail,
        waitlistId,
        ACTIVATION_INVITATION_REVIEWER_FIXTURE_SCOPE,
        testInbox,
      ],
    );
    return result.rows[0]?.user_id === reviewerId ? reviewerId : null;
  } catch {
    return null;
  }
}
