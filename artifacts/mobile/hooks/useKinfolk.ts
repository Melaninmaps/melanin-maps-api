import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { getApiBase } from "@/lib/api";
import {
  canRenderKinfolkBusinessCards,
  type KinfolkResponseMeta,
} from "@workspace/constants";

const AUTH_TOKEN_KEY = "auth_session_token";

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
  id?: string;
  name: string;
  category: string;
  description: string;
  neighborhood: string;
  mustTry: string;
  website?: string | null;
  detailUrl?: string;
  verified?: boolean;
  claimed?: boolean;
  matchReasons?: string[];
};

export type ConversationalBusinessResultView = {
  cards: Array<{
    id: string;
    title: string;
    supportingText: string;
    matchReason: string;
    verified: boolean;
    claimed: boolean;
    ownershipStatus: "documented" | "not_documented" | "not_matched" | "not_requested";
    actions: Array<{ label: "View details" | "Visit website"; url: string }>;
  }>;
  seeAll: { label: string; count: number } | null;
  followUp: string;
  external: Array<{ title: string; url: string; sourceHost: string; disclaimer: string }>;
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
  /** ISO timestamp only when the member supplied an explicit date and time. */
  dueAt?: string | null;
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

export type KinfolkClarificationStep = {
  id: string;
  question: string;
  explanation?: string;
  options: Array<{ value: string; label: string }>;
  skippable: boolean;
  persistence: "temporary";
};

/**
 * A deliberately generic disclosure that public, hashtag-matched Community
 * discussion was considered. Post text, authors, and post URLs never leave the
 * server for this optional perspective signal.
 */
export type CommunityPerspective = {
  label: "Community perspective";
  topics: string[];
  itemCount: number;
  note: string;
};

export type KinfolkCompanionMemoryOffer = {
  label: string;
  prompt: string;
};

export type InlineMemoryConsentPlan = {
  purpose: string;
  ordinary: Array<{ id: string; label: string; content: string }>;
  sensitive: Array<{ id: string; label: string; content: string }>;
};

/** A source-reviewed public visual, served only from a first-party asset path. */
export type KinfolkVisualEvidence = {
  id: string;
  assetPath: string;
  altText: string;
  sourceName: string;
  sourcePageUrl: string;
  sourceTitle: string;
  caption: string;
  subject: string;
  category: "general" | "education" | "cultural" | "clinical";
  sourcePublishedAt: string | null;
  sourceReviewedAt: string;
  rights: "public_domain" | "licensed" | "publisher_permission" | "internal_approved";
  rightsNotice: string;
  whyThisImageFits: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: TravelRecommendations | null;
  resultView?: ConversationalBusinessResultView | null;
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
  /** Quiet source attribution, returned only when a material detail lacks support. */
  sourceNote?: string | null;
  /** Brief server-authored explanation of why the linked sources apply. */
  sourceContext?: string | null;
  /** Optional, opt-in public Community discussion disclosure; never evidence. */
  communityPerspective?: CommunityPerspective | null;
  /** Set on KINFOLK_BUSY/KINFOLK_RATE_LIMITED errors — original question can be retried */
  retryable?: boolean;
  retryText?: string;
  /** City Kinfolk resolved for this response — shown as a location pill so the member
   *  knows their alias (e.g. "Philly", "nawlins") was understood correctly. */
  location?: { city: string; state: string | null; source: string } | null;
  locationSource?: string | null;
  imageUrls?: string[];
  sources?: Array<{ title: string; url: string }> | null;
  clarificationSteps?: KinfolkClarificationStep[];
  needsClarification?: boolean;
  originalQuery?: string;
  companionMemoryOffer?: KinfolkCompanionMemoryOffer | null;
  /** A separate save choice is required; raw content remains local until chosen. */
  sensitiveMemoryDraft?: { content: string; purpose: string; sessionId?: string | null } | null;
  /** Direct memory choices remain local until the member explicitly saves selected items. */
  inlineMemoryConsent?: { message: string; plan: InlineMemoryConsentPlan; sessionId?: string | null } | null;
  /** Server decision metadata; clients fail closed when cards are not authorized. */
  responseMeta?: KinfolkResponseMeta | null;
  /** Optional public visual evidence; never a member-upload or provider URL. */
  visualEvidence?: KinfolkVisualEvidence[];
  visualEvidenceNotice?: string | null;
};
type ConversationHandoffStatus = {
  state: "saved" | "resumed";
  summary: string;
};

export type SessionSummary = {
  id: string;
  title: string | null;
  destination: string | null;
  archivedAt?: string | null;
  pinnedAt?: string | null;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
};

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useKinfolk() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationHandoff, setConversationHandoff] = useState<ConversationHandoffStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  /** Client-request timing only; never a claim about server-side research. */
  const [requestStartedAt, setRequestStartedAt] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [kinfolkContinuityEnabled, setKinfolkContinuityEnabled] = useState(false);
  const [kinfolkContinuityDisclosureRequired, setKinfolkContinuityDisclosureRequired] = useState(false);
  const [kinfolkContinuityDecision, setKinfolkContinuityDecision] = useState<"accepted" | "declined" | null>(null);
  const [queriesUsed, setQueriesUsed] = useState<number | null>(null);
  const [queriesLimit, setQueriesLimit] = useState<number>(3);
  /** Holds the original question text when KINFOLK_BUSY fires — lets the UI pre-fill the input for retry. */
  const [pendingRetryText, setPendingRetryText] = useState<string | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestGenerationRef = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const interruptCurrentReply = useCallback(() => {
    const request = activeRequestRef.current;
    if (!request) return false;
    request.abort();
    activeRequestRef.current = null;
    requestGenerationRef.current += 1;
    setIsLoading(false);
    setRequestStartedAt(null);
    return true;
  }, []);

  const sendMessage = useCallback(async (
    text: string,
    opts?: {
      vibes?: string[];
      voiceMode?: "community" | "professor" | "business_manager" | "best_friend";
      /** Device-local previews, retained only in this rendered conversation. */
      imageUrls?: string[];
      /** Private server asset references for one consented visual answer. */
      imageAssetIds?: string[];
      imageVisionConsent?: boolean;
      includeCommunityPerspective?: boolean;
      publicOrigin?: string;
    },
  ): Promise<boolean> => {
    // A new member turn always wins. Abort the prior fetch without adding an
    // artificial error bubble, so Kinfolk feels interruptible like a real chat.
    activeRequestRef.current?.abort();
    const requestGeneration = ++requestGenerationRef.current;
    const controller = new AbortController();
    activeRequestRef.current = controller;
    const token = await getToken();
    const apiBase = getApiBase();
    const conversationContext = messagesRef.current.slice(-6).map((message) => ({
      role: message.role,
      content: message.content,
      resultView: message.resultView ?? null,
    }));

    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      imageUrls: opts?.imageUrls ?? [],
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setRequestStartedAt(Date.now());
    setIsLoading(true);
    let timedOut = false;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const chatTimeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 30000);
      const res = await fetch(`${apiBase}/api/kinfolk/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId,
          message: text,
          vibes: opts?.vibes ?? [],
          voiceMode: opts?.voiceMode ?? "community",
          imageAssetIds: opts?.imageAssetIds ?? [],
          imageVisionConsent: opts?.imageVisionConsent === true,
          includeCommunityPerspective: opts?.includeCommunityPerspective === true,
          publicOrigin: opts?.publicOrigin?.trim() || undefined,
          conversationContext,
          clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(chatTimeout));

      if (requestGeneration !== requestGenerationRef.current) return false;
      if (res.ok) {
        const data = (await res.json()) as {
          sessionId?: string;
          reply: string;
          recommendations?: TravelRecommendations | null;
          resultView?: ConversationalBusinessResultView | null;
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
          sourceNote?: string | null;
          sourceContext?: string | null;
          communityPerspective?: CommunityPerspective | null;
          sources?: Array<{ title: string; url: string }> | null;
          clarificationSteps?: KinfolkClarificationStep[] | null;
          needsClarification?: boolean;
          originalQuery?: string;
          location?: { city: string; state: string | null; source: string } | null;
          locationSource?: string | null;
          companionMemoryOffer?: KinfolkCompanionMemoryOffer | null;
          responseMeta?: KinfolkResponseMeta | null;
          visualEvidence?: KinfolkVisualEvidence[];
          visualEvidenceNotice?: string | null;
          conversationHandoff?: ConversationHandoffStatus | null;
          sensitiveMemoryConfirmation?: {
            confirmationRequired?: boolean;
            purpose?: string;
          } | null;
          memoryConsentPlan?: InlineMemoryConsentPlan | null;
        };

        if (data.sessionId) setSessionId(data.sessionId);
        setConversationHandoff(data.conversationHandoff ?? null);
        const inlineMemoryConsent: ChatMessage["inlineMemoryConsent"] = data.memoryConsentPlan
          ? { message: text, plan: data.memoryConsentPlan, sessionId: data.sessionId ?? sessionId }
          : null;
        let sensitiveMemoryDraft: ChatMessage["sensitiveMemoryDraft"] =
          data.sensitiveMemoryConfirmation?.confirmationRequired === true
            ? {
                content: text,
                purpose: data.sensitiveMemoryConfirmation.purpose ?? "ongoing_context",
                sessionId: data.sessionId ?? sessionId,
              }
            : null;
        if (typeof data.queriesUsed === "number") setQueriesUsed(data.queriesUsed);
        if (typeof data.queriesLimit === "number") setQueriesLimit(data.queriesLimit);

        const responseMeta = data.responseMeta ?? null;
        const businessCardsAllowed = canRenderKinfolkBusinessCards(responseMeta);
        const aiMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: data.reply,
          recommendations: businessCardsAllowed ? data.recommendations ?? null : null,
          resultView: businessCardsAllowed ? data.resultView ?? null : null,
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
          sourceNote: data.sourceNote ?? null,
          sourceContext: data.sourceContext ?? null,
          communityPerspective: data.communityPerspective ?? null,
          sources: data.sources ?? null,
          clarificationSteps: data.clarificationSteps ?? undefined,
          needsClarification: data.needsClarification === true,
          originalQuery: data.originalQuery ?? text,
          location: data.location ?? null,
          locationSource: data.locationSource ?? null,
          companionMemoryOffer: data.companionMemoryOffer ?? null,
          sensitiveMemoryDraft,
          inlineMemoryConsent,
          responseMeta,
          visualEvidence: data.visualEvidence ?? [],
          visualEvidenceNotice: data.visualEvidenceNotice ?? null,
        };
        setPendingRetryText(null); // clear retry on success
        setMessages((prev) => [...prev, aiMsg]);
        return true;
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
        return false;
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
        return false;
      } else {
        const aiMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: "My signal dropped for a sec — try again in a moment.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        return false;
      }
    } catch (err: unknown) {
      if (requestGeneration !== requestGenerationRef.current) return false;
      if (err instanceof Error && err.name === "AbortError" && !timedOut) return false;
      const isTimeout = timedOut;
      const aiMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: isTimeout
          ? "KinfolkAI didn't respond in time. Make sure you're connected, then tap Send to try your message again."
          : "Something went sideways on my end. Tap Send to try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      return false;
    } finally {
      if (requestGeneration === requestGenerationRef.current) {
        activeRequestRef.current = null;
        setIsLoading(false);
        setRequestStartedAt(null);
      }
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

  const loadSessions = useCallback(async (view: "active" | "archived" = "active") => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/kinfolk/sessions?view=${view}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { sessions: SessionSummary[] };
        setSessions(data.sessions);
      }
    } catch {}
  }, []);

  const loadKinfolkContinuity = useCallback(async () => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/kinfolk/continuity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json() as {
        enabled?: boolean;
        disclosureRequired?: boolean;
        decision?: "accepted" | "declined" | null;
      };
      setKinfolkContinuityEnabled(data.enabled === true);
      setKinfolkContinuityDisclosureRequired(data.disclosureRequired === true);
      setKinfolkContinuityDecision(data.decision ?? null);
    } catch {}
  }, []);

  const setKinfolkContinuity = useCallback(async (
    enabled: boolean,
    decision?: "accepted" | "declined",
  ): Promise<boolean> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return false;
    try {
      const res = await fetch(`${apiBase}/api/kinfolk/continuity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled, ...(decision ? { decision } : {}) }),
      });
      if (!res.ok) return false;
      const data = await res.json() as {
        enabled?: boolean;
        disclosureRequired?: boolean;
        decision?: "accepted" | "declined" | null;
      };
      setKinfolkContinuityEnabled(data.enabled === true);
      setKinfolkContinuityDisclosureRequired(data.disclosureRequired === true);
      setKinfolkContinuityDecision(data.decision ?? null);
      setSessions([]);
      if (data.enabled === true) await loadSessions();
      return true;
    } catch { return false; }
  }, [loadSessions]);

  const organizeSession = useCallback(async (
    id: string,
    action: "archive" | "restore" | "pin" | "unpin",
  ): Promise<boolean> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return false;
    try {
      const res = await fetch(`${apiBase}/api/kinfolk/sessions/${encodeURIComponent(id)}/organization`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await loadSessions();
      return res.ok;
    } catch { return false; }
  }, [loadSessions]);

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
          session: { id: string; messages: { role: string; content: string; recommendations?: unknown; resultView?: unknown; followUpSuggestions?: string[]; companionMemoryOffer?: KinfolkCompanionMemoryOffer | null; timestamp: string }[] };
          resumePreview?: ConversationHandoffStatus | null;
        };
        setSessionId(id);
        setConversationHandoff(data.resumePreview ?? null);
        setMessages(
          data.session.messages.map((m) => ({
            id: makeId(),
            role: m.role as "user" | "assistant",
            content: m.content,
            recommendations: (m.recommendations as TravelRecommendations | null) ?? null,
            resultView: (m.resultView as ConversationalBusinessResultView | null) ?? null,
            followUpSuggestions: m.followUpSuggestions ?? [],
            companionMemoryOffer: m.companionMemoryOffer ?? null,
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
    setConversationHandoff(null);
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
          body: JSON.stringify({ title: t.title, notes: t.notes, dueAt: t.dueAt, dueTimeLabel: t.dueTimeLabel, category: t.category ?? "other" }),
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

  const dismissSensitiveMemoryDraft = useCallback((messageId: string) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, sensitiveMemoryDraft: null } : m));
  }, []);

  const dismissInlineMemoryConsent = useCallback((messageId: string) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, inlineMemoryConsent: null } : m));
  }, []);

  const clearPendingRetryText = useCallback(() => setPendingRetryText(null), []);

  return {
    messages,
    sessionId,
    conversationHandoff,
    isLoading,
    requestStartedAt,
    sessions,
    kinfolkContinuityEnabled,
    kinfolkContinuityDisclosureRequired,
    kinfolkContinuityDecision,
    queriesUsed,
    queriesLimit,
    /** When KINFOLK_BUSY/KINFOLK_RATE_LIMITED fires, holds the original question for retry. */
    pendingRetryText,
    clearPendingRetryText,
    sendMessage,
    interruptCurrentReply,
    submitFeedback,
    loadSessions,
    loadKinfolkContinuity,
    setKinfolkContinuity,
    organizeSession,
    loadSession,
    startNewSession,
    confirmTaskAction,
    dismissTaskAction,
    dismissSensitiveMemoryDraft,
    dismissInlineMemoryConsent,
  };
}
