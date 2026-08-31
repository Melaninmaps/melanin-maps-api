import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

const BROADCAST_TYPES = [
  { id: "event", emoji: "🎉", label: "Event", hint: "Live music, grand opening, networking…" },
  { id: "offer", emoji: "💲", label: "Special Offer", hint: "Flash sale, BOGO, happy hour…" },
  { id: "product", emoji: "🆕", label: "New Product/Service", hint: "New menu item, new collection…" },
  { id: "update", emoji: "📣", label: "Business Update", hint: "New hours, new location, closure…" },
  { id: "community", emoji: "❤️", label: "Community Announcement", hint: "Charity drive, cleanup, blood drive…" },
  { id: "emergency", emoji: "🚨", label: "Emergency Update", hint: "Weather closure, outage — doesn't use quota" },
] as const;

type BroadcastType = typeof BROADCAST_TYPES[number]["id"];

type Broadcast = {
  id: string;
  type: BroadcastType;
  title: string;
  body: string;
  recipientCount: number;
  deliveredCount: number;
  viewCount: number;
  createdAt: string;
};

type Quota = { used: number; limit: number; remaining: number; tier: string };

const TIER_LABELS: Record<string, string> = {
  free: "Community Business",
  growth: "Growth Business",
  premium: "Premium Business",
  enterprise: "Enterprise Partner",
};

