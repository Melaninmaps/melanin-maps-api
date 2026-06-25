import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, Users, MapPin, CheckCircle, Star } from "lucide-react";
import { Link } from "wouter";

const BUSINESSES = [
  {
    name: "The Gathering Table",
    category: "Restaurant",
    city: "Atlanta, GA",
    score: 96,
    featured: true,
    img: `${import.meta.env.BASE_URL}images/biz-gathering-table.jpg`,
    tags: ["Community Trusted", "Soul Food", "Minority-Owned"],
    recommend: 97,
    returnAlone: 94,
    rating: 4.9,
  },
  {
    name: "Heritage Boutique Hotel",
    category: "Hotel",
    city: "New Orleans, LA",
    score: 97,
    featured: true,
    img: `${import.meta.env.BASE_URL}images/biz-heritage-hotel.jpg`,
    tags: ["Top Rated", "Boutique", "Minority-Owned"],
    recommend: 98,
    returnAlone: 96,
    rating: 4.9,
  },
  {
    name: "Diaspora Arts Collective",
    category: "Cultural Landmark",
    city: "Harlem, NY",
    score: 98,
    featured: false,
    img: `${import.meta.env.BASE_URL}images/biz-diaspora-arts.jpg`,
    tags: ["Highly Recommended", "Art", "Culture"],
    recommend: 99,
    returnAlone: 97,
    rating: 5,
  },
  {
    name: "Afrobeats & Culture Fest",
    category: "Community Event",
    city: "Houston, TX",
    score: 93,
    featured: false,
    img: `${import.meta.env.BASE_URL}images/biz-afrobeats-fest.jpg`,
    tags: ["Local Gem", "Live Music", "Minority-Owned"],
    recommend: 95,
    returnAlone: 91,
    rating: 4.7,
  },
  {
    name: "Carter & Associates Law",
    category: "Professional Services",
    city: "Chicago, IL",
    score: 92,
    featured: false,
    img: `${import.meta.env.BASE_URL}images/biz-carter-law.jpg`,
    tags: ["Community Trusted", "Legal", "Minority-Owned"],
    recommend: 94,
    returnAlone: 90,
    rating: 4.8,
  },
  {
    name: "Roots & Routes Café",
    category: "Restaurant",
    city: "Washington, D.C.",
    score: 89,
    featured: false,
    img: `${import.meta.env.BASE_URL}images/biz-roots-cafe.jpg`,
    tags: ["Pan-African", "Community Space", "Minority-Owned"],
    recommend: 87,
    returnAlone: 83,
    rating: 4.6,
  },
];

