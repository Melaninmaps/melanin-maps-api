import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Building2,
  Clock3,
  FileWarning,
  ShieldCheck,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type OrganizationStatus = {
  organizationId: string;
  legalName: string;
  city: string;
  state: string | null;
  factualStatus: string;
  submittedAt: string;
  recoveryMessage: string;
};
type ExperienceStatus = {
  experienceId: string;
  organizationId: string;
  organizationName: string;
  relationship: string;
  categoryCodes: string[];
  privacyLevel: string;
  moderationStatus: string;
  reviewerNote: string | null;
  submittedAt: string;
  recovery: { label: string; memberMessage: string; appealAvailable: boolean };
};
type OwnerClaimStatus = {
  claimId: string;
  organizationId: string;
  organizationName: string;
  status: string;
  reviewerNote: string | null;
  submittedAt: string;
};

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function AppealForm({
  experienceId,
  onDone,
}: {
  experienceId: string;
  onDone: () => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const requestId = useRef(crypto.randomUUID());
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) {
      setMessage("Add a concise factual clarification for the reviewer.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/organization-experiences/${encodeURIComponent(experienceId)}/appeals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": requestId.current,
          },
          body: JSON.stringify({
            body: body.trim(),
            clientRequestId: requestId.current,
          }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? "Unable to submit appeal.");
      setBody("");
      setMessage(data.message ?? "Your appeal is with a reviewer.");
      onDone();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to submit appeal.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="mt-4 rounded-xl border border-[#CA922B]/30 bg-[#CA922B]/10 p-4"
    >
      <label className="block text-sm font-semibold text-[#F5EBD8]">
        Appeal or factual clarification
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Explain the safe factual clarification you want a reviewer to consider. This does not publish or alter your original experience by itself."
          className="mt-2 w-full rounded-lg border border-white/15 bg-white px-3 py-2 text-sm font-normal text-[#3A1F0E]"
        />
      </label>
      {message ? (
        <p role="status" className="mt-2 text-sm leading-6 text-white/80">
          {message}
        </p>
      ) : null}
      <button
        disabled={saving || !body.trim()}
        className="mt-3 rounded-lg bg-[#CA922B] px-3 py-2 text-sm font-bold text-white hover:bg-[#B38024] disabled:opacity-50"
      >
        {saving ? "Sending…" : "Send appeal for review"}
      </button>
    </form>
  );
}

