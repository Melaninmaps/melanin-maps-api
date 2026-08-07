/**
 * B5 — Business Check-In (one-tap)
 *
 * A single [I'm here] button. Business and location from context.
 * Adding a badge upgrades the check-in into a review IN PLACE (no duplicate).
 *
 * Params: businessId, businessName
 */
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { ChipGrid } from "@/components/ChipGrid";
import { VoiceTextField } from "@/components/VoiceTextField";
import { REVIEW_BADGE_CHIPS } from "@/config/chips";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : process.env.EXPO_PUBLIC_API_URL ?? "";

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

function badgeToRating(badge: string): number {
  if (["worth_every_visit", "grandma_approved", "felt_at_home", "great_service", "would_go_back"].includes(badge)) return 5;
  if (badge === "mixed_feelings") return 3;
  return 2;
}

type Stage = "idle" | "checking_in" | "checked_in" | "done";

export default function BusinessCheckinScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { businessId, businessName } = useLocalSearchParams<{
    businessId: string;
    businessName?: string;
  }>();

  const [stage, setStage] = useState<Stage>("idle");
  const [checkInId, setCheckInId] = useState<number | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [verified, setVerified] = useState(false);
  const [note, setNote] = useState("");
  const [badge, setBadge] = useState<string[]>([]);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleCheckIn() {
    if (!businessId || stage !== "idle") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setStage("checking_in");
    setError(null);

    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Cookie"] = `connect.sid=${token}`;

      // Try to get GPS coords for proximity verification
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      } catch { /* GPS optional */ }

      const res = await fetch(`${API_BASE}/api/checkins`, {
        method: "POST",
        headers,
        body: JSON.stringify({ businessId, lat, lng }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "too_far") {
          setError(`You need to be within 500m of ${businessName ?? "this business"} to check in.`);
          setStage("idle");
          return;
        }
        setError(data.error ?? "Could not check in. Please try again.");
        setStage("idle");
        return;
      }

      setCheckInId(data.checkIn?.id ?? null);
      setPointsEarned(data.pointsEarned ?? 0);
      setVerified(data.verifiedLocation ?? false);
      setStage("checked_in");
    } catch {
      setError("Could not check in. Please check your connection.");
      setStage("idle");
    }
  }

  async function handleUpgrade() {
    if (!checkInId || upgrading) return;
    setUpgrading(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Cookie"] = `connect.sid=${token}`;

      // PATCH the check-in to add note + badge
      await fetch(`${API_BASE}/api/checkins/${checkInId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          note: note.trim() || undefined,
          reviewBadge: badge[0] ?? undefined,
        }),
      });

      // Also post a review if badge selected (upgrades check-in into a review)
      if (badge[0] && businessId) {
        await fetch(`${API_BASE}/api/reviews`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            businessId,
            reviewBadge: badge[0],
            rating: badgeToRating(badge[0]),
            businessName: businessName ?? undefined,
          }),
        }).catch(() => {}); // best-effort — check-in is already saved
      }
    } catch { /* non-critical */ } finally {
      setUpgrading(false);
      setStage("done");
    }
  }

  if (stage === "done") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <View style={{ width: 22 }} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Checked In</Text>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerWrap}>
          <Feather name="check-circle" size={56} color={colors.success} />
          <Text style={[styles.successTitle, { color: colors.foreground }]}>You're all set!</Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
            Thank you — this already helps.
          </Text>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === "checked_in") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("done")}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Checked In!</Text>
          <View style={{ width: 22 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Confirmation banner */}
            <View style={[styles.checkInBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="map-pin" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
                  {businessName ?? "Check-in recorded"}
                </Text>
                <Text style={[styles.bannerMeta, { color: colors.mutedForeground }]}>
                  {verified ? "Location verified ✓" : "Check-in saved"} · +{pointsEarned} pts
                </Text>
              </View>
            </View>

            {/* Optional note */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}>
              Add a note?
            </Text>
            <VoiceTextField
              value={note}
              onChangeText={setNote}
              placeholder="Only if you want to. Even a few words help."
              draftKey={`checkin_note_${businessId}`}
            />

            {/* Optional badge — upgrades to review */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              How was it?
            </Text>
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              Adding a badge turns this into a review.
            </Text>
            <ChipGrid
              chips={REVIEW_BADGE_CHIPS}
              selectedIds={badge}
              onSelect={setBadge}
              style={{ marginTop: 10 }}
            />

            {/* Equal-prominence Add / Skip */}
            <View style={styles.equalRow}>
              <TouchableOpacity
                onPress={() => { void handleUpgrade(); }}
                style={[styles.halfBtn, { backgroundColor: colors.primary }]}
              >
                {upgrading
                  ? <ActivityIndicator color={colors.primaryForeground} size="small" />
                  : <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>Add this</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStage("done")}
                style={[styles.halfBtn, { backgroundColor: colors.secondary, borderWidth: 1.5, borderColor: colors.border }]}
              >
                <Text style={[styles.primaryBtnLabel, { color: colors.foreground }]}>Skip</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // stage === "idle" | "checking_in"
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {businessName ?? "Check In"}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.centerWrap}>
        <Text style={[styles.contextName, { color: colors.foreground }]}>
          {businessName ?? "This business"}
        </Text>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
            <Feather name="alert-circle" size={16} color="#DC2626" />
            <Text style={[styles.errorText, { color: "#DC2626" }]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => { void handleCheckIn(); }}
          disabled={stage === "checking_in"}
          style={[styles.checkinBtn, { backgroundColor: colors.primary, opacity: stage === "checking_in" ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Check in to this business"
        >
          {stage === "checking_in" ? (
            <ActivityIndicator color={colors.primaryForeground} size="large" />
          ) : (
            <>
              <Feather name="map-pin" size={28} color={colors.primaryForeground} />
              <Text style={[styles.checkinBtnLabel, { color: colors.primaryForeground }]}>I'm here</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.hintText, { color: colors.mutedForeground, textAlign: "center" }]}>
          You need to be within 500m of this business.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  contextName: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  checkinBtn: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  checkinBtnLabel: { fontSize: 20, fontFamily: "Inter_700Bold" },
  hintText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    width: "100%",
  },
  errorText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  checkInBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  bannerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  bannerMeta: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  equalRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  halfBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  primaryBtnLabel: { fontSize: 17, fontFamily: "Inter_700Bold" },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successBody: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});
