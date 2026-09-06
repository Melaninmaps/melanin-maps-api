import { useRoute, Link, useSearch } from "wouter";
import { CommunityVibes } from "@/features/businesses/CommunityVibes";
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
import { MapPin, Star, Bookmark, BookmarkCheck, Phone, Globe, ShieldCheck, Clock, Navigation, Zap, BookOpen, Lock, CheckSquare, Shield, ChevronDown, ChevronUp, Share2, ExternalLink, Camera, X, CheckCircle2, CheckCircle, Instagram, Award, Users, MessageCircle, Heart, UtensilsCrossed, Scissors, HeartPulse, BriefcaseBusiness, Palette, ShoppingBag, Landmark, GraduationCap, Wrench, Plane, Store, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { canDisplayBusinessCover, getBusinessHeroIcon, type BusinessHeroRecord } from "@/features/businesses/businessHero";
import { detectSocialVideoPlatform, type SocialVideoPlatform } from "@workspace/constants";

function safeExternalProfileUrl(value: unknown, expectedPlatform: SocialVideoPlatform): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return detectSocialVideoPlatform(url.toString()) === expectedPlatform ? url.toString() : null;
  } catch {
    return null;
  }
}

// Parse a Google Places JSON hours array (["Monday: 9 AM–5 PM", ...]) or a plain string.
function parseHoursArray(hours: string | null | undefined): string[] | null {
  if (!hours) return null;
  const raw = hours.trim();
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch { /* fall through */ }
  }
  return null;
}

