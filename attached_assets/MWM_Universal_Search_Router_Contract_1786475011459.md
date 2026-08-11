# Universal Search Router — API Contract & Policy Prompt Template

**Audience:** Replit engineering  
**Status:** Implementation specification  
**Scope:** New Kinfolk routing/retrieval layer only  
**No-touch constraint:** Do not change login, auth/session logic, Maps, Safety Hub, existing business-page behavior, Marketplace, Circles, Connections, or global navigation.

## 1. Why a Router Is Required

Kinfolk cannot use one answer strategy for every message. A user asking about diabetes needs a high-stakes health policy. A user asking who is the best rapper from Philadelphia needs a conversational cultural policy. A user asking about vintage cars needs current hobby/community/business discovery. A user asking `12 × 8` needs no search at all.

The **Universal Search Router** is a server-side decision layer that chooses the evidence and retrieval policy *before* Kinfolk generates an answer. The policy must be enforced in code; a system prompt alone is not sufficient.

```text
Message → Privacy Gate → Router → Source Policy → Retrieval → Kinfolk Answer → Provenance UI
```

## 2. HTTP API Contract

### 2.1 Route

```http
POST /api/kinfolk/route
Content-Type: application/json
Cookie: authenticated session
```

The route is internal to the authenticated Kinfolk chat flow. It must use the same server-side session middleware as the existing `/api/kinfolk/chat` route. The client must never select a medical, legal, or other high-stakes policy directly.

### 2.2 Request body

```ts
export type KinfolkRouteRequest = {
  conversationId: string;
  message: string;

  // Context must be minimized. Do not send raw private history by default.
  context?: {
    locale?: string;                 // e.g. "en-US"
    approximateLocation?: {
      city?: string;
      region?: string;
      countryCode?: string;
      timezone?: string;
    };
    requestedTone?: 'default' | 'warm' | 'professional' | 'concise';
    userExplicitPreferences?: string[]; // Only user-approved, non-sensitive signals
  };

  // Client can request a research depth, but server policy decides whether it is allowed.
  requestOptions?: {
    freshnessPreference?: 'auto' | 'current' | 'stable';
    researchDepth?: 'auto' | 'quick' | 'deep';
    citationsPreference?: 'auto' | 'always' | 'never_for_low_stakes';
  };
};
```

### 2.3 Success response

```ts
export type KinfolkRouteResponse = {
  requestId: string;
  plan: {
    intent:
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

    domainTags: string[]; // e.g. ['medical','diabetes'] or ['music','philadelphia']
    consequence: 'low' | 'medium' | 'high';
    freshness: 'none' | 'helpful' | 'required';
    searchMode: 'none' | 'library_first' | 'web_optional' | 'web_required';
    retrievalSources: Array<'library' | 'mwm_directory' | 'mwm_community' | 'live_web'>;
    sourcePolicyId: string;
    citationMode: 'none' | 'recommended' | 'required';
    responseStyle: 'concise' | 'conversational' | 'careful' | 'urgent';
    privacyBoundary: {
      mayUseSensitiveMemory: boolean;
      mayUseLocation: boolean;
      mayUseCommunitySignals: boolean;
      mayCreateLibraryCandidate: boolean;
    };
    clarifyingQuestion?: string;
  };
};
```

### 2.4 Error responses

| HTTP status | Code | When to use |
|---:|---|---|
| `400` | `INVALID_MESSAGE` | Empty, malformed, or oversized message. |
| `401` | `AUTHENTICATION_REQUIRED` | Session is not valid. |
| `429` | `ROUTER_RATE_LIMITED` | The authenticated user exceeded a server-side limit. |
| `500` | `ROUTER_POLICY_UNAVAILABLE` | Policy configuration could not be loaded. Do not silently apply a permissive fallback. |

## 3. Router Decision Contract

The router must generate structured JSON that is validated against a server-owned schema. The chat model only receives the validated policy result—not a free-form classification response.

```ts
export type ValidatedSearchPlan = {
  intent: string;
  domainTags: string[];
  consequence: 'low' | 'medium' | 'high';
  freshness: 'none' | 'helpful' | 'required';
  searchMode: 'none' | 'library_first' | 'web_optional' | 'web_required';
  retrievalSources: Array<'library' | 'mwm_directory' | 'mwm_community' | 'live_web'>;
  sourcePolicyId: string;
  citationMode: 'none' | 'recommended' | 'required';
  responseStyle: 'concise' | 'conversational' | 'careful' | 'urgent';
  privacyBoundary: {
    mayUseSensitiveMemory: boolean;
    mayUseLocation: boolean;
    mayUseCommunitySignals: boolean;
    mayCreateLibraryCandidate: boolean;
  };
};
```

