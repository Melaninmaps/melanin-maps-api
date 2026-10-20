import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  getBusinessExperiencePolicy,
  getOwnerProfileExperienceChoices,
  normalizeOwnerExperienceKey,
  type BusinessExperienceChoice,
} from "@workspace/constants";

import { useAuth } from "@/lib/auth";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

type ManagedBusinessListResponse = { businesses?: unknown };
type SelectedManagedBusiness = {
  id: string;
  category?: string;
  subcategory?: string;
  vibes?: string[];
  priceRange?: string | null;
};

function selectManagedBusinessId(
  payload: ManagedBusinessListResponse | null,
  requestedBusinessId: string | string[] | undefined,
): string | null {
  if (!payload || !Array.isArray(payload.businesses)) return null;
  const managedIds = payload.businesses.map((business) => {
    if (!business || typeof business !== "object") return null;
    const id = (business as { id?: unknown }).id;
    return typeof id === "string" && id.length > 0 ? id : null;
  });
  if (managedIds.some((id) => id === null) || new Set(managedIds).size !== managedIds.length) return null;
  if (typeof requestedBusinessId === "string") return managedIds.includes(requestedBusinessId) ? requestedBusinessId : null;
  if (requestedBusinessId !== undefined) return null;
  return managedIds.length === 1 ? managedIds[0] : null;
}

function parseSelectedManagedBusiness(payload: unknown, businessId: string): SelectedManagedBusiness | null {
  if (!payload || typeof payload !== "object") return null;
  const business = (payload as { business?: unknown }).business;
  if (!business || typeof business !== "object") return null;
  const candidate = business as Record<string, unknown>;
  if (candidate.id !== businessId) return null;
  if (
    (candidate.category !== undefined && typeof candidate.category !== "string") ||
    (candidate.subcategory !== undefined && typeof candidate.subcategory !== "string") ||
    (candidate.priceRange !== undefined && candidate.priceRange !== null && typeof candidate.priceRange !== "string") ||
    (candidate.vibes !== undefined && (!Array.isArray(candidate.vibes) || !candidate.vibes.every((vibe) => typeof vibe === "string")))
  ) return null;
  return {
    id: businessId,
    category: candidate.category as string | undefined,
    subcategory: candidate.subcategory as string | undefined,
    vibes: candidate.vibes as string[] | undefined,
    priceRange: candidate.priceRange as string | null | undefined,
  };
}

