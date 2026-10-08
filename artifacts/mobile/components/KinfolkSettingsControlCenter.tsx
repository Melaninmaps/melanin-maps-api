import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KinfolkContinuityDisclosure } from "@/components/KinfolkContinuityDisclosure";
import { SupportLensDropdowns } from "@/components/SupportLensDropdowns";
import { useColors } from "@/hooks/useColors";
import { useUnsavedKinfolkExitGuard } from "@/hooks/useUnsavedKinfolkExitGuard";

type Mode = "community" | "best_friend" | "business_manager" | "professor";
type Voice = "onyx" | "nova" | "shimmer";
type Profile = {
  dietaryNotes: string;
  budgetRange: string;
  travelCompanion: string;
  favoriteCities: string[];
  favoriteCategories: string[];
  lifestyleServices: string[];
  culturalInterests: string[];
};
type Draft = {
  personalizedSuggestions: boolean;
  mode: Mode;
  voice: Voice;
  communicationStyle: string;
  emojiLevel: string;
  humorLevel: string;
  supportLens: string[];
  continuityEnabled: boolean;
  profile: Profile;
};
type PreferredName = { name: string | null; state: "active" | "paused" | "not_saved" };

const modeOptions: { value: Mode; label: string; description: string; icon: React.ComponentProps<typeof Feather>["name"] }[] = [
  { value: "community", label: "Big Cousin", description: "Warm, grounded, practical", icon: "zap" },
  { value: "best_friend", label: "Best Friend", description: "Encouraging, candid, celebratory", icon: "heart" },
  { value: "business_manager", label: "Business Manager", description: "Direct, organized, action-oriented", icon: "briefcase" },
  { value: "professor", label: "Professor", description: "Clear, educational, evidence-aware", icon: "book-open" },
];
const communicationStyles = [
  { value: "friendly", label: "Friendly" },
  { value: "conversational", label: "Casual" },
  { value: "concise", label: "Direct" },
  { value: "professional", label: "Formal" },
];
const emojiLevels = [
  { value: "none", label: "None" },
  { value: "some", label: "Some" },
  { value: "lots", label: "Many" },
];
const humorLevels = [
  { value: "none", label: "None" },
  { value: "light", label: "Light" },
  { value: "playful", label: "Witty" },
];
const budgets = ["any", "budget", "mid", "luxury"];
const companions = ["solo", "partner", "family", "friends", "group", "work"];
const PRIMARY_ACTION_INK = "#241405";

const EMPTY_DRAFT: Draft = {
  personalizedSuggestions: true,
  mode: "community",
  voice: "onyx",
  communicationStyle: "friendly",
  emojiLevel: "some",
  humorLevel: "light",
  supportLens: [],
  continuityEnabled: false,
  profile: {
    dietaryNotes: "", budgetRange: "any", travelCompanion: "solo", favoriteCities: [],
    favoriteCategories: [], lifestyleServices: [], culturalInterests: [],
  },
};

function apiBase(): string {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

async function token(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

function copyDraft(value: Draft): Draft {
  return {
    ...value,
    supportLens: [...value.supportLens],
    profile: {
      ...value.profile,
      favoriteCities: [...value.profile.favoriteCities],
      favoriteCategories: [...value.profile.favoriteCategories],
      lifestyleServices: [...value.profile.lifestyleServices],
      culturalInterests: [...value.profile.culturalInterests],
    },
  };
}

function cleanList(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))]
    : [];
}

