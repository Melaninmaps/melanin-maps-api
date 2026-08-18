import { type FormEvent, useState } from "react";
import { type ResolvedArea, useLocationResolver } from "./useLocationResolver";

type Props = {
  queryLabel: string;
  queryPlaceholder: string;
  areaPlaceholder?: string;
  initialQuery?: string;
  initialAreaLabel?: string;
  showQuery?: boolean;
  submitLabel: string;
  onResolved(input: { query: string; area: ResolvedArea }): void;
};

export function LocationSearchBar({
  queryLabel,
  queryPlaceholder,
  areaPlaceholder = "City, neighborhood, or ZIP",
  initialQuery = "",
  initialAreaLabel = "",
  showQuery = true,
  submitLabel,
  onResolved,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [areaText, setAreaText] = useState(initialAreaLabel);
  const { state, error, resolveAreaText, useBrowserLocation } = useLocationResolver();
  const isBusy = state === "locating" || state === "resolving";

  async function submitArea(event: FormEvent) {
    event.preventDefault();
    const area = await resolveAreaText(areaText);
    if (area) {
      setAreaText(area.label);
      onResolved({ query: query.trim(), area });
    }
  }

  async function useMyLocation() {
    const area = await useBrowserLocation();
    if (area) {
      setAreaText(area.label);
      onResolved({ query: query.trim(), area });
    }
  }

  return (
    <form
      aria-label="Location-aware search"
      className="mwm-location-search"
      onSubmit={submitArea}
    >
      {showQuery ? (
        <label className="mwm-location-field mwm-location-field--query">
          <span className="sr-only">{queryLabel}</span>
          <input
            aria-label={queryLabel}
            autoComplete="off"
            className="mwm-readable-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={queryPlaceholder}
            type="search"
            value={query}
          />
        </label>
      ) : null}

      <label className="mwm-location-field mwm-location-field--area">
        <span className="sr-only">Search area</span>
        <input
          aria-label="Search area"
          autoComplete="postal-code"
          className="mwm-readable-input"
          onChange={(event) => setAreaText(event.target.value)}
          placeholder={areaPlaceholder}
          type="search"
          value={areaText}
        />
      </label>

      <button className="mwm-location-submit" disabled={isBusy} type="submit">
        {state === "resolving" ? "Finding area…" : submitLabel}
      </button>

      <button
        className="mwm-location-current"
        disabled={isBusy}
        onClick={useMyLocation}
        type="button"
      >
        {state === "locating" ? "Finding location…" : "Use my location"}
      </button>

      <div aria-live="polite" className="mwm-location-status">
        {error ? (
          <p className="mwm-location-error">{error}</p>
        ) : state === "ready" && areaText ? (
          <p className="mwm-location-success">Showing results for {areaText}.</p>
        ) : null}
      </div>
    </form>
  );
}
