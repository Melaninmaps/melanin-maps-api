import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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

const SLIDES = [
  {
    id: "welcome",
    image: require("@/assets/images/hero.jpg"),
    gradientFrom: "#3A1F0Eee",
    gradientTo: "#1C0E06",
    eyebrow: "SAFETY-FIRST COMMUNITY INTELLIGENCE",
    title: "Map Your Life.\nConnect Deeper.",
    titleItalic: "Live With Purpose.",
    subtitle: "Mapping with Melanin™ connects people to trusted businesses, meaningful relationships, thriving communities, and new opportunities through the power of shared experiences and community-driven insights.",
  },
  {
    id: "safety",
    image: require("@/assets/images/safety.jpg"),
    gradientFrom: "#1C0E06cc",
    gradientTo: "#1C0E06ee",
    eyebrow: "SAFETY FIRST",
    title: "Travel Smarter.",
    titleItalic: "Travel Informed.",
    subtitle: "Community-driven safety scores, verified reviews, and real-time insights so you always know what to expect before you arrive.",
  },
  {
    id: "travel",
    image: require("@/assets/images/bento-travel.jpg"),
    gradientFrom: "#1A2E22cc",
    gradientTo: "#1A2E22ee",
    eyebrow: "AI-CURATED JOURNEYS",
    title: "Plan Your\nJourney",
    titleItalic: "Your Way.",
    subtitle: "KinfolkAI™ builds itineraries with Black-owned spots, safe neighborhoods, and community events.",
  },
  {
    id: "join",
    image: require("@/assets/images/community.jpg"),
    gradientFrom: "#3A1F0Ecc",
    gradientTo: "#1C0E06ee",
    eyebrow: "GLOBAL COMMUNITY",
    title: "Connect With a",
    titleItalic: "Global Community.",
    subtitle: "Because the best journeys are shared. Meet like-minded travelers, entrepreneurs, professionals, and creators who understand your experience.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const slide = SLIDES[idx];

  const markComplete = () =>
    AsyncStorage.setItem("@mapping_with_melanin_onboarding_complete", "true").catch(() => {});

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * W, animated: true });
    setIdx(i);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i !== idx) setIdx(i);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
        scrollEnabled={true}
      >
        {SLIDES.map((s) => (
          <View key={s.id} style={{ width: W, height: H }}>
            <Image source={s.image} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={["transparent", s.gradientFrom, s.gradientTo]}
              locations={[0, 0.35, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ))}
      </ScrollView>

      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => { markComplete(); router.replace("/(tabs)"); }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: "#CA922B",
                    width: i === idx ? 24 : 8,
                    opacity: i === idx ? 1 : 0.4,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.content, { paddingBottom: bottomPad + 24 }]}>
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.titleItalic}>{slide.titleItalic}</Text>
        </View>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        <View style={styles.bottom}>
          {idx < SLIDES.length - 1 ? (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => goTo(idx + 1)}
              activeOpacity={0.85}
            >
              <Text style={styles.nextTxt}>Next</Text>
              <Feather name="arrow-right" size={18} color="#1C0E06" />
            </TouchableOpacity>
          ) : (
            <View style={styles.finalBtns}>
              <TouchableOpacity
                style={styles.primaryFinalBtn}
                onPress={() => { markComplete(); router.replace("/waitlist"); }}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryFinalTxt}>Join the Waitlist</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={() => { markComplete(); router.replace("/login"); }}
                activeOpacity={0.8}
              >
                <Text style={styles.ghostTxt}>I already have an account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { markComplete(); router.replace("/(tabs)"); }}>
                <Text style={styles.skipLink}>Explore without account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1C0E06" },
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
  skipText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.65)" },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    gap: 12,
  },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#CA922B",
  },
  titleBlock: { gap: 0 },
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
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 23,
    marginBottom: 8,
  },
  bottom: {},
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: "#CA922B",
  },
  nextTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#1C0E06" },
  finalBtns: { gap: 12 },
  primaryFinalBtn: {
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: "#CA922B",
  },
  primaryFinalTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#1C0E06" },
  ghostBtn: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(202,146,43,0.45)",
  },
  ghostTxt: { fontSize: 16, fontFamily: "Inter_500Medium", color: "#CA922B" },
  skipLink: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
    paddingVertical: 8,
  },
});
