import React, { useEffect, useState } from "react";
import {
  Alert, Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import {
  BEAUTY_OPTIONS, BUDGET_OPTIONS, COMPANION_OPTIONS, INTEREST_OPTIONS,
  PURPOSE_OPTIONS, RESPONSE_OPTIONS, TRIP_OPTIONS, buildOnboardingPayload,
  buildOnboardingSteps, completeOnboarding, emptyOnboardingDraft, skipOnboardingPrompt,
  type OnboardingDraft, type OnboardingStep,
} from "@/lib/kinfolk-onboarding";

const ONBOARDING_KEY = "@melanin_maps_kinfolk_onboarding";

export async function shouldShowKinfolkOnboarding(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === null;
  } catch { return false; }
}

export async function markKinfolkOnboardingDone(): Promise<boolean> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    return true;
  } catch { return false; }
}

export async function resetKinfolkOnboarding(): Promise<void> {
  try { await AsyncStorage.removeItem(ONBOARDING_KEY); } catch {}
}

interface Props {
  visible: boolean;
  onComplete: () => void;
}

export function KinfolkOnboarding({ visible, onComplete }: Props) {
  const colors = useColors();
  const { update } = useUserPreferences();
  const [draft, setDraft] = useState(emptyOnboardingDraft);
  const [stepId, setStepId] = useState<OnboardingStep>("welcome");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retryFullSkip, setRetryFullSkip] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(emptyOnboardingDraft());
      setStepId("welcome");
      setSaveError(null);
    }
  }, [visible]);

  const steps = buildOnboardingSteps(draft);
  const step = steps.indexOf(stepId);
  const totalSteps = steps.length;
  const isLast = step === totalSteps - 1;
  const change = (patch: Partial<OnboardingDraft>) => setDraft(current => ({ ...current, ...patch }));
  const toggle = (values: string[], value: string) => values.includes(value) ? values.filter(item => item !== value) : [...values, value];

  async function finish(currentDraft: OnboardingDraft, fullSkip = false) {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    setRetryFullSkip(fullSkip);
    const saved = await completeOnboarding(
      buildOnboardingPayload(currentDraft), update, markKinfolkOnboardingDone,
    );
    setSaving(false);
    if (saved) onComplete();
    else {
      const message = "Kinfolk could not finish setup. Nothing was marked complete; please try again. Your draft is still here.";
      setSaveError(message);
      Alert.alert("Setup not saved", message);
    }
  }

  function advance(skip = false) {
    const nextDraft = skip ? skipOnboardingPrompt(draft, stepId) : draft;
    setDraft(nextDraft);
    const nextSteps = buildOnboardingSteps(nextDraft);
    const index = nextSteps.indexOf(stepId);
    if (index >= nextSteps.length - 1) void finish(nextDraft);
    else setStepId(nextSteps[index + 1]);
  }

  function options<T extends string>(items: readonly { value: T; label: string; sub?: string }[], selected: readonly string[], onSelect: (value: T) => void, multiple = true) {
    return <View style={multiple ? styles.catGrid : styles.optionsList}>
      {items.map(option => {
        const active = selected.includes(option.value);
        return <TouchableOpacity key={option.value}
          accessibilityRole={multiple ? "checkbox" : "radio"}
          accessibilityLabel={option.label}
          accessibilityState={{ checked: active, disabled: saving }}
          disabled={saving}
          style={[multiple ? styles.catChip : styles.optionCard, { backgroundColor: active ? colors.primary + "14" : colors.card, borderColor: active ? colors.primary : colors.border }]}
          onPress={() => onSelect(option.value)} activeOpacity={0.8}>
          <View style={multiple ? undefined : { flex: 1 }}>
            <Text style={[multiple ? styles.catLabel : styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
            {option.sub ? <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{option.sub}</Text> : null}
          </View>
          {active && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
        </TouchableOpacity>;
      })}
    </View>;
  }

  const titles: Record<OnboardingStep, string> = {
    welcome: "Hey, kinfolk", interests: "What do you like to discover?",
    use_cases: "What would you like help finding?", budget: "What's your budget vibe?",
    response_style: "How should Kinfolk respond?", beauty_services: "Which beauty services interest you?",
    travel_style: "How would you like to explore?", family_planning: "Family-friendly planning?",
    ready: "You're ready to ask Kinfolk",
  };

  function content() {
    switch (stepId) {
      case "welcome": return <View style={styles.centered}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}><Ionicons name="sparkles" size={44} color={colors.primary} /></View>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>A few taps can help with recommendations. Share only ordinary preferences you want to use.</Text>
      </View>;
      case "interests": return options(INTEREST_OPTIONS.map(value => ({ value, label: value })), draft.interests, value => change({ interests: toggle(draft.interests, value) }));
      case "use_cases": return options(PURPOSE_OPTIONS.map(value => ({ value, label: value })), draft.purposes, value => change({ purposes: toggle(draft.purposes, value) }));
      case "budget": return options(BUDGET_OPTIONS, [draft.budget], value => change({ budget: value }), false);
      case "response_style": return options(RESPONSE_OPTIONS, [draft.responseStyle], value => change({ responseStyle: value }), false);
      case "beauty_services": return options(BEAUTY_OPTIONS, draft.beautyServices, value => change({ beautyServices: toggle(draft.beautyServices, value) }));
      case "travel_style": return <View>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Trip style — choose any</Text>
        {options(TRIP_OPTIONS, draft.tripStyles, value => change({ tripStyles: toggle(draft.tripStyles, value) }))}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Preferred company — optional</Text>
        {options(COMPANION_OPTIONS, [draft.travelCompanion], value => change({ travelCompanion: value }), false)}
      </View>;
      case "family_planning": return <View>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>This is only a planning preference, not a statement about your family or whether you have children.</Text>
        {options([{ value: "family", label: "Include family-friendly options" }], draft.familyFriendly ? ["family"] : [], () => change({ familyFriendly: !draft.familyFriendly }))}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Preferred company — optional</Text>
        {draft.travelCompanion ? <Text style={[styles.setupHeaderCopy, { color: colors.mutedForeground }]}>Choosing company here replaces the earlier company preference. Skip to keep that choice.</Text> : null}
        {options(COMPANION_OPTIONS, [draft.familyCompanion], value => change({ familyCompanion: value }), false)}
      </View>;
      case "ready": return <Text style={[styles.subheading, { color: colors.mutedForeground }]}>Start with a local find or a place to explore whenever you're ready. No location is needed in this setup.</Text>;
    }
  }

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="pageSheet" onRequestClose={() => { if (!saving && step > 0) setStepId(steps[step - 1]); }}>
      <View style={[styles.root, { backgroundColor: colors.background }]} accessibilityViewIsModal>
        <View style={styles.setupHeader}>
          <Text accessibilityRole="header" style={[styles.setupHeaderTitle, { color: colors.text }]}>Optional Kinfolk setup</Text>
          <Text style={[styles.setupHeaderCopy, { color: colors.mutedForeground }]}>Every prompt is optional and editable later in Kinfolk Settings and Taste Profile. Skipping keeps your existing preferences.</Text>
          <Text style={[styles.setupHeaderCopy, { color: colors.mutedForeground }]}>No sensitive or current-life details are requested here. Kinfolk does not infer identity or life status from your answers or activity. These preferences are not public profile information.</Text>
          <Text accessibilityRole="progressbar" accessibilityLiveRegion="polite"
            accessibilityLabel="Kinfolk setup progress" accessibilityValue={{ min: 1, max: totalSteps, now: step + 1, text: `${step + 1} of ${totalSteps}` }}
            style={[styles.setupHeaderCopy, { color: colors.mutedForeground }]}>{step + 1} of {totalSteps}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => void finish(emptyOnboardingDraft(), true)}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView key={stepId} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{titles[stepId]}</Text>
          {content()}
        </ScrollView>
        {saveError && <View style={styles.setupHeader}>
          <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.setupHeaderCopy, { color: colors.text }]}>{saveError}</Text>
          <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={() => void finish(retryFullSkip ? emptyOnboardingDraft() : draft, retryFullSkip)}>
            <Text style={[styles.skipText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.footerRow}>
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving || step === 0 }} disabled={saving || step === 0} style={[styles.backBtn, { borderColor: colors.border, opacity: step === 0 ? 0.4 : 1 }]} onPress={() => setStepId(steps[step - 1])}>
              <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => advance(true)}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving }} style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={() => advance()} disabled={saving}>
              <Text style={styles.nextBtnText}>{saving ? "Saving…" : isLast ? "Save setup" : "Continue"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  setupHeader: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 6 },
  setupHeaderTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  setupHeaderCopy: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 4 },
  scroll: { padding: 24, paddingBottom: 16 },
  centered: { alignItems: "center", paddingTop: 24 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heading: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 12, textAlign: "center" },
  subheading: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23, textAlign: "center", marginBottom: 8 },
  fieldLabel: { fontFamily: "Inter_700Bold", fontSize: 14, marginTop: 20, marginBottom: 6 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 24, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10 },
  catLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  optionsList: { gap: 10, marginTop: 8 },
  optionCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, borderWidth: 1.5, padding: 16 },
  optionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 2 },
  optionDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  footer: { borderTopWidth: 1, padding: 16 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skipText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  backBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12 },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});
