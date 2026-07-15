import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useBiometricSettings } from "@/hooks/useBiometrics";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusinessCard } from "@/components/BusinessCard";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAuth } from "@/lib/auth";
import { usePoints } from "@/hooks/usePoints";
import { useMembership } from "@/hooks/useMembership";
import { useCheckins } from "@/hooks/useCheckins";
import { useSpaceWarnings } from "@/hooks/useSpaceWarnings";
import { BadgeSection } from "@/components/BadgeSection";
import { MilestoneSection } from "@/components/MilestoneSection";
import { PointsRedemptionModal } from "@/components/PointsRedemptionModal";
import { TrustLevelCard } from "@/components/TrustBadge";
import { BrandQuoteBanner } from "@/components/BrandQuoteBanner";
import { getDailyQuoteText } from "@/constants/brandQuotes";
import { StatusComposer } from "@/components/StatusComposer";
import { SavedSpotsShare } from "@/components/SavedSpotsShare";
import { CommunityImpactCard } from "@/components/CommunityImpactCard";
import { useShowLoveReceived } from "@/hooks/useShowLove";
import { ShowLoveCard } from "@/components/ShowLoveCard";

const SETTINGS = [
  { icon: "users" as const, label: "Family Circle", sub: "Invite family members at no extra cost — stay safely connected", route: "/family-circle" as const },
  { icon: "map" as const, label: "Trip Planner", sub: "Chat with KinfolkAI™ for travel picks", route: "/travel" as const },
  { icon: "bookmark" as const, label: "Trips I'd Love", sub: "Your KinfolkAI™ saved spots", route: "/wishlist" as const },
  { icon: "grid" as const, label: "My Dashboard", sub: "Saved places, activity & stats", route: "/dashboard" as const },
  { icon: "globe" as const, label: "Community Preference", sub: "Personalise results by cultural identity", route: "/cultural-preference" as const },
  { icon: "users" as const, label: "My Connections", sub: "Friends, requests & people you follow", route: "/connections" as const },
  { icon: "video" as const, label: "Creator Profile", sub: "Connect your channels — send fans to where you create", route: "/creator-profile" as const },
  { icon: "settings" as const, label: "Settings", sub: "Account, notifications, privacy", route: "/settings" as const },
  { icon: "bell" as const, label: "Notifications", sub: "Manage alerts and updates", route: "/notifications-settings" as const },
  { icon: "shield" as const, label: "Privacy & Safety", sub: "Control your data and visibility", route: "/privacy" as const },
  { icon: "award" as const, label: "Membership", sub: "Explore (Free) — upgrade anytime", route: "/membership" as const },
  { icon: "briefcase" as const, label: "Business Admin", sub: "Manage your listing, category & profile", route: "/business-owner" as const },
  { icon: "share-2" as const, label: "Referral Program", sub: "Invite friends, earn rewards", route: "/referral" as const },
  { icon: "plus-circle" as const, label: "Nominate a Business", sub: "Know a great minority-owned spot? Add it to our community", route: "/nominate-business" as const },
  { icon: "users" as const, label: "Mentorship Network", sub: "Connect with mentors & peers", route: "/mentorship" as const },
  { icon: "tag" as const, label: "Affiliate Partner Discounts", sub: "Hotels, flights & travel perks", route: "/affiliate" as const },
  { icon: "credit-card" as const, label: "Billing & Invoices", sub: "Manage subscription & history", route: "/billing" as const },
];

const INDUSTRIES = [
  "Technology & Software",
  "Healthcare & Wellness",
  "Finance & Banking",
  "Real Estate",
  "Food & Beverage",
  "Beauty & Grooming",
  "Fashion & Retail",
  "Entertainment & Media",
  "Education & Training",
  "Legal & Consulting",
  "Construction & Trades",
  "Transportation & Logistics",
  "Arts & Culture",
  "Nonprofit & Advocacy",
  "Sports & Fitness",
  "Travel & Hospitality",
  "Marketing & PR",
  "Music & Events",
  "Other",
];

