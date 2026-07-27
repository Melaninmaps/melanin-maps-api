const rows = [
  { them: "Ads", us: "Community" },
  { them: "Clicks", us: "Safety" },
  { them: "Popularity", us: "Verification" },
  { them: "Algorithms", us: "Belonging" },
];

export default function Slide05TrustScore() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600;800&family=Inter:wght@300;400;600&display=swap');
        .fd-display { font-family: 'DM Sans', sans-serif; }
        .fd-body    { font-family: 'Inter', sans-serif; }
      `}</style>
      <div
        className="relative overflow-hidden"
        style={{
          width: "1920px", height: "1080px",
          background: "linear-gradient(150deg, #331A0B 0%, #2C170E 45%, #221309 100%)",
          transform: "scale(var(--preview-scale,1))", transformOrigin: "top left"
        }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 36%, rgba(214,174,85,0.10) 0%, rgba(185,139,55,0.04) 45%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 85% 85%, rgba(100,55,15,0.14) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent 0%,#B98B37 20%,#D6AE55 50%,#B98B37 80%,transparent 100%)" }} />
        <div className="absolute fd-display" style={{ bottom: "33px", right: "96px", fontSize: "38px", color: "#D6AE55", fontWeight: 700, opacity: 0.15 }}>05</div>

        <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "86px", bottom: "58px" }}>
          <div className="fd-body" style={{ fontSize: "16px", color: "#D6AE55", letterSpacing: "0.32em", fontWeight: 700, marginBottom: "54px" }}>
            CORE BRAND MESSAGE
          </div>

          <h2 className="fd-display text-center" style={{
            fontSize: "73px", fontWeight: 800, lineHeight: 1.15, marginBottom: "15px", maxWidth: "1382px",
            color: "#F8F0E4",
            textShadow: "0 2px 32px rgba(100,55,15,0.35)",
          }}>
            Most platforms know what you{" "}
            <span style={{ color: "#4A2810", textShadow: "none" }}>clicked.</span>
          </h2>
          <h2 className="fd-display text-center" style={{
            fontSize: "73px", fontWeight: 800, lineHeight: 1.15, marginBottom: "72px", maxWidth: "1382px",
            background: "linear-gradient(180deg, #E8C96D 0%, #D6AE55 60%, #C09840 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            We know what your community experienced.
          </h2>

          <div style={{
            width: "77px", height: "2px",
            background: "linear-gradient(90deg, #B98B37, #D6AE55, #B98B37)",
            marginBottom: "96px",
            boxShadow: "0 0 10px rgba(214,174,85,0.25)",
          }} />

          <div style={{
            width: "1114px", borderRadius: "16px", overflow: "hidden",
            border: "1px solid rgba(214,174,85,0.2)",
            boxShadow: "0 8px 48px rgba(30,12,4,0.6), 0 1px 0 rgba(232,201,109,0.12) inset",
            background: "rgba(42,21,8,0.5)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: "20px 46px", background: "rgba(60,28,10,0.6)", borderBottom: "1px solid rgba(214,174,85,0.12)" }}>
                <div className="fd-body" style={{ fontSize: "14px", color: "#5A3A18", letterSpacing: "0.24em", fontWeight: 700 }}>OTHER PLATFORMS</div>
              </div>
              <div style={{ padding: "20px 46px", background: "rgba(214,174,85,0.08)", borderBottom: "1px solid rgba(214,174,85,0.12)", borderLeft: "1px solid rgba(214,174,85,0.14)" }}>
                <div className="fd-body" style={{ fontSize: "14px", color: "#D6AE55", letterSpacing: "0.24em", fontWeight: 700 }}>MAPPING WITH MELANIN™</div>
              </div>
              {rows.map((r, i) => (
                <>
                  <div key={`l-${i}`} style={{ padding: "20px 46px", background: "transparent", borderBottom: i < rows.length - 1 ? "1px solid rgba(214,174,85,0.07)" : "none" }}>
                    <span className="fd-body" style={{ fontSize: "22px", color: "#4A2810", lineHeight: 1.5, fontWeight: 400 }}>{r.them}</span>
                  </div>
                  <div key={`r-${i}`} style={{ padding: "20px 46px", background: "rgba(214,174,85,0.04)", borderBottom: i < rows.length - 1 ? "1px solid rgba(214,174,85,0.07)" : "none", borderLeft: "1px solid rgba(214,174,85,0.1)" }}>
                    <span className="fd-body" style={{ fontSize: "22px", color: "#E8C96D", fontWeight: 600, lineHeight: 1.5 }}>{r.us}</span>
                  </div>
                </>
              ))}
            </div>
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
          ENHANCED v2 — Gradient bg · Warm shadows · Dimensional table
        </div>
      </div>
    </>
  );
}
