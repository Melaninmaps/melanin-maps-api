/*
 * Mapping With Melanin — Universal Kinfolk Search Router
 *
 * Suggested placement:
 *   server/kinfolk/universal-search-router.ts
 *
 * Dependencies already typical of a Node/TypeScript API service:
 *   npm install openai express @supabase/supabase-js
 *
 * IMPORTANT
 * - This module is additive. Mount it after the existing authenticated-session middleware.
 * - Do not replace /api/kinfolk/chat until contract tests pass.
 * - Set KINFOLK_ROUTER_MODEL and KINFOLK_ANSWER_MODEL in Railway variables.
 *   Do NOT hard-code an unverified model name.
 * - This code intentionally does not log raw user messages.
 */

import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// 1. Types
// -----------------------------------------------------------------------------

export type AgeBand = 'under_13' | '13_17' | '18_24' | '25_plus' | 'unknown';
export type DetailLevel = 'quick' | 'standard' | 'deep';
export type TonePreference =
  | 'default'
  | 'warm'
  | 'professional'
  | 'plain_language'
  | 'regional_opt_in';
export type NotificationCadence =
  | 'none'
  | 'essential_only'
  | 'weekly_digest'
  | 'opt_in_updates';

export type Intent =
  | 'general_knowledge'
  | 'culture_entertainment'
  | 'hobby_lifestyle'
  | 'community_business_discovery'
  | 'travel_relocation'
  | 'medical_health'
  | 'legal_regulated'
  | 'financial_regulated'
  | 'safety_emergency'
  | 'business_owner'
  | 'unknown';

export type Consequence = 'low' | 'medium' | 'high';
export type Freshness = 'none' | 'helpful' | 'required';
export type SearchMode = 'none' | 'library_first' | 'web_optional' | 'web_required';
export type CitationMode = 'none' | 'recommended' | 'required';
export type ResponseStyle = 'concise' | 'conversational' | 'careful' | 'urgent';
export type RetrievalSource = 'library' | 'mwm_directory' | 'mwm_community' | 'live_web';

export interface ApproximateLocation {
  city?: string;
  region?: string;
  countryCode?: string;
  timezone?: string;
}

/**
 * Only explicit, non-sensitive preferences belong here.
 * Do not add inferred health, relationship, immigration, financial, or political traits.
 */
export interface DeliveryProfile {
  detailLevel: DetailLevel;
  tonePreference: TonePreference;
  learningMode: 'guided' | 'self_directed';
  notificationCadence: NotificationCadence;
  ageBand: AgeBand;
  regionalLanguageOptIn: boolean;
  regionalReference: string | null; // e.g. "Philadelphia" only when user opted in
  allowRelatedBranches: boolean;
  allowNonSensitiveRecommendations: boolean;
  allowCivicSafetyUpdates: boolean;
}

export interface UserLearningPermission {
  domainSlug: string;
  allowedForPrivateHelp: boolean;
  allowedForRecommendations: boolean;
  allowedForCircleUse: boolean;
  allowedForAnonymousAggregate: boolean;
}

export interface KinfolkRouteRequest {
  conversationId: string;
  message: string;
  context?: {
    locale?: string;
    approximateLocation?: ApproximateLocation;
    requestedTone?: TonePreference;
    userExplicitPreferences?: string[];
  };
  requestOptions?: {
    freshnessPreference?: 'auto' | 'current' | 'stable';
    researchDepth?: 'auto' | 'quick' | 'deep';
    citationsPreference?: 'auto' | 'always' | 'never_for_low_stakes';
  };
}

export interface PrivacyBoundary {
  mayUseSensitiveMemory: boolean;
  mayUseLocation: boolean;
  mayUseCommunitySignals: boolean;
  mayCreateLibraryCandidate: boolean;
  mayProactivelyNotify: boolean;
}

