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

const CURRENT = 0;

const markComplete = () =>
  AsyncStorage.setItem("@mapping_with_melanin_onboarding_complete", "true").catch(() => {});

export default function OnboardingWelcome() {
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
        source={require("@/assets/images/hero.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={["transparent", "#3A1F0Eee", "#1C0E06"]}
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
        <Text style={styles.eyebrow}>SAFETY-FIRST COMMUNITY INTELLIGENCE</Text>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{"Map Your Life.\nConnect Deeper."}</Text>
          <Text style={styles.titleItalic}>Live With Purpose.</Text>
        </View>
        <Text style={styles.subtitle}>
          Mapping with Melanin™ connects people to trusted businesses, meaningful relationships,
          thriving communities, and new opportunities through the power of shared experiences
          and community-driven insights.
        </Text>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => goTo(CURRENT + 1)}
          activeOpacity={0.85}
        >
          <Text style={styles.nextTxt}>Next</Text>
          <Feather name="arrow-right" size={18} color="#1C0E06" />
        </TouchableOpacity>
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
    paddingHorizontal: 28, gap: 12,
  },
  eyebrow: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5, color: "#CA922B" },
  titleBlock: { gap: 0 },
  title: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 42, color: "#FFFFFF", lineHeight: 50 },
  titleItalic: { fontFamily: "PlayfairDisplay_700Bold_Italic", fontSize: 42, color: "#CA922B", lineHeight: 50 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 23, marginBottom: 8 },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 18, borderRadius: 16, backgroundColor: "#CA922B",
  },
  nextTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#1C0E06" },
});
