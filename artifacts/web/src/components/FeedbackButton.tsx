/**
 * FeedbackButton — floating tester feedback widget.
 * Shown only to authenticated users. Opens a modal sheet.
 * Submits to POST /api/feedback with auto-captured context.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { MessageSquarePlus, X, ChevronDown, CheckCircle, Loader2 } from "lucide-react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const FEEDBACK_TYPES = [
  { value: "bug",           label: "Something isn't working" },
  { value: "confusing",     label: "Something is confusing" },
  { value: "feature",       label: "Feature suggestion" },
  { value: "missing_place", label: "Missing business or place" },
  { value: "incorrect",     label: "Incorrect information" },
  { value: "love",          label: "Something I love" },
  { value: "general",       label: "General feedback" },
] as const;

const HIDDEN_ON = ["/login", "/signup", "/travel", "/membership"];

export function FeedbackButton() {
  const { data: auth } = useGetCurrentAuthUser();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [expected, setExpected] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Only render for authenticated users, hidden on auth/kinfolk pages
  if (!auth?.user) return null;
  if (HIDDEN_ON.some(p => location === p || location.startsWith(p + "/"))) return null;

  function reset() {
    setType("");
    setDescription("");
    setExpected("");
    setError("");
    setDone(false);
    setSubmitting(false);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  async function submit() {
    setError("");
    if (!type) { setError("Please choose a feedback type."); return; }
    if (description.trim().length < 5) { setError("Please describe your feedback in a bit more detail."); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          description: description.trim(),
          expected: expected.trim() || undefined,
          page: window.location.pathname,
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not connect. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating trigger button — bottom-left, above mobile nav on small screens */}
      <button
        onClick={() => { setOpen(true); reset(); }}
        aria-label="Send feedback"
        className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 flex items-center gap-2 bg-[#2B1507] text-[#F5EBD8] rounded-full shadow-lg border border-[#CA922B]/30 px-4 py-2.5 text-xs font-bold hover:bg-[#3A1F0E] hover:border-[#CA922B]/60 transition-all active:scale-95"
      >
        <MessageSquarePlus className="w-4 h-4 text-[#CA922B]" />
        <span className="hidden sm:inline">Beta Feedback</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={close}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#2B1507] px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-white text-lg">Beta Feedback</h2>
                <p className="text-[#F5EBD8]/60 text-xs mt-0.5">Help us improve before the tour</p>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-[#F5EBD8]" />
              </button>
            </div>

            <div className="p-6">
              {done ? (
                /* Confirmation */
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-bold text-[#2B1507] text-lg">Thank you — your feedback was received.</p>
                  <p className="text-[#3A1F0E]/60 text-sm mt-1">We'll review it before the tour.</p>
                  <button
                    onClick={close}
                    className="mt-6 px-8 py-2.5 bg-[#CA922B] text-white rounded-full font-bold text-sm hover:bg-[#B38024] transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Type selector */}
                  <div>
                    <label className="block text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider mb-1.5">
                      What kind of feedback? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={type}
                        onChange={e => setType(e.target.value)}
                        className="w-full appearance-none border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] bg-white focus:outline-none focus:border-[#CA922B] pr-10"
                      >
                        <option value="" disabled>Choose a category…</option>
                        {FEEDBACK_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A1F0E]/40 pointer-events-none" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider mb-1.5">
                      What happened / What would you like us to know? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Describe what happened, what you noticed, or what you'd like to see…"
                      className="w-full border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B] resize-none bg-white"
                    />
                    <p className="text-[10px] text-[#3A1F0E]/30 mt-1 text-right">{description.length}/2000</p>
                  </div>

                  {/* Expected (optional) */}
                  <div>
                    <label className="block text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider mb-1.5">
                      What did you expect to happen? <span className="font-normal normal-case text-[#3A1F0E]/35">(optional)</span>
                    </label>
                    <textarea
                      value={expected}
                      onChange={e => setExpected(e.target.value)}
                      rows={2}
                      maxLength={1000}
                      placeholder="Optional — what were you expecting?"
                      className="w-full border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B] resize-none bg-white"
                    />
                  </div>

                  {/* Auto-context note */}
                  <p className="text-[10px] text-[#3A1F0E]/35 leading-relaxed">
                    Your account and current page are automatically included to help us diagnose issues. No passwords or tokens are collected.
                  </p>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="w-full h-12 bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-50 text-white font-bold rounded-full text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                      "Send Feedback"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
