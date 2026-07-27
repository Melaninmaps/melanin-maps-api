import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  if ((Platform.OS as string) === "web") return null;
  return SecureStore.getItemAsync("auth_session_token").catch(() => null);
}

export interface BusinessResult {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
}

/** @deprecated – legacy prop kept for backwards-compat */
export interface SelectedBusiness { id: string; name: string; }

interface Props {
  query: string;
  onSelect: (biz: BusinessResult) => void;
}

type NominateState = "idle" | "loading" | "done";

export function BusinessMentionPicker({ query, onSelect }: Props) {
  const colors = useColors();
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [nominateState, setNominateState] = useState<NominateState>("idle");

  useEffect(() => {
    setNominateState("idle");
    if (query.length < 1) { setResults([]); return; }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const token = await getToken();
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

  const handleNominate = async () => {
    if (nominateState !== "idle") return;
    setNominateState("loading");
    try {
      const token = await getToken();
      await fetch(`${getApiBase()}/api/businesses/search-inquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ businessName: query, notes: "Submitted via community @ mention picker" }),
      });
      setNominateState("done");
    } catch {
      setNominateState("idle");
    }
  };

  // Nothing to show yet
  if (query.length < 1) return null;

  // Loading spinner while fetching
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /></View>
      </View>
    );
  }

  // Results found
  if (results.length > 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <Feather name="briefcase" size={11} color={colors.primary} />
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>Businesses</Text>
        </View>
        <ScrollView
        keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
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
      </View>
    );
  }

  // No results — offer nomination if query is meaningful
  if (query.length < 2) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {nominateState === "done" ? (
        <View style={styles.nominateDone}>
          <Feather name="check-circle" size={16} color={colors.primary} />
          <Text style={[styles.nominateDoneText, { color: colors.primary }]}>
            Got it! We'll look into adding "{query}" to the platform.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.emptyRow}>
            <Feather name="search" size={14} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              "{query}" isn't on our platform yet
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.nominateBtn, { borderTopColor: colors.border, opacity: nominateState === "loading" ? 0.6 : 1 }]}
            onPress={() => void handleNominate()}
            disabled={nominateState === "loading"}
            activeOpacity={0.75}
          >
            {nominateState === "loading" ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="plus-circle" size={14} color={colors.primary} />
            )}
            <Text style={[styles.nominateBtnText, { color: colors.primary }]}>
              {nominateState === "loading" ? "Submitting…" : `Nominate "${query}" to join the platform`}
            </Text>
          </TouchableOpacity>
        </>
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
  emptyRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  nominateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 11, borderTopWidth: 1,
  },
  nominateBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  nominateDone: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  nominateDoneText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
});
