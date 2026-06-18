import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EVENTS } from "@/constants/data";
import { useColors } from "@/hooks/useColors";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rsvpd, setRsvpd] = useState(false);

  const event = EVENTS.find((e) => e.id === id);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!event) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Event not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRsvp = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRsvpd((r) => !r);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.backBtn, { top: Platform.OS === "web" ? 77 : insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)" }]}
        >
          <Feather name="share-2" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 100 }}>
        <Image
          source={require("@/assets/images/bento-nightlife.jpg")}
          style={styles.hero}
          contentFit="cover"
        />

        {event.featured && (
          <View style={[styles.featuredBanner, { backgroundColor: colors.accent }]}>
            <Feather name="star" size={14} color="#FFFFFF" />
            <Text style={styles.featuredText}>Featured Event</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={[styles.dateBubbleRow]}>
            <View style={[styles.dateBubble, { backgroundColor: colors.primary }]}>
              <Text style={[styles.dateMonth, { color: colors.primaryForeground }]}>
                {event.dateShort.split(" ")[0]}
              </Text>
              <Text style={[styles.dateDay, { color: colors.primaryForeground }]}>
                {event.dateShort.split(" ")[1]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>{event.title}</Text>
              <Text style={[styles.organizer, { color: colors.primary }]}>by {event.organizer}</Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card, shadowColor: colors.foreground }]}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="calendar" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Date & Time</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{event.date}</Text>
                <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>{event.time}</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="map-pin" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Location</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{event.location}</Text>
                <Text style={[styles.infoSub, { color: colors.mutedForeground }]}>
                  {event.city}, {event.state}
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="users" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Attendees</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                  {event.attendees.toLocaleString()} attending
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About This Event</Text>
          <Text style={[styles.description, { color: colors.foreground }]}>{event.description}</Text>

          <View style={[styles.categoryTag, { backgroundColor: colors.secondary }]}>
            <Feather name="tag" size={13} color={colors.primary} />
            <Text style={[styles.categoryText, { color: colors.primary }]}>{event.category}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
        <View style={styles.priceBlock}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Price</Text>
          <Text style={[styles.priceValue, { color: event.isFree ? colors.success : colors.foreground }]}>
            {event.price}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleRsvp}
          style={[
            styles.rsvpBtn,
            { backgroundColor: rsvpd ? colors.success : colors.primary },
          ]}
          activeOpacity={0.85}
        >
          <Feather name={rsvpd ? "check" : "calendar"} size={18} color="#FFFFFF" />
          <Text style={styles.rsvpText}>{rsvpd ? "RSVP'd!" : "RSVP Now"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  backLink: { fontFamily: "Inter_500Medium", fontSize: 14 },
  backBtn: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { width: "100%", height: 240 },
  featuredBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  featuredText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
  body: { padding: 20, gap: 16 },
  dateBubbleRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  dateBubble: {
    width: 54,
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateMonth: { fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase" },
  dateDay: { fontFamily: "Inter_700Bold", fontSize: 20, lineHeight: 22 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, lineHeight: 26 },
  organizer: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 4 },
  infoCard: {
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  infoSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  divider: { height: 1 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  description: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  priceBlock: { flex: 0 },
  priceLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  priceValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  rsvpBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 12,
  },
  rsvpText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
