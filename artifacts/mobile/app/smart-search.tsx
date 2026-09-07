import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { checkConsentAndEmit, executeUniversalSearch, loadV1State, type DiscoveryRecordType, type DiscoveryResult } from "@/lib/discoveryV1";
import { getApiBase } from "@/lib/api";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";
import { useSearchHistory } from "@/hooks/useSearchHistory";

type SearchResults = {
  requestId: string;
  resultSetId: string;
  results: DiscoveryResult[];
  total: number;
  locationLabel?: string;
  capabilityMessage?: string;
  interpretedIntent?: string;
};

/** Extract an intentional City, ST scope when device location is unavailable. */
export function typedCityStateFallback(query: string): { city: string; stateRegion: string } | null {
  const match = query.trim().match(/(?:^|\b(?:in|near)\s+)([A-Za-z][A-Za-z .'-]{1,}),\s*([A-Za-z]{2})\b/i);
  return match ? { city: match[1].trim(), stateRegion: match[2].toUpperCase() } : null;
}

function resultRoute(result: DiscoveryResult): string {
  switch (result.recordType) {
    case "business": return `/business/${result.id}`;
    case "event": return `/event/${result.id}`;
    case "article":
    case "resource": return `/library-article?id=${result.id}`;
    case "cultural_site": return `/cultural-heritage?siteId=${result.id}`;
    case "community_place": return `/community-hub?placeId=${result.id}`;
    case "travel_destination": return `/travel?destinationId=${result.id}`;
  }
}

const RECORD_TYPE_LABELS: Record<DiscoveryRecordType, string> = {
  business: "Businesses", event: "Events", article: "Articles", resource: "Resources",
  cultural_site: "Cultural sites", community_place: "Community places", travel_destination: "Travel destinations",
};
 // Directory search remains the source of truth for ownership labels when supplied:
// Community/founder-listed · Unclaimed · Not verified
// Community-reported minority-owned · Not verified
// Community-reported non-minority-owned · Not verified

const EXAMPLE_QUERIES = [
  { label: "🏡 Moving to a new city", q: "I'm moving to a new city" },
  { label: "🩺 Find a doctor", q: "I need to find a doctor" },
  { label: "🍽️ Best food spots", q: "minority-owned restaurants near me" },
  { label: "🚀 Start a business", q: "I want to start a business" },
  { label: "✂️ Salon and barber", q: "hair salon and barber shop" },
  { label: "👶🏾 New parent resources", q: "I just had a baby" },
  { label: "💰 Financial advisor", q: "I need financial advice" },
  { label: "🎓 College resources", q: "college student looking for resources" },
];

export default function SmartSearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const inputRef = useRef<TextInput>(null);
  const primaryGold = "#CA922B";
  const { history, add: addHistory } = useSearchHistory("smart");

  useEffect(() => {
    const v1 = loadV1State();
    if (v1 && v1.q && !query) {
      setQuery(v1.q);
      if (v1.fullResults.length > 0) setResults({
        requestId: "", resultSetId: v1.resultSetId, results: v1.fullResults, total: v1.total,
        locationLabel: v1.area, capabilityMessage: v1.capabilityMessage, interpretedIntent: v1.intentType,
      });
    }
  }, []);

  useEffect(() => {
    if (!results) return;
    results.results.forEach((result, index) => {
      void checkConsentAndEmit({
        eventName: "result_exposed",
        idempotencyKey: `${results.resultSetId}-${result.id}-exposed`,
        surface: "smart_search",
        resultSetId: results.resultSetId,
        resultId: result.id,
        recordType: result.recordType,
        rank: index + 1,
      });
    });
  }, [results]);

  // Nomination modal state
  const [showNominate, setShowNominate] = useState(false);
  const [nominateName, setNominateName] = useState("");
  const [nominateCity, setNominateCity] = useState("");
  const [nominateStateField, setNominateStateField] = useState("");
  const [nominateLoading, setNominateLoading] = useState(false);
  const [nominateDone, setNominateDone] = useState(false);
  const [nominateMessage, setNominateMessage] = useState("");
  const [nominateError, setNominateError] = useState<string | null>(null);
  const [nominationRequestId, setNominationRequestId] = useState(() => Crypto.randomUUID());

  const openNominate = () => {
    setNominateName("");
    setNominateCity("");
    setNominateStateField("");
    setNominateDone(false);
    setNominateMessage("");
    setNominateError(null);
    setNominationRequestId(Crypto.randomUUID());
    setShowNominate(true);
  };

  const submitNomination = async () => {
    if (!nominateName.trim() || !nominateCity.trim() || !nominateStateField.trim()) {
      setNominateError("Please fill in business name, city, and state.");
      return;
    }
    setNominateLoading(true);
    setNominateError(null);
    try {
      const token = Platform.OS === "web"
        ? null
        : await SecureStore.getItemAsync("auth_session_token");
      if (!token) {
        setNominateError("Sign in with your approved community account to submit a business.");
        return;
      }
      const res = await fetch(`${getApiBase()}/api/community/business-submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": nominationRequestId,
        },
        body: JSON.stringify({
          name: nominateName.trim(),
          category: "General",
          city: nominateCity.trim(),
          state: nominateStateField.trim(),
          locationSource: "member_entered",
          sourceChannel: "expo_smart_search_nomination",
          clientRequestId: nominationRequestId,
        }),
      });
      if (res.status === 401 || res.status === 403) {
        const data = await res.json() as { error?: string };
        setNominateError(data.error ?? "An approved community account is required.");
      } else if (!res.ok) {
        setNominateError("Something went wrong. Please try again.");
      } else {
        const data = await res.json() as { message?: string };
        setNominateMessage(data.message ?? "Saved privately until a complete street address and public link are added.");
        setNominateDone(true);
      }
    } catch {
      setNominateError("Could not connect. Please try again.");
    } finally {
      setNominateLoading(false);
    }
  };

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearchError(null);
    try {
       let lat: number | undefined, lng: number | undefined;
       const typedLocation = !city.trim() ? typedCityStateFallback(q) : null;
       const effectiveCity = city.trim() || typedLocation?.city;
       const effectiveState = stateRegion.trim() || typedLocation?.stateRegion;
       if (!effectiveCity) try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = Number(loc.coords.latitude.toFixed(2));
          lng = Number(loc.coords.longitude.toFixed(2));
        }
      } catch {}

       const data = await executeUniversalSearch({
         query: q, surface: "smart_search", city: effectiveCity, stateRegion: effectiveState,
         latitude: lat, longitude: lng, radiusMiles: lat !== undefined ? 5 : undefined,
      });
       setResults(data);
       void addHistory(q, []);
    } catch (err: any) {
       setSearchError(err instanceof Error ? err.message : "Search is unavailable right now. Please try again.");
    } finally { setLoading(false); }
  }, [history, addHistory, city, stateRegion]);

  const handleExampleTap = (q: string) => {
    setQuery(q);
    void search(q);
  };

  const totalResults = results?.total ?? 0;
  const groupedResults = results?.results.reduce((groups, result) => {
    (groups[result.recordType] ??= []).push(result);
    return groups;
  }, {} as Partial<Record<DiscoveryRecordType, DiscoveryResult[]>>) ?? {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.searchRow]}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={[styles.searchInputWrap, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'column', alignItems: 'stretch', padding: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 10 }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: colors.foreground }}>Find a place</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, paddingTop: 4 }}>
              <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                ref={inputRef}
                style={[styles.searchInput, { color: colors.foreground, flex: 1 }]}
                placeholder="Describe what you need, or search by name"
                placeholderTextColor={colors.mutedForeground}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => void search(query)}
                returnKeyType="search"
                autoFocus
                accessibilityLabel="Search for a place"
              />
              {query.length > 0 && (
                <TouchableOpacity activeOpacity={0.85} onPress={() => { setQuery(""); setResults(null); }} accessibilityRole="button" accessibilityLabel="Clear search">
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.locationFields}>
              <TextInput
                style={[styles.locationInput, { color: colors.foreground, borderColor: colors.border }]}
                value={city}
                onChangeText={setCity}
                placeholder="City (optional)"
                placeholderTextColor={colors.mutedForeground}
                accessibilityLabel="Search city"
              />
              <TextInput
                style={[styles.stateInput, { color: colors.foreground, borderColor: colors.border }]}
                value={stateRegion}
                onChangeText={setStateRegion}
                placeholder="State"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                maxLength={2}
                accessibilityLabel="Search state"
              />
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.searchBtn, { backgroundColor: primaryGold, opacity: loading || !query.trim() ? 0.6 : 1 }]}
            onPress={() => void search(query)}
            disabled={loading || !query.trim()}
            accessibilityRole="button"
            accessibilityLabel="Submit search"
          >
            {loading ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Feather name="arrow-right" size={16} color={colors.primaryForeground} />}
          </TouchableOpacity>
        </View>
        {searchError && (
          <View style={[styles.errorBanner, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            <Text style={[styles.errorText, { color: colors.foreground }]}>{searchError}</Text>
            <TouchableOpacity onPress={() => void search(query)} accessibilityRole="button" accessibilityLabel="Retry search">
              <Text style={{ color: primaryGold, fontWeight: "700" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {results && (
          <View style={[styles.intentBanner, { backgroundColor: primaryGold + "15", borderColor: primaryGold + "30" }]}>
            <Text style={[styles.intentText, { color: primaryGold }]}>✨ {results.capabilityMessage ?? `Results${results.locationLabel ? ` near ${results.locationLabel}` : ""}`}</Text>
            {totalResults > 0 && <Text style={[styles.intentCount, { color: colors.mutedForeground }]}>{totalResults} results</Text>}
          </View>
        )}
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        {!results && !loading && (
          <>
            {history.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Feather name="clock" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.recentLabel, { color: colors.mutedForeground }]}>Recent searches</Text>
                </View>
                <View style={styles.examplesGrid}>
                  {history.slice(0, 6).map((h, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.recentChip, { backgroundColor: primaryGold + "12", borderColor: primaryGold + "35" }]}
                      onPress={() => { setQuery(h.query); void search(h.query); }}
                      activeOpacity={0.8}
                    >
                      <Feather name="rotate-ccw" size={11} color={primaryGold} />
                      <Text style={[styles.recentChipText, { color: primaryGold }]} numberOfLines={1}>{h.query}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={[styles.examplesTitle, { color: colors.foreground }]}>
              {history.length > 0 ? "Try something new" : "What are you looking for?"}
            </Text>
            <Text style={[styles.examplesSub, { color: colors.mutedForeground }]}>Try saying it naturally — I understand what you mean.</Text>
            <View style={styles.examplesGrid}>
              {EXAMPLE_QUERIES.map((ex, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.exampleChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleExampleTap(ex.q)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.exampleChipText, { color: colors.foreground }]}>{ex.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>🧠 Intent-Aware Search</Text>
              <Text style={[styles.infoBody, { color: colors.mutedForeground }]}>
                Ask in plain language — search &quot;I need a realtor&quot; and get realtors, mortgage lenders, home inspectors, and neighborhood guides all at once. One question, every resource.
              </Text>
            </View>
          </>
        )}

        {results && (
          <>
            {totalResults > 0 && (
              <TouchableOpacity
                style={[styles.mapButton, { backgroundColor: primaryGold }]}
                onPress={() => {
                  void checkConsentAndEmit({ eventName: "map_toggled", idempotencyKey: `${results.resultSetId}-map`, surface: "smart_search", resultSetId: results.resultSetId });
                  router.push("/(tabs)/map" as any);
                }}
                accessibilityRole="button"
                accessibilityLabel="View search results on map"
              >
                <Feather name="map" size={16} color={colors.primaryForeground} />
                <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>View on Map</Text>
              </TouchableOpacity>
            )}

            {(Object.entries(groupedResults) as [DiscoveryRecordType, DiscoveryResult[]][]).map(([recordType, records]) => (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{RECORD_TYPE_LABELS[recordType]}</Text>
                {records.map((result, rank) => (
                  <TouchableOpacity
                    key={`${recordType}-${result.id}`}
                    style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.85}
                    onPress={() => {
                      void checkConsentAndEmit({ eventName: "result_opened", idempotencyKey: `${results.resultSetId}-${result.id}-open`, surface: "smart_search", resultSetId: results.resultSetId, resultId: result.id, recordType, rank: rank + 1 });
                      router.push(resultRoute(result) as any);
                    }}
                    accessibilityRole="link"
                    accessibilityLabel={`Open ${result.title}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { color: colors.foreground }]}>{result.title}</Text>
                      {result.subtitle && <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>{result.subtitle}</Text>}
                      {result.matchReason && <Text style={[styles.resultDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{result.matchReason}</Text>}
                    </View>
                    <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {totalResults === 0 && (
              <View style={[styles.noResults, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.noResultsIcon}>🔍</Text>
                <Text style={[styles.noResultsTitle, { color: colors.foreground }]}>No results yet</Text>
                <Text style={[styles.noResultsSub, { color: colors.mutedForeground }]}>
                  Try rephrasing your search or ask KinfolkAI™ directly — it knows the community.
                </Text>
                <TouchableOpacity activeOpacity={0.85}
                  style={[styles.kinfolkBtn, { backgroundColor: primaryGold }]}
                  onPress={() => router.push(`/travel?q=${encodeURIComponent(query.trim())}` as any)}
                >
                  <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 14 }}>Ask KinfolkAI™ instead</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85}
                  style={[styles.nominateBtn, { borderColor: primaryGold }]}
                  onPress={openNominate}
                >
                  <Text style={{ color: primaryGold, fontWeight: "600", fontSize: 13 }}>Know a business that should be here? Nominate them →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Nominate a Business Modal ── */}
      <Modal visible={showNominate} transparent animationType="slide" onRequestClose={() => setShowNominate(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowNominate(false)} />
          <View style={[styles.nominateModal, { backgroundColor: colors.card }]}>
            <Text style={styles.nominateTitle}>Save a Business Tip</Text>
            <Text style={styles.nominateSub}>Save the name and city now, or use the complete form for immediate publication with a precise pin.</Text>

            {nominateDone ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>✓</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#2B1507" }}>Business tip saved</Text>
                <Text style={{ fontSize: 14, color: "#6B5240", textAlign: "center", lineHeight: 20 }}>
                  {nominateMessage}
                </Text>
                <TouchableOpacity
                  style={[styles.nominateSubmit, { backgroundColor: "#2B1507", marginTop: 20 }]}
                  onPress={() => { setShowNominate(false); router.push("/list-business" as never); }}
                >
                  <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 15 }}>Add details for an immediate pin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nominateSubmit, { backgroundColor: "#CA922B", marginTop: 20 }]}
                  onPress={() => setShowNominate(false)}
                >
                  <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 15 }}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.nominateLabel}>Business Name *</Text>
                <TextInput
                  style={styles.nominateInput}
                  value={nominateName}
                  onChangeText={setNominateName}
                  placeholder="e.g. Auntie Grace's Soul Kitchen"
                  placeholderTextColor="#B09070"
                  autoFocus
                />
                <Text style={styles.nominateLabel}>City *</Text>
                <TextInput
                  style={styles.nominateInput}
                  value={nominateCity}
                  onChangeText={setNominateCity}
                  placeholder="e.g. Los Angeles"
                  placeholderTextColor="#B09070"
                />
                <Text style={styles.nominateLabel}>State *</Text>
                <TextInput
                  style={styles.nominateInput}
                  value={nominateStateField}
                  onChangeText={setNominateStateField}
                  placeholder="e.g. CA"
                  placeholderTextColor="#B09070"
                  autoCapitalize="characters"
                  maxLength={2}
                />
                {nominateError && (
                  <Text style={{ color: "#C0392B", fontSize: 13, marginBottom: 8, lineHeight: 18 }}>{nominateError}</Text>
                )}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.nominateSubmit, { backgroundColor: nominateLoading ? "#C4A060" : "#CA922B" }]}
                  onPress={() => { void submitNomination(); }}
                  disabled={nominateLoading}
                >
                  {nominateLoading
                    ? <ActivityIndicator color={colors.primaryForeground} />
                    : <Text style={{ color: colors.primaryForeground, fontWeight: "700", fontSize: 15 }}>Save Business Tip</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  searchInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  locationFields: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 10 },
  locationInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  stateInput: { width: 72, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  searchBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  errorBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  mapButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, padding: 12, marginBottom: 14 },
  intentBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 4 },
  intentText: { fontSize: 12, fontWeight: "600", flex: 1 },
  intentCount: { fontSize: 12 },
  examplesTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  examplesSub: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  examplesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  exampleChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  exampleChipText: { fontSize: 13, fontWeight: "500" },
  infoCard: { borderRadius: 12, borderWidth: 1, padding: 16 },
  infoTitle: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  infoBody: { fontSize: 13, lineHeight: 19 },
  journeyCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14, gap: 12 },
  journeyCardIcon: { fontSize: 24 },
  journeyCardTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  journeyCardBody: { fontSize: 13, lineHeight: 18 },
  categoriesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  catChip: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  catChipText: { fontSize: 12, fontWeight: "600" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  resultCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 13, marginBottom: 8, gap: 10 },
  resultCardTitle: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  resultName: { fontSize: 15, fontWeight: "600" },
  resultMeta: { fontSize: 12, marginBottom: 3 },
  resultDesc: { fontSize: 13, lineHeight: 17 },
  verifiedBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  noResults: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center" },
  noResultsIcon: { fontSize: 40, marginBottom: 12 },
  noResultsTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  noResultsSub: { fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 16 },
  nominateBtn: { marginTop: 12, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  nominateModal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  nominateTitle: { fontSize: 20, fontWeight: "700", color: "#2B1507", marginBottom: 6 },
  nominateSub: { fontSize: 14, color: "#6B5240", lineHeight: 20, marginBottom: 20 },
  nominateLabel: { fontSize: 13, fontWeight: "600", color: "#2B1507", marginBottom: 6, marginTop: 12 },
  nominateInput: { borderWidth: 1, borderColor: "#DDD0C0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#2B1507", marginBottom: 4 },
  nominateSubmit: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  kinfolkBtn: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  recentSection: { marginBottom: 20 },
  recentHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  recentLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  recentChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  recentChipText: { fontSize: 13, fontWeight: "500", maxWidth: 160 },
});
