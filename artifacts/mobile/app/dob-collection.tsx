import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_DAYS: Record<number, number> = {
  1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
  7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
};

export default function DobCollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const years = Array.from({ length: 100 }, (_, i) => currentYear - 13 - i);
  const days = selectedMonth ? Array.from({ length: MONTH_DAYS[selectedMonth] ?? 31 }, (_, i) => i + 1) : [];

  const isComplete = selectedMonth !== null && selectedDay !== null && selectedYear !== null;

  const handleSave = async () => {
    if (!isComplete) return;
    setError("");
    setSaving(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const dob = new Date(selectedYear!, selectedMonth! - 1, selectedDay!);
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/auth/user/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dateOfBirth: dob.toISOString() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to save. Please try again."); return; }
      router.replace("/(tabs)");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => router.replace("/(tabs)");

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: "#CA922B14", borderColor: "#CA922B30" }]}>
            <Feather name="calendar" size={36} color="#CA922B" />
          </View>
        </View>

        <Text style={[styles.heading, { color: colors.foreground }]}>One last step</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
          Your date of birth helps us keep 18+ group spaces safe for adults.{"\n"}
          This information is never shared publicly.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Month</Text>
          <View style={styles.chipsRow}>
            {MONTHS.map((m, i) => {
              const monthNum = i + 1;
              const selected = selectedMonth === monthNum;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, { borderColor: selected ? "#CA922B" : colors.border, backgroundColor: selected ? "#CA922B" : colors.background }]}
                  onPress={() => { setSelectedMonth(monthNum); setSelectedDay(null); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: selected ? "#fff" : colors.foreground }]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedMonth !== null && (
            <>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
                <View style={styles.chipsRow}>
                  {days.map((d) => {
                    const selected = selectedDay === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.chip, styles.dayChip, { borderColor: selected ? "#CA922B" : colors.border, backgroundColor: selected ? "#CA922B" : colors.background }]}
                        onPress={() => { setSelectedDay(d); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, { color: selected ? "#fff" : colors.foreground }]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}

          <Text style={[styles.cardLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
            <View style={styles.chipsRow}>
              {years.map((y) => {
                const selected = selectedYear === y;
                return (
                  <TouchableOpacity
                    key={y}
                    style={[styles.chip, styles.yearChip, { borderColor: selected ? "#CA922B" : colors.border, backgroundColor: selected ? "#CA922B" : colors.background }]}
                    onPress={() => { setSelectedYear(y); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: selected ? "#fff" : colors.foreground }]}>{y}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: "#FEE2E220", borderColor: "#DC262640" }]}>
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveBtn, { opacity: !isComplete || saving ? 0.5 : 1 }]}
          onPress={handleSave}
          disabled={!isComplete || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Continue"}</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
        </TouchableOpacity>

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          You must be 13 or older to use this platform. Some groups require members to be 18+.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  iconWrap: { alignItems: "center", marginBottom: 24 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  heading: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 30, textAlign: "center", marginBottom: 12 },
  subheading: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 24 },
  cardLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayScroll: { marginHorizontal: -4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, minWidth: 44, alignItems: "center",
  },
  dayChip: { minWidth: 40, paddingHorizontal: 8 },
  yearChip: { minWidth: 56, paddingHorizontal: 10 },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  errorText: { color: "#DC2626", fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  saveBtn: {
    backgroundColor: "#CA922B", borderRadius: 100, height: 54,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginBottom: 14, shadowColor: "#CA922B", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
  skipBtn: { alignItems: "center", paddingVertical: 12, marginBottom: 16 },
  skipText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  note: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", lineHeight: 17, opacity: 0.7 },
});
