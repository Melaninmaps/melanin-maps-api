import { useState, useEffect, useCallback } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Heart, Phone, MessageCircle, ExternalLink, MapPin, Calendar, Loader2, Shield } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

interface Meeting { id: string; name: string; type: string; address?: string; city?: string; state?: string; day?: string; time?: string; format?: string; url?: string; phone?: string; }
interface CrisisResource { name: string; description: string; url?: string; phone?: string; textNumber?: string; hours?: string; }

// Curated crisis resources — always shown regardless of API
const CRISIS: CrisisResource[] = [
  { name: "988 Suicide & Crisis Lifeline", description: "Free, confidential crisis support 24/7. Call or text.", phone: "988", hours: "24/7" },
  { name: "Crisis Text Line", description: "Text HOME to 741741 — free, 24/7 text-based support.", textNumber: "741741", hours: "24/7" },
  { name: "Black Mental Health Alliance", description: "Mental health education, advocacy, and culturally-competent therapist directory.", url: "https://blackmentalhealth.com" },
  { name: "Therapy for Black Girls", description: "An online space dedicated to the mental wellness of Black women and girls.", url: "https://therapyforblackgirls.com" },
  { name: "Therapy for Black Men", description: "Connecting Black men to culturally-competent therapists.", url: "https://therapyforblackmen.org" },
  { name: "Loveland Foundation", description: "Therapy vouchers and financial assistance for Black women and girls.", url: "https://thelovelandfoundation.org" },
];

const MEETING_TYPES = ["All", "AA", "NA", "Smart Recovery", "Online", "In Person"];

