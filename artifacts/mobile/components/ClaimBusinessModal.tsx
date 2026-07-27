import React, { useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const ROLES = [
  { id: "owner", label: "Owner" },
  { id: "co-owner", label: "Co-owner" },
  { id: "manager", label: "Manager" },
  { id: "authorized_rep", label: "Authorized Rep" },
];

interface Props {
  visible: boolean;
  businessId: string;
  businessName: string;
  onClose: () => void;
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export function ClaimBusinessModal({ visible, businessId, businessName, onClose }: Props) {
  const colors = useColors();
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("owner");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!ownerName.trim() || !email.trim()) {
      setError("Name and email are required."); return;
    }
    setError(null);
    setLoading(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/businesses/${businessId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          ownerName: ownerName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          role,
          website: website.trim() || null,
          instagramHandle: instagram.replace("@", "").trim() || null,
          additionalInfo: additionalInfo.trim() || null,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to submit. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOwnerName(""); setEmail(""); setPhone(""); setRole("owner");
    setWebsite(""); setInstagram(""); setAdditionalInfo("");
    setError(null); setLoading(false); setSubmitted(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Claim This Business</Text>
              <Text style={[styles.businessName, { color: colors.mutedForeground }]} numberOfLines={1}>
                {businessName}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.successContainer}>
              <View style={[styles.successIcon, { backgroundColor: "#2D7A4F18" }]}>
                <Ionicons name="checkmark-circle" size={52} color="#2D7A4F" />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Claim Submitted!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Our team will review your claim and reach out within 2-3 business days. Thank you for being part of the community!
              </Text>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleClose}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={[styles.infoBadge, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Ionicons name="shield-checkmark-outline" size={15} color={colors.primary} />
                <Text style={[styles.infoBadgeText, { color: colors.text }]}>
                  Claiming your listing lets you update business info, respond to reviews, and get the verified owner badge.
                </Text>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Your name *</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="Full name"
                placeholderTextColor={colors.mutedForeground}
                value={ownerName}
                onChangeText={setOwnerName}
              />

              <Text style={[styles.label, { color: colors.text }]}>Email address *</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.text }]}>Phone (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="(555) 000-0000"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={[styles.label, { color: colors.text }]}>Your role</Text>
              <View style={styles.roleRow}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.roleChip, { backgroundColor: role === r.id ? colors.primary : colors.card, borderColor: role === r.id ? colors.primary : colors.border }]}
                    onPress={() => setRole(r.id)}
                  >
                    <Text style={[styles.roleChipText, { color: role === r.id ? "#fff" : colors.text }]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Website (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="https://yourbusiness.com"
                placeholderTextColor={colors.mutedForeground}
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={[styles.label, { color: colors.text }]}>Instagram (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="@yourbusiness"
                placeholderTextColor={colors.mutedForeground}
                value={instagram}
                onChangeText={setInstagram}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.text }]}>Anything else? (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="Tell us anything that helps verify your ownership..."
                placeholderTextColor={colors.mutedForeground}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                multiline
                numberOfLines={4}
              />

              {error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={15} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: ownerName.trim() && email.trim() ? colors.primary : colors.border }]}
                onPress={handleSubmit}
                disabled={loading || !ownerName.trim() || !email.trim()}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Claim</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 2 },
  businessName: { fontFamily: "Inter_400Regular", fontSize: 13 },
  scroll: { padding: 20, paddingBottom: 32 },
  infoBadge: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 20 },
  infoBadgeText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, flex: 1 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 6, marginTop: 16 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14 },
  textArea: { height: 100, textAlignVertical: "top" },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  roleChipText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#DC2626" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, padding: 16, marginTop: 20 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 12, textAlign: "center" },
  successSub: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23, textAlign: "center", marginBottom: 32 },
  doneBtn: { borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14 },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
