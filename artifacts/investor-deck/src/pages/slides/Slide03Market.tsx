export default function Slide03Market() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#FAF6EF" }}>
      <div className="inv-rule w-full" />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>03</div>

      <div className="flex-1 flex px-[7vw] pt-[5vh] pb-[6vh] gap-[5vw]">
        {/* Left: Header + context */}
        <div className="w-[38vw] flex-shrink-0 flex flex-col justify-center">
          <div className="font-body mb-[2vh]" style={{ fontSize: "2.2vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>THE MARKET</div>
          <h2 className="font-display" style={{ fontSize: "4.5vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.15, textWrap: "balance" }}>
            A market the size of a country.
          </h2>
          <div className="inv-rule w-[14vw] mt-[2vh] mb-[2.5vh]" />
          <p className="font-body" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#3A1F0E", lineHeight: 1.55 }}>
            The melanated diaspora and minority communities represent one of the largest consumer markets in the world — and no platform has been built for them at scale.
          </p>
        </div>

        {/* Right: 3 stats */}
        <div className="flex-1 flex flex-col justify-evenly">
          <div className="py-[2.5vh] px-[2.5vw]" style={{ borderLeft: "4px solid #CA922B", background: "rgba(202,146,43,0.06)" }}>
            <div className="font-display" style={{ fontSize: "7vw", fontWeight: 700, color: "#CA922B", lineHeight: 1 }}>100M+</div>
            <div className="font-body mt-[0.8vh]" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#1C0E06" }}>Minorities and melanated diaspora in the US</div>
          </div>
          <div className="py-[2.5vh] px-[2.5vw]" style={{ borderLeft: "4px solid #CA922B", background: "rgba(202,146,43,0.06)" }}>
            <div className="font-display" style={{ fontSize: "7vw", fontWeight: 700, color: "#CA922B", lineHeight: 1 }}>$3T+</div>
            <div className="font-body mt-[0.8vh]" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#1C0E06" }}>In collective buying power</div>
          </div>
          <div className="py-[2.5vh] px-[2.5vw]" style={{ borderLeft: "4px solid #CA922B", background: "rgba(202,146,43,0.06)" }}>
            <div className="font-display" style={{ fontSize: "7vw", fontWeight: 700, color: "#CA922B", lineHeight: 1 }}>10M+</div>
            <div className="font-body mt-[0.8vh]" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#1C0E06" }}>Minority-owned businesses nationwide</div>
          </div>
        </div>
      </div>
    </div>
  );
}
