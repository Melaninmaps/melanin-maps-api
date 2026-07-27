import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { useAuth } from "@/lib/auth";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

type IntelType = {
  id: string;
  icon: string;
  label: string;
  color: string;
  desc: string;
  expiryHint: string;
};

const INTEL_TYPES: IntelType[] = [
  { id: "road_closure",       icon: "🚧", label: "Road Closure",            color: "#F59E0B", desc: "A road or street is blocked",                        expiryHint: "Active for ~4 hrs" },
  { id: "construction",       icon: "🏗️", label: "Construction Zone",       color: "#D97706", desc: "Active construction affecting traffic",              expiryHint: "Active for ~48 hrs" },
  { id: "road_reopened",      icon: "✅", label: "Road Reopened",           color: "#16A34A", desc: "A previously closed road has reopened",              expiryHint: "Active for ~1 hr" },
  { id: "transit_disruption", icon: "🚌", label: "Transit Disruption",      color: "#0EA5E9", desc: "Public transit is delayed or disrupted",            expiryHint: "Active for ~3 hrs" },
  { id: "protest",            icon: "✊🏾", label: "Active Protest",         color: "#8B5CF6", desc: "A protest or demonstration is in progress",          expiryHint: "Active for ~4 hrs" },
  { id: "celebration",        icon: "🎉", label: "Community Celebration",  color: "#10B981", desc: "A community gathering or celebration is happening",  expiryHint: "Active for ~8 hrs" },
  { id: "festival",           icon: "🎊", label: "Festival or Event",       color: "#EC4899", desc: "A festival or large public event",                  expiryHint: "Active for ~24 hrs" },
  { id: "severe_weather",     icon: "⛈️", label: "Severe Weather",          color: "#6366F1", desc: "Severe weather is impacting this area",              expiryHint: "Active for ~6 hrs" },
  { id: "emergency",          icon: "🚨", label: "Neighborhood Emergency",  color: "#DC2626", desc: "An emergency situation is unfolding",                expiryHint: "Active for ~2 hrs" },
  { id: "avoid_area",         icon: "⛔", label: "Area to Avoid",           color: "#DC2626", desc: "Community advises avoiding this area temporarily",   expiryHint: "Active for ~4 hrs" },
  { id: "situation_cleared",  icon: "🟢", label: "Situation Cleared",       color: "#16A34A", desc: "A previously reported situation has resolved",       expiryHint: "Active for ~1 hr" },
];

