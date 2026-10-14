import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

/**
 * Individual survey responses are intentionally never fetched or displayed on a
 * member device. Community Intelligence is available only through the protected
 * city-level aggregate screen after the configured minimum of explicitly
 * consented contributors has been met.
 */
export function SafetyPulseWidget() {
  const colors = useColors();
  const router = useRouter();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Open city-level Community Intelligence"
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push("/report-intelligence")}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: "#CA922B18" }]}>
          <Feather name="bar-chart-2" size={16} color="#CA922B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Community Intelligence</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>City-level, delayed aggregates only</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>No individual reports, neighborhoods, member locations, or timestamps are shown. A city signal appears only after enough explicitly consented responses.</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 14,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  heading: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  note: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 10 },
});
