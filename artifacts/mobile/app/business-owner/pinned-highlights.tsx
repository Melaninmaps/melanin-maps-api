import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  businessId: string;
  authorName: string;
  rating: number;
  text: string | null;
  createdAt: string;
  videoUrl: string | null;
}

const AVATAR_COLORS = ["#CA922B", "#C9922B", "#2D7A4F", "#7B3F00", "#1D4ED8"];

export interface ManagedPinnedBusiness {
  id: string;
  name: string;
  managementRole: "owner" | "manager";
}

function isWellFormedBusinessId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim() === value && value.length <= 128;
}

export function parseManagedPinnedBusinesses(value: unknown): ManagedPinnedBusiness[] | null {
  if (!Array.isArray(value)) return null;

  const seenIds = new Set<string>();
  const businesses: ManagedPinnedBusiness[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") return null;
    const business = candidate as Record<string, unknown>;
    if (!isWellFormedBusinessId(business.id)) return null;
    if (business.managementRole !== "owner" && business.managementRole !== "manager") return null;
    if (seenIds.has(business.id)) return null;
    seenIds.add(business.id);
    businesses.push({
      id: business.id,
      name: typeof business.name === "string" && business.name.trim() ? business.name : "Business",
      managementRole: business.managementRole,
    });
  }
  return businesses;
}

export function resolvePinnedHighlightsBusiness(
  incomingBusinessId: string | string[] | undefined,
  localBusinessId: string | null,
  managedBusinesses: unknown,
): ManagedPinnedBusiness | null {
  const parsedBusinesses = parseManagedPinnedBusinesses(managedBusinesses);
  if (!parsedBusinesses) return null;

  const ownerBusinesses = parsedBusinesses.filter((business) => business.managementRole === "owner");
  const requestedBusinessId = localBusinessId ?? incomingBusinessId;
  if (requestedBusinessId !== undefined && requestedBusinessId !== null) {
    if (!isWellFormedBusinessId(requestedBusinessId)) return null;
    return ownerBusinesses.find((business) => business.id === requestedBusinessId) ?? null;
  }

  // Legacy fallback is allowed only when the entire managed response contains
  // exactly one well-formed active owner relationship. Never take index zero.
  return parsedBusinesses.length === 1 && ownerBusinesses.length === 1
    ? ownerBusinesses[0]
    : null;
}

export function isPinnedListForSelectedBusiness(
  value: unknown,
  selectedBusinessId: string,
): value is { businessId: string; pinned: PinnedItem[] } {
  if (!value || typeof value !== "object") return false;
  const payload = value as { businessId?: unknown; pinned?: unknown };
  return payload.businessId === selectedBusinessId &&
    Array.isArray(payload.pinned) &&
    payload.pinned.every((item) => item && typeof item === "object" && (item as PinnedItem).businessId === selectedBusinessId);
}

export function isSelectedPinSuccess(
  value: unknown,
  selectedBusinessId: string,
): value is { businessId: string; pinned: PinnedItem } {
  if (!value || typeof value !== "object") return false;
  const payload = value as { businessId?: unknown; pinned?: unknown };
  return payload.businessId === selectedBusinessId &&
    Boolean(payload.pinned) &&
    typeof payload.pinned === "object" &&
    (payload.pinned as PinnedItem).businessId === selectedBusinessId;
}

