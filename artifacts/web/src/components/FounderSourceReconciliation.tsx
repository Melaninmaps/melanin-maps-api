import { useMemo, useState } from "react";
import { CheckCircle2, FileText, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticatedAdminFetch, readAdminJson } from "@/lib/adminDataFetch";

const RECONCILIATION_SCOPE = {
  city: "Bensalem",
  state: "PA",
  batch: "Latino-Hispanic-Source-Reconciliation-v1",
  ownershipScope: "latino",
  existingOnly: true,
  currentOnly: false,
  excludeKinfolkCurrent: true,
  batchSize: 100,
} as const;

type ReconciliationManifest = {
  requestedScope?: {
    excludeKinfolkCurrent?: boolean;
    existingOnly?: boolean;
    currentOnly?: boolean;
  };
  sourceRecordsProcessed?: number;
  profilesToCreate?: number;
  existingProfilesToEnrich?: number;
  kinfolkCurrentExcluded?: number;
  liveKinfolkExcluded?: number;
  duplicateHolds?: number;
  identityHolds?: number;
  unmatchedCanonicalHolds?: number;
  deletedExcluded?: number;
};

type ReconciliationResponse = {
  ok: boolean;
  complete?: boolean;
  requiresExplicitApply?: boolean;
  nextCursor?: string | null;
  manifest?: ReconciliationManifest;
  message?: string;
  rule?: string;
};

function isSafeDryRun(response: ReconciliationResponse): boolean {
  const scope = response.manifest?.requestedScope;
  return response.ok
    && response.requiresExplicitApply === true
    && response.manifest?.profilesToCreate === 0
    && scope?.existingOnly === true
    && scope?.currentOnly === false
    && scope?.excludeKinfolkCurrent === true;
}

function manifestCount(value: number | undefined): string {
  return typeof value === "number" ? value.toLocaleString() : "—";
}

/**
 * A fixed-scope, administrator-only control for the documented Latino / Hispanic
 * source reconciliation. Every page is previewed before its matching apply call;
 * the API repeats the Kinfolk Current guard inside the write transaction.
 */
export function FounderSourceReconciliation() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reviewedPageKey, setReviewedPageKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState<ReconciliationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageKey = cursor ?? "first-page";
  const safeDryRun = useMemo(() => result ? isSafeDryRun(result) : false, [result]);
  const canApply = !running && !complete && reviewedPageKey === pageKey && safeDryRun;
  const manifest = result?.manifest;

  const submit = async (apply: boolean) => {
    if (running || complete || (apply && !canApply)) return;
    setRunning(true);
    setError(null);
    try {
      const response = await authenticatedAdminFetch("/api/admin/founder-source-publication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...RECONCILIATION_SCOPE, cursor, apply }),
      });
      const payload = await readAdminJson<ReconciliationResponse>(response);
      setResult(payload);

      if (!apply) {
        if (isSafeDryRun(payload)) {
          setReviewedPageKey(pageKey);
        } else {
          setReviewedPageKey(null);
          setError("The preview did not confirm the fixed no-create, Kinfolk-Current-excluded scope. No changes can be applied.");
        }
        return;
      }

      setReviewedPageKey(null);
      if (payload.complete || !payload.nextCursor) {
        setComplete(true);
      } else {
        setCursor(payload.nextCursor);
        setPage((current) => current + 1);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The reconciliation request failed. No result was reported.");
    } finally {
      setRunning(false);
    }
  };

  const restart = () => {
    if (running) return;
    setCursor(null);
    setPage(1);
    setReviewedPageKey(null);
    setComplete(false);
    setResult(null);
    setError(null);
  };

  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5 shadow-sm" aria-labelledby="founder-source-reconciliation-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-teal-950">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <h3 id="founder-source-reconciliation-heading" className="font-serif text-lg font-semibold">Latino / Hispanic source reconciliation</h3>
          </div>
          <p className="text-sm leading-6 text-teal-900">
            Fixed scope: Bensalem, PA, batch <code className="font-semibold">Latino-Hispanic-Source-Reconciliation-v1</code>. This existing-profile-only process never creates a profile, map pin, or Kinfolk membership record. Kinfolk Current matches are excluded during planning and rechecked immediately before mutation.
          </p>
          <p className="text-sm leading-6 text-teal-900">
            Preview the current page first. The matching apply action remains disabled until that preview confirms the no-create scope and explicit Kinfolk Current exclusion; each request is limited to 100 source records.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={running || complete} onClick={() => void submit(false)} className="border-teal-400 bg-white text-teal-950 hover:bg-teal-100">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="mr-2 h-4 w-4" aria-hidden="true" />}
            {running ? "Running…" : `Preview page ${page}`}
          </Button>
          <Button type="button" disabled={!canApply} onClick={() => void submit(true)} className="bg-teal-800 text-white hover:bg-teal-900">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />}
            Apply page {page}
          </Button>
          <Button type="button" variant="ghost" disabled={running} onClick={restart} className="text-teal-900 hover:bg-teal-100">
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> Restart
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {complete && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"><strong>Scope complete.</strong> The endpoint returned no further cursor; no additional page will be applied.</p>}

      {manifest && (
        <div className="mt-4 rounded-lg border border-teal-200 bg-white px-4 py-3 text-sm text-teal-950">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span><strong>Page records:</strong> {manifestCount(manifest.sourceRecordsProcessed)}</span>
            <span><strong>Profiles to create:</strong> {manifestCount(manifest.profilesToCreate)}</span>
            <span><strong>Existing profiles to enrich:</strong> {manifestCount(manifest.existingProfilesToEnrich)}</span>
            <span><strong>Kinfolk Current excluded:</strong> {manifestCount(manifest.liveKinfolkExcluded ?? manifest.kinfolkCurrentExcluded)}</span>
            <span><strong>Duplicate holds:</strong> {manifestCount(manifest.duplicateHolds)}</span>
            <span><strong>Identity holds:</strong> {manifestCount(manifest.identityHolds)}</span>
            <span><strong>Unmatched canonical holds:</strong> {manifestCount(manifest.unmatchedCanonicalHolds)}</span>
          </div>
          {result?.rule && <p className="mt-3 text-teal-900">{result.rule}</p>}
          {result?.message && <p className="mt-3 text-teal-900">{result.message}</p>}
        </div>
      )}
    </section>
  );
}
