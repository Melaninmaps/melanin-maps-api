/* MWM KinfolkAI Four-Purpose Enforcement Patch
 *
 * Integrate these helpers into routes/kinfolk.ts and the governed business
 * ingestion/recommendation path. They are intentionally server-authoritative:
 * model output is treated as a proposal, never as proof.
 */

export type Purpose = "flywheel" | "education" | "safety" | "promotion";

export type BusinessEvidence = {
  sourceUrl?: string | null;
  sourceProvider?: string | null;
  sourceRecordId?: string | null;
  verified?: boolean | null;
  fetchedAt?: string | null;
};

export type SafeBusiness = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  state?: string | null;
  description?: string | null;
  website?: string | null;
  phone?: string | null;
  verified?: boolean | null;
  evidence?: BusinessEvidence[];
  paidPlacement?: boolean;
  claimed?: boolean;
};

export type RecommendationProposal = {
  name?: unknown;
  businessId?: unknown;
  id?: unknown;
  city?: unknown;
  category?: unknown;
  website?: unknown;
  phone?: unknown;
  description?: unknown;
  paidPlacement?: unknown;
};

export type SafeSource = {
  id: string;
  title: string;
  url: string;
  label: "mwM_database" | "official" | "maps" | "web_search" | "library" | "official_safety" | "community_report";
  fetchedAt?: string;
};

function nonempty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Use this predicate in every Kinfolk catalog/recommendation query.
 * If the current schema uses different column names, adapt the SQL once here.
 */
export const PUBLIC_BUSINESS_SQL = `
  b.status = 'active'
  AND COALESCE(b.is_duplicate, false) = false
  AND COALESCE(b.permanently_hidden, false) = false
  AND COALESCE(b.removed_at IS NULL, true)
`;

/**
 * Never allow model-generated business objects to become public recommendations
 * unless they resolve to a server row returned by the governed catalog query.
 */
export function validatePromotionCandidates(
  proposals: unknown,
  catalog: SafeBusiness[],
): { businesses: SafeBusiness[]; rejected: number; reason: string | null } {
  const rows = Array.isArray(proposals) ? proposals as RecommendationProposal[] : [];
  const byId = new Map(catalog.map((b) => [b.id, b]));
  const byNameCity = new Map(catalog.map((b) => [
    `${b.name.toLowerCase()}|${(b.city ?? "").toLowerCase()}`,
    b,
  ]));
  const businesses: SafeBusiness[] = [];
  let rejected = 0;

  for (const row of rows) {
    const id = nonempty(row.businessId) ?? nonempty(row.id);
    const name = nonempty(row.name);
    const city = nonempty(row.city);
    const matched = (id && byId.get(id)) || (name && city && byNameCity.get(`${name.toLowerCase()}|${city.toLowerCase()}`));
    if (!matched) {
      rejected++;
      continue;
    }
    businesses.push({
      ...matched,
      paidPlacement: matched.paidPlacement === true,
    });
  }

  return {
    businesses: businesses.slice(0, 12),
    rejected,
    reason: rejected > 0 ? "Some model proposals were not found in the server-authoritative catalog and were removed." : null,
  };
}

/** Enforce a transparent promotion label. Claimed or paid status is never inferred. */
export function promotionDisclosure(business: SafeBusiness): string | null {
  if (business.paidPlacement === true) return "Paid or sponsored placement — shown separately from organic recommendations.";
  if (business.claimed === true) return "Business profile claimed by an owner or authorized representative.";
  return null;
}

/**
 * Educational answers must expose at least one source for factual claims.
 * A missing source produces a clarification/limitation, not fabricated citations.
 */
