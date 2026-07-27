import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
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
    badge: "\u25CB",
    color: "#6B7280",
    bg: "#F3F4F6",
  },
  2: {
    label: "Community Verified",
    shortLabel: "Verified",
    badge: "\u2714",
    color: "#16A34A",
    bg: "#DCFCE7",
  },
  3: {
    label: "Trusted Contributor",
    shortLabel: "Trusted",
    badge: "\u2605",
    color: "#D97706",
    bg: "#FEF3C7",
  },
  4: {
    label: "Community Ambassador",
    shortLabel: "Ambassador",
    badge: "\u25C6",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
};

const INFLUENCER_CONFIG = {
  label: "Influencer",
  shortLabel: "Influencer",
  badge: "\u2726",
  color: "#B45309",
  bg: "#FEF3C7",
  border: "#CA922B",
};

interface TrustBadgeProps {
  level: TrustLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  verifiedPurchase?: boolean;
  verifiedCheckin?: boolean;
  isInfluencer?: boolean;
}

export function TrustBadge({
  level,
  size = "sm",
  showLabel = false,
  verifiedPurchase = false,
  verifiedCheckin = false,
  isInfluencer = false,
}: TrustBadgeProps) {
  const config = isInfluencer ? INFLUENCER_CONFIG : (TRUST_CONFIG[level] ?? TRUST_CONFIG[1]);

  const fontSize = size === "lg" ? 14 : size === "md" ? 12 : 10;
  const badgeSize = size === "lg" ? 16 : size === "md" ? 13 : 11;
  const paddingH = size === "lg" ? 8 : size === "md" ? 6 : 4;
  const paddingV = size === "lg" ? 4 : size === "md" ? 3 : 2;
  void fontSize;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: config.bg,
            paddingHorizontal: paddingH,
            paddingVertical: paddingV,
            borderColor: (isInfluencer ? INFLUENCER_CONFIG.border : config.color) + "60",
          },
        ]}
      >
        <Text style={{ fontSize: badgeSize, color: config.color, fontWeight: "600" }}>
          {config.badge} {showLabel ? config.label : config.shortLabel}
        </Text>
      </View>

      {verifiedPurchase && (
        <View style={[styles.badge, { backgroundColor: "#EFF6FF", paddingHorizontal: paddingH, paddingVertical: paddingV, borderColor: "#BFDBFE" }]}>
          <Text style={{ fontSize: badgeSize, color: "#1D4ED8", fontWeight: "600" }}>{"\u2714"} Verified Customer</Text>
        </View>
      )}

      {!verifiedPurchase && verifiedCheckin && (
        <View style={[styles.badge, { backgroundColor: "#EFF6FF", paddingHorizontal: paddingH, paddingVertical: paddingV, borderColor: "#BFDBFE" }]}>
          <Text style={{ fontSize: badgeSize, color: "#1D4ED8", fontWeight: "600" }}>{"\u2714"} Verified Visit</Text>
        </View>
      )}
    </View>
  );
}

export function InfluencerBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const paddingH = size === "lg" ? 8 : size === "md" ? 6 : 4;
  const paddingV = size === "lg" ? 4 : size === "md" ? 3 : 2;
  const badgeSize = size === "lg" ? 14 : size === "md" ? 12 : 10;
  return (
    <View style={[styles.badge, { backgroundColor: INFLUENCER_CONFIG.bg, paddingHorizontal: paddingH, paddingVertical: paddingV, borderColor: INFLUENCER_CONFIG.border + "60" }]}>
      <Text style={{ fontSize: badgeSize, color: INFLUENCER_CONFIG.color, fontWeight: "700" }}>
        {INFLUENCER_CONFIG.badge} {INFLUENCER_CONFIG.label}
      </Text>
    </View>
  );
}

export function ReviewSourceBar({
  stats,
}: {
  stats: { total: number; verified: number; influencer: number; local: number; traveler: number };
}) {
  const colors = useColors();
  if (stats.total === 0) return null;

  const parts: { label: string; count: number; color: string }[] = [];
  if (stats.influencer > 0) parts.push({ label: "influencer", count: stats.influencer, color: "#B45309" });
  if (stats.verified > 0) parts.push({ label: "verified", count: stats.verified, color: "#16A34A" });
  if (stats.local > 0) parts.push({ label: "local", count: stats.local, color: "#2563EB" });
  if (stats.traveler > 0) parts.push({ label: "travelers", count: stats.traveler, color: "#7C3AED" });

  if (parts.length === 0) return null;

  return (
    <View style={rsb.container}>
      <Text style={[rsb.prefix, { color: colors.mutedForeground }]}>
        Based on{" "}
      </Text>
      {parts.map((p, i) => (
        <React.Fragment key={p.label}>
          <View style={[rsb.pill, { backgroundColor: p.color + "15", borderColor: p.color + "30" }]}>
            <Text style={[rsb.pillText, { color: p.color }]}>{p.count} {p.label}</Text>
          </View>
          {i < parts.length - 1 && <Text style={[rsb.dot, { color: colors.mutedForeground }]}> · </Text>}
        </React.Fragment>
      ))}
    </View>
  );
}

const rsb = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 2, marginTop: 4, marginBottom: 8 },
  prefix: { fontSize: 11, fontFamily: "Inter_400Regular" },
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  pillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  dot: { fontSize: 11 },
});

