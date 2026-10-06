import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Headphones,
  Lock,
  MessageCircle,
  Settings2,
  UserRound,
} from "lucide-react";
import { KinfolkMemoryManager } from "./KinfolkMemoryManager";

const BASE = import.meta.env.BASE_URL;

type ConversationMode =
  | "community"
  | "best_friend"
  | "business_manager"
  | "professor";
type SpeakerChoice = "standard" | "female";
type PreferredNameState = "active" | "paused" | "not_saved";

type KinfolkPreferences = {
  personalityMode: ConversationMode;
  kinfolkVoice: string;
};

type PreferredName = {
  name: string | null;
  state: PreferredNameState;
};

const CONVERSATION_MODES: Array<{
  id: ConversationMode;
  label: string;
  description: string;
}> = [
  {
    id: "community",
    label: "Big Cousin",
    description: "Warm, grounded, practical",
  },
  {
    id: "best_friend",
    label: "Best Friend",
    description: "Encouraging, candid, celebratory",
  },
  {
    id: "business_manager",
    label: "Business Manager",
    description: "Direct, organized, action-oriented",
  },
  {
    id: "professor",
    label: "Professor",
    description: "Clear, educational, evidence-aware",
  },
];

function normalizeMode(value: unknown): ConversationMode {
  return CONVERSATION_MODES.some((mode) => mode.id === value)
    ? (value as ConversationMode)
    : "community";
}

function speakerFromStoredVoice(value: unknown): SpeakerChoice {
  return value === "nova" || value === "shimmer" ? "female" : "standard";
}

