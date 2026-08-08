/**
 * Edit Suggestion Screen
 * Allows community members to suggest corrections or additions to any
 * tour content entity (community orgs, recurring events, cultural sites).
 */
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { getApiBase } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const FIELD_LABELS: Record<string, string> = {
  community_org: "Community Organization",
  recurring_event: "Recurring Gathering",
  cultural_site: "Heritage Site",
  business: "Business",
};

export default function EditSuggestionScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    entityType: string;
    entityId: string;
    entityName: string;
  }>();

  const [field, setField] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const entityLabel = FIELD_LABELS[params.entityType ?? ""] ?? "Place";

  async function handleSubmit() {
    if (!suggestedValue.trim()) {
      Alert.alert("Missing info", "Please enter what the correct value should be.");
      return;
    }
    setSubmitting(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/edit-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          entity_type: params.entityType,
          entity_id: params.entityId,
          entity_name: params.entityName,
          field_name: field.trim() || "general",
          current_value: currentValue.trim() || null,
          suggested_value: suggestedValue.trim(),
          reason: reason.trim() || null,
        }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        Alert.alert("Couldn't submit", "Please try again in a moment.");
      }
    } catch {
      Alert.alert("Couldn't submit", "Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.doneWrap, { paddingTop: insets.top + 40 }]}>
          <View style={[s.doneCircle, { backgroundColor: "#14532D" }]}>
            <Feather name="check" size={36} color="#4ADE80" />
          </View>
          <Text style={[s.doneTitle, { color: colors.foreground }]}>Thank you!</Text>
          <Text style={[s.doneSub, { color: colors.mutedForeground }]}>
            Your suggestion has been submitted. Our team reviews every contribution.
          </Text>
          <TouchableOpacity
            style={[s.doneBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.back()}
          >
            <Text style={s.doneBtnTxt}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="chevron-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.foreground }]}>Suggest an Edit</Text>
            <Text style={[s.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
              {entityLabel}: {params.entityName}
            </Text>
          </View>
        </View>

        {/* Context banner */}
        <View style={[s.banner, { backgroundColor: colors.muted + "60", borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[s.bannerTxt, { color: colors.mutedForeground }]}>
            Community suggestions help keep our information accurate. Every submission is reviewed before going live.
          </Text>
        </View>

        {/* What field */}
        <Text style={[s.label, { color: colors.foreground }]}>What needs to be corrected?</Text>
        <TextInput
          style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          placeholder="e.g. phone number, address, hours…"
          placeholderTextColor={colors.mutedForeground}
          value={field}
          onChangeText={setField}
          returnKeyType="next"
        />

        {/* Current value (optional) */}
        <Text style={[s.label, { color: colors.foreground }]}>Current (wrong) value <Text style={s.optional}>(optional)</Text></Text>
        <TextInput
          style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          placeholder="What it currently says…"
          placeholderTextColor={colors.mutedForeground}
          value={currentValue}
          onChangeText={setCurrentValue}
          returnKeyType="next"
        />

        {/* Suggested value */}
        <Text style={[s.label, { color: colors.foreground }]}>Correct value <Text style={s.required}>*</Text></Text>
        <TextInput
          style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          placeholder="What it should say…"
          placeholderTextColor={colors.mutedForeground}
          value={suggestedValue}
          onChangeText={setSuggestedValue}
          returnKeyType="next"
        />

        {/* Reason */}
        <Text style={[s.label, { color: colors.foreground }]}>Why? <Text style={s.optional}>(optional)</Text></Text>
        <TextInput
          style={[s.input, s.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
          placeholder="How do you know this? Community member, business owner, visited recently…"
          placeholderTextColor={colors.mutedForeground}
          value={reason}
          onChangeText={setReason}
          multiline
          textAlignVertical="top"
          returnKeyType="done"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: "#CA922B", opacity: submitting ? 0.6 : 1 }]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Feather name="send" size={16} color="#fff" />
                <Text style={s.submitTxt}>Submit Suggestion</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 6 },

  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  backBtn: { padding: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },

  banner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 8,
  },
  bannerTxt: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, flex: 1 },

  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: 10, marginBottom: 4 },
  optional: { fontFamily: "Inter_400Regular", fontWeight: "400", color: "#888" },
  required: { color: "#DC2626" },

  input: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: "Inter_400Regular", fontSize: 15,
  },
  textarea: { minHeight: 90, paddingTop: 12 },

  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 14, paddingVertical: 16, marginTop: 20,
  },
  submitTxt: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },

  doneWrap: { flex: 1, alignItems: "center", justifyContent: "flex-start", paddingHorizontal: 32, gap: 16 },
  doneCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  doneTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  doneSub: { fontFamily: "Inter_400Regular", fontSize: 16, textAlign: "center", lineHeight: 24 },
  doneBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  doneBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
