import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { ReportButton } from "@/components/ReportButton";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  username: string | null;
  bio: string | null;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  trustLevel: number;
  identityVerified: boolean;
  memberType: string | null;
}

interface Follower {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  isPrivate: boolean;
  followersCount: number;
}

type Tab = "followers" | "following";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  return ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() || "?";
}

const MEMBER_COLORS: Record<string, string> = {
  founding: "#C9922B",
  trailblazer: "#7B2D8B",
  navigator: "#1D4ED8",
  business: "#2D7A4F",
};

interface Props {
  userId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function UserProfileModal({ userId, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user: me, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<string | null>(null);
  const [canSeeContent, setCanSeeContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("followers");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const isOwnProfile = me?.id === userId;

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
          profile: UserProfile;
          isFollowing: boolean;
          followStatus: string | null;
          canSeeContent: boolean;
        };
        setProfile(data.profile);
        setIsFollowing(data.isFollowing);
        setFollowStatus(data.followStatus);
        setCanSeeContent(data.canSeeContent);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [userId]);

  const loadList = useCallback(async (tab: Tab) => {
    if (!userId || !canSeeContent) return;
    setListLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const endpoint = tab === "followers" ? "followers" : "following";
      const res = await fetch(`${getApiBase()}/api/users/${userId}/${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { followers?: Follower[]; following?: Follower[] };
        if (tab === "followers") setFollowers(data.followers ?? []);
        else setFollowing(data.following ?? []);
      }
    } catch { /* silent */ }
    finally { setListLoading(false); }
  }, [userId, canSeeContent]);

  useEffect(() => {
    if (visible && userId) {
      void loadProfile();
      setActiveTab("followers");
      setFollowers([]);
      setFollowing([]);
    } else {
      setProfile(null);
    }
  }, [visible, userId, loadProfile]);

  useEffect(() => {
    if (canSeeContent) void loadList(activeTab);
  }, [activeTab, canSeeContent, loadList]);

  const handleFollow = async () => {
    if (!userId || !isAuthenticated) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFollowLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (isFollowing || followStatus === "pending") {
        const res = await fetch(`${getApiBase()}/api/users/${userId}/follow`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          setIsFollowing(false);
          setFollowStatus(null);
          setProfile((p) => p ? { ...p, followersCount: Math.max(0, p.followersCount - (isFollowing ? 1 : 0)) } : p);
        }
      } else {
        const res = await fetch(`${getApiBase()}/api/users/${userId}/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (res.ok) {
          const data = await res.json() as { status: string };
          setFollowStatus(data.status);
          setIsFollowing(data.status === "accepted");
          if (data.status === "accepted") {
            setProfile((p) => p ? { ...p, followersCount: p.followersCount + 1 } : p);
          }
        }
      }
    } catch { /* silent */ }
    finally { setFollowLoading(false); }
  };

  const followBtnLabel = () => {
    if (followStatus === "pending") return "Requested";
    if (isFollowing) return "Following";
    return "Follow";
  };
  const followBtnIcon = () => {
    if (followStatus === "pending") return "clock" as const;
    if (isFollowing) return "user-check" as const;
    return "user-plus" as const;
  };

  const memberColor = MEMBER_COLORS[profile?.memberType ?? ""] ?? colors.primary;
  const listData = activeTab === "followers" ? followers : following;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: colors.background }]}>
        {/* Top bar */}
        <View style={[s.topBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.topTitle, { color: colors.foreground }]}>
            {profile ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || "Profile" : "Profile"}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !profile ? (
          <View style={s.center}>
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>User not found</Text>
          </View>
        ) : (
          <FlatList
        keyboardDismissMode="on-drag"
            data={listData}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
            ListHeaderComponent={
              <>
                {/* Avatar + name */}
                <View style={s.heroSection}>
                  <View style={[s.bigAvatar, { backgroundColor: memberColor + "20" }]}>
                    <Text style={[s.bigInitials, { color: memberColor }]}>
                      {getInitials(profile.firstName, profile.lastName)}
                    </Text>
                  </View>

                  <View style={s.nameBlock}>
                    <View style={s.nameRow}>
                      <Text style={[s.displayName, { color: colors.foreground }]}>
                        {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Community Member"}
                      </Text>
                      {profile.identityVerified && (
                        <Feather name="check-circle" size={16} color="#2D7A4F" />
                      )}
                      {profile.isPrivate && (
                        <View style={[s.privateBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                          <Feather name="lock" size={11} color={colors.mutedForeground} />
                          <Text style={[s.privateBadgeText, { color: colors.mutedForeground }]}>Private</Text>
                        </View>
                      )}
                    </View>
                    {profile.username && (
                      <Text style={[s.username, { color: colors.mutedForeground }]}>@{profile.username}</Text>
                    )}
                    {profile.bio && canSeeContent && (
                      <Text style={[s.bio, { color: colors.foreground }]}>{profile.bio}</Text>
                    )}
                  </View>

                  {/* Follow + Report buttons */}
                  {!isOwnProfile && isAuthenticated && (
                    <View style={s.actionBtnRow}>
                      <TouchableOpacity
                        style={[
                          s.followBtn,
                          isFollowing || followStatus === "pending"
                            ? { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }
                            : { backgroundColor: colors.primary },
                        ]}
                        onPress={handleFollow}
                        disabled={followLoading}
                        activeOpacity={0.8}
                      >
                        {followLoading
                          ? <ActivityIndicator size="small" color={isFollowing ? colors.foreground : "#FFF"} />
                          : (
                            <>
                              <Feather name={followBtnIcon()} size={14} color={isFollowing || followStatus === "pending" ? colors.foreground : "#FFF"} />
                              <Text style={[s.followBtnText, { color: isFollowing || followStatus === "pending" ? colors.foreground : "#FFF" }]}>
                                {followBtnLabel()}
                              </Text>
                            </>
                          )
                        }
                      </TouchableOpacity>
                      <View style={[s.reportIconBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <ReportButton
                          targetType="user"
                          targetId={userId ?? ""}
                          targetName={profile?.username ?? profile?.firstName ?? "this user"}
                          iconSize={17}
                          iconColor={colors.mutedForeground}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Stats */}
                <View style={[s.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                  {[
                    { label: "Followers", value: profile.followersCount },
                    { label: "Following", value: profile.followingCount },
                    { label: "Trust", value: `Lv. ${profile.trustLevel}` },
                  ].map((stat) => (
                    <View key={stat.label} style={s.statBox}>
                      <Text style={[s.statValue, { color: colors.primary }]}>{stat.value}</Text>
                      <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Private gate */}
                {!canSeeContent && !isOwnProfile && (
                  <View style={[s.privateGate, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={{ fontSize: 36, textAlign: "center" }}>🔒</Text>
                    <Text style={[s.privateTitle, { color: colors.foreground }]}>Private Account</Text>
                    <Text style={[s.privateDesc, { color: colors.mutedForeground }]}>
                      {followStatus === "pending"
                        ? "Your follow request is pending. Once accepted, you'll see their posts and connections."
                        : "Follow this member to see their content and connections."}
                    </Text>
                  </View>
                )}

                {/* Follower / Following tabs */}
                {canSeeContent && (
                  <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
                    {(["followers", "following"] as Tab[]).map((tab) => (
                      <TouchableOpacity
                        key={tab}
                        style={[s.tab, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: colors.primary }]}
                        onPress={() => setActiveTab(tab)}
                      >
                        <Text style={[s.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
                          {tab === "followers" ? "Followers" : "Following"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {canSeeContent && listLoading && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                )}
              </>
            }
            renderItem={({ item }) => (
              <View style={[s.personRow, { borderBottomColor: colors.border }]}>
                <View style={[s.personAvatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[s.personInitials, { color: colors.primary }]}>
                    {getInitials(item.firstName, item.lastName)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.personNameRow}>
                    <Text style={[s.personName, { color: colors.foreground }]}>
                      {[item.firstName, item.lastName].filter(Boolean).join(" ") || "Community Member"}
                    </Text>
                    {item.isPrivate && <Feather name="lock" size={12} color={colors.mutedForeground} />}
                  </View>
                  {item.username && (
                    <Text style={[s.personUsername, { color: colors.mutedForeground }]}>@{item.username}</Text>
                  )}
                </View>
                <Text style={[s.personFollowers, { color: colors.mutedForeground }]}>
                  {item.followersCount} followers
                </Text>
              </View>
            )}
            ListEmptyComponent={
              canSeeContent && !listLoading ? (
                <View style={s.emptyList}>
                  <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                    {activeTab === "followers" ? "No followers yet" : "Not following anyone yet"}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  topTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroSection: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20, gap: 10 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  bigInitials: { fontFamily: "Inter_700Bold", fontSize: 30 },
  nameBlock: { alignItems: "center", gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" },
  displayName: { fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center" },
  username: { fontFamily: "Inter_400Regular", fontSize: 14 },
  bio: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 21, maxWidth: 300 },
  privateBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  privateBadgeText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  actionBtnRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  followBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 24 },
  reportIconBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  followBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  statsRow: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 2 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  privateGate: { margin: 20, borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 10 },
  privateTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  privateDesc: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, marginTop: 16 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  personRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  personAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  personInitials: { fontFamily: "Inter_700Bold", fontSize: 14 },
  personNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  personName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  personUsername: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  personFollowers: { fontFamily: "Inter_400Regular", fontSize: 12 },
  emptyList: { alignItems: "center", paddingVertical: 32 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
