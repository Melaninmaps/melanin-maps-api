import type {
  ExperiencePrivacyLevel,
  ExperienceRelationship,
  ExperienceStatus,
  OrganizationFactualStatus,
  OrganizationSurfaceState,
  OrganizationType,
  SurfaceStatus,
} from "./policy";
import { pseudonymousExperienceLabel } from "./policy";
import {
  experienceStatusRecovery,
  statusForExperienceReview,
  type ExperienceReviewDecision,
  type ExperienceReviewResult,
} from "./reviewWorkflow";
import type {
  OrganizationExperienceAppealInput,
  OrganizationExperienceInput,
  OrganizationOwnerActionInput,
  OrganizationSubmissionInput,
} from "./validation";

export type OrganizationTransparencyDatabase = {
  query<T = Record<string, unknown>>(
    statement: string,
    values?: unknown[],
  ): Promise<{ rows: T[]; rowCount?: number | null }>;
  connect(): Promise<OrganizationTransparencyDatabase & { release(): void }>;
};

export class DuplicateOrganizationSubmissionError extends Error {
  readonly code = "POSSIBLE_DUPLICATE_ORGANIZATION";

  constructor(readonly organizationId: string) {
    super(
      "A matching organization may already exist. Choose the existing organization or request a factual correction.",
    );
  }
}

export type DuplicateOrganizationCandidate = Readonly<{
  id: string;
  legalName: string;
  displayName: string | null;
  organizationType: string;
  city: string;
  state: string | null;
  website: string | null;
  factualStatus: string;
}>;

export type OrganizationLocation = Readonly<{
  id: string;
  organizationId: string;
  name: string | null;
  city: string;
  state: string | null;
  country: string | null;
  isPrimary: boolean;
}>;

export type PublicOrganizationProfile = Readonly<{
  id: string;
  legalName: string;
  displayName: string | null;
  organizationType: OrganizationType;
  ownershipStatus: string;
  website: string | null;
  phone: string | null;
  factualStatus: OrganizationFactualStatus;
  searchStatus: SurfaceStatus;
  mapPinStatus: SurfaceStatus;
  kinfolkStatus: SurfaceStatus;
  promotionStatus: SurfaceStatus;
  experienceStatus: SurfaceStatus;
  city: string;
  state: string | null;
  country: string | null;
}>;

export type PublicOrganizationExperience = Readonly<{
  id: string;
  organizationId: string;
  organizationLocationId: string | null;
  city: string | null;
  state: string | null;
  relationship: ExperienceRelationship;
  relationshipLabel: string;
  categoryCodes: string[];
  narrative: string | null;
  submittedAt: string;
}>;

export type OrganizationExperienceSummary = Readonly<{
  totalPublished: number;
  categoryCounts: Record<string, number>;
  relationshipCounts: Record<string, number>;
}>;

export type MemberOrganizationStatus = Readonly<{
  organizationId: string;
  legalName: string;
  city: string;
  state: string | null;
  factualStatus: OrganizationFactualStatus;
  submittedAt: string;
  recoveryMessage: string;
}>;

export type MemberExperienceStatus = Readonly<{
  experienceId: string;
  organizationId: string;
  organizationName: string;
  relationship: ExperienceRelationship;
  categoryCodes: string[];
  privacyLevel: ExperiencePrivacyLevel;
  moderationStatus: ExperienceStatus;
  reviewerNote: string | null;
  submittedAt: string;
  recovery: ReturnType<typeof experienceStatusRecovery>;
}>;

export type OrganizationReviewQueueItem = Readonly<{
  kind: "organization" | "experience" | "experience_appeal";
  id: string;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType;
  city: string | null;
  state: string | null;
  submittedAt: string;
  status: string;
  relationship?: ExperienceRelationship;
  privacyLevel?: ExperiencePrivacyLevel;
  categoryCodes?: string[];
  narrative?: string | null;
  moderationFlags?: string[];
  appealBody?: string;
}>;

export type OrganizationModerationDecision = Readonly<{
  factualStatus: OrganizationFactualStatus;
  locationStatus: OrganizationFactualStatus;
  searchStatus: SurfaceStatus;
  mapPinStatus: SurfaceStatus;
  kinfolkStatus: SurfaceStatus;
  promotionStatus: SurfaceStatus;
  experienceStatus: SurfaceStatus;
  reason: string;
  evidenceReceiptUrls?: readonly string[];
}>;

export type ExperienceAppealDecision = Readonly<{
  disposition: "reopen" | "decline";
  reason: string;
  evidenceReceiptUrls?: readonly string[];
}>;

