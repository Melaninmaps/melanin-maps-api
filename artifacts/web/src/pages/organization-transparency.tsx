import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type OrganizationProfile = {
  id: string;
  legalName: string;
  displayName: string | null;
  organizationType: string;
  ownershipStatus: string;
  website: string | null;
  phone: string | null;
  city: string;
  state: string | null;
  country: string | null;
  experienceStatus:
    | "not_eligible"
    | "review_required"
    | "eligible"
    | "suppressed";
  mapPinStatus: string;
  kinfolkStatus: string;
  promotionStatus: string;
};

type OrganizationLocation = {
  id: string;
  city: string;
  state: string | null;
  country: string | null;
  name: string | null;
  isPrimary: boolean;
};

type Experience = {
  id: string;
  organizationLocationId: string | null;
  city: string | null;
  state: string | null;
  relationshipLabel: string;
  categoryCodes: string[];
  narrative: string | null;
  ownerResponse: string | null;
  submittedAt: string;
};

const RELATIONSHIPS = [
  ["current_employee", "Current employee"],
  ["former_employee", "Former employee"],
  ["contractor", "Contractor"],
  ["job_applicant", "Job applicant"],
  ["customer", "Customer"],
  ["patient", "Patient"],
  ["caregiver", "Caregiver"],
] as const;

const EMPLOYER_CATEGORIES = [
  ["management_respect", "Management & respect"],
  ["compensation_and_advancement", "Compensation & advancement"],
  ["discrimination_and_retaliation", "Discrimination & retaliation"],
  ["accommodations", "Accommodations"],
  ["scheduling_and_benefits", "Scheduling & benefits"],
  ["complaint_handling", "Complaint handling"],
  ["workplace_culture", "Workplace culture"],
] as const;
const HEALTHCARE_STAFF_CATEGORIES = [
  ["staffing", "Staffing"],
  ["management", "Management"],
  ["safety_reporting", "Safety reporting"],
  ["scheduling", "Scheduling"],
  ["advancement", "Advancement"],
  ["discrimination_and_retaliation", "Discrimination & retaliation"],
] as const;
const CARE_CATEGORIES = [
  ["communication", "Communication"],
  ["informed_consent", "Informed consent"],
  ["pain_management", "Pain management"],
  ["respect", "Respect"],
  ["accessibility", "Accessibility"],
  ["discharge_follow_up", "Discharge & follow-up"],
] as const;
const CUSTOMER_CATEGORIES = [
  ["service_respect", "Service & respect"],
  ["accessibility", "Accessibility"],
  ["communication", "Communication"],
  ["complaint_handling", "Complaint handling"],
] as const;

function categoryOptions(profile: OrganizationProfile, relationship: string) {
  if (relationship === "patient" || relationship === "caregiver")
    return CARE_CATEGORIES;
  if (
    [
      "current_employee",
      "former_employee",
      "contractor",
      "job_applicant",
    ].includes(relationship)
  ) {
    return ["healthcare_facility", "hospital"].includes(
      profile.organizationType,
    )
      ? HEALTHCARE_STAFF_CATEGORIES
      : EMPLOYER_CATEGORIES;
  }
  return CUSTOMER_CATEGORIES;
}

