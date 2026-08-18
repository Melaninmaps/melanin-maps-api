/**
 * KinfolkHairLossCarePaths — three separated care paths for hair-loss questions.
 *
 * Paths: educational context, optional dermatology, optional community hair-care.
 * Community signals are moderated evidence, never medical claims.
 *
 * Adapted for wouter (Link href=) and MWM base URL.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { GoldFeatherMark } from "@/components/brand/GoldFeatherMark";

const BASE = import.meta.env.BASE_URL;

type CarePath = {
  id: "show_dermatologists" | "show_hair_loss_stylists";
  title: string;
  question: string;
  supportingText: string;
};

type Recommendation = {
  id: string;
  name: string;
  category: string;
  city: string | null;
  stateCode: string | null;
  addressLine1: string | null;
  detailUrl: string;
  communityTrustScore: number;
  reasons: string[];
  boundary: string | null;
};

type HairLossCarePlan = {
  educationalMessage: string;
  medicalDisclaimer: string;
  sourceLinks: Array<{ title: string; url: string }>;
  optionalPaths: CarePath[];
};

export default function KinfolkHairLossCarePaths() {
  const [plan, setPlan] = useState<HairLossCarePlan | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [locationPrompt, setLocationPrompt] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}api/kinfolk/hair-loss/care-paths`, { credentials: "include" })
      .then((response) => response.json())
      .then((payload: HairLossCarePlan) => setPlan(payload))
      .catch((error: unknown) => console.error("Unable to load Kinfolk hair-loss care paths", error));
  }, []);

  async function selectPath(path: CarePath) {
    setLoadingAction(path.id);
    try {
      const response = await fetch(`${BASE}api/kinfolk/hair-loss/care-paths/${path.id}`, {
        method: "POST",
        credentials: "include",
      });
      const payload = (await response.json()) as {
        recommendations?: Recommendation[];
        locationPrompt?: string | null;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Unable to load local care options.");
      setRecommendations(payload.recommendations ?? []);
      setLocationPrompt(payload.locationPrompt ?? null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  }

  if (!plan) return null;

  return (
    <section className="mt-5 rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[#CA922B]">
        <GoldFeatherMark label="Kinfolk care paths" size={19} />
        <span className="text-xs font-bold uppercase tracking-[0.16em]">Care paths</span>
      </div>
      <p className="mt-3 leading-7 text-[#2B1507]">{plan.educationalMessage}</p>
      <p className="mt-3 text-sm italic leading-6 text-[#3A1F0E]/65">{plan.medicalDisclaimer}</p>
      <div className="mt-4 space-y-2">
        {plan.sourceLinks.map((source) => (
          <a
            className="block text-sm font-semibold text-[#8D5C17] underline"
            href={source.url}
            key={source.url}
            rel="noreferrer"
            target="_blank"
          >
            {source.title}
          </a>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {plan.optionalPaths.map((path) => (
          <article
            className="rounded-xl border border-[#CA922B]/35 bg-[#CA922B]/[0.06] p-4"
            key={path.id}
          >
            <GoldFeatherMark label={path.title} size={18} />
            <h2 className="mt-3 font-bold text-[#2B1507]">{path.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#2B1507]">{path.question}</p>
            <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/70">{path.supportingText}</p>
            <button
              className="mt-4 rounded-full border border-[#CA922B] px-4 py-2 text-sm font-semibold text-[#8D5C17] disabled:opacity-60"
              disabled={loadingAction !== null}
              onClick={() => void selectPath(path)}
              type="button"
            >
              {loadingAction === path.id ? "Checking options…" : "Show options"}
            </button>
            <p className="mt-2 text-xs text-[#3A1F0E]/55">
              This is optional. You can keep reading or continue talking with Kinfolk.
            </p>
          </article>
        ))}
      </div>

      {locationPrompt ? (
        <p className="mt-5 text-sm leading-6 text-[#3A1F0E]/70">{locationPrompt}</p>
      ) : null}

      {recommendations.length > 0 ? (
        <section aria-label="Kinfolk recommendations" className="mt-6">
          <h2 className="flex items-center gap-2 font-semibold text-[#2B1507]">
            <GoldFeatherMark label="Community-informed recommendations" size={18} />
            Why Kinfolk surfaced these options
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {recommendations.map((recommendation) => (
              <article className="rounded-xl border border-[#3A1F0E]/10 p-4" key={recommendation.id}>
                <p className="font-bold text-[#2B1507]">{recommendation.name}</p>
                <p className="mt-1 text-sm text-[#3A1F0E]/70">{recommendation.category}</p>
                <p className="mt-1 text-sm text-[#3A1F0E]/60">
                  {recommendation.addressLine1 ? `${recommendation.addressLine1} · ` : ""}
                  {recommendation.city
                    ? `${recommendation.city}${recommendation.stateCode ? `, ${recommendation.stateCode}` : ""}`
                    : ""}
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#3A1F0E]/75">
                  {recommendation.reasons.map((reason) => (
                    <li className="flex gap-2" key={reason}>
                      <GoldFeatherMark label="Recommendation reason" size={15} />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                {recommendation.boundary ? (
                  <p className="mt-3 text-xs leading-5 text-[#3A1F0E]/60">{recommendation.boundary}</p>
                ) : null}
                <Link
                  className="mt-4 inline-block text-sm font-semibold text-[#8D5C17] underline"
                  href={recommendation.detailUrl}
                >
                  Open listing
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
