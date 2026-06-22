import { useGetCurrentAuthUser, useGetMyProfile, useUpdateMyProfile, useListSavedPlaces, useGetBusiness } from "@workspace/api-client-react";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LogOut, Save, MapPin, Map, FlaskConical, Trophy, Star, Shield, Heart, Zap, Award,
  Crown, Search, Compass, Navigation, BadgeCheck, CheckCircle, Building2, Plane,
  Globe, Home, MessageCircle, Link2, Users, Hammer, Calendar, PartyPopper,
  Flag, Gem, Lock, ChevronDown, ChevronUp, Footprints
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Badge Definitions ──────────────────────────────────────────────────────

interface BadgeDef {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  requirements: string[];
  earned: boolean;
  progress?: { current: number; target: number; label: string };
  tier: "founding" | "discovery" | "trust" | "business" | "travel" | "community" | "events" | "premium" | "legacy";
  color: string;
  bg: string;
  ring: string;
}

const BADGE_CATEGORIES: { id: BadgeDef["tier"]; label: string; emoji: string }[] = [
  { id: "founding",   label: "Founding & Early Access",    emoji: "🏛️" },
  { id: "discovery",  label: "Discovery & Contribution",   emoji: "🗺️" },
  { id: "trust",      label: "Trust & Safety",             emoji: "🛡️" },
  { id: "business",   label: "Business Support",           emoji: "🏪" },
  { id: "travel",     label: "Travel & Exploration",       emoji: "✈️" },
  { id: "community",  label: "Community & Social",         emoji: "🤝" },
  { id: "events",     label: "Events",                     emoji: "🎉" },
  { id: "premium",    label: "Premium & Special",          emoji: "💎" },
  { id: "legacy",     label: "Legacy Tier",                emoji: "👑" },
];

