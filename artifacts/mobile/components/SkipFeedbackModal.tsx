import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface Props {
  visible: boolean;
  businessId: string;
  businessName: string;
  onClose: () => void;
}

export function SkipFeedbackModal({ visible, businessId, businessName, onClose }: Props) {
  const colors = useColors();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [filterWarning, setFilterWarning] = useState<string | null>(null);

  function handleClose() {
    setMessage("");
    setDone(false);
    setFilterWarning(null);
    onClose();
  }

  async function handleSubmit() {
    if (!message.trim()) return;
    setFilterWarning(null);
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
        body: JSON.stringify({ message: message.trim() }),
      });
      const json = (await res.json()) as { filtered?: boolean; reason?: string; success?: boolean };
      if (json.filtered) {
        setFilterWarning(json.reason ?? "Please keep feedback constructive and actionable.");
        return;
      }
      if (!res.ok) {
        setFilterWarning("Could not send feedback right now. Please try again.");
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch {
      setFilterWarning("Could not send feedback. Check your connection.");
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
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        pointerEvents="box-none"
        style={styles.centerer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={[styles.iconWrap, { backgroundColor: "#CA922B18" }]}>
              <Feather name="message-circle" size={20} color="#CA922B" />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {done ? (
            <View style={styles.doneWrap}>
              <Feather name="check-circle" size={40} color="#2D7A4F" />
              <Text style={[styles.doneTitle, { color: colors.foreground }]}>Feedback Sent</Text>
              <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
                Thank you — the owner will receive your note privately. Your feedback helps minority-owned businesses grow.
              </Text>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Leave a note for {businessName}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                As we work to build community, if you'd like to offer constructive feedback to the owner to help them improve, please share it here. This is private — only the owner will see it.
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: filterWarning ? "#DC2626" : colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder={
                  "e.g. Not wheelchair accessible, limited parking nearby, long wait times, could use more vegetarian options, signage was unclear…"
                }
                placeholderTextColor={colors.mutedForeground}
                value={message}
                onChangeText={(t) => { setMessage(t); setFilterWarning(null); }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />

              <View style={styles.charRow}>
                {filterWarning ? (
                  <Text style={styles.filterWarning}>{filterWarning}</Text>
                ) : (
                  <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{message.length}/500</Text>
                )}
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={handleClose} activeOpacity={0.8}>
                  <Text style={[styles.cancelTxt, { color: colors.mutedForeground }]}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: message.trim() ? 1 : 0.45 }]}
                  onPress={handleSubmit}
                  disabled={submitting || !message.trim()}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="send" size={14} color="#fff" />
                      <Text style={styles.sendTxt}>Send Privately</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
                Inflammatory, personal, or offensive feedback is not delivered. Keep it constructive.
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 110,
    lineHeight: 20,
  },
  charRow: {
    marginTop: 6,
    minHeight: 18,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  filterWarning: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#DC2626",
    lineHeight: 17,
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
