import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
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

type ClaimStatus = "pending" | "needs_info" | "approved" | "rejected" | "withdrawn";

type MemberClaim = {
  id: string;
  business_id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  status: ClaimStatus;
  role: string | null;
  decision_reason: string | null;
};

type ClaimStatusPresentation = {
  label: string;
  detail: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
};

const STATUS: Record<ClaimStatus, ClaimStatusPresentation> = {
  pending: { label: "Claim under review", detail: "Private review in progress", icon: "clock", color: "#B7791F" },
  needs_info: { label: "More information needed", detail: "Private review needs additional details", icon: "alert-circle", color: "#2563EB" },
  approved: { label: "Management access approved", detail: "Ownership verification remains separate", icon: "check-circle", color: "#16803A" },
  rejected: { label: "Claim not approved", detail: "No management access was granted", icon: "x-circle", color: "#DC2626" },
  withdrawn: { label: "Claim withdrawn", detail: "No active ownership request remains", icon: "slash", color: "#6B7280" },
};

function claimName(claim: MemberClaim): string {
  return claim.business_name?.trim() || "Business listing";
}

export default function MyBusinessClaimsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [claims, setClaims] = useState<MemberClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionClaimId, setActionClaimId] = useState<string | null>(null);
  const [resubmitClaim, setResubmitClaim] = useState<MemberClaim | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const headers = await getMemberApiHeaders();
      const response = await fetch(`${getApiBase()}/api/me/business-claims`, { headers });
      const payload = await response.json().catch(() => ({})) as { claims?: MemberClaim[]; error?: string };
      if (!response.ok) {
        throw new Error(response.status === 401
          ? "Sign in to view your private ownership claims."
          : payload.error ?? "Your claims could not be loaded right now.");
      }
      setClaims(Array.isArray(payload.claims) ? payload.claims : []);
    } catch (reason) {
      setClaims([]);
      setError(reason instanceof Error ? reason.message : "Your claims could not be loaded right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitAction = async (
    claim: MemberClaim,
    action: "withdraw" | "resubmit",
    details?: { evidenceUrl?: string; notes?: string },
  ) => {
    setActionClaimId(claim.id);
    setError(null);
    try {
      const memberHeaders = await getMemberApiHeaders();
      const response = await fetch(`${getApiBase()}/api/me/business-claims/${encodeURIComponent(claim.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...memberHeaders },
        body: JSON.stringify({ action, ...details }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error ?? "That claim update could not be completed.");
      if (action === "resubmit") {
        setResubmitClaim(null);
        setEvidenceUrl("");
        setNotes("");
      }
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That claim update could not be completed.");
    } finally {
      setActionClaimId(null);
    }
  };

  const confirmWithdrawal = (claim: MemberClaim) => {
    Alert.alert(
      "Withdraw ownership claim?",
      "This ends this private request. It does not change the public listing, verification, or ownership designations.",
      [
        { text: "Keep claim", style: "cancel" },
        { text: "Withdraw claim", style: "destructive", onPress: () => void submitAction(claim, "withdraw") },
      ],
    );
  };

  const openResubmit = (claim: MemberClaim) => {
    setEvidenceUrl("");
    setNotes("");
    setResubmitClaim(claim);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/settings" as never)} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Business Claims</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading private claims…</Text></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          <View style={[styles.intro, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}35` }]}>
            <Feather name="shield" size={17} color={colors.primary} />
            <Text style={[styles.introText, { color: colors.foreground }]}>These requests are private to you and authorized reviewers. They never change a public business listing, ownership designation, verification, ranking, safety information, or publication automatically.</Text>
          </View>

          {error ? (
            <View style={[styles.errorBox, { borderColor: "#DC262655", backgroundColor: "#DC262610" }]}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => void load()} accessibilityLabel="Retry loading business claims"><Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text></TouchableOpacity>
            </View>
          ) : null}

          {!error && claims.length === 0 ? (
            <View style={styles.center}>
              <Feather name="briefcase" size={42} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No ownership claims yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>If you request management access for an existing listing, its private review status will appear here.</Text>
            </View>
          ) : null}

          {claims.map((claim) => {
            const status = STATUS[claim.status] ?? STATUS.pending;
            const canWithdraw = claim.status === "pending" || claim.status === "needs_info";
            return (
              <View key={claim.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.foreground }]}>{claimName(claim)}</Text>
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>{[claim.role, claim.city, claim.state].filter(Boolean).join(" · ") || "Ownership claim"}</Text>
                  </View>
                  <Feather name={status.icon} size={21} color={status.color} />
                </View>
                <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                <Text style={[styles.statusDetail, { color: colors.mutedForeground }]}>{status.detail}</Text>
                {claim.decision_reason ? (
                  <View style={[styles.reviewNote, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.reviewLabel, { color: colors.foreground }]}>Private review note</Text>
                    <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{claim.decision_reason}</Text>
                  </View>
                ) : null}
                <View style={styles.actions}>
                  {claim.status === "needs_info" ? (
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: actionClaimId === claim.id ? 0.6 : 1 }]}
                      disabled={actionClaimId === claim.id}
                      onPress={() => openResubmit(claim)}
                    >
                      <Feather name="edit-3" size={14} color="#FFF" />
                      <Text style={styles.primaryButtonText}>Add details & resubmit</Text>
                    </TouchableOpacity>
                  ) : null}
                  {claim.status === "approved" ? (
                    <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => router.push("/business-owner" as never)}>
                      <Feather name="briefcase" size={14} color="#FFF" />
                      <Text style={styles.primaryButtonText}>Open Business Admin</Text>
                    </TouchableOpacity>
                  ) : null}
                  {canWithdraw ? (
                    <TouchableOpacity
                      style={[styles.outlineButton, { borderColor: colors.border, opacity: actionClaimId === claim.id ? 0.6 : 1 }]}
                      disabled={actionClaimId === claim.id}
                      onPress={() => confirmWithdrawal(claim)}
                    >
                      {actionClaimId === claim.id ? <ActivityIndicator size="small" color={colors.foreground} /> : <Feather name="x" size={14} color={colors.foreground} />}
                      <Text style={[styles.outlineButtonText, { color: colors.foreground }]}>{actionClaimId === claim.id ? "Updating…" : "Withdraw request"}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={resubmitClaim !== null} transparent animationType="slide" onRequestClose={() => setResubmitClaim(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add claim details</Text>
            <Text style={[styles.modalCopy, { color: colors.mutedForeground }]}>Provide only information that supports your authorization for this exact listing. Your update stays private to review staff.</Text>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Official evidence link (optional)</Text>
            <TextInput
              accessibilityLabel="Official evidence link"
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={evidenceUrl}
              onChangeText={setEvidenceUrl}
            />
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Additional details (optional)</Text>
            <TextInput
              accessibilityLabel="Additional private claim details"
              multiline
              numberOfLines={4}
              placeholder="Explain what the reviewer should check…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={notes}
              onChangeText={setNotes}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalSecondary, { borderColor: colors.border }]} onPress={() => setResubmitClaim(null)} disabled={actionClaimId !== null}>
                <Text style={[styles.outlineButtonText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimary, { backgroundColor: colors.primary, opacity: actionClaimId ? 0.6 : 1 }]}
                disabled={!resubmitClaim || actionClaimId !== null}
                onPress={() => resubmitClaim && void submitAction(resubmitClaim, "resubmit", { evidenceUrl: evidenceUrl.trim() || undefined, notes: notes.trim() || undefined })}
              >
                {actionClaimId ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryButtonText}>Resubmit for review</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 96, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Inter_700Bold", fontSize: 17 },
  headerSpacer: { width: 22 },
  content: { padding: 18, gap: 14 },
  center: { flex: 1, minHeight: 220, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  intro: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  introText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  errorBox: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  errorText: { flex: 1, color: "#DC2626", fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  retryText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center" },
  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  name: { fontFamily: "Inter_700Bold", fontSize: 18 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },
  statusLabel: { fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 14 },
  statusDetail: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  reviewNote: { borderRadius: 12, padding: 12, marginTop: 12 },
  reviewLabel: { fontFamily: "Inter_700Bold", fontSize: 12, marginBottom: 4 },
  reviewText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10 },
  primaryButtonText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 13 },
  outlineButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10 },
  outlineButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 10 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  modalCopy: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 4 },
  inputLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 4 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontFamily: "Inter_400Regular", fontSize: 14 },
  notesInput: { minHeight: 96, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  modalSecondary: { flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 12, paddingVertical: 13 },
  modalPrimary: { flex: 1.5, alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 13 },
});
