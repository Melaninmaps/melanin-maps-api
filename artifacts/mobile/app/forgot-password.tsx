import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const valid = email.includes("@") && email.includes(".");

  const handleSend = async () => {
    if (!valid) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.inner, { paddingTop: topPad + 12, paddingBottom: bottomPad + 32 }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/login")}>
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
                No worries. Enter your email and we'll send you a link to reset your password.
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

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: valid ? colors.primary : colors.muted }]}
                onPress={handleSend}
                disabled={!valid || loading}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnTxt, { color: valid ? colors.primaryForeground : colors.mutedForeground }]}>
                  {loading ? "Sending…" : "Send Reset Link"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace("/login")}>
              <Feather name="arrow-left" size={14} color={colors.primary} />
              <Text style={[styles.backToLoginTxt, { color: colors.primary }]}>Back to Sign In</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successSection}>
            <View style={[styles.iconWrap, { backgroundColor: colors.success + "18" }]}>
              <Feather name="mail" size={40} color={colors.success} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Check your email</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              We sent a password reset link to{"\n"}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>{email}</Text>
            </Text>
            <View style={[styles.tipBox, { backgroundColor: colors.secondary }]}>
              <Feather name="info" size={15} color={colors.mutedForeground} />
              <Text style={[styles.tipTxt, { color: colors.mutedForeground }]}>
                Check your spam folder if you don't see it within a few minutes.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, marginTop: 8 }]}
              onPress={() => router.replace("/login")}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnTxt, { color: colors.primaryForeground }]}>Back to Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSent(false)} style={styles.retrySub}>
              <Text style={[styles.retryTxt, { color: colors.mutedForeground }]}>Didn't receive it? Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  back: { marginBottom: 8, width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  topSection: { alignItems: "center", marginTop: 24, marginBottom: 36 },
  successSection: { alignItems: "center", marginTop: 60, gap: 16 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 10, textAlign: "center" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24, color: "#8B7355" },
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
