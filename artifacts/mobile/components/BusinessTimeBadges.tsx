import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  getLocationAgeBadge,
  getBusinessAgeBadge,
  getEarnedCommunityBadges,
  OPTIONAL_TRUST_BADGES,
  type BadgeInfo,
} from "@/utils/businessBadges";

interface Props {
  currentLocationSince?: string | null;
  businessFoundedDate?: string | null;
  trustBadges?: string[] | null;
  safetyRating?: number | string | null;
  wouldReturnAlone?: number | null;
  recommendationRate?: number | null;
  rating?: number | string | null;
  reviewCount?: number | null;
}

function BadgePill({ badge, onPress }: { badge: BadgeInfo; onPress: (b: BadgeInfo) => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.pill, { backgroundColor: badge.color + "18", borderColor: badge.color + "50" }]}
      onPress={() => onPress(badge)}
      activeOpacity={0.75}
    >
      <Text style={styles.pillEmoji}>{badge.emoji}</Text>
      <Text style={[styles.pillLabel, { color: badge.color }]}>{badge.label}</Text>
    </TouchableOpacity>
  );
}

export function BusinessTimeBadges({
  currentLocationSince,
  businessFoundedDate,
  trustBadges,
  safetyRating,
  wouldReturnAlone,
  recommendationRate,
  rating,
  reviewCount,
}: Props) {
  const colors = useColors();
  const [tooltip, setTooltip] = useState<BadgeInfo | null>(null);

  const locationBadge = getLocationAgeBadge(currentLocationSince);
  const ageBadge = getBusinessAgeBadge(businessFoundedDate);
  const optionalBadges = (trustBadges ?? [])
    .map((id) => OPTIONAL_TRUST_BADGES[id])
    .filter(Boolean) as BadgeInfo[];
  const earnedBadges = getEarnedCommunityBadges({ safetyRating, wouldReturnAlone, recommendationRate, rating, reviewCount });

  const allBadges = [
    ...(locationBadge ? [locationBadge] : []),
    ...(ageBadge ? [ageBadge] : []),
    ...optionalBadges,
    ...earnedBadges,
  ];

  if (allBadges.length === 0) return null;

  return (
    <>
      <View style={styles.row}>
        {allBadges.map((badge) => (
          <BadgePill key={badge.id} badge={badge} onPress={setTooltip} />
        ))}
      </View>

      <Modal visible={!!tooltip} transparent animationType="fade" onRequestClose={() => setTooltip(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setTooltip(null)}>
          <View style={[styles.tooltipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {tooltip && (
              <>
                <Text style={styles.tooltipEmoji}>{tooltip.emoji}</Text>
                <Text style={[styles.tooltipTitle, { color: colors.foreground }]}>{tooltip.label}</Text>
                <Text style={[styles.tooltipDesc, { color: colors.mutedForeground }]}>{tooltip.description}</Text>
                <View style={[styles.tooltipDivider, { backgroundColor: colors.border }]} />
                <View style={styles.tooltipHow}>
                  <Text style={[styles.tooltipHowLabel, { color: colors.mutedForeground }]}>About this badge</Text>
                  <Text style={[styles.tooltipHowText, { color: colors.foreground }]}>{tooltip.howEarned}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.tooltipClose, { backgroundColor: tooltip.color + "18", borderColor: tooltip.color + "40" }]}
                  onPress={() => setTooltip(null)}
                >
                  <Text style={[styles.tooltipCloseText, { color: tooltip.color }]}>Got it</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillEmoji: {
    fontSize: 13,
  },
  pillLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  tooltipCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 8,
  },
  tooltipEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  tooltipTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    textAlign: "center",
  },
  tooltipDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  tooltipDivider: {
    height: 1,
    width: "100%",
    marginVertical: 8,
  },
  tooltipHow: {
    width: "100%",
    gap: 4,
  },
  tooltipHowLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tooltipHowText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  tooltipClose: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tooltipCloseText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
});
