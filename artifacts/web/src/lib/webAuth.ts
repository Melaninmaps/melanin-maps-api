const TOKEN_KEY = "web_auth_token";
const SID_COOKIE = "sid";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function setSidCookie(token: string): void {
  document.cookie = `${SID_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearSidCookie(): void {
  document.cookie = `${SID_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function getWebToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setWebToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    setSidCookie(token);
  } catch {
  }
}

export function clearWebToken(): void {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    clearSidCookie();
    if (token) {
      fetch("/api/mobile-auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  } catch {
  }
}

/**
 * Sync the current localStorage token to the sid cookie so that
 * `credentials: "include"` fetches can find the session.
 * Call once on mount in any page that uses raw fetch() with credentials.
 */
export function syncTokenToCookie(): void {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) setSidCookie(token);
  } catch {
  }
}
