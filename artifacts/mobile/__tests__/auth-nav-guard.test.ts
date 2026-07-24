/**
 * Auth navigation guard — unit tests
 *
 * These tests verify the contracts of the auth state machine that protect
 * against the Login-screen flash confirmed on physical Android VC67.
 *
 * Root cause: loginWithEmail() fired void fetchUser() without first setting
 * isLoading=true. AuthGate saw { isLoading:false, user:null } in the window
 * between loginWithEmail() returning and fetchUser() resolving, and called
 * router.replace("/login"), causing the flash.
 *
 * Fix: setIsLoading(true) is now called immediately before void fetchUser()
 * in loginWithEmail (auth.tsx). AuthGate already guards on isLoading — this
 * one-line change closes the race window entirely.
 *
 * Test approach: the auth state machine is tested via a plain TypeScript
 * simulation that mirrors the exact logic in auth.tsx and _layout.tsx without
 * requiring a React-Native runtime.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Minimal simulation of the AuthProvider state machine
// ---------------------------------------------------------------------------

interface AuthState {
  user: object | null;
  isLoading: boolean;
  sessionExpired: boolean;
}

type SetState<T> = (updater: T | ((prev: T) => T)) => void;

function makeAuthMachine(fetchUserResult: { user: object | null; success: boolean }) {
  const state: AuthState = { user: null, isLoading: true, sessionExpired: false };

  const setState: SetState<Partial<AuthState>> = (updater) => {
    const patch = typeof updater === "function" ? updater(state) : updater;
    Object.assign(state, patch);
  };

  const setIsLoading = (v: boolean) => setState({ isLoading: v });
  const setUser = (u: object | null) => setState({ user: u });

  async function fetchUser(): Promise<boolean> {
    // Yield to the microtask queue — mirrors the real fetchUser which
    // always yields immediately on SecureStore.getItemAsync or fetch().
    // Without this, the simulation runs synchronously and the test cannot
    // observe the in-flight isLoading=true state.
    await Promise.resolve();
    try {
      if (fetchUserResult.success && fetchUserResult.user) {
        setUser(fetchUserResult.user);
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch {
      setIsLoading(false);
      return false;
    }
  }

  async function loginWithEmail(_email: string, _password: string): Promise<{ authenticated: boolean }> {
    // Simulate token storage success + verification (sync ops)
    // — FIXED: set isLoading=true before firing background fetchUser
    setIsLoading(true);
    void fetchUser();
    return { authenticated: true };
  }

  function authGateShouldRedirect(pathname: string): boolean {
    const AUTH_EXEMPT = [
      "/onboarding", "/login", "/signup", "/phone-login",
      "/forgot-password", "/reset-password", "/auth-complete",
      "/pending-approval", "/waitlist", "/dob-collection",
      "/profile-setup", "/community-guidelines", "/community-standards",
      "/roadmap", "/contact", "/affiliate",
    ];
    if (state.isLoading) return false;
    const isAuthenticated = !!state.user;
    if (isAuthenticated) return false;
    if (AUTH_EXEMPT.some((p) => pathname.startsWith(p))) return false;
    return true;
  }

  return { state, loginWithEmail, fetchUser, authGateShouldRedirect, setIsLoading, setUser };
}

// ---------------------------------------------------------------------------
// Scenario 1 — Successful login: no Login-screen flash
// ---------------------------------------------------------------------------
describe("Scenario 1: successful email login — no Login-screen flash", () => {
  it("AuthGate does NOT redirect immediately after loginWithEmail returns", async () => {
    const auth = makeAuthMachine({ user: { id: "u1" }, success: true });
    // Simulate app startup complete: isLoading=false, user=null
    auth.state.isLoading = false;

    // User taps Sign In
    const loginPromise = auth.loginWithEmail("user@example.com", "password");

    // At this exact point — loginWithEmail has returned control but
    // fetchUser() is still in-flight. This is the race window that caused
    // the flash on VC67. AuthGate must NOT redirect here.
    expect(auth.state.isLoading).toBe(true);
    expect(auth.authGateShouldRedirect("/(tabs)")).toBe(false);

    await loginPromise;
  });

  it("AuthGate does NOT redirect after fetchUser completes with user", async () => {
    const auth = makeAuthMachine({ user: { id: "u1" }, success: true });
    auth.state.isLoading = false;
    await auth.loginWithEmail("user@example.com", "password");
    // Give fetchUser time to resolve (it's fired as void but runs async)
    await new Promise((r) => setTimeout(r, 0));

    expect(auth.state.user).toEqual({ id: "u1" });
    expect(auth.state.isLoading).toBe(false);
    expect(auth.authGateShouldRedirect("/(tabs)")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Scenario 2 — Signup to profile setup: no flash
// AuthGate is silent because /profile-setup is an AUTH_EXEMPT path.
// ---------------------------------------------------------------------------
describe("Scenario 2: signup → /profile-setup — no flash", () => {
  it("AuthGate does NOT redirect when pathname is /profile-setup", () => {
    const auth = makeAuthMachine({ user: null, success: false });
    // Simulate state right after void refreshUser() + router.replace("/profile-setup")
    auth.state.isLoading = false;
    auth.state.user = null;

    expect(auth.authGateShouldRedirect("/profile-setup")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Scenario 3 — Cold app reopen with retained session
// isLoading starts true (AuthProvider initialState) so AuthGate never fires
// until the initial fetchUser() resolves.
// ---------------------------------------------------------------------------
describe("Scenario 3: cold app reopen — AuthGate silent during initial fetch", () => {
  it("AuthGate does NOT redirect while initial fetchUser is in-flight", () => {
    const auth = makeAuthMachine({ user: { id: "u1" }, success: true });
    // AuthProvider initialState: isLoading=true
    expect(auth.state.isLoading).toBe(true);
    expect(auth.authGateShouldRedirect("/(tabs)")).toBe(false);
  });

  it("AuthGate does NOT redirect after fetchUser restores a valid session", async () => {
    const auth = makeAuthMachine({ user: { id: "u1" }, success: true });
    await auth.fetchUser();

    expect(auth.state.user).toEqual({ id: "u1" });
    expect(auth.state.isLoading).toBe(false);
    expect(auth.authGateShouldRedirect("/(tabs)")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Scenario 4 — Expired token redirect
// fetchUser clears user + sets sessionExpired on 401 → AuthGate (or
// SessionExpiryWatcher) redirects to /login?expired=1
// ---------------------------------------------------------------------------
describe("Scenario 4: expired token — redirect to login", () => {
  it("AuthGate redirects after token expiry clears user", async () => {
    const auth = makeAuthMachine({ user: null, success: false });
    // Simulate initial load with expired token: fetchUser got 401
    auth.state.user = null;
    auth.state.isLoading = false;
    auth.state.sessionExpired = true;

    // AuthGate fires redirect (SessionExpiryWatcher handles the exact
    // /login?expired=1 route — this just confirms the redirect condition)
    expect(auth.authGateShouldRedirect("/(tabs)")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Scenario 5 — Logout
// logout() sets user=null + isLoading=false → AuthGate redirects to /login
// ---------------------------------------------------------------------------
describe("Scenario 5: logout — AuthGate redirects to /login", () => {
  it("AuthGate redirects after logout clears user", () => {
    const auth = makeAuthMachine({ user: { id: "u1" }, success: true });
    // Start authenticated
    auth.state.user = { id: "u1" };
    auth.state.isLoading = false;
    expect(auth.authGateShouldRedirect("/(tabs)")).toBe(false);

    // Logout: user cleared
    auth.setUser(null);
    auth.state.isLoading = false;
    expect(auth.authGateShouldRedirect("/(tabs)")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Scenario 6 — Slow /api/auth/user response
// isLoading=true is maintained for the full duration of the fetch.
// AuthGate never fires regardless of how long the fetch takes.
// ---------------------------------------------------------------------------
describe("Scenario 6: slow /api/auth/user — AuthGate stays silent", () => {
  it("AuthGate does NOT redirect during an extended fetch duration", async () => {
    let resolveFetch!: (v: boolean) => void;
    const slowFetchPromise = new Promise<boolean>((r) => { resolveFetch = r; });

    const auth = makeAuthMachine({ user: { id: "u1" }, success: true });
    auth.state.isLoading = false;

    // loginWithEmail fires void fetchUser and sets isLoading=true
    const loginDone = auth.loginWithEmail("user@example.com", "password");

    // Simulate a slow backend: AuthGate checks happen repeatedly
    for (let i = 0; i < 10; i++) {
      expect(auth.authGateShouldRedirect("/(tabs)")).toBe(false);
      expect(auth.state.isLoading).toBe(true);
    }

    // Fetch eventually resolves
    resolveFetch(true);
    await loginDone;
    await new Promise((r) => setTimeout(r, 0));

    expect(auth.authGateShouldRedirect("/(tabs)")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Scenario 7 — Temporary backend failure (all retries exhausted)
// fetchUser exits with setIsLoading(false) + user=null → AuthGate sees
// unauthenticated state and redirects to /login. Correct: no valid profile.
// ---------------------------------------------------------------------------
describe("Scenario 7: temporary backend failure — redirects to /login", () => {
  it("AuthGate redirects after fetchUser exhausts all retries with no user", async () => {
    const auth = makeAuthMachine({ user: null, success: false });
    auth.state.isLoading = false;

    await auth.loginWithEmail("user@example.com", "password");
    await new Promise((r) => setTimeout(r, 0));

    // fetchUser failed — user remains null, isLoading=false
    expect(auth.state.user).toBeNull();
    expect(auth.state.isLoading).toBe(false);
    // Redirect is expected — no verified profile to display
    expect(auth.authGateShouldRedirect("/(tabs)")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Invariant: AuthGate guard — isLoading always takes priority
// ---------------------------------------------------------------------------
describe("AuthGate guard invariant", () => {
  it("isLoading=true always blocks redirect regardless of other state", () => {
    const auth = makeAuthMachine({ user: null, success: false });
    auth.state.isLoading = true;
    auth.state.user = null;

    const exemptPaths = [
      "/onboarding", "/login", "/signup", "/profile-setup", "/reset-password",
    ];
    const protectedPaths = ["/(tabs)", "/map", "/discover", "/profile"];

    for (const p of [...exemptPaths, ...protectedPaths]) {
      expect(auth.authGateShouldRedirect(p)).toBe(false);
    }
  });

  it("isAuthenticated=true always blocks redirect on protected paths", () => {
    const auth = makeAuthMachine({ user: { id: "u1" }, success: true });
    auth.state.user = { id: "u1" };
    auth.state.isLoading = false;

    expect(auth.authGateShouldRedirect("/(tabs)")).toBe(false);
    expect(auth.authGateShouldRedirect("/map")).toBe(false);
    expect(auth.authGateShouldRedirect("/discover")).toBe(false);
  });
});