export default function Wellness() {
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const isAuthenticated = !!(auth?.user);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"resources" | "meetings">("resources");
  const [meetingType, setMeetingType] = useState("All");
  const [city, setCity] = useState("");
  const [searching, setSearching] = useState(false);

  const searchMeetings = useCallback(async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (city.trim()) params.set("city", city.trim());
      if (meetingType !== "All") params.set("type", meetingType);
      const res = await fetch(`${BASE}api/wellness/meetings?${params}`, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setMeetings(d.meetings ?? []); }
    } catch { /* ignore */ } finally { setSearching(false); }
  }, [city, meetingType]);

  useEffect(() => { if (activeTab === "meetings") searchMeetings(); }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-[#2B1507] text-white px-4 pt-8 pb-0">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif font-bold text-2xl text-white mb-1">Wellness Hub</h1>
          <p className="text-[#F5EBD8]/60 text-sm mb-4">Mental health, recovery, and community care resources</p>
          <div className="flex gap-0 border-b border-white/10">
            {(["resources", "meetings"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px capitalize ${activeTab === tab ? "border-[#CA922B] text-white" : "border-transparent text-white/50 hover:text-white/80"}`}>
                {tab === "resources" ? "Crisis & Support" : "Find Meetings"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === "resources" ? (
          <div className="space-y-4">
            {/* Emergency banner */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700">If you are in immediate danger, call 911.</p>
                <p className="text-sm text-red-600 mt-0.5">The resources below provide 24/7 confidential support.</p>
              </div>
            </div>

            {CRISIS.map((res, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8DDD0]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#2B1507]">{res.name}</h3>
                    <p className="text-sm text-[#3A1F0E]/60 mt-1">{res.description}</p>
                    {res.hours && <p className="text-xs text-[#CA922B] font-bold mt-2">Available: {res.hours}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {res.phone && (
                    <a href={`tel:${res.phone}`} className="flex items-center gap-2 px-4 py-2 bg-[#2B1507] text-white rounded-full text-sm font-bold hover:bg-[#3d1f08] transition-colors">
                      <Phone className="w-3 h-3" /> Call {res.phone}
                    </a>
                  )}
                  {res.textNumber && (
                    <a href={`sms:${res.textNumber}`} className="flex items-center gap-2 px-4 py-2 bg-[#CA922B] text-white rounded-full text-sm font-bold hover:bg-[#b07e24] transition-colors">
                      <MessageCircle className="w-3 h-3" /> Text {res.textNumber}
                    </a>
                  )}
                  {res.url && (
                    <a href={res.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#FAF6EF] text-[#2B1507] border border-[#E8DDD0] rounded-full text-sm font-bold hover:bg-[#E8DDD0] transition-colors">
                      <ExternalLink className="w-3 h-3" /> Visit Site
                    </a>
                  )}
                </div>
              </div>
            ))}

            {/* Additional resources */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8DDD0]">
              <h3 className="font-bold text-[#2B1507] mb-3">More Resources</h3>
              <div className="space-y-3">
                {[
                  { name: "SAMHSA Treatment Locator", url: "https://findtreatment.gov", desc: "Find mental health and substance use treatment near you" },
                  { name: "Open Path Collective", url: "https://openpathcollective.org", desc: "Affordable therapy sessions ($30–$80) with licensed therapists" },
                  { name: "Inclusive Therapists", url: "https://www.inclusivetherapists.com", desc: "Culturally-responsive therapists for BIPOC communities" },
                  { name: "Melanin & Mental Health", url: "https://melaninandmentalhealth.com", desc: "Culturally-responsive therapist directory and wellness community" },
                ].map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 py-3 border-b border-[#FAF6EF] last:border-0 hover:text-[#CA922B] transition-colors">
                    <ExternalLink className="w-4 h-4 text-[#CA922B] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#2B1507] text-sm">{r.name}</p>
                      <p className="text-xs text-[#3A1F0E]/60">{r.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Search */}
            <div className="flex gap-2 mb-4">
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="City or ZIP code"
                className="flex-1 border border-[#E8DDD0] rounded-xl px-4 py-3 text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]" />
              <button onClick={searchMeetings} disabled={searching}
                className="px-5 py-3 bg-[#CA922B] text-white rounded-xl font-bold hover:bg-[#b07e24] disabled:opacity-50 transition-colors">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </button>
            </div>
            {/* Type filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
              {MEETING_TYPES.map(type => (
                <button key={type} onClick={() => setMeetingType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${meetingType === type ? "bg-[#2B1507] text-white" : "bg-white text-[#3A1F0E] border border-[#E8DDD0] hover:bg-[#FAF6EF]"}`}>
                  {type}
                </button>
              ))}
            </div>

            {searching ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#CA922B]" /></div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-[#CA922B]/40 mx-auto mb-4" />
                <p className="text-[#3A1F0E]/60">Enter a city to find meetings near you.</p>
                <div className="mt-6 space-y-3">
                  {[
                    { name: "AA Meeting Finder", url: "https://www.aa.org/find-aa" },
                    { name: "NA Meeting Search", url: "https://www.na.org/meetingsearch/" },
                    { name: "SMART Recovery", url: "https://www.smartrecovery.org/community/calendar.php" },
                    { name: "In The Rooms (Online)", url: "https://www.intherooms.com" },
                  ].map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-[#E8DDD0] hover:shadow-md transition-all">
                      <span className="font-bold text-[#2B1507] text-sm">{r.name}</span>
                      <ExternalLink className="w-4 h-4 text-[#CA922B]" />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map((m, i) => (
                  <div key={m.id ?? i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8DDD0]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-[#2B1507]">{m.name}</h3>
                        <span className="text-xs text-[#CA922B] font-bold">{m.type}</span>
                      </div>
                      {m.format && <span className="text-xs px-2 py-1 bg-[#FAF6EF] text-[#3A1F0E]/60 rounded-full">{m.format}</span>}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-[#3A1F0E]/60">
                      {m.address && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {m.address}{m.city ? `, ${m.city}` : ""}{m.state ? `, ${m.state}` : ""}</p>}
                      {m.day && <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.day}{m.time ? ` at ${m.time}` : ""}</p>}
                    </div>
                    <div className="flex gap-2 mt-3">
                      {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-[#CA922B] text-white rounded-full font-bold">Visit</a>}
                      {m.phone && <a href={`tel:${m.phone}`} className="text-xs px-3 py-1.5 bg-[#FAF6EF] text-[#2B1507] border border-[#E8DDD0] rounded-full font-bold">Call</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
