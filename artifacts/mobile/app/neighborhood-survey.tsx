/**
 * B4 — Neighborhood Survey (one-tap welcome rating)
 *
 * Screen 1: "How welcoming did {neighborhood} feel?" + WELCOME_RATING_CHIPS + [Submit]
 * Expansion 1: WHAT_STOOD_OUT_CHIPS + VoiceTextField
 *
 * SCORING RULE: Computed ONLY from community experience inputs.
 * Never references police crime statistics, arrest data, or income data.
 * All copy says "welcoming", never "safe".
 */
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
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
import { useAutoContext } from "@/hooks/useAutoContext";
import { ChipGrid } from "@/components/ChipGrid";
import { VoiceTextField } from "@/components/VoiceTextField";
import { WELCOME_RATING_CHIPS, WHAT_STOOD_OUT_CHIPS } from "@/config/chips";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : process.env.EXPO_PUBLIC_API_URL ?? "";

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

type Stage = "rating" | "confirmed" | "expanding" | "done";

export default function NeighborhoodSurveyScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ctx = useAutoContext();

  const [rating, setRating] = useState<string[]>([]);
  const [surveyId, setSurveyId] = useState<number | null>(null);
  const [whatStoodOut, setWhatStoodOut] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [stage, setStage] = useState<Stage>("rating");
  const [submitting, setSubmitting] = useState(false);
  const [patchSubmitting, setPatchSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const neighborhoodLabel =
    ctx.neighborhood ?? ctx.city ?? "this neighborhood";

  async function handleSubmit() {
    if (!rating[0] || submitting) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Cookie"] = `connect.sid=${token}`;

      const res = await fetch(`${API_BASE}/api/surveys/welcome`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          welcomeRating: parseInt(rating[0], 10),
          city: ctx.city ?? undefined,
          neighborhood: ctx.neighborhood ?? undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSurveyId(data.survey?.id ?? null);
      }
      setStage("confirmed");
    } catch {
      setStage("confirmed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExpansionSubmit() {
    if (patchSubmitting) return;
    if (whatStoodOut.length === 0 && !comments.trim()) { setStage("done"); return; }
    setPatchSubmitting(true);
    try {
      if (surveyId) {
        const token = await getToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Cookie"] = `connect.sid=${token}`;
        await fetch(`${API_BASE}/api/surveys/${surveyId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            whatStoodOut: whatStoodOut.length ? whatStoodOut : undefined,
            comments: comments.trim() || undefined,
          }),
        });
      }
    } catch { /* non-critical */ } finally {
      setPatchSubmitting(false);
      setStage("done");
    }
  }

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
          <Feather name="check-circle" size={56} color={colors.success} />
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Thank you — this already helps.
          </Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
            Your rating helps the community know how welcoming this area feels.
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Rating Recorded
          </Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.confirmBanner}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.confirmBannerText, { color: colors.success }]}>
              We hear you. This is recorded.
            </Text>
          </View>

          <Text style={[styles.bodyText, { color: colors.mutedForeground, marginTop: 20 }]}>
            You can always add more later.
          </Text>

          <TouchableOpacity
            onPress={() => setStage("expanding")}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
          >
            <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>
              Want to add more?
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStage("done")} style={styles.skipLink}>
            <Text style={[styles.skipLinkText, { color: colors.mutedForeground }]}>Skip</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (stage === "expanding") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("confirmed")}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>What stood out?</Text>
          <View style={{ width: 22 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            <ChipGrid
              chips={WHAT_STOOD_OUT_CHIPS}
              selectedIds={whatStoodOut}
              onSelect={setWhatStoodOut}
              multiSelect
            />

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              Anything you want to add?
            </Text>
            <VoiceTextField
              value={comments}
              onChangeText={setComments}
              placeholder="Only if you want to. Even a few words help."
              draftKey="survey_comments_draft"
            />

            <View style={styles.equalRow}>
              <TouchableOpacity
                onPress={() => { void handleExpansionSubmit(); }}
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

  // stage === "rating"
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rate This Area</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Context line */}
        <TouchableOpacity
          style={[styles.contextLine, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={ctx.refresh}
        >
          <Feather name="map-pin" size={14} color={colors.primary} />
          <Text style={[styles.contextText, { color: colors.foreground }]} numberOfLines={1}>
            {ctx.loading ? "Detecting location…" : neighborhoodLabel}
          </Text>
          <Feather name="refresh-cw" size={12} color={colors.mutedForeground} />
        </TouchableOpacity>

        <Text style={[styles.questionText, { color: colors.foreground }]}>
          How welcoming did{"\n"}{neighborhoodLabel} feel?
        </Text>

        <ChipGrid
          chips={WELCOME_RATING_CHIPS}
          selectedIds={rating}
          onSelect={setRating}
          columns={1}
          style={{ marginTop: 16 }}
        />

        <TouchableOpacity
          onPress={() => { void handleSubmit(); }}
          disabled={!rating[0] || submitting}
          style={[
            styles.primaryBtn,
            {
              backgroundColor: rating[0] ? colors.primary : colors.muted,
              marginTop: 24,
              opacity: submitting ? 0.7 : 1,
            },
          ]}
        >
          {submitting
            ? <ActivityIndicator color={colors.primaryForeground} size="small" />
            : <Text style={[styles.primaryBtnLabel, { color: rating[0] ? colors.primaryForeground : colors.mutedForeground }]}>
                Submit
              </Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStage("expanding")} style={styles.expandLink}>
          <Text style={[styles.expandLinkText, { color: colors.primary }]}>Want to add more?</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
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
  questionText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
    marginTop: 20,
  },
  bodyText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
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
  skipLink: { alignItems: "center", paddingVertical: 10 },
  skipLinkText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  equalRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successBody: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  confirmBanner: { flexDirection: "row", alignItems: "center", gap: 10 },
  confirmBannerText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
