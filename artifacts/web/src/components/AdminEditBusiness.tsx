/**
 * AdminEditBusiness — full-featured edit modal for any business already in the DB.
 *
 * Fetches the full business record on open, then lets admin update:
 *   Tab 1 — Info:       name, description, address, hours, price range, phone, website
 *   Tab 2 — Social:     Instagram, TikTok, Facebook, Twitter/X, YouTube, Pinterest
 *   Tab 3 — Identity:   ownership designations, category, subcategory
 *   Tab 4 — Discovery:  vibes (category-gated), tags
 *   Tab 5 — Photos:     photo upload + social media link paste (reuses AdminBusinessMediaStep)
 *
 * Saves via PATCH /api/admin/businesses/:id/profile (no new API needed).
 * Works on mobile — designed for the tour workflow.
 */
import { useState, useEffect, useCallback } from "react";
import {
  X, Loader2, Store, Info, Share2, Award, Compass, Image,
  Check, AlertTriangle, ChevronLeft, ChevronRight
} from "lucide-react";
import { AdminBusinessMediaStep } from "./AdminBusinessMediaStep";
import {
  BUSINESS_CATEGORY_TAXONOMY,
  VIBES_BY_CATEGORY,
  VIBE_ELIGIBLE_CATEGORIES,
  OWNERSHIP_DESIGNATIONS,
} from "@workspace/db";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Tab = "info" | "social" | "identity" | "discovery" | "photos";
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "info",      label: "Info",      icon: <Info className="w-4 h-4" /> },
  { id: "social",    label: "Social",    icon: <Share2 className="w-4 h-4" /> },
  { id: "identity",  label: "Identity",  icon: <Award className="w-4 h-4" /> },
  { id: "discovery", label: "Discovery", icon: <Compass className="w-4 h-4" /> },
  { id: "photos",    label: "Photos",    icon: <Image className="w-4 h-4" /> },
];

interface FullBusiness {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  priceRange: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  pinterest: string | null;
  primarySocialPlatform: string | null;
  ownerName: string | null;
  businessTagline: string | null;
  ownerBio: string | null;
  ownerStory: string | null;
  ownershipDesignations: string[];
  blackOwned: boolean;
  vibes: string[];
  tags: string[];
  category: string;
  subcategory: string | null;
  photos: string[];
}

interface Props {
  businessId: string;
  businessName: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminEditBusiness({ businessId, businessName, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>("info");
  const [biz, setBiz] = useState<FullBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Editable field state — initialised from fetched biz
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [hours, setHours] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [pinterest, setPinterest] = useState("");
  const [ownershipDesignations, setOwnershipDesignations] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  // Fetch full business details
  const fetchBiz = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`${BASE}/api/businesses/${businessId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { business?: FullBusiness };
      const b = data.business;
      if (!b) throw new Error("Not found");
      setBiz(b);
      // Populate form
      setName(b.name ?? "");
      setDescription(b.description ?? "");
      setAddress(b.address ?? "");
      setCity(b.city ?? "");
      setState(b.state ?? "");
      setPhone(b.phone ?? "");
      setWebsite(b.website ?? "");
      setHours(b.hours ?? "");
      setPriceRange(b.priceRange ?? "");
      setInstagram(b.instagram ?? "");
      setTiktok(b.tiktok ?? "");
      setFacebook(b.facebook ?? "");
      setTwitter(b.twitter ?? "");
      setYoutube(b.youtube ?? "");
      setPinterest(b.pinterest ?? "");
      setOwnershipDesignations(b.ownershipDesignations ?? []);
      setCategory(b.category ?? "");
      setSubcategory(b.subcategory ?? "");
      setSelectedVibes(b.vibes ?? []);
      setSelectedTags(b.tags ?? []);
    } catch (e) {
      setFetchError("Could not load business details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { void fetchBiz(); }, [fetchBiz]);

  // Reset subcategory / vibes when category changes
  useEffect(() => {
    if (biz && category !== biz.category) {
      setSubcategory("");
      setSelectedVibes([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function save() {
    setSaving(true);
    setSaveError("");
    setSavedOk(false);
    try {
      const body: Record<string, unknown> = {
        name, description, address, city, state,
        phone: phone || null, website: website || null,
        hours: hours || null, priceRange: priceRange || null,
        instagram: instagram || null, tiktok: tiktok || null,
        facebook: facebook || null, twitter: twitter || null,
        youtube: youtube || null, pinterest: pinterest || null,
        ownershipDesignations,
        blackOwned: ownershipDesignations.some(d => d.toLowerCase().includes("black")),
        category, subcategory: subcategory || null,
        vibes: selectedVibes, tags: selectedTags,
      };
      const res = await fetch(`${BASE}/api/admin/businesses/${businessId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setSaveError(data.error ?? "Save failed."); return; }
      setSavedOk(true);
      onSaved();
      setTimeout(() => setSavedOk(false), 3000);
    } finally {
      setSaving(false);
    }
  }

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

