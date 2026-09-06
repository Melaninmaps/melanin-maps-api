import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  EXPERIENCE_COMMUNITY_OPTIONS,
  resolveExperienceChoiceLabel,
  type BusinessExperienceChoice,
  type BusinessExperienceKind,
  type BusinessExperiencePolicy,
  type CommunityCode,
} from "@workspace/constants";
import { useColors } from "@/hooks/useColors";

const WORDING_PREFERENCE_KEY = "mwm_experience_community_wording";

type ExperienceResponse = {
  policy: BusinessExperiencePolicy;
  ownerChoices: { vibes: string[]; price: string | null };
  aggregates: {
    vibeCounts: Record<string, number>;
    reactionCounts: Record<string, number>;
    priceCounts: Record<string, number>;
  };
  viewerSelections: Array<{ kind: BusinessExperienceKind; key: string }>;
};

function apiBase(): string {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

export default function BusinessExperienceCard({ businessId }: { businessId: string }) {
  const colors = useColors();
  const [data, setData] = useState<ExperienceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wordingOpen, setWordingOpen] = useState(false);
  const [communityCode, setCommunityCode] = useState<CommunityCode>("default");

  const selected = useMemo(
    () => new Set((data?.viewerSelections ?? []).map((item) => `${item.kind}:${item.key}`)),
    [data?.viewerSelections],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [token, storedCommunityCode] = await Promise.all([
        SecureStore.getItemAsync("auth_session_token"),
        AsyncStorage.getItem(WORDING_PREFERENCE_KEY),
      ]);
      if (EXPERIENCE_COMMUNITY_OPTIONS.some((option) => option.code === storedCommunityCode)) {
        setCommunityCode(storedCommunityCode as CommunityCode);
      }
      const response = await fetch(`${apiBase()}/api/businesses/${businessId}/community-feedback`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Could not load community experience tags.");
      setData(await response.json() as ExperienceResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load community experience tags.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [businessId]);

  async function chooseCommunityCode(value: CommunityCode) {
    setCommunityCode(value);
    setWordingOpen(false);
    await AsyncStorage.setItem(WORDING_PREFERENCE_KEY, value).catch(() => {});
  }

  async function toggle(kind: BusinessExperienceKind, key: string) {
    if (saving) return;
    const token = await SecureStore.getItemAsync("auth_session_token");
    if (!token) {
      setError("Sign in to add your voice. Reading community feedback stays open to everyone.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const identity = `${kind}:${key}`;
    setSaving(identity);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/api/businesses/${businessId}/community-feedback`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kind, key, selected: !selected.has(identity) }),
      });
      const body = await response.json().catch(() => ({})) as ExperienceResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Your selection could not be saved.");
      setData((current) => current ? {
        ...current,
        aggregates: body.aggregates,
        viewerSelections: body.viewerSelections,
      } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your selection could not be saved.");
    } finally {
      setSaving(null);
    }
  }

  function group(
    kind: BusinessExperienceKind,
    title: string,
    description: string,
    choices: BusinessExperienceChoice[],
  ) {
    if (!data || choices.length === 0) return null;
    const ownerVibes = new Set(data.ownerChoices.vibes);
    const selectedPrice = data.viewerSelections.find((item) => item.kind === "price")?.key;

    return (
      <View style={styles.group}>
        <Text style={[styles.groupTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.groupDescription, { color: colors.mutedForeground }]}>{description}</Text>
        <View style={styles.choiceWrap}>
          {choices.map((choice) => {
            const identity = `${kind}:${choice.key}`;
            const isSelected = kind === "price" ? selectedPrice === choice.key : selected.has(identity);
            const count = kind === "vibe"
              ? data.aggregates.vibeCounts[choice.key] ?? 0
              : kind === "price"
                ? data.aggregates.priceCounts[choice.key] ?? 0
                : data.aggregates.reactionCounts[choice.key] ?? 0;
            const ownerSelected = ownerVibes.has(choice.key);
            return (
              <TouchableOpacity
                key={identity}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: saving !== null }}
                activeOpacity={0.82}
                disabled={saving !== null}
                onPress={() => { void toggle(kind, choice.key); }}
                style={[
                  styles.choice,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.choiceTop}>
                  {saving === identity
                    ? <ActivityIndicator size="small" color={isSelected ? "#FFF" : colors.primary} />
                    : isSelected
                      ? <Feather name="check-circle" size={13} color="#FFF" />
                      : null}
                  <Text style={[styles.choiceLabel, { color: isSelected ? "#FFF" : colors.foreground }]}>
                    {resolveExperienceChoiceLabel(choice, communityCode)}
                  </Text>
                  {ownerSelected && <Text style={[styles.ownerBadge, { color: isSelected ? "#FFF" : colors.primary }]}>OWNER</Text>}
                  {count > 0 && <Text style={[styles.count, { color: isSelected ? "#FFF" : colors.primary }]}>{count}</Text>}
                </View>
                <Text style={[styles.choiceHelper, { color: isSelected ? "#FFFFFFBB" : colors.mutedForeground }]}>
                  {choice.helperText}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  if (loading) {
    return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!data) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Community experience is temporarily unavailable.</Text>
        <TouchableOpacity onPress={() => { void load(); }}><Text style={[styles.retry, { color: colors.primary }]}>Try again</Text></TouchableOpacity>
      </View>
    );
  }

  const wordingLabel = EXPERIENCE_COMMUNITY_OPTIONS.find((option) => option.code === communityCode)?.label ?? "Universal wording";
  const ownerPrice = data.policy.priceChoices.find((choice) => choice.key === data.ownerChoices.price) ?? null;
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Feather name="heart" size={17} color={colors.primary} />
            <Text style={[styles.title, { color: colors.foreground }]}>Share Your Experience</Text>
          </View>
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>Choose up to two quick reviews, plus atmosphere tags where they fit. Positive tags appear right away and help community search; they do not verify ownership.</Text>
        </View>
        <TouchableOpacity onPress={() => setWordingOpen(true)} style={[styles.wordingButton, { borderColor: colors.border }]}>
          <Feather name="globe" size={13} color={colors.primary} />
          <Text style={[styles.wordingText, { color: colors.primary }]} numberOfLines={1}>{wordingLabel}</Text>
        </TouchableOpacity>
      </View>

      {group("vibe", data.policy.atmosphereLabel, "Atmosphere, occasion, and energy — only when it fits this business type.", data.policy.vibeChoices)}
      {group("reaction", data.policy.reactionLabel, "Fast positive feedback tailored to what this kind of business does.", data.policy.reactionChoices)}
      {ownerPrice && (
        <View style={[styles.ownerPrice, { borderColor: `${colors.primary}55`, backgroundColor: `${colors.primary}16` }]}>
          <View style={styles.ownerPriceHeading}>
            <Feather name="tag" size={14} color={colors.primary} />
            <Text style={[styles.ownerPriceLabel, { color: colors.primary }]}>Owner-provided price</Text>
          </View>
          <Text style={[styles.ownerPriceValue, { color: colors.foreground }]}>{ownerPrice.label}</Text>
          <Text style={[styles.ownerPriceHelper, { color: colors.mutedForeground }]}>Provided by the claimed owner; community estimates are separate.</Text>
        </View>
      )}
      {group("price", "Community price estimate", "Community estimates help people plan and may differ from the owner-provided price.", data.policy.priceChoices)}

      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Text style={[styles.disclosure, { color: colors.mutedForeground }]}>Different wording is shown only when you select it. The underlying tag stays the same across communities.</Text>

      <Modal visible={wordingOpen} transparent animationType="slide" onRequestClose={() => setWordingOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setWordingOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: 24 }]}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Choose how quick tags are worded</Text>
                <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>Nothing is inferred from your name or location. You choose.</Text>
              </View>
              <TouchableOpacity onPress={() => setWordingOpen(false)}><Feather name="x" size={20} color={colors.mutedForeground} /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 390 }}>
              {EXPERIENCE_COMMUNITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.code}
                  onPress={() => { void chooseCommunityCode(option.code); }}
                  style={[styles.wordingOption, { borderColor: colors.border }]}
                >
                  <Text style={[styles.wordingOptionText, { color: colors.foreground }]}>{option.label}</Text>
                  {communityCode === option.code && <Feather name="check" size={17} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, borderWidth: 1, borderRadius: 16, padding: 15, gap: 18 },
  header: { gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  title: { fontFamily: "Inter_700Bold", fontSize: 16 },
  intro: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 5 },
  wordingButton: { minHeight: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", maxWidth: "100%" },
  wordingText: { fontFamily: "Inter_600SemiBold", fontSize: 11, flexShrink: 1 },
  ownerPrice: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  ownerPriceHeading: { flexDirection: "row", alignItems: "center", gap: 6 },
  ownerPriceLabel: { fontFamily: "Inter_700Bold", fontSize: 12 },
  ownerPriceValue: { fontFamily: "Inter_700Bold", fontSize: 14 },
  ownerPriceHelper: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15 },
  group: { gap: 8 },
  groupTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  groupDescription: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
  choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 9, minWidth: "46%", flexGrow: 1, maxWidth: "100%" },
  choiceTop: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  choiceLabel: { fontFamily: "Inter_700Bold", fontSize: 12, flexShrink: 1 },
  choiceHelper: { fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 14, marginTop: 2 },
  ownerBadge: { fontFamily: "Inter_700Bold", fontSize: 8 },
  count: { fontFamily: "Inter_700Bold", fontSize: 10 },
  retry: { fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 10 },
  error: { color: "#B42318", backgroundColor: "#FEE4E2", borderRadius: 10, padding: 10, fontFamily: "Inter_600SemiBold", fontSize: 12 },
  disclosure: { fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 14 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.48)" },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18 },
  sheetHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  sheetSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 3, lineHeight: 17 },
  wordingOption: { minHeight: 50, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  wordingOptionText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
