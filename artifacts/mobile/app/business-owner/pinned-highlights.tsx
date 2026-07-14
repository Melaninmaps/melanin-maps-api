import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { useReviews } from "@/hooks/useReviews";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface PinnedItem {
  id: number;
  businessId: string;
  itemType: "review" | "video";
  reviewId: string | null;
  reviewText: string | null;
  reviewAuthor: string | null;
  reviewRating: number | null;
  reviewInitials: string | null;
  reviewColor: string | null;
  reviewTimeAgo: string | null;
  videoUrl: string | null;
  videoTitle: string | null;
  pinnedAt: string;
  expiresAt: string;
  status: string;
  notifiedExpiry: boolean | null;
  daysLeft: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  text: string | null;
  createdAt: string;
  videoUrl: string | null;
}

const AVATAR_COLORS = ["#CA922B", "#C9922B", "#2D7A4F", "#7B3F00", "#1D4ED8"];

export default function PinnedHighlightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [pinned, setPinned] = useState<PinnedItem[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unpinning, setUnpinning] = useState<number | null>(null);
  const [showPickReview, setShowPickReview] = useState(false);
  const [pinningReviewId, setPinningReviewId] = useState<string | null>(null);
  const [showExpiryPrompt, setShowExpiryPrompt] = useState<PinnedItem | null>(null);

  const { reviews } = useReviews(businessId ?? "");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const loadPinned = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/business/pinned`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { pinned: PinnedItem[]; businessId: string };
        setPinned(data.pinned);
        setBusinessId(data.businessId);

        // Show expiry prompt for expired/expiring-soon active pins (one at a time)
        const needsPrompt = data.pinned.find(
          (p) => p.status === "active" && (p.isExpired || p.isExpiringSoon) && !p.notifiedExpiry
        );
        if (needsPrompt) setShowExpiryPrompt(needsPrompt);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadPinned(); }, [loadPinned]);

  const handleUnpin = async (itemId: number) => {
    setUnpinning(itemId);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/business/pinned/${itemId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await loadPinned();
    } catch { /* silent */ }
    finally { setUnpinning(null); }
  };

  const handlePinReview = async (review: ReviewItem) => {
    setPinningReviewId(review.id);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const initials = review.authorName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
      const color = AVATAR_COLORS[review.authorName.charCodeAt(0) % AVATAR_COLORS.length];
      const timeAgo = new Date(review.createdAt).toLocaleDateString();
      const res = await fetch(`${getApiBase()}/api/business/pinned`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          itemType: "review",
          reviewId: review.id,
          reviewText: review.text,
          reviewAuthor: review.authorName,
          reviewRating: review.rating,
          reviewInitials: initials,
          reviewColor: color,
          reviewTimeAgo: timeAgo,
        }),
      });
      if (res.ok) {
        setShowPickReview(false);
        setShowExpiryPrompt(null);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadPinned();
      }
    } catch { /* silent */ }
    finally { setPinningReviewId(null); }
  };

  const activePins = pinned.filter((p) => p.status === "active");
  const pastPins = pinned.filter((p) => p.status !== "active");

  const daysLeftColor = (item: PinnedItem) => {
    if (item.isExpired) return "#DC2626";
    if (item.isExpiringSoon) return "#D4873A";
    return "#2D7A4F";
  };

  const daysLeftLabel = (item: PinnedItem) => {
    if (item.isExpired) return "Expired";
    if (item.daysLeft === 0) return "Expires today";
    return `${item.daysLeft}d left`;
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Pinned Highlights</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: bottomPad + 40 }} showsVerticalScrollIndicator={false}>
          {/* Explainer */}
          <View style={[s.explainerCard, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "25" }]}>
            <Feather name="bookmark" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[s.explainerTitle, { color: colors.foreground }]}>Feature your best reviews</Text>
              <Text style={[s.explainerSub, { color: colors.mutedForeground }]}>
                Pin up to 1 review and 1 video for 90 days each. They'll appear at the top of your profile so customers see your best first.
              </Text>
            </View>
          </View>

          {/* Pin a review CTA */}
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.foreground }]}>Active Pins</Text>
            {activePins.length === 0 && (
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                No active pins yet. Feature a review below.
              </Text>
            )}
            {activePins.map((item) => (
              <View key={item.id} style={[s.pinCard, { backgroundColor: colors.card, borderColor: item.isExpiringSoon || item.isExpired ? daysLeftColor(item) + "40" : colors.border }]}>
                <View style={s.pinCardTop}>
                  <View style={[s.pinTypeBadge, { backgroundColor: colors.primary + "15" }]}>
                    <Feather name={item.itemType === "review" ? "star" : "play-circle"} size={12} color={colors.primary} />
                    <Text style={[s.pinTypeBadgeText, { color: colors.primary }]}>
                      {item.itemType === "review" ? "Review" : "Video"}
                    </Text>
                  </View>
                  <View style={[s.daysLeftBadge, { backgroundColor: daysLeftColor(item) + "15" }]}>
                    <Text style={[s.daysLeftText, { color: daysLeftColor(item) }]}>{daysLeftLabel(item)}</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.85}
                    style={[s.unpinBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      Alert.alert("Unpin this item?", "It will be removed from the top of your profile.", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Unpin", style: "destructive", onPress: () => void handleUnpin(item.id) },
                      ]);
                    }}
                    disabled={unpinning === item.id}
                  >
                    {unpinning === item.id
                      ? <ActivityIndicator size="small" color={colors.mutedForeground} />
                      : <Feather name="x" size={14} color={colors.mutedForeground} />
                    }
                  </TouchableOpacity>
                </View>

                {item.itemType === "review" && item.reviewText ? (
                  <>
                    <View style={s.reviewAuthorRow}>
                      <View style={[s.reviewAvatar, { backgroundColor: item.reviewColor ?? colors.primary }]}>
                        <Text style={s.reviewInitials}>{item.reviewInitials ?? "?"}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.reviewAuthorText, { color: colors.foreground }]}>{item.reviewAuthor}</Text>
                        <Text style={[s.reviewTimeAgo, { color: colors.mutedForeground }]}>{item.reviewTimeAgo}</Text>
                      </View>
                      {item.reviewRating && (
                        <View style={s.starsRow}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Feather key={i} name="star" size={12} color={i < item.reviewRating! ? "#C9922B" : colors.border} />
                          ))}
                        </View>
                      )}
                    </View>
                    <Text style={[s.reviewTextSnippet, { color: colors.foreground }]} numberOfLines={3}>
                      "{item.reviewText}"
                    </Text>
                  </>
                ) : item.itemType === "video" && item.videoUrl ? (
                  <View style={s.videoRow}>
                    <Feather name="play-circle" size={22} color={colors.primary} />
                    <Text style={[s.videoTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {item.videoTitle ?? item.videoUrl}
                    </Text>
                  </View>
                ) : null}

                {(item.isExpiringSoon || item.isExpired) && (
                  <TouchableOpacity
                    style={[s.replaceBtn, { backgroundColor: daysLeftColor(item) + "12", borderColor: daysLeftColor(item) + "40" }]}
                    onPress={() => setShowPickReview(true)}
                    activeOpacity={0.8}
                  >
                    <Feather name="refresh-cw" size={13} color={daysLeftColor(item)} />
                    <Text style={[s.replaceBtnText, { color: daysLeftColor(item) }]}>
                      {item.isExpired ? "This pin expired — replace it" : "Expiring soon — replace?"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Pin a new review */}
          {reviews.length > 0 && (
            <View style={s.section}>
              <TouchableOpacity
                style={[s.pinNewBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowPickReview(true)}
                activeOpacity={0.85}
              >
                <Feather name="bookmark" size={16} color="#FFF" />
                <Text style={s.pinNewBtnText}>Feature a Review</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Past pins */}
          {pastPins.length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: colors.foreground }]}>Past Pins</Text>
              {pastPins.map((item) => (
                <View key={item.id} style={[s.pinCard, s.pastPin, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: 0.7 }]}>
                  <View style={s.pinCardTop}>
                    <View style={[s.pinTypeBadge, { backgroundColor: colors.muted + "30" }]}>
                      <Feather name={item.itemType === "review" ? "star" : "play-circle"} size={12} color={colors.mutedForeground} />
                      <Text style={[s.pinTypeBadgeText, { color: colors.mutedForeground }]}>
                        {item.itemType === "review" ? "Review" : "Video"} · {item.status}
                      </Text>
                    </View>
                  </View>
                  {item.reviewText ? (
                    <Text style={[s.reviewTextSnippet, { color: colors.mutedForeground }]} numberOfLines={2}>
                      "{item.reviewText}"
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Pick a review modal */}
      <Modal visible={showPickReview} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPickReview(false)}>
        <View style={[s.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setShowPickReview(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Choose a Review to Feature</Text>
            <View style={{ width: 22 }} />
          </View>
          <FlatList
        keyboardDismissMode="on-drag"
            data={reviews as ReviewItem[]}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No reviews yet</Text>
            }
            renderItem={({ item: rev }) => (
              <TouchableOpacity
                style={[s.reviewPickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => void handlePinReview(rev as ReviewItem)}
                disabled={pinningReviewId === rev.id}
                activeOpacity={0.8}
              >
                <View style={s.reviewAuthorRow}>
                  <View style={[s.reviewAvatar, { backgroundColor: AVATAR_COLORS[(rev as ReviewItem).authorName.charCodeAt(0) % AVATAR_COLORS.length] }]}>
                    <Text style={s.reviewInitials}>
                      {(rev as ReviewItem).authorName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.reviewAuthorText, { color: colors.foreground }]}>{(rev as ReviewItem).authorName}</Text>
                    <View style={s.starsRow}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Feather key={i} name="star" size={12} color={i < rev.rating ? "#C9922B" : colors.border} />
                      ))}
                    </View>
                  </View>
                  {pinningReviewId === rev.id
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : (
                      <View style={[s.pinActionBtn, { backgroundColor: colors.primary }]}>
                        <Feather name="bookmark" size={13} color="#FFF" />
                        <Text style={s.pinActionBtnText}>Feature</Text>
                      </View>
                    )
                  }
                </View>
                {rev.text ? (
                  <Text style={[s.reviewTextSnippet, { color: colors.foreground }]} numberOfLines={3}>
                    "{rev.text}"
                  </Text>
                ) : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Expiry prompt modal */}
      <Modal visible={showExpiryPrompt !== null} animationType="fade" transparent onRequestClose={() => setShowExpiryPrompt(null)}>
        <View style={s.expiryOverlay}>
          <View style={[s.expiryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 36, textAlign: "center" }}>📌</Text>
            <Text style={[s.expiryTitle, { color: colors.foreground }]}>Keep it fresh?</Text>
            <Text style={[s.expirySub, { color: colors.mutedForeground }]}>
              We want to make sure we're always presenting your most up-to-date reviews.
              {showExpiryPrompt?.isExpired
                ? " This pinned review has expired after 90 days."
                : ` This pinned review expires in ${showExpiryPrompt?.daysLeft} days.`}
              {"\n\n"}Would you like to replace it with a more recent one?
            </Text>
            <View style={s.expiryBtns}>
              <TouchableOpacity activeOpacity={0.85}
                style={[s.expiryKeepBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                onPress={() => setShowExpiryPrompt(null)}
              >
                <Text style={[s.expiryKeepBtnText, { color: colors.foreground }]}>Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85}
                style={[s.expiryReplaceBtn, { backgroundColor: colors.primary }]}
                onPress={() => { setShowExpiryPrompt(null); setShowPickReview(true); }}
              >
                <Feather name="refresh-cw" size={14} color="#FFF" />
                <Text style={s.expiryReplaceBtnText}>Replace it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 17 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  explainerCard: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  explainerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 4 },
  explainerSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 10 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 12 },
  pinCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, gap: 10 },
  pastPin: {},
  pinCardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  pinTypeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pinTypeBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  daysLeftBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  daysLeftText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  unpinBtn: { marginLeft: "auto", borderWidth: 1, borderRadius: 8, padding: 6 },
  reviewAuthorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  reviewInitials: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#FFF" },
  reviewAuthorText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  reviewTimeAgo: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  starsRow: { flexDirection: "row", gap: 2, marginTop: 2 },
  reviewTextSnippet: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, fontStyle: "italic" },
  videoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  videoTitle: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  replaceBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  replaceBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  pinNewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  pinNewBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFF" },
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  reviewPickCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  pinActionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  pinActionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFF" },
  expiryOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  expiryCard: { borderRadius: 24, borderWidth: 1, padding: 28, gap: 14, width: "100%", maxWidth: 380 },
  expiryTitle: { fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "center" },
  expirySub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  expiryBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  expiryKeepBtn: { flex: 1, alignItems: "center", paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  expiryKeepBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  expiryReplaceBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 13, borderRadius: 14 },
  expiryReplaceBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFF" },
});
