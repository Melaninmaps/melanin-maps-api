const base = import.meta.env.BASE_URL;

export default function Slide11FoodBeauty() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 50%, rgba(202,146,43,0.14), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>12</div>

      <div className="absolute left-[6vw] top-1/2 -translate-y-1/2" style={{ maxWidth: "34vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          JASMINE&rsquo;S JOURNEY
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          She isn&rsquo;t just finding businesses.
          <br />
          She&rsquo;s finding pieces of home.
        </h1>
        <div className="font-body mt-[2.8vh]" style={{ fontSize: "1.3vw", color: "#D8B98A", fontWeight: 400, lineHeight: 1.5, textWrap: "balance" }}>
          Instead of starting from scratch, Jasmine discovers places already trusted by the community.
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 flex items-center" style={{ right: "7vw" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "40.85vw", borderRadius: "2.09vw", border: "0.475vw solid #1C0E06", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <img src={`${base}mockups/app-discover.jpg`} crossOrigin="anonymous" alt="App discover screen" className="absolute inset-0 w-full h-full object-cover" />
        </div>

        <div className="flex flex-col gap-[3.4vh]" style={{ marginLeft: "2.4vw", width: "13vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.5 }} />
            <span className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", fontWeight: 700, lineHeight: 1.35 }}>Community favorites</span>
          </div>
          <div className="font-body" style={{ fontSize: "0.92vw", color: "#D8B98A", fontWeight: 400, lineHeight: 1.6, fontStyle: "italic" }}>
            Restaurants that remind her of Philadelphia.
            <br /><br />
            A stylist who understands her hair.
            <br /><br />
            Recommendations she can trust before she ever arrives.
          </div>
        </div>
      </div>
    </div>
  );
}
