import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useKinfolkChatScroll } from "@/hooks/useKinfolkChatScroll";
import { getDailyQuoteText } from "@/constants/brandQuotes";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useKinfolk, type ChatMessage, type TravelBusiness, type TravelNeighborhood, type TravelEvent, type SmartPromotion, type TaskAction, type LibraryAction, type HeritageSitePin, type NearbyNudge } from "@/hooks/useKinfolk";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useWishlist } from "@/hooks/useWishlist";
import { KinfolkOnboarding, shouldShowKinfolkOnboarding, resetKinfolkOnboarding } from "@/components/KinfolkOnboarding";
import { useAuth } from "@/lib/auth";
import { useMembership } from "@/hooks/useMembership";
import { UpgradeModal } from "@/components/UpgradeModal";
import * as SecureStore from "expo-secure-store";
import * as Speech from "expo-speech";
import * as ImagePicker from "expo-image-picker";
import { getApiBase } from "@/lib/api";
import { openExternalUrl } from "@/lib/safeLinking";

// ─── Constants ───────────────────────────────────────────────────────────────
const GOLD = "#C9922B";

const ALL_CATEGORIES = [
  "Food & Drink", "Nightlife", "Culture & Art", "Music & Live Events",
  "Beauty & Wellness", "History", "Outdoors", "Family-Friendly",
  "Shopping", "Coffee", "Spiritual", "Sports",
];
const AVOID_CATEGORIES = [
  "Nightlife", "Bars & Clubs", "Loud venues", "Crowded spaces",
  "Tourist spots", "Chains", "Expensive dining",
];
const BUDGET_OPTIONS = [
  { id: "budget", label: "Budget 💵" },
  { id: "mid", label: "Mid-range 💳" },
  { id: "luxury", label: "Luxury ✨" },
  { id: "any", label: "No limit" },
];
const TRIP_STYLES = [
  { id: "solo", label: "Solo traveler" },
  { id: "couple", label: "Couples getaway" },
  { id: "family", label: "Family trip" },
  { id: "group", label: "Friend group" },
  { id: "business", label: "Work trip" },
  { id: "spiritual", label: "Spiritual journey" },
];
const COMPANION_OPTIONS = [
  { id: "solo", label: "Solo" },
  { id: "partner", label: "Partner" },
  { id: "family", label: "Family" },
  { id: "friends", label: "Friends" },
  { id: "colleagues", label: "Colleagues" },
];
const LIFE_CHIPS: { emoji: string; label: string; prompt: string }[] = [
  { emoji: "🏠", label: "I'm Moving", prompt: "I'm thinking about relocating" },
  { emoji: "✈️", label: "I'm Traveling", prompt: "I'm planning a trip" },
  { emoji: "💼", label: "My Career", prompt: "I need help with my career" },
  { emoji: "🛍", label: "Find Businesses", prompt: "Help me find minority-owned businesses near me" },
  { emoji: "🤝", label: "Community", prompt: "I want to connect with my community" },
  { emoji: "🛡", label: "Stay Safe", prompt: "I want to check safety info for my area" },
  { emoji: "❤️", label: "Healthcare", prompt: "I need healthcare recommendations" },
  { emoji: "🎓", label: "Schools", prompt: "I need help finding good schools" },
];
const WELCOME_HEADLINES = [
  "What are you navigating today?",
  "Looking for your next favorite place?",
  "Planning a move?",
  "Need a trusted recommendation?",
  "Looking for community?",
  "Tell me where you're headed.",
  "Need help deciding?",
  "Looking for hidden gems?",
  "Let's map it out.",
  "Ready for your next adventure?",
  "What's your next chapter?",
  "How can I help today?",
];
const WELCOME_CHIPS = [
  "Where's good to eat in Atlanta?",
  "Best minority-owned hotels in Houston",
  "What's the vibe in New Orleans?",
  "Hidden gems in DC",
  "Family spots in Chicago",
  "Would my community like this city?",
];

// ─── Kinfolk Voices™ constants ────────────────────────────────────────────────
const KINFOLK_VOICES = [
  { id: "community", icon: "🤎", label: "Big Cousin", desc: "Warm, grounded, conversational", requiresPaid: false },
  { id: "professor", icon: "🎓", label: "Professor", desc: "Clear teaching and context", requiresPaid: false },
  { id: "business_manager", icon: "💼", label: "Business Manager", desc: "Priorities, risks, and next actions", requiresPaid: false },
  { id: "best_friend", icon: "✨", label: "Best Friend", desc: "Supportive, candid, and natural", requiresPaid: false },
] as const;

const COMM_STYLES = [
  { id: "friendly", label: "Friendly", example: "\"I found a few spots I think you'll love!\"" },
  { id: "community", label: "Community", example: "\"The community really enjoys this one.\"" },
  { id: "professional", label: "Professional", example: "\"Here are three options matching your criteria.\"" },
  { id: "conversational", label: "Conversational", example: "\"ok so there's this spot you gotta check out...\"" },
];

const EMOJI_LEVELS = [
  { id: "none", label: "None" },
  { id: "some", label: "A little ✨" },
  { id: "lots", label: "Lots 🎉🔥" },
];

const HUMOR_LEVELS = [
  { id: "off", label: "Just the facts" },
  { id: "light", label: "Light warmth" },
  { id: "playful", label: "Playful — let's have fun" },
];

const CULTURAL_INTERESTS_LIST = [
  "Black History", "Soul Food", "Music & Jazz", "Natural Hair",
  "HBCUs", "Faith-Based", "Family Travel", "Solo Exploration",
  "Art & Culture", "Entrepreneurship", "Nightlife", "Blues & Gospel",
  "Caribbean Culture", "African Heritage", "Wellness", "Local Events",
];

// ─── Sub-component: Business Card ────────────────────────────────────────────
function BusinessCard({
  biz, messageId, city, feedback, onFeedback, wishlistItemId, onWishlist,
  compareMode, isSelected, onCompareToggle, colors,
}: {
  biz: TravelBusiness;
  messageId: string;
  city?: string;
  feedback: Record<string, "like" | "dislike">;
  onFeedback: (msgId: string, name: string, cat: string, city: string, r: "like" | "dislike") => void;
  wishlistItemId: string | null;
  onWishlist: (biz: TravelBusiness, city: string, add: boolean, itemId: string | null) => void;
  compareMode?: boolean;
  isSelected?: boolean;
  onCompareToggle?: (biz: TravelBusiness) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const reaction = feedback[biz.name];
  const wishlisted = wishlistItemId !== null;
  return (
    <TouchableOpacity
      activeOpacity={compareMode ? 0.75 : 1}
      onPress={compareMode ? () => onCompareToggle?.(biz) : undefined}
      style={[
        bizStyles.card,
        { backgroundColor: colors.background, borderColor: isSelected ? colors.primary : colors.border },
        isSelected && { backgroundColor: colors.primary + "08" },
      ]}
    >
      {compareMode && (
        <View style={[bizStyles.compareCheck, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : colors.background }]}>
          {isSelected && <Ionicons name="checkmark" size={11} color="#fff" />}
        </View>
      )}
      <View style={bizStyles.cardTop}>
        <View style={[bizStyles.badge, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[bizStyles.badgeText, { color: colors.primary }]}>{biz.category}</Text>
        </View>
        <Text style={[bizStyles.hood, { color: colors.mutedForeground }]}>
          <Ionicons name="location-outline" size={11} /> {biz.neighborhood}
        </Text>
        <TouchableOpacity activeOpacity={0.85}
          onPress={() => compareMode ? onCompareToggle?.(biz) : onWishlist(biz, city ?? "", !wishlisted, wishlistItemId)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[bizStyles.wishlistBtn, !compareMode && wishlisted && { backgroundColor: colors.primary + "18" }]}
        >
          {compareMode
            ? <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={18} color={isSelected ? colors.primary : colors.mutedForeground} />
            : <Ionicons name={wishlisted ? "bookmark" : "bookmark-outline"} size={16} color={wishlisted ? colors.primary : colors.mutedForeground} />}
        </TouchableOpacity>
      </View>
      <Text style={[bizStyles.name, { color: colors.text }]}>{biz.name}</Text>
      <Text style={[bizStyles.desc, { color: colors.mutedForeground }]}>{biz.description}</Text>
      <View style={[bizStyles.mustTry, { backgroundColor: GOLD + "14", borderColor: GOLD + "33" }]}>
        <Ionicons name="star" size={12} color={GOLD} />
        <Text style={[bizStyles.mustTryText, { color: colors.text }]}>
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>Must try: </Text>{biz.mustTry}
        </Text>
      </View>
      <View style={bizStyles.feedbackRow}>
        <Text style={[bizStyles.feedbackLabel, { color: colors.mutedForeground }]}>Helpful?</Text>
        <TouchableOpacity activeOpacity={0.85}
          style={[bizStyles.feedbackBtn, reaction === "like" && { backgroundColor: "#16A34A22" }]}
          onPress={() => onFeedback(messageId, biz.name, biz.category, city ?? "", "like")}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name={reaction === "like" ? "thumbs-up" : "thumbs-up-outline"} size={16} color={reaction === "like" ? "#16A34A" : colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85}
          style={[bizStyles.feedbackBtn, reaction === "dislike" && { backgroundColor: "#DC262622" }]}
          onPress={() => onFeedback(messageId, biz.name, biz.category, city ?? "", "dislike")}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name={reaction === "dislike" ? "thumbs-down" : "thumbs-down-outline"} size={16} color={reaction === "dislike" ? "#DC2626" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const bizStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1.5, padding: 12, marginBottom: 8 },
  compareCheck: { position: "absolute", top: -6, left: -6, width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center", zIndex: 1 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  hood: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  wishlistBtn: { padding: 4, borderRadius: 8 },
  name: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 4 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginBottom: 8 },
  mustTry: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, borderWidth: 1, padding: 8, marginBottom: 8 },
  mustTryText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  feedbackRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  feedbackLabel: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  feedbackBtn: { padding: 6, borderRadius: 8 },
});

