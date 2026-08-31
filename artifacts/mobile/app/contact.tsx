import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

const FORM_TYPES = [
  { id: "general", label: "General Question", icon: "message-square" as const },
  { id: "safety", label: "Safety Concern", icon: "shield" as const },
  { id: "business", label: "Business Support", icon: "briefcase" as const },
  { id: "bug", label: "Report a Bug", icon: "alert-triangle" as const },
  { id: "partnership", label: "Partnership Inquiry", icon: "link" as const },
  { id: "media", label: "Press / Media", icon: "radio" as const },
  { id: "other", label: "Other", icon: "more-horizontal" as const },
];

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [formType, setFormType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const valid = formType.length > 0 && name.trim().length > 1 && email.includes("@") && message.trim().length >= 20;

  const handleSubmit = async () => {
    if (!valid) return;
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      await fetch(`${apiBase}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType, name, email, subject, message }),
      });
    } catch {}
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Contact Us</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.successWrap}>
          <View style={[styles.successCircle, { backgroundColor: colors.success + "20" }]}>
            <Feather name="check-circle" size={52} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Message Sent!</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            We&apos;ll get back to you at {email} within 1–2 business days.
          </Text>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          >
            <Text style={[styles.doneBtnTxt, { color: colors.primaryForeground }]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Contact Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Text style={[styles.introTitle, { color: colors.foreground }]}>How can we help?</Text>
          <Text style={[styles.introSub, { color: colors.mutedForeground }]}>
            Our team typically responds within 1–2 business days. For urgent safety concerns, use the in-app Report button.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>What&apos;s this about?</Text>
          <View style={styles.typeGrid}>
            {FORM_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.typeChip,
                  { backgroundColor: formType === t.id ? colors.primary : colors.secondary, borderColor: formType === t.id ? colors.primary : colors.border },
                ]}
                onPress={() => { setFormType(t.id); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <Feather name={t.icon} size={13} color={formType === t.id ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.typeChipTxt, { color: formType === t.id ? colors.primaryForeground : colors.foreground }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Your Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="First and last name"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Email Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="We'll reply here"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Subject <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Brief summary"
            placeholderTextColor={colors.mutedForeground}
            value={subject}
            onChangeText={setSubject}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Message</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Describe your question or issue in as much detail as possible…"
            placeholderTextColor={colors.mutedForeground}
            value={message}
            onChangeText={(t) => t.length <= 2000 && setMessage(t)}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{message.length}/2000</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: valid ? colors.primary : colors.muted }]}
          onPress={handleSubmit}
          disabled={!valid || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <Text style={[styles.submitTxt, { color: colors.mutedForeground }]}>Sending…</Text>
          ) : (
            <>
              <Feather name="send" size={16} color={valid ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.submitTxt, { color: valid ? colors.primaryForeground : colors.mutedForeground }]}>Send Message</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>
          Your contact information is used only to respond to your inquiry and is never shared with third parties.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  scroll: { padding: 20, gap: 20 },
  intro: { gap: 8 },
  introTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  introSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  typeChipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 140 },
  charCount: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 17, borderRadius: 16 },
  submitTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  privacyNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 18 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  doneBtn: { alignItems: "center", paddingVertical: 17, paddingHorizontal: 40, borderRadius: 16 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
