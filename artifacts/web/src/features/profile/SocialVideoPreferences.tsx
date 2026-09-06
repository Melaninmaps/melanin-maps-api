import { useEffect, useState } from "react";
import { Check, Loader2, PlayCircle } from "lucide-react";
import {
  SOCIAL_VIDEO_PLATFORM_OPTIONS,
  SOCIAL_VIDEO_PLATFORMS,
  type SocialVideoPlatform,
} from "@workspace/constants";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { updateCachedSocialVideoPreferences } from "@/hooks/useSocialVideoPreferences";

const BASE = import.meta.env.BASE_URL;

export function SocialVideoPreferences() {
  const [selected, setSelected] = useState<SocialVideoPlatform[]>([...SOCIAL_VIDEO_PLATFORMS]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authenticatedFetch(`${BASE}api/users/me/content-preferences`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load video preferences.");
        const body = await response.json() as { socialVideoPlatforms?: SocialVideoPlatform[] };
        if (active && Array.isArray(body.socialVideoPlatforms)) setSelected(body.socialVideoPlatforms);
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "Could not load video preferences.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function toggle(platform: SocialVideoPlatform) {
    setMessage(null);
    setSelected((current) => current.includes(platform)
      ? current.filter((item) => item !== platform)
      : [...current, platform]);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(`${BASE}api/users/me/content-preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialVideoPlatforms: selected }),
      });
      const body = await response.json() as { socialVideoPlatforms?: SocialVideoPlatform[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save video preferences.");
      const saved = body.socialVideoPlatforms ?? selected;
      setSelected(saved);
      updateCachedSocialVideoPreferences(saved);
      setMessage(saved.length === 0
        ? "Social-provider videos are hidden. Photos and videos uploaded directly to MWM still appear."
        : "Video platform preferences saved across website and app.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save video preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CA922B]/12">
          <PlayCircle className="h-5 w-5 text-[#CA922B]" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">Videos you want to see</h2>
          <p className="mt-1 text-sm leading-5 text-[#3A1F0E]/65">
            Tell us which platforms you use. MWM will hide social-provider videos from the others while keeping reviews, photos, and directly uploaded videos visible.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-[#3A1F0E]/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading choices…</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {SOCIAL_VIDEO_PLATFORM_OPTIONS.map((option) => {
            const active = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                aria-pressed={active}
                className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-colors ${active
                  ? "border-[#CA922B] bg-[#FFF8E8] text-[#2B1507]"
                  : "border-[#3A1F0E]/15 bg-white text-[#2B1507] hover:border-[#CA922B]/50"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${active ? "border-[#CA922B] bg-[#CA922B] text-white" : "border-[#3A1F0E]/20 bg-white"}`}>
                  {active && <Check className="h-4 w-4" />}
                </span>
                <span>
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-[#3A1F0E]/60">{option.helperText}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-[#3A1F0E]/55">{selected.length} of {SOCIAL_VIDEO_PLATFORMS.length} platforms selected</p>
        <button
          type="button"
          onClick={() => void save()}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2B1507] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save video choices"}
        </button>
      </div>
      {message && <p role="status" className="mt-3 text-sm font-medium text-[#6A3B1E]">{message}</p>}
    </section>
  );
}
