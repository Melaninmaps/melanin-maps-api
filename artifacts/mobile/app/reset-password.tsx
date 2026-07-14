import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBaseUrl } from "@/lib/auth";

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email: emailParam, code: codeParam } = useLocalSearchParams<{ email?: string; code?: string }>();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const email = emailParam ?? "";
  const code = codeParam ?? "";
  const valid = newPw.length >= 8 && newPw === confirmPw;

  if (!email || !code) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad + 12 }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.replace("/forgot-password")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Feather name="alert-circle" size={40} color="#DC2626" />
          <Text style={[styles.title, { color: colors.foreground, marginTop: 16 }]}>Invalid reset link</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            This link is missing required information. Please request a new password reset.
          </Text>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.btn, { backgroundColor: colors.primary, marginTop: 24 }]}
            onPress={() => router.replace("/forgot-password")}
          >
            <Text style={[styles.btnTxt, { color: colors.primaryForeground }]}>Request New Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleReset = async () => {
    Keyboard.dismiss();
    setError("");
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords don't match."); return; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: newPw }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Reset failed. The link may have expired — please request a new one.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        keyboardDismissMode="on-drag"
        style={styles.inner}
        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: bottomPad + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.replace("/login")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        {done ? (
          <View style={styles.center}>
            <View style={[styles.iconWrap, { backgroundColor: "#22C55E18" }]}>
              <Feather name="check-circle" size={40} color="#22C55E" />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Password updated!</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Your password has been reset. Sign in with your new password.
            </Text>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, marginTop: 24 }]}
              onPress={() => router.replace("/login")}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnTxt, { color: colors.primaryForeground }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.topSection}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="lock" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Set New Password</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                Resetting password for{" "}
                <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{email}</Text>
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>New Password</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.mutedForeground}
                    value={newPw}
                    onChangeText={setNewPw}
                    secureTextEntry={!showPw}
                    autoFocus
                  />
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setShowPw((v) => !v)} style={{ padding: 4 }}>
                    <Feather name={showPw ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Confirm Password</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Repeat your new password"
                    placeholderTextColor={colors.mutedForeground}
                    value={confirmPw}
                    onChangeText={setConfirmPw}
                    secureTextEntry={!showPw}
                  />
                </View>
              </View>

              {!!error && (
                <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
                  <Feather name="alert-circle" size={14} color="#DC2626" />
                  <Text style={styles.errorTxt}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: valid ? colors.primary : colors.muted }]}
                onPress={handleReset}
                disabled={!valid || loading}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnTxt, { color: valid ? colors.primaryForeground : colors.mutedForeground }]}>
                  {loading ? "Saving…" : "Set New Password"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} style={styles.backToLogin} onPress={() => router.replace("/forgot-password")}>
                <Text style={[styles.backToLoginTxt, { color: colors.mutedForeground }]}>
                  Link expired?{" "}
                  <Text style={{ color: colors.primary }}>Request a new one</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  back: { marginBottom: 24, alignSelf: "flex-start", padding: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  topSection: { alignItems: "center", marginBottom: 32 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 10 },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10 },
  errorTxt: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  btn: { height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  backToLogin: { alignItems: "center", paddingVertical: 8 },
  backToLoginTxt: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
