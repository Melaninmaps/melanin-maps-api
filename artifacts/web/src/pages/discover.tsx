import { useState } from "react";
import { useListBusinesses } from "@workspace/api-client-react";
import { Link, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Star, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Discover() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string>("");

  const { data, isLoading } = useListBusinesses({
    search: query || undefined,
    category: activeCategory || undefined,
  }, { query: { queryKey: ['businesses', query, activeCategory] } });

  const categories = ["Restaurant", "Retail", "Service", "Beauty", "Health", "Nightlife"];

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-serif font-bold tracking-tight">Discover</h1>
        <p className="text-muted-foreground text-lg">Support Black-owned excellence in your community.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or keyword..." 
            className="pl-10 h-12 text-md"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={activeCategory === "" ? "default" : "outline"}
          className="px-4 py-2 text-sm cursor-pointer"
          onClick={() => setActiveCategory("")}
        >
          All
        </Badge>
        {categories.map(cat => (
          <Badge 
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className="px-4 py-2 text-sm cursor-pointer"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : data?.businesses.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 text-muted-foreground">
            <Search size={48} className="mx-auto opacity-20" />
            <p className="text-lg">No businesses found matching your criteria.</p>
          </div>
        ) : (
          data?.businesses.map((business) => (
            <Link key={business.id} href={`/businesses/${business.id}`}>
              <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col group">
                <div className="h-48 w-full bg-muted relative overflow-hidden">
                  {business.imageUrl ? (
                    <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-background/90 text-foreground backdrop-blur-sm hover:bg-background/90">{business.category}</Badge>
                    {business.blackOwned && (
                      <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm hover:bg-primary/90">Black Owned</Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col flex-1 gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-xl line-clamp-1">{business.name}</h3>
                    {business.averageRating && (
                      <div className="flex items-center gap-1 text-accent font-medium shrink-0">
                        <Star size={16} fill="currentColor" />
                        <span>{business.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPin size={14} />
                    <span className="line-clamp-1">{business.city}, {business.state}</span>
                  </div>

                  {business.confidenceScore && business.confidenceScore > 80 && (
                    <div className="flex items-center gap-1.5 text-chart-2 text-sm font-medium mt-auto pt-2">
                      <ShieldCheck size={16} />
                      <span>Highly Rated for Safety</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
