import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useColors } from "@/hooks/useColors";

const AUTH_TOKEN_KEY = "auth_session_token";

interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  timeAgo: string;
  status?: "sent" | "delivered" | "read";
}

interface ConvMeta {
  id: number;
  title: string;
  participantIds: string[];
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const COLORS = ["#3B1F0E", "#2D7A4F", "#C9922B", "#7B4F2E", "#1D4ED8", "#7B2D8B"];

function colorForId(id: number): string {
  return COLORS[id % COLORS.length] ?? COLORS[0];
}

function getInitials(title: string): string {
  return title.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const numericId = id ? parseInt(id, 10) : NaN;
  const isRealConv = !isNaN(numericId);

  const [conv, setConv] = useState<ConvMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadConv = useCallback(async () => {
    if (!isRealConv || !id) return;
    try {
      const apiBase = getApiBase();
      const token = await getToken();
      if (!token) return;

      const [convRes, msgsRes] = await Promise.all([
        fetch(`${apiBase}/api/conversations`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/api/conversations/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (convRes.ok) {
        const data = await convRes.json() as { conversations: ConvMeta[] };
        const found = data.conversations.find((c) => c.id === numericId);
        if (found) setConv(found);
      }

      const meRes = await fetch(`${apiBase}/api/auth/user`, { headers: { Authorization: `Bearer ${token}` } });
      if (meRes.ok) {
        const meData = await meRes.json() as { user: { id: string } | null };
        if (meData.user) setMyUserId(meData.user.id);
      }

      if (msgsRes.ok) {
        const data = await msgsRes.json() as { messages: { id: number; content: string; senderId: string | null; createdAt: string }[] };
        setMessages(
          data.messages.map((m) => ({
            id: String(m.id),
            text: m.content,
            fromMe: m.senderId != null && m.senderId === myUserId,
            timeAgo: formatTimeAgo(m.createdAt),
          })),
        );
      }
    } catch {
      setLoadError(true);
    }
  }, [id, isRealConv, numericId, myUserId]);

  useEffect(() => { void loadConv(); }, [loadConv]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sendMessage = async () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const optimistic: Message = {
      id: `m${Date.now()}`,
      text: text.trim(),
      fromMe: true,
      timeAgo: "Just now",
      status: "sent",
    };
    setMessages((prev) => [...prev, optimistic]);
    const sent = text.trim();
    setText("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    if (isRealConv && id) {
      try {
        const apiBase = getApiBase();
        const token = await getToken();
        await fetch(`${apiBase}/api/conversations/${id}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: sent }),
        });
      } catch {
        // message already shown optimistically
      }
    }
  };

  const convTitle = conv?.title ?? `Conversation ${id}`;
  const convColor = isRealConv ? colorForId(numericId) : COLORS[0];
  const convInitials = getInitials(convTitle);

  if (!isRealConv) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Feather name="message-circle" size={36} color={colors.muted} />
        <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 15 }]}>
          Conversation not found
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Feather name="wifi-off" size={36} color={colors.muted} />
        <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center" }]}>
          Couldn't load this conversation.{"\n"}Check your connection and try again.
        </Text>
        <TouchableOpacity onPress={() => { setLoadError(false); void loadConv(); }}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13 }}>Go back</Text>
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
        <View style={[styles.headerAvatar, { backgroundColor: convColor }]}>
          <Text style={styles.headerAvatarText}>{convInitials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>{convTitle}</Text>
          <Text style={[styles.headerStatus, { color: colors.mutedForeground }]}>
            {messages.length} messages
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
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Feather name="message-circle" size={32} color={colors.muted} />
            <Text style={[{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }]}>
              No messages yet. Say hello!
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const showAvatar = !item.fromMe && (index === 0 || messages[index - 1]?.fromMe !== item.fromMe);
          return (
            <View style={[styles.msgWrap, item.fromMe ? styles.msgWrapMe : styles.msgWrapThem]}>
              {!item.fromMe && showAvatar && (
                <View style={[styles.themAvatar, { backgroundColor: convColor }]}>
                  <Text style={styles.themAvatarText}>{convInitials[0]}</Text>
                </View>
              )}
              {!item.fromMe && !showAvatar && <View style={{ width: 28 }} />}
              <View style={styles.bubbleCol}>
                <View style={[
                  styles.bubble,
                  item.fromMe
                    ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                    : { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderColor: colors.border, borderWidth: 1 },
                ]}>
                  <Text style={[styles.bubbleText, { color: item.fromMe ? "#FFFFFF" : colors.foreground }]}>
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
          onPress={() => { void sendMessage(); }}
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
  headerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  headerInfo: { flex: 1, gap: 1 },
  headerName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  headerStatus: { fontFamily: "Inter_400Regular", fontSize: 11 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  messageList: { paddingTop: 16, paddingHorizontal: 12, gap: 4 },
  emptyChat: { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 40 },
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
