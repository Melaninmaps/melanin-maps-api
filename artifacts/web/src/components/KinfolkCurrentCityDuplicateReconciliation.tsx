import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { authenticatedAdminFetch } from "@/lib/adminDataFetch";

const BASE = import.meta.env.BASE_URL;

type Summary = {
  currentKinfolkRowsRead: number;
  approvedConsolidations: number;
  manualReviewCases: number;
  socialFieldsToCopy: number;
};

type City = {
  city: string;
  state: string;
  label: string;
  summary: Summary;
};

type Inventory = {
  totalCurrentKinfolkRowsRead: number;
  citiesWithDuplicateSignals: City[];
  safeguards: string[];
  error?: string;
};

type Preview = {
  dryRun: boolean;
  requiresExplicitApply: boolean;
  planHash: string;
  scope: City;
  summary: Summary;
  approved: Array<{
    businessName: string;
    socialFields: string[];
    identityReasons: string[];
  }>;
  safeguards: string[];
  error?: string;
};

type ApplyResult = {
  consolidatedRecords?: number;
  copiedSocialFields?: number;
  manualReviewCasesLeftUntouched?: number;
  scope?: City;
  error?: string;
};

function cityKey(city: Pick<City, "city" | "state">): string {
  return `${city.city}\u0000${city.state}`;
}

