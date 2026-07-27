import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function CategoryPill({ label, selected, onPress }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: selected ? colors.primaryForeground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