function labelFor(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SurfaceBoundaries({ profile }: { profile: OrganizationProfile }) {
  const items = [
    ["Factual listing", true],
    ["Map placement", profile.mapPinStatus === "eligible"],
    ["Kinfolk use", profile.kinfolkStatus === "eligible"],
    ["Promotion", profile.promotionStatus === "eligible"],
  ] as const;
  return (
    <div className="rounded-2xl border border-[#CA922B]/25 bg-[#241810] p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-[#CA922B]"
          aria-hidden="true"
        />
        <div>
          <h2 className="font-serif text-lg font-bold text-white">
            What this profile does—and does not—mean
          </h2>
          <p className="mt-1 text-sm leading-6 text-white/70">
            Factual identity, community experience, location, Kinfolk research,
            and promotion are reviewed separately. This page never turns a
            member experience into a rating, clinical-quality claim, ownership
            verification, or recommendation.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map(([label, available]) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm"
          >
            <span
              className={`h-2 w-2 rounded-full ${available ? "bg-emerald-400" : "bg-white/30"}`}
              aria-hidden="true"
            />
            <span className="text-white/80">
              {label}:{" "}
              <strong className="font-semibold text-white">
                {available ? "independently eligible" : "not represented here"}
              </strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrganizationExperienceForm({
  profile,
  locations,
  onSubmitted,
}: {
  profile: OrganizationProfile;
  locations: OrganizationLocation[];
  onSubmitted: () => void;
}) {
  const [relationship, setRelationship] =
    useState<(typeof RELATIONSHIPS)[number][0]>("customer");
  const [categories, setCategories] = useState<string[]>([]);
  const [privacyLevel, setPrivacyLevel] = useState<
    "pseudonymous_public" | "private_to_moderators"
  >("pseudonymous_public");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [narrative, setNarrative] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const options = categoryOptions(profile, relationship);

  useEffect(() => {
    setCategories((current) =>
      current.filter((value) => options.some(([key]) => key === value)),
    );
  }, [relationship, profile.organizationType]);

  function toggleCategory(value: string) {
    setCategories((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length >= 3
          ? current
          : [...current, value],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (categories.length === 0) {
      setStatus(
        "Select at least one theme so the experience stays structured rather than scored.",
      );
      return;
    }
    if (!locationId) {
      setStatus("Choose the organization location your experience concerns.");
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/organizations/${encodeURIComponent(profile.id)}/experiences`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": requestId.current,
          },
          body: JSON.stringify({
            relationship,
            categoryCodes: categories,
            privacyLevel,
            organizationLocationId: locationId,
            narrative: narrative.trim() || undefined,
            clientRequestId: requestId.current,
          }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(
          body.error ?? "Your experience could not be submitted.",
        );
      setStatus(
        body.message ?? "Your experience is in the moderation workflow.",
      );
      setNarrative("");
      setCategories([]);
      requestId.current = crypto.randomUUID();
      onSubmitted();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="rounded-2xl border border-[#CA922B]/30 bg-[#241810] p-5"
    >
      <div className="flex items-start gap-3">
        <MessageCircle
          className="mt-0.5 h-5 w-5 text-[#CA922B]"
          aria-hidden="true"
        />
        <div>
          <h2 className="font-serif text-xl font-bold text-white">
            Share a structured experience
          </h2>
          <p className="mt-1 text-sm leading-6 text-white/70">
            No star ratings. Your name and member profile are never shown. Every
            experience starts in moderation.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
          Your relationship
          <select
            value={relationship}
            onChange={(event) =>
              setRelationship(event.target.value as typeof relationship)
            }
            className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 text-sm font-normal text-[#3A1F0E]"
          >
            {RELATIONSHIPS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
          Location
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 text-sm font-normal text-[#3A1F0E]"
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name ? `${location.name} — ` : ""}
                {location.city}
                {location.state ? `, ${location.state}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-[#F5EBD8]">
          Themes (choose 1–3)
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map(([value, label]) => {
            const selected = categories.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleCategory(value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${selected ? "border-[#CA922B] bg-[#CA922B] text-white" : "border-white/20 bg-white/5 text-[#F5EBD8] hover:border-[#CA922B]/70"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-[#F5EBD8]">
          Privacy choice
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(
            [
              [
                "pseudonymous_public",
                "Pseudonymous if approved",
                "Approved text may be shown with only your relationship and location.",
              ],
              [
                "private_to_moderators",
                "Private to moderators",
                "Never shown to other members; it stays in the review workflow.",
              ],
            ] as const
          ).map(([value, title, copy]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border p-3 ${privacyLevel === value ? "border-[#CA922B] bg-[#CA922B]/10" : "border-white/15"}`}
            >
              <input
                className="mr-2 accent-[#CA922B]"
                type="radio"
                value={value}
                checked={privacyLevel === value}
                onChange={() => setPrivacyLevel(value)}
              />
              <strong className="text-sm text-white">{title}</strong>
              <span className="mt-1 block pl-5 text-xs leading-5 text-white/65">
                {copy}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-5 block space-y-1.5 text-sm font-semibold text-[#F5EBD8]">
        Context (optional)
        <textarea
          value={narrative}
          onChange={(event) => setNarrative(event.target.value)}
          maxLength={4000}
          rows={5}
          placeholder="Share only your own experience. Do not include contact details, medical or personnel records, a home address, date of birth, or names of individual clinicians or workers."
          className="w-full rounded-xl border border-white/15 bg-white px-3 py-3 text-sm font-normal text-[#3A1F0E] placeholder:text-[#3A1F0E]/45"
        />
      </label>
      <p className="mt-2 text-xs leading-5 text-white/60">
        A reviewer may hold, reject, or ask for safe clarification. If a
        decision is held or rejected, you can view the status and submit one
        appeal in{" "}
        <Link href="/my-organization-activity">
          <a className="font-semibold text-[#F2C465] underline">
            My organization activity
          </a>
        </Link>
        .
      </p>
      {status ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-[#CA922B]/30 bg-[#CA922B]/10 px-3 py-2 text-sm text-[#FFF8EB]"
        >
          {status}
        </p>
      ) : null}
      <button
        disabled={saving || categories.length === 0 || !locationId}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#CA922B] px-4 py-3 font-bold text-white transition hover:bg-[#B38024] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <Clock3 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        {saving ? "Submitting…" : "Submit for moderation"}
      </button>
    </form>
  );
}

function ExperienceList({ experiences }: { experiences: Experience[] }) {
  if (experiences.length === 0)
    return (
      <div className="rounded-2xl border border-white/10 bg-[#241810] p-5 text-sm leading-6 text-white/70">
        No published experiences yet. This does not imply a score or absence of
        community experiences; unreviewed, private, held, rejected, and
        withdrawn submissions are not displayed.
      </div>
    );
  return (
    <div className="space-y-3">
      {experiences.map((experience) => (
        <article
          key={experience.id}
          className="rounded-2xl border border-white/10 bg-[#241810] p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-white">
              {experience.relationshipLabel}
            </p>
            <span className="text-xs text-white/55">
              {[experience.city, experience.state].filter(Boolean).join(", ")} ·{" "}
              {new Date(experience.submittedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {experience.categoryCodes.map((category) => (
              <span
                key={category}
                className="rounded-full bg-[#CA922B]/15 px-2.5 py-1 text-xs font-semibold text-[#F2C465]"
              >
                {labelFor(category)}
              </span>
            ))}
          </div>
          {experience.narrative ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/80">
              {experience.narrative}
            </p>
          ) : (
            <p className="mt-4 text-sm italic leading-6 text-white/55">
              This member selected structured themes without adding public
              narrative.
            </p>
          )}
          {experience.ownerResponse ? (
            <div className="mt-4 rounded-xl border border-[#CA922B]/30 bg-[#CA922B]/10 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#F2C465]">
                Moderated organization response
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/80">
                {experience.ownerResponse}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/55">
                This response appears beside—not instead of—the original member
                experience. It does not change the experience or its moderation
                decision.
              </p>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function OwnerParticipation({
  profile,
  experiences,
}: {
  profile: OrganizationProfile;
  experiences: Experience[];
}) {
  const [approved, setApproved] = useState<boolean | null>(null);
  const [claimNote, setClaimNote] = useState("");
  const [attested, setAttested] = useState(false);
  const [actionType, setActionType] = useState<
    "public_response" | "factual_correction" | "dispute"
  >("public_response");
  const [targetExperienceId, setTargetExperienceId] = useState("");
  const [fieldName, setFieldName] = useState("website");
  const [correctedValue, setCorrectedValue] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void authenticatedFetch(
      `${BASE}api/organizations/${encodeURIComponent(profile.id)}/owner-access`,
    )
      .then(async (response) => ({
        response,
        body: (await response.json().catch(() => ({}))) as {
          approved?: boolean;
        },
      }))
      .then(({ response, body }) => {
        if (active && response.ok) setApproved(body.approved === true);
      })
      .catch(() => {
        if (active) setApproved(false);
      });
    return () => {
      active = false;
    };
  }, [profile.id]);

  async function submitClaim(event: React.FormEvent) {
    event.preventDefault();
    if (!attested || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/organizations/${encodeURIComponent(profile.id)}/claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            note: claimNote.trim() || undefined,
            attestation: true,
          }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        claim?: { status?: string };
      };
      if (!response.ok)
        throw new Error(data.error ?? "Unable to submit owner claim.");
      setMessage(
        data.message ?? `Owner claim ${data.claim?.status ?? "submitted"}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit owner claim.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitAction(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !body.trim()) return;
    if (actionType === "public_response" && !targetExperienceId) {
      setMessage(
        "Choose the specific published experience you are responding to.",
      );
      return;
    }
    if (
      actionType === "factual_correction" &&
      (!fieldName.trim() || !correctedValue.trim())
    ) {
      setMessage("Name the factual field and the correction requested.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/organizations/${encodeURIComponent(profile.id)}/owner-actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType,
            body: body.trim(),
            ...(targetExperienceId ? { targetExperienceId } : {}),
            ...(actionType === "factual_correction"
              ? {
                  fieldName: fieldName.trim(),
                  correctedValue: correctedValue.trim(),
                }
              : {}),
          }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? "Unable to submit owner action.");
      setBody("");
      setCorrectedValue("");
      setTargetExperienceId("");
      setMessage(data.message ?? "Owner request submitted for moderation.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit owner action.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (approved === null) return null;
  if (!approved)
    return (
      <section className="mt-8 rounded-2xl border border-white/10 bg-[#241810] p-5">
        <h2 className="font-serif text-xl font-bold text-white">
          Represent this organization?
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/70">
          Request limited owner workflow access. A human reviewer must verify
          it. Approval cannot delete, suppress, or alter any member experience
          and does not create Kinfolk or promotion eligibility.
        </p>
        <form
          onSubmit={(event) => void submitClaim(event)}
          className="mt-4 space-y-3"
        >
          <textarea
            value={claimNote}
            onChange={(event) => setClaimNote(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Optional factual context for a reviewer. Do not include passwords, government identifiers, or sensitive personal information."
            className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 text-sm text-[#3A1F0E]"
          />
          <label className="flex gap-2 text-sm leading-6 text-white/75">
            <input
              type="checkbox"
              checked={attested}
              onChange={(event) => setAttested(event.target.checked)}
              className="mt-1 accent-[#CA922B]"
            />
            I am authorized to request this limited owner workflow and
            understand it does not control member experiences.
          </label>
          {message ? (
            <p role="alert" className="text-sm text-[#F2C465]">
              {message}
            </p>
          ) : null}
          <button
            disabled={!attested || saving}
            className="rounded-xl border border-[#CA922B] px-4 py-2.5 text-sm font-bold text-[#F2C465] disabled:opacity-50"
          >
            {saving ? "Submitting…" : "Request owner verification"}
          </button>
        </form>
      </section>
    );
  return (
    <section className="mt-8 rounded-2xl border border-[#CA922B]/30 bg-[#241810] p-5">
      <h2 className="font-serif text-xl font-bold text-white">
        Verified owner workflow
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/70">
        Submit a factual correction, a moderated response beside one published
        experience, or a dispute for review. None of these actions can erase,
        suppress, score, or overwrite a community experience.
      </p>
      <form
        onSubmit={(event) => void submitAction(event)}
        className="mt-5 space-y-4"
      >
        <label className="block text-sm font-semibold text-[#F5EBD8]">
          Request type
          <select
            value={actionType}
            onChange={(event) =>
              setActionType(event.target.value as typeof actionType)
            }
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
          >
            <option value="public_response">
              Public response to an experience
            </option>
            <option value="factual_correction">
              Factual correction request
            </option>
            <option value="dispute">Dispute for review</option>
          </select>
        </label>
        {actionType === "public_response" ? (
          <label className="block text-sm font-semibold text-[#F5EBD8]">
            Published experience
            <select
              value={targetExperienceId}
              onChange={(event) => setTargetExperienceId(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
            >
              <option value="">Select an experience</option>
              {experiences.map((experience) => (
                <option key={experience.id} value={experience.id}>
                  {experience.relationshipLabel} ·{" "}
                  {new Date(experience.submittedAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {actionType === "factual_correction" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#F5EBD8]">
              Factual field
              <input
                value={fieldName}
                onChange={(event) => setFieldName(event.target.value)}
                maxLength={100}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
              />
            </label>
            <label className="block text-sm font-semibold text-[#F5EBD8]">
              Correction requested
              <input
                value={correctedValue}
                onChange={(event) => setCorrectedValue(event.target.value)}
                maxLength={1000}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
              />
            </label>
          </div>
        ) : null}
        <label className="block text-sm font-semibold text-[#F5EBD8]">
          Context for moderator
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            maxLength={2000}
            rows={4}
            placeholder="Provide a concise factual response or request without personal, medical, or personnel information."
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 font-normal text-[#3A1F0E]"
          />
        </label>
        {message ? (
          <p role="alert" className="text-sm text-[#F2C465]">
            {message}
          </p>
        ) : null}
        <button
          disabled={saving}
          className="rounded-xl bg-[#CA922B] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Submitting…" : "Submit for moderation"}
        </button>
      </form>
    </section>
  );
}

export function OrganizationTransparencyDirectory() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [organizations, setOrganizations] = useState<OrganizationProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(event?: React.FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const parameters = new URLSearchParams({
        ...(query.trim() ? { query: query.trim() } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
      });
      const response = await authenticatedFetch(
        `${BASE}api/organizations?${parameters.toString()}`,
      );
      const body = (await response.json().catch(() => ({}))) as {
        organizations?: OrganizationProfile[];
        error?: string;
      };
      if (!response.ok)
        throw new Error(body.error ?? "Unable to search organizations.");
      setOrganizations(
        Array.isArray(body.organizations) ? body.organizations : [],
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to search organizations.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <main className="min-h-screen bg-[#1A1209] px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <Link href="/businesses">
            <a className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F2C465] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to directory
            </a>
          </Link>
          <div className="mt-7 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#CA922B]">
                Organization transparency
              </p>
              <h1 className="mt-2 font-serif text-4xl font-bold text-white">
                Factual profiles, separate from ratings
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
                Find a factually approved organization and read reviewed,
                pseudonymous member experiences in context. No composite score,
                medical-quality claim, or ownership inference is shown.
              </p>
            </div>
            <Link href="/organizations/submit">
              <a className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#CA922B] px-4 py-3 text-sm font-bold text-white hover:bg-[#B38024]">
                <Building2 className="h-4 w-4" />
                Add an organization
              </a>
            </Link>
          </div>
          <form
            onSubmit={(event) => void search(event)}
            className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-[#241810] p-4 sm:grid-cols-[1fr_0.6fr_auto]"
          >
            <input
              aria-label="Organization name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Organization name"
              className="rounded-xl border border-white/15 bg-white px-3 py-3 text-sm text-[#3A1F0E]"
            />
            <input
              aria-label="City"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="City (optional)"
              className="rounded-xl border border-white/15 bg-white px-3 py-3 text-sm text-[#3A1F0E]"
            />
            <button className="rounded-xl border border-[#CA922B] px-4 py-3 text-sm font-bold text-[#F2C465] hover:bg-[#CA922B]/10">
              {loading ? "Searching…" : "Search"}
            </button>
          </form>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          <div className="mt-6 grid gap-3">
            {organizations.map((organization) => (
              <Link
                key={organization.id}
                href={`/organizations/${encodeURIComponent(organization.id)}`}
              >
                <a className="block rounded-2xl border border-white/10 bg-[#241810] p-5 transition hover:border-[#CA922B]/60">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-xl font-bold text-white">
                        {organization.displayName || organization.legalName}
                      </h2>
                      <p className="mt-1 text-sm text-white/65">
                        {labelFor(organization.organizationType)} ·{" "}
                        {[organization.city, organization.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <FileText className="h-5 w-5 shrink-0 text-[#CA922B]" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/65">
                    Factual profile with independently moderated community
                    experience.
                  </p>
                </a>
              </Link>
            ))}
          </div>
          {!loading && organizations.length === 0 && (query || city) ? (
            <p className="mt-7 text-center text-sm text-white/60">
              No matching factually approved organizations were found.
            </p>
          ) : null}
        </div>
      </main>
    </Layout>
  );
}

export function OrganizationTransparencyProfile() {
  const [, params] = useRoute("/organizations/:id");
  const id = params?.id ?? "";
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [locations, setLocations] = useState<OrganizationLocation[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [summary, setSummary] = useState<{
    totalPublished: number;
    categoryCounts: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useMemo(
    () => async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await authenticatedFetch(
          `${BASE}api/organizations/${encodeURIComponent(id)}`,
        );
        const body = (await response.json().catch(() => ({}))) as {
          profile?: OrganizationProfile;
          locations?: OrganizationLocation[];
          experiences?: Experience[];
          experienceSummary?: {
            totalPublished: number;
            categoryCounts: Record<string, number>;
          };
          error?: string;
        };
        if (!response.ok || !body.profile)
          throw new Error(body.error ?? "Organization not found.");
        setProfile(body.profile);
        setLocations(Array.isArray(body.locations) ? body.locations : []);
        setExperiences(Array.isArray(body.experiences) ? body.experiences : []);
        setSummary(body.experienceSummary ?? null);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Organization not found.",
        );
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);
  if (loading)
    return (
      <Layout>
        <main className="min-h-screen bg-[#1A1209] px-4 py-16 text-center text-white/70">
          Loading organization profile…
        </main>
      </Layout>
    );
  if (!profile)
    return (
      <Layout>
        <main className="min-h-screen bg-[#1A1209] px-4 py-16 text-center">
          <h1 className="font-serif text-3xl font-bold text-white">
            Organization unavailable
          </h1>
          <p className="mt-3 text-white/70">
            {error ?? "This factual profile is not available to members."}
          </p>
          <Link href="/organizations">
            <a className="mt-6 inline-block font-semibold text-[#F2C465] underline">
              Back to organization transparency
            </a>
          </Link>
        </main>
      </Layout>
    );
  return (
    <Layout>
      <main className="min-h-screen bg-[#1A1209] px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Link href="/organizations">
            <a className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F2C465] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Organization transparency
            </a>
          </Link>
          <section className="mt-7 rounded-3xl border border-[#CA922B]/30 bg-[#241810] p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-[#CA922B]/15 p-3">
                <Building2 className="h-7 w-7 text-[#F2C465]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#CA922B]">
                  Factually approved organization
                </p>
                <h1 className="mt-1 font-serif text-3xl font-bold text-white">
                  {profile.displayName || profile.legalName}
                </h1>
                <p className="mt-2 text-sm text-white/65">
                  {labelFor(profile.organizationType)} ·{" "}
                  {[profile.city, profile.state, profile.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {profile.website ? (
                  <a
                    className="mt-3 inline-block text-sm font-semibold text-[#F2C465] underline"
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official website
                  </a>
                ) : null}
              </div>
            </div>
          </section>
          <div className="mt-5">
            <SurfaceBoundaries profile={profile} />
          </div>
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">
                  Member experiences
                </h2>
                <p className="mt-1 text-sm leading-6 text-white/65">
                  {summary?.totalPublished ?? 0} published, pseudonymous
                  experience{(summary?.totalPublished ?? 0) === 1 ? "" : "s"}.
                  Structured themes are context—not a rating.
                </p>
              </div>
            </div>
            {summary && Object.keys(summary.categoryCounts).length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(summary.categoryCounts).map(
                  ([category, count]) => (
                    <span
                      key={category}
                      className="rounded-full border border-[#CA922B]/30 px-2.5 py-1 text-xs font-semibold text-[#F2C465]"
                    >
                      {labelFor(category)} · {count}
                    </span>
                  ),
                )}
              </div>
            ) : null}
            <div className="mt-5">
              <ExperienceList experiences={experiences} />
            </div>
          </section>
          {profile.experienceStatus === "eligible" && locations.length > 0 ? (
            <div className="mt-8">
              <OrganizationExperienceForm
                profile={profile}
                locations={locations}
                onSubmitted={() => void refresh()}
              />
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#241810] p-5 text-sm leading-6 text-white/65">
              This organization is not currently accepting member experiences.
              That does not change its factual listing or indicate a score.
            </div>
          )}
          <OwnerParticipation profile={profile} experiences={experiences} />
        </div>
      </main>
    </Layout>
  );
}
