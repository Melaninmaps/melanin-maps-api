import { useEffect, useState } from "react";
import "./visitorStory.css";

const moments = [
  {
    eyebrow: "Mapping with Melanin",
    title: "Find what feels familiar.",
    copy: "Nearby places, people, and experiences with context that matters.",
    visual: "places",
  },
  {
    eyebrow: "A recommendation travels",
    title: "Put your people on.",
    copy: "A good experience becomes something someone else can find when they need it.",
    visual: "voice",
  },
  {
    eyebrow: "Culture stays close",
    title: "Follow the story, not just the street.",
    copy: "History, living culture, and the people who keep it moving—connected in one place.",
    visual: "culture",
  },
  {
    eyebrow: "What matters remains",
    title: "Keep knowledge within reach.",
    copy: "Useful, source-cited information has a home when you need to come back to it.",
    visual: "library",
  },
  {
    eyebrow: "Mapping with Melanin",
    title: "Made for how we move through the world.",
    copy: "A living map of connection, context, and possibility.",
    visual: "close",
  },
] as const;

export function VisitorStory() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % moments.length),
      5200,
    );

    return () => window.clearInterval(id);
  }, []);

  const moment = moments[index];

  return (
    <main className="visitor-story" aria-live="polite">
      <section
        className="visitor-story__scene"
        key={moment.visual}
        data-scene={moment.visual}
      >
        <div className="visitor-story__mark">MWM</div>

        <div className="visitor-story__visual" aria-hidden="true">
          <StoryVisual kind={moment.visual} />
        </div>

        <div className="visitor-story__copy">
          <p>{moment.eyebrow}</p>
          <h1>{moment.title}</h1>
          <span>{moment.copy}</span>
        </div>

        <div className="visitor-story__progress" aria-hidden="true">
          {moments.map((item, itemIndex) => (
            <i key={item.visual} data-active={itemIndex === index} />
          ))}
        </div>
      </section>
    </main>
  );
}

function StoryVisual({ kind }: { kind: (typeof moments)[number]["visual"] }) {
  if (kind === "places") {
    return (
      <div className="story-map">
        <b>Charlotte</b>
        <i className="story-pin story-pin--a" />
        <i className="story-pin story-pin--b" />
        <article>
          Urban Reader
          <br />
          <small>Near you</small>
        </article>
      </div>
    );
  }

  if (kind === "voice") {
    return (
      <div className="story-voice">
        <span>“The folks at…”</span>
        <div />
        <strong>Added with care</strong>
      </div>
    );
  }

  if (kind === "culture") {
    return (
      <div className="story-culture">
        <i />
        <i />
        <i />
        <article>
          Atlanta
          <br />
          <small>Stories worth following</small>
        </article>
      </div>
    );
  }

  if (kind === "library") {
    return (
      <div className="story-library">
        <b>Heart Health</b>
        <span>Sources · context · saved</span>
        <i />
        <i />
        <i />
      </div>
    );
  }

  return (
    <div className="story-close">
      <i />
      <i />
      <i />
      <b>Here for us.</b>
    </div>
  );
}