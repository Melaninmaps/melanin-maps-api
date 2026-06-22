import { useState } from "react";
import { ArrowLeft, Shield, CheckCircle, Clock, Building2, Award, FileText, BadgeCheck } from "lucide-react";
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

const DOCUMENT_TYPES = [
  { value: "articles_of_incorporation", label: "Articles of Incorporation / Business Registration" },
  { value: "ein_confirmation", label: "EIN Confirmation Letter (IRS Form 147C or SS-4)" },
  { value: "business_license", label: "Business License" },
  { value: "ownership_agreement", label: "Ownership Agreement / Operating Agreement showing ownership %" },
  { value: "government_issued_id", label: "Government-Issued Photo ID (owner)" },
  { value: "other", label: "Other supporting document" },
];

const CERT_ORGS = [
  { value: "NMSDC", label: "NMSDC — National Minority Supplier Development Council" },
  { value: "WBENC", label: "WBENC — Women's Business Enterprise National Council" },
  { value: "SBA_8a", label: "SBA 8(a) Business Development Program" },
  { value: "SBA_HUBZone", label: "SBA HUBZone Certification" },
  { value: "NGLCC", label: "NGLCC — National LGBT Chamber of Commerce" },
  { value: "Disability_IN", label: "Disability:IN (formerly USBLN)" },
  { value: "NABOB", label: "NABOB — National Association of Minority-Owned Broadcasters" },
  { value: "NACC", label: "NACC — National Association of Colored Women's Clubs" },
  { value: "NBCC", label: "National Black Chamber of Commerce" },
  { value: "State_MWBE", label: "State / Local MWBE Certification" },
  { value: "Other", label: "Other recognized organization" },
];

