import React, { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface Suggestion {
  icon: string;
  title: string;
  insight: string;
  category: "discover" | "safety" | "culture" | "travel" | "community";
}

const CATEGORY_COLORS: Record<string, string> = {
  discover: "#2D7A4F",
  safety: "#DC2626",
  culture: "#7B2D8B",
  travel: "#CA922B",
  community: "#1877F2",
};

export function ForYouCard() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void SecureStore.getItemAsync("auth_session_token").then(async (tok) => {
      if (!tok) { setLoading(false); return; }
      try {
        const r = await fetch(`${getApiBase()}/api/ai/for-you`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        const d = (r.ok ? await r.json() : { suggestions: [] }) as { suggestions?: Suggestion[] };
        if (d.suggestions?.length) {
          setSuggestions(d.suggestions);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    });
  }, [user]);

  if (!user || dismissed || loading || !suggestions.length) return null;

  return (
    <Animated.View style={[styles.wrap, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>✦</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Just for You</Text>
          <View style={[styles.aiBadge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.aiBadgeText, { color: colors.primary }]}>KinfolkAI</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        {suggestions.map((s, i) => {
          const accent = CATEGORY_COLORS[s.category] ?? colors.primary;
          return (
            <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: accent + "30" }]}>
              <View style={[styles.cardIconWrap, { backgroundColor: accent + "15" }]}>
                <Text style={styles.cardIcon}>{s.icon}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{s.title}</Text>
              <Text style={[styles.cardInsight, { color: colors.mutedForeground }]}>{s.insight}</Text>
              {s.category === "discover" && (
                <TouchableOpacity
                  style={[styles.cardAction, { borderColor: accent + "40", backgroundColor: accent + "10" }]}
                  onPress={() => router.push("/(tabs)/discover" as never)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cardActionText, { color: accent }]}>Explore</Text>
                  <Feather name="arrow-right" size={12} color={accent} />
                </TouchableOpacity>
              )}
              {s.category === "community" && (
                <TouchableOpacity
                  style={[styles.cardAction, { borderColor: accent + "40", backgroundColor: accent + "10" }]}
                  onPress={() => router.push("/(tabs)/community" as never)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cardActionText, { color: accent }]}>View Feed</Text>
                  <Feather name="arrow-right" size={12} color={accent} />
                </TouchableOpacity>
              )}
              {s.category === "safety" && (
                <TouchableOpacity
                  style={[styles.cardAction, { borderColor: accent + "40", backgroundColor: accent + "10" }]}
                  onPress={() => router.push("/report-safety" as never)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cardActionText, { color: accent }]}>Report</Text>
                  <Feather name="arrow-right" size={12} color={accent} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerIcon: { fontSize: 14, color: "#CA922B" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  aiBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  aiBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  cards: { gap: 10, paddingRight: 4 },
  card: { width: 220, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  cardIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 13, lineHeight: 18 },
  cardInsight: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  cardAction: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  cardActionText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});
