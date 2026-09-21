export function buildReducedSupportLensUpdate(
  savedDesignations: readonly string[],
  removeDesignation: string,
) {
  const preferredOwnershipTypes = savedDesignations.filter((value) => value !== removeDesignation);
  return {
    preferredOwnershipTypes,
    ownershipTypes: preferredOwnershipTypes,
    supportLensMode: preferredOwnershipTypes.length
      ? "strict_documented_designations" as const
      : "all_businesses" as const,
  };
}

export async function persistReducedSupportLensRemoval(input: {
  baseUrl: string;
  savedDesignations: readonly string[];
  removeDesignation: string;
  fetchImpl?: typeof fetch;
}): Promise<{ update: ReturnType<typeof buildReducedSupportLensUpdate>; error?: string }> {
  const update = buildReducedSupportLensUpdate(input.savedDesignations, input.removeDesignation);
  try {
    const response = await (input.fetchImpl ?? fetch)(`${input.baseUrl}api/kinfolk/preferences`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!response.ok) return { update, error: "Could not update Support Lens. Please try again." };
    return { update };
  } catch {
    return { update, error: "Could not update Support Lens. Please try again." };
  }
}