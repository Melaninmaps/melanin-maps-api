import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
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

const METHODS = [
  {
    id: "ein",
    icon: "file-text" as const,
    label: "EIN / Tax Documents",
    desc: "Upload your EIN letter or business registration",
    color: "#C4622D",
  },
  {
    id: "phone",
    icon: "phone" as const,
    label: "Phone Verification",
    desc: "We'll call your listed business number",
    color: "#2D7A4F",
  },
  {
    id: "website",
    icon: "globe" as const,
    label: "Website Verification",
    desc: "Add a verification meta tag to your site",
    color: "#D4873A",
  },
  {
    id: "social",
    icon: "instagram" as const,
    label: "Social Media",
    desc: "Connect your business Instagram or Facebook",
    color: "#7B4F2E",
  },
];

const TOTAL_STEPS = 3;

export default function BusinessVerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("");
  const [docNote, setDocNote] = useState("");
  const [loading, setLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const animateTo = (s: number) => {
    Animated.spring(progressAnim, { toValue: s / TOTAL_STEPS, useNativeDriver: false }).start();
  };

  const goNext = async () => {
    if (step === 2) {
      setLoading(true);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise((r) => setTimeout(r, 1200));
      setLoading(false);
    }
    const next = step + 1;
    setStep(next);
    animateTo(next);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const canProceed = step === 1 ? !!method : step === 2 ? true : false;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => step > 1 ? (setStep(step - 1), animateTo(step - 1)) : router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Feather name={step === 3 ? "x" : "arrow-left"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Business Verification</Text>
          <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>Step {Math.min(step, 3)} of 3</Text>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.section}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Choose Verification Method</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Select how you'd like to prove ownership of your business.
            </Text>
            <View style={styles.methodGrid}>
              {METHODS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.methodCard,
                    {
                      backgroundColor: method === m.id ? m.color + "18" : colors.card,
                      borderColor: method === m.id ? m.color : colors.border,
                      borderWidth: method === m.id ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setMethod(m.id);
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.methodIcon, { backgroundColor: m.color + "18" }]}>
                    <Feather name={m.icon} size={22} color={m.color} />
                  </View>
                  <Text style={[styles.methodLabel, { color: colors.foreground }]}>{m.label}</Text>
                  <Text style={[styles.methodDesc, { color: colors.mutedForeground }]}>{m.desc}</Text>
                  {method === m.id && (
                    <View style={[styles.methodCheck, { backgroundColor: m.color }]}>
                      <Feather name="check" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Submit Your Proof</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              {method === "ein" && "Upload a clear photo or PDF of your EIN letter or business registration document."}
              {method === "phone" && "We'll call your registered business phone number and give you a verification code."}
              {method === "website" && "Add the meta tag below to your website's <head> section, then click verify."}
              {method === "social" && "Connect your business social account so we can confirm your ownership."}
            </Text>

            {method === "ein" && (
              <View style={styles.uploadArea}>
                <TouchableOpacity
                  style={[styles.uploadBox, { backgroundColor: colors.secondary, borderColor: colors.primary + "40" }]}
                  activeOpacity={0.7}
                >
                  <Feather name="upload-cloud" size={32} color={colors.primary} />
                  <Text style={[styles.uploadTxt, { color: colors.foreground }]}>Tap to upload document</Text>
                  <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>PDF, JPG, or PNG — max 10MB</Text>
                </TouchableOpacity>
                <View style={styles.noteField}>
                  <Text style={[styles.noteLabel, { color: colors.foreground }]}>Additional notes (optional)</Text>
                  <TextInput
                    style={[styles.noteInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="Any information that may help our review team…"
                    placeholderTextColor={colors.mutedForeground}
                    value={docNote}
                    onChangeText={setDocNote}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            )}

            {method === "phone" && (
              <View style={[styles.infoBox, { backgroundColor: colors.secondary }]}>
                <Feather name="phone" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoTitle, { color: colors.foreground }]}>Ready to receive your call?</Text>
                  <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>
                    A call will be placed to the number on your listing. Answer and enter the code you hear.
                  </Text>
                </View>
              </View>
            )}

            {method === "website" && (
              <View style={styles.codeBlock}>
                <View style={[styles.codeBox, { backgroundColor: "#1A0A00" }]}>
                  <Text style={styles.codeText}>
                    {`<meta name="melanin-verify"\n  content="mwm-abc123xyz789" />`}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.copyBtn, { backgroundColor: colors.secondary }]}>
                  <Feather name="copy" size={15} color={colors.primary} />
                  <Text style={[styles.copyTxt, { color: colors.primary }]}>Copy tag</Text>
                </TouchableOpacity>
              </View>
            )}

            {method === "social" && (
              <View style={styles.socialBtns}>
                {["Instagram", "Facebook", "Twitter / X"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.socialConnectBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.8}
                  >
                    <Feather name="link" size={16} color={colors.primary} />
                    <Text style={[styles.socialConnectTxt, { color: colors.foreground }]}>Connect {s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.successSection}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + "18" }]}>
              <Feather name="clock" size={44} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Verification Submitted!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Our team will review your submission within{" "}
              <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>2–3 business days</Text>.
              You'll receive a notification once your business is verified.
            </Text>
            <View style={[styles.stepsPreview, { backgroundColor: colors.secondary }]}>
              {[
                { label: "Submitted", done: true },
                { label: "Under Review", done: false },
                { label: "Verified", done: false },
              ].map((s, i) => (
                <View key={i} style={styles.statusStep}>
                  <View style={[styles.statusDot, { backgroundColor: s.done ? colors.success : colors.border }]}>
                    {s.done && <Feather name="check" size={10} color="#FFF" />}
                  </View>
                  <Text style={[styles.statusLabel, { color: s.done ? colors.foreground : colors.mutedForeground }]}>
                    {s.label}
                  </Text>
                  {i < 2 && <View style={[styles.statusLine, { backgroundColor: colors.border }]} />}
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneTxt, { color: colors.primaryForeground }]}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {step < 3 && (
        <View style={[styles.footer, { paddingBottom: bottomPad + 16 }]}>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: canProceed ? colors.primary : colors.muted }]}
            onPress={goNext}
            disabled={!canProceed || loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextTxt, { color: canProceed ? colors.primaryForeground : colors.mutedForeground }]}>
              {loading ? "Submitting…" : step === 2 ? "Submit for Review" : "Continue"}
            </Text>
            {!loading && <Feather name="arrow-right" size={16} color={canProceed ? colors.primaryForeground : colors.mutedForeground} />}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerStep: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  progressTrack: { height: 4, marginHorizontal: 20, borderRadius: 2, marginBottom: 20 },
  progressFill: { height: 4, borderRadius: 2 },
  scroll: { paddingHorizontal: 20 },
  section: { gap: 20 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  stepSub: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  methodGrid: { gap: 12 },
  methodCard: { borderRadius: 16, padding: 16, gap: 6, position: "relative" },
  methodIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  methodLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  methodDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  methodCheck: { position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  uploadArea: { gap: 16 },
  uploadBox: {
    borderWidth: 2, borderStyle: "dashed", borderRadius: 16,
    padding: 36, alignItems: "center", gap: 10,
  },
  uploadTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  uploadSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  noteField: { gap: 8 },
  noteLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  noteInput: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    fontSize: 14, fontFamily: "Inter_400Regular", textAlignVertical: "top", minHeight: 80,
  },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 16, borderRadius: 14 },
  infoTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  infoSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  codeBlock: { gap: 12 },
  codeBox: { borderRadius: 12, padding: 16 },
  codeText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#D4873A" },
  copyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 10 },
  copyTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  socialBtns: { gap: 10 },
  socialConnectBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 12, borderWidth: 1,
  },
  socialConnectTxt: { fontSize: 15, fontFamily: "Inter_500Medium" },
  successSection: { alignItems: "center", gap: 20, paddingTop: 24 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  stepsPreview: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 20, borderRadius: 16, gap: 8, alignSelf: "stretch",
  },
  statusStep: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statusLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  statusLine: { width: 20, height: 2, borderRadius: 1 },
  doneBtn: { alignSelf: "stretch", alignItems: "center", paddingVertical: 17, borderRadius: 14 },
  doneTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 17, borderRadius: 14,
  },
  nextTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
