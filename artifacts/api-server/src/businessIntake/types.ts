// ── Community Business Submission — Input Types ────────────────────────────
// PERMANENT RULE: community submissions always start as pending_review.
// They are invisible on the map, in search, in Kinfolk results, and in
// every public API until the founder explicitly approves them.

export interface CommunityBusinessSubmissionInput {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  address?: string;
  city: string;
  state?: string;
  country?: string;
  website?: string;
  phone?: string;
  ownershipDesignations?: string[];
  sourceCampaign?: string;
  sourceChannel?: string;
  submitterNote?: string;
}

export function validateSubmission(input: unknown): CommunityBusinessSubmissionInput {
  const body = input as Record<string, unknown>;

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    throw new Error("name is required");
  }
  if (!body.category || typeof body.category !== "string" || !body.category.trim()) {
    throw new Error("category is required");
  }
  if (!body.city || typeof body.city !== "string" || !body.city.trim()) {
    throw new Error("city is required");
  }

  return {
    name: (body.name as string).trim(),
    category: (body.category as string).trim(),
    subcategory: typeof body.subcategory === "string" ? body.subcategory.trim() || undefined : undefined,
    description: typeof body.description === "string" ? body.description.trim() || undefined : undefined,
    address: typeof body.address === "string" ? body.address.trim() || undefined : undefined,
    city: (body.city as string).trim(),
    state: typeof body.state === "string" ? body.state.trim() || undefined : undefined,
    country: typeof body.country === "string" ? body.country.trim() || undefined : undefined,
    website: typeof body.website === "string" ? body.website.trim() || undefined : undefined,
    phone: typeof body.phone === "string" ? body.phone.trim() || undefined : undefined,
    ownershipDesignations: Array.isArray(body.ownershipDesignations)
      ? (body.ownershipDesignations as string[]).filter((s) => typeof s === "string")
      : [],
    sourceCampaign: typeof body.sourceCampaign === "string" ? body.sourceCampaign.trim() || undefined : undefined,
    sourceChannel: typeof body.sourceChannel === "string" ? body.sourceChannel.trim() || undefined : undefined,
    submitterNote: typeof body.submitterNote === "string" ? body.submitterNote.trim() || undefined : undefined,
  };
}
