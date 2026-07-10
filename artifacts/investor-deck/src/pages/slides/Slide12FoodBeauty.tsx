const SAVED = [
  { initial: "N", name: "Nola's Kitchen", category: "Soul Food", rating: "4.9", trust: "Trusted by 340 neighbors" },
  { initial: "C", name: "Crown & Curl Studio", category: "Hair & Beauty", rating: "4.8", trust: "127 reviews from women who share her texture" },
  { initial: "M", name: "The Corner Market", category: "Grocery", rating: "4.7", trust: "Recommended by 3 friends in Houston" },
];

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
          She isn&rsquo;t starting over.
          <br />
          She&rsquo;s starting connected.
        </h1>
        <div className="font-body mt-[2.8vh]" style={{ fontSize: "1.3vw", color: "#D8B98A", fontWeight: 400, lineHeight: 1.5, textWrap: "balance" }}>
          Instead of starting from scratch, Jasmine discovers places already trusted by the community.
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 flex items-center" style={{ right: "7vw" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "40.85vw", borderRadius: "2.09vw", border: "0.475vw solid #1C0E06", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            <div className="flex items-center justify-between px-[1vw] py-[1vw]" style={{ background: "#1C0E06" }}>
              <span className="font-display" style={{ fontSize: "0.85vw", color: "#F5EBD8", fontWeight: 700 }}>Welcome to Houston</span>
              <span style={{ fontSize: "0.75vw", color: "#CA922B" }}>&#9733;</span>
            </div>
            <div className="px-[0.8vw] pt-[0.6vw]">
              <div className="font-body" style={{ fontSize: "0.62vw", color: "#A6720F", fontWeight: 700, letterSpacing: "0.06em" }}>RECOMMENDED FOR JASMINE</div>
              <div className="font-body" style={{ fontSize: "0.6vw", color: "#7B5408", marginTop: "0.15vw" }}>Based on community recommendations</div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col gap-[0.7vw] px-[0.8vw] pt-[0.6vw]">
              {SAVED.map((s) => (
                <div key={s.name} className="rounded-[0.9vw] px-[0.8vw] py-[0.75vw] flex items-start gap-[0.6vw]" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)" }}>
                  <div className="rounded-full flex-shrink-0 flex items-center justify-center font-display" style={{ width: "2.3vw", height: "2.3vw", background: "#CA922B", color: "#1C0E06", fontWeight: 700, fontSize: "0.95vw" }}>
                    {s.initial}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-body" style={{ fontSize: "0.75vw", color: "#1C0E06", fontWeight: 700 }}>{s.name}</span>
                      <span className="font-body" style={{ fontSize: "0.68vw", color: "#A6720F", fontWeight: 700 }}>&#9733; {s.rating}</span>
                    </div>
                    <div className="font-body" style={{ fontSize: "0.62vw", color: "#A6720F", marginTop: "0.15vw" }}>{s.category}</div>
                    <div className="font-body" style={{ fontSize: "0.6vw", color: "#7B5408", lineHeight: 1.35, marginTop: "0.35vw" }}>{s.trust}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[3.4vh]" style={{ marginLeft: "2.4vw", width: "13.5vw" }}>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", fontWeight: 700, lineHeight: 1.35 }}>
            Trusted by the Community
          </div>
          <div className="flex flex-col gap-[1.6vh]">
            <div className="flex items-center gap-[0.5vw]">
              <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.5 }} />
              <span className="font-body" style={{ fontSize: "0.88vw", color: "#D8B98A", fontWeight: 400, lineHeight: 1.4 }}>Local favorites the community stands behind.</span>
            </div>
            <div className="flex items-center gap-[0.5vw]">
              <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.5 }} />
              <span className="font-body" style={{ fontSize: "0.88vw", color: "#D8B98A", fontWeight: 400, lineHeight: 1.4 }}>Businesses that reflect her culture and values.</span>
            </div>
            <div className="flex items-center gap-[0.5vw]">
              <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.5 }} />
              <span className="font-body" style={{ fontSize: "0.88vw", color: "#D8B98A", fontWeight: 400, lineHeight: 1.4 }}>Today she&rsquo;s discovering them. Tomorrow she&rsquo;s recommending them.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
