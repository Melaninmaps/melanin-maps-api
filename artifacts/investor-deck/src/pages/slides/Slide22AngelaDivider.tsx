export default function Slide22AngelaDivider() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 30%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>22</div>
      <div className="text-center px-[8vw]">
        <div className="font-body mb-[1.1vw]" style={{ fontSize: "1.8vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          A NEW CHAPTER
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          Growing a business shouldn&rsquo;t mean chasing attention.
        </h1>
        <h1 className="font-display leading-tight" style={{ fontSize: "4.6vw", fontWeight: 700, color: "#CA922B", textWrap: "balance" }}>
          It should mean being discovered by the right people.
        </h1>
      </div>
    </div>
  );
}
