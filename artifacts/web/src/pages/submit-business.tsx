import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { MediaUploader, getMediaAssetIds } from "@/components/MediaUploader";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { OwnershipDesignationCombobox } from "@/components/OwnershipDesignationCombobox";
import { OWNERSHIP_DESIGNATIONS } from "@workspace/constants";
import {
  MapPin, Store, Globe, Phone, Heart, ChevronDown, CheckCircle2, ArrowLeft,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type Step = "form" | "success";
type CommunityReportedOwnership = "minority_owned" | "non_minority_owned" | "not_sure";

interface SubmissionOutcome {
  status: string;
  publicationOutcome: string;
  message: string;
  businessId?: string;
  mapPin: boolean;
  isDuplicate?: boolean;
}

const OWNERSHIP_OPTIONS = OWNERSHIP_DESIGNATIONS.map((label) => ({ value: label, label }));

const LEGACY_OWNERSHIP_TO_CANONICAL: Record<string, string> = {
  "black-owned": "Black / African American-Owned",
  "african-american-owned": "Black / African American-Owned",
  "hispanic-owned": "Latino / Hispanic-Owned",
  "latino-owned": "Latino / Hispanic-Owned",
  "ethiopian-owned": "Ethiopian-Owned",
  "caribbean-owned": "Caribbean / West Indian-Owned",
  "brazilian-owned": "Brazilian-Owned",
  "woman-owned": "Woman-Owned",
  "lgbtq-owned": "LGBTQIA+-Owned",
  "minority-owned": "Minority-Owned (general / legacy)",
  "indigenous-owned": "Indigenous / Native-Owned",
  "asian-owned": "Asian American-Owned",
  "african-owned": "African-Owned",
  "immigrant-owned": "Immigrant-Owned",
  "veteran-owned": "Veteran-Owned",
  "family-owned": "Family-Owned",
};

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
  const searchParams = new URLSearchParams(window.location.search);
  const amendId = searchParams.get("amend");
  const isOwnerIntent = !amendId && searchParams.get("intent") === "owner";
  const [step, setStep] = useState<Step>("form");
  const [submissionId, setSubmissionId] = useState("");
  const [outcome, setOutcome] = useState<SubmissionOutcome | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  const clientRequestId = useRef(crypto.randomUUID());

  const [form, setForm] = useState({
    name: "",
    category: "",
    subcategory: "",
    description: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    website: "",
    phone: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    twitch: "",
    snapchat: "",
    communityReportedOwnership: "not_sure" as CommunityReportedOwnership,
    ownershipDesignations: [] as string[],
    submitterNote: "",
    ownerName: "",
    ownerBusinessEmail: "",
    ownerRole: "owner" as "owner" | "co-owner" | "manager" | "authorized_rep",
    ownerVerificationMethod: "manual_review" as "domain_email" | "social_account" | "booking_page" | "manual_review" | "business_document",
    ownerAttestation: false,
  });

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  useEffect(() => {
    if (!amendId) return;
    let active = true;
    void authenticatedFetch(`${BASE}api/community/business-submissions/${encodeURIComponent(amendId)}`)
      .then(async (response) => {
        const data = await response.json() as { submission?: Record<string, unknown>; error?: string };
        if (!response.ok || !data.submission) throw new Error(data.error ?? "Unable to load submission");
        if (!active) return;
        const item = data.submission;
        const socials = (item.social_profiles ?? {}) as Record<string, string>;
        setForm({
          name: String(item.name ?? ""),
          category: String(item.category ?? ""),
          subcategory: String(item.subcategory ?? ""),
          description: String(item.description ?? ""),
          address: String(item.address ?? ""),
          city: String(item.city ?? ""),
          state: String(item.state ?? ""),
          postalCode: String(item.postal_code ?? ""),
          country: String(item.country ?? ""),
          website: String(item.website ?? ""),
          phone: String(item.phone ?? ""),
          instagram: socials.instagram ?? "",
          facebook: socials.facebook ?? "",
          tiktok: socials.tiktok ?? "",
          youtube: socials.youtube ?? "",
          twitch: socials.twitch ?? "",
          snapchat: socials.snapchat ?? "",
          communityReportedOwnership: (item.community_reported_ownership === "minority_owned"
            || item.community_reported_ownership === "non_minority_owned")
            ? item.community_reported_ownership
            : "not_sure",
          ownershipDesignations: Array.isArray(item.ownership_designations)
            ? item.ownership_designations.map(String).map((value) => LEGACY_OWNERSHIP_TO_CANONICAL[value] ?? value)
            : [],
          submitterNote: String(item.submitter_note ?? ""),
          ownerName: String(item.owner_name ?? ""),
          ownerBusinessEmail: String(item.owner_business_email ?? ""),
          ownerRole: (item.owner_role === "co-owner" || item.owner_role === "manager" || item.owner_role === "authorized_rep") ? item.owner_role : "owner",
          ownerVerificationMethod: (item.owner_verification_method === "domain_email" || item.owner_verification_method === "social_account" || item.owner_verification_method === "booking_page" || item.owner_verification_method === "business_document") ? item.owner_verification_method : "manual_review",
          ownerAttestation: Boolean(item.owner_attested_at),
        });
        setUploadedAssetIds(Array.isArray(item.media_asset_ids) ? item.media_asset_ids.map(String) : []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load submission");
      });
    return () => { active = false; };
  }, [amendId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.city.trim()) {
      setError("Business name, category, and city are required.");
      return;
    }
    if (isOwnerIntent && (!form.ownerName.trim() || !form.ownerBusinessEmail.includes("@") || !form.ownerAttestation)) {
      setError("Add your name, business email, and ownership attestation to request profile-linked management access.");
      return;
    }
    if (isOwnerIntent && ![form.website, form.instagram, form.facebook, form.tiktok, form.youtube, form.twitch, form.snapchat].some((value) => value.trim())) {
      setError("Add your public website or at least one public social profile before publishing your business page.");
      return;
    }
    setSubmitting(true);
    setError(null);

    // Read source attribution from URL
    const params = new URLSearchParams(window.location.search);
    const sourceChannel = params.get("source") ?? undefined;
    const sourceCampaign = params.get("campaign") ?? undefined;

    try {
      const endpoint = amendId
        ? `${BASE}api/community/business-submissions/${encodeURIComponent(amendId)}`
        : `${BASE}api/community/business-submissions`;
      const resp = await authenticatedFetch(endpoint, {
        method: amendId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(!amendId ? { "Idempotency-Key": clientRequestId.current } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          subcategory: form.subcategory || undefined,
          description: form.description,
          address: form.address,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
          website: form.website,
          phone: form.phone,
          socialProfiles: {
            ...(form.instagram ? { instagram: form.instagram } : {}),
            ...(form.facebook ? { facebook: form.facebook } : {}),
            ...(form.tiktok ? { tiktok: form.tiktok } : {}),
            ...(form.youtube ? { youtube: form.youtube } : {}),
            ...(form.twitch ? { twitch: form.twitch } : {}),
            ...(form.snapchat ? { snapchat: form.snapchat } : {}),
          },
          communityReportedOwnership: form.communityReportedOwnership,
          ownershipDesignations: form.ownershipDesignations,
          submitterNote: form.submitterNote,
          submissionIntent: isOwnerIntent ? "owner" : "community",
          ...(isOwnerIntent ? {
            ownerName: form.ownerName,
            ownerBusinessEmail: form.ownerBusinessEmail,
            ownerRole: form.ownerRole,
            ownerVerificationMethod: form.ownerVerificationMethod,
            ownerAttestation: form.ownerAttestation,
          } : {}),
          sourceChannel: sourceChannel ?? (isOwnerIntent ? "profile_owner_business" : "web_community_business"),
          sourceCampaign,
          mediaAssetIds: uploadedAssetIds,
          locationSource: "member_entered",
          ...(!amendId ? { clientRequestId: clientRequestId.current } : {}),
        }),
      });

      const data = await resp.json() as {
        ok?: boolean;
        submissionId?: string;
        businessId?: string;
        status?: string;
        publicationOutcome?: string;
        mapPin?: boolean;
        isDuplicate?: boolean;
        message?: string;
        error?: string;
      };

      if (!resp.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmissionId(data.submissionId ?? "");
      setOutcome({
        status: data.status ?? "pending_review",
        publicationOutcome: data.publicationOutcome ?? "pending_review",
        message: data.message ?? "Your business submission was saved.",
        businessId: data.businessId,
        mapPin: data.mapPin === true,
        isDuplicate: data.isDuplicate === true,
      });
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
              <h1 className="font-serif text-3xl font-bold text-[#FFF8EB] mb-3">
                {outcome?.isDuplicate
                  ? "We found the existing listing"
                  : outcome?.status === "published"
                  ? isOwnerIntent
                    ? "Your business page is live"
                    : "This business is live on the map"
                  : "Your business submission is saved"}
              </h1>
              <p className="text-[#F5EBD8]/90 leading-relaxed">
                {outcome?.message ?? "Your submission was saved."}
              </p>
            </div>
            {submissionId && (
              <p className="text-xs text-[#3A1F0E]/50 break-all" data-testid="business-submission-id">
                Submission ID: {submissionId}
              </p>
            )}
            <div className="bg-[#FAF6EF] rounded-2xl p-4 text-left space-y-1">
              <p className="text-xs font-semibold text-[#CA922B] uppercase tracking-wide">
                What happens next
              </p>
              {outcome?.isDuplicate ? (
                <ul className="text-sm text-[#3A1F0E]/70 space-y-1 mt-2">
                  <li>• You can use the existing public listing now</li>
                  <li>• Your report is saved in the administrator duplicate-review queue</li>
                  <li>• No second public listing or map pin was created</li>
                </ul>
              ) : outcome?.status === "published" ? (
                <ul className="text-sm text-[#3A1F0E]/70 space-y-1 mt-2">
                  {isOwnerIntent ? (
                    <>
                      <li>• Your page is searchable now and connected to your profile</li>
                      <li>• You can manage the listing from your owner dashboard</li>
                      <li>• {outcome?.mapPin ? "A precise address created a map pin" : "No map pin was created; add a precise street address when you are ready"}</li>
                      <li>• Owner management does not mean the business is verified</li>
                    </>
                  ) : (
                    <>
                      <li>• It is searchable now and has a precise map pin</li>
                      <li>• It is labeled community-listed, unclaimed, and not verified</li>
                      <li>• Ownership information is community-reported, never identity verification</li>
                      <li>• The business can claim the listing through the separate claim process</li>
                    </>
                  )}
                </ul>
              ) : (
                <ul className="text-sm text-[#3A1F0E]/70 space-y-1 mt-2">
                  <li>• This record is not public and has no map pin yet</li>
                  <li>• The status explains whether location, evidence, regulated-service, or resource routing needs attention</li>
                  <li>• Software integrity checks—not another person’s approval—control these holds</li>
                </ul>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              {(outcome?.status === "published" || outcome?.isDuplicate) && outcome.businessId && (
                <Link href={`/business/${encodeURIComponent(outcome.businessId)}`}>
                  <button className="px-6 py-3 border border-[#CA922B] text-[#CA922B] font-semibold rounded-2xl hover:bg-[#CA922B]/5 transition-colors text-sm">
                    {outcome?.isDuplicate ? "View existing listing" : isOwnerIntent ? "View my business page" : "View listing"}
                  </button>
                </Link>
              )}
              {isOwnerIntent && outcome?.status === "published" && outcome.businessId && (
                <Link href={`/business-dashboard?businessId=${encodeURIComponent(outcome.businessId)}`}>
                  <button className="px-6 py-3 border border-[#CA922B] text-[#CA922B] font-semibold rounded-2xl hover:bg-[#CA922B]/5 transition-colors text-sm">
                    Manage my business
                  </button>
                </Link>
              )}
              {!amendId && (
                <button
                  onClick={() => { clientRequestId.current = crypto.randomUUID(); setUploadedAssetIds([]); setSubmissionId(""); setOutcome(null); setStep("form"); setForm({ name: "", category: "", subcategory: "", description: "", address: "", city: "", state: "", postalCode: "", country: "", website: "", phone: "", instagram: "", facebook: "", tiktok: "", youtube: "", twitch: "", snapchat: "", communityReportedOwnership: "not_sure", ownershipDesignations: [], submitterNote: "", ownerName: "", ownerBusinessEmail: "", ownerRole: "owner", ownerVerificationMethod: "manual_review", ownerAttestation: false }); }}
                  className="px-6 py-3 border border-[#CA922B]/30 text-[#CA922B] font-semibold rounded-2xl hover:bg-[#CA922B]/5 transition-colors text-sm"
                >
                  {isOwnerIntent ? "Add another business" : "Share another"}
                </button>
              )}
              <Link href="/my-business-submissions">
                <button className="px-6 py-3 bg-[#CA922B] text-white font-semibold rounded-2xl hover:bg-[#B38024] transition-colors text-sm">
                  View my submissions →
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
          <Link href={amendId ? "/my-business-submissions" : "/businesses"}>
            <button className="flex items-center gap-1.5 text-sm font-semibold text-[#F2C465] hover:text-[#FFF8EB] transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              {amendId ? "Back to my submissions" : "Back to directory"}
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
          <h1 className="font-serif text-4xl font-bold text-[#FFF8EB] mb-3">
            {amendId ? "Update Your Submission" : isOwnerIntent ? "Add My Business" : "Share a Business"}
          </h1>
          <p className="text-[#F5EBD8]/90 leading-relaxed text-lg">
            {amendId
              ? "Add the missing information. If it now passes the location, evidence, duplicate, and safety checks, it will publish immediately."
              : isOwnerIntent
              ? "Create a business page connected to your community profile. Add a public website or social profile; a precise street address is optional and only controls whether the page receives a map pin. Management access does not mean the business is verified."
              : "Recommend a business for someone else. This community submission is never linked to you as an owner."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Business name */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#F2C465]">
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
            <label className="text-sm font-bold text-[#F2C465]">
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

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#F2C465]">Subcategory</label>
            <input
              value={form.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              placeholder="e.g. Ethiopian restaurant, bookstore, HVAC"
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
            />
          </div>

          {/* City + State + postal row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#F2C465]">
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
              <label className="text-sm font-bold text-[#F2C465]">State / Region</label>
              <input
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. GA"
                className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#F2C465]">ZIP / Postal code</label>
              <input
                value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
                placeholder="e.g. 19106"
                className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#F2C465]">Country</label>
            <input
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              placeholder="e.g. United States"
              className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#F2C465] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#CA922B]" />
              Street address <span className="font-medium text-[#F5EBD8]/85">{isOwnerIntent ? "(optional — adds a truthful map pin)" : "(required for an immediate map pin)"}</span>
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
              <label className="text-sm font-bold text-[#F2C465] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#CA922B]" />
                Website{isOwnerIntent ? " or public social *" : ""}
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
              <label className="text-sm font-bold text-[#F2C465] flex items-center gap-1.5">
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

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#F2C465]">Social profiles</label>
            <p className="text-xs font-medium text-[#F5EBD8]/85">Optional. Add handles or full profile links; each is validated for the selected platform.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ["instagram", "Instagram", "@yourbusiness"],
                ["facebook", "Facebook", "facebook.com/yourbusiness"],
                ["tiktok", "TikTok", "@yourbusiness"],
                ["youtube", "YouTube", "@yourbusiness"],
                ["twitch", "Twitch", "@yourbusiness"],
                ["snapchat", "Snapchat", "@yourbusiness"],
              ] as const).map(([field, label, placeholder]) => (
                <div key={field} className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F5EBD8]">{label}</label>
                  <input
                    value={form[field]}
                    onChange={(e) => set(field, e.target.value)}
                    placeholder={placeholder}
                    inputMode="url"
                    className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#F2C465]">
              Tell us about this business <span className="font-medium text-[#F5EBD8]/85">(optional)</span>
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
            <label className="text-sm font-bold text-[#F2C465] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#CA922B]" />
              Community-reported ownership
            </label>
            <p className="text-xs font-medium text-[#F5EBD8]/90">Tell us what you understand the business to be. This is never treated as verified owner identity.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {([
                ["minority_owned", "Minority-owned"],
                ["non_minority_owned", "Non-minority-owned"],
                ["not_sure", "Not sure"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((current) => ({
                    ...current,
                    communityReportedOwnership: value,
                    ownershipDesignations: value === "minority_owned" ? current.ownershipDesignations : [],
                  }))}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${form.communityReportedOwnership === value ? "bg-[#3A1F0E] text-white border-[#3A1F0E]" : "bg-white text-[#3A1F0E] border-[#3A1F0E]/20"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.communityReportedOwnership === "minority_owned" && (
              <p className="text-xs font-medium text-[#F5EBD8]/90 pt-1">Optional: select any community-reported designations that apply.</p>
            )}
            {form.communityReportedOwnership === "minority_owned" && (
              <OwnershipDesignationCombobox
                id="community-reported-ownership-designations"
                options={OWNERSHIP_OPTIONS}
                values={form.ownershipDesignations}
                onChange={(ownershipDesignations) => setForm((current) => ({
                  ...current,
                  communityReportedOwnership: "minority_owned",
                  ownershipDesignations,
                }))}
                label="Community-reported designation"
                helperText="Type Black, HIS, Ethiopian, or another available designation, then select it. This is community-reported and never a verification claim."
              />
            )}
          </div>

          {isOwnerIntent && (
            <div className="rounded-2xl border border-[#F2C465]/45 bg-[#241810]/70 p-5 space-y-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#FFF8EB]">Your ownership request</h2>
                <p className="mt-1 text-sm leading-6 text-[#F5EBD8]/90">This keeps your personal profile and business request connected. Approval grants page-management access; it never creates a verification badge or changes community-reported ownership.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#F2C465]">Your name <span className="text-[#CA922B]">*</span></label>
                  <input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Full name" className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#F2C465]">Business email <span className="text-[#CA922B]">*</span></label>
                  <input type="email" value={form.ownerBusinessEmail} onChange={(e) => set("ownerBusinessEmail", e.target.value)} placeholder="owner@yourbusiness.com" className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><label className="text-sm font-bold text-[#F2C465]">Your role</label><select value={form.ownerRole} onChange={(e) => set("ownerRole", e.target.value)} className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"><option value="owner">Owner</option><option value="co-owner">Co-owner</option><option value="manager">Manager</option><option value="authorized_rep">Authorized representative</option></select></div>
                <div className="space-y-1.5"><label className="text-sm font-bold text-[#F2C465]">How can we review it?</label><select value={form.ownerVerificationMethod} onChange={(e) => set("ownerVerificationMethod", e.target.value)} className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-[#3A1F0E] focus:outline-none focus:border-[#CA922B]/60 bg-white text-sm"><option value="manual_review">Details for review</option><option value="domain_email">Business-domain email</option><option value="social_account">Business social account</option><option value="booking_page">Booking page</option><option value="business_document">Business document</option></select></div>
              </div>
              <label className="flex items-start gap-3 text-sm leading-6 text-[#F5EBD8] cursor-pointer"><input type="checkbox" checked={form.ownerAttestation} onChange={(e) => setForm((current) => ({ ...current, ownerAttestation: e.target.checked }))} className="mt-1 h-4 w-4 accent-[#CA922B]" /><span>I confirm that I am the owner or authorized representative and that this information is accurate. <span className="text-[#CA922B]">*</span></span></label>
            </div>
          )}

          {/* Photos */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#F2C465]">
              Photos <span className="font-medium text-[#F5EBD8]/85">(optional)</span>
            </label>
            <MediaUploader
              purpose="business_submission"
              maxFiles={3}
              accept="images"
              label="Add photos of this business"
              onFilesChange={(files) => setUploadedAssetIds((current) => Array.from(new Set([...current, ...getMediaAssetIds(files)])))}
            />
            {amendId && uploadedAssetIds.length > 0 && (
              <p className="text-xs font-medium text-[#F5EBD8]/85">{uploadedAssetIds.length} previously submitted photo{uploadedAssetIds.length === 1 ? " is" : "s are"} retained privately for moderation.</p>
            )}
          </div>

          {/* Note to reviewer */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#F2C465]">
              Note to our team <span className="font-medium text-[#F5EBD8]/85">(optional)</span>
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
            disabled={submitting || !form.name.trim() || !form.category || !form.city.trim() || (isOwnerIntent && (!form.ownerName.trim() || !form.ownerBusinessEmail.includes("@") || !form.ownerAttestation))}
            className="w-full bg-[#CA922B] text-white font-bold py-4 rounded-2xl hover:bg-[#B38024] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting…
              </span>
            ) : (
              amendId ? "Update business →" : isOwnerIntent ? "Submit my business request →" : "Share business →"
            )}
          </button>

          <p className="text-center text-xs font-medium text-[#F5EBD8]/85">
            {isOwnerIntent
              ? "Your business page can publish with a business name, category, city, public website or social profile, and attestation. A precise address only controls the map pin. Regulated, resource, duplicate, and unsafe records stay private. Publication never means verified ownership."
              : "Complete ordinary businesses with a precise address and public website or social profile can publish immediately. Regulated, resource, duplicate, unsafe, or unlocatable records stay private. Publication never means verified ownership."}
          </p>
        </form>
      </div>
    </Layout>
  );
}
