import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
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

type Step = "phone" | "otp" | "signup";

export default function PhoneLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const c = colors;

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [isExisting, setIsExisting] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");

  const base = getApiBaseUrl();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const sendOtp = async (phoneVal: string) => {
    setError("");
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`${base}/api/auth/phone/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneVal }),
      });
      const data = await res.json() as { success?: boolean; phone?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to send code."); return; }

      setNormalizedPhone(data.phone ?? phoneVal);
      setResendCooldown(60);

      // Check if existing user
      const checkRes = await fetch(`${base}/api/auth/phone/check?phone=${encodeURIComponent(phoneVal)}`);
      const checkData = await checkRes.json() as { exists?: boolean };
      setIsExisting(checkData.exists ?? false);

      setStep("otp");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async () => {
    const trimmed = phone.trim();
    if (!trimmed) { setError("Please enter your phone number."); return; }
    await sendOtp(trimmed);
  };

  const handleOtpChange = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!digit && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 6) {
      setOtp(digits);
      otpRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter all 6 digits."); return; }
    setError("");

    if (!isExisting) {
      setStep("signup");
      return;
    }

    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`${base}/api/auth/phone/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, code }),
      });
      const data = await res.json() as { token?: string; error?: string; profileSetupComplete?: boolean };
      if (!res.ok || !data.token) { setError(data.error ?? "Verification failed."); return; }
      if (Platform.OS !== "web") await SecureStore.setItemAsync("auth_session_token", data.token);
      await refreshUser();
      if (data.profileSetupComplete === false) {
        router.replace("/profile-setup" as any);
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async () => {
    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!username.trim()) { setError("Username is required."); return; }
    if (!agreed) { setError("Please agree to the Terms of Service."); return; }
    setError("");
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const code = otp.join("");
      const res = await fetch(`${base}/api/auth/phone/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          code,
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          username: username.trim(),
          agreeToTerms: agreed,
        }),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (!res.ok || !data.token) { setError(data.error ?? "Account creation failed."); return; }
      if (Platform.OS !== "web") await SecureStore.setItemAsync("auth_session_token", data.token);
      await refreshUser();
      router.replace("/profile-setup" as any);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          onPress={() => {
            if (step === "otp" || step === "signup") { setStep("phone"); setOtp(["","","","","",""]); setError(""); }
            else router.canGoBack() ? router.back() : router.replace("/login");
          }}
          activeOpacity={0.85}
        >
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: c.primary + "15", borderColor: c.primary + "30" }]}>
            <Feather name="smartphone" size={28} color={c.primary} />
          </View>
          <Text style={[styles.title, { color: c.foreground }]}>
            {step === "phone" ? "Sign in with phone" : step === "otp" ? "Enter your code" : "Create your account"}
          </Text>
          <Text style={[styles.sub, { color: c.mutedForeground }]}>
            {step === "phone"
              ? "We'll send you a 6-digit code to verify your number"
              : step === "otp"
              ? `Code sent to ${normalizedPhone}`
              : "Just a few more details to get started"}
          </Text>
        </View>

        {/* Error */}
        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="alert-circle" size={14} color="#DC2626" style={{ marginTop: 1 }} />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        )}

        {/* ── STEP 1: Phone entry ── */}
        {step === "phone" && (
          <View style={styles.form}>
            <Text style={[styles.label, { color: c.foreground }]}>Phone Number</Text>
            <View style={[styles.phoneRow, { borderColor: c.border, backgroundColor: c.card }]}>
              <Text style={[styles.flagPrefix, { color: c.mutedForeground }]}>🇺🇸 +1</Text>
              <TextInput
                style={[styles.phoneInput, { color: c.foreground }]}
                placeholder="(555) 000-0000"
                placeholderTextColor={c.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handlePhoneSubmit}
              />
            </View>
            <Text style={[styles.hint, { color: c.mutedForeground }]}>
              International? Include your country code (e.g. +44 7911 123456)
            </Text>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handlePhoneSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <><Feather name="send" size={18} color="#FFF" /><Text style={styles.primaryBtnTxt}>Send Code</Text></>}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <Text style={[styles.dividerTxt, { color: c.mutedForeground }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: c.border }]}
              onPress={() => router.replace("/login")}
              activeOpacity={0.85}
            >
              <Feather name="mail" size={18} color={c.foreground} />
              <Text style={[styles.secondaryBtnTxt, { color: c.foreground }]}>Sign in with email instead</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2: OTP entry ── */}
        {step === "otp" && (
          <View style={styles.form}>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { otpRefs.current[i] = r; }}
                  style={[
                    styles.otpBox,
                    {
                      borderColor: digit ? c.primary : c.border,
                      backgroundColor: c.card,
                      color: c.foreground,
                    },
                  ]}
                  value={digit}
                  onChangeText={(v) => {
                    if (v.length > 1) { handleOtpPaste(v); return; }
                    handleOtpChange(v, i);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  autoFocus={i === 0}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleOtpSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <><Feather name="check-circle" size={18} color="#FFF" /><Text style={styles.primaryBtnTxt}>Verify Code</Text></>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendBtn, { opacity: resendCooldown > 0 ? 0.4 : 1 }]}
              onPress={() => resendCooldown === 0 && sendOtp(phone)}
              disabled={resendCooldown > 0 || loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.resendTxt, { color: c.primary }]}>
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 3: New user sign-up fields ── */}
        {step === "signup" && (
          <View style={styles.form}>
            <Text style={[styles.label, { color: c.foreground }]}>First Name *</Text>
            <TextInput
              style={[styles.input, { borderColor: c.border, backgroundColor: c.card, color: c.foreground }]}
              placeholder="Your first name"
              placeholderTextColor={c.mutedForeground}
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
              autoCapitalize="words"
            />

            <Text style={[styles.label, { color: c.foreground }]}>Last Name</Text>
            <TextInput
              style={[styles.input, { borderColor: c.border, backgroundColor: c.card, color: c.foreground }]}
              placeholder="Optional"
              placeholderTextColor={c.mutedForeground}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />

            <Text style={[styles.label, { color: c.foreground }]}>Username *</Text>
            <TextInput
              style={[styles.input, { borderColor: c.border, backgroundColor: c.card, color: c.foreground }]}
              placeholder="yourhandle"
              placeholderTextColor={c.mutedForeground}
              value={username}
              onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={styles.agreeRow}
              onPress={() => setAgreed((v) => !v)}
              activeOpacity={0.85}
            >
              <View style={[
                styles.checkbox,
                { borderColor: agreed ? c.primary : c.border, backgroundColor: agreed ? c.primary : "transparent" },
              ]}>
                {agreed && <Feather name="check" size={12} color="#FFF" />}
              </View>
              <Text style={[styles.agreeTxt, { color: c.mutedForeground }]}>
                I agree to the{" "}
                <Text style={{ color: c.primary }}>Terms of Service</Text>
                {" "}and{" "}
                <Text style={{ color: c.primary }}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleSignupSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <><Feather name="user-plus" size={18} color="#FFF" /><Text style={styles.primaryBtnTxt}>Create Account</Text></>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.note, { color: c.mutedForeground }]}>
          Standard SMS rates may apply. Verification texts are sent via Twilio.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  back: { marginBottom: 8, width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 28 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 16,
  },
  errorTxt: { color: "#DC2626", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  form: { gap: 14 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: -6 },
  phoneRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, gap: 10,
  },
  flagPrefix: { fontSize: 15, fontFamily: "Inter_500Medium" },
  phoneInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -8 },
  input: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 18, borderRadius: 14, marginTop: 4,
    shadowColor: "#CA922B", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  primaryBtnTxt: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divider: { flex: 1, height: 1 },
  dividerTxt: { fontSize: 12, fontFamily: "Inter_400Regular" },
  secondaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1,
  },
  secondaryBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center", marginVertical: 8 },
  otpBox: {
    width: 48, height: 56, borderWidth: 1.5, borderRadius: 12,
    fontSize: 22, fontFamily: "Inter_700Bold",
  },
  resendBtn: { alignItems: "center", paddingVertical: 8 },
  resendTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0,
  },
  agreeTxt: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  note: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16, marginTop: 24 },
});