export default function Businesses() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-24 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-businesses-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/82 z-0" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-8">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">VERIFIED BUSINESS DIRECTORY</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl">
            Support Trusted<br />
            <span className="text-[#CA922B]">Businesses.</span><br />
            Everywhere You Go.
          </h1>
          
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-2xl mb-4 font-light">
            Connect with verified Minority-owned businesses, service providers, and entrepreneurs while exploring new cities and communities.
          </p>
          <p className="text-[#F5EBD8]/60 text-base max-w-2xl mb-10 font-light">
            Every listing is community-reviewed, authenticity-checked, and safety-scored by real members.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#directory"><Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-14 text-lg">Browse Directory →</Button></a>
            <Link href="/for-business-owners"><Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white px-8 h-14 text-lg bg-transparent">List Your Business</Button></Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-[#1c0d04] py-8 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-white/10">
            <div className="px-4 text-white font-serif font-bold text-xl md:text-2xl">2,400+* <span className="text-sm font-sans font-normal text-[#F5EBD8]/60 block uppercase tracking-wider mt-1">Verified Businesses</span></div>
            <div className="px-4 text-white font-serif font-bold text-xl md:text-2xl">48* <span className="text-sm font-sans font-normal text-[#F5EBD8]/60 block uppercase tracking-wider mt-1">States Covered</span></div>
            <div className="px-4 text-white font-serif font-bold text-xl md:text-2xl">94/100* <span className="text-sm font-sans font-normal text-[#F5EBD8]/60 block uppercase tracking-wider mt-1">Avg. Confidence Score</span></div>
            <div className="px-4 text-[#CA922B] font-serif font-bold text-xl md:text-2xl">100%* <span className="text-sm font-sans font-normal text-[#F5EBD8]/60 block uppercase tracking-wider mt-1">Authenticity Checked</span></div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-6xl py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-serif font-bold text-[#3A1F0E] mb-4">Find Businesses You Can Trust</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-2xl">
              Every listing carries a Community Confidence Score — built from safety ratings, recommendation rates, and the trust metric that matters most: would members return alone?
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/for-business-owners"><Button variant="outline" className="rounded-full border-gray-300">Submit a Business</Button></Link>
            <Link href="/rate-neighborhood"><Button variant="outline" className="rounded-full border-gray-300">Rate a Neighborhood</Button></Link>
            <Link href="/map"><Button className="rounded-full bg-[#2B1507] text-white"><MapPin className="w-4 h-4 mr-2"/> Near Me</Button></Link>
          </div>
        </div>

        <div className="space-y-6 mb-16">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {["All", "Restaurants", "Hotels & Stays", "Salons & Spas", "Retail & Boutiques", "Legal & Financial", "Health & Wellness", "Tour Operators", "Professional Services"].map((c, i) => (
              <button key={i} className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${i === 0 ? 'bg-[#3A1F0E] text-white' : 'bg-white border border-[#3A1F0E]/10 text-[#3A1F0E] hover:border-[#CA922B]'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {["Minority-Owned", "Hispanic-Owned", "Women-Owned", "Veteran-Owned", "LGBTQ+-Owned", "Indigenous-Owned", "Immigrant-Owned", "Disability-Owned"].map((c, i) => (
              <button key={i} className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${i === 0 ? 'bg-[#CA922B]/10 text-[#CA922B] border border-[#CA922B]/30' : 'bg-white border border-[#3A1F0E]/10 text-[#3A1F0E] hover:border-[#CA922B]'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Business listing grid */}
        <div id="directory" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {BUSINESSES.map((biz, i) => (
            <Link key={i} href="/explore" className="block bg-white rounded-2xl border border-[#3A1F0E]/8 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-48 overflow-hidden">
                <img src={biz.img} alt={biz.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 flex gap-2">
                  {biz.featured && <span className="bg-[#CA922B] text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Featured</span>}
                  <span className="bg-[#2B1507]/80 text-white text-xs font-bold px-2 py-1 rounded-full">{biz.score}/100*</span>
                </div>
              </div>
              <div className="p-5">
                <div className="text-[10px] font-bold tracking-widest text-[#CA922B] uppercase mb-1">{biz.category} · {biz.city}</div>
                <h3 className="font-serif font-bold text-lg text-[#3A1F0E] mb-2">{biz.name}</h3>
                <div className="flex gap-4 text-xs text-[#3A1F0E]/60 mb-4">
                  <span><span className="font-bold text-[#3A1F0E]">{biz.recommend}%*</span> Recommend</span>
                  <span><span className="font-bold text-[#3A1F0E]">{biz.returnAlone}%*</span> Return Alone</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-[#CA922B] text-[#CA922B]"/><span className="font-bold text-[#3A1F0E]">{biz.rating}*</span></span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {biz.tags.map((t, j) => (
                    <span key={j} className="bg-[#FAF6EF] text-[#3A1F0E]/70 text-xs px-3 py-1 rounded-full border border-[#3A1F0E]/8">{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA section */}
        <div className="bg-[#FAF6EF] p-12 rounded-3xl border border-[#3A1F0E]/10 flex flex-col md:flex-row items-center gap-12 mt-8">
          <div className="flex-1">
            <div className="text-xs font-bold tracking-widest text-[#CA922B] uppercase mb-4">FOR BUSINESS OWNERS & COMMUNITY</div>
            <h3 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-4">Know a Business Worth Sharing?</h3>
            <p className="text-[#3A1F0E]/70 mb-8 leading-relaxed">
              Help grow the directory by submitting a business you love. Owners can apply for early access and a verified badge — community members can nominate any business they trust.
            </p>
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 font-bold text-[#3A1F0E]"><CheckCircle className="w-5 h-5 text-[#CA922B]"/> Verified Badge</div>
              <div className="flex items-center gap-2 font-bold text-[#3A1F0E]"><CheckCircle className="w-5 h-5 text-[#CA922B]"/> Community Reviews</div>
              <div className="flex items-center gap-2 font-bold text-[#3A1F0E]"><CheckCircle className="w-5 h-5 text-[#CA922B]"/> Map Discovery</div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/for-business-owners"><Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Submit a Business</Button></Link>
              <Link href="/for-business-owners"><Button variant="outline" className="rounded-full border-[#2B1507] text-[#2B1507] px-8 h-12">Apply for Early Access</Button></Link>
              <Button variant="ghost" className="rounded-full text-[#3A1F0E]/60 hover:text-[#CA922B]" onClick={() => { if (navigator.share) { navigator.share({ title: "Mapping With Melanin Directory", url: window.location.href }); } else { navigator.clipboard?.writeText(window.location.href); } }}>Share the directory</Button>
            </div>
          </div>
          <div className="w-full md:w-1/3 bg-white p-8 rounded-2xl shadow-lg border border-[#3A1F0E]/5 transform rotate-2">
             <div className="w-16 h-16 bg-[#2B1507] rounded-full mx-auto mb-6 flex items-center justify-center"><ShieldCheck className="w-8 h-8 text-[#CA922B]"/></div>
             <div className="text-center font-serif font-bold text-2xl text-[#3A1F0E] mb-2">Get Verified</div>
             <div className="text-center text-[#3A1F0E]/60 text-sm">Join the network of trusted Minority-owned businesses today.</div>
          </div>
        </div>
        <p className="text-xs text-[#3A1F0E]/40 mt-8 text-center">* All figures marked with an asterisk are illustrative placeholders for visual purposes only and do not reflect actual data.</p>
      </div>
    </div>
  );
}
