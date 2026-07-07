export default function Slide03Reach() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(90,45,10,0.35) 0%, transparent 55%)" }} />

      {/* Top gold bar */}
      <div className="absolute top-0 left-0 right-0 h-[0.6vh]" style={{ background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>03</div>

      {/* Header */}
      <div className="absolute top-[8vh] left-[7vw] right-[7vw]">
        <h2 className="font-display text-accent leading-tight" style={{ fontSize: "5.2vw", fontWeight: 800 }}>
          Where we are.
        </h2>
        <div className="biz-bar w-[12vw] mt-[1.5vh]" />
      </div>

      {/* City grid — 2 rows x 4 cols */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "28vh", bottom: "8vh" }}>
        <div className="grid grid-cols-4 gap-[2vw] h-full">
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)" }}>
            <div className="font-display text-accent" style={{ fontSize: "3.8vw", fontWeight: 800 }}>Philadelphia</div>
            <div className="biz-bar w-[3vw] mt-[1.5vh]" />
            <div className="font-body mt-[1vh]" style={{ fontSize: "2.6vw", color: "#CA922B", fontWeight: 300 }}>Launch City</div>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-accent" style={{ fontSize: "3.8vw", fontWeight: 800 }}>Atlanta</div>
            <div className="biz-bar w-[3vw] mt-[1.5vh]" />
            <div className="font-body mt-[1vh]" style={{ fontSize: "2.6vw", color: "#CA922B", fontWeight: 300 }}>Growing</div>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-accent" style={{ fontSize: "3.8vw", fontWeight: 800 }}>Houston</div>
            <div className="biz-bar w-[3vw] mt-[1.5vh]" />
            <div className="font-body mt-[1vh]" style={{ fontSize: "2.6vw", color: "#CA922B", fontWeight: 300 }}>Growing</div>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-accent" style={{ fontSize: "3.8vw", fontWeight: 800 }}>D.C.</div>
            <div className="biz-bar w-[3vw] mt-[1.5vh]" />
            <div className="font-body mt-[1vh]" style={{ fontSize: "2.6vw", color: "#CA922B", fontWeight: 300 }}>Coming Soon</div>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-accent" style={{ fontSize: "3.8vw", fontWeight: 800 }}>Chicago</div>
            <div className="biz-bar w-[3vw] mt-[1.5vh]" />
            <div className="font-body mt-[1vh]" style={{ fontSize: "2.6vw", color: "#CA922B", fontWeight: 300 }}>Coming Soon</div>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-accent" style={{ fontSize: "3.8vw", fontWeight: 800 }}>New York</div>
            <div className="biz-bar w-[3vw] mt-[1.5vh]" />
            <div className="font-body mt-[1vh]" style={{ fontSize: "2.6vw", color: "#CA922B", fontWeight: 300 }}>Coming Soon</div>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display text-accent" style={{ fontSize: "3.8vw", fontWeight: 800 }}>Miami</div>
            <div className="biz-bar w-[3vw] mt-[1.5vh]" />
            <div className="font-body mt-[1vh]" style={{ fontSize: "2.6vw", color: "#CA922B", fontWeight: 300 }}>Coming Soon</div>
          </div>
          <div className="flex flex-col justify-center py-[3vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display text-accent" style={{ fontSize: "3.8vw", fontWeight: 800 }}>+ More</div>
            <div className="biz-bar w-[3vw] mt-[1.5vh]" />
            <div className="font-body mt-[1vh]" style={{ fontSize: "2.6vw", color: "#CA922B", fontWeight: 300 }}>Expanding</div>
          </div>
        </div>
      </div>
    </div>
  );
}
