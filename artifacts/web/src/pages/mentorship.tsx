import { useState, useEffect } from "react";
import { Users, Search, Briefcase, MapPin, ExternalLink, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

interface MentorshipProfile {
  id: string;
  userId: string;
  fullName: string;
  bio: string | null;
  industry: string | null;
  role: string;
  expertise: string | null;
  city: string | null;
  available: boolean;
  linkedinUrl: string | null;
  createdAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  mentor: { label: "Mentor", color: "#2D7A4F", bg: "#2D7A4F12" },
  mentee: { label: "Mentee", color: "#1D4ED8", bg: "#1D4ED812" },
  both: { label: "Mentor & Mentee", color: "#7B2D8B", bg: "#7B2D8B12" },
};

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Creative Arts",
  "Law", "Real Estate", "Entrepreneurship", "Media", "Politics & Advocacy",
  "Non-Profit", "Sports & Fitness",
];

export default function Mentorship() {
  const { data: auth } = useGetCurrentAuthUser();
  const [profiles, setProfiles] = useState<MentorshipProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", bio: "", industry: "", role: "mentor", expertise: "", city: "", linkedinUrl: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (roleFilter !== "all") params.set("role", roleFilter);
        if (industryFilter !== "all") params.set("industry", industryFilter);
        const res = await fetch(`${BASE}api/mentorship?${params}`);
        if (res.ok) {
          const data = await res.json() as { profiles: MentorshipProfile[] };
          setProfiles(data.profiles);
        }
      } catch {}
      setIsLoading(false);
    }
    load();
  }, [roleFilter, industryFilter]);

  const filtered = profiles.filter((p) =>
    search.length === 0 ||
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (p.industry ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.city ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!auth?.user) return;
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setFormError("Full name is required (at least 2 characters).");
      return;
    }
    if (!form.industry) {
      setFormError("Please select an industry.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const res = await fetch(`${BASE}api/mentorship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (res.ok) { setSaved(true); setShowForm(false); }
    } catch {}
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#3A1F0E] to-[#1C0E06] text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#CA922B20] border border-[#CA922B40] text-[#CA922B] text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Users size={14} />
            Community Mentorship Network
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Connect With<br />
            <span className="text-[#CA922B]">Black Excellence</span>
          </h1>
          <p className="text-[#F5EBD8]/80 text-lg max-w-2xl">
            Find mentors, collaborate with peers, and connect with professionals across every industry. Real people. Real community. Real growth.
          </p>
          {auth?.user && !showForm && (
            <Button
              className="mt-8 bg-[#CA922B] hover:bg-[#B8811F] text-white font-semibold px-8 h-12 rounded-xl"
              onClick={() => setShowForm(true)}
            >
              <Plus size={16} className="mr-2" />
              Add Your Profile
            </Button>
          )}
          {!auth?.user && (
            <Link href={`${BASE}login`}>
              <Button className="mt-8 bg-[#CA922B] hover:bg-[#B8811F] text-white font-semibold px-8 h-12 rounded-xl">
                Sign In to Join the Network
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Profile form */}
        {showForm && auth?.user && (
          <div className="bg-white rounded-2xl border border-[#E8D5B0] p-8">
            <h2 className="text-xl font-bold text-[#3A1F0E] mb-6">Your Mentorship Profile</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#3A1F0E] mb-1 block">Full Name *</label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your name" className="border-[#E8D5B0]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#3A1F0E] mb-1 block">City</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Atlanta, GA" className="border-[#E8D5B0]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#3A1F0E] mb-1 block">Industry</label>
                <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full h-10 px-3 rounded-md border border-[#E8D5B0] text-sm bg-white text-[#3A1F0E]">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3A1F0E] mb-1 block">I am a</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 px-3 rounded-md border border-[#E8D5B0] text-sm bg-white text-[#3A1F0E]">
                  <option value="mentor">Mentor</option>
                  <option value="mentee">Mentee</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[#3A1F0E] mb-1 block">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Tell the community about yourself..." className="w-full px-3 py-2 rounded-md border border-[#E8D5B0] text-sm resize-none text-[#3A1F0E]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#3A1F0E] mb-1 block">Areas of Expertise</label>
                <Input value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} placeholder="e.g. Product Management, Fundraising" className="border-[#E8D5B0]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#3A1F0E] mb-1 block">LinkedIn (optional)</label>
                <Input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." className="border-[#E8D5B0]" />
              </div>
            </div>
            {formError && (
              <p className="text-red-600 text-sm font-medium mt-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{formError}</p>
            )}
            <div className="flex gap-3 mt-6">
              <Button className="bg-[#3A1F0E] hover:bg-[#2B1507] text-white font-semibold px-8 h-11 rounded-xl" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Profile"}
              </Button>
              <Button variant="outline" className="h-11 border-[#E8D5B0]" onClick={() => { setShowForm(false); setFormError(null); }}>Cancel</Button>
            </div>
            {saved && <p className="text-[#2D7A4F] text-sm font-medium mt-3">✓ Profile saved! You'll appear in the directory.</p>}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B4C2A]/50" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, industry, city…" className="pl-9 border-[#E8D5B0] bg-white" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 px-3 rounded-md border border-[#E8D5B0] text-sm bg-white text-[#3A1F0E]">
            <option value="all">All Roles</option>
            <option value="mentor">Mentors</option>
            <option value="mentee">Mentees</option>
            <option value="both">Both</option>
          </select>
          <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="h-10 px-3 rounded-md border border-[#E8D5B0] text-sm bg-white text-[#3A1F0E]">
            <option value="all">All Industries</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {/* Profiles */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E8D5B0] p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#F5EBD8]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#F5EBD8] rounded w-1/2" />
                    <div className="h-3 bg-[#F5EBD8] rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={48} className="text-[#CA922B]/30 mx-auto mb-4" />
            <h3 className="font-bold text-[#3A1F0E] text-xl mb-2">No profiles yet</h3>
            <p className="text-[#6B4C2A] mb-6">Be the first to join the mentorship network</p>
            {auth?.user ? (
              <Button className="bg-[#CA922B] hover:bg-[#B8811F] text-white font-semibold px-8 h-11 rounded-xl" onClick={() => setShowForm(true)}>
                Add Your Profile
              </Button>
            ) : (
              <Link href={`${BASE}login`}>
                <Button className="bg-[#CA922B] hover:bg-[#B8811F] text-white font-semibold px-8 h-11 rounded-xl">Sign In to Join</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((p) => {
              const rc = ROLE_CONFIG[p.role] ?? ROLE_CONFIG.mentor;
              const initials = p.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              const COLORS = ["#3A1F0E", "#2D7A4F", "#CA922B", "#1D4ED8", "#7B2D8B"];
              const avatarColor = COLORS[p.fullName.charCodeAt(0) % COLORS.length];
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-[#E8D5B0] p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: avatarColor }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[#3A1F0E] text-lg leading-tight">{p.fullName}</h3>
                        <div className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: rc.bg, color: rc.color }}>
                          {rc.label}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {p.industry && (
                          <div className="flex items-center gap-1 text-xs text-[#6B4C2A]">
                            <Briefcase size={11} className="text-[#CA922B]" />
                            {p.industry}
                          </div>
                        )}
                        {p.city && (
                          <div className="flex items-center gap-1 text-xs text-[#6B4C2A]">
                            <MapPin size={11} className="text-[#CA922B]" />
                            {p.city}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {p.bio && <p className="text-sm text-[#6B4C2A] leading-relaxed mb-3 line-clamp-3">{p.bio}</p>}
                  {p.expertise && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.expertise.split(",").slice(0, 4).map((ex) => (
                        <span key={ex.trim()} className="px-2.5 py-1 bg-[#FAF6EF] border border-[#E8D5B0] rounded-full text-xs text-[#3A1F0E] font-medium">
                          {ex.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#2D7A4F]" />
                      <span className="text-xs text-[#2D7A4F] font-medium">Available</span>
                    </div>
                    {p.linkedinUrl && (
                      <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#1D4ED8] font-semibold hover:underline">
                        LinkedIn <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
