import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Business } from "@/constants/types";
import { BlackOwnedBadge } from "./BlackOwnedBadge";
import { NonMinorityBadge } from "./NonMinorityBadge";
import { ConfidenceScoreBadge } from "./ConfidenceScoreBadge";
import { RatingStars } from "./RatingStars";
import { VerificationBadge } from "./VerificationBadge";
import { SafetyExperienceSurvey } from "./SafetyExperienceSurvey";
import { BusinessPreviewModal } from "./BusinessPreviewModal";

function getOpenStatus(hours?: string | null): { open: boolean; label: string } | null {
  if (!hours) return null;
  const h = hours.toLowerCase().trim();
  if (h === "closed" || h === "temporarily closed") return { open: false, label: "Closed" };
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
  return { open: isOpen, label: isOpen ? "Open" : "Closed" };
}

const VIBES: { label: string; emoji: string; categories: string[] }[] = [
  { label: "Soul Food", emoji: "🍽️", categories: ["food", "restaurant", "bbq", "barbecue", "soul", "seafood", "southern"] },
  { label: "Hair & Beauty", emoji: "💈", categories: ["beauty", "hair", "barber", "salon", "nail", "spa", "cosmetic"] },
  { label: "Wellness", emoji: "💆🏾", categories: ["health", "wellness", "fitness", "gym", "yoga", "medical", "therapy"] },
  { label: "Art & Culture", emoji: "🎨", categories: ["art", "culture", "gallery", "museum", "creative", "studio"] },
  { label: "Late Night", emoji: "🌙", categories: ["nightlife", "bar", "lounge", "club", "entertainment", "comedy"] },
  { label: "Shopping", emoji: "🛍️", categories: ["retail", "shop", "boutique", "clothing", "apparel", "accessories"] },
  { label: "Professional", emoji: "💼", categories: ["legal", "finance", "tech", "consulting", "accounting", "real estate"] },
  { label: "Family", emoji: "👨🏾‍👩🏾‍👧🏾", categories: ["childcare", "education", "tutoring", "family", "daycare"] },
];

function getComplimentChips(business: Business): { label: string; color: string; bg: string }[] {
  const chips: { label: string; color: string; bg: string }[] = [];
  if (business.foundingBusiness) chips.push({ label: "🔑 Founding Member", color: "#92400E", bg: "#FEF3C720" });
  if (business.verified) chips.push({ label: "✓ Verified", color: "#166534", bg: "#DCFCE730" });
  if (business.rating >= 4.5 && business.reviewCount >= 5) chips.push({ label: "⭐ Community Fave", color: "#1D4ED8", bg: "#DBEAFE30" });
  if ((business.wouldReturnAlone ?? 0) > 0.65) chips.push({ label: "👍 Would Return", color: "#6D28D9", bg: "#EDE9FE30" });
  if ((business.recommendationRate ?? 0) > 0.8) chips.push({ label: "❤️ Top Pick", color: "#BE123C", bg: "#FFE4E620" });
  for (const cap of (business.topCaptions ?? []).slice(0, 2)) {
    chips.push({ label: `"${cap}"`, color: "#C4622D", bg: "#C4622D0F" });
  }
  return chips.slice(0, 4);
}

function getVibeMatch(category?: string): { label: string; emoji: string } | null {
  if (!category) return null;
  const cat = category.toLowerCase();
  const match = VIBES.find((v) => v.categories.some((c) => cat.includes(c) || c.includes(cat)));
  return match ?? null;
}

const CATEGORY_IMAGES: Record<string, any> = {
  Food: require("@/assets/images/bento-businesses.jpg"),
  Beauty: require("@/assets/images/bento-nightlife.jpg"),
  Retail: require("@/assets/images/bento-nightlife.jpg"),
  Tech: require("@/assets/images/bento-businesses.jpg"),
  Health: require("@/assets/images/bento-culture.jpg"),
  Legal: require("@/assets/images/bento-businesses.jpg"),
  Finance: require("@/assets/images/bento-businesses.jpg"),
};

interface Props {
  business: Business;
  onPress: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  horizontal?: boolean;
  warningCount?: number;
}

