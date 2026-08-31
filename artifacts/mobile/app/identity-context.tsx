/**
 * /identity-context — Gender, Pronouns & Privacy Settings
 *
 * Lets members privately set their sex assigned at birth (for opted-in medical
 * context), gender identity, pronouns, and two purpose-limitation toggles.
 *
 * These fields are used ONLY for:
 *   allowPronounAwareLanguage  → Kinfolk writing tone (how Kinfolk refers to you)
 *   allowMedicallyRelevantContext → Kinfolk adds anatomy-specific detail to
 *                                    medical questions only
 *
 * They are NEVER used for public profiles, recommendations, advertising, or
 * any feature other than the two listed above.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────────────
type SexAtBirth    = "female" | "male" | "intersex" | "prefer_not_to_say" | null;
type GenderIdentity = "woman" | "man" | "nonbinary" | "another_identity" | "prefer_not_to_say" | null;
type PronounSet    = "she_her" | "he_him" | "they_them" | "use_my_name" | "custom" | "prefer_not_to_say" | null;

interface IdentityContextState {
  sexAssignedAtBirth: SexAtBirth;
  genderIdentity: GenderIdentity;
  pronounSet: PronounSet;
  allowMedicallyRelevantContext: boolean;
  allowPronounAwareLanguage: boolean;
  version: number;
}

// ── Option labels ─────────────────────────────────────────────────────────────
const SEX_OPTIONS: { value: SexAtBirth; label: string }[] = [
  { value: "female",          label: "Female" },
  { value: "male",            label: "Male" },
  { value: "intersex",        label: "Intersex" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const GENDER_OPTIONS: { value: GenderIdentity; label: string }[] = [
  { value: "woman",            label: "Woman" },
  { value: "man",              label: "Man" },
  { value: "nonbinary",        label: "Non-binary" },
  { value: "another_identity", label: "Another identity" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const PRONOUN_OPTIONS: { value: PronounSet; label: string }[] = [
  { value: "she_her",          label: "She / Her" },
  { value: "he_him",           label: "He / Him" },
  { value: "they_them",        label: "They / Them" },
  { value: "use_my_name",      label: "Use my name" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const SECTION_ACCENT = "#7C3AED";

function RadioGroup<T extends string | null>({
  value, options, onSelect, disabled, colors,
}: {
  value: T;
  options: { value: T; label: string }[];
  onSelect: (v: T) => void;
  disabled?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={s.radioGroup}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[
              s.radioRow,
              { borderColor: selected ? SECTION_ACCENT : colors.border,
                backgroundColor: selected ? `${SECTION_ACCENT}10` : colors.card },
            ]}
            onPress={() => !disabled && onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <View style={[
              s.radioCircle,
              { borderColor: selected ? SECTION_ACCENT : colors.border },
            ]}>
              {selected && <View style={[s.radioDot, { backgroundColor: SECTION_ACCENT }]} />}
            </View>
            <Text style={[s.radioLabel, { color: colors.foreground }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function IdentityContextScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { user } = useAuth();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [state,    setState]    = useState<IdentityContextState>({
    sexAssignedAtBirth: null,
    genderIdentity: null,
    pronounSet: null,
    allowMedicallyRelevantContext: false,
    allowPronounAwareLanguage: false,
    version: 1,
  });

  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "https://www.mappingwithmelanin.com";

  // ── Load current state ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/me/identity-context`, {
          credentials: "include",
        });
        if (res.status === 404) { setLoading(false); return; } // no record yet — defaults apply
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json() as {
          sex_assigned_at_birth: SexAtBirth;
          gender_identity: GenderIdentity;
          pronoun_set: PronounSet;
          allow_medically_relevant_context: boolean;
          allow_pronoun_aware_language: boolean;
          version: number;
        };
        setState({
          sexAssignedAtBirth: data.sex_assigned_at_birth,
          genderIdentity: data.gender_identity,
          pronounSet: data.pronoun_set,
          allowMedicallyRelevantContext: data.allow_medically_relevant_context,
          allowPronounAwareLanguage: data.allow_pronoun_aware_language,
          version: data.version,
        });
      } catch {
        Alert.alert("Couldn't load settings", "Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────
  const save = useCallback(async (patch: Partial<IdentityContextState>) => {
    const next = { ...state, ...patch };
    setState(next);
    try {
      setSaving(true);
      const res = await fetch(`${apiUrl}/api/me/identity-context`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sexAssignedAtBirth:           next.sexAssignedAtBirth,
          genderIdentity:               next.genderIdentity,
          pronounSet:                   next.pronounSet,
          allowMedicallyRelevantContext: next.allowMedicallyRelevantContext,
          allowPronounAwareLanguage:     next.allowPronounAwareLanguage,
          expectedVersion:              next.version,
        }),
      });
      if (res.status === 409) {
        Alert.alert("Out of sync", "Your settings were updated from another device. Reloading.");
        router.replace("/identity-context");
        return;
      }
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(b.error ?? `Server error ${res.status}`);
      }
      const updated = await res.json() as { version: number };
      setState((s) => ({ ...s, version: updated.version ?? next.version + 1 }));
    } catch (err) {
      Alert.alert("Couldn't save", err instanceof Error ? err.message : "Please try again.");
      // Revert optimistic update
      setState(state);
    } finally {
      setSaving(false);
    }
  }, [state]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (loading) {
    return (
      <View style={[s.loadingCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={SECTION_ACCENT} size="large" />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Gender & Pronouns</Text>
        {saving ? (
          <ActivityIndicator color={SECTION_ACCENT} size="small" style={{ width: 40 }} />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {/* Privacy notice */}
        <View style={[s.noticeCard, { backgroundColor: `${SECTION_ACCENT}10`, borderColor: `${SECTION_ACCENT}30` }]}>
          <Feather name="lock" size={14} color={SECTION_ACCENT} style={{ marginTop: 1 }} />
          <Text style={[s.noticeText, { color: colors.foreground }]}>
            These settings are private to you. They are only used to help Kinfolk speak to you
            correctly and, if you opt in, to add anatomy-specific detail to medical questions.
            They are never used for recommendations, profiles, or advertising.
          </Text>
        </View>

        {/* Pronouns */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.mutedForeground ?? colors.muted }]}>PRONOUNS</Text>
          <Text style={[s.sectionHelp, { color: colors.mutedForeground ?? colors.muted }]}>
            How should Kinfolk refer to you?
          </Text>
          <RadioGroup
            value={state.pronounSet}
            options={PRONOUN_OPTIONS}
            onSelect={(v) => save({ pronounSet: v })}
            disabled={saving}
            colors={colors}
          />
        </View>

        {/* Pronoun-aware language toggle */}
        <View style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.toggleText}>
            <Text style={[s.toggleLabel, { color: colors.foreground }]}>Use my pronouns in Kinfolk</Text>
            <Text style={[s.toggleSub, { color: colors.mutedForeground ?? colors.muted }]}>
              Kinfolk will use your selected pronouns when referring to you.
            </Text>
          </View>
          <Switch
            value={state.allowPronounAwareLanguage}
            onValueChange={(v) => save({ allowPronounAwareLanguage: v })}
            trackColor={{ false: colors.border, true: SECTION_ACCENT }}
            thumbColor="#fff"
            disabled={saving}
          />
        </View>

        {/* Gender identity */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.mutedForeground ?? colors.muted }]}>GENDER IDENTITY</Text>
          <Text style={[s.sectionHelp, { color: colors.mutedForeground ?? colors.muted }]}>
            Optional — helps us understand and serve our community better.
          </Text>
          <RadioGroup
            value={state.genderIdentity}
            options={GENDER_OPTIONS}
            onSelect={(v) => save({ genderIdentity: v })}
            disabled={saving}
            colors={colors}
          />
        </View>

        {/* Sex assigned at birth — only shown when medical context toggle is relevant */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.mutedForeground ?? colors.muted }]}>SEX ASSIGNED AT BIRTH</Text>
          <Text style={[s.sectionHelp, { color: colors.mutedForeground ?? colors.muted }]}>
            Used only when you opt into anatomy-specific medical context below. Never visible to others.
          </Text>
          <RadioGroup
            value={state.sexAssignedAtBirth}
            options={SEX_OPTIONS}
            onSelect={(v) => save({ sexAssignedAtBirth: v })}
            disabled={saving}
            colors={colors}
          />
        </View>

        {/* Medical context toggle */}
        <View style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.toggleText}>
            <Text style={[s.toggleLabel, { color: colors.foreground }]}>
              Add anatomy-specific medical context
            </Text>
            <Text style={[s.toggleSub, { color: colors.mutedForeground ?? colors.muted }]}>
              When you ask Kinfolk health questions, it can use your sex assigned at birth to add
              relevant anatomy-specific detail (e.g. prostate health, reproductive care).
              This applies only to medical questions — never anything else.
            </Text>
          </View>
          <Switch
            value={state.allowMedicallyRelevantContext}
            onValueChange={(v) => save({ allowMedicallyRelevantContext: v })}
            trackColor={{ false: colors.border, true: SECTION_ACCENT }}
            thumbColor="#fff"
            disabled={saving}
          />
        </View>

        {/* Footer note */}
        <Text style={[s.footerNote, { color: colors.mutedForeground ?? colors.muted }]}>
          You can update or clear these settings at any time. Clearing them returns Kinfolk to
          neutral language immediately.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1 },
  loadingCenter:  { flex: 1, alignItems: "center", justifyContent: "center" },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:        { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle:    { fontSize: 17, fontWeight: "700" },
  scroll:         { padding: 16, gap: 4 },
  noticeCard:     { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 20 },
  noticeText:     { flex: 1, fontSize: 13, lineHeight: 18 },
  section:        { marginBottom: 16 },
  sectionTitle:   { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 4 },
  sectionHelp:    { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  radioGroup:     { gap: 6 },
  radioRow:       { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 10, padding: 12 },
  radioCircle:    { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot:       { width: 8, height: 8, borderRadius: 4 },
  radioLabel:     { fontSize: 15 },
  toggleRow:      { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16, gap: 12 },
  toggleText:     { flex: 1 },
  toggleLabel:    { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  toggleSub:      { fontSize: 12, lineHeight: 17 },
  footerNote:     { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 8, paddingHorizontal: 8 },
});
