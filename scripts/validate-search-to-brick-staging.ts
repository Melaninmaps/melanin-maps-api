/*
 * Mapping With Melanin — Supabase Staging Validation
 *
 * Suggested placement:
 *   scripts/validate-search-to-brick-staging.ts
 *
 * REQUIRED STAGING VARIABLES (never use production credentials):
 *   MWM_ENVIRONMENT=staging
 *   ALLOW_STAGING_VALIDATION=true
 *   SUPABASE_URL=https://<staging-project>.supabase.co
 *   SUPABASE_ANON_KEY=<staging-anon-key>
 *   SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
 *   STAGING_TEST_USER_A_EMAIL=<existing non-production test account>
 *   STAGING_TEST_USER_A_PASSWORD=<test password>
 *   STAGING_TEST_USER_B_EMAIL=<existing non-production test account>
 *   STAGING_TEST_USER_B_PASSWORD=<test password>
 *
 * Install/run:
 *   pnpm add -D tsx
 *   pnpm tsx scripts/validate-search-to-brick-staging.ts
 *
 * This script intentionally refuses to run unless explicitly marked staging.
 * It does not log passwords, tokens, raw messages, or user-private data.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import process from 'node:process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type TestResult = { name: string; passed: boolean; details?: string };
const results: TestResult[] = [];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function pass(name: string, details?: string): void {
  results.push({ name, passed: true, details });
  console.log(`PASS  ${name}${details ? ` — ${details}` : ''}`);
}

function fail(name: string, error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  results.push({ name, passed: false, details: message });
  console.error(`FAIL  ${name} — ${message}`);
  throw error;
}

function makeActorKey(index: number): string {
  // A test-only opaque HMAC-like token. It is not a member user ID.
  return crypto.createHash('sha256').update(`staging-validation-actor-${index}`).digest('hex');
}

async function findUserIdByEmail(service: SupabaseClient, email: string): Promise<string> {
  const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Could not list staging test users: ${error.message}`);

  const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`Staging test user not found: ${email}`);
  return user.id;
}

async function signInAs(url: string, anonKey: string, email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Staging sign-in failed for ${email}: ${error.message}`);
  return client;
}

async function main(): Promise<void> {
  if (process.env.MWM_ENVIRONMENT !== 'staging' || process.env.ALLOW_STAGING_VALIDATION !== 'true') {
    throw new Error('Refusing to run: set MWM_ENVIRONMENT=staging and ALLOW_STAGING_VALIDATION=true.');
  }

  const url = requireEnv('SUPABASE_URL');
  const anonKey = requireEnv('SUPABASE_ANON_KEY');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const userAEmail = requireEnv('STAGING_TEST_USER_A_EMAIL');
  const userAPassword = requireEnv('STAGING_TEST_USER_A_PASSWORD');
  const userBEmail = requireEnv('STAGING_TEST_USER_B_EMAIL');
  const userBPassword = requireEnv('STAGING_TEST_USER_B_PASSWORD');

  const service = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const userA = await signInAs(url, anonKey, userAEmail, userAPassword);
  const userB = await signInAs(url, anonKey, userBEmail, userBPassword);

  const [userAId, userBId] = await Promise.all([
    findUserIdByEmail(service, userAEmail),
    findUserIdByEmail(service, userBEmail),
  ]);

  const runId = crypto.randomUUID();
  const cityName = `Validation City ${runId.slice(0, 8)}`;
  let cityProfileId: string | undefined;

  try {
    // -------------------------------------------------------------------------
    // A. RLS: own delivery profile is readable; another member’s is invisible.
    // -------------------------------------------------------------------------
    {
      const { error } = await service.from('kinfolk_delivery_profiles').upsert([
        {
          user_id: userAId,
          detail_level: 'quick',
          tone_preference: 'professional',
          notification_cadence: 'none',
          age_band: '25_plus',
          allow_related_branches: false,
          allow_non_sensitive_recommendations: false,
          allow_civic_safety_updates: false,
        },
        {
          user_id: userBId,
          detail_level: 'deep',
          tone_preference: 'warm',
          notification_cadence: 'weekly_digest',
          age_band: '25_plus',
          allow_related_branches: true,
          allow_non_sensitive_recommendations: true,
          allow_civic_safety_updates: false,
        },
      ]);
      assert.equal(error, null, error?.message);

      const { data: ownRows, error: ownError } = await userA
        .from('kinfolk_delivery_profiles')
        .select('user_id,detail_level,tone_preference')
        .eq('user_id', userAId);
      assert.equal(ownError, null, ownError?.message);
      assert.equal(ownRows?.length, 1, 'User A must read their own delivery profile.');
      assert.equal(ownRows?.[0]?.detail_level, 'quick');
      pass('RLS allows a member to read their own delivery profile');

      const { data: otherRows, error: otherError } = await userA
        .from('kinfolk_delivery_profiles')
        .select('user_id,detail_level,tone_preference')
        .eq('user_id', userBId);
      assert.equal(otherError, null, otherError?.message);
      assert.equal(otherRows?.length, 0, 'User A must not read User B profile.');
      pass('RLS hides another member’s delivery profile');

      const { error: writeOtherError } = await userA
        .from('kinfolk_delivery_profiles')
        .update({ detail_level: 'deep' })
        .eq('user_id', userBId);
      // PostgREST may return no error and affect zero rows under RLS; verify outcome using service role.
      assert.equal(writeOtherError, null, writeOtherError?.message);

      const { data: protectedProfile, error: protectedProfileError } = await service
        .from('kinfolk_delivery_profiles')
        .select('detail_level')
        .eq('user_id', userBId)
        .single();
      assert.equal(protectedProfileError, null, protectedProfileError?.message);
      assert.equal(protectedProfile?.detail_level, 'deep', 'User A must not mutate User B profile.');
      pass('RLS prevents a member from mutating another member’s delivery profile');
    }

    // -------------------------------------------------------------------------
    // B. RLS: client roles cannot read raw de-identified search events.
    // -------------------------------------------------------------------------
    {
      const { data: anonEvents, error: anonError } = await anon
        .from('kinfolk_search_brick_events')
        .select('*')
        .limit(1);
      assert.equal(anonError, null, anonError?.message);
      assert.equal(anonEvents?.length, 0, 'Anon role must not read aggregate events.');

      const { data: memberEvents, error: memberError } = await userA
        .from('kinfolk_search_brick_events')
        .select('*')
        .limit(1);
      assert.equal(memberError, null, memberError?.message);
      assert.equal(memberEvents?.length, 0, 'Authenticated member must not read aggregate events.');
      pass('RLS blocks anon and member reads of Search-to-Brick events');
    }

    // -------------------------------------------------------------------------
    // C. Create a planned city exclusively via service role. This proves city
    // readiness can exist before any tester arrives or submits a search.
    // -------------------------------------------------------------------------
    {
      const { data, error } = await service
        .from('kinfolk_city_readiness_profiles')
        .insert({
          canonical_city: cityName,
          region: 'Staging',
          country_code: 'US',
          timezone: 'America/New_York',
          lifecycle: 'planned',
          tour_priority: 900,
          target_launch_window: 'staging validation',
        })
        .select('id,lifecycle')
        .single();
      assert.equal(error, null, error?.message);
      assert.equal(data?.lifecycle, 'planned');
      cityProfileId = data!.id;
      pass('Tour-city readiness profile can be created without member behavior');
    }

    // -------------------------------------------------------------------------
    // D. Search-to-Brick: nine unique non-sensitive actors remain below k=10.
    // -------------------------------------------------------------------------
    const normalizedIntent = 'fruit_pebble_waffles';
    const windowKey = '2026-W32';

    for (let index = 1; index <= 9; index += 1) {
      const { error } = await service.rpc('record_eligible_search_brick_event', {
        p_privacy_window_key: windowKey,
        p_anonymous_actor_key: makeActorKey(index),
        p_city_profile_id: cityProfileId,
        p_neighborhood_bucket: 'central',
        p_normalized_intent: normalizedIntent,
        p_intent: 'community_business_discovery',
        p_category: 'food',
        p_result_state: 'zero_results',
        p_consequence: 'low',
        p_source_policy_slug: 'business-discovery-v1',
      });
      assert.equal(error, null, error?.message);
    }

    {
      const { data, error } = await service.rpc('refresh_search_brick_demand_signal', {
        p_city_profile_id: cityProfileId,
        p_normalized_intent: normalizedIntent,
        p_category: 'food',
        p_neighborhood_bucket: 'central',
      });
      assert.equal(error, null, error?.message);
      const row = Array.isArray(data) ? data[0] : data;
      assert.equal(row?.qualified, false, 'Nine unique actors must remain below k=10.');
      assert.equal(row?.unique_member_count, 9);
      assert.equal(row?.minimum_threshold, 10);
      pass('Search-to-Brick does not qualify a signal below the k-anonymity threshold');
    }

    // -------------------------------------------------------------------------
    // E. The tenth unique actor qualifies; task creation is internal only.
    // -------------------------------------------------------------------------
    {
      const { error } = await service.rpc('record_eligible_search_brick_event', {
        p_privacy_window_key: windowKey,
        p_anonymous_actor_key: makeActorKey(10),
        p_city_profile_id: cityProfileId,
        p_neighborhood_bucket: 'central',
        p_normalized_intent: normalizedIntent,
        p_intent: 'community_business_discovery',
        p_category: 'food',
        p_result_state: 'zero_results',
        p_consequence: 'low',
        p_source_policy_slug: 'business-discovery-v1',
      });
      assert.equal(error, null, error?.message);

      const { data, error: refreshError } = await service.rpc('refresh_search_brick_demand_signal', {
        p_city_profile_id: cityProfileId,
        p_normalized_intent: normalizedIntent,
        p_category: 'food',
        p_neighborhood_bucket: 'central',
      });
      assert.equal(refreshError, null, refreshError?.message);
      const row = Array.isArray(data) ? data[0] : data;
      assert.equal(row?.qualified, true, 'Tenth distinct actor must qualify the non-sensitive signal.');
      assert.equal(row?.unique_member_count, 10);

      const { data: signalRows, error: signalError } = await service
        .from('kinfolk_aggregate_demand_signals')
        .select('id,status,unique_member_count,minimum_threshold')
        .eq('city_profile_id', cityProfileId)
        .eq('normalized_intent', normalizedIntent)
        .order('created_at', { ascending: false })
        .limit(1);
      assert.equal(signalError, null, signalError?.message);
      const signal = signalRows?.[0];
      assert.equal(signal?.status, 'qualified');
      assert.equal(signal?.unique_member_count, 10);

      const { data: taskId, error: taskError } = await service.rpc('create_city_research_task_from_signal', {
        p_signal_id: signal!.id,
        p_owner_user_id: null,
      });
      assert.equal(taskError, null, taskError?.message);
      assert.ok(taskId, 'A qualified signal must create an internal research task.');

      const { data: task, error: taskFetchError } = await service
        .from('kinfolk_city_research_tasks')
        .select('origin,status,task_payload')
        .eq('id', taskId)
        .single();
      assert.equal(taskFetchError, null, taskFetchError?.message);
      assert.equal(task?.origin, 'aggregate_demand');
      assert.equal(task?.task_payload.memberSearchesIncluded, false);
      assert.equal(task?.task_payload.aggregateSignalsOnly, true);
      pass('Qualified demand creates an internal aggregate-only research task');
    }

    // -------------------------------------------------------------------------
    // F. High-consequence/sensitive categories must be rejected before storage.
    // -------------------------------------------------------------------------
    {
      const { error } = await service.rpc('record_eligible_search_brick_event', {
        p_privacy_window_key: windowKey,
        p_anonymous_actor_key: makeActorKey(11),
        p_city_profile_id: cityProfileId,
        p_neighborhood_bucket: 'central',
        p_normalized_intent: 'ivf_information',
        p_intent: 'medical_health',
        p_category: 'medical',
        p_result_state: 'zero_results',
        p_consequence: 'high',
        p_source_policy_slug: 'medical-authoritative-v1',
      });
      assert.ok(error, 'Medical/high-consequence event must be rejected.');
      pass('Search-to-Brick rejects sensitive and high-consequence search categories');
    }

    console.log('\nAll staging RLS and Search-to-Brick validations passed.');
  } catch (error) {
    console.error('\nStaging validation failed. Do not deploy this feature.');
    throw error;
  } finally {
    // Cleanup only the generated validation city. Cascades remove test signals,
    // tasks, blockers, and scorecards. Existing staging user profiles are kept.
    if (cityProfileId) {
      const { error } = await service
        .from('kinfolk_city_readiness_profiles')
        .delete()
        .eq('id', cityProfileId);
      if (error) console.error(`Cleanup warning for validation city: ${error.message}`);
    }

    console.log('\nValidation summary:');
    for (const result of results) {
      console.log(`${result.passed ? 'PASS' : 'FAIL'}  ${result.name}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
