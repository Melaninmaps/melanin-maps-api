import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

const EMOJIS = ["✨", "🌟", "🏡", "🍽️", "🎉", "🌿", "🎨", "💕", "🏖️", "🎵", "☕", "🍹", "🧳", "🌍", "👑", "🤎", "💪🏾", "🌸", "🎭", "🏆"];

const PRIVACY_OPTIONS = [
  { id: "invite_only", label: "Invite Only", icon: "lock" as const, desc: "Only people you invite can join" },
  { id: "approval", label: "Approval Required", icon: "user-check" as const, desc: "Anyone can request, you approve" },
  { id: "public", label: "Open to All", icon: "globe" as const, desc: "Anyone can join immediately" },
];

// Tier limits displayed to the user
const CIRCLE_TIERS = [
  {
    name: "Free",
    color: "#6B7280",
    circles: "1 circle",
    privateMembers: "4 private members",
    communityMembers: "No community circles",
    canCreate: false,
  },
  {
    name: "Explorer+",
    color: "#3A6BB5",
    circles: "1 circle",
    privateMembers: "4 private members",
    communityMembers: "No community circles",
    canCreate: true,
  },
  {
    name: "Navigator",
    color: "#C9922B",
    circles: "3 circles",
    privateMembers: "10 private members",
    communityMembers: "25 community members",
    canCreate: true,
  },
  {
    name: "Trailblazer",
    color: "#2D7A4F",
    circles: "Unlimited circles",
    privateMembers: "20 private members",
    communityMembers: "100 community members",
    canCreate: true,
  },
];

