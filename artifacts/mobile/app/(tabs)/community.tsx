import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertBanner } from "@/components/AlertBanner";
import { BusinessMentionPicker } from "@/components/BusinessMentionPicker";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { PostDetailModal } from "@/components/PostDetailModal";
import { UserProfileModal } from "@/components/UserProfileModal";
import { EventCard } from "@/components/EventCard";
import { ALERTS, EVENT_CATEGORIES } from "@/constants/data";
import type { CommunityPost } from "@/constants/types";
import { useColors } from "@/hooks/useColors";
import { useEvents } from "@/hooks/useEvents";
import { useGroups, type Group } from "@/hooks/useGroups";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAuth } from "@/lib/auth";
import { UpgradeModal } from "@/components/UpgradeModal";
import { BrandQuoteBanner } from "@/components/BrandQuoteBanner";
import { getDailyQuoteText } from "@/constants/brandQuotes";
import { RecommendationNudge } from "@/components/RecommendationNudge";

const TABS = ["Feed", "Videos", "Events", "Circles ⭐", "Requests 🙋", "Collections 📚", "Challenges 🏆", "Groups", "Resources", "Alerts", "Recommendations"];

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
  let mediaUrls: string[] | undefined;
  if (raw.mediaUrls && typeof raw.mediaUrls === "string") {
    try { mediaUrls = JSON.parse(raw.mediaUrls) as string[]; } catch { /* ignore */ }
  }
  return {
    id: raw.id as string,
    author: (raw.authorName as string) ?? "Community Member",
    authorInitials: (raw.authorInitials as string) ?? "CM",
    authorColor: (raw.authorColor as string) ?? "#3B1F0E",
    authorId: (raw.authorId as string) ?? undefined,
    content: raw.content as string,
    likes: (raw.upvotes as number) ?? 0,
    comments: (raw.commentsCount as number) ?? 0,
    timeAgo: formatTimeAgo(raw.createdAt as string),
    category: (raw.category === "recommendation" || raw.category === "alert" || raw.category === "question" ? raw.category : "discussion") as CommunityPost["category"],
    postType: ((raw.postType as string) === "business" || (raw.postType as string) === "question" || (raw.postType as string) === "saved_place" || (raw.postType as string) === "safety" || (raw.postType as string) === "travel"
      ? raw.postType as CommunityPost["postType"]
      : "community"),
    liked: false,
    businessId: (raw.businessId as string) ?? undefined,
    businessName: (raw.businessName as string) ?? undefined,
    businessLink: (raw.businessLink as string) ?? undefined,
    mediaUrls,
    savedPlaceId: (raw.savedPlaceId as string) ?? undefined,
    locationTag: (raw.locationTag as string) ?? undefined,
    locationType: (raw.locationType as string) ?? undefined,
    topicTag: (raw.topicTag as string) ?? undefined,
    isPrivateTopic: !!(raw.isPrivateTopic),
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
  const params = useLocalSearchParams<{ compose?: string; caption?: string }>();
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
  const CHAR_LIMITS: Record<string, number> = {
    community: 1000,
    business: 1500,
    question: 750,
    safety: 500,
    travel: 10000,
  };
  const [newPostType, setNewPostType] = useState<"community" | "question" | "business" | "safety" | "travel">("community");
  const [newPostBusinessLink, setNewPostBusinessLink] = useState("");
  const [newPostVisibility, setNewPostVisibility] = useState<"public" | "followers_only">("public");
  const [feedMode, setFeedMode] = useState<"everyone" | "following">("everyone");
  const [mediaAttachments, setMediaAttachments] = useState<{ uri: string; type: "image" | "video"; uploaded?: string }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [newPostLocationTag, setNewPostLocationTag] = useState("");
  const [newPostLocationType, setNewPostLocationType] = useState("city");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [newPostTopicTag, setNewPostTopicTag] = useState("");
  const [newPostIsPrivateTopic, setNewPostIsPrivateTopic] = useState(false);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [groupCategory, setGroupCategory] = useState("all");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>(undefined);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupCreateName, setGroupCreateName] = useState("");
  const [groupCreateDesc, setGroupCreateDesc] = useState("");
  const [groupCreateCategory, setGroupCreateCategory] = useState("social");
  const [groupCreateCity, setGroupCreateCity] = useState("");
  const [groupCreateAudience, setGroupCreateAudience] = useState<string[]>([]);
  const [groupCreatePrivate, setGroupCreatePrivate] = useState(false);
  const [groupCreateSubmitting, setGroupCreateSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { businesses } = useBusinesses();
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const handlePostTextChange = (t: string) => {
    setNewPostText(t);
    const match = t.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const handleMentionSelect = (businessName: string) => {
    const updated = newPostText.replace(/@(\w*)$/, `@${businessName} `);
    setNewPostText(updated);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const { groups, isLoading: groupsLoading, refetch: refetchGroups, join, leave } = useGroups();
  const [eventsCategory, setEventsCategory] = useState("All");
  const [eventsTimeFilter, setEventsTimeFilter] = useState("Upcoming");
  const { events, isLoading: eventsLoading, refetch: refetchEvents } = useEvents({ category: eventsCategory });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadPosts = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch(`${getApiBase()}/api/community/posts?feed=${feedMode}`);
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
  }, [feedMode]);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  useEffect(() => {
    if (params.compose === "true") {
      if (params.caption) setNewPostText(decodeURIComponent(params.caption));
      setShowCompose(true);
    }
  }, [params.compose, params.caption]);

  const handleCreateGroup = async () => {
    if (!groupCreateName.trim()) return;
    setGroupCreateSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = getApiBase();
      if (!token || !apiBase) return;
      const res = await fetch(`${apiBase}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: groupCreateName.trim(),
          description: groupCreateDesc.trim() || undefined,
          category: groupCreateCategory,
          city: groupCreateCity.trim() || undefined,
          isPrivate: groupCreatePrivate,
          audiencePreferences: groupCreateAudience.length > 0 ? groupCreateAudience : undefined,
        }),
      });
      if (res.ok) {
        setShowCreateGroup(false);
        setGroupCreateName("");
        setGroupCreateDesc("");
        setGroupCreateCategory("social");
        setGroupCreateCity("");
        setGroupCreateAudience([]);
        setGroupCreatePrivate(false);
        void refetchGroups();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
    setGroupCreateSubmitting(false);
  };

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

  const pickAndUploadMedia = async (kind: "image" | "video") => {
    if (Platform.OS === "web") { Alert.alert("Not supported", "Media uploads are available on the mobile app."); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Allow access to your media library."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === "video" ? ["videos"] : ["images"],
      allowsMultipleSelection: kind === "image",
      selectionLimit: kind === "image" ? 5 : 1,
      allowsEditing: kind === "video" ? false : false,
      quality: 0.85,
      videoMaxDuration: 120,
    });
    if (result.canceled || !result.assets.length) return;
    setUploadingMedia(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const uploaded: { uri: string; type: "image" | "video"; uploaded: string }[] = [];
      for (const asset of result.assets) {
        const formData = new FormData();
        const fieldName = kind === "image" ? "image" : "video";
        const mime = asset.mimeType ?? (kind === "image" ? "image/jpeg" : "video/mp4");
        const ext = mime.split("/")[1] ?? (kind === "image" ? "jpg" : "mp4");
        formData.append(fieldName, { uri: asset.uri, type: mime, name: `${fieldName}.${ext}` } as unknown as Blob);
        const res = await fetch(`${getApiBase()}/api/community/media/upload/${kind}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (res.ok) {
          const data = await res.json() as { url: string };
          uploaded.push({ uri: asset.uri, type: kind, uploaded: data.url });
        } else {
          const err = await res.json() as { error?: string; code?: string };
          if (err.code === "TIER_LIMIT_REACHED") {
            setUpgradeFeature(kind === "video" ? "Video Posts" : "Image Posts");
            setShowUpgrade(true);
            return;
          }
          Alert.alert("Upload failed", err.error ?? "Please try again.");
          return;
        }
      }
      setMediaAttachments((prev) => [...prev, ...uploaded].slice(0, 5));
    } catch {
      Alert.alert("Upload failed", "Please try again.");
    } finally {
      setUploadingMedia(false);
    }
  };

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
        body: JSON.stringify({
          content: newPostText.trim(),
          category: newPostCategory,
          postType: newPostType,
          businessLink: newPostType === "business" && newPostBusinessLink.trim() ? newPostBusinessLink.trim() : undefined,
          visibility: newPostVisibility,
          mediaUrls: mediaAttachments.filter((m) => m.uploaded).map((m) => m.uploaded!),
          locationTag: newPostLocationTag.trim() || undefined,
          locationType: newPostLocationTag.trim() ? newPostLocationType : undefined,
          topicTag: newPostTopicTag.trim() || undefined,
          isPrivateTopic: newPostTopicTag.trim() ? newPostIsPrivateTopic : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { post: Record<string, unknown> };
        setPosts((prev) => [toPostCard(data.post), ...prev]);
        setNewPostText("");
        setNewPostCategory("general");
        setNewPostType("community");
        setNewPostBusinessLink("");
        setNewPostVisibility("public");
        setNewPostLocationTag("");
        setNewPostLocationType("city");
        setNewPostTopicTag("");
        setNewPostIsPrivateTopic(false);
        setShowTopicPicker(false);
        setMediaAttachments([]);
        setShowCompose(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const err = await res.json() as { error?: string; code?: string };
        if (err.code === "TIER_LIMIT_REACHED") {
          setShowCompose(false);
          setUpgradeFeature(newPostType === "business" ? "Business Posts" : "Unlimited Community Posts");
          setShowUpgrade(true);
        } else {
          Alert.alert("Error", err.error ?? "Could not post. Please try again.");
        }
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabRow, { borderBottomColor: colors.border }]}
        contentContainerStyle={{ flexDirection: "row" }}
        accessibilityRole="tablist"
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            accessibilityLabel={tab}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === "Videos" ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottomPad + 40 }} showsVerticalScrollIndicator={false}>
          {/* Hero entry card */}
          <TouchableOpacity
            style={[styles.videosHero, { backgroundColor: "#1A3B2B" }]}
            activeOpacity={0.88}
            onPress={() => router.push("/travel-videos")}
          >
            <View style={styles.videosHeroTop}>
              <Text style={{ fontSize: 32 }}>🎥</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.videosHeroTitle}>Travel Videos</Text>
                <Text style={styles.videosHeroSub}>
                  {getDailyQuoteText("travel", 1)}
                </Text>
              </View>
              <Feather name="arrow-right" size={20} color="#C9922B" />
            </View>
            <View style={styles.videosDestRow}>
              {["🇧🇷 Brazil", "🌆 Atlanta", "🇬🇭 Accra", "🗽 Harlem", "🇯🇲 Jamaica"].map((d) => (
                <View key={d} style={styles.videosDestChip}>
                  <Text style={styles.videosDestTxt}>{d}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Free vs Premium split */}
          <View style={{ gap: 10 }}>
            <Text style={[styles.videosSectionTitle, { color: colors.foreground }]}>What you can do</Text>
            <View style={[styles.videosTierCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.videosTierHeader}>
                <Text style={{ fontSize: 16 }}>👥</Text>
                <Text style={[styles.videosTierName, { color: colors.foreground }]}>Community Member</Text>
                <View style={[styles.videosFreeTag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.videosFreeTagTxt, { color: colors.mutedForeground }]}>Free</Text>
                </View>
              </View>
              {["Upload up to 5 travel videos", "Upload photos", "Create posts & share travel experiences", "Appear in destination search results"].map((f, i) => (
                <View key={i} style={styles.videosPerkRow}>
                  <Feather name="check" size={13} color={colors.success} />
                  <Text style={[styles.videosPerkTxt, { color: colors.mutedForeground }]}>{f}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.videosTierCard, { backgroundColor: "#1A3B2B", borderColor: "#2D7A4F44" }]}>
              <View style={styles.videosTierHeader}>
                <Text style={{ fontSize: 16 }}>⭐</Text>
                <Text style={[styles.videosTierName, { color: "#fff" }]}>Community Premium</Text>
                <View style={[styles.videosPremiumTag, { backgroundColor: "#C9922B22", borderColor: "#C9922B44" }]}>
                  <Text style={[styles.videosFreeTagTxt, { color: "#C9922B" }]}>$7.99/mo</Text>
                </View>
              </View>
              {["Unlimited video uploads", "Longer videos (up to 10 min)", "Featured travel guides", "Creator analytics — views, likes, saves", "AI-generated captions & hashtags", "Destination collections", "Creator badge", "Priority placement in destination searches", "Eligible for future creator partnerships"].map((f, i) => (
                <View key={i} style={styles.videosPerkRow}>
                  <Feather name="check-circle" size={13} color="#C9922B" />
                  <Text style={[styles.videosPerkTxt, { color: "#ffffffbb" }]}>{f}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.videosUpgradeBtn, { backgroundColor: "#C9922B" }]}
                onPress={() => router.push("/membership")}
                activeOpacity={0.85}
              >
                <Text style={styles.videosUpgradeTxt}>Start 90-day Free Trial</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CTA to full screen */}
          <TouchableOpacity
            style={[styles.videosExploreBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/travel-videos")}
            activeOpacity={0.8}
          >
            <Feather name="film" size={16} color={colors.primary} />
            <Text style={[styles.videosExploreTxt, { color: colors.primary }]}>Browse all travel videos</Text>
            <Feather name="arrow-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      ) : activeTab === "Events" ? (
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
      ) : activeTab === "Circles ⭐" ? (
        <CirclesTab colors={colors} router={router} isAuthenticated={isAuthenticated} bottomPad={bottomPad} />
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

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.composeBar, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 4 }]}
            onPress={() => {
              if (!isAuthenticated) {
                setUpgradeFeature("Community Groups");
                setShowUpgrade(true);
                return;
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreateGroup(true);
            }}
          >
            <View style={[styles.composeBarAvatar, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="users" size={15} color={colors.primary} />
            </View>
            <Text style={[styles.composeBarPlaceholder, { color: colors.mutedForeground }]}>
              Start a new group for your community
            </Text>
            <View style={[styles.composeBarAtBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "25" }]}>
              <Feather name="plus" size={13} color={colors.primary} />
            </View>
          </TouchableOpacity>

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
              setShowCreateGroup(true);
            }}
          >
            <Feather name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : activeTab === "Resources" ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 40, gap: 14 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Health Hub card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: colors.card, borderColor: "#0891B233" }]}
            onPress={() => router.push("/health-hub" as never)}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "#0891B218" }]}>
              <Feather name="shield" size={22} color="#0891B2" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: colors.foreground }]}>Health Hub</Text>
              <Text style={[styles.resSpacesSub, { color: colors.mutedForeground }]}>
                Evidence-based health articles curated by verified Black physicians. Follow topics that matter to you.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Community Spaces card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: colors.card, borderColor: "#2D7A4F33" }]}
            onPress={() => router.push("/spaces")}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "#2D7A4F18" }]}>
              <Feather name="home" size={22} color="#2D7A4F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: colors.foreground }]}>Community Spaces</Text>
              <Text style={[styles.resSpacesSub, { color: colors.mutedForeground }]}>
                Browse spaces for rent, sale &amp; business shared by the community. Know a great spot? Post it.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Trip Journals card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: "#1A3B2B", borderColor: "#2D7A4F55" }]}
            onPress={() => router.push("/journals")}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <Feather name="book-open" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: "#FFFFFF" }]}>Trip Journals</Text>
              <Text style={[styles.resSpacesSub, { color: "rgba(255,255,255,0.75)" }]}>
                Community travel guides — real trips from real people who look like you.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {/* Community Lists card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: "#3B1F0E", borderColor: "#C9922B55" }]}
            onPress={() => router.push("/community-lists" as never)}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <Feather name="list" size={22} color="#C9922B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: "#FFFFFF" }]}>Community Lists</Text>
              <Text style={[styles.resSpacesSub, { color: "rgba(255,255,255,0.75)" }]}>
                Curated business picks — brunch spots, date nights, family-friendly gems &amp; more.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {/* Business Challenges card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: colors.card, borderColor: "#2D7A4F33" }]}
            onPress={() => router.push("/challenges" as never)}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "#2D7A4F18" }]}>
              <Feather name="award" size={22} color="#2D7A4F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: colors.foreground }]}>Business Challenges</Text>
              <Text style={[styles.resSpacesSub, { color: colors.mutedForeground }]}>
                Restaurant Week, Black Business Month &amp; more — join campaigns, earn points &amp; badges.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* My Community card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: colors.card, borderColor: "#C9922B33" }]}
            onPress={() => router.push("/my-community")}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "#C9922B18" }]}>
              <Feather name="map-pin" size={22} color="#C9922B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: colors.foreground }]}>My Community</Text>
              <Text style={[styles.resSpacesSub, { color: colors.mutedForeground }]}>
                Save neighborhoods &amp; ZIP codes. Get notified when events happen near you.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Crisis banner */}
          <View style={[styles.resCrisisBanner, { backgroundColor: "#DC2626" }]}>
            <Feather name="alert-circle" size={20} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.resCrisisTitle}>In a crisis? Get help now.</Text>
              <Text style={styles.resCrisisSub}>Free, confidential, available 24/7</Text>
            </View>
          </View>
          <View style={styles.resRow}>
            <TouchableOpacity style={[styles.resCrisisBtn, { backgroundColor: "#DC2626" }]} onPress={() => Linking.openURL("tel:988").catch(() => {})}>
              <Feather name="phone-call" size={16} color="#FFF" />
              <Text style={styles.resCrisisBtnText}>Call / Text 988</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resCrisisBtn, { backgroundColor: "#B91C1C" }]} onPress={() => Linking.openURL("sms:741741").catch(() => {})}>
              <Feather name="message-circle" size={16} color="#FFF" />
              <Text style={styles.resCrisisBtnText}>Text HOME to 741741</Text>
            </TouchableOpacity>
          </View>

          {/* Section: Black Mental Health */}
          <Text style={[styles.resSectionTitle, { color: colors.foreground }]}>Black Mental Health</Text>
          {[
            { name: "Black Mental Health Alliance", url: "https://blackmentalhealth.com", color: "#7B2D8B" },
            { name: "Therapy for Black Girls", url: "https://therapyforblackgirls.com", color: "#7B2D8B" },
            { name: "Therapy for Black Men", url: "https://therapyforblackmen.org", color: "#4C1D95" },
            { name: "Boris Lawrence Henson Foundation", url: "https://borislhensonfoundation.org", color: "#4C1D95" },
            { name: "Loveland Foundation", url: "https://thelovelandfoundation.org", color: "#7B2D8B" },
          ].map((r) => (
            <TouchableOpacity
              key={r.name}
              style={[styles.resCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Linking.openURL(r.url).catch(() => {})}
              activeOpacity={0.75}
            >
              <View style={[styles.resCardDot, { backgroundColor: r.color }]} />
              <Text style={[styles.resCardName, { color: colors.foreground }]}>{r.name}</Text>
              <Feather name="external-link" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}

          {/* Section: AA & NA Meetings */}
          <Text style={[styles.resSectionTitle, { color: colors.foreground }]}>AA & NA Meeting Finders</Text>
          {[
            { name: "AA Meeting Finder — aa.org", url: "https://www.aa.org/find-aa", color: "#1D4ED8" },
            { name: "NA Meeting Search — na.org", url: "https://www.na.org/meetingsearch/", color: "#1D4ED8" },
            { name: "Meeting Guide (AA App)", url: "https://meetingguide.org", color: "#1E40AF" },
            { name: "SMART Recovery Meetings", url: "https://www.smartrecovery.org/community/calendar.php", color: "#2D7A4F" },
            { name: "In The Rooms — Online Meetings", url: "https://www.intherooms.com", color: "#1D4ED8" },
          ].map((r) => (
            <TouchableOpacity
              key={r.name}
              style={[styles.resCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Linking.openURL(r.url).catch(() => {})}
              activeOpacity={0.75}
            >
              <View style={[styles.resCardDot, { backgroundColor: r.color }]} />
              <Text style={[styles.resCardName, { color: colors.foreground }]}>{r.name}</Text>
              <Feather name="external-link" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}

          {/* Section: Crisis Hotlines */}
          <Text style={[styles.resSectionTitle, { color: colors.foreground }]}>Crisis Hotlines</Text>
          {[
            { name: "SAMHSA Helpline", action: "1-800-662-4357", url: "tel:18006624357", color: "#B91C1C" },
            { name: "Domestic Violence Hotline", action: "1-800-799-7233", url: "tel:18007997233", color: "#B91C1C" },
          ].map((r) => (
            <TouchableOpacity
              key={r.name}
              style={[styles.resCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Linking.openURL(r.url).catch(() => {})}
              activeOpacity={0.75}
            >
              <View style={[styles.resCardDot, { backgroundColor: r.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.resCardName, { color: colors.foreground }]}>{r.name}</Text>
                <Text style={[styles.resCardSub, { color: colors.mutedForeground }]}>{r.action}</Text>
              </View>
              <Feather name="phone" size={14} color={r.color} />
            </TouchableOpacity>
          ))}

          {/* Section: Find a Therapist */}
          <Text style={[styles.resSectionTitle, { color: colors.foreground }]}>Find Treatment & Therapy</Text>
          {[
            { name: "SAMHSA Treatment Locator", url: "https://findtreatment.gov", color: "#CA922B" },
            { name: "Open Path Collective ($30–$80/session)", url: "https://openpathcollective.org", color: "#C9922B" },
            { name: "Inclusive Therapists", url: "https://www.inclusivetherapists.com", color: "#2D7A4F" },
          ].map((r) => (
            <TouchableOpacity
              key={r.name}
              style={[styles.resCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Linking.openURL(r.url).catch(() => {})}
              activeOpacity={0.75}
            >
              <View style={[styles.resCardDot, { backgroundColor: r.color }]} />
              <Text style={[styles.resCardName, { color: colors.foreground }]}>{r.name}</Text>
              <Feather name="external-link" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : activeTab === "Requests 🙋" ? (
        <RequestsTab colors={colors} router={router} isAuthenticated={isAuthenticated} bottomPad={bottomPad} />
      ) : activeTab === "Collections 📚" ? (
        <CollectionsTab colors={colors} router={router} isAuthenticated={isAuthenticated} bottomPad={bottomPad} />
      ) : activeTab === "Challenges 🏆" ? (
        <ChallengesTab colors={colors} router={router} isAuthenticated={isAuthenticated} bottomPad={bottomPad} />
      ) : (
        <>
          <FlatList
            data={filteredPosts}
            keyExtractor={(p) => p.id}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListHeaderComponent={
              <>
                {/* Feed mode toggle */}
                <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 }}>
                  {(["everyone", "following"] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => {
                        setFeedMode(mode);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
                        backgroundColor: feedMode === mode ? colors.primary : colors.card,
                        borderWidth: 1,
                        borderColor: feedMode === mode ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{
                        fontFamily: "Inter_600SemiBold", fontSize: 13,
                        color: feedMode === mode ? "#FFFFFF" : colors.mutedForeground,
                      }}>
                        {mode === "everyone" ? "For You" : "Following"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Always-visible compose bar */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.composeBar, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    if (!isAuthenticated) {
                      setUpgradeFeature("Community Posts");
                      setShowUpgrade(true);
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowCompose(true);
                    setTimeout(() => inputRef.current?.focus(), 150);
                  }}
                >
                  <View style={[styles.composeBarAvatar, { backgroundColor: colors.primary + "18" }]}>
                    <Feather name="edit-3" size={15} color={colors.primary} />
                  </View>
                  <Text style={[styles.composeBarPlaceholder, { color: colors.mutedForeground }]}>
                    Share something… type{" "}
                    <Text style={{ fontFamily: "Inter_700Bold", color: colors.primary }}>@</Text>
                    {" "}to tag a business
                  </Text>
                  <View style={[styles.composeBarAtBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "25" }]}>
                    <Feather name="at-sign" size={13} color={colors.primary} />
                  </View>
                </TouchableOpacity>

                {activeTab === "Alerts" && alerts.length > 0 && (
                  <View style={styles.alertSection}>
                    {alerts.map((a) => (
                      <AlertBanner key={a.id} alert={a} onDismiss={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))} />
                    ))}
                  </View>
                )}
              </>
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
            renderItem={({ item }) => (
              <CommunityPostCard
                post={item}
                onCommentPress={() => setSelectedPost(item)}
                onAuthorPress={(id) => setSelectedAuthorId(id)}
                onLocationPress={(tag) => router.push({ pathname: "/location-feed", params: { location: tag } } as any)}
                onTopicPress={(tag) => router.push({ pathname: "/topic-feed", params: { topic: tag.toLowerCase() } } as any)}
              />
            )}
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

      <PostDetailModal
        visible={selectedPost !== null}
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onLike={() => void loadPosts()}
      />

      <UserProfileModal
        userId={selectedAuthorId}
        visible={selectedAuthorId !== null}
        onClose={() => setSelectedAuthorId(null)}
      />

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={upgradeFeature}
      />

      <Modal visible={showCreateGroup} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={[styles.composeSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 20 }]}>
            <View style={[styles.composeHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowCreateGroup(false)}>
                <Text style={[styles.composeCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.composeTitle, { color: colors.foreground }]}>Start a Group</Text>
              <TouchableOpacity
                onPress={() => void handleCreateGroup()}
                disabled={!groupCreateName.trim() || groupCreateSubmitting}
              >
                {groupCreateSubmitting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.composePostText, { color: groupCreateName.trim() ? colors.primary : colors.muted }]}>
                    Create
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
              <TextInput
                style={[styles.composeInput, { color: colors.foreground, borderBottomWidth: 1, borderBottomColor: colors.border }]}
                placeholder="Group name *"
                placeholderTextColor={colors.mutedForeground}
                value={groupCreateName}
                onChangeText={setGroupCreateName}
                maxLength={80}
              />
              <TextInput
                style={[styles.composeInput, { color: colors.foreground, minHeight: 80, borderBottomWidth: 1, borderBottomColor: colors.border }]}
                placeholder="What's this group about? (optional)"
                placeholderTextColor={colors.mutedForeground}
                value={groupCreateDesc}
                onChangeText={setGroupCreateDesc}
                multiline
                maxLength={300}
              />
              <TextInput
                style={[styles.composeInput, { color: colors.foreground, minHeight: 44, borderBottomWidth: 1, borderBottomColor: colors.border }]}
                placeholder="City (optional)"
                placeholderTextColor={colors.mutedForeground}
                value={groupCreateCity}
                onChangeText={setGroupCreateCity}
                maxLength={60}
              />

              <View style={styles.categoryRow}>
                {GROUP_CATEGORIES.filter((c) => c.value !== "all").map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.filterChip,
                      { borderColor: groupCreateCategory === opt.value ? colors.primary : colors.border },
                      groupCreateCategory === opt.value && { backgroundColor: colors.primary + "18" },
                    ]}
                    onPress={() => setGroupCreateCategory(opt.value)}
                  >
                    <Text style={[styles.filterChipText, { color: groupCreateCategory === opt.value ? colors.primary : colors.mutedForeground }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Privacy toggle */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground }}>🔒 Private Group</Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>Members join by invite only</Text>
                </View>
                <Switch
                  value={groupCreatePrivate}
                  onValueChange={setGroupCreatePrivate}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              {/* Audience preference */}
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground, marginBottom: 6 }}>Community audience (optional)</Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginBottom: 10 }}>
                  Select which communities this group is primarily for. Only users with a matching preference will see it first — all minorities are welcome.
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { key: "Black / African American", emoji: "🤎" },
                    { key: "Hispanic / Latino", emoji: "🧡" },
                    { key: "Native American / Indigenous", emoji: "🌿" },
                    { key: "Asian / Pacific Islander", emoji: "🌸" },
                    { key: "Middle Eastern / North African", emoji: "🌙" },
                    { key: "Multiracial", emoji: "🌈" },
                  ].map((ci) => {
                    const isSelected = groupCreateAudience.includes(ci.key);
                    return (
                      <TouchableOpacity
                        key={ci.key}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 5,
                          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                          backgroundColor: isSelected ? colors.primary + "15" : colors.card,
                          borderColor: isSelected ? colors.primary : colors.border,
                        }}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setGroupCreateAudience((prev) => isSelected ? prev.filter((x) => x !== ci.key) : [...prev, ci.key]);
                        }}
                      >
                        <Text style={{ fontSize: 14 }}>{ci.emoji}</Text>
                        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: isSelected ? colors.primary : colors.mutedForeground }}>
                          {ci.key.split(" / ")[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

            {/* Post type selector */}
            <View style={[styles.categoryRow, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }]}>
              {([
                { value: "community", label: "💬 Discussion", color: "#C4622D" },
                { value: "question", label: "❓ Question", color: "#D4873A" },
                { value: "business", label: "🏪 Business", color: "#7B2D8B" },
                { value: "safety", label: "🚨 Safety", color: "#DC2626" },
                { value: "travel", label: "✈️ Travel", color: "#0369A1" },
              ] as const).map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.filterChip,
                    { borderColor: newPostType === opt.value ? opt.color : colors.border },
                    newPostType === opt.value && { backgroundColor: opt.color + "18" },
                  ]}
                  onPress={() => {
                    setNewPostType(opt.value);
                    const newLimit = CHAR_LIMITS[opt.value] ?? 1000;
                    if (newPostText.length > newLimit) setNewPostText((t) => t.slice(0, newLimit));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.filterChipText, { color: newPostType === opt.value ? opt.color : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category chips */}
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

            {/* Visibility selector */}
            <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingBottom: 10, gap: 8, alignItems: "center" }}>
              <Feather name={newPostVisibility === "public" ? "globe" : "lock"} size={13} color={colors.mutedForeground} />
              {(["public", "followers_only"] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => { setNewPostVisibility(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14,
                    borderWidth: 1,
                    borderColor: newPostVisibility === v ? colors.primary : colors.border,
                    backgroundColor: newPostVisibility === v ? colors.primary + "18" : "transparent",
                  }}
                >
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: newPostVisibility === v ? colors.primary : colors.mutedForeground }}>
                    {v === "public" ? "🌐 Public" : "🔒 Friends Only"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Location tag */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
              {newPostLocationTag ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Feather name="map-pin" size={13} color="#0369A1" />
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, backgroundColor: "#0369A115", borderWidth: 1, borderColor: "#0369A130" }}>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: "#0369A1" }}>📍 {newPostLocationTag}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setNewPostLocationTag("")}>
                    <Feather name="x" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Tag a location</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Location picker inline */}
            {showLocationPicker && (
              <View style={[{ paddingHorizontal: 16, paddingBottom: 12 }]}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 8 }}>Choose a location:</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {["Atlanta", "Houston", "Chicago", "Washington DC", "New York", "New Orleans", "Los Angeles", "Miami", "Dallas", "Philadelphia", "Charlotte", "Baltimore", "Detroit", "Memphis", "Jamaica", "Ghana", "Nigeria", "London", "Toronto", "Fulton County", "Bronx", "Brooklyn"].map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.primary + "50", backgroundColor: colors.primary + "10" }}
                      onPress={() => { setNewPostLocationTag(loc); setShowLocationPicker(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.primary }}>📍 {loc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Topic tag */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
              {newPostTopicTag ? (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Feather name="tag" size={13} color="#7B2D8B" />
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, backgroundColor: "#7B2D8B15", borderWidth: 1, borderColor: "#7B2D8B30" }}>
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: "#7B2D8B" }}>🏷️ {newPostTopicTag}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setNewPostTopicTag(""); setNewPostIsPrivateTopic(false); }}>
                      <Feather name="x" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                    onPress={() => setNewPostIsPrivateTopic((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <View style={[{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" }, newPostIsPrivateTopic ? { backgroundColor: "#7B2D8B", borderColor: "#7B2D8B" } : { borderColor: "#D1D5DB" }]}>
                      {newPostIsPrivateTopic && <Feather name="check" size={13} color="#FFFFFF" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>🔒 Private topic</Text>
                      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>Post shared only with followers; not public search</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
                  onPress={() => setShowTopicPicker(true)}
                >
                  <Feather name="tag" size={13} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Tag a topic</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Topic picker inline */}
            {showTopicPicker && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 8 }}>Choose a topic:</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "Health & Wellness", "Mental Health", "Relationships & Dating",
                    "Finances & Wealth", "Pop Culture", "Travel",
                    "Food & Dining", "Fashion & Beauty", "Black History & Culture",
                    "Parenting & Family", "Spirituality", "Career & Business",
                    "Community Justice", "Entertainment",
                  ].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: "#7B2D8B50", backgroundColor: "#7B2D8B10" }}
                      onPress={() => { setNewPostTopicTag(t); setShowTopicPicker(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: "#7B2D8B" }}>🏷️ {t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Business link input (only for business posts) */}
            {newPostType === "business" && (
              <View style={[{ paddingHorizontal: 16, paddingBottom: 8 }]}>
                <TextInput
                  style={[styles.composeInput, { color: colors.foreground, minHeight: 0, paddingVertical: 10, borderWidth: 1, borderColor: "#7B2D8B40", borderRadius: 10, backgroundColor: "#7B2D8B08" }]}
                  placeholder="Business website or social link (optional)…"
                  placeholderTextColor={colors.mutedForeground}
                  value={newPostBusinessLink}
                  onChangeText={setNewPostBusinessLink}
                  keyboardType="url"
                  autoCapitalize="none"
                  maxLength={250}
                />
              </View>
            )}

            {mentionQuery !== null && (
              <BusinessMentionPicker
                query={mentionQuery}
                businesses={businesses}
                onSelect={handleMentionSelect}
              />
            )}

            <TextInput
              ref={inputRef}
              style={[styles.composeInput, { color: colors.foreground }]}
              placeholder="Let's connect deeper."
              placeholderTextColor={colors.mutedForeground}
              value={newPostText}
              onChangeText={(t) => {
                const limit = CHAR_LIMITS[newPostType] ?? 1000;
                handlePostTextChange(t.slice(0, limit));
              }}
              multiline
              maxLength={CHAR_LIMITS[newPostType] ?? 1000}
            />

            {/* Media preview strip */}
            {mediaAttachments.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingBottom: 10 }} contentContainerStyle={{ gap: 8 }}>
                {mediaAttachments.map((m, i) => (
                  <View key={i} style={{ position: "relative" }}>
                    {m.type === "image" ? (
                      <Image source={{ uri: m.uri }} style={{ width: 72, height: 72, borderRadius: 8 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: "#0005", justifyContent: "center", alignItems: "center" }}>
                        <Feather name="film" size={24} color="#fff" />
                      </View>
                    )}
                    {!m.uploaded && (
                      <View style={{ position: "absolute", inset: 0, borderRadius: 8, backgroundColor: "#0006", justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => setMediaAttachments((prev) => prev.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: "#DC2626", justifyContent: "center", alignItems: "center" }}
                    >
                      <Feather name="x" size={11} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.composeToolbar}>
              <TouchableOpacity
                style={[styles.mentionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                onPress={() => {
                  const next = newPostText.endsWith(" ") || newPostText === "" ? newPostText + "@" : newPostText + " @";
                  setNewPostText(next);
                  setMentionQuery("");
                  inputRef.current?.focus();
                }}
                activeOpacity={0.7}
              >
                <Feather name="at-sign" size={14} color={colors.primary} />
                <Text style={[styles.mentionBtnText, { color: colors.primary }]}>Tag a business</Text>
              </TouchableOpacity>

              {/* Image picker button */}
              <TouchableOpacity
                style={[styles.mentionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => void pickAndUploadMedia("image")}
                disabled={uploadingMedia || mediaAttachments.filter((m) => m.type === "image").length >= 5}
                activeOpacity={0.7}
              >
                {uploadingMedia ? (
                  <ActivityIndicator size={12} color={colors.mutedForeground} />
                ) : (
                  <Feather name="image" size={14} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>

              {/* Video picker button */}
              <TouchableOpacity
                style={[styles.mentionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => void pickAndUploadMedia("video")}
                disabled={uploadingMedia || mediaAttachments.some((m) => m.type === "video")}
                activeOpacity={0.7}
              >
                <Feather name="video" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
              {(() => {
                const limit = CHAR_LIMITS[newPostType] ?? 1000;
                const remaining = limit - newPostText.length;
                const pct = newPostText.length / limit;
                const counterColor = pct >= 0.95 ? "#DC2626" : pct >= 0.8 ? "#D97706" : colors.mutedForeground;
                return (
                  <Text style={[styles.charCount, { color: counterColor, fontWeight: pct >= 0.8 ? "600" : "400" }]}>
                    {remaining < 100 ? remaining : newPostText.length} / {limit.toLocaleString()}
                  </Text>
                );
              })()}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type Circle = {
  id: number; name: string; type: string; privacy: string; emoji: string;
  hostUserId: string; description: string | null; memberCount: number; city: string | null;
};

function CirclesTab({ colors, router, isAuthenticated, bottomPad }: {
  colors: ReturnType<typeof useColors>;
  router: ReturnType<typeof useRouter>;
  isAuthenticated: boolean;
  bottomPad: number;
}) {
  const [circles, setCircles] = React.useState<Circle[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const r = await fetch(`${getApiBase()}/api/circles`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (r.ok) { const d = await r.json() as { circles: Circle[] }; setCircles(d.circles); }
    } catch {}
    finally { setLoading(false); }
  }, [isAuthenticated]);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground }}>Kinfolk Circles ⭐</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>Your private groups for planning together</Text>
          </View>
          {isAuthenticated && (
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 }}
              onPress={() => router.push("/circles/create" as any)}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={15} color="#FFFFFF" />
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#FFFFFF" }}>New Circle</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
          <Feather name="shield" size={13} color={colors.primary} style={{ marginTop: 2 }} />
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, flex: 1, lineHeight: 16 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Your privacy is protected. </Text>
            Circles only share what you choose to share inside the group — saved businesses, suggestions, events, and locations. Your personal profile, reviews, search history, messages, employer activity, and health searches are never shared.
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !isAuthenticated ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Text style={{ fontSize: 40 }}>✨</Text>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground, textAlign: "center" }}>Sign in to join Kinfolk Circles</Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 }}>Plan outings with friends, family, and your community — all in one private space.</Text>
        </View>
      ) : circles.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Text style={{ fontSize: 44 }}>⭐</Text>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground, textAlign: "center" }}>Start your first Circle</Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 }}>
            Create a private Circle for your crew, or a community Circle for your city. Kinfolk helps everyone plan the perfect day together.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, marginTop: 6 }}
            onPress={() => router.push("/circles/create" as any)}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" }}>Create a Circle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={circles}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPad + 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}
              onPress={() => router.push({ pathname: "/circles/[id]", params: { id: String(item.id) } } as any)}
              activeOpacity={0.8}
            >
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 26 }}>{item.emoji ?? "✨"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground }}>{item.name}</Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                  {item.memberCount ?? 1} {(item.memberCount ?? 1) === 1 ? "member" : "members"} · {item.type === "private" ? "🔒 Private" : "🌐 Community"}
                </Text>
                {item.city ? <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>📍 {item.city}</Text> : null}
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        />
      )}
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
  tabRow: { borderBottomWidth: 1 },
  tabBtn: { alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 13 },
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
  charCount: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "right", paddingBottom: 8 },
  composeToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4,
    paddingTop: 4,
  },
  mentionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  mentionBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  composeBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  composeBarAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  composeBarPlaceholder: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  composeBarAtBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  resSpacesCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  resSpacesIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  resSpacesTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  resSpacesSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 3, lineHeight: 17 },
  resCrisisBanner: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14 },
  resCrisisTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFF" },
  resCrisisSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.85)" },
  resRow: { flexDirection: "row", gap: 10 },
  resCrisisBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  resCrisisBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#FFF" },
  resSectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 4 },
  resCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  resCardDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  resCardName: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 },
  resCardSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  videosHero: { borderRadius: 18, padding: 18, gap: 14 },
  videosHeroTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  videosHeroTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 3 },
  videosHeroSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  videosDestRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  videosDestChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)" },
  videosDestTxt: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#fff" },
  videosSectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  videosTierCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  videosTierHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  videosTierName: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  videosFreeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  videosFreeTagTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  videosPremiumTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  videosPerkRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  videosPerkTxt: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  videosUpgradeBtn: { alignItems: "center", paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  videosUpgradeTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  videosExploreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 12, borderWidth: 1, paddingVertical: 14,
  },
  videosExploreTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});

