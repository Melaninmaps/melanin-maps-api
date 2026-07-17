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
        style={{ width: "1920px", height: "1080px", background: "#2C170E", transform: "scale(var(--preview-scale,1))", transformOrigin: "top left" }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(214,174,85,0.1) 0%, transparent 62%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#D6AE55,transparent)" }} />
        <div className="absolute fd-display" style={{ bottom: "33px", right: "96px", fontSize: "38px", color: "#D6AE55", fontWeight: 700, opacity: 0.18 }}>05</div>

        <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: "86px", bottom: "58px" }}>
          <div className="fd-body" style={{ fontSize: "16px", color: "#D6AE55", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "54px" }}>
            CORE BRAND MESSAGE
          </div>

          <h2 className="fd-display text-center" style={{ fontSize: "73px", fontWeight: 800, color: "#F6F1EB", lineHeight: 1.15, marginBottom: "15px", maxWidth: "1382px" }}>
            Most platforms know what you <span style={{ color: "#4A2810" }}>clicked.</span>
          </h2>
          <h2 className="fd-display text-center" style={{ fontSize: "73px", fontWeight: 800, color: "#D6AE55", lineHeight: 1.15, marginBottom: "62px", maxWidth: "1382px" }}>
            We know what your community experienced.
          </h2>

          <div style={{ width: "77px", height: "2px", background: "#D6AE55", marginBottom: "81px" }} />

          <div style={{ width: "1114px", borderRadius: "15px", overflow: "hidden", border: "1px solid rgba(214,174,85,0.22)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: "19px 46px", background: "rgba(90,58,24,0.22)", borderBottom: "1px solid rgba(214,174,85,0.15)" }}>
                <div className="fd-body" style={{ fontSize: "15px", color: "#5A3A18", letterSpacing: "0.22em", fontWeight: 700 }}>OTHER PLATFORMS</div>
              </div>
              <div style={{ padding: "19px 46px", background: "rgba(214,174,85,0.09)", borderBottom: "1px solid rgba(214,174,85,0.15)", borderLeft: "1px solid rgba(214,174,85,0.15)" }}>
                <div className="fd-body" style={{ fontSize: "15px", color: "#D6AE55", letterSpacing: "0.22em", fontWeight: 700 }}>MAPPING WITH MELANIN™</div>
              </div>
              {rows.map((r, i) => (
                <>
                  <div key={`l-${i}`} style={{ padding: "19px 46px", background: "transparent", borderBottom: i < rows.length - 1 ? "1px solid rgba(214,174,85,0.08)" : "none" }}>
                    <span className="fd-body" style={{ fontSize: "21px", color: "#4A2810", lineHeight: 1.5 }}>{r.them}</span>
                  </div>
                  <div key={`r-${i}`} style={{ padding: "19px 46px", background: "rgba(214,174,85,0.05)", borderBottom: i < rows.length - 1 ? "1px solid rgba(214,174,85,0.08)" : "none", borderLeft: "1px solid rgba(214,174,85,0.12)" }}>
                    <span className="fd-body" style={{ fontSize: "21px", color: "#E8C96D", fontWeight: 600, lineHeight: 1.5 }}>{r.us}</span>
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
          PROPOSED — Table pushed down +20px · Gold #D6AE55 · Bg #2C170E
        </div>
      </div>
    </>
  );
}
