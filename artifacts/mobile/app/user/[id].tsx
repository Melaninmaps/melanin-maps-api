import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { CommunityPostCard } from "@/components/CommunityPostCard";
import type { CommunityPost } from "@/constants/types";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

interface UserProfile {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  isPrivate?: boolean;
  followersCount?: number;
  followingCount?: number;
  trustLevel?: string | null;
  identityVerified?: boolean;
  memberType?: string | null;
  industry?: string | null;
  jobTitle?: string | null;
  createdAt?: string;
}

type FollowStatus = "not_following" | "following" | "pending";

const MEMBER_BADGE: Record<string, { label: string; color: string }> = {
  navigator:   { label: "Navigator",   color: "#2D7A4F" },
  trailblazer: { label: "Trailblazer", color: "#7B2D8B" },
  free:        { label: "Member",      color: "#C4622D" },
};

export default function VisitorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus>("not_following");
  const [canSeeContent, setCanSeeContent] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    setLoadingProfile(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/users/${id}/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { setLoadingProfile(false); return; }
      const data = await res.json() as { profile: UserProfile; isFollowing: boolean; followStatus: string | null; isFollowedBy: boolean; canSeeContent: boolean };
      setProfile(data.profile);
      setCanSeeContent(data.canSeeContent);
      if (data.isFollowing) setFollowStatus("following");
      else if (data.followStatus === "pending") setFollowStatus("pending");
      else setFollowStatus("not_following");
    } catch { /* ignore */ } finally {
      setLoadingProfile(false);
    }
  }, [id]);

  const loadPosts = useCallback(async () => {
    if (!id) return;
    setLoadingPosts(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/community/posts?authorId=${id}&limit=20`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { setLoadingPosts(false); return; }
      const data = await res.json() as { posts: any[] };
      const mapped: CommunityPost[] = (data.posts ?? []).map((p) => ({
        id: p.id,
        author: p.authorName ?? "Community Member",
        authorInitials: p.authorInitials ?? "CM",
        authorColor: p.authorColor ?? "#CA922B",
        authorId: p.authorId,
        content: p.content,
        likes: p.upvotes ?? 0,
        comments: p.commentsCount ?? 0,
        timeAgo: timeAgo(p.createdAt),
        category: p.category ?? "general",
        postType: p.postType ?? "community",
        liked: false,
        businessId: p.businessId,
        businessName: p.businessName,
        businessLink: p.businessLink,
        mediaUrls: p.mediaUrls ? JSON.parse(p.mediaUrls) : undefined,
        savedPlaceId: p.savedPlaceId,
        locationTag: p.locationTag,
        locationType: p.locationType,
        topicTag: p.topicTag,
        isPrivateTopic: p.isPrivateTopic,
        hasContentWarning: p.hasContentWarning,
        contentWarningType: p.contentWarningType,
        linkUrl: p.linkUrl,
        linkTitle: p.linkTitle,
        linkDescription: p.linkDescription,
        linkDomain: p.linkDomain,
        linkFavicon: p.linkFavicon,
        repostId: p.repostId,
        repostAuthorName: p.repostAuthorName,
        repostAuthorInitials: p.repostAuthorInitials,
        repostContent: p.repostContent,
        visibility: p.visibility,
      }));
      setPosts(mapped);
    } catch { /* ignore */ } finally {
      setLoadingPosts(false);
    }
  }, [id]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);
  useEffect(() => { void loadPosts(); }, [loadPosts]);
  useEffect(() => {
    SecureStore.getItemAsync("auth_session_token").then((token) => {
      if (!token) return;
      fetch(`${getApiBase()}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((d: any) => { if (d?.id) setMyId(d.id); })
        .catch(() => {});
    });
  }, []);

  const handleMoreMenu = () => {
    if (!profile) return;
    const name = profile.username ? `@${profile.username}` : "this user";
    Alert.alert(name, undefined, [
      {
        text: isBlocked ? "Unblock User" : "Block User",
        style: isBlocked ? "default" : "destructive",
        onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync("auth_session_token");
            if (!token) { Alert.alert("Sign in required", "You need to be signed in."); return; }
            const method = isBlocked ? "DELETE" : "POST";
            const res = await fetch(`${getApiBase()}/api/users/${id}/block`, {
              method,
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              setIsBlocked(!isBlocked);
              if (!isBlocked) {
                setFollowStatus("not_following");
                Alert.alert("User blocked", `You won't see ${name}'s content.`);
              }
            }
          } catch { /* ignore */ }
        },
      },
      {
        text: "Report User",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Report User",
            "What's the issue with this account?",
            [
              { text: "Spam or fake account", onPress: () => submitReport("spam") },
              { text: "Harassment or bullying", onPress: () => submitReport("harassment") },
              { text: "Inappropriate content", onPress: () => submitReport("inappropriate") },
              { text: "Other", onPress: () => submitReport("other") },
              { text: "Cancel", style: "cancel" },
            ],
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const submitReport = async (reason: string) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) return;
      await fetch(`${getApiBase()}/api/content-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetType: "user", targetId: id, reason }),
      });
      Alert.alert("Report submitted", "Our moderation team will review this account within 24 hours. Thank you for helping keep the community safe.");
    } catch { /* ignore */ }
  };

  const handleFollow = async () => {
    if (!id || !profile) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) {
        Alert.alert("Sign in required", "You need to be signed in to follow people.");
        setFollowLoading(false);
        return;
      }
      if (followStatus === "following" || followStatus === "pending") {
        const res = await fetch(`${getApiBase()}/api/users/${id}/follow`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setFollowStatus("not_following");
          setProfile((p) => p ? { ...p, followersCount: Math.max((p.followersCount ?? 1) - 1, 0) } : p);
          if (!profile.isPrivate) setCanSeeContent(false);
        }
      } else {
        const res = await fetch(`${getApiBase()}/api/users/${id}/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json() as { status: string };
          setFollowStatus(data.status === "pending" ? "pending" : "following");
          if (data.status === "accepted") {
            setProfile((p) => p ? { ...p, followersCount: (p.followersCount ?? 0) + 1 } : p);
            setCanSeeContent(true);
          }
        }
      }
    } catch { /* ignore */ } finally {
      setFollowLoading(false);
    }
  };

  const displayName = profile?.username ? `@${profile.username}` : "Community Member";
  const initials = (profile?.username ?? "CM").slice(0, 2).toUpperCase();
  const memberBadge = MEMBER_BADGE[(profile?.memberType ?? "free").toLowerCase()];
  const isOwnProfile = myId && id && myId === id;

  const followBtnLabel =
    followStatus === "following" ? "Following" :
    followStatus === "pending" ? "Requested" :
    "Follow";
  const followBtnIcon =
    followStatus === "following" ? "user-check" :
    followStatus === "pending" ? "clock" :
    "user-plus";

  const visiblePosts = canSeeContent
    ? posts
    : posts.filter((p) => (p as any).visibility === "public");

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Nav bar */}
      <View style={[s.navbar, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: colors.foreground }]} numberOfLines={1}>
          {displayName || "Profile"}
        </Text>
        {!isOwnProfile && profile ? (
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: colors.secondary }]}
            onPress={handleMoreMenu}
            activeOpacity={0.7}
            accessibilityLabel="More options"
          >
            <Feather name="more-vertical" size={18} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {loadingProfile ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : !profile ? (
          <View style={s.emptyState}>
            <Feather name="user-x" size={40} color={colors.muted} />
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>Profile not found</Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>This user may have deleted their account.</Text>
          </View>
        ) : (
          <>
            {/* Profile card */}
            <View style={[s.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Avatar */}
              <View style={[s.avatar, { backgroundColor: "#CA922B" }]}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>

              {/* Handle + verified */}
              <View style={s.nameRow}>
                <Text style={[s.displayName, { color: colors.foreground }]}>{displayName}</Text>
                {profile.identityVerified && (
                  <Feather name="check-circle" size={16} color="#2D7A4F" />
                )}
              </View>
              {memberBadge && (
                <View style={[s.memberBadge, { backgroundColor: memberBadge.color + "15", borderColor: memberBadge.color + "40" }]}>
                  <View style={[s.memberDot, { backgroundColor: memberBadge.color }]} />
                  <Text style={[s.memberBadgeText, { color: memberBadge.color }]}>{memberBadge.label}</Text>
                </View>
              )}

              {/* Job + industry */}
              {(profile.jobTitle || profile.industry) && (
                <Text style={[s.jobLine, { color: colors.mutedForeground }]}>
                  {[profile.jobTitle, profile.industry].filter(Boolean).join(" · ")}
                </Text>
              )}

              {/* Bio */}
              {profile.bio && canSeeContent && (
                <Text style={[s.bio, { color: colors.foreground }]}>{profile.bio}</Text>
              )}

              {/* Private account notice */}
              {profile.isPrivate && !canSeeContent && (
                <View style={[s.privateNotice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="lock" size={14} color={colors.mutedForeground} />
                  <Text style={[s.privateText, { color: colors.mutedForeground }]}>This account is private. Follow to see their content.</Text>
                </View>
              )}

              {/* Stats row */}
              <View style={[s.statsRow, { borderTopColor: colors.border }]}>
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: colors.primary }]}>{profile.followersCount ?? 0}</Text>
                  <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
                </View>
                <View style={[s.statDivider, { backgroundColor: colors.border }]} />
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: colors.primary }]}>{profile.followingCount ?? 0}</Text>
                  <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Following</Text>
                </View>
                <View style={[s.statDivider, { backgroundColor: colors.border }]} />
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: colors.primary }]}>{visiblePosts.length}</Text>
                  <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
                </View>
              </View>

              {/* Actions */}
              {!isOwnProfile && (
                <View style={s.actionsRow}>
                  <TouchableOpacity
                    style={[
                      s.followBtn,
                      followStatus !== "not_following"
                        ? { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }
                        : { backgroundColor: colors.primary },
                    ]}
                    onPress={handleFollow}
                    disabled={followLoading}
                    activeOpacity={0.8}
                  >
                    {followLoading ? (
                      <ActivityIndicator size="small" color={followStatus !== "not_following" ? colors.foreground : "#FFFFFF"} />
                    ) : (
                      <>
                        <Feather name={followBtnIcon as any} size={15} color={followStatus !== "not_following" ? colors.foreground : "#FFFFFF"} />
                        <Text style={[s.followBtnText, { color: followStatus !== "not_following" ? colors.foreground : "#FFFFFF" }]}>
                          {followBtnLabel}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.messageBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => router.push(`/messages?userId=${id}` as any)}
                    activeOpacity={0.8}
                  >
                    <Feather name="message-circle" size={15} color={colors.foreground} />
                    <Text style={[s.messageBtnText, { color: colors.foreground }]}>Message</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Posts section */}
            <View style={s.postsSection}>
              <Text style={[s.postsSectionTitle, { color: colors.foreground }]}>
                {canSeeContent ? "Posts" : "Public Posts"}
              </Text>
              {!canSeeContent && (
                <View style={[s.followersOnlyTeaser, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="lock" size={18} color={colors.muted} />
                  <Text style={[s.teaserTitle, { color: colors.foreground }]}>Follow to see all posts</Text>
                  <Text style={[s.teaserSub, { color: colors.mutedForeground }]}>
                    This member shares some posts only with followers.
                  </Text>
                </View>
              )}
              {loadingPosts ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
              ) : visiblePosts.length === 0 ? (
                <View style={s.emptyPosts}>
                  <Feather name="edit-3" size={28} color={colors.muted} />
                  <Text style={[s.emptyPostsText, { color: colors.mutedForeground }]}>No posts yet</Text>
                </View>
              ) : (
                visiblePosts.map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    onAuthorPress={() => {}}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: { fontFamily: "Inter_700Bold", fontSize: 16, flex: 1, textAlign: "center", marginHorizontal: 8 },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarInitials: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#FFFFFF" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  displayName: { fontFamily: "Inter_700Bold", fontSize: 20 },
  username: { fontFamily: "Inter_400Regular", fontSize: 13 },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  memberDot: { width: 6, height: 6, borderRadius: 3 },
  memberBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  jobLine: { fontFamily: "Inter_400Regular", fontSize: 13 },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  privateNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  privateText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 17 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 14,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statDivider: { width: 1, height: 30 },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 8,
  },
  followBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 10,
  },
  followBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  messageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  messageBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  postsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  postsSectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    marginBottom: 12,
  },
  followersOnlyTeaser: {
    alignItems: "center",
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  teaserTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  teaserSub: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", lineHeight: 17 },
  emptyPosts: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyPostsText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
