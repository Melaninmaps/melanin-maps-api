import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RatingStars } from "@/components/RatingStars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinessById } from "@/hooks/useBusinesses";

const CATEGORY_IMAGES: Record<string, any> = {
  Food: require("@/assets/images/bento-businesses.jpg"),
  Beauty: require("@/assets/images/bento-nightlife.jpg"),
  Retail: require("@/assets/images/bento-nightlife.jpg"),
  Tech: require("@/assets/images/bento-businesses.jpg"),
  Health: require("@/assets/images/bento-culture.jpg"),
  Legal: require("@/assets/images/bento-businesses.jpg"),
  Finance: require("@/assets/images/bento-businesses.jpg"),
};

type ReviewRow = { id: string; authorName: string | null; rating: number; body: string; createdAt: string };

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();

  const { business } = useBusinessById(id ?? "");
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    fetch(`/api/reviews?businessId=${id}`)
      .then((r) => (r.ok ? r.json() : { reviews: [] }))
      .then((data: { reviews: ReviewRow[] }) => setReviews(data.reviews ?? []))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [id]);

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

  const handleCall = () => {
    if (business.phone) Linking.openURL(`tel:${business.phone}`);
  };

  const handleWebsite = () => {
    if (business.website) Linking.openURL(`https://${business.website}`);
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
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleSave(business.id);
          }}
          style={[styles.iconBtn, { backgroundColor: saved ? "rgba(201,146,43,0.5)" : "rgba(0,0,0,0.45)" }]}
        >
          <Feather name="bookmark" size={20} color={saved ? "#C9922B" : "#FFFFFF"} />
        </TouchableOpacity>
        {saved && (
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/notification-prefs", params: { businessId: business.id, businessName: business.name } })}
            style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          >
            <Feather name="bell" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 30 }}>
        <Image source={img} style={styles.hero} contentFit="cover" />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{business.name}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.category, { color: colors.primary }]}>{business.category}</Text>
                {business.verified && <VerificationBadge size="md" />}
                {business.priceRange && (
                  <Text style={[styles.price, { color: colors.mutedForeground }]}>{business.priceRange}</Text>
                )}
              </View>
            </View>
          </View>

          <RatingStars rating={business.rating} reviewCount={business.reviewCount} size={14} />

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

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reviews</Text>
          {reviewsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : reviews.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                No reviews yet — be the first to share your experience!
              </Text>
            </View>
          ) : (
            reviews.map((rev) => {
              const initials = (rev.authorName ?? "?").split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
              const AVATAR_COLORS = ["#3B1F0E", "#C9922B", "#2D7A4F", "#5B3FA0", "#1A5276"];
              const avatarColor = AVATAR_COLORS[rev.id.charCodeAt(0) % AVATAR_COLORS.length] ?? "#3B1F0E";
              const timeAgo = new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              return (
                <View key={rev.id} style={[styles.reviewCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
                  <View style={styles.reviewHeader}>
                    <View style={[styles.reviewAvatar, { backgroundColor: avatarColor }]}>
                      <Text style={styles.reviewInitials}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reviewAuthor, { color: colors.foreground }]}>{rev.authorName ?? "Anonymous"}</Text>
                      <Text style={[styles.reviewTime, { color: colors.mutedForeground }]}>{timeAgo}</Text>
                    </View>
                    <RatingStars rating={rev.rating} showCount={false} size={11} showLabel />
                  </View>
                  <Text style={[styles.reviewText, { color: colors.foreground }]}>{rev.body}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

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
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Write a Review</Text>
        </TouchableOpacity>
      </View>
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
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { width: "100%", height: 260 },
  body: { padding: 20, gap: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start" },
  name: { fontFamily: "Inter_700Bold", fontSize: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" },
  category: { fontFamily: "Inter_500Medium", fontSize: 13 },
  price: { fontFamily: "Inter_400Regular", fontSize: 13 },
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
  reviewCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  reviewInitials: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#FFFFFF" },
  reviewAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  reviewTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  reviewText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
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
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 12,
  },
  primaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
