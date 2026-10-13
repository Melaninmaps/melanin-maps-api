import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2, ShieldCheck } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import {
  buildDocumentedDiscoveryQualification,
  type QualificationOwnershipSourceKind,
} from "@/lib/documentedDiscoveryQualification";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type QualificationBusiness = Readonly<{
  name: string;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  ownershipDesignations: string[];
  isDuplicate: boolean;
}>;

type Props = Readonly<{
  businessId: string;
  business: QualificationBusiness;
  onSaved: () => void;
  onMessage: (message: string) => void;
}>;

const inputCls = "w-full rounded-xl border border-[#2B1507]/15 bg-white px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:border-[#CA922B] focus:outline-none";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60";

function isoDateWithOffset(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function asHttps(value: string | null): string {
  return value?.trim().startsWith("https://") ? value.trim() : "";
}

export function AdminKinfolkQualification({ businessId, business, onSaved, onMessage }: Props) {
  const initialSocial = useMemo(() => [business.instagram, business.facebook, business.tiktok]
    .map(asHttps).find(Boolean) ?? "", [business.facebook, business.instagram, business.tiktok]);
  const [ownershipSourceUrl, setOwnershipSourceUrl] = useState("");
  const [ownershipSourceLabel, setOwnershipSourceLabel] = useState("");
  const [ownershipSourceKind, setOwnershipSourceKind] = useState<QualificationOwnershipSourceKind>("approved_public");
  const [officialWebsiteUrl, setOfficialWebsiteUrl] = useState(asHttps(business.website));
  const [officialSocialUrl, setOfficialSocialUrl] = useState(initialSocial);
  const [observedOn, setObservedOn] = useState(isoDateWithOffset(0));
  const [ownershipExpiresOn, setOwnershipExpiresOn] = useState(isoDateWithOffset(365));
  const [reviewOn, setReviewOn] = useState(isoDateWithOffset(180));
  const [decisionReason, setDecisionReason] = useState("");
  const [batchReference, setBatchReference] = useState("KINFOLK_DIRECTORY_COMPLETION_20261013_BATCH_001");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setOfficialWebsiteUrl(asHttps(business.website));
    setOfficialSocialUrl(initialSocial);
  }, [business.website, initialSocial]);

  if (business.isDuplicate) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Duplicate review required.</strong> A retained duplicate cannot receive a Kinfolk qualification until the existing canonical record is resolved through the dedicated duplicate workflow.</div>;
  }

  async function qualify() {
    setError("");
    if (!confirmed) { setError("Confirm that every source on this decision was opened and identity-matched before submitting."); return; }
    let payload;
    try {
      payload = buildDocumentedDiscoveryQualification({
        businessName: business.name,
        ownershipDesignations: business.ownershipDesignations,
        ownershipSourceUrl,
        ownershipSourceLabel,
        ownershipSourceKind,
        officialWebsiteUrl,
        officialSocialUrl,
        observedOn,
        ownershipExpiresOn,
        reviewOn,
        decisionReason,
        batchReference,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The qualification evidence is incomplete.");
      return;
    }
    setSaving(true);
    try {
      const response = await authenticatedFetch(`${BASE}/api/admin/businesses/${businessId}/documented-discovery-eligibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) { setError(data.error ?? "Kinfolk qualification failed."); return; }
      onMessage(data.message ?? "Documented Kinfolk qualification saved with immutable evidence and ledger audit events.");
      onSaved();
    } catch {
      setError("Could not save the Kinfolk qualification. Check the connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="space-y-5">
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"><strong>Documented Kinfolk qualification.</strong> This writes one transactional eligibility decision, its immutable source receipts, and its reconciliation-ledger audit event. It does not change lifecycle, raw ownership labels, claims, duplicate status, coordinates, or map pins.</div>
    <div className="rounded-xl bg-[#FAF6EF] p-3 text-xs text-[#3A1F0E]/70"><strong>Recorded designation{business.ownershipDesignations.length === 1 ? "" : "s"}:</strong> {business.ownershipDesignations.join(" · ") || "None — resolve ownership evidence before qualifying."}</div>
    <div><label className={labelCls}>Ownership evidence source URL</label><input className={inputCls} type="url" placeholder="https://public-source.example/entry" value={ownershipSourceUrl} onChange={(event) => setOwnershipSourceUrl(event.target.value)} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label className={labelCls}>Ownership source label</label><input className={inputCls} placeholder="Dated directory, official statement, or owner source" value={ownershipSourceLabel} onChange={(event) => setOwnershipSourceLabel(event.target.value)} /></div><div><label className={labelCls}>Ownership evidence type</label><select className={inputCls} value={ownershipSourceKind} onChange={(event) => setOwnershipSourceKind(event.target.value as QualificationOwnershipSourceKind)}><option value="approved_public">Credible ownership-specific public directory</option><option value="business_official">Business official statement</option><option value="owner_official">Owner official statement</option></select></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label className={labelCls}>Official website, if verified</label><input className={inputCls} type="url" placeholder="https://business.example/" value={officialWebsiteUrl} onChange={(event) => setOfficialWebsiteUrl(event.target.value)} /></div><div><label className={labelCls}>Official social profile, if verified</label><input className={inputCls} type="url" placeholder="https://www.instagram.com/business" value={officialSocialUrl} onChange={(event) => setOfficialSocialUrl(event.target.value)} /></div></div>
    <div className="grid gap-4 sm:grid-cols-3"><div><label className={labelCls}>Sources observed</label><input className={inputCls} type="date" value={observedOn} onChange={(event) => setObservedOn(event.target.value)} /></div><div><label className={labelCls}>Ownership review expiry</label><input className={inputCls} type="date" value={ownershipExpiresOn} onChange={(event) => setOwnershipExpiresOn(event.target.value)} /></div><div><label className={labelCls}>Next review</label><input className={inputCls} type="date" value={reviewOn} onChange={(event) => setReviewOn(event.target.value)} /></div></div>
    <div><label className={labelCls}>Decision reason</label><textarea className={`${inputCls} resize-none`} rows={3} placeholder="State the exact name, location, phone, domain, or official-profile signals that prove the sources match this retained business." value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} /></div>
    <div><label className={labelCls}>Batch reference</label><input className={inputCls} maxLength={160} value={batchReference} onChange={(event) => setBatchReference(event.target.value)} /></div>
    <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-950"><input className="mt-0.5" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I opened each source above and matched it to this exact existing business. I am not inferring ownership from a name, photograph, community affiliation, or customer base.</span></label>
    {error && <p className="flex items-center gap-1 text-sm text-red-700"><AlertTriangle className="h-4 w-4" />{error}</p>}
    <button type="button" disabled={saving || business.ownershipDesignations.length === 0} onClick={() => void qualify()} className="inline-flex items-center gap-2 rounded-full bg-[#2B1507] px-5 py-2.5 text-sm font-bold text-[#F5EBD8] disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{saving ? "Recording qualification…" : "Qualify for Kinfolk Recommended"}</button>
    <p className="flex items-start gap-2 text-xs text-[#3A1F0E]/55"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />An official website alone is sufficient when identity-matched. A missing social account does not block this decision; an address and map pin remain separate controlled work.</p>
  </div>;
}
