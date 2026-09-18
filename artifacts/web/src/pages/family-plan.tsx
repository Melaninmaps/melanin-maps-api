import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, CreditCard, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL;

type FamilyPlanData = {
  tier: string;
  tierDisplay: string;
  limits: {
    familySeatsIncluded: number;
    addOnSeatPriceCents: number;
    addOnSeatPriceDisplay: string;
  };
  family: {
    circleName: string | null;
    totalCapacity: number;
    seatsUsed: number;
    seatsAvailable: number;
    addOnSeats: number;
  };
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * This is the web-only checkout entry for an additional family seat. The
 * request runs under the existing website session, and only this website page
 * redirects to the server-generated Stripe Checkout URL.
 */
export default function FamilyPlan() {
  const [plan, setPlan] = useState<FamilyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/membership/plan`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Could not load membership details.");
      setPlan((await response.json()) as FamilyPlanData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load membership details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  async function addSeat() {
    setCheckoutLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE}api/membership/family/add-seat`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? "Could not start secure checkout.");
      }
      window.location.assign(data.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start secure checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#CA922B]" /></div>;
  }

  if (!plan) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-[#3A1F0E]/10 bg-white p-8 text-center">
          <h1 className="font-serif text-2xl font-bold text-[#2B1507]">Family plan unavailable</h1>
          <p className="mt-3 text-sm text-[#3A1F0E]/65">{error ?? "Please sign in to manage your membership."}</p>
          <Link href="/membership"><Button className="mt-6 rounded-full bg-[#CA922B] text-white hover:bg-[#B38024]">View membership options</Button></Link>
        </div>
      </main>
    );
  }

  const canAddSeat = plan.limits.familySeatsIncluded > 0 && plan.limits.addOnSeatPriceCents > 0;

  return (
    <main className="min-h-screen bg-[#FAF6EF] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-[#3A1F0E]/60 hover:text-[#2B1507]">
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>
        <header className="mt-7 rounded-3xl bg-[#2B1507] p-7 text-white">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-[#CA922B]/20 p-3"><Users className="h-6 w-6 text-[#CA922B]" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#F5EBD8]/60">{plan.tierDisplay}</p>
              <h1 className="mt-1 font-serif text-3xl font-bold">Family membership</h1>
              <p className="mt-2 text-sm leading-6 text-[#F5EBD8]/75">Manage seats from the secure Mapping with Melanin website.</p>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-[#3A1F0E]/10 bg-white p-6">
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">Your seats</h2>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-[#FAF6EF] px-3 py-4"><p className="text-2xl font-bold text-[#2B1507]">{plan.family.totalCapacity}</p><p className="mt-1 text-xs text-[#3A1F0E]/60">Available capacity</p></div>
            <div className="rounded-2xl bg-[#FAF6EF] px-3 py-4"><p className="text-2xl font-bold text-[#2B1507]">{plan.family.seatsUsed}</p><p className="mt-1 text-xs text-[#3A1F0E]/60">Seats in use</p></div>
            <div className="rounded-2xl bg-[#FAF6EF] px-3 py-4"><p className="text-2xl font-bold text-[#2B1507]">{plan.family.seatsAvailable}</p><p className="mt-1 text-xs text-[#3A1F0E]/60">Open seats</p></div>
          </div>
          {plan.family.circleName ? <p className="mt-4 text-sm text-[#3A1F0E]/65">Family circle: <strong className="text-[#2B1507]">{plan.family.circleName}</strong></p> : null}
        </section>

        <section className="mt-6 rounded-3xl border border-[#CA922B]/25 bg-[#FFF8EC] p-6">
          <div className="flex items-start gap-3"><CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#8D5C17]" /><div><h2 className="font-serif text-xl font-bold text-[#2B1507]">Add a family seat</h2><p className="mt-2 text-sm leading-6 text-[#3A1F0E]/65">Additional seats are managed through secure website checkout. Your membership and existing family access remain active while you complete it.</p></div></div>
          {canAddSeat ? <><p className="mt-5 text-sm font-semibold text-[#2B1507]">{formatMoney(plan.limits.addOnSeatPriceCents)} per month for each additional seat</p><Button onClick={() => void addSeat()} disabled={checkoutLoading} className="mt-4 w-full rounded-full bg-[#CA922B] text-white hover:bg-[#B38024]">{checkoutLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening secure checkout…</> : <>Add a seat on the website</>}</Button></> : <div className="mt-5 rounded-xl bg-white p-4 text-sm text-[#3A1F0E]/65"><CheckCircle className="mr-2 inline h-4 w-4 text-[#2D7A4F]" />Additional seats are not available on this membership. <Link href="/membership" className="font-semibold text-[#8D5C17] underline">Review membership options</Link>.</div>}
          {error ? <p role="alert" className="mt-3 text-sm text-[#9F2F17]">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
