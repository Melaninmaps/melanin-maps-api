const TOKEN_KEY = "web_auth_token";

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
  } catch {
  }
}

export function clearWebToken(): void {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    if (token) {
      fetch("/api/mobile-auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  } catch {
  }
}
