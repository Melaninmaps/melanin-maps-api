import { useState, useEffect } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { getWebToken } from "@/lib/webAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, GitMerge, MapPin, ExternalLink, RefreshCw, AlertTriangle, Copy } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type ReviewItem = {
  id: string;
  reviewType: "possible_duplicate" | "ownership_unverified" | "insufficient_evidence";
  status: "pending" | "approved" | "rejected" | "merged" | "keep_both" | "needs_research";
  candidateName: string;
  candidateAddress: string;
  candidateCity: string;
  candidateState: string;
  candidateWebsite: string | null;
  candidatePhone: string | null;
  candidateLatitude: number | null;
  candidateLongitude: number | null;
  candidateCategory: string | null;
  candidateSourceProvider: string | null;
  candidateSourceUrl: string | null;
  score: number | null;
  reason: string | null;
  requestedAttribute: string | null;
  matchedBusinessId: string | null;
  matchedBusinessName: string | null;
  matchedBusinessAddress: string | null;
  matchedBusinessWebsite: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  approve: "Approve & Add",
  reject: "Reject",
  merge: "Merge into existing",
  keep_both: "Keep both",
  needs_research: "Needs more research",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  merged: "bg-blue-100 text-blue-800",
  keep_both: "bg-purple-100 text-purple-800",
  needs_research: "bg-gray-100 text-gray-700",
};

const TYPE_COLORS: Record<string, string> = {
  possible_duplicate: "bg-orange-100 text-orange-800",
  ownership_unverified: "bg-yellow-100 text-yellow-800",
  insufficient_evidence: "bg-slate-100 text-slate-700",
};

const TYPE_LABELS: Record<string, string> = {
  possible_duplicate: "Possible Duplicate",
  ownership_unverified: "Ownership Unverified",
  insufficient_evidence: "Insufficient Evidence",
};

export default function AdminBusinessReview() {
  const { data: auth, isLoading } = useGetCurrentAuthUser();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "possible_duplicate">("pending");
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ pending: number; total: number } | null>(null);

  const token = getWebToken();

  async function fetchItems() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set(filter === "pending" ? "status" : "type", filter);
      const res = await fetch(`${BASE}api/admin/business-review?${params}`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as { items: ReviewItem[]; stats: { pending: number; total: number } };
      setItems(data.items);
      setStats(data.stats);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchItems(); }, [filter]);

  async function act(id: string, action: string) {
    setActing(id + action);
    try {
      const res = await fetch(`${BASE}api/admin/business-review/${id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      await fetchItems();
    } catch (e) {
      setError(String(e));
    } finally {
      setActing(null);
    }
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" /></div>;
  if (!auth?.user || auth.user.role !== "admin") return <Redirect to="/admin" />;

  return (
    <div className="min-h-screen bg-background p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Business Review Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Candidates held for human review before publication. Possible duplicates, unverified ownership claims, and low-confidence records appear here.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border p-4">
            <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending review</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total items</div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "possible_duplicate", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? "bg-[#CA922B] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "pending" ? "Pending" : f === "possible_duplicate" ? "Possible Duplicates" : "All"}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-dashed">
          <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-medium">All clear</p>
          <p className="text-sm text-muted-foreground">No items in this queue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border bg-card p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[item.reviewType] ?? "bg-gray-100 text-gray-600"}`}>
                      {TYPE_LABELS[item.reviewType] ?? item.reviewType}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {item.status}
                    </span>
                    {item.score !== null && (
                      <span className="text-xs text-muted-foreground">Score: {item.score}/100</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg leading-tight">{item.candidateName}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {[item.candidateAddress, item.candidateCity, item.candidateState].filter(Boolean).join(", ")}
                  </div>
                </div>
                {item.candidateLatitude && item.candidateLongitude && (
                  <a
                    href={`https://maps.google.com/?q=${item.candidateLatitude},${item.candidateLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Map
                  </a>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3">
                {item.candidateWebsite && (
                  <div>
                    <span className="text-muted-foreground">Website: </span>
                    <a href={item.candidateWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{item.candidateWebsite}</a>
                  </div>
                )}
                {item.candidatePhone && (
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <span>{item.candidatePhone}</span>
                  </div>
                )}
                {item.candidateCategory && (
                  <div>
                    <span className="text-muted-foreground">Category: </span>
                    <span>{item.candidateCategory}</span>
                  </div>
                )}
                {item.candidateSourceProvider && (
                  <div>
                    <span className="text-muted-foreground">Source: </span>
                    <span>{item.candidateSourceProvider}</span>
                  </div>
                )}
                {item.requestedAttribute && (
                  <div>
                    <span className="text-muted-foreground">Requested attribute: </span>
                    <span className="font-medium">{item.requestedAttribute}</span>
                  </div>
                )}
              </div>

              {/* Reason */}
              {item.reason && (
                <div className="text-sm text-amber-700 bg-amber-50 rounded px-3 py-2 mb-3">
                  {item.reason}
                </div>
              )}

              {/* Matched existing business (for duplicates) */}
              {item.matchedBusinessId && (
                <div className="border rounded p-3 mb-3 bg-blue-50/50">
                  <p className="text-xs font-medium text-blue-700 mb-1">Possible match in database</p>
                  <p className="font-medium text-sm">{item.matchedBusinessName}</p>
                  {item.matchedBusinessAddress && <p className="text-xs text-muted-foreground">{item.matchedBusinessAddress}</p>}
                  {item.matchedBusinessWebsite && (
                    <a href={item.matchedBusinessWebsite} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      {item.matchedBusinessWebsite}
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              {item.status === "pending" && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!!acting}
                    onClick={() => act(item.id, "approve")}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {acting === item.id + "approve" ? "…" : "Approve & Add"}
                  </Button>

                  {item.reviewType === "possible_duplicate" && item.matchedBusinessId && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-700"
                        disabled={!!acting}
                        onClick={() => act(item.id, "merge")}
                      >
                        <GitMerge className="w-3.5 h-3.5 mr-1" />
                        {acting === item.id + "merge" ? "…" : "Merge into existing"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-300 text-purple-700"
                        disabled={!!acting}
                        onClick={() => act(item.id, "keep_both")}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        {acting === item.id + "keep_both" ? "…" : "Keep both"}
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!acting}
                    onClick={() => act(item.id, "needs_research")}
                  >
                    {acting === item.id + "needs_research" ? "…" : "Needs more research"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700"
                    disabled={!!acting}
                    onClick={() => act(item.id, "reject")}
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    {acting === item.id + "reject" ? "…" : "Reject"}
                  </Button>
                </div>
              )}

              {item.status !== "pending" && item.resolvedAt && (
                <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                  Resolved {new Date(item.resolvedAt).toLocaleDateString()} — {item.status}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
