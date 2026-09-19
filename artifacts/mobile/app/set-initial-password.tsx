import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  Keyboard,
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
import { getApiBaseUrl, useAuth } from "@/lib/auth";

export default function SetInitialPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshUser, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const valid = password.length >= 8 && password === confirmation;

  async function returnToSignIn() {
    if (loading || signingOut) return;
    setSigningOut(true);
    // Temporary-password members may leave this screen, but cannot bypass the
    // password-change requirement while remaining signed in.
    await logout().catch(() => {});
    router.replace("/login");
  }

  async function submit() {
    Keyboard.dismiss();
    setError("");
    if (!valid) {
      setError(
        password.length < 8
          ? "Choose a password with at least 8 characters."
          : "Passwords do not match.",
      );
      return;
    }
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) {
        router.replace("/login");
        return;
      }
      const response = await fetch(
        `${getApiBaseUrl()}/api/auth/complete-initial-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword: password }),
        },
      );
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || !data.success) {
        setError(
          data.error ?? "Could not set your password. Please try again.",
        );
        return;
      }
      if (Platform.OS !== "web")
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      await refreshUser();
      router.replace("/(tabs)");
    } catch {
      setError(
        "Could not reach the server. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 36) + 24,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => void returnToSignIn()}
          disabled={loading || signingOut}
          style={styles.returnToSignIn}
          accessibilityRole="button"
          accessibilityLabel="Sign out and return to sign in"
          accessibilityHint="Leaves this required password screen without changing the temporary-password policy"
        >
          <Feather name="arrow-left" size={17} color={colors.mutedForeground} />
          <Text style={[styles.returnToSignInText, { color: colors.mutedForeground }]}>
            {signingOut ? "Signing out…" : "Return to sign in"}
          </Text>
        </TouchableOpacity>
        <View style={[styles.icon, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="lock" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Set your private password
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Your tester account was created with a temporary password. Choose one
          only you know before continuing.
        </Text>
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            New password
          </Text>
          <View
            style={[
              styles.inputRow,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              style={[styles.input, { color: colors.foreground }]}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((value) => !value)}
              hitSlop={10}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Confirm password
          </Text>
          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="Type it again"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.singleInput,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
                color: colors.foreground,
              },
            ]}
          />
          {error ? (
            <View style={styles.error}>
              <Feather name="alert-circle" size={15} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            disabled={!valid || loading}
            onPress={() => void submit()}
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                opacity: valid && !loading ? 1 : 0.45,
              },
            ]}
          >
            <Text style={styles.buttonText}>
              {loading ? "Saving…" : "Set password and continue"}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Forgot your temporary password? Return to sign in and use “Forgot
            password?” to receive a reset code.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, alignItems: "stretch" },
  returnToSignIn: {
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 8,
    paddingRight: 10,
  },
  returnToSignInText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 25, textAlign: "center" },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
  },
  form: { marginTop: 34, gap: 9 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 6 },
  inputRow: {
    height: 54,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 16 },
  singleInput: {
    height: 54,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  button: {
    height: 54,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  buttonText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  error: {
    flexDirection: "row",
    gap: 7,
    padding: 11,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    marginTop: 4,
  },
  errorText: {
    color: "#B91C1C",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
  },
  note: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 12,
  },
});