const ADMIN_EMAILS = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function PrivacyToggleCard({
  user,
  refreshUser,
  colors,
}: {
  user: ReturnType<typeof useAuth>["user"];
  refreshUser: () => Promise<void>;
  colors: ReturnType<typeof useColors>;
}) {
  const [saving, setSaving] = useState(false);
  const isPrivate = !!(user as any)?.isPrivate;

  const toggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      await fetch(`${apiBase}/api/users/me/privacy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ isPrivate: !isPrivate }),
      });
      await refreshUser();
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <View style={[privStyles.card, { backgroundColor: colors.card, borderColor: isPrivate ? colors.primary + "40" : colors.border, shadowColor: colors.foreground }]}>
      <View style={[privStyles.iconWrap, { backgroundColor: isPrivate ? colors.primary + "15" : colors.secondary }]}>
        <Feather name={isPrivate ? "lock" : "unlock"} size={18} color={isPrivate ? colors.primary : colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[privStyles.title, { color: colors.foreground }]}>Private Account</Text>
        <Text style={[privStyles.sub, { color: colors.mutedForeground }]}>
          {isPrivate ? "Only your followers can see your posts" : "Anyone can see your community posts"}
        </Text>
      </View>
      {saving
        ? <ActivityIndicator size="small" color={colors.primary} />
        : <Switch value={isPrivate} onValueChange={toggle} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#FFF" />
      }
    </View>
  );
}

const privStyles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, padding: 14, gap: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
});

const RADIUS_OPTIONS = [1, 2, 3, 5, 10] as const;

function SafetyAlertPrefsCard({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [alertPolice, setAlertPolice] = useState(true);
  const [alertIce, setAlertIce] = useState(true);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
        const res = await fetch(`${apiBase}/api/users/settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const d = await res.json();
          if (d.safetyAlertPolice !== undefined) setAlertPolice(d.safetyAlertPolice);
          if (d.safetyAlertIce !== undefined) setAlertIce(d.safetyAlertIce);
          if (d.safetyAlertRadiusMiles !== undefined) setRadiusMiles(d.safetyAlertRadiusMiles);
        }
      } catch { /* silent */ }
      setLoaded(true);
    })();
  }, []);

  const save = async (patch: Record<string, boolean | number>) => {
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      await fetch(`${apiBase}/api/users/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(patch),
      });
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const togglePolice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !alertPolice;
    setAlertPolice(next);
    void save({ safetyAlertPolice: next });
  };

  const toggleIce = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !alertIce;
    setAlertIce(next);
    void save({ safetyAlertIce: next });
  };

  const pickRadius = (r: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRadiusMiles(r);
    void save({ safetyAlertRadiusMiles: r });
  };

  if (!loaded) return null;

  return (
    <View style={[safetyStyles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}>
      <View style={[safetyStyles.header]}>
        <View style={[safetyStyles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="shield" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[safetyStyles.title, { color: colors.foreground }]}>Safety Alerts</Text>
          <Text style={[safetyStyles.sub, { color: colors.mutedForeground }]}>Get notified when community activity is reported near you</Text>
        </View>
        {saving && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      <View style={[safetyStyles.divider, { backgroundColor: colors.border }]} />

      <View style={safetyStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[safetyStyles.rowLabel, { color: colors.foreground }]}>Police activity</Text>
          <Text style={[safetyStyles.rowSub, { color: colors.mutedForeground }]}>Traffic stops, checkpoints & police presence</Text>
        </View>
        <Switch value={alertPolice} onValueChange={togglePolice} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#FFF" />
      </View>

      <View style={safetyStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[safetyStyles.rowLabel, { color: colors.foreground }]}>ICE / immigration activity</Text>
          <Text style={[safetyStyles.rowSub, { color: colors.mutedForeground }]}>Enforcement activity reported by community</Text>
        </View>
        <Switch value={alertIce} onValueChange={toggleIce} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#FFF" />
      </View>

      <View style={[safetyStyles.divider, { backgroundColor: colors.border }]} />

      <View style={safetyStyles.radiusSection}>
        <Text style={[safetyStyles.rowLabel, { color: colors.foreground }]}>Alert radius</Text>
        <View style={safetyStyles.pillRow}>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity activeOpacity={0.85}
              key={r}
              onPress={() => pickRadius(r)}
              style={[
                safetyStyles.pill,
                { borderColor: colors.border, backgroundColor: r === radiusMiles ? colors.primary : "transparent" },
              ]}
            >
              <Text style={[safetyStyles.pillText, { color: r === radiusMiles ? "#FFF" : colors.mutedForeground }]}>
                {r} mi
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const safetyStyles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, padding: 14, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  rowLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  rowSub: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  radiusSection: { gap: 8 },
  pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  pillText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});

type RecSpot = {
  id: number;
  businessId: string;
  businessName: string | null;
  businessCategory: string | null;
  stance: string | null;
  blurb: string | null;
};

const STANCE_META: Record<string, { label: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  community_favorite: { label: "Community Favorite", icon: "heart", color: "#C4622D" },
  hidden_gem: { label: "Hidden Gem", icon: "star", color: "#CA922B" },
  supporting_local: { label: "Supporting Local", icon: "home", color: "#2D7A4F" },
  visited_loved: { label: "Visited & Loved", icon: "check-circle", color: "#0369A1" },
};

function RecommendedSpotsSection() {
  const colors = useColors();
  const { businesses } = useBusinesses();
  const [spots, setSpots] = useState<RecSpot[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addStance, setAddStance] = useState<string | null>(null);
  const [addBlurb, setAddBlurb] = useState("");
  const [selectedBiz, setSelectedBiz] = useState<{ id: string; name: string; category?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const r = await fetch("/api/users/me/recommended-spots", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r.ok) {
          const data = await r.json() as { spots: RecSpot[] };
          setSpots(data.spots);
        }
      } catch { }
    })();
  }, []);

  const removeSpot = async (businessId: string) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      await fetch(`/api/users/me/recommended-spots/${businessId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSpots((prev) => prev.filter((s) => s.businessId !== businessId));
    } catch { }
  };

  const addSpot = async () => {
    if (!selectedBiz) return;
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const r = await fetch("/api/users/me/recommended-spots", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ businessId: selectedBiz.id, stance: addStance, blurb: addBlurb.trim() || undefined }),
      });
      if (r.ok) {
        const data = await r.json() as { spot: RecSpot };
        setSpots((prev) => {
          const idx = prev.findIndex((s) => s.businessId === data.spot.businessId);
          if (idx >= 0) { const next = [...prev]; next[idx] = data.spot; return next; }
          return [...prev, data.spot];
        });
        setAddOpen(false);
        setSelectedBiz(null);
        setAddStance(null);
        setAddBlurb("");
        setAddSearch("");
      }
    } catch { } finally {
      setSaving(false);
    }
  };

  const filteredBizs = addSearch.length >= 1
    ? businesses.filter((b) => b.name.toLowerCase().includes(addSearch.toLowerCase())).slice(0, 25)
    : [];

  const openAdd = () => { setAddOpen(true); setSelectedBiz(null); setAddStance(null); setAddBlurb(""); setAddSearch(""); };

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16, gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Feather name="award" size={16} color={colors.primary} />
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: colors.foreground }}>My Recommended Spots</Text>
        </View>
        {spots.length < 5 && (
          <TouchableOpacity
            onPress={openAdd}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.primary + "18", borderWidth: 1, borderColor: colors.primary + "30" }}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={13} color={colors.primary} />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.primary }}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {spots.length === 0 && (
        <TouchableOpacity
          style={{ alignItems: "center", paddingVertical: 20, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border }}
          onPress={openAdd}
          activeOpacity={0.7}
        >
          <Feather name="award" size={24} color={colors.mutedForeground} />
          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground, marginTop: 6 }}>Highlight up to 5 favorite spots</Text>
        </TouchableOpacity>
      )}

      {spots.map((spot) => {
        const stance = spot.stance ? STANCE_META[spot.stance] : null;
        return (
          <View key={spot.businessId} style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
              <Feather name="briefcase" size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground }} numberOfLines={1}>{spot.businessName ?? "Business"}</Text>
              {stance && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Feather name={stance.icon} size={10} color={stance.color} />
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: stance.color }}>{stance.label}</Text>
                </View>
              )}
              {spot.blurb ? <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, marginTop: 2 }} numberOfLines={2}>{spot.blurb}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => { void removeSpot(spot.businessId); }} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }} activeOpacity={0.7}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        );
      })}

      <Modal visible={addOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }}>
            {selectedBiz ? (
              <TouchableOpacity onPress={() => setSelectedBiz(null)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Feather name="arrow-left" size={22} color={colors.foreground} />
              </TouchableOpacity>
            ) : null}
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: colors.foreground, flex: 1 }}>
              {selectedBiz ? `Add "${selectedBiz.name}"` : "Choose a Business"}
            </Text>
            <TouchableOpacity onPress={() => setAddOpen(false)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {!selectedBiz ? (
            <View style={{ flex: 1, padding: 16, gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.secondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
                <Feather name="search" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={{ flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground }}
                  placeholder="Search businesses…"
                  placeholderTextColor={colors.mutedForeground}
                  value={addSearch}
                  onChangeText={setAddSearch}
                  autoFocus
                />
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {filteredBizs.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                    onPress={() => setSelectedBiz({ id: b.id, name: b.name, category: b.category })}
                    activeOpacity={0.75}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                      <Feather name="briefcase" size={15} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.foreground }}>{b.name}</Text>
                      {b.category ? <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>{b.category}</Text> : null}
                    </View>
                    <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
                {addSearch.length >= 1 && filteredBizs.length === 0 && (
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center", marginTop: 24 }}>No businesses found</Text>
                )}
                {addSearch.length === 0 && (
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center", marginTop: 24 }}>Start typing to search</Text>
                )}
              </ScrollView>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground }}>Add a stance (optional)</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                {(Object.entries(STANCE_META) as Array<[string, typeof STANCE_META[string]]>).map(([tag, meta]) => {
                  const sel = addStance === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: sel ? meta.color + "18" : colors.secondary, borderWidth: 1, borderColor: sel ? meta.color : colors.border }}
                      onPress={() => setAddStance(sel ? null : tag)}
                      activeOpacity={0.8}
                    >
                      <Feather name={meta.icon} size={12} color={sel ? meta.color : colors.mutedForeground} />
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: sel ? meta.color : colors.mutedForeground }}>{meta.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground }}>Add a note (optional)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontFamily: "Inter_400Regular", fontSize: 13, color: colors.foreground, backgroundColor: colors.secondary, minHeight: 80, textAlignVertical: "top" }}
                placeholder="Why do you recommend this spot?"
                placeholderTextColor={colors.mutedForeground}
                value={addBlurb}
                onChangeText={setAddBlurb}
                maxLength={200}
                multiline
              />
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, alignSelf: "flex-end" }}>{addBlurb.length}/200</Text>

              <TouchableOpacity
                style={{ backgroundColor: saving ? colors.primary + "80" : colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 }}
                onPress={() => { void addSpot(); }}
                activeOpacity={0.85}
                disabled={saving}
              >
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFFFFF" }}>
                  {saving ? "Adding…" : "Add to Recommended Spots"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedIds, isSaved, toggleSave } = useFavorites();
  const { user, isLoading, isAuthenticated, login, logout, refreshUser } = useAuth();
  const { nominations: showLoveNoms } = useShowLoveReceived(user?.id ?? null);
  const { isSupported: biometricSupported, isEnabled: biometricEnabled, label: biometricLabel, toggle: toggleBiometric } = useBiometricSettings();
  const isAdminUser = !!(user?.email && ADMIN_EMAILS.includes(user.email));
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showRedemption, setShowRedemption] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [usernameCheck, setUsernameCheck] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const usernameDebounce = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allTopics, setAllTopics] = useState<{ id: string; label: string; emoji: string; description: string }[]>([]);
  const [myTopicIds, setMyTopicIds] = useState<string[]>([]);
  const [pinnedTopicIds, setPinnedTopicIds] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [trustData, setTrustData] = useState<{
    trustLevel: 1 | 2 | 3 | 4;
    reputationScore: number;
    helpfulReviewsCount: number;
    progress: {
      current: { label: string; description: string; badge: string };
      next: { label: string } | null;
      requirements: { label: string; met: boolean }[];
    };
  } | null>(null);

  const getApiBase = () =>
    process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

  const closeEditModal = () => {
    setShowEditModal(false);
    setShowIndustryPicker(false);
  };

  const openEditModal = () => {
    if (!isAuthenticated) { login(); return; }
    setEditFirstName(user?.firstName ?? "");
    setEditLastName(user?.lastName ?? "");
    setEditBio((user as any)?.bio ?? "");
    setEditIndustry(user?.industry ?? "");
    setEditJobTitle(user?.jobTitle ?? "");
    setEditUsername((user as any)?.username ?? "");
    setLocalAvatarUri(null);
    setUploadedAvatarUrl(null);
    setUsernameCheck("idle");
    setShowIndustryPicker(false);
    setShowEditModal(true);
  };

  const checkUsername = (raw: string) => {
    const val = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setEditUsername(val);
    if (usernameDebounce.current) clearTimeout(usernameDebounce.current);
    if (val === (user as any)?.username) { setUsernameCheck("idle"); return; }
    if (val.length === 0) { setUsernameCheck("idle"); return; }
    if (val.length < 3 || val.length > 30) { setUsernameCheck("invalid"); return; }
    setUsernameCheck("checking");
    usernameDebounce.current = setTimeout(async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/users/check-username/${val}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json() as { available: boolean };
        setUsernameCheck(data.available ? "available" : "taken");
      } catch { setUsernameCheck("idle"); }
    }, 500);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = getApiBase();
      const body: Record<string, unknown> = {
        firstName: editFirstName,
        lastName: editLastName,
        bio: editBio,
        industry: editIndustry,
        jobTitle: editJobTitle,
        username: editUsername || null,
      };
      if (uploadedAvatarUrl) body.profileImageUrl = uploadedAvatarUrl;
      const res = await fetch(`${apiBase}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        if (res.status === 401) {
          closeEditModal();
          Alert.alert("Session expired", "Please sign in again to update your profile.", [
            { text: "Sign In", onPress: login },
            { text: "Cancel", style: "cancel" },
          ]);
          return;
        }
        Alert.alert("Couldn't save", err.error ?? "Something went wrong. Please try again.");
        return;
      }
      closeEditModal();
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Couldn't save", "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const pickProfileImage = async () => {
    if ((Platform.OS as string) === "web") {
      Alert.alert("Not supported", "Photo upload is available in the mobile app.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Photo access needed",
        "To set a profile photo, allow access to your photo library in Settings.",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" },
        ],
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setLocalAvatarUri(asset.uri);
    setUploadingAvatar(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const apiBase = getApiBase();
      const formData = new FormData();
      formData.append("avatar", { uri: asset.uri, type: asset.mimeType ?? "image/jpeg", name: "avatar.jpg" } as unknown as Blob);
      const res = await fetch(`${apiBase}/api/users/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url: string };
      setUploadedAvatarUrl(data.url);
      await refreshUser();
    } catch {
      Alert.alert("Upload failed", "Couldn't upload photo. It will be saved when you tap Save.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const loadTopics = useCallback(async () => {
    setTopicsLoading(true);
    try {
      const apiBase = getApiBase();
      const [topicsRes, mineRes] = await Promise.all([
        fetch(`${apiBase}/api/health-hub/topics`),
        isAuthenticated
          ? (async () => {
              const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
              return fetch(`${apiBase}/api/health-hub/topics/mine`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
            })()
          : Promise.resolve(null),
      ]);
      if (topicsRes.ok) {
        const d = await topicsRes.json() as { topics: { id: string; label: string; emoji: string; description: string }[] };
        setAllTopics(d.topics);
      }
      if (mineRes?.ok) {
        const d = await mineRes.json() as { topicIds: string[]; pinnedTopicIds?: string[] };
        setMyTopicIds(d.topicIds);
        setPinnedTopicIds(d.pinnedTopicIds ?? []);
      }
    } catch { /* silent */ } finally { setTopicsLoading(false); }
  }, [isAuthenticated]);

  const loadTrust = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const apiBase = getApiBase();
      const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
      const res = await fetch(`${apiBase}/api/users/me/trust`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const d = await res.json() as {
          trustLevel: 1 | 2 | 3 | 4;
          reputationScore: number;
          helpfulReviewsCount: number;
          progress: {
            current: { label: string; description: string; badge: string };
            next: { label: string } | null;
            requirements: { label: string; met: boolean }[];
          };
        };
        setTrustData(d);
      }
    } catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => { void loadTopics(); }, [loadTopics]);
  useEffect(() => { void loadTrust(); }, [loadTrust]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { businesses } = useBusinesses();
  const savedBusinesses = businesses.filter((b) => savedIds.includes(b.id));
  const { isWarned } = useSpaceWarnings();
  const { total: pointsTotal, ledger } = usePoints();
  const reviewCount = ledger.filter((e) => e.action === "review").length;
  const { subscription } = useMembership();
  const { checkedInIds } = useCheckins();
  const checkInCount = checkedInIds.length;
  const eventsAttended = ledger.filter((e) => e.action === "rsvp").length;
  const citiesExplored = new Set(savedBusinesses.map((b) => b.city).filter(Boolean)).size;
  const coffeeCount = savedBusinesses.filter((b) =>
    (b.category ?? "").toLowerCase().includes("coffee") ||
    (b.category ?? "").toLowerCase().includes("cafe") ||
    (b.tags ?? []).some((t: string) => t.toLowerCase().includes("coffee"))
  ).length;

  return (
    <ScrollView
        keyboardDismissMode="on-drag"
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.settingsBtn, { backgroundColor: colors.secondary }]}
            onPress={() => router.push("/notification-center" as any)}
          >
            <Feather name="bell" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} style={[styles.settingsBtn, { backgroundColor: colors.secondary }]} onPress={() => router.push("/settings")}>
            <Feather name="settings" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !isAuthenticated ? (
        <View style={[styles.signInCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image
            source={require("@/assets/images/logo-transparent.png")}
            style={styles.signInLogo}
            contentFit="contain"
          />
          <Text style={[styles.signInTitle, { color: colors.foreground }]}>
            Connect With a Global Community
          </Text>
          <Text style={[styles.signInSub, { color: colors.mutedForeground }]}>
            {getDailyQuoteText("home")}
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/signup" as any)}
            activeOpacity={0.85}
          >
            <Feather name="user-plus" size={18} color="#FFFFFF" />
            <Text style={styles.signInBtnText}>Create Account — It's Free</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.signInBtnGhost, { borderColor: colors.primary + "60" }]}
            onPress={() => router.push("/login" as any)}
            activeOpacity={0.85}
          >
            <Feather name="log-in" size={18} color={colors.primary} />
            <Text style={[styles.signInBtnGhostText, { color: colors.primary }]}>I Already Have an Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.signInBtnGhost, { borderColor: colors.border, marginTop: -4 }]}
            onPress={() => router.push("/preview" as any)}
            activeOpacity={0.8}
          >
            <Feather name="eye" size={18} color={colors.mutedForeground} />
            <Text style={[styles.signInBtnGhostText, { color: colors.mutedForeground }]}>Peek Inside the Platform</Text>
          </TouchableOpacity>
          <View style={styles.benefitsGrid}>
            {[
              { icon: "bookmark", label: "Save Favorites" },
              { icon: "star", label: "Leave Reviews" },
              { icon: "map-pin", label: "Find Businesses" },
              { icon: "users", label: "Join Groups" },
            ].map((b) => (
              <View key={b.label} style={[styles.benefitItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name={b.icon as any} size={18} color={colors.primary} />
                <Text style={[styles.benefitLabel, { color: colors.foreground }]}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.profileCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
            <TouchableOpacity onPress={pickProfileImage} activeOpacity={0.8} style={styles.avatarWrap} disabled={uploadingAvatar}>
              {localAvatarUri || user?.profileImageUrl ? (
                <Image
                  source={{ uri: localAvatarUri ?? user?.profileImageUrl ?? "" }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitials}>{getInitials(user?.firstName, user?.lastName)}</Text>
                </View>
              )}
              <View style={[styles.avatarOverlay, { backgroundColor: colors.primary }]}>
                {uploadingAvatar
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Feather name="camera" size={14} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              {(user as any)?.username ? (
                <Text style={[styles.name, { color: colors.foreground }]}>@{(user as any).username}</Text>
              ) : null}
              {user?.jobTitle || user?.industry ? (
                <Text style={[styles.industryLine, { color: colors.mutedForeground }]}>
                  {[user.jobTitle, user.industry].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
              {(user as any)?.bio ? (
                <Text style={[styles.bio, { color: colors.mutedForeground }]} numberOfLines={2}>{(user as any).bio}</Text>
              ) : null}
              {subscription ? (
                <View style={[styles.memberBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
                  <Feather name="award" size={10} color={colors.primary} />
                  <Text style={[styles.memberBadgeText, { color: colors.primary }]}>
                    {subscription.productName || "Member"}
                  </Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity activeOpacity={0.85} style={[styles.editBtn, { borderColor: colors.border }]} onPress={openEditModal}>
              <Feather name="edit-2" size={15} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* List / manage your business — top-of-profile CTA */}
          <TouchableOpacity
            style={[styles.listBizBanner, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/list-business")}
            activeOpacity={0.88}
          >
            <View style={styles.listBizLeft}>
              <View style={[styles.listBizIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Feather name="briefcase" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listBizTitle}>Own a Business?</Text>
                <Text style={styles.listBizSub}>Get discovered by thousands of locals and travelers — listing is free.</Text>
              </View>
            </View>
            <View style={[styles.listBizCta, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.listBizCtaText}>List Free</Text>
              <Feather name="arrow-right" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Profession community + mentorship quick actions */}
          {user?.industry ? (
            <View style={[styles.profActionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.profActionsHeader]}>
                <Feather name="briefcase" size={16} color="#1D4ED8" />
                <Text style={[styles.profActionsTitle, { color: colors.foreground }]}>{user.industry}</Text>
              </View>
              <View style={styles.profActionsRow}>
                <TouchableOpacity
                  style={[styles.profActionBtn, { backgroundColor: "#1D4ED812", borderColor: "#1D4ED830" }]}
                  onPress={() => router.push("/my-community" as any)}
                  activeOpacity={0.8}
                >
                  <Feather name="users" size={14} color="#1D4ED8" />
                  <Text style={[styles.profActionBtnText, { color: "#1D4ED8" }]}>Join Community</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.profActionBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}
                  onPress={() => router.push("/mentorship" as any)}
                  activeOpacity={0.8}
                >
                  <Feather name="award" size={14} color={colors.primary} />
                  <Text style={[styles.profActionBtnText, { color: colors.primary }]}>Offer Mentorship</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Social stats — always shown when authenticated */}
          <View style={styles.statsRow}>
            {[
              { label: "Followers", value: String((user as any)?.followersCount ?? 0) },
              { label: "Following", value: String((user as any)?.followingCount ?? 0) },
              { label: "Points", value: String(pointsTotal) },
            ].map((stat, i) => (
              <View
                key={stat.label}
                style={[
                  styles.statBox,
                  {
                    backgroundColor: colors.card,
                    shadowColor: colors.foreground,
                    borderRightColor: i < 2 ? colors.border : "transparent",
                  },
                ]}
              >
                <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {reviewCount === 0 && savedIds.length === 0 && pointsTotal === 0 && (
            <View style={[styles.newUserBanner, { backgroundColor: colors.card, shadowColor: colors.foreground, borderColor: colors.border }]}>
              <View style={[styles.newUserIconRow]}>
                {(["compass", "star", "award"] as const).map((icon) => (
                  <View key={icon} style={[styles.newUserIcon, { backgroundColor: colors.primary + "15" }]}>
                    <Feather name={icon} size={16} color={colors.primary} />
                  </View>
                ))}
              </View>
              <Text style={[styles.newUserTitle, { color: colors.foreground }]}>Built for Connection</Text>
              <BrandQuoteBanner category="community" variant="strip" style={{ marginTop: 4 }} />
            </View>
          )}
        </>
      )}

      {isAuthenticated && (
        <BadgeSection savedCount={savedIds.length} isEarlyTester={false} />
      )}

      {isAuthenticated && user?.id && (
        <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
          <CommunityImpactCard
            userId={user.id}
            displayName={[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Community Member"}
            showOwnedBusinesses
          />
        </View>
      )}

      {isAuthenticated && showLoveNoms.length > 0 && (
        <View style={{ marginBottom: 4 }}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 10, paddingTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, letterSpacing: -0.3 }}>Why People Show Love</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                {showLoveNoms.length === 1 ? "1 recognition from the community" : `${showLoveNoms.length} recognitions from the community`}
              </Text>
            </View>
          </View>
          {showLoveNoms.slice(0, 3).map((nom) => (
            <ShowLoveCard key={nom.id} nomination={nom} compact />
          ))}
        </View>
      )}

      {isAuthenticated && trustData && (
        <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
          <TrustLevelCard
            trustLevel={trustData.trustLevel}
            reputationScore={trustData.reputationScore}
            helpfulReviewsCount={trustData.helpfulReviewsCount}
            progress={trustData.progress}
            onVerifyPress={() => router.push("/trust-verification" as any)}
          />
        </View>
      )}

      {isAuthenticated && (
        <View style={{ paddingHorizontal: 16 }}>
          <MilestoneSection
            reviewCount={reviewCount}
            savedCount={savedIds.length}
            pointsTotal={pointsTotal}
            checkInCount={checkInCount}
          />
        </View>
      )}

      {isAuthenticated && (checkInCount > 0 || reviewCount > 0 || citiesExplored > 0) && (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={[streakStyles.wrap, { backgroundColor: "#CA922B" }]}>
            <View style={streakStyles.headerRow}>
              <Text style={streakStyles.headerEmoji}>🤎</Text>
              <View>
                <Text style={streakStyles.headerTitle}>Your Impact This Month</Text>
                <Text style={streakStyles.headerSub}>You're building something real</Text>
              </View>
            </View>
            <View style={streakStyles.grid}>
              <View style={[streakStyles.cell, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
                <Text style={streakStyles.cellNum}>{checkInCount}</Text>
                <Text style={streakStyles.cellLabel}>🏪 Businesses{"\n"}Supported</Text>
              </View>
              <View style={[streakStyles.cell, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
                <Text style={streakStyles.cellNum}>{citiesExplored || 1}</Text>
                <Text style={streakStyles.cellLabel}>🌍 Cities{"\n"}Explored</Text>
              </View>
              <View style={[streakStyles.cell, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
                <Text style={streakStyles.cellNum}>{coffeeCount}</Text>
                <Text style={streakStyles.cellLabel}>☕ Coffee Shops{"\n"}Discovered</Text>
              </View>
              <View style={[streakStyles.cell, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
                <Text style={streakStyles.cellNum}>{eventsAttended}</Text>
                <Text style={streakStyles.cellLabel}>🎉 Events{"\n"}Attended</Text>
              </View>
            </View>
            <View style={streakStyles.footer}>
              <Text style={streakStyles.footerTxt}>Every check-in, review, and visit makes a difference. Keep going. 🔥</Text>
            </View>
          </View>
        </View>
      )}

      {isAuthenticated && pointsTotal > 0 && (
        <TouchableOpacity
          style={[styles.redeemBanner, { backgroundColor: "#CA922B14", borderColor: "#CA922B30" }]}
          onPress={() => setShowRedemption(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.redeemIconWrap, { backgroundColor: "#CA922B22" }]}>
            <Feather name="zap" size={18} color="#CA922B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.redeemTitle, { color: "#CA922B" }]}>Redeem Your Points</Text>
            <Text style={[styles.redeemSub, { color: "#CA922B99" }]}>
              {pointsTotal} pts available — free months, badges & more
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#CA922B" />
        </TouchableOpacity>
      )}

      <PointsRedemptionModal visible={showRedemption} onClose={() => setShowRedemption(false)} />

      {isAuthenticated && (
        <TouchableOpacity
          style={[styles.hubCard, { backgroundColor: "#0A0A0A", borderColor: "#CA922B33" }]}
          onPress={() => router.push("/melanin-wrapped" as any)}
          activeOpacity={0.85}
        >
          <View style={[styles.hubIconWrap, { backgroundColor: "rgba(202,146,43,0.18)" }]}>
            <Feather name="star" size={22} color="#CA922B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.hubTitle, { color: "#FFFFFF" }]}>Melanin Wrapped</Text>
            <Text style={[styles.hubSub, { color: "rgba(255,255,255,0.6)" }]}>
              Your {new Date().getFullYear()} impact — businesses, cities &amp; community
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      )}

      {isAuthenticated && (
        <TouchableOpacity
          style={[styles.hubCard, { backgroundColor: "#1A1A2E", borderColor: "#7C3AED33" }]}
          onPress={() => router.push("/community-hub" as any)}
          activeOpacity={0.85}
        >
          <View style={[styles.hubIconWrap, { backgroundColor: "rgba(124,58,237,0.18)" }]}>
            <Feather name="grid" size={22} color="#A78BFA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.hubTitle, { color: "#FFFFFF" }]}>My Hub</Text>
            <Text style={[styles.hubSub, { color: "rgba(255,255,255,0.6)" }]}>
              Your guides, collections, roadmaps &amp; life journey — all in one place
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      )}

      <Modal visible={showEditModal} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={closeEditModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeEditModal} />
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity activeOpacity={0.85}
                onPress={() => showIndustryPicker ? setShowIndustryPicker(false) : closeEditModal()}
                style={styles.modalCancel}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>
                  {showIndustryPicker ? "Back" : "Cancel"}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {showIndustryPicker ? "Select Industry" : "Edit Profile"}
              </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={saveProfile} disabled={isSaving || showIndustryPicker} style={styles.modalSave}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.modalSaveText, { color: colors.primary }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            {showIndustryPicker ? (
              <ScrollView
        keyboardDismissMode="on-drag" style={styles.industryList} showsVerticalScrollIndicator={false}>
                <TouchableOpacity activeOpacity={0.85} style={[styles.industryOption, { borderBottomColor: colors.border }]} onPress={() => { setEditIndustry(""); setShowIndustryPicker(false); }}>
                  <Text style={[styles.industryOptionText, { color: colors.mutedForeground }]}>No industry</Text>
                  {!editIndustry ? <Feather name="check" size={16} color={colors.primary} /> : null}
                </TouchableOpacity>
                {INDUSTRIES.map((ind) => (
                  <TouchableOpacity activeOpacity={0.85} key={ind} style={[styles.industryOption, { borderBottomColor: colors.border }]} onPress={() => { setEditIndustry(ind); setShowIndustryPicker(false); }}>
                    <Text style={[styles.industryOptionText, { color: colors.foreground }]}>{ind}</Text>
                    {editIndustry === ind ? <Feather name="check" size={16} color={colors.primary} /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <ScrollView
        keyboardDismissMode="on-drag" style={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Username <Text style={{ color: colors.mutedForeground + "88" }}>(optional)</Text></Text>
                <View style={{ position: "relative" }}>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      {
                        backgroundColor: colors.card,
                        borderColor: usernameCheck === "available" ? "#2D7A4F" : usernameCheck === "taken" || usernameCheck === "invalid" ? "#DC2626" : colors.border,
                        color: colors.foreground,
                        paddingLeft: 30,
                      },
                    ]}
                    value={editUsername}
                    onChangeText={checkUsername}
                    placeholder="yourhandle"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={30}
                  />
                  <Text style={{ position: "absolute", left: 12, top: 13, color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 15 }}>@</Text>
                  {usernameCheck === "checking" && <ActivityIndicator size="small" color={colors.primary} style={{ position: "absolute", right: 12, top: 13 }} />}
                  {usernameCheck === "available" && <Feather name="check-circle" size={18} color="#2D7A4F" style={{ position: "absolute", right: 12, top: 13 }} />}
                  {(usernameCheck === "taken" || usernameCheck === "invalid") && <Feather name="x-circle" size={18} color="#DC2626" style={{ position: "absolute", right: 12, top: 13 }} />}
                </View>
                {usernameCheck === "available" && <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#2D7A4F", marginTop: -6 }}>✓ Available</Text>}
                {usernameCheck === "taken" && <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#DC2626", marginTop: -6 }}>That username is taken.</Text>}
                {usernameCheck === "invalid" && editUsername.length > 0 && <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "#DC2626", marginTop: -6 }}>3–30 characters: letters, numbers, underscores only.</Text>}

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>First Name</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First name"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                />

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Last Name</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Last name"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                />

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Bio <Text style={{ color: colors.mutedForeground + "88" }}>(optional)</Text></Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, height: 80, textAlignVertical: "top", paddingTop: 10 }]}
                  value={editBio}
                  onChangeText={(t) => setEditBio(t.slice(0, 300))}
                  placeholder="Tell the community a little about yourself…"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  maxLength={300}
                />
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, textAlign: "right", marginTop: -10, marginBottom: 6 }}>{editBio.length}/300</Text>

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Job Title <Text style={{ color: colors.mutedForeground + "88" }}>(optional)</Text></Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  value={editJobTitle}
                  onChangeText={setEditJobTitle}
                  placeholder="e.g. Founder, Software Engineer"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                />

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Industry <Text style={{ color: colors.mutedForeground + "88" }}>(optional)</Text></Text>
                <TouchableOpacity activeOpacity={0.85} style={[styles.fieldInput, styles.fieldPicker, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowIndustryPicker(true)}>
                  <Text style={[styles.fieldPickerText, { color: editIndustry ? colors.foreground : colors.mutedForeground }]}>
                    {editIndustry || "Select your industry"}
                  </Text>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {isAuthenticated && reviewCount === 0 && savedIds.length === 0 && pointsTotal === 0 && (
        <View style={[styles.gettingStartedCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}>
          <Text style={[styles.gettingStartedTitle, { color: colors.foreground }]}>Get Connected</Text>
          <Text style={[styles.gettingStartedSub, { color: colors.mutedForeground }]}>Complete these steps to start connecting locally and globally</Text>
          {[
            { icon: "compass" as const, label: "Find a trusted business", route: "/(tabs)" as const },
            { icon: "star" as const, label: "Leave your first review", route: "/(tabs)/index" as const },
            { icon: "shield" as const, label: "Submit a safety report", route: "/report-safety" as const },
            { icon: "users" as const, label: "Join a community group", route: "/(tabs)/community" as const },
            { icon: "circle" as const, label: "Start a Kinfolk Circle", route: "/(tabs)/community" as const },
          ].map((step, i, arr) => (
            <TouchableOpacity
              key={step.label}
              style={[
                styles.gettingStartedStep,
                i < arr.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(step.route as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.gettingStartedIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name={step.icon} size={15} color={colors.primary} />
              </View>
              <Text style={[styles.gettingStartedLabel, { color: colors.foreground }]}>{step.label}</Text>
              <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isAuthenticated && (
        <StatusComposer
          authorName={(user as any)?.username ? `@${(user as any).username}` : "You"}
          authorInitials={((user as any)?.username ?? "YO").slice(0, 2).toUpperCase()}
          authorColor="#CA922B"
        />
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pinned Topics</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.card, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.border }}>
              <Feather name="lock" size={10} color={colors.mutedForeground} />
              <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: "600" }}>Private by default</Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/health-hub" as never)}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Manage →</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 10, lineHeight: 17 }}>
          Only topics you choose to pin appear here. Everything else stays private in your Health Hub.
        </Text>
        {topicsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : pinnedTopicIds.length === 0 ? (
          <TouchableOpacity
            style={[styles.emptyFavorites, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/health-hub" as never)}
            activeOpacity={0.8}
          >
            <Feather name="lock" size={28} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No pinned topics yet</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
              Your Health Hub topics are private. Pin any topic to show it on your profile.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.topicGrid}>
            {allTopics
              .filter((t) => pinnedTopicIds.includes(t.id))
              .map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.topicChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    router.push("/health-hub" as never);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.topicChipEmoji}>{t.emoji}</Text>
                  <Text style={[styles.topicChipLabel, { color: colors.foreground }]} numberOfLines={1}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            <TouchableOpacity
              style={[styles.topicChip, styles.topicChipAdd, { borderColor: colors.primary + "50", backgroundColor: colors.primary + "0D" }]}
              onPress={() => router.push("/health-hub" as never)}
              activeOpacity={0.75}
            >
              <Feather name="plus" size={14} color={colors.primary} />
              <Text style={[styles.topicChipLabel, { color: colors.primary }]}>Pin more</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isAuthenticated && savedBusinesses.length > 0 && (
        <SavedSpotsShare savedBusinesses={savedBusinesses} />
      )}

      {isAuthenticated && <RecommendedSpotsSection />}

      <TouchableOpacity
        style={[styles.listBizBanner, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/list-business")}
        activeOpacity={0.88}
      >
        <View style={styles.listBizLeft}>
          <View style={[styles.listBizIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="briefcase" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.listBizTitle}>Own a Business?</Text>
            <Text style={styles.listBizSub}>Get your business community-reviewed, authenticity-checked, and in front of thousands of locals and travelers.</Text>
          </View>
        </View>
        <View style={[styles.listBizCta, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={styles.listBizCtaText}>List Free</Text>
          <Feather name="arrow-right" size={14} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Premium trial countdown — shown while trial is active and user has no paid subscription */}
      {isAuthenticated && !!(user as any)?.trialEndsAt && (() => {
        const trialEnd = new Date((user as any).trialEndsAt as string);
        const msLeft = trialEnd.getTime() - Date.now();
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
        if (daysLeft <= 0) return null;
        return (
          <TouchableOpacity
            style={{ marginHorizontal: 16, marginBottom: 14, borderRadius: 14, backgroundColor: colors.primary + "12", borderWidth: 1, borderColor: colors.primary + "30", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
            onPress={() => router.push("/membership")}
            activeOpacity={0.85}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
              <Feather name="zap" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.primary, marginBottom: 1 }}>
                Premium Trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, lineHeight: 15 }}>
                You're exploring all Premium features free. Tap to keep access after your trial.
              </Text>
            </View>
            <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        );
      })()}

      {/* Messages shortcut */}
      <TouchableOpacity
        style={[styles.messagesBanner, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}
        onPress={() => router.push("/messages")}
        activeOpacity={0.85}
      >
        <View style={[styles.messagesBannerIcon, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="message-circle" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.messagesBannerTitle, { color: colors.foreground }]}>Messages</Text>
          <Text style={[styles.messagesBannerSub, { color: colors.mutedForeground }]}>Connect with your community</Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Privacy toggle card */}
      {isAuthenticated && (
        <PrivacyToggleCard user={user} refreshUser={refreshUser} colors={colors} />
      )}

      {/* Safety alert preferences */}
      {isAuthenticated && (
        <SafetyAlertPrefsCard colors={colors} />
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={[styles.settingsList, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
          {SETTINGS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.settingItem,
                idx < SETTINGS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name={item.icon} size={16} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>
                  {item.label === "Membership"
                    ? subscription
                      ? `${subscription.productName || "Premium"} — Active`
                      : "Explore (Free) — upgrade anytime"
                    : item.sub}
                </Text>
              </View>
              {item.label === "Membership" && subscription ? (
                <View style={[styles.activeIndicator, { backgroundColor: "#22C55E18", borderColor: "#22C55E30" }]}>
                  <View style={[styles.activeDot, { backgroundColor: "#22C55E" }]} />
                </View>
              ) : null}
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Admin Panel access — only visible to admin users */}
      {isAdminUser && (
        <TouchableOpacity
          style={[styles.adminBanner, { backgroundColor: "#1A1A2E", borderColor: "#DC262630" }]}
          onPress={() => router.push("/admin")}
          activeOpacity={0.88}
        >
          <View style={styles.adminBannerLeft}>
            <View style={[styles.adminIcon, { backgroundColor: "#DC262620" }]}>
              <Feather name="shield" size={20} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminBannerTitle}>Admin Panel</Text>
              <Text style={styles.adminBannerSub}>Manage businesses, users, reports & analytics</Text>
            </View>
          </View>
          <View style={[styles.adminCta, { backgroundColor: "#DC262618", borderColor: "#DC262640" }]}>
            <Text style={styles.adminCtaText}>Open</Text>
            <Feather name="arrow-right" size={13} color="#DC2626" />
          </View>
        </TouchableOpacity>
      )}

      {isAuthenticated && biometricSupported && (
        <View style={[styles.biometricRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.biometricIconWrap, { backgroundColor: colors.primary + "15" }]}>
            <Feather
              name={biometricLabel === "Face ID" || biometricLabel === "Face Recognition" ? "aperture" : "lock"}
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.biometricTitle, { color: colors.foreground }]}>
              {biometricLabel} Login
            </Text>
            <Text style={[styles.biometricSub, { color: colors.mutedForeground }]}>
              {biometricEnabled ? `Use ${biometricLabel} to sign in faster` : `Enable quick sign-in with ${biometricLabel}`}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={async (value) => {
              if (!value) {
                Alert.alert(
                  `Disable ${biometricLabel}?`,
                  "You'll need to sign in with your account next time.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Disable", style: "destructive", onPress: () => { void toggleBiometric(false); } },
                  ]
                );
              } else {
                const ok = await toggleBiometric(true);
                if (!ok) Alert.alert("Not verified", `${biometricLabel} was not confirmed. Try again.`);
              }
            }}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={biometricEnabled ? colors.primary : colors.mutedForeground}
            ios_backgroundColor={colors.border}
          />
        </View>
      )}

      {isAuthenticated && (
        <TouchableOpacity activeOpacity={0.85}
          style={[styles.signOutBtn, { borderColor: colors.destructive + "40" }]}
          onPress={logout}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 60,
  },
  signInCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  signInLogo: {
    width: 100,
    height: 100,
    marginBottom: 4,
  },
  signInTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    textAlign: "center",
  },
  signInSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  signInBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  signInBtnGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 2,
  },
  signInBtnGhostText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
    justifyContent: "center",
  },
  benefitItem: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: "45%",
  },
  benefitLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  avatarWrap: {
    position: "relative",
    width: 60,
    height: 60,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarInitials: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  username: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginTop: 1,
  },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  email: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  since: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRightWidth: 1,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  seeAll: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  topicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  topicChipAdd: {
    borderStyle: "dashed",
  },
  topicChipEmoji: {
    fontSize: 15,
  },
  topicChipLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  emptyFavorites: {
    alignItems: "center",
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  alertsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: -2,
    marginBottom: 8,
  },
  alertsRowTxt: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  emptySubText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
  settingsList: {
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  settingSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  messagesBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  messagesBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesBannerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginBottom: 2,
  },
  messagesBannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  unreadPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 22,
    alignItems: "center",
  },
  unreadPillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#FFFFFF",
  },
  adminBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
  },
  adminBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  adminIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  adminBannerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 3,
  },
  adminBannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
  },
  adminCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  adminCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#DC2626",
  },
  newUserBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  newUserIconRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  newUserIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  newUserTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 17,
    textAlign: "center",
  },
  newUserSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  gettingStartedCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  gettingStartedTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    marginBottom: 2,
  },
  gettingStartedSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 12,
  },
  gettingStartedStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  gettingStartedIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gettingStartedLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    flex: 1,
  },
  biometricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  biometricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  biometricTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  biometricSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  signOutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  listBizBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  listBizLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  listBizIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  listBizTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  listBizSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 19,
  },
  listBizCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  listBizCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  memberBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  activeIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hubCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  hubIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  hubTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  hubSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  redeemBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  redeemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  redeemTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  redeemSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 1,
  },
  industryLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 1,
  },
  profActionsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  profActionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profActionsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    flex: 1,
  },
  profActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  profActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  profActionBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    minWidth: 60,
  },
  modalCancelText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  modalSave: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  modalSaveText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 16,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  fieldPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldPickerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  industryList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  industryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  industryOptionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
});

const streakStyles = StyleSheet.create({
  wrap: { borderRadius: 16, padding: 16, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerEmoji: { fontSize: 28 },
  headerTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: "47%", borderRadius: 12, padding: 12, gap: 4, alignItems: "flex-start" },
  cellNum: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  cellLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", lineHeight: 17 },
  footer: { paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" },
  footerTxt: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", textAlign: "center" },
});