export default function OrganizationTransparencyActivity() {
  const [organizations, setOrganizations] = useState<OrganizationStatus[]>([]);
  const [experiences, setExperiences] = useState<ExperienceStatus[]>([]);
  const [ownerClaims, setOwnerClaims] = useState<OwnerClaimStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/community/organizations/mine`,
      );
      const data = (await response.json().catch(() => ({}))) as {
        organizations?: OrganizationStatus[];
        experiences?: ExperienceStatus[];
        ownerClaims?: OwnerClaimStatus[];
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? "Unable to load your activity.");
      setOrganizations(
        Array.isArray(data.organizations) ? data.organizations : [],
      );
      setExperiences(Array.isArray(data.experiences) ? data.experiences : []);
      setOwnerClaims(Array.isArray(data.ownerClaims) ? data.ownerClaims : []);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load your activity.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  return (
    <Layout>
      <main className="min-h-screen bg-[#1A1209] px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Link href="/organizations">
            <a className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F2C465] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Organization transparency
            </a>
          </Link>
          <header className="mt-7">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#CA922B]">
              Member recovery
            </p>
            <h1 className="mt-2 font-serif text-4xl font-bold text-white">
              My organization activity
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-white/70">
              See accurate submission status, reviewer notes, and the limited
              next step available to you. Member status never makes a factual
              profile public or an experience visible.
            </p>
          </header>
          {loading ? (
            <div className="py-16 text-center text-white/60">
              Loading your activity…
            </div>
          ) : error ? (
            <p
              role="alert"
              className="mt-8 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-100"
            >
              {error}
            </p>
          ) : (
            <>
              <section className="mt-9">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#CA922B]" />
                  <h2 className="font-serif text-2xl font-bold text-white">
                    Organization submissions
                  </h2>
                </div>
                <div className="mt-4 space-y-3">
                  {organizations.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-[#241810] p-5 text-sm text-white/65">
                      You have not submitted an organization.
                    </p>
                  ) : (
                    organizations.map((organization) => (
                      <article
                        key={organization.organizationId}
                        className="rounded-2xl border border-white/10 bg-[#241810] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-white">
                              {organization.legalName}
                            </h3>
                            <p className="mt-1 text-sm text-white/60">
                              {organization.city}
                              {organization.state
                                ? `, ${organization.state}`
                                : ""}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#CA922B]/15 px-2.5 py-1 text-xs font-bold text-[#F2C465]">
                            {label(organization.factualStatus)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/70">
                          {organization.recoveryMessage}
                        </p>
                        {["correction_requested", "rejected"].includes(
                          organization.factualStatus,
                        ) ? (
                          <Link
                            href={`/organizations/submit?amend=${encodeURIComponent(organization.organizationId)}`}
                          >
                            <a className="mt-4 inline-flex rounded-lg border border-[#CA922B] px-3 py-2 text-sm font-bold text-[#F2C465] hover:bg-[#CA922B]/10">
                              Resubmit factual correction
                            </a>
                          </Link>
                        ) : null}
                        <p className="mt-3 text-xs text-white/45">
                          Submitted{" "}
                          {new Date(
                            organization.submittedAt,
                          ).toLocaleDateString()}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </section>
              <section className="mt-10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#CA922B]" />
                  <h2 className="font-serif text-2xl font-bold text-white">
                    Owner verification requests
                  </h2>
                </div>
                <div className="mt-4 space-y-3">
                  {ownerClaims.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-[#241810] p-5 text-sm text-white/65">
                      You have no owner verification requests.
                    </p>
                  ) : (
                    ownerClaims.map((claim) => (
                      <article
                        key={claim.claimId}
                        className="rounded-2xl border border-white/10 bg-[#241810] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h3 className="font-semibold text-white">
                            {claim.organizationName}
                          </h3>
                          <span className="rounded-full bg-[#CA922B]/15 px-2.5 py-1 text-xs font-bold text-[#F2C465]">
                            {label(claim.status)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/70">
                          {claim.status === "approved"
                            ? "Your limited owner workflow is active. It permits moderated requests only and cannot remove or suppress member experiences."
                            : "A reviewer will provide a factual verification outcome. No organization-owner authority is active while this request is pending or rejected."}
                        </p>
                        {claim.reviewerNote ? (
                          <p className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3 text-sm leading-6 text-white/75">
                            <strong className="text-[#F2C465]">
                              Reviewer note:{" "}
                            </strong>
                            {claim.reviewerNote}
                          </p>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              </section>
              <section className="mt-10">
                <div className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5 text-[#CA922B]" />
                  <h2 className="font-serif text-2xl font-bold text-white">
                    Experience submissions
                  </h2>
                </div>
                <div className="mt-4 space-y-3">
                  {experiences.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-[#241810] p-5 text-sm text-white/65">
                      You have not submitted an organization experience.
                    </p>
                  ) : (
                    experiences.map((experience) => (
                      <article
                        key={experience.experienceId}
                        className="rounded-2xl border border-white/10 bg-[#241810] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-white">
                              {experience.organizationName}
                            </h3>
                            <p className="mt-1 text-sm text-white/60">
                              {label(experience.relationship)} ·{" "}
                              {experience.categoryCodes.map(label).join(", ")}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#CA922B]/15 px-2.5 py-1 text-xs font-bold text-[#F2C465]">
                            {experience.recovery.label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/70">
                          {experience.recovery.memberMessage}
                        </p>
                        {experience.reviewerNote ? (
                          <div className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3 text-sm leading-6 text-white/75">
                            <strong className="text-[#F2C465]">
                              Reviewer note:{" "}
                            </strong>
                            {experience.reviewerNote}
                          </div>
                        ) : null}
                        {experience.recovery.appealAvailable ? (
                          <AppealForm
                            experienceId={experience.experienceId}
                            onDone={() => void load()}
                          />
                        ) : null}
                        <div className="mt-4 flex items-center gap-2 text-xs text-white/45">
                          <Clock3 className="h-3.5 w-3.5" />
                          Submitted{" "}
                          {new Date(
                            experience.submittedAt,
                          ).toLocaleDateString()}{" "}
                          ·{" "}
                          {experience.privacyLevel === "private_to_moderators"
                            ? "Private to moderators"
                            : "Pseudonymous if approved"}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
              <section className="mt-10 rounded-2xl border border-[#CA922B]/25 bg-[#241810] p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#CA922B]" />
                  <p className="text-sm leading-6 text-white/70">
                    An appeal asks for reviewer reconsideration only. It cannot
                    erase a decision, suppress another member’s experience,
                    create a rating, or publish information automatically.
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
}
