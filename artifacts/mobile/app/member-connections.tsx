import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  location: string | null;
  note: string | null;
  initiatedAt: string;
  confirmedAt: string | null;
  expiresAt: string;
  hasClearCode: boolean;
  safetyWatcherEmail: string | null;
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
  safetyFriendName: string | null;
  safetyFriendEmail: string | null;
};

type UserSearchResult = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#C9922B",
  confirmed: "#16A34A",
  cleared: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "✓ Verified",
  cleared: "Cleared",
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

  // Modal state
  const [selectedConn, setSelectedConn] = useState<Connection | null>(null);
  const [meetupLocation, setMeetupLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [meetupNote, setMeetupNote] = useState("");
  const [clearCode, setClearCode] = useState("");
  const [watcherEmail, setWatcherEmail] = useState("");
  const [watcherSearch, setWatcherSearch] = useState("");
  const [watcherResults, setWatcherResults] = useState<UserSearchResult[]>([]);
  const [selectedWatcher, setSelectedWatcher] = useState<UserSearchResult | null>(null);
  const [searchingWatcher, setSearchingWatcher] = useState(false);
  const [sending, setSending] = useState(false);

  // Safety check-in form state
  const [arrivalMinutes, setArrivalMinutes] = useState<number | null>(null);
  const [homeMinutes, setHomeMinutes] = useState<number | null>(null);
  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");

  // Confirm state (per-meetup loading to prevent double-tap)
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [confirmingArrivalId, setConfirmingArrivalId] = useState<number | null>(null);
  const [confirmingHomeId, setConfirmingHomeId] = useState<number | null>(null);

  // Clear modal state
  const [clearTarget, setClearTarget] = useState<MeetupVerification | null>(null);
  const [clearInput, setClearInput] = useState("");
  const [clearing, setClearing] = useState(false);

  // Share modal state
  const [shareTarget, setShareTarget] = useState<MeetupVerification | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);

  const watcherSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Debounced watcher search
  const handleWatcherSearch = (text: string) => {
    setWatcherSearch(text);
    setSelectedWatcher(null);
    if (watcherSearchTimer.current) clearTimeout(watcherSearchTimer.current);
    if (!text.trim() || text.trim().length < 2) { setWatcherResults([]); return; }
    watcherSearchTimer.current = setTimeout(async () => {
      setSearchingWatcher(true);
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const res = await fetch(`${getApiBase()}/api/users/search?q=${encodeURIComponent(text.trim())}`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        if (res.ok) {
          const d = await res.json() as { users: UserSearchResult[] };
          // Exclude the meetup partner from watcher results
          setWatcherResults((d.users ?? []).filter((u) => u.id !== selectedConn?.otherId));
        }
      } finally { setSearchingWatcher(false); }
    }, 400);
  };

  const sendMeetupRequest = async () => {
    if (!selectedConn) return;
    setSending(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const body: Record<string, unknown> = {
        partnerId: selectedConn.otherId,
        connectionId: selectedConn.id,
        location: meetupLocation.trim() || undefined,
        note: meetupNote.trim() || undefined,
        clearCode: clearCode.trim() || undefined,
        safetyWatcherId: selectedWatcher?.id || undefined,
        safetyWatcherEmail: watcherEmail.trim() || undefined,
        arrivalCheckAt: arrivalMinutes != null ? new Date(Date.now() + arrivalMinutes * 60000).toISOString() : undefined,
        homeCheckAt: homeMinutes != null ? new Date(Date.now() + homeMinutes * 60000).toISOString() : undefined,
        safetyFriendName: friendName.trim() || undefined,
        safetyFriendEmail: friendEmail.trim() || undefined,
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
        const watcherNote = selectedWatcher
          ? ` Your safety watcher @${selectedWatcher.username ?? "member"} has been notified.`
          : watcherEmail.trim()
            ? ` A safety alert has been sent to ${watcherEmail.trim()}.`
            : "";
        Alert.alert(
          "Verification Sent ✓",
          `${name} will receive a meetup verification request. Once they confirm, you're both verified.${watcherNote}`,
        );
      } else {
        Alert.alert("Error", d.error ?? "Failed to send verification.");
      }
    } finally { setSending(false); }
  };

  const confirmMeetup = async (id: number) => {
    if (confirmingId !== null) return;
    setConfirmingId(id);
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/meetups/${id}/confirm`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json() as { verification?: MeetupVerification; error?: string };
      if (res.ok && d.verification) {
        setMeetups((prev) => prev.map((m) => m.id === id ? d.verification! : m));
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
        setMeetups((prev) => prev.map((m) => m.id === id ? d.verification! : m));
        Alert.alert("Arrived Safely ✓", "Your arrival is confirmed. Your safety friend will not be alerted.");
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
        setMeetups((prev) => prev.map((m) => m.id === id ? d.verification! : m));
        Alert.alert("Home Safe ✓", "Your home check-in is confirmed. Stay safe out there!");
      } else {
        Alert.alert("Error", d.error ?? "Failed to confirm home check-in.");
      }
    } catch { Alert.alert("Error", "Network error. Please try again."); }
    finally { setConfirmingHomeId(null); }
  };

  const shareMeetup = async () => {
    if (!shareTarget) return;
    setSharing(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/meetups/${shareTarget.id}/share`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail.trim() || undefined }),
      });
      const d = await res.json() as { success?: boolean; error?: string };
      if (res.ok && d.success) {
        setShareTarget(null);
        setShareEmail("");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Details Shared ✓", "A safety alert email has been sent to your watcher.");
      } else {
        Alert.alert("Error", d.error ?? "Failed to share meetup details.");
      }
    } finally { setSharing(false); }
  };

  const resetModal = () => {
    setSelectedConn(null);
    setMeetupLocation("");
    setMeetupNote("");
    setClearCode("");
    setWatcherEmail("");
    setWatcherSearch("");
    setWatcherResults([]);
    setSelectedWatcher(null);
    setArrivalMinutes(null);
    setHomeMinutes(null);
    setFriendName("");
    setFriendEmail("");
  };

  const acceptedConnections = connections.filter((c) => c.status === "accepted");
  const pendingForMe = meetups.filter((m) => m.status === "pending" && m.partnerId === user?.id);
  const myMeetups = meetups.filter((m) => m.initiatorId === user?.id);

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
                      {m.location && (
                        <Text style={[styles.requestMeta, { color: "#1E40AF" }]}>📍 {m.location}</Text>
                      )}
                      {m.note && (
                        <Text style={[styles.requestMeta, { color: "#1E40AF" }]}>"{m.note}"</Text>
                      )}
                      <Text style={[styles.requestMeta, { color: "#6B7280" }]}>
                        Sent {formatDateTime(m.initiatedAt)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { opacity: confirmingId === m.id ? 0.6 : 1 }]}
                    onPress={() => void confirmMeetup(m.id)}
                    disabled={confirmingId !== null}
                    activeOpacity={0.85}
                  >
                    {confirmingId === m.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Feather name="check" size={14} color="#fff" />}
                    <Text style={styles.confirmBtnText}>
                      {confirmingId === m.id ? "Confirming…" : "Confirm Meetup"}
                    </Text>
                  </TouchableOpacity>
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
                  Records are kept permanently for your safety. Clear them with your code when you're done.
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
                    {(m.location || m.note) && (
                      <View style={[styles.meetupMeta, { borderTopColor: colors.border }]}>
                        {m.location && (
                          <Text style={[styles.meetupMetaText, { color: colors.mutedForeground }]}>
                            📍 {m.location}
                          </Text>
                        )}
                        {m.note && (
                          <Text style={[styles.meetupMetaText, { color: colors.mutedForeground }]}>
                            📝 {m.note}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Safety watcher info */}
                    {(m.safetyWatcherEmail || m.watcherUsername) && (
                      <View style={[styles.watcherRow, { borderTopColor: colors.border, backgroundColor: "#7C3AED08" }]}>
                        <Feather name="eye" size={12} color="#7C3AED" />
                        <Text style={[styles.watcherText, { color: "#7C3AED" }]}>
                          Watcher: {m.watcherUsername ? `@${m.watcherUsername}` : m.safetyWatcherEmail}
                        </Text>
                      </View>
                    )}

                    {/* Action row */}
                    <View style={[styles.meetupActions, { borderTopColor: colors.border }]}>
                      {/* Share / re-notify watcher */}
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#7C3AED12", borderColor: "#7C3AED30" }]}
                        onPress={() => {
                          setShareTarget(m);
                          setShareEmail(m.safetyWatcherEmail ?? "");
                        }}
                        activeOpacity={0.7}
                      >
                        <Feather name="share-2" size={13} color="#7C3AED" />
                        <Text style={[styles.actionBtnText, { color: "#7C3AED" }]}>Share Details</Text>
                      </TouchableOpacity>

                      {/* Clear record */}
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
                                <Text style={[styles.checkinBtnText, { color: "#14532D" }]}>I'm Home ✓</Text>
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
                          setSelectedConn(c);
                          setMeetupLocation("");
                          setMeetupNote("");
                          setClearCode("");
                          setWatcherEmail("");
                          setWatcherSearch("");
                          setWatcherResults([]);
                          setSelectedWatcher(null);
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
                      Once they confirm, you're both marked as verified.
                    </Text>
                  </View>

                  {/* Location */}
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Location (optional)</Text>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 2 }}>
                    <TextInput
                      style={[styles.modalInput, { flex: 1, marginBottom: 0, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      placeholder="e.g. Busy Bean Coffee, Downtown Atlanta"
                      placeholderTextColor={colors.mutedForeground}
                      value={meetupLocation}
                      onChangeText={setMeetupLocation}
                    />
                    <TouchableOpacity
                      onPress={async () => {
                        setLocating(true);
                        try {
                          const { status } = await Location.requestForegroundPermissionsAsync();
                          if (status !== "granted") { Alert.alert("Location Access", "Enable location in Settings to use this feature."); return; }
                          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                          const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                          if (geo) {
                            const parts = [geo.streetNumber, geo.street, geo.city, geo.region].filter(Boolean);
                            setMeetupLocation(parts.join(", "));
                          }
                        } catch { Alert.alert("Location Error", "Could not get your location. Try again."); }
                        finally { setLocating(false); }
                      }}
                      disabled={locating}
                      style={{ padding: 10, borderRadius: 10, backgroundColor: "#7C3AED", opacity: locating ? 0.6 : 1 }}
                    >
                      {locating
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Feather name="navigation" size={16} color="#fff" />}
                    </TouchableOpacity>
                  </View>

                  {/* Note */}
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Note (optional)</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                    placeholder="e.g. First time meeting, told my roommate"
                    placeholderTextColor={colors.mutedForeground}
                    value={meetupNote}
                    onChangeText={setMeetupNote}
                  />

                  {/* Safety Watcher */}
                  <View style={[styles.watcherSection, { backgroundColor: "#7C3AED06", borderColor: "#7C3AED25" }]}>
                    <View style={styles.watcherSectionHeader}>
                      <Feather name="eye" size={14} color="#7C3AED" />
                      <Text style={[styles.watcherSectionTitle, { color: "#7C3AED" }]}>Safety Watcher</Text>
                      <Text style={[styles.watcherSectionOptional, { color: colors.mutedForeground }]}>(optional)</Text>
                    </View>
                    <Text style={[styles.watcherSectionDesc, { color: colors.mutedForeground }]}>
                      A safety watcher receives an email with your meetup details as a safeguard.
                      Add an app member or any email address.
                    </Text>

                    {/* Search app members */}
                    <Text style={[styles.modalLabel, { color: colors.foreground }]}>Search by @handle</Text>
                    {selectedWatcher ? (
                      <View style={[styles.selectedWatcher, { backgroundColor: "#7C3AED12", borderColor: "#7C3AED40" }]}>
                        <View style={[styles.miniAvatar, { backgroundColor: "#7C3AED18" }]}>
                          <Text style={styles.miniAvatarText}>
                            {(selectedWatcher.firstName?.[0] ?? selectedWatcher.username?.[0] ?? "M").toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.selectedWatcherName, { color: "#5B21B6" }]}>
                          {[selectedWatcher.firstName, selectedWatcher.lastName].filter(Boolean).join(" ") ||
                            `@${selectedWatcher.username ?? ""}`}
                        </Text>
                        <TouchableOpacity onPress={() => { setSelectedWatcher(null); setWatcherSearch(""); }} activeOpacity={0.7}>
                          <Feather name="x-circle" size={16} color="#7C3AED" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <TextInput
                          style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                          placeholder="Search members by name or @handle"
                          placeholderTextColor={colors.mutedForeground}
                          value={watcherSearch}
                          onChangeText={handleWatcherSearch}
                          autoCapitalize="none"
                        />
                        {searchingWatcher && (
                          <ActivityIndicator size="small" color="#7C3AED" style={{ marginTop: 4 }} />
                        )}
                        {watcherResults.length > 0 && !selectedWatcher && (
                          <View style={[styles.searchDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            {watcherResults.slice(0, 5).map((u) => (
                              <TouchableOpacity
                                key={u.id}
                                style={[styles.searchDropdownItem, { borderBottomColor: colors.border }]}
                                onPress={() => {
                                  setSelectedWatcher(u);
                                  setWatcherSearch("");
                                  setWatcherResults([]);
                                }}
                                activeOpacity={0.7}
                              >
                                <View style={[styles.miniAvatar, { backgroundColor: "#7C3AED18", overflow: "hidden" }]}>
                                  {u.profileImageUrl ? (
                                    <Image source={{ uri: u.profileImageUrl }} style={{ width: 30, height: 30, borderRadius: 15 }} />
                                  ) : (
                                    <Text style={styles.miniAvatarText}>
                                      {(u.firstName?.[0] ?? u.username?.[0] ?? "M").toUpperCase()}
                                    </Text>
                                  )}
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.dropdownName, { color: colors.foreground }]}>
                                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || `@${u.username ?? ""}`}
                                  </Text>
                                  {u.username && (
                                    <Text style={[styles.dropdownHandle, { color: colors.mutedForeground }]}>
                                      @{u.username}
                                    </Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </>
                    )}

                    {/* Or enter any email */}
                    <Text style={[styles.modalLabel, { color: colors.foreground, marginTop: 8 }]}>Or enter any email</Text>
                    <TextInput
                      style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      placeholder="watcher@example.com"
                      placeholderTextColor={colors.mutedForeground}
                      value={watcherEmail}
                      onChangeText={setWatcherEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
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
                      Set check-in windows for your meetup. A trusted friend (not the person you're meeting) is alerted only if you miss them.
                    </Text>

                    <Text style={[styles.modalLabel, { color: colors.foreground, marginTop: 8 }]}>📍 I'll arrive in…</Text>
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

                    <Text style={[styles.modalLabel, { color: colors.foreground }]}>🏠 I'll be home in…</Text>
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

                    {(arrivalMinutes != null || homeMinutes != null) && (
                      <>
                        <Text style={[styles.modalLabel, { color: colors.foreground }]}>Safety friend's name</Text>
                        <TextInput
                          style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                          placeholder="e.g. Mom, Best Friend"
                          placeholderTextColor={colors.mutedForeground}
                          value={friendName}
                          onChangeText={setFriendName}
                        />
                        <Text style={[styles.modalLabel, { color: colors.foreground }]}>Safety friend's email <Text style={{ color: "#DC2626" }}>*</Text></Text>
                        <TextInput
                          style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                          placeholder="friend@example.com"
                          placeholderTextColor={colors.mutedForeground}
                          value={friendEmail}
                          onChangeText={setFriendEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                        <View style={[styles.privacyNote, { backgroundColor: "#7C3AED08", borderColor: "#7C3AED25" }]}>
                          <Text style={[styles.privacyNoteText, { color: "#5B21B6" }]}>
                            🔒 Only you and your safety friend will ever receive alerts. The person you're meeting will never be notified.
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.sendBtn, { opacity: (sending || ((arrivalMinutes != null || homeMinutes != null) && !friendEmail.trim())) ? 0.6 : 1 }]}
                    onPress={() => void sendMeetupRequest()}
                    disabled={sending || ((arrivalMinutes != null || homeMinutes != null) && !friendEmail.trim())}
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
            {clearTarget?.location && (
              <Text style={[styles.centeredMeta, { color: colors.mutedForeground }]}>📍 {clearTarget.location}</Text>
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

      {/* ── Share Details Modal ── */}
      <Modal visible={!!shareTarget} transparent animationType="fade" onRequestClose={() => setShareTarget(null)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.card }]}>
            <View style={[styles.clearIconWrap, { backgroundColor: "#7C3AED18" }]}>
              <Feather name="share-2" size={24} color="#7C3AED" />
            </View>
            <Text style={[styles.centeredTitle, { color: colors.foreground }]}>Share Meetup Details</Text>
            <Text style={[styles.centeredDesc, { color: colors.mutedForeground }]}>
              Send a safety alert email with this meetup's details to a watcher. They'll know who you're meeting and where.
            </Text>
            <Text style={[styles.modalLabel, { color: colors.foreground, alignSelf: "flex-start", marginTop: 8 }]}>Email address</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, width: "100%" }]}
              placeholder="watcher@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={shareEmail}
              onChangeText={setShareEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            <View style={styles.centeredActions}>
              <TouchableOpacity
                style={[styles.centeredCancelBtn, { borderColor: colors.border }]}
                onPress={() => { setShareTarget(null); setShareEmail(""); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.centeredCancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareConfirmBtn, { opacity: sharing || !shareEmail.includes("@") ? 0.5 : 1 }]}
                onPress={() => void shareMeetup()}
                disabled={sharing || !shareEmail.includes("@")}
                activeOpacity={0.85}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.centeredConfirmText}>Send Alert</Text>
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
