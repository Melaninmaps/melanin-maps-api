import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGroups, type Group } from "@/hooks/useGroups";
import { useAuth } from "@/lib/auth";

type GroupItinerary = {
  id: number;
  groupId: number;
  title: string;
  destination: string | null;
  content: {
    summary?: string;
    options?: { id: number }[];
  } | null;
  createdBy: string;
  createdAt: string;
};

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

type GroupMemberRow = { userId: string; role: string; joinedAt: Date };
type PendingInvite = { id: number; invitedUserId: string; invitedUserFirstName: string | null; invitedUserLastName: string | null; createdAt: Date };
type GroupDetail = Group & { isMember: boolean; isAdmin: boolean };

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { join, leave } = useGroups();
  const { isAuthenticated } = useAuth();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMemberRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [itineraries, setItineraries] = useState<GroupItinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadGroup = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const token = await SecureStore.getItemAsync("auth_session_token");
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [groupRes, itinRes] = await Promise.all([
        fetch(`${apiBase}/api/groups/${id}`, { headers: authHeaders }),
        token ? fetch(`${apiBase}/api/groups/${id}/itineraries`, { headers: authHeaders }) : Promise.resolve(null),
      ]);
      if (groupRes.ok) {
        const data = await groupRes.json() as {
          group: GroupDetail;
          members: GroupMemberRow[];
          pendingInvites: PendingInvite[];
        };
        setGroup(data.group);
        setMembers(data.members ?? []);
        setPendingInvites(data.pendingInvites ?? []);
      }
      if (itinRes?.ok) {
        const data = await itinRes.json() as { itineraries: GroupItinerary[] };
        setItineraries(data.itineraries ?? []);
      }
    } catch { /* show not found */ }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { void loadGroup(); }, [loadGroup]);

  const handleJoinLeave = async () => {
    if (!group) return;
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to join groups.");
      return;
    }
    if (group.isPrivate && !group.isMember) {
      Alert.alert("Private Group", "This group is invite-only. Ask a member to send you an invitation.");
      return;
    }
    setJoining(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (group.isMember) {
      const ok = await leave(group.id);
      if (ok) setGroup((g) => g ? { ...g, isMember: false, memberCount: Math.max(g.memberCount - 1, 0) } : g);
    } else {
      const ok = await join(group.id);
      if (ok) setGroup((g) => g ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g);
    }
    setJoining(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Group not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[group.category] ?? "#3B1F0E";
  const catIcon = (CATEGORY_ICONS[group.category] ?? "grid") as any;
  const isFull = group.memberCount >= (group.maxMembers ?? 8);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: catColor, paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.heroBody}>
          <View style={[styles.heroIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name={catIcon} size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit>{group.name}</Text>
          {(group.city || group.state) && (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>{[group.city, group.state].filter(Boolean).join(", ")}</Text>
            </View>
          )}
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Feather name="users" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroBadgeText}>{group.memberCount}/{group.maxMembers ?? 8} members</Text>
            </View>
            <View style={styles.heroBadge}>
              <Feather name="tag" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroBadgeText}>{group.category}</Text>
            </View>
            {group.isPrivate && (
              <View style={styles.heroBadge}>
                <Feather name="lock" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroBadgeText}>Invite-Only</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 120 }]}>

        {group.description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
            <Text style={[styles.description, { color: colors.foreground }]}>{group.description}</Text>
          </View>
        ) : null}

        {/* Member actions (only shown when authenticated member) */}
        {group.isMember && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Group Actions</Text>
            <View style={styles.actionGrid}>
              {/* Plan Trip */}
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F33" }]}
                onPress={() => router.push({
                  pathname: "/group/plan-trip",
                  params: { id: String(group.id), groupName: group.name, memberCount: String(group.memberCount) },
                })}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: "#2D7A4F22" }]}>
                  <Feather name="map" size={20} color="#2D7A4F" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionLabel, { color: "#2D7A4F" }]}>Plan a Trip</Text>
                  <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>AI suggests itineraries for your crew</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#2D7A4F" />
              </TouchableOpacity>

              {/* Invite (admin only) */}
              {group.isAdmin && !isFull && (
                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: catColor + "12", borderColor: catColor + "30" }]}
                  onPress={() => router.push({
                    pathname: "/group/invite",
                    params: { id: String(group.id), groupName: group.name },
                  })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: catColor + "20" }]}>
                    <Feather name="user-plus" size={20} color={catColor} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionLabel, { color: catColor }]}>Invite Members</Text>
                    <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>
                      {(group.maxMembers ?? 8) - group.memberCount} spot{(group.maxMembers ?? 8) - group.memberCount !== 1 ? "s" : ""} remaining
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={catColor} />
                </TouchableOpacity>
              )}

              {group.isAdmin && isFull && (
                <View style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.6 }]}>
                  <View style={[styles.actionIcon, { backgroundColor: colors.background }]}>
                    <Feather name="users" size={20} color={colors.mutedForeground} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>Group Full</Text>
                    <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>Max {group.maxMembers} members reached</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Pending invites (admin only) */}
        {group.isAdmin && pendingInvites.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pending Invitations</Text>
            <View style={[styles.pendingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {pendingInvites.map((inv, idx) => (
                <View
                  key={inv.id}
                  style={[styles.pendingRow, idx < pendingInvites.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
                  <View style={[styles.pendingAvatar, { backgroundColor: catColor + "18" }]}>
                    <Feather name="user" size={14} color={catColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pendingId, { color: colors.foreground }]}>
                      {[inv.invitedUserFirstName, inv.invitedUserLastName].filter(Boolean).join(" ") || "Member"}
                    </Text>
                    <Text style={[styles.pendingDate, { color: colors.mutedForeground }]}>Sent {formatDate(String(inv.createdAt))}</Text>
                  </View>
                  <View style={[styles.pendingBadge, { backgroundColor: "#C9922B18" }]}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Saved Itineraries */}
        {group.isMember && itineraries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trip Plans</Text>
            <View style={styles.itineraryList}>
              {itineraries.map((itin) => {
                const content = itin.content;
                const optionCount = content?.options?.length ?? 0;
                return (
                  <View key={itin.id} style={[styles.itinCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.itinIconWrap, { backgroundColor: "#2D7A4F18" }]}>
                      <Feather name="map" size={18} color="#2D7A4F" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itinTitle, { color: colors.foreground }]} numberOfLines={2}>{itin.title}</Text>
                      <Text style={[styles.itinMeta, { color: colors.mutedForeground }]}>
                        {optionCount} option{optionCount !== 1 ? "s" : ""} · {formatDate(String(itin.createdAt))}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.viewItinBtn, { backgroundColor: "#2D7A4F" }]}
                      onPress={() => router.push({
                        pathname: "/group/plan-trip",
                        params: { id: String(group.id), groupName: group.name, memberCount: String(group.memberCount) },
                      })}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewItinBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Stats card */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: catColor }]}>{group.memberCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Members</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: catColor }]}>{group.maxMembers ?? 8}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Max</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: catColor }]}>{group.isPrivate ? "Private" : "Public"}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Access</Text>
          </View>
        </View>

        {/* What to expect (for non-members) */}
        {!group.isMember && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What to Expect</Text>
            {[
              { icon: "map" as const, text: "AI-powered group trip planning" },
              { icon: "users" as const, text: "Cross-check preferences with your crew" },
              { icon: "calendar" as const, text: "Get 3 personalized itinerary options" },
              { icon: "shield" as const, text: "Safety-first Black-owned recommendations" },
            ].map((item) => (
              <View key={item.text} style={[styles.featureRow, { borderColor: colors.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: catColor + "15" }]}>
                  <Feather name={item.icon} size={16} color={catColor} />
                </View>
                <Text style={[styles.featureText, { color: colors.foreground }]}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        {group.isPrivate && !group.isMember ? (
          <View style={[styles.privateNotice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} />
            <Text style={[styles.privateNoticeText, { color: colors.mutedForeground }]}>
              Invite-only — ask a member for an invite
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.joinBtn,
              { backgroundColor: group.isMember ? colors.card : catColor, borderColor: group.isMember ? colors.border : catColor },
            ]}
            onPress={() => void handleJoinLeave()}
            disabled={joining || (!group.isMember && isFull)}
            activeOpacity={0.85}
          >
            {joining ? (
              <ActivityIndicator size="small" color={group.isMember ? colors.foreground : "#FFFFFF"} />
            ) : !group.isMember && isFull ? (
              <Text style={[styles.joinBtnText, { color: colors.mutedForeground }]}>Group Full</Text>
            ) : (
              <>
                <Feather
                  name={group.isMember ? "check" : "user-plus"}
                  size={18}
                  color={group.isMember ? colors.foreground : "#FFFFFF"}
                />
                <Text style={[styles.joinBtnText, { color: group.isMember ? colors.foreground : "#FFFFFF" }]}>
                  {group.isMember ? "Joined" : "Join Group"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  backLink: { fontFamily: "Inter_500Medium", fontSize: 14 },
  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: { marginBottom: 16 },
  heroBody: { alignItems: "center", gap: 10 },
  heroIcon: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#FFFFFF", textAlign: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.85)" },
  heroBadges: { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  heroBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.9)" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  description: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  actionGrid: { gap: 12 },
  actionCard: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
    borderRadius: 16, borderWidth: 1,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  actionContent: { flex: 1, gap: 2 },
  actionLabel: { fontFamily: "Inter_700Bold", fontSize: 15 },
  actionSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  pendingCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  pendingAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  pendingId: { fontFamily: "Inter_500Medium", fontSize: 14 },
  pendingDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  pendingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pendingBadgeText: { fontFamily: "Inter_500Medium", fontSize: 11, color: "#C9922B" },
  itineraryList: { gap: 10 },
  itinCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  itinIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  itinTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  itinMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 3 },
  viewItinBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  viewItinBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFFFFF" },
  statsCard: { flexDirection: "row", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  statDivider: { width: 1 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 16 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  featureText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
  footer: { padding: 16, borderTopWidth: 1 },
  privateNotice: {
    flexDirection: "row", alignItems: "center", gap: 10, padding: 14,
    borderRadius: 14, borderWidth: 1,
  },
  privateNoticeText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
  joinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 52, borderRadius: 14, borderWidth: 1.5,
  },
  joinBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
});
