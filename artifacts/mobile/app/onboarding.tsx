import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

const { width: W } = Dimensions.get("window");

const SLIDES = [
  {
    id: "welcome",
    emoji: "🗺️",
    bg: "#C4622D",
    accent: "#FBF7F0",
    dimAccent: "#FBF7F0AA",
    title: "Welcome to\nMapping With Melanin™",
    subtitle: "Discover, support, and celebrate Black-owned businesses wherever you go.",
  },
  {
    id: "safety",
    emoji: "🛡️",
    bg: "#1A0A00",
    accent: "#D4873A",
    dimAccent: "#D4873AAA",
    title: "Community-Powered\nSafety Intel",
    subtitle: "Real reports from people who look like you. Know before you go — always.",
  },
  {
    id: "travel",
    emoji: "✈️",
    bg: "#2D7A4F",
    accent: "#FBF7F0",
    dimAccent: "#FBF7F0AA",
    title: "Plan Your\nJourney Your Way",
    subtitle: "AI-curated itineraries with Black-owned spots, safe neighborhoods, and community events.",
  },
  {
    id: "join",
    emoji: "✊🏿",
    bg: "#D4873A",
    accent: "#1A0A00",
    dimAccent: "#1A0A00AA",
    title: "Join the\nMovement",
    subtitle: "Over 3,000 community members mapping culture, safety, and Black excellence nationwide.",
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
    AsyncStorage.setItem("@melanin_maps_onboarding_complete", "true").catch(() => {});

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
    <View style={[styles.root, { backgroundColor: slide.bg }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => { markComplete(); router.replace("/(tabs)"); }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.skipText, { color: slide.dimAccent }]}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: slide.accent,
                    width: i === idx ? 24 : 8,
                    opacity: i === idx ? 1 : 0.3,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => (
          <View key={s.id} style={[styles.slide, { width: W }]}>
            <View style={[styles.emojiCircle, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
              <Text style={styles.emoji}>{s.emoji}</Text>
            </View>
            <Text style={[styles.slideTitle, { color: s.accent }]}>{s.title}</Text>
            <Text style={[styles.slideSub, { color: s.dimAccent }]}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: bottomPad + 24 }]}>
        {idx < SLIDES.length - 1 ? (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: slide.accent }]}
            onPress={() => goTo(idx + 1)}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextTxt, { color: slide.bg }]}>Next</Text>
            <Feather name="arrow-right" size={18} color={slide.bg} />
          </TouchableOpacity>
        ) : (
          <View style={styles.finalBtns}>
            <TouchableOpacity
              style={[styles.primaryFinalBtn, { backgroundColor: slide.accent }]}
              onPress={() => { markComplete(); router.replace("/signup"); }}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryFinalTxt, { color: slide.bg }]}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ghostBtn, { borderColor: slide.accent + "55" }]}
              onPress={() => { markComplete(); router.replace("/login"); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.ghostTxt, { color: slide.accent }]}>I already have an account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { markComplete(); router.replace("/(tabs)"); }}>
              <Text style={[styles.skipLink, { color: slide.dimAccent }]}>Explore without account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  skipText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: 36, paddingTop: 20 },
  emojiCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 44,
  },
  emoji: { fontSize: 56 },
  slideTitle: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 42,
    marginBottom: 20,
  },
  slideSub: { fontSize: 17, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 27 },
  bottom: { paddingHorizontal: 24 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
  },
  nextTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  finalBtns: { gap: 12 },
  primaryFinalBtn: { alignItems: "center", paddingVertical: 18, borderRadius: 16 },
  primaryFinalTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  ghostBtn: { alignItems: "center", paddingVertical: 16, borderRadius: 16, borderWidth: 1.5 },
  ghostTxt: { fontSize: 16, fontFamily: "Inter_500Medium" },
  skipLink: { textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 8 },
});
