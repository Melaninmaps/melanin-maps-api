import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

type MeetingType = { id: string; label: string; color: string; abbreviation: string };
const MEETING_TYPES: MeetingType[] = [
  { id: "all",    label: "All Types",          color: "#CA922B", abbreviation: "" },
  { id: "aa",     label: "Alcoholics Anonymous",  color: "#2563EB", abbreviation: "AA" },
  { id: "na",     label: "Narcotics Anonymous",   color: "#059669", abbreviation: "NA" },
  { id: "alanon", label: "Al-Anon / Alateen",     color: "#7C3AED", abbreviation: "Al-Anon" },
  { id: "smart",  label: "SMART Recovery",         color: "#DC2626", abbreviation: "SMART" },
  { id: "ca",     label: "Cocaine Anonymous",      color: "#0891B2", abbreviation: "CA" },
  { id: "oa",     label: "Overeaters Anonymous",   color: "#D97706", abbreviation: "OA" },
];

type Facility = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  distance?: number;
  lat?: number;
  lng?: number;
  services?: string[];
  website?: string;
};

const OFFICIAL_FINDERS = [
  { id: "aa",     label: "AA Meeting Finder",        url: "https://www.aa.org/find-aa",            color: "#2563EB", icon: "external-link" as const },
  { id: "na",     label: "NA Meeting Search",         url: "https://www.na.org/meetingsearch",       color: "#059669", icon: "external-link" as const },
  { id: "alanon", label: "Al-Anon Meeting Finder",   url: "https://al-anon.org/al-anon-meetings",  color: "#7C3AED", icon: "external-link" as const },
  { id: "smart",  label: "SMART Recovery Meetings",  url: "https://www.smartrecovery.org/community/calendar.php", color: "#DC2626", icon: "external-link" as const },
];