export interface OrganizationTransparencyRepository {
  findDuplicateCandidates(
    input: OrganizationSubmissionInput,
  ): Promise<DuplicateOrganizationCandidate[]>;
  findMemberSubmissionByClientRequest(
    memberId: string,
    clientRequestId: string,
  ): Promise<{ organizationId: string; locationId: string } | null>;
  createMemberSubmission(
    input: OrganizationSubmissionInput,
    memberId: string,
  ): Promise<{ organizationId: string; locationId: string }>;
  updateMemberSubmission(
    organizationId: string,
    input: OrganizationSubmissionInput,
    memberId: string,
  ): Promise<{ organizationId: string; locationId: string } | null>;
  getPublicProfile(
    organizationId: string,
  ): Promise<PublicOrganizationProfile | null>;
  listPublicOrganizations(filters: {
    query?: string;
    city?: string;
    limit: number;
  }): Promise<PublicOrganizationProfile[]>;
  listPublicLocations(organizationId: string): Promise<OrganizationLocation[]>;
  getOrganizationForExperience(organizationId: string): Promise<{
    organizationType: OrganizationType;
    experienceStatus: SurfaceStatus;
  } | null>;
  createExperience(
    input: OrganizationExperienceInput,
    organizationId: string,
    memberId: string,
    moderationFlags: readonly string[],
  ): Promise<{ experienceId: string; status: ExperienceStatus }>;
  findExperienceByClientRequest(
    organizationId: string,
    memberId: string,
    clientRequestId: string,
  ): Promise<{ experienceId: string; status: ExperienceStatus } | null>;
  getExperienceSummary(
    organizationId: string,
  ): Promise<OrganizationExperienceSummary>;
  listPublicExperiences(
    organizationId: string,
    limit: number,
  ): Promise<PublicOrganizationExperience[]>;
  listMemberActivity(memberId: string): Promise<{
    organizations: MemberOrganizationStatus[];
    experiences: MemberExperienceStatus[];
  }>;
  createExperienceAppeal(
    experienceId: string,
    memberId: string,
    input: OrganizationExperienceAppealInput,
  ): Promise<{ appealId: string; status: string; created: boolean }>;
  listReviewQueue(limit: number): Promise<OrganizationReviewQueueItem[]>;
  applyExperienceReview(
    experienceId: string,
    reviewerMemberId: string,
    decision: ExperienceReviewDecision,
  ): Promise<ExperienceReviewResult | null>;
  applyExperienceAppealDecision(
    appealId: string,
    reviewerMemberId: string,
    decision: ExperienceAppealDecision,
  ): Promise<{ appealId: string; status: string; experienceId: string } | null>;
  createOwnerClaim(
    organizationId: string,
    memberId: string,
    note: string | undefined,
  ): Promise<{ claimId: string; status: string }>;
  hasApprovedOwnerClaim(
    organizationId: string,
    memberId: string,
  ): Promise<boolean>;
  createOwnerAction(
    input: OrganizationOwnerActionInput,
    organizationId: string,
    memberId: string,
  ): Promise<{ actionId: string; status: string }>;
  applyModerationDecision(
    organizationId: string,
    adminMemberId: string,
    decision: OrganizationModerationDecision,
  ): Promise<OrganizationSurfaceState | null>;
}

