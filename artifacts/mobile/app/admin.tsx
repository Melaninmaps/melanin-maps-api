import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
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
import { OPTIONAL_TRUST_BADGES } from "@/utils/businessBadges";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useReports } from "@/hooks/useReports";
import { useBusinessInvites, type BusinessInvite } from "@/hooks/useBusinessInvites";

const AdminNavContext = React.createContext<(tab: string) => void>(() => {});

const ADMIN_TABS = [
  { id: "overview", label: "Overview", icon: "grid" as const },
  { id: "invites", label: "Invites", icon: "send" as const },
  { id: "reports", label: "Safety Reports", icon: "flag" as const },
  { id: "reviews", label: "Reviews", icon: "star" as const },
  { id: "content-reports", label: "Content Reports", icon: "alert-circle" as const },
  { id: "captions", label: "Captions", icon: "message-circle" as const },
  { id: "claims", label: "Claims", icon: "check-square" as const },
  { id: "submissions", label: "Submissions", icon: "inbox" as const },
  { id: "referrals", label: "Referrals", icon: "share-2" as const },
  { id: "analytics", label: "Analytics", icon: "bar-chart-2" as const },
  { id: "email", label: "Email", icon: "mail" as const },
  { id: "surveys", label: "Surveys", icon: "clipboard" as const },
  { id: "users", label: "Users", icon: "users" as const },
  { id: "marketplace", label: "Marketplace", icon: "percent" as const },
  { id: "topics", label: "Topics Library", icon: "book-open" as const },
  { id: "settings", label: "Settings", icon: "settings" as const },
];

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: any }) {
  const colors = useColors();
  return (
    <View style={[adminStyles.statCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
      <View style={[adminStyles.statIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[adminStyles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[adminStyles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[adminStyles.statSub, { color: "#2D7A4F" }]}>{sub}</Text>
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  const colors = useColors();
  return <Text style={[adminStyles.sectionLabel, { color: colors.foreground }]}>{title}</Text>;
}

function ActionRow({ icon, label, sub, color, badge, onPress }: { icon: any; label: string; sub: string; color: string; badge?: number; onPress?: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[adminStyles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      activeOpacity={0.78}
    >
      <View style={[adminStyles.actionIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={17} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[adminStyles.actionLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[adminStyles.actionSub, { color: colors.mutedForeground }]}>{sub}</Text>
      </View>
      {badge != null && badge > 0 && (
        <View style={[adminStyles.badge, { backgroundColor: color }]}>
          <Text style={adminStyles.badgeText}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function OverviewTab() {
  const colors = useColors();
  const setTab = useContext(AdminNavContext);
  const { items, pendingCount, highCount } = useReports("pending");
  const { users, loading: usersLoading } = useAdminUsers();
  const userCount = usersLoading ? "…" : String(users.length);
  const [pendingBizCount, setPendingBizCount] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        if (!token) return;
        const res = await fetch(`${getApiBase()}/api/admin/businesses/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json() as unknown[];
          setPendingBizCount(data.length);
        }
      } catch { /* non-fatal */ }
    })();
  }, []);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={adminStyles.statsGrid}>
        <StatCard label="Total Users" value={userCount} sub="Registered members" color="#3B1F0E" icon="users" />
        <StatCard label="Pending" value={pendingBizCount > 0 ? String(pendingBizCount) : "—"} sub={pendingBizCount > 0 ? "Awaiting review" : "All clear"} color="#C9922B" icon="briefcase" />
        <StatCard label="Safety Reports" value={String(pendingCount)} sub={highCount > 0 ? `${highCount} high severity` : "All clear"} color="#DC2626" icon="flag" />
        <StatCard label="Users Active" value={usersLoading ? "…" : String(users.filter((u: any) => u.approved !== false).length)} sub="Approved accounts" color="#2D7A4F" icon="user-check" />
      </View>

      <SectionLabel title="Quick Actions" />
      <ActionRow icon="check-circle" label="Approve Pending Businesses" sub={pendingBizCount > 0 ? `${pendingBizCount} submission${pendingBizCount !== 1 ? "s" : ""} awaiting review` : "No pending submissions"} color="#2D7A4F" badge={pendingBizCount} onPress={() => setTab("submissions")} />
      <ActionRow icon="flag" label="Review Reports Queue" sub={pendingCount > 0 ? `${pendingCount} report${pendingCount !== 1 ? "s" : ""} need attention` : "All clear"} color="#DC2626" badge={pendingCount} onPress={() => setTab("reports")} />
    </ScrollView>
  );
}

type AdminBiz = {
  id: string;
  name: string;
  city: string;
  state: string;
  status?: string;
  confidenceScore?: number;
  blackOwned?: boolean;
  verified?: boolean;
  currentLocationSince?: string | null;
  businessFoundedDate?: string | null;
  trustBadges?: string[];
};

function BadgeEditModal({ biz, onClose, onSaved }: { biz: AdminBiz; onClose: () => void; onSaved: (updated: AdminBiz) => void }) {
  const colors = useColors();
  const [locationSince, setLocationSince] = useState(biz.currentLocationSince ?? "");
  const [foundedDate, setFoundedDate] = useState(biz.businessFoundedDate ?? "");
  const [selectedBadges, setSelectedBadges] = useState<string[]>(biz.trustBadges ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const badgeKeys = Object.keys(OPTIONAL_TRUST_BADGES);

  const toggleBadge = (id: string) => {
    setSelectedBadges(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/businesses/${biz.id}/badges`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          currentLocationSince: locationSince.trim() || null,
          businessFoundedDate: foundedDate.trim() || null,
          trustBadges: selectedBadges,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      onSaved({ ...biz, currentLocationSince: locationSince.trim() || null, businessFoundedDate: foundedDate.trim() || null, trustBadges: selectedBadges });
      onClose();
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={[badgeModalStyles.sheet, { backgroundColor: colors.card }]}>
          <View style={[badgeModalStyles.handle, { backgroundColor: colors.border }]} />
          <Text style={[badgeModalStyles.title, { color: colors.foreground }]}>Edit Badges</Text>
          <Text style={[badgeModalStyles.bizName, { color: colors.mutedForeground }]}>{biz.name}</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
            <Text style={[badgeModalStyles.sectionHeader, { color: colors.foreground }]}>📍 Location at current address since</Text>
            <Text style={[badgeModalStyles.hint, { color: colors.mutedForeground }]}>Format: YYYY-MM (e.g. 2019-06)</Text>
            <TextInput
              style={[badgeModalStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={locationSince}
              onChangeText={setLocationSince}
              placeholder="e.g. 2019-06"
              placeholderTextColor={colors.mutedForeground}
              maxLength={7}
            />

            <Text style={[badgeModalStyles.sectionHeader, { color: colors.foreground }]}>🗓 Business founded date</Text>
            <Text style={[badgeModalStyles.hint, { color: colors.mutedForeground }]}>Format: YYYY-MM (e.g. 2015-01)</Text>
            <TextInput
              style={[badgeModalStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={foundedDate}
              onChangeText={setFoundedDate}
              placeholder="e.g. 2015-01"
              placeholderTextColor={colors.mutedForeground}
              maxLength={7}
            />

            <Text style={[badgeModalStyles.sectionHeader, { color: colors.foreground }]}>🏅 Optional Trust Badges</Text>
            {badgeKeys.map((key) => {
              const b = OPTIONAL_TRUST_BADGES[key]!;
              const on = selectedBadges.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[badgeModalStyles.badgeRow, { borderColor: on ? b.color + "60" : colors.border, backgroundColor: on ? b.color + "10" : colors.background }]}
                  onPress={() => toggleBadge(key)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 18, marginRight: 10 }}>{b.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[badgeModalStyles.badgeLabel, { color: colors.foreground }]}>{b.label}</Text>
                    <Text style={[badgeModalStyles.badgeDesc, { color: colors.mutedForeground }]}>{b.description}</Text>
                  </View>
                  <Switch
                    value={on}
                    onValueChange={() => toggleBadge(key)}
                    trackColor={{ true: b.color, false: colors.border }}
                    thumbColor="#FFFFFF"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </TouchableOpacity>
              );
            })}

            {selectedBadges.length > 0 && (
              <View style={[badgeModalStyles.selectedSummary, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Text style={[badgeModalStyles.selectedCount, { color: colors.primary }]}>{selectedBadges.length} badge{selectedBadges.length !== 1 ? "s" : ""} selected</Text>
              </View>
            )}
          </ScrollView>

          {error && <Text style={badgeModalStyles.errorText}>{error}</Text>}

          <View style={badgeModalStyles.actions}>
            <TouchableOpacity style={[badgeModalStyles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[badgeModalStyles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[badgeModalStyles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
              onPress={save}
              disabled={saving}
            >
              <Text style={badgeModalStyles.saveText}>{saving ? "Saving…" : "Save Badges"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const badgeModalStyles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  title: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 20, marginBottom: 2 },
  bizName: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 16 },
  sectionHeader: { fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 16, marginBottom: 2 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 8 },
  badgeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  badgeDesc: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15 },
  selectedSummary: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 4, marginBottom: 8, alignItems: "center" },
  selectedCount: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  errorText: { color: "#DC2626", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 8 },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  saveBtn: { flex: 2, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  saveText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
});

function BusinessesTab() {
  const colors = useColors();
  const [statusFilter, setStatusFilter] = useState("All");
  const [bizList, setBizList] = useState<AdminBiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBiz, setEditingBiz] = useState<AdminBiz | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const res = await fetch(`${getApiBase()}/api/admin/businesses`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json() as { businesses?: AdminBiz[] };
          setBizList(data.businesses ?? []);
        }
      } catch {}
      finally { setLoading(false); }
    };
    void load();
  }, []);

  const allCount = bizList.length;
  const activeCount = bizList.filter((b) => b.status === "active" || b.verified).length;
  const pendingCount = bizList.filter((b) => b.status === "pending" || (!b.status && !b.verified)).length;
  const STATUSES = [
    { label: "All", count: allCount },
    { label: "Active", count: activeCount },
    { label: "Pending", count: pendingCount },
  ];
  const filtered = statusFilter === "Active"
    ? bizList.filter((b) => b.status === "active" || b.verified)
    : statusFilter === "Pending"
    ? bizList.filter((b) => b.status === "pending" || (!b.status && !b.verified))
    : bizList;

  return (
    <>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={[adminStyles.filterChip, { backgroundColor: statusFilter === s.label ? colors.primary : colors.secondary, borderColor: statusFilter === s.label ? colors.primary : colors.border }]}
              onPress={() => setStatusFilter(s.label)}
            >
              <Text style={[adminStyles.filterChipText, { color: statusFilter === s.label ? "#FFFFFF" : colors.foreground }]}>{s.label} ({s.count})</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
      ) : filtered.length === 0 ? (
        <View style={{ alignItems: "center", paddingTop: 40, gap: 8 }}>
          <Feather name="briefcase" size={32} color={colors.muted} />
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>No businesses found</Text>
        </View>
      ) : filtered.map((b, i) => (
        <TouchableOpacity
          key={b.id ?? i}
          style={[adminStyles.bizRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditingBiz(b); }}
          activeOpacity={0.8}
        >
          <View style={[adminStyles.bizAvatar, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="briefcase" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[adminStyles.bizName, { color: colors.foreground }]}>{b.name}</Text>
              {(b.blackOwned) && <Text style={{ fontSize: 10 }}>✊🏾</Text>}
            </View>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{b.city}{b.state ? `, ${b.state}` : ""}</Text>
            {(b.trustBadges?.length ?? 0) > 0 && (
              <Text style={[adminStyles.bizCity, { color: colors.primary, fontSize: 10 }]}>🏅 {b.trustBadges!.length} badge{b.trustBadges!.length !== 1 ? "s" : ""}</Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end", gap: 5 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: (b.status === "active" || b.verified) ? "#2D7A4F18" : "#C9922B18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: (b.status === "active" || b.verified) ? "#2D7A4F" : "#C9922B" }]}>
                {(b.status === "active" || b.verified) ? "Active" : "Pending"}
              </Text>
            </View>
            {b.confidenceScore != null && (
              <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>Score: {b.confidenceScore}</Text>
            )}
            <Feather name="award" size={13} color={colors.primary} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
    {editingBiz && (
      <BadgeEditModal
        biz={editingBiz}
        onClose={() => setEditingBiz(null)}
        onSaved={(updated) => {
          setBizList(prev => prev.map(b => b.id === updated.id ? updated : b));
          setEditingBiz(null);
        }}
      />
    )}
    </>
  );
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  approved: boolean;
  role: string | null;
  createdAt: string;
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function useAdminUsers() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/admin/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const setApproved = React.useCallback(async (userId: string, approved: boolean) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, approved } : u));
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ approved }),
      });
    } catch {
      load();
    }
  }, [load]);

  const deleteUser = React.useCallback(async (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      load();
    }
  }, [load]);

  return { users, loading, error, refetch: load, setApproved, deleteUser };
}

function UsersTab() {
  const colors = useColors();
  const [search, setSearchText] = React.useState("");
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const { users, loading, error, refetch, setApproved, deleteUser } = useAdminUsers();

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)
    );
  });

  const pending = users.filter((u) => !u.approved).length;

  function initials(u: AdminUser) {
    const f = u.firstName?.[0] ?? "";
    const l = u.lastName?.[0] ?? "";
    return (f + l).toUpperCase() || (u.email?.[0]?.toUpperCase() ?? "?");
  }

  function displayName(u: AdminUser) {
    if (u.firstName || u.lastName) return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    return u.email ?? u.id.slice(0, 8);
  }

  function joinedLabel(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return ""; }
  }

  const AVATAR_COLORS = ["#3B1F0E", "#2D7A4F", "#C9922B", "#1D4ED8", "#7B2D8B", "#DC2626"];
  const roleColor = (r: string | null) => r === "admin" ? "#DC2626" : r === "tester" ? "#1D4ED8" : colors.mutedForeground;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      {pending > 0 && (
        <View style={[adminStyles.alertBanner, { backgroundColor: "#C9922B12", borderColor: "#C9922B30", marginBottom: 12 }]}>
          <Feather name="user-check" size={14} color="#C9922B" />
          <Text style={[adminStyles.alertText, { color: "#C9922B" }]}>
            {pending} user{pending !== 1 ? "s" : ""} pending approval
          </Text>
        </View>
      )}

      <View style={[adminStyles.searchBarInline, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="search" size={14} color={colors.mutedForeground} />
        <TextInput
          style={[adminStyles.searchPlaceholder, { color: colors.foreground, flex: 1, padding: 0 }]}
          placeholder="Search by name or email…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearchText}
          autoCorrect={false}
        />
      </View>

      {loading && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginTop: 10 }]}>Loading users…</Text>
        </View>
      )}

      {!loading && error && (
        <View style={{ alignItems: "center", paddingVertical: 32 }}>
          <Text style={[adminStyles.bizName, { color: "#DC2626", marginBottom: 8 }]}>Failed to load</Text>
          <TouchableOpacity onPress={refetch}>
            <Text style={[adminStyles.bizCity, { color: colors.primary }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && filtered.map((u, i) => (
        <View key={u.id} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 8 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <View style={[adminStyles.bizAvatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
              <Text style={adminStyles.bizAvatarText}>{initials(u)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[adminStyles.bizName, { color: colors.foreground }]} numberOfLines={1}>
                {displayName(u)}
              </Text>
              <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]} numberOfLines={1}>
                {u.email ?? "No email"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 3 }}>
              {u.role && u.role !== "user" && (
                <View style={[adminStyles.statusBadge, { backgroundColor: roleColor(u.role) + "18" }]}>
                  <Text style={[adminStyles.statusBadgeText, { color: roleColor(u.role) }]}>{u.role}</Text>
                </View>
              )}
              <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>
                {joinedLabel(u.createdAt)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[adminStyles.smallBtn, {
                flex: 1,
                justifyContent: "center",
                backgroundColor: u.approved ? "#C9922B18" : "#2D7A4F18",
                borderColor: u.approved ? "#C9922B30" : "#2D7A4F30",
              }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setApproved(u.id, !u.approved); }}
            >
              <Text style={[adminStyles.smallBtnText, { color: u.approved ? "#C9922B" : "#2D7A4F", textAlign: "center" }]}>
                {u.approved ? "Suspend" : "Activate"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630" }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setConfirmDeleteId(u.id); }}
            >
              <Feather name="trash-2" size={13} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {!loading && !error && filtered.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Feather name="users" size={32} color={colors.muted} />
          <Text style={[adminStyles.bizName, { color: colors.mutedForeground, marginTop: 10 }]}>
            {search ? "No matching users" : "No users yet"}
          </Text>
        </View>
      )}

      <Modal visible={confirmDeleteId !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteId(null)}>
        <View style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: "#DC262640", width: "100%" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Feather name="alert-triangle" size={18} color="#DC2626" />
              <Text style={[adminStyles.actionLabel, { color: "#DC2626" }]}>Delete User Account?</Text>
            </View>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginBottom: 16 }]}>
              This permanently deletes the account and all associated data. This action cannot be undone.
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[adminStyles.smallBtn, { flex: 1, justifyContent: "center", backgroundColor: "#DC2626", borderColor: "#DC2626" }]}
                onPress={() => { if (confirmDeleteId) deleteUser(confirmDeleteId); setConfirmDeleteId(null); }}
              >
                <Text style={[adminStyles.smallBtnText, { color: "#FFF", textAlign: "center" }]}>Delete Account</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adminStyles.smallBtn, { borderColor: colors.border }]} onPress={() => setConfirmDeleteId(null)}>
                <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ReportsTab() {
  const colors = useColors();
  const { items, pendingCount, highCount, isLoading, moderate } = useReports("pending");
  const sevColor = (s: string) => s === "high" ? "#DC2626" : s === "medium" ? "#C9922B" : "#2D7A4F";

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      {pendingCount > 0 && (
        <View style={[adminStyles.alertBanner, { backgroundColor: "#DC262612", borderColor: "#DC262630" }]}>
          <Feather name="alert-triangle" size={15} color="#DC2626" />
          <Text style={[adminStyles.alertText, { color: "#DC2626" }]}>
            {pendingCount} report{pendingCount !== 1 ? "s" : ""} require action
            {highCount > 0 ? ` · ${highCount} high severity` : ""}
          </Text>
        </View>
      )}
      {isLoading && (
        <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, textAlign: "center", marginTop: 32 }]}>
          Loading reports…
        </Text>
      )}
      {!isLoading && items.length === 0 && (
        <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 32 }]}>
          <Feather name="check-circle" size={28} color="#2D7A4F" style={{ marginBottom: 8 }} />
          <Text style={[adminStyles.bizName, { color: colors.foreground }]}>All clear</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>No pending reports</Text>
        </View>
      )}
      {items.map((r) => (
        <View key={r.id} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: sevColor(r.severity) + "18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: sevColor(r.severity) }]}>{r.severity}</Text>
            </View>
            <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>{timeAgo(r.createdAt)}</Text>
          </View>
          <Text style={[adminStyles.bizName, { color: colors.foreground, marginBottom: 2 }]}>{r.category}</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Target: {r.targetName}</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Reported by: {r.reporterName}</Text>
          {r.description ? (
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginTop: 4, fontStyle: "italic" }]} numberOfLines={2}>
              "{r.description}"
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => void moderate(r.id, r.kind, "approved")}
              style={[adminStyles.smallBtn, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F30" }]}
            >
              <Text style={[adminStyles.smallBtnText, { color: "#2D7A4F" }]}>Resolve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void moderate(r.id, r.kind, "rejected")}
              style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630" }]}
            >
              <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

interface AdminReview {
  id: string;
  businessId: string;
  businessName: string;
  userId: string | null;
  authorName: string | null;
  rating: number | null;
  text: string | null;
  createdAt: string;
}

function useAdminReviews() {
  const [reviews, setReviews] = React.useState<AdminReview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/admin/reviews`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const deleteReview = React.useCallback(async (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/admin/reviews/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      load();
    }
  }, [load]);

  return { reviews, loading, error, refetch: load, deleteReview };
}

function ReviewsTab() {
  const colors = useColors();
  const { reviews, loading, error, refetch, deleteReview } = useAdminReviews();
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      {loading && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginTop: 10 }]}>Loading reviews…</Text>
        </View>
      )}
      {!loading && error && (
        <View style={{ alignItems: "center", paddingVertical: 32 }}>
          <Text style={[adminStyles.bizName, { color: "#DC2626", marginBottom: 8 }]}>Failed to load</Text>
          <TouchableOpacity onPress={refetch}>
            <Text style={[adminStyles.bizCity, { color: colors.primary }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {!loading && !error && reviews.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Feather name="star" size={32} color={colors.muted} />
          <Text style={[adminStyles.bizName, { color: colors.mutedForeground, marginTop: 10 }]}>No reviews yet</Text>
        </View>
      )}
      {reviews.map((r) => (
        <View key={r.id} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Text style={[adminStyles.bizName, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
              {r.authorName ?? "Anonymous"}
            </Text>
            <Text style={[adminStyles.scoreText, { color: "#C9922B" }]}>
              {"★".repeat(r.rating ?? 0)}{"☆".repeat(5 - (r.rating ?? 0))}
            </Text>
          </View>
          <Text style={[adminStyles.bizCity, { color: colors.primary, marginBottom: 4 }]} numberOfLines={1}>
            {r.businessName}
          </Text>
          {r.text ? (
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginBottom: 8, fontStyle: "italic" }]} numberOfLines={3}>
              "{r.text}"
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>
              {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
            <TouchableOpacity
              style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630" }]}
              onPress={() => setConfirmDelete(r.id)}
            >
              <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={confirmDelete !== null} transparent animationType="fade" onRequestClose={() => setConfirmDelete(null)}>
        <View style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: "#DC262640", width: "100%" }]}>
            <Text style={[adminStyles.actionLabel, { color: colors.foreground, marginBottom: 8 }]}>Remove Review?</Text>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginBottom: 16 }]}>
              This permanently deletes the review and cannot be undone.
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[adminStyles.smallBtn, { flex: 1, justifyContent: "center", backgroundColor: "#DC2626", borderColor: "#DC2626" }]}
                onPress={() => { if (confirmDelete) deleteReview(confirmDelete); setConfirmDelete(null); }}
              >
                <Text style={[adminStyles.smallBtnText, { color: "#FFF", textAlign: "center" }]}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adminStyles.smallBtn, { borderColor: colors.border }]} onPress={() => setConfirmDelete(null)}>
                <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function AnalyticsTab() {
  const colors = useColors();
  const weeks = ["W1", "W2", "W3", "W4"];
  const barData = [65, 82, 74, 96];
  const maxVal = Math.max(...barData);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={[adminStyles.analyticsCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
        <Text style={[adminStyles.analyticsTitle, { color: colors.foreground }]}>New Users This Month</Text>
        <Text style={[adminStyles.analyticsValue, { color: colors.primary }]}>317</Text>
        <Text style={[adminStyles.analyticsSub, { color: "#2D7A4F" }]}>↑ 18% vs last month</Text>
        <View style={adminStyles.barChart}>
          {barData.map((v, i) => (
            <View key={i} style={adminStyles.barCol}>
              <View style={[adminStyles.bar, { height: (v / maxVal) * 90, backgroundColor: colors.primary }]} />
              <Text style={[adminStyles.barLabel, { color: colors.mutedForeground }]}>{weeks[i]}</Text>
            </View>
          ))}
        </View>
      </View>
      {[
        { label: "Top Category", value: "Beauty (34%)", icon: "scissors" as const, color: "#C9922B" },
        { label: "Top City", value: "Atlanta, GA", icon: "map-pin" as const, color: "#3B1F0E" },
        { label: "Avg Session", value: "4m 32s", icon: "clock" as const, color: "#2D7A4F" },
        { label: "Retention Rate", value: "68%", icon: "repeat" as const, color: "#1D4ED8" },
        { label: "DAU/MAU", value: "0.42", icon: "activity" as const, color: "#7B2D8B" },
        { label: "Referral Conv.", value: "24%", icon: "share-2" as const, color: "#C9922B" },
      ].map((m, i) => (
        <View key={i} style={[adminStyles.metricRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[adminStyles.metricIcon, { backgroundColor: m.color + "18" }]}>
            <Feather name={m.icon} size={15} color={m.color} />
          </View>
          <Text style={[adminStyles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
          <Text style={[adminStyles.metricValue, { color: colors.foreground }]}>{m.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function EventsTab() {
  const colors = useColors();
  const events = [
    { title: "Juneteenth Freedom Festival", date: "Jun 19", city: "Atlanta, GA", status: "active", attendees: 1240 },
    { title: "Black Tech Founders Summit", date: "Jul 12", city: "Chicago, IL", status: "active", attendees: 540 },
    { title: "Houston Jazz & Soul Night", date: "Jul 20", city: "Houston, TX", status: "pending", attendees: 0 },
    { title: "Melanin Beauty Expo", date: "Aug 3", city: "Washington, DC", status: "active", attendees: 1820 },
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <ActionRow icon="plus-circle" label="Create New Event" sub="Add an event to the platform" color="#3B1F0E" />
      {events.map((e, i) => (
        <View key={i} style={[adminStyles.bizRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[adminStyles.bizAvatar, { backgroundColor: "#1D4ED820" }]}>
            <Feather name="calendar" size={16} color="#1D4ED8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[adminStyles.bizName, { color: colors.foreground }]}>{e.title}</Text>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{e.date} · {e.city}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 5 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: e.status === "active" ? "#2D7A4F18" : "#C9922B18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: e.status === "active" ? "#2D7A4F" : "#C9922B" }]}>{e.status}</Text>
            </View>
            {e.attendees > 0 && <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>{e.attendees} RSVP</Text>}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ContentTab() {
  const colors = useColors();
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <SectionLabel title="Featured Content" />
      <ActionRow icon="star" label="Featured Businesses" sub="Manage which businesses appear featured" color="#C9922B" />
      <ActionRow icon="calendar" label="Featured Events" sub="Control homepage event highlights" color="#1D4ED8" />
      <ActionRow icon="image" label="Hero Banners" sub="Edit homepage discovery banners" color="#3B1F0E" />

      <SectionLabel title="Community Content" />
      <ActionRow icon="message-circle" label="Community Posts" sub="Moderate community discussions" color="#2D7A4F" badge={3} />
      <ActionRow icon="bell" label="Safety Alerts" sub="Manage active community alerts" color="#DC2626" badge={1} />
      <ActionRow icon="book-open" label="Resource Hub" sub="Curate community resources & guides" color="#7B2D8B" />

      <SectionLabel title="Platform Notices" />
      <ActionRow icon="send" label="Push Notifications" sub="Send announcements to all users" color="#3B1F0E" />
      <ActionRow icon="mail" label="Email Campaigns" sub="Community newsletters and updates" color="#1D4ED8" />
    </ScrollView>
  );
}

function SettingsInfoRow({ icon, label, sub, color }: { icon: any; label: string; sub: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[adminStyles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[adminStyles.actionIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={17} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[adminStyles.actionLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[adminStyles.actionSub, { color: colors.mutedForeground }]}>{sub}</Text>
      </View>
      <Feather name="lock" size={14} color={colors.mutedForeground} />
    </View>
  );
}

function SettingsTab() {
  const colors = useColors();
  const setTab = useContext(AdminNavContext);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={[adminStyles.alertBanner, { backgroundColor: "#1D4ED818", borderColor: "#1D4ED830", marginBottom: 16 }]}>
        <Feather name="info" size={14} color="#1D4ED8" />
        <Text style={[adminStyles.alertText, { color: "#1D4ED8", flex: 1 }]}>
          Settings are managed via server configuration. Contact engineering to change these values.
        </Text>
      </View>

      <SectionLabel title="App Configuration" />
      <SettingsInfoRow icon="sliders" label="Confidence Score Weights" sub="Adjust how scores are calculated" color="#3B1F0E" />
      <SettingsInfoRow icon="shield" label="Trust & Safety Rules" sub="Content moderation thresholds" color="#DC2626" />
      <SettingsInfoRow icon="award" label="Verification Criteria" sub="Set requirements for verified badge" color="#C9922B" />
      <ActionRow icon="gift" label="Referral Rewards" sub="Configure referral tiers and rewards" color="#2D7A4F" onPress={() => setTab("referrals")} />

      <SectionLabel title="Access Control" />
      <ActionRow icon="lock" label="Admin Roles" sub="Manage moderator and admin access" color="#7B2D8B" onPress={() => setTab("users")} />
      <SettingsInfoRow icon="key" label="API Keys" sub="Manage third-party integrations" color="#1D4ED8" />

      <SectionLabel title="Data & Privacy" />
      <SettingsInfoRow icon="database" label="Data Export" sub="Export platform data and analytics" color="#C9922B" />
      <SettingsInfoRow icon="trash-2" label="Data Retention" sub="Configure data retention policies" color="#DC2626" />
    </ScrollView>
  );
}

function SurveysTab() {
  const colors = useColors();
  const [typeFilter, setTypeFilter] = useState("All");
  const SURVEY_TYPES = ["All", "Safety", "Neighborhood", "Itinerary", "Preferences"];
  const KPI = [
    { label: "Safety Surveys", value: "284", sub: "+18 today", color: "#DC2626", icon: "shield" as const },
    { label: "Neighborhood Ratings", value: "136", sub: "+7 today", color: "#2D7A4F", icon: "map-pin" as const },
    { label: "Itinerary Feedback", value: "97", sub: "+12 today", color: "#C9922B", icon: "map" as const },
    { label: "Preference Surveys", value: "412", sub: "+31 today", color: "#1D4ED8", icon: "sliders" as const },
  ];
  const RESPONSES = [
    { type: "Safety", business: "Essence Beauty Lounge", city: "Houston, TX", rating: 4, time: "3 min ago", summary: "Felt very safe during evening visit. Good lighting." },
    { type: "Neighborhood", business: "Sweet Auburn, Atlanta", city: "Atlanta, GA", rating: 5, time: "12 min ago", summary: "Well-lit streets, active foot traffic, community watch." },
    { type: "Itinerary", business: "Atlanta Weekend Trip", city: "Atlanta, GA", rating: 5, time: "28 min ago", summary: "Loved it! Great neighborhood picks and safety tips." },
    { type: "Safety", business: "Kingdom Cuts Barbershop", city: "Atlanta, GA", rating: 3, time: "1h ago", summary: "Average experience. Could use better exterior lighting." },
    { type: "Preferences", business: "User: Simone W.", city: "Atlanta, GA", rating: 0, time: "2h ago", summary: "Foodie + Cultural, Atlanta & Houston, Solo travel." },
    { type: "Itinerary", business: "New Orleans Trip", city: "New Orleans, LA", rating: 4, time: "3h ago", summary: "Good recommendations but needed more budget options." },
    { type: "Neighborhood", business: "Bronzeville, Chicago", city: "Chicago, IL", rating: 4, time: "5h ago", summary: "Great daytime safety, mixed nighttime. Police somewhat helpful." },
    { type: "Safety", business: "Harambee Tech Hub", city: "Houston, TX", rating: 5, time: "6h ago", summary: "Excellent safety experience. Solo-friendly space." },
  ];
  const COLORS: Record<string, string> = { Safety: "#DC2626", Neighborhood: "#2D7A4F", Itinerary: "#C9922B", Preferences: "#1D4ED8" };
  const filtered = typeFilter === "All" ? RESPONSES : RESPONSES.filter((r) => r.type === typeFilter);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={adminStyles.statsGrid}>
        {KPI.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} icon={k.icon} />
        ))}
      </View>
      <SectionLabel title="Response Viewer" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {SURVEY_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[adminStyles.filterChip, { backgroundColor: typeFilter === t ? colors.primary : colors.secondary, borderColor: typeFilter === t ? colors.primary : colors.border }]}
              onPress={() => setTypeFilter(t)}
            >
              <Text style={[adminStyles.filterChipText, { color: typeFilter === t ? "#FFFFFF" : colors.foreground }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {filtered.map((r, i) => (
        <View key={i} style={[adminStyles.surveyCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: COLORS[r.type] ?? colors.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <View style={[adminStyles.surveyTypeBadge, { backgroundColor: (COLORS[r.type] ?? "#999") + "18" }]}>
              <Text style={[adminStyles.surveyTypeBadgeText, { color: COLORS[r.type] ?? "#999" }]}>{r.type}</Text>
            </View>
            <Text style={[adminStyles.surveyBiz, { color: colors.foreground }]} numberOfLines={1}>{r.business}</Text>
            <Text style={[adminStyles.surveyTime, { color: colors.mutedForeground }]}>{r.time}</Text>
          </View>
          <Text style={[adminStyles.surveyCity, { color: colors.mutedForeground }]}>{r.city}</Text>
          {r.rating > 0 && (
            <View style={adminStyles.surveyStars}>
              {[1,2,3,4,5].map((n) => (
                <Feather key={n} name="star" size={12} color={n <= r.rating ? "#C9922B" : colors.border} />
              ))}
            </View>
          )}
          <Text style={[adminStyles.surveySummary, { color: colors.mutedForeground }]}>{r.summary}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

interface ClaimRow {
  id: string;
  businessName: string | null;
  businessId: string;
  ownerName: string;
  email: string;
  phone: string | null;
  role: string | null;
  status: string | null;
  createdAt: string;
}

function ClaimsTab() {
  const colors = useColors();
  const [filter, setFilter] = useState("All");
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const STATUSES = ["All", "Pending", "Approved", "Rejected"];

  const loadClaims = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = getApiBase();
      if (!token || !apiBase) return;
      const res = await fetch(`${apiBase}/api/admin/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { claims: ClaimRow[] };
        setClaims(data.claims);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void loadClaims(); }, [loadClaims]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = getApiBase();
      if (!token || !apiBase) return;
      const res = await fetch(`${apiBase}/api/admin/claims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setClaims((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
      }
    } catch {}
  }, []);

  const statusColor = (s: string | null) => s === "approved" ? "#2D7A4F" : s === "rejected" ? "#DC2626" : "#C9922B";

  const filtered = filter === "All" ? claims : claims.filter((c) => (c.status ?? "pending") === filter.toLowerCase());
  const pending = claims.filter((c) => c.status === "pending").length;

  function fmtDate(iso: string): string {
    try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
    catch { return iso; }
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      {pending > 0 && (
        <View style={[adminStyles.alertBanner, { backgroundColor: "#C9922B12", borderColor: "#C9922B30" }]}>
          <Feather name="check-square" size={15} color="#C9922B" />
          <Text style={[adminStyles.alertText, { color: "#C9922B", flex: 1 }]}>{pending} claim{pending !== 1 ? "s" : ""} awaiting review</Text>
          <TouchableOpacity onPress={() => { setIsLoading(true); void loadClaims(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="refresh-cw" size={14} color="#C9922B" />
          </TouchableOpacity>
        </View>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {STATUSES.map((s) => (
              <TouchableOpacity key={s} style={[adminStyles.filterChip, { backgroundColor: filter === s ? colors.primary : colors.secondary, borderColor: filter === s ? colors.primary : colors.border }]} onPress={() => setFilter(s)}>
                <Text style={[adminStyles.filterChipText, { color: filter === s ? "#FFFFFF" : colors.foreground }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <TouchableOpacity
          onPress={() => { setIsLoading(true); void loadClaims(); }}
          style={[adminStyles.filterChip, { backgroundColor: colors.secondary, borderColor: colors.border, paddingHorizontal: 10 }]}
        >
          <Feather name="refresh-cw" size={14} color={colors.foreground} />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
      ) : filtered.length === 0 ? (
        <View style={{ alignItems: "center", paddingTop: 40 }}>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>No {filter !== "All" ? filter.toLowerCase() : ""} claims found</Text>
        </View>
      ) : (
        filtered.map((c) => (
          <View key={c.id} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={[adminStyles.statusBadge, { backgroundColor: statusColor(c.status) + "18" }]}>
                <Text style={[adminStyles.statusBadgeText, { color: statusColor(c.status) }]}>{c.status ?? "pending"}</Text>
              </View>
              <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>Submitted {fmtDate(c.createdAt)}</Text>
            </View>
            <Text style={[adminStyles.bizName, { color: colors.foreground, marginBottom: 2 }]}>{c.businessName ?? c.businessId}</Text>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Claimant: {c.ownerName} · {c.role ?? "owner"}</Text>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{c.email}{c.phone ? ` · ${c.phone}` : ""}</Text>
            {(c.status === "pending" || c.status == null) && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F30" }]} onPress={() => void updateStatus(c.id, "approved")}>
                  <Text style={[adminStyles.smallBtnText, { color: "#2D7A4F" }]}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630" }]} onPress={() => void updateStatus(c.id, "rejected")}>
                  <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]} onPress={() => void updateStatus(c.id, "needs_info")}>
                  <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Request Docs</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

type PendingSubmission = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  submittedBy: string;
  createdAt: string;
  foundingBusiness: boolean;
  localStatus?: "pending" | "approved" | "rejected";
};

function SubmissionsTab() {
  const colors = useColors();
  const [filter, setFilter] = useState("All");
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const STATUSES = ["All", "Pending", "Approved", "Rejected"];

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) return;
      const res = await fetch(`${getApiBase()}/api/admin/businesses/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(true); return; }
      const data = await res.json() as PendingSubmission[];
      setSubmissions(data.map((d) => ({ ...d, localStatus: "pending" })));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSubmissions(); }, [fetchSubmissions]);

  const handleAction = async (bizId: string, newStatus: "approved" | "rejected") => {
    setActionLoadingId(bizId);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) return;
      const res = await fetch(`${getApiBase()}/api/admin/businesses/${bizId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSubmissions((prev) => prev.map((s) => s.id === bizId ? { ...s, localStatus: newStatus } : s));
      }
    } catch { /* non-fatal */ } finally {
      setActionLoadingId(null);
    }
  };

  const statusColor = (s: string) => s === "approved" ? "#2D7A4F" : s === "rejected" ? "#DC2626" : "#C9922B";
  const displayed = submissions.filter((s) => {
    if (filter === "All") return true;
    return s.localStatus === filter.toLowerCase();
  });
  const pending = submissions.filter((s) => s.localStatus === "pending").length;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      {loading && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[adminStyles.alertText, { color: colors.mutedForeground, marginTop: 10 }]}>Loading submissions…</Text>
        </View>
      )}
      {!loading && error && (
        <View style={[adminStyles.alertBanner, { backgroundColor: "#DC262612", borderColor: "#DC262630" }]}>
          <Feather name="alert-circle" size={15} color="#DC2626" />
          <Text style={[adminStyles.alertText, { color: "#DC2626", flex: 1 }]}>Failed to load submissions.</Text>
          <TouchableOpacity onPress={() => void fetchSubmissions()}>
            <Text style={{ color: "#DC2626", fontWeight: "700", fontSize: 13 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {!loading && !error && pending > 0 && (
        <View style={[adminStyles.alertBanner, { backgroundColor: "#3B1F0E12", borderColor: "#3B1F0E30" }]}>
          <Feather name="send" size={15} color="#3B1F0E" />
          <Text style={[adminStyles.alertText, { color: "#3B1F0E" }]}>{pending} submission{pending !== 1 ? "s" : ""} awaiting review</Text>
        </View>
      )}
      {!loading && !error && submissions.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 48 }}>
          <Feather name="inbox" size={36} color={colors.mutedForeground} />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: colors.foreground, marginTop: 12 }}>All caught up</Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, marginTop: 4 }}>No pending business submissions.</Text>
        </View>
      )}
      {!loading && !error && submissions.length > 0 && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {STATUSES.map((s) => (
                <TouchableOpacity key={s} style={[adminStyles.filterChip, { backgroundColor: filter === s ? colors.primary : colors.secondary, borderColor: filter === s ? colors.primary : colors.border }]} onPress={() => setFilter(s)}>
                  <Text style={[adminStyles.filterChipText, { color: filter === s ? "#FFFFFF" : colors.foreground }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {displayed.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 36 }}>
              <Feather name="check-circle" size={30} color={colors.mutedForeground} />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.mutedForeground, marginTop: 10 }}>
                No {filter.toLowerCase()} submissions
              </Text>
            </View>
          )}
          {displayed.map((s) => (
            <View key={s.id} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <View style={[adminStyles.statusBadge, { backgroundColor: statusColor(s.localStatus ?? "pending") + "18" }]}>
                  <Text style={[adminStyles.statusBadgeText, { color: statusColor(s.localStatus ?? "pending") }]}>{s.localStatus ?? "pending"}</Text>
                </View>
                <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <Text style={[adminStyles.bizName, { color: colors.foreground }]}>{s.name}</Text>
                {s.foundingBusiness && <Text style={{ fontSize: 12 }}>🏆</Text>}
              </View>
              {(s.category || s.city) && (
                <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>
                  {[s.category, s.city && s.state ? `${s.city}, ${s.state}` : s.city].filter(Boolean).join(" · ")}
                </Text>
              )}
              <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Submitted by: {s.submittedBy}</Text>
              {s.localStatus === "pending" && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[adminStyles.smallBtn, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F30", opacity: actionLoadingId === s.id ? 0.6 : 1 }]}
                    onPress={() => void handleAction(s.id, "approved")}
                    disabled={actionLoadingId === s.id}
                  >
                    {actionLoadingId === s.id
                      ? <ActivityIndicator size={12} color="#2D7A4F" />
                      : <Text style={[adminStyles.smallBtnText, { color: "#2D7A4F" }]}>Approve</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630", opacity: actionLoadingId === s.id ? 0.6 : 1 }]}
                    onPress={() => void handleAction(s.id, "rejected")}
                    disabled={actionLoadingId === s.id}
                  >
                    {actionLoadingId === s.id
                      ? <ActivityIndicator size={12} color="#DC2626" />
                      : <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Reject</Text>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function ReferralsTab() {
  const colors = useColors();
  const KPI = [
    { label: "Total Referrals", value: "824", sub: "+47 this week", color: "#3B1F0E", icon: "share-2" as const },
    { label: "Conversions", value: "312", sub: "38% conv. rate", color: "#2D7A4F", icon: "user-check" as const },
    { label: "Ambassadors", value: "18", sub: "25+ referrals", color: "#C9922B", icon: "award" as const },
    { label: "Credits Issued", value: "$840", sub: "All time", color: "#1D4ED8", icon: "dollar-sign" as const },
  ];
  const topReferrers = [
    { name: "Simone W.", referrals: 38, tier: "Legend", earned: "$100", color: "#3B1F0E" },
    { name: "Marcus T.", referrals: 29, tier: "Legend", earned: "$100", color: "#2D7A4F" },
    { name: "Aisha B.", referrals: 17, tier: "Ambassador", earned: "$25", color: "#C9922B" },
    { name: "Kwame A.", referrals: 12, tier: "Ambassador", earned: "$25", color: "#1D4ED8" },
    { name: "Zara M.", referrals: 6, tier: "Connector", earned: "$5", color: "#7B2D8B" },
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={adminStyles.statsGrid}>
        {KPI.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} icon={k.icon} />
        ))}
      </View>
      <SectionLabel title="Top Referrers" />
      {topReferrers.map((r, i) => (
        <View key={i} style={[adminStyles.bizRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[adminStyles.bizAvatar, { backgroundColor: r.color }]}>
            <Text style={adminStyles.bizAvatarText}>{r.name.split(" ").map((w) => w[0]).join("")}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[adminStyles.bizName, { color: colors.foreground }]}>{r.name}</Text>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{r.referrals} referrals · {r.earned} earned</Text>
          </View>
          <View style={[adminStyles.statusBadge, { backgroundColor: r.color + "18" }]}>
            <Text style={[adminStyles.statusBadgeText, { color: r.color }]}>{r.tier}</Text>
          </View>
        </View>
      ))}
      <SectionLabel title="Program Settings" />
      <ActionRow icon="gift" label="Reward Tiers" sub="Configure tier thresholds and rewards" color="#3B1F0E" />
      <ActionRow icon="link" label="Referral Links" sub="View and manage all referral links" color="#C9922B" />
      <ActionRow icon="download" label="Export Data" sub="Download full referral report CSV" color="#2D7A4F" />
    </ScrollView>
  );
}

function EmailTab() {
  const colors = useColors();
  const KPI = [
    { label: "Subscribers", value: "2,841", sub: "+184 this week", color: "#3B1F0E", icon: "mail" as const },
    { label: "Open Rate", value: "46%", sub: "+3% vs avg", color: "#2D7A4F", icon: "eye" as const },
    { label: "Click Rate", value: "18%", sub: "Industry: 11%", color: "#C9922B", icon: "mouse-pointer" as const },
    { label: "Unsubscribes", value: "12", sub: "0.4% rate", color: "#1D4ED8", icon: "user-x" as const },
  ];
  const drip = [
    { day: "Day 0", subject: "Welcome to Mapping With Melanin™", sent: 2841, opened: 1847, clicked: 612, status: "active" },
    { day: "Day 2", subject: "Discover minority-owned businesses near you", sent: 2614, opened: 1180, clicked: 447, status: "active" },
    { day: "Day 5", subject: "Rate your first neighborhood", sent: 1823, opened: 910, clicked: 302, status: "active" },
    { day: "Day 10", subject: "Your safety impact so far", sent: 1240, opened: 694, clicked: 208, status: "active" },
    { day: "Day 30", subject: "You've been with us a month 🙌🏾", sent: 412, opened: 267, clicked: 89, status: "active" },
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={adminStyles.statsGrid}>
        {KPI.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} icon={k.icon} />
        ))}
      </View>
      <SectionLabel title="Onboarding Drip Sequence" />
      {drip.map((d, i) => (
        <View key={i} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={[adminStyles.statusBadge, { backgroundColor: "#2D7A4F18" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: "#2D7A4F" }]}>{d.day}</Text>
            </View>
            <View style={[adminStyles.statusBadge, { backgroundColor: "#2D7A4F10" }]}>
              <Text style={[adminStyles.statusBadgeText, { color: "#2D7A4F" }]}>Active</Text>
            </View>
          </View>
          <Text style={[adminStyles.bizName, { color: colors.foreground, marginBottom: 6 }]}>{d.subject}</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>Sent: {d.sent.toLocaleString()}</Text>
            <Text style={[adminStyles.bizCity, { color: "#2D7A4F" }]}>Open: {Math.round(d.opened / d.sent * 100)}%</Text>
            <Text style={[adminStyles.bizCity, { color: "#C9922B" }]}>Click: {Math.round(d.clicked / d.sent * 100)}%</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#3B1F0E18", borderColor: "#3B1F0E30" }]}>
              <Text style={[adminStyles.smallBtnText, { color: "#3B1F0E" }]}>Trigger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <SectionLabel title="Actions" />
      <ActionRow icon="users" label="Subscriber List" sub="Browse and search all email subscribers" color="#3B1F0E" />
      <ActionRow icon="user-minus" label="Unsubscribe Management" sub="Handle unsubscribe requests" color="#DC2626" />
      <ActionRow icon="send" label="Send Announcement" sub="One-off email to all subscribers" color="#C9922B" />
    </ScrollView>
  );
}

const PLATFORM_ICONS: Record<string, { name: string; color: string }> = {
  instagram: { name: "logo-instagram", color: "#E1306C" },
  twitter:   { name: "logo-twitter",   color: "#1DA1F2" },
  tiktok:    { name: "musical-notes",  color: "#010101" },
  facebook:  { name: "logo-facebook",  color: "#1877F2" },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "#C9922B" },
  contacted: { label: "Contacted", color: "#1D4ED8" },
  accepted:  { label: "Accepted",  color: "#2D7A4F" },
  declined:  { label: "Declined",  color: "#DC2626" },
  expired:   { label: "Expired",   color: "#6B7280" },
};

function InviteCard({ invite, onUpdateStatus }: { invite: BusinessInvite; onUpdateStatus: (id: string, status: string) => void }) {
  const colors = useColors();
  const platform = PLATFORM_ICONS[invite.socialPlatform] ?? { name: "globe", color: "#6B7280" };
  const meta = STATUS_META[invite.status] ?? { label: invite.status, color: "#6B7280" };

  const daysLeft = Math.max(0, Math.ceil((new Date(invite.trialEndDate).getTime() - Date.now()) / 86400000));
  const trialEnd = new Date(invite.trialEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const NEXT_STATUSES: Record<string, string[]> = {
    pending:   ["contacted", "declined"],
    contacted: ["accepted", "declined"],
    accepted:  [],
    declined:  [],
    expired:   [],
  };
  const actions = NEXT_STATUSES[invite.status] ?? [];

  return (
    <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: meta.color }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[adminStyles.statusBadge, { backgroundColor: meta.color + "18" }]}>
            <Text style={[adminStyles.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Ionicons name={platform.name as any} size={15} color={platform.color} />
        </View>
        <Text style={[adminStyles.scoreText, { color: colors.mutedForeground }]}>
          {new Date(invite.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </Text>
      </View>

      <Text style={[adminStyles.bizName, { color: colors.foreground }]}>@{invite.socialHandle}</Text>
      {invite.businessName ? (
        <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>{invite.businessName}</Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: 16, marginTop: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="clock" size={11} color={daysLeft < 7 ? "#DC2626" : colors.mutedForeground} />
          <Text style={[adminStyles.scoreText, { color: daysLeft < 7 ? "#DC2626" : colors.mutedForeground }]}>
            {daysLeft > 0 ? `${daysLeft}d left` : "Expired"} · Trial ends {trialEnd}
          </Text>
        </View>
      </View>

      {invite.notes ? (
        <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginTop: 4, fontStyle: "italic" }]}>
          "{invite.notes}"
        </Text>
      ) : null}

      {actions.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {actions.map((a) => {
            const m = STATUS_META[a] ?? { label: a, color: "#6B7280" };
            return (
              <TouchableOpacity
                key={a}
                style={[adminStyles.smallBtn, { backgroundColor: m.color + "18", borderColor: m.color + "40" }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onUpdateStatus(invite.id, a);
                }}
              >
                <Text style={[adminStyles.smallBtnText, { color: m.color }]}>
                  {a === "contacted" ? "Mark Contacted" : a === "accepted" ? "Mark Accepted" : "Mark Declined"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function InvitesTab() {
  const colors = useColors();
  const { invites, isLoading, refresh, updateStatus } = useBusinessInvites();
  const [filter, setFilter] = useState("All");

  const FILTERS = ["All", "Pending", "Contacted", "Accepted", "Declined", "Expired"];

  const filtered = filter === "All"
    ? invites
    : invites.filter((i) => i.status === filter.toLowerCase());

  const counts = {
    pending:   invites.filter((i) => i.status === "pending").length,
    contacted: invites.filter((i) => i.status === "contacted").length,
    accepted:  invites.filter((i) => i.status === "accepted").length,
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await updateStatus(id, status);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <View style={adminStyles.statsGrid}>
        <StatCard label="Total Invites"  value={String(invites.length)} sub="All time"           color="#3B1F0E" icon="send" />
        <StatCard label="Pending"         value={String(counts.pending)}   sub="Need outreach"     color="#C9922B" icon="clock" />
        <StatCard label="Contacted"       value={String(counts.contacted)} sub="Awaiting response" color="#1D4ED8" icon="message-circle" />
        <StatCard label="Accepted"        value={String(counts.accepted)}  sub="Joined platform"   color="#2D7A4F" icon="check-circle" />
      </View>

      {counts.pending > 0 && (
        <View style={[adminStyles.alertBanner, { backgroundColor: "#C9922B12", borderColor: "#C9922B30" }]}>
          <Feather name="send" size={15} color="#C9922B" />
          <Text style={[adminStyles.alertText, { color: "#C9922B" }]}>
            {counts.pending} business{counts.pending !== 1 ? "es" : ""} waiting to be contacted
          </Text>
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <SectionLabel title="Business Invites" />
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); void refresh(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="refresh-cw" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[adminStyles.filterChip, {
                backgroundColor: filter === f ? colors.primary : colors.secondary,
                borderColor: filter === f ? colors.primary : colors.border,
              }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[adminStyles.filterChipText, { color: filter === f ? "#FFFFFF" : colors.foreground }]}>
                {f} {f === "All" ? `(${invites.length})` : `(${invites.filter((i) => i.status === f.toLowerCase()).length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {isLoading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      )}

      {!isLoading && filtered.length === 0 && (
        <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 32 }]}>
          <Feather name="send" size={28} color={colors.mutedForeground} style={{ marginBottom: 8 }} />
          <Text style={[adminStyles.bizName, { color: colors.foreground }]}>No invites yet</Text>
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground }]}>
            Invites appear when reviewers tag a business's social handle
          </Text>
        </View>
      )}

      {filtered.map((invite) => (
        <InviteCard key={invite.id} invite={invite} onUpdateStatus={handleUpdateStatus} />
      ))}
    </ScrollView>
  );
}

