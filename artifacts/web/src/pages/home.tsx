import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Compass, Search, MapPin, Users, Calendar } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/discover?q=${encodeURIComponent(search)}`);
    } else {
      setLocation('/discover');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-40 px-6 lg:px-8 overflow-hidden bg-primary/5">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-foreground mb-6">
              Celebrate <span className="text-primary">Black Culture</span> Everywhere You Go
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Discover Black-owned businesses, community events, and safe spaces in your neighborhood.
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto relative flex items-center shadow-lg rounded-full bg-background border p-2">
              <Search className="absolute left-6 text-muted-foreground" size={24} />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search businesses, restaurants, services..." 
                className="border-0 focus-visible:ring-0 pl-14 h-14 text-lg bg-transparent"
              />
              <Button type="submit" size="lg" className="rounded-full px-8 h-12 ml-2">
                Discover
              </Button>
            </form>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Compass size={32} />
              </div>
              <h3 className="text-2xl font-semibold font-serif">Discover Businesses</h3>
              <p className="text-muted-foreground leading-relaxed">
                Find highly-rated Black-owned restaurants, boutiques, and professional services in your area.
              </p>
              <Link href="/discover" className="text-primary font-medium hover:underline mt-2">Explore Directory</Link>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-chart-2/10 text-chart-2 flex items-center justify-center mb-4">
                <MapPin size={32} />
              </div>
              <h3 className="text-2xl font-semibold font-serif">Neighborhood Safety</h3>
              <p className="text-muted-foreground leading-relaxed">
                Read community-sourced safety surveys and neighborhood tips before you travel.
              </p>
              <Link href="/safety" className="text-primary font-medium hover:underline mt-2">View Safety Data</Link>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-chart-4/10 text-chart-4 flex items-center justify-center mb-4">
                <Calendar size={32} />
              </div>
              <h3 className="text-2xl font-semibold font-serif">Community Events</h3>
              <p className="text-muted-foreground leading-relaxed">
                RSVP to local pop-ups, festivals, networking events, and cultural celebrations.
              </p>
              <Link href="/events" className="text-primary font-medium hover:underline mt-2">Browse Events</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
