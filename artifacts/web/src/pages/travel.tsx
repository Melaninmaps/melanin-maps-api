import { useEffect, useRef, useState, useCallback } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Sparkles, Send, Plus, MapPin, ChevronRight, ThumbsUp, ThumbsDown, Clock, Compass, ShieldCheck, Lightbulb, Loader2, Lock, MessageSquare } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Business { name: string; category: string; description: string; neighborhood: string; mustTry: string }
interface Neighborhood { name: string; vibe: string; highlights: string[]; safetyNote: string }
interface Event { name: string; type: string; description: string; timing: string }
interface Recommendations {
  destination: string; summary: string;
  businesses: Business[]; neighborhoods: Neighborhood[];
  events: Event[]; safetyTips: string[]; localInsights: string[];
}
interface Message {
  id: string; role: "user" | "assistant";
  content: string; recommendations?: Recommendations | null;
  followUpSuggestions?: string[]; timestamp: string;
}
interface Session { id: string; title: string; destination?: string; createdAt: string }

const WELCOME_CHIPS = [
  "Where's good to eat in Atlanta?",
  "Best Black-owned spots in Houston",
  "What's the vibe in New Orleans?",
  "Hidden gems in DC",
  "Family-friendly spots in Chicago",
  "Nightlife in Miami?",
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function BusinessCard({ biz, onFeedback, feedback }: {
  biz: Business;
  onFeedback: (name: string, cat: string, reaction: "like" | "dislike") => void;
  feedback: Record<string, "like" | "dislike">;
}) {
  const reaction = feedback[biz.name];
  return (
    <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 overflow-hidden shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <div className="w-1 self-stretch bg-[#CA922B] rounded-full shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="font-bold text-[#3A1F0E] text-sm leading-tight">{biz.name}</span>
            <span className="bg-[#2B1507] text-[#F5EBD8] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">{biz.category}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#3A1F0E]/40 uppercase tracking-wider font-bold mb-2">
            <MapPin size={9} />{biz.neighborhood}
          </div>
          <p className="text-xs text-[#3A1F0E]/70 leading-relaxed mb-3">{biz.description}</p>
          <div className="bg-[#FAF6EF] rounded-xl p-2.5 text-xs text-[#3A1F0E]/80 flex items-start gap-1.5 mb-3">
            <Sparkles size={12} className="text-[#CA922B] shrink-0 mt-0.5" />
            <span><strong>Try:</strong> {biz.mustTry}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onFeedback(biz.name, biz.category, "like")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${reaction === "like" ? "bg-green-100 text-green-700 border border-green-200" : "bg-[#FAF6EF] text-[#3A1F0E]/50 hover:text-green-600 hover:bg-green-50"}`}
            >
              <ThumbsUp size={11} /> Love it
            </button>
            <button
              onClick={() => onFeedback(biz.name, biz.category, "dislike")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${reaction === "dislike" ? "bg-red-100 text-red-700 border border-red-200" : "bg-[#FAF6EF] text-[#3A1F0E]/50 hover:text-red-600 hover:bg-red-50"}`}
            >
              <ThumbsDown size={11} /> Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationCards({ recs, onFeedback, feedback }: {
  recs: Recommendations;
  onFeedback: (name: string, cat: string, reaction: "like" | "dislike") => void;
  feedback: Record<string, "like" | "dislike">;
}) {
  return (
    <div className="mt-3 space-y-4">
      {/* Destination header */}
      <div className="bg-[#2B1507] rounded-2xl p-4 text-white">
        <div className="text-xs font-bold uppercase tracking-widest text-[#CA922B] mb-1">Your Guide to</div>
        <div className="text-xl font-serif font-bold text-white mb-2">{recs.destination}</div>
        <p className="text-[#F5EBD8]/80 text-sm leading-relaxed">{recs.summary}</p>
      </div>

      {/* Businesses */}
      {recs.businesses?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-[#CA922B]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Must-Visit Spots</span>
          </div>
          <div className="grid gap-2">
            {recs.businesses.map((b, i) => (
              <BusinessCard key={i} biz={b} onFeedback={onFeedback} feedback={feedback} />
            ))}
          </div>
        </div>
      )}

      {/* Neighborhoods */}
      {recs.neighborhoods?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Compass size={14} className="text-[#CA922B]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Neighborhoods</span>
          </div>
          <div className="grid gap-2">
            {recs.neighborhoods.map((n, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-bold text-[#3A1F0E] text-sm">{n.name}</span>
                  <span className="bg-[#FAF6EF] text-[#CA922B] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#CA922B]/20">{n.vibe}</span>
                </div>
                <p className="text-xs text-[#3A1F0E]/60 mb-2"><strong className="text-[#3A1F0E]/40 uppercase text-[9px] tracking-wider">Highlights:</strong> {n.highlights.join(", ")}</p>
                <div className="bg-[#FAF6EF] rounded-xl p-2.5 text-xs text-[#3A1F0E]/70 italic border-l-2 border-[#CA922B]">"{n.safetyNote}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {recs.events?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[#CA922B]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Events & Happenings</span>
          </div>
          <div className="grid gap-2">
            {recs.events.map((e, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-bold text-[#3A1F0E] text-sm">{e.name}</span>
                  <span className="text-[10px] text-[#CA922B] font-bold">{e.timing}</span>
                </div>
                <div className="text-[10px] text-[#3A1F0E]/40 uppercase tracking-wider font-bold mb-1">{e.type}</div>
                <p className="text-xs text-[#3A1F0E]/70 leading-relaxed">{e.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety tips + Local insights */}
      {(recs.safetyTips?.length > 0 || recs.localInsights?.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {recs.safetyTips?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={14} className="text-[#CA922B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Safety Tips</span>
              </div>
              <ul className="space-y-2">
                {recs.safetyTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#3A1F0E]/70 leading-relaxed">
                    <div className="w-1 h-1 rounded-full bg-[#CA922B] mt-1.5 shrink-0" />{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recs.localInsights?.length > 0 && (
            <div className="bg-[#2B1507] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={14} className="text-[#CA922B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#F5EBD8]/60">Local Insights</span>
              </div>
              <ul className="space-y-2">
                {recs.localInsights.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#F5EBD8]/70 leading-relaxed">
                    <div className="w-1 h-1 rounded-full bg-[#CA922B] mt-1.5 shrink-0" />{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Travel() {
  const { data: authData, isLoading: authLoading } = useGetCurrentAuthUser();
  const isLoggedIn = !authLoading && !!authData?.user;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "like" | "dislike">>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load session list
  const loadSessions = useCallback(async () => {
    if (!isLoggedIn) return;
    setSessionsLoading(true);
    try {
      const r = await fetch(`${BASE}api/kinfolk/sessions`, { credentials: "include" });
      if (r.ok) { const d = await r.json() as { sessions: Session[] }; setSessions(d.sessions); }
    } finally { setSessionsLoading(false); }
  }, [isLoggedIn]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Scroll to bottom on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const r = await fetch(`${BASE}api/kinfolk/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId, message: trimmed, neighborVoice: true }),
      });
      const data = await r.json() as { sessionId?: string; reply: string; recommendations?: Recommendations | null; followUpSuggestions?: string[] };
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        loadSessions();
      }
      const aiMsg: Message = {
        id: crypto.randomUUID(), role: "assistant",
        content: data.reply, recommendations: data.recommendations ?? null,
        followUpSuggestions: data.followUpSuggestions ?? [], timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Something went sideways on my end — try again in a sec.", timestamp: new Date().toISOString() }]);
    } finally { setSending(false); }
  }, [sending, sessionId, loadSessions]);

  const loadSession = useCallback(async (id: string) => {
    try {
      const r = await fetch(`${BASE}api/kinfolk/sessions/${id}`, { credentials: "include" });
      if (!r.ok) return;
      const d = await r.json() as { session: { id: string; messages: Message[] } };
      setSessionId(d.session.id);
      setMessages(d.session.messages ?? []);
    } catch { /* ignore */ }
  }, []);

  const newChat = () => { setSessionId(undefined); setMessages([]); setInput(""); };

  const handleFeedback = async (name: string, cat: string, reaction: "like" | "dislike") => {
    setFeedback(prev => ({ ...prev, [name]: reaction }));
    if (!isLoggedIn) return;
    await fetch(`${BASE}api/kinfolk/feedback`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, businessName: name, category: cat, reaction }),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[#FAF6EF] overflow-hidden">
      {/* Header */}
      <div className="bg-[#2B1507] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#CA922B]/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#CA922B]" />
          </div>
          <div>
            <div className="text-white font-serif font-bold text-base leading-tight">KinfolkAI™</div>
            <div className="text-[#F5EBD8]/50 text-[10px] uppercase tracking-widest">Travel Companion</div>
          </div>
        </div>
        {isLoggedIn && (
          <button onClick={newChat} className="flex items-center gap-1.5 text-xs font-bold text-[#F5EBD8]/70 hover:text-[#CA922B] transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#CA922B]/30">
            <Plus size={13} /> New Chat
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — session history (desktop only) */}
        {isLoggedIn && (
          <div className="hidden md:flex flex-col w-56 bg-white border-r border-[#3A1F0E]/8 overflow-y-auto shrink-0">
            <div className="px-3 py-3 border-b border-[#3A1F0E]/8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40">Past Trips</span>
            </div>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={16} className="text-[#CA922B] animate-spin" /></div>
            ) : sessions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[#3A1F0E]/30">No trips yet — start a conversation!</div>
            ) : (
              <div className="py-1">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-[#FAF6EF] transition-colors border-b border-[#3A1F0E]/4 ${sessionId === s.id ? "bg-[#FAF6EF] border-l-2 border-l-[#CA922B]" : ""}`}
                  >
                    <div className="text-xs font-semibold text-[#3A1F0E] truncate leading-tight">{s.title}</div>
                    {s.destination && <div className="text-[10px] text-[#CA922B] font-medium mt-0.5">{s.destination}</div>}
                    <div className="text-[10px] text-[#3A1F0E]/30 mt-0.5">{new Date(s.createdAt).toLocaleDateString()}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Not logged in gate */}
          {!authLoading && !isLoggedIn && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl border border-[#3A1F0E]/8 shadow-sm max-w-md w-full text-center p-10">
                <div className="w-14 h-14 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center mx-auto mb-5">
                  <Lock className="w-6 h-6 text-[#CA922B]" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-3">Sign in to chat with KinfolkAI</h2>
                <p className="text-[#3A1F0E]/60 mb-8 text-sm leading-relaxed">
                  KinfolkAI builds personalized travel guides with Minority-owned spots, cultural gems, and trusted safety intel — tailored just for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href={`${BASE}login`}>
                    <button className="bg-[#CA922B] hover:bg-[#B38024] text-white px-8 py-2.5 rounded-full font-semibold text-sm transition-colors">
                      Sign In to Continue
                    </button>
                  </Link>
                  <Link href={`${BASE}`}>
                    <button className="border border-[#2B1507]/20 text-[#3A1F0E] hover:border-[#CA922B] hover:text-[#CA922B] px-8 py-2.5 rounded-full text-sm transition-colors">
                      Explore First
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {isLoggedIn && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {isEmpty && (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center mb-5">
                      <Sparkles className="w-7 h-7 text-[#CA922B]" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-2">Where are you headed?</h2>
                    <p className="text-[#3A1F0E]/50 text-sm mb-8 max-w-sm">
                      Ask me about Black-owned businesses, neighborhoods, safety, events, and local culture — anywhere in the country.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                      {WELCOME_CHIPS.map(chip => (
                        <button
                          key={chip}
                          onClick={() => send(chip)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#3A1F0E]/10 rounded-full text-sm text-[#3A1F0E]/70 hover:border-[#CA922B]/40 hover:text-[#CA922B] transition-colors shadow-sm"
                        >
                          <ChevronRight size={12} className="text-[#CA922B]" />{chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-[#2B1507] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                        <Sparkles size={13} className="text-[#CA922B]" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === "user" ? "max-w-[70%]" : "max-w-[85%]"}`}>
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#2B1507] text-[#F5EBD8] rounded-br-sm"
                          : "bg-white border border-[#3A1F0E]/8 text-[#3A1F0E] rounded-bl-sm shadow-sm"
                      }`}>
                        {msg.content}
                      </div>

                      {msg.recommendations && (
                        <RecommendationCards recs={msg.recommendations} onFeedback={handleFeedback} feedback={feedback} />
                      )}

                      {msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {msg.followUpSuggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => send(s)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#3A1F0E]/10 rounded-full text-xs text-[#3A1F0E]/60 hover:border-[#CA922B]/40 hover:text-[#CA922B] transition-colors shadow-sm"
                            >
                              <MessageSquare size={10} className="text-[#CA922B]" />{s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-lg bg-[#2B1507] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <Sparkles size={13} className="text-[#CA922B]" />
                    </div>
                    <div className="bg-white border border-[#3A1F0E]/8 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                      <Loader2 size={14} className="text-[#CA922B] animate-spin" />
                      <span className="text-sm text-[#3A1F0E]/50 italic">KinfolkAI is thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="border-t border-[#3A1F0E]/8 bg-white px-4 py-3 shrink-0">
                <div className="flex items-end gap-3 max-w-3xl mx-auto">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about traveling while Black…"
                    rows={1}
                    className="flex-1 resize-none bg-[#FAF6EF] border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/50 transition-colors"
                    style={{ maxHeight: "120px", overflowY: "auto" }}
                    onInput={e => {
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = Math.min(el.scrollHeight, 120) + "px";
                    }}
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || sending}
                    className="w-11 h-11 rounded-2xl bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
                  >
                    <Send size={16} className="text-white" />
                  </button>
                </div>
                <p className="text-center text-[10px] text-[#3A1F0E]/25 mt-2">Press Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
