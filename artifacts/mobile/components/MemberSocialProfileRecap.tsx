import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import type { CommunityPost } from "@/constants/types";
import { useColors } from "@/hooks/useColors";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

type ProfileResponse = {
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    profileImageUrl?: string | null;
    bio?: string | null;
    coverUrl?: string | null;
    location?: string | null;
    age?: number | null;
    birthday?: string | null;
    industry?: string | null;
    jobTitle?: string | null;
  };
  followersCount?: number;
  followingCount?: number;
  canSeeContent?: boolean;
};

type ApiPost = Record<string, unknown>;
type ProfileTab = "posts" | "media" | "tagged";

function initials(firstName?: string | null, lastName?: string | null, username?: string | null): string {
  const byName = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return (byName || username?.slice(0, 2) || "MM").toUpperCase();
}

function relativeTime(raw: unknown): string {
  const date = typeof raw === "string" || raw instanceof Date ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1_440)}d`;
}

function toCommunityPost(post: ApiPost): CommunityPost | null {
  const id = typeof post.id === "string" ? post.id : null;
  const author = typeof post.authorName === "string" ? post.authorName : "Community member";
  const content = typeof post.content === "string" ? post.content : "";
  // A profile recap is a social surface, not a second private-post inbox. The
  // server repeats audience checks on every feed read; this client guard also
  // ensures a private or group-only post can never be re-labeled as public by
  // the generic Community card renderer.
  if (!id || !content || (post.visibility !== "public" && post.visibility !== "followers_only")) return null;
  const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls.filter((item): item is string => typeof item === "string") : [];
  const privateMedia = Array.isArray(post.privateMedia) ? post.privateMedia.filter((item): item is { assetId: string; type: "image" | "video"; url: string } => Boolean(item) && typeof (item as { assetId?: unknown }).assetId === "string" && typeof (item as { url?: unknown }).url === "string" && ((item as { type?: unknown }).type === "image" || (item as { type?: unknown }).type === "video")) : [];
  return {
    id,
    author,
    authorId: typeof post.authorId === "string" ? post.authorId : undefined,
    authorInitials: typeof post.authorInitials === "string" ? post.authorInitials : initials(author, null),
    authorColor: typeof post.authorColor === "string" ? post.authorColor : "#CA922B",
    authorImageUrl: typeof post.authorImageUrl === "string" ? post.authorImageUrl : null,
    content,
    likes: typeof post.upvotes === "number" ? post.upvotes : 0,
    comments: typeof post.commentsCount === "number" ? post.commentsCount : 0,
    liked: Boolean(post.liked),
    timeAgo: relativeTime(post.createdAt),
    category: ["discussion", "recommendation", "alert", "question"].includes(String(post.category)) ? String(post.category) as CommunityPost["category"] : "discussion",
    postType: ["community", "business", "question", "safety", "travel", "saved_place"].includes(String(post.postType)) ? String(post.postType) as CommunityPost["postType"] : "community",
    visibility: post.visibility === "followers_only" ? "followers_only" : "public",
    mediaUrls,
    privateMedia,
    hashtags: Array.isArray(post.hashtags) ? post.hashtags.filter((item): item is string => typeof item === "string") : [],
    locationTag: typeof post.locationTag === "string" ? post.locationTag : undefined,
    topicTag: typeof post.topicTag === "string" ? post.topicTag : undefined,
    audienceRating: typeof post.audienceRating === "string" ? post.audienceRating : undefined,
    hasContentWarning: Boolean(post.hasContentWarning),
  };
}

export function MemberSocialProfileRecap({
  userId,
  fallbackName,
  onEditProfile,
  onEditAvatar,
}: {
  userId: string;
  fallbackName: { firstName?: string | null; lastName?: string | null; username?: string | null };
  onEditProfile: () => void;
  onEditAvatar: () => void;
}) {
  const colors = useColors();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [tagged, setTagged] = useState<CommunityPost[]>([]);
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const apiBase = getApiBase();
      const authHeaders = await getMemberApiHeaders();
      setHeaders(authHeaders);
      const [profileRes, postsRes, taggedRes] = await Promise.all([
        fetch(`${apiBase}/api/users/${encodeURIComponent(userId)}/profile`, { headers: authHeaders }),
        fetch(`${apiBase}/api/community/posts?authorId=${encodeURIComponent(userId)}&limit=30`, { headers: authHeaders }),
        fetch(`${apiBase}/api/community/posts?taggedUserId=${encodeURIComponent(userId)}&limit=30`, { headers: authHeaders }),
      ]);
      if (!profileRes.ok) throw new Error("Profile unavailable");
      const nextProfile = await profileRes.json() as ProfileResponse;
      const ownPosts = postsRes.ok ? await postsRes.json() as { posts?: ApiPost[] } : { posts: [] };
      const taggedPosts = taggedRes.ok ? await taggedRes.json() as { posts?: ApiPost[] } : { posts: [] };
      setProfile(nextProfile);
      setPosts((ownPosts.posts ?? []).map(toCommunityPost).filter((post): post is CommunityPost => Boolean(post)));
      setTagged((taggedPosts.posts ?? []).map(toCommunityPost).filter((post): post is CommunityPost => Boolean(post)));
    } catch {
      setError("Your profile recap could not load. Pull to refresh or try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const member = profile?.user;
  const displayName = [member?.firstName ?? fallbackName.firstName, member?.lastName ?? fallbackName.lastName].filter(Boolean).join(" ") || member?.username || fallbackName.username || "Community member";
  const mediaPosts = useMemo(() => posts.filter((post) => (post.mediaUrls?.length ?? 0) + (post.privateMedia?.length ?? 0) > 0), [posts]);
  const activePosts = tab === "posts" ? posts : tab === "media" ? mediaPosts : tagged;
  const coverUri = member?.coverUrl ? `${getApiBase()}${member.coverUrl}` : null;
  const avatarUri = member?.profileImageUrl ?? null;
  const facts: Array<{ icon: React.ComponentProps<typeof Feather>["name"]; label: string }> = [];
  if (member?.location) facts.push({ icon: "map-pin", label: member.location });
  if (member?.jobTitle || member?.industry) facts.push({ icon: "briefcase", label: [member?.jobTitle, member?.industry].filter(Boolean).join(" · ") });
  if (member?.age) facts.push({ icon: "user", label: `${member.age} years old` });
  if (member?.birthday) facts.push({ icon: "gift", label: `Birthday ${member.birthday}` });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLabel="Member social profile recap">
      <View style={[styles.cover, { backgroundColor: colors.primary + "24" }]}>
        {coverUri ? <Image source={{ uri: coverUri, headers }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Profile cover image" /> : null}
        <View style={styles.coverShade} />
        <TouchableOpacity onPress={onEditProfile} style={styles.coverEdit} accessibilityRole="button" accessibilityLabel="Edit profile presentation">
          <Feather name="edit-3" size={14} color="#FFFFFF" />
          <Text style={styles.coverEditText}>Edit profile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.identityRow}>
        <TouchableOpacity onPress={onEditAvatar} accessibilityRole="button" accessibilityLabel="Update profile photo" style={[styles.avatar, { borderColor: colors.card, backgroundColor: colors.primary }]}>
          {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" /> : <Text style={styles.avatarText}>{initials(member?.firstName ?? fallbackName.firstName, member?.lastName ?? fallbackName.lastName, member?.username ?? fallbackName.username)}</Text>}
          <View style={[styles.avatarEdit, { backgroundColor: colors.primary }]}><Feather name="camera" size={12} color="#FFFFFF" /></View>
        </TouchableOpacity>
        <View style={styles.identityCopy}>
          <Text style={[styles.name, { color: colors.foreground }]}>{displayName}</Text>
          {member?.username || fallbackName.username ? <Text style={[styles.handle, { color: colors.primary }]}>@{member?.username ?? fallbackName.username}</Text> : null}
          {member?.bio ? <Text style={[styles.bio, { color: colors.mutedForeground }]}>{member.bio}</Text> : <Text style={[styles.bio, { color: colors.mutedForeground }]}>Add a short bio to help your community get to know you.</Text>}
        </View>
      </View>
      {facts.length > 0 ? <View style={styles.facts}>{facts.map((fact) => <View key={fact.label} style={[styles.fact, { backgroundColor: colors.secondary }]}><Feather name={fact.icon} size={13} color={colors.primary} /><Text style={[styles.factText, { color: colors.foreground }]} numberOfLines={1}>{fact.label}</Text></View>)}</View> : null}
      <View style={[styles.stats, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push("/connections" as never)} style={styles.stat} accessibilityRole="button" accessibilityLabel="View followers"><Text style={[styles.statNumber, { color: colors.foreground }]}>{profile?.followersCount ?? 0}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/connections" as never)} style={[styles.stat, { borderLeftColor: colors.border, borderRightColor: colors.border, borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth }]} accessibilityRole="button" accessibilityLabel="View following"><Text style={[styles.statNumber, { color: colors.foreground }]}>{profile?.followingCount ?? 0}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Following</Text></TouchableOpacity>
        <View style={styles.stat}><Text style={[styles.statNumber, { color: colors.foreground }]}>{posts.length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Posts</Text></View>
      </View>
      <View style={[styles.tabs, { borderBottomColor: colors.border }]} accessibilityRole="tablist" accessibilityLabel="Profile community content">
        {(["posts", "media", "tagged"] as ProfileTab[]).map((candidate) => {
          const selected = tab === candidate;
          const label = candidate === "posts" ? "Posts" : candidate === "media" ? "Photos & videos" : "Tagged";
          return <Pressable key={candidate} onPress={() => setTab(candidate)} style={[styles.tab, selected && { borderBottomColor: colors.primary }]} accessibilityRole="tab" accessibilityState={{ selected }}><Text style={[styles.tabText, { color: selected ? colors.primary : colors.mutedForeground }]}>{label}</Text></Pressable>;
        })}
      </View>
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading your community recap…</Text></View> : error ? <View style={styles.loading}><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={[styles.retry, { color: colors.primary }]}>Try again</Text></TouchableOpacity></View> : activePosts.length ? <View style={styles.feed}>{activePosts.map((post) => <CommunityPostCard key={post.id} post={post} currentUserId={userId} onAuthorPress={() => undefined} />)}</View> : <View style={styles.empty}><Feather name={tab === "tagged" ? "at-sign" : tab === "media" ? "image" : "message-circle"} size={26} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{tab === "tagged" ? "No visible tagged posts yet" : tab === "media" ? "No shared photos or videos yet" : "No community posts yet"}</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{tab === "tagged" ? "Only posts you are tagged in and allowed to see appear here." : "Share with Community when you are ready—your profile will keep only what your audience is allowed to see."}</Text>{tab === "posts" ? <TouchableOpacity onPress={() => router.push("/(tabs)/community" as never)}><Text style={[styles.retry, { color: colors.primary }]}>Open Community</Text></TouchableOpacity> : null}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  cover: { height: 124, position: "relative", justifyContent: "flex-end", alignItems: "flex-end" },
  coverShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.12)" },
  coverEdit: { zIndex: 1, flexDirection: "row", alignItems: "center", gap: 5, margin: 10, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.58)", paddingHorizontal: 10, paddingVertical: 7 },
  coverEditText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  identityRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginTop: -28 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, justifyContent: "center", alignItems: "center", overflow: "visible" },
  avatarImage: { width: 64, height: 64, borderRadius: 32 }, avatarText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 22 },
  avatarEdit: { position: "absolute", right: -3, bottom: -3, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" },
  identityCopy: { flex: 1, paddingTop: 31 }, name: { fontFamily: "Inter_700Bold", fontSize: 18 }, handle: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 1 }, bio: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginTop: 6 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 16, paddingTop: 12 }, fact: { flexDirection: "row", gap: 5, alignItems: "center", borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6, maxWidth: "100%" }, factText: { fontFamily: "Inter_500Medium", fontSize: 11, flexShrink: 1 },
  stats: { flexDirection: "row", marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth }, stat: { flex: 1, alignItems: "center", paddingVertical: 12 }, statNumber: { fontFamily: "Inter_700Bold", fontSize: 16 }, statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  tabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth }, tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" }, tabText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  feed: { paddingTop: 8 }, loading: { alignItems: "center", gap: 9, padding: 24 }, empty: { alignItems: "center", padding: 28, gap: 8 }, emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, textAlign: "center" }, emptyText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, textAlign: "center", maxWidth: 280 }, retry: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 4 },
});
