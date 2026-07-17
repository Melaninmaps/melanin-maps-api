const contrasts = [
  ["Communities are more connected online than ever", "but loneliness is rising."],
  ["Travel is growing", "but trust is declining."],
  ["Minority-owned businesses are easier to support", "but harder to discover."],
  ["People have more information than ever before.", "But less confidence in where to find belonging."],
  ["Technology has made the world smaller.", "Belonging still feels farther away."],
];

function OutlineCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "4px" }}>
      <circle cx="8" cy="8" r="6.5" stroke="#D6AE55" strokeWidth="1.5" />
    </svg>
  );
}

export default function Slide17WhyNow() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600;800&family=Inter:wght@300;400;600&family=Cormorant+Garamond:ital,wght@1,400;1,600&display=swap');
        .fd-display { font-family: 'DM Sans', sans-serif; }
        .fd-body    { font-family: 'Inter', sans-serif; }
        .fd-quote   { font-family: 'Cormorant Garamond', Georgia, serif; }
      `}</style>
      <div
        className="relative overflow-hidden"
        style={{
          width: "1920px", height: "1080px",
          background: "linear-gradient(150deg, #331A0B 0%, #2C170E 45%, #221309 100%)",
          transform: "scale(var(--preview-scale,1))", transformOrigin: "top left"
        }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(214,174,85,0.07) 0%, transparent 65%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 5% 95%, rgba(120,70,20,0.15) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent 0%,#B98B37 20%,#D6AE55 50%,#B98B37 80%,transparent 100%)" }} />
        <div className="absolute fd-display" style={{ bottom: "33px", right: "96px", fontSize: "38px", color: "#D6AE55", fontWeight: 700, opacity: 0.15 }}>17</div>

        <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "76px", bottom: "58px" }}>

          <div className="fd-body" style={{ fontSize: "18px", color: "#B98B37", letterSpacing: "0.32em", fontWeight: 600, marginBottom: "12px" }}>
            WHY NOW?
          </div>

          <h2 className="fd-display text-center" style={{
            fontSize: "46px", fontWeight: 800, lineHeight: 1.2, marginBottom: "40px", maxWidth: "1040px",
            color: "#F8F0E4",
            textShadow: "0 2px 28px rgba(100,55,15,0.35)",
          }}>
            The moment we've been{" "}
            <span style={{
              background: "linear-gradient(180deg, #E8C96D 0%, #D6AE55 70%, #C09840 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>building toward.</span>
          </h2>

          <div style={{
            width: "48px", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(214,174,85,0.5), transparent)",
            marginBottom: "40px"
          }} />

          <div className="flex flex-col" style={{ gap: "21px", maxWidth: "1152px", width: "100%" }}>
            {contrasts.map(([bright, faded], i) => (
              <div key={i} className="flex items-start" style={{ gap: "18px" }}>
                <OutlineCircle />
                <p className="fd-body" style={{ fontSize: "22px", lineHeight: 1.55, margin: 0, fontWeight: 400 }}>
                  <span style={{ color: "#F8F0E4" }}>{bright} </span>
                  <span style={{ color: "#5A3218" }}>— {faded}</span>
                </p>
              </div>
            ))}
          </div>

          <div style={{
            width: "1152px", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(214,174,85,0.22), transparent)",
            marginTop: "34px", marginBottom: "28px"
          }} />

          <div className="flex items-center" style={{ gap: "20px" }}>
            <div style={{ width: "32px", height: "1px", background: "linear-gradient(90deg, transparent, #D6AE55)", opacity: 0.7 }} />
            <p className="fd-body" style={{ fontSize: "23px", fontWeight: 600, lineHeight: 1.6, margin: 0,
              background: "linear-gradient(90deg, #D6AE55, #E8C96D, #D6AE55)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              People don't need another app. They need a trusted guide.
            </p>
            <div style={{ width: "32px", height: "1px", background: "linear-gradient(90deg, #D6AE55, transparent)", opacity: 0.7 }} />
          </div>

        </div>

        <div
          className="absolute fd-body"
          style={{
            top: "18px", right: "18px",
            background: "rgba(33,16,8,0.95)",
            border: "1px solid rgba(214,174,85,0.35)",
            borderRadius: "6px",
            padding: "6px 14px",
            fontSize: "11px",
            color: "#B98B37",
            letterSpacing: "0.15em",
            fontWeight: 600,
          }}
        >
          ENHANCED v2 — 3-level hierarchy · ◌ bullets · Gradient gold conclusion
        </div>
      </div>
    </>
  );
}