// ── Marketplace Fee Config Tab ────────────────────────────────────────────────
type FeeConfigRow = {
  id?: string;
  tier: string;
  tierLabel: string;
  standardFee: string;
  promotionalFee: string;
  foundingFee: string;
  promoActive: boolean;
  promoStartDate?: string | null;
  promoEndDate?: string | null;
  promoDescription?: string | null;
  notes?: string | null;
};

type EditingFee = {
  tier: string;
  field: "standardFee" | "promotionalFee" | "foundingFee" | "promo";
  value: string;
  promoActive?: boolean;
  promoDescription?: string;
  promoStart?: string;
  promoEnd?: string;
};

const TIER_COLORS: Record<string, string> = {
  community: "#2D7A4F",
  growth: "#C9922B",
  premium: "#442A19",
};

function MarketplaceTab() {
  const colors = useColors();
  const [configs, setConfigs] = React.useState<FeeConfigRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<EditingFee | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveResult, setSaveResult] = React.useState<"ok" | "err" | null>(null);
  const [showFoundingWarning, setShowFoundingWarning] = React.useState(false);
  const [pendingFoundingEdit, setPendingFoundingEdit] = React.useState<{ tier: string; value: string } | null>(null);

  const loadConfigs = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      const res = await fetch(`${base}/api/marketplace-fees/config`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (res.ok) {
        const data = await res.json() as { configs: FeeConfigRow[] };
        setConfigs(data.configs ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void loadConfigs(); }, [loadConfigs]);

  const pct = (v: string) => `${Math.round(Number(v) * 100)}%`;

  async function saveFeeEdit(e: EditingFee) {
    if (saving) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      let url: string;
      let body: Record<string, unknown>;
      if (e.field === "foundingFee") {
        url = `${base}/api/marketplace-fees/config/${e.tier}/founding`;
        body = { foundingFee: Number(e.value) };
      } else if (e.field === "promo") {
        url = `${base}/api/marketplace-fees/config/${e.tier}`;
        body = {
          promoActive: e.promoActive,
          promoDescription: e.promoDescription,
          promoStartDate: e.promoStart || null,
          promoEndDate: e.promoEnd || null,
        };
      } else {
        url = `${base}/api/marketplace-fees/config/${e.tier}`;
        body = { [e.field]: Number(e.value) };
      }
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaveResult("ok");
        setEditing(null);
        await loadConfigs();
      } else {
        setSaveResult("err");
      }
    } catch { setSaveResult("err"); } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      </ScrollView>
    );
  }

  const tiers = ["community", "growth", "premium"] as const;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <SectionLabel title="Marketplace Fee Configuration" />
      <Text style={[adminStyles.activityText, { color: colors.mutedForeground, marginBottom: 8 }]}>
        Fees are applied at checkout. Priority: Founding (locked) › Promotional › Standard.
      </Text>

      {tiers.map((tier) => {
        const cfg = configs.find((c) => c.tier === tier);
        if (!cfg) return null;
        const color = TIER_COLORS[tier] ?? colors.primary;
        const isEditingStd = editing?.tier === tier && editing.field === "standardFee";
        const isEditingPro = editing?.tier === tier && editing.field === "promotionalFee";
        const isEditingFound = editing?.tier === tier && editing.field === "foundingFee";
        const isEditingPromo = editing?.tier === tier && editing.field === "promo";

        return (
          <View key={tier} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 8 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <View style={[adminStyles.actionIcon, { backgroundColor: color + "18", width: 34, height: 34, borderRadius: 9 }]}>
                <Feather name="percent" size={15} color={color} />
              </View>
              <Text style={[adminStyles.actionLabel, { color: colors.foreground, flex: 1 }]}>{cfg.tierLabel} Tier</Text>
              <View style={[adminStyles.statusBadge, { backgroundColor: cfg.promoActive ? "#2D7A4F18" : colors.secondary }]}>
                <Text style={[adminStyles.statusBadgeText, { color: cfg.promoActive ? "#2D7A4F" : colors.mutedForeground }]}>
                  {cfg.promoActive ? "Promo On" : "Promo Off"}
                </Text>
              </View>
            </View>

            {/* Standard Fee Row */}
            <View style={[adminStyles.metricRow, { borderColor: colors.border, backgroundColor: colors.background, marginBottom: 6 }]}>
              <View style={[adminStyles.metricIcon, { backgroundColor: "#44444418" }]}>
                <Feather name="grid" size={14} color={colors.mutedForeground} />
              </View>
              <Text style={[adminStyles.metricLabel, { color: colors.foreground }]}>Standard Fee</Text>
              {isEditingStd ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <TextInput
                    style={[adminStyles.searchPlaceholder, { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, width: 70, color: colors.foreground }]}
                    value={editing.value}
                    onChangeText={(v) => setEditing({ ...editing, value: v })}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 0.08"
                    placeholderTextColor={colors.mutedForeground}
                  />
                  <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => saveFeeEdit(editing!)} disabled={saving}>
                    <Text style={[adminStyles.smallBtnText, { color: "#FFF" }]}>{saving ? "…" : "Save"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditing(null)}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 6 }} onPress={() => setEditing({ tier, field: "standardFee", value: cfg.standardFee })}>
                  <Text style={[adminStyles.metricValue, { color: color }]}>{pct(cfg.standardFee)}</Text>
                  <Feather name="edit-2" size={13} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* Promotional Fee Row */}
            <View style={[adminStyles.metricRow, { borderColor: colors.border, backgroundColor: colors.background, marginBottom: 6 }]}>
              <View style={[adminStyles.metricIcon, { backgroundColor: "#C9922B18" }]}>
                <Feather name="tag" size={14} color="#C9922B" />
              </View>
              <Text style={[adminStyles.metricLabel, { color: colors.foreground }]}>Promotional Fee</Text>
              {isEditingPro ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <TextInput
                    style={[adminStyles.searchPlaceholder, { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, width: 70, color: colors.foreground }]}
                    value={editing.value}
                    onChangeText={(v) => setEditing({ ...editing, value: v })}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 0.06"
                    placeholderTextColor={colors.mutedForeground}
                  />
                  <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => saveFeeEdit(editing!)} disabled={saving}>
                    <Text style={[adminStyles.smallBtnText, { color: "#FFF" }]}>{saving ? "…" : "Save"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditing(null)}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 6 }} onPress={() => setEditing({ tier, field: "promotionalFee", value: cfg.promotionalFee })}>
                  <Text style={[adminStyles.metricValue, { color: "#C9922B" }]}>{pct(cfg.promotionalFee)}</Text>
                  <Feather name="edit-2" size={13} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* Founding Fee Row */}
            <View style={[adminStyles.metricRow, { borderColor: colors.border, backgroundColor: "#2D7A4F08", marginBottom: 6 }]}>
              <View style={[adminStyles.metricIcon, { backgroundColor: "#2D7A4F18" }]}>
                <Feather name="award" size={14} color="#2D7A4F" />
              </View>
              <Text style={[adminStyles.metricLabel, { color: colors.foreground }]}>Founding Fee</Text>
              {isEditingFound ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <TextInput
                    style={[adminStyles.searchPlaceholder, { borderWidth: 1, borderColor: "#2D7A4F60", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, width: 70, color: colors.foreground }]}
                    value={editing.value}
                    onChangeText={(v) => setEditing({ ...editing, value: v })}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 0.04"
                    placeholderTextColor={colors.mutedForeground}
                  />
                  <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: "#2D7A4F", borderColor: "#2D7A4F" }]} onPress={() => saveFeeEdit(editing!)} disabled={saving}>
                    <Text style={[adminStyles.smallBtnText, { color: "#FFF" }]}>{saving ? "…" : "Save"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditing(null)}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  onPress={() => { setPendingFoundingEdit({ tier, value: cfg.foundingFee }); setShowFoundingWarning(true); }}
                >
                  <Text style={[adminStyles.metricValue, { color: "#2D7A4F" }]}>{pct(cfg.foundingFee)}</Text>
                  <Feather name="lock" size={13} color="#2D7A4F" />
                </TouchableOpacity>
              )}
            </View>

            {/* Promo Toggle */}
            {isEditingPromo ? (
              <View style={[adminStyles.alertBanner, { borderColor: "#C9922B40", backgroundColor: "#C9922B08", flexDirection: "column", alignItems: "flex-start", gap: 8 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Switch
                    value={editing.promoActive ?? false}
                    onValueChange={(v) => setEditing({ ...editing, promoActive: v })}
                    trackColor={{ true: "#2D7A4F", false: colors.border }}
                  />
                  <Text style={[adminStyles.actionLabel, { color: colors.foreground }]}>Promotion Active</Text>
                </View>
                <TextInput
                  style={[adminStyles.searchPlaceholder, { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: colors.foreground, width: "100%" }]}
                  value={editing.promoDescription ?? ""}
                  onChangeText={(v) => setEditing({ ...editing, promoDescription: v })}
                  placeholder="Promotion label (e.g. Launch Week 10% Off)"
                  placeholderTextColor={colors.mutedForeground}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity style={[adminStyles.smallBtn, { backgroundColor: colors.primary, borderColor: colors.primary, flex: 1, justifyContent: "center" }]} onPress={() => saveFeeEdit(editing!)} disabled={saving}>
                    <Text style={[adminStyles.smallBtnText, { color: "#FFF", textAlign: "center" }]}>{saving ? "Saving…" : "Save Promo"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[adminStyles.smallBtn, { borderColor: colors.border }]} onPress={() => setEditing(null)}>
                    <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[adminStyles.alertBanner, { borderColor: cfg.promoActive ? "#2D7A4F40" : colors.border, backgroundColor: cfg.promoActive ? "#2D7A4F08" : colors.background }]}
                onPress={() => setEditing({ tier, field: "promo", value: "", promoActive: cfg.promoActive, promoDescription: cfg.promoDescription ?? "", promoStart: cfg.promoStartDate ?? "", promoEnd: cfg.promoEndDate ?? "" })}
              >
                <Feather name={cfg.promoActive ? "zap" : "zap-off"} size={16} color={cfg.promoActive ? "#2D7A4F" : colors.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Text style={[adminStyles.alertText, { color: cfg.promoActive ? "#2D7A4F" : colors.mutedForeground }]}>
                    {cfg.promoActive ? "Promotion Active" : "No Active Promotion"}
                  </Text>
                  {cfg.promoDescription ? (
                    <Text style={[adminStyles.actionSub, { color: colors.mutedForeground }]}>{cfg.promoDescription}</Text>
                  ) : null}
                </View>
                <Feather name="edit-2" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}

            {saveResult && editing === null && (
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: saveResult === "ok" ? "#2D7A4F" : "#DC2626", marginTop: 6 }}>
                {saveResult === "ok" ? "✓ Saved successfully" : "✗ Save failed — check permissions"}
              </Text>
            )}
          </View>
        );
      })}

      {/* Founding Fee Warning Modal */}
      <Modal visible={showFoundingWarning} transparent animationType="fade" onRequestClose={() => setShowFoundingWarning(false)}>
        <View style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: "#DC262640", width: "100%" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Feather name="alert-triangle" size={20} color="#DC2626" />
              <Text style={[adminStyles.actionLabel, { color: "#DC2626" }]}>Founding Fee Change</Text>
            </View>
            <Text style={[adminStyles.activityText, { color: colors.foreground, marginBottom: 14 }]}>
              Changing the founding fee affects all Founding Businesses whose rate has not yet been individually locked. This action requires super-admin permission and is recorded in the audit log.{"\n\n"}Enter the new rate as a decimal (e.g. 0.04 = 4%):
            </Text>
            <TextInput
              style={[adminStyles.searchPlaceholder, { borderWidth: 1, borderColor: "#DC262640", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: colors.foreground, marginBottom: 12 }]}
              value={pendingFoundingEdit?.value ?? ""}
              onChangeText={(v) => setPendingFoundingEdit((p) => p ? { ...p, value: v } : null)}
              keyboardType="decimal-pad"
              placeholder="e.g. 0.04"
              placeholderTextColor={colors.mutedForeground}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[adminStyles.smallBtn, { flex: 1, justifyContent: "center", backgroundColor: "#DC2626", borderColor: "#DC2626" }]}
                onPress={() => {
                  if (!pendingFoundingEdit) return;
                  setShowFoundingWarning(false);
                  setEditing({ tier: pendingFoundingEdit.tier, field: "foundingFee", value: pendingFoundingEdit.value });
                  void saveFeeEdit({ tier: pendingFoundingEdit.tier, field: "foundingFee", value: pendingFoundingEdit.value });
                }}
                disabled={saving}
              >
                <Text style={[adminStyles.smallBtnText, { color: "#FFF", textAlign: "center" }]}>{saving ? "Saving…" : "Confirm Change"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adminStyles.smallBtn, { borderColor: colors.border }]} onPress={() => { setShowFoundingWarning(false); setPendingFoundingEdit(null); }}>
                <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SectionLabel title="Per-Business Fee Audit" />
      <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[adminStyles.activityText, { color: colors.mutedForeground }]}>
          To audit or override a specific business's fee (tier, lock, promotion eligibility), navigate to the Businesses tab, open the business record, and use the Marketplace Profile section.
        </Text>
      </View>
    </ScrollView>
  );
}

