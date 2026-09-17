import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type Conversation = {
  id: number;
  title: string;
  type: "dm" | "business" | "ai";
  participantIds: string[];
  requestStatus: "pending" | "accepted" | null;
  requestedBy: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
};
type Message = { id: number; conversationId: number; senderId: string | null; content: string; createdAt: string | null };

function conversationIdFromSearch(search: string): number | null {
  const raw = new URLSearchParams(search).get("conversation");
  const id = raw ? Number(raw) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function MessagesPage() {
  const rawSearch = useSearch();
  const [, navigate] = useLocation();
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const selectedId = conversationIdFromSearch(rawSearch);
  const selected = useMemo(() => conversations.find((conversation) => conversation.id === selectedId) ?? null, [conversations, selectedId]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`${BASE}api/conversations`);
      if (!response.ok) throw new Error("Unable to load messages");
      const payload = await response.json() as { conversations?: Conversation[] };
      setConversations(payload.conversations ?? []);
    } catch {
      toast({ title: "Messages unavailable", description: "Could not load conversations. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadMessages = useCallback(async (conversationId: number) => {
    setMessagesLoading(true);
    try {
      const response = await authenticatedFetch(`${BASE}api/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error("Unable to load messages");
      const payload = await response.json() as { messages?: Message[] };
      setMessages(payload.messages ?? []);
    } catch {
      setMessages([]);
      toast({ title: "Conversation unavailable", description: "This conversation could not be opened.", variant: "destructive" });
    } finally {
      setMessagesLoading(false);
    }
  }, [toast]);

  useEffect(() => { void loadConversations(); }, [loadConversations]);
  useEffect(() => {
    if (selectedId) void loadMessages(selectedId);
    else setMessages([]);
  }, [selectedId, loadMessages]);

  function openConversation(id: number): void {
    navigate(`/messages?conversation=${encodeURIComponent(String(id))}`);
  }

  async function send(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      const response = await authenticatedFetch(`${BASE}api/conversations/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft.trim() }),
      });
      const payload = await response.json() as { message?: Message; error?: string };
      if (!response.ok || !payload.message) {
        toast({ title: "Message not sent", description: payload.error ?? "Please try again.", variant: "destructive" });
        return;
      }
      setMessages((current) => [...current, payload.message!]);
      setConversations((current) => current.map((conversation) => conversation.id === selected.id
        ? { ...conversation, lastMessageAt: payload.message!.createdAt, lastMessagePreview: payload.message!.content }
        : conversation));
      setDraft("");
    } catch {
      toast({ title: "Message not sent", description: "Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  async function respondToRequest(action: "accept" | "decline"): Promise<void> {
    if (!selected) return;
    setRequestLoading(true);
    try {
      const response = await authenticatedFetch(`${BASE}api/conversations/${selected.id}/${action}`, { method: "POST" });
      const payload = await response.json() as { conversation?: Conversation; error?: string };
      if (!response.ok) {
        toast({ title: "Could not update request", description: payload.error ?? "Please try again.", variant: "destructive" });
        return;
      }
      if (action === "decline") {
        setConversations((current) => current.filter((conversation) => conversation.id !== selected.id));
        navigate("/messages");
      } else if (payload.conversation) {
        setConversations((current) => current.map((conversation) => conversation.id === selected.id ? payload.conversation! : conversation));
      }
    } catch {
      toast({ title: "Could not update request", description: "Please try again.", variant: "destructive" });
    } finally {
      setRequestLoading(false);
    }
  }

  const isIncomingPending = selected?.requestStatus === "pending" && selected.requestedBy !== auth?.user?.id;
  const isOutgoingPending = selected?.requestStatus === "pending" && selected.requestedBy === auth?.user?.id;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8D5C17]">Community</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#2B1507]">Messages</h1>
        </div>
        <Link href="/community" className="text-sm font-semibold text-[#8D5C17] hover:underline">Community feed</Link>
      </div>
      <section className="grid min-h-[560px] overflow-hidden rounded-3xl border border-[#3A1F0E]/10 bg-white shadow-sm md:grid-cols-[300px_1fr]">
        <aside className="border-b border-[#3A1F0E]/10 md:border-b-0 md:border-r">
          <div className="border-b border-[#3A1F0E]/10 px-5 py-4 text-sm font-semibold text-[#2B1507]">Your conversations</div>
          {loading ? <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-[#CA922B]" /></div> : conversations.length ? (
            <div className="max-h-[480px] overflow-y-auto">{conversations.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => openConversation(conversation.id)} className={`block w-full border-b border-[#3A1F0E]/7 px-5 py-4 text-left hover:bg-[#FFF9F0] ${selected?.id === conversation.id ? "bg-[#FFF8EC]" : ""}`}>
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-[#2B1507]">{conversation.title}</span>{conversation.requestStatus === "pending" ? <span className="rounded-full bg-[#CA922B]/10 px-2 py-0.5 text-[10px] font-bold text-[#8D5C17]">Request</span> : null}</div>
                <p className="mt-1 truncate text-xs text-[#3A1F0E]/55">{conversation.lastMessagePreview || "No messages yet"}</p>
              </button>
            ))}</div>
          ) : <p className="p-6 text-sm leading-6 text-[#3A1F0E]/55">Start a message from a member profile when they allow direct messages.</p>}
        </aside>
        <section className="flex min-h-[460px] flex-col">
          {!selected ? <div className="m-auto max-w-sm px-6 text-center"><MessageCircle className="mx-auto h-10 w-10 text-[#CA922B]" /><h2 className="mt-4 font-serif text-xl font-bold text-[#2B1507]">Choose a conversation</h2><p className="mt-2 text-sm leading-6 text-[#3A1F0E]/60">Messages are available only to participants and always respect blocks and each member’s direct-message setting.</p></div> : (
            <>
              <header className="border-b border-[#3A1F0E]/10 px-5 py-4"><h2 className="font-semibold text-[#2B1507]">{selected.title}</h2></header>
              {isIncomingPending ? <div className="m-4 rounded-xl border border-[#CA922B]/30 bg-[#FFF8EC] p-4"><p className="text-sm leading-6 text-[#3A1F0E]/75">Accept this request before the sender can continue the conversation.</p><div className="mt-3 flex gap-2"><button type="button" disabled={requestLoading} onClick={() => void respondToRequest("accept")} className="rounded-lg bg-[#2B1507] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">Accept</button><button type="button" disabled={requestLoading} onClick={() => void respondToRequest("decline")} className="rounded-lg border border-[#3A1F0E]/20 px-3 py-2 text-sm font-semibold text-[#3A1F0E] disabled:opacity-60">Decline</button></div></div> : null}
              {isOutgoingPending ? <p className="mx-4 mt-4 rounded-xl bg-[#FFF8EC] p-3 text-sm text-[#3A1F0E]/70">Your message request is waiting for this member’s approval.</p> : null}
              <div className="flex-1 space-y-3 overflow-y-auto p-5">{messagesLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#CA922B]" /> : messages.length ? messages.map((message) => <div key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.senderId === auth?.user?.id ? "ml-auto bg-[#2B1507] text-white" : "bg-[#FFF8EC] text-[#2B1507]"}`}>{message.content}</div>) : <p className="text-center text-sm text-[#3A1F0E]/50">No messages yet.</p>}</div>
              <form className="border-t border-[#3A1F0E]/10 p-4" onSubmit={(event) => void send(event)}><div className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={isIncomingPending || sending} placeholder={isOutgoingPending ? "Waiting for approval" : "Write a message"} className="min-w-0 flex-1 rounded-xl border border-[#3A1F0E]/15 px-3 py-2.5 text-sm outline-none focus:border-[#CA922B] disabled:bg-[#F4EFE7]" /><button type="submit" disabled={!draft.trim() || isIncomingPending || sending} className="inline-flex items-center justify-center rounded-xl bg-[#CA922B] px-3 text-white disabled:opacity-45" aria-label="Send message">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div></form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
