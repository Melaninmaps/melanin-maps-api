export default function Slide01Opening() {
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
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 48% 52%, rgba(214,174,85,0.11) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#D6AE55,transparent)" }} />

        <div className="absolute fd-body" style={{ top: "86px", left: "115px", fontSize: "19px", color: "#D6AE55", letterSpacing: "0.3em", fontWeight: 600 }}>
          MAPPING WITH MELANIN™
        </div>

        <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: "151px", bottom: "130px" }}>
          <div className="fd-body" style={{ fontSize: "17px", color: "#B98B37", letterSpacing: "0.28em", fontWeight: 600, marginBottom: "67px" }}>
            THE EXPERIENCE DECK
          </div>

          <h1 className="fd-display text-center" style={{ fontSize: "107px", fontWeight: 800, color: "#F6F1EB", lineHeight: 1.1, marginBottom: "54px", maxWidth: "1459px" }}>
            Never wonder if you'll feel<br />
            <span style={{ color: "#D6AE55" }}>welcome</span> again.
          </h1>

          <div style={{ width: "96px", height: "2px", background: "linear-gradient(90deg,transparent,#D6AE55,transparent)", marginBottom: "54px" }} />

          <p className="fd-body text-center" style={{ fontSize: "32px", color: "#9E7040", fontWeight: 300, lineHeight: 1.75, maxWidth: "883px" }}>
            Finding the right place shouldn't require<br />taking unnecessary risks.
          </p>
        </div>

        <div className="absolute fd-body" style={{ bottom: "77px", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: "16px", color: "#4A2810", letterSpacing: "0.2em" }}>mappingwithmelanin.com</span>
        </div>

        <div className="absolute fd-body" style={{ bottom: "33px", right: "96px", fontSize: "38px", color: "#D6AE55", fontWeight: 700, opacity: 0.18 }}>01</div>

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
          PROPOSED — Background #2C170E · Gold #D6AE55 · Text #F6F1EB
        </div>
      </div>
    </>
  );
}
