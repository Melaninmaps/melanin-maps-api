import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}
async function getToken() {
  try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

interface CityArchive {
  id: string;
  city: string;
  state: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  heroImageUrl: string | null;
  tourVisitedAt: string | null;
  status: string;
  contributionCount: number;
  nominationCount: number;
}

interface Contribution {
  id: string;
  archiveId: string;
  userId: string | null;
  contributorName: string | null;
  type: string;
  title: string | null;
  content: string;
  mediaUrl: string | null;
  businessId: string | null;
  neighborhood: string | null;
  isFeatured: boolean;
  upvotes: number;
  createdAt: string;
}

const SECTION_META: Record<string, { emoji: string; label: string; placeholder: string; showTitle: boolean }> = {
  interview: { emoji: "🎥", label: "Voices from the City", placeholder: "Share what life here means to you — your story, in your words.", showTitle: true },
  place: { emoji: "📍", label: "Favorite Local Places", placeholder: "Name a place that means something to you and why.", showTitle: true },
  founding_business: { emoji: "🏪", label: "Founding Businesses", placeholder: "Name a business that's been part of this community's foundation.", showTitle: true },
  food_rec: { emoji: "🍽️", label: "Community Food Recommendations", placeholder: "A restaurant, food truck, or home cook that represents the city.", showTitle: true },
  tradition: { emoji: "🎭", label: "Traditions & Annual Events", placeholder: "A tradition, festival, or annual event that defines this place.", showTitle: true },
  local_tip: { emoji: "🧭", label: "Know Before You Go", placeholder: "What do you wish every visitor knew before arriving?", showTitle: false },
  home_sentence: { emoji: "💬", label: "What Makes This Home", placeholder: "In one sentence: what makes this place feel like home?", showTitle: false },
};

const TYPE_ORDER = ["home_sentence", "interview", "place", "founding_business", "food_rec", "tradition", "local_tip"];

function ContributeModal({
  visible, onClose, citySlug, onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  citySlug: string;
  onSuccess: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState("home_sentence");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => { setType("home_sentence"); setTitle(""); setContent(""); setContributorName(""); setDone(false); };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/archive/cities/${citySlug}/contribute`, {
        method: "POST",
        headers,
        body: JSON.stringify({ type, title: title.trim() || undefined, content: content.trim(), contributorName: contributorName.trim() || undefined }),
      });
      const d = await res.json() as { message?: string; error?: string };
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDone(true);
      } else {
        Alert.alert("Error", d.error ?? "Failed to submit. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => { reset(); onClose(); if (done) onSuccess(); };

  const meta = SECTION_META[type] ?? SECTION_META.home_sentence;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Share Your Story</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalClose} activeOpacity={0.7}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {done ? (
            <View style={styles.doneView}>
              <Text style={{ fontSize: 60 }}>🤎</Text>
              <Text style={[styles.doneTitle, { color: colors.foreground }]}>Thank you!</Text>
              <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
                Your contribution is under review. Once approved, it becomes a permanent part of this city's archive — your words, in your community's story.
              </Text>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleClose} activeOpacity={0.85}>
                <Text style={[styles.doneBtnTxt, { color: colors.primaryForeground }]}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>What are you contributing?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {TYPE_ORDER.map((t) => {
                  const m = SECTION_META[t];
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => { setType(t); setTitle(""); setContent(""); }}
                      style={[styles.typeChip, { borderColor: type === t ? colors.primary : colors.border, backgroundColor: type === t ? colors.primary + "15" : colors.card }]}
                      activeOpacity={0.75}
                    >
                      <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
                      <Text style={[styles.typeChipText, { color: type === t ? colors.primary : colors.mutedForeground }]}>{m.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {meta.showTitle && (
                <>
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>{meta.emoji} Name / Title</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                    placeholder="e.g. Sweet Auburn Bread Co."
                    placeholderTextColor={colors.mutedForeground}
                    value={title}
                    onChangeText={setTitle}
                  />
                </>
              )}

              <Text style={[styles.modalLabel, { color: colors.foreground }]}>Your message <Text style={{ color: "#DC2626" }}>*</Text></Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder={meta.placeholder}
                placeholderTextColor={colors.mutedForeground}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={[styles.modalLabel, { color: colors.foreground }]}>Your name (optional)</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="e.g. Keisha from the West Side"
                placeholderTextColor={colors.mutedForeground}
                value={contributorName}
                onChangeText={setContributorName}
              />

              <View style={[styles.privacyNote, { backgroundColor: "#CA922B08", borderColor: "#CA922B25" }]}>
                <Text style={[styles.privacyNoteText, { color: "#92400E" }]}>
                  🌍 Your contribution becomes a permanent, community-built record of this city's story — reviewed and preserved in the Welcome Home Archive.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: content.trim() ? colors.primary : colors.muted, opacity: submitting ? 0.6 : 1 }]}
                onPress={() => void handleSubmit()}
                disabled={!content.trim() || submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.submitBtnTxt, { color: content.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                    Add to the Archive
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ContributionCard({ item, onUpvote }: { item: Contribution; onUpvote: (id: string) => void }) {
  const colors = useColors();
  const [upvoted, setUpvoted] = useState(false);

  const handleUpvote = () => {
    if (upvoted) return;
    setUpvoted(true);
    onUpvote(item.id);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.contributionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {item.isFeatured && (
        <View style={[styles.featuredBadge, { backgroundColor: "#CA922B20" }]}>
          <Text style={{ fontSize: 10 }}>⭐</Text>
          <Text style={[styles.featuredBadgeText, { color: "#92400E" }]}>Featured</Text>
        </View>
      )}
      {item.title && (
        <Text style={[styles.contributionTitle, { color: colors.foreground }]}>{item.title}</Text>
      )}
      <Text style={[styles.contributionContent, { color: item.title ? colors.mutedForeground : colors.foreground }]}>{item.content}</Text>
      <View style={styles.contributionFooter}>
        <Text style={[styles.contributorName, { color: colors.mutedForeground }]}>
          — {item.contributorName ?? "Community Member"}
          {item.neighborhood ? `, ${item.neighborhood}` : ""}
        </Text>
        <TouchableOpacity onPress={handleUpvote} style={styles.upvoteBtn} activeOpacity={0.75}>
          <Text style={{ fontSize: 13 }}>{upvoted ? "❤️" : "🤍"}</Text>
          <Text style={[styles.upvoteCount, { color: colors.mutedForeground }]}>{item.upvotes + (upvoted ? 1 : 0)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CityArchiveScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [city, setCity] = useState<CityArchive | null>(null);
  const [contributions, setContributions] = useState<Record<string, Contribution[]>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showContribute, setShowContribute] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["home_sentence", "interview"]));

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/archive/cities/${slug}`);
      if (res.ok) {
        const d = await res.json() as { city: CityArchive; contributions: Record<string, Contribution[]>; total: number };
        setCity(d.city);
        setContributions(d.contributions);
        setTotal(d.total);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  const handleUpvote = async (contributionId: string) => {
    if (!slug) return;
    try {
      await fetch(`${getApiBase()}/api/archive/cities/${slug}/contributions/${contributionId}/upvote`, { method: "POST" });
    } catch { /* silent */ }
  };

  const toggleSection = (type: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingView, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!city) {
    return (
      <View style={[styles.loadingView, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>City archive not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColors: Record<string, string> = { active: "#16A34A", upcoming: "#CA922B", archived: "#6B7280" };
  const statusLabels: Record<string, string> = { active: "Tour Stop", upcoming: "Coming Soon", archived: "Past Tour Stop" };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.hero, { backgroundColor: "#1C0E06", paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.75}>
            <Feather name="arrow-left" size={20} color="#F5EBD8" />
          </TouchableOpacity>

          <View style={styles.heroBadgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: (statusColors[city.status] ?? "#6B7280") + "25" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColors[city.status] ?? "#6B7280" }]} />
              <Text style={[styles.statusText, { color: statusColors[city.status] ?? "#6B7280" }]}>
                {statusLabels[city.status] ?? city.status}
              </Text>
            </View>
          </View>

          <Text style={styles.heroCity}>{city.city}</Text>
          <Text style={styles.heroState}>{city.state}</Text>
          {city.tagline && (
            <Text style={styles.heroTagline}>{city.tagline}</Text>
          )}

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{city.contributionCount}</Text>
              <Text style={styles.heroStatLabel}>Stories</Text>
            </View>
            <View style={[styles.heroStatDivider]} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{city.nominationCount}</Text>
              <Text style={styles.heroStatLabel}>Nominations</Text>
            </View>
          </View>

          {city.description && (
            <Text style={styles.heroDesc}>{city.description}</Text>
          )}

          <TouchableOpacity
            style={styles.contributeHeroBtn}
            onPress={() => setShowContribute(true)}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 15 }}>🤎</Text>
            <Text style={styles.contributeHeroBtnTxt}>Add Your Story to the Archive</Text>
            <Feather name="arrow-right" size={15} color="#1C0E06" />
          </TouchableOpacity>
        </View>

        {/* Community Pitch */}
        <View style={[styles.pitchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.pitchTitle, { color: colors.foreground }]}>A Community-Built Legacy</Text>
          <Text style={[styles.pitchText, { color: colors.mutedForeground }]}>
            The Welcome Home Archive isn't a travel guide — it's a permanent, living record of Black life in this city. Every interview, recommendation, and memory contributed here belongs to the community, forever.
          </Text>
        </View>

        {/* Sections */}
        {total === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Text style={{ fontSize: 40, textAlign: "center" }}>🌱</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>This archive is just getting started</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Be the first to share your story. Every community archive begins with one voice.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowContribute(true)}
              activeOpacity={0.85}
            >
              <Text style={[styles.emptyBtnTxt, { color: colors.primaryForeground }]}>Start the Archive</Text>
            </TouchableOpacity>
          </View>
        ) : (
          TYPE_ORDER.map((type) => {
            const items = contributions[type];
            if (!items?.length) return null;
            const meta = SECTION_META[type];
            const expanded = expandedSections.has(type);

            return (
              <View key={type} style={[styles.section, { borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
                  onPress={() => toggleSection(type)}
                  activeOpacity={0.8}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                    <View>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{meta.label}</Text>
                      <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{items.length} contribution{items.length !== 1 ? "s" : ""}</Text>
                    </View>
                  </View>
                  <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.sectionBody}>
                    {items.map((item) => (
                      <ContributionCard key={item.id} item={item} onUpvote={(id) => void handleUpvote(id)} />
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Bottom CTA */}
        {total > 0 && (
          <View style={[styles.bottomCta, { backgroundColor: "#1C0E06" }]}>
            <Text style={styles.bottomCtaTitle}>Your story belongs here too</Text>
            <Text style={styles.bottomCtaSub}>
              This archive grows with every voice. Add yours.
            </Text>
            <TouchableOpacity
              style={[styles.contributeHeroBtn, { marginTop: 16 }]}
              onPress={() => setShowContribute(true)}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 15 }}>🤎</Text>
              <Text style={styles.contributeHeroBtnTxt}>Contribute to the Archive</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ContributeModal
        visible={showContribute}
        onClose={() => setShowContribute(false)}
        citySlug={slug ?? ""}
        onSuccess={() => void load()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingView: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Hero
  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: { marginBottom: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  heroBadgeRow: { flexDirection: "row", marginBottom: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 },
  heroCity: { fontFamily: "Inter_700Bold", fontSize: 38, color: "#F5EBD8", lineHeight: 44 },
  heroState: { fontFamily: "Inter_400Regular", fontSize: 16, color: "#F5EBD880", marginBottom: 8 },
  heroTagline: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#CA922B", fontStyle: "italic", marginBottom: 16, lineHeight: 22 },
  heroStats: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 16 },
  heroStat: { alignItems: "center" },
  heroStatNum: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#CA922B" },
  heroStatLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#F5EBD870" },
  heroStatDivider: { width: 1, height: 32, backgroundColor: "#F5EBD820" },
  heroDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#F5EBD880", lineHeight: 21, marginBottom: 20 },
  contributeHeroBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#CA922B", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, alignSelf: "flex-start" },
  contributeHeroBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#1C0E06" },

  // Pitch card
  pitchCard: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 18 },
  pitchTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 6 },
  pitchText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },

  // Sections
  section: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 0 },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  sectionCount: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  sectionBody: { padding: 12, gap: 10 },

  // Contribution cards
  contributionCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  featuredBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: "flex-start" },
  featuredBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  contributionTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  contributionContent: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  contributionFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  contributorName: { fontFamily: "Inter_500Medium", fontSize: 12, fontStyle: "italic", flex: 1 },
  upvoteBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  upvoteCount: { fontFamily: "Inter_600SemiBold", fontSize: 12 },

  // Empty state
  emptyState: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 12 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17, textAlign: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, textAlign: "center" },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, marginTop: 4 },
  emptyBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 14 },

  // Bottom CTA
  bottomCta: { margin: 16, borderRadius: 20, padding: 24, alignItems: "center" },
  bottomCtaTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#F5EBD8", textAlign: "center", marginBottom: 6 },
  bottomCtaSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#F5EBD870", textAlign: "center", lineHeight: 21 },

  // Contribute modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  modalClose: { padding: 4 },
  modalBody: { padding: 20, gap: 4 },
  modalLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 6, marginTop: 8 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 4 },
  modalTextarea: { minHeight: 110, paddingTop: 12 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  typeChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  privacyNote: { borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 4 },
  privacyNoteText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },
  submitBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  submitBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 15 },

  // Done state
  doneView: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  doneTitle: { fontFamily: "Inter_700Bold", fontSize: 24, textAlign: "center" },
  doneSub: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23, textAlign: "center" },
  doneBtn: { borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  doneBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 15 },
});
