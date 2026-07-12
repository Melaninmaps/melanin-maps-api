import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";

interface Post {
  id: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  mediaUrls: string | null;
  upvotes: number;
  commentsCount: number;
  createdAt: string;
  postType: string;
  category: string;
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN)
    return `https://${process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN}`;
  return "";
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function BusinessVibesScreen() {
  const { businessId, businessName } = useLocalSearchParams<{
    businessId: string;
    businessName: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const token =
        Platform.OS !== "web"
          ? await SecureStore.getItemAsync("auth_session_token")
          : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${getApiBase()}/api/community/posts?businessId=${businessId}&limit=50`,
        { headers }
      );
      if (!res.ok) return;
      const data = (await res.json()) as { posts: Post[] };
      setPosts(data.posts ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const mediaList = (raw: string | null): string[] => {
    if (!raw) return [];
    try {
      return (JSON.parse(raw) as string[]).filter(Boolean);
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            The Vibe
          </Text>
          {businessName ? (
            <Text
              style={[styles.headerSub, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {businessName}
            </Text>
          ) : null}
        </View>
        <View
          style={[styles.tagBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
        >
          <Feather name="video" size={13} color={colors.primary} />
          <Text style={[styles.tagBadgeText, { color: colors.primary }]}>
            Community Posts
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {posts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎥</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No vibes posted yet
              </Text>
              <Text
                style={[styles.emptySub, { color: colors.mutedForeground }]}
              >
                Be the first to tag this place in a community post — share the
                food, the feel, the atmosphere.
              </Text>
            </View>
          ) : (
            posts.map((post) => {
              const media = mediaList(post.mediaUrls);
              return (
                <View
                  key={post.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Author row */}
                  <View style={styles.authorRow}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: post.authorColor },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {post.authorInitials}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.authorName,
                          { color: colors.foreground },
                        ]}
                      >
                        {post.authorName}
                      </Text>
                      <Text
                        style={[
                          styles.postTime,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {timeAgo(post.createdAt)}
                      </Text>
                    </View>
                    {post.postType === "business" && (
                      <View
                        style={[
                          styles.ownerBadge,
                          { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.ownerBadgeText,
                            { color: colors.primary },
                          ]}
                        >
                          Owner
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <Text
                    style={[styles.content, { color: colors.foreground }]}
                  >
                    {post.content}
                  </Text>

                  {/* Media */}
                  {media.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.mediaRow}
                    >
                      {media.map((url, i) => (
                        <Image
                          key={i}
                          source={{ uri: url }}
                          style={styles.mediaImg}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  )}

                  {/* Footer */}
                  <View style={styles.footer}>
                    <View style={styles.footerStat}>
                      <Feather
                        name="thumbs-up"
                        size={13}
                        color={colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.footerStatText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {post.upvotes}
                      </Text>
                    </View>
                    <View style={styles.footerStat}>
                      <Feather
                        name="message-circle"
                        size={13}
                        color={colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.footerStatText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {post.commentsCount}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16, gap: 12 },
  empty: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 44, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  authorName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  postTime: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  ownerBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  content: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginBottom: 10,
  },
  mediaRow: { marginBottom: 10 },
  mediaImg: {
    width: 180,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  footer: { flexDirection: "row", gap: 16 },
  footerStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerStatText: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
