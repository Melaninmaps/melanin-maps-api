import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

type Presentation = {
  coverObjectKey?: string | null;
  coverUrl?: string | null;
  showAge: boolean;
  showBirthday: boolean;
  showLocation: boolean;
  showProfessionalDetails: boolean;
  showBadges: boolean;
};

type Achievement = { id?: string; achievementType?: string; title?: string; icon?: string; desc?: string; earnedAt?: string };

const DEFAULT_PRESENTATION: Presentation = {
  coverObjectKey: null,
  coverUrl: null,
  showAge: false,
  showBirthday: false,
  showLocation: false,
  showProfessionalDetails: false,
  showBadges: false,
};

export default function ProfilePresentationSettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [presentation, setPresentation] = useState<Presentation>(DEFAULT_PRESENTATION);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof Presentation | null>(null);
  const [uploading, setUploading] = useState(false);
  const [headers, setHeaders] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const authHeaders = await getMemberApiHeaders();
      setHeaders(authHeaders);
      const base = getApiBase();
      const [settingsRes, badgesRes] = await Promise.all([
        fetch(`${base}/api/users/me/profile-presentation`, { headers: authHeaders }),
        fetch(`${base}/api/users/me/achievements`, { headers: authHeaders }),
      ]);
      if (!settingsRes.ok) throw new Error("settings unavailable");
      const settings = await settingsRes.json() as { presentation?: Presentation; optionalPersonalDetailsAvailable?: boolean };
      setPresentation({ ...DEFAULT_PRESENTATION, ...(settings.presentation ?? {}) });
      setAvailable(settings.optionalPersonalDetailsAvailable === true);
      if (badgesRes.ok) {
        const body = await badgesRes.json() as { achievements?: Achievement[] };
        setAchievements(Array.isArray(body.achievements) ? body.achievements : []);
      }
    } catch {
      Alert.alert("Profile display unavailable", "Your display choices could not be loaded. Please try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const update = async (key: keyof Pick<Presentation, "showAge" | "showBirthday" | "showLocation" | "showProfessionalDetails" | "showBadges">, value: boolean) => {
    if (!available) return;
    setSavingKey(key);
    const previous = presentation;
    setPresentation((current) => ({ ...current, [key]: value }));
    try {
      const response = await fetch(`${getApiBase()}/api/users/me/profile-presentation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ [key]: value }),
      });
      const body = await response.json().catch(() => ({})) as { presentation?: Presentation; error?: string };
      if (!response.ok || !body.presentation) throw new Error(body.error ?? "save failed");
      setPresentation({ ...DEFAULT_PRESENTATION, ...body.presentation });
    } catch {
      setPresentation(previous);
      Alert.alert("Couldn’t save", "Your display choice was not changed. Please try again.");
    } finally { setSavingKey(null); }
  };

  const chooseCover = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Use the web profile settings", "Cover uploads are available in the mobile app for this acceptance candidate.");
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Photo access needed", "Allow photo access to choose a private profile cover.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [3, 1], quality: 0.82 });
    if (picked.canceled || !picked.assets[0]) return;
    setUploading(true);
    try {
      const asset = picked.assets[0];
      const form = new FormData();
      form.append("cover", { uri: asset.uri, type: asset.mimeType ?? "image/jpeg", name: "profile-cover.jpg" } as unknown as Blob);
      const response = await fetch(`${getApiBase()}/api/users/me/profile-cover`, { method: "POST", headers, body: form });
      const body = await response.json().catch(() => ({})) as { coverUrl?: string; error?: string };
      if (!response.ok || !body.coverUrl) throw new Error(body.error ?? "upload failed");
      setPresentation((current) => ({ ...current, coverUrl: body.coverUrl }));
    } catch {
      Alert.alert("Cover not updated", "Your cover remains unchanged. Try another image or check your connection.");
    } finally { setUploading(false); }
  };

  const coverUri = presentation.coverUrl ? `${getApiBase()}${presentation.coverUrl}` : null;
  const options: Array<{ key: keyof Pick<Presentation, "showAge" | "showBirthday" | "showLocation" | "showProfessionalDetails" | "showBadges">; icon: React.ComponentProps<typeof Feather>["name"]; label: string; description: string }> = [
    { key: "showAge", icon: "user", label: "Age", description: "Show your age on your social profile." },
    { key: "showBirthday", icon: "gift", label: "Birthday", description: "Show month and day only—never your birth year." },
    { key: "showLocation", icon: "map-pin", label: "City or region", description: "Show the city and state saved on your profile." },
    { key: "showProfessionalDetails", icon: "briefcase", label: "Professional details", description: "Show an optional job title and industry." },
    { key: "showBadges", icon: "award", label: "Earned badges", description: "Show only badges you have actually earned. Badge progress stays private." },
  ];

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 12, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Back to settings"><Feather name="arrow-left" size={22} color={colors.foreground} /></TouchableOpacity>
      <Text style={[styles.title, { color: colors.foreground }]}>Profile display</Text>
      <View style={styles.back} />
    </View>
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>Your social profile shows your Community activity. Optional personal details stay hidden unless you choose to display them.</Text>
      <View style={[styles.coverCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.coverPreview, { backgroundColor: colors.primary + "22" }]}>{coverUri ? <Image source={{ uri: coverUri, headers }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Current private profile cover" /> : <Feather name="image" size={25} color={colors.primary} />}</View>
        <View style={styles.coverCopy}><Text style={[styles.coverTitle, { color: colors.foreground }]}>Profile cover</Text><Text style={[styles.coverDescription, { color: colors.mutedForeground }]}>Visible only to members permitted to view your profile. It is not stored as a public link.</Text></View>
        <TouchableOpacity onPress={() => void chooseCover()} disabled={uploading} style={[styles.coverButton, { borderColor: colors.primary }]} accessibilityRole="button" accessibilityLabel="Choose profile cover">{uploading ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.coverButtonText, { color: colors.primary }]}>Choose</Text>}</TouchableOpacity>
      </View>
      {!available ? <View style={[styles.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Feather name="shield" size={17} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.mutedForeground }]}>These optional details remain hidden until the profile’s age-safety requirements are met.</Text></View> : null}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What your community can see</Text>
      <View style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {options.map((option, index) => (
          <React.Fragment key={option.key}>
            <View style={styles.option}>
              <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={option.icon} size={17} color={colors.primary} /></View>
              <View style={styles.optionCopy}>
                <Text style={[styles.optionTitle, { color: colors.foreground }]}>{option.label}</Text>
                <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>{option.description}</Text>
              </View>
              {savingKey === option.key ? <ActivityIndicator size="small" color={colors.primary} /> : <Switch value={presentation[option.key]} disabled={!available} onValueChange={(value) => void update(option.key, value)} trackColor={{ false: colors.border, true: colors.primary + "88" }} thumbColor={presentation[option.key] ? colors.primary : "#FFFFFF"} />}
            </View>
            {index < options.length - 1 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
          </React.Fragment>
        ))}
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Earned badges</Text>
      <View style={[styles.badgesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>{achievements.length ? achievements.map((achievement) => <View key={achievement.id ?? achievement.achievementType} style={[styles.badgeRow, { backgroundColor: colors.secondary }]}><Text style={styles.badgeIcon}>{achievement.icon ?? "🏆"}</Text><View style={{ flex: 1 }}><Text style={[styles.badgeTitle, { color: colors.foreground }]}>{achievement.title ?? achievement.achievementType ?? "Earned badge"}</Text>{achievement.desc ? <Text style={[styles.badgeDescription, { color: colors.mutedForeground }]}>{achievement.desc}</Text> : null}</View></View>) : <Text style={[styles.noBadges, { color: colors.mutedForeground }]}>No earned badges to display yet. The profile will never show unearned badges or achievement progress.</Text>}</View>
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth }, back: { width: 42, height: 42, alignItems: "center", justifyContent: "center" }, title: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 20 }, loading: { flex: 1, justifyContent: "center", alignItems: "center" }, content: { padding: 16, gap: 14 }, intro: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 }, coverCard: { borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }, coverPreview: { width: 68, height: 48, overflow: "hidden", borderRadius: 9, alignItems: "center", justifyContent: "center" }, coverCopy: { flex: 1 }, coverTitle: { fontFamily: "Inter_700Bold", fontSize: 14 }, coverDescription: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15, marginTop: 3 }, coverButton: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8, minWidth: 58, alignItems: "center" }, coverButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 12 }, notice: { borderWidth: 1, borderRadius: 14, flexDirection: "row", gap: 9, padding: 12, alignItems: "flex-start" }, noticeText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 }, sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 4 }, optionCard: { borderWidth: 1, borderRadius: 16, overflow: "hidden" }, option: { flexDirection: "row", gap: 10, padding: 13, alignItems: "center" }, icon: { width: 34, height: 34, borderRadius: 11, justifyContent: "center", alignItems: "center" }, optionCopy: { flex: 1 }, optionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 }, optionDescription: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15, marginTop: 2 }, divider: { height: StyleSheet.hairlineWidth, marginLeft: 57 }, badgesCard: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 8 }, badgeRow: { borderRadius: 12, padding: 10, flexDirection: "row", gap: 10, alignItems: "center" }, badgeIcon: { fontSize: 22 }, badgeTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 }, badgeDescription: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15, marginTop: 2 }, noBadges: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
});
