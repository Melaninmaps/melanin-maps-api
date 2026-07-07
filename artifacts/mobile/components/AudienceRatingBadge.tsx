import React from "react";
import { View, Text, StyleSheet } from "react-native";

export type AudienceRating = "everyone" | "teen" | "young_adult" | "adult";

export const RATING_META: Record<AudienceRating, {
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  emoji: string;
  minAge: number;
  description: string;
}> = {
  everyone: {
    label: "Everyone",
    shortLabel: "Everyone",
    color: "#16A34A",
    bg: "#DCFCE7",
    emoji: "🟢",
    minAge: 0,
    description: "Suitable for all ages",
  },
  teen: {
    label: "Teen (13+)",
    shortLabel: "13+",
    color: "#2563EB",
    bg: "#DBEAFE",
    emoji: "🔵",
    minAge: 13,
    description: "May involve mature discussions",
  },
  young_adult: {
    label: "Young Adult (16+)",
    shortLabel: "16+",
    color: "#EA580C",
    bg: "#FFEDD5",
    emoji: "🟠",
    minAge: 16,
    description: "More mature life topics",
  },
  adult: {
    label: "Adult (18+)",
    shortLabel: "18+",
    color: "#DC2626",
    bg: "#FEE2E2",
    emoji: "🔴",
    minAge: 18,
    description: "Discussions intended for adults",
  },
};

interface Props {
  rating: AudienceRating | string;
  reason?: string | null;
  size?: "sm" | "md";
  showReason?: boolean;
}

export default function AudienceRatingBadge({ rating, reason, size = "sm", showReason = false }: Props) {
  const meta = RATING_META[(rating as AudienceRating)] ?? RATING_META.everyone;
  const isSmall = size === "sm";

  return (
    <View>
      <View style={[styles.badge, { backgroundColor: meta.bg, borderColor: meta.color + "40" }, isSmall && styles.badgeSm]}>
        <Text style={[styles.emoji, isSmall && styles.emojiSm]}>{meta.emoji}</Text>
        <Text style={[styles.label, { color: meta.color }, isSmall && styles.labelSm]}>
          {isSmall ? meta.shortLabel : meta.label}
        </Text>
      </View>
      {showReason && reason ? (
        <Text style={[styles.reason, { color: meta.color }]}>{reason}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emoji: {
    fontSize: 12,
  },
  emojiSm: {
    fontSize: 10,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  labelSm: {
    fontSize: 10,
  },
  reason: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 3,
    fontStyle: "italic",
  },
});
