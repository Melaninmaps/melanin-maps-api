import React, { useState, useCallback, useRef } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSearchHistory } from "@/hooks/useSearchHistory";

interface Business { id: string; name: string; category: string; city: string; verified: boolean; description?: string }
interface Event { id: string; title: string; category: string; city: string; event_date: string }
interface Article { id: string; title: string; category: string; excerpt?: string }
interface JourneySuggestion { type: string; message: string }

interface SearchResults {
  query: string;
  intent: string;
  contextNote: string;
  suggestedCategories: string[];
  results: {
    businesses?: Business[];
    events?: Event[];
    articles?: Article[];
    journeySuggestion?: JourneySuggestion;
  };
}

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
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const inputRef = useRef<TextInput>(null);
  const primaryGold = "#CA922B";
  const { history, add: addHistory } = useSearchHistory("smart");

  const getApiBase = () =>
    process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const recentCats = history.flatMap((h) => h.categories).slice(0, 10).join(",");
      const params = new URLSearchParams({ q });
      if (recentCats) params.set("recentCategories", recentCats);
      const res = await fetch(`${getApiBase()}/api/search/intent?${params.toString()}`);
      if (res.ok) {
        const data = await res.json() as SearchResults;
        setResults(data);
        void addHistory(q, data.suggestedCategories ?? []);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [history, addHistory]);

  const handleExampleTap = (q: string) => {
    setQuery(q);
    void search(q);
  };

  const totalResults = results
    ? (results.results.businesses?.length ?? 0) + (results.results.events?.length ?? 0) + (results.results.articles?.length ?? 0)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.searchRow]}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={[styles.searchInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="I need a realtor... I have diabetes... I'm moving..."
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => void search(query)}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity activeOpacity={0.85} onPress={() => { setQuery(""); setResults(null); }}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.searchBtn, { backgroundColor: primaryGold, opacity: loading || !query.trim() ? 0.6 : 1 }]}
            onPress={() => void search(query)}
            disabled={loading || !query.trim()}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="arrow-right" size={16} color="#fff" />}
          </TouchableOpacity>
        </View>

        {results && (
          <View style={[styles.intentBanner, { backgroundColor: primaryGold + "15", borderColor: primaryGold + "30" }]}>
            <Text style={[styles.intentText, { color: primaryGold }]}>✨ {results.contextNote}</Text>
            {totalResults > 0 && <Text style={[styles.intentCount, { color: colors.mutedForeground }]}>{totalResults} results</Text>}
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
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
                Ask in plain language — search "I need a realtor" and get realtors, mortgage lenders, home inspectors, and neighborhood guides all at once. One question, every resource.
              </Text>
            </View>
          </>
        )}

        {results && (
          <>
            {results.results.journeySuggestion && (
              <TouchableOpacity
                style={[styles.journeyCard, { backgroundColor: primaryGold + "10", borderColor: primaryGold + "40" }]}
                onPress={() => router.push("/life-journey" as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.journeyCardIcon}>🗺️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.journeyCardTitle, { color: primaryGold }]}>Start a Journey</Text>
                  <Text style={[styles.journeyCardBody, { color: colors.foreground }]}>{results.results.journeySuggestion.message}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={primaryGold} />
              </TouchableOpacity>
            )}

            {results.suggestedCategories.length > 0 && (
              <View style={styles.categoriesRow}>
                {results.suggestedCategories.map((cat) => (
                  <View key={cat} style={[styles.catChip, { backgroundColor: primaryGold + "15", borderColor: primaryGold + "30" }]}>
                    <Text style={[styles.catChipText, { color: primaryGold }]}>{cat}</Text>
                  </View>
                ))}
              </View>
            )}

            {(results.results.businesses?.length ?? 0) > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🏪 Businesses</Text>
                {results.results.businesses!.map((biz) => (
                  <TouchableOpacity
                    key={biz.id}
                    style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push(`/business/${biz.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.resultCardTitle}>
                        <Text style={[styles.resultName, { color: colors.foreground }]}>{biz.name}</Text>
                        {biz.verified && (
                          <View style={[styles.verifiedBadge, { backgroundColor: "#16A34A20" }]}>
                            <Text style={{ fontSize: 10, color: "#16A34A", fontWeight: "700" }}>✓ Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>{biz.category} · {biz.city}</Text>
                      {biz.description && <Text style={[styles.resultDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{biz.description}</Text>}
                    </View>
                    <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {(results.results.events?.length ?? 0) > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📅 Events</Text>
                {results.results.events!.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push(`/event/${event.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { color: colors.foreground }]}>{event.title}</Text>
                      <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>
                        {event.category} · {event.city} · {new Date(event.event_date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {(results.results.articles?.length ?? 0) > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📖 Articles & Resources</Text>
                {results.results.articles!.map((article) => (
                  <TouchableOpacity
                    key={article.id}
                    style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { color: colors.foreground }]}>{article.title}</Text>
                      <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>{article.category}</Text>
                      {article.excerpt && <Text style={[styles.resultDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{article.excerpt}</Text>}
                    </View>
                    <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {totalResults === 0 && (
              <View style={[styles.noResults, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.noResultsIcon}>🔍</Text>
                <Text style={[styles.noResultsTitle, { color: colors.foreground }]}>No results yet</Text>
                <Text style={[styles.noResultsSub, { color: colors.mutedForeground }]}>
                  Try rephrasing your search or ask KinfolkAI™ directly — it knows the community.
                </Text>
                <TouchableOpacity activeOpacity={0.85}
                  style={[styles.kinfolkBtn, { backgroundColor: primaryGold }]}
                  onPress={() => router.push("/travel" as any)}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Ask KinfolkAI™ instead</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  searchBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
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
  kinfolkBtn: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  recentSection: { marginBottom: 20 },
  recentHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  recentLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  recentChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  recentChipText: { fontSize: 13, fontWeight: "500", maxWidth: 160 },
});
