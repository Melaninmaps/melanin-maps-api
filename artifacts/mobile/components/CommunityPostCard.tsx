import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { BusinessMiniCard, type BusinessMiniCardData } from "@/components/BusinessMiniCard";
import { ReportButton } from "@/components/ReportButton";
import AudienceRatingBadge from "@/components/AudienceRatingBadge";
import type { CommunityPost } from "@/constants/types";
import { openExternalUrl } from "@/lib/safeLinking";
import { getApiBase } from "@/lib/api";

interface Props {
  post: CommunityPost;
  currentUserId?: string;
  onCommentPress?: () => void;
  onLikeChange?: (liked: boolean) => void;
  onAuthorPress?: (authorId: string) => void;
  onLocationPress?: (locationTag: string) => void;
  onTopicPress?: (topicTag: string) => void;
  onRepost?: (post: CommunityPost) => void;
  onEdit?: (post: CommunityPost) => void;
  onDelete?: (postId: string) => void;
  onThreadPress?: (threadId: string) => void;
  onHashtagPress?: (tag: string) => void;
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

const WARNING_LABELS: Record<string, string> = {
  violence: "Graphic Violence",
  nudity: "Explicit Content",
  disturbing: "Disturbing Imagery",
  other: "Sensitive Content",
};

function MediaGrid({ mediaUrls, hasContentWarning, contentWarningType }: {
  mediaUrls: string[];
  hasContentWarning: boolean;
  contentWarningType?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const colors = useColors();

  if (hasContentWarning && !revealed) {
    return (
      <TouchableOpacity
        style={s.warningOverlay}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setRevealed(true);
        }}
        activeOpacity={0.85}
      >
        <Feather name="eye-off" size={26} color="#FFFFFF" />
        <Text style={s.warningTitle}>
          {WARNING_LABELS[contentWarningType ?? "other"] ?? "Sensitive Content"}
        </Text>
        <Text style={s.warningSubtitle}>Tap to view</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.mediaGrid}>
      {hasContentWarning && revealed && (
        <TouchableOpacity
          style={s.warningBadge}
          onPress={() => setRevealed(false)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Feather name="eye-off" size={11} color="#FFFFFF" />
          <Text style={s.warningBadgeText}>{WARNING_LABELS[contentWarningType ?? "other"] ?? "Sensitive Content"}</Text>
        </TouchableOpacity>
      )}
      {mediaUrls.map((url, i) => {
        const isVideo = url.endsWith(".mp4") || url.endsWith(".mov") || url.endsWith(".webm") || url.includes("video");
        return isVideo ? (
          <TouchableOpacity
            key={i}
            style={[s.mediaThumb, { backgroundColor: "#0008", justifyContent: "center", alignItems: "center" }]}
            onPress={() => { void openExternalUrl(url, { unavailableMessage: "This video is unavailable." }); }}
            activeOpacity={0.8}
          >
            <Feather name="play-circle" size={36} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 4 }}>Open Video</Text>
          </TouchableOpacity>
        ) : (
          <Image key={i} source={{ uri: url }} style={s.mediaThumb} resizeMode="cover" />
        );
      })}
    </View>
  );
}

