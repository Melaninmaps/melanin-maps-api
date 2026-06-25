import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Star, ArrowRight } from "lucide-react";

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

export default function Features() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="bg-[#FAF6EF] py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Platform Features</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#3A1F0E] mb-6 leading-tight">
            Everything You Need.<br />Nothing You Don't.
          </h1>
          <p className="text-xl text-[#3A1F0E]/70 max-w-2xl mx-auto leading-relaxed">
            Six pillars that set Mapping with Melanin™ apart from every other platform on the market.
          </p>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Real-Time Safety Alerts",
                desc: "Receive real-time alerts about incidents, travel disruptions, weather events, public safety concerns, and community-reported conditions that may impact your journey.",
                bullets: ["Real-time notifications", "Community safety reports", "Travel disruption alerts", "Location-based warnings", "Emergency resource information"],
                label: "Key Differentiator"
              },
              {
                title: "Community Safety Intelligence",
                desc: "Access insights from community members who share experiences, recommendations, and observations that help others travel more confidently.",
                bullets: ["Neighborhood insights", "Local recommendations", "Community ratings", "Traveler experiences", "Trusted perspectives"],
                label: "Powered By Real Experiences"
              },
              {
                title: "Community Confidence Ratings",
                desc: "Discover businesses, destinations, events, and community spaces recommended by people who value inclusion, hospitality, and positive experiences.",
                bullets: ["Inclusivity ratings", "Welcoming venues", "Community-vetted spaces", "Cultural landmarks", "Community-recommended destinations"],
                label: "Find Places Where You Feel Welcome"
              },
              {
                title: "Verified Business Directory",
                desc: "Connect with verified businesses, service providers, and entrepreneurs while exploring new cities and communities.",
                bullets: ["Business verification", "Customer reviews", "Community recommendations", "Featured local businesses", "Direct contact info"],
                label: "Support Trusted Businesses"
              },
              {
                title: "Smart Trip Planning",
                desc: "Combine destination discovery with safety insights, local recommendations, events, and community intelligence for every trip.",
                bullets: ["Integrated safety data", "Local event discovery", "Community itineraries", "Destination scores", "Personalized suggestions"],
                label: "Plan With More Than Just Maps"
              },
              {
                title: "Emergency Resource Hub",
                desc: "Quick access to emergency contacts, nearby hospitals, urgent care centers, emergency services, transportation resources, and support services.",
                bullets: ["Emergency contacts", "Nearby hospitals", "Urgent care locator", "Transportation resources", "Support services"],
                label: "Help When You Need It Most · Key Differentiator"
              }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5 flex flex-col">
                <div className="text-xs font-bold tracking-widest text-[#CA922B] uppercase mb-4">{f.label}</div>
                <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-3">{f.title}</h3>
                <p className="text-[#3A1F0E]/70 text-sm leading-relaxed mb-6 flex-1">{f.desc}</p>
                <ul className="space-y-2 text-sm text-[#3A1F0E]/60 border-t border-[#3A1F0E]/5 pt-4">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#CA922B] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromBg="#FAF6EF" toBg="#2B1507" />

      {/* KinfolkAI */}
      <section className="py-24 bg-[#2B1507] overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #CA922B 0%, transparent 60%)" }} />
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
                <Sparkles className="w-3 h-3 text-[#CA922B]" />
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">KinfolkAI™ — Exclusive Feature</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">
                Your AI travel guide that actually knows the culture.
              </h2>
              <p className="text-[#F5EBD8]/70 text-lg mb-8 leading-relaxed">
                Ask KinfolkAI where to eat, stay, explore, and how to stay safe — and get recommendations shaped by your tastes, your budget, and the real community behind each city.
              </p>
              <div className="space-y-3 mb-10">
                {[
                  "Plan a full weekend itinerary with minority-owned spots only",
                  "Get neighborhood safety scores before you arrive",
                  "Discover hidden gems your family will actually love",
                  "Personalized to your vibe, budget & dietary needs",
                ].map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#CA922B]/20 border border-[#CA922B]/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#CA922B]" />
                    </div>
                    <span className="text-[#F5EBD8]/80 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/travel">
                <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold px-8 h-12 text-base">
                  Chat with KinfolkAI <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-8 h-8 rounded-full bg-[#CA922B] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">KinfolkAI™</div>
                    <div className="text-[#F5EBD8]/40 text-xs">Your cultural travel companion</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-[#CA922B]/20 border border-[#CA922B]/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                      <p className="text-[#F5EBD8] text-sm">"Plan me a minority-owned food crawl in Atlanta this Saturday — soul food and brunch spots, under $30 a person"</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] space-y-2">
                      <p className="text-[#F5EBD8] text-sm font-medium">Here's your Saturday crawl, kin! 🙌🏾</p>
                      <p className="text-[#F5EBD8]/70 text-xs leading-relaxed">
                        <span className="text-[#CA922B] font-bold">11am</span> — Busy Bee Cafe (West End) — iconic soul food, cash-only, go early<br />
                        <span className="text-[#CA922B] font-bold">1:30pm</span> — Slutty Vegan on Edgewood — plant-based, huge energy, Black-founded<br />
                        <span className="text-[#CA922B] font-bold">Safety note:</span> all spots rated 4.5+ by the community ✓
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-[#F5EBD8]/30 text-xs">Navigator+ members get full KinfolkAI access with saved trips & personalization</p>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fromBg="#2B1507" toBg="white" />

      {/* Comparison Table */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#3A1F0E] mb-4">Why Mapping with Melanin™ — The Platform Others Can't Match</h2>
            <p className="text-lg text-[#3A1F0E]/70">See exactly what sets us apart from those other apps.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-6 bg-[#FAF6EF] font-bold text-[#3A1F0E] rounded-tl-xl border-b border-[#3A1F0E]/10">Feature</th>
                  <th className="py-4 px-6 bg-[#FAF6EF] font-bold text-[#3A1F0E] text-center border-b border-[#3A1F0E]/10">Traditional Apps</th>
                  <th className="py-4 px-6 bg-[#2B1507] font-bold text-white text-center rounded-tr-xl border-b border-[#2B1507]">Mapping with Melanin™</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A1F0E]/10">
                {[
                  { f: "Navigation", t: "✓", m: "✓" },
                  { f: "Business Discovery", t: "✓", m: "✓" },
                  { f: "Community Reviews", t: "✓", m: "✓" },
                  { f: "Real-Time Safety Alerts", t: "Limited", m: "✓" },
                  { f: "Community Safety Insights", t: "✗", m: "✓" },
                  { f: "Community Confidence Ratings", t: "✗", m: "✓" },
                  { f: "Verified Business Network", t: "Limited", m: "✓" },
                  { f: "Emergency Resources", t: "✗", m: "✓" },
                  { f: "Cultural Discovery", t: "Limited", m: "✓" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#FAF6EF]/50">
                    <td className="py-4 px-6 font-medium text-[#3A1F0E]">{row.f}</td>
                    <td className="py-4 px-6 text-center text-[#3A1F0E]/60">{row.t}</td>
                    <td className="py-4 px-6 text-center text-[#CA922B] font-bold bg-[#FAF6EF]/30">{row.m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <WaveDivider fromBg="white" toBg="#FAF6EF" flip />

      {/* Community Score Explainer */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">OUR STRONGEST DIFFERENTIATOR</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">How Community Scores Work</h2>
              <p className="text-lg text-[#3A1F0E]/70 mb-10">
                A 96/100 Community Score isn't a star rating — it's a composite signal built from six layers of real community data. Google Maps doesn't have it. TripAdvisor doesn't have it. Yelp doesn't have it.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Safety Ratings", desc: "Members rate how safe they felt at every location they visit." },
                  { title: "Recommendation Rate", desc: "The percentage of visitors who would recommend this place to others in the community." },
                  { title: "Would Return Alone %", desc: "A unique metric — would a solo traveler feel comfortable returning unaccompanied?" },
                  { title: "Verified Reviews", desc: "Reviews from authenticated community members carry more weight." },
                  { title: "Community Engagement", desc: "Active, responsive businesses and frequently-visited locations score higher." },
                  { title: "Recent Activity", desc: "Scores reflect current conditions, not just historical data." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0 mt-1">
                      <Star className="w-4 h-4 text-[#CA922B]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#3A1F0E]">{item.title}</h4>
                      <p className="text-sm text-[#3A1F0E]/70 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/safety">
                <Button className="mt-8 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">See Scores in Action</Button>
              </Link>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-[#3A1F0E]/5">
              <div className="text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-widest mb-4">Live Example</div>
              <div className="bg-[#2B1507] rounded-2xl p-6 text-white mb-6">
                <div className="text-3xl font-serif font-bold mb-1">The Gathering Table</div>
                <div className="text-[#F5EBD8]/70 text-sm mb-6">Restaurant · Atlanta, GA</div>
                <div className="flex items-end gap-4 mb-2">
                  <div className="text-6xl font-bold text-[#CA922B] leading-none">96</div>
                  <div className="text-xl font-serif text-[#F5EBD8]/80 pb-1">/100</div>
                </div>
                <div className="text-sm font-bold tracking-widest uppercase text-[#F5EBD8]/50">Community Score</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-[#3A1F0E]/5">
                  <span className="text-[#3A1F0E]/70 font-medium">Recommend</span>
                  <span className="font-bold text-[#3A1F0E]">97%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#3A1F0E]/5">
                  <span className="text-[#3A1F0E]/70 font-medium">Return Alone</span>
                  <span className="font-bold text-[#3A1F0E]">94%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#3A1F0E]/5">
                  <span className="text-[#3A1F0E]/70 font-medium">Safety Rating</span>
                  <span className="font-bold text-[#3A1F0E] flex items-center gap-1">4.9/5 <Star className="w-4 h-4 text-[#CA922B] fill-current" /></span>
                </div>
                <div className="flex flex-wrap gap-2 pt-4">
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">✓ Yes Verified</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">🛡️ Community Trusted</span>
                  <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full">⭐ Highly Recommended</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <OrnamentDivider bg="#FAF6EF" light />

      {/* Safety Intelligence */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 rounded-3xl text-white relative overflow-hidden h-full flex flex-col justify-end min-h-[480px]">
              <img
                src="https://images.pexels.com/photos/1820978/pexels-photo-1820978.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Young woman exploring the city confidently"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507]/90 via-[#2B1507]/30 to-transparent" />
              <div className="relative z-10 p-8">
                <div className="inline-block bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-left w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-bold text-lg text-white">All Clear</span>
                  </div>
                  <div className="text-sm text-[#F5EBD8]/80 mb-4">Atlanta, GA</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#CA922B]/20 text-[#CA922B] text-xs font-bold px-2 py-1 rounded">4.9 Community Trust Score</span>
                    <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded">Community Intelligence</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">SAFETY INTELLIGENCE</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Know Before You Go. Every Time.</h2>
              <p className="text-lg text-[#3A1F0E]/70 mb-10">
                Most travel apps focus on where to go. Mapping with Melanin™ focuses on helping you make informed decisions before you arrive. Community-driven safety intelligence means real people sharing real experiences.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Real-Time Safety Alerts", desc: "Incidents, disruptions, and community-reported conditions delivered instantly" },
                  { title: "Community Safety Scores", desc: "Aggregated ratings for neighborhoods, cities, and destinations" },
                  { title: "Verified Member Program", desc: "Trusted interactions with authenticated members through anti-fraud protection" },
                  { title: "Emergency Resource Hub", desc: "Hospitals, urgent care, emergency services, and support services — one tap away" }
                ].map((item, i) => (
                  <div key={i}>
                    <h4 className="font-bold text-[#3A1F0E] text-lg">{item.title}</h4>
                    <p className="text-[#3A1F0E]/70">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/safety">
                <Button className="mt-10 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Explore Safety Features</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fromBg="#FAF6EF" toBg="#2B1507" flip />

      {/* Built for Every Part */}
      <section className="py-24 bg-[#2B1507] text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">PLATFORM PREVIEW</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Built for Every Part of Your Journey.</h2>
            <p className="text-lg text-[#F5EBD8]/70 max-w-3xl mx-auto">
              From discovery to safety to community — Mapping with Melanin™ is a complete platform, not just a map.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { title: "Discover", label: "Find Minority-Owned Businesses", desc: "Search by city, category, or keyword. Every listing is community-verified.", link: "/businesses" },
              { title: "Safety", label: "Real-Time Safety Intelligence", desc: "Community-sourced scores, alerts, and the 'Would Return Alone' metric.", link: "/safety" },
              { title: "Personalized", label: "Your Curated Feed", desc: "AI-powered picks based on your identity, interests, and travel goals.", link: "/travel" },
              { title: "Community", label: "Connect & Network", desc: "Join groups, attend meetups, and build relationships before you arrive.", link: "/community" }
            ].map((c, i) => (
              <Link key={i} href={c.link}>
                <div className="bg-white/5 border border-white/10 hover:border-[#CA922B]/40 p-8 rounded-2xl flex items-start gap-4 cursor-pointer transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-[#CA922B] font-serif">{i + 1}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-[#CA922B] mb-1">{c.title}</div>
                    <h4 className="font-bold text-white text-lg mb-2">{c.label}</h4>
                    <p className="text-[#F5EBD8]/60 text-sm">{c.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#CA922B] shrink-0 ml-auto self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/explore">
              <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12 font-bold">
                Explore the Platform <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
