import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Heart, Users, Calendar, Globe, ChevronDown,
  X, Image as ImageIcon, Video, Hash, MapPin, Send, Loader2,
  Plus, AlertCircle, Smile, MoreHorizontal, Bookmark, Flag, Trash2,
  TrendingUp, RefreshCw, Radio, Shield
} from "lucide-react";

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
  commentsCount: number;
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

// ── Post Card ──────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onDelete, currentUserId, onHashtagClick }: {
  post: Post; onLike: (id: string) => void; onDelete: (id: string) => void;
  currentUserId?: string; onHashtagClick: (tag: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.upvotes);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(post.hasContentWarning ?? false);

  const handleLike = () => {
    setLiked(l => !l);
    setLikes(l => liked ? l - 1 : l + 1);
    onLike(post.id);
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
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden"
          style={{ backgroundColor: post.authorColor }}>
          {post.authorProfileImageUrl
            ? <img src={post.authorProfileImageUrl} alt="" className="w-full h-full object-cover" />
            : post.authorInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-[#2B1507] truncate">{post.authorName}</span>
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
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#FAF6EF] text-[#3A1F0E]/70" onClick={() => setMenuOpen(false)}>
                <Bookmark className="w-3.5 h-3.5" /> Save Post
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[#FAF6EF] text-[#3A1F0E]/70" onClick={() => setMenuOpen(false)}>
                <Flag className="w-3.5 h-3.5" /> Report
              </button>
              {post.authorId === currentUserId && (
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600"
                  onClick={() => { setMenuOpen(false); onDelete(post.id); }}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
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

      {/* Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className={`grid gap-1 mx-4 mb-3 rounded-xl overflow-hidden ${post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.mediaUrls.slice(0, 4).map((url, i) => (
            url.includes(".mp4") || url.includes("video") ? (
              <video key={i} src={url} controls className="w-full max-h-72 object-cover bg-black rounded-xl" />
            ) : (
              <img key={i} src={url} alt="" className="w-full object-cover rounded-xl max-h-72" />
            )
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-[#3A1F0E]/6">
        <button onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? "text-[#CA922B]" : "text-[#3A1F0E]/50 hover:text-[#CA922B]"}`}>
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          <span>{likes > 0 ? likes : ""}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium text-[#3A1F0E]/50 hover:text-[#CA922B] transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span>{post.commentsCount > 0 ? post.commentsCount : ""}</span>
        </button>
      </div>
    </div>
  );
}

// ── Compose Modal ──────────────────────────────────────────────────────────
function ComposeModal({ onClose, onPost }: { onClose: () => void; onPost: (p: Post) => void }) {
  const { data: auth } = useGetCurrentAuthUser();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"community" | "recommendation" | "alert">("community");
  const [visibility, setVisibility] = useState<"public" | "followers_only">("public");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const uploadMedia = async (file: File, type: "image" | "video") => {
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append(type === "image" ? "image" : "video", file);
      const res = await fetch(`${BASE}api/community/media/upload/${type}`, {
        method: "POST", credentials: "include", body: fd,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        if (res.status === 403 && (e as any).code === "UPGRADE_REQUIRED") {
          toast({ title: "Membership required", description: "Upgrade to upload media.", variant: "destructive" });
        } else {
          toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
        }
        return;
      }
      const d = await res.json() as { url: string };
      setMediaUrls(u => [...u, d.url]);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingMedia(false);
    }
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
        postType,
        category: postType === "recommendation" ? "recommendation" : postType === "alert" ? "alert" : "general",
        visibility,
        mediaUrls: mediaUrls.length ? JSON.stringify(mediaUrls) : undefined,
        hashtags: hashtags.length ? hashtags : undefined,
      };
      const res = await fetch(`${BASE}api/community/posts`, {
        method: "POST", credentials: "include",
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
        createdAt: new Date().toISOString(),
        category: postType === "recommendation" ? "recommendation" : postType === "alert" ? "alert" : "general",
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#3A1F0E]/8">
          <h2 className="font-serif font-bold text-[#2B1507] text-lg">Share with the Community</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6EF] flex items-center justify-center hover:bg-[#3A1F0E]/8 transition-colors">
            <X className="w-4 h-4 text-[#3A1F0E]/60" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Post type */}
          <div className="flex gap-2">
            {(["community", "recommendation", "alert"] as const).map(t => (
              <button key={t} onClick={() => setPostType(t)}
                className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                  postType === t ? "bg-[#2B1507] text-[#F5EBD8] border-[#2B1507]" : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/15 hover:border-[#CA922B]/40"
                }`}>
                {t === "community" ? "Discussion" : t === "recommendation" ? "Rec" : "Alert"}
              </button>
            ))}
          </div>

          {/* Text area */}
          <textarea
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={postType === "recommendation" ? "Share a recommendation with the community..." : postType === "alert" ? "Share an important alert or update..." : "What's on your mind?"}
            className="w-full min-h-28 resize-none border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm text-[#3A1F0E] placeholder:text-[#3A1F0E]/35 focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]"
            maxLength={1000}
          />
          <div className="flex justify-between items-center -mt-2">
            <span className="text-[10px] text-[#3A1F0E]/35">{content.length}/1000</span>
          </div>

          {/* Media preview */}
          {mediaUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                  {url.includes(".mp4") ? (
                    <video src={url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  )}
                  <button onClick={() => setMediaUrls(u => u.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
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

          {/* Actions row */}
          <div className="flex items-center justify-between pt-2 border-t border-[#3A1F0E]/8">
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" multiple
                onChange={e => Array.from(e.target.files ?? []).forEach(f => uploadMedia(f, "image"))} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadMedia(e.target.files[0], "video")} />
              <button onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                className="p-2 rounded-xl hover:bg-[#FAF6EF] text-[#3A1F0E]/50 hover:text-[#CA922B] transition-colors" title="Add photo">
                {uploadingMedia ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              </button>
              <button onClick={() => videoInputRef.current?.click()}
                disabled={uploadingMedia}
                className="p-2 rounded-xl hover:bg-[#FAF6EF] text-[#3A1F0E]/50 hover:text-[#CA922B] transition-colors" title="Add video">
                <Video className="w-5 h-5" />
              </button>
              <button onClick={() => setVisibility(v => v === "public" ? "followers_only" : "public")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  visibility === "public" ? "bg-[#FAF6EF] text-[#3A1F0E]/60 border-[#3A1F0E]/10" : "bg-[#CA922B]/10 text-[#CA922B] border-[#CA922B]/20"
                }`}>
                {visibility === "public" ? <Globe className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                {visibility === "public" ? "Everyone" : "Followers"}
              </button>
            </div>
            <button
              onClick={submit}
              disabled={!content.trim() || submitting}
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
    fetch(`${BASE}api/events?limit=30`, { credentials: "include" })
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

// ── Groups Tab ─────────────────────────────────────────────────────────────
function GroupsTab({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/groups`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json() as { groups: Group[] };
        setGroups(d.groups ?? []);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleJoin = async (g: Group) => {
    if (!isAuthenticated) { toast({ title: "Sign in to join groups" }); return; }
    setJoining(g.id);
    try {
      const method = g.isMember ? "DELETE" : "POST";
      const res = await fetch(`${BASE}api/groups/${g.id}/${g.isMember ? "leave" : "join"}`, {
        method, credentials: "include",
      });
      if (res.ok) {
        setGroups(gs => gs.map(x => x.id === g.id ? { ...x, isMember: !x.isMember, memberCount: x.memberCount + (g.isMember ? -1 : 1) } : x));
      }
    } catch { /* ignore */ } finally { setJoining(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#CA922B]" /></div>;

  return (
    <div className="space-y-3">
      {groups.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-[#CA922B]/40 mx-auto mb-3" />
          <p className="text-sm text-[#3A1F0E]/50 font-medium">No groups yet</p>
          <p className="text-xs text-[#3A1F0E]/35 mt-1">Groups are coming soon</p>
        </div>
      )}
      {groups.map(g => (
        <div key={g.id} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
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
          <button
            onClick={() => toggleJoin(g)}
            disabled={joining === g.id}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              g.isMember ? "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/10 hover:bg-red-50 hover:text-red-600" : "bg-[#CA922B] text-white hover:bg-[#B38024]"
            }`}>
            {joining === g.id ? "..." : g.isMember ? "Leave" : "Join"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main Community Page ────────────────────────────────────────────────────
const TABS = ["Feed", "Events", "Groups"] as const;
type Tab = typeof TABS[number];

export default function Community() {
  const { data: auth } = useGetCurrentAuthUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isAuthenticated = !!(auth?.user);

  const [activeTab, setActiveTab] = useState<Tab>("Feed");
  const [feedMode, setFeedMode] = useState<"everyone" | "following">("everyone");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null);
  const [trending, setTrending] = useState<Array<{ tag: string; weeklyPostCount: number }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoadError(false);
    try {
      const url = `${BASE}api/community/posts?feed=${feedMode}${hashtagFilter ? `&hashtag=${hashtagFilter}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
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
          commentsCount: (p.commentsCount as number) ?? 0,
          createdAt: p.createdAt as string,
          category: (p.category as string) ?? "general",
          postType: (p.postType as string) ?? "community",
          mediaUrls: (() => {
            const mu = p.mediaUrls;
            if (!mu) return undefined;
            if (Array.isArray(mu)) return mu as string[];
            try { return JSON.parse(mu as string) as string[]; } catch { return undefined; }
          })(),
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
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [feedMode, hashtagFilter]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  useEffect(() => {
    fetch(`${BASE}api/community/hashtags/trending`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.trending) setTrending(d.trending); })
      .catch(() => {});
  }, []);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) { toast({ title: "Sign in to like posts" }); return; }
    try {
      await fetch(`${BASE}api/community/posts/${postId}/upvote`, { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await fetch(`${BASE}api/community/posts/${postId}`, { method: "DELETE", credentials: "include" });
      setPosts(ps => ps.filter(p => p.id !== postId));
    } catch { toast({ title: "Could not delete post", variant: "destructive" }); }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-[#2B1507] text-white px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-serif font-bold text-2xl text-white">The Feed</h1>
              <p className="text-[#F5EBD8]/60 text-sm">Connect with the community</p>
            </div>
            {isAuthenticated && (
              <button onClick={() => setShowCompose(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#CA922B] hover:bg-[#B38024] text-white rounded-full font-bold text-sm transition-colors">
                <Plus className="w-4 h-4" />
                Post
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/8 rounded-2xl p-1">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                  activeTab === tab ? "bg-white text-[#2B1507] shadow-sm" : "text-white/70 hover:text-white"
                }`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Feed tab */}
        {activeTab === "Feed" && (
          <>
            {/* Feed mode + trending */}
            <div className="space-y-4 mb-5">
              {/* Feed mode toggle */}
              <div className="flex items-center gap-2">
                {(["everyone", "following"] as const).map(mode => (
                  <button key={mode} onClick={() => setFeedMode(mode)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                      feedMode === mode ? "bg-[#2B1507] text-white" : "bg-white text-[#3A1F0E]/50 border border-[#3A1F0E]/10 hover:border-[#CA922B]/40"
                    }`}>
                    {mode === "everyone" ? "Everyone" : "Following"}
                  </button>
                ))}
                <button onClick={handleRefresh} className="ml-auto p-2 rounded-xl bg-white border border-[#3A1F0E]/8 text-[#3A1F0E]/40 hover:text-[#CA922B] transition-colors">
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
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#CA922B]" /></div>
            ) : loadError ? (
              <div className="text-center py-16">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-[#3A1F0E]/60 mb-3">Couldn't load the feed</p>
                <button onClick={loadPosts} className="text-sm font-bold text-[#CA922B] hover:underline">Try again</button>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
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
                {posts.map(post => (
                  <PostCard key={post.id} post={post}
                    onLike={handleLike} onDelete={handleDelete}
                    currentUserId={(auth?.user as any)?.id}
                    onHashtagClick={tag => setHashtagFilter(hashtagFilter === tag ? null : tag)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "Events" && <EventsTab />}
        {activeTab === "Groups" && <GroupsTab isAuthenticated={isAuthenticated} />}
      </div>

      {/* Compose modal */}
      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onPost={p => setPosts(ps => [p, ...ps])} />}
    </div>
  );
}
