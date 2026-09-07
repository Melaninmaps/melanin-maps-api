import { expect, test, vi, describe, beforeAll, afterAll } from 'vitest';
import { executeV1SearchWithFallback, saveV1State, loadV1State, V1_STATE_KEY } from '../lib/discoveryV1';
import * as authenticatedFetchModule from '../lib/authenticatedFetch';

const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) { return store[key] || null; },
    setItem(key: string, value: string) { store[key] = value; },
    clear() { store = {}; }
  };
})();

describe('Discovery V1 Client', () => {
  beforeAll(() => {
    (global as any).sessionStorage = mockSessionStorage;
  });

  afterAll(() => {
    delete (global as any).sessionStorage;
  });

  test('rounds geocoder coordinates to 2 decimal places and sends device_coarse', async () => {
    const fetchSpy = vi.spyOn(authenticatedFetchModule, 'authenticatedFetch').mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], total: 0, resultSetId: 'test-123' })
    } as any);

    await executeV1SearchWithFallback({
      query: 'test',
      surface: 'discover',
      latitude: 40.7128,
      longitude: -74.0060,
    });

    // Event preferences
    expect(fetchSpy).toHaveBeenCalledWith('/api/discovery/v1/preferences');

    // Search request
    const searchReq = fetchSpy.mock.calls.find(c => c[0] === '/api/discovery/v1/search');
    expect(searchReq).toBeDefined();

    const body = JSON.parse(searchReq![1].body);
    expect(body.location.source).toBe('device_coarse');
    expect(body.location.latitude).toBe(40.71);
    expect(body.location.longitude).toBe(-74.01);
    expect(body.consent.preciseLocation).toBe(false);
  });

  test('does not invent radiusMiles if omitted from server response', async () => {
    mockSessionStorage.clear();
    const fetchSpy = vi.spyOn(authenticatedFetchModule, 'authenticatedFetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [],
        total: 0,
        resultSetId: 'test-123',
        // Omitting radiusMiles intentionally
      })
    } as any);

    await executeV1SearchWithFallback({
      query: 'test',
      surface: 'discover',
      city: 'Brooklyn',
    });

    const stateStr = mockSessionStorage.getItem(V1_STATE_KEY);
    expect(stateStr).toBeDefined();
    const state = JSON.parse(stateStr!);
    expect(state.radius).toBeUndefined();
  });

  test("sends mounted directory category, specialty, and ownership chips through the business-only V1 surface", async () => {
    const fetchSpy = vi.spyOn(authenticatedFetchModule, "authenticatedFetch").mockImplementation(async (url) => {
      if (url === "/api/discovery/v1/preferences") {
        return { ok: true, json: async () => ({ searchImprovement: false, consentVersion: "v1" }) } as any;
      }
      return { ok: true, json: async () => ({ results: [], total: 0, resultSetId: "test-filters" }) } as any;
    });
    fetchSpy.mockClear();

    await executeV1SearchWithFallback({
      query: "barber",
      surface: "businesses",
      city: "Philadelphia",
      filters: {
        categoryIds: ["Beauty & Personal Care"],
        specialtyIds: ["Barber"],
        ownershipClaims: ["Black / African American-Owned"],
      },
    });

    const searchRequest = fetchSpy.mock.calls.find(([url]) => url === "/api/discovery/v1/search");
    expect(searchRequest).toBeDefined();
    expect(JSON.parse(searchRequest![1]!.body)).toMatchObject({
      surface: "businesses",
      filters: {
        categoryIds: ["Beauty & Personal Care"],
        specialtyIds: ["Barber"],
        ownershipClaims: ["Black / African American-Owned"],
      },
    });
  });
});
