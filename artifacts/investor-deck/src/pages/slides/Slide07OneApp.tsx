export default function Slide07OneApp() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 30%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>07</div>
      <div className="text-center px-[8vw]">
        <div className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          Now imagine opening one app&hellip;
        </div>
        <div className="font-display leading-tight mt-[2vh]" style={{ fontSize: "6.4vw", fontWeight: 700, color: "#CA922B", textWrap: "balance" }}>
          &hellip;and finding all of it.
        </div>
      </div>
    </div>
  );
}
