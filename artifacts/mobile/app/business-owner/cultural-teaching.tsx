import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

const MAX_WORDS = 90;
type OwnerTeaching = { title: string; text: string; active: boolean };

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export default function BusinessCulturalTeachingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [teaching, setTeaching] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const words = useMemo(() => countWords(teaching), [teaching]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const base = getApiBase();
      const headers = await getMemberApiHeaders();
      const mineResponse = await fetch(`${base}/api/businesses/mine`, { headers, cache: "no-store" });
      const mine = (await mineResponse.json().catch(() => ({}))) as {
        business?: { id?: string; name?: string } | null;
        error?: string;
      };
      if (!mineResponse.ok || !mine.business?.id) {
        throw new Error(mine.error ?? "An approved business owner link is required.");
      }
      const id = mine.business.id;
      const response = await fetch(
        `${base}/api/businesses/${encodeURIComponent(id)}/cultural-teaching/owner`,
        { headers, cache: "no-store" },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        teaching?: OwnerTeaching | null;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Could not load the teaching.");
      setBusinessId(id);
      setBusinessName(mine.business.name?.trim() || null);
      setTitle(payload.teaching?.title ?? "");
      setTeaching(payload.teaching?.text ?? "");
      setSaved(payload.teaching?.active === true);
    } catch (error) {
      setBusinessId(null);
      setSaved(false);
      setMessage(error instanceof Error ? error.message : "Could not load the teaching.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!businessId || !confirmed || words > MAX_WORDS) return;
    setSaving(true);
    setMessage(null);
    try {
      const base = getApiBase();
      const headers = await getMemberApiHeaders();
      const response = await fetch(
        `${base}/api/businesses/${encodeURIComponent(businessId)}/cultural-teaching/owner`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ title, teaching, ownerConfirmed: true }),
          cache: "no-store",
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        teaching?: OwnerTeaching;
        error?: string;
      };
      if (!response.ok || !payload.teaching) throw new Error(payload.error ?? "Could not save the teaching.");
      setTitle(payload.teaching.title);
      setTeaching(payload.teaching.text);
      setSaved(true);
      setConfirmed(false);
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessage("Saved. It is available only on this business’s detail page.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the teaching.");
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async () => {
    if (!businessId) return;
    setWithdrawing(true);
    setMessage(null);
    try {
      const base = getApiBase();
      const headers = await getMemberApiHeaders();
      const response = await fetch(
        `${base}/api/businesses/${encodeURIComponent(businessId)}/cultural-teaching/owner`,
        { method: "DELETE", headers, cache: "no-store" },
      );
      if (!response.ok) throw new Error("Could not withdraw the teaching.");
      setSaved(false);
      setConfirmed(false);
      setMessage("Withdrawn. It is no longer available to members.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not withdraw the teaching.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  const canSave = Boolean(businessId) && confirmed && title.trim().length >= 2 && teaching.trim().length > 0 && words <= MAX_WORDS;
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="business-cultural-teaching-screen">
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity accessibilityLabel="Back to Business Admin" activeOpacity={0.85} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Optional Cultural Teaching</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        <View style={[styles.intro, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}>
          <View style={[styles.introIcon, { backgroundColor: `${colors.primary}20` }]}><Feather name="book-open" size={20} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.introTitle, { color: colors.foreground }]}>In this business’s own words</Text>
            <Text style={[styles.introCopy, { color: colors.mutedForeground }]}>Offer a short voluntary point-of-visit teaching. It is never a culture label, rating, or automatic member prompt.</Text>
          </View>
        </View>
        {businessName ? <Text style={[styles.businessName, { color: colors.mutedForeground }]}>For {businessName}</Text> : null}
        {message ? <Text accessibilityRole="alert" style={[styles.status, { color: colors.primary }]}>{message}</Text> : null}
        {!businessId ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={24} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Approved owner access required</Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>This optional teaching is available only to the approved owner of a business listing.</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => void load()} style={[styles.retryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryButtonText}>Try again</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.foreground }]}>Short title</Text>
              <TextInput value={title} maxLength={120} onChangeText={setTitle} placeholder="A small welcome" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
            </View>
            <View style={styles.group}>
              <Text style={[styles.label, { color: colors.foreground }]}>Teaching in your own words</Text>
              <TextInput value={teaching} multiline maxLength={700} onChangeText={setTeaching} placeholder="Share one short thing a visitor may choose to read while they are here." placeholderTextColor={colors.mutedForeground} style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
              <Text style={[styles.helper, { color: words > MAX_WORDS ? "#B91C1C" : colors.mutedForeground }]}>{words}/{MAX_WORDS} words · up to 700 characters</Text>
            </View>
            <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }} activeOpacity={0.85} onPress={() => setConfirmed((value) => !value)} style={[styles.confirmation, { backgroundColor: colors.card, borderColor: confirmed ? colors.primary : colors.border }]}>
              <Feather name={confirmed ? "check-square" : "square"} size={20} color={confirmed ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.confirmationText, { color: colors.foreground }]}>I confirm this is a voluntary teaching from this business, in our own words. It does not speak for, rank, or represent a culture, and members may choose not to read it.</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              {saved ? <TouchableOpacity activeOpacity={0.85} disabled={saving || withdrawing} onPress={() => void withdraw()} style={[styles.withdrawButton, { borderColor: "#B91C1C", opacity: saving || withdrawing ? 0.55 : 1 }]}><Text style={styles.withdrawText}>{withdrawing ? "Withdrawing…" : "Withdraw teaching"}</Text></TouchableOpacity> : null}
              <TouchableOpacity activeOpacity={0.85} disabled={!canSave || saving || withdrawing} onPress={() => void save()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: !canSave || saving || withdrawing ? 0.55 : 1 }]}>
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Feather name="save" size={17} color="#FFF" />}
                <Text style={styles.primaryButtonText}>{saving ? "Saving…" : saved ? "Update teaching" : "Save optional teaching"}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 }, backButton: { width: 38, height: 38, alignItems: "flex-start", justifyContent: "center" }, headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  scroll: { padding: 16, gap: 16 }, intro: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 }, introIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" }, introTitle: { fontSize: 16, fontFamily: "Inter_700Bold" }, introCopy: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: 3 }, businessName: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: -7 },
  group: { gap: 8 }, label: { fontFamily: "Inter_600SemiBold", fontSize: 14 }, helper: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 }, input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14 }, textarea: { minHeight: 120, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, textAlignVertical: "top" },
  confirmation: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 13, alignItems: "flex-start" }, confirmationText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 }, status: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 19 }, actions: { gap: 10 }, primaryButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 13, paddingHorizontal: 16 }, primaryButtonText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 14 }, withdrawButton: { minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 13, paddingHorizontal: 16 }, withdrawText: { color: "#B91C1C", fontFamily: "Inter_700Bold", fontSize: 14 },
  empty: { alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, padding: 24 }, emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16, textAlign: "center" }, emptyCopy: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 }, retryButton: { borderRadius: 11, paddingVertical: 11, paddingHorizontal: 18, marginTop: 4 },
});
