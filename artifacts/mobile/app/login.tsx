import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
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
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";
import { useAuth, getApiBaseUrl } from "@/lib/auth";
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

  const [emailMode, setEmailMode] = useState(true);
  const [emailVal, setEmailVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
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

  const handleAppleSignIn = async () => {
    if (Platform.OS !== "ios") return;
    setError("");
    setLoading(true);
    try {
      // Generate a cryptographic nonce for replay-attack prevention.
      // iOS 26+ requires the client to pre-hash the nonce with SHA-256
      // before passing it to signInAsync — Apple stores it as-is in the
      // identity token JWT. The server receives the rawNonce and
      // independently verifies SHA-256(rawNonce) === payload.nonce.
      const rawNonce = Array.from(
        await Crypto.getRandomBytesAsync(32)
      ).map(b => b.toString(16).padStart(2, "0")).join("");

      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) throw new Error("No identity token from Apple");
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/auth/apple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityToken: credential.identityToken,
          nonce: rawNonce,
          appleUserId: credential.user,
          email: credential.email ?? undefined,
          firstName: credential.fullName?.givenName ?? undefined,
          lastName: credential.fullName?.familyName ?? undefined,
        }),
      });
      const data = await res.json() as { token?: string; error?: string; profileSetupComplete?: boolean };
      if (!res.ok || !data.token) {
        setError(data.error ?? "Apple Sign-In failed. Please try again.");
        return;
      }
      await SecureStore.setItemAsync("auth_session_token", data.token);
      await refreshUser();
      router.replace(data.profileSetupComplete === false ? "/profile-setup" : "/(tabs)");
    } catch (err: unknown) {
      const appleErr = err as { code?: string };
      if (appleErr?.code !== "ERR_REQUEST_CANCELED") {
        setError("Apple Sign-In failed. Please try again.");
      }
    } finally {
      setLoading(false);
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
    Keyboard.dismiss();
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity activeOpacity={0.85}
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
            <Feather name="alert-circle" size={14} color="#DC2626" style={{ marginTop: 1 }} />
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.errorTxt}>{error}</Text>
              {error.toLowerCase().includes("apple") && Platform.OS === "ios" && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleAppleSignIn}
                  style={styles.errorAppleBtn}
                >
                  <Feather name="arrow-up" size={12} color="#DC2626" />
                  <Text style={styles.errorAppleTxt}>Tap "Continue with Apple" above to sign in</Text>
                </TouchableOpacity>
              )}
              {error.toLowerCase().includes("apple") && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/forgot-password" as any)}
                >
                  <Text style={[styles.errorAppleTxt, { color: "#B91C1C" }]}>Or use Forgot Password to set an email password →</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.googleBtn, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => router.push("/phone-login" as any)}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Feather name="smartphone" size={18} color={c.foreground} />
          <Text style={[styles.googleTxt, { color: c.foreground }]}>Continue with Phone</Text>
        </TouchableOpacity>

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
            {loading && !emailMode ? "Opening sign in…" : "Continue with SSO"}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.replitNote, { color: c.mutedForeground }]}>
          Single sign-on — use Email & Password below for direct access
        </Text>

        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={14}
            style={styles.appleBtn}
            onPress={handleAppleSignIn}
          />
        )}

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
                <TouchableOpacity activeOpacity={0.85} onPress={() => setShowPw((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}>
                  <Feather name={showPw ? "eye-off" : "eye"} size={18} color={c.mutedForeground} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={() => { Keyboard.dismiss(); router.push("/forgot-password" as any); }} style={styles.forgotRow}>
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

            <TouchableOpacity activeOpacity={0.85} onPress={() => { setEmailMode(false); setError(""); }}>
              <Text style={[styles.switchTxt, { color: c.mutedForeground }]}>← Back to sign-in options</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.note, { color: c.mutedForeground }]}>
          By signing in you agree to our Terms of Service and Privacy Policy.
        </Text>

        <View style={styles.signupRow}>
          <Text style={[styles.signupTxt, { color: c.mutedForeground }]}>New here? </Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.replace("/signup")}>
            <Text style={[styles.signupLink, { color: c.primary }]}>Create your free account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </TouchableWithoutFeedback>
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
  errorTxt: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular" },
  errorAppleBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  errorAppleTxt: { color: "#DC2626", fontSize: 12, fontFamily: "Inter_600SemiBold", textDecorationLine: "underline" },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12,
  },
  appleBtn: { width: "100%", height: 52, marginBottom: 12 },
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
  replitNote: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: -8, marginBottom: 4 },
});
