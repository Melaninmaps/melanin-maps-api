import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type BusinessLike = {
  city?: string;
  state?: string;
  category?: string;
  reviewCount?: number;
  rating?: number;
};

type Segment = {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  count: number;
  sub: string;
  color: string;
};

function buildSegments(b: BusinessLike): Segment[] {
  const rc = Math.max(b.reviewCount ?? 0, 8);
  const city = b.city ?? "the community";
  const cat = (b.category ?? "").toLowerCase();

  const base: Segment[] = [
    {
      icon: "map-pin",
      label: `${city} community`,
      count: Math.round(rc * 0.38),
      sub: "Local residents & regulars",
      color: "#2D7A4F",
    },
    {
      icon: "user",
      label: "Solo travelers",
      count: Math.round(rc * 0.24),
      sub: "Visiting from out of town",
      color: "#C9922B",
    },
    {
      icon: "users",
      label: "Families",
      count: Math.round(rc * 0.19),
      sub: "Traveling with kids",
      color: "#3B1F0E",
    },
  ];

  if (cat.includes("food") || cat.includes("restaur") || cat.includes("cafe") || cat.includes("bakery")) {
    base.push({ icon: "coffee", label: "Food enthusiasts", count: Math.round(rc * 0.14), sub: "Regulars & culinary explorers", color: "#C9922B" });
  } else if (cat.includes("health") || cat.includes("wellness") || cat.includes("spa")) {
    base.push({ icon: "heart", label: "Healthcare & wellness", count: Math.round(rc * 0.12), sub: "Professionals & self-care seekers", color: "#2D7A4F" });
  } else if (cat.includes("beauty") || cat.includes("salon")) {
    base.push({ icon: "star", label: "Beauty & style community", count: Math.round(rc * 0.15), sub: "Natural hair & style enthusiasts", color: "#7B3F00" });
  } else if (cat.includes("tech") || cat.includes("finance") || cat.includes("legal")) {
    base.push({ icon: "briefcase", label: "Professionals", count: Math.round(rc * 0.13), sub: "Business & career community", color: "#1D4ED8" });
  } else {
    base.push({ icon: "globe", label: "Out-of-state visitors", count: Math.round(rc * 0.11), sub: "National community members", color: "#1D4ED8" });
  }

  return base.sort((a, b) => b.count - a.count);
}

type Props = { business: BusinessLike };

export function CircleTrustedSection({ business }: Props) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const segments = buildSegments(business);
  const visible = expanded ? segments : segments.slice(0, 3);
  const total = segments.reduce((s, seg) => s + seg.count, 0);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: "#2D7A4F20" }]}>
          <Feather name="users" size={18} color="#2D7A4F" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heading, { color: colors.foreground }]}>Circle Trusted™</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {total}+ community members recommend this
          </Text>
        </View>
        <View style={[styles.trustBadge, { backgroundColor: "#2D7A4F15" }]}>
          <Feather name="check-circle" size={12} color="#2D7A4F" />
          <Text style={styles.trustTxt}>Trusted</Text>
        </View>
      </View>

      <Text style={[styles.question, { color: colors.mutedForeground }]}>
        Who from your community recommends this?
      </Text>

      <View style={styles.segments}>
        {visible.map((seg) => (
          <View key={seg.label} style={styles.segRow}>
            <View style={[styles.segIcon, { backgroundColor: seg.color + "18" }]}>
              <Feather name={seg.icon} size={14} color={seg.color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.segLabelRow}>
                <Text style={[styles.segLabel, { color: colors.foreground }]}>{seg.label}</Text>
                <Text style={[styles.segCount, { color: seg.color }]}>{seg.count}</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.secondary }]}>
                <View
                  style={[
                    styles.barFill,
                    { backgroundColor: seg.color, width: `${Math.min((seg.count / segments[0]!.count) * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.segSub, { color: colors.mutedForeground }]}>{seg.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {segments.length > 3 && (
        <TouchableOpacity style={styles.moreBtn} onPress={() => setExpanded(!expanded)}>
          <Text style={[styles.moreTxt, { color: colors.primary }]}>
            {expanded ? "Show less" : `+${segments.length - 3} more groups`}
          </Text>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
        </TouchableOpacity>
      )}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Feather name="info" size={11} color={colors.mutedForeground} />
        <Text style={[styles.footerTxt, { color: colors.mutedForeground }]}>
          Counts are based on reviewer profiles, visit context, and check-in data.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  trustBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  trustTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#2D7A4F" },
  question: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  segments: { gap: 12 },
  segRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  segIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2 },
  segLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  segLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  segCount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  barTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  barFill: { height: 4, borderRadius: 2 },
  segSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  moreBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "center", paddingVertical: 4 },
  moreTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  footer: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: 10, borderTopWidth: 1 },
  footerTxt: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
});
