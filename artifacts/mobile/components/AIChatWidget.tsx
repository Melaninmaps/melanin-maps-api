import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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
  taskCreated?: { listName?: string; taskCount?: number; taskTitle?: string };
}

interface TaskActionPayload {
  type: "create_list" | "create_task" | "add_tasks";
  list?: { name: string; icon?: string };
  tasks?: Array<{ title: string; notes?: string | null; dueTimeLabel?: string | null; category?: string }>;
  task?: { title: string; notes?: string | null; dueTimeLabel?: string | null; category?: string };
}

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

const GREETING = "Hi! I'm KinfolkAI™ — ask me anything.";

let sessionId: string | undefined;

async function sendToKinfolk(message: string, token: string | null): Promise<{
  reply: string;
  taskAction?: TaskActionPayload | null;
}> {
  const base = getApiBase();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${base}/api/kinfolk`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, sessionId }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json() as { reply?: string; taskAction?: TaskActionPayload | null; sessionId?: string };
  if (data.sessionId) sessionId = data.sessionId;
  return { reply: data.reply ?? "Sorry, something went sideways on my end.", taskAction: data.taskAction };
}

async function handleTaskAction(action: TaskActionPayload, token: string | null): Promise<{ listName?: string; taskCount?: number; taskTitle?: string }> {
  const base = getApiBase();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (action.type === "create_list" && action.list) {
    const listRes = await fetch(`${base}/api/kinfolk/lists`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: action.list.name, icon: action.list.icon ?? "📋" }),
    });
    if (listRes.ok) {
      const { list } = await listRes.json() as { list: { id: string } };
      const tasks = action.tasks ?? [];
      if (tasks.length > 0 && list?.id) {
        await fetch(`${base}/api/kinfolk/tasks/bulk`, {
          method: "POST",
          headers,
          body: JSON.stringify({ listId: list.id, tasks }),
        });
      }
      return { listName: action.list.name, taskCount: tasks.length };
    }
  } else if ((action.type === "create_task" || action.type === "add_tasks") && action.tasks?.length) {
    for (const t of action.tasks) {
      await fetch(`${base}/api/kinfolk/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: t.title, notes: t.notes, dueTimeLabel: t.dueTimeLabel, category: t.category }),
      });
    }
    return { taskCount: action.tasks.length, taskTitle: action.tasks[0]?.title };
  } else if (action.type === "create_task" && action.task) {
    await fetch(`${base}/api/kinfolk/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title: action.task.title, notes: action.task.notes, dueTimeLabel: action.task.dueTimeLabel, category: action.task.category }),
    });
    return { taskTitle: action.task.title };
  }
  return {};
}

export function AIChatWidget() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", text: GREETING, fromUser: false, ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const fabTranslateY = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;

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

  React.useEffect(() => { if (!suppressed && !dismissed) startPulse(); }, [suppressed, dismissed]);

  const dismissPill = () => {
    pulse.stopAnimation();
    Animated.parallel([
      Animated.timing(fabTranslateY, { toValue: 120, duration: 280, useNativeDriver: true }),
      Animated.timing(fabOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setDismissed(true);
      fabTranslateY.setValue(0);
      fabOpacity.setValue(1);
    });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const restorePill = () => {
    setDismissed(false);
    fabTranslateY.setValue(80);
    fabOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(fabTranslateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
      Animated.timing(fabOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => startPulse());
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const fabPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          fabTranslateY.setValue(g.dy);
          fabOpacity.setValue(Math.max(0, 1 - g.dy / 80));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 40) {
          dismissPill();
        } else {
          Animated.parallel([
            Animated.spring(fabTranslateY, { toValue: 0, useNativeDriver: true }),
            Animated.timing(fabOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start(() => startPulse());
        }
      },
    })
  ).current;

  const restorePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 20) restorePill();
      },
    })
  ).current;

  if (suppressed) return null;

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = { id: String(Date.now()), text, fromUser: true, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const token = await getToken();
      const { reply, taskAction } = await sendToKinfolk(text, token);

      let taskCreated: Message["taskCreated"] | undefined;
      if (taskAction && token) {
        try {
          taskCreated = await handleTaskAction(taskAction, token);
        } catch {
          // task creation failed silently — reply still shows
        }
      }

      const aiMsg: Message = { id: String(Date.now() + 1), text: reply, fromUser: false, ts: Date.now(), taskCreated };
      setMessages((m) => [...m, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: String(Date.now() + 1),
        text: "I'm having trouble connecting right now. Check your connection and try again.",
        fromUser: false,
        ts: Date.now(),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setTyping(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const goToTasks = () => {
    setOpen(false);
    router.push("/kinfolk-tasks");
  };

  return (
    <>
      {dismissed ? (
        <View
          style={[styles.restoreTab, { bottom: bottomPad + 90, backgroundColor: colors.primary }]}
          {...restorePanResponder.panHandlers}
        >
          <TouchableOpacity onPress={restorePill} style={styles.restoreTabInner} activeOpacity={0.85}>
            <Text style={styles.restoreTabIcon}>✦</Text>
            <Text style={styles.restoreTabTxt}>KA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View
          style={[
            styles.fab,
            {
              bottom: bottomPad + 96,
              transform: [{ scale: pulse }, { translateY: fabTranslateY }],
              opacity: fabOpacity,
            },
          ]}
          {...fabPanResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.fabPill}
            onPress={() => {
              setOpen(true);
              pulse.stopAnimation();
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
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
      )}

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
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Ask me anything · Create lists & reminders</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={goToTasks} style={[styles.tasksBtn, { borderColor: colors.border }]}>
                <Feather name="check-square" size={14} color={colors.primary} />
                <Text style={[styles.tasksBtnTxt, { color: colors.primary }]}>My Lists</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setOpen(false); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[styles.minimizeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Feather name="chevron-down" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
        keyboardDismissMode="on-drag"
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={[styles.msgList, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <View>
                <View style={[styles.msgRow, item.fromUser && styles.msgRowUser]}>
                  {!item.fromUser && (
                    <View style={[styles.msgAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.msgAvatarTxt}>KA</Text>
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
                {item.taskCreated && (
                  <TouchableOpacity onPress={goToTasks} style={[styles.taskCreatedBadge, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                    <Feather name="check-square" size={13} color={colors.primary} />
                    <Text style={[styles.taskCreatedTxt, { color: colors.primary }]}>
                      {item.taskCreated.listName
                        ? `✓ Created "${item.taskCreated.listName}" with ${item.taskCreated.taskCount ?? 0} items — tap to view`
                        : item.taskCreated.taskTitle
                        ? `✓ Saved "${item.taskCreated.taskTitle}" — tap to view`
                        : `✓ ${item.taskCreated.taskCount} tasks saved — tap to view`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListFooterComponent={typing ? (
              <View style={[styles.msgRow]}>
                <View style={[styles.msgAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.msgAvatarTxt}>KA</Text>
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
              placeholder="Ask about cities, safety, places, or make a list…"
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
  restoreTab: {
    position: "absolute", right: 0, zIndex: 999,
    borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
    shadowColor: "#000", shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 8,
  },
  restoreTabInner: {
    paddingVertical: 12, paddingHorizontal: 10,
    alignItems: "center", justifyContent: "center", gap: 2,
  },
  restoreTabIcon: { fontSize: 14, color: "#FAF1E4" },
  restoreTabTxt: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#FAF1E4", letterSpacing: 0.5 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  modalHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  tasksBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  tasksBtnTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
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
  taskCreatedBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 6, marginLeft: 36,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1, borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  taskCreatedTxt: { fontSize: 12, fontFamily: "Inter_500Medium", flexShrink: 1 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 24, paddingHorizontal: 16,
    paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular",
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  minimizeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
});
