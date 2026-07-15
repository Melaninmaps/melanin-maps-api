import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getCaptionsForBusiness } from "@/constants/captions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlackOwnedBadge } from "@/components/BlackOwnedBadge";
import { BusinessTimeBadges } from "@/components/BusinessTimeBadges";
import { OwnershipBadges } from "@/components/OwnershipBadges";
import { BusinessMapView } from "@/components/BusinessMapView";
import { ConfidenceScoreBadge } from "@/components/ConfidenceScoreBadge";
import { RatingStars } from "@/components/RatingStars";
import { ReportContentModal } from "@/components/ReportContentModal";
import { VerificationBadge } from "@/components/VerificationBadge";
import { ShareModal } from "@/components/ShareModal";
import { WriteReviewModal } from "@/components/WriteReviewModal";
import { ClaimBusinessModal } from "@/components/ClaimBusinessModal";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinessById } from "@/hooks/useBusinesses";
import { useReviews } from "@/hooks/useReviews";
import { useCheckins } from "@/hooks/useCheckins";
import { usePoints } from "@/hooks/usePoints";
import { useDeals } from "@/hooks/useDeals";
import { useStories } from "@/hooks/useStories";
import { FlashDealsSection } from "@/components/FlashDealsSection";
import { BusinessStoriesSection } from "@/components/BusinessStoriesSection";
import { BusinessListingsSection } from "@/components/BusinessListingsSection";
import { BusinessMilestonesSection } from "@/components/BusinessMilestonesSection";
import { CircleTrustedSection } from "@/components/CircleTrustedSection";
import { CommunityConfidenceScore } from "@/components/CommunityConfidenceScore";
import { TrustBadge, type TrustLevel } from "@/components/TrustBadge";
import { KnowBeforeYouGoSection } from "@/components/KnowBeforeYouGoSection";
import { PassThePlateModal } from "@/components/PassThePlateModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useAuth } from "@/lib/auth";
import { SafetyExperienceSurvey } from "@/components/SafetyExperienceSurvey";
import FeaturedVideoCard from "@/components/FeaturedVideoCard";
import CommunityCommentsSection from "@/components/CommunityCommentsSection";

const CATEGORY_IMAGES: Record<string, any> = {
  Food: require("@/assets/images/bento-businesses.jpg"),
  Beauty: require("@/assets/images/bento-nightlife.jpg"),
  Retail: require("@/assets/images/bento-nightlife.jpg"),
  Tech: require("@/assets/images/bento-businesses.jpg"),
  Health: require("@/assets/images/bento-culture.jpg"),
  Legal: require("@/assets/images/bento-businesses.jpg"),
  Finance: require("@/assets/images/bento-businesses.jpg"),
};

const AVATAR_COLORS = ["#CA922B", "#C9922B", "#2D7A4F", "#7B3F00", "#1D4ED8"];

