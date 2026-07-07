export default function Slide10Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#2A1408" }}>
      {/* Gold frame */}
      <div className="absolute inset-[4vh_4vw]" style={{ border: "1px solid rgba(202,146,43,0.3)" }} />
      {/* Top + bottom bars */}
      <div className="absolute top-0 left-0 right-0 h-[0.6vh]" style={{ background: "#CA922B" }} />
      <div className="absolute bottom-0 left-0 right-0 h-[0.6vh]" style={{ background: "#CA922B" }} />

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>10</div>

      {/* Centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[15vw]">
        <div className="font-body mb-[3vh]" style={{ fontSize: "2.6vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 300 }}>
          ONLY 500 SPOTS
        </div>

        <h2 className="font-display text-accent leading-tight tracking-tight mb-[4vh]" style={{ fontSize: "6.5vw", fontWeight: 800, textWrap: "balance" }}>
          Join the Founding 500.
        </h2>

        <div className="biz-bar mb-[4vh]" style={{ width: "12vw", margin: "0 auto 4vh" }} />

        <p className="font-body text-accent mb-[5vh]" style={{ fontSize: "3.2vw", fontWeight: 300, lineHeight: 1.6, textWrap: "balance" }}>
          Be among the first 500 businesses to build your presence on the platform that's redefining community discovery.
        </p>

        <div className="px-[3vw] py-[2vh]" style={{ border: "1px solid #CA922B", background: "rgba(202,146,43,0.15)" }}>
          <div className="font-display text-accent" style={{ fontSize: "3.8vw", fontWeight: 800 }}>MAPPING WITH MELANIN™</div>
          <div className="font-body text-primary mt-[0.5vh]" style={{ fontSize: "2.6vw", fontWeight: 300, letterSpacing: "0.1em" }}>mappingwithmelanin.com</div>
        </div>
      </div>
    </div>
  );
}
