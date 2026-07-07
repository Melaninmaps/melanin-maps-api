export default function Slide06FoundingBenefits() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(90,45,10,0.4) 0%, transparent 55%)" }} />

      {/* Left bold gold column */}
      <div className="absolute left-0 top-0 bottom-0 w-[9vw] flex flex-col items-center justify-center" style={{ background: "#CA922B" }}>
        <div className="font-display text-accent" style={{ fontSize: "2vw", fontWeight: 800, letterSpacing: "0.2em", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>FOUNDING 500</div>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>06</div>

      {/* Header */}
      <div className="absolute top-[8vh] left-[13vw] right-[6vw]">
        <h2 className="font-display text-accent leading-tight" style={{ fontSize: "5vw", fontWeight: 800 }}>Founding benefits.</h2>
        <div className="biz-bar w-[15vw] mt-[1.5vh]" />
      </div>

      {/* 5 benefits */}
      <div className="absolute left-[13vw] right-[6vw]" style={{ top: "29vh", bottom: "8vh" }}>
        <div className="flex flex-col gap-[2.2vh] h-full justify-evenly">
          <div className="flex items-center gap-[2.5vw] py-[2vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)" }}>
            <div className="font-display text-primary flex-shrink-0" style={{ fontSize: "4vw", fontWeight: 800 }}>01</div>
            <div>
              <div className="font-display text-accent" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Permanent Gold Badge</div>
              <div className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.75 }}>Founding business seal displayed on your profile forever</div>
            </div>
          </div>
          <div className="flex items-center gap-[2.5vw] py-[2vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display text-primary flex-shrink-0" style={{ fontSize: "4vw", fontWeight: 800 }}>02</div>
            <div>
              <div className="font-display text-accent" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Priority Listing</div>
              <div className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.75 }}>Top placement in search, map, and category results</div>
            </div>
          </div>
          <div className="flex items-center gap-[2.5vw] py-[2vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)" }}>
            <div className="font-display text-primary flex-shrink-0" style={{ fontSize: "4vw", fontWeight: 800 }}>03</div>
            <div>
              <div className="font-display text-accent" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Locked-In Rate</div>
              <div className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.75 }}>Founding member pricing stays fixed as the platform grows</div>
            </div>
          </div>
          <div className="flex items-center gap-[2.5vw] py-[2vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display text-primary flex-shrink-0" style={{ fontSize: "4vw", fontWeight: 800 }}>04</div>
            <div>
              <div className="font-display text-accent" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Early Feature Access</div>
              <div className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.75 }}>First to use new business tools and dashboard features</div>
            </div>
          </div>
          <div className="flex items-center gap-[2.5vw] py-[2vh] px-[2.5vw]" style={{ background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)" }}>
            <div className="font-display text-primary flex-shrink-0" style={{ fontSize: "4vw", fontWeight: 800 }}>05</div>
            <div>
              <div className="font-display text-accent" style={{ fontSize: "3.2vw", fontWeight: 800 }}>Featured in Launch Campaign</div>
              <div className="font-body text-accent" style={{ fontSize: "2.8vw", fontWeight: 300, opacity: 0.75 }}>Included in city launch marketing and press</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
