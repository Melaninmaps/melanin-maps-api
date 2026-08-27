/**
 * AdminAddBusiness — multi-section form for admins to add a business on-the-go.
 * Uses canonical category, vibe, and ownership designation constants.
 * Never exposes community-reviewed sentiment fields — those are earned, not assigned.
 */
import { useState, useEffect } from "react";
import {
  X, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle,
  Loader2, ExternalLink, Store
} from "lucide-react";
import { AdminBusinessMediaStep } from "./AdminBusinessMediaStep";
import {
  BUSINESS_CATEGORY_TAXONOMY,
  VIBES_BY_CATEGORY,
  VIBE_ELIGIBLE_CATEGORIES,
  OWNERSHIP_DESIGNATIONS,
} from "@workspace/constants";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"] as const;
const HOUR_OPTIONS = [
  "Mon–Fri 9am–5pm", "Mon–Fri 9am–6pm", "Mon–Sat 9am–5pm",
  "Mon–Sat 10am–8pm", "Mon–Sun 10am–8pm", "Mon–Sun 11am–9pm",
  "Tue–Sun 11am–9pm", "Fri–Sun evenings", "By appointment only",
  "Call for hours", "Custom",
];
const LISTING_STATUSES = [
  { value: "staged", label: "Staged (hidden — finish later)", desc: "Does not appear publicly. Safe for incomplete entries." },
  { value: "live_unclaimed", label: "Live — Unclaimed", desc: "Appears on the map immediately. Business owner has not yet claimed." },
];

type Step = "basic" | "social" | "identity" | "discovery" | "review" | "media";
const FORM_STEPS: Step[] = ["basic", "social", "identity", "discovery", "review"];
const STEP_LABELS: Record<Step, string> = {
  basic: "Basic Info",
  social: "Online Presence",
  identity: "Business Identity",
  discovery: "Discovery",
  review: "Review & Save",
  media: "Media",
};

interface DuplicateWarning {
  step: number;
  existing?: { id: string; name: string }[];
  message: string;
}

interface Props {
  onClose: () => void;
  onSuccess: (bizId: string, bizName: string) => void;
}

