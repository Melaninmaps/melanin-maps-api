import type { LocationFirstResponse } from "@/shared/discoveryContracts";

function isLocationFirstResponse(value: unknown): value is LocationFirstResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocationFirstResponse>;
  return Array.isArray(candidate.records)
    && typeof candidate.requiresLocation === "boolean"
    && (candidate.coverageGap === null || typeof candidate.coverageGap === "object")
    && Array.isArray(candidate.suggestedActions);
}

export async function readBusinessDirectoryResponse(response: Response): Promise<LocationFirstResponse> {
  const payload = await response.json().catch(() => null) as unknown;

  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload
      ? String((payload as { error?: unknown }).error || "Business search is unavailable right now.")
      : "Business search is unavailable right now.";
    throw new Error(message);
  }

  if (!isLocationFirstResponse(payload)) {
    throw new Error("Business search returned an incomplete response. Please try again.");
  }

  return payload;
}
