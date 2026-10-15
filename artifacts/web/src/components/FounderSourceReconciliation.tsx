import { useMemo, useState } from "react";
import { CheckCircle2, FileText, Loader2, PlayCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticatedAdminFetch, readAdminJson } from "@/lib/adminDataFetch";

type ReconciliationScope = {
  id: "founder-city" | "directory-sources" | "minneapolis";
  batch: string;
  label: string;
  recordCount: number;
  resumeCursor: string | null;
  resumePage: number;
};

const RECONCILIATION_SCOPES: readonly ReconciliationScope[] = [
  {
    id: "founder-city",
    batch: "founder_city_directories_2026_09_27",
    label: "Founder city directories",
    recordCount: 3_139,
    // Pages 1–22 were individually previewed and applied before the bounded
    // continuation control was deployed. The next selected record is page 23.
    resumeCursor: "source-receipt:b2e2c5aac7d16ca67e723f992528d978c6cf49e8e19c4a6ed8e409d96e314beb",
    resumePage: 23,
  },
  {
    id: "directory-sources",
    batch: "directory_sources_2026_09_27",
    label: "Retained directory sources",
    recordCount: 155,
    resumeCursor: null,
    resumePage: 1,
  },
  {
    id: "minneapolis",
    batch: "minneapolis_directory_sources_2026_09_27",
    label: "Minneapolis directory sources",
    recordCount: 42,
    resumeCursor: null,
    resumePage: 1,
  },
] as const;

const FIXED_REQUEST = {
  ownershipScope: "latino",
  existingOnly: true,
  currentOnly: false,
  excludeKinfolkCurrent: true,
  batchSize: 100,
} as const;

