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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const pwLen = password.length;
  const strength = pwLen === 0 ? 0 : pwLen < 6 ? 1 : pwLen < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];
  const strengthColor = ["", colors.destructive, "#D4873A", colors.success][strength];

  const valid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.includes("@") &&
    password.length >= 8 &&
    agreed;

  const handleSignup = async () => {
    if (!valid) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    router.push("/verify-phone");
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
          <Text style={[styles.title, { color: colors.foreground }]}>Create your account</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Join 3,000+ community members mapping Black excellence
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.nameRow}>
            {(["First", "Last"] as const).map((which) => (
              <View key={which} style={[styles.field, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.foreground }]}>{which} Name</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder={which === "First" ? "Amara" : "Johnson"}
                    placeholderTextColor={colors.mutedForeground}
                    value={which === "First" ? firstName : lastName}
                    onChangeText={which === "First" ? setFirstName : setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            ))}
          </View>

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
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eye}>
                <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            {pwLen > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.bars}>
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[styles.bar, { backgroundColor: i <= strength ? strengthColor : colors.border }]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthTxt, { color: strengthColor }]}>{strengthLabel}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.75}>
            <View
              style={[
                styles.checkbox,
                { backgroundColor: agreed ? colors.primary : "transparent", borderColor: agreed ? colors.primary : colors.border },
              ]}
            >
              {agreed && <Feather name="check" size={12} color="#FFF" />}
            </View>
            <Text style={[styles.termsTxt, { color: colors.mutedForeground }]}>
              I agree to the{" "}
              <Text style={{ color: colors.primary }}>Terms of Service</Text>
              {" "}and{" "}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: valid ? colors.primary : colors.muted }]}
            onPress={handleSignup}
            disabled={!valid || loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnTxt, { color: valid ? colors.primaryForeground : colors.mutedForeground }]}>
              {loading ? "Creating account…" : "Create Account"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divRow}>
            <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.divTxt, { color: colors.mutedForeground }]}>or</Text>
            <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Text style={styles.socialIcon}>🌐</Text>
            <Text style={[styles.socialLabel, { color: colors.foreground }]}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginRow}>
          <Text style={[styles.loginTxt, { color: colors.mutedForeground }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Sign in</Text>
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
  logo: { width: 70, height: 70, marginBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  form: { gap: 16, marginBottom: 24 },
  nameRow: { flexDirection: "row", gap: 12 },
  field: { gap: 7 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  inputRow: {
    flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 14, height: 50,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  eye: { padding: 4 },
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  bars: { flexDirection: "row", gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  strengthTxt: { fontSize: 12, fontFamily: "Inter_500Medium", minWidth: 38 },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  termsTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  btn: { alignItems: "center", justifyContent: "center", paddingVertical: 17, borderRadius: 14 },
  btnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  divRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divLine: { flex: 1, height: 1 },
  divTxt: { fontSize: 13, fontFamily: "Inter_400Regular" },
  socialBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  socialIcon: { fontSize: 18 },
  socialLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  loginRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  loginTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
  loginLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
