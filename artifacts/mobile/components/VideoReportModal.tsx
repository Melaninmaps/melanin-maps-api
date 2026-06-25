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

const REPORT_REASONS = [
  {
    id: "false_info",
    icon: "alert-circle" as const,
    label: "False Information",
    sub: "The video contains factually incorrect claims about the business or location.",
  },
  {
    id: "harassment",
    icon: "user-x" as const,
    label: "Harassment",
    sub: "The video targets or harasses an individual or business.",
  },
  {
    id: "hate_speech",
    icon: "shield-off" as const,
    label: "Hate Speech",
    sub: "Content promotes discrimination based on race, religion, gender, or identity.",
  },
  {
    id: "threats",
    icon: "alert-triangle" as const,
    label: "Threats or Violence",
    sub: "The video contains threats or promotes harm.",
  },
  {
    id: "nudity",
    icon: "eye-off" as const,
    label: "Nudity or Explicit Content",
    sub: "Content is sexually explicit or otherwise inappropriate.",
  },
  {
    id: "copyright",
    icon: "copy" as const,
    label: "Copyright Infringement",
    sub: "Video uses music, footage, or material without permission.",
  },
  {
    id: "spam",
    icon: "trash-2" as const,
    label: "Spam",
    sub: "Repetitive, promotional, or irrelevant content.",
  },
  {
    id: "not_customer",
    icon: "x-circle" as const,
    label: "Creator Was Never a Customer",
    sub: "You can reasonably demonstrate they did not visit your business.",
  },
];

interface Props {
  visible: boolean;
  videoTitle: string;
  isBusiness?: boolean;
  onClose: () => void;
}

export function VideoReportModal({ visible, videoTitle, isBusiness = false, onClose }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setSelected(null);
    setDetails("");
    setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!selected) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    setTimeout(() => {
      reset();
      onClose();
    }, 2500);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {submitted ? (
            <View style={styles.successState}>
              <View style={[styles.successIcon, { backgroundColor: "#2D7A4F22" }]}>
                <Feather name="check-circle" size={32} color="#2D7A4F" />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Report Submitted</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Our moderation team will review this content. Videos are not automatically removed — every report goes through a human review.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.foreground }]}>Report Video</Text>
                  <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {videoTitle}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Policy note */}
              <View style={[styles.policyNote, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[styles.policyTxt, { color: colors.mutedForeground }]}>
                  {isBusiness
                    ? "Reports go to our moderation team — not automatic removal. You may also respond publicly to the video."
                    : "Reports go to our moderation team for human review. Videos are community content and are not automatically removed."}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={styles.reasonList}>
                  {REPORT_REASONS.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.reasonRow,
                        {
                          backgroundColor: selected === r.id ? colors.primary + "12" : colors.card,
                          borderColor: selected === r.id ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setSelected(r.id);
                        if (Platform.OS !== "web") Haptics.selectionAsync();
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.reasonIconWrap, { backgroundColor: selected === r.id ? colors.primary + "18" : colors.secondary }]}>
                        <Feather name={r.icon} size={16} color={selected === r.id ? colors.primary : colors.mutedForeground} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reasonLabel, { color: colors.foreground }]}>{r.label}</Text>
                        <Text style={[styles.reasonSub, { color: colors.mutedForeground }]}>{r.sub}</Text>
                      </View>
                      {selected === r.id && (
                        <Feather name="check-circle" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {selected && (
                  <View style={styles.detailsWrap}>
                    <Text style={[styles.detailsLabel, { color: colors.foreground }]}>
                      Additional context <Text style={[{ color: colors.mutedForeground }]}>(optional)</Text>
                    </Text>
                    <TextInput
                      style={[styles.detailsInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                      placeholder="Describe the issue in more detail..."
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      numberOfLines={4}
                      value={details}
                      onChangeText={setDetails}
                    />
                  </View>
                )}

                <View style={{ height: 24 }} />
              </ScrollView>

              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: selected ? colors.primary : colors.secondary },
                  ]}
                  onPress={handleSubmit}
                  disabled={!selected}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.submitTxt, { color: selected ? "#fff" : colors.mutedForeground }]}>
                    Submit Report
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
    maxHeight: "90%", paddingHorizontal: 20, paddingBottom: 32,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginVertical: 12 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 3 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  policyNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16,
  },
  policyTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  reasonList: { gap: 8 },
  reasonRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  reasonIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  reasonLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  reasonSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  detailsWrap: { marginTop: 16, gap: 8 },
  detailsLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  detailsInput: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 90,
    textAlignVertical: "top",
  },
  footer: { borderTopWidth: 1, paddingTop: 14, marginTop: 4 },
  submitBtn: { alignItems: "center", paddingVertical: 15, borderRadius: 12 },
  submitTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  successState: { alignItems: "center", paddingVertical: 48, gap: 14, paddingHorizontal: 16 },
  successIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
});
