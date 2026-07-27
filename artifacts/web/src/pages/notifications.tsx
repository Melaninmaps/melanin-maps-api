import { useEffect, useState } from "react";
import { Bell, CheckCheck, Megaphone, Star, Shield, Users, ArrowLeft } from "lucide-react";
import { Link, Redirect } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL;

interface Notification {
  id: string;
  type: "system" | "review" | "safety" | "community" | "promo";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG = {
  system: { icon: Bell, color: "text-blue-600", bg: "bg-blue-50" },
  review: { icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
  safety: { icon: Shield, color: "text-red-600", bg: "bg-red-50" },
  community: { icon: Users, color: "text-green-600", bg: "bg-green-50" },
  promo: { icon: Megaphone, color: "text-[#CA922B]", bg: "bg-[#CA922B]/10" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Notifications() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!auth?.user) return;
    setLoading(true);
    fetch(`${BASE}api/notifications`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth]);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch(`${BASE}api/notifications/mark-all-read`, {
        method: "POST",
        credentials: "include",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
    setMarkingAll(false);
  }

  async function markRead(id: string) {
    try {
      await fetch(`${BASE}api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {}
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!auth?.user) return <Redirect to="/login" />;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <div className="container mx-auto px-4 max-w-2xl py-10">
        <Link href="/profile">
          <button className="flex items-center gap-2 text-[#3A1F0E]/60 hover:text-[#3A1F0E] text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#CA922B]" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#2B1507]">Notifications</h1>
              {unread > 0 && (
                <p className="text-sm text-[#3A1F0E]/60">{unread} unread</p>
              )}
            </div>
          </div>
          {unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              disabled={markingAll}
              className="rounded-full border-[#3A1F0E]/20 text-[#3A1F0E]/70 text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#3A1F0E]/10 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#3A1F0E]/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#3A1F0E]/10 rounded w-3/4" />
                    <div className="h-3 bg-[#3A1F0E]/10 rounded w-full" />
                    <div className="h-3 bg-[#3A1F0E]/10 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#3A1F0E]/10 shadow-[0_4px_16px_rgba(43,21,7,0.04)]">
            <div className="w-16 h-16 bg-[#CA922B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-[#CA922B]/50" />
            </div>
            <h2 className="text-lg font-serif font-bold text-[#2B1507] mb-2">All caught up!</h2>
            <p className="text-sm text-[#3A1F0E]/60 mb-6 max-w-xs mx-auto">
              You have no notifications right now. We'll let you know when something needs your attention.
            </p>
            <Link href="/explore">
              <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-6">
                Explore the Directory
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
              const Icon = cfg.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`w-full text-left bg-white rounded-2xl p-4 border transition-all hover:shadow-sm ${
                    n.read
                      ? "border-[#3A1F0E]/10 opacity-70"
                      : "border-[#CA922B]/20 shadow-[0_2px_8px_rgba(202,146,43,0.06)]"
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-4.5 h-4.5 ${cfg.color}`} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold leading-snug ${n.read ? "text-[#3A1F0E]/60" : "text-[#2B1507]"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#CA922B] shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-[#3A1F0E]/60 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-[#3A1F0E]/40 mt-1.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
