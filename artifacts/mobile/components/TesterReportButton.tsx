/**
 * TesterReportButton — floating "Report an Issue" button for tester-role users.
 *
 * Only visible to users with role === 'tester'. Shows a small bug icon in the
 * bottom-left corner. Tapping it opens a modal where they describe the issue.
 * Auto-captures: current page (pathname), user ID, timestamp, and device info.
 * POSTs to /api/tester-report which stores to DB and emails the founder directly.
 */
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/lib/auth";
import { useColors } from "@/hooks/useColors";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export function TesterReportButton() {
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const base = getApiBase();
      const r = await fetch(`${base}/api/tester-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: message.trim(),
          page: pathname,
          action: action.trim(),
        }),
      });
      if (!r.ok) throw new Error("Server error");
      setDone(true);
      setMessage("");
      setAction("");
      setTimeout(() => {
        setDone(false);
        setOpen(false);
      }, 2000);
    } catch {
      // keep modal open so they can retry
    } finally {
      setSubmitting(false);
    }
  }, [message, action, pathname, submitting]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    setOpen(false);
    setMessage("");
    setAction("");
    setDone(false);
  }, [submitting]);

  // Only render for tester-role users
  if (!user || user.role !== "tester") return null;

  return (
    <>
      {/* Floating bug icon — bottom-left, above tab bar */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 80,
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.foreground,
          },
        ]}
        accessibilityLabel="Report an issue"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>🐛</Text>
      </TouchableOpacity>

      {/* Report modal */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.backdrop} onPress={handleClose} />
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <Text style={[styles.title, { color: colors.foreground }]}>Report an Issue</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Goes directly to the founder. Your user ID and this page ({pathname}) are included automatically.
            </Text>

            {done ? (
              <View style={styles.doneContainer}>
                <Text style={styles.doneEmoji}>✅</Text>
                <Text style={[styles.doneText, { color: colors.foreground }]}>Report sent to founder</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="What happened? Be as specific as possible."
                  placeholderTextColor={colors.mutedForeground}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={3000}
                  autoFocus
                />
                <TextInput
                  style={[styles.actionInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="What were you trying to do? (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={action}
                  onChangeText={setAction}
                  maxLength={500}
                />

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!message.trim() || submitting}
                  activeOpacity={0.85}
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: message.trim() && !submitting ? "#CA922B" : colors.border,
                    },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitText}>Send to Founder</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },
  fabIcon: { fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    minHeight: 340,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 17, marginBottom: 6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginBottom: 16 },
  input: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20,
    minHeight: 100, marginBottom: 10,
  },
  actionInput: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    fontFamily: "Inter_400Regular", fontSize: 14,
    marginBottom: 16,
  },
  submitBtn: {
    height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  submitText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  doneContainer: { alignItems: "center", paddingVertical: 40, gap: 12 },
  doneEmoji: { fontSize: 40 },
  doneText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
