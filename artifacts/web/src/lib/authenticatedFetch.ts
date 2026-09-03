import { getWebToken } from "@/lib/webAuth";

/**
 * Fetch a same-origin API route with both browser authentication mechanisms.
 *
 * The API accepts either the HttpOnly sid cookie or the bearer session returned
 * at sign-in. Sending both keeps direct API calls aligned with generated hooks,
 * including when a browser has retained the bearer token but not the cookie.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const requestHeaders = typeof Request !== "undefined" && input instanceof Request
    ? input.headers
    : undefined;
  const headers = new Headers(requestHeaders);

  new Headers(init.headers).forEach((value, key) => {
    headers.set(key, value);
  });

  if (!headers.has("authorization")) {
    const token = getWebToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });
}
