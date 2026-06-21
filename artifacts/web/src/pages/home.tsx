import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Search, Calendar, MapPin, Sparkles, Bell, ArrowRight } from "lucide-react";
import { useListBusinesses } from "@workspace/api-client-react";

export default function Home() {
  const { data: businessesData, isLoading } = useListBusinesses({ limit: 3 });

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 overflow-hidden bg-[#2B1507]">
        {/* Dark tinted overlay over a warm pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c0d04] via-[#2B1507] to-[#4a260d] opacity-90 z-0" />
        <div 
          className="absolute inset-0 opacity-20 mix-blend-overlay z-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        
        <div className="relative z-10 container mx-auto px-4 md:px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in-up">
            <Shield className="w-4 h-4 text-[#CA922B]" />
            <span className="text-xs font-bold tracking-widest text-[#F5EBD8] uppercase">Safety-First Community Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 leading-tight max-w-5xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Map Your Life.<br />
            <span className="text-[#CA922B]">Connect Deeper.</span><br />
            Live With Purpose.
          </h1>

          <p className="text-lg md:text-xl text-[#F5EBD8]/80 mb-12 max-w-2xl animate-fade-in-up font-light" style={{ animationDelay: '200ms' }}>
            Discover trusted Black-owned businesses, verified safe spaces, and authentic community experiences in your city and beyond.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {[
              { icon: Search, label: "Find Businesses" },
              { icon: Calendar, label: "Discover Events" },
              { icon: Shield, label: "Safety Intelligence" },
              { icon: Sparkles, label: "AI Recommendations" },
              { icon: Bell, label: "Real-Time Alerts" }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#F5EBD8] text-sm">
                <feature.icon className="w-4 h-4 text-[#CA922B]" />
                <span>{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Waitlist Form */}
          <div className="w-full max-w-md bg-black/20 p-2 pl-4 rounded-full border border-white/10 flex items-center backdrop-blur-md animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="bg-transparent border-none text-white outline-none flex-1 placeholder:text-white/40"
            />
            <div className="w-px h-6 bg-white/20 mx-2 hidden sm:block" />
            <input 
              type="text" 
              placeholder="City" 
              className="bg-transparent border-none text-white outline-none w-24 hidden sm:block placeholder:text-white/40"
            />
            <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-6">
              Join Waitlist
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-[#CA922B] py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/20">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-serif font-bold text-white mb-2">50k+</span>
              <span className="text-sm font-medium text-white/90 uppercase tracking-wider">Trusted Businesses</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-serif font-bold text-white mb-2">120+</span>
              <span className="text-sm font-medium text-white/90 uppercase tracking-wider">Cities Covered</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-serif font-bold text-white mb-2">250k</span>
              <span className="text-sm font-medium text-white/90 uppercase tracking-wider">Community Members</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-serif font-bold text-white mb-2">4.9/5</span>
              <span className="text-sm font-medium text-white/90 uppercase tracking-wider">Average Safety Score</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-[#CA922B] font-bold tracking-widest text-sm uppercase mb-2">Curated Selection</div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E]">Featured Businesses</h2>
            </div>
            <Link href="/discover">
              <Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              // Skeleton loading
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-96 rounded-2xl bg-black/5 animate-pulse" />
              ))
            ) : businessesData?.businesses?.map((business) => (
              <div key={business.id} className="group relative rounded-2xl overflow-hidden bg-white shadow-lg shadow-black/5 flex flex-col h-[400px] cursor-pointer">
                {/* Background Image Area */}
                <div className="absolute inset-0 bg-[#2B1507]/10" />
                {business.imageUrl ? (
                  <img src={business.imageUrl} alt={business.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="absolute inset-0 bg-[#2B1507] flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                    <MapPin className="w-12 h-12 text-white/20" />
                  </div>
                )}
                
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507] via-[#2B1507]/60 to-transparent" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="bg-[#CA922B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    Featured
                  </div>
                  {business.confidenceScore && (
                    <div className="bg-[#FAF6EF] text-[#CA922B] text-xs font-bold px-3 py-1 rounded-full shadow-md border border-[#CA922B]/20">
                      {business.confidenceScore}/100
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="relative z-10 mt-auto p-6 flex flex-col gap-2">
                  <span className="text-[#CA922B] font-bold text-xs uppercase tracking-wider">{business.category}</span>
                  <h3 className="text-2xl font-serif font-bold text-white">{business.name}</h3>
                  <div className="flex items-center gap-2 text-[#F5EBD8] text-sm opacity-90">
                    <MapPin className="w-4 h-4" />
                    <span>{business.city}, {business.state}</span>
                  </div>
                  <p className="text-white/80 text-sm line-clamp-2 mt-2 font-light">
                    {business.description || "A highly rated business in your community. Visit to experience their exceptional service and welcoming atmosphere."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