export interface RouterPlan {
  intent: Intent;
  domainTags: string[];
  consequence: Consequence;
  freshness: Freshness;
  searchMode: SearchMode;
  retrievalSources: RetrievalSource[];
  sourcePolicyId: string;
  citationMode: CitationMode;
  responseStyle: ResponseStyle;
  privacyBoundary: PrivacyBoundary;
  requiresAgeAppropriateFraming: boolean;
  maySuggestOptionalBranch: boolean;
}

export interface DeliveryPlan {
  maxAnswerSections: number;
  maxBullets: number;
  includeSourceDetailsByDefault: boolean;
  permitRegionalLanguage: boolean;
  toneInstruction: string;
  proactiveDeliveryAllowed: boolean;
  prohibitedTopicsForProactiveDelivery: string[];
}

export interface SourcePolicy {
  id: string;
  slug: string;
  domainSlug: string;
  consequence: Consequence;
  citationMode: CitationMode;
  searchMode: SearchMode;
  minimumDistinctSources: number;
  minimumAuthoritativeSources: number;
  communityEvidenceAllowed: boolean;
  allowedDomains: string[];
  blockedDomains: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string; role?: string };
  kinfolk?: {
    route?: RouterPlan;
    delivery?: DeliveryPlan;
    sourcePolicy?: SourcePolicy;
    requestId?: string;
  };
}

export interface RouterDependencies {
  openai: OpenAI;
  supabase: SupabaseClient;
  now?: () => Date;
  audit?: (event: RouterAuditEvent) => void | Promise<void>;
}

export interface RouterAuditEvent {
  requestId: string;
  userIdHash: string;
  intent?: Intent;
  policyId?: string;
  searchMode?: SearchMode;
  resultStatus: 'success' | 'policy_error' | 'model_error';
  latencyMs: number;
  errorCode?: string;
}

// -----------------------------------------------------------------------------
// 2. JSON Schema used for router structured output
// -----------------------------------------------------------------------------

const ROUTER_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'intent',
    'domainTags',
    'consequence',
    'freshness',
    'searchMode',
    'retrievalSources',
    'sourcePolicyId',
    'citationMode',
    'responseStyle',
    'privacyBoundary',
  ],
  properties: {
    intent: {
      type: 'string',
      enum: [
        'general_knowledge',
        'culture_entertainment',
        'hobby_lifestyle',
        'community_business_discovery',
        'travel_relocation',
        'medical_health',
        'legal_regulated',
        'financial_regulated',
        'safety_emergency',
        'business_owner',
        'unknown',
      ],
    },
    domainTags: { type: 'array', items: { type: 'string' }, maxItems: 8 },
    consequence: { type: 'string', enum: ['low', 'medium', 'high'] },
    freshness: { type: 'string', enum: ['none', 'helpful', 'required'] },
    searchMode: {
      type: 'string',
      enum: ['none', 'library_first', 'web_optional', 'web_required'],
    },
    retrievalSources: {
      type: 'array',
      items: { type: 'string', enum: ['library', 'mwm_directory', 'mwm_community', 'live_web'] },
      maxItems: 4,
    },
    sourcePolicyId: { type: 'string' },
    citationMode: { type: 'string', enum: ['none', 'recommended', 'required'] },
    responseStyle: { type: 'string', enum: ['concise', 'conversational', 'careful', 'urgent'] },
    privacyBoundary: {
      type: 'object',
      additionalProperties: false,
      required: [
        'mayUseSensitiveMemory',
        'mayUseLocation',
        'mayUseCommunitySignals',
        'mayCreateLibraryCandidate',
        'mayProactivelyNotify',
      ],
      properties: {
        mayUseSensitiveMemory: { type: 'boolean' },
        mayUseLocation: { type: 'boolean' },
        mayUseCommunitySignals: { type: 'boolean' },
        mayCreateLibraryCandidate: { type: 'boolean' },
        mayProactivelyNotify: { type: 'boolean' },
      },
    },
  },
} as const;

