const base = import.meta.env.BASE_URL;

export default function SlideBeforeYouArrive() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 75% 50%, rgba(202,146,43,0.13) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>
        06
      </div>

      {/* Left content */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "8%", bottom: "8%", width: "50vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>
          KINFOLK &mdash; TRAVEL INTELLIGENCE
        </div>

        <h1 className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.3vw" }}>
          Before You
        </h1>
        <h1 className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.05, marginBottom: "2.5vw" }}>
          Even Arrive.
        </h1>

        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2.5vw" }} />

        <p className="font-body" style={{ fontSize: "1.35vw", color: "#C4935A", fontWeight: 300, lineHeight: 1.7, marginBottom: "2.8vw", maxWidth: "40vw" }}>
          Leave uncertainty at home. Kinfolk helps you prepare before you ever pack a bag.
          Ask questions naturally, discover neighborhoods, understand the local culture,
          and build confidence before you arrive.
        </p>

        {/* Feature chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8vw" }}>
          {["Neighborhood deep-dives", "Cultural context", "Local recommendations", "Safety insights", "Community connections"].map((chip) => (
            <div
              key={chip}
              style={{ padding: "0.45vw 1.1vw", border: "1px solid rgba(202,146,43,0.35)", background: "rgba(202,146,43,0.07)" }}
            >
              <span className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", fontWeight: 500, letterSpacing: "0.04em" }}>{chip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phone mockup */}
      <div className="absolute flex items-center justify-center" style={{ right: "6vw", top: "6%", bottom: "6%" }}>
        <div
          className="relative flex-shrink-0"
          style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.1vw", border: "0.5vw solid #2A1508", background: "#0D0805", boxShadow: "0 1.5vw 3vw rgba(0,0,0,0.5), 0 0 0 0.1vw rgba(202,146,43,0.2)", overflow: "hidden" }}
        >
          <img
            src={`${base}app-home.jpg`}
            crossOrigin="anonymous"
            alt="Kinfolk AI screen"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center top" }}
          />
        </div>
      </div>
    </div>
  );
}
