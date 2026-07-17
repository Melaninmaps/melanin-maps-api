import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = "auth_session_token";

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
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string; authenticated?: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  sessionExpired: false,
  login: async () => {},
  loginWithEmail: async () => ({}),
  logout: async () => {},
  refreshUser: async () => false,
});

export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  if (process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN}`;
  }
  return "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const fetchUser = useCallback(async (): Promise<boolean> => {
    let token: string | null = null;
    try {
      token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (secureErr: unknown) {
      const e = secureErr as Error;
      console.error("[DIAG] fetchUser: SecureStore.getItemAsync threw", { errorName: e?.name, errorMessage: e?.message });
      setIsLoading(false);
      return false;
    }
    if (!token) {
      setUser(null);
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
        const data = await res.json();

        if (data.user) {
          setUser(data.user as User);
          setSessionExpired(false);
          setIsLoading(false);
          return true;
        } else {
          // Server explicitly says this token is invalid — safe to sign out.
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          setUser(null);
          setSessionExpired(true);
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
    setIsLoading(false);
    return false;
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async () => {
    try {
      const apiBase = getApiBaseUrl();
      const result = await WebBrowser.openAuthSessionAsync(
        `${apiBase}/api/mobile-auth/init`,
        "mappingwithmelanin://auth-complete",
      );

      if (result.type === "success") {
        const url = new URL(result.url);
        const token = url.searchParams.get("token");
        if (token) {
          await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
          await SecureStore.setItemAsync("@melanin_maps_fresh_login", "1");
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
      setIsLoading(false);
    }
  }, [fetchUser]);

  const loginWithEmail = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    const apiBase = getApiBaseUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
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
      console.error("[DIAG] login fetch threw", { host: apiBase, errorName: e?.name, errorMessage: e?.message });
      return { error: `Could not reach server (${e?.name ?? "network error"}). Check your connection.` };
    } finally {
      clearTimeout(timer);
    }

    const contentType = response.headers.get("content-type") ?? "";
    let rawBody = "";
    try {
      rawBody = await response.text();
    } catch (textErr: unknown) {
      const e = textErr as Error;
      console.error("[DIAG] login response.text() threw", { status: response.status, contentType, errorName: e?.name, errorMessage: e?.message });
      return { error: `Login failed: HTTP ${response.status} (could not read response).` };
    }

    console.log("[DIAG] login response received", {
      host: apiBase,
      path: "/api/auth/login-email",
      status: response.status,
      contentType,
      bodyReceived: rawBody.length > 0,
      bodyPreview: rawBody.length > 0 && !rawBody.includes("token") ? rawBody.slice(0, 100) : "[redacted]",
    });

    let data: { token?: string; error?: string } = {};
    try {
      data = JSON.parse(rawBody) as { token?: string; error?: string };
    } catch {
      console.error("[DIAG] login response not JSON", { status: response.status, contentType, bodyPreview: rawBody.slice(0, 100) });
      return { error: `Login service returned an unexpected response (HTTP ${response.status}).` };
    }

    if (!response.ok) {
      console.error("[DIAG] login failed", { status: response.status, responseKeys: Object.keys(data) });
      return { error: data.error ?? `Login failed (HTTP ${response.status}).` };
    }

    const token: string = data.token ?? "";
    if (!token) {
      console.error("[DIAG] login step 0: no token in response", { status: response.status, responseKeys: Object.keys(data) });
      return { error: "Login succeeded but no session was returned. Please try again." };
    }

    // Step 1 — persist session token
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      console.log("[DIAG] login step 1: token saved OK", { tokenLen: token.length });
    } catch (step1Err: unknown) {
      const e = step1Err as Error;
      console.error("[DIAG] login step 1 FAILED: SecureStore.setItemAsync(token)", { tokenLen: token.length, errorName: e?.name, errorMessage: e?.message, stack: e?.stack?.slice(0, 500) });
      return { error: `Signed in but could not save your session (storage step 1: ${e?.name ?? "unknown"}). Please try again.` };
    }

    // Step 1 verify — read the token back immediately to confirm it was retained
    try {
      const verified = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (!verified) {
        console.error("[DIAG] login step 1 verify: token not retained after save (read-back null)");
        return { error: "Session token was not retained after saving. Please try again." };
      }
      console.log("[DIAG] login step 1 verify: read-back confirmed OK");
    } catch (verifyErr: unknown) {
      const e = verifyErr as Error;
      console.error("[DIAG] login step 1 verify: read-back threw", { errorName: e?.name, errorMessage: e?.message });
      return { error: "Session saved but could not be verified. Please try again." };
    }

    // Step 2 — set fresh-login flag (non-critical, failure is allowed)
    try {
      await SecureStore.setItemAsync("@melanin_maps_fresh_login", "1");
    } catch (step2Err: unknown) {
      const e = step2Err as Error;
      console.error("[DIAG] login step 2: fresh_login flag failed (non-critical)", { errorName: e?.name, errorMessage: e?.message });
    }

    // Step 3 — load the user profile
    setIsLoading(true);
    let profileLoaded = false;
    try {
      profileLoaded = await fetchUser();
      if (!profileLoaded) {
        console.warn("[DIAG] login step 3: fetchUser returned false (profile not loaded — network issue or invalid session)");
      }
    } catch (step3Err: unknown) {
      const e = step3Err as Error;
      console.error("[DIAG] login step 3 FAILED: fetchUser threw unexpectedly", { errorName: e?.name, errorMessage: e?.message, stack: e?.stack?.slice(0, 500) });
    }

    return { authenticated: profileLoaded };
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        const apiBase = getApiBaseUrl();
        await fetch(`${apiBase}/api/mobile-auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
    } finally {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      setUser(null);
      setSessionExpired(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionExpired,
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
