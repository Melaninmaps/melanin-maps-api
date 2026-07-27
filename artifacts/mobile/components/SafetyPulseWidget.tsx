import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SurveyData {
  id: string;
  neighborhoodName: string;
  overallSafety: number;
  city: string;
  state: string;
  createdAt: string;
}

interface PulseStats {
  avgSafety: number;
  checkInCount: number;
  topCity: string;
  recentNeighborhoods: string[];
}

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

function safetyLabel(score: number): { label: string; color: string } {
  if (score >= 4.5) return { label: "Very Safe", color: "#2D7A4F" };
  if (score >= 3.5) return { label: "Generally Safe", color: "#CA922B" };
  if (score >= 2.5) return { label: "Use Caution", color: "#F59E0B" };
  return { label: "Extra Alert", color: "#DC2626" };
}

export function SafetyPulseWidget() {
  const colors = useColors();
  const [stats, setStats] = useState<PulseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      const apiBase = getApiBase();
      if (!apiBase) { setIsLoading(false); return; }
      try {
        const res = await fetch(`${apiBase}/api/surveys?limit=50`);
        if (res.ok) {
          const data = await res.json() as { surveys: SurveyData[] };
          const surveys = data.surveys ?? [];
          if (surveys.length === 0) { setIsLoading(false); return; }
          const avgSafety = surveys.reduce((a, s) => a + s.overallSafety, 0) / surveys.length;
          const cityMap: Record<string, number> = {};
          surveys.forEach((s) => { cityMap[s.city] = (cityMap[s.city] ?? 0) + 1; });
          const topCity = Object.entries(cityMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
          const hoods = [...new Set(surveys.map((s) => s.neighborhoodName))].slice(0, 3);
          setStats({ avgSafety, checkInCount: surveys.length, topCity, recentNeighborhoods: hoods });
        }
      } catch {}
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );

  if (!stats) return null;

  const { label, color } = safetyLabel(stats.avgSafety);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setExpanded((e) => !e)}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: color + "18" }]}>
          <Feather name="activity" size={16} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Community Safety Pulse</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {stats.checkInCount} reports · {stats.topCity}
          </Text>
        </View>
        <View style={[styles.scorePill, { backgroundColor: color + "18" }]}>
          <Text style={[styles.scoreText, { color }]}>{stats.avgSafety.toFixed(1)}</Text>
          <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </View>
      {expanded && stats.recentNeighborhoods.length > 0 && (
        <View style={[styles.expanded, { borderTopColor: colors.border }]}>
          <Text style={[styles.expandTitle, { color: colors.mutedForeground }]}>Recently reported areas</Text>
          <View style={styles.hoods}>
            {stats.recentNeighborhoods.map((hood) => (
              <View key={hood} style={[styles.hoodPill, { backgroundColor: colors.secondary }]}>
                <Feather name="map-pin" size={10} color={colors.primary} />
                <Text style={[styles.hoodText, { color: colors.secondaryForeground }]}>{hood}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.expandNote, { color: colors.mutedForeground }]}>
            Powered by community safety reports. Tap "Report Safety" on the home tab to contribute.
          </Text>
        </View>
      )}
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
  scorePill: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 4 },
  scoreText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  scoreLabel: { fontFamily: "Inter_500Medium", fontSize: 9 },
  expanded: { borderTopWidth: 1, paddingTop: 12, marginTop: 12, gap: 8 },
  expandTitle: { fontFamily: "Inter_500Medium", fontSize: 12 },
  hoods: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  hoodPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  hoodText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  expandNote: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15, marginTop: 4 },
});
