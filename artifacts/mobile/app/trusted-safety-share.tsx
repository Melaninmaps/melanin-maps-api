/**
 * Trusted Safety Share — Settings Screen
 *
 * Allows the user to manage their trusted safety contacts.
 * Trusted contacts receive a mirror of any severe safety alert
 * the user receives while traveling — nothing else.
 *
 * What contacts never see:
 *   • GPS coordinates
 *   • Searches, saves, or any app activity
 *   • When the user arrived or left
 *
 * What contacts do see when an alert fires:
 *   "Safety Alert — [Your first name] is currently in [City, Region].
 *    [Alert description]. This alert was also sent to them.
 *    No action is required unless you hear otherwise."
 */
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { getApiBase } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContactType = "mwm_user" | "phone" | "email";
type ShareStatus = "pending" | "active" | "paused_home" | "paused_manual" | "revoked" | "declined";

async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync("auth_session_token");
}

interface TrustedShare {
  id: string;
  contact_type: ContactType;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  contact_first_name: string | null;
  contact_avatar: string | null;
  owner_enabled: boolean;
  contact_accepted: boolean;
  status: ShareStatus;
  activated_at: string | null;
  created_at: string;
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function statusLabel(status: ShareStatus, contactAccepted: boolean): string {
  if (status === "pending") return contactAccepted ? "Pending" : "Invite Sent";
  if (status === "active") return "Active";
  if (status === "paused_home") return "Paused (You're Home)";
  if (status === "paused_manual") return "Paused";
  if (status === "declined") return "Declined";
  return "Revoked";
}

function statusColor(status: ShareStatus, colors: ReturnType<typeof useColors>): string {
  if (status === "active") return "#2D8B57";
  if (status === "pending") return "#C49A28";
  if (status === "paused_home" || status === "paused_manual") return "#888";
  return colors.mutedForeground;
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TrustedSafetyShareScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [shares, setShares] = useState<TrustedShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [fadeIn] = useState(() => new Animated.Value(0));

  // ── Load shares ─────────────────────────────────────────────────────────────

  const loadShares = useCallback(async () => {
    try {
      if (!isAuthenticated) return;
      const token = await getAuthToken();
      if (!token) return;
      const res = await fetch(`${getApiBase()}/api/safety/trusted-shares`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setShares((data.shares ?? []).filter((s: TrustedShare) => s.status !== "revoked"));
    } catch {
      // silent
    } finally {
      setLoading(false);
      Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [isAuthenticated, fadeIn]);

  useEffect(() => { queueMicrotask(() => { void loadShares(); }); }, [loadShares]);

  // ── Revoke ──────────────────────────────────────────────────────────────────

  const handleRevoke = (share: TrustedShare) => {
    Alert.alert(
      "Remove Trusted Contact",
      `Remove ${share.contact_name}? They won't be notified.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getAuthToken();
              if (!token) throw new Error("Sign in required");
              await fetch(`${getApiBase()}/api/safety/trusted-shares/${share.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              setShares((prev) => prev.filter((s) => s.id !== share.id));
            } catch {
              Alert.alert("Error", "Couldn't remove contact. Please try again.");
            }
          },
        },
      ]
    );
  };

  // ── Render share card ───────────────────────────────────────────────────────

  const renderShare = ({ item }: { item: TrustedShare }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: colors.tint + "22" }]}>
          <Text style={[styles.avatarText, { color: colors.tint }]}>
            {item.contact_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.text }]}>{item.contact_name}</Text>
          <Text style={[styles.cardDetail, { color: colors.mutedForeground }]}>
            {item.contact_type === "mwm_user"
              ? "MWM Member"
              : item.contact_phone ?? item.contact_email ?? ""}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(item.status, colors) }]} />
            <Text style={[styles.statusText, { color: statusColor(item.status, colors) }]}>
              {statusLabel(item.status, item.contact_accepted)}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleRevoke(item)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Feather name="x" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );

  // ── Main render ─────────────────────────────────────────────────────────────

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row", alignItems: "center",
      paddingTop: insets.top + 12, paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    },
    headerTitle: { fontSize: 17, fontWeight: "600", color: colors.text, flex: 1, textAlign: "center" },
    heroCard: {
      margin: 20, padding: 20,
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    },
    heroTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6 },
    heroBody: { fontSize: 14, lineHeight: 21, color: colors.mutedForeground },
    toggleRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginTop: 16, paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    },
    toggleLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
    sectionTitle: {
      fontSize: 13, fontWeight: "600", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.6,
      marginHorizontal: 20, marginTop: 28, marginBottom: 10,
    },
    addBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, marginHorizontal: 20, marginTop: 12,
      paddingVertical: 14, borderRadius: 12,
      backgroundColor: colors.tint,
    },
    addBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
    capNote: {
      fontSize: 12, color: colors.mutedForeground,
      textAlign: "center", marginTop: 8, marginHorizontal: 20,
    },
    howTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 10 },
    howItem: {
      flexDirection: "row", gap: 10, marginBottom: 12, alignItems: "flex-start",
    },
    howText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.mutedForeground },
    closingQuote: {
      fontSize: 14, fontStyle: "italic", lineHeight: 21,
      color: colors.text, textAlign: "center",
      marginHorizontal: 20, marginTop: 24, marginBottom: 40,
    },
  });

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Trusted Safety Share</Text>
        <View style={{ width: 24 }} />
      </View>

      <Animated.ScrollView style={{ opacity: fadeIn }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Hero explanation */}
        <View style={s.heroCard}>
          <Text style={s.heroTitle}>Your family&apos;s peace of mind. Your privacy. Both.</Text>
          <Text style={s.heroBody}>
            When a real emergency alert fires at your location — hurricane, earthquake, civil emergency —
            your trusted contacts receive the same alert automatically.{"\n\n"}
            They see your first name, the city, and the alert. Nothing else, ever.
          </Text>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Trusted Safety Share</Text>
            <Switch
              value={masterEnabled}
              onValueChange={setMasterEnabled}
              trackColor={{ true: colors.tint, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Contact list */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.tint} />
        ) : (
          <>
            {shares.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Your Trusted Contacts</Text>
                <FlatList
                  data={shares}
                  keyExtractor={(item) => item.id}
                  renderItem={renderShare}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                />
              </>
            )}

            {shares.length < 5 && (
              <>
                <TouchableOpacity
                  style={s.addBtn}
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="user-plus" size={18} color="#fff" />
                  <Text style={s.addBtnText}>Add Trusted Contact</Text>
                </TouchableOpacity>
                <Text style={s.capNote}>Up to 5 trusted contacts. They must accept your invite.</Text>
              </>
            )}
          </>
        )}

        {/* How it works */}
        <Text style={[s.sectionTitle, { marginTop: 36 }]}>How It Works</Text>
        <View style={[s.heroCard, { marginTop: 0 }]}>
          <View style={s.howItem}>
            <Feather name="shield" size={16} color={colors.tint} style={{ marginTop: 2 }} />
            <Text style={s.howText}>
              <Text style={{ fontWeight: "600" }}>Real emergencies only.</Text>
              {" "}Hurricanes, earthquakes, tornadoes, civil emergencies. Not road closures, not routine alerts.
            </Text>
          </View>
          <View style={s.howItem}>
            <Feather name="eye-off" size={16} color={colors.tint} style={{ marginTop: 2 }} />
            <Text style={s.howText}>
              <Text style={{ fontWeight: "600" }}>Zero visibility into your activity.</Text>
              {" "}No GPS, no searches, no saves, no check-ins. Only the alert — nothing else.
            </Text>
          </View>
          <View style={s.howItem}>
            <Feather name="home" size={16} color={colors.tint} style={{ marginTop: 2 }} />
            <Text style={s.howText}>
              <Text style={{ fontWeight: "600" }}>Auto-pauses when you&apos;re home.</Text>
              {" "}When your location matches your home city, the feature pauses automatically.
            </Text>
          </View>
          <View style={s.howItem}>
            <Feather name="x-circle" size={16} color={colors.tint} style={{ marginTop: 2 }} />
            <Text style={s.howText}>
              <Text style={{ fontWeight: "600" }}>You&apos;re always in control.</Text>
              {" "}Turn it off at any time from this screen. Removal is instant and silent.
            </Text>
          </View>
        </View>

        <Text style={s.closingQuote}>
          &quot;This is the feature that makes a parent feel at peace letting their child travel —
          without making the child feel watched.&quot;
        </Text>
      </Animated.ScrollView>

      {/* Add Contact Modal */}
      <AddContactModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={(share) => {
          setShares((prev) => [share, ...prev]);
          setShowAddModal(false);
        }}
        colors={colors}
        insets={insets}
      />
    </View>
  );
}

