import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { type ResolvedArea, useLocationResolver } from "./useLocationResolver";
import { createLatestLocationResolutionGate } from "./latestLocationResolution";

export type SafetyLocationSource = "manual_area" | "selected_place";

interface SafetyLocationPickerProps {
  label: string;
  helpText: string;
  value: ResolvedArea | null;
  onResolved(area: ResolvedArea, source: SafetyLocationSource): void;
  onCleared(): void;
  required?: boolean;
}

export function SafetyLocationPicker({
  label,
  helpText,
  value,
  onResolved,
  onCleared,
  required = true,
}: SafetyLocationPickerProps) {
  const [areaText, setAreaText] = useState(value?.label ?? "");
  const internalClear = useRef(false);
  const resolutionGate = useRef(createLatestLocationResolutionGate());
  const { state, error, resolveAreaText } = useLocationResolver();
  const isBusy = state === "locating" || state === "resolving";

  useEffect(() => {
    if (value?.label) {
      setAreaText(value.label);
      internalClear.current = false;
    } else if (internalClear.current) {
      internalClear.current = false;
    } else {
      setAreaText("");
    }
  }, [value?.label]);

  async function resolveTypedArea() {
    const requestId = resolutionGate.current.begin();
    const area = await resolveAreaText(areaText);
    if (!area || !resolutionGate.current.isCurrent(requestId)) return;
    setAreaText(area.label);
    onResolved(area, "selected_place");
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-[#3A1F0E]">
          <MapPin className="h-4 w-4 text-[#8D5C17]" aria-hidden="true" />
          {label}{required ? " *" : ""}
        </label>
        <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/60">{helpText}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          aria-label={label}
          autoComplete="postal-code"
          className="h-11 min-w-0 rounded-xl border border-[#3A1F0E]/20 bg-white px-3 text-sm text-[#3A1F0E] outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/20"
          onChange={(event) => {
            setAreaText(event.target.value);
            resolutionGate.current.invalidate();
            if (value) {
              internalClear.current = true;
              onCleared();
            }
          }}
          placeholder="City or general neighborhood"
          type="search"
          value={areaText}
        />
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#3A1F0E]/20 bg-white px-4 text-sm font-bold text-[#3A1F0E] hover:border-[#CA922B]/60 disabled:opacity-60"
          disabled={isBusy || !areaText.trim()}
          onClick={() => void resolveTypedArea()}
          type="button"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {state === "resolving" ? "Finding…" : "Use this area"}
        </button>
      </div>
      <div aria-live="polite" className="min-h-5 text-xs">
        {error ? (
          <p className="text-red-700">{error}</p>
        ) : value ? (
          <p className="font-medium text-green-800">Location selected: {value.label}</p>
        ) : (
          <p className="text-[#3A1F0E]/50">Use only a city or general neighborhood. Device, street-address, and ZIP location collection is disabled.</p>
        )}
      </div>
    </div>
  );
}
