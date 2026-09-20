import { CheckCircle2, ExternalLink, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Contribution = {
  id: string;
  business_id: string;
  business_name: string | null;
  source_type: string;
  source_url: string;
  caption: string | null;
  attribution: string | null;
  contributor_name: string | null;
  contributor_email: string | null;
  created_at: string;
};

type Props = { base: string };

function safeContributionUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function AdminBusinessVideoContributions({ base }: Props) {
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${base}api/admin/contributions?status=pending`, {
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({})) as { contributions?: Contribution[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load pending video contributions.");
      setItems(Array.isArray(payload.contributions) ? payload.contributions : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load pending video contributions.");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { void load(); }, [load]);

  async function decide(item: Contribution, status: "approved" | "rejected") {
    const rejectedReason = status === "rejected"
      ? window.prompt("Optional private reason for the contributor:") ?? undefined
      : undefined;
    setActingId(item.id);
    setError(null);
    try {
      const response = await fetch(`${base}api/admin/contributions/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectedReason }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to update this contribution.");
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update this contribution.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#2B1507]">Community video contributions</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#3A1F0E]/60">
            Review public links before they appear on a business profile. Approval publishes only the original-platform link and its submitted caption; it does not verify ownership or change a listing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#3A1F0E]/15 bg-white px-3 py-2 text-xs font-bold text-[#3A1F0E] hover:border-[#CA922B]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-[#3A1F0E]/55">Loading pending contributions…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#3A1F0E]/15 bg-white px-5 py-8 text-center text-sm text-[#3A1F0E]/55">No pending public-video contributions.</p>
      ) : null}

      <div className="grid gap-4">
        {items.map((item) => {
          const href = safeContributionUrl(item.source_url);
          const busy = actingId === item.id;
          return (
            <article key={item.id} className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#CA922B]">{item.source_type}</p>
                  <h3 className="mt-1 text-base font-bold text-[#2B1507]">{item.business_name ?? "Business listing"}</h3>
                  <p className="mt-1 text-xs text-[#3A1F0E]/55">Submitted by {item.contributor_name ?? item.contributor_email ?? "a member"} · {new Date(item.created_at).toLocaleString()}</p>
                </div>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#CA922B]/35 px-3 py-2 text-xs font-bold text-[#8D5C17] hover:bg-[#CA922B]/10">
                    Open original <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : <span className="text-xs font-semibold text-red-700">Invalid external link</span>}
              </div>
              {item.caption ? <p className="mt-4 rounded-xl bg-[#FAF6EF] p-3 text-sm leading-relaxed text-[#3A1F0E]">{item.caption}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={busy || !href} onClick={() => void decide(item, "approved")} className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D7A4F] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve & publish link
                </button>
                <button type="button" disabled={busy} onClick={() => void decide(item, "rejected")} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50">
                  <XCircle className="h-3.5 w-3.5" /> Keep private
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
