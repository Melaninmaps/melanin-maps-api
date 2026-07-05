import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

export const PENDING_OWNERSHIP_PREFS_KEY = "@mwm_pending_ownership_prefs";

const ROUTES = [
  "/onboarding",
  "/onboarding/safety",
  "/onboarding/travel",
  "/onboarding/identity",
  "/onboarding/join",
];

const CURRENT = 3;

const markComplete = () =>
  AsyncStorage.setItem("@mapping_with_melanin_onboarding_complete", "true").catch(() => {});

const DESIGNATIONS = [
  { id: "black-owned", emoji: "✊🏾", label: "Black-Owned", sub: "Black-owned businesses — first & always" },
  { id: "minority-owned", emoji: "🏅", label: "Minority-Owned", sub: "Minority-owned businesses" },
  { id: "women-owned", emoji: "👩🏾‍💼", label: "Women-Owned", sub: "Woman-led businesses" },
  { id: "veteran-owned", emoji: "🎖️", label: "Veteran-Owned", sub: "Military veteran founders" },
  { id: "lgbtq-owned", emoji: "🏳️‍🌈", label: "LGBTQ+-Owned", sub: "LGBTQ+ led businesses" },
  { id: "hispanic-owned", emoji: "👩🏻‍💼", label: "Hispanic-Owned", sub: "Latinx & Hispanic founders" },
  { id: "indigenous-owned", emoji: "🪶", label: "Indigenous-Owned", sub: "Native-led businesses" },
  { id: "immigrant-owned", emoji: "🌍", label: "Immigrant-Owned", sub: "Immigrant entrepreneurs" },
  { id: "d9-affiliated", emoji: "🐾", label: "D9 Affiliated", sub: "Divine Nine affiliated" },
  { id: "disability-owned", emoji: "♿", label: "Disability-Owned", sub: "Disability community led" },
];

export default function OnboardingIdentity() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const goTo = (i: number) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.replace(ROUTES[i] as never);
  };

  const skip = () => { markComplete(); router.replace("/(tabs)"); };

  const toggle = (id: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(
        PENDING_OWNERSHIP_PREFS_KEY,
        JSON.stringify(Array.from(selected))
      );
    } catch {}
    setSaving(false);
    goTo(CURRENT + 1);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#1C0E06", "#2B1507", "#CA922B"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={skip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.skipText}>Skip</Text>
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 72, paddingBottom: bottomPad + 160 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>YOUR COMMUNITY PREFERENCES</Text>
        <Text style={styles.title}>{"Who Do You\nWant to"}</Text>
        <Text style={styles.titleGold}>Support?</Text>
        <Text style={styles.subtitle}>
          Select the business designations you care about most. We'll surface these businesses first — everywhere you explore.
        </Text>

        <View style={styles.grid}>
          {DESIGNATIONS.map((item) => {
            const on = selected.has(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, on && styles.chipSelected]}
                onPress={() => toggle(item.id)}
                activeOpacity={0.8}
              >
                {on && (
                  <View style={styles.checkBadge}>
                    <Feather name="check" size={10} color="#FFF" />
                  </View>
                )}
                <Text style={styles.chipEmoji}>{item.emoji}</Text>
                <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{item.label}</Text>
                <Text style={[styles.chipSub, on && styles.chipSubOn]}>{item.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selected.size > 0 && (
          <View style={styles.selectedNote}>
            <Feather name="heart" size={14} color="#CA922B" />
            <Text style={styles.selectedNoteText}>
              {selected.size === 1
                ? "1 preference selected"
                : `${selected.size} preferences selected`}
              {" — "}we'll prioritize these everywhere
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16 }]}>
        <TouchableOpacity
          style={[styles.nextBtn, saving && { opacity: 0.7 }]}
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.nextTxt}>
            {selected.size === 0 ? "Skip for Now" : "Save & Continue"}
          </Text>
          <Feather name="arrow-right" size={18} color="#1C0E06" />
        </TouchableOpacity>
        {selected.size === 0 && (
          <Text style={styles.skipNote}>You can always update this from your profile</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: W, minHeight: H, backgroundColor: "#1C0E06" },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingBottom: 8, zIndex: 10,
  },
  skipText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.65)" },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: "#CA922B" },
  scroll: { paddingHorizontal: 24, gap: 8 },
  eyebrow: {
    fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5, color: "#CA922B",
    marginBottom: 4,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold", fontSize: 38, color: "#FFFFFF", lineHeight: 46,
  },
  titleGold: {
    fontFamily: "PlayfairDisplay_700Bold_Italic", fontSize: 38, color: "#CA922B", lineHeight: 46,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 22,
    marginBottom: 20,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  chip: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 14,
    gap: 5,
    position: "relative",
  },
  chipSelected: {
    borderColor: "#CA922B",
    backgroundColor: "rgba(202,146,43,0.15)",
  },
  checkBadge: {
    position: "absolute", top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#CA922B",
    alignItems: "center", justifyContent: "center",
  },
  chipEmoji: { fontSize: 24 },
  chipLabel: {
    fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.85)",
  },
  chipLabelOn: { color: "#CA922B" },
  chipSub: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)",
  },
  chipSubOn: { color: "rgba(202,146,43,0.7)" },
  selectedNote: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(202,146,43,0.1)", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(202,146,43,0.2)",
    paddingHorizontal: 14, paddingVertical: 10,
  },
  selectedNoteText: {
    fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)", flex: 1,
  },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16, gap: 8,
    backgroundColor: "rgba(28,14,6,0.92)",
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)",
  },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 18, borderRadius: 16, backgroundColor: "#CA922B",
  },
  nextTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#1C0E06" },
  skipNote: {
    textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.4)",
  },
});
