import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { useGroups, type Group } from "@/hooks/useGroups";
import { useAuth } from "@/lib/auth";

type GroupSuggestion = {
  id: number;
  groupId: number;
  userId: string;
  type: string;
  value: string;
  notes: string | null;
  upvotes: number;
  createdAt: string | Date;
};

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
type ConnectionRow = { id: number; status: string; requesterId: string; recipientId: string; otherId: string | null; otherFirstName: string | null; otherLastName: string | null };

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SUGG_TYPES = [
  { key: "location", label: "📍 Location", color: "#2D7A4F" },
  { key: "destination", label: "✈️ Destination", color: "#1D4ED8" },
  { key: "event_type", label: "🎉 Event", color: "#7B2D8B" },
  { key: "restaurant", label: "🍽️ Restaurant", color: "#C9922B" },
  { key: "activity", label: "🎯 Activity", color: "#DC2626" },
];

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { join, leave } = useGroups();
  const { isAuthenticated, user } = useAuth();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMemberRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [itineraries, setItineraries] = useState<GroupItinerary[]>([]);
  const [suggestions, setSuggestions] = useState<GroupSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showAddSugg, setShowAddSugg] = useState(false);
  const [suggType, setSuggType] = useState("location");
  const [suggValue, setSuggValue] = useState("");
  const [suggNotes, setSuggNotes] = useState("");
  const [addingSugg, setAddingSugg] = useState(false);

  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectTarget, setConnectTarget] = useState<{ userId: string; name: string } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyConnectionId, setSafetyConnectionId] = useState<number | null>(null);
  const [safetyContactName, setSafetyContactName] = useState("");
  const [safetyContactEmail, setSafetyContactEmail] = useState("");
  const [savingSafety, setSavingSafety] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadGroup = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const token = await SecureStore.getItemAsync("auth_session_token");
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [groupRes, itinRes, suggRes] = await Promise.all([
        fetch(`${apiBase}/api/groups/${id}`, { headers: authHeaders }),
        token ? fetch(`${apiBase}/api/groups/${id}/itineraries`, { headers: authHeaders }) : Promise.resolve(null),
        fetch(`${apiBase}/api/groups/${id}/suggestions`),
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
        setAgeRestricted(data.group.isAgeRestricted ?? false);
      }
      if (itinRes?.ok) {
        const data = await itinRes.json() as { itineraries: GroupItinerary[] };
        setItineraries(data.itineraries ?? []);
      }
      if (suggRes.ok) {
        const data = await suggRes.json() as { suggestions: GroupSuggestion[] };
        setSuggestions(data.suggestions ?? []);
      }
    } catch { /* show not found */ }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { void loadGroup(); }, [loadGroup]);

  const handleAddSuggestion = async () => {
    if (!suggValue.trim()) { Alert.alert("Required", "Please enter a suggestion."); return; }
    setAddingSugg(true);
    try {
      const apiBase = getApiBase();
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${apiBase}/api/groups/${id}/suggestions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: suggType, value: suggValue.trim(), notes: suggNotes.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json() as { suggestion: GroupSuggestion };
        setSuggestions((prev) => [data.suggestion, ...prev]);
        setSuggValue(""); setSuggNotes(""); setSuggType("location");
        setShowAddSugg(false);
      } else {
        Alert.alert("Error", "Failed to add suggestion.");
      }
    } finally { setAddingSugg(false); }
  };

  const handleUpvote = async (suggId: number) => {
    if (!isAuthenticated) { Alert.alert("Sign In Required", "Please sign in to upvote."); return; }
    const apiBase = getApiBase();
    const token = await SecureStore.getItemAsync("auth_session_token");
    const res = await fetch(`${apiBase}/api/groups/${id}/suggestions/${suggId}/upvote`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setSuggestions((prev) =>
        prev.map((s) => s.id === suggId ? { ...s, upvotes: s.upvotes + 1 } : s)
      );
    }
  };

  const handleDeleteSuggestion = async (suggId: number) => {
    const apiBase = getApiBase();
    const token = await SecureStore.getItemAsync("auth_session_token");
    await fetch(`${apiBase}/api/groups/${id}/suggestions/${suggId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSuggestions((prev) => prev.filter((s) => s.id !== suggId));
  };

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    const load = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        if (!token) return;
        const res = await fetch(`${getApiBase()}/api/connections`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json() as { connections: ConnectionRow[] }; setConnections(d.connections ?? []); }
      } catch { /* ignore */ }
    };
    void load();
  }, [isAuthenticated, id]);

  const getConnectionWith = (memberId: string) =>
    connections.find((c) => (c.requesterId === memberId || c.recipientId === memberId));

  const handleOpenConnect = (memberId: string, memberName: string) => {
    setConnectTarget({ userId: memberId, name: memberName });
    setShowConnectModal(true);
  };

  const handleSendConnect = async () => {
    if (!connectTarget) return;
    setConnecting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/connections/request`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: connectTarget.userId, groupId: id ? parseInt(String(id), 10) : undefined }),
      });
      if (res.ok) {
        const d = await res.json() as { connection: ConnectionRow };
        setConnections((prev) => [...prev, d.connection]);
        setShowConnectModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", "Failed to send connection request.");
      }
    } finally { setConnecting(false); }
  };

  const handleOpenSafetyShare = (connectionId: number) => {
    setSafetyConnectionId(connectionId);
    setSafetyContactName(""); setSafetyContactEmail("");
    setShowSafetyModal(true);
  };

  const handleSubmitSafetyShare = async () => {
    if (!safetyConnectionId || !safetyContactName.trim() || !safetyContactEmail.trim()) {
      Alert.alert("Required", "Please fill in the trusted contact's name and email.");
      return;
    }
    setSavingSafety(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/connections/${safetyConnectionId}/safety-share`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ trustedContactName: safetyContactName.trim(), trustedContactEmail: safetyContactEmail.trim() }),
      });
      if (res.ok) {
        setShowSafetyModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Safety Share Initiated", `Your connection will be notified to confirm. Once both agree, ${safetyContactName} will receive both your profiles.`);
      } else {
        const d = await res.json() as { error?: string };
        Alert.alert("Error", d.error ?? "Failed to initiate safety share.");
      }
    } finally { setSavingSafety(false); }
  };

  const handleToggleAgeRestriction = async (value: boolean) => {
    if (!group) return;
    setAgeRestricted(value);
    setSavingSettings(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/groups/${group.id}/settings`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isAgeRestricted: value }),
      });
      if (!res.ok) { setAgeRestricted(!value); Alert.alert("Error", "Failed to update group settings."); }
    } finally { setSavingSettings(false); }
  };

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
            {group.isAgeRestricted && (
              <View style={[styles.heroBadge, { backgroundColor: "rgba(220,38,38,0.35)" }]}>
                <Feather name="shield" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroBadgeText}>18+ Only</Text>
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

        {/* Members list (visible to group members) */}
        {group.isMember && members.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Members ({members.length})</Text>
            <View style={[styles.membersList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {members.map((m, idx) => {
                if (m.userId === user?.id) return null;
                const conn = getConnectionWith(m.userId);
                const connStatus = conn?.status;
                const memberName = `Member ${idx + 1}`;
                return (
                  <View
                    key={m.userId}
                    style={[styles.memberRow, idx < members.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  >
                    <View style={[styles.memberAvatar, { backgroundColor: catColor + "18" }]}>
                      <Feather name="user" size={16} color={catColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.memberName, { color: colors.foreground }]}>{memberName}</Text>
                      <Text style={[styles.memberRole, { color: colors.mutedForeground }]}>{m.role === "admin" ? "Admin" : "Member"}</Text>
                    </View>
                    {!connStatus && (
                      <TouchableOpacity
                        style={[styles.connectBtn, { borderColor: catColor, backgroundColor: catColor + "12" }]}
                        onPress={() => handleOpenConnect(m.userId, memberName)}
                        activeOpacity={0.7}
                      >
                        <Feather name="user-plus" size={13} color={catColor} />
                        <Text style={[styles.connectBtnText, { color: catColor }]}>Connect</Text>
                      </TouchableOpacity>
                    )}
                    {connStatus === "pending" && (
                      <View style={[styles.connStatusPill, { backgroundColor: "#C9922B18", borderColor: "#C9922B40" }]}>
                        <Text style={[styles.connStatusText, { color: "#C9922B" }]}>Pending</Text>
                      </View>
                    )}
                    {connStatus === "accepted" && (
                      <TouchableOpacity
                        style={[styles.safetyBtn, { borderColor: "#16A34A", backgroundColor: "#16A34A12" }]}
                        onPress={() => handleOpenSafetyShare(conn!.id)}
                        activeOpacity={0.7}
                      >
                        <Feather name="shield" size={13} color="#16A34A" />
                        <Text style={[styles.connectBtnText, { color: "#16A34A" }]}>Safety Share</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Admin Settings */}
        {group.isAdmin && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.adminSettingsHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowAdminSettings((v) => !v)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIcon, { backgroundColor: catColor + "18" }]}>
                <Feather name="settings" size={18} color={catColor} />
              </View>
              <Text style={[styles.adminSettingsTitle, { color: colors.foreground }]}>Group Settings</Text>
              <Feather name={showAdminSettings ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showAdminSettings && (
              <View style={[styles.adminSettingsBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.foreground }]}>18+ Age Restriction</Text>
                    <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Only members 18 and older can join this group</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleTrack, { backgroundColor: ageRestricted ? "#DC2626" : colors.muted }]}
                    onPress={() => !savingSettings && void handleToggleAgeRestriction(!ageRestricted)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.toggleThumb, { transform: [{ translateX: ageRestricted ? 20 : 2 }] }]} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
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

        {/* Bucket List / Suggestions */}
        {(suggestions.length > 0 || group.isMember) && (
          <View style={styles.section}>
            <View style={styles.suggHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Group Bucket List</Text>
              {group.isMember && (
                <TouchableOpacity
                  style={[styles.addSuggBtn, { backgroundColor: catColor + "14", borderColor: catColor + "30" }]}
                  onPress={() => setShowAddSugg(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={14} color={catColor} />
                  <Text style={[styles.addSuggBtnText, { color: catColor }]}>Add Idea</Text>
                </TouchableOpacity>
              )}
            </View>
            {suggestions.length === 0 ? (
              <View style={[styles.suggEmptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="star" size={20} color={colors.mutedForeground} />
                <Text style={[styles.suggEmptyText, { color: colors.mutedForeground }]}>
                  No ideas yet — add locations, destinations, events, or activities your crew wants to explore
                </Text>
              </View>
            ) : (
              <View style={styles.suggList}>
                {suggestions.map((s) => {
                  const typeInfo = SUGG_TYPES.find((t) => t.key === s.type) ?? SUGG_TYPES[0];
                  return (
                    <View key={s.id} style={[styles.suggCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={[styles.suggTypeBadge, { backgroundColor: typeInfo.color + "18" }]}>
                        <Text style={[styles.suggTypeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                      </View>
                      <Text style={[styles.suggValue, { color: colors.foreground }]}>{s.value}</Text>
                      {s.notes ? <Text style={[styles.suggNotes, { color: colors.mutedForeground }]}>{s.notes}</Text> : null}
                      <View style={styles.suggFooter}>
                        <TouchableOpacity
                          style={[styles.upvoteBtn, { borderColor: colors.border }]}
                          onPress={() => void handleUpvote(s.id)}
                          activeOpacity={0.7}
                        >
                          <Feather name="chevrons-up" size={14} color={s.upvotes > 0 ? catColor : colors.mutedForeground} />
                          <Text style={[styles.upvoteCount, { color: s.upvotes > 0 ? catColor : colors.mutedForeground }]}>
                            {s.upvotes}
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.suggDate, { color: colors.mutedForeground }]}>{formatDate(s.createdAt)}</Text>
                        {(s.userId === user?.id || group.isAdmin) && (
                          <TouchableOpacity
                            onPress={() => void handleDeleteSuggestion(s.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Feather name="trash-2" size={13} color={colors.mutedForeground} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
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
              { icon: "shield" as const, text: "Safety-first minority-owned recommendations" },
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

      {/* Add Suggestion Modal */}
      <Modal visible={showAddSugg} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddSugg(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add to Bucket List</Text>
            <TouchableOpacity onPress={() => setShowAddSugg(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Type</Text>
            <View style={styles.typeRow}>
              {SUGG_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeChip,
                    { borderColor: suggType === t.key ? t.color : colors.border, backgroundColor: suggType === t.key ? t.color + "14" : colors.card },
                  ]}
                  onPress={() => setSuggType(t.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeChipText, { color: suggType === t.key ? t.color : colors.mutedForeground }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>
              {suggType === "destination" ? "City or Country" : suggType === "restaurant" ? "Restaurant Name" : suggType === "event_type" ? "Event or Vibe" : suggType === "activity" ? "Activity" : "Place or Neighborhood"}
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder={
                suggType === "destination" ? "e.g. New Orleans, Havana"
                : suggType === "restaurant" ? "e.g. Dooky Chase's"
                : suggType === "event_type" ? "e.g. Jazz festival, gallery opening"
                : suggType === "activity" ? "e.g. Kayaking, cooking class"
                : "e.g. Treme, the French Quarter"
              }
              placeholderTextColor={colors.mutedForeground}
              value={suggValue}
              onChangeText={setSuggValue}
            />
            <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Why do you want to go here? Any tips?"
              placeholderTextColor={colors.mutedForeground}
              value={suggNotes}
              onChangeText={setSuggNotes}
              multiline
              numberOfLines={3}
            />
          </ScrollView>
          <View style={[styles.modalFooter, { borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
            <TouchableOpacity
              style={[styles.modalSaveBtn, { backgroundColor: catColor }]}
              onPress={() => void handleAddSuggestion()}
              disabled={addingSugg}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.modalSaveBtnText}>{addingSugg ? "Adding…" : "Add to Bucket List"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Connect Request Modal */}
      <Modal visible={showConnectModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowConnectModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Send Connection Request</Text>
            <TouchableOpacity onPress={() => setShowConnectModal(false)} activeOpacity={0.7}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 24, gap: 16 }}>
            <View style={[styles.connectModalIcon, { backgroundColor: catColor + "15", borderColor: catColor + "30" }]}>
              <Feather name="user-plus" size={32} color={catColor} />
            </View>
            <Text style={[styles.connectModalHeading, { color: colors.foreground }]}>
              Connect with {connectTarget?.name}
            </Text>
            <Text style={[styles.connectModalBody, { color: colors.mutedForeground }]}>
              Connecting lets you message each other and enables mutual safety features like trusted contact sharing for safer meetups.
            </Text>
          </View>
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.modalSaveBtn, { backgroundColor: catColor, opacity: connecting ? 0.6 : 1 }]}
              onPress={() => void handleSendConnect()}
              disabled={connecting}
              activeOpacity={0.85}
            >
              {connecting ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="user-plus" size={18} color="#fff" />}
              <Text style={styles.modalSaveBtnText}>{connecting ? "Sending…" : "Send Request"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Safety Share Modal */}
      <Modal visible={showSafetyModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSafetyModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Safety Share</Text>
            <TouchableOpacity onPress={() => setShowSafetyModal(false)} activeOpacity={0.7}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={[styles.modalScroll, { paddingBottom: 16 }]}>
            <View style={[styles.safetyInfoBanner, { backgroundColor: "#16A34A12", borderColor: "#16A34A30" }]}>
              <Feather name="shield" size={18} color="#16A34A" />
              <Text style={[styles.safetyInfoText, { color: colors.foreground }]}>
                Your trusted contact will receive both your profile and your connection's profile once you both consent. They'll know you're meeting up.
              </Text>
            </View>
            <Text style={[styles.modalLabel, { color: colors.foreground }]}>Trusted Contact Name</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Full name"
              placeholderTextColor={colors.mutedForeground}
              value={safetyContactName}
              onChangeText={setSafetyContactName}
              autoCapitalize="words"
            />
            <Text style={[styles.modalLabel, { color: colors.foreground }]}>Trusted Contact Email</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="email@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={safetyContactEmail}
              onChangeText={setSafetyContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={[styles.safetyNote, { color: colors.mutedForeground }]}>
              Your connection will receive a consent request. The share only activates once both parties agree.
            </Text>
          </ScrollView>
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.modalSaveBtn, { backgroundColor: "#16A34A", opacity: savingSafety ? 0.6 : 1 }]}
              onPress={() => void handleSubmitSafetyShare()}
              disabled={savingSafety}
              activeOpacity={0.85}
            >
              {savingSafety ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="shield" size={18} color="#fff" />}
              <Text style={styles.modalSaveBtnText}>{savingSafety ? "Initiating…" : "Initiate Safety Share"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  suggHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addSuggBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  addSuggBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  suggEmptyCard: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  suggEmptyText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  suggList: { gap: 10 },
  suggCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  suggTypeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  suggTypeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  suggValue: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  suggNotes: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  suggFooter: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  upvoteBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  upvoteCount: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  suggDate: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  modalScroll: { padding: 20, gap: 8 },
  modalLabel: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 4, marginTop: 8 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  typeChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  modalInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontFamily: "Inter_400Regular", fontSize: 14 },
  modalTextArea: { minHeight: 80, textAlignVertical: "top" },
  modalFooter: { padding: 16, borderTopWidth: 1 },
  modalSaveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14 },
  modalSaveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  membersList: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  memberAvatar: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  memberName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  memberRole: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  connectBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  connectBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  connStatusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  connStatusText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  safetyBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  adminSettingsHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  adminSettingsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 },
  adminSettingsBody: { borderRadius: 16, borderWidth: 1, marginTop: 8, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  settingLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  settingDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 3 },
  toggleTrack: { width: 46, height: 26, borderRadius: 13, justifyContent: "center" },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  connectModalIcon: { width: 72, height: 72, borderRadius: 20, alignSelf: "center", alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  connectModalHeading: { fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center" },
  connectModalBody: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22 },
  safetyInfoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  safetyInfoText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  safetyNote: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 12, textAlign: "center" },
});
