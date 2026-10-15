import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type ManagedBusinessProfile = {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  hours?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
};

type EditableFields = Record<
  | "name"
  | "description"
  | "phone"
  | "website"
  | "hours"
  | "instagram"
  | "tiktok"
  | "facebook",
  string
>;

const EMPTY_PROFILE: EditableFields = {
  name: "",
  description: "",
  phone: "",
  website: "",
  hours: "",
  instagram: "",
  tiktok: "",
  facebook: "",
};

function editableFields(business: ManagedBusinessProfile): EditableFields {
  return {
    name: business.name ?? "",
    description: business.description ?? "",
    phone: business.phone ?? "",
    website: business.website ?? "",
    hours: business.hours ?? "",
    instagram: business.instagram ?? "",
    tiktok: business.tiktok ?? "",
    facebook: business.facebook ?? "",
  };
}

/**
 * Edits only the ordinary, owner-authorized profile fields exposed by
 * PATCH /businesses/mine/managed/:businessId/profile. It cannot change
 * publication, verification, listing status, ownership, or protected evidence.
 */
export function ManagedBusinessProfileEditor({
  businessId,
  onClose,
}: {
  businessId: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<EditableFields>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await authenticatedFetch(
          `${BASE}api/businesses/mine/managed/${encodeURIComponent(businessId)}`,
        );
        const payload = (await response.json().catch(() => ({}))) as {
          business?: ManagedBusinessProfile;
          error?: string;
        };
        if (!response.ok || !payload.business) {
          throw new Error(payload.error ?? "Your authorized business profile could not load.");
        }
        if (active) setProfile(editableFields(payload.business));
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Your authorized business profile could not load.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [businessId]);

  function update(field: keyof EditableFields, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/businesses/mine/managed/${encodeURIComponent(businessId)}/profile`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        business?: ManagedBusinessProfile;
        error?: string;
      };
      if (!response.ok || !payload.business) {
        throw new Error(payload.error ?? "Your business profile was not saved.");
      }
      setProfile(editableFields(payload.business));
      setMessage("Saved. Your ordinary business profile details were updated.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your business profile was not saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-label="Edit authorized business profile"
      className="rounded-2xl border border-[#CA922B]/30 bg-[#FFFDF9] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">
            Edit business profile
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/65">
            Update the ordinary details shown for this business. Verification,
            publication status, ownership, and evidence are managed separately.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-[#3A1F0E]/55 transition-colors hover:bg-[#F5EBD8] hover:text-[#2B1507]"
          aria-label="Close business profile editor"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-[#3A1F0E]/60" role="status">
          <Loader2 className="h-4 w-4 animate-spin text-[#CA922B]" /> Loading your authorized business profile…
        </div>
      ) : error ? (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-[#2B1507]">
              Business name
              <input
                value={profile.name}
                onChange={(event) => update("name", event.target.value)}
                maxLength={200}
                className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-white p-3 text-sm font-normal"
              />
            </label>
            <label className="text-sm font-bold text-[#2B1507]">
              Phone
              <input
                value={profile.phone}
                onChange={(event) => update("phone", event.target.value)}
                maxLength={100}
                className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-white p-3 text-sm font-normal"
              />
            </label>
          </div>
          <label className="block text-sm font-bold text-[#2B1507]">
            Description
            <textarea
              value={profile.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={4000}
              className="mt-1 min-h-28 w-full rounded-xl border border-[#3A1F0E]/20 bg-white p-3 text-sm font-normal"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-[#2B1507]">
              Website
              <input
                value={profile.website}
                onChange={(event) => update("website", event.target.value)}
                maxLength={500}
                className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-white p-3 text-sm font-normal"
              />
            </label>
            <label className="text-sm font-bold text-[#2B1507]">
              Hours
              <input
                value={profile.hours}
                onChange={(event) => update("hours", event.target.value)}
                maxLength={1000}
                className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-white p-3 text-sm font-normal"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {([
              ["instagram", "Instagram"],
              ["facebook", "Facebook"],
              ["tiktok", "TikTok"],
            ] as const).map(([field, label]) => (
              <label key={field} className="text-sm font-bold text-[#2B1507]">
                {label}
                <input
                  value={profile[field]}
                  onChange={(event) => update(field, event.target.value)}
                  maxLength={500}
                  className="mt-1 w-full rounded-xl border border-[#3A1F0E]/20 bg-white p-3 text-sm font-normal"
                />
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-[#3A1F0E]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-[#2D7A4F]" role="status">
              {message ? <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />{message}</span> : null}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-full border border-[#3A1F0E]/20 px-4 py-2 text-sm font-bold text-[#3A1F0E]">Cancel</button>
              <button
                type="button"
                disabled={saving || !profile.name.trim()}
                onClick={() => void save()}
                className="inline-flex items-center gap-2 rounded-full bg-[#2B1507] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
