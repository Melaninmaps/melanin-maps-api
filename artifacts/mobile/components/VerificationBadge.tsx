import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  size?: "sm" | "md";
}

export function VerificationBadge({ size = "sm" }: Props) {
  const colors = useColors();
  const iconSize = size === "sm" ? 10 : 12;
  const fontSize = size === "sm" ? 10 : 11;

  return (
    <View style={[styles.badge, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
      <Feather name="check-circle" size={iconSize} color={colors.success} />
      <Text style={[styles.text, { color: colors.success, fontSize }]}>Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
  },
});
