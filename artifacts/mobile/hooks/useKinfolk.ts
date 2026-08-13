import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

export type HeritageSitePin = {
  id: string;
  name: string;
  siteType: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

export type TravelBusiness = {
  name: string;
  category: string;
  description: string;
  neighborhood: string;
  mustTry: string;
};

export type TravelNeighborhood = {
  name: string;
  vibe: string;
  highlights: string[];
  safetyNote: string;
};

export type TravelEvent = {
  name: string;
  type: string;
  description: string;
  timing: string;
};

export type TravelRecommendations = {
  destination: string;
  summary: string;
  businesses: TravelBusiness[];
  neighborhoods: TravelNeighborhood[];
  events: TravelEvent[];
  safetyTips: string[];
  localInsights: string[];
};

export type SmartPromotion = {
  headline: string;
  body: string;
  businessCategory: string;
  cta: string;
  ctaQuery: string;
  triggerReason: string;
};

export type TaskActionTask = {
  title: string;
  notes?: string | null;
  dueTimeLabel?: string | null;
  category?: string;
};

export type TaskAction = {
  type: "create_list" | "create_task" | "add_tasks";
  list?: { name: string; icon?: string };
  tasks: TaskActionTask[];
};

export type LibraryAction = {
  type: "open_library_node";
  topicId: string;
  focus: "evidence";
  label: string;
};

export type NearbyNudge = {
  /** One-sentence conversational suggestion — e.g. "There's a Black-owned bookstore nearby — want to check it out?" */
  text: string;
  /** The exact message to send when the user taps — continues the conversation naturally */
  quickReply: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: TravelRecommendations | null;
  followUpSuggestions?: string[];
  smartPromotion?: SmartPromotion | null;
  taskAction?: TaskAction | null;
  taskActionDone?: boolean;
  libraryAction?: LibraryAction | null;
  heritageSites?: HeritageSitePin[];
  nearbyNudge?: NearbyNudge | null;
  timestamp: Date;
  feedback?: Record<string, "like" | "dislike">;
  limitReached?: boolean;
  intentClass?: string | null;
  provenanceNote?: string | null;
  /** Set on KINFOLK_BUSY/KINFOLK_RATE_LIMITED errors — original question can be retried */
  retryable?: boolean;
  retryText?: string;
};

export type SessionSummary = {
  id: string;
  title: string | null;
  destination: string | null;
  createdAt: string;
  updatedAt: string;
};

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useKinfolk() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [queriesUsed, setQueriesUsed] = useState<number | null>(null);
  const [queriesLimit, setQueriesLimit] = useState<number>(3);
  /** Holds the original question text when KINFOLK_BUSY fires — lets the UI pre-fill the input for retry. */
  const [pendingRetryText, setPendingRetryText] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    text: string,
    opts?: { vibes?: string[]; voiceMode?: string },
  ): Promise<void> => {
    const token = await getToken();
    const apiBase = getApiBase();

    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const controller = new AbortController();
      const chatTimeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${apiBase}/api/kinfolk/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId,
          message: text,
          vibes: opts?.vibes ?? [],
          voiceMode: opts?.voiceMode ?? "community",
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(chatTimeout));

      if (res.ok) {
        const data = (await res.json()) as {
          sessionId: string;
          reply: string;
          recommendations?: TravelRecommendations | null;
          followUpSuggestions?: string[];
          smartPromotion?: SmartPromotion | null;
          taskAction?: TaskAction | null;
          libraryAction?: LibraryAction | null;
          heritageSites?: HeritageSitePin[];
          nearbyNudge?: NearbyNudge | null;
          queriesUsed?: number;
          queriesLimit?: number;
          intentClass?: string | null;
          provenanceNote?: string | null;
        };

        setSessionId(data.sessionId);
        if (typeof data.queriesUsed === "number") setQueriesUsed(data.queriesUsed);
        if (typeof data.queriesLimit === "number") setQueriesLimit(data.queriesLimit);

        const aiMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: data.reply,
          recommendations: data.recommendations ?? null,
          followUpSuggestions: data.followUpSuggestions ?? [],
          smartPromotion: data.smartPromotion ?? null,
          taskAction: data.taskAction ?? null,
          libraryAction: data.libraryAction ?? null,
          heritageSites: data.heritageSites ?? [],
          nearbyNudge: data.nearbyNudge ?? null,
          timestamp: new Date(),
          feedback: {},
          intentClass: data.intentClass ?? null,
          provenanceNote: data.provenanceNote ?? null,
        };
        setPendingRetryText(null); // clear retry on success
        setMessages((prev) => [...prev, aiMsg]);
      } else if (res.status === 503) {
        // KINFOLK_BUSY or KINFOLK_RATE_LIMITED — temporary, user question preserved for retry
        const errData = await res.json().catch(() => ({})) as { code?: string };
        const isBusy = errData.code === "KINFOLK_BUSY" || errData.code === "KINFOLK_RATE_LIMITED";
        const aiMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: isBusy
            ? "Kinfolk is helping a few people right now — tap Send to try again in about 20 seconds. Your question is saved below."
            : "Kinfolk is temporarily unavailable. Please try again in a moment.",
          timestamp: new Date(),
          retryable: isBusy,
          retryText: isBusy ? text : undefined,
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (isBusy) setPendingRetryText(text);
      } else if (res.status === 429) {
        const errData = await res.json().catch(() => ({})) as { code?: string; used?: number; limit?: number };
        const isLimit = errData.code === "KINFOLK_LIMIT_REACHED";
        const aiMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: isLimit
            ? `You've used all ${errData.limit ?? 3} of your free KinfolkAI queries for this month. Upgrade to Navigator or Trailblazer for unlimited conversations — I'll be here when you're ready. ✨`
            : "Too many requests — give it a moment and try again.",
          timestamp: new Date(),
          limitReached: isLimit,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const aiMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: "My signal dropped for a sec — try again in a moment.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      const aiMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: isTimeout
          ? "KinfolkAI didn't respond in time. Make sure you're connected, then tap Send to try your message again."
          : "Something went sideways on my end. Tap Send to try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const submitFeedback = useCallback(async (
    messageId: string,
    businessName: string,
    category: string,
    city: string,
    reaction: "like" | "dislike",
  ): Promise<void> => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, feedback: { ...(m.feedback ?? {}), [businessName]: reaction } }
          : m,
      ),
    );

    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;

    try {
      await fetch(`${apiBase}/api/kinfolk/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, businessName, category, city, reaction }),
      });
    } catch {}
  }, [sessionId]);

  const loadSessions = useCallback(async () => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/kinfolk/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { sessions: SessionSummary[] };
        setSessions(data.sessions);
      }
    } catch {}
  }, []);

  const loadSession = useCallback(async (id: string) => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/kinfolk/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          session: { id: string; messages: Array<{ role: string; content: string; recommendations?: unknown; followUpSuggestions?: string[]; timestamp: string }> };
        };
        setSessionId(id);
        setMessages(
          data.session.messages.map((m) => ({
            id: makeId(),
            role: m.role as "user" | "assistant",
            content: m.content,
            recommendations: (m.recommendations as TravelRecommendations | null) ?? null,
            followUpSuggestions: m.followUpSuggestions ?? [],
            timestamp: new Date(m.timestamp),
            feedback: {},
          })),
        );
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  const startNewSession = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  const confirmTaskAction = useCallback(async (messageId: string, action: TaskAction): Promise<boolean> => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, taskActionDone: true } : m));
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return false;
    try {
      if (action.type === "create_list" && action.list) {
        const listRes = await fetch(`${apiBase}/api/kinfolk/lists`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: action.list.name, icon: action.list.icon ?? "📋" }),
        });
        if (listRes.ok) {
          const { list } = await listRes.json() as { list: { id: string } };
          await fetch(`${apiBase}/api/kinfolk/tasks/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ tasks: action.tasks, listId: list.id }),
          });
        }
      } else if (action.type === "create_task" && action.tasks.length > 0) {
        const t = action.tasks[0]!;
        await fetch(`${apiBase}/api/kinfolk/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: t.title, notes: t.notes, dueTimeLabel: t.dueTimeLabel, category: t.category ?? "other" }),
        });
      } else if (action.type === "add_tasks") {
        await fetch(`${apiBase}/api/kinfolk/tasks/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tasks: action.tasks }),
        });
      }
      return true;
    } catch { return false; }
  }, []);

  const dismissTaskAction = useCallback((messageId: string) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, taskActionDone: true } : m));
  }, []);

  const clearPendingRetryText = useCallback(() => setPendingRetryText(null), []);

  return {
    messages,
    sessionId,
    isLoading,
    sessions,
    queriesUsed,
    queriesLimit,
    /** When KINFOLK_BUSY/KINFOLK_RATE_LIMITED fires, holds the original question for retry. */
    pendingRetryText,
    clearPendingRetryText,
    sendMessage,
    submitFeedback,
    loadSessions,
    loadSession,
    startNewSession,
    confirmTaskAction,
    dismissTaskAction,
  };
}