const ROUTER_SYSTEM_PROMPT = `
You are the Kinfolk Universal Search Router. You only classify a message and produce a retrieval plan.
You NEVER answer the user, diagnose, make a legal determination, or infer sensitive personal traits.

Kinfolk is a culturally aware general-purpose companion. It can answer basic math, discuss music/culture,
research professional topics, discover local hobbies and businesses, and plan travel.

ROUTING RULES
1. Do not classify every question as medical, legal, or academic.
2. Use medical_health, legal_regulated, financial_regulated, or safety_emergency only when the topic has material consequences.
3. A music, sports, hobby, culture, or entertainment question is normally low consequence and may be conversational.
4. A simple calculation or stable fact should use searchMode="none".
5. Require citations for high-consequence medical, legal, financial, and safety queries.
6. Never authorize community experience as evidence for medical, legal, financial, or emergency claims.
7. Never use sensitive memory. Do not infer health, relationship, immigration, finances, trauma, religion, politics, or identity.
8. Location is permitted only when the user asks for local discovery or location materially changes the answer.
9. "Best" is subjective. Use culture_entertainment or hobby_lifestyle as appropriate; do not reject it for lack of objective proof.
10. Proactive notification is false by default. Only a separate notification service may later evaluate explicit opt-in, age policy, relevance, source quality, and frequency caps.

Return only JSON matching the provided schema.
`.trim();

// -----------------------------------------------------------------------------
// 3. Supabase profile/policy access
// -----------------------------------------------------------------------------

async function loadDeliveryProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<DeliveryProfile> {
  const { data, error } = await supabase
    .from('kinfolk_delivery_profiles')
    .select(
      'detail_level,tone_preference,learning_mode,notification_cadence,age_band,regional_language_opt_in,regional_reference,allow_related_branches,allow_non_sensitive_recommendations,allow_civic_safety_updates',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`DELIVERY_PROFILE_LOAD_FAILED:${error.code}`);

  return {
    detailLevel: data?.detail_level ?? 'standard',
    tonePreference: data?.tone_preference ?? 'default',
    learningMode: data?.learning_mode ?? 'guided',
    notificationCadence: data?.notification_cadence ?? 'essential_only',
    ageBand: data?.age_band ?? 'unknown',
    regionalLanguageOptIn: Boolean(data?.regional_language_opt_in),
    regionalReference: data?.regional_reference ?? null,
    allowRelatedBranches: Boolean(data?.allow_related_branches),
    allowNonSensitiveRecommendations: Boolean(data?.allow_non_sensitive_recommendations),
    allowCivicSafetyUpdates: Boolean(data?.allow_civic_safety_updates),
  };
}

async function loadSourcePolicy(
  supabase: SupabaseClient,
  policySlug: string,
): Promise<SourcePolicy> {
  const { data, error } = await supabase
    .from('kinfolk_source_policies')
    .select(
      `id,slug,consequence,citation_mode,search_mode,minimum_distinct_sources,
       minimum_authoritative_sources,community_evidence_allowed,
       kinfolk_evidence_domains!inner(slug),
       kinfolk_source_policy_domains(domain,list_type)`,
    )
    .eq('slug', policySlug)
    .eq('is_active', true)
    .single();

  if (error || !data) throw new Error(`SOURCE_POLICY_NOT_FOUND:${policySlug}`);

  const rules = (data.kinfolk_source_policy_domains ?? []) as Array<{
    domain: string;
    list_type: 'allow' | 'block' | 'prefer';
  }>;

  return {
    id: data.id,
    slug: data.slug,
    domainSlug: (data.kinfolk_evidence_domains as { slug: string }).slug,
    consequence: data.consequence as Consequence,
    citationMode: data.citation_mode as CitationMode,
    searchMode: data.search_mode as SearchMode,
    minimumDistinctSources: data.minimum_distinct_sources,
    minimumAuthoritativeSources: data.minimum_authoritative_sources,
    communityEvidenceAllowed: data.community_evidence_allowed,
    allowedDomains: rules.filter((r) => r.list_type === 'allow').map((r) => r.domain),
    blockedDomains: rules.filter((r) => r.list_type === 'block').map((r) => r.domain),
  };
}

