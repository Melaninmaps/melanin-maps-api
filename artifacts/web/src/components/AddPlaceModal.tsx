import { useState } from "react";
import { useLocation } from "wouter";
import { X, MapPin } from "lucide-react";

const CATEGORIES = [
  "Food",
  "Beauty",
  "Wellness",
  "Entertainment",
  "Retail",
  "Cultural",
  "Professional",
  "Healthcare",
  "Finance",
  "Travel & Tourism",
  "Trades & Education",
  "Other",
];

const COMMON_COUNTRIES = [
  "USA",
  "Thailand",
  "Jamaica",
  "Mexico",
  "Bahamas",
  "Canada",
  "United Kingdom",
  "Ghana",
  "Nigeria",
  "South Africa",
  "Kenya",
  "Brazil",
  "Colombia",
  "Cuba",
  "Trinidad & Tobago",
  "Barbados",
  "Dominican Republic",
  "Haiti",
  "Senegal",
  "Ethiopia",
  "Tanzania",
  "Other",
];

interface AddPlaceModalProps {
  initialSearch?: string;
  onClose: () => void;
}

export default function AddPlaceModal({ initialSearch, onClose }: AddPlaceModalProps) {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  // Step 1 — identity
  const [name, setName] = useState(initialSearch?.trim() ?? "");
  const [category, setCategory] = useState("");

  // Step 2 — location
  const [countrySelect, setCountrySelect] = useState("USA");
  const [countryCustom, setCountryCustom] = useState("");
  const [city, setCity] = useState("");
  const [usState, setUsState] = useState("");
  const [address, setAddress] = useState("");

  // Step 3 — optional details
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const country = countrySelect === "Other" ? countryCustom.trim() : countrySelect;
  const isUSA = country === "USA";

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const apiBase = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      const body: Record<string, string | undefined> = {
        name: name.trim(),
        category,
        city: city.trim(),
        address: address.trim() || undefined,
        description: description.trim() || undefined,
        website: website.trim() || undefined,
      };
      if (isUSA && usState.trim()) body.state = usState.trim().toUpperCase();
      if (!isUSA && country) body.country = country;

      const res = await fetch(`${apiBase}/api/businesses/suggest-place`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        businessId?: string;
        existingId?: string;
        existingName?: string;
        error?: string;
      };

      if (res.status === 409 && data.existingId) {
        // A matching place already exists — take them straight to it
        setLocation(`/businesses/${data.existingId}?addContent=true`);
        onClose();
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      // Success — navigate to the new place's profile with contribution modal auto-open
      setLocation(`/businesses/${data.businessId}?addContent=true`);
      onClose();
    } catch {
      setError("Unable to submit. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#CA922B]/20 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#3A1F0E]/40 hover:text-[#3A1F0E] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#CA922B]/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-[#CA922B]" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-[#2B1507]">Add a Place</h3>
            <p className="text-xs text-[#3A1F0E]/60">
              Help build the community map · Step {step} of 3
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-[#CA922B]" : "bg-[#3A1F0E]/10"
              }`}
            />
          ))}
        </div>

        {/* ── Step 1: Name + Category ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">
                Place name *
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Soul Food Kitchen, Wat Pho Temple"
                className="w-full px-4 py-3 rounded-xl border border-[#2B1507]/15 bg-[#FAF6EF] text-sm text-[#2B1507] placeholder-[#3A1F0E]/35 focus:outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/10 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold text-left transition-colors border ${
                      category === cat
                        ? "bg-[#CA922B] text-white border-[#CA922B]"
                        : "bg-[#FAF6EF] text-[#3A1F0E]/70 border-[#3A1F0E]/10 hover:border-[#CA922B]/40"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (name.trim() && category) setStep(2);
              }}
              disabled={!name.trim() || !category}
              className="w-full py-3 rounded-full bg-[#CA922B] hover:bg-[#B38024] disabled:bg-[#3A1F0E]/15 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
            >
              Next: Location →
            </button>
          </div>
        )}

        {/* ── Step 2: Location ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">
                Country *
              </label>
              <select
                value={countrySelect}
                onChange={(e) => setCountrySelect(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#2B1507]/15 bg-[#FAF6EF] text-sm text-[#2B1507] focus:outline-none focus:border-[#CA922B] transition"
              >
                {COMMON_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "Other" ? "Other country…" : c}
                  </option>
                ))}
              </select>
              {countrySelect === "Other" && (
                <input
                  autoFocus
                  type="text"
                  value={countryCustom}
                  onChange={(e) => setCountryCustom(e.target.value)}
                  placeholder="Enter country name"
                  className="w-full mt-2 px-4 py-3 rounded-xl border border-[#2B1507]/15 bg-[#FAF6EF] text-sm text-[#2B1507] placeholder-[#3A1F0E]/35 focus:outline-none focus:border-[#CA922B] transition"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={isUSA ? "e.g. Philadelphia" : "e.g. Bangkok"}
                className="w-full px-4 py-3 rounded-xl border border-[#2B1507]/15 bg-[#FAF6EF] text-sm text-[#2B1507] placeholder-[#3A1F0E]/35 focus:outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/10 transition"
              />
            </div>

            {isUSA && (
              <div>
                <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">
                  State{" "}
                  <span className="normal-case font-normal text-[#3A1F0E]/35">(2-letter)</span>
                </label>
                <input
                  type="text"
                  value={usState}
                  onChange={(e) => setUsState(e.target.value.toUpperCase())}
                  placeholder="PA"
                  maxLength={2}
                  className="w-full px-4 py-3 rounded-xl border border-[#2B1507]/15 bg-[#FAF6EF] text-sm text-[#2B1507] placeholder-[#3A1F0E]/35 focus:outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/10 transition uppercase"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">
                Address{" "}
                <span className="normal-case font-normal text-[#3A1F0E]/35">
                  (helps place the pin on the map)
                </span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address or neighborhood"
                className="w-full px-4 py-3 rounded-xl border border-[#2B1507]/15 bg-[#FAF6EF] text-sm text-[#2B1507] placeholder-[#3A1F0E]/35 focus:outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/10 transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-full border border-[#3A1F0E]/15 text-[#3A1F0E]/60 font-bold text-sm hover:bg-[#FAF6EF] transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (city.trim() && (countrySelect !== "Other" || countryCustom.trim())) setStep(3);
                }}
                disabled={!city.trim() || (countrySelect === "Other" && !countryCustom.trim())}
                className="flex-1 py-3 rounded-full bg-[#CA922B] hover:bg-[#B38024] disabled:bg-[#3A1F0E]/15 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Optional details ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">
                About this place{" "}
                <span className="normal-case font-normal text-[#3A1F0E]/35">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What makes this place special? Who's it for?"
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-[#2B1507]/15 bg-[#FAF6EF] text-sm text-[#2B1507] placeholder-[#3A1F0E]/35 focus:outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/10 resize-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">
                Website{" "}
                <span className="normal-case font-normal text-[#3A1F0E]/35">(optional)</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-[#2B1507]/15 bg-[#FAF6EF] text-sm text-[#2B1507] placeholder-[#3A1F0E]/35 focus:outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/10 transition"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <div className="bg-[#FAF6EF] rounded-xl p-3 border border-[#2B1507]/8">
              <p className="text-[10px] text-[#3A1F0E]/50 leading-relaxed">
                <strong className="text-[#3A1F0E]/70">Next step:</strong> After submitting, you'll
                land on this place's profile where you can immediately attach your Instagram, TikTok,
                or YouTube content.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-full border border-[#3A1F0E]/15 text-[#3A1F0E]/60 font-bold text-sm hover:bg-[#FAF6EF] transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-full bg-[#CA922B] hover:bg-[#B38024] disabled:bg-[#CA922B]/60 text-white font-bold text-sm transition-colors"
              >
                {submitting ? "Adding…" : "Add Place →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
