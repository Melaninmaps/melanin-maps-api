/*
 * Mapping With Melanin — Kinfolk Adaptive Delivery & Audience Filter Tests
 *
 * Suggested placement:
 *   server/kinfolk/__tests__/adaptive-tone-and-audience-filter.test.ts
 *
 * Install/run in the project:
 *   pnpm add -D vitest
 *   pnpm vitest run server/kinfolk/__tests__/adaptive-tone-and-audience-filter.test.ts
 *
 * Import path assumes the implementation is copied to:
 *   server/kinfolk/adaptive-tone-and-audience-filter.ts
 */

import { describe, expect, it } from 'vitest';
import {
  buildAdaptiveAnswerSystemPrompt,
  buildDeliveryInstructions,
  evaluateAudienceEligibility,
  type AdaptiveDeliveryProfile,
  type CandidateContent,
  type RouterContentPlan,
} from '../adaptive-tone-and-audience-filter';

const defaultProfile: AdaptiveDeliveryProfile = {
  detailLevel: 'standard',
  tonePreference: 'default',
  learningMode: 'guided',
  notificationCadence: 'essential_only',
  ageBand: '25_plus',
  regionalLanguageOptIn: false,
  regionalReference: null,
  allowRelatedBranches: false,
  allowNonSensitiveRecommendations: false,
  allowCivicSafetyUpdates: false,
};

const culturePlan: RouterContentPlan = {
  intent: 'culture_entertainment',
  domainTags: ['music', 'culture'],
  consequence: 'low',
  citationMode: 'recommended',
  privacyBoundary: { mayUseLocation: false, mayProactivelyNotify: false },
};

const medicalPlan: RouterContentPlan = {
  intent: 'medical_health',
  domainTags: ['medical', 'fertility'],
  consequence: 'high',
  citationMode: 'required',
  privacyBoundary: { mayUseLocation: false, mayProactivelyNotify: false },
};

const nonSensitiveRecommendation: CandidateContent = {
  id: 'city-digest-la-food',
  kind: 'city_digest',
  title: 'New MWM-listed food experiences in Los Angeles',
  domainTags: ['food', 'business_discovery'],
  consequence: 'low',
  sourceConfidence: 'verified',
  isCurrent: true,
  isOfficialAlert: false,
  containsGraphicDetail: false,
  containsTraumaticContent: false,
  containsCivicOrPoliticalContent: false,
  requiresLocationRelevance: true,
  cityId: 'la-city-id',
};

describe('buildDeliveryInstructions', () => {
  it('answers in deep mode only when a member explicitly selects deep', () => {
    const delivery = buildDeliveryInstructions(
      { ...defaultProfile, detailLevel: 'deep', tonePreference: 'professional' },
      culturePlan,
    );

    expect(delivery.maxSections).toBe(7);
    expect(delivery.includeCitationDetails).toBe(true);
    expect(delivery.toneInstruction).toContain('professional');
  });

  it('does not infer deep detail from location, education, or message style', () => {
    const delivery = buildDeliveryInstructions(
      { ...defaultProfile, detailLevel: 'quick', regionalReference: 'Philadelphia' },
      culturePlan,
    );

    expect(delivery.maxSections).toBe(2);
    expect(delivery.permitRegionalLanguage).toBe(false);
  });

  it('permits regional language only after explicit opt-in for low-stakes context', () => {
    const delivery = buildDeliveryInstructions(
      {
        ...defaultProfile,
        tonePreference: 'regional_opt_in',
        regionalLanguageOptIn: true,
        regionalReference: 'Philadelphia',
      },
      culturePlan,
    );

    expect(delivery.permitRegionalLanguage).toBe(true);
    expect(delivery.toneInstruction).toContain('Philadelphia');
    expect(delivery.toneInstruction).toContain('never imitate an accent');
  });

  it('overrides regional/slang tone for medical questions', () => {
    const delivery = buildDeliveryInstructions(
      {
        ...defaultProfile,
        detailLevel: 'quick',
        tonePreference: 'regional_opt_in',
        regionalLanguageOptIn: true,
        regionalReference: 'Philadelphia',
      },
      medicalPlan,
    );

    expect(delivery.permitRegionalLanguage).toBe(false);
    expect(delivery.includeCitationDetails).toBe(true);
    expect(delivery.toneInstruction).toContain('precise');
    expect(delivery.toneInstruction).toContain('Avoid slang');
  });

  it('lets a 13–17 member ask a sensitive question with age-appropriate framing', () => {
    const delivery = buildDeliveryInstructions(
      { ...defaultProfile, ageBand: '13_17', detailLevel: 'standard' },
      medicalPlan,
    );

    expect(delivery.ageAppropriateInstruction).toContain('non-graphic');
    expect(delivery.ageAppropriateInstruction).toContain('trusted-adult');
    expect(delivery.includeCitationDetails).toBe(true);
  });

  it('does not create unrelated branches for high-stakes requests', () => {
    const delivery = buildDeliveryInstructions(
      { ...defaultProfile, allowRelatedBranches: true, learningMode: 'guided' },
      medicalPlan,
    );

    expect(delivery.includeOptionalDeepDive).toBe(false);
  });

  it('produces a system prompt that forbids identity/education assumptions', () => {
    const delivery = buildDeliveryInstructions(defaultProfile, culturePlan);
    const prompt = buildAdaptiveAnswerSystemPrompt(delivery, culturePlan);

    expect(prompt).toContain('Do not infer user culture, education, politics');
    expect(prompt).toContain('Intent: culture_entertainment');
  });
});

