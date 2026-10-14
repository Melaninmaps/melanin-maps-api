import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PencilLine } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { useAccountContext } from "@/contexts/account-context";

const BASE = import.meta.env.BASE_URL;

type ManagedBusinessProfile = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  primarySocialPlatform: string | null;
  businessTagline: string | null;
  ownerName: string | null;
  ownerBio: string | null;
  ownerStory: string | null;
};

type ProfileDraft = Pick<
  ManagedBusinessProfile,
  | "name"
  | "description"
  | "phone"
  | "website"
  | "hours"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "primarySocialPlatform"
  | "businessTagline"
  | "ownerName"
  | "ownerBio"
  | "ownerStory"
>;

const EMPTY: ProfileDraft = {
  name: "",
  description: "",
  phone: "",
  website: "",
  hours: "",
  instagram: "",
  tiktok: "",
  facebook: "",
  primarySocialPlatform: "",
  businessTagline: "",
  ownerName: "",
  ownerBio: "",
  ownerStory: "",
};

function draftFromBusiness(business: ManagedBusinessProfile): ProfileDraft {
  return {
    name: business.name ?? "",
    description: business.description ?? "",
    phone: business.phone ?? "",
    website: business.website ?? "",
    hours: business.hours ?? "",
    instagram: business.instagram ?? "",
    tiktok: business.tiktok ?? "",
    facebook: business.facebook ?? "",
    primarySocialPlatform: business.primarySocialPlatform ?? "",
    businessTagline: business.businessTagline ?? "",
    ownerName: business.ownerName ?? "",
    ownerBio: business.ownerBio ?? "",
    ownerStory: business.ownerStory ?? "",
  };
}

