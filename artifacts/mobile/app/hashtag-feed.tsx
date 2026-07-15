import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import type { CommunityPost } from "@/constants/types";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function formatTimeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function toPostCard(raw: Record<string, unknown>): CommunityPost {
  let mediaUrls: string[] | undefined;
  if (raw.mediaUrls && typeof raw.mediaUrls === "string") {
    try { mediaUrls = JSON.parse(raw.mediaUrls) as string[]; } catch { /* ignore */ }
  }
  return {
    id: (raw.id as string) ?? "",
    author: (raw.authorName as string) ?? "Community Member",
    authorInitials: (raw.authorInitials as string) ?? "CM",
    authorColor: (raw.authorColor as string) ?? "#CA922B",
    authorId: (raw.authorId as string) ?? undefined,
    content: (raw.content as string) ?? "",
    likes: Number(raw.upvotes ?? 0),
    comments: Number(raw.commentsCount ?? 0),
    timeAgo: formatTimeAgo((raw.createdAt as string) ?? new Date().toISOString()),
    category: ((raw.category as string) === "recommendation" || (raw.category as string) === "alert" || (raw.category as string) === "question" ? raw.category : "discussion") as CommunityPost["category"],
    postType: ((raw.postType as string) === "business" || (raw.postType as string) === "question" || (raw.postType as string) === "saved_place" ? raw.postType : "community") as CommunityPost["postType"],
    liked: false,
    businessId: (raw.businessId as string) ?? undefined,
    businessName: (raw.businessName as string) ?? undefined,
    mediaUrls,
    locationTag: (raw.locationTag as string) ?? undefined,
    hashtags: Array.isArray(raw.hashtags) ? (raw.hashtags as string[]) : undefined,
    audienceRating: (raw.audienceRating as string) ?? "everyone",
  };
}

export default function HashtagFeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const { isAuthenticated } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [postCount, setPostCount] = useState(0);

  const bare = (tag ?? "").replace(/^#/, "").toLowerCase();

  const load = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [postsRes, followRes] = await Promise.all([
        fetch(`${getApiBase()}/api/community/posts?hashtag=${encodeURIComponent(bare)}&limit=40`, { headers }),
        isAuthenticated
          ? fetch(`${getApiBase()}/api/hashtags/following`, { headers })
          : Promise.resolve(null),
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json() as { posts: Record<string, unknown>[] };
        const arr = (data.posts ?? []).map(toPostCard);
        setPosts(arr);
        setPostCount(arr.length);
      }

      if (followRes?.ok) {
        const fdata = await followRes.json() as { tags: string[] };
        setFollowing((fdata.tags ?? []).includes(bare));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bare, isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    if (!isAuthenticated) return;
    setFollowLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`${getApiBase()}/api/hashtags/${encodeURIComponent(bare)}/follow`, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setFollowing(!following);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTag, { color: colors.foreground }]}>#{bare}</Text>
          <Text style={[styles.headerCount, { color: colors.mutedForeground }]}>
            {postCount} {postCount === 1 ? "post" : "posts"}
          </Text>
        </View>
        {isAuthenticated && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              { backgroundColor: following ? colors.card : colors.primary, borderColor: following ? colors.border : colors.primary },
            ]}
            onPress={toggleFollow}
            disabled={followLoading}
          >
            {followLoading
              ? <ActivityIndicator size="small" color={following ? colors.primary : "#fff"} />
              : (
                <Text style={[styles.followBtnText, { color: following ? colors.foreground : "#fff" }]}>
                  {following ? "Following" : "Follow"}
                </Text>
              )}
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="hash" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No posts yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Be the first to use #{bare} in your post.
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          onRefresh={() => { setRefreshing(true); load(); }}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <CommunityPostCard post={item} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  headerCenter: { flex: 1 },
  headerTag: { fontFamily: "Cormorant_700Bold", fontSize: 22 },
  headerCount: { fontFamily: "Inter_400Regular", fontSize: 13 },
  followBtn: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  followBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontFamily: "Cormorant_700Bold", fontSize: 20, marginBottom: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
