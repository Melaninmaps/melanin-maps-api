import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const PRIVATE_REASON_OPTIONS = [
  { code: "accessibility", label: "Accessibility" },
  { code: "hours_availability", label: "Hours or availability" },
  { code: "price_value", label: "Price or value" },
  { code: "service_experience", label: "Service or experience" },
  { code: "information_access", label: "Information or booking" },
  { code: "other", label: "Other general concern" },
] as const;

interface Props {
  visible: boolean;
  businessId: string;
  businessName: string;
  onClose: () => void;
}

export function SkipFeedbackModal({ visible, businessId, businessName, onClose }: Props) {
  const colors = useColors();
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  function handleClose() {
    setReasonCode(null);
    setDone(false);
    setWarning(null);
    onClose();
  }

  async function handleSubmit() {
    if (!reasonCode) return;
    setWarning(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${base}/api/businesses/${businessId}/skip-feedback`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reasonCode }),
      });
      const json = await res.json() as { error?: string; success?: boolean };
      if (!res.ok) {
        setWarning(json.error ?? "Could not share your signal right now. Please try again.");
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch {
      setWarning("Could not share your signal. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View pointerEvents="box-none" style={styles.centerer}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHeader}>
            <View style={[styles.iconWrap, { backgroundColor: "#CA922B18" }]}>
              <Feather name="bar-chart-2" size={20} color="#CA922B" />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {done ? (
            <View style={styles.doneWrap}>
              <Feather name="check-circle" size={40} color="#2D7A4F" />
              <Text style={[styles.doneTitle, { color: colors.foreground }]}>Signal Shared</Text>
              <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
                Thank you. Your selected category may contribute to an aggregate community signal. No personal note or identity is delivered to the business.
              </Text>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>Share a community signal</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Why was {businessName} not a fit today? Select one broad category. Your signal is combined with other members only after a privacy threshold; no personal note is sent to the business.
              </Text>

              <View style={styles.options}>
                {PRIVATE_REASON_OPTIONS.map((option) => {
                  const selected = reasonCode === option.code;
                  return (
                    <TouchableOpacity
                      key={option.code}
                      style={[
                        styles.option,
                        {
                          backgroundColor: selected ? "#CA922B18" : colors.background,
                          borderColor: selected ? "#CA922B" : colors.border,
                        },
                      ]}
                      onPress={() => { setReasonCode(option.code); setWarning(null); }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radio, { borderColor: selected ? "#CA922B" : colors.mutedForeground }]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <Text style={[styles.optionLabel, { color: colors.foreground }]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {warning ? <Text style={styles.warning}>{warning}</Text> : null}

              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={handleClose} activeOpacity={0.8}>
                  <Text style={[styles.cancelTxt, { color: colors.mutedForeground }]}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: reasonCode ? 1 : 0.45 }]}
                  onPress={handleSubmit}
                  disabled={submitting || !reasonCode}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="shield" size={14} color="#fff" />
                      <Text style={styles.sendTxt}>Share Signal</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
                Individual feedback, names, messages, and chat context are not shown to the business.
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centerer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: { padding: 2 },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginBottom: 14,
  },
  options: { gap: 8 },
  option: {
    borderWidth: 1,
    borderRadius: 11,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#CA922B" },
  optionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  warning: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#DC2626",
    lineHeight: 17,
    marginTop: 8,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  sendBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  sendTxt: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 16,
  },
  doneWrap: { alignItems: "center", paddingVertical: 10, gap: 10 },
  doneTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4 },
  doneSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  doneBtn: { marginTop: 8, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10 },
  doneBtnTxt: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
