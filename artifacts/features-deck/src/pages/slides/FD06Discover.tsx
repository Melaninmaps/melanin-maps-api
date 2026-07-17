const categories = ["Businesses", "People", "Stories", "Neighborhoods", "Culture", "Opportunity"];

export default function FD06Discover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(202,146,43,0.10) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>06</div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3vw" }}>
          DISCOVER
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "2.4vw", marginBottom: "1.6vw" }}>
          <div className="text-center">
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#3D2008", letterSpacing: "0.18em", marginBottom: "0.6vw" }}>BEFORE</div>
            <div className="font-display" style={{ fontSize: "2.6vw", color: "#3D2008", fontWeight: 700 }}>uncertainty.</div>
          </div>
          <div style={{ width: "3vw", height: "1px", background: "#CA922B", opacity: 0.5 }} />
          <div className="text-center">
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.18em", marginBottom: "0.6vw" }}>AFTER</div>
            <div className="font-display" style={{ fontSize: "2.6vw", color: "#CA922B", fontWeight: 700 }}>confidence.</div>
          </div>
        </div>

        <div style={{ width: "4vw", height: "2px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)", marginBottom: "2.4vw" }} />

        <p className="font-quote text-center" style={{ fontSize: "2.1vw", color: "#FAF6EF", fontStyle: "italic", lineHeight: 1.65, marginBottom: "3.6vw" }}>
          She didn&rsquo;t just find a place.<br />She found certainty.
        </p>

        <div className="flex flex-wrap justify-center" style={{ gap: "0.8vw", maxWidth: "60vw" }}>
          {categories.map((cat) => (
            <div key={cat} style={{ padding: "0.5vw 1.4vw", border: "1px solid rgba(202,146,43,0.35)", borderRadius: "999px", background: "rgba(202,146,43,0.06)" }}>
              <span className="font-body" style={{ fontSize: "0.95vw", color: "#A07840", letterSpacing: "0.1em" }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
