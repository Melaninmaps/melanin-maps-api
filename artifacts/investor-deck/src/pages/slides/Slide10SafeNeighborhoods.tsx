const base = import.meta.env.BASE_URL;

export default function Slide10SafeNeighborhoods() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>10</div>

      <div className="absolute left-[6vw] top-1/2 -translate-y-1/2" style={{ maxWidth: "34vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.8vw", color: "#7B5408", letterSpacing: "0.16em", fontWeight: 500 }}>
          JASMINE&rsquo;S JOURNEY
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "4.4vw", fontWeight: 700, color: "#1C0E06", textWrap: "balance" }}>
          She discovers safe, welcoming neighborhoods.
        </h1>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2" style={{ right: "9vw" }}>
        <div className="relative" style={{ width: "20vw", height: "43vw", borderRadius: "2.2vw", border: "0.5vw solid #1C0E06", background: "#1C0E06", boxShadow: "0 2vw 4vw rgba(28,14,6,0.35)", overflow: "hidden" }}>
          <img src={`${base}mockups/app-map.jpg`} crossOrigin="anonymous" alt="App map screen" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
