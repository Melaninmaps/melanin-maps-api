export default function Slide23BiggerThan() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 60% 60%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>30</div>
      <div className="text-center px-[8vw]">
        <div className="font-display leading-tight" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          This is bigger than finding businesses.
        </div>
        <div className="inv-rule mx-auto w-[8vw] my-[4vh]" style={{ background: "#CA922B" }} />
        <div className="font-display leading-tight" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#CA922B", textWrap: "balance" }}>
          It&rsquo;s about building economic opportunity.
        </div>
      </div>
    </div>
  );
}