type ReconciliationManifest = {
  requestedScope?: {
    batch?: string | null;
    ownershipScope?: "black" | "latino" | null;
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

type PageRunEvidence = {
  page: number;
  records: number;
  plannedKinfolkExcluded: number;
  liveKinfolkExcluded: number;
  profilesEnriched: number;
  profilesCreated: number;
};

function isSafeDryRun(response: ReconciliationResponse, scope: ReconciliationScope): boolean {
  const requested = response.manifest?.requestedScope;
  return response.ok
    && response.requiresExplicitApply === true
    && response.manifest?.profilesToCreate === 0
    && requested?.batch === scope.batch
    && requested?.ownershipScope === "latino"
    && requested?.existingOnly === true
    && requested?.currentOnly === false
    && requested?.excludeKinfolkCurrent === true;
}

function manifestCount(value: number | undefined): string {
  return typeof value === "number" ? value.toLocaleString() : "—";
}

/**
 * A bounded, administrator-only control for the documented Latino / Hispanic
 * source reconciliation. It can continue a verified source cursor, but every
 * page still gets a fresh dry run before its matching apply request. Any
 * unexpected scope, create plan, or absent Kinfolk exclusion stops the run.
 */
export function FounderSourceReconciliation() {
  const [scope, setScope] = useState<ReconciliationScope>(RECONCILIATION_SCOPES[0]);
  const [cursor, setCursor] = useState<string | null>(RECONCILIATION_SCOPES[0].resumeCursor);
  const [page, setPage] = useState(RECONCILIATION_SCOPES[0].resumePage);
  const [reviewedPageKey, setReviewedPageKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState<ReconciliationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runEvidence, setRunEvidence] = useState<readonly PageRunEvidence[]>([]);

  const pageKey = cursor ?? "first-page";
  const safeDryRun = useMemo(() => result ? isSafeDryRun(result, scope) : false, [result, scope]);
  const canApply = !running && !complete && reviewedPageKey === pageKey && safeDryRun;
  const manifest = result?.manifest;

  const requestPage = async (apply: boolean, requestCursor: string | null): Promise<ReconciliationResponse> => {
    const response = await authenticatedAdminFetch("/api/admin/founder-source-publication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...FIXED_REQUEST, batch: scope.batch, cursor: requestCursor, apply }),
    });
    return readAdminJson<ReconciliationResponse>(response);
  };

  const submit = async (apply: boolean) => {
    if (running || complete || (apply && !canApply)) return;
    setRunning(true);
    setError(null);
    try {
      const payload = await requestPage(apply, cursor);
      setResult(payload);
      if (!apply) {
        if (isSafeDryRun(payload, scope)) {
          setReviewedPageKey(pageKey);
        } else {
          setReviewedPageKey(null);
          setError("The preview did not confirm the documented Latino-only, no-create, Kinfolk-Current-excluded scope. No changes can be applied.");
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

  const runRemainingSafePages = async () => {
    if (running || complete) return;
    setRunning(true);
    setError(null);
    setReviewedPageKey(null);
    const evidence: PageRunEvidence[] = [];
    let activeCursor = cursor;
    let activePage = page;
    try {
      while (true) {
        const preview = await requestPage(false, activeCursor);
        if (preview.complete || preview.manifest?.sourceRecordsProcessed === 0) {
          setResult(preview);
          setComplete(true);
          break;
        }
        if (!isSafeDryRun(preview, scope)) {
          throw new Error(`Page ${activePage} did not confirm the documented no-create and Kinfolk-Current exclusion safeguards.`);
        }

        const applied = await requestPage(true, activeCursor);
        if (!applied.ok) throw new Error(`Page ${activePage} did not report a successful application.`);
        const previewManifest = preview.manifest;
        const appliedManifest = applied.manifest;
        evidence.push({
          page: activePage,
          records: previewManifest?.sourceRecordsProcessed ?? 0,
          plannedKinfolkExcluded: previewManifest?.kinfolkCurrentExcluded ?? 0,
          liveKinfolkExcluded: appliedManifest?.liveKinfolkExcluded ?? 0,
          profilesEnriched: appliedManifest?.existingProfilesToEnrich ?? 0,
          profilesCreated: appliedManifest?.profilesToCreate ?? 0,
        });
        setResult(applied);

        if (applied.complete || !applied.nextCursor) {
          setComplete(true);
          break;
        }
        activeCursor = applied.nextCursor;
        activePage += 1;
        setCursor(activeCursor);
        setPage(activePage);
      }
      setRunEvidence(evidence);
    } catch (requestError) {
      setCursor(activeCursor);
      setPage(activePage);
      setRunEvidence(evidence);
      setError(requestError instanceof Error ? requestError.message : "The bounded reconciliation run failed before a result was reported.");
    } finally {
      setRunning(false);
    }
  };

  const selectScope = (scopeId: string) => {
    if (running) return;
    const nextScope = RECONCILIATION_SCOPES.find((candidate) => candidate.id === scopeId);
    if (!nextScope) return;
    setScope(nextScope);
    setCursor(nextScope.resumeCursor);
    setPage(nextScope.resumePage);
    setReviewedPageKey(null);
    setComplete(false);
    setResult(null);
    setError(null);
    setRunEvidence([]);
  };

  const restart = () => {
    if (running) return;
    setCursor(scope.resumeCursor);
    setPage(scope.resumePage);
    setReviewedPageKey(null);
    setComplete(false);
    setResult(null);
    setError(null);
    setRunEvidence([]);
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
            Only retained sources that explicitly designate a business <strong>Latino / Hispanic-Owned</strong> are in scope. The process is existing-profile-only: it never creates a business profile, map pin, or Kinfolk membership record, and it excludes Kinfolk Current both during planning and immediately before mutation.
          </p>
          <label className="flex max-w-xl flex-col gap-1 text-sm font-medium text-teal-950">
            Documented source batch
            <select
              value={scope.id}
              disabled={running}
              onChange={(event) => selectScope(event.target.value)}
              className="h-10 rounded-md border border-teal-300 bg-white px-3 text-sm text-teal-950 shadow-sm outline-none focus:border-teal-700"
            >
              {RECONCILIATION_SCOPES.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label} — {candidate.recordCount.toLocaleString()} records
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm leading-6 text-teal-900">
            {scope.id === "founder-city"
              ? "This run resumes at page 23 after pages 1–22 were individually previewed and applied."
              : "This batch begins at page 1."} Each remaining page is dry-run and scope-validated immediately before its matching apply request.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={running || complete} onClick={() => void submit(false)} className="border-teal-400 bg-white text-teal-950 hover:bg-teal-100">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="mr-2 h-4 w-4" aria-hidden="true" />}
            {running ? "Running…" : `Preview page ${page}`}
          </Button>
          <Button type="button" disabled={!canApply} onClick={() => void submit(true)} className="bg-teal-800 text-white hover:bg-teal-900">
            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" /> Apply page {page}
          </Button>
          <Button type="button" disabled={running || complete} onClick={() => void runRemainingSafePages()} className="bg-teal-700 text-white hover:bg-teal-800">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <PlayCircle className="mr-2 h-4 w-4" aria-hidden="true" />}
            Run remaining safe pages
          </Button>
          <Button type="button" variant="ghost" disabled={running} onClick={restart} className="text-teal-900 hover:bg-teal-100">
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> Restart batch
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {complete && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"><strong>Batch complete.</strong> The endpoint returned no further cursor; no additional page was applied.</p>}

      {manifest && (
        <div className="mt-4 rounded-lg border border-teal-200 bg-white px-4 py-3 text-sm text-teal-950">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span><strong>Page records:</strong> {manifestCount(manifest.sourceRecordsProcessed)}</span>
            <span><strong>Profiles to create:</strong> {manifestCount(manifest.profilesToCreate)}</span>
            <span><strong>Existing profiles to enrich:</strong> {manifestCount(manifest.existingProfilesToEnrich)}</span>
            <span><strong>Kinfolk Current excluded in planning:</strong> {manifestCount(manifest.kinfolkCurrentExcluded)}</span>
            <span><strong>Kinfolk Current excluded live:</strong> {manifestCount(manifest.liveKinfolkExcluded)}</span>
            <span><strong>Duplicate holds:</strong> {manifestCount(manifest.duplicateHolds)}</span>
            <span><strong>Identity holds:</strong> {manifestCount(manifest.identityHolds)}</span>
            <span><strong>Unmatched canonical holds:</strong> {manifestCount(manifest.unmatchedCanonicalHolds)}</span>
          </div>
          {result?.rule && <p className="mt-3 text-teal-900">{result.rule}</p>}
          {result?.message && <p className="mt-3 text-teal-900">{result.message}</p>}
        </div>
      )}

      {runEvidence.length > 0 && (
        <div className="mt-4 rounded-lg border border-teal-200 bg-white px-4 py-3 text-sm text-teal-950">
          <p><strong>Run evidence:</strong> {runEvidence.length} page{runEvidence.length === 1 ? "" : "s"} completed in this continuation.</p>
          <div className="mt-2 grid gap-1 text-teal-900">
            {runEvidence.map((entry) => (
              <p key={entry.page}>
                Page {entry.page}: {entry.records} source records; {entry.profilesEnriched} existing profiles enriched; {entry.profilesCreated} profiles created; {entry.plannedKinfolkExcluded} Kinfolk Current matches excluded in planning; {entry.liveKinfolkExcluded} excluded in the live transaction check.
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