export default function OwnerVibeTags() {
  const { businessId: requestedBusinessId } = useLocalSearchParams<{ businessId?: string | string[] }>();
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const accountContextKey = user?.id ?? "anonymous";
  const selectionContextKey = `${accountContextKey}:${typeof requestedBusinessId === "string" ? `selected:${requestedBusinessId}` : Array.isArray(requestedBusinessId) ? "invalid-array" : "fallback"}`;
  const requestIdRef = useRef(0);
  const activeContextRef = useRef<string | null>(null);
  const resolvedContextRef = useRef<string | null>(null);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [choices, setChoices] = useState<BusinessExperienceChoice[]>([]);
  const [priceChoices, setPriceChoices] = useState<BusinessExperienceChoice[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const resolvedBusinessId = resolvedContextRef.current === selectionContextKey ? businessId : null;

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current && activeContextRef.current === selectionContextKey;
    setBusinessId(null);
    setSelected([]);
    setChoices([]);
    setPriceChoices([]);
    setSelectedPrice(null);
    setSaving(false);
    setLoading(true);
    try {
      const headers = await getMemberApiHeaders();
      if (!isCurrent()) return;
      const managedResponse = await fetch(`${getApiBase()}/api/businesses/mine/managed`, { headers });
      if (!isCurrent() || !managedResponse.ok) return;
      const managedPayload = (await managedResponse.json().catch(() => null)) as ManagedBusinessListResponse | null;
      if (!isCurrent()) return;
      const selectedBusinessId = selectManagedBusinessId(managedPayload, requestedBusinessId);
      if (!selectedBusinessId) return;
      const profileResponse = await fetch(`${getApiBase()}/api/businesses/mine/managed/${encodeURIComponent(selectedBusinessId)}`, { headers });
      if (!isCurrent() || !profileResponse.ok) return;
      const profilePayload = await profileResponse.json().catch(() => null);
      if (!isCurrent()) return;
      const business = parseSelectedManagedBusiness(profilePayload, selectedBusinessId);
      if (!business || !isCurrent()) return;
      const policy = getBusinessExperiencePolicy(business.category, business.subcategory);
      const profileChoices = getOwnerProfileExperienceChoices(policy);
      resolvedContextRef.current = selectionContextKey;
      setBusinessId(business.id);
      setChoices(profileChoices);
      setPriceChoices(policy.priceChoices);
      setSelected((business.vibes ?? []).map(normalizeOwnerExperienceKey).filter((key) => profileChoices.some((choice) => choice.key === key)).slice(0, 2));
      setSelectedPrice(policy.priceChoices.find((choice) => choice.label === business.priceRange)?.key ?? null);
    } catch {
      // A malformed, unavailable, or stale account context remains empty by design.
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [requestedBusinessId, selectionContextKey]);

  useEffect(() => {
    activeContextRef.current = selectionContextKey;
    resolvedContextRef.current = null;
    void load();
    return () => {
      requestIdRef.current += 1;
      if (activeContextRef.current === selectionContextKey) activeContextRef.current = null;
    };
  }, [load, selectionContextKey]);

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= 2) {
        Alert.alert("Choose up to 2", "Remove one before adding another profile tag.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    const selectedBusinessId = resolvedBusinessId;
    const requestContext = activeContextRef.current;
    if (!selectedBusinessId || requestContext !== selectionContextKey) return;
    setSaving(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const headers = await getMemberApiHeaders();
      if (activeContextRef.current !== requestContext || resolvedContextRef.current !== requestContext) return;
      const res = await fetch(`${getApiBase()}/api/vibes/businesses/${selectedBusinessId}/owner-tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ vibes: selected, priceKey: selectedPrice }),
      });
      if (activeContextRef.current !== requestContext || resolvedContextRef.current !== requestContext) return;
      if (res.ok) {
        Alert.alert("Saved!", "Your experience tags and price point have been updated for search.");
      } else {
        const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
        Alert.alert("Error", typeof body?.error === "string" ? body.error : "Could not save. Please try again.");
      }
    } catch {
      if (activeContextRef.current === requestContext && resolvedContextRef.current === requestContext) {
        Alert.alert("Error", "Network error. Please try again.");
      }
    } finally {
      if (activeContextRef.current === requestContext) setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Business Experience Tags</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="zap" size={18} color="#5B6AF0" />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Select up to 2 honest profile tags. Restaurants can describe atmosphere; professionals can describe service. Community members add their own view separately.
          </Text>
        </View>

        {loading ? (
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading your vibes...</Text>
        ) : !resolvedBusinessId ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="alert-circle" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Business Found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Select one managed business before setting vibe tags.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {selected.length}/2 selected
            </Text>
            <View style={styles.grid}>
              {choices.map((vibe) => {
                const active = selected.includes(vibe.key);
                return (
                  <TouchableOpacity
                    key={vibe.key}
                    activeOpacity={0.8}
                    onPress={() => toggle(vibe.key)}
                    style={[
                      styles.vibeCard,
                      {
                        backgroundColor: active ? "#5B6AF015" : colors.secondary,
                        borderColor: active ? "#5B6AF0" : colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.vibeIconWrap, { backgroundColor: active ? "#5B6AF020" : colors.background }]}>
                      <Feather name="star" size={20} color={active ? "#5B6AF0" : colors.mutedForeground} />
                    </View>
                    <Text style={[styles.vibeLabel, { color: active ? "#5B6AF0" : colors.foreground }]}>
                      {vibe.label}
                    </Text>
                    <Text style={[styles.vibeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {vibe.helperText}
                    </Text>
                    {active && (
                      <View style={styles.checkBadge}>
                        <Feather name="check" size={11} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="dollar-sign" size={18} color="#5B6AF0" />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>Choose the usual price point customers should expect. Community members can also share their experience separately.</Text>
            </View>
            <View style={styles.grid}>
              {priceChoices.map((choice) => {
                const active = selectedPrice === choice.key;
                return (
                  <TouchableOpacity
                    key={choice.key}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPrice(active ? null : choice.key)}
                    style={[styles.vibeCard, { backgroundColor: active ? "#5B6AF015" : colors.secondary, borderColor: active ? "#5B6AF0" : colors.border }]}
                  >
                    <Text style={[styles.vibeLabel, { color: active ? "#5B6AF0" : colors.foreground }]}>{choice.label}</Text>
                    <Text style={[styles.vibeDesc, { color: colors.mutedForeground }]}>{choice.helperText}</Text>
                    {active && <View style={styles.checkBadge}><Feather name="check" size={11} color="#fff" /></View>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => void handleSave()}
              disabled={saving || !resolvedBusinessId}
              style={[styles.saveBtn, { backgroundColor: saving || !resolvedBusinessId ? colors.mutedForeground : "#5B6AF0" }]}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Experience Details"}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  infoText: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  loadingText: { fontSize: 14, textAlign: "center", marginTop: 40 },
  emptyCard: {
    alignItems: "center",
    gap: 10,
    padding: 28,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyText: { fontSize: 13.5, textAlign: "center", lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  vibeCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
    position: "relative",
  },
  vibeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  vibeLabel: { fontSize: 14, fontWeight: "700" },
  vibeDesc: { fontSize: 12, lineHeight: 17 },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#5B6AF0",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
