import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Image,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type VerificationStatus =
  | "loading"
  | "upgrade_required"
  | "already_verified"
  | "pending"
  | "rejected"
  | "ready"
  | "capturing"
  | "submitting"
  | "success";

const PAID_TIERS = ["navigator", "trailblazer", "community_builder", "founding", "beta", "legacy_member"];

export default function CommunityVerifiedScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieKey, setSelfieKey] = useState<string | null>(null);
  const [pendingSubmittedAt, setPendingSubmittedAt] = useState<string | null>(null);
  const [rejectedNotes, setRejectedNotes] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!isAuthenticated) { setStatus("upgrade_required"); return; }

    const memberType = (user as any)?.memberType ?? "individual";
    if (!PAID_TIERS.includes(memberType)) {
      setStatus("upgrade_required");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/users/me/trust`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { setStatus("ready"); return; }
      const data = await res.json() as {
        identityVerified: boolean;
        pendingVerification: { id: string; status: string; submittedAt: string; adminNotes?: string } | null;
      };
      if (data.identityVerified) {
        setStatus("already_verified");
      } else if (data.pendingVerification?.status === "pending") {
        setStatus("pending");
        setPendingSubmittedAt(data.pendingVerification.submittedAt);
      } else if (data.pendingVerification?.status === "rejected") {
        setStatus("rejected");
        setRejectedNotes((data.pendingVerification as any).adminNotes ?? null);
      } else {
        setStatus("ready");
      }
    } catch {
      setStatus("ready");
    }
  }, [isAuthenticated, user]);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  const takeSelfie = async () => {
    if ((Platform.OS as string) === "web") {
      Alert.alert("Camera not available", "Please use the iOS app to complete verification.");
      return;
    }

    const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (camStatus !== "granted") {
      Alert.alert(
        "Camera access needed",
        "To take your verification selfie, allow camera access in Settings.",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" },
        ],
      );
      return;
    }

    setStatus("capturing");
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) {
        setStatus("ready");
        return;
      }

      setSelfieUri(result.assets[0].uri);
      setSelfieKey(null);
      setStatus("ready");
    } catch {
      setStatus("ready");
      Alert.alert("Camera error", "Couldn't open camera. Please try again.");
    }
  };

  const uploadSelfie = async (uri: string): Promise<string> => {
    const token = await SecureStore.getItemAsync("auth_session_token");
    const apiBase = getApiBase();
    const formData = new FormData();
    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: "selfie.jpg",
    } as unknown as Blob);
    formData.append("docType", "government_issued_id");

    const res = await fetch(`${apiBase}/api/verification/upload-document`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json() as { key: string };
    return data.key;
  };

  const handleSubmit = async () => {
    if (!selfieUri && !selfieKey) {
      Alert.alert("Selfie required", "Please take a selfie to continue.");
      return;
    }

    setStatus("submitting");
    try {
      let key = selfieKey;
      if (selfieUri && !key) {
        key = await uploadSelfie(selfieUri);
        setSelfieKey(key);
      }

      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/users/identity-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ selfieKey: key }),
      });

      const data = await res.json() as { ok?: boolean; error?: string; code?: string };

      if (!res.ok) {
        if (data.code === "PENDING_EXISTS") { setStatus("pending"); return; }
        if (data.code === "ALREADY_VERIFIED") { setStatus("already_verified"); return; }
        if (data.code === "UPGRADE_REQUIRED") { setStatus("upgrade_required"); return; }
        throw new Error(data.error ?? "Submission failed");
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus("success");
    } catch (err: any) {
      setStatus("ready");
      Alert.alert("Submission failed", err?.message ?? "Something went wrong. Please try again.");
    }
  };

  const bg = colors.background;

  if (status === "loading") {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </TouchableOpacity>

      {status === "already_verified" && <AlreadyVerifiedState colors={colors} />}
      {status === "upgrade_required" && (
        <UpgradeRequiredState colors={colors} onUpgrade={() => router.push("/membership" as any)} />
      )}
      {status === "pending" && <PendingState colors={colors} submittedAt={pendingSubmittedAt} />}
      {status === "rejected" && (
        <RejectedState colors={colors} notes={rejectedNotes} onRetry={() => { setSelfieUri(null); setSelfieKey(null); setStatus("ready"); }} />
      )}
      {status === "success" && <SuccessState colors={colors} onDone={() => router.back()} />}

      {(status === "ready" || status === "capturing" || status === "submitting") && (
        <ReadyState
          colors={colors}
          selfieUri={selfieUri}
          submitting={status === "submitting"}
          onTakeSelfie={takeSelfie}
          onRetakeSelfie={() => { setSelfieUri(null); setSelfieKey(null); takeSelfie(); }}
          onSubmit={handleSubmit}
        />
      )}
    </ScrollView>
  );
}

function AlreadyVerifiedState({ colors }: { colors: any }) {
  return (
    <View style={styles.stateWrap}>
      <View style={[styles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
        <Feather name="check-circle" size={36} color="#16A34A" />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>You're Community Verified</Text>
      <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
        Your identity has been confirmed. Your verified badge is visible across the platform — on your profile, reviews, and community posts.
      </Text>
      <View style={[styles.badgeRow, { borderColor: "#16A34A40", backgroundColor: "#DCFCE7" }]}>
        <Feather name="shield" size={16} color="#16A34A" />
        <Text style={{ fontSize: 14, color: "#16A34A", fontWeight: "700", marginLeft: 6 }}>
          ✔ Community Verified
        </Text>
      </View>
    </View>
  );
}

function UpgradeRequiredState({ colors, onUpgrade }: { colors: any; onUpgrade: () => void }) {
  return (
    <View style={styles.stateWrap}>
      <View style={[styles.iconCircle, { backgroundColor: "#FEF3C7" }]}>
        <Feather name="lock" size={36} color="#CA922B" />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>Unlock Community Verified</Text>
      <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
        Community Verified is available for Navigator members and above. Upgrade your membership to get your verified badge.
      </Text>
      <View style={styles.benefitList}>
        {[
          "Verified badge on your profile, reviews & posts",
          "Increased trust score in the community",
          "Priority visibility in community feeds",
          "Stronger credibility with businesses",
        ].map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Feather name="check" size={14} color="#CA922B" />
            <Text style={[styles.benefitText, { color: colors.foreground }]}>{b}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: "#CA922B" }]} onPress={onUpgrade} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Upgrade Membership</Text>
        <Feather name="arrow-right" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function PendingState({ colors, submittedAt }: { colors: any; submittedAt: string | null }) {
  const dateStr = submittedAt
    ? new Date(submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  return (
    <View style={styles.stateWrap}>
      <View style={[styles.iconCircle, { backgroundColor: "#EFF6FF" }]}>
        <Feather name="clock" size={36} color="#2563EB" />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>Under Review</Text>
      <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
        Your verification selfie has been submitted and is being reviewed by our team. This typically takes 1–3 business days.
      </Text>
      {dateStr && (
        <Text style={[styles.dateHint, { color: colors.mutedForeground }]}>Submitted {dateStr}</Text>
      )}
      <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          You'll receive an in-app notification once your verification is complete.
        </Text>
      </View>
    </View>
  );
}

function RejectedState({ colors, notes, onRetry }: { colors: any; notes: string | null; onRetry: () => void }) {
  return (
    <View style={styles.stateWrap}>
      <View style={[styles.iconCircle, { backgroundColor: "#FEF2F2" }]}>
        <Feather name="x-circle" size={36} color="#DC2626" />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>Verification Not Approved</Text>
      <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
        We weren't able to verify your identity with the submitted photo. Please try again with a clear, well-lit front-facing selfie.
      </Text>
      {notes && (
        <View style={[styles.infoBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
          <Feather name="alert-circle" size={14} color="#DC2626" />
          <Text style={[styles.infoText, { color: "#DC2626" }]}>{notes}</Text>
        </View>
      )}
      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={onRetry} activeOpacity={0.85}>
        <Feather name="camera" size={16} color="#fff" />
        <Text style={styles.primaryBtnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

function SuccessState({ colors, onDone }: { colors: any; onDone: () => void }) {
  return (
    <View style={styles.stateWrap}>
      <View style={[styles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
        <Feather name="check-circle" size={36} color="#16A34A" />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>Verification Submitted!</Text>
      <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
        Your selfie has been submitted for review. Our team will confirm your identity within 1–3 business days. You'll be notified when it's approved.
      </Text>
      <View style={[styles.infoBox, { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" }]}>
        <Feather name="shield" size={14} color="#16A34A" />
        <Text style={[styles.infoText, { color: "#16A34A" }]}>
          Once approved, your ✔ Community Verified badge will appear on your profile and across the platform.
        </Text>
      </View>
      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: "#16A34A" }]} onPress={onDone} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Back to Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

function ReadyState({
  colors,
  selfieUri,
  submitting,
  onTakeSelfie,
  onRetakeSelfie,
  onSubmit,
}: {
  colors: any;
  selfieUri: string | null;
  submitting: boolean;
  onTakeSelfie: () => void;
  onRetakeSelfie: () => void;
  onSubmit: () => void;
}) {
  return (
    <View>
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Community Verified</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
        A one-time identity check that gives you a verified badge across the platform.
      </Text>

      <View style={[styles.explanationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardHeading, { color: colors.foreground }]}>What this verifies</Text>
        <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>
          A quick selfie confirms you're a real person — not a bot or fake account. It does not verify any personal documents or government ID.
        </Text>

        <View style={styles.stepList}>
          {[
            { icon: "camera" as const, label: "Take a front-facing selfie in good lighting" },
            { icon: "upload-cloud" as const, label: "We review and confirm within 1–3 business days" },
            { icon: "shield" as const, label: "Your ✔ Community Verified badge goes live" },
          ].map((s, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={s.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.stepLabel, { color: colors.foreground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {selfieUri ? (
        <View style={styles.previewWrap}>
          <Text style={[styles.previewLabel, { color: colors.foreground }]}>Your selfie</Text>
          <Image source={{ uri: selfieUri }} style={styles.selfiePreview} />
          <TouchableOpacity onPress={onRetakeSelfie} style={styles.retakeBtn} activeOpacity={0.7}>
            <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
            <Text style={[styles.retakeTxt, { color: colors.mutedForeground }]}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.cameraBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={onTakeSelfie}
          activeOpacity={0.85}
        >
          <View style={[styles.cameraBtnIcon, { backgroundColor: "#F0FDF4" }]}>
            <Feather name="camera" size={28} color="#16A34A" />
          </View>
          <Text style={[styles.cameraBtnTitle, { color: colors.foreground }]}>Take Verification Selfie</Text>
          <Text style={[styles.cameraBtnSub, { color: colors.mutedForeground }]}>
            Use your front camera — look directly into the lens
          </Text>
        </TouchableOpacity>
      )}

      {selfieUri && (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: "#16A34A", opacity: submitting ? 0.7 : 1 }]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="send" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Submit for Review</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={[styles.privacyBox, { borderColor: colors.border }]}>
        <Feather name="lock" size={13} color={colors.mutedForeground} />
        <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
          Your selfie is stored securely and used only for identity verification. It is never shared publicly or with third parties.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { marginBottom: 20, alignSelf: "flex-start", padding: 4 },

  screenTitle: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  screenSub: { fontSize: 15, lineHeight: 21, marginBottom: 20 },

  explanationCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  cardHeading: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  cardBody: { fontSize: 14, lineHeight: 20, marginBottom: 16 },

  stepList: { gap: 12 },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  stepLabel: { fontSize: 13, fontWeight: "500", flex: 1, lineHeight: 18 },

  cameraBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 28,
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  cameraBtnIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  cameraBtnTitle: { fontSize: 17, fontWeight: "700" },
  cameraBtnSub: { fontSize: 13, textAlign: "center" },

  previewWrap: { alignItems: "center", marginBottom: 20 },
  previewLabel: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  selfiePreview: { width: 200, height: 200, borderRadius: 100, marginBottom: 10 },
  retakeBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  retakeTxt: { fontSize: 13, fontWeight: "500" },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  privacyBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  privacyText: { fontSize: 12, lineHeight: 17, flex: 1 },

  stateWrap: { alignItems: "center", paddingTop: 20, gap: 16 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  stateTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  stateSub: { fontSize: 15, lineHeight: 22, textAlign: "center" },
  dateHint: { fontSize: 13 },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    width: "100%",
  },
  infoText: { fontSize: 13, lineHeight: 18, flex: 1 },

  benefitList: { width: "100%", gap: 10 },
  benefitRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  benefitText: { fontSize: 14, flex: 1, lineHeight: 20 },
});
