export default function Slide25FoundingInvite() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(202,146,43,0.2), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>25</div>
      <div className="text-center px-[8vw]">
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.8vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          JOIN US
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.4vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          Become one of our Founding Businesses.
        </h1>
        <div className="inv-rule mx-auto w-[8vw] my-[4vh]" />
        <div className="font-body" style={{ fontSize: "2.4vw", color: "#A87A40", fontWeight: 300 }}>
          Mapping With Melanin&trade;
        </div>
      </div>
    </div>
  );
}
