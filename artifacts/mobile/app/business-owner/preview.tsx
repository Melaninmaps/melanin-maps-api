import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

type ManagedBusinessListResponse = { businesses?: unknown };

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

export default function BusinessPreviewScreen() {
  const { businessId: requestedBusinessId } = useLocalSearchParams<{ businessId?: string | string[] }>();
  const { user } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accountContextKey = user?.id ?? "anonymous";
  const selectionContextKey = `${accountContextKey}:${typeof requestedBusinessId === "string" ? `selected:${requestedBusinessId}` : Array.isArray(requestedBusinessId) ? "invalid-array" : "fallback"}`;
  const requestIdRef = useRef(0);
  const activeContextRef = useRef<string | null>(null);
  const resolvedContextRef = useRef<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedBusinessId = resolvedContextRef.current === selectionContextKey ? businessId : null;

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let cancelled = false;
    activeContextRef.current = selectionContextKey;
    resolvedContextRef.current = null;
    setBusinessId(null);
    setError(null);
    setLoading(true);
    const isCurrent = () => !cancelled && requestId === requestIdRef.current && activeContextRef.current === selectionContextKey;
    void (async () => {
      try {
        const headers = await getMemberApiHeaders();
        if (!isCurrent()) return;
        const res = await fetch(`${getApiBase()}/api/businesses/mine/managed`, { headers });
        if (!isCurrent()) return;
        if (!res.ok) {
          setError("Could not verify your managed business");
          return;
        }
        const data = (await res.json().catch(() => null)) as ManagedBusinessListResponse | null;
        if (!isCurrent()) return;
        const selectedBusinessId = selectManagedBusinessId(data, requestedBusinessId);
        if (!selectedBusinessId) {
          setError("No managed business listing found");
          return;
        }
        resolvedContextRef.current = selectionContextKey;
        setBusinessId(selectedBusinessId);
      } catch {
        if (isCurrent()) setError("Failed to load preview");
      } finally {
        if (isCurrent()) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      requestIdRef.current += 1;
      if (activeContextRef.current === selectionContextKey) activeContextRef.current = null;
    };
  }, [requestedBusinessId, selectionContextKey]);

  useEffect(() => {
    if (!resolvedBusinessId || activeContextRef.current !== selectionContextKey || resolvedContextRef.current !== selectionContextKey) return;
    router.replace({ pathname: "/business/[id]", params: { id: resolvedBusinessId, preview: "1" } });
  }, [resolvedBusinessId, router, selectionContextKey]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Public Preview</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading your public listing…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>{error}</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={[styles.backLink, { borderColor: colors.border }]}>
            <Text style={[styles.backLinkText, { color: colors.primary }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Opening preview…</Text>
        </View>
      )}

      <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={styles.bannerWrap}>
        <View style={[styles.banner, { backgroundColor: "#2D7A4F15", borderColor: "#2D7A4F40" }]}>
          <Feather name="eye" size={14} color="#2D7A4F" />
          <Text style={styles.bannerText}>
            This is exactly what community members see when they find your business.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 30 },
  title: { fontFamily: "Inter_700Bold", fontSize: 17 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  errorText: { fontFamily: "Inter_600SemiBold", fontSize: 16, textAlign: "center" },
  backLink: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  backLinkText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  bannerWrap: { paddingHorizontal: 16, paddingBottom: 24 },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bannerText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#2D7A4F", flex: 1, lineHeight: 20 },
});
