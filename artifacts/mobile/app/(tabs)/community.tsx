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
  KeyboardAvoidingView,
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
import { BusinessMentionPicker, type SelectedBusiness } from "@/components/BusinessMentionPicker";
import { UserMentionPicker } from "@/components/UserMentionPicker";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { PostDetailModal } from "@/components/PostDetailModal";
import { EventCard } from "@/components/EventCard";
import type { CommunityPost } from "@/constants/types";
import { useColors } from "@/hooks/useColors";
import { useEvents } from "@/hooks/useEvents";
import { useGroups, type Group } from "@/hooks/useGroups";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAuth } from "@/lib/auth";
import { UpgradeModal } from "@/components/UpgradeModal";
import { RecommendationNudge } from "@/components/RecommendationNudge";

const TABS = ["Feed", "Events", "Circles ⭐", "Groups", "Challenges 🏆", "Resources"];

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
  general: "#CA922B",
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
    authorColor: (raw.authorColor as string) ?? "#CA922B",
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
    hasContentWarning: !!(raw.hasContentWarning),
    contentWarningType: (raw.contentWarningType as string) ?? undefined,
    audienceRating: (raw.audienceRating as string) ?? (raw.audience_rating as string) ?? "everyone",
    ratingReason: (raw.ratingReason as string) ?? (raw.rating_reason as string) ?? undefined,
  };
}

