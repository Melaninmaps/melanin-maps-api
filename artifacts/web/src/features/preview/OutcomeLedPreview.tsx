import { useEffect, useState } from "react";
import { Link } from "wouter";
import { OUTCOME_PREVIEW_SCENES, type OutcomeScene } from "./outcomePreviewScenes";
import "./outcomeLedPreview.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function SceneVisual({ scene }: { scene: OutcomeScene }) {
  if (scene.visual === "nearby") {
    return (
      <div className="outcome-visual outcome-visual--nearby" aria-hidden="true">
        <span className="map-grid" />
        <span className="user-dot" />
        <span className="place-pin place-pin--one" />
        <span className="place-pin place-pin--two" />
        <article className="listing-card listing-card--one">
          <strong>Urban Reader</strong>
          <small>0.5 mi away</small>
        </article>
        <article className="listing-card listing-card--two">
          <strong>Curio, Craft &amp; Conjure</strong>
          <small>0.5 mi away</small>
        </article>
      </div>
    );
  }

  if (scene.visual === "community") {
    return (
      <div className="outcome-visual outcome-visual--community" aria-hidden="true">
        <article className="community-card">
          <span className="avatar" />
          <p>“They made space for my whole family.”</p>
          <small>Community-sourced context</small>
        </article>
        <span className="signal-chip signal-chip--one">Welcoming</span>
        <span className="signal-chip signal-chip--two">Family-friendly</span>
        <span className="signal-chip signal-chip--three">Community staple</span>
      </div>
    );
  }

  if (scene.visual === "business") {
    return (
      <div className="outcome-visual outcome-visual--business" aria-hidden="true">
        <article className="business-card">
          <span className="business-photo" />
          <strong>Neighborhood Books</strong>
          <small>Readings · Local authors · Youth programs</small>
          <span className="business-status">Now discoverable</span>
        </article>
        <span className="discover-ring" />
      </div>
    );
  }

  if (scene.visual === "culture") {
    return (
      <div className="outcome-visual outcome-visual--culture" aria-hidden="true">
        <span className="trail-line" />
        <span className="trail-stop trail-stop--one">Heritage</span>
        <span className="trail-stop trail-stop--two">Living culture</span>
        <span className="trail-stop trail-stop--three">Local stop</span>
      </div>
    );
  }

  return (
    <div className="outcome-visual outcome-visual--knowledge" aria-hidden="true">
      <article className="library-page">
        <span>Living Library</span>
        <strong>Heart health for Black women</strong>
        <small>Sources · Practical next steps · Saved for later</small>
      </article>
      <span className="library-thread library-thread--one" />
      <span className="library-thread library-thread--two" />
    </div>
  );
}

export function OutcomeLedPreview() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const scene = OUTCOME_PREVIEW_SCENES[sceneIndex];

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(
      () => setSceneIndex((index) => (index + 1) % OUTCOME_PREVIEW_SCENES.length),
      scene.durationMs,
    );
    return () => window.clearTimeout(timer);
  }, [paused, scene.durationMs, sceneIndex]);

  function restart() {
    setSceneIndex(0);
    setPaused(false);
  }

  return (
    <main className="outcome-preview">
      <header className="outcome-preview__header">
        <p>Mapping with Melanin</p>
        <span>Demonstration</span>
      </header>

      <section className="outcome-preview__scene" aria-live="polite">
        <SceneVisual key={scene.id} scene={scene} />
        <div className="outcome-preview__copy">
          <p className="outcome-preview__eyebrow">{scene.eyebrow}</p>
          <h1>{scene.headline}</h1>
          <p>{scene.supporting}</p>
          <strong>{scene.outcome}</strong>
        </div>
      </section>

      <nav aria-label="Preview progress" className="outcome-preview__progress">
        {OUTCOME_PREVIEW_SCENES.map((item, index) => (
          <button
            aria-current={index === sceneIndex ? "step" : undefined}
            aria-label={`Show ${item.headline}`}
            key={item.id}
            onClick={() => {
              setSceneIndex(index);
              setPaused(true);
            }}
          >
            <span />
          </button>
        ))}
      </nav>

      <section className="outcome-preview__controls" aria-label="Preview controls">
        <button onClick={() => setPaused((value) => !value)}>
          {paused ? "Play demonstration" : "Pause demonstration"}
        </button>
        <button onClick={restart}>Restart</button>
        <Link to="/">Explore Mapping with Melanin</Link>
      </section>

      <p className="outcome-preview__note">
        This is a guided product demonstration. It uses curated preview states and
        does not send a question, create a post, or call a live service.
      </p>
    </main>
  );
}