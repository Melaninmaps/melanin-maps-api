import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

export type TrustLevel = 1 | 2 | 3 | 4;

interface TrustConfig {
  label: string;
  badge: string;
  shortLabel: string;
  color: string;
  bg: string;
}

const TRUST_CONFIG: Record<TrustLevel, TrustConfig> = {
  1: {
    label: "Community Member",
    shortLabel: "Member",
    badge: "○",
    color: "#6B7280",
    bg: "#F3F4F6",
  },
  2: {
    label: "Community Verified",
    shortLabel: "Verified",
    badge: "✔",
    color: "#16A34A",
    bg: "#DCFCE7",
  },
  3: {
    label: "Trusted Contributor",
    shortLabel: "Trusted",
    badge: "🏆",
    color: "#D97706",
    bg: "#FEF3C7",
  },
  4: {
    label: "Community Ambassador",
    shortLabel: "Ambassador",
    badge: "👑",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
};

interface TrustBadgeProps {
  level: TrustLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  verifiedPurchase?: boolean;
  verifiedCheckin?: boolean;
}

export function TrustBadge({
  level,
  size = "sm",
  showLabel = false,
  verifiedPurchase = false,
  verifiedCheckin = false,
}: TrustBadgeProps) {
  const config = TRUST_CONFIG[level] ?? TRUST_CONFIG[1];

  const fontSize = size === "lg" ? 14 : size === "md" ? 12 : 10;
  const badgeSize = size === "lg" ? 16 : size === "md" ? 13 : 11;
  const paddingH = size === "lg" ? 8 : size === "md" ? 6 : 4;
  const paddingV = size === "lg" ? 4 : size === "md" ? 3 : 2;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: config.bg,
            paddingHorizontal: paddingH,
            paddingVertical: paddingV,
            borderColor: config.color + "40",
          },
        ]}
      >
        <Text style={{ fontSize: badgeSize, color: config.color, fontWeight: "600" }}>
          {config.badge} {showLabel ? config.label : config.shortLabel}
        </Text>
      </View>

      {verifiedPurchase && (
        <View style={[styles.badge, { backgroundColor: "#EFF6FF", paddingHorizontal: paddingH, paddingVertical: paddingV, borderColor: "#BFDBFE" }]}>
          <Text style={{ fontSize: badgeSize, color: "#1D4ED8", fontWeight: "600" }}>✔ Verified Customer</Text>
        </View>
      )}

      {!verifiedPurchase && verifiedCheckin && (
        <View style={[styles.badge, { backgroundColor: "#EFF6FF", paddingHorizontal: paddingH, paddingVertical: paddingV, borderColor: "#BFDBFE" }]}>
          <Text style={{ fontSize: badgeSize, color: "#1D4ED8", fontWeight: "600" }}>✔ Verified Visit</Text>
        </View>
      )}
    </View>
  );
}

export function TrustLevelCard({
  trustLevel,
  reputationScore,
  helpfulReviewsCount,
  progress,
  onVerifyPress,
}: {
  trustLevel: TrustLevel;
  reputationScore: number;
  helpfulReviewsCount: number;
  progress: {
    current: { label: string; description: string; badge: string };
    next: { label: string } | null;
    requirements: { label: string; met: boolean }[];
  };
  onVerifyPress?: () => void;
}) {
  const colors = useColors();
  const config = TRUST_CONFIG[trustLevel] ?? TRUST_CONFIG[1];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Community Trust</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <View style={[styles.levelBadge, { backgroundColor: config.bg, borderColor: config.color + "40" }]}>
              <Text style={{ fontSize: 13, color: config.color, fontWeight: "700" }}>
                {config.badge} {config.label}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreNum, { color: config.color }]}>{reputationScore}</Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Rep Score</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {progress.current.description}
      </Text>

      {helpfulReviewsCount > 0 && (
        <View style={[styles.stat, { borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: config.color }]}>{helpfulReviewsCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Helpful Reviews</Text>
        </View>
      )}

      {progress.next && progress.requirements.length > 0 && (
        <View style={[styles.progressBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.progressTitle, { color: colors.foreground }]}>
            Path to {progress.next.label}
          </Text>
          {progress.requirements.map((req, i) => (
            <View key={i} style={styles.req}>
              <Text style={{ fontSize: 13, color: req.met ? "#16A34A" : colors.mutedForeground }}>
                {req.met ? "✓" : "○"}{"  "}
                <Text style={{ color: req.met ? "#16A34A" : colors.foreground }}>{req.label}</Text>
              </Text>
            </View>
          ))}

          {trustLevel === 1 && onVerifyPress && (
            <Text
              onPress={onVerifyPress}
              style={[styles.verifyLink, { color: "#16A34A" }]}
            >
              Start identity verification →
            </Text>
          )}
        </View>
      )}

      {trustLevel === 4 && (
        <View style={[styles.progressBox, { backgroundColor: "#EDE9FE", borderColor: "#C4B5FD" }]}>
          <Text style={{ fontSize: 13, color: "#7C3AED", fontWeight: "600" }}>
            👑 You are a Community Ambassador. Thank you for leading the way.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    opacity: 0.5,
  },
  levelBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scoreBox: {
    alignItems: "center",
  },
  scoreNum: {
    fontSize: 22,
    fontWeight: "800",
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    marginBottom: 10,
  },
  statNum: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    gap: 6,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  req: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  verifyLink: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
});
