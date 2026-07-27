export default function DIV04CommunityChapter() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 65% 55%, rgba(82,35,5,0.44) 0%, #1C0E06 48%, #100804 100%)" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-[6vw] top-[4.5vw] font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.35em", fontWeight: 600 }}>
        MAPPING WITH MELANIN&trade; &mdash; LEGACY COLLECTION
      </div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: "12%", bottom: "12%" }}>
        <div className="font-body" style={{ fontSize: "0.75vw", color: "#7B5B30", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "2vw" }}>
          CHAPTER FOUR
        </div>

        <h1
          className="font-display text-center"
          style={{
            fontSize: "5.8vw",
            fontWeight: 800,
            lineHeight: 1.08,
            marginBottom: "2.4vw",
            maxWidth: "70vw",
            color: "#FAF6EF",
            textShadow: "0 2px 32px rgba(202,146,43,0.18)",
          }}
        >
          The Community<br />
          <span
            style={{
              background: "linear-gradient(135deg, #CA922B 0%, #F0C060 50%, #CA922B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Chapter
          </span>
        </h1>

        <div style={{ width: "4vw", height: "1px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)", marginBottom: "2.4vw" }} />

        <p
          className="font-body text-center"
          style={{ fontSize: "1.55vw", color: "#A07840", fontWeight: 300, lineHeight: 1.7, maxWidth: "44vw" }}
        >
          Welcome home.
        </p>

        <div className="font-body" style={{ fontSize: "0.75vw", color: "#5A3A18", letterSpacing: "0.22em", marginTop: "3.2vw" }}>
          13 CANONICAL PAGES
        </div>
      </div>

      <div className="absolute bottom-[4vw] right-[6vw] font-body" style={{ fontSize: "0.8vw", color: "#5A3A18", letterSpacing: "0.22em" }}>
        MWM-COM-P01–P13
      </div>
    </div>
  );
}
