import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const REASONS = [
  { value: "suspicious", label: "Suspicious behavior" },
  { value: "spam", label: "Spam or misleading" },
  { value: "fake", label: "Fake or inaccurate info" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "harassment", label: "Harassment or hate speech" },
  { value: "incorrect_info", label: "Incorrect business info" },
  { value: "other", label: "Other" },
] as const;

type Reason = (typeof REASONS)[number]["value"];

type Props = {
  targetType: "review" | "survey" | "business" | "post" | "user";
  targetId: string;
  targetName?: string;
  iconSize?: number;
  iconColor?: string;
};

export function ReportButton({ targetType, targetId, targetName, iconSize = 16, iconColor }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setReason(null);
    setDescription("");
    setDone(false);
    setError("");
  }

  async function submit() {
    if (!reason) return;
    setLoading(true);
    setError("");
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (!token) {
        setError("You must be signed in to report content.");
        setLoading(false);
        return;
      }
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/content-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetType, targetId, reason, description: description.trim() || undefined }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to submit. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 400);
  }

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} hitSlop={10} activeOpacity={0.6}>
        <Feather name="flag" size={iconSize} color={iconColor ?? colors.mutedForeground} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {done ? (
            <View style={styles.doneWrap}>
              <View style={[styles.doneIcon, { backgroundColor: "#CA922B20" }]}>
                <Feather name="check-circle" size={32} color="#CA922B" />
              </View>
              <Text style={[styles.doneTitle, { color: colors.text }]}>Report Submitted</Text>
              <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
                Our moderation team will review this{targetName ? ` for "${targetName}"` : ""}. Thank you for helping keep the community safe.
              </Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: "#CA922B" }]} onPress={close}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>
                Report{targetName ? ` "${targetName}"` : " Content"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Select the reason that best describes the issue.
              </Text>

              <View style={styles.reasons}>
                {REASONS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.reasonRow,
                      {
                        backgroundColor: reason === r.value ? "#CA922B15" : colors.background,
                        borderColor: reason === r.value ? "#CA922B" : colors.border,
                      },
                    ]}
                    onPress={() => setReason(r.value)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: reason === r.value ? "#CA922B" : colors.border,
                          backgroundColor: reason === r.value ? "#CA922B" : "transparent",
                        },
                      ]}
                    />
                    <Text style={[styles.reasonLabel, { color: colors.text }]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {reason && (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Add details (optional)..."
                  placeholderTextColor={colors.mutedForeground}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              )}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.submitBtn, { opacity: !reason || loading ? 0.5 : 1 }]}
                onPress={submit}
                disabled={!reason || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit Report</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={close}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  reasons: {
    gap: 8,
    marginBottom: 14,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#CA922B",
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginBottom: 10,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
  },
  doneWrap: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  doneIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  doneSub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  closeBtn: {
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
