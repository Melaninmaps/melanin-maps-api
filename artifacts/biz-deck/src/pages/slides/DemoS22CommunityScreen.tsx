const base = import.meta.env.BASE_URL;

const POSTS = [
  { photo: "photos/feed-woman-shop.jpg", name: "Marcus W.", loc: "DC, Shaw", caption: "Copper & Oak is on another level for Sunday brunch. 97 score and it shows — this is what minority-owned looks like when the community shows up.", likes: 84, comments: 12 },
  { photo: "photos/feed-friends-rooftop.jpg", name: "Jasmine T.", loc: "Houston, TX", caption: "Used KinfolkAI to plan my whole DC trip and I haven't made a single bad choice. This is what travel should feel like.", likes: 61, comments: 9 },
  { photo: "photos/feed-woman-movein.jpg", name: "Aisha R.", loc: "Atlanta, GA", caption: "Six months in and this city finally feels like home. Grateful for this community — for real.", likes: 103, comments: 18 },
];

export default function DemoS22CommunityScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>22</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.6vw", fontWeight: 700, color: "#1C0E06" }}>Belong.</h1>
        <div className="font-display leading-tight mt-[1.4vw]" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#A6720F", textWrap: "balance" }}>
          Community is the feature, not the side effect.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.4vw", color: "#7B5408", lineHeight: 1.5, textWrap: "balance" }}>
          A curated feed of diaspora voices — posts, stories, and real moments from community members. For You and Following feeds. No viral algorithm. No conflict amplification. Real connection infrastructure.
        </div>
        <div className="inv-rule mt-[2vw] mb-[0.9vw]" style={{ width: "5vw" }} />
        <div className="font-display" style={{ fontSize: "1.85vw", color: "#A6720F", fontWeight: 700, fontStyle: "italic" }}>Everywhere you go, you belong.</div>
      </div>

      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>
            <div className="flex items-center justify-between px-[1vw] py-[1vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <span className="font-display" style={{ fontSize: "0.85vw", color: "#F5EBD8", fontWeight: 700 }}>Community Feed</span>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col gap-[0.55vw] px-[0.55vw] pt-[0.55vw]">
              {POSTS.map((p) => (
                <div key={p.name} className="rounded-[0.9vw] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(58,31,14,0.08)" }}>
                  <div className="flex items-center gap-[0.5vw] px-[0.7vw] py-[0.55vw]">
                    <div className="rounded-full flex-shrink-0" style={{ width: "1.8vw", height: "1.8vw", background: "#CA922B" }} />
                    <div>
                      <div className="font-body" style={{ fontSize: "0.72vw", color: "#1C0E06", fontWeight: 700 }}>{p.name}</div>
                      <div className="font-body" style={{ fontSize: "0.6vw", color: "#A6720F" }}>{p.loc}</div>
                    </div>
                  </div>
                  <div className="relative w-full" style={{ height: "6.2vw" }}>
                    <img src={`${base}${p.photo}`} crossOrigin="anonymous" alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="px-[0.7vw] py-[0.5vw]">
                    <div className="font-body" style={{ fontSize: "0.58vw", color: "#3A1F0E", lineHeight: 1.35 }}>{p.caption}</div>
                    <div className="flex items-center gap-[0.7vw] mt-[0.4vw]" style={{ fontSize: "0.58vw", color: "#B4832A" }}>
                      <span>&#10084; {p.likes}</span>
                      <span>&#128172; {p.comments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[1.9vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Carry your community</strong> wherever life takes you.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Build lasting relationships</strong>, not one-time visits.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Feel at home</strong>, from the first day forward.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