// ─── REQUEST CATEGORIES ───────────────────────────────────────────────────────
const REQUEST_CATEGORIES = [
  "Restaurant", "Healthcare", "Beauty & Hair", "Legal Services", "Financial Services",
  "Education", "Childcare", "Home Services", "Retail", "Fitness & Wellness",
  "Mental Health", "Disability Access", "Technology", "Arts & Culture", "Other",
];

const HELP_OFFER_TYPES = [
  { id: "restaurant_recs", label: "Restaurant Recommendations", emoji: "🍽️" },
  { id: "neighborhood_advice", label: "Neighborhood Advice", emoji: "🏘️" },
  { id: "school_info", label: "School Information", emoji: "🎓" },
  { id: "healthcare", label: "Healthcare Suggestions", emoji: "🏥" },
  { id: "networking", label: "Networking", emoji: "🤝" },
  { id: "moving_tips", label: "Moving Tips", emoji: "🏠" },
  { id: "business_recs", label: "Business Recommendations", emoji: "🛍️" },
  { id: "general_guidance", label: "General Guidance", emoji: "🤎" },
];

type CommunityRequest = {
  id: string; userId: string; title: string; category: string;
  city: string | null; state: string | null; description: string | null;
  upvotes: number; helperCount: number; status: string; createdAt: string;
};

