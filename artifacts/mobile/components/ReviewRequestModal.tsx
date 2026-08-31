import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const OUTCOMES = [
  {
    icon: "check-circle" as const,
    color: "#2D7A4F",
    bg: "#2D7A4F18",
    label: "No violation found",
    detail: "The video remains published as-is. We'll notify you of the decision.",
  },
  {
    icon: "edit-2" as const,
    color: "#C9922B",
    bg: "#C9922B18",
    label: "Minor issue identified",
    detail: "The creator is asked to edit the video title, caption, or remove a specific segment.",
  },
  {
    icon: "x-circle" as const,
    color: "#E53E3E",
    bg: "#E53E3E18",
    label: "Clear policy violation",
    detail: "The video is removed and the creator is notified of the specific policy that was violated.",
  },
  {
    icon: "alert-triangle" as const,
    color: "#8B4513",
    bg: "#8B451318",
    label: "Repeated violations",
    detail: "Creators with a pattern of violations receive formal warnings or lose posting privileges.",
  },
];

interface Props {
  visible: boolean;
  videoTitle: string;
  onClose: () => void;
}

export function ReviewRequestModal({ visible, videoTitle, onClose }: Props) {
  const colors = useColors();
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setReason("");
    setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!reason.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    setTimeout(() => {
      reset();
      onClose();
    }, 2800);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {submitted ? (
            <View style={styles.successState}>
              <View style={[styles.successIcon, { backgroundColor: "#2D7A4F22" }]}>
                <Feather name="check-circle" size={32} color="#2D7A4F" />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Review Requested</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Our moderation team will review this content within 3–5 business days. You&apos;ll be notified when a decision is made.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.foreground }]}>Request a Moderation Review</Text>
                  <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {videoTitle}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                  <Feather name="x" size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {/* What this is */}
                <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="info" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.infoTxt, { color: colors.mutedForeground }]}>
                    A review request sends this video to our human moderation team. This is separate from a report — it&apos;s a formal request for a policy determination. Videos are never automatically removed.
                  </Text>
                </View>

                {/* Possible outcomes */}
                <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Possible outcomes</Text>
                <View style={styles.outcomeList}>
                  {OUTCOMES.map((o, i) => (
                    <View key={i} style={[styles.outcomeRow, { backgroundColor: o.bg, borderColor: o.color + "40" }]}>
                      <View style={[styles.outcomeIcon, { backgroundColor: o.bg }]}>
                        <Feather name={o.icon} size={16} color={o.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.outcomeLabel, { color: o.color }]}>{o.label}</Text>
                        <Text style={[styles.outcomeDetail, { color: colors.foreground }]}>{o.detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Reason field */}
                <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: 6 }]}>
                  Why are you requesting a review?{" "}
                  <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13 }]}>
                    (required)
                  </Text>
                </Text>
                <TextInput
                  style={[styles.reasonInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Explain specifically why you believe this video violates our policies and what impact it has had on your business..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={5}
                  value={reason}
                  onChangeText={setReason}
                />

                <View style={[styles.fairnessNote, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Text style={[styles.fairnessTxt, { color: colors.mutedForeground }]}>
                    Both the creator and the business will be notified of the review outcome. This process is designed to be fair to both parties.
                  </Text>
                </View>

                <View style={{ height: 16 }} />
              </ScrollView>

              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: reason.trim() ? colors.primary : colors.secondary }]}
                  onPress={handleSubmit}
                  disabled={!reason.trim()}
                  activeOpacity={0.85}
                >
                  <Feather name="send" size={15} color={reason.trim() ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.submitTxt, { color: reason.trim() ? "#fff" : colors.mutedForeground }]}>
                    Submit for Review
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "92%", paddingHorizontal: 20, paddingBottom: 32,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginVertical: 12 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 3 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 18,
  },
  infoTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 10 },
  outcomeList: { gap: 8, marginBottom: 18 },
  outcomeRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  outcomeIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  outcomeLabel: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  outcomeDetail: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  reasonInput: {
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14,
    fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 100,
    textAlignVertical: "top",
  },
  fairnessNote: {
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 4,
  },
  fairnessTxt: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, textAlign: "center", fontStyle: "italic" },
  footer: { borderTopWidth: 1, paddingTop: 14, marginTop: 4 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15, borderRadius: 12,
  },
  submitTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  successState: { alignItems: "center", paddingVertical: 48, gap: 14, paddingHorizontal: 16 },
  successIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
});
