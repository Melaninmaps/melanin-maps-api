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
  data?: { officialUrl?: string; disclaimer?: string };
}

type OptionalOfficialAlertPreferences = {
  notifProductRecalls: boolean;
  notifPublicHealthAlerts: boolean;
};

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
  const [officialAlerts, setOfficialAlerts] = useState<OptionalOfficialAlertPreferences>({
    notifProductRecalls: false,
    notifPublicHealthAlerts: false,
  });
  const [savingOfficialAlerts, setSavingOfficialAlerts] = useState(false);

  useEffect(() => {
    if (!auth?.user) return;
    setLoading(true);
    Promise.all([
      fetch(`${BASE}api/notifications`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${BASE}api/users/settings`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([notificationData, settings]) => {
        setNotifications(notificationData.notifications ?? []);
        setOfficialAlerts({
          notifProductRecalls: settings.notifProductRecalls === true,
          notifPublicHealthAlerts: settings.notifPublicHealthAlerts === true,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth]);

  async function updateOfficialAlertPreference(key: keyof OptionalOfficialAlertPreferences) {
    if (savingOfficialAlerts) return;
    const next = { ...officialAlerts, [key]: !officialAlerts[key] };
    setOfficialAlerts(next);
    setSavingOfficialAlerts(true);
    try {
      const response = await fetch(`${BASE}api/users/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("Unable to update optional alert preferences");
    } catch {
      setOfficialAlerts((current) => ({ ...current, [key]: !next[key] }));
    } finally {
      setSavingOfficialAlerts(false);
    }
  }

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

        <section className="bg-white rounded-2xl p-4 border border-[#3A1F0E]/10 mb-5" aria-labelledby="official-alerts-heading">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#CA922B]/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#CA922B]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="official-alerts-heading" className="text-sm font-bold text-[#2B1507]">Optional official alerts</h2>
              <p className="text-xs text-[#3A1F0E]/60 mt-1 leading-relaxed">
                Choose whether to receive official product recalls or public-health notices. These notices are not medical advice, and you can turn either one off at any time.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 mt-3">
                {([
                  ["notifProductRecalls", "Product recalls"],
                  ["notifPublicHealthAlerts", "Public-health alerts"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    disabled={savingOfficialAlerts}
                    onClick={() => void updateOfficialAlertPreference(key)}
                    aria-pressed={officialAlerts[key]}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      officialAlerts[key]
                        ? "border-[#CA922B] bg-[#CA922B]/10 text-[#2B1507]"
                        : "border-[#3A1F0E]/15 text-[#3A1F0E]/60 hover:border-[#CA922B]/50"
                    }`}
                  >
                    {officialAlerts[key] ? "On · " : "Off · "}{label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

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
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  onKeyDown={(event) => {
                    if (!n.read && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      void markRead(n.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
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
                      {n.data?.officialUrl && (
                        <a
                          href={n.data.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-block text-xs font-semibold text-[#A86D12] hover:underline mt-2"
                        >
                          Open official source
                        </a>
                      )}
                      {n.data?.disclaimer && (
                        <p className="text-[10px] text-[#3A1F0E]/45 mt-1">{n.data.disclaimer}</p>
                      )}
                      <p className="text-[10px] text-[#3A1F0E]/40 mt-1.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
