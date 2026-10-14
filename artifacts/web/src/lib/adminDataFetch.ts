import { authenticatedFetch } from "@/lib/authenticatedFetch";

export class AdminDataRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminDataRequestError";
    this.status = status;
  }
}

/**
 * Fetch an administrator-only route without reusing an old browser response.
 *
 * Safari may retain an older authorization response for an unchanged URL after a
 * session is restored. Admin data must always be revalidated, and it must never
 * be rendered as an empty collection merely because a request failed.
 */
export function authenticatedAdminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-cache");

  return authenticatedFetch(input, {
    ...init,
    cache: "no-store",
    headers,
  });
}

/** Parse an admin response and preserve its failure state for the interface. */
export async function readAdminJson<T>(response: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // A non-JSON upstream failure still needs a visible, actionable error.
  }

  if (!response.ok) {
    const error = body && typeof body === "object" && "error" in body
      ? (body as { error?: unknown }).error
      : null;
    const message = typeof error === "string" && error.trim()
      ? error.trim()
      : `Admin request failed (HTTP ${response.status}).`;
    throw new AdminDataRequestError(message, response.status);
  }

  if (!body || typeof body !== "object") {
    throw new AdminDataRequestError(
      "The Admin service returned an incomplete response. Please retry.",
      response.status,
    );
  }

  return body as T;
}
