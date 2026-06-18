import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Event } from "@/constants/types";

interface Props {
  event: Event;
  onPress: () => void;
}

export function EventCard({ event, onPress }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.foreground }]}
    >
      <Image
        source={require("@/assets/images/event_festival.png")}
        style={styles.image}
        contentFit="cover"
      />
      {event.featured && (
        <View style={[styles.featuredBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.featuredText, { color: colors.accentForeground }]}>Featured</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={[styles.dateBubble, { backgroundColor: colors.primary }]}>
          <Text style={[styles.dateShort, { color: colors.primaryForeground }]}>{event.dateShort.split(" ")[0]}</Text>
          <Text style={[styles.dateNum, { color: colors.primaryForeground }]}>{event.dateShort.split(" ")[1]}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.meta}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{event.time}</Text>
          </View>
          <View style={styles.meta}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {event.location}, {event.city}
            </Text>
          </View>
          <View style={styles.footer}>
            <View style={[styles.priceTag, { backgroundColor: event.isFree ? colors.success + "20" : colors.secondary }]}>
              <Text style={[styles.price, { color: event.isFree ? colors.success : colors.foreground }]}>
                {event.price}
              </Text>
            </View>
            <View style={styles.attendees}>
              <Feather name="users" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{event.attendees.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 160,
  },
  featuredBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  featuredText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  content: {
    flexDirection: "row",
    padding: 14,
    gap: 12,
    alignItems: "flex-start",
  },
  dateBubble: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dateShort: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  dateNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    lineHeight: 20,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginBottom: 2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  priceTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  price: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  attendees: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