export default function NaAaMeetingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [results, setResults] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [usingLocation, setUsingLocation] = useState(false);

  const search = useCallback(async (zip: string) => {
    if (!zip.trim()) {
      Alert.alert("Enter a location", "Type a city name or ZIP code to search.");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ location: zip.trim(), radius: "25" });
      if (selectedType !== "all") params.set("type", selectedType);
      const res = await fetch(`${getApiBase()}/api/wellness/meetings?${params}`);
      if (res.ok) {
        const data = await res.json() as { facilities: Facility[] };
        setResults(data.facilities ?? []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  const useCurrentLocation = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not available", "Location access is only available on the mobile app.");
      return;
    }
    setUsingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Enable location access in Settings to find nearby meetings.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const zip = geo?.postalCode ?? "";
      if (zip) {
        setQuery(zip);
        await search(zip);
      } else {
        Alert.alert("Location error", "Unable to determine your ZIP code. Please type it manually.");
      }
    } catch {
      Alert.alert("Error", "Failed to get your location. Please type a ZIP code or city name.");
    } finally {
      setUsingLocation(false);
    }
  };

  const openDirections = (facility: Facility) => {
    const addr = encodeURIComponent(`${facility.name}, ${facility.address}, ${facility.city}, ${facility.state}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${addr}`;
    Linking.openURL(url).catch(() => Alert.alert("Unable to open Maps"));
  };

  const callFacility = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\D/g, "")}`).catch(() =>
      Alert.alert("Unable to call", phone)
    );
  };

  const openOfficialSite = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert("Unable to open link"));
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Recovery Meetings</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Find NA, AA, Al-Anon & more near you
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Search bar */}
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="City or ZIP code…"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
            onSubmitEditing={() => void search(query)}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Location button */}
        <TouchableOpacity
          style={[styles.locationBtn, { borderColor: colors.border }]}
          onPress={() => void useCurrentLocation()}
          disabled={usingLocation}
          activeOpacity={0.8}
        >
          {usingLocation ? (
            <ActivityIndicator size="small" color="#CA922B" />
          ) : (
            <Feather name="navigation" size={16} color="#CA922B" />
          )}
          <Text style={[styles.locationBtnText, { color: colors.foreground }]}>
            {usingLocation ? "Getting location…" : "Use my current location"}
          </Text>
        </TouchableOpacity>

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {MEETING_TYPES.map((t) => {
            const active = selectedType === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.filterChip, { backgroundColor: active ? t.color : colors.card, borderColor: active ? t.color : colors.border }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setSelectedType(t.id);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, { color: active ? "#fff" : colors.foreground }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search button */}
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: "#CA922B", opacity: loading ? 0.6 : 1 }]}
          onPress={() => void search(query)}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="search" size={16} color="#fff" />
          )}
          <Text style={styles.searchBtnText}>Search Meetings</Text>
        </TouchableOpacity>

        {/* Results */}
        {searched && !loading && (
          results.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="map-pin" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Try a different ZIP code, city, or meeting type. Use the official finders below for more options.
              </Text>
            </View>
          ) : (
            <View style={styles.resultsSection}>
              <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>
                {results.length} location{results.length !== 1 ? "s" : ""} found
              </Text>
              {results.map((f, i) => (
                <View key={i} style={[styles.facilityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.facilityHeader}>
                    <View style={[styles.facilityIcon, { backgroundColor: "#CA922B18" }]}>
                      <Feather name="map-pin" size={18} color="#CA922B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.facilityName, { color: colors.foreground }]} numberOfLines={2}>{f.name}</Text>
                      <Text style={[styles.facilityAddr, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {f.address}, {f.city}, {f.state} {f.zip}
                      </Text>
                      {f.distance !== undefined && (
                        <Text style={[styles.facilityDist, { color: "#CA922B" }]}>{f.distance.toFixed(1)} mi away</Text>
                      )}
                    </View>
                  </View>
                  {f.services && f.services.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {f.services.slice(0, 5).map((s, j) => (
                          <View key={j} style={[styles.serviceChip, { backgroundColor: colors.secondary }]}>
                            <Text style={[styles.serviceChipText, { color: colors.mutedForeground }]}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                  <View style={styles.facilityActions}>
                    <TouchableOpacity style={[styles.facilityBtn, { borderColor: colors.border }]} onPress={() => openDirections(f)} activeOpacity={0.8}>
                      <Feather name="navigation" size={14} color="#2563EB" />
                      <Text style={[styles.facilityBtnText, { color: "#2563EB" }]}>Directions</Text>
                    </TouchableOpacity>
                    {f.phone && (
                      <TouchableOpacity style={[styles.facilityBtn, { borderColor: colors.border }]} onPress={() => callFacility(f.phone!)} activeOpacity={0.8}>
                        <Feather name="phone" size={14} color="#059669" />
                        <Text style={[styles.facilityBtnText, { color: "#059669" }]}>Call</Text>
                      </TouchableOpacity>
                    )}
                    {f.website && (
                      <TouchableOpacity style={[styles.facilityBtn, { borderColor: colors.border }]} onPress={() => openOfficialSite(f.website!)} activeOpacity={0.8}>
                        <Feather name="external-link" size={14} color="#7C3AED" />
                        <Text style={[styles.facilityBtnText, { color: "#7C3AED" }]}>Website</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )
        )}

        {/* Official finders */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Official Meeting Finders</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            The official directories include meeting schedules, formats (open/closed, speaker, discussion), and virtual options.
          </Text>
          {OFFICIAL_FINDERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.officialCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openOfficialSite(f.url)}
              activeOpacity={0.85}
            >
              <View style={[styles.officialIcon, { backgroundColor: f.color + "18" }]}>
                <Feather name="globe" size={20} color={f.color} />
              </View>
              <Text style={[styles.officialLabel, { color: colors.foreground }]}>{f.label}</Text>
              <Feather name="external-link" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Helpline reminder */}
        <TouchableOpacity
          style={styles.samhsaBanner}
          onPress={() => Linking.openURL("tel:18006624357")}
          activeOpacity={0.9}
        >
          <View>
            <Text style={styles.samhsaTitle}>Need help finding treatment?</Text>
            <Text style={styles.samhsaSub}>SAMHSA Helpline · 1-800-662-4357 · Free & Confidential · 24/7</Text>
          </View>
          <Feather name="phone" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Mental health link */}
        <TouchableOpacity
          style={[styles.mhLink, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/mental-health" as Parameters<typeof router.push>[0])}
          activeOpacity={0.85}
        >
          <Feather name="heart" size={18} color="#DC2626" />
          <Text style={[styles.mhLinkText, { color: colors.foreground }]}>View Mental Health Crisis Resources</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 1 },
  scroll: { padding: 20, gap: 16 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  locationBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  locationBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  filterScroll: { marginHorizontal: -20 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  searchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
  searchBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  emptyBox: { alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, padding: 28 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, textAlign: "center" },
  resultsSection: { gap: 12 },
  resultsLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  facilityCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  facilityHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  facilityIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  facilityName: { fontFamily: "Inter_700Bold", fontSize: 14, lineHeight: 19 },
  facilityAddr: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 2 },
  facilityDist: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 3 },
  serviceChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  serviceChipText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  facilityActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  facilityBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  facilityBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  section: { gap: 10 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  sectionSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  officialCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  officialIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  officialLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  samhsaBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#059669", borderRadius: 16, padding: 18, gap: 12 },
  samhsaTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  samhsaSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#fff", opacity: 0.85, marginTop: 2 },
  mhLink: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  mhLinkText: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
});
