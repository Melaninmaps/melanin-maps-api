import { Feather } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const SENSITIVE_CATEGORIES = new Set([
  "health",
  "health_wellness",
  "wellness",
  "mental-health",
  "mental_health",
  "reproductive",
  "reproductive_health",
  "hiv-aids",
  "substance-recovery",
  "maternal",
  "financial",
  "financial_wellness",
  "cancer",
  "sickle-cell",
]);

export function isSensitiveCategory(category: string): boolean {
  return SENSITIVE_CATEGORIES.has(category.toLowerCase());
}

interface PrivacyPinModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  category: string;
  isPinning: boolean;
}

export function PrivacyPinModal({
  visible,
  onClose,
  onConfirm,
  itemName,
  category,
  isPinning,
}: PrivacyPinModalProps) {
  const colors = useColors();
  const sensitive = isSensitiveCategory(category);
  const [step, setStep] = useState<"explain" | "verify">("explain");
  const [confirmText, setConfirmText] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [biometricFailed, setBiometricFailed] = useState(false);

  function reset() {
    setStep("explain");
    setConfirmText("");
    setVerifying(false);
    setBiometricFailed(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleContinue() {
    if (!sensitive || !isPinning) {
      onConfirm();
      reset();
      return;
    }
    if (step === "explain") {
      setStep("verify");
      return;
    }
    await attemptVerify();
  }

  async function attemptVerify() {
    setVerifying(true);
    try {
      if (Platform.OS !== "web") {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Confirm your identity to pin this to your profile",
            fallbackLabel: "Use passcode",
            cancelLabel: "Cancel",
            disableDeviceFallback: false,
          });
          if (result.success) {
            setVerifying(false);
            onConfirm();
            reset();
            return;
          } else {
            setBiometricFailed(true);
            setVerifying(false);
            return;
          }
        }
      }
      setBiometricFailed(true);
      setVerifying(false);
    } catch {
      setBiometricFailed(true);
      setVerifying(false);
    }
  }

  async function handleTextConfirm() {
    if (confirmText.trim().toUpperCase() !== "CONFIRM") {
      Alert.alert("Type CONFIRM", "Please type the word CONFIRM exactly to continue.");
      return;
    }
    onConfirm();
    reset();
  }

  const catMeta = CATEGORY_LABELS[category] ?? { emoji: "📌", label: category };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>

          {/* Header */}
          <View style={[styles.iconRing, { backgroundColor: sensitive ? "#FEF2F2" : colors.primary + "15" }]}>
            <Text style={styles.iconEmoji}>{sensitive ? "🔒" : "📌"}</Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            {isPinning
              ? step === "verify" ? "Verify Your Identity" : "Pin to Profile?"
              : "Remove from Profile?"}
          </Text>

          {/* Step: explain */}
          {(step === "explain" || !isPinning) && (
            <>
              <View style={[styles.itemRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={styles.itemEmoji}>{catMeta.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                    {itemName}
                  </Text>
                  <Text style={[styles.itemCat, { color: colors.mutedForeground }]}>{catMeta.label}</Text>
                </View>
              </View>

              {isPinning ? (
                <View style={styles.body}>
                  {sensitive ? (
                    <>
                      <View style={[styles.warningBanner, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
                        <Feather name="alert-triangle" size={16} color="#DC2626" style={{ marginTop: 2 }} />
                        <Text style={[styles.warningText, { color: "#991B1B" }]}>
                          This is sensitive health information. Pinning it to your profile means anyone who can view your profile will see this topic. We take your privacy seriously.
                        </Text>
                      </View>
                      <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>
                        We recommend only pinning topics you're comfortable sharing publicly. You can always unpin it later.
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>
                      This topic will appear on your public profile. Everything you save stays private by default — only items you pin are visible to others.
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.bodyText, { color: colors.mutedForeground, textAlign: "center" }]}>
                  This topic will be removed from your public profile. It will still stay in your private library.
                </Text>
              )}
            </>
          )}

          {/* Step: verify (sensitive + pinning only) */}
          {step === "verify" && isPinning && sensitive && (
            <View style={styles.body}>
              {!biometricFailed ? (
                <>
                  <Text style={[styles.bodyText, { color: colors.mutedForeground, textAlign: "center" }]}>
                    To protect your privacy, please verify your identity before pinning sensitive health information to your profile.
                  </Text>
                  <View style={[styles.biometricBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={{ fontSize: 28 }}>
                      {Platform.OS === "ios" ? "🔐" : "👆🏾"}
                    </Text>
                    <Text style={[styles.biometricLabel, { color: colors.foreground }]}>
                      {Platform.OS === "ios" ? "Face ID / Touch ID" : "Fingerprint / Biometric"}
                    </Text>
                    <Text style={[styles.biometricSub, { color: colors.mutedForeground }]}>
                      Tap below to verify
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.bodyText, { color: colors.mutedForeground, textAlign: "center" }]}>
                    Biometric verification isn't available. Type <Text style={{ fontWeight: "700", color: colors.foreground }}>CONFIRM</Text> below to acknowledge you are intentionally sharing this health topic on your profile.
                  </Text>
                  <TextInput
                    style={[styles.confirmInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
                    placeholder="Type CONFIRM"
                    placeholderTextColor={colors.mutedForeground}
                    value={confirmText}
                    onChangeText={setConfirmText}
                    autoCapitalize="characters"
                    returnKeyType="done"
                  />
                </>
              )}
            </View>
          )}

          {/* Privacy note */}
          <View style={[styles.privacyNote, { backgroundColor: colors.background }]}>
            <Feather name="shield" size={12} color={colors.mutedForeground} />
            <Text style={[styles.privacyNoteText, { color: colors.mutedForeground }]}>
              All saved items are private by default. Only pinned items appear on your profile.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn, { borderColor: colors.border }]} onPress={handleClose} activeOpacity={0.75}>
              <Text style={[styles.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>

            {step === "verify" && isPinning && sensitive ? (
              biometricFailed ? (
                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn, { backgroundColor: "#DC2626" }]}
                  onPress={handleTextConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.btnText, { color: "#FFF" }]}>Confirm Pin</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn, { backgroundColor: "#DC2626" }]}
                  onPress={attemptVerify}
                  disabled={verifying}
                  activeOpacity={0.8}
                >
                  {verifying
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={[styles.btnText, { color: "#FFF" }]}>Verify Identity</Text>}
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                style={[styles.btn, styles.confirmBtn, { backgroundColor: isPinning && sensitive ? "#DC2626" : colors.primary }]}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={[styles.btnText, { color: "#FFF" }]}>
                  {isPinning
                    ? sensitive ? "I Understand, Continue" : "Pin to Profile"
                    : "Remove from Profile"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  health: { emoji: "🩺", label: "Health" },
  health_wellness: { emoji: "💪", label: "Health & Wellness" },
  wellness: { emoji: "🧠", label: "Wellness" },
  "mental-health": { emoji: "🧠", label: "Mental Health" },
  mental_health: { emoji: "🧠", label: "Mental Health" },
  reproductive: { emoji: "🌸", label: "Reproductive Health" },
  reproductive_health: { emoji: "🌸", label: "Reproductive Health" },
  "hiv-aids": { emoji: "🔴", label: "HIV/AIDS" },
  "substance-recovery": { emoji: "🌿", label: "Recovery" },
  maternal: { emoji: "🤱🏾", label: "Maternal Health" },
  cancer: { emoji: "🎗️", label: "Cancer" },
  "sickle-cell": { emoji: "🔬", label: "Sickle Cell" },
  financial: { emoji: "💵", label: "Financial" },
  financial_wellness: { emoji: "💰", label: "Financial Wellness" },
  travel: { emoji: "✈️", label: "Travel" },
  relocation: { emoji: "🏡", label: "Relocation" },
  safety: { emoji: "🛡️", label: "Safety" },
  business: { emoji: "📈", label: "Business" },
  employment: { emoji: "💼", label: "Employment" },
  education: { emoji: "🎓", label: "Education" },
  community_culture: { emoji: "✊🏾", label: "Community" },
  government: { emoji: "⚖️", label: "Government" },
  technology: { emoji: "💻", label: "Technology" },
  environment: { emoji: "🌱", label: "Environment" },
  giving: { emoji: "🤝", label: "Giving Back" },
  family: { emoji: "👨‍👩‍👧", label: "Family" },
  entertainment: { emoji: "🎬", label: "Entertainment" },
  food: { emoji: "🍽️", label: "Food" },
  food_lifestyle: { emoji: "🍽️", label: "Food & Lifestyle" },
  culture: { emoji: "🎉", label: "Culture" },
  platform: { emoji: "✦", label: "MWM Updates" },
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: 28 },
  title: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  itemRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemEmoji: { fontSize: 24 },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemCat: { fontSize: 12, marginTop: 2 },
  body: { width: "100%", gap: 12 },
  warningBanner: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  warningText: { fontSize: 13, lineHeight: 18, flex: 1, fontWeight: "500" },
  bodyText: { fontSize: 13, lineHeight: 20, textAlign: "left" },
  biometricBox: {
    alignItems: "center",
    gap: 6,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  biometricLabel: { fontSize: 15, fontWeight: "700" },
  biometricSub: { fontSize: 12 },
  confirmInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
  },
  privacyNote: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    width: "100%",
  },
  privacyNoteText: { fontSize: 11, flex: 1, lineHeight: 15 },
  buttons: { flexDirection: "row", gap: 10, width: "100%" },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: { borderWidth: 1 },
  confirmBtn: {},
  btnText: { fontSize: 14, fontWeight: "700" },
});
