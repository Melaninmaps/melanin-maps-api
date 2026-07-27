const base = import.meta.env.BASE_URL;

export default function DemoS42BizTransition() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex" style={{ background: "#0D0805" }}>
      {/* Dark left panel */}
      <div className="relative flex flex-col justify-center" style={{ width: "55%", paddingLeft: "8vw", paddingRight: "3vw", zIndex: 2 }}>
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "3px", background: "#CA922B" }} />
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "3vw" }}>PART TWO — THE BUSINESS OWNER JOURNEY</div>
        <div className="font-display" style={{ fontSize: "5.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.5vw" }}>
          Meet Marcus.
        </div>
        <div className="font-display" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.25, marginBottom: "2vw" }}>
          Owner of Copper &amp; Oak Bistro.<br />Trust Score: 97.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#7B5408", lineHeight: 1.7, marginBottom: "3vw", maxWidth: "36vw" }}>
          Marcus didn't build a 97 Trust Score with marketing spend. He built it by showing up, serving the community, and letting the people who ate at his table speak for him. Zara just left a review. Now it's his turn.
        </div>
        <div className="font-display" style={{ fontSize: "1.9vw", color: "#A6720F", fontStyle: "italic", fontWeight: 700 }}>
          Now let's see what Mapping With Melanin<br />looks like from the other side.
        </div>
      </div>

      {/* Right image panel */}
      <div className="relative flex-1">
        <img
          src={`${base}photos/entrepreneur-restaurant-owner.png`}
          crossOrigin="anonymous"
          alt="Marcus at Copper & Oak Bistro"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #0D0805 0%, transparent 30%)" }} />
        {/* Score badge */}
        <div className="absolute bottom-[5vh] right-[4vw] flex flex-col items-center">
          <div className="rounded-[1vw] px-[2vw] py-[1.2vw] flex flex-col items-center" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.5)", backdropFilter: "blur(8px)" }}>
            <div className="font-display" style={{ fontSize: "4vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>97</div>
            <div className="font-body" style={{ fontSize: "0.75vw", color: "#A87A40", fontWeight: 600, marginTop: "0.3vw" }}>TRUST SCORE</div>
            <div className="font-body" style={{ fontSize: "0.62vw", color: "#7B5408" }}>Copper &amp; Oak Bistro</div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>42 / 58</div>
    </div>
  );
}
