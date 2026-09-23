import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CommunityConfidenceScore } from "@/components/CommunityConfidenceScore";
import { KnowBeforeYouGoSection } from "@/components/KnowBeforeYouGoSection";
import { useColors } from "@/hooks/useColors";

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

export const MINIMUM_COMMUNITY_SIGNAL = 5;

/**
 * One intentionally collapsed home for the existing Community Confidence and
 * Know Before You Go detail. It changes layout only: ratings, review counts,
 * safety context, and the individual scoring explanations stay available.
 */
export function CommunitySnapshot({ business }: { business: BusinessLike }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const hasEnoughCommunitySignal = (business.reviewCount ?? 0) >= MINIMUM_COMMUNITY_SIGNAL;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={hasEnoughCommunitySignal
          ? `${expanded ? "Hide" : "Show"} Community snapshot`
          : "Community snapshot needs more feedback"}
        onPress={() => setExpanded((current) => !current)}
        activeOpacity={0.8}
        style={styles.header}
      >
        <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}>
          <Feather name="users" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Community snapshot</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            Vibe, planning context, and the community signals behind this listing
          </Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} />
      </TouchableOpacity>
      {hasEnoughCommunitySignal && expanded ? (
        <View style={styles.details}>
          <CommunityConfidenceScore business={business} />
          <KnowBeforeYouGoSection business={business} />
        </View>
      ) : !hasEnoughCommunitySignal ? (
        <Text style={[styles.waiting, { color: colors.mutedForeground }]}>
          Community scores will appear after at least {MINIMUM_COMMUNITY_SIGNAL} member reviews. Be among the first to share a review or check in; no score is shown before there is enough feedback.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, borderRadius: 16, borderWidth: 1, padding: 14 },
  header: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 16 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  details: { gap: 12, marginTop: 12 },
  waiting: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 10 },
});
