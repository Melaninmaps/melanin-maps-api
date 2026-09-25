import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import type { CommunityPost } from "@/constants/types";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { getApiBase } from "@/lib/api";

function formatTimeAgo(value: unknown): string {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return "Community update";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function toThreadPost(raw: Record<string, unknown>): CommunityPost {
  return {
    id: String(raw.id ?? ""),
    author: String(raw.authorName ?? "Community Member"),
    authorInitials: String(raw.authorInitials ?? "CM"),
    authorColor: String(raw.authorColor ?? "#CA922B"),
    authorImageUrl: typeof raw.authorImageUrl === "string" ? raw.authorImageUrl : null,
    authorId: typeof raw.authorId === "string" ? raw.authorId : undefined,
    content: String(raw.content ?? ""),
    likes: typeof raw.upvotes === "number" ? raw.upvotes : 0,
    comments: typeof raw.commentsCount === "number" ? raw.commentsCount : 0,
    commentPolicy: ["everyone", "followers", "off"].includes(String(raw.commentPolicy))
      ? raw.commentPolicy as CommunityPost["commentPolicy"]
      : "everyone",
    visibility: raw.visibility === "followers_only" ? "followers_only" : "public",
    timeAgo: formatTimeAgo(raw.createdAt),
    category: raw.category === "recommendation" || raw.category === "alert" || raw.category === "question"
      ? raw.category
      : "discussion",
    postType: ["business", "question", "safety", "travel", "saved_place"].includes(String(raw.postType))
      ? raw.postType as CommunityPost["postType"]
      : "community",
    groupId: typeof raw.groupId === "number" ? raw.groupId : undefined,
    liked: false,
    businessId: typeof raw.businessId === "string" ? raw.businessId : undefined,
    businessName: typeof raw.businessName === "string" ? raw.businessName : undefined,
    businessLink: typeof raw.businessLink === "string" ? raw.businessLink : undefined,
    mediaUrls: Array.isArray(raw.mediaUrls) ? raw.mediaUrls.filter((url): url is string => typeof url === "string") : [],
    locationTag: typeof raw.locationTag === "string" ? raw.locationTag : undefined,
    locationType: typeof raw.locationType === "string" ? raw.locationType : undefined,
    topicTag: typeof raw.topicTag === "string" ? raw.topicTag : undefined,
    isPrivateTopic: Boolean(raw.isPrivateTopic),
    hasContentWarning: Boolean(raw.hasContentWarning),
    contentWarningType: typeof raw.contentWarningType === "string" ? raw.contentWarningType : undefined,
    audienceRating: typeof raw.audienceRating === "string" ? raw.audienceRating : "everyone",
    ratingReason: typeof raw.ratingReason === "string" ? raw.ratingReason : undefined,
    linkUrl: typeof raw.linkUrl === "string" ? raw.linkUrl : undefined,
    linkTitle: typeof raw.linkTitle === "string" ? raw.linkTitle : undefined,
    linkDescription: typeof raw.linkDescription === "string" ? raw.linkDescription : undefined,
    linkDomain: typeof raw.linkDomain === "string" ? raw.linkDomain : undefined,
    linkFavicon: typeof raw.linkFavicon === "string" ? raw.linkFavicon : undefined,
    threadId: typeof raw.threadId === "string" ? raw.threadId : undefined,
    threadPosition: typeof raw.threadPosition === "number" ? raw.threadPosition : 1,
    threadTotal: typeof raw.threadTotal === "number" ? raw.threadTotal : 1,
  };
}

export default function CommunityThreadScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { threadId } = useLocalSearchParams<{ threadId?: string }>();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThread = useCallback(async (refresh = false) => {
    const id = typeof threadId === "string" ? threadId.trim() : "";
    if (!id) {
      setPosts([]);
      setError("This Community thread is unavailable.");
      setLoading(false);
      return;
    }
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const token = Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token");
      const response = await fetch(`${getApiBase()}/api/community/thread/${encodeURIComponent(id)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = await response.json().catch(() => ({})) as { posts?: Record<string, unknown>[]; error?: string };
      if (!response.ok || !Array.isArray(payload.posts)) {
        throw new Error(payload.error ?? "This Community thread is unavailable.");
      }
      setPosts(payload.posts.map(toThreadPost));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this Community thread.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [threadId]);

  useFocusEffect(useCallback(() => {
    void loadThread();
  }, [loadThread]));

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to Community feed"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={21} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Community thread</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Read every part in order</Text>
        </View>
      </View>

      {loading && posts.length === 0 ? (
        <View style={styles.centered} accessibilityRole="progressbar" accessibilityLabel="Loading Community thread">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(post) => post.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32, flexGrow: 1 }]}
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadThread(true)} tintColor={colors.primary} />}
          ListHeaderComponent={posts.length > 0 ? (
            <Text style={[styles.partCount, { color: colors.mutedForeground }]}>
              {posts.length} part{posts.length === 1 ? "" : "s"}
            </Text>
          ) : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-circle" size={38} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Thread unavailable</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{error ?? "Pull to retry, or return to Community."}</Text>
              <TouchableOpacity
                onPress={() => void loadThread(true)}
                style={[styles.retry, { borderColor: colors.border, backgroundColor: colors.card }]}
                accessibilityRole="button"
                accessibilityLabel="Retry loading Community thread"
              >
                <Feather name="refresh-cw" size={14} color={colors.primary} />
                <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <CommunityPostCard
              post={item}
              currentUserId={user?.id}
              onCommentPress={() => router.push({ pathname: "/community", params: { postId: item.id } } as never)}
              onAuthorPress={(authorId) => router.push(`/user/${authorId}` as never)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { padding: 6 },
  title: { fontFamily: "Inter_700Bold", fontSize: 18 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 14, gap: 2 },
  partCount: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginBottom: 10 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 21 },
  retry: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  retryText: { fontFamily: "Inter_700Bold", fontSize: 13 },
});
