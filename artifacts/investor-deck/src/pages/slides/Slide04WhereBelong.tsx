export default function Slide04WhereBelong() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 70%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>04</div>
      <h1 className="font-display" style={{ fontSize: "10vw", fontWeight: 700, color: "#FAF6EF" }}>
        &ldquo;Where do I belong?&rdquo;
      </h1>
    </div>
  );
}
