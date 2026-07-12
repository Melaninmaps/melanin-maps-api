import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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
import { KnowBeforeYouGoSection } from "@/components/KnowBeforeYouGoSection";
import { PassThePlateModal } from "@/components/PassThePlateModal";
import { UpgradeModal } from "@/components/UpgradeModal";
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
  const { id } = useLocalSearchParams<{ id: string }>();
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

  const { reviews: apiReviews, submitReview } = useReviews(id ?? "");
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
    fetch(`${process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""}/api/plate-passes/${id}/count`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { thisWeek?: number } | null) => { if (d?.thisWeek) setPlatePassCount(d.thisWeek); })
      .catch(() => {});
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

  const handleWebsite = () => {
    if (business.website) {
      trackClick("website_visit");
      const url = /^https?:\/\//i.test(business.website) ? business.website : `https://${business.website}`;
      WebBrowser.openBrowserAsync(url);
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 100 }}>
        <Image source={img} style={styles.hero} contentFit="cover" />

        <View style={styles.body}>
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
                <Feather name="globe" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.primary }]}>{business.website}</Text>
              </TouchableOpacity>
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
                    <Text style={[styles.reviewTime, { color: colors.mutedForeground }]}>{rev.timeAgo}</Text>
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

      {/* Caption Voting Sheet */}
      <Modal visible={captionSheetOpen} transparent animationType="slide" onRequestClose={() => setCaptionSheetOpen(false)}>
        <View style={styles.captionOverlay}>
          <TouchableOpacity style={styles.captionBackdrop} activeOpacity={1} onPress={() => setCaptionSheetOpen(false)} />
          <View style={[styles.captionSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.captionHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.captionSheetTitle, { color: colors.foreground }]}>What stands out?</Text>
            <Text style={[styles.captionSheetSub, { color: colors.mutedForeground }]}>Tap all that apply — your picks show up on this profile</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
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
});
