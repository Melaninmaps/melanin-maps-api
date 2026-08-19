import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  PREVIEW_DEMOS,
  PREVIEW_EXPERIENCES,
  QR_STABLE_PREVIEW_PATH,
  type PreviewDemo,
  type PreviewExperience,
} from "./previewTourData";
import "./previewTour.css";

type Mode = "guided" | "explore";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Lightweight search-param helpers (Wouter has no built-in hook) ────────────
function getParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}
function setParam(key: string, value: string) {
  const p = new URLSearchParams(window.location.search);
  p.set(key, value);
  history.replaceState(null, "", window.location.pathname + "?" + p.toString());
}

// ── Animated visual pane ──────────────────────────────────────────────────────
function DemoVisual({ demo }: { demo: PreviewDemo }) {
  return (
    <div
      aria-hidden="true"
      className={`preview-visual preview-visual--${demo.visual}`}
    >
      <span className="preview-visual__glow" />
      <span className="preview-visual__mark" />
      <span className="preview-visual__line preview-visual__line--one" />
      <span className="preview-visual__line preview-visual__line--two" />
      <span className="preview-visual__pin preview-visual__pin--one" />
      <span className="preview-visual__pin preview-visual__pin--two" />
    </div>
  );
}

// ── Main tour component ───────────────────────────────────────────────────────
export function PreviewTour() {
  const [, navigate] = useLocation();

  const [mode, setMode] = useState<Mode>(
    (getParam("mode") as Mode | null) === "explore" ? "explore" : "guided"
  );
  const initialExp = getParam("experience") as PreviewExperience | null;
  const [experience, setExperience] = useState<PreviewExperience>(
    PREVIEW_EXPERIENCES.some((e) => e.id === initialExp)
      ? (initialExp as PreviewExperience)
      : "community-member"
  );

  const demos = useMemo(
    () => PREVIEW_DEMOS.filter((d) => d.experience === experience),
    [experience]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const active = demos[activeIndex] ?? demos[0];

  // Reset demo index when experience or mode changes
  useEffect(() => {
    setActiveIndex(0);
  }, [experience, mode]);

  // Auto-advance in guided mode
  useEffect(() => {
    if (mode !== "guided" || paused) return;
    const timer = window.setInterval(
      () => setActiveIndex((i) => (i + 1) % demos.length),
      4800
    );
    return () => window.clearInterval(timer);
  }, [demos.length, mode, paused]);

  function switchMode(next: Mode) {
    setMode(next);
    setParam("mode", next);
  }

  function chooseExperience(next: PreviewExperience) {
    setExperience(next);
    setParam("experience", next);
  }

  const expLabel =
    PREVIEW_EXPERIENCES.find((e) => e.id === experience)?.label ?? "";

  return (
    <main className="preview-tour" data-mode={mode}>
      {/* ── Header ── */}
      <header className="preview-tour__header">
        <p className="preview-tour__eyebrow">MAPPING WITH MELANIN</p>
        <h1>See the community in motion.</h1>
        <p>
          Choose a guided animated preview or explore the platform at your own
          pace.
        </p>
        <div
          aria-label="Preview mode"
          className="preview-tour__modes"
          role="tablist"
        >
          <button
            aria-selected={mode === "guided"}
            onClick={() => switchMode("guided")}
            role="tab"
          >
            Guided preview
          </button>
          <button
            aria-selected={mode === "explore"}
            onClick={() => switchMode("explore")}
            role="tab"
          >
            Explore the experiences
          </button>
        </div>
      </header>

      {/* ── Experience switcher ── */}
      <section aria-label="Experiences" className="preview-tour__experiences">
        {PREVIEW_EXPERIENCES.map((exp) => (
          <button
            aria-pressed={experience === exp.id}
            key={exp.id}
            onClick={() => chooseExperience(exp.id)}
          >
            <strong>{exp.label}</strong>
            <span>{exp.description}</span>
          </button>
        ))}
      </section>

      {/* ── Active demo stage ── */}
      <section aria-live="polite" className="preview-tour__stage">
        <DemoVisual demo={active} />
        <div className="preview-tour__content">
          <p className="preview-tour__label">
            {expLabel} · {active.label}
          </p>
          <h2>{active.title}</h2>
          <p>{active.description}</p>
          <button
            className="preview-tour__action"
            onClick={() => navigate(active.destination)}
          >
            {active.actionLabel}
          </button>
          {mode === "guided" ? (
            <button
              aria-pressed={paused}
              className="preview-tour__pause"
              onClick={() => setPaused((v) => !v)}
            >
              {paused ? "Resume preview" : "Pause preview"}
            </button>
          ) : null}
        </div>
      </section>

      {/* ── Demo selector ── */}
      <section
        aria-label={`${expLabel} features`}
        className="preview-tour__demos"
      >
        {demos.map((demo, index) => (
          <button
            aria-current={activeIndex === index ? "step" : undefined}
            key={demo.id}
            onClick={() => {
              setActiveIndex(index);
              setPaused(true);
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{demo.label}</strong>
            <small>{demo.title}</small>
          </button>
        ))}
      </section>

      {/* ── Footer ── */}
      <footer className="preview-tour__footer">
        <p>
          <strong>QR-stable preview:</strong> existing QR codes continue to
          open <code>{QR_STABLE_PREVIEW_PATH}</code>. This tour is versioned by
          query parameters, not a replacement route.
        </p>
        <Link to="/">Return to Mapping with Melanin</Link>
      </footer>
    </main>
  );
}
