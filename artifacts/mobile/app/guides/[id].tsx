import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function getToken() { try { return Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token"); } catch { return null; } }
async function authHeaders(): Promise<Record<string, string>> { const t = await getToken(); return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }; }

interface Guide {
  id: string; userId: string; title: string; personalStory: string | null;
  subjectName: string; storyType: string; subjectEmoji: string;
  experienceContext: string | null; city: string | null; isPublic: boolean;
  followCount: number; viewCount: number; sectionCount: number; itemCount: number;
  authorFirstName: string | null; authorLastName: string | null;
  authorAvatar: string | null; authorCity: string | null;
}
interface Section { id: string; guideId: string; title: string; sectionEmoji: string; displayOrder: number; }
interface GuideItem {
  id: string; sectionId: string; itemType: string; title: string;
  description: string | null; businessId: string | null;
  externalUrl: string | null; externalLabel: string | null;
}

const ITEM_TYPES = [
  { key: "tip", label: "Wisdom Tip", emoji: "💡" },
  { key: "business", label: "Business", emoji: "🏪" },
  { key: "resource", label: "Resource / Link", emoji: "🔗" },
  { key: "person", label: "Person to Know", emoji: "🤝" },
  { key: "app", label: "App / Tool", emoji: "📱" },
];

const SECTION_EMOJIS = ["📌", "🍽️", "🏠", "💼", "🏥", "🎓", "🤝", "💰", "🧘", "✈️", "🌍", "📚", "🏋️", "🎨", "⚡", "🌱", "💊", "🚀", "🎵", "🏙️"];

function authorName(g: Guide) {
  const first = g.authorFirstName ?? "";
  const last = g.authorLastName ? ` ${g.authorLastName[0]}.` : "";
  return first ? `${first}${last}` : "Community Member";
}

function itemEmoji(type: string) {
  return ITEM_TYPES.find((t) => t.key === type)?.emoji ?? "💡";
}

export default function GuideDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [guide, setGuide] = useState<Guide | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [items, setItems] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Add section modal
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionEmoji, setNewSectionEmoji] = useState("📌");
  const [sectionSaving, setSectionSaving] = useState(false);

  // Add item modal
  const [showAddItem, setShowAddItem] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState("");
  const [newItemType, setNewItemType] = useState("tip");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemLabel, setNewItemLabel] = useState("");
  const [itemSaving, setItemSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/guides/${id}`, { headers: h });
      if (!res.ok) { setLoading(false); return; }
      const d = await res.json() as { guide: Guide; sections: Section[]; items: GuideItem[] };
      setGuide(d.guide);
      setSections(d.sections ?? []);
      setItems(d.items ?? []);

      // Check if user is owner
      const token = await getToken();
      if (token && d.guide.userId) {
        // We don't have a /me endpoint to check, so we compare after loading profile
        setCurrentUserId(d.guide.userId); // simplified — we'll check via session
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { queueMicrotask(() => { load(); }); }, [load]);

  // Check ownership via stored token/user
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token && guide) {
        // Quick ownership check via API
        try {
          const res = await fetch(`${getApiBase()}/api/users/${guide.userId}/guides`, {
            headers: await authHeaders(),
          });
          if (res.ok) {
            const d = await res.json() as { guides: { id: string }[] };
            setIsOwner(d.guides.some((g) => g.id === guide.id));
          }
        } catch { /* silent */ }
      }
    })();
  }, [guide]);

  const toggleFollow = async () => {
    if (!guide) return;
    setFollowLoading(true);
    try {
      const h = await authHeaders();
      const token = await getToken();
      if (!token) { Alert.alert("Sign in to follow guides"); return; }
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`${getApiBase()}/api/guides/${guide.id}/follow`, { method, headers: h });
      if (res.ok) {
        setFollowing(!following);
        setGuide((g) => g ? { ...g, followCount: g.followCount + (following ? -1 : 1) } : g);
      }
    } catch { /* silent */ } finally { setFollowLoading(false); }
  };

  const addSection = async () => {
    if (!newSectionTitle.trim() || !guide) return;
    setSectionSaving(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/guides/${guide.id}/sections`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ title: newSectionTitle.trim(), sectionEmoji: newSectionEmoji, displayOrder: sections.length }),
      });
      if (res.ok) {
        const d = await res.json() as { section: Section };
        setSections((prev) => [...prev, d.section]);
        setGuide((g) => g ? { ...g, sectionCount: g.sectionCount + 1 } : g);
        setShowAddSection(false);
        setNewSectionTitle("");
        setNewSectionEmoji("📌");
      }
    } catch { /* silent */ } finally { setSectionSaving(false); }
  };

  const addItem = async () => {
    if (!newItemTitle.trim() || !guide || !targetSectionId) return;
    setItemSaving(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/guides/${guide.id}/items`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          sectionId: targetSectionId,
          itemType: newItemType,
          title: newItemTitle.trim(),
          description: newItemDesc.trim() || undefined,
          externalUrl: newItemUrl.trim() || undefined,
          externalLabel: newItemLabel.trim() || undefined,
          displayOrder: items.filter((i) => i.sectionId === targetSectionId).length,
        }),
      });
      if (res.ok) {
        const d = await res.json() as { item: GuideItem };
        setItems((prev) => [...prev, d.item]);
        setGuide((g) => g ? { ...g, itemCount: g.itemCount + 1 } : g);
        setShowAddItem(false);
        setNewItemTitle(""); setNewItemDesc(""); setNewItemUrl(""); setNewItemLabel("");
        setNewItemType("tip");
      }
    } catch { /* silent */ } finally { setItemSaving(false); }
  };

  const deleteItem = async (itemId: string) => {
    if (!guide) return;
    Alert.alert("Remove this tip?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            const h = await authHeaders();
            await fetch(`${getApiBase()}/api/guides/${guide.id}/items/${itemId}`, { method: "DELETE", headers: h });
            setItems((prev) => prev.filter((i) => i.id !== itemId));
            setGuide((g) => g ? { ...g, itemCount: Math.max(0, g.itemCount - 1) } : g);
          } catch { /* silent */ }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={s.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      </View>
    );
  }

  if (!guide) {
    return (
      <View style={[s.root, s.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Guide not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: "#CA922B" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{guide.title}</Text>
          <TouchableOpacity
            style={[s.followBtn, { backgroundColor: following ? colors.muted : "#CA922B" }]}
            onPress={toggleFollow}
            disabled={followLoading}
            activeOpacity={0.8}
          >
            {followLoading
              ? <ActivityIndicator size="small" color={following ? colors.foreground : "#fff"} />
              : <Text style={[s.followTxt, { color: following ? colors.foreground : "#fff" }]}>
                  {following ? "Following" : "Follow"}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Hero */}
        <View style={[s.hero, { backgroundColor: "#CA922B" + "15" }]}>
          <Text style={s.heroEmoji}>{guide.subjectEmoji}</Text>
          <Text style={[s.heroTitle, { color: colors.foreground }]}>{guide.title}</Text>
          {guide.experienceContext && (
            <Text style={[s.heroContext, { color: "#CA922B" }]}>{guide.experienceContext}</Text>
          )}
          <View style={s.heroMeta}>
            <Text style={[s.heroMetaTxt, { color: colors.mutedForeground }]}>by {authorName(guide)}</Text>
            {guide.authorCity && <Text style={[s.heroMetaTxt, { color: colors.mutedForeground }]}> · {guide.authorCity}</Text>}
            <Text style={[s.heroMetaTxt, { color: colors.mutedForeground }]}> · {guide.followCount} followers</Text>
          </View>
          <View style={s.heroStats}>
            <View style={[s.statBadge, { backgroundColor: colors.card }]}>
              <Text style={[s.statNum, { color: colors.foreground }]}>{guide.sectionCount}</Text>
              <Text style={[s.statLbl, { color: colors.mutedForeground }]}>sections</Text>
            </View>
            <View style={[s.statBadge, { backgroundColor: colors.card }]}>
              <Text style={[s.statNum, { color: colors.foreground }]}>{guide.itemCount}</Text>
              <Text style={[s.statLbl, { color: colors.mutedForeground }]}>tips</Text>
            </View>
            <View style={[s.statBadge, { backgroundColor: colors.card }]}>
              <Text style={[s.statNum, { color: colors.foreground }]}>{guide.viewCount}</Text>
              <Text style={[s.statLbl, { color: colors.mutedForeground }]}>views</Text>
            </View>
          </View>
        </View>

        {/* Personal story */}
        {guide.personalStory ? (
          <View style={[s.storyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.storyHeader}>
              <Text style={s.storyIcon}>🗣️</Text>
              <Text style={[s.storyLabel, { color: colors.mutedForeground }]}>IN THEIR WORDS</Text>
            </View>
            <Text style={[s.storyText, { color: colors.foreground }]}>{guide.personalStory}</Text>
          </View>
        ) : null}

        {/* Sections + items */}
        <View style={{ paddingHorizontal: 16 }}>
          {sections.map((section) => {
            const sectionItems = items.filter((i) => i.sectionId === section.id);
            return (
              <View key={section.id} style={s.sectionBlock}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionEmoji}>{section.sectionEmoji}</Text>
                  <Text style={[s.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
                  {isOwner && (
                    <TouchableOpacity
                      onPress={() => { setTargetSectionId(section.id); setShowAddItem(true); }}
                      style={[s.addItemBtn, { backgroundColor: "#CA922B" + "20" }]}
                    >
                      <Feather name="plus" size={13} color="#CA922B" />
                      <Text style={s.addItemTxt}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {sectionItems.length === 0 && (
                  <Text style={[s.emptySection, { color: colors.mutedForeground }]}>No tips yet in this section</Text>
                )}

                {sectionItems.map((item) => (
                  <View key={item.id} style={[s.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={s.itemTop}>
                      <Text style={s.itemEmoji}>{itemEmoji(item.itemType)}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
                        {item.description && (
                          <Text style={[s.itemDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                        )}
                        {item.externalUrl && (
                          <TouchableOpacity onPress={() => Linking.openURL(item.externalUrl!)} style={s.linkRow}>
                            <Feather name="external-link" size={11} color="#CA922B" />
                            <Text style={s.linkTxt}>{item.externalLabel || "Open link"}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {isOwner && (
                        <TouchableOpacity onPress={() => deleteItem(item.id)} style={{ padding: 4 }}>
                          <Feather name="trash-2" size={13} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          {/* Add section CTA (owner only) */}
          {isOwner && (
            <TouchableOpacity
              style={[s.addSectionBtn, { borderColor: "#CA922B" }]}
              onPress={() => setShowAddSection(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus-circle" size={16} color="#CA922B" />
              <Text style={[s.addSectionTxt, { color: "#CA922B" }]}>Add a section</Text>
            </TouchableOpacity>
          )}

          {/* Empty state for non-owners */}
          {sections.length === 0 && !isOwner && (
            <View style={s.emptyGuide}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🏗️</Text>
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>Guide in progress</Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                The author is still building this guide. Check back soon.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Add Section Modal ───────────────────────────────────────────────── */}
      <Modal visible={showAddSection} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddSection(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[s.modal, { backgroundColor: colors.background }]}>
            <View style={[s.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={() => setShowAddSection(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Add Section</Text>
              <TouchableOpacity
                onPress={addSection}
                disabled={!newSectionTitle.trim() || sectionSaving}
                style={[s.modalSave, { backgroundColor: newSectionTitle.trim() ? "#CA922B" : colors.muted }]}
              >
                {sectionSaving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.modalSaveTxt}>Add</Text>
                }
              </TouchableOpacity>
            </View>
            <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 20 }}>
              <Text style={[s.label, { color: colors.mutedForeground }]}>Section Emoji</Text>
              <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {SECTION_EMOJIS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={[s.emojiBtn, { backgroundColor: colors.card, borderColor: newSectionEmoji === e ? "#CA922B" : colors.border }]}
                      onPress={() => setNewSectionEmoji(e)}
                    >
                      <Text style={s.emojiTxt}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <Text style={[s.label, { color: colors.mutedForeground }]}>Section Title</Text>
              <TextInput
                style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="e.g. Where to Eat, Apartments, Support Groups"
                placeholderTextColor={colors.mutedForeground}
                value={newSectionTitle}
                onChangeText={setNewSectionTitle}
                maxLength={150}
                autoFocus
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Item Modal ──────────────────────────────────────────────────── */}
      <Modal visible={showAddItem} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddItem(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[s.modal, { backgroundColor: colors.background }]}>
            <View style={[s.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={() => setShowAddItem(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Add a Tip</Text>
              <TouchableOpacity
                onPress={addItem}
                disabled={!newItemTitle.trim() || itemSaving}
                style={[s.modalSave, { backgroundColor: newItemTitle.trim() ? "#CA922B" : colors.muted }]}
              >
                {itemSaving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.modalSaveTxt}>Add</Text>
                }
              </TouchableOpacity>
            </View>
            <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={[s.label, { color: colors.mutedForeground }]}>Type</Text>
              <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {ITEM_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      style={[s.typeChip, { backgroundColor: newItemType === t.key ? "#CA922B" : colors.card, borderColor: newItemType === t.key ? "#CA922B" : colors.border }]}
                      onPress={() => setNewItemType(t.key)}
                    >
                      <Text style={s.typeChipEmoji}>{t.emoji}</Text>
                      <Text style={[s.typeChipTxt, { color: newItemType === t.key ? "#fff" : colors.foreground }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={[s.label, { color: colors.mutedForeground }]}>Title *</Text>
              <TextInput
                style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder={
                  newItemType === "tip" ? "e.g. Always go to office hours in week 1" :
                  newItemType === "business" ? "e.g. Busboys and Poets" :
                  newItemType === "resource" ? "e.g. Howard Housing Portal" :
                  newItemType === "person" ? "e.g. Dr. Rashida Jones — endocrinologist" :
                  "e.g. MyFitnessPal — best for tracking macros"
                }
                placeholderTextColor={colors.mutedForeground}
                value={newItemTitle}
                onChangeText={setNewItemTitle}
                maxLength={200}
                autoFocus
              />

              <Text style={[s.label, { color: colors.mutedForeground }]}>Details (optional)</Text>
              <TextInput
                style={[s.input, s.multiline, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder="Add more context, a story, or why this matters..."
                placeholderTextColor={colors.mutedForeground}
                value={newItemDesc}
                onChangeText={setNewItemDesc}
                maxLength={500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {(newItemType === "resource" || newItemType === "business" || newItemType === "app") && (
                <>
                  <Text style={[s.label, { color: colors.mutedForeground }]}>Link (optional)</Text>
                  <TextInput
                    style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                    placeholder="https://..."
                    placeholderTextColor={colors.mutedForeground}
                    value={newItemUrl}
                    onChangeText={setNewItemUrl}
                    maxLength={500}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                  <Text style={[s.label, { color: colors.mutedForeground }]}>Link Label (optional)</Text>
                  <TextInput
                    style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                    placeholder="e.g. Visit website"
                    placeholderTextColor={colors.mutedForeground}
                    value={newItemLabel}
                    onChangeText={setNewItemLabel}
                    maxLength={100}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "700" },
  followBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, minWidth: 80, alignItems: "center" },
  followTxt: { fontSize: 13, fontWeight: "700" },
  hero: { padding: 24, paddingBottom: 20, alignItems: "center" },
  heroEmoji: { fontSize: 52, marginBottom: 10 },
  heroTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", lineHeight: 28, marginBottom: 6 },
  heroContext: { fontSize: 13, fontWeight: "600", marginBottom: 10 },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 16 },
  heroMetaTxt: { fontSize: 12 },
  heroStats: { flexDirection: "row", gap: 10 },
  statBadge: { alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLbl: { fontSize: 11, marginTop: 2 },
  storyCard: { margin: 16, marginTop: 0, padding: 18, borderRadius: 18, borderWidth: 1 },
  storyHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  storyIcon: { fontSize: 18 },
  storyLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  storyText: { fontSize: 14, lineHeight: 22, fontStyle: "italic" },
  sectionBlock: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionEmoji: { fontSize: 22 },
  sectionTitle: { flex: 1, fontSize: 17, fontWeight: "700" },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  addItemTxt: { color: "#CA922B", fontSize: 12, fontWeight: "700" },
  emptySection: { fontSize: 13, fontStyle: "italic", paddingLeft: 32, marginBottom: 8 },
  itemCard: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  itemTop: { flexDirection: "row", gap: 10, flex: 1 },
  itemEmoji: { fontSize: 20, marginTop: 1 },
  itemTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20, marginBottom: 4 },
  itemDesc: { fontSize: 12, lineHeight: 18 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  linkTxt: { color: "#CA922B", fontSize: 12, fontWeight: "600" },
  addSectionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", marginVertical: 8 },
  addSectionTxt: { fontSize: 14, fontWeight: "700" },
  emptyGuide: { alignItems: "center", paddingVertical: 50 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalSave: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 18 },
  modalSaveTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" },
  emojiBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  emojiTxt: { fontSize: 22 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14 },
  multiline: { minHeight: 80 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5 },
  typeChipEmoji: { fontSize: 15 },
  typeChipTxt: { fontSize: 13, fontWeight: "600" },
});
