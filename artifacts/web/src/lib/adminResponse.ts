export type AdminJsonObject = Record<string, unknown>;

type AdminErrorBody = {
  error?: unknown;
  message?: unknown;
};

function responseMessage(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const candidate = body as AdminErrorBody;
  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error.trim();
  }
  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message.trim();
  }
  return null;
}

/**
 * Reads an Admin API response before a dashboard loader replaces confirmed UI
 * state. HTTP errors and malformed bodies must never look like empty data.
 */
export async function readAdminJsonObject(
  response: Response,
  resourceLabel: string,
): Promise<AdminJsonObject> {
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = responseMessage(body);
    throw new Error(
      detail
        ? `${resourceLabel}: ${detail} (HTTP ${response.status}).`
        : `${resourceLabel} request failed (HTTP ${response.status}).`,
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error(`${resourceLabel} returned an invalid response.`);
  }

  return body as AdminJsonObject;
}