// -----------------------------------------------------------------------------
// 4. Enforced safety, age, privacy, and adaptive-delivery policy
// -----------------------------------------------------------------------------

function enforceHighConsequencePlan(plan: RouterPlan): RouterPlan {
  const highRiskIntent = [
    'medical_health',
    'legal_regulated',
    'financial_regulated',
    'safety_emergency',
  ].includes(plan.intent);

  if (!highRiskIntent) return plan;

  return {
    ...plan,
    consequence: 'high',
    freshness: plan.intent === 'safety_emergency' ? 'required' : plan.freshness,
    searchMode:
      plan.intent === 'safety_emergency'
        ? 'web_required'
        : plan.searchMode === 'none'
          ? 'library_first'
          : plan.searchMode,
    retrievalSources: Array.from(new Set([...plan.retrievalSources, 'library', 'live_web'])),
    citationMode: 'required',
    responseStyle: plan.intent === 'safety_emergency' ? 'urgent' : 'careful',
    privacyBoundary: {
      mayUseSensitiveMemory: false,
      mayUseLocation: plan.intent === 'safety_emergency',
      mayUseCommunitySignals: false,
      mayCreateLibraryCandidate: false,
      mayProactivelyNotify: false,
    },
  };
}

function applyAgeSafety(plan: RouterPlan, profile: DeliveryProfile): RouterPlan {
  const minor = profile.ageBand === 'under_13' || profile.ageBand === '13_17';
  if (!minor) return plan;

  const civicOrTraumatic =
    plan.intent === 'safety_emergency' || plan.domainTags.some((tag) =>
      ['police_violence', 'politics', 'civic_unrest', 'trauma', 'violence'].includes(tag.toLowerCase()),
    );

  return {
    ...plan,
    requiresAgeAppropriateFraming: true,
    privacyBoundary: {
      ...plan.privacyBoundary,
      // Never proactively push sensitive civic/traumatic content to a minor.
      mayProactivelyNotify: civicOrTraumatic ? false : plan.privacyBoundary.mayProactivelyNotify,
      mayCreateLibraryCandidate:
        plan.intent === 'medical_health' || plan.intent === 'safety_emergency'
          ? false
          : plan.privacyBoundary.mayCreateLibraryCandidate,
    },
  };
}

function buildDeliveryPlan(profile: DeliveryProfile, route: RouterPlan): DeliveryPlan {
  const detailMap: Record<DetailLevel, Pick<DeliveryPlan, 'maxAnswerSections' | 'maxBullets' | 'includeSourceDetailsByDefault'>> = {
    quick: { maxAnswerSections: 2, maxBullets: 3, includeSourceDetailsByDefault: false },
    standard: { maxAnswerSections: 4, maxBullets: 5, includeSourceDetailsByDefault: route.citationMode === 'required' },
    deep: { maxAnswerSections: 7, maxBullets: 8, includeSourceDetailsByDefault: true },
  };

  const highStakes = route.consequence === 'high';
  const regionalAllowed =
    profile.tonePreference === 'regional_opt_in' &&
    profile.regionalLanguageOptIn &&
    !highStakes;

  const toneInstruction = highStakes
    ? 'Use calm, precise, plain language. Do not use slang, character voices, or cultural performance.'
    : regionalAllowed
      ? `Use a warm conversational tone. Regional wording is permitted sparingly because the user opted in for ${profile.regionalReference ?? 'their region'}; never imitate an accent or force slang.`
      : profile.tonePreference === 'professional'
        ? 'Use a concise, professional, structured tone.'
        : profile.tonePreference === 'plain_language'
          ? 'Use plain language, explain jargon briefly, and prioritize clarity.'
          : 'Use a warm, clear, conversational tone without assuming identity or background.';

  return {
    ...detailMap[profile.detailLevel],
    permitRegionalLanguage: regionalAllowed,
    toneInstruction,
    proactiveDeliveryAllowed:
      profile.notificationCadence !== 'none' &&
      route.privacyBoundary.mayProactivelyNotify &&
      !(profile.ageBand === 'under_13' || profile.ageBand === '13_17'),
    prohibitedTopicsForProactiveDelivery: [
      'medical',
      'mental_health',
      'fertility',
      'hiv',
      'divorce',
      'immigration',
      'financial_distress',
      'police_violence',
    ],
  };
}

