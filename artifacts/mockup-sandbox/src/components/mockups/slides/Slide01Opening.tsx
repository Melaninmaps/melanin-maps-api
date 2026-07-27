export default function Slide01Opening() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600;800&family=Inter:wght@300;400;600&family=Cormorant+Garamond:ital,wght@0,400;1,400;1,600&display=swap');
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
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 48% 38%, rgba(214,174,85,0.13) 0%, rgba(185,139,55,0.05) 40%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 10% 90%, rgba(120,70,20,0.18) 0%, transparent 55%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent 0%,#B98B37 20%,#D6AE55 50%,#B98B37 80%,transparent 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg,transparent,rgba(185,139,55,0.25),transparent)" }} />

        <div className="absolute fd-body" style={{ top: "86px", left: "115px", fontSize: "19px", color: "#D6AE55", letterSpacing: "0.3em", fontWeight: 600 }}>
          MAPPING WITH MELANIN™
        </div>

        <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: "151px", bottom: "130px" }}>
          <div className="fd-body" style={{ fontSize: "18px", color: "#B98B37", letterSpacing: "0.32em", fontWeight: 600, marginBottom: "72px" }}>
            THE EXPERIENCE DECK
          </div>

          <h1 className="fd-display text-center" style={{
            fontSize: "107px", fontWeight: 800, lineHeight: 1.1, marginBottom: "54px", maxWidth: "1459px",
            color: "#F8F0E4",
            textShadow: "0 2px 40px rgba(120,70,20,0.4)",
          }}>
            Never wonder if you'll feel<br />
            <span style={{
              background: "linear-gradient(180deg, #E8C96D 0%, #D6AE55 60%, #C09840 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>welcome</span> again.
          </h1>

          <div style={{
            width: "96px", height: "2px",
            background: "linear-gradient(90deg, transparent, #D6AE55, #E8C96D, #D6AE55, transparent)",
            marginBottom: "54px",
            boxShadow: "0 0 12px rgba(214,174,85,0.3)",
          }} />

          <p className="fd-body text-center" style={{ fontSize: "32px", color: "#9A6E3A", fontWeight: 300, lineHeight: 1.8, maxWidth: "883px" }}>
            Finding the right place shouldn't require<br />taking unnecessary risks.
          </p>
        </div>

        <div className="absolute fd-body" style={{ bottom: "77px", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: "16px", color: "#4A2810", letterSpacing: "0.22em" }}>mappingwithmelanin.com</span>
        </div>
        <div className="absolute fd-display" style={{ bottom: "33px", right: "96px", fontSize: "38px", color: "#D6AE55", fontWeight: 700, opacity: 0.15 }}>01</div>

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
          ENHANCED v2 — Warm gradient bg · Dimensional gold · Cream text
        </div>
      </div>
    </>
  );
}