function normalizeDraft(settings: unknown, preferences: unknown, continuity: unknown): Draft {
  const userSettings = (settings ?? {}) as { personalisedSuggestions?: unknown };
  const prefs = (preferences ?? {}) as Record<string, unknown>;
  const continuityState = (continuity ?? {}) as { enabled?: unknown };
  const mode = modeOptions.some((option) => option.value === prefs.personalityMode)
    ? prefs.personalityMode as Mode : "community";
  const voice = prefs.kinfolkVoice === "nova" || prefs.kinfolkVoice === "shimmer" ? prefs.kinfolkVoice : "onyx";
  return {
    personalizedSuggestions: userSettings.personalisedSuggestions !== false,
    mode,
    voice,
    communicationStyle: typeof prefs.communicationStyle === "string" ? prefs.communicationStyle : "friendly",
    emojiLevel: typeof prefs.emojiLevel === "string" ? prefs.emojiLevel : "some",
    humorLevel: typeof prefs.humorLevel === "string" ? prefs.humorLevel : "light",
    supportLens: cleanList(prefs.ownershipTypes ?? prefs.preferredOwnershipTypes),
    continuityEnabled: continuityState.enabled === true,
    profile: {
      dietaryNotes: typeof prefs.dietaryNotes === "string" ? prefs.dietaryNotes : "",
      budgetRange: typeof prefs.budgetRange === "string" ? prefs.budgetRange : "any",
      travelCompanion: typeof prefs.travelCompanion === "string" ? prefs.travelCompanion : "solo",
      favoriteCities: cleanList(prefs.favoriteCities),
      favoriteCategories: cleanList(prefs.favoriteCategories),
      lifestyleServices: cleanList(prefs.lifestyleServices),
      culturalInterests: cleanList(prefs.culturalInterests),
    },
  };
}

function identical(left: Draft, right: Draft): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function listText(items: string[]): string { return items.join(", "); }
function textList(value: string): string[] { return [...new Set(value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))]; }
function modeLabel(value: Mode): string { return modeOptions.find((mode) => mode.value === value)?.label ?? "Big Cousin"; }
function voiceLabel(value: Voice): string { return value === "nova" || value === "shimmer" ? "Female Voice" : "Standard Kinfolk Voice"; }
function nameLabel(name: PreferredName): string {
  if (!name.name) return "No preferred name saved";
  return name.state === "paused" ? `${name.name} — paused` : `${name.name} — active`;
}

