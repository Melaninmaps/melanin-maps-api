import { Link } from "wouter";
import { MapPin, Shield, Utensils, Landmark, Music, ArrowRight } from "lucide-react";

const CITIES = [
  {
    slug: "atlanta",
    name: "Atlanta",
    state: "GA",
    tagline: "The Minority Mecca of the South",
    description: "Home to HBCUs, civil rights history, and a booming Minority entrepreneurship scene unlike anywhere else.",
    safetyScore: 78,
    businesses: "1,200+",
    emoji: "🍑",
    image: "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=800&auto=format&fit=crop",
    highlights: ["Sweet Auburn Historic District", "West Midtown", "Buckhead Village"],
    color: "#CA922B",
  },
  {
    slug: "houston",
    name: "Houston",
    state: "TX",
    tagline: "Where Culture Runs Deep",
    description: "The most diverse city in America, with one of the largest concentrations of minority-owned businesses in the country.",
    safetyScore: 74,
    businesses: "900+",
    emoji: "🤠",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop",
    highlights: ["Third Ward", "Midtown", "Riverside Terrace"],
    color: "#2B6CB0",
  },
  {
    slug: "new-orleans",
    name: "New Orleans",
    state: "LA",
    tagline: "Birthplace of Jazz, Heart of Minority Culture",
    description: "Vibrant Creole culture, world-class cuisine, and deep African roots make NOLA a must-experience destination.",
    safetyScore: 71,
    businesses: "600+",
    emoji: "🎷",
    image: "https://images.unsplash.com/photo-1568458730946-c04e9fb7d04e?w=800&auto=format&fit=crop",
    highlights: ["Tremé", "Seventh Ward", "Central City"],
    color: "#6B21A8",
  },
  {
    slug: "washington-dc",
    name: "Washington",
    state: "DC",
    tagline: "Chocolate City, Always",
    description: "Steeped in Minority political power and culture — from U Street to the Smithsonian's African American Museum.",
    safetyScore: 80,
    businesses: "800+",
    emoji: "🏛️",
    image: "https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=800&auto=format&fit=crop",
    highlights: ["U Street Corridor", "Shaw", "Congress Heights"],
    color: "#065F46",
  },
  {
    slug: "new-york",
    name: "New York",
    state: "NY",
    tagline: "Harlem to Brooklyn — Minority Excellence Everywhere",
    description: "From historic Harlem to Brooklyn's Bed-Stuy, NYC has centuries of Minority culture, art, and business.",
    safetyScore: 82,
    businesses: "2,400+",
    emoji: "🗽",
    image: "https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800&auto=format&fit=crop",
    highlights: ["Harlem", "Bed-Stuy", "Crown Heights"],
    color: "#B91C1C",
  },
  {
    slug: "chicago",
    name: "Chicago",
    state: "IL",
    tagline: "The Bronzeville Beat",
    description: "Bronzeville, the South Side, and a deep music heritage make Chicago a cornerstone of Minority American life.",
    safetyScore: 73,
    businesses: "1,100+",
    emoji: "🌬️",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&auto=format&fit=crop",
    highlights: ["Bronzeville", "South Shore", "Chatham"],
    color: "#0C4A6E",
  },
];

export default function Cities() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
            <MapPin className="w-3 h-3 text-[#CA922B]" />
            <span className="text-[10px] font-bold tracking-widest text-[#F5EBD8] uppercase">City Spotlights</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
            Find Your <span className="text-[#CA922B]">City.</span>
          </h1>
          <p className="text-[#F5EBD8]/80 text-xl max-w-2xl mx-auto font-light">
            Curated guides to the best minority-owned businesses, most welcoming neighborhoods, and most vibrant cultural hubs across America's most iconic cities.
          </p>
        </div>
      </section>

      {/* City Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CITIES.map((city) => (
              <Link key={city.slug} href={`/cities/${city.slug}`}>
                <div className="group cursor-pointer rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(43,21,7,0.08)] hover:shadow-[0_12px_40px_rgba(43,21,7,0.16)] transition-all duration-300 bg-white border border-[#2B1507]/5">
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507]/80 via-[#2B1507]/30 to-transparent" />
                    <div className="absolute bottom-4 left-5">
                      <div className="text-3xl mb-1">{city.emoji}</div>
                      <h2 className="text-3xl font-serif font-bold text-white">{city.name}</h2>
                      <p className="text-[#F5EBD8]/80 text-sm">{city.state}</p>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 border border-white/30">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#CA922B]" />
                        <span className="text-white text-xs font-bold">{city.safetyScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-[#CA922B] text-xs font-bold uppercase tracking-wider mb-2">{city.tagline}</p>
                    <p className="text-[#3A1F0E]/70 text-sm leading-relaxed mb-4">{city.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {city.highlights.map((n) => (
                        <span key={n} className="px-2.5 py-1 bg-[#FAF6EF] text-[#3A1F0E] text-xs rounded-full border border-[#2B1507]/10 font-medium">
                          {n}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#2B1507]/10">
                      <div className="text-sm text-[#3A1F0E]/60">
                        <span className="font-bold text-[#3A1F0E]">{city.businesses}</span> businesses
                      </div>
                      <div className="flex items-center gap-1 text-[#CA922B] font-semibold text-sm group-hover:gap-2 transition-all">
                        Explore <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#2B1507] text-white text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Don't see your city?</h2>
          <p className="text-[#F5EBD8]/70 mb-8">We're expanding fast. Nominate your city to be featured next.</p>
          <Link href="/community">
            <button className="px-8 py-4 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-semibold transition-colors">
              Nominate a City
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
