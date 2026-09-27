import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Loader2, MapPin, MessageCircle, ShieldAlert, Star, UserPlus } from "lucide-react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

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
  createdAt: string | null;
  memberType: string | null;
};

type Review = { id: string; businessId: string; rating: number; text: string | null; createdAt: string | null };
type ProfileTag = { id: string; content: string; createdAt: string | null; taggerFirstName: string | null; taggerLastName: string | null; taggerUsername: string | null };
type ProfileResponse = {
  profile?: MemberProfile;
  user?: MemberProfile;
  reviews?: Review[];
  tags?: ProfileTag[];
  canSeeContent?: boolean;
  canReceiveDirectMessages?: boolean;
  isFollowing?: boolean;
  followStatus?: "pending" | "accepted" | null;
};

function nameFor(profile: MemberProfile): string {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username || "Community member";
}

function initialsFor(profile: MemberProfile): string {
  return `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || profile.username?.slice(0, 2).toUpperCase() || "M";
}

export default function MemberProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: auth } = useGetCurrentAuthUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    setLoading(true);
    authenticatedFetch(`${BASE}api/users/${encodeURIComponent(userId)}/profile`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<ProfileResponse> : null)
      .then((response) => setData(response))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [userId]);

  const profile = data?.profile ?? data?.user ?? null;
  const isSelf = !!profile && auth?.user?.id === profile.id;
  const joined = useMemo(() => profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null, [profile?.createdAt]);

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

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/community" className="text-sm font-semibold text-[#8D5C17] hover:underline">← Community</Link>
      <section className="mt-5 overflow-hidden rounded-3xl border border-[#3A1F0E]/10 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-[#2B1507] to-[#6B3D17]" />
        <div className="px-6 pb-7">
          <div className="-mt-11 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#CA922B] text-xl font-bold text-white">
                {profile.profileImageUrl ? <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" /> : initialsFor(profile)}
              </div>
              <div className="pb-1">
                <h1 className="font-serif text-2xl font-bold text-[#2B1507]">{nameFor(profile)}</h1>
                {profile.username ? <p className="text-sm text-[#3A1F0E]/55">@{profile.username}</p> : null}
              </div>
            </div>
            {!isSelf && data?.canReceiveDirectMessages ? (
              <button type="button" onClick={() => void startMessage()} disabled={messageLoading} className="inline-flex items-center gap-2 rounded-xl bg-[#2B1507] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {messageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} Message
              </button>
            ) : null}
          </div>
          {profile.bio ? <p className="mt-5 max-w-2xl leading-7 text-[#3A1F0E]/75">{profile.bio}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#3A1F0E]/60">
            {profile.jobTitle || profile.industry ? <span className="inline-flex items-center gap-1.5"><UserPlus className="h-4 w-4 text-[#CA922B]" />{[profile.jobTitle, profile.industry].filter(Boolean).join(" · ")}</span> : null}
            {joined ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#CA922B]" />Member since {joined}</span> : null}
          </div>
        </div>
      </section>

      {!data?.canSeeContent ? (
        <section className="mt-6 rounded-2xl border border-dashed border-[#3A1F0E]/20 bg-[#FFFDF9] p-6 text-center">
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">This profile is private</h2>
          <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/65">Follow requests must be accepted before member activity is shown.</p>
        </section>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5">
            <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#2B1507]"><Star className="h-5 w-5 text-[#CA922B]" /> Reviews</h2>
            {(data.reviews ?? []).length ? <div className="mt-4 space-y-4">{data.reviews!.map((review) => (
              <article key={review.id} className="border-t border-[#3A1F0E]/8 pt-4 first:border-0 first:pt-0">
                <p className="text-sm font-semibold text-[#8D5C17]">{"★".repeat(Math.min(5, review.rating))}</p>
                {review.text ? <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/75">{review.text}</p> : null}
                <Link href={`/businesses/${encodeURIComponent(review.businessId)}`} className="mt-2 inline-block text-xs font-semibold text-[#8D5C17] hover:underline">View business</Link>
              </article>
            ))}</div> : <p className="mt-4 text-sm text-[#3A1F0E]/55">No public reviews yet.</p>}
          </section>
          <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5">
            <h2 className="font-serif text-xl font-bold text-[#2B1507]">Profile notes</h2>
            {(data.tags ?? []).length ? <div className="mt-4 space-y-4">{data.tags!.map((tag) => (
              <article key={tag.id} className="border-t border-[#3A1F0E]/8 pt-4 first:border-0 first:pt-0">
                <p className="text-sm leading-6 text-[#3A1F0E]/75">{tag.content}</p>
                <p className="mt-1 text-xs text-[#3A1F0E]/45">{[tag.taggerFirstName, tag.taggerLastName].filter(Boolean).join(" ") || tag.taggerUsername || "Community member"}</p>
              </article>
            ))}</div> : <p className="mt-4 text-sm text-[#3A1F0E]/55">No public profile notes yet.</p>}
          </section>
        </div>
      )}
    </main>
  );
}
