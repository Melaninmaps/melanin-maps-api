import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import { useColors } from "../hooks/useColors";

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

interface FamilyPost {
  id: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  category: string;
  ratingReason?: string | null;
  createdAt: string;
}

interface FamilyEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  isFree: boolean;
  price: string;
  ratingReason?: string | null;
}

const FAMILY_CATEGORIES = [
  { label: "All", value: "all", icon: "grid" },
  { label: "Travel", value: "travel", icon: "map" },
  { label: "Culture", value: "culture", icon: "star" },
  { label: "Education", value: "education", icon: "book-open" },
  { label: "Events", value: "events", icon: "calendar" },
  { label: "Business", value: "business", icon: "briefcase" },
];

export default function FamilyModeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [posts, setPosts] = useState<FamilyPost[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "events">("posts");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [postsRes, eventsRes] = await Promise.all([
        fetch(`${getApiBase()}/api/family/mode/posts`, { headers }),
        fetch(`${getApiBase()}/api/family/mode/events`, { headers }),
      ]);
      if (postsRes.ok) {
        const data = await postsRes.json() as { posts: FamilyPost[] };
        setPosts(data.posts ?? []);
      }
      if (eventsRes.ok) {
        const data = await eventsRes.json() as { events: FamilyEvent[] };
        setEvents(data.events ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  const filteredPosts = category === "all"
    ? posts
    : posts.filter((p) => p.category === category);

  const filteredEvents = category === "all"
    ? events
    : events.filter((e) => e.category.toLowerCase() === category);

  const renderPostCard = (post: FamilyPost) => (
    <View key={post.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: post.authorColor + "22" }]}>
          <Text style={[styles.avatarText, { color: post.authorColor }]}>{post.authorInitials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.authorName, { color: colors.foreground }]}>{post.authorName}</Text>
          <View style={[styles.ratingPill, { backgroundColor: "#DCFCE7", borderColor: "#16A34A40" }]}>
            <Text style={styles.ratingEmoji}>🟢</Text>
            <Text style={[styles.ratingText, { color: "#16A34A" }]}>Everyone</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.postContent, { color: colors.foreground }]} numberOfLines={4}>
        {post.content}
      </Text>
      {post.ratingReason ? (
        <Text style={[styles.ratingReason, { color: colors.mutedForeground }]}>
          ℹ️ {post.ratingReason}
        </Text>
      ) : null}
      <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
        {new Date(post.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  const renderEventCard = (event: FamilyEvent) => (
    <TouchableOpacity key={event.id} activeOpacity={0.85} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.eventHeader}>
        <View style={[styles.eventDateBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.eventDateText, { color: colors.primary }]}>{event.date}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={2}>{event.title}</Text>
          <Text style={[styles.eventLocation, { color: colors.mutedForeground }]}>
            <Feather name="map-pin" size={11} color={colors.mutedForeground} /> {event.location}
          </Text>
        </View>
      </View>
      <View style={styles.eventFooter}>
        <View style={[styles.ratingPill, { backgroundColor: "#DCFCE7", borderColor: "#16A34A40" }]}>
          <Text style={styles.ratingEmoji}>🟢</Text>
          <Text style={[styles.ratingText, { color: "#16A34A" }]}>Family Friendly</Text>
        </View>
        <Text style={[styles.price, { color: event.isFree ? "#16A34A" : colors.foreground }]}>
          {event.isFree ? "Free" : event.price}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>🤎 Family Mode</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Curated for all ages</Text>
        </View>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); void load(); }}>
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} style={[styles.categoryBar, { borderBottomColor: colors.border }]} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 10 }}>
        {FAMILY_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            activeOpacity={0.85}
            onPress={() => { setCategory(c.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.chip, { borderColor: category === c.value ? colors.primary : colors.border, backgroundColor: category === c.value ? colors.primary + "15" : "transparent" }]}
          >
            <Text style={[styles.chipText, { color: category === c.value ? colors.primary : colors.mutedForeground }]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(["posts", "events"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.85}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab === "posts" ? "Community Posts" : "Events"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading family content…</Text>
        </View>
      ) : (
        <ScrollView
        keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
        >
          {activeTab === "posts" && (
            filteredPosts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No family posts yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Community posts rated &quot;Everyone&quot; will appear here — travel stories, cultural discoveries, and community highlights.
                </Text>
              </View>
            ) : filteredPosts.map(renderPostCard)
          )}
          {activeTab === "events" && (
            filteredEvents.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No family events yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Events marked &quot;Everyone&quot; or &quot;Family Friendly&quot; will show here.
                </Text>
              </View>
            ) : filteredEvents.map(renderEventCard)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  backBtn: { padding: 4 },
  categoryBar: { borderBottomWidth: 1, flexGrow: 0 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  tabBar: {
    flexDirection: "row", borderBottomWidth: 1,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 10 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cardHeader: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  authorName: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 4 },
  ratingPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, borderWidth: 1, alignSelf: "flex-start",
  },
  ratingEmoji: { fontSize: 10 },
  ratingText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  postContent: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: 6 },
  ratingReason: { fontFamily: "Inter_400Regular", fontSize: 12, fontStyle: "italic", marginBottom: 6 },
  timestamp: { fontFamily: "Inter_400Regular", fontSize: 11 },
  eventHeader: { flexDirection: "row", gap: 10, marginBottom: 10 },
  eventDateBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start", minWidth: 60, alignItems: "center" },
  eventDateText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  eventTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  eventLocation: { fontFamily: "Inter_400Regular", fontSize: 12 },
  eventFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginBottom: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center", color: "#888" },
});
