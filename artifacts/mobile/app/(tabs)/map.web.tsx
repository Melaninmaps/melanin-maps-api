import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusinessCard } from "@/components/BusinessCard";
import { SearchBar } from "@/components/SearchBar";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinesses } from "@/hooks/useBusinesses";
import { sanitizeDirectoryPublicHandle } from "@/lib/mapDirectoryHandoff";

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();
  const [search, setSearch] = useState("");
  const params = useLocalSearchParams<{ directoryHandle?: string | string[] }>();
  const incomingDirectoryHandle = sanitizeDirectoryPublicHandle(params.directoryHandle);
  const [activeDirectoryHandle, setActiveDirectoryHandle] = useState(incomingDirectoryHandle);

  useEffect(() => {
    setActiveDirectoryHandle(incomingDirectoryHandle);
  }, [incomingDirectoryHandle]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  // Keep category records available through typed search without a crowded
  // row of shortcut tabs on the map surface.
  const { businesses } = useBusinesses({
    search,
    category: "All",
    handle: activeDirectoryHandle,
  });
  const filtered = businesses.filter((_b) => {
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Map</Text>
        <View style={[styles.mapNotice, { backgroundColor: colors.secondary }]}>
          <Feather name="map" size={14} color={colors.primary} />
          <Text style={[styles.mapNoticeText, { color: colors.primary }]}>Open on mobile for interactive map</Text>
        </View>
      </View>
      <View style={styles.searchRow}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>
      {activeDirectoryHandle && (
        <View style={[styles.activeHandle, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
          <Text style={[styles.activeHandleText, { color: colors.foreground }]}>Showing public listings for @{activeDirectoryHandle} / Mostrando resultados públicos para @{activeDirectoryHandle}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear public handle filter / Borrar filtro de usuario público"
            onPress={() => setActiveDirectoryHandle(null)}
          >
            <Text style={[styles.activeHandleClear, { color: colors.primary }]}>Clear / Borrar</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
        renderItem={({ item }) => (
          <BusinessCard
            business={item}
            onPress={() => router.push({ pathname: "/business/[id]", params: { id: item.id } })}
            isSaved={isSaved(item.id)}
            onToggleSave={() => toggleSave(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26 },
  mapNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  mapNoticeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  activeHandle: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  activeHandleText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12 },
  activeHandleClear: { fontFamily: "Inter_700Bold", fontSize: 12 },
  catRow: { flexShrink: 0 },
  catList: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  list: { paddingHorizontal: 16, paddingTop: 12 },
});
