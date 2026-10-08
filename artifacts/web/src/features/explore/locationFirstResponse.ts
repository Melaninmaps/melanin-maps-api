import type { LocationFirstResponse } from "@/shared/discoveryContracts";

type HttpResponse = Pick<Response, "ok" | "status">;

function isLocationFirstResponse(value: unknown): value is LocationFirstResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocationFirstResponse>;
  return (
    Array.isArray(candidate.records)
    && typeof candidate.requiresLocation === "boolean"
    && Array.isArray(candidate.suggestedActions)
    && "coverageGap" in candidate
    && "nearestAvailableLocation" in candidate
  );
}

function safeErrorMessage(response: HttpResponse): string {
  if (response.status === 401 || response.status === 403) {
    return "Your Explore session needs to reconnect. Please sign in again.";
  }
  if (response.status >= 500) {
    return "Explore is temporarily unavailable. Please try again.";
  }
  return "Explore could not load this area. Please try again.";
}

/**
 * The Location-First endpoint deliberately returns error envelopes without a
 * `records` field. Keep those envelopes out of the success state so rendering
 * is never asked to treat an API error as a discovery result.
 */
export function readLocationFirstResponse(
  response: HttpResponse,
  payload: unknown,
): LocationFirstResponse {
  if (!response.ok) {
    // Do not surface an upstream/provider error verbatim in the member UI.
    throw new Error(safeErrorMessage(response));
  }
  if (!isLocationFirstResponse(payload)) {
    throw new Error("Explore returned an incomplete response. Please try again.");
  }
  return payload;
}
