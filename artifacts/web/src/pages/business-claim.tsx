import { useState, useEffect } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Link, useLocation, Redirect } from "wouter";
import { Layout } from "@/components/layout";
import { MediaUploader, getMediaUrls } from "@/components/MediaUploader";
import {
  Shield, CheckCircle2, ArrowLeft, Store, AlertCircle,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

export default function BusinessClaim() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [location] = useLocation();

  // businessId comes from the URL: /businesses/:id/claim
  const businessId = location.split("/")[2];

  const [business, setBusiness] = useState<{ name: string; city: string; category: string } | null>(null);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const [form, setForm] = useState({
    claimantName: "",
    claimantTitle: "",
    claimantPhone: "",
    verificationNote: "",
  });

  const user = auth?.user as any;

  useEffect(() => {
    if (!businessId) return;
    fetch(`${BASE}api/businesses/${businessId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.business ?? data?.id) {
          const biz = data.business ?? data;
          setBusiness({ name: biz.name, city: biz.city, category: biz.category });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBiz(false));
  }, [businessId]);

  if (!authLoading && !user?.id) {
    return <Redirect to={`/login?next=/businesses/${businessId}/claim`} />;
  }

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.claimantName.trim()) {
      setError("Your name is required so we can verify your identity.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const resp = await fetch(`${BASE}api/businesses/${businessId}/claim`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          verificationUrls: uploadedUrls,
        }),
      });

      const data = await resp.json() as { ok?: boolean; error?: string };

      if (!resp.ok) {
        setError(data.error ?? "Failed to submit claim. Please try again.");
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
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-[#CA922B]/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-[#CA922B]" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#3A1F0E] mb-3">
                Claim submitted!
              </h1>
              <p className="text-[#3A1F0E]/70 leading-relaxed">
                Our team will review your claim within a few business days.
                The listing stays public while we verify your ownership.
              </p>
            </div>
            <Link href={`/businesses/${businessId}`}>
              <button className="px-6 py-3 bg-[#CA922B] text-white font-semibold rounded-2xl hover:bg-[#B38024] transition-colors text-sm">
                Back to listing →
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href={`/businesses/${businessId}`}>
            <button className="flex items-center gap-1.5 text-sm text-[#3A1F0E]/50 hover:text-[#CA922B] transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to listing
            </button>
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#CA922B]/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#CA922B]" />
            </div>
            <span className="text-sm font-semibold text-[#CA922B] uppercase tracking-wide">
              Claim ownership
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#3A1F0E] mb-3">
            Is this your business?
          </h1>

          {loadingBiz ? (
            <div className="h-6 w-48 bg-[#3A1F0E]/8 rounded animate-pulse" />
          ) : business ? (
            <div className="flex items-center gap-2 text-[#3A1F0E]/60 text-sm">
              <Store className="w-4 h-4 text-[#CA922B]" />
              <span>{business.name} · {business.city} · {business.category}</span>
            </div>
          ) : null}

          <p className="text-[#3A1F0E]/70 mt-4 leading-relaxed">
            Verified business owners get access to respond to reviews,
            update their listing, and share promotions with the community.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              We'll review your identity documents before granting access. The
              listing stays public while your claim is pending.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">
              Your name <span className="text-[#CA922B]">*</span>
            </label>
            <input
              value={form.claimantName}
              onChange={(e) => set("claimantName", e.target.value)}
              placeholder="Your full legal name"
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">
              Your role at this business
            </label>
            <input
              value={form.claimantTitle}
              onChange={(e) => set("claimantTitle", e.target.value)}
              placeholder="e.g. Owner, Co-founder, Manager"
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">
              Business phone number
            </label>
            <input
              value={form.claimantPhone}
              onChange={(e) => set("claimantPhone", e.target.value)}
              placeholder="Phone we can call to verify"
              type="tel"
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">
              Verification documents <span className="font-normal text-[#3A1F0E]/40">(photos or PDFs)</span>
            </label>
            <p className="text-xs text-[#3A1F0E]/50">
              Business license, utility bill, government ID, or any document
              that links you to this business. Up to 6 files.
            </p>
            <MediaUploader
              purpose="business_claim"
              maxFiles={6}
              accept="images+docs"
              label="Upload verification documents"
              onFilesChange={(files) => setUploadedUrls(getMediaUrls(files))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">
              Additional context
            </label>
            <textarea
              value={form.verificationNote}
              onChange={(e) => set("verificationNote", e.target.value)}
              placeholder="Anything else that can help us verify your ownership?"
              rows={3}
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm resize-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !form.claimantName.trim()}
            className="w-full bg-[#CA922B] text-white font-bold py-4 rounded-2xl hover:bg-[#B38024] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting claim…
              </span>
            ) : (
              "Submit ownership claim →"
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
