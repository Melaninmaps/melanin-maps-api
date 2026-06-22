import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertBanner } from "@/components/AlertBanner";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { EventCard } from "@/components/EventCard";
import { ALERTS, EVENT_CATEGORIES } from "@/constants/data";
import type { CommunityPost } from "@/constants/types";
import { useColors } from "@/hooks/useColors";
import { useEvents } from "@/hooks/useEvents";
import { useGroups, type Group } from "@/hooks/useGroups";
import { useAuth } from "@/lib/auth";
import { UpgradeModal } from "@/components/UpgradeModal";

const TABS = ["Feed", "Events", "Groups", "Alerts", "Recommendations"];

const CATEGORY_OPTIONS = [
  { value: "general", label: "Discussion" },
  { value: "recommendation", label: "Recommendation" },
  { value: "alert", label: "Alert" },
];

const GROUP_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "professional", label: "Professional" },
  { value: "social", label: "Social" },
  { value: "travel", label: "Travel" },
  { value: "culture", label: "Culture" },
  { value: "activism", label: "Activism" },
  { value: "health", label: "Health" },
];

const CATEGORY_COLORS: Record<string, string> = {
  professional: "#1D4ED8",
  social: "#7B2D8B",
  culture: "#C9922B",
  activism: "#DC2626",
  travel: "#2D7A4F",
  health: "#0891B2",
  general: "#3B1F0E",
};

const CATEGORY_ICONS: Record<string, string> = {
  professional: "briefcase",
  social: "users",
  culture: "heart",
  activism: "shield",
  travel: "map",
  health: "activity",
  general: "grid",
};

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

