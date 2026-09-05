import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, Phone, MessageCircle, Heart, MapPin, Search, Shield, AlertCircle } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

interface Resource {
  name: string;
  desc: string;
  action: string;
  url: string;
  isPhone?: boolean;
  isText?: boolean;
}

interface CanonicalResource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  sourceTier: string;
  organization: string | null;
  url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  isNational: boolean;
}

const CRISIS: Resource[] = [
  { name: "988 Suicide & Crisis Lifeline", desc: "Free, confidential crisis support. Call or text 988, 24/7. Español disponible.", action: "Call or Text 988", url: "tel:988", isPhone: true },
  { name: "Crisis Text Line", desc: "Text HOME to 741741 — free, 24/7 text-based crisis support.", action: "Text HOME to 741741", url: "sms:741741", isText: true },
  { name: "Veterans Crisis Line", desc: "Free, confidential crisis support for veterans and their families, 24/7. Call 988 and press 1.", action: "Call 988 → Press 1", url: "tel:988", isPhone: true },
  { name: "SAMHSA National Helpline", desc: "Free, confidential treatment referrals and information for mental health and substance use, 24/7.", action: "Call 1-800-662-4357", url: "tel:18006624357", isPhone: true },
  { name: "National Domestic Violence Hotline", desc: "Free, confidential support for survivors of domestic violence, 24/7.", action: "Call 1-800-799-7233", url: "tel:18007997233", isPhone: true },
];

const MENTAL_HEALTH: Resource[] = [
  { name: "Black Mental Health Alliance", desc: "Mental health education, advocacy, and a therapist directory designed for Black communities.", action: "Visit Site", url: "https://blackmentalhealth.com" },
  { name: "Therapy for Black Girls", desc: "An online space dedicated to encouraging the mental wellness of Black women and girls.", action: "Visit Site", url: "https://therapyforblackgirls.com" },
  { name: "Therapy for Black Men", desc: "Connecting Black men to culturally-competent therapists and mental health resources.", action: "Visit Site", url: "https://therapyforblackmen.org" },
  { name: "Boris Lawrence Henson Foundation", desc: "Mental health awareness, stigma reduction, and support services for the African American community.", action: "Visit Site", url: "https://borislhensonfoundation.org" },
  { name: "Loveland Foundation", desc: "Therapy vouchers and financial assistance specifically for Black women and girls.", action: "Visit Site", url: "https://thelovelandfoundation.org" },
  { name: "Melanin & Mental Health", desc: "Culturally-responsive therapist directory and mental wellness community for people of color.", action: "Visit Site", url: "https://melaninandmentalhealth.com" },
];

const RECOVERY: Resource[] = [
  { name: "AA Meeting Finder", desc: "Find Alcoholics Anonymous meetings near you across the United States and internationally.", action: "Find Meetings Near You", url: "https://www.aa.org/find-aa" },
  { name: "NA Meeting Search", desc: "Find Narcotics Anonymous meetings in your area — online and in-person.", action: "Find Meetings Near You", url: "https://www.na.org/meetingsearch/" },
  { name: "Meeting Guide", desc: "App and web search for 150,000+ AA meetings worldwide, updated in real time.", action: "Visit Site", url: "https://meetingguide.org" },
  { name: "SMART Recovery", desc: "Science-based addiction recovery meetings using proven tools — for any substance or behavior.", action: "Find Meetings", url: "https://www.smartrecovery.org/community/calendar.php" },
  { name: "In The Rooms", desc: "Free online recovery meetings for AA, NA, and 100+ other recovery programs.", action: "Visit Site", url: "https://www.intherooms.com" },
];

const TREATMENT: Resource[] = [
  { name: "SAMHSA Treatment Locator", desc: "Find substance use and mental health treatment facilities near you — searchable by ZIP code.", action: "Find Treatment", url: "https://findtreatment.gov" },
  { name: "NAMI HelpLine", desc: "Free mental health information, resource referrals, and peer support. Mon–Fri 10am–10pm ET.", action: "Call 1-800-950-6264", url: "tel:18009506264", isPhone: true },
  { name: "Open Path Collective", desc: "Affordable in-person and online therapy sessions ($30–$80) with licensed therapists.", action: "Find a Therapist", url: "https://openpathcollective.org" },
  { name: "Psychology Today Therapist Finder", desc: "Filter therapists by specialty, insurance, and race/ethnicity to find the right fit.", action: "Find a Therapist", url: "https://www.psychologytoday.com/us/therapists" },
  { name: "Inclusive Therapists", desc: "A safer, healing-centered space to find culturally-responsive therapists for BIPOC communities.", action: "Visit Site", url: "https://www.inclusivetherapists.com" },
];

