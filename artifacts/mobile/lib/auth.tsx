import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";
import { getApiBase } from "@/lib/api";
import { identifyRevenueCatUser, resetRevenueCatUser } from "@/lib/revenuecat";
import { registerUnauthorizedApiResponseHandler } from "@/lib/authSessionSignals";
import { withAuthOperationDeadline } from "@/lib/authOperationDeadline";

WebBrowser.maybeCompleteAuthSession();

export const AUTH_TOKEN_KEY = "auth_session_token";
const FRESH_LOGIN_KEY = "@melanin_maps_fresh_login";
const APPLE_USER_ID_KEY = "apple_user_id";

/**
 * Removes only this device's persisted credentials. It never deletes a member
 * record, Community content, Kinfolk memory, or server-side saved places.
 * The global error boundary uses this when its normal AuthProvider is no
 * longer renderable, so a member always has a local account-recovery escape.
 */
export async function clearStoredAuthSession(): Promise<void> {
  // SecureStore normally resolves promptly. A device-local keychain operation
  // must never leave the member trapped behind a permanent auth spinner.
  await Promise.allSettled([
    withAuthOperationDeadline(
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      "Secure sign-in cleanup",
    ),
    withAuthOperationDeadline(
      SecureStore.deleteItemAsync(FRESH_LOGIN_KEY),
      "Secure sign-in cleanup",
    ),
    withAuthOperationDeadline(
      SecureStore.deleteItemAsync(APPLE_USER_ID_KEY),
      "Secure sign-in cleanup",
    ),
  ]);
}

/**
 * Stores a newly issued member session without allowing a native keychain
 * operation to strand the application on an authentication spinner. The token
 * is immediately read back before navigation proceeds; no token value is
 * logged or retained by this helper.
 */
export async function persistAuthSession(
  token: string,
  options: { appleUserId?: string } = {},
): Promise<void> {
  await withAuthOperationDeadline(
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
    "Secure sign-in storage",
  );
  const retained = await withAuthOperationDeadline(
    SecureStore.getItemAsync(AUTH_TOKEN_KEY),
    "Secure sign-in verification",
  );
  if (!retained) {
    throw new Error("Secure sign-in verification did not retain the session");
  }
  await withAuthOperationDeadline(
    SecureStore.setItemAsync(FRESH_LOGIN_KEY, "1"),
    "Secure sign-in setup",
  );
  if (options.appleUserId) {
    try {
      await withAuthOperationDeadline(
        SecureStore.setItemAsync(APPLE_USER_ID_KEY, options.appleUserId),
        "Apple sign-in setup",
      );
    } catch {
      // Apple foreground credential checks are optional. The member session
      // is already stored and verified, so this may not block sign-in.
    }
  }
}

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  approved: boolean;
  role: "user" | "tester" | "admin";
  memberType: string | null;
  dateOfBirth?: string | null;
  industry?: string | null;
  jobTitle?: string | null;
  emailVerified?: boolean;
  homeCity?: string | null;
  isPrivate?: boolean;
  bio?: string | null;
  profileSetupComplete?: boolean;
  mustChangePassword?: boolean;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  sessionRecoveryError: "secure_storage" | "connection" | null;
  login: () => Promise<void>;
  loginWithEmail: (
    email: string,
    password: string,
  ) => Promise<{
    error?: string;
    authenticated?: boolean;
    errorCode?: string;
    mustChangePassword?: boolean;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  sessionExpired: false,
  sessionRecoveryError: null,
  login: async () => {},
  loginWithEmail: async () => ({}),
  logout: async () => {},
  refreshUser: async () => false,
});