function buildBadges(savedCount: number, isEarlyTester: boolean): BadgeDef[] {
  return [
    // ── Founding ──────────────────────────────────────────────────────────
    {
      id: "founding_member",
      icon: Crown,
      label: "Founding Member",
      description: "Joined before the public launch of Mapping with Melanin™.",
      requirements: ["Registered during waitlist or beta period", "Account created before official public launch date"],
      earned: isEarlyTester,
      tier: "founding",
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-300",
    },
    {
      id: "beta_tester",
      icon: FlaskConical,
      label: "Beta Tester",
      description: "Helped test the platform before launch.",
      requirements: ["Invited into beta testing", "Completed at least 3 platform activities"],
      earned: isEarlyTester,
      tier: "founding",
      color: "text-purple-600",
      bg: "bg-purple-50",
      ring: "ring-purple-300",
    },
    {
      id: "early_explorer",
      icon: Footprints,
      label: "Early Explorer",
      description: "Among the first active users of the platform.",
      requirements: ["Joined within first 90 days after launch", "Complete 10 platform activities"],
      earned: isEarlyTester,
      tier: "founding",
      color: "text-sky-600",
      bg: "bg-sky-50",
      ring: "ring-sky-300",
    },

    // ── Discovery ─────────────────────────────────────────────────────────
    {
      id: "trailblazer",
      icon: Map,
      label: "Trailblazer",
      description: "Helps expand the platform by discovering new places.",
      requirements: ["Submit 10 new businesses, events, or locations", "At least 5 approved by moderation"],
      earned: false,
      tier: "discovery",
      color: "text-orange-600",
      bg: "bg-orange-50",
      ring: "ring-orange-300",
    },
    {
      id: "community_scout",
      icon: Search,
      label: "Community Scout",
      description: "Consistently uncovers valuable community resources.",
      requirements: ["Submit 25 approved businesses, events, or locations", "Maintain approval rate above 80%"],
      earned: false,
      tier: "discovery",
      color: "text-teal-600",
      bg: "bg-teal-50",
      ring: "ring-teal-300",
    },
    {
      id: "culture_navigator",
      icon: Compass,
      label: "Culture Navigator",
      description: "Guides others through trusted recommendations.",
      requirements: ["Publish 20 reviews", "Average helpfulness score above platform average", "No moderation violations"],
      earned: false,
      tier: "discovery",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      ring: "ring-indigo-300",
    },
    {
      id: "pathfinder",
      icon: Navigation,
      label: "Pathfinder",
      description: "Leads discovery in new cities and regions.",
      requirements: ["Contribute in 5 or more cities", "Submit 50 total contributions"],
      earned: false,
      tier: "discovery",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-300",
    },

    // ── Trust & Safety ────────────────────────────────────────────────────
    {
      id: "verified_member",
      icon: BadgeCheck,
      label: "Verified Member",
      description: "Identity and profile verified.",
      requirements: ["Complete the verification process"],
      earned: false,
      tier: "trust",
      color: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-300",
    },
    {
      id: "safety_advocate",
      icon: Shield,
      label: "Safety Advocate",
      description: "Helps create safer community experiences.",
      requirements: ["Submit 10 verified safety surveys", "Submit 5 approved safety insights", "No false reports"],
      earned: false,
      tier: "trust",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      ring: "ring-cyan-300",
    },
    {
      id: "trusted_contributor",
      icon: CheckCircle,
      label: "Trusted Contributor",
      description: "Known for accurate and helpful content.",
      requirements: ["25 approved contributions", "Less than 5% moderation removals", "Account in good standing for 90 days"],
      earned: false,
      tier: "trust",
      color: "text-green-600",
      bg: "bg-green-50",
      ring: "ring-green-300",
    },
    {
      id: "community_compass",
      icon: Star,
      label: "Community Compass",
      description: "One of the platform's most trusted contributors.",
      requirements: ["100 approved contributions", "50 helpful votes from community", "Trust score above 95%"],
      earned: false,
      tier: "trust",
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      ring: "ring-yellow-300",
    },

    // ── Business Support ──────────────────────────────────────────────────
    {
      id: "community_supporter",
      icon: Heart,
      label: "Community Supporter",
      description: "Actively supports local businesses.",
      requirements: ["Review 20 businesses", "Save 10 businesses", "Check-in at 5 businesses"],
      earned: savedCount >= 10,
      progress: savedCount < 10 ? { current: savedCount, target: 10, label: "businesses saved" } : undefined,
      tier: "business",
      color: "text-rose-600",
      bg: "bg-rose-50",
      ring: "ring-rose-300",
    },
    {
      id: "business_advocate",
      icon: Building2,
      label: "Business Advocate",
      description: "Helps businesses join the platform.",
      requirements: ["Refer 5 businesses", "At least 2 claim their profile"],
      earned: false,
      tier: "business",
      color: "text-fuchsia-600",
      bg: "bg-fuchsia-50",
      ring: "ring-fuchsia-300",
    },
    {
      id: "local_champion",
      icon: Trophy,
      label: "Local Champion",
      description: "Dedicated supporter of community commerce.",
      requirements: ["Review 50 businesses", "Refer 10 businesses", "Participate in 10 community events"],
      earned: false,
      tier: "business",
      color: "text-[#CA922B]",
      bg: "bg-amber-50",
      ring: "ring-amber-400",
    },

    // ── Travel & Exploration ──────────────────────────────────────────────
    {
      id: "frequent_explorer",
      icon: Plane,
      label: "Frequent Explorer",
      description: "Actively explores new destinations.",
      requirements: ["Check-in or review locations in 3 cities"],
      earned: false,
      tier: "travel",
      color: "text-sky-600",
      bg: "bg-sky-50",
      ring: "ring-sky-300",
    },
    {
      id: "global_navigator",
      icon: Globe,
      label: "Global Navigator",
      description: "Uses the platform across multiple regions.",
      requirements: ["Contributions in 10 cities", "Reviews in at least 3 states"],
      earned: false,
      tier: "travel",
      color: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-300",
    },
    {
      id: "city_guide",
      icon: MapPin,
      label: "City Guide",
      description: "Local expert for a specific city.",
      requirements: ["25 approved contributions within one city", "Minimum 10 helpful votes"],
      earned: false,
      tier: "travel",
      color: "text-red-600",
      bg: "bg-red-50",
      ring: "ring-red-300",
    },
    {
      id: "neighborhood_insider",
      icon: Home,
      label: "Neighborhood Insider",
      description: "Provides valuable relocation and neighborhood insights.",
      requirements: ["Complete 20 neighborhood surveys", "Receive 10 helpful votes"],
      earned: false,
      tier: "travel",
      color: "text-lime-600",
      bg: "bg-lime-50",
      ring: "ring-lime-300",
    },

    // ── Community & Social ────────────────────────────────────────────────
    {
      id: "community_voice",
      icon: MessageCircle,
      label: "Community Voice",
      description: "Active and respected contributor.",
      requirements: ["Create 25 posts or discussions", "Receive 25 reactions or helpful votes"],
      earned: false,
      tier: "community",
      color: "text-violet-600",
      bg: "bg-violet-50",
      ring: "ring-violet-300",
    },
    {
      id: "connector",
      icon: Link2,
      label: "Connector",
      description: "Brings people together.",
      requirements: ["Refer 10 members", "At least 5 create accounts"],
      earned: false,
      tier: "community",
      color: "text-pink-600",
      bg: "bg-pink-50",
      ring: "ring-pink-300",
    },
    {
      id: "networker",
      icon: Users,
      label: "Networker",
      description: "Engages with groups and conversations.",
      requirements: ["Join 5 groups", "Participate in 25 discussions"],
      earned: false,
      tier: "community",
      color: "text-teal-600",
      bg: "bg-teal-50",
      ring: "ring-teal-300",
    },
    {
      id: "community_builder",
      icon: Hammer,
      label: "Community Builder",
      description: "Strengthens community engagement.",
      requirements: ["Create or organize 3 approved events", "Attend 10 events"],
      earned: false,
      tier: "community",
      color: "text-orange-600",
      bg: "bg-orange-50",
      ring: "ring-orange-300",
    },

    // ── Events ────────────────────────────────────────────────────────────
    {
      id: "event_enthusiast",
      icon: Calendar,
      label: "Event Enthusiast",
      description: "Active event participant.",
      requirements: ["RSVP to 10 events", "Attend 5 events"],
      earned: false,
      tier: "events",
      color: "text-fuchsia-600",
      bg: "bg-fuchsia-50",
      ring: "ring-fuchsia-300",
    },
    {
      id: "community_host",
      icon: PartyPopper,
      label: "Community Host",
      description: "Creates experiences for others.",
      requirements: ["Host 5 approved events"],
      earned: false,
      tier: "events",
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-300",
    },

    // ── Premium & Special ─────────────────────────────────────────────────
    {
      id: "vip_member",
      icon: Zap,
      label: "VIP Member",
      description: "Premium member of Mapping with Melanin™.",
      requirements: ["Active paid membership"],
      earned: false,
      tier: "premium",
      color: "text-[#CA922B]",
      bg: "bg-amber-50",
      ring: "ring-amber-400",
    },
    {
      id: "ambassador",
      icon: Flag,
      label: "Ambassador",
      description: "Represents Mapping with Melanin™ in the community.",
      requirements: ["Invitation only", "Positive account standing", "Community leadership demonstrated"],
      earned: false,
      tier: "premium",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-300",
    },
    {
      id: "founders_circle",
      icon: Gem,
      label: "Founder's Circle",
      description: "Early supporters of the mission.",
      requirements: ["Waitlist member", "Beta participation", "Active during first year"],
      earned: isEarlyTester,
      tier: "premium",
      color: "text-purple-600",
      bg: "bg-purple-50",
      ring: "ring-purple-300",
    },

    // ── Legacy ────────────────────────────────────────────────────────────
    {
      id: "legacy_builder",
      icon: Award,
      label: "Legacy Builder",
      description: "The highest honor on the platform. Awarded by manual review.",
      requirements: [
        "250 approved contributions",
        "25 referred members",
        "10 referred businesses",
        "100 helpful votes",
        "No serious moderation violations",
        "Account active for 1 year minimum",
      ],
      earned: false,
      tier: "legacy",
      color: "text-[#CA922B]",
      bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
      ring: "ring-amber-400",
    },
  ];
}

