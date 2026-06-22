import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  size?: "sm" | "md";
}

export function BlackOwnedBadge({ size = "sm" }: Props) {
  if (size === "md") {
    return (
      <View style={styles.badgeMd}>
        <Text style={styles.fistMd}>✊🏾</Text>
        <Text style={styles.labelMd}>Black-Owned</Text>
      </View>
    );
  }
  return (
    <View style={styles.badgeSm}>
      <Text style={styles.fistSm}>✊🏾</Text>
      <Text style={styles.labelSm}>Black-Owned</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeMd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#2D1A0E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  fistMd: {
    fontSize: 13,
  },
  labelMd: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#D4873A",
  },
  badgeSm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2D1A0E",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fistSm: {
    fontSize: 10,
  },
  labelSm: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#D4873A",
  },
});
