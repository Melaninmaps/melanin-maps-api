import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Award, CalendarDays, Flag, Gift, Loader2, MapPin, MessageCircle, ShieldAlert, Star, UserCheck, UserPlus, Users } from "lucide-react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { CommunityMedia } from "@/components/community/CommunityMedia";

const BASE = import.meta.env.BASE_URL;

type MemberProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  industry: string | null;
  jobTitle: string | null;
  coverUrl?: string | null;
  location?: string | null;
  age?: number | null;
  birthday?: string | null;
  createdAt: string | null;
  memberType: string | null;
};

type Review = {
  id: string;
  businessId: string;
  rating: number;
  text: string | null;
  socialPostUrl?: string | null;
  socialHandle?: string | null;
  socialPlatform?: string | null;
  createdAt: string | null;
};

type ProfileTag = {
  id: string;
  taggerId: string;
  content: string;
  createdAt: string | null;
  taggerFirstName: string | null;
  taggerLastName: string | null;
  taggerUsername: string | null;
};

type CommunityPost = {
  id: string;
  content: string;
  postType: string;
  category: string;
  createdAt: string | null;
  commentsCount: number;
  upvotes: number;
  businessId?: string | null;
  businessName?: string | null;
  locationCity?: string | null;
  mediaUrls?: string[] | null;
  privateMedia?: Array<{ assetId: string; type: "image" | "video"; url: string }> | null;
};

type ProfileResponse = {
  profile?: MemberProfile;
  user?: MemberProfile;
  reviews?: Review[];
  tags?: ProfileTag[];
  canSeeContent?: boolean;
  canReceiveDirectMessages?: boolean;
  isFollowing?: boolean;
  followStatus?: "pending" | "accepted" | null;
  followersCount?: number;
  followingCount?: number;
  badges?: Array<{ achievementType: string; earnedAt: string | null }>;
};

type ProfileTab = "posts" | "media" | "tagged" | "reviews" | "notes";

function nameFor(profile: MemberProfile): string {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username || "Community member";
}