// ─── Sub-component: Neighborhood Card ────────────────────────────────────────
function NeighborhoodCard({ n, colors }: { n: TravelNeighborhood; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[nhStyles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[nhStyles.name, { color: colors.text }]}>{n.name}</Text>
      <Text style={[nhStyles.vibe, { color: GOLD }]}>{n.vibe}</Text>
      {n.highlights.map((h, i) => (
        <View key={i} style={nhStyles.hlRow}>
          <View style={[nhStyles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[nhStyles.hlText, { color: colors.mutedForeground }]}>{h}</Text>
        </View>
      ))}
      {n.safetyNote ? (
        <View style={nhStyles.safetyRow}>
          <Ionicons name="shield-checkmark-outline" size={12} color="#16A34A" />
          <Text style={nhStyles.safetyText}>{n.safetyNote}</Text>
        </View>
      ) : null}
    </View>
  );
}
const nhStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  name: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 2 },
  vibe: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginBottom: 8 },
  hlRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 5 },
  hlText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  safetyRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#F0FDF4", borderRadius: 8, padding: 8, marginTop: 4 },
  safetyText: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#15803D", flex: 1 },
});

// ─── Sub-component: Event Card ────────────────────────────────────────────────
function EventCard({ ev, colors }: { ev: TravelEvent; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[evStyles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={evStyles.top}>
        <View style={[evStyles.badge, { backgroundColor: GOLD + "22" }]}>
          <Text style={[evStyles.badgeText, { color: GOLD }]}>{ev.type}</Text>
        </View>
        <Text style={[evStyles.timing, { color: colors.mutedForeground }]}>
          <Ionicons name="time-outline" size={11} /> {ev.timing}
        </Text>
      </View>
      <Text style={[evStyles.name, { color: colors.text }]}>{ev.name}</Text>
      <Text style={[evStyles.desc, { color: colors.mutedForeground }]}>{ev.description}</Text>
    </View>
  );
}
const evStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  top: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  timing: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1, textAlign: "right" },
  name: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 4 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
});

