import React, { useCallback, useEffect, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

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

type ClaimEligibility = {
  eligibility: "claimable" | "pending_for_you" | "pending_for_other_user" | "already_claimed" | "not_claimable";
  message?: string;
};

export function ClaimBusinessModal({ visible, businessId, businessName, onClose }: Props) {
  const colors = useColors();
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("owner");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("manual_review");
  const [attested, setAttested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<ClaimEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const loadEligibility = useCallback(async () => {
    if (!businessId) return;
    setEligibilityLoading(true);
    setEligibility(null);
    try {
      const apiBase = getApiBase();
      const memberHeaders = await getMemberApiHeaders();
      const response = await fetch(`${apiBase}/api/businesses/${businessId}/claim-eligibility`, {
        headers: memberHeaders,
      });
      if (!response.ok) throw new Error("claim_eligibility_unavailable");
      const body = await response.json() as ClaimEligibility;
      if (!body?.eligibility) throw new Error("claim_eligibility_unavailable");
      setEligibility(body);
    } catch {
      setEligibility({
        eligibility: "not_claimable",
        message: "Claim availability could not be checked. Please try again before submitting.",
      });
    } finally {
      setEligibilityLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!visible) return;
    void loadEligibility();
  }, [loadEligibility, visible]);

  const canSubmit = eligibility?.eligibility === "claimable";
  const eligibilityTitle = eligibility?.eligibility === "pending_for_you"
    ? "Your claim is under review"
    : eligibility?.eligibility === "pending_for_other_user"
      ? "A claim is already under review"
      : eligibility?.eligibility === "already_claimed"
        ? "This listing already has an owner"
        : "Claim unavailable";

  async function handleSubmit() {
    if (eligibility?.eligibility !== "claimable") {
      setError(eligibility?.message ?? "Claim availability could not be confirmed. Please try again.");
      return;
    }
    if (!ownerName.trim() || !email.trim()) {
      setError("Name and business email are required."); return;
    }
    if (!attested) {
      setError("Confirm that you are authorized to claim this listing."); return;
    }
    setError(null);
    setLoading(true);
    try {
      const apiBase = getApiBase();
      const memberHeaders = await getMemberApiHeaders();
      const res = await fetch(`${apiBase}/api/businesses/${businessId}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...memberHeaders },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          businessEmail: email.trim(),
          claimantPhone: phone.trim() || null,
          role,
          officialUrl: website.trim() || null,
          socialHandle: instagram.replace("@", "").trim() || null,
          notes: additionalInfo.trim() || null,
          verificationMethod,
          attestation: true,
        }),
      });
      if (res.ok) {
        setEligibility({ eligibility: "pending_for_you", message: "Your ownership claim is being reviewed." });
        setSubmitted(true);
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        if (res.status === 409) void loadEligibility();
        setError(body.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to submit. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOwnerName(""); setEmail(""); setPhone(""); setRole("owner");
    setWebsite(""); setInstagram(""); setAdditionalInfo(""); setVerificationMethod("manual_review"); setAttested(false);
    setError(null); setLoading(false); setSubmitted(false);
    setEligibility(null); setEligibilityLoading(false);
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
                Your claim is private while our team reviews it. Approval may grant listing-management access; it does not verify the business or its ownership designations.
              </Text>
              <View style={styles.successActions}>
                <TouchableOpacity style={[styles.statusBtn, { borderColor: colors.primary }]} onPress={() => { handleClose(); router.push("/my-business-claims" as never); }}>
                  <Text style={[styles.statusBtnText, { color: colors.primary }]}>View private status</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleClose}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={[styles.infoBadge, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Ionicons name="shield-checkmark-outline" size={15} color={colors.primary} />
                <Text style={[styles.infoBadgeText, { color: colors.text }]}>
                  Claiming requests management access after review. It does not verify this business or its ownership designations.
                </Text>
              </View>

              {eligibilityLoading ? (
                <View style={[styles.eligibilityRow, { backgroundColor: colors.card, borderColor: colors.border }]} testID="claim-eligibility-loading">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.eligibilityText, { color: colors.mutedForeground }]}>Checking claim availability…</Text>
                </View>
              ) : eligibility && !canSubmit ? (
                <View style={[styles.eligibilityRow, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]} testID="claim-eligibility-unavailable">
                  <Ionicons name="information-circle-outline" size={19} color="#B91C1C" />
                  <View style={styles.eligibilityBody}>
                    <Text style={styles.eligibilityTitle}>{eligibilityTitle}</Text>
                    <Text style={styles.eligibilityMessage}>{eligibility.message ?? "This listing cannot accept a new ownership claim."}</Text>
                    <TouchableOpacity
                      accessibilityLabel="Check ownership claim availability again"
                      onPress={() => { void loadEligibility(); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.eligibilityRetry, { color: colors.primary }]}>Check again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

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

              <Text style={[styles.label, { color: colors.text }]}>Private review phone (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="(555) 000-0000"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Private to claim review; never added to the public listing.</Text>

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

              <Text style={[styles.label, { color: colors.text }]}>How can we review your claim? *</Text>
              <View style={styles.roleRow}>
                {[
                  ["manual_review", "Details for review"],
                  ["domain_email", "Business email"],
                  ["social_account", "Social account"],
                  ["booking_page", "Booking page"],
                  ["business_document", "Business document"],
                ].map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.roleChip, { backgroundColor: verificationMethod === value ? colors.primary : colors.card, borderColor: verificationMethod === value ? colors.primary : colors.border }]}
                    onPress={() => setVerificationMethod(value)}
                  >
                    <Text style={[styles.roleChipText, { color: verificationMethod === value ? "#fff" : colors.text }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

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

              <TouchableOpacity
                style={styles.attestationRow}
                onPress={() => setAttested((current) => !current)}
                activeOpacity={0.8}
              >
                <Ionicons name={attested ? "checkbox" : "square-outline"} size={22} color={attested ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.attestationText, { color: colors.text }]}>I confirm I am the owner or authorized representative and that this information is accurate. *</Text>
              </TouchableOpacity>

              {error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={15} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: ownerName.trim() && email.trim() && attested && canSubmit && !eligibilityLoading ? colors.primary : colors.border }]}
                onPress={handleSubmit}
                disabled={loading || eligibilityLoading || !canSubmit || !ownerName.trim() || !email.trim() || !attested}
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
  eligibilityRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4 },
  eligibilityBody: { flex: 1, gap: 3 },
  eligibilityText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  eligibilityTitle: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#991B1B" },
  eligibilityMessage: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, color: "#991B1B" },
  eligibilityRetry: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 3 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 6, marginTop: 16 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14 },
  helperText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 6 },
  textArea: { height: 100, textAlignVertical: "top" },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  roleChipText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#DC2626" },
  attestationRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 20 },
  attestationText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, padding: 16, marginTop: 20 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 12, textAlign: "center" },
  successSub: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23, textAlign: "center", marginBottom: 32 },
  successActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14 },
  statusBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  doneBtn: { borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14 },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