function planAllowsOptionalBranch(plan: RouterPlan, profile: DeliveryProfile): boolean {
  if (!profile.allowRelatedBranches) return false;
  if (plan.consequence === 'high') return false;
  if (['medical_health', 'legal_regulated', 'financial_regulated', 'safety_emergency'].includes(plan.intent)) {
    return false;
  }
  return true;
}

// -----------------------------------------------------------------------------
// 5. Router model call + validation
// -----------------------------------------------------------------------------

function requireEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`MISSING_ENVIRONMENT_VARIABLE:${name}`);
  return value;
}

function parseRouterOutput(outputText: string): RouterPlan {
  const parsed = JSON.parse(outputText) as RouterPlan;

  if (!parsed.intent || !parsed.sourcePolicyId || !Array.isArray(parsed.retrievalSources)) {
    throw new Error('INVALID_ROUTER_JSON');
  }

  return {
    ...parsed,
    requiresAgeAppropriateFraming: false,
    maySuggestOptionalBranch: false,
    privacyBoundary: {
      mayUseSensitiveMemory: false, // never trust permissive model output here
      mayUseLocation: Boolean(parsed.privacyBoundary?.mayUseLocation),
      mayUseCommunitySignals: Boolean(parsed.privacyBoundary?.mayUseCommunitySignals),
      mayCreateLibraryCandidate: Boolean(parsed.privacyBoundary?.mayCreateLibraryCandidate),
      mayProactivelyNotify: false, // notification service owns proactive delivery
    },
  };
}

async function classifyMessage(
  openai: OpenAI,
  payload: KinfolkRouteRequest,
): Promise<RouterPlan> {
  const model = requireEnvironment('KINFOLK_ROUTER_MODEL');

  const response = await openai.responses.create({
    model,
    instructions: ROUTER_SYSTEM_PROMPT,
    input: JSON.stringify({
      message: payload.message,
      location: payload.context?.approximateLocation ?? null,
      freshnessPreference: payload.requestOptions?.freshnessPreference ?? 'auto',
      researchDepth: payload.requestOptions?.researchDepth ?? 'auto',
    }),
    text: {
      format: {
        type: 'json_schema',
        name: 'kinfolk_router_plan',
        strict: true,
        schema: ROUTER_JSON_SCHEMA,
      },
    },
  });

  return parseRouterOutput(response.output_text);
}

// -----------------------------------------------------------------------------
// 6. Express middleware
// -----------------------------------------------------------------------------