function GroupCard({ group, onPress, onJoinLeave }: {
  group: Group;
  onPress: () => void;
  onJoinLeave: (g: Group) => void;
}) {
  const colors = useColors();
  const catColor = CATEGORY_COLORS[group.category] ?? "#3B1F0E";
  const catIcon = (CATEGORY_ICONS[group.category] ?? "grid") as any;

  return (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.groupIconWrap, { backgroundColor: catColor + "18" }]}>
        <Feather name={catIcon} size={22} color={catColor} />
      </View>
      <View style={styles.groupInfo}>
        <Text style={[styles.groupName, { color: colors.foreground }]} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={[styles.groupMeta, { color: colors.mutedForeground }]} numberOfLines={2}>
          {group.description ?? `A community group for ${group.category}`}
        </Text>
        <View style={styles.groupFooter}>
          <View style={styles.groupMembersRow}>
            <Feather name="users" size={11} color={colors.mutedForeground} />
            <Text style={[styles.groupMemberCount, { color: colors.mutedForeground }]}>
              {group.memberCount.toLocaleString()}
            </Text>
          </View>
          {(group.city || group.state) && (
            <View style={styles.groupMembersRow}>
              <Feather name="map-pin" size={11} color={colors.mutedForeground} />
              <Text style={[styles.groupMemberCount, { color: colors.mutedForeground }]}>
                {[group.city, group.state].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.joinChip,
          { backgroundColor: group.isMember ? colors.secondary : catColor, borderColor: group.isMember ? colors.border : catColor },
        ]}
        onPress={() => onJoinLeave(group)}
        activeOpacity={0.8}
      >
        <Text style={[styles.joinChipText, { color: group.isMember ? colors.foreground : "#FFFFFF" }]}>
          {group.isMember ? "Joined" : "Join"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function CommunityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("Feed");
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("general");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [groupCategory, setGroupCategory] = useState("all");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>(undefined);
  const inputRef = useRef<TextInput>(null);

  const { groups, isLoading: groupsLoading, refetch: refetchGroups, join, leave } = useGroups();
  const [eventsCategory, setEventsCategory] = useState("All");
  const [eventsTimeFilter, setEventsTimeFilter] = useState("Upcoming");
  const { events, isLoading: eventsLoading, refetch: refetchEvents } = useEvents({ category: eventsCategory });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadPosts = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch(`${getApiBase()}/api/community/posts`);
      if (res.ok) {
        const data = await res.json() as { posts: Record<string, unknown>[] };
        setPosts((data.posts ?? []).map(toPostCard));
      } else {
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadPosts();
    void refetchGroups();
    void refetchEvents();
  };

  const filteredPosts =
    activeTab === "Recommendations"
      ? posts.filter((p) => p.category === "recommendation")
      : activeTab === "Alerts"
      ? posts.filter((p) => p.category === "alert")
      : posts;

  const filteredGroups =
    groupCategory === "all" ? groups : groups.filter((g) => g.category === groupCategory);

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

  const handleJoinLeave = async (group: Group) => {
    if (!isAuthenticated) {
      setUpgradeFeature("Joining Groups");
      setShowUpgrade(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (group.isMember) {
      await leave(group.id);
    } else {
      await join(group.id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Community</Text>
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: colors.secondary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert("Search Community", "Use the category filters below to browse groups, events, and posts by topic.");
          }}
        >
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

      {activeTab === "Events" ? (
        <View style={{ flex: 1 }}>
          <View style={[styles.categoryScroll, { borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
              {["Upcoming", "This Week", "This Month"].map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.categoryChip, { backgroundColor: eventsTimeFilter === f ? colors.primary : colors.secondary, borderColor: eventsTimeFilter === f ? colors.primary : colors.border }]}
                  onPress={() => setEventsTimeFilter(f)}
                >
                  <Text style={[styles.categoryChipText, { color: eventsTimeFilter === f ? "#FFFFFF" : colors.foreground }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <FlatList
            data={events}
            keyExtractor={(e) => e.id}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
            refreshControl={<RefreshControl refreshing={eventsLoading} onRefresh={refetchEvents} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="calendar" size={40} color={colors.muted} />
                <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No events yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Because the best journeys are shared — check back soon for events near you.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <EventCard
                event={item}
                onPress={() => router.push({ pathname: "/event/[id]", params: { id: item.id } })}
              />
            )}
          />
        </View>
      ) : activeTab === "Groups" ? (
        <View style={{ flex: 1 }}>
          {/* Category filter */}
          <FlatList
            horizontal
            data={GROUP_CATEGORIES}
            keyExtractor={(c) => c.value}
            showsHorizontalScrollIndicator={false}
            style={[styles.categoryScroll, { borderBottomColor: colors.border }]}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: groupCategory === item.value ? colors.primary : colors.secondary,
                    borderColor: groupCategory === item.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setGroupCategory(item.value)}
              >
                <Text style={[styles.categoryChipText, { color: groupCategory === item.value ? "#FFFFFF" : colors.foreground }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />

          <FlatList
            data={filteredGroups}
            keyExtractor={(g) => String(g.id)}
            contentContainerStyle={[styles.groupsList, { paddingBottom: bottomPad + 100 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              groupsLoading ? (
                <View style={styles.empty}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <View style={styles.empty}>
                  <Feather name="users" size={40} color={colors.muted} />
                  <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No groups here yet</Text>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Every community starts somewhere. Try a different category or be the one who starts this one.
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <GroupCard
                group={item}
                onPress={() => router.push({ pathname: "/group/[id]", params: { id: String(item.id) } })}
                onJoinLeave={handleJoinLeave}
              />
            )}
          />

          {/* Create group FAB */}
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 90 }]}
            activeOpacity={0.85}
            onPress={() => {
              if (!isAuthenticated) {
                setUpgradeFeature("Community Groups");
                setShowUpgrade(true);
                return;
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Start a Group", "Ready to bring your community together? Email us at hello@mappingwithmelanin.com to get your group listed.", [{ text: "OK" }]);
            }}
          >
            <Feather name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
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
                <Feather
                  name={loadError ? "wifi-off" : "users"}
                  size={40}
                  color={colors.muted}
                />
                <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
                  {loading ? "Loading…" : loadError ? "Couldn't load posts" : "Start the conversation"}
                </Text>
                {!loading && loadError && (
                  <TouchableOpacity
                    onPress={() => { setLoading(true); void loadPosts(); }}
                    style={[styles.retryBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <Feather name="refresh-cw" size={14} color={colors.primary} />
                    <Text style={[styles.retryTxt, { color: colors.primary }]}>Tap to retry</Text>
                  </TouchableOpacity>
                )}
                {!loading && !loadError && (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Shared stories power this community. Be the first to post something meaningful.
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
              if (!isAuthenticated) {
                setUpgradeFeature("Community Posts");
                setShowUpgrade(true);
                return;
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowCompose(true);
              setTimeout(() => inputRef.current?.focus(), 150);
            }}
          >
            <Feather name="edit-3" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={upgradeFeature}
      />

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
                    styles.filterChip,
                    { borderColor: newPostCategory === opt.value ? colors.primary : colors.border },
                    newPostCategory === opt.value && { backgroundColor: colors.primary + "18" },
                  ]}
                  onPress={() => setNewPostCategory(opt.value)}
                >
                  <Text style={[styles.filterChipText, { color: newPostCategory === opt.value ? colors.primary : colors.mutedForeground }]}>
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
  tabText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  categoryScroll: { borderBottomWidth: 1, maxHeight: 54 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  categoryChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  groupsList: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  groupIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  groupInfo: { flex: 1, gap: 3 },
  groupName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  groupMeta: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  groupFooter: { flexDirection: "row", gap: 12, marginTop: 2 },
  groupMembersRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  groupMemberCount: { fontFamily: "Inter_400Regular", fontSize: 11 },
  joinChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  joinChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  list: { paddingHorizontal: 16, paddingTop: 16 },
  alertSection: { marginBottom: 4 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  retryBtn: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  retryTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
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
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
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
