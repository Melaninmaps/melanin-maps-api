import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
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
  { id: "not_black_owned", icon: "flag" as const, label: "Ownership Misrepresented", sub: "Ownership claim appears incorrect or false", triggersDispute: true },
  { id: "spam", icon: "trash-2" as const, label: "Fake / Fraudulent Listing", sub: "This business does not appear to exist", triggersDispute: true },
  { id: "inaccurate", icon: "alert-circle" as const, label: "Inaccurate Information", sub: "Hours, address, or details are wrong", triggersDispute: false },
  { id: "closed", icon: "x-circle" as const, label: "Business Closed", sub: "This location is no longer operating", triggersDispute: false },
  { id: "discrimination", icon: "shield-off" as const, label: "Discrimination Report", sub: "Experienced racial bias or discrimination", triggersDispute: false },
  { id: "safety", icon: "alert-triangle" as const, label: "Safety Concern", sub: "Unsafe environment or practices reported", triggersDispute: false },
  { id: "inappropriate", icon: "eye-off" as const, label: "Inappropriate Content", sub: "Content violates community guidelines", triggersDispute: false },
  { id: "other", icon: "more-horizontal" as const, label: "Other", sub: "Something else not listed above", triggersDispute: false },
];

const CATEGORY_TO_REASON: Record<string, string> = {
  not_black_owned: "fake",
  spam: "fake",
  inaccurate: "incorrect_info",
  closed: "incorrect_info",
  discrimination: "suspicious",
  safety: "suspicious",
  inappropriate: "inappropriate",
  other: "other",
};

interface Props {
  visible: boolean;
  businessName: string;
  businessId?: string;
  onClose: () => void;
  onFlagged?: () => void;
}

export function ReportContentModal({ visible, businessName, businessId, onClose, onFlagged }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setSelected(null);
    setDetails("");
    setSubmitted(false);
    setLoading(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
    return "";
  };

  const handleSubmit = async () => {
    if (!selected || loading) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    setError(null);

    try {
      const { getItemAsync } = await import("expo-secure-store");
      const token = Platform.OS !== "web" ? await getItemAsync("auth_session_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const category = REPORT_CATEGORIES.find((c) => c.id === selected);
      const reason = CATEGORY_TO_REASON[selected] ?? "other";

      if (category?.triggersDispute && businessId) {
        // Dispute route — increments flag count, auto-marks business under review at threshold
        const resp = await fetch(`${getBaseUrl()}/api/businesses/${businessId}/dispute`, {
          method: "POST",
          headers,
          body: JSON.stringify({ description: details.trim() || undefined }),
        });
        if (!resp.ok) {
          const json = await resp.json().catch(() => ({}));
          if (resp.status === 409) {
            setError("You've already flagged this business.");
          } else if (resp.status === 401) {
            setError("Sign in to flag a business.");
          } else {
            setError((json as any).error ?? "Failed to submit report.");
          }
          setLoading(false);
          return;
        }
        onFlagged?.();
      } else {
        // Generic content report for non-dispute categories
        const resp = await fetch(`${getBaseUrl()}/api/content-reports`, {
          method: "POST",
          headers,
          body: JSON.stringify({ targetType: "business", targetId: businessId, reason, description: details.trim() || undefined }),
        });
        if (!resp.ok) {
          const json = await resp.json().catch(() => ({}));
          if (resp.status === 401) {
            setError("Sign in to report a business.");
          } else {
            setError((json as any).error ?? "Failed to submit report.");
          }
          setLoading(false);
          return;
        }
      }

      setSubmitted(true);
      setTimeout(() => {
        reset();
        onClose();
      }, 2200);
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  };

  const selectedCategory = REPORT_CATEGORIES.find((c) => c.id === selected);

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
                {selectedCategory?.triggersDispute
                  ? "Your flag has been recorded. If enough community members flag this listing, it will be reviewed by our team."
                  : "Our team will review this within 24–48 hours. Thank you for keeping the community accurate."}
              </Text>
            </View>
          ) : (
            <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
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
                    setError(null);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.catIcon, { backgroundColor: selected === cat.id ? colors.primary + "18" : colors.secondary }]}>
                    <Feather name={cat.icon} size={16} color={selected === cat.id ? colors.primary : colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catLabel, { color: colors.foreground }]}>{cat.label}</Text>
                    <Text style={[styles.catSub, { color: colors.mutedForeground }]}>{cat.sub}</Text>
                    {cat.triggersDispute && (
                      <View style={styles.disputePill}>
                        <Feather name="users" size={9} color="#B45309" />
                        <Text style={styles.disputePillText}>Community Dispute</Text>
                      </View>
                    )}
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

              {error && (
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={13} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: selected && !loading ? "#DC2626" : colors.muted }]}
                onPress={handleSubmit}
                disabled={!selected || loading}
                activeOpacity={0.85}
              >
                <Feather name="flag" size={16} color="#FFFFFF" />
                <Text style={styles.submitText}>{loading ? "Submitting..." : "Submit Report"}</Text>
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
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
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
  disputePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  disputePillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "#B45309",
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
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#B91C1C",
    flex: 1,
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
