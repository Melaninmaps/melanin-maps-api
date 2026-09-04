import { useState, useEffect } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Link, Redirect } from "wouter";
import { Layout } from "@/components/layout";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import {
  CheckCircle2, XCircle, MessageSquare, Clock, Store,
  MapPin, Globe, Phone, ArrowLeft, RefreshCw, ChevronDown,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface Submission {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  description: string | null;
  social_profiles: Record<string, string>;
  media_urls: string[];
  ownership_designations: string[];
  submitter_note: string | null;
  source_channel: string | null;
  source_campaign: string | null;
  status: string;
  review_note: string | null;
  matched_business_id: string | null;
  created_at: string;
}

type Filter = "pending_review" | "published" | "declined" | "needs_info" | "all";

const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  needs_info: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending review",
  published: "Published",
  declined: "Declined",
  needs_info: "Needs info",
};

export default function FounderBusinessSubmissions() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<Filter>("pending_review");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const user = auth?.user as any;
  if (!authLoading && (!user?.id || user.role !== "admin")) {
    return <Redirect to="/" />;
  }

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await authenticatedFetch(
        `${BASE}api/founder/business-submissions?status=${filter}`,
      );
      if (!resp.ok) throw new Error("Failed to load");
      const data = await resp.json() as { submissions: Submission[] };
      setSubmissions(data.submissions);
    } catch {
      setError("Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.role === "admin") load(); }, [filter, user?.role]);

  const decide = async (
    id: string,
    status: "published" | "declined" | "needs_info",
  ) => {
    setProcessing(id);
    try {
      const resp = await authenticatedFetch(
        `${BASE}api/founder/business-submissions/${id}/decision`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reviewNote: reviewNote.trim() || undefined }),
        },
      );
      const data = await resp.json() as { ok?: boolean; error?: string; message?: string };
      if (!resp.ok) {
        alert(data.error ?? "Failed to process decision.");
      } else {
        setExpanded(null);
        setReviewNote("");
        await load();
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <button className="flex items-center gap-1.5 text-sm text-[#3A1F0E]/50 hover:text-[#CA922B] transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Admin panel
            </button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#3A1F0E]">
                Business Submission Queue
              </h1>
              <p className="text-[#3A1F0E]/60 mt-1">
                Community-submitted businesses pending your review.
                Nothing goes live until you approve it.
              </p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-sm text-[#CA922B] hover:text-[#B38024] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["pending_review", "needs_info", "published", "declined", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-[#CA922B] text-white"
                  : "bg-[#FAF6EF] text-[#3A1F0E]/70 hover:bg-[#CA922B]/10 hover:text-[#CA922B]"
              }`}
            >
              {f === "all" ? "All" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-[#3A1F0E]/50">{error}</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-12 h-12 text-[#3A1F0E]/20 mx-auto mb-4" />
            <p className="text-[#3A1F0E]/50">
              No {filter === "all" ? "" : STATUS_LABELS[filter].toLowerCase()}{" "}
              submissions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-[#3A1F0E]/8 rounded-2xl overflow-hidden"
              >
                {/* Summary row */}
                <button
                  className="w-full text-left p-5 flex items-start gap-4 hover:bg-[#FAF6EF] transition-colors"
                  onClick={() =>
                    setExpanded(expanded === s.id ? null : s.id)
                  }
                >
                  <div className="w-10 h-10 bg-[#CA922B]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5 text-[#CA922B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#3A1F0E]">{s.name}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#3A1F0E]/50 mt-1 flex-wrap">
                      <span>{s.subcategory || s.category}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[s.city, s.state].filter(Boolean).join(", ")}
                      </span>
                      {s.source_channel && (
                        <span className="text-xs text-[#CA922B]/60">
                          via {s.source_channel}
                        </span>
                      )}
                      <span className="text-xs text-[#3A1F0E]/30">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#3A1F0E]/30 transition-transform shrink-0 mt-1 ${expanded === s.id ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Expanded panel */}
                {expanded === s.id && (
                  <div className="border-t border-[#3A1F0E]/8 p-5 space-y-5">
                    {/* Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {s.address && (
                        <div className="flex items-start gap-2 text-[#3A1F0E]/70">
                          <MapPin className="w-4 h-4 text-[#CA922B] mt-0.5 shrink-0" />
                          <span>{s.address}, {s.city}{s.state ? `, ${s.state}` : ""}{s.postal_code ? ` ${s.postal_code}` : ""}</span>
                        </div>
                      )}
                      {s.website && (
                        <div className="flex items-center gap-2 text-[#3A1F0E]/70">
                          <Globe className="w-4 h-4 text-[#CA922B] shrink-0" />
                          <a href={s.website} target="_blank" rel="noopener noreferrer"
                            className="text-[#CA922B] hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                            {s.website}
                          </a>
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-2 text-[#3A1F0E]/70">
                          <Phone className="w-4 h-4 text-[#CA922B] shrink-0" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                      {(s.ownership_designations ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 sm:col-span-2">
                          {s.ownership_designations.map((d) => (
                            <span key={d} className="text-xs px-2.5 py-1 bg-[#CA922B]/10 text-[#CA922B] rounded-full font-medium">
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                      {Object.entries(s.social_profiles ?? {}).map(([platform, url]) => (
                        <div key={platform} className="flex items-center gap-2 text-[#3A1F0E]/70">
                          <Globe className="w-4 h-4 text-[#CA922B] shrink-0" />
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#CA922B] hover:underline truncate">
                            {platform}: {url}
                          </a>
                        </div>
                      ))}
                    </div>

                    {(s.media_urls ?? []).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {s.media_urls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={url} alt={`Submitted review media for ${s.name}`} className="w-full aspect-video object-cover rounded-xl border border-[#3A1F0E]/10" />
                          </a>
                        ))}
                      </div>
                    )}

                    {s.description && (
                      <div className="bg-[#FAF6EF] rounded-xl p-3 text-sm text-[#3A1F0E]/70">
                        {s.description}
                      </div>
                    )}

                    {s.submitter_note && (
                      <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800">
                        <span className="font-semibold">Note from submitter: </span>
                        {s.submitter_note}
                      </div>
                    )}

                    {/* Already decided */}
                    {s.status !== "pending_review" ? (
                      <div className={`rounded-xl p-3 text-sm ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABELS[s.status]}
                        {s.review_note && (
                          <span className="block mt-1 opacity-80">{s.review_note}</span>
                        )}
                        {s.matched_business_id && (
                          <Link href={`/businesses/${s.matched_business_id}`}>
                            <a className="block mt-1 underline opacity-80 hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                              View published listing →
                            </a>
                          </Link>
                        )}
                      </div>
                    ) : (
                      /* Decision panel */
                      <div className="space-y-3 pt-2">
                        <textarea
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Message to the submitter (visible in My Submissions)"
                          rows={2}
                          className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/60 bg-white resize-none"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => decide(s.id, "published")}
                            disabled={processing === s.id}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {processing === s.id ? "Processing…" : "Approve & publish"}
                          </button>
                          <button
                            onClick={() => decide(s.id, "needs_info")}
                            disabled={processing === s.id}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Needs info
                          </button>
                          <button
                            onClick={() => decide(s.id, "declined")}
                            disabled={processing === s.id}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-red-100 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Decline
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
