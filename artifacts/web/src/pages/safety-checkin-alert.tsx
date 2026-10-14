import { ArrowLeft, Loader2, Lock, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL;

type ReceivedCheckinAlert = {
  notificationId: string;
  title: string;
  body: string;
  status: "overdue" | "resolved";
  privacy: string;
};

export default function SafetyCheckinAlert() {
  const [, params] = useRoute("/safety/checkins/received/:notificationId");
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const [alert, setAlert] = useState<ReceivedCheckinAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notificationId = params?.notificationId;

  useEffect(() => {
    let active = true;
    if (!auth?.user || !notificationId) return;
    const receivedAlertUrl = `${BASE}api/safety/checkins/received/${encodeURIComponent(notificationId)}`;
    const markReadUrl = `${BASE}api/notifications/${encodeURIComponent(notificationId)}/read`;
    async function load() {
      try {
        const response = await fetch(
          receivedAlertUrl,
          { credentials: "include" },
        );
        if (!response.ok) throw new Error("This Safety Check-In alert is unavailable.");
        const payload = await response.json() as { alert?: ReceivedCheckinAlert };
        if (!payload.alert) throw new Error("This Safety Check-In alert is unavailable.");
        if (!active) return;
        setAlert(payload.alert);
        setError(null);
        fetch(markReadUrl, {
          method: "POST",
          credentials: "include",
        }).catch(() => {});
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "This Safety Check-In alert is unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [auth?.user, notificationId]);

  if (authLoading || loading) {
    return (
      <main className="min-h-[65vh] flex flex-col items-center justify-center gap-3 text-[#3A1F0E]/60">
        <Loader2 className="w-6 h-6 animate-spin text-[#CA922B]" />
        <p className="text-sm">Loading a private Safety Check-In alert…</p>
      </main>
    );
  }

  const overdue = alert?.status === "overdue";
  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Link href="/notifications" className="inline-flex items-center gap-2 text-sm text-[#3A1F0E]/60 hover:text-[#3A1F0E] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to notifications
        </Link>

        {!alert || error ? (
          <section className="bg-white rounded-3xl border border-[#3A1F0E]/10 p-8 text-center shadow-[0_4px_16px_rgba(43,21,7,0.04)]">
            <Shield className="w-8 h-8 mx-auto text-[#3A1F0E]/35 mb-3" />
            <h1 className="font-serif text-2xl font-bold text-[#2B1507]">Alert unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-[#3A1F0E]/60">{error ?? "This Safety Check-In alert is not available for this account."}</p>
          </section>
        ) : (
          <div className="space-y-4">
            <section className={`rounded-3xl border p-6 ${overdue ? "border-amber-700/25 bg-amber-50" : "border-emerald-700/25 bg-emerald-50"}`}>
              <div className="flex gap-4 items-start">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${overdue ? "bg-amber-700/10 text-amber-800" : "bg-emerald-700/10 text-emerald-800"}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wide ${overdue ? "text-amber-800" : "text-emerald-800"}`}>
                    {overdue ? "Check-In overdue" : "Check-In resolved"}
                  </p>
                  <h1 className="mt-1 font-serif text-2xl font-bold text-[#2B1507]">{alert.title}</h1>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-[#3A1F0E]/10 p-6 shadow-[0_4px_16px_rgba(43,21,7,0.04)]">
              <p className="text-base leading-7 text-[#2B1507]">{alert.body}</p>
            </section>

            <section className="bg-[#F0E8D9] rounded-3xl border border-[#3A1F0E]/10 p-5 flex gap-3 items-start">
              <Lock className="w-5 h-5 text-[#A86D12] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-sm text-[#2B1507]">Privacy boundary</h2>
                <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/65">{alert.privacy}</p>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-[#3A1F0E]/10 p-6 shadow-[0_4px_16px_rgba(43,21,7,0.04)]">
              <h2 className="font-serif text-lg font-bold text-[#2B1507]">What to do</h2>
              <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/65">
                If appropriate, use an ordinary contact method you already have to check in with the trusted member. This alert does not contact emergency services or reveal where anyone is.
              </p>
              <Link href="/safety">
                <Button className="mt-5 rounded-full bg-[#CA922B] hover:bg-[#A86D12] text-white">Open Safety Hub</Button>
              </Link>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
