import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export interface LocationSelection {
  placeId?: string;
  locationTag: string;
  locationVenueName?: string;
  locationCity?: string;
  locationCountry?: string;
}

interface PlaceResult {
  id: string;
  name: string;
  venueName?: string | null;
  city?: string | null;
  country?: string | null;
  postCount: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (loc: LocationSelection) => void;
  initialValue?: string;
}

export function LocationPicker({ visible, onClose, onSelect, initialValue = "" }: Props) {
  const colors = useColors();
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${getApiBase()}/api/places/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json() as { results: PlaceResult[] };
          setResults(data.results ?? []);
        }
      } catch { /* network error */ }
      finally { setLoading(false); }
    }, 350);
  }, []);

  const handleSelect = (place: PlaceResult) => {
    const parts = [place.venueName ?? place.name, place.city, place.country].filter(Boolean);
    onSelect({
      placeId: place.id,
      locationTag: parts.join(", "),
      locationVenueName: place.venueName ?? place.name,
      locationCity: place.city ?? undefined,
      locationCountry: place.country ?? undefined,
    });
    onClose();
  };

  const handleManualEntry = () => {
    if (!query.trim()) return;
    onSelect({ locationTag: query.trim() });
    onClose();
  };

  const formatPlaceLabel = (p: PlaceResult) => {
    const parts = [p.venueName ?? p.name, p.city, p.country].filter(Boolean);
    return parts.join(" · ");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Tag a Location</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Hotel, restaurant, city or country — help others find safe spaces around the world.
          </Text>

          <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Feather name="map-pin" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="e.g. Hyatt São Paulo, Brazil"
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={search}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleManualEntry}
            />
            {loading && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.resultRow, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={[styles.resultIcon, { backgroundColor: colors.primary + "18" }]}>
                    <Feather name="map-pin" size={14} color={colors.primary} />
                  </View>
                  <View style={styles.resultText}>
                    <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>
                      {formatPlaceLabel(item)}
                    </Text>
                    <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>
                      {item.postCount} {item.postCount === 1 ? "post" : "posts"} from community
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <TouchableOpacity style={[styles.addRow, { borderTopColor: colors.border }]} onPress={handleManualEntry}>
                  <Feather name="plus-circle" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.addText, { color: colors.primary }]}>
                    Add "{query}" as a new place
                  </Text>
                </TouchableOpacity>
              }
            />
          )}

          {results.length === 0 && query.trim().length >= 2 && !loading && (
            <TouchableOpacity style={[styles.addRowFull, { borderColor: colors.border }]} onPress={handleManualEntry}>
              <Feather name="plus-circle" size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.addText, { color: colors.primary }]}>
                Tag "{query}" as location
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "80%", minHeight: 320 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontFamily: "Cormorant_700Bold", fontSize: 20 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 16, lineHeight: 18 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, padding: 0 },
  list: { maxHeight: 280 },
  resultRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  resultIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 },
  resultText: { flex: 1 },
  resultName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  resultMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  addRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  addRowFull: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginTop: 8 },
  addText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  cancelBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 12 },
  cancelText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
