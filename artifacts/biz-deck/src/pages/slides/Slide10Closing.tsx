export default function Slide10Closing() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center text-center" style={{ background: "#2A1408" }}>
      <div className="absolute inset-[3.5vh_3.5vw]" style={{ border: "1px solid rgba(202,146,43,0.3)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.5vh]" style={{ background: "#CA922B" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.5vh]" style={{ background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>10</div>

      <div className="relative flex flex-col items-center px-[14vw]">
        <div className="font-body mb-[2.5vh]" style={{ fontSize: "2.4vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 300 }}>
          ONLY 500 SPOTS
        </div>
        <h2 className="font-display leading-tight tracking-tight mb-[3vh]" style={{ fontSize: "5.8vw", fontWeight: 800, color: "#FAF6EF", textWrap: "balance" }}>
          Join the Founding 500.
        </h2>
        <div className="biz-bar mb-[3vh]" style={{ width: "10vw" }} />
        <p className="font-body mb-[4vh]" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", lineHeight: 1.6, textWrap: "balance" }}>
          Be among the first 500 businesses to build your presence on the platform that's redefining community discovery.
        </p>
        <div className="px-[3vw] py-[2vh]" style={{ border: "1px solid #CA922B", background: "rgba(202,146,43,0.15)" }}>
          <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF" }}>MAPPING WITH MELANIN™</div>
          <div className="font-body mt-[0.5vh]" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#CA922B", letterSpacing: "0.1em" }}>mappingwithmelanin.com</div>
        </div>
      </div>
    </div>
  );
}
