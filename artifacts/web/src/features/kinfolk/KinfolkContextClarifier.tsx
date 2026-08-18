/**
 * KinfolkContextClarifier — optional research personalization UI.
 *
 * This component is offered AFTER Kinfolk delivers a general answer.
 * It is never a gate that withholds useful information. Every step is skippable.
 *
 * Context collected here is temporary by default and does NOT flow into member
 * memory unless the member explicitly asks Kinfolk to remember something.
 */

import { useState } from "react";

type Option = { value: string; label: string };
type Step = {
  id: string;
  question: string;
  explanation?: string;
  options: Option[];
  skippable: boolean;
  persistence: "temporary" | "optional_member_memory";
};

type Props = {
  steps: Step[];
  onComplete(answers: Record<string, string>): void;
};

export function KinfolkContextClarifier({ steps, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const step = steps[index];
  if (!step) return null;

  function choose(value: string) {
    const next = { ...answers, [step.id]: value };
    if (index === steps.length - 1) {
      onComplete(next);
    } else {
      setAnswers(next);
      setIndex(index + 1);
    }
  }

  function skip() {
    const next = { ...answers, [step.id]: "skip" };
    if (index === steps.length - 1) {
      onComplete(next);
    } else {
      setAnswers(next);
      setIndex(index + 1);
    }
  }

  return (
    <section
      aria-label="Optional research personalization"
      className="kinfolk-context-clarifier"
    >
      <p className="kinfolk-context-kicker">Optional context</p>
      <h3>{step.question}</h3>
      {step.explanation ? <p className="kinfolk-context-explanation">{step.explanation}</p> : null}
      <div className="kinfolk-context-options">
        {step.options.map((option) => (
          <button
            key={option.value}
            onClick={() => choose(option.value)}
            type="button"
            className="kinfolk-context-option"
          >
            {option.label}
          </button>
        ))}
      </div>
      {step.skippable ? (
        <button
          className="kinfolk-context-skip"
          onClick={skip}
          type="button"
        >
          Skip — keep this general
        </button>
      ) : null}
      <p className="kinfolk-context-privacy">
        This context applies to this search. Kinfolk will not remember it unless
        you explicitly ask.
      </p>
    </section>
  );
}
