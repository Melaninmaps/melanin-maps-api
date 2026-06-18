import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CONVERSATIONS } from "../messages";
import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  timeAgo: string;
  status?: "sent" | "delivered" | "read";
}

const INITIAL_MESSAGES: Record<string, Message[]> = {
  c1: [
    { id: "m1", text: "Hi! I'd love to book a natural hair appointment. Do you have availability this week?", fromMe: true, timeAgo: "Yesterday 3:12 PM", status: "read" },
    { id: "m2", text: "Hello! Yes, we have openings on Thursday at 2pm and Friday at 10am. Which works best for you?", fromMe: false, timeAgo: "Yesterday 3:45 PM" },
    { id: "m3", text: "Thursday at 2pm works perfectly! How long does a loc appointment usually take?", fromMe: true, timeAgo: "Yesterday 4:00 PM", status: "read" },
    { id: "m4", text: "For a full loc retwist it's about 2–3 hours depending on length and thickness. We'll confirm the exact time when you arrive 🙏🏾", fromMe: false, timeAgo: "Yesterday 4:15 PM" },
    { id: "m5", text: "Thank you for your review! We hope to see you again soon 💛", fromMe: false, timeAgo: "2 minutes ago" },
  ],
  c2: [
    { id: "m1", text: "Hey! Did you go to that event in DC last weekend?", fromMe: false, timeAgo: "Monday 6:00 PM" },
    { id: "m2", text: "Yes! It was incredible. The panel on community wealth building was so good.", fromMe: true, timeAgo: "Monday 6:14 PM", status: "read" },
    { id: "m3", text: "Did you check out that new bookstore I mentioned?", fromMe: false, timeAgo: "14 minutes ago" },
  ],
};

const DEFAULT_MSGS: Message[] = [
  { id: "dm1", text: "Hey there! How can I help you today?", fromMe: false, timeAgo: "Just now" },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const conv = CONVERSATIONS.find((c) => c.id === id);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES[id ?? ""] ?? DEFAULT_MSGS);
  const [text, setText] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sendMessage = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: Message = {
      id: `m${Date.now()}`,
      text: text.trim(),
      fromMe: true,
      timeAgo: "Just now",
      status: "sent",
    };
    setMessages((prev) => [...prev, newMsg]);
    setText("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (!conv) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Conversation not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { backgroundColor: conv.color }]}>
          <Text style={styles.headerAvatarText}>{conv.initials}</Text>
          {conv.online && <View style={[styles.onlineDot, { borderColor: colors.background }]} />}
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>{conv.name}</Text>
          <Text style={[styles.headerStatus, { color: "#2D7A4F" }]}>
            {conv.online ? "Online" : "Last seen recently"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="phone" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="more-vertical" size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item, index }) => {
          const showTime = index === 0 || messages[index - 1]?.fromMe !== item.fromMe;
          return (
            <View style={[styles.msgWrap, item.fromMe ? styles.msgWrapMe : styles.msgWrapThem]}>
              {!item.fromMe && showTime && (
                <View style={[styles.themAvatar, { backgroundColor: conv.color }]}>
                  <Text style={styles.themAvatarText}>{conv.initials[0]}</Text>
                </View>
              )}
              {!item.fromMe && !showTime && <View style={{ width: 28 }} />}
              <View style={styles.bubbleCol}>
                <View style={[
                  styles.bubble,
                  item.fromMe
                    ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                    : { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderColor: colors.border, borderWidth: 1 },
                ]}>
                  <Text style={[styles.bubbleText, { color: item.fromMe ? "#FBF7F0" : colors.foreground }]}>
                    {item.text}
                  </Text>
                </View>
                <View style={[styles.msgMeta, item.fromMe && styles.msgMetaMe]}>
                  <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>{item.timeAgo}</Text>
                  {item.fromMe && item.status && (
                    <Feather
                      name={item.status === "read" ? "check-circle" : item.status === "delivered" ? "check" : "clock"}
                      size={11}
                      color={item.status === "read" ? "#2D7A4F" : colors.mutedForeground}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: colors.secondary }]}>
          <Feather name="paperclip" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Message..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            returnKeyType="default"
          />
          <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Feather name="smile" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
          onPress={sendMessage}
          disabled={!text.trim()}
          activeOpacity={0.85}
        >
          <Feather name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", position: "relative" },
  headerAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: "#2D7A4F", borderWidth: 2 },
  headerInfo: { flex: 1, gap: 1 },
  headerName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  headerStatus: { fontFamily: "Inter_400Regular", fontSize: 11 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  messageList: { paddingTop: 16, paddingHorizontal: 12, gap: 4 },
  msgWrap: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 4 },
  msgWrapMe: { justifyContent: "flex-end" },
  msgWrapThem: { justifyContent: "flex-start" },
  themAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  themAvatarText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#FFFFFF" },
  bubbleCol: { maxWidth: "78%", gap: 3 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  msgMeta: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4 },
  msgMetaMe: { justifyContent: "flex-end" },
  msgTime: { fontFamily: "Inter_400Regular", fontSize: 10 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  attachBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 44,
    maxHeight: 120,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});