// ── Add Contact Modal ─────────────────────────────────────────────────────────

function AddContactModal({
  visible,
  onClose,
  onAdded,
  colors,
  insets,
}: {
  visible: boolean;
  onClose: () => void;
  onAdded: (share: TrustedShare) => void;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setPhone(""); setEmail(""); };

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert("Name required", "Please enter a name for this contact."); return; }
    if (!phone.trim() && !email.trim()) {
      Alert.alert("Contact info required", "Enter a phone number or email address.");
      return;
    }
    const contactType: ContactType = phone.trim() ? "phone" : "email";

    setSaving(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Sign in required", "Please sign in to add a trusted contact.");
        return;
      }
      const res = await fetch(`${getApiBase()}/api/safety/trusted-shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contactName: name.trim(),
          contactType,
          contactPhone: phone.trim() || undefined,
          contactEmail: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Couldn't add contact", data.error ?? "Please try again.");
        return;
      }
      reset();
      onAdded(data.share);
    } catch {
      Alert.alert("Error", "Couldn't add contact. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const ms = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: insets.bottom + 24,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: colors.border, alignSelf: "center", marginBottom: 20,
    },
    title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 24, lineHeight: 20 },
    label: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground, marginBottom: 6 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: colors.text, backgroundColor: colors.card,
      marginBottom: 16,
    },
    divider: {
      flexDirection: "row", alignItems: "center", marginVertical: 4, marginBottom: 16,
    },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
    dividerText: { fontSize: 12, color: colors.mutedForeground, marginHorizontal: 12 },
    addBtn: {
      backgroundColor: colors.tint, borderRadius: 12,
      paddingVertical: 14, alignItems: "center",
      flexDirection: "row", justifyContent: "center", gap: 8,
      marginTop: 8,
    },
    addBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
    cancelBtn: { paddingVertical: 14, alignItems: "center", marginTop: 8 },
    cancelText: { fontSize: 15, color: colors.mutedForeground },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={ms.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={ms.sheet}>
          <View style={ms.handle} />
          <Text style={ms.title}>Add Trusted Contact</Text>
          <Text style={ms.subtitle}>
            They&apos;ll receive an invite. Once accepted, they&apos;ll get the same safety
            alerts you receive — nothing else.
          </Text>

          <Text style={ms.label}>Name</Text>
          <TextInput
            style={ms.input}
            value={name}
            onChangeText={setName}
            placeholder="Mom, Dad, Keisha…"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="words"
          />

          <Text style={ms.label}>Phone number</Text>
          <TextInput
            style={ms.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 000-0000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
          />

          <View style={ms.divider}>
            <View style={ms.dividerLine} />
            <Text style={ms.dividerText}>or</Text>
            <View style={ms.dividerLine} />
          </View>

          <Text style={ms.label}>Email address</Text>
          <TextInput
            style={ms.input}
            value={email}
            onChangeText={setEmail}
            placeholder="mom@example.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity style={ms.addBtn} onPress={handleAdd} disabled={saving} activeOpacity={0.8}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <><Feather name="user-plus" size={16} color="#fff" /><Text style={ms.addBtnText}>Send Invite</Text></>
            }
          </TouchableOpacity>
          <TouchableOpacity style={ms.cancelBtn} onPress={onClose}>
            <Text style={ms.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  cardDetail: { fontSize: 13, marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "500" },
});
