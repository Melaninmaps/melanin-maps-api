import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Business } from "@/constants/types";
import { BlackOwnedBadge } from "./BlackOwnedBadge";
import { ConfidenceScoreBadge } from "./ConfidenceScoreBadge";
import { RatingStars } from "./RatingStars";
import { VerificationBadge } from "./VerificationBadge";
import { SafetyExperienceSurvey } from "./SafetyExperienceSurvey";

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
}

export function BusinessCard({ business, onPress, isSaved, onToggleSave, horizontal = false }: Props) {
  const colors = useColors();
  const img = CATEGORY_IMAGES[business.category] ?? CATEGORY_IMAGES["Food"];
  const [showSafetySurvey, setShowSafetySurvey] = useState(false);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSave();
  };

  const handleRateSafety = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSafetySurvey(true);
  };

  if (horizontal) {
    return (
      <>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.92}
          style={[styles.hCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}
          accessibilityRole="button"
          accessibilityLabel={`${business.name}, ${business.category} in ${business.city}`}
          accessibilityHint="Double tap to view business details"
        >
          <Image source={img} style={styles.hImage} contentFit="cover" />
          {business.blackOwned && (
            <View style={styles.hBadgeOverlay}>
              <BlackOwnedBadge size="sm" />
            </View>
          )}
          <View style={styles.hContent}>
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
            <Text style={[styles.hCategory, { color: colors.primary }]}>{business.category}</Text>
            <RatingStars rating={business.rating} reviewCount={business.reviewCount} size={11} />
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
          onClose={() => setShowSafetySurvey(false)}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.92}
        style={[styles.vCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}
        accessibilityRole="button"
        accessibilityLabel={`${business.name}, ${business.category} in ${business.city}`}
        accessibilityHint="Double tap to view business details"
      >
        <View style={styles.vImageWrap}>
          <Image source={img} style={styles.vImage} contentFit="cover" />
          {business.blackOwned && (
            <View style={styles.vBadgeOverlay}>
              <BlackOwnedBadge size="sm" />
            </View>
          )}
        </View>
        <View style={styles.vContent}>
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
            <ConfidenceScoreBadge score={business.confidenceScore} size="md" showLabel />
          </View>
          <RatingStars rating={business.rating} reviewCount={business.reviewCount} size={12} />
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
        onClose={() => setShowSafetySurvey(false)}
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
});
