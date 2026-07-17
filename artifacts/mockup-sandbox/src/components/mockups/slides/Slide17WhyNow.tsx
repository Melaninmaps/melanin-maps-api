const contrasts = [
  ["Communities are more connected online than ever", "but loneliness is rising."],
  ["Travel is growing", "but trust is declining."],
  ["Minority-owned businesses are easier to support", "but harder to discover."],
  ["People have more information than ever before.", "But less confidence in where to find belonging."],
  ["Technology has made the world smaller.", "Belonging still feels farther away."],
];

function OutlineCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "5px" }}>
      <circle cx="7" cy="7" r="6" stroke="#D6AE55" strokeWidth="1.5" />
    </svg>
  );
}

export default function Slide17WhyNow() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600;800&family=Inter:wght@300;400;600&display=swap');
        .fd-display { font-family: 'DM Sans', sans-serif; }
        .fd-body    { font-family: 'Inter', sans-serif; }
      `}</style>
      <div
        className="relative overflow-hidden"
        style={{ width: "1920px", height: "1080px", background: "#2C170E", transform: "scale(var(--preview-scale,1))", transformOrigin: "top left" }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 44%, rgba(214,174,85,0.07) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#D6AE55,transparent)" }} />
        <div className="absolute fd-display" style={{ bottom: "33px", right: "96px", fontSize: "38px", color: "#D6AE55", fontWeight: 700, opacity: 0.18 }}>17</div>

        <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "76px", bottom: "58px" }}>

          <div className="fd-body" style={{ fontSize: "16px", color: "#B98B37", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "10px" }}>
            WHY NOW?
          </div>

          <h2 className="fd-display text-center" style={{ fontSize: "44px", fontWeight: 800, color: "#F6F1EB", lineHeight: 1.2, marginBottom: "38px", maxWidth: "960px" }}>
            The moment we've been<br />
            <span style={{ color: "#D6AE55" }}>building toward.</span>
          </h2>

          <div style={{ width: "48px", height: "1px", background: "rgba(214,174,85,0.4)", marginBottom: "38px" }} />

          <div className="flex flex-col" style={{ gap: "22px", maxWidth: "1152px", width: "100%" }}>
            {contrasts.map(([bright, faded], i) => (
              <div key={i} className="flex items-start" style={{ gap: "18px" }}>
                <OutlineCircle />
                <p className="fd-body" style={{ fontSize: "22px", lineHeight: 1.55, margin: 0 }}>
                  <span style={{ color: "#F6F1EB" }}>{bright} </span>
                  <span style={{ color: "#6B4020" }}>— {faded}</span>
                </p>
              </div>
            ))}
          </div>

          <div style={{ width: "1152px", height: "1px", background: "rgba(214,174,85,0.18)", marginTop: "32px", marginBottom: "28px" }} />

          <div className="flex items-center" style={{ gap: "16px" }}>
            <div style={{ width: "28px", height: "1px", background: "#D6AE55", opacity: 0.6 }} />
            <p className="fd-body" style={{ fontSize: "22px", color: "#D6AE55", fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
              People don't need another app. They need a trusted guide.
            </p>
            <div style={{ width: "28px", height: "1px", background: "#D6AE55", opacity: 0.6 }} />
          </div>

        </div>

        <div
          className="absolute fd-body"
          style={{
            top: "18px", right: "18px",
            background: "rgba(44,23,14,0.92)",
            border: "1px solid rgba(214,174,85,0.35)",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "11px",
            color: "#D6AE55",
            letterSpacing: "0.15em",
            fontWeight: 600,
          }}
        >
          PROPOSED — 3-level hierarchy · ◌ bullets · Conclusion lift
        </div>
      </div>
    </>
  );
}
