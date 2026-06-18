import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  rating: number;
  reviewCount?: number;
  size?: number;
  showCount?: boolean;
}

export function RatingStars({ rating, reviewCount, size = 12, showCount = true }: Props) {
  const colors = useColors();
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < fullStars;
        const half = !filled && i === fullStars && hasHalf;
        return (
          <Feather
            key={i}
            name={filled || half ? "star" : "star"}
            size={size}
            color={filled || half ? colors.accent : colors.border}
          />
        );
      })}
      {showCount && reviewCount !== undefined && (
        <Text style={[styles.count, { color: colors.mutedForeground, fontSize: size }]}>
          {" "}
          {rating.toFixed(1)} ({reviewCount})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  count: {
    fontFamily: "Inter_400Regular",
  },
});
