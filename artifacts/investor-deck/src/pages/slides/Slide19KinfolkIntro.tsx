export default function Slide19KinfolkIntro() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 40%, rgba(202,146,43,0.2), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>19</div>
      <div className="text-center px-[8vw]">
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.8vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          MEET KINFOLK AI
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#FAF6EF" }}>
          Not just AI.
        </h1>
        <div className="font-display leading-tight mt-[1vh]" style={{ fontSize: "6.2vw", fontWeight: 700, color: "#CA922B" }}>
          Your business partner.
        </div>
      </div>
    </div>
  );
}
