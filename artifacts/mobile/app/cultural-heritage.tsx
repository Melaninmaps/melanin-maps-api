import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

  const [sites, setSites] = useState<CulturalSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [selectedHeritage, setSelectedHeritage] = useState("");
  const [selectedSite, setSelectedSite] = useState<CulturalSite | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

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

// ── Detail Modal ───────────────────────────────────────────────────────────────

type Colors = ReturnType<typeof useColors>;

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
  if (!site) return null;
  const meta = getHeritageMeta(site.heritageCategory);

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
          <Text style={[dStyles.metaText, { color: colors.mutedForeground }]}>
            {site.city}, {site.state}
          </Text>
          {site.era && (
            <>
              <Text style={[dStyles.dot, { color: colors.mutedForeground }]}>·</Text>
              <Feather name="calendar" size={14} color={colors.mutedForeground} />
              <Text style={[dStyles.metaText, { color: colors.mutedForeground }]}>{site.era}</Text>
            </>
          )}
        </View>
        {site.yearEstablished && (
          <Text style={[dStyles.yearText, { color: colors.mutedForeground }]}>
            Est. {site.yearEstablished}
          </Text>
        )}

        {/* Address */}
        {site.address && (
          <View style={[dStyles.addressRow, { borderColor: colors.border }]}>
            <Feather name="navigation" size={14} color={meta.color} />
            <Text style={[dStyles.addressText, { color: colors.mutedForeground }]}>{site.address}</Text>
          </View>
        )}

        {/* Description */}
        <View style={[dStyles.section, { borderTopColor: colors.border }]}>
          <Text style={[dStyles.sectionLabel, { color: colors.mutedForeground }]}>About</Text>
          <Text style={[dStyles.bodyText, { color: colors.foreground }]}>{site.description}</Text>
        </View>

        {/* Significance */}
        {site.significance && (
          <View style={[dStyles.sigBox, { backgroundColor: meta.color + "10", borderColor: meta.color + "30" }]}>
            <Text style={[dStyles.sigLabel, { color: meta.color }]}>Historical Significance</Text>
            <Text style={[dStyles.sigText, { color: colors.foreground }]}>{site.significance}</Text>
          </View>
        )}

        {/* Ethnic community */}
        {site.ethnicCommunity && (
          <View style={[dStyles.infoRow, { borderColor: colors.border }]}>
            <Feather name="users" size={14} color={colors.mutedForeground} />
            <Text style={[dStyles.infoLabel, { color: colors.mutedForeground }]}>Community: </Text>
            <Text style={[dStyles.infoValue, { color: colors.foreground }]}>{site.ethnicCommunity}</Text>
          </View>
        )}

        {/* Verified source */}
        {site.verifiedSource && (
          <View style={[dStyles.infoRow, { borderColor: colors.border }]}>
            <Feather name="shield" size={14} color={colors.mutedForeground} />
            <Text style={[dStyles.infoLabel, { color: colors.mutedForeground }]}>Source: </Text>
            <Text style={[dStyles.infoValue, { color: colors.foreground }]}>{site.verifiedSource}</Text>
          </View>
        )}

        {/* Amenity flags */}
        <View style={dStyles.flagRow}>
          <FlagPill icon="check-circle" label="Admission Free" active={site.admissionFree} colors={colors} />
          <FlagPill icon="eye" label="ADA Accessible" active={site.isAccessible} colors={colors} />
          <FlagPill icon="users" label="Family Friendly" active={site.isFamilyFriendly} colors={colors} />
          <FlagPill icon="headphones" label="Audio Guide" active={site.audioGuide} colors={colors} />
        </View>

        {/* Website CTA */}
        {site.externalUrl && (
          <TouchableOpacity
            style={[dStyles.websiteBtn, { backgroundColor: meta.color }]}
            onPress={() => void Linking.openURL(site.externalUrl!)}
            activeOpacity={0.85}
          >
            <Feather name="external-link" size={16} color="#fff" />
            <Text style={dStyles.websiteBtnText}>Visit Official Website</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

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
  filterWrap: { paddingVertical: 12, borderBottomWidth: 0 },
  filterList: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  chipBadge: {
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10,
  },
  chipBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  heritagePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  heritagePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  freePill: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
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
  handleRow: {
    alignItems: "center", paddingVertical: 12,
    borderBottomWidth: 1, position: "relative",
  },
  handle: { width: 36, height: 4, borderRadius: 2 },
  closeBtn: { position: "absolute", right: 16, top: 10, padding: 6 },
  scroll: { padding: 20, gap: 16 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heritageBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
  },
  catBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
  },
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
  addressRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, borderTopWidth: 1,
  },
  addressText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  section: { paddingTop: 16, borderTopWidth: 1, gap: 6 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  bodyText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  sigBox: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 6 },
  sigLabel: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8 },
  sigText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, fontStyle: "italic" },
  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, borderTopWidth: 1,
  },
  infoLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoValue: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  flagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  websiteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 8,
  },
  websiteBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});

const flagStyles = StyleSheet.create({
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  text: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#16A34A" },
});
