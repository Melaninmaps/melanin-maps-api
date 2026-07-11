const base = import.meta.env.BASE_URL;

export default function Slide02Vignettes() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35, zIndex: 10 }}>02</div>

      <div className="absolute inset-0 flex">
        <div className="relative overflow-hidden" style={{ flex: 1 }}>
          <img src={`${base}photos/family-relocating.jpg`} crossOrigin="anonymous" alt="A family" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="relative overflow-hidden" style={{ flex: 1 }}>
          <img src={`${base}photos/traveler-airport.jpg`} crossOrigin="anonymous" alt="A traveler" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="relative overflow-hidden" style={{ flex: 1 }}>
          <img src={`${base}photos/entrepreneur-storefront.jpg`} crossOrigin="anonymous" alt="An entrepreneur" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="relative overflow-hidden" style={{ flex: 1 }}>
          <img src={`${base}photos/student-movein.jpg`} crossOrigin="anonymous" alt="A neighbor" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>

      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,14,6,0.55) 0%, rgba(28,14,6,0.72) 45%, rgba(28,14,6,0.55) 100%)" }} />

      <div className="absolute left-[13vw] right-[3vw] top-1/2 -translate-y-1/2 text-center">
        <div className="font-display leading-tight" style={{ fontSize: "4.4vw", fontWeight: 700, color: "#FAF6EF", textWrap: "balance" }}>
          Communities don&rsquo;t happen by accident.
        </div>
        <div className="font-body mt-[1.1vw]" style={{ fontSize: "2.6vw", fontWeight: 400, color: "#E8C97A" }}>
          Someone chooses to build one.
        </div>
      </div>
    </div>
  );
}
