import { Feather } from "@expo/vector-icons";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Business } from "@/constants/types";
import { useColors } from "@/hooks/useColors";

interface Props {
  query: string;
  businesses: Business[];
  onSelect: (businessName: string) => void;
}

export function BusinessMentionPicker({ query, businesses, onSelect }: Props) {
  const colors = useColors();

  const matches = query.length === 0
    ? businesses.slice(0, 5)
    : businesses
        .filter((b) => b.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);

  if (matches.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Feather name="at-sign" size={13} color={colors.primary} />
        <Text style={[styles.headerText, { color: colors.mutedForeground }]}>
          {query ? `Businesses matching "${query}"` : "Tag a business"}
        </Text>
      </View>
      <FlatList
        data={matches}
        keyExtractor={(b) => b.id}
        scrollEnabled={false}
        renderItem={({ item: b, index }) => (
          <TouchableOpacity
            style={[
              styles.row,
              { borderBottomColor: colors.border },
              index === matches.length - 1 && styles.rowLast,
            ]}
            onPress={() => onSelect(b.name)}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="briefcase" size={13} color={colors.primary} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {b.category} · {b.city}
              </Text>
            </View>
            <View style={[styles.atBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.atBadgeText, { color: colors.primary }]}>@</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  atBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  atBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
});
