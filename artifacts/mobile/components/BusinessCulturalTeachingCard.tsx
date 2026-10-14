import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

type MemberTeaching = { title: string; text: string; sourceLabel: string };

function isMemberTeaching(value: unknown): value is MemberTeaching {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.title === "string" && typeof candidate.text === "string" && typeof candidate.sourceLabel === "string";
}

/** The read/not-now choice remains only in this mounted component's local state. */
export function BusinessCulturalTeachingCard({ businessId, isAuthenticated }: { businessId: string; isAuthenticated: boolean }) {
  const colors = useColors();
  const [teaching, setTeaching] = useState<MemberTeaching | null>(null);
  const [checked, setChecked] = useState(false);
  const [reading, setReading] = useState(false);
  const [notNow, setNotNow] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !businessId) {
      setTeaching(null);
      setChecked(true);
      return () => { active = false; };
    }
    void (async () => {
      try {
        const headers = await getMemberApiHeaders();
        const response = await fetch(
          `${getApiBase()}/api/businesses/${encodeURIComponent(businessId)}/cultural-teaching`,
          { headers, cache: "no-store" },
        );
        if (!response.ok) return;
        const payload = (await response.json().catch(() => ({}))) as { teaching?: unknown };
        if (active && isMemberTeaching(payload.teaching)) setTeaching(payload.teaching);
      } catch {
        // Nonavailability remains quiet and leaves no visible empty state.
      } finally {
        if (active) setChecked(true);
      }
    })();
    return () => { active = false; };
  }, [businessId, isAuthenticated]);

  if (!isAuthenticated || !checked || !teaching || notNow) return null;

  return (
    <View style={[styles.card, { backgroundColor: `${colors.primary}0D`, borderColor: `${colors.primary}45` }]} testID="business-cultural-teaching-card">
      {!reading ? (
        <View style={styles.invitation}>
          <View style={styles.copyRow}>
            <Feather name="book-open" size={19} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={[styles.copy, { color: colors.foreground }]}>This business chose to share a short teaching in its own words. Reading is optional.</Text>
          </View>
          <View style={styles.choiceRow}>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={() => setReading(true)}><Text style={[styles.read, { color: colors.primary }]}>Read optional teaching</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={() => setNotNow(true)}><Text style={[styles.notNow, { color: colors.mutedForeground }]}>Not now</Text></TouchableOpacity>
          </View>
        </View>
      ) : (
        <View>
          <Text style={[styles.source, { color: colors.primary }]}>{teaching.sourceLabel}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{teaching.title}</Text>
          <Text style={[styles.teaching, { color: colors.mutedForeground }]}>{teaching.text}</Text>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={() => setNotNow(true)} style={styles.afterRead}><Text style={[styles.read, { color: colors.primary }]}>Not now</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, borderWidth: 1, borderRadius: 14, padding: 14 }, invitation: { gap: 12 }, copyRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" }, copy: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 }, choiceRow: { flexDirection: "row", gap: 18, paddingLeft: 29 }, read: { fontFamily: "Inter_700Bold", fontSize: 13 }, notNow: { fontFamily: "Inter_600SemiBold", fontSize: 13 }, source: { fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }, title: { fontFamily: "Inter_700Bold", fontSize: 17, marginTop: 3 }, teaching: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, marginTop: 7 }, afterRead: { alignSelf: "flex-start", marginTop: 12 },
});
