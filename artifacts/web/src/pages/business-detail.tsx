import { useRoute, Link } from "wouter";
import { VIBES_BY_CATEGORY } from "@workspace/db";
import { 
  useGetBusiness, 
  useListReviews, 
  useSavePlace, 
  useUnsavePlace, 
  useCreateReview,
  useGetCurrentAuthUser,
  useListSavedPlaces
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, Bookmark, BookmarkCheck, Phone, Globe, ShieldCheck, Clock, Navigation, Zap, BookOpen, Lock, CheckSquare, Shield, ChevronDown, ChevronUp, Share2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function getOpenStatus(hours: string | null | undefined): { open: boolean; label: string } | null {
  if (!hours) return null;
  const h = hours.toLowerCase().trim();
  if (h === "closed" || h === "temporarily closed") return { open: false, label: "Temporarily Closed" };
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  function parseTime(t: string): number | null {
    const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (!m) return null;
    let hr = parseInt(m[1]);
    const min = m[2] ? parseInt(m[2]) : 0;
    const ap = m[3].toLowerCase();
    if (ap === "pm" && hr !== 12) hr += 12;
    if (ap === "am" && hr === 12) hr = 0;
    return hr * 60 + min;
  }
  const rangeMatch = h.match(/(\d{1,2}(?::\d{2})?\s*[ap]m)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*[ap]m)/i);
  if (!rangeMatch) return null;
  const open = parseTime(rangeMatch[1]);
  const close = parseTime(rangeMatch[2]);
  if (open === null || close === null) return null;
  const isOpen = mins >= open && mins < close;
  return { open: isOpen, label: isOpen ? "Open Now" : "Closed Now" };
}

