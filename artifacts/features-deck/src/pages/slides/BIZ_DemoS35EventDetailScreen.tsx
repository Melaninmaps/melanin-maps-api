const base = import.meta.env.BASE_URL;

export default function DemoS35EventDetailScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>35</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Register.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Zara taps "Natural Hair Expo — DC." She's going.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          Register, save the event, share to her DC Crew circle, and add it to her calendar — all from one screen. The venue Trust Score is already there. So is the community's response count. She knows this is worth showing up for.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>From discovery to attendance in four taps.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            {/* Hero photo */}
            <div className="relative" style={{ height: "35%", flexShrink: 0 }}>
              <img src={`${base}photos/feed-friends-rooftop.jpg`} crossOrigin="anonymous" alt="Event" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(28,14,6,0.2) 0%, rgba(250,246,239,0.95) 100%)" }} />
              <div className="absolute top-[0.8vw] left-[0.8vw] flex items-center gap-[0.5vw]">
                <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="rgba(250,246,239,0.9)" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </div>
              <div className="absolute top-[0.8vw] right-[0.8vw] rounded-[0.4vw] px-[0.5vw] py-[0.18vw]" style={{ background: "#16A34A" }}>
                <span className="font-body" style={{ fontSize: "0.44vw", fontWeight: 700, color: "#FFF" }}>WELLNESS</span>
              </div>
            </div>

            {/* Event details */}
            <div className="px-[1vw] pt-[0.7vw] pb-[0.5vw] flex-1" style={{ overflow: "hidden" }}>
              <div className="font-display" style={{ fontSize: "1vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.2 }}>Natural Hair Expo — DC</div>
              <div className="font-body mt-[0.2vw]" style={{ fontSize: "0.55vw", color: "#A87A40" }}>Hosted by Howard University · Trust Score 97</div>

              {/* Info grid */}
              <div className="grid mt-[0.6vw] gap-[0.4vw]" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {[
                  { label: "Date", val: "Sun, Jul 19" },
                  { label: "Time", val: "11 AM – 6 PM" },
                  { label: "Location", val: "Howard Univ. DC" },
                  { label: "Admission", val: "$12 · Free for members" },
                ].map((item, i) => (
                  <div key={i} className="rounded-[0.5vw] px-[0.55vw] py-[0.38vw]" style={{ background: "#FFFFFF", border: "1px solid #E8DDC8" }}>
                    <div className="font-body" style={{ fontSize: "0.42vw", color: "#A87A40", fontWeight: 600 }}>{item.label}</div>
                    <div className="font-body mt-[0.06vw]" style={{ fontSize: "0.54vw", color: "#1C0E06", fontWeight: 700 }}>{item.val}</div>
                  </div>
                ))}
              </div>

              {/* About */}
              <div className="font-body mt-[0.55vw]" style={{ fontSize: "0.52vw", color: "#7A5530", lineHeight: 1.55 }}>
                Annual celebration of natural hair culture featuring 40+ minority-owned beauty brands, live demonstrations, panel discussions, and a community marketplace. DC's largest natural hair event.
              </div>

              {/* Attending */}
              <div className="flex items-center gap-[0.4vw] mt-[0.45vw]">
                <div className="flex">
                  {["#CA922B","#A6720F","#7C3AED","#16A34A"].map((c, i) => (
                    <div key={i} style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: c, border: "0.15vw solid #FAF6EF", marginLeft: i > 0 ? "-0.4vw" : 0 }} />
                  ))}
                </div>
                <span className="font-body" style={{ fontSize: "0.5vw", color: "#7A5530" }}>247 community members going · 3 from your circles</span>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-[0.5vw] mt-[0.6vw]">
                <div className="flex-1 flex items-center justify-center rounded-[0.7vw] py-[0.7vw]" style={{ background: "#CA922B" }}>
                  <span className="font-body" style={{ fontSize: "0.65vw", fontWeight: 700, color: "#FFF" }}>Register — $12</span>
                </div>
                <div className="flex items-center justify-center rounded-[0.7vw] px-[0.7vw]" style={{ background: "#FFFFFF", border: "1px solid #DDD0B8" }}>
                  <svg width="0.85vw" height="0.85vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <div className="flex items-center justify-center rounded-[0.7vw] px-[0.7vw]" style={{ background: "#FFFFFF", border: "1px solid #DDD0B8" }}>
                  <svg width="0.85vw" height="0.85vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </div>
              </div>
              <div className="w-full flex items-center justify-center mt-[0.35vw]">
                <span className="font-body" style={{ fontSize: "0.5vw", color: "#A87A40" }}>Save event · Share to DC Crew · Add to calendar</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Venue Trust Score</strong> on every event — know the space before you RSVP.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Circle friends attending</strong> — see who from your crew is going.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Register, save, share</strong> — one screen handles the entire commitment flow.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
