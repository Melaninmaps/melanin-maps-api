import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { useAuth } from "@/lib/auth";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

type FamilyLink = {
  id: number;
  parentUserId: string;
  childUserId: string | null;
  childEmail: string | null;
  status: string;
  createdAt: string;
  childFirstName: string | null;
  childLastName: string | null;
};

type Violation = {
  id: number;
  childUserId: string;
  channel: string;
  contentSnippet: string;
  matchedKeywords: string[];
  wasBlocked: boolean;
  createdAt: string;
};

export default function FamilySafetyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [links, setLinks] = useState<FamilyLink[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [childEmail, setChildEmail] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [expandedLinkId, setExpandedLinkId] = useState<number | null>(null);
  const [keywordInputs, setKeywordInputs] = useState<Record<number, string>>({});
  const [savedKeywords, setSavedKeywords] = useState<Record<number, string[]>>({});
  const [savingKeywords, setSavingKeywords] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<"controls" | "violations">("controls");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const [linksRes, violationsRes] = await Promise.all([
        fetch(`${getApiBase()}/api/family/links`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBase()}/api/family/violations`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (linksRes.ok) {
        const d = await linksRes.json() as { links: FamilyLink[] };
        setLinks(d.links ?? []);
        for (const link of (d.links ?? [])) {
          if (link.parentUserId === user?.id) {
            void fetchKeywords(link.id);
          }
        }
      }
      if (violationsRes.ok) {
        const d = await violationsRes.json() as { violations: Violation[] };
        setViolations(d.violations ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchKeywords = async (linkId: number) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/family/links/${linkId}/keywords`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json() as { keywords: string[] };
        setSavedKeywords((prev) => ({ ...prev, [linkId]: d.keywords }));
        setKeywordInputs((prev) => ({ ...prev, [linkId]: d.keywords.join(", ") }));
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleAddChild = async () => {
    if (!childEmail.trim()) return;
    setAddingChild(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/family/link-request`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ childEmail: childEmail.trim() }),
      });
      const d = await res.json() as { link?: FamilyLink; childFound?: boolean; error?: string };
      if (res.ok && d.link) {
        setLinks((prev) => [...prev, d.link!]);
        setChildEmail("");
        setShowAddChild(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Request Sent",
          d.childFound
            ? "A link request has been sent to the child's account. They'll need to accept it."
            : "An invite has been noted. The child can link their account once they register.",
        );
      } else {
        Alert.alert("Error", d.error ?? "Failed to send request.");
      }
    } finally { setAddingChild(false); }
  };

  const handleSaveKeywords = async (linkId: number) => {
    const raw = keywordInputs[linkId] ?? "";
    const keywords = raw.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
    setSavingKeywords((prev) => ({ ...prev, [linkId]: true }));
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/family/links/${linkId}/keywords`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, blockContent: true }),
      });
      if (res.ok) {
        setSavedKeywords((prev) => ({ ...prev, [linkId]: keywords }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", "Failed to save keywords.");
      }
    } finally { setSavingKeywords((prev) => ({ ...prev, [linkId]: false })); }
  };

  const handleRemoveLink = (linkId: number) => {
    Alert.alert("Remove Link", "Are you sure you want to remove this family link?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          const token = await SecureStore.getItemAsync("auth_session_token");
          await fetch(`${getApiBase()}/api/family/links/${linkId}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` },
          });
          setLinks((prev) => prev.filter((l) => l.id !== linkId));
        },
      },
    ]);
  };

  const handleRespondToLink = async (linkId: number, accept: boolean) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/family/link-respond`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ linkId, accept }),
      });
      if (res.ok) {
        void fetchData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch { Alert.alert("Error", "Failed to respond to link request."); }
  };

  const myParentLinks = links.filter((l) => l.parentUserId === user?.id);
  const myChildLinks = links.filter((l) => l.childUserId === user?.id);

  const channelIcon = (ch: string) => {
    if (ch === "message") return "message-circle";
    if (ch === "community_post") return "users";
    if (ch === "group_post") return "grid";
    return "alert-circle";
  };

  const channelLabel = (ch: string) => {
    if (ch === "message") return "Direct Message";
    if (ch === "community_post") return "Community Post";
    if (ch === "group_post") return "Group Post";
    return ch;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Family Safety</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(["controls", "violations"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: "#CA922B", borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? "#CA922B" : colors.mutedForeground }]}>
              {tab === "controls" ? "Parental Controls" : `Alerts${violations.length > 0 ? ` (${violations.length})` : ""}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#CA922B" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {activeTab === "controls" && (
            <>
              {/* Guardian notice (child view) */}
              {myChildLinks.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Guardian</Text>
                  {myChildLinks.map((link) => (
                    <View key={link.id} style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={[styles.linkAvatar, { backgroundColor: "#CA922B18" }]}>
                        <Feather name="shield" size={18} color="#CA922B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.linkName, { color: colors.foreground }]}>Guardian Account</Text>
                        <Text style={[styles.linkStatus, { color: colors.mutedForeground }]}>
                          Status: {link.status === "active" ? "✓ Monitoring active" : link.status === "pending" ? "⏳ Pending your approval" : link.status}
                        </Text>
                      </View>
                      {link.status === "pending" && (
                        <View style={styles.respondRow}>
                          <TouchableOpacity
                            style={[styles.acceptBtn, { backgroundColor: "#16A34A" }]}
                            onPress={() => void handleRespondToLink(link.id, true)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.respondBtnText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.declineBtn, { borderColor: colors.border }]}
                            onPress={() => void handleRespondToLink(link.id, false)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.respondBtnText, { color: colors.foreground }]}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {link.status === "active" && (
                        <TouchableOpacity onPress={() => handleRemoveLink(link.id)} activeOpacity={0.7} style={{ padding: 4 }}>
                          <Feather name="x" size={16} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Parent controls section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Children Under Your Care</Text>
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: "#CA922B18", borderColor: "#CA922B40" }]}
                    onPress={() => setShowAddChild((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <Feather name="plus" size={14} color="#CA922B" />
                    <Text style={styles.addBtnText}>Add Child</Text>
                  </TouchableOpacity>
                </View>

                {showAddChild && (
                  <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <View style={[styles.addChildCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.addChildLabel, { color: colors.foreground }]}>Child's Email Address</Text>
                      <TextInput
                        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                        placeholder="child@example.com"
                        placeholderTextColor={colors.mutedForeground}
                        value={childEmail}
                        onChangeText={setChildEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Text style={[styles.addChildNote, { color: colors.mutedForeground }]}>
                        The child's account will receive a request to link your accounts. Your content filters will activate once they accept.
                      </Text>
                      <TouchableOpacity
                        style={[styles.sendRequestBtn, { opacity: !childEmail.includes("@") || addingChild ? 0.5 : 1 }]}
                        onPress={() => void handleAddChild()}
                        disabled={!childEmail.includes("@") || addingChild}
                        activeOpacity={0.85}
                      >
                        {addingChild ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={15} color="#fff" />}
                        <Text style={styles.sendRequestBtnText}>{addingChild ? "Sending…" : "Send Request"}</Text>
                      </TouchableOpacity>
                    </View>
                  </KeyboardAvoidingView>
                )}

                {myParentLinks.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="users" size={28} color={colors.mutedForeground} />
                    <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No children linked yet</Text>
                    <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                      Add a child's account to set keyword filters and monitor content across messages, community posts, and group activity.
                    </Text>
                  </View>
                ) : (
                  myParentLinks.map((link) => {
                    const childName = [link.childFirstName, link.childLastName].filter(Boolean).join(" ") || link.childEmail || "Child Account";
                    const isExpanded = expandedLinkId === link.id;
                    const kws = savedKeywords[link.id] ?? [];
                    return (
                      <View key={link.id} style={[styles.childCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity
                          style={styles.childCardHeader}
                          onPress={() => setExpandedLinkId(isExpanded ? null : link.id)}
                          activeOpacity={0.75}
                        >
                          <View style={[styles.childAvatar, { backgroundColor: "#CA922B18" }]}>
                            <Feather name="user" size={16} color="#CA922B" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.childName, { color: colors.foreground }]}>{childName}</Text>
                            <Text style={[styles.childStatus, { color: link.status === "active" ? "#16A34A" : colors.mutedForeground }]}>
                              {link.status === "active" ? "✓ Monitoring active" : link.status === "pending" ? "⏳ Awaiting acceptance" : link.status}
                            </Text>
                          </View>
                          {kws.length > 0 && (
                            <View style={[styles.kwCountBadge, { backgroundColor: "#CA922B18" }]}>
                              <Text style={[styles.kwCountText, { color: "#CA922B" }]}>{kws.length} words</Text>
                            </View>
                          )}
                          <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={[styles.keywordsSection, { borderTopColor: colors.border }]}>
                            <Text style={[styles.kwLabel, { color: colors.foreground }]}>Blocked Keywords</Text>
                            <Text style={[styles.kwDesc, { color: colors.mutedForeground }]}>
                              Enter words separated by commas. Messages and posts containing these words will be blocked and reported to you.
                            </Text>
                            <TextInput
                              style={[styles.kwInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                              placeholder="e.g. drugs, violence, adult content"
                              placeholderTextColor={colors.mutedForeground}
                              value={keywordInputs[link.id] ?? ""}
                              onChangeText={(v) => setKeywordInputs((prev) => ({ ...prev, [link.id]: v }))}
                              multiline
                              numberOfLines={3}
                            />
                            {kws.length > 0 && (
                              <View style={styles.kwChips}>
                                {kws.map((kw) => (
                                  <View key={kw} style={[styles.kwChip, { backgroundColor: "#DC262614", borderColor: "#DC262630" }]}>
                                    <Text style={[styles.kwChipText, { color: "#DC2626" }]}>{kw}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                            <View style={styles.kwActions}>
                              <TouchableOpacity
                                style={[styles.saveKwBtn, { opacity: savingKeywords[link.id] ? 0.6 : 1 }]}
                                onPress={() => void handleSaveKeywords(link.id)}
                                disabled={savingKeywords[link.id]}
                                activeOpacity={0.85}
                              >
                                {savingKeywords[link.id] ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="save" size={14} color="#fff" />}
                                <Text style={styles.saveKwBtnText}>{savingKeywords[link.id] ? "Saving…" : "Save Keywords"}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.removeLinkBtn, { borderColor: colors.border }]}
                                onPress={() => handleRemoveLink(link.id)}
                                activeOpacity={0.7}
                              >
                                <Feather name="trash-2" size={14} color="#DC2626" />
                                <Text style={[styles.removeLinkBtnText]}>Remove</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>

              {/* How it works */}
              <View style={[styles.howItWorks, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.howTitle, { color: colors.foreground }]}>How It Works</Text>
                {[
                  { icon: "link", text: "Link a child's account — they'll confirm the request" },
                  { icon: "edit-3", text: "Set keyword filters — comma-separated words to monitor" },
                  { icon: "shield", text: "Messages and posts containing those words are blocked" },
                  { icon: "bell", text: "All violations are logged here under the Alerts tab" },
                ].map((item, i) => (
                  <View key={i} style={styles.howRow}>
                    <View style={[styles.howIcon, { backgroundColor: "#CA922B18" }]}>
                      <Feather name={item.icon as "link"} size={14} color="#CA922B" />
                    </View>
                    <Text style={[styles.howText, { color: colors.mutedForeground }]}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {activeTab === "violations" && (
            <View style={styles.section}>
              {violations.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="check-circle" size={28} color="#16A34A" />
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No violations yet</Text>
                  <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                    When a blocked keyword is detected, it will appear here with details about what was caught and where.
                  </Text>
                </View>
              ) : (
                violations.map((v) => (
                  <View key={v.id} style={[styles.violationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.violationHeader}>
                      <View style={[styles.violationIcon, { backgroundColor: v.wasBlocked ? "#DC262614" : "#C9922B14" }]}>
                        <Feather name={channelIcon(v.channel)} size={14} color={v.wasBlocked ? "#DC2626" : "#C9922B"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.violationChannel, { color: colors.foreground }]}>{channelLabel(v.channel)}</Text>
                        <Text style={[styles.violationDate, { color: colors.mutedForeground }]}>{formatDate(v.createdAt)}</Text>
                      </View>
                      <View style={[styles.blockedBadge, { backgroundColor: v.wasBlocked ? "#DC262614" : "#C9922B14" }]}>
                        <Text style={[styles.blockedBadgeText, { color: v.wasBlocked ? "#DC2626" : "#C9922B" }]}>
                          {v.wasBlocked ? "Blocked" : "Flagged"}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.violationSnippet, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.violationSnippetText, { color: colors.mutedForeground }]} numberOfLines={3}>
                        "{v.contentSnippet}"
                      </Text>
                    </View>
                    <View style={styles.matchedKws}>
                      <Text style={[styles.matchedLabel, { color: colors.mutedForeground }]}>Matched: </Text>
                      {v.matchedKeywords.map((kw) => (
                        <View key={kw} style={[styles.kwChip, { backgroundColor: "#DC262614", borderColor: "#DC262630" }]}>
                          <Text style={[styles.kwChipText, { color: "#DC2626" }]}>{kw}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20, gap: 24, paddingBottom: 60 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  addBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#CA922B" },
  addChildCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, marginBottom: 4 },
  addChildLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  addChildNote: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontFamily: "Inter_400Regular", fontSize: 14 },
  sendRequestBtn: { backgroundColor: "#CA922B", borderRadius: 12, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  sendRequestBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16, textAlign: "center" },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 },
  linkCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  linkAvatar: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  linkName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  linkStatus: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  respondRow: { flexDirection: "row", gap: 8 },
  acceptBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  declineBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  respondBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  childCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  childCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  childAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  childName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  childStatus: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  kwCountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  kwCountText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  keywordsSection: { borderTopWidth: 1, padding: 14, gap: 10 },
  kwLabel: { fontFamily: "Inter_700Bold", fontSize: 14 },
  kwDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  kwInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontFamily: "Inter_400Regular", fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  kwChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  kwChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  kwChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  kwActions: { flexDirection: "row", gap: 10 },
  saveKwBtn: { flex: 1, backgroundColor: "#CA922B", borderRadius: 12, height: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  saveKwBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  removeLinkBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  removeLinkBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#DC2626" },
  howItWorks: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  howTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  howRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  howIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  howText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, flex: 1 },
  violationCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  violationHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  violationIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  violationChannel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  violationDate: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  blockedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  blockedBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  violationSnippet: { borderRadius: 10, borderWidth: 1, padding: 10 },
  violationSnippetText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, fontStyle: "italic" },
  matchedKws: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  matchedLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
});
