import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 85) return "#2D7A4F";
  if (score >= 65) return "#D4873A";
  return "#DC2626";
}

function scoreLabel(score: number): string {
  if (score >= 85) return "High";
  if (score >= 65) return "Medium";
  return "Low";
}

export function ConfidenceScoreBadge({ score, size = "sm", showLabel = false }: Props) {
  const color = scoreColor(score);

  if (size === "lg") {
    return (
      <View style={[styles.ring, { borderColor: color + "30", backgroundColor: color + "10" }]}>
        <Text style={[styles.ringScore, { color }]}>{score}</Text>
        <Text style={[styles.ringLabel, { color: color + "CC" }]}>/ 100</Text>
        {showLabel && (
          <Text style={[styles.ringDesc, { color }]}>{scoreLabel(score)} Confidence</Text>
        )}
      </View>
    );
  }

  if (size === "md") {
    return (
      <View style={[styles.badgeMd, { backgroundColor: color + "18", borderColor: color + "40" }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.scoreMd, { color }]}>{score}</Text>
        {showLabel && <Text style={[styles.labelMd, { color }]}>{scoreLabel(score)}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.badgeSm, { backgroundColor: color + "18", borderColor: color + "40" }]}>
      <View style={[styles.dotSm, { backgroundColor: color }]} />
      <Text style={[styles.scoreSm, { color }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  ringScore: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    lineHeight: 32,
  },
  ringLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  ringDesc: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    marginTop: 2,
  },
  badgeMd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scoreMd: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  labelMd: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  badgeSm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dotSm: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  scoreSm: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
});