### 3.1 Server-side enforcement rules

```ts
function enforceSearchPlan(plan: ValidatedSearchPlan): ValidatedSearchPlan {
  if (plan.intent === 'medical_health') {
    return {
      ...plan,
      consequence: 'high',
      searchMode: plan.searchMode === 'none' ? 'library_first' : plan.searchMode,
      citationMode: 'required',
      responseStyle: 'careful',
      privacyBoundary: {
        ...plan.privacyBoundary,
        mayUseSensitiveMemory: false,
        mayUseCommunitySignals: false,
        mayCreateLibraryCandidate: false,
      },
    };
  }

  if (plan.intent === 'legal_regulated' || plan.intent === 'financial_regulated') {
    return {
      ...plan,
      consequence: 'high',
      citationMode: 'required',
      responseStyle: 'careful',
      privacyBoundary: {
        ...plan.privacyBoundary,
        mayUseCommunitySignals: false,
      },
    };
  }

  if (plan.intent === 'safety_emergency') {
    return {
      ...plan,
      consequence: 'high',
      freshness: 'required',
      searchMode: 'web_required',
      citationMode: 'required',
      responseStyle: 'urgent',
      privacyBoundary: {
        ...plan.privacyBoundary,
        mayUseSensitiveMemory: false,
        mayUseCommunitySignals: false,
        mayCreateLibraryCandidate: false,
      },
    };
  }

  return plan;
}
```

## 4. Policy Examples

### A. Medical: diabetes

**User message:**

```text
What should I ask my doctor about diabetes?
```

**Expected route response:**

```json
{
  "requestId": "req_...",
  "plan": {
    "intent": "medical_health",
    "domainTags": ["medical", "diabetes"],
    "consequence": "high",
    "freshness": "helpful",
    "searchMode": "library_first",
    "retrievalSources": ["library", "live_web"],
    "sourcePolicyId": "medical-authoritative-v1",
    "citationMode": "required",
    "responseStyle": "careful",
    "privacyBoundary": {
      "mayUseSensitiveMemory": false,
      "mayUseLocation": false,
      "mayUseCommunitySignals": false,
      "mayCreateLibraryCandidate": false
    }
  }
}
```

**Required answer behavior:** Kinfolk can give a concise appointment-question list, identify authoritative evidence, and state that it is educational—not a diagnosis or treatment plan. It must not use Facebook, Reddit, unreviewed community comments, restaurant data, or business-vibe data as evidence.

### B. Conversational culture: Philadelphia rap

**User message:**

```text
Who is the best rapper from Philadelphia?
```

**Expected route response:**

```json
{
  "requestId": "req_...",
  "plan": {
    "intent": "culture_entertainment",
    "domainTags": ["music", "hip_hop", "philadelphia"],
    "consequence": "low",
    "freshness": "helpful",
    "searchMode": "web_optional",
    "retrievalSources": ["library", "live_web"],
    "sourcePolicyId": "culture-conversational-v1",
    "citationMode": "recommended",
    "responseStyle": "conversational",
    "privacyBoundary": {
      "mayUseSensitiveMemory": false,
      "mayUseLocation": false,
      "mayUseCommunitySignals": false,
      "mayCreateLibraryCandidate": true
    }
  }
}
```

**Required answer behavior:** Kinfolk must not say “no results.” It should frame “best” as subjective, offer a short answer or compare artists according to impact, lyricism, commercial success, or local legacy, and can use reputable music journalism/public sources when freshness or detail matters. Citations are helpful but not mandatory for a casual opinion response.

### C. Hobby/community discovery: vintage cars

**User message:**

```text
I just bought a 1972 Chevelle. Where can I find people who know vintage cars near me?
```

**Expected route response:**

```json
{
  "requestId": "req_...",
  "plan": {
    "intent": "hobby_lifestyle",
    "domainTags": ["automotive", "classic_cars", "community"],
    "consequence": "medium",
    "freshness": "helpful",
    "searchMode": "web_required",
    "retrievalSources": ["mwm_directory", "mwm_community", "live_web"],
    "sourcePolicyId": "automotive-discovery-v1",
    "citationMode": "recommended",
    "responseStyle": "conversational",
    "privacyBoundary": {
      "mayUseSensitiveMemory": false,
      "mayUseLocation": true,
      "mayUseCommunitySignals": true,
      "mayCreateLibraryCandidate": true
    }
  }
}
```

