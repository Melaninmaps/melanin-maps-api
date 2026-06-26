import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import {
  getBiometricCapabilities,
  isBiometricsEnabled,
  hasStoredToken,
  authenticateWithBiometrics,
} from "@/hooks/useBiometrics";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    if ((Platform.OS as string) === "web") return;
    void (async () => {
      const [enabled, hasToken, { isSupported, label }] = await Promise.all([
        isBiometricsEnabled(),
        hasStoredToken(),
        getBiometricCapabilities(),
      ]);
      if (enabled && hasToken && isSupported) setBiometricLabel(label);
    })();
  }, []);

  const handleBiometricLogin = async () => {
    if (!biometricLabel) return;
    setBiometricLoading(true);
    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const ok = await authenticateWithBiometrics(biometricLabel);
      if (ok) {
        await refreshUser();
        router.replace("/(tabs)");
      } else {
        setError(`${biometricLabel} failed. Please sign in with your account.`);
      }
    } catch {
      setError("Biometric authentication failed. Please sign in below.");
    } finally {
      setBiometricLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const valid = email.includes("@") && password.length >= 6;

  const handleLogin = async () => {
    if (!valid) return;
    setError("");
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await login();
      router.replace("/(tabs)");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/onboarding")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} contentFit="contain" />
          <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Sign in to your Mapping With Melanin account
          </Text>
        </View>

        {biometricLabel && (
          <TouchableOpacity
            style={[styles.biometricBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}
            onPress={handleBiometricLogin}
            disabled={biometricLoading}
            activeOpacity={0.85}
          >
            <Feather
              name={biometricLabel === "Face ID" || biometricLabel === "Face Recognition" ? "aperture" : "lock"}
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.biometricTxt, { color: colors.primary }]}>
              {biometricLoading ? "Verifying…" : `Sign in with ${biometricLabel}`}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => login()}
            activeOpacity={0.8}
          >
            <Text style={styles.socialIcon}>🌐</Text>
            <Text style={[styles.socialLabel, { color: colors.foreground }]}>Google</Text>
          </TouchableOpacity>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: colors.foreground, borderColor: colors.foreground }]}
              onPress={() => login()}
              activeOpacity={0.8}
            >
              <Feather name="smartphone" size={18} color="#FFF" />
              <Text style={[styles.socialLabel, { color: "#FFF" }]}>Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divRow}>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.divTxt, { color: colors.mutedForeground }]}>or continue with email</Text>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="mail" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            </View>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eye}>
                <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
              <Feather name="alert-circle" size={15} color={colors.destructive} />
              <Text style={[styles.errorTxt, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: valid ? colors.primary : colors.muted }]}
            onPress={handleLogin}
            disabled={!valid || loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.loginTxt, { color: valid ? colors.primaryForeground : colors.mutedForeground }]}>
              {loading ? "Signing in…" : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupRow}>
          <Text style={[styles.signupTxt, { color: colors.mutedForeground }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/waitlist")}>
            <Text style={[styles.signupLink, { color: colors.primary }]}>Join waitlist</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  back: { marginBottom: 8, width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { width: 80, height: 80, marginBottom: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 8 },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  biometricBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  biometricTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  socialRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  socialBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  socialIcon: { fontSize: 18 },
  socialLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  divRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  divLine: { flex: 1, height: 1 },
  divTxt: { fontSize: 13, fontFamily: "Inter_400Regular" },
  form: { gap: 16, marginBottom: 28 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  forgotLink: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputRow: {
    flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  eye: { padding: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  errorTxt: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  loginBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 17, borderRadius: 14, marginTop: 4 },
  loginTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  signupRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  signupTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
  signupLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
