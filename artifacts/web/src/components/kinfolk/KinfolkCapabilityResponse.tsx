import { useState } from "react";
import { Link } from "wouter";
import { GoldFeatherMark } from "@/components/brand/GoldFeatherMark";

const BASE = import.meta.env.BASE_URL;

type OptionalAction = {
  id: "show_local_attorneys" | "show_local_medical" | "show_local_plumbers" | "show_local_businesses";
  label: string;
  supportingText: string;
  requiresLocation: boolean;
};

type ProfessionalResult = {
  id: string;
  name: string;
  category: string;
  city: string | null;
  stateCode: string | null;
  addressLine1: string | null;
  distanceMiles: number | null;
  detailUrl: string;
};

export type CapabilityResponse = {
  turnId: string;
  message: string;
  optionalAction: OptionalAction | null;
  professionalResults: ProfessionalResult[] | null;
  locationPrompt: string | null;
};

function removeSystemEmoji(value: string): string {
  return value
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\uFE0F|\u200D/g, "")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .trim();
}

export default function KinfolkCapabilityResponse({
  initialResponse,
}: {
  initialResponse: CapabilityResponse;
}) {
  const [response, setResponse] = useState(initialResponse);
  const [loadingAction, setLoadingAction] = useState(false);

  async function acceptOptionalAction() {
    if (!response.optionalAction) return;
    setLoadingAction(true);
    try {
      const result = await fetch(
        `${BASE}api/kinfolk/capability-turns/${encodeURIComponent(response.turnId)}/actions/${response.optionalAction.id}`,
        { method: "POST", credentials: "include" },
      );
      const payload = (await result.json()) as Partial<CapabilityResponse>;
      if (!result.ok) throw new Error((payload as { error?: string }).error || "Unable to load local options.");
      setResponse({ ...response, ...payload });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <section className="max-w-4xl rounded-2xl border border-[#3A1F0E]/10 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[#CA922B]">
        <GoldFeatherMark label="Kinfolk response" size={18} />
        <span className="text-xs font-bold uppercase tracking-[0.16em]">Kinfolk</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap leading-7 text-[#2B1507]">
        {removeSystemEmoji(response.message)}
      </p>

      {response.optionalAction ? (
        <aside className="mt-5 rounded-xl border border-[#CA922B]/35 bg-[#CA922B]/[0.07] p-4">
          <div className="flex gap-3">
            <GoldFeatherMark label="Optional local connection" size={19} />
            <div>
              <p className="font-semibold text-[#2B1507]">{response.optionalAction.label}</p>
              <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/70">
                {response.optionalAction.supportingText}
              </p>
              <button
                className="mt-3 rounded-full border border-[#CA922B] px-4 py-2 text-sm font-semibold text-[#8D5C17] disabled:opacity-60"
                disabled={loadingAction}
                onClick={() => void acceptOptionalAction()}
                type="button"
              >
                {loadingAction
                  ? "Checking options…"
                  : response.optionalAction.requiresLocation
                  ? "Share an area to look"
                  : "Show local options"}
              </button>
              <p className="mt-2 text-xs text-[#3A1F0E]/55">
                You can skip this and keep the conversation going.
              </p>
            </div>
          </div>
        </aside>
      ) : null}

      {response.locationPrompt ? (
        <p className="mt-4 text-sm leading-6 text-[#3A1F0E]/70">{response.locationPrompt}</p>
      ) : null}

      {response.professionalResults?.length ? (
        <section aria-label="Optional local results" className="mt-5">
          <h2 className="flex items-center gap-2 font-semibold text-[#2B1507]">
            <GoldFeatherMark label="Local results" size={17} />
            Verified local options
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {response.professionalResults.map((professional) => (
              <li key={professional.id}>
                <Link
                  className="block rounded-xl border border-[#3A1F0E]/10 p-4 hover:border-[#CA922B]/60"
                  href={professional.detailUrl}
                >
                  <p className="font-bold text-[#2B1507]">{professional.name}</p>
                  <p className="mt-1 text-sm text-[#3A1F0E]/70">{professional.category}</p>
                  <p className="mt-1 text-sm text-[#3A1F0E]/60">
                    {professional.addressLine1 ? `${professional.addressLine1} · ` : ""}
                    {professional.city
                      ? `${professional.city}${professional.stateCode ? `, ${professional.stateCode}` : ""}`
                      : ""}
                    {professional.distanceMiles !== null
                      ? ` · ${professional.distanceMiles} miles`
                      : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
