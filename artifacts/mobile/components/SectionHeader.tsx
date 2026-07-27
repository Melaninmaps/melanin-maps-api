import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, subtitle, onSeeAll }: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        )}
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 19,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 1,
    opacity: 0.6,
  },
  seeAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
