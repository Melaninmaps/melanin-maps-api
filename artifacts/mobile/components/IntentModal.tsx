import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { useMembership } from "@/hooks/useMembership";
import { UpgradeModal } from "@/components/UpgradeModal";

export type IntentId =
  | "moving" | "visiting" | "safety" | "trip"
  | "businesses" | "community" | "comparing" | "work";

export const INTENTS: Array<{ id: IntentId; label: string; emoji: string; color: string; description: string }> = [
  { id: "moving",     label: "I'm moving here",                emoji: "🏡", color: "#16A34A", description: "Find realtors, movers & schools" },
  { id: "visiting",   label: "I'm visiting",                   emoji: "✈️", color: "#2563EB", description: "Local spots, restaurants & stays" },
  { id: "safety",     label: "Looking for safe spaces",        emoji: "🛡️", color: "#7C3AED", description: "Community safety & welcoming spaces" },
  { id: "trip",       label: "Planning a trip",                emoji: "🗺️", color: "#0891B2", description: "Itinerary planning & experiences" },
  { id: "businesses", label: "Finding Black-owned businesses", emoji: "🏪", color: "#D97706", description: "Discover & support local businesses" },
  { id: "community",  label: "Looking for community",          emoji: "👥", color: "#DC2626", description: "Groups, events & connections" },
  { id: "comparing",  label: "Comparing neighborhoods",        emoji: "⚖️", color: "#6B7280", description: "Side-by-side area comparison" },
  { id: "work",       label: "Looking for work",               emoji: "💼", color: "#059669", description: "Career resources & employers" },
];

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
import * as SecureStore from "expo-secure-store";
async function getToken(): Promise<string | null> {
  try { if (Platform.OS === "web") return null; return await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

export type PinLocation = {
  label: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
};

type Props = {
  visible: boolean;
  location: PinLocation | null;
  onClose: () => void;
  onSaved: (intentId: IntentId, pinId: string) => void;
};

export function IntentModal({ visible, location, onClose, onSaved }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedIntent, setSelectedIntent] = useState<IntentId | null>(null);
  const [customLabel, setCustomLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { subscription } = useMembership();

  const handleSelect = async (intentId: IntentId) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIntent(intentId);
  };

  const handleSave = async () => {
    if (!selectedIntent) { Alert.alert("Choose an intent", "Tell us what you're trying to do here."); return; }

    if (!subscription) {
      setShowUpgrade(true);
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const body = {
        label: (customLabel.trim() || location?.label || "My pinned area"),
        city: location?.city,
        state: location?.state,
        latitude: location?.latitude,
        longitude: location?.longitude,
        intentId: selectedIntent,
      };

      const res = await fetch(`${getApiBase()}/api/smart-pathways/pins`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error ?? "Could not save pin");

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedIntent(null);
      setCustomLabel("");
      onSaved(selectedIntent, data.pin.id);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const intent = INTENTS.find(i => i.id === selectedIntent);

  return (
    <>
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Pin This Area</Text>
            {location && (
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                📍 {location.label}{location.city ? `, ${location.city}` : ""}{location.state ? `, ${location.state}` : ""}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.question, { color: colors.foreground }]}>What are you trying to do here?</Text>
          <Text style={[styles.questionSub, { color: colors.mutedForeground }]}>
            Your choice unlocks a personalized Smart Pathway™ — curated resources matched to your goal.
          </Text>

          {/* Intent grid */}
          <View style={styles.grid}>
            {INTENTS.map(intent => {
              const active = selectedIntent === intent.id;
              return (
                <TouchableOpacity
                  key={intent.id}
                  style={[styles.intentCard, {
                    backgroundColor: active ? intent.color + "18" : colors.card,
                    borderColor: active ? intent.color : colors.border,
                    borderWidth: active ? 2 : 1,
                  }]}
                  onPress={() => handleSelect(intent.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.intentEmoji}>{intent.emoji}</Text>
                  <Text style={[styles.intentLabel, { color: active ? intent.color : colors.foreground }]} numberOfLines={2}>
                    {intent.label}
                  </Text>
                  <Text style={[styles.intentDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {intent.description}
                  </Text>
                  {active && (
                    <View style={[styles.checkMark, { backgroundColor: intent.color }]}>
                      <Feather name="check" size={10} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom label */}
          <Text style={[styles.labelHeader, { color: colors.foreground }]}>Area label (optional)</Text>
          <TextInput
            style={[styles.labelInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={customLabel}
            onChangeText={setCustomLabel}
            placeholder={location?.label ?? "e.g. Midtown Atlanta, Harlem, Hyde Park"}
            placeholderTextColor={colors.mutedForeground}
            maxLength={100}
          />
        </ScrollView>

        {/* CTA */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {intent && (
            <View style={[styles.previewBanner, { backgroundColor: intent.color + "12", borderColor: intent.color + "30" }]}>
              <Text style={styles.previewEmoji}>{intent.emoji}</Text>
              <Text style={[styles.previewTxt, { color: intent.color }]}>
                You'll get your {intent.label.replace("I'm ", "").replace("I'm", "")} Smart Pathway™
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: selectedIntent ? (intent?.color ?? colors.primary) : colors.border, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={saving || !selectedIntent}
          >
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Feather name="map-pin" size={16} color="#FFF" />}
            <Text style={styles.saveBtnTxt}>{saving ? "Saving…" : "Save & Open Pathway"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
            <Text style={[styles.skipTxt, { color: colors.mutedForeground }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    <UpgradeModal
      visible={showUpgrade}
      onClose={() => setShowUpgrade(false)}
      feature="Smart Pathways™"
      reason="Smart Pathways™ builds personalized relocation, travel, and safety plans on your behalf — that's premium intelligence."
    />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 8, gap: 12 },
  question: { fontSize: 20, fontWeight: "800", lineHeight: 26 },
  questionSub: { fontSize: 13, lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  intentCard: {
    width: "47%", padding: 14, borderRadius: 14, gap: 5,
    position: "relative",
  },
  intentEmoji: { fontSize: 26 },
  intentLabel: { fontSize: 13, fontWeight: "700", lineHeight: 17 },
  intentDesc: { fontSize: 11, lineHeight: 15 },
  checkMark: { position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  labelHeader: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  labelInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  footer: { borderTopWidth: 1, padding: 16, gap: 10 },
  previewBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  previewEmoji: { fontSize: 18 },
  previewTxt: { flex: 1, fontSize: 13, fontWeight: "700" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  saveBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  skipBtn: { alignItems: "center", paddingVertical: 6 },
  skipTxt: { fontSize: 14 },
});
