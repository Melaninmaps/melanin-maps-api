import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
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
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  seeAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
