/**
 * B1 — Unified Place Report
 *
 * Merges safety-tip + report-space + report-safety into one progressive screen.
 * Target: under 10 seconds, ZERO required typed fields.
 * A chip selection alone creates a complete, published record.
 */
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { useAutoContext } from "@/hooks/useAutoContext";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { ChipGrid } from "@/components/ChipGrid";
import { VoiceTextField } from "@/components/VoiceTextField";
import {
  EXPERIENCE_CHIPS,
  TIME_OF_DAY_CHIPS,
  WHO_INVOLVED_CHIPS,
  HAPPENED_BEFORE_CHIPS,
  OTHERS_SAW_CHIPS,
} from "@/config/chips";

type Stage = "chip" | "confirmed" | "expanding1" | "expanding2" | "done";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : process.env.EXPO_PUBLIC_API_URL ?? "";

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

export default function ReportExperienceScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    businessId?: string;
    businessName?: string;
    mapLat?: string;
    mapLng?: string;
  }>();

  const ctx = useAutoContext();
  const { enqueue } = useOfflineQueue("safety-tips");

  const [stage, setStage] = useState<Stage>("chip");
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<string[]>([]);
  const [whoInvolved, setWhoInvolved] = useState<string[]>([]);
  const [happenedBefore, setHappenedBefore] = useState<string[]>([]);
  const [othersSaw, setOthersSaw] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [patchSubmitting, setPatchSubmitting] = useState(false);

  const lat = ctx.lat ?? (params.mapLat ? parseFloat(params.mapLat) : null);
  const lng = ctx.lng ?? (params.mapLng ? parseFloat(params.mapLng) : null);
  const city = ctx.city;
  const state = ctx.state;
  const businessName = params.businessName ?? ctx.nearbyBusinesses[0]?.name ?? null;
  const contextLabel = ctx.label ?? businessName ?? city ?? "your location";

  const showDescriptionField = selectedChip === "something_else";

  async function handleInitialSubmit() {
    if (!selectedChip || submitting) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Cookie"] = `connect.sid=${token}`;

      const payload = {
        experienceChip: selectedChip,
        ...(lat != null && lng != null ? { lat, lng } : {}),
        city: city ?? undefined,
        state: state ?? undefined,
        businessName: businessName ?? undefined,
        linkedBusinessId: params.businessId ?? undefined,
      };

      const res = await fetch(`${API_BASE}/api/safety-tips`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setReportId(data.tip?.id ?? null);
      } else {
        // If server rejects (e.g. auth), queue for later
        await enqueue({ endpoint: "/api/safety-tips", body: payload });
      }
      setStage("confirmed");
    } catch {
      // Offline — queue it
      await enqueue({
        endpoint: "/api/safety-tips",
        body: {
          experienceChip: selectedChip,
          city: city ?? undefined,
          businessName: businessName ?? undefined,
        },
      });
      setStage("confirmed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePatchSubmit() {
    if (patchSubmitting) return;
    if (!description.trim() && timeOfDay.length === 0 && whoInvolved.length === 0) {
      setStage("done");
      return;
    }
    setPatchSubmitting(true);
    try {
      if (reportId) {
        const token = await getToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Cookie"] = `connect.sid=${token}`;
        await fetch(`${API_BASE}/api/safety-tips/${reportId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            description: description.trim() || undefined,
            timeOfDay: timeOfDay[0] ?? undefined,
            whoInvolved: whoInvolved.length ? whoInvolved : undefined,
          }),
        });
      }
    } catch { /* non-critical */ } finally {
      setPatchSubmitting(false);
      if (stage === "expanding1") {
        setStage("expanding2");
      } else {
        setStage("done");
      }
    }
  }

  async function handleFinalPatch() {
    if (patchSubmitting) return;
    setPatchSubmitting(true);
    try {
      if (reportId && (happenedBefore.length || othersSaw.length)) {
        const token = await getToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Cookie"] = `connect.sid=${token}`;
        await fetch(`${API_BASE}/api/safety-tips/${reportId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            happenedBefore: happenedBefore[0] ?? undefined,
            othersSaw: othersSaw[0] ?? undefined,
          }),
        });
      }
    } catch { /* non-critical */ } finally {
      setPatchSubmitting(false);
      setStage("done");
    }
  }

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (stage === "done") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.centerWrap}>
          <Feather name="check-circle" size={48} color={colors.success} />
          <Text style={[styles.confirmTitle, { color: colors.foreground }]}>
            Thank you — this already helps.
          </Text>
          <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>
            You can always add more later.
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

  if (stage === "confirmed") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("done")}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ width: 22 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.confirmBadge}>
              <Feather name="check-circle" size={24} color={colors.success} />
              <Text style={[styles.confirmBadgeText, { color: colors.success }]}>We hear you. This is recorded.</Text>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              Add a few words?
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Only if you want to. Even a few words help.
            </Text>

            <VoiceTextField
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what happened"
              draftKey="report_description_draft"
              style={{ marginTop: 10 }}
            />

            <View style={styles.confirmActions}>
              <TouchableOpacity
                onPress={() => { void handlePatchSubmit(); }}
                style={[styles.primaryBtn, { backgroundColor: colors.primary, flex: 1 }]}
              >
                <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>
                  {patchSubmitting ? "Saving…" : "Add this"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStage("expanding1")}
                style={styles.expandLink}
              >
                <Text style={[styles.expandLinkText, { color: colors.mutedForeground }]}>Want to add more?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setStage("done")} style={[styles.skipLink, { marginTop: 8 }]}>
              <Text style={[styles.skipLinkText, { color: colors.mutedForeground }]}>Skip</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (stage === "expanding1") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("confirmed")}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>A bit more detail</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>When did this happen?</Text>
          <ChipGrid chips={TIME_OF_DAY_CHIPS} selectedIds={timeOfDay} onSelect={setTimeOfDay} />

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Who was involved?</Text>
          <ChipGrid chips={WHO_INVOLVED_CHIPS} selectedIds={whoInvolved} onSelect={setWhoInvolved} multiSelect />

          <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
            <TouchableOpacity
              onPress={() => { void handlePatchSubmit(); }}
              style={[styles.primaryBtn, { backgroundColor: colors.primary, flex: 1 }]}
            >
              <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>
                {patchSubmitting ? "Saving…" : "Add this"}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setStage("done")} style={styles.skipLink}>
            <Text style={[styles.skipLinkText, { color: colors.mutedForeground }]}>Skip</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (stage === "expanding2") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("expanding1")}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>One more thing</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Has this happened before?</Text>
          <ChipGrid chips={HAPPENED_BEFORE_CHIPS} selectedIds={happenedBefore} onSelect={setHappenedBefore} />

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Did anyone else see it?</Text>
          <ChipGrid chips={OTHERS_SAW_CHIPS} selectedIds={othersSaw} onSelect={setOthersSaw} />

          <TouchableOpacity
            onPress={() => { void handleFinalPatch(); }}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
          >
            <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>
              {patchSubmitting ? "Saving…" : "Add this"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStage("done")} style={styles.skipLink}>
            <Text style={[styles.skipLinkText, { color: colors.mutedForeground }]}>Skip</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // stage === "chip"
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Report an Experience</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Editable context line */}
          <TouchableOpacity
            style={[styles.contextLine, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={ctx.refresh}
            accessibilityLabel="Location context — tap to refresh"
          >
            <Feather name="map-pin" size={14} color={colors.primary} />
            <Text style={[styles.contextText, { color: colors.foreground }]} numberOfLines={1}>
              {ctx.loading ? "Detecting location…" : contextLabel}
            </Text>
            <Feather name="refresh-cw" size={12} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Anonymity reassurance */}
          <Text style={[styles.anonymityNote, { color: colors.mutedForeground }]}>
            This is anonymous. You don&apos;t have to explain.
          </Text>

          {/* Experience chips */}
          <ChipGrid
            chips={EXPERIENCE_CHIPS}
            selectedIds={selectedChip ? [selectedChip] : []}
            onSelect={(ids) => setSelectedChip(ids[0] ?? null)}
            style={{ marginTop: 16 }}
          />

          {/* Reveal description field when "Something else" is selected */}
          {showDescriptionField && (
            <VoiceTextField
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what happened"
              draftKey="report_something_else_draft"
              style={{ marginTop: 12 }}
            />
          )}

          {/* Primary submit */}
          <TouchableOpacity
            onPress={() => { void handleInitialSubmit(); }}
            disabled={!selectedChip || submitting}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: selectedChip ? colors.primary : colors.muted,
                marginTop: 20,
                opacity: submitting ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Submit report"
          >
            <Text style={[styles.primaryBtnLabel, { color: selectedChip ? colors.primaryForeground : colors.mutedForeground }]}>
              {submitting ? "Submitting…" : "Submit"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStage("confirmed")} style={styles.expandLink}>
            <Text style={[styles.expandLinkText, { color: colors.primary }]}>Want to add more?</Text>
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
  contextLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  contextText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  anonymityNote: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginTop: 16,
    fontStyle: "italic",
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  hint: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primaryBtnLabel: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  expandLink: { alignItems: "center", paddingVertical: 10 },
  expandLinkText: { fontSize: 15, fontFamily: "Inter_500Medium", textDecorationLine: "underline" },
  skipLink: { alignItems: "center", paddingVertical: 10 },
  skipLinkText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  confirmBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  confirmBadgeText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  confirmTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmBody: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  confirmActions: { flexDirection: "column", gap: 8, marginTop: 16 },
});
