import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
  return Platform.OS === "web" ? "" : `http://${host}:8080`;
}

function formatTimeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const TIER_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  free: { label: "Community Overview", color: "#6B7280", icon: "book-open" },
  navigator: { label: "Explorer+ Deep Dive", color: "#2D7A4F", icon: "layers" },
  trailblazer: { label: "Trailblazer Research Brief", color: "#7B2D8B", icon: "award" },
};

type TopicBrief = {
  topic: string;
  topicLabel: string;
  tier: string;
  content: string;
  sourceNote: string | null;
  upgradeNote: string | null;
};

type Post = {
  id: string; authorName: string; authorInitials: string; authorColor: string;
  content: string; category: string; upvotes: number; commentsCount: number;
  createdAt: string; isPrivateTopic?: boolean;
};

function BriefSection({ brief, tier, onUpgrade }: { brief: TopicBrief; tier: string; onUpgrade: () => void }) {
  const colors = useColors();
  const meta = TIER_LABELS[tier] ?? TIER_LABELS.free;
  const [expanded, setExpanded] = useState(true);

  // Split AI content into paragraphs / sections for better readability
  const paragraphs = brief.content.split("\n").filter(l => l.trim().length > 0);

  return (
    <View style={[s.briefCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Brief header */}
      <TouchableOpacity style={s.briefHeader} onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <View style={[s.briefIconWrap, { backgroundColor: meta.color + "18" }]}>
          <Feather name={meta.icon as any} size={16} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.briefTierLabel, { color: meta.color }]}>{meta.label}</Text>
          <Text style={[s.briefTopicTitle, { color: colors.foreground }]}>{brief.topicLabel}</Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {expanded && (
        <View style={s.briefBody}>
          {paragraphs.map((para, i) => {
            const isHeader = para.startsWith("**") && para.endsWith("**");
            const cleaned = para.replace(/\*\*/g, "");
            return (
              <Text
                key={i}
                style={[
                  isHeader ? [s.briefSectionHeader, { color: meta.color }] : [s.briefPara, { color: colors.foreground }],
                ]}
              >
                {cleaned}
              </Text>
            );
          })}

          {brief.sourceNote && (
            <View style={[s.sourceNote, { backgroundColor: meta.color + "10", borderColor: meta.color + "30" }]}>
              <Feather name="book" size={12} color={meta.color} />
              <Text style={[s.sourceNoteText, { color: meta.color }]}>Sources include: {brief.sourceNote}</Text>
            </View>
          )}
        </View>
      )}

      {brief.upgradeNote && (
        <TouchableOpacity style={[s.upgradeRow, { borderTopColor: colors.border }]} onPress={onUpgrade} activeOpacity={0.85}>
          <Feather name="zap" size={13} color="#F59E0B" />
          <Text style={s.upgradeText}>{brief.upgradeNote}</Text>
          <Feather name="chevron-right" size={14} color="#F59E0B" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function PostRow({ post }: { post: Post }) {
  const colors = useColors();
  return (
    <View style={[s.postRow, { borderBottomColor: colors.border }]}>
      <View style={[s.postAvatar, { backgroundColor: post.authorColor }]}>
        <Text style={s.postInitials}>{post.authorInitials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
          <Text style={[s.postAuthor, { color: colors.foreground }]}>{post.authorName}</Text>
          {post.isPrivateTopic && (
            <View style={s.privateBadge}>
              <Feather name="lock" size={9} color="#6B7280" />
              <Text style={s.privateBadgeText}>private</Text>
            </View>
          )}
          <Text style={[s.postTime, { color: colors.mutedForeground }]}>{formatTimeAgo(post.createdAt)}</Text>
        </View>
        <Text style={[s.postContent, { color: colors.foreground }]} numberOfLines={4}>{post.content}</Text>
        <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name="arrow-up" size={12} color={colors.mutedForeground} />
            <Text style={[s.postMeta, { color: colors.mutedForeground }]}>{post.upvotes}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name="message-circle" size={12} color={colors.mutedForeground} />
            <Text style={[s.postMeta, { color: colors.mutedForeground }]}>{post.commentsCount}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function TopicFeedScreen() {
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [loadingBrief, setLoadingBrief] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [brief, setBrief] = useState<TopicBrief | null>(null);
  const [tier, setTier] = useState("free");
  const [posts, setPosts] = useState<Post[]>([]);
  const briefFetched = useRef(false);

  useEffect(() => {
    if (!topic || briefFetched.current) return;
    briefFetched.current = true;

    // Fetch tier-based AI brief
    const fetchBrief = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_session_token");
        const res = await fetch(
          `${getApiBase()}/api/topic-brief/${encodeURIComponent(topic)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (res.ok) {
          const data = await res.json() as TopicBrief;
          setBrief(data);
          setTier(data.tier);
        }
      } catch { /* ignore */ } finally {
        setLoadingBrief(false);
      }
    };

    // Fetch posts tagged with this topic
    const fetchPosts = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_session_token");
        const res = await fetch(
          `${getApiBase()}/api/community/posts?topicTag=${encodeURIComponent(topic)}&limit=50`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (res.ok) {
          const data = await res.json() as { posts?: Post[] };
          setPosts(data.posts ?? []);
        }
      } catch { /* ignore */ } finally {
        setLoadingPosts(false);
      }
    };

    fetchBrief();
    fetchPosts();
  }, [topic]);

  const displayTopic = topic ? topic.split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ") : "";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>{displayTopic}</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Topic Feed</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        keyboardDismissMode="on-drag"
        data={posts}
        keyExtractor={p => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={
          <View>
            {/* AI Brief */}
            <View style={{ padding: 16 }}>
              {loadingBrief ? (
                <View style={[s.briefCard, s.briefLoading, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={[s.briefLoadingText, { color: colors.mutedForeground }]}>
                    Pulling relevant research & news…
                  </Text>
                </View>
              ) : brief ? (
                <BriefSection
                  brief={brief}
                  tier={tier}
                  onUpgrade={() => router.push("/membership" as any)}
                />
              ) : null}
            </View>

            {/* Community posts header */}
            <View style={[s.postsSectionHeader, { borderBottomColor: colors.border }]}>
              <Feather name="users" size={15} color={colors.primary} />
              <Text style={[s.postsSectionTitle, { color: colors.foreground }]}>Community Posts</Text>
              <View style={[s.postsCount, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[s.postsCountText, { color: colors.primary }]}>{posts.length}</Text>
              </View>
            </View>

            {!loadingPosts && posts.length === 0 && (
              <View style={s.emptyState}>
                <Feather name="message-square" size={36} color={colors.muted} />
                <Text style={[s.emptyTitle, { color: colors.foreground }]}>No posts yet on this topic</Text>
                <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                  Tag a post with &quot;{displayTopic}&quot; in the community feed to start the conversation.
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => <PostRow post={item} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  briefCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  briefLoading: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20 },
  briefLoadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  briefHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  briefIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  briefTierLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 },
  briefTopicTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  briefBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  briefSectionHeader: { fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 8 },
  briefPara: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sourceNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  sourceNoteText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  upgradeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  upgradeText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", color: "#F59E0B" },
  postsSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  postsSectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
  postsCount: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  postsCountText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  postRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  postInitials: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  postAuthor: { fontSize: 13, fontFamily: "Inter_700Bold" },
  postTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  postContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  postMeta: { fontSize: 12, fontFamily: "Inter_500Medium" },
  privateBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: "#F3F4F6" },
  privateBadgeText: { fontSize: 9, fontFamily: "Inter_500Medium", color: "#6B7280" },
  emptyState: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21, color: "#6B7280" },
});
