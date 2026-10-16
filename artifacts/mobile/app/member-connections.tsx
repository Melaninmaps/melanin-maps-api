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
  otherUsername: string | null;
  otherProfileImageUrl: string | null;
  createdAt: string;
};

type MeetupVerification = {
  id: number;
  initiatorId: string;
  partnerId: string;
  status: string;
  city: string | null;
  venueName: string | null;
  scheduledFor: string | null;
  note: string | null;
  initiatedAt: string;
  confirmedAt: string | null;
  expiresAt: string;
  hasClearCode: boolean;
  safetyWatcherId: string | null;
  // Initiator identity
  initiatorFirstName: string | null;
  initiatorLastName: string | null;
  initiatorUsername: string | null;
  // Partner identity
  partnerFirstName: string | null;
  partnerLastName: string | null;
  partnerUsername: string | null;
  // Watcher identity
  watcherFirstName: string | null;
  watcherLastName: string | null;
  watcherUsername: string | null;
  // Safety check-in fields
  arrivalCheckAt: string | null;
  arrivalCheckedAt: string | null;
  arrivalCheckStatus: string | null;
  homeCheckAt: string | null;
  homeCheckedAt: string | null;
  homeCheckStatus: string | null;
  initiatorIdentity: MeetupIdentityTransparency;
  partnerIdentity: MeetupIdentityTransparency;
};

type MeetupIdentityTransparency = {
  status: "verified" | "not_verified" | "unavailable";
  memberSince: string | null;
  verifiedAt: string | null;
  message: string;
};

type TrustedSafetyContact = {
  id: string;
  contactUserId: string;
  contactName: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
};

type MeetupEligibility = {
  allowed: boolean;
  code: string;
  message: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#C9922B",
  confirmed: "#16A34A",
  declined: "#DC2626",
  reschedule_requested: "#D97706",
  cancelled: "#6B7280",
  cleared: "#6B7280",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  reschedule_requested: "Reschedule requested",
  cancelled: "Cancelled",
  cleared: "Cleared",
};