interface SectionConfig {
  title: string;
  subtitle: string;
  accent: string;
  bg: string;
  icon: ReactNode;
  data: Resource[];
}

function ResourceCard({ r }: { r: Resource }) {
  const isCallable = r.isPhone || r.isText;
  return (
    <div className="bg-white rounded-xl border border-[#E8D9C0] p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div>
        <h3 className="font-bold text-[#2B1507] text-base leading-snug">{r.name}</h3>
        <p className="text-sm text-[#3A1F0E]/70 mt-1 leading-relaxed">{r.desc}</p>
      </div>
      <a
        href={r.url}
        className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2B1507] text-white text-sm font-semibold hover:bg-[#3D2210] transition-colors"
      >
        {r.isPhone ? <Phone className="w-3.5 h-3.5" /> : r.isText ? <MessageCircle className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
        {r.action}
      </a>
    </div>
  );
}

const SECTIONS: SectionConfig[] = [
  {
    title: "Crisis & Emergency",
    subtitle: "Immediate help — available 24 hours a day, 7 days a week",
    accent: "#DC2626",
    bg: "bg-red-50",
    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    data: CRISIS,
  },
  {
    title: "Black Mental Health",
    subtitle: "Resources built by and for our community",
    accent: "#7B2D8B",
    bg: "bg-purple-50",
    icon: <Heart className="w-5 h-5 text-purple-700" />,
    data: MENTAL_HEALTH,
  },
  {
    title: "NA & AA Meeting Locators",
    subtitle: "Find recovery meetings near you — in person and online",
    accent: "#1D4ED8",
    bg: "bg-blue-50",
    icon: <MapPin className="w-5 h-5 text-blue-700" />,
    data: RECOVERY,
  },
  {
    title: "Find a Therapist or Treatment",
    subtitle: "Therapists, counselors, and treatment centers near you",
    accent: "#CA922B",
    bg: "bg-amber-50",
    icon: <Search className="w-5 h-5 text-amber-700" />,
    data: TREATMENT,
  },
];

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [resources, setResources] = useState<CanonicalResource[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResources = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: "50", offset: "0" });
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (city.trim()) params.set("city", city.trim());
    if (state.trim()) params.set("state", state.trim());
    try {
      const response = await authenticatedFetch(`${BASE}api/resources?${params}`);
      if (!response.ok) throw new Error("Resources could not be loaded.");
      const data = await response.json() as { resources: CanonicalResource[]; total: number };
      setResources(data.resources);
      setTotal(data.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Resources could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadResources(); }, 200);
    return () => window.clearTimeout(timer);
  }, [searchQuery, city, state]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-20 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-community-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/85 z-0" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-8">
            <Shield className="w-4 h-4 text-[#CA922B]" />
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Community Resources</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-5 leading-tight max-w-3xl">
            You Are Not Alone.
          </h1>
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-2xl mb-8 font-light">
            Crisis lines, Black mental health resources, NA & AA meeting finders, and affordable therapy — all in one place, for our community.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 w-full max-w-sm md:max-w-none">
            {[
              { label: "Crisis Lines", value: "24/7" },
              { label: "Mental Health Orgs", value: "6" },
              { label: "Meeting Finders", value: "5" },
              { label: "Therapy Resources", value: "5" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">{s.value}</div>
                <div className="text-sm text-[#F5EBD8]/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crisis Banner */}
      <div className="bg-red-700 text-white py-4 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">
            In immediate danger? Call <a href="tel:911" className="underline font-bold">911</a>. &nbsp;
            Mental health crisis? Call or text <a href="tel:988" className="underline font-bold">988</a> — free and confidential, 24/7.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="container mx-auto px-4 md:px-6 py-16 flex flex-col gap-16">
        <section>
          <div className="mb-6">
            <h2 className="font-serif text-3xl font-bold text-[#2B1507]">Search Community Resources</h2>
            <p className="mt-2 text-[#3A1F0E]/70">Training, housing, business support, jobs, safety, and other reviewed resources stay separate from business listings.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-[#D7C3A6] bg-white p-4">
            <label className="md:col-span-2">
              <span className="block text-xs font-bold uppercase tracking-wide text-[#3A1F0E]/70 mb-1.5">What do you need?</span>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-[#6E5A48]" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="HVAC training, housing help, grants…" className="w-full rounded-xl border border-[#7B6048]/45 bg-white py-2.5 pl-9 pr-3 text-sm text-[#2B1507] placeholder:text-[#6E5A48]/65 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40" />
              </div>
            </label>
            <label>
              <span className="block text-xs font-bold uppercase tracking-wide text-[#3A1F0E]/70 mb-1.5">City</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Phoenix" className="w-full rounded-xl border border-[#7B6048]/45 bg-white px-3 py-2.5 text-sm text-[#2B1507] placeholder:text-[#6E5A48]/65 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40" />
            </label>
            <label>
              <span className="block text-xs font-bold uppercase tracking-wide text-[#3A1F0E]/70 mb-1.5">State</span>
              <input value={state} onChange={(event) => setState(event.target.value)} placeholder="AZ" className="w-full rounded-xl border border-[#7B6048]/45 bg-white px-3 py-2.5 text-sm text-[#2B1507] placeholder:text-[#6E5A48]/65 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40" />
            </label>
          </div>
          <p className="mt-3 text-sm text-[#3A1F0E]/60">{total.toLocaleString()} reviewed resource{total === 1 ? "" : "s"}</p>
          {loading ? (
            <div className="py-10 text-center text-[#3A1F0E]/60">Loading reviewed resources…</div>
          ) : error ? (
            <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}</div>
          ) : resources.length === 0 ? (
            <div className="mt-4 rounded-xl border border-[#D7C3A6] bg-[#FFFDF9] p-8 text-center">
              <p className="font-semibold text-[#2B1507]">No reviewed resource matches yet.</p>
              <p className="mt-1 text-sm text-[#3A1F0E]/65">We will not show an unreviewed resource as a business just to fill the result.</p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource) => (
                <article key={resource.id} className="rounded-xl border border-[#D7C3A6] bg-white p-5 flex flex-col gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-900">Community resource</span>
                      <span className="rounded-full bg-[#F2E8D8] px-2.5 py-1 text-xs font-semibold text-[#5B3A1F]">{resource.subcategory ?? resource.category.replace(/_/g, " ")}</span>
                    </div>
                    <h3 className="font-bold text-[#2B1507]">{resource.title}</h3>
                    {resource.organization && <p className="mt-1 text-sm font-medium text-[#6E4A25]">{resource.organization}</p>}
                    {resource.description && <p className="mt-2 text-sm leading-relaxed text-[#3A1F0E]/70">{resource.description}</p>}
                    {(resource.city || resource.state) && <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#3A1F0E]/60"><MapPin className="w-3.5 h-3.5" /> {[resource.city, resource.state].filter(Boolean).join(", ")}</p>}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {resource.url && <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#2B1507] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3D2210]"><ExternalLink className="w-3.5 h-3.5" /> Learn more</a>}
                    {resource.phone && <a href={`tel:${resource.phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#2B1507] px-4 py-2 text-sm font-semibold text-[#2B1507]"><Phone className="w-3.5 h-3.5" /> Call</a>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {SECTIONS.map((section) => (
          <section key={section.title}>
            <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${section.bg} mb-6`}>
              {section.icon}
              <div>
                <span className="font-bold text-[#2B1507] text-lg">{section.title}</span>
                <span className="hidden sm:inline text-[#3A1F0E]/60 text-sm ml-2">— {section.subtitle}</span>
              </div>
            </div>
            <p className="sm:hidden text-sm text-[#3A1F0E]/60 mb-4">{section.subtitle}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.data.map((r) => (
                <ResourceCard key={r.name} r={r} />
              ))}
            </div>
          </section>
        ))}

        {/* Submit a resource */}
        <div className="bg-[#2B1507] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-serif font-bold text-white mb-3">Know a resource we're missing?</h2>
          <p className="text-[#F5EBD8]/75 mb-6 max-w-xl mx-auto">
            This list is community-curated. If there's a crisis line, therapist directory, or recovery resource that should be here, let us know.
          </p>
          <a
            href="mailto:hello@mappingwithmelanin.com?subject=Resource%20Suggestion"
            className="inline-flex items-center gap-2 bg-[#CA922B] text-white font-bold px-8 py-3 rounded-full hover:bg-[#B8822A] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Suggest a Resource
          </a>
        </div>
      </div>
    </div>
  );
}