  function addTag() {
    const t = tagInput.trim();
    if (t && !selectedTags.includes(t)) {
      setSelectedTags(prev => [...prev, t]);
    }
    setTagInput("");
  }

  const selectedCategoryData = BUSINESS_CATEGORY_TAXONOMY.find(c => c.name === category);
  const vibeEligible = VIBE_ELIGIBLE_CATEGORIES.includes(category);
  const availableVibes = VIBES_BY_CATEGORY[category] ?? [];

  const inputCls = "w-full border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B] bg-white";
  const labelCls = "block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5";

  const tabIdx = TABS.findIndex(t => t.id === tab);

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
        <div className="bg-[#2B1507] px-5 py-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <Store className="w-5 h-5 text-[#CA922B]" />
              <div>
                <h2 className="font-serif font-bold text-white text-base leading-tight">{businessName}</h2>
                <p className="text-[#F5EBD8]/50 text-xs">Edit business</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 shrink-0">
              <X className="w-4 h-4 text-[#F5EBD8]" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
                  tab === t.id
                    ? "bg-[#CA922B] text-white"
                    : "text-[#F5EBD8]/50 hover:text-[#F5EBD8] hover:bg-white/10"
                }`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#CA922B]" />
            </div>
          ) : fetchError ? (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
              <AlertTriangle className="w-5 h-5 shrink-0" /> {fetchError}
              <button onClick={() => void fetchBiz()} className="ml-auto underline text-xs">Retry</button>
            </div>
          ) : (
            <>
              {/* ── Tab: Info ──────────────────────────────────────────── */}
              {tab === "info" && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Business Name</label>
                    <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Business name" />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea className={`${inputCls} resize-none`} rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="What makes this business special?" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000" />
                    </div>
                    <div>
                      <label className={labelCls}>Website</label>
                      <input className={inputCls} type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Address</label>
                    <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>City</label>
                      <input className={inputCls} value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
                    </div>
                    <div>
                      <label className={labelCls}>State</label>
                      <input className={inputCls} value={state} onChange={e => setState(e.target.value)} placeholder="VA" maxLength={2} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Hours</label>
                      <input className={inputCls} value={hours} onChange={e => setHours(e.target.value)} placeholder="Mon–Fri 9am–6pm" />
                    </div>
                    <div>
                      <label className={labelCls}>Price Range</label>
                      <select className={inputCls} value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                        <option value="">Select</option>
                        {["$", "$$", "$$$", "$$$$"].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Social ────────────────────────────────────────── */}
              {tab === "social" && (
                <div className="space-y-4">
                  {([
                    { label: "Instagram", key: "instagram", value: instagram, set: setInstagram, prefix: "@" },
                    { label: "TikTok", key: "tiktok", value: tiktok, set: setTiktok, prefix: "@" },
                    { label: "Facebook", key: "facebook", value: facebook, set: setFacebook, prefix: "URL or handle" },
                    { label: "Twitter / X", key: "twitter", value: twitter, set: setTwitter, prefix: "@" },
                    { label: "YouTube", key: "youtube", value: youtube, set: setYoutube, prefix: "Channel URL or @handle" },
                    { label: "Pinterest", key: "pinterest", value: pinterest, set: setPinterest, prefix: "@" },
                  ] as const).map(({ label, value, set, prefix }) => (
                    <div key={label}>
                      <label className={labelCls}>{label}</label>
                      <input
                        className={inputCls}
                        value={value as string}
                        onChange={e => set(e.target.value)}
                        placeholder={prefix as string}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Tab: Identity ──────────────────────────────────────── */}
              {tab === "identity" && (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Category</label>
                    <select className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="">Select category</option>
                      {BUSINESS_CATEGORY_TAXONOMY.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedCategoryData?.subcategories && selectedCategoryData.subcategories.length > 0 && (
                    <div>
                      <label className={labelCls}>Subcategory</label>
                      <select className={inputCls} value={subcategory} onChange={e => setSubcategory(e.target.value)}>
                        <option value="">Select subcategory</option>
                        {selectedCategoryData.subcategories.map((s: string) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Ownership Designations</label>
                    <p className="text-xs text-[#3A1F0E]/40 mb-3">Select all that apply</p>
                    <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto pr-1">
                      {OWNERSHIP_DESIGNATIONS.map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleOwnership(d)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                            ownershipDesignations.includes(d)
                              ? "bg-[#2B1507] text-[#F5EBD8] border-[#2B1507]"
                              : "bg-white text-[#3A1F0E]/60 border-[#2B1507]/15 hover:border-[#CA922B]/50"
                          }`}
                        >
                          {ownershipDesignations.includes(d) && <Check className="w-3 h-3 inline mr-1" />}
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Discovery ─────────────────────────────────────── */}
              {tab === "discovery" && (
                <div className="space-y-6">
                  {/* Vibes */}
                  {vibeEligible ? (
                    <div>
                      <label className={labelCls}>Vibes — {selectedVibes.length} selected</label>
                      <p className="text-xs text-[#3A1F0E]/40 mb-3">Select the vibes that best describe this place</p>
                      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
                        {availableVibes.map((v: string) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => toggleVibe(v)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                              selectedVibes.includes(v)
                                ? "bg-[#CA922B] text-white border-[#CA922B]"
                                : "bg-white text-[#3A1F0E]/60 border-[#2B1507]/15 hover:border-[#CA922B]/50"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#FAF6EF] rounded-2xl px-4 py-4 text-sm text-[#3A1F0E]/50">
                      Vibes are available for Restaurant, Retail, and Experience categories. Change the category in the Identity tab to unlock vibes.
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <label className={labelCls}>Tags — {selectedTags.length} added</label>
                    <p className="text-xs text-[#3A1F0E]/40 mb-3">Type a tag and press Enter or Add</p>
                    <div className="flex gap-2 mb-3">
                      <input
                        className={`${inputCls} flex-1`}
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                        placeholder="e.g. Soul Food, Family Friendly…"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        disabled={!tagInput.trim()}
                        className="px-4 py-2.5 bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-40 text-white rounded-xl text-sm font-bold transition-colors shrink-0"
                      >
                        Add
                      </button>
                    </div>
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map(t => (
                          <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B1507]/5 rounded-full text-xs font-bold text-[#3A1F0E]">
                            {t}
                            <button
                              type="button"
                              onClick={() => setSelectedTags(prev => prev.filter(x => x !== t))}
                              className="text-[#3A1F0E]/40 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Photos ────────────────────────────────────────── */}
              {tab === "photos" && biz && (
                <AdminBusinessMediaStep
                  businessId={businessId}
                  businessName={businessName}
                  onDone={() => { onSaved(); onClose(); }}
                  showSuccessBanner={false}
                />
              )}
            </>
          )}
        </div>

        {/* Footer — save + nav (hidden on Photos tab, which has its own Done) */}
        {tab !== "photos" && !loading && !fetchError && (
          <div className="shrink-0 px-5 py-4 border-t border-[#2B1507]/8 bg-white flex items-center gap-3">
            {/* Prev tab */}
            <button
              onClick={() => setTab(TABS[Math.max(0, tabIdx - 1)].id)}
              disabled={tabIdx === 0}
              className="w-9 h-9 rounded-full border border-[#2B1507]/15 flex items-center justify-center text-[#3A1F0E]/40 hover:border-[#CA922B]/50 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 text-center">
              {saveError && (
                <p className="text-xs text-red-600 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {saveError}
                </p>
              )}
              {savedOk && (
                <p className="text-xs text-green-700 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </p>
              )}
            </div>

            {/* Next tab */}
            <button
              onClick={() => setTab(TABS[Math.min(TABS.length - 1, tabIdx + 1)].id)}
              disabled={tabIdx === TABS.length - 1}
              className="w-9 h-9 rounded-full border border-[#2B1507]/15 flex items-center justify-center text-[#3A1F0E]/40 hover:border-[#CA922B]/50 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => void save()}
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 bg-[#2B1507] hover:bg-[#3A1F0E] disabled:opacity-50 text-[#F5EBD8] rounded-full px-6 py-2.5 text-sm font-bold transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
