import { Eye, EyeOff, ImageIcon, Loader2, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Presentation = {
  coverObjectKey?: string | null;
  coverUrl?: string | null;
  showAge: boolean;
  showBirthday: boolean;
  showLocation: boolean;
  showProfessionalDetails: boolean;
  showBadges: boolean;
};

const EMPTY: Presentation = {
  coverObjectKey: null,
  coverUrl: null,
  showAge: false,
  showBirthday: false,
  showLocation: false,
  showProfessionalDetails: false,
  showBadges: false,
};

const OPTIONS: Array<{ key: keyof Pick<Presentation, "showAge" | "showBirthday" | "showLocation" | "showProfessionalDetails" | "showBadges">; title: string; description: string }> = [
  { key: "showAge", title: "Age", description: "Show your age on your member profile." },
  { key: "showBirthday", title: "Birthday", description: "Show month and day only, never your birth year." },
  { key: "showLocation", title: "City or region", description: "Show the city and state saved on your profile." },
  { key: "showProfessionalDetails", title: "Professional details", description: "Show an optional job title and industry." },
  { key: "showBadges", title: "Earned badges", description: "Show only badges you have actually earned. Progress stays private." },
];

export function ProfilePresentationControls() {
  const [presentation, setPresentation] = useState<Presentation>(EMPTY);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${base}/api/users/me/profile-presentation`, { credentials: "include" });
      if (!response.ok) throw new Error("unavailable");
      const body = await response.json() as { presentation?: Presentation; optionalPersonalDetailsAvailable?: boolean };
      setPresentation({ ...EMPTY, ...(body.presentation ?? {}) });
      setAvailable(body.optionalPersonalDetailsAvailable === true);
    } catch {
      setError("Profile display settings could not load. Please try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const update = async (key: (typeof OPTIONS)[number]["key"], value: boolean) => {
    setSaving(key);
    const previous = presentation;
    setPresentation((current) => ({ ...current, [key]: value }));
    try {
      const response = await fetch(`${base}/api/users/me/profile-presentation`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const body = await response.json().catch(() => ({})) as { presentation?: Presentation };
      if (!response.ok || !body.presentation) throw new Error("save failed");
      setPresentation({ ...EMPTY, ...body.presentation });
    } catch {
      setPresentation(previous);
      setError("That display choice was not changed. Please try again.");
    } finally { setSaving(null); }
  };

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Choose an image file for your profile cover."); return; }
    setSaving("cover");
    setError(null);
    try {
      const data = new FormData();
      data.append("cover", file);
      const response = await fetch(`${base}/api/users/me/profile-cover`, { method: "POST", credentials: "include", body: data });
      const body = await response.json().catch(() => ({})) as { coverUrl?: string };
      if (!response.ok || !body.coverUrl) throw new Error("upload failed");
      setPresentation((current) => ({ ...current, coverUrl: body.coverUrl }));
    } catch {
      setError("Your cover was not updated. Try another image or check your connection.");
    } finally { setSaving(null); }
  };

  return <section aria-label="Profile display controls" className="mt-8 rounded-2xl border border-[#3A1F0E]/10 bg-[#FFFDF9] p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="font-serif text-lg font-bold text-[#2B1507]">Profile display</h3>
        <p className="mt-1 max-w-xl text-sm leading-6 text-[#3A1F0E]/65">Your social profile uses your Community activity. Optional personal details remain hidden unless you choose to show them.</p>
      </div>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={saving === "cover"} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#CA922B]/40 bg-white px-3.5 py-2 text-sm font-bold text-[#8D5C17] hover:bg-[#FAF6EF] disabled:opacity-60">
        {saving === "cover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />} Choose cover
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={(event) => void uploadCover(event.target.files?.[0])} />
    </div>
    {presentation.coverUrl ? <div className="mt-4 overflow-hidden rounded-xl border border-[#3A1F0E]/10 bg-white"><img src={`${base}${presentation.coverUrl}`} alt="Private profile cover preview" className="h-28 w-full object-cover" /></div> : null}
    {loading ? <div className="mt-5 flex items-center gap-2 text-sm text-[#3A1F0E]/60"><Loader2 className="h-4 w-4 animate-spin" />Loading display choices…</div> : <>
      {!available ? <div className="mt-5 flex gap-2 rounded-xl border border-[#CA922B]/20 bg-[#FAF6EF] p-3 text-sm leading-5 text-[#3A1F0E]/70"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#CA922B]" />Optional details remain hidden until the profile’s age-safety requirements are met.</div> : null}
      <div className="mt-5 divide-y divide-[#3A1F0E]/10 overflow-hidden rounded-xl border border-[#3A1F0E]/10 bg-white">
        {OPTIONS.map((option) => <label key={option.key} className="flex cursor-pointer items-center gap-3 p-3.5 hover:bg-[#FFFDF9]">
          <input type="checkbox" className="sr-only" checked={presentation[option.key]} disabled={!available || saving === option.key} onChange={(event) => void update(option.key, event.target.checked)} />
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${presentation[option.key] ? "bg-[#CA922B] text-white" : "bg-[#FAF6EF] text-[#3A1F0E]/45"}`}>{presentation[option.key] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</span>
          <span className="flex-1"><span className="block text-sm font-bold text-[#2B1507]">{option.title}</span><span className="mt-0.5 block text-xs leading-5 text-[#3A1F0E]/60">{option.description}</span></span>
          {saving === option.key ? <Loader2 className="h-4 w-4 animate-spin text-[#CA922B]" /> : <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${presentation[option.key] ? "bg-[#CA922B]" : "bg-[#3A1F0E]/15"}`}><span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${presentation[option.key] ? "translate-x-4" : "translate-x-0"}`} /></span>}
        </label>)}
      </div>
    </>}
    {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error} <button type="button" onClick={() => void load()} className="font-bold underline">Retry</button></p> : null}
  </section>;
}
