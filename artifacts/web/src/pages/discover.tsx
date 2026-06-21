import { useState } from "react";
import { useListBusinesses } from "@workspace/api-client-react";
import { Link, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Star, ShieldCheck, Grid, Map as MapIcon, Compass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Discover() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const { data, isLoading } = useListBusinesses({
    search: query || undefined,
    category: activeCategory === "All" ? undefined : activeCategory,
  }, { query: { queryKey: ['businesses', query, activeCategory] } });

  const categories = [
    "All", 
    "Black-Owned Businesses", 
    "Restaurants & Nightlife", 
    "Hotels & Stays", 
    "Cultural Landmarks", 
    "Professional Services", 
    "Community Events"
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Dark Hero Header */}
      <section className="bg-[#2B1507] py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay z-0 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
            <Compass className="w-3 h-3 text-[#CA922B]" />
            <span className="text-[10px] font-bold tracking-widest text-[#F5EBD8] uppercase">Discover Your World</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Explore With Purpose</h1>
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-2xl mb-8 font-light">
            Find the best Black-owned businesses, authentic experiences, and trusted community spots.
          </p>
          
          <div className="w-full max-w-2xl bg-white rounded-full p-2 flex items-center shadow-lg">
            <Search className="w-5 h-5 text-muted-foreground ml-4" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for restaurants, services, landmarks..." 
              className="border-0 focus-visible:ring-0 shadow-none text-base h-12 bg-transparent rounded-full"
            />
            <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Search</Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                activeCategory === cat 
                  ? "bg-[#2B1507] text-white border-[#2B1507]" 
                  : "bg-transparent text-[#3A1F0E] border-[#2B1507]/20 hover:border-[#CA922B] hover:text-[#CA922B]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="text-[#3A1F0E] font-medium">
            {isLoading ? "Loading..." : <span className="font-bold">{data?.total ?? data?.businesses?.length ?? 0}</span>} results found
          </div>
          
          <div className="flex items-center gap-4">
            <Select defaultValue="recommended">
              <SelectTrigger className="w-[180px] bg-white border-[#2B1507]/10 rounded-full h-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-white rounded-full p-1 border border-[#2B1507]/10">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-full ${viewMode === "grid" ? "bg-[#FAF6EF] text-[#2B1507]" : "text-muted-foreground"}`}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode("map")}
                className={`p-2 rounded-full ${viewMode === "map" ? "bg-[#FAF6EF] text-[#2B1507]" : "text-muted-foreground"}`}
              >
                <MapIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Business Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm h-[400px]">
                <Skeleton className="h-2/3 w-full rounded-none" />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          ) : data?.businesses.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <Search size={48} className="mx-auto text-[#2B1507]/20" />
              <p className="text-xl text-[#3A1F0E]">No businesses found matching your criteria.</p>
            </div>
          ) : (
            data?.businesses.map((business) => (
              <Link key={business.id} href={`/businesses/${business.id}`}>
                <div className="group relative bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(43,21,7,0.05)] hover:shadow-[0_8px_30px_rgba(43,21,7,0.12)] transition-all duration-300 cursor-pointer h-[420px] flex flex-col border border-[#2B1507]/5">
                  {/* Top Image Area */}
                  <div className="h-[60%] w-full relative overflow-hidden bg-[#2B1507]/10">
                    {business.imageUrl ? (
                      <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#FAF6EF]">
                        <Compass className="w-12 h-12 text-[#2B1507]/20" />
                      </div>
                    )}
                    
                    {/* Gradient Overlay for bottom text */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507]/90 via-[#2B1507]/30 to-transparent" />
                    
                    {/* Top Left Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {business.featured && (
                        <div className="bg-[#CA922B] text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-md w-fit">
                          Featured
                        </div>
                      )}
                      {business.confidenceScore && (
                        <div className="score-badge shadow-md">
                          {business.confidenceScore}/100
                        </div>
                      )}
                    </div>

                    {/* Bottom Left Text (on image) */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-serif font-bold text-2xl leading-tight mb-1">{business.name}</h3>
                      <div className="flex items-center gap-1.5 text-[#F5EBD8] text-sm">
                        <span className="text-[#CA922B] font-medium">{business.category}</span>
                        <span>•</span>
                        <MapPin size={12} />
                        <span className="line-clamp-1">{business.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Content Area */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <p className="text-[#3A1F0E]/70 text-sm line-clamp-3 leading-relaxed">
                      {business.description || "Discover this highly-rated business. Visit their profile to learn more about their offerings, location, and community reviews."}
                    </p>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2B1507]/10">
                      {business.averageRating ? (
                        <div className="flex items-center gap-1">
                          <div className="flex text-[#CA922B]">
                            {Array.from({length: 5}).map((_, i) => (
                              <Star key={i} size={14} fill={i < Math.round(business.averageRating!) ? "currentColor" : "none"} strokeWidth={i < Math.round(business.averageRating!) ? 0 : 2} />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-[#3A1F0E] ml-1">{business.averageRating.toFixed(1)}</span>
                          <span className="text-xs text-[#3A1F0E]/50">({business.reviewCount || 0})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#3A1F0E]/50">No reviews yet</span>
                      )}
                      
                      {business.blackOwned && (
                        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-[#2B1507]">
                          <ShieldCheck size={14} className="text-[#CA922B]" />
                          Black Owned
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
