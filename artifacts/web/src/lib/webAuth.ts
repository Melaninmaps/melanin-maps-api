const TOKEN_KEY = "web_auth_token";
const SID_COOKIE = "sid";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function setSidCookie(token: string): void {
  document.cookie = `${SID_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearSidCookie(): void {
  // Note: the server sets sid as HttpOnly, which means JavaScript cannot delete
  // it via document.cookie. The server clears it via Set-Cookie in the logout
  // response. This line is belt-and-suspenders for any non-HttpOnly fallback.
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

/**
 * Clear the local token and revoke the server session.
 * Returns a Promise that resolves only after the server has confirmed the
 * session is deleted and returned a Set-Cookie header clearing the HttpOnly
 * sid cookie. Callers MUST await this before navigating away, otherwise the
 * browser page-load request races the server-side deletion and the user
 * appears still logged in.
 */
export async function clearWebToken(): Promise<void> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    clearSidCookie();
    if (token) {
      // Await the fetch so the server has time to delete the session and send
      // the Set-Cookie: sid=; Max-Age=0 header before the browser navigates.
      await fetch("/api/mobile-auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // Non-fatal — localStorage may be unavailable, or network may fail.
    // Navigation proceeds regardless; worst case the session expires naturally.
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
