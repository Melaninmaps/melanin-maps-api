import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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

const AUDIENCE_LABELS: Record<string, string> = {
  "Black / African American": "🤎",
  "Hispanic / Latino": "🧡",
  "Native American / Indigenous": "🌿",
  "Middle Eastern / North African": "🌙",
  "Multiracial": "🌈",
};

const PROFANITY_OPTIONS = [
  { value: "strict", label: "Strict", desc: "No profanity — family-friendly space", icon: "shield" as const },
  { value: "moderate", label: "Moderate", desc: "Light language OK, no slurs or hate speech", icon: "check-circle" as const },
  { value: "open", label: "Open", desc: "Adult language allowed — 18+ groups only", icon: "unlock" as const },
];

const REPORT_REASONS = [
  { value: "spam", label: "Spam or scam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "underage_content", label: "Underage users in 18+ group" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

interface GroupDetail {
  id: number;
  name: string;
  description: string | null;
  category: string;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  isAgeRestricted: boolean;
  audiencePreferences: string[] | null;
  rules: string[] | null;
  profanityLevel: string;
  city: string | null;
  state: string | null;
  createdBy: string | null;
  createdAt: string;
  isMember: boolean;
  isAdmin: boolean;
}

interface GroupMember {
  userId: string;
  role: string;
  joinedAt: string;
  name?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  social: "#C9922B", professional: "#3A6BB5", travel: "#2D7A4F",
  fitness: "#DC2626", food: "#7B2D8B", education: "#1A2F5E", general: "#CA922B",
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "members" | "settings">("info");

  // Settings state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);
  const [editAgeRestricted, setEditAgeRestricted] = useState(false);
  const [editAudience, setEditAudience] = useState<string[]>([]);
  const [editRules, setEditRules] = useState<string[]>([]);
  const [editProfanity, setEditProfanity] = useState("moderate");
  const [newRule, setNewRule] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetType, setReportTargetType] = useState<"group" | "member">("group");
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const loadGroup = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${getApiBase()}/api/groups/${id}`, { headers });
      if (res.ok) {
        const data = await res.json() as { group: GroupDetail; members: GroupMember[] };
        setGroup(data.group);
        setMembers(data.members ?? []);
        setEditName(data.group.name);
        setEditDesc(data.group.description ?? "");
        setEditPrivate(data.group.isPrivate);
        setEditAgeRestricted(data.group.isAgeRestricted);
        setEditAudience(data.group.audiencePreferences ?? []);
        setEditRules(data.group.rules ?? []);
        setEditProfanity(data.group.profanityLevel ?? "moderate");
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { queueMicrotask(() => { void loadGroup(); }); }, [loadGroup]);

  const handleJoinLeave = async () => {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    setJoining(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      if (group?.isMember) {
        await fetch(`${getApiBase()}/api/groups/${id}/leave`, { method: "DELETE", headers });
      } else {
        const res = await fetch(`${getApiBase()}/api/groups/${id}/join`, { method: "POST", headers });
        if (!res.ok) {
          const data = await res.json() as { error?: string };
          Alert.alert("Cannot join", data.error ?? "Unable to join group.");
          return;
        }
      }
      await loadGroup();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { /* silent */ }
    finally { setJoining(false); }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/groups/${id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || null,
          isPrivate: editPrivate,
          isAgeRestricted: editAgeRestricted,
          audiencePreferences: editAudience,
          rules: editRules,
          profanityLevel: editProfanity,
        }),
      });
      if (res.ok) {
        await loadGroup();
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Saved", "Group settings updated.");
      } else {
        const data = await res.json() as { error?: string };
        Alert.alert("Error", data.error ?? "Couldn't save settings.");
      }
    } catch { /* silent */ }
    finally { setSavingSettings(false); }
  };

  const handleAddRule = () => {
    const trimmed = newRule.trim();
    if (!trimmed || editRules.length >= 10) return;
    setEditRules((prev) => [...prev, trimmed]);
    setNewRule("");
  };

  const handleRemoveRule = (idx: number) => {
    setEditRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const openReportGroup = () => {
    setReportTargetType("group");
    setReportTargetId(null);
    setReportReason("");
    setReportDetails("");
    setShowReportModal(true);
  };

  const openReportMember = (member: GroupMember) => {
    setReportTargetType("member");
    setReportTargetId(member.userId);
    setReportReason("");
    setReportDetails("");
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason) { Alert.alert("Select a reason", "Please choose why you are reporting."); return; }
    setSubmittingReport(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/groups/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          targetType: reportTargetType,
          targetId: reportTargetId,
          reason: reportReason,
          details: reportDetails.trim() || null,
        }),
      });
      if (res.ok) {
        setShowReportModal(false);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Report submitted", "Our team will review it shortly. Thank you for keeping the community safe.");
      } else {
        const data = await res.json() as { error?: string };
        Alert.alert("Error", data.error ?? "Couldn't submit report.");
      }
    } catch { /* silent */ }
    finally { setSubmittingReport(false); }
  };

  const handlePromoteDemote = async (member: GroupMember) => {
    const newRole = member.role === "admin" ? "member" : "admin";
    Alert.alert(
      newRole === "admin" ? "Promote to Admin?" : "Remove Admin role?",
      `This member will be ${newRole === "admin" ? "promoted to admin" : "set back to member"}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("auth_session_token");
              await fetch(`${getApiBase()}/api/groups/${id}/members/${member.userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ role: newRole }),
              });
              await loadGroup();
            } catch { /* silent */ }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (member: GroupMember) => {
    Alert.alert(
      "Remove member?",
      "This member will be removed from the group.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("auth_session_token");
              await fetch(`${getApiBase()}/api/groups/${id}/members/${member.userId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              await loadGroup();
            } catch { /* silent */ }
          },
        },
      ]
    );
  };

  const isAdmin = group?.isAdmin ?? false;
  const catColor = CATEGORY_COLORS[group?.category ?? "general"] ?? "#CA922B";
  const profanityLabel = PROFANITY_OPTIONS.find((p) => p.value === (group?.profanityLevel ?? "moderate"))?.label ?? "Moderate";

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Group</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.center}>
          <Text style={[{ fontFamily: "Inter_400Regular", color: colors.mutedForeground }]}>Group not found</Text>
        </View>
      </View>
    );
  }

  const audience = group.audiencePreferences ?? [];
  const rules = group.rules ?? [];

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{group.name}</Text>
        {/* Report button for non-admin members; settings for admins */}
        {isAdmin ? (
          <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={() => setActiveTab("settings")}>
            <Feather name="settings" size={20} color={colors.foreground} />
          </TouchableOpacity>
        ) : isAuthenticated ? (
          <TouchableOpacity activeOpacity={0.85} style={s.backBtn} onPress={openReportGroup}>
            <Feather name="flag" size={19} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {/* Hero */}
      <View style={[s.hero, { backgroundColor: catColor + "20", borderBottomColor: colors.border }]}>
        <View style={[s.heroIcon, { backgroundColor: catColor + "25" }]}>
          <Feather name="users" size={28} color={catColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.heroName, { color: colors.foreground }]} numberOfLines={2}>{group.name}</Text>
          <View style={s.heroMeta}>
            <Feather name="users" size={13} color={colors.mutedForeground} />
            <Text style={[s.heroMetaText, { color: colors.mutedForeground }]}>
              {group.memberCount}/{group.maxMembers} members
            </Text>
            {(group.city || group.state) && (
              <>
                <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                <Text style={[s.heroMetaText, { color: colors.mutedForeground }]}>
                  {[group.city, group.state].filter(Boolean).join(", ")}
                </Text>
              </>
            )}
          </View>
          <View style={s.badgeRow}>
            {group.isPrivate && (
              <View style={[s.badge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="lock" size={10} color={colors.mutedForeground} />
                <Text style={[s.badgeText, { color: colors.mutedForeground }]}>Private</Text>
              </View>
            )}
            {group.isAgeRestricted && (
              <View style={[s.badge, { backgroundColor: "#DC262615", borderColor: "#DC262640" }]}>
                <Feather name="alert-circle" size={10} color="#DC2626" />
                <Text style={[s.badgeText, { color: "#DC2626" }]}>18+</Text>
              </View>
            )}
            <View style={[s.badge, { backgroundColor: catColor + "15", borderColor: catColor + "40" }]}>
              <Feather name="shield" size={10} color={catColor} />
              <Text style={[s.badgeText, { color: catColor }]}>{profanityLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
        {(["info", "members", ...(isAdmin ? ["settings"] : [])] as ("info" | "members" | "settings")[]).map((tab) => (
          <TouchableOpacity activeOpacity={0.85}
            key={tab}
            style={[s.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab === "info" ? "Info" : tab === "members" ? "Members" : "Settings"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── INFO TAB ── */}
      {activeTab === "info" && (
        <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: bottomPad + 80 }} showsVerticalScrollIndicator={false}>
          {group.description ? (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.cardTitle, { color: colors.foreground }]}>About this group</Text>
              <Text style={[s.cardBody, { color: colors.foreground }]}>{group.description}</Text>
            </View>
          ) : null}

          {/* Group rules */}
          {rules.length > 0 && (
            <View style={[s.card, { backgroundColor: "#C9922B08", borderColor: "#C9922B35" }]}>
              <View style={s.cardTitleRow}>
                <Feather name="book-open" size={15} color="#CA922B" />
                <Text style={[s.cardTitle, { color: colors.foreground }]}>Group Rules</Text>
              </View>
              {rules.map((rule, i) => (
                <View key={i} style={s.ruleRow}>
                  <View style={[s.ruleNum, { backgroundColor: "#CA922B20" }]}>
                    <Text style={[s.ruleNumText, { color: "#CA922B" }]}>{i + 1}</Text>
                  </View>
                  <Text style={[s.ruleText, { color: colors.foreground }]}>{rule}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Community focus */}
          {audience.length > 0 && (
            <View style={[s.card, { backgroundColor: "#C9922B09", borderColor: "#C9922B30" }]}>
              <Text style={[s.cardTitle, { color: colors.foreground }]}>Community focus</Text>
              <Text style={[s.cardBody, { color: colors.mutedForeground }]}>
                This group is primarily for {audience.map((a) => a.split(" / ")[0]).join(", ")} community members. All minority community supporters are welcome.
              </Text>
            </View>
          )}

          {/* Group info */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.infoRow}>
              <Feather name="calendar" size={15} color={colors.mutedForeground} />
              <Text style={[s.infoText, { color: colors.mutedForeground }]}>
                Created {new Date(group.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </Text>
            </View>
            <View style={s.infoRow}>
              <Feather name="shield" size={15} color={colors.mutedForeground} />
              <Text style={[s.infoText, { color: colors.mutedForeground }]}>
                Content moderation: {PROFANITY_OPTIONS.find((p) => p.value === group.profanityLevel)?.desc ?? "Moderate"}
              </Text>
            </View>
            {group.isPrivate && (
              <View style={s.infoRow}>
                <Feather name="lock" size={15} color={colors.mutedForeground} />
                <Text style={[s.infoText, { color: colors.mutedForeground }]}>Private — invite only</Text>
              </View>
            )}
            {group.isAgeRestricted && (
              <View style={s.infoRow}>
                <Feather name="alert-circle" size={15} color="#DC2626" />
                <Text style={[s.infoText, { color: "#DC2626" }]}>Age restricted — 18+ only</Text>
              </View>
            )}
          </View>

          {isAuthenticated && !isAdmin && (
            <TouchableOpacity
              style={[s.reportBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={openReportGroup}
              activeOpacity={0.85}
            >
              <Feather name="flag" size={14} color={colors.mutedForeground} />
              <Text style={[s.reportBtnText, { color: colors.mutedForeground }]}>Report this group</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ── MEMBERS TAB ── */}
      {activeTab === "members" && (
        <FlatList
          keyboardDismissMode="on-drag"
          data={members}
          keyExtractor={(m) => m.userId}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: bottomPad + 80 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[{ fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingTop: 40 }, { color: colors.mutedForeground }]}>
              No members yet
            </Text>
          }
          renderItem={({ item: member }) => (
            <View style={[s.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.memberAvatar, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="user" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.memberName, { color: colors.foreground }]}>
                  {member.name ?? member.userId.slice(0, 8) + "…"}
                </Text>
                <Text style={[s.memberJoined, { color: colors.mutedForeground }]}>
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </Text>
              </View>
              {member.role === "admin" && (
                <View style={[s.adminBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[s.adminBadgeText, { color: colors.primary }]}>Admin</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 6 }}>
                {isAdmin && member.userId !== (user as any)?.id && (
                  <>
                    <TouchableOpacity activeOpacity={0.85}
                      style={[s.memberBtn, { borderColor: colors.border }]}
                      onPress={() => void handlePromoteDemote(member)}
                    >
                      <Feather name={member.role === "admin" ? "user-minus" : "user-check"} size={13} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.85}
                      style={[s.memberBtn, { borderColor: colors.border }]}
                      onPress={() => void handleRemoveMember(member)}
                    >
                      <Feather name="x" size={13} color="#DC2626" />
                    </TouchableOpacity>
                  </>
                )}
                {isAuthenticated && !isAdmin && member.userId !== (user as any)?.id && (
                  <TouchableOpacity activeOpacity={0.85}
                    style={[s.memberBtn, { borderColor: colors.border }]}
                    onPress={() => openReportMember(member)}
                  >
                    <Feather name="flag" size={13} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* ── SETTINGS TAB (admin only) ── */}
      {activeTab === "settings" && isAdmin && (
        <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: bottomPad + 80 }} showsVerticalScrollIndicator={false}>

          {/* Basic info */}
          <Text style={[s.sectionLabel, { color: colors.primary }]}>Basic Info</Text>
          <Text style={[s.settingsLabel, { color: colors.foreground }]}>Group name</Text>
          <TextInput placeholderTextColor={colors.mutedForeground}
            style={[s.settingsInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            value={editName} onChangeText={setEditName} maxLength={80}
          />
          <Text style={[s.settingsLabel, { color: colors.foreground }]}>Description</Text>
          <TextInput
            style={[s.settingsInput, s.settingsInputMulti, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            value={editDesc} onChangeText={setEditDesc} multiline maxLength={300}
            placeholder="What's this group about?" placeholderTextColor={colors.mutedForeground}
          />

          {/* Access controls */}
          <Text style={[s.sectionLabel, { color: colors.primary }]}>Access Controls</Text>

          <View style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingsLabel, { color: colors.foreground, marginBottom: 2 }]}>Private group</Text>
              <Text style={[s.settingsHint, { color: colors.mutedForeground }]}>Members join by invite only</Text>
            </View>
            <Switch value={editPrivate} onValueChange={setEditPrivate} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFF" />
          </View>

          <View style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingsLabel, { color: colors.foreground, marginBottom: 2 }]}>18+ only</Text>
              <Text style={[s.settingsHint, { color: colors.mutedForeground }]}>Age-verified adults only. We check date of birth.</Text>
            </View>
            <Switch value={editAgeRestricted} onValueChange={setEditAgeRestricted} trackColor={{ false: colors.border, true: "#DC2626" }} thumbColor="#FFF" />
          </View>

          {/* Profanity tolerance */}
          <Text style={[s.sectionLabel, { color: colors.primary }]}>Content Moderation</Text>
          <Text style={[s.settingsHint, { color: colors.mutedForeground, marginTop: -8 }]}>
            Sets expectations for language in your group. Our platform still monitors all content for safety.
          </Text>
          {PROFANITY_OPTIONS.map((opt) => (
            <TouchableOpacity activeOpacity={0.85} key={opt.value}
              style={[s.radioRow, { backgroundColor: colors.card, borderColor: editProfanity === opt.value ? colors.primary : colors.border, borderWidth: editProfanity === opt.value ? 2 : 1 }]}
              onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditProfanity(opt.value); }}
            >
              <View style={[s.radioIcon, { backgroundColor: editProfanity === opt.value ? colors.primary + "18" : colors.secondary }]}>
                <Feather name={opt.icon} size={16} color={editProfanity === opt.value ? colors.primary : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.radioLabel, { color: colors.foreground }]}>{opt.label}</Text>
                <Text style={[s.settingsHint, { color: colors.mutedForeground }]}>{opt.desc}</Text>
              </View>
              {editProfanity === opt.value && <Feather name="check-circle" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}

          {/* Community audience */}
          <Text style={[s.sectionLabel, { color: colors.primary }]}>Community Audience</Text>
          <Text style={[s.settingsHint, { color: colors.mutedForeground, marginTop: -8 }]}>
            Only users with a matching preference see this group first.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(AUDIENCE_LABELS).map(([key, emoji]) => {
              const isSelected = editAudience.includes(key);
              return (
                <TouchableOpacity activeOpacity={0.85} key={key}
                  style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, backgroundColor: isSelected ? colors.primary + "15" : colors.card, borderColor: isSelected ? colors.primary : colors.border }}
                  onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditAudience((prev) => isSelected ? prev.filter((x) => x !== key) : [...prev, key]); }}
                >
                  <Text style={{ fontSize: 14 }}>{emoji}</Text>
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: isSelected ? colors.primary : colors.mutedForeground }}>
                    {key.split(" / ")[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Group rules */}
          <Text style={[s.sectionLabel, { color: colors.primary }]}>Group Rules</Text>
          <Text style={[s.settingsHint, { color: colors.mutedForeground, marginTop: -8 }]}>
            Up to 10 rules. Members see these before joining and on the group page.
          </Text>
          {editRules.map((rule, i) => (
            <View key={i} style={[s.ruleEditRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.ruleNum, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[s.ruleNumText, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <Text style={[{ flex: 1, fontFamily: "Inter_400Regular", fontSize: 14 }, { color: colors.foreground }]}>{rule}</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => handleRemoveRule(i)} style={{ padding: 4 }}>
                <Feather name="x" size={15} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
          {editRules.length < 10 && (
            <View style={[s.ruleAddRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[s.ruleInput, { color: colors.foreground }]}
                value={newRule}
                onChangeText={setNewRule}
                placeholder="Add a rule…"
                placeholderTextColor={colors.mutedForeground}
                maxLength={120}
                returnKeyType="done"
                onSubmitEditing={handleAddRule}
              />
              <TouchableOpacity activeOpacity={0.85} onPress={handleAddRule} disabled={!newRule.trim()} style={[s.ruleAddBtn, { backgroundColor: newRule.trim() ? colors.primary : colors.muted }]}>
                <Feather name="plus" size={15} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: editName.trim() ? colors.primary : colors.muted }]}
            onPress={() => void handleSaveSettings()}
            disabled={!editName.trim() || savingSettings}
            activeOpacity={0.85}
          >
            {savingSettings ? <ActivityIndicator size="small" color="#FFF" /> : (
              <Text style={s.saveBtnText}>Save Settings</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── JOIN / LEAVE FOOTER ── */}
      <View style={[s.footer, { borderTopColor: colors.border, paddingBottom: bottomPad + 10, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[s.joinBtn, { backgroundColor: group.isMember ? colors.secondary : catColor, borderColor: group.isMember ? colors.border : catColor }]}
          onPress={() => void handleJoinLeave()}
          disabled={joining}
          activeOpacity={0.85}
        >
          {joining ? (
            <ActivityIndicator size="small" color={group.isMember ? colors.foreground : "#FFF"} />
          ) : (
            <>
              <Feather name={group.isMember ? "log-out" : "users"} size={16} color={group.isMember ? colors.foreground : "#FFF"} />
              <Text style={[s.joinBtnText, { color: group.isMember ? colors.foreground : "#FFF" }]}>
                {group.isMember ? "Leave Group" : "Join Group"}
              </Text>
            </>
          )}
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity
            style={[s.inviteBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push(`/groups/${id}/invite` as never)}
            activeOpacity={0.85}
          >
            <Feather name="user-plus" size={16} color={colors.primary} />
            <Text style={[s.inviteBtnText, { color: colors.primary }]}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── REPORT MODAL ── */}
      <Modal visible={showReportModal} transparent animationType="slide" onRequestClose={() => setShowReportModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.modalTitle, { color: colors.foreground }]}>
              Report {reportTargetType === "member" ? "Member" : "Group"}
            </Text>
            <Text style={[s.modalSub, { color: colors.mutedForeground }]}>
              Your report is confidential. Our moderation team reviews all reports.
            </Text>

            <Text style={[s.settingsLabel, { color: colors.foreground }]}>Reason</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
              {REPORT_REASONS.map((r) => (
                <TouchableOpacity activeOpacity={0.85} key={r.value}
                  style={[s.reasonRow, { backgroundColor: reportReason === r.value ? colors.primary + "15" : colors.card, borderColor: reportReason === r.value ? colors.primary : colors.border }]}
                  onPress={() => setReportReason(r.value)}
                >
                  <Feather name="circle" size={14} color={reportReason === r.value ? colors.primary : colors.border} />
                  <Text style={[{ fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 }, { color: colors.foreground }]}>{r.label}</Text>
                  {reportReason === r.value && <Feather name="check" size={14} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[s.settingsLabel, { color: colors.foreground, marginTop: 12 }]}>Additional details <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
            <TextInput
              style={[s.settingsInput, s.settingsInputMulti, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              value={reportDetails} onChangeText={setReportDetails} multiline maxLength={400}
              placeholder="Provide any extra context that will help us review…"
              placeholderTextColor={colors.mutedForeground}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <TouchableOpacity activeOpacity={0.85}
                style={[s.modalCancelBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={[{ fontFamily: "Inter_600SemiBold", fontSize: 15 }, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85}
                style={[s.modalSubmitBtn, { backgroundColor: reportReason ? "#DC2626" : colors.muted }]}
                onPress={() => void handleSubmitReport()}
                disabled={!reportReason || submittingReport}
              >
                {submittingReport ? <ActivityIndicator size="small" color="#FFF" /> : (
                  <Text style={[{ fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFF" }]}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 17 },
  hero: { flexDirection: "row", gap: 14, padding: 16, alignItems: "flex-start", borderBottomWidth: 1 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  heroName: { fontFamily: "Inter_700Bold", fontSize: 18, lineHeight: 24, marginBottom: 4 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 6 },
  heroMetaText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  card: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 10 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  cardBody: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  ruleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ruleNum: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  ruleNumText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  ruleText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, flex: 1 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  reportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  reportBtnText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  memberAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  memberName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  memberJoined: { fontFamily: "Inter_400Regular", fontSize: 12 },
  adminBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  adminBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  memberBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 0.4 },
  settingsLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  settingsHint: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  settingsInput: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontFamily: "Inter_400Regular", fontSize: 15 },
  settingsInputMulti: { height: 84, paddingTop: 12, textAlignVertical: "top" },
  toggleRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  radioRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, gap: 12 },
  radioIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  radioLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  ruleEditRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  ruleAddRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  ruleInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14 },
  ruleAddBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  saveBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  footer: { flexDirection: "row", gap: 10, padding: 14, paddingTop: 12, borderTopWidth: 1 },
  joinBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  joinBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  inviteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  inviteBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 12, borderTopWidth: 1 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  modalSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1 },
  modalSubmitBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
});
