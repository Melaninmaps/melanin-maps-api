export const MAP_PIN_VIEWPORT_DEFAULT_LIMIT = 250;
export const MAP_PIN_VIEWPORT_MAX_LIMIT = 500;

type QueryValue = string | string[] | undefined;

export type MapPinViewport = Readonly<{
  south: number;
  west: number;
  north: number;
  east: number;
  limit: number;
}>;

export type MapPinCursor = Readonly<{
  latitude: string;
  longitude: string;
  id: string;
  scope: string;
}>;

export class MapPinViewportInputError extends Error {
  constructor(public readonly code: "MAP_PIN_VIEWPORT_INVALID" | "MAP_PIN_CURSOR_INVALID") {
    super(code);
  }
}

function single(value: QueryValue): string | null {
  return typeof value === "string" ? value.trim() : null;
}

function coordinate(value: QueryValue, minimum: number, maximum: number): number {
  const raw = single(value);
  if (!raw || !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)) {
    throw new MapPinViewportInputError("MAP_PIN_VIEWPORT_INVALID");
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new MapPinViewportInputError("MAP_PIN_VIEWPORT_INVALID");
  }
  return parsed;
}

function limit(value: QueryValue): number {
  const raw = single(value);
  if (!raw) return MAP_PIN_VIEWPORT_DEFAULT_LIMIT;
  if (!/^\d+$/.test(raw)) throw new MapPinViewportInputError("MAP_PIN_VIEWPORT_INVALID");
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new MapPinViewportInputError("MAP_PIN_VIEWPORT_INVALID");
  }
  return Math.min(parsed, MAP_PIN_VIEWPORT_MAX_LIMIT);
}

export function mapPinViewportFromQuery(query: Record<string, unknown>): MapPinViewport | null {
  const south = query.south as QueryValue;
  const west = query.west as QueryValue;
  const north = query.north as QueryValue;
  const east = query.east as QueryValue;
  const supplied = [south, west, north, east].filter((value) => value !== undefined).length;
  if (supplied === 0) return null;
  if (supplied !== 4) throw new MapPinViewportInputError("MAP_PIN_VIEWPORT_INVALID");

  const parsed = {
    south: coordinate(south, -90, 90),
    west: coordinate(west, -180, 180),
    north: coordinate(north, -90, 90),
    east: coordinate(east, -180, 180),
    limit: limit(query.limit as QueryValue),
  };
  if (parsed.south >= parsed.north) throw new MapPinViewportInputError("MAP_PIN_VIEWPORT_INVALID");
  return parsed;
}

export function mapPinViewportScope(
  viewport: MapPinViewport,
  designationIds: readonly string[],
): string {
  return [
    viewport.south,
    viewport.west,
    viewport.north,
    viewport.east,
    [...designationIds].sort().join(","),
  ].join("|");
}

export function encodeMapPinCursor(cursor: MapPinCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeMapPinCursor(value: unknown, scope: string): MapPinCursor | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 1_000) {
    throw new MapPinViewportInputError("MAP_PIN_CURSOR_INVALID");
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") throw new Error("invalid");
    const candidate = parsed as Partial<MapPinCursor>;
    if (
      typeof candidate.latitude !== "string" ||
      typeof candidate.longitude !== "string" ||
      typeof candidate.id !== "string" ||
      typeof candidate.scope !== "string" ||
      candidate.scope !== scope ||
      !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(candidate.latitude) ||
      !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(candidate.longitude) ||
      !candidate.id.trim()
    ) throw new Error("invalid");
    return {
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      id: candidate.id,
      scope: candidate.scope,
    };
  } catch {
    throw new MapPinViewportInputError("MAP_PIN_CURSOR_INVALID");
  }
}
