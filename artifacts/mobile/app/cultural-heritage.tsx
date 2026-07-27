import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function trackExternalClick(params: {
  institutionName: string;
  institutionType: string;
  institutionUrl: string;
  referenceType: string;
  referenceId?: string;
  source: string;
  city?: string;
  state?: string;
}) {
  fetch(`${getApiBase()}/api/external-clicks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, isSafetyRelated: false }),
  }).catch(() => {});
}

function heritageInstitutionType(heritageCategory: string | null | undefined): string {
  if (heritageCategory === "HBCU") return "university";
  if (heritageCategory === "Cultural Neighborhood") return "cultural_org";
  if (heritageCategory === "Religious Heritage") return "cultural_org";
  if (
    heritageCategory === "African American Heritage" ||
    heritageCategory === "Civil Rights" ||
    heritageCategory === "Native American Heritage" ||
    heritageCategory === "Hispanic & Latino Heritage" ||
    heritageCategory === "LGBTQ+ History" ||
    heritageCategory === "Women's History" ||
    heritageCategory === "Immigrant Heritage" ||
    heritageCategory === "Freedom Trail"
  ) return "heritage_site";
  return "museum";
}

type CulturalSite = {
  id: string;
  name: string;
  description: string;
  category: string;
  heritageCategory: string | null;
  subcategory: string | null;
  ethnicCommunity: string | null;
  city: string;
  state: string;
  address: string | null;
  latitude: string;
  longitude: string;
  era: string | null;
  significance: string | null;
  externalUrl: string | null;
  yearEstablished: number | null;
  isAccessible: boolean;
  isFamilyFriendly: boolean;
  admissionFree: boolean;
  audioGuide: boolean;
  verifiedSource: string | null;
  isVerified: boolean;
};

type HeritageCategoryMeta = {
  label: string;
  value: string;
  color: string;
  icon: React.ComponentProps<typeof Feather>["name"];
};

const HERITAGE_CATEGORIES: HeritageCategoryMeta[] = [
  { label: "All Sites", value: "", color: "#6B7280", icon: "globe" },
  { label: "HBCUs", value: "HBCU", color: "#1D4ED8", icon: "book" },
  { label: "African American", value: "African American Heritage", color: "#CA922B", icon: "star" },
  { label: "Civil Rights", value: "Civil Rights", color: "#DC2626", icon: "shield" },
  { label: "Native American", value: "Native American Heritage", color: "#92400E", icon: "triangle" },
  { label: "Hispanic & Latino", value: "Hispanic & Latino Heritage", color: "#065F46", icon: "sun" },
  { label: "LGBTQ+ History", value: "LGBTQ+ History", color: "#7C3AED", icon: "heart" },
  { label: "Women's History", value: "Women's History", color: "#DB2777", icon: "users" },
  { label: "Immigrant Heritage", value: "Immigrant Heritage", color: "#0891B2", icon: "anchor" },
  { label: "Cultural Districts", value: "Cultural Neighborhood", color: "#059669", icon: "map-pin" },
  { label: "Religious Heritage", value: "Religious Heritage", color: "#6B21A8", icon: "home" },
  { label: "Freedom Trails", value: "Freedom Trail", color: "#B45309", icon: "navigation" },
];

function getHeritageMeta(value: string | null | undefined): HeritageCategoryMeta {
  return (
    HERITAGE_CATEGORIES.find((c) => c.value === value) ?? {
      label: value ?? "Heritage",
      value: value ?? "",
      color: "#6B7280",
      icon: "globe",
    }
  );
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CulturalHeritagePage() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ initialCategory?: string; siteId?: string }>();

  const [sites, setSites] = useState<CulturalSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [selectedHeritage, setSelectedHeritage] = useState(params.initialCategory ?? "");
  const [selectedSite, setSelectedSite] = useState<CulturalSite | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const autoOpenedRef = useRef(false);

  const debouncedSearch = useDebounce(searchInput, 350);

  const fetchSites = useCallback(async (heritage: string, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (heritage) params.set("heritageCategory", heritage);
      if (search) params.set("search", search);
      const resp = await fetch(`${getApiBase()}/api/cultural-sites?${params.toString()}`);
      if (!resp.ok) throw new Error("Failed");
      const data = (await resp.json()) as {
        sites: CulturalSite[];
        categories?: Array<{ label: string; count: number }>;
      };
      setSites(data.sites ?? []);
      if (data.categories) {
        const map: Record<string, number> = {};
        for (const c of data.categories) map[c.label] = c.count;
        setCategoryCounts(map);
      }
    } catch {
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSites(selectedHeritage, debouncedSearch);
  }, [selectedHeritage, debouncedSearch, fetchSites]);

  useEffect(() => {
    if (!loading && params.siteId && sites.length > 0 && !autoOpenedRef.current) {
      const target = sites.find((s) => s.id === params.siteId);
      if (target) {
        autoOpenedRef.current = true;
        setSelectedSite(target);
        setModalVisible(true);
      }
    }
  }, [loading, params.siteId, sites]);

  const openDetail = (site: CulturalSite) => {
    setSelectedSite(site);
    setModalVisible(true);
  };

  const renderFilterChip = ({ item }: { item: HeritageCategoryMeta }) => {
    const active = item.value === selectedHeritage;
    const count = item.value ? (categoryCounts[item.value] ?? 0) : Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    return (
      <TouchableOpacity
        onPress={() => setSelectedHeritage(item.value)}
        style={[
          styles.chip,
          {
            backgroundColor: active ? item.color : colors.card,
            borderColor: active ? item.color : colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <Feather name={item.icon} size={13} color={active ? "#fff" : item.color} />
        <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>
          {item.label}
        </Text>
        {count > 0 && (
          <View style={[styles.chipBadge, { backgroundColor: active ? "rgba(255,255,255,0.3)" : item.color + "22" }]}>
            <Text style={[styles.chipBadgeText, { color: active ? "#fff" : item.color }]}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSiteCard = ({ item }: { item: CulturalSite }) => {
    const meta = getHeritageMeta(item.heritageCategory);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => openDetail(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.heritagePill, { backgroundColor: meta.color + "18", borderColor: meta.color + "44" }]}>
            <Feather name={meta.icon} size={11} color={meta.color} />
            <Text style={[styles.heritagePillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {item.admissionFree && (
            <View style={[styles.freePill, { backgroundColor: "#16A34A18", borderColor: "#16A34A44" }]}>
              <Text style={styles.freePillText}>Free</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.cardMeta}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>
            {item.city}, {item.state}
          </Text>
          {item.era ? (
            <>
              <Text style={[styles.cardMetaDot, { color: colors.mutedForeground }]}>·</Text>
              <Feather name="calendar" size={12} color={colors.mutedForeground} />
              <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>{item.era}</Text>
            </>
          ) : null}
        </View>

        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          {item.externalUrl && (
            <TouchableOpacity
              style={[styles.websiteBtn, { borderColor: colors.border }]}
              onPress={(e) => {
                e.stopPropagation?.();
                trackExternalClick({
                  institutionName: item.name,
                  institutionType: heritageInstitutionType(item.heritageCategory),
                  institutionUrl: item.externalUrl!,
                  referenceType: "cultural_heritage_visit",
                  referenceId: item.id,
                  source: "cultural_heritage",
                  city: item.city,
                  state: item.state,
                });
                void Linking.openURL(item.externalUrl!);
              }}
            >
              <Feather name="external-link" size={12} color={colors.mutedForeground} />
              <Text style={[styles.websiteBtnText, { color: colors.mutedForeground }]}>Visit Site</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.moreBtn} onPress={() => openDetail(item)}>
            <Text style={[styles.moreBtnText, { color: meta.color }]}>Learn More</Text>
            <Feather name="chevron-right" size={13} color={meta.color} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const styles_header = useMemo(() => ({
    paddingTop: insets.top + 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  }), [insets.top, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles_header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Cultural Heritage Explorer
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {loading ? "Loading…" : `${sites.length} sites across America`}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search sites, cities, or history…"
            placeholderTextColor={colors.mutedForeground}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchInput.length > 0 && Platform.OS !== "ios" && (
            <TouchableOpacity onPress={() => setSearchInput("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Heritage category filter */}
      <View style={styles.filterWrap}>
        <FlatList
          data={HERITAGE_CATEGORIES}
          renderItem={renderFilterChip}
          keyExtractor={(it) => it.value}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading heritage sites…
          </Text>
        </View>
      ) : sites.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Feather name="map" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No sites found</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Try adjusting your search or filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={sites}
          renderItem={renderSiteCard}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <DetailModal
          site={selectedSite}
          onClose={() => setModalVisible(false)}
          colors={colors}
        />
      </Modal>
    </View>
  );
}

// ── Types & helpers ────────────────────────────────────────────────────────────

type Colors = ReturnType<typeof useColors>;

type LivingStory = {
  id: string;
  authorName: string | null;
  relationshipType: string;
  content: string;
  tags: string[];
  isAmbassador: boolean;
  createdAt: string;
};

type SupportLink = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
};

function getRelationshipTypes(heritageCategory: string | null): string[] {
  if (heritageCategory === "HBCU") {
    return ["Alum", "Current Student", "Faculty / Staff", "Parent / Family", "Prospective Student", "Community Neighbor", "Supporter", "Visitor"];
  }
  if (heritageCategory === "Native American Heritage") {
    return ["Tribal Member", "Descendant", "Community Elder", "Cultural Educator", "Researcher", "Ally / Supporter", "Visitor"];
  }
  if (heritageCategory === "Religious Heritage") {
    return ["Congregation Member", "Regular Worshipper", "Community Member", "Descendant", "Cultural Researcher", "Visitor"];
  }
  if (heritageCategory === "Civil Rights") {
    return ["Witness / Participant", "Descendant", "Community Member", "Educator", "Activist / Organizer", "Researcher", "Visitor"];
  }
  if (heritageCategory === "LGBTQ+ History") {
    return ["Community Member", "Survivor / Witness", "Advocate", "Family / Ally", "Cultural Researcher", "Visitor"];
  }
  return ["Community Member", "Local Resident", "Frequent Visitor", "Cultural Advocate", "Family Connection", "Researcher", "Visitor"];
}

type TagGroup = { group: string; tags: string[] };

function getStoryTags(heritageCategory: string | null): TagGroup[] {
  if (heritageCategory === "HBCU") {
    return [
      { group: "Campus Life", tags: ["Dorm Life", "Homecoming", "Greek Life", "Student Orgs", "Traditions", "First-Gen"] },
      { group: "Arts & Culture", tags: ["Marching Band", "Choir", "Dance", "Theater", "Step Culture", "Fashion"] },
      { group: "Academics", tags: ["Mentorship", "Research", "Career Prep", "Alumni Network", "Entrepreneurship"] },
      { group: "Athletics", tags: ["Football", "Basketball", "Track", "Cheer", "Rivalries"] },
      { group: "Legacy", tags: ["Civil Rights", "Historic Buildings", "Founders", "Family Legacy", "Community Impact"] },
      { group: "Personal", tags: ["Why I Chose This School", "First Day", "Life-Changing Moment", "Advice for Students"] },
    ];
  }
  if (heritageCategory === "Civil Rights") {
    return [
      { group: "Historical", tags: ["March or Protest", "Key Figures", "Legal Victory", "Voter Rights", "Economic Justice"] },
      { group: "Community", tags: ["Personal Witness", "Family Story", "Local History", "Ongoing Impact"] },
      { group: "Personal", tags: ["Why This Matters", "First Visit", "What Calls Me Back", "Message to Next Generation"] },
    ];
  }
  if (heritageCategory === "Native American Heritage") {
    return [
      { group: "Cultural", tags: ["Language", "Ceremony", "Traditions", "Art", "Storytelling", "Land Connection"] },
      { group: "Community", tags: ["Tribal History", "Sovereignty", "Elders", "Youth", "Resilience"] },
      { group: "Personal", tags: ["Family Roots", "First Visit", "What I Carry", "Message to Next Generation"] },
    ];
  }
  return [
    { group: "Cultural", tags: ["History", "Tradition", "Community", "Art & Music", "Food & Celebration"] },
    { group: "Personal", tags: ["First Visit", "Family Connection", "Life-Changing Moment", "Why This Matters", "What Calls Me Back"] },
    { group: "Legacy", tags: ["Preservation", "Next Generation", "Community Impact", "Hidden Story"] },
  ];
}

function getRespectGuidance(heritageCategory: string | null): string[] {
  const base = [
    "Support local Black-owned businesses nearby rather than national chains.",
    "Engage with curiosity, humility, and genuine respect.",
  ];
  if (heritageCategory === "HBCU") {
    return [
      "This is an active academic campus — respect students, faculty, and staff.",
      "Check in at campus security and follow all visitor policies.",
      "Do not photograph students or staff without their permission.",
      ...base,
    ];
  }
  if (heritageCategory === "Native American Heritage") {
    return [
      "Some areas may be restricted or sacred — always follow posted guidelines.",
      "Do not geotag or share precise locations of protected sacred sites.",
      "Photography of ceremonies, sacred objects, or tribal members may be prohibited.",
      "Purchase directly from tribal vendors to support the community.",
      ...base,
    ];
  }
  if (heritageCategory === "Religious Heritage") {
    return [
      "This may be an active worship space — maintain respectful silence during services.",
      "Ask before photographing congregants, clergy, or sacred objects.",
      "Observe any dress codes or entry requirements at the entrance.",
      ...base,
    ];
  }
  if (heritageCategory === "Civil Rights") {
    return [
      "These are sites of real trauma, sacrifice, and triumph — approach with reverence.",
      "Read the history before you visit, not just the plaque.",
      "Amplify the voices of those who made history here, not just your own presence.",
      ...base,
    ];
  }
  if (heritageCategory === "LGBTQ+ History") {
    return [
      "These spaces hold deep pain and profound resilience — engage accordingly.",
      "Be mindful of the ongoing vulnerability of LGBTQ+ community members.",
      "Center the community whose history lives here — not your own reaction to it.",
      ...base,
    ];
  }
  if (heritageCategory === "Freedom Trail") {
    return [
      "These are memorial spaces — treat them as sacred ground.",
      "Silence phones and speak quietly near memorial markers.",
      "Read all posted historical information before photographing.",
      ...base,
    ];
  }
  return [
    "Approach each place as a guest, not a tourist.",
    "Learn the history before you post about it.",
    ...base,
  ];
}

function getSupportCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    scholarship: "Scholarship",
    alumni_fund: "Alumni Fund",
    preservation: "Preservation",
    museum: "Museum",
    volunteer: "Volunteer",
    nonprofit: "Nonprofit",
    business: "Business",
    giving: "Giving",
  };
  return map[category] ?? "Support";
}

function getSupportCategoryColor(category: string): string {
  const map: Record<string, string> = {
    scholarship: "#CA922B",
    alumni_fund: "#1D4ED8",
    preservation: "#059669",
    museum: "#7C3AED",
    volunteer: "#DC2626",
    nonprofit: "#0891B2",
    business: "#065F46",
    giving: "#CA922B",
  };
  return map[category] ?? "#6B7280";
}

// ── Detail Modal (Living Heritage Place) ──────────────────────────────────────

function DetailModal({
  site,
  onClose,
  colors,
}: {
  site: CulturalSite | null;
  onClose: () => void;
  colors: Colors;
}) {
  const insets = useSafeAreaInsets();
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [stories, setStories] = useState<LivingStory[]>([]);
  const [supportLinks, setSupportLinks] = useState<SupportLink[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [showSubmitStory, setShowSubmitStory] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!site) return;
    setLoadingStories(true);
    setLoadingLinks(true);
    setSubmitSuccess(false);

    fetch(`${getApiBase()}/api/cultural-sites/${site.id}/stories`)
      .then((r) => r.json())
      .then((d: { stories?: LivingStory[] }) => setStories(d.stories ?? []))
      .catch(() => setStories([]))
      .finally(() => setLoadingStories(false));

    fetch(`${getApiBase()}/api/cultural-sites/${site.id}/support-links`)
      .then((r) => r.json())
      .then((d: { links?: SupportLink[] }) => setSupportLinks(d.links ?? []))
      .catch(() => setSupportLinks([]))
      .finally(() => setLoadingLinks(false));
  }, [site]);

  if (!site) return null;
  const meta = getHeritageMeta(site.heritageCategory);
  const relationshipTypes = getRelationshipTypes(site.heritageCategory);
  const storyTagGroups = getStoryTags(site.heritageCategory);
  const respectGuidance = getRespectGuidance(site.heritageCategory);

  return (
    <View style={[dStyles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
      {/* Handle + close */}
      <View style={[dStyles.handleRow, { borderBottomColor: colors.border }]}>
        <View style={[dStyles.handle, { backgroundColor: colors.border }]} />
        <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}>
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dStyles.scroll}>

        {/* Living Heritage Place designation */}
        <View style={[dStyles.lhpBanner, { backgroundColor: "#CA922B12", borderColor: "#CA922B44" }]}>
          <View style={dStyles.lhpBannerInner}>
            <View style={[dStyles.lhpDot, { backgroundColor: "#CA922B" }]} />
            <Text style={dStyles.lhpBannerTitle}>Living Heritage Place</Text>
          </View>
          <Text style={[dStyles.lhpBannerSub, { color: colors.mutedForeground }]}>
            A culturally significant location whose story continues through the people connected to it.
          </Text>
        </View>

        {/* Badges */}
        <View style={dStyles.badgeRow}>
          <View style={[dStyles.heritageBadge, { backgroundColor: meta.color + "18", borderColor: meta.color + "44" }]}>
            <Feather name={meta.icon} size={13} color={meta.color} />
            <Text style={[dStyles.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <View style={[dStyles.catBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[dStyles.catBadgeText, { color: colors.mutedForeground }]}>{site.category}</Text>
          </View>
          {site.isVerified && (
            <View style={[dStyles.verifiedBadge, { backgroundColor: "#16A34A18", borderColor: "#16A34A44" }]}>
              <Feather name="check-circle" size={11} color="#16A34A" />
              <Text style={[dStyles.badgeText, { color: "#16A34A" }]}>Verified</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={[dStyles.name, { color: colors.foreground }]}>{site.name}</Text>

        {/* Location + era */}
        <View style={dStyles.metaRow}>
          <Feather name="map-pin" size={14} color={colors.mutedForeground} />
          <Text style={[dStyles.metaText, { color: colors.mutedForeground }]}>{site.city}, {site.state}</Text>
          {site.era && (
            <>
              <Text style={[dStyles.dot, { color: colors.mutedForeground }]}>·</Text>
              <Feather name="calendar" size={14} color={colors.mutedForeground} />
              <Text style={[dStyles.metaText, { color: colors.mutedForeground }]}>{site.era}</Text>
            </>
          )}
        </View>
        {site.yearEstablished ? (
          <Text style={[dStyles.yearText, { color: colors.mutedForeground }]}>Est. {site.yearEstablished}</Text>
        ) : null}

        {/* Address */}
        {site.address ? (
          <View style={[dStyles.addressRow, { borderColor: colors.border }]}>
            <Feather name="navigation" size={14} color={meta.color} />
            <Text style={[dStyles.addressText, { color: colors.mutedForeground }]}>{site.address}</Text>
          </View>
        ) : null}

        {/* About */}
        <View style={[dStyles.section, { borderTopColor: colors.border }]}>
          <Text style={[dStyles.sectionLabel, { color: colors.mutedForeground }]}>About</Text>
          <Text style={[dStyles.bodyText, { color: colors.foreground }]}>{site.description}</Text>
        </View>

        {/* Historical significance */}
        {site.significance ? (
          <View style={[dStyles.sigBox, { backgroundColor: meta.color + "10", borderColor: meta.color + "30" }]}>
            <Text style={[dStyles.sigLabel, { color: meta.color }]}>Historical Significance</Text>
            <Text style={[dStyles.sigText, { color: colors.foreground }]}>{site.significance}</Text>
          </View>
        ) : null}

        {/* ── Connected to this place? ── */}
        <View style={[dStyles.section, { borderTopColor: colors.border }]}>
          <Text style={[dStyles.sectionLabel, { color: colors.mutedForeground }]}>Connected to this place?</Text>
          <Text style={[dStyles.sectionSub, { color: colors.mutedForeground }]}>
            Tell us your relationship — it makes Living Stories more meaningful.
          </Text>
          <View style={dStyles.relationshipRow}>
            {relationshipTypes.map((rt) => {
              const active = selectedRelationship === rt;
              return (
                <TouchableOpacity
                  key={rt}
                  onPress={() => setSelectedRelationship(active ? "" : rt)}
                  style={[
                    dStyles.relChip,
                    {
                      backgroundColor: active ? meta.color : colors.card,
                      borderColor: active ? meta.color : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[dStyles.relChipText, { color: active ? "#fff" : colors.foreground }]}>{rt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Living Stories ── */}
        <View style={[dStyles.section, { borderTopColor: colors.border }]}>
          <View style={dStyles.sectionHeader}>
            <View style={dStyles.sectionTitleRow}>
              <View style={[dStyles.lhpDot, { backgroundColor: meta.color }]} />
              <Text style={[dStyles.sectionTitle, { color: colors.foreground }]}>Living Stories</Text>
            </View>
            <Text style={[dStyles.sectionSub, { color: colors.mutedForeground }]}>
              Community voices from people connected to this place.
            </Text>
          </View>

          {loadingStories ? (
            <ActivityIndicator color={meta.color} size="small" style={{ marginTop: 8 }} />
          ) : stories.length === 0 ? (
            <View style={[dStyles.emptyStoriesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[dStyles.emptyStoriesTitle, { color: colors.foreground }]}>No stories yet</Text>
              <Text style={[dStyles.emptyStoriesSub, { color: colors.mutedForeground }]}>
                Be the first to share your connection to {site.name}.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dStyles.storiesScroll}>
              {stories.map((story) => (
                <View
                  key={story.id}
                  style={[dStyles.storyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={dStyles.storyCardHeader}>
                    <View style={[dStyles.relPill, { backgroundColor: meta.color + "18", borderColor: meta.color + "33" }]}>
                      <Text style={[dStyles.relPillText, { color: meta.color }]}>{story.relationshipType}</Text>
                    </View>
                    {story.isAmbassador && (
                      <View style={[dStyles.ambassadorBadge, { backgroundColor: "#CA922B18", borderColor: "#CA922B44" }]}>
                        <Feather name="star" size={10} color="#CA922B" />
                        <Text style={dStyles.ambassadorBadgeText}>Ambassador</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[dStyles.storyContent, { color: colors.foreground }]} numberOfLines={5}>
                    {story.content}
                  </Text>
                  {story.tags && story.tags.length > 0 && (
                    <View style={dStyles.storyTagRow}>
                      {story.tags.slice(0, 3).map((tag) => (
                        <View key={tag} style={[dStyles.storyTag, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <Text style={[dStyles.storyTagText, { color: colors.mutedForeground }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={[dStyles.storyAuthor, { color: colors.mutedForeground }]}>
                    {story.authorName ?? "Community Member"}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          {submitSuccess ? (
            <View style={[dStyles.successBox, { backgroundColor: "#16A34A12", borderColor: "#16A34A40" }]}>
              <Feather name="check-circle" size={16} color="#16A34A" />
              <Text style={[dStyles.successText, { color: "#16A34A" }]}>
                Your story has been submitted and is pending review. Thank you.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[dStyles.shareStoryBtn, { backgroundColor: meta.color + "15", borderColor: meta.color + "44" }]}
              onPress={() => setShowSubmitStory(true)}
              activeOpacity={0.75}
            >
              <Feather name="edit-3" size={15} color={meta.color} />
              <Text style={[dStyles.shareStoryBtnText, { color: meta.color }]}>Share Your Story</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Support the Legacy ── */}
        {(loadingLinks || supportLinks.length > 0) && (
          <View style={[dStyles.section, { borderTopColor: colors.border }]}>
            <View style={dStyles.sectionHeader}>
              <View style={dStyles.sectionTitleRow}>
                <Feather name="heart" size={15} color="#CA922B" />
                <Text style={[dStyles.sectionTitle, { color: colors.foreground }]}>Support the Legacy</Text>
              </View>
              <Text style={[dStyles.sectionSub, { color: colors.mutedForeground }]}>
                Awareness should create direct benefit — give back to the community that built this place.
              </Text>
            </View>

            {loadingLinks ? (
              <ActivityIndicator color="#CA922B" size="small" style={{ marginTop: 8 }} />
            ) : (
              <View style={dStyles.supportLinksWrap}>
                {supportLinks.map((link) => {
                  const linkColor = getSupportCategoryColor(link.category);
                  return (
                    <TouchableOpacity
                      key={link.id}
                      style={[dStyles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        trackExternalClick({
                          institutionName: link.title,
                          institutionType: (link.category === "scholarship" || link.category === "alumni_fund") ? "university" : "nonprofit",
                          institutionUrl: link.url,
                          referenceType: "support_link",
                          referenceId: site.id,
                          source: "cultural_heritage",
                          city: site.city,
                          state: site.state,
                        });
                        void Linking.openURL(link.url);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={dStyles.supportCardTop}>
                        <View style={[dStyles.supportCatPill, { backgroundColor: linkColor + "18", borderColor: linkColor + "33" }]}>
                          <Text style={[dStyles.supportCatText, { color: linkColor }]}>
                            {getSupportCategoryLabel(link.category)}
                          </Text>
                        </View>
                        <Feather name="external-link" size={13} color={colors.mutedForeground} />
                      </View>
                      <Text style={[dStyles.supportCardTitle, { color: colors.foreground }]}>{link.title}</Text>
                      {link.description ? (
                        <Text style={[dStyles.supportCardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                          {link.description}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── Before You Visit ── */}
        <View style={[dStyles.section, { borderTopColor: colors.border }]}>
          <View style={dStyles.sectionTitleRow}>
            <Feather name="info" size={15} color={colors.mutedForeground} />
            <Text style={[dStyles.sectionTitle, { color: colors.foreground }]}>Before You Visit</Text>
          </View>
          <View style={[dStyles.respectBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {respectGuidance.map((line, i) => (
              <View key={i} style={dStyles.respectRow}>
                <View style={[dStyles.respectDot, { backgroundColor: meta.color }]} />
                <Text style={[dStyles.respectText, { color: colors.foreground }]}>{line}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Amenity flags */}
        <View style={dStyles.flagRow}>
          <FlagPill icon="check-circle" label="Admission Free" active={site.admissionFree} colors={colors} />
          <FlagPill icon="eye" label="ADA Accessible" active={site.isAccessible} colors={colors} />
          <FlagPill icon="users" label="Family Friendly" active={site.isFamilyFriendly} colors={colors} />
          <FlagPill icon="headphones" label="Audio Guide" active={site.audioGuide} colors={colors} />
        </View>

        {/* Source */}
        {site.verifiedSource ? (
          <View style={[dStyles.infoRow, { borderColor: colors.border }]}>
            <Feather name="shield" size={13} color={colors.mutedForeground} />
            <Text style={[dStyles.infoLabel, { color: colors.mutedForeground }]}>Source: </Text>
            <Text style={[dStyles.infoValue, { color: colors.foreground }]}>{site.verifiedSource}</Text>
          </View>
        ) : null}

        {/* Visit website CTA */}
        {site.externalUrl ? (
          <TouchableOpacity
            style={[dStyles.websiteBtn, { backgroundColor: meta.color }]}
            onPress={() => {
              trackExternalClick({
                institutionName: site.name,
                institutionType: heritageInstitutionType(site.heritageCategory),
                institutionUrl: site.externalUrl!,
                referenceType: "cultural_heritage_visit",
                referenceId: site.id,
                source: "cultural_heritage",
                city: site.city,
                state: site.state,
              });
              void Linking.openURL(site.externalUrl!);
            }}
            activeOpacity={0.85}
          >
            <Feather name="external-link" size={16} color="#fff" />
            <Text style={dStyles.websiteBtnText}>Visit Official Website</Text>
          </TouchableOpacity>
        ) : null}

      </ScrollView>

      {/* Submit story modal */}
      <Modal
        visible={showSubmitStory}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowSubmitStory(false)}
      >
        <SubmitStoryModal
          siteId={site.id}
          siteName={site.name}
          heritageCategory={site.heritageCategory}
          initialRelationship={selectedRelationship}
          tagGroups={storyTagGroups}
          accentColor={meta.color}
          colors={colors}
          onClose={() => setShowSubmitStory(false)}
          onSubmitted={() => {
            setShowSubmitStory(false);
            setSubmitSuccess(true);
          }}
        />
      </Modal>
    </View>
  );
}

// ── Submit Story Modal ────────────────────────────────────────────────────────

function SubmitStoryModal({
  siteId,
  siteName,
  heritageCategory,
  initialRelationship,
  tagGroups,
  accentColor,
  colors,
  onClose,
  onSubmitted,
}: {
  siteId: string;
  siteName: string;
  heritageCategory: string | null;
  initialRelationship: string;
  tagGroups: TagGroup[];
  accentColor: string;
  colors: Colors;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const insets = useSafeAreaInsets();
  const relationshipTypes = getRelationshipTypes(heritageCategory);
  const [relationship, setRelationship] = useState(initialRelationship || "");
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 6),
    );
  };

  const canSubmit = relationship && content.trim().length >= 20 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const resp = await fetch(`${getApiBase()}/api/cultural-sites/${siteId}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationshipType: relationship,
          content: content.trim(),
          authorName: authorName.trim() || undefined,
          tags: selectedTags,
        }),
      });
      if (!resp.ok) {
        const d = (await resp.json()) as { error?: string };
        setError(d.error ?? "Failed to submit. Please try again.");
        return;
      }
      onSubmitted();
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[dStyles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
      <View style={[dStyles.handleRow, { borderBottomColor: colors.border }]}>
        <View style={[dStyles.handle, { backgroundColor: colors.border }]} />
        <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}>
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[dStyles.scroll, { gap: 20 }]}>
        <View>
          <Text style={[dStyles.name, { color: colors.foreground, fontSize: 18 }]}>Share Your Living Story</Text>
          <Text style={[dStyles.sectionSub, { color: colors.mutedForeground, marginTop: 4 }]}>
            {siteName} — your story helps preserve the history and meaning of this place.
          </Text>
        </View>

        <View style={[sStyles.promptBox, { backgroundColor: accentColor + "10", borderColor: accentColor + "30" }]}>
          <Text style={[sStyles.promptText, { color: colors.foreground }]}>
            Do not just show us where you are. Help us understand why this place matters, who carries its legacy, and what calls people back.
          </Text>
        </View>

        {/* Relationship */}
        <View style={{ gap: 10 }}>
          <Text style={[dStyles.sectionLabel, { color: colors.mutedForeground }]}>Your connection *</Text>
          <View style={dStyles.relationshipRow}>
            {relationshipTypes.map((rt) => {
              const active = relationship === rt;
              return (
                <TouchableOpacity
                  key={rt}
                  onPress={() => setRelationship(rt)}
                  style={[
                    dStyles.relChip,
                    { backgroundColor: active ? accentColor : colors.card, borderColor: active ? accentColor : colors.border },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[dStyles.relChipText, { color: active ? "#fff" : colors.foreground }]}>{rt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Story text */}
        <View style={{ gap: 8 }}>
          <Text style={[dStyles.sectionLabel, { color: colors.mutedForeground }]}>Your story *</Text>
          <View style={[sStyles.textAreaWrap, { backgroundColor: colors.card, borderColor: content.length < 20 && content.length > 0 ? "#DC2626" : colors.border }]}>
            <TextInput
              style={[sStyles.textArea, { color: colors.foreground }]}
              placeholder="Share your memory, experience, or why this place matters to you…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={6}
              value={content}
              onChangeText={setContent}
              maxLength={2000}
              textAlignVertical="top"
            />
          </View>
          <Text style={[sStyles.charCount, { color: content.length > 1800 ? "#DC2626" : colors.mutedForeground }]}>
            {content.length} / 2000 {content.length < 20 && content.length > 0 ? "· At least 20 characters required" : ""}
          </Text>
        </View>

        {/* Tags */}
        <View style={{ gap: 10 }}>
          <Text style={[dStyles.sectionLabel, { color: colors.mutedForeground }]}>Tags (optional, up to 6)</Text>
          {tagGroups.map((group) => (
            <View key={group.group} style={{ gap: 6 }}>
              <Text style={[sStyles.tagGroupLabel, { color: colors.mutedForeground }]}>{group.group}</Text>
              <View style={dStyles.relationshipRow}>
                {group.tags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[
                        dStyles.relChip,
                        { backgroundColor: active ? accentColor + "22" : colors.card, borderColor: active ? accentColor : colors.border },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[dStyles.relChipText, { color: active ? accentColor : colors.mutedForeground, fontSize: 12 }]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Name */}
        <View style={{ gap: 8 }}>
          <Text style={[dStyles.sectionLabel, { color: colors.mutedForeground }]}>Your name (optional)</Text>
          <View style={[sStyles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[sStyles.input, { color: colors.foreground }]}
              placeholder="How should we credit your story?"
              placeholderTextColor={colors.mutedForeground}
              value={authorName}
              onChangeText={setAuthorName}
              maxLength={60}
            />
          </View>
          <Text style={[sStyles.charCount, { color: colors.mutedForeground }]}>
            Leave blank to appear as "Community Member"
          </Text>
        </View>

        {error ? (
          <View style={[sStyles.errorBox, { backgroundColor: "#DC262612", borderColor: "#DC262640" }]}>
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text style={sStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[sStyles.submitBtn, { backgroundColor: canSubmit ? accentColor : colors.border }]}
          onPress={() => { void handleSubmit(); }}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="send" size={16} color="#fff" />
              <Text style={sStyles.submitBtnText}>Submit Living Story</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[sStyles.reviewNote, { color: colors.mutedForeground }]}>
          Stories are reviewed before appearing publicly. We curate for authenticity, respect, and relevance — not for volume.
        </Text>
      </ScrollView>
    </View>
  );
}

// ── FlagPill ──────────────────────────────────────────────────────────────────

function FlagPill({
  icon,
  label,
  active,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  active: boolean;
  colors: Colors;
}) {
  if (!active) return null;
  return (
    <View style={[flagStyles.pill, { backgroundColor: "#16A34A18", borderColor: "#16A34A44" }]}>
      <Feather name={icon} size={11} color="#16A34A" />
      <Text style={flagStyles.text}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  backBtn: { padding: 4 },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  filterWrap: { paddingVertical: 12 },
  filterList: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  chipBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  chipBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  heritagePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  heritagePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  freePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  freePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#16A34A" },
  cardName: { fontSize: 16, fontFamily: "Inter_700Bold", lineHeight: 22 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  cardMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardMetaDot: { fontSize: 12 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  websiteBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  websiteBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  moreBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  moreBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});

const dStyles = StyleSheet.create({
  container: { flex: 1 },
  handleRow: { alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, position: "relative" },
  handle: { width: 36, height: 4, borderRadius: 2 },
  closeBtn: { position: "absolute", right: 16, top: 10, padding: 6 },
  scroll: { padding: 20, gap: 16 },
  lhpBanner: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  lhpBannerInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  lhpDot: { width: 8, height: 8, borderRadius: 4 },
  lhpBannerTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#CA922B", textTransform: "uppercase", letterSpacing: 1 },
  lhpBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, fontStyle: "italic" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heritageBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
  },
  catBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  catBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  dot: { fontSize: 14 },
  yearText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderTopWidth: 1 },
  addressText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  section: { paddingTop: 16, borderTopWidth: 1, gap: 10 },
  sectionHeader: { gap: 4 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  bodyText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  sigBox: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 6 },
  sigLabel: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8 },
  sigText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, fontStyle: "italic" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, borderTopWidth: 1 },
  infoLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoValue: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  flagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  websiteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 8,
  },
  websiteBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  // relationship chips
  relationshipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  relChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  relChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  // stories
  storiesScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  storyCard: {
    width: 240, borderRadius: 14, borderWidth: 1, padding: 14, gap: 8,
    marginRight: 12,
  },
  storyCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  relPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  relPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  ambassadorBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  ambassadorBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#CA922B" },
  storyContent: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1 },
  storyTagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  storyTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  storyTagText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  storyAuthor: { fontSize: 11, fontFamily: "Inter_500Medium" },
  emptyStoriesBox: { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 4 },
  emptyStoriesTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyStoriesSub: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  shareStoryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 4,
  },
  shareStoryBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  successBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  successText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1, lineHeight: 19 },
  // support links
  supportLinksWrap: { gap: 10 },
  supportCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  supportCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  supportCatPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  supportCatText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  supportCardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  supportCardDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  // respect / before you visit
  respectBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  respectRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  respectDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  respectText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1 },
});

const sStyles = StyleSheet.create({
  promptBox: { padding: 14, borderRadius: 12, borderWidth: 1 },
  promptText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, fontStyle: "italic" },
  textAreaWrap: { borderRadius: 12, borderWidth: 1, padding: 14 },
  textArea: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22, minHeight: 120 },
  charCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tagGroupLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.6 },
  inputWrap: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  input: { fontSize: 15, fontFamily: "Inter_400Regular" },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#DC2626", flex: 1 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  submitBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  reviewNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
});

const flagStyles = StyleSheet.create({
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  text: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#16A34A" },
});