function GroupCard({ group, onPress, onJoinLeave }: {
  group: Group;
  onPress: () => void;
  onJoinLeave: (g: Group) => void;
}) {
  const colors = useColors();
  const catColor = CATEGORY_COLORS[group.category] ?? "#CA922B";
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
  const { isAuthenticated, user } = useAuth();
  const isPaidMember = !!user && ["navigator", "trailblazer", "community_builder", "legacy_member", "founding", "beta"].includes(user.memberType ?? "");
  const [activeTab, setActiveTab] = useState("Feed");
  const [refreshing, setRefreshing] = useState(false);
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
  const [feedMode, setFeedMode] = useState<"foryou" | "everyone" | "following">(isAuthenticated ? "foryou" : "everyone");
  const [mediaAttachments, setMediaAttachments] = useState<{ uri: string; type: "image" | "video"; uploaded?: string; isGraphic?: boolean; warningType?: string }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [newPostLocationTag, setNewPostLocationTag] = useState("");
  const [newPostLocationType, setNewPostLocationType] = useState("city");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [newPostTopicTag, setNewPostTopicTag] = useState("");
  const [newPostIsPrivateTopic, setNewPostIsPrivateTopic] = useState(false);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [newPostAudienceRating, setNewPostAudienceRating] = useState<"everyone" | "teen" | "young_adult" | "adult">("everyone");
  const [newPostRatingReason, setNewPostRatingReason] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [editPostText, setEditPostText] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [groupCategory, setGroupCategory] = useState("all");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>(undefined);
  const [kinfolkSuggestions, setKinfolkSuggestions] = useState<Array<{ id: string; name: string; category: string; city: string; rating: string; imageUrl: string | null; description: string }>>([]);
  const [showKinfolkSuggest, setShowKinfolkSuggest] = useState(false);
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
  const [mentionMode, setMentionMode] = useState<"users" | "businesses">("users");
  const [taggedBusiness, setTaggedBusiness] = useState<SelectedBusiness | null>(null);
  const [newPostTagUrl, setNewPostTagUrl] = useState("");
  const [newPostTagUrlIsSocialVideo, setNewPostTagUrlIsSocialVideo] = useState(false);

  const handlePostTextChange = (t: string) => {
    setNewPostText(t);
    const match = t.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const handleMentionSelect = (mention: string) => {
    const updated = newPostText.replace(/@(\w*)$/, `@${mention} `);
    setNewPostText(updated);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const handleBusinessMentionSelect = (biz: SelectedBusiness) => {
    const slug = biz.name.replace(/\s+/g, "");
    const updated = newPostText.replace(/@(\w*)$/, `@${slug} `);
    setNewPostText(updated);
    setTaggedBusiness(biz);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const { groups, isLoading: groupsLoading, refetch: refetchGroups, join, leave } = useGroups();
  const [eventsTimeFilter, setEventsTimeFilter] = useState("Upcoming");
  const { events, isLoading: eventsLoading, refetch: refetchEvents } = useEvents();

  const filteredEvents = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return events.filter((e) => {
      if (!e.date) return true;
      const eventDate = new Date(e.date);
      if (eventsTimeFilter === "This Week") {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        return eventDate >= today && eventDate <= weekEnd;
      }
      if (eventsTimeFilter === "This Month") {
        const monthEnd = new Date(today);
        monthEnd.setDate(today.getDate() + 30);
        return eventDate >= today && eventDate <= monthEnd;
      }
      return eventDate >= today;
    });
  }, [events, eventsTimeFilter]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadPosts = useCallback(async () => {
    setLoadError(false);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/community/posts?feed=${feedMode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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

  const filteredPosts = posts;

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
      const uploaded: { uri: string; type: "image" | "video"; uploaded: string; isGraphic?: boolean; warningType?: string }[] = [];
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
          const data = await res.json() as { url: string; isGraphic?: boolean; warningType?: string };
          uploaded.push({ uri: asset.uri, type: kind, uploaded: data.url, isGraphic: data.isGraphic, warningType: data.warningType });
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
          businessId: taggedBusiness?.id ?? undefined,
          businessName: taggedBusiness?.name ?? undefined,
          businessLink: newPostTagUrl.trim()
            ? newPostTagUrl.trim()
            : newPostType === "business" && newPostBusinessLink.trim()
              ? newPostBusinessLink.trim()
              : undefined,
          visibility: newPostVisibility,
          mediaUrls: mediaAttachments.filter((m) => m.uploaded).map((m) => m.uploaded!),
          hasContentWarning: mediaAttachments.some((m) => m.isGraphic),
          contentWarningType: mediaAttachments.find((m) => m.isGraphic)?.warningType ?? undefined,
          locationTag: newPostLocationTag.trim() || undefined,
          locationType: newPostLocationTag.trim() ? newPostLocationType : undefined,
          topicTag: newPostTopicTag.trim() || undefined,
          isPrivateTopic: newPostTopicTag.trim() ? newPostIsPrivateTopic : undefined,
          audienceRating: newPostAudienceRating,
          ratingReason: newPostRatingReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { post: Record<string, unknown>; kinfolkSuggestions?: Array<{ id: string; name: string; category: string; city: string; rating: string; imageUrl: string | null; description: string }> };
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
        setNewPostAudienceRating("everyone");
        setNewPostRatingReason("");
        setTaggedBusiness(null);
        setNewPostTagUrl("");
        setNewPostTagUrlIsSocialVideo(false);
        setShowCompose(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (data.kinfolkSuggestions?.length) {
          setKinfolkSuggestions(data.kinfolkSuggestions);
          setShowKinfolkSuggest(true);
        }
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

  const handleDeletePost = async (postId: string) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/community/posts/${postId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", "Could not delete post. Try again.");
      }
    } catch {
      Alert.alert("Error", "Could not delete post. Check your connection.");
    }
  };

  const handleEditPost = (post: CommunityPost) => {
    setEditingPost(post);
    setEditPostText(post.content);
  };

  const submitEdit = async () => {
    if (!editingPost || !editPostText.trim()) return;
    setSubmittingEdit(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/community/posts/${editingPost.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: editPostText.trim() }),
      });
      if (res.ok) {
        const updated = editPostText.trim();
        setPosts((prev) => prev.map((p) => p.id === editingPost.id ? { ...p, content: updated } : p));
        setEditingPost(null);
        setEditPostText("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const err = await res.json() as { error?: string };
        Alert.alert("Error", err.error ?? "Could not update post.");
      }
    } catch {
      Alert.alert("Error", "Could not update post. Check your connection.");
    } finally {
      setSubmittingEdit(false);
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
        <TouchableOpacity activeOpacity={0.85}
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
          <TouchableOpacity activeOpacity={0.85}
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

      {activeTab === "Events" ? (
        <View style={{ flex: 1 }}>
          <View style={[styles.categoryScroll, { borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
              {["Upcoming", "This Week", "This Month"].map((f) => (
                <TouchableOpacity activeOpacity={0.85}
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
            data={filteredEvents}
            keyExtractor={(e) => e.id}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100, flexGrow: 1 }]}
            refreshControl={<RefreshControl refreshing={eventsLoading} onRefresh={refetchEvents} tintColor={colors.primary} />}
            ListHeaderComponent={
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.composeBar, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 4, marginBottom: 8 }]}
                  onPress={() => {
                    if (!isAuthenticated || !isPaidMember) {
                      setUpgradeFeature("Community Events");
                      setShowUpgrade(true);
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/submit-event");
                  }}
                >
                  <View style={[styles.composeBarAvatar, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={{ fontSize: 16 }}>📅</Text>
                  </View>
                  <Text style={[styles.composeBarPlaceholder, { color: colors.mutedForeground }]}>
                    Host an event in your community
                  </Text>
                  <View style={[styles.composeBarAtBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "25" }]}>
                    <Feather name="plus" size={13} color={colors.primary} />
                  </View>
                </TouchableOpacity>
                {isAuthenticated && events.some(e => (e.relevanceScore ?? 0) > 0) && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, paddingHorizontal: 2 }}>
                    <Text style={{ fontSize: 13 }}>✨</Text>
                    <Text style={[{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.mutedForeground }]}>Sorted by what KinfolkAI knows you love</Text>
                  </View>
                )}
              </>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="calendar" size={40} color={colors.muted} />
                <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
                  {filteredEvents.length === 0 && events.length > 0
                    ? `Nothing happening ${eventsTimeFilter === "This Week" ? "this week" : "this month"}`
                    : "No events yet"}
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {filteredEvents.length === 0 && events.length > 0
                    ? "Try switching to Upcoming to see all events."
                    : "Because the best journeys are shared — be the first to host one!"}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View>
                {(item.relevanceScore ?? 0) > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4, paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 11 }}>✨</Text>
                    <Text style={[{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.primary }]}>Matched your interests</Text>
                  </View>
                )}
                <EventCard
                  event={item}
                  onPress={() => router.push({ pathname: "/event/[id]", params: { id: item.id } })}
                />
              </View>
            )}
          />
        </View>
      ) : activeTab === "Circles ⭐" ? (
        <CirclesTab colors={colors} router={router} isAuthenticated={isAuthenticated} isPaidMember={isPaidMember} bottomPad={bottomPad} />
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
              <TouchableOpacity activeOpacity={0.85}
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
            style={{ flex: 1 }}
            contentContainerStyle={[styles.groupsList, { paddingBottom: bottomPad + 100, flexGrow: 1 }]}
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
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 40, gap: 14, flexGrow: 1 }]}
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

          {/* Travel Videos card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: "#1A3B2B", borderColor: "#2D7A4F55" }]}
            onPress={() => router.push("/travel-videos")}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <Feather name="film" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: "#FFFFFF" }]}>Travel Videos</Text>
              <Text style={[styles.resSpacesSub, { color: "rgba(255,255,255,0.75)" }]}>
                Watch community-made videos from destinations across the diaspora.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {/* Community Lists card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: "#CA922B", borderColor: "#C9922B55" }]}
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

          {/* Pay It Forward Guides card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: "#2D1B69", borderColor: "#7C3AED55" }]}
            onPress={() => router.push("/guides" as never)}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <Feather name="gift" size={22} color="#A78BFA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: "#FFFFFF" }]}>Pay It Forward</Text>
              <Text style={[styles.resSpacesSub, { color: "rgba(255,255,255,0.75)" }]}>
                Lived-experience guides — university survival kits, health journeys, neighborhood moves &amp; more.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {/* Community Collections card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: colors.card, borderColor: "#CA922B33" }]}
            onPress={() => router.push("/collections" as never)}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "#CA922B18" }]}>
              <Feather name="bookmark" size={22} color="#CA922B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: colors.foreground }]}>Community Collections</Text>
              <Text style={[styles.resSpacesSub, { color: colors.mutedForeground }]}>
                Curated picks from members — Moving to Atlanta, Best of Philly, Diabetes Resources &amp; more.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Opportunity Center card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: colors.card, borderColor: "#16A34A33" }]}
            onPress={() => router.push("/opportunities" as never)}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "#16A34A18" }]}>
              <Feather name="trending-up" size={22} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: colors.foreground }]}>Opportunity Center</Text>
              <Text style={[styles.resSpacesSub, { color: colors.mutedForeground }]}>
                Jobs, scholarships, grants, mentorship &amp; volunteer opportunities for the community.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* AI Travel Planner card */}
          <TouchableOpacity
            style={[styles.resSpacesCard, { backgroundColor: "#1A3B2B", borderColor: "#2D7A4F55" }]}
            onPress={() => router.push("/travel-planner" as never)}
            activeOpacity={0.85}
          >
            <View style={[styles.resSpacesIcon, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <Feather name="map" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resSpacesTitle, { color: "#FFFFFF" }]}>AI Travel Planner</Text>
              <Text style={[styles.resSpacesSub, { color: "rgba(255,255,255,0.75)" }]}>
                KinfolkAI builds your full itinerary — Black-owned hotels, restaurants, experiences &amp; safety context.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
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
            <TouchableOpacity activeOpacity={0.85} style={[styles.resCrisisBtn, { backgroundColor: "#DC2626" }]} onPress={() => Linking.openURL("tel:988").catch(() => {})}>
              <Feather name="phone-call" size={16} color="#FFF" />
              <Text style={styles.resCrisisBtnText}>Call / Text 988</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.resCrisisBtn, { backgroundColor: "#B91C1C" }]} onPress={() => Linking.openURL("sms:741741").catch(() => {})}>
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
      ) : activeTab === "Challenges 🏆" ? (
        <ChallengesTab colors={colors} router={router} isAuthenticated={isAuthenticated} bottomPad={bottomPad} />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={filteredPosts}
            keyExtractor={(p) => p.id}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100, flexGrow: 1 }]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListHeaderComponent={
              <>
                {/* Always-visible compose bar — shown first to prompt engagement */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.composeBar, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}
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

                {/* Feed mode toggle */}
                <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, gap: 8 }}>
                  {(isAuthenticated
                    ? (["foryou", "following"] as const)
                    : (["everyone", "following"] as const)
                  ).map((mode) => (
                    <TouchableOpacity activeOpacity={0.85}
                      key={mode}
                      onPress={() => {
                        setFeedMode(mode as "foryou" | "everyone" | "following");
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
                        {mode === "foryou" ? "For You" : mode === "everyone" ? "Explore" : "Following"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

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
                  <TouchableOpacity activeOpacity={0.85}
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
                currentUserId={user?.id}
                onCommentPress={() => setSelectedPost(item)}
                onAuthorPress={(id) => { router.push(`/user/${id}` as any); }}
                onLocationPress={(tag) => router.push({ pathname: "/location-feed", params: { location: tag } } as any)}
                onTopicPress={(tag) => router.push({ pathname: "/topic-feed", params: { topic: tag.toLowerCase() } } as any)}
                onEdit={handleEditPost}
                onDelete={(id) => handleDeletePost(id)}
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
        </View>
      )}

      <PostDetailModal
        visible={selectedPost !== null}
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onLike={() => void loadPosts()}
      />

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={upgradeFeature}
      />

      {/* KinfolkAI Alternative Suggestions Modal */}
      <Modal
        visible={showKinfolkSuggest}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowKinfolkSuggest(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.composeSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 16, maxHeight: "70%" }]}>
            <View style={[styles.composeHeader, { borderBottomColor: colors.border }]}>
              <View style={{ width: 60 }} />
              <Text style={[styles.composeTitle, { color: colors.foreground }]}>KinfolkAI™ Suggests</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setShowKinfolkSuggest(false)}>
                <Text style={[styles.composeCancelText, { color: colors.mutedForeground }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <View style={{ backgroundColor: "#2D7A4F", borderRadius: 8, padding: 6 }}>
                  <Feather name="zap" size={14} color="#fff" />
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, flex: 1, lineHeight: 18 }}>
                  Sorry about that experience. Here are some Black-owned businesses your community recommends nearby:
                </Text>
              </View>
              {kinfolkSuggestions.map((biz) => (
                <TouchableOpacity
                  key={biz.id}
                  activeOpacity={0.85}
                  onPress={() => { setShowKinfolkSuggest(false); router.push(`/business/${biz.id}` as any); }}
                  style={{ backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}
                >
                  {biz.imageUrl ? (
                    <Image source={{ uri: biz.imageUrl }} style={{ width: "100%", height: 100 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: "100%", height: 80, backgroundColor: "#2D7A4F22", alignItems: "center", justifyContent: "center" }}>
                      <Feather name="home" size={28} color="#2D7A4F" />
                    </View>
                  )}
                  <View style={{ padding: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 15, flex: 1 }} numberOfLines={1}>{biz.name}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 8 }}>
                        <Feather name="star" size={12} color="#CA922B" />
                        <Text style={{ color: "#CA922B", fontSize: 13, fontWeight: "600" }}>{parseFloat(biz.rating).toFixed(1)}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={{ backgroundColor: "#2D7A4F22", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: "#2D7A4F", fontSize: 11, fontWeight: "600" }}>Black-Owned</Text>
                      </View>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{biz.category} · {biz.city}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Post Modal */}
      <Modal
        visible={editingPost !== null}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onRequestClose={() => { setEditingPost(null); setEditPostText(""); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.composeSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 20 }]}>
            <View style={[styles.composeHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { setEditingPost(null); setEditPostText(""); }}
              >
                <Text style={[styles.composeCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.composeTitle, { color: colors.foreground }]}>Edit Post</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => void submitEdit()}
                disabled={!editPostText.trim() || submittingEdit}
              >
                <Text style={[styles.composePostText, { color: editPostText.trim() ? colors.primary : colors.muted }]}>
                  {submittingEdit ? "Saving…" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.composeInput, { color: colors.foreground }]}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={editPostText}
              onChangeText={setEditPostText}
              maxLength={10000}
              autoFocus
            />
            <Text style={[styles.charCount, { color: editPostText.length > 900 ? "#DC2626" : colors.mutedForeground }]}>
              {editPostText.length} / 1000
            </Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showCreateGroup} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={[styles.composeSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 20 }]}>
            <View style={[styles.composeHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setShowCreateGroup(false)}>
                <Text style={[styles.composeCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.composeTitle, { color: colors.foreground }]}>Start a Group</Text>
              <TouchableOpacity activeOpacity={0.85}
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
                  <TouchableOpacity activeOpacity={0.85}
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
                    { key: "Middle Eastern / North African", emoji: "🌙" },
                    { key: "Multiracial", emoji: "🌈" },
                  ].map((ci) => {
                    const isSelected = groupCreateAudience.includes(ci.key);
                    return (
                      <TouchableOpacity activeOpacity={0.85}
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
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.composeSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 20 }]}>
            <View style={[styles.composeHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setShowCompose(false)}>
                <Text style={[styles.composeCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.composeTitle, { color: colors.foreground }]}>New Post</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => void submitPost()} disabled={!newPostText.trim() || submittingPost}>
                <Text style={[styles.composePostText, { color: newPostText.trim() ? colors.primary : colors.muted }]}>
                  {submittingPost ? "Posting…" : "Post"}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

            {/* Post type selector */}
            <View style={[styles.categoryRow, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }]}>
              {([
                { value: "community", label: "💬 Discussion", color: "#C4622D" },
                { value: "question", label: "❓ Question", color: "#D4873A" },
                { value: "business", label: "🏪 Business", color: "#7B2D8B" },
                { value: "safety", label: "🚨 Safety", color: "#DC2626" },
                { value: "travel", label: "✈️ Travel", color: "#0369A1" },
              ] as const).map((opt) => (
                <TouchableOpacity activeOpacity={0.85}
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
                <TouchableOpacity activeOpacity={0.85}
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

            {/* Audience Guidance picker */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.mutedForeground, marginBottom: 6 }}>
                COMMUNITY GUIDANCE — Who is this for?
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {([
                  { value: "everyone",    label: "🟢 Everyone",       color: "#16A34A" },
                  { value: "teen",        label: "🔵 Teen (13+)",      color: "#2563EB" },
                  { value: "young_adult", label: "🟠 Young Adult (16+)", color: "#EA580C" },
                  { value: "adult",       label: "🔴 Adult (18+)",     color: "#DC2626" },
                ] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.85}
                    onPress={() => { setNewPostAudienceRating(opt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
                      borderWidth: 1,
                      borderColor: newPostAudienceRating === opt.value ? opt.color : colors.border,
                      backgroundColor: newPostAudienceRating === opt.value ? opt.color + "18" : "transparent",
                    }}
                  >
                    <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: newPostAudienceRating === opt.value ? opt.color : colors.mutedForeground }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {newPostAudienceRating !== "everyone" && (
                <TextInput
                  style={{
                    marginTop: 8, borderWidth: 1, borderColor: colors.border,
                    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                    fontFamily: "Inter_400Regular", fontSize: 12, color: colors.foreground,
                  }}
                  placeholder="Optional: why this rating? (e.g. discusses workplace discrimination)"
                  placeholderTextColor={colors.mutedForeground}
                  value={newPostRatingReason}
                  onChangeText={setNewPostRatingReason}
                  maxLength={200}
                />
              )}
            </View>

            {/* Visibility selector */}
            <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingBottom: 10, gap: 8, alignItems: "center" }}>
              <Feather name={newPostVisibility === "public" ? "globe" : "lock"} size={13} color={colors.mutedForeground} />
              {(["public", "followers_only"] as const).map((v) => (
                <TouchableOpacity activeOpacity={0.85}
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
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setNewPostLocationTag("")}>
                    <Feather name="x" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity activeOpacity={0.85}
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
                    <TouchableOpacity activeOpacity={0.85}
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
                    <TouchableOpacity activeOpacity={0.85} onPress={() => { setNewPostTopicTag(""); setNewPostIsPrivateTopic(false); }}>
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
                <TouchableOpacity activeOpacity={0.85}
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
                    <TouchableOpacity activeOpacity={0.85}
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

            {/* Tagged business strip + link input */}
            {taggedBusiness && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}>
                {/* Business pill */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.primary + "12", borderWidth: 1, borderColor: colors.primary + "35" }}>
                    <Feather name="briefcase" size={13} color={colors.primary} />
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.primary, flex: 1 }} numberOfLines={1}>
                      @{taggedBusiness.name}
                    </Text>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.primary + "20" }}>
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 10, color: colors.primary }}>Tagged</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => { setTaggedBusiness(null); setNewPostTagUrl(""); setNewPostTagUrlIsSocialVideo(false); }}
                  >
                    <Feather name="x-circle" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                {/* Double-exposure note */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Feather name="repeat" size={11} color={colors.mutedForeground} />
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>
                    Shows on your feed <Text style={{ fontWeight: "600" }}>+</Text> {taggedBusiness.name}'s vibe page
                  </Text>
                </View>

                {/* Video link input */}
                <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: "hidden" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, gap: 8, backgroundColor: "#7B2D8B06" }}>
                    <Feather name="video" size={14} color="#7B2D8B" />
                    <TextInput
                      style={{ flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: colors.foreground, paddingVertical: 10 }}
                      placeholder="Paste a video link — TikTok, Instagram, YouTube…"
                      placeholderTextColor={colors.mutedForeground}
                      value={newPostTagUrl}
                      onChangeText={setNewPostTagUrl}
                      keyboardType="url"
                      autoCapitalize="none"
                      maxLength={300}
                    />
                    {newPostTagUrl.trim().length > 0 && (
                      <TouchableOpacity onPress={() => setNewPostTagUrl("")} activeOpacity={0.7}>
                        <Feather name="x" size={14} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Social video label — always shown when a URL is entered */}
                  {newPostTagUrl.trim().length > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <Feather name="check-circle" size={12} color="#2D7A4F" />
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, flex: 1 }}>
                        Video will appear on your post <Text style={{ fontWeight: "600", color: colors.foreground }}>and</Text> {taggedBusiness.name}'s vibe page
                      </Text>
                      {isPaidMember && (
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: "#7B2D8B18", borderWidth: 1, borderColor: "#7B2D8B30" }}>
                          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 9, color: "#7B2D8B" }}>FEATURED</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}

            {mentionQuery !== null && (
              <View>
                <View style={{ flexDirection: "row", paddingHorizontal: 4, marginBottom: 4, gap: 6 }}>
                  <TouchableOpacity activeOpacity={0.85}
                    onPress={() => setMentionMode("users")}
                    style={[{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 }, mentionMode === "users" ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <Text style={[{ fontFamily: "Inter_600SemiBold", fontSize: 12 }, mentionMode === "users" ? { color: "#fff" } : { color: colors.mutedForeground }]}>People</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.85}
                    onPress={() => setMentionMode("businesses")}
                    style={[{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 }, mentionMode === "businesses" ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <Text style={[{ fontFamily: "Inter_600SemiBold", fontSize: 12 }, mentionMode === "businesses" ? { color: "#fff" } : { color: colors.mutedForeground }]}>Businesses</Text>
                  </TouchableOpacity>
                </View>
                {mentionMode === "users" ? (
                  <UserMentionPicker query={mentionQuery} onSelect={handleMentionSelect} />
                ) : (
                  <BusinessMentionPicker query={mentionQuery} businesses={businesses} onSelect={handleBusinessMentionSelect} />
                )}
              </View>
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
                    <TouchableOpacity activeOpacity={0.85}
                      onPress={() => setMediaAttachments((prev) => prev.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: "#DC2626", justifyContent: "center", alignItems: "center" }}
                    >
                      <Feather name="x" size={11} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            </ScrollView>

            <View style={styles.composeToolbar}>
              <TouchableOpacity
                style={[styles.mentionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                onPress={() => {
                  const next = newPostText.endsWith(" ") || newPostText === "" ? newPostText + "@" : newPostText + " @";
                  setNewPostText(next);
                  setMentionMode("users");
                  setMentionQuery("");
                  inputRef.current?.focus();
                }}
                activeOpacity={0.7}
              >
                <Feather name="at-sign" size={14} color={colors.primary} />
                <Text style={[styles.mentionBtnText, { color: colors.primary }]}>Tag someone</Text>
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

type Circle = {
  id: number; name: string; type: string; privacy: string; emoji: string;
  hostUserId: string; description: string | null; memberCount: number; city: string | null;
};

function CirclesTab({ colors, router, isAuthenticated, isPaidMember, bottomPad }: {
  colors: ReturnType<typeof useColors>;
  router: ReturnType<typeof useRouter>;
  isAuthenticated: boolean;
  isPaidMember: boolean;
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
              onPress={() => {
                if (!isPaidMember) {
                  Alert.alert(
                    "Membership Required",
                    "Creating Kinfolk Circles requires an Explorer+ or higher membership.",
                    [
                      { text: "Maybe Later", style: "cancel" },
                      { text: "View Plans", onPress: () => router.push("/membership" as any) },
                    ],
                  );
                  return;
                }
                router.push("/circles/create" as any);
              }}
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
            onPress={() => {
              if (!isPaidMember) {
                Alert.alert(
                  "Membership Required",
                  "Creating Kinfolk Circles requires an Explorer+ or higher membership.",
                  [
                    { text: "Maybe Later", style: "cancel" },
                    { text: "View Plans", onPress: () => router.push("/membership" as any) },
                  ],
                );
                return;
              }
              router.push("/circles/create" as any);
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" }}>Create a Circle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={circles}
          keyExtractor={(c) => String(c.id)}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPad + 100, flexGrow: 1 }}
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
  tabRow: { borderBottomWidth: 1, flexShrink: 0, height: 44 },
  tabBtn: { alignItems: "center", justifyContent: "center", paddingHorizontal: 16, height: 44, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18, includeFontPadding: false },
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
    shadowColor: "#CA922B",
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
});


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
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: bottomPad + 100, flexGrow: 1 }}
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