// ─── Badge Card ──────────────────────────────────────────────────────────────

function BadgeCard({ badge }: { badge: BadgeDef }) {
  const [open, setOpen] = useState(false);
  const Icon = badge.icon;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden
        ${badge.earned
          ? `${badge.bg} ring-1 ${badge.ring} border-transparent shadow-sm`
          : "bg-white border-[#3A1F0E]/8"
        }`}
    >
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setOpen(v => !v)}
      >
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all
          ${badge.earned ? "bg-white/70 shadow-sm" : "bg-[#FAF6EF]"}`}>
          {badge.earned
            ? <Icon className={`w-5 h-5 ${badge.color}`} />
            : <Lock className="w-4 h-4 text-[#3A1F0E]/25" />
          }
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold leading-tight truncate
              ${badge.earned ? "text-[#3A1F0E]" : "text-[#3A1F0E]/45"}`}>
              {badge.label}
            </p>
            {badge.earned && (
              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.bg} ${badge.color} ring-1 ${badge.ring}`}>
                Earned
              </span>
            )}
          </div>
          <p className={`text-xs leading-snug mt-0.5 line-clamp-1
            ${badge.earned ? "text-[#3A1F0E]/60" : "text-[#3A1F0E]/35"}`}>
            {badge.description}
          </p>

          {/* Progress bar */}
          {badge.progress && !badge.earned && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#3A1F0E]/50">{badge.progress.label}</span>
                <span className="text-[10px] font-bold text-[#CA922B]">{badge.progress.current}/{badge.progress.target}</span>
              </div>
              <div className="h-1.5 bg-[#3A1F0E]/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#CA922B] rounded-full transition-all"
                  style={{ width: `${Math.min(100, (badge.progress.current / badge.progress.target) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Chevron */}
        <div className={`shrink-0 ${badge.earned ? "text-[#3A1F0E]/40" : "text-[#3A1F0E]/20"}`}>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded requirements */}
      {open && (
        <div className="px-4 pb-4 border-t border-[#3A1F0E]/6 pt-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#3A1F0E]/40 mb-2">Requirements</p>
          <ul className="space-y-1">
            {badge.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#3A1F0E]/60">
                <span className={`mt-0.5 shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold
                  ${badge.earned ? `${badge.color} ${badge.bg}` : "bg-[#3A1F0E]/8 text-[#3A1F0E]/40"}`}>
                  {badge.earned ? "✓" : "·"}
                </span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Badge Panel ─────────────────────────────────────────────────────────────

function BadgePanel({ savedCount, isEarlyTester }: { savedCount: number; isEarlyTester: boolean }) {
  const [activeCategory, setActiveCategory] = useState<BadgeDef["tier"] | "all">("all");
  const allBadges = buildBadges(savedCount, isEarlyTester);
  const earnedCount = allBadges.filter(b => b.earned).length;
  const filtered = activeCategory === "all" ? allBadges : allBadges.filter(b => b.tier === activeCategory);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] flex items-center gap-2">
            <Trophy className="text-[#CA922B] w-6 h-6" /> Community Badges
          </h3>
          <p className="text-sm text-[#3A1F0E]/50 mt-0.5">
            {earnedCount} of {allBadges.length} badges earned
          </p>
        </div>
        {/* Progress pill */}
        <div className="flex items-center gap-2 bg-[#FAF6EF] rounded-full px-4 py-2 border border-[#3A1F0E]/8">
          <div className="w-24 h-1.5 bg-[#3A1F0E]/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#CA922B] rounded-full"
              style={{ width: `${(earnedCount / allBadges.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#CA922B]">{Math.round((earnedCount / allBadges.length) * 100)}%</span>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        <button
          onClick={() => setActiveCategory("all")}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all
            ${activeCategory === "all"
              ? "bg-[#2B1507] text-white border-transparent"
              : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/10 hover:border-[#3A1F0E]/25"
            }`}
        >
          All ({allBadges.length})
        </button>
        {BADGE_CATEGORIES.map(cat => {
          const catBadges = allBadges.filter(b => b.tier === cat.id);
          const catEarned = catBadges.filter(b => b.earned).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
                ${activeCategory === cat.id
                  ? "bg-[#2B1507] text-white border-transparent"
                  : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/10 hover:border-[#3A1F0E]/25"
                }`}
            >
              {cat.emoji} {cat.label} {catEarned > 0 && `· ${catEarned}/${catBadges.length}`}
            </button>
          );
        })}
      </div>

      {/* Category heading when filtered */}
      {activeCategory !== "all" && (
        <div className="mb-4">
          {BADGE_CATEGORIES.filter(c => c.id === activeCategory).map(cat => (
            <h4 key={cat.id} className="text-lg font-serif font-bold text-[#3A1F0E]">
              {cat.emoji} {cat.label}
            </h4>
          ))}
        </div>
      )}

      {/* Badge grid — when showing all, group by category */}
      {activeCategory === "all" ? (
        <div className="space-y-8">
          {BADGE_CATEGORIES.map(cat => {
            const catBadges = allBadges.filter(b => b.tier === cat.id);
            const catEarned = catBadges.filter(b => b.earned).length;
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#3A1F0E]/50">
                    {cat.emoji} {cat.label}
                  </h4>
                  <span className="text-xs text-[#3A1F0E]/35 font-bold">
                    {catEarned}/{catBadges.length}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {catBadges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Profile() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const { data: profile } = useGetMyProfile({ query: { queryKey: ["getMyProfile"], enabled: !!auth?.user } });
  const { data: savedPlaces } = useListSavedPlaces({ query: { queryKey: ["listSavedPlaces"], enabled: !!auth?.user } });

  const updateProfile = useUpdateMyProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
    }
  }, [profile]);

  if (authLoading) return <div className="p-10 bg-[#FAF6EF] min-h-screen"><Skeleton className="h-64 w-full rounded-3xl" /></div>;

  if (!auth?.user) {
    return <Redirect to="/login" />;
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ data: { firstName, lastName } }, {
      onSuccess: () => {
        toast({ title: "Profile updated" });
        queryClient.invalidateQueries({ queryKey: ["getMyProfile"] });
        queryClient.invalidateQueries({ queryKey: ["getCurrentAuthUser"] });
      }
    });
  };

  const handleLogout = () => { window.location.href = "/api/logout"; };

  const savedCount = savedPlaces?.businessIds?.length ?? 0;
  const isEarlyTester = (auth?.user as any)?.role === "tester";

  const [kinfolkPoints, setKinfolkPoints] = useState<number | null>(null);
  useEffect(() => {
    if (!auth?.user) return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/points`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setKinfolkPoints(d.total ?? 0); })
      .catch(() => {});
  }, [auth?.user]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      <div className="bg-[#2B1507] h-32 md:h-48 w-full absolute top-0 z-0" />

      <div className="container mx-auto px-4 md:px-6 py-12 relative z-10 max-w-6xl">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight">Your Profile</h1>
          <Button variant="outline" onClick={handleLogout} className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white hover:text-[#2B1507] backdrop-blur h-10">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
            <div className="text-2xl font-serif font-bold text-[#CA922B]">{savedCount}</div>
            <div className="text-xs text-[#F5EBD8]/70 uppercase tracking-wider font-bold mt-1">Saved</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
            <div className="text-lg font-serif font-bold text-[#CA922B]/70">—</div>
            <div className="text-xs text-[#F5EBD8]/70 uppercase tracking-wider font-bold mt-1">Reviews</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
            <div className="text-2xl font-serif font-bold text-[#CA922B]">{kinfolkPoints !== null ? kinfolkPoints : "—"}</div>
            <div className="text-xs text-[#F5EBD8]/70 uppercase tracking-wider font-bold mt-1">Kinfolk Pts</div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left column: profile card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-8 border border-[#3A1F0E]/5 shadow-sm text-center relative mt-8 md:mt-0">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#FAF6EF] border-4 border-white shadow-lg flex items-center justify-center -mt-16 mb-4 text-[#CA922B] text-3xl font-serif font-bold overflow-hidden">
                {profile?.profileImageUrl ? (
                  <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.firstName?.[0] || profile?.email?.[0]?.toUpperCase() || "M"
                )}
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#3A1F0E]">{profile?.firstName} {profile?.lastName}</h2>
              <p className="text-sm text-[#3A1F0E]/50 mb-3">{profile?.email}</p>
              {isEarlyTester && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mb-6 border border-purple-200">
                  <FlaskConical className="w-3.5 h-3.5" /> Early Tester
                </span>
              )}

              <form onSubmit={handleUpdate} className="space-y-5 text-left mt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70">First Name</label>
                  <Input className="bg-[#FAF6EF] border-transparent rounded-xl h-12 focus-visible:ring-[#CA922B]" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70">Last Name</label>
                  <Input className="bg-[#FAF6EF] border-transparent rounded-xl h-12 focus-visible:ring-[#CA922B]" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <Button type="submit" className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-12 mt-4" disabled={updateProfile.isPending}>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </form>
            </div>

            {/* Saved Places below profile card on mobile / side column */}
            <div className="mt-6">
              <h3 className="text-xl font-serif font-bold text-[#3A1F0E] flex items-center gap-2 mb-4">
                <BookmarkIcon className="text-[#CA922B] w-5 h-5" /> Saved Places
              </h3>
              <div className="bg-white rounded-3xl p-6 border border-[#3A1F0E]/5 shadow-sm min-h-[180px]">
                {(!savedPlaces || savedPlaces.businessIds.length === 0) ? (
                  <div className="flex flex-col items-center justify-center text-[#3A1F0E]/40 py-10">
                    <Map size={36} className="mb-3 opacity-40" />
                    <p className="text-sm font-serif text-center">No saved places yet.</p>
                    <Link href="/discover">
                      <Button className="mt-4 rounded-full bg-[#2B1507] hover:bg-[#1a0c04] text-white px-6 h-10 text-sm">Explore</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedPlaces.businessIds.map(id => (
                      <SavedPlaceCard key={id} id={id} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right 2 columns: full badge panel + quick links */}
          <div className="md:col-span-2 mt-8 md:mt-0 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#3A1F0E]/5 shadow-sm">
              <BadgePanel savedCount={savedCount} isEarlyTester={isEarlyTester} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { label: "Membership", href: "/membership", emoji: "💎" },
                { label: "Billing & Invoices", href: "/billing", emoji: "📄" },
                { label: "Partner Deals", href: "/affiliate", emoji: "🏷️" },
                { label: "Mentorship", href: "/mentorship", emoji: "🤝" },
              ] as const).map(({ label, href, emoji }) => (
                <Link key={href} href={href}>
                  <div className="bg-white rounded-2xl p-4 border border-[#3A1F0E]/5 shadow-sm text-center hover:border-[#CA922B]/30 hover:shadow-md transition-all cursor-pointer group">
                    <div className="text-2xl mb-2">{emoji}</div>
                    <div className="text-xs font-bold text-[#3A1F0E] group-hover:text-[#CA922B] transition-colors leading-tight">{label}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookmarkIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
}

function SavedPlaceCard({ id }: { id: string }) {
  const { data: biz, isLoading } = useGetBusiness(id, { query: { queryKey: ["getBusiness", id], enabled: !!id } });

  if (isLoading) return <Skeleton className="h-20 w-full rounded-2xl" />;
  if (!biz) return null;

  return (
    <Link href={`/businesses/${id}`}>
      <div className="flex gap-3 p-3 border border-[#3A1F0E]/10 rounded-2xl hover:border-[#CA922B] transition-colors cursor-pointer bg-white group">
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#FAF6EF]">
          {biz.imageUrl ? (
            <img src={biz.imageUrl} alt={biz.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin size={20} className="text-[#3A1F0E]/20" />
            </div>
          )}
        </div>
        <div className="overflow-hidden flex flex-col justify-center flex-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#CA922B]">{biz.category}</span>
          <h4 className="font-serif font-bold text-base text-[#3A1F0E] truncate leading-tight">{biz.name}</h4>
          <div className="flex items-center gap-1 text-xs text-[#3A1F0E]/50 mt-0.5">
            <MapPin size={9} />
            <span className="truncate">{biz.city}, {biz.state}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