export const getApiBaseUrl = getApiBase;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionRecoveryError, setSessionRecoveryError] = useState<
    "secure_storage" | "connection" | null
  >(null);
  const expiringSessionRef = React.useRef(false);
  const reconcilingUnauthorizedRef = React.useRef(false);

  const expireSession = useCallback(async (): Promise<void> => {
    if (expiringSessionRef.current) return;
    expiringSessionRef.current = true;
    try {
      // Settle visible state before best-effort local cleanup. The server has
      // already rejected this session; cleanup cannot be allowed to block the
      // route back to usable sign-in UI.
      setUser(null);
      setSessionExpired(true);
      setSessionRecoveryError(null);
      setIsLoading(false);
      void clearStoredAuthSession();
      void resetRevenueCatUser();
    } finally {
      expiringSessionRef.current = false;
    }
  }, []);

  const fetchUser = useCallback(async (): Promise<boolean> => {
    let token: string | null = null;
    try {
      token = await withAuthOperationDeadline(
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        "Secure sign-in restoration",
      );
    } catch (secureErr: unknown) {
      const e = secureErr as Error;
      console.error("fetchUser: SecureStore.getItemAsync threw", {
        errorName: e?.name,
        errorMessage: e?.message,
      });
      setSessionExpired(false);
      setSessionRecoveryError("secure_storage");
      setIsLoading(false);
      return false;
    }
    if (!token) {
      setUser(null);
      setSessionExpired(false);
      setSessionRecoveryError(null);
      setIsLoading(false);
      return false;
    }

    const apiBase = getApiBaseUrl();
    const maxAttempts = 3;
    const FETCH_TIMEOUT_MS = 10_000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(`${apiBase}/api/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        const data = await withAuthOperationDeadline(
          res.json(),
          "Secure sign-in response",
        );

        if (data.user) {
          setUser(data.user as User);
          setSessionExpired(false);
          setSessionRecoveryError(null);
          setIsLoading(false);
          // Tie RC entitlements to this MWM account so they are portable
          // across devices and reinstalls.
          void identifyRevenueCatUser(String((data.user as User).id));
          return true;
        } else if (res.status === 401) {
          // Server explicitly says this token is invalid (401) — safe to sign out.
          await expireSession();
          return false;
        } else {
          // Non-401 response with no user (e.g. 500 server error, transient failure).
          // Do NOT erase the token or sign the user out — treat as a transient error
          // and retry. A server hiccup must never cause an irreversible logout.
          console.warn(
            "[AUTH] /api/auth/user returned no user with status",
            res.status,
            "— keeping session, retrying",
          );
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 500));
            continue;
          }
          // All retries exhausted — keep existing user state.
          setSessionRecoveryError("connection");
          setIsLoading(false);
          return false;
        }
      } catch {
        clearTimeout(timer);
        // Network-level failure or timeout — don't assume the user is signed
        // out. Retry with backoff before giving up, so a transient
        // connectivity blip right after login doesn't strand the user on
        // the login screen despite a valid stored session.
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          continue;
        }
      }
    }

    // All retries exhausted due to network errors. Keep the existing user
    // state (if any) rather than forcing a sign-out — the token is still
    // valid, we just couldn't reach the server.
    setSessionRecoveryError("connection");
    setIsLoading(false);
    return false;
  }, [expireSession]);

  useEffect(() => {
    void Promise.resolve().then(fetchUser);
  }, [fetchUser]);

  const reconcileUnauthorizedSession = useCallback(async () => {
    if (reconcilingUnauthorizedRef.current) return;
    reconcilingUnauthorizedRef.current = true;
    try {
      // A response-level 401 can come from a stale request or a route-specific
      // authorization failure. Revalidate the current member session before
      // clearing it; fetchUser itself expires only on /api/auth/user 401.
      await fetchUser();
    } finally {
      reconcilingUnauthorizedRef.current = false;
    }
  }, [fetchUser]);

  useEffect(() => {
    // Most native screens issue authenticated fetches directly. A verified 401
    // from the configured API must reconcile AuthProvider as well. It first
    // revalidates /api/auth/user so a route-specific 401 cannot erase a valid
    // local session.
    return registerUnauthorizedApiResponseHandler(() => {
      void reconcileUnauthorizedSession();
    });
  }, [reconcileUnauthorizedSession]);

  const login = useCallback(async () => {
    try {
      setSessionRecoveryError(null);
      const apiBase = getApiBaseUrl();
      const result = await WebBrowser.openAuthSessionAsync(
        `${apiBase}/api/mobile-auth/init`,
        "mappingwithmelanin://auth-complete",
      );

      if (result.type === "success") {
        const url = new URL(result.url);
        const token = url.searchParams.get("token");
        if (token) {
          await persistAuthSession(token);
        }
      }

      // Always refresh auth state after the browser session closes.
      // On iPadOS, ASWebAuthenticationSession can return { type: "dismiss" } or
      // { type: "cancel" } even when sign-in completed — the OS delivers the
      // custom-scheme deep link to auth-complete.tsx which stores the token
      // before openAuthSessionAsync returns. Calling fetchUser here ensures we
      // pick up that token regardless of which code path stored it.
      setIsLoading(true);
      await fetchUser();
    } catch (err) {
      console.error("Login error:", err);
      setSessionRecoveryError("secure_storage");
      setIsLoading(false);
      throw err;
    }
  }, [fetchUser]);

  const loginWithEmail = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{
      error?: string;
      authenticated?: boolean;
      errorCode?: string;
      mustChangePassword?: boolean;
    }> => {
      setSessionRecoveryError(null);
      const apiBase = getApiBaseUrl();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      let response: Response;
      try {
        response = await fetch(`${apiBase}/api/auth/login-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
      } catch (fetchErr: unknown) {
        clearTimeout(timer);
        const e = fetchErr as Error;
        console.error("login fetch threw", {
          host: apiBase,
          errorName: e?.name,
          errorMessage: e?.message,
        });
        const isTimeout = e?.name === "AbortError";
        return {
          error: isTimeout
            ? "Connection timed out. Please check your network and try again."
            : `Could not reach the server. Check your connection and try again.`,
        };
      } finally {
        clearTimeout(timer);
      }

      const contentType = response.headers.get("content-type") ?? "";
      let rawBody = "";
      try {
        rawBody = await withAuthOperationDeadline(
          response.text(),
          "Sign-in response",
        );
      } catch (textErr: unknown) {
        const e = textErr as Error;
        console.error("login response.text() threw", {
          status: response.status,
          contentType,
          errorName: e?.name,
          errorMessage: e?.message,
        });
        return {
          error: `Login failed: HTTP ${response.status} (could not read response).`,
        };
      }

      let data: {
        token?: string;
        error?: string;
        mustChangePassword?: boolean;
      } = {};
      try {
        data = JSON.parse(rawBody) as { token?: string; error?: string };
      } catch {
        console.error("login response not JSON", {
          status: response.status,
          contentType,
          bodyPreview: rawBody.slice(0, 100),
        });
        return {
          error: `Login service returned an unexpected response (HTTP ${response.status}).`,
        };
      }

      if (!response.ok) {
        const errorCode = (data as { error_code?: string }).error_code;
        console.error("login failed", {
          status: response.status,
          responseKeys: Object.keys(data),
          errorCode,
        });
        return {
          error: data.error ?? `Login failed (HTTP ${response.status}).`,
          errorCode,
        };
      }

      const token: string = data.token ?? "";
      if (!token) {
        console.error("login step 0: no token in response", {
          status: response.status,
          responseKeys: Object.keys(data),
        });
        return {
          error:
            "Login succeeded but no session was returned. Please try again.",
        };
      }

      // Step 1 — persist session token
      try {
        await withAuthOperationDeadline(
          SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
          "Secure sign-in storage",
        );
      } catch (step1Err: unknown) {
        const e = step1Err as Error;
        console.error("login step 1 FAILED: SecureStore.setItemAsync(token)", {
          tokenLen: token.length,
          errorName: e?.name,
          errorMessage: e?.message,
          stack: e?.stack?.slice(0, 500),
        });
        return {
          error: `Signed in but could not save your session (storage step 1: ${e?.name ?? "unknown"}). Please try again.`,
        };
      }

      // Step 1 verify — read the token back immediately to confirm it was retained
      try {
        const verified = await withAuthOperationDeadline(
          SecureStore.getItemAsync(AUTH_TOKEN_KEY),
          "Secure sign-in verification",
        );
        if (!verified) {
          console.error(
            "login step 1 verify: token not retained after save (read-back null)",
          );
          return {
            error:
              "Session token was not retained after saving. Please try again.",
          };
        }
      } catch (verifyErr: unknown) {
        const e = verifyErr as Error;
        console.error("login step 1 verify: read-back threw", {
          errorName: e?.name,
          errorMessage: e?.message,
        });
        return {
          error: "Session saved but could not be verified. Please try again.",
        };
      }

      // Step 2 — set fresh-login flag (non-critical, failure is allowed)
      try {
        await withAuthOperationDeadline(
          SecureStore.setItemAsync(FRESH_LOGIN_KEY, "1"),
          "Secure sign-in setup",
        );
      } catch (step2Err: unknown) {
        const e = step2Err as Error;
        console.error("login step 2: fresh_login flag failed (non-critical)", {
          errorName: e?.name,
          errorMessage: e?.message,
        });
      }

      // Step 3 — token written and verified. Authentication is established.
      // Set isLoading=true so AuthGate sees a loading state and cannot
      // redirect to /login while the caller (login.tsx) awaits refreshUser().
      // The caller awaits the profile fetch directly and only navigates after
      // isAuthenticated=true is in place, eliminating the three-way
      // router.replace race that caused the confirmed VC67/VC68 login flash.
      setIsLoading(true);

      return {
        authenticated: true,
        mustChangePassword: data.mustChangePassword === true,
      };
    },
    [],
  );

  const logout = useCallback(async () => {
    // Step 1: Read token while the authenticated screen is still mounted.
    let token: string | null = null;
    try {
      token = await withAuthOperationDeadline(
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        "Secure sign-in logout",
      );
    } catch {
      // Local logout must still complete if a device storage read is briefly
      // unavailable. The delete, in-memory reset, and login return below are
      // intentionally not conditional on this best-effort server revocation.
    }

    // Step 2: Reset in-memory state before best-effort local deletion so a
    // stalled device credential operation cannot trap the member in-app.
    setUser(null);
    setSessionExpired(false);
    setSessionRecoveryError(null);
    setIsLoading(false);
    void clearStoredAuthSession();

    // Step 3: RevenueCat session cleanup (non-blocking).
    void resetRevenueCatUser();

    // Step 4: Bounded server-side revocation. Uses the old token retained in
    // memory — does not read or restore anything from SecureStore.
    // 3-second deadline: responsive logout with a genuine revocation attempt.
    // Failure does not restore the local token or block the return.
    if (token) {
      try {
        const apiBase = getApiBaseUrl();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3_000);
        try {
          await fetch(`${apiBase}/api/mobile-auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }
      } catch {
        // Revocation timed out or failed. Local logout is already complete.
        // Old server session will expire naturally. Local token is not restored.
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    // Track last check time to enforce cooldown between checks.
    const lastCheckRef = { current: 0 };
    // Record when this effect mounted so we can apply a post-login grace period.
    // The AppState "active" event fires immediately after login completes (as the
    // app transitions from background to foreground during the sign-in sheet dismiss),
    // which can cause a spurious logout if Apple's credential API hasn't settled yet.
    const mountedAt = Date.now();
    const COOLDOWN_MS = 5 * 60 * 1000; // check at most once per 5 minutes
    const LOGIN_GRACE_MS = 10 * 1000; // skip check for 10s after mount/login

    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        if (nextState !== "active") return;

        // Skip during post-login grace period — Apple's sandbox credential API
        // is unreliable in the seconds immediately after sign-in completes.
        if (Date.now() - mountedAt < LOGIN_GRACE_MS) return;

        // Cooldown: don't hammer Apple's API on every foreground transition.
        if (Date.now() - lastCheckRef.current < COOLDOWN_MS) return;
        lastCheckRef.current = Date.now();

        const appleUserId = await SecureStore.getItemAsync(
          APPLE_USER_ID_KEY,
        ).catch(() => null);
        if (!appleUserId) return;

        try {
          const AppleAuth = await import("expo-apple-authentication");
          const credState =
            await AppleAuth.getCredentialStateAsync(appleUserId);
          console.log("[AppleAuth] foreground credential state:", credState);

          if (
            credState === AppleAuth.AppleAuthenticationCredentialState.REVOKED
          ) {
            // Definitive revocation — log out immediately.
            await SecureStore.deleteItemAsync(APPLE_USER_ID_KEY).catch(() => {});
            await logout();
          } else if (
            credState === AppleAuth.AppleAuthenticationCredentialState.NOT_FOUND
          ) {
            // NOT_FOUND can be a transient sandbox/TestFlight glitch — retry once
            // before treating it as a hard revocation.
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const retryState =
              await AppleAuth.getCredentialStateAsync(appleUserId);
            console.log("[AppleAuth] credential state retry:", retryState);
            if (
              retryState ===
              AppleAuth.AppleAuthenticationCredentialState.NOT_FOUND
            ) {
              await SecureStore.deleteItemAsync(APPLE_USER_ID_KEY).catch(
                () => {},
              );
              await logout();
            }
          }
        } catch {
          // Credential state check unavailable — Apple services unreachable or unsupported platform
        }
      },
    );
    return () => subscription.remove();
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionExpired,
        sessionRecoveryError,
        login,
        loginWithEmail,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
