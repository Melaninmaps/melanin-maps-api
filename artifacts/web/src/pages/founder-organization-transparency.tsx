import { useEffect, useState } from "react";
import { Link, Redirect } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileWarning,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;
type QueueItem = {
  kind:
    | "organization"
    | "experience"
    | "experience_appeal"
    | "owner_claim"
    | "owner_action";
  id: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  city: string | null;
  state: string | null;
  submittedAt: string;
  status: string;
  relationship?: string;
  privacyLevel?: string;
  categoryCodes?: string[];
  narrative?: string | null;
  moderationFlags?: string[];
  appealBody?: string;
  claimNote?: string | null;
  ownerActionType?: "public_response" | "factual_correction" | "dispute";
  targetExperienceId?: string | null;
  fieldName?: string | null;
  correctedValue?: string | null;
  ownerActionBody?: string;
};
function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function receiptUrls(raw: string): string[] {
  return raw
    .split(/\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export default function FounderOrganizationTransparency() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [receipts, setReceipts] = useState("");
  const user = auth?.user as any;
  if (!authLoading && (!user?.id || user.role !== "admin"))
    return <Redirect to="/" />;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(
        `${BASE}api/admin/organizations/review-queue?limit=50`,
      );
      const data = (await response.json().catch(() => ({}))) as {
        items?: QueueItem[];
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? "Unable to load review queue.");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load review queue.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user?.role === "admin") void load();
  }, [user?.role]);

  async function decide(
    item: QueueItem,
    action:
      | "approve"
      | "correct"
      | "reject"
      | "publish"
      | "hold"
      | "reopen"
      | "decline",
  ) {
    if (!reason.trim()) {
      setError("Record a concise reviewer rationale before deciding.");
      return;
    }
    setProcessing(item.id);
    setError(null);
    const evidenceReceiptUrls = receiptUrls(receipts);
    let endpoint = "";
    let body: Record<string, unknown>;
    if (item.kind === "organization") {
      endpoint = `${BASE}api/admin/organizations/${encodeURIComponent(item.organizationId)}/moderation`;
      const approved = action === "approve";
      const correction = action === "correct";
      body = {
        factualStatus: approved
          ? "factual_approved"
          : correction
            ? "correction_requested"
            : "rejected",
        locationStatus: approved
          ? "factual_approved"
          : correction
            ? "correction_requested"
            : "rejected",
        searchStatus: approved ? "eligible" : "not_eligible",
        mapPinStatus: "not_eligible",
        kinfolkStatus: "not_eligible",
        promotionStatus: "not_eligible",
        experienceStatus: approved ? "eligible" : "not_eligible",
        reason: reason.trim(),
        evidenceReceiptUrls,
      };
    } else if (item.kind === "experience") {
      endpoint = `${BASE}api/admin/organization-experiences/${encodeURIComponent(item.id)}/decision`;
      body = {
        disposition:
          action === "publish"
            ? "publish"
            : action === "hold"
              ? "hold"
              : "reject",
        reason: reason.trim(),
        evidenceReceiptUrls,
      };
    } else if (item.kind === "experience_appeal") {
      endpoint = `${BASE}api/admin/organization-experience-appeals/${encodeURIComponent(item.id)}/decision`;
      body = {
        disposition: action === "reopen" ? "reopen" : "decline",
        reason: reason.trim(),
        evidenceReceiptUrls,
      };
    } else if (item.kind === "owner_claim") {
      endpoint = `${BASE}api/admin/organization-owner-claims/${encodeURIComponent(item.id)}/decision`;
      body = {
        disposition: action === "approve" ? "approve" : "reject",
        reason: reason.trim(),
        evidenceReceiptUrls,
      };
    } else {
      endpoint = `${BASE}api/admin/organization-owner-actions/${encodeURIComponent(item.id)}/decision`;
      body = {
        disposition:
          action === "approve"
            ? "approve"
            : action === "hold"
              ? "hold"
              : "reject",
        reason: reason.trim(),
        evidenceReceiptUrls,
      };
    }
    try {
      const response = await authenticatedFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? "Unable to record decision.");
      setExpanded(null);
      setReason("");
      setReceipts("");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to record decision.",
      );
    } finally {
      setProcessing(null);
    }
  }

  return (
    <Layout>
      <main className="min-h-screen bg-[#1A1209] px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/admin">
            <a className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F2C465] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Admin panel
            </a>
          </Link>
          <header className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#CA922B]">
                Reviewer workspace
              </p>
              <h1 className="mt-2 font-serif text-4xl font-bold text-white">
                Organization Transparency queue
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-white/70">
                Review factual profiles, structured experiences, and appeals
                separately. Every decision is reasoned, attributable, and
                audit-recorded; no decision creates Kinfolk or promotional
                eligibility.
              </p>
            </div>
            <button
              onClick={() => void load()}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-[#CA922B] px-3 py-2 text-sm font-bold text-[#F2C465] hover:bg-[#CA922B]/10"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </header>
          {error ? (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100"
            >
              {error}
            </p>
          ) : null}
          {loading ? (
            <div className="py-16 text-center text-white/60">
              Loading review queue…
            </div>
          ) : items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#241810] p-10 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-[#CA922B]" />
              <p className="mt-4 text-white/70">
                No organization transparency records are waiting for review.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {items.map((item) => (
                <article
                  key={`${item.kind}-${item.id}`}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#241810]"
                >
                  <button
                    onClick={() =>
                      setExpanded((current) =>
                        current === item.id ? null : item.id,
                      )
                    }
                    className="flex w-full items-start gap-4 p-5 text-left hover:bg-white/[0.03]"
                  >
                    <div className="rounded-xl bg-[#CA922B]/15 p-2.5">
                      <FileWarning className="h-5 w-5 text-[#F2C465]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-white">
                          {item.organizationName}
                        </h2>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/75">
                          {label(item.kind)}
                        </span>
                        <span className="rounded-full bg-[#CA922B]/15 px-2 py-0.5 text-xs font-bold text-[#F2C465]">
                          {label(item.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/60">
                        {label(item.organizationType)} ·{" "}
                        {[item.city, item.state].filter(Boolean).join(", ")} ·{" "}
                        {new Date(item.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                  {expanded === item.id ? (
                    <div className="border-t border-white/10 p-5">
                      <div className="rounded-xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/75">
                        {item.kind === "organization" ? (
                          <>
                            Review factual organization identity and primary
                            location.{" "}
                            <strong className="text-white">
                              Approval enables only a member-searchable factual
                              profile and member experience intake.
                            </strong>{" "}
                            Map placement, Kinfolk use, and promotion remain not
                            eligible.
                          </>
                        ) : item.kind === "experience" ? (
                          <>
                            <p>
                              <strong className="text-white">
                                Relationship:
                              </strong>{" "}
                              {item.relationship
                                ? label(item.relationship)
                                : "Not supplied"}{" "}
                              · <strong className="text-white">Privacy:</strong>{" "}
                              {item.privacyLevel === "private_to_moderators"
                                ? "Private to moderators"
                                : "Pseudonymous if approved"}
                            </p>
                            <p className="mt-2">
                              <strong className="text-white">Themes:</strong>{" "}
                              {(item.categoryCodes ?? [])
                                .map(label)
                                .join(", ") || "None"}
                            </p>
                            {item.moderationFlags &&
                            item.moderationFlags.length > 0 ? (
                              <p className="mt-2 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
                                <strong>Heightened review flag:</strong>{" "}
                                {item.moderationFlags.map(label).join(", ")}
                              </p>
                            ) : null}
                            <p className="mt-3 whitespace-pre-wrap">
                              {item.narrative ||
                                "No public narrative supplied; review structured themes only."}
                            </p>
                          </>
                        ) : item.kind === "experience_appeal" ? (
                          <>
                            <strong className="text-white">
                              Member appeal / factual clarification:
                            </strong>
                            <p className="mt-2 whitespace-pre-wrap">
                              {item.appealBody}
                            </p>
                            <p className="mt-3 text-white/60">
                              Reopening returns the original experience to
                              moderation; it does not publish it.
                            </p>
                          </>
                        ) : item.kind === "owner_claim" ? (
                          <>
                            <strong className="text-white">
                              Limited owner workflow claim
                            </strong>
                            <p className="mt-2 whitespace-pre-wrap">
                              {item.claimNote ||
                                "No additional claim note supplied."}
                            </p>
                            <p className="mt-3 text-white/60">
                              Verify authorization using independent evidence.
                              Approval permits limited correction, response, and
                              dispute requests only; it cannot remove or alter
                              member experiences.
                            </p>
                          </>
                        ) : (
                          <>
                            <strong className="text-white">
                              Owner {label(item.ownerActionType ?? "action")}{" "}
                              request
                            </strong>
                            {item.targetExperienceId ? (
                              <p className="mt-2 text-white/60">
                                Target experience: {item.targetExperienceId}
                              </p>
                            ) : null}
                            {item.fieldName ? (
                              <p className="mt-2 text-white/60">
                                Requested factual correction: {item.fieldName} →{" "}
                                {item.correctedValue}
                              </p>
                            ) : null}
                            <p className="mt-3 whitespace-pre-wrap">
                              {item.ownerActionBody}
                            </p>
                            <p className="mt-3 text-white/60">
                              A published response appears beside the original
                              experience. Other accepted requests remain a
                              review record and do not change member content.
                            </p>
                          </>
                        )}
                      </div>
                      <label className="mt-4 block text-sm font-semibold text-[#F5EBD8]">
                        Reviewer rationale *
                        <textarea
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          rows={3}
                          maxLength={2000}
                          placeholder="Record the factual basis, safety rationale, or recovery instruction visible to the appropriate participant."
                          className="mt-2 w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm font-normal text-[#3A1F0E]"
                        />
                      </label>
                      <label className="mt-4 block text-sm font-semibold text-[#F5EBD8]">
                        Evidence receipt URLs (optional, one per line)
                        <textarea
                          value={receipts}
                          onChange={(event) => setReceipts(event.target.value)}
                          rows={2}
                          placeholder="https://official-source.example/record"
                          className="mt-2 w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm font-normal text-[#3A1F0E]"
                        />
                      </label>
                      {receiptUrls(receipts).length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {receiptUrls(receipts).map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex max-w-full items-center gap-1 truncate text-xs font-semibold text-[#F2C465] underline"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              {url}
                            </a>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-5 flex flex-wrap gap-2">
                        {item.kind === "organization" ? (
                          <>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "approve")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve factual profile
                            </button>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "correct")}
                              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                              Request correction
                            </button>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "reject")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-400/15 px-4 py-2.5 text-sm font-bold text-red-100 hover:bg-red-400/25 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </>
                        ) : item.kind === "experience" ? (
                          <>
                            <button
                              disabled={
                                processing === item.id ||
                                item.privacyLevel !== "pseudonymous_public"
                              }
                              title={
                                item.privacyLevel !== "pseudonymous_public"
                                  ? "Private experiences cannot publish"
                                  : undefined
                              }
                              onClick={() => void decide(item, "publish")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Publish pseudonymously
                            </button>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "hold")}
                              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-[#3A1F0E] hover:bg-amber-400 disabled:opacity-50"
                            >
                              Hold
                            </button>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "reject")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-400/15 px-4 py-2.5 text-sm font-bold text-red-100 hover:bg-red-400/25 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </>
                        ) : item.kind === "experience_appeal" ? (
                          <>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "reopen")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Reopen for moderation
                            </button>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "decline")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-400/15 px-4 py-2.5 text-sm font-bold text-red-100 hover:bg-red-400/25 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Decline appeal
                            </button>
                          </>
                        ) : item.kind === "owner_claim" ? (
                          <>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "approve")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve limited owner access
                            </button>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "reject")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-400/15 px-4 py-2.5 text-sm font-bold text-red-100 hover:bg-red-400/25 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject claim
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "approve")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {item.ownerActionType === "public_response"
                                ? "Publish moderated response"
                                : "Accept request"}
                            </button>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "hold")}
                              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-[#3A1F0E] hover:bg-amber-400 disabled:opacity-50"
                            >
                              Hold
                            </button>
                            <button
                              disabled={processing === item.id}
                              onClick={() => void decide(item, "reject")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-400/15 px-4 py-2.5 text-sm font-bold text-red-100 hover:bg-red-400/25 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject request
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