// ─── Sub-component: Task Action Card ─────────────────────────────────────────
function TaskActionCard({
  action, onConfirm, onDismiss, colors,
}: {
  action: TaskAction;
  onConfirm: () => void;
  onDismiss: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const listName = action.list?.name ?? (action.type === "create_task" ? "Reminder" : "My List");
  const icon = action.list?.icon ?? (action.type === "create_task" ? "⏰" : "📋");
  return (
    <View style={[taStyles.card, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
      <View style={taStyles.headerRow}>
        <View style={[taStyles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
          <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[taStyles.title, { color: colors.text }]}>
            {icon} {listName}
          </Text>
          <Text style={[taStyles.subtitle, { color: colors.mutedForeground }]}>
            {action.tasks.length} {action.tasks.length === 1 ? "item" : "items"} — add to My Lists?
          </Text>
        </View>
      </View>
      <View style={[taStyles.taskList, { borderColor: colors.border }]}>
        {action.tasks.slice(0, 5).map((t, i) => (
          <View key={i} style={[taStyles.taskRow, i < Math.min(action.tasks.length, 5) - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <View style={[taStyles.taskDot, { backgroundColor: colors.primary }]} />
            <Text style={[taStyles.taskTitle, { color: colors.text }]} numberOfLines={1}>{t.title}</Text>
            {t.dueTimeLabel ? (
              <Text style={[taStyles.taskTime, { color: colors.mutedForeground }]}>{t.dueTimeLabel}</Text>
            ) : null}
          </View>
        ))}
        {action.tasks.length > 5 && (
          <Text style={[taStyles.more, { color: colors.mutedForeground }]}>+{action.tasks.length - 5} more items</Text>
        )}
      </View>
      <View style={taStyles.actions}>
        <TouchableOpacity style={[taStyles.addBtn, { backgroundColor: colors.primary }]} onPress={onConfirm} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={14} color="#fff" />
          <Text style={taStyles.addBtnText}>Add to My Lists</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[taStyles.skipBtn, { borderColor: colors.border }]} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={[taStyles.skipBtnText, { color: colors.mutedForeground }]}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const taStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 2 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 12 },
  taskList: { borderRadius: 10, borderWidth: 1, overflow: "hidden", marginBottom: 12 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 9 },
  taskDot: { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
  taskTitle: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  taskTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  more: { fontFamily: "Inter_400Regular", fontSize: 12, paddingHorizontal: 10, paddingVertical: 8 },
  actions: { flexDirection: "row", gap: 8 },
  addBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingVertical: 10 },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  skipBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  skipBtnText: { fontFamily: "Inter_400Regular", fontSize: 13 },
});

// ─── Sub-component: Heritage Site Strip ──────────────────────────────────────
// Shown below an AI reply when Kinfolk finds real cultural sites in the DB.
// Each card offers two actions: open the site on the map, or view its MWM page.
function HeritageSiteStrip({
  sites, colors,
}: { sites: HeritageSitePin[]; colors: ReturnType<typeof useColors> }) {
  if (!sites?.length) return null;

  const SITE_TYPE_ICONS: Record<string, string> = {
    mural: "🎨", monument: "🗿", museum: "🏛", spiritual: "🕌", landmark: "📍",
  };

  return (
    <View style={hsStyles.container}>
      <Text style={[hsStyles.label, { color: colors.mutedForeground }]}>
        📍 On the MWM map
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={hsStyles.scroll}
      >
        {sites.map((site) => (
          <View
            key={site.id}
            style={[hsStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={hsStyles.typeIcon}>
              {SITE_TYPE_ICONS[site.siteType] ?? "📍"}
            </Text>
            <Text style={[hsStyles.name, { color: colors.text }]} numberOfLines={2}>
              {site.name}
            </Text>
            {site.address ? (
              <Text style={[hsStyles.addr, { color: colors.mutedForeground }]} numberOfLines={1}>
                {site.address}
              </Text>
            ) : null}
            <View style={hsStyles.btnRow}>
              <TouchableOpacity
                style={[hsStyles.btn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/map" as never,
                    params: {
                      focusSiteId: site.id,
                      focusLat: String(site.latitude),
                      focusLng: String(site.longitude),
                    },
                  })
                }
              >
                <Ionicons name="map-outline" size={11} color="#fff" />
                <Text style={[hsStyles.btnTxt, { color: "#fff" }]}>Show on Map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[hsStyles.btn, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/cultural-heritage" as never,
                    params: { siteId: site.id },
                  })
                }
              >
                <Ionicons name="information-circle-outline" size={11} color={colors.text} />
                <Text style={[hsStyles.btnTxt, { color: colors.text }]}>View More</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const hsStyles = StyleSheet.create({
  container: { marginTop: 10 },
  label: { fontFamily: "Inter_500Medium", fontSize: 11, marginBottom: 6, paddingHorizontal: 2 },
  scroll: { gap: 8, paddingBottom: 4 },
  card: {
    width: 180, borderRadius: 12, borderWidth: 1.5,
    padding: 12, gap: 4,
  },
  typeIcon: { fontSize: 18 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 18 },
  addr: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15 },
  btnRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  btn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, borderRadius: 8, paddingVertical: 7,
  },
  btnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});

// ─── Sub-component: Nearby Nudge Chip ────────────────────────────────────────
// One sentence, one tap. Server guarantees: single preference-matched category,
// real DB result confirmed, never shown when businesses already surfaced.
function NearbyNudgeChip({
  nudge, onSend, colors,
}: { nudge: NearbyNudge; onSend: (text: string) => void; colors: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity
      style={[nnStyles.chip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
      activeOpacity={0.82}
      onPress={() => onSend(nudge.quickReply)}
    >
      <View style={[nnStyles.iconWrap, { backgroundColor: GOLD + "22" }]}>
        <Ionicons name="compass-outline" size={14} color={GOLD} />
      </View>
      <Text style={[nnStyles.text, { color: colors.text }]} numberOfLines={2}>
        {nudge.text}
      </Text>
      <Ionicons name="chevron-forward" size={13} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}
const nnStyles = StyleSheet.create({
  chip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
    marginTop: 8,
  },
  iconWrap: { width: 26, height: 26, borderRadius: 7, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  text: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 18 },
});

// ─── Sub-component: Library Action Pill ──────────────────────────────────────
function LibraryActionPill({
  action, colors,
}: { action: LibraryAction; colors: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity
      style={[laStyles.pill, { backgroundColor: colors.card, borderColor: GOLD + "40" }]}
      activeOpacity={0.82}
      onPress={() =>
        router.push({ pathname: "/(tabs)/library" as never, params: { topic: action.topicId, focus: "evidence" } })
      }
    >
      <View style={[laStyles.iconWrap, { backgroundColor: GOLD + "18" }]}>
        <Ionicons name="book-outline" size={14} color={GOLD} />
      </View>
      <Text style={[laStyles.label, { color: colors.text }]} numberOfLines={1}>
        {action.label}
      </Text>
      <Ionicons name="chevron-forward" size={13} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}
const laStyles = StyleSheet.create({
  pill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 9,
    marginTop: 8,
  },
  iconWrap: { width: 26, height: 26, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
});

// ─── Sub-component: AI Message ────────────────────────────────────────────────
function AiMessageBubble({
  msg, onFeedback, onQuickReply, onWishlist, wishlistedNames,
  compareMode, compareSelectedNames, onCompareToggle,
  onConfirmTaskAction, onDismissTaskAction,
  colors,
}: {
  msg: ChatMessage;
  onFeedback: (msgId: string, name: string, cat: string, city: string, r: "like" | "dislike") => void;
  onQuickReply: (text: string) => void;
  onWishlist: (biz: TravelBusiness, city: string, add: boolean, itemId: string | null) => void;
  wishlistedNames: Record<string, string>;
  compareMode: boolean;
  compareSelectedNames: Set<string>;
  onCompareToggle: (biz: TravelBusiness) => void;
  onConfirmTaskAction: (msgId: string, action: TaskAction) => void;
  onDismissTaskAction: (msgId: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const recs = msg.recommendations;
  const city = recs?.destination ?? "";
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [dismissedPromo, setDismissedPromo] = useState(false);

  const toggleSection = (s: string) => setExpandedSection((p) => (p === s ? null : s));

  return (
    <View style={aiStyles.wrapper}>
      <View style={aiStyles.avatarCol}>
        <View style={[aiStyles.avatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="sparkles" size={12} color="#fff" />
        </View>
      </View>
      <View style={aiStyles.contentCol}>
        {/* Reply text */}
        <View style={[aiStyles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[aiStyles.bubbleText, { color: colors.text }]}>{msg.content}</Text>
          <TouchableOpacity
            style={aiStyles.speakBtn}
            onPress={() => {
              Speech.speak(msg.content, {
                language: "en-US",
                rate: 0.95,
                onError: () => Alert.alert("Playback Unavailable", "Voice playback couldn't start. Make sure your device volume is on and try again."),
              });
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="volume-medium-outline" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Location resolution pill — shows which city Kinfolk resolved so the member
            never wonders whether their alias (e.g. "Philly", "nawlins") was understood */}
        {msg.role === "assistant" && msg.location?.city && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, marginBottom: 2 }}>
            <Ionicons name="location-outline" size={11} color={GOLD} />
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: GOLD + "BB" }}>
              Searching {msg.location.city}{msg.location.state ? `, ${msg.location.state}` : ""}
            </Text>
          </View>
        )}

        {/* Task Action Card — shown when AI wants to create tasks */}
        {msg.taskAction && !msg.taskActionDone && msg.taskAction.tasks.length > 0 && (
          <TaskActionCard
            action={msg.taskAction}
            onConfirm={() => onConfirmTaskAction(msg.id, msg.taskAction!)}
            onDismiss={() => onDismissTaskAction(msg.id)}
            colors={colors}
          />
        )}

        {/* Library Action Pill — server-controlled link to a published Library topic */}
        {msg.libraryAction?.type === "open_library_node" && (
          <LibraryActionPill action={msg.libraryAction} colors={colors} />
        )}

        {/* Heritage Site Cards — tap to open on map or view MWM site page */}
        {msg.heritageSites && msg.heritageSites.length > 0 && (
          <HeritageSiteStrip sites={msg.heritageSites} colors={colors} />
        )}

        {/* Nearby Nudge — one preference-matched follow-up, only when real DB match exists */}
        {msg.nearbyNudge && !recs && (
          <NearbyNudgeChip nudge={msg.nearbyNudge} onSend={onQuickReply} colors={colors} />
        )}

        {/* Recommendations */}
        {recs && (
          <View style={aiStyles.recsContainer}>
            {/* Summary bar */}
            <View style={[aiStyles.destBar, { backgroundColor: GOLD + "14", borderColor: GOLD + "33" }]}>
              <Ionicons name="location" size={14} color={GOLD} />
              <Text style={[aiStyles.destText, { color: colors.text }]}>{recs.destination}</Text>
              <Text style={[aiStyles.destSummary, { color: colors.mutedForeground }]}>{recs.summary}</Text>
            </View>

            {/* Spots section */}
            {recs.businesses?.length > 0 && (
              <View>
                <TouchableOpacity
                  style={[aiStyles.sectionHeader, { borderColor: colors.border }]}
                  onPress={() => toggleSection("spots")}
                  activeOpacity={0.7}
                >
                  <Text style={aiStyles.sectionIcon}>📍</Text>
                  <Text style={[aiStyles.sectionTitle, { color: colors.text }]}>
                    Spots <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>({recs.businesses.length})</Text>
                  </Text>
                  <Ionicons
                    name={expandedSection === "spots" ? "chevron-up" : "chevron-down"}
                    size={16} color={colors.mutedForeground}
                  />
                </TouchableOpacity>
                {(expandedSection === "spots" || expandedSection === null) &&
                  recs.businesses.map((biz, i) => (
                    <BusinessCard
                      key={i} biz={biz} messageId={msg.id} city={city}
                      feedback={msg.feedback ?? {}} onFeedback={onFeedback}
                      wishlistItemId={wishlistedNames[biz.name] ?? null}
                      onWishlist={onWishlist}
                      compareMode={compareMode}
                      isSelected={compareSelectedNames.has(biz.name)}
                      onCompareToggle={onCompareToggle}
                      colors={colors}
                    />
                  ))}
              </View>
            )}

            {/* Areas section */}
            {recs.neighborhoods?.length > 0 && (
              <View>
                <TouchableOpacity
                  style={[aiStyles.sectionHeader, { borderColor: colors.border }]}
                  onPress={() => toggleSection("areas")}
                  activeOpacity={0.7}
                >
                  <Text style={aiStyles.sectionIcon}>🗺</Text>
                  <Text style={[aiStyles.sectionTitle, { color: colors.text }]}>
                    Areas <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>({recs.neighborhoods.length})</Text>
                  </Text>
                  <Ionicons
                    name={expandedSection === "areas" ? "chevron-up" : "chevron-down"}
                    size={16} color={colors.mutedForeground}
                  />
                </TouchableOpacity>
                {expandedSection === "areas" &&
                  recs.neighborhoods.map((n, i) => (
                    <NeighborhoodCard key={i} n={n} colors={colors} />
                  ))}
              </View>
            )}

            {/* Events section */}
            {recs.events?.length > 0 && (
              <View>
                <TouchableOpacity
                  style={[aiStyles.sectionHeader, { borderColor: colors.border }]}
                  onPress={() => toggleSection("events")}
                  activeOpacity={0.7}
                >
                  <Text style={aiStyles.sectionIcon}>🎉</Text>
                  <Text style={[aiStyles.sectionTitle, { color: colors.text }]}>
                    Events <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>({recs.events.length})</Text>
                  </Text>
                  <Ionicons
                    name={expandedSection === "events" ? "chevron-up" : "chevron-down"}
                    size={16} color={colors.mutedForeground}
                  />
                </TouchableOpacity>
                {expandedSection === "events" &&
                  recs.events.map((ev, i) => (
                    <EventCard key={i} ev={ev} colors={colors} />
                  ))}
              </View>
            )}

            {/* Safety section */}
            {(recs.safetyTips?.length > 0 || recs.localInsights?.length > 0) && (
              <View>
                <TouchableOpacity
                  style={[aiStyles.sectionHeader, { borderColor: colors.border }]}
                  onPress={() => toggleSection("safety")}
                  activeOpacity={0.7}
                >
                  <Text style={aiStyles.sectionIcon}>🛡</Text>
                  <Text style={[aiStyles.sectionTitle, { color: colors.text }]}>Safety & Insights</Text>
                  <Ionicons
                    name={expandedSection === "safety" ? "chevron-up" : "chevron-down"}
                    size={16} color={colors.mutedForeground}
                  />
                </TouchableOpacity>
                {expandedSection === "safety" && (
                  <View style={[aiStyles.safetyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {recs.safetyTips?.map((tip, i) => (
                      <View key={i} style={aiStyles.safetyRow}>
                        <View style={[aiStyles.safetyNum, { backgroundColor: colors.primary }]}>
                          <Text style={aiStyles.safetyNumText}>{i + 1}</Text>
                        </View>
                        <Text style={[aiStyles.safetyText, { color: colors.mutedForeground }]}>{tip}</Text>
                      </View>
                    ))}
                    {recs.localInsights?.map((ins, i) => (
                      <View key={i} style={aiStyles.insightRow}>
                        <Ionicons name="bulb-outline" size={14} color={GOLD} />
                        <Text style={[aiStyles.insightText, { color: colors.mutedForeground }]}>{ins}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Smart Promotion Card — contextual cross-sell surfaced by AI when relevant */}
        {msg.smartPromotion && !dismissedPromo && (
          <SmartPromotionCard
            promo={msg.smartPromotion}
            onCta={(query) => onQuickReply(`Find me ${query} near ${city || "me"}`)}
            onDismiss={() => setDismissedPromo(true)}
            colors={colors}
          />
        )}

        {/* Quick reply chips */}
        {msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
          <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} style={aiStyles.chipsScroll}>
            {msg.followUpSuggestions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[aiStyles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => onQuickReply(s)}
                activeOpacity={0.7}
              >
                <Text style={[aiStyles.chipText, { color: colors.text }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Provenance disclaimer — shown for medical, legal, financial, and emergency intents */}
        {msg.provenanceNote ? (
          <View style={[aiStyles.provenanceBox, { backgroundColor: "#FFF8EC", borderColor: "#CA922B33" }]}>
            <Ionicons name="information-circle-outline" size={12} color="#CA922B" style={{ marginTop: 1 }} />
            <Text style={[aiStyles.provenanceText, { color: "#3A1F0E99" }]}>{msg.provenanceNote}</Text>
          </View>
        ) : null}

        {/* Quiet attribution — present only when the server found a material
            source limitation for the answer. Kept below the response content. */}
        {msg.sourceNote ? (
          <Text style={[aiStyles.sourceNoteText, { color: colors.mutedForeground }]}>
            {msg.sourceNote}
          </Text>
        ) : null}

        {msg.sources && msg.sources.length > 0 && (
          <View style={[aiStyles.sourcesBox, { borderColor: colors.border }]}>
            <Text style={[aiStyles.sourcesTitle, { color: colors.mutedForeground }]}>Sources</Text>
            {msg.sources.slice(0, 5).map((source, index) => (
              <TouchableOpacity key={`${source.url}-${index}`} onPress={() => void openExternalUrl(source.url, { kind: "web" })} style={aiStyles.sourceRow}>
                <Ionicons name="open-outline" size={12} color={GOLD} />
                <Text numberOfLines={2} style={[aiStyles.sourceLink, { color: GOLD }]}>{source.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[aiStyles.timestamp, { color: colors.mutedForeground }]}>
          {formatTime(msg.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const aiStyles = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, paddingHorizontal: 12 },
  avatarCol: { marginRight: 8, paddingTop: 2 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  contentCol: { flex: 1 },
  bubble: { borderRadius: 16, borderTopLeftRadius: 4, padding: 12, borderWidth: 1, marginBottom: 8 },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, flexShrink: 1 },
  speakBtn: { alignSelf: "flex-end", marginTop: 6, padding: 4 },
  recsContainer: { marginBottom: 8 },
  destBar: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 8, flexWrap: "wrap" },
  destText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  destSummary: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, flex: 1 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, borderBottomWidth: 1, marginBottom: 8 },
  sectionIcon: { fontSize: 14 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  safetyBox: { borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 8 },
  safetyRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  safetyNum: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 1 },
  safetyNumText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },
  safetyText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, flex: 1 },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  insightText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, flex: 1 },
  chipsScroll: { marginBottom: 8 },
  chip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  chipText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  provenanceBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginTop: 6, marginBottom: 4 },
  provenanceText: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15, flex: 1 },
  sourceNoteText: { borderTopWidth: 1, borderTopColor: "#3A1F0E14", marginTop: 8, paddingTop: 7, fontFamily: "Inter_400Regular", fontSize: 10, fontStyle: "italic", lineHeight: 14 },
  sourcesBox: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 8, gap: 6 },
  sourcesTitle: { fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  sourceRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  sourceLink: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 11, lineHeight: 15 },
  timestamp: { fontFamily: "Inter_400Regular", fontSize: 10 },
});

// ─── Sub-component: Smart Promotion Card ─────────────────────────────────────
function SmartPromotionCard({
  promo,
  onCta,
  onDismiss,
  colors,
}: {
  promo: SmartPromotion;
  onCta: (query: string) => void;
  onDismiss: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[spStyles.card, { backgroundColor: colors.card, borderColor: GOLD + "55" }]}>
      <View style={[spStyles.goldBar, { backgroundColor: GOLD }]} />
      <View style={spStyles.content}>
        <View style={spStyles.headerRow}>
          <View style={[spStyles.badge, { backgroundColor: GOLD + "22" }]}>
            <Text style={[spStyles.badgeText, { color: GOLD }]}>✦ Smart Pick for You</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <Text style={[spStyles.headline, { color: colors.text }]}>{promo.headline}</Text>
        <Text style={[spStyles.body, { color: colors.mutedForeground }]}>{promo.body}</Text>
        <TouchableOpacity
          style={[spStyles.ctaBtn, { backgroundColor: GOLD }]}
          onPress={() => onCta(promo.ctaQuery)}
          activeOpacity={0.8}
        >
          <Text style={spStyles.ctaText}>{promo.cta}</Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const spStyles = StyleSheet.create({
  card:      { flexDirection: "row", borderRadius: 14, borderWidth: 1.5, marginTop: 6, marginBottom: 6, overflow: "hidden" },
  goldBar:   { width: 4 },
  content:   { flex: 1, padding: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  badge:     { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  headline:  { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 4 },
  body:      { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginBottom: 10 },
  ctaBtn:    { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, alignSelf: "flex-start" },
  ctaText:   { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
});

// ─── Sub-component: User Message ─────────────────────────────────────────────
function UserMessageBubble({ msg, colors }: { msg: ChatMessage; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={umStyles.wrapper}>
      <View style={[umStyles.bubble, { backgroundColor: colors.primary }]}>
        {msg.imageUrls && msg.imageUrls.length > 0 && <View style={umStyles.imageRow}>{msg.imageUrls.map((url) => <Image key={url} source={{ uri: url }} style={umStyles.image} accessibilityLabel="Image shared with Kinfolk" />)}</View>}
        <Text style={umStyles.text}>{msg.content}</Text>
      </View>
      <Text style={[umStyles.timestamp, { color: colors.mutedForeground }]}>{formatTime(msg.timestamp)}</Text>
    </View>
  );
}

const umStyles = StyleSheet.create({
  wrapper: { alignItems: "flex-end", marginBottom: 16, paddingHorizontal: 12 },
  bubble: { borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: "80%" },
  imageRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  image: { width: 120, height: 100, borderRadius: 10 },
  text: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#FFFFFF", lineHeight: 20 },
  timestamp: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 4 },
});

// ─── Sub-component: Typing indicator ─────────────────────────────────────────
function TypingIndicator({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [dot1] = useState(() => new Animated.Value(0));
  const [dot2] = useState(() => new Animated.Value(0));
  const [dot3] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ]),
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 150);
    const a3 = anim(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);
  return (
    <View style={tyStyles.wrapper}>
      <View style={[tyStyles.avatar, { backgroundColor: colors.primary }]}>
        <Ionicons name="sparkles" size={12} color="#fff" />
      </View>
      <View style={[tyStyles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={i} style={[tyStyles.dot, { backgroundColor: colors.mutedForeground, transform: [{ translateY: d }] }]} />
        ))}
      </View>
    </View>
  );
}
const tyStyles = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, marginBottom: 16 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bubble: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 16, borderTopLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

// ─── Sub-component: Welcome Screen ───────────────────────────────────────────
function WelcomeScreen({
  colors, onChipPress, onCityPress,
}: {
  colors: ReturnType<typeof useColors>;
  onChipPress: (t: string) => void;
  onCityPress: (c: string) => void;
}) {
  const [headline] = useState(() => WELCOME_HEADLINES[Math.floor(Math.random() * WELCOME_HEADLINES.length)]);

  return (
    <View style={wsStyles.container}>
      <View style={[wsStyles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
        <Ionicons name="sparkles" size={36} color={colors.primary} />
      </View>
      <Text style={[wsStyles.title, { color: colors.text }]}>Welcome Home.</Text>
      <Text style={[wsStyles.sub, { color: colors.mutedForeground }]}>
        {headline}
      </Text>

      {/* Trip Journals shortcut */}
      <TouchableOpacity
        style={[wsStyles.journalCard, { backgroundColor: "#1A3B2B" }]}
        onPress={() => { router.push("/journals" as never); }}
        activeOpacity={0.85}
      >
        <Text style={wsStyles.journalEmoji}>🗺️</Text>
        <View style={{ flex: 1 }}>
          <Text style={wsStyles.journalTitle}>Trip Journals</Text>
          <Text style={wsStyles.journalSub}>{getDailyQuoteText("diaspora", 2)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color="#C9922B" />
      </TouchableOpacity>

      <View style={wsStyles.lifeChipsWrap}>
        {LIFE_CHIPS.map((c) => (
          <TouchableOpacity
            key={c.label}
            style={[wsStyles.lifeChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => onChipPress(c.prompt)}
            activeOpacity={0.75}
          >
            <Text style={wsStyles.lifeChipEmoji}>{c.emoji}</Text>
            <Text style={[wsStyles.lifeChipText, { color: colors.text }]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[wsStyles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>Or try asking:</Text>
      {WELCOME_CHIPS.map((c) => (
        <TouchableOpacity
          key={c}
          style={[wsStyles.promptChip, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => onChipPress(c)}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
          <Text style={[wsStyles.promptText, { color: colors.text }]}>{c}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
const wsStyles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 8, textAlign: "center" },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, alignSelf: "flex-start" },
  cityChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  cityChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  promptChip: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8, width: "100%" },
  promptText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  journalCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, marginBottom: 20, width: "100%" },
  journalEmoji: { fontSize: 26 },
  journalTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF", marginBottom: 2 },
  journalSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)" },
  lifeChipsWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 20 },
  lifeChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  lifeChipEmoji: { fontSize: 14 },
  lifeChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12.5 },
});

// ─── Sub-component: Taste Profile Sheet ─────────────────────────────────────
function TasteProfileSheet({
  visible, onClose, onRetakeQuiz, colors,
}: {
  visible: boolean;
  onClose: () => void;
  onRetakeQuiz?: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const { preferences, update } = useUserPreferences();
  const { subscription } = useMembership();
  const isPaid = !!subscription;

  const [favCats, setFavCats] = useState<string[]>(preferences?.favoriteCategories ?? []);
  const [avoidCats, setAvoidCats] = useState<string[]>(preferences?.avoidCategories ?? []);
  const [budget, setBudget] = useState(preferences?.budgetRange ?? "any");
  const [tripStyles, setTripStyles] = useState<string[]>(preferences?.tripStyle ?? []);
  const [companion, setCompanion] = useState(preferences?.travelCompanion ?? "solo");
  const [commStyle, setCommStyle] = useState(preferences?.communicationStyle ?? "friendly");
  const [emojiLvl, setEmojiLvl] = useState(preferences?.emojiLevel ?? "some");
  const [humor, setHumor] = useState(preferences?.humorLevel ?? "light");
  const [culturalInt, setCulturalInt] = useState<string[]>((preferences?.culturalInterests ?? []) as string[]);
  const [kbyg, setKbyg] = useState(preferences?.knowBeforeYouGo !== false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      queueMicrotask(() => { setFavCats(preferences.favoriteCategories ?? []); });
      queueMicrotask(() => { setAvoidCats(preferences.avoidCategories ?? []); });
      queueMicrotask(() => { setBudget(preferences.budgetRange ?? "any"); });
      queueMicrotask(() => { setTripStyles(preferences.tripStyle ?? []); });
      queueMicrotask(() => { setCompanion(preferences.travelCompanion ?? "solo"); });
      queueMicrotask(() => {
        setCommStyle(preferences.communicationStyle ?? "friendly");
        setEmojiLvl(preferences.emojiLevel ?? "some");
        setHumor(preferences.humorLevel ?? "light");
        setCulturalInt((preferences.culturalInterests ?? []) as string[]);
        setKbyg(preferences.knowBeforeYouGo !== false);
      });
    }
  }, [preferences, visible]);

  function toggleArr<T>(arr: T[], val: T, set: (a: T[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  async function handleSave() {
    setSaving(true);
    await update({
      favoriteCategories: favCats,
      avoidCategories: avoidCats,
      budgetRange: budget,
      tripStyle: tripStyles,
      travelCompanion: companion,
      communicationStyle: commStyle,
      emojiLevel: emojiLvl,
      humorLevel: humor,
      culturalInterests: culturalInt,
      knowBeforeYouGo: kbyg,
    });
    setSaving(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[tpStyles.container, { backgroundColor: colors.background }]}>
        <View style={[tpStyles.header, { borderBottomColor: colors.border }]}>
          <Text style={[tpStyles.title, { color: colors.text }]}>Your Taste Profile</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView
        keyboardDismissMode="on-drag" style={{ flex: 1 }} contentContainerStyle={tpStyles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[tpStyles.profileBadge, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30" }]}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[tpStyles.profileBadgeText, { color: colors.primary }]}>
              KinfolkAI™ uses your profile to personalize every recommendation. The more you share, the better it gets.
            </Text>
          </View>

          {/* ── Travel Preferences ───────────────────────────────────────── */}
          <Text style={[tpStyles.sectionLabel, { color: colors.text }]}>What do you love?</Text>
          <Text style={[tpStyles.sectionSub, { color: colors.mutedForeground }]}>KinfolkAI will prioritize these in recommendations</Text>
          <View style={tpStyles.chips}>
            {ALL_CATEGORIES.map((c) => {
              const sel = favCats.includes(c);
              return (
                <TouchableOpacity activeOpacity={0.85} key={c} style={[tpStyles.chip, { backgroundColor: sel ? colors.primary : colors.card, borderColor: sel ? colors.primary : colors.border }]} onPress={() => toggleArr(favCats, c, setFavCats)}>
                  <Text style={[tpStyles.chipText, { color: sel ? "#fff" : colors.text }]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[tpStyles.sectionLabel, { color: colors.text, marginTop: 20 }]}>What do you want to avoid?</Text>
          <Text style={[tpStyles.sectionSub, { color: colors.mutedForeground }]}>We&apos;ll skip these unless you ask</Text>
          <View style={tpStyles.chips}>
            {AVOID_CATEGORIES.map((c) => {
              const sel = avoidCats.includes(c);
              return (
                <TouchableOpacity activeOpacity={0.85} key={c} style={[tpStyles.chip, { backgroundColor: sel ? "#DC262614" : colors.card, borderColor: sel ? "#DC2626" : colors.border }]} onPress={() => toggleArr(avoidCats, c, setAvoidCats)}>
                  <Text style={[tpStyles.chipText, { color: sel ? "#DC2626" : colors.text }]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[tpStyles.sectionLabel, { color: colors.text, marginTop: 20 }]}>Budget range</Text>
          <View style={tpStyles.optionRow}>
            {BUDGET_OPTIONS.map((b) => (
              <TouchableOpacity activeOpacity={0.85} key={b.id} style={[tpStyles.optionBtn, { backgroundColor: budget === b.id ? colors.primary : colors.card, borderColor: budget === b.id ? colors.primary : colors.border }]} onPress={() => setBudget(b.id)}>
                <Text style={[tpStyles.optionText, { color: budget === b.id ? "#fff" : colors.text }]}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[tpStyles.sectionLabel, { color: colors.text, marginTop: 20 }]}>How do you travel?</Text>
          <View style={tpStyles.optionRow}>
            {TRIP_STYLES.map((s) => {
              const sel = tripStyles.includes(s.id);
              return (
                <TouchableOpacity activeOpacity={0.85} key={s.id} style={[tpStyles.optionBtn, { backgroundColor: sel ? colors.primary : colors.card, borderColor: sel ? colors.primary : colors.border }]} onPress={() => toggleArr(tripStyles, s.id, setTripStyles)}>
                  <Text style={[tpStyles.optionText, { color: sel ? "#fff" : colors.text }]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[tpStyles.sectionLabel, { color: colors.text, marginTop: 20 }]}>Who&apos;s coming with you?</Text>
          <View style={tpStyles.optionRow}>
            {COMPANION_OPTIONS.map((c) => (
              <TouchableOpacity activeOpacity={0.85} key={c.id} style={[tpStyles.optionBtn, { backgroundColor: companion === c.id ? colors.primary : colors.card, borderColor: companion === c.id ? colors.primary : colors.border }]} onPress={() => setCompanion(c.id)}>
                <Text style={[tpStyles.optionText, { color: companion === c.id ? "#fff" : colors.text }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Kinfolk Voices™ — Home Mode Customization ────────────────── */}
          <View style={[tpStyles.voicesDivider, { borderTopColor: colors.border }]} />
          <View style={[tpStyles.voicesHeader, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
            <Text style={tpStyles.voicesHeaderIcon}>🏠</Text>
            <View style={{ flex: 1 }}>
              <Text style={[tpStyles.voicesHeaderTitle, { color: colors.text }]}>Kinfolk Voices™ — Home Mode</Text>
              <Text style={[tpStyles.voicesHeaderSub, { color: colors.mutedForeground }]}>
                {isPaid
                  ? "Customize how KinfolkAI sounds when you tap 🏠 Home in the chat"
                  : "Upgrade to Explorer+ to personalize your Home voice and unlock all 4 Kinfolk Voices™"}
              </Text>
            </View>
          </View>

          {isPaid ? (
            <>
              <Text style={[tpStyles.sectionLabel, { color: colors.text, marginTop: 20 }]}>Communication style</Text>
              <Text style={[tpStyles.sectionSub, { color: colors.mutedForeground }]}>How should KinfolkAI talk to you when Home mode is active?</Text>
              <View style={{ gap: 8 }}>
                {COMM_STYLES.map((cs) => {
                  const sel = commStyle === cs.id;
                  return (
                    <TouchableOpacity activeOpacity={0.85}
                      key={cs.id}
                      style={[tpStyles.commCard, { backgroundColor: sel ? colors.primary + "12" : colors.card, borderColor: sel ? colors.primary : colors.border }]}
                      onPress={() => setCommStyle(cs.id)}
                    >
                      <View style={tpStyles.commCardTop}>
                        <Text style={[tpStyles.commCardLabel, { color: colors.text }]}>{cs.label}</Text>
                        {sel && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                      </View>
                      <Text style={[tpStyles.commCardExample, { color: colors.mutedForeground }]}>{cs.example}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[tpStyles.sectionLabel, { color: colors.text, marginTop: 20 }]}>Emoji level</Text>
              <View style={tpStyles.optionRow}>
                {EMOJI_LEVELS.map((e) => (
                  <TouchableOpacity activeOpacity={0.85} key={e.id} style={[tpStyles.optionBtn, { backgroundColor: emojiLvl === e.id ? colors.primary : colors.card, borderColor: emojiLvl === e.id ? colors.primary : colors.border }]} onPress={() => setEmojiLvl(e.id)}>
                    <Text style={[tpStyles.optionText, { color: emojiLvl === e.id ? "#fff" : colors.text }]}>{e.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[tpStyles.sectionLabel, { color: colors.text, marginTop: 16 }]}>Humor</Text>
              <View style={tpStyles.optionRow}>
                {HUMOR_LEVELS.map((h) => (
                  <TouchableOpacity activeOpacity={0.85} key={h.id} style={[tpStyles.optionBtn, { backgroundColor: humor === h.id ? colors.primary : colors.card, borderColor: humor === h.id ? colors.primary : colors.border }]} onPress={() => setHumor(h.id)}>
                    <Text style={[tpStyles.optionText, { color: humor === h.id ? "#fff" : colors.text }]}>{h.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[tpStyles.sectionLabel, { color: colors.text, marginTop: 20 }]}>Cultural interests</Text>
              <Text style={[tpStyles.sectionSub, { color: colors.mutedForeground }]}>KinfolkAI weaves these into recommendations when relevant</Text>
              <View style={tpStyles.chips}>
                {CULTURAL_INTERESTS_LIST.map((c) => {
                  const sel = culturalInt.includes(c);
                  return (
                    <TouchableOpacity activeOpacity={0.85} key={c} style={[tpStyles.chip, { backgroundColor: sel ? colors.primary + "18" : colors.card, borderColor: sel ? colors.primary : colors.border }]} onPress={() => toggleArr(culturalInt, c, setCulturalInt)}>
                      <Text style={[tpStyles.chipText, { color: sel ? colors.primary : colors.text }]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[tpStyles.kbygRow, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[tpStyles.kbygTitle, { color: colors.text }]}>📍 Know Before You Go</Text>
                  <Text style={[tpStyles.kbygDesc, { color: colors.mutedForeground }]}>KinfolkAI adds atmosphere, parking, best time, and a community insider tip to each place recommendation</Text>
                </View>
                <Switch
                  value={kbyg}
                  onValueChange={setKbyg}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={[tpStyles.upgradeBtn, { backgroundColor: GOLD + "18", borderColor: GOLD + "40" }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={16} color={GOLD} />
              <Text style={[tpStyles.upgradeBtnText, { color: GOLD }]}>Upgrade to Explorer+ to personalize your Home voice</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {onRetakeQuiz && (
          <TouchableOpacity
            style={[tpStyles.retakeBtn, { borderColor: colors.border }]}
            onPress={() => { onClose(); void resetKinfolkOnboarding().then(onRetakeQuiz); }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={14} color={colors.mutedForeground} />
            <Text style={[tpStyles.retakeBtnText, { color: colors.mutedForeground }]}>Retake KinfolkAI™ setup quiz</Text>
          </TouchableOpacity>
        )}
        <View style={[tpStyles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity activeOpacity={0.85} style={[tpStyles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={tpStyles.saveBtnText}>{saving ? "Saving…" : "Save My Profile"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const tpStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  scroll: { padding: 20, paddingBottom: 36 },
  profileBadge: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 20 },
  profileBadgeText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, flex: 1 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 4 },
  sectionSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  optionText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  voicesDivider: { borderTopWidth: 1, marginTop: 28, marginBottom: 20 },
  voicesHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 4 },
  voicesHeaderIcon: { fontSize: 22, marginTop: 2 },
  voicesHeaderTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 4 },
  voicesHeaderSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  commCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  commCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  commCardLabel: { fontFamily: "Inter_700Bold", fontSize: 14 },
  commCardExample: { fontFamily: "Inter_400Regular", fontSize: 12, fontStyle: "italic" },
  kbygRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  kbygTitle: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 4 },
  kbygDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 16 },
  upgradeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  retakeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginHorizontal: 20, marginBottom: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  retakeBtnText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  footer: { padding: 16, borderTopWidth: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, padding: 16 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});

// ─── Sub-component: Session History Drawer ───────────────────────────────────
function SessionHistoryDrawer({
  visible, sessions, onClose, onSelect, onNew, colors,
}: {
  visible: boolean;
  sessions: { id: string; title: string | null; destination: string | null; createdAt: string }[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[shStyles.container, { backgroundColor: colors.background }]}>
        <View style={[shStyles.header, { borderBottomColor: colors.border }]}>
          <Text style={[shStyles.title, { color: colors.text }]}>Conversation History</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[shStyles.newBtn, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30" }]}
          onPress={() => { onNew(); onClose(); }}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={[shStyles.newBtnText, { color: colors.primary }]}>Start New Conversation</Text>
        </TouchableOpacity>
        <ScrollView
        keyboardDismissMode="on-drag" style={{ flex: 1 }}>
          {sessions.length === 0 ? (
            <Text style={[shStyles.empty, { color: colors.mutedForeground }]}>No past conversations yet</Text>
          ) : (
            sessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[shStyles.item, { borderBottomColor: colors.border }]}
                onPress={() => { onSelect(s.id); onClose(); }}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Text style={[shStyles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                    {s.title ?? s.destination ?? "Conversation"}
                  </Text>
                  <Text style={[shStyles.itemDate, { color: colors.mutedForeground }]}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
const shStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, borderRadius: 12, borderWidth: 1, padding: 14 },
  newBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  empty: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingTop: 40 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  itemTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  itemDate: { fontFamily: "Inter_400Regular", fontSize: 12 },
});

// ─── Flight Tracker ───────────────────────────────────────────────────────────
type TrackedFlight = {
  id: string;
  flight_number: string;
  airline: string | null;
  departure_date: string;
  origin: string | null;
  destination: string | null;
  notes: string | null;
  status?: string;
  statusMessage?: string;
  delay?: number;
};

function getFlightApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function FlightTrackerModal({
  visible, onClose, isAuthenticated, colors,
}: {
  visible: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const [flights, setFlights] = useState<TrackedFlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [flightNum, setFlightNum] = useState("");
  const [depDate, setDepDate] = useState("");
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [airline, setAirline] = useState("");

  const loadFlights = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getFlightApiBase();
      const res = await fetch(`${base}/api/travel/flights/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = (await res.json()) as { flights: TrackedFlight[] };
        setFlights(data.flights ?? []);
      }
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { if (visible) queueMicrotask(() => { void loadFlights(); }); }, [visible, loadFlights]);

  const handleAdd = async () => {
    if (!flightNum.trim() || !depDate.trim()) {
      Alert.alert("Required", "Flight number and departure date are required.");
      return;
    }
    setAdding(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getFlightApiBase();
      const res = await fetch(`${base}/api/travel/flights`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber: flightNum.trim(),
          departureDate: depDate.trim(),
          origin: origin.trim() || undefined,
          destination: dest.trim() || undefined,
          airline: airline.trim() || undefined,
        }),
      });
      if (res.ok) {
        setFlightNum(""); setDepDate(""); setOrigin(""); setDest(""); setAirline("");
        setShowAddForm(false);
        void loadFlights();
      } else {
        Alert.alert("Error", "Failed to add flight.");
      }
    } finally { setAdding(false); }
  };

  const handleDelete = async (id: string) => {
    const token = await SecureStore.getItemAsync("auth_session_token");
    const base = getFlightApiBase();
    await fetch(`${base}/api/travel/flights/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setFlights((prev) => prev.filter((f) => f.id !== id));
  };

  const statusColor = (status?: string) => {
    if (status === "delayed") return "#EF4444";
    if (status === "cancelled") return "#DC2626";
    if (status === "on_time") return "#22C55E";
    if (status === "diverted") return "#F59E0B";
    return colors.mutedForeground;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[ftStyles.container, { backgroundColor: colors.background }]}>
        <View style={[ftStyles.header, { borderBottomColor: colors.border }]}>
          <View style={ftStyles.headerLeft}>
            <Ionicons name="airplane-outline" size={20} color={colors.primary} />
            <Text style={[ftStyles.title, { color: colors.foreground }]}>Flight Tracker</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {!isAuthenticated ? (
          <View style={ftStyles.emptyWrap}>
            <Ionicons name="airplane-outline" size={40} color={colors.mutedForeground} />
            <Text style={[ftStyles.emptyText, { color: colors.mutedForeground }]}>Sign in to track your flights</Text>
          </View>
        ) : (
          <ScrollView
        keyboardDismissMode="on-drag" style={{ flex: 1 }} contentContainerStyle={ftStyles.scroll}>
            <Text style={[ftStyles.subtitle, { color: colors.mutedForeground }]}>
              Save flight numbers from your travel plans. We check status and alert you to delays.
            </Text>

            {!showAddForm && (
              <TouchableOpacity
                style={[ftStyles.addBtn, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30" }]}
                onPress={() => setShowAddForm(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={[ftStyles.addBtnText, { color: colors.primary }]}>Track a Flight</Text>
              </TouchableOpacity>
            )}

            {showAddForm && (
              <View style={[ftStyles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[ftStyles.formTitle, { color: colors.foreground }]}>Add Flight</Text>
                <TextInput
                  style={[ftStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Flight # (e.g. AA1234)"
                  placeholderTextColor={colors.mutedForeground}
                  value={flightNum}
                  onChangeText={(t) => setFlightNum(t.toUpperCase())}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={[ftStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Departure Date (YYYY-MM-DD)"
                  placeholderTextColor={colors.mutedForeground}
                  value={depDate}
                  onChangeText={setDepDate}
                />
                <View style={ftStyles.row}>
                  <TextInput
                    style={[ftStyles.input, ftStyles.halfInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="From (ATL)"
                    placeholderTextColor={colors.mutedForeground}
                    value={origin}
                    onChangeText={(t) => setOrigin(t.toUpperCase())}
                    autoCapitalize="characters"
                  />
                  <TextInput
                    style={[ftStyles.input, ftStyles.halfInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="To (IAH)"
                    placeholderTextColor={colors.mutedForeground}
                    value={dest}
                    onChangeText={(t) => setDest(t.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>
                <TextInput
                  style={[ftStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Airline (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  value={airline}
                  onChangeText={setAirline}
                />
                <View style={ftStyles.formActions}>
                  <TouchableOpacity activeOpacity={0.85} style={[ftStyles.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowAddForm(false)}>
                    <Text style={[ftStyles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.85} style={[ftStyles.saveFlightBtn, { backgroundColor: colors.primary }]} onPress={() => void handleAdd()} disabled={adding}>
                    <Text style={ftStyles.saveFlightBtnText}>{adding ? "Saving…" : "Save Flight"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {loading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
            ) : flights.length === 0 && !showAddForm ? (
              <View style={ftStyles.emptyWrap}>
                <Ionicons name="airplane-outline" size={40} color={colors.mutedForeground} />
                <Text style={[ftStyles.emptyText, { color: colors.mutedForeground }]}>No flights tracked yet</Text>
                <Text style={[ftStyles.emptySub, { color: colors.mutedForeground }]}>
                  Add flight numbers from your travel plans to receive delay alerts
                </Text>
              </View>
            ) : (
              flights.map((f) => (
                <View key={f.id} style={[ftStyles.flightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[ftStyles.flightIcon, { backgroundColor: colors.primary + "14" }]}>
                    <Ionicons name="airplane" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={ftStyles.flightTop}>
                      <Text style={[ftStyles.flightNum, { color: colors.foreground }]}>{f.flight_number}</Text>
                      {f.airline && <Text style={[ftStyles.flightAirline, { color: colors.mutedForeground }]}> · {f.airline}</Text>}
                    </View>
                    <Text style={[ftStyles.flightMeta, { color: colors.mutedForeground }]}>
                      {f.departure_date}
                      {f.origin && f.destination ? ` · ${f.origin} → ${f.destination}` : f.origin ? ` · from ${f.origin}` : f.destination ? ` · to ${f.destination}` : ""}
                    </Text>
                    {f.status && f.status !== "upcoming" && (
                      <View style={[ftStyles.statusBadge, { backgroundColor: statusColor(f.status) + "18" }]}>
                        <View style={[ftStyles.statusDot, { backgroundColor: statusColor(f.status) }]} />
                        <Text style={[ftStyles.statusText, { color: statusColor(f.status) }]}>
                          {f.statusMessage ?? f.status}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => void handleDelete(f.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const ftStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 4 },
  scroll: { padding: 16, gap: 12 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  addBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  formTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 2 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14 },
  row: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  formActions: { flexDirection: "row", gap: 10, marginTop: 2 },
  cancelBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 11, alignItems: "center" },
  cancelBtnText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  saveFlightBtn: { flex: 2, borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  saveFlightBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  emptyWrap: { alignItems: "center", gap: 10, paddingVertical: 32 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", paddingHorizontal: 20 },
  flightCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  flightIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  flightTop: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 3 },
  flightNum: { fontFamily: "Inter_700Bold", fontSize: 16 },
  flightAirline: { fontFamily: "Inter_400Regular", fontSize: 13 },
  flightMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 5, alignSelf: "flex-start" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 11 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function TravelScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const { messages, sessionId, isLoading, sessions, queriesUsed, queriesLimit, sendMessage, submitFeedback, loadSessions, loadSession, startNewSession, confirmTaskAction, dismissTaskAction } = useKinfolk();
  const { preferences } = useUserPreferences();
  const { addItem, removeItem, load: loadWishlist, items: wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { subscription } = useMembership();

  const { q: searchHandoff } = useLocalSearchParams<{ q?: string }>();
  const [inputText, setInputText] = useState(searchHandoff?.trim() ?? "");
  const [voiceMode, setVoiceMode] = useState<"community" | "professor" | "business_manager" | "best_friend">("community");
  const [kinfolkImages, setKinfolkImages] = useState<string[]>([]);
  const [uploadingKinfolkImage, setUploadingKinfolkImage] = useState(false);
  const [rememberThis, setRememberThis] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState<TravelBusiness[]>([]);
  const [showFlights, setShowFlights] = useState(false);
  const { flatListRef, isAtBottom, onUserSend, onScroll: onChatScroll, onContentSizeChange: onChatContentSizeChange, scrollToBottom } = useKinfolkChatScroll();
  const [kinfolkOk, setKinfolkOk] = useState<boolean | null>(null); // null = checking

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => { void loadWishlist(); }, [loadWishlist]);

  useEffect(() => {
    void shouldShowKinfolkOnboarding().then((show) => { if (show) setShowOnboarding(true); });
  }, []);

  // ── KinfolkAI health check ─────────────────────────────────────────────────
  // Checks the real AI connectivity on mount so users see a clear banner
  // instead of a silent failure when the AI backend is unreachable.
  useEffect(() => {
    void (async () => {
      try {
        const base = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
        const r = await fetch(`${base}/api/kinfolk/health`, { signal: AbortSignal.timeout(8000) });
        setKinfolkOk(r.ok);
      } catch {
        setKinfolkOk(false);
      }
    })();
  }, []);

  // Scroll is managed entirely by useKinfolkChatScroll — no direct scrollToEnd here.

  useEffect(() => {
    if (!voiceOutput || isLoading) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    void Speech.stop();
    Speech.speak(last.content, {
      language: "en-US",
      rate: 0.95,
      onError: () => {},
    });
  }, [messages, isLoading, voiceOutput]);

  const pickKinfolkImage = useCallback(async () => {
    if (uploadingKinfolkImage || kinfolkImages.length >= 2) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Photo access needed", "Allow photo access to ask Kinfolk about an image. You can still type any question."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.82, allowsMultipleSelection: false });
    if (result.canceled || !result.assets[0]) return;
    setUploadingKinfolkImage(true);
    try {
      const asset = result.assets[0];
      const token = await SecureStore.getItemAsync("auth_session_token");
      const form = new FormData();
      form.append("file", { uri: asset.uri, name: asset.fileName ?? `kinfolk-${Date.now()}.jpg`, type: asset.mimeType ?? "image/jpeg" } as never);
      const response = await fetch(`${getApiBase()}/api/media/upload?purpose=kinfolk_question`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
      const body = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error ?? "Could not upload that image.");
      setKinfolkImages((items) => items.includes(body.url!) ? items : [...items, body.url!].slice(0, 2));
    } catch (cause) { Alert.alert("Image upload failed", cause instanceof Error ? cause.message : "Please try again."); }
    finally { setUploadingKinfolkImage(false); }
  }, [kinfolkImages.length, uploadingKinfolkImage]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg) return;
    if (!isAuthenticated || !subscription) {
      setShowUpgrade(true);
      return;
    }
    const attachedImages = [...kinfolkImages];
    const shouldRemember = rememberThis;
    setInputText("");
    onUserSend(); // scroll to bottom, suppress jump button for this send
    await sendMessage(msg, { voiceMode, imageUrls: attachedImages, rememberThis: shouldRemember });
    setKinfolkImages([]);
    setRememberThis(false);
  }, [inputText, voiceMode, sendMessage, isAuthenticated, subscription, onUserSend, kinfolkImages, rememberThis]);

  const handleFeedback = useCallback((msgId: string, name: string, cat: string, city: string, r: "like" | "dislike") => {
    void submitFeedback(msgId, name, cat, city, r);
  }, [submitFeedback]);

  const handleConfirmTaskAction = useCallback(async (msgId: string, action: TaskAction) => {
    const ok = await confirmTaskAction(msgId, action);
    if (ok) {
      Alert.alert(
        "Added to My Lists",
        `"${action.list?.name ?? (action.type === "create_task" ? "Reminder" : "My List")}" is ready in your lists.`,
        [
          { text: "View Lists", onPress: () => router.push("/kinfolk-tasks" as any) },
          { text: "OK", style: "cancel" },
        ],
      );
    }
  }, [confirmTaskAction]);

  const handleDismissTaskAction = useCallback((msgId: string) => {
    dismissTaskAction(msgId);
  }, [dismissTaskAction]);

  const wishlistedNames = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const item of wishlistItems) map[item.businessName] = item.id;
    return map;
  }, [wishlistItems]);

  const compareSelectedNamesSet = useMemo(
    () => new Set(compareSelected.map((b) => b.name)),
    [compareSelected],
  );

  const handleWishlist = useCallback((biz: TravelBusiness, city: string, add: boolean, itemId: string | null) => {
    if (add) {
      if (!isAuthenticated) {
        Alert.alert(
          "Sign in to save spots",
          "Create a free account to build your \"Trips I'd Love\" wishlist.",
          [
            { text: "Not now", style: "cancel" },
            { text: "Sign in", onPress: () => router.push("/login" as any) },
          ]
        );
        return;
      }
      void addItem({ businessName: biz.name, category: biz.category, city, neighborhood: biz.neighborhood, description: biz.description, mustTry: biz.mustTry, sessionId });
    } else if (itemId) {
      void removeItem(itemId);
    }
  }, [addItem, removeItem, sessionId, isAuthenticated]);

  const handleHistorySelect = useCallback(async (id: string) => {
    await loadSession(id);
    void loadSessions();
  }, [loadSession, loadSessions]);

  const handleNewSession = useCallback(() => {
    startNewSession();
  }, [startNewSession]);

  const handleCompareToggle = useCallback((biz: TravelBusiness) => {
    setCompareSelected((prev) => {
      const exists = prev.some((b) => b.name === biz.name);
      if (exists) return prev.filter((b) => b.name !== biz.name);
      if (prev.length >= 3) return prev;
      return [...prev, biz];
    });
  }, []);

  const handleCompare = useCallback(async () => {
    if (compareSelected.length < 2) return;
    const selected = compareSelected;
    setCompareMode(false);
    setCompareSelected([]);
    const list = selected
      .map((b, i) => `${i + 1}. ${b.name} (${b.category}${b.neighborhood ? `, ${b.neighborhood}` : ""}) — ${b.description}. Must try: ${b.mustTry}`)
      .join("\n");
    const prompt = `Compare these ${selected.length} spots and tell me which is the best fit for me based on my taste profile and everything I've rated:\n\n${list}\n\nPick one winner and explain why it's the right call for me.`;
    await sendMessage(prompt, { voiceMode });
  }, [compareSelected, sendMessage, voiceMode]);

  const hasProfile = preferences && (
    (preferences.favoriteCategories?.length ?? 0) > 0 ||
    (preferences.tripStyle?.length ?? 0) > 0
  );

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    if (item.role === "user") {
      return <UserMessageBubble msg={item} colors={colors} />;
    }
    return (
      <AiMessageBubble
        msg={item}
        onFeedback={handleFeedback}
        onQuickReply={(t) => void handleSend(t)}
        onWishlist={handleWishlist}
        wishlistedNames={wishlistedNames}
        compareMode={compareMode}
        compareSelectedNames={compareSelectedNamesSet}
        onCompareToggle={handleCompareToggle}
        onConfirmTaskAction={handleConfirmTaskAction}
        onDismissTaskAction={handleDismissTaskAction}
        colors={colors}
      />
    );
  }, [colors, handleFeedback, handleSend, handleWishlist, wishlistedNames, compareMode, compareSelectedNamesSet, handleCompareToggle, handleConfirmTaskAction, handleDismissTaskAction]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="KinfolkAI™"
      />

      {/* Premium upsell banner — shown for non-premium, non-trial members */}
      {isAuthenticated && subscription && subscription.status !== "active" && subscription.status !== "trialing" && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/membership" as any)}
          style={[styles.premiumBanner, { paddingTop: topPad }]}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to KinfolkAI Premium — tap to learn more"
        >
          <Ionicons name="star" size={14} color="#C9922B" />
          <Text style={styles.premiumBannerText}>
            {" "}Upgrade to Premium for unlimited KinfolkAI conversations
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#C9922B" />
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.primary }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.headerBtn} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>KinfolkAI™</Text>
          <Text style={styles.headerSub}>Your personal life companion</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.headerIconBtn, hasProfile && { backgroundColor: "#ffffff30" }]}
            onPress={() => setShowProfile(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="person-circle-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.headerIconBtn, wishlistItems.length > 0 && { backgroundColor: "#ffffff25" }]}
            onPress={() => router.push("/wishlist" as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={wishlistItems.length > 0 ? "bookmark" : "bookmark-outline"} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85}
            style={[styles.headerIconBtn, compareMode && { backgroundColor: "#ffffff40" }]}
            onPress={() => { setCompareMode((v) => !v); setCompareSelected([]); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="scale-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85}
            style={styles.headerIconBtn}
            onPress={() => setShowFlights(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="airplane-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85}
            style={styles.headerIconBtn}
            onPress={() => { void loadSessions(); setShowHistory(true); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="time-outline" size={22} color="#fff" />
          </TouchableOpacity>
          {messages.length > 0 && (
            <TouchableOpacity activeOpacity={0.85} style={styles.headerIconBtn} onPress={handleNewSession} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Personalization banner */}
      {hasProfile && messages.length === 0 && (
        <View style={[styles.personalBanner, { backgroundColor: colors.primary + "12", borderBottomColor: colors.primary + "25" }]}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={[styles.personalBannerText, { color: colors.primary }]}>
            Your taste profile is active — recommendations are personalized to you
          </Text>
        </View>
      )}

      {/* Free-tier query counter — shown after first query when user is on free plan */}
      {isAuthenticated && queriesUsed !== null && queriesUsed > 0 &&
        (!subscription || (subscription.status !== "active" && subscription.status !== "trialing")) && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/membership" as any)}
          style={[styles.queryCounter, {
            backgroundColor: queriesUsed >= queriesLimit - 1 ? "#DC262612" : colors.secondary,
            borderBottomColor: queriesUsed >= queriesLimit - 1 ? "#DC262630" : colors.border,
          }]}
        >
          <Ionicons
            name={queriesUsed >= queriesLimit - 1 ? "warning-outline" : "flash-outline"}
            size={13}
            color={queriesUsed >= queriesLimit - 1 ? "#DC2626" : colors.mutedForeground}
          />
          <Text style={[styles.queryCounterText, { color: queriesUsed >= queriesLimit - 1 ? "#DC2626" : colors.mutedForeground }]}>
            {queriesUsed} of {queriesLimit} free chats used this month
            {queriesUsed >= queriesLimit - 1 ? " — last one!" : " — Upgrade for unlimited"}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={queriesUsed >= queriesLimit - 1 ? "#DC2626" : colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* KinfolkAI status banner — shown when the AI backend is unreachable */}
      {kinfolkOk === false && (
        <View style={[styles.aiDownBanner, { backgroundColor: "#FEF3C7", borderBottomColor: "#F59E0B30" }]}>
          <Ionicons name="warning-outline" size={14} color="#92400E" />
          <Text style={[styles.aiDownBannerText, { color: "#92400E" }]}>
            KinfolkAI is temporarily unavailable. Our team has been notified. Business search and all other features are working normally.
          </Text>
        </View>
      )}

      {/* Chat area */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <FlatList
        keyboardDismissMode="on-drag"
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          ListHeaderComponent={messages.length === 0 ? (
            <WelcomeScreen
              colors={colors}
              onChipPress={(t) => void handleSend(t)}
              onCityPress={(c) => void handleSend(`What's good in ${c}?`)}
            />
          ) : null}
          ListFooterComponent={isLoading ? <TypingIndicator colors={colors} /> : null}
          showsVerticalScrollIndicator={false}
          onScroll={onChatScroll}
          scrollEventThrottle={16}
          onContentSizeChange={onChatContentSizeChange}
        />

        {/* Jump to latest — appears when user has scrolled up-thread */}
        {!isAtBottom && messages.length > 0 && (
          <TouchableOpacity
            style={[jumpStyles.btn, { backgroundColor: colors.primary }]}
            onPress={() => scrollToBottom(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-down" size={14} color="#fff" />
            <Text style={jumpStyles.label}>Jump to latest</Text>
          </TouchableOpacity>
        )}

        {/* Compare bar */}
        {compareMode && (
          <View style={[styles.compareBar, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <Ionicons name="scale-outline" size={15} color={compareSelected.length >= 2 ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.compareBarText, { color: compareSelected.length >= 2 ? colors.foreground : colors.mutedForeground }]}>
              {compareSelected.length === 0
                ? "Tap spots below to compare (up to 3)"
                : compareSelected.length === 1
                  ? "1 of 3 selected — pick at least one more"
                  : `${compareSelected.length} of 3 selected`}
            </Text>
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.compareGoBtn, { backgroundColor: compareSelected.length >= 2 ? colors.primary : colors.border }]}
              onPress={() => void handleCompare()}
              disabled={compareSelected.length < 2}
            >
              <Text style={[styles.compareGoBtnText, { color: compareSelected.length >= 2 ? "#fff" : colors.mutedForeground }]}>
                Compare →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Kinfolk Voices™ mode selector */}
        <View style={[styles.voicesBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Text style={[styles.voicesBarLabel, { color: colors.mutedForeground }]}>Kinfolk Voices™</Text>
          <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voicesPills}>
            {KINFOLK_VOICES.map((v) => {
              const isActive = voiceMode === v.id;
              const locked = v.requiresPaid && (!isAuthenticated || !subscription);
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.voicePill,
                    { backgroundColor: isActive ? colors.primary : colors.background, borderColor: isActive ? colors.primary : colors.border },
                    locked && { opacity: 0.55 },
                  ]}
                  onPress={() => {
                    if (locked) { setShowUpgrade(true); return; }
                    setVoiceMode(v.id);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.voicePillIcon}>{v.icon}</Text>
                  <Text style={[styles.voicePillLabel, { color: isActive ? "#fff" : colors.text }]}>{v.label}</Text>
                  {locked && <Ionicons name="lock-closed" size={9} color={isActive ? "#ffffff99" : colors.mutedForeground} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setRememberThis((value) => !value)} style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }} accessibilityRole="checkbox" accessibilityState={{ checked: rememberThis }}>
              <Ionicons name={rememberThis ? "checkbox" : "square-outline"} size={18} color={rememberThis ? colors.primary : colors.mutedForeground} />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.mutedForeground }}>Remember this privately</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/kinfolk-memory" as any)}><Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: colors.primary }}>Manage memory</Text></TouchableOpacity>
          </View>
          {kinfolkImages.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>{kinfolkImages.map((url) => <View key={url} style={{ marginRight: 8 }}><Image source={{ uri: url }} style={{ width: 74, height: 74, borderRadius: 12 }} accessibilityLabel="Ready to ask Kinfolk about" /><TouchableOpacity onPress={() => setKinfolkImages((items) => items.filter((item) => item !== url))} style={{ position: "absolute", top: -4, right: -4, backgroundColor: colors.primary, borderRadius: 12, padding: 3 }}><Ionicons name="close" size={12} color="#FFF" /></TouchableOpacity></View>)}</ScrollView>}
        </View>

        {/* Input row */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[styles.voiceOutputBtn, { backgroundColor: colors.background, borderColor: colors.border, opacity: uploadingKinfolkImage || kinfolkImages.length >= 2 ? 0.4 : 1 }]}
            onPress={() => void pickKinfolkImage()}
            disabled={uploadingKinfolkImage || kinfolkImages.length >= 2 || isLoading}
            accessibilityLabel="Add an image for Kinfolk"
            activeOpacity={0.75}
          >
            {uploadingKinfolkImage ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="image-outline" size={18} color={colors.mutedForeground} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.voiceOutputBtn, { backgroundColor: voiceOutput ? colors.primary : colors.background, borderColor: voiceOutput ? colors.primary : colors.border }]}
            onPress={() => {
              if (voiceOutput) void Speech.stop();
              setVoiceOutput((v) => !v);
            }}
            activeOpacity={0.75}
          >
            <Ionicons name={voiceOutput ? "volume-high" : "volume-mute-outline"} size={18} color={voiceOutput ? "#fff" : colors.mutedForeground} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            placeholder="Or tell me anything…"
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => void handleSend()}
            editable={!isLoading && !uploadingKinfolkImage}
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: inputText.trim() && !isLoading && !uploadingKinfolkImage ? colors.primary : colors.border }]}
            onPress={() => void handleSend()}
            disabled={!inputText.trim() || isLoading || uploadingKinfolkImage}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Taste Profile Sheet */}
      <TasteProfileSheet
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        onRetakeQuiz={() => setShowOnboarding(true)}
        colors={colors}
      />

      {/* Session History Drawer */}
      <SessionHistoryDrawer
        visible={showHistory}
        sessions={sessions}
        onClose={() => setShowHistory(false)}
        onSelect={handleHistorySelect}
        onNew={handleNewSession}
        colors={colors}
      />

      {/* KinfolkAI™ Onboarding */}
      <KinfolkOnboarding
        visible={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* Flight Tracker */}
      <FlightTrackerModal
        visible={showFlights}
        onClose={() => setShowFlights(false)}
        isAuthenticated={isAuthenticated}
        colors={colors}
      />
    </View>
  );
}

// ─── Root Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  headerBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#FFFFFF" },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#ffffff99" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIconBtn: { padding: 6, borderRadius: 20 },
  premiumBanner: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#C9922B18", borderBottomWidth: 1, borderBottomColor: "#C9922B40" },
  premiumBannerText: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#C9922B", flex: 1 },
  personalBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  personalBannerText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  queryCounter: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  queryCounterText: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  aiDownBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  aiDownBannerText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 18 },
  chatContent: { paddingTop: 16, paddingBottom: 8 },
  compareBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1 },
  compareBarText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13 },
  compareGoBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  compareGoBtnText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  voicesBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 14, paddingRight: 8, paddingVertical: 8, borderTopWidth: 1 },
  voicesBarLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase" },
  voicesPills: { flexDirection: "row", gap: 6, paddingVertical: 2 },
  voicePill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  voicePillIcon: { fontSize: 13 },
  voicePillLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  inputWrapper: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, maxHeight: 120, lineHeight: 20 },
  voiceOutputBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 2 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 2 },
});

const jumpStyles = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "center", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 6, marginTop: 2 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
});
