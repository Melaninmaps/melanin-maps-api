import { getApiBase } from "./apiOrigin";

export type KinfolkPrivateApiContext = {
  base: string;
  headers: Record<string, string>;
};

/**
 * Resolves a member-authenticated Kinfolk API context through the sole reviewed
 * API-origin policy. Private locations, stays, settings, and other bearer
 * flows must never construct an origin from a legacy environment variable.
 */
export async function requireKinfolkPrivateApiContext(
  readToken: () => Promise<string | null>,
  screenLabel: string,
  resolveApiBase: () => string = getApiBase,
): Promise<KinfolkPrivateApiContext> {
  const token = await readToken();
  if (!token) throw new Error(`Please sign in again to use ${screenLabel}.`);

  // getApiBase validates HTTPS/origin-only configuration and staging binding
  // before any authenticated request can be constructed.
  const base = resolveApiBase();
  return {
    base,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
}
