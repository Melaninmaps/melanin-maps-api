import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Heart, Users, Calendar, Globe, ChevronDown,
  X, Image as ImageIcon, Video, Hash, MapPin, Send, Loader2,
  Plus, AlertCircle, Smile, MoreHorizontal, Flag, Trash2,
  TrendingUp, RefreshCw, Radio, Shield, Link2, Search, UserCircle2, ChevronLeft, SlidersHorizontal
} from "lucide-react";
import { CommentsDialog } from "@/components/community/CommentsDialog";
import { CommunityMedia } from "@/components/community/CommunityMedia";
import { communityFeedErrorState } from "@/features/community/feedErrorState";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;

// ── Types ──────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  authorId?: string;
  authorProfileImageUrl?: string;
  content: string;
  upvotes: number;
  liked?: boolean;
  commentsCount: number;
  commentPolicy?: "everyone" | "followers" | "off";
  createdAt: string;
  category: string;
  postType: string;
  mediaUrls?: string[];
  businessName?: string;
  businessId?: string;
  locationVenueName?: string;
  locationCity?: string;
  hashtags?: string[];
  hasContentWarning?: boolean;
  contentWarningType?: string;
  audienceRating?: string;
}

interface ReactionMember {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
}

interface ReactionsResponse {
  members?: ReactionMember[];
  totalLikes?: number;
  hasUnattributedLikes?: boolean;
}

interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  city?: string;
  state?: string;
  location?: string;
  description?: string;
  category?: string;
  isFree?: boolean;
  imageUrl?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  category: string;
  memberCount: number;
  city?: string;
  state?: string;
  isMember?: boolean;
  isPrivate?: boolean;
}

type CommunityFeedDisplay = "text_first" | "mixed" | "video_first";

const COMMUNITY_FEED_DISPLAY_OPTIONS: ReadonlyArray<{
  id: CommunityFeedDisplay;
  label: string;
  description: string;
}> = [
  { id: "text_first", label: "Conversation", description: "Read captions before media" },
  { id: "mixed", label: "Community Mix", description: "Lead with shared media when a post includes it" },
  { id: "video_first", label: "Watch", description: "Lead with media in a viewing-focused feed" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    professional: "#1D4ED8", social: "#7B2D8B", culture: "#CA922B",
    activism: "#DC2626", travel: "#2D7A4F", health: "#0891B2", general: "#CA922B",
  };
  return map[cat] ?? "#CA922B";
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    general: "Discussion", recommendation: "Rec", alert: "Alert",
    question: "Question", safety: "Safety", travel: "Travel",
  };
  return map[cat] ?? cat;
}