export function AdminAddBusiness({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("basic");
  const [submitting, setSubmitting] = useState(false);
  const [checkingDup, setCheckingDup] = useState(false);
  const [dupWarning, setDupWarning] = useState<DuplicateWarning | null>(null);
  const [error, setError] = useState("");
  const [forceProceed, setForceProceed] = useState(false);
  const [savedBiz, setSavedBiz] = useState<{ id: string; name: string } | null>(null);

  // ── Form fields ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [hours, setHours] = useState("");
  const [customHours, setCustomHours] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [pinterest, setPinterest] = useState("");
  const [ownershipDesignations, setOwnershipDesignations] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [listingStatus, setListingStatus] = useState("staged");

  const selectedCategory = BUSINESS_CATEGORY_TAXONOMY.find(c => c.name === category);
  const vibeEligible = VIBE_ELIGIBLE_CATEGORIES.includes(category);
  const availableVibes = VIBES_BY_CATEGORY[category] ?? [];

  // Reset subcategory when category changes
  useEffect(() => { setSubcategory(""); setSelectedVibes([]); }, [category]);

  // After save — if in media step, show media uploader
  if (step === "media" && savedBiz) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <div
          className="bg-white w-full sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-[#2B1507] px-6 py-5 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-[#CA922B]" />
              <div>
                <h2 className="font-serif font-bold text-white text-lg">Add Photos & Social</h2>
                <p className="text-[#F5EBD8]/50 text-xs">Optional — you can always add these later</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <X className="w-4 h-4 text-[#F5EBD8]" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <AdminBusinessMediaStep
              businessId={savedBiz.id}
              businessName={savedBiz.name}
              onDone={() => { onSuccess(savedBiz.id, savedBiz.name); }}
            />
          </div>
        </div>
      </div>
    );
  }

  const STEPS = FORM_STEPS;

  function toggleOwnership(d: string) {
    setOwnershipDesignations(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  }
  function toggleVibe(v: string) {
    setSelectedVibes(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  }

  const stepIdx = STEPS.indexOf(step);
  function next() {
    setError("");
    if (step === "basic") {
      if (!name.trim()) { setError("Business name is required."); return; }
      if (!category) { setError("Category is required."); return; }
    }
    setStep(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)]);
  }
  function prev() { setError(""); setStep(STEPS[Math.max(stepIdx - 1, 0)]); }

  async function checkDuplicates(): Promise<boolean> {
    if (!name.trim() && !address.trim()) return true;
    setCheckingDup(true);
    try {
      const params = new URLSearchParams();
      if (name.trim()) params.set("name", name.trim());
      if (city.trim()) params.set("city", city.trim());
      if (state.trim()) params.set("state", state.trim());
      if (address.trim()) params.set("address", address.trim());
      const res = await fetch(`${BASE}/api/admin/businesses/check-duplicate?${params}`, {
        credentials: "include",
      });
      if (!res.ok) return true; // Don't block on check failure
      const data = await res.json() as { duplicates?: Array<{ id: string; name: string }>; warning?: string };
      if (data.duplicates && data.duplicates.length > 0) {
        setDupWarning({
          step: 1,
          existing: data.duplicates,
          message: data.warning ?? `${data.duplicates.length} possible match(es) found.`,
        });
        return false;
      }
      return true;
    } catch {
      return true; // Don't block on network error
    } finally {
      setCheckingDup(false);
    }
  }

  async function handleSubmit() {
    setError("");

    if (!forceProceed) {
      const clean = await checkDuplicates();
      if (!clean) return;
    }

    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        category,
        subcategory: subcategory || category,
        description: description.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim() || null,
        zip: zip.trim() || null,
        country: country.trim() || null,
        province: province.trim() || null,
        phone: phone.trim() || null,
        email: bizEmail.trim() || null,
        website: website.trim() || null,
        hours: hours === "Custom" ? customHours.trim() || null : hours || null,
        priceRange: priceRange || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        tiktok: tiktok.trim() || null,
        twitter: twitter.trim() || null,
        youtube: youtube.trim() || null,
        pinterest: pinterest.trim() || null,
        ownershipDesignations,
        blackOwned: ownershipDesignations.some(d => d.toLowerCase().includes("black")),
        vibes: selectedVibes,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        adminNotes: adminNotes.trim() || null,
        listingStatus,
      };

      const res = await fetch(`${BASE}/api/admin/businesses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json() as { business?: { id: string; name: string }; error?: string; duplicate?: unknown };

      if (!res.ok) {
        if (res.status === 409) {
          setDupWarning({
            step: 1,
            message: data.error ?? "A matching business already exists.",
          });
          return;
        }
        setError(data.error ?? "Failed to create business.");
        return;
      }
      // Go to media step (photo upload + social links) instead of closing immediately
      setSavedBiz({ id: data.business!.id, name: data.business!.name });
      setStep("media");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B] bg-white";
  const labelCls = "block text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider mb-1.5";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2B1507] px-6 py-5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-[#CA922B]" />
              <div>
                <h2 className="font-serif font-bold text-white text-lg">Add Business</h2>
                <p className="text-[#F5EBD8]/50 text-xs">Admin entry — saves as staged until published</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-4 h-4 text-[#F5EBD8]" />
            </button>
          </div>
          {/* Step progress */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <button
                  onClick={() => { setError(""); setStep(s); }}
                  className={`h-1.5 rounded-full transition-all ${s === step ? "w-8 bg-[#CA922B]" : i < stepIdx ? "w-4 bg-[#CA922B]/50" : "w-4 bg-white/20"}`}
                />
              </div>
            ))}
            <span className="ml-2 text-xs text-[#F5EBD8]/50">{STEP_LABELS[step]}</span>
          </div>
        </div>

        {/* Duplicate warning banner */}
        {dupWarning && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 shrink-0">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-800 text-sm">{dupWarning.message}</p>
                {dupWarning.existing && dupWarning.existing.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {dupWarning.existing.map(biz => (
                      <div key={biz.id} className="flex items-center gap-2 text-xs text-amber-700">
                        <span className="font-medium truncate">{biz.name}</span>
                        <a
                          href={`${BASE}/businesses/${biz.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 underline hover:text-amber-900"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => { setDupWarning(null); setForceProceed(true); }}
                    className="text-xs font-bold text-amber-800 underline hover:text-amber-900"
                  >
                    These are different — proceed anyway
                  </button>
                  <button
                    onClick={() => { setDupWarning(null); setStep("basic"); }}
                    className="text-xs font-bold text-amber-800 underline hover:text-amber-900"
                  >
                    Edit the record instead
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {step === "basic" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Business Name <span className="text-red-500">*</span></label>
                  <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="As it appears on the sign" />
                </div>
                <div>
                  <label className={labelCls}>Category <span className="text-red-500">*</span></label>
                  <select className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Choose a category…</option>
                    {BUSINESS_CATEGORY_TAXONOMY.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Subcategory</label>
                  <select className={inputCls} value={subcategory} onChange={e => setSubcategory(e.target.value)} disabled={!selectedCategory}>
                    <option value="">Choose subcategory…</option>
                    {selectedCategory?.subcategories.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Description &amp; Why MWM Recommends <span className="font-normal normal-case text-[#3A1F0E]/35">(public)</span></label>
                  <textarea className={inputCls} value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What this place offers and why it matters to our community — e.g. 'Family-owned Thai restaurant in Silom beloved by locals for authentic Isan cuisine. One of the few spots welcoming to Black travelers in the neighborhood.'" />
                </div>
                <div>
                  <label className={labelCls}>Phone <span className="font-normal normal-case text-[#3A1F0E]/35">(any format)</span></label>
                  <input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+66 81 234 5678  or  (555) 555-5555" />
                </div>
                <div>
                  <label className={labelCls}>Business Email</label>
                  <input className={inputCls} type="email" value={bizEmail} onChange={e => setBizEmail(e.target.value)} placeholder="hello@business.com" />
                  <p className="text-[10px] text-[#3A1F0E]/35 mt-1">Contact email for the business — not used for login</p>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Website</label>
                  <input className={inputCls} type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Street Address</label>
                  <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
                </div>
                <div>
                  <label className={labelCls}>City <span className="text-red-500">*</span></label>
                  <input className={inputCls} value={city} onChange={e => setCity(e.target.value)} placeholder="Bangkok, Philadelphia, Toronto…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>State / Province</label>
                    <input className={inputCls} value={state || province} onChange={e => { if (country && country.toUpperCase() !== "US" && country.toUpperCase() !== "USA" && country.toUpperCase() !== "UNITED STATES") { setProvince(e.target.value); setState(""); } else { setState(e.target.value.toUpperCase().slice(0, 2)); setProvince(""); } }} placeholder="PA or Region" maxLength={50} />
                  </div>
                  <div>
                    <label className={labelCls}>ZIP / Postal Code</label>
                    <input className={inputCls} value={zip} onChange={e => setZip(e.target.value)} placeholder="19103" maxLength={10} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Country <span className="text-[#3A1F0E]/30 font-normal normal-case">(leave blank for United States)</span></label>
                  <input className={inputCls} value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Thailand, Canada, United Kingdom" />
                </div>
                <div>
                  <label className={labelCls}>Hours</label>
                  <select className={inputCls} value={hours} onChange={e => setHours(e.target.value)}>
                    <option value="">Unknown / skip for now</option>
                    {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                {hours === "Custom" && (
                  <div>
                    <label className={labelCls}>Custom Hours</label>
                    <input className={inputCls} value={customHours} onChange={e => setCustomHours(e.target.value)} placeholder="e.g. Mon/Wed/Fri 10am–6pm" />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Price Range</label>
                  <div className="flex gap-2">
                    {PRICE_RANGES.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriceRange(prev => prev === p ? "" : p)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${priceRange === p ? "bg-[#CA922B] text-white border-[#CA922B]" : "border-[#2B1507]/15 text-[#3A1F0E]/60 hover:border-[#CA922B]/40"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === "social" && (
            <>
              <p className="text-sm text-[#3A1F0E]/60">Add social handles or profile URLs for the business. All fields optional.</p>
              <div className="space-y-3">
                {[
                  { label: "Instagram", placeholder: "@handle or full URL", value: instagram, set: setInstagram },
                  { label: "Facebook", placeholder: "facebook.com/page or @handle", value: facebook, set: setFacebook },
                  { label: "TikTok", placeholder: "@tiktok or full URL", value: tiktok, set: setTiktok },
                  { label: "Twitter / X", placeholder: "@handle or full URL", value: twitter, set: setTwitter },
                  { label: "YouTube", placeholder: "youtube.com/channel URL", value: youtube, set: setYoutube },
                  { label: "Pinterest", placeholder: "pinterest.com/profile", value: pinterest, set: setPinterest },
                ].map(({ label, placeholder, value, set }) => (
                  <div key={label}>
                    <label className={labelCls}>{label}</label>
                    <input className={inputCls} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} />
                  </div>
                ))}
              </div>
            </>
          )}

          {step === "identity" && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed mb-4">
                <strong>Important:</strong> Select only designations the owner has confirmed or documented. All designations are self-identified. "Added by admin" does not mean "verified."
              </div>

              <div>
                <label className={labelCls}>Ownership Designations</label>
                <p className="text-xs text-[#3A1F0E]/50 mb-3">Select all that apply. These are shown as informational badges — not auto-verified.</p>
                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
                  {OWNERSHIP_DESIGNATIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleOwnership(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        ownershipDesignations.includes(d)
                          ? "bg-[#2B1507] text-[#F5EBD8] border-[#2B1507]"
                          : "border-[#2B1507]/20 text-[#3A1F0E]/70 hover:border-[#CA922B]/50"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Source &amp; Provenance <span className="font-normal normal-case text-[#3A1F0E]/35">(internal — never shown publicly)</span></label>
                <textarea
                  className={inputCls}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="How this place was found — e.g. 'Founder scouted via Google Maps / TripAdvisor reviews from Black travelers. Instagram: @placename. Will follow up for owner contact.'"
                />
              </div>
            </>
          )}

          {step === "discovery" && (
            <>
              {vibeEligible ? (
                <div>
                  <label className={labelCls}>Vibes — How does this place feel?</label>
                  <p className="text-xs text-[#3A1F0E]/50 mb-3">
                    These reflect the atmosphere — not quality or community endorsements. Only enter vibes you can confirm.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableVibes.map(v => (
                      <button
                        key={v.label}
                        type="button"
                        onClick={() => toggleVibe(v.label)}
                        title={v.helperText}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedVibes.includes(v.label)
                            ? "bg-[#CA922B] text-white border-[#CA922B]"
                            : "border-[#2B1507]/20 text-[#3A1F0E]/70 hover:border-[#CA922B]/50"
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#FAF6EF] border border-[#CA922B]/20 rounded-xl p-4">
                  <p className="text-sm text-[#3A1F0E]/70 font-medium">Vibes don't apply to this category.</p>
                  <p className="text-xs text-[#3A1F0E]/50 mt-1">
                    {category} businesses use community endorsements instead of vibes. Those are earned through real customer interactions, not admin-assigned.
                  </p>
                </div>
              )}

              <div>
                <label className={labelCls}>Internal Tags <span className="font-normal normal-case text-[#3A1F0E]/35">(comma-separated)</span></label>
                <input
                  className={inputCls}
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g. vegan-options, outdoor-seating, live-music"
                />
              </div>

              <div>
                <label className={labelCls}>Publish Status</label>
                <div className="space-y-2">
                  {LISTING_STATUSES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setListingStatus(s.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        listingStatus === s.value
                          ? "border-[#CA922B] bg-[#CA922B]/5"
                          : "border-[#2B1507]/10 hover:border-[#CA922B]/30"
                      }`}
                    >
                      <p className="text-sm font-bold text-[#3A1F0E]">{s.label}</p>
                      <p className="text-xs text-[#3A1F0E]/50 mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="bg-[#FAF6EF] rounded-2xl divide-y divide-[#2B1507]/8">
                {[
                  { label: "Name", value: name || "—" },
                  { label: "Category", value: [category, subcategory].filter(Boolean).join(" / ") || "—" },
                  { label: "Address", value: [address, city, province || state, zip, country].filter(Boolean).join(", ") || "—" },
                  { label: "Phone", value: phone || "—" },
                  { label: "Email", value: bizEmail || "—" },
                  { label: "Website", value: website || "—" },
                  { label: "Hours", value: hours === "Custom" ? customHours : hours || "—" },
                  { label: "Price", value: priceRange || "—" },
                  { label: "Social", value: [instagram, facebook, tiktok].filter(Boolean).join(", ") || "—" },
                  { label: "Ownership", value: ownershipDesignations.join(", ") || "—" },
                  { label: "Vibes", value: selectedVibes.join(", ") || "—" },
                  { label: "Status", value: LISTING_STATUSES.find(s => s.value === listingStatus)?.label ?? listingStatus },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4 px-4 py-2.5">
                    <span className="text-xs font-bold text-[#3A1F0E]/40 w-24 shrink-0 pt-0.5">{label}</span>
                    <span className="text-sm text-[#3A1F0E] break-words">{value}</span>
                  </div>
                ))}
              </div>
              {listingStatus === "live_unclaimed" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
                  This business will appear on the map immediately. Address will be auto-geocoded. The owner can claim the listing later through the standard claim flow.
                </div>
              )}
              {listingStatus === "staged" && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-800">
                  This business will be saved but not shown publicly. You can edit and publish it later from the admin Businesses tab.
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-[#2B1507]/10 flex items-center justify-between shrink-0 bg-white">
          <button
            onClick={step === "basic" ? onClose : prev}
            className="flex items-center gap-1 text-sm font-medium text-[#3A1F0E]/60 hover:text-[#3A1F0E] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === "basic" ? "Cancel" : "Back"}
          </button>

          {step !== "review" ? (
            <button
              onClick={next}
              className="flex items-center gap-1.5 bg-[#2B1507] text-[#F5EBD8] rounded-full px-6 py-2.5 text-sm font-bold hover:bg-[#3A1F0E] transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || checkingDup}
              className="flex items-center gap-2 bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-50 text-white rounded-full px-8 py-2.5 text-sm font-bold transition-colors"
            >
              {submitting || checkingDup
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {checkingDup ? "Checking…" : "Saving…"}</>
                : <><CheckCircle className="w-4 h-4" /> Save Business</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
