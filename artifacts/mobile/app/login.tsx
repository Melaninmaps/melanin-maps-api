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

const BENEFITS = [
  { icon: "map-pin" as const, text: "Discover Black-owned businesses near you" },
  { icon: "shield" as const, text: "Community-powered safety ratings" },
  { icon: "users" as const, text: "Connect with a global community" },
  { icon: "star" as const, text: "Save favorites, leave reviews, earn points" },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, refreshUser } = useAuth();

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

  const handleSignIn = async () => {
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
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/onboarding")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Sign in to your Mapping With Melanin account
          </Text>
        </View>

        {biometricLabel ? (
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
        ) : null}

        <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: "#CA922B18" }]}>
                <Feather name={b.icon} size={15} color="#CA922B" />
              </View>
              <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="alert-circle" size={15} color="#DC2626" />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.signInBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Feather name="log-in" size={18} color="#FFFFFF" />
          <Text style={styles.signInTxt}>
            {loading ? "Opening sign in…" : "Sign In"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          By signing in you agree to our Terms of Service and Privacy Policy.
        </Text>

        <View style={styles.signupRow}>
          <Text style={[styles.signupTxt, { color: colors.mutedForeground }]}>New here? </Text>
          <TouchableOpacity onPress={() => router.replace("/signup")}>
            <Text style={[styles.signupLink, { color: colors.primary }]}>Create your free account</Text>
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
  header: { alignItems: "center", marginBottom: 28 },
  logo: { width: 80, height: 80, marginBottom: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 8 },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  biometricBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16,
  },
  biometricTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  benefitsCard: {
    borderRadius: 16, borderWidth: 1, padding: 18, gap: 12, marginBottom: 24,
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  benefitIcon: {
    width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  benefitText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 16,
  },
  errorTxt: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  signInBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 18, borderRadius: 14, marginBottom: 16,
    shadowColor: "#CA922B", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  signInTxt: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  note: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18, marginBottom: 20 },
  signupRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  signupTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
  signupLink: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
