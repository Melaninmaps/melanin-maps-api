/**
 * B3 — Nominate Business (one-tap nomination)
 *
 * Screen 1: PlacesAutocompleteInput → [Nominate] → "Want to tell us why?"
 * Expansion 1: VoiceTextField (why this place) + OWNERSHIP_CHIPS + photo
 * Expansion 2: Optional owner contact fields
 *
 * Contact name, email, and identity fields are DELETED from the required flow.
 */
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { PlacesAutocompleteInput, type PlaceResult } from "@/components/PlacesAutocompleteInput";
import { ChipGrid } from "@/components/ChipGrid";
import { VoiceTextField } from "@/components/VoiceTextField";
import { OWNERSHIP_CHIPS } from "@/config/chips";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : process.env.EXPO_PUBLIC_API_URL ?? "";

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

type ResultState =
  | { isDuplicate: false; nominationId: string; businessId: string }
  | { isDuplicate: true; type: "already_listed"; businessId: string; message: string }
  | { isDuplicate: true; type: "already_nominated"; message: string };

type Stage = "main" | "expanding1" | "expanding2" | "done";

export default function NominateBusinessScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [why, setWhy] = useState("");
  const [ownershipDesignations, setOwnershipDesignations] = useState<string[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [website, setWebsite] = useState("");
  const [stage, setStage] = useState<Stage>("main");
  const [nominationId, setNominationId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [patchSubmitting, setPatchSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleNominate() {
    if (!selectedPlace || submitting) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Cookie"] = `connect.sid=${token}`;

      const res = await fetch(`${API_BASE}/api/business-nominations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          businessName: selectedPlace.name,
          city: selectedPlace.city ?? undefined,
          state: selectedPlace.state ?? undefined,
          phone: selectedPlace.phone ?? undefined,
          lat: selectedPlace.lat ?? undefined,
          lng: selectedPlace.lng ?? undefined,
          category: selectedPlace.category ?? undefined,
          ownershipDesignations: ownershipDesignations.length ? ownershipDesignations : undefined,
          blackOwned: ownershipDesignations.some(d => d === "black-owned"),
        }),
      });

      const data = await res.json() as ResultState & {
        error?: string;
        code?: string;
        nomination?: { id: string };
        businessId?: string;
      };

      if (!res.ok) {
        if (data.code === "TIER_LIMIT_REACHED") {
          Alert.alert(
            "Membership Required",
            data.error ?? "Upgrade to Explorer+ to nominate businesses.",
            [
              { text: "Maybe Later", style: "cancel" },
              { text: "View Plans", onPress: () => router.push("/membership") },
            ]
          );
          return;
        }
        Alert.alert("Error", data.error ?? "Could not submit. Please try again.");
        return;
      }

      if (data.isDuplicate) {
        setResult(data as ResultState);
      } else {
        const nomId = (data as any).nomination?.id ?? "";
        setNominationId(nomId);
        setResult({
          isDuplicate: false,
          nominationId: nomId,
          businessId: (data as any).businessId ?? "",
        });
        // Offer expansion
        if (!why.trim() && ownershipDesignations.length === 0) {
          setStage("expanding1");
        } else {
          setStage("done");
        }
      }
    } catch {
      Alert.alert("Error", "Could not submit. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExpansion1() {
    if (patchSubmitting) return;
    if (!why.trim() && ownershipDesignations.length === 0) { setStage("done"); return; }
    setPatchSubmitting(true);
    try {
      if (nominationId) {
        const token = await getToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Cookie"] = `connect.sid=${token}`;
        await fetch(`${API_BASE}/api/business-nominations/${nominationId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            notes: why.trim() || undefined,
            ownershipDesignations: ownershipDesignations.length ? ownershipDesignations : undefined,
          }),
        });
      }
    } catch { /* non-critical */ } finally {
      setPatchSubmitting(false);
      setStage("done");
    }
  }

  if (stage === "done" || result) {
    if (!result || !result.isDuplicate) {
      return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nomination Sent</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.centerWrap}>
            <Feather name="check-circle" size={56} color={colors.success} />
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Thank you for the nomination!</Text>
            <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
              We&apos;ll reach out to {selectedPlace?.name ?? "this business"} about joining our community.
            </Text>
            <TouchableOpacity
              onPress={() => { setSelectedPlace(null); setWhy(""); setOwnershipDesignations([]); setResult(null); setStage("main"); }}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>Nominate Another</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace("/(tabs)" as never)} style={styles.ghostBtn}>
              <Text style={[styles.ghostBtnLabel, { color: colors.foreground }]}>Back to Discover</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const isDup = result.isDuplicate;
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Already There</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.centerWrap}>
          <Text style={styles.dupEmoji}>🤝🏾</Text>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            {result.type === "already_listed" ? "Already in the directory!" : "Already on our radar!"}
          </Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>{result.message}</Text>
          {result.type === "already_listed" && (
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/business/[id]", params: { id: result.businessId } } as never)}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>View Their Listing</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => { setSelectedPlace(null); setResult(null); setStage("main"); }}
            style={styles.ghostBtn}
          >
            <Text style={[styles.ghostBtnLabel, { color: colors.foreground }]}>Nominate a Different Business</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === "expanding1") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("done")}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tell Us More</Text>
          <View style={{ width: 22 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.confirmBanner}>
              <Feather name="check-circle" size={18} color={colors.success} />
              <Text style={[styles.confirmBannerText, { color: colors.success }]}>
                {selectedPlace?.name} has been nominated!
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              Why does this place matter?
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              The most valuable thing you can add — only if you want to.
            </Text>
            <VoiceTextField
              value={why}
              onChangeText={setWhy}
              placeholder="Tell us what makes this business special"
              draftKey="nominate_why_draft"
              style={{ marginTop: 8 }}
            />

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              Ownership designation
            </Text>
            <ChipGrid
              chips={OWNERSHIP_CHIPS}
              selectedIds={ownershipDesignations}
              onSelect={setOwnershipDesignations}
              multiSelect
            />

            <View style={styles.equalRow}>
              <TouchableOpacity
                onPress={() => { void handleExpansion1(); }}
                style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.primary }]}
              >
                {patchSubmitting
                  ? <ActivityIndicator color={colors.primaryForeground} size="small" />
                  : <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>Add this</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStage("done")}
                style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.secondary, borderWidth: 1.5, borderColor: colors.border }]}
              >
                <Text style={[styles.primaryBtnLabel, { color: colors.foreground }]}>Skip</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // stage === "main"
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add a Business</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>
            Search for the business. One tap to nominate.
          </Text>

          <PlacesAutocompleteInput
            placeholder="What business should we add?"
            onSelect={setSelectedPlace}
            style={{ marginTop: 16 }}
          />

          {selectedPlace && (
            <View style={[styles.selectedCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.selectedName, { color: colors.foreground }]}>{selectedPlace.name}</Text>
              {(selectedPlace.city || selectedPlace.state) && (
                <Text style={[styles.selectedMeta, { color: colors.mutedForeground }]}>
                  {[selectedPlace.address, selectedPlace.city, selectedPlace.state].filter(Boolean).join(", ")}
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={() => { void handleNominate(); }}
            disabled={!selectedPlace || submitting}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: selectedPlace ? colors.primary : colors.muted,
                marginTop: 20,
                opacity: submitting ? 0.7 : 1,
              },
            ]}
          >
            {submitting
              ? <ActivityIndicator color={colors.primaryForeground} size="small" />
              : <Text style={[styles.primaryBtnLabel, { color: selectedPlace ? colors.primaryForeground : colors.mutedForeground }]}>
                  Nominate
                </Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStage("expanding1")} style={styles.expandLink}>
            <Text style={[styles.expandLinkText, { color: colors.primary }]}>Want to tell us why?</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 0 },
  bodyText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  hint: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  selectedCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  selectedName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  selectedMeta: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primaryBtnLabel: { fontSize: 17, fontFamily: "Inter_700Bold" },
  expandLink: { alignItems: "center", paddingVertical: 10, marginTop: 4 },
  expandLinkText: { fontSize: 15, fontFamily: "Inter_500Medium", textDecorationLine: "underline" },
  equalRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  confirmBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  confirmBannerText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  dupEmoji: { fontSize: 48 },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successBody: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  ghostBtn: { alignItems: "center", paddingVertical: 8 },
  ghostBtnLabel: { fontSize: 15, fontFamily: "Inter_500Medium", textDecorationLine: "underline" },
});
