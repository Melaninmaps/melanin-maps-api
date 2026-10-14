/**
 * The map must open with a concrete, useful local view when neither browser
 * location nor a saved home area is available. GPS and the saved-home fallback
 * can still replace this viewport immediately after initialization.
 */
export const DEFAULT_MAP_VIEWPORT = {
  center: { lat: 39.9526, lng: -75.1652 },
  zoom: 12,
} as const;
