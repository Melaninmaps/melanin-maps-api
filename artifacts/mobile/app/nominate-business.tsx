/**
 * B3 — Nominate Business (one-tap nomination)
 *
 * Screen 1: PlacesAutocompleteInput → nominate for review
 * Optional expansion: rationale + ownership designations are sent in the same
 * request so no member-entered context can be silently dropped.
 *
 * Contact name, email, and identity fields are DELETED from the required flow.
 */
import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type CommunityReportedOwnership = "minority_owned" | "non_minority_owned" | "not_sure";

type ResultState =
  | { isDuplicate: false; submissionId: string; status: string; message: string; businessId?: string; mapPin: boolean }
  | { isDuplicate: true; type: "already_listed"; businessId: string; message: string }
  | { isDuplicate: true; type: "already_nominated"; submissionId?: string; message: string };

type Stage = "main" | "expanding1" | "done";

export default function NominateBusinessScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [why, setWhy] = useState("");
  const [ownershipDesignations, setOwnershipDesignations] = useState<string[]>([]);
  const [communityReportedOwnership, setCommunityReportedOwnership] = useState<CommunityReportedOwnership>("not_sure");
  const [stage, setStage] = useState<Stage>("main");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [clientRequestId, setClientRequestId] = useState(() => Crypto.randomUUID());

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleNominate() {
    if (!selectedPlace || submitting) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!token) {
        Alert.alert("Sign In Required", "Sign in with your approved community account to nominate a business.");
        return;
      }
      headers["Authorization"] = `Bearer ${token}`;
      headers["Idempotency-Key"] = clientRequestId;

      const res = await fetch(`${API_BASE}/api/community/business-submissions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: selectedPlace.name,
          city: selectedPlace.city ?? undefined,
          state: selectedPlace.state ?? undefined,
          address: selectedPlace.address ?? undefined,
          phone: selectedPlace.phone ?? undefined,
          latitude: selectedPlace.lat ?? undefined,
          longitude: selectedPlace.lng ?? undefined,
          category: selectedPlace.category ?? "General",
          communityReportedOwnership,
          ownershipDesignations: ownershipDesignations.length ? ownershipDesignations : undefined,
          submitterNote: why.trim() || undefined,
          providerPlaceId: selectedPlace.id,
          locationSource: "mwm_directory",
          sourceChannel: "expo_nominate_business",
          clientRequestId,
        }),
      });

      const data = await res.json() as ResultState & {
        error?: string;
        code?: string;
        submissionId?: string;
        businessId?: string;
      };

      if (!res.ok) {
        if (data.code === "BUSINESS_ALREADY_LISTED" && data.businessId) {
          setResult({
            isDuplicate: true,
            type: "already_listed",
            businessId: data.businessId,
            message: data.error ?? "This business is already in the directory.",
          });
          return;
        }
        Alert.alert("Error", data.error ?? "Could not submit. Please try again.");
        return;
      }

      if (data.isDuplicate) {
        setResult(data as ResultState);
      } else {
        setResult({
          isDuplicate: false,
          submissionId: data.submissionId ?? "",
          status: data.status ?? "pending_review",
          message: (data as { message?: string }).message ?? "Your business submission was saved.",
          businessId: data.businessId,
          mapPin: (data as { mapPin?: boolean }).mapPin === true,
        });
        setStage("done");
      }
    } catch {
      Alert.alert("Error", "Could not submit. Please check your connection.");
    } finally {
      setSubmitting(false);
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{result?.status === "published" ? "Live on the Map" : "Submission Saved"}</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.centerWrap}>
            <Feather name="check-circle" size={56} color={colors.success} />
            <Text style={[styles.successTitle, { color: colors.foreground }]}>{result?.status === "published" ? "This business is live" : "Thank you for adding it"}</Text>
            <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
              {result?.message ?? `${selectedPlace?.name ?? "This business"} was saved.`}
            </Text>
            {!result?.isDuplicate && result?.submissionId ? (
              <Text selectable style={[styles.successBody, { color: colors.mutedForeground }]}>Submission ID: {result.submissionId}</Text>
            ) : null}
            <TouchableOpacity
              onPress={() => router.replace("/my-business-submissions" as never)}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>View My Submissions</Text>
            </TouchableOpacity>
            {!result?.isDuplicate && result?.status === "published" && result.businessId ? (
              <TouchableOpacity onPress={() => router.push({ pathname: "/business/[id]", params: { id: result.businessId } } as never)} style={styles.ghostBtn}>
                <Text style={[styles.ghostBtnLabel, { color: colors.primary }]}>View Community Listing</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => { setSelectedPlace(null); setWhy(""); setCommunityReportedOwnership("not_sure"); setOwnershipDesignations([]); setResult(null); setClientRequestId(Crypto.randomUUID()); setStage("main"); }} style={styles.ghostBtn}>
              <Text style={[styles.ghostBtnLabel, { color: colors.foreground }]}>Nominate Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

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
          <TouchableOpacity onPress={() => setStage("main")}>
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
              <Feather name="info" size={18} color={colors.primary} />
              <Text style={[styles.confirmBannerText, { color: colors.primary }]}>
                Add optional context before adding {selectedPlace?.name}. Complete ordinary businesses can publish immediately as unclaimed and not verified.
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
              Community-reported ownership
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>This is a community report, never verified owner identity.</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {([
                ["minority_owned", "Minority-owned"],
                ["non_minority_owned", "Non-minority-owned"],
                ["not_sure", "Not sure"],
              ] as const).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => { setCommunityReportedOwnership(value); if (value !== "minority_owned") setOwnershipDesignations([]); }}
                  style={[styles.ownershipChoice, { backgroundColor: communityReportedOwnership === value ? colors.primary : colors.card, borderColor: communityReportedOwnership === value ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: communityReportedOwnership === value ? colors.primaryForeground : colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {communityReportedOwnership === "minority_owned" ? (
              <View style={{ marginTop: 14 }}>
                <ChipGrid
                  chips={OWNERSHIP_CHIPS}
                  selectedIds={ownershipDesignations}
                  onSelect={(values) => { setOwnershipDesignations(values); setCommunityReportedOwnership("minority_owned"); }}
                  multiSelect
                />
              </View>
            ) : null}

            <View style={styles.equalRow}>
              <TouchableOpacity
                onPress={() => { void handleNominate(); }}
                style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.primary }]}
              >
                {submitting
                  ? <ActivityIndicator color={colors.primaryForeground} size="small" />
                  : <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>Add Community Business</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStage("main")}
                style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.secondary, borderWidth: 1.5, borderColor: colors.border }]}
              >
                <Text style={[styles.primaryBtnLabel, { color: colors.foreground }]}>Back</Text>
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
            Search our current directory first. If the business is missing, use the complete form so we can confirm its public link and precise map pin.
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
          <TouchableOpacity onPress={() => router.push("/list-business" as never)} style={styles.expandLink}>
            <Text style={[styles.expandLinkText, { color: colors.primary }]}>Can&apos;t find it? Add the complete business</Text>
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
  ownershipChoice: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
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
