const base = import.meta.env.BASE_URL;

export default function Slide08Businesses() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Right image */}
      <div className="absolute right-0 top-0 w-[46vw] h-full">
        <img
          src={`${base}hero-business.png`}
          className="w-full h-full object-cover"
          alt="Minority-owned business"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #1C0E06 0%, rgba(28,14,6,0.3) 55%, transparent 100%)" }} />
      </div>

      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>08</div>

      {/* Left content — vertically centered */}
      <div className="absolute left-0 top-0 w-[57vw] h-full flex flex-col justify-center pl-[7vw] pr-[5vw]">
        <div className="flex items-center gap-[1vw] mb-[1.8vh]">
          <div className="gold-dot" />
          <span className="font-body" style={{ fontSize: "1.9vw", letterSpacing: "0.12em", fontWeight: 300, color: "#CA922B" }}>DISCOVERY</span>
        </div>
        <h2 className="font-display leading-tight tracking-tight mb-[1.8vh]" style={{ fontSize: "4.2vw", fontWeight: 700, color: "#FAF6EF" }}>
          Businesses worth discovering.
        </h2>
        <div className="gold-rule w-[15vw] mb-[3vh]" />

        <div className="flex flex-col gap-[2vh]">
          {[
            { title: "Minority-Owned",          sub: "Verified and celebrated" },
            { title: "Community Recommended",   sub: "Real reviews from real people" },
            { title: "Meet the Owner",          sub: "The story behind the business" },
            { title: "Featured Video",          sub: "See the business come alive" },
            { title: "Events",                  sub: "Discover what's happening nearby" },
          ].map(({ title, sub }) => (
            <div key={title} className="flex items-start gap-[1.5vw]">
              <div className="gold-dot mt-[0.5vh] flex-shrink-0" />
              <div>
                <div className="font-body" style={{ fontSize: "2.5vw", fontWeight: 600, color: "#FAF6EF", lineHeight: 1.2 }}>{title}</div>
                <div className="font-body" style={{ fontSize: "2.1vw", fontWeight: 300, color: "#A07840" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