describe('evaluateAudienceEligibility', () => {
  it('allows an opted-in adult to receive a current, verified, local non-sensitive digest', () => {
    const decision = evaluateAudienceEligibility(
      {
        ...defaultProfile,
        notificationCadence: 'weekly_digest',
        allowNonSensitiveRecommendations: true,
      },
      nonSensitiveRecommendation,
      { hasPermittedLocation: true, frequencyCapReached: false },
    );

    expect(decision).toEqual({ eligible: true, reason: 'eligible', allowedPresentation: 'direct' });
  });

  it('blocks a city digest when location permission is absent', () => {
    const decision = evaluateAudienceEligibility(
      {
        ...defaultProfile,
        notificationCadence: 'weekly_digest',
        allowNonSensitiveRecommendations: true,
      },
      nonSensitiveRecommendation,
      { hasPermittedLocation: false, frequencyCapReached: false },
    );

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toBe('location_not_permitted');
  });

  it('blocks proactive civic/traumatic content for a 13–17 member even if local', () => {
    const decision = evaluateAudienceEligibility(
      {
        ...defaultProfile,
        ageBand: '13_17',
        notificationCadence: 'opt_in_updates',
        allowNonSensitiveRecommendations: true,
        allowCivicSafetyUpdates: true,
      },
      {
        ...nonSensitiveRecommendation,
        id: 'civic-event',
        kind: 'notification',
        domainTags: ['civic_unrest', 'police_violence'],
        containsCivicOrPoliticalContent: true,
        containsTraumaticContent: true,
      },
      { hasPermittedLocation: true, frequencyCapReached: false },
    );

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toBe('minor_policy_block');
  });

  it('blocks proactive sensitive content for adults too', () => {
    const decision = evaluateAudienceEligibility(
      {
        ...defaultProfile,
        notificationCadence: 'opt_in_updates',
        allowNonSensitiveRecommendations: true,
      },
      {
        ...nonSensitiveRecommendation,
        id: 'fertility-suggestion',
        domainTags: ['fertility'],
        consequence: 'high',
      },
      { hasPermittedLocation: true, frequencyCapReached: false },
    );

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toBe('sensitive_or_high_consequence');
  });

  it('allows a current official safety alert in age-appropriate form for a minor', () => {
    const decision = evaluateAudienceEligibility(
      { ...defaultProfile, ageBand: '13_17', notificationCadence: 'essential_only' },
      {
        ...nonSensitiveRecommendation,
        id: 'hurricane-watch',
        kind: 'safety_alert',
        domainTags: ['weather'],
        consequence: 'high',
        sourceConfidence: 'authoritative_current',
        isOfficialAlert: true,
      },
      { hasPermittedLocation: true, frequencyCapReached: false },
    );

    expect(decision).toEqual({ eligible: true, reason: 'eligible', allowedPresentation: 'age_appropriate' });
  });

  it('blocks community-only content from proactive delivery', () => {
    const decision = evaluateAudienceEligibility(
      {
        ...defaultProfile,
        notificationCadence: 'weekly_digest',
        allowNonSensitiveRecommendations: true,
      },
      { ...nonSensitiveRecommendation, sourceConfidence: 'community' },
      { hasPermittedLocation: true, frequencyCapReached: false },
    );

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toBe('source_not_strong_enough');
  });

  it('honors the frequency cap regardless of content quality', () => {
    const decision = evaluateAudienceEligibility(
      {
        ...defaultProfile,
        notificationCadence: 'weekly_digest',
        allowNonSensitiveRecommendations: true,
      },
      nonSensitiveRecommendation,
      { hasPermittedLocation: true, frequencyCapReached: true },
    );

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toBe('frequency_cap');
  });
});

/*
 * Search-to-Brick integration tests belong in the staging validation script
 * because they exercise Supabase RPCs and RLS—not application-memory functions.
 * Required assertions are included in MWM_Search_to_Brick_Staging_Validation.ts.
 */