function numberValue(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function identityPart(value: string | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function organizationIdentityKey(input: OrganizationSubmissionInput): string {
  return [
    identityPart(input.legalName),
    identityPart(input.location.city),
    identityPart(input.location.state),
  ].join("|");
}

function memberOrganizationRecoveryMessage(
  status: OrganizationFactualStatus,
): string {
  switch (status) {
    case "pending_moderation":
      return "Your organization is awaiting factual and duplicate review. It is not public yet.";
    case "correction_requested":
      return "A reviewer requested a factual correction. Update the requested information and resubmit.";
    case "factual_approved":
      return "The factual organization record has been approved. Surface eligibility remains independent.";
    case "hidden":
      return "This organization record is not visible to members.";
    case "rejected":
      return "This organization submission was not approved. You may submit a corrected factual record.";
  }
}

export class PostgresOrganizationTransparencyRepository implements OrganizationTransparencyRepository {
  constructor(private readonly database: OrganizationTransparencyDatabase) {}

  async findDuplicateCandidates(
    input: OrganizationSubmissionInput,
  ): Promise<DuplicateOrganizationCandidate[]> {
    const result = await this.database.query<{
      id: string;
      legal_name: string;
      display_name: string | null;
      organization_type: string;
      city: string;
      state: string | null;
      website: string | null;
      factual_status: string;
    }>(
      `SELECT p.id, p.legal_name, p.display_name, p.organization_type, l.city, l.state, p.website, p.factual_status
         FROM organization_profiles p
         JOIN organization_locations l ON l.organization_id = p.id AND l.is_primary = TRUE
        WHERE LOWER(BTRIM(p.legal_name)) = LOWER(BTRIM($1))
          AND LOWER(BTRIM(l.city)) = LOWER(BTRIM($2))
          AND COALESCE(l.state, '') = COALESCE($3, '')
          AND p.factual_status NOT IN ('hidden', 'rejected')
        ORDER BY p.updated_at DESC LIMIT 8`,
      [input.legalName, input.location.city, input.location.state ?? null],
    );
    return result.rows.map((row) => ({
      id: row.id,
      legalName: row.legal_name,
      displayName: row.display_name,
      organizationType: row.organization_type,
      city: row.city,
      state: row.state,
      website: row.website,
      factualStatus: row.factual_status,
    }));
  }

  async findMemberSubmissionByClientRequest(
    memberId: string,
    clientRequestId: string,
  ): Promise<{ organizationId: string; locationId: string } | null> {
    const result = await this.database.query<{
      organization_id: string;
      location_id: string;
    }>(
      `SELECT p.id AS organization_id, l.id AS location_id
         FROM organization_profiles p
         JOIN organization_locations l ON l.organization_id = p.id AND l.is_primary = TRUE
        WHERE p.submitted_by_member_id = $1 AND p.client_request_id = $2
        LIMIT 1`,
      [memberId, clientRequestId],
    );
    const row = result.rows[0];
    return row
      ? { organizationId: row.organization_id, locationId: row.location_id }
      : null;
  }

  async createMemberSubmission(
    input: OrganizationSubmissionInput,
    memberId: string,
  ): Promise<{ organizationId: string; locationId: string }> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      const identityKey = organizationIdentityKey(input);
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [identityKey],
      );
      const existing = await client.query<{ id: string }>(
        `SELECT p.id FROM organization_profiles p
          JOIN organization_locations l ON l.organization_id = p.id AND l.is_primary = TRUE
         WHERE LOWER(BTRIM(p.legal_name)) = LOWER(BTRIM($1))
           AND LOWER(BTRIM(l.city)) = LOWER(BTRIM($2))
           AND COALESCE(l.state, '') = COALESCE($3, '')
           AND p.factual_status NOT IN ('hidden', 'rejected')
         LIMIT 1`,
        [input.legalName, input.location.city, input.location.state ?? null],
      );
      if (existing.rows[0])
        throw new DuplicateOrganizationSubmissionError(existing.rows[0].id);

      const profile = await client.query<{ id: string }>(
        `INSERT INTO organization_profiles
          (legal_name, display_name, organization_type, ownership_status, website, phone,
           factual_status, search_status, map_pin_status, kinfolk_status, promotion_status,
           experience_status, submitted_by_member_id, submission_relationship, client_request_id,
           created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,'pending_moderation','not_eligible','not_eligible','not_eligible','not_eligible','review_required',$7,$8,$9,NOW(),NOW())
         RETURNING id`,
        [
          input.legalName,
          input.displayName ?? null,
          input.organizationType,
          input.ownershipStatus,
          input.website ?? null,
          input.phone ?? null,
          memberId,
          input.relationshipToOrganization,
          input.clientRequestId ?? null,
        ],
      );
      const organizationId = profile.rows[0]?.id;
      if (!organizationId) throw new Error("Organization insertion failed");

      const claim = await client.query<{ organization_id: string }>(
        `INSERT INTO organization_profile_identity_claims (identity_key, organization_id, created_at)
         VALUES ($1,$2,NOW()) ON CONFLICT (identity_key) DO NOTHING RETURNING organization_id`,
        [identityKey, organizationId],
      );
      if (!claim.rows[0]) {
        const winner = await client.query<{ organization_id: string }>(
          "SELECT organization_id FROM organization_profile_identity_claims WHERE identity_key = $1",
          [identityKey],
        );
        throw new DuplicateOrganizationSubmissionError(
          winner.rows[0]?.organization_id ?? organizationId,
        );
      }

      const location = await client.query<{ id: string }>(
        `INSERT INTO organization_locations
          (organization_id, location_name, address_line_1, address_line_2, city, state, postal_code, country,
           is_primary, location_status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,'pending_moderation',NOW(),NOW()) RETURNING id`,
        [
          organizationId,
          input.location.name ?? null,
          input.location.addressLine1 ?? null,
          input.location.addressLine2 ?? null,
          input.location.city,
          input.location.state ?? null,
          input.location.postalCode ?? null,
          input.location.country ?? null,
        ],
      );
      const locationId = location.rows[0]?.id;
      if (!locationId)
        throw new Error("Organization location insertion failed");

      await client.query(
        `INSERT INTO organization_transparency_audit_events
          (organization_id, actor_member_id, actor_kind, event_type, event_payload, created_at)
         VALUES ($1,$2,'member','member_submission',$3::jsonb,NOW())`,
        [
          organizationId,
          memberId,
          JSON.stringify({
            policyVersion: "organization_transparency_v1",
            relationship: input.relationshipToOrganization,
            hasSubmitterNote: Boolean(input.submitterNote),
            clientRequestId: input.clientRequestId ?? null,
          }),
        ],
      );
      await client.query("COMMIT");
      return { organizationId, locationId };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateMemberSubmission(
    organizationId: string,
    input: OrganizationSubmissionInput,
    memberId: string,
  ): Promise<{ organizationId: string; locationId: string } | null> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query<{
        factual_status: OrganizationFactualStatus;
      }>(
        `SELECT factual_status FROM organization_profiles WHERE id = $1 AND submitted_by_member_id = $2 FOR UPDATE`,
        [organizationId, memberId],
      );
      if (
        !current.rows[0] ||
        !["correction_requested", "rejected"].includes(
          current.rows[0].factual_status,
        )
      ) {
        await client.query("ROLLBACK");
        return null;
      }
      const identityKey = organizationIdentityKey(input);
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [identityKey],
      );
      await client.query(
        "DELETE FROM organization_profile_identity_claims WHERE organization_id = $1",
        [organizationId],
      );
      const claim = await client.query<{ organization_id: string }>(
        `INSERT INTO organization_profile_identity_claims (identity_key, organization_id, created_at)
         VALUES ($1,$2,NOW()) ON CONFLICT (identity_key) DO NOTHING RETURNING organization_id`,
        [identityKey, organizationId],
      );
      if (!claim.rows[0]) {
        const winner = await client.query<{ organization_id: string }>(
          "SELECT organization_id FROM organization_profile_identity_claims WHERE identity_key = $1",
          [identityKey],
        );
        throw new DuplicateOrganizationSubmissionError(
          winner.rows[0]?.organization_id ?? organizationId,
        );
      }
      await client.query(
        `UPDATE organization_profiles SET legal_name=$2, display_name=$3, organization_type=$4, ownership_status=$5,
         website=$6, phone=$7, factual_status='pending_moderation', search_status='not_eligible',
         map_pin_status='not_eligible', kinfolk_status='not_eligible', promotion_status='not_eligible',
         experience_status='review_required', submission_relationship=$8, updated_at=NOW() WHERE id=$1`,
        [
          organizationId,
          input.legalName,
          input.displayName ?? null,
          input.organizationType,
          input.ownershipStatus,
          input.website ?? null,
          input.phone ?? null,
          input.relationshipToOrganization,
        ],
      );
      const location = await client.query<{ id: string }>(
        `UPDATE organization_locations SET location_name=$3, address_line_1=$4, address_line_2=$5, city=$6,
         state=$7, postal_code=$8, country=$9, location_status='pending_moderation', updated_at=NOW()
         WHERE organization_id=$1 AND is_primary=TRUE RETURNING id`,
        [
          organizationId,
          memberId,
          input.location.name ?? null,
          input.location.addressLine1 ?? null,
          input.location.addressLine2 ?? null,
          input.location.city,
          input.location.state ?? null,
          input.location.postalCode ?? null,
          input.location.country ?? null,
        ],
      );
      const locationId = location.rows[0]?.id;
      if (!locationId) throw new Error("Organization location update failed");
      await client.query(
        `INSERT INTO organization_transparency_audit_events
          (organization_id, actor_member_id, actor_kind, event_type, event_payload, created_at)
         VALUES ($1,$2,'member','member_submission_resubmitted',$3::jsonb,NOW())`,
        [
          organizationId,
          memberId,
          JSON.stringify({
            policyVersion: "organization_transparency_v1",
            relationship: input.relationshipToOrganization,
          }),
        ],
      );
      await client.query("COMMIT");
      return { organizationId, locationId };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async getPublicProfile(
    organizationId: string,
  ): Promise<PublicOrganizationProfile | null> {
    const result = await this.database.query<{
      id: string;
      legal_name: string;
      display_name: string | null;
      organization_type: OrganizationType;
      ownership_status: string;
      website: string | null;
      phone: string | null;
      factual_status: OrganizationFactualStatus;
      search_status: SurfaceStatus;
      map_pin_status: SurfaceStatus;
      kinfolk_status: SurfaceStatus;
      promotion_status: SurfaceStatus;
      experience_status: SurfaceStatus;
      city: string;
      state: string | null;
      country: string | null;
    }>(
      `SELECT p.id, p.legal_name, p.display_name, p.organization_type, p.ownership_status, p.website, p.phone,
        p.factual_status, p.search_status, p.map_pin_status, p.kinfolk_status, p.promotion_status, p.experience_status,
        l.city, l.state, l.country FROM organization_profiles p
        JOIN organization_locations l ON l.organization_id=p.id
        WHERE p.id=$1 AND p.factual_status='factual_approved' AND p.search_status='eligible'
          AND l.location_status='factual_approved'
        ORDER BY l.is_primary DESC, l.created_at ASC LIMIT 1`,
      [organizationId],
    );
    return this.mapPublicProfile(result.rows[0]);
  }

  async listPublicOrganizations(filters: {
    query?: string;
    city?: string;
    limit: number;
  }): Promise<PublicOrganizationProfile[]> {
    const result = await this.database.query<{
      id: string;
      legal_name: string;
      display_name: string | null;
      organization_type: OrganizationType;
      ownership_status: string;
      website: string | null;
      phone: string | null;
      factual_status: OrganizationFactualStatus;
      search_status: SurfaceStatus;
      map_pin_status: SurfaceStatus;
      kinfolk_status: SurfaceStatus;
      promotion_status: SurfaceStatus;
      experience_status: SurfaceStatus;
      city: string;
      state: string | null;
      country: string | null;
    }>(
      `SELECT p.id, p.legal_name, p.display_name, p.organization_type, p.ownership_status, p.website, p.phone,
        p.factual_status, p.search_status, p.map_pin_status, p.kinfolk_status, p.promotion_status, p.experience_status,
        l.city, l.state, l.country FROM organization_profiles p
        JOIN organization_locations l ON l.organization_id=p.id
        WHERE p.factual_status='factual_approved' AND p.search_status='eligible' AND l.location_status='factual_approved'
          AND ($1::text IS NULL OR p.legal_name ILIKE '%' || $1 || '%' OR COALESCE(p.display_name, '') ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR l.city ILIKE '%' || $2 || '%')
        ORDER BY p.legal_name ASC, l.is_primary DESC LIMIT $3`,
      [filters.query ?? null, filters.city ?? null, filters.limit],
    );
    return result.rows.map((row) => this.mapPublicProfile(row)!);
  }

  async listPublicLocations(
    organizationId: string,
  ): Promise<OrganizationLocation[]> {
    const result = await this.database.query<{
      id: string;
      organization_id: string;
      location_name: string | null;
      city: string;
      state: string | null;
      country: string | null;
      is_primary: boolean;
    }>(
      `SELECT id, organization_id, location_name, city, state, country, is_primary
       FROM organization_locations WHERE organization_id=$1 AND location_status='factual_approved'
       ORDER BY is_primary DESC, city ASC`,
      [organizationId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      name: row.location_name,
      city: row.city,
      state: row.state,
      country: row.country,
      isPrimary: row.is_primary,
    }));
  }

  async getOrganizationForExperience(organizationId: string): Promise<{
    organizationType: OrganizationType;
    experienceStatus: SurfaceStatus;
  } | null> {
    const result = await this.database.query<{
      organization_type: OrganizationType;
      experience_status: SurfaceStatus;
    }>(
      `SELECT organization_type, experience_status FROM organization_profiles WHERE id=$1
       AND factual_status='factual_approved' AND search_status='eligible' LIMIT 1`,
      [organizationId],
    );
    const row = result.rows[0];
    return row
      ? {
          organizationType: row.organization_type,
          experienceStatus: row.experience_status,
        }
      : null;
  }

  async createExperience(
    input: OrganizationExperienceInput,
    organizationId: string,
    memberId: string,
    moderationFlags: readonly string[],
  ): Promise<{ experienceId: string; status: ExperienceStatus }> {
    const result = await this.database.query<{
      id: string;
      moderation_status: ExperienceStatus;
    }>(
      `INSERT INTO organization_experiences (organization_id, organization_location_id, author_member_id, relationship,
        experience_context, category_codes, narrative, privacy_level, moderation_status, safety_flags, client_request_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,'pending_moderation',$9::jsonb,$10,NOW(),NOW()) RETURNING id, moderation_status`,
      [
        organizationId,
        input.organizationLocationId ?? null,
        memberId,
        input.relationship,
        input.relationship === "patient" || input.relationship === "caregiver"
          ? "care"
          : [
                "current_employee",
                "former_employee",
                "contractor",
                "job_applicant",
              ].includes(input.relationship)
            ? "workplace"
            : "customer",
        JSON.stringify(input.categoryCodes),
        input.narrative ?? null,
        input.privacyLevel,
        JSON.stringify(moderationFlags),
        input.clientRequestId ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Experience insertion failed");
    await this.database.query(
      `INSERT INTO organization_transparency_audit_events (organization_id, actor_member_id, actor_kind, event_type, event_payload, created_at)
       VALUES ($1,$2,'member','experience_submitted',$3::jsonb,NOW())`,
      [
        organizationId,
        memberId,
        JSON.stringify({
          experienceId: row.id,
          relationship: input.relationship,
          categoryCodes: input.categoryCodes,
          privacyLevel: input.privacyLevel,
          moderationFlags,
        }),
      ],
    );
    return { experienceId: row.id, status: row.moderation_status };
  }

  async findExperienceByClientRequest(
    organizationId: string,
    memberId: string,
    clientRequestId: string,
  ): Promise<{ experienceId: string; status: ExperienceStatus } | null> {
    const result = await this.database.query<{
      id: string;
      moderation_status: ExperienceStatus;
    }>(
      `SELECT id, moderation_status FROM organization_experiences WHERE organization_id=$1 AND author_member_id=$2 AND client_request_id=$3 LIMIT 1`,
      [organizationId, memberId, clientRequestId],
    );
    const row = result.rows[0];
    return row ? { experienceId: row.id, status: row.moderation_status } : null;
  }

  async getExperienceSummary(
    organizationId: string,
  ): Promise<OrganizationExperienceSummary> {
    const [categoryResult, relationshipResult] = await Promise.all([
      this.database.query<{ category: string; count: string | number }>(
        `SELECT category, COUNT(*)::int AS count FROM organization_experiences e
         CROSS JOIN LATERAL jsonb_array_elements_text(e.category_codes) AS category
         WHERE e.organization_id=$1 AND e.moderation_status='published' AND e.privacy_level='pseudonymous_public'
         GROUP BY category ORDER BY count DESC, category ASC`,
        [organizationId],
      ),
      this.database.query<{ relationship: string; count: string | number }>(
        `SELECT relationship, COUNT(*)::int AS count FROM organization_experiences
         WHERE organization_id=$1 AND moderation_status='published' AND privacy_level='pseudonymous_public'
         GROUP BY relationship ORDER BY count DESC, relationship ASC`,
        [organizationId],
      ),
    ]);
    const categoryCounts = Object.fromEntries(
      categoryResult.rows.map((row) => [row.category, numberValue(row.count)]),
    );
    const relationshipCounts = Object.fromEntries(
      relationshipResult.rows.map((row) => [
        row.relationship,
        numberValue(row.count),
      ]),
    );
    return {
      totalPublished: Object.values(relationshipCounts).reduce(
        (total, value) => total + value,
        0,
      ),
      categoryCounts,
      relationshipCounts,
    };
  }

  async listPublicExperiences(
    organizationId: string,
    limit: number,
  ): Promise<PublicOrganizationExperience[]> {
    const result = await this.database.query<{
      id: string;
      organization_id: string;
      organization_location_id: string | null;
      city: string | null;
      state: string | null;
      relationship: ExperienceRelationship;
      category_codes: unknown;
      narrative: string | null;
      created_at: string;
    }>(
      `SELECT e.id, e.organization_id, e.organization_location_id, l.city, l.state, e.relationship, e.category_codes, e.narrative, e.created_at
       FROM organization_experiences e LEFT JOIN organization_locations l ON l.id=e.organization_location_id
       WHERE e.organization_id=$1 AND e.moderation_status='published' AND e.privacy_level='pseudonymous_public'
       ORDER BY e.created_at DESC LIMIT $2`,
      [organizationId, limit],
    );
    return result.rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      organizationLocationId: row.organization_location_id,
      city: row.city,
      state: row.state,
      relationship: row.relationship,
      relationshipLabel: pseudonymousExperienceLabel(row.relationship),
      categoryCodes: stringArray(row.category_codes),
      narrative: row.narrative,
      submittedAt: row.created_at,
    }));
  }

  async listMemberActivity(memberId: string): Promise<{
    organizations: MemberOrganizationStatus[];
    experiences: MemberExperienceStatus[];
  }> {
    const [organizations, experiences] = await Promise.all([
      this.database.query<{
        id: string;
        legal_name: string;
        city: string;
        state: string | null;
        factual_status: OrganizationFactualStatus;
        created_at: string;
      }>(
        `SELECT p.id, p.legal_name, l.city, l.state, p.factual_status, p.created_at FROM organization_profiles p
         JOIN organization_locations l ON l.organization_id=p.id AND l.is_primary=TRUE
         WHERE p.submitted_by_member_id=$1 ORDER BY p.created_at DESC LIMIT 100`,
        [memberId],
      ),
      this.database.query<{
        id: string;
        organization_id: string;
        legal_name: string;
        relationship: ExperienceRelationship;
        category_codes: unknown;
        privacy_level: ExperiencePrivacyLevel;
        moderation_status: ExperienceStatus;
        moderation_note: string | null;
        created_at: string;
      }>(
        `SELECT e.id, e.organization_id, p.legal_name, e.relationship, e.category_codes, e.privacy_level,
          e.moderation_status, e.moderation_note, e.created_at FROM organization_experiences e
         JOIN organization_profiles p ON p.id=e.organization_id WHERE e.author_member_id=$1 ORDER BY e.created_at DESC LIMIT 100`,
        [memberId],
      ),
    ]);
    return {
      organizations: organizations.rows.map((row) => ({
        organizationId: row.id,
        legalName: row.legal_name,
        city: row.city,
        state: row.state,
        factualStatus: row.factual_status,
        submittedAt: row.created_at,
        recoveryMessage: memberOrganizationRecoveryMessage(row.factual_status),
      })),
      experiences: experiences.rows.map((row) => ({
        experienceId: row.id,
        organizationId: row.organization_id,
        organizationName: row.legal_name,
        relationship: row.relationship,
        categoryCodes: stringArray(row.category_codes),
        privacyLevel: row.privacy_level,
        moderationStatus: row.moderation_status,
        reviewerNote: row.moderation_note,
        submittedAt: row.created_at,
        recovery: experienceStatusRecovery(row.moderation_status),
      })),
    };
  }

  async createExperienceAppeal(
    experienceId: string,
    memberId: string,
    input: OrganizationExperienceAppealInput,
  ): Promise<{ appealId: string; status: string; created: boolean }> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      const experience = await client.query<{
        organization_id: string;
        moderation_status: ExperienceStatus;
      }>(
        `SELECT organization_id, moderation_status FROM organization_experiences WHERE id=$1 AND author_member_id=$2 FOR UPDATE`,
        [experienceId, memberId],
      );
      const row = experience.rows[0];
      if (!row || !["held", "rejected"].includes(row.moderation_status))
        throw new Error("This experience is not eligible for an appeal");
      const existing = await client.query<{ id: string; status: string }>(
        `SELECT id, status FROM organization_experience_appeals WHERE experience_id=$1 AND appellant_member_id=$2 AND status='pending_moderation' LIMIT 1`,
        [experienceId, memberId],
      );
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return {
          appealId: existing.rows[0].id,
          status: existing.rows[0].status,
          created: false,
        };
      }
      const result = await client.query<{ id: string; status: string }>(
        `INSERT INTO organization_experience_appeals (experience_id, organization_id, appellant_member_id, body, status, client_request_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,'pending_moderation',$5,NOW(),NOW()) RETURNING id,status`,
        [
          experienceId,
          row.organization_id,
          memberId,
          input.body,
          input.clientRequestId ?? null,
        ],
      );
      const appeal = result.rows[0];
      if (!appeal) throw new Error("Experience appeal insertion failed");
      await client.query(
        `INSERT INTO organization_transparency_audit_events (organization_id, actor_member_id, actor_kind, event_type, event_payload, created_at)
         VALUES ($1,$2,'member','experience_appealed',$3::jsonb,NOW())`,
        [
          row.organization_id,
          memberId,
          JSON.stringify({ experienceId, appealId: appeal.id }),
        ],
      );
      await client.query("COMMIT");
      return { appealId: appeal.id, status: appeal.status, created: true };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async listReviewQueue(limit: number): Promise<OrganizationReviewQueueItem[]> {
    const [organizations, experiences, appeals] = await Promise.all([
      this.database.query<{
        id: string;
        legal_name: string;
        organization_type: OrganizationType;
        city: string | null;
        state: string | null;
        created_at: string;
        factual_status: string;
      }>(
        `SELECT p.id, p.legal_name, p.organization_type, l.city, l.state, p.created_at, p.factual_status FROM organization_profiles p
         LEFT JOIN organization_locations l ON l.organization_id=p.id AND l.is_primary=TRUE
         WHERE p.factual_status IN ('pending_moderation','correction_requested') ORDER BY p.created_at ASC LIMIT $1`,
        [limit],
      ),
      this.database.query<{
        id: string;
        organization_id: string;
        legal_name: string;
        organization_type: OrganizationType;
        city: string | null;
        state: string | null;
        relationship: ExperienceRelationship;
        privacy_level: ExperiencePrivacyLevel;
        category_codes: unknown;
        narrative: string | null;
        safety_flags: unknown;
        created_at: string;
        moderation_status: string;
      }>(
        `SELECT e.id,e.organization_id,p.legal_name,p.organization_type,l.city,l.state,e.relationship,e.privacy_level,e.category_codes,e.narrative,e.safety_flags,e.created_at,e.moderation_status
         FROM organization_experiences e JOIN organization_profiles p ON p.id=e.organization_id
         LEFT JOIN organization_locations l ON l.id=e.organization_location_id WHERE e.moderation_status='pending_moderation'
         ORDER BY e.created_at ASC LIMIT $1`,
        [limit],
      ),
      this.database.query<{
        id: string;
        experience_id: string;
        organization_id: string;
        legal_name: string;
        organization_type: OrganizationType;
        city: string | null;
        state: string | null;
        body: string;
        created_at: string;
        status: string;
      }>(
        `SELECT a.id,a.experience_id,a.organization_id,p.legal_name,p.organization_type,l.city,l.state,a.body,a.created_at,a.status
         FROM organization_experience_appeals a JOIN organization_profiles p ON p.id=a.organization_id
         LEFT JOIN organization_locations l ON l.organization_id=p.id AND l.is_primary=TRUE WHERE a.status='pending_moderation'
         ORDER BY a.created_at ASC LIMIT $1`,
        [limit],
      ),
    ]);
    return [
      ...organizations.rows.map(
        (row): OrganizationReviewQueueItem => ({
          kind: "organization",
          id: row.id,
          organizationId: row.id,
          organizationName: row.legal_name,
          organizationType: row.organization_type,
          city: row.city,
          state: row.state,
          submittedAt: row.created_at,
          status: row.factual_status,
        }),
      ),
      ...experiences.rows.map(
        (row): OrganizationReviewQueueItem => ({
          kind: "experience",
          id: row.id,
          organizationId: row.organization_id,
          organizationName: row.legal_name,
          organizationType: row.organization_type,
          city: row.city,
          state: row.state,
          submittedAt: row.created_at,
          status: row.moderation_status,
          relationship: row.relationship,
          privacyLevel: row.privacy_level,
          categoryCodes: stringArray(row.category_codes),
          narrative: row.narrative,
          moderationFlags: stringArray(row.safety_flags),
        }),
      ),
      ...appeals.rows.map(
        (row): OrganizationReviewQueueItem => ({
          kind: "experience_appeal",
          id: row.id,
          organizationId: row.organization_id,
          organizationName: row.legal_name,
          organizationType: row.organization_type,
          city: row.city,
          state: row.state,
          submittedAt: row.created_at,
          status: row.status,
          appealBody: row.body,
        }),
      ),
    ]
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
      .slice(0, limit);
  }

  async applyExperienceReview(
    experienceId: string,
    reviewerMemberId: string,
    decision: ExperienceReviewDecision,
  ): Promise<ExperienceReviewResult | null> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query<{
        organization_id: string;
        privacy_level: ExperiencePrivacyLevel;
        moderation_status: ExperienceStatus;
      }>(
        `SELECT organization_id, privacy_level, moderation_status FROM organization_experiences WHERE id=$1 FOR UPDATE`,
        [experienceId],
      );
      const row = current.rows[0];
      if (!row || row.moderation_status !== "pending_moderation") {
        await client.query("ROLLBACK");
        return null;
      }
      const status = statusForExperienceReview(decision, row.privacy_level);
      await client.query(
        `UPDATE organization_experiences SET moderation_status=$2, reviewer_member_id=$3, moderated_at=NOW(), moderation_note=$4, updated_at=NOW() WHERE id=$1`,
        [experienceId, status, reviewerMemberId, decision.reason],
      );
      await client.query(
        `INSERT INTO organization_transparency_audit_events (organization_id, actor_member_id, actor_kind, event_type, event_payload, created_at)
         VALUES ($1,$2,'admin',$3,$4::jsonb,NOW())`,
        [
          row.organization_id,
          reviewerMemberId,
          `experience_${status}`,
          JSON.stringify({
            experienceId,
            disposition: decision.disposition,
            reason: decision.reason,
            privacyLevel: row.privacy_level,
          }),
        ],
      );
      await client.query("COMMIT");
      return {
        experienceId,
        status,
        privacyLevel: row.privacy_level,
        reviewerReason: decision.reason,
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async applyExperienceAppealDecision(
    appealId: string,
    reviewerMemberId: string,
    decision: ExperienceAppealDecision,
  ): Promise<{
    appealId: string;
    status: string;
    experienceId: string;
  } | null> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query<{
        experience_id: string;
        organization_id: string;
        status: string;
      }>(
        `SELECT experience_id, organization_id, status FROM organization_experience_appeals WHERE id=$1 FOR UPDATE`,
        [appealId],
      );
      const row = current.rows[0];
      if (!row || row.status !== "pending_moderation") {
        await client.query("ROLLBACK");
        return null;
      }
      const status =
        decision.disposition === "reopen" ? "accepted" : "declined";
      await client.query(
        `UPDATE organization_experience_appeals SET status=$2, reviewer_member_id=$3, reviewer_note=$4, reviewed_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [appealId, status, reviewerMemberId, decision.reason],
      );
      if (decision.disposition === "reopen") {
        await client.query(
          `UPDATE organization_experiences SET moderation_status='pending_moderation', reviewer_member_id=NULL, moderated_at=NULL, moderation_note=NULL, updated_at=NOW() WHERE id=$1`,
          [row.experience_id],
        );
      }
      await client.query(
        `INSERT INTO organization_transparency_audit_events (organization_id, actor_member_id, actor_kind, event_type, event_payload, created_at)
        VALUES ($1,$2,'admin',$3,$4::jsonb,NOW())`,
        [
          row.organization_id,
          reviewerMemberId,
          decision.disposition === "reopen"
            ? "experience_appeal_reopened"
            : "experience_appeal_declined",
          JSON.stringify({
            appealId,
            experienceId: row.experience_id,
            reason: decision.reason,
          }),
        ],
      );
      await client.query("COMMIT");
      return { appealId, status, experienceId: row.experience_id };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async createOwnerClaim(
    organizationId: string,
    memberId: string,
    note: string | undefined,
  ): Promise<{ claimId: string; status: string }> {
    const result = await this.database.query<{ id: string; status: string }>(
      `INSERT INTO organization_owner_claims (organization_id, claimant_member_id, claim_note, status, created_at, updated_at)
       VALUES ($1,$2,$3,'pending_verification',NOW(),NOW()) ON CONFLICT (organization_id, claimant_member_id)
       WHERE status='pending_verification' DO UPDATE SET claim_note=EXCLUDED.claim_note, updated_at=NOW() RETURNING id,status`,
      [organizationId, memberId, note ?? null],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Owner claim could not be recorded");
    return { claimId: row.id, status: row.status };
  }

  async hasApprovedOwnerClaim(
    organizationId: string,
    memberId: string,
  ): Promise<boolean> {
    const result = await this.database.query<{ id: string }>(
      `SELECT id FROM organization_owner_claims WHERE organization_id=$1 AND claimant_member_id=$2 AND status='approved' AND revoked_at IS NULL LIMIT 1`,
      [organizationId, memberId],
    );
    return result.rows.length > 0;
  }

  async createOwnerAction(
    input: OrganizationOwnerActionInput,
    organizationId: string,
    memberId: string,
  ): Promise<{ actionId: string; status: string }> {
    const result = await this.database.query<{ id: string; status: string }>(
      `INSERT INTO organization_owner_actions (organization_id, actor_member_id, action_type, target_experience_id, field_name, corrected_value, body, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending_moderation',NOW(),NOW()) RETURNING id,status`,
      [
        organizationId,
        memberId,
        input.actionType,
        input.targetExperienceId ?? null,
        input.fieldName ?? null,
        input.correctedValue ?? null,
        input.body,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Owner action could not be recorded");
    return { actionId: row.id, status: row.status };
  }

  async applyModerationDecision(
    organizationId: string,
    adminMemberId: string,
    decision: OrganizationModerationDecision,
  ): Promise<OrganizationSurfaceState | null> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{
        factual_status: OrganizationFactualStatus;
        search_status: SurfaceStatus;
        map_pin_status: SurfaceStatus;
        kinfolk_status: SurfaceStatus;
        promotion_status: SurfaceStatus;
        experience_status: SurfaceStatus;
      }>(
        `UPDATE organization_profiles SET factual_status=$2, search_status=$3, map_pin_status=$4, kinfolk_status=$5, promotion_status=$6, experience_status=$7, updated_at=NOW()
         WHERE id=$1 RETURNING factual_status,search_status,map_pin_status,kinfolk_status,promotion_status,experience_status`,
        [
          organizationId,
          decision.factualStatus,
          decision.searchStatus,
          decision.mapPinStatus,
          decision.kinfolkStatus,
          decision.promotionStatus,
          decision.experienceStatus,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return null;
      }
      await client.query(
        `UPDATE organization_locations SET location_status=$2, updated_at=NOW() WHERE organization_id=$1 AND is_primary=TRUE`,
        [organizationId, decision.locationStatus],
      );
      await client.query(
        `INSERT INTO organization_transparency_audit_events (organization_id, actor_member_id, actor_kind, event_type, event_payload, created_at)
        VALUES ($1,$2,'admin','surface_moderation',$3::jsonb,NOW())`,
        [organizationId, adminMemberId, JSON.stringify(decision)],
      );
      await client.query("COMMIT");
      return {
        factualStatus: row.factual_status,
        searchStatus: row.search_status,
        mapPinStatus: row.map_pin_status,
        kinfolkStatus: row.kinfolk_status,
        promotionStatus: row.promotion_status,
        experienceStatus: row.experience_status,
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private mapPublicProfile(
    row:
      | {
          id: string;
          legal_name: string;
          display_name: string | null;
          organization_type: OrganizationType;
          ownership_status: string;
          website: string | null;
          phone: string | null;
          factual_status: OrganizationFactualStatus;
          search_status: SurfaceStatus;
          map_pin_status: SurfaceStatus;
          kinfolk_status: SurfaceStatus;
          promotion_status: SurfaceStatus;
          experience_status: SurfaceStatus;
          city: string;
          state: string | null;
          country: string | null;
        }
      | undefined,
  ): PublicOrganizationProfile | null {
    if (!row) return null;
    return {
      id: row.id,
      legalName: row.legal_name,
      displayName: row.display_name,
      organizationType: row.organization_type,
      ownershipStatus: row.ownership_status,
      website: row.website,
      phone: row.phone,
      factualStatus: row.factual_status,
      searchStatus: row.search_status,
      mapPinStatus: row.map_pin_status,
      kinfolkStatus: row.kinfolk_status,
      promotionStatus: row.promotion_status,
      experienceStatus: row.experience_status,
      city: row.city,
      state: row.state,
      country: row.country,
    };
  }
}
