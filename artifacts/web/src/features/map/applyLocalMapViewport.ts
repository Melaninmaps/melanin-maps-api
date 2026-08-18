/**
 * applyLocalMapViewport — applies search result pins and fits the map viewport
 * to the member's area plus the returned local pins only.
 *
 * The map adapter separates local search pins from global discovery pins so
 * a Charlotte bookstore search never renders a Philadelphia pin. The adapter
 * is implemented by the host page using the live Google Maps instance.
 *
 * Usage in the host page:
 *   <LocalBusinessResults
 *     query={query}
 *     area={selectedArea}
 *     onPinsChange={(pins, area) => applyLocalMapViewport(mapAdapter, area, pins)}
 *   />
 *
 * After this function runs, do NOT call fitBounds on global discoverability pins —
 * the local search viewport owns the canvas until the search is cleared.
 */

type Coordinate = { latitude: number; longitude: number };
type NearbyPin = Coordinate & { id: string };

export type MapViewportAdapter = {
  /** Removes all pins that were added by a previous local search. */
  clearSearchPins(): void;
  /** Adds one pin per result. Each must carry data-testid="local-search-pin". */
  renderSearchPins(pins: NearbyPin[]): void;
  setView(center: [number, number], zoom: number): void;
  fitBounds(
    bounds: [[number, number], [number, number]],
    options: { padding: [number, number]; maxZoom: number },
  ): void;
};

export function applyLocalMapViewport(
  map: MapViewportAdapter,
  area: Coordinate,
  pins: NearbyPin[],
) {
  // Local search results own a distinct pin layer. Never reuse the global discovery layer.
  map.clearSearchPins();
  map.renderSearchPins(pins);

  if (pins.length === 0) {
    map.setView([area.latitude, area.longitude], 12);
    return;
  }

  const coordinates = [{ latitude: area.latitude, longitude: area.longitude }, ...pins];
  const latitudes = coordinates.map((point) => point.latitude);
  const longitudes = coordinates.map((point) => point.longitude);

  map.fitBounds(
    [
      [Math.min(...latitudes), Math.min(...longitudes)],
      [Math.max(...latitudes), Math.max(...longitudes)],
    ],
    { padding: [72, 72], maxZoom: 14 },
  );
}
