export default function Slide03Market() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      {/* Top gold rule */}
      <div className="inv-rule absolute top-0 left-0 right-0" />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>03</div>

      {/* Left: Header */}
      <div className="absolute left-[7vw] top-[8vh] bottom-[8vh] w-[40vw] flex flex-col justify-center">
        <div className="font-body mb-[2vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 300 }}>THE MARKET</div>
        <h2 className="font-display" style={{ fontSize: "5.2vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.1, textWrap: "balance" }}>
          A market the size of a country.
        </h2>
        <div className="inv-rule w-[16vw] mt-[2vh] mb-[3vh]" />
        <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#3A1F0E", lineHeight: 1.5 }}>
          The melanated diaspora and minority communities represent one of the largest consumer markets in the world — and no platform has been built to serve them at scale.
        </p>
      </div>

      {/* Right: 3 stats stacked */}
      <div className="absolute right-[7vw] top-[8vh] bottom-[8vh] w-[45vw] flex flex-col justify-evenly">
        <div className="py-[3vh] px-[3vw]" style={{ border: "1px solid rgba(202,146,43,0.4)", borderLeft: "4px solid #CA922B", background: "rgba(202,146,43,0.05)" }}>
          <div className="font-display" style={{ fontSize: "8vw", fontWeight: 700, color: "#CA922B", lineHeight: 1 }}>100M+</div>
          <div className="font-body mt-[1vh]" style={{ fontSize: "3vw", fontWeight: 300, color: "#1C0E06" }}>Minorities and melanated diaspora in the US</div>
        </div>
        <div className="py-[3vh] px-[3vw]" style={{ border: "1px solid rgba(202,146,43,0.4)", borderLeft: "4px solid #CA922B", background: "rgba(202,146,43,0.05)" }}>
          <div className="font-display" style={{ fontSize: "8vw", fontWeight: 700, color: "#CA922B", lineHeight: 1 }}>$3T+</div>
          <div className="font-body mt-[1vh]" style={{ fontSize: "3vw", fontWeight: 300, color: "#1C0E06" }}>In collective buying power</div>
        </div>
        <div className="py-[3vh] px-[3vw]" style={{ border: "1px solid rgba(202,146,43,0.4)", borderLeft: "4px solid #CA922B", background: "rgba(202,146,43,0.05)" }}>
          <div className="font-display" style={{ fontSize: "8vw", fontWeight: 700, color: "#CA922B", lineHeight: 1 }}>10M+</div>
          <div className="font-body mt-[1vh]" style={{ fontSize: "3vw", fontWeight: 300, color: "#1C0E06" }}>Minority-owned businesses nationwide</div>
        </div>
      </div>
    </div>
  );
}