function BusinessMapEmbed({ business }: { business: { name?: string | null; address?: string | null; city?: string | null; state?: string | null } }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = [business.name, business.address, business.city, business.state].filter(Boolean).join(", ");
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/maps/embed-url?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => { if (d.url) setEmbedUrl(d.url); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) {
    return <div className="w-full h-64 rounded-2xl bg-[#FAF6EF] animate-pulse border border-[#2B1507]/10" aria-label="Loading map" />;
  }

  if (embedUrl) {
    return (
      <div className="space-y-3">
        <iframe
          src={embedUrl}
          title={`Map showing ${business.name ?? "business location"}`}
          className="w-full h-72 rounded-2xl border border-[#2B1507]/10 shadow-sm"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-[#CA922B] font-semibold hover:underline"
        >
          <Navigation size={14} />
          Open in Google Maps
        </a>
      </div>
    );
  }

  return (
    <a
      href={gmapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full h-64 rounded-2xl overflow-hidden border border-[#2B1507]/10 relative bg-[#FAF6EF] group cursor-pointer"
      aria-label={`View ${business.name ?? "business"} on Google Maps`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center shadow-lg border border-[#CA922B]/20 group-hover:shadow-xl transition-shadow">
          <MapPin className="w-8 h-8 text-[#CA922B] mb-2" aria-hidden="true" />
          <span className="font-bold text-[#3A1F0E]">{business.city}{business.state ? `, ${business.state}` : ""}</span>
          <span className="text-xs text-[#CA922B] font-semibold mt-1">View on Google Maps →</span>
        </div>
      </div>
    </a>
  );
}

export default function BusinessDetail() {
  const [, paramsLong] = useRoute("/businesses/:id");
  const [, paramsShort] = useRoute("/business/:id");
  const id = paramsLong?.id || paramsShort?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prevMetaRef = useRef<{ title: string; ogTitle: string | null; ogDesc: string | null; ogImage: string | null }>({ title: "", ogTitle: null, ogDesc: null, ogImage: null });

  const { data: auth } = useGetCurrentAuthUser();
  const { data: businessData, isLoading: isLoadingBusiness } = useGetBusiness(id, { query: { queryKey: ['getBusiness', id], enabled: !!id } });
  const business = businessData?.business;
  const { data: reviewsData, isLoading: isLoadingReviews } = useListReviews({ businessId: id });
  const reviews = reviewsData?.reviews ?? [];
  const { data: savedPlaces } = useListSavedPlaces({ query: { queryKey: ['listSavedPlaces'], enabled: !!auth?.user } });

  const savePlace = useSavePlace();
  const unsavePlace = useUnsavePlace();
  const createReview = useCreateReview();

  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deals, setDeals] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [myVibes, setMyVibes] = useState<string[]>([]);
  const [vibeLoading, setVibeLoading] = useState<string | null>(null);
  const [vibeToasts, setVibeToasts] = useState<Record<string, number>>({});
  const [endorsementTags, setEndorsementTags] = useState<{ tagKey: string; label: string; count: number }[]>([]);

  // Categories that use THE REAL (professional trust tags) instead of Community Vibes.
  // Per the Master Directory and Three-Layer Architecture spec.
  const NO_VIBE_CATEGORIES = new Set([
    "Professional Services",
    "Home & Property Services",
    "Automotive & Transportation",
    "Pets & Animal Services",
    "Technology & Digital Services",
    "Financial & Business Services",
    "Legal & Government Services",
    "Other Services",
  ]);

  // Converts a canonical vibe label to a DB-safe id key.
  // "Hood Classic" → "hood_classic", "Grown & Sexy" → "grown_sexy"
  const toVibeId = (label: string) =>
    label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  // Pull vibes for a given business category from the master canonical source (@workspace/db).
  // Falls back to a curated cross-category set so every eligible business has vibes.
  const FALLBACK_VIBES = [
    "Locals Know", "Auntie Energy", "Hood Classic", "Soft Life",
    "Neighborhood Love", "History Lives Here", "Sunday Best", "Take Somebody From Out of Town",
  ];
  const getVibesForCat = (cat: string): { id: string; label: string; helperText: string }[] => {
    const canonical = VIBES_BY_CATEGORY[cat];
    if (canonical && canonical.length > 0) {
      return canonical.map((v) => ({ id: toVibeId(v.label), label: v.label, helperText: v.helperText }));
    }
    return FALLBACK_VIBES.map((label) => {
      const found = Object.values(VIBES_BY_CATEGORY).flat().find((v) => v.label === label);
      return { id: toVibeId(label), label, helperText: found?.helperText ?? "" };
    });
  };

  useEffect(() => {
    if (!auth?.user || !id) return;
    const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${apiBase}/api/vibes/businesses/${id}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (Array.isArray(d?.myTags)) setMyVibes(d.myTags); })
      .catch(() => {});
  }, [auth?.user, id]);

  useEffect(() => {
    if (!id) return;
    const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${apiBase}/api/vibes/endorsements/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (Array.isArray(d?.tags)) setEndorsementTags(d.tags); })
      .catch(() => {});
  }, [id]);

  async function handleVibe(vibe: string) {
    if (!auth?.user) {
      toast({ title: "Sign in to add a vibe", description: "Create a free account to interact with businesses." });
      return;
    }
    if (vibeLoading) return;
    const isActive = myVibes.includes(vibe);
    setVibeLoading(vibe);
    const apiBase = BASE_URL.replace(/\/$/, "");
    try {
      const res = await fetch(`${apiBase}/api/vibes/tag`, {
        method: isActive ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessId: id, vibe }),
      });
      if (res.ok) {
        setMyVibes((prev) => isActive ? prev.filter((v) => v !== vibe) : [...prev, vibe]);
        if (!isActive) {
          setVibeToasts((prev) => ({ ...prev, [vibe]: (prev[vibe] ?? 0) + 1 }));
        }
      }
    } catch { /**/ }
    finally { setVibeLoading(null); }
  }

  async function handleHiddenGem() { return handleVibe("hidden_gem"); }

  const [claimOpen, setClaimOpen] = useState(false);
  const [claimName, setClaimName] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimRole, setClaimRole] = useState("owner");
  const [claimWebsite, setClaimWebsite] = useState("");
  const [claimInstagram, setClaimInstagram] = useState("");
  const [claimInfo, setClaimInfo] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  async function handleClaimSubmit() {
    if (!claimName.trim() || !claimEmail.trim()) {
      setClaimError("Name and email are required."); return;
    }
    setClaimError(null);
    setClaimLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/businesses/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: business?.name ?? "",
          ownerName: claimName.trim(),
          email: claimEmail.trim(),
          phone: claimPhone.trim() || null,
          role: claimRole,
          website: claimWebsite.trim() || null,
          instagramHandle: claimInstagram.replace("@", "").trim() || null,
          additionalInfo: claimInfo.trim() || null,
        }),
      });
      if (res.ok) {
        setClaimSubmitted(true);
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setClaimError(body.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setClaimError("Unable to submit. Check your connection and try again.");
    } finally {
      setClaimLoading(false);
    }
  }

  const isSaved = savedPlaces?.businessIds?.includes(id);

  const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");
  useEffect(() => {
    if (!id) return;
    fetch(`${BASE_URL}/api/deals/${id}`).then(r => r.json()).then(d => setDeals(d.deals ?? [])).catch(() => {});
    fetch(`${BASE_URL}/api/stories/${id}`).then(r => r.json()).then(d => setStories(d.stories ?? [])).catch(() => {});
  }, [id]);

  // Inject OG meta tags for social sharing (supplements server-side OG for in-SPA navigation)
  useEffect(() => {
    if (!business) return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const ogImageUrl = `${window.location.origin}${base}/api/og/business/${id}`;
    const title = `${business.name} — Mapping With Melanin™`;
    const description = `${business.category} in ${business.city ?? ""}${business.state ? `, ${business.state}` : ""}. Discover minority-owned businesses on Mapping With Melanin™.`;

    const getOrCreate = (prop: string): HTMLMetaElement => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
      return el;
    };

    const prev = prevMetaRef.current;
    prev.title = document.title;
    prev.ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? null;
    prev.ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content ?? null;
    prev.ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? null;

    document.title = title;
    getOrCreate("og:title").content = title;
    getOrCreate("og:description").content = description;
    getOrCreate("og:image").content = ogImageUrl;
    getOrCreate("og:type").content = "place";
    getOrCreate("og:url").content = window.location.href;
    getOrCreate("twitter:card").setAttribute("content", "summary_large_image");

    return () => {
      document.title = prev.title || "Mapping With Melanin™";
      if (prev.ogTitle !== null) getOrCreate("og:title").content = prev.ogTitle;
      if (prev.ogDesc !== null) getOrCreate("og:description").content = prev.ogDesc;
      if (prev.ogImage !== null) getOrCreate("og:image").content = prev.ogImage;
    };
  }, [business, id]);


  const handleSaveToggle = () => {
    if (!auth?.user) {
      toast({ title: "Sign in required", description: "Please sign in to save places." });
      return;
    }
    if (isSaved) {
      unsavePlace.mutate({ businessId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listSavedPlaces"] });
          toast({ title: "Removed from saved places" });
        }
      });
    } else {
      savePlace.mutate({ data: { businessId: id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listSavedPlaces"] });
          toast({ title: "Added to saved places" });
        }
      });
    }
  };

  const handleCheckIn = async () => {
    if (!auth?.user) {
      toast({ title: "Sign in required", description: "Please sign in to check in." });
      return;
    }
    if (checkInDone) return;
    setCheckInLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setCheckInDone(true);
        toast({ title: `✓ Checked in! +${data.pointsEarned ?? 10} points earned` });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Already checked in", description: err.error ?? "You've already checked in here today.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Check-in failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    setIsSubmitting(true);
    createReview.mutate({ data: { businessId: id, text: reviewText, rating } }, {
      onSuccess: () => {
        setReviewText("");
        setRating(5);
        queryClient.invalidateQueries({ queryKey: ["listReviews", { businessId: id }] });
        toast({ title: "Review submitted successfully" });
      },
      onError: (err: any) => {
        const status = err?.response?.status ?? err?.status;
        if (status === 403) {
          setShowUpgrade(true);
        } else {
          toast({ title: "Could not submit review", description: "Please try again.", variant: "destructive" });
        }
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  };

  if (isLoadingBusiness) {
    return (
      <div className="flex flex-col w-full bg-[#FAF6EF] min-h-screen animate-pulse">
        <div className="h-[60vh] w-full bg-[#2B1507]/10" />
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="h-12 w-1/3 bg-[#2B1507]/10 rounded mb-4" />
          <div className="h-6 w-1/4 bg-[#2B1507]/10 rounded" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center text-center p-10">
        <h2 className="text-3xl font-serif text-[#3A1F0E] mb-4">Business not found</h2>
        <Button variant="outline" onClick={() => window.history.back()} className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex flex-col w-full pb-24">
      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-[#CA922B]/20">
            <div className="w-16 h-16 rounded-full bg-[#CA922B]/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#CA922B]" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#2B1507] mb-2">Navigator Required</h2>
            <p className="text-[#3A1F0E]/70 text-sm mb-6 leading-relaxed">
              Submitting reviews is a Navigator+ feature. Upgrade to share your experience and help the community.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { window.location.href = "/membership"; }}
                className="w-full py-3 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold text-sm transition-colors"
              >
                Upgrade to Navigator →
              </button>
              <button
                onClick={() => setShowUpgrade(false)}
                className="w-full py-3 rounded-full text-[#3A1F0E]/60 text-sm font-medium hover:text-[#3A1F0E] transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div data-testid="business-hero" className="relative w-full h-[50vh] md:h-[60vh] bg-[#2B1507]">
        {business.imageUrl && (
          <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507] via-[#2B1507]/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 container mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-white max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span data-testid="business-category" className="bg-[#CA922B] text-white text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                  {business.category}
                </span>
                {business.description?.startsWith("[DEMO]") && (
                  <span className="bg-amber-100 text-amber-700 border border-amber-300 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Demo Listing
                  </span>
                )}
                {/* confidenceScore is an internal metric — never shown; community builds scores */}
              </div>
              <h1 data-testid="business-name" className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-2">{business.name}</h1>
              <div className="flex items-center gap-2 text-[#F5EBD8] text-lg">
                <MapPin size={18} />
                <span>{business.city}, {business.state}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                data-testid="business-share-btn"
                variant="outline"
                onClick={async () => {
                  const url = window.location.href;
                  if (navigator.share) {
                    await navigator.share({ title: business.name ?? undefined, url });
                  } else {
                    await navigator.clipboard.writeText(url).catch(() => {});
                    toast({ title: "Link copied to clipboard" });
                  }
                }}
                className="rounded-full h-12 px-6 border-white/20 backdrop-blur-md bg-black/30 text-white hover:bg-white hover:text-[#2B1507]"
              >
                <Share2 className="mr-2 w-5 h-5" /> Share
              </Button>
              <Button 
                onClick={handleSaveToggle} 
                variant="outline" 
                className={`rounded-full h-12 px-6 border-white/20 backdrop-blur-md ${isSaved ? "bg-white text-[#2B1507]" : "bg-black/30 text-white hover:bg-white hover:text-[#2B1507]"}`}
              >
                {isSaved ? <><BookmarkCheck className="mr-2 w-5 h-5" /> Saved</> : <><Bookmark className="mr-2 w-5 h-5" /> Save</>}
              </Button>
              <Button
                onClick={handleCheckIn}
                disabled={checkInDone || checkInLoading}
                variant="outline"
                className={`rounded-full h-12 px-6 border-white/20 backdrop-blur-md ${checkInDone ? "bg-green-500/80 text-white border-green-400/40" : "bg-black/30 text-white hover:bg-white hover:text-[#2B1507]"}`}
              >
                <CheckSquare className="mr-2 w-5 h-5" />
                {checkInDone ? "Checked In ✓" : checkInLoading ? "Checking in…" : "Check In"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 mt-8">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column - Details */}
          <div className="flex-1">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-[#2B1507]/10 rounded-none h-14 p-0 space-x-8 mb-8">
                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#CA922B] rounded-none px-0 h-14 font-serif text-lg text-[#3A1F0E]/60 data-[state=active]:text-[#3A1F0E]">Overview</TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#CA922B] rounded-none px-0 h-14 font-serif text-lg text-[#3A1F0E]/60 data-[state=active]:text-[#3A1F0E]">Reviews</TabsTrigger>
                {stories.length > 0 && (
                  <TabsTrigger value="stories" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#CA922B] rounded-none px-0 h-14 font-serif text-lg text-[#3A1F0E]/60 data-[state=active]:text-[#3A1F0E]">
                    <BookOpen size={16} className="mr-1.5" />Stories
                  </TabsTrigger>
                )}
                <TabsTrigger value="location" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#CA922B] rounded-none px-0 h-14 font-serif text-lg text-[#3A1F0E]/60 data-[state=active]:text-[#3A1F0E]">Location & Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8 animate-in fade-in">
                {/* Photo Gallery */}
                {(() => {
                  const photos: string[] = (business as unknown as { photos?: string[] }).photos ?? [];
                  const allPhotos = [
                    ...(business.imageUrl ? [business.imageUrl] : []),
                    ...photos.filter(p => p !== business.imageUrl),
                  ];
                  if (allPhotos.length <= 1) return null;
                  return (
                    <div>
                      <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mb-4 flex items-center gap-2">
                        <span>Photos</span>
                        <span className="text-sm font-sans font-normal text-[#3A1F0E]/40">({allPhotos.length})</span>
                      </h3>
                      <div className={`grid gap-2 ${allPhotos.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
                        {allPhotos.map((src, i) => (
                          <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                            className={`block relative overflow-hidden rounded-2xl bg-[#3A1F0E]/5 group ${i === 0 && allPhotos.length >= 3 ? "col-span-2 md:col-span-1 md:row-span-2" : ""}`}
                            style={{ aspectRatio: i === 0 && allPhotos.length >= 3 ? "16/9" : "4/3" }}>
                            <img src={src} alt={`${business.name ?? ""} photo ${i + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="prose prose-lg text-[#3A1F0E]/80 font-light leading-relaxed">
                  <p>{(business.description?.replace(/^\[DEMO\]\s*/i, "") || "Discover this exceptional business. They provide quality service and a welcoming environment for the community.")}</p>
                </div>
                
                {/* Ownership designation — shows self-identified designation, not "Verified Black-Owned"
                    Per Map Pin & Living Pages Fix spec: "Verified" should refer to the business being
                    real, NOT to the owner's race/ethnicity being verified. */}
                {(() => {
                  const designations: string[] = (business as any).ownershipDesignations ?? [];
                  const primaryDesignation = designations[0] ?? (business.blackOwned ? "Black / African American-Owned" : null);
                  if (!primaryDesignation) return null;
                  return (
                    <div className="bg-white rounded-2xl p-6 border border-[#2B1507]/5 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="text-[#CA922B] w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mb-1">{primaryDesignation}</h3>
                        {designations.length > 1 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {designations.slice(1).map((d: string) => (
                              <span key={d} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#CA922B]/10 text-[#CA922B] border border-[#CA922B]/20">{d}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-[#3A1F0E]/70 text-sm">Ownership self-identified by this business. Supporting minority-owned enterprises strengthens the whole community.</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Community Vibes — hidden for professional/service categories that use THE REAL instead.
                    Per Master Directory: Professional Services, Home & Property, Automotive, etc. use
                    endorsement tags only. Vibes are for experience-based categories. */}
                {!NO_VIBE_CATEGORIES.has(business.category ?? "") && (() => {
                  const vibesForCategory = getVibesForCat(business.category ?? "");
                  return (
                    <div className="bg-white rounded-2xl p-6 border border-[#2B1507]/5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-serif font-bold text-xl text-[#3A1F0E]">Community Vibes</h3>
                        <span className="text-xs text-[#3A1F0E]/40 font-medium">
                          {auth?.user ? "Tap to tag your experience" : "Sign in to add vibes"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {vibesForCategory.map((v) => {
                          const active = myVibes.includes(v.id);
                          const loading = vibeLoading === v.id;
                          return (
                            <button
                              key={v.id}
                              onClick={() => handleVibe(v.id)}
                              disabled={loading}
                              title={v.helperText}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 ${
                                active
                                  ? "bg-[#CA922B] border-[#CA922B] text-white shadow-sm"
                                  : "bg-[#FAF6EF] border-[#2B1507]/10 text-[#3A1F0E]/70 hover:border-[#CA922B] hover:text-[#CA922B]"
                              } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {v.label}
                              {vibeToasts[v.id] ? (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-[#CA922B]/10 text-[#CA922B]"}`}>
                                  +{vibeToasts[v.id]}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* What The Community Said — Endorsement Tags */}
                {endorsementTags.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-[#2B1507]/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-serif font-bold text-xl text-[#3A1F0E]">What The Community Said</h3>
                        <p className="text-xs text-[#3A1F0E]/40 mt-0.5">Tags added by community members who've visited</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {endorsementTags.map((tag) => (
                        <div
                          key={tag.tagKey}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#FAF6EF] border border-[#2B1507]/10 text-[#3A1F0E]/80"
                        >
                          <span>{tag.label}</span>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-[#CA922B]/10 text-[#CA922B]">
                            {tag.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flash Deals */}
                {deals.length > 0 && (
                  <div>
                    <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[#CA922B]" /> Flash Deals
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {deals.map((deal: any) => (
                        <div key={deal.id} className="bg-white rounded-2xl p-5 border border-[#CA922B]/20 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-[#CA922B] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                            {deal.discount ?? "Special Offer"}
                          </div>
                          <h4 className="font-serif font-bold text-[#3A1F0E] mb-1 pr-16">{deal.title}</h4>
                          <p className="text-[#3A1F0E]/70 text-sm mb-3">{deal.description}</p>
                          {deal.validUntil && (
                            <div className="flex items-center gap-1.5 text-xs text-[#CA922B] font-bold">
                              <Clock size={12} />
                              Ends {new Date(deal.validUntil).toLocaleDateString()}
                            </div>
                          )}
                          {deal.membershipRequired && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                              <Lock size={9} /> Navigator+
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Stories tab content */}
              {stories.length > 0 && (
                <TabsContent value="stories" className="space-y-6 animate-in fade-in">
                  {stories.map((story: any) => (
                    <div key={story.id} className="bg-white rounded-2xl p-6 border border-[#2B1507]/5 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          story.type === "offer" ? "bg-green-100 text-green-700" :
                          story.type === "event" ? "bg-blue-100 text-blue-700" :
                          story.type === "milestone" ? "bg-purple-100 text-purple-700" :
                          "bg-[#FAF6EF] text-[#CA922B]"
                        }`}>
                          {story.type ?? "Update"}
                        </span>
                        {story.expiresAt && (
                          <span className="text-xs text-[#3A1F0E]/50 flex items-center gap-1">
                            <Clock size={11} />
                            Expires {new Date(story.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {story.mediaUrl && (
                        <img src={story.mediaUrl} alt={story.title} className="w-full h-48 object-cover rounded-xl mb-4" />
                      )}
                      <h4 className="font-serif font-bold text-lg text-[#3A1F0E] mb-2">{story.title}</h4>
                      <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">{story.content}</p>
                    </div>
                  ))}
                </TabsContent>
              )}

              <TabsContent value="reviews" className="space-y-8 animate-in fade-in">
                <div className="flex items-center gap-6 bg-white p-6 rounded-2xl border border-[#2B1507]/5">
                  <div className="flex flex-col items-center justify-center p-4 bg-[#FAF6EF] rounded-xl min-w-[120px]">
                    <span className="text-4xl font-serif font-bold text-[#3A1F0E]">{business.averageRating?.toFixed(1) || "—"}</span>
                    <div className="flex text-[#CA922B] my-1">
                      {Array.from({length: 5}).map((_, i) => (
                        <Star key={i} size={14} fill={i < Math.round(business.averageRating || 0) ? "currentColor" : "none"} strokeWidth={i < Math.round(business.averageRating || 0) ? 0 : 2} />
                      ))}
                    </div>
                    <span className="text-xs text-[#3A1F0E]/50 uppercase tracking-wider font-bold">{business.reviewCount || 0} Reviews</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mb-2">Community Voices</h3>
                    <p className="text-[#3A1F0E]/70 text-sm">Read what the Melanin Maps community has to say about their experience.</p>
                  </div>
                </div>

                {auth?.user ? (
                  <div className="bg-white p-6 rounded-2xl border border-[#2B1507]/5">
                    <h4 className="font-serif font-bold text-lg mb-4 text-[#3A1F0E]">Leave a Review</h4>
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm font-medium text-[#3A1F0E]">Rating</span>
                        <div className="flex gap-1 cursor-pointer">
                          {[1,2,3,4,5].map(r => (
                            <button key={r} type="button" onClick={() => setRating(r)} className={r <= rating ? "text-[#CA922B]" : "text-[#2B1507]/20"}>
                              <Star size={24} fill={r <= rating ? "currentColor" : "none"} strokeWidth={r <= rating ? 0 : 2} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea 
                        placeholder="Share your experience with the community..." 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={4}
                        className="bg-[#FAF6EF] border-[#2B1507]/10 focus-visible:ring-[#CA922B] resize-none rounded-xl"
                      />
                      <Button type="submit" disabled={isSubmitting} className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white">
                        Submit Review
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-[#2B1507]/5 p-6 rounded-2xl text-center border border-[#2B1507]/10">
                    <p className="text-[#3A1F0E]/70 mb-4">Sign in to share your experience.</p>
                    <Button variant="outline" onClick={() => window.location.href='/login'} className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white">Sign In</Button>
                  </div>
                )}

                <div className="space-y-6">
                  {isLoadingReviews ? (
                    <Skeleton className="h-32 w-full rounded-2xl" />
                  ) : reviews?.length === 0 ? (
                    <p className="text-[#3A1F0E]/50 text-center py-8">No reviews yet.</p>
                  ) : (
                    reviews?.map((review) => (
                      <div key={review.id} className="bg-white p-6 rounded-2xl border border-[#2B1507]/5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-bold text-[#3A1F0E]">{review.authorName || "Community Member"}</div>
                          <div className="flex text-[#CA922B]">
                            {Array.from({length: 5}).map((_, i) => (
                              <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[#3A1F0E]/80 text-sm leading-relaxed">{review.text}</p>
                        <div className="text-xs text-[#3A1F0E]/40 mt-4 uppercase tracking-wider font-bold">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-8 animate-in fade-in">
                <BusinessMapEmbed business={business} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Info Card */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-[#2B1507]/10 p-6 sticky top-28 shadow-[0_8px_30px_rgba(43,21,7,0.05)]">
              <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mb-6">Contact & Info</h3>
              
              <div className="space-y-5">
                {business.address && (
                  <div className="flex items-start gap-4 text-[#3A1F0E]/80 text-sm">
                    <MapPin className="w-5 h-5 text-[#CA922B] shrink-0 mt-0.5" />
                    <div>
                      <div>{business.address}</div>
                      <div>{business.city}, {business.state}</div>
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(`${business.address} ${business.city} ${business.state}`)}`} target="_blank" rel="noreferrer" className="text-[#CA922B] font-medium hover:underline inline-flex items-center gap-1 mt-1">
                        Get Directions <Navigation size={12} />
                      </a>
                    </div>
                  </div>
                )}
                
                {business.phone && (
                  <div className="flex items-center gap-4 text-[#3A1F0E]/80 text-sm">
                    <Phone className="w-5 h-5 text-[#CA922B] shrink-0" />
                    <a data-testid="business-call-link" href={`tel:${business.phone}`} className="hover:text-[#CA922B]">{business.phone}</a>
                  </div>
                )}
                
                {business.website && (
                  <div className="flex items-center gap-4 text-[#3A1F0E]/80 text-sm">
                    <Globe className="w-5 h-5 text-[#CA922B] shrink-0" />
                    <a href={business.website} target="_blank" rel="noreferrer" className="hover:text-[#CA922B] truncate">{business.website.replace(/^https?:\/\//, '')}</a>
                  </div>
                )}

                {business.priceRange && (
                  <div className="flex items-center gap-4 text-[#3A1F0E]/80 text-sm">
                    <div className="w-5 h-5 rounded-full bg-[#CA922B]/10 text-[#CA922B] flex items-center justify-center font-bold text-xs shrink-0">$</div>
                    <span>{business.priceRange}</span>
                  </div>
                )}

                <div className="flex items-start gap-4 text-[#3A1F0E]/80 text-sm pt-5 border-t border-[#2B1507]/10">
                  <Clock className="w-5 h-5 text-[#CA922B] shrink-0 mt-0.5" />
                  <div className="space-y-1.5 w-full">
                    {(() => {
                      const status = getOpenStatus((business as any).hours);
                      return (
                        <>
                          {status && (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.open ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.open ? "bg-green-500" : "bg-red-500"}`} />
                              {status.label}
                            </div>
                          )}
                          {(business as any).hours ? (
                            <div className="text-[#3A1F0E]/70 text-xs leading-relaxed">{(business as any).hours}</div>
                          ) : (
                            <div className="text-[#3A1F0E]/50 italic text-xs">Hours not listed — call ahead to confirm</div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {parseInt((business as any).reportCount ?? "0") > 0 && ((business as any).safetyRating != null || (business as any).wouldReturnAlone != null || (business as any).recommendationRate != null) && (
                  <div className="pt-5 border-t border-[#2B1507]/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#CA922B]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Community Safety</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(business as any).safetyRating != null && (
                        <div className="bg-[#FAF6EF] rounded-xl p-3 text-center">
                          <div className="text-lg font-serif font-bold text-[#3A1F0E]">{parseFloat((business as any).safetyRating).toFixed(1)}</div>
                          <div className="text-[10px] text-[#3A1F0E]/50 uppercase tracking-wider font-bold mt-0.5">Safety</div>
                        </div>
                      )}
                      {(business as any).wouldReturnAlone != null && (
                        <div className="bg-[#FAF6EF] rounded-xl p-3 text-center">
                          <div className="text-lg font-serif font-bold text-[#3A1F0E]">{(business as any).wouldReturnAlone}%</div>
                          <div className="text-[10px] text-[#3A1F0E]/50 uppercase tracking-wider font-bold mt-0.5">Alone</div>
                        </div>
                      )}
                      {(business as any).recommendationRate != null && (
                        <div className="bg-[#FAF6EF] rounded-xl p-3 text-center">
                          <div className="text-lg font-serif font-bold text-[#3A1F0E]">{(business as any).recommendationRate}%</div>
                          <div className="text-[10px] text-[#3A1F0E]/50 uppercase tracking-wider font-bold mt-0.5">Recommend</div>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-[#3A1F0E]/40 leading-relaxed">Safety stats from community surveys. "Alone" = % who would return solo.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Claim this business */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="border border-[#2B1507]/10 rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center gap-3 px-6 py-4 bg-[#FAF6EF] hover:bg-[#F5EBD8] transition-colors text-left"
            onClick={() => { if (!claimSubmitted) setClaimOpen(o => !o); }}
          >
            <div className="w-8 h-8 rounded-full bg-[#CA922B]/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-[#CA922B]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#2B1507] text-sm">Is this your business?</p>
              <p className="text-[#3A1F0E]/60 text-xs">
                {claimSubmitted ? "Claim submitted — we'll be in touch within 2–3 business days." : "Claim this listing to manage your profile, respond to reviews, and get verified."}
              </p>
            </div>
            {!claimSubmitted && (claimOpen ? <ChevronUp className="w-4 h-4 text-[#3A1F0E]/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#3A1F0E]/40 flex-shrink-0" />)}
            {claimSubmitted && <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />}
          </button>

          {claimOpen && !claimSubmitted && (
            <div className="px-6 py-5 border-t border-[#2B1507]/10 bg-white space-y-4">
              <div className="bg-[#CA922B]/8 border border-[#CA922B]/20 rounded-xl p-3 flex gap-2 items-start">
                <ShieldCheck className="w-4 h-4 text-[#CA922B] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#3A1F0E]/70 leading-relaxed">
                  Once approved, you'll get an email with a link to log in and manage your listing. Our team reviews all claims within 2–3 business days.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2B1507] mb-1.5">Your name *</label>
                  <input
                    type="text"
                    value={claimName}
                    onChange={e => setClaimName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border border-[#2B1507]/15 rounded-lg px-3 py-2.5 text-sm text-[#2B1507] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#FAF6EF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B1507] mb-1.5">Email address *</label>
                  <input
                    type="email"
                    value={claimEmail}
                    onChange={e => setClaimEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border border-[#2B1507]/15 rounded-lg px-3 py-2.5 text-sm text-[#2B1507] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#FAF6EF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B1507] mb-1.5">Phone (optional)</label>
                  <input
                    type="tel"
                    value={claimPhone}
                    onChange={e => setClaimPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full border border-[#2B1507]/15 rounded-lg px-3 py-2.5 text-sm text-[#2B1507] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#FAF6EF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B1507] mb-1.5">Website (optional)</label>
                  <input
                    type="url"
                    value={claimWebsite}
                    onChange={e => setClaimWebsite(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="w-full border border-[#2B1507]/15 rounded-lg px-3 py-2.5 text-sm text-[#2B1507] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#FAF6EF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B1507] mb-1.5">Instagram (optional)</label>
                  <input
                    type="text"
                    value={claimInstagram}
                    onChange={e => setClaimInstagram(e.target.value)}
                    placeholder="@yourbusiness"
                    className="w-full border border-[#2B1507]/15 rounded-lg px-3 py-2.5 text-sm text-[#2B1507] placeholder:text-[#3A1F0E]/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#FAF6EF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B1507] mb-1.5">Your role</label>
                  <select
                    value={claimRole}
                    onChange={e => setClaimRole(e.target.value)}
                    className="w-full border border-[#2B1507]/15 rounded-lg px-3 py-2.5 text-sm text-[#2B1507] focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#FAF6EF]"
                  >
                    <option value="owner">Owner</option>
                    <option value="co-owner">Co-owner</option>
                    <option value="manager">Manager</option>
                    <option value="authorized_rep">Authorized Rep</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1507] mb-1.5">Anything else? (optional)</label>
                <Textarea
                  value={claimInfo}
                  onChange={e => setClaimInfo(e.target.value)}
                  placeholder="Any details that help verify your ownership…"
                  className="resize-none bg-[#FAF6EF] border-[#2B1507]/15 text-[#2B1507] placeholder:text-[#3A1F0E]/40 focus-visible:ring-[#CA922B]/40"
                  rows={3}
                />
              </div>

              {claimError && (
                <p className="text-red-600 text-xs font-medium">{claimError}</p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleClaimSubmit}
                  disabled={claimLoading || !claimName.trim() || !claimEmail.trim()}
                  className="bg-[#CA922B] hover:bg-[#B07A20] text-white rounded-xl px-6 py-2.5 text-sm font-semibold"
                >
                  {claimLoading ? "Submitting…" : "Submit Claim"}
                </Button>
                <button
                  onClick={() => { setClaimOpen(false); setClaimError(null); }}
                  className="text-sm text-[#3A1F0E]/50 hover:text-[#3A1F0E] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
