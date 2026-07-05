import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";
function getApiBase(): string {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    const domain = process.env.EXPO_PUBLIC_DEV_API_URL ?? "";
    if (domain) return domain;
  }
  return "";
}

export default function BusinessPreviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const res = await fetch(`${getApiBase()}/api/businesses/mine`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Could not load your business");
        const data = await res.json() as { business?: { id: string } };
        if (data.business?.id) {
          setBusinessId(data.business.id);
        } else {
          setError("No business listing found");
        }
      } catch {
        setError("Failed to load preview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (businessId) {
      router.replace({ pathname: "/business/[id]", params: { id: businessId, preview: "1" } });
    }
  }, [businessId, router]);

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

      <ScrollView contentContainerStyle={styles.bannerWrap}>
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
