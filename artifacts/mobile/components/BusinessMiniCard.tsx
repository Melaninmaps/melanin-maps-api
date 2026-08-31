import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export interface BusinessMiniCardData {
  id: string;
  name: string;
  category?: string;
  description?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  externalLink?: string;
  topComment?: string;
  topCommentAuthor?: string;
  badges?: string[];
  curatedContent?: string;
}

interface Props {
  business: BusinessMiniCardData;
  onClose?: () => void;
  compact?: boolean;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍽️", Beauty: "💅🏾", Health: "💊", Tech: "💻",
  Finance: "💰", Legal: "⚖️", Retail: "🛍️", Arts: "🎨",
  Fitness: "💪🏾", Automotive: "🚗", Education: "📚", Travel: "✈️",
};

export function BusinessMiniCard({ business, onClose, compact = false }: Props) {
  const colors = useColors();
  const router = useRouter();
  const emoji = CATEGORY_EMOJI[business.category ?? ""] ?? "🏪";

  const handleViewProfile = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
    router.push({ pathname: "/business/[id]", params: { id: business.id } } as never);
  };

  const handleExternalLink = () => {
    if (business.externalLink) {
      Linking.openURL(business.externalLink).catch(() => {});
    }
  };

  const stars = business.rating ? Math.round(business.rating) : 0;

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}>
      {onClose && (
        <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={s.header}>
        <View style={[s.avatar, { backgroundColor: colors.primary + "18" }]}>
          <Text style={{ fontSize: 26 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={s.nameRow}>
            <Text style={[s.name, { color: colors.foreground }]} numberOfLines={1}>{business.name}</Text>
            {business.isVerified && (
              <View style={[s.verifiedBadge, { backgroundColor: "#2D7A4F12", borderColor: "#2D7A4F30" }]}>
                <Feather name="check-circle" size={11} color="#2D7A4F" />
                <Text style={[s.verifiedText, { color: "#2D7A4F" }]}>Verified</Text>
              </View>
            )}
          </View>
          {business.category && (
            <Text style={[s.category, { color: colors.mutedForeground }]}>{business.category}</Text>
          )}
          {stars > 0 && (
            <View style={s.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Feather key={i} name="star" size={11} color={i < stars ? "#C9922B" : colors.border} />
              ))}
              {(business.reviewCount ?? 0) > 0 && (
                <Text style={[s.reviewCount, { color: colors.mutedForeground }]}>({business.reviewCount})</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Badges */}
      {(business.badges?.length ?? 0) > 0 && (
        <View style={s.badgeRow}>
          {business.badges!.map((b) => (
            <View key={b} style={[s.badge, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
              <Text style={[s.badgeText, { color: colors.primary }]}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Curated content or description */}
      {!compact && (business.curatedContent ?? business.description) && (
        <Text style={[s.description, { color: colors.foreground }]} numberOfLines={3}>
          {business.curatedContent ?? business.description}
        </Text>
      )}

      {/* Top community comment */}
      {!compact && business.topComment && (
        <View style={[s.commentBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={s.commentHeader}>
            <Feather name="message-circle" size={12} color={colors.primary} />
            <Text style={[s.commentLabel, { color: colors.primary }]}>Community says</Text>
          </View>
          <Text style={[s.commentText, { color: colors.foreground }]} numberOfLines={2}>
            &quot;{business.topComment}&quot;
          </Text>
          {business.topCommentAuthor && (
            <Text style={[s.commentAuthor, { color: colors.mutedForeground }]}>— {business.topCommentAuthor}</Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.profileBtn, { backgroundColor: colors.primary }]}
          onPress={handleViewProfile}
          activeOpacity={0.85}
        >
          <Text style={s.profileBtnText}>View Profile</Text>
          <Feather name="arrow-right" size={14} color="#FFF" />
        </TouchableOpacity>
        {business.externalLink && (
          <TouchableOpacity
            style={[s.linkBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
            onPress={handleExternalLink}
            activeOpacity={0.8}
          >
            <Feather name="external-link" size={14} color={colors.mutedForeground} />
            <Text style={[s.linkBtnText, { color: colors.mutedForeground }]}>Website</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 20, borderWidth: 1, padding: 16, gap: 12,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  closeBtn: { position: "absolute", top: 12, right: 12, zIndex: 10, padding: 4 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  name: { fontFamily: "Inter_700Bold", fontSize: 16, flex: 1 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  verifiedText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  category: { fontFamily: "Inter_400Regular", fontSize: 12 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  reviewCount: { fontFamily: "Inter_400Regular", fontSize: 11, marginLeft: 2 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  badgeText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  description: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  commentBox: { borderRadius: 12, borderWidth: 1, padding: 10, gap: 4 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 4 },
  commentLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  commentText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, fontStyle: "italic" },
  commentAuthor: { fontFamily: "Inter_400Regular", fontSize: 11 },
  actions: { flexDirection: "row", gap: 8 },
  profileBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  profileBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFF" },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  linkBtnText: { fontFamily: "Inter_500Medium", fontSize: 13 },
});
