import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, Award, Check, ChevronLeft, ChevronRight, Compass, Image,
  Info, Loader2, Share2, Store, X, ClipboardCheck, ShieldCheck,
  FileText, Plus,
} from "lucide-react";
import { AdminBusinessMediaStep } from "./AdminBusinessMediaStep";
import { OwnershipDesignationCombobox } from "./OwnershipDesignationCombobox";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import {
  BUSINESS_CATEGORY_TAXONOMY,
  OWNERSHIP_DESIGNATIONS,
  VIBES_BY_CATEGORY,
  VIBE_ELIGIBLE_CATEGORIES,
} from "@workspace/constants";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Tab = "info" | "social" | "identity" | "discovery" | "sources" | "catalog" | "photos";
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "info", label: "Info", icon: <Info className="h-4 w-4" /> },
  { id: "social", label: "Social", icon: <Share2 className="h-4 w-4" /> },
  { id: "identity", label: "Identity", icon: <Award className="h-4 w-4" /> },
  { id: "discovery", label: "Discovery", icon: <Compass className="h-4 w-4" /> },
  { id: "sources", label: "Sources", icon: <FileText className="h-4 w-4" /> },
  { id: "catalog", label: "Catalog", icon: <ClipboardCheck className="h-4 w-4" /> },
  { id: "photos", label: "Photos", icon: <Image className="h-4 w-4" /> },
];

type OwnershipReceipt = {
  sourceUrl: string;
  sourceLabel: string;
  observedAt: string;
  note: string | null;
  createdAt?: string;
};

type FieldReceipt = {
  field: "identity" | "description" | "category" | "hours" | "phone" | "address" | "website" | "instagram" | "tiktok" | "facebook" | "service_tags" | "ownership";
  sourceUrl: string;
  sourceLabel: string;
  observedAt: string;
  confidence: "high" | "medium" | "low";
  note: string | null;
  createdAt?: string;
};

type ProfileAuditEvent = {
  changedFields: string[];
  changeNote: string;
  actorUserId: string | null;
  createdAt: string;
};

type CatalogMembership = {
  state: "intake" | "review" | "ready" | "held" | "removed";
  reason: string;
  updated_at?: string;
  updatedAt?: string;
} | null;

type CatalogState = NonNullable<CatalogMembership>["state"];

type FullBusiness = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
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
  ownershipDesignations: string[];
  vibes: string[];
  tags: string[];
  category: string | null;
  subcategory: string | null;
  photos: string[];
  listingStatus: "live_unclaimed" | "live_claimed" | "archived" | "staged" | null;
  isDuplicate: boolean;
};

type Props = {
  businessId: string;
  businessName: string;
  onClose: () => void;
  onSaved: () => void;
};

const inputCls = "w-full rounded-xl border border-[#2B1507]/15 bg-white px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:border-[#CA922B] focus:outline-none";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60";

