/**
 * B2 — Write Review (badge-first)
 *
 * A badge tap alone creates a COMPLETE, PUBLISHED review.
 * review_text is optional. Stars are derived from the badge.
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
import { ChipGrid } from "@/components/ChipGrid";
import { VoiceTextField } from "@/components/VoiceTextField";
import { REVIEW_BADGE_CHIPS, NEGATIVE_REVIEW_BADGES } from "@/config/chips";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : process.env.EXPO_PUBLIC_API_URL ?? "";

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

/** Derive a numeric star rating from the badge so the DB stays consistent. */
function badgeToRating(badge: string | null): number {
  if (!badge) return 3;
  if (["worth_every_visit", "grandma_approved", "felt_at_home", "great_service", "would_go_back"].includes(badge)) return 5;
  if (badge === "mixed_feelings") return 3;
  return 2; // not_for_us, something_felt_off
}

type Stage = "badge" | "confirmed" | "done";

export default function WriteReviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { businessId, businessName } = useLocalSearchParams<{
    businessId: string;
    businessName: string;
  }>();

  const [badge, setBadge] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [stage, setStage] = useState<Stage>("badge");
  const [submitting, setSubmitting] = useState(false);
  const [patchSubmitting, setPatchSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handlePost() {
    if (!badge || submitting) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Cookie"] = `connect.sid=${token}`;

      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          businessId,
          reviewBadge: badge,
          rating: badgeToRating(badge),
          businessName: businessName ?? undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviewId(data.review?.id ?? null);
      }
      setStage("confirmed");
    } catch {
      // Best-effort — still show confirmation
      setStage("confirmed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddText() {
    if (!reviewText.trim() && !reviewId) { setStage("done"); return; }
    setPatchSubmitting(true);
    try {
      if (reviewId && reviewText.trim()) {
        const token = await getToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Cookie"] = `connect.sid=${token}`;
        await fetch(`${API_BASE}/api/reviews/${reviewId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ text: reviewText.trim(), reviewBadge: badge }),
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
          <View style={{ width: 22 }} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Review Posted</Text>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerWrap}>
          <Feather name="check-circle" size={56} color={colors.success} />
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Thank you — this already helps.
          </Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
            Your {badge?.replace(/_/g, " ")} review is live.
          </Text>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 8 }]}
          >
            <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === "confirmed") {
    const isNegative = badge && NEGATIVE_REVIEW_BADGES.has(badge);
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("done")}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Thank You</Text>
          <View style={{ width: 22 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.confirmBadge}>
              <Feather name="check-circle" size={22} color={colors.success} />
              <Text style={[styles.confirmBadgeText, { color: colors.success }]}>
                Thank you — this already helps.
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              Want to say more?
            </Text>

            <VoiceTextField
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Only if you want to. Even a few words help."
              draftKey={`review_text_draft_${businessId}`}
              style={{ marginTop: 8 }}
            />

            {/* [Add this] and [Skip] with EQUAL prominence */}
            <View style={styles.equalRow}>
              <TouchableOpacity
                onPress={() => { void handleAddText(); }}
                style={[styles.halfBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>
                  {patchSubmitting ? "Saving…" : "Add this"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStage("done")}
                style={[styles.halfBtn, { backgroundColor: colors.secondary, borderWidth: 1.5, borderColor: colors.border }]}
              >
                <Text style={[styles.primaryBtnLabel, { color: colors.foreground }]}>Skip</Text>
              </TouchableOpacity>
            </View>

            {isNegative && (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/report-experience",
                    params: { businessId, businessName },
                  } as never)
                }
                style={styles.softLink}
              >
                <Text style={[styles.softLinkText, { color: colors.mutedForeground }]}>
                  Want to report this experience?
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // stage === "badge"
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {businessName ?? "Write a Review"}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>
          One tap is all it takes.
        </Text>

        <ChipGrid
          chips={REVIEW_BADGE_CHIPS}
          selectedIds={badge ? [badge] : []}
          onSelect={(ids) => setBadge(ids[0] ?? null)}
          style={{ marginTop: 16 }}
        />

        <TouchableOpacity
          onPress={() => { void handlePost(); }}
          disabled={!badge || submitting}
          style={[
            styles.primaryBtn,
            {
              backgroundColor: badge ? colors.primary : colors.muted,
              marginTop: 20,
              opacity: submitting ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryBtnLabel, { color: badge ? colors.primaryForeground : colors.mutedForeground }]}>
            {submitting ? "Posting…" : "Post"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStage("confirmed")} style={styles.expandLink}>
          <Text style={[styles.expandLinkText, { color: colors.primary }]}>Want to say more?</Text>
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
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
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
  equalRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  halfBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  softLink: { alignItems: "center", marginTop: 20, paddingVertical: 8 },
  softLinkText: { fontSize: 14, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successBody: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  confirmBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  confirmBadgeText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
