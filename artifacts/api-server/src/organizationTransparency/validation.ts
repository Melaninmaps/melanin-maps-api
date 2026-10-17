import {
  EXPERIENCE_PRIVACY_LEVELS,
  EXPERIENCE_RELATIONSHIPS,
  ORGANIZATION_TYPES,
  OWNERSHIP_STATUSES,
  assertExperienceBoundary,
  experienceCategoriesFor,
  experienceContextForRelationship,
  type ExperiencePrivacyLevel,
  type ExperienceRelationship,
  type OrganizationType,
  type OwnershipStatus,
} from "./policy";

export type OrganizationSubmissionInput = Readonly<{
  legalName: string;
  displayName?: string;
  organizationType: OrganizationType;
  ownershipStatus: OwnershipStatus;
  website?: string;
  phone?: string;
  location: {
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  relationshipToOrganization: ExperienceRelationship;
  submitterNote?: string;
  clientRequestId?: string;
}>;

export type OrganizationExperienceInput = Readonly<{
  relationship: ExperienceRelationship;
  categoryCodes: string[];
  narrative?: string;
  privacyLevel: ExperiencePrivacyLevel;
  organizationLocationId?: string;
  clientRequestId?: string;
}>;

export type OrganizationExperienceAppealInput = Readonly<{
  body: string;
  clientRequestId?: string;
}>;

export type OrganizationOwnerActionInput = Readonly<{
  actionType: "public_response" | "factual_correction" | "dispute";
  body: string;
  targetExperienceId?: string;
  fieldName?: string;
  correctedValue?: string;
}>;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function optionalText(
  source: Record<string, unknown>,
  field: string,
  maxLength: number,
): string | undefined {
  const value = source[field];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error(`${field} must be text`);
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > maxLength)
    throw new Error(`${field} must be ${maxLength} characters or fewer`);
  return normalized;
}

function requiredText(
  source: Record<string, unknown>,
  field: string,
  maxLength: number,
): string {
  const value = optionalText(source, field, maxLength);
  if (!value) throw new Error(`${field} is required`);
  return value;
}

function enumValue<T extends readonly string[]>(
  source: Record<string, unknown>,
  field: string,
  options: T,
): T[number] {
  const value = requiredText(source, field, 80);
  if (!(options as readonly string[]).includes(value)) {
    throw new Error(`${field} is invalid`);
  }
  return value as T[number];
}

