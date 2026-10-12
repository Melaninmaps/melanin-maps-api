import { useEffect, useState, type ReactNode } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Link, useLocation, Redirect } from "wouter";
import { Layout } from "@/components/layout";
import { AlertCircle, ArrowLeft, CheckCircle2, Shield, Store } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type ClaimEligibility =
  | "loading"
  | "claimable"
  | "pending_for_you"
  | "pending_for_other_user"
  | "already_claimed"
  | "not_claimable"
  | "not_found"
  | "unavailable";

export default function BusinessClaim() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [location] = useLocation();
  const businessId = location.split("/")[2];
  const user = auth?.user as { id?: string; email?: string } | undefined;

  const [business, setBusiness] = useState<{ name: string; city: string; category: string } | null>(null);
  const [eligibility, setEligibility] = useState<ClaimEligibility>("loading");
  const [eligibilityMessage, setEligibilityMessage] = useState("");
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    ownerName: "",
    role: "owner",
    businessEmail: "",
    claimantPhone: "",
    verificationMethod: "manual_review",
    officialUrl: "",
    socialHandle: "",
    notes: "",
    attestation: false,
  });

  useEffect(() => {
    if (user?.email && !form.businessEmail) {
      setForm((current) => ({ ...current, businessEmail: user.email ?? "" }));
    }
  }, [user?.email, form.businessEmail]);

  useEffect(() => {
    if (!businessId) return;
    const controller = new AbortController();
    void Promise.all([
      fetch(`${BASE}api/businesses/${businessId}`, { credentials: "include", signal: controller.signal })
        .then((response) => response.ok ? response.json() : null),
      fetch(`${BASE}api/businesses/${businessId}/claim-eligibility`, { credentials: "include", signal: controller.signal })
        .then((response) => response.ok ? response.json() : null),
    ]).then(([businessPayload, eligibilityPayload]) => {
      const value = businessPayload?.business ?? businessPayload;
      if (value?.id) setBusiness({ name: value.name, city: value.city, category: value.category });
      const state = eligibilityPayload?.eligibility as ClaimEligibility | undefined;
      setEligibility(state ?? "unavailable");
      setEligibilityMessage(typeof eligibilityPayload?.message === "string" ? eligibilityPayload.message : "Business ownership claims are unavailable right now.");
    }).catch(() => {
      if (!controller.signal.aborted) {
        setEligibility("unavailable");
        setEligibilityMessage("Business ownership claims are unavailable right now.");
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingBiz(false);
    });
    return () => controller.abort();
  }, [businessId]);

  if (!authLoading && !user?.id) {
    return <Redirect to={`/login?next=/businesses/${businessId}/claim`} />;
  }

  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.ownerName.trim() || !form.businessEmail.trim()) {
      setError("Your name and a business contact email are required.");
      return;
    }
    if (!form.attestation) {
      setError("Confirm that you are authorized to request control of this listing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/businesses/${businessId}/claims`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: form.ownerName.trim(),
          role: form.role,
          businessEmail: form.businessEmail.trim(),
          claimantPhone: form.claimantPhone.trim() || undefined,
          verificationMethod: form.verificationMethod,
          officialUrl: form.officialUrl.trim() || undefined,
          socialHandle: form.socialHandle.trim().replace(/^@/, "") || undefined,
          notes: form.notes.trim() || undefined,
          attestation: true,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Failed to submit the ownership claim. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#CA922B]/10"><CheckCircle2 className="h-10 w-10 text-[#CA922B]" /></div>
            <div>
              <h1 className="mb-3 font-serif text-3xl font-bold text-[#3A1F0E]">Ownership claim submitted</h1>
              <p className="leading-relaxed text-[#3A1F0E]/70">Your request is under review. Approval can grant listing-management access; it does not verify the business, ownership designation, safety, or public eligibility.</p>
            </div>
            <Link href={`/businesses/${businessId}`}><button className="rounded-2xl bg-[#CA922B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B38024]">Back to listing →</button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  const unavailable = eligibility !== "loading" && eligibility !== "claimable";
  return (
    <Layout>
      <div className="mx-auto max-w-xl px-4 py-12 md:py-16">
        <Link href={`/businesses/${businessId}`}><button className="mb-6 flex items-center gap-1.5 text-sm text-[#3A1F0E]/50 transition-colors hover:text-[#CA922B]"><ArrowLeft className="h-4 w-4" />Back to listing</button></Link>
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CA922B]/10"><Shield className="h-5 w-5 text-[#CA922B]" /></div><span className="text-sm font-semibold uppercase tracking-wide text-[#CA922B]">Claim ownership</span></div>
          <h1 className="mb-3 font-serif text-3xl font-bold text-[#3A1F0E]">Is this your business?</h1>
          {loadingBiz ? <div className="h-6 w-48 animate-pulse rounded bg-[#3A1F0E]/8" /> : business ? <div className="flex items-center gap-2 text-sm text-[#3A1F0E]/60"><Store className="h-4 w-4 text-[#CA922B]" /><span>{business.name} · {business.city} · {business.category}</span></div> : null}
          <p className="mt-4 leading-relaxed text-[#3A1F0E]/70">Request authorized management access to this existing listing. Ownership claims are reviewed; submitting one does not change public details, verification, ownership designations, ranking, safety information, or publication.</p>
        </div>

        {unavailable ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><AlertCircle className="mb-2 h-5 w-5 text-amber-700" /><p className="font-semibold">This listing cannot accept a new ownership claim right now.</p><p className="mt-1">{eligibilityMessage}</p></div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>Only submit a claim if you are the owner or an authorized representative. A claim remains private to review staff until a separate approval decision.</span></div></div>
            <Field label="Your name" required><input value={form.ownerName} onChange={(event) => set("ownerName", event.target.value)} placeholder="Your full name" className="claim-input" required /></Field>
            <Field label="Your role at this business"><input value={form.role} onChange={(event) => set("role", event.target.value)} placeholder="Owner, co-founder, or authorized representative" className="claim-input" /></Field>
            <Field label="Business contact email" required><input value={form.businessEmail} onChange={(event) => set("businessEmail", event.target.value)} placeholder="name@business.com" type="email" className="claim-input" required /></Field>
            <Field label="Private review phone (optional)"><input value={form.claimantPhone} onChange={(event) => set("claimantPhone", event.target.value)} placeholder="(555) 000-0000" type="tel" className="claim-input" /><p className="mt-1 text-xs text-[#3A1F0E]/60">Used only for private claim review; it is never added to the public listing.</p></Field>
            <Field label="How should the claim be reviewed?" required><select value={form.verificationMethod} onChange={(event) => set("verificationMethod", event.target.value)} className="claim-input"><option value="manual_review">Manual review</option><option value="domain_email">Business-domain email</option><option value="social_account">Official social account</option><option value="booking_page">Official booking page</option><option value="business_document">Business document</option></select></Field>
            <Field label="Official website or public proof link"><input value={form.officialUrl} onChange={(event) => set("officialUrl", event.target.value)} placeholder="https://…" type="url" className="claim-input" /></Field>
            <Field label="Official social handle"><input value={form.socialHandle} onChange={(event) => set("socialHandle", event.target.value)} placeholder="@yourbusiness" className="claim-input" /></Field>
            <Field label="Additional context"><textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Anything that will help the review team verify your authorization" rows={3} className="claim-input resize-none" /></Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#3A1F0E]/15 bg-white p-4 text-sm leading-5 text-[#3A1F0E]"><input type="checkbox" checked={form.attestation} onChange={(event) => set("attestation", event.target.checked)} className="mt-1 h-4 w-4 accent-[#CA922B]" /><span>I confirm that I am authorized to request management access for this exact listing and that my information is accurate.</span></label>
            {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            <button type="submit" disabled={submitting || eligibility !== "claimable" || !form.ownerName.trim() || !form.businessEmail.trim() || !form.attestation} className="w-full rounded-2xl bg-[#CA922B] py-4 text-base font-bold text-white transition-colors hover:bg-[#B38024] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Submitting claim…" : "Submit ownership claim →"}</button>
          </form>
        )}
      </div>
      <style>{`.claim-input{width:100%;border:1px solid rgba(58,31,14,.15);border-radius:.75rem;padding:.75rem 1rem;color:#3A1F0E;background:#fff;font-size:.875rem}.claim-input:focus{outline:none;border-color:rgba(202,146,43,.7)}`}</style>
    </Layout>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <div className="space-y-1.5"><label className="text-sm font-semibold text-[#3A1F0E]">{label}{required && <span className="text-[#CA922B]"> *</span>}</label>{children}</div>;
}