function LinkPreviewCard({ linkUrl, linkTitle, linkDescription, linkDomain, linkFavicon }: {
  linkUrl: string;
  linkTitle?: string | null;
  linkDescription?: string | null;
  linkDomain?: string | null;
  linkFavicon?: string | null;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[s.linkPreview, { backgroundColor: colors.secondary, borderColor: colors.border }]}
      onPress={() => { void openExternalUrl(linkUrl); }}
      activeOpacity={0.8}
    >
      <View style={[s.linkPreviewAccent, { backgroundColor: "#C4622D" }]} />
      <View style={s.linkPreviewBody}>
        <View style={s.linkPreviewDomain}>
          {linkFavicon ? (
            <Text style={s.linkPreviewFavicon}>{linkFavicon}</Text>
          ) : (
            <Feather name="link" size={12} color={colors.mutedForeground} />
          )}
          <Text style={[s.linkPreviewDomainText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {linkDomain ?? linkUrl}
          </Text>
        </View>
        {linkTitle ? (
          <Text style={[s.linkPreviewTitle, { color: colors.foreground }]} numberOfLines={2}>{linkTitle}</Text>
        ) : null}
        {linkDescription ? (
          <Text style={[s.linkPreviewDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{linkDescription}</Text>
        ) : null}
      </View>
      <Feather name="arrow-right" size={14} color={colors.mutedForeground} style={s.linkPreviewArrow} />
    </TouchableOpacity>
  );
}

function RepostBlock({ repostAuthorName, repostAuthorInitials, repostContent }: {
  repostAuthorName?: string | null;
  repostAuthorInitials?: string | null;
  repostContent?: string | null;
}) {
  const colors = useColors();
  const initials = repostAuthorInitials ?? (repostAuthorName?.split(" ").map((w) => w[0]).join("").slice(0, 2) ?? "?");
  return (
    <View style={[s.repostBlock, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <View style={s.repostHeader}>
        <View style={[s.repostAvatar, { backgroundColor: "#7B4F2E" }]}>
          <Text style={s.repostInitials}>{initials}</Text>
        </View>
        <Text style={[s.repostAuthor, { color: colors.mutedForeground }]}>{repostAuthorName ?? "Community Member"}</Text>
      </View>
      {repostContent ? (
        <Text style={[s.repostContent, { color: colors.foreground }]} numberOfLines={4}>{repostContent}</Text>
      ) : null}
    </View>
  );
}

const MENTION_STANCE: Record<string, { label: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  community_favorite: { label: "Community Favorite", icon: "heart", color: "#C4622D" },
  hidden_gem: { label: "Hidden Gem", icon: "star", color: "#CA922B" },
  supporting_local: { label: "Supporting Local", icon: "home", color: "#2D7A4F" },
  visited_loved: { label: "Visited & Loved", icon: "check-circle", color: "#0369A1" },
};

function BusinessMentionCard({ businessId, businessName, stanceTag, rating }: {
  businessId: string;
  businessName?: string | null;
  stanceTag?: string | null;
  rating?: number | null;
}) {
  const colors = useColors();
  const router = useRouter();
  const stance = stanceTag ? MENTION_STANCE[stanceTag] : null;
  return (
    <TouchableOpacity
      style={[s.mentionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: "/business/[id]", params: { id: businessId } } as never); }}
      activeOpacity={0.85}
    >
      <View style={[s.mentionIcon, { backgroundColor: colors.primary + "15" }]}>
        <Feather name="briefcase" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.mentionName, { color: colors.foreground }]} numberOfLines={1}>{businessName ?? "Business"}</Text>
        {stance ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Feather name={stance.icon} size={11} color={stance.color} />
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: stance.color }}>{stance.label}</Text>
          </View>
        ) : rating ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Feather key={i} name="star" size={11} color={i < rating ? "#CA922B" : colors.border} />
            ))}
          </View>
        ) : null}
      </View>
      <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export function CommunityPostCard({ post, currentUserId, onCommentPress, onLikeChange, onAuthorPress, onLocationPress, onTopicPress, onRepost, onEdit, onDelete, onThreadPress, onHashtagPress }: Props) {
  const colors = useColors();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showBizCard, setShowBizCard] = useState(false);

  const isOwnPost = !!(currentUserId && post.authorId && currentUserId === post.authorId);

  const handleMoreOptions = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Post Options",
      undefined,
      [
        { text: "Edit Post", onPress: () => onEdit?.(post) },
        {
          text: "Delete Post",
          style: "destructive",
          onPress: () =>
            Alert.alert("Delete Post", "This can't be undone.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => onDelete?.(post.id) },
            ]),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const isBusinessPost = post.postType === "business";
  const isQuestion = post.postType === "question" || post.category === "question";
  const categoryConfig = CATEGORY_CONFIG[post.category] ?? CATEGORY_CONFIG.discussion;
  const accentColor = POST_TYPE_ACCENT[post.postType ?? "community"] ?? POST_TYPE_ACCENT.community;
  const isRepost = !!post.repostId;

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

  const markAsRead = async (postId: string) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      fetch(`${getApiBase()}/api/community/posts/${postId}/read`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {});
    } catch {}
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
      isRepost && { borderLeftWidth: 3, borderLeftColor: "#2D7A4F" },
    ]}>

      {/* Repost header banner */}
      {isRepost && (
        <View style={[s.repostBanner, { backgroundColor: "#2D7A4F10", borderBottomColor: "#2D7A4F25" }]}>
          <Feather name="repeat" size={12} color="#2D7A4F" />
          <Text style={[s.repostBannerText, { color: "#2D7A4F" }]}>{post.author} reposted</Text>
        </View>
      )}

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
        {(post.threadTotal ?? 1) > 1 && (
          <View style={[s.threadBadge, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="link" size={10} color={colors.primary} />
            <Text style={[s.threadBadgeText, { color: colors.primary }]}>
              {post.threadPosition ?? 1}/{post.threadTotal}
            </Text>
          </View>
        )}
        {isOwnPost && (
          <TouchableOpacity
            onPress={handleMoreOptions}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={s.moreBtn}
            activeOpacity={0.7}
          >
            <Feather name="more-horizontal" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content — inline hashtag tapping */}
      <Text style={[s.content, { color: colors.foreground }]}>
        {post.content.split(/(#\w+)/g).map((part, i) => {
          if (/^#\w+$/.test(part)) {
            const tag = part.slice(1);
            return (
              <Text
                key={i}
                style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onHashtagPress?.(tag);
                }}
              >
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>

      {/* Thread continuation */}
      {(post.threadTotal ?? 1) > 1 && (
        <TouchableOpacity
          style={[s.threadContinue, { borderColor: colors.primary + "30", backgroundColor: colors.primary + "08" }]}
          onPress={() => {
            if (post.threadId) {
              void markAsRead(post.id);
              onThreadPress?.(post.threadId);
            }
          }}
          activeOpacity={0.7}
        >
          <Feather name="link" size={13} color={colors.primary} />
          <Text style={[s.threadContinueText, { color: colors.primary }]}>
            {(post.threadPosition ?? 1) === 1
              ? `Continue thread · ${(post.threadTotal ?? 1) - 1} more part${(post.threadTotal ?? 1) - 1 !== 1 ? "s" : ""}`
              : `Part ${post.threadPosition ?? 1} of ${post.threadTotal}`}
          </Text>
          {(post.threadPosition ?? 1) < (post.threadTotal ?? 1) && (
            <Feather name="chevron-right" size={13} color={colors.primary} />
          )}
        </TouchableOpacity>
      )}

      {/* Community Guidance rating — shown for any non-everyone tier */}
      {post.audienceRating && post.audienceRating !== "everyone" && (
        <View style={s.ratingRow}>
          <AudienceRatingBadge
            rating={post.audienceRating}
            reason={post.ratingReason}
            size="sm"
            showReason={!!post.ratingReason}
          />
        </View>
      )}

      {/* Repost block — shows quoted original */}
      {isRepost && (post.repostContent || post.repostAuthorName) && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
          <RepostBlock
            repostAuthorName={post.repostAuthorName}
            repostAuthorInitials={post.repostAuthorInitials}
            repostContent={post.repostContent}
          />
        </View>
      )}

      {/* Business @mention endorsement card */}
      {post.mentionedBusinessId && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
          <BusinessMentionCard
            businessId={post.mentionedBusinessId}
            businessName={post.mentionedBusinessName}
            stanceTag={post.mentionedBusinessTag}
            rating={post.mentionedBusinessRating}
          />
        </View>
      )}

      {/* Link preview card */}
      {post.linkUrl && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
          <LinkPreviewCard
            linkUrl={post.linkUrl}
            linkTitle={post.linkTitle}
            linkDescription={post.linkDescription}
            linkDomain={post.linkDomain}
            linkFavicon={post.linkFavicon}
          />
        </View>
      )}

      {/* Media grid */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <MediaGrid
          mediaUrls={post.mediaUrls}
          hasContentWarning={post.hasContentWarning ?? false}
          contentWarningType={post.contentWarningType}
        />
      )}

      {/* Topic tag badge */}
      {post.topicTag && (
        <TouchableOpacity
          style={[s.topicBadge, { backgroundColor: "#7B2D8B12", borderColor: "#7B2D8B30" }]}
          onPress={() => { if (post.topicTag) { onTopicPress?.(post.topicTag); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
          activeOpacity={onTopicPress ? 0.7 : 1}
        >
          {post.isPrivateTopic && <Feather name="lock" size={10} color="#7B2D8B" />}
          <Feather name="tag" size={11} color="#7B2D8B" />
          <Text style={s.topicBadgeText}>{post.topicTag}</Text>
        </TouchableOpacity>
      )}

      {/* Location tag badge */}
      {post.locationTag && (
        <TouchableOpacity
          style={[s.locationBadge, { backgroundColor: "#0369A112", borderColor: "#0369A130" }]}
          onPress={() => { if (post.locationTag) onLocationPress?.(post.locationTag); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={onLocationPress ? 0.7 : 1}
        >
          <Feather name="map-pin" size={11} color="#0369A1" />
          <Text style={s.locationText}>{post.locationTag}</Text>
          {post.locationType && post.locationType !== "city" && (
            <Text style={s.locationTypeBadge}>{post.locationType}</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Business external link */}
      {isBusinessPost && post.businessLink && (
        <TouchableOpacity
          style={[s.linkRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => { if (post.businessLink) void openExternalUrl(post.businessLink); }}
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
        {onRepost && (
          <TouchableOpacity style={s.action} activeOpacity={0.7} onPress={() => onRepost(post)}>
            <Feather name="repeat" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.action} activeOpacity={0.7}>
          <Feather name="share-2" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={s.action}>
          <ReportButton
            targetType="post"
            targetId={post.id}
            targetName={post.author}
            iconSize={16}
          />
        </View>
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
  repostBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  repostBannerText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
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
  // Link preview
  linkPreview: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    gap: 0,
  },
  linkPreviewAccent: { width: 4, alignSelf: "stretch" },
  linkPreviewBody: { flex: 1, padding: 10, gap: 3 },
  linkPreviewDomain: { flexDirection: "row", alignItems: "center", gap: 5 },
  linkPreviewFavicon: { fontSize: 13 },
  linkPreviewDomainText: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  linkPreviewTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 18 },
  linkPreviewDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  linkPreviewArrow: { marginRight: 10 },
  // Repost block
  repostBlock: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  repostHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  repostAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  repostInitials: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#FFFFFF" },
  repostAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  repostContent: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  // Media
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  mediaThumb: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  warningOverlay: {
    marginHorizontal: 14,
    marginBottom: 10,
    height: 110,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#ffffff20",
  },
  warningTitle: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  warningSubtitle: {
    color: "#FFFFFF99",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1a1a2e",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
    width: "100%",
  },
  warningBadgeText: {
    color: "#FFFFFF",
    fontFamily: "Inter_500Medium",
    fontSize: 11,
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
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  locationText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#0369A1" },
  locationTypeBadge: { fontFamily: "Inter_400Regular", fontSize: 10, color: "#0369A190", textTransform: "capitalize" },
  topicBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginHorizontal: 14,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  topicBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#7B2D8B" },
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
  moreBtn: { padding: 2 },
  ratingRow: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  threadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  threadBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  threadContinue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  threadContinueText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
  },
  mentionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  mentionIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  mentionName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