function getOpenStatus(hours: string | null | undefined): { open: boolean; label: string } | null {
  if (!hours) return null;

  // Find today's hours line when stored as a JSON array
  const arr = parseHoursArray(hours);
  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const today = DAY_NAMES[new Date().getDay()];
  const todayLine = arr?.find(l => l.startsWith(today))?.replace(`${today}: `, "") ?? null;

  const h = (todayLine ?? hours).toLowerCase().trim();

  if (h === "open 24 hours") return { open: true, label: "Open 24 Hours" };
  if (h === "closed") return { open: false, label: "Closed Today" };
  if (h === "temporarily closed") return { open: false, label: "Temporarily Closed" };
  if (h === "permanently closed") return { open: false, label: "Permanently Closed" };

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
  const openT = parseTime(rangeMatch[1]);
  const closeT = parseTime(rangeMatch[2]);
  if (openT === null || closeT === null) return null;
  const isOpen = mins >= openT && mins < closeT;
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
    return <div className="w-full h-64 rounded-2xl bg-[#1E1510] animate-pulse border border-white/10" aria-label="Loading map" />;
  }

  if (embedUrl) {
    return (
      <div className="space-y-3">
        <iframe
          src={embedUrl}
          title={`Map showing ${business.name ?? "business location"}`}
          className="w-full h-72 rounded-2xl border border-white/10 shadow-sm"
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
      className="block w-full h-64 rounded-2xl overflow-hidden border border-white/10 relative bg-[#1E1510] group cursor-pointer"
      aria-label={`View ${business.name ?? "business"} on Google Maps`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="bg-[#1E1510]/95 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center shadow-lg border border-[#CA922B]/20 group-hover:shadow-xl transition-shadow">
          <MapPin className="w-8 h-8 text-[#CA922B] mb-2" aria-hidden="true" />
          <span className="font-bold text-white">{business.city}{business.state ? `, ${business.state}` : ""}</span>
          <span className="text-xs text-[#CA922B] font-semibold mt-1">View on Google Maps →</span>
        </div>
      </div>
    </a>
  );
}

function BusinessHeroPlaceholder({ business }: { business: BusinessHeroRecord }) {
  const icon = getBusinessHeroIcon(business);
  const iconClass = "h-24 w-24 stroke-[1.35] md:h-32 md:w-32";
  const categoryIcon = (() => {
    switch (icon) {
      case "food": return <UtensilsCrossed className={iconClass} />;
      case "beauty": return <span className="relative"><Scissors className={iconClass} /><Sparkles className="absolute -right-8 -top-5 h-12 w-12 stroke-[1.35]" /></span>;
      case "health": return <HeartPulse className={iconClass} />;
      case "professional": return <BriefcaseBusiness className={iconClass} />;
      case "arts": return <Palette className={iconClass} />;
      case "retail": return <ShoppingBag className={iconClass} />;
      case "faith": return <Landmark className={iconClass} />;
      case "education": return <GraduationCap className={iconClass} />;
      case "home": return <Wrench className={iconClass} />;
      case "travel": return <Plane className={iconClass} />;
      default: return <Store className={iconClass} />;
    }
  })();

  return (
    <div data-testid="business-category-placeholder" className="absolute inset-0 overflow-hidden bg-[#24150D]" aria-label="Business category illustration">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,_#CA922B_0,_transparent_58%)]" />
      <div className="absolute inset-0 flex items-center justify-center text-[#E5B94B]">
        <div className="flex h-56 w-56 items-center justify-center rounded-full border-2 border-[#CA922B]/70 bg-[#CA922B]/10 shadow-[0_0_80px_rgba(202,146,43,0.22)] md:h-72 md:w-72">
          {categoryIcon}
        </div>
      </div>
    </div>
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

  // ── Community photo upload state ─────────────────────────────────────────────
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  function resetPhotoModal() {
    setShowPhotoModal(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoCaption("");
    setPhotoSubmitting(false);
    setPhotoSuccess(false);
    setPhotoError(null);
  }

  async function handlePhotoSubmit() {
    if (!auth?.user) {
      resetPhotoModal();
      toast({ title: "Sign in to add photos", description: "Create a free account to contribute photos." });
      return;
    }
    if (!photoFile) { setPhotoError("Please select a photo."); return; }
    setPhotoSubmitting(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      if (photoCaption.trim()) formData.append("caption", photoCaption.trim());
      const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/businesses/${id}/community-photos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        setPhotoSuccess(true);
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setPhotoError(body.error ?? "Something went wrong. Try again.");
      }
    } catch { setPhotoError("Unable to submit. Check your connection."); }
    finally { setPhotoSubmitting(false); }
  }

  // ── Community media contribution state ──────────────────────────────────────
  const search = useSearch();
  const [showContribModal, setShowContribModal] = useState(false);
  const [contribUrl, setContribUrl] = useState("");
  const [contribCaption, setContribCaption] = useState("");
  const [contribSubmitting, setContribSubmitting] = useState(false);
  const [contribSuccess, setContribSuccess] = useState(false);
  const [contribError, setContribError] = useState<string | null>(null);
  const [communityVibes, setCommunityVibes] = useState<any[]>([]);

  // Auto-open the contribution modal when arriving from "Add a Place" flow
  useEffect(() => {
    if (new URLSearchParams(search).get("addContent") === "true") {
      setShowContribModal(true);
    }
  }, [search]);

  useEffect(() => {
    if (!id) return;
    const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${apiBase}/api/businesses/${id}/contributions`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d?.contributions)) setCommunityVibes(d.contributions); })
      .catch(() => {});
  }, [id]);

  function detectPlatformFromUrl(url: string): string {
    try {
      const host = new URL(url).hostname.replace("www.", "");
      if (host.includes("instagram")) return "Instagram";
      if (host.includes("tiktok")) return "TikTok";
      if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
      if (host.includes("vimeo")) return "Vimeo";
      if (host.includes("facebook") || host.includes("fb.watch")) return "Facebook";
      if (host.includes("twitter") || host.includes("x.com")) return "X / Twitter";
    } catch { /* ignore */ }
    return "Social";
  }

  async function handleContribSubmit() {
    if (!auth?.user) {
      setShowContribModal(false);
      toast({ title: "Sign in to contribute", description: "Create a free account to share your experience." });
      return;
    }
    const url = contribUrl.trim();
    if (!url) { setContribError("Please paste a social media link."); return; }
    try { new URL(url); } catch { setContribError("Please enter a valid URL (e.g. https://www.instagram.com/...)"); return; }

    setContribSubmitting(true);
    setContribError(null);
    try {
      const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/businesses/${id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mediaType: "social_url", sourceUrl: url, caption: contribCaption.trim() || null }),
      });
      if (res.ok) {
        setContribSuccess(true);
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setContribError(body.error ?? "Something went wrong. Try again.");
      }
    } catch { setContribError("Unable to submit. Check your connection."); }
    finally { setContribSubmitting(false); }
  }

  // Community Says caption chips — category-specific so a hair salon never shows
  // food tags like "Portions With Love" or "Seasoned Right."
  // Keys must be stable DB identifiers (snake_case); labels are display text.

  const [claimOpen, setClaimOpen] = useState(false);
  const [claimName, setClaimName] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimRole, setClaimRole] = useState("owner");
  const [claimWebsite, setClaimWebsite] = useState("");
  const [claimInstagram, setClaimInstagram] = useState("");
  const [claimInfo, setClaimInfo] = useState("");
  const [claimVerificationMethod, setClaimVerificationMethod] = useState("manual_review");
  const [claimAttested, setClaimAttested] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  async function handleClaimSubmit() {
    if (!claimName.trim() || !claimEmail.trim()) {
      setClaimError("Your name and email are required."); return;
    }
    if (!claimAttested) {
      setClaimError("You must confirm that you are authorized to claim this listing."); return;
    }
    setClaimError(null);
    setClaimLoading(true);
    try {
      // Use the authenticated /claims (plural) endpoint which enforces one open
      // claim per user/business, records verification method, and requires attestation.
      const res = await fetch(`${BASE_URL}/api/businesses/${id}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ownerName: claimName.trim(),
          businessEmail: claimEmail.trim(),
          phone: claimPhone.trim() || null,
          role: claimRole,
          website: claimWebsite.trim() || null,
          instagramHandle: claimInstagram.replace("@", "").trim() || null,
          additionalInfo: claimInfo.trim() || null,
          verificationMethod: claimVerificationMethod,
          attestation: true,
        }),
      });
      if (res.ok) {
        setClaimSubmitted(true);
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        // Surface useful error messages (e.g. already-pending claim)
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
        },
        onError: () => {
          toast({ title: "Could not remove from saved places", description: "Please try again.", variant: "destructive" });
        },
      });
    } else {
      savePlace.mutate({ data: { businessId: id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listSavedPlaces"] });
          toast({ title: "Added to saved places" });
        },
        onError: () => {
          toast({ title: "Could not save this place", description: "Please try again.", variant: "destructive" });
        },
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
        const status = err?.status ?? err?.response?.status;
        const code = (err?.data as any)?.code ?? null;
        const msg  = (err?.data as any)?.error ?? null;
        if (status === 403 && code === "ACCOUNT_COOLDOWN") {
          const hoursLeft = (err?.data as any)?.hoursLeft ?? 24;
          toast({ title: "Almost ready", description: `New accounts can leave reviews after ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""} to protect the community from spam.`, variant: "destructive" });
        } else if (status === 403 && code === "ACCOUNT_SUSPENDED") {
          toast({ title: "Account suspended", description: msg ?? "Contact hello@mappingwithmelanin.com to appeal.", variant: "destructive" });
        } else if (status === 409) {
          toast({ title: "Already reviewed", description: "You've already shared your experience for this business.", variant: "destructive" });
        } else if (status === 403) {
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
      <div className="flex flex-col w-full bg-[#1A1209] min-h-screen animate-pulse">
        <div className="h-[60vh] w-full bg-white/10" />
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="h-12 w-1/3 bg-white/10 rounded mb-4" />
          <div className="h-6 w-1/4 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#1A1209] flex flex-col items-center justify-center text-center p-10">
        <h2 className="text-3xl font-serif text-white mb-4">Business not found</h2>
        <Button variant="outline" onClick={() => window.history.back()} className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1209] flex flex-col w-full pb-24">
      {/* ── Community Media Contribution Modal ── */}
      {showContribModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1E1510] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#CA922B]/20 relative">
            <button onClick={() => { setShowContribModal(false); setContribSuccess(false); setContribUrl(""); setContribCaption(""); setContribError(null); }} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            {contribSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-2">Contribution Received</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Your content has been submitted and will appear on this page after review — usually within 24 hours. Thank you for showing the community the vibe.
                </p>
                <button onClick={() => { setShowContribModal(false); setContribSuccess(false); setContribUrl(""); setContribCaption(""); }} className="py-3 px-8 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold text-sm transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#CA922B]/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-[#CA922B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">Show the Vibe</h3>
                    <p className="text-xs text-white/60">Paste a link from Instagram, TikTok, YouTube, or Vimeo</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">Your post or video link</label>
                    <input
                      type="url"
                      value={contribUrl}
                      onChange={e => { setContribUrl(e.target.value); setContribError(null); }}
                      placeholder="https://www.instagram.com/p/..."
                      className="w-full px-4 py-3 rounded-xl border border-white/20 bg-[#241810] text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/10 transition"
                    />
                    {contribUrl && (() => { try { const p = detectPlatformFromUrl(contribUrl); return p !== "Social" ? <p className="text-xs text-[#CA922B] mt-1 font-semibold">{p} link detected ✓</p> : null; } catch { return null; } })()}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">Caption <span className="normal-case text-white/35 font-normal">(optional)</span></label>
                    <textarea
                      value={contribCaption}
                      onChange={e => setContribCaption(e.target.value)}
                      placeholder="What made this place special for you?"
                      rows={2}
                      maxLength={280}
                      className="w-full px-4 py-3 rounded-xl border border-white/20 bg-[#241810] text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/10 resize-none transition"
                    />
                  </div>

                  <div className="bg-[#241810] rounded-xl p-3 border border-white/10">
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      <strong className="text-white/70">Your content stays yours.</strong> MWM stores only a link to your original post — your views, followers, and credit stay on your platform. Submissions are reviewed before appearing.
                    </p>
                  </div>

                  {contribError && <p className="text-red-600 text-xs font-medium">{contribError}</p>}

                  <button
                    onClick={handleContribSubmit}
                    disabled={contribSubmitting || !contribUrl.trim()}
                    className="w-full py-3 rounded-full bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-40 text-white font-bold text-sm transition-colors"
                  >
                    {contribSubmitting ? "Submitting…" : "Submit Contribution"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Community Photo Upload Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1E1510] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#CA922B]/20 relative">
            <button onClick={resetPhotoModal} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            {photoSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-2">Photo Submitted</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Your photo will appear here after a quick review — usually within 24 hours. Thank you for helping the community see this place.
                </p>
                <button onClick={resetPhotoModal} className="py-3 px-8 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold text-sm transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#CA922B]/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-[#CA922B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">Add a Photo</h3>
                    <p className="text-xs text-white/60">Help the community see what this place is really like</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* File picker */}
                  <div>
                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">Photo</label>
                    {photoPreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#CA922B]/20" style={{ aspectRatio: "4/3" }}>
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-[#CA922B]/30 bg-[#241810] hover:border-[#CA922B]/60 hover:bg-[#CA922B]/5 cursor-pointer transition-colors">
                        <Camera className="w-8 h-8 text-[#CA922B]/60" />
                        <span className="text-sm text-white/60 font-medium">Tap to choose a photo</span>
                        <span className="text-xs text-white/40">JPG or PNG, max 10MB</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 10 * 1024 * 1024) { setPhotoError("Photo must be under 10MB."); return; }
                            setPhotoFile(file);
                            setPhotoError(null);
                            const reader = new FileReader();
                            reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">
                      Caption <span className="normal-case text-white/35 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="What made this place special for you?"
                      rows={2}
                      maxLength={280}
                      className="w-full px-4 py-3 rounded-xl border border-white/20 bg-[#241810] text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/10 resize-none transition"
                    />
                  </div>

                  <div className="bg-[#241810] rounded-xl p-3 border border-white/10">
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      <strong className="text-white/70">Community photos are reviewed before appearing.</strong> By submitting you confirm this is your own photo or you have rights to share it.
                    </p>
                  </div>

                  {photoError && <p className="text-red-600 text-xs font-medium">{photoError}</p>}

                  <button
                    onClick={handlePhotoSubmit}
                    disabled={photoSubmitting || !photoFile}
                    className="w-full py-3 rounded-full bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-40 text-white font-bold text-sm transition-colors"
                  >
                    {photoSubmitting ? "Uploading…" : "Submit Photo"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1E1510] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-[#CA922B]/20">
            <div className="w-16 h-16 rounded-full bg-[#CA922B]/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#CA922B]" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Navigator Required</h2>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
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
                className="w-full py-3 rounded-full text-white/60 text-sm font-medium hover:text-white transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div data-testid="business-hero" className="relative w-full h-[50vh] md:h-[60vh] bg-[#2B1507]">
        {canDisplayBusinessCover(business as typeof business & { profileStatus?: string | null }) ? (
          <img src={business.imageUrl ?? undefined} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <BusinessHeroPlaceholder business={business as typeof business & { profileStatus?: string | null }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507] via-[#2B1507]/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 container mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-white max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span data-testid="business-category" className="bg-[#CA922B] text-white text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                  {business.category}
                </span>
                {/* confidenceScore is an internal metric — never shown; community builds scores */}
              </div>
              <h1 data-testid="business-name" className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-2">{business.name}</h1>
              <div className="flex items-center gap-2 text-[#F5EBD8] text-lg">
                <MapPin size={18} />
                <span>{business.city}, {business.state}</span>
              </div>
              {(business as any).listingStatus === "live_unclaimed" && (
                <p className="mt-3 text-sm font-semibold text-[#F5EBD8]">Community/founder-listed · Unclaimed · Not verified</p>
              )}
              {(business as any).ownershipClaim === "community_reported_minority_owned" && (
                <p className="mt-1 text-sm font-semibold text-[#E5B94B]">Community-reported minority-owned · Not verified</p>
              )}
              {(business as any).ownershipClaim === "community_reported_non_minority_owned" && (
                <p className="mt-1 text-sm font-semibold text-[#E5B94B]">Community-reported non-minority-owned · Not verified</p>
              )}
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
                onClick={() => setShowContribModal(true)}
                variant="outline"
                className="rounded-full h-12 px-6 border-white/20 backdrop-blur-md bg-black/30 text-white hover:bg-white hover:text-[#2B1507]"
              >
                <Camera className="mr-2 w-5 h-5" /> Show the Vibe
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

      {/* ── Community Intelligence — below hero, above tabs ──────────────────── */}
      <div className="container mx-auto px-4 md:px-6 pt-8 pb-0">

        {/* Row 1: Ownership + Trust badges */}
        {(() => {
          const designations: string[] = (business as any).ownershipDesignations ?? [];
          const badges = designations.length > 0 ? designations : (business.blackOwned ? ["Black / African American-Owned"] : []);
          const isTrusted = (business.reviewCount ?? 0) >= 5 && (business.averageRating ?? 0) >= 4.0;
          const isVerified = !!(business as any).verified;
          const isCommunityReportedOwnership = String((business as any).ownershipClaim ?? "").startsWith("community_reported_");
          if (badges.length === 0 && !isTrusted && !isVerified) return null;
          return (
            <div className="mb-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {badges.map((d: string) => (
                  <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#CA922B]/10 border border-[#CA922B]/30 text-[#CA922B]">
                    {isCommunityReportedOwnership ? <Users className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    {isCommunityReportedOwnership ? `Community-reported: ${d}` : d}
                  </span>
                ))}
                {isVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
                {isTrusted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700">
                    <Users className="w-3 h-3" />
                    Community Trusted
                  </span>
                )}
                {(business as any).wouldReturnAlone != null && (business as any).wouldReturnAlone >= 70 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <Shield className="w-3 h-3" />
                    Welcoming Environment
                  </span>
                )}
              </div>
              {badges.length > 0 && (
                <p className="text-[10px] text-white/40 leading-relaxed mb-4">
                  {isCommunityReportedOwnership
                    ? "These ownership designations were reported by a community member and are not verified owner identity."
                    : "Ownership designations indicate the business is owned and operated 51% or more by the identified group. Businesses may self-identify or submit documentation for verified status."}
                </p>
              )}
            </div>
          );
        })()}

        {/* Row 2: Put Your People On */}
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-5 h-5 text-[#CA922B]" />
          {(business.reviewCount ?? 0) > 0 ? (
            <>
              <span className="font-serif font-bold text-white text-lg">Put Your People On</span>
              <span className="font-serif font-bold text-[#CA922B] text-lg ml-1">{business.averageRating?.toFixed(1)}</span>
              <span className="text-white/40 text-sm">({business.reviewCount?.toLocaleString()} {(business.reviewCount ?? 0) === 1 ? "voice" : "voices"})</span>
            </>
          ) : (
            <span className="font-serif text-white/40 text-base">Be among the first to put this business on</span>
          )}
        </div>

        {/* Community Insights — matches mobile exactly.
            Labels: "Would Return", "Experience Rating", "Recommend"
            Color: green (#2D7A4F). Only shown when data exists.
            NOT "Community Safety Stats" / NOT "Safety Rating" / NOT "Would Return Alone" */}
        {((business as any).wouldReturnAlone != null || (business as any).safetyRating != null) && (
          <div className="rounded-2xl border p-5 mb-3" style={{ backgroundColor: "#2D7A4F10", borderColor: "#2D7A4F30" }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" style={{ color: "#2D7A4F" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#2D7A4F" }}>Community Insights</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {(business as any).wouldReturnAlone != null && (
                <div>
                  <div className="text-3xl font-bold text-[#22C55E]">{(business as any).wouldReturnAlone}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mt-1 text-white/50">Would Return</div>
                </div>
              )}
              {(business as any).safetyRating != null && (
                <div>
                  <div className="text-3xl font-bold text-[#22C55E]">{parseFloat((business as any).safetyRating).toFixed(1)}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mt-1 text-white/50">Experience Rating</div>
                </div>
              )}
              {(business as any).recommendationRate != null && (
                <div>
                  <div className="text-3xl font-bold text-[#22C55E]">{(business as any).recommendationRate}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mt-1 text-white/50">Recommend</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Welcoming Environment badge — matches mobile: shown when wouldReturnAlone ≥ 70 */}
        {(business as any).wouldReturnAlone != null && parseInt((business as any).wouldReturnAlone) >= 70 && (
          <div className="rounded-2xl border p-4 mb-3 flex items-center gap-3" style={{ backgroundColor: "#2D7A4F10", borderColor: "#2D7A4F40" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#2D7A4F20" }}>
              <Shield className="w-4 h-4" style={{ color: "#2D7A4F" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#2D7A4F" }}>Welcoming Environment</p>
              <p className="text-xs" style={{ color: "#2D7A4F99" }}>{(business as any).wouldReturnAlone}% of visitors say they'd return here</p>
            </div>
          </div>
        )}

        {/* Share Your Experience — matches mobile label exactly. NOT "Rate Your Safety Experience" */}
        <button
          onClick={() => document.getElementById("community-experience")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border mb-8 transition-colors group"
          style={{ backgroundColor: "#2D7A4F10", borderColor: "#2D7A4F30" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#2D7A4F20" }}>
              <Shield className="w-4 h-4" style={{ color: "#2D7A4F" }} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm" style={{ color: "#2D7A4F" }}>🛡️ Share Your Experience</p>
              <p className="text-xs" style={{ color: "#2D7A4F99" }}>Help the community know what to expect</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 -rotate-90" style={{ color: "#2D7A4F" }} />
        </button>

      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 mt-0">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column - Details */}
          <div className="flex-1">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start bg-[#1A1209] border-b border-white/10 rounded-none h-14 p-0 space-x-8 mb-8">
                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#CA922B] rounded-none px-0 h-14 font-serif text-lg text-white/50 data-[state=active]:text-white">Overview</TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#CA922B] rounded-none px-0 h-14 font-serif text-lg text-white/50 data-[state=active]:text-white">Reviews</TabsTrigger>
                {stories.length > 0 && (
                  <TabsTrigger value="stories" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#CA922B] rounded-none px-0 h-14 font-serif text-lg text-white/50 data-[state=active]:text-white">
                    <BookOpen size={16} className="mr-1.5" />Stories
                  </TabsTrigger>
                )}
                <TabsTrigger value="location" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#CA922B] rounded-none px-0 h-14 font-serif text-lg text-white/50 data-[state=active]:text-white">Location & Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8 animate-in fade-in">
                {/* Photo Gallery */}
                {(() => {
                  const photos: string[] = (business as unknown as { photos?: string[] }).photos ?? [];
                  const allPhotos = [
                    ...(business.imageUrl ? [business.imageUrl] : []),
                    ...photos.filter(p => p !== business.imageUrl),
                  ];
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-serif font-bold text-xl text-white flex items-center gap-2">
                          <span>Photos</span>
                          {allPhotos.length > 1 && <span className="text-sm font-sans font-normal text-white/40">({allPhotos.length})</span>}
                        </h3>
                        <button
                          onClick={() => { setPhotoSuccess(false); setPhotoError(null); setShowPhotoModal(true); }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#CA922B] hover:text-[#B38024] border border-[#CA922B]/30 hover:border-[#CA922B] px-3 py-1 rounded-full transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Add a Photo
                        </button>
                      </div>
                      {allPhotos.length > 1 ? (
                        <div className={`grid gap-2 ${allPhotos.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
                          {allPhotos.map((src, i) => (
                            <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                              className={`block relative overflow-hidden rounded-2xl bg-white/5 group ${i === 0 && allPhotos.length >= 3 ? "col-span-2 md:col-span-1 md:row-span-2" : ""}`}
                              style={{ aspectRatio: i === 0 && allPhotos.length >= 3 ? "16/9" : "4/3" }}>
                              <img src={src} alt={`${business.name ?? ""} photo ${i + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => { setPhotoSuccess(false); setPhotoError(null); setShowPhotoModal(true); }}
                          className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border border-dashed border-[#CA922B]/30 text-[#CA922B]/60 hover:border-[#CA922B]/60 hover:text-[#CA922B] hover:bg-[#CA922B]/5 transition-colors bg-[#1E1510]"
                        >
                          <Camera className="w-8 h-8" />
                          <span className="text-sm font-semibold">Be the first to add a photo</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                <div className="prose prose-lg text-white/80 font-light leading-relaxed prose-invert">
                  <p>{(business.description?.replace(/^\[DEMO\]\s*/i, "") || "Discover this exceptional business. They provide quality service and a welcoming environment for the community.")}</p>
                </div>
                
                {/* Ownership designations shown above tabs in community intelligence header */}

                {/* One category-aware experience system for atmosphere, quick reviews, and price. */}
                <CommunityVibes
                  businessId={business.id}
                  isAuthenticated={Boolean(auth?.user)}
                />

                {/* ── Community Safety & Trust (#240) ─────────────────────────────── */}
                {(() => {
                  const safetyRating = (business as any).safetyRating as number | null;
                  const wouldReturnAlone = (business as any).wouldReturnAlone as number | null;
                  const recommendationRate = (business as any).recommendationRate as number | null;
                  const hasSafetyData = (safetyRating != null && safetyRating > 0) || wouldReturnAlone != null || recommendationRate != null;
                  if (!hasSafetyData) return null;
                  return (
                    <div className="bg-[#1E1510] rounded-2xl p-6 border border-white/10 space-y-5">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-4 h-4 text-[#CA922B]" />
                        <h3 className="font-serif font-bold text-xl text-white">Community Safety & Trust</h3>
                      </div>

                      {/* Safety stats */}
                      {hasSafetyData && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {safetyRating != null && safetyRating > 0 && (
                            <div className="bg-[#241810] rounded-xl p-3 text-center">
                              <p className="text-2xl font-serif font-bold text-[#CA922B]">{safetyRating.toFixed(1)}</p>
                              <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mt-0.5">Safety Rating</p>
                            </div>
                          )}
                          {wouldReturnAlone != null && (
                            <div className="bg-[#241810] rounded-xl p-3 text-center">
                              <p className="text-2xl font-serif font-bold text-[#CA922B]">{Math.round(wouldReturnAlone)}%</p>
                              <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mt-0.5">Return Alone</p>
                            </div>
                          )}
                          {recommendationRate != null && (
                            <div className="bg-[#241810] rounded-xl p-3 text-center">
                              <p className="text-2xl font-serif font-bold text-[#CA922B]">{Math.round(recommendationRate)}%</p>
                              <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mt-0.5">Would Recommend</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Flash Deals */}
                {deals.length > 0 && (
                  <div>
                    <h3 className="font-serif font-bold text-xl text-white mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[#CA922B]" /> Flash Deals
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {deals.map((deal: any) => (
                        <div key={deal.id} className="bg-[#1E1510] rounded-2xl p-5 border border-[#CA922B]/20 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-[#CA922B] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                            {deal.discount ?? "Special Offer"}
                          </div>
                          <h4 className="font-serif font-bold text-white mb-1 pr-16">{deal.title}</h4>
                          <p className="text-white/70 text-sm mb-3">{deal.description}</p>
                          {deal.validUntil && (
                            <div className="flex items-center gap-1.5 text-xs text-[#CA922B] font-bold">
                              <Clock size={12} />
                              Ends {new Date(deal.validUntil).toLocaleDateString()}
                            </div>
                          )}
                          {deal.membershipRequired && (
                            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-700/30">
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
                    <div key={story.id} className="bg-[#1E1510] rounded-2xl p-6 border border-white/10 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          story.type === "offer" ? "bg-green-900/30 text-green-400" :
                          story.type === "event" ? "bg-blue-900/30 text-blue-400" :
                          story.type === "milestone" ? "bg-purple-900/30 text-purple-400" :
                          "bg-[#241810] text-[#CA922B]"
                        }`}>
                          {story.type ?? "Update"}
                        </span>
                        {story.expiresAt && (
                          <span className="text-xs text-white/50 flex items-center gap-1">
                            <Clock size={11} />
                            Expires {new Date(story.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {story.mediaUrl && (
                        <img src={story.mediaUrl} alt={story.title} className="w-full h-48 object-cover rounded-xl mb-4" />
                      )}
                      <h4 className="font-serif font-bold text-lg text-white mb-2">{story.title}</h4>
                      <p className="text-white/70 text-sm leading-relaxed">{story.content}</p>
                    </div>
                  ))}
                </TabsContent>
              )}

              <TabsContent value="reviews" className="space-y-8 animate-in fade-in">
                <div className="flex items-center gap-6 bg-[#1E1510] p-6 rounded-2xl border border-white/10">
                  <div className="flex flex-col items-center justify-center p-4 bg-[#241810] rounded-xl min-w-[120px]">
                    <span className="text-4xl font-serif font-bold text-white">{business.averageRating?.toFixed(1) || "—"}</span>
                    <div className="flex text-[#CA922B] my-1">
                      {Array.from({length: 5}).map((_, i) => (
                        <Star key={i} size={14} fill={i < Math.round(business.averageRating || 0) ? "currentColor" : "none"} strokeWidth={i < Math.round(business.averageRating || 0) ? 0 : 2} />
                      ))}
                    </div>
                    <span className="text-xs text-white/50 uppercase tracking-wider font-bold">{business.reviewCount || 0} {(business.reviewCount ?? 0) === 1 ? "Voice" : "Voices"}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="w-4 h-4 text-[#CA922B]" />
                      <h3 className="font-serif font-bold text-xl text-white">Community Comments</h3>
                    </div>
                    <p className="text-white/70 text-sm">
                      {(business.reviewCount ?? 0) === 0
                        ? "No community voices yet — be the first to share your experience."
                        : "Read what the Mapping With Melanin™ community has to say about their experience."
                      }
                    </p>
                  </div>
                </div>

                {auth?.user ? (
                  <div className="bg-[#1E1510] p-6 rounded-2xl border border-white/10">
                    <h4 className="font-serif font-bold text-lg mb-4 text-white">Leave a Review</h4>
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm font-medium text-white">Rating</span>
                        <div className="flex gap-1 cursor-pointer">
                          {[1,2,3,4,5].map(r => (
                            <button key={r} type="button" onClick={() => setRating(r)} className={r <= rating ? "text-[#CA922B]" : "text-white/20"}>
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
                        className="bg-[#241810] border-white/20 text-white focus-visible:ring-[#CA922B] resize-none rounded-xl placeholder:text-white/40"
                      />
                      <Button type="submit" disabled={isSubmitting} className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white">
                        Submit Review
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-[#1E1510] p-6 rounded-2xl text-center border border-white/10">
                    <p className="text-white/70 mb-4">Sign in to share your experience.</p>
                    <Button variant="outline" onClick={() => window.location.href='/login'} className="rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white">Sign In</Button>
                  </div>
                )}

                <div className="space-y-6">
                  {isLoadingReviews ? (
                    <Skeleton className="h-32 w-full rounded-2xl" />
                  ) : reviews?.length === 0 ? (
                    <p className="text-white/50 text-center py-8">No reviews yet.</p>
                  ) : (
                    reviews?.map((review) => (
                      <div key={review.id} className="bg-[#1E1510] p-6 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-bold text-white">{review.authorName || "Community Member"}</div>
                          <div className="flex text-[#CA922B]">
                            {Array.from({length: 5}).map((_, i) => (
                              <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 2} />
                            ))}
                          </div>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">{review.text}</p>
                        <div className="text-xs text-white/40 mt-4 uppercase tracking-wider font-bold">
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
            <div className="bg-[#1E1510] rounded-2xl border border-white/10 p-6 sticky top-28 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <h3 className="font-serif font-bold text-xl text-white mb-6">Contact & Info</h3>
              
              <div className="space-y-5">
                {business.address && (
                  <div className="flex items-start gap-4 text-white/80 text-sm">
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
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <Phone className="w-5 h-5 text-[#CA922B] shrink-0" />
                    <a data-testid="business-call-link" href={`tel:${business.phone}`} className="hover:text-[#CA922B]">{business.phone}</a>
                  </div>
                )}
                
                {business.website && (
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <Globe className="w-5 h-5 text-[#CA922B] shrink-0" />
                    <a href={business.website} target="_blank" rel="noreferrer" className="hover:text-[#CA922B] truncate">{business.website.replace(/^https?:\/\//, '')}</a>
                  </div>
                )}

                {(() => {
                  const record = business as any;
                  const socialProfiles = record.socialProfiles && typeof record.socialProfiles === "object"
                    ? record.socialProfiles as Record<string, unknown>
                    : {};
                  const options = [
                    ["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"],
                    ["facebook", "Facebook"], ["twitch", "Twitch"], ["snapchat", "Snapchat"],
                  ] as const;
                  const links = options.flatMap(([key, label]) => {
                    const url = safeExternalProfileUrl(record[key] ?? socialProfiles[key], key);
                    return url ? [{ key, label, url }] : [];
                  });
                  return links.length > 0 ? (
                    <div className="flex items-start gap-4 text-white/80 text-sm">
                      <Share2 className="w-5 h-5 text-[#CA922B] shrink-0 mt-0.5" />
                      <div className="flex flex-wrap gap-2">
                        {links.map((link) => (
                          <a key={link.key} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1.5 hover:border-[#CA922B] hover:text-[#CA922B]">
                            {link.label} <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {business.priceRange && (
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <div className="w-5 h-5 rounded-full bg-[#CA922B]/10 text-[#CA922B] flex items-center justify-center font-bold text-xs shrink-0">$</div>
                    <span>{business.priceRange}</span>
                  </div>
                )}

                {/* Permanently Closed banner */}
                {(business as any).enrichment_note?.toLowerCase().includes("permanently closed") && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    This location is permanently closed
                  </div>
                )}

                <div className="flex items-start gap-4 text-white/80 text-sm pt-5 border-t border-white/10">
                  <Clock className="w-5 h-5 text-[#CA922B] shrink-0 mt-0.5" />
                  <div className="space-y-1.5 w-full">
                    {(() => {
                      const rawHours = (business as any).hours as string | null | undefined;
                      const status = getOpenStatus(rawHours);
                      const arr = parseHoursArray(rawHours);
                      return (
                        <>
                          {status && (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              status.open
                                ? "bg-green-950/40 text-green-400 border border-green-500/30"
                                : "bg-red-950/30 text-red-400 border border-red-500/20"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.open ? "bg-green-500" : "bg-red-500"}`} />
                              {status.label}
                            </div>
                          )}
                          {arr ? (
                            // Google Places enriched — render as day-by-day table
                            <div className="space-y-1 mt-1">
                              {arr.map((line, i) => {
                                const colonIdx = line.indexOf(": ");
                                const day = colonIdx >= 0 ? line.slice(0, colonIdx) : line;
                                const hrs = colonIdx >= 0 ? line.slice(colonIdx + 2) : "";
                                const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                                const isToday = day === DAY_NAMES[new Date().getDay()];
                                return (
                                  <div key={i} className={`flex justify-between gap-4 text-xs ${isToday ? "text-white font-semibold" : "text-white/55"}`}>
                                    <span className="shrink-0">{day}</span>
                                    <span className="text-right">{hrs || line}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : rawHours ? (
                            <div className="text-white/70 text-xs leading-relaxed mt-1">{rawHours}</div>
                          ) : (
                            <div className="text-white/50 italic text-xs">Hours not listed — call ahead to confirm</div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {parseInt((business as any).reportCount ?? "0") > 0 && ((business as any).safetyRating != null || (business as any).wouldReturnAlone != null || (business as any).recommendationRate != null) && (
                  <div className="pt-5 border-t border-white/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#CA922B]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-white/60">Community Intelligence</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(business as any).safetyRating != null && (
                        <div className="bg-[#241810] rounded-xl p-3 text-center">
                          <div className="text-lg font-serif font-bold text-white">{parseFloat((business as any).safetyRating).toFixed(1)}</div>
                          <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold mt-0.5">Safety</div>
                        </div>
                      )}
                      {(business as any).wouldReturnAlone != null && (
                        <div className="bg-[#241810] rounded-xl p-3 text-center">
                          <div className="text-lg font-serif font-bold text-white">{(business as any).wouldReturnAlone}%</div>
                          <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold mt-0.5">Alone</div>
                        </div>
                      )}
                      {(business as any).recommendationRate != null && (
                        <div className="bg-[#241810] rounded-xl p-3 text-center">
                          <div className="text-lg font-serif font-bold text-white">{(business as any).recommendationRate}%</div>
                          <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold mt-0.5">Recommend</div>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">Safety stats from community surveys. "Alone" = % who would return solo.</p>
                  </div>
                )}

                {/* ── Find Us Online ── social handles + linked posts ──── */}
                {(() => {
                  const b = business as any;

                  // Build handle links from individual social fields
                  const handleLinks: { platform: string; url: string }[] = [];
                  if (b.instagram) handleLinks.push({ platform: "Instagram", url: `https://www.instagram.com/${b.instagram.replace("@", "")}` });
                  if (b.tiktok)    handleLinks.push({ platform: "TikTok",    url: `https://www.tiktok.com/@${b.tiktok.replace("@", "")}` });
                  if (b.facebook)  handleLinks.push({ platform: "Facebook",  url: b.facebook.startsWith("http") ? b.facebook : `https://www.facebook.com/${b.facebook.replace("@", "")}` });
                  if (b.twitter)   handleLinks.push({ platform: "X / Twitter", url: `https://twitter.com/${b.twitter.replace("@", "")}` });
                  if (b.youtube)   handleLinks.push({ platform: "YouTube",   url: b.youtube.startsWith("http") ? b.youtube : `https://www.youtube.com/@${b.youtube.replace("@", "")}` });
                  if (b.pinterest) handleLinks.push({ platform: "Pinterest", url: `https://www.pinterest.com/${b.pinterest.replace("@", "")}` });

                  // Linked social posts / videos added by admin
                  const linkedPosts: string[] = Array.isArray(b.videos) ? b.videos.filter((v: string) => v.startsWith("http")) : [];

                  function detectPlatform(url: string): string {
                    try {
                      const host = new URL(url).hostname.replace("www.", "");
                      if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
                      if (host.includes("tiktok")) return "TikTok";
                      if (host.includes("instagram")) return "Instagram";
                      if (host.includes("facebook") || host.includes("fb.watch")) return "Facebook";
                      if (host.includes("pinterest")) return "Pinterest";
                      if (host.includes("vimeo")) return "Vimeo";
                    } catch { /* ignore */ }
                    return "Social";
                  }

                  if (handleLinks.length === 0 && linkedPosts.length === 0) return null;

                  return (
                    <div className="pt-5 border-t border-white/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-[#CA922B]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-white/60">Find Us Online</span>
                      </div>

                      {/* Social profile handles */}
                      {handleLinks.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {handleLinks.map(({ platform, url }) => (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#241810] border border-white/10 text-xs font-bold text-white hover:border-[#CA922B]/50 hover:text-[#CA922B] transition-colors"
                            >
                              {platform}
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Community media contributions */}
                      {communityVibes.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Community Vibes</span>
                          </div>
                          {communityVibes.slice(0, 5).map((c: any) => {
                            const detected = detectSocialVideoPlatform(c.source_url ?? "");
                            if (!detected) return null;
                            const href = safeExternalProfileUrl(c.source_url, detected);
                            if (!href) return null;
                            const platform = detectPlatformFromUrl(href);
                            return (
                              <a
                                key={c.id}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#241810] border border-white/10 hover:border-[#CA922B]/40 transition-colors group"
                              >
                                <span className="text-[10px] font-bold text-[#CA922B] bg-[#CA922B]/10 rounded-full px-2 py-0.5 shrink-0 mt-0.5">
                                  {platform}
                                </span>
                                <div className="flex-1 min-w-0">
                                  {c.caption && <p className="text-xs text-white/70 leading-relaxed line-clamp-2">{c.caption}</p>}
                                  {c.contributor_name && <p className="text-[10px] text-white/40 mt-0.5">by {c.contributor_name}</p>}
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-[#CA922B] shrink-0 mt-0.5 transition-colors" />
                              </a>
                            );
                          })}
                          <button onClick={() => setShowContribModal(true)} className="w-full text-xs text-[#CA922B] font-semibold hover:text-[#B38024] text-center py-1 transition-colors">
                            + Add your content
                          </button>
                        </div>
                      )}
                      {communityVibes.length === 0 && (
                        <button
                          onClick={() => setShowContribModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#CA922B]/30 text-xs text-[#CA922B] font-semibold hover:border-[#CA922B]/60 hover:bg-[#CA922B]/5 transition-colors bg-[#241810]"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Be the first to Show the Vibe
                        </button>
                      )}

                      {/* Admin-linked social posts */}
                      {linkedPosts.length > 0 && (
                        <div className="space-y-2">
                          {linkedPosts.map(url => {
                            const detected = detectSocialVideoPlatform(url);
                            if (!detected) return null;
                            const href = safeExternalProfileUrl(url, detected);
                            if (!href) return null;
                            const platform = detectPlatform(href);
                            return (
                              <a
                                key={url}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#241810] border border-white/10 hover:border-[#CA922B]/40 transition-colors group"
                              >
                                <span className="text-[10px] font-bold text-[#CA922B] bg-[#CA922B]/10 rounded-full px-2 py-0.5 shrink-0">
                                  {platform}
                                </span>
                                <span className="text-xs text-white/60 truncate flex-1">
                                  View original post
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-[#CA922B] shrink-0 transition-colors" />
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Claim this business */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="border border-white/10 rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center gap-3 px-6 py-4 bg-[#1E1510] hover:bg-[#241810] transition-colors text-left"
            onClick={() => { if (!claimSubmitted) setClaimOpen(o => !o); }}
          >
            <div className="w-8 h-8 rounded-full bg-[#CA922B]/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-[#CA922B]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">Is this your business?</p>
              <p className="text-white/60 text-xs">
                {claimSubmitted ? "Claim submitted — we'll be in touch within 2–3 business days." : "Claim this listing to manage your profile, respond to reviews, and get verified."}
              </p>
            </div>
            {!claimSubmitted && (claimOpen ? <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />)}
            {claimSubmitted && <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />}
          </button>

          {claimOpen && !claimSubmitted && (
            <div className="px-6 py-5 border-t border-white/10 bg-[#1E1510] space-y-4">
              <div className="bg-[#CA922B]/8 border border-[#CA922B]/20 rounded-xl p-3 flex gap-2 items-start">
                <ShieldCheck className="w-4 h-4 text-[#CA922B] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/70 leading-relaxed">
                  Once approved, you'll get an email with a link to log in and manage your listing. Our team reviews all claims within 2–3 business days.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Your name *</label>
                  <input
                    type="text"
                    value={claimName}
                    onChange={e => setClaimName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#241810]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Business email *</label>
                  <input
                    type="email"
                    value={claimEmail}
                    onChange={e => setClaimEmail(e.target.value)}
                    placeholder="owner@yourbusiness.com"
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#241810]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Phone (optional)</label>
                  <input
                    type="tel"
                    value={claimPhone}
                    onChange={e => setClaimPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#241810]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Website (optional)</label>
                  <input
                    type="url"
                    value={claimWebsite}
                    onChange={e => setClaimWebsite(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#241810]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Instagram (optional)</label>
                  <input
                    type="text"
                    value={claimInstagram}
                    onChange={e => setClaimInstagram(e.target.value)}
                    placeholder="@yourbusiness"
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#241810]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Your role</label>
                  <select
                    value={claimRole}
                    onChange={e => setClaimRole(e.target.value)}
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#241810]"
                  >
                    <option value="owner">Owner</option>
                    <option value="co-owner">Co-owner</option>
                    <option value="manager">Manager</option>
                    <option value="authorized_rep">Authorized Representative</option>
                  </select>
                </div>
              </div>

              {/* How we verify ownership */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">How can we verify your ownership? *</label>
                <select
                  value={claimVerificationMethod}
                  onChange={e => setClaimVerificationMethod(e.target.value)}
                  className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#CA922B]/40 bg-[#241810]"
                >
                  <option value="manual_review">I'll provide details in the notes below</option>
                  <option value="domain_email">I have an email address at the business domain</option>
                  <option value="social_account">I manage the business social account</option>
                  <option value="booking_page">I manage the booking or reservation page</option>
                  <option value="business_document">I can provide a business license or document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Additional details (optional)</label>
                <Textarea
                  value={claimInfo}
                  onChange={e => setClaimInfo(e.target.value)}
                  placeholder="Any details that help verify your ownership — e.g. EIN, founding year, Instagram handle, or where we can confirm you run the business…"
                  className="resize-none bg-[#241810] border-white/20 text-white placeholder:text-white/40 focus-visible:ring-[#CA922B]/40"
                  rows={3}
                />
              </div>

              {/* Attestation — required by the /claims endpoint */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={claimAttested}
                  onChange={e => setClaimAttested(e.target.checked)}
                  className="mt-0.5 accent-[#CA922B] w-4 h-4 shrink-0"
                />
                <span className="text-xs text-white/70 leading-relaxed group-hover:text-white/90 transition-colors">
                  I confirm that I am the owner or authorized representative of this business and that the information I have provided is accurate to the best of my knowledge. *
                </span>
              </label>

              {claimError && (
                <p className="text-red-500 text-xs font-medium">{claimError}</p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleClaimSubmit}
                  disabled={claimLoading || !claimName.trim() || !claimEmail.trim() || !claimAttested}
                  className="bg-[#CA922B] hover:bg-[#B07A20] text-white rounded-xl px-6 py-2.5 text-sm font-semibold"
                >
                  {claimLoading ? "Submitting…" : "Submit Claim"}
                </Button>
                <button
                  onClick={() => { setClaimOpen(false); setClaimError(null); }}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom action bar — matches mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10" style={{ backgroundColor: "#1A1209" }}>
        <a href={business.phone ? `tel:${business.phone}` : undefined}
          className="flex-1 flex flex-col items-center justify-center py-4 gap-1"
          style={{ color: business.phone ? "#CA922B" : "rgba(255,255,255,0.25)" }}>
          <Phone className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Call</span>
        </a>
        <button onClick={handleCheckIn}
          className="flex-1 flex flex-col items-center justify-center py-4 gap-1"
          style={{ backgroundColor: "#2D7A4F", color: "white" }}>
          <CheckCircle className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Check In</span>
        </button>
        <button onClick={() => document.querySelector<HTMLElement>('[data-value="reviews"]')?.click()}
          className="flex-1 flex flex-col items-center justify-center py-4 gap-1"
          style={{ backgroundColor: "#CA922B", color: "#1A1209" }}>
          <Star className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Review</span>
        </button>
      </div>
    </div>
  );
}
