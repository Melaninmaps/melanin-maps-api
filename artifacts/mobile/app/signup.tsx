import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useState, useRef, useCallback } from "react";
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
import { useAuth, getApiBaseUrl } from "@/lib/auth";

const STEPS = ["Your info", "Your identity", "Final details"];

function PasswordStrength({ password }: { password: string }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const barColors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#16A34A"];
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  if (!password) return null;
  return (
    <View style={{ gap: 4, marginTop: 6 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              flex: 1, height: 4, borderRadius: 2,
              backgroundColor: i < score ? barColors[score - 1] : "#E5E7EB",
            }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 11, color: barColors[score - 1] ?? "#9CA3AF", fontFamily: "Inter_400Regular" }}>
        {labels[score - 1] ?? ""}
      </Text>
    </View>
  );
}

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const [usernameMsg, setUsernameMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsername = useCallback((val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(clean);
    setUsernameMsg("");
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    if (clean.length < 3) { setUsernameStatus("idle"); return; }
    if (clean.length > 30) { setUsernameStatus("error"); setUsernameMsg("Max 30 characters"); return; }
    setUsernameStatus("checking");
    checkTimeout.current = setTimeout(async () => {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/auth/check-username?username=${encodeURIComponent(clean)}`);
        const data = await res.json() as { available: boolean; error?: string };
        if (data.error) { setUsernameStatus("error"); setUsernameMsg(data.error); }
        else { setUsernameStatus(data.available ? "available" : "taken"); }
      } catch { setUsernameStatus("idle"); }
    }, 500);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!firstName.trim()) { setError("First name is required."); return false; }
      if (!lastName.trim()) { setError("Last name is required."); return false; }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      if (!email.trim() || !emailOk) { setError("Please enter a valid email address."); return false; }
    }
    if (step === 1) {
      if (username.length < 3) { setError("Username must be at least 3 characters."); return false; }
      if (usernameStatus === "taken") { setError("That username is already taken. Choose another."); return false; }
      if (usernameStatus === "checking") { setError("Still checking username availability…"); return false; }
      if (usernameStatus === "error") { setError(usernameMsg || "Invalid username."); return false; }
      if (password.length < 8) { setError("Password must be at least 8 characters."); return false; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return false; }
    }
    if (step === 2) {
      if (!agreeToTerms) { setError("You must agree to the Terms of Service to continue."); return false; }
      const hasPartialDob = dobMonth || dobDay || dobYear;
      if (hasPartialDob) {
        const m = parseInt(dobMonth), d = parseInt(dobDay), y = parseInt(dobYear);
        const valid = m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= new Date().getFullYear();
        if (!valid) { setError("Please enter a valid date of birth."); return false; }
        const age = (Date.now() - new Date(y, m - 1, d).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (age < 13) { setError("You must be at least 13 years old to sign up."); return false; }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError("");
    if (step > 0) setStep((s) => s - 1);
    else router.canGoBack() ? router.back() : router.replace("/login");
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError("");

    let dateOfBirth: string | undefined;
    if (dobMonth && dobDay && dobYear) {
      const m = parseInt(dobMonth), d = parseInt(dobDay), y = parseInt(dobYear);
      dateOfBirth = new Date(y, m - 1, d).toISOString();
    }

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          username,
          dateOfBirth,
          agreeToTerms,
        }),
      });
      const data = await res.json() as { token?: string; error?: string };

      if (!res.ok || !data.token) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      await SecureStore.setItemAsync("auth_session_token", data.token);
      await SecureStore.setItemAsync("@melanin_maps_fresh_login", "1");
      await refreshUser();
      router.replace("/onboarding");
    } catch {
      setError("Could not connect. Please check your internet connection.");
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
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: bottomPad + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.back} onPress={handleBack}>
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} contentFit="contain" />
          <Text style={[styles.title, { color: c.foreground }]}>
            {step === 0 ? "Create your account" : step === 1 ? "Choose your identity" : "Almost done"}
          </Text>
          <Text style={[styles.sub, { color: c.mutedForeground }]}>
            {step === 0
              ? "Join thousands discovering Black-owned businesses"
              : step === 1
              ? "Your @handle is your public identity on the platform"
              : "Just a couple final details before you're in"}
          </Text>
        </View>

        <View style={styles.progressRow}>
          {STEPS.map((label, i) => (
            <View key={i} style={styles.progressItem}>
              <View style={[styles.progressDot, { backgroundColor: i <= step ? c.primary : c.border }]} />
              <Text style={[styles.progressLabel, { color: i <= step ? c.primary : c.mutedForeground }]}>{label}</Text>
            </View>
          ))}
        </View>

        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        )}

        {step === 0 && (
          <View style={styles.fields}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: c.foreground }]}>First Name</Text>
                <TextInput
                  style={[styles.input, { color: c.foreground, borderColor: c.border, backgroundColor: c.card }]}
                  placeholder="Teianna"
                  placeholderTextColor={c.mutedForeground}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: c.foreground }]}>Last Name</Text>
                <TextInput
                  style={[styles.input, { color: c.foreground, borderColor: c.border, backgroundColor: c.card }]}
                  placeholder="Smith"
                  placeholderTextColor={c.mutedForeground}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View>
              <Text style={[styles.label, { color: c.foreground }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { color: c.foreground, borderColor: c.border, backgroundColor: c.card }]}
                placeholder="you@example.com"
                placeholderTextColor={c.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.fields}>
            <View>
              <Text style={[styles.label, { color: c.foreground }]}>Username (@handle)</Text>
              <View style={[styles.inputRow, {
                borderColor: usernameStatus === "available" ? "#22C55E"
                  : (usernameStatus === "taken" || usernameStatus === "error") ? "#EF4444"
                  : c.border,
                backgroundColor: c.card,
              }]}>
                <Text style={{ color: c.mutedForeground, fontSize: 16, fontFamily: "Inter_400Regular" }}>@</Text>
                <TextInput
                  style={[styles.inputFlat, { color: c.foreground }]}
                  placeholder="yourhandle"
                  placeholderTextColor={c.mutedForeground}
                  value={username}
                  onChangeText={checkUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {usernameStatus === "checking" && <ActivityIndicator size="small" color={c.mutedForeground} />}
                {usernameStatus === "available" && <Feather name="check-circle" size={16} color="#22C55E" />}
                {usernameStatus === "taken" && <Feather name="x-circle" size={16} color="#EF4444" />}
                {usernameStatus === "error" && <Feather name="alert-circle" size={16} color="#F97316" />}
              </View>
              {usernameStatus === "available" && (
                <Text style={{ color: "#22C55E", fontSize: 12, marginTop: 4, fontFamily: "Inter_400Regular" }}>@{username} is available!</Text>
              )}
              {(usernameStatus === "taken" || usernameStatus === "error") && !!usernameMsg && (
                <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 4, fontFamily: "Inter_400Regular" }}>{usernameMsg}</Text>
              )}
              <Text style={[styles.hint, { color: c.mutedForeground }]}>Letters, numbers, underscores. 3–30 characters.</Text>
            </View>

            <View>
              <Text style={[styles.label, { color: c.foreground }]}>Password</Text>
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.card }]}>
                <TextInput
                  style={[styles.inputFlat, { color: c.foreground }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={c.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={c.mutedForeground} />
                </TouchableOpacity>
              </View>
              <PasswordStrength password={password} />
            </View>

            <View>
              <Text style={[styles.label, { color: c.foreground }]}>Confirm Password</Text>
              <View style={[styles.inputRow, {
                borderColor: confirmPassword && confirmPassword !== password ? "#EF4444" : c.border,
                backgroundColor: c.card,
              }]}>
                <TextInput
                  style={[styles.inputFlat, { color: c.foreground }]}
                  placeholder="Repeat your password"
                  placeholderTextColor={c.mutedForeground}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}>
                  <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={c.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.fields}>
            <View>
              <Text style={[styles.label, { color: c.foreground }]}>Date of Birth <Text style={{ color: c.mutedForeground, fontFamily: "Inter_400Regular" }}>(optional)</Text></Text>
              <Text style={[styles.hint, { color: c.mutedForeground, marginBottom: 8 }]}>Used only to confirm you're 13+. Never shown publicly.</Text>
              <View style={styles.dobRow}>
                <TextInput
                  style={[styles.dobInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.card, flex: 1 }]}
                  placeholder="MM"
                  placeholderTextColor={c.mutedForeground}
                  value={dobMonth}
                  onChangeText={(v) => setDobMonth(v.replace(/\D/g, "").slice(0, 2))}
                  keyboardType="numeric"
                  maxLength={2}
                  textAlign="center"
                />
                <TextInput
                  style={[styles.dobInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.card, flex: 1 }]}
                  placeholder="DD"
                  placeholderTextColor={c.mutedForeground}
                  value={dobDay}
                  onChangeText={(v) => setDobDay(v.replace(/\D/g, "").slice(0, 2))}
                  keyboardType="numeric"
                  maxLength={2}
                  textAlign="center"
                />
                <TextInput
                  style={[styles.dobInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.card, flex: 2 }]}
                  placeholder="YYYY"
                  placeholderTextColor={c.mutedForeground}
                  value={dobYear}
                  onChangeText={(v) => setDobYear(v.replace(/\D/g, "").slice(0, 4))}
                  keyboardType="numeric"
                  maxLength={4}
                  textAlign="center"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.checkRow, {
                borderColor: agreeToTerms ? c.primary : c.border,
                backgroundColor: agreeToTerms ? c.primary + "12" : c.card,
              }]}
              onPress={() => {
                setAgreeToTerms((v) => !v);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, {
                borderColor: agreeToTerms ? c.primary : c.border,
                backgroundColor: agreeToTerms ? c.primary : "transparent",
              }]}>
                {agreeToTerms && <Feather name="check" size={11} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkTxt, { color: c.foreground }]}>
                I agree to the{" "}
                <Text style={{ color: c.primary }}>Terms of Service</Text>
                {" "}and{" "}
                <Text style={{ color: c.primary }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <View style={[styles.privacyCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Feather name="shield" size={16} color={c.primary} />
              <Text style={[styles.privacyTxt, { color: c.mutedForeground }]}>
                Your last name and date of birth are kept private by default. Only your first name and @handle are visible publicly.
              </Text>
            </View>
          </View>
        )}

        {step < 2 ? (
          <TouchableOpacity style={[styles.btn, { backgroundColor: c.primary }]} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.btnTxt}>Continue</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : (<><Text style={styles.btnTxt}>Create My Account</Text><Feather name="check" size={18} color="#FFFFFF" /></>)
            }
          </TouchableOpacity>
        )}

        <View style={styles.loginRow}>
          <Text style={[styles.loginTxt, { color: c.mutedForeground }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={[styles.loginLink, { color: c.primary }]}>Sign in</Text>
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
  header: { alignItems: "center", marginBottom: 20 },
  logo: { width: 64, height: 64, marginBottom: 14 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 6, textAlign: "center" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  progressRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 24 },
  progressItem: { alignItems: "center", gap: 4 },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  progressLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, marginBottom: 16 },
  errorTxt: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  fields: { gap: 18, marginBottom: 24 },
  nameRow: { flexDirection: "row", gap: 12 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  inputFlat: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16, marginTop: 4 },
  dobRow: { flexDirection: "row", gap: 10 },
  dobInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkTxt: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  privacyCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  privacyTxt: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 14, marginBottom: 20 },
  btnTxt: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  loginRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  loginTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
  loginLink: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
