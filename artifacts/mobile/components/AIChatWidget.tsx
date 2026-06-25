import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePathname } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  text: string;
  fromUser: boolean;
  ts: number;
}

const GREETING = "Hi! I'm KinfolkAI™. Ask me anything about minority-owned spots, safe neighborhoods, itinerary ideas, or travel tips in any city.";

const CANNED: { pattern: RegExp; replies: string[] }[] = [
  {
    pattern: /atlanta/i,
    replies: [
      "Atlanta has an incredible Black culture scene! I'd recommend starting in the Old Fourth Ward, checking out Sweet Auburn Ave, and trying the Beltline trail. Sweetwater Creek State Park is great for outdoors, and there are dozens of top-rated minority-owned restaurants in West End and Cascade.",
      "For Atlanta, the neighborhoods with the highest community safety scores are Buckhead (daytime), Midtown, and Decatur. The Old Fourth Ward has the densest cluster of minority-owned businesses on the map.",
    ],
  },
  {
    pattern: /houston/i,
    replies: [
      "Houston's Third Ward and Midtown have the strongest minority-owned business clusters. Check out Emancipation Park — recently renovated and historically significant. The Museum District is walkable and culturally rich.",
    ],
  },
  {
    pattern: /safe|safety|unsafe/i,
    replies: [
      "Safety scores on Mapping with Melanin are community-powered — collected from real visitor surveys weighting daytime safety (30%), nighttime safety (40%), walkability (20%), and transit (10%). A score above 75 is considered high confidence.",
      "For the best safety context, look at both the business safety score and the neighborhood rating. Users can also file incident reports anonymously through any business page.",
    ],
  },
  {
    pattern: /black.?owned/i,
    replies: [
      "Every business on Mapping with Melanin is community-verified for Black ownership. You can filter by Black-Owned Only on the Discover tab or use the map filter. minority-owned businesses are promoted within their category tier.",
    ],
  },
  {
    pattern: /restaurant|eat|food|foodie/i,
    replies: [
      "Our top-rated minority-owned restaurants right now include spots in Atlanta, Houston, and New Orleans. Use the category filter on Discover to browse Restaurants, then sort by safety score. The community favorites section shows the highest-rated this week.",
    ],
  },
  {
    pattern: /hotel|stay|accommodation/i,
    replies: [
      "For stays, filter the Discover tab to Hotels and look for the Verified badge. I also recommend checking the neighborhood safety score for any area before booking — tap any neighborhood name on the map to see community ratings.",
    ],
  },
  {
    pattern: /itinerary|plan|trip/i,
    replies: [
      "For a full AI-generated itinerary, tap the '✨ KINFOLKAI™ — Plan Your Next Trip' banner on the Discover tab. Enter your destination and travel vibes and I'll generate a full day-by-day plan with minority-owned spots, safe neighborhoods, timing, and local context.",
    ],
  },
  {
    pattern: /new orleans/i,
    replies: [
      "New Orleans is one of the top cities on Mapping with Melanin! Tremé is the oldest African-American neighborhood in the country. I recommend hitting the Seventh Ward for local food, Esplanade Ave for culture, and the Treme neighborhood for history and live jazz.",
    ],
  },
  {
    pattern: /dc|washington/i,
    replies: [
      "Washington DC has incredible Black history. U Street Corridor, known as 'Black Broadway,' has the highest concentration of minority-owned businesses in our DC catalog. Shaw and Columbia Heights also score highly for community atmosphere.",
    ],
  },
];

function getReply(msg: string): string {
  for (const { pattern, replies } of CANNED) {
    if (pattern.test(msg)) {
      return replies[Math.floor(Math.random() * replies.length)];
    }
  }
  return "Great question! I'm still learning about that specific topic. For the most current info, check the Discover tab for businesses, the Map tab for neighborhood safety, or browse the Community feed for recent posts and recommendations.";
}

export function AIChatWidget() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", text: GREETING, fromUser: false, ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  const suppressed = ["/onboarding", "/login", "/signup"].some((r) => pathname.startsWith(r));

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  React.useEffect(() => { if (!suppressed) startPulse(); }, [suppressed]);

  if (suppressed) return null;

  const send = () => {
    const text = input.trim();
    if (!text) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = { id: String(Date.now()), text, fromUser: true, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply: Message = { id: String(Date.now() + 1), text: getReply(text), fromUser: false, ts: Date.now() };
      setMessages((m) => [...m, reply]);
      setTyping(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }, 900 + Math.random() * 600);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <>
      <Animated.View style={[styles.fab, { bottom: bottomPad + 96, transform: [{ scale: pulse }] }]}>
        <TouchableOpacity
          style={styles.fabPill}
          onPress={() => { setOpen(true); pulse.stopAnimation(); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          activeOpacity={0.88}
        >
          <View style={[styles.fabIconWrap, { backgroundColor: colors.primary }]}>
            <Text style={styles.fabIconTxt}>✦</Text>
          </View>
          <View style={styles.fabTextWrap}>
            <Text style={styles.fabTitle}>KinfolkAI™</Text>
            <Text style={styles.fabSub}>Ask me anything ✨</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={[styles.modal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === "web" ? 24 : insets.top + 12, borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarTxt}>KA</Text>
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>KinfolkAI™</Text>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Powered by Gemini · Always here to help</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={[styles.msgList, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <View style={[styles.msgRow, item.fromUser && styles.msgRowUser]}>
                {!item.fromUser && (
                  <View style={[styles.msgAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.msgAvatarTxt}>CC</Text>
                  </View>
                )}
                <View style={[
                  styles.bubble,
                  item.fromUser
                    ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                    : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
                ]}>
                  <Text style={[styles.bubbleTxt, { color: item.fromUser ? "#FFF" : colors.foreground }]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={typing ? (
              <View style={[styles.msgRow]}>
                <View style={[styles.msgAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.msgAvatarTxt}>CC</Text>
                </View>
                <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }]}>
                  <Text style={[styles.typingDots, { color: colors.mutedForeground }]}>●  ●  ●</Text>
                </View>
              </View>
            ) : null}
          />

          <View style={[styles.inputRow, { borderTopColor: colors.border, paddingBottom: bottomPad + 8, backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Ask about cities, safety, places…"
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.muted }]}
              onPress={send}
              disabled={!input.trim()}
              activeOpacity={0.8}
            >
              <Feather name="send" size={18} color={input.trim() ? "#FFF" : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: "absolute", right: 16, zIndex: 999 },
  fabPill: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FAF1E4",
    borderRadius: 50,
    paddingVertical: 10, paddingHorizontal: 14,
    shadowColor: "#3B1F0E", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 8,
    borderWidth: 1, borderColor: "#E8D9C4",
  },
  fabIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  fabIconTxt: { fontSize: 15, color: "#FAF1E4" },
  fabTextWrap: { gap: 1 },
  fabTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#3B1F0E" },
  fabSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#8B6F4E" },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  modalHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#FFF" },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  msgList: { padding: 16, gap: 12 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowUser: { justifyContent: "flex-end" },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  msgAvatarTxt: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#FFF" },
  bubble: { maxWidth: "78%", padding: 12, borderRadius: 16 },
  bubbleTxt: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  typingDots: { fontSize: 10, letterSpacing: 4 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 24, paddingHorizontal: 16,
    paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular",
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
