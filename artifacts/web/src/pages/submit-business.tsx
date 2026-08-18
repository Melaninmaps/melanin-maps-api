import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { MediaUploader, getMediaUrls } from "@/components/MediaUploader";
import {
  MapPin, Store, Globe, Phone, Heart, ChevronDown, CheckCircle2, ArrowLeft,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type Step = "form" | "success";

const OWNERSHIP_OPTIONS = [
  { value: "black-owned", label: "Black-owned" },
  { value: "woman-owned", label: "Woman-owned" },
  { value: "lgbtq-owned", label: "LGBTQ+-owned" },
  { value: "minority-owned", label: "Minority-owned" },
  { value: "indigenous-owned", label: "Indigenous-owned" },
];

const CATEGORIES = [
  "Restaurant", "Café / Coffee", "Bar / Lounge", "Bakery", "Food Truck",
  "Grocery / Market", "Clothing & Fashion", "Beauty & Hair", "Barbershop",
  "Nail Salon", "Spa & Wellness", "Fitness", "Health & Medical",
  "Books & Media", "Music & Entertainment", "Arts & Culture",
  "Photography", "Event Venue", "Education & Tutoring",
  "Tech & Digital", "Legal Services", "Financial Services",
  "Real Estate", "Cleaning & Home Services", "Auto Services",
  "Travel & Hospitality", "Non-profit / Community Org", "Other",
];

export default function SubmitBusiness() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("form");
  const [submissionId, setSubmissionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "",
    website: "",
    phone: "",
    ownershipDesignations: [] as string[],
    submitterNote: "",
  });

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleOwnership = (val: string) =>
    setForm((f) => ({
      ...f,
      ownershipDesignations: f.ownershipDesignations.includes(val)
        ? f.ownershipDesignations.filter((v) => v !== val)
        : [...f.ownershipDesignations, val],
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.city.trim()) {
      setError("Business name, category, and city are required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    // Read source attribution from URL
    const params = new URLSearchParams(window.location.search);
    const sourceChannel = params.get("source") ?? undefined;
    const sourceCampaign = params.get("campaign") ?? undefined;

    try {
      const resp = await fetch(`${BASE}api/community/business-submissions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sourceChannel,
          sourceCampaign,
          mediaUrls: uploadedUrls,
        }),
      });

      const data = await resp.json() as { ok?: boolean; submissionId?: string; error?: string };

      if (!resp.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmissionId(data.submissionId ?? "");
      setStep("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-[#CA922B]/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-[#CA922B]" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#3A1F0E] mb-3">
                Thank you for putting your people on!
              </h1>
              <p className="text-[#3A1F0E]/70 leading-relaxed">
                Your submission is in review. Once we verify the details, this
                business will appear on the map and in our community directory.
              </p>
            </div>
            <div className="bg-[#FAF6EF] rounded-2xl p-4 text-left space-y-1">
              <p className="text-xs font-semibold text-[#CA922B] uppercase tracking-wide">
                What happens next
              </p>
              <ul className="text-sm text-[#3A1F0E]/70 space-y-1 mt-2">
                <li>• Our team reviews your submission (usually within 48 hrs)</li>
                <li>• We verify the business is active and community-serving</li>
                <li>• It goes live on the map for the whole community to find</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setStep("form"); setForm({ name: "", category: "", description: "", address: "", city: "", state: "", country: "", website: "", phone: "", ownershipDesignations: [], submitterNote: "" }); }}
                className="px-6 py-3 border border-[#CA922B]/30 text-[#CA922B] font-semibold rounded-2xl hover:bg-[#CA922B]/5 transition-colors text-sm"
              >
                Submit another
              </button>
              <Link href="/businesses">
                <button className="px-6 py-3 bg-[#CA922B] text-white font-semibold rounded-2xl hover:bg-[#B38024] transition-colors text-sm">
                  Browse directory →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/businesses">
            <button className="flex items-center gap-1.5 text-sm text-[#3A1F0E]/50 hover:text-[#CA922B] transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to directory
            </button>
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#CA922B]/10 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-[#CA922B]" />
            </div>
            <span className="text-sm font-semibold text-[#CA922B] uppercase tracking-wide">
              Put your people on
            </span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-[#3A1F0E] mb-3">
            Share a Business
          </h1>
          <p className="text-[#3A1F0E]/70 leading-relaxed text-lg">
            Know a community business that deserves a spot on the map?
            Share it here — we'll review and add it to the directory.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Business name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">
              Business name <span className="text-[#CA922B]">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Nourish Market"
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">
              Category <span className="text-[#CA922B]">*</span>
            </label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm appearance-none pr-10"
                required
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A1F0E]/40 pointer-events-none" />
            </div>
          </div>

          {/* City + State row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#3A1F0E]">
                City <span className="text-[#CA922B]">*</span>
              </label>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Atlanta"
                className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#3A1F0E]">State / Region</label>
              <input
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. GA"
                className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#CA922B]" />
              Street address <span className="font-normal text-[#3A1F0E]/40">(optional but helps us place it on the map)</span>
            </label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 123 Sweet Auburn Ave"
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
            />
          </div>

          {/* Website + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#3A1F0E] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#CA922B]" />
                Website
              </label>
              <input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://…"
                type="url"
                className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#3A1F0E] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#CA922B]" />
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(404) 555-0100"
                type="tel"
                className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">
              Tell us about this business <span className="font-normal text-[#3A1F0E]/40">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What makes this business special? What do they offer?"
              rows={3}
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm resize-none"
            />
          </div>

          {/* Ownership designations */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#3A1F0E] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#CA922B]" />
              Ownership <span className="font-normal text-[#3A1F0E]/40">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {OWNERSHIP_OPTIONS.map((opt) => {
                const selected = form.ownershipDesignations.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOwnership(opt.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      selected
                        ? "bg-[#CA922B] text-white border-[#CA922B]"
                        : "bg-white text-[#3A1F0E]/70 border-[#3A1F0E]/15 hover:border-[#CA922B]/40 hover:text-[#CA922B]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">
              Photos <span className="font-normal text-[#3A1F0E]/40">(optional)</span>
            </label>
            <MediaUploader
              purpose="business_submission"
              maxFiles={3}
              accept="images"
              label="Add photos of this business"
              onFilesChange={(files) => setUploadedUrls(getMediaUrls(files))}
            />
          </div>

          {/* Note to reviewer */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">
              Note to our team <span className="font-normal text-[#3A1F0E]/40">(optional)</span>
            </label>
            <textarea
              value={form.submitterNote}
              onChange={(e) => set("submitterNote", e.target.value)}
              placeholder="Anything else we should know? How did you find this business?"
              rows={2}
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !form.name.trim() || !form.category || !form.city.trim()}
            className="w-full bg-[#CA922B] text-white font-bold py-4 rounded-2xl hover:bg-[#B38024] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting…
              </span>
            ) : (
              "Submit for review →"
            )}
          </button>

          <p className="text-center text-xs text-[#3A1F0E]/40">
            Submissions are reviewed by our team. Nothing goes live until verified.
          </p>
        </form>
      </div>
    </Layout>
  );
}
