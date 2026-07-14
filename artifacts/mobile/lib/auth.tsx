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
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  sessionExpired: false,
  login: async () => {},
  loginWithEmail: async () => ({}),
  logout: async () => {},
  refreshUser: async () => {},
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

  const fetchUser = useCallback(async () => {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
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
        } else {
          // Server explicitly says this token is invalid — safe to sign out.
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          setUser(null);
          setSessionExpired(true);
        }
        setIsLoading(false);
        return;
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
    try {
      const apiBase = getApiBaseUrl();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      let res: Response;
      try {
        res = await fetch(`${apiBase}/api/auth/login-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const data = await res.json();

      if (!res.ok) {
        return { error: data.error ?? "Login failed. Please try again." };
      }

      const token: string = data.token;
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      await SecureStore.setItemAsync("@melanin_maps_fresh_login", "1");
      setIsLoading(true);
      await fetchUser();
      return {};
    } catch {
      return { error: "Could not connect. Check your internet connection." };
    }
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
