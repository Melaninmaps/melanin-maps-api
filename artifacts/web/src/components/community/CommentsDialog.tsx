import { useCallback, useEffect, useState } from "react";
import { Flag, Loader2, MessageSquare, Send, Trash2, X } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

type CommentPolicy = "everyone" | "followers" | "off";

interface CommunityComment {
  id: string;
  postId: string;
  authorId?: string | null;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  createdAt: string;
}

interface CommentAccess {
  canComment: boolean;
  commentPolicy: CommentPolicy;
  restrictionReason?: string | null;
}

export function CommentsDialog({
  postId,
  postLabel,
  currentUserId,
  onClose,
  onCommentAdded,
}: {
  postId: string;
  postLabel: string;
  currentUserId?: string;
  onClose: () => void;
  onCommentAdded: (postId: string) => void;
}) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [access, setAccess] = useState<CommentAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await authenticatedFetch(`${BASE}api/community/posts/${encodeURIComponent(postId)}/comments`);
      const body = await response.json().catch(() => ({})) as { comments?: CommunityComment[]; access?: CommentAccess; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not load comments.");
      setComments(body.comments ?? []);
      setAccess(body.access ?? { canComment: true, commentPolicy: "everyone" });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load comments.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting || !access?.canComment) return;
    setSubmitting(true);
    setLoadError(null);
    try {
      const response = await authenticatedFetch(`${BASE}api/community/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const body = await response.json().catch(() => ({})) as { comment?: CommunityComment; error?: string; commentPolicy?: CommentPolicy };
      if (!response.ok || !body.comment) throw new Error(body.error ?? "Could not add your comment.");
      setComments((items) => [body.comment!, ...items]);
      setContent("");
      onCommentAdded(postId);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not add your comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    const response = await authenticatedFetch(`${BASE}api/community/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, {
      method: "DELETE",
    });
    if (response.ok) setComments((items) => items.filter((item) => item.id !== commentId));
    else setLoadError("Could not delete this comment.");
  };

  const reportComment = async (commentId: string) => {
    const response = await authenticatedFetch(`${BASE}api/community/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "inappropriate" }),
    });
    setLoadError(response.ok ? "Thanks. The moderation team will review this comment." : "Could not send this report.");
  };

  return (
    <div data-testid="community-comments-dialog" className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="community-comments-title" className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-[#3A1F0E]/10 px-5 py-4">
          <div>
            <p id="community-comments-title" className="font-serif text-lg font-bold text-[#2B1507]">Conversation</p>
            <p className="line-clamp-1 text-xs text-[#3A1F0E]/50">{postLabel}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close comments" className="rounded-full bg-[#FAF6EF] p-2 text-[#3A1F0E]/60 hover:text-[#2B1507] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA922B] focus-visible:ring-offset-2"><X className="h-4 w-4" aria-hidden="true" /></button>
        </header>

        <div className="max-h-[52vh] overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#CA922B]" /></div>
          ) : loadError && comments.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
              <button onClick={() => void load()} className="mt-3 text-sm font-bold text-[#CA922B]">Try again</button>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-10 text-center">
              <MessageSquare className="mx-auto mb-3 h-8 w-8 text-[#CA922B]/40" />
              <p className="text-sm text-[#3A1F0E]/55">No comments yet.</p>
              {access?.canComment && <p className="mt-1 text-xs text-[#3A1F0E]/40">Start the conversation.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <article key={comment.id} className="flex gap-3" data-testid={`community-comment-${comment.id}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: comment.authorColor }}>{comment.authorInitials}</div>
                  <div className="min-w-0 flex-1 rounded-2xl bg-[#FAF6EF] px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-[#2B1507]">{comment.authorName}</p>
                      <div className="flex gap-1">
                        {comment.authorId === currentUserId && <button onClick={() => void deleteComment(comment.id)} aria-label="Delete comment" className="p-1 text-[#3A1F0E]/30 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>}
                        {comment.authorId !== currentUserId && <button onClick={() => void reportComment(comment.id)} aria-label="Report comment" className="p-1 text-[#3A1F0E]/30 hover:text-[#CA922B]"><Flag className="h-3 w-3" /></button>}
                      </div>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#3A1F0E]">{comment.content}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-[#3A1F0E]/10 p-4">
          {loadError && comments.length > 0 && <p className={`mb-2 text-xs ${loadError.startsWith("Thanks") ? "text-green-700" : "text-red-600"}`}>{loadError}</p>}
          {access?.canComment ? (
            <div className="flex items-end gap-2">
              <textarea
                data-testid="community-comment-input"
                aria-label="Comment"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Add to the conversation…"
                style={{ color: "#3A1F0E", caretColor: "#3A1F0E", WebkitTextFillColor: "#3A1F0E" }}
                className="min-h-11 flex-1 resize-none rounded-2xl border border-[#3A1F0E]/20 bg-[#FAF6EF] px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#6F5A4A] outline-none focus:border-[#CA922B] focus-visible:ring-2 focus-visible:ring-[#CA922B] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              />
              <button type="button" aria-label="Post comment" data-testid="community-comment-submit" onClick={() => void submit()} disabled={!content.trim() || submitting} className="rounded-full bg-[#CA922B] p-3 text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA922B] focus-visible:ring-offset-2">{submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}</button>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#FAF6EF] px-4 py-3 text-center text-sm text-[#3A1F0E]/60">{access?.restrictionReason ?? "Comments are not available for this post."}</div>
          )}
        </footer>
      </section>
    </div>
  );
}
