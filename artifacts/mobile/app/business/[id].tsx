import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlackOwnedBadge } from "@/components/BlackOwnedBadge";
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
import { UpgradeModal } from "@/components/UpgradeModal";

const CATEGORY_IMAGES: Record<string, any> = {
  Food: require("@/assets/images/bento-businesses.jpg"),
  Beauty: require("@/assets/images/bento-nightlife.jpg"),
  Retail: require("@/assets/images/bento-nightlife.jpg"),
  Tech: require("@/assets/images/bento-businesses.jpg"),
  Health: require("@/assets/images/bento-culture.jpg"),
  Legal: require("@/assets/images/bento-businesses.jpg"),
  Finance: require("@/assets/images/bento-businesses.jpg"),
};

const AVATAR_COLORS = ["#3B1F0E", "#C9922B", "#2D7A4F", "#7B3F00", "#1D4ED8"];

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pointsToast, setPointsToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const { reviews: apiReviews, submitReview } = useReviews(id ?? "");
  const { hasCheckedIn, checkIn } = useCheckins();
  const { addLocal } = usePoints();
  const { deals } = useDeals(id ?? "");
  const { stories } = useStories(id ?? "");

  const { business, isLoading } = useBusinessById(id ?? "");
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (isLoading && !business) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.backBtn, { top: Platform.OS === "web" ? 77 : insets.top + 10 }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const img = CATEGORY_IMAGES[business.category] ?? CATEGORY_IMAGES["Food"];
  const saved = isSaved(business.id);
  const alreadyCheckedIn = hasCheckedIn(business.id) || checkInDone;

  const allReviews: Array<{
    id: string; author: string; initials: string; color: string;
    rating: number; text: string; timeAgo: string; wouldReturnAlone?: boolean;
  }> = [
    ...apiReviews.map((r) => ({
      id: r.id,
      author: r.authorName,
      initials: r.authorName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??",
      color: AVATAR_COLORS[r.authorName.charCodeAt(0) % AVATAR_COLORS.length],
      rating: r.rating,
      text: r.text ?? "",
      timeAgo: new Date(r.createdAt).toLocaleDateString(),
      wouldReturnAlone: r.wouldReturnAlone ?? undefined,
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

  const handleCall = () => {
    if (business.phone) Linking.openURL(`tel:${business.phone}`);
  };

  const handleWebsite = () => {
    if (business.website) Linking.openURL(`https://${business.website}`);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareModalOpen(true);
  };

  const handleReviewSubmit = async (
    rating: number,
    text: string,
    wouldReturn: boolean,
    socialHandle?: string,
    socialPlatform?: string,
  ) => {
    try {
      const pts = await submitReview(rating, text, wouldReturn, socialHandle, socialPlatform, business.name);
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
    const pts = await checkIn(business.id);
    setCheckInDone(true);
    if (pts != null) {
      addLocal(pts);
      showPointsToast(`+${pts} pts — checked in!`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.backBtn, { top: Platform.OS === "web" ? 77 : insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.backBtnRight}>
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          >
            <Feather name="share-2" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleSave(business.id);
            }}
            style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          >
            <Feather name="bookmark" size={20} color={saved ? "#C9922B" : "#FFFFFF"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 100 }}>
        <Image source={img} style={styles.hero} contentFit="cover" />

        <View style={styles.body}>
          {/* Title row + badges */}
          <View style={styles.titleSection}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{business.name}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.category, { color: colors.primary }]}>{business.category}</Text>
                {business.verified && <VerificationBadge size="md" />}
                {business.priceRange && (
                  <Text style={[styles.price, { color: colors.mutedForeground }]}>{business.priceRange}</Text>
                )}
              </View>
              <View style={styles.badgeRow}>
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
            </View>
            <ConfidenceScoreBadge score={business.confidenceScore} size="lg" showLabel />
          </View>

          <RatingStars rating={business.rating} reviewCount={business.reviewCount} size={14} />

          {/* Safety stats */}
          {(business.wouldReturnAlone != null || business.safetyRating != null) && (
            <View style={[styles.safetyCard, { backgroundColor: "#2D7A4F10", borderColor: "#2D7A4F30" }]}>
              <View style={styles.safetyHeader}>
                <Feather name="shield" size={15} color="#2D7A4F" />
                <Text style={[styles.safetyTitle, { color: "#2D7A4F" }]}>Community Safety Stats</Text>
              </View>
              <View style={styles.safetyStats}>
                {business.wouldReturnAlone != null && (
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{business.wouldReturnAlone}%</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Would Return Alone</Text>
                  </View>
                )}
                {business.safetyRating != null && (
                  <View style={[styles.statItem, styles.statBorder, { borderColor: "#2D7A4F20" }]}>
                    <Text style={styles.statValue}>{business.safetyRating.toFixed(1)}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Safety Rating</Text>
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
              <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                <Feather name="phone" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.primary }]}>{business.phone}</Text>
              </TouchableOpacity>
            )}
            {business.website && (
              <TouchableOpacity style={styles.infoRow} onPress={handleWebsite}>
                <Feather name="globe" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.primary }]}>{business.website}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
          <Text style={[styles.description, { color: colors.foreground }]}>{business.description}</Text>

          {business.tags.length > 0 && (
            <View style={styles.tags}>
              {business.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.tagText, { color: colors.secondaryForeground }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <FlashDealsSection deals={deals} />
          <BusinessStoriesSection stories={stories} />

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Location</Text>
          <View style={[styles.mapWrap, { borderColor: colors.border }]}>
            <BusinessMapView
              latitude={business.latitude}
              longitude={business.longitude}
              name={business.name}
            />
          </View>

          {/* Reviews */}
          <View style={styles.reviewsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Reviews ({allReviews.length})
            </Text>
            <TouchableOpacity
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
                    <RatingStars rating={rev.rating} showCount={false} size={12} />
                    {rev.wouldReturnAlone != null && (
                      <View style={styles.returnAlone}>
                        <Feather
                          name={rev.wouldReturnAlone ? "thumbs-up" : "thumbs-down"}
                          size={11}
                          color={rev.wouldReturnAlone ? "#2D7A4F" : "#DC2626"}
                        />
                        <Text style={[styles.returnAloneText, { color: rev.wouldReturnAlone ? "#2D7A4F" : "#DC2626" }]}>
                          {rev.wouldReturnAlone ? "Would return" : "Wouldn't return"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                {rev.text ? (
                  <Text style={[styles.reviewText, { color: colors.foreground }]}>{rev.text}</Text>
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
        onClose={() => setReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
      />
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
  minorityDisclaimer: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 4, fontStyle: "italic" },
  category: { fontFamily: "Inter_500Medium", fontSize: 13 },
  price: { fontFamily: "Inter_400Regular", fontSize: 13 },
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
  reviewText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
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
});
