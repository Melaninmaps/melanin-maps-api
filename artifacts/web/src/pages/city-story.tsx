import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, MapPin, BookOpen, Users, Building2, Landmark, ExternalLink } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type CityStory = {
  slug: string;
  city: string;
  state: string;
  status: string;
  hasProfile: boolean;
  historicalContext: string | null;
  briefContext: string | null;
  whyMwmHere: string | null;
  heroImageUrl: string | null;
  keyNeighborhoods: string[] | null;
  keyFigures: string[] | null;
  migrationEra: string | null;
  culturalAnchors: string[] | null;
  counts: {
    businesses: number;
    culturalSites: number;
    communityStories: number;
  };
};

export default function CityStoryPage() {
  const [, params] = useRoute(`${BASE}cities/:slug/story`);
  const slug = params?.slug ?? "";
  const [story, setStory] = useState<CityStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const apiBase = BASE.replace(/\/$/, "");
    fetch(`${apiBase}/api/cities/${slug}/story`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: CityStory) => setStory(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="text-2xl font-bold text-[#3A1F0E]">City not found</h2>
        <p className="text-[#3A1F0E]/60">We don't have a story for this city yet.</p>
        <Link href={`${BASE}cities`} className="text-[#CA922B] font-semibold hover:underline">← Back to Cities</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#2B1507 0%,#3A1F0E 50%,#CA922B 100%)" }}>
        {story.heroImageUrl && (
          <img src={story.heroImageUrl} alt={story.city} className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          <Link href={`${BASE}cities`} className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> All Cities
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <MapPin size={18} className="text-[#CA922B]" />
            <span className="text-[#CA922B] font-semibold text-sm tracking-wide uppercase">{story.state}</span>
            {story.status === "live" && (
              <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Live</span>
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: "Georgia, serif" }}>
            {story.city}
          </h1>
          {story.briefContext && (
            <p className="text-white/80 text-lg leading-relaxed max-w-2xl">{story.briefContext}</p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-10">
            {[
              { icon: <Building2 size={16} />, label: "Businesses", val: story.counts.businesses },
              { icon: <Landmark size={16} />, label: "Cultural Sites", val: story.counts.culturalSites },
              { icon: <Users size={16} />, label: "Community Stories", val: story.counts.communityStories },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-white/80">
                <span className="text-[#CA922B]">{s.icon}</span>
                <span className="font-bold text-white">{s.val.toLocaleString()}</span>
                <span className="text-sm">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Historical context */}
        {story.historicalContext && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <BookOpen size={20} className="text-[#CA922B]" />
              <h2 className="text-xl font-bold text-[#3A1F0E]">Living Legacy</h2>
            </div>
            <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-7">
              <p className="text-[#3A1F0E]/80 leading-relaxed text-base whitespace-pre-wrap">{story.historicalContext}</p>
            </div>
          </section>
        )}

        {/* Why we're here */}
        {story.whyMwmHere && (
          <section>
            <h2 className="text-xl font-bold text-[#3A1F0E] mb-5">Why Mapping With Melanin Is Here</h2>
            <div className="bg-[#CA922B]/10 rounded-2xl border border-[#CA922B]/20 p-7">
              <p className="text-[#3A1F0E]/80 leading-relaxed text-base">{story.whyMwmHere}</p>
            </div>
          </section>
        )}

        {/* Migration era */}
        {story.migrationEra && (
          <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-6 flex gap-4">
            <div className="w-1 bg-[#CA922B] rounded-full shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#CA922B] uppercase tracking-wide mb-1">Migration Era</div>
              <p className="text-[#3A1F0E]/80 text-sm leading-relaxed">{story.migrationEra}</p>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Key neighborhoods */}
          {story.keyNeighborhoods && story.keyNeighborhoods.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-6">
              <h3 className="font-bold text-[#3A1F0E] mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-[#CA922B]" /> Key Neighborhoods
              </h3>
              <ul className="space-y-2">
                {story.keyNeighborhoods.map((n) => (
                  <li key={n} className="flex items-center gap-2 text-[#3A1F0E]/70 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#CA922B] shrink-0" />
                    {n}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Cultural anchors */}
          {story.culturalAnchors && story.culturalAnchors.length > 0 && (
            <section className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-6">
              <h3 className="font-bold text-[#3A1F0E] mb-4 flex items-center gap-2">
                <Landmark size={16} className="text-[#CA922B]" /> Cultural Anchors
              </h3>
              <ul className="space-y-2">
                {story.culturalAnchors.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-[#3A1F0E]/70 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#CA922B] shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Key figures */}
        {story.keyFigures && story.keyFigures.length > 0 && (
          <section>
            <h3 className="font-bold text-[#3A1F0E] mb-4 flex items-center gap-2">
              <Users size={16} className="text-[#CA922B]" /> Notable Figures
            </h3>
            <div className="flex flex-wrap gap-2">
              {story.keyFigures.map((f) => (
                <span key={f} className="bg-white border border-[#3A1F0E]/10 rounded-full px-4 py-1.5 text-sm text-[#3A1F0E]/70 font-medium">
                  {f}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* No profile fallback */}
        {!story.hasProfile && (
          <div className="bg-white rounded-2xl border border-[#3A1F0E]/10 p-10 text-center">
            <Landmark size={32} className="text-[#CA922B] mx-auto mb-4" />
            <h3 className="font-bold text-[#3A1F0E] text-lg mb-2">Story Coming Soon</h3>
            <p className="text-[#3A1F0E]/60 text-sm max-w-md mx-auto">
              We're building the Living Legacy profile for {story.city}. Check back soon — community members are helping us document the history of this city.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#3A1F0E] rounded-2xl p-8 text-center">
          <h3 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "Georgia, serif" }}>
            Explore {story.city} on the Map
          </h3>
          <p className="text-white/70 text-sm mb-6">
            Discover community businesses, cultural sites, HBCUs, and living heritage landmarks.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`${BASE}map`}
              className="inline-flex items-center gap-2 bg-[#CA922B] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#B8821E] transition-colors text-sm"
            >
              <MapPin size={16} /> View on Map
            </Link>
            <a
              href="https://apps.apple.com/app/id6743831308"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors text-sm"
            >
              <ExternalLink size={16} /> Download the App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
