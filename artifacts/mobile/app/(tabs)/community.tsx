import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertBanner } from "@/components/AlertBanner";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { ALERTS } from "@/constants/data";
import type { CommunityPost } from "@/constants/types";
import { useColors } from "@/hooks/useColors";

const TABS = ["Feed", "Alerts", "Recommendations"];

const CATEGORY_OPTIONS = [
  { value: "general", label: "Discussion" },
  { value: "recommendation", label: "Recommendation" },
  { value: "alert", label: "Alert" },
];

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function toPostCard(raw: Record<string, unknown>): CommunityPost {
  return {
    id: raw.id as string,
    author: (raw.authorName as string) ?? "Community Member",
    authorInitials: (raw.authorInitials as string) ?? "CM",
    authorColor: (raw.authorColor as string) ?? "#3B1F0E",
    content: raw.content as string,
    likes: (raw.upvotes as number) ?? 0,
    comments: 0,
    timeAgo: formatTimeAgo(raw.createdAt as string),
    category: (raw.category === "recommendation" || raw.category === "alert" || raw.category === "question" ? raw.category : "discussion") as CommunityPost["category"],
    liked: false,
  };
}

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("Feed");
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("general");
  const [submittingPost, setSubmittingPost] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/community/posts`);
      if (res.ok) {
        const data = await res.json() as { posts: Record<string, unknown>[] };
        setPosts((data.posts ?? []).map(toPostCard));
      }
    } catch {
      // silently show empty state on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const onRefresh = () => { setRefreshing(true); void loadPosts(); };

  const filteredPosts =
    activeTab === "Recommendations"
      ? posts.filter((p) => p.category === "recommendation")
      : activeTab === "Alerts"
      ? posts.filter((p) => p.category === "alert")
      : posts;

  const submitPost = async () => {
    if (!newPostText.trim()) return;
    setSubmittingPost(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/community/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newPostText.trim(), category: newPostCategory }),
      });
      if (res.ok) {
        const data = await res.json() as { post: Record<string, unknown> };
        setPosts((prev) => [toPostCard(data.post), ...prev]);
        setNewPostText("");
        setNewPostCategory("general");
        setShowCompose(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", "Could not post. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Could not post. Check your connection.");
    } finally {
      setSubmittingPost(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Community</Text>
        <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.secondary }]}>
          <Feather name="search" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          activeTab === "Alerts" && alerts.length > 0 ? (
            <View style={styles.alertSection}>
              {alerts.map((a) => (
                <AlertBanner key={a.id} alert={a} onDismiss={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))} />
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              {loading ? "Loading…" : "Nothing here yet"}
            </Text>
            {!loading && (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Be the first to share something with the community.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => <CommunityPostCard post={item} />}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 90 }]}
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCompose(true);
          setTimeout(() => inputRef.current?.focus(), 150);
        }}
      >
        <Feather name="edit-3" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showCompose} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={[styles.composeSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 20 }]}>
            <View style={[styles.composeHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowCompose(false)}>
                <Text style={[styles.composeCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.composeTitle, { color: colors.foreground }]}>New Post</Text>
              <TouchableOpacity onPress={() => void submitPost()} disabled={!newPostText.trim() || submittingPost}>
                <Text style={[styles.composePostText, { color: newPostText.trim() ? colors.primary : colors.muted }]}>
                  {submittingPost ? "Posting…" : "Post"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoryRow}>
              {CATEGORY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.categoryChip,
                    { borderColor: newPostCategory === opt.value ? colors.primary : colors.border },
                    newPostCategory === opt.value && { backgroundColor: colors.primary + "18" },
                  ]}
                  onPress={() => setNewPostCategory(opt.value)}
                >
                  <Text style={[styles.categoryChipText, { color: newPostCategory === opt.value ? colors.primary : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              ref={inputRef}
              style={[styles.composeInput, { color: colors.foreground }]}
              placeholder="Share something with the community…"
              placeholderTextColor={colors.mutedForeground}
              value={newPostText}
              onChangeText={setNewPostText}
              multiline
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{newPostText.length}/500</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26 },
  searchBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  list: { paddingHorizontal: 16, paddingTop: 16 },
  alertSection: { marginBottom: 4 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  fab: {
    position: "absolute",
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B1F0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  composeSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: 300 },
  composeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  composeTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  composeCancelText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  composePostText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  categoryRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  categoryChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  composeInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "right", paddingHorizontal: 20, paddingBottom: 8 },
});