function normalizeMediaUrls(value: unknown): string[] | undefined {
  let current = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (Array.isArray(current)) {
      const unique = new Set<string>();
      for (const item of current) {
        if (typeof item !== "string") continue;
        const url = item.trim();
        if (url) unique.add(url);
      }
      const urls = Array.from(unique).slice(0, 5);
      return urls.length > 0 ? urls : undefined;
    }
    // The feed can return a legacy scalar public attachment as well as a JSON
    // array. Keep it renderable so canonical TikTok links are never discarded.
    if (typeof current === "string" && /^https?:\/\//i.test(current.trim())) {
      return [current.trim()];
    }
    if (typeof current !== "string" || !current.trim()) return undefined;
    try {
      current = JSON.parse(current);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function reactionMemberName(member: ReactionMember): string {
  return [member.firstName, member.lastName].filter(Boolean).join(" ") || member.username || "Community member";
}

function reactionMemberInitials(member: ReactionMember): string {
  return `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase()
    || member.username?.slice(0, 2).toUpperCase()
    || "M";
}

function ReactionsDialog({ post, onClose }: { post: Post; onClose: () => void }) {
  const [data, setData] = useState<ReactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    authenticatedFetch(`${BASE}api/community/posts/${encodeURIComponent(post.id)}/reactions`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<ReactionsResponse> : null)
      .then((response) => setData(response))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [post.id]);

  const totalLikes = data?.totalLikes ?? post.upvotes;
  const members = data?.members ?? [];
  return (
    <div data-testid="community-reactions-dialog" className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="community-reactions-title" className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="community-reactions-title" className="font-serif text-xl font-bold text-[#2B1507]">Liked by</h2>
            <p className="mt-1 text-sm text-[#3A1F0E]/60">{totalLikes} {totalLikes === 1 ? "like" : "likes"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close likes" className="rounded-full bg-[#FAF6EF] p-2 text-[#3A1F0E]/60 hover:text-[#2B1507]"><X className="h-4 w-4" /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#CA922B]" /></div>
        ) : members.length ? (
          <div className="mt-5 space-y-2">
            {members.map((member) => (
              <Link key={member.userId} href={`/members/${encodeURIComponent(member.userId)}`} onClick={onClose} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-[#FAF6EF]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#CA922B] text-sm font-bold text-white">
                  {member.profileImageUrl ? <img src={member.profileImageUrl} alt="" className="h-full w-full object-cover" /> : reactionMemberInitials(member)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#2B1507]">{reactionMemberName(member)}</span>
                  {member.username ? <span className="block truncate text-xs text-[#3A1F0E]/55">@{member.username}</span> : null}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-[#FAF6EF] p-4 text-sm leading-6 text-[#3A1F0E]/65">No visible member profiles are available for these likes yet.</p>
        )}
        {data?.hasUnattributedLikes ? <p className="mt-4 text-xs leading-5 text-[#3A1F0E]/50">The total includes earlier likes that were counted before individual member lists were available.</p> : null}
      </section>
    </div>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onDelete, currentUserId, onHashtagClick, onOpenComments, onOpenReactions, presentation = "mixed" }: {
  post: Post; onLike: (id: string, direction: "up" | "down") => Promise<boolean>; onDelete: (id: string) => void;
  currentUserId?: string; onHashtagClick: (tag: string) => void;
  onOpenComments: (post: Post) => void;
  onOpenReactions: (post: Post) => void;
  presentation?: CommunityFeedDisplay;
}) {
  const [liked, setLiked] = useState(Boolean(post.liked));
  const [likes, setLikes] = useState(post.upvotes);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(post.hasContentWarning ?? false);
  const [commentPolicy, setCommentPolicy] = useState(post.commentPolicy ?? "everyone");
  const { toast } = useToast();
  const media = post.mediaUrls && post.mediaUrls.length > 0 ? (
    <div className={`grid gap-1 mx-4 mb-3 rounded-xl overflow-hidden ${post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {post.mediaUrls.slice(0, 4).map((url, i) => (
        <CommunityMedia key={url} url={url} index={i} />
      ))}
    </div>
  ) : null;
  useEffect(() => { setLiked(Boolean(post.liked)); }, [post.id, post.liked]);
  useEffect(() => { setLikes(post.upvotes); }, [post.id, post.upvotes]);
  // This account-level choice changes only the order of presentation inside the
  // same permitted post card. It does not change post eligibility or ranking.
  const showMediaBeforeText = Boolean(media) && presentation !== "text_first";

  const handleLike = async () => {
    const previous = liked;
    const next = !previous;
    setLiked(next);
    setLikes((count) => next ? count + 1 : Math.max(0, count - 1));
    const saved = await onLike(post.id, next ? "up" : "down");
    if (!saved) {
      setLiked(previous);
      setLikes((count) => previous ? count + 1 : Math.max(0, count - 1));
    }
  };

  const updateCommentPolicy = async (next: "everyone" | "followers" | "off") => {
    const response = await authenticatedFetch(`${BASE}api/community/posts/${post.id}/comment-policy`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentPolicy: next }),
    });
    if (response.ok) setCommentPolicy(next);
  };

  const reportPost = async () => {
    const description = window.prompt("Tell us what needs review (optional):");
    if (description === null) return;
    const response = await authenticatedFetch(`${BASE}api/content-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "post", targetId: post.id, reason: "other", description: description.trim() || undefined }),
    });
    if (!response.ok) {
      toast({ title: "Could not submit report", description: "Please try again.", variant: "destructive" });
      return;
    }
    setMenuOpen(false);
    toast({ title: "Report submitted", description: "Thank you. Our moderation team will review it." });
  };

  const blockAuthor = async () => {
    if (!post.authorId || !window.confirm(`Block ${post.authorName}? Their content will no longer appear in your feed.`)) return;
    const response = await authenticatedFetch(`${BASE}api/users/${encodeURIComponent(post.authorId)}/block`, { method: "POST" });
    if (!response.ok) {
      toast({ title: "Could not block member", description: "Please try again.", variant: "destructive" });
      return;
    }
    setMenuOpen(false);
    toast({ title: "Member blocked", description: "Their content will no longer appear in your feed." });
  };

  if (showWarning) {
    return (
      <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-5 text-center">
        <Shield className="w-8 h-8 text-[#CA922B] mx-auto mb-2" />
        <p className="text-sm font-bold text-[#2B1507] mb-1">Content Warning</p>
        <p className="text-xs text-[#3A1F0E]/60 mb-4">{post.contentWarningType ?? "This post has been flagged by the community."}</p>
        <button onClick={() => setShowWarning(false)} className="text-xs font-bold text-[#CA922B] hover:underline">View anyway</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 overflow-hidden hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {post.authorId ? (
          <Link href={`/members/${encodeURIComponent(post.authorId)}`} aria-label={`View ${post.authorName}'s profile`} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA922B]" style={{ backgroundColor: post.authorColor }}>
            {post.authorProfileImageUrl
              ? <img src={post.authorProfileImageUrl} alt="" className="w-full h-full object-cover" />
              : post.authorInitials}
          </Link>
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden" style={{ backgroundColor: post.authorColor }}>
            {post.authorProfileImageUrl
              ? <img src={post.authorProfileImageUrl} alt="" className="w-full h-full object-cover" />
              : post.authorInitials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {post.authorId ? <Link href={`/members/${encodeURIComponent(post.authorId)}`} className="font-bold text-sm text-[#2B1507] truncate hover:underline">{post.authorName}</Link> : <span className="font-bold text-sm text-[#2B1507] truncate">{post.authorName}</span>}
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: "#CA922B18", color: "#CA922B" }}>
              {categoryLabel(post.category)}
            </span>
            {post.audienceRating === "adult" && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600">18+</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#3A1F0E]/50 mt-0.5">
            <span>{timeAgo(post.createdAt)}</span>
            {post.locationCity && (
              <><span>·</span><MapPin className="w-3 h-3" /><span>{post.locationVenueName ?? post.locationCity}</span></>
            )}
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(m => !m)} className="p-1.5 rounded-lg hover:bg-[#FAF6EF] transition-colors">
            <MoreHorizontal className="w-4 h-4 text-[#3A1F0E]/40" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white border border-[#3A1F0E]/10 rounded-xl shadow-xl z-10 min-w-36 overflow-hidden">
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#FAF6EF] text-[#3A1F0E]/70" onClick={() => void reportPost()}>
                <Flag className="w-3.5 h-3.5" /> Report
              </button>
              {post.authorId && post.authorId !== currentUserId && (
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600" onClick={() => void blockAuthor()}>
                  <Shield className="w-3.5 h-3.5" /> Block member
                </button>
              )}
              {post.authorId === currentUserId && (
                <>
                  <p className="border-t border-[#3A1F0E]/8 px-4 pt-2 text-[10px] font-bold uppercase tracking-wide text-[#3A1F0E]/40">Who can comment</p>
                  {(["everyone", "followers", "off"] as const).map((policy) => (
                    <button key={policy} className="w-full px-4 py-2 text-left text-sm text-[#3A1F0E]/70 hover:bg-[#FAF6EF]"
                      onClick={() => { void updateCommentPolicy(policy); setMenuOpen(false); }}>
                      {policy === "everyone" ? "Everyone" : policy === "followers" ? "Followers only" : "Turn off comments"}{commentPolicy === policy ? " ✓" : ""}
                    </button>
                  ))}
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600"
                    onClick={() => { setMenuOpen(false); onDelete(post.id); }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Business tag */}
      {post.businessName && (
        <div className="mx-4 mb-2 px-3 py-1.5 bg-[#CA922B]/8 rounded-xl flex items-center gap-2 border border-[#CA922B]/15">
          <span className="text-[10px] font-bold text-[#CA922B] uppercase tracking-wider">📍 {post.businessName}</span>
        </div>
      )}

      {showMediaBeforeText ? media : null}

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-[#3A1F0E] leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map(tag => (
              <button key={tag} onClick={() => onHashtagClick(tag)}
                className="text-xs font-semibold text-[#CA922B] hover:underline">
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {!showMediaBeforeText ? media : null}

      {/* Footer */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-[#3A1F0E]/6">
        <button onClick={() => { void handleLike(); }}
          aria-label={liked ? "Remove reaction from post" : "React to post"}
          aria-pressed={liked}
          className={`flex items-center text-sm font-medium transition-colors ${liked ? "text-[#CA922B]" : "text-[#3A1F0E]/50 hover:text-[#CA922B]"}`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
        </button>
        {likes > 0 ? <button type="button" onClick={() => onOpenReactions(post)} aria-label={`See ${likes} member${likes === 1 ? "" : "s"} who liked this post`} className="-ml-3 text-sm font-medium text-[#3A1F0E]/50 hover:text-[#CA922B] hover:underline">{likes} {likes === 1 ? "like" : "likes"}</button> : null}
        <button data-testid={`community-post-comments-${post.id}`} onClick={() => onOpenComments(post)} disabled={commentPolicy === "off"}
          className="flex items-center gap-1.5 text-sm font-medium text-[#3A1F0E]/50 hover:text-[#CA922B] transition-colors disabled:cursor-not-allowed disabled:opacity-60">
          <MessageSquare className="w-4 h-4" />
          <span>{commentPolicy === "off" ? "Comments off" : post.commentsCount > 0 ? post.commentsCount : "Comment"}</span>
        </button>
      </div>
    </div>
  );
}

// ── Compose Modal ──────────────────────────────────────────────────────────
function ComposeModal({ groupId, groupName, onClose, onPost }: { groupId?: number; groupName?: string; onClose: () => void; onPost: (p: Post) => void }) {
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers_only">("public");
  const [commentPolicy, setCommentPolicy] = useState<"everyone" | "followers" | "off">("everyone");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [locationTag, setLocationTag] = useState("");
  const [topicTag, setTopicTag] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const uploadMediaFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await authenticatedFetch(`${BASE}api/media/upload?purpose=community_post`, {
        method: "POST",
        body: formData,
      });
      const requestId = resp.headers.get("x-request-id");
      const data = await resp.json().catch(() => ({})) as { url?: string; error?: string; code?: string; requestId?: string };
      if (!resp.ok || !data.url) {
        const supportId = data.requestId ?? requestId;
        const detail = data.error ?? "Upload failed. Please try again.";
        setUploadError(supportId ? `${detail} (Request ID: ${supportId})` : detail);
        return;
      }
      setMediaUrls((urls) => urls.includes(data.url!) ? urls : [...urls, data.url!]);
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const addMediaUrl = () => {
    const url = mediaUrlInput.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("unsupported protocol");
    } catch {
      toast({ title: "Invalid URL", description: "Paste a complete HTTP or HTTPS URL.", variant: "destructive" });
      return;
    }
    if (!mediaUrls.includes(url)) setMediaUrls(u => [...u, url]);
    setMediaUrlInput("");
    setShowMediaInput(false);
  };

  const addHashtag = () => {
    const tag = hashtagInput.replace(/^#/, "").trim().toLowerCase().replace(/\s+/g, "");
    if (tag && !hashtags.includes(tag)) setHashtags(h => [...h, tag]);
    setHashtagInput("");
  };

  const submit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const body = {
        content: content.trim(),
        postType: "community",
        category: "general",
        groupId,
        visibility,
        commentPolicy,
        locationTag: locationTag.trim() || undefined,
        locationVenueName: locationTag.trim() || undefined,
        topicTag: topicTag.trim() || undefined,
        mediaUrls: mediaUrls.length ? mediaUrls : undefined,
        hashtags: hashtags.length ? hashtags : undefined,
      };
      const res = await authenticatedFetch(`${BASE}api/community/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast({ title: "Could not post", description: "Please try again.", variant: "destructive" });
        return;
      }
      const d = await res.json() as { post: Record<string, unknown> };
      const raw = d.post;
      const u = auth?.user as any;
      const newPost: Post = {
        id: raw.id as string,
        authorName: u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "You" : "You",
        authorInitials: u ? `${(u.firstName ?? "")[0] ?? ""}${(u.lastName ?? "")[0] ?? ""}`.toUpperCase() : "?",
        authorColor: "#CA922B",
        authorId: u?.id,
        content: content.trim(),
        upvotes: 0,
        commentsCount: 0,
        commentPolicy,
        createdAt: new Date().toISOString(),
        category: "general",
        postType: "community",
        mediaUrls,
        hashtags,
      };
      onPost(newPost);
      onClose();
    } catch {
      toast({ title: "Could not post", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="community-compose-modal" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#3A1F0E]/8">
          <h2 className="font-serif font-bold text-[#2B1507] text-lg">{groupId ? `Share with ${groupName ?? "your Group"}` : "Share with the Community"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6EF] flex items-center justify-center hover:bg-[#3A1F0E]/8 transition-colors">
            <X className="w-4 h-4 text-[#3A1F0E]/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Text area */}
          <textarea
            data-testid="community-compose-content"
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full min-h-28 resize-none border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#3A1F0E]/35 focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]"
            maxLength={1000}
          />
          <div className="flex justify-between items-center -mt-2">
            <span className="text-[10px] text-[#3A1F0E]/35">{content.length}/1000</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#CA922B]" />
              <input aria-label="Tag a place" value={locationTag} onChange={(event) => setLocationTag(event.target.value)} placeholder="Tag a place" className="w-full rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] py-2.5 pl-9 pr-3 text-xs text-[#3A1F0E] outline-none focus:border-[#CA922B]/50" />
            </label>
            <label className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#CA922B]" />
              <input aria-label="Tag a topic" value={topicTag} onChange={(event) => setTopicTag(event.target.value)} placeholder="Tag a topic" className="w-full rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] py-2.5 pl-9 pr-3 text-xs text-[#3A1F0E] outline-none focus:border-[#CA922B]/50" />
            </label>
          </div>

          {/* Media preview */}
          {mediaUrls.length > 0 && (
            <div data-testid="community-media-previews" className="flex gap-2 flex-wrap">
              {mediaUrls.map((url, i) => (
                <CommunityMedia
                  key={url}
                  url={url}
                  index={i}
                  compact
                  onRemove={() => setMediaUrls((urls) => urls.filter((_, index) => index !== i))}
                />
              ))}
            </div>
          )}

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-[#CA922B]/10 text-[#CA922B] rounded-full text-xs font-semibold">
                  #{t}
                  <button onClick={() => setHashtags(h => h.filter(x => x !== t))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Hashtag input */}
          <div className="flex gap-2">
            <input
              value={hashtagInput}
              onChange={e => setHashtagInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addHashtag(); } }}
              placeholder="#addhashtag"
              className="flex-1 text-xs border border-[#3A1F0E]/10 rounded-xl px-3 py-2 focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF] text-[#3A1F0E]"
            />
            <button onClick={addHashtag} className="px-3 py-2 bg-[#FAF6EF] border border-[#3A1F0E]/10 rounded-xl text-xs font-bold text-[#CA922B] hover:bg-[#CA922B]/8">
              Add
            </button>
          </div>

          {/* Media URL input */}
          {showMediaInput && (
            <div className="flex gap-2 items-center">
              <input
                autoFocus
                value={mediaUrlInput}
                onChange={e => setMediaUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addMediaUrl(); } if (e.key === "Escape") setShowMediaInput(false); }}
                placeholder="Paste image, video, YouTube, Instagram, or TikTok URL…"
                className="flex-1 text-xs border border-[#CA922B]/30 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF] text-[#3A1F0E]"
              />
              <button onClick={addMediaUrl} className="px-3 py-2 bg-[#CA922B] text-white rounded-xl text-xs font-bold hover:bg-[#B38024] shrink-0">Add</button>
              <button onClick={() => setShowMediaInput(false)} className="p-2 text-[#3A1F0E]/30 hover:text-[#3A1F0E]/60"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <div data-testid="community-upload-error" role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {uploadError}
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center justify-between pt-2 border-t border-[#3A1F0E]/8">
            <div className="flex items-center gap-2">
              {/* Photo upload — wired to real server upload */}
              <input
                ref={fileInputRef}
                data-testid="community-photo-input"
                type="file"
                accept=".jpg,.jpeg,.jpe,.png,.webp,.heic,.heif,image/jpeg,image/jpg,image/pjpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMediaFile(f); e.target.value = ""; }}
              />
              {/* Video upload */}
              <input
                ref={videoInputRef}
                data-testid="community-video-input"
                type="file"
                accept=".mp4,.m4v,.mov,.webm,video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMediaFile(f); e.target.value = ""; }}
              />
              {/* Photo button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`p-2 rounded-xl hover:bg-[#FAF6EF] transition-colors ${uploading ? "text-[#CA922B]" : "text-[#3A1F0E]/50 hover:text-[#CA922B]"} disabled:opacity-40`}
                title="Add photo"
              >
                {uploading ? <div className="w-5 h-5 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              </button>
              {/* Video button */}
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading}
                className="p-2 rounded-xl hover:bg-[#FAF6EF] transition-colors text-[#3A1F0E]/50 hover:text-[#CA922B] disabled:opacity-40"
                title="Add video"
              >
                <Video className="w-5 h-5" />
              </button>
              {/* URL paste — kept for YouTube / social embeds */}
              <button onClick={() => setShowMediaInput(v => !v)}
                className={`p-2 rounded-xl hover:bg-[#FAF6EF] transition-colors ${showMediaInput ? "text-[#CA922B]" : "text-[#3A1F0E]/50 hover:text-[#CA922B]"}`}
                title="Add public media link (YouTube, Instagram, TikTok, Facebook, Twitch, Snapchat)">
                <Link2 className="w-5 h-5" />
              </button>
              <button onClick={() => {
                  setVisibility(v => {
                    const next = v === "public" ? "followers_only" : "public";
                    if (next === "followers_only" && commentPolicy === "everyone") setCommentPolicy("followers");
                    return next;
                  });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  visibility === "public" ? "bg-[#FAF6EF] text-[#3A1F0E]/60 border-[#3A1F0E]/10" : "bg-[#CA922B]/10 text-[#CA922B] border-[#CA922B]/20"
                }`}>
                {visibility === "public" ? <Globe className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                {visibility === "public" ? "Public" : "Friends only"}
              </button>
              <select data-testid="community-comment-policy" value={commentPolicy} onChange={(event) => setCommentPolicy(event.target.value as typeof commentPolicy)} aria-label="Who can comment" className="rounded-full border border-[#3A1F0E]/10 bg-[#FAF6EF] px-3 py-1.5 text-xs font-semibold text-[#3A1F0E]/60">
                <option value="everyone">Comments: everyone</option>
                <option value="followers">Comments: friends</option>
                <option value="off">Comments off</option>
              </select>
            </div>
            <button
              onClick={submit}
              disabled={!content.trim() || submitting || uploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#CA922B] text-white font-bold text-sm hover:bg-[#B38024] transition-colors disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Events Tab ─────────────────────────────────────────────────────────────
function EventsTab() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authenticatedFetch(`${BASE}api/events?limit=30`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.events) setEvents(d.events); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#CA922B]" /></div>;

  return (
    <div className="space-y-3">
      {events.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-10 h-10 text-[#CA922B]/40 mx-auto mb-3" />
          <p className="text-sm text-[#3A1F0E]/50 font-medium">No upcoming events yet</p>
          <Link href="/events"><span className="text-xs text-[#CA922B] font-bold cursor-pointer hover:underline mt-2 block">View all events →</span></Link>
        </div>
      )}
      {events.map(evt => {
        const dateStr = evt.date ? new Date(evt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
        return (
          <Link key={evt.id} href={`/events`}>
            <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 hover:shadow-sm transition-shadow cursor-pointer">
              <div className="flex gap-4">
                {dateStr && (
                  <div className="w-12 text-center shrink-0">
                    <div className="text-xs font-bold text-[#CA922B] uppercase">{dateStr.split(" ")[0]}</div>
                    <div className="text-xl font-serif font-bold text-[#2B1507]">{dateStr.split(" ")[1]}</div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#2B1507] truncate">{evt.title}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[#3A1F0E]/50 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{[evt.location ?? evt.city, evt.state].filter(Boolean).join(", ")}</span>
                    {evt.isFree && <span className="ml-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full text-[9px] font-bold uppercase">Free</span>}
                  </div>
                  {evt.description && <p className="text-xs text-[#3A1F0E]/60 mt-1 line-clamp-2">{evt.description}</p>}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ── My Groups page ─────────────────────────────────────────────────────────
// This is deliberately not the browse catalog. A member sees only Groups with
// a current membership; no unrelated group or group post is rendered here.
function MyGroupsPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await authenticatedFetch(`${BASE}api/groups/mine`);
      if (!res.ok) throw new Error("Could not load groups");
      const d = await res.json() as { groups: Group[] };
      setGroups(d.groups ?? []);
    } catch {
      // Do not clear a currently visible list if a later refresh fails.
      setLoadError(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div data-testid="community-my-groups-loading" role="status" aria-live="polite" className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#CA922B]" aria-hidden="true" /><span className="sr-only">Loading your groups</span></div>;

  return (
    <div className="space-y-3">
      {loadError && groups.length === 0 && (
        <div data-testid="community-my-groups-error" role="alert" className="rounded-2xl border border-[#CA922B]/30 bg-white p-6 text-center">
          <p className="text-sm font-bold text-[#2B1507]">We couldn't load your groups</p>
          <p className="mt-1 text-sm text-[#3A1F0E]/60">Your memberships have not changed. Please try again.</p>
          <button type="button" onClick={() => void load()} className="mt-3 text-sm font-bold text-[#CA922B] hover:underline">Try again</button>
        </div>
      )}
      {loadError && groups.length > 0 && (
        <div data-testid="community-my-groups-stale-warning" role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-[#CA922B]/25 bg-[#CA922B]/8 px-4 py-3">
          <p className="text-sm text-[#3A1F0E]/70">We couldn't refresh your groups. The memberships already shown are still available.</p>
          <button type="button" onClick={() => void load()} className="shrink-0 text-xs font-bold text-[#CA922B] hover:underline">Try again</button>
        </div>
      )}
      {groups.length === 0 && (
        <div data-testid="community-my-groups-empty" role="status" className="text-center py-16">
          <Users className="w-10 h-10 text-[#CA922B]/40 mx-auto mb-3" />
          <p className="text-sm text-[#3A1F0E]/50 font-medium">You have not joined any groups yet</p>
          <p className="text-xs text-[#3A1F0E]/35 mt-1">When you join a group, it will appear here.</p>
        </div>
      )}
      {groups.map(g => (
        <button
          key={g.id}
          type="button"
          data-testid={`community-my-group-${g.id}`}
          onClick={() => {
            if (!isAuthenticated) { toast({ title: "Sign in to open your groups" }); return; }
            navigate(`/community/groups/${encodeURIComponent(String(g.id))}`);
          }}
          className="w-full bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 flex items-start gap-3 text-left hover:shadow-sm hover:border-[#CA922B]/35 transition-shadow"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${categoryColor(g.category)}18` }}>
            <Users className="w-5 h-5" style={{ color: categoryColor(g.category) }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-[#2B1507] truncate">{g.name}</p>
            {g.description && <p className="text-xs text-[#3A1F0E]/60 mt-0.5 line-clamp-2">{g.description}</p>}
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#3A1F0E]/40">
              <span>{g.memberCount.toLocaleString()} members</span>
              {g.city && <><span>·</span><span>{g.city}{g.state ? `, ${g.state}` : ""}</span></>}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-[#CA922B]">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#CA922B] text-white">Open</span>
            <ChevronLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
          </div>
        </button>
      ))}
    </div>
  );
}

// ── People Search Result ───────────────────────────────────────────────────
interface MemberResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  bio: string | null;
}

function MemberCard({ m }: { m: MemberResult }) {
  const [, navigate] = useLocation();
  const displayName = [m.firstName, m.lastName].filter(Boolean).join(" ") || m.username || "Community Member";
  const initials = ((m.firstName?.[0] ?? "") + (m.lastName?.[0] ?? "")) || displayName[0]?.toUpperCase() || "?";
  return (
    <button
      type="button"
      onClick={() => navigate(`/profile/${encodeURIComponent(m.id)}`)}
      aria-label={`View ${displayName}'s profile`}
      className="flex items-center gap-3 w-full p-3 bg-white rounded-2xl border border-[#3A1F0E]/8 hover:border-[#CA922B]/30 hover:shadow-sm transition-all text-left"
    >
      {m.profileImageUrl ? (
        <img src={m.profileImageUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#CA922B] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#2B1507] text-sm truncate">{displayName}</p>
        {m.username && <p className="text-[#3A1F0E]/50 text-xs">@{m.username}</p>}
        {m.bio && <p className="text-[#3A1F0E]/60 text-xs mt-0.5 line-clamp-1">{m.bio}</p>}
      </div>
      <UserCircle2 className="w-4 h-4 text-[#3A1F0E]/25 shrink-0" />
    </button>
  );
}

// ── Main Community Page ────────────────────────────────────────────────────
// Community is intentionally limited to the social feed and groups. Events
// retain their dedicated route, while Library carries urgent updates.
const TABS = ["Community Feed", "My Groups"] as const;
type Tab = typeof TABS[number];

export default function Community() {
  const { data: auth } = useGetCurrentAuthUser();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const isAuthenticated = !!(auth?.user);
  const pathname = location.split("?")[0];
  const isMyGroupsPage = pathname === "/community/groups";
  const groupIdParam = new URLSearchParams(location.split("?")[1] ?? "").get("groupId");
  const groupNameParam = new URLSearchParams(location.split("?")[1] ?? "").get("groupName");
  const activeGroupId = groupIdParam && /^\d+$/.test(groupIdParam) ? Number(groupIdParam) : null;
  const activeGroupName = groupNameParam || "This Group";

  // People search
  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleResults, setPeopleResults] = useState<MemberResult[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePeopleSearch = useCallback((q: string) => {
    setPeopleQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim() || q.trim().length < 2) {
      setPeopleResults([]);
      setSearchActive(false);
      return;
    }
    setSearchActive(true);
    setPeopleLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await authenticatedFetch(`${BASE}api/users/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const d = await res.json() as { users: MemberResult[] };
          setPeopleResults(d.users ?? []);
        }
      } catch { /* ignore */ }
      finally { setPeopleLoading(false); }
    }, 350);
  }, []);

  const clearSearch = useCallback(() => {
    setPeopleQuery("");
    setPeopleResults([]);
    setSearchActive(false);
  }, []);

  const activeTab: Tab = isMyGroupsPage ? "My Groups" : "Community Feed";
  const [feedMode, setFeedMode] = useState<"everyone" | "following">("everyone");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErrorStatus, setLoadErrorStatus] = useState<number | null>(null);
  const [loadErrorRequestId, setLoadErrorRequestId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ postId: string; label: string } | null>(null);
  const [reactionTarget, setReactionTarget] = useState<Post | null>(null);
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null);
  const [trending, setTrending] = useState<Array<{ tag: string; weeklyPostCount: number }>>([]);
  const [refreshing, setRefreshing] = useState(false);
  // Conversation is the safe default. Members can opt into another saved
  // presentation, but post text remains first until they explicitly choose it.
  const [communityFeedDisplay, setCommunityFeedDisplay] = useState<CommunityFeedDisplay>("text_first");
  const [showFeedControls, setShowFeedControls] = useState(false);
  const [savingFeedDisplay, setSavingFeedDisplay] = useState(false);

  // Preserve old shared links without continuing to render a Group as a feed
  // filter. Every Group now has its own member-only destination.
  useEffect(() => {
    if (activeGroupId !== null) {
      navigate(`/community/groups/${encodeURIComponent(String(activeGroupId))}`);
    }
  }, [activeGroupId, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void authenticatedFetch(`${BASE}api/users/me/content-preferences`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as { communityFeedDisplay?: unknown };
        if (active && response.ok && ["text_first", "mixed", "video_first"].includes(String(body.communityFeedDisplay))) {
          setCommunityFeedDisplay(body.communityFeedDisplay as CommunityFeedDisplay);
        }
      })
      .catch(() => {
        // A balanced feed remains available if the private preference cannot load.
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  const selectCommunityFeedDisplay = async (next: CommunityFeedDisplay) => {
    if (savingFeedDisplay || next === communityFeedDisplay) {
      setShowFeedControls(false);
      return;
    }
    const previous = communityFeedDisplay;
    setCommunityFeedDisplay(next);
    setSavingFeedDisplay(true);
    try {
      const response = await authenticatedFetch(`${BASE}api/users/me/content-preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityFeedDisplay: next }),
      });
      if (!response.ok) throw new Error("Could not save Community display preference");
      setShowFeedControls(false);
    } catch {
      setCommunityFeedDisplay(previous);
      toast({ title: "Could not save Community view", description: "Your posts have not changed. Please try again.", variant: "destructive" });
    } finally {
      setSavingFeedDisplay(false);
    }
  };

  const loadPosts = useCallback(async () => {
    setLoadErrorStatus(null);
    setLoadErrorRequestId(null);
    try {
      const url = `${BASE}api/community/posts?feed=${feedMode}${activeGroupId ? `&groupId=${encodeURIComponent(String(activeGroupId))}` : ""}${hashtagFilter ? `&hashtag=${encodeURIComponent(hashtagFilter)}` : ""}`;
      const res = await authenticatedFetch(url);
      if (res.ok) {
        const d = await res.json() as { posts: Record<string, unknown>[] };
        setPosts((d.posts ?? []).map(p => ({
          id: p.id as string,
          authorName: (p.authorName as string) ?? "Community Member",
          authorInitials: (p.authorInitials as string) ?? "CM",
          authorColor: (p.authorColor as string) ?? "#CA922B",
          authorId: p.authorId as string | undefined,
          authorProfileImageUrl: p.authorProfileImageUrl as string | undefined,
          content: p.content as string,
          upvotes: (p.upvotes as number) ?? 0,
          liked: Boolean(p.liked),
          commentsCount: (p.commentsCount as number) ?? 0,
          commentPolicy: (["everyone", "followers", "off"].includes(String(p.commentPolicy)) ? p.commentPolicy : "everyone") as Post["commentPolicy"],
          createdAt: p.createdAt as string,
          category: (p.category as string) ?? "general",
          postType: (p.postType as string) ?? "community",
          mediaUrls: normalizeMediaUrls(p.mediaUrls),
          businessName: p.businessName as string | undefined,
          businessId: p.businessId as string | undefined,
          locationVenueName: p.locationVenueName as string | undefined,
          locationCity: p.locationCity as string | undefined,
          hashtags: Array.isArray(p.hashtags) ? p.hashtags as string[] : undefined,
          hasContentWarning: !!(p.hasContentWarning),
          contentWarningType: p.contentWarningType as string | undefined,
          audienceRating: (p.audienceRating as string) ?? "everyone",
        })));
      } else {
        setLoadErrorStatus(res.status);
        setLoadErrorRequestId(res.headers.get("x-request-id"));
      }
    } catch {
      setLoadErrorStatus(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeGroupId, feedMode, hashtagFilter]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  useEffect(() => {
    authenticatedFetch(`${BASE}api/community/hashtags/trending`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.trending) setTrending(d.trending); })
      .catch(() => {});
  }, []);

  const handleLike = async (postId: string, direction: "up" | "down"): Promise<boolean> => {
    if (!isAuthenticated) { toast({ title: "Sign in to like posts" }); return false; }
    try {
      const response = await authenticatedFetch(`${BASE}api/community/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (!response.ok) throw new Error("reaction failed");
      return true;
    } catch {
      toast({ title: "Could not save your reaction", description: "Your reaction was not changed. Please try again.", variant: "destructive" });
      return false;
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await authenticatedFetch(`${BASE}api/community/posts/${postId}`, { method: "DELETE" });
      setPosts(ps => ps.filter(p => p.id !== postId));
    } catch { toast({ title: "Could not delete post", variant: "destructive" }); }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const feedError = communityFeedErrorState(loadErrorStatus, loadErrorRequestId);

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-[#2B1507] text-white px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-2xl text-white">{activeTab === "My Groups" ? "My Groups" : "Community"}</h1>
              </div>
              <p className="text-[#F5EBD8]/60 text-sm">{activeTab === "My Groups" ? "The groups you currently belong to" : "Connect with the community"}</p>
            </div>
            {isAuthenticated && (
              <button data-testid="community-compose-open" onClick={() => setShowCompose(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#CA922B] hover:bg-[#B38024] text-white rounded-full font-bold text-sm transition-colors">
                <Plus className="w-4 h-4" />
                Post
              </button>
            )}
          </div>

          {/* People search bar */}
          {isAuthenticated && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={peopleQuery}
                onChange={e => handlePeopleSearch(e.target.value)}
                aria-label="Search community members"
                placeholder="Search community members…"
                className="w-full bg-white/10 border border-white/15 rounded-2xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#CA922B]/60 focus:bg-white/15 transition-all"
              />
              {peopleQuery && (
                <button type="button" onClick={clearSearch} aria-label="Clear member search" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Tabs — hidden while search is active */}
          {!searchActive && (
            <nav aria-label="Community workbook pages" className="flex gap-1 bg-white/8 rounded-2xl p-1">
              {TABS.map(tab => (
                <button key={tab} onClick={() => navigate(tab === "Community Feed" ? "/community" : "/community/groups")}
                  aria-current={activeTab === tab ? "page" : undefined}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                    activeTab === tab ? "bg-white text-[#2B1507] shadow-sm" : "text-white/70 hover:text-white"
                  }`}>
                  {tab}
                </button>
              ))}
            </nav>
          )}
          {!searchActive && (
            <Link href="/community-guidelines" className="mt-2 block text-center text-xs font-semibold text-[#F5EBD8]/70 underline-offset-4 hover:text-white hover:underline">
              Community guidance
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* ── People search results ─────────────────────────────────────── */}
        {searchActive && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider">Community Members</p>
              <Link href={`/businesses?q=${encodeURIComponent(peopleQuery)}`}>
                <span className="text-xs text-[#CA922B] font-semibold hover:underline cursor-pointer">
                  Also search businesses →
                </span>
              </Link>
            </div>

            {peopleLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#CA922B]" />
              </div>
            ) : peopleResults.length > 0 ? (
              <div className="space-y-2">
                {peopleResults.map(m => <MemberCard key={m.id} m={m} />)}
              </div>
            ) : peopleQuery.trim().length >= 2 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-[#3A1F0E]/8">
                <UserCircle2 className="w-8 h-8 text-[#CA922B]/30 mx-auto mb-2" />
                <p className="text-sm text-[#3A1F0E]/50 font-medium">
                  No members found for "{peopleQuery}"
                </p>
                <Link href={`/businesses?q=${encodeURIComponent(peopleQuery)}`}>
                  <span className="mt-2 inline-block text-sm text-[#CA922B] font-semibold hover:underline cursor-pointer">
                    Search in business directory →
                  </span>
                </Link>
              </div>
            ) : null}
          </div>
        )}

        {/* Feed tab */}
        {!searchActive && activeTab === "Community Feed" && (
          <>
            {/* Feed mode + trending */}
            <div className="space-y-4 mb-5">
              {/* Feed mode toggle */}
              <div className="flex items-center gap-2">
                {(["everyone", "following"] as const).map(mode => (
                  <button key={mode} type="button" onClick={() => setFeedMode(mode)} aria-pressed={feedMode === mode}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                      feedMode === mode ? "bg-[#2B1507] text-white" : "bg-white text-[#3A1F0E]/50 border border-[#3A1F0E]/10 hover:border-[#CA922B]/40"
                    }`}>
                    {mode === "everyone" ? "Everyone" : "Following"}
                  </button>
                ))}
                {isAuthenticated && (
                  <button
                    type="button"
                    data-testid="community-settings-open"
                    onClick={() => setShowFeedControls(true)}
                    aria-label="Open Community settings"
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#3A1F0E]/60 border border-[#3A1F0E]/8 hover:text-[#CA922B] hover:border-[#CA922B]/40 transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">Feed settings</span>
                  </button>
                )}
                <button type="button" onClick={handleRefresh} disabled={refreshing} aria-label="Refresh Community feed" className="p-2 rounded-xl bg-white border border-[#3A1F0E]/8 text-[#3A1F0E]/40 hover:text-[#CA922B] transition-colors disabled:cursor-wait disabled:opacity-60">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Trending hashtags */}
              {trending.length > 0 && (
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#3A1F0E]/35 uppercase tracking-wider shrink-0">
                      <TrendingUp className="w-3 h-3" /> Trending
                    </div>
                    {(hashtagFilter !== null) && (
                      <button onClick={() => setHashtagFilter(null)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#CA922B] text-white text-xs font-bold shrink-0">
                        #{hashtagFilter} <X className="w-3 h-3" />
                      </button>
                    )}
                    {trending.slice(0, 8).map(h => (
                      <button key={h.tag} onClick={() => setHashtagFilter(hashtagFilter === h.tag ? null : h.tag)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                          hashtagFilter === h.tag
                            ? "bg-[#CA922B] text-white"
                            : "bg-white border border-[#3A1F0E]/10 text-[#3A1F0E]/60 hover:border-[#CA922B]/40 hover:text-[#CA922B]"
                        }`}>
                        #{h.tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compose prompt for non-members */}
              {!isAuthenticated && (
                <div className="bg-white rounded-2xl border border-[#CA922B]/20 p-4 text-center">
                  <p className="text-sm font-medium text-[#3A1F0E]/70 mb-3">Sign in to post, like, and join conversations</p>
                  <Link href="/login"><span className="px-5 py-2 bg-[#CA922B] text-white rounded-full text-sm font-bold cursor-pointer hover:bg-[#B38024] transition-colors">Sign In</span></Link>
                </div>
              )}
            </div>

            {/* Posts */}
            {loading ? (
              <div data-testid="community-feed-loading" role="status" aria-live="polite" className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#CA922B]" aria-hidden="true" /><span className="sr-only">Loading Community posts</span></div>
            ) : feedError.kind === "auth" ? (
              <div data-testid="community-feed-auth-required" className="text-center py-16">
                <AlertCircle className="w-8 h-8 text-[#CA922B] mx-auto mb-3" />
                <p className="text-sm font-bold text-[#2B1507]">{feedError.title}</p>
                <p className="text-sm text-[#3A1F0E]/60 mt-1 mb-3">{feedError.message}</p>
                <Link href="/login"><span className="inline-block text-sm font-bold text-[#CA922B] hover:underline cursor-pointer">Sign in</span></Link>
              </div>
            ) : posts.length === 0 && feedError.kind === "server" ? (
              <div data-testid="community-feed-retry" className="text-center py-16">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#2B1507]">{feedError.title}</p>
                <p className="text-sm text-[#3A1F0E]/60 mt-1 mb-3">{feedError.message} No posts or comments were removed.</p>
                <button type="button" onClick={() => void loadPosts()} className="text-sm font-bold text-[#CA922B] hover:underline">Try again</button>
              </div>
            ) : posts.length === 0 ? (
              <div data-testid="community-feed-empty" role="status" className="text-center py-16">
                <MessageSquare className="w-10 h-10 text-[#CA922B]/40 mx-auto mb-3" />
                <p className="text-sm text-[#3A1F0E]/50 font-medium">No posts yet{hashtagFilter ? ` for #${hashtagFilter}` : ""}</p>
                {isAuthenticated && (
                  <button onClick={() => setShowCompose(true)} className="mt-3 text-sm font-bold text-[#CA922B] hover:underline">
                    Be the first to post →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {feedError.kind === "server" && (
                  <div data-testid="community-feed-stale-warning" role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-[#CA922B]/25 bg-[#CA922B]/8 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-[#2B1507]">{feedError.title}</p>
                      <p className="mt-0.5 text-xs text-[#3A1F0E]/60">{feedError.message}</p>
                    </div>
                    <button onClick={loadPosts} className="shrink-0 text-xs font-bold text-[#CA922B] hover:underline">Try again</button>
                  </div>
                )}
                {posts.map(post => (
                  <PostCard key={post.id} post={post}
                    onLike={handleLike} onDelete={handleDelete}
                    currentUserId={(auth?.user as any)?.id}
                    presentation={communityFeedDisplay}
                    onHashtagClick={tag => setHashtagFilter(hashtagFilter === tag ? null : tag)}
                    onOpenComments={selected => setCommentTarget({ postId: selected.id, label: selected.content })}
                    onOpenReactions={setReactionTarget}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!searchActive && activeTab === "My Groups" && <MyGroupsPage isAuthenticated={isAuthenticated} />}
      </div>

      {showFeedControls && (
        <div data-testid="community-settings-dialog" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => !savingFeedDisplay && setShowFeedControls(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="community-settings-title" className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p id="community-settings-title" className="font-serif text-lg font-bold text-[#2B1507]">Community Settings</p>
                <p className="mt-1 text-sm leading-5 text-[#3A1F0E]/60">Choose whether shared posts feel conversation-first, balanced, or video-first. This changes presentation only. It never changes which posts are permitted, their privacy, or their ranking.</p>
              </div>
              <button type="button" onClick={() => setShowFeedControls(false)} disabled={savingFeedDisplay} aria-label="Close Community settings" className="rounded-full bg-[#FAF6EF] p-2 text-[#3A1F0E]/60 hover:text-[#2B1507] disabled:opacity-50"><X className="h-4 w-4" /></button>
            </div>
            <div role="radiogroup" aria-label="Choose your Community experience" className="mt-5 space-y-2">
              {COMMUNITY_FEED_DISPLAY_OPTIONS.map((option) => {
                const selected = communityFeedDisplay === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={savingFeedDisplay}
                    onClick={() => { void selectCommunityFeedDisplay(option.id); }}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors disabled:opacity-60 ${selected ? "border-[#CA922B] bg-[#FFF8EC]" : "border-[#3A1F0E]/10 bg-white hover:border-[#CA922B]/45"}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-[#2B1507]">{option.label}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-[#CA922B] bg-[#CA922B] text-white" : "border-[#3A1F0E]/25 text-transparent"}`}>✓</span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#3A1F0E]/60">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Compose modal */}
      {reactionTarget ? <ReactionsDialog post={reactionTarget} onClose={() => setReactionTarget(null)} /> : null}
      {showCompose && <ComposeModal groupId={activeGroupId ?? undefined} groupName={activeGroupId ? activeGroupName : undefined} onClose={() => setShowCompose(false)} onPost={p => setPosts(ps => [p, ...ps])} />}
      {commentTarget && <CommentsDialog
        postId={commentTarget.postId}
        postLabel={commentTarget.label}
        currentUserId={(auth?.user as any)?.id}
        onClose={() => setCommentTarget(null)}
        onCommentAdded={(postId) => setPosts((items) => items.map((post) => post.id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post))}
      />}
    </div>
  );
}