export default function PinnedHighlightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { businessId: incomingBusinessId } = useLocalSearchParams<{
    businessId?: string | string[];
  }>();

  const [pinned, setPinned] = useState<PinnedItem[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [managedBusinesses, setManagedBusinesses] = useState<ManagedPinnedBusiness[]>([]);
  const [localBusinessId, setLocalBusinessId] = useState<string | null>(null);
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unpinning, setUnpinning] = useState<number | null>(null);
  const [showPickReview, setShowPickReview] = useState(false);
  const [pinningReviewId, setPinningReviewId] = useState<string | null>(null);
  const [showExpiryPrompt, setShowExpiryPrompt] = useState<PinnedItem | null>(null);
  const requestVersion = useRef(0);
  const selectedBusinessIdRef = useRef<string | null>(null);

  const { reviews: loadedReviews } = useReviews(businessId ?? "");
  const reviews = businessId
    ? loadedReviews.filter((review) => review.businessId === businessId)
    : [];

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const clearSelectedBusinessState = useCallback(() => {
    selectedBusinessIdRef.current = null;
    setBusinessId(null);
    setPinned([]);
    setShowPickReview(false);
    setShowExpiryPrompt(null);
    setPinningReviewId(null);
    setUnpinning(null);
  }, []);

  const setValidatedBusinessId = useCallback((nextBusinessId: string | null) => {
    selectedBusinessIdRef.current = nextBusinessId;
    setBusinessId(nextBusinessId);
  }, []);

  const isCurrentRequest = useCallback(
    (requestId: number, selectedBusinessId?: string) =>
      requestVersion.current === requestId &&
      (selectedBusinessId === undefined || selectedBusinessIdRef.current === selectedBusinessId),
    [],
  );

  const loadPinned = useCallback(async () => {
    const requestId = requestVersion.current + 1;
    requestVersion.current = requestId;
    clearSelectedBusinessState();
    setLoading(true);
    setSelectionMessage(null);

    if (!isAuthenticated) {
      setManagedBusinesses([]);
      setSelectionMessage("Sign in to manage Pinned Highlights.");
      setLoading(false);
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const managedResponse = await fetch(`${getApiBase()}/api/businesses/mine/managed`, {
        headers,
      });
      if (!isCurrentRequest(requestId)) return;
      if (!managedResponse.ok) {
        setManagedBusinesses([]);
        setSelectionMessage("Your business access could not be confirmed.");
        return;
      }

      const managedPayload = await managedResponse.json() as { businesses?: unknown };
      if (!isCurrentRequest(requestId)) return;
      const parsedBusinesses = parseManagedPinnedBusinesses(managedPayload.businesses);
      if (!parsedBusinesses) {
        setManagedBusinesses([]);
        setSelectionMessage("Your business access response was unavailable. Please choose a business again.");
        return;
      }
      setManagedBusinesses(parsedBusinesses);

      const selectedBusiness = resolvePinnedHighlightsBusiness(
        incomingBusinessId,
        localBusinessId,
        parsedBusinesses,
      );
      if (!selectedBusiness) {
        const ownerCount = parsedBusinesses.filter((business) => business.managementRole === "owner").length;
        setSelectionMessage(
          ownerCount > 1 || parsedBusinesses.length > 1
            ? "Choose an approved owner business before managing its pinned highlights."
            : "No approved owner business is available for Pinned Highlights.",
        );
        return;
      }

      setValidatedBusinessId(selectedBusiness.id);
      const res = await fetch(
        `${getApiBase()}/api/businesses/mine/managed/${encodeURIComponent(selectedBusiness.id)}/pinned`,
        { headers },
      );
      if (!isCurrentRequest(requestId, selectedBusiness.id)) return;
      if (!res.ok) {
        clearSelectedBusinessState();
        setSelectionMessage("The selected business is no longer available for Pinned Highlights.");
        return;
      }

      const data = await res.json() as unknown;
      if (!isCurrentRequest(requestId, selectedBusiness.id)) return;
      if (!isPinnedListForSelectedBusiness(data, selectedBusiness.id)) {
        clearSelectedBusinessState();
        setSelectionMessage("Pinned Highlights could not confirm the selected business.");
        return;
      }

      setPinned(data.pinned);
      const needsPrompt = data.pinned.find(
        (item) => item.status === "active" && (item.isExpired || item.isExpiringSoon) && !item.notifiedExpiry,
      );
      if (needsPrompt) setShowExpiryPrompt(needsPrompt);
    } catch {
      if (isCurrentRequest(requestId)) {
        clearSelectedBusinessState();
        setManagedBusinesses([]);
        setSelectionMessage("Pinned Highlights could not load your selected business.");
      }
    } finally {
      if (isCurrentRequest(requestId)) setLoading(false);
    }
  }, [clearSelectedBusinessState, incomingBusinessId, isAuthenticated, isCurrentRequest, localBusinessId, setValidatedBusinessId]);

  useEffect(() => {
    setLocalBusinessId(null);
  }, [incomingBusinessId]);

  useEffect(() => {
    void loadPinned();
    return () => { requestVersion.current += 1; };
  }, [loadPinned]);

  const handleUnpin = async (itemId: number) => {
    const selectedBusinessId = selectedBusinessIdRef.current;
    if (!selectedBusinessId) return;
    const requestId = requestVersion.current;
    setUnpinning(itemId);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(
        `${getApiBase()}/api/businesses/mine/managed/${encodeURIComponent(selectedBusinessId)}/pinned/${encodeURIComponent(String(itemId))}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!isCurrentRequest(requestId, selectedBusinessId) || !res.ok) return;
      await loadPinned();
    } catch { /* silent */ }
    finally {
      if (selectedBusinessIdRef.current === selectedBusinessId) setUnpinning(null);
    }
  };

  const handlePinReview = async (review: ReviewItem) => {
    const selectedBusinessId = selectedBusinessIdRef.current;
    if (!selectedBusinessId || review.businessId !== selectedBusinessId) return;
    const requestId = requestVersion.current;
    setPinningReviewId(review.id);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(
        `${getApiBase()}/api/businesses/mine/managed/${encodeURIComponent(selectedBusinessId)}/pinned`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ itemType: "review", reviewId: review.id }),
        },
      );
      const data = await res.json().catch(() => null) as unknown;
      if (!isCurrentRequest(requestId, selectedBusinessId) || !res.ok || !isSelectedPinSuccess(data, selectedBusinessId)) return;

      setShowPickReview(false);
      setShowExpiryPrompt(null);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadPinned();
    } catch { /* silent */ }
    finally {
      if (selectedBusinessIdRef.current === selectedBusinessId) setPinningReviewId(null);
    }
  };

  const activePins = businessId ? pinned.filter((item) => item.businessId === businessId && item.status === "active") : [];
  const pastPins = businessId ? pinned.filter((item) => item.businessId === businessId && item.status !== "active") : [];
  const ownerBusinessOptions = managedBusinesses.filter((business) => business.managementRole === "owner");

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
                Pin up to 1 review and 1 video for 90 days each. They&apos;ll appear at the top of your profile so customers see your best first.
              </Text>
            </View>
          </View>

          {!businessId && (
            <View style={[s.selectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.selectionTitle, { color: colors.foreground }]}>Choose a business</Text>
              {selectionMessage ? (
                <Text style={[s.selectionMessage, { color: colors.mutedForeground }]}>{selectionMessage}</Text>
              ) : null}
              {ownerBusinessOptions.map((business) => (
                <TouchableOpacity
                  key={business.id}
                  testID={`select-pinned-business-${business.id}`}
                  style={[s.selectionOption, { borderColor: colors.border }]}
                  activeOpacity={0.82}
                  onPress={() => setLocalBusinessId(business.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.selectionOptionName, { color: colors.foreground }]}>{business.name}</Text>
                    <Text style={[s.selectionOptionMeta, { color: colors.mutedForeground }]}>Approved owner workspace</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Pinned-item actions are unavailable until a selected owner ID has been confirmed. */}
          {businessId && (
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
                      &quot;{item.reviewText}&quot;
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
          )}

          {/* Pin a new review */}
          {businessId && reviews.length > 0 && (
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
                      &quot;{item.reviewText}&quot;
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Pick a review modal */}
      <Modal visible={showPickReview && Boolean(businessId)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPickReview(false)}>
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
                    &quot;{rev.text}&quot;
                  </Text>
                ) : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Expiry prompt modal */}
      <Modal visible={showExpiryPrompt !== null && Boolean(businessId)} animationType="fade" transparent onRequestClose={() => setShowExpiryPrompt(null)}>
        <View style={s.expiryOverlay}>
          <View style={[s.expiryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 36, textAlign: "center" }}>📌</Text>
            <Text style={[s.expiryTitle, { color: colors.foreground }]}>Keep it fresh?</Text>
            <Text style={[s.expirySub, { color: colors.mutedForeground }]}>
              We want to make sure we&apos;re always presenting your most up-to-date reviews.
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
  selectionCard: { marginHorizontal: 16, marginBottom: 20, borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  selectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  selectionMessage: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  selectionOption: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  selectionOptionName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  selectionOptionMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
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
