import { type ChangeEvent, useMemo, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticatedAdminFetch, readAdminJson } from "@/lib/adminDataFetch";
import {
  parseValidatedPresenceCsv,
  VALIDATED_PRESENCE_BATCH_SIZE,
  type ValidatedPresenceCsvParseResult,
  type ValidatedPresenceCsvRow,
} from "@/lib/validatedPresenceCsv";

type PreviewCandidate = {
  input: ValidatedPresenceCsvRow;
  status: "ready" | "skipped";
  reason: string;
  businessId: string | null;
  listingStatus: string | null;
  currentCatalogState: string | null;
  proposedFields: string[];
  restorePublicListing: boolean;
  excludeFromKinfolkCurrent: boolean;
  snapshotFingerprint: string | null;
};

type PreviewResponse = {
  ok: boolean;
  rowCount: number;
  readyCount: number;
  skippedCount: number;
  batchFingerprint: string;
  confirmation: string;
  candidates: PreviewCandidate[];
};

type ApplyResult = {
  originalRowNumber: number;
  businessId: string | null;
  status: "applied" | "skipped";
  reason: string;
  changedFields?: string[];
};

type ApplyResponse = {
  ok: boolean;
  rowCount: number;
  appliedCount: number;
  skippedCount: number;
  results: ApplyResult[];
};

function candidateTone(status: PreviewCandidate["status"] | ApplyResult["status"]): string {
  return status === "ready" || status === "applied"
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : "border-amber-200 bg-amber-50 text-amber-900";
}

/**
 * Browser-only CSV intake for the founder-approved 50-record operation. The
 * file remains in the browser; only a selected 50-record slice goes to the
 * server for preview or separately confirmed apply.
 */
