import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiBase } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useColors } from "@/hooks/useColors";

type MomentKind = "place" | "event" | "food" | "music" | "story" | "community_voice" | "learning";

type PassportMoment = {
  id: string;
  kind: MomentKind;
  title: string;
  note: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  createdAt: string;
};

type Passport = {
  title: string;
  displayName: string;
  memberSince: number;
  promise: string;
  disclosure: string;
  moments: PassportMoment[];
};

const MOMENT_KINDS: Array<{ id: MomentKind; label: string; icon: React.ComponentProps<typeof Feather>["name"] }> = [
  { id: "place", label: "Place", icon: "map-pin" },
  { id: "event", label: "Event", icon: "calendar" },
  { id: "food", label: "Food", icon: "coffee" },
  { id: "music", label: "Music", icon: "music" },
  { id: "story", label: "Story", icon: "book-open" },
  { id: "community_voice", label: "Community", icon: "users" },
  { id: "learning", label: "Learning", icon: "compass" },
];

function momentKindMeta(kind: MomentKind) {
  return MOMENT_KINDS.find((candidate) => candidate.id === kind) ?? MOMENT_KINDS[0];
}

export default function PassportScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<MomentKind>("learning");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [rememberInPassport, setRememberInPassport] = useState(false);

  const loadPassport = useCallback(async () => {
    if (!isAuthenticated) {
      setPassport(null);
      setError("Sign in to view the moments you choose to keep in My Passport.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) throw new Error("Your sign-in needs to be refreshed.");
      const response = await fetch(`${getApiBase()}/api/users/passport`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json().catch(() => ({})) as { passport?: Passport; error?: string };
      if (!response.ok || !body.passport) throw new Error(body.error ?? "My Passport is unavailable right now.");
      setPassport(body.passport);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "My Passport is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { void loadPassport(); }, [loadPassport]);

  const saveMoment = async () => {
    if (!rememberInPassport) {
      setError("Choose the confirmation before adding a moment to My Passport.");
      return;
    }
    if (!title.trim()) {
      setError("Give this moment a title before saving it.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) throw new Error("Your sign-in needs to be refreshed.");
      const response = await fetch(`${getApiBase()}/api/users/passport/moments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          memberConfirmed: true,
          kind,
          title: title.trim(),
          note: note.trim() || undefined,
        }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not save that moment.");
      setTitle("");
      setNote("");
      setRememberInPassport(false);
      await loadPassport();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kinfolk could not save that moment.");
    } finally {
      setSaving(false);
    }
  };

  const removeMoment = (moment: PassportMoment) => {
    Alert.alert(
      "Remove this moment?",
      "It will no longer appear in My Passport.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => { void (async () => {
            try {
              const token = await SecureStore.getItemAsync("auth_session_token");
              if (!token) throw new Error("Your sign-in needs to be refreshed.");
              const response = await fetch(`${getApiBase()}/api/users/passport/moments/${encodeURIComponent(moment.id)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              const body = await response.json().catch(() => ({})) as { error?: string };
              if (!response.ok) throw new Error(body.error ?? "Kinfolk could not remove that moment.");
              await loadPassport();
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Kinfolk could not remove that moment.");
            }
          })(); },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 48 }}
      keyboardDismissMode="on-drag"
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Passport</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.promiseCard, { backgroundColor: "#CA922B12", borderColor: "#CA922B35" }]}>
            <Feather name="compass" size={20} color="#CA922B" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.promiseTitle, { color: colors.foreground }]}>Your story is still unfolding</Text>
              <Text style={[styles.promiseText, { color: colors.foreground }]}>{passport?.promise}</Text>
            </View>
          </View>

          <Text style={[styles.disclosure, { color: colors.mutedForeground }]}>{passport?.disclosure ?? "My Passport is private to you."}</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {isAuthenticated && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Keep a moment</Text>
              <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Choose something meaningful to you. Kinfolk will not add it automatically.</Text>
              <View style={styles.kindWrap}>
                {MOMENT_KINDS.map((candidate) => {
                  const selected = candidate.id === kind;
                  return (
                    <Pressable
                      key={candidate.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={candidate.label}
                      onPress={() => setKind(candidate.id)}
                      style={[styles.kindChip, { backgroundColor: selected ? colors.primary + "18" : colors.secondary, borderColor: selected ? colors.primary : colors.border }]}
                    >
                      <Feather name={candidate.icon} size={14} color={selected ? colors.primary : colors.mutedForeground} />
                      <Text style={[styles.kindText, { color: selected ? colors.primary : colors.foreground }]}>{candidate.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What do you want to remember?"
                placeholderTextColor={colors.mutedForeground}
                maxLength={180}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="A private reflection (optional)"
                placeholderTextColor={colors.mutedForeground}
                maxLength={1200}
                multiline
                style={[styles.noteInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberInPassport }}
                onPress={() => setRememberInPassport((value) => !value)}
                style={styles.consentRow}
              >
                <View style={[styles.checkbox, { borderColor: rememberInPassport ? colors.primary : colors.border, backgroundColor: rememberInPassport ? colors.primary : "transparent" }]}>
                  {rememberInPassport && <Feather name="check" size={13} color="#FFFFFF" />}
                </View>
                <Text style={[styles.consentText, { color: colors.foreground }]}>I choose to keep this private moment in My Passport.</Text>
              </Pressable>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Save private Passport moment"
                disabled={saving}
                onPress={() => { void saveMoment(); }}
                style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.65 : 1 }]}
              >
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Keep this moment</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.momentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Moments you chose to keep</Text>
          </View>
          {passport?.moments.length ? passport.moments.map((moment) => {
            const meta = momentKindMeta(moment.kind);
            return (
              <View key={moment.id} style={[styles.momentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.momentIcon, { backgroundColor: colors.secondary }]}><Feather name={meta.icon} size={17} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.momentTitle, { color: colors.foreground }]}>{moment.title}</Text>
                  <Text style={[styles.momentKind, { color: colors.mutedForeground }]}>{meta.label}</Text>
                  {moment.note && <Text style={[styles.momentNote, { color: colors.mutedForeground }]}>{moment.note}</Text>}
                </View>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove ${moment.title} from My Passport`} onPress={() => removeMoment(moment)} style={styles.removeButton}>
                  <Feather name="x" size={17} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            );
          }) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="bookmark" size={22} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No moments yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>There is nothing to unlock or finish. Add a moment only when you want to remember it.</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 52, borderBottomWidth: 1, paddingHorizontal: 16, alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  backButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  centered: { minHeight: 320, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 14 },
  promiseCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 15 },
  promiseTitle: { fontSize: 16, fontWeight: "700", marginBottom: 5 },
  promiseText: { fontSize: 13, lineHeight: 19 },
  disclosure: { fontSize: 12, lineHeight: 18, marginHorizontal: 2 },
  errorText: { color: "#B91C1C", fontSize: 13, lineHeight: 18 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionHint: { fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 12 },
  kindWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  kindChip: { flexDirection: "row", gap: 5, alignItems: "center", borderRadius: 18, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 10 },
  kindText: { fontSize: 12, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, marginBottom: 10 },
  noteInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, minHeight: 84, textAlignVertical: "top" },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, paddingVertical: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  consentText: { flex: 1, fontSize: 13, lineHeight: 19 },
  saveButton: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  momentHeader: { marginTop: 4 },
  momentCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 13 },
  momentIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  momentTitle: { fontSize: 14, fontWeight: "700" },
  momentKind: { fontSize: 11, marginTop: 2 },
  momentNote: { fontSize: 12, lineHeight: 17, marginTop: 7 },
  removeButton: { padding: 4 },
  emptyCard: { alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 24 },
  emptyTitle: { fontSize: 15, fontWeight: "700", marginTop: 9 },
  emptyText: { fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: "center" },
});
