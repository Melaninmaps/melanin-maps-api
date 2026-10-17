import { useCallback, useEffect, useState } from "react";
import { Check, Film, Trash2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
const SERVICES = [
  "Netflix",
  "Hulu",
  "Prime Video",
  "Max",
  "Disney+",
  "Apple TV+",
  "Peacock",
  "Paramount+",
];
const COUNTRIES = [
  ["US", "United States"],
  ["CA", "Canada"],
  ["GB", "United Kingdom"],
  ["AU", "Australia"],
] as const;

type EntertainmentPreferences = {
  streamingServices: string[];
  entertainmentCountry: string | null;
  entertainmentCostPolicy: "any" | "included_only";
};
const empty: EntertainmentPreferences = {
  streamingServices: [],
  entertainmentCountry: null,
  entertainmentCostPolicy: "any",
};

function normalize(value: unknown): EntertainmentPreferences {
  const source = (value ?? {}) as Partial<EntertainmentPreferences>;
  return {
    streamingServices: Array.isArray(source.streamingServices)
      ? source.streamingServices.filter(
          (item): item is string =>
            typeof item === "string" && SERVICES.includes(item),
        )
      : [],
    entertainmentCountry:
      typeof source.entertainmentCountry === "string" &&
      /^[A-Z]{2}$/.test(source.entertainmentCountry)
        ? source.entertainmentCountry
        : null,
    entertainmentCostPolicy:
      source.entertainmentCostPolicy === "included_only"
        ? "included_only"
        : "any",
  };
}

export function KinfolkEntertainmentSettings() {
  const [preferences, setPreferences] =
    useState<EntertainmentPreferences>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(
      `${BASE}api/kinfolk/entertainment/preferences`,
      {
        credentials: "include",
      },
    );
    if (!response.ok)
      throw new Error("Entertainment settings could not be loaded.");
    const payload = (await response.json()) as { preferences?: unknown };
    setPreferences(normalize(payload.preferences));
  }, []);

  useEffect(() => {
    void load().catch((cause) =>
      setError(
        cause instanceof Error
          ? cause.message
          : "Entertainment settings could not be loaded.",
      ),
    );
  }, [load]);

  const save = async (next: EntertainmentPreferences) => {
    const previous = preferences;
    setPreferences(next);
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch(
        `${BASE}api/kinfolk/entertainment/preferences`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        preferences?: unknown;
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          payload.error ?? "Entertainment settings could not be saved.",
        );
      setPreferences(normalize(payload.preferences ?? next));
      setStatus(
        "Saved privately. Kinfolk will not check live availability until an approved provider is connected.",
      );
    } catch (cause) {
      setPreferences(previous);
      setError(
        cause instanceof Error
          ? cause.message
          : "Entertainment settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggle = (service: string) => {
    const chosen = preferences.streamingServices.includes(service)
      ? preferences.streamingServices.filter((item) => item !== service)
      : [...preferences.streamingServices, service];
    void save({ ...preferences, streamingServices: chosen });
  };

  return (
    <section
      data-testid="kinfolk-entertainment-settings"
      className="border-t border-[#3A1F0E]/8 pt-6"
    >
      <div className="flex items-center gap-2">
        <Film className="h-4 w-4 text-[#CA922B]" />
        <h4 className="text-sm font-bold text-[#2B1507]">
          Entertainment preferences
        </h4>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
        Choose only services you want Kinfolk to remember. Ordinary chat never
        changes this list. When you explicitly ask a current availability or
        showtime question, Kinfolk may return cited web sources for the title
        and selected location; it will not claim a service, price, theater, or
        ticket result without an approved provider.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="mt-3 text-xs text-[#3A1F0E]/65">{status}</p>
      ) : null}
      <label
        className="mt-4 block text-xs font-bold text-[#2B1507]"
        htmlFor="kinfolk-entertainment-country"
      >
        Availability country
      </label>
      <select
        id="kinfolk-entertainment-country"
        value={preferences.entertainmentCountry ?? ""}
        disabled={saving}
        onChange={(event) =>
          void save({
            ...preferences,
            entertainmentCountry: event.target.value || null,
          })
        }
        className="mt-2 w-full rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm text-[#2B1507]"
      >
        <option value="">
          Choose a country (required for future availability)
        </option>
        {COUNTRIES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <fieldset className="mt-4 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-3">
        <legend className="px-1 text-xs font-bold text-[#2B1507]">
          Cost preference
        </legend>
        <label className="mt-1 flex cursor-pointer items-start gap-2 text-xs leading-5 text-[#3A1F0E]/70">
          <input
            type="checkbox"
            checked={preferences.entertainmentCostPolicy === "included_only"}
            disabled={saving}
            onChange={(event) =>
              void save({
                ...preferences,
                entertainmentCostPolicy: event.target.checked
                  ? "included_only"
                  : "any",
              })
            }
            className="mt-1 accent-[#8D5C17]"
          />
          <span>
            <strong className="text-[#2B1507]">
              Only show options included with my saved services.
            </strong>
            <br />
            When a verified provider is connected, Kinfolk will exclude rentals
            and purchases. No current availability is shown yet.
          </span>
        </label>
      </fieldset>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {SERVICES.map((service) => {
          const selected = preferences.streamingServices.includes(service);
          return (
            <button
              key={service}
              type="button"
              disabled={saving}
              onClick={() => toggle(service)}
              aria-pressed={selected}
              className={`rounded-xl border p-3 text-left text-sm font-bold disabled:opacity-55 ${selected ? "border-[#CA922B] bg-[#FFF8EC]" : "border-[#3A1F0E]/10"}`}
            >
              <span className="flex items-center justify-between">
                {service}
                {selected ? <Check className="h-4 w-4 text-[#CA922B]" /> : null}
              </span>
            </button>
          );
        })}
      </div>
      {preferences.streamingServices.length > 0 ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => void save({ ...preferences, streamingServices: [] })}
          className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-red-700 disabled:opacity-55"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear saved services
        </button>
      ) : null}
    </section>
  );
}
