import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/lib/api";

type CitySignal = {
  city: string;
  state: string | null;
  avgScore: number;
  approvedSurveyCount: number;
  signal: "higher_reported_safety" | "mixed_reported_safety" | "lower_reported_safety";
  evidence: {
    confidence: "minimum_sample" | "larger_sample";
    observationCount: number;
  };
};

type CitySignalResponse = {
  dataStatus: "sufficient_evidence" | "insufficient_evidence";
  city: string;
  point: CitySignal | null;
  evidence: {
    source: "approved_neighborhood_survey_aggregate";
    geography: "city_aggregate_only";
    rawReportsIncluded: false;
    reporterLocationsIncluded: false;
    minimumApprovedSurveyCount: number;
    recencyWindowDays: number;
  };
};

function signalLabel(signal: CitySignal["signal"]): string {
  if (signal === "higher_reported_safety") return "Higher reported community experience";
  if (signal === "mixed_reported_safety") return "Mixed reported community experience";
  return "Lower reported community experience";
}

/**
 * A member-selected city aggregate only. This does not ask for device location,
 * display an incident map, or disclose any individual report or contributor.
 */
export default function ReportIntelligenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CitySignalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkCitySignal = async () => {
    const selectedCity = city.trim();
    if (!selectedCity) {
      setError("Enter a city to view its delayed, city-level community survey signal.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) {
        setError("Sign in to view protected community survey aggregates.");
        return;
      }
      const response = await fetch(
        `${getApiBase()}/api/safety/heatmap/city?city=${encodeURIComponent(selectedCity)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.status === 401) {
        setError("Your session has ended. Sign in again to view protected community survey aggregates.");
        return;
      }
      if (!response.ok) {
        setError("Community survey evidence is unavailable right now. No signal is shown.");
        return;
      }
      setResult(await response.json() as CitySignalResponse);
    } catch {
      setError("Community survey evidence is unavailable right now. No signal is shown.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community Intelligence</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.iconWrap, { backgroundColor: "#CA922B18" }]}>
          <Feather name="bar-chart-2" size={30} color="#CA922B" />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>City-level community survey signal</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Choose a city to see a delayed aggregate from recent approved neighborhood surveys, when enough people have contributed. This is not a safety guarantee or a live alert feed.</Text>

        <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noticeTitle, { color: colors.foreground }]}>Privacy boundary</Text>
          <Text style={[styles.noticeBody, { color: colors.mutedForeground }]}>Kinfolk does not request your device location here. Results contain no member locations, names, report text, incident addresses, timestamps, or activity history.</Text>
        </View>

        <Text style={[styles.inputLabel, { color: colors.foreground }]}>City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="For example, Philadelphia"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="City for Community Intelligence survey signal"
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          onSubmitEditing={() => void checkCitySignal()}
          returnKeyType="search"
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="View city-level community survey signal"
          style={[styles.action, { backgroundColor: colors.primary, opacity: loading ? 0.65 : 1 }]}
          disabled={loading}
          onPress={() => void checkCitySignal()}
        >
          {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="search" size={16} color={colors.primaryForeground} />}
          <Text style={[styles.actionText, { color: colors.primaryForeground }]}>{loading ? "Checking approved aggregates…" : "View city-level survey signal"}</Text>
        </TouchableOpacity>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        {result?.dataStatus === "insufficient_evidence" ? (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>Not enough recent approved community surveys</Text>
            <Text style={[styles.resultBody, { color: colors.mutedForeground }]}>No city signal is shown for {result.city}. This does not mean the city is safe or unsafe.</Text>
          </View>
        ) : null}

        {result?.dataStatus === "sufficient_evidence" && result.point ? (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: "#CA922B66" }]}>
            <Text style={[styles.resultTitle, { color: colors.foreground }]}>{result.point.city}{result.point.state ? `, ${result.point.state}` : ""}</Text>
            <Text style={[styles.score, { color: colors.primary }]}>{Math.round(result.point.avgScore)} / 100</Text>
            <Text style={[styles.resultBody, { color: colors.mutedForeground }]}>{signalLabel(result.point.signal)} based on {result.point.approvedSurveyCount} approved surveys in the last {result.evidence.recencyWindowDays} days. Confidence reflects response volume only.</Text>
            <Text style={[styles.boundary, { color: colors.mutedForeground }]}>Not a safety guarantee. No individual reports or member locations are shown.</Text>
          </View>
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Report a safety concern without location"
          style={[styles.secondaryAction, { borderColor: colors.border }]}
          onPress={() => router.push("/report-safety")}
        >
          <Feather name="file-text" size={16} color={colors.foreground} />
          <Text style={[styles.secondaryActionText, { color: colors.foreground }]}>Open moderated safety report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  backButton: { width: 36, minHeight: 36, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: 28, paddingTop: 36 },
  iconWrap: { width: 68, height: 68, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  title: { fontFamily: "Inter_700Bold", fontSize: 21, textAlign: "center" },
  body: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12 },
  notice: { width: "100%", borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 24 },
  noticeTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 6 },
  noticeBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  inputLabel: { width: "100%", fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 24, marginBottom: 7 },
  input: { width: "100%", minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontFamily: "Inter_400Regular", fontSize: 15 },
  action: { width: "100%", minHeight: 52, borderRadius: 14, marginTop: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  actionText: { fontFamily: "Inter_700Bold", fontSize: 15, textAlign: "center" },
  error: { width: "100%", marginTop: 12, color: "#B42318", fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18, textAlign: "center" },
  resultCard: { width: "100%", borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 18, gap: 7 },
  resultTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  score: { fontFamily: "Inter_700Bold", fontSize: 26 },
  resultBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  boundary: { fontFamily: "Inter_500Medium", fontSize: 11, lineHeight: 16, marginTop: 3 },
  secondaryAction: { width: "100%", minHeight: 50, borderWidth: 1, borderRadius: 14, marginTop: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  secondaryActionText: { fontFamily: "Inter_700Bold", fontSize: 14, textAlign: "center" },
});
