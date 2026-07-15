import { useState } from "react";
import { useListSurveys, useCreateSurvey, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Search, Check, ChevronDown, ShieldCheck, Radio, Users } from "lucide-react";

const FAQ_ITEMS = [
  { q: "How are safety scores calculated?", a: "Safety scores are calculated from community-submitted reports, verified member reviews, and real-time incident data. Each score reflects the collective experience of people who've actually been there and is updated continuously as new reports come in." },
  { q: "Who can submit a review or report?", a: "Any verified Mapping with Melanin™ member can submit a safety review or incident report. We require authentication to maintain accountability and reduce fraudulent submissions." },
  { q: "What happens when an incident is reported?", a: "Our moderation team reviews every incident report within 24 hours. Verified incidents are reflected in the safety score, and alerts are sent to nearby members when a situation warrants immediate attention." },
  { q: "Can businesses respond to reviews?", a: "Yes. Verified business owners can respond publicly to reviews through their business dashboard. We encourage open dialogue between businesses and the community they serve." },
  { q: "Are businesses able to dispute inaccurate reviews?", a: "Yes. Business owners can flag reviews they believe are inaccurate. Our team investigates disputes and removes content that violates our community guidelines." },
  { q: "How are reviews moderated?", a: "All reviews go through automated screening for harmful content, followed by human review when flagged. Our team of community moderators ensures every review meets our standards for authenticity and respect." },
  { q: "How do businesses become verified?", a: "All minority-owned businesses are welcome to join Mapping With Melanin — we understand that every business is at a different stage in its journey, and that's okay. Any minority-owned business can list on our platform. Businesses that want to take it a step further can apply for our special Verified Badge through our Business Verification program. We review documentation confirming minority ownership and business legitimacy before awarding verified status — it's an extra layer of trust, not a barrier to entry." },
  { q: "Is my personal information safe?", a: "Absolutely. Your personal information is never sold to third parties. Reviews can be submitted under your name or anonymously, and all data is encrypted and securely stored." },
  { q: "How does Mapping with Melanin help travelers make informed decisions?", a: "We aggregate community safety scores, verified reviews, and local insights so you can research any neighborhood or business before you arrive — giving you the confidence to explore new places on your terms." },
  { q: "How is Mapping with Melanin different from Yelp or Google Reviews?", a: "We're built specifically for the Melanated community. Our safety scores reflect real experiences from people who share your background, not generic ratings. We surface culture-specific insights that mainstream platforms miss entirely." },
  { q: "What cities have the highest safety scores for Melaninated travelers?", a: "Our top-rated cities include Atlanta, GA; Houston, TX; Chicago, IL; Miami, FL; and Washington, DC — all with strong Black business communities and high community safety scores from verified members." },
];