// ─── REQUESTS TAB ─────────────────────────────────────────────────────────────
function RequestsTab({ colors, router: _router, isAuthenticated, bottomPad }: {
  colors: ReturnType<typeof useColors>;
  router: ReturnType<typeof useRouter>;
  isAuthenticated: boolean;
  bottomPad: number;
}) {
  const [requests, setRequests] = React.useState<CommunityRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showPost, setShowPost] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState<CommunityRequest | null>(null);
  const [selectedOffers, setSelectedOffers] = React.useState<string[]>([]);
  const [helpMsg, setHelpMsg] = React.useState("");
  const [postTitle, setPostTitle] = React.useState("");
  const [postCategory, setPostCategory] = React.useState("");
  const [postCity, setPostCity] = React.useState("");
  const [postState, setPostState] = React.useState("");
  const [postDesc, setPostDesc] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [upvotedIds, setUpvotedIds] = React.useState<Set<string>>(new Set());

  const load = React.useCallback(async () => {
    try {
      const r = await fetch(`${getApiBase()}/api/community-requests`);
      if (r.ok) { const d = await r.json() as { requests: CommunityRequest[] }; setRequests(d.requests); }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const handleUpvote = async (req: CommunityRequest) => {
    if (!isAuthenticated) return;
    if (upvotedIds.has(req.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUpvotedIds(prev => new Set([...prev, req.id]));
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, upvotes: r.upvotes + 1 } : r));
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/community-requests/${req.id}/upvote`, {
        method: "POST", headers: { Authorization: `Bearer ${token ?? ""}` },
      });
    } catch {}
  };

  const handlePostRequest = async () => {
    if (!postTitle.trim() || !postCategory) return;
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const r = await fetch(`${getApiBase()}/api/community-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ title: postTitle.trim(), category: postCategory, city: postCity.trim() || undefined, state: postState.trim() || undefined, description: postDesc.trim() || undefined }),
      });
      if (r.ok) {
        const d = await r.json() as { request: CommunityRequest };
        setRequests(prev => [d.request, ...prev]);
        setShowPost(false);
        setPostTitle(""); setPostCategory(""); setPostCity(""); setPostState(""); setPostDesc("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
    finally { setSubmitting(false); }
  };

  const handleHelp = async () => {
    if (!showHelp || selectedOffers.length === 0) return;
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/community-requests/${showHelp.id}/help`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ offerTypes: selectedOffers, message: helpMsg.trim() || undefined }),
      });
      setRequests(prev => prev.map(r => r.id === showHelp.id ? { ...r, helperCount: r.helperCount + 1 } : r));
      setShowHelp(null); setSelectedOffers([]); setHelpMsg("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    finally { setSubmitting(false); }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground }}>Community Requests 🙋</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
              What does your community need? Ask and businesses will listen.
            </Text>
          </View>
          {isAuthenticated && (
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 }}
              onPress={() => setShowPost(true)}
              activeOpacity={0.85}
            >
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#FFFFFF" }}>+ Request</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 10 }}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, lineHeight: 17 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Businesses are listening. </Text>
            Your requests become real demand signals — helping businesses decide where to expand, what to offer, and how to serve this community.
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={r => r.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPad + 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 }}>
              <Text style={{ fontSize: 44 }}>🙋</Text>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground, textAlign: "center" }}>No requests yet</Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 }}>
                Be the first to ask for something your community needs. Your voice could shape what opens next.
              </Text>
              {isAuthenticated && (
                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 }}
                  onPress={() => setShowPost(true)}
                >
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" }}>Post a Request</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item: req }) => (
            <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ backgroundColor: colors.primary + "15", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.primary }}>{req.category}</Text>
                    </View>
                    {req.status === "fulfilled" && (
                      <View style={{ backgroundColor: colors.success + "20", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.success }}>✓ Fulfilled</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground, lineHeight: 22 }}>{req.title}</Text>
                  {req.description && (
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, lineHeight: 20 }}>{req.description}</Text>
                  )}
                  {(req.city ?? req.state) && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>
                        {[req.city, req.state].filter(Boolean).join(", ")}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {/* Upvote */}
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: upvotedIds.has(req.id) ? colors.primary : colors.secondary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 }}
                  onPress={() => void handleUpvote(req)}
                  disabled={!isAuthenticated}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14 }}>🙌</Text>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: upvotedIds.has(req.id) ? "#FFFFFF" : colors.foreground }}>
                    {req.upvotes} {req.upvotes === 1 ? "Support" : "Supports"}
                  </Text>
                </TouchableOpacity>

                {/* I Can Help */}
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderColor: colors.primary + "50", borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, flex: 1 }}
                  onPress={() => {
                    if (!isAuthenticated) return;
                    setShowHelp(req); setSelectedOffers([]); setHelpMsg("");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  disabled={!isAuthenticated}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14 }}>🤎</Text>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary }}>
                    {req.helperCount > 0 ? `${req.helperCount} Can Help` : "I Can Help"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* FAB */}
      {isAuthenticated && (
        <TouchableOpacity
          style={{ position: "absolute", right: 20, bottom: bottomPad + 90, backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 8 }}
          onPress={() => setShowPost(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Post Request Modal */}
      <Modal visible={showPost} animationType="slide" transparent onRequestClose={() => setShowPost(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 12, maxHeight: "90%" }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 4 }} />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>What does your community need?</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground }}>Your request becomes a demand signal. Businesses will see it.</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
              <View style={{ gap: 12 }}>
                <TextInput
                  style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground }}
                  placeholder={`"We need a minority-owned pediatrician in this area."`}
                  placeholderTextColor={colors.mutedForeground}
                  value={postTitle}
                  onChangeText={setPostTitle}
                  maxLength={120}
                />
                <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground }}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {REQUEST_CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, backgroundColor: postCategory === c ? colors.primary : colors.card, borderColor: postCategory === c ? colors.primary : colors.border }}
                      onPress={() => setPostCategory(c === postCategory ? "" : c)}
                    >
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: postCategory === c ? "#FFFFFF" : colors.foreground }}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground }}
                    placeholder="City" placeholderTextColor={colors.mutedForeground}
                    value={postCity} onChangeText={setPostCity}
                  />
                  <TextInput
                    style={{ width: 80, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground }}
                    placeholder="ST" placeholderTextColor={colors.mutedForeground}
                    value={postState} onChangeText={t => setPostState(t.toUpperCase())}
                    maxLength={2} autoCapitalize="characters"
                  />
                </View>
                <TextInput
                  style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground, minHeight: 80, textAlignVertical: "top" }}
                  placeholder="Add more context (optional)…"
                  placeholderTextColor={colors.mutedForeground}
                  value={postDesc} onChangeText={setPostDesc}
                  multiline maxLength={300}
                />
                <TouchableOpacity
                  style={{ backgroundColor: postTitle.trim() && postCategory ? colors.primary : colors.muted, paddingVertical: 16, borderRadius: 16, alignItems: "center" }}
                  onPress={() => void handlePostRequest()}
                  disabled={!postTitle.trim() || !postCategory || submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? <ActivityIndicator size="small" color="#FFF" /> : (
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" }}>Post Request →</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPost(false)} style={{ alignItems: "center", paddingVertical: 12 }}>
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* I Can Help Modal */}
      <Modal visible={!!showHelp} animationType="slide" transparent onRequestClose={() => setShowHelp(null)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 12, maxHeight: "85%" }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 4 }} />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>🤎 I Can Help</Text>
            {showHelp && (
              <View style={{ backgroundColor: colors.primary + "12", borderRadius: 12, padding: 12 }}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground }}>{showHelp.title}</Text>
              </View>
            )}
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground }}>How can you help? Select all that apply.</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {HELP_OFFER_TYPES.map(t => {
                    const selected = selectedOffers.includes(t.id);
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }}
                        onPress={() => {
                          setSelectedOffers(prev => selected ? prev.filter(x => x !== t.id) : [...prev, t.id]);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{t.emoji}</Text>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: selected ? "#FFFFFF" : colors.foreground }}>{t.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground, minHeight: 80, textAlignVertical: "top" }}
                  placeholder="Add a message (optional) — introduce yourself, share your experience…"
                  placeholderTextColor={colors.mutedForeground}
                  value={helpMsg} onChangeText={setHelpMsg}
                  multiline maxLength={300}
                />
                <View style={{ backgroundColor: colors.primary + "12", borderColor: colors.primary + "25", borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>🤎</Text>
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.primary, flex: 1 }}>You'll earn 15 Community Points for helping. That's mentorship made visible.</Text>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: selectedOffers.length > 0 ? colors.primary : colors.muted, paddingVertical: 16, borderRadius: 16, alignItems: "center" }}
                  onPress={() => void handleHelp()}
                  disabled={selectedOffers.length === 0 || submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? <ActivityIndicator size="small" color="#FFF" /> : (
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" }}>Offer Help →</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowHelp(null)} style={{ alignItems: "center", paddingVertical: 10 }}>
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── COLLECTIONS TAB ──────────────────────────────────────────────────────────
type CollectionItem = {
  id: number; title: string; description: string | null; category: string | null;
  coverEmoji: string | null; savedCount: number; createdAt: string;
  authorFirstName: string | null; authorLastName: string | null;
};

const COLLECTION_PRESETS = [
  { emoji: "💕", label: "Best Date Night" },
  { emoji: "✊🏾", label: "Black History Stops" },
  { emoji: "👨‍👩‍👧", label: "Kid Friendly" },
  { emoji: "🌙", label: "Solo Travel" },
  { emoji: "💎", label: "Hidden Gems" },
  { emoji: "☔", label: "Rainy Day" },
  { emoji: "💇🏾‍♀️", label: "Natural Hair" },
  { emoji: "☕", label: "Minority-Owned Coffee" },
  { emoji: "🍽️", label: "Sunday Brunch" },
  { emoji: "🎨", label: "Arts & Culture" },
];

function CollectionsTab({ colors, isAuthenticated, bottomPad }: {
  colors: ReturnType<typeof useColors>;
  router: ReturnType<typeof useRouter>;
  isAuthenticated: boolean;
  bottomPad: number;
}) {
  const [collections, setCollections] = React.useState<CollectionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newEmoji, setNewEmoji] = React.useState("📍");
  const [newDesc, setNewDesc] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch(`${getApiBase()}/api/lists`);
      if (r.ok) { const d = await r.json() as { lists: CollectionItem[] }; setCollections(d.lists); }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const r = await fetch(`${getApiBase()}/api/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || undefined, coverEmoji: newEmoji, isPublic: true }),
      });
      if (r.ok) {
        const d = await r.json() as { list: CollectionItem };
        setCollections(prev => [d.list, ...prev]);
        setShowCreate(false); setNewTitle(""); setNewEmoji("📍"); setNewDesc("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
    finally { setSubmitting(false); }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground }}>Community Collections 📚</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
              Curated by the community, for the community.
            </Text>
          </View>
          {isAuthenticated && (
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 }}
              onPress={() => setShowCreate(true)}
              activeOpacity={0.85}
            >
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#FFFFFF" }}>+ Create</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {COLLECTION_PRESETS.map(p => (
            <TouchableOpacity
              key={p.label}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
              onPress={() => { if (isAuthenticated) { setNewTitle(p.label); setNewEmoji(p.emoji); setShowCreate(true); } }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 15 }}>{p.emoji}</Text>
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.foreground }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={c => String(c.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
          numColumns={2}
          contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: bottomPad + 100 }}
          columnWrapperStyle={{ gap: 12 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60, paddingHorizontal: 24 }}>
              <Text style={{ fontSize: 44 }}>📚</Text>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground, textAlign: "center" }}>No collections yet</Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 }}>
                Build the first collection — "Hidden Gems," "Best Date Night," or whatever your community needs to know.
              </Text>
              {isAuthenticated && (
                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 }}
                  onPress={() => setShowCreate(true)}
                >
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" }}>Create First Collection</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item: col }) => (
            <View style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, gap: 8, minHeight: 140 }}>
              <Text style={{ fontSize: 36 }}>{col.coverEmoji ?? "📍"}</Text>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground, lineHeight: 20 }}>{col.title}</Text>
              {col.description && (
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, lineHeight: 17 }} numberOfLines={2}>{col.description}</Text>
              )}
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                by {[col.authorFirstName, col.authorLastName].filter(Boolean).join(" ") || "Community"}
              </Text>
            </View>
          )}
        />
      )}

      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14, maxHeight: "80%" }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center" }} />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: colors.foreground }}>Create a Collection</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 12 }}>
                <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground }}>Pick an emoji</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {["📍","💕","✊🏾","👨‍👩‍👧","🌙","💎","☔","💇🏾‍♀️","☕","🎨","🏛️","🌍","🎉","🍽️","🛍️"].map(e => (
                    <TouchableOpacity
                      key={e}
                      style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: newEmoji === e ? colors.primary + "20" : colors.card, borderWidth: newEmoji === e ? 2 : 1, borderColor: newEmoji === e ? colors.primary : colors.border }}
                      onPress={() => setNewEmoji(e)}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground }}
                  placeholder="Collection name (e.g. Hidden Gems)"
                  placeholderTextColor={colors.mutedForeground}
                  value={newTitle} onChangeText={setNewTitle} maxLength={80}
                />
                <TextInput
                  style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground, minHeight: 70, textAlignVertical: "top" }}
                  placeholder="What's this collection about? (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={newDesc} onChangeText={setNewDesc} multiline maxLength={200}
                />
                <TouchableOpacity
                  style={{ backgroundColor: newTitle.trim() ? colors.primary : colors.muted, paddingVertical: 16, borderRadius: 16, alignItems: "center" }}
                  onPress={() => void handleCreate()}
                  disabled={!newTitle.trim() || submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? <ActivityIndicator size="small" color="#FFF" /> : (
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" }}>Create Collection →</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowCreate(false)} style={{ alignItems: "center", paddingVertical: 10 }}>
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── CHALLENGES TAB ───────────────────────────────────────────────────────────
type CommunityChallenge = {
  id: string; title: string; description: string; icon: string;
  challengeType: string; targetCount: number; pointsReward: number;
  completionCount: number; startDate: string | null; endDate: string | null;
};
type ChallengeProgressEntry = { progress: number; completedAt: string | null };

function ChallengesTab({ colors, isAuthenticated, bottomPad }: {
  colors: ReturnType<typeof useColors>;
  router: ReturnType<typeof useRouter>;
  isAuthenticated: boolean;
  bottomPad: number;
}) {
  const [challenges, setChallenges] = React.useState<CommunityChallenge[]>([]);
  const [progress, setProgress] = React.useState<Record<string, ChallengeProgressEntry>>({});
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [logging, setLogging] = React.useState<string | null>(null);
  const [justEarned, setJustEarned] = React.useState<{ pts: number; id: string } | null>(null);

  const load = React.useCallback(async () => {
    try {
      const token = isAuthenticated ? await SecureStore.getItemAsync("auth_session_token") : null;
      const r = await fetch(`${getApiBase()}/api/community-challenges`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (r.ok) {
        const d = await r.json() as { challenges: CommunityChallenge[]; progress: Record<string, ChallengeProgressEntry> };
        setChallenges(d.challenges);
        setProgress(d.progress ?? {});
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [isAuthenticated]);

  React.useEffect(() => { void load(); }, [load]);

  const handleLogProgress = async (challenge: CommunityChallenge) => {
    if (!isAuthenticated || logging) return;
    setLogging(challenge.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const r = await fetch(`${getApiBase()}/api/community-challenges/${challenge.id}/progress`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (r.ok) {
        const d = await r.json() as { progress: number; completed: boolean; pointsEarned: number };
        setProgress(prev => ({ ...prev, [challenge.id]: { progress: d.progress, completedAt: d.completed ? new Date().toISOString() : null } }));
        if (d.completed) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setJustEarned({ pts: d.pointsEarned, id: challenge.id });
          setTimeout(() => setJustEarned(null), 3500);
        }
      }
    } catch {}
    finally { setLogging(null); }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 6 }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground }}>Community Challenges 🏆</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>
          Monthly challenges that build connection, support local businesses, and earn you Community Points.
        </Text>
      </View>

      {/* Points earned toast */}
      {justEarned && (
        <View style={{ position: "absolute", top: 70, left: 20, right: 20, zIndex: 99, backgroundColor: colors.primary, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 22 }}>🎉</Text>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" }}>Challenge complete! +{justEarned.pts} points earned</Text>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={c => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: bottomPad + 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
              <Text style={{ fontSize: 44 }}>🏆</Text>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground }}>Challenges coming soon</Text>
            </View>
          }
          renderItem={({ item: challenge }) => {
            const prog = progress[challenge.id];
            const done = !!prog?.completedAt;
            const currentProgress = prog?.progress ?? 0;
            const pct = Math.min(1, currentProgress / challenge.targetCount);

            return (
              <View style={{ backgroundColor: done ? colors.success + "10" : colors.card, borderColor: done ? colors.success + "40" : colors.border, borderWidth: 1.5, borderRadius: 20, padding: 18, gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: done ? colors.success + "20" : colors.primary + "12", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 26 }}>{challenge.icon}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: done ? colors.success : colors.foreground }}>{challenge.title}</Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, lineHeight: 19 }}>{challenge.description}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
                      <View style={{ backgroundColor: colors.primary + "15", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.primary }}>🤎 {challenge.pointsReward} pts</Text>
                      </View>
                      {challenge.completionCount > 0 && (
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>{challenge.completionCount} completed</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Progress bar */}
                {challenge.targetCount > 1 && (
                  <View style={{ gap: 6 }}>
                    <View style={{ height: 8, backgroundColor: colors.secondary, borderRadius: 4, overflow: "hidden" }}>
                      <View style={{ height: "100%", width: `${pct * 100}%`, backgroundColor: done ? colors.success : colors.primary, borderRadius: 4 }} />
                    </View>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>
                      {currentProgress} / {challenge.targetCount}
                    </Text>
                  </View>
                )}

                {done ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.success + "15", borderRadius: 12, padding: 12 }}>
                    <Feather name="check-circle" size={16} color={colors.success} />
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.success }}>Challenge complete! Well done.</Text>
                  </View>
                ) : isAuthenticated ? (
                  <TouchableOpacity
                    style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                    onPress={() => void handleLogProgress(challenge)}
                    disabled={logging === challenge.id}
                    activeOpacity={0.85}
                  >
                    {logging === challenge.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Feather name="check" size={16} color="#FFFFFF" />
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" }}>
                          {currentProgress > 0 ? "Log Progress" : "Mark as Done"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: colors.secondary, borderRadius: 14, padding: 12, alignItems: "center" }}>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground }}>Sign in to track your progress</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
      <RecommendationNudge />
    </View>
  );
}
