import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { useColors } from "@/hooks/useColors";
import { BusinessMiniCard, type BusinessMiniCardData } from "@/components/BusinessMiniCard";
import type { CommunityPost } from "@/constants/types";

interface Props {
  post: CommunityPost;
  onCommentPress?: () => void;
  onLikeChange?: (liked: boolean) => void;
  onAuthorPress?: (authorId: string) => void;
}

const CATEGORY_CONFIG = {
  recommendation: { label: "Recommendation", icon: "thumbs-up" as const, color: "#2D7A4F" },
  question: { label: "Question", icon: "help-circle" as const, color: "#D4873A" },
  alert: { label: "Alert", icon: "alert-triangle" as const, color: "#DC2626" },
  discussion: { label: "Discussion", icon: "message-circle" as const, color: "#C4622D" },
};

const POST_TYPE_ACCENT: Record<string, string> = {
  business: "#7B2D8B",
  question: "#D4873A",
  saved_place: "#1D4ED8",
  community: "#C4622D",
};

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export function CommunityPostCard({ post, onCommentPress, onLikeChange, onAuthorPress }: Props) {
  const colors = useColors();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showBizCard, setShowBizCard] = useState(false);

  const isBusinessPost = post.postType === "business";
  const isQuestion = post.postType === "question" || post.category === "question";
  const categoryConfig = CATEGORY_CONFIG[post.category] ?? CATEGORY_CONFIG.discussion;
  const accentColor = POST_TYPE_ACCENT[post.postType ?? "community"] ?? POST_TYPE_ACCENT.community;

  const handleLike = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => next ? c + 1 : c - 1);
    onLikeChange?.(next);
    fetch(`${getApiBase()}/api/community/posts/${post.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction: next ? "up" : "down" }),
    }).catch(() => {});
  };

  const bizCardData: BusinessMiniCardData | null = post.businessId ? {
    id: post.businessId,
    name: post.businessName ?? "Business",
    externalLink: post.businessLink ?? undefined,
    badges: [],
    curatedContent: post.content,
  } : null;

  return (
    <View style={[
      s.card,
      { backgroundColor: colors.card, shadowColor: colors.foreground },
      isBusinessPost && { borderLeftWidth: 3, borderLeftColor: accentColor },
    ]}>

      {/* Business post header banner */}
      {isBusinessPost && post.businessName && (
        <TouchableOpacity
          style={[s.bizBanner, { backgroundColor: accentColor + "10", borderBottomColor: accentColor + "25" }]}
          onPress={() => setShowBizCard((v) => !v)}
          activeOpacity={0.8}
        >
          <View style={[s.bizBannerDot, { backgroundColor: accentColor }]} />
          <Feather name="briefcase" size={12} color={accentColor} />
          <Text style={[s.bizBannerName, { color: accentColor }]}>{post.businessName}</Text>
          <Text style={[s.bizBannerSub, { color: accentColor + "90" }]}>· Business Post</Text>
          <Feather name={showBizCard ? "chevron-up" : "chevron-down"} size={13} color={accentColor} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>
      )}

      {/* Inline business mini-card (expanded) */}
      {isBusinessPost && showBizCard && bizCardData && (
        <View style={s.bizCardWrap}>
          <BusinessMiniCard
            business={bizCardData}
            compact={false}
            onClose={() => setShowBizCard(false)}
          />
        </View>
      )}

      {/* Question badge */}
      {isQuestion && !isBusinessPost && (
        <View style={[s.questionBadge, { backgroundColor: "#D4873A12", borderBottomColor: "#D4873A25" }]}>
          <Feather name="help-circle" size={13} color="#D4873A" />
          <Text style={[s.questionBadgeText, { color: "#D4873A" }]}>Question from the community</Text>
        </View>
      )}

      {/* Post header */}
      <View style={s.header}>
        <TouchableOpacity
          activeOpacity={post.authorId ? 0.7 : 1}
          onPress={() => { if (post.authorId) onAuthorPress?.(post.authorId); }}
          style={[s.avatar, { backgroundColor: post.authorColor }]}
        >
          <Text style={s.initials}>{post.authorInitials}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.authorInfo}
          activeOpacity={post.authorId ? 0.7 : 1}
          onPress={() => { if (post.authorId) onAuthorPress?.(post.authorId); }}
        >
          <Text style={[s.author, { color: colors.foreground }]}>{post.author}</Text>
          <Text style={[s.time, { color: colors.mutedForeground }]}>{post.timeAgo}</Text>
        </TouchableOpacity>
        {!isBusinessPost && (
          <View style={[s.categoryTag, { backgroundColor: categoryConfig.color + "15" }]}>
            <Feather name={categoryConfig.icon} size={11} color={categoryConfig.color} />
            <Text style={[s.categoryText, { color: categoryConfig.color }]}>{categoryConfig.label}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={[s.content, { color: colors.foreground }]}>{post.content}</Text>

      {/* Business external link */}
      {isBusinessPost && post.businessLink && (
        <TouchableOpacity
          style={[s.linkRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => { if (post.businessLink) Linking.openURL(post.businessLink).catch(() => {}); }}
          activeOpacity={0.8}
        >
          <Feather name="external-link" size={13} color={colors.primary} />
          <Text style={[s.linkText, { color: colors.primary }]} numberOfLines={1}>{post.businessLink}</Text>
          <Feather name="arrow-right" size={13} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Footer actions */}
      <View style={[s.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={handleLike} style={s.action} activeOpacity={0.7}>
          <Feather name="heart" size={16} color={liked ? "#C4622D" : colors.mutedForeground} />
          <Text style={[s.actionText, { color: liked ? "#C4622D" : colors.mutedForeground }]}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.action} activeOpacity={0.7} onPress={onCommentPress}>
          <Feather name="message-circle" size={16} color={colors.mutedForeground} />
          <Text style={[s.actionText, { color: colors.mutedForeground }]}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.action} activeOpacity={0.7}>
          <Feather name="share-2" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        {isBusinessPost && post.businessId && (
          <TouchableOpacity
            style={[s.viewBizBtn, { borderColor: accentColor + "40", backgroundColor: accentColor + "08" }]}
            onPress={() => setShowBizCard((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={[s.viewBizText, { color: accentColor }]}>
              {showBizCard ? "Hide card" : "View business"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  bizBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  bizBannerDot: { width: 6, height: 6, borderRadius: 3 },
  bizBannerName: { fontFamily: "Inter_700Bold", fontSize: 12 },
  bizBannerSub: { fontFamily: "Inter_400Regular", fontSize: 11 },
  bizCardWrap: { padding: 10, paddingTop: 0 },
  questionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  questionBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
    gap: 10,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  authorInfo: { flex: 1 },
  author: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  time: { fontFamily: "Inter_400Regular", fontSize: 11 },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  content: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  linkText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 20,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  viewBizBtn: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewBizText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});
