const base = import.meta.env.BASE_URL;

export default function Slide02Vignettes() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>02</div>

      <div className="absolute top-[6vh] left-[6vw]">
        <div className="font-body" style={{ fontSize: "1.6vw", color: "#7B5408", letterSpacing: "0.16em", fontWeight: 500 }}>
          FOUR STORIES, ONE THREAD
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] top-[16vh] bottom-[6vh] grid grid-cols-4 gap-[1.4vw]">
        <div className="relative overflow-hidden rounded-[0.4vw]">
          <img src={`${base}photos/family-relocating.jpg`} crossOrigin="anonymous" alt="A family relocates" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(28,14,6,0.88), rgba(28,14,6,0.05))" }} />
          <div className="absolute bottom-[2vh] left-[1.2vw] right-[1.2vw] font-display" style={{ fontSize: "1.9vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.15 }}>
            A family relocates.
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[0.4vw]">
          <img src={`${base}photos/traveler-airport.jpg`} crossOrigin="anonymous" alt="A traveler lands in a new city" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(28,14,6,0.88), rgba(28,14,6,0.05))" }} />
          <div className="absolute bottom-[2vh] left-[1.2vw] right-[1.2vw] font-display" style={{ fontSize: "1.9vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.15 }}>
            A traveler lands in a new city.
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[0.4vw]">
          <img src={`${base}photos/entrepreneur-storefront.jpg`} crossOrigin="anonymous" alt="A young entrepreneur opens a business" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(28,14,6,0.88), rgba(28,14,6,0.05))" }} />
          <div className="absolute bottom-[2vh] left-[1.2vw] right-[1.2vw] font-display" style={{ fontSize: "1.9vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.15 }}>
            A young entrepreneur opens a business.
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[0.4vw]">
          <img src={`${base}photos/student-movein.jpg`} crossOrigin="anonymous" alt="A college student leaves home for the first time" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(28,14,6,0.88), rgba(28,14,6,0.05))" }} />
          <div className="absolute bottom-[2vh] left-[1.2vw] right-[1.2vw] font-display" style={{ fontSize: "1.9vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.15 }}>
            A college student leaves home for the first time.
          </div>
        </div>
      </div>
    </div>
  );
}