## 5. Router Model Prompt Template

Use the following prompt only for *classification and planning*. The router must return JSON matching the schema. It must never generate the final user answer.

```text
SYSTEM — KINFOLK UNIVERSAL SEARCH ROUTER

You classify a user message so a separate answer system can choose the right retrieval and evidence policy.

Kinfolk is a general-purpose, culturally aware conversational companion. It may answer simple questions, discuss culture and entertainment, search the current web, surface verified Library evidence, and find relevant businesses or community experiences when appropriate.

Your job is NOT to answer the user. Your job is to return exactly one valid JSON object matching the provided schema.

RULES
1. Do not treat every query as a medical, legal, or academic research task.
2. Use high-stakes routing only for medical/health, legal, financial/regulatory, emergency/safety, or other decisions where inaccurate information could materially harm the user.
3. A music, sports, hobby, culture, entertainment, or casual comparison question is usually low consequence. It may use a conversational policy and optional web research.
4. A simple arithmetic or stable factual question should use searchMode = "none" unless freshness is required.
5. Set citationMode = "required" for medical, legal, financial/regulatory, and safety/emergency topics.
6. Set mayUseCommunitySignals = false for medical, legal, financial/regulatory, and safety/emergency topics.
7. Set mayUseSensitiveMemory = false by default. Never infer or expose sensitive health, relationship, immigration, financial, or safety information.
8. Set mayCreateLibraryCandidate = true only when the query is non-sensitive and the potential evidence could be reusable beyond one private conversation. This does not mean it will be published.
9. Use approximate location only for location-dependent discovery when the user asks for something nearby or location materially changes the answer.
10. "Best" questions are subjective. Route them to culture_entertainment or hobby_lifestyle when appropriate; do not reject them for lack of objective proof.

OUTPUT SCHEMA
{
  "intent": "...",
  "domainTags": ["..."],
  "consequence": "low|medium|high",
  "freshness": "none|helpful|required",
  "searchMode": "none|library_first|web_optional|web_required",
  "retrievalSources": ["library|mwm_directory|mwm_community|live_web"],
  "sourcePolicyId": "...",
  "citationMode": "none|recommended|required",
  "responseStyle": "concise|conversational|careful|urgent",
  "privacyBoundary": {
    "mayUseSensitiveMemory": false,
    "mayUseLocation": false,
    "mayUseCommunitySignals": false,
    "mayCreateLibraryCandidate": false
  }
}
```

## 6. Answer-Generation Prompt Contract

After the router and retrieval pipeline run, pass the answer model only approved, labeled inputs.

```text
SYSTEM — KINFOLK ANSWER GENERATOR

You are Kinfolk: a warm, culturally fluent, privacy-respecting general-purpose companion.

Use only the supplied evidence bundles. Each bundle is explicitly labeled as one of:
- VERIFIED_LIBRARY_EVIDENCE
- LIVE_WEB_EVIDENCE
- VERIFIED_MWM_DIRECTORY_DATA
- COMMUNITY_EXPERIENCE
- GENERAL_CONVERSATIONAL_CONTEXT

RULES
1. Never state that a claim is verified unless it is supported by VERIFIED_LIBRARY_EVIDENCE or LIVE_WEB_EVIDENCE.
2. Do not use COMMUNITY_EXPERIENCE as medical, legal, financial, emergency, or scientific proof.
3. For high-stakes topics, cite the supplied authoritative sources and state an appropriate informational boundary.
4. For subjective culture/entertainment questions, be conversational and identify subjectivity rather than pretending there is one objective answer.
5. Keep MWM business data, community experience, and web/Library evidence visibly distinct.
6. Never reveal private user information, sensitive inferred traits, Circle information, or another user’s data.
7. If evidence is insufficient, say what you can support, what remains uncertain, and offer a next step. Do not invent a citation or fill gaps with unsupported claims.
```

## 7. Operational Logging Contract

Log only the minimum necessary operational metadata:

```ts
type RouterAuditLog = {
  requestId: string;
  userIdHash: string;
  policyId: string;
  intent: string;
  searchMode: string;
  providerUsed: string | null;
  sourceCount: number;
  sourceTierCounts: Record<string, number>;
  latencyMs: number;
  resultStatus: 'success' | 'provider_error' | 'policy_error';
};
```

Never log raw sensitive query text, health status, relationship information, exact location, access tokens, session IDs, or citation content in routine production logs.

## References

[1]: https://developers.openai.com/api/docs/guides/tools-web-search "OpenAI API — Web search"
