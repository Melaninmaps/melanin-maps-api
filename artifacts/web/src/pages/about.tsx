import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { RotatingQuoteBanner } from "@/components/RotatingQuoteBanner";
import { useEffect } from "react";

function WaveDivider({ fromBg, toBg, flip = false }: { fromBg: string; toBg: string; flip?: boolean }) {
  const d = flip
    ? "M0,40 C360,10 1080,70 1440,30 L1440,80 L0,80 Z"
    : "M0,30 C360,70 1080,10 1440,50 L1440,80 L0,80 Z";
  return (
    <div style={{ backgroundColor: fromBg, display: "block", lineHeight: 0, fontSize: 0 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" style={{ display: "block", width: "100%", height: "80px" }} preserveAspectRatio="none">
        <path d={d} fill={toBg} />
      </svg>
    </div>
  );
}

function OrnamentDivider({ bg, light = false }: { bg: string; light?: boolean }) {
  const lineColor = light ? "rgba(202,146,43,0.2)" : "rgba(202,146,43,0.35)";
  const accentColor = light ? "rgba(202,146,43,0.5)" : "rgba(202,146,43,0.75)";
  const textColor = light ? "#3A1F0E" : "#F5EBD8";
  return (
    <div style={{ backgroundColor: bg, padding: "32px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", maxWidth: "480px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${lineColor})` }} />
        <span style={{ fontSize: "10px", fontFamily: "serif", letterSpacing: "0.35em", color: accentColor, fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>✦</span>
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.3em", color: textColor, opacity: 0.4, textTransform: "uppercase", whiteSpace: "nowrap" }}>Mapping With Melanin</span>
        <span style={{ fontSize: "10px", fontFamily: "serif", letterSpacing: "0.35em", color: accentColor, fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>✦</span>
        <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${lineColor})` }} />
      </div>
    </div>
  );
}

export default function About() {
  useEffect(() => {
    if (window.location.hash === "#mission") {
      const el = document.getElementById("mission");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Page Hero */}
      <section className="bg-[#2B1507] text-white py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Our Story</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight">
            More Than a Travel App
          </h1>
          <p className="text-xl text-[#F5EBD8]/80 max-w-2xl mx-auto leading-relaxed">
            Mapping with Melanin™ helps you map your life — exposing you to the real culture within your local and global communities so you can make conscious decisions on where you live, where you buy, and where you travel.
          </p>
          <a href="#mission" className="inline-flex items-center gap-2 mt-8 text-[#CA922B] text-sm font-semibold hover:opacity-80 transition-opacity">
            Our Mission & Vision <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <WaveDivider fromBg="#2B1507" toBg="#FAF6EF" />

      {/* ── Mission & Vision ── */}
      <section id="mission" className="bg-[#FAF6EF] py-20 px-4 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-4">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Why We Exist</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E]">
              Mission & Vision
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl border border-[#3A1F0E]/8">
            {/* Mission */}
            <div className="bg-[#2B1507] text-white px-10 py-14 flex flex-col gap-6">
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#CA922B] uppercase block mb-3">
                  ✦ Our Mission
                </span>
                <div className="w-10 h-0.5 bg-[#CA922B]/40 mb-6" />
              </div>
              <blockquote className="text-2xl md:text-3xl font-serif italic text-[#F5EBD8] leading-relaxed">
                "To foster connection, economic empowerment, and belonging — helping people navigate the world with greater confidence and community support."
              </blockquote>
              <p className="text-[#F5EBD8]/65 text-sm leading-relaxed mt-2">
                Every feature, every recommendation, and every community tool we build is in service of this: making it easier for Melanated and minority communities to move through the world with knowledge, pride, and power.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white px-10 py-14 flex flex-col gap-6">
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#CA922B] uppercase block mb-3">
                  ✦ Our Vision
                </span>
                <div className="w-10 h-0.5 bg-[#CA922B]/40 mb-6" />
              </div>
              <p className="text-2xl md:text-3xl font-serif text-[#3A1F0E] leading-relaxed">
                A world where the Melanated community navigates every dimension of life — where to live, work, travel, and spend — with trusted intelligence, cultural pride, and the economic power of a unified community behind every decision.
              </p>
              <p className="text-[#3A1F0E]/60 text-sm leading-relaxed mt-2">
                We are building the trusted infrastructure that connects conscious consumers to the businesses, employers, and communities that reflect who they are — at every stage of life, in every city, across the globe.
              </p>
            </div>
          </div>

          {/* Core values strip */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: "🤝", label: "Connection", sub: "Community over everything" },
              { emoji: "💰", label: "Economic Power", sub: "Keep dollars circulating" },
              { emoji: "🛡️", label: "Safety & Trust", sub: "Community-verified intel" },
              { emoji: "🌍", label: "Cultural Pride", sub: "Celebrate who we are" },
            ].map(({ emoji, label, sub }) => (
              <div key={label} className="text-center p-6 rounded-2xl bg-white border border-[#3A1F0E]/6 shadow-sm">
                <div className="text-3xl mb-3">{emoji}</div>
                <div className="text-sm font-bold text-[#3A1F0E] mb-1">{label}</div>
                <div className="text-xs text-[#3A1F0E]/55">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <OrnamentDivider bg="#FAF6EF" light />

      {/* Photo + Tagline */}
      <section className="py-0 bg-[#FAF6EF] overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-[420px]">
          <div className="relative h-72 lg:h-auto">
            <img
              src="https://images.pexels.com/photos/6579020/pexels-photo-6579020.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1"
              alt="Happy young African American couple sharing a joyful moment together"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#2B1507]/10" />
          </div>
          <div className="flex flex-col justify-center px-10 py-16 lg:py-20 bg-[#FAF6EF]">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">
              Keeping Minority dollars<br />where they belong.
            </h2>
            <p className="text-lg md:text-xl text-[#3A1F0E]/80 leading-relaxed">
              We empower individuals to make informed decisions about where they live, work, travel, and thrive — while circulating economic power within Minority communities.
            </p>
          </div>
        </div>
      </section>

      <OrnamentDivider bg="#FAF6EF" light />

      {/* Why We Built This */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">WHY WE BUILT THIS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Life Shouldn't Require Guesswork.</h2>
            <div className="space-y-6 text-lg text-[#3A1F0E]/80 text-left">
              <p>Finding welcoming businesses, trusted recommendations, cultural experiences, and reliable information shouldn't depend on luck — whether you're exploring a new city or navigating your own neighborhood.</p>
              <p>Consumers are increasingly intentional about where they spend their money and how they engage with their communities. Mapping with Melanin™ was built to meet that moment — providing a trusted platform for discovering businesses, employers, destinations, and communities that align with your preferences, interests, and values.</p>
              <p>Our mission is to foster connection, economic empowerment, and belonging by helping people navigate the world with greater confidence and community support.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5 shadow-sm">
              <p className="text-xl font-serif text-[#3A1F0E] leading-relaxed italic">"Every dollar you spend is a vote. We make it easy to cast that vote for Minority-owned businesses, melanated entrepreneurs, and community-rooted spaces that reinvest in the culture — so the economic power of the Minority dollar stays where it belongs."</p>
            </div>
            <div className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5 shadow-sm">
              <p className="text-xl font-serif text-[#3A1F0E] leading-relaxed italic">"Every score, review, and recommendation on this platform comes from people who've actually been there. That's not a feature. That's the foundation."</p>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fromBg="white" toBg="#FAF6EF" />

      <RotatingQuoteBanner variant="cream" />

      {/* The Problem */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">THE PROBLEM</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">People Lack Trusted Information When It Matters Most.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Consumers are increasingly intentional about where they spend their money — yet the trusted, values-aligned information they need simply doesn't exist in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Travel Destinations", desc: "People don't know if a destination is truly welcoming, safe, or culturally aligned — until they're already there." },
              { title: "Relocation Decisions", desc: "Moving to a new city is one of life's biggest decisions. Yet there's no trusted community-sourced intelligence to guide it." },
              { title: "Employers & Workplaces", desc: "Individuals lack transparent, community-verified insight into whether an employer's culture actually reflects their values." },
              { title: "Community Fit", desc: "Finding your people — the businesses, neighborhoods, and networks that reflect your identity — shouldn't require luck." },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
                <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">{item.title}</h3>
                <p className="text-[#3A1F0E]/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <OrnamentDivider bg="#FAF6EF" light />

      {/* The Solution */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">THE SOLUTION</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Mapping with Melanin™ Helps You Make Conscious Decisions.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              A trusted platform for discovering businesses, employers, destinations, and communities that align with your preferences, interests, and values — so every decision you make is informed and intentional.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Discover Places", desc: "Community-verified destinations, neighborhoods, and local gems — rated by people who've actually been there." },
              { title: "Evaluate Cities", desc: "Deep relocation intelligence: safety scores, community culture, cost of living context, and neighborhood fit." },
              { title: "Review Employers", desc: "Transparent employer profiles with community-sourced culture ratings, inclusion scores, and career opportunities." },
              { title: "Build Community", desc: "Find your people — connect with like-minded individuals who share your values, interests, and identity." },
              { title: "Connect Before You Arrive", desc: "Build relationships, join local groups, and get insider knowledge before you ever set foot in a new city." },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
                <div className="w-12 h-12 rounded-full bg-[#FAF6EF] border border-[#CA922B]/20 flex items-center justify-center mb-6">
                  <Check className="w-6 h-6 text-[#CA922B]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-3">{item.title}</h3>
                <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromBg="#FAF6EF" toBg="#2B1507" flip />

      {/* Future Vision */}
      <section className="py-24 bg-[#2B1507] text-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">FUTURE VISION</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">A Platform Built to Scale Across Every Dimension of Life.</h2>
            <p className="text-lg text-[#F5EBD8]/70 max-w-3xl mx-auto mb-10">
              As intentional spending and values-driven community engagement become the norm, Mapping with Melanin™ is positioned to be the trusted infrastructure that connects conscious consumers to the businesses, employers, and communities that reflect who they are — at every stage of life.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {["Travel", "Relocation", "Social Networking", "Local Commerce", "Events", "Community Building"].map(topic => (
                <div key={topic} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">{topic}</div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-16">
            {[
              { phase: "Phase 1", title: "Community Platform", desc: "Consumer subscriptions · Business memberships · Safety intelligence · Community reviews" },
              { phase: "Phase 2", title: "Commerce & Discovery", desc: "Sponsored recommendations · Featured business listings · Relocation services · Employer profiles" },
              { phase: "Phase 3", title: "Marketplace & Transactions", desc: "Marketplace sales tools · Travel bookings · Merchandise shops · Event ticketing" },
              { phase: "Phase 4", title: "Ecosystem & Scale", desc: "AI-powered recommendations · Enterprise partnerships · Business growth tools · Global expansion" }
            ].map((p, idx) => (
              <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="text-[#CA922B] font-bold text-xs uppercase tracking-wider mb-2">{p.phase}</div>
                <h3 className="text-xl font-serif font-bold mb-4">{p.title}</h3>
                <p className="text-[#F5EBD8]/60 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#CA922B] italic mb-10">"Map Your World™ — Discover businesses, communities, opportunities, and experiences that help you thrive wherever you land."</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/features">
                <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12 font-bold">
                  See Platform Features <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <a href="/#waitlist-form">
                <Button variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 px-8 h-12">
                  Join the Waitlist
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
