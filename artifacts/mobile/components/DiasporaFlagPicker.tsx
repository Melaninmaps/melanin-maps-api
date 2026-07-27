import React, { useState, useMemo } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  DIASPORA_COUNTRIES,
  REGION_EMOJI,
  REGIONS,
  getFlag,
} from "@/constants/diaspora-countries";

interface Props {
  selected: string[];
  onToggle: (code: string) => void;
  label?: string;
}

export default function DiasporaFlagPicker({ selected, onToggle, label }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DIASPORA_COUNTRIES;
    return DIASPORA_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  const byRegion = useMemo(() => {
    const map: Record<string, typeof DIASPORA_COUNTRIES> = {};
    for (const r of REGIONS) map[r] = [];
    for (const c of filtered) map[c.region].push(c);
    return map;
  }, [filtered]);

  const selectedCountries = DIASPORA_COUNTRIES.filter((c) => selected.includes(c.code));

  const handleToggle = (code: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    onToggle(code);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[s.triggerBtn, { borderColor: selected.length > 0 ? colors.primary : colors.border, backgroundColor: colors.card }]}
        onPress={() => setOpen(true)}
      >
        <View style={s.triggerLeft}>
          <Text style={s.triggerGlobe}>🌍</Text>
          <View>
            <Text style={[s.triggerLabel, { color: colors.foreground }]}>
              {label ?? "Select Countries of Origin"}
            </Text>
            {selectedCountries.length > 0 ? (
              <Text style={[s.triggerSub, { color: colors.primary }]}>
                {selectedCountries.map((c) => `${getFlag(c.code)} ${c.name}`).join("  ·  ")}
              </Text>
            ) : (
              <Text style={[s.triggerSub, { color: colors.mutedForeground }]}>
                Tap to choose — multiple selections welcome
              </Text>
            )}
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={[s.sheet, { backgroundColor: colors.background }]}>
          <View style={[s.sheetHeader, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>🌍 Country of Origin</Text>
            <Text style={[s.sheetSub, { color: colors.mutedForeground }]}>
              Select all that apply — multiple heritages are celebrated here.
            </Text>
            <View style={[s.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={[s.searchInput, { color: colors.foreground }]}
                placeholder="Search countries…"
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity activeOpacity={0.85} onPress={() => setSearch("")}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
        keyboardDismissMode="on-drag"
            style={{ flex: 1 }}
            contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {selected.length > 0 && (
              <View style={s.selectedSection}>
                <Text style={[s.regionLabel, { color: colors.primary }]}>✓ Selected</Text>
                <View style={s.chipRow}>
                  {selectedCountries.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      activeOpacity={0.85}
                      style={[s.chip, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}
                      onPress={() => handleToggle(c.code)}
                    >
                      <Text style={s.chipFlag}>{getFlag(c.code)}</Text>
                      <Text style={[s.chipName, { color: colors.primary }]}>{c.name}</Text>
                      <Feather name="x" size={12} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {REGIONS.map((region) => {
              const countries = byRegion[region];
              if (!countries || countries.length === 0) return null;
              return (
                <View key={region} style={s.regionSection}>
                  <Text style={[s.regionLabel, { color: colors.mutedForeground }]}>
                    {REGION_EMOJI[region]} {region}
                  </Text>
                  <View style={s.chipRow}>
                    {countries.map((c) => {
                      const active = selected.includes(c.code);
                      return (
                        <TouchableOpacity
                          key={c.code}
                          activeOpacity={0.85}
                          style={[
                            s.chip,
                            {
                              backgroundColor: active ? colors.primary + "22" : colors.card,
                              borderColor: active ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => handleToggle(c.code)}
                        >
                          <Text style={s.chipFlag}>{getFlag(c.code)}</Text>
                          <Text style={[s.chipName, { color: active ? colors.primary : colors.foreground }]}>
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={[s.sheetFooter, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
            {selected.length > 0 && (
              <Text style={[s.footerCount, { color: colors.mutedForeground }]}>
                {selected.length} {selected.length === 1 ? "country" : "countries"} selected
              </Text>
            )}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[s.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setOpen(false); setSearch(""); }}
            >
              <Text style={[s.doneBtnTxt, { color: colors.primaryForeground }]}>
                {selected.length > 0 ? `Save ${selected.length} ${selected.length === 1 ? "Country" : "Countries"}` : "Done"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  triggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  triggerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  triggerGlobe: { fontSize: 24 },
  triggerLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  triggerSub: { fontSize: 12, fontFamily: "Inter_400Regular", flexShrink: 1, flexWrap: "wrap" },
  sheet: { flex: 1 },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  sheetSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  listContent: { padding: 16, gap: 20 },
  selectedSection: { gap: 8 },
  regionSection: { gap: 8 },
  regionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipFlag: { fontSize: 16 },
  chipName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sheetFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  footerCount: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  doneBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnTxt: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
