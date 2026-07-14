import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const valid = email.includes("@") && email.includes(".");

  const [codeVal, setCodeVal] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [codeStep, setCodeStep] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const handleSend = async () => {
    if (!valid) return;
    Keyboard.dismiss();
    setResetError("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setResetError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
      setCodeStep(true);
    } catch {
      setResetError("Could not connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    Keyboard.dismiss();
    setResetError("");
    if (codeVal.trim().length !== 6) { setResetError("Please enter the 6-digit code from your email."); return; }
    if (newPw.length < 8) { setResetError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setResetError("Passwords don't match."); return; }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: codeVal.trim(), newPassword: newPw }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setResetError(data.error ?? "Reset failed. Please try again.");
        return;
      }
      setResetDone(true);
    } catch {
      setResetError("Could not connect. Please check your internet connection.");
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
        style={styles.inner}
        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: bottomPad + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/login")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        {!sent ? (
          <>
            <View style={styles.topSection}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="lock" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Forgot Password?</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                No worries. Enter your email and we'll send you a 6-digit reset code.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="mail" size={18} color={colors.mutedForeground} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.mutedForeground}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                </View>
              </View>

              {!!resetError && (
                <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
                  <Feather name="alert-circle" size={14} color="#DC2626" />
                  <Text style={styles.errorTxt}>{resetError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: valid ? colors.primary : colors.muted }]}
                onPress={handleSend}
                disabled={!valid || loading}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnTxt, { color: valid ? colors.primaryForeground : colors.mutedForeground }]}>
                  {loading ? "Sending…" : "Send Reset Code"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.85} style={styles.backToLogin} onPress={() => router.replace("/login")}>
              <Feather name="arrow-left" size={14} color={colors.primary} />
              <Text style={[styles.backToLoginTxt, { color: colors.primary }]}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : resetDone ? (
          <View style={styles.successSection}>
            <View style={[styles.iconWrap, { backgroundColor: (colors.success ?? "#22C55E") + "18" }]}>
              <Feather name="check-circle" size={40} color={colors.success ?? "#22C55E"} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Password updated!</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Your password has been reset. Sign in with your new password.
            </Text>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, marginTop: 8 }]}
              onPress={() => router.replace("/login")}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnTxt, { color: colors.primaryForeground }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.codeSection}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="mail" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Check your email</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              We sent a 6-digit code to{" "}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>{email}</Text>
            </Text>

            <View style={[styles.tipBox, { backgroundColor: colors.secondary, marginBottom: 20 }]}>
              <Feather name="info" size={15} color={colors.mutedForeground} />
              <Text style={[styles.tipTxt, { color: colors.mutedForeground }]}>
                Check your spam folder if you don't see it. Codes expire after 15 minutes.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Reset Code</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="hash" size={18} color={colors.mutedForeground} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground, letterSpacing: 8, fontSize: 22, fontFamily: "Inter_700Bold" }]}
                    placeholder="123456"
                    placeholderTextColor={colors.mutedForeground}
                    value={codeVal}
                    onChangeText={(t) => setCodeVal(t.replace(/\D/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    autoFocus
                    maxLength={6}
                  />
                </View>
              </View>

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
                    autoCapitalize="none"
                  />
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setShowPw(!showPw)}>
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
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {!!resetError && (
                <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
                  <Feather name="alert-circle" size={14} color="#DC2626" />
                  <Text style={styles.errorTxt}>{resetError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnTxt, { color: colors.primaryForeground }]}>
                  {loading ? "Resetting…" : "Reset Password"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={() => { setSent(false); setCodeStep(false); setResetError(""); }} style={styles.retrySub}>
              <Text style={[styles.retryTxt, { color: colors.mutedForeground }]}>Didn't receive it? Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  back: { marginBottom: 8, width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  topSection: { alignItems: "center", marginTop: 24, marginBottom: 36 },
  codeSection: { alignItems: "center", gap: 12 },
  successSection: { alignItems: "center", marginTop: 60, gap: 16 },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10 },
  errorTxt: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 10, textAlign: "center" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24, color: "#A87A40" },
  form: { gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  inputRow: {
    flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  btn: { alignItems: "center", justifyContent: "center", paddingVertical: 17, borderRadius: 14, alignSelf: "stretch" },
  btnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  backToLogin: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 24 },
  backToLoginTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, alignSelf: "stretch" },
  tipTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  retrySub: { paddingVertical: 4 },
  retryTxt: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