export function createUniversalSearchRouterMiddleware(deps: RouterDependencies) {
  const now = deps.now ?? (() => new Date());

  return async function universalSearchRouter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();

    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'AUTHENTICATION_REQUIRED', requestId });
        return;
      }

      const body = req.body as KinfolkRouteRequest;
      if (!body?.conversationId || typeof body.message !== 'string' || !body.message.trim()) {
        res.status(400).json({ error: 'INVALID_MESSAGE', requestId });
        return;
      }
      if (body.message.length > 8_000) {
        res.status(400).json({ error: 'MESSAGE_TOO_LONG', requestId });
        return;
      }

      const profile = await loadDeliveryProfile(deps.supabase, req.user.id);
      const rawPlan = await classifyMessage(deps.openai, body);
      let plan = enforceHighConsequencePlan(rawPlan);
      plan = applyAgeSafety(plan, profile);
      plan.maySuggestOptionalBranch = planAllowsOptionalBranch(plan, profile);

      const sourcePolicy = await loadSourcePolicy(deps.supabase, plan.sourcePolicyId);
      const delivery = buildDeliveryPlan(profile, plan);

      req.kinfolk = { route: plan, delivery, sourcePolicy, requestId };

      await deps.audit?.({
        requestId,
        userIdHash: crypto.createHash('sha256').update(req.user.id).digest('hex').slice(0, 16),
        intent: plan.intent,
        policyId: sourcePolicy.id,
        searchMode: plan.searchMode,
        resultStatus: 'success',
        latencyMs: Date.now() - startedAt,
      });

      // Use `next()` when this middleware is chained into /api/kinfolk/chat.
      // Use the response below if mounted as a standalone /api/kinfolk/route endpoint.
      if (req.path.endsWith('/route')) {
        res.status(200).json({ requestId, plan, delivery });
        return;
      }

      next();
    } catch (error) {
      const errorCode = error instanceof Error ? error.message.split(':')[0] : 'ROUTER_POLICY_UNAVAILABLE';
      await deps.audit?.({
        requestId,
        userIdHash: crypto.createHash('sha256').update(req.user?.id ?? 'anonymous').digest('hex').slice(0, 16),
        resultStatus: 'policy_error',
        latencyMs: Date.now() - startedAt,
        errorCode,
      });
      res.status(500).json({ error: 'ROUTER_POLICY_UNAVAILABLE', requestId });
    }
  };
}

// -----------------------------------------------------------------------------
// 7. OpenAI tool definitions for the answer stage
// -----------------------------------------------------------------------------

/**
 * These functions are implemented by the MWM server, not by the browser.
 * They always enforce the Router's source policy before querying data.
 */
export const KINFOLK_FUNCTION_TOOLS = [
  {
    type: 'function' as const,
    name: 'search_verified_library',
    description:
      'Search only approved, active Library evidence. Returns direct-topic evidence separately from destination/background context and includes source scope.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['query', 'domain_tags', 'max_results'],
      properties: {
        query: { type: 'string' },
        domain_tags: { type: 'array', items: { type: 'string' }, maxItems: 8 },
        max_results: { type: 'integer', minimum: 1, maximum: 8 },
      },
    },
  },
  {
    type: 'function' as const,
    name: 'search_mwm_directory',
    description:
      'Search MWM verified business records. Return business facts, links, verification status, and clearly separated community feedback summaries. Do not use for medical/legal proof.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['query', 'max_results'],
      properties: {
        query: { type: 'string' },
        category: { type: 'string' },
        approximate_location: {
          type: 'object',
          additionalProperties: false,
          properties: {
            city: { type: 'string' },
            region: { type: 'string' },
            country_code: { type: 'string' },
          },
        },
        max_results: { type: 'integer', minimum: 1, maximum: 10 },
      },
    },
  },
  {
    type: 'function' as const,
    name: 'search_mwm_community_experience',
    description:
      'Retrieve aggregate, approved community experience signals for discovery topics only. Never return individual identities, sensitive reports, or high-stakes medical/legal/safety evidence.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['query', 'max_results'],
      properties: {
        query: { type: 'string' },
        community_tags: { type: 'array', items: { type: 'string' }, maxItems: 8 },
        max_results: { type: 'integer', minimum: 1, maximum: 6 },
      },
    },
  },
] as const;

/**
 * Build tools dynamically from the validated Router plan.
 * The web_search tool is available only when the plan allows it.
 * Configure the provider/model through Railway variables; do not use obsolete preview tools.
 */
