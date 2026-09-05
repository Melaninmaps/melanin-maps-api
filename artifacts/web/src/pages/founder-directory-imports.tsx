import { useEffect, useMemo, useState } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Link, Redirect } from "wouter";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { Layout } from "@/components/layout";
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileSearch,
  Link2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type CandidateStatus = "pending_review" | "needs_research" | "declined" | "approved" | "published";
type TargetKind = "business" | "community_resource" | "regulated_review" | "manual_review" | "internal_only";
type ResourceCategory = "essential_support" | "education" | "jobs" | "business" | "housing" | "safety_rights";

interface Candidate {
  id: string;
  batch_id: string;
  source_row: number;
  target_kind: TargetKind;
  status: CandidateStatus;
  name: string;
  city: string;
  state: string;
  category: string;
  subcategory: string | null;
  cultural_specialty: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  source_url: string | null;
  source_name: string | null;
  source_status: string | null;
  ownership_designations: string[];
  ownership_evidence: string | null;
  regulated_profession: boolean;
  public_display_recommendation: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  social_source_url: string | null;
  price_range: string | null;
  price_basis: string | null;
  link_validation: Record<string, unknown>;
  notes: string | null;
  matched_business_id: string | null;
  published_record_type: "business" | "resource" | null;
  published_record_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  review_evidence: Record<string, unknown>;
  review_revision: number;
  created_at: string;
  updated_at: string;
}

interface CandidateResponse {
  candidates: Candidate[];
  total: number;
  limit: number;
  offset: number;
}

interface BatchSummary {
  id: string;
  source_name: string;
  source_row_count: number;
  status: string;
  candidate_count: number;
  pending_review_count: number;
  needs_research_count: number;
  published_count: number;
  declined_count: number;
  business_count: number;
  resource_count: number;
  regulated_count: number;
}

const RESOURCE_CATEGORIES: Array<{ value: ResourceCategory; label: string }> = [
  { value: "essential_support", label: "Essential Support" },
  { value: "education", label: "Education" },
  { value: "jobs", label: "Jobs & Training" },
  { value: "business", label: "Business Support" },
  { value: "housing", label: "Housing" },
  { value: "safety_rights", label: "Safety, Rights & Health" },
];

const STATUS_LABELS: Record<CandidateStatus, string> = {
  pending_review: "Pending review",
  needs_research: "Held for research",
  declined: "Declined",
  approved: "Approved",
  published: "Published",
};

const STATUS_STYLES: Record<CandidateStatus, string> = {
  pending_review: "bg-amber-100 text-amber-900",
  needs_research: "bg-blue-100 text-blue-900",
  declined: "bg-red-100 text-red-800",
  approved: "bg-violet-100 text-violet-800",
  published: "bg-green-100 text-green-800",
};

