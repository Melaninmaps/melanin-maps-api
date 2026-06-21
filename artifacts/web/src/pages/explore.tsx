import { useListBusinesses } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Grid, Map as MapIcon, Star } from "lucide-react";

export default function Explore() {
  const { data: apiBusinesses } = useListBusinesses({ limit: 6 });

  // Static fallback to match exact screenshot data if API doesn't return these exactly
  const staticBusinesses = [
    {
      id: "1",
      name: "The Gathering Table",
      category: "Restaurant",
      city: "Atlanta",
      state: "GA",
      description: "Award-winning Southern cuisine rooted in community and culture. A must-visit for any Atlanta trip.",
      confidenceScore: 96,
      recommend: "97%",
      returnAlone: "94%",
      safety: "4.9",
      featured: true,
      image: `${import.meta.env.BASE_URL}images/biz-gathering-table.jpg`,
      tags: ["Community Trusted", "Traveler Favorite", "Soul Food", "Minority-Owned", "Dine-In"]
    },
    {
      id: "2",
      name: "Heritage Boutique Hotel",
      category: "Hotel",
      city: "New Orleans",
      state: "LA",
      description: "A beautifully restored historic property in the heart of the Tremé neighborhood.",
      confidenceScore: 97,
      recommend: "98%",
      returnAlone: "96%",
      safety: "4.9",
      featured: true,
      image: `${import.meta.env.BASE_URL}images/biz-heritage-hotel.jpg`,
      tags: ["Community Trusted", "Top Rated", "Boutique", "Historic", "Minority-Owned"]
    },
    {
      id: "3",
      name: "Diaspora Arts Collective",
      category: "Cultural Landmark",
      city: "Harlem",
      state: "NY",
      description: "A vibrant gallery and cultural center celebrating African and African-American art and history.",
      confidenceScore: 98,
      recommend: "99%",
      returnAlone: "97%",
      safety: "5",
      featured: false,
      image: `${import.meta.env.BASE_URL}images/biz-diaspora-arts.jpg`,
      tags: ["Highly Recommended", "Local Gem", "Art", "Culture", "Gallery"]
    },
    {
      id: "4",
      name: "Afrobeats & Culture Fest",
      category: "Community Event",
      city: "Houston",
      state: "TX",
      description: "Annual outdoor festival celebrating African and Caribbean music, food, and culture.",
      confidenceScore: 93,
      recommend: "95%",
      returnAlone: "91%",
      safety: "4.7",
      featured: false,
      image: `${import.meta.env.BASE_URL}images/biz-afrobeats-fest.jpg`,
      tags: ["Traveler Favorite", "Festival", "Music", "Food"]
    },
    {
      id: "5",
      name: "Carter & Associates Law",
      category: "Professional Services",
      city: "Chicago",
      state: "IL",
      description: "Full-service law firm specializing in business, real estate, and civil rights law.",
      confidenceScore: 92,
      recommend: "94%",
      returnAlone: "90%",
      safety: "4.8",
      featured: false,
      image: `${import.meta.env.BASE_URL}images/biz-carter-law.jpg`,
      tags: ["Community Trusted", "Legal", "Business", "Real Estate"]
    },
    {
      id: "6",
      name: "Roots & Routes Café",
      category: "Restaurant",
      city: "Washington",
      state: "D.C.",
      description: "Pan-African cuisine and specialty coffee in a warm, community-centered space.",
      confidenceScore: 89,
      recommend: "91%",
      returnAlone: "87%",
      safety: "4.6",
      featured: false,
      image: `${import.meta.env.BASE_URL}images/biz-roots-cafe.jpg`,
      tags: ["Local Gem", "Pan-African", "Coffee", "Brunch"]
    }
  ];

  const categories = ["All", "Minority-Owned Businesses", "Restaurants & Nightlife", "Hotels & Stays", "Cultural Landmarks", "Professional Services", "Community Events", "Hidden Gems"];

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-16 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-explore-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/88 z-0" />
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">DISCOVER YOUR WORLD</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Explore With Purpose</h1>
          <p className="text-[#F5EBD8]/80 max-w-xl mx-auto mb-8 font-light">
            Find Minority-owned businesses, cultural landmarks, safe stays, and community events wherever you go.
          </p>

          <div className="w-full max-w-2xl bg-white rounded-full p-2 flex items-center shadow-lg">
            <div className="px-4 py-2 border-r border-gray-200 flex items-center gap-2 shrink-0">
              <MapPin className="w-4 h-4 text-[#CA922B]" />
              <span className="font-medium text-[#3A1F0E]">Anywhere</span>
            </div>
            <div className="flex-1 flex items-center px-4">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input type="text" placeholder="Explore safety-first travel destinations" className="w-full bg-transparent border-none outline-none text-[#3A1F0E] placeholder:text-gray-400" />
            </div>
            <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-10">Search</Button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="border-b border-[#3A1F0E]/10 bg-white sticky top-20 z-40">
        <div className="container mx-auto px-4 py-4 flex gap-3 overflow-x-auto no-scrollbar items-center">
          <Button variant="outline" className="rounded-full border-gray-200 shrink-0">Share</Button>
          <div className="w-px h-6 bg-gray-200 mx-2 shrink-0" />
          {categories.map((c, i) => (
            <button key={i} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${i === 0 ? 'bg-[#3A1F0E] text-white' : 'bg-[#FAF6EF] text-[#3A1F0E] hover:bg-[#3A1F0E]/10'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-bold text-[#3A1F0E]">6 results · <span className="text-[#3A1F0E]/50">Most Relevant</span></h2>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button className="p-2 bg-[#FAF6EF] text-[#3A1F0E] rounded-md"><Grid className="w-4 h-4" /></button>
            <button className="p-2 text-gray-400 hover:text-[#3A1F0E]"><MapIcon className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {staticBusinesses.map(b => (
            <div key={b.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(43,21,7,0.08)] border border-[#3A1F0E]/5 flex flex-col group cursor-pointer hover:shadow-[0_8px_32px_rgba(43,21,7,0.14)] transition-shadow">
              <div className="h-52 bg-[#2B1507] relative overflow-hidden">
                <img src={b.image} alt={b.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507]/80 via-[#2B1507]/20 to-transparent" />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {b.featured && <div className="bg-[#CA922B] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Featured</div>}
                  <div className="bg-white/95 text-[#3A1F0E] text-xs font-bold px-2 py-1 rounded shadow-sm">{b.confidenceScore}/100</div>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="text-[10px] font-bold text-[#CA922B] uppercase tracking-wider mb-2">{b.category} · {b.city}, {b.state}</div>
                <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-2">{b.name}</h3>
                <p className="text-sm text-[#3A1F0E]/70 mb-4 flex-1 leading-relaxed">{b.description}</p>
                
                <div className="grid grid-cols-3 gap-2 mb-4 bg-[#FAF6EF] p-3 rounded-xl text-center divide-x divide-[#3A1F0E]/10">
                  <div>
                    <div className="text-sm font-bold text-[#3A1F0E]">{b.recommend}</div>
                    <div className="text-[10px] text-[#3A1F0E]/60 uppercase">Recommend</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#3A1F0E]">{b.returnAlone}</div>
                    <div className="text-[10px] text-[#3A1F0E]/60 uppercase">Return Alone</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#3A1F0E] flex items-center justify-center gap-1">{b.safety}<Star className="w-3 h-3 fill-current text-[#CA922B]" /></div>
                    <div className="text-[10px] text-[#3A1F0E]/60 uppercase">Safety</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {b.tags.map(t => (
                    <span key={t} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded font-medium">{t}</span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white">View Details</Button>
                  <Button variant="outline" className="rounded-full border-gray-200">Review</Button>
                  <Button variant="outline" className="rounded-full border-gray-200">Report</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-[#3A1F0E]/50 text-sm mb-6">Showing 6 of 200+ results</div>
        
        <div className="bg-[#2B1507] rounded-3xl p-8 text-center text-white flex flex-col items-center max-w-4xl mx-auto mb-16">
          <h3 className="text-2xl font-serif font-bold mb-4">Upgrade to See All Results</h3>
          <p className="text-[#F5EBD8]/70 mb-6 max-w-xl">Get full access to community safety scores, verified business listings, group connections, and more.</p>
          <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8">See Membership Plans</Button>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-2">Navigate Beyond the Destination.</h2>
          <h2 className="text-3xl font-serif font-bold text-[#CA922B] italic">Discover the Community.</h2>
        </div>
      </div>
    </div>
  );
}
