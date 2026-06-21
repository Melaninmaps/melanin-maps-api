import { Check } from "lucide-react";

export default function Roadmap() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-24 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-roadmap-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/88 z-0" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-8">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">PRODUCT ROADMAP</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl">
            Where We're Going.<br />
            <span className="text-[#CA922B] italic">How We'll Get There.</span>
          </h1>
          
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-3xl mb-16 font-light">
            Mapping with Melanin™ is building the trusted infrastructure for Black travel, commerce, and community — one phase at a time. Here's our post-launch roadmap, shaped by the community.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl">
            {[
              "10+ Features Live at Launch",
              "4 Development Phases",
              "30+ Planned Features",
              "∞ Community-Driven Additions"
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-center min-h-[120px] backdrop-blur-sm">
                <span className="text-white font-serif font-bold text-xl">{stat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Status Key */}
      <div className="bg-[#FAF6EF] border-b border-[#3A1F0E]/10 sticky top-20 z-40">
        <div className="container mx-auto px-4 py-4 flex flex-wrap justify-center gap-6 md:gap-12">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-sm font-bold text-[#3A1F0E]">Live</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-sm font-bold text-[#3A1F0E]">In Progress</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400" /><span className="text-sm font-bold text-[#3A1F0E]">Planned</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#2B1507]" /><span className="text-sm font-bold text-[#3A1F0E]">Future</span></div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-24 space-y-24">
        {/* Phase 1 */}
        <div className="relative pl-8 md:pl-0">
          <div className="md:text-center mb-12">
            <div className="flex flex-col md:items-center gap-4 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10">
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">PHASE 1</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3A1F0E]/20 bg-[#3A1F0E]/5">
                <span className="text-xs font-bold tracking-widest text-[#3A1F0E] uppercase">Launch</span>
              </div>
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-2">01 Foundation</h2>
            <p className="text-[#3A1F0E]/60 text-lg">Core platform live and community growing</p>
          </div>
          
          <div className="space-y-6">
            {[
              { s: "green", t: "Business Discovery Map", c: "Core", d: "Interactive map with Minority-owned business pins, search, and city shortcuts." },
              { s: "green", t: "Community Safety Scores", c: "Core", d: "Real-time safety intelligence, neighborhood scores, and the 'Would Return Alone' metric." },
              { s: "green", t: "Explore & Search", c: "Core", d: "Real-time search with category filters, sort, and SPA navigation to business listings." },
              { s: "green", t: "Personalized For You Feed", c: "Core", d: "AI-curated picks and itinerary generator based on onboarding identity, interests, and goals." },
              { s: "green", t: "Community Reviews & Ratings", c: "Core", d: "Multi-category ratings, verified reviews, and the Community Confidence Score." },
              { s: "green", t: "Waitlist & Early Access", c: "Core", d: "Waitlist system with position tracking, email notifications, and founding member enrollment." },
              { s: "green", t: "Safety Report System", c: "Core", d: "Community-submitted safety reports with moderation and admin review workflow." },
              { s: "green", t: "Business Owner Portal", c: "Core", d: "Business listing pages, profile management, and community visibility tools." },
              { s: "green", t: "Founding Member Program", c: "Core", d: "Limited founding member enrollment with lifetime access, exclusive badge, and roadmap input." },
              { s: "green", t: "Onboarding Flow", c: "Core", d: "4-step identity, interests, goals, and city personalization flow with localStorage persistence." }
            ].map((i, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-[#3A1F0E]/5 shadow-sm flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${i.s === 'green' ? 'bg-green-500' : ''}`} />
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-serif font-bold text-xl text-[#3A1F0E]">{i.t}</h3>
                    <span className="bg-[#FAF6EF] text-[#3A1F0E]/60 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">{i.c}</span>
                  </div>
                  <p className="text-[#3A1F0E]/70">{i.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 2 */}
        <div className="relative pl-8 md:pl-0">
          <div className="md:text-center mb-12">
            <div className="flex flex-col md:items-center gap-4 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10">
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">PHASE 2</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3A1F0E]/20 bg-[#3A1F0E]/5">
                <span className="text-xs font-bold tracking-widest text-[#3A1F0E] uppercase">Q1 Post-Launch</span>
              </div>
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-2">02 Growth</h2>
            <p className="text-[#3A1F0E]/60 text-lg">Premium features, payments, and community depth</p>
          </div>
          
          <div className="space-y-6">
            {[
              { s: "amber", t: "Premium Subscriptions", c: "Monetization", d: "Stripe-powered checkout for Premium and Founding Member tiers with monthly and annual billing." },
              { s: "amber", t: "Full Authentication System", c: "Auth", d: "Email/password and OAuth login, user profiles, premium access gating, and session management." },
              { s: "gray", t: "Business Analytics Dashboard", c: "Business", d: "Profile views, click-through rates, review trends, and customer engagement metrics for business owners." },
              { s: "gray", t: "Verified Business Badges", c: "Trust", d: "Community-verified badge program with criteria, application flow, and badge display on listings." },
              { s: "gray", t: "Community Forums & Groups", c: "Community", d: "City-based and interest-based community groups, discussion threads, and member directories." },
              { s: "gray", t: "Push Notifications", c: "Engagement", d: "Safety alerts, new business alerts in saved cities, and community activity notifications." },
              { s: "gray", t: "Saved Places & Collections", c: "UX", d: "Save businesses, create named collections, and share curated lists with the community." },
              { s: "gray", t: "Destination Guides", c: "Content", d: "Expert-written city guides covering neighborhoods, safety, culture, and must-visit Minority-owned spots." }
            ].map((i, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-[#3A1F0E]/5 shadow-sm flex items-start gap-4 opacity-80">
                <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${i.s === 'amber' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-serif font-bold text-xl text-[#3A1F0E]">{i.t}</h3>
                    <span className="bg-[#FAF6EF] text-[#3A1F0E]/60 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">{i.c}</span>
                  </div>
                  <p className="text-[#3A1F0E]/70">{i.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 3 */}
        <div className="relative pl-8 md:pl-0">
          <div className="md:text-center mb-12">
            <div className="flex flex-col md:items-center gap-4 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10">
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">PHASE 3</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3A1F0E]/20 bg-[#3A1F0E]/5">
                <span className="text-xs font-bold tracking-widest text-[#3A1F0E] uppercase">Q2-Q3 Post-Launch</span>
              </div>
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-2">03 Expansion</h2>
            <p className="text-[#3A1F0E]/60 text-lg">Relocation, employment, events, and networking</p>
          </div>
          
          <div className="space-y-6">
            {[
              { s: "gray", t: "Relocation Intelligence", c: "Relocation", d: "Neighborhood scoring, school ratings, cost of living, and community density data for relocation decisions." },
              { s: "gray", t: "Employer Transparency Ratings", c: "Employment", d: "Community-sourced DEI ratings, workplace culture scores, and employer reviews from Black professionals." },
              { s: "gray", t: "Events Discovery", c: "Events", d: "Local and national events — cultural, networking, business, and community." },
              { s: "gray", t: "Networking Features", c: "Social", d: "Professional connections, direct messaging, community introductions, and co-working spaces." },
              { s: "gray", t: "Travel Partner Matching", c: "Travel", d: "Algorithm-based travel companion matching based on destination, travel style, and community identity." },
              { s: "gray", t: "City Ambassador Program", c: "Community", d: "Onboarding local leaders as city ambassadors to curate, verify, and champion their communities." }
            ].map((i, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-[#3A1F0E]/5 shadow-sm flex items-start gap-4 opacity-70">
                <div className="w-3 h-3 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-serif font-bold text-xl text-[#3A1F0E]">{i.t}</h3>
                    <span className="bg-[#FAF6EF] text-[#3A1F0E]/60 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">{i.c}</span>
                  </div>
                  <p className="text-[#3A1F0E]/70">{i.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 4 */}
        <div className="relative pl-8 md:pl-0">
          <div className="md:text-center mb-12">
            <div className="flex flex-col md:items-center gap-4 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10">
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">PHASE 4</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#3A1F0E]/20 bg-[#3A1F0E]/5">
                <span className="text-xs font-bold tracking-widest text-[#3A1F0E] uppercase">Q4+</span>
              </div>
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-2">04 Scale</h2>
            <p className="text-[#3A1F0E]/60 text-lg">AI, enterprise, and global expansion</p>
          </div>
          
          <div className="space-y-6">
            {[
              { s: "dark", t: "AI Travel Planner (KinfolkAI)", c: "AI", d: "Conversational AI for personalized trip planning, safety briefings, and discovery recommendations." },
              { s: "dark", t: "Enterprise Partnerships", c: "B2B", d: "Corporate travel programs, HR culture tools, and DEI employer visibility partnerships." },
              { s: "dark", t: "Global Expansion", c: "International", d: "Expand beyond the U.S. to cover Black travel destinations across the African diaspora and global communities." },
              { s: "dark", t: "Marketplace & Transactions", c: "Commerce", d: "In-platform booking, event ticketing, merchandise shops, and service marketplace for Minority-owned businesses." },
              { s: "dark", t: "White Label Platform", c: "B2B", d: "Licensing the platform infrastructure to organizations, HBCUs, and community networks." }
            ].map((i, idx) => (
              <div key={idx} className="bg-[#FAF6EF] p-6 rounded-2xl border border-[#3A1F0E]/10 shadow-sm flex items-start gap-4 opacity-60">
                <div className="w-3 h-3 rounded-full bg-[#2B1507] mt-1.5 shrink-0" />
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-serif font-bold text-xl text-[#3A1F0E]">{i.t}</h3>
                    <span className="bg-white border border-[#3A1F0E]/10 text-[#3A1F0E]/60 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">{i.c}</span>
                  </div>
                  <p className="text-[#3A1F0E]/70">{i.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
