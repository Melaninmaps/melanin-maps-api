import { useMemo, useState } from "react";
import { CheckCircle2, FileText, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticatedAdminFetch, readAdminJson } from "@/lib/adminDataFetch";

type CreationResult = {
  sourceRecordKey: string;
  status: "ready" | "created" | "skipped";
  reason: string;
  businessId?: string;
  changedFields?: readonly string[];
};

type CreationResponse = {
  ok: boolean;
  requiresExplicitApply?: boolean;
  scope?: string;
  batchId?: string;
  contentFingerprint?: string;
  candidateCount?: number;
  readyCount?: number;
  createdCount?: number;
  skippedCount?: number;
  previewToken?: string;
  previewExpiresAt?: string;
  results?: CreationResult[];
  rule?: string;
};

const APPROVED_PROFILE_COUNT = 62;

/**
 * Presents the immutable, server-embedded reviewed 62-record batch. The browser
 * cannot upload, replace, or expand the source list. A server-issued preview
 * token is required for the one-time atomic apply request.
 */
export function VerifiedSourceProfileCreation({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [preview, setPreview] = useState<CreationResponse | null>(null);
  const [result, setResult] = useState<CreationResponse | null>(null);
  const [loading, setLoading] = useState<"preview" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readyToApply = useMemo(
    () =>
      Boolean(
        preview?.ok &&
        preview.requiresExplicitApply &&
        preview.scope === "non_kinfolk_current" &&
        preview.candidateCount === APPROVED_PROFILE_COUNT &&
        preview.readyCount === APPROVED_PROFILE_COUNT &&
        typeof preview.previewToken === "string" &&
        typeof preview.previewExpiresAt === "string" &&
        Date.parse(preview.previewExpiresAt) > Date.now(),
      ),
    [preview],
  );

  const previewBatch = async () => {
    if (loading) return;
    setLoading("preview");
    setError(null);
    setPreview(null);
    setResult(null);
    try {
      const response = await authenticatedAdminFetch(
        "/api/admin/founder-source-profile-create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apply: false }),
        },
      );
      setPreview(await readAdminJson<CreationResponse>(response));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The reviewed batch preview did not return a result. No profile was created.",
      );
    } finally {
      setLoading(null);
    }
  };

  const applyBatch = async () => {
    if (!readyToApply || !preview?.previewToken || loading) return;
    setLoading("apply");
    setError(null);
    setResult(null);
    try {
      const response = await authenticatedAdminFetch(
        "/api/admin/founder-source-profile-create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apply: true,
            previewToken: preview.previewToken,
          }),
        },
      );
      const payload = await readAdminJson<CreationResponse>(response);
      setResult(payload);
      if (payload.createdCount === APPROVED_PROFILE_COUNT) onCreated?.();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The exact reviewed batch was not created. The server rolls back the entire batch on any conflict.",
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <section
      className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm"
      aria-labelledby="verified-source-profile-creation-heading"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-sky-950">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <h3
              id="verified-source-profile-creation-heading"
              className="font-serif text-lg font-semibold"
            >
              Create the reviewed missing source profiles
            </h3>
          </div>
          <p className="text-sm leading-6 text-sky-900">
            This is the fixed, server-embedded batch of{" "}
            <strong>{APPROVED_PROFILE_COUNT} non-Kinfolk</strong> Latino /
            Hispanic source records with a verified official website and
            approved, receipt-supported profile facts. No browser upload can
            alter the scope. Preview issues a short-lived administrator-bound
            token; apply uses that token to create all {APPROVED_PROFILE_COUNT}{" "}
            listings atomically or creates none.
          </p>
          <p className="text-sm leading-6 text-sky-900">
            Each listing is unclaimed and source-documented. The action never
            changes an existing profile, Kinfolk membership, map pin,
            verification state, or community data.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading !== null}
            onClick={() => void previewBatch()}
            className="border-sky-400 bg-white text-sky-950 hover:bg-sky-100"
          >
            {loading === "preview" ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {loading === "preview"
              ? "Checking…"
              : `Preview exact ${APPROVED_PROFILE_COUNT}`}
          </Button>
          <Button
            type="button"
            disabled={!readyToApply || loading !== null}
            onClick={() => void applyBatch()}
            className="bg-sky-800 text-white hover:bg-sky-900"
          >
            {loading === "apply" ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {loading === "apply"
              ? "Creating all reviewed profiles…"
              : `Create all ${APPROVED_PROFILE_COUNT}`}
          </Button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {preview && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Preview complete.</strong>{" "}
          {(preview.readyCount ?? 0).toLocaleString()} of{" "}
          {APPROVED_PROFILE_COUNT} reviewed profiles are ready for the atomic
          creation transaction.
          {preview.previewExpiresAt && (
            <span className="ml-1">
              The administrator-bound preview token expires at{" "}
              {new Date(preview.previewExpiresAt).toLocaleTimeString()}.
            </span>
          )}
          {preview.contentFingerprint && (
            <p className="mt-2 text-amber-900">
              Manifest fingerprint: <code>{preview.contentFingerprint}</code>
            </p>
          )}
          {preview.rule && (
            <p className="mt-2 text-amber-900">{preview.rule}</p>
          )}
          {(preview.results ?? []).some(
            (item) => item.status === "skipped",
          ) && (
            <details className="mt-2 text-amber-900">
              <summary className="cursor-pointer font-medium">
                View blocked records
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {(preview.results ?? [])
                  .filter((item) => item.status === "skipped")
                  .map((item) => (
                    <li key={item.sourceRecordKey}>
                      <code>{item.sourceRecordKey.slice(0, 28)}…</code>:{" "}
                      {item.reason}
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </div>
      )}
      {result && (
        <div
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
          role="status"
        >
          <strong>Atomic creation complete.</strong>{" "}
          {(result.createdCount ?? 0).toLocaleString()} reviewed,
          source-documented profile
          {result.createdCount === 1 ? " was" : "s were"} created; no record was
          skipped.
          {result.contentFingerprint && (
            <p className="mt-2 text-emerald-900">
              Manifest fingerprint: <code>{result.contentFingerprint}</code>
            </p>
          )}
          {result.rule && (
            <p className="mt-2 text-emerald-900">{result.rule}</p>
          )}
        </div>
      )}
    </section>
  );
}