export default function CreateCircleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<"private" | "community" | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [privacy, setPrivacy] = useState("invite_only");
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert("Name required", "Give your Circle a name."); return; }
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/circles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: name.trim(), type, privacy, description: description.trim() || undefined, emoji, city: city.trim() || undefined, maxMembers: type === "community" ? 50 : 8 }),
      });
      const data = await res.json() as { circle?: { id: number }; error?: string; code?: string; upgradeRequired?: boolean };
      if (!res.ok) {
        if (data.upgradeRequired || data.code === "TIER_LIMIT_REACHED") {
          Alert.alert(
            "Membership Required",
            data.error ?? "Upgrade to Explorer+ to create Kinfolk Circles.",
            [
              { text: "Maybe Later", style: "cancel" },
              { text: "View Plans", onPress: () => router.push("/membership" as any) },
            ],
          );
          return;
        }
        Alert.alert("Couldn't create", data.error ?? "Try again.");
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/circles/[id]", params: { id: String(data.circle!.id) } } as any);
    } catch { Alert.alert("Error", "Something went wrong. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[s.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => step > 1 ? setStep((step - 1) as any) : router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Create a Circle</Text>
        <View style={s.stepDots}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={[s.dot, { backgroundColor: n <= step ? colors.primary : colors.border }]} />
          ))}
        </View>
      </View>

      <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={[s.content, { paddingBottom: bottomPad + 40 }]} keyboardShouldPersistTaps="handled">

        {/* ── STEP 1: Circle Type + Tier Breakdown ── */}
        {step === 1 && (
          <View style={s.stepWrap}>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>What kind of Circle?</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>Choose the type that best fits your group.</Text>

            <TouchableOpacity
              style={[s.typeCard, { backgroundColor: colors.card, borderColor: type === "private" ? colors.primary : colors.border, borderWidth: type === "private" ? 2 : 1 }]}
              onPress={() => { setType("private"); setPrivacy("invite_only"); }}
              activeOpacity={0.8}
            >
              <View style={[s.typeIcon, { backgroundColor: type === "private" ? colors.primary + "18" : colors.secondary }]}>
                <Feather name="home" size={26} color={type === "private" ? colors.primary : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.typeName, { color: colors.foreground }]}>Private Circle</Text>
                <Text style={[s.typeDesc, { color: colors.mutedForeground }]}>Family, close friends, or coworkers. Invite only — up to 20 members (Navigator+).</Text>
              </View>
              {type === "private" && <Feather name="check-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.typeCard, { backgroundColor: colors.card, borderColor: type === "community" ? colors.primary : colors.border, borderWidth: type === "community" ? 2 : 1 }]}
              onPress={() => { setType("community"); setPrivacy("public"); }}
              activeOpacity={0.8}
            >
              <View style={[s.typeIcon, { backgroundColor: type === "community" ? colors.primary + "18" : colors.secondary }]}>
                <Feather name="globe" size={26} color={type === "community" ? colors.primary : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.typeName, { color: colors.foreground }]}>Community Circle</Text>
                <Text style={[s.typeDesc, { color: colors.mutedForeground }]}>Philly Foodies, Black Moms in ATL, Solo Travelers. Up to 100 members (Trailblazer).</Text>
              </View>
              {type === "community" && <Feather name="check-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>

            {/* Tier breakdown card */}
            <View style={[s.tierCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.tierCardHeader}>
                <Feather name="layers" size={15} color={colors.primary} />
                <Text style={[s.tierCardTitle, { color: colors.foreground }]}>Kinfolk Circles — Tier Limits</Text>
              </View>
              {CIRCLE_TIERS.map((tier) => (
                <View key={tier.name} style={[s.tierRow, { borderTopColor: colors.border }]}>
                  <View style={[s.tierBadge, { backgroundColor: tier.color + "18", borderColor: tier.color + "40" }]}>
                    <Text style={[s.tierBadgeName, { color: tier.color }]}>{tier.name}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Feather name="layers" size={11} color={colors.mutedForeground} />
                      <Text style={[s.tierStat, { color: colors.foreground }]}>{tier.circles}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Feather name="users" size={11} color={colors.mutedForeground} />
                      <Text style={[s.tierStat, { color: colors.foreground }]}>{tier.privateMembers}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Feather name="globe" size={11} color={colors.mutedForeground} />
                      <Text style={[s.tierStat, { color: tier.communityMembers === "No community circles" ? colors.mutedForeground : colors.foreground }]}>
                        {tier.communityMembers}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/membership" as any)}
                style={[s.tierUpgradeBtn, { borderColor: colors.primary + "50", backgroundColor: colors.primary + "10" }]}>
                <Feather name="zap" size={13} color={colors.primary} />
                <Text style={[s.tierUpgradeBtnText, { color: colors.primary }]}>Upgrade to unlock more circles</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.85}
              style={[s.nextBtn, { backgroundColor: type ? colors.primary : colors.muted, opacity: type ? 1 : 0.5 }]}
              disabled={!type}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(2); }}
            >
              <Text style={s.nextBtnText}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2: Name + Emoji ── */}
        {step === 2 && (
          <View style={s.stepWrap}>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>Name your Circle</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>Pick an emoji and give it a name your members will recognize.</Text>

            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Choose an Emoji</Text>
            <ScrollView keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {EMOJIS.map((e) => (
                <TouchableOpacity activeOpacity={0.85}
                  key={e}
                  style={[s.emojiBtn, { backgroundColor: emoji === e ? colors.primary + "20" : colors.card, borderColor: emoji === e ? colors.primary : colors.border, borderWidth: emoji === e ? 2 : 1 }]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Circle Name</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={name} onChangeText={setName}
              placeholder={type === "private" ? "The Fam, Squad Goals, Work Crew…" : "Philadelphia Foodies, Black Moms in ATL…"}
              placeholderTextColor={colors.mutedForeground}
              maxLength={50}
            />

            <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Description <Text style={{ color: colors.mutedForeground + "80" }}>(optional)</Text></Text>
            <TextInput
              style={[s.input, s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={description} onChangeText={setDescription}
              placeholder="What's this Circle about?"
              placeholderTextColor={colors.mutedForeground}
              multiline maxLength={200}
            />

            {type === "community" && (
              <>
                <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>City <Text style={{ color: colors.mutedForeground + "80" }}>(optional)</Text></Text>
                <TextInput
                  style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={city} onChangeText={setCity}
                  placeholder="Philadelphia, Atlanta, Houston…"
                  placeholderTextColor={colors.mutedForeground}
                />
              </>
            )}

            <TouchableOpacity activeOpacity={0.85}
              style={[s.nextBtn, { backgroundColor: name.trim().length >= 2 ? colors.primary : colors.muted, opacity: name.trim().length >= 2 ? 1 : 0.5 }]}
              disabled={name.trim().length < 2}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(3); }}
            >
              <Text style={s.nextBtnText}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 3: Privacy ── */}
        {step === 3 && (
          <View style={s.stepWrap}>
            <Text style={[s.stepTitle, { color: colors.foreground }]}>Privacy Settings</Text>
            <Text style={[s.stepSub, { color: colors.mutedForeground }]}>Who can join your Circle?</Text>

            {PRIVACY_OPTIONS.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[s.privacyCard, { backgroundColor: colors.card, borderColor: privacy === v.id ? colors.primary : colors.border, borderWidth: privacy === v.id ? 2 : 1 }]}
                onPress={() => setPrivacy(v.id)}
                activeOpacity={0.8}
              >
                <View style={[s.privacyIcon, { backgroundColor: privacy === v.id ? colors.primary + "18" : colors.secondary }]}>
                  <Feather name={v.icon} size={20} color={privacy === v.id ? colors.primary : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.typeName, { color: colors.foreground }]}>{v.label}</Text>
                  <Text style={[s.typeDesc, { color: colors.mutedForeground }]}>{v.desc}</Text>
                </View>
                {privacy === v.id && <Feather name="check-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}

            <View style={[s.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.typeName, { color: colors.foreground }]}>{name || "Your Circle"}</Text>
                <Text style={[s.typeDesc, { color: colors.mutedForeground }]}>
                  {type === "private" ? "Private Circle" : "Community Circle"} · {privacy === "invite_only" ? "Invite only" : privacy === "approval" ? "Approval required" : "Open to all"}
                </Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.85}
              style={[s.nextBtn, { backgroundColor: colors.primary }]}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                <>
                  <Text style={s.nextBtnText}>Create Circle</Text>
                  <Feather name="check-circle" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  stepDots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: { padding: 20 },
  stepWrap: { gap: 14 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 2 },
  stepSub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, marginBottom: 6 },
  typeCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 16, gap: 14 },
  typeIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  typeName: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 3 },
  typeDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: -6 },
  emojiBtn: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontFamily: "Inter_400Regular", fontSize: 15 },
  textarea: { height: 80, paddingTop: 12, textAlignVertical: "top" },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 8 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
  privacyCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, gap: 14 },
  privacyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  previewCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  // Tier breakdown
  tierCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  tierCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, paddingBottom: 10 },
  tierCardTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  tierRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, paddingVertical: 10, borderTopWidth: 1 },
  tierBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, minWidth: 88, alignItems: "center" },
  tierBadgeName: { fontFamily: "Inter_700Bold", fontSize: 12 },
  tierStat: { fontFamily: "Inter_400Regular", fontSize: 12 },
  tierUpgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, padding: 12, borderTopWidth: 1, marginTop: 2 },
  tierUpgradeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