export function TrustLevelCard({
  trustLevel,
  isInfluencer = false,
  reputationScore,
  helpfulReviewsCount,
  progress,
  onVerifyPress,
  onLearnMorePress,
}: {
  trustLevel: TrustLevel;
  isInfluencer?: boolean;
  reputationScore: number;
  helpfulReviewsCount: number;
  progress: {
    current: { label: string; description: string; badge: string };
    next: { label: string } | null;
    requirements: { label: string; met: boolean }[];
  };
  onVerifyPress?: () => void;
  onLearnMorePress?: () => void;
}) {
  const colors = useColors();
  const config = isInfluencer ? INFLUENCER_CONFIG : (TRUST_CONFIG[trustLevel] ?? TRUST_CONFIG[1]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: isInfluencer ? "#CA922B" : colors.border }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Community Trust</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            <View style={[styles.levelBadge, { backgroundColor: config.bg, borderColor: config.color + "40" }]}>
              <Text style={{ fontSize: 13, color: config.color, fontWeight: "700" }}>
                {config.badge} {config.label}
              </Text>
            </View>
            {isInfluencer && trustLevel > 1 && (
              <View style={[styles.levelBadge, { backgroundColor: TRUST_CONFIG[trustLevel].bg, borderColor: TRUST_CONFIG[trustLevel].color + "40" }]}>
                <Text style={{ fontSize: 11, color: TRUST_CONFIG[trustLevel].color, fontWeight: "600" }}>
                  {TRUST_CONFIG[trustLevel].badge} {TRUST_CONFIG[trustLevel].shortLabel}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreNum, { color: config.color }]}>{reputationScore}</Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Rep Score</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {isInfluencer
          ? "Your reviews carry the highest weight in the community. Thank you for your influence."
          : progress.current.description}
      </Text>

      {/* Stat row */}
      {helpfulReviewsCount > 0 && (
        <View style={[styles.statRow, { borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: config.color }]}>{helpfulReviewsCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Helpful Reviews</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: config.color }]}>{reputationScore}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Reputation Pts</Text>
          </View>
        </View>
      )}

      {/* Weight callout */}
      <View style={[styles.weightBox, {
        backgroundColor: config.color + "10",
        borderColor: config.color + "30",
      }]}>
        <Text style={{ fontSize: 12, color: config.color, fontFamily: "Inter_600SemiBold" }}>
          {"\u2726"} Your review weight:{" "}
          <Text style={{ fontFamily: "Inter_700Bold" }}>
            {isInfluencer ? "3.0\u00D7" : trustLevel === 4 ? "2.5\u00D7" : trustLevel === 3 ? "2.0\u00D7" : trustLevel === 2 ? "1.5\u00D7" : "1.0\u00D7"}
          </Text>
          {" "}{isInfluencer ? "— Influencer tier" : trustLevel >= 2 ? "— verified boost" : "— verify to increase"}
        </Text>
      </View>

      {/* Progress to next level */}
      {!isInfluencer && progress.next && progress.requirements.length > 0 && (
        <View style={[styles.progressBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.progressTitle, { color: colors.foreground }]}>
            Path to {progress.next.label}
          </Text>
          {progress.requirements.map((req, i) => (
            <TouchableOpacity
              key={i}
              onPress={req.met ? undefined : (trustLevel === 1 && i === 0 ? onVerifyPress : onLearnMorePress)}
              activeOpacity={req.met ? 1 : 0.7}
              style={[styles.reqRow, { backgroundColor: req.met ? "#16A34A0D" : colors.card, borderColor: req.met ? "#16A34A30" : colors.border }]}
            >
              <Text style={{ fontSize: 16, color: req.met ? "#16A34A" : colors.mutedForeground }}>
                {req.met ? "\u2713" : "\u25CB"}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: req.met ? "#16A34A" : colors.foreground, fontFamily: "Inter_500Medium" }}>
                  {req.label}
                </Text>
                {!req.met && trustLevel === 1 && i === 0 && (
                  <Text style={{ fontSize: 11, color: "#16A34A", fontFamily: "Inter_500Medium", marginTop: 2 }}>
                    Tap to start verification {"\u2192"}
                  </Text>
                )}
              </View>
              {req.met && <Text style={{ fontSize: 12, color: "#16A34A", fontFamily: "Inter_600SemiBold" }}>Done</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {trustLevel === 4 && !isInfluencer && (
        <View style={[styles.progressBox, { backgroundColor: "#EDE9FE", borderColor: "#C4B5FD" }]}>
          <Text style={{ fontSize: 13, color: "#7C3AED", fontWeight: "600" }}>
            {"\u25C6"} You are a Community Ambassador. Thank you for leading the way.
          </Text>
        </View>
      )}

      {isInfluencer && (
        <View style={[styles.progressBox, { backgroundColor: "#FEF3C7", borderColor: "#CA922B50" }]}>
          <Text style={{ fontSize: 13, color: "#B45309", fontWeight: "600" }}>
            {"\u2726"} Influencer Package active — your reviews are featured and carry maximum weight.
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
    fontFamily: "Inter_700Bold",
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
    fontFamily: "Inter_800ExtraBold",
  },
  scoreLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    fontFamily: "Inter_400Regular",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  statNum: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  weightBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  progressBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    gap: 8,
  },
  progressTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
