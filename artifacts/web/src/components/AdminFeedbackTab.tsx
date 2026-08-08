/**
 * AdminFeedbackTab — tester feedback triage UI for the admin panel.
 * Displays all submitted feedback with filter chips and status toggling.
 */
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Filter, CheckCircle, Circle, ExternalLink, Loader2, MessageSquarePlus } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface FeedbackRow {
  id: string;
  type: string;
  description: string;
  expected: string | null;
  page: string | null;
  platform: string | null;
  buildSha: string | null;
  status: string;
  createdAt: string;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
  userMemberType: string | null;
}

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  bug:           { label: "Bug",            color: "text-red-700",    bg: "bg-red-100 border-red-200" },
  confusing:     { label: "Confusing",      color: "text-orange-700", bg: "bg-orange-100 border-orange-200" },
  feature:       { label: "Feature",        color: "text-blue-700",   bg: "bg-blue-100 border-blue-200" },
  missing_place: { label: "Missing Place",  color: "text-teal-700",   bg: "bg-teal-100 border-teal-200" },
  incorrect:     { label: "Incorrect Info", color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
  love:          { label: "Love It",        color: "text-green-700",  bg: "bg-green-100 border-green-200" },
  general:       { label: "General",        color: "text-gray-600",   bg: "bg-gray-100 border-gray-200" },
};

function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? { label: type, color: "text-gray-600", bg: "bg-gray-100 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${meta.bg} ${meta.color}`}>
      {meta.label}
    </span>
  );
}

export function AdminFeedbackTab() {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/admin/feedback?limit=500`, { credentials: "include" });
      const data = await res.json() as { feedback?: FeedbackRow[] };
      setFeedback(data.feedback ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleStatus(id: string, current: string) {
    const next = current === "open" ? "resolved" : "open";
    setToggling(id);
    try {
      await fetch(`${BASE}/api/admin/feedback/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: next } : f));
    } finally {
      setToggling(null);
    }
  }

  const types = Object.keys(TYPE_META);
  const filtered = feedback.filter(f => {
    if (typeFilter !== "all" && f.type !== typeFilter) return false;
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    return true;
  });

  const openCount = feedback.filter(f => f.status === "open").length;
  const resolvedCount = feedback.filter(f => f.status === "resolved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#3A1F0E] flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-[#CA922B]" />
            Beta Feedback
          </h2>
          <p className="text-[#3A1F0E]/50 text-sm mt-0.5">
            {openCount} open · {resolvedCount} resolved · {feedback.length} total
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold text-[#CA922B] hover:text-[#B38024] transition-colors py-1 px-3 rounded-lg border border-[#CA922B]/30 hover:bg-[#CA922B]/5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider flex items-center gap-1"><Filter className="w-3 h-3" /> Type</span>
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${typeFilter === "all" ? "bg-[#2B1507] text-white border-[#2B1507]" : "border-[#2B1507]/15 text-[#3A1F0E]/60 hover:border-[#CA922B]/50"}`}
          >
            All ({feedback.length})
          </button>
          {types.map(t => {
            const count = feedback.filter(f => f.type === t).length;
            if (count === 0) return null;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${typeFilter === t ? "bg-[#2B1507] text-white border-[#2B1507]" : "border-[#2B1507]/15 text-[#3A1F0E]/60 hover:border-[#CA922B]/50"}`}
              >
                {TYPE_META[t]?.label ?? t} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider">Status</span>
          {["all", "open", "resolved"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all capitalize ${statusFilter === s ? "bg-[#CA922B] text-white border-[#CA922B]" : "border-[#2B1507]/15 text-[#3A1F0E]/60 hover:border-[#CA922B]/50"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      {loading && feedback.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#CA922B] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#3A1F0E]/40 text-sm">
          No feedback matches the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => {
            const isResolved = f.status === "resolved";
            return (
              <div
                key={f.id}
                className={`rounded-2xl border p-4 transition-opacity ${isResolved ? "opacity-50" : ""} border-[#2B1507]/8 bg-white`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={f.type} />
                    {f.page && (
                      <span className="text-xs text-[#3A1F0E]/40 font-mono bg-[#FAF6EF] rounded px-2 py-0.5">{f.page}</span>
                    )}
                    {f.buildSha && (
                      <span className="text-[10px] text-[#3A1F0E]/30 font-mono">{f.buildSha}</span>
                    )}
                  </div>
                  <button
                    onClick={() => void toggleStatus(f.id, f.status)}
                    disabled={toggling === f.id}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#3A1F0E]/50 hover:text-[#CA922B] transition-colors"
                    title={isResolved ? "Reopen" : "Mark resolved"}
                  >
                    {toggling === f.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isResolved
                        ? <><Circle className="w-4 h-4" /> Reopen</>
                        : <><CheckCircle className="w-4 h-4" /> Resolve</>}
                  </button>
                </div>

                <p className="text-sm text-[#3A1F0E] mt-2.5 leading-relaxed">{f.description}</p>

                {f.expected && (
                  <p className="text-xs text-[#3A1F0E]/50 mt-2 italic">Expected: {f.expected}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#2B1507]/5 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs text-[#3A1F0E]/40">
                    <span className="font-medium text-[#3A1F0E]/60">
                      {[f.userFirstName, f.userLastName].filter(Boolean).join(" ") || "Anonymous"}
                    </span>
                    {f.userEmail && <span className="truncate max-w-[160px]">{f.userEmail}</span>}
                    {f.userMemberType && (
                      <span className="px-1.5 py-0.5 bg-[#FAF6EF] rounded text-[10px] font-bold">{f.userMemberType}</span>
                    )}
                  </div>
                  <time className="text-xs text-[#3A1F0E]/30">
                    {new Date(f.createdAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true
                    })}
                  </time>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
