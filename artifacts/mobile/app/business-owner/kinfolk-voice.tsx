import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

const TONES = [
  "warm",
  "direct",
  "celebratory",
  "professional",
  "playful",
  "calm",
] as const;

type Tone = (typeof TONES)[number];
type DraftKind = "caption" | "flyer_copy" | "review_reply" | "customer_message";

type BusinessVoiceProfile = {
  tones: Tone[];
  languagePreference: string | null;
  audienceGuidance: string | null;
  wordsToUse: string[];
  wordsToAvoid: string[];
  signaturePhrases: string[];
};

const EMPTY_PROFILE: BusinessVoiceProfile = {
  tones: [],
  languagePreference: null,
  audienceGuidance: null,
  wordsToUse: [],
  wordsToAvoid: [],
  signaturePhrases: [],
};

const DRAFT_KINDS: ReadonlyArray<{ value: DraftKind; label: string }> = [
  { value: "caption", label: "Caption" },
  { value: "flyer_copy", label: "Flyer copy" },
  { value: "review_reply", label: "Review reply" },
  { value: "customer_message", label: "Customer message" },
];

function commaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function BusinessVoiceProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [profile, setProfile] = useState<BusinessVoiceProfile>(EMPTY_PROFILE);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftKind, setDraftKind] = useState<DraftKind>("caption");
  const [draftRequest, setDraftRequest] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [editableDraft, setEditableDraft] = useState("");
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const base = getApiBase();
      const headers = await getMemberApiHeaders();
      const mineResponse = await fetch(`${base}/api/businesses/mine`, { headers });
      const mine = (await mineResponse.json().catch(() => ({}))) as {
        business?: { id?: string; name?: string } | null;
        error?: string;
      };
      if (!mineResponse.ok || !mine.business?.id) {
        throw new Error(mine.error ?? "An approved business owner link is required.");
      }

      const resolvedBusinessId = mine.business.id;
      setBusinessId(resolvedBusinessId);
      setBusinessName(mine.business.name?.trim() || null);
      const response = await fetch(
        `${base}/api/businesses/${encodeURIComponent(resolvedBusinessId)}/kinfolk-voice-profile`,
        { headers },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        profile?: BusinessVoiceProfile | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load Business Voice Profile.");
      }
      setProfile({ ...EMPTY_PROFILE, ...(payload.profile ?? {}) });
    } catch (error) {
      setBusinessId(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load Business Voice Profile.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleTone = (tone: Tone) => {
    setProfile((current) => ({
      ...current,
      tones: current.tones.includes(tone)
        ? current.tones.filter((item) => item !== tone)
        : current.tones.length < 3
          ? [...current.tones, tone]
          : current.tones,
    }));
  };

  const saveProfile = async () => {
    if (!businessId || !confirmed) return;
    setSaving(true);
    setMessage(null);
    try {
      const base = getApiBase();
      const headers = await getMemberApiHeaders();
      const response = await fetch(
        `${base}/api/businesses/${encodeURIComponent(businessId)}/kinfolk-voice-profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ ...profile, ownerConfirmed: confirmed }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        profile?: BusinessVoiceProfile;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save Business Voice Profile.");
      }
      setProfile({ ...EMPTY_PROFILE, ...(payload.profile ?? {}) });
      setConfirmed(false);
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setMessage(
        "Saved. Kinfolk uses this only for a business-facing draft you request.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save Business Voice Profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const requestDraft = async () => {
    if (!businessId || !draftRequest.trim()) return;
    setDrafting(true);
    setDraftMessage(null);
    try {
      const base = getApiBase();
      const headers = await getMemberApiHeaders();
      const response = await fetch(
        `${base}/api/businesses/${encodeURIComponent(businessId)}/kinfolk-drafts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            kind: draftKind,
            request: draftRequest.trim(),
            ownerRequested: true,
          }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        draft?: string;
        error?: string;
      };
      if (!response.ok || !payload.draft) {
        throw new Error(payload.error ?? "Could not prepare an editable draft.");
      }
      setEditableDraft(payload.draft);
      setDraftMessage("Editable draft ready. Review and revise it before any use.");
    } catch (error) {
      setDraftMessage(
        error instanceof Error
          ? error.message
          : "Could not prepare an editable draft.",
      );
    } finally {
      setDrafting(false);
    }
  };

  const updateList = (
    field: "wordsToUse" | "wordsToAvoid" | "signaturePhrases",
    value: string,
  ) => {
    setProfile((current) => ({ ...current, [field]: commaList(value) }));
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="business-voice-profile-screen">
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityLabel="Back to Business Admin"
          activeOpacity={0.85}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/business-owner" as never))}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Business Voice & Drafts</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.intro, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}>
          <View style={[styles.introIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Feather name="mic" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.introTitle, { color: colors.foreground }]}>Business Voice Profile</Text>
            <Text style={[styles.introCopy, { color: colors.mutedForeground }]}>
              Set the voice for business-facing Kinfolk drafts you request. It never changes member chat, reviews, community language, or your business record.
            </Text>
          </View>
        </View>

        {businessName ? (
          <Text style={[styles.businessName, { color: colors.mutedForeground }]}>For {businessName}</Text>
        ) : null}

        {message ? (
          <Text accessibilityRole="alert" style={[styles.status, { color: colors.primary }]}>{message}</Text>
        ) : null}

        {!businessId ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={24} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Approved owner access required</Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>Business Voice Profiles are available only to the approved owner of a business listing.</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => void load()} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.foreground }]}>Tone (up to three)</Text>
              <View style={styles.chipRow}>
                {TONES.map((tone) => {
                  const active = profile.tones.includes(tone);
                  return (
                    <TouchableOpacity
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      activeOpacity={0.85}
                      key={tone}
                      onPress={() => toggleTone(tone)}
                      style={[
                        styles.toneChip,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {active ? <Feather name="check" size={13} color="#FFF" /> : null}
                      <Text style={[styles.toneText, { color: active ? "#FFF" : colors.foreground }]}>{tone}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.foreground }]}>Language preference</Text>
              <TextInput
                multiline
                maxLength={300}
                onChangeText={(value) => setProfile((current) => ({ ...current, languagePreference: value || null }))}
                placeholder="Example: Plain, welcoming language; avoid jargon."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.multilineInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={profile.languagePreference ?? ""}
              />
            </View>

            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.foreground }]}>Audience guidance</Text>
              <TextInput
                multiline
                maxLength={600}
                onChangeText={(value) => setProfile((current) => ({ ...current, audienceGuidance: value || null }))}
                placeholder="Who this requested draft should speak to."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.multilineInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={profile.audienceGuidance ?? ""}
              />
            </View>

            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.foreground }]}>Words to use</Text>
              <Text style={[styles.helper, { color: colors.mutedForeground }]}>Separate words or phrases with commas.</Text>
              <TextInput
                onChangeText={(value) => updateList("wordsToUse", value)}
                placeholder="welcoming, local"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={profile.wordsToUse.join(", ")}
              />
            </View>

            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.foreground }]}>Words to avoid</Text>
              <TextInput
                onChangeText={(value) => updateList("wordsToAvoid", value)}
                placeholder="salesy, jargon"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={profile.wordsToAvoid.join(", ")}
              />
            </View>

            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.foreground }]}>Signature phrasing</Text>
              <TextInput
                onChangeText={(value) => updateList("signaturePhrases", value)}
                placeholder="Made with care"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={profile.signaturePhrases.join(", ")}
              />
            </View>

            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: confirmed }}
              activeOpacity={0.85}
              onPress={() => setConfirmed((value) => !value)}
              style={[styles.confirmation, { backgroundColor: colors.card, borderColor: confirmed ? colors.primary : colors.border }]}
            >
              <Feather name={confirmed ? "check-square" : "square"} size={20} color={confirmed ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.confirmationText, { color: colors.foreground }]}>I confirm these are authorized business-provided inputs. They may be used only in business-facing drafts I request, not as community consensus or member preference.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={saving || !confirmed}
              onPress={() => void saveProfile()}
              style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: saving || !confirmed ? 0.55 : 1 }]}
            >
              {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Feather name="save" size={17} color="#FFF" />}
              <Text style={styles.primaryButtonText}>{saving ? "Saving…" : "Save Business Voice Profile"}</Text>
            </TouchableOpacity>

            <View style={[styles.draftSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Request an editable draft</Text>
              <Text style={[styles.helper, { color: colors.mutedForeground }]}>Kinfolk uses only your saved Business Voice Profile and this request. It never posts, sends, replies, or changes your business record.</Text>

              <Text style={[styles.label, { color: colors.foreground }]}>Draft type</Text>
              <View style={styles.chipRow}>
                {DRAFT_KINDS.map((kind) => {
                  const active = draftKind === kind.value;
                  return (
                    <TouchableOpacity
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      activeOpacity={0.85}
                      key={kind.value}
                      onPress={() => setDraftKind(kind.value)}
                      style={[styles.toneChip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
                    >
                      <Text style={[styles.toneText, { color: active ? "#FFF" : colors.foreground }]}>{kind.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>What should this draft say?</Text>
              <TextInput
                multiline
                maxLength={1200}
                onChangeText={setDraftRequest}
                placeholder="Provide the facts and intent you want in this draft."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.draftInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={draftRequest}
              />

              {draftMessage ? <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.primary }]}>{draftMessage}</Text> : null}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={drafting || !draftRequest.trim()}
                onPress={() => void requestDraft()}
                style={[styles.draftButton, { backgroundColor: "#5E3B87", opacity: drafting || !draftRequest.trim() ? 0.55 : 1 }]}
              >
                {drafting ? <ActivityIndicator size="small" color="#FFF" /> : <Feather name="edit-3" size={17} color="#FFF" />}
                <Text style={styles.primaryButtonText}>{drafting ? "Preparing…" : "Prepare editable draft"}</Text>
              </TouchableOpacity>

              {editableDraft ? (
                <View style={styles.group}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Editable draft — owner review required</Text>
                  <TextInput
                    multiline
                    onChangeText={setEditableDraft}
                    style={[styles.editableDraft, { backgroundColor: colors.card, borderColor: "#5E3B87", color: colors.foreground }]}
                    value={editableDraft}
                  />
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backButton: { width: 38, height: 38, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  scroll: { padding: 16, gap: 16 },
  intro: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  introIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  introTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  introCopy: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: 3 },
  businessName: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: -7 },
  group: { gap: 8 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  helper: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginBottom: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toneChip: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8 },
  toneText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14 },
  multilineInput: { minHeight: 88, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, textAlignVertical: "top" },
  confirmation: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 13, alignItems: "flex-start" },
  confirmationText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  primaryButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 13, paddingHorizontal: 16 },
  draftButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 13, paddingHorizontal: 16, marginTop: 4 },
  primaryButtonText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  status: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 19 },
  draftSection: { borderTopWidth: 1, paddingTop: 20, gap: 12, marginTop: 4 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  draftInput: { minHeight: 116, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, textAlignVertical: "top" },
  editableDraft: { minHeight: 170, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, textAlignVertical: "top" },
  empty: { alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, padding: 24 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16, textAlign: "center" },
  emptyCopy: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 },
  retryButton: { borderRadius: 11, paddingVertical: 11, paddingHorizontal: 18, marginTop: 4 },
  retryText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 13 },
});
