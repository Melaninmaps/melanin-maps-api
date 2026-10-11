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
import { getApiBase } from "@/lib/api";

type Connection = {
  id: number;
  status: string;
  requesterId: string;
  recipientId: string;
  otherId: string;
  otherFirstName: string | null;
  otherLastName: string | null;
  otherUsername: string | null;
  otherProfileImageUrl: string | null;
  createdAt: string;
};

type MeetupVerification = {
  id: number;
  role: "organizer" | "partner";
  counterpartName: string;
  status: "awaiting_partner" | "approved" | "cancelled" | "expired";
  venue: null;
  scheduledAt: string | null;
  expiresAt: string | null;
  initiatedAt: string;
  organizerApprovedAt: string | null;
  partnerApprovedAt: string | null;
  correctedAt: string | null;
  cancelledAt: string | null;
};

const STATUS_COLORS: Record<MeetupVerification["status"], string> = {
  awaiting_partner: "#C9922B",
  approved: "#16A34A",
  cancelled: "#6B7280",
  expired: "#6B7280",
};

const STATUS_LABELS: Record<MeetupVerification["status"], string> = {
  awaiting_partner: "Awaiting approval",
  approved: "Mutually approved",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default function MemberConnectionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [connections, setConnections] = useState<Connection[]>([]);
  const [meetups, setMeetups] = useState<MeetupVerification[]>([]);
  const [loading, setLoading] = useState(true);

  // Meetup request state. The request contains no venue, note, watcher, attendee list, or location data.
  const [selectedConn, setSelectedConn] = useState<Connection | null>(null);
  const [organizerApproval, setOrganizerApproval] = useState(false);
  const [scheduledLeadMinutes, setScheduledLeadMinutes] = useState(60);
  const [sending, setSending] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MeetupVerification | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

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

  useEffect(() => { queueMicrotask(() => { void fetchData(); }); }, [fetchData]);

  const sendMeetupRequest = async () => {
    if (!selectedConn || !organizerApproval || sending) return;
    setSending(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const partnerCheck = await fetch(`${getApiBase()}/api/meetups/partner-check?partnerId=${encodeURIComponent(selectedConn.otherId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const partner = await partnerCheck.json().catch(() => ({})) as { identityVerified?: boolean; error?: string };
      if (!partnerCheck.ok || !partner.identityVerified) {
        Alert.alert("Identity verification required", partner.error ?? "Both people need a verified identity before a meetup request can be sent.");
        return;
      }
      const scheduledAt = new Date(Date.now() + scheduledLeadMinutes * 60_000).toISOString();
      const response = await fetch(`${getApiBase()}/api/meetups`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: selectedConn.otherId, organizerApproval: true, scheduledAt }),
      });
      const body = await response.json().catch(() => ({})) as { verification?: MeetupVerification; error?: string };
      if (!response.ok || !body.verification) {
        Alert.alert("Unable to send request", body.error ?? "The meetup request could not be created.");
        return;
      }
      setMeetups((current) => [body.verification!, ...current]);
      resetModal();
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Verification request sent", "Your connection must independently approve this time-bounded request. Kinfolk does not collect or share a meetup location.");
    } catch {
      Alert.alert("Unable to send request", "Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const confirmMeetup = async (id: number) => {
    if (confirmingId !== null) return;
    setConfirmingId(id);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const response = await fetch(`${getApiBase()}/api/meetups/${id}/confirm`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ partnerApproval: true }),
      });
      const body = await response.json().catch(() => ({})) as { verification?: MeetupVerification; error?: string };
      if (!response.ok || !body.verification) {
        Alert.alert("Unable to approve request", body.error ?? "The meetup request could not be approved.");
        return;
      }
      setMeetups((current) => current.map((meetup) => meetup.id === id ? body.verification! : meetup));
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Unable to approve request", "Check your connection and try again.");
    } finally {
      setConfirmingId(null);
    }
  };

  const cancelMeetup = async () => {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const response = await fetch(`${getApiBase()}/api/meetups/${cancelTarget.id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancellationReason.trim() || undefined }),
      });
      const body = await response.json().catch(() => ({})) as { verification?: MeetupVerification; error?: string };
      if (!response.ok || !body.verification) {
        Alert.alert("Unable to cancel request", body.error ?? "The meetup request could not be cancelled.");
        return;
      }
      setMeetups((current) => current.map((meetup) => meetup.id === cancelTarget.id ? body.verification! : meetup));
      setCancelTarget(null);
      setCancellationReason("");
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Unable to cancel request", "Check your connection and try again.");
    } finally {
      setCancelling(false);
    }
  };

  const resetModal = () => {
    setSelectedConn(null);
    setOrganizerApproval(false);
    setScheduledLeadMinutes(60);
  };

  const acceptedConnections = connections.filter((connection) => connection.status === "accepted");
  const pendingForMe = meetups.filter((meetup) => meetup.role === "partner" && meetup.status === "awaiting_partner");
  const myMeetups = meetups.filter((meetup) => meetup.role === "organizer");

  const connName = (connection: Connection) =>
    [connection.otherFirstName, connection.otherLastName].filter(Boolean).join(" ") ||
    (connection.otherUsername ? `@${connection.otherUsername}` : "Member");

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
        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Pending two-party approvals ── */}
          {pendingForMe.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Meetup requests ({pendingForMe.length})</Text>
              {pendingForMe.map((meetup) => (
                <View key={meetup.id} style={[styles.requestCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
                  <View style={styles.requestHeader}>
                    <View style={[styles.avatarSmall, { backgroundColor: "#7C3AED18" }]}>
                      <Feather name="user-check" size={14} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.requestName, { color: "#1D4ED8" }]}>{meetup.counterpartName} requested a meetup verification</Text>
                      <Text style={[styles.requestMeta, { color: "#1E40AF" }]}>Approval confirms only that both people opted into this time-bounded request. It does not share a venue or make a safety guarantee.</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { opacity: confirmingId === meetup.id ? 0.6 : 1 }]}
                    onPress={() => void confirmMeetup(meetup.id)}
                    disabled={confirmingId !== null}
                    activeOpacity={0.85}
                  >
                    {confirmingId === meetup.id ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="check" size={14} color="#fff" />}
                    <Text style={styles.confirmBtnText}>{confirmingId === meetup.id ? "Approving…" : "Approve meetup request"}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── Organizer meetup requests ── */}
          {myMeetups.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My meetup requests</Text>
              <View style={[styles.persistNote, { backgroundColor: "#7C3AED0A", borderColor: "#7C3AED30" }]}>
                <Feather name="shield" size={13} color="#7C3AED" />
                <Text style={[styles.persistNoteText, { color: colors.mutedForeground }]}>Requests are time-bounded and may be cancelled. Kinfolk does not retain or disclose a meetup venue, note, watcher, or arrival history.</Text>
              </View>
              {myMeetups.map((meetup) => {
                const statusColor = STATUS_COLORS[meetup.status];
                const active = meetup.status === "awaiting_partner" || meetup.status === "approved";
                return (
                  <View key={meetup.id} style={[styles.meetupCard, { backgroundColor: colors.card, borderColor: meetup.status === "approved" ? "#BBF7D0" : colors.border }]}>
                    <View style={styles.meetupCardHeader}>
                      <View style={[styles.meetupIconWrap, { backgroundColor: statusColor + "18" }]}>
                        <Feather name={meetup.status === "approved" ? "shield" : "user-check"} size={15} color={statusColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.meetupCardName, { color: colors.foreground }]}>{meetup.counterpartName}</Text>
                        <Text style={[styles.meetupCardDate, { color: colors.mutedForeground }]}>Two-party, time-bounded verification</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[meetup.status]}</Text>
                      </View>
                    </View>
                    {active ? (
                      <View style={[styles.meetupActions, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: "#DC262612", borderColor: "#DC262630" }]}
                          onPress={() => { setCancelTarget(meetup); setCancellationReason(""); }}
                          activeOpacity={0.7}
                        >
                          <Feather name="x-circle" size={13} color="#DC2626" />
                          <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Cancel request</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Connection list ── */}
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
                const connectionName = connName(c);
                const hasPendingRequest = myMeetups.some(
                  (meetup) => meetup.counterpartName === connectionName && meetup.status === "awaiting_partner"
                );
                const isVerified = meetups.some(
                  (meetup) => meetup.counterpartName === connectionName && meetup.status === "approved"
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
                            {(c.otherFirstName?.[0] ?? c.otherUsername?.[0] ?? "M").toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={styles.nameRow}>
                          <Text style={[styles.connName, { color: colors.foreground }]} numberOfLines={1}>
                            {connName(c)}
                          </Text>
                          {isVerified && (
                            <View style={[styles.verifiedBadge, { backgroundColor: "#16A34A18" }]}>
                              <Feather name="shield" size={10} color="#16A34A" />
                              <Text style={[styles.verifiedText, { color: "#16A34A" }]}>Verified</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.connSince, { color: colors.mutedForeground }]}>
                          Connected {formatDate(c.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {hasPendingRequest ? (
                      <View style={[styles.sentBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.sentText, { color: colors.mutedForeground }]}>Sent</Text>
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
                          setOrganizerApproval(false);
                          setScheduledLeadMinutes(60);
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

      {/* ── New Meetup Verification Modal ── */}
      <Modal visible={!!selectedConn} transparent animationType="slide" onRequestClose={resetModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Verify Meetup</Text>
                <TouchableOpacity onPress={resetModal} activeOpacity={0.7}>
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {selectedConn && (
                <>
                  <View style={[styles.modalInfo, { backgroundColor: "#7C3AED0F", borderColor: "#7C3AED30" }]}>
                    <Feather name="shield" size={16} color="#7C3AED" />
                    <Text style={[styles.modalInfoText, { color: colors.foreground }]}>Send a time-bounded verification request to <Text style={{ fontFamily: "Inter_700Bold" }}>{connName(selectedConn)}</Text>. They must independently approve before it is mutually approved.</Text>
                  </View>
                  <View style={[styles.privacyNote, { backgroundColor: "#16A34A08", borderColor: "#16A34A25" }]}>
                    <Text style={[styles.privacyNoteText, { color: "#14532D" }]}>Kinfolk does not request, store, or disclose a meetup venue, member location, note, watcher contact, arrival check-in, or home check-in.</Text>
                  </View>
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Verification window</Text>
                  <Text style={[styles.watcherSectionDesc, { color: colors.mutedForeground }]}>Choose when this time-bounded request begins. Arrange any location privately off-platform.</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {[{ label: "30 min", minutes: 30 }, { label: "1 hour", minutes: 60 }, { label: "2 hours", minutes: 120 }, { label: "4 hours", minutes: 240 }].map((option) => (
                      <TouchableOpacity key={option.minutes} onPress={() => setScheduledLeadMinutes(option.minutes)} style={[styles.chipBtn, scheduledLeadMinutes === option.minutes && styles.chipBtnActive]}>
                        <Text style={[styles.chipText, scheduledLeadMinutes === option.minutes && styles.chipTextActive]}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: organizerApproval }} onPress={() => setOrganizerApproval((current) => !current)} style={[styles.privacyNote, { backgroundColor: organizerApproval ? "#7C3AED12" : colors.background, borderColor: organizerApproval ? "#7C3AED" : colors.border }]}>
                    <Feather name={organizerApproval ? "check-square" : "square"} size={18} color={organizerApproval ? "#7C3AED" : colors.mutedForeground} />
                    <Text style={[styles.privacyNoteText, { color: colors.foreground, flex: 1 }]}>I explicitly approve sending this time-bounded request. I understand it does not verify a person, guarantee safety, or share a location.</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sendBtn, { opacity: sending || !organizerApproval ? 0.6 : 1 }]} onPress={() => void sendMeetupRequest()} disabled={sending || !organizerApproval} activeOpacity={0.85}>
                    {sending ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={16} color="#fff" />}
                    <Text style={styles.sendBtnText}>{sending ? "Sending…" : "Send verification request"}</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Non-destructive cancellation modal ── */}
      <Modal visible={!!cancelTarget} transparent animationType="fade" onRequestClose={() => setCancelTarget(null)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.card }]}>
            <View style={[styles.clearIconWrap, { backgroundColor: "#DC262618" }]}>
              <Feather name="x-circle" size={24} color="#DC2626" />
            </View>
            <Text style={[styles.centeredTitle, { color: colors.foreground }]}>Cancel meetup request</Text>
            <Text style={[styles.centeredDesc, { color: colors.mutedForeground }]}>This ends the active request without deleting its audit record. No venue or member location is retained or disclosed.</Text>
            <Text style={[styles.modalLabel, { color: colors.foreground, alignSelf: "flex-start", marginTop: 8 }]}>Reason (optional)</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, width: "100%" }]}
              placeholder="Optional private reason"
              placeholderTextColor={colors.mutedForeground}
              value={cancellationReason}
              onChangeText={setCancellationReason}
              maxLength={240}
            />
            <View style={styles.centeredActions}>
              <TouchableOpacity style={[styles.centeredCancelBtn, { borderColor: colors.border }]} onPress={() => { setCancelTarget(null); setCancellationReason(""); }} activeOpacity={0.7}>
                <Text style={[styles.centeredCancelText, { color: colors.foreground }]}>Keep request</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.centeredConfirmBtn, { opacity: cancelling ? 0.5 : 1 }]} onPress={() => void cancelMeetup()} disabled={cancelling} activeOpacity={0.85}>
                {cancelling ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.centeredConfirmText}>Cancel request</Text>}
              </TouchableOpacity>
            </View>
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

  // Pending request cards
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

  // Persist note
  persistNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  persistNoteText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, flex: 1 },

  // My meetup cards
  meetupCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  meetupCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  meetupIconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  meetupCardName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  meetupCardDate: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  meetupMeta: { paddingHorizontal: 14, paddingBottom: 10, paddingTop: 10, borderTopWidth: 1, gap: 4 },
  meetupMetaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  watcherRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1 },
  watcherText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  meetupActions: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  checkinRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1 },
  checkinBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  checkinBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  chipBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: "#D1D5DB", backgroundColor: "transparent" },
  chipBtnActive: { borderColor: "#16A34A", backgroundColor: "#16A34A18" },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#6B7280" },
  chipTextActive: { color: "#14532D" },
  privacyNote: { borderRadius: 8, borderWidth: 1, padding: 12, marginTop: 8 },
  privacyNoteText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },

  // Connection cards
  emptyCard: { borderRadius: 18, borderWidth: 1, padding: 28, alignItems: "center", gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 },
  connCard: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  connLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  avatar: { width: 44, height: 44, borderRadius: 22, flexShrink: 0 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontFamily: "Inter_700Bold", fontSize: 18 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  connName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  connSince: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  verifiedText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  verifyBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "#7C3AED18", borderWidth: 1, borderColor: "#7C3AED40", flexShrink: 0,
  },
  verifyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#7C3AED" },
  sentBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexShrink: 0,
  },
  sentText: { fontFamily: "Inter_500Medium", fontSize: 12 },

  // Meetup modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 0, maxHeight: "92%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  modalInfo: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  modalInfoText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  modalLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 12, marginBottom: 6 },
  modalInput: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11,
    fontFamily: "Inter_400Regular", fontSize: 14,
  },

  // Safety watcher section
  watcherSection: {
    borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12, gap: 0,
  },
  watcherSectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  watcherSectionTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  watcherSectionOptional: { fontFamily: "Inter_400Regular", fontSize: 12 },
  watcherSectionDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginBottom: 4 },
  selectedWatcher: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 10, borderRadius: 12, borderWidth: 1, marginTop: 6,
  },
  selectedWatcherName: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  miniAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  miniAvatarText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#7C3AED" },
  searchDropdown: {
    borderRadius: 12, borderWidth: 1, marginTop: 4, overflow: "hidden",
  },
  searchDropdownItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderBottomWidth: 1,
  },
  dropdownName: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  dropdownHandle: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },

  // Clear code section
  clearCodeSection: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12 },

  sendBtn: {
    backgroundColor: "#7C3AED", borderRadius: 14, height: 52,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16,
  },
  sendBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },

  // Clear & Share modals
  centeredOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  centeredCard: { borderRadius: 24, padding: 24, width: "100%", alignItems: "center", gap: 8 },
  clearIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  centeredTitle: { fontFamily: "Inter_700Bold", fontSize: 18, textAlign: "center" },
  centeredDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, textAlign: "center" },
  centeredMeta: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  centeredActions: { flexDirection: "row", gap: 10, marginTop: 12, width: "100%" },
  centeredCancelBtn: {
    flex: 1, height: 46, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  centeredCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  centeredConfirmBtn: {
    flex: 1, height: 46, borderRadius: 12, backgroundColor: "#DC2626",
    alignItems: "center", justifyContent: "center",
  },
  shareConfirmBtn: {
    flex: 1, height: 46, borderRadius: 12, backgroundColor: "#7C3AED",
    alignItems: "center", justifyContent: "center",
  },
  centeredConfirmText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
});
