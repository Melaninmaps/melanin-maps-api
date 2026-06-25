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
  "/onboarding/join",
];

const CURRENT = 2;

const markComplete = () =>
  AsyncStorage.setItem("@mapping_with_melanin_onboarding_complete", "true").catch(() => {});

export default function OnboardingTravel() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const goTo = (i: number) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.replace(ROUTES[i] as never);
  };

  const skip = () => { markComplete(); router.replace("/(tabs)"); };

  return (
    <View style={styles.root}>
      <Image
        source={require("@/assets/images/bento-travel.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={["transparent", "#1A2E22cc", "#1A2E22ee"]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={skip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.dots}>
          {ROUTES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[styles.dot, { width: i === CURRENT ? 24 : 8, opacity: i === CURRENT ? 1 : 0.4 }]} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.content, { paddingBottom: bottomPad + 24 }]}>
        <View style={styles.badge}>
          <Feather name="zap" size={12} color="#2D7A4F" />
          <Text style={styles.badgeText}>KINFOLKAI™ POWERED</Text>
        </View>
        <Text style={styles.eyebrow}>AI-CURATED JOURNEYS</Text>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{"Plan Your\nJourney"}</Text>
          <Text style={styles.titleItalic}>Your Way.</Text>
        </View>
        <Text style={styles.subtitle}>
          KinfolkAI™ builds personalized itineraries featuring minority-owned spots,
          safe neighborhoods, cultural events, and community recommendations — all
          tailored to your vibe, budget, and travel style.
        </Text>

        <View style={styles.pillRow}>
          <View style={styles.pill}><Text style={styles.pillText}>Black-Owned Spots</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>Safe Routes</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>Cultural Events</Text></View>
        </View>

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => goTo(CURRENT + 1)}
          activeOpacity={0.85}
        >
          <Text style={styles.nextTxt}>Next</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: W, height: H, backgroundColor: "#1A2E22" },
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
    paddingHorizontal: 28, gap: 12,
  },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", backgroundColor: "rgba(45,122,79,0.25)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(45,122,79,0.4)",
  },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#4ADE80", letterSpacing: 0.8 },
  eyebrow: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5, color: "#CA922B" },
  titleBlock: { gap: 0 },
  title: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 42, color: "#FFFFFF", lineHeight: 50 },
  titleItalic: { fontFamily: "PlayfairDisplay_700Bold_Italic", fontSize: 42, color: "#CA922B", lineHeight: 50 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 23 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  pillText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)" },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 18, borderRadius: 16,
    backgroundColor: "#2D7A4F", marginBottom: 8,
  },
  nextTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
});