interface AdminCaptionRow {
  businessId: string;
  businessName: string | null;
  caption: string;
  count: number;
}

function useAdminCaptions() {
  const [captions, setCaptions] = React.useState<AdminCaptionRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/admin/captions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setCaptions(data.captions ?? []);
    } catch {
      setCaptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const removeCaption = React.useCallback(async (businessId: string, caption: string) => {
    setCaptions((prev) => prev.filter((c) => !(c.businessId === businessId && c.caption === caption)));
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/admin/captions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ businessId, caption }),
      });
    } catch {
      load();
    }
  }, [load]);

  return { captions, loading, refetch: load, removeCaption };
}

function CaptionsTab() {
  const colors = useColors();
  const { captions, loading, refetch, removeCaption } = useAdminCaptions();
  const [confirmRemove, setConfirmRemove] = React.useState<{ businessId: string; caption: string } | null>(null);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      <SectionLabel title="Community Captions" />
      <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
        <Text style={[adminStyles.activityText, { color: colors.mutedForeground }]}>
          Community-submitted captions ranked by votes. Remove any that are inappropriate or off-brand.
        </Text>
      </View>

      {loading && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginTop: 10 }]}>Loading captions…</Text>
        </View>
      )}

      {!loading && captions.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Feather name="message-circle" size={32} color={colors.muted} />
          <Text style={[adminStyles.bizName, { color: colors.mutedForeground, marginTop: 10 }]}>No community captions yet</Text>
        </View>
      )}

      {captions.map((c, i) => (
        <View key={i} style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={[adminStyles.bizName, { color: colors.foreground }]} numberOfLines={2}>"{c.caption}"</Text>
              <Text style={[adminStyles.bizCity, { color: colors.primary, marginTop: 2 }]} numberOfLines={1}>
                {c.businessName ?? c.businessId}
              </Text>
            </View>
            <View style={[adminStyles.statusBadge, { backgroundColor: "#2D7A4F18", marginLeft: 8 }]}>
              <Text style={[adminStyles.statusBadgeText, { color: "#2D7A4F" }]}>
                {c.count} {c.count === 1 ? "vote" : "votes"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630", alignSelf: "flex-end", marginTop: 6 }]}
            onPress={() => setConfirmRemove({ businessId: c.businessId, caption: c.caption })}
          >
            <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Remove All Votes</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Modal visible={confirmRemove !== null} transparent animationType="fade" onRequestClose={() => setConfirmRemove(null)}>
        <View style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: "#DC262640", width: "100%" }]}>
            <Text style={[adminStyles.actionLabel, { color: colors.foreground, marginBottom: 8 }]}>Remove Caption?</Text>
            <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginBottom: 6 }]}>
              This removes all community votes for:
            </Text>
            <Text style={[adminStyles.bizName, { color: colors.foreground, fontStyle: "italic", marginBottom: 16 }]}>
              "{confirmRemove?.caption}"
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[adminStyles.smallBtn, { flex: 1, justifyContent: "center", backgroundColor: "#DC2626", borderColor: "#DC2626" }]}
                onPress={() => {
                  if (confirmRemove) removeCaption(confirmRemove.businessId, confirmRemove.caption);
                  setConfirmRemove(null);
                }}
              >
                <Text style={[adminStyles.smallBtnText, { color: "#FFF", textAlign: "center" }]}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adminStyles.smallBtn, { borderColor: colors.border }]} onPress={() => setConfirmRemove(null)}>
                <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