export function AdminEditBusiness({ businessId, businessName, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>("info");
  const [biz, setBiz] = useState<FullBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

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
  const [changeNote, setChangeNote] = useState("");
  const [ownershipReceipt, setOwnershipReceipt] = useState<OwnershipReceipt>({
    sourceUrl: "", sourceLabel: "", observedAt: "", note: null,
  });
  const [sourceReceipts, setSourceReceipts] = useState<FieldReceipt[]>([]);
  const [existingFieldReceipts, setExistingFieldReceipts] = useState<FieldReceipt[]>([]);
  const [profileAudit, setProfileAudit] = useState<ProfileAuditEvent[]>([]);
  const [catalogMembership, setCatalogMembership] = useState<CatalogMembership>(null);
  const [catalogState, setCatalogState] = useState<CatalogState>("intake");
  const [catalogReason, setCatalogReason] = useState("");
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [listingStatus, setListingStatus] = useState<"live_unclaimed" | "live_claimed" | "archived" | "staged">("live_unclaimed");
  const [listingReason, setListingReason] = useState("");
  const [listingSaving, setListingSaving] = useState(false);

  const hydrate = useCallback((data: { business?: FullBusiness; ownershipReceipt?: OwnershipReceipt | null; catalogMembership?: CatalogMembership; fieldReceipts?: FieldReceipt[]; profileAudit?: ProfileAuditEvent[] }) => {
    const b = data.business;
    if (!b) throw new Error("Not found");
    setBiz(b);
    setName(b.name ?? ""); setDescription(b.description ?? ""); setAddress(b.address ?? "");
    setCity(b.city ?? ""); setState(b.state ?? ""); setPhone(b.phone ?? "");
    setWebsite(b.website ?? ""); setHours(b.hours ?? ""); setPriceRange(b.priceRange ?? "");
    setInstagram(b.instagram ?? ""); setTiktok(b.tiktok ?? ""); setFacebook(b.facebook ?? "");
    setTwitter(b.twitter ?? ""); setYoutube(b.youtube ?? ""); setPinterest(b.pinterest ?? "");
    setOwnershipDesignations(b.ownershipDesignations ?? []); setCategory(b.category ?? "");
    setSubcategory(b.subcategory ?? ""); setSelectedVibes(b.vibes ?? []); setSelectedTags(b.tags ?? []);
    setOwnershipReceipt(data.ownershipReceipt ?? { sourceUrl: "", sourceLabel: "", observedAt: "", note: null });
    setExistingFieldReceipts(Array.isArray(data.fieldReceipts) ? data.fieldReceipts : []);
    setProfileAudit(Array.isArray(data.profileAudit) ? data.profileAudit : []);
    setCatalogMembership(data.catalogMembership ?? null);
    setCatalogState(data.catalogMembership?.state ?? "intake");
    setCatalogReason(data.catalogMembership?.reason ?? "");
    setListingStatus(b.listingStatus ?? "live_unclaimed");
  }, []);

  const fetchBiz = useCallback(async () => {
    setLoading(true); setFetchError("");
    try {
      const response = await authenticatedFetch(`${BASE}/api/admin/businesses/${businessId}/profile`);
      const data = await response.json() as { error?: string; business?: FullBusiness; ownershipReceipt?: OwnershipReceipt | null; catalogMembership?: CatalogMembership; fieldReceipts?: FieldReceipt[]; profileAudit?: ProfileAuditEvent[] };
      if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
      hydrate(data);
    } catch {
      setFetchError("Could not load the administrator business profile. Confirm admin access and try again.");
    } finally { setLoading(false); }
  }, [businessId, hydrate]);

  useEffect(() => { void fetchBiz(); }, [fetchBiz]);
  useEffect(() => {
    if (biz && category !== biz.category) { setSubcategory(""); setSelectedVibes([]); }
  }, [biz, category]);

  async function saveProfile() {
    setSaving(true); setSaveError(""); setSavedMessage("");
    try {
      const body: Record<string, unknown> = {
        name, description, address: address || null, city, state: state || null,
        phone: phone || null, website: website || null, hours: hours || null, priceRange: priceRange || null,
        instagram: instagram || null, tiktok: tiktok || null, facebook: facebook || null,
        twitter: twitter || null, youtube: youtube || null, pinterest: pinterest || null,
        ownershipDesignations, category, subcategory, vibes: selectedVibes, tags: selectedTags, changeNote,
      };
      if (ownershipReceipt.sourceUrl || ownershipReceipt.sourceLabel || ownershipReceipt.observedAt || ownershipReceipt.note) {
        body.ownershipReceipt = ownershipReceipt;
      }
      body.sourceReceipts = sourceReceipts.filter((receipt) => (
        receipt.sourceUrl || receipt.sourceLabel || receipt.observedAt || receipt.note
      ));
      const response = await authenticatedFetch(`${BASE}/api/admin/businesses/${businessId}/profile`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await response.json() as { error?: string; business?: FullBusiness; message?: string };
      if (!response.ok) { setSaveError(data.error ?? "Profile save failed."); return; }
      if (data.business) setBiz(data.business);
      setSavedMessage(data.message ?? "Profile saved with an audit receipt.");
      setChangeNote("");
      setSourceReceipts([]);
      await fetchBiz();
      onSaved();
    } catch { setSaveError("Could not save this business. Check the connection and try again."); }
    finally { setSaving(false); }
  }

  async function saveCatalogMembership() {
    setCatalogSaving(true); setSaveError(""); setSavedMessage("");
    try {
      const response = await authenticatedFetch(`${BASE}/api/admin/kinfolk-catalog/${businessId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: catalogState, reason: catalogReason }),
      });
      const data = await response.json() as { error?: string; membership?: CatalogMembership };
      if (!response.ok) { setSaveError(data.error ?? "Catalog update failed."); return; }
      setCatalogMembership(data.membership ?? { state: catalogState, reason: catalogReason });
      setSavedMessage("Kinfolk Catalog membership saved with an audit receipt. No listing status changed.");
      onSaved();
    } catch { setSaveError("Could not update the Kinfolk Catalog membership."); }
    finally { setCatalogSaving(false); }
  }

  async function saveListingStatus() {
    if (!listingReason.trim()) { setSaveError("A lifecycle reason is required before changing listing status."); return; }
    setListingSaving(true); setSaveError(""); setSavedMessage("");
    try {
      const response = await authenticatedFetch(`${BASE}/api/admin/businesses/${businessId}/listing-status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingStatus, reason: listingReason }),
      });
      const data = await response.json() as { error?: string; listingStatus?: string };
      if (!response.ok) { setSaveError(data.error ?? "Lifecycle update failed."); return; }
      setListingStatus((data.listingStatus ?? listingStatus) as typeof listingStatus);
      setListingReason("");
      setSavedMessage("Listing lifecycle updated through its separate reversible audit workflow.");
      onSaved();
    } catch { setSaveError("Could not update the listing lifecycle."); }
    finally { setListingSaving(false); }
  }

  const selectedCategory = BUSINESS_CATEGORY_TAXONOMY.find((item) => item.name === category);
  const hasLegacyCategory = Boolean(category && !BUSINESS_CATEGORY_TAXONOMY.some((item) => item.name === category));
  const vibeEligible = VIBE_ELIGIBLE_CATEGORIES.includes(category);
  const tabIndex = TABS.findIndex((item) => item.id === tab);
  const toggleVibe = (vibe: string) => setSelectedVibes((current) => current.includes(vibe) ? current.filter((item) => item !== vibe) : [...current, vibe]);
  const addTag = () => { const value = tagInput.trim(); if (value && !selectedTags.includes(value)) setSelectedTags((current) => [...current, value]); setTagInput(""); };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="shrink-0 bg-[#2B1507] px-5 py-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2.5"><Store className="h-5 w-5 text-[#CA922B]" /><div><h2 className="font-serif text-base font-bold leading-tight text-white">{businessName}</h2><p className="text-xs text-[#F5EBD8]/50">Admin profile editor — audited changes only</p></div></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><X className="h-4 w-4 text-[#F5EBD8]" /></button></div>
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1">{TABS.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${tab === item.id ? "bg-[#CA922B] text-white" : "text-[#F5EBD8]/50 hover:bg-white/10 hover:text-[#F5EBD8]"}`}>{item.icon}{item.label}</button>)}</div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#CA922B]" /></div> : fetchError ? <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"><AlertTriangle className="h-5 w-5 shrink-0" />{fetchError}<button type="button" onClick={() => void fetchBiz()} className="ml-auto underline">Retry</button></div> : <>
            {tab === "info" && <div className="space-y-4"><div><label className={labelCls}>Business name</label><input className={inputCls} value={name} onChange={(event) => setName(event.target.value)} /></div><div><label className={labelCls}>Description</label><textarea className={`${inputCls} resize-none`} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className={labelCls}>Phone</label><input className={inputCls} value={phone} onChange={(event) => setPhone(event.target.value)} /></div><div><label className={labelCls}>Website</label><input className={inputCls} type="url" placeholder="https://" value={website} onChange={(event) => setWebsite(event.target.value)} /></div></div><div><label className={labelCls}>Address</label><input className={inputCls} value={address} onChange={(event) => setAddress(event.target.value)} /><p className="mt-1 text-xs text-[#3A1F0E]/50">Changing an address clears any old map pin. A new pin requires separate, audited geocode evidence.</p></div><div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>City</label><input className={inputCls} value={city} onChange={(event) => setCity(event.target.value)} /></div><div><label className={labelCls}>State / region</label><input className={inputCls} value={state} onChange={(event) => setState(event.target.value)} /></div></div><div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>Hours</label><input className={inputCls} value={hours} onChange={(event) => setHours(event.target.value)} /></div><div><label className={labelCls}>Price range</label><select className={inputCls} value={priceRange} onChange={(event) => setPriceRange(event.target.value)}><option value="">Select</option>{["$", "$$", "$$$", "$$$$"].map((price) => <option key={price} value={price}>{price}</option>)}</select></div></div></div>}
            {tab === "social" && <div className="space-y-4">{([{ label: "Instagram", value: instagram, set: setInstagram, placeholder: "@handle or official URL" }, { label: "TikTok", value: tiktok, set: setTiktok, placeholder: "@handle or official URL" }, { label: "Facebook", value: facebook, set: setFacebook, placeholder: "Official URL or handle" }, { label: "X / Twitter", value: twitter, set: setTwitter, placeholder: "@handle or official URL" }, { label: "YouTube", value: youtube, set: setYoutube, placeholder: "Channel URL or @handle" }, { label: "Pinterest", value: pinterest, set: setPinterest, placeholder: "@handle or official URL" }] as const).map(({ label, value, set, placeholder }) => <div key={label}><label className={labelCls}>{label}</label><input className={inputCls} value={value} placeholder={placeholder} onChange={(event) => set(event.target.value)} /></div>)}</div>}
            {tab === "identity" && <div className="space-y-5"><div><label className={labelCls}>Category</label><select className={inputCls} value={category} onChange={(event) => setCategory(event.target.value)}>{hasLegacyCategory && <option value={category}>{category} (current)</option>}{BUSINESS_CATEGORY_TAXONOMY.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></div><div><label className={labelCls}>Subcategory</label><select className={inputCls} value={subcategory} onChange={(event) => setSubcategory(event.target.value)}><option value="">Select subcategory</option>{selectedCategory?.subcategories?.map((item: string) => <option key={item} value={item}>{item}</option>)}</select></div><OwnershipDesignationCombobox id="admin-edit-ownership-designations" options={OWNERSHIP_DESIGNATIONS.map((label) => ({ value: label, label }))} values={ownershipDesignations} onChange={setOwnershipDesignations} helperText="Ownership labels require a public source receipt. They remain source-submitted until a separate documented-review decision; saving here never makes them verified." />{ownershipDesignations.length > 0 && <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-amber-900"><ShieldCheck className="h-4 w-4" />Ownership source receipt / provenance</div><div><label className={labelCls}>Public source URL</label><input className={inputCls} type="url" placeholder="https://" value={ownershipReceipt.sourceUrl} onChange={(event) => setOwnershipReceipt((current) => ({ ...current, sourceUrl: event.target.value }))} /></div><div className="grid gap-3 sm:grid-cols-2"><div><label className={labelCls}>Source label</label><input className={inputCls} placeholder="Official site, dated article, etc." value={ownershipReceipt.sourceLabel} onChange={(event) => setOwnershipReceipt((current) => ({ ...current, sourceLabel: event.target.value }))} /></div><div><label className={labelCls}>Observed on</label><input className={inputCls} type="date" value={ownershipReceipt.observedAt} onChange={(event) => setOwnershipReceipt((current) => ({ ...current, observedAt: event.target.value }))} /></div></div><div><label className={labelCls}>Receipt note (optional)</label><textarea className={`${inputCls} resize-none`} rows={2} value={ownershipReceipt.note ?? ""} onChange={(event) => setOwnershipReceipt((current) => ({ ...current, note: event.target.value || null }))} /></div></div>}</div>}
            {tab === "discovery" && <div className="space-y-6">{vibeEligible ? <div><label className={labelCls}>Vibes — {selectedVibes.length} selected</label><div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1">{(VIBES_BY_CATEGORY[category] ?? []).map((vibe) => <button key={vibe.label} type="button" title={vibe.helperText} onClick={() => toggleVibe(vibe.label)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${selectedVibes.includes(vibe.label) ? "border-[#CA922B] bg-[#CA922B] text-white" : "border-[#2B1507]/15 bg-white text-[#3A1F0E]/60"}`}>{vibe.label}</button>)}</div></div> : <div className="rounded-2xl bg-[#FAF6EF] px-4 py-4 text-sm text-[#3A1F0E]/50">Vibes are available for eligible taxonomy categories.</div>}<div><label className={labelCls}>Service tags — {selectedTags.length} added</label><div className="mb-3 flex gap-2"><input className={`${inputCls} flex-1`} value={tagInput} placeholder="e.g. vegan options" onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} /><button type="button" onClick={addTag} className="rounded-xl bg-[#CA922B] px-4 text-sm font-bold text-white">Add</button></div><div className="flex flex-wrap gap-2">{selectedTags.map((tag) => <span key={tag} className="flex items-center gap-1.5 rounded-full bg-[#2B1507]/5 px-3 py-1.5 text-xs font-bold text-[#3A1F0E]">{tag}<button type="button" onClick={() => setSelectedTags((current) => current.filter((item) => item !== tag))}><X className="h-3 w-3" /></button></span>)}</div></div></div>}
            {tab === "sources" && <div className="space-y-5"><div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"><strong>Field-level public source receipts.</strong> Every changed public fact needs a source before save. Receipts are append-only; clearing a website or social field also needs a receipt documenting why.</div><div className="space-y-3">{sourceReceipts.map((receipt, index) => <div key={index} className="rounded-2xl border border-[#2B1507]/10 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold text-[#3A1F0E]/60">New receipt {index + 1}</span><button type="button" onClick={() => setSourceReceipts((current) => current.filter((_, receiptIndex) => receiptIndex !== index))} className="text-xs text-red-700">Remove</button></div><div className="grid gap-3 sm:grid-cols-2"><select className={inputCls} value={receipt.field} onChange={(event) => setSourceReceipts((current) => current.map((item, receiptIndex) => receiptIndex === index ? { ...item, field: event.target.value as FieldReceipt["field"] } : item))}>{[["identity", "Identity / location"], ["description", "Description"], ["category", "Category"], ["hours", "Hours"], ["phone", "Phone"], ["address", "Address"], ["website", "Website"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["facebook", "Facebook"], ["service_tags", "Service tags / vibes"], ["ownership", "Ownership"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select className={inputCls} value={receipt.confidence} onChange={(event) => setSourceReceipts((current) => current.map((item, receiptIndex) => receiptIndex === index ? { ...item, confidence: event.target.value as FieldReceipt["confidence"] } : item))}>{["high", "medium", "low"].map((value) => <option key={value} value={value}>{value} confidence</option>)}</select></div><input className={`${inputCls} mt-3`} type="url" placeholder="Public source URL" value={receipt.sourceUrl} onChange={(event) => setSourceReceipts((current) => current.map((item, receiptIndex) => receiptIndex === index ? { ...item, sourceUrl: event.target.value } : item))} /><div className="mt-3 grid gap-3 sm:grid-cols-2"><input className={inputCls} placeholder="Source label" value={receipt.sourceLabel} onChange={(event) => setSourceReceipts((current) => current.map((item, receiptIndex) => receiptIndex === index ? { ...item, sourceLabel: event.target.value } : item))} /><input className={inputCls} type="date" value={receipt.observedAt} onChange={(event) => setSourceReceipts((current) => current.map((item, receiptIndex) => receiptIndex === index ? { ...item, observedAt: event.target.value } : item))} /></div><textarea className={`${inputCls} mt-3 resize-none`} rows={2} placeholder="What this source supports (optional)" value={receipt.note ?? ""} onChange={(event) => setSourceReceipts((current) => current.map((item, receiptIndex) => receiptIndex === index ? { ...item, note: event.target.value || null } : item))} /></div>)}</div><button type="button" onClick={() => setSourceReceipts((current) => [...current, { field: "identity", sourceUrl: "", sourceLabel: "", observedAt: "", confidence: "high", note: null }])} className="inline-flex items-center gap-2 rounded-full border border-[#CA922B]/40 px-4 py-2 text-sm font-bold text-[#704809]"><Plus className="h-4 w-4" />Add source receipt</button><div className="border-t border-[#2B1507]/10 pt-4"><h3 className="mb-3 text-sm font-bold text-[#3A1F0E]">Recorded sources</h3>{existingFieldReceipts.length === 0 ? <p className="text-sm text-[#3A1F0E]/50">No generic field receipts recorded yet.</p> : <div className="space-y-2">{existingFieldReceipts.slice(0, 30).map((receipt, index) => <div key={`${receipt.field}-${receipt.createdAt ?? index}`} className="rounded-xl bg-[#FAF6EF] p-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold capitalize">{receipt.field.replace(/_/g, " ")}</span><span>{receipt.confidence} confidence · {receipt.observedAt}</span></div><a href={receipt.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-[#A66B0A] hover:underline">{receipt.sourceLabel} — {receipt.sourceUrl}</a>{receipt.note && <p className="mt-1 text-[#3A1F0E]/60">{receipt.note}</p>}</div>)}</div>}</div><div className="border-t border-[#2B1507]/10 pt-4"><h3 className="mb-3 text-sm font-bold text-[#3A1F0E]">Profile edit audit</h3>{profileAudit.length === 0 ? <p className="text-sm text-[#3A1F0E]/50">No profile edit audit events recorded.</p> : <div className="space-y-2">{profileAudit.slice(0, 20).map((event, index) => <div key={`${event.createdAt}-${index}`} className="rounded-xl border border-[#2B1507]/10 p-3 text-xs"><p className="font-semibold">{event.changeNote}</p><p className="mt-1 text-[#3A1F0E]/60">{event.changedFields.join(", ")} · {new Date(event.createdAt).toLocaleString()}</p></div>)}</div>}</div></div>}
            {tab === "catalog" && <div className="space-y-6"><div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"><strong>Kinfolk Catalog is an internal intake cohort.</strong> It points to this existing canonical business only. It never creates a listing, changes public visibility, or turns a business into an owner-verified profile.</div><div><label className={labelCls}>Catalog state</label><select className={inputCls} value={catalogState} onChange={(event) => setCatalogState(event.target.value as typeof catalogState)}>{["intake", "review", "ready", "held", "removed"].map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div><label className={labelCls}>Catalog decision / review reason</label><textarea className={`${inputCls} resize-none`} rows={3} value={catalogReason} onChange={(event) => setCatalogReason(event.target.value)} placeholder="Required audit reason (3–1,000 characters)" /></div><button type="button" disabled={catalogSaving || catalogReason.trim().length < 3} onClick={() => void saveCatalogMembership()} className="inline-flex items-center gap-2 rounded-full bg-[#2B1507] px-5 py-2.5 text-sm font-bold text-[#F5EBD8] disabled:opacity-50">{catalogSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}{catalogMembership ? "Update catalog membership" : "Add existing business to catalog intake"}</button><div className="border-t border-[#2B1507]/10 pt-5"><h3 className="mb-2 text-sm font-bold text-[#3A1F0E]">Listing lifecycle — separate audited control</h3><p className="mb-3 text-xs text-[#3A1F0E]/55">This is the only control here that can change public discovery. It is reversible and requires its own reason.</p><select className={inputCls} value={listingStatus} onChange={(event) => setListingStatus(event.target.value as typeof listingStatus)}>{["live_unclaimed", "live_claimed", "staged", "archived"].map((item) => <option key={item} value={item}>{item}</option>)}</select><textarea className={`${inputCls} mt-3 resize-none`} rows={2} value={listingReason} onChange={(event) => setListingReason(event.target.value)} placeholder="Lifecycle reason (3–1,000 characters)" /><button type="button" disabled={listingSaving || listingReason.trim().length < 3} onClick={() => void saveListingStatus()} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#CA922B]/40 px-5 py-2.5 text-sm font-bold text-[#704809] disabled:opacity-50">{listingSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Apply audited lifecycle change</button></div></div>}
            {tab === "photos" && biz && <AdminBusinessMediaStep businessId={businessId} businessName={businessName} onDone={() => { onSaved(); onClose(); }} showSuccessBanner={false} />}
          </>}
        </div>
        {tab !== "photos" && !loading && !fetchError && <div className="flex shrink-0 items-center gap-3 border-t border-[#2B1507]/8 bg-white px-5 py-4"><button type="button" onClick={() => setTab(TABS[Math.max(0, tabIndex - 1)].id)} disabled={tabIndex === 0} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2B1507]/15 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><div className="flex-1 text-center">{saveError && <p className="flex items-center justify-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3.5 w-3.5" />{saveError}</p>}{savedMessage && <p className="flex items-center justify-center gap-1 text-xs text-green-700"><Check className="h-3.5 w-3.5" />{savedMessage}</p>}</div><button type="button" onClick={() => setTab(TABS[Math.min(TABS.length - 1, tabIndex + 1)].id)} disabled={tabIndex === TABS.length - 1} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2B1507]/15 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button><button type="button" onClick={() => void saveProfile()} disabled={saving || !name.trim() || !changeNote.trim() || tab === "catalog"} className="inline-flex items-center gap-2 rounded-full bg-[#2B1507] px-5 py-2.5 text-sm font-bold text-[#F5EBD8] disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Save profile</button></div>}
        {tab !== "photos" && !loading && !fetchError && <div className="shrink-0 border-t border-[#2B1507]/5 bg-[#FAF6EF] px-5 py-3"><label className={labelCls}>Profile edit note — required for audit</label><input className={inputCls} value={changeNote} onChange={(event) => setChangeNote(event.target.value)} placeholder="What changed and why?" maxLength={1000} /></div>}
      </div>
    </div>
  );
}