export function SelectedBusinessProfileEditor({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const { activeContext } = useAccountContext();
  const contextMatchesBusiness = activeContext.kind === "business" && activeContext.businessId === businessId;
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage(null);
    if (!contextMatchesBusiness) {
      setLoading(false);
      setMessage("Select this business workspace before editing its profile.");
      return () => { active = false; };
    }
    authenticatedFetch(`${BASE}api/businesses/mine/managed/${encodeURIComponent(businessId)}`, {
      credentials: "include",
      cache: "no-store",
      headers: { "X-MWM-Account-Context": `business:${businessId}` },
    })
      .then(async (response) => {
        const payload = await response.json() as { business?: ManagedBusinessProfile; error?: string };
        if (!response.ok || !payload.business) {
          throw new Error(payload.error ?? "Could not load this business profile.");
        }
        if (active) setDraft(draftFromBusiness(payload.business));
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "Could not load this business profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [businessId, contextMatchesBusiness]);

  function updateField<Key extends keyof ProfileDraft>(key: Key, value: ProfileDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!draft.name.trim()) {
      setMessage("Business name is required.");
      return;
    }
    if (!contextMatchesBusiness) {
      setMessage("Select this business workspace before saving its profile.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/businesses/mine/managed/${encodeURIComponent(businessId)}/profile`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-MWM-Account-Context": `business:${businessId}`,
          },
          body: JSON.stringify(draft),
        },
      );
      const payload = await response.json() as { business?: ManagedBusinessProfile; error?: string };
      if (!response.ok || !payload.business) {
        throw new Error(payload.error ?? "Could not save this business profile.");
      }
      setDraft(draftFromBusiness(payload.business));
      setMessage(`Saved changes to ${payload.business.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this business profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 text-sm text-[#3A1F0E]/60">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading selected business details…
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5" data-testid="selected-business-profile-editor">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#CA922B]/12">
          <PencilLine className="h-4 w-4 text-[#CA922B]" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-[#2B1507]">Edit selected business profile</h2>
          <p className="mt-1 text-sm leading-5 text-[#3A1F0E]/60">
            These ordinary listing details apply only to <strong>{businessName}</strong>. They do not alter ownership approval, verification, publication, eligibility, map coordinates, or another business.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[#2B1507]">Business name
          <input value={draft.name} onChange={(event) => updateField("name", event.target.value)} maxLength={180} className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal" />
        </label>
        <label className="text-sm font-bold text-[#2B1507]">Tagline
          <input value={draft.businessTagline ?? ""} onChange={(event) => updateField("businessTagline", event.target.value)} maxLength={240} placeholder="A short line for your profile" className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal" />
        </label>
        <label className="text-sm font-bold text-[#2B1507]">Phone
          <input value={draft.phone ?? ""} onChange={(event) => updateField("phone", event.target.value)} maxLength={40} inputMode="tel" className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal" />
        </label>
        <label className="text-sm font-bold text-[#2B1507]">Official website
          <input value={draft.website ?? ""} onChange={(event) => updateField("website", event.target.value)} maxLength={500} inputMode="url" placeholder="https://" className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal" />
        </label>
        <label className="text-sm font-bold text-[#2B1507]">Hours
          <input value={draft.hours ?? ""} onChange={(event) => updateField("hours", event.target.value)} maxLength={500} placeholder="Mon–Fri 9 AM–5 PM" className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal" />
        </label>
        <label className="text-sm font-bold text-[#2B1507]">Primary social platform
          <select value={draft.primarySocialPlatform ?? ""} onChange={(event) => updateField("primarySocialPlatform", event.target.value)} className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal">
            <option value="">No primary social selected</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="facebook">Facebook</option>
          </select>
        </label>
        <label className="text-sm font-bold text-[#2B1507]">Instagram
          <input value={draft.instagram ?? ""} onChange={(event) => updateField("instagram", event.target.value)} maxLength={500} placeholder="https://instagram.com/..." className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal" />
        </label>
        <label className="text-sm font-bold text-[#2B1507]">TikTok
          <input value={draft.tiktok ?? ""} onChange={(event) => updateField("tiktok", event.target.value)} maxLength={500} placeholder="https://tiktok.com/@..." className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal" />
        </label>
        <label className="text-sm font-bold text-[#2B1507] sm:col-span-2">Facebook
          <input value={draft.facebook ?? ""} onChange={(event) => updateField("facebook", event.target.value)} maxLength={500} placeholder="https://facebook.com/..." className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal" />
        </label>
      </div>

      <label className="mt-4 block text-sm font-bold text-[#2B1507]">Description
        <textarea value={draft.description ?? ""} onChange={(event) => updateField("description", event.target.value)} maxLength={5000} rows={4} className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-[#FAF6EF] p-3 text-sm font-normal" />
      </label>
      <details className="mt-4 rounded-xl bg-[#FAF6EF] p-4">
        <summary className="cursor-pointer text-sm font-bold text-[#2B1507]">Owner story (optional)</summary>
        <div className="mt-4 grid gap-4">
          <label className="text-sm font-bold text-[#2B1507]">Owner name
            <input value={draft.ownerName ?? ""} onChange={(event) => updateField("ownerName", event.target.value)} maxLength={180} className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-white p-3 text-sm font-normal" />
          </label>
          <label className="text-sm font-bold text-[#2B1507]">Owner bio
            <textarea value={draft.ownerBio ?? ""} onChange={(event) => updateField("ownerBio", event.target.value)} maxLength={2000} rows={3} className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-white p-3 text-sm font-normal" />
          </label>
          <label className="text-sm font-bold text-[#2B1507]">Owner story
            <textarea value={draft.ownerStory ?? ""} onChange={(event) => updateField("ownerStory", event.target.value)} maxLength={5000} rows={5} className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-white p-3 text-sm font-normal" />
          </label>
        </div>
      </details>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className="text-sm font-medium text-[#6A3B1E]">{message}</p>
        <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2B1507] px-5 text-sm font-bold text-white disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {saving ? "Saving selected business…" : "Save selected business"}
        </button>
      </div>
    </section>
  );
}
