import { useState } from "react";
import { ArrowLeft, Shield, CheckCircle, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant / Food & Beverage" },
  { value: "retail", label: "Retail / Shop" },
  { value: "salon", label: "Salon / Beauty & Wellness" },
  { value: "health", label: "Health / Medical" },
  { value: "professional_services", label: "Professional Services (Law, Finance, etc.)" },
  { value: "entertainment", label: "Entertainment / Arts & Culture" },
  { value: "tech", label: "Technology / Software" },
  { value: "nonprofit", label: "Nonprofit / Community Organization" },
  { value: "other", label: "Other" },
];

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

export default function VerifyBusiness() {
  const [form, setForm] = useState({
    businessName: "", businessType: "", ownerName: "", websiteUrl: "",
    instagramHandle: "", yearsInBusiness: "", city: "", state: "", message: "", email: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.businessName || !form.businessType || !form.ownerName || !form.email) {
      setError("Please fill in all required fields."); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/verification/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsInBusiness: form.yearsInBusiness ? parseInt(form.yearsInBusiness) : undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to submit. Please try again."); return; }
      setSubmitted(true);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-[0_8px_30px_rgba(43,21,7,0.08)]">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#2B1507] mb-3">Application Received</h1>
          <p className="text-[#3A1F0E]/70 mb-6 leading-relaxed">
            Thank you for submitting your verification request. Our team reviews each application carefully — you'll hear from us within <strong>3–5 business days</strong> at the email you provided.
          </p>
          <div className="bg-[#FAF6EF] rounded-2xl p-4 mb-8 text-left">
            <p className="text-[#3A1F0E]/60 text-sm font-bold uppercase tracking-wider mb-2">What happens next</p>
            <ul className="space-y-2 text-sm text-[#3A1F0E]/70">
              <li className="flex gap-2"><Clock className="w-4 h-4 text-[#CA922B] mt-0.5 shrink-0" /> We review your submission (3–5 days)</li>
              <li className="flex gap-2"><Shield className="w-4 h-4 text-[#CA922B] mt-0.5 shrink-0" /> We may request additional verification documents</li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-[#CA922B] mt-0.5 shrink-0" /> Approved businesses receive a verified badge</li>
            </ul>
          </div>
          <Link href="/discover">
            <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold px-8 w-full">
              Explore the Directory →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="container mx-auto px-4 max-w-2xl py-12">
        <Link href="/for-business-owners">
          <button className="flex items-center gap-2 text-[#3A1F0E]/60 hover:text-[#3A1F0E] text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#CA922B]" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2B1507]">Apply for Verification</h1>
        </div>
        <p className="text-[#3A1F0E]/60 mb-2 ml-[52px]">Get the verified badge on your business listing</p>

        <div className="bg-[#2B1507]/5 border border-[#CA922B]/20 rounded-2xl p-5 mb-10 ml-[52px]">
          <p className="text-sm text-[#3A1F0E]/70 leading-relaxed">
            <strong className="text-[#2B1507]">Our verification process</strong> confirms that your business is authentically Black-owned or Minority-owned. We review publicly available information and may request supporting documentation. Verified businesses receive a badge visible to all community members.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-[#3A1F0E]/10 shadow-[0_8px_30px_rgba(43,21,7,0.05)] space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-[#3A1F0E]/10">
            <Building2 className="w-4 h-4 text-[#CA922B]" />
            <span className="text-sm font-bold text-[#2B1507] uppercase tracking-wider">Business Information</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">Business Name <span className="text-red-500">*</span></label>
              <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Your business name" required
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">Business Type <span className="text-red-500">*</span></label>
              <select value={form.businessType} onChange={(e) => set("businessType", e.target.value)} required
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]">
                <option value="">Select type...</option>
                {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">Owner's Full Name <span className="text-red-500">*</span></label>
              <input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Your name" required
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">Years in Business</label>
              <input type="number" min="0" max="100" value={form.yearsInBusiness} onChange={(e) => set("yearsInBusiness", e.target.value)} placeholder="e.g. 5"
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">City</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City"
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">State</label>
              <select value={form.state} onChange={(e) => set("state", e.target.value)}
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]">
                <option value="">Select state...</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">Website URL</label>
              <input type="url" value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://..."
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">Instagram Handle</label>
              <input value={form.instagramHandle} onChange={(e) => set("instagramHandle", e.target.value)} placeholder="@yourbusiness"
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2B1507] mb-1.5">Contact Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@yourbusiness.com" required
              className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]" />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2B1507] mb-1.5">Tell Us About Your Business</label>
            <textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Share your story, how long you've been in operation, any community involvement, and anything else you'd like us to know..." rows={4}
              className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF] resize-none" />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

          <Button type="submit" disabled={loading}
            className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold h-12 text-base shadow-[0_4px_14px_rgba(202,146,43,0.3)]">
            {loading ? "Submitting..." : "Submit Verification Request"}
          </Button>

          <p className="text-center text-[#3A1F0E]/40 text-xs">We typically respond within 3–5 business days.</p>
        </form>
      </div>
    </div>
  );
}
