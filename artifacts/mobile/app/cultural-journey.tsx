import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const FALLBACK_DISCLOSURE =
  "My Cultural Journey is private to you. Entries are saved only when you choose a published cultural site, and reflections are saved only when you confirm them. Viewing or revisiting does not send a message to Kinfolk, create private memory, infer identity, trigger a nudge, or share anything. Nothing here is a score, streak, or completion goal.";

type CulturalJourneyEntry = {
  id: string;
  culturalSiteId: string;
  siteName: string;
  sourceLabel: string;
  reflection: string | null;
  createdAt: string;
  updatedAt: string;
};

type CulturalJourneyResponse = {
  disclosure?: string;
  entries?: CulturalJourneyEntry[];
};

function savedOn(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved date unavailable";
  return `Saved ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
}

/**
 * A private reading surface for member-confirmed Cultural Journey entries.
 * It deliberately does not observe visits, infer identity, or create Kinfolk
 * memory/context from a saved item or reflection.
 */
export default function CulturalJourneyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [entries, setEntries] = useState<CulturalJourneyEntry[]>([]);
  const [disclosure, setDisclosure] = useState(FALLBACK_DISCLOSURE);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [reflectionConfirmed, setReflectionConfirmed] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const loadJourney = useCallback(async () => {
    setState("loading");
    setActionError("");
    try {
      const headers = await getMemberApiHeaders();
      const response = await fetch(`${getApiBase()}/api/cultural-journeys`, {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json", "Cache-Control": "no-store", ...headers },
      });
      if (!response.ok) throw new Error("CULTURAL_JOURNEY_UNAVAILABLE");
      const payload = await response.json() as CulturalJourneyResponse;
      setEntries(payload.entries ?? []);
      setDisclosure(payload.disclosure ?? FALLBACK_DISCLOSURE);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void loadJourney();
  }, [loadJourney]);

  function beginReflection(entry: CulturalJourneyEntry) {
    setActionError("");
    setEditingId(entry.id);
    setDraft(entry.reflection ?? "");
    setReflectionConfirmed(false);
  }

  function cancelReflection() {
    setEditingId(null);
    setDraft("");
    setReflectionConfirmed(false);
  }

  async function updateReflection(entry: CulturalJourneyEntry) {
    if (!reflectionConfirmed || savingId) return;
    const nextReflection = draft.trim();
    if (!nextReflection && !entry.reflection) return;

    setSavingId(entry.id);
    setActionError("");
    try {
      const headers = await getMemberApiHeaders();
      const response = await fetch(`${getApiBase()}/api/cultural-journeys/entries/${encodeURIComponent(entry.id)}/reflection`, {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
        body: JSON.stringify({ memberConfirmed: true, reflection: nextReflection }),
      });
      const payload = await response.json() as { entry?: CulturalJourneyEntry };
      if (!response.ok || !payload.entry) throw new Error("REFLECTION_UNAVAILABLE");
      setEntries((current) => current.map((item) => item.id === entry.id ? payload.entry! : item));
      cancelReflection();
    } catch {
      setActionError("We could not update your reflection. Your Journey is unchanged.");
    } finally {
      setSavingId(null);
    }
  }

  async function removeEntry(entry: CulturalJourneyEntry) {
    setRemovingId(entry.id);
    setActionError("");
    try {
      const headers = await getMemberApiHeaders();
      const response = await fetch(`${getApiBase()}/api/cultural-journeys/entries/${encodeURIComponent(entry.id)}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
        body: JSON.stringify({ memberConfirmed: true }),
      });
      if (!response.ok) throw new Error("REMOVE_UNAVAILABLE");
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      if (editingId === entry.id) cancelReflection();
    } catch {
      setActionError("We could not remove that entry. Your Journey is unchanged.");
    } finally {
      setRemovingId(null);
    }
  }

  function confirmRemove(entry: CulturalJourneyEntry) {
    Alert.alert(
      "Remove from My Cultural Journey?",
      `Remove ${entry.siteName} from your private Journey? This does not change the published cultural site or anyone else’s entries.`,
      [
        { text: "Keep entry", style: "cancel" },
        { text: "Remove entry", style: "destructive", onPress: () => { void removeEntry(entry); } },
      ],
    );
  }

  function revisit(entry: CulturalJourneyEntry) {
    router.push({ pathname: "/cultural-heritage", params: { siteId: entry.culturalSiteId } } as never);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 18) }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity accessibilityLabel="Back to Cultural Heritage Explorer" onPress={() => router.canGoBack() ? router.back() : router.replace("/cultural-heritage" as never)} style={styles.backButton}>
          <Feather name="arrow-left" color={colors.foreground} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Cultural Journey</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>Private, member-confirmed cultural-site references</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>PRIVATE MEMBER SPACE</Text>
          <Text style={styles.heroTitle}>Return to the cultural places you chose to save.</Text>
          <Text style={styles.heroCopy}>This is a calm record of published cultural sites and reflections you deliberately added—not a progress tracker.</Text>
        </View>

        <View style={[styles.disclosure, { backgroundColor: "#CA922B10", borderColor: "#CA922B45" }]}>
          <Feather name="lock" color="#8D5C17" size={17} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.disclosureText, { color: colors.foreground }]}>{disclosure}</Text>
            <Text style={[styles.disclosureText, { color: colors.mutedForeground, marginTop: 10 }]}>This view shows only the source-derived site title and category plus what you explicitly wrote. It does not show location, coordinates, raw assets, or provider information.</Text>
            <Text style={[styles.disclosureText, { color: colors.mutedForeground, marginTop: 10 }]}>Gentle invitations and nudges are not added here.</Text>
          </View>
        </View>

        {actionError ? <Text accessibilityRole="alert" style={styles.errorText}>{actionError}</Text> : null}

        {state === "loading" ? (
          <View style={styles.stateCard} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.stateCopy, { color: colors.mutedForeground }]}>Loading your private Journey…</Text>
          </View>
        ) : null}

        {state === "error" ? (
          <View style={[styles.stateCard, { borderColor: "#B95E5E55", backgroundColor: "#FFF1EF" }]} accessibilityRole="alert">
            <Feather name="alert-circle" color="#8A2424" size={27} />
            <Text style={[styles.stateTitle, { color: colors.foreground }]}>My Cultural Journey is unavailable</Text>
            <Text style={[styles.stateCopy, { color: colors.mutedForeground }]}>Your saved entries have not changed. Try again when you are connected.</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => { void loadJourney(); }} style={[styles.outlineButton, { borderColor: "#8D5C17" }]}>
              <Feather name="refresh-cw" color="#8D5C17" size={15} />
              <Text style={[styles.outlineButtonText, { color: "#8D5C17" }]}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {state === "ready" && entries.length === 0 ? (
          <View style={[styles.stateCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="bookmark" color="#8D5C17" size={30} />
            <Text style={[styles.stateTitle, { color: colors.foreground }]}>Nothing saved yet</Text>
            <Text style={[styles.stateCopy, { color: colors.mutedForeground }]}>When you choose “Save to My Journey” on a published cultural site, it appears here. Kinfolk will not add anything automatically.</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => router.replace("/cultural-heritage" as never)} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.primaryButtonText}>Explore published cultural sites</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {state === "ready" && entries.length > 0 ? (
          <View style={styles.entryList}>
            <Text style={[styles.narrativeIntro, { color: colors.mutedForeground }]}>Your entries are shown from the earliest saved story to the most recent. Revisit is available, but it is not recorded as an activity.</Text>
            {[...entries].reverse().map((entry) => {
              const editing = editingId === entry.id;
              const willClear = !draft.trim() && Boolean(entry.reflection);
              return (
                <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.category}>{entry.sourceLabel}</Text>
                  <Text style={[styles.entryTitle, { color: colors.foreground }]}>{entry.siteName}</Text>
                  <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>{savedOn(entry.createdAt)} · Revisit available</Text>
                  <Text style={[styles.entryCopy, { color: colors.mutedForeground }]}>Revisiting opens the public site details. It does not mark a visit, change this Journey, or send anything to Kinfolk.</Text>

                  {entry.reflection ? (
                    <View style={[styles.reflectionBox, { backgroundColor: "#CA922B0D", borderColor: "#CA922B38" }]}>
                      <Text style={styles.reflectionLabel}>YOUR PRIVATE REFLECTION</Text>
                      <Text style={[styles.reflectionText, { color: colors.foreground }]}>{entry.reflection}</Text>
                    </View>
                  ) : <Text style={[styles.noReflection, { color: colors.mutedForeground }]}>No reflection saved.</Text>}

                  <View style={styles.actionRow}>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Revisit ${entry.siteName}`} onPress={() => revisit(entry)} style={[styles.outlineButton, { borderColor: "#8D5C17" }]}>
                      <Feather name="map" color="#8D5C17" size={14} />
                      <Text style={[styles.outlineButtonText, { color: "#8D5C17" }]}>Revisit published site</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel={editing ? "Cancel reflection edit" : `Edit reflection for ${entry.siteName}`} onPress={() => editing ? cancelReflection() : beginReflection(entry)} style={[styles.outlineButton, { borderColor: colors.border }]}>
                      <Feather name={editing ? "x" : "edit-3"} color={colors.foreground} size={14} />
                      <Text style={[styles.outlineButtonText, { color: colors.foreground }]}>{editing ? "Cancel" : entry.reflection ? "Edit reflection" : "Write reflection"}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove ${entry.siteName} from My Cultural Journey`} disabled={removingId === entry.id} onPress={() => confirmRemove(entry)} style={styles.removeButton}>
                    {removingId === entry.id ? <ActivityIndicator color="#8A2424" size="small" /> : <Feather name="trash-2" color="#8A2424" size={14} />}
                    <Text style={styles.removeButtonText}>{removingId === entry.id ? "Removing…" : "Remove entry"}</Text>
                  </TouchableOpacity>

                  {editing ? (
                    <View style={[styles.editor, { borderColor: "#CA922B45", backgroundColor: "#CA922B08" }]}>
                      <Text style={[styles.editorTitle, { color: colors.foreground }]}>Your private reflection</Text>
                      <TextInput
                        accessibilityLabel={`Private reflection for ${entry.siteName}`}
                        maxLength={1200}
                        multiline
                        onChangeText={setDraft}
                        placeholder="What do you choose to remember or explore next?"
                        placeholderTextColor={colors.mutedForeground}
                        style={[styles.reflectionInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                        value={draft}
                      />
                      <Text style={[styles.characterCount, { color: colors.mutedForeground }]}>{draft.length}/1200 characters. Clear the text only if you choose to remove this reflection.</Text>
                      <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: reflectionConfirmed }} onPress={() => setReflectionConfirmed((value) => !value)} style={styles.confirmationRow}>
                        <Feather name={reflectionConfirmed ? "check-square" : "square"} color={reflectionConfirmed ? "#8D5C17" : colors.mutedForeground} size={20} />
                        <Text style={[styles.confirmationCopy, { color: colors.foreground }]}>I choose to {willClear ? "clear" : "save"} this private reflection in My Cultural Journey.</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={willClear ? "Clear Cultural Journey reflection" : "Save Cultural Journey reflection"}
                        disabled={!reflectionConfirmed || savingId === entry.id || (!draft.trim() && !entry.reflection)}
                        onPress={() => { void updateReflection(entry); }}
                        style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: reflectionConfirmed && (draft.trim() || entry.reflection) ? 1 : 0.55 }]}
                      >
                        {savingId === entry.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{willClear ? "Clear reflection" : "Save reflection"}</Text>}
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", gap: 10, minHeight: 64, paddingHorizontal: 16, paddingVertical: 10 },
  backButton: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSubtitle: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  content: { gap: 15, padding: 16 },
  hero: { backgroundColor: "#2A0F05", borderRadius: 18, padding: 22 },
  heroEyebrow: { color: "#F4D58D", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  heroTitle: { color: "#FFFDF8", fontFamily: "serif", fontSize: 25, fontWeight: "800", lineHeight: 31, marginTop: 9 },
  heroCopy: { color: "#F1DFCC", fontSize: 14, lineHeight: 21, marginTop: 10 },
  disclosure: { borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, padding: 16 },
  disclosureText: { fontSize: 13, lineHeight: 19 },
  errorText: { backgroundColor: "#FFF1EF", borderColor: "#B95E5E55", borderRadius: 12, borderWidth: 1, color: "#8A2424", fontSize: 13, lineHeight: 19, padding: 13 },
  stateCard: { alignItems: "center", borderRadius: 16, borderWidth: 1, gap: 10, padding: 24 },
  stateTitle: { fontFamily: "serif", fontSize: 21, fontWeight: "800", textAlign: "center" },
  stateCopy: { fontSize: 14, lineHeight: 21, maxWidth: 390, textAlign: "center" },
  primaryButton: { alignItems: "center", alignSelf: "flex-start", borderRadius: 10, flexDirection: "row", gap: 7, justifyContent: "center", marginTop: 5, minHeight: 42, paddingHorizontal: 14 },
  primaryButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  entryList: { gap: 12 },
  narrativeIntro: { fontSize: 13, lineHeight: 19, paddingHorizontal: 2 },
  entryCard: { borderRadius: 16, borderWidth: 1, padding: 17 },
  category: { color: "#8D5C17", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  entryTitle: { fontFamily: "serif", fontSize: 23, fontWeight: "800", lineHeight: 29, marginTop: 5 },
  entryMeta: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  entryCopy: { fontSize: 13, lineHeight: 19, marginTop: 12 },
  reflectionBox: { borderRadius: 12, borderWidth: 1, marginTop: 14, padding: 13 },
  reflectionLabel: { color: "#8D5C17", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  reflectionText: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  noReflection: { fontSize: 13, fontStyle: "italic", lineHeight: 19, marginTop: 14 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  outlineButton: { alignItems: "center", borderRadius: 9, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 38, paddingHorizontal: 11, paddingVertical: 8 },
  outlineButtonText: { fontSize: 12, fontWeight: "700" },
  removeButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, marginTop: 12, minHeight: 32 },
  removeButtonText: { color: "#8A2424", fontSize: 12, fontWeight: "700", textDecorationLine: "underline" },
  editor: { borderRadius: 13, borderWidth: 1, marginTop: 16, padding: 14 },
  editorTitle: { fontSize: 14, fontWeight: "800" },
  reflectionInput: { borderRadius: 10, borderWidth: 1, fontSize: 14, lineHeight: 20, marginTop: 10, minHeight: 110, padding: 11, textAlignVertical: "top" },
  characterCount: { fontSize: 11, lineHeight: 16, marginTop: 7 },
  confirmationRow: { alignItems: "flex-start", flexDirection: "row", gap: 9, marginTop: 13 },
  confirmationCopy: { flex: 1, fontSize: 13, lineHeight: 19 },
});
