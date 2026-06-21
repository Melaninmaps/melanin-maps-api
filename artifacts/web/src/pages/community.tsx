import { useListCommunityPosts, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Users, Globe, MapPin, Calendar, Briefcase, MessageSquare, ArrowRight } from "lucide-react";

export default function Community() {
  const { data: auth } = useGetCurrentAuthUser();

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Dark Hero Header */}
      <section className="bg-[#2B1507] py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(43,21,7,0.6)] via-[rgba(43,21,7,0.85)] to-[#2B1507] z-0" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-8">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">GLOBAL COMMUNITY</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl">
            Connect With a<br />
            <span className="text-[#CA922B]">Global Community</span>
          </h1>
          
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-2xl mb-16 font-light">
            Because the best journeys are shared. Meet like-minded travelers, entrepreneurs, professionals, and creators who understand your experience.
          </p>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">10K+</div>
              <div className="text-sm text-[#F5EBD8]/70">Early Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">50+</div>
              <div className="text-sm text-[#F5EBD8]/70">Active Groups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">200+</div>
              <div className="text-sm text-[#F5EBD8]/70">Cities Worldwide</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">HOW IT WORKS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Built for Connection</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Every feature on Mapping with Melanin is designed to bring people together — locally and globally.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: "Community Groups", d: "Join groups built around shared interests — travel styles, cities, professions, and cultural identities." },
              { t: "Local Meetups", d: "Find and attend in-person gatherings in cities around the world, hosted by community members like you." },
              { t: "Networking", d: "Connect with entrepreneurs, professionals, and creatives who share your values and vision." },
              { t: "Cultural Events", d: "Discover festivals, art shows, pop-ups, and cultural celebrations happening near you and globally." },
              { t: "Travel Partnerships", d: "Find travel companions, co-explorers, and partners for your next adventure — near or far." },
              { t: "Global Network", d: "Tap into a worldwide community of travelers and locals who can guide, host, and connect with you." }
            ].map((f, i) => (
              <div key={i} className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5">
                <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-3">{f.t}</h3>
                <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Groups */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">DISCOVER FEATURED GROUPS</span>
            </div>
          </div>
          
          <div className="flex justify-center gap-8 mb-12 border-b border-[#3A1F0E]/10 pb-4">
            <button className="text-[#3A1F0E] font-bold border-b-2 border-[#CA922B] pb-4 -mb-[18px]">Groups</button>
            <button className="text-[#3A1F0E]/50 font-bold hover:text-[#3A1F0E] transition-colors">Events</button>
            <button className="text-[#3A1F0E]/50 font-bold hover:text-[#3A1F0E] transition-colors">Travel</button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { m: "4.2K members", t: "Solo Black Travelers", l: "Global", d: "A safe space for solo travelers to share tips, routes, and real experiences." },
              { m: "2.8K members", t: "Black Entrepreneurs Abroad", l: "Global", d: "Connecting Minority business owners who work, invest, and build across borders." },
              { m: "1.5K members", t: "ATL Cultural Explorers", l: "Atlanta, GA", d: "Discover Atlanta's hidden gems, art scenes, and cultural hotspots together." },
              { m: "3.1K members", t: "Afro-Caribbean Connections", l: "Global", d: "Celebrating the diaspora through shared travel, food, music, and community." }
            ].map((g, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-[#3A1F0E]/5 shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">{g.m}</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-2">{g.t}</h3>
                <div className="flex items-center gap-1 text-[#3A1F0E]/50 text-sm mb-4">
                  <Globe className="w-4 h-4" /> {g.l}
                </div>
                <p className="text-[#3A1F0E]/70 mb-6 flex-1">{g.d}</p>
                <div className="flex gap-3 mt-auto">
                  <Button className="flex-1 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white">Join Group</Button>
                  <Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white px-4"><MessageSquare className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white px-8 h-12">View All Groups</Button>
          </div>
        </div>
      </section>

      {/* Community Voices */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">COMMUNITY VOICES</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-16">Real Connections. Real Stories.</h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { q: "Mapping with Melanin connected me with a travel partner for my trip to Ghana. We've been friends ever since.", n: "Jasmine T.", l: "Atlanta, GA" },
              { q: "The networking events are incredible. I found my business co-founder through a Mapping with Melanin meetup.", n: "Marcus W.", l: "Chicago, IL" },
              { q: "Finally a platform that understands what community means to us. I feel at home wherever I travel now.", n: "Aisha R.", l: "Houston, TX" }
            ].map((t, i) => (
              <div key={i} className="bg-[#FAF6EF] p-8 rounded-3xl border border-[#3A1F0E]/5">
                <div className="text-4xl font-serif text-[#CA922B] opacity-50 mb-4">"</div>
                <p className="text-[#3A1F0E]/80 text-lg italic leading-relaxed mb-8">"{t.q}"</p>
                <div className="font-bold text-[#3A1F0E]">{t.n}</div>
                <div className="text-sm text-[#3A1F0E]/60">{t.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#2B1507] text-center text-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Join the Movement — Your Community Is Waiting</h2>
          <p className="text-lg text-[#F5EBD8]/70 mb-10">Sign up for early access and be among the first to connect with a global network of travelers, entrepreneurs, and explorers.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-10 h-14 text-lg">Get Early Access</Button>
            <Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white px-10 h-14 text-lg bg-transparent">Explore the Map</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
