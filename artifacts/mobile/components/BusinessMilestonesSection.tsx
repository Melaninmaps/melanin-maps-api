import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type BusinessLike = {
  reviewCount?: number;
  rating?: number;
  verified?: boolean;
  foundingBusiness?: boolean;
  blackOwned?: boolean;
  tags?: string[];
  category?: string;
  businessFoundedDate?: string;
};

type Milestone = {
  emoji: string;
  label: string;
  bg: string;
  text: string;
};

function computeMilestones(b: BusinessLike): Milestone[] {
  const out: Milestone[] = [];
  const rc = b.reviewCount ?? 0;
  const rt = b.rating ?? 0;

  if (b.foundingBusiness) {
    out.push({ emoji: "🥇", label: "Founding Business", bg: "#C9922B20", text: "#C9922B" });
  }
  if (b.blackOwned && b.verified) {
    out.push({ emoji: "💜", label: "Verified Black-Owned", bg: "#7B3F0020", text: "#7B3F00" });
  }
  if (rt >= 4.5 && rc >= 20) {
    out.push({ emoji: "⭐", label: "Community Favorite", bg: "#C9922B20", text: "#C9922B" });
  }
  if (b.verified) {
    out.push({ emoji: "🤝🏾", label: "Responsive Owner", bg: "#2D7A4F20", text: "#2D7A4F" });
  }
  if (rc >= 100) {
    out.push({ emoji: "🏛", label: "Community Landmark", bg: "#3B1F0E20", text: "#3B1F0E" });
  }
  if (rc >= 150) {
    out.push({ emoji: "🎉", label: "1,000+ Served", bg: "#2D7A4F20", text: "#2D7A4F" });
  }
  const travelKw = ["destination", "tourist", "visitor", "boutique hotel", "bed &", "hostel"];
  if (b.tags?.some(t => travelKw.some(k => t.toLowerCase().includes(k))) || b.category?.toLowerCase().includes("hotel")) {
    out.push({ emoji: "🌍", label: "Traveler Favorite", bg: "#1D4ED820", text: "#1D4ED8" });
  }
  if (b.businessFoundedDate) {
    const yr = new Date(b.businessFoundedDate).getFullYear();
    const age = new Date().getFullYear() - yr;
    if (age >= 10) out.push({ emoji: "👑", label: "Legacy Business", bg: "#7B3F0020", text: "#7B3F00" });
  }
  return out;
}

type Props = { business: BusinessLike };

export function BusinessMilestonesSection({ business }: Props) {
  const colors = useColors();
  const milestones = computeMilestones(business);
  if (milestones.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.foreground }]}>Business Milestones</Text>
      <ScrollView
        keyboardDismissMode="on-drag"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {milestones.map((m) => (
          <View key={m.label} style={[styles.badge, { backgroundColor: m.bg }]}>
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text style={[styles.label, { color: m.text }]}>{m.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  title: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 10 },
  row: { gap: 8, paddingRight: 4 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emoji: { fontSize: 15 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