export default function BusinessDetailScreen() {
  const { id, source, sourceId, referrerId } = useLocalSearchParams<{
    id: string;
    source?: string;
    sourceId?: string;
    referrerId?: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingInitialRating, setEditingInitialRating] = useState<number | undefined>(undefined);
  const [editingInitialText, setEditingInitialText] = useState<string | undefined>(undefined);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pointsToast, setPointsToast] = useState<string | null>(null);
  const [topCaptions, setTopCaptions] = useState<Array<{ caption: string; count: number }>>([]);
  const [captionSheetOpen, setCaptionSheetOpen] = useState(false);
  const [pendingCaptions, setPendingCaptions] = useState<string[]>([]);
  const [captionSubmitting, setCaptionSubmitting] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [passThePlateOpen, setPassThePlateOpen] = useState(false);
  const [platePassCount, setPlatePassCount] = useState(0);
  const [showSafetySurvey, setShowSafetySurvey] = useState(false);
  const [circleSheetOpen, setCircleSheetOpen] = useState(false);
  const [userCircles, setUserCircles] = useState<Array<{ id: number; name: string; city: string | null; state: string | null; memberCount: number }>>([]);
  const [circlesLoading, setCirclesLoading] = useState(false);
  const [suggestingCircleId, setSuggestingCircleId] = useState<number | null>(null);

  // ── GPS Directions ─────────────────────────────────────────────────────────
  const { user } = useAuth();
  const isNavigator = new Set(["navigator", "trailblazer", "founding", "legacy_member", "community_builder"]).has((user as any)?.memberType ?? "");
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [directionsFetching, setDirectionsFetching] = useState(false);
  const [directionsSummary, setDirectionsSummary] = useState<{ distance: string; duration: string } | null>(null);
  const [directionsSteps, setDirectionsSteps] = useState<Array<{ index: number; instruction: string; distance: string; maneuver: string | null }>>([]);
  const [travelMode, setTravelMode] = useState<"driving" | "walking">("driving");
  const [safetyLoading, setSafetyLoading] = useState(false);
  const userCoordsRef = React.useRef<{ lat: number; lng: number } | null>(null);
  const [modeChangedSinceLoad, setModeChangedSinceLoad] = useState(false);
  type SafetyAlert = { id: string; type: string; label: string; description: string | null; confirmedCount: number; status: string };
  type SundownWarning = { id: string; area: string; description: string | null };
  type SuggestedStop = { id: string; name: string; address: string; city: string; category: string; distanceMiles: number; hoursOfOperation: string | null };
  type FlaggedBiz = { id: string; name: string; address: string; city: string; category: string; alertCount: number; distanceMiles: number };
  type SafetyCtx = { alerts: SafetyAlert[]; sundownWarnings: SundownWarning[]; suggestedStops: SuggestedStop[]; flaggedBusinesses: FlaggedBiz[] };
  const [safetyContext, setSafetyContext] = useState<SafetyCtx | null>(null);

  // ── Hidden Gem nomination ─────────────────────────────────────────────────
  const [gemStatus, setGemStatus] = useState<{
    hasNominated: boolean; totalNominations: number; isActive: boolean;
    label: string | null; tagline: string | null; nextThreshold: number;
  } | null>(null);
  const [vibeData, setVibeData] = useState<{
    ownerVibes: string[];
    communityTags: Array<{ vibe: string; count: number }>;
    myTags: string[];
  } | null>(null);
  const [vibePickerOpen, setVibePickerOpen] = useState(false);
  const [vibeTagging, setVibeTagging] = useState(false);

  // ── Community Reference analytics ──────────────────────────────────────────
  const [refAnalytics, setRefAnalytics] = useState<{
    totalViews: number;
    totalLinkClicks: number;
    clicksBySource: Array<{ source: string; total: number }>;
  } | null>(null);

  const [nomSheetOpen, setNomSheetOpen] = useState(false);
  const [nomReason, setNomReason] = useState<string | null>(null);
  const [nomAudiences, setNomAudiences] = useState<string[]>([]);
  const [nomComment, setNomComment] = useState("");
  const [nomSubmitting, setNomSubmitting] = useState(false);

  const { reviews: apiReviews, weightedRating, submitReview } = useReviews(id ?? "");
  const { hasCheckedIn, checkIn } = useCheckins();
  const { addLocal } = usePoints();
  const { deals } = useDeals(id ?? "");
  const { stories } = useStories(id ?? "");

  interface PinnedItem {
    id: number; itemType: "review" | "video";
    reviewText: string | null; reviewAuthor: string | null; reviewRating: number | null;
    reviewInitials: string | null; reviewColor: string | null; reviewTimeAgo: string | null;
    videoUrl: string | null; videoTitle: string | null; pinnedAt: string; expiresAt: string;
  }
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);

  const { business, isLoading } = useBusinessById(id ?? "");

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const { getItemAsync } = await import("expo-secure-store");
        const token = await getItemAsync("auth_session_token");
        const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
        await fetch(`${base}/api/businesses/${id}/view`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch {}
    })();
  }, [id]);

  useEffect(() => {
    if (!id || !(business as any)?.isReferenceOnly) return;
    void (async () => {
      try {
        const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
        const res = await fetch(`${base}/api/businesses/${id}/reference-analytics`);
        if (res.ok) {
          const data = await res.json() as { totalViews: number; totalLinkClicks: number; clicksBySource: Array<{ source: string; total: number }> };
          setRefAnalytics(data);
        }
      } catch {}
    })();
  }, [id, (business as any)?.isReferenceOnly]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
        const res = await fetch(`${base}/api/businesses/${id}/pinned`);
        if (res.ok) {
          const data = await res.json() as { pinned: PinnedItem[] };
          setPinnedItems(data.pinned ?? []);
        }
      } catch {}
    })();
  }, [id]);
  const fetchCaptions = () => {
    if (!id) return;
    const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
    fetch(`${base}/api/captions/${id}`)
      .then(r => r.ok ? r.json() : { captions: [] })
      .then((d: { captions?: Array<{ caption: string; count: number }> }) => {
        if (d?.captions) setTopCaptions(d.captions);
      })
      .catch(() => {});
  };

  const submitCaptionVotes = async () => {
    if (!id || pendingCaptions.length === 0) return;
    setCaptionSubmitting(true);
    try {
      const { getItemAsync } = await import("expo-secure-store");
      const token = await getItemAsync("auth_session_token");
      const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      await fetch(`${base}/api/captions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ captions: pendingCaptions }),
      });
      setCaptionSheetOpen(false);
      setPendingCaptions([]);
      fetchCaptions();
    } catch {} finally {
      setCaptionSubmitting(false);
    }
  };

  useEffect(() => { fetchCaptions(); }, [id]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const { getItemAsync } = await import("expo-secure-store");
        const token = await getItemAsync("auth_session_token");
        const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
        const res = await fetch(`${base}/api/vibes/businesses/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json() as { ownerVibes: string[]; communityTags: Array<{ vibe: string; count: number }>; myTags: string[] };
          setVibeData(data);
        }
      } catch {}
    })();
  }, [id]);

  const toggleVibeTag = async (vibe: string) => {
    if (!id) return;
    const isMyTag = vibeData?.myTags.includes(vibe) ?? false;
    setVibeTagging(true);
    try {
      const { getItemAsync } = await import("expo-secure-store");
      const token = await getItemAsync("auth_session_token");
      if (!token) return;
      const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const res = await fetch(`${base}/api/vibes/tag`, {
        method: isMyTag ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessId: id, vibe }),
      });
      if (res.ok) {
        setVibeData((prev) => {
          if (!prev) return prev;
          const myTags = isMyTag ? prev.myTags.filter((t) => t !== vibe) : [...prev.myTags, vibe];
          let communityTags = [...prev.communityTags];
          const existing = communityTags.find((t) => t.vibe === vibe);
          if (isMyTag) {
            if (existing) {
              existing.count = Math.max(0, existing.count - 1);
              if (existing.count === 0) communityTags = communityTags.filter((t) => t.vibe !== vibe);
            }
          } else {
            if (existing) { existing.count++; }
            else { communityTags.push({ vibe, count: 1 }); }
          }
          return { ...prev, myTags, communityTags };
        });
      }
    } catch {}
    setVibeTagging(false);
  };

  useEffect(() => {
    if (!id) return;
    fetch(`${process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""}/api/plate-passes/${id}/count`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { thisWeek?: number } | null) => { if (d?.thisWeek) setPlatePassCount(d.thisWeek); })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const { getItemAsync } = await import("expo-secure-store");
        const token = await getItemAsync("auth_session_token");
        const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
        const res = await fetch(`${base}/api/hidden-gems/${id}/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json() as { hasNominated: boolean; totalNominations: number; isActive: boolean; label: string | null; tagline: string | null; nextThreshold: number };
          setGemStatus(data);
        }
      } catch {}
    })();
  }, [id]);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (isLoading && !business) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.backBtn, { top: Platform.OS === "web" ? 77 : insets.top + 10 }]}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={[styles.hero, { backgroundColor: colors.muted }]} />
        <View style={[styles.body, { gap: 18 }]}>
          <View style={{ height: 26, width: "65%", backgroundColor: colors.muted, borderRadius: 8 }} />
          <View style={{ height: 16, width: "45%", backgroundColor: colors.muted, borderRadius: 8 }} />
          <View style={{ height: 90, width: "100%", backgroundColor: colors.muted, borderRadius: 14 }} />
          <View style={{ height: 16, width: "80%", backgroundColor: colors.muted, borderRadius: 8 }} />
          <View style={{ height: 16, width: "60%", backgroundColor: colors.muted, borderRadius: 8 }} />
          <View style={{ height: 16, width: "70%", backgroundColor: colors.muted, borderRadius: 8 }} />
        </View>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Business not found</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const img = CATEGORY_IMAGES[business.category] ?? CATEGORY_IMAGES["Food"];
  const saved = isSaved(business.id);
  const alreadyCheckedIn = hasCheckedIn(business.id) || checkInDone;

  const COMMUNITY_SUPPORT_LABELS: Record<number, string> = {
    1: "Worth checking out",
    2: "Solid spot — spread the word",
    3: "Strong community pick!",
    4: "A must-visit — go now!",
    5: "🔥 Drop everything and support this business!",
  };

  const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
  const allReviews: Array<{
    id: string; author: string; initials: string; color: string;
    rating: number; text: string; timeAgo: string; wouldReturnAlone?: boolean; videoUrl?: string; nowHiringUrl?: string; communitySupport?: number;
    ownerResponse?: string | null; ownerRespondedAt?: string | null; isOwnReview?: boolean;
    verificationBadge?: string | null; moderationLevel?: string | null;
    authorTrustLevel?: TrustLevel;
  }> = [
    ...apiReviews
      .filter((r) => Date.now() - new Date(r.createdAt).getTime() < SIX_MONTHS_MS)
      .map((r) => ({
        id: r.id,
        author: r.authorName,
        initials: r.authorName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??",
        color: AVATAR_COLORS[r.authorName.charCodeAt(0) % AVATAR_COLORS.length],
        rating: r.rating,
        text: r.text ?? "",
        timeAgo: new Date(r.createdAt).toLocaleDateString(),
        wouldReturnAlone: r.wouldReturnAlone ?? undefined,
        videoUrl: r.videoUrl ?? undefined,
        nowHiringUrl: r.nowHiringUrl ?? undefined,
        communitySupport: (r as any).communitySupport ?? undefined,
        ownerResponse: r.ownerResponse ?? null,
        ownerRespondedAt: r.ownerRespondedAt ?? null,
        isOwnReview: (r as any).isOwnReview ?? false,
        verificationBadge: (r as any).verificationBadge ?? null,
        moderationLevel: (r as any).moderationLevel ?? null,
        authorTrustLevel: (typeof r.authorTrustLevel === "number" && r.authorTrustLevel >= 1 && r.authorTrustLevel <= 4 ? r.authorTrustLevel : 1) as TrustLevel,
      })),
    ...(business.reviews ?? []),
  ];

  const showPointsToast = (msg: string) => {
    setPointsToast(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setPointsToast(null));
  };

  const trackClick = (clickType: string) => {
    void (async () => {
      try {
        const { getItemAsync } = await import("expo-secure-store");
        const token = Platform.OS !== "web" ? await getItemAsync("auth_session_token") : null;
        const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        await fetch(`${base}/api/businesses/${business.id}/click`, {
          method: "POST", headers, body: JSON.stringify({ clickType }),
        });
      } catch { }
    })();
  };

  const handleCall = () => {
    if (business.phone) {
      trackClick("phone_call");
      Linking.openURL(`tel:${business.phone}`);
    }
  };

  const handleWebsite = async () => {
    if (business.website) {
      trackClick("website_visit");
      const raw = /^https?:\/\//i.test(business.website) ? business.website : `https://${business.website}`;

      // For Community References: append UTM params and fire attribution tracking
      if ((business as any).isReferenceOnly) {
        const utm = new URLSearchParams({
          utm_source: "mappingwithmelanin",
          utm_medium: "community_reference",
          utm_campaign: (business as any).referenceCategory ?? "general",
          utm_content: business.id,
          ...(source ? { utm_term: source } : {}),
        });
        const trackedUrl = raw.includes("?") ? `${raw}&${utm.toString()}` : `${raw}?${utm.toString()}`;
        try {
          const { getItemAsync: getToken } = await import("expo-secure-store");
          const token = Platform.OS !== "web" ? await getToken("auth_session_token") : null;
          fetch(`/api/businesses/${business.id}/reference-link-click`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ source: source ?? "business_profile", sourceId: sourceId ?? null, referrerUserId: referrerId ?? null }),
          }).catch(() => {});
        } catch { /* non-blocking */ }
        WebBrowser.openBrowserAsync(trackedUrl);
      } else {
        WebBrowser.openBrowserAsync(raw);
      }
    }
  };

  const handleSocialLink = (raw: string, baseUrl?: string, clickType?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (clickType) trackClick(clickType);
    const url = /^https?:\/\//i.test(raw)
      ? raw
      : baseUrl
      ? `${baseUrl}${raw.replace(/^@/, "")}`
      : `https://${raw}`;
    WebBrowser.openBrowserAsync(url);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareModalOpen(true);
  };

  const handleReviewSubmit = async (
    rating: number,
    text: string,
    wouldReturn: boolean | null,
    socialHandle?: string,
    socialPlatform?: string,
    videoUrl?: string,
    nonMinorityOwned?: boolean,
    communitySupport?: number,
    website?: string,
    location?: string,
    isAnonymous?: boolean,
    volunteerAsMentor?: boolean,
    nowHiringUrl?: string,
    photos?: string[],
  ) => {
    if (editingReviewId) {
      try {
        const { getItemAsync: getItem } = await import("expo-secure-store");
        const token = Platform.OS !== "web" ? await getItem("auth_session_token") : null;
        await fetch(`${process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""}/api/reviews/${editingReviewId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ rating, text }),
        });
        showPointsToast("Review updated!");
      } catch { /* silent */ } finally {
        setEditingReviewId(null);
        setEditingInitialRating(undefined);
        setEditingInitialText(undefined);
      }
      return;
    }
    try {
      const pts = await submitReview(rating, text, wouldReturn, socialHandle, socialPlatform, business.name, videoUrl, nonMinorityOwned, communitySupport, website, location, isAnonymous, volunteerAsMentor, nowHiringUrl, photos);
      if (pts != null) {
        addLocal(pts);
        showPointsToast(`+${pts} pts — thanks for your review!`);
      }
    } catch (e: unknown) {
      if ((e as any)?.code === "MEMBERSHIP_REQUIRED") {
        setShowUpgrade(true);
      }
    }
  };

  const openCircleSheet = async () => {
    setCircleSheetOpen(true);
    setCirclesLoading(true);
    try {
      const { getItemAsync } = await import("expo-secure-store");
      const token = await getItemAsync("auth_session_token");
      if (!token) { setCircleSheetOpen(false); router.push("/login" as any); return; }
      const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const res = await fetch(`${base}/api/circles`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json() as { circles: Array<{ id: number; name: string; city: string | null; state: string | null; memberCount: number }> };
      setUserCircles(data.circles ?? []);
    } catch { setUserCircles([]); }
    setCirclesLoading(false);
  };

  const suggestToCircle = async (circleId: number) => {
    if (!business) return;
    setSuggestingCircleId(circleId);
    try {
      const { getItemAsync } = await import("expo-secure-store");
      const token = await getItemAsync("auth_session_token");
      const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const res = await fetch(`${base}/api/circles/${circleId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ placeName: business.name, placeType: business.category ?? "business", businessId: String(business.id) }),
      });
      setCircleSheetOpen(false);
      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Suggested!", `${business.name} was added to your circle's suggestions.`);
      } else {
        const err = await res.json() as { error?: string };
        Alert.alert("Couldn't add", err.error ?? "Something went wrong");
      }
    } catch {
      Alert.alert("Error", "Failed to suggest this place. Try again.");
    }
    setSuggestingCircleId(null);
  };

  const handleCheckIn = async () => {
    if (alreadyCheckedIn) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const Location = await import("expo-location");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
    } catch { /* location unavailable — proceed without GPS */ }

    try {
      const result = await checkIn(business.id, lat, lng);
      setCheckInDone(true);
      if (result != null) {
        addLocal(result.pointsEarned);
        const bonus = result.verifiedLocation ? " 📍 GPS verified!" : "";
        showPointsToast(`+${result.pointsEarned} pts — checked in!${bonus}`);
      }
    } catch (err: unknown) {
      if ((err as any)?.code === "too_far") {
        Alert.alert("Too far away 📍", (err as any).message ?? "You need to be closer to check in.");
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.backBtn, { top: Platform.OS === "web" ? 77 : insets.top + 10 }]}>
        <TouchableOpacity activeOpacity={0.85}
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.backBtnRight}>
          <TouchableOpacity activeOpacity={0.85}
            onPress={handleShare}
            style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          >
            <Feather name="share-2" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85}
            onPress={openCircleSheet}
            style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          >
            <Feather name="users" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const becomingSaved = !saved;
              toggleSave(business.id);
              if (becomingSaved) {
                setTimeout(() => Alert.alert(
                  "Saved! 🔖",
                  `Customize what updates you get from ${business.name}?`,
                  [
                    { text: "Not now", style: "cancel" },
                    { text: "Set up alerts →", onPress: () => router.push({ pathname: "/notification-prefs", params: { businessId: business.id, businessName: business.name } }) },
                  ]
                ), 400);
              }
            }}
            style={[styles.iconBtn, { backgroundColor: saved ? "rgba(201,146,43,0.5)" : "rgba(0,0,0,0.45)" }]}
          >
            <Feather name="bookmark" size={20} color={saved ? "#C9922B" : "#FFFFFF"} />
          </TouchableOpacity>
          {saved && (
            <TouchableOpacity activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/notification-prefs", params: { businessId: business.id, businessName: business.name } })}
              style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
            >
              <Feather name="bell" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 100 }}>
        <Image source={img} style={styles.hero} contentFit="cover" />

        <View style={styles.body}>
          {/* Community Disputed banner */}
          {((business as any).flagStatus === "under_review" || (business as any).flagStatus === "confirmed_fake") && (
            <View style={[styles.disputedBanner, { borderColor: (business as any).flagStatus === "confirmed_fake" ? "#DC262640" : "#F59E0B50" }]}>
              <Feather
                name="alert-triangle"
                size={16}
                color={(business as any).flagStatus === "confirmed_fake" ? "#DC2626" : "#B45309"}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.disputedTitle, { color: (business as any).flagStatus === "confirmed_fake" ? "#DC2626" : "#92400E" }]}>
                  {(business as any).flagStatus === "confirmed_fake" ? "Confirmed Fake Listing" : "Community Disputed"}
                </Text>
                <Text style={[styles.disputedSub, { color: colors.mutedForeground }]}>
                  {(business as any).flagStatus === "confirmed_fake"
                    ? "Our team has confirmed this listing does not represent a legitimate business."
                    : "Community members have raised concerns about the authenticity of this listing. Under review."}
                </Text>
              </View>
            </View>
          )}
          {/* Title row + badges */}
          <View style={styles.titleSection}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{business.name}</Text>
              {(business as any).businessTagline ? (
                <Text style={[styles.taglineLine, { color: colors.primary }]}>"{(business as any).businessTagline}"</Text>
              ) : null}
              <View style={styles.metaRow}>
                <Text style={[styles.category, { color: colors.primary }]}>{business.category}</Text>
                {business.verified && <VerificationBadge size="md" />}
                {business.priceRange && (
                  <Text style={[styles.price, { color: colors.mutedForeground }]}>{business.priceRange}</Text>
                )}
              </View>
              <View style={styles.badgeRow}>
                {business.foundingBusiness && (
                  <View style={styles.foundingBadge}>
                    <Text style={styles.foundingBadgeStar}>⭐</Text>
                    <Text style={styles.foundingBadgeText}>
                      Founding Business{business.foundingNumber ? ` #${business.foundingNumber}` : ""}
                    </Text>
                  </View>
                )}
                {business.blackOwned && <BlackOwnedBadge size="md" />}
                <OwnershipBadges
                  designations={business.ownershipDesignations}
                  verifiedDesignations={business.verifiedDesignations}
                  size="md"
                />
              </View>
              {business.ownershipDesignations?.length > 0 && (
                <Text style={[styles.minorityDisclaimer, { color: colors.mutedForeground }]}>
                  * Ownership designations indicate the business is owned and operated 51% or more by the identified group. Businesses may self-identify or submit documentation for VERIFIED status.
                </Text>
              )}
              <BusinessTimeBadges
                currentLocationSince={(business as any).currentLocationSince}
                businessFoundedDate={(business as any).businessFoundedDate}
                trustBadges={(business as any).trustBadges}
                safetyRating={business.safetyRating}
                wouldReturnAlone={business.wouldReturnAlone}
                recommendationRate={business.recommendationRate}
                rating={business.rating}
                reviewCount={business.reviewCount}
              />
            </View>
            <ConfidenceScoreBadge score={business.confidenceScore} size="lg" showLabel />
          </View>

          <RatingStars rating={business.rating} reviewCount={business.reviewCount} size={14} showLabel />
          {weightedRating !== null && weightedRating > 0 && Math.abs(weightedRating - (business.rating ?? 0)) >= 0.1 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, backgroundColor: "#16A34A0D", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start", borderWidth: 1, borderColor: "#16A34A25" }}>
              <Text style={{ fontSize: 10, color: "#16A34A", fontFamily: "Inter_600SemiBold" }}>✔ {weightedRating.toFixed(1)} verified-weighted</Text>
            </View>
          )}

          {/* Hidden Gem / Community Spotlight badge */}
          {gemStatus?.isActive && gemStatus.label ? (
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#CA922B12", borderWidth: 1, borderColor: "#CA922B30", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 10 }}>
              <Feather name="star" size={18} color="#CA922B" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#CA922B" }}>{gemStatus.label}</Text>
                {gemStatus.tagline ? (
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#7A6030", marginTop: 2, lineHeight: 17 }}>{gemStatus.tagline}</Text>
                ) : null}
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#CA922B90", marginTop: 3 }}>
                  {gemStatus.totalNominations} community nomination{gemStatus.totalNominations !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          ) : null}

          {(business as any).introVideoUrl ? (
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginTop: 10, alignSelf: "flex-start" }}
              onPress={() => Linking.openURL((business as any).introVideoUrl)}
              activeOpacity={0.85}
            >
              <Feather name="play-circle" size={15} color="#FFF" />
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#FFF" }}>Watch Owner Intro</Text>
            </TouchableOpacity>
          ) : null}

          {/* Vibe Check Section */}
          {(() => {
            const BIZ_VIBES = [
              { id: "date-night", label: "Date Night", icon: "heart" as const },
              { id: "group-hangout", label: "Group Hangout", icon: "users" as const },
              { id: "solo-vibes", label: "Solo Vibes", icon: "user" as const },
              { id: "bougie-treat", label: "Bougie Treat", icon: "award" as const },
              { id: "hood-classic", label: "Hood Classic", icon: "home" as const },
              { id: "soul-food", label: "Soul Food", icon: "coffee" as const },
              { id: "late-night", label: "Late Night", icon: "moon" as const },
              { id: "family-time", label: "Family Time", icon: "smile" as const },
              { id: "creative-scene", label: "Creative Scene", icon: "music" as const },
              { id: "wellness", label: "Wellness", icon: "activity" as const },
              { id: "work-and-study", label: "Work & Study", icon: "book-open" as const },
              { id: "adventure", label: "Adventure Ready", icon: "compass" as const },
            ];
            const allTaggedVibes = [
              ...(vibeData?.ownerVibes ?? []).map((v) => ({ id: v, source: "owner" as const })),
              ...(vibeData?.communityTags ?? [])
                .filter((t) => !vibeData?.ownerVibes.includes(t.vibe))
                .map((t) => ({ id: t.vibe, source: "community" as const, count: t.count })),
            ];
            const hasVibes = allTaggedVibes.length > 0;

            return (
              <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="zap" size={14} color={colors.primary} />
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: colors.foreground }}>Vibe Check</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setVibePickerOpen(true)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary + "15", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={12} color={colors.primary} />
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.primary }}>Add Vibe</Text>
                  </TouchableOpacity>
                </View>

                {hasVibes ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {allTaggedVibes.map((v) => {
                      const meta = BIZ_VIBES.find((x) => x.id === v.id);
                      const isMine = vibeData?.myTags.includes(v.id);
                      const communityCount = vibeData?.communityTags.find((t) => t.vibe === v.id)?.count ?? 0;
                      return (
                        <TouchableOpacity
                          key={v.id}
                          onPress={() => { void toggleVibeTag(v.id); }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 10,
                            backgroundColor: isMine ? colors.primary + "18" : colors.card,
                            borderWidth: 1,
                            borderColor: isMine ? colors.primary + "50" : colors.border,
                          }}
                          activeOpacity={0.8}
                          disabled={vibeTagging}
                        >
                          {meta && <Feather name={meta.icon} size={12} color={isMine ? colors.primary : colors.mutedForeground} />}
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: isMine ? colors.primary : colors.foreground }}>
                            {meta?.label ?? v.id}
                          </Text>
                          {v.source === "owner" && (
                            <View style={{ backgroundColor: "#CA922B20", borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 9, color: "#CA922B" }}>Owner</Text>
                            </View>
                          )}
                          {communityCount > 0 && (
                            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 10, color: colors.mutedForeground }}>{communityCount}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, lineHeight: 18 }}>
                    No vibes tagged yet. Be the first to describe this spot's energy.
                  </Text>
                )}
              </View>
            );
          })()}

          {/* Vibe Picker Modal */}
          <Modal visible={vibePickerOpen} transparent animationType="slide" onRequestClose={() => setVibePickerOpen(false)}>
            <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setVibePickerOpen(false)} />
              <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom + 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground }}>What's the vibe?</Text>
                  <TouchableOpacity onPress={() => setVibePickerOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x" size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}>
                  Tag what this spot feels like — helps others find their scene
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 16 }}>
                  {[
                    { id: "date-night", label: "Date Night", icon: "heart" as const },
                    { id: "group-hangout", label: "Group Hangout", icon: "users" as const },
                    { id: "solo-vibes", label: "Solo Vibes", icon: "user" as const },
                    { id: "bougie-treat", label: "Bougie Treat", icon: "award" as const },
                    { id: "hood-classic", label: "Hood Classic", icon: "home" as const },
                    { id: "soul-food", label: "Soul Food", icon: "coffee" as const },
                    { id: "late-night", label: "Late Night", icon: "moon" as const },
                    { id: "family-time", label: "Family Time", icon: "smile" as const },
                    { id: "creative-scene", label: "Creative Scene", icon: "music" as const },
                    { id: "wellness", label: "Wellness", icon: "activity" as const },
                    { id: "work-and-study", label: "Work & Study", icon: "book-open" as const },
                    { id: "adventure", label: "Adventure Ready", icon: "compass" as const },
                  ].map((v) => {
                    const isMine = vibeData?.myTags.includes(v.id) ?? false;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        onPress={async () => { await toggleVibeTag(v.id); }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 7,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: isMine ? colors.primary : colors.background,
                          borderWidth: 1.5,
                          borderColor: isMine ? colors.primary : colors.border,
                          minWidth: "44%",
                          flex: 0,
                        }}
                        activeOpacity={0.8}
                        disabled={vibeTagging}
                      >
                        <Feather name={v.icon} size={14} color={isMine ? "#FFF" : colors.primary} />
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: isMine ? "#FFF" : colors.foreground }}>
                          {v.label}
                        </Text>
                        {isMine && <Feather name="check" size={12} color="#FFF" style={{ marginLeft: "auto" }} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Safety stats */}
          {(business.wouldReturnAlone != null || business.safetyRating != null) && (
            <View style={[styles.safetyCard, { backgroundColor: "#2D7A4F10", borderColor: "#2D7A4F30" }]}>
              <View style={styles.safetyHeader}>
                <Feather name="shield" size={15} color="#2D7A4F" />
                <Text style={[styles.safetyTitle, { color: "#2D7A4F" }]}>Community Insights</Text>
              </View>
              <View style={styles.safetyStats}>
                {business.wouldReturnAlone != null && (
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{business.wouldReturnAlone}%</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Would Return</Text>
                  </View>
                )}
                {business.safetyRating != null && (
                  <View style={[styles.statItem, styles.statBorder, { borderColor: "#2D7A4F20" }]}>
                    <Text style={styles.statValue}>{business.safetyRating.toFixed(1)}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Experience Rating</Text>
                  </View>
                )}
                {business.recommendationRate != null && (
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{business.recommendationRate}%</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Recommend</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Rate Safety Experience */}
          <TouchableOpacity
            style={[styles.rateSafetyBanner, { backgroundColor: "#2D7A4F10", borderColor: "#2D7A4F30" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowSafetySurvey(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.rateSafetyIconWrap}>
              <Feather name="shield" size={20} color="#2D7A4F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rateSafetyTitle, { color: colors.foreground }]}>🛡️ Share Your Experience</Text>
              <Text style={[styles.rateSafetySub, { color: colors.mutedForeground }]}>Help the community know what to expect.</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#2D7A4F" />
          </TouchableOpacity>

          {/* Nominate as Hidden Gem */}
          {gemStatus && !gemStatus.isActive && (
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#CA922B0A", borderWidth: 1, borderColor: "#CA922B25", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 6 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setNomSheetOpen(true);
              }}
              activeOpacity={0.82}
            >
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#CA922B18", alignItems: "center", justifyContent: "center" }}>
                <Feather name="star" size={16} color="#CA922B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#CA922B" }}>
                  {gemStatus.hasNominated ? "You nominated this as a Hidden Gem" : "Nominate as a Hidden Gem"}
                </Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#7A6030", marginTop: 2 }}>
                  {gemStatus.hasNominated
                    ? `${gemStatus.totalNominations} nomination${gemStatus.totalNominations !== 1 ? "s" : ""} total`
                    : `${gemStatus.totalNominations} of ${gemStatus.nextThreshold} nominations to earn Community Spotlight`}
                </Text>
              </View>
              {!gemStatus.hasNominated && <Feather name="chevron-right" size={16} color="#CA922B80" />}
            </TouchableOpacity>
          )}

          {/* Community Captions */}
          {(topCaptions.length > 0 || business) && (
            <View style={[styles.captionSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.captionHeader}>
                <Text style={[styles.captionTitle, { color: colors.foreground }]}>🤎 Community Says</Text>
                <TouchableOpacity
                  style={[styles.addCaptionBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "10" }]}
                  onPress={() => { setPendingCaptions([]); setCaptionSheetOpen(true); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.addCaptionBtnText, { color: colors.primary }]}>+ Add Yours</Text>
                </TouchableOpacity>
              </View>
              {topCaptions.length === 0 ? (
                <Text style={[styles.captionEmpty, { color: colors.mutedForeground }]}>
                  Be the first to add a community caption for this business.
                </Text>
              ) : (
                <View style={styles.captionBadgeWrap}>
                  {topCaptions.slice(0, 12).map((c) => (
                    <TouchableOpacity
                      key={c.caption}
                      style={[styles.captionBadge, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "25" }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCaptionSheetOpen(true);
                        setPendingCaptions([c.caption]);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.captionBadgeCount, { color: colors.primary }]}>{c.count}</Text>
                      <Text style={[styles.captionBadgeText, { color: colors.foreground }]}>said "{c.caption}"</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Featured Video */}
          {!!(business as any).featuredVideoUrl && (
            <FeaturedVideoCard
              videoUrl={(business as any).featuredVideoUrl}
              videoTitle={(business as any).featuredVideoTitle}
              videoPurpose={(business as any).featuredVideoPurpose}
              businessName={business.name}
            />
          )}

          {/* Community Comments */}
          <CommunityCommentsSection businessId={id ?? ""} businessName={business.name} />

          {/* Info card */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
            {business.hours && (
              <View style={styles.infoRow}>
                <Feather name="clock" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.foreground }]}>{business.hours}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                {business.address}, {business.city}, {business.state}
              </Text>
            </View>
            {business.phone && (
              <TouchableOpacity activeOpacity={0.85} style={styles.infoRow} onPress={handleCall}>
                <Feather name="phone" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.primary }]}>{business.phone}</Text>
              </TouchableOpacity>
            )}
            {business.website && (
              <TouchableOpacity activeOpacity={0.85} style={styles.infoRow} onPress={handleWebsite}>
                <Feather name="globe" size={16} color={(business as any).isReferenceOnly ? "#0369A1" : colors.primary} />
                <Text style={[styles.infoText, { color: (business as any).isReferenceOnly ? "#0369A1" : colors.primary }]}>
                  {(business as any).isReferenceOnly ? "Visit Resource" : business.website}
                </Text>
                {(business as any).isReferenceOnly && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginLeft: 6, backgroundColor: "#E0F2FE", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Feather name="external-link" size={10} color="#0369A1" />
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, color: "#0369A1" }}>Tracked</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {(business as any).isReferenceOnly && refAnalytics && (
              <View style={{ marginTop: 12, backgroundColor: "#F0F9FF", borderRadius: 10, borderWidth: 1, borderColor: "#BAE6FD", padding: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Feather name="bar-chart-2" size={13} color="#0369A1" />
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: "#0369A1" }}>Community Impact</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 8, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#E0F2FE" }}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: "#0369A1" }}>{refAnalytics.totalViews.toLocaleString()}</Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#64748B", marginTop: 2 }}>Profile Views</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 8, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#E0F2FE" }}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: "#0369A1" }}>{refAnalytics.totalLinkClicks.toLocaleString()}</Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#64748B", marginTop: 2 }}>Link Visits</Text>
                  </View>
                </View>
                {refAnalytics.clicksBySource.length > 0 && (
                  <View style={{ marginTop: 10, gap: 4 }}>
                    {refAnalytics.clicksBySource.map((s) => (
                      <View key={s.source} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#64748B", textTransform: "capitalize" }}>
                          {s.source.replace(/_/g, " ")}
                        </Text>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#0369A1" }}>{Number(s.total).toLocaleString()} clicks</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#94A3B8", marginTop: 8, textAlign: "center" }}>
                  Referrals carry UTM tracking — visible in destination site analytics
                </Text>
              </View>
            )}
            {(business.instagram || business.tiktok || business.twitter || business.facebook || business.youtube || (business as any).pinterest) && (() => {
              type SocialDef = { key: string; label: string; icon: keyof typeof Feather.glyphMap; color: string; bg: string; baseUrl: string; clickType: string };
              const ALL: SocialDef[] = [
                { key: "tiktok", label: "TikTok", icon: "music", color: colors.foreground, bg: "#00000015", baseUrl: "https://tiktok.com/@", clickType: "tiktok_visit" },
                { key: "instagram", label: "Instagram", icon: "instagram", color: "#E1306C", bg: "#E1306C18", baseUrl: "https://instagram.com/", clickType: "instagram_visit" },
                { key: "youtube", label: "YouTube", icon: "youtube", color: "#FF0000", bg: "#FF000015", baseUrl: "https://youtube.com/@", clickType: "youtube_visit" },
                { key: "facebook", label: "Facebook", icon: "facebook", color: "#1877F2", bg: "#1877F218", baseUrl: "https://facebook.com/", clickType: "facebook_visit" },
                { key: "pinterest", label: "Pinterest", icon: "bookmark", color: "#E60023", bg: "#E6002315", baseUrl: "https://pinterest.com/", clickType: "pinterest_visit" },
                { key: "twitter", label: "X / Twitter", icon: "twitter", color: "#1DA1F2", bg: "#1DA1F218", baseUrl: "https://x.com/", clickType: "" },
              ];
              const biz = business as any;
              const primary = (biz.primarySocialPlatform as string | undefined) || null;
              const available = ALL.filter((s) => !!biz[s.key]);
              const primaryDef = primary ? available.find((s) => s.key === primary) : null;
              const rest = primaryDef ? available.filter((s) => s.key !== primary) : available;
              return (
                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Feather name="heart" size={13} color={colors.primary} />
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.primary }}>Support at the Source</Text>
                  </View>
                  {primaryDef && (
                    <TouchableOpacity
                      style={[styles.primarySocialCard, { backgroundColor: primaryDef.bg, borderColor: primaryDef.color + "40" }]}
                      onPress={() => handleSocialLink(biz[primaryDef.key], primaryDef.baseUrl, primaryDef.clickType)}
                      accessibilityRole="link"
                      activeOpacity={0.8}
                    >
                      <View style={[styles.primarySocialIcon, { backgroundColor: primaryDef.color + "20" }]}>
                        <Feather name={primaryDef.icon} size={22} color={primaryDef.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: primaryDef.color }}>Follow on {primaryDef.label}</Text>
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>
                          Their preferred platform — follow & support their content
                        </Text>
                      </View>
                      <Feather name="external-link" size={16} color={primaryDef.color} />
                    </TouchableOpacity>
                  )}
                  {rest.length > 0 && (
                    <View style={styles.socialLinksRow}>
                      {rest.map((s) => (
                        <TouchableOpacity activeOpacity={0.85}
                          key={s.key}
                          style={[styles.socialBtn, { backgroundColor: s.bg, borderColor: s.color + "30" }]}
                          onPress={() => handleSocialLink(biz[s.key], s.baseUrl, s.clickType || undefined)}
                          accessibilityLabel={`View ${business.name} on ${s.label}`}
                          accessibilityRole="link"
                        >
                          <Feather name={s.icon} size={15} color={s.color} />
                          <Text style={[styles.socialBtnText, { color: s.color }]}>{s.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })()}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
          <Text style={[styles.description, { color: colors.foreground }]}>{business.description}</Text>

          {((business as any).ownerName || (business as any).ownerBio || (business as any).ownerStory) && (
            <View style={[styles.ownerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.ownerCardHeader}>
                <View style={[styles.ownerAvatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.ownerAvatarText, { color: colors.primary }]}>
                    {((business as any).ownerName ?? "Owner").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ownerLabel, { color: colors.mutedForeground }]}>Meet the Owner</Text>
                  {(business as any).ownerName && (
                    <Text style={[styles.ownerName, { color: colors.foreground }]}>{(business as any).ownerName}</Text>
                  )}
                </View>
              </View>
              {(business as any).ownerBio && (
                <Text style={[styles.ownerBio, { color: colors.foreground }]}>{(business as any).ownerBio}</Text>
              )}
              {(business as any).ownerStory && (
                <>
                  <View style={[styles.ownerStoryDivider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.ownerStoryLabel, { color: colors.mutedForeground }]}>Their Story</Text>
                  <Text style={[styles.ownerStory, { color: colors.foreground }]}>{(business as any).ownerStory}</Text>
                </>
              )}
            </View>
          )}

          {business.tags.length > 0 && (
            <View style={styles.tags}>
              {business.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.tagText, { color: colors.secondaryForeground }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <CommunityConfidenceScore business={business} />

          <BusinessMilestonesSection business={business} />

          <FlashDealsSection deals={deals} />
          <BusinessStoriesSection stories={stories} />
          <BusinessListingsSection businessId={id ?? ""} businessName={business.name} returnPolicy={(business as any).returnPolicy} />

          <CircleTrustedSection business={business} />

          <KnowBeforeYouGoSection business={business} />

          {/* Pass the Plate */}
          <TouchableOpacity
            style={[styles.plateCard, { backgroundColor: "#CA922B", borderColor: "#C9922B55" }]}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setPassThePlateOpen(true);
            }}
          >
            <View style={styles.plateCardLeft}>
              <Text style={styles.plateEmoji}>🍽️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.plateTitle}>Pass the Plate</Text>
                <Text style={styles.plateSub}>
                  {platePassCount > 0
                    ? `${platePassCount} people passed the plate this week`
                    : "Tag friends, family & your community"}
                </Text>
              </View>
            </View>
            <View style={styles.plateArrowWrap}>
              <Feather name="chevron-right" size={18} color="#C9922B" />
            </View>
          </TouchableOpacity>

          {/* Show Me the Vibe */}
          <TouchableOpacity
            style={[styles.vibeCard, { backgroundColor: "#1A3B2B" }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/business-vibes", params: { businessId: id, businessName: business.name } } as never)}
          >
            <Text style={styles.vibeCardEmoji}>🎥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.vibeCardTitle}>Show Me the Vibe</Text>
              <Text style={styles.vibeCardSub}>
                Watch community videos from real visitors — the food, the feel, the atmosphere.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#C9922B" />
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Location</Text>
          <View style={[styles.mapWrap, { borderColor: colors.border }]}>
            <BusinessMapView
              latitude={business.latitude}
              longitude={business.longitude}
              name={business.name}
            />
          </View>

          {/* Get Directions row */}
          {business.latitude && business.longitude && (
            <TouchableOpacity
              style={[styles.directionsRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}
              activeOpacity={0.75}
              onPress={async () => {
                if (!isNavigator) {
                  const lat = business.latitude!;
                  const lng = business.longitude!;
                  const mapsUrl = Platform.OS === "ios"
                    ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
                    : `https://maps.google.com/maps?daddr=${lat},${lng}`;
                  Linking.openURL(mapsUrl).catch(() => {});
                  return;
                }
                setSafetyContext(null);
                setDirectionsSteps([]);
                setDirectionsSummary(null);
                setModeChangedSinceLoad(false);
                setDirectionsOpen(true);
                setDirectionsFetching(true);
                try {
                  const token = Platform.OS !== "web" ? await (await import("expo-secure-store")).getItemAsync("auth_session_token") : null;

                  let userLat = 0, userLng = 0, hasLoc = false;
                  // Try to reuse cached coords from previous fetch first
                  if (userCoordsRef.current) {
                    userLat = userCoordsRef.current.lat;
                    userLng = userCoordsRef.current.lng;
                    hasLoc = true;
                  } else {
                    try {
                      const Location = await import("expo-location");
                      const { status } = await Location.requestForegroundPermissionsAsync();
                      if (status === "granted") {
                        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        userLat = pos.coords.latitude;
                        userLng = pos.coords.longitude;
                        userCoordsRef.current = { lat: userLat, lng: userLng };
                        hasLoc = true;
                      }
                    } catch { /* location unavailable */ }
                  }

                  if (!hasLoc) {
                    setDirectionsFetching(false);
                    return;
                  }

                  const destLat = business.latitude!;
                  const destLng = business.longitude!;
                  const params = new URLSearchParams({
                    lat: String(userLat), lng: String(userLng),
                    destLat: String(destLat), destLng: String(destLng),
                    destName: business.name ?? "", mode: travelMode,
                  });

                  const resp = await fetch(`/api/directions?${params.toString()}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });
                  if (resp.ok) {
                    const data = await resp.json() as {
                      totalDistance: string; totalDuration: string;
                      steps: Array<{ index: number; instruction: string; distance: string; maneuver: string | null }>;
                      waypoints: Array<{ lat: number; lng: number }>;
                    };
                    setDirectionsSummary({ distance: data.totalDistance, duration: data.totalDuration });
                    setDirectionsSteps(data.steps);
                    if (data.waypoints?.length) {
                      setSafetyLoading(true);
                      try {
                        const safetyResp = await fetch("/api/directions/safety-context", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                          body: JSON.stringify({ waypoints: data.waypoints }),
                        });
                        if (safetyResp.ok) setSafetyContext(await safetyResp.json());
                      } catch { /* safety context is best-effort */ } finally {
                        setSafetyLoading(false);
                      }
                    }
                  }
                } catch { /* ignore */ } finally {
                  setDirectionsFetching(false);
                }
              }}
            >
              <Feather name="navigation" size={14} color={isNavigator ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.directionsRowText, { color: isNavigator ? colors.primary : colors.mutedForeground }]}>
                {isNavigator ? "In-App Turn-by-Turn Directions" : "Open in Maps"}
              </Text>
              {isNavigator ? (
                <Feather name="chevron-right" size={14} color={colors.primary} />
              ) : (
                <View style={styles.navigatorBadge}>
                  <Text style={styles.navigatorBadgeText}>NAVIGATOR+</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Owner's Pinned Highlights */}
          {pinnedItems.length > 0 && (
            <View style={[styles.pinnedSection, { borderColor: "#C9922B33", backgroundColor: "#C9922B07" }]}>
              <View style={styles.pinnedHeader}>
                <Text style={{ fontSize: 16 }}>📌</Text>
                <Text style={[styles.pinnedTitle, { color: "#C9922B" }]}>Owner's Pick</Text>
              </View>
              {pinnedItems.map((pin) => (
                <View key={pin.id} style={[styles.pinnedCard, { backgroundColor: colors.card, borderColor: "#C9922B25" }]}>
                  {pin.itemType === "review" && pin.reviewText ? (
                    <>
                      <View style={styles.pinnedReviewTop}>
                        <View style={[styles.pinnedAvatar, { backgroundColor: pin.reviewColor ?? "#C9922B" }]}>
                          <Text style={styles.pinnedInitials}>{pin.reviewInitials ?? "?"}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pinnedAuthor, { color: colors.foreground }]}>{pin.reviewAuthor}</Text>
                          <Text style={[styles.pinnedTime, { color: colors.mutedForeground }]}>{pin.reviewTimeAgo}</Text>
                        </View>
                        {pin.reviewRating != null && (
                          <View style={styles.pinnedStars}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Feather key={i} name="star" size={12} color={i < pin.reviewRating! ? "#C9922B" : colors.border} />
                            ))}
                          </View>
                        )}
                      </View>
                      <Text style={[styles.pinnedReviewText, { color: colors.foreground }]}>"{pin.reviewText}"</Text>
                    </>
                  ) : pin.itemType === "video" && pin.videoUrl ? (
                    <TouchableOpacity
                      style={styles.pinnedVideoRow}
                      onPress={() => Linking.openURL(pin.videoUrl!)}
                      activeOpacity={0.75}
                    >
                      <Feather name="play-circle" size={22} color="#C9922B" />
                      <Text style={[styles.pinnedVideoTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {pin.videoTitle ?? pin.videoUrl}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Reviews */}
          <View style={[styles.responseTagline, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "25" }]}>
            <Feather name="shield" size={13} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={[styles.responseTaglineText, { color: colors.primary }]}>
              Every business has the right to respond. Every customer has the right to be heard. Every concern deserves the opportunity for resolution.
            </Text>
          </View>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Reviews ({allReviews.length})
            </Text>
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.reportBtn, { borderColor: colors.border }]}
              onPress={() => setReportModalOpen(true)}
            >
              <Feather name="flag" size={13} color={colors.mutedForeground} />
              <Text style={[styles.reportBtnText, { color: colors.mutedForeground }]}>Report</Text>
            </TouchableOpacity>
          </View>

          {allReviews.length === 0 ? (
            <View style={[styles.emptyReviews, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="star" size={24} color={colors.muted} />
              <Text style={[styles.emptyReviewText, { color: colors.mutedForeground }]}>
                Be the first to leave a review
              </Text>
            </View>
          ) : (
            allReviews.map((rev) => (
              <View key={rev.id} style={[styles.reviewCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, { backgroundColor: rev.color }]}>
                    <Text style={styles.reviewInitials}>{rev.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewAuthor, { color: colors.foreground }]}>{rev.author}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                      <Text style={[styles.reviewTime, { color: colors.mutedForeground }]}>{rev.timeAgo}</Text>
                      {rev.authorTrustLevel && rev.authorTrustLevel >= 2 && (
                        <TrustBadge level={rev.authorTrustLevel} size="sm" />
                      )}
                    </View>
                  </View>
                  <View style={styles.reviewRight}>
                    <RatingStars rating={rev.rating} showCount={false} size={13} showLabel />
                    {rev.wouldReturnAlone === true && (
                      <View style={styles.returnAlone}>
                        <Text style={{ fontSize: 11 }}>👍🏾</Text>
                        <Text style={[styles.returnAloneText, { color: "#2D7A4F" }]}>Would return</Text>
                      </View>
                    )}
                    {rev.wouldReturnAlone === false && (
                      <View style={styles.returnAlone}>
                        <Text style={{ fontSize: 11 }}>👎🏾</Text>
                        <Text style={[styles.returnAloneText, { color: "#DC2626" }]}>Wouldn't return</Text>
                      </View>
                    )}
                    {rev.wouldReturnAlone === null && (
                      <View style={styles.returnAlone}>
                        <Text style={{ fontSize: 11 }}>🤷🏾</Text>
                        <Text style={[styles.returnAloneText, { color: "#888" }]}>Maybe</Text>
                      </View>
                    )}
                  </View>
                </View>
                {rev.communitySupport != null && COMMUNITY_SUPPORT_LABELS[rev.communitySupport] && (
                  <View style={[styles.supportPill, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                    <Text style={[styles.supportPillText, { color: colors.primary }]}>
                      🤎 {COMMUNITY_SUPPORT_LABELS[rev.communitySupport]}
                    </Text>
                  </View>
                )}
                {/* Verification badges */}
                {rev.verificationBadge === "safety_report_verified" && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8, backgroundColor: "#CA922B10", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start", borderWidth: 1, borderColor: "#CA922B25" }}>
                    <Feather name="shield" size={11} color="#CA922B" />
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#CA922B" }}>Safety Report Verified</Text>
                  </View>
                )}
                {rev.verificationBadge === "verified_experience" && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8, backgroundColor: colors.primary + "10", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start", borderWidth: 1, borderColor: colors.primary + "25" }}>
                    <Feather name="check-circle" size={11} color={colors.primary} />
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.primary }}>Verified Experience</Text>
                  </View>
                )}
                {rev.text ? (
                  <Text style={[styles.reviewText, { color: colors.foreground }]}>{rev.text}</Text>
                ) : null}
                {rev.ownerResponse ? (
                  <View style={{ backgroundColor: colors.primary + "0D", borderColor: colors.primary + "30", borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <Feather name="shield" size={11} color={colors.primary} />
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: colors.primary }}>Owner Response</Text>
                    </View>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.foreground, lineHeight: 19 }}>
                      {rev.ownerResponse}
                    </Text>
                    {rev.isOwnReview && (
                      <TouchableOpacity activeOpacity={0.85}
                        style={{ marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + "40", backgroundColor: colors.primary + "0A" }}
                        onPress={() => {
                          setEditingReviewId(rev.id);
                          setEditingInitialRating(rev.rating);
                          setEditingInitialText(rev.text);
                          setReviewModalOpen(true);
                        }}
                      >
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.primary }}>✏️ Edit my review</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
                {rev.videoUrl ? (
                  <TouchableOpacity
                    style={[styles.videoLink, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => Linking.openURL(rev.videoUrl!)}
                    activeOpacity={0.75}
                  >
                    <Feather name="external-link" size={14} color={colors.primary} />
                    <Text style={[styles.videoLinkText, { color: colors.primary }]}>View Social Post</Text>
                  </TouchableOpacity>
                ) : null}
                {rev.nowHiringUrl ? (
                  <TouchableOpacity
                    style={[styles.videoLink, { backgroundColor: "#2D7A4F12", borderColor: "#2D7A4F33" }]}
                    onPress={() => Linking.openURL(rev.nowHiringUrl!)}
                    activeOpacity={0.75}
                  >
                    <Feather name="briefcase" size={14} color="#2D7A4F" />
                    <Text style={[styles.videoLinkText, { color: "#2D7A4F" }]}>Now Hiring — Apply</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Claim this business */}
        <View style={[styles.claimSection, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.claimRow} onPress={() => setClaimModalOpen(true)} activeOpacity={0.7}>
            <View style={[styles.claimIcon, { backgroundColor: colors.primary + "14" }]}>
              <Feather name="shield" size={14} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.claimLabel, { color: colors.foreground }]}>Is this your business?</Text>
              <Text style={[styles.claimSub, { color: colors.mutedForeground }]}>Claim this listing to manage your profile</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {pointsToast ? (
        <Animated.View style={[styles.pointsToast, { opacity: toastOpacity }]}>
          <Text style={styles.pointsToastText}>{pointsToast}</Text>
        </Animated.View>
      ) : null}

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          style={[styles.contactBtn, { backgroundColor: colors.secondary }]}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <Feather name="phone" size={18} color={colors.primary} />
          <Text style={[styles.contactBtnText, { color: colors.primary }]}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checkInBtn, {
            backgroundColor: alreadyCheckedIn ? colors.success + "22" : colors.success,
            borderWidth: alreadyCheckedIn ? 1.5 : 0,
            borderColor: colors.success,
          }]}
          onPress={handleCheckIn}
          activeOpacity={0.85}
          disabled={alreadyCheckedIn}
        >
          <Feather name="check-circle" size={18} color={alreadyCheckedIn ? colors.success : "#FFFFFF"} />
          <Text style={[styles.checkInBtnText, { color: alreadyCheckedIn ? colors.success : "#FFFFFF" }]}>
            {alreadyCheckedIn ? "Checked In" : "Check In"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setReviewModalOpen(true);
          }}
        >
          <Feather name="star" size={18} color="#FFFFFF" />
          <Text style={[styles.primaryBtnText, { color: "#FFFFFF" }]}>Review</Text>
        </TouchableOpacity>
      </View>

      {/* In-App Directions Modal (Navigator+) */}
      <Modal
        visible={directionsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDirectionsOpen(false)}
      >
        <View style={[styles.directionsModal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.directionsHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.directionsTitle, { color: colors.foreground }]}>Navigator</Text>
                <View style={{ backgroundColor: colors.primary + "20", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 9, color: colors.primary }}>SAFETY-AWARE</Text>
                </View>
              </View>
              {directionsSummary && (
                <Text style={[styles.directionsSummary, { color: colors.mutedForeground }]}>
                  {directionsSummary.distance} · {directionsSummary.duration}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setDirectionsOpen(false)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Mode toggle */}
          <View style={{ flexDirection: "row", margin: 14, marginBottom: 0, gap: 8 }}>
            {(["driving", "walking"] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={{ flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 5, backgroundColor: travelMode === m ? colors.primary : colors.secondary, borderWidth: 1, borderColor: travelMode === m ? colors.primary : colors.border }}
                onPress={() => { if (travelMode !== m) { setTravelMode(m); if (directionsSteps.length > 0) setModeChangedSinceLoad(true); } }}
              >
                <Feather name={m === "driving" ? "navigation" : "wind"} size={13} color={travelMode === m ? "#fff" : colors.mutedForeground} />
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: travelMode === m ? "#fff" : colors.mutedForeground }}>{m === "driving" ? "Driving" : "Walking"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recalculate banner */}
          {modeChangedSinceLoad && !directionsFetching && (
            <TouchableOpacity
              style={{ margin: 14, marginBottom: 0, padding: 10, borderRadius: 8, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}
              onPress={async () => {
                if (!userCoordsRef.current || !business.latitude || !business.longitude) return;
                setModeChangedSinceLoad(false);
                setSafetyContext(null);
                setDirectionsFetching(true);
                try {
                  const token = Platform.OS !== "web" ? await (await import("expo-secure-store")).getItemAsync("auth_session_token") : null;
                  const { lat, lng } = userCoordsRef.current;
                  const params = new URLSearchParams({
                    lat: String(lat), lng: String(lng),
                    destLat: String(business.latitude), destLng: String(business.longitude),
                    destName: business.name ?? "", mode: travelMode,
                  });
                  const resp = await fetch(`/api/directions?${params.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
                  if (resp.ok) {
                    const data = await resp.json() as { totalDistance: string; totalDuration: string; steps: Array<{ index: number; instruction: string; distance: string; maneuver: string | null }>; waypoints: Array<{ lat: number; lng: number }> };
                    setDirectionsSummary({ distance: data.totalDistance, duration: data.totalDuration });
                    setDirectionsSteps(data.steps);
                    if (data.waypoints?.length) {
                      setSafetyLoading(true);
                      try {
                        const sResp = await fetch("/api/directions/safety-context", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ waypoints: data.waypoints }) });
                        if (sResp.ok) setSafetyContext(await sResp.json());
                      } catch { } finally { setSafetyLoading(false); }
                    }
                  }
                } catch { } finally { setDirectionsFetching(false); }
              }}
            >
              <Feather name="refresh-cw" size={13} color="#fff" />
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" }}>Recalculate for {travelMode}</Text>
            </TouchableOpacity>
          )}

          {directionsFetching ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Feather name="navigation" size={32} color={colors.primary} />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground }}>
                Fetching directions…
              </Text>
            </View>
          ) : directionsSteps.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground }}>
                Enable location access to get directions.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

              {/* ── Safety Intelligence ─────────────────────────────────── */}
              {safetyLoading && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, padding: 10, borderRadius: 10, backgroundColor: colors.primary + "10" }}>
                  <Feather name="shield" size={14} color={colors.primary} />
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.primary }}>
                    Checking route safety…
                  </Text>
                </View>
              )}

              {/* Sundown Town Warnings */}
              {(safetyContext?.sundownWarnings ?? []).map((w) => (
                <View key={w.id} style={styles.safetyWarnRed}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Feather name="alert-triangle" size={15} color="#DC2626" />
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#DC2626" }}>Sundown Town Warning</Text>
                  </View>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#7f1d1d", marginBottom: 2 }}>{w.area}</Text>
                  {w.description ? (
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#991b1b", lineHeight: 15 }}>{w.description}</Text>
                  ) : (
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#991b1b", lineHeight: 15 }}>
                      This location has received community-reported discrimination incidents. Exercise caution.
                    </Text>
                  )}
                </View>
              ))}

              {/* Active Community Alerts */}
              {(safetyContext?.alerts ?? []).length > 0 && (
                <View style={styles.safetySection}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Feather name="radio" size={13} color="#D97706" />
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: "#D97706" }}>ACTIVE ALERTS ALONG ROUTE</Text>
                  </View>
                  {(safetyContext?.alerts ?? []).map((a) => {
                    const alertColors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
                      police: { bg: "#EFF6FF", border: "#BFDBFE", icon: "#1D4ED8", text: "#1e3a5f" },
                      ice: { bg: "#FFF7ED", border: "#FED7AA", icon: "#EA580C", text: "#7c2d12" },
                      road_closure: { bg: "#FEFCE8", border: "#FEF08A", icon: "#CA8A04", text: "#713f12" },
                      severe_weather: { bg: "#F0FDF4", border: "#BBF7D0", icon: "#16A34A", text: "#14532d" },
                      emergency: { bg: "#FEF2F2", border: "#FECACA", icon: "#DC2626", text: "#7f1d1d" },
                    };
                    const c = alertColors[a.type] ?? { bg: "#F9FAFB", border: "#E5E7EB", icon: "#6B7280", text: "#374151" };
                    return (
                      <View key={a.id} style={{ padding: 10, borderRadius: 8, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, marginBottom: 6, flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                        <Feather name={a.type === "police" ? "shield" : a.type === "ice" ? "alert-octagon" : a.type === "road_closure" ? "alert-triangle" : "zap"} size={14} color={c.icon} style={{ marginTop: 1 }} />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: c.text }}>{a.label}</Text>
                            <View style={{ backgroundColor: a.status === "confirmed" ? "#16A34A" : "#D97706", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 9, color: "#fff" }}>{a.status === "confirmed" ? "CONFIRMED" : "REPORTED"}</Text>
                            </View>
                          </View>
                          {a.description ? (
                            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: c.text, marginTop: 2, lineHeight: 15 }}>{a.description}</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Flagged Spaces to Avoid */}
              {(safetyContext?.flaggedBusinesses ?? []).length > 0 && (
                <View style={styles.safetySection}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Feather name="alert-circle" size={13} color="#EA580C" />
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: "#EA580C" }}>SPACES WITH SAFETY CONCERNS</Text>
                  </View>
                  {(safetyContext?.flaggedBusinesses ?? []).map((b) => (
                    <View key={b.id} style={{ padding: 10, borderRadius: 8, backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA", marginBottom: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#7c2d12" }}>{b.name}</Text>
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#9a3412", marginTop: 1 }}>{b.category} · {b.city}</Text>
                        </View>
                        <View style={{ backgroundColor: "#EA580C", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 }}>
                          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 9, color: "#fff" }}>{b.alertCount} REPORTS</Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 10, color: "#9a3412", marginTop: 4 }}>
                        {b.alertCount} community safety reports in the last 6 months · {b.distanceMiles} mi from route
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Minority-Owned Suggested Stops */}
              {(safetyContext?.suggestedStops ?? []).length > 0 && (
                <View style={styles.safetySection}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Feather name="star" size={13} color="#16A34A" />
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: "#16A34A" }}>COMMUNITY-OWNED STOPS NEARBY</Text>
                  </View>
                  {(safetyContext?.suggestedStops ?? []).map((s) => (
                    <View key={s.id} style={{ padding: 10, borderRadius: 8, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0", marginBottom: 6, flexDirection: "row", gap: 8, alignItems: "center" }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#16A34A20", alignItems: "center", justifyContent: "center" }}>
                        <Feather
                          name={s.category.toLowerCase().includes("gas") || s.category.toLowerCase().includes("fuel") ? "zap" : s.category.toLowerCase().includes("food") || s.category.toLowerCase().includes("restaurant") || s.category.toLowerCase().includes("cafe") ? "coffee" : "shopping-bag"}
                          size={14}
                          color="#16A34A"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#14532d" }}>{s.name}</Text>
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#166534", marginTop: 1 }}>{s.category} · {s.distanceMiles} mi from route</Text>
                        {s.hoursOfOperation ? (
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 10, color: "#16A34A", marginTop: 1 }}>{s.hoursOfOperation}</Text>
                        ) : null}
                      </View>
                      <View style={{ backgroundColor: "#16A34A15", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 9, color: "#16A34A" }}>SUPPORT</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* ── Step-by-step directions ─────────────────────────────── */}
              {(safetyContext || safetyLoading === false) && (safetyContext?.alerts.length || safetyContext?.sundownWarnings.length || safetyContext?.suggestedStops.length || safetyContext?.flaggedBusinesses.length) ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 4 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.mutedForeground }}>TURN-BY-TURN</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                </View>
              ) : null}

              {directionsSteps.map((step, idx) => (
                <View
                  key={step.index}
                  style={[styles.directionsStep, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.directionsStepNum, { backgroundColor: idx === 0 ? colors.primary : colors.primary + "20" }]}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: idx === 0 ? "#FFFFFF" : colors.primary }}>
                      {step.index + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.foreground }}>
                      {step.instruction.replace(/<[^>]+>/g, "")}
                    </Text>
                    {step.distance ? (
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, marginTop: 3 }}>
                        {step.distance}
                      </Text>
                    ) : null}
                  </View>
                  {step.maneuver ? (
                    <Feather
                      name={step.maneuver.includes("left") ? "corner-up-left" : step.maneuver.includes("right") ? "corner-up-right" : "arrow-up"}
                      size={16}
                      color={colors.mutedForeground}
                    />
                  ) : null}
                </View>
              ))}
              <View style={[styles.directionsStep, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Feather name="map-pin" size={16} color={colors.primary} />
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary, flex: 1 }}>
                  {business.name}
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      <WriteReviewModal
        visible={reviewModalOpen}
        businessName={business.name}
        businessId={id}
        businessCategory={business.category}
        reviewId={editingReviewId ?? undefined}
        initialRating={editingInitialRating}
        initialText={editingInitialText}
        onClose={() => { setReviewModalOpen(false); setEditingReviewId(null); setEditingInitialRating(undefined); setEditingInitialText(undefined); }}
        onSubmit={handleReviewSubmit}
      />

      <SafetyExperienceSurvey
        visible={showSafetySurvey}
        businessName={business.name}
        businessCategory={business.category}
        onClose={() => setShowSafetySurvey(false)}
      />

      {/* Hidden Gem Nomination Sheet */}
      <Modal visible={nomSheetOpen} transparent animationType="slide" onRequestClose={() => setNomSheetOpen(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "#00000055" } as any} activeOpacity={1} onPress={() => setNomSheetOpen(false)} />
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Math.max(insets.bottom, 20), maxHeight: "88%" }}>
            <View style={{ width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 16 }} />
            <ScrollView keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Feather name="star" size={20} color="#CA922B" />
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground }}>Nominate as a Hidden Gem</Text>
              </View>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, marginBottom: 20, lineHeight: 19 }}>
                Know something the community should know about? Help put this business on the map.
              </Text>

              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground, marginBottom: 10 }}>Why does this place deserve the spotlight?</Text>
              {([
                { key: "amazing_service", label: "Amazing service" },
                { key: "exceptional_food", label: "Exceptional food" },
                { key: "community_impact", label: "Community impact" },
                { key: "welcoming_atmosphere", label: "Welcoming atmosphere" },
                { key: "unique_products", label: "Unique products" },
                { key: "family_owned", label: "Family-owned feel" },
                { key: "great_value", label: "Great value" },
                { key: "cultural_significance", label: "Cultural significance" },
                { key: "hidden_location", label: "Hidden location" },
                { key: "other", label: "Other" },
              ] as const).map((r) => (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNomReason(nomReason === r.key ? null : r.key); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border + "60" }}
                  activeOpacity={0.75}
                >
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: nomReason === r.key ? "#CA922B" : colors.border, backgroundColor: nomReason === r.key ? "#CA922B" : "transparent", alignItems: "center", justifyContent: "center" }}>
                    {nomReason === r.key && <Feather name="check" size={11} color="#FFF" />}
                  </View>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground }}>{r.label}</Text>
                </TouchableOpacity>
              ))}

              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground, marginTop: 20, marginBottom: 10 }}>Who is this place perfect for?</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {([
                  { key: "new_residents", label: "New residents" },
                  { key: "visitors", label: "Visitors" },
                  { key: "families", label: "Families" },
                  { key: "college_students", label: "College students" },
                  { key: "professionals", label: "Professionals" },
                  { key: "date_night", label: "Date night" },
                  { key: "solo_travelers", label: "Solo travelers" },
                  { key: "community_shopping", label: "Community shopping" },
                  { key: "lgbtq_friendly", label: "LGBTQ+ friendly" },
                ] as const).map((a) => {
                  const selected = nomAudiences.includes(a.key);
                  return (
                    <TouchableOpacity
                      key={a.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNomAudiences(prev => selected ? prev.filter(x => x !== a.key) : [...prev, a.key]);
                      }}
                      style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: selected ? "#CA922B" : colors.border, backgroundColor: selected ? "#CA922B18" : colors.card }}
                      activeOpacity={0.75}
                    >
                      <Text style={{ fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular", fontSize: 12, color: selected ? "#CA922B" : colors.mutedForeground }}>{a.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                disabled={!nomReason || nomSubmitting}
                onPress={async () => {
                  if (!nomReason) return;
                  setNomSubmitting(true);
                  try {
                    const { getItemAsync } = await import("expo-secure-store");
                    const token = await getItemAsync("auth_session_token");
                    if (!token) { Alert.alert("Sign in required", "Sign in to nominate a Hidden Gem."); setNomSheetOpen(false); setNomSubmitting(false); return; }
                    const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
                    const res = await fetch(`${base}/api/hidden-gems/${id}/nominate`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ reason: nomReason, comment: nomComment.trim() || undefined, audienceTypes: nomAudiences.length ? nomAudiences : undefined }),
                    });
                    const data = await res.json() as { error?: string; code?: string; nominated?: boolean; totalNominations?: number; awarded?: boolean };
                    if (res.status === 409) { Alert.alert("Already nominated", "You've already nominated this business."); }
                    else if (!res.ok) { Alert.alert("Error", data.error ?? "Could not submit nomination."); }
                    else {
                      setGemStatus(prev => prev ? { ...prev, hasNominated: true, totalNominations: data.totalNominations ?? prev.totalNominations + 1, isActive: data.awarded ?? prev.isActive, label: data.awarded ? "Hidden Gem" : prev.label, tagline: prev.tagline } : prev);
                      setNomSheetOpen(false);
                      setNomReason(null); setNomAudiences([]); setNomComment("");
                      Alert.alert(data.awarded ? "Community Spotlight Earned!" : "Nomination submitted", data.awarded ? `${business.name} just earned the Hidden Gem spotlight — thanks to the community.` : "Thanks for the nomination. Keep spreading the word!");
                    }
                  } catch { Alert.alert("Error", "Something went wrong. Try again."); }
                  finally { setNomSubmitting(false); }
                }}
                style={{ backgroundColor: !nomReason ? colors.border : "#CA922B", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 }}
                activeOpacity={0.85}
              >
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: !nomReason ? colors.mutedForeground : "#FFF" }}>
                  {nomSubmitting ? "Submitting…" : "Submit Nomination"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Caption Voting Sheet */}
      <Modal visible={captionSheetOpen} transparent animationType="slide" onRequestClose={() => setCaptionSheetOpen(false)}>
        <View style={styles.captionOverlay}>
          <TouchableOpacity style={styles.captionBackdrop} activeOpacity={1} onPress={() => setCaptionSheetOpen(false)} />
          <View style={[styles.captionSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.captionHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.captionSheetTitle, { color: colors.foreground }]}>What stands out?</Text>
            <Text style={[styles.captionSheetSub, { color: colors.mutedForeground }]}>Tap all that apply — your picks show up on this profile</Text>
            <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
              <View style={styles.captionChipWrap}>
                {getCaptionsForBusiness(business.category ?? "").map((caption) => {
                  const active = pendingCaptions.includes(caption);
                  return (
                    <TouchableOpacity
                      key={caption}
                      style={[styles.captionVoteChip, {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + "15" : colors.card,
                      }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPendingCaptions(prev => prev.includes(caption) ? prev.filter(c => c !== caption) : [...prev, caption]);
                      }}
                      activeOpacity={0.7}
                    >
                      {active && <Feather name="check" size={12} color={colors.primary} />}
                      <Text style={[styles.captionVoteChipText, { color: active ? colors.primary : colors.foreground }]}>{caption}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[styles.captionSubmitBtn, {
                backgroundColor: pendingCaptions.length > 0 ? colors.primary : colors.muted,
                opacity: captionSubmitting ? 0.7 : 1,
              }]}
              onPress={() => { void submitCaptionVotes(); }}
              disabled={pendingCaptions.length === 0 || captionSubmitting}
              activeOpacity={0.8}
            >
              <Text style={[styles.captionSubmitText, { color: pendingCaptions.length > 0 ? "#FBF7F0" : colors.mutedForeground }]}>
                {pendingCaptions.length === 0 ? "Select at least one" : `Add ${pendingCaptions.length} Caption${pendingCaptions.length > 1 ? "s" : ""}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ClaimBusinessModal
        visible={claimModalOpen}
        businessId={id ?? ""}
        businessName={business.name}
        onClose={() => setClaimModalOpen(false)}
      />
      <ReportContentModal
        visible={reportModalOpen}
        businessName={business.name}
        businessId={business.id}
        onClose={() => setReportModalOpen(false)}
      />
      <ShareModal
        visible={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        businessId={business.id}
        businessName={business.name}
        city={business.city}
        state={business.state}
        category={business.category}
      />
      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="Leaving Reviews"
      />
      <PassThePlateModal
        visible={passThePlateOpen}
        businessId={id ?? ""}
        businessName={business?.name ?? ""}
        onClose={() => setPassThePlateOpen(false)}
        onSuccess={() => setPlatePassCount(prev => prev + 1)}
      />

      {/* Suggest to Circle Sheet */}
      <Modal visible={circleSheetOpen} transparent animationType="slide" onRequestClose={() => setCircleSheetOpen(false)}>
        <View style={styles.captionOverlay}>
          <TouchableOpacity style={styles.captionBackdrop} activeOpacity={1} onPress={() => setCircleSheetOpen(false)} />
          <View style={[styles.captionSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.captionHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.captionSheetTitle, { color: colors.foreground }]}>Suggest to a Circle</Text>
            <Text style={[styles.captionSheetSub, { color: colors.mutedForeground }]}>
              Share {business?.name} with one of your Kinfolk Circles
            </Text>
            {circlesLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
            ) : userCircles.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 24, gap: 12 }}>
                <Feather name="users" size={32} color={colors.mutedForeground} />
                <Text style={[styles.captionSheetSub, { color: colors.mutedForeground, textAlign: "center" }]}>
                  You're not in any circles yet.{"\n"}Create one in the Community tab!
                </Text>
                <TouchableOpacity
                  style={[styles.captionSubmitBtn, { backgroundColor: colors.primary, paddingHorizontal: 24 }]}
                  onPress={() => { setCircleSheetOpen(false); router.push("/(tabs)/community" as any); }}
                >
                  <Text style={[styles.captionSubmitText, { color: "#FFFFFF" }]}>Go to Community</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {userCircles.map((circle) => (
                  <TouchableOpacity
                    key={circle.id}
                    style={[styles.circlePickRow, { borderBottomColor: colors.border, backgroundColor: suggestingCircleId === circle.id ? colors.primary + "10" : "transparent" }]}
                    onPress={() => { void suggestToCircle(circle.id); }}
                    disabled={suggestingCircleId !== null}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.circlePickAvatar, { backgroundColor: colors.primary + "20" }]}>
                      <Feather name="users" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.circlePickName, { color: colors.foreground }]}>{circle.name}</Text>
                      {(circle.city || circle.state) && (
                        <Text style={[styles.circlePickSub, { color: colors.mutedForeground }]}>
                          {[circle.city, circle.state].filter(Boolean).join(", ")} · {circle.memberCount} member{circle.memberCount !== 1 ? "s" : ""}
                        </Text>
                      )}
                    </View>
                    {suggestingCircleId === circle.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  backLink: { fontFamily: "Inter_500Medium", fontSize: 14 },
  backBtn: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  backBtnRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { width: "100%", height: 260 },
  body: { padding: 20, gap: 16 },
  titleSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  name: { fontFamily: "Inter_700Bold", fontSize: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  foundingBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#C9922B18", borderWidth: 1, borderColor: "#C9922B50",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  foundingBadgeStar: { fontSize: 12 },
  foundingBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#C9922B" },
  minorityDisclaimer: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 4, fontStyle: "italic" },
  category: { fontFamily: "Inter_500Medium", fontSize: 13 },
  price: { fontFamily: "Inter_400Regular", fontSize: 13 },
  rateSafetyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  rateSafetyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2D7A4F18",
    alignItems: "center",
    justifyContent: "center",
  },
  rateSafetyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  rateSafetySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  safetyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  safetyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  safetyStats: {
    flexDirection: "row",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#2D7A4F",
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textAlign: "center",
  },
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1, lineHeight: 20 },
  socialLinksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  socialBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  socialBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  primarySocialCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, marginBottom: 10 },
  primarySocialIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  taglineLine: { fontFamily: "Inter_500Medium", fontSize: 13, fontStyle: "italic", marginTop: 2, marginBottom: 2 },
  ownerCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16, marginBottom: 4, gap: 10 },
  ownerCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  ownerAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  ownerAvatarText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  ownerLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 2 },
  ownerName: { fontFamily: "Inter_700Bold", fontSize: 15 },
  ownerBio: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  ownerStoryDivider: { height: 1, marginVertical: 4 },
  ownerStoryLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  ownerStory: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, fontStyle: "italic" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  description: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  mapWrap: { borderRadius: 14, overflow: "hidden", borderWidth: 1 },
  directionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  directionsRowText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  navigatorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#CA922B15",
    borderWidth: 1,
    borderColor: "#CA922B30",
  },
  navigatorBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#CA922B" },
  directionsModal: { flex: 1 },
  directionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  directionsTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  directionsSummary: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  directionsStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  directionsStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  safetyWarnRed: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 10,
  },
  safetySection: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  reportBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  emptyReviews: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyReviewText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  reviewCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  reviewInitials: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#FFFFFF" },
  reviewAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  reviewTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  reviewRight: { alignItems: "flex-end", gap: 4 },
  returnAlone: { flexDirection: "row", alignItems: "center", gap: 4 },
  returnAloneText: { fontFamily: "Inter_500Medium", fontSize: 10 },
  supportPill: { alignSelf: "flex-start" as const, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4 },
  supportPillText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  reviewText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  videoLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 },
  videoLinkText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  claimSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, borderTopWidth: 1, marginTop: 8 },
  claimRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  claimIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  claimLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  claimSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 12,
  },
  contactBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 12,
  },
  primaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 12,
  },
  checkInBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  pointsToast: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "#2D7A4F",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 99,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  pointsToastText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  pinnedSection: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  pinnedHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  pinnedTitle: { fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 0.3 },
  pinnedCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  pinnedReviewTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  pinnedAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pinnedInitials: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#FFF" },
  pinnedAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  pinnedTime: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  pinnedStars: { flexDirection: "row", gap: 2 },
  pinnedReviewText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, fontStyle: "italic" },
  pinnedVideoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pinnedVideoTitle: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  disputedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: "#FEF3C7",
  },
  disputedTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    marginBottom: 2,
  },
  disputedSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  responseTagline: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  responseTaglineText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    fontStyle: "italic",
  },
  vibeCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  vibeCardEmoji: { fontSize: 26 },
  vibeCardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 3 },
  vibeCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.78)" },
  plateCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1, padding: 16,
  },
  plateCardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  plateEmoji: { fontSize: 26 },
  plateTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 3 },
  plateSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  plateArrowWrap: { width: 24, alignItems: "center" },
  captionSection: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  captionHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 12 },
  captionTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  addCaptionBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  addCaptionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  captionEmpty: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  captionBadgeWrap: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  captionBadge: { flexDirection: "row" as const, alignItems: "center" as const, gap: 5, borderWidth: 1, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 7 },
  captionBadgeCount: { fontFamily: "Inter_700Bold", fontSize: 13 },
  captionBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  captionOverlay: { flex: 1, justifyContent: "flex-end" as const },
  captionBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  captionSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, maxHeight: "75%" as const },
  captionHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" as const, marginBottom: 16 },
  captionSheetTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 6 },
  captionSheetSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 16, lineHeight: 19 },
  captionChipWrap: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8, paddingBottom: 16 },
  captionVoteChip: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  captionVoteChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  captionSubmitBtn: { marginTop: 8, paddingVertical: 16, borderRadius: 14, alignItems: "center" as const },
  captionSubmitText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  circlePickRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1 },
  circlePickAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center" as const, justifyContent: "center" as const },
  circlePickName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  circlePickSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
});