export function ValidatedPresenceBatch({ onApplied }: { onApplied?: () => void }) {
  const [parsed, setParsed] = useState<ValidatedPresenceCsvParseResult | null>(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [result, setResult] = useState<ApplyResponse | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState<"preview" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentRows = useMemo(() => parsed?.rows.slice(
    batchIndex * VALIDATED_PRESENCE_BATCH_SIZE,
    (batchIndex + 1) * VALIDATED_PRESENCE_BATCH_SIZE,
  ) ?? [], [parsed, batchIndex]);
  const totalBatches = parsed ? Math.ceil(parsed.rows.length / VALIDATED_PRESENCE_BATCH_SIZE) : 0;

  const clearReview = () => {
    setPreview(null);
    setResult(null);
    setConfirmation("");
    setError(null);
  };

  const handleCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    clearReview();
    if (!file) return;
    if (file.size > 10_000_000) {
      setParsed(null);
      setError("The CSV is limited to 10 MB. It is read only in this browser and never uploaded as a file.");
      return;
    }
    try {
      const next = parseValidatedPresenceCsv(await file.text());
      setParsed(next);
      setBatchIndex(0);
    } catch (loadError) {
      setParsed(null);
      setError(loadError instanceof Error ? loadError.message : "The CSV could not be read.");
    }
  };

  const changeBatch = (nextIndex: number) => {
    setBatchIndex(nextIndex);
    clearReview();
  };

  const previewBatch = async () => {
    if (!currentRows.length || loading) return;
    setLoading("preview");
    setError(null);
    setPreview(null);
    setResult(null);
    setConfirmation("");
    try {
      const response = await authenticatedAdminFetch("/api/admin/businesses/validated-presence-batch/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: currentRows }),
      });
      setPreview(await readAdminJson<PreviewResponse>(response));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The batch could not be previewed. No record was changed.");
    } finally {
      setLoading(null);
    }
  };

  const applyBatch = async () => {
    if (!preview || loading || confirmation !== preview.confirmation) return;
    setLoading("apply");
    setError(null);
    try {
      const response = await authenticatedAdminFetch("/api/admin/businesses/validated-presence-batch/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: currentRows, batchFingerprint: preview.batchFingerprint, confirmation }),
      });
      const next = await readAdminJson<ApplyResponse>(response);
      setResult(next);
      setPreview(null);
      setConfirmation("");
      onApplied?.();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The batch could not be applied. No incomplete result was accepted.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm" aria-labelledby="validated-presence-batch-heading">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-950">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <h3 id="validated-presence-batch-heading" className="font-serif text-lg font-semibold">Validated Presence Batch — 50 at a time</h3>
          </div>
          <p className="text-sm leading-6 text-emerald-900">
            Select the founder-approved website/social CSV. It is read only in this browser. Each preview sends no more than 50 approved Black / African American-Owned, Latino / Hispanic-Owned, or Minority-Owned records for an exact retained-record check. Nothing is changed until you review the preview and type the confirmation shown below.
          </p>
          <p className="text-xs leading-5 text-emerald-800">
            A safe apply fills only missing or identical official website/social values, records source receipts, preserves any existing owner claim, restores an exact Archive match to public discovery when appropriate, and explicitly keeps it out of Kinfolk Current so it appears in Non-Kinfolk Current. A local-source row cannot change ownership or phone without a public source receipt. It never creates a business, sends an email, overwrites a conflicting value, or touches Delete Queue / Kinfolk Current Delete Review records.
          </p>
        </div>
        <label className="flex min-w-64 flex-col gap-1 text-xs font-medium text-emerald-950">
          <span>Select validated CSV</span>
          <input
            aria-label="Select validated website or social CSV"
            type="file"
            accept="text/csv,.csv"
            className="block w-full cursor-pointer rounded-md border border-emerald-400 bg-white px-2 py-1.5 text-xs text-emerald-950 file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-emerald-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-emerald-950 hover:bg-emerald-50"
            onChange={handleCsv}
          />
        </label>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      {parsed && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-emerald-950">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <strong>{parsed.rows.length.toLocaleString()} approved records ready for review</strong>
              <span className="mx-2 text-emerald-300">•</span>
              {parsed.includedMinorityOwnedCount.toLocaleString()} Minority-Owned record{parsed.includedMinorityOwnedCount === 1 ? "" : "s"} included
              {parsed.ignoredRowCount > 0 && <><span className="mx-2 text-emerald-300">•</span>{parsed.ignoredRowCount.toLocaleString()} non-approved row{parsed.ignoredRowCount === 1 ? "" : "s"} ignored</>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={batchIndex === 0 || loading !== null} onClick={() => changeBatch(batchIndex - 1)}>Previous 50</Button>
              <span className="text-xs font-semibold">Batch {batchIndex + 1} of {totalBatches} · {currentRows.length} records</span>
              <Button type="button" variant="outline" size="sm" disabled={batchIndex >= totalBatches - 1 || loading !== null} onClick={() => changeBatch(batchIndex + 1)}>Next 50</Button>
              <Button type="button" size="sm" disabled={loading !== null || !currentRows.length} onClick={previewBatch} className="bg-emerald-800 text-white hover:bg-emerald-900">
                {loading === "preview" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />}
                Preview selected batch
              </Button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="mt-4 space-y-4 rounded-xl border border-emerald-200 bg-white p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-emerald-950"><strong>Review complete:</strong> {preview.readyCount} ready; {preview.skippedCount} safely held. The server matched current record state and generated a one-time preview fingerprint.</div>
            <span className="font-mono text-[11px] text-emerald-700">{preview.batchFingerprint.slice(0, 16)}…</span>
          </div>
          <div className="max-h-72 overflow-auto rounded-lg border border-emerald-100">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="sticky top-0 bg-emerald-50 text-emerald-950"><tr><th className="px-3 py-2">Business</th><th className="px-3 py-2">State</th><th className="px-3 py-2">Proposed changes</th><th className="px-3 py-2">Reason</th></tr></thead>
              <tbody>{preview.candidates.map((candidate) => (
                <tr key={candidate.input.originalRowNumber} className="border-t border-emerald-100 align-top">
                  <td className="px-3 py-2 font-semibold text-emerald-950">{candidate.input.businessName}<span className="block font-normal text-emerald-700">{candidate.input.city}, {candidate.input.state}</span></td>
                  <td className="px-3 py-2"><span className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${candidateTone(candidate.status)}`}>{candidate.status}</span></td>
                  <td className="px-3 py-2 text-emerald-900">{candidate.proposedFields.length ? candidate.proposedFields.join(", ").replaceAll("_", " ") : "—"}</td>
                  <td className="max-w-md px-3 py-2 text-emerald-800">{candidate.reason}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {preview.readyCount > 0 && (
            <div className="rounded-lg border border-[#7A2637]/25 bg-[#FFF7F8] p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5F1E2D]">
                Type exactly to apply this selected batch
                <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={preview.confirmation} className="mt-2 w-full rounded-lg border border-[#7A2637]/30 bg-white px-3 py-2 font-mono text-xs normal-case tracking-normal text-[#3A1F0E] focus:outline-none focus:border-[#7A2637]" aria-label="Typed confirmation for validated presence batch" />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button type="button" disabled={loading !== null || confirmation !== preview.confirmation} onClick={applyBatch} className="bg-[#7A2637] text-white hover:bg-[#5F1E2D]">
                  {loading === "apply" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />}
                  Apply reviewed batch
                </Button>
                <span className="text-xs text-[#7A2637]">No automatic runner. Records that change after preview are skipped, not overwritten.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-100 p-4 text-sm text-emerald-950" role="status">
          <strong>Batch result:</strong> {result.appliedCount} record{result.appliedCount === 1 ? "" : "s"} applied; {result.skippedCount} safely skipped. Nothing was created and no email was changed.
          {result.skippedCount > 0 && <details className="mt-2"><summary className="cursor-pointer font-medium">View skipped records</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-xs">{result.results.filter((item) => item.status === "skipped").map((item) => <li key={`${item.originalRowNumber}-${item.businessId ?? "unmatched"}`}>Row {item.originalRowNumber}: {item.reason}</li>)}</ul></details>}
        </div>
      )}
    </section>
  );
}
