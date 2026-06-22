import { useParams, Link } from "wouter";
import { MapPin, Shield, ArrowLeft, Utensils, Music, Coffee, Star, ExternalLink, Compass, CheckCircle } from "lucide-react";
import { useListBusinesses } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CITY_DATA: Record<string, {
  name: string; state: string; tagline: string; description: string;
  safetyScore: number; emoji: string; image: string; searchTerm: string;
  neighborhoods: { name: string; vibe: string; score: number }[];
  mustVisit: { icon: typeof Utensils; label: string; description: string }[];
  travelTips: string[];
  culture: string;
}> = {
  atlanta: {
    name: "Atlanta", state: "GA", tagline: "The Black Mecca of the South", emoji: "🍑",
    image: "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=1400&auto=format&fit=crop",
    searchTerm: "Atlanta",
    description: "Atlanta has long been America's Black cultural capital — home to more Black millionaires, Minority-owned businesses, and HBCUs than almost any other city. From the birthplace of Dr. King to today's booming creative and tech economy, ATL is where Black excellence is not the exception, but the standard.",
    safetyScore: 78,
    culture: "Atlanta's culture blends Southern hospitality with urban ambition. The city's historically Black neighborhoods — Sweet Auburn, Pittsburgh, and West End — are experiencing a renaissance of community investment.",
    neighborhoods: [
      { name: "Sweet Auburn", vibe: "Historic civil rights district", score: 86 },
      { name: "West Midtown", vibe: "Creative arts + dining scene", score: 81 },
      { name: "Decatur", vibe: "Walkable, diverse, family-friendly", score: 88 },
      { name: "East Atlanta Village", vibe: "Local restaurants + music", score: 79 },
    ],
    mustVisit: [
      { icon: Utensils, label: "Cascade Road dining corridor", description: "Miles of Minority-owned restaurants and eateries" },
      { icon: Music, label: "Live music in the West End", description: "Local jazz, R&B, and gospel venues" },
      { icon: Coffee, label: "Minority-owned cafes in Kirkwood", description: "Community-centered coffee and co-working" },
    ],
    travelTips: [
      "Rent a car — MARTA is limited, the city is spread out",
      "Visit the National Center for Civil & Human Rights",
      "Check out the Historic Fourth Ward Park",
      "Attend a game at the HBCU classic each fall",
    ],
  },
  houston: {
    name: "Houston", state: "TX", tagline: "Where Culture Runs Deep", emoji: "🤠",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1400&auto=format&fit=crop",
    searchTerm: "Houston",
    description: "The most diverse city in America, Houston's Third Ward has been the heart of Black Houston for generations. With a thriving Creole food scene, strong HBCUs, and a booming business community, Houston rewards explorers who venture off the beaten path.",
    safetyScore: 74,
    culture: "Houston's Black culture blends Southern tradition with Gulf Coast flavor. The city's Creole heritage creates unique food, music, and cultural expressions found nowhere else.",
    neighborhoods: [
      { name: "Third Ward", vibe: "Historic HBCU corridor", score: 77 },
      { name: "Midtown", vibe: "Nightlife + young professionals", score: 80 },
      { name: "Riverside Terrace", vibe: "Quiet, historic, residential", score: 83 },
      { name: "MacGregor", vibe: "Upscale, established community", score: 85 },
    ],
    mustVisit: [
      { icon: Utensils, label: "Third Ward soul food", description: "Legendary Creole and Southern cooking" },
      { icon: Music, label: "Blues and zydeco venues", description: "Gulf Coast music tradition at its finest" },
      { icon: Coffee, label: "Minority-owned co-working spaces", description: "Growing entrepreneur ecosystem" },
    ],
    travelTips: [
      "The Museum District has world-class African American art collections",
      "Visit Texas Southern University and Prairie View",
      "Try the boudin and crawfish — Houston does Creole like nowhere else",
      "The Fourth Ward (Freedmen's Town) is a historical must-visit",
    ],
  },
  "new-orleans": {
    name: "New Orleans", state: "LA", tagline: "Birthplace of Jazz, Heart of Black Culture", emoji: "🎷",
    image: "https://images.unsplash.com/photo-1568458730946-c04e9fb7d04e?w=1400&auto=format&fit=crop",
    searchTerm: "New Orleans",
    description: "New Orleans is unlike anywhere in America. The oldest African American urban culture in the country, Creole heritage that blends African, French, and Caribbean traditions, and a music scene that birthed jazz — NOLA is a living, breathing testament to Black cultural genius.",
    safetyScore: 71,
    culture: "Creole culture, second lines, Mardi Gras Indians — New Orleans' Black cultural traditions have no parallel. The Tremé neighborhood is the oldest African American neighborhood in the United States.",
    neighborhoods: [
      { name: "Tremé", vibe: "Oldest Black neighborhood in the US", score: 76 },
      { name: "Seventh Ward", vibe: "Traditional Creole community", score: 74 },
      { name: "Central City", vibe: "Up-and-coming arts district", score: 72 },
      { name: "Algiers Point", vibe: "Charming, historic, across the river", score: 78 },
    ],
    mustVisit: [
      { icon: Utensils, label: "Dooky Chase's Restaurant", description: "Legendary Creole fine dining, a civil rights landmark" },
      { icon: Music, label: "Tremé second lines", description: "Authentic street parades every weekend" },
      { icon: Coffee, label: "Café Dumonde-style beignets", description: "Minority-owned cafes with true NOLA flavor" },
    ],
    travelTips: [
      "Walk the Tremé — it's a living museum",
      "Catch a second line parade (check local Facebook groups for schedules)",
      "The jazz clubs on Frenchmen Street (not Bourbon) are the real scene",
      "Try Creole cooking — not just Cajun — they're different cuisines",
    ],
  },
  "washington-dc": {
    name: "Washington", state: "DC", tagline: "Chocolate City, Always", emoji: "🏛️",
    image: "https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=1400&auto=format&fit=crop",
    searchTerm: "Washington",
    description: "DC has been 'Chocolate City' for generations — a center of Black political power, intellectual life, and cultural expression. From the Smithsonian's National Museum of African American History and Culture to the U Street Corridor's rich music history, DC rewards every visit.",
    safetyScore: 80,
    culture: "DC's Black professional class, political history, and museum culture create a uniquely sophisticated atmosphere. Howard University anchors an entire ecosystem of Black excellence.",
    neighborhoods: [
      { name: "U Street Corridor", vibe: "Historic Black Broadway", score: 83 },
      { name: "Shaw", vibe: "Vibrant arts + restaurants", score: 82 },
      { name: "Congress Heights", vibe: "Southeast community anchor", score: 77 },
      { name: "Petworth", vibe: "Residential, diverse, up-and-coming", score: 80 },
    ],
    mustVisit: [
      { icon: Utensils, label: "Ben's Chili Bowl", description: "DC institution since 1958" },
      { icon: Music, label: "Blues Alley Jazz Club", description: "Historic venue in Georgetown" },
      { icon: Coffee, label: "U Street coffee shops", description: "Minority-owned cafes in the heart of the corridor" },
    ],
    travelTips: [
      "The NMAAHC (African American Museum) requires timed entry — book in advance",
      "Howard University's campus is open to visitors — the yard is beautiful",
      "Take the U Street walking tour for civil rights and music history",
      "Metro is excellent — you don't need a car here",
    ],
  },
  "new-york": {
    name: "New York", state: "NY", tagline: "Harlem to Brooklyn — Black Excellence Everywhere", emoji: "🗽",
    image: "https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=1400&auto=format&fit=crop",
    searchTerm: "New York",
    description: "New York's Black communities have shaped global culture for over a century. Harlem's Renaissance, Brooklyn's creative explosion, the Bronx's hip-hop birthplace — NYC has more Black history per block than almost any city on Earth.",
    safetyScore: 82,
    culture: "From the Harlem Renaissance to Brooklyn hip-hop, NYC's Black cultural contributions are foundational to American and global culture. The sheer density of Black creative, business, and intellectual life here is unmatched.",
    neighborhoods: [
      { name: "Harlem", vibe: "Historic capital of Black America", score: 82 },
      { name: "Bed-Stuy", vibe: "Brooklyn's creative Black hub", score: 81 },
      { name: "Crown Heights", vibe: "Caribbean culture + community", score: 79 },
      { name: "South Bronx", vibe: "Hip-hop birthplace", score: 76 },
    ],
    mustVisit: [
      { icon: Utensils, label: "Harlem restaurant row", description: "Soul food, Caribbean, and global Black cuisine" },
      { icon: Music, label: "Live jazz and gospel in Harlem", description: "Sunday gospel at Abyssinian Baptist Church" },
      { icon: Coffee, label: "Brooklyn Minority-owned cafes", description: "Bed-Stuy's thriving café culture" },
    ],
    travelTips: [
      "Take the A/C/E to 125th St for Harlem — walk the whole strip",
      "The Studio Museum in Harlem is world-class",
      "Bed-Stuy and Crown Heights are best explored by bike or on foot",
      "Check local event listings — there's always a Black cultural event happening",
    ],
  },
  chicago: {
    name: "Chicago", state: "IL", tagline: "The Bronzeville Beat", emoji: "🌬️",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1400&auto=format&fit=crop",
    searchTerm: "Chicago",
    description: "Chicago's South Side is one of the most historically significant Black communities in America. Bronzeville — the 'Black Metropolis' — was once the most important Black urban center outside New York. Today, the city's deep blues and house music heritage, incredible cuisine, and strong business community make it essential.",
    safetyScore: 73,
    culture: "Chicago gave the world the electric blues, house music, and a distinct South Side culture that's shaped everything from fashion to food. The city's Black community has always been a force of cultural innovation.",
    neighborhoods: [
      { name: "Bronzeville", vibe: "Historic Black Metropolis", score: 77 },
      { name: "South Shore", vibe: "Lake Michigan + community pride", score: 75 },
      { name: "Chatham", vibe: "Solid, established South Side", score: 79 },
      { name: "Hyde Park", vibe: "University + Obama's neighborhood", score: 83 },
    ],
    mustVisit: [
      { icon: Utensils, label: "South Side soul food", description: "Decades-old family restaurants and ribs joints" },
      { icon: Music, label: "Chicago blues clubs", description: "Buddy Guy's Legends and the historic venues" },
      { icon: Coffee, label: "Hyde Park cafes", description: "Intellectual, community-driven coffee culture" },
    ],
    travelTips: [
      "The DuSable Black History Museum is a must",
      "Visit Obama's former neighborhood in Hyde Park",
      "Try Harold's Chicken — it's a Chicago institution",
      "Catch live blues on a Friday or Saturday night — it's transcendent",
    ],
  },
};

