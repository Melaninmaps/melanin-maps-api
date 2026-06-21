import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const INTERESTS = [
  { id: "travel", emoji: "✈️", label: "Travel", sub: "Explore destinations" },
  { id: "food", emoji: "🍽️", label: "Food & Dining", sub: "Restaurants & cafés" },
  { id: "business", emoji: "💼", label: "Business", sub: "Entrepreneurship" },
  { id: "networking", emoji: "🤝", label: "Networking", sub: "Meet community" },
  { id: "relocation", emoji: "🏡", label: "Relocation", sub: "Moving somewhere new" },
  { id: "family", emoji: "👨‍👩‍👧", label: "Family", sub: "Family-friendly spots" },
  { id: "wellness", emoji: "🧘", label: "Wellness", sub: "Health & self-care" },
  { id: "events", emoji: "🎉", label: "Events", sub: "Concerts & gatherings" },
  { id: "arts", emoji: "🎨", label: "Arts & Culture", sub: "Museums & galleries" },
  { id: "nightlife", emoji: "🌙", label: "Nightlife", sub: "Bars & entertainment" },
  { id: "shopping", emoji: "🛍️", label: "Shopping", sub: "Minority-owned shops" },
  { id: "sports", emoji: "⚽", label: "Sports", sub: "Athletics & fitness" },
];

export default function InterestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const canContinue = selected.size >= 2;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 24 }]}>
        <View style={[styles.stepRow]}>
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={[
                styles.step,
                { backgroundColor: n <= 3 ? colors.primary : colors.secondary, opacity: n === 3 ? 1 : 0.35 },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>What interests you?</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Pick at least 2 to personalise your experience
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {INTERESTS.map((item) => {
          const on = selected.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? colors.primary : colors.card,
                  borderColor: on ? colors.primary : colors.border,
                },
              ]}
              onPress={() => toggle(item.id)}
              activeOpacity={0.8}
            >
              {on && (
                <View style={[styles.checkmark, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                  <Feather name="check" size={11} color="#FFF" />
                </View>
              )}
              <Text style={styles.chipEmoji}>{item.emoji}</Text>
              <Text style={[styles.chipLabel, { color: on ? "#FFF" : colors.foreground }]}>
                {item.label}
              </Text>
              <Text style={[styles.chipSub, { color: on ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
                {item.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 20, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Text style={[styles.counter, { color: colors.mutedForeground }]}>
          {selected.size} selected
          {selected.size < 2 ? `  —  need ${2 - selected.size} more` : "  ✓ ready to go!"}
        </Text>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            { backgroundColor: canContinue ? colors.primary : colors.muted },
          ]}
          onPress={() => {
            if (canContinue) router.replace("/(tabs)");
          }}
          activeOpacity={0.85}
          disabled={!canContinue}
        >
          <Text style={[styles.continueTxt, { color: canContinue ? colors.primaryForeground : colors.mutedForeground }]}>
            Get Started
          </Text>
          <Feather name="arrow-right" size={18} color={canContinue ? colors.primaryForeground : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 20, gap: 10 },
  stepRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  step: { flex: 1, height: 4, borderRadius: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular" },
  grid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chip: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 6,
    position: "relative",
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  chipEmoji: { fontSize: 26 },
  chipLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  chipSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
    borderTopWidth: 1,
  },
  counter: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
    borderRadius: 16,
  },
  continueTxt: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
});
