import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

const GREETING = "Hi! I'm your Melanin Maps AI guide. Ask me anything about Black-owned spots, safe neighborhoods, itinerary ideas, or travel tips in any city.";

const CANNED: { pattern: RegExp; replies: string[] }[] = [
  {
    pattern: /atlanta/i,
    replies: [
      "Atlanta has an incredible Black culture scene! I'd recommend starting in the Old Fourth Ward, checking out Sweet Auburn Ave, and trying the Beltline trail. Sweetwater Creek State Park is great for outdoors, and there are dozens of top-rated Black-owned restaurants in West End and Cascade.",
      "For Atlanta, the neighborhoods with the highest community safety scores are Buckhead (daytime), Midtown, and Decatur. The Old Fourth Ward has the densest cluster of Black-owned businesses on the map.",
    ],
  },
  {
    pattern: /houston/i,
    replies: [
      "Houston's Third Ward and Midtown have the strongest Black-owned business clusters. Check out Emancipation Park — recently renovated and historically significant. The Museum District is walkable and culturally rich.",
    ],
  },
  {
    pattern: /safe|safety|unsafe/i,
    replies: [
      "Safety scores on Melanin Maps are community-powered — collected from real visitor surveys weighting daytime safety (30%), nighttime safety (40%), walkability (20%), and transit (10%). A score above 75 is considered high confidence.",
      "For the best safety context, look at both the business safety score and the neighborhood rating. Users can also file incident reports anonymously through any business page.",
    ],
  },
  {
    pattern: /black.?owned/i,
    replies: [
      "Every business on Melanin Maps is community-verified for Black ownership. You can filter by Black-Owned Only on the Discover tab or use the map filter. Black-owned businesses are promoted within their category tier.",
    ],
  },
  {
    pattern: /restaurant|eat|food|foodie/i,
    replies: [
      "Our top-rated Black-owned restaurants right now include spots in Atlanta, Houston, and New Orleans. Use the category filter on Discover to browse Restaurants, then sort by safety score. The community favorites section shows the highest-rated this week.",
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
      "For a full AI-generated itinerary, tap the '✨ AI-POWERED — Plan Your Next Trip' banner on the Discover tab. Enter your destination and travel vibes and I'll generate a full day-by-day plan with Black-owned spots, safe neighborhoods, timing, and local context.",
    ],
  },
  {
    pattern: /new orleans/i,
    replies: [
      "New Orleans is one of the top cities on Melanin Maps! Tremé is the oldest African-American neighborhood in the country. I recommend hitting the Seventh Ward for local food, Esplanade Ave for culture, and the Treme neighborhood for history and live jazz.",
    ],
  },
  {
    pattern: /dc|washington/i,
    replies: [
      "Washington DC has incredible Black history. U Street Corridor, known as 'Black Broadway,' has the highest concentration of Black-owned businesses in our DC catalog. Shaw and Columbia Heights also score highly for community atmosphere.",
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
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", text: GREETING, fromUser: false, ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  React.useEffect(() => { startPulse(); }, []);

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
          style={[styles.fabBtn, { backgroundColor: colors.primary }]}
          onPress={() => { setOpen(true); pulse.stopAnimation(); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          activeOpacity={0.85}
        >
          <Feather name="message-circle" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={[styles.fabBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.fabBadgeTxt}>AI</Text>
        </View>
      </Animated.View>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={[styles.modal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === "web" ? 24 : insets.top + 12, borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarTxt}>AI</Text>
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Melanin Maps AI</Text>
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
                    <Text style={styles.msgAvatarTxt}>AI</Text>
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
                  <Text style={styles.msgAvatarTxt}>AI</Text>
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
  fab: { position: "absolute", right: 20, zIndex: 999 },
  fabBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#C4622D", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 10,
  },
  fabBadge: {
    position: "absolute", top: -4, right: -4,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8,
  },
  fabBadgeTxt: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#FFF" },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  modalHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFF" },
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
