import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import type { CommunityPost } from "@/constants/types";
import { parseMediaUrls } from "@/lib/mediaUrls";
import { getApiBase } from "@/lib/api";

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
  coverUrl?: string | null;
  location?: string | null;
  age?: number | null;
  birthday?: string | null;
  createdAt?: string;
}

type EarnedBadge = { achievementType: string; earnedAt?: string | null };

type FollowStatus = "not_following" | "following" | "pending";
type ProfileTab = "posts" | "media" | "tagged" | "notes";
type ProfileNote = {
  id: string;
  content: string;
  createdAt?: string | null;
  taggerFirstName?: string | null;
  taggerLastName?: string | null;
  taggerUsername?: string | null;
};

function toCommunityPost(post: any): CommunityPost {
  return {
    id: post.id,
    author: post.authorName ?? "Community Member",
    authorInitials: post.authorInitials ?? "CM",
    authorColor: post.authorColor ?? "#CA922B",
    authorId: post.authorId,
    content: post.content,
    likes: post.upvotes ?? 0,
    comments: post.commentsCount ?? 0,
    timeAgo: timeAgo(post.createdAt),
    category: post.category ?? "general",
    postType: post.postType ?? "community",
    liked: false,
    businessId: post.businessId,
    businessName: post.businessName,
    businessLink: post.businessLink,
    mediaUrls: parseMediaUrls(post.mediaUrls),
    savedPlaceId: post.savedPlaceId,
    locationTag: post.locationTag,
    locationType: post.locationType,
    topicTag: post.topicTag,
    isPrivateTopic: post.isPrivateTopic,
    hasContentWarning: post.hasContentWarning,
    contentWarningType: post.contentWarningType,
    linkUrl: post.linkUrl,
    linkTitle: post.linkTitle,
    linkDescription: post.linkDescription,
    linkDomain: post.linkDomain,
    linkFavicon: post.linkFavicon,
    repostId: post.repostId,
    repostAuthorName: post.repostAuthorName,
    repostAuthorInitials: post.repostAuthorInitials,
    repostContent: post.repostContent,
    visibility: post.visibility,
  };
}

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
  const [taggedPosts, setTaggedPosts] = useState<CommunityPost[]>([]);
  const [profileNotes, setProfileNotes] = useState<ProfileNote[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [canReceiveDirectMessages, setCanReceiveDirectMessages] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<"unavailable" | "retry" | null>(null);
  const [memberAuthHeaders, setMemberAuthHeaders] = useState<Record<string, string>>({});
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    setLoadingProfile(true);
    setProfileLoadError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      setMemberAuthHeaders(token ? { Authorization: `Bearer ${token}` } : {});
      const res = await fetch(`${getApiBase()}/api/users/${id}/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setProfile(null);
        setProfileLoadError(res.status >= 500 ? "retry" : "unavailable");
        return;
      }
      const data = await res.json() as { profile: UserProfile; isFollowing: boolean; followStatus: string | null; isFollowedBy: boolean; canSeeContent: boolean; canReceiveDirectMessages?: boolean; badges?: EarnedBadge[]; tags?: ProfileNote[] };
      const nextProfile = data.profile;
      if (!nextProfile) {
        setProfile(null);
        setProfileLoadError("unavailable");
        return;
      }
      setProfile(nextProfile);
      setCanSeeContent(data.canSeeContent);
      setCanReceiveDirectMessages(Boolean(data.canReceiveDirectMessages));
      setProfileNotes(Array.isArray(data.tags) ? data.tags.filter((tag): tag is ProfileNote => Boolean(tag) && typeof tag.id === "string" && typeof tag.content === "string") : []);
      setEarnedBadges(Array.isArray(data.badges) ? data.badges.filter((badge): badge is EarnedBadge => Boolean(badge) && typeof badge.achievementType === "string") : []);
      if (data.isFollowing) setFollowStatus("following");
      else if (data.followStatus === "pending") setFollowStatus("pending");
      else setFollowStatus("not_following");
    } catch {
      setProfile(null);
      setProfileLoadError("retry");
    } finally {
      setLoadingProfile(false);
    }
  }, [id]);

  const loadPosts = useCallback(async () => {
    if (!id) return;
    setLoadingPosts(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [authoredResponse, taggedResponse] = await Promise.all([
        fetch(`${getApiBase()}/api/community/posts?authorId=${encodeURIComponent(id)}&limit=20`, { headers }),
        fetch(`${getApiBase()}/api/community/posts?taggedUserId=${encodeURIComponent(id)}&limit=20`, { headers }),
      ]);
      const [authoredPayload, taggedPayload] = await Promise.all([
        authoredResponse.ok ? authoredResponse.json() as Promise<{ posts?: any[] }> : Promise.resolve({ posts: [] }),
        taggedResponse.ok ? taggedResponse.json() as Promise<{ posts?: any[] }> : Promise.resolve({ posts: [] }),
      ]);
      setPosts((authoredPayload.posts ?? []).map(toCommunityPost));
      setTaggedPosts((taggedPayload.posts ?? []).map(toCommunityPost));
    } catch { /* ignore */ } finally {
      setLoadingPosts(false);
    }
  }, [id]);

  useEffect(() => { queueMicrotask(() => { void loadProfile(); }); }, [loadProfile]);
  useEffect(() => { setActiveTab("posts"); }, [id]);
  useEffect(() => {
    if (!profile?.id || !canSeeContent) {
      setPosts([]);
      setTaggedPosts([]);
      setLoadingPosts(false);
      return;
    }
    queueMicrotask(() => { void loadPosts(); });
  }, [canSeeContent, loadPosts, profile?.id]);
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
          // Public profiles remain readable after an unfollow. Private profiles
          // immediately return to their server-shaped private state.
          setCanSeeContent(!profile.isPrivate);
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

  const handleStartMessage = async () => {
    if (!id || !profile) return;
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) {
        Alert.alert("Sign in required", "You need to be signed in to message this member.");
        return;
      }
      const res = await fetch(`${getApiBase()}/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "dm", participantId: id, title: profile.username ? `@${profile.username}` : "Direct Message" }),
      });
      const data = await res.json() as { conversation?: { id: number }; error?: string };
      if (!res.ok || !data.conversation) {
        Alert.alert("Message unavailable", data.error ?? "This member cannot receive direct messages right now.");
        return;
      }
      router.push({ pathname: "/chat/[id]", params: { id: String(data.conversation.id) } });
    } catch {
      Alert.alert("Message unavailable", "Could not start a conversation. Please try again.");
    }
  };

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || (profile?.username ? `@${profile.username}` : "Community Member");
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
  const mediaPosts = visiblePosts.filter((post) => (post.mediaUrls?.length ?? 0) > 0);
  const activePosts = activeTab === "media" ? mediaPosts : activeTab === "tagged" ? taggedPosts : visiblePosts;
  const activeSectionTitle = activeTab === "media" ? "Photos & videos" : activeTab === "tagged" ? "Tagged" : activeTab === "notes" ? "Profile notes" : canSeeContent ? "Posts" : "Public posts";

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
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>{profileLoadError === "retry" ? "Profile unavailable" : "Profile unavailable"}</Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>{profileLoadError === "retry" ? "We could not load this profile. Please try again." : "This member profile is unavailable or you do not have permission to view it."}</Text>
            {profileLoadError === "retry" ? <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.primary }]} onPress={() => void loadProfile()} accessibilityRole="button" accessibilityLabel="Retry loading member profile"><Text style={s.retryBtnText}>Retry</Text></TouchableOpacity> : null}
          </View>
        ) : (
          <>
            {/* Profile card */}
            <View style={[s.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {profile.coverUrl && canSeeContent ? <Image source={{ uri: `${getApiBase()}${profile.coverUrl}`, headers: memberAuthHeaders }} style={s.coverImage} accessibilityLabel={`${displayName} profile cover`} /> : null}
              {/* Avatar */}
              <View style={[s.avatar, { backgroundColor: "#CA922B" }]}>
                {profile.profileImageUrl ? <Image source={{ uri: profile.profileImageUrl }} style={s.avatarImage} accessibilityLabel={`${displayName} profile image`} /> : <Text style={s.avatarInitials}>{initials}</Text>}
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

              {(profile.location || profile.age || profile.birthday) && canSeeContent && (
                <View style={s.profileFacts}>
                  {profile.location ? <Text style={[s.profileFact, { color: colors.mutedForeground }]}><Feather name="map-pin" size={12} color={colors.primary} /> {profile.location}</Text> : null}
                  {profile.age ? <Text style={[s.profileFact, { color: colors.mutedForeground }]}><Feather name="user" size={12} color={colors.primary} /> {profile.age}</Text> : null}
                  {profile.birthday ? <Text style={[s.profileFact, { color: colors.mutedForeground }]}><Feather name="gift" size={12} color={colors.primary} /> {profile.birthday}</Text> : null}
                </View>
              )}

              {/* Bio */}
              {profile.bio && canSeeContent && (
                <Text style={[s.bio, { color: colors.foreground }]}>{profile.bio}</Text>
              )}

              {earnedBadges.length > 0 && canSeeContent ? (
                <View style={s.badgeRow} accessibilityLabel="Earned profile badges">
                  {earnedBadges.slice(0, 4).map((badge) => <View key={`${badge.achievementType}-${badge.earnedAt ?? "earned"}`} style={[s.earnedBadge, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30" }]}><Feather name="award" size={12} color={colors.primary} /><Text style={[s.earnedBadgeText, { color: colors.primary }]}>{badge.achievementType.replace(/[_-]+/g, " ")}</Text></View>)}
                </View>
              ) : null}

              {/* Private account notice */}
              {!canSeeContent && (
                <View style={[s.privateNotice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="lock" size={14} color={colors.mutedForeground} />
                  <Text style={[s.privateText, { color: colors.mutedForeground }]}>This profile is private. Follow requests must be accepted before activity is shown.</Text>
                </View>
              )}

              {/* Stats row */}
              <View style={[s.statsRow, { borderTopColor: colors.border }]}>
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: colors.primary }]}>{typeof profile.followersCount === "number" ? profile.followersCount : "—"}</Text>
                  <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
                </View>
                <View style={[s.statDivider, { backgroundColor: colors.border }]} />
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: colors.primary }]}>{typeof profile.followingCount === "number" ? profile.followingCount : "—"}</Text>
                  <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Following</Text>
                </View>
                <View style={[s.statDivider, { backgroundColor: colors.border }]} />
                <View style={s.statItem}>
                  <Text style={[s.statValue, { color: colors.primary }]}>{visiblePosts.length}</Text>
                  <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
                </View>
              </View>

              {/* Actions */}
              {isOwnProfile ? (
                <TouchableOpacity style={[s.editBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]} onPress={() => router.push("/(tabs)/profile" as never)} accessibilityRole="button" accessibilityLabel="Edit my profile">
                  <Feather name="edit-2" size={15} color={colors.foreground} />
                  <Text style={[s.messageBtnText, { color: colors.foreground }]}>Edit profile</Text>
                </TouchableOpacity>
              ) : (
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
                    accessibilityRole="button"
                    accessibilityLabel={`${followBtnLabel} ${displayName}`}
                    accessibilityState={{ busy: followLoading, selected: followStatus === "following" }}
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
                  {canReceiveDirectMessages ? <TouchableOpacity
                    style={[s.messageBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => void handleStartMessage()}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Message ${displayName}`}
                  >
                    <Feather name="message-circle" size={15} color={colors.foreground} />
                    <Text style={[s.messageBtnText, { color: colors.foreground }]}>Message</Text>
                  </TouchableOpacity> : null}
                </View>
              )}
            </View>

            {/* Server-authorized profile activity. The tagged feed repeats all
                Community visibility, block, moderation, and group checks. */}
            <View style={s.postsSection}>
              {canSeeContent ? <View style={s.profileTabs} accessibilityRole="tablist">
                {([
                  ["posts", "Posts"],
                  ["media", "Media"],
                  ["tagged", "Tagged"],
                  ["notes", "Notes"],
                ] as Array<[ProfileTab, string]>).map(([tab, label]) => <TouchableOpacity
                  key={tab}
                  style={[s.profileTab, { backgroundColor: activeTab === tab ? colors.primary : colors.secondary, borderColor: activeTab === tab ? colors.primary : colors.border }]}
                  onPress={() => setActiveTab(tab)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === tab }}
                ><Text style={[s.profileTabText, { color: activeTab === tab ? "#FFFFFF" : colors.mutedForeground }]}>{label}</Text></TouchableOpacity>)}
              </View> : null}
              <Text style={[s.postsSectionTitle, { color: colors.foreground }]}>{activeSectionTitle}</Text>
              {!canSeeContent && (
                <View style={[s.followersOnlyTeaser, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="lock" size={18} color={colors.muted} />
                  <Text style={[s.teaserTitle, { color: colors.foreground }]}>Follow to see all posts</Text>
                  <Text style={[s.teaserSub, { color: colors.mutedForeground }]}>
                    This member shares some posts only with followers.
                  </Text>
                </View>
              )}
              {loadingPosts && activeTab !== "notes" ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
              ) : activeTab === "notes" ? profileNotes.length === 0 ? (
                <View style={s.emptyPosts}>
                  <Feather name="message-square" size={28} color={colors.muted} />
                  <Text style={[s.emptyPostsText, { color: colors.mutedForeground }]}>No visible profile notes yet</Text>
                </View>
              ) : profileNotes.map((note) => (
                <View key={note.id} style={[s.profileNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.profileNoteText, { color: colors.foreground }]}>{note.content}</Text>
                  <Text style={[s.profileNoteByline, { color: colors.mutedForeground }]}>{[note.taggerFirstName, note.taggerLastName].filter(Boolean).join(" ") || note.taggerUsername || "Community member"}</Text>
                </View>
              )) : activePosts.length === 0 ? (
                <View style={s.emptyPosts}>
                  <Feather name="edit-3" size={28} color={colors.muted} />
                  <Text style={[s.emptyPostsText, { color: colors.mutedForeground }]}>{activeTab === "tagged" ? "No visible tagged activity yet" : activeTab === "media" ? "No visible photos or videos yet" : "No posts yet"}</Text>
                </View>
              ) : (
                activePosts.map((post) => (
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
    overflow: "hidden",
  },
  coverImage: { alignSelf: "stretch", height: 112, marginTop: -20, marginBottom: 8, marginHorizontal: -20 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarInitials: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#FFFFFF" },
  avatarImage: { width: "100%", height: "100%", borderRadius: 36 },
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
  profileFacts: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 2 },
  profileFact: { fontFamily: "Inter_400Regular", fontSize: 12 },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 4 },
  earnedBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  earnedBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10, textTransform: "capitalize" },
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
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  postsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  profileTabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  profileTab: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  profileTabText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
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
  profileNote: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10, gap: 8 },
  profileNoteText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  profileNoteByline: { fontFamily: "Inter_400Regular", fontSize: 12 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryBtn: { marginTop: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
});
