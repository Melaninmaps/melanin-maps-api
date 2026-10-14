import { useCallback, useEffect, useState } from "react";
import { CheckCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { authenticatedAdminFetch } from "@/lib/adminDataFetch";

const BASE = import.meta.env.BASE_URL;

type Preview = {
  dryRun: boolean;
  requiresExplicitApply: boolean;
  policyVersion: string;
  planHash: string;
  scope: string;
  summary: {
    currentKinfolkRowsRead: number;
    approvedConsolidations: number;
    manualReviewCases: number;
    socialFieldsToCopy: number;
  };
  approved: Array<{
    businessName: string;
    socialFields: string[];
    identityReasons: string[];
  }>;
  safeguards: string[];
};

type ApplyResult = {
  consolidatedRecords?: number;
  copiedSocialFields?: number;
  manualReviewCasesLeftUntouched?: number;
  error?: string;
};

export function PhiladelphiaKinfolkDuplicateReconciliation({
  onApplied,
}: {
  onApplied: () => Promise<unknown> | void;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedAdminFetch(
        `${BASE}api/admin/businesses/philadelphia-kinfolk-current/duplicate-reconciliation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apply: false }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as Preview & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          payload.error ?? "Could not prepare the Philadelphia duplicate review.",
        );
      setPreview(payload);
    } catch (error) {
      setPreview(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not prepare the Philadelphia duplicate review.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const apply = async () => {
    if (!preview || preview.summary.approvedConsolidations === 0) return;
    const names = preview.approved
      .map((candidate) => candidate.businessName)
      .join(", ");
    if (
      !window.confirm(
        `Apply ${preview.summary.approvedConsolidations} safe Philadelphia Kinfolk Current duplicate consolidation${preview.summary.approvedConsolidations === 1 ? "" : "s"} now? The retained profile keeps its map pin; only ${preview.summary.socialFieldsToCopy} reviewed missing social profile${preview.summary.socialFieldsToCopy === 1 ? "" : "s"} will be copied; the confirmed duplicate stays recoverable in the Duplicate vault. Approved: ${names}. ${preview.summary.manualReviewCases} uncertain case${preview.summary.manualReviewCases === 1 ? "" : "s"} remain unchanged.`,
      )
    )
      return;

    setApplying(true);
    setMessage(null);
    try {
      const response = await authenticatedAdminFetch(
        `${BASE}api/admin/businesses/philadelphia-kinfolk-current/duplicate-reconciliation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apply: true, planHash: preview.planHash }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as ApplyResult;
      if (!response.ok)
        throw new Error(
          payload.error ?? "The duplicate reconciliation did not complete.",
        );
      setMessage(
        `Completed ${payload.consolidatedRecords ?? 0} safe consolidation${payload.consolidatedRecords === 1 ? "" : "s"}; copied ${payload.copiedSocialFields ?? 0} reviewed social profile${payload.copiedSocialFields === 1 ? "" : "s"}. ${payload.manualReviewCasesLeftUntouched ?? 0} manual-review case${payload.manualReviewCasesLeftUntouched === 1 ? "" : "s"} remained unchanged.`,
      );
      await Promise.resolve(onApplied());
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The duplicate reconciliation did not complete.",
      );
      await load();
    } finally {
      setApplying(false);
    }
  };

  const ready = preview?.summary.approvedConsolidations ?? 0;
  return (
    <section
      className="mb-4 rounded-2xl border border-[#4F7A5A]/30 bg-[#F3FAF3] p-4"
      aria-label="Philadelphia Kinfolk Current duplicate reconciliation"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#386143]">
            No-terminal duplicate cleanup
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold text-[#3A1F0E]">
            Philadelphia Kinfolk Current: preserve pins, retain verified social profiles
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#3A1F0E]/65">
            The dashboard approves only high-confidence pairs with exactly one
            stored map pin, matching official identity signals, and no conflicting
            official details. A safe action preserves the pinned profile, copies
            only reviewed missing social links, and moves the other record to the
            recoverable Duplicate vault.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || applying}
            className="inline-flex items-center gap-2 rounded-xl border border-[#386143]/25 bg-white px-3 py-2 text-sm font-bold text-[#386143] hover:bg-[#E9F5EB] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void apply()}
            disabled={loading || applying || ready === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4F7A5A] px-4 py-2 text-sm font-bold text-white hover:bg-[#386143] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {applying
              ? "Applying protected cleanup…"
              : ready > 0
                ? `Apply safe cleanup (${ready.toLocaleString()})`
                : "No safe automatic cleanup"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-[#3A1F0E]/60">
          Checking the protected Philadelphia duplicate plan…
        </p>
      ) : preview ? (
        <>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-[#4F7A5A]/15 bg-white px-3 py-2">
              <dt className="text-[#3A1F0E]/55">Safe consolidations ready</dt>
              <dd className="mt-0.5 font-bold text-[#3A1F0E]">
                {preview.summary.approvedConsolidations.toLocaleString()}
              </dd>
            </div>
            <div className="rounded-xl border border-[#4F7A5A]/15 bg-white px-3 py-2">
              <dt className="text-[#3A1F0E]/55">Reviewed social profiles to copy</dt>
              <dd className="mt-0.5 font-bold text-[#3A1F0E]">
                {preview.summary.socialFieldsToCopy.toLocaleString()}
              </dd>
            </div>
            <div className="rounded-xl border border-[#4F7A5A]/15 bg-white px-3 py-2">
              <dt className="text-[#3A1F0E]/55">Manual-review cases left untouched</dt>
              <dd className="mt-0.5 font-bold text-[#3A1F0E]">
                {preview.summary.manualReviewCases.toLocaleString()}
              </dd>
            </div>
          </dl>
          {preview.approved.length > 0 && (
            <ul className="mt-4 space-y-2">
              {preview.approved.map((candidate) => (
                <li
                  key={`${candidate.businessName}:${candidate.socialFields.join(",")}`}
                  className="rounded-xl border border-[#4F7A5A]/15 bg-white px-3 py-2 text-sm text-[#3A1F0E]"
                >
                  <span className="font-bold">{candidate.businessName}</span>
                  <span className="ml-2 text-[#3A1F0E]/60">
                    Copy: {candidate.socialFields.join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <ul className="mt-3 space-y-1 text-xs leading-5 text-[#3A1F0E]/60">
            {preview.safeguards.map((safeguard) => (
              <li key={safeguard} className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#386143]" />
                <span>{safeguard}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {message && (
        <p
          className="mt-3 rounded-xl border border-[#3A1F0E]/10 bg-white px-3 py-2 text-sm text-[#3A1F0E]/75"
          role="status"
        >
          {message}
        </p>
      )}
    </section>
  );
}
