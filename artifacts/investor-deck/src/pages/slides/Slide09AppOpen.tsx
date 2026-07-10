const base = import.meta.env.BASE_URL;

export default function Slide09AppOpen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>09</div>

      <div className="absolute left-[6vw] top-1/2 -translate-y-1/2" style={{ maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>
          Travel.
        </h1>
        <div className="font-display leading-tight mt-[2.5vh]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Confidence is the best travel companion.
        </div>
        <div className="font-body mt-[2.5vh]" style={{ fontSize: "1.4vw", color: "#7B5408", fontWeight: 400, lineHeight: 1.5, textWrap: "balance" }}>
          Discover safer neighborhoods, trusted businesses, and community insight before you arrive&mdash;so every trip begins with confidence, not uncertainty.
        </div>
        <div className="inv-rule mt-[3.5vh] mb-[1.6vh]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.5vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>
          Know before you go.
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 flex items-center" style={{ right: "6vw" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "40.85vw", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <img src={`${base}mockups/app-map.jpg`} crossOrigin="anonymous" alt="Map and safety screen" className="absolute inset-0 w-full h-full object-cover" />
        </div>

        <div className="flex flex-col gap-[3.4vh]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Know safety</strong> before you arrive.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Discover trusted businesses</strong> wherever you go.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Relocate</strong> with community insight.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