export function KinfolkCurrentCityDuplicateReconciliation({
  onApplied,
}: {
  onApplied: () => Promise<unknown> | void;
}) {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedCity = useMemo(
    () =>
      inventory?.citiesWithDuplicateSignals.find(
        (city) => cityKey(city) === selectedKey,
      ) ?? null,
    [inventory, selectedKey],
  );

  const loadInventory = useCallback(async (): Promise<Inventory | null> => {
    const response = await authenticatedAdminFetch(
      `${BASE}api/admin/businesses/kinfolk-current/city-duplicate-reconciliation`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: false }),
      },
    );
    const payload = (await response.json().catch(() => ({}))) as Inventory;
    if (!response.ok)
      throw new Error(
        payload.error ?? "Could not prepare the city reconciliation inventory.",
      );
    setInventory(payload);
    setSelectedKey((current) => {
      if (
        current &&
        payload.citiesWithDuplicateSignals.some(
          (city) => cityKey(city) === current,
        )
      )
        return current;
      const next =
        payload.citiesWithDuplicateSignals.find(
          (city) => city.summary.approvedConsolidations > 0,
        ) ?? payload.citiesWithDuplicateSignals[0];
      return next ? cityKey(next) : "";
    });
    return payload;
  }, []);

  const loadPreview = useCallback(async (city: City) => {
    const response = await authenticatedAdminFetch(
      `${BASE}api/admin/businesses/kinfolk-current/city-duplicate-reconciliation`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.city,
          state: city.state,
          apply: false,
        }),
      },
    );
    const payload = (await response.json().catch(() => ({}))) as Preview;
    if (!response.ok)
      throw new Error(
        payload.error ?? "Could not prepare this city duplicate review.",
      );
    setPreview(payload);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const nextInventory = await loadInventory();
      const key =
        selectedKey ||
        (nextInventory?.citiesWithDuplicateSignals.find(
          (city) => city.summary.approvedConsolidations > 0,
        )
          ? cityKey(
              nextInventory.citiesWithDuplicateSignals.find(
                (city) => city.summary.approvedConsolidations > 0,
              )!,
            )
          : "");
      const city =
        nextInventory?.citiesWithDuplicateSignals.find(
          (candidate) => cityKey(candidate) === key,
        ) ?? null;
      if (city) await loadPreview(city);
      else setPreview(null);
    } catch (error) {
      setInventory(null);
      setPreview(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not prepare the city reconciliation inventory.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadInventory, loadPreview, selectedKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedCity || loading) return;
    setPreview(null);
    setLoading(true);
    setMessage(null);
    void loadPreview(selectedCity)
      .catch((error) =>
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not prepare this city duplicate review.",
        ),
      )
      .finally(() => setLoading(false));
  }, [selectedCity, loadPreview]);

  const apply = async () => {
    if (!preview || preview.summary.approvedConsolidations === 0) return;
    setApplying(true);
    setMessage(null);
    try {
      const response = await authenticatedAdminFetch(
        `${BASE}api/admin/businesses/kinfolk-current/city-duplicate-reconciliation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: preview.scope.city,
            state: preview.scope.state,
            apply: true,
            planHash: preview.planHash,
          }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as ApplyResult;
      if (!response.ok)
        throw new Error(
          payload.error ??
            "The city duplicate reconciliation did not complete.",
        );
      setMessage(
        `Completed ${payload.consolidatedRecords ?? 0} safe consolidation${payload.consolidatedRecords === 1 ? "" : "s"} in ${preview.scope.label}; copied ${payload.copiedSocialFields ?? 0} reviewed social profile${payload.copiedSocialFields === 1 ? "" : "s"}. ${payload.manualReviewCasesLeftUntouched ?? 0} manual-review case${payload.manualReviewCasesLeftUntouched === 1 ? "" : "s"} remained unchanged.`,
      );
      await Promise.resolve(onApplied());
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The city duplicate reconciliation did not complete.",
      );
      await refresh();
    } finally {
      setApplying(false);
    }
  };

  const safeCityCount =
    inventory?.citiesWithDuplicateSignals.filter(
      (city) => city.summary.approvedConsolidations > 0,
    ).length ?? 0;
  const safeTotal =
    inventory?.citiesWithDuplicateSignals.reduce(
      (total, city) => total + city.summary.approvedConsolidations,
      0,
    ) ?? 0;
  const ready = preview?.summary.approvedConsolidations ?? 0;

  return (
    <section
      className="mb-4 rounded-2xl border border-[#4F7A5A]/30 bg-[#F3FAF3] p-4"
      aria-label="Kinfolk Current city duplicate reconciliation"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#386143]">
            No-terminal duplicate cleanup
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold text-[#3A1F0E]">
            Kinfolk Current cities: preserve pins, retain verified social
            profiles
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#3A1F0E]/65">
            Each city receives its own fresh plan. Only pairs with exactly one
            stored map pin, high-confidence identity signals, and no conflicting
            official values can be consolidated. All uncertain records remain
            unchanged.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || applying}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#386143]/25 bg-white px-3 py-2 text-sm font-bold text-[#386143] hover:bg-[#E9F5EB] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{" "}
          Refresh city plans
        </button>
      </div>

      {inventory && (
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl border border-[#4F7A5A]/15 bg-white px-3 py-2">
            <div className="text-[#3A1F0E]/55">Cities with safe plans</div>
            <div className="mt-0.5 font-bold text-[#3A1F0E]">
              {safeCityCount.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-[#4F7A5A]/15 bg-white px-3 py-2">
            <div className="text-[#3A1F0E]/55">
              Safe consolidations across city plans
            </div>
            <div className="mt-0.5 font-bold text-[#3A1F0E]">
              {safeTotal.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-[#4F7A5A]/15 bg-white px-3 py-2">
            <div className="text-[#3A1F0E]/55">
              Current Kinfolk records read
            </div>
            <div className="mt-0.5 font-bold text-[#3A1F0E]">
              {inventory.totalCurrentKinfolkRowsRead.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {inventory && inventory.citiesWithDuplicateSignals.length > 0 && (
        <label className="mt-4 block max-w-xl text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/55">
          City plan
          <select
            value={selectedKey}
            onChange={(event) => setSelectedKey(event.target.value)}
            disabled={loading || applying}
            className="mt-1.5 w-full rounded-lg border border-[#3A1F0E]/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#3A1F0E] focus:border-[#4F7A5A] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {inventory.citiesWithDuplicateSignals.map((city) => (
              <option key={cityKey(city)} value={cityKey(city)}>
                {city.label} — {city.summary.approvedConsolidations} safe,{" "}
                {city.summary.manualReviewCases} manual review
              </option>
            ))}
          </select>
        </label>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-[#3A1F0E]/60">
          Checking the protected city-by-city duplicate plans…
        </p>
      ) : preview ? (
        <>
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#4F7A5A]/15 bg-white p-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#386143]">
                Selected city
              </div>
              <div className="mt-1 font-bold text-[#3A1F0E]">
                {preview.scope.label}
              </div>
              <div className="mt-1 text-sm text-[#3A1F0E]/60">
                {preview.summary.approvedConsolidations} safe ·{" "}
                {preview.summary.socialFieldsToCopy} social profiles to copy ·{" "}
                {preview.summary.manualReviewCases} manual review
              </div>
            </div>
            <button
              type="button"
              onClick={() => void apply()}
              disabled={applying || ready === 0}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4F7A5A] px-4 py-2 text-sm font-bold text-white hover:bg-[#386143] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {applying
                ? "Applying protected cleanup…"
                : ready > 0
                  ? `Apply ${ready.toLocaleString()} safe cleanup`
                  : "No safe automatic cleanup"}
            </button>
          </div>
          {preview.approved.length > 0 && (
            <ul className="mt-3 space-y-2">
              {preview.approved.map((candidate) => (
                <li
                  key={`${candidate.businessName}:${candidate.socialFields.join(",")}`}
                  className="rounded-xl border border-[#4F7A5A]/15 bg-white px-3 py-2 text-sm text-[#3A1F0E]"
                >
                  <span className="font-bold">{candidate.businessName}</span>
                  <span className="ml-2 text-[#3A1F0E]/60">
                    Copy:{" "}
                    {candidate.socialFields.length
                      ? candidate.socialFields.join(", ")
                      : "none"}
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
