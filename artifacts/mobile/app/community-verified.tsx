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
  | "choose_method"
  | "capturing"
  | "submitting"
  | "success";

type VerificationMethod = "selfie" | "gov_id" | null;

const GOLD = "#CA922B";
const PAID_TIERS = ["navigator", "trailblazer", "community_builder", "founding", "beta", "legacy_member"];

export default function CommunityVerifiedScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [method, setMethod] = useState<VerificationMethod>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedKey, setCapturedKey] = useState<string | null>(null);
  const [pendingSubmittedAt, setPendingSubmittedAt] = useState<string | null>(null);
  const [rejectedNotes, setRejectedNotes] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!isAuthenticated) { setStatus("upgrade_required"); return; }
    const memberType = (user as any)?.memberType ?? "individual";
    if (!PAID_TIERS.includes(memberType)) { setStatus("upgrade_required"); return; }

    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/users/me/trust`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { setStatus("choose_method"); return; }
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
        setStatus("choose_method");
      }
    } catch {
      setStatus("choose_method");
    }
  }, [isAuthenticated, user]);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  const handleSelectMethod = async (chosen: VerificationMethod) => {
    setMethod(chosen);
    if ((Platform.OS as string) === "web") {
      Alert.alert("Not available", "Please use the iOS app to complete verification.");
      return;
    }

    setStatus("capturing");

    try {
      if (chosen === "selfie") {
        const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (camStatus !== "granted") {
          Alert.alert(
            "Camera access needed",
            "Allow camera access in Settings to take your verification selfie.",
            [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Cancel", style: "cancel" }],
          );
          setStatus("choose_method");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          cameraType: ImagePicker.CameraType.front,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
        if (result.canceled || !result.assets[0]) { setStatus("choose_method"); return; }
        setCapturedUri(result.assets[0].uri);
        setCapturedKey(null);
      } else {
        const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libStatus !== "granted") {
          Alert.alert(
            "Photo access needed",
            "Allow photo library access in Settings to upload your ID.",
            [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "Cancel", style: "cancel" }],
          );
          setStatus("choose_method");
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.9,
        });
        if (result.canceled || !result.assets[0]) { setStatus("choose_method"); return; }
        setCapturedUri(result.assets[0].uri);
        setCapturedKey(null);
      }
      setStatus("choose_method");
    } catch {
      setStatus("choose_method");
      Alert.alert("Error", "Couldn't open camera or photo library. Please try again.");
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const token = await SecureStore.getItemAsync("auth_session_token");
    const apiBase = getApiBase();
    const formData = new FormData();
    formData.append("file", { uri, type: "image/jpeg", name: "verification.jpg" } as unknown as Blob);
    formData.append("docType", method === "gov_id" ? "government_issued_id" : "government_issued_id");
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
    if (!capturedUri && !capturedKey) {
      Alert.alert("Photo required", "Please capture or select your verification photo first.");
      return;
    }
    setStatus("submitting");
    try {
      let key = capturedKey;
      if (capturedUri && !key) {
        key = await uploadImage(capturedUri);
        setCapturedKey(key);
      }
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/users/identity-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
      setStatus("choose_method");
      Alert.alert("Submission failed", err?.message ?? "Something went wrong. Please try again.");
    }
  };

  const bg = colors.background;

  if (status === "loading") {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={GOLD} />
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
        <RejectedState
          colors={colors}
          notes={rejectedNotes}
          onRetry={() => { setCapturedUri(null); setCapturedKey(null); setMethod(null); setStatus("choose_method"); }}
        />
      )}
      {status === "success" && <SuccessState colors={colors} onDone={() => router.back()} />}

      {(status === "choose_method" || status === "capturing" || status === "submitting") && (
        <ChooseMethodState
          colors={colors}
          capturedUri={capturedUri}
          method={method}
          submitting={status === "submitting"}
          onSelectMethod={handleSelectMethod}
          onRetake={() => { setCapturedUri(null); setCapturedKey(null); handleSelectMethod(method); }}
          onSubmit={handleSubmit}
        />
      )}
    </ScrollView>
  );
}

function ChooseMethodState({
  colors,
  capturedUri,
  method,
  submitting,
  onSelectMethod,
  onRetake,
  onSubmit,
}: {
  colors: any;
  capturedUri: string | null;
  method: VerificationMethod;
  submitting: boolean;
  onSelectMethod: (m: VerificationMethod) => void;
  onRetake: () => void;
  onSubmit: () => void;
}) {
  return (
    <View>
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Build Trust Within{"\n"}the Community</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
        Verification helps create a safer, more authentic experience for everyone.
      </Text>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Choose a verification method</Text>

      <TouchableOpacity
        style={[
          styles.methodCard,
          { backgroundColor: colors.card, borderColor: method === "selfie" ? GOLD : colors.border },
          method === "selfie" && styles.methodCardSelected,
        ]}
        onPress={() => onSelectMethod("selfie")}
        activeOpacity={0.85}
      >
        <View style={[styles.methodIconWrap, { backgroundColor: method === "selfie" ? "#CA922B18" : colors.secondary }]}>
          <Feather name="camera" size={26} color={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.methodTitle, { color: colors.foreground }]}>Live Selfie Verification</Text>
          <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>
            Take a quick front-facing selfie to confirm you're a real person
          </Text>
        </View>
        <Feather name={method === "selfie" ? "check-circle" : "chevron-right"} size={20} color={method === "selfie" ? GOLD : colors.mutedForeground} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.methodCard,
          { backgroundColor: colors.card, borderColor: method === "gov_id" ? GOLD : colors.border },
          method === "gov_id" && styles.methodCardSelected,
        ]}
        onPress={() => onSelectMethod("gov_id")}
        activeOpacity={0.85}
      >
        <View style={[styles.methodIconWrap, { backgroundColor: method === "gov_id" ? "#CA922B18" : colors.secondary }]}>
          <Feather name="credit-card" size={26} color={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.methodTitle, { color: colors.foreground }]}>Government Photo ID</Text>
          <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>
            Upload a photo of a valid government-issued ID (driver's license, passport)
          </Text>
        </View>
        <Feather name={method === "gov_id" ? "check-circle" : "chevron-right"} size={20} color={method === "gov_id" ? GOLD : colors.mutedForeground} />
      </TouchableOpacity>

      {capturedUri && method && (
        <>
          <View style={styles.previewWrap}>
            <Text style={[styles.previewLabel, { color: colors.foreground }]}>
              {method === "selfie" ? "Your selfie" : "Your ID photo"}
            </Text>
            <Image
              source={{ uri: capturedUri }}
              style={method === "selfie" ? styles.selfiePreview : styles.idPreview}
            />
            <TouchableOpacity onPress={onRetake} style={styles.retakeBtn} activeOpacity={0.7}>
              <Feather name="refresh-cw" size={14} color={GOLD} />
              <Text style={[styles.retakeTxt, { color: GOLD }]}>Retake</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { opacity: submitting ? 0.7 : 1 }]}
            onPress={onSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>Submit for Review</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      <View style={[styles.footerNote, { borderTopColor: colors.border }]}>
        <Feather name="shield" size={14} color={GOLD} />
        <Text style={[styles.footerNoteText, { color: colors.mutedForeground }]}>
          Once approved, you'll receive a{" "}
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>Verified Member</Text> or{" "}
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>Verified Business</Text> badge.
        </Text>
      </View>

      <View style={[styles.footerNote, { borderTopWidth: 0, marginTop: 0 }]}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.footerNoteText, { color: colors.mutedForeground }]}>
          Verification is optional, but it helps increase confidence when connecting with others.
        </Text>
      </View>

      <View style={[styles.privacyRow, { borderTopColor: colors.border }]}>
        <Feather name="lock" size={12} color={colors.mutedForeground} />
        <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
          Your photo is stored securely and used only for identity verification. It is never shared publicly.
        </Text>
      </View>
    </View>
  );
}

function AlreadyVerifiedState({ colors }: { colors: any }) {
  return (
    <View style={styles.stateWrap}>
      <View style={[styles.iconCircle, { backgroundColor: "#CA922B18" }]}>
        <Feather name="shield" size={36} color={GOLD} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>You're Verified</Text>
      <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
        Your identity has been confirmed. Your Verified Member badge is visible across the platform — on your profile, reviews, and community posts.
      </Text>
      <View style={[styles.badgeRow, { borderColor: GOLD + "40", backgroundColor: "#CA922B18" }]}>
        <Feather name="check-circle" size={16} color={GOLD} />
        <Text style={{ fontSize: 14, color: GOLD, fontWeight: "700", marginLeft: 6 }}>
          Verified Member
        </Text>
      </View>
    </View>
  );
}

function UpgradeRequiredState({ colors, onUpgrade }: { colors: any; onUpgrade: () => void }) {
  return (
    <View style={styles.stateWrap}>
      <View style={[styles.iconCircle, { backgroundColor: "#CA922B18" }]}>
        <Feather name="lock" size={36} color={GOLD} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>Unlock Verification</Text>
      <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
        Verification is available for Navigator members and above. Upgrade your membership to build trust within the community.
      </Text>
      <View style={styles.benefitList}>
        {[
          "Verified Member badge on your profile, reviews & posts",
          "Increased trust score in the community",
          "Priority visibility in community feeds",
          "Greater credibility with businesses and members",
        ].map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Feather name="check" size={14} color={GOLD} />
            <Text style={[styles.benefitText, { color: colors.foreground }]}>{b}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.submitBtn} onPress={onUpgrade} activeOpacity={0.85}>
        <Text style={styles.submitBtnText}>Upgrade Membership</Text>
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
      <View style={[styles.iconCircle, { backgroundColor: "#CA922B18" }]}>
        <Feather name="clock" size={36} color={GOLD} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>Under Review</Text>
      <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
        Your verification has been submitted and is being reviewed by our team. This typically takes 1–3 business days.
      </Text>
      {dateStr && (
        <Text style={[styles.dateHint, { color: colors.mutedForeground }]}>Submitted {dateStr}</Text>
      )}
      <View style={[styles.infoBox, { backgroundColor: "#CA922B12", borderColor: GOLD + "40" }]}>
        <Feather name="bell" size={14} color={GOLD} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          You'll receive a notification once your Verified Member badge is ready.
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
        We weren't able to verify your identity with the submitted photo. Please try again with a clear, well-lit image.
      </Text>
      {notes && (
        <View style={[styles.infoBox, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
          <Feather name="alert-circle" size={14} color="#DC2626" />
          <Text style={[styles.infoText, { color: "#DC2626" }]}>{notes}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.submitBtn} onPress={onRetry} activeOpacity={0.85}>
        <Feather name="refresh-cw" size={16} color="#fff" />
        <Text style={styles.submitBtnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

function SuccessState({ colors, onDone }: { colors: any; onDone: () => void }) {
  return (
    <View style={styles.stateWrap}>
      <View style={[styles.iconCircle, { backgroundColor: "#CA922B18" }]}>
        <Feather name="check-circle" size={36} color={GOLD} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>Submitted for Review</Text>
      <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>
        Your verification is in our queue. Our team will review it within 1–3 business days. You'll be notified when it's approved.
      </Text>
      <View style={[styles.infoBox, { backgroundColor: "#CA922B12", borderColor: GOLD + "40" }]}>
        <Feather name="shield" size={14} color={GOLD} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Once approved, your{" "}
          <Text style={{ color: GOLD, fontWeight: "600" }}>Verified Member</Text> badge will appear on your profile and across the platform.
        </Text>
      </View>
      <TouchableOpacity style={styles.submitBtn} onPress={onDone} activeOpacity={0.85}>
        <Text style={styles.submitBtnText}>Back to Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { marginBottom: 20, alignSelf: "flex-start", padding: 4 },

  screenTitle: { fontSize: 26, fontWeight: "800", lineHeight: 32, marginBottom: 10 },
  screenSub: { fontSize: 15, lineHeight: 22, marginBottom: 24 },

  sectionLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 12, opacity: 0.6 },

  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  methodCardSelected: {
    borderWidth: 2,
  },
  methodIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  methodTitle: { fontSize: 16, fontWeight: "700", marginBottom: 3 },
  methodSub: { fontSize: 13, lineHeight: 18 },

  previewWrap: { alignItems: "center", marginTop: 8, marginBottom: 20 },
  previewLabel: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  selfiePreview: { width: 180, height: 180, borderRadius: 90, marginBottom: 10 },
  idPreview: { width: "100%", height: 200, borderRadius: 12, resizeMode: "cover", marginBottom: 10 },
  retakeBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  retakeTxt: { fontSize: 13, fontWeight: "600" },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: GOLD,
  },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 10,
  },
  footerNoteText: { fontSize: 13, lineHeight: 19, flex: 1 },

  privacyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 14,
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
