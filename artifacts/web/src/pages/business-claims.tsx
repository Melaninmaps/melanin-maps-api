import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Clock3, Shield } from "lucide-react";
import { Layout } from "@/components/layout";

const BASE = import.meta.env.BASE_URL;
type Claim = {
  id: string; business_id: string; business_name: string | null; city: string | null; state: string | null;
  status: string; role: string; created_at: string; decision_reason: string | null;
  contact_verification_status?: "verified" | "code_issued" | "not_requested" | "unavailable";
};

export default function BusinessClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE}api/me/business-claims`, { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({})) as { claims?: Claim[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load your claims.");
      setClaims(data.claims ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load your claims."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const requestCode = async (claimId: string) => {
    setRequesting(claimId); setError(null);
    try {
      const response = await fetch(`${BASE}api/me/business-claims/${claimId}/verification-code`, { method: "POST", credentials: "include" });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not send a private verification code.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send a private verification code."); }
    finally { setRequesting(null); }
  };

  const dispute = async (claimId: string) => {
    const notes = window.prompt("Briefly explain why this private claim decision should be reviewed again.");
    if (!notes || notes.trim().length < 3) return;
    setRequesting(claimId); setError(null);
    try {
      const response = await fetch(`${BASE}api/me/business-claims/${claimId}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "dispute", notes: notes.trim() }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not open a private dispute review.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open a private dispute review."); }
    finally { setRequesting(null); }
  };

  return <Layout><main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12"><Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-[#3A1F0E]/60 hover:text-[#CA922B]"><ArrowLeft className="h-4 w-4" /> Back to profile</Link><header className="mt-7"><div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#CA922B]"><Shield className="h-4 w-4" /> Private claim status</div><h1 className="mt-2 font-serif text-3xl font-bold text-[#2B1507]">Your business requests</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A1F0E]/65">This is visible only to your signed-in account. A claim does not change public details, verification, ownership designations, ranking, safety information, or publication.</p></header>{error ? <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}{loading ? <div className="mt-7 space-y-3">{[1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div> : claims.length === 0 ? <div className="mt-7 rounded-2xl border border-dashed border-[#3A1F0E]/20 bg-white p-7 text-center"><p className="font-semibold text-[#2B1507]">No ownership claims yet</p><p className="mt-1 text-sm text-[#3A1F0E]/60">Claim an existing business from its public listing when you are authorized to manage it.</p></div> : <section className="mt-7 space-y-4">{claims.map((claim) => <article key={claim.id} className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-[#2B1507]">{claim.business_name ?? "Business listing"}</h2><p className="mt-1 text-sm text-[#3A1F0E]/60">{[claim.city, claim.state].filter(Boolean).join(", ") || "Location unavailable"} · requested as {claim.role.replaceAll("_", " ")}</p></div><span className="rounded-full bg-[#F5EBD8] px-3 py-1 text-xs font-bold capitalize text-[#8D5C17]">{claim.status.replaceAll("_", " ")}</span></div>{claim.decision_reason ? <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{claim.decision_reason}</p> : null}<div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><Link href={`/businesses/${claim.business_id}`} className="font-semibold text-[#8D5C17] hover:underline">View public listing</Link>{claim.contact_verification_status === "verified" ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Business contact confirmed</span> : claim.contact_verification_status === "code_issued" ? <span className="inline-flex items-center gap-1 text-[#8D5C17]"><Clock3 className="h-4 w-4" /> Code sent to private business contact</span> : claim.contact_verification_status === "not_requested" && claim.status === "pending" ? <button type="button" onClick={() => void requestCode(claim.id)} disabled={requesting === claim.id} className="rounded-lg border border-[#CA922B]/40 px-3 py-1.5 text-xs font-bold text-[#8D5C17] disabled:opacity-50">{requesting === claim.id ? "Sending…" : "Request business-contact code"}</button> : null}{claim.status === "rejected" ? <button type="button" onClick={() => void dispute(claim.id)} disabled={requesting === claim.id} className="rounded-lg border border-[#8D5C17]/35 px-3 py-1.5 text-xs font-bold text-[#8D5C17] disabled:opacity-50">Request private dispute review</button> : null}</div><p className="mt-4 text-xs leading-5 text-[#3A1F0E]/55">A contact code is optional review evidence only. It does not approve an ownership claim.</p></article>)}</section>}</main></Layout>;
}
