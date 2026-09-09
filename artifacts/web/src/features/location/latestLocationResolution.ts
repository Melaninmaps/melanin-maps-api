export interface LatestLocationResolutionGate {
  begin(): number;
  invalidate(): void;
  isCurrent(requestId: number): boolean;
}

export function createLatestLocationResolutionGate(): LatestLocationResolutionGate {
  let version = 0;
  return {
    begin() {
      version += 1;
      return version;
    },
    invalidate() {
      version += 1;
    },
    isCurrent(requestId) {
      return requestId === version;
    },
  };
}