export function enforceEducationalSources(
  reply: string,
  sources: SafeSource[],
  libraryAction: Record<string, unknown> | null,
): { reply: string; sources: SafeSource[]; educationalStatus: "grounded" | "limited" | "needs_review" } {
  const unique = Array.from(new Map(sources.filter((s) => s?.url && s?.title).map((s) => [s.url, s])).values());
  if (unique.length > 0) return { reply, sources: unique, educationalStatus: "grounded" };
  if (libraryAction) {
    return {
      reply: `${reply}\n\nI can point you to the Library topic, but I do not have a verified source attached to this answer yet. Please open the topic for the source-backed material.`,
      sources: [],
      educationalStatus: "limited",
    };
  }
  return {
    reply: `${reply}\n\nI can give general context, but I could not verify a source for the specific factual details.`,
    sources: [],
    educationalStatus: "needs_review",
  };
}

/** Consistent safety envelope for emergency, travel-safety, and community reports. */
export function safetyEnvelope(intentClass: string, sources: SafeSource[]): string | null {
  if (!/safety|emergency|crime|danger|safe|unsafe|violence|medical/i.test(intentClass)) return null;
  const official = sources.some((s) => s.label === "official_safety");
  return official
    ? "Safety information can change. Verify current alerts with official local authorities. For an immediate emergency, contact local emergency services. Community reports are experiences, not guarantees."
    : "I do not have a current official safety alert attached to this answer. Treat community information as context, verify with official local authorities, and contact emergency services for immediate danger."
}

/**
 * Idempotent flywheel event payload. Use a database unique key on
 * (user_id, event_type, canonical_subject, source_surface, event_day).
 * Never persist raw sensitive prompts in this event table.
 */
export function buildFlywheelEvent(input: {
  userId: string;
  eventType: "business_view" | "business_save" | "business_checkin" | "business_vibe" | "library_follow" | "library_open" | "kinfolk_query";
  canonicalSubject: string;
  sourceSurface: string;
  sensitive: boolean;
  isLoadTest?: boolean;
}) {
  const subject = input.canonicalSubject.trim().toLowerCase().slice(0, 160);
  return {
    userId: input.userId,
    eventType: input.eventType,
    canonicalSubject: subject,
    sourceSurface: input.sourceSurface,
    eventDay: new Date().toISOString().slice(0, 10),
    learningEligible: !input.sensitive,
    isLoadTest: input.isLoadTest === true,
    createdAt: new Date().toISOString(),
  };
}

/** Server-side orchestration after the model returns. */
export function enforceKinfolkResponse(input: {
  reply: string;
  modelRecommendations: unknown;
  catalog: SafeBusiness[];
  sources: SafeSource[];
  libraryAction: Record<string, unknown> | null;
  intentClass: string;
}) {
  const promotion = validatePromotionCandidates(input.modelRecommendations, input.catalog);
  const education = enforceEducationalSources(input.reply, input.sources, input.libraryAction);
  const safety = safetyEnvelope(input.intentClass, input.sources);
  return {
    reply: safety ? `${education.reply}\n\n${safety}` : education.reply,
    recommendations: promotion.businesses.length > 0 ? { businesses: promotion.businesses } : null,
    rejectedRecommendations: promotion.rejected,
    sources: education.sources,
    educationalStatus: education.educationalStatus,
    safetyNotice: safety,
    promotionDisclosure: promotion.businesses.map(promotionDisclosure).filter(Boolean),
  };
}

/* Integration points in routes/kinfolk.ts:

A. Add PUBLIC_BUSINESS_SQL to every businessCatalog, discovery-enrichment, and
   nearby-nudge SQL WHERE clause. Do not rely on status='active' alone.

B. After JSON parsing and local catalog enrichment, call enforceKinfolkResponse.
   Replace the response's model recommendations with the returned recommendations.
   Append returned sources and educationalStatus. Never expose rejected proposals.

C. Replace fire-and-forget growth capture with an INSERT ... ON CONFLICT DO NOTHING
   using buildFlywheelEvent. Keep raw messages out of this event table.

D. Add safetyNotice to the JSON response for safety/emergency intents.

E. Keep smartPromotion only when its business ID resolves through the same catalog;
   otherwise return null. Show paid/claimed disclosure separately.
*/
