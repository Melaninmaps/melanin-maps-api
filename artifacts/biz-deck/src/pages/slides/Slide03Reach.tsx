export default function Slide03Reach() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(90,45,10,0.35) 0%, transparent 55%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.5vh]" style={{ background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>03</div>

      {/* Header */}
      <div className="relative px-[7vw] pt-[5vh] pb-[2.5vh]">
        <h2 className="font-display" style={{ fontSize: "4.5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.15 }}>
          Where we are.
        </h2>
        <div className="biz-bar w-[10vw] mt-[1.2vh]" />
      </div>

      {/* City grid */}
      <div className="relative flex-1 px-[7vw] pb-[6vh]">
        <div className="grid grid-cols-4 gap-[1.8vw] h-full">
          <div className="flex flex-col justify-center py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)" }}>
            <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF" }}>Philadelphia</div>
            <div className="biz-bar w-[3vw] mt-[1.2vh] mb-[0.8vh]" />
            <div className="font-body" style={{ fontSize: "2.4vw", color: "#CA922B", fontWeight: 300 }}>Launch City</div>
          </div>
          <div className="flex flex-col justify-center py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF" }}>Atlanta</div>
            <div className="biz-bar w-[3vw] mt-[1.2vh] mb-[0.8vh]" />
            <div className="font-body" style={{ fontSize: "2.4vw", color: "#CA922B", fontWeight: 300 }}>Growing</div>
          </div>
          <div className="flex flex-col justify-center py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF" }}>Houston</div>
            <div className="biz-bar w-[3vw] mt-[1.2vh] mb-[0.8vh]" />
            <div className="font-body" style={{ fontSize: "2.4vw", color: "#CA922B", fontWeight: 300 }}>Growing</div>
          </div>
          <div className="flex flex-col justify-center py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF" }}>D.C.</div>
            <div className="biz-bar w-[3vw] mt-[1.2vh] mb-[0.8vh]" />
            <div className="font-body" style={{ fontSize: "2.4vw", color: "#CA922B", fontWeight: 300 }}>Coming Soon</div>
          </div>
          <div className="flex flex-col justify-center py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF" }}>Chicago</div>
            <div className="biz-bar w-[3vw] mt-[1.2vh] mb-[0.8vh]" />
            <div className="font-body" style={{ fontSize: "2.4vw", color: "#CA922B", fontWeight: 300 }}>Coming Soon</div>
          </div>
          <div className="flex flex-col justify-center py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF" }}>New York</div>
            <div className="biz-bar w-[3vw] mt-[1.2vh] mb-[0.8vh]" />
            <div className="font-body" style={{ fontSize: "2.4vw", color: "#CA922B", fontWeight: 300 }}>Coming Soon</div>
          </div>
          <div className="flex flex-col justify-center py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF" }}>Miami</div>
            <div className="biz-bar w-[3vw] mt-[1.2vh] mb-[0.8vh]" />
            <div className="font-body" style={{ fontSize: "2.4vw", color: "#CA922B", fontWeight: 300 }}>Coming Soon</div>
          </div>
          <div className="flex flex-col justify-center py-[2.5vh] px-[2vw]" style={{ background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF" }}>+ More</div>
            <div className="biz-bar w-[3vw] mt-[1.2vh] mb-[0.8vh]" />
            <div className="font-body" style={{ fontSize: "2.4vw", color: "#CA922B", fontWeight: 300 }}>Expanding</div>
          </div>
        </div>
      </div>
    </div>
  );
}
