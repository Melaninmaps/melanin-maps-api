import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const SOCIAL_ICONS: Record<string, string> = {
  instagram: "📸",
  tiktok: "🎵",
  twitter: "🐦",
  facebook: "📘",
  YouTube: "▶️",
  TikTok: "🎵",
  Instagram: "📸",
  Facebook: "📘",
};
function detectPlatform(url: string): string {
  if (/tiktok/i.test(url)) return "TikTok";
  if (/instagram/i.test(url)) return "Instagram";
  if (/facebook|fb\.watch/i.test(url)) return "Facebook";
  if (/youtube|youtu\.be/i.test(url)) return "YouTube";
  return "Social";
}

interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  industry: string | null;
  jobTitle: string | null;
  createdAt: string;
  memberType: string | null;
}

interface ReviewItem {
  id: string;
  businessId: string;
  rating: number;
  text: string | null;
  socialPostUrl: string | null;
  socialHandle: string | null;
  socialPlatform: string | null;
  createdAt: string;
}

interface ProfileTag {
  id: number;
  taggerId: string;
  content: string;
  createdAt: string;
  taggerFirstName: string | null;
  taggerLastName: string | null;
  taggerUsername: string | null;
  taggerProfileImageUrl: string | null;
}

const RATING_LABELS: Record<number, string> = { 1: "😕", 2: "😐", 3: "🙂", 4: "😊", 5: "👑" };

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: me, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [tags, setTags] = useState<ProfileTag[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "tags">("reviews");
  const [tagInput, setTagInput] = useState("");
  const [postingTag, setPostingTag] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const myId = (me as any)?.id ?? "";
  const isOwnProfile = myId === userId;

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/users/${userId}/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as {
          user: UserProfile;
          reviews: ReviewItem[];
          tags: ProfileTag[];
          connectionStatus: string | null;
          connectionId: number | null;
        };
        setProfile(data.user);
        setReviews(data.reviews ?? []);
        setTags(data.tags ?? []);
        setConnectionStatus(data.connectionStatus);
        setConnectionId(data.connectionId);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const handleConnect = async () => {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    setActionLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (connectionStatus === "connected" && connectionId) {
        // Remove connection
        Alert.alert("Remove connection?", "You'll no longer be connected.", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove", style: "destructive",
            onPress: async () => {
              await fetch(`${getApiBase()}/api/connections/${connectionId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              await loadProfile();
            },
          },
        ]);
      } else if (connectionStatus === null) {
        // Send request
        await fetch(`${getApiBase()}/api/connections/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ recipientId: userId }),
        });
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadProfile();
      } else if (connectionStatus === "pending_received" && connectionId) {
        // Accept incoming request
        await fetch(`${getApiBase()}/api/connections/${connectionId}/respond`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ action: "accept" }),
        });
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadProfile();
      }
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  const handlePostTag = async () => {
    if (!tagInput.trim() || !isAuthenticated) return;
    setPostingTag(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/users/${userId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ content: tagInput.trim() }),
      });
      if (res.ok) {
        setTagInput("");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadProfile();
        setActiveTab("tags");
      }
    } catch { /* silent */ }
    finally { setPostingTag(false); }
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/profile-tags/${tagId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch { /* silent */ }
  };

  const connectBtnLabel = () => {
    if (connectionStatus === "connected") return "Connected ✓";
    if (connectionStatus === "pending_sent") return "Request Sent";
    if (connectionStatus === "pending_received") return "Accept Request";
    return "Connect";
  };
  const connectBtnColor = () => {
    if (connectionStatus === "connected") return "#2D7A4F";
    if (connectionStatus === "pending_sent") return colors.muted;
    return colors.primary;
  };

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
        <View style={s.center}>
          <Text style={[{ fontFamily: "Inter_400Regular" }, { color: colors.mutedForeground }]}>Profile not found</Text>
        </View>
      </View>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Community Member";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{displayName}</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={(activeTab === "reviews" ? reviews : tags) as any[]}
        keyExtractor={(item: any) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 60 }}
        ListHeaderComponent={
          <View>
            {/* Profile hero */}
            <View style={[s.hero, { borderBottomColor: colors.border }]}>
              {profile.profileImageUrl ? (
                <Image source={{ uri: profile.profileImageUrl }} style={s.heroAvatar} />
              ) : (
                <View style={[s.heroAvatar, { backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }]}>
                  <Feather name="user" size={36} color={colors.primary} />
                </View>
              )}
              <Text style={[s.heroName, { color: colors.foreground }]}>{displayName}</Text>
              {profile.username && (
                <Text style={[s.heroUsername, { color: colors.mutedForeground }]}>@{profile.username}</Text>
              )}
              {(profile.jobTitle || profile.industry) && (
                <Text style={[s.heroRole, { color: colors.mutedForeground }]}>
                  {[profile.jobTitle, profile.industry].filter(Boolean).join(" · ")}
                </Text>
              )}
              {profile.bio && (
                <Text style={[s.heroBio, { color: colors.foreground }]}>{profile.bio}</Text>
              )}
              {profile.memberType && profile.memberType !== "free" && (
                <View style={[s.memberBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[s.memberBadgeText, { color: colors.primary }]}>
                    {profile.memberType === "founding" ? "⭐ Founding Member" : "🌍 Community Member"}
                  </Text>
                </View>
              )}
              {/* Connect button */}
              {!isOwnProfile && isAuthenticated && (
                <TouchableOpacity
                  style={[s.connectBtn, { backgroundColor: connectionStatus === "pending_sent" ? colors.card : connectBtnColor(), borderColor: connectBtnColor() }]}
                  onPress={() => void handleConnect()}
                  disabled={actionLoading || connectionStatus === "pending_sent"}
                  activeOpacity={0.85}
                >
                  {actionLoading ? <ActivityIndicator size="small" color={connectionStatus === "pending_sent" ? colors.mutedForeground : "#FFF"} /> : (
                    <>
                      <Feather
                        name={connectionStatus === "connected" ? "user-check" : connectionStatus === "pending_sent" ? "clock" : "user-plus"}
                        size={15}
                        color={connectionStatus === "pending_sent" ? colors.mutedForeground : "#FFF"}
                      />
                      <Text style={[s.connectBtnText, { color: connectionStatus === "pending_sent" ? colors.mutedForeground : "#FFF" }]}>
                        {connectBtnLabel()}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Tag input (only for other users' profiles) */}
            {!isOwnProfile && isAuthenticated && (
              <View style={[s.tagInputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[s.tagInput, { color: colors.foreground }]}
                  placeholder={`Say something kind about ${profile.firstName ?? "them"}…`}
                  placeholderTextColor={colors.mutedForeground}
                  value={tagInput}
                  onChangeText={setTagInput}
                  maxLength={280}
                  multiline
                />
                <TouchableOpacity
                  style={[s.tagPostBtn, { backgroundColor: tagInput.trim() ? colors.primary : colors.muted }]}
                  onPress={() => void handlePostTag()}
                  disabled={!tagInput.trim() || postingTag}
                >
                  {postingTag ? <ActivityIndicator size="small" color="#FFF" /> : (
                    <Feather name="send" size={15} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Tabs */}
            <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[s.tab, activeTab === "reviews" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab("reviews")}
              >
                <Text style={[s.tabText, { color: activeTab === "reviews" ? colors.primary : colors.mutedForeground }]}>
                  Reviews ({reviews.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tab, activeTab === "tags" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab("tags")}
              >
                <Text style={[s.tabText, { color: activeTab === "tags" ? colors.primary : colors.mutedForeground }]}>
                  Profile Tags ({tags.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyTab}>
            <Text style={[s.emptyTabText, { color: colors.mutedForeground }]}>
              {activeTab === "reviews" ? "No reviews posted yet." : "No profile tags yet."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === "reviews") {
            const rev = item as ReviewItem;
            const platform = rev.socialPostUrl ? detectPlatform(rev.socialPostUrl) : null;
            return (
              <View style={[s.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.reviewHeader}>
                  <Text style={{ fontSize: 20 }}>{RATING_LABELS[rev.rating] ?? "⭐"}</Text>
                  <Text style={[s.reviewDate, { color: colors.mutedForeground }]}>
                    {new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                </View>
                {rev.text ? (
                  <Text style={[s.reviewText, { color: colors.foreground }]}>{rev.text}</Text>
                ) : null}
                {rev.socialPostUrl && (
                  <TouchableOpacity
                    style={[s.socialLink, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
                    onPress={() => Linking.openURL(rev.socialPostUrl!)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 14 }}>{SOCIAL_ICONS[platform ?? ""] ?? "🔗"}</Text>
                    <Text style={[s.socialLinkText, { color: colors.primary }]}>View {platform ?? "Post"}</Text>
                    <Feather name="external-link" size={13} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          }
          const tag = item as ProfileTag;
          const canDelete = myId === tag.taggerId || myId === userId;
          const taggerName = [tag.taggerFirstName, tag.taggerLastName].filter(Boolean).join(" ") || "Community member";
          return (
            <View style={[s.tagCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.tagCardHeader}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  onPress={() => router.push(`/user-profile/${tag.taggerId}` as never)}
                  activeOpacity={0.8}
                >
                  {tag.taggerProfileImageUrl ? (
                    <Image source={{ uri: tag.taggerProfileImageUrl }} style={s.tagAvatar} />
                  ) : (
                    <View style={[s.tagAvatar, { backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="user" size={12} color={colors.primary} />
                    </View>
                  )}
                  <Text style={[s.tagAuthor, { color: colors.foreground }]}>{taggerName}</Text>
                </TouchableOpacity>
                {canDelete && (
                  <TouchableOpacity onPress={() => void handleDeleteTag(tag.id)}>
                    <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[s.tagContent, { color: colors.foreground }]}>{tag.content}</Text>
              <Text style={[s.tagDate, { color: colors.mutedForeground }]}>
                {new Date(tag.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 17 },
  hero: { alignItems: "center", padding: 24, gap: 6, borderBottomWidth: 1 },
  heroAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 4 },
  heroName: { fontFamily: "Inter_700Bold", fontSize: 22 },
  heroUsername: { fontFamily: "Inter_400Regular", fontSize: 14 },
  heroRole: { fontFamily: "Inter_400Regular", fontSize: 13 },
  heroBio: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center", paddingHorizontal: 20, marginTop: 4 },
  memberBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 4 },
  memberBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  connectBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, marginTop: 12 },
  connectBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  tagInputRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, margin: 14, borderRadius: 16, borderWidth: 1, padding: 12 },
  tagInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, maxHeight: 80 },
  tagPostBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  emptyTab: { padding: 40, alignItems: "center" },
  emptyTabText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  reviewCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  reviewDate: { fontFamily: "Inter_400Regular", fontSize: 12 },
  reviewText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, marginBottom: 8 },
  socialLink: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignSelf: "flex-start" },
  socialLinkText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  tagCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  tagCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  tagAvatar: { width: 28, height: 28, borderRadius: 14 },
  tagAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  tagContent: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, marginBottom: 6 },
  tagDate: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
