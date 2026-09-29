export type RadiusDiscoveryTrace = Readonly<{
  requestId: string;
  city: string;
  category: string;
  ownershipRequested: boolean;
  radiusMiles: number;
  originKind: "verified_public";
  repositoryMatched: number;
  afterRadius: number;
  afterOwnershipEvidence: number;
  afterServiceEvidence: number;
  actionable: number;
  deduped: number;
  returned: number;
}>;

/**
 * Emits only aggregate count diagnostics for an exact-radius discovery turn.
 * It deliberately has no origin text, address, coordinates, user id, raw query,
 * listing name, or business id fields.
 */
export function logRadiusDiscoveryTrace(trace: RadiusDiscoveryTrace): void {
  console.info("[kinfolk_radius_discovery_trace]", JSON.stringify(trace));
}