function normalizePublicHttpsUrl(value: string, field: string): string {
  const raw = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${field} must be a valid public https URL`);
  }
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(`${field} must be a valid public https URL`);
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^10\.|^192\.168\.|^172\.(?:1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw new Error(`${field} must be a public https URL`);
  }
  const normalized = parsed.toString();
  if (normalized.length > 512) throw new Error(`${field} is too long`);
  return normalized;
}

function normalizeClientRequestId(
  source: Record<string, unknown>,
): string | undefined {
  const value = optionalText(source, "clientRequestId", 128);
  if (value && !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(value)) {
    throw new Error("clientRequestId is invalid");
  }
  return value;
}

function normalizeCategories(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error("categoryCodes must be a list");
  const categories: string[] = [];
  for (const item of value) {
    if (typeof item !== "string")
      throw new Error("categoryCodes must contain text");
    const category = item.trim();
    if (!category) continue;
    if (!categories.includes(category)) categories.push(category);
  }
  return categories;
}

/** Validates member organization intake. It has no promotion or map fields. */
export function validateOrganizationSubmission(
  input: unknown,
): OrganizationSubmissionInput {
  const body = record(input, "organization submission");
  const location = record(body.location, "location");
  const organizationType = enumValue(
    body,
    "organizationType",
    ORGANIZATION_TYPES,
  );
  const ownershipStatus = enumValue(
    body,
    "ownershipStatus",
    OWNERSHIP_STATUSES,
  );
  if (ownershipStatus === "verified_minority_owned") {
    throw new Error(
      "verified_minority_owned may only be set through a separate evidence review",
    );
  }
  const relationshipToOrganization = enumValue(
    body,
    "relationshipToOrganization",
    EXPERIENCE_RELATIONSHIPS,
  );
  const website = optionalText(body, "website", 512);

  return {
    legalName: requiredText(body, "legalName", 255),
    displayName: optionalText(body, "displayName", 255),
    organizationType,
    ownershipStatus,
    website: website ? normalizePublicHttpsUrl(website, "website") : undefined,
    phone: optionalText(body, "phone", 40),
    location: {
      name: optionalText(location, "name", 255),
      addressLine1: optionalText(location, "addressLine1", 255),
      addressLine2: optionalText(location, "addressLine2", 255),
      city: requiredText(location, "city", 100),
      state: optionalText(location, "state", 100),
      postalCode: optionalText(location, "postalCode", 32),
      country: optionalText(location, "country", 100),
    },
    relationshipToOrganization,
    submitterNote: optionalText(body, "submitterNote", 2_000),
    clientRequestId: normalizeClientRequestId(body),
  };
}

/**
 * Validates structured experience submission. Star/rating fields are rejected
 * instead of silently treated as a score, preserving the thematic model.
 */
export function validateOrganizationExperience(
  input: unknown,
  organizationType: OrganizationType,
): OrganizationExperienceInput {
  const body = record(input, "organization experience");
  if (
    body.rating !== undefined ||
    body.stars !== undefined ||
    body.score !== undefined
  ) {
    throw new Error(
      "Organization experiences use structured themes, not star ratings",
    );
  }
  const relationship = enumValue(
    body,
    "relationship",
    EXPERIENCE_RELATIONSHIPS,
  );
  const privacyLevel = enumValue(
    body,
    "privacyLevel",
    EXPERIENCE_PRIVACY_LEVELS,
  );
  const categoryCodes = normalizeCategories(body.categoryCodes);
  const expected = new Set(
    experienceCategoriesFor({ organizationType, relationship }),
  );
  for (const category of categoryCodes) {
    if (!expected.has(category)) {
      throw new Error(
        `Category ${category} is not available for this organization and relationship`,
      );
    }
  }
  assertExperienceBoundary({
    relationship,
    context: experienceContextForRelationship(relationship),
    categoryCodes,
    privacyLevel,
  });

  return {
    relationship,
    categoryCodes,
    narrative: optionalText(body, "narrative", 4_000),
    privacyLevel,
    organizationLocationId: optionalText(body, "organizationLocationId", 64),
    clientRequestId: normalizeClientRequestId(body),
  };
}

/** Appeals add reviewer context; they never self-publish or alter the original. */
export function validateOrganizationExperienceAppeal(
  input: unknown,
): OrganizationExperienceAppealInput {
  const body = record(input, "organization experience appeal");
  return {
    body: requiredText(body, "body", 2_000),
    clientRequestId: normalizeClientRequestId(body),
  };
}

/** Owners may respond, request factual corrections, or dispute; they cannot delete member experience. */
export function validateOrganizationOwnerAction(
  input: unknown,
): OrganizationOwnerActionInput {
  const body = record(input, "owner action");
  const actionType = requiredText(body, "actionType", 40);
  if (
    !(
      ["public_response", "factual_correction", "dispute"] as string[]
    ).includes(actionType)
  ) {
    throw new Error("actionType is invalid");
  }
  const targetExperienceId = optionalText(body, "targetExperienceId", 64);
  const fieldName = optionalText(body, "fieldName", 100);
  const correctedValue = optionalText(body, "correctedValue", 1_000);
  if (actionType === "public_response" && !targetExperienceId) {
    throw new Error("targetExperienceId is required for a public response");
  }
  if (actionType === "factual_correction" && (!fieldName || !correctedValue)) {
    throw new Error(
      "fieldName and correctedValue are required for a factual correction",
    );
  }
  return {
    actionType: actionType as OrganizationOwnerActionInput["actionType"],
    body: requiredText(body, "body", 2_000),
    targetExperienceId,
    fieldName,
    correctedValue,
  };
}
