import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export interface BusinessResult {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
}

/** @deprecated – legacy prop kept for backwards-compat; pass query only */
export interface SelectedBusiness { id: string; name: string; }

interface Props {
  query: string;
  onSelect: (biz: BusinessResult) => void;
}

export function BusinessMentionPicker({ query, onSelect }: Props) {
  const colors = useColors();
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 1) { setResults([]); return; }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const token = (Platform.OS as string) !== "web"
          ? await SecureStore.getItemAsync("auth_session_token").catch(() => null)
          : null;
        const res = await fetch(
          `${getApiBase()}/api/businesses/mention-search?q=${encodeURIComponent(query)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!res.ok || cancelled) return;
        const data = await res.json() as { businesses: BusinessResult[] };
        if (!cancelled) setResults(data.businesses.slice(0, 6));
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const timer = setTimeout(() => void run(), 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  if (results.length === 0 && !loading) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <Feather name="briefcase" size={11} color={colors.primary} />
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>Businesses</Text>
      </View>
      {loading ? (
        <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /></View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
          {results.map(biz => (
            <TouchableOpacity
              key={biz.id}
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() => onSelect(biz)}
              activeOpacity={0.75}
            >
              <View style={[styles.icon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="map-pin" size={14} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.foreground }]}>{biz.name}</Text>
                {(biz.category || biz.city) && (
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                    {[biz.category, biz.city].filter(Boolean).join(" · ")}
                  </Text>
                )}
              </View>
              <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12, borderWidth: 1, marginBottom: 8, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderBottomWidth: 1,
  },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  loadingRow: { padding: 12, alignItems: "center" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1,
  },
  icon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
});
