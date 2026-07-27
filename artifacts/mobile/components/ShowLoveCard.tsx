import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/ThemeContext";
import { reactToShowLove, type ShowLoveNomination } from "@/hooks/useShowLove";

const REACTION_ICONS: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  show_love: { icon: "heart", label: "Show Love" },
  support: { icon: "thumbs-up", label: "I Support" },
  saved: { icon: "bookmark", label: "Saved" },
  visited: { icon: "map-pin", label: "Visited" },
};

const CATEGORY_LABELS: Record<string, string> = {
  food: "Great Food",
  community_service: "Community Service",
  education: "Educational Content",
  travel: "Travel",
  fitness: "Fitness",
  beauty: "Beauty",
  parenting: "Parenting",
  financial_education: "Financial Education",
  entrepreneurship: "Entrepreneurship",
  arts_culture: "Arts & Culture",
  advocacy: "Local Advocacy",
  music: "Music",
  photography: "Photography",
  mentorship: "Mentorship",
  coaching: "Coaching",
  other: "Other",
};

interface Props {
  nomination: ShowLoveNomination;
  onPress?: () => void;
  onReactionChange?: (updated: ShowLoveNomination) => void;
  compact?: boolean;
}

export function ShowLoveCard({ nomination, onPress, onReactionChange, compact = false }: Props) {
  const colors = useColors();
  const { isDark } = useTheme();
  const [localNom, setLocalNom] = useState(nomination);
  const [isReacting, setIsReacting] = useState(false);

  const handleReact = async (type: string) => {
    if (isReacting) return;
    setIsReacting(true);
    const prev = { ...localNom };
    const countKey = `${type}_count` as keyof ShowLoveNomination;
    const wasMine = localNom.my_reaction === type;
    const prevCountKey = localNom.my_reaction ? (`${localNom.my_reaction}_count` as keyof ShowLoveNomination) : null;

    setLocalNom((n) => {
      const updated = { ...n };
      if (wasMine) {
        (updated as Record<string, unknown>)[countKey] = Math.max(0, (n[countKey] as number) - 1);
        updated.my_reaction = null;
      } else {
        if (prevCountKey) {
          (updated as Record<string, unknown>)[prevCountKey] = Math.max(0, (n[prevCountKey] as number) - 1);
        }
        (updated as Record<string, unknown>)[countKey] = (n[countKey] as number) + 1;
        updated.my_reaction = type;
      }
      return updated;
    });

    const result = await reactToShowLove(nomination.id, type);
    if (!result.ok) {
      setLocalNom(prev);
    } else {
      onReactionChange?.({ ...localNom, my_reaction: result.reactionType ?? null });
    }
    setIsReacting(false);
  };

  const nominatorName = localNom.nominator_first_name
    ? `${localNom.nominator_first_name}${localNom.nominator_last_name ? ` ${localNom.nominator_last_name[0]}.` : ""}`
    : "Community Member";

  const totalReactions =
    localNom.show_love_count + localNom.support_count + localNom.saved_count + localNom.visited_count;

  const cardBg = isDark ? colors.card : "#FFFFFF";
  const borderColor = isDark ? "rgba(202,146,43,0.2)" : "rgba(202,146,43,0.18)";

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: "#CA922B" }]}>
          <Text style={styles.avatarText}>{nominatorName[0]?.toUpperCase() ?? "?"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nominatorName, { color: colors.foreground }]}>{nominatorName}</Text>
          <Text style={[styles.nominatorSub, { color: colors.mutedForeground }]}>
            {localNom.city ? `${localNom.city} · ` : ""}is showing love
          </Text>
        </View>
        <View style={[styles.categoryPill, { backgroundColor: "rgba(202,146,43,0.12)", borderColor: "rgba(202,146,43,0.3)" }]}>
          <Text style={styles.categoryText}>{CATEGORY_LABELS[localNom.category] ?? localNom.category}</Text>
        </View>
      </View>

      <View style={styles.nomineeRow}>
        <View style={[styles.heartIcon, { backgroundColor: "rgba(202,146,43,0.1)" }]}>
          <Feather name="heart" size={14} color="#CA922B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nomineeName, { color: colors.foreground }]}>{localNom.nominee_name}</Text>
          {localNom.nominee_handle ? (
            <Text style={[styles.nomineeHandle, { color: "#CA922B" }]}>@{localNom.nominee_handle}</Text>
          ) : null}
        </View>
        {localNom.nominee_type !== "person" ? (
          <View style={[styles.typePill, { backgroundColor: "rgba(58,31,14,0.08)" }]}>
            <Text style={[styles.typeText, { color: colors.mutedForeground }]}>{localNom.nominee_type}</Text>
          </View>
        ) : null}
      </View>

      {localNom.what_known_for.length > 0 && (
        <View style={styles.chipsRow}>
          {localNom.what_known_for.slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.chip, { backgroundColor: "rgba(202,146,43,0.08)", borderColor: "rgba(202,146,43,0.25)" }]}>
              <Text style={[styles.chipText, { color: "#A6720F" }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.reason, { color: colors.foreground }]} numberOfLines={compact ? 2 : 4}>
        {localNom.reason}
      </Text>

      {!compact && localNom.experience ? (
        <View style={[styles.experienceBlock, { backgroundColor: isDark ? "rgba(202,146,43,0.06)" : "rgba(202,146,43,0.05)", borderLeftColor: "#CA922B" }]}>
          <Text style={[styles.experienceText, { color: colors.mutedForeground }]}>
            "{localNom.experience}"
          </Text>
        </View>
      ) : null}

      {totalReactions > 0 && (
        <Text style={[styles.totalLove, { color: "#CA922B" }]}>
          {totalReactions === 1
            ? "Recommended by 1 community member"
            : `Recommended by ${totalReactions} community members`}
        </Text>
      )}

      <View style={[styles.reactionsRow, { borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
        {Object.entries(REACTION_ICONS).map(([type, { icon, label }]) => {
          const isActive = localNom.my_reaction === type;
          const count = localNom[`${type}_count` as keyof ShowLoveNomination] as number;
          return (
            <Pressable
              key={type}
              onPress={() => handleReact(type)}
              style={[styles.reactionBtn, isActive && { backgroundColor: "rgba(202,146,43,0.12)" }]}
            >
              <Feather name={icon} size={13} color={isActive ? "#CA922B" : colors.mutedForeground} />
              <Text style={[styles.reactionLabel, { color: isActive ? "#CA922B" : colors.mutedForeground }]}>
                {label}{count > 0 ? ` ${count}` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, marginHorizontal: 16, marginVertical: 6, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, paddingBottom: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  nominatorName: { fontSize: 13, fontWeight: "700" },
  nominatorSub: { fontSize: 11, marginTop: 1 },
  categoryPill: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 10, fontWeight: "700", color: "#CA922B" },
  nomineeRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  heartIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  nomineeName: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  nomineeHandle: { fontSize: 11, marginTop: 1 },
  typePill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  typeText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 14, paddingBottom: 10 },
  chip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: "600" },
  reason: { fontSize: 13, lineHeight: 19, paddingHorizontal: 14, paddingBottom: 10 },
  experienceBlock: { marginHorizontal: 14, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 8, borderLeftWidth: 2, borderRadius: 6 },
  experienceText: { fontSize: 12, fontStyle: "italic", lineHeight: 17 },
  totalLove: { fontSize: 11, fontWeight: "700", paddingHorizontal: 14, paddingBottom: 10 },
  reactionsRow: { flexDirection: "row", borderTopWidth: 1, paddingTop: 8, paddingBottom: 8, paddingHorizontal: 6, gap: 2 },
  reactionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 5, borderRadius: 8 },
  reactionLabel: { fontSize: 10, fontWeight: "600" },
});
