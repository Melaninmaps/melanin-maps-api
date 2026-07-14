import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function authFetch(path: string, opts?: RequestInit): Promise<Response> {
  const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts?.headers as Record<string, string> ?? {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${getApiBase()}${path}`, { ...opts, headers, credentials: Platform.OS === "web" ? "include" : "omit" });
}

interface Permissions {
  canViewTrips: boolean;
  shareLocation: boolean;
  emergencyContact: boolean;
  sosNotifications: boolean;
  safetyAlerts: boolean;
  approveFriendRequests: boolean;
  messagingEnabled: boolean;
  contentFilter: "none" | "mild" | "strict";
}

interface Member {
  id: string;
  userId: string | null;
  inviteEmail: string | null;
  displayName: string | null;
  role: "owner" | "member";
  status: "pending" | "accepted" | "removed";
  permissions: Permissions;
  joinedAt: string | null;
  invitedAt: string;
}

interface Circle {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
}

const PERMISSION_LABELS: { key: keyof Omit<Permissions, "contentFilter">; label: string; sub: string; icon: string }[] = [
  { key: "canViewTrips", label: "View Planned Trips", sub: "Share itineraries & saved places", icon: "map" },
  { key: "shareLocation", label: "Share Live Location", sub: "Only active during a trip", icon: "navigation" },
  { key: "emergencyContact", label: "Emergency Contact", sub: "Listed as an emergency contact", icon: "phone" },
  { key: "sosNotifications", label: "SOS Notifications", sub: "Receive alerts if they trigger SOS", icon: "alert-triangle" },
  { key: "safetyAlerts", label: "Safety Alerts", sub: "Get alerts for their saved cities", icon: "shield" },
  { key: "approveFriendRequests", label: "Approve Friend Requests", sub: "For younger family members", icon: "user-check" },
  { key: "messagingEnabled", label: "Allow Messaging", sub: "In-app direct messages", icon: "message-circle" },
];

export default function FamilyCircleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [loading, setLoading] = useState(true);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<"owner" | "member" | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [circleName, setCircleName] = useState("My Family");
  const [creating, setCreating] = useState(false);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplay, setInviteDisplay] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const res = await authFetch("/api/family/circle");
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setCircle(data.circle);
      setMembers((data.members ?? []).filter((m: Member) => m.status !== "removed"));
      setMyRole(data.role);
      if (data.circle) setInviteCode(data.circle.inviteCode);
    } catch { /* keep empty state */ }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const createCircle = async () => {
    if (!circleName.trim()) return;
    setCreating(true);
    try {
      const res = await authFetch("/api/family/circle", {
        method: "POST",
        body: JSON.stringify({ name: circleName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert("Error", data.error ?? "Could not create circle"); return; }
      setCircle(data.circle);
      setInviteCode(data.circle.inviteCode);
      setMyRole("owner");
      setShowCreateForm(false);
    } catch { Alert.alert("Error", "Something went wrong. Please try again."); }
    setCreating(false);
  };

  const sendInvite = async () => {
    setInviting(true);
    try {
      const res = await authFetch("/api/family/circle/invite", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim() || undefined, displayName: inviteDisplay.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert("Error", data.error ?? "Could not send invite"); setInviting(false); return; }
      setInviteEmail("");
      setInviteDisplay("");
      setShowInviteForm(false);
      await load();
      const link = `https://mappingwithmelanin.com/family/join/${data.inviteCode}`;
      Share.share({ message: `Join my Family Circle on Mapping With Melanin: ${link}` }).catch(() => {});
    } catch { Alert.alert("Error", "Something went wrong."); }
    setInviting(false);
  };

  const removeMember = (memberId: string) => {
    Alert.alert("Remove member?", "They will lose access to the family circle.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          await authFetch(`/api/family/circle/members/${memberId}`, { method: "DELETE" });
          await load();
        },
      },
    ]);
  };

  const togglePermission = async (memberId: string, key: keyof Omit<Permissions, "contentFilter">, value: boolean) => {
    setMembers((ms) => ms.map((m) => m.id === memberId ? { ...m, permissions: { ...m.permissions, [key]: value } } : m));
    await authFetch(`/api/family/circle/members/${memberId}/permissions`, {
      method: "PATCH",
      body: JSON.stringify({ [key]: value }),
    });
  };

  const leaveCircle = () => {
    Alert.alert("Leave Family Circle?", "You will lose access to shared content.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave", style: "destructive", onPress: async () => {
          await authFetch("/api/family/circle/leave", { method: "POST" });
          setCircle(null); setMembers([]); setMyRole(null);
        },
      },
    ]);
  };

  const copyInviteCode = () => {
    if (!inviteCode) return;
    const link = `https://mappingwithmelanin.com/family/join/${inviteCode}`;
    Clipboard.setStringAsync(link);
    Alert.alert("Copied!", "Invite link copied to clipboard.");
  };

  const shareInvite = () => {
    if (!inviteCode) return;
    const link = `https://mappingwithmelanin.com/family/join/${inviteCode}`;
    Share.share({ message: `Join my Family Circle on Mapping With Melanin! 👨‍👩‍👧 ${link}` }).catch(() => {});
  };

  if (!isAuthenticated) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={22} color={colors.foreground} /></TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Family Circle</Text>
        </View>
        <View style={s.centerMsg}>
          <Feather name="users" size={40} color={colors.primary} />
          <Text style={[s.centerTitle, { color: colors.foreground }]}>Sign in to access Family Circle</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={s.back}><Feather name="arrow-left" size={22} color={colors.foreground} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Family Circle</Text>
          {circle && <Text style={[s.headerSub, { color: colors.mutedForeground }]}>{circle.name}</Text>}
        </View>
        {myRole === "owner" && circle && (
          <TouchableOpacity activeOpacity={0.85} style={[s.inviteBtn, { backgroundColor: colors.primary }]} onPress={() => setShowInviteForm(true)}>
            <Feather name="user-plus" size={14} color="#fff" />
            <Text style={s.inviteBtnText}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.centerMsg}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : !circle ? (
        /* ── No circle yet ── */
        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {/* Hero */}
          <View style={[s.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.heroIconWrap, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="users" size={36} color={colors.primary} />
            </View>
            <Text style={[s.heroTitle, { color: colors.foreground }]}>Family Profiles</Text>
            <Text style={[s.heroSub, { color: colors.mutedForeground }]}>
              Because safety doesn't stop when your children grow up.{"\n\n"}Invite family members — children, siblings, grandparents, caregivers — at no additional cost. Each person gets their own profile, saved places, and personalized recommendations while staying safely connected to you.
            </Text>
          </View>

          {/* Benefits */}
          <View style={[s.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { icon: "user", text: "Each member gets their own profile & saved places" },
              { icon: "shield", text: "Optional safety controls — you set the level" },
              { icon: "navigation", text: "Live location sharing (only when enabled)" },
              { icon: "alert-triangle", text: "SOS notifications & emergency contacts" },
              { icon: "map", text: "View shared trip itineraries" },
              { icon: "dollar-sign", text: "No extra cost for family members" },
            ].map((b) => (
              <View key={b.text} style={s.benefitRow}>
                <View style={[s.benefitIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name={b.icon as any} size={14} color={colors.primary} />
                </View>
                <Text style={[s.benefitText, { color: colors.foreground }]}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* Create form */}
          {!showCreateForm ? (
            <TouchableOpacity activeOpacity={0.85} style={[s.createBtn, { backgroundColor: colors.primary }]} onPress={() => setShowCreateForm(true)}>
              <Feather name="plus" size={18} color="#fff" />
              <Text style={s.createBtnText}>Create Your Family Circle</Text>
            </TouchableOpacity>
          ) : (
            <View style={[s.createForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.formLabel, { color: colors.foreground }]}>Give your circle a name</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                value={circleName}
                onChangeText={setCircleName}
                placeholder="e.g. The Mitchell Family"
                placeholderTextColor={colors.mutedForeground}
                maxLength={100}
              />
              <TouchableOpacity activeOpacity={0.85} style={[s.createBtn, { backgroundColor: colors.primary }]} onPress={createCircle} disabled={creating}>
                {creating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.createBtnText}>Create Circle</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Join existing circle */}
          <View style={{ marginTop: 16 }}>
            <Text style={[s.joinLabel, { color: colors.mutedForeground }]}>Have an invite code?</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 8 }]}
              placeholder="Paste invite link or code"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              onSubmitEditing={async (e) => {
                const val = e.nativeEvent.text.trim();
                const code = val.split("/").pop()?.toUpperCase() ?? val.toUpperCase();
                const res = await authFetch(`/api/family/join/${code}`, { method: "POST" });
                if (res.ok) { await load(); }
                else { const d = await res.json(); Alert.alert("Error", d.error ?? "Could not join"); }
              }}
            />
          </View>
        </ScrollView>
      ) : (
        /* ── Has circle ── */
        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Invite code banner */}
          {myRole === "owner" && (
            <View style={[s.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.codeLabel, { color: colors.mutedForeground }]}>Your invite code</Text>
                <Text style={[s.codeValue, { color: colors.primary }]}>{inviteCode}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.85} style={[s.codeBtn, { borderColor: colors.border }]} onPress={copyInviteCode}>
                <Feather name="copy" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} style={[s.codeBtn, { borderColor: colors.border, marginLeft: 8 }]} onPress={shareInvite}>
                <Feather name="share-2" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Members */}
          <Text style={[s.sectionHead, { color: colors.mutedForeground }]}>FAMILY MEMBERS</Text>
          <View style={[s.membersCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Owner row */}
            <View style={s.memberRow}>
              <View style={[s.memberAvatar, { backgroundColor: colors.primary }]}>
                <Feather name="star" size={14} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.memberName, { color: colors.foreground }]}>
                  {myRole === "owner" ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "You" : "Circle Owner"}
                </Text>
                <Text style={[s.memberRole, { color: colors.primary }]}>Account Owner</Text>
              </View>
              <View style={[s.statusPill, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[s.statusText, { color: colors.primary }]}>Owner</Text>
              </View>
            </View>

            {members.filter(m => m.role !== "owner").map((m, i) => (
              <View key={m.id}>
                <View style={[s.memberRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={[s.memberAvatar, { backgroundColor: m.status === "pending" ? colors.mutedForeground + "40" : "#2D7A4F" }]}>
                    <Feather name={m.status === "pending" ? "clock" : "user"} size={14} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.memberName, { color: colors.foreground }]}>
                      {m.displayName ?? m.inviteEmail ?? "Invited member"}
                    </Text>
                    <Text style={[s.memberRole, { color: colors.mutedForeground }]}>
                      {m.status === "pending" ? "Invite pending" : `Joined ${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : ""}`}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <View style={[s.statusPill, { backgroundColor: m.status === "pending" ? "#A87A40" + "30" : "#2D7A4F" + "20" }]}>
                      <Text style={[s.statusText, { color: m.status === "pending" ? "#A87A40" : "#2D7A4F" }]}>
                        {m.status === "pending" ? "Pending" : "Active"}
                      </Text>
                    </View>
                    {myRole === "owner" && (
                      <TouchableOpacity activeOpacity={0.85} onPress={() => setExpandedMember(expandedMember === m.id ? null : m.id)}>
                        <Feather name={expandedMember === m.id ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Permission toggles */}
                {myRole === "owner" && expandedMember === m.id && m.status === "accepted" && (
                  <View style={[s.permissionsPanel, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    <Text style={[s.permissionsHead, { color: colors.mutedForeground }]}>OPTIONAL CONTROLS</Text>
                    {PERMISSION_LABELS.map((p) => (
                      <View key={p.key} style={[s.permRow, { borderBottomColor: colors.border }]}>
                        <View style={[s.permIcon, { backgroundColor: colors.primary + "15" }]}>
                          <Feather name={p.icon as any} size={13} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.permLabel, { color: colors.foreground }]}>{p.label}</Text>
                          <Text style={[s.permSub, { color: colors.mutedForeground }]}>{p.sub}</Text>
                        </View>
                        <Switch
                          value={m.permissions[p.key]}
                          onValueChange={(val) => togglePermission(m.id, p.key, val)}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor="#fff"
                        />
                      </View>
                    ))}
                    <TouchableOpacity activeOpacity={0.85} style={[s.removeBtn, { borderColor: "#DC2626" + "40" }]} onPress={() => removeMember(m.id)}>
                      <Feather name="user-x" size={14} color="#DC2626" />
                      <Text style={s.removeBtnText}>Remove from Circle</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {members.filter(m => m.role !== "owner").length === 0 && (
              <View style={s.emptyMembers}>
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                  No members yet. Tap "Invite" to add your first family member.
                </Text>
              </View>
            )}
          </View>

          {/* Travel with confidence marketing tagline */}
          <View style={[s.taglineCard, { backgroundColor: "#CA922B" }]}>
            <Text style={s.taglineEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={s.taglineTitle}>Travel with confidence — together.</Text>
            <Text style={s.taglineSub}>Whether they're heading to college, exploring a new city, or moving into their first apartment — your family stays connected.</Text>
          </View>

          {myRole === "member" && (
            <TouchableOpacity activeOpacity={0.85} style={[s.leaveBtn, { borderColor: "#DC2626" + "40" }]} onPress={leaveCircle}>
              <Feather name="log-out" size={15} color="#DC2626" />
              <Text style={s.leaveBtnText}>Leave Family Circle</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Invite form overlay */}
      {showInviteForm && (
        <View style={[s.inviteOverlay, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={[s.inviteHandle, { backgroundColor: colors.border }]} />
          <Text style={[s.inviteTitle, { color: colors.foreground }]}>Invite a Family Member</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Their name (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={inviteDisplay}
            onChangeText={setInviteDisplay}
          />
          <TextInput
            style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 10 }]}
            placeholder="Email address (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={[s.inviteHint, { color: colors.mutedForeground }]}>
            We'll generate a shareable invite link. You can text, email, or share it however works best.
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity activeOpacity={0.85} style={[s.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowInviteForm(false)}>
              <Text style={[s.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[s.sendInviteBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={sendInvite} disabled={inviting}>
              {inviting ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Feather name="send" size={15} color="#fff" />
                  <Text style={s.sendInviteBtnText}>Generate Invite</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  back: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  inviteBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  inviteBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  centerMsg: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  centerTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", marginBottom: 16 },
  heroIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  heroSub: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  benefitsCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 20, gap: 12 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  benefitIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  benefitText: { flex: 1, fontSize: 13 },
  createBtn: { borderRadius: 16, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  createBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  createForm: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 20, gap: 12 },
  formLabel: { fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  joinLabel: { fontSize: 13, fontWeight: "600" },
  codeCard: { flexDirection: "row", alignItems: "center", margin: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  codeLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  codeValue: { fontSize: 22, fontWeight: "800", letterSpacing: 2 },
  codeBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  sectionHead: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginHorizontal: 20, marginBottom: 8, marginTop: 4 },
  membersCard: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  memberRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  memberAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  memberName: { fontSize: 14, fontWeight: "600" },
  memberRole: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  permissionsPanel: { padding: 14, borderTopWidth: 1 },
  permissionsHead: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginBottom: 10 },
  permRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  permIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  permLabel: { fontSize: 13, fontWeight: "600" },
  permSub: { fontSize: 11, marginTop: 1 },
  removeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 10, marginTop: 14 },
  removeBtnText: { color: "#DC2626", fontSize: 13, fontWeight: "700" },
  emptyMembers: { padding: 20, alignItems: "center" },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  taglineCard: { margin: 16, borderRadius: 20, padding: 20, marginTop: 16 },
  taglineEmoji: { fontSize: 28, marginBottom: 8 },
  taglineTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 6 },
  taglineSub: { color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 20 },
  leaveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 16, paddingVertical: 12, marginHorizontal: 16, marginTop: 8 },
  leaveBtnText: { color: "#DC2626", fontSize: 14, fontWeight: "700" },
  inviteOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  inviteHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  inviteTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  inviteHint: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  cancelBtn: { flex: 0.4, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  sendInviteBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  sendInviteBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
