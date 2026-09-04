import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, CheckCircle2, Clock, Plus, Store, XCircle } from "lucide-react";
import { Layout } from "@/components/layout";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type SubmissionStatus = "pending_review" | "needs_info" | "declined" | "published";

interface MemberSubmission {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  city: string;
  state: string | null;
  status: SubmissionStatus;
  review_note: string | null;
  matched_business_id: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS = {
  pending_review: {
    label: "Pending review",
    detail: "Not public",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Clock,
  },
  needs_info: {
    label: "More information needed",
    detail: "Not public",
    className: "bg-blue-50 text-blue-800 border-blue-200",
    icon: AlertCircle,
  },
  declined: {
    label: "Not published",
    detail: "Not public",
    className: "bg-red-50 text-red-800 border-red-200",
    icon: XCircle,
  },
  published: {
    label: "Published",
    detail: "Community-listed · Unclaimed · Not verified",
    className: "bg-green-50 text-green-800 border-green-200",
    icon: CheckCircle2,
  },
} satisfies Record<SubmissionStatus, {
  label: string;
  detail: string;
  className: string;
  icon: typeof Clock;
}>;

export default function MyBusinessSubmissions() {
  const [submissions, setSubmissions] = useState<MemberSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void authenticatedFetch(`${BASE}api/community/business-submissions/mine`)
      .then(async (response) => {
        const data = await response.json() as { submissions?: MemberSubmission[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to load submissions");
        if (active) setSubmissions(data.submissions ?? []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load submissions");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#CA922B]">Your contributions</p>
            <h1 className="font-serif text-3xl font-bold text-[#3A1F0E] mt-1">My Business Submissions</h1>
            <p className="text-sm text-[#3A1F0E]/65 mt-2">Track review status. A submission is never public before an administrator publishes it.</p>
          </div>
          <Link href="/submit-business" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#CA922B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#b68124]">
            <Plus className="w-4 h-4" /> Share a business
          </Link>
        </div>

        {loading && <div className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-8 text-center text-[#3A1F0E]/60">Loading your submissions…</div>}
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</div>}

        {!loading && !error && submissions.length === 0 && (
          <div className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-10 text-center">
            <Store className="w-10 h-10 text-[#CA922B] mx-auto mb-3" />
            <h2 className="font-semibold text-[#3A1F0E]">No submissions yet</h2>
            <p className="text-sm text-[#3A1F0E]/60 mt-1">Businesses you share will appear here with their review status.</p>
          </div>
        )}

        <div className="space-y-4">
          {submissions.map((submission) => {
            const status = STATUS[submission.status] ?? STATUS.pending_review;
            const Icon = status.icon;
            return (
              <article key={submission.id} className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#3A1F0E]">{submission.name}</h2>
                    <p className="text-sm text-[#3A1F0E]/60 mt-1">
                      {submission.subcategory || submission.category} · {[submission.city, submission.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className={`inline-flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${status.className}`}>
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <span><strong className="block">{status.label}</strong>{status.detail}</span>
                  </div>
                </div>

                {submission.review_note && (
                  <div className="mt-4 rounded-xl bg-[#F9F3E7] p-4 text-sm text-[#3A1F0E]/75">
                    <strong className="block text-[#3A1F0E] mb-1">Review note</strong>
                    {submission.review_note}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {submission.status === "needs_info" && (
                    <Link href={`/submit-business?amend=${encodeURIComponent(submission.id)}`} className="rounded-lg bg-[#3A1F0E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a160a]">
                      Update and resubmit
                    </Link>
                  )}
                  {submission.status === "published" && submission.matched_business_id && (
                    <Link href={`/business/${encodeURIComponent(submission.matched_business_id)}`} className="rounded-lg border border-[#CA922B] px-4 py-2 text-sm font-semibold text-[#CA922B] hover:bg-[#CA922B]/5">
                      View community listing
                    </Link>
                  )}
                  <span className="text-xs text-[#3A1F0E]/40">Submission ID: {submission.id}</span>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </Layout>
  );
}
