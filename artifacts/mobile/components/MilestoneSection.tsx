import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Milestone {
  id: string;
  icon: "star" | "shield" | "map-pin" | "heart" | "award" | "users" | "zap" | "check-circle";
  title: string;
  description: string;
  color: string;
  earned: boolean;
  progress?: { current: number; total: number };
}

interface Props {
  reviewCount: number;
  savedCount: number;
  pointsTotal: number;
  checkInCount: number;
}

function buildMilestones(reviewCount: number, savedCount: number, pointsTotal: number, checkInCount: number): Milestone[] {
  return [
    {
      id: "first_review",
      icon: "star",
      title: "First Review",
      description: "Left your first business review",
      color: "#CA922B",
      earned: reviewCount >= 1,
      progress: { current: Math.min(reviewCount, 1), total: 1 },
    },
    {
      id: "review_5",
      icon: "star",
      title: "Community Voice",
      description: "Written 5 reviews for minority-owned businesses",
      color: "#CA922B",
      earned: reviewCount >= 5,
      progress: { current: Math.min(reviewCount, 5), total: 5 },
    },
    {
      id: "first_checkin",
      icon: "map-pin",
      title: "Explorer",
      description: "Checked into your first business",
      color: "#2D7A4F",
      earned: checkInCount >= 1,
      progress: { current: Math.min(checkInCount, 1), total: 1 },
    },
    {
      id: "checkin_10",
      icon: "map-pin",
      title: "Frequent Visitor",
      description: "Checked into 10 minority-owned businesses",
      color: "#2D7A4F",
      earned: checkInCount >= 10,
      progress: { current: Math.min(checkInCount, 10), total: 10 },
    },
    {
      id: "save_5",
      icon: "heart",
      title: "Curator",
      description: "Saved 5 of your favorite spots",
      color: "#7B2D8B",
      earned: savedCount >= 5,
      progress: { current: Math.min(savedCount, 5), total: 5 },
    },
    {
      id: "points_100",
      icon: "zap",
      title: "Point Earner",
      description: "Earned 100 Kinfolk Points",
      color: "#1D4ED8",
      earned: pointsTotal >= 100,
      progress: { current: Math.min(pointsTotal, 100), total: 100 },
    },
    {
      id: "points_500",
      icon: "award",
      title: "Community Champion",
      description: "Earned 500 Kinfolk Points",
      color: "#1D4ED8",
      earned: pointsTotal >= 500,
      progress: { current: Math.min(pointsTotal, 500), total: 500 },
    },
    {
      id: "review_10",
      icon: "users",
      title: "Trusted Guide",
      description: "Written 10 reviews — a true community resource",
      color: "#CA922B",
      earned: reviewCount >= 10,
      progress: { current: Math.min(reviewCount, 10), total: 10 },
    },
  ];
}

export function MilestoneSection({ reviewCount, savedCount, pointsTotal, checkInCount }: Props) {
  const colors = useColors();
  const milestones = buildMilestones(reviewCount, savedCount, pointsTotal, checkInCount);
  const earnedCount = milestones.filter((m) => m.earned).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="award" size={18} color="#CA922B" />
        <Text style={[styles.title, { color: colors.foreground }]}>Achievements</Text>
        <View style={[styles.countPill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{earnedCount}/{milestones.length}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {milestones.map((m) => (
          <View
            key={m.id}
            style={[
              styles.card,
              {
                backgroundColor: m.earned ? m.color + "14" : colors.card,
                borderColor: m.earned ? m.color + "40" : colors.border,
                shadowColor: colors.foreground,
                opacity: m.earned ? 1 : 0.55,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: m.earned ? m.color + "22" : colors.muted }]}>
              <Feather name={m.icon} size={22} color={m.earned ? m.color : colors.mutedForeground} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{m.title}</Text>
            <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {m.description}
            </Text>
            {m.progress && !m.earned && (
              <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: m.color,
                      width: `${Math.round((m.progress.current / m.progress.total) * 100)}%` as `${number}%`,
                    },
                  ]}
                />
              </View>
            )}
            {m.earned && (
              <View style={styles.earnedRow}>
                <Feather name="check-circle" size={12} color={m.color} />
                <Text style={[styles.earnedText, { color: m.color }]}>Earned</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 17, flex: 1 },
  countPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  countText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  scroll: { gap: 10, paddingRight: 4 },
  card: {
    width: 150, borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 6,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  cardDesc: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15 },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden", marginTop: 4 },
  progressFill: { height: "100%", borderRadius: 2 },
  earnedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  earnedText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});
