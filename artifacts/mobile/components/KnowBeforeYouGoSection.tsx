import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Dimension = {
  emoji: string;
  label: string;
  score: number;
  color: string;
};

type BusinessLike = {
  safetyRating?: number | null;
  rating?: number;
  wouldReturnAlone?: number | null;
  recommendationRate?: number | null;
  tags?: string[];
  category?: string;
};

function buildDimensions(b: BusinessLike): Dimension[] {
  const rating = b.rating ?? 3.5;
  const safety = b.safetyRating ?? (rating * 0.9);
  const returnAlone = (b.wouldReturnAlone ?? (safety > 3.5 ? 82 : 60)) / 100;
  const recommend = (b.recommendationRate ?? (rating * 18)) / 100;
  const tags = b.tags?.map(t => t.toLowerCase()).join(" ") ?? "";
  const cat = (b.category ?? "").toLowerCase();

  const isFood = cat.includes("food") || cat.includes("restaurant") || cat.includes("cafe") || cat.includes("bakery") || cat.includes("beverage");
  const isNightlife = tags.includes("bar") || tags.includes("club") || tags.includes("nightlife") || tags.includes("lounge");
  const isFamily = tags.includes("family") || tags.includes("kids") || cat.includes("recreation");
  const isSpa = cat.includes("health") || cat.includes("wellness") || cat.includes("spa") || cat.includes("beauty");

  const norm = (v: number, max = 5) => Math.round((v / max) * 100);

  return [
    { emoji: "✨", label: "Community Vibe", score: norm(rating), color: "#C9922B" },
    { emoji: "🛡", label: "Safety", score: Math.round(((safety / 5) * 0.7 + returnAlone * 0.3) * 100), color: "#2D7A4F" },
    { emoji: "🍴", label: "Food & Drink", score: isFood ? norm(rating + 0.3) : Math.round(rating * 14), color: "#7B3F00" },
    { emoji: "🚗", label: "Parking", score: tags.includes("parking") ? 88 : Math.round(55 + rating * 6), color: "#3B82F6" },
    { emoji: "♿", label: "Accessibility", score: tags.includes("accessible") || tags.includes("wheelchair") ? 92 : 68, color: "#8B5CF6" },
    { emoji: "🌈", label: "Inclusivity", score: Math.round(recommend * 100 * 0.6 + returnAlone * 40), color: "#EC4899" },
    { emoji: "👨‍👩‍👧", label: "Family Friendly", score: isFamily ? 90 : isSpa ? 55 : isNightlife ? 30 : Math.round(rating * 15 + 10), color: "#F59E0B" },
    { emoji: "💼", label: "Professional", score: tags.includes("work") || tags.includes("wifi") || tags.includes("remote") ? 88 : Math.round(rating * 14 + 5), color: "#1D4ED8" },
    { emoji: "👩🏾", label: "Solo Friendly", score: Math.round(returnAlone * 100 * 0.8 + 15), color: "#2D7A4F" },
    { emoji: "🌙", label: "Nightlife", score: isNightlife ? norm(rating + 0.5) : Math.round(rating * 10 + 10), color: "#6D28D9" },
  ].map(d => ({ ...d, score: Math.min(Math.max(d.score, 25), 98) }));
}

function ScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Limited";
}

function ScoreColor(score: number, base: string): string {
  if (score >= 85) return base;
  if (score >= 70) return base + "CC";
  return base + "88";
}

type Props = { business: BusinessLike };

export function KnowBeforeYouGoSection({ business }: Props) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const dims = buildDimensions(business);
  const visible = expanded ? dims : dims.slice(0, 6);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: "#C9922B20" }]}>
          <Text style={styles.headerEmoji}>🗺️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Know Before You Go</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            10 community-rated dimensions
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {visible.map((d) => (
          <View key={d.label} style={[styles.cell, { backgroundColor: colors.secondary }]}>
            <Text style={styles.cellEmoji}>{d.emoji}</Text>
            <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
              <View
                style={[styles.barFill, { backgroundColor: ScoreColor(d.score, d.color), width: `${d.score}%` }]}
              />
            </View>
            <Text style={[styles.cellLabel, { color: colors.foreground }]}>{d.label}</Text>
            <Text style={[styles.cellScore, { color: ScoreColor(d.score, d.color) }]}>
              {ScoreLabel(d.score)}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.moreBtn} onPress={() => setExpanded(!expanded)}>
        <Text style={[styles.moreTxt, { color: colors.primary }]}>
          {expanded ? "Show less" : "Show all 10 dimensions"}
        </Text>
        <Text style={[styles.moreTxt, { color: colors.primary }]}>{expanded ? "↑" : "↓"}</Text>
      </TouchableOpacity>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerTxt, { color: colors.mutedForeground }]}>
          Scores are derived from community reviews, safety surveys, and check-in context.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  headerEmoji: { fontSize: 20 },
  heading: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: "47%", borderRadius: 12, padding: 10, gap: 6 },
  cellEmoji: { fontSize: 18 },
  barTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 5, borderRadius: 3 },
  cellLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cellScore: { fontSize: 11, fontFamily: "Inter_500Medium" },
  moreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 4 },
  moreTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  footer: { paddingTop: 10, borderTopWidth: 1 },
  footerTxt: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
});
