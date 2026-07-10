const base = import.meta.env.BASE_URL;

export default function Slide09AppOpen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 50%, rgba(202,146,43,0.14), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>09</div>

      <div className="absolute left-[6vw] top-1/2 -translate-y-1/2" style={{ maxWidth: "32vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.8vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE EXPERIENCE
        </div>
        <div className="relative overflow-hidden" style={{ width: "26vw", height: "34vw", borderRadius: "1vw", boxShadow: "0 1.6vw 3vw rgba(0,0,0,0.4)" }}>
          <img src={`${base}photos/traveler-airport.jpg`} crossOrigin="anonymous" alt="Jasmine with her phone in hand" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2" style={{ right: "9vw" }}>
        <div className="relative" style={{ width: "20vw", height: "43vw", borderRadius: "2.2vw", border: "0.5vw solid #2A160C", background: "#1C0E06", boxShadow: "0 2vw 4vw rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <img src={`${base}mockups/app-home.jpg`} crossOrigin="anonymous" alt="App home screen" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
