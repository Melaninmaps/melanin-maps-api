import { useCallback, useEffect, useState } from "react";
import { Check, Globe2, Mic2, Trash2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type Preferences = {
  preferredConversationLanguage: "en" | "es";
  regionalSpeechComprehension: string;
  regionalSpeakingStyle: "standard" | "member_selected";
  pronunciationAssistance: boolean;
  languageDetectionMode: "off" | "ask" | "automatic";
  codeSwitchingMode: "manual" | "ask" | "automatic";
};

type Correction = {
  id: string;
  writtenForm: string;
  pronunciationGuidance: string;
  status: "active" | "paused";
};

const DEFAULTS: Preferences = {
  preferredConversationLanguage: "en",
  regionalSpeechComprehension: "off",
  regionalSpeakingStyle: "standard",
  pronunciationAssistance: false,
  languageDetectionMode: "off",
  codeSwitchingMode: "manual",
};

const REGIONAL_COMPREHENSION = [
  ["off", "Off"],
  ["follow_destination", "Follow a selected destination"],
  ["philadelphia", "Philadelphia"],
  ["memphis", "Memphis"],
  ["new_orleans", "New Orleans"],
  ["atlanta", "Atlanta"],
] as const;

function normalizePreferences(value: unknown): Preferences {
  const source = (value ?? {}) as Partial<Preferences>;
  return {
    preferredConversationLanguage:
      source.preferredConversationLanguage === "es" ? "es" : "en",
    regionalSpeechComprehension:
      typeof source.regionalSpeechComprehension === "string"
        ? source.regionalSpeechComprehension
        : "off",
    regionalSpeakingStyle:
      source.regionalSpeakingStyle === "member_selected"
        ? "member_selected"
        : "standard",
    pronunciationAssistance: source.pronunciationAssistance === true,
    languageDetectionMode:
      source.languageDetectionMode === "ask" ||
      source.languageDetectionMode === "automatic"
        ? source.languageDetectionMode
        : "off",
    codeSwitchingMode:
      source.codeSwitchingMode === "ask" ||
      source.codeSwitchingMode === "automatic"
        ? source.codeSwitchingMode
        : "manual",
  };
}

export function KinfolkRegionalLanguageSettings() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [writtenForm, setWrittenForm] = useState("");
  const [pronunciationGuidance, setPronunciationGuidance] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [preferencesResponse, correctionsResponse] = await Promise.all([
        fetch(`${BASE}api/kinfolk/preferences`, { credentials: "include" }),
        fetch(`${BASE}api/kinfolk/language/corrections`, {
          credentials: "include",
        }),
      ]);
      if (preferencesResponse.ok) {
        const payload = (await preferencesResponse.json()) as {
          preferences?: unknown;
        };
        setPreferences(normalizePreferences(payload.preferences));
      }
      if (correctionsResponse.ok) {
        const payload = (await correctionsResponse.json()) as {
          corrections?: Correction[];
        };
        setCorrections(
          Array.isArray(payload.corrections) ? payload.corrections : [],
        );
      }
    } catch {
      setError("Language settings could not be loaded.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePreferences = async (patch: Partial<Preferences>) => {
    const prior = preferences;
    const next = { ...prior, ...patch };
    setPreferences(next);
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/preferences`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        preferences?: unknown;
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          payload.error ?? "Language settings could not be saved.",
        );
      setPreferences(normalizePreferences(payload.preferences ?? next));
    } catch (cause) {
      setPreferences(prior);
      setError(
        cause instanceof Error
          ? cause.message
          : "Language settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const addCorrection = async () => {
    if (!writtenForm.trim() || !pronunciationGuidance.trim() || !consent)
      return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/language/corrections`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          writtenForm: writtenForm.trim(),
          pronunciationGuidance: pronunciationGuidance.trim(),
          consent: true,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        correction?: Correction;
        error?: string;
      };
      if (!response.ok || !payload.correction)
        throw new Error(payload.error ?? "Correction could not be saved.");
      setCorrections((current) => [payload.correction!, ...current]);
      setWrittenForm("");
      setPronunciationGuidance("");
      setConsent(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Correction could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateCorrection = async (
    correction: Correction,
    status: "active" | "paused",
  ) => {
    const response = await fetch(
      `${BASE}api/kinfolk/language/corrections/${correction.id}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    if (!response.ok) return void setError("Correction could not be updated.");
    setCorrections((current) =>
      current.map((item) =>
        item.id === correction.id ? { ...item, status } : item,
      ),
    );
  };

  const removeCorrection = async (id: string) => {
    const response = await fetch(
      `${BASE}api/kinfolk/language/corrections/${id}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
    if (!response.ok) return void setError("Correction could not be deleted.");
    setCorrections((current) => current.filter((item) => item.id !== id));
  };

  return (
    <section
      data-testid="kinfolk-regional-language-settings"
      className="border-t border-[#3A1F0E]/8 pt-6"
    >
      <div className="flex items-center gap-2">
        <Globe2 className="h-4 w-4 text-[#CA922B]" />
        <h4 className="text-sm font-bold text-[#2B1507]">
          Language & place names
        </h4>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
        These are explicit controls. Kinfolk does not infer your language,
        region, identity, or pronunciation from ordinary chat.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(["en", "es"] as const).map((language) => (
          <button
            key={language}
            type="button"
            disabled={saving}
            onClick={() =>
              void savePreferences({ preferredConversationLanguage: language })
            }
            aria-pressed={
              preferences.preferredConversationLanguage === language
            }
            className={`rounded-xl border p-3 text-left text-sm font-bold disabled:opacity-55 ${preferences.preferredConversationLanguage === language ? "border-[#CA922B] bg-[#FFF8EC]" : "border-[#3A1F0E]/10"}`}
          >
            <span className="flex items-center justify-between">
              {language === "en" ? "English" : "Español"}
              {preferences.preferredConversationLanguage === language && (
                <Check className="h-4 w-4 text-[#CA922B]" />
              )}
            </span>
          </button>
        ))}
      </div>

      <label
        className="mt-4 block text-xs font-bold text-[#2B1507]"
        htmlFor="regional-comprehension"
      >
        Regional speech comprehension
      </label>
      <select
        id="regional-comprehension"
        value={preferences.regionalSpeechComprehension}
        disabled={saving}
        onChange={(event) =>
          void savePreferences({
            regionalSpeechComprehension: event.target.value,
          })
        }
        className="mt-2 w-full rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm text-[#2B1507]"
      >
        {REGIONAL_COMPREHENSION.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div className="mt-4 space-y-3 rounded-2xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-4 text-xs text-[#3A1F0E]/65">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={preferences.regionalSpeakingStyle === "member_selected"}
            disabled={saving}
            onChange={(event) =>
              void savePreferences({
                regionalSpeakingStyle: event.target.checked
                  ? "member_selected"
                  : "standard",
              })
            }
          />
          <span>
            <strong className="text-[#2B1507]">
              Optional regional speaking style
            </strong>
            <br />
            Comprehension is separate. This never creates an accent, caricature,
            or identity assumption.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={preferences.pronunciationAssistance}
            disabled={saving}
            onChange={(event) =>
              void savePreferences({
                pronunciationAssistance: event.target.checked,
              })
            }
          />
          <span>
            <strong className="text-[#2B1507]">
              Use reviewed place-name pronunciation help
            </strong>
            <br />
            Only approved source-backed references may be sent as bounded voice
            guidance.
          </span>
        </label>
      </div>

      <details className="mt-4 rounded-xl border border-[#3A1F0E]/10 p-3 text-xs text-[#3A1F0E]/65">
        <summary className="cursor-pointer font-bold text-[#2B1507]">
          Future language detection and code-switching preferences
        </summary>
        <p className="mt-2">
          These choices are stored for future controlled releases. They do not
          activate automatic detection, switching, or translation today.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label>
            Detection
            <select
              value={preferences.languageDetectionMode}
              disabled={saving}
              onChange={(event) =>
                void savePreferences({
                  languageDetectionMode: event.target
                    .value as Preferences["languageDetectionMode"],
                })
              }
              className="mt-1 block w-full rounded-lg border p-2"
            >
              <option value="off">Off</option>
              <option value="ask">Ask first</option>
              <option value="automatic">Future automatic</option>
            </select>
          </label>
          <label>
            Code switching
            <select
              value={preferences.codeSwitchingMode}
              disabled={saving}
              onChange={(event) =>
                void savePreferences({
                  codeSwitchingMode: event.target
                    .value as Preferences["codeSwitchingMode"],
                })
              }
              className="mt-1 block w-full rounded-lg border p-2"
            >
              <option value="manual">Manual</option>
              <option value="ask">Ask first</option>
              <option value="automatic">Future automatic</option>
            </select>
          </label>
        </div>
      </details>

      <div className="mt-5 rounded-2xl border border-[#3A1F0E]/10 bg-white p-4">
        <div className="flex items-center gap-2">
          <Mic2 className="h-4 w-4 text-[#CA922B]" />
          <h5 className="text-sm font-bold text-[#2B1507]">
            Private pronunciation corrections
          </h5>
        </div>
        <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
          Corrections are private to your Kinfolk experience. They are never
          promoted into community language rules automatically.
        </p>
        <input
          value={writtenForm}
          maxLength={200}
          onChange={(event) => setWrittenForm(event.target.value)}
          placeholder="Written name, business, or place"
          className="mt-3 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm"
        />
        <input
          value={pronunciationGuidance}
          maxLength={500}
          onChange={(event) => setPronunciationGuidance(event.target.value)}
          placeholder="How Kinfolk should pronounce it"
          className="mt-2 w-full rounded-xl border border-[#3A1F0E]/15 px-3 py-2 text-sm"
        />
        <label className="mt-3 flex gap-2 text-xs text-[#3A1F0E]/65">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          I agree this private correction may be used only in my Kinfolk
          experience.
        </label>
        <button
          type="button"
          disabled={
            saving ||
            !consent ||
            !writtenForm.trim() ||
            !pronunciationGuidance.trim()
          }
          onClick={() => void addCorrection()}
          className="mt-3 rounded-lg bg-[#2B1507] px-3 py-2 text-xs font-bold text-white disabled:opacity-55"
        >
          Save private correction
        </button>
        <ul className="mt-4 space-y-2">
          {corrections.map((correction) => (
            <li
              key={correction.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF6EF] px-3 py-2 text-xs"
            >
              <span>
                <strong>{correction.writtenForm}</strong> —{" "}
                {correction.pronunciationGuidance}{" "}
                {correction.status === "paused" && "(paused)"}
              </span>
              <span className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void updateCorrection(
                      correction,
                      correction.status === "active" ? "paused" : "active",
                    )
                  }
                  className="font-bold text-[#8D5C17]"
                >
                  {correction.status === "active" ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  onClick={() => void removeCorrection(correction.id)}
                  aria-label={`Delete correction for ${correction.writtenForm}`}
                  className="text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