export default function KinfolkSettingsControlCenter() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [persisted, setPersisted] = useState<Draft>(() => copyDraft(EMPTY_DRAFT));
  const [draft, setDraft] = useState<Draft>(() => copyDraft(EMPTY_DRAFT));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferredName, setPreferredName] = useState<PreferredName>({ name: null, state: "not_saved" });
  const [disclosureRequired, setDisclosureRequired] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [continuityDecision, setContinuityDecision] = useState<"accepted" | "declined" | undefined>();
  const [profileOpen, setProfileOpen] = useState(false);
  const mounted = useRef(false);
  const dirtyRef = useRef(false);
  const loadId = useRef(0);
  const savingPromise = useRef<Promise<boolean> | null>(null);
  const dirty = !identical(persisted, draft);
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);

  const load = useCallback(async () => {
    const request = ++loadId.current;
    setLoading(true);
    try {
      const auth = await token();
      const base = apiBase();
      if (!auth || !base) throw new Error("Please sign in again to view Kinfolk Settings.");
      const headers = { Authorization: `Bearer ${auth}` };
      const [settingsRes, prefsRes, continuityRes, nameRes] = await Promise.all([
        fetch(`${base}/api/users/settings`, { headers }),
        fetch(`${base}/api/kinfolk/preferences`, { headers }),
        fetch(`${base}/api/kinfolk/continuity`, { headers }),
        fetch(`${base}/api/kinfolk/preferred-name`, { headers }),
      ]);
      if (!mounted.current || request !== loadId.current) return;
      const settings = settingsRes.ok ? await settingsRes.json() : {};
      const prefPayload = prefsRes.ok ? await prefsRes.json() as { preferences?: unknown } : {};
      const continuity = continuityRes.ok ? await continuityRes.json() as { disclosureRequired?: boolean } : {};
      const next = normalizeDraft(settings, prefPayload.preferences, continuity);
      if (!dirtyRef.current) {
        setPersisted(copyDraft(next));
        setDraft(copyDraft(next));
        setContinuityDecision(undefined);
      }
      setDisclosureRequired(continuity.disclosureRequired === true);
      if (nameRes.ok) {
        const response = await nameRes.json() as Partial<PreferredName>;
        setPreferredName({
          name: typeof response.name === "string" ? response.name : null,
          state: response.state === "active" || response.state === "paused" ? response.state : "not_saved",
        });
      }
      setError(null);
    } catch (cause) {
      if (mounted.current && request === loadId.current) {
        setError(cause instanceof Error ? cause.message : "Kinfolk Settings could not be loaded.");
      }
    } finally {
      if (mounted.current && request === loadId.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { loadId.current += 1; };
  }, [load]));

  const replaceDraft = (next: Draft) => {
    if (saving) return;
    setError(null);
    setDraft(copyDraft(next));
  };

  const discard = useCallback(() => {
    setDraft(copyDraft(persisted));
    setContinuityDecision(undefined);
    setProfileOpen(false);
    setError(null);
  }, [persisted]);

  const save = useCallback(async (): Promise<boolean> => {
    if (identical(persisted, draft)) return true;
    if (savingPromise.current) return savingPromise.current;
    const snapshot = copyDraft(draft);
    const behaviorChanged = persisted.personalizedSuggestions !== snapshot.personalizedSuggestions;
    const continuityChanged = persisted.continuityEnabled !== snapshot.continuityEnabled;
    const preferencesChanged = persisted.mode !== snapshot.mode
      || persisted.voice !== snapshot.voice
      || persisted.communicationStyle !== snapshot.communicationStyle
      || persisted.emojiLevel !== snapshot.emojiLevel
      || persisted.humorLevel !== snapshot.humorLevel
      || JSON.stringify(persisted.supportLens) !== JSON.stringify(snapshot.supportLens)
      || JSON.stringify(persisted.profile) !== JSON.stringify(snapshot.profile);

    const operation = (async (): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const auth = await token();
        const base = apiBase();
        if (!auth || !base) throw new Error("Please sign in again before saving Kinfolk Settings.");
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${auth}` };
        const requests: Promise<Response>[] = [];
        if (behaviorChanged) requests.push(fetch(`${base}/api/users/settings`, { method: "PUT", headers, body: JSON.stringify({ personalisedSuggestions: snapshot.personalizedSuggestions }) }));
        if (preferencesChanged) requests.push(fetch(`${base}/api/kinfolk/preferences`, {
          method: "PUT", headers,
          body: JSON.stringify({
            personalityMode: snapshot.mode,
            kinfolkVoice: snapshot.voice,
            communicationStyle: snapshot.communicationStyle,
            emojiLevel: snapshot.emojiLevel,
            humorLevel: snapshot.humorLevel,
            preferredOwnershipTypes: snapshot.supportLens,
            supportLensMode: snapshot.supportLens.length ? "strict_documented_designations" : "all_businesses",
            dietaryNotes: snapshot.profile.dietaryNotes.trim() || null,
            budgetRange: snapshot.profile.budgetRange,
            travelCompanion: snapshot.profile.travelCompanion,
            favoriteCities: snapshot.profile.favoriteCities,
            favoriteCategories: snapshot.profile.favoriteCategories,
            lifestyleServices: snapshot.profile.lifestyleServices,
            culturalInterests: snapshot.profile.culturalInterests,
          }),
        }));
        if (continuityChanged) requests.push(fetch(`${base}/api/kinfolk/continuity`, {
          method: "PUT", headers,
          body: JSON.stringify({ enabled: snapshot.continuityEnabled, ...(continuityDecision ? { decision: continuityDecision } : {}) }),
        }));
        const responses = await Promise.all(requests);
        for (const response of responses) {
          if (response.ok) continue;
          const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
          throw new Error(body.error ?? body.message ?? "Kinfolk Settings could not be saved.");
        }
        if (mounted.current) {
          setPersisted(copyDraft(snapshot));
          setDraft(copyDraft(snapshot));
          setContinuityDecision(undefined);
          setProfileOpen(false);
          if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return true;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Kinfolk Settings could not be saved.";
        if (mounted.current) {
          setError(`${message} Your draft is still here. Try Save changes again or keep editing.`);
          Alert.alert("Changes not saved", `${message}\n\nYour draft is still here. Try Save changes again or keep editing.`);
        }
        return false;
      } finally {
        if (mounted.current) setSaving(false);
        savingPromise.current = null;
      }
    })();
    savingPromise.current = operation;
    return operation;
  }, [continuityDecision, draft, persisted]);

  useUnsavedKinfolkExitGuard({ dirty, saving, screenLabel: "Kinfolk Settings", onSave: save, onDiscard: discard });

  const profileSummary = useMemo(() => {
    const rows = [
      draft.profile.dietaryNotes ? `Dietary: ${draft.profile.dietaryNotes}` : null,
      draft.profile.budgetRange !== "any" ? `Budget: ${draft.profile.budgetRange}` : null,
      draft.profile.travelCompanion !== "solo" ? `Travel / family: ${draft.profile.travelCompanion}` : null,
      draft.profile.favoriteCities.length ? `Places: ${draft.profile.favoriteCities.join(", ")}` : null,
      draft.profile.favoriteCategories.length ? `Interests: ${draft.profile.favoriteCategories.join(", ")}` : null,
      draft.profile.lifestyleServices.length ? `Services: ${draft.profile.lifestyleServices.join(", ")}` : null,
      draft.profile.culturalInterests.length ? `Culture: ${draft.profile.culturalInterests.join(", ")}` : null,
    ].filter((value): value is string => Boolean(value));
    return rows;
  }, [draft.profile]);

  const requestContinuity = (next: boolean) => {
    if (next && disclosureRequired) { setDisclosureOpen(true); return; }
    replaceDraft({ ...draft, continuityEnabled: next });
  };

  if (loading) return <View style={[styles.root, { backgroundColor: colors.background }]}><Header colors={colors} topPad={topPad} dirty={false} saving={false} onBack={() => router.back()} onSave={() => undefined} /><View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View></View>;

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <KinfolkContinuityDisclosure visible={disclosureOpen} onChoose={async (decision) => { setDisclosureOpen(false); setContinuityDecision(decision); replaceDraft({ ...draft, continuityEnabled: decision === "accepted" }); return true; }} />
    <Header colors={colors} topPad={topPad} dirty={dirty} saving={saving} onBack={() => router.canGoBack() ? router.back() : router.replace("/settings" as never)} onSave={() => { void save(); }} />
    <ScrollView keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 44 }]}>
      <View style={[styles.intro, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "32" }]}><Feather name="sliders" color={colors.primary} size={21} /><Text style={[styles.introText, { color: colors.foreground }]}>This is the single home for Kinfolk's explicit preferences. Nothing here is created from ordinary chat, and nothing saves until you choose Save changes.</Text></View>
      {error ? <View accessibilityRole="alert" style={styles.error}><Feather name="alert-circle" color="#B42318" size={16} /><Text style={styles.errorText}>{error}</Text></View> : null}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MY PREFERENCES</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Summary colors={colors} icon="message-circle" title="Conversation mode" value={modeLabel(draft.mode)} detail="Communication style only." />
        <Line colors={colors} /><Summary colors={colors} icon="volume-2" title="Voice" value={voiceLabel(draft.voice)} detail="Audio delivery only; separate from mode." />
        <Line colors={colors} /><Summary colors={colors} icon="heart" title="Support preference" value={draft.supportLens.length ? `${draft.supportLens.length} documented designation${draft.supportLens.length === 1 ? "" : "s"} selected` : "No ownership preference selected"} detail="Only your explicit documented-business preference is used." />
        <Line colors={colors} /><Summary colors={colors} icon="user" title="Preferred name" value={nameLabel(preferredName)} detail="Saved separately and never altered by this screen." />
        <Line colors={colors} />
        <TouchableOpacity style={styles.row} activeOpacity={0.8} accessibilityLabel="Manage saved Kinfolk memories" onPress={() => router.push("/kinfolk-memory" as never)}><Icon colors={colors} name="lock" /><View style={styles.grow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Saved memories</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>See each explicit note and preferred name; pause, resume, revoke, edit, or delete it there.</Text></View><Feather name="chevron-right" color={colors.mutedForeground} size={18} /></TouchableOpacity>
        <Line colors={colors} />
        <TouchableOpacity style={styles.row} activeOpacity={0.8} accessibilityLabel="Manage Private Places" onPress={() => router.push("/kinfolk-private-places" as never)}><Icon colors={colors} name="map-pin" /><View style={styles.grow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Private Places</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>A separate encrypted space for places you choose; never chat memory or an automatic recommendation.</Text></View><Feather name="chevron-right" color={colors.mutedForeground} size={18} /></TouchableOpacity>
        <Line colors={colors} />
        <TouchableOpacity style={styles.row} activeOpacity={0.8} accessibilityLabel="Manage Temporary Stays" onPress={() => router.push("/kinfolk-temporary-stays" as never)}><Icon colors={colors} name="calendar" /><View style={styles.grow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Temporary Stays</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>An encrypted travel stay with explicit dates, a limited post-stay grace window, and your own edit, pause, extend, and delete controls.</Text></View><Feather name="chevron-right" color={colors.mutedForeground} size={18} /></TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONVERSATION MODE</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>{modeOptions.map((option, index) => <React.Fragment key={option.value}><TouchableOpacity disabled={saving} style={styles.row} activeOpacity={0.8} accessibilityRole="radio" accessibilityState={{ selected: draft.mode === option.value, disabled: saving }} accessibilityLabel={option.label} onPress={() => replaceDraft({ ...draft, mode: option.value })}><Icon colors={colors} name={option.icon} selected={draft.mode === option.value} /><View style={styles.grow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{option.label}</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{option.description}</Text></View><Radio colors={colors} selected={draft.mode === option.value} /></TouchableOpacity>{index < modeOptions.length - 1 ? <Line colors={colors} /> : null}</React.Fragment>)}</View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VOICE</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <VoiceRow colors={colors} selected={draft.voice === "onyx"} disabled={saving} label="Standard Kinfolk Voice" description="The familiar Kinfolk speaker across every mode." onPress={() => replaceDraft({ ...draft, voice: "onyx" })} />
        <Line colors={colors} />
        <VoiceRow colors={colors} selected={draft.voice === "nova" || draft.voice === "shimmer"} disabled={saving} label="Female Voice" description="Warm, grounded, confident adult woman's synthetic voice — natural, clear, steady, and compassionate without vagueness across every mode." onPress={() => replaceDraft({ ...draft, voice: "nova" })} />
        <Line colors={colors} />
        <TouchableOpacity disabled={saving} style={styles.row} activeOpacity={0.8} accessibilityLabel="Run Voice Preflight" onPress={() => router.push("/kinfolk-voice-preflight" as never)}><Icon colors={colors} name="mic" /><View style={styles.grow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Run Voice Preflight</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Check microphone, transcript review, and audible playback for your saved voice on this device.</Text></View><Feather name="chevron-right" color={colors.mutedForeground} size={18} /></TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>COMMUNICATION DETAILS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ChoiceSet colors={colors} title="Response style" options={communicationStyles} value={draft.communicationStyle} disabled={saving} onChange={(communicationStyle) => replaceDraft({ ...draft, communicationStyle })} />
        <Line colors={colors} />
        <ChoiceSet colors={colors} title="Emoji usage" options={emojiLevels} value={draft.emojiLevel} disabled={saving} onChange={(emojiLevel) => replaceDraft({ ...draft, emojiLevel })} />
        <Line colors={colors} />
        <ChoiceSet colors={colors} title="Humor level" options={humorLevels} value={draft.humorLevel} disabled={saving} onChange={(humorLevel) => replaceDraft({ ...draft, humorLevel })} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUPPORT & PRIVATE CONTROLS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.support}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Support preference</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Choose documented designations you intentionally want Kinfolk to prioritize. This never states who you are.</Text><SupportLensDropdowns selected={draft.supportLens} disabled={saving} onChange={(supportLens) => replaceDraft({ ...draft, supportLens })} /><TouchableOpacity disabled={saving || draft.supportLens.length === 0} onPress={() => replaceDraft({ ...draft, supportLens: [] })}><Text style={[styles.linkText, { color: colors.primary, opacity: saving || draft.supportLens.length === 0 ? 0.45 : 1 }]}>Clear Support Lens</Text></TouchableOpacity></View>
        <Line colors={colors} />
        <Toggle colors={colors} icon="database" title="Continue private context" value={draft.continuityEnabled} disabled={saving} detail={draft.continuityEnabled ? "Active — Kinfolk may use approved private context." : "Paused — Kinfolk will not use or retain new continuity context."} onChange={requestContinuity} />
        <Line colors={colors} />
        <Toggle colors={colors} icon="cpu" title="Personalised suggestions" value={draft.personalizedSuggestions} disabled={saving} detail={draft.personalizedSuggestions ? "Active — explicit profile preferences can tailor suggestions." : "Paused — Kinfolk gives general suggestions without your profile preferences."} onChange={(personalizedSuggestions) => replaceDraft({ ...draft, personalizedSuggestions })} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EXPLICIT PROFILE DETAILS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {profileSummary.length ? profileSummary.map((item) => <Text key={item} style={[styles.profileItem, { color: colors.mutedForeground }]}>{item}</Text>) : <Text style={[styles.profileItem, { color: colors.mutedForeground }]}>No additional explicit profile details are saved.</Text>}
        <Line colors={colors} />
        <TouchableOpacity disabled={saving} style={styles.row} activeOpacity={0.8} accessibilityLabel="Edit explicit Kinfolk profile details" onPress={() => setProfileOpen(true)}><Icon colors={colors} name="edit-2" /><View style={styles.grow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Edit profile details</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Dietary, budget, travel/family, places, interests, and regular services.</Text></View><Feather name="chevron-right" color={colors.mutedForeground} size={18} /></TouchableOpacity>
      </View>
      <View style={[styles.note, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Feather name="shield" color={colors.mutedForeground} size={15} /><Text style={[styles.noteText, { color: colors.mutedForeground }]}>Accessibility and regional-language preferences are not inferred or created here. Regional-language controls will appear only after a separately completed, consent-aware release.</Text></View>
    </ScrollView>
    <ProfileEditor visible={profileOpen} profile={draft.profile} saving={saving} colors={colors} onClose={() => setProfileOpen(false)} onApply={(profile) => { replaceDraft({ ...draft, profile }); setProfileOpen(false); }} />
  </View>;
}

function Header({ colors, topPad, dirty, saving, onBack, onSave }: { colors: ReturnType<typeof useColors>; topPad: number; dirty: boolean; saving: boolean; onBack: () => void; onSave: () => void }) {
  return <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}><TouchableOpacity style={styles.back} accessibilityLabel="Back from Kinfolk Settings" onPress={onBack}><Feather name="arrow-left" color={colors.foreground} size={22} /></TouchableOpacity><Text style={[styles.headerTitle, { color: colors.foreground }]}>Kinfolk Settings</Text><TouchableOpacity disabled={!dirty || saving} accessibilityLabel="Save Kinfolk Settings changes" onPress={onSave} style={[styles.save, { backgroundColor: dirty ? colors.primary : colors.secondary, opacity: saving ? 0.7 : 1 }]}><Text style={[styles.saveText, { color: dirty ? PRIMARY_ACTION_INK : colors.mutedForeground }]}>{saving ? "Saving…" : "Save"}</Text></TouchableOpacity></View>;
}
function Line({ colors }: { colors: ReturnType<typeof useColors> }) { return <View style={[styles.line, { backgroundColor: colors.border }]} />; }
function Icon({ colors, name, selected = false }: { colors: ReturnType<typeof useColors>; name: React.ComponentProps<typeof Feather>["name"]; selected?: boolean }) { return <View style={[styles.icon, { backgroundColor: selected ? colors.primary + "1B" : colors.secondary }]}><Feather name={name} size={16} color={selected ? colors.primary : colors.mutedForeground} /></View>; }
function Radio({ colors, selected }: { colors: ReturnType<typeof useColors>; selected: boolean }) { return <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>{selected ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}</View>; }
function Summary({ colors, icon, title, value, detail }: { colors: ReturnType<typeof useColors>; icon: React.ComponentProps<typeof Feather>["name"]; title: string; value: string; detail: string }) { return <View style={styles.row}><Icon colors={colors} name={icon} /><View style={styles.grow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.value, { color: colors.primary }]}>{value}</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{detail}</Text></View></View>; }
function VoiceRow({ colors, selected, disabled, label, description, onPress }: { colors: ReturnType<typeof useColors>; selected: boolean; disabled: boolean; label: string; description: string; onPress: () => void }) { return <TouchableOpacity disabled={disabled} style={styles.row} activeOpacity={0.8} accessibilityRole="radio" accessibilityState={{ selected, disabled }} accessibilityLabel={label} onPress={onPress}><Icon colors={colors} name={label === "Female Voice" ? "user" : "volume-2"} selected={selected} /><View style={styles.grow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{label}</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{description}</Text></View><Radio colors={colors} selected={selected} /></TouchableOpacity>; }
function ChoiceSet({ colors, title, options, value, disabled, onChange }: { colors: ReturnType<typeof useColors>; title: string; options: { value: string; label: string }[]; value: string; disabled: boolean; onChange: (value: string) => void }) { return <View style={styles.choiceSet}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><View style={styles.chips}>{options.map((option) => <Chip key={option.value} colors={colors} label={option.label} selected={value === option.value} disabled={disabled} onPress={() => onChange(option.value)} />)}</View></View>; }
function Toggle({ colors, icon, title, detail, value, disabled, onChange }: { colors: ReturnType<typeof useColors>; icon: React.ComponentProps<typeof Feather>["name"]; title: string; detail: string; value: boolean; disabled: boolean; onChange: (value: boolean) => void }) { return <View style={styles.row}><Icon colors={colors} name={icon} /><View style={styles.grow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{detail}</Text></View><Switch value={value} disabled={disabled} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.primary + "A0" }} thumbColor={value ? colors.primary : "#f4f4f5"} accessibilityLabel={title} /></View>; }

function ProfileEditor({ visible, profile, saving, colors, onClose, onApply }: { visible: boolean; profile: Profile; saving: boolean; colors: ReturnType<typeof useColors>; onClose: () => void; onApply: (profile: Profile) => void }) {
  const [draft, setDraft] = useState<Profile>(profile);
  useEffect(() => { if (visible) setDraft({ ...profile, favoriteCities: [...profile.favoriteCities], favoriteCategories: [...profile.favoriteCategories], lifestyleServices: [...profile.lifestyleServices], culturalInterests: [...profile.culturalInterests] }); }, [profile, visible]);
  const field = (label: string, key: keyof Pick<Profile, "favoriteCities" | "favoriteCategories" | "lifestyleServices" | "culturalInterests">) => <View key={key}><Text style={[styles.formLabel, { color: colors.foreground }]}>{label}</Text><TextInput value={listText(draft[key])} editable={!saving} onChangeText={(value) => setDraft((current) => ({ ...current, [key]: textList(value) }))} placeholder="Separate items with commas" placeholderTextColor={colors.mutedForeground} multiline style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} accessibilityLabel={label} /></View>;
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><View style={[styles.modal, { backgroundColor: colors.background }]}><View style={[styles.modalHeader, { borderBottomColor: colors.border }]}><View style={styles.grow}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit explicit profile details</Text><Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Nothing saves until you return and select Save changes.</Text></View><TouchableOpacity onPress={onClose} accessibilityLabel="Close profile details editor" style={styles.close}><Feather name="x" color={colors.foreground} size={22} /></TouchableOpacity></View><ScrollView keyboardDismissMode="on-drag" contentContainerStyle={styles.form}><Text style={[styles.formLabel, { color: colors.foreground }]}>Dietary notes</Text><TextInput value={draft.dietaryNotes} editable={!saving} onChangeText={(dietaryNotes) => setDraft((current) => ({ ...current, dietaryNotes }))} placeholder="Only a preference you want Kinfolk to use" placeholderTextColor={colors.mutedForeground} multiline style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} accessibilityLabel="Dietary notes" /><Text style={[styles.formLabel, { color: colors.foreground }]}>Budget</Text><View style={styles.chips}>{budgets.map((budget) => <Chip key={budget} colors={colors} label={budget === "any" ? "No limit" : budget} selected={draft.budgetRange === budget} disabled={saving} onPress={() => setDraft((current) => ({ ...current, budgetRange: budget }))} />)}</View><Text style={[styles.formLabel, { color: colors.foreground }]}>Travel and family context</Text><View style={styles.chips}>{companions.map((companion) => <Chip key={companion} colors={colors} label={companion} selected={draft.travelCompanion === companion} disabled={saving} onPress={() => setDraft((current) => ({ ...current, travelCompanion: companion }))} />)}</View>{field("Cities you love", "favoriteCities")}{field("Favorite categories and interests", "favoriteCategories")}{field("Lifestyle services", "lifestyleServices")}{field("Cultural interests", "culturalInterests")}<View style={[styles.formNote, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Feather name="lock" color={colors.mutedForeground} size={14} /><Text style={[styles.noteText, { color: colors.mutedForeground }]}>No accessibility or regional-language value is offered because this screen does not infer a preference or create unsupported sensitive data.</Text></View><TouchableOpacity disabled={saving} onPress={() => onApply(draft)} style={[styles.apply, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}><Text style={styles.applyText}>Use these changes</Text></TouchableOpacity></ScrollView></View></Modal>;
}
function Chip({ colors, label, selected, disabled, onPress }: { colors: ReturnType<typeof useColors>; label: string; selected: boolean; disabled: boolean; onPress: () => void }) { return <TouchableOpacity disabled={disabled} onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected, disabled }} style={[styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.card }]}><Text style={[styles.chipText, { color: selected ? PRIMARY_ACTION_INK : colors.foreground }]}>{label}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  root: { flex: 1 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 44, height: 40, alignItems: "flex-start", justifyContent: "center" }, headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: "Inter_700Bold" },
  save: { minWidth: 54, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 }, saveText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20 }, intro: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 18, marginBottom: 18 }, introText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" },
  error: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 12, backgroundColor: "#FFF1F2", borderWidth: 1, borderColor: "#FCA5A5", marginBottom: 18 }, errorText: { flex: 1, color: "#8A1C12", fontSize: 12, lineHeight: 17, fontFamily: "Inter_500Medium" },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, fontFamily: "Inter_600SemiBold", marginBottom: 8 }, card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 22 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }, grow: { flex: 1 }, icon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" }, rowTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" }, rowSub: { fontSize: 12, lineHeight: 17, marginTop: 2, fontFamily: "Inter_400Regular" }, value: { fontSize: 12, lineHeight: 17, marginTop: 2, fontFamily: "Inter_600SemiBold" }, line: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" }, dot: { width: 10, height: 10, borderRadius: 5 }, choiceSet: { padding: 16, gap: 10 }, support: { padding: 16, gap: 8 }, linkText: { marginTop: 4, fontSize: 12, fontFamily: "Inter_700Bold" },
  profileItem: { paddingHorizontal: 16, paddingTop: 12, fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" }, note: { flexDirection: "row", gap: 9, borderRadius: 12, borderWidth: 1, padding: 13, marginBottom: 16 }, noteText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" },
  modal: { flex: 1 }, modalHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth }, modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold" }, close: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, form: { padding: 20, gap: 12, paddingBottom: 42 }, formLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 2 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", textAlignVertical: "top" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { minHeight: 36, borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, justifyContent: "center" }, chipText: { fontSize: 12, textTransform: "capitalize", fontFamily: "Inter_600SemiBold" }, formNote: { flexDirection: "row", gap: 9, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 }, apply: { height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 6 }, applyText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
});
