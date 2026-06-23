import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useAuth } from "@/lib/auth";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

type Connection = {
  id: number;
  status: string;
  requesterId: string;
  recipientId: string;
  otherId: string;
  otherFirstName: string | null;
  otherLastName: string | null;
  otherProfileImageUrl: string | null;
  createdAt: string;
};

type MeetupVerification = {
  id: number;
  initiatorId: string;
  partnerId: string;
  status: string;
  location: string | null;
  note: string | null;
  initiatedAt: string;
  confirmedAt: string | null;
  expiresAt: string;
  partnerFirstName: string | null;
  partnerLastName: string | null;
};

export default function MemberConnectionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [connections, setConnections] = useState<Connection[]>([]);
  const [meetups, setMeetups] = useState<MeetupVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConn, setSelectedConn] = useState<Connection | null>(null);
  const [meetupLocation, setMeetupLocation] = useState("");
  const [meetupNote, setMeetupNote] = useState("");
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const base = getApiBase();
      const [cRes, mRes] = await Promise.all([
        fetch(`${base}/api/connections`, { headers }),
        fetch(`${base}/api/meetups`, { headers }),
      ]);
      if (cRes.ok) {
        const d = await cRes.json() as { connections: Connection[] };
        setConnections((d.connections ?? []).filter((c) => c.status === "accepted"));
      }
      if (mRes.ok) {
        const d = await mRes.json() as { verifications: MeetupVerification[] };
        setMeetups(d.verifications ?? []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const sendMeetupRequest = async () => {
    if (!selectedConn) return;
    setSending(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/meetups`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: selectedConn.otherId,
          connectionId: selectedConn.id,
          location: meetupLocation.trim() || undefined,
          note: meetupNote.trim() || undefined,
        }),
      });
      const d = await res.json() as { verification?: MeetupVerification; error?: string };
      if (res.ok && d.verification) {
        setMeetups((prev) => [d.verification!, ...prev]);
        setSelectedConn(null);
        setMeetupLocation("");
        setMeetupNote("");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const name = [selectedConn.otherFirstName, selectedConn.otherLastName].filter(Boolean).join(" ");
        Alert.alert("Verification Sent ✓", `${name} will receive a meetup verification request. Once they confirm, you're both verified.`);
      } else {
        Alert.alert("Error", d.error ?? "Failed to send verification.");
      }
    } finally { setSending(false); }
  };

  const confirmMeetup = async (id: number) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const token = await SecureStore.getItemAsync("auth_session_token");
    const res = await fetch(`${getApiBase()}/api/meetups/${id}/confirm`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const d = await res.json() as { verification: MeetupVerification };
      setMeetups((prev) => prev.map((m) => m.id === id ? d.verification : m));
    } else {
      Alert.alert("Error", "Failed to confirm meetup.");
    }
  };

  const acceptedConnections = connections.filter((c) => c.status === "accepted");
  const pendingForMe = meetups.filter((m) => m.status === "pending" && m.partnerId === user?.id);
  const sentByMe = meetups.filter((m) => m.initiatorId === user?.id);
  const confirmed = meetups.filter((m) => m.status === "confirmed");

  const connName = (c: Connection) =>
    [c.otherFirstName, c.otherLastName].filter(Boolean).join(" ") || "Member";

  const meetupName = (m: MeetupVerification) =>
    [m.partnerFirstName, m.partnerLastName].filter(Boolean).join(" ") || "Connection";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Connections</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#7C3AED" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Pending meetup requests from others */}
          {pendingForMe.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Meetup Requests ({pendingForMe.length})
              </Text>
              {pendingForMe.map((m) => (
                <View key={m.id} style={[styles.requestCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
                  <View style={styles.requestHeader}>
                    <View style={[styles.avatarSmall, { backgroundColor: "#7C3AED18" }]}>
                      <Feather name="user-check" size={14} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.requestName, { color: "#1D4ED8" }]}>
                        {meetupName(m)} wants to verify a meetup
                      </Text>
                      {m.location && (
                        <Text style={[styles.requestMeta, { color: "#1E40AF" }]}>
                          📍 {m.location}
                        </Text>
                      )}
                      {m.note && (
                        <Text style={[styles.requestMeta, { color: "#1E40AF" }]}>
                          "{m.note}"
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => void confirmMeetup(m.id)}
                    activeOpacity={0.85}
                  >
                    <Feather name="check" size={14} color="#fff" />
                    <Text style={styles.confirmBtnText}>Confirm Meetup</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Confirmed meetups badge section */}
          {confirmed.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Verified Meetups</Text>
              {confirmed.slice(0, 3).map((m) => (
                <View key={m.id} style={[styles.confirmedCard, { backgroundColor: colors.card, borderColor: "#BBF7D0" }]}>
                  <View style={[styles.verifiedBadge, { backgroundColor: "#16A34A18" }]}>
                    <Feather name="shield" size={14} color="#16A34A" />
                    <Text style={[styles.verifiedText, { color: "#16A34A" }]}>Verified</Text>
                  </View>
                  <Text style={[styles.confirmedName, { color: colors.foreground }]}>{meetupName(m)}</Text>
                  {m.location && (
                    <Text style={[styles.confirmedMeta, { color: colors.mutedForeground }]}>📍 {m.location}</Text>
                  )}
                  <Text style={[styles.confirmedDate, { color: colors.mutedForeground }]}>
                    {m.confirmedAt ? formatDate(m.confirmedAt) : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Connection list */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Connections ({acceptedConnections.length})
            </Text>
            {acceptedConnections.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="users" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No connections yet</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Connect with other members through group chats and community spaces to unlock meetup verification.
                </Text>
              </View>
            ) : (
              acceptedConnections.map((c) => {
                const alreadySent = sentByMe.some(
                  (m) => m.partnerId === c.otherId && m.status === "pending"
                );
                const isVerified = confirmed.some(
                  (m) => (m.initiatorId === c.otherId || m.partnerId === c.otherId)
                );
                return (
                  <View
                    key={c.id}
                    style={[styles.connCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.connLeft}>
                      {c.otherProfileImageUrl ? (
                        <Image source={{ uri: c.otherProfileImageUrl }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: "#7C3AED18" }]}>
                          <Text style={[styles.avatarInitial, { color: "#7C3AED" }]}>
                            {(c.otherFirstName?.[0] ?? "M").toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={styles.nameRow}>
                          <Text style={[styles.connName, { color: colors.foreground }]}>
                            {connName(c)}
                          </Text>
                          {isVerified && (
                            <View style={[styles.verifiedBadge, { backgroundColor: "#16A34A18" }]}>
                              <Feather name="shield" size={10} color="#16A34A" />
                              <Text style={[styles.verifiedText, { color: "#16A34A", fontSize: 10 }]}>Verified</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.connSince, { color: colors.mutedForeground }]}>
                          Connected {formatDate(c.createdAt)}
                        </Text>
                      </View>
                    </View>
                    {alreadySent ? (
                      <View style={[styles.sentBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.sentText, { color: colors.mutedForeground }]}>Request Sent</Text>
                      </View>
                    ) : isVerified ? (
                      <View style={[styles.sentBadge, { backgroundColor: "#16A34A18" }]}>
                        <Feather name="check-circle" size={14} color="#16A34A" />
                        <Text style={[styles.sentText, { color: "#16A34A" }]}>Verified</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.verifyBtn}
                        onPress={() => {
                          setSelectedConn(c);
                          setMeetupLocation("");
                          setMeetupNote("");
                        }}
                        activeOpacity={0.75}
                      >
                        <Feather name="user-check" size={14} color="#7C3AED" />
                        <Text style={styles.verifyBtnText}>Verify Meetup</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Meetup verification modal */}
      <Modal visible={!!selectedConn} transparent animationType="slide" onRequestClose={() => setSelectedConn(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Verify Meetup</Text>
              <TouchableOpacity onPress={() => setSelectedConn(null)} activeOpacity={0.7}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            {selectedConn && (
              <>
                <View style={[styles.modalInfo, { backgroundColor: "#7C3AED0F", borderColor: "#7C3AED30" }]}>
                  <Feather name="shield" size={16} color="#7C3AED" />
                  <Text style={[styles.modalInfoText, { color: colors.foreground }]}>
                    Sending a meetup verification request to{" "}
                    <Text style={{ fontFamily: "Inter_700Bold" }}>{connName(selectedConn)}</Text>.
                    Once they confirm, you're both marked as verified for this meetup.
                  </Text>
                </View>
                <Text style={[styles.modalLabel, { color: colors.foreground }]}>Location (optional)</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="e.g. Busy Bean Coffee, Downtown Atlanta"
                  placeholderTextColor={colors.mutedForeground}
                  value={meetupLocation}
                  onChangeText={setMeetupLocation}
                />
                <Text style={[styles.modalLabel, { color: colors.foreground }]}>Note (optional)</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="e.g. First time meeting, told my roommate"
                  placeholderTextColor={colors.mutedForeground}
                  value={meetupNote}
                  onChangeText={setMeetupNote}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { opacity: sending ? 0.6 : 1 }]}
                  onPress={() => void sendMeetupRequest()}
                  disabled={sending}
                  activeOpacity={0.85}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Feather name="send" size={16} color="#fff" />
                  )}
                  <Text style={styles.sendBtnText}>{sending ? "Sending…" : "Send Verification Request"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20, gap: 24, paddingBottom: 60 },
  section: { gap: 10 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  requestCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  requestHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  avatarSmall: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  requestName: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20 },
  requestMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 3 },
  confirmBtn: {
    backgroundColor: "#2563EB", borderRadius: 12, height: 42,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  confirmBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  confirmedCard: {
    borderRadius: 14, borderWidth: 1, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  verifiedText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  confirmedName: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  confirmedMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  confirmedDate: { fontFamily: "Inter_400Regular", fontSize: 11 },
  emptyCard: { borderRadius: 18, borderWidth: 1, padding: 28, alignItems: "center", gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 },
  connCard: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  connLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontFamily: "Inter_700Bold", fontSize: 18 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  connName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  connSince: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  verifyBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "#7C3AED18", borderWidth: 1, borderColor: "#7C3AED40",
  },
  verifyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#7C3AED" },
  sentBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  sentText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 12,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  modalInfo: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  modalInfoText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  modalLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 4 },
  modalInput: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11,
    fontFamily: "Inter_400Regular", fontSize: 14,
  },
  sendBtn: {
    backgroundColor: "#7C3AED", borderRadius: 14, height: 50,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4,
  },
  sendBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
});