export default function CitySpotlight() {
  const params = useParams<{ city: string }>();
  const citySlug = params.city;
  const city = CITY_DATA[citySlug];

  const { data, isLoading } = useListBusinesses(
    { search: city?.searchTerm, limit: 6 },
    { query: { queryKey: ['businesses', city?.searchTerm], enabled: !!city } }
  );

  if (!city) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">City not found</h1>
          <Link href="/cities"><Button>Browse All Cities</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[440px] overflow-hidden">
        <img src={city.image} alt={city.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0c04] via-[#2B1507]/70 to-[#2B1507]/40" />
        <div className="absolute inset-0 flex flex-col justify-end pb-12 px-6 md:px-12 max-w-6xl mx-auto w-full left-0 right-0">
          <Link href="/cities" className="flex items-center gap-2 text-[#F5EBD8]/70 hover:text-[#F5EBD8] mb-6 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Cities
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-5xl">{city.emoji}</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
              <Shield className="w-3.5 h-3.5 text-[#CA922B]" />
              <span className="text-white text-xs font-bold">Safety Score: {city.safetyScore}/100</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight mb-2">
            {city.name}<span className="text-[#CA922B]">,</span> {city.state}
          </h1>
          <p className="text-[#CA922B] font-semibold text-lg md:text-xl">{city.tagline}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 max-w-6xl py-16 space-y-16">
        {/* About */}
        <section>
          <p className="text-[#3A1F0E]/80 text-lg md:text-xl leading-relaxed max-w-4xl">{city.description}</p>
        </section>

        {/* Neighborhoods */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <MapPin className="text-[#CA922B] w-5 h-5" />
            <h2 className="text-3xl font-serif font-bold text-[#3A1F0E]">Key Neighborhoods</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {city.neighborhoods.map((n) => (
              <div key={n.name} className="bg-white rounded-2xl p-5 border border-[#2B1507]/8 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#3A1F0E] text-sm">{n.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#CA922B]">
                    <Shield className="w-3 h-3" />{n.score}
                  </div>
                </div>
                <p className="text-[#3A1F0E]/60 text-xs leading-relaxed">{n.vibe}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Must Visit */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Star className="text-[#CA922B] w-5 h-5" />
            <h2 className="text-3xl font-serif font-bold text-[#3A1F0E]">Must-Experience</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {city.mustVisit.map((m) => (
              <div key={m.label} className="bg-[#2B1507] rounded-2xl p-6 text-white">
                <m.icon className="w-6 h-6 text-[#CA922B] mb-3" />
                <h3 className="font-bold mb-2">{m.label}</h3>
                <p className="text-[#F5EBD8]/70 text-sm">{m.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Travel Tips */}
        <section>
          <div className="bg-[#FAF6EF] rounded-3xl p-8 border border-[#CA922B]/20">
            <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-6">Community Travel Tips</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {city.travelTips.map((tip) => (
                <div key={tip} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#CA922B] shrink-0 mt-0.5" />
                  <p className="text-[#3A1F0E]/80 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Businesses in this city */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Compass className="text-[#CA922B] w-5 h-5" />
              <h2 className="text-3xl font-serif font-bold text-[#3A1F0E]">Businesses in {city.name}</h2>
            </div>
            <Link href={`/discover?q=${city.searchTerm}`}>
              <Button variant="outline" className="rounded-full border-[#2B1507]/20 text-[#3A1F0E] hover:border-[#CA922B] hover:text-[#CA922B]">
                View All <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
            </div>
          ) : data?.businesses && data.businesses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.businesses.map((biz) => (
                <Link key={biz.id} href={`/businesses/${biz.id}`}>
                  <div className="group bg-white rounded-2xl overflow-hidden border border-[#2B1507]/8 shadow-sm hover:shadow-md hover:border-[#CA922B]/30 transition-all cursor-pointer">
                    {biz.imageUrl ? (
                      <img src={biz.imageUrl} alt={biz.name} className="w-full h-36 object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-36 bg-[#FAF6EF] flex items-center justify-center">
                        <Compass className="w-8 h-8 text-[#2B1507]/20" />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-[#CA922B] text-[10px] font-bold uppercase tracking-wider mb-1">{biz.category}</p>
                      <h3 className="font-serif font-bold text-[#3A1F0E] leading-tight">{biz.name}</h3>
                      <p className="text-xs text-[#3A1F0E]/50 mt-1">{biz.city}, {biz.state}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#3A1F0E]/50">
              <Compass className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Businesses coming soon. Be the first to list yours.</p>
              <Link href="/for-business-owners">
                <Button className="mt-4 rounded-full bg-[#2B1507] text-white hover:bg-[#1a0c04]">List Your Business</Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
