import { useCallback, useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Image as ImageIcon, Lock, MapPin, MessageSquare, Users } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { CommunityMedia } from "@/components/community/CommunityMedia";

const BASE = import.meta.env.BASE_URL;

type Group = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  memberCount: number;
  maxMembers: number;
  city: string | null;
  state: string | null;
  isPrivate: boolean;
  isMember: boolean;
};

type GroupMember = {
  userId: string;
  role: string;
  joinedAt: string;
};

type GroupPost = {
  id: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  createdAt: string;
  mediaUrls?: string[];
  commentsCount: number;
};

function normalizeMediaUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && /^https?:\/\//i.test(item)).slice(0, 5);
  }
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return [value];
  return [];
}

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * A dedicated member-only Group destination. The Group metadata and Group feed
 * are loaded together; a 404 on the Group feed means current membership is no
 * longer valid and no posts or media are rendered.
 */
export default function CommunityGroup() {
  const [, params] = useRoute("/community/groups/:id");
  const groupId = params?.id && /^\d+$/.test(params.id) ? Number(params.id) : null;
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const load = useCallback(async () => {
    if (!groupId) {
      setUnavailable(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setUnavailable(false);
    try {
      const [groupResponse, postsResponse] = await Promise.all([
        authenticatedFetch(`${BASE}api/groups/${encodeURIComponent(String(groupId))}`),
        authenticatedFetch(`${BASE}api/community/posts?groupId=${encodeURIComponent(String(groupId))}`),
      ]);

      // The posts endpoint performs the authoritative active-membership check.
      if (!groupResponse.ok || !postsResponse.ok) {
        setUnavailable(true);
        return;
      }

      const groupPayload = await groupResponse.json() as { group?: Group; members?: GroupMember[] };
      const postsPayload = await postsResponse.json() as { posts?: Array<Record<string, unknown>> };
      if (!groupPayload.group?.isMember) {
        setUnavailable(true);
        return;
      }

      setGroup(groupPayload.group);
      setMembers(groupPayload.members ?? []);
      setPosts((postsPayload.posts ?? []).map((post) => ({
        id: String(post.id),
        authorName: typeof post.authorName === "string" ? post.authorName : "Community Member",
        authorInitials: typeof post.authorInitials === "string" ? post.authorInitials : "CM",
        authorColor: typeof post.authorColor === "string" ? post.authorColor : "#CA922B",
        content: typeof post.content === "string" ? post.content : "",
        createdAt: typeof post.createdAt === "string" ? post.createdAt : new Date().toISOString(),
        mediaUrls: normalizeMediaUrls(post.mediaUrls),
        commentsCount: typeof post.commentsCount === "number" ? post.commentsCount : 0,
      })));
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <main className="min-h-screen bg-[#FAF6EF] px-4 py-20 text-center text-sm text-[#3A1F0E]/60">Loading group…</main>;
  }

  if (unavailable || !group) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] px-4 py-20 text-center">
        <Lock className="mx-auto h-9 w-9 text-[#CA922B]/60" />
        <h1 className="mt-4 font-serif text-xl font-bold text-[#2B1507]">This group is not available</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#3A1F0E]/60">Only current members can open a group’s posts, media, and member information.</p>
        <Link href="/community/groups" className="mt-5 inline-flex rounded-full bg-[#CA922B] px-4 py-2 text-sm font-bold text-white">Back to My Groups</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF6EF] pb-12">
      <header className="bg-[#2B1507] px-4 py-8 text-white">
        <div className="mx-auto max-w-2xl">
          <Link href="/community/groups" className="inline-flex items-center gap-1 text-sm font-semibold text-[#F5EBD8]/75 hover:text-white"><ArrowLeft className="h-4 w-4" /> My Groups</Link>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><h1 className="font-serif text-3xl font-bold">{group.name}</h1>{group.isPrivate ? <Lock className="h-4 w-4 text-[#F0CF63]" aria-label="Private group" /> : null}</div>
              {group.description ? <p className="mt-2 max-w-xl text-sm leading-6 text-[#F5EBD8]/75">{group.description}</p> : null}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#F5EBD8]/65">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {group.memberCount} members</span>
                {group.city || group.state ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[group.city, group.state].filter(Boolean).join(", ")}</span> : null}
                <span className="rounded-full bg-white/10 px-2 py-0.5 capitalize">{group.category}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-2xl gap-5 px-4 py-6 md:grid-cols-[minmax(0,1fr)_210px]">
        <section aria-labelledby="group-posts-heading" className="space-y-3">
          <div className="flex items-center justify-between"><h2 id="group-posts-heading" className="font-serif text-xl font-bold text-[#2B1507]">Group Posts</h2><span className="text-xs font-semibold text-[#3A1F0E]/45">Members only</span></div>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-[#3A1F0E]/8 bg-white p-7 text-center"><MessageSquare className="mx-auto h-7 w-7 text-[#CA922B]/50" /><p className="mt-3 text-sm font-semibold text-[#3A1F0E]/65">No group posts yet</p><p className="mt-1 text-xs text-[#3A1F0E]/45">The first member post will appear here.</p></div>
          ) : posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-2xl border border-[#3A1F0E]/8 bg-white">
              <div className="flex items-center gap-3 px-4 pt-4"><div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: post.authorColor }}>{post.authorInitials}</div><div><p className="text-sm font-bold text-[#2B1507]">{post.authorName}</p><p className="text-xs text-[#3A1F0E]/45">{timeAgo(post.createdAt)}</p></div></div>
              <p className="whitespace-pre-wrap px-4 py-3 text-sm leading-6 text-[#3A1F0E]">{post.content}</p>
              {post.mediaUrls?.length ? <div className="grid grid-cols-2 gap-1 px-4 pb-4">{post.mediaUrls.map((url, index) => <CommunityMedia key={url} url={url} index={index} />)}</div> : null}
              <div className="flex items-center gap-1 border-t border-[#3A1F0E]/7 px-4 py-3 text-xs text-[#3A1F0E]/50"><MessageSquare className="h-3.5 w-3.5" /> {post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}</div>
            </article>
          ))}
        </section>

        <aside aria-labelledby="group-members-heading" className="h-fit rounded-2xl border border-[#3A1F0E]/8 bg-white p-4">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-[#CA922B]" /><h2 id="group-members-heading" className="font-serif text-lg font-bold text-[#2B1507]">Members</h2></div>
          <p className="mt-1 text-xs leading-5 text-[#3A1F0E]/50">Visible only inside this group.</p>
          <ul className="mt-3 space-y-2">{members.map((member, index) => <li key={member.userId} className="flex items-center gap-2 text-sm text-[#3A1F0E]/75"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#CA922B]/12 text-[10px] font-bold text-[#CA922B]">{index + 1}</span><span className="capitalize">{member.role}</span></li>)}</ul>
          {members.length === 0 ? <p className="mt-3 text-xs text-[#3A1F0E]/45">Member details are not available yet.</p> : null}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-[#3A1F0E]/45"><ImageIcon className="h-3.5 w-3.5" /> Posts and shared media stay within this group.</div>
        </aside>
      </div>
    </main>
  );
}
