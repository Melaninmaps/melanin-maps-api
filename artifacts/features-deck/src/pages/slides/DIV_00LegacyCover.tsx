export default function DIV00LegacyCover() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(82,35,5,0.45) 0%, #1C0E06 45%, #100804 100%)" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 68% 60%, rgba(202,146,43,0.06) 0%, transparent 55%)" }}
      />

      <div className="absolute left-[6vw] top-[4.5vw] font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.35em", fontWeight: 600 }}>
        MAPPING WITH MELANIN&trade;
      </div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.78vw", color: "#A07840", letterSpacing: "0.32em", fontWeight: 600, marginBottom: "2.4vw" }}>
          VOLUME II &mdash; PRESENTATION SYSTEM
        </div>

        <div style={{ width: "4vw", height: "1px", background: "rgba(202,146,43,0.35)", marginBottom: "2.8vw" }} />

        <h1
          className="font-display text-center"
          style={{
            fontSize: "6.4vw",
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: "1.6vw",
            maxWidth: "80vw",
            background: "linear-gradient(135deg, #CA922B 0%, #F0C060 45%, #CA922B 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 2px 24px rgba(202,146,43,0.22))",
          }}
        >
          The Legacy Collection
        </h1>

        <p
          className="font-display text-center"
          style={{
            fontSize: "2vw",
            color: "#FAF6EF",
            fontWeight: 300,
            fontStyle: "italic",
            letterSpacing: "0.02em",
            lineHeight: 1.5,
            marginBottom: "3.2vw",
            maxWidth: "54vw",
            opacity: 0.82,
          }}
        >
          The enduring institutional body of work.
        </p>

        <div style={{ width: "4vw", height: "1px", background: "rgba(202,146,43,0.35)", marginBottom: "3.2vw" }} />

        <div className="flex items-center gap-[4vw]">
          {[
            { label: "Experience", num: "I" },
            { label: "Investor", num: "II" },
            { label: "Business", num: "III" },
            { label: "Community", num: "IV" },
          ].map((ch) => (
            <div key={ch.num} className="flex flex-col items-center gap-[0.5vw]">
              <div
                className="font-display"
                style={{ fontSize: "1.8vw", color: "#CA922B", fontWeight: 700 }}
              >
                {ch.num}
              </div>
              <div
                className="font-body"
                style={{ fontSize: "0.7vw", color: "#7B5B30", letterSpacing: "0.22em", fontWeight: 500 }}
              >
                {ch.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-[4vw] left-0 right-0 flex justify-center">
        <div className="font-body" style={{ fontSize: "0.8vw", color: "#5A3A18", letterSpacing: "0.22em" }}>
          mappingwithmelanin.com
        </div>
      </div>
    </div>
  );
}
