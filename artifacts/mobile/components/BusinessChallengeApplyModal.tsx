import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Modal,
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

const AUTH_TOKEN_KEY = "auth_session_token";

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    const { getItemAsync } = await import("expo-secure-store");
    return await getItemAsync(AUTH_TOKEN_KEY);
  } catch { return null; }
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

type Props = {
  visible: boolean;
  challengeId: string;
  challengeName: string;
  onClose: () => void;
};

export function BusinessChallengeApplyModal({ visible, challengeId, challengeName, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [businessName, setBusinessName] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      Alert.alert("Business name required", "Please enter your business name.");
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes("@")) {
      Alert.alert("Valid email required", "We'll use this to notify you when your application is reviewed.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/challenges/apply`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          businessId: businessName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
          businessName: businessName.trim(),
          businessCity: businessCity.trim() || null,
          businessCategory: businessCategory.trim() || null,
          challengeId,
          challengeName,
          ownerName: ownerName.trim() || null,
          ownerEmail: ownerEmail.trim(),
          message: message.trim() || null,
        }),
      });
      if (res.status === 409) {
        Alert.alert("Already applied", "You've already submitted an application for this challenge. We'll be in touch!");
        handleClose();
        return;
      }
      if (!res.ok) throw new Error("Server error");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch {
      Alert.alert("Oops", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setBusinessName(""); setBusinessCity(""); setBusinessCategory("");
    setOwnerName(""); setOwnerEmail(""); setMessage("");
    setDone(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.root, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ width: 40 }} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Register Your Business</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {done ? (
            <View style={styles.successWrap}>
              <View style={[styles.successCircle, { backgroundColor: "#2D7A4F20" }]}>
                <Text style={styles.successEmoji}>🏆</Text>
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Application Submitted!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Your business has been submitted for{" "}
                <Text style={{ fontFamily: "Inter_700Bold", color: colors.foreground }}>{challengeName}</Text>
                . Our team will review it and notify you at the email provided within 2–3 business days.
              </Text>
              <View style={[styles.infoCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={[styles.infoTxt, { color: colors.mutedForeground }]}>
                  If approved, your business will be featured as a participating partner in the challenge feed.
                </Text>
              </View>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleClose}>
                <Text style={styles.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.challengeChip, { backgroundColor: "#2D7A4F18" }]}>
                <Text style={styles.challengeEmoji}>🏆</Text>
                <Text style={[styles.challengeName, { color: "#2D7A4F" }]}>{challengeName}</Text>
              </View>

              <Text style={[styles.intro, { color: colors.mutedForeground }]}>
                Register your business to be featured as an official partner. All applications are reviewed by our team before approval.
              </Text>

              <View style={styles.formSection}>
                <Text style={[styles.label, { color: colors.foreground }]}>Business Name <Text style={{ color: "#DC2626" }}>*</Text></Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Your business name"
                  placeholderTextColor={colors.mutedForeground}
                  value={businessName}
                  onChangeText={setBusinessName}
                />
              </View>

              <View style={styles.row2}>
                <View style={[styles.formSection, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.foreground }]}>City</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="Atlanta"
                    placeholderTextColor={colors.mutedForeground}
                    value={businessCity}
                    onChangeText={setBusinessCity}
                  />
                </View>
                <View style={[styles.formSection, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="Restaurant"
                    placeholderTextColor={colors.mutedForeground}
                    value={businessCategory}
                    onChangeText={setBusinessCategory}
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.label, { color: colors.foreground }]}>Owner / Contact Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Your name"
                  placeholderTextColor={colors.mutedForeground}
                  value={ownerName}
                  onChangeText={setOwnerName}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.label, { color: colors.foreground }]}>Email Address <Text style={{ color: "#DC2626" }}>*</Text></Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="you@yourbusiness.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={ownerEmail}
                  onChangeText={setOwnerEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={[styles.helperTxt, { color: colors.mutedForeground }]}>We'll send your approval decision here</Text>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.label, { color: colors.foreground }]}>Tell us about your business <Text style={[{ color: colors.mutedForeground }]}>(optional)</Text></Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Why is your business a great fit for this challenge?"
                  placeholderTextColor={colors.mutedForeground}
                  value={message}
                  onChangeText={(t) => t.length <= 400 && setMessage(t)}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{message.length}/400</Text>
              </View>

              <View style={[styles.reviewNote, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="shield" size={13} color={colors.primary} />
                <Text style={[styles.reviewNoteTxt, { color: colors.mutedForeground }]}>
                  Applications are reviewed by the Mapping with Melanin™ team. We verify that businesses are minority-owned before approval. This typically takes 2–3 business days.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.submitTxt}>{saving ? "Submitting…" : "Submit Application"}</Text>
                {!saving && <Feather name="arrow-right" size={16} color="#FFF" />}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  closeBtn: { width: 40, height: 40, alignItems: "flex-end", justifyContent: "center" },
  scroll: { padding: 20, gap: 16 },
  challengeChip: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  challengeEmoji: { fontSize: 16 },
  challengeName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  intro: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  formSection: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  row2: { flexDirection: "row", gap: 10 },
  helperTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 90 },
  charCount: { fontSize: 11, textAlign: "right", fontFamily: "Inter_400Regular" },
  reviewNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  reviewNoteTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  submitTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  successWrap: { alignItems: "center", paddingTop: 40, gap: 16 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successEmoji: { fontSize: 44 },
  successTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, width: "100%" },
  infoTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  doneBtn: { paddingVertical: 14, paddingHorizontal: 48, borderRadius: 14, marginTop: 8 },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
});
