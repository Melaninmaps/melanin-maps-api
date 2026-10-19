import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Users } from "lucide-react";
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

export default function FamilyPlan() {
  const [plan, setPlan] = useState<FamilyPlanData | null>(null);
  const [loading, setLoading] = useState(true);
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
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load membership details.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#CA922B]" />
      </div>
    );
  }

  if (!plan) {
    return (
      <main className="min-h-screen bg-[#FAF6EF] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-[#3A1F0E]/10 bg-white p-8 text-center">
          <h1 className="font-serif text-2xl font-bold text-[#2B1507]">
            Family plan unavailable
          </h1>
          <p className="mt-3 text-sm text-[#3A1F0E]/65">
            {error ?? "Please sign in to view membership status."}
          </p>
          <Link href="/membership">
            <Button className="mt-6 rounded-full bg-[#CA922B] text-white hover:bg-[#B38024]">
              View membership status
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const hasAdditionalSeatCatalogReference =
    plan.limits.familySeatsIncluded > 0 && plan.limits.addOnSeatPriceCents > 0;

  return (
    <main className="min-h-screen bg-[#FAF6EF] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-[#3A1F0E]/60 hover:text-[#2B1507]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>
        <header className="mt-7 rounded-3xl bg-[#2B1507] p-7 text-white">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-[#CA922B]/20 p-3">
              <Users className="h-6 w-6 text-[#CA922B]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#F5EBD8]/60">
                {plan.tierDisplay}
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold">
                Family membership
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#F5EBD8]/75">
                Review existing family seats and verified membership access.
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-[#3A1F0E]/10 bg-white p-6">
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">
            Your seats
          </h2>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-[#FAF6EF] px-3 py-4">
              <p className="text-2xl font-bold text-[#2B1507]">
                {plan.family.totalCapacity}
              </p>
              <p className="mt-1 text-xs text-[#3A1F0E]/60">
                Available capacity
              </p>
            </div>
            <div className="rounded-2xl bg-[#FAF6EF] px-3 py-4">
              <p className="text-2xl font-bold text-[#2B1507]">
                {plan.family.seatsUsed}
              </p>
              <p className="mt-1 text-xs text-[#3A1F0E]/60">Seats in use</p>
            </div>
            <div className="rounded-2xl bg-[#FAF6EF] px-3 py-4">
              <p className="text-2xl font-bold text-[#2B1507]">
                {plan.family.seatsAvailable}
              </p>
              <p className="mt-1 text-xs text-[#3A1F0E]/60">Open seats</p>
            </div>
          </div>
          {plan.family.circleName ? (
            <p className="mt-4 text-sm text-[#3A1F0E]/65">
              Family circle:{" "}
              <strong className="text-[#2B1507]">
                {plan.family.circleName}
              </strong>
            </p>
          ) : null}
        </section>

        <section
          role="status"
          className="mt-6 rounded-3xl border border-[#CA922B]/25 bg-[#FFF8EC] p-6"
        >
          <h2 className="font-serif text-xl font-bold text-[#2B1507]">
            Additional family seats
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/65">
            Additional family-seat enrollment is unavailable. Existing family
            seats and verified access remain active. / La inscripción de
            asientos familiares adicionales no está disponible. Los asientos
            familiares existentes y el acceso verificado permanecen activos.
          </p>
          {hasAdditionalSeatCatalogReference ? (
            <p className="mt-5 rounded-xl bg-white p-4 text-sm leading-6 text-[#3A1F0E]/65">
              {plan.limits.addOnSeatPriceDisplay} is an approved catalog
              reference only; no payment, trial, membership access, or listing
              upgrade starts here. / {plan.limits.addOnSeatPriceDisplay} es solo
              una referencia de catálogo aprobada; aquí no se inicia ningún
              pago, prueba, acceso de membresía ni mejora de listado.
            </p>
          ) : (
            <p className="mt-5 rounded-xl bg-white p-4 text-sm text-[#3A1F0E]/65">
              This membership has no additional-seat catalog reference.{" "}
              <Link
                href="/membership"
                className="font-semibold text-[#8D5C17] underline"
              >
                View membership status
              </Link>
              .
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