export default function MemberConnectionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [connections, setConnections] = useState<Connection[]>([]);
  const [meetups, setMeetups] = useState<MeetupVerification[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedConn, setSelectedConn] = useState<Connection | null>(null);
  const [meetupCity, setMeetupCity] = useState("");
  const [meetupLocation, setMeetupLocation] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetupNote, setMeetupNote] = useState("");
  const [clearCode, setClearCode] = useState("");
  const [trustedContacts, setTrustedContacts] = useState<TrustedSafetyContact[]>([]);
  const [selectedTrustedContactId, setSelectedTrustedContactId] = useState<string | null>(null);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [partnerIdentity, setPartnerIdentity] = useState<MeetupIdentityTransparency | null>(null);
  const [identityAcknowledged, setIdentityAcknowledged] = useState(false);
  const [confirmedIdentityAcknowledgments, setConfirmedIdentityAcknowledgments] = useState<Set<number>>(new Set());
  const [meetupEligibility, setMeetupEligibility] = useState<MeetupEligibility | null>(null);
  const [sending, setSending] = useState(false);

  // Safety check-in form state
  const [arrivalMinutes, setArrivalMinutes] = useState<number | null>(null);
  const [homeMinutes, setHomeMinutes] = useState<number | null>(null);

  // Confirm state (per-meetup loading to prevent double-tap)
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [confirmingArrivalId, setConfirmingArrivalId] = useState<number | null>(null);
  const [confirmingHomeId, setConfirmingHomeId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Clear modal state
  const [clearTarget, setClearTarget] = useState<MeetupVerification | null>(null);
  const [clearInput, setClearInput] = useState("");
  const [clearing, setClearing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const base = getApiBase();
      const [cRes, mRes, eligibilityRes, trustedContactsRes] = await Promise.all([
        fetch(`${base}/api/connections`, { headers }),
        fetch(`${base}/api/meetups`, { headers }),
        fetch(`${base}/api/meetups/eligibility`, { headers }),
        fetch(`${base}/api/meetups/trusted-contacts`, { headers }),
      ]);
      if (cRes.ok) {
        const d = await cRes.json() as { connections: Connection[] };
        setConnections((d.connections ?? []).filter((c) => c.status === "accepted"));
      }
      if (mRes.ok) {
        const d = await mRes.json() as { verifications: MeetupVerification[] };
        setMeetups(d.verifications ?? []);
      }
      if (eligibilityRes.ok) {
        setMeetupEligibility(await eligibilityRes.json() as MeetupEligibility);
      }
      if (trustedContactsRes.ok) {
        const d = await trustedContactsRes.json() as { contacts: TrustedSafetyContact[] };
        setTrustedContacts(d.contacts ?? []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { queueMicrotask(() => { void fetchData(); }); }, [fetchData]);

  const openMeetupPlanner = async (connection: Connection) => {
    setSelectedConn(connection);
    setPartnerIdentity(null);
    setIdentityAcknowledged(false);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const response = await fetch(
        `${getApiBase()}/api/meetups/partner-check?partnerId=${encodeURIComponent(connection.otherId)}&connectionId=${encodeURIComponent(String(connection.id))}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (response.ok) {
        const data = await response.json() as { identity?: MeetupIdentityTransparency };
        setPartnerIdentity(data.identity ?? null);
      }
    } catch {
      // The server requires a current status at submission; show unavailable
      // locally rather than inferring identity details from another field.
      setPartnerIdentity({
        status: "unavailable",
        memberSince: null,
        verifiedAt: null,
        message: "Identity verification status is currently unavailable to confirm. This is not a safety judgment.",
      });
    }
  };

  const sendMeetupRequest = async () => {
    if (!selectedConn) return;

    if (!meetupEligibility?.allowed) {
      Alert.alert("Meetup Verification unavailable", meetupEligibility?.message ?? "Confirm eligibility before sending a request.");
      return;
    }
    if (!safetyAcknowledged) {
      Alert.alert("Review required", "Acknowledge the safety notice before sending a meetup request.");
      return;
    }
    if (!partnerIdentity || !identityAcknowledged) {
      Alert.alert("Review required", "Review and acknowledge the connection's current identity-verification status before sending a meetup request.");
      return;
    }

    setSending(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const body: Record<string, unknown> = {
        partnerId: selectedConn.otherId,
        connectionId: selectedConn.id,
        city: meetupCity.trim() || undefined,
        venueName: meetupLocation.trim() || undefined,
        scheduledFor: scheduledAt.trim() ? new Date(scheduledAt.trim()).toISOString() : undefined,
        note: meetupNote.trim() || undefined,
        clearCode: clearCode.trim() || undefined,
        trustedSafetyContactId: selectedTrustedContactId ?? undefined,
        arrivalCheckAt: arrivalMinutes != null ? new Date(Date.now() + arrivalMinutes * 60000).toISOString() : undefined,
        homeCheckAt: homeMinutes != null ? new Date(Date.now() + homeMinutes * 60000).toISOString() : undefined,
        acknowledgedSafetyNotice: true,
        acknowledgedPartnerIdentityStatus: partnerIdentity.status,
      };
      const res = await fetch(`${getApiBase()}/api/meetups`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json() as { verification?: MeetupVerification; error?: string };
      if (res.ok && d.verification) {
        setMeetups((prev) => [d.verification!, ...prev]);
        resetModal();
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const name = connName(selectedConn);
        const watcherNote = selectedTrustedContactId
          ? " Your selected trusted contact will only be notified if a scheduled check-in is missed."
          : "";
        Alert.alert(
          "Verification Sent ✓",
          `${name} will receive a meetup request. Once they confirm, the plan is confirmed—Meetup Verification is not a guarantee of safety.${watcherNote}`,
        );
      } else {
        Alert.alert("Error", d.error ?? "Failed to send verification.");
      }
    } finally { setSending(false); }
  };

  const confirmMeetup = async (meetup: MeetupVerification) => {
    if (!confirmedIdentityAcknowledgments.has(meetup.id)) {
      Alert.alert("Review required", "Review and acknowledge the requester's current identity-verification status before confirming.");
      return;
    }
    if (confirmingId !== null) return;
    setConfirmingId(meetup.id);
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/meetups/${meetup.id}/respond`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          acknowledgedPartnerIdentityStatus: meetup.initiatorIdentity.status,
        }),
      });
      const d = await res.json() as { verification?: MeetupVerification; error?: string };
      if (res.ok && d.verification) {
        setMeetups((prev) => prev.map((m) => m.id === meetup.id ? { ...m, ...d.verification! } : m));
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Error", d.error ?? "Failed to confirm meetup.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setConfirmingId(null);
    }
  };

  const respondToMeetup = async (id: number, action: "decline" | "request_reschedule") => {
    if (confirmingId !== null) return;
    setConfirmingId(id);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/meetups/${id}/respond`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await res.json() as { verification?: MeetupVerification; error?: string };
      if (res.ok && d.verification) {
        setMeetups((prev) => prev.map((m) => m.id === id ? { ...m, ...d.verification! } : m));
        Alert.alert(
          action === "decline" ? "Meetup Declined" : "Reschedule Requested",
          action === "decline" ? "The request has been declined." : "The other member can now share new optional public-meeting details.",
        );
      } else {
        Alert.alert("Error", d.error ?? "Failed to update meetup request.");
      }
    } catch { Alert.alert("Error", "Network error. Please try again."); }
    finally { setConfirmingId(null); }
  };

  const cancelMeetup = (id: number) => {
    Alert.alert(
      "Cancel Meetup Request?",
      "This removes consent to the meetup plan for both participants.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Meetup",
          style: "destructive",
          onPress: async () => {
            setCancellingId(id);
            try {
              const token = await SecureStore.getItemAsync("auth_session_token");
              const res = await fetch(`${getApiBase()}/api/meetups/${id}/cancel`, {
                method: "PATCH", headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json() as { verification?: MeetupVerification; error?: string };
              if (!res.ok || !data.verification) throw new Error(data.error ?? "Could not cancel meetup request.");
              setMeetups((prev) => prev.map((meetup) => meetup.id === id ? { ...meetup, ...data.verification! } : meetup));
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert("Could not cancel", error instanceof Error ? error.message : "Please try again.");
            } finally { setCancellingId(null); }
          },
        },
      ],
    );
  };

  const clearMeetup = async () => {
    if (!clearTarget) return;
    setClearing(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/meetups/${clearTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ clearCode: clearInput.trim() || undefined }),
      });
      const d = await res.json() as { success?: boolean; error?: string };
      if (res.ok && d.success) {
        setMeetups((prev) => prev.filter((m) => m.id !== clearTarget.id));
        setClearTarget(null);
        setClearInput("");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Cannot Clear", d.error ?? "Failed to clear this meetup record.");
      }
    } finally { setClearing(false); }
  };

  const confirmArrivalCheckin = async (id: number) => {
    if (confirmingArrivalId !== null) return;
    setConfirmingArrivalId(id);
    try {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/meetups/${id}/arrival-checkin`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json() as { verification?: MeetupVerification; error?: string };
      if (res.ok && d.verification) {
        setMeetups((prev) => prev.map((m) => m.id === id ? { ...m, ...d.verification! } : m));
        Alert.alert("Arrival Confirmed", "Your arrival check-in is confirmed. Your selected trusted contact will not be alerted.");
      } else {
        Alert.alert("Error", d.error ?? "Failed to confirm arrival.");
      }
    } catch { Alert.alert("Error", "Network error. Please try again."); }
    finally { setConfirmingArrivalId(null); }
  };

  const confirmHomeCheckin = async (id: number) => {
    if (confirmingHomeId !== null) return;
    setConfirmingHomeId(id);
    try {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/meetups/${id}/home-checkin`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json() as { verification?: MeetupVerification; error?: string };
      if (res.ok && d.verification) {
        setMeetups((prev) => prev.map((m) => m.id === id ? { ...m, ...d.verification! } : m));
        Alert.alert("Home Safe ✓", "Your home check-in is confirmed. Stay safe out there!");
      } else {
        Alert.alert("Error", d.error ?? "Failed to confirm home check-in.");
      }
    } catch { Alert.alert("Error", "Network error. Please try again."); }
    finally { setConfirmingHomeId(null); }
  };

  const resetModal = () => {
    setSelectedConn(null);
    setPartnerIdentity(null);
    setIdentityAcknowledged(false);
    setMeetupCity("");
    setMeetupLocation("");
    setScheduledAt("");
    setMeetupNote("");
    setClearCode("");
    setSelectedTrustedContactId(null);
    setSafetyAcknowledged(false);
    setArrivalMinutes(null);
    setHomeMinutes(null);
  };

  const acceptedConnections = connections.filter((c) => c.status === "accepted");
  const pendingForMe = meetups.filter((m) => m.status === "pending" && m.partnerId === user?.id);
  const myMeetups = meetups.filter((m) => m.initiatorId === user?.id || (m.partnerId === user?.id && m.status !== "pending"));

  const connName = (c: Connection) =>
    [c.otherFirstName, c.otherLastName].filter(Boolean).join(" ") ||
    (c.otherUsername ? `@${c.otherUsername}` : "Member");

  // Returns the OTHER person's display name relative to the current user
  const meetupOtherName = (m: MeetupVerification) => {
    if (m.initiatorId === user?.id) {
      return [m.partnerFirstName, m.partnerLastName].filter(Boolean).join(" ") ||
        (m.partnerUsername ? `@${m.partnerUsername}` : "Connection");
    }
    return [m.initiatorFirstName, m.initiatorLastName].filter(Boolean).join(" ") ||
      (m.initiatorUsername ? `@${m.initiatorUsername}` : "Connection");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const identityStatusLabel = (identity: MeetupIdentityTransparency) => {
    if (identity.status === "verified") return "Identity Verified";
    if (identity.status === "not_verified") return "Identity verification not complete";
    return "Identity verification currently unavailable";
  };

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

          {/* ── Pending requests from others ── */}
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
                        {meetupOtherName(m)} wants to verify a meetup
                      </Text>
                      {(m.city || m.venueName) && (
                        <Text style={[styles.requestMeta, { color: "#1E40AF" }]}>📍 {[m.venueName, m.city].filter(Boolean).join(" · ")}</Text>
                      )}
                      {m.note && (
                        <Text style={[styles.requestMeta, { color: "#1E40AF" }]}>&quot;{m.note}&quot;</Text>
                      )}
                      <Text style={[styles.requestMeta, { color: "#6B7280" }]}>
                        Sent {formatDateTime(m.initiatedAt)}
                      </Text>
                      <View style={[styles.privacyNote, { marginTop: 8, backgroundColor: "#FFFFFF", borderColor: "#BFDBFE" }]}>
                        <Feather name={m.initiatorIdentity.status === "verified" ? "check-circle" : "info"} size={14} color="#1D4ED8" />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.privacyNoteText, { color: "#1E3A8A" }]}>{identityStatusLabel(m.initiatorIdentity)}</Text>
                          {m.initiatorIdentity.memberSince && <Text style={[styles.requestMeta, { color: "#1E40AF" }]}>Member since {formatDate(m.initiatorIdentity.memberSince)}</Text>}
                          {m.initiatorIdentity.verifiedAt && <Text style={[styles.requestMeta, { color: "#1E40AF" }]}>Verified {formatDate(m.initiatorIdentity.verifiedAt)}</Text>}
                          <Text style={[styles.requestMeta, { color: "#1E40AF" }]}>{m.initiatorIdentity.message}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setConfirmedIdentityAcknowledgments((current) => {
                      const next = new Set(current);
                      if (next.has(m.id)) next.delete(m.id); else next.add(m.id);
                      return next;
                    })}
                    style={[styles.privacyNote, { marginTop: 10, backgroundColor: confirmedIdentityAcknowledgments.has(m.id) ? "#16A34A10" : "#FFF7ED", borderColor: confirmedIdentityAcknowledgments.has(m.id) ? "#16A34A40" : "#FB923C50" }]}
                    activeOpacity={0.75}
                  >
                    <Feather name={confirmedIdentityAcknowledgments.has(m.id) ? "check-square" : "square"} size={16} color={confirmedIdentityAcknowledgments.has(m.id) ? "#16A34A" : "#C2410C"} />
                    <Text style={[styles.privacyNoteText, { color: colors.foreground, flex: 1 }]}>I reviewed this member's current identity-verification status. It is informational and not a safety guarantee.</Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.confirmBtn, { flex: 1, opacity: confirmingId === m.id ? 0.6 : 1 }]}
                      onPress={() => void confirmMeetup(m)}
                      disabled={confirmingId !== null || !confirmedIdentityAcknowledgments.has(m.id)}
                      activeOpacity={0.85}
                    >
                      {confirmingId === m.id ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="check" size={14} color="#fff" />}
                      <Text style={styles.confirmBtnText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { flex: 1, backgroundColor: "#F59E0B12", borderColor: "#F59E0B40" }]}
                      onPress={() => void respondToMeetup(m.id, "request_reschedule")}
                      disabled={confirmingId !== null}
                    >
                      <Text style={[styles.actionBtnText, { color: "#92400E" }]}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { flex: 1, backgroundColor: "#DC262612", borderColor: "#DC262630" }]}
                      onPress={() => void respondToMeetup(m.id, "decline")}
                      disabled={confirmingId !== null}
                    >
                      <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── My sent meetup verifications ── */}
          {myMeetups.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Meetup Verifications</Text>
              <View style={[styles.persistNote, { backgroundColor: "#7C3AED0A", borderColor: "#7C3AED30" }]}>
                <Feather name="shield" size={13} color="#7C3AED" />
                <Text style={[styles.persistNoteText, { color: colors.mutedForeground }]}>
                  Records expire after 90 days. You can clear your record earlier with your clear code.
                </Text>
              </View>
              {myMeetups.map((m) => {
                const statusColor = STATUS_COLORS[m.status] ?? "#6B7280";
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.meetupCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      m.status === "confirmed" && { borderColor: "#BBF7D0" },
                    ]}
                  >
                    {/* Card header */}
                    <View style={styles.meetupCardHeader}>
                      <View style={[styles.meetupIconWrap, { backgroundColor: statusColor + "18" }]}>
                        <Feather
                          name={m.status === "confirmed" ? "shield" : "user-check"}
                          size={15}
                          color={statusColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.meetupCardName, { color: colors.foreground }]}>
                          {meetupOtherName(m)}
                        </Text>
                        <Text style={[styles.meetupCardDate, { color: colors.mutedForeground }]}>
                          {formatDateTime(m.initiatedAt)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {STATUS_LABELS[m.status] ?? m.status}
                        </Text>
                      </View>
                    </View>

                    {/* Details */}
                    {(m.city || m.venueName || m.scheduledFor || m.note) && (
                      <View style={[styles.meetupMeta, { borderTopColor: colors.border }]}>
                        {(m.city || m.venueName) && (
                          <Text style={[styles.meetupMetaText, { color: colors.mutedForeground }]}>
                            📍 {[m.venueName, m.city].filter(Boolean).join(" · ")}
                          </Text>
                        )}
                        {m.scheduledFor && (
                          <Text style={[styles.meetupMetaText, { color: colors.mutedForeground }]}>🗓 {formatDateTime(m.scheduledFor)}</Text>
                        )}
                        {m.note && (
                          <Text style={[styles.meetupMetaText, { color: colors.mutedForeground }]}>
                            📝 {m.note}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Safety watcher info */}
                    {m.watcherUsername && (
                      <View style={[styles.watcherRow, { borderTopColor: colors.border, backgroundColor: "#7C3AED08" }]}>
                        <Feather name="eye" size={12} color="#7C3AED" />
                        <Text style={[styles.watcherText, { color: "#7C3AED" }]}>
                          Trusted contact: @{m.watcherUsername}
                        </Text>
                      </View>
                    )}

                    {/* Action row */}
                    <View style={[styles.meetupActions, { borderTopColor: colors.border }]}>
                      {!['cancelled', 'declined'].includes(m.status) && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: "#DC262612", borderColor: "#DC262630" }]}
                          onPress={() => cancelMeetup(m.id)}
                          disabled={cancellingId === m.id}
                          activeOpacity={0.7}
                        >
                          {cancellingId === m.id ? <ActivityIndicator size="small" color="#DC2626" /> : <Feather name="x-circle" size={13} color="#DC2626" />}
                          <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                      {/* The initiator can also remove the retained personal record early. */}
                      {m.initiatorId === user?.id && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#DC262612", borderColor: "#DC262630" }]}
                        onPress={() => {
                          setClearTarget(m);
                          setClearInput("");
                        }}
                        activeOpacity={0.7}
                      >
                        <Feather name="trash-2" size={13} color="#DC2626" />
                        <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>
                          {m.hasClearCode ? "Clear (Code)" : "Clear"}
                        </Text>
                      </TouchableOpacity>
                      )}
                    </View>

                    {/* Safety check-in action buttons — only for the initiator */}
                    {m.initiatorId === user?.id && (m.arrivalCheckStatus === "pending" || m.homeCheckStatus === "pending") && (
                      <View style={[styles.checkinRow, { borderTopColor: colors.border }]}>
                        {m.arrivalCheckStatus === "pending" && (
                          <TouchableOpacity
                            style={[styles.checkinBtn, { backgroundColor: "#CA922B12", borderColor: "#CA922B30" }]}
                            onPress={() => void confirmArrivalCheckin(m.id)}
                            disabled={confirmingArrivalId === m.id}
                            activeOpacity={0.75}
                          >
                            {confirmingArrivalId === m.id ? (
                              <ActivityIndicator size="small" color="#CA922B" />
                            ) : (
                              <>
                                <Text style={{ fontSize: 12 }}>📍</Text>
                                <Text style={[styles.checkinBtnText, { color: "#92400E" }]}>I Arrived ✓</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                        {m.homeCheckStatus === "pending" && (
                          <TouchableOpacity
                            style={[styles.checkinBtn, { backgroundColor: "#16A34A12", borderColor: "#16A34A30" }]}
                            onPress={() => void confirmHomeCheckin(m.id)}
                            disabled={confirmingHomeId === m.id}
                            activeOpacity={0.75}
                          >
                            {confirmingHomeId === m.id ? (
                              <ActivityIndicator size="small" color="#16A34A" />
                            ) : (
                              <>
                                <Text style={{ fontSize: 12 }}>🏠</Text>
                                <Text style={[styles.checkinBtnText, { color: "#14532D" }]}>I&apos;m Home ✓</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
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
                const hasPendingRequest = myMeetups.some(
                  (m) => m.partnerId === c.otherId && m.status === "pending"
                );
                const isVerified = myMeetups.some(
                  (m) => m.partnerId === c.otherId && m.status === "confirmed"
                ) || meetups.some(
                  (m) => m.initiatorId === c.otherId && m.status === "confirmed"
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
                          void openMeetupPlanner(c);
                          setMeetupCity("");
                          setMeetupLocation("");
                          setScheduledAt("");
                          setMeetupNote("");
                          setClearCode("");
                          setSelectedTrustedContactId(null);
                          setSafetyAcknowledged(false);
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
                    <Text style={[styles.modalInfoText, { color: colors.foreground }]}>
                      Sending a verification request to{" "}
                      <Text style={{ fontFamily: "Inter_700Bold" }}>{connName(selectedConn)}</Text>.
                      Either member can decline or cancel at any time. Meetup Verification is not a safety guarantee.
                    </Text>
                  </View>

                  {partnerIdentity ? (
                    <View style={[styles.watcherSection, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
                      <View style={styles.watcherSectionHeader}>
                        <Feather name={partnerIdentity.status === "verified" ? "check-circle" : "info"} size={14} color="#1D4ED8" />
                        <Text style={[styles.watcherSectionTitle, { color: "#1D4ED8" }]}>{identityStatusLabel(partnerIdentity)}</Text>
                      </View>
                      {partnerIdentity.memberSince && <Text style={[styles.watcherSectionDesc, { color: colors.mutedForeground }]}>Member since {formatDate(partnerIdentity.memberSince)}</Text>}
                      {partnerIdentity.verifiedAt && <Text style={[styles.watcherSectionDesc, { color: colors.mutedForeground }]}>Identity verified {formatDate(partnerIdentity.verifiedAt)}</Text>}
                      <Text style={[styles.watcherSectionDesc, { color: colors.mutedForeground }]}>{partnerIdentity.message}</Text>
                    </View>
                  ) : (
                    <View style={[styles.watcherSection, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}>
                      <Text style={[styles.watcherSectionDesc, { color: colors.mutedForeground }]}>Loading the connection&apos;s current identity-verification status…</Text>
                    </View>
                  )}

                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>City or area (optional)</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="e.g. Downtown Atlanta"
                    placeholderTextColor={colors.mutedForeground}
                    value={meetupCity}
                    onChangeText={setMeetupCity}
                  />

                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Public venue name (optional)</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="e.g. Busy Bean Coffee — no street address"
                    placeholderTextColor={colors.mutedForeground}
                    value={meetupLocation}
                    onChangeText={setMeetupLocation}
                  />

                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Meeting time (optional)</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="e.g. 2026-10-19T15:00:00-04:00"
                    placeholderTextColor={colors.mutedForeground}
                    value={scheduledAt}
                    onChangeText={setScheduledAt}
                    autoCapitalize="none"
                  />

                  {/* Note */}
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Note (optional)</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="e.g. First time meeting, told my roommate"
                    placeholderTextColor={colors.mutedForeground}
                    value={meetupNote}
                    onChangeText={setMeetupNote}
                  />

                  {/* Existing Safety Hub contacts only — never collect a new email here. */}
                  <View style={[styles.watcherSection, { backgroundColor: "#7C3AED06", borderColor: "#7C3AED25" }]}>
                    <View style={styles.watcherSectionHeader}>
                      <Feather name="shield" size={14} color="#7C3AED" />
                      <Text style={[styles.watcherSectionTitle, { color: "#7C3AED" }]}>Trusted contact</Text>
                      <Text style={[styles.watcherSectionOptional, { color: colors.mutedForeground }]}>(optional)</Text>
                    </View>
                    <Text style={[styles.watcherSectionDesc, { color: colors.mutedForeground }]}>
                      Select an accepted Safety Hub contact. They are notified only if you miss a scheduled check-in; your partner is never notified.
                    </Text>
                    {trustedContacts.length === 0 ? (
                      <Text style={[styles.watcherSectionDesc, { color: colors.mutedForeground }]}>Set up an accepted trusted contact in Safety Hub first.</Text>
                    ) : trustedContacts.map((contact) => {
                      const selected = selectedTrustedContactId === contact.id;
                      const label = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.contactName || contact.username || "Trusted contact";
                      return (
                        <TouchableOpacity
                          key={contact.id}
                          onPress={() => setSelectedTrustedContactId(selected ? null : contact.id)}
                          style={[styles.selectedWatcher, { backgroundColor: selected ? "#7C3AED12" : colors.background, borderColor: selected ? "#7C3AED40" : colors.border }]}
                          activeOpacity={0.75}
                        >
                          <Feather name={selected ? "check-circle" : "circle"} size={16} color="#7C3AED" />
                          <Text style={[styles.selectedWatcherName, { color: colors.foreground }]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Clear Code */}
                  <View style={[styles.clearCodeSection, { backgroundColor: "#DC262608", borderColor: "#DC262625" }]}>
                    <View style={styles.watcherSectionHeader}>
                      <Feather name="lock" size={14} color="#DC2626" />
                      <Text style={[styles.watcherSectionTitle, { color: "#DC2626" }]}>Clear Code</Text>
                      <Text style={[styles.watcherSectionOptional, { color: colors.mutedForeground }]}>(optional but recommended)</Text>
                    </View>
                    <Text style={[styles.watcherSectionDesc, { color: colors.mutedForeground }]}>
                      Set a PIN or passphrase required to delete this record later. If left blank, you can clear it freely.
                    </Text>
                    <TextInput
                      style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      placeholder="e.g. 1234 or a word you'll remember"
                      placeholderTextColor={colors.mutedForeground}
                      value={clearCode}
                      onChangeText={setClearCode}
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Safety Check-In Times */}
                  <View style={[styles.watcherSection, { backgroundColor: "#16A34A06", borderColor: "#16A34A25", marginTop: 12 }]}>
                    <View style={styles.watcherSectionHeader}>
                      <Text style={{ fontSize: 14 }}>🛡️</Text>
                      <Text style={[styles.watcherSectionTitle, { color: "#16A34A" }]}>Safety Check-In Times</Text>
                      <Text style={[styles.watcherSectionOptional, { color: colors.mutedForeground }]}>(optional)</Text>
                    </View>
                    <Text style={[styles.watcherSectionDesc, { color: colors.mutedForeground }]}>
                      Set check-in windows for your meetup. A trusted friend (not the person you&apos;re meeting) is alerted only if you miss them.
                    </Text>

                    <Text style={[styles.modalLabel, { color: colors.foreground, marginTop: 8 }]}>📍 I&apos;ll arrive in…</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      {[{ label: "30 min", minutes: 30 }, { label: "1 hr", minutes: 60 }, { label: "1.5 hrs", minutes: 90 }, { label: "2 hrs", minutes: 120 }, { label: "3 hrs", minutes: 180 }].map((opt) => (
                        <TouchableOpacity
                          key={opt.minutes}
                          onPress={() => setArrivalMinutes(arrivalMinutes === opt.minutes ? null : opt.minutes)}
                          style={[styles.chipBtn, arrivalMinutes === opt.minutes && styles.chipBtnActive]}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.chipText, arrivalMinutes === opt.minutes && styles.chipTextActive]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.modalLabel, { color: colors.foreground }]}>🏠 I&apos;ll be home in…</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      {[{ label: "2 hrs", minutes: 120 }, { label: "3 hrs", minutes: 180 }, { label: "4 hrs", minutes: 240 }, { label: "5 hrs", minutes: 300 }, { label: "6 hrs", minutes: 360 }, { label: "8 hrs", minutes: 480 }].map((opt) => (
                        <TouchableOpacity
                          key={opt.minutes}
                          onPress={() => setHomeMinutes(homeMinutes === opt.minutes ? null : opt.minutes)}
                          style={[styles.chipBtn, homeMinutes === opt.minutes && styles.chipBtnActive]}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.chipText, homeMinutes === opt.minutes && styles.chipTextActive]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {(arrivalMinutes != null || homeMinutes != null) && !selectedTrustedContactId && (
                      <View style={[styles.privacyNote, { backgroundColor: "#7C3AED08", borderColor: "#7C3AED25" }]}>
                        <Text style={[styles.privacyNoteText, { color: "#5B21B6" }]}>
                          Select an accepted trusted contact above to receive a missed-check-in alert. Your meetup partner will never be notified.
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => setSafetyAcknowledged((value) => !value)}
                    style={[styles.privacyNote, { backgroundColor: safetyAcknowledged ? "#16A34A10" : "#DC262608", borderColor: safetyAcknowledged ? "#16A34A40" : "#DC262630" }]}
                    activeOpacity={0.75}
                  >
                    <Feather name={safetyAcknowledged ? "check-square" : "square"} size={16} color={safetyAcknowledged ? "#16A34A" : "#DC2626"} />
                    <Text style={[styles.privacyNoteText, { color: colors.foreground, flex: 1 }]}>I understand this is voluntary, I should meet in a public setting, and Meetup Verification is not a guarantee of safety.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIdentityAcknowledged((value) => !value)}
                    disabled={!partnerIdentity}
                    style={[styles.privacyNote, { backgroundColor: identityAcknowledged ? "#16A34A10" : "#EFF6FF", borderColor: identityAcknowledged ? "#16A34A40" : "#BFDBFE", opacity: partnerIdentity ? 1 : 0.55 }]}
                    activeOpacity={0.75}
                  >
                    <Feather name={identityAcknowledged ? "check-square" : "square"} size={16} color={identityAcknowledged ? "#16A34A" : "#1D4ED8"} />
                    <Text style={[styles.privacyNoteText, { color: colors.foreground, flex: 1 }]}>I reviewed this member&apos;s current identity-verification status. It is informational and not a safety guarantee.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sendBtn, { opacity: (sending || !safetyAcknowledged || !identityAcknowledged || !partnerIdentity || !meetupEligibility?.allowed) ? 0.6 : 1 }]}
                    onPress={() => void sendMeetupRequest()}
                    disabled={sending || !safetyAcknowledged || !identityAcknowledged || !partnerIdentity || !meetupEligibility?.allowed}
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Clear Record Modal ── */}
      <Modal visible={!!clearTarget} transparent animationType="fade" onRequestClose={() => setClearTarget(null)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.card }]}>
            <View style={[styles.clearIconWrap, { backgroundColor: "#DC262618" }]}>
              <Feather name="trash-2" size={24} color="#DC2626" />
            </View>
            <Text style={[styles.centeredTitle, { color: colors.foreground }]}>Clear Meetup Record</Text>
            <Text style={[styles.centeredDesc, { color: colors.mutedForeground }]}>
              {clearTarget?.hasClearCode
                ? "Enter the clear code you set when creating this meetup to permanently remove this record."
                : "This will permanently remove this meetup record. This cannot be undone."}
            </Text>
            {(clearTarget?.city || clearTarget?.venueName) && (
              <Text style={[styles.centeredMeta, { color: colors.mutedForeground }]}>📍 {[clearTarget.venueName, clearTarget.city].filter(Boolean).join(" · ")}</Text>
            )}
            {clearTarget?.hasClearCode && (
              <TextInput
                style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, marginTop: 12, width: "100%" }]}
                placeholder="Enter your clear code"
                placeholderTextColor={colors.mutedForeground}
                value={clearInput}
                onChangeText={setClearInput}
                autoCapitalize="none"
                secureTextEntry
                autoFocus
              />
            )}
            <View style={styles.centeredActions}>
              <TouchableOpacity
                style={[styles.centeredCancelBtn, { borderColor: colors.border }]}
                onPress={() => { setClearTarget(null); setClearInput(""); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.centeredCancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.centeredConfirmBtn, { opacity: (clearing || (clearTarget?.hasClearCode && !clearInput.trim())) ? 0.5 : 1 }]}
                onPress={() => void clearMeetup()}
                disabled={clearing || (clearTarget?.hasClearCode ? !clearInput.trim() : false)}
                activeOpacity={0.85}
              >
                {clearing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.centeredConfirmText}>Clear Record</Text>
                )}
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