export function BusinessCard({ business, onPress, isSaved, onToggleSave, horizontal = false, warningCount = 0 }: Props) {
  const colors = useColors();
  const img = CATEGORY_IMAGES[business.category] ?? CATEGORY_IMAGES["Food"];
  const [showSafetySurvey, setShowSafetySurvey] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSave();
  };

  const handleRateSafety = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSafetySurvey(true);
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPreview(true);
  };

  if (horizontal) {
    return (
      <>
        <TouchableOpacity
          onPress={onPress}
          onLongPress={handleLongPress}
          delayLongPress={400}
          activeOpacity={0.92}
          style={[styles.hCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}
          accessibilityRole="button"
          accessibilityLabel={`${business.name}, ${business.category} in ${business.city}`}
          accessibilityHint="Double tap to view details, hold to preview"
        >
          <Image source={img} style={styles.hImage} contentFit="cover" />
          {business.blackOwned ? (
            <View style={styles.hBadgeOverlay}>
              <BlackOwnedBadge size="sm" />
            </View>
          ) : business.ownershipDesignations?.includes("non-minority-owned") ? (
            <View style={styles.hBadgeOverlay}>
              <NonMinorityBadge size="sm" />
            </View>
          ) : null}
          <View style={styles.hContent}>
            {warningCount >= 3 && (
              <View style={styles.warningBanner}>
                <Feather name="alert-octagon" size={11} color="#7C2D12" />
                <Text style={styles.warningText}>{warningCount} community reports filed</Text>
              </View>
            )}
            <View style={styles.hTop}>
              <View style={styles.hTitleRow}>
                <Text style={[styles.hName, { color: colors.foreground }]} numberOfLines={1}>
                  {business.name}
                </Text>
                {business.verified && <VerificationBadge />}
              </View>
              <TouchableOpacity
                onPress={handleSave}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? `Remove ${business.name} from saved` : `Save ${business.name}`}
                accessibilityState={{ selected: isSaved }}
              >
                <Feather
                  name="bookmark"
                  size={16}
                  color={isSaved ? colors.primary : colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.hCategoryRow}>
              <Text style={[styles.hCategory, { color: colors.primary }]}>{business.category}</Text>
              {business.featured && (
                <View style={styles.featuredPill}>
                  <Text style={styles.featuredPillText}>✦ Featured</Text>
                </View>
              )}
            </View>
            <RatingStars rating={business.rating} reviewCount={business.reviewCount} size={11} showLabel />
            {(() => {
              const vibe = getVibeMatch(business.category);
              if (!vibe) return null;
              return (
                <View style={styles.vibePill}>
                  <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                  <Text style={styles.vibeText}>{vibe.label}</Text>
                </View>
              );
            })()}
            {(() => {
              const chips = getComplimentChips(business);
              if (!chips.length) return null;
              return (
                <View style={styles.chipsRow}>
                  {chips.map((c) => (
                    <View key={c.label} style={[styles.chip, { backgroundColor: c.bg, borderColor: c.color + "40" }]}>
                      <Text style={[styles.chipText, { color: c.color }]}>{c.label}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}
            <View style={styles.hBottom}>
              <Text style={[styles.hLocation, { color: colors.mutedForeground }]} numberOfLines={1}>
                {business.city}, {business.state}
                {business.priceRange ? ` · ${business.priceRange}` : ""}
              </Text>
              <ConfidenceScoreBadge score={business.confidenceScore} size="sm" />
            </View>
            {(() => {
              const status = getOpenStatus(business.hours);
              if (!status) return null;
              return (
                <View style={[styles.openBadge, { backgroundColor: status.open ? "#DCFCE7" : "#FEE2E2" }]}>
                  <View style={[styles.openDot, { backgroundColor: status.open ? "#16A34A" : "#DC2626" }]} />
                  <Text style={[styles.openText, { color: status.open ? "#15803D" : "#B91C1C" }]}>{status.label}</Text>
                </View>
              );
            })()}
            <TouchableOpacity
              style={[styles.rateSafetyBtn, { backgroundColor: "#DC262608", borderColor: "#DC262630" }]}
              onPress={handleRateSafety}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel={`Rate safety experience at ${business.name}`}
            >
              <Feather name="shield" size={11} color="#DC2626" />
              <Text style={[styles.rateSafetyText, { color: "#DC2626" }]}>Rate Safety</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        <SafetyExperienceSurvey
          visible={showSafetySurvey}
          businessName={business.name}
          businessCategory={business.category}
          onClose={() => setShowSafetySurvey(false)}
        />
        <BusinessPreviewModal
          business={business}
          visible={showPreview}
          onClose={() => setShowPreview(false)}
          onViewProfile={onPress}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={handleLongPress}
        delayLongPress={400}
        activeOpacity={0.92}
        style={[styles.vCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}
        accessibilityRole="button"
        accessibilityLabel={`${business.name}, ${business.category} in ${business.city}`}
        accessibilityHint="Double tap to view details, hold to preview"
      >
        <View style={styles.vImageWrap}>
          <Image source={img} style={styles.vImage} contentFit="cover" />
          {business.blackOwned ? (
            <View style={styles.vBadgeOverlay}>
              <BlackOwnedBadge size="sm" />
            </View>
          ) : business.ownershipDesignations?.includes("non-minority-owned") ? (
            <View style={styles.vBadgeOverlay}>
              <NonMinorityBadge size="sm" />
            </View>
          ) : null}
        </View>
        <View style={styles.vContent}>
          {warningCount >= 3 && (
            <View style={styles.warningBanner}>
              <Feather name="alert-octagon" size={11} color="#7C2D12" />
              <Text style={styles.warningText}>{warningCount} community reports filed</Text>
            </View>
          )}
          <View style={styles.vTitleRow}>
            <Text style={[styles.vName, { color: colors.foreground }]} numberOfLines={1}>
              {business.name}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? `Remove ${business.name} from saved` : `Save ${business.name}`}
              accessibilityState={{ selected: isSaved }}
            >
              <Feather
                name="bookmark"
                size={18}
                color={isSaved ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.vMeta}>
            <Text style={[styles.vCategory, { color: colors.primary }]}>{business.category}</Text>
            {business.verified && <VerificationBadge />}
            {business.featured && (
              <View style={styles.featuredPill}>
                <Text style={styles.featuredPillText}>✦ Featured</Text>
              </View>
            )}
            <ConfidenceScoreBadge score={business.confidenceScore} size="md" showLabel />
          </View>
          <RatingStars rating={business.rating} reviewCount={business.reviewCount} size={12} showLabel />
          {(() => {
            const vibe = getVibeMatch(business.category);
            if (!vibe) return null;
            return (
              <View style={styles.vibePill}>
                <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                <Text style={styles.vibeText}>{vibe.label}</Text>
              </View>
            );
          })()}
          {(() => {
            const chips = getComplimentChips(business);
            if (!chips.length) return null;
            return (
              <View style={styles.chipsRow}>
                {chips.map((c) => (
                  <View key={c.label} style={[styles.chip, { backgroundColor: c.bg, borderColor: c.color + "40" }]}>
                    <Text style={[styles.chipText, { color: c.color }]}>{c.label}</Text>
                  </View>
                ))}
              </View>
            );
          })()}
          <Text style={[styles.vLocation, { color: colors.mutedForeground }]} numberOfLines={1}>
            {business.address}, {business.city}
            {business.priceRange ? ` · ${business.priceRange}` : ""}
          </Text>
          {(() => {
            const status = getOpenStatus(business.hours);
            if (!status) return null;
            return (
              <View style={[styles.openBadge, { backgroundColor: status.open ? "#DCFCE7" : "#FEE2E2" }]}>
                <View style={[styles.openDot, { backgroundColor: status.open ? "#16A34A" : "#DC2626" }]} />
                <Text style={[styles.openText, { color: status.open ? "#15803D" : "#B91C1C" }]}>{status.label}</Text>
              </View>
            );
          })()}
          <TouchableOpacity
            style={[styles.rateSafetyBtn, { backgroundColor: "#DC262608", borderColor: "#DC262630" }]}
            onPress={handleRateSafety}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={`Rate safety experience at ${business.name}`}
          >
            <Feather name="shield" size={11} color="#DC2626" />
            <Text style={[styles.rateSafetyText, { color: "#DC2626" }]}>Rate Safety Experience</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      <SafetyExperienceSurvey
        visible={showSafetySurvey}
        businessName={business.name}
        businessCategory={business.category}
        onClose={() => setShowSafetySurvey(false)}
      />
      <BusinessPreviewModal
        business={business}
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        onViewProfile={onPress}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hCard: {
    width: 220,
    borderRadius: 14,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  hImage: {
    width: "100%",
    height: 130,
  },
  hBadgeOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  hContent: {
    padding: 12,
    gap: 4,
  },
  hTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  hTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    marginRight: 8,
  },
  hName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    flex: 1,
  },
  hCategory: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  hBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 3,
  },
  openDot: {
    width: 5,
    height: 5,
    borderRadius: 10,
  },
  openText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
  },
  hLocation: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    flex: 1,
  },
  vCard: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  vImageWrap: {
    width: 90,
    height: 100,
    position: "relative",
  },
  vImage: {
    width: 90,
    height: 100,
  },
  vBadgeOverlay: {
    position: "absolute",
    bottom: 6,
    left: 4,
  },
  vContent: {
    flex: 1,
    padding: 12,
    gap: 4,
    justifyContent: "center",
  },
  vTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  vName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  vMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  vCategory: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  vLocation: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  rateSafetyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  rateSafetyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  hCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  vibePill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    alignSelf: "flex-start" as const,
    backgroundColor: "#2D7A4F18",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#2D7A4F30",
    gap: 4,
    marginTop: 2,
  },
  vibeEmoji: { fontSize: 11 },
  vibeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#2D7A4F",
  },
  featuredPill: {
    backgroundColor: "#CA922B18",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#CA922B40",
  },
  featuredPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "#CA922B",
    letterSpacing: 0.2,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 3,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#7C2D1215",
    borderColor: "#7C2D1240",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  warningText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#7C2D12",
  },
});
