import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const REPORT_CATEGORIES = [
  { id: "inaccurate", icon: "alert-circle" as const, label: "Inaccurate Information", sub: "Hours, address, or details are wrong" },
  { id: "closed", icon: "x-circle" as const, label: "Business Closed", sub: "This location is no longer operating" },
  { id: "not_black_owned", icon: "flag" as const, label: "Not Black-Owned", sub: "Ownership claim appears incorrect" },
  { id: "discrimination", icon: "shield-off" as const, label: "Discrimination Report", sub: "Experienced racial bias or discrimination" },
  { id: "safety", icon: "alert-triangle" as const, label: "Safety Concern", sub: "Unsafe environment or practices reported" },
  { id: "spam", icon: "trash-2" as const, label: "Spam / Fake Listing", sub: "This listing appears fake or promotional" },
  { id: "inappropriate", icon: "eye-off" as const, label: "Inappropriate Content", sub: "Content violates community guidelines" },
  { id: "other", icon: "more-horizontal" as const, label: "Other", sub: "Something else not listed above" },
];

interface Props {
  visible: boolean;
  businessName: string;
  onClose: () => void;
}

export function ReportContentModal({ visible, businessName, onClose }: Props) {
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    setTimeout(() => {
      reset();
      onClose();
    }, 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {submitted ? (
            <View style={styles.successWrap}>
              <View style={[styles.successIcon, { backgroundColor: "#2D7A4F18" }]}>
                <Feather name="check-circle" size={40} color="#2D7A4F" />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Report Submitted</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Our team will review this within 24–48 hours. Thank you for keeping the community accurate.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.foreground }]}>Report Content</Text>
                  <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {businessName}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={22} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>What's the issue?</Text>

              {REPORT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryRow,
                    {
                      backgroundColor: selected === cat.id ? colors.primary + "10" : colors.card,
                      borderColor: selected === cat.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelected(cat.id);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.catIcon, { backgroundColor: selected === cat.id ? colors.primary + "18" : colors.secondary }]}>
                    <Feather name={cat.icon} size={16} color={selected === cat.id ? colors.primary : colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catLabel, { color: colors.foreground }]}>{cat.label}</Text>
                    <Text style={[styles.catSub, { color: colors.mutedForeground }]}>{cat.sub}</Text>
                  </View>
                  {selected === cat.id && (
                    <Feather name="check-circle" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={[styles.label, { color: colors.foreground, marginTop: 16 }]}>
                Additional details <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Help us understand the issue better..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                value={details}
                onChangeText={setDetails}
              />

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: selected ? "#DC2626" : colors.muted }]}
                onPress={handleSubmit}
                disabled={!selected}
                activeOpacity={0.85}
              >
                <Feather name="flag" size={16} color="#FFFFFF" />
                <Text style={styles.submitText}>Submit Report</Text>
              </TouchableOpacity>

              <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
                Reports are anonymous and reviewed by our moderation team within 24–48 hours.
              </Text>
              <View style={{ height: 32 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "92%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    marginBottom: 2,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 1,
  },
  catSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  disclaimer: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
  },
  successWrap: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  successSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
