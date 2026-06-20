import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryPill } from "@/components/CategoryPill";
import { RatingStars } from "@/components/RatingStars";
import { SearchBar } from "@/components/SearchBar";
import { VerificationBadge } from "@/components/VerificationBadge";
import { CATEGORIES } from "@/constants/data";
import type { Business } from "@/constants/types";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinesses } from "@/hooks/useBusinesses";

const INITIAL_REGION = {
  latitude: 33.7,
  longitude: -84.38,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

export function MapTabView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();
  const mapRef = useRef<MapView>(null);

  const [locationGranted, setLocationGranted] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState<Business | null>(null);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setLocationGranted(status === "granted");
    });
  }, []);

  const { businesses } = useBusinesses();
  const filtered = businesses.filter((b) => {
    const matchesSearch =
      search.length === 0 ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || b.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const handleMarkerPress = (business: Business) => {
    setSelected(business);
    mapRef.current?.animateToRegion(
      {
        latitude: business.latitude,
        longitude: business.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      500
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
      >
        {filtered.map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.latitude, longitude: b.longitude }}
            onPress={() => handleMarkerPress(b)}
          >
            <View style={[styles.pin, { backgroundColor: selected?.id === b.id ? colors.primary : colors.card, borderColor: colors.primary }]}>
              <Feather
                name="map-pin"
                size={14}
                color={selected?.id === b.id ? colors.primaryForeground : colors.primary}
              />
            </View>
            <Callout tooltip><View /></Callout>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.overlay, { top: insets.top + 8 }]}>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              selected={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.myLocationBtn, { backgroundColor: colors.card, shadowColor: colors.foreground, bottom: (selected ? 200 : 100) + insets.bottom }]}
        onPress={() => {
          mapRef.current?.animateToRegion(INITIAL_REGION, 800);
          setSelected(null);
        }}
        activeOpacity={0.8}
      >
        <Feather name="navigation" size={20} color={colors.primary} />
      </TouchableOpacity>

      {selected && (
        <View style={[styles.selectedCard, { backgroundColor: colors.card, shadowColor: colors.foreground, bottom: insets.bottom + 90 }]}>
          <View style={styles.selectedTop}>
            <View style={styles.selectedInfo}>
              <Text style={[styles.selectedName, { color: colors.foreground }]} numberOfLines={1}>{selected.name}</Text>
              <View style={styles.selectedMeta}>
                <Text style={[styles.selectedCategory, { color: colors.primary }]}>{selected.category}</Text>
                {selected.verified && <VerificationBadge />}
              </View>
              <RatingStars rating={selected.rating} reviewCount={selected.reviewCount} size={12} />
              <Text style={[styles.selectedAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                {selected.city}, {selected.state}
              </Text>
            </View>
            <View style={styles.selectedActions}>
              <TouchableOpacity onPress={() => toggleSave(selected.id)} style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
                <Feather name="bookmark" size={18} color={isSaved(selected.id) ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/business/[id]", params: { id: selected.id } })}
                style={[styles.viewBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.viewText, { color: colors.primaryForeground }]}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { position: "absolute", left: 0, right: 0, gap: 10 },
  searchWrap: { paddingHorizontal: 16 },
  categoryScroll: { paddingHorizontal: 16, gap: 8 },
  pin: {
    width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
    borderWidth: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  myLocationBtn: {
    position: "absolute", right: 16, width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  selectedCard: {
    position: "absolute", left: 16, right: 16, borderRadius: 16, padding: 16,
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  selectedTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  selectedInfo: { flex: 1, gap: 4 },
  selectedName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  selectedMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectedCategory: { fontFamily: "Inter_500Medium", fontSize: 12 },
  selectedAddr: { fontFamily: "Inter_400Regular", fontSize: 12 },
  selectedActions: { gap: 8 },
  actionBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  viewBtn: { paddingHorizontal: 16, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  viewText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  dismissBtn: { position: "absolute", top: 10, right: 10 },
});
