import type {
  OrganizationFactualStatus,
  OrganizationSurfaceState,
  OrganizationType,
  SurfaceStatus,
} from "./policy";
import type {
  OrganizationExperienceInput,
  OrganizationOwnerActionInput,
  OrganizationSubmissionInput,
} from "./validation";

export type OrganizationTransparencyDatabase = {
  query<T = Record<string, unknown>>(
    statement: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
  connect(): Promise<OrganizationTransparencyDatabase & { release(): void }>;
};

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

export type OrganizationExperienceSummary = Readonly<{
  totalPublished: number;
  categoryCounts: Record<string, number>;
  relationshipCounts: Record<string, number>;
}>;

export type OrganizationModerationDecision = Readonly<{
  factualStatus: OrganizationFactualStatus;
  searchStatus: SurfaceStatus;
  mapPinStatus: SurfaceStatus;
  kinfolkStatus: SurfaceStatus;
  promotionStatus: SurfaceStatus;
  experienceStatus: SurfaceStatus;
  reason: string;
}>;

export interface OrganizationTransparencyRepository {
  findDuplicateCandidates(
    input: OrganizationSubmissionInput,
  ): Promise<DuplicateOrganizationCandidate[]>;
  createMemberSubmission(
    input: OrganizationSubmissionInput,
    memberId: string,
  ): Promise<{ organizationId: string; locationId: string }>;
  getPublicProfile(
    organizationId: string,
  ): Promise<PublicOrganizationProfile | null>;
  getOrganizationForExperience(organizationId: string): Promise<{
    organizationType: OrganizationType;
    experienceStatus: SurfaceStatus;
  } | null>;
  createExperience(
    input: OrganizationExperienceInput,
    organizationId: string,
    memberId: string,
  ): Promise<{ experienceId: string; status: string }>;
  getExperienceSummary(
    organizationId: string,
  ): Promise<OrganizationExperienceSummary>;
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
      `SELECT p.id, p.legal_name, p.display_name, p.organization_type,
              l.city, l.state, p.website, p.factual_status
         FROM organization_profiles p
         JOIN organization_locations l ON l.organization_id = p.id
        WHERE LOWER(BTRIM(p.legal_name)) = LOWER(BTRIM($1))
          AND LOWER(BTRIM(l.city)) = LOWER(BTRIM($2))
          AND COALESCE(l.state, '') = COALESCE($3, '')
          AND p.factual_status <> 'hidden'
        ORDER BY p.updated_at DESC
        LIMIT 8`,
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

  async createMemberSubmission(
    input: OrganizationSubmissionInput,
    memberId: string,
  ): Promise<{ organizationId: string; locationId: string }> {
    const client = await this.database.connect();
    try {
      await client.query("BEGIN");
      const profile = await client.query<{ id: string }>(
        `INSERT INTO organization_profiles
          (legal_name, display_name, organization_type, ownership_status, website, phone,
           factual_status, search_status, map_pin_status, kinfolk_status, promotion_status,
           experience_status, submitted_by_member_id, submission_relationship, client_request_id,
           created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,
                 'pending_moderation','not_eligible','not_eligible','not_eligible','not_eligible',
                 'review_required',$7,$8,$9,NOW(),NOW())
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
      const location = await client.query<{ id: string }>(
        `INSERT INTO organization_locations
          (organization_id, location_name, address_line_1, address_line_2, city, state, postal_code, country,
           location_status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending_moderation',NOW(),NOW())
         RETURNING id`,
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
      `SELECT p.id, p.legal_name, p.display_name, p.organization_type, p.ownership_status,
              p.website, p.phone, p.factual_status, p.search_status, p.map_pin_status,
              p.kinfolk_status, p.promotion_status, p.experience_status,
              l.city, l.state, l.country
         FROM organization_profiles p
         JOIN organization_locations l ON l.organization_id = p.id
        WHERE p.id = $1
          AND p.factual_status = 'factual_approved'
          AND p.search_status = 'eligible'
          AND l.location_status = 'factual_approved'
        ORDER BY l.is_primary DESC, l.created_at ASC
        LIMIT 1`,
      [organizationId],
    );
    const row = result.rows[0];
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

  async getOrganizationForExperience(organizationId: string): Promise<{
    organizationType: OrganizationType;
    experienceStatus: SurfaceStatus;
  } | null> {
    const result = await this.database.query<{
      organization_type: OrganizationType;
      experience_status: SurfaceStatus;
    }>(
      `SELECT organization_type, experience_status
         FROM organization_profiles
        WHERE id = $1
          AND factual_status = 'factual_approved'
          AND search_status = 'eligible'
        LIMIT 1`,
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
  ): Promise<{ experienceId: string; status: string }> {
    const result = await this.database.query<{
      id: string;
      moderation_status: string;
    }>(
      `INSERT INTO organization_experiences
        (organization_id, author_member_id, relationship, experience_context, category_codes,
         narrative, privacy_level, moderation_status, client_request_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,'pending_moderation',$8,NOW(),NOW())
       RETURNING id, moderation_status`,
      [
        organizationId,
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
        input.clientRequestId ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Experience insertion failed");
    return { experienceId: row.id, status: row.moderation_status };
  }

  async getExperienceSummary(
    organizationId: string,
  ): Promise<OrganizationExperienceSummary> {
    const [categoryResult, relationshipResult] = await Promise.all([
      this.database.query<{ category: string; count: string | number }>(
        `SELECT category, COUNT(*)::int AS count
           FROM organization_experiences e
           CROSS JOIN LATERAL jsonb_array_elements_text(e.category_codes) AS category
          WHERE e.organization_id = $1
            AND e.moderation_status = 'published'
            AND e.privacy_level = 'pseudonymous_public'
          GROUP BY category
          ORDER BY count DESC, category ASC`,
        [organizationId],
      ),
      this.database.query<{ relationship: string; count: string | number }>(
        `SELECT relationship, COUNT(*)::int AS count
           FROM organization_experiences
          WHERE organization_id = $1
            AND moderation_status = 'published'
            AND privacy_level = 'pseudonymous_public'
          GROUP BY relationship
          ORDER BY count DESC, relationship ASC`,
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

  async createOwnerClaim(
    organizationId: string,
    memberId: string,
    note: string | undefined,
  ): Promise<{ claimId: string; status: string }> {
    const result = await this.database.query<{ id: string; status: string }>(
      `INSERT INTO organization_owner_claims
        (organization_id, claimant_member_id, claim_note, status, created_at, updated_at)
       VALUES ($1,$2,$3,'pending_verification',NOW(),NOW())
       ON CONFLICT (organization_id, claimant_member_id)
       WHERE status = 'pending_verification'
       DO UPDATE SET claim_note = EXCLUDED.claim_note, updated_at = NOW()
       RETURNING id, status`,
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
      `SELECT id
         FROM organization_owner_claims
        WHERE organization_id = $1
          AND claimant_member_id = $2
          AND status = 'approved'
          AND revoked_at IS NULL
        LIMIT 1`,
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
      `INSERT INTO organization_owner_actions
        (organization_id, actor_member_id, action_type, target_experience_id, field_name,
         corrected_value, body, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending_moderation',NOW(),NOW())
       RETURNING id, status`,
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
        `UPDATE organization_profiles
            SET factual_status = $2,
                search_status = $3,
                map_pin_status = $4,
                kinfolk_status = $5,
                promotion_status = $6,
                experience_status = $7,
                updated_at = NOW()
          WHERE id = $1
          RETURNING factual_status, search_status, map_pin_status, kinfolk_status, promotion_status, experience_status`,
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
        `INSERT INTO organization_transparency_audit_events
          (organization_id, actor_member_id, actor_kind, event_type, event_payload, created_at)
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
}
