import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Briefcase, MapPin, Clock, DollarSign, ExternalLink, Plus, X, ChevronDown, Building2 } from "lucide-react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;

interface Job {
  id: string;
  businessName: string;
  title: string;
  type: string;
  city: string;
  state: string;
  description: string;
  salary?: string;
  applicationUrl?: string;
  contactEmail?: string;
  createdAt: string;
}

const JOB_TYPES = ["All", "full-time", "part-time", "contract", "internship"];
const TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-Time", "part-time": "Part-Time", "contract": "Contract", "internship": "Internship"
};
const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-green-100 text-green-800",
  "part-time": "bg-blue-100 text-blue-800",
  "contract": "bg-purple-100 text-purple-800",
  "internship": "bg-orange-100 text-orange-800",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "", businessName: "", type: "full-time", city: "", state: "",
    description: "", salary: "", applicationUrl: "", requirements: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "All") params.set("type", typeFilter);
    fetch(`${BASE}api/jobs?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setJobs(d.jobs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [typeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.user) { toast({ title: "Please sign in to post a job", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const job = await res.json();
      setJobs(prev => [job, ...prev]);
      setShowModal(false);
      setForm({ title: "", businessName: "", type: "full-time", city: "", state: "", description: "", salary: "", applicationUrl: "", requirements: "" });
      toast({ title: "Job posted!", description: "Your listing is now live." });
    } catch {
      toast({ title: "Failed to post job", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
                <Briefcase className="w-3 h-3 text-[#CA922B]" />
                <span className="text-[10px] font-bold tracking-widest text-[#F5EBD8] uppercase">Job Board</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 leading-tight">
                Work With <span className="text-[#CA922B]">Your Community</span>
              </h1>
              <p className="text-[#F5EBD8]/70 text-lg max-w-xl">
                Jobs at Minority-owned businesses. Support the ecosystem — hire and get hired within the community.
              </p>
              <DisclaimerBanner type="employment" className="mt-4 max-w-xl bg-white/10 border border-white/20 text-white" />
            </div>
            <div className="shrink-0">
              {auth?.user ? (
                <Button onClick={() => setShowModal(true)} className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12 text-base font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> Post a Job
                </Button>
              ) : (
                <Link href="/login">
                  <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12 text-base font-semibold">
                    Sign In to Post
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 max-w-5xl py-12">
        {/* Type filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {JOB_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                typeFilter === t
                  ? "bg-[#2B1507] text-white border-[#2B1507]"
                  : "bg-white text-[#3A1F0E] border-[#2B1507]/20 hover:border-[#CA922B] hover:text-[#CA922B]"
              }`}
            >
              {t === "All" ? "All Types" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Jobs list */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-24">
            <Briefcase className="w-16 h-16 mx-auto text-[#2B1507]/15 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-3">No jobs posted yet</h2>
            <p className="text-[#3A1F0E]/60 mb-8">Be the first to post an opportunity in the community.</p>
            {auth?.user ? (
              <Button onClick={() => setShowModal(true)} className="rounded-full bg-[#CA922B] text-white px-8 h-12">
                Post the First Job
              </Button>
            ) : (
              <Link href="/login"><Button className="rounded-full bg-[#2B1507] text-white px-8 h-12">Sign In to Post</Button></Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-2xl p-6 border border-[#2B1507]/8 shadow-sm hover:border-[#CA922B]/30 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[job.type] || "bg-gray-100 text-gray-700"}`}>
                        {TYPE_LABELS[job.type] || job.type}
                      </span>
                      <span className="text-[#3A1F0E]/40 text-xs">{timeAgo(job.createdAt)}</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-1">{job.title}</h3>
                    <div className="flex items-center gap-1.5 text-[#CA922B] font-semibold text-sm mb-3">
                      <Building2 className="w-3.5 h-3.5" />
                      {job.businessName}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#3A1F0E]/60 mb-4">
                      <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.city}, {job.state}</div>
                      {job.salary && <div className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.salary}</div>}
                    </div>
                    <p className="text-[#3A1F0E]/70 text-sm leading-relaxed line-clamp-2">{job.description}</p>
                  </div>
                  <div className="shrink-0">
                    {job.applicationUrl ? (
                      <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="rounded-full bg-[#2B1507] hover:bg-[#1a0c04] text-white px-6 h-10 text-sm">
                          Apply <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </a>
                    ) : job.contactEmail ? (
                      <a href={`mailto:${job.contactEmail}`}>
                        <Button className="rounded-full bg-[#2B1507] hover:bg-[#1a0c04] text-white px-6 h-10 text-sm">
                          Contact
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-[#3A1F0E]">Post a Job</h2>
              <button onClick={() => setShowModal(false)} className="text-[#3A1F0E]/50 hover:text-[#3A1F0E]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70 block mb-1.5">Job Title *</label>
                  <Input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Senior Hair Stylist" className="rounded-xl" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70 block mb-1.5">Business Name *</label>
                  <Input required value={form.businessName} onChange={e => setForm(f => ({...f, businessName: e.target.value}))} placeholder="Your business name" className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70 block mb-1.5">Job Type *</label>
                  <select required value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
                    className="w-full h-10 border border-input rounded-xl px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#CA922B]">
                    {["full-time","part-time","contract","internship"].map(t => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70 block mb-1.5">Salary / Range</label>
                  <Input value={form.salary} onChange={e => setForm(f => ({...f, salary: e.target.value}))} placeholder="e.g. $45,000–$60,000" className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70 block mb-1.5">City *</label>
                  <Input required value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} placeholder="Atlanta" className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70 block mb-1.5">State *</label>
                  <Input required value={form.state} onChange={e => setForm(f => ({...f, state: e.target.value}))} placeholder="GA" maxLength={2} className="rounded-xl" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70 block mb-1.5">Description *</label>
                  <textarea required value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Describe the role, responsibilities, and what makes your business a great place to work..." rows={4}
                    className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#CA922B] resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70 block mb-1.5">Requirements</label>
                  <textarea value={form.requirements} onChange={e => setForm(f => ({...f, requirements: e.target.value}))} placeholder="List any qualifications, skills, or experience required..." rows={3}
                    className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#CA922B] resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70 block mb-1.5">Application URL</label>
                  <Input value={form.applicationUrl} onChange={e => setForm(f => ({...f, applicationUrl: e.target.value}))} placeholder="https://yoursite.com/apply" type="url" className="rounded-xl" />
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-12 font-semibold">
                {submitting ? "Posting..." : "Post Job Listing"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
