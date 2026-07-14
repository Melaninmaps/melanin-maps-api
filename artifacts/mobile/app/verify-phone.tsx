import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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

const CODE_LENGTH = 6;

export default function VerifyPhoneScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone?: string }>();

  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = () => {
    if (!canResend) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setCode("");
    setCountdown(60);
    setCanResend(false);
  };

  const handleChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleVerify(digits);
    }
  };

  const handleVerify = async (c = code) => {
    if (c.length !== CODE_LENGTH) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setVerified(true);
    await new Promise((r) => setTimeout(r, 800));
    router.replace("/(tabs)");
  };

  const digits = code.split("").concat(Array(CODE_LENGTH - code.length).fill(""));

  if (verified) {
    return (
      <View style={[styles.root, styles.successRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.successIcon, { backgroundColor: colors.success + "18" }]}>
          <Feather name="check-circle" size={48} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Verified!</Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Welcome to Mapping With Melanin™</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.inner, { paddingTop: topPad + 20, paddingBottom: bottomPad + 32 }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/signup")}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.topSection}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="smartphone" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Check your phone</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            We sent a 6-digit verification code to{"\n"}
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
              {phone ? phone.replace(/(\d{3})(\d{3})(\d{4})$/, "+1 ($1) $2-••••") : "+1 (•••) •••-••••"}
            </Text>
          </Text>
        </View>

        <TouchableOpacity style={styles.otpContainer} activeOpacity={1} onPress={() => inputRef.current?.focus()}>
          {digits.map((d, i) => (
            <View
              key={i}
              style={[
                styles.otpBox,
                {
                  backgroundColor: colors.card,
                  borderColor: i === code.length ? colors.primary : d ? colors.primary + "60" : colors.border,
                  borderWidth: i === code.length ? 2 : 1.5,
                },
              ]}
            >
              <Text style={[styles.otpDigit, { color: colors.foreground }]}>{d || ""}</Text>
            </View>
          ))}
        </TouchableOpacity>

        <TextInput placeholderTextColor={colors.mutedForeground}
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.verifyBtn, { backgroundColor: code.length === CODE_LENGTH ? colors.primary : colors.muted }]}
          onPress={() => handleVerify()}
          disabled={code.length !== CODE_LENGTH || loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.verifyTxt, { color: code.length === CODE_LENGTH ? colors.primaryForeground : colors.mutedForeground }]}>
            {loading ? "Verifying…" : "Verify Code"}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={[styles.resendInfo, { color: colors.mutedForeground }]}>Didn't get it? </Text>
          {canResend ? (
            <TouchableOpacity activeOpacity={0.85} onPress={handleResend}>
              <Text style={[styles.resendLink, { color: colors.primary }]}>Resend code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.resendCountdown, { color: colors.mutedForeground }]}>
              Resend in <Text style={{ fontFamily: "Inter_600SemiBold" }}>{countdown}s</Text>
            </Text>
          )}
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.changeNumBtn} onPress={() => router.back()}>
          <Text style={[styles.changeNumTxt, { color: colors.mutedForeground }]}>Change phone number</Text>
        </TouchableOpacity>

        <View style={[styles.privacyNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={13} color={colors.mutedForeground} style={{ marginTop: 1, flexShrink: 0 }} />
          <Text style={[styles.privacyNoteText, { color: colors.mutedForeground }]}>
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>Your privacy matters.</Text>
            {" "}Verification information is used only to authenticate your identity and is handled securely. Verification details are never displayed publicly or shared with other users.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  successRoot: { alignItems: "center", justifyContent: "center", gap: 16 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 16, fontFamily: "Inter_400Regular" },
  inner: { flex: 1, paddingHorizontal: 24 },
  back: { marginBottom: 8, width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  topSection: { alignItems: "center", marginTop: 24, marginBottom: 40 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 12 },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  otpContainer: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 32 },
  otpBox: {
    width: 48, height: 58, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  otpDigit: { fontSize: 24, fontFamily: "Inter_700Bold" },
  hiddenInput: { position: "absolute", opacity: 0, height: 0, width: 0 },
  verifyBtn: { alignItems: "center", justifyContent: "center", paddingVertical: 17, borderRadius: 14, marginBottom: 24 },
  verifyTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  resendInfo: { fontSize: 14, fontFamily: "Inter_400Regular" },
  resendLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resendCountdown: { fontSize: 14, fontFamily: "Inter_400Regular" },
  changeNumBtn: { alignItems: "center", paddingVertical: 4 },
  changeNumTxt: { fontSize: 13, fontFamily: "Inter_400Regular" },
  privacyNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 24,
  },
  privacyNoteText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },
});
