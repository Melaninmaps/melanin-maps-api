export default function DemoS46bReviewIntegrityText() {
  const cols = [
    {
      tag: "HOW IT WORKS",
      head: "Community surveys — not star dumps",
      body: "Every review is a structured survey: safety dimensions, compliment chips, written context, and an optional video. The result is intelligence, not noise.",
      icon: (
        <>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </>
      ),
      accent: false,
    },
    {
      tag: "REAL-TIME",
      head: "Scores update the moment feedback lands",
      body: "Your rating, review count, and Trust Score recalculate immediately after every verified submission — no batching, no 24-hour delays. The community speaks and the index reflects it instantly.",
      icon: (
        <>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </>
      ),
      accent: false,
    },
    {
      tag: "BUILT-IN PROTECTION",
      head: "Bad-faith reviews are stopped before they post",
      body: "Low ratings on verified minority-owned businesses go into a moderation queue — not live. They are reviewed by the platform before anything affects your score. Five-star reviews from verified members post instantly.",
      icon: (
        <>
          <path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </>
      ),
      accent: true,
    },
    {
      tag: "ACCOUNTABILITY",
      head: "Every reviewer is a real, verified member",
      body: "Anonymous posting is allowed — but reviews still come from verified accounts. Reviewer reputation, tenure, and history are visible to you on your dashboard, so you always know the weight behind the feedback.",
      icon: (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ),
      accent: false,
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Subtle gold radial */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 85% 15%, rgba(202,146,43,0.08), transparent 55%)" }}
      />
      {/* Top gold rule */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />

      {/* Header */}
      <div className="absolute" style={{ left: "8vw", right: "8vw", top: "5.5vw" }}>
        <div
          className="font-body"
          style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "1.1vw" }}
        >
          REVIEW INTEGRITY · HOW THE SYSTEM PROTECTS YOU
        </div>
        <div
          className="font-display"
          style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.6vw" }}
        >
          Every review is structured.<br />
          <span style={{ color: "#CA922B" }}>Bad faith never reaches your score.</span>
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", opacity: 0.7, marginBottom: "2.4vw" }} />
      </div>

      {/* Four-column cards */}
      <div
        className="absolute"
        style={{ left: "8vw", right: "8vw", top: "22vw", bottom: "5.5vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.1vw" }}
      >
        {cols.map((c, i) => (
          <div
            key={i}
            style={{
              background: c.accent ? "rgba(202,146,43,0.08)" : "rgba(250,246,239,0.04)",
              borderRadius: "0.9vw",
              border: c.accent ? "1px solid rgba(202,146,43,0.45)" : "1px solid rgba(250,246,239,0.08)",
              padding: "1.4vw 1.3vw",
              display: "flex",
              flexDirection: "column",
              gap: "0.9vw",
            }}
          >
            {/* Icon circle */}
            <div
              style={{
                width: "2.8vw",
                height: "2.8vw",
                borderRadius: "50%",
                background: c.accent ? "rgba(202,146,43,0.18)" : "rgba(202,146,43,0.1)",
                border: "1px solid rgba(202,146,43,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="1.2vw"
                height="1.2vw"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#CA922B"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {c.icon}
              </svg>
            </div>

            {/* Tag */}
            <div
              className="font-body"
              style={{ fontSize: "0.6vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700 }}
            >
              {c.tag}
            </div>

            {/* Heading */}
            <div
              className="font-display"
              style={{ fontSize: "0.88vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.25 }}
            >
              {c.head}
            </div>

            {/* Body */}
            <div
              className="font-body"
              style={{ fontSize: "0.75vw", color: "#A87A40", lineHeight: 1.65, flex: 1 }}
            >
              {c.body}
            </div>
          </div>
        ))}
      </div>

      {/* Footer quote */}
      <div className="absolute" style={{ left: "8vw", right: "8vw", bottom: "2vw" }}>
        <div
          className="font-display"
          style={{ fontSize: "0.95vw", fontWeight: 700, color: "rgba(202,146,43,0.55)", fontStyle: "italic" }}
        >
          Other platforms let anyone say anything. We protect the businesses that built this community.
        </div>
      </div>

      {/* Slide number */}
      <div
        style={{
          position: "absolute",
          bottom: "3.5vh",
          right: "4vw",
          color: "rgba(202,146,43,0.3)",
          fontSize: "0.65vw",
          fontWeight: 700,
          letterSpacing: "0.12em",
        }}
      >
        47 / 59
      </div>
    </div>
  );
}
