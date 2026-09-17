import { Globe2, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type PreferencesResponse = {
  preferences?: {
    communities?: string[] | null;
    cultures?: string[] | null;
    preferredLanguages?: string[] | null;
  };
  error?: string;
};

type ContextState = {
  communities: string;
  cultures: string;
  preferredLanguages: string;
};

const EMPTY_CONTEXT: ContextState = {
  communities: "",
  cultures: "",
  preferredLanguages: "",
};

function values(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.normalize("NFKC").trim())
        .filter((item) => item.length >= 2 && item.length <= 100),
    ),
  ].slice(0, 25);
}

export function MemberContextPreferences() {
  const [context, setContext] = useState<ContextState>(EMPTY_CONTEXT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authenticatedFetch(`${BASE}api/kinfolk/preferences`)
      .then(async (response) => {
        const body = (await response.json()) as PreferencesResponse;
        if (!response.ok)
          throw new Error(
            body.error ?? "Could not load your Kinfolk preferences.",
          );
        if (active) {
          setContext({
            communities: (body.preferences?.communities ?? []).join(", "),
            cultures: (body.preferences?.cultures ?? []).join(", "),
            preferredLanguages: (
              body.preferences?.preferredLanguages ?? []
            ).join(", "),
          });
        }
      })
      .catch((error: unknown) => {
        if (active)
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not load your Kinfolk preferences.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function update(field: keyof ContextState, value: string) {
    setMessage(null);
    setContext((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/kinfolk/preferences`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            communities: values(context.communities),
            cultures: values(context.cultures),
            preferredLanguages: values(context.preferredLanguages),
          }),
        },
      );
      const body = (await response.json()) as PreferencesResponse;
      if (!response.ok)
        throw new Error(
          body.error ?? "Could not save your Kinfolk preferences.",
        );
      setMessage(
        "Saved. KinfolkAI and the Library will use this context to prioritize relevant results; it will never quietly hide other useful options.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save your Kinfolk preferences.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CA922B]/12">
          <Sparkles className="h-5 w-5 text-[#CA922B]" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">
            Help Kinfolk understand what matters to you
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#3A1F0E]/65">
            This is optional and private. Tell KinfolkAI and the Library which
            communities, cultures, or languages you want reflected. You may use
            your own words, update it anytime, or leave it empty.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-[#3A1F0E]/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading preferences…
        </div>
      ) : (
        <div className="space-y-4">
          <ContextInput
            id="member-communities"
            label="Communities (optional)"
            help="Example: Black woman, foundationally Black American, military family, disabled parent"
            value={context.communities}
            onChange={(value) => update("communities", value)}
          />
          <ContextInput
            id="member-cultures"
            label="Cultures or traditions (optional)"
            help="Example: Haitian, Dominican, Gullah Geechee, Caribbean"
            value={context.cultures}
            onChange={(value) => update("cultures", value)}
          />
          <ContextInput
            id="member-languages"
            label="Languages (optional)"
            help="Example: English, Spanish, Haitian Creole, ASL"
            value={context.preferredLanguages}
            onChange={(value) => update("preferredLanguages", value)}
          />
          <div className="rounded-xl border border-[#CA922B]/20 bg-[#CA922B]/[0.06] p-3 text-xs leading-5 text-[#3A1F0E]/70">
            <Globe2 className="mr-1 inline h-4 w-4 text-[#CA922B]" />
            Kinfolk uses the information you choose to provide to rank relevant
            businesses, sources, and cultural context. It never infers identity,
            makes health assumptions, or filters out care, safety, or resource
            results without an explicit request.
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setContext(EMPTY_CONTEXT)}
              className="min-h-10 rounded-full border border-[#3A1F0E]/20 bg-white px-4 text-sm font-bold text-[#2B1507]"
            >
              Clear preferences
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2B1507] px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save Kinfolk context"}
            </button>
          </div>
        </div>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm font-medium text-[#6A3B1E]">
          {message}
        </p>
      )}
    </section>
  );
}

function ContextInput({
  id,
  label,
  help,
  value,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-sm font-bold text-[#2B1507]">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-[#3A1F0E]/55">
        {help}
      </span>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Separate entries with commas"
        className="mt-2 w-full rounded-xl border border-[#3A1F0E]/20 bg-white px-3 py-2.5 text-sm text-[#2B1507] placeholder:text-[#3A1F0E]/45 focus:border-[#CA922B] focus:outline-none focus:ring-2 focus:ring-[#CA922B]/20"
      />
    </label>
  );
}
