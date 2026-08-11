/*
 * Mapping With Melanin — Kinfolk Chat + Delivery Profile API Tests
 *
 * Suggested placement:
 *   server/kinfolk/__tests__/kinfolk-chat-and-preferences.api.test.ts
 *
 * Dependencies:
 *   pnpm add -D vitest supertest @types/supertest
 *
 * Run:
 *   pnpm vitest run server/kinfolk/__tests__/kinfolk-chat-and-preferences.api.test.ts
 *
 * These tests assume the implementation files are copied to:
 *   server/routes/kinfolk-chat.ts
 *   server/routes/kinfolk-delivery-profile.ts
 *
 * Adjust import aliases to match the repository; do not weaken any assertion.
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// -----------------------------------------------------------------------------
// Shared state injected by the mocked auth middleware and mock Supabase client.
// -----------------------------------------------------------------------------

const testState = vi.hoisted(() => ({
  userId: '11111111-1111-1111-1111-111111111111',
  userAgeBand: '25_plus',
  profileRow: null as Record<string, unknown> | null,
  routerPlan: {
    intent: 'business_discovery',
    domainTags: ['food'],
    consequence: 'low',
    sourcePolicyId: 'business-discovery-v1',
    citationMode: 'recommended',
    permittedTools: [],
    normalizedQuestion: 'placeholder',
  },
  evidence: [] as Array<Record<string, unknown>>,
  modelReply: 'Mocked Kinfolk response.',
  modelThrows: false,
}));

function profileRowFor(detailLevel = 'standard', tonePreference = 'warm'): Record<string, unknown> {
  return {
    detail_level: detailLevel,
    tone_preference: tonePreference,
    learning_mode: 'guided',
    notification_cadence: 'essential_only',
    age_band: testState.userAgeBand,
    regional_language_opt_in: false,
    regional_reference: null,
    allow_related_branches: false,
    allow_non_sensitive_recommendations: false,
    allow_civic_safety_updates: false,
  };
}

function createRequestScopedSupabase() {
  return {
    from: (table: string) => {
      if (table !== 'kinfolk_delivery_profiles') {
        throw new Error(`Unexpected table in test: ${table}`);
      }

      const selectChain = {
        eq: () => ({
          maybeSingle: async () => ({ data: testState.profileRow, error: null }),
        }),
      };

      return {
        select: () => selectChain,
        upsert: (row: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              testState.profileRow = {
                detail_level: row.detail_level,
                tone_preference: row.tone_preference,
                learning_mode: row.learning_mode,
                notification_cadence: row.notification_cadence,
                age_band: row.age_band,
                regional_language_opt_in: row.regional_language_opt_in,
                regional_reference: row.regional_reference,
                allow_related_branches: row.allow_related_branches,
                allow_non_sensitive_recommendations: row.allow_non_sensitive_recommendations,
                allow_civic_safety_updates: row.allow_civic_safety_updates,
              };
              return { data: testState.profileRow, error: null };
            },
          }),
        }),
      };
    },
  };
}

// -----------------------------------------------------------------------------
// Mock the implementation dependencies. The handler itself remains unmocked.
// -----------------------------------------------------------------------------

vi.mock('../../auth/require-authenticated-user', () => ({
  requireAuthenticatedUser: (req: Record<string, unknown>, _res: unknown, next: () => void) => {
    req.user = { id: testState.userId, ageBand: testState.userAgeBand };
    req.supabase = createRequestScopedSupabase();
    next();
  },
}));

vi.mock('../../kinfolk/universal-search-router-service', () => ({
  createUniversalSearchPlan: async () => testState.routerPlan,
}));

vi.mock('../../kinfolk/delivery-profile-repository', () => ({
  getDeliveryProfile: async () => ({
    detailLevel: 'standard',
    tonePreference: 'warm',
    learningMode: 'guided',
    notificationCadence: 'essential_only',
    ageBand: testState.userAgeBand,
    regionalLanguageOptIn: false,
    regionalReference: null,
    allowRelatedBranches: false,
    allowNonSensitiveRecommendations: false,
    allowCivicSafetyUpdates: false,
  }),
}));

vi.mock('../../kinfolk/evidence-retrieval-service', () => ({
  retrieveEvidence: async () => testState.evidence,
}));

vi.mock('../../kinfolk/adaptive-tone-and-audience-filter', () => ({
  buildDeliveryInstructions: () => ({
    maxSections: 4,
    maxBullets: 5,
    includeCitationDetails: true,
    includeOptionalDeepDive: false,
    permitRegionalLanguage: false,
    toneInstruction: 'Use a clear tone.',
    ageAppropriateInstruction: 'Use appropriate language.',
    prohibitedBehaviors: [],
  }),
  buildAdaptiveAnswerSystemPrompt: () => 'MOCK_SYSTEM_PROMPT',
}));

vi.mock('../../kinfolk/model-service', () => ({
  invokeKinfolkModel: async () => {
    if (testState.modelThrows) throw new Error('MODEL_PROVIDER_FAILURE');
    return { reply: testState.modelReply, recommendations: null };
  },
}));

vi.mock('../../kinfolk/session-service', () => ({
  getOrCreateKinfolkSession: async () => ({ id: '22222222-2222-2222-2222-222222222222' }),
}));

vi.mock('../../kinfolk/usage-pool-service', () => ({
  checkAiPool: async () => ({ allowed: true }),
}));

vi.mock('../../kinfolk/audit-service', () => ({
  writeKinfolkAuditEvent: async () => undefined,
}));

// Import AFTER mocks.
import { createKinfolkChatRouter } from '../../routes/kinfolk-chat';
import {
  createKinfolkPreferenceRouter,
  deliveryToResponseStyle,
  responseStyleToDeliveryPatch,
} from '../../routes/kinfolk-delivery-profile';

function appWithRoutes() {
  const app = express();
  app.use(express.json());
  app.use(createKinfolkChatRouter());
  app.use(createKinfolkPreferenceRouter());
  return app;
}

beforeEach(() => {
  testState.userAgeBand = '25_plus';
  testState.profileRow = null;
  testState.routerPlan = {
    intent: 'business_discovery',
    domainTags: ['food'],
    consequence: 'low',
    sourcePolicyId: 'business-discovery-v1',
    citationMode: 'recommended',
    permittedTools: [],
    normalizedQuestion: 'placeholder',
  };
  testState.evidence = [];
  testState.modelReply = 'Mocked Kinfolk response.';
  testState.modelThrows = false;
});

describe('POST /api/kinfolk/chat', () => {
  it('overrides a legacy business_discovery result for a Thailand visa query', async () => {
    testState.routerPlan = {
      // Simulate an incomplete router result; handler must enforce a visa/policy tag.
      intent: 'business_discovery',
      domainTags: ['travel', 'visa', 'government_policy'],
      consequence: 'low',
      sourcePolicyId: 'business-discovery-v1',
      citationMode: 'recommended',
      permittedTools: ['web_search'],
      normalizedQuestion: 'thailand_visa_requirements',
    };
    testState.evidence = [{
      id: 'official-embassy',
      origin: 'LIVE_WEB',
      permittedForResponse: true,
      title: 'Official Thailand entry requirements',
      url: 'https://example.gov/entry',
      verifiedAt: '2026-08-11T00:00:00.000Z',
    }];

    const response = await request(appWithRoutes())
      .post('/api/kinfolk/chat')
      .send({ message: 'What are Thailand visa requirements for a U.S. citizen?', neighborVoice: true })
      .expect(200);

    expect(response.body.intentClass).toBe('legal_regulated');
    expect(response.body.provenanceNote).toMatch(/verify with.*official/i);
    expect(response.body.sources).toEqual([
      expect.objectContaining({ label: 'Current source', title: 'Official Thailand entry requirements' }),
    ]);
    expect(response.body.followUpSuggestions).toContain('Show me the official source for this.');
  });

  it('keeps a cultural/music request conversational and does not add a legal disclaimer', async () => {
    testState.routerPlan = {
      intent: 'culture_entertainment',
      domainTags: ['music', 'philadelphia'],
      consequence: 'low',
      sourcePolicyId: 'culture-conversational-v1',
      citationMode: 'recommended',
      permittedTools: ['web_search'],
      normalizedQuestion: 'best_rapper_philadelphia',
    };

    const response = await request(appWithRoutes())
      .post('/api/kinfolk/chat')
      .send({ message: 'Who is the best rapper from Philadelphia?' })
      .expect(200);

    expect(response.body.intentClass).toBe('culture_entertainment');
    expect(response.body.provenanceNote).toBeUndefined();
  });

  it('rejects an empty message before provider invocation', async () => {
    const response = await request(appWithRoutes())
      .post('/api/kinfolk/chat')
      .send({ message: '   ' })
      .expect(400);

    expect(response.body.error).toBe('INVALID_KINFOLK_CHAT_REQUEST');
  });

  it('returns a stable 500 response and request ID when a provider dependency fails', async () => {
    testState.modelThrows = true;

    const response = await request(appWithRoutes())
      .post('/api/kinfolk/chat')
      .send({ message: 'What is 12 times 8?' })
      .expect(500);

    expect(response.body.error).toBe('KINFOLK_RESPONSE_UNAVAILABLE');
    expect(response.body.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(response.body).not.toHaveProperty('stack');
  });
});

describe('Delivery profile compatibility and persistence', () => {
  it('maps the existing response-style controls without storing an opaque UI label', () => {
    expect(responseStyleToDeliveryPatch('concise')).toEqual({ detailLevel: 'quick', tonePreference: 'default' });
    expect(responseStyleToDeliveryPatch('detailed')).toEqual({ detailLevel: 'deep', tonePreference: 'default' });
    expect(responseStyleToDeliveryPatch('professional')).toEqual({ detailLevel: 'standard', tonePreference: 'professional' });
  });

  it('maps delivery profile dimensions back to a selected UI response-style value', () => {
    expect(deliveryToResponseStyle({
      detailLevel: 'deep', tonePreference: 'default', learningMode: 'guided', notificationCadence: 'essential_only',
      ageBand: '25_plus', regionalLanguageOptIn: false, regionalReference: null,
      allowRelatedBranches: false, allowNonSensitiveRecommendations: false, allowCivicSafetyUpdates: false,
    })).toBe('detailed');
  });

  it('saves Detailed through the existing response-style route and returns it after a fresh GET', async () => {
    const app = appWithRoutes();

    const save = await request(app)
      .put('/api/kinfolk/preferences/response-style')
      .send({ responseStyle: 'detailed' })
      .expect(200);

    expect(save.body.responseStyle).toBe('detailed');
    expect(save.body.deliveryProfile.detailLevel).toBe('deep');

    // Simulates the hard-refresh path: a new GET must read the persisted row.
    const reload = await request(app)
      .get('/api/kinfolk/preferences')
      .expect(200);

    expect(reload.body.responseStyle).toBe('detailed');
    expect(reload.body.deliveryProfile.detailLevel).toBe('deep');
  });

  it('rejects regional language when it was not explicitly opted in', async () => {
    const response = await request(appWithRoutes())
      .put('/api/kinfolk/preferences/delivery')
      .send({
        detailLevel: 'standard',
        tonePreference: 'regional_opt_in',
        learningMode: 'guided',
        notificationCadence: 'essential_only',
        regionalLanguageOptIn: false,
        regionalReference: 'Philadelphia',
        allowRelatedBranches: false,
        allowNonSensitiveRecommendations: false,
        allowCivicSafetyUpdates: false,
      })
      .expect(400);

    expect(response.body.error).toBe('INVALID_DELIVERY_PROFILE');
  });
});

/*
 * Required end-to-end browser test after these pass:
 * 1. Log in as the Manus tester.
 * 2. Select Detailed and Save Taste Profile.
 * 3. Hard refresh /travel.
 * 4. Confirm Detailed remains selected.
 * 5. Ask Thailand visa requirements.
 * 6. Confirm HTTP 200 response payload includes:
 *      intentClass: "legal_regulated"
 *      provenanceNote: non-empty string
 *      sources: array
 * 7. Confirm the UI renders the distinct provenance note below the assistant
 *    bubble and does not append it invisibly to reply text.
 */
