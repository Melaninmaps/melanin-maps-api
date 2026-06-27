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
  "Asian / Pacific Islander": "🌸",
  "Middle Eastern / North African": "🌙",
  "Multiracial": "🌈",
};

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
  city: string | null;
  state: string | null;
  createdBy: string | null;
  createdAt: string;
  isMember: boolean;
  myRole: string | null;
}

interface GroupMember {
  userId: string;
  role: string;
  joinedAt: string;
  name?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  social: "#C9922B", professional: "#3A6BB5", travel: "#2D7A4F",
  fitness: "#DC2626", food: "#7B2D8B", education: "#1A2F5E", general: "#3B1F0E",
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
  const [showSettings, setShowSettings] = useState(false);

  // Settings edit state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);
  const [editAudience, setEditAudience] = useState<string[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const loadGroup = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const [groupRes, membersRes] = await Promise.all([
        fetch(`${getApiBase()}/api/groups/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${getApiBase()}/api/groups/${id}/members`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);
      if (groupRes.ok) {
        const data = await groupRes.json() as { group: GroupDetail & { members?: GroupMember[]; myRole?: string } };
        const myRole = data.group.members?.find((m) => m.userId === (user as any)?.id)?.role ?? null;
        setGroup({ ...data.group, myRole });
        setEditName(data.group.name);
        setEditDesc(data.group.description ?? "");
        setEditPrivate(data.group.isPrivate);
        setEditAudience(data.group.audiencePreferences ?? []);
      }
      if (membersRes.ok) {
        const mData = await membersRes.json() as { members: GroupMember[] };
        setMembers(mData.members ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [id, user]);

  useEffect(() => { void loadGroup(); }, [loadGroup]);

  const handleJoinLeave = async () => {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    setJoining(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (group?.isMember) {
        await fetch(`${getApiBase()}/api/groups/${id}/leave`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } else {
        await fetch(`${getApiBase()}/api/groups/${id}/join`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
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
          audiencePreferences: editAudience,
        }),
      });
      if (res.ok) {
        setShowSettings(false);
        await loadGroup();
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch { /* silent */ }
    finally { setSavingSettings(false); }
  };

  const handlePromoteDemote = async (member: GroupMember) => {
    const newRole = member.role === "admin" ? "member" : "admin";
    Alert.alert(
      newRole === "admin" ? "Promote to Admin?" : "Remove Admin role?",
      `${member.name ?? member.userId} will be ${newRole === "admin" ? "promoted to admin" : "set back to member"}.`,
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
      `${member.name ?? member.userId} will be removed from the group.`,
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

  const isAdmin = group?.myRole === "admin";
  const catColor = CATEGORY_COLORS[group?.category ?? "general"] ?? "#3B1F0E";

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
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

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{group.name}</Text>
        {isAdmin ? (
          <TouchableOpacity style={s.backBtn} onPress={() => setShowSettings(true)}>
            <Feather name="settings" size={20} color={colors.foreground} />
          </TouchableOpacity>
        ) : <View style={{ width: 38 }} />}
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
              {group.memberCount} member{group.memberCount !== 1 ? "s" : ""} · {group.maxMembers} max
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
          {audience.length > 0 && (
            <View style={s.audienceRow}>
              {audience.map((a) => (
                <View key={a} style={[s.audienceChip, { backgroundColor: catColor + "15", borderColor: catColor + "40" }]}>
                  <Text style={{ fontSize: 12 }}>{AUDIENCE_LABELS[a] ?? "🤎"}</Text>
                  <Text style={[s.audienceChipText, { color: catColor }]}>{a.split(" / ")[0]}</Text>
                </View>
              ))}
              {group.isPrivate && (
                <View style={[s.audienceChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="lock" size={11} color={colors.mutedForeground} />
                  <Text style={[s.audienceChipText, { color: colors.mutedForeground }]}>Private</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Tab bar */}
      <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
        {(["info", "members", ...(isAdmin ? ["settings"] : [])] as ("info" | "members" | "settings")[]).map((tab) => (
          <TouchableOpacity
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

      {activeTab === "info" && (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: bottomPad + 60 }} showsVerticalScrollIndicator={false}>
          {group.description ? (
            <View style={[s.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.descTitle, { color: colors.foreground }]}>About this group</Text>
              <Text style={[s.descText, { color: colors.foreground }]}>{group.description}</Text>
            </View>
          ) : null}

          {audience.length > 0 && (
            <View style={[s.infoCard, { backgroundColor: "#C9922B09", borderColor: "#C9922B30" }]}>
              <Text style={[s.infoCardTitle, { color: colors.foreground }]}>Community focus</Text>
              <Text style={[s.infoCardSub, { color: colors.mutedForeground }]}>
                This group is primarily for {audience.map((a) => a.split(" / ")[0]).join(", ")} community members. All minority-owned community supporters are welcome.
              </Text>
            </View>
          )}

          <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.infoRow}>
              <Feather name="calendar" size={15} color={colors.mutedForeground} />
              <Text style={[s.infoText, { color: colors.mutedForeground }]}>
                Created {new Date(group.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
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
                <Feather name="alert-circle" size={15} color={colors.mutedForeground} />
                <Text style={[s.infoText, { color: colors.mutedForeground }]}>Age restricted (18+)</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === "members" && (
        <FlatList
          data={members}
          keyExtractor={(m) => m.userId}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: bottomPad + 60 }}
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
              {isAdmin && member.userId !== (user as any)?.id && (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={[s.memberActionBtn, { borderColor: colors.border }]}
                    onPress={() => void handlePromoteDemote(member)}
                  >
                    <Feather name={member.role === "admin" ? "user-minus" : "user-check"} size={14} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.memberActionBtn, { borderColor: colors.border }]}
                    onPress={() => void handleRemoveMember(member)}
                  >
                    <Feather name="x" size={14} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}

      {activeTab === "settings" && isAdmin && (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: bottomPad + 60 }} showsVerticalScrollIndicator={false}>
          <Text style={[s.settingsLabel, { color: colors.foreground }]}>Group name</Text>
          <TextInput
            style={[s.settingsInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            value={editName}
            onChangeText={setEditName}
            maxLength={80}
          />

          <Text style={[s.settingsLabel, { color: colors.foreground }]}>Description</Text>
          <TextInput
            style={[s.settingsInput, s.settingsInputMulti, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            value={editDesc}
            onChangeText={setEditDesc}
            multiline
            maxLength={300}
            placeholder="What's this group about?"
            placeholderTextColor={colors.mutedForeground}
          />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingsLabel, { color: colors.foreground, marginBottom: 2 }]}>Private group</Text>
              <Text style={[{ fontFamily: "Inter_400Regular", fontSize: 12 }, { color: colors.mutedForeground }]}>
                Members join by invite only
              </Text>
            </View>
            <Switch value={editPrivate} onValueChange={setEditPrivate} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFF" />
          </View>

          <Text style={[s.settingsLabel, { color: colors.foreground }]}>Community audience</Text>
          <Text style={[{ fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 }, { color: colors.mutedForeground }]}>
            Only users with a matching preference see this group first.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(AUDIENCE_LABELS).map(([key, emoji]) => {
              const isSelected = editAudience.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 5,
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
                    backgroundColor: isSelected ? colors.primary + "15" : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditAudience((prev) => isSelected ? prev.filter((x) => x !== key) : [...prev, key]);
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{emoji}</Text>
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: isSelected ? colors.primary : colors.mutedForeground }}>
                    {key.split(" / ")[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: editName.trim() ? colors.primary : colors.muted }]}
            onPress={() => void handleSaveSettings()}
            disabled={!editName.trim() || savingSettings}
            activeOpacity={0.85}
          >
            {savingSettings ? <ActivityIndicator size="small" color="#FFF" /> : (
              <Text style={s.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Join / Leave button */}
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
  heroMetaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  audienceRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  audienceChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  audienceChipText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  descCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  descTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 6 },
  descText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  infoCardTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 4 },
  infoCardSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 12 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  memberName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  memberJoined: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  adminBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  adminBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  memberActionBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  settingsLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  settingsInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: "Inter_400Regular", fontSize: 14 },
  settingsInputMulti: { minHeight: 80, textAlignVertical: "top" },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFF" },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  joinBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  joinBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  inviteBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  inviteBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
