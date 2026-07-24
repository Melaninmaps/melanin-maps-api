/**
 * Map-ready guard — unit tests
 *
 * These tests verify the contracts of the two mapReady gates added to
 * FullMapView to prevent native Android crashes caused by calling
 * animateToRegion() and rendering cultural-site Markers before the
 * Google Maps SDK fires onMapReady().
 *
 * Root cause (VC68/VC69): Two pre-onMapReady violations on cold map open:
 *   1. animateToRegion() was called immediately when GPS resolved, before
 *      onMapReady fired. GPS acquisition (~300–800ms) races with map init
 *      (~800–1500ms on Android Fabric). On fast GPS, animateToRegion hit a
 *      null GoogleMap object → NullPointerException.
 *   2. Effect B (cultural-sites background refresh) fired on tab focus
 *      without checking mapReady, loading 100+ Markers into an uninitialized
 *      MapView native layer → native Android crash.
 *
 * Fix (VC70):
 *   1. animateToRegion is guarded by mapReadyRef (a ref, not state, to avoid
 *      re-renders inside an async effect). If GPS resolves before map ready,
 *      coords are stored in pendingLocationRef and flushed from onMapReady.
 *   2. Effect B now checks `mapReady` (state) and includes it in its deps.
 *
 * Test approach: plain TypeScript state-machine simulations — no React Native
 * runtime required, mirrors the exact logic in FullMapView.tsx.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Simulation helpers
// ---------------------------------------------------------------------------

function makeMapReadyMachine() {
  let mapReady = false;
  const mapReadyRef = { current: false };
  const pendingLocationRef: { current: { latitude: number; longitude: number } | null } = {
    current: null,
  };
  const animateCalls: Array<{ latitude: number; longitude: number; when: string }> = [];
  const markerFetchCalls: Array<{ when: string }> = [];

  function onMapReady() {
    mapReadyRef.current = true;
    mapReady = true;
    const pending = pendingLocationRef.current;
    if (pending) {
      pendingLocationRef.current = null;
      animateCalls.push({ ...pending, when: "onMapReady-flush" });
    }
  }

  function onGpsAcquired(lat: number, lng: number) {
    if (mapReadyRef.current) {
      animateCalls.push({ latitude: lat, longitude: lng, when: "immediate" });
    } else {
      pendingLocationRef.current = { latitude: lat, longitude: lng };
    }
  }

  function onTabFocus(showCulturalSites: boolean) {
    if (showCulturalSites && mapReady) {
      markerFetchCalls.push({ when: "onTabFocus" });
    }
  }

  return {
    get mapReady() { return mapReady; },
    get mapReadyRef() { return mapReadyRef; },
    get pendingLocationRef() { return pendingLocationRef; },
    onMapReady,
    onGpsAcquired,
    onTabFocus,
    animateCalls,
    markerFetchCalls,
  };
}

// ---------------------------------------------------------------------------
// Fix 1 — animateToRegion guard
// ---------------------------------------------------------------------------

describe("Fix 1: animateToRegion guard — GPS resolves before onMapReady", () => {
  it("does NOT call animateToRegion when GPS resolves before map is ready", () => {
    const m = makeMapReadyMachine();

    // GPS acquires before onMapReady fires
    m.onGpsAcquired(39.9526, -75.1652);

    expect(m.animateCalls).toHaveLength(0);
    expect(m.pendingLocationRef.current).toEqual({ latitude: 39.9526, longitude: -75.1652 });
  });

  it("flushes pending location from onMapReady when GPS resolved first", () => {
    const m = makeMapReadyMachine();

    m.onGpsAcquired(39.9526, -75.1652);
    m.onMapReady();

    expect(m.animateCalls).toHaveLength(1);
    expect(m.animateCalls[0]).toMatchObject({
      latitude: 39.9526,
      longitude: -75.1652,
      when: "onMapReady-flush",
    });
    expect(m.pendingLocationRef.current).toBeNull();
  });

  it("calls animateToRegion immediately when GPS resolves after map is ready", () => {
    const m = makeMapReadyMachine();

    // Map ready first, then GPS
    m.onMapReady();
    m.onGpsAcquired(39.9526, -75.1652);

    expect(m.animateCalls).toHaveLength(1);
    expect(m.animateCalls[0]).toMatchObject({
      latitude: 39.9526,
      longitude: -75.1652,
      when: "immediate",
    });
    expect(m.pendingLocationRef.current).toBeNull();
  });

  it("does not call animateToRegion at all when GPS times out (no coords stored)", () => {
    const m = makeMapReadyMachine();

    // GPS timeout: onGpsAcquired is never called
    m.onMapReady();

    expect(m.animateCalls).toHaveLength(0);
    expect(m.pendingLocationRef.current).toBeNull();
  });

  it("pending location is cleared after flush — second onMapReady call does not re-animate", () => {
    const m = makeMapReadyMachine();

    m.onGpsAcquired(39.9526, -75.1652);
    m.onMapReady();
    // Simulate onMapReady firing a second time (edge case on some Android versions)
    m.onMapReady();

    expect(m.animateCalls).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Fix 2 — Cultural-sites Effect B guard
// ---------------------------------------------------------------------------

describe("Fix 2: cultural-sites Effect B — does not fetch before mapReady", () => {
  it("does NOT fetch cultural sites when tab gains focus before map is ready", () => {
    const m = makeMapReadyMachine();

    // Tab focused but map not ready
    m.onTabFocus(true);

    expect(m.markerFetchCalls).toHaveLength(0);
  });

  it("fetches cultural sites when tab is focused AND map is ready", () => {
    const m = makeMapReadyMachine();

    m.onMapReady();
    m.onTabFocus(true);

    expect(m.markerFetchCalls).toHaveLength(1);
  });

  it("does NOT fetch when showCulturalSites is false even if map is ready", () => {
    const m = makeMapReadyMachine();

    m.onMapReady();
    m.onTabFocus(false);

    expect(m.markerFetchCalls).toHaveLength(0);
  });

  it("fetches when mapReady state transitions to true while tab is focused", () => {
    const m = makeMapReadyMachine();

    // Simulate the mapReady state change triggering Effect B
    // (isFocused=true, showCulturalSites=true, mapReady was false → becomes true)
    m.onTabFocus(true); // fires before ready: no fetch
    expect(m.markerFetchCalls).toHaveLength(0);

    m.onMapReady(); // ready: Effect B re-evaluates
    m.onTabFocus(true); // now fires with mapReady=true
    expect(m.markerFetchCalls).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Combined scenario — cold map open (the VC68/VC69 crash scenario)
// ---------------------------------------------------------------------------

describe("Combined: cold map open — both guards active simultaneously", () => {
  it("GPS fast path: location stored, no animate call, no marker fetch until map ready", () => {
    const m = makeMapReadyMachine();

    // t=0ms: tab focused — Effect B fires, map not ready, NO fetch
    m.onTabFocus(true);
    expect(m.markerFetchCalls).toHaveLength(0);

    // t=300ms: GPS acquires before map ready — stored, NOT animated
    m.onGpsAcquired(39.9526, -75.1652);
    expect(m.animateCalls).toHaveLength(0);
    expect(m.markerFetchCalls).toHaveLength(0);

    // t=1000ms: onMapReady fires — pending location flushed, Effect B runs
    m.onMapReady();
    m.onTabFocus(true); // Effect B re-triggered by mapReady state change

    expect(m.animateCalls).toHaveLength(1);
    expect(m.animateCalls[0].when).toBe("onMapReady-flush");
    expect(m.markerFetchCalls).toHaveLength(1);
  });

  it("GPS slow path: map ready first, animate immediate, marker fetch already triggered", () => {
    const m = makeMapReadyMachine();

    m.onTabFocus(true);   // before ready: no fetch
    m.onMapReady();       // map ready: Effect B re-triggers
    m.onTabFocus(true);   // now fires with mapReady=true: fetch

    expect(m.markerFetchCalls).toHaveLength(1);

    // GPS resolves after map ready — immediate animate
    m.onGpsAcquired(39.9526, -75.1652);
    expect(m.animateCalls).toHaveLength(1);
    expect(m.animateCalls[0].when).toBe("immediate");
  });
});
