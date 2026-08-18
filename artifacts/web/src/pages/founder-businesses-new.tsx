import { useState } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Link, Redirect, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { MediaUploader, getMediaUrls } from "@/components/MediaUploader";
import {
  Store, MapPin, Globe, Phone, Heart, ChevronDown,
  CheckCircle2, ArrowLeft, Zap,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

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

const OWNERSHIP_OPTIONS = [
  { value: "black-owned", label: "Black-owned" },
  { value: "woman-owned", label: "Woman-owned" },
  { value: "lgbtq-owned", label: "LGBTQ+-owned" },
  { value: "minority-owned", label: "Minority-owned" },
  { value: "indigenous-owned", label: "Indigenous-owned" },
];

export default function FounderBusinessesNew() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [, navigate] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ businessId: string; slug: string | null } | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const user = auth?.user as any;
  if (!authLoading && (!user?.id || user.role !== "admin")) {
    return <Redirect to="/" />;
  }

  const [form, setForm] = useState({
    name: "",
    category: "",
    subcategory: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "",
    website: "",
    phone: "",
    ownershipDesignations: [] as string[],
    blackOwned: false,
  });

  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleOwnership = (val: string) => {
    setForm((f) => ({
      ...f,
      ownershipDesignations: f.ownershipDesignations.includes(val)
        ? f.ownershipDesignations.filter((v) => v !== val)
        : [...f.ownershipDesignations, val],
      blackOwned: val === "black-owned"
        ? !f.ownershipDesignations.includes(val)
        : f.blackOwned,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.city.trim()) {
      setError("Business name, category, and city are required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const resp = await fetch(`${BASE}api/admin/businesses`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mediaAssetUrls: uploadedUrls,
        }),
      });

      const data = await resp.json() as {
        ok?: boolean; businessId?: string; slug?: string | null; error?: string;
      };

      if (!resp.ok) {
        setError(data.error ?? "Failed to publish. Please try again.");
        return;
      }

      setSuccess({ businessId: data.businessId ?? "", slug: data.slug ?? null });
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#3A1F0E] mb-3">
                Business is live!
              </h1>
              <p className="text-[#3A1F0E]/70">
                The listing is now visible on the map and in the directory.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSuccess(null);
                  setForm({ name: "", category: "", subcategory: "", description: "", address: "", city: "", state: "", country: "", website: "", phone: "", ownershipDesignations: [], blackOwned: false });
                  setUploadedUrls([]);
                }}
                className="px-6 py-3 border border-[#CA922B]/30 text-[#CA922B] font-semibold rounded-2xl hover:bg-[#CA922B]/5 transition-colors text-sm"
              >
                Add another
              </button>
              <Link href={`/businesses/${success.businessId}`}>
                <button className="px-6 py-3 bg-[#CA922B] text-white font-semibold rounded-2xl hover:bg-[#B38024] transition-colors text-sm">
                  View listing →
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
          <Link href="/admin">
            <button className="flex items-center gap-1.5 text-sm text-[#3A1F0E]/50 hover:text-[#CA922B] transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Admin panel
            </button>
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-semibold text-green-600 uppercase tracking-wide">
              Direct publish
            </span>
          </div>
          <h1 className="font-serif text-4xl font-bold text-[#3A1F0E] mb-3">
            Add a Business
          </h1>
          <p className="text-[#3A1F0E]/70 leading-relaxed">
            Founder/admin only. This listing goes live on the map immediately —
            no review queue.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
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

          <div className="grid grid-cols-2 gap-4">
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
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A1F0E]/40 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#3A1F0E]">Subcategory</label>
              <input
                value={form.subcategory}
                onChange={(e) => set("subcategory", e.target.value)}
                placeholder="e.g. Vegan"
                className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
              />
            </div>
          </div>

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
              <label className="text-sm font-semibold text-[#3A1F0E]">State</label>
              <input
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. GA"
                className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#CA922B]" />
              Street address
            </label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 123 Sweet Auburn Ave"
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
            />
          </div>

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

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What makes this business special?"
              rows={3}
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#3A1F0E] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#CA922B]" />
              Ownership designations
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

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3A1F0E]">Photos</label>
            <MediaUploader
              purpose="business_photo"
              maxFiles={5}
              accept="images"
              label="Upload business photos"
              onFilesChange={(files) => setUploadedUrls(getMediaUrls(files))}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !form.name.trim() || !form.category || !form.city.trim()}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing…
              </span>
            ) : (
              "Publish listing — go live now →"
            )}
          </button>

          <p className="text-center text-xs text-[#3A1F0E]/40">
            This listing will appear on the map and in the directory immediately.
          </p>
        </form>
      </div>
    </Layout>
  );
}
