import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Search, Calendar, MapPin, Sparkles, Bell, ArrowRight, Check, Users, Navigation, Compass, Star } from "lucide-react";
import { useListBusinesses } from "@workspace/api-client-react";

export default function Home() {
  const { data: businessesData, isLoading } = useListBusinesses({ limit: 3 });

  return (
    <div className="flex flex-col w-full bg-[#FAF6EF]">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] md:min-h-[85vh] flex items-center justify-center pt-20 pb-32 overflow-hidden bg-[#2B1507]">
        <img src={`${import.meta.env.BASE_URL}images/hero-home-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/88 z-0" />
        
        <div className="relative z-10 container mx-auto px-4 md:px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-8 animate-fade-in-up">
            <Shield className="w-3 h-3 text-[#CA922B]" />
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">SAFETY-FIRST COMMUNITY INTELLIGENCE</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 leading-tight max-w-5xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Map Your Life.<br />
            <span style={{ color: '#CA922B' }}>Connect Deeper.</span><br />
            Live With Purpose.
          </h1>

          <p className="text-lg md:text-xl text-[#F5EBD8] mb-4 max-w-3xl animate-fade-in-up font-light" style={{ animationDelay: '200ms' }}>
            Mapping with Melanin™ connects people to trusted businesses, meaningful relationships, thriving communities, and new opportunities through the power of shared experiences and community-driven insights.
          </p>
          <p className="text-sm md:text-base text-[#F5EBD8]/70 mb-12 max-w-2xl animate-fade-in-up font-light" style={{ animationDelay: '250ms' }}>
            Most platforms tell you where to go. We help you understand what's really there — and direct your dollars to businesses that reflect your culture and community.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in-up max-w-4xl" style={{ animationDelay: '300ms' }}>
            {[
              "Find Businesses", "Discover Events", "Join Groups", "Network Professionally", 
              "Find Travel Partners", "Safety Intelligence", "Real-Time Alerts", "AI Recommendations"
            ].map((label, idx) => (
              <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 border border-white/10 text-[#F5EBD8] text-sm">
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Waitlist Form */}
          <div className="w-full max-w-xl bg-[#2B1507]/80 p-8 rounded-2xl border border-white/10 text-left backdrop-blur-md animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-2xl font-serif font-bold text-white mb-4">Join the Waitlist</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#F5EBD8] mb-1">What city and state are you from?</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/30" placeholder="e.g. Atlanta, GA" />
                <p className="text-xs text-[#F5EBD8]/50 mt-1">We're testing in select locations first.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#F5EBD8] mb-2">Are you a business owner?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-[#F5EBD8] text-sm cursor-pointer">
                    <input type="radio" name="owner" className="accent-[#CA922B]" /> Yes, I own a business
                  </label>
                  <label className="flex items-center gap-2 text-[#F5EBD8] text-sm cursor-pointer">
                    <input type="radio" name="owner" className="accent-[#CA922B]" /> No, I'm a community member
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#F5EBD8] mb-1">Know someone? Refer them:</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/30" placeholder="Referral code or email" />
              </div>
              <div className="pt-2">
                <Button className="w-full h-12 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold">
                  Free to join. No spam, ever.
                </Button>
                <div className="text-center mt-3">
                  <a href="#" className="text-sm text-[#CA922B] hover:underline">Spread the word</a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 animate-bounce text-[#F5EBD8]/50">
            <ArrowRight className="w-6 h-6 rotate-90" />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-[#3A1F0E] py-8 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">10K+ Community Members</div>
              <div className="text-sm text-[#F5EBD8]/70">And growing every day</div>
            </div>
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">200+ Cities Covered</div>
              <div className="text-sm text-[#F5EBD8]/70">Across the US and beyond</div>
            </div>
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">96/100 Avg. Confidence Score</div>
              <div className="text-sm text-[#F5EBD8]/70">For top-rated destinations</div>
            </div>
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">100% Community-Sourced</div>
              <div className="text-sm text-[#F5EBD8]/70">Every insight, every review</div>
            </div>
          </div>
        </div>
      </section>

      {/* "More Than a Travel App" */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">More Than a Travel App</h2>
          <p className="text-lg md:text-xl text-[#3A1F0E]/80 leading-relaxed">
            Mapping with Melanin™ helps you map your life — exposing you to the real culture within your local and global communities so you can make conscious decisions on where you live, where you buy, and where you travel, while keeping Black dollars circulating within Black communities.
          </p>
        </div>
      </section>

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
              <p>Mapping with Melanin™ is a community-powered platform that helps people discover trusted businesses, meaningful connections, welcoming communities, and new opportunities. Through shared experiences, local insights, and technology-driven discovery, we empower individuals to make informed decisions about where they live, work, travel, and thrive. Our mission is to foster connection, economic empowerment, and belonging by helping people navigate the world with greater confidence and community support.</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5 shadow-sm">
              <p className="text-xl font-serif text-[#3A1F0E] leading-relaxed italic">"Every dollar you spend is a vote. We make it easy to cast that vote for Minority-owned businesses, melanated entrepreneurs, and community-rooted spaces that reinvest in the culture — so the economic power of the Black dollar stays where it belongs."</p>
            </div>
            <div className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5 shadow-sm">
              <p className="text-xl font-serif text-[#3A1F0E] leading-relaxed italic">"Every score, review, and recommendation on this platform comes from people who've actually been there. That's not a feature. That's the foundation."</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">THE PROBLEM</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">People Lack Trusted Information When It Matters Most.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Consumers are increasingly intentional about where they spend their money and how they engage with their communities — yet the trusted, values-aligned information they need to act on that intention simply doesn't exist in one place.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
              <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">Travel Destinations</h3>
              <p className="text-[#3A1F0E]/70">People don't know if a destination is truly welcoming, safe, or culturally aligned — until they're already there.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
              <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">Relocation Decisions</h3>
              <p className="text-[#3A1F0E]/70">Moving to a new city is one of life's biggest decisions. Yet there's no trusted community-sourced intelligence to guide it.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
              <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">Employers & Workplaces</h3>
              <p className="text-[#3A1F0E]/70">Individuals lack transparent, community-verified insight into whether an employer's culture actually reflects their values.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
              <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">Community Fit</h3>
              <p className="text-[#3A1F0E]/70">Finding your people — the businesses, neighborhoods, and networks that reflect your identity — shouldn't require luck.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">THE SOLUTION</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Mapping with Melanin™ Helps You Make Conscious Decisions.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Mapping with Melanin™ provides a trusted platform for discovering businesses, employers, destinations, and communities that align with your preferences, interests, and values — so every decision you make is an informed, intentional one.
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
              <div key={idx} className="bg-[#FAF6EF] p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
                <div className="w-12 h-12 rounded-full bg-white border border-[#CA922B]/20 flex items-center justify-center mb-6">
                  <Check className="w-6 h-6 text-[#CA922B]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-3">{item.title}</h3>
                <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            
            <div className="flex flex-wrap justify-center gap-3">
              {["Travel", "Relocation", "Social Networking", "Local Commerce", "Events", "Community Building"].map(topic => (
                <div key={topic} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                  {topic}
                </div>
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
              <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="text-[#CA922B] font-bold text-xs uppercase tracking-wider mb-2">{p.phase}</div>
                <h3 className="text-xl font-serif font-bold mb-4">{p.title}</h3>
                <p className="text-[#F5EBD8]/60 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#CA922B] italic">"Map Your World™ — Discover businesses, communities, opportunities, and experiences that help you thrive wherever you land."</h3>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">PLATFORM FEATURES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Everything You Need. Nothing You Don't.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Six pillars that set Mapping with Melanin™ apart from every other travel platform on the market.
            </p>
          </div>

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
                desc: "Quick access to emergency contacts, nearby hospitals, urgent care centers, law enforcement, transportation resources, and support services.",
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
                  { title: "Safety Ratings", desc: "Members rate how safe they felt at every location they visit. Scores are updated as new community feedback is submitted and reviewed." },
                  { title: "Recommendation Rate", desc: "The percentage of visitors who would recommend this place to others in the community." },
                  { title: "Would Return Alone %", desc: "A unique metric — would a solo traveler feel comfortable returning unaccompanied? One of many factors we weigh." },
                  { title: "Verified Reviews", desc: "Reviews from authenticated community members carry more weight. Verification reflects information submitted and reviewed according to our standards." },
                  { title: "Community Engagement", desc: "Active, responsive businesses and frequently-visited locations score higher — a signal of ongoing community trust." },
                  { title: "Recent Activity", desc: "Scores reflect current conditions, not just historical data. Rankings should be considered one of many factors when evaluating a destination." }
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
              <Button className="mt-8 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">See Scores in Action</Button>
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

      {/* Safety Intelligence */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 bg-[#2B1507] p-8 rounded-3xl text-white relative overflow-hidden h-full flex flex-col justify-center min-h-[400px]">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="relative z-10 text-center">
                <Shield className="w-16 h-16 text-[#CA922B] mx-auto mb-6" />
                <div className="inline-block bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="font-bold text-lg">All Clear</span>
                  </div>
                  <div className="text-sm text-[#F5EBD8]/80 mb-4">Atlanta, GA</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#CA922B]/20 text-[#CA922B] text-xs font-bold px-2 py-1 rounded">4.9 Community Trust Score</span>
                    <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded">10K+ Early Members</span>
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
                Most travel apps focus on where to go. Mapping with Melanin™ focuses on helping you make informed decisions before you arrive. Community-driven safety intelligence means real people sharing real experiences — so you always know what to expect.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "Real-Time Safety Alerts", desc: "Incidents, disruptions, and community-reported conditions delivered instantly" },
                  { title: "Community Safety Scores", desc: "Aggregated ratings for neighborhoods, cities, and destinations" },
                  { title: "Verified Member Program", desc: "Trusted interactions with authenticated members through liveness checks and anti-fraud protection" },
                  { title: "Emergency Resource Hub", desc: "Hospitals, urgent care, law enforcement, and support services — one tap away" }
                ].map((item, i) => (
                  <div key={i}>
                    <h4 className="font-bold text-[#3A1F0E] text-lg">{item.title}</h4>
                    <p className="text-[#3A1F0E]/70">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Button className="mt-10 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Explore Safety Features</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">COMMUNITY INTELLIGENCE</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">People Return Because They Contribute</h2>
          <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto mb-16">
            The most powerful feature of Mapping with Melanin™ is its community. Members don't just consume information — they create it, verify it, and share it so everyone travels better.
          </p>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 text-left mb-12">
            {[
              { title: "Community Reports", desc: "Report safety concerns, share positive experiences, recommend locations" },
              { title: "Local Ambassadors", desc: "City Ambassadors, Community Contributors, and Business Champions" },
              { title: "Safety Scores", desc: "Location confidence scores based on reports, ratings, and verified data" },
              { title: "Networking", desc: "Connect with professionals and entrepreneurs who share your values" },
              { title: "Local Meetups", desc: "Join events and gatherings in cities around the world" }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-[#3A1F0E]/5">
                <h4 className="font-bold text-[#3A1F0E] mb-2">{item.title}</h4>
                <p className="text-sm text-[#3A1F0E]/70">{item.desc}</p>
              </div>
            ))}
          </div>
          <Button className="rounded-full bg-[#2B1507] hover:bg-[#1a0c04] text-white px-8 h-12">Join the Community</Button>
        </div>
      </section>

      {/* Business Directory Preview */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">VERIFIED BUSINESS DIRECTORY</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Support Trusted Businesses</h2>
          <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto mb-4">
            Connect with verified Minority-owned businesses, service providers, and entrepreneurs — whether you're exploring a new city or finally discovering what's been in your own neighborhood all along.
          </p>
          <p className="text-[#3A1F0E]/70 max-w-3xl mx-auto mb-10">
            You don't have to travel far to keep your dollars in the community. Every listing is community-reviewed and authenticity-checked, because your dollars deserve to go where they're celebrated.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["Restaurants", "Hotels", "Attorneys", "Realtors", "Tour Operators", "Salons & Spas", "Retail Shops", "Financial Services", "Health & Wellness", "Entertainment"].map(cat => (
              <span key={cat} className="px-4 py-2 bg-[#FAF6EF] text-[#3A1F0E] rounded-full text-sm font-medium border border-[#3A1F0E]/10">{cat}</span>
            ))}
          </div>

          <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Explore All Businesses</Button>
        </div>
      </section>

      {/* Built for Every Part */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">PLATFORM PREVIEW</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Built for Every Part of Your Journey.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              From discovery to safety to community — Mapping with Melanin™ is a complete platform, not just a map.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { title: "Discover", label: "Find Minority-Owned Businesses", desc: "Search by city, category, or keyword. Every listing is community-verified." },
              { title: "Safety", label: "Real-Time Safety Intelligence", desc: "Community-sourced scores, alerts, and the 'Would Return Alone' metric." },
              { title: "Personalized", label: "Your Curated Feed", desc: "AI-powered picks based on your identity, interests, and travel goals." },
              { title: "Community", label: "Connect & Network", desc: "Join groups, attend meetups, and build relationships before you arrive." }
            ].map((c, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-[#CA922B] font-serif">{i+1}</span>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#CA922B] mb-1">{c.title}</div>
                  <h4 className="font-bold text-[#3A1F0E] text-lg mb-2">{c.label}</h4>
                  <p className="text-[#3A1F0E]/70 text-sm">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button className="rounded-full bg-[#2B1507] hover:bg-[#1a0c04] text-white px-8 h-12 mb-8">Explore the Platform</Button>
            <p className="text-xs text-[#3A1F0E]/50">* "Minority-owned business" is defined as any business that is 51% or more owned and operated by a Black person or persons.</p>
          </div>
        </div>
      </section>

      {/* Community Voices */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">COMMUNITY VOICES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">The Community Has Spoken.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Early members share why Mapping with Melanin™ is the platform they've been waiting for.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { 
                quote: "Finally a platform that actually understands what it means to travel while Black. The safety scores alone are worth it — I checked three cities before my last trip and felt genuinely prepared.",
                name: "Aaliyah T.", role: "Frequent Traveler", loc: "Atlanta, GA", initials: "AT"
              },
              { 
                quote: "I've been looking for something like this for years. Being able to find Minority-owned restaurants, hotels, and shops in cities I've never visited — and know they're community-verified — is a game changer.",
                name: "Marcus J.", role: "Digital Nomad", loc: "Houston, TX", initials: "MJ"
              },
              { 
                quote: "The relocation intelligence is what sold me. I was moving from Chicago to Charlotte and had no idea where to start. Mapping with Melanin gave me neighborhood insights I couldn't find anywhere else.",
                name: "Simone R.", role: "Relocating Professional", loc: "Charlotte, NC", initials: "SR"
              },
              { 
                quote: "As a business owner, being listed on this platform has been incredible. I've seen new customers specifically say they found me here because they wanted to support verified Minority-owned businesses.",
                name: "DeShawn M.", role: "Business Owner", loc: "New Orleans, LA", initials: "DM"
              }
            ].map((t, i) => (
              <div key={i} className="bg-[#FAF6EF] p-8 rounded-3xl border border-[#3A1F0E]/5">
                <div className="text-4xl font-serif text-[#CA922B] opacity-50 mb-4">"</div>
                <p className="text-[#3A1F0E]/80 text-lg italic leading-relaxed mb-8">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2B1507] text-[#F5EBD8] flex items-center justify-center font-serif font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-bold text-[#3A1F0E]">{t.name}</div>
                    <div className="text-sm text-[#3A1F0E]/60">{t.role} · {t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
