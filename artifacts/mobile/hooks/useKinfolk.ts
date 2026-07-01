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

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: TravelRecommendations | null;
  followUpSuggestions?: string[];
  smartPromotion?: SmartPromotion | null;
  timestamp: Date;
  feedback?: Record<string, "like" | "dislike">;
  limitReached?: boolean;
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

      const res = await fetch(`${apiBase}/api/kinfolk/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId,
          message: text,
          vibes: opts?.vibes ?? [],
          voiceMode: opts?.voiceMode ?? "community",
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          sessionId: string;
          reply: string;
          recommendations?: TravelRecommendations | null;
          followUpSuggestions?: string[];
          smartPromotion?: SmartPromotion | null;
        };

        setSessionId(data.sessionId);

        const aiMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: data.reply,
          recommendations: data.recommendations ?? null,
          followUpSuggestions: data.followUpSuggestions ?? [],
          smartPromotion: data.smartPromotion ?? null,
          timestamp: new Date(),
          feedback: {},
        };
        setMessages((prev) => [...prev, aiMsg]);
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
    } catch {
      const aiMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: "Something went sideways on my end. Give it another shot.",
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

  return {
    messages,
    sessionId,
    isLoading,
    sessions,
    sendMessage,
    submitFeedback,
    loadSessions,
    loadSession,
    startNewSession,
  };
}
