const base = import.meta.env.BASE_URL;

export default function Slide11MeetJasmine() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>11</div>

      <div className="absolute left-0 top-0 w-[42vw] h-full overflow-hidden">
        <img src={`${base}photos/traveler-airport.jpg`} crossOrigin="anonymous" alt="Jasmine" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(28,14,6,0.05), rgba(28,14,6,0.55))" }} />
      </div>

      <div className="absolute right-[6vw] top-1/2 -translate-y-1/2" style={{ left: "46vw" }}>
        <div className="font-body mb-[2vh]" style={{ fontSize: "1.8vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          A USER STORY
        </div>
        <h1 className="font-display leading-tight" style={{ fontSize: "5vw", fontWeight: 700, color: "#1C0E06" }}>
          Meet Jasmine.
        </h1>
        <div className="inv-rule w-[8vw] my-[2.5vh]" />
        <div className="font-body" style={{ fontSize: "2.6vw", color: "#3A1F0E", fontWeight: 400 }}>
          She&rsquo;s relocating from Philadelphia to Houston.
        </div>
        <div className="font-body mt-[2vh]" style={{ fontSize: "2.6vw", color: "#7B5408", fontWeight: 300 }}>
          She opens Mapping with Melanin&trade;&hellip;
        </div>
      </div>
    </div>
  );
}