export function openAIToolsForPlan(plan: RouterPlan, policy: SourcePolicy): Array<Record<string, unknown>> {
  const tools: Array<Record<string, unknown>> = [...KINFOLK_FUNCTION_TOOLS] as unknown as Array<Record<string, unknown>>;

  const highStakes = plan.consequence === 'high';
  const webAllowed = plan.searchMode === 'web_optional' || plan.searchMode === 'web_required';

  if (webAllowed) {
    tools.push({
      type: 'web_search',
      search_context_size: highStakes ? 'high' : 'medium',
      filters:
        policy.allowedDomains.length || policy.blockedDomains.length
          ? {
              ...(policy.allowedDomains.length ? { allowed_domains: policy.allowedDomains } : {}),
              ...(policy.blockedDomains.length ? { blocked_domains: policy.blockedDomains } : {}),
            }
          : undefined,
    });
  }

  return tools;
}

// -----------------------------------------------------------------------------
// 8. Safe answer-stage instruction builder
// -----------------------------------------------------------------------------

export function buildKinfolkAnswerInstructions(
  plan: RouterPlan,
  delivery: DeliveryPlan,
  policy: SourcePolicy,
): string {
  return `
You are Kinfolk, a warm, culturally fluent, privacy-respecting companion.

DELIVERY PROFILE
- Maximum sections: ${delivery.maxAnswerSections}
- Maximum bullets: ${delivery.maxBullets}
- ${delivery.toneInstruction}
- ${delivery.includeSourceDetailsByDefault ? 'Show available source details by default.' : 'Offer deeper source detail as an optional next step when not required.'}

EVIDENCE POLICY
- Intent: ${plan.intent}
- Consequence: ${plan.consequence}
- Citation mode: ${plan.citationMode}
- Source policy: ${policy.slug}
- Minimum distinct sources for a high-confidence conclusion: ${policy.minimumDistinctSources}
- Minimum authoritative sources: ${policy.minimumAuthoritativeSources}

PROVENANCE RULES
1. Clearly distinguish VERIFIED_LIBRARY_EVIDENCE, LIVE_WEB_EVIDENCE, VERIFIED_MWM_DIRECTORY_DATA, and COMMUNITY_EXPERIENCE.
2. Never say a claim is verified unless direct evidence supports it.
3. COMMUNITY_EXPERIENCE may be used only when policy allows and may never prove medical, legal, financial, or emergency claims.
4. Do not infer or reveal sensitive traits, private searches, Circle information, or other users' data.
5. Do not proactively introduce branches or recommendations unless directly relevant and optional.
6. For high-consequence questions, use careful language and cite supplied evidence; do not diagnose or provide individualized professional advice.
7. For subjective culture/entertainment questions, acknowledge subjectivity and be conversational rather than refusing for lack of an objective answer.
`.trim();
}

// -----------------------------------------------------------------------------
// 9. Tool execution guard
// -----------------------------------------------------------------------------

export function assertToolAllowed(plan: RouterPlan, toolName: string): void {
  const highStakes = plan.consequence === 'high';

  if (
    highStakes &&
    (toolName === 'search_mwm_directory' || toolName === 'search_mwm_community_experience')
  ) {
    throw new Error('TOOL_BLOCKED_BY_HIGH_STAKES_POLICY');
  }

  if (toolName === 'search_mwm_community_experience' && !plan.privacyBoundary.mayUseCommunitySignals) {
    throw new Error('TOOL_BLOCKED_BY_PRIVACY_POLICY');
  }
}

/*
 * Example Express mount (after existing requireAuthenticatedUser middleware):
 *
 * const routerMiddleware = createUniversalSearchRouterMiddleware({ openai, supabase, audit });
 * app.post('/api/kinfolk/route', requireAuthenticatedUser, routerMiddleware);
 * app.post('/api/kinfolk/chat', requireAuthenticatedUser, routerMiddleware, existingKinfolkChatHandler);
 *
 * The existing chat handler should read req.kinfolk.route, req.kinfolk.delivery,
 * and req.kinfolk.sourcePolicy, then use openAIToolsForPlan(...) and
 * buildKinfolkAnswerInstructions(...).
 */
