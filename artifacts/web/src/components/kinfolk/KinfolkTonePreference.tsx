import { useState } from "react";
import { GoldFeatherMark } from "@/components/brand/GoldFeatherMark";

const BASE = import.meta.env.BASE_URL;

type ToneStyle = "warm_standard" | "community_conversational" | "concise_professional";

const TONE_OPTIONS: Array<{ value: ToneStyle; title: string; description: string }> = [
  {
    value: "warm_standard",
    title: "Warm and clear",
    description: "Respectful, easy-to-follow language with a welcoming tone.",
  },
  {
    value: "community_conversational",
    title: "Community conversational",
    description:
      "A more relaxed voice. Kinfolk uses conversational community language only when you choose this style; it never assumes it for you.",
  },
  {
    value: "concise_professional",
    title: "Concise and professional",
    description: "Direct, structured answers with minimal conversational framing.",
  },
];

export default function KinfolkTonePreference({
  initialValue,
}: {
  initialValue: ToneStyle | null;
}) {
  const [value, setValue] = useState<ToneStyle>(initialValue ?? "warm_standard");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function selectTone(nextValue: ToneStyle) {
    setValue(nextValue);
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${BASE}api/profile/kinfolk-tone`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toneStyle: nextValue }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#3A1F0E]/10 bg-white p-5">
      <div className="flex items-center gap-2">
        <GoldFeatherMark label="Kinfolk voice" size={18} />
        <h2 className="font-serif text-xl font-bold text-[#2B1507]">Kinfolk's voice with you</h2>
      </div>
      <p className="mt-2 leading-6 text-[#3A1F0E]/70">
        Choose how you want Kinfolk to speak with you. You can change this at any time.
      </p>
      <div className="mt-4 grid gap-3">
        {TONE_OPTIONS.map((option) => (
          <button
            aria-pressed={value === option.value}
            className={`rounded-xl border p-4 text-left transition ${
              value === option.value
                ? "border-[#CA922B] bg-[#CA922B]/10"
                : "border-[#3A1F0E]/10 hover:border-[#CA922B]/40"
            }`}
            disabled={saving}
            key={option.value}
            onClick={() => void selectTone(option.value)}
            type="button"
          >
            <p className="font-semibold text-[#2B1507]">{option.title}</p>
            <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/70">{option.description}</p>
          </button>
        ))}
      </div>
      {saved && (
        <p className="mt-3 text-sm font-semibold text-[#CA922B]">Preference saved.</p>
      )}
    </section>
  );
}
