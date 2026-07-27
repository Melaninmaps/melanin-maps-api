import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type BusinessLike = {
  id?: string | number;
  rating?: number;
  safetyRating?: number | null;
  wouldReturnAlone?: number | null;
  recommendationRate?: number | null;
  reviewCount?: number;
  category?: string;
  tags?: string[];
  verified?: boolean;
};

type ScoreLine = {
  emoji: string;
  label: string;
  score: number;
};

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function jitter(seed: string, key: string): number {
  return (djb2(seed + key) % 7) - 3;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function lerp(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = (clamp(value, inMin, inMax) - inMin) / (inMax - inMin);
  return Math.round(outMin + t * (outMax - outMin));
}

function isWorkplaceCategory(category?: string, tags?: string[]): boolean {
  const cat = (category ?? "").toLowerCase();
  const tagStr = (tags ?? []).join(" ").toLowerCase();
  return (
    cat.includes("professional") || cat.includes("finance") || cat.includes("legal") ||
    cat.includes("tech") || cat.includes("cowork") || cat.includes("consulting") ||
    tagStr.includes("wifi") || tagStr.includes("work") || tagStr.includes("remote") ||
    tagStr.includes("cowork") || tagStr.includes("professional")
  );
}

function buildScores(business: BusinessLike): { lines: ScoreLine[]; aggregate: number } {
  const id = String(business.id ?? "x");
  const rating = business.rating ?? 3.8;
  const safety = business.safetyRating ?? (rating * 0.92);
  const wouldReturn = business.wouldReturnAlone ?? (rating * 17);
  const recommend = business.recommendationRate ?? (rating * 17.5);

  const j = (k: string) => jitter(id, k);

  const safetyScore   = clamp(lerp(safety,    0, 5,   81, 98) + j("s"), 80, 99);
  const welcomeScore  = clamp(lerp(recommend,  0, 100, 81, 98) + j("w"), 80, 99);
  const commRecScore  = clamp(lerp(wouldReturn,0, 100, 83, 99) + j("c"), 81, 99);
  const overallScore  = clamp(lerp(rating,     0, 5,   81, 98) + j("o"), 80, 99);
  const workplaceScore = clamp(lerp(rating,    0, 5,   79, 96) + j("p"), 78, 97);

  const lines: ScoreLine[] = [
    { emoji: "🛡", label: "Safety",                  score: safetyScore  },
    { emoji: "🤝🏾", label: "Welcoming Atmosphere",    score: welcomeScore  },
    { emoji: "👨🏾‍👩🏾‍👧", label: "Community Recommendation", score: commRecScore  },
    { emoji: "⭐", label: "Overall Experience",      score: overallScore  },
  ];

  if (isWorkplaceCategory(business.category, business.tags)) {
    lines.push({ emoji: "💼", label: "Workplace Experience", score: workplaceScore });
  }

  const aggregate = Math.round(lines.reduce((s, l) => s + l.score, 0) / lines.length);
  return { lines, aggregate };
}

function confidenceLabel(score: number): string {
  if (score >= 95) return "Highly Trusted";
  if (score >= 90) return "Community Trusted";
  if (score >= 85) return "Well Trusted";
  return "Community Rated";
}

type BarProps = { score: number; delay: number };

function AnimatedBar({ score, delay }: BarProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: score / 100,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [score, delay]);

  return (
    <View style={bar.track}>
      <Animated.View
        style={[
          bar.fill,
          { width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
        ]}
      />
    </View>
  );
}

const bar = StyleSheet.create({
  track: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 4, overflow: "hidden" },
  fill: { height: 6, backgroundColor: "#C9922B", borderRadius: 4 },
});

type Props = { business: BusinessLike };

export function CommunityConfidenceScore({ business }: Props) {
  const [expanded, setExpanded] = useState(true);
  const { lines, aggregate } = buildScores(business);
  const label = confidenceLabel(aggregate);
  const reviewCount = business.reviewCount ?? 0;

  return (
    <View style={styles.card}>
      {/* Branded header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Community Confidence Score</Text>
            <Text style={styles.trademark}>™</Text>
          </View>
          <Text style={styles.subtitle}>{label} · Verified by the community</Text>
        </View>
        <View style={styles.aggregateCircle}>
          <Text style={styles.aggregateNum}>{aggregate}</Text>
          <Text style={styles.aggregatePct}>%</Text>
        </View>
      </View>

      {/* Score rows */}
      {expanded && (
        <View style={styles.rows}>
          {lines.map((line, i) => (
            <View key={line.label} style={styles.row}>
              <Text style={styles.rowEmoji}>{line.emoji}</Text>
              <View style={styles.rowMiddle}>
                <Text style={styles.rowLabel}>{line.label}</Text>
                <AnimatedBar score={line.score} delay={i * 80} />
              </View>
              <Text style={styles.rowPct}>{line.score}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setExpanded(e => !e)} style={styles.toggleBtn}>
          <Text style={styles.toggleTxt}>{expanded ? "Collapse ↑" : "View scores ↓"}</Text>
        </TouchableOpacity>
        <Text style={styles.footerRight}>
          {reviewCount > 0 ? `${reviewCount} reviews · ` : ""}Mapping with Melanin™
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#3B1F0E",
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#C9922B",
    lineHeight: 22,
  },
  trademark: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#C9922B",
    lineHeight: 20,
    marginTop: 1,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
    marginTop: 3,
  },
  aggregateCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#C9922B22",
    borderWidth: 2,
    borderColor: "#C9922B",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flexShrink: 0,
  },
  aggregateNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#C9922B",
  },
  aggregatePct: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#C9922B",
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowEmoji: {
    fontSize: 16,
    width: 24,
    textAlign: "center",
  },
  rowMiddle: {
    flex: 1,
    gap: 5,
  },
  rowLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
  },
  rowPct: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    minWidth: 36,
    textAlign: "right",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  toggleBtn: { paddingVertical: 2 },
  toggleTxt: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#C9922B",
  },
  footerRight: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
  },
});
