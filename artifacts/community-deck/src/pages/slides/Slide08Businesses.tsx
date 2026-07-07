const base = import.meta.env.BASE_URL;

export default function Slide08Businesses() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Right half — business image */}
      <div className="absolute right-0 top-0 w-[48vw] h-full">
        <img
          src={`${base}hero-business.png`}
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          alt="Black-owned business"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #1C0E06 0%, rgba(28,14,6,0.2) 50%, transparent 100%)" }} />
      </div>

      {/* Slide number */}
      <div className="absolute top-[5vh] right-[6vw] font-display text-primary" style={{ fontSize: "2.2vw", fontWeight: 700, opacity: 0.4 }}>08</div>

      {/* Left content */}
      <div className="absolute left-[7vw] top-0 bottom-0 w-[54vw] flex flex-col justify-center pr-[4vw]">
        <div className="gold-dot mb-[2.5vh]" />
        <h2 className="font-display text-accent leading-tight tracking-tight mb-[2vh]" style={{ fontSize: "4.8vw", fontWeight: 700 }}>
          Businesses worth discovering.
        </h2>
        <div className="gold-rule w-[18vw] mb-[4vh]" />

        <div className="flex flex-col gap-[2.5vh]">
          <div className="flex items-start gap-[1.5vw]">
            <div className="gold-dot mt-[0.8vh] flex-shrink-0" />
            <div>
              <div className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Minority-Owned</div>
              <div className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#A07840" }}>Verified and celebrated</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="gold-dot mt-[0.8vh] flex-shrink-0" />
            <div>
              <div className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Community Recommended</div>
              <div className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#A07840" }}>Real reviews from real people</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="gold-dot mt-[0.8vh] flex-shrink-0" />
            <div>
              <div className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Meet the Owner</div>
              <div className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#A07840" }}>The story behind the business</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="gold-dot mt-[0.8vh] flex-shrink-0" />
            <div>
              <div className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Featured Video</div>
              <div className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#A07840" }}>See the business come alive</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.5vw]">
            <div className="gold-dot mt-[0.8vh] flex-shrink-0" />
            <div>
              <div className="font-body text-accent" style={{ fontSize: "3.2vw", fontWeight: 600 }}>Events</div>
              <div className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#A07840" }}>Discover what's happening nearby</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