export default function ReportIntelligenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [selectedType, setSelectedType] = useState<IntelType | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  useEffect(() => {
    void getLocation();
  }, []);

  const getLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let label = "Your current location";
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (place) {
          label = [place.street, place.district ?? place.subregion ?? place.city]
            .filter(Boolean)
            .join(", ") || label;
        }
      } catch { /**/ }
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label });
    } catch { /**/ } finally {
      setLocLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !location) return;
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to submit community intelligence.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/community-alerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: selectedType.id,
          lat: location.lat,
          lng: location.lng,
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSubmitted(true);
      } else {
        const data = await res.json() as { error?: string };
        Alert.alert("Error", data.error ?? "Failed to submit. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Report Intel</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.successWrap}>
          <Text style={styles.successEmoji}>🙏🏾</Text>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Intel Submitted</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            Thank you for keeping your community informed. Your report is now live and will be confirmed or cleared by the network.
          </Text>
          <View style={[styles.threeStarBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.threeStarTitle, { color: colors.foreground }]}>How the 3★ Rule works</Text>
            <Text style={[styles.threeStarBody, { color: colors.mutedForeground }]}>
              1–2 reports = <Text style={{ color: "#F59E0B", fontFamily: "Inter_700Bold" }}>⚡ Possible</Text>{"\n"}
              3+ reports = <Text style={{ color: "#16A34A", fontFamily: "Inter_700Bold" }}>✓ Confirmed</Text>{"\n\n"}
              When your community confirms the same situation, everyone within 10 miles gets notified.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const canSubmit = !!selectedType && !!location && !submitting;
  const typeColor = selectedType?.color ?? colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Report Intel</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.heroBanner, { backgroundColor: "#CA922B0F", borderColor: "#CA922B30" }]}>
          <Text style={styles.heroEmoji}>📡</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Community Intelligence</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              Real-time intel, verified by the community. Not a scanner — a network.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>What are you reporting?</Text>
        <View style={styles.typeGrid}>
          {INTEL_TYPES.map((t) => {
            const isSelected = selectedType?.id === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: isSelected ? t.color + "18" : colors.card,
                    borderColor: isSelected ? t.color : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setSelectedType(isSelected ? null : t);
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.typeEmoji}>{t.icon}</Text>
                <Text style={[styles.typeLabel, { color: isSelected ? t.color : colors.foreground }]} numberOfLines={2}>
                  {t.label}
                </Text>
                {isSelected && (
                  <Text style={[styles.typeHint, { color: t.color }]}>{t.expiryHint}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedType && (
          <View style={[styles.selectedDesc, { backgroundColor: typeColor + "0F", borderColor: typeColor + "30" }]}>
            <Text style={[styles.selectedDescText, { color: colors.mutedForeground }]}>
              {selectedType.desc}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Location</Text>
        <TouchableOpacity
          style={[styles.locationCard, { backgroundColor: colors.card, borderColor: location ? "#16A34A" : colors.border }]}
          onPress={getLocation}
          activeOpacity={0.8}
        >
          <View style={[styles.locationIcon, { backgroundColor: location ? "#16A34A18" : colors.secondary }]}>
            {locLoading
              ? <ActivityIndicator size="small" color="#16A34A" />
              : <Feather name="map-pin" size={16} color={location ? "#16A34A" : colors.mutedForeground} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationLabel, { color: colors.foreground }]}>
              {locLoading ? "Detecting location…" : (location?.label ?? "Tap to use your location")}
            </Text>
            {location && (
              <Text style={[styles.locationCoords, { color: colors.mutedForeground }]}>
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </Text>
            )}
          </View>
          <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
        {!location && !locLoading && (
          <Text style={[styles.locError, { color: "#DC2626" }]}>
            Location is required to submit community intelligence.
          </Text>
        )}

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Details <Text style={[styles.optional, { color: colors.mutedForeground }]}>(optional)</Text></Text>
        <TextInput
          style={[styles.descInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          placeholder="Add any details that might help the community…"
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{description.length}/500</Text>

        <View style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.ruleTitle, { color: colors.foreground }]}>3★ Verification Rule</Text>
          <View style={styles.ruleRow}>
            <View style={[styles.ruleBadge, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B40" }]}>
              <Text style={[styles.ruleBadgeText, { color: "#F59E0B" }]}>⚡ Possible</Text>
            </View>
            <Text style={[styles.ruleDesc, { color: colors.mutedForeground }]}>1–2 community reports</Text>
          </View>
          <View style={styles.ruleRow}>
            <View style={[styles.ruleBadge, { backgroundColor: "#16A34A18", borderColor: "#16A34A40" }]}>
              <Text style={[styles.ruleBadgeText, { color: "#16A34A" }]}>✓ Confirmed</Text>
            </View>
            <Text style={[styles.ruleDesc, { color: colors.mutedForeground }]}>3+ community reports</Text>
          </View>
          <Text style={[styles.ruleNote, { color: colors.mutedForeground }]}>
            At 3 confirmations, everyone within 10 miles is notified.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: canSubmit ? (selectedType?.color ?? colors.primary) : colors.border,
              opacity: canSubmit ? 1 : 0.6,
            },
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Text style={styles.submitBtnText}>Submit Intel</Text>
                <Text style={styles.submitBtnEmoji}>{selectedType?.icon ?? "📡"}</Text>
              </>
          }
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          False reports undermine community trust. Only report what you personally observe.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  scroll: { padding: 20, gap: 16 },
  heroBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  heroEmoji: { fontSize: 28 },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  heroSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 2 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 4 },
  optional: { fontFamily: "Inter_400Regular", fontSize: 13 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    width: "30%", flexGrow: 1,
    borderRadius: 14, padding: 12, gap: 6,
    alignItems: "center",
  },
  typeEmoji: { fontSize: 22 },
  typeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, textAlign: "center", lineHeight: 15 },
  typeHint: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
  selectedDesc: {
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  selectedDescText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  locationCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  locationIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  locationLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  locationCoords: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  locError: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: -8 },
  descInput: {
    borderRadius: 14, borderWidth: 1,
    padding: 14, fontSize: 14, fontFamily: "Inter_400Regular",
    minHeight: 100,
  },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "right", marginTop: -8 },
  ruleCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 10,
  },
  ruleTitle: { fontFamily: "Inter_700Bold", fontSize: 13 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ruleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  ruleBadgeText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  ruleDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  ruleNote: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 2 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderRadius: 16,
  },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  submitBtnEmoji: { fontSize: 18 },
  disclaimer: {
    fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16,
    textAlign: "center", paddingHorizontal: 20,
  },
  successWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: 32, gap: 16,
  },
  successEmoji: { fontSize: 56 },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 24 },
  successSub: {
    fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21,
    textAlign: "center",
  },
  threeStarBox: {
    width: "100%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 8, marginTop: 8,
  },
  threeStarTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  threeStarBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  doneBtn: {
    paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14, marginTop: 8,
  },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
});