function createDecisionKey(candidateId: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `directory-${candidateId}-${crypto.randomUUID()}`
    : `directory-${candidateId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function gates(candidate: Candidate): string[] {
  const raw = candidate.link_validation?.reviewGates;
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}

function prettyGate(gate: string): string {
  const labels: Record<string, string> = {
    link_requires_research: "A link is broken, unavailable, or not yet checked",
    regulated_profession: "Regulated profession evidence is required",
    "target_kind:regulated_review": "Regulated candidate — manual review required",
    "target_kind:manual_review": "Destination and identity need manual review",
    "target_kind:internal_only": "Internal intelligence — never publish",
    ownership_evidence_review: "Ownership evidence needs review",
    duplicate_within_batch: "Possible duplicate inside this import batch",
    existing_record_reconciliation: "Known canonical reconciliation match",
    existing_record_match: "Possible match to a current canonical business",
  };
  return labels[gate] ?? gate.replace(/[_:]/g, " ");
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold uppercase tracking-wide text-[#3A1F0E]/70 mb-1.5">{children}</label>;
}

const INPUT_CLASS = "w-full rounded-xl border border-[#7B6048]/45 bg-white px-3 py-2.5 text-sm text-[#2B1507] placeholder:text-[#6E5A48]/65 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 focus:border-[#CA922B]";

export default function FounderDirectoryImports({ embedded = false }: { embedded?: boolean }) {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const user = auth?.user as { id?: string; role?: string } | undefined;
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [batchId, setBatchId] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<CandidateStatus | "all">("needs_research");
  const [targetKind, setTargetKind] = useState<TargetKind | "all">("all");
  const [city, setCity] = useState("Phoenix");
  const [state, setState] = useState("AZ");
  const [query, setQuery] = useState("HVAC");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [linkEvidenceConfirmed, setLinkEvidenceConfirmed] = useState(false);
  const [ownershipEvidenceConfirmed, setOwnershipEvidenceConfirmed] = useState(false);
  const [omitOwnershipDesignations, setOmitOwnershipDesignations] = useState(false);
  const [licenseAuthority, setLicenseAuthority] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseSourceUrl, setLicenseSourceUrl] = useState("");
  const [licenseValidationToken, setLicenseValidationToken] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationSource, setLocationSource] = useState("");
  const [locationSourceUrl, setLocationSourceUrl] = useState("");
  const [locationDisplayName, setLocationDisplayName] = useState("");
  const [locationResolvedCity, setLocationResolvedCity] = useState("");
  const [locationResolvedState, setLocationResolvedState] = useState("");
  const [locationSuggestionToken, setLocationSuggestionToken] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [suggestingLocation, setSuggestingLocation] = useState(false);
  const [resourceCategory, setResourceCategory] = useState<ResourceCategory>("education");
  const [resourceSourceTier, setResourceSourceTier] = useState<"official" | "verified_org" | "community_confirmed" | "community_shared">("community_shared");
  const [resourceSourceUrl, setResourceSourceUrl] = useState("");
  const [resourceValidationToken, setResourceValidationToken] = useState("");
  const [resourceOrganization, setResourceOrganization] = useState("");
  const [validatingEvidence, setValidatingEvidence] = useState<"regulated" | "resource" | null>(null);
  const [memberFacingUrl, setMemberFacingUrl] = useState("");
  const [existingRecordId, setExistingRecordId] = useState("");

  if (!authLoading && (!user?.id || user.role !== "admin")) return <Redirect to="/" />;

  const selected = useMemo(() => candidates.find((candidate) => candidate.id === expanded) ?? null, [candidates, expanded]);

  const resetReviewForm = (candidate?: Candidate | null) => {
    setReviewNote(candidate?.review_note ?? "");
    setLinkEvidenceConfirmed(false);
    setOwnershipEvidenceConfirmed(false);
    setOmitOwnershipDesignations(false);
    setLicenseAuthority("");
    setLicenseNumber("");
    setLicenseSourceUrl("");
    setLicenseValidationToken("");
    setLatitude("");
    setLongitude("");
    setLocationSource("");
    setLocationSourceUrl("");
    setLocationDisplayName("");
    setLocationResolvedCity("");
    setLocationResolvedState("");
    setLocationSuggestionToken("");
    setLocationConfirmed(false);
    setResourceCategory(candidate?.subcategory?.toLowerCase().includes("apprentice") ? "education" : "essential_support");
    setResourceSourceTier("community_shared");
    setResourceSourceUrl(candidate?.source_url ?? "");
    setResourceValidationToken("");
    setResourceOrganization(candidate?.source_name ?? "");
    setMemberFacingUrl(candidate?.website ?? "");
    setExistingRecordId(candidate?.matched_business_id ?? "");
  };

  const loadBatches = async () => {
    const response = await authenticatedFetch(`${BASE}api/founder/directory-import-batches`);
    if (!response.ok) throw new Error("Failed to load import batches.");
    const data = await response.json() as { batches: BatchSummary[] };
    setBatches(data.batches);
    if (!batchId && data.batches[0]?.id) setBatchId(data.batches[0].id);
  };

  const loadCandidates = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: "100", offset: "0" });
    if (batchId) params.set("batchId", batchId);
    if (status !== "all") params.set("status", status);
    if (targetKind !== "all") params.set("targetKind", targetKind);
    if (city.trim()) params.set("city", city.trim());
    if (state.trim()) params.set("state", state.trim());
    if (query.trim()) params.set("q", query.trim());
    try {
      const response = await authenticatedFetch(`${BASE}api/founder/directory-import-candidates?${params}`);
      if (!response.ok) throw new Error("Failed to load candidate queue.");
      const data = await response.json() as CandidateResponse;
      setCandidates(data.candidates);
      setTotal(data.total);
      if (expanded && !data.candidates.some((candidate) => candidate.id === expanded)) setExpanded(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load candidate queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadBatches().catch(() => setError("Failed to load import batches."));
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    const timer = window.setTimeout(() => { void loadCandidates(); }, 150);
    return () => window.clearTimeout(timer);
  }, [user?.role, batchId, status, targetKind, city, state, query]);

  const validateEvidenceSource = async (candidate: Candidate, purpose: "regulated" | "resource") => {
    const sourceUrl = purpose === "regulated" ? licenseSourceUrl.trim() : resourceSourceUrl.trim();
    if (!sourceUrl) {
      setError("Enter the source URL before running the live check.");
      return;
    }
    setValidatingEvidence(purpose);
    setError(null);
    setNotice(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/founder/directory-import-candidates/${candidate.id}/validate-evidence-url`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purpose, url: sourceUrl }),
        },
      );
      const data = await response.json() as {
        validation?: { url: string; finalHost: string; status: number; checkedAt: string };
        validationToken?: string;
        message?: string;
        error?: string;
      };
      if (!response.ok || !data.validation || !data.validationToken) {
        throw new Error(data.error ?? "The source did not pass live validation.");
      }
      if (purpose === "regulated") {
        setLicenseSourceUrl(data.validation.url);
        setLicenseValidationToken(data.validationToken);
      } else {
        setResourceSourceUrl(data.validation.url);
        setResourceValidationToken(data.validationToken);
        if (!memberFacingUrl.trim()) setMemberFacingUrl(data.validation.url);
      }
      setNotice(`${data.message ?? "Live URL validation passed."} Final host: ${data.validation.finalHost}.`);
    } catch (validationError) {
      if (purpose === "regulated") setLicenseValidationToken("");
      else setResourceValidationToken("");
      setError(validationError instanceof Error ? validationError.message : "Failed to validate the evidence URL.");
    } finally {
      setValidatingEvidence(null);
    }
  };

  const suggestLocation = async (candidate: Candidate) => {
    setSuggestingLocation(true);
    setError(null);
    setNotice(null);
    setLocationConfirmed(false);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/founder/directory-import-candidates/${candidate.id}/location-suggestion`,
        { method: "POST", credentials: "include" },
      );
      const data = await response.json() as {
        suggestion?: {
          latitude: number;
          longitude: number;
          source: string;
          sourceUrl: string;
          checkedAt: string;
          displayName?: string;
          resolvedCity?: string;
          resolvedState?: string;
        };
        suggestionToken?: string;
        message?: string;
        error?: string;
      };
      if (!response.ok || !data.suggestion || !data.suggestionToken) throw new Error(data.error ?? "No matching location suggestion was found.");
      setLatitude(String(data.suggestion.latitude));
      setLongitude(String(data.suggestion.longitude));
      setLocationSource(data.suggestion.source);
      setLocationSourceUrl(data.suggestion.sourceUrl);
      setLocationDisplayName(data.suggestion.displayName ?? "");
      setLocationResolvedCity(data.suggestion.resolvedCity ?? "");
      setLocationResolvedState(data.suggestion.resolvedState ?? "");
      setLocationSuggestionToken(data.suggestionToken);
      setNotice(data.message ?? "Review and confirm this location before publication.");
    } catch (suggestionError) {
      setError(suggestionError instanceof Error ? suggestionError.message : "Failed to prepare a location suggestion.");
    } finally {
      setSuggestingLocation(false);
    }
  };

  const decide = async (candidate: Candidate, action: "publish" | "link_existing" | "needs_research" | "decline") => {
    setProcessing(candidate.id);
    setNotice(null);
    setError(null);
    const checkedAt = new Date().toISOString();
    const body: Record<string, unknown> = {
      action,
      expectedRevision: candidate.review_revision,
      reviewNote: reviewNote.trim() || undefined,
      linkEvidenceConfirmed,
      ownershipEvidenceConfirmed,
      omitOwnershipDesignations,
      memberFacingUrl: memberFacingUrl.trim() || undefined,
      existingRecordId: existingRecordId.trim() || undefined,
    };
    if (candidate.regulated_profession || candidate.target_kind === "regulated_review") {
      body.regulatedEvidence = {
        authority: licenseAuthority.trim(),
        licenseNumber: licenseNumber.trim(),
        licenseStatus: "active",
        sourceUrl: licenseSourceUrl.trim(),
        checkedAt,
        validationToken: licenseValidationToken,
      };
    }
    if (locationSuggestionToken) {
      body.locationEvidence = {
        suggestionToken: locationSuggestionToken,
        confirmedByReviewer: locationConfirmed,
      };
    }
    if (candidate.target_kind === "community_resource") {
      body.resourceCategory = resourceCategory;
      body.resourceSourceTier = resourceSourceTier;
      body.resourceEvidence = {
        sourceUrl: resourceSourceUrl.trim(),
        organization: resourceOrganization.trim() || undefined,
        checkedAt,
        validationToken: resourceValidationToken,
      };
    }
    try {
      const response = await authenticatedFetch(
        `${BASE}api/founder/directory-import-candidates/${candidate.id}/decision`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": createDecisionKey(candidate.id),
          },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json() as { message?: string; error?: string; holds?: string[]; businessId?: string; resourceId?: string };
      if (!response.ok) {
        if (data.businessId || data.resourceId) setExistingRecordId(data.businessId ?? data.resourceId ?? "");
        const holds = data.holds?.length ? ` ${data.holds.join(" ")}` : "";
        throw new Error(`${data.error ?? "Decision failed."}${holds}`);
      }
      setNotice(data.message ?? "Decision saved.");
      setExpanded(null);
      resetReviewForm();
      await Promise.all([loadBatches(), loadCandidates()]);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "Decision failed.");
    } finally {
      setProcessing(null);
    }
  };

  const content = (
    <div className={embedded ? "max-w-6xl mx-auto" : "max-w-6xl mx-auto px-4 py-10"}>
      {!embedded && (
        <Link href="/admin">
          <button className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6E4A25] hover:text-[#CA922B]">
            <ArrowLeft className="w-4 h-4" /> Admin panel
          </button>
        </Link>
      )}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#CA922B]/15 flex items-center justify-center">
              <FileSearch className="w-6 h-6 text-[#9A6B18]" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#2B1507]">Founder Directory Review</h1>
              <p className="text-[#3A1F0E]/70 mt-1">Review candidates before anything becomes searchable.</p>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#3A1F0E]/75">
            Business publications are labeled <strong>founder/community-listed, unclaimed, and not verified</strong>.
            Resources publish only to Resources. Regulated services, ownership claims, duplicates, and unresolved links stay held until their evidence is recorded.
          </p>
        </div>
        <button onClick={() => void Promise.all([loadBatches(), loadCandidates()])} className="inline-flex items-center gap-2 rounded-xl border border-[#CA922B]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#6E4A25] hover:bg-[#FFF8E8]">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {batches[0] && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            ["Candidates", batches[0].candidate_count],
            ["Pending", batches[0].pending_review_count],
            ["Held", batches[0].needs_research_count],
            ["Published", batches[0].published_count],
            ["Resources", batches[0].resource_count],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-[#D7C3A6] bg-white px-4 py-3">
              <div className="text-2xl font-bold text-[#2B1507]">{value}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#3A1F0E]/55">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[#D7C3A6] bg-[#FFFDF9] p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <FieldLabel>Search</FieldLabel>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#6E5A48]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, category, HVAC…" className={`${INPUT_CLASS} pl-9`} />
            </div>
          </div>
          <div>
            <FieldLabel>City</FieldLabel>
            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Phoenix" className={INPUT_CLASS} />
          </div>
          <div>
            <FieldLabel>State</FieldLabel>
            <input value={state} onChange={(event) => setState(event.target.value)} placeholder="AZ" className={INPUT_CLASS} />
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select value={status} onChange={(event) => setStatus(event.target.value as CandidateStatus | "all")} className={INPUT_CLASS}>
              <option value="all">All statuses</option>
              <option value="pending_review">Pending review</option>
              <option value="needs_research">Held for research</option>
              <option value="published">Published</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          <div>
            <FieldLabel>Destination</FieldLabel>
            <select value={targetKind} onChange={(event) => setTargetKind(event.target.value as TargetKind | "all")} className={INPUT_CLASS}>
              <option value="all">All destinations</option>
              <option value="business">Business</option>
              <option value="regulated_review">Regulated business</option>
              <option value="community_resource">Resource</option>
              <option value="manual_review">Manual review</option>
              <option value="internal_only">Internal only</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-[#3A1F0E]/65">{total.toLocaleString()} matching candidate{total === 1 ? "" : "s"}</div>
      </div>

      {notice && <div className="mb-4 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">{notice}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>}

      {loading ? (
        <div className="py-16 text-center text-[#3A1F0E]/60">Loading review queue…</div>
      ) : candidates.length === 0 ? (
        <div className="rounded-2xl border border-[#D7C3A6] bg-white py-16 text-center">
          <FileSearch className="w-10 h-10 text-[#3A1F0E]/25 mx-auto mb-3" />
          <p className="font-semibold text-[#2B1507]">No candidates match these filters.</p>
          <p className="text-sm text-[#3A1F0E]/60 mt-1">Nothing is silently substituted or published.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => {
            const open = expanded === candidate.id;
            const candidateGates = gates(candidate);
            const isResource = candidate.target_kind === "community_resource";
            const canDecide = candidate.status !== "published" && candidate.status !== "declined" && candidate.target_kind !== "internal_only" && candidate.target_kind !== "manual_review";
            return (
              <section key={candidate.id} className="overflow-hidden rounded-2xl border border-[#D7C3A6] bg-white">
                <button
                  className="w-full p-5 flex items-start gap-4 text-left hover:bg-[#FFF8E8]/70"
                  onClick={() => {
                    const next = open ? null : candidate.id;
                    setExpanded(next);
                    resetReviewForm(next ? candidate : null);
                  }}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${isResource ? "bg-blue-100" : "bg-amber-100"}`}>
                    {isResource ? <ShieldCheck className="w-5 h-5 text-blue-700" /> : <BriefcaseBusiness className="w-5 h-5 text-amber-800" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-[#2B1507]">{candidate.name}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[candidate.status]}`}>{STATUS_LABELS[candidate.status]}</span>
                      <span className="rounded-full bg-[#F2E8D8] px-2.5 py-0.5 text-xs font-semibold text-[#5B3A1F]">{isResource ? "Resources destination" : candidate.target_kind === "regulated_review" ? "Regulated business review" : candidate.target_kind.replace(/_/g, " ")}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#3A1F0E]/65">
                      <span>{candidate.subcategory ?? candidate.category}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {candidate.city}, {candidate.state}</span>
                      <span>Source row {candidate.source_row.toLocaleString()}</span>
                    </div>
                    {!isResource && candidate.status === "published" && <p className="mt-2 text-xs font-semibold text-green-800">Community/founder-listed • Unclaimed • Not verified</p>}
                  </div>
                  <ChevronDown className={`w-5 h-5 shrink-0 text-[#6E5A48] transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && selected?.id === candidate.id && (
                  <div className="border-t border-[#E5D5BE] bg-[#FFFCF7] p-5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-bold text-[#2B1507]">Intended destination:</span> <span className="text-[#3A1F0E]/75">{isResource ? "Resources (never Businesses)" : "Business directory"}</span></div>
                      <div><span className="font-bold text-[#2B1507]">Source status:</span> <span className="text-[#3A1F0E]/75">{candidate.source_status ?? "Not supplied"}</span></div>
                      <div><span className="font-bold text-[#2B1507]">Address:</span> <span className="text-[#3A1F0E]/75">{candidate.address ?? "Not supplied"}</span></div>
                      <div><span className="font-bold text-[#2B1507]">Phone:</span> <span className="text-[#3A1F0E]/75">{candidate.phone ?? "Not supplied"}</span></div>
                      <div><span className="font-bold text-[#2B1507]">Source:</span> <span className="text-[#3A1F0E]/75">{candidate.source_name ?? "Founder master"}</span></div>
                      <div><span className="font-bold text-[#2B1507]">Canonical match:</span> <span className="text-[#3A1F0E]/75">{candidate.matched_business_id ?? "None recorded"}</span></div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[candidate.website, candidate.source_url, candidate.instagram_url, candidate.facebook_url, candidate.tiktok_url].filter(Boolean).map((url) => (
                        <a key={url!} href={url!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[#B9945C] bg-white px-3 py-1.5 text-xs font-semibold text-[#6E4A25] hover:bg-[#FFF4DC]">
                          <ExternalLink className="w-3.5 h-3.5" /> Review source
                        </a>
                      ))}
                    </div>

                    {candidateGates.length > 0 && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 font-bold text-amber-950"><AlertTriangle className="w-4 h-4" /> Required review holds</div>
                        <ul className="mt-2 space-y-1 text-sm text-amber-950/85 list-disc pl-5">
                          {candidateGates.map((gate) => <li key={gate}>{prettyGate(gate)}</li>)}
                        </ul>
                      </div>
                    )}

                    {(candidate.ownership_designations ?? []).length > 0 && (
                      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                        <p className="text-sm font-bold text-violet-950">External ownership designation</p>
                        <p className="mt-1 text-sm text-violet-900/80">{candidate.ownership_designations.join(", ")}</p>
                        {candidate.ownership_evidence && <p className="mt-2 text-xs leading-relaxed text-violet-900/75">{candidate.ownership_evidence}</p>}
                      </div>
                    )}

                    {candidate.status === "published" || candidate.status === "declined" ? (
                      <div className={`rounded-xl p-4 ${STATUS_STYLES[candidate.status]}`}>
                        <strong>{STATUS_LABELS[candidate.status]}</strong>
                        {candidate.review_note && <p className="mt-1 text-sm">{candidate.review_note}</p>}
                        {candidate.published_record_id && <p className="mt-1 text-sm">Published {candidate.published_record_type}: {candidate.published_record_id}</p>}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div>
                          <FieldLabel>Founder review note</FieldLabel>
                          <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={3} placeholder="Record what was checked, what remains uncertain, or why this decision is appropriate." className={`${INPUT_CLASS} resize-y`} />
                        </div>

                        <label className="flex items-start gap-3 rounded-xl border border-[#D7C3A6] bg-white p-3 text-sm text-[#2B1507]">
                          <input type="checkbox" checked={linkEvidenceConfirmed} onChange={(event) => setLinkEvidenceConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#CA922B]" />
                          <span><strong>I reviewed every final public link.</strong> Broken, unrelated, or unconfirmed links will not be shown to members.</span>
                        </label>

                        {(candidate.ownership_designations ?? []).length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex items-start gap-3 rounded-xl border border-[#D7C3A6] bg-white p-3 text-sm text-[#2B1507]">
                              <input type="checkbox" checked={ownershipEvidenceConfirmed} onChange={(event) => setOwnershipEvidenceConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#CA922B]" />
                              <span>Source explicitly supports the listed ownership designation.</span>
                            </label>
                            <label className="flex items-start gap-3 rounded-xl border border-[#D7C3A6] bg-white p-3 text-sm text-[#2B1507]">
                              <input type="checkbox" checked={omitOwnershipDesignations} onChange={(event) => setOmitOwnershipDesignations(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#CA922B]" />
                              <span>Omit ownership designations from the public listing.</span>
                            </label>
                          </div>
                        )}

                        {(candidate.regulated_profession || candidate.target_kind === "regulated_review") && (
                          <fieldset className="rounded-xl border border-blue-300 bg-blue-50 p-4">
                            <legend className="px-1 text-sm font-bold text-blue-950">Current regulated-profession evidence</legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                              <div><FieldLabel>Licensing authority</FieldLabel><input value={licenseAuthority} onChange={(event) => setLicenseAuthority(event.target.value)} placeholder="Arizona Registrar of Contractors" className={INPUT_CLASS} /></div>
                              <div><FieldLabel>License number</FieldLabel><input value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} placeholder="Verified current license number" className={INPUT_CLASS} /></div>
                              <div><FieldLabel>Official evidence URL</FieldLabel><input value={licenseSourceUrl} onChange={(event) => { setLicenseSourceUrl(event.target.value); setLicenseValidationToken(""); }} placeholder="https://…" className={INPUT_CLASS} /></div>
                            </div>
                            <button type="button" onClick={() => void validateEvidenceSource(candidate, "regulated")} disabled={validatingEvidence !== null} className="mt-3 rounded-xl border border-blue-400 bg-white px-3 py-2 text-sm font-bold text-blue-900 disabled:opacity-50">
                              {validatingEvidence === "regulated" ? "Checking official source…" : "Run live official-source check"}
                            </button>
                            {licenseValidationToken && <p className="mt-2 text-sm font-semibold text-emerald-800">Live official-source check passed for this review.</p>}
                          </fieldset>
                        )}

                        {isResource && (
                          <fieldset className="rounded-xl border border-sky-300 bg-sky-50 p-4">
                            <legend className="px-1 text-sm font-bold text-sky-950">Resources publication</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                              <div>
                                <FieldLabel>Resources category</FieldLabel>
                                <select value={resourceCategory} onChange={(event) => setResourceCategory(event.target.value as ResourceCategory)} className={INPUT_CLASS}>
                                  {RESOURCE_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <FieldLabel>Reviewed source tier</FieldLabel>
                                <select value={resourceSourceTier} onChange={(event) => setResourceSourceTier(event.target.value as typeof resourceSourceTier)} className={INPUT_CLASS}>
                                  <option value="community_shared">Community shared</option>
                                  <option value="community_confirmed">Community confirmed</option>
                                  <option value="verified_org">Verified organization</option>
                                  <option value="official">Official government source</option>
                                </select>
                              </div>
                              <div><FieldLabel>Source organization</FieldLabel><input value={resourceOrganization} onChange={(event) => setResourceOrganization(event.target.value)} placeholder="City of Phoenix" className={INPUT_CLASS} /></div>
                              <div><FieldLabel>Current source URL</FieldLabel><input value={resourceSourceUrl} onChange={(event) => { setResourceSourceUrl(event.target.value); setResourceValidationToken(""); }} placeholder="https://official-source.example/…" className={INPUT_CLASS} /></div>
                              <div><FieldLabel>Member-facing action URL</FieldLabel><input value={memberFacingUrl} onChange={(event) => setMemberFacingUrl(event.target.value)} placeholder="https://apply-or-learn-more.example/…" className={INPUT_CLASS} /></div>
                            </div>
                            <button type="button" onClick={() => void validateEvidenceSource(candidate, "resource")} disabled={validatingEvidence !== null} className="mt-3 rounded-xl border border-sky-400 bg-white px-3 py-2 text-sm font-bold text-sky-900 disabled:opacity-50">
                              {validatingEvidence === "resource" ? "Checking resource source…" : "Run live resource-source check"}
                            </button>
                            {resourceValidationToken && <p className="mt-2 text-sm font-semibold text-emerald-800">Live resource-source check passed for this review.</p>}
                          </fieldset>
                        )}

                        {!isResource && (
                          <div>
                            <FieldLabel>Public business website override (optional, reviewed)</FieldLabel>
                            <input value={memberFacingUrl} onChange={(event) => setMemberFacingUrl(event.target.value)} placeholder="Leave blank if no confirmed official site" className={INPUT_CLASS} />
                          </div>
                        )}

                        {!isResource && (
                          <fieldset className="rounded-xl border border-[#D7C3A6] bg-white p-4">
                          <legend className="px-1 text-sm font-bold text-[#2B1507]">Location evidence (required, server-validated, and founder-confirmed)</legend>
                          {candidate.address ? (
                            <button type="button" onClick={() => void suggestLocation(candidate)} disabled={suggestingLocation} className="mb-3 inline-flex items-center gap-2 rounded-xl border border-[#CA922B]/50 bg-[#FFF8E8] px-3 py-2 text-sm font-bold text-[#6E4A25] disabled:opacity-50">
                              <MapPin className="w-4 h-4" /> {suggestingLocation ? "Checking address…" : "Get validated address suggestion"}
                            </button>
                          ) : (
                            <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">A complete reviewable street address is required before this candidate can receive a location suggestion or publish.</div>
                          )}
                          {locationDisplayName && (
                            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                              <strong>Resolved address:</strong> {locationDisplayName}
                              {(locationResolvedCity || locationResolvedState) && <div className="mt-1 text-xs">Locality check: {[locationResolvedCity, locationResolvedState].filter(Boolean).join(", ")}</div>}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            <div><FieldLabel>Latitude</FieldLabel><input value={latitude} readOnly placeholder="Generated after validation" className={`${INPUT_CLASS} bg-[#F5F1EA]`} /></div>
                            <div><FieldLabel>Longitude</FieldLabel><input value={longitude} readOnly placeholder="Generated after validation" className={`${INPUT_CLASS} bg-[#F5F1EA]`} /></div>
                            <div><FieldLabel>Location source</FieldLabel><input value={locationSource} readOnly placeholder="Generated after validation" className={`${INPUT_CLASS} bg-[#F5F1EA]`} /></div>
                            <div><FieldLabel>Location evidence URL</FieldLabel><input value={locationSourceUrl} readOnly placeholder="Generated after validation" className={`${INPUT_CLASS} bg-[#F5F1EA]`} /></div>
                          </div>
                          {(latitude || longitude || locationSourceUrl) && (
                            <label className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950">
                              <input type="checkbox" checked={locationConfirmed} onChange={(event) => setLocationConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-700" />
                              <span>I compared this location with the candidate address and source and confirm it is the correct member-facing location.</span>
                            </label>
                          )}
                          </fieldset>
                        )}

                        {(candidate.matched_business_id || candidateGates.includes("duplicate_within_batch") || existingRecordId) && (
                          <div>
                            <FieldLabel>Existing canonical record ID</FieldLabel>
                            <input value={existingRecordId} onChange={(event) => setExistingRecordId(event.target.value)} placeholder="Select or paste reviewed canonical record ID" className={INPUT_CLASS} />
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {canDecide && (
                            <button onClick={() => void decide(candidate, "publish")} disabled={processing === candidate.id} className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50">
                              <CheckCircle2 className="w-4 h-4" /> {processing === candidate.id ? "Processing…" : isResource ? "Publish to Resources" : "Publish unclaimed listing"}
                            </button>
                          )}
                          {canDecide && (candidate.matched_business_id || candidateGates.includes("duplicate_within_batch") || existingRecordId) && (
                            <button onClick={() => void decide(candidate, "link_existing")} disabled={processing === candidate.id} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-50">
                              <Link2 className="w-4 h-4" /> Link existing record
                            </button>
                          )}
                          <button onClick={() => void decide(candidate, "needs_research")} disabled={processing === candidate.id} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">
                            <AlertTriangle className="w-4 h-4" /> Keep held for research
                          </button>
                          <button onClick={() => void decide(candidate, "decline")} disabled={processing === candidate.id} className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2.5 text-sm font-bold text-red-800 hover:bg-red-200 disabled:opacity-50">
                            <XCircle className="w-4 h-4" /> Decline
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
}
