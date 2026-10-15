import { ChangeEvent, useMemo, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticatedAdminFetch, readAdminJson } from "@/lib/adminDataFetch";

type EnrichmentResult = {
  businessId: string;
  status: "applied" | "skipped";
  reason: string;
  changedFields?: string[];
};

type ApplyResponse = {
  ok: boolean;
  batchId: string;
  contentFingerprint: string;
  candidateCount: number;
  appliedCount: number;
  skippedCount: number;
  results: EnrichmentResult[];
};

type ManifestPreview = {
  version?: string;
  batchId?: string;
  contentFingerprint?: string;
  generatedAt?: string;
  candidates?: unknown[];
};

function isManifestPreview(value: unknown): value is ManifestPreview {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * A bounded, evidence-only administrative control for the full official-site
 * enrichment workflow. The server verifies manifest integrity, current identity,
 * Kinfolk Current scope, receipts, and fill-only behavior again at apply time.
 */
export function KinfolkCurrentProfileEnrichment({ onApplied }: { onApplied?: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [manifest, setManifest] = useState<ManifestPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApplyResponse | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const candidateCount = useMemo(() => Array.isArray(manifest?.candidates) ? manifest.candidates.length : 0, [manifest]);

  const handleManifestFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setResult(null);
    setRequestError(null);
    if (!file) return;
    if (file.size > 1_000_000) {
      setManifest(null);
      setLoadError("Profile enrichment manifests are limited to 1 MB and 100 businesses per batch.");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isManifestPreview(parsed) || !Array.isArray(parsed.candidates) || parsed.candidates.length < 1 || parsed.candidates.length > 100 || typeof parsed.batchId !== "string" || typeof parsed.contentFingerprint !== "string") {
        throw new Error("This is not a bounded Kinfolk Current profile enrichment manifest.");
      }
      setManifest(parsed);
      setLoadError(null);
    } catch (error) {
      setManifest(null);
      setLoadError(error instanceof Error ? error.message : "The selected file could not be read as an enrichment manifest.");
    }
  };

  const applyManifest = async () => {
    if (!manifest || submitting) return;
    setSubmitting(true);
    setRequestError(null);
    try {
      const response = await authenticatedAdminFetch("/api/businesses/admin/businesses/kinfolk-current/profile-enrichment-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest }),
      });
      const payload = await readAdminJson<ApplyResponse>(response);
      setResult(payload);
      onApplied?.();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "The reviewed enrichment batch could not be applied. No result was reported.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm" aria-labelledby="kinfolk-profile-enrichment-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-amber-950">
            <FileText className="h-5 w-5" aria-hidden="true" />
            <h3 id="kinfolk-profile-enrichment-heading" className="font-serif text-lg font-semibold">Kinfolk Current official-site profile enrichment</h3>
          </div>
          <p className="text-sm leading-6 text-amber-900">
            Load one generated batch of up to 100 first-party, field-level proposals. The server rechecks the fingerprint, exact business identity, Kinfolk Current membership, public listing, official-source receipts, and whether each field is still empty. It only fills an empty description, hours, phone number, or service tags; it never overwrites a profile or changes ownership, category, location, map pins, photos, prices, lifecycle, or Kinfolk eligibility.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <input ref={inputRef} type="file" accept="application/json,.json" className="sr-only" onChange={handleManifestFile} />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="border-amber-400 bg-white text-amber-950 hover:bg-amber-100">
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" /> Load reviewed batch
          </Button>
          <Button type="button" disabled={!manifest || submitting} onClick={applyManifest} className="bg-amber-800 text-white hover:bg-amber-900">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />}
            {submitting ? "Applying source-backed fields…" : "Apply empty-field enrichment"}
          </Button>
        </div>
      </div>

      {loadError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{loadError}</p>}
      {requestError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{requestError}</p>}
      {manifest && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm text-stone-700">
          <strong className="text-amber-950">Reviewed batch: {manifest.batchId}</strong>
          <span className="mx-2 text-stone-400">•</span>
          {candidateCount} business{candidateCount === 1 ? "" : "es"}
          <span className="mx-2 text-stone-400">•</span>
          fingerprint {manifest.contentFingerprint?.slice(0, 16)}…
        </div>
      )}
      {result && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950" role="status">
          <strong>Batch complete.</strong> {result.appliedCount} business{result.appliedCount === 1 ? "" : "es"} updated; {result.skippedCount} safely skipped. Every skipped record remains unchanged and the result is retained in its audit trail.
          {result.skippedCount > 0 && <details className="mt-2 text-emerald-900"><summary className="cursor-pointer font-medium">View skipped records</summary><ul className="mt-2 list-disc space-y-1 pl-5">{result.results.filter((item) => item.status === "skipped").map((item) => <li key={item.businessId}><code>{item.businessId}</code>: {item.reason}</li>)}</ul></details>}
        </div>
      )}
    </section>
  );
}
