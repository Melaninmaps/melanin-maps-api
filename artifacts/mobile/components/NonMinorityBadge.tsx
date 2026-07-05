import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  size?: "sm" | "md";
}

export function NonMinorityBadge({ size = "sm" }: Props) {
  if (size === "md") {
    return (
      <View style={styles.badgeMd}>
        <Text style={styles.iconMd}>🏢</Text>
        <Text style={styles.labelMd}>Non-Minority Owned</Text>
      </View>
    );
  }
  return (
    <View style={styles.badgeSm}>
      <Text style={styles.iconSm}>🏢</Text>
      <Text style={styles.labelSm}>Non-Minority</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeMd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1C1C1E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3A3A3C",
  },
  iconMd: {
    fontSize: 13,
  },
  labelMd: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#AEAEB2",
  },
  badgeSm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1C1C1E",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3A3A3C",
  },
  iconSm: {
    fontSize: 10,
  },
  labelSm: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#AEAEB2",
  },
});