export default function Safety() {
  const { data: auth } = useGetCurrentAuthUser();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Dark Hero Header */}
      <section className="bg-[#2B1507] py-24 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-safety-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/85 z-0" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-8">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">SAFETY FIRST</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl">
            Travel Smarter.<br />
            <span className="text-[#CA922B]">Travel Informed.</span>
          </h1>
          
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-2xl mb-16 font-light">
            Community-driven safety scores, verified reviews, and real-time insights so you always know what to expect before you arrive.
          </p>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="flex justify-center mb-2"><ShieldCheck className="w-8 h-8 text-[#CA922B]" /></div>
              <div className="text-sm text-[#F5EBD8]/70">Community-Verified</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2"><Radio className="w-8 h-8 text-[#CA922B]" /></div>
              <div className="text-sm text-[#F5EBD8]/70">Real-Time Data</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2"><Users className="w-8 h-8 text-[#CA922B]" /></div>
              <div className="text-sm text-[#F5EBD8]/70">Your Voice Counts</div>
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
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Your Safety, Powered by Community</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Every feature is built around one goal — making sure you feel safe, welcomed, and informed wherever you travel.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: "Community Reviews", d: "Honest, first-hand accounts from Melaninated travelers who have been there. Real experiences, not curated marketing." },
              { t: "Location Safety Scores", d: "Aggregated community ratings for neighborhoods, cities, and destinations — so you know before you go." },
              { t: "Verified Member Program", d: "Verified member badges ensure the reviews and connections you trust come from real, authenticated accounts — backed by liveness checks and anti-fraud protection." },
              { t: "Incident Reporting", d: "Community-powered reporting tools let members flag unsafe experiences and alert others in real time." },
              { t: "Transparency Ratings", d: "Businesses and destinations are rated on inclusivity, service quality, and how welcoming they are to Minority guests." },
              { t: "Trusted Network", d: "Connect with verified locals and experienced travelers who can give you the real picture before you arrive." }
            ].map((f, i) => (
              <div key={i} className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5">
                <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-3">{f.t}</h3>
                <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destination Scores */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">DESTINATION SCORES</span>
              </div>
              <h2 className="text-4xl font-serif font-bold text-[#3A1F0E] mb-2">Top-Rated Cities</h2>
              <p className="text-[#3A1F0E]/70">Community safety scores for the most popular Minority travel destinations in the U.S.</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-[#3A1F0E]/60 bg-white px-4 py-2 rounded-full shadow-sm border border-[#3A1F0E]/5">
              <span><strong className="text-green-600">9.0+</strong> Excellent</span>
              <span><strong className="text-blue-600">8.0+</strong> Good</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { c: "Atlanta, GA", r: "1,240", s: 9.4, t: "↑ Improving", tags: ["Welcoming", "Minority-Owned Hubs", "Cultural"] },
              { c: "New Orleans, LA", r: "876", s: 8.9, t: "↑ Improving", tags: ["Historic", "Vibrant", "Community"] },
              { c: "Harlem, NY", r: "2,103", s: 9.1, t: "→ Stable", tags: ["Cultural", "Arts", "Iconic"] },
              { c: "Houston, TX", r: "954", s: 8.7, t: "↑ Improving", tags: ["Diverse", "Business", "Food"] },
              { c: "Chicago, IL", r: "1,432", s: 8.5, t: "→ Stable", tags: ["Arts", "Nightlife", "Community"] },
              { c: "Washington, D.C.", r: "1,788", s: 9.2, t: "↑ Improving", tags: ["Historic", "Political", "Cultural"] }
            ].map((city, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-[#3A1F0E]/5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mb-1">{city.c}</h3>
                    <div className="text-sm text-[#3A1F0E]/50">{city.r} reviews</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-3xl font-bold text-[#CA922B] leading-none mb-1">{city.s}</div>
                    <div className={`text-xs font-bold ${city.t.includes('Improving') ? 'text-green-600' : 'text-blue-600'}`}>{city.t}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#3A1F0E]/5">
                  {city.tags.map(tag => (
                    <span key={tag} className="text-xs font-medium text-[#3A1F0E]/60 bg-[#FAF6EF] px-2 py-1 rounded-md">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/businesses">
              <Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white px-8 h-12">
                View All Destinations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Reviews & Alert Card */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">COMMUNITY REVIEWS</span>
              </div>
              <h2 className="text-4xl font-serif font-bold text-[#3A1F0E] mb-10">Real Experiences. Real Voices.</h2>
              
              <div className="space-y-6">
                {[
                  { n: "Keisha M.", c: "Atlanta, GA", d: "Jun 10, 2026", i: "K", q: "Felt completely at home the entire trip. The restaurant recommendations from the community were spot-on — every spot was welcoming and the food was incredible.", h: 42 },
                  { n: "Darius P.", c: "New Orleans, LA", d: "Jun 5, 2026", i: "D", q: "Staying in the Tremé neighborhood was a transformative experience. The safety scores helped me choose the right area and I never felt out of place.", h: 38 },
                  { n: "Simone A.", c: "Harlem, NY", d: "May 28, 2026", i: "S", q: "The community reviews were incredibly accurate. I knew exactly what to expect and felt confident navigating the city solo as a Minority woman.", h: 61 }
                ].map((r, idx) => (
                  <div key={idx} className="bg-[#FAF6EF] p-6 rounded-2xl border border-[#3A1F0E]/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#2B1507] text-[#F5EBD8] flex items-center justify-center font-bold font-serif">{r.i}</div>
                        <div>
                          <div className="font-bold text-[#3A1F0E]">{r.n}</div>
                          <div className="text-xs text-[#3A1F0E]/50">{r.c} · {r.d}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified Traveler
                      </div>
                    </div>
                    <p className="text-[#3A1F0E]/80 italic mb-4">"{r.q}"</p>
                    <div className="text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider cursor-pointer hover:text-[#CA922B]">Helpful ({r.h})</div>
                  </div>
                ))}
              </div>
              <Button className="mt-8 rounded-full bg-[#2B1507] text-white hover:bg-[#1a0c04] px-8 h-12">Read All Reviews</Button>
            </div>
            
            <div>
              <div className="bg-[#2B1507] rounded-3xl p-8 text-white sticky top-24 shadow-xl">
                <Shield className="w-12 h-12 text-[#CA922B] mb-6" />
                <div className="text-2xl font-serif font-bold mb-2">Harlem, NY</div>
                <div className="flex items-end gap-2 mb-6">
                  <div className="text-5xl font-bold text-[#CA922B]">9.1</div>
                  <div className="text-sm text-[#F5EBD8]/70 pb-1">Community Score</div>
                </div>
                <div className="text-sm text-[#F5EBD8]/70 mb-8 border-b border-white/10 pb-6">2,103 reviews</div>
                
                <div className="bg-white/10 rounded-xl p-4 border border-[#CA922B]/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-[#CA922B] font-bold text-sm mb-2">
                    <Shield className="w-4 h-4" /> Community Alert
                  </div>
                  <div className="text-sm text-[#F5EBD8]">1 report in last 30 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#3A1F0E]">Questions — How Safety Works</h2>
          </div>
          
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#3A1F0E]/5 hover:border-[#CA922B]/40 transition-colors overflow-hidden"
              >
                <button
                  className="w-full p-6 flex justify-between items-center cursor-pointer text-left gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-[#3A1F0E]">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#CA922B] shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-[#3A1F0E]/70 text-sm leading-relaxed border-t border-[#3A1F0E]/5 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimers */}
      <section className="py-8 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-4xl space-y-3">
          <DisclaimerBanner type="safety" variant="bordered" />
          <DisclaimerBanner type="emergency" variant="bordered" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#2B1507] text-center text-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Travel With Confidence — Know Before You Go. Every Time.</h2>
          <p className="text-lg text-[#F5EBD8]/70 mb-10">Get early access to community safety scores, verified reviews, and real-time alerts.</p>
          <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-10 h-14 text-lg">Get Early Access</Button>
        </div>
      </section>
    </div>
  );
}
