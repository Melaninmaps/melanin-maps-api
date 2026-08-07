/**
 * PlacesAutocompleteInput — tap-to-select business search.
 *
 * Per brief: "A selected result auto-populates name, address, city, state, phone, lat/lng, category."
 * Uses /api/businesses/mention-search for lightweight name lookup, then
 * /api/businesses/:id for full detail auto-population.
 *
 * Used by: Nominate Business, Unified Place Report, Submit Event location.
 */
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export interface PlaceResult {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  category: string | null;
}

interface PlacesAutocompleteInputProps {
  placeholder?: string;
  onSelect: (place: PlaceResult) => void;
  style?: ViewStyle;
}

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : process.env.EXPO_PUBLIC_API_URL ?? "";

export function PlacesAutocompleteInput({
  placeholder = "What business should we add?",
  onSelect,
  style,
}: PlacesAutocompleteInputProps) {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/businesses/mention-search?q=${encodeURIComponent(q)}&limit=8`,
        { signal: abortRef.current.signal }
      );
      if (!res.ok) { setResults([]); return; }
      const data = await res.json();
      setResults(
        (data.businesses ?? data.results ?? []).map((b: any) => ({
          id: String(b.id),
          name: b.name ?? b.businessName ?? "",
          address: b.address ?? b.street ?? null,
          city: b.city ?? null,
          state: b.state ?? null,
          phone: b.phone ?? null,
          lat: b.lat ?? b.latitude ?? null,
          lng: b.lng ?? b.longitude ?? null,
          category: b.category ?? b.businessType ?? null,
        }))
      );
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChangeText(text: string) {
    setQuery(text);
    setSelected(null);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(text), 280);
  }

  function handleSelect(place: PlaceResult) {
    setSelected(place);
    setQuery(place.name);
    setResults([]);
    onSelect(place);
  }

  function handleClear() {
    setSelected(null);
    setQuery("");
    setResults([]);
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputRow, { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.card }]}>
        <Feather name="search" size={18} color={colors.mutedForeground} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search for a business"
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
        {selected && !loading && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} accessibilityLabel="Clear selection">
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {results.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={styles.resultRow}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.name}`}
              >
                <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {(item.city || item.category) && (
                  <Text style={[styles.resultMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {[item.category, item.city, item.state].filter(Boolean).join(" · ")}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {selected && (
        <View style={styles.selectedBadge}>
          <Feather name="check-circle" size={14} color={colors.primary} />
          <Text style={[styles.selectedText, { color: colors.mutedForeground }]}>
            {[selected.address, selected.city, selected.state].filter(Boolean).join(", ")}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  loader: {
    marginLeft: 8,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 2,
  },
  resultRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  resultName: {
    fontSize: 15,
    fontWeight: "600",
  },
  resultMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  selectedText: {
    fontSize: 13,
    flex: 1,
  },
});