export function KinfolkExperienceSettings() {
  const [preferences, setPreferences] = useState<KinfolkPreferences>({
    personalityMode: "community",
    kinfolkVoice: "onyx",
  });
  const [preferredName, setPreferredName] = useState<PreferredName>({
    name: null,
    state: "not_saved",
  });
  const [preferredNameDraft, setPreferredNameDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMemoryManager, setShowMemoryManager] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [preferenceResponse, preferredNameResponse] = await Promise.all([
        fetch(`${BASE}api/kinfolk/preferences`, { credentials: "include" }),
        fetch(`${BASE}api/kinfolk/preferred-name`, { credentials: "include" }),
      ]);
      if (!preferenceResponse.ok)
        throw new Error("Kinfolk settings could not be loaded.");
      const preferencePayload = (await preferenceResponse.json()) as {
        preferences?: Partial<KinfolkPreferences>;
      };
      const rawPreferences = preferencePayload.preferences ?? {};
      setPreferences({
        personalityMode: normalizeMode(rawPreferences.personalityMode),
        kinfolkVoice:
          typeof rawPreferences.kinfolkVoice === "string"
            ? rawPreferences.kinfolkVoice
            : "onyx",
      });
      if (preferredNameResponse.ok) {
        const namePayload =
          (await preferredNameResponse.json()) as Partial<PreferredName>;
        const name =
          typeof namePayload.name === "string" ? namePayload.name : null;
        const state =
          namePayload.state === "active" || namePayload.state === "paused"
            ? namePayload.state
            : "not_saved";
        setPreferredName({ name, state });
        setPreferredNameDraft(name ?? "");
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Kinfolk settings could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePreferences = async (patch: Partial<KinfolkPreferences>) => {
    const previous = preferences;
    const next = { ...previous, ...patch };
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
        preferences?: Partial<KinfolkPreferences>;
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          payload.error ?? "Kinfolk settings could not be saved.",
        );
      const saved = payload.preferences ?? {};
      setPreferences((current) => ({
        personalityMode: normalizeMode(
          saved.personalityMode ?? current.personalityMode,
        ),
        kinfolkVoice:
          typeof saved.kinfolkVoice === "string"
            ? saved.kinfolkVoice
            : current.kinfolkVoice,
      }));
    } catch (cause) {
      setPreferences(previous);
      setError(
        cause instanceof Error
          ? cause.message
          : "Kinfolk settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const savePreferredName = async () => {
    const name = preferredNameDraft.trim();
    if (!name || savingName) return;
    setSavingName(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/preferred-name`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, consent: true }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        name?: string;
        state?: PreferredNameState;
        error?: string;
      };
      if (!response.ok || !payload.name)
        throw new Error(
          payload.error ?? "Your preferred name could not be saved.",
        );
      setPreferredName({ name: payload.name, state: "active" });
      setPreferredNameDraft(payload.name);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your preferred name could not be saved.",
      );
    } finally {
      setSavingName(false);
    }
  };

  const setPreferredNamePause = async (paused: boolean) => {
    if (!preferredName.name || savingName) return;
    setSavingName(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/kinfolk/preferred-name/pause`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        name?: string;
        state?: PreferredNameState;
        error?: string;
      };
      if (
        !response.ok ||
        !payload.name ||
        (payload.state !== "active" && payload.state !== "paused")
      )
        throw new Error(
          payload.error ?? "Your preferred name could not be updated.",
        );
      setPreferredName({ name: payload.name, state: payload.state });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your preferred name could not be updated.",
      );
    } finally {
      setSavingName(false);
    }
  };

  const removePreferredName = async (action: "revoke" | "delete") => {
    if (!preferredName.name || savingName) return;
    setSavingName(true);
    setError(null);
    try {
      const response = await fetch(
        `${BASE}api/kinfolk/preferred-name${action === "revoke" ? "/revoke" : ""}`,
        {
          method: action === "revoke" ? "POST" : "DELETE",
          credentials: "include",
        },
      );
      if (!response.ok)
        throw new Error(
          action === "revoke"
            ? "Your preferred name could not be revoked."
            : "Your preferred name could not be deleted.",
        );
      setPreferredName({ name: null, state: "not_saved" });
      setPreferredNameDraft("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your preferred name could not be updated.",
      );
    } finally {
      setSavingName(false);
    }
  };

  const speaker = speakerFromStoredVoice(preferences.kinfolkVoice);

  return (
    <section
      data-testid="kinfolk-experience-settings"
      className="rounded-3xl border border-[#3A1F0E]/10 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#CA922B]/10">
          <Settings2 className="h-5 w-5 text-[#CA922B]" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-[#2B1507]">
            Kinfolk Settings
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#3A1F0E]/60">
            Your single home for how Kinfolk communicates, speaks, and uses the
            memories you explicitly control. Mode changes style only; it never
            changes facts, sources, safety behavior, current-information
            requirements, or recommendation rules.
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {loading ? (
        <p className="mt-5 text-sm text-[#3A1F0E]/50">
          Loading your Kinfolk settings…
        </p>
      ) : (
        <div className="mt-6 space-y-7">
          <section>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#CA922B]" />
              <h4 className="text-sm font-bold text-[#2B1507]">
                Conversation Mode
              </h4>
            </div>
            <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
              Applies to the next answer right away. It changes communication
              style, not the information Kinfolk can use.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {CONVERSATION_MODES.map((mode) => {
                const selected = preferences.personalityMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void savePreferences({ personalityMode: mode.id })
                    }
                    aria-pressed={selected}
                    data-testid={`kinfolk-settings-mode-${mode.id}`}
                    className={`rounded-2xl border p-3 text-left transition-colors disabled:opacity-55 ${selected ? "border-[#CA922B] bg-[#FFF8EC]" : "border-[#3A1F0E]/10 hover:border-[#CA922B]/45"}`}
                  >
                    <span className="flex items-center justify-between gap-3 text-sm font-bold text-[#2B1507]">
                      {mode.label}
                      {selected && <Check className="h-4 w-4 text-[#CA922B]" />}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#3A1F0E]/55">
                      {mode.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="border-t border-[#3A1F0E]/8 pt-6">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-[#CA922B]" />
              <h4 className="text-sm font-bold text-[#2B1507]">Voice</h4>
            </div>
            <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
              Voice changes audio delivery only. The same voice works with every
              Conversation Mode.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void savePreferences({ kinfolkVoice: "onyx" })}
                aria-pressed={speaker === "standard"}
                data-testid="kinfolk-settings-voice-standard"
                className={`rounded-2xl border p-3 text-left transition-colors disabled:opacity-55 ${speaker === "standard" ? "border-[#CA922B] bg-[#FFF8EC]" : "border-[#3A1F0E]/10 hover:border-[#CA922B]/45"}`}
              >
                <span className="flex items-center justify-between gap-3 text-sm font-bold text-[#2B1507]">
                  Standard Kinfolk Voice
                  {speaker === "standard" && (
                    <Check className="h-4 w-4 text-[#CA922B]" />
                  )}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#3A1F0E]/55">
                  The familiar Kinfolk speaker.
                </span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void savePreferences({ kinfolkVoice: "nova" })}
                aria-pressed={speaker === "female"}
                data-testid="kinfolk-settings-voice-female"
                className={`rounded-2xl border p-3 text-left transition-colors disabled:opacity-55 ${speaker === "female" ? "border-[#CA922B] bg-[#FFF8EC]" : "border-[#3A1F0E]/10 hover:border-[#CA922B]/45"}`}
              >
                <span className="flex items-center justify-between gap-3 text-sm font-bold text-[#2B1507]">
                  Female Voice
                  {speaker === "female" && (
                    <Check className="h-4 w-4 text-[#CA922B]" />
                  )}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#3A1F0E]/55">
                  A female-presenting Kinfolk speaker for audio replies.
                </span>
              </button>
            </div>
          </section>

          <section className="border-t border-[#3A1F0E]/8 pt-6">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#CA922B]" />
              <h4 className="text-sm font-bold text-[#2B1507]">
                Saved Memories
              </h4>
            </div>
            <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
              Kinfolk never silently saves ordinary chat. Review every private
              item, pause its use, or delete it whenever you choose.
            </p>
            <div className="mt-3 rounded-2xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-4">
              <div className="flex gap-3">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#CA922B]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#2B1507]">
                    What should Kinfolk call you?
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/55">
                    Separate from your account name. Kinfolk uses a preferred
                    name only after you save it here.
                  </p>
                  <input
                    value={preferredNameDraft}
                    onChange={(event) =>
                      setPreferredNameDraft(event.target.value)
                    }
                    maxLength={60}
                    disabled={savingName}
                    placeholder="For example, J Money"
                    aria-label="Preferred name for Kinfolk"
                    className="mt-3 w-full rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm text-[#2B1507] outline-none focus:border-[#CA922B]/60 disabled:opacity-55"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={savingName || !preferredNameDraft.trim()}
                      onClick={() => void savePreferredName()}
                      className="rounded-lg bg-[#2B1507] px-3 py-2 text-xs font-bold text-white disabled:opacity-55"
                    >
                      {savingName
                        ? "Saving…"
                        : preferredName.name
                          ? "Update name"
                          : "Save name"}
                    </button>
                    {preferredName.name && (
                      <>
                        <button
                          type="button"
                          disabled={savingName}
                          onClick={() =>
                            void setPreferredNamePause(
                              preferredName.state !== "paused",
                            )
                          }
                          className="text-xs font-bold text-[#8D5C17] disabled:opacity-55"
                        >
                          {preferredName.state === "paused"
                            ? "Resume"
                            : "Pause"}
                        </button>
                        <button
                          type="button"
                          disabled={savingName}
                          onClick={() => void removePreferredName("revoke")}
                          className="text-xs font-bold text-red-700 disabled:opacity-55"
                        >
                          Revoke use
                        </button>
                        <button
                          type="button"
                          disabled={savingName}
                          onClick={() => void removePreferredName("delete")}
                          className="text-xs font-bold text-red-700 disabled:opacity-55"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                  {preferredName.name && (
                    <p className="mt-3 text-xs leading-5 text-[#3A1F0E]/55">
                      Saved: <strong>{preferredName.name}</strong>
                      {preferredName.state === "paused"
                        ? " — paused; Kinfolk will not use it until you resume."
                        : " — active only for relevant conversations."}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowMemoryManager(true)}
              data-testid="kinfolk-settings-manage-memories"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#CA922B]/35 bg-white px-3 py-2 text-xs font-bold text-[#8D5C17] hover:bg-[#FFF8EC]"
            >
              <Lock className="h-3.5 w-3.5" />
              Review saved memories
            </button>
          </section>
        </div>
      )}
      {showMemoryManager && (
        <KinfolkMemoryManager onClose={() => setShowMemoryManager(false)} />
      )}
    </section>
  );
}
