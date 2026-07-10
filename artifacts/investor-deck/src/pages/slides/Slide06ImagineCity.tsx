const base = import.meta.env.BASE_URL;

export default function Slide06ImagineCity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>06</div>

      <div className="absolute left-[6vw] top-1/2 -translate-y-1/2" style={{ maxWidth: "38vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.5vw", color: "#7B5408", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE DISCOVER EXPERIENCE
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.2vw", fontWeight: 700, color: "#1C0E06" }}>
          Discover
        </h1>
        <div className="font-display leading-tight mt-[2.5vh]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Every meaningful connection begins with finding the right place.
        </div>
        <div className="font-body mt-[2.5vh]" style={{ fontSize: "1.4vw", color: "#7B5408", fontWeight: 400, lineHeight: 1.5, textWrap: "balance" }}>
          Search trusted businesses, neighborhoods, professionals, events, and opportunities&mdash;all tailored to your journey.
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2" style={{ right: "9vw" }}>
        <div className="relative" style={{ width: "20vw", height: "43vw", borderRadius: "2.2vw", border: "0.5vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 2vw 4vw rgba(0,0,0,0.35)", overflow: "hidden" }}>
          <img src={`${base}mockups/app-discover.jpg`} crossOrigin="anonymous" alt="Discover screen" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