function LevelBadge({ level }: { level: "basic" | "ownership" | "certified" }) {
  const config = {
    basic: { label: "Verified", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Shield },
    ownership: { label: "Verified Minority-Owned", color: "bg-[#CA922B]/10 text-[#CA922B] border-[#CA922B]/30", icon: BadgeCheck },
    certified: { label: "Third-Party Certified", color: "bg-green-100 text-green-700 border-green-200", icon: Award },
  };
  const c = config[level];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${c.color}`}>
      <Icon className="w-3.5 h-3.5" /> {c.label}
    </span>
  );
}

export default function VerifyBusiness() {
  const [form, setForm] = useState({
    businessName: "", businessType: "", ownerName: "", websiteUrl: "",
    instagramHandle: "", yearsInBusiness: "", city: "", state: "", message: "", email: "",
    ownershipPercentage: "", einNumber: "",
    documentsProvided: [] as string[],
    businessLicenseProvided: false,
    certificationOrg: "", certificationUrl: "", certificationNumber: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [earnedLevel, setEarnedLevel] = useState<"basic" | "ownership" | "certified">("basic");

  function set(key: string, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function toggleDoc(value: string) {
    setForm((f) => {
      const docs = f.documentsProvided.includes(value)
        ? f.documentsProvided.filter((d) => d !== value)
        : [...f.documentsProvided, value];
      return { ...f, documentsProvided: docs };
    });
  }

  const pct = parseInt(form.ownershipPercentage || "0", 10);
  const hasCert = !!(form.certificationOrg && form.certificationUrl.trim());
  const hasOwnership = pct >= 51;
  const previewLevel: "basic" | "ownership" | "certified" = hasCert ? "certified" : hasOwnership ? "ownership" : "basic";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.businessName || !form.businessType || !form.ownerName || !form.email) {
      setError("Please fill in all required fields."); return;
    }
    if (form.ownershipPercentage && pct < 51) {
      setError("Ownership percentage must be 51% or greater for a Verified Minority-Owned badge."); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/verification/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          businessType: form.businessType,
          ownerName: form.ownerName,
          websiteUrl: form.websiteUrl || undefined,
          instagramHandle: form.instagramHandle || undefined,
          yearsInBusiness: form.yearsInBusiness ? parseInt(form.yearsInBusiness) : undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          message: form.message || undefined,
          email: form.email,
          ownershipPercentage: form.ownershipPercentage ? pct : undefined,
          einNumber: form.einNumber || undefined,
          documentsProvided: form.documentsProvided.length ? form.documentsProvided : undefined,
          businessLicenseProvided: form.businessLicenseProvided,
          certificationOrg: form.certificationOrg || undefined,
          certificationUrl: form.certificationUrl || undefined,
          certificationNumber: form.certificationNumber || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to submit. Please try again."); return;
      }
      const data = await res.json();
      setEarnedLevel(data.verificationLevel ?? "basic");
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-[0_8px_30px_rgba(43,21,7,0.08)]">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#2B1507] mb-2">Application Received</h1>
          <div className="flex justify-center mb-4">
            <LevelBadge level={earnedLevel} />
          </div>
          <p className="text-[#3A1F0E]/70 mb-6 leading-relaxed">
            Thank you for submitting your verification request. Our team reviews each application carefully — you'll hear from us within <strong>3–5 business days</strong> at the email you provided.
          </p>
          <div className="bg-[#FAF6EF] rounded-2xl p-4 mb-8 text-left">
            <p className="text-[#3A1F0E]/60 text-sm font-bold uppercase tracking-wider mb-2">What happens next</p>
            <ul className="space-y-2 text-sm text-[#3A1F0E]/70">
              <li className="flex gap-2"><Clock className="w-4 h-4 text-[#CA922B] mt-0.5 shrink-0" /> We review your submission (3–5 days)</li>
              <li className="flex gap-2"><Shield className="w-4 h-4 text-[#CA922B] mt-0.5 shrink-0" /> We may request additional documents</li>
              <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-[#CA922B] mt-0.5 shrink-0" /> Approved businesses receive their badge</li>
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
        <p className="text-[#3A1F0E]/60 mb-6 ml-[52px]">Earn a verified badge on your business listing</p>

        {/* Tier explainer */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Shield, level: "basic" as const, title: "Level 1 — Verified", desc: "Community confirmed, publicly listed" },
            { icon: BadgeCheck, level: "ownership" as const, title: "Level 2 — Minority-Owned", desc: "51%+ ownership with documentation" },
            { icon: Award, level: "certified" as const, title: "Level 3 — Certified", desc: "Third-party org certification linked" },
          ].map(({ icon: Icon, level, title, desc }) => (
            <div key={level} className={`rounded-2xl p-4 border text-center transition-all ${previewLevel === level ? "border-[#CA922B] bg-[#CA922B]/5 shadow-sm" : "border-[#3A1F0E]/10 bg-white/60"}`}>
              <Icon className={`w-5 h-5 mx-auto mb-1.5 ${previewLevel === level ? "text-[#CA922B]" : "text-[#3A1F0E]/30"}`} />
              <p className={`text-xs font-bold mb-0.5 ${previewLevel === level ? "text-[#2B1507]" : "text-[#3A1F0E]/50"}`}>{title}</p>
              <p className={`text-[10px] leading-tight ${previewLevel === level ? "text-[#3A1F0E]/70" : "text-[#3A1F0E]/30"}`}>{desc}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1: Business Info ── */}
          <div className="bg-white rounded-3xl p-8 border border-[#3A1F0E]/10 shadow-[0_4px_16px_rgba(43,21,7,0.04)] space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#3A1F0E]/10">
              <Building2 className="w-4 h-4 text-[#CA922B]" />
              <span className="text-sm font-bold text-[#2B1507] uppercase tracking-wider">Business Information</span>
              <span className="ml-auto text-xs text-[#3A1F0E]/40">Level 1</span>
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
              <textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Share your story, community involvement, and anything that helps us understand your business..." rows={4}
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF] resize-none" />
            </div>
          </div>

          {/* ── Section 2: Ownership Verification ── */}
          <div className="bg-white rounded-3xl p-8 border border-[#3A1F0E]/10 shadow-[0_4px_16px_rgba(43,21,7,0.04)] space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#3A1F0E]/10">
              <BadgeCheck className="w-4 h-4 text-[#CA922B]" />
              <span className="text-sm font-bold text-[#2B1507] uppercase tracking-wider">Ownership Verification</span>
              <span className="ml-auto text-xs bg-[#CA922B]/10 text-[#CA922B] font-bold px-2 py-0.5 rounded-full">Level 2 — Optional</span>
            </div>

            <p className="text-sm text-[#3A1F0E]/60 leading-relaxed">
              To earn the <strong className="text-[#2B1507]">"Verified Minority-Owned"</strong> badge, please confirm 51% or greater ownership by the represented group and indicate what documentation you can provide. This information is reviewed by our team — no uploads are required here.
            </p>

            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">
                Ownership Percentage
                {form.ownershipPercentage && pct >= 51 && (
                  <span className="ml-2 text-green-600 text-xs font-normal">✓ Meets 51% standard</span>
                )}
                {form.ownershipPercentage && pct < 51 && (
                  <span className="ml-2 text-red-500 text-xs font-normal">Must be 51% or greater</span>
                )}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="1" max="100"
                  value={form.ownershipPercentage}
                  onChange={(e) => set("ownershipPercentage", e.target.value)}
                  placeholder="e.g. 100"
                  className="w-32 border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]"
                />
                <span className="text-[#3A1F0E]/60 text-sm">% ownership by minority group member(s)</span>
              </div>
              <p className="text-xs text-[#3A1F0E]/40 mt-1">Standard threshold: 51% or greater ownership required</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">EIN (Employer Identification Number) <span className="text-[#3A1F0E]/40 font-normal text-xs">— Optional</span></label>
              <input
                value={form.einNumber}
                onChange={(e) => set("einNumber", e.target.value)}
                placeholder="XX-XXXXXXX"
                maxLength={10}
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]"
              />
              <p className="text-xs text-[#3A1F0E]/40 mt-1">Found on your IRS SS-4 confirmation letter or tax filings</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-3">Documents You Can Provide</label>
              <div className="space-y-2">
                {DOCUMENT_TYPES.map((doc) => (
                  <label key={doc.value} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.documentsProvided.includes(doc.value)}
                      onChange={() => toggleDoc(doc.value)}
                      className="mt-0.5 w-4 h-4 rounded border-[#3A1F0E]/30 accent-[#CA922B] cursor-pointer"
                    />
                    <span className="text-sm text-[#3A1F0E]/80 group-hover:text-[#2B1507] transition-colors leading-snug">{doc.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-[#3A1F0E]/40 mt-3">Our team may request copies of these documents during review.</p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.businessLicenseProvided}
                onChange={(e) => set("businessLicenseProvided", e.target.checked)}
                className="w-4 h-4 rounded border-[#3A1F0E]/30 accent-[#CA922B] cursor-pointer"
              />
              <span className="text-sm text-[#3A1F0E]/80">I have an active business license (if applicable in my jurisdiction)</span>
            </label>
          </div>

          {/* ── Section 3: Third-Party Certification ── */}
          <div className="bg-white rounded-3xl p-8 border border-[#3A1F0E]/10 shadow-[0_4px_16px_rgba(43,21,7,0.04)] space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#3A1F0E]/10">
              <Award className="w-4 h-4 text-[#CA922B]" />
              <span className="text-sm font-bold text-[#2B1507] uppercase tracking-wider">Third-Party Certification</span>
              <span className="ml-auto text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Level 3 — Optional</span>
            </div>

            <p className="text-sm text-[#3A1F0E]/60 leading-relaxed">
              If your business already holds a certification from a recognized organization, link it here to earn the <strong className="text-[#2B1507]">"Third-Party Certified"</strong> badge — the highest verification tier.
            </p>

            <div>
              <label className="block text-sm font-bold text-[#2B1507] mb-1.5">Certifying Organization</label>
              <select value={form.certificationOrg} onChange={(e) => set("certificationOrg", e.target.value)}
                className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]">
                <option value="">Select organization...</option>
                {CERT_ORGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {form.certificationOrg && (
              <>
                <div>
                  <label className="block text-sm font-bold text-[#2B1507] mb-1.5">
                    Certification URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={form.certificationUrl}
                    onChange={(e) => set("certificationUrl", e.target.value)}
                    placeholder="Link to your certification profile or certificate page"
                    className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]"
                  />
                  <p className="text-xs text-[#3A1F0E]/40 mt-1">A public URL where we can verify your certification status</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#2B1507] mb-1.5">
                    Certification Number / ID <span className="text-[#3A1F0E]/40 font-normal text-xs">— Optional</span>
                  </label>
                  <input
                    value={form.certificationNumber}
                    onChange={(e) => set("certificationNumber", e.target.value)}
                    placeholder="Your cert ID or certificate number"
                    className="w-full border border-[#3A1F0E]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]"
                  />
                </div>
              </>
            )}

            {/* Recognized organizations callout */}
            <div className="bg-[#FAF6EF] rounded-2xl p-4">
              <p className="text-xs font-bold text-[#2B1507] mb-2 uppercase tracking-wider">Recognized certifications include</p>
              <div className="flex flex-wrap gap-2">
                {["NMSDC", "WBENC", "SBA 8(a)", "SBA HUBZone", "NGLCC", "Disability:IN", "NBCC", "State MWBE"].map((cert) => (
                  <span key={cert} className="text-xs bg-white border border-[#3A1F0E]/15 rounded-full px-2.5 py-1 text-[#3A1F0E]/60">{cert}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Preview badge */}
          <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-[#3A1F0E]/10">
            <div>
              <p className="text-xs text-[#3A1F0E]/50 mb-1">Your submission will be reviewed for</p>
              <LevelBadge level={previewLevel} />
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-[#3A1F0E]/40">
                {previewLevel === "certified" && "Highest tier — third-party cert linked"}
                {previewLevel === "ownership" && "51%+ ownership confirmed with docs"}
                {previewLevel === "basic" && "Add ownership % or cert to earn a higher badge"}
              </p>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

          <Button type="submit" disabled={loading}
            className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold h-12 text-base shadow-[0_4px_14px_rgba(202,146,43,0.3)]">
            {loading ? "Submitting..." : "Submit Verification Request"}
          </Button>

          <p className="text-center text-[#3A1F0E]/40 text-xs">We typically respond within 3–5 business days.</p>
        </form>

        {/* Footer note */}
        <div className="mt-8 flex items-start gap-3 text-xs text-[#3A1F0E]/50 bg-[#2B1507]/4 rounded-2xl p-4">
          <FileText className="w-4 h-4 shrink-0 mt-0.5 text-[#CA922B]" />
          <p>
            All documentation is reviewed confidentially by our team. We do not share your EIN or ownership documents publicly. Common verification standards require <strong>51% or greater ownership</strong> by members of the represented group.
          </p>
        </div>
      </div>
    </div>
  );
}
