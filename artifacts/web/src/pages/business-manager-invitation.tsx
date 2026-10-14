import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Shield } from "lucide-react";
import { Layout } from "@/components/layout";

const BASE = import.meta.env.BASE_URL;

export default function BusinessManagerInvitation() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const accept = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const response = await fetch(`${BASE}api/business-manager-invitations/accept`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.trim().toUpperCase() }) });
      const data = await response.json().catch(() => ({})) as { error?: string; businessId?: string };
      if (!response.ok) throw new Error(data.error ?? "This invitation could not be accepted.");
      setAccepted(true);
      window.setTimeout(() => navigate(`/business-dashboard?businessId=${encodeURIComponent(data.businessId ?? "")}`), 1100);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This invitation could not be accepted."); }
    finally { setBusy(false); }
  };

  return <Layout><main className="mx-auto min-h-[70vh] max-w-xl px-4 py-12"><Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-[#3A1F0E]/60 hover:text-[#CA922B]"><ArrowLeft className="h-4 w-4" /> Back to profile</Link><section className="mt-7 rounded-3xl border border-[#3A1F0E]/10 bg-white p-6 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CA922B]/10"><Shield className="h-6 w-6 text-[#CA922B]" /></div><h1 className="mt-5 font-serif text-3xl font-bold text-[#2B1507]">Accept business manager invitation</h1><p className="mt-2 text-sm leading-6 text-[#3A1F0E]/65">Sign in with the exact email address that received the invitation, then enter the ten-character code. Manager access is limited and does not transfer ownership or change public verification.</p>{accepted ? <p className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Access accepted. Opening your selected business…</p> : <form onSubmit={accept} className="mt-6 space-y-4"><input value={code} onChange={(event) => setCode(event.target.value.replace(/[^a-zA-Z2-9]/g, "").slice(0, 10).toUpperCase())} placeholder="ABCDE234FG" aria-label="Manager invitation code" className="w-full rounded-xl border border-[#3A1F0E]/15 px-4 py-3 font-mono tracking-[0.16em] text-[#2B1507] outline-none focus:border-[#CA922B]" required />{error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}<button type="submit" disabled={busy || code.length !== 10} className="w-full rounded-xl bg-[#CA922B] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Confirming…" : "Accept manager access"}</button></form>}</section></main></Layout>;
}
