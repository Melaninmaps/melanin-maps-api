import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

interface TaskList {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
}

interface Task {
  id: string;
  listId: string | null;
  title: string;
  notes: string | null;
  dueTimeLabel: string | null;
  category: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

type ScreenView = "home" | "list";

export default function KinfolkTasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [view, setView] = useState<ScreenView>("home");
  const [activeList, setActiveList] = useState<TaskList | null>(null);

  const [lists, setLists] = useState<TaskList[]>([]);
  const [standaloneTasks, setStandaloneTasks] = useState<Task[]>([]);
  const [listTasks, setListTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showNewList, setShowNewList] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListIcon, setNewListIcon] = useState("📋");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNote, setNewTaskNote] = useState("");
  const [saving, setSaving] = useState(false);

  const ICONS = ["📋", "🛒", "📦", "🏠", "🍽️", "💼", "🎉", "✈️", "💊", "🎓", "🚗", "📚"];

  const fetchLists = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const base = getApiBase();
    const headers = { Authorization: `Bearer ${token}` };
    const [listsRes, tasksRes] = await Promise.all([
      fetch(`${base}/api/kinfolk/lists`, { headers }),
      fetch(`${base}/api/kinfolk/tasks?listId=none`, { headers }),
    ]);
    if (listsRes.ok) setLists((await listsRes.json() as { lists: TaskList[] }).lists);
    if (tasksRes.ok) setStandaloneTasks((await tasksRes.json() as { tasks: Task[] }).tasks);
  }, []);

  const fetchListTasks = useCallback(async (listId: string) => {
    const token = await getToken();
    if (!token) return;
    const base = getApiBase();
    const res = await fetch(`${base}/api/kinfolk/tasks?listId=${listId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setListTasks((await res.json() as { tasks: Task[] }).tasks);
  }, []);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      await fetchLists();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchLists]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (view === "list" && activeList) fetchListTasks(activeList.id);
  }, [view, activeList, fetchListTasks]);

  const openList = (list: TaskList) => {
    setActiveList(list);
    setView("list");
  };

  const goHome = () => {
    setView("home");
    setActiveList(null);
    load(true);
  };

  const toggleTask = async (task: Task, inList: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const token = await getToken();
    if (!token) return;
    const base = getApiBase();
    const newVal = !task.isCompleted;

    if (inList) {
      setListTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, isCompleted: newVal } : t));
    } else {
      setStandaloneTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, isCompleted: newVal } : t));
    }

    await fetch(`${base}/api/kinfolk/tasks/${task.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: newVal }),
    });
  };

  const deleteTask = async (taskId: string, inList: boolean) => {
    const token = await getToken();
    if (!token) return;
    const base = getApiBase();
    if (inList) setListTasks((prev) => prev.filter((t) => t.id !== taskId));
    else setStandaloneTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`${base}/api/kinfolk/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const deleteList = async (listId: string) => {
    Alert.alert("Delete List", "This will delete the list and all its tasks.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          const token = await getToken();
          if (!token) return;
          const base = getApiBase();
          await fetch(`${base}/api/kinfolk/lists/${listId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          setLists((prev) => prev.filter((l) => l.id !== listId));
          if (view === "list") goHome();
        },
      },
    ]);
  };

  const createList = async () => {
    if (!newListName.trim()) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { Alert.alert("Sign in required", "Please sign in to create lists."); return; }
      const base = getApiBase();
      const res = await fetch(`${base}/api/kinfolk/lists`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim(), icon: newListIcon }),
      });
      if (res.ok) {
        const { list } = await res.json() as { list: TaskList };
        setLists((prev) => [list, ...prev]);
        setShowNewList(false);
        setNewListName("");
        setNewListIcon("📋");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally { setSaving(false); }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { Alert.alert("Sign in required", "Please sign in to create tasks."); return; }
      const base = getApiBase();
      const listId = view === "list" && activeList ? activeList.id : undefined;
      const res = await fetch(`${base}/api/kinfolk/tasks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle.trim(), notes: newTaskNote.trim() || null, listId }),
      });
      if (res.ok) {
        const { task } = await res.json() as { task: Task };
        if (listId) setListTasks((prev) => [...prev, task]);
        else setStandaloneTasks((prev) => [...prev, task]);
        setShowNewTask(false);
        setNewTaskTitle("");
        setNewTaskNote("");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally { setSaving(false); }
  };

  const incompleteListTasks = listTasks.filter((t) => !t.isCompleted);
  const completedListTasks = listTasks.filter((t) => t.isCompleted);
  const incompleteStandalone = standaloneTasks.filter((t) => !t.isCompleted);
  const completedStandalone = standaloneTasks.filter((t) => t.isCompleted);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 24 : insets.top + 12, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {view === "list" ? (
            <TouchableOpacity onPress={goHome} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {view === "list" && activeList ? `${activeList.icon} ${activeList.name}` : "My Lists"}
            </Text>
            {view === "list" && activeList && (
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                {incompleteListTasks.length} remaining · {completedListTasks.length} done
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {view === "list" && activeList && (
            <TouchableOpacity onPress={() => deleteList(activeList.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="trash-2" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => view === "list" ? setShowNewTask(true) : setShowNewList(true)}
          >
            <Feather name="plus" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : view === "home" ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
        >
          {lists.length === 0 && incompleteStandalone.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No lists yet</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Ask KinfolkAI™ to "make me a grocery list" or tap + to create one.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.back()}
              >
                <Text style={styles.emptyBtnTxt}>Open KinfolkAI™</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {lists.length > 0 && (
                <View>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LISTS</Text>
                  {lists.map((list) => (
                    <TouchableOpacity
                      key={list.id}
                      style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => openList(list)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.listIcon}>{list.icon}</Text>
                      <View style={styles.listCardBody}>
                        <Text style={[styles.listCardName, { color: colors.foreground }]}>{list.name}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {incompleteStandalone.length > 0 && (
                <View style={{ marginTop: 24 }}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>REMINDERS & TASKS</Text>
                  {incompleteStandalone.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      colors={colors}
                      onToggle={() => toggleTask(task, false)}
                      onDelete={() => deleteTask(task.id, false)}
                    />
                  ))}
                </View>
              )}

              {completedStandalone.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>COMPLETED</Text>
                  {completedStandalone.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      colors={colors}
                      onToggle={() => toggleTask(task, false)}
                      onDelete={() => deleteTask(task.id, false)}
                    />
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.addTaskInline, { borderColor: colors.border }]}
                onPress={() => setShowNewTask(true)}
              >
                <Feather name="plus" size={16} color={colors.mutedForeground} />
                <Text style={[styles.addTaskInlineTxt, { color: colors.mutedForeground }]}>Add a reminder or task</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={[...incompleteListTasks, ...completedListTasks]}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); if (activeList) fetchListTasks(activeList.id).finally(() => setRefreshing(false)); }} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={[styles.emptyState, { marginTop: 40 }]}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>List is empty</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Tap + to add items.</Text>
            </View>
          }
          ListHeaderComponent={
            incompleteListTasks.length > 0 ? (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 8 }]}>ITEMS</Text>
            ) : null
          }
          renderItem={({ item, index }) => {
            const isFirstCompleted = item.isCompleted && index > 0 && !listTasks[index - 1]?.isCompleted;
            return (
              <>
                {isFirstCompleted && completedListTasks.length > 0 && (
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16, marginBottom: 8 }]}>COMPLETED</Text>
                )}
                <TaskRow
                  task={item}
                  colors={colors}
                  onToggle={() => toggleTask(item, true)}
                  onDelete={() => deleteTask(item.id, true)}
                />
              </>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={[styles.addTaskInline, { borderColor: colors.border, marginTop: 8 }]}
              onPress={() => setShowNewTask(true)}
            >
              <Feather name="plus" size={16} color={colors.mutedForeground} />
              <Text style={[styles.addTaskInlineTxt, { color: colors.mutedForeground }]}>Add item</Text>
            </TouchableOpacity>
          }
        />
      )}

      <Modal visible={showNewList} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowNewList(false)}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New List</Text>
            <TouchableOpacity onPress={() => setShowNewList(false)}>
              <Feather name="x" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={styles.sheetBody}>
            <TextInput
              style={[styles.sheetInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="List name (e.g. Grocery Run)"
              placeholderTextColor={colors.mutedForeground}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
              returnKeyType="done"
            />
            <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>Choose an icon</Text>
            <View style={styles.iconGrid}>
              {ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, { backgroundColor: newListIcon === icon ? colors.primary + "20" : colors.card, borderColor: newListIcon === icon ? colors.primary : colors.border }]}
                  onPress={() => setNewListIcon(icon)}
                >
                  <Text style={styles.iconOptionTxt}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.sheetBtn, { backgroundColor: newListName.trim() ? colors.primary : colors.muted }]}
              onPress={createList}
              disabled={!newListName.trim() || saving}
            >
              {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.sheetBtnTxt}>Create List</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showNewTask} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowNewTask(false)}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              {view === "list" && activeList ? `Add to ${activeList.name}` : "New Task"}
            </Text>
            <TouchableOpacity onPress={() => setShowNewTask(false)}>
              <Feather name="x" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={styles.sheetBody}>
            <TextInput
              style={[styles.sheetInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Task title"
              placeholderTextColor={colors.mutedForeground}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
              returnKeyType="next"
            />
            <TextInput
              style={[styles.sheetInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, marginTop: 10 }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={newTaskNote}
              onChangeText={setNewTaskNote}
              returnKeyType="done"
              onSubmitEditing={createTask}
            />
            <TouchableOpacity
              style={[styles.sheetBtn, { backgroundColor: newTaskTitle.trim() ? colors.primary : colors.muted, marginTop: 16 }]}
              onPress={createTask}
              disabled={!newTaskTitle.trim() || saving}
            >
              {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.sheetBtnTxt}>Add Task</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TaskRow({
  task,
  colors,
  onToggle,
  onDelete,
}: {
  task: Task;
  colors: ReturnType<typeof useColors>;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  const handleDelete = () => {
    Alert.alert("Remove", `Remove "${task.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View style={[styles.taskRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={handleToggle} style={[styles.checkbox, { borderColor: task.isCompleted ? colors.primary : colors.border, backgroundColor: task.isCompleted ? colors.primary : "transparent" }]}>
          {task.isCompleted && <Feather name="check" size={12} color="#FFF" />}
        </TouchableOpacity>
        <View style={styles.taskBody}>
          <Text style={[styles.taskTitle, { color: colors.foreground, textDecorationLine: task.isCompleted ? "line-through" : "none", opacity: task.isCompleted ? 0.5 : 1 }]}>
            {task.title}
          </Text>
          {task.dueTimeLabel && !task.isCompleted && (
            <Text style={[styles.taskMeta, { color: colors.primary }]}>⏰ {task.dueTimeLabel}</Text>
          )}
          {task.notes && !task.isCompleted && (
            <Text style={[styles.taskMeta, { color: colors.mutedForeground }]}>{task.notes}</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="minus-circle" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingBottom: 60 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10 },
  listCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 1,
    marginBottom: 10,
  },
  listIcon: { fontSize: 24 },
  listCardBody: { flex: 1 },
  listCardName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  taskRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1,
    marginBottom: 8,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0,
  },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 21 },
  taskMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addTaskInline: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: "dashed",
    marginTop: 6,
  },
  addTaskInlineTxt: { fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  emptyBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  sheetContainer: { flex: 1 },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sheetBody: { padding: 20 },
  sheetLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 10, marginTop: 16 },
  sheetInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  iconOption: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  iconOptionTxt: { fontSize: 22 },
  sheetBtn: { paddingVertical: 14, borderRadius: 24, alignItems: "center" },
  sheetBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
});