interface ContentReport {
  id: string;
  reporterUserId: string | null;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  details: string | null;
  createdAt: string;
}

function useContentReports() {
  const [reports, setReports] = React.useState<ContentReport[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/admin/content-reports`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setReports(data.reports ?? []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const updateStatus = React.useCallback(async (id: string, status: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/admin/content-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status }),
      });
    } catch {
      load();
    }
  }, [load]);

  return { reports, loading, refetch: load, updateStatus };
}

function ContentReportsTab() {
  const colors = useColors();
  const { reports, loading, updateStatus } = useContentReports();
  const pending = reports.filter((r) => r.status === "pending");
  const resolved = reports.filter((r) => r.status !== "pending");

  const statusColor = (s: string) => {
    if (s === "actioned") return "#DC2626";
    if (s === "dismissed") return colors.mutedForeground;
    if (s === "reviewed") return "#2D7A4F";
    return "#C9922B";
  };

  function ReportCard({ r }: { r: ContentReport }) {
    const isPending = r.status === "pending";
    return (
      <View style={[adminStyles.reportCard, { backgroundColor: colors.card, borderColor: isPending ? "#C9922B40" : colors.border, marginBottom: 10 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <View style={[adminStyles.statusBadge, { backgroundColor: statusColor(r.status) + "18" }]}>
            <Text style={[adminStyles.statusBadgeText, { color: statusColor(r.status) }]}>{r.status}</Text>
          </View>
          <View style={[adminStyles.statusBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[adminStyles.statusBadgeText, { color: colors.mutedForeground }]}>{r.targetType}</Text>
          </View>
        </View>
        <Text style={[adminStyles.bizName, { color: colors.foreground, marginBottom: 2 }]}>{r.reason}</Text>
        {r.details ? (
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginBottom: 8 }]} numberOfLines={2}>{r.details}</Text>
        ) : null}
        <Text style={[adminStyles.scoreText, { color: colors.mutedForeground, marginBottom: isPending ? 10 : 0 }]}>
          {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </Text>
        {isPending && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[adminStyles.smallBtn, { backgroundColor: "#DC262618", borderColor: "#DC262630" }]}
              onPress={() => updateStatus(r.id, "actioned")}
            >
              <Text style={[adminStyles.smallBtnText, { color: "#DC2626" }]}>Action</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[adminStyles.smallBtn, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F30" }]}
              onPress={() => updateStatus(r.id, "dismissed")}
            >
              <Text style={[adminStyles.smallBtnText, { color: "#2D7A4F" }]}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[adminStyles.smallBtn, { borderColor: colors.border }]}
              onPress={() => updateStatus(r.id, "reviewed")}
            >
              <Text style={[adminStyles.smallBtnText, { color: colors.foreground }]}>Mark Reviewed</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adminStyles.tabContent}>
      {loading && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[adminStyles.bizCity, { color: colors.mutedForeground, marginTop: 10 }]}>Loading reports…</Text>
        </View>
      )}
      {!loading && reports.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Feather name="check-circle" size={32} color={colors.muted} />
          <Text style={[adminStyles.bizName, { color: colors.mutedForeground, marginTop: 10 }]}>No content reports</Text>
        </View>
      )}
      {pending.length > 0 && (
        <>
          <SectionLabel title={`Pending (${pending.length})`} />
          {pending.map((r) => <ReportCard key={r.id} r={r} />)}
        </>
      )}
      {resolved.length > 0 && (
        <>
          <SectionLabel title="Resolved" />
          {resolved.map((r) => <ReportCard key={r.id} r={r} />)}
        </>
      )}
    </ScrollView>
  );
}

function TopicsTab() {
  const colors = useColors();
  const [topics, setTopics] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedingIssues, setSeedingIssues] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [issueSearch, setIssueSearch] = useState("");
  const [activeSection, setActiveSection] = useState<"topics" | "issues">("topics");
  const [seedResult, setSeedResult] = useState<string>("");
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("community_culture");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [newIssueName, setNewIssueName] = useState("");
  const [newIssueDesc, setNewIssueDesc] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadTopics() {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const [tr, ir] = await Promise.all([
        fetch(`${getApiBase()}/api/admin/topics`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBase()}/api/admin/topics/issues`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (tr.ok) { const d = await tr.json(); setTopics(d.topics ?? []); }
      if (ir.ok) { const d = await ir.json(); setIssues(d.issues ?? []); }
    } catch { /* silent */ } finally { setLoading(false); }
  }

  useEffect(() => { loadTopics(); }, []);

  async function seedTopics() {
    setSeeding(true);
    setSeedResult("");
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/admin/topics/seed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setSeedResult(`✓ ${d.inserted} topics added, ${d.skipped} already existed.`);
        await loadTopics();
      } else {
        setSeedResult("Seed failed.");
      }
    } catch { setSeedResult("Network error."); } finally { setSeeding(false); }
  }

  async function seedIssues() {
    setSeedingIssues(true);
    setSeedResult("");
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/admin/topics/issues/seed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setSeedResult(`✓ ${d.inserted} issues added, ${d.skipped} already existed.`);
        await loadTopics();
      } else {
        setSeedResult("Seed failed.");
      }
    } catch { setSeedResult("Network error."); } finally { setSeedingIssues(false); }
  }

  async function toggleTopicEnabled(id: string, enabled: boolean) {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/admin/topics/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      setTopics((prev) => prev.map((t) => t.id === id ? { ...t, enabled } : t));
    } catch { /* silent */ }
  }

  async function toggleIssueActive(id: string, isActive: boolean) {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`${getApiBase()}/api/admin/topics/issues/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setIssues((prev) => prev.map((i) => i.id === id ? { ...i, isActive } : i));
    } catch { /* silent */ }
  }

  async function createTopic() {
    if (!newTopicName.trim()) return;
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/admin/topics`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ topicName: newTopicName, category: newTopicCategory, description: newTopicDesc }),
      });
      if (res.ok) {
        setNewTopicName(""); setNewTopicDesc(""); setShowAddTopic(false);
        await loadTopics();
      }
    } catch { /* silent */ } finally { setSaving(false); }
  }

  async function createIssue() {
    if (!newIssueName.trim()) return;
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/admin/topics/issues`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newIssueName, description: newIssueDesc }),
      });
      if (res.ok) {
        setNewIssueName(""); setNewIssueDesc(""); setShowAddIssue(false);
        await loadTopics();
      }
    } catch { /* silent */ } finally { setSaving(false); }
  }

  const filteredTopics = topics.filter((t) => !topicSearch || t.topicName.toLowerCase().includes(topicSearch.toLowerCase()) || t.category.toLowerCase().includes(topicSearch.toLowerCase()));
  const filteredIssues = issues.filter((i) => !issueSearch || i.name.toLowerCase().includes(issueSearch.toLowerCase()));

  const PRIORITY_COLORS: Record<string, string> = { breaking: "#DC2626", standard: "#2563EB", digest: "#16A34A", immediate: "#D97706" };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border, padding: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>Topic Library Console</Text>
        <Text style={[{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }]}>
          {topics.length} topics · {topics.filter((t) => t.enabled).length} enabled · {issues.length} issues
        </Text>
      </View>

      {/* Section switcher */}
      <View style={{ flexDirection: "row", padding: 12, gap: 8 }}>
        <TouchableOpacity
          style={[{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" }, { borderColor: activeSection === "topics" ? colors.primary : colors.border, backgroundColor: activeSection === "topics" ? colors.primary + "15" : colors.card }]}
          onPress={() => setActiveSection("topics")}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: activeSection === "topics" ? colors.primary : colors.mutedForeground }}>Topics ({topics.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" }, { borderColor: activeSection === "issues" ? "#3B82F6" : colors.border, backgroundColor: activeSection === "issues" ? "#3B82F615" : colors.card }]}
          onPress={() => setActiveSection("issues")}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: activeSection === "issues" ? "#3B82F6" : colors.mutedForeground }}>Issues ({issues.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Seed banner */}
      {seedResult.length > 0 && (
        <View style={{ marginHorizontal: 12, marginBottom: 8, padding: 10, borderRadius: 10, backgroundColor: "#16A34A15", borderWidth: 1, borderColor: "#16A34A30" }}>
          <Text style={{ fontSize: 13, color: "#16A34A", fontWeight: "700" }}>{seedResult}</Text>
        </View>
      )}

      {activeSection === "topics" ? (
        <>
          {/* Topic Actions */}
          <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 12, marginBottom: 8 }}>
            <TouchableOpacity
              style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: "#CA922B15", borderWidth: 1, borderColor: "#CA922B30", alignItems: "center" }}
              onPress={seedTopics}
              disabled={seeding}
            >
              {seeding ? <ActivityIndicator size="small" color="#CA922B" /> : <Text style={{ fontSize: 12, fontWeight: "700", color: "#CA922B" }}>⚡ Seed All Topics</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: colors.primary + "15", borderWidth: 1, borderColor: colors.primary + "30", alignItems: "center" }}
              onPress={() => setShowAddTopic(true)}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>+ Add Topic</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, margin: 12, marginTop: 0 }, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={14} color={colors.mutedForeground} />
            <TextInput style={{ flex: 1, fontSize: 13, color: colors.foreground }} placeholder="Search topics…" placeholderTextColor={colors.mutedForeground} value={topicSearch} onChangeText={setTopicSearch} />
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            filteredTopics.map((t) => (
              <View key={t.id} style={[{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1 }, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>{t.topicName}</Text>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: (PRIORITY_COLORS[t.notificationPriority] ?? "#6B7280") + "20" }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: PRIORITY_COLORS[t.notificationPriority] ?? "#6B7280" }}>{t.notificationPriority}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>{t.category} · {t.followCount ?? 0} followers</Text>
                </View>
                <TouchableOpacity
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: t.enabled ? "#16A34A" : colors.border, backgroundColor: t.enabled ? "#16A34A15" : "transparent" }}
                  onPress={() => toggleTopicEnabled(t.id, !t.enabled)}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: t.enabled ? "#16A34A" : colors.mutedForeground }}>{t.enabled ? "Active" : "Off"}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Add Topic Modal */}
          <Modal visible={showAddTopic} animationType="slide" presentationStyle="pageSheet">
            <View style={[{ flex: 1, padding: 20 }, { backgroundColor: colors.background }]}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, marginBottom: 16 }}>Add New Topic</Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 4 }}>Topic Name</Text>
              <TextInput style={[{ borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 14 }, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={newTopicName} onChangeText={setNewTopicName} placeholder="e.g., Black Mental Health" placeholderTextColor={colors.mutedForeground} />
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 4 }}>Category</Text>
              <TextInput style={[{ borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 14 }, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={newTopicCategory} onChangeText={setNewTopicCategory} placeholder="e.g., health" placeholderTextColor={colors.mutedForeground} />
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 4 }}>Description</Text>
              <TextInput style={[{ borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20, fontSize: 14, height: 80, textAlignVertical: "top" }, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={newTopicDesc} onChangeText={setNewTopicDesc} placeholder="Brief description…" placeholderTextColor={colors.mutedForeground} multiline />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center" }} onPress={() => setShowAddTopic(false)}>
                  <Text style={{ color: colors.mutedForeground, fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 2, padding: 12, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center" }} onPress={createTopic} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Create Topic</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <>
          {/* Issues Actions */}
          <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 12, marginBottom: 8 }}>
            <TouchableOpacity
              style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: "#3B82F615", borderWidth: 1, borderColor: "#3B82F630", alignItems: "center" }}
              onPress={seedIssues}
              disabled={seedingIssues}
            >
              {seedingIssues ? <ActivityIndicator size="small" color="#3B82F6" /> : <Text style={{ fontSize: 12, fontWeight: "700", color: "#3B82F6" }}>⚡ Seed All Issues</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: "#3B82F615", borderWidth: 1, borderColor: "#3B82F630", alignItems: "center" }}
              onPress={() => setShowAddIssue(true)}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#3B82F6" }}>+ Add Issue</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, margin: 12, marginTop: 0 }, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={14} color={colors.mutedForeground} />
            <TextInput style={{ flex: 1, fontSize: 13, color: colors.foreground }} placeholder="Search issues…" placeholderTextColor={colors.mutedForeground} value={issueSearch} onChangeText={setIssueSearch} />
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}><ActivityIndicator size="large" color="#3B82F6" /></View>
          ) : filteredIssues.length === 0 ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>📌</Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: "center" }}>No issues yet. Tap "Seed All Issues" to populate the default list.</Text>
            </View>
          ) : (
            filteredIssues.map((issue) => (
              <View key={issue.id} style={[{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1 }, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>{issue.name}</Text>
                  {issue.description && <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }} numberOfLines={2}>{issue.description}</Text>}
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 2 }}>{issue.followCount ?? 0} followers</Text>
                </View>
                <TouchableOpacity
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: issue.isActive ? "#16A34A" : colors.border, backgroundColor: issue.isActive ? "#16A34A15" : "transparent" }}
                  onPress={() => toggleIssueActive(issue.id, !issue.isActive)}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: issue.isActive ? "#16A34A" : colors.mutedForeground }}>{issue.isActive ? "Active" : "Off"}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Add Issue Modal */}
          <Modal visible={showAddIssue} animationType="slide" presentationStyle="pageSheet">
            <View style={[{ flex: 1, padding: 20 }, { backgroundColor: colors.background }]}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, marginBottom: 16 }}>Add New Issue</Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 4 }}>Issue Name</Text>
              <TextInput style={[{ borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 14 }, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={newIssueName} onChangeText={setNewIssueName} placeholder="e.g., Affordable Housing Crisis" placeholderTextColor={colors.mutedForeground} />
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 4 }}>Description</Text>
              <TextInput style={[{ borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20, fontSize: 14, height: 80, textAlignVertical: "top" }, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={newIssueDesc} onChangeText={setNewIssueDesc} placeholder="What should users watch for?" placeholderTextColor={colors.mutedForeground} multiline />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center" }} onPress={() => setShowAddIssue(false)}>
                  <Text style={{ color: colors.mutedForeground, fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 2, padding: 12, borderRadius: 10, backgroundColor: "#3B82F6", alignItems: "center" }} onPress={createIssue} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Create Issue</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const TAB_COMPONENTS: Record<string, React.FC> = {
  overview: OverviewTab,
  invites: InvitesTab,
  reports: ReportsTab,
  reviews: ReviewsTab,
  "content-reports": ContentReportsTab,
  captions: CaptionsTab,
  claims: ClaimsTab,
  submissions: SubmissionsTab,
  referrals: ReferralsTab,
  analytics: AnalyticsTab,
  email: EmailTab,
  surveys: SurveysTab,
  users: UsersTab,
  marketplace: MarketplaceTab,
  topics: TopicsTab,
  settings: SettingsTab,
};

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const TabContent = TAB_COMPONENTS[activeTab] ?? OverviewTab;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Admin Panel</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Mapping With Melanin™</Text>
        </View>
        <View style={[styles.adminBadge, { backgroundColor: "#DC262618", borderColor: "#DC262640" }]}>
          <Feather name="shield" size={13} color="#DC2626" />
          <Text style={[styles.adminBadgeText, { color: "#DC2626" }]}>Admin</Text>
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
      >
        {ADMIN_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabPill,
                {
                  backgroundColor: active ? colors.primary : "transparent",
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
              activeOpacity={0.8}
            >
              <Feather name={tab.icon} size={13} color={active ? "#FFFFFF" : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: active ? "#FFFFFF" : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab content */}
      <View style={[styles.content, { paddingBottom: bottomPad }]}>
        <AdminNavContext.Provider value={setActiveTab}>
          <TabContent />
        </AdminNavContext.Provider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  adminBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  tabBar: { borderBottomWidth: 1, maxHeight: 56 },
  tabPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginVertical: 10, flexShrink: 0 },
  tabLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  content: { flex: 1 },
});

const adminStyles = StyleSheet.create({
  tabContent: { padding: 16, gap: 10, paddingBottom: 60 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 6 },
  statCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    gap: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 24 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statSub: { fontFamily: "Inter_500Medium", fontSize: 11 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 8, marginBottom: 4 },
  activityRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  activityIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  activityText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  activityTime: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 0 },
  actionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  actionSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, minWidth: 22, alignItems: "center" },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#FFFFFF" },
  bizRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  bizAvatar: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bizAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  bizName: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 2 },
  bizCity: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  scoreText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  searchBarInline: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  searchPlaceholder: { fontFamily: "Inter_400Regular", fontSize: 14 },
  reportCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  smallBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  alertText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  analyticsCard: { borderRadius: 18, padding: 18, gap: 6, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2, marginBottom: 4 },
  analyticsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  analyticsValue: { fontFamily: "Inter_700Bold", fontSize: 36 },
  analyticsSub: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 8 },
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 10, height: 110, paddingTop: 14 },
  barCol: { flex: 1, alignItems: "center", gap: 6 },
  bar: { width: "100%", borderRadius: 6, minHeight: 6 },
  barLabel: { fontFamily: "Inter_500Medium", fontSize: 11 },
  metricRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  metricIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  metricLabel: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13 },
  metricValue: { fontFamily: "Inter_700Bold", fontSize: 15 },
  surveyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    gap: 4,
  },
  surveyTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  surveyTypeBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  surveyBiz: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 13 },
  surveyCity: { fontFamily: "Inter_400Regular", fontSize: 12 },
  surveyTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  surveyStars: { flexDirection: "row", gap: 2, marginVertical: 2 },
  surveySummary: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
});
