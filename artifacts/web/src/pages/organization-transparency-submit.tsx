import { useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowLeft, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/layout";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;
const ORGANIZATION_TYPES = [
  "employer",
  "healthcare_facility",
  "hospital",
  "school",
  "professional_service",
  "retailer",
  "nonprofit",
  "government_service",
  "other",
] as const;
const RELATIONSHIPS = [
  "current_employee",
  "former_employee",
  "contractor",
  "job_applicant",
  "customer",
  "patient",
  "caregiver",
] as const;

type Candidate = {
  id: string;
  legalName: string;
  displayName: string | null;
  city: string;
  state: string | null;
  organizationType: string;
  factualStatus: string;
};

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function OrganizationTransparencySubmit() {
  const search = useSearch();
  const amendmentId = new URLSearchParams(search).get("amend");
  const [form, setForm] = useState({
    legalName: "",
    displayName: "",
    organizationType: "employer",
    ownershipStatus: "unknown",
    city: "",
    state: "",
    country: "",
    website: "",
    phone: "",
    relationshipToOrganization: "customer",
    submitterNote: "",
  });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<{
    organizationId: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(crypto.randomUUID());
  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (["legalName", "city", "state"].includes(field)) setCandidates([]);
  };
  const canCheck =
    form.legalName.trim().length >= 2 && form.city.trim().length >= 2;

  async function checkDuplicates() {
    if (!canCheck) return;
    setChecking(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        legalName: form.legalName.trim(),
        city: form.city.trim(),
        ...(form.state.trim() ? { state: form.state.trim() } : {}),
      });
      const response = await authenticatedFetch(
        `${BASE}api/organizations/duplicate-candidates?${query.toString()}`,
      );
      const body = (await response.json().catch(() => ({}))) as {
        candidates?: Candidate[];
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          body.error ?? "Unable to check existing organizations.",
        );
      setCandidates(Array.isArray(body.candidates) ? body.candidates : []);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to check existing organizations.",
      );
    } finally {
      setChecking(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canCheck) {
      setError("Organization name and city are required.");
      return;
    }
    if (candidates.length > 0) {
      setError(
        "A matching organization may already exist. Use the existing factual profile instead of creating a duplicate.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await authenticatedFetch(
        amendmentId
          ? `${BASE}api/community/organizations/${encodeURIComponent(amendmentId)}`
          : `${BASE}api/community/organizations`,
        {
          method: amendmentId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": requestId.current,
          },
          body: JSON.stringify({
            legalName: form.legalName.trim(),
            displayName: form.displayName.trim() || undefined,
            organizationType: form.organizationType,
            ownershipStatus: form.ownershipStatus,
            website: form.website.trim() || undefined,
            phone: form.phone.trim() || undefined,
            location: {
              city: form.city.trim(),
              state: form.state.trim() || undefined,
              country: form.country.trim() || undefined,
            },
            relationshipToOrganization: form.relationshipToOrganization,
            submitterNote: form.submitterNote.trim() || undefined,
            clientRequestId: requestId.current,
          }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        organizationId?: string;
        message?: string;
        error?: string;
      };
      if (!response.ok || !body.organizationId)
        throw new Error(body.error ?? "Organization submission failed.");
      setOutcome({
        organizationId: body.organizationId,
        message:
          body.message ?? "Your organization is awaiting factual review.",
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Organization submission failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (outcome)
    return (
      <Layout>
        <main className="min-h-screen bg-[#1A1209] px-4 py-16">
          <section className="mx-auto max-w-xl rounded-3xl border border-[#CA922B]/30 bg-[#241810] p-8 text-center">
            <CheckCircle2 className="mx-auto h-11 w-11 text-[#CA922B]" />
            <h1 className="mt-4 font-serif text-3xl font-bold text-white">
              {amendmentId
                ? "Correction returned for factual review"
                : "Submitted for factual review"}
            </h1>
            <p className="mt-3 leading-7 text-white/75">{outcome.message}</p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4 text-left text-sm leading-6 text-white/65">
              Nothing is searchable, mapped, recommended by Kinfolk, promoted,
              or open to member experiences solely because it was submitted.
              Each surface requires its own recorded decision.
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/my-organization-activity">
                <a className="rounded-xl bg-[#CA922B] px-4 py-3 text-sm font-bold text-white hover:bg-[#B38024]">
                  View my activity
                </a>
              </Link>
              <Link href="/organizations">
                <a className="rounded-xl border border-[#CA922B] px-4 py-3 text-sm font-bold text-[#F2C465] hover:bg-[#CA922B]/10">
                  Browse factual profiles
                </a>
              </Link>
            </div>
          </section>
        </main>
      </Layout>
    );

  return (
    <Layout>
      <main className="min-h-screen bg-[#1A1209] px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Link href="/organizations">
            <a className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F2C465] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Organization transparency
            </a>
          </Link>
          <section className="mt-7">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#CA922B]">
              Community factual intake
            </p>
            <h1 className="mt-2 font-serif text-4xl font-bold text-white">
              {amendmentId
                ? "Resubmit a factual correction"
                : "Add an organization for review"}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
              Start with factual identity and a real location. Membership,
              ownership verification, map presence, Kinfolk use, and promotion
              are not granted by this form.
            </p>
          </section>
          <form
            onSubmit={(event) => void submit(event)}
            className="mt-8 rounded-3xl border border-white/10 bg-[#241810] p-5 sm:p-7"
          >
            <div className="flex gap-3 rounded-2xl border border-[#CA922B]/25 bg-[#CA922B]/10 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#F2C465]" />
              <p className="text-sm leading-6 text-white/80">
                Use factual information only. Do not enter protected health,
                employment, legal, or personal information about yourself or
                anyone else.
              </p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
                Legal or operating name *
                <input
                  value={form.legalName}
                  onChange={(event) => update("legalName", event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
                />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
                Display name (optional)
                <input
                  value={form.displayName}
                  onChange={(event) =>
                    update("displayName", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
                />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
                Organization type *
                <select
                  value={form.organizationType}
                  onChange={(event) =>
                    update("organizationType", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
                >
                  {ORGANIZATION_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {label(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
                Relationship to organization *
                <select
                  value={form.relationshipToOrganization}
                  onChange={(event) =>
                    update("relationshipToOrganization", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
                >
                  {RELATIONSHIPS.map((value) => (
                    <option key={value} value={value}>
                      {label(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
                City *
                <input
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
                />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
                State / region
                <input
                  value={form.state}
                  onChange={(event) => update("state", event.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
                />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
                Country
                <input
                  value={form.country}
                  onChange={(event) => update("country", event.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
                />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
                Official website
                <input
                  type="url"
                  value={form.website}
                  onChange={(event) => update("website", event.target.value)}
                  placeholder="https://example.org"
                  className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
                />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
                Public phone
                <input
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
                />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
                Ownership information
                <select
                  value={form.ownershipStatus}
                  onChange={(event) =>
                    update("ownershipStatus", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
                >
                  <option value="unknown">I do not know</option>
                  <option value="self_identified_minority_owned">
                    Self-identified by organization
                  </option>
                  <option value="non_minority_owned">Not minority-owned</option>
                </select>
              </label>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => void checkDuplicates()}
                disabled={!canCheck || checking}
                className="inline-flex items-center gap-2 rounded-xl border border-[#CA922B] px-4 py-2.5 text-sm font-bold text-[#F2C465] hover:bg-[#CA922B]/10 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {checking ? "Checking…" : "Check existing organizations"}
              </button>
              {candidates.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
                  <p className="font-semibold text-amber-100">
                    Possible existing organization
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-100/80">
                    Do not create a duplicate. Review the existing factual
                    profile instead.
                  </p>
                  {candidates.map((candidate) => (
                    <Link
                      key={candidate.id}
                      href={`/organizations/${encodeURIComponent(candidate.id)}`}
                    >
                      <a className="mt-2 block rounded-lg bg-black/15 px-3 py-2 text-sm font-semibold text-white underline">
                        {candidate.displayName || candidate.legalName} ·{" "}
                        {candidate.city}
                        {candidate.state ? `, ${candidate.state}` : ""}
                      </a>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <label className="mt-5 block space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
              Factual note for reviewer (optional)
              <textarea
                value={form.submitterNote}
                onChange={(event) =>
                  update("submitterNote", event.target.value)
                }
                maxLength={2000}
                rows={4}
                placeholder="How did you confirm the organization name, type, and location? Do not include sensitive or private information."
                className="w-full rounded-xl border border-white/15 bg-white px-3 py-3 font-normal text-[#3A1F0E]"
              />
            </label>
            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-100"
              >
                {error}
              </p>
            ) : null}
            <button
              disabled={saving || !canCheck || candidates.length > 0}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#CA922B] px-4 py-3 font-bold text-white hover:bg-[#B38024] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Submitting…"
                : amendmentId
                  ? "Resubmit correction for review"
                  : "Submit for factual review"}
            </button>
          </form>
        </div>
      </main>
    </Layout>
  );
}
