import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type OwnershipType =
  | "black-owned"
  | "minority-owned"
  | "women-owned"
  | "veteran-owned"
  | "lgbtq-owned"
  | "disability-owned"
  | "indigenous-owned"
  | "immigrant-owned"
  | "d9-affiliated"
  | "non-minority-owned";

interface BadgeConfig {
  label: string;
  emoji: string;
  bg: string;
  accent: string;
}

const BADGE_CONFIG: Record<OwnershipType, BadgeConfig> = {
  "black-owned": {
    label: "Black Owned",
    emoji: "✊🏾",
    bg: "#1A0A00",
    accent: "#CA922B",
  },
  "minority-owned": {
    label: "Minority Owned",
    emoji: "🏅",
    bg: "#4D0E0E",
    accent: "#C9922B",
  },
  "women-owned": {
    label: "Women Owned",
    emoji: "⚡",
    bg: "#4A0E2D",
    accent: "#E8A0B4",
  },
  "veteran-owned": {
    label: "Veteran Owned",
    emoji: "🎖️",
    bg: "#0A1F3C",
    accent: "#C9922B",
  },
  "lgbtq-owned": {
    label: "LGBTQ+ Owned",
    emoji: "🌈",
    bg: "#2D0A5E",
    accent: "#C97BD4",
  },
  "disability-owned": {
    label: "Disability Owned",
    emoji: "🤝🏾",
    bg: "#0A3228",
    accent: "#4DB8A0",
  },
  "indigenous-owned": {
    label: "Indigenous Owned",
    emoji: "🦅",
    bg: "#3C0A00",
    accent: "#D47A30",
  },
  "immigrant-owned": {
    label: "Immigrant Owned",
    emoji: "🌍",
    bg: "#0A1A40",
    accent: "#C9A050",
  },
  "d9-affiliated": {
    label: "D9 Affiliated",
    emoji: "🐾",
    bg: "#2A0A0A",
    accent: "#CA922B",
  },
  "non-minority-owned": {
    label: "Non-Minority Owned",
    emoji: "🏢",
    bg: "#1C1C1E",
    accent: "#AEAEB2",
  },
};

interface SingleBadgeProps {
  type: OwnershipType;
  verified?: boolean;
  size?: "sm" | "md";
}

export function OwnershipBadge({ type, verified = false, size = "sm" }: SingleBadgeProps) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;
  const isMd = size === "md";

  return (
    <View
      style={[
        styles.badge,
        isMd ? styles.badgeMd : styles.badgeSm,
        { backgroundColor: config.bg, borderColor: config.accent },
      ]}
    >
      <Text style={isMd ? styles.emojiMd : styles.emojiSm}>{config.emoji}</Text>
      <Text style={[styles.label, isMd ? styles.labelMd : styles.labelSm, { color: config.accent }]}>
        {config.label}
      </Text>
      {verified && (
        <View style={[styles.verifiedPill, { backgroundColor: config.accent }]}>
          <Feather name="check" size={isMd ? 9 : 8} color={config.bg} />
          <Text style={[styles.verifiedText, isMd ? styles.verifiedMd : styles.verifiedSm, { color: config.bg }]}>
            VERIFIED
          </Text>
        </View>
      )}
    </View>
  );
}

interface OwnershipBadgesProps {
  designations: string[];
  verifiedDesignations: string[];
  size?: "sm" | "md";
}

export function OwnershipBadges({ designations, verifiedDesignations, size = "md" }: OwnershipBadgesProps) {
  if (!designations || designations.length === 0) return null;

  return (
    <>
      {designations.map((d) => {
        const type = d as OwnershipType;
        if (!BADGE_CONFIG[type]) return null;
        return (
          <OwnershipBadge
            key={type}
            type={type}
            verified={verifiedDesignations?.includes(d)}
            size={size}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
  },
  badgeSm: {
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeMd: {
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  emojiSm: { fontSize: 10 },
  emojiMd: { fontSize: 13 },
  label: { fontFamily: "Inter_600SemiBold" },
  labelSm: { fontSize: 10 },
  labelMd: { fontSize: 12 },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: { fontFamily: "Inter_700Bold", letterSpacing: 0.4 },
  verifiedSm: { fontSize: 8 },
  verifiedMd: { fontSize: 9 },
});