function initialsFor(profile: MemberProfile): string {
  return `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || profile.username?.slice(0, 2).toUpperCase() || "M";
}

function dateLabel(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function relativeTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) return null;
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function postTypeLabel(postType: string): string {
  const labels: Record<string, string> = {
    community: "Community post",
    question: "Question",
    travel: "Travel post",
    safety: "Safety post",
    business: "Business post",
  };
  return labels[postType] ?? "Community post";
}

function ProfileCommunityPost({ post }: { post: CommunityPost }) {
  const media = [
    ...(post.mediaUrls ?? []).map((url) => ({ url, privateMedia: false, type: undefined })),
    ...(post.privateMedia ?? []).map((item) => ({ url: item.url, privateMedia: true, type: item.type })),
  ];
  return (
    <article className="rounded-2xl border border-[#3A1F0E]/10 bg-[#FFFDF9] p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#3A1F0E]/50">
        <span className="font-semibold text-[#8D5C17]">{postTypeLabel(post.postType)}</span>
        {relativeTime(post.createdAt) ? <span>{relativeTime(post.createdAt)}</span> : null}
        {post.locationCity ? <span>{post.locationCity}</span> : null}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#3A1F0E]/80">{post.content}</p>
      {media.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{media.slice(0, 4).map((item, index) => <CommunityMedia key={`${item.privateMedia ? "private" : "public"}-${item.url}`} url={item.url} index={index} privateMedia={item.privateMedia} mediaType={item.type} />)}</div> : null}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#3A1F0E]/55">
        {post.businessId && post.businessName ? <Link href={`/businesses/${encodeURIComponent(post.businessId)}`} className="font-semibold text-[#8D5C17] hover:underline">{post.businessName}</Link> : null}
        <span>{Math.max(0, post.upvotes ?? 0)} {post.upvotes === 1 ? "like" : "likes"}</span>
        <span>{Math.max(0, post.commentsCount ?? 0)} {post.commentsCount === 1 ? "comment" : "comments"}</span>
      </div>
    </article>
  );
}

export default function MemberProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: auth } = useGetCurrentAuthUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagText, setTagText] = useState("");
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const loadProfile = useCallback(async (signal?: AbortSignal): Promise<void> => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await authenticatedFetch(`${BASE}api/users/${encodeURIComponent(userId)}/profile`, { signal });
      if (!response.ok) {
        if (!signal?.aborted) {
          setData(null);
          setPosts([]);
          setTaggedPosts([]);
        }
        return;
      }
      const profileResponse = await response.json() as ProfileResponse;
      if (signal?.aborted) return;
      setData(profileResponse);

      // Community performs its own block, private-account, connection, and
      // moderation checks. Do not infer profile activity from client state.
      if (!profileResponse.canSeeContent) {
        setPosts([]);
        setTaggedPosts([]);
        return;
      }
      const [postsResponse, taggedResponse] = await Promise.all([
        authenticatedFetch(`${BASE}api/community/posts?authorId=${encodeURIComponent(userId)}&limit=20`, { signal }),
        authenticatedFetch(`${BASE}api/community/posts?taggedUserId=${encodeURIComponent(userId)}&limit=20`, { signal }),
      ]);
      const [postsPayload, taggedPayload] = await Promise.all([
        postsResponse.ok ? postsResponse.json() as Promise<{ posts?: CommunityPost[] }> : Promise.resolve({ posts: [] }),
        taggedResponse.ok ? taggedResponse.json() as Promise<{ posts?: CommunityPost[] }> : Promise.resolve({ posts: [] }),
      ]);
      if (!signal?.aborted) {
        setPosts(Array.isArray(postsPayload.posts) ? postsPayload.posts : []);
        setTaggedPosts(Array.isArray(taggedPayload.posts) ? taggedPayload.posts : []);
      }
    } catch (error) {
      if ((error as { name?: string } | null)?.name !== "AbortError" && !signal?.aborted) {
        setData(null);
        setPosts([]);
        setTaggedPosts([]);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadProfile(controller.signal);
    return () => controller.abort();
  }, [loadProfile]);

  useEffect(() => {
    setActiveTab("posts");
    setTagText("");
  }, [userId]);

  const profile = data?.profile ?? data?.user ?? null;
  const isSelf = !!profile && auth?.user?.id === profile.id;
  const joined = useMemo(() => dateLabel(profile?.createdAt ?? null), [profile?.createdAt]);
  const profileName = profile ? nameFor(profile) : "Community member";
  const coverUrl = profile?.coverUrl ? `${BASE.replace(/\/$/, "")}${profile.coverUrl}` : null;
  const canManageProfileTag = (tag: ProfileTag): boolean => isSelf || tag.taggerId === auth?.user?.id;

  async function startMessage(): Promise<void> {
    if (!profile || isSelf) return;
    setMessageLoading(true);
    try {
      const response = await authenticatedFetch(`${BASE}api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "dm", participantId: profile.id, title: profile.username ? `@${profile.username}` : nameFor(profile) }),
      });
      const payload = await response.json() as { conversation?: { id: number }; error?: string };
      if (!response.ok || !payload.conversation) {
        toast({ title: "Message unavailable", description: payload.error ?? "This member cannot receive direct messages right now.", variant: "destructive" });
        return;
      }
      navigate(`/messages?conversation=${encodeURIComponent(String(payload.conversation.id))}`);
    } catch {
      toast({ title: "Message unavailable", description: "Could not start a conversation. Please try again.", variant: "destructive" });
    } finally {
      setMessageLoading(false);
    }
  }

  async function toggleFollow(): Promise<void> {
    if (!profile || isSelf) return;
    setFollowLoading(true);
    const currentlyRequestedOrFollowing = data?.followStatus === "accepted" || data?.followStatus === "pending";
    try {
      const response = await authenticatedFetch(`${BASE}api/users/${encodeURIComponent(profile.id)}/follow`, {
        method: currentlyRequestedOrFollowing ? "DELETE" : "POST",
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        toast({ title: "Could not update follow", description: payload.error ?? "Please try again.", variant: "destructive" });
        return;
      }
      await loadProfile();
    } catch {
      toast({ title: "Could not update follow", description: "Please try again.", variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  }

  async function reportMember(): Promise<void> {
    if (!profile || isSelf) return;
    const description = window.prompt("Tell us what needs review (optional):");
    if (description === null) return;
    try {
      const response = await authenticatedFetch(`${BASE}api/content-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "user", targetId: profile.id, reason: "other", description: description.trim() || undefined }),
      });
      if (!response.ok) throw new Error("report failed");
      toast({ title: "Report submitted", description: "Thank you. Our moderation team will review it." });
    } catch {
      toast({ title: "Could not submit report", description: "Please try again.", variant: "destructive" });
    }
  }

  async function blockMember(): Promise<void> {
    if (!profile || isSelf || !window.confirm(`Block ${profileName}? Their Community content and profile will no longer be available to you.`)) return;
    try {
      const response = await authenticatedFetch(`${BASE}api/users/${encodeURIComponent(profile.id)}/block`, { method: "POST" });
      if (!response.ok) throw new Error("block failed");
      toast({ title: "Member blocked", description: "Their profile and Community content are now hidden." });
      navigate("/community");
    } catch {
      toast({ title: "Could not block member", description: "Please try again.", variant: "destructive" });
    }
  }

  async function addProfileTag(): Promise<void> {
    if (!profile || isSelf || !tagText.trim()) return;
    setTagLoading(true);
    try {
      const response = await authenticatedFetch(`${BASE}api/users/${encodeURIComponent(profile.id)}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tagText.trim() }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        toast({ title: "Could not add profile note", description: payload.error ?? "Please try again.", variant: "destructive" });
        return;
      }
      setTagText("");
      setActiveTab("notes");
      await loadProfile();
    } catch {
      toast({ title: "Could not add profile note", description: "Please try again.", variant: "destructive" });
    } finally {
      setTagLoading(false);
    }
  }

  async function deleteProfileTag(tagId: string): Promise<void> {
    try {
      const response = await authenticatedFetch(`${BASE}api/profile-tags/${encodeURIComponent(tagId)}`, { method: "DELETE" });
      if (!response.ok) {
        toast({ title: "Could not remove profile note", description: "Please try again.", variant: "destructive" });
        return;
      }
      setData((current) => current ? { ...current, tags: (current.tags ?? []).filter((tag) => tag.id !== tagId) } : current);
    } catch {
      toast({ title: "Could not remove profile note", description: "Please try again.", variant: "destructive" });
    }
  }

  if (loading) {
    return <main className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#CA922B]" /></main>;
  }
  if (!profile) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-[#CA922B]" />
        <h1 className="mt-4 font-serif text-3xl font-bold text-[#2B1507]">Profile unavailable</h1>
        <p className="mt-3 text-[#3A1F0E]/65">This member profile is unavailable or you do not have permission to view it.</p>
        <Link href="/community" className="mt-6 inline-flex rounded-xl bg-[#2B1507] px-4 py-2.5 font-semibold text-white">Return to Community</Link>
      </main>
    );
  }

  const followLabel = data?.followStatus === "accepted" ? "Following" : data?.followStatus === "pending" ? "Requested" : "Follow";
  const tabClass = (tab: ProfileTab): string => `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${activeTab === tab ? "bg-[#2B1507] text-white" : "text-[#3A1F0E]/60 hover:bg-[#FAF6EF] hover:text-[#2B1507]"}`;
  const mediaPosts = posts.filter((post) => (post.mediaUrls?.length ?? 0) > 0 || (post.privateMedia?.length ?? 0) > 0);
  const visiblePosts = activeTab === "media" ? mediaPosts : activeTab === "tagged" ? taggedPosts : posts;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Link href="/community" className="text-sm font-semibold text-[#8D5C17] hover:underline">← Community</Link>
      <section aria-label="Member profile" className="mt-5 overflow-hidden rounded-3xl border border-[#3A1F0E]/10 bg-white shadow-sm">
        <div className="relative h-24 overflow-hidden bg-gradient-to-r from-[#2B1507] to-[#6B3D17]">
          {coverUrl && data?.canSeeContent ? <img src={coverUrl} alt="" className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="px-5 pb-7 sm:px-6">
          <div className="-mt-11 flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#CA922B] text-xl font-bold text-white">
                {profile.profileImageUrl ? <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" /> : initialsFor(profile)}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="truncate font-serif text-2xl font-bold text-[#2B1507]">{profileName}</h1>
                {profile.username ? <p className="truncate text-sm text-[#3A1F0E]/55">@{profile.username}</p> : null}
              </div>
            </div>
            {isSelf ? (
              <Link href="/profile" className="inline-flex items-center gap-2 rounded-xl border border-[#2B1507]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#2B1507] hover:bg-[#FAF6EF]">Edit my profile</Link>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void toggleFollow()} disabled={followLoading} aria-label={`${followLabel} ${profileName}`} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${data?.followStatus === "accepted" ? "border border-[#2B1507]/15 bg-white text-[#2B1507] hover:bg-[#FAF6EF]" : "bg-[#2B1507] text-white hover:bg-[#3A1F0E]"}`}>
                  {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : data?.followStatus === "accepted" ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {followLabel}
                </button>
                {data?.canReceiveDirectMessages ? (
                  <button type="button" onClick={() => void startMessage()} disabled={messageLoading} className="inline-flex items-center gap-2 rounded-xl border border-[#2B1507]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#2B1507] hover:bg-[#FAF6EF] disabled:opacity-60">
                    {messageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} Message
                  </button>
                ) : null}
              </div>
            )}
          </div>
          {profile.bio ? <p className="mt-5 max-w-2xl leading-7 text-[#3A1F0E]/75">{profile.bio}</p> : null}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#3A1F0E]/60">
            {profile.jobTitle || profile.industry ? <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-[#CA922B]" />{[profile.jobTitle, profile.industry].filter(Boolean).join(" · ")}</span> : null}
            {profile.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#CA922B]" />{profile.location}</span> : null}
            {profile.age ? <span>{profile.age} years old</span> : null}
            {profile.birthday ? <span className="inline-flex items-center gap-1.5"><Gift className="h-4 w-4 text-[#CA922B]" />{profile.birthday}</span> : null}
            {joined ? <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-[#CA922B]" />Member since {joined}</span> : null}
            {data?.canSeeContent && typeof data?.followersCount === "number" && typeof data.followingCount === "number" ? <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-[#CA922B]" />{data.followersCount} followers · {data.followingCount} following</span> : null}
          </div>
          {(data?.badges ?? []).length ? <div className="mt-4 flex flex-wrap gap-2" aria-label="Earned profile badges">{data!.badges!.slice(0, 6).map((badge) => <span key={`${badge.achievementType}-${badge.earnedAt ?? "earned"}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#CA922B]/10 px-3 py-1.5 text-xs font-semibold capitalize text-[#8D5C17]"><Award className="h-3.5 w-3.5" />{badge.achievementType.replace(/[_-]+/g, " ")}</span>)}</div> : null}
        </div>
      </section>

      {!isSelf ? <div className="mt-3 flex flex-wrap gap-3 px-1 text-xs font-semibold">
        <button type="button" onClick={() => void reportMember()} className="inline-flex items-center gap-1.5 text-[#8D5C17] hover:underline"><Flag className="h-3.5 w-3.5" />Report profile</button>
        <button type="button" onClick={() => void blockMember()} className="inline-flex items-center gap-1.5 text-[#9F1D1D] hover:underline"><ShieldAlert className="h-3.5 w-3.5" />Block member</button>
      </div> : null}

      {!data?.canSeeContent ? (
        <section className="mt-6 rounded-2xl border border-dashed border-[#3A1F0E]/20 bg-[#FFFDF9] p-6 text-center">
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">This profile is private</h2>
          <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/65">Follow requests must be accepted before member activity, reviews, and profile notes are shown.</p>
        </section>
      ) : (
        <>
          {!isSelf ? (
            <section aria-label="Add a profile note" className="mt-6 rounded-2xl border border-[#3A1F0E]/10 bg-white p-4">
              <label htmlFor="profile-note" className="text-sm font-semibold text-[#2B1507]">Leave a kind profile note</label>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <textarea id="profile-note" value={tagText} onChange={(event) => setTagText(event.target.value)} maxLength={280} rows={2} placeholder={`Say something kind about ${profileName}`} className="min-h-20 flex-1 rounded-xl border border-[#3A1F0E]/15 bg-[#FFFDF9] px-3 py-2 text-sm text-[#2B1507] outline-none focus:border-[#CA922B]" />
                <button type="button" onClick={() => void addProfileTag()} disabled={!tagText.trim() || tagLoading} className="self-end rounded-xl bg-[#CA922B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B38024] disabled:cursor-not-allowed disabled:opacity-60 sm:self-stretch">
                  {tagLoading ? "Saving…" : "Add note"}
                </button>
              </div>
            </section>
          ) : null}

          <section aria-label="Profile activity" className="mt-6 rounded-2xl border border-[#3A1F0E]/10 bg-white p-3 sm:p-4">
            <div role="tablist" aria-label="Member profile sections" className="flex flex-wrap gap-1">
              <button type="button" role="tab" aria-selected={activeTab === "posts"} onClick={() => setActiveTab("posts")} className={tabClass("posts")}>Posts</button>
              <button type="button" role="tab" aria-selected={activeTab === "media"} onClick={() => setActiveTab("media")} className={tabClass("media")}>Media</button>
              <button type="button" role="tab" aria-selected={activeTab === "tagged"} onClick={() => setActiveTab("tagged")} className={tabClass("tagged")}>Tagged</button>
              <button type="button" role="tab" aria-selected={activeTab === "reviews"} onClick={() => setActiveTab("reviews")} className={tabClass("reviews")}>Reviews</button>
              <button type="button" role="tab" aria-selected={activeTab === "notes"} onClick={() => setActiveTab("notes")} className={tabClass("notes")}>Profile notes</button>
            </div>

            {["posts", "media", "tagged"].includes(activeTab) ? (
              <div role="tabpanel" className="mt-4 space-y-3">
                {visiblePosts.length ? visiblePosts.map((post) => <ProfileCommunityPost key={post.id} post={post} />) : <p className="rounded-xl bg-[#FFFDF9] p-5 text-sm text-[#3A1F0E]/55">{activeTab === "tagged" ? "No visible tagged Community activity yet." : activeTab === "media" ? "No visible photos or videos yet." : "No visible Community activity yet."}</p>}
              </div>
            ) : null}

            {activeTab === "reviews" ? (
              <div role="tabpanel" className="mt-4 space-y-3">
                {(data.reviews ?? []).length ? data.reviews!.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-[#3A1F0E]/10 bg-[#FFFDF9] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#8D5C17]" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(Math.min(5, Math.max(0, review.rating)))}</p>
                      {dateLabel(review.createdAt) ? <p className="text-xs text-[#3A1F0E]/45">{dateLabel(review.createdAt)}</p> : null}
                    </div>
                    {review.text ? <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/75">{review.text}</p> : null}
                    <Link href={`/businesses/${encodeURIComponent(review.businessId)}`} className="mt-3 inline-block text-xs font-semibold text-[#8D5C17] hover:underline">View business</Link>
                  </article>
                )) : <p className="rounded-xl bg-[#FFFDF9] p-5 text-sm text-[#3A1F0E]/55">No visible reviews yet.</p>}
              </div>
            ) : null}

            {activeTab === "notes" ? (
              <div role="tabpanel" className="mt-4 space-y-3">
                {(data.tags ?? []).length ? data.tags!.map((tag) => (
                  <article key={tag.id} className="rounded-2xl border border-[#3A1F0E]/10 bg-[#FFFDF9] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm leading-6 text-[#3A1F0E]/75">{tag.content}</p>
                        <p className="mt-2 text-xs text-[#3A1F0E]/45">{[tag.taggerFirstName, tag.taggerLastName].filter(Boolean).join(" ") || tag.taggerUsername || "Community member"}{relativeTime(tag.createdAt) ? ` · ${relativeTime(tag.createdAt)}` : ""}</p>
                      </div>
                      {canManageProfileTag(tag) ? <button type="button" onClick={() => void deleteProfileTag(tag.id)} className="shrink-0 text-xs font-semibold text-[#8D5C17] hover:underline">Remove</button> : null}
                    </div>
                  </article>
                )) : <p className="rounded-xl bg-[#FFFDF9] p-5 text-sm text-[#3A1F0E]/55">No visible profile notes yet.</p>}
              </div>
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}