export default function BroadcastsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [tab, setTab] = useState<"compose" | "history">("compose");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unverified, setUnverified] = useState(false);

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);

  // Compose form
  const [selectedType, setSelectedType] = useState<BroadcastType>("event");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const loadData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/mine/broadcasts`, { headers });
      if (res.status === 403) {
        setUnverified(true);
        return;
      }
      if (res.ok) {
        const data = await res.json() as { broadcasts: Broadcast[]; quota: Quota };
        setBroadcasts(data.broadcasts);
        setQuota(data.quota);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { queueMicrotask(() => { loadData(); }); }, [loadData]);

  const handleSend = async () => {
    if (!title.trim()) { Alert.alert("Add a title", "Give your broadcast a short, clear headline."); return; }
    if (!body.trim()) { Alert.alert("Add a message", "Write what you want your community to know."); return; }
    if (selectedType !== "emergency" && quota && quota.remaining === 0) {
      Alert.alert(
        "Monthly limit reached",
        `You've used all ${quota.limit} broadcasts for this month. Upgrade your plan to send more, or wait until next month.`,
        [{ text: "OK" }],
      );
      return;
    }

    setSending(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/mine/broadcasts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ type: selectedType, title: title.trim(), body: body.trim() }),
      });
      const data = await res.json() as { broadcast?: Broadcast; delivered?: number; recipients?: number; error?: string };
      if (res.ok && data.broadcast) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Broadcast sent! 📣",
          data.recipients
            ? `Sent to ${data.recipients} follower${data.recipients !== 1 ? "s" : ""}. ${data.delivered ?? 0} push notification${(data.delivered ?? 0) !== 1 ? "s" : ""} delivered.`
            : "No followers yet — your broadcast was saved.",
          [{ text: "Great!" }],
        );
        setTitle("");
        setBody("");
        loadData();
        setTab("history");
      } else {
        Alert.alert("Error", data.error ?? "Could not send broadcast. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const typeInfo = BROADCAST_TYPES.find(t => t.id === selectedType)!;
  const isEmergency = selectedType === "emergency";
  const quotaColor = quota
    ? (quota.remaining === 0 ? "#D9534F" : quota.remaining <= 2 ? "#C9922B" : "#2D7A4F")
    : colors.mutedForeground;

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Broadcasts</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tab bar */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(["compose", "history"] as const).map(t => (
          <TouchableOpacity activeOpacity={0.85} key={t} style={[styles.tab, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTab(t)}>
            <Text style={[styles.tabTxt, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
              {t === "compose" ? "Compose" : "History"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : unverified ? (
          <View style={styles.gateCard}>
            <Text style={{ fontSize: 48, textAlign: "center" }}>🔒</Text>
            <Text style={[styles.gateTitle, { color: colors.foreground }]}>Verification Required</Text>
            <Text style={[styles.gateSub, { color: colors.mutedForeground }]}>
              Broadcasts are only available to verified businesses. Verification protects our community by ensuring only trusted, confirmed business owners can send push notifications to followers.
            </Text>
            <View style={[styles.gateSteps, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.gateStepTitle, { color: colors.foreground }]}>How to get verified:</Text>
              <Text style={[styles.gateStep, { color: colors.mutedForeground }]}>✅ Complete your business profile</Text>
              <Text style={[styles.gateStep, { color: colors.mutedForeground }]}>✅ Fill in your Business Identity</Text>
              <Text style={[styles.gateStep, { color: colors.mutedForeground }]}>📋 Submit a verification request to our team</Text>
              <Text style={[styles.gateStep, { color: colors.mutedForeground }]}>⏱ Typical review: 2–5 business days</Text>
            </View>
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.gateBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/business-owner/identity" as never)}
            >
              <Feather name="user-check" size={16} color="#FFF" />
              <Text style={styles.gateBtnTxt}>Complete Business Identity</Text>
            </TouchableOpacity>
          </View>
        ) : tab === "compose" ? (
          <>
            {/* Quota card */}
            {quota && (
              <View style={[styles.quotaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.quotaRow}>
                  <View>
                    <Text style={[styles.quotaLabel, { color: colors.foreground }]}>Monthly Broadcasts</Text>
                    <Text style={[styles.quotaTier, { color: colors.mutedForeground }]}>{TIER_LABELS[quota.tier] ?? quota.tier}</Text>
                  </View>
                  <View style={styles.quotaNumbers}>
                    {quota.tier === "enterprise" ? (
                      <Text style={[styles.quotaUsed, { color: "#2D7A4F" }]}>∞</Text>
                    ) : (
                      <Text style={[styles.quotaUsed, { color: quotaColor }]}>{quota.remaining}</Text>
                    )}
                    <Text style={[styles.quotaOf, { color: colors.mutedForeground }]}>
                      {quota.tier === "enterprise" ? "Unlimited" : `/ ${quota.limit} left`}
                    </Text>
                  </View>
                </View>
                <View style={[styles.quotaTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.quotaFill, { width: quota.tier === "enterprise" ? "8%" : `${Math.round((quota.used / quota.limit) * 100)}%` as any, backgroundColor: quotaColor }]} />
                </View>
                {quota.remaining === 0 && (
                  <Text style={[styles.quotaHint, { color: "#D9534F" }]}>
                    Monthly limit reached. Emergency updates are always allowed. Unused broadcasts don&apos;t roll over.
                  </Text>
                )}
                <Text style={[styles.quotaHint, { color: colors.mutedForeground }]}>
                  🚨 Emergency updates never count against your limit.
                </Text>
              </View>
            )}

            {/* Type selector */}
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Notification Type</Text>
            {BROADCAST_TYPES.map(t => (
              <TouchableOpacity activeOpacity={0.85}
                key={t.id}
                style={[styles.typeRow, { borderColor: selectedType === t.id ? colors.primary : colors.border, backgroundColor: selectedType === t.id ? colors.primary + "12" : colors.card }]}
                onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setSelectedType(t.id); }}
              >
                <Text style={styles.typeEmoji}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.typeLabel, { color: colors.foreground }]}>{t.label}</Text>
                  <Text style={[styles.typeHint, { color: colors.mutedForeground }]}>{t.hint}</Text>
                </View>
                {selectedType === t.id && <Feather name="check-circle" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}

            {/* Compose */}
            <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: 20 }]}>Message</Text>
            <TextInput
              style={[styles.titleInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder={`${typeInfo.emoji} Headline (max 200 chars)`}
              placeholderTextColor={colors.mutedForeground}
              maxLength={200}
            />
            <TextInput
              style={[styles.bodyInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              value={body}
              onChangeText={setBody}
              placeholder={`Tell your community what's happening…\n\n${typeInfo.hint}`}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{body.length}/1000</Text>

            {isEmergency && (
              <View style={[styles.emergencyNote, { borderColor: "#D9534F", backgroundColor: "#D9534F18" }]}>
                <Feather name="alert-triangle" size={14} color="#D9534F" />
                <Text style={[styles.emergencyTxt, { color: "#D9534F" }]}>
                  Emergency updates go to all followers immediately and don&apos;t use your monthly quota.
                </Text>
              </View>
            )}

            <TouchableOpacity activeOpacity={0.85}
              style={[styles.sendBtn, { backgroundColor: isEmergency ? "#D9534F" : colors.primary, opacity: sending ? 0.6 : 1 }]}
              onPress={handleSend}
              disabled={sending}
            >
              <Feather name={isEmergency ? "alert-triangle" : "send"} size={18} color="#FFF" />
              <Text style={styles.sendBtnTxt}>{sending ? "Sending…" : isEmergency ? "Send Emergency Update" : "Send Broadcast"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {broadcasts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>📣</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No broadcasts yet</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Send your first broadcast to reach your community.</Text>
                <TouchableOpacity activeOpacity={0.85} style={[styles.composeBtn, { backgroundColor: colors.primary }]} onPress={() => setTab("compose")}>
                  <Text style={styles.composeBtnTxt}>Compose a Broadcast</Text>
                </TouchableOpacity>
              </View>
            ) : (
              broadcasts.map(b => {
                const t = BROADCAST_TYPES.find(x => x.id === b.type);
                return (
                  <View key={b.id} style={[styles.broadcastCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.broadcastTop}>
                      <Text style={styles.broadcastEmoji}>{t?.emoji ?? "📣"}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.broadcastTitle, { color: colors.foreground }]}>{b.title}</Text>
                        <Text style={[styles.broadcastDate, { color: colors.mutedForeground }]}>{formatDate(b.createdAt)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.broadcastBody, { color: colors.mutedForeground }]} numberOfLines={2}>{b.body}</Text>
                    <View style={[styles.analyticsRow, { borderTopColor: colors.border }]}>
                      <View style={styles.stat}>
                        <Feather name="users" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.statVal, { color: colors.foreground }]}>{b.recipientCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Eligible</Text>
                      </View>
                      <View style={styles.stat}>
                        <Feather name="bell" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.statVal, { color: colors.foreground }]}>{b.deliveredCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Delivered</Text>
                      </View>
                      <View style={styles.stat}>
                        <Feather name="percent" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.statVal, { color: colors.foreground }]}>
                          {b.recipientCount > 0 ? `${Math.round((b.deliveredCount / b.recipientCount) * 100)}%` : "—"}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Reach rate</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabTxt: { fontSize: 15, fontWeight: "600" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },

  quotaCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, marginBottom: 4 },
  quotaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  quotaLabel: { fontSize: 15, fontWeight: "700" },
  quotaTier: { fontSize: 12, marginTop: 2 },
  quotaNumbers: { alignItems: "flex-end" },
  quotaUsed: { fontSize: 24, fontWeight: "800" },
  quotaOf: { fontSize: 12 },
  quotaTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  quotaFill: { height: 6, borderRadius: 3 },
  quotaHint: { fontSize: 12, lineHeight: 17 },

  sectionLabel: { fontSize: 14, fontWeight: "700", marginBottom: 4, marginTop: 4 },

  typeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 4 },
  typeEmoji: { fontSize: 22 },
  typeLabel: { fontSize: 14, fontWeight: "600" },
  typeHint: { fontSize: 12, marginTop: 2 },

  titleInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: "600", marginBottom: 8 },
  bodyInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: 14, minHeight: 120, lineHeight: 21 },
  charCount: { fontSize: 12, textAlign: "right", marginTop: 4, marginBottom: 8 },

  emergencyNote: { flexDirection: "row", gap: 8, alignItems: "flex-start", borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  emergencyTxt: { flex: 1, fontSize: 13, lineHeight: 18 },

  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  sendBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  gateCard: { alignItems: "center", paddingTop: 48, paddingHorizontal: 8, gap: 14 },
  gateTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  gateSub: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  gateSteps: { width: "100%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  gateStepTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  gateStep: { fontSize: 13, lineHeight: 20 },
  gateBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  gateBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  composeBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  composeBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  broadcastCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  broadcastTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  broadcastEmoji: { fontSize: 22, marginTop: 1 },
  broadcastTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  broadcastDate: { fontSize: 12, marginTop: 2 },
  broadcastBody: { fontSize: 13, lineHeight: 19 },
  analyticsRow: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
  stat: { alignItems: "center", gap: 3 },
  statVal: { fontSize: 17, fontWeight: "700" },
  statLabel: { fontSize: 11 },
});
