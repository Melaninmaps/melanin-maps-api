import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

const PERKS = [
  { icon: "map-pin", text: "Discover minority-owned businesses near you" },
  { icon: "shield", text: "Community-powered safety ratings" },
  { icon: "users", text: "Connect with the community" },
  { icon: "star", text: "Save favorites & write reviews" },
];

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSignup = async () => {
    setError("");
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await login();
      router.replace("/(tabs)");
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
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {/* Header */}
        <Text style={[styles.heading, { color: colors.text }]}>Create your account</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
          Join thousands celebrating and supporting Black culture and community.
        </Text>

        {/* Perks */}
        <View style={[styles.perksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {PERKS.map((p, i) => (
            <View key={i} style={styles.perkRow}>
              <View style={[styles.perkIcon, { backgroundColor: "#CA922B18" }]}>
                <Feather name={p.icon as any} size={16} color="#CA922B" />
              </View>
              <Text style={[styles.perkText, { color: colors.text }]}>{p.text}</Text>
            </View>
          ))}
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.btn, { opacity: loading ? 0.6 : 1 }]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{loading ? "Opening sign up…" : "Get Started — It's Free"}</Text>
        </TouchableOpacity>

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          By continuing you agree to our Terms of Service and Privacy Policy.{"\n"}
          Already have an account?{" "}
          <Text
            style={{ color: "#CA922B", fontWeight: "700" }}
            onPress={() => router.replace("/login")}
          >
            Sign in
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  back: { marginBottom: 24, width: 40 },
  logoWrap: { alignItems: "center", marginBottom: 24 },
  logo: { width: 80, height: 80 },
  heading: {
    fontSize: 30,
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subheading: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  perksCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    marginBottom: 24,
  },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  perkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#DC2626", fontSize: 13, flex: 1 },
  btn: {
    backgroundColor: "#CA922B",
    borderRadius: 100,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#CA922B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
  note: { fontSize: 12, textAlign: "center", lineHeight: 18 },
});
