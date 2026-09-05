import { useGetCurrentAuthUser, useGetMyProfile, useUpdateMyProfile, useListSavedPlaces, useGetBusiness, useUnsavePlace } from "@workspace/api-client-react";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LogOut, Save, MapPin, Map, FlaskConical, Trophy, Star, Shield, Heart, Zap, Award,
  Crown, Search, Compass, Navigation, BadgeCheck, CheckCircle, Building2, Plane,
  Globe, Home, MessageCircle, Link2, Users, Hammer, Calendar, PartyPopper,
  Flag, Gem, Lock, ChevronDown, ChevronUp, Footprints, Camera, Loader2,
  Settings, ChevronRight, Eye, EyeOff, KeyRound, Trash2, Sparkles, X
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import KinfolkTonePreference from "@/components/kinfolk/KinfolkTonePreference";
import { SocialVideoPreferences } from "@/features/profile/SocialVideoPreferences";
import { BusinessSupportPreferences } from "@/features/profile/BusinessSupportPreferences";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const BASE = import.meta.env.BASE_URL;

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
  { id: "community",  label: "Community & Social",         emoji: "🤝🏾" },
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
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "reserved">("idle");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setUsername((profile as any).username || "");
      setBio((profile as any).bio || "");
      setJobTitle((profile as any).jobTitle || "");
      setIndustry((profile as any).industry || "");
    }
  }, [profile]);

  // ── All hooks must be declared before any early return ─────────────────
  // React rule: hooks must run on every render in the same order.
  const [signOutAllLoading, setSignOutAllLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [kinfolkPoints, setKinfolkPoints] = useState<number | null>(null);

  // ── Safety Alerts settings ─────────────────────────────────────────────────
  const [safetyAlertPolice, setSafetyAlertPolice] = useState(true);
  const [safetyAlertIce, setSafetyAlertIce] = useState(true);
  const [safetyAlertRadius, setSafetyAlertRadius] = useState(5);
  const [safetySettingsLoading, setSafetySettingsLoading] = useState(false);

  // ── Reviews count + recent reviews ────────────────────────────────────────
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [recentReviews, setRecentReviews] = useState<Array<{ id: string; businessId: string; rating: number; body: string | null; badge: string | null; createdAt: string }>>([]);

  // ── Network (followers / following) ───────────────────────────────────────
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);

  // ── Community posts count ─────────────────────────────────────────────────
  const [postCount, setPostCount] = useState<number | null>(null);

  // ── Kinfolk preferences (What Kinfolk Knows About You) ────────────────────
  const [kinfolkPrefs, setKinfolkPrefs] = useState<{
    favoriteCategories: string[];
    favoriteCities: string[];
    lifestyleServices: string[];
    culturalInterests: string[];
    personalityMode: string | null;
    travelCompanion: string | null;
  } | null>(null);

  // ── Account Settings state ─────────────────────────────────────────────────
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // ── Community Impact ───────────────────────────────────────────────────────
  const [impact, setImpact] = useState<{
    reviewCount: number;
    businessesReviewedCount: number;
    communityPosts: number;
    eventsAttended: number;
    savedBusinesses: number;
    referralsMade: number;
  } | null>(null);

  // ── Recommended Spots ──────────────────────────────────────────────────────
  const [recommendedSpots, setRecommendedSpots] = useState<Array<{
    id: string;
    businessId: string;
    businessName?: string;
    blurb: string | null;
    stance: string;
  }>>([]);

  // ── Health / Pinned Topics ─────────────────────────────────────────────────
  const [healthTopics, setHealthTopics] = useState<{
    topicIds: string[];
    pinnedTopicIds: string[];
  } | null>(null);

  // ── Circles ────────────────────────────────────────────────────────────────
  const [myCircles, setMyCircles] = useState<Array<{
    id: string;
    name: string;
    memberCount?: number;
    description?: string;
  }>>([]);

  useEffect(() => {
    if (!auth?.user) return;
    const userId = (auth.user as any).id;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    // Points
    fetch(`${base}/api/points`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setKinfolkPoints(d.total ?? 0); })
      .catch(() => {});
    // Reviews (count + recent)
    fetch(`${base}/api/reviews/mine`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setReviewCount(d.count ?? 0); setRecentReviews(d.reviews?.slice(0, 3) ?? []); } })
      .catch(() => {});
    // Followers / following counts from public profile endpoint
    if (userId) {
      fetch(`${base}/api/users/${userId}/profile`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) { setFollowersCount(d.followersCount ?? 0); setFollowingCount(d.followingCount ?? 0); } })
        .catch(() => {});
    }
    // Post count (posts authored by me)
    fetch(`${base}/api/community/posts?authorId=${userId}&limit=1`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPostCount(d.total ?? d.posts?.length ?? 0); })
      .catch(() => {});
    // Safety alert settings
    fetch(`${base}/api/users/settings`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setSafetyAlertPolice(d.safetyAlertPolice ?? true);
          setSafetyAlertIce(d.safetyAlertIce ?? true);
          setSafetyAlertRadius(d.safetyAlertRadiusMiles ?? 5);
        }
      })
      .catch(() => {});
    // Kinfolk personalization preferences
    fetch(`${base}/api/kinfolk/preferences`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.preferences) {
          setKinfolkPrefs({
            favoriteCategories: d.preferences.favoriteCategories ?? [],
            favoriteCities:     d.preferences.favoriteCities ?? [],
            lifestyleServices:  d.preferences.lifestyleServices ?? [],
            culturalInterests:  d.preferences.culturalInterests ?? [],
            personalityMode:    d.preferences.personalityMode ?? null,
            travelCompanion:    d.preferences.travelCompanion ?? null,
          });
        }
      })
      .catch(() => {});
    // Community Impact
    if (userId) {
      fetch(`${base}/api/community-impact/${userId}`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.stats) setImpact(d.stats); })
        .catch(() => {});
      // Recommended Spots
      fetch(`${base}/api/users/${userId}/recommended-spots`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.spots) setRecommendedSpots(d.spots); })
        .catch(() => {});
    }
    // Health / Pinned Topics (private to self)
    fetch(`${base}/api/health-hub/topics/mine`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setHealthTopics(d); })
      .catch(() => {});
    // My Circles
    fetch(`${base}/api/circles`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.circles) setMyCircles(d.circles.slice(0, 3)); })
      .catch(() => {});
  }, [auth?.user]);

  // Sync isPrivate from profile data once loaded
  useEffect(() => {
    if (profile) {
      setIsPrivate((profile as any).isPrivate === true);
    }
  }, [profile]);

  if (authLoading) return <div className="p-10 bg-[#FAF6EF] min-h-screen"><Skeleton className="h-64 w-full rounded-3xl" /></div>;

  if (!auth?.user) {
    return <Redirect to="/login" />;
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === "taken" || usernameStatus === "reserved") {
      toast({ title: "Username unavailable", description: "Choose a different username.", variant: "destructive" });
      return;
    }
    updateProfile.mutate({ data: { firstName, lastName, username: username || undefined, bio: bio || undefined, jobTitle: jobTitle || undefined, industry: industry || undefined } as any }, {
      onSuccess: () => {
        toast({ title: "Profile updated", description: "Your changes have been saved." });
        queryClient.invalidateQueries({ queryKey: ["getMyProfile"] });
        queryClient.invalidateQueries({ queryKey: ["getCurrentAuthUser"] });
      },
      onError: (err: unknown) => {
        const msg = (err as any)?.message ?? "Could not save — please try again";
        toast({ title: "Update failed", description: msg, variant: "destructive" });
      },
    });
  };

  const checkUsername = async (val: string) => {
    const clean = val.trim().toLowerCase().replace(/^@/, "");
    if (!clean || clean === ((profile as any)?.username ?? "")) { setUsernameStatus("idle"); return; }
    if (clean.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const r = await fetch(`${base}/api/users/check-username/${encodeURIComponent(clean)}`, { credentials: "include" });
      const d = await r.json();
      if (d.reason === "That username is reserved.") setUsernameStatus("reserved");
      else setUsernameStatus(d.available ? "available" : "taken");
    } catch { setUsernameStatus("idle"); }
  };

  const saveSafetySettings = async (patch: { safetyAlertPolice?: boolean; safetyAlertIce?: boolean; safetyAlertRadiusMiles?: number }) => {
    setSafetySettingsLoading(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      await fetch(`${base}/api/users/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch { /* silent */ } finally { setSafetySettingsLoading(false); }
  };

  const handleLogout = async () => {
    // Must await clearWebToken() so the server deletes the session and the
    // browser processes the Set-Cookie header clearing the HttpOnly sid cookie
    // BEFORE the page navigates. Without the await, window.location.replace
    // fires while the session is still live and the user appears still logged in.
    const { clearWebToken } = await import("@/lib/webAuth");
    await clearWebToken();
    queryClient.clear();
    window.location.replace("/");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Photo must be under 10MB", variant: "destructive" }); return; }
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    // Upload
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(`${BASE}api/users/avatar`, { method: "POST", credentials: "include", body: formData });
      if (res.ok) {
        toast({ title: "Profile photo updated" });
        // Only invalidate the profile query — auth session is not affected by an avatar change
        queryClient.invalidateQueries({ queryKey: ["getMyProfile"] });
      } else {
        const errText = await res.text().catch(() => "");
        toast({ title: "Could not upload photo", description: errText || "Please try again.", variant: "destructive" });
        setAvatarPreview(null);
      }
    } catch (err) {
      toast({ title: "Upload failed", description: "Check your connection and try again.", variant: "destructive" });
      setAvatarPreview(null);
    }
    finally { setAvatarUploading(false); }
  };
  const togglePrivacy = async () => {
    setPrivacyLoading(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const next = !isPrivate;
      const res = await fetch(`${base}/api/auth/user/privacy`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: next }),
      });
      if (res.ok) {
        setIsPrivate(next);
        toast({ title: next ? "Profile set to Private" : "Profile set to Public", description: next ? "Only you can see your activity." : "Your profile is visible to the community." });
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string };
        toast({ title: "Could not update privacy", description: d.error ?? "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Connection error", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (newPassword.length < 8) { toast({ title: "New password must be at least 8 characters", variant: "destructive" }); return; }
    setPasswordLoading(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await res.json().catch(() => ({})) as { success?: boolean; error?: string };
      if (res.ok && d.success) {
        toast({ title: "Password updated", description: "Your new password is active." });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        setShowPasswordPanel(false);
      } else {
        toast({ title: "Could not update password", description: d.error ?? "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Connection error", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    if (!window.confirm("Sign out all devices?\n\nThis will immediately invalidate every active session across all your devices, including this one. You will need to sign in again everywhere.")) return;
    setSignOutAllLoading(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/auth/logout-all`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        handleLogout();
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        alert(data.error ?? "Could not sign out all devices. Please try again.");
      }
    } catch {
      alert("Could not connect. Please check your connection and try again.");
    } finally {
      setSignOutAllLoading(false);
    }
  };

  const savedCount = savedPlaces?.businessIds?.length ?? 0;
  const isEarlyTester = (auth?.user as any)?.role === "tester";
  const isAdminUser = (auth?.user as any)?.role === "admin";

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Dark header band — tall enough on mobile to cover the two-row header + stats */}
      <div className="bg-[#2B1507] h-72 sm:h-60 md:h-52 w-full absolute top-0 z-0" />

      <div className="container mx-auto px-4 md:px-6 pt-10 pb-28 sm:pb-10 relative z-10 max-w-6xl">
        {/* Top bar — stacks vertically on mobile, horizontal on sm+ */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight">Your Profile</h1>

          {/* Controls — on mobile: admin button full-width, then security buttons share a row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {isAdminUser && (
              <Link href="/admin" className="block sm:inline-block">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-full bg-[#CA922B]/20 text-[#CA922B] border-[#CA922B]/40 hover:bg-[#CA922B] hover:text-white hover:border-[#CA922B] backdrop-blur h-10 text-xs font-bold"
                >
                  <svg className="mr-1.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>
                  Switch to Admin Dashboard
                </Button>
              </Link>
            )}
            {/* All Devices + Sign Out share a row on mobile */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSignOutAll}
                disabled={signOutAllLoading}
                title="Sign out of every device and session"
                className="flex-1 sm:flex-none rounded-full bg-white/10 text-white border-white/20 hover:bg-red-600 hover:text-white hover:border-red-600 backdrop-blur h-10 text-xs"
              >
                <Shield className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                {signOutAllLoading ? "Signing out…" : "All Devices"}
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex-1 sm:flex-none rounded-full bg-white/10 text-white border-white/20 hover:bg-white hover:text-[#2B1507] backdrop-blur h-10"
              >
                <LogOut className="mr-2 h-4 w-4 shrink-0" /> Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
            <div className="text-2xl font-serif font-bold text-[#CA922B]">{savedCount}</div>
            <div className="text-xs text-[#F5EBD8]/70 uppercase tracking-wider font-bold mt-1">Saved</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
            <div className="text-2xl font-serif font-bold text-[#CA922B]">{reviewCount !== null ? reviewCount : "—"}</div>
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
              <div className="relative w-24 h-24 mx-auto -mt-16 mb-4">
                <div className="w-24 h-24 rounded-full bg-[#FAF6EF] border-4 border-white shadow-lg flex items-center justify-center text-[#CA922B] text-3xl font-serif font-bold overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile?.firstName?.[0] || profile?.email?.[0]?.toUpperCase() || "M"
                  )}
                </div>
                {/* Upload button overlay */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#CA922B] border-2 border-white shadow-lg flex items-center justify-center hover:bg-[#B38024] transition-colors disabled:opacity-60"
                  title="Upload profile photo"
                >
                  {avatarUploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#3A1F0E]">{profile?.firstName} {profile?.lastName}</h2>
              {(profile as any)?.username && (
                <p className="text-sm font-medium text-[#CA922B] -mt-0.5">@{(profile as any).username}</p>
              )}
              {(profile as any)?.bio && (
                <p className="text-xs text-[#3A1F0E]/60 mt-1 max-w-xs text-center">{(profile as any).bio}</p>
              )}
              {(profile as any)?.jobTitle && (
                <p className="text-xs text-[#3A1F0E]/50 mt-0.5">{(profile as any).jobTitle}{(profile as any)?.industry ? ` · ${(profile as any).industry}` : ""}</p>
              )}
              <p className="text-sm text-[#3A1F0E]/50 mb-3 mt-1">{profile?.email}</p>
              {isEarlyTester && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mb-6 border border-purple-200">
                  <FlaskConical className="w-3.5 h-3.5" /> Early Tester
                </span>
              )}

              <form onSubmit={handleUpdate} className="space-y-4 text-left mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70">First Name</label>
                    <Input className="bg-[#FAF6EF] border-transparent rounded-xl h-11 focus-visible:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/40" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70">Last Name</label>
                    <Input className="bg-[#FAF6EF] border-transparent rounded-xl h-11 focus-visible:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/40" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3A1F0E]/40 text-sm">@</span>
                    <Input
                      className="bg-[#FAF6EF] border-transparent rounded-xl h-11 focus-visible:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 pl-7"
                      value={username}
                      placeholder="your_handle"
                      onChange={e => { setUsername(e.target.value); setUsernameStatus("idle"); }}
                      onBlur={e => checkUsername(e.target.value)}
                    />
                  </div>
                  {usernameStatus === "taken" && <p className="text-xs text-red-500">Username already taken</p>}
                  {usernameStatus === "reserved" && <p className="text-xs text-red-500">Username reserved</p>}
                  {usernameStatus === "available" && <p className="text-xs text-green-600">Username available</p>}
                  {usernameStatus === "checking" && <p className="text-xs text-[#3A1F0E]/40">Checking…</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70">Bio <span className="font-normal normal-case text-[#3A1F0E]/40">({bio.length}/300)</span></label>
                  <textarea
                    className="w-full bg-[#FAF6EF] border-transparent rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 resize-none"
                    rows={3}
                    placeholder="Tell the community who you are…"
                    value={bio}
                    maxLength={300}
                    onChange={e => setBio(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70">Job Title</label>
                    <Input className="bg-[#FAF6EF] border-transparent rounded-xl h-11 focus-visible:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 text-sm" placeholder="e.g. Teacher" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70">Industry</label>
                    <Input className="bg-[#FAF6EF] border-transparent rounded-xl h-11 focus-visible:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 text-sm" placeholder="e.g. Education" value={industry} onChange={e => setIndustry(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-12 mt-2" disabled={updateProfile.isPending || usernameStatus === "taken" || usernameStatus === "reserved"}>
                  <Save className="mr-2 h-4 w-4" /> {updateProfile.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </form>
            </div>

            {/* Saved Places below profile card on mobile / side column */}
            <div className="mt-6">
              <h3 className="text-xl font-serif font-bold text-[#3A1F0E] flex items-center gap-2 mb-4">
                <BookmarkIcon className="text-[#CA922B] w-5 h-5" /> Saved Places
              </h3>
              <div className="bg-white rounded-3xl p-6 border border-[#3A1F0E]/5 shadow-sm min-h-[180px]">
                {(!savedPlaces?.businessIds?.length) ? (
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
                { label: "Mentorship", href: "/mentorship", emoji: "🤝🏾" },
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

        {/* ── Your Activity ──────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-3xl p-6 border border-[#3A1F0E]/5 shadow-sm">
            <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#CA922B]" /> Your Activity
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#FAF6EF] rounded-2xl p-4 text-center">
                <div className="text-2xl font-serif font-bold text-[#CA922B]">{reviewCount !== null ? reviewCount : "—"}</div>
                <div className="text-xs text-[#3A1F0E]/60 font-bold uppercase tracking-wider mt-1">Reviews</div>
              </div>
              <div className="bg-[#FAF6EF] rounded-2xl p-4 text-center">
                <div className="text-2xl font-serif font-bold text-[#CA922B]">{postCount !== null ? postCount : "—"}</div>
                <div className="text-xs text-[#3A1F0E]/60 font-bold uppercase tracking-wider mt-1">Posts</div>
              </div>
            </div>
            {recentReviews.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">Recent Reviews</div>
                {recentReviews.map(r => (
                  <Link key={r.id} href={`/businesses/${r.businessId}`}>
                    <div className="flex items-center gap-3 p-3 bg-[#FAF6EF] rounded-xl hover:bg-[#F0E8D9] transition-colors cursor-pointer">
                      <div className="flex gap-0.5 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < r.rating ? "text-[#CA922B] fill-[#CA922B]" : "text-[#3A1F0E]/20"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-[#3A1F0E]/70 truncate flex-1">{r.badge ?? r.body?.slice(0, 60) ?? "No comment"}</span>
                      <span className="text-xs text-[#3A1F0E]/40 shrink-0">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Link href="/community" className="flex-1">
                <button className="w-full text-xs font-bold text-[#CA922B] py-2.5 rounded-xl bg-[#CA922B]/10 hover:bg-[#CA922B]/20 transition-colors">My Posts →</button>
              </Link>
              <Link href="/community" className="flex-1">
                <button className="w-full text-xs font-bold text-[#CA922B] py-2.5 rounded-xl bg-[#CA922B]/10 hover:bg-[#CA922B]/20 transition-colors">My Reviews →</button>
              </Link>
            </div>
          </div>

          {/* ── Your Network ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-6 border border-[#3A1F0E]/5 shadow-sm">
            <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#CA922B]" /> Your Network
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#FAF6EF] rounded-2xl p-4 text-center">
                <div className="text-2xl font-serif font-bold text-[#CA922B]">{followersCount !== null ? followersCount : "—"}</div>
                <div className="text-xs text-[#3A1F0E]/60 font-bold uppercase tracking-wider mt-1">Followers</div>
              </div>
              <div className="bg-[#FAF6EF] rounded-2xl p-4 text-center">
                <div className="text-2xl font-serif font-bold text-[#CA922B]">{followingCount !== null ? followingCount : "—"}</div>
                <div className="text-xs text-[#3A1F0E]/60 font-bold uppercase tracking-wider mt-1">Following</div>
              </div>
              <div className="bg-[#FAF6EF] rounded-2xl p-4 text-center">
                <div className="text-2xl font-serif font-bold text-[#CA922B]">{kinfolkPoints !== null ? kinfolkPoints : "—"}</div>
                <div className="text-xs text-[#3A1F0E]/60 font-bold uppercase tracking-wider mt-1">Points</div>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/circles">
                <div className="flex items-center justify-between p-3.5 bg-[#FAF6EF] rounded-xl hover:bg-[#F0E8D9] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-[#CA922B] shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-[#3A1F0E]">Circles</div>
                      <div className="text-xs text-[#3A1F0E]/50">Your community groups</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3A1F0E]/30 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
              <Link href="/library">
                <div className="flex items-center justify-between p-3.5 bg-[#FAF6EF] rounded-xl hover:bg-[#F0E8D9] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <BookmarkIcon className="w-4 h-4 text-[#CA922B] shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-[#3A1F0E]">Library & Interests</div>
                      <div className="text-xs text-[#3A1F0E]/50">Topics, issues, and cultural content you follow</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3A1F0E]/30 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
              {(auth?.user as any)?.isBusinessOwner && (
                <Link href="/business-dashboard">
                  <div className="flex items-center justify-between p-3.5 bg-[#FAF6EF] rounded-xl hover:bg-[#F0E8D9] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-[#CA922B] shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-[#3A1F0E]">Business Dashboard</div>
                        <div className="text-xs text-[#3A1F0E]/50">Manage your business listings</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#3A1F0E]/30 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </Link>
              )}
              <Link href="/notifications">
                <div className="flex items-center justify-between p-3.5 bg-[#FAF6EF] rounded-xl hover:bg-[#F0E8D9] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-[#CA922B] shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-[#3A1F0E]">Notifications</div>
                      <div className="text-xs text-[#3A1F0E]/50">Activity, alerts, and updates</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3A1F0E]/30 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
              <Link href="/travel">
                <div className="flex items-center justify-between p-3.5 bg-[#FAF6EF] rounded-xl hover:bg-[#F0E8D9] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <Plane className="w-4 h-4 text-[#CA922B] shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-[#3A1F0E]">Kinfolk Travel</div>
                      <div className="text-xs text-[#3A1F0E]/50">Trip planner and city guides</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3A1F0E]/30 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
              <Link href="/referral-redirect">
                <div className="flex items-center justify-between p-3.5 bg-[#FAF6EF] rounded-xl hover:bg-[#F0E8D9] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-[#CA922B] shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-[#3A1F0E]">Refer a Friend</div>
                      <div className="text-xs text-[#3A1F0E]/50">Invite someone to the community</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3A1F0E]/30 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              </Link>
              {(auth?.user as any)?.role === "admin" && (
                <Link href="/admin">
                  <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer group border border-amber-200/50">
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-amber-800">Admin Panel</div>
                        <div className="text-xs text-amber-600/70">Platform management</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Safety Alerts ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#3A1F0E]/5 shadow-sm mt-8">
          <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#CA922B]" /> Safety Alerts
          </h3>
          <p className="text-xs text-[#3A1F0E]/50 mb-5">Control which community alerts you receive. These are community-reported — not connected to police databases.</p>
          <div className="space-y-3">
            {/* Police activity */}
            <div className="flex items-center justify-between p-4 bg-[#FAF6EF] rounded-2xl">
              <div>
                <div className="font-semibold text-sm text-[#3A1F0E]">Police Activity Alerts</div>
                <div className="text-xs text-[#3A1F0E]/60 mt-0.5">Community-reported police presence in your area</div>
              </div>
              <button
                disabled={safetySettingsLoading}
                onClick={() => {
                  const next = !safetyAlertPolice;
                  setSafetyAlertPolice(next);
                  saveSafetySettings({ safetyAlertPolice: next });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-60 ${
                  safetyAlertPolice ? "bg-[#2B1507] text-white" : "bg-[#CA922B]/15 text-[#CA922B]"
                }`}
              >
                {safetyAlertPolice ? "On" : "Off"}
              </button>
            </div>
            {/* ICE activity */}
            <div className="flex items-center justify-between p-4 bg-[#FAF6EF] rounded-2xl">
              <div>
                <div className="font-semibold text-sm text-[#3A1F0E]">Immigration Activity Alerts</div>
                <div className="text-xs text-[#3A1F0E]/60 mt-0.5">Community-reported ICE activity near you</div>
              </div>
              <button
                disabled={safetySettingsLoading}
                onClick={() => {
                  const next = !safetyAlertIce;
                  setSafetyAlertIce(next);
                  saveSafetySettings({ safetyAlertIce: next });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-60 ${
                  safetyAlertIce ? "bg-[#2B1507] text-white" : "bg-[#CA922B]/15 text-[#CA922B]"
                }`}
              >
                {safetyAlertIce ? "On" : "Off"}
              </button>
            </div>
            {/* Alert radius */}
            <div className="p-4 bg-[#FAF6EF] rounded-2xl">
              <div className="font-semibold text-sm text-[#3A1F0E] mb-3">Alert Radius</div>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 5, 10].map(r => (
                  <button
                    key={r}
                    disabled={safetySettingsLoading}
                    onClick={() => { setSafetyAlertRadius(r); saveSafetySettings({ safetyAlertRadiusMiles: r }); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-60 ${
                      safetyAlertRadius === r ? "bg-[#CA922B] text-white" : "bg-white border border-[#3A1F0E]/10 text-[#3A1F0E]/60 hover:border-[#CA922B]"
                    }`}
                  >
                    {r} mi
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Account & Privacy Settings ──────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#3A1F0E]/5 shadow-sm mt-8">
          <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#CA922B]" /> Account &amp; Privacy
          </h3>
          <div className="space-y-3">

            {/* Profile Visibility toggle */}
            <div className="flex items-center justify-between p-4 bg-[#FAF6EF] rounded-2xl">
              <div>
                <div className="font-semibold text-sm text-[#3A1F0E]">Profile Visibility</div>
                <div className="text-xs text-[#3A1F0E]/60 mt-0.5">
                  {isPrivate ? "Private — only you can see your activity" : "Public — your profile is visible to the community"}
                </div>
              </div>
              <button
                onClick={togglePrivacy}
                disabled={privacyLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-60 ${
                  isPrivate
                    ? "bg-[#2B1507] text-white hover:bg-[#3A1F0E]"
                    : "bg-[#CA922B]/15 text-[#CA922B] hover:bg-[#CA922B]/25"
                }`}
              >
                {privacyLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : isPrivate ? (
                  <><Lock className="w-3 h-3" /> Private</>
                ) : (
                  <><Globe className="w-3 h-3" /> Public</>
                )}
              </button>
            </div>

            {/* Change Password */}
            <button
              onClick={() => setShowPasswordPanel(v => !v)}
              className="w-full flex items-center justify-between p-4 bg-[#FAF6EF] rounded-2xl hover:bg-[#F0E8D9] transition-colors text-left"
            >
              <div>
                <div className="font-semibold text-sm text-[#3A1F0E] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#CA922B]" /> Change Password
                </div>
                <div className="text-xs text-[#3A1F0E]/60 mt-0.5">Update your account password</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#3A1F0E]/40 transition-transform shrink-0 ${showPasswordPanel ? "rotate-180" : ""}`} />
            </button>

            {showPasswordPanel && (
              <form onSubmit={handleChangePassword} className="px-4 pb-4 space-y-3">
                <div className="relative">
                  <Input
                    type={showCurrentPw ? "text" : "password"}
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    className="bg-[#FAF6EF] border-transparent rounded-xl h-11 focus-visible:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A1F0E]/40 hover:text-[#3A1F0E]">
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    placeholder="New password (8+ characters)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    className="bg-[#FAF6EF] border-transparent rounded-xl h-11 focus-visible:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/40 pr-10"
                  />
                  <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A1F0E]/40 hover:text-[#3A1F0E]">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="bg-[#FAF6EF] border-transparent rounded-xl h-11 focus-visible:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/40"
                />
                <Button
                  type="submit"
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-11"
                >
                  {passwordLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating…</> : "Update Password"}
                </Button>
              </form>
            )}

            {/* Delete Account */}
            <a
              href="/delete-account"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors group"
            >
              <div>
                <div className="font-semibold text-sm text-red-700 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </div>
                <div className="text-xs text-red-500 mt-0.5">Permanently delete your account and all personal data</div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </a>

          </div>
        </div>

        <div className="mt-8">
          <SocialVideoPreferences />
        </div>

        <div className="mt-8">
          <BusinessSupportPreferences />
        </div>

        {/* ── What Kinfolk Knows About You ────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#3A1F0E]/5 shadow-sm mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-serif font-bold text-[#3A1F0E] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#CA922B]" /> What Kinfolk Knows About You
            </h3>
            <Link href="/travel">
              <button className="text-xs font-bold text-[#CA922B] hover:underline flex items-center gap-1">
                Edit in Kinfolk <ChevronRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          {kinfolkPrefs === null ? (
            <div className="text-sm text-[#3A1F0E]/50 py-4 text-center">Loading your Kinfolk profile…</div>
          ) : (
            <div className="space-y-4">
              {/* Personality mode */}
              {kinfolkPrefs.personalityMode && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-2">Kinfolk Voice</div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#CA922B]/10 text-[#CA922B] text-xs font-bold border border-[#CA922B]/20 capitalize">
                    {kinfolkPrefs.personalityMode.replace(/_/g, " ")}
                  </span>
                </div>
              )}
              {/* Travel companion */}
              {kinfolkPrefs.travelCompanion && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-2">Travel Style</div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FAF6EF] text-[#3A1F0E] text-xs font-bold border border-[#3A1F0E]/10 capitalize">
                    {kinfolkPrefs.travelCompanion.replace(/_/g, " ")}
                  </span>
                </div>
              )}
              {/* Favorite cities */}
              {kinfolkPrefs.favoriteCities.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-2">Cities You Love</div>
                  <div className="flex flex-wrap gap-2">
                    {kinfolkPrefs.favoriteCities.map(c => (
                      <span key={c} className="inline-flex items-center px-3 py-1 rounded-full bg-[#FAF6EF] text-[#3A1F0E] text-xs font-semibold border border-[#3A1F0E]/10">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Favorite categories */}
              {kinfolkPrefs.favoriteCategories.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-2">Interests</div>
                  <div className="flex flex-wrap gap-2">
                    {kinfolkPrefs.favoriteCategories.map(c => (
                      <span key={c} className="inline-flex items-center px-3 py-1 rounded-full bg-[#FAF6EF] text-[#3A1F0E] text-xs font-semibold border border-[#3A1F0E]/10 capitalize">{c.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Cultural interests */}
              {kinfolkPrefs.culturalInterests.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-2">Cultural Connections</div>
                  <div className="flex flex-wrap gap-2">
                    {kinfolkPrefs.culturalInterests.map(c => (
                      <span key={c} className="inline-flex items-center px-3 py-1 rounded-full bg-[#FAF6EF] text-[#3A1F0E] text-xs font-semibold border border-[#3A1F0E]/10 capitalize">{c.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Lifestyle services */}
              {kinfolkPrefs.lifestyleServices.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-2">Your Lifestyle Services</div>
                  <div className="flex flex-wrap gap-2">
                    {kinfolkPrefs.lifestyleServices.map(s => (
                      <span key={s} className="inline-flex items-center px-3 py-1 rounded-full bg-[#FAF6EF] text-[#3A1F0E] text-xs font-semibold border border-[#3A1F0E]/10 capitalize">{s.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Empty state */}
              {!kinfolkPrefs.personalityMode &&
               kinfolkPrefs.favoriteCities.length === 0 &&
               kinfolkPrefs.favoriteCategories.length === 0 &&
               kinfolkPrefs.culturalInterests.length === 0 &&
               kinfolkPrefs.lifestyleServices.length === 0 && (
                <div className="text-center py-6">
                  <Sparkles className="w-8 h-8 text-[#CA922B]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#3A1F0E]/50 mb-4">Kinfolk doesn't know much about you yet. The more you chat, the better it knows you.</p>
                  <Link href="/travel">
                    <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-6 h-10 text-sm">
                      Start Chatting with Kinfolk
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Kinfolk Voice Preference ────────────────────────────────────── */}
        <div className="mt-8">
          <KinfolkTonePreference initialValue={null} />
        </div>

        {/* ── My Community Impact ─────────────────────────────────────────── */}
        {impact && (impact.reviewCount > 0 || impact.communityPosts > 0 || impact.savedBusinesses > 0) && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#3A1F0E]/5 shadow-sm mt-8">
            <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#CA922B]" /> My Community Impact
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {([
                { label: "Reviews Written", value: impact.reviewCount },
                { label: "Businesses Reviewed", value: impact.businessesReviewedCount },
                { label: "Community Posts", value: impact.communityPosts },
                { label: "Events Attended", value: impact.eventsAttended },
                { label: "Places Saved", value: impact.savedBusinesses },
                { label: "Members Referred", value: impact.referralsMade },
              ] as const).filter(m => m.value > 0).map(m => (
                <div key={m.label} className="bg-[#FAF6EF] rounded-2xl p-4 text-center">
                  <div className="text-2xl font-serif font-bold text-[#CA922B]">{m.value}</div>
                  <div className="text-[10px] text-[#3A1F0E]/60 font-bold uppercase tracking-wider mt-1 leading-tight">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recommended Spots ────────────────────────────────────────────── */}
        {recommendedSpots.length > 0 && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#3A1F0E]/5 shadow-sm mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif font-bold text-[#3A1F0E] flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#CA922B]" /> My Recommended Spots
              </h3>
            </div>
            <div className="space-y-3">
              {recommendedSpots.map(spot => (
                <Link key={spot.id} href={`/businesses/${spot.businessId}`}>
                  <div className="flex items-start gap-3 p-3 bg-[#FAF6EF] rounded-2xl hover:bg-[#F0E8D9] transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-[#CA922B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#CA922B] uppercase tracking-wide capitalize">{(spot.stance ?? "").replace(/_/g, " ") || "Recommended"}</div>
                      {spot.blurb && <p className="text-xs text-[#3A1F0E]/70 mt-0.5 leading-relaxed line-clamp-2">{spot.blurb}</p>}
                      <div className="text-[10px] text-[#3A1F0E]/40 mt-1">Tap to view business →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Pinned Health Topics (private — visible only to account holder) ─ */}
        {healthTopics && healthTopics.pinnedTopicIds.length > 0 && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#3A1F0E]/5 shadow-sm mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif font-bold text-[#3A1F0E] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#CA922B]" /> My Pinned Health Topics
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#3A1F0E]/50 px-2 py-1 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Private
              </span>
            </div>
            <p className="text-xs text-[#3A1F0E]/50 mb-4 leading-relaxed">Only you can see these. They are never shared with businesses, other members, or Kinfolk without your permission.</p>
            <div className="flex flex-wrap gap-2">
              {healthTopics.pinnedTopicIds.map(id => (
                <Link key={id} href="/wellness">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#FAF6EF] border border-[#3A1F0E]/10 text-xs font-semibold text-[#3A1F0E] hover:border-[#CA922B]/30 transition-colors cursor-pointer capitalize">
                    {id.replace(/-/g, " ").replace(/_/g, " ")}
                  </span>
                </Link>
              ))}
            </div>
            {healthTopics.topicIds.length > healthTopics.pinnedTopicIds.length && (
              <Link href="/wellness">
                <button className="mt-4 text-xs font-bold text-[#CA922B] hover:underline">
                  View all {healthTopics.topicIds.length} followed topics in Health Hub →
                </button>
              </Link>
            )}
          </div>
        )}

        {/* ── My Circles ───────────────────────────────────────────────────── */}
        {myCircles.length > 0 && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#3A1F0E]/5 shadow-sm mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif font-bold text-[#3A1F0E] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#CA922B]" /> My Circles
              </h3>
              <Link href="/circles">
                <button className="text-xs font-bold text-[#CA922B] hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
            <div className="space-y-2">
              {myCircles.map(circle => (
                <Link key={circle.id} href={`/circles/${circle.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-[#FAF6EF] rounded-2xl hover:bg-[#F0E8D9] transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-[#CA922B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#3A1F0E] truncate">{circle.name}</div>
                      {circle.description && <div className="text-xs text-[#3A1F0E]/50 truncate">{circle.description}</div>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#3A1F0E]/30 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Creator / Cultural Ambassador Profile ─────────────────────────── */}
        {((auth?.user as any)?.isContentCreator || (auth?.user as any)?.isCommunityOrganizer) && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#3A1F0E]/5 shadow-sm mt-8">
            <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#CA922B]" />
              {(auth?.user as any)?.isCommunityOrganizer ? "Cultural Ambassador Profile" : "Creator Profile"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(auth?.user as any)?.isCommunityOrganizer && (
                <Link href="/community">
                  <div className="bg-[#FAF6EF] rounded-2xl p-4 text-center hover:bg-[#F0E8D9] transition-colors cursor-pointer">
                    <Globe className="w-5 h-5 text-[#CA922B] mx-auto mb-2" />
                    <div className="text-xs font-bold text-[#3A1F0E]">Community Hub</div>
                    <div className="text-[10px] text-[#3A1F0E]/50 mt-0.5">Manage your community presence</div>
                  </div>
                </Link>
              )}
              {(auth?.user as any)?.isContentCreator && (
                <Link href="/community">
                  <div className="bg-[#FAF6EF] rounded-2xl p-4 text-center hover:bg-[#F0E8D9] transition-colors cursor-pointer">
                    <MessageCircle className="w-5 h-5 text-[#CA922B] mx-auto mb-2" />
                    <div className="text-xs font-bold text-[#3A1F0E]">Create Content</div>
                    <div className="text-[10px] text-[#3A1F0E]/50 mt-0.5">Share posts, guides, and stories</div>
                  </div>
                </Link>
              )}
              <Link href="/library">
                <div className="bg-[#FAF6EF] rounded-2xl p-4 text-center hover:bg-[#F0E8D9] transition-colors cursor-pointer">
                  <Globe className="w-5 h-5 text-[#CA922B] mx-auto mb-2" />
                  <div className="text-xs font-bold text-[#3A1F0E]">Knowledge Library</div>
                  <div className="text-[10px] text-[#3A1F0E]/50 mt-0.5">Contribute to the community</div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ── My Contributions ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#3A1F0E]/5 shadow-sm mt-8">
          <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-5 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#CA922B]" /> My Contributions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { label: "My Posts", href: "/community", icon: MessageCircle, desc: "Community discussions" },
              { label: "My Reviews", href: "/discover", icon: Star, desc: "Business reviews" },
              { label: "My Library", href: "/library", icon: Globe, desc: "Topics I follow" },
              { label: "My Events", href: "/events", icon: Calendar, desc: "Events & RSVPs" },
            ] as const).map(({ label, href, icon: Icon, desc }) => (
              <Link key={label} href={href}>
                <div className="bg-[#FAF6EF] rounded-2xl p-4 text-center hover:bg-[#F0E8D9] transition-colors cursor-pointer group">
                  <Icon className="w-5 h-5 text-[#CA922B] mx-auto mb-2" />
                  <div className="text-xs font-bold text-[#3A1F0E] group-hover:text-[#CA922B] transition-colors leading-tight">{label}</div>
                  <div className="text-[10px] text-[#3A1F0E]/50 mt-0.5 leading-tight">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function BookmarkIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
}

function SavedPlaceCard({ id, onUnsave }: { id: string; onUnsave?: () => void }) {
  const { data: bizData, isLoading } = useGetBusiness(id, { query: { queryKey: ["getBusiness", id], enabled: !!id } });
  const unsavePlace = useUnsavePlace();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const biz = bizData?.business;

  const handleUnsave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    unsavePlace.mutate({ businessId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["listSavedPlaces"] });
        toast({ title: "Removed", description: `${biz?.name ?? "Place"} removed from your saved places.` });
        onUnsave?.();
      },
      onError: () => {
        toast({ title: "Couldn't remove", description: "Please try again.", variant: "destructive" });
      },
    });
  };

  if (isLoading) return <Skeleton className="h-20 w-full rounded-2xl" />;
  if (!biz) return null;

  return (
    <div className="flex gap-3 p-3 border border-[#3A1F0E]/10 rounded-2xl hover:border-[#CA922B] transition-colors bg-white group relative">
      <Link href={`/businesses/${id}`} className="flex gap-3 flex-1 min-w-0 cursor-pointer">
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
            <span className="truncate">{biz.city}{biz.state ? `, ${biz.state}` : ""}</span>
          </div>
        </div>
      </Link>
      <button
        onClick={handleUnsave}
        disabled={unsavePlace.isPending}
        className="shrink-0 self-center w-7 h-7 rounded-full flex items-center justify-center text-[#3A1F0E]/20 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
        title="Remove from saved"
      >
        {unsavePlace.isPending ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
      </button>
    </div>
  );
}
