import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Platform,
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

const CURRENT = 5;

const markComplete = () =>
  AsyncStorage.setItem("@mapping_with_melanin_onboarding_complete", "true").catch(() => {});

export default function OnboardingJoin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const goTo = (i: number) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.replace(ROUTES[i] as never);
  };

  return (
    <View style={styles.root}>
      <Image
        source={require("@/assets/images/community.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={["transparent", "#3A1F0Ecc", "#1C0E06ee"]}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => { markComplete(); router.replace("/signup"); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.skipText}>Sign Up</Text>
        </TouchableOpacity>
        <View style={styles.dots}>
          {ROUTES.map((_, i) => (
            <TouchableOpacity activeOpacity={0.85} key={i} onPress={() => goTo(i)}>
              <View style={[styles.dot, { width: i === CURRENT ? 24 : 8, opacity: i === CURRENT ? 1 : 0.4 }]} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.content, { paddingBottom: bottomPad + 24 }]}>
        <Text style={styles.eyebrow}>GLOBAL COMMUNITY</Text>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Connect With a</Text>
          <Text style={styles.titleItalic}>Global Community.</Text>
        </View>
        <Text style={styles.subtitle}>
          Because the best journeys are shared. Meet like-minded travelers, entrepreneurs,
          professionals, and creators who understand your experience.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>10K+</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>500+</Text>
            <Text style={styles.statLabel}>Cities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>2K+</Text>
            <Text style={styles.statLabel}>Businesses</Text>
          </View>
        </View>

        <View style={styles.finalBtns}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => { markComplete(); router.replace("/signup"); }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnTxt}>Create Account — It's Free</Text>
            <Feather name="arrow-right" size={18} color="#1C0E06" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => { markComplete(); router.replace("/login"); }}
            activeOpacity={0.8}
          >
            <Feather name="log-in" size={16} color="#CA922B" />
            <Text style={styles.ghostTxt}>I already have an account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.waitlistBtn}
            onPress={() => { markComplete(); router.replace("/waitlist" as never); }}
            activeOpacity={0.8}
          >
            <Feather name="clock" size={16} color="rgba(255,255,255,0.55)" />
            <Text style={styles.waitlistBtnText}>Join the Waitlist</Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: W, height: H, backgroundColor: "#1C0E06" },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingBottom: 8, zIndex: 10,
  },
  skipText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.65)" },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: "#CA922B" },
  content: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 28, gap: 14,
  },
  eyebrow: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5, color: "#CA922B" },
  titleBlock: { gap: 0 },
  title: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 42, color: "#FFFFFF", lineHeight: 50 },
  titleItalic: { fontFamily: "PlayfairDisplay_700Bold_Italic", fontSize: 42, color: "#CA922B", lineHeight: 50 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 23 },
  statsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 20, paddingVertical: 14, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  stat: { alignItems: "center", gap: 2 },
  statNum: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 22, color: "#CA922B" },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.55)" },
  statDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.15)" },
  finalBtns: { gap: 12 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 18, borderRadius: 16, backgroundColor: "#CA922B",
  },
  primaryBtnTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#1C0E06" },
  ghostBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: "rgba(202,146,43,0.45)",
  },
  ghostTxt: { fontSize: 16, fontFamily: "Inter_500Medium", color: "#CA922B" },
  waitlistBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13,
  },
  waitlistBtnText: {
    fontSize: 14, fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.55)",
  },
});
