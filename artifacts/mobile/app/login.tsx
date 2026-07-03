import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
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
  const { login, loginWithEmail, refreshUser } = useAuth();

  const [emailMode, setEmailMode] = useState(false);
  const [emailVal, setEmailVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
      setError("Biometric authentication failed. Please try again.");
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await login();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    setError("");
    if (!emailVal.trim()) { setError("Please enter your email address."); return; }
    if (!passwordVal) { setError("Please enter your password."); return; }
    if ((Platform.OS as string) !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const result = await loginWithEmail(emailVal.trim(), passwordVal);
      if (result.error) {
        setError(result.error);
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const c = colors;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/onboarding")}
        >
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} contentFit="contain" />
          <Text style={[styles.title, { color: c.foreground }]}>Welcome back</Text>
          <Text style={[styles.sub, { color: c.mutedForeground }]}>
            Sign in to your Mapping With Melanin account
          </Text>
        </View>

        {biometricLabel && (
          <TouchableOpacity
            style={[styles.biometricBtn, { backgroundColor: c.primary + "12", borderColor: c.primary + "40" }]}
            onPress={handleBiometricLogin}
            disabled={biometricLoading}
            activeOpacity={0.85}
          >
            <Feather
              name={biometricLabel === "Face ID" || biometricLabel === "Face Recognition" ? "aperture" : "lock"}
              size={20}
              color={c.primary}
            />
            <Text style={[styles.biometricTxt, { color: c.primary }]}>
              {biometricLoading ? "Verifying…" : `Sign in with ${biometricLabel}`}
            </Text>
          </TouchableOpacity>
        )}

        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.googleBtn, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading && !emailMode ? (
            <ActivityIndicator size="small" color={c.foreground} />
          ) : (
            <Feather name="globe" size={18} color={c.foreground} />
          )}
          <Text style={[styles.googleTxt, { color: c.foreground }]}>
            {loading && !emailMode ? "Opening sign in…" : "Continue with Google"}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          <Text style={[styles.dividerTxt, { color: c.mutedForeground }]}>or sign in with email</Text>
          <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
        </View>

        {!emailMode ? (
          <TouchableOpacity
            style={[styles.emailToggle, { backgroundColor: c.card, borderColor: c.border }]}
            onPress={() => setEmailMode(true)}
            activeOpacity={0.85}
          >
            <Feather name="mail" size={18} color={c.foreground} />
            <Text style={[styles.googleTxt, { color: c.foreground }]}>Sign in with Email & Password</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emailForm}>
            <View>
              <Text style={[styles.fieldLabel, { color: c.foreground }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { color: c.foreground, borderColor: c.border, backgroundColor: c.card }]}
                placeholder="you@example.com"
                placeholderTextColor={c.mutedForeground}
                value={emailVal}
                onChangeText={setEmailVal}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: c.foreground }]}>Password</Text>
              <View style={[styles.pwRow, { borderColor: c.border, backgroundColor: c.card }]}>
                <TextInput
                  style={[styles.pwInput, { color: c.foreground }]}
                  placeholder="Your password"
                  placeholderTextColor={c.mutedForeground}
                  value={passwordVal}
                  onChangeText={setPasswordVal}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPw((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}>
                  <Feather name={showPw ? "eye-off" : "eye"} size={18} color={c.mutedForeground} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => router.push("/forgot-password" as any)} style={styles.forgotRow}>
                <Text style={[styles.forgotTxt, { color: c.primary }]}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signInBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleEmailSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading && emailMode
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : (<><Feather name="log-in" size={18} color="#FFFFFF" /><Text style={styles.signInTxt}>Sign In</Text></>)
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setEmailMode(false); setError(""); }}>
              <Text style={[styles.switchTxt, { color: c.mutedForeground }]}>← Back to sign-in options</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.note, { color: c.mutedForeground }]}>
          By signing in you agree to our Terms of Service and Privacy Policy.
        </Text>

        <View style={styles.signupRow}>
          <Text style={[styles.signupTxt, { color: c.mutedForeground }]}>New here? </Text>
          <TouchableOpacity onPress={() => router.replace("/signup")}>
            <Text style={[styles.signupLink, { color: c.primary }]}>Create your free account</Text>
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
  header: { alignItems: "center", marginBottom: 24 },
  logo: { width: 80, height: 80, marginBottom: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 8 },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  biometricBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16,
  },
  biometricTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, marginBottom: 16 },
  errorTxt: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12,
  },
  googleTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerTxt: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emailToggle: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginBottom: 24,
  },
  emailForm: { gap: 14, marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  pwRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  pwInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  forgotRow: { alignItems: "flex-end", marginTop: 6 },
  forgotTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  signInBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 18, borderRadius: 14, marginTop: 4,
    shadowColor: "#CA922B", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  signInTxt: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  switchTxt: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },
  note: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18, marginBottom: 20 },
  signupRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  signupTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
  signupLink: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
