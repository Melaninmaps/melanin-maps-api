import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

const ROUTES = [
  "/onboarding",
  "/onboarding/safety",
  "/onboarding/travel",
  "/onboarding/identity",
  "/onboarding/agreement",
  "/onboarding/join",
];

const CURRENT = 4;

const PRINCIPLES = [
  {
    icon: "shield" as const,
    text: "We protect one another.",
    sub: "Every member's safety is the community's responsibility.",
  },
  {
    icon: "book-open" as const,
    text: "We honor the stories shared here.",
    sub: "What is trusted to this community stays within it.",
  },
  {
    icon: "eye-off" as const,
    text: "We never use this community to surveil, harass, or target another person.",
    sub: "Membership is a privilege, not a tool.",
  },
  {
    icon: "check-square" as const,
    text: "We contribute honestly.",
    sub: "Our community's value depends on the truth we bring to it.",
  },
  {
    icon: "users" as const,
    text: "Membership is trust.",
    sub: "We earn it. We keep it. We extend it to those who deserve it.",
  },
];

const markComplete = () =>
  AsyncStorage.setItem("@mapping_with_melanin_onboarding_complete", "true").catch(() => {});

export default function OnboardingAgreement() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const goTo = (i: number) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.replace(ROUTES[i] as never);
  };

  const agree = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    AsyncStorage.setItem("@mwm_community_agreement_v1", "true").catch(() => {});
    goTo(CURRENT + 1);
  };

  return (
    <View style={[styles.root, { backgroundColor: "#1C0E06" }]}>
      <LinearGradient
        colors={["#2A1208", "#1C0E06"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar with dots */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => goTo(CURRENT - 1)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
        <View style={styles.dots}>
          {ROUTES.map((_, i) => (
            <TouchableOpacity activeOpacity={0.85} key={i} onPress={() => goTo(i)}>
              <View
                style={[
                  styles.dot,
                  { width: i === CURRENT ? 24 : 8, opacity: i === CURRENT ? 1 : 0.4 },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 64, paddingBottom: bottomPad + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.eyebrow}>COMMUNITY AGREEMENT</Text>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Before You</Text>
          <Text style={styles.titleItalic}>Join Us.</Text>
        </View>
        <Text style={styles.intro}>
          This community was built to protect, connect, and celebrate people who have been
          overlooked, surveilled, and excluded. Membership is not a sign-up — it is a
          commitment.
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Principles */}
        <View style={styles.principles}>
          {PRINCIPLES.map((p, idx) => (
            <View key={idx} style={styles.principle}>
              <View style={styles.iconWrap}>
                <Feather name={p.icon} size={18} color="#CA922B" />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.principleText}>{p.text}</Text>
                <Text style={styles.principleSub}>{p.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <Text style={styles.closing}>
          Violations of this agreement are grounds for membership review and revocation.
          The community you are joining depends on the integrity you bring to it.
        </Text>
      </ScrollView>

      {/* Fixed agree button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: bottomPad + 24,
            borderTopColor: "rgba(255,255,255,0.08)",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.agreeBtn}
          onPress={agree}
          activeOpacity={0.85}
        >
          <Feather name="check" size={18} color="#1C0E06" />
          <Text style={styles.agreeBtnTxt}>I Agree — Take Me In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => { markComplete(); router.replace("/login"); }}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnTxt}>Already a member? Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: W, minHeight: H },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 10,
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: "#CA922B" },
  scroll: { paddingHorizontal: 28, gap: 0 },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#CA922B",
    marginBottom: 10,
  },
  titleBlock: { gap: 0, marginBottom: 16 },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 42,
    color: "#FFFFFF",
    lineHeight: 50,
  },
  titleItalic: {
    fontFamily: "PlayfairDisplay_700Bold_Italic",
    fontSize: 42,
    color: "#CA922B",
    lineHeight: 50,
  },
  intro: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 24,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(202,146,43,0.2)",
    marginVertical: 20,
  },
  principles: { gap: 20 },
  principle: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(202,146,43,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  principleText: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 23,
  },
  principleSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 19,
  },
  closing: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 20,
    fontStyle: "italic",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingTop: 16,
    gap: 10,
    backgroundColor: "rgba(28,14,6,0.96)",
    borderTopWidth: 1,
  },
  agreeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: "#CA922B",
  },
  agreeBtnTxt: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#1C0E06",
  },
  backBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  backBtnTxt: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(202,146,43,0.7)",
  },
});
