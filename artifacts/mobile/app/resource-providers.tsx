import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

type ProviderResource = {
  id: string;
  title: string;
  organization: string | null;
  description: string | null;
  sourceTier: "official" | "verified_org" | "community_confirmed" | "community_shared";
  url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  isNational: boolean;
};

type ProviderResponse = {
  label: string;
  providers: ProviderResource[];
  error?: string;
};

export default function ResourceProvidersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { service } = useLocalSearchParams<{ service?: string }>();
  const serviceKey = service === "financial-coaching" ? service : "financial-coaching";
  const [response, setResponse] = useState<ProviderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const request = await fetch(`${getApiBase()}/api/resources/providers/${serviceKey}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await request.json() as ProviderResponse;
      if (!request.ok) throw new Error(data.error ?? "Could not load providers");
      setResponse(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load providers");
    } finally {
      setLoading(false);
    }
  }, [serviceKey]);

  useEffect(() => { void loadProviders(); }, [loadProviders]);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const title = response?.label === "financial coaches" ? "Financial coaching" : "Support options";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: "#CA922B12", borderColor: "#CA922B35" }]}>
          <Feather name="heart" size={22} color="#CA922B" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Find support without leaving the app</Text>
            <Text style={[styles.heroText, { color: colors.mutedForeground }]}>We only show currently active, reviewed resources. We will not fill this page with unverified providers.</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#CA922B" /><Text style={[styles.statusText, { color: colors.mutedForeground }]}>Looking for reviewed support…</Text></View>
        ) : error ? (
          <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: "#FCA5A5" }]}>
            <Feather name="alert-circle" size={28} color="#B91C1C" />
            <Text style={[styles.stateTitle, { color: colors.foreground }]}>We could not load support options</Text>
            <Text style={[styles.stateText, { color: colors.mutedForeground }]}>{error}</Text>
            <TouchableOpacity onPress={() => void loadProviders()} style={styles.retry} accessibilityRole="button"><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
          </View>
        ) : response?.providers.length ? (
          <View style={styles.list}>
            {response.providers.map((provider) => (
              <View key={provider.id} style={[styles.providerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.providerHeading}>
                  <View style={styles.providerIcon}><Feather name="shield" size={16} color="#166534" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.providerTitle, { color: colors.foreground }]}>{provider.title}</Text>
                    {provider.organization ? <Text style={[styles.providerOrg, { color: colors.mutedForeground }]}>{provider.organization}</Text> : null}
                  </View>
                </View>
                {provider.description ? <Text style={[styles.providerDescription, { color: colors.mutedForeground }]}>{provider.description}</Text> : null}
                {(provider.isNational || provider.city || provider.state) ? <Text style={[styles.providerMeta, { color: colors.mutedForeground }]}>{provider.isNational ? "National resource" : [provider.city, provider.state].filter(Boolean).join(", ")}</Text> : null}
                <View style={styles.actions}>
                  {provider.url ? <TouchableOpacity style={styles.primaryAction} onPress={() => void Linking.openURL(provider.url!).catch(() => undefined)} accessibilityRole="link"><Feather name="external-link" size={14} color="#fff" /><Text style={styles.primaryActionText}>Visit resource</Text></TouchableOpacity> : null}
                  {provider.phone ? <TouchableOpacity style={[styles.secondaryAction, { borderColor: colors.border }]} onPress={() => void Linking.openURL(`tel:${provider.phone}`).catch(() => undefined)} accessibilityRole="link"><Feather name="phone" size={14} color={colors.foreground} /><Text style={[styles.secondaryActionText, { color: colors.foreground }]}>Call</Text></TouchableOpacity> : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={30} color={colors.mutedForeground} />
            <Text style={[styles.stateTitle, { color: colors.foreground }]}>No verified coaches are available here yet</Text>
            <Text style={[styles.stateText, { color: colors.mutedForeground }]}>There are no active, reviewed financial coaching resources matching this request. We have kept you in the app instead of sending you to an unrelated site.</Text>
            <TouchableOpacity onPress={() => router.replace("/(tabs)/resources" as never)} style={styles.retry} accessibilityRole="button"><Text style={styles.retryText}>Browse Resources</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 32, minHeight: 32, justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  hero: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 4 },
  heroText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  center: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 12 },
  statusText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  stateCard: { minHeight: 220, alignItems: "center", justifyContent: "center", padding: 26, borderWidth: 1, borderRadius: 18, gap: 10 },
  stateTitle: { fontFamily: "Inter_700Bold", fontSize: 16, textAlign: "center" },
  stateText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, textAlign: "center" },
  retry: { marginTop: 6, minHeight: 42, paddingHorizontal: 18, borderRadius: 21, backgroundColor: "#CA922B", alignItems: "center", justifyContent: "center" },
  retryText: { fontFamily: "Inter_700Bold", color: "#1C0E06", fontSize: 14 },
  list: { gap: 12 },
  providerCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  providerHeading: { flexDirection: "row", gap: 10, alignItems: "center" },
  providerIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#16A34A18" },
  providerTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  providerOrg: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  providerDescription: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  providerMeta: { fontFamily: "Inter_500Medium", fontSize: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  primaryAction: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 19, backgroundColor: "#2B1507" },
  primaryActionText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  secondaryAction: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 19, borderWidth: 1 },
  secondaryActionText: { fontFamily: "Inter_700Bold", fontSize: 13 },
});
