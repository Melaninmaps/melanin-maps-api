import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export const COMMUNITY_RATINGS = [
  { level: 1, label: "Love It", display: "🤎", color: "#C9922B" },
  { level: 2, label: "Good Find", display: "🤎🤎", color: "#C9922B" },
  { level: 3, label: "Worth Visiting", display: "🤎🤎🤎", color: "#C9922B" },
  { level: 4, label: "Community Favorite", display: "🤎🤎🤎🤎", color: "#C9922B" },
  { level: 5, label: "Put Your People On", display: "👑", color: "#CA922B" },
] as const;

export function getCommunityRating(rating: number) {
  const level = Math.min(5, Math.max(1, Math.round(rating)));
  return COMMUNITY_RATINGS[level - 1]!;
}

interface Props {
  rating: number;
  reviewCount?: number;
  size?: number;
  showCount?: boolean;
  showLabel?: boolean;
}

export function RatingStars({ rating, reviewCount, size = 12, showCount = true, showLabel = false }: Props) {
  const colors = useColors();
  if (!rating || rating <= 0) return null;
  const info = getCommunityRating(rating);
  const isPutYourPeopleOn = Math.round(rating) === 5;

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: size + 2, lineHeight: size + 8 }}>{info.display}</Text>
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: isPutYourPeopleOn ? colors.primary : colors.foreground,
              fontSize: size,
              fontFamily: isPutYourPeopleOn ? "Inter_700Bold" : "Inter_500Medium",
            },
          ]}
        >
          {info.label}
        </Text>
      )}
      {showCount && reviewCount !== undefined && (
        <Text style={[styles.count, { color: colors.mutedForeground, fontSize: size }]}>
          {" "}{rating.toFixed(1)} ({reviewCount})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  label: {
    fontFamily: "Inter_500Medium",
  },
  count: {
    fontFamily: "Inter_400Regular",
  },
});
