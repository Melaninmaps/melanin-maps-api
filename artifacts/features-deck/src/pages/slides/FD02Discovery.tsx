export default function FD02Discovery() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 20%, rgba(202,146,43,0.08), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.25 }}>01</div>

      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "6%", bottom: "6%", width: "40vw" }}>
        <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.2vw" }}>INTENTIONAL DISCOVERY&trade;</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.0, marginBottom: "1vw" }}>
          Find businesses people actually trust.
        </div>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2vw" }} />
        <div className="font-body" style={{ fontSize: "1.15vw", color: "#5C3A1A", lineHeight: 1.75, marginBottom: "2.5vw", fontWeight: 400 }}>
          Every listing on Mapping With Melanin&trade; is ranked by community trust &mdash; not advertising spend. Trust Score surfaces the businesses that real community members recommend.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.1vw" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "0.25vw" }}><polyline points="20 6 9 17 4 12" /></svg>
            <div>
              <div className="font-display" style={{ fontSize: "1vw", fontWeight: 700, color: "#1C0E06" }}>Trust Score</div>
              <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", lineHeight: 1.5 }}>Community-sourced confidence rating, not a star average</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "0.25vw" }}><polyline points="20 6 9 17 4 12" /></svg>
            <div>
              <div className="font-display" style={{ fontSize: "1vw", fontWeight: 700, color: "#1C0E06" }}>Verified Businesses</div>
              <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", lineHeight: 1.5 }}>Documentation-backed verification badge earned, not purchased</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "0.25vw" }}><polyline points="20 6 9 17 4 12" /></svg>
            <div>
              <div className="font-display" style={{ fontSize: "1vw", fontWeight: 700, color: "#1C0E06" }}>Category Filters</div>
              <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", lineHeight: 1.5 }}>Food, beauty, health, legal, finance, wellness, and more</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "0.25vw" }}><polyline points="20 6 9 17 4 12" /></svg>
            <div>
              <div className="font-display" style={{ fontSize: "1vw", fontWeight: 700, color: "#1C0E06" }}>Proximity Search</div>
              <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", lineHeight: 1.5 }}>Find minority-owned businesses near you or in any city</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "0.25vw" }}><polyline points="20 6 9 17 4 12" /></svg>
            <div>
              <div className="font-display" style={{ fontSize: "1vw", fontWeight: 700, color: "#1C0E06" }}>Saved Places</div>
              <div className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408", lineHeight: 1.5 }}>Bookmark and revisit your favorites across any device</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute flex items-center justify-center" style={{ right: "6vw", top: "6%", bottom: "6%", width: "36vw" }}>
        <div style={{ width: "100%", background: "#1C0E06", borderRadius: "1.2vw", padding: "2.5vw", boxShadow: "0 1vw 3vw rgba(0,0,0,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "1.8vw" }}>
            <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <span className="font-body" style={{ fontSize: "1vw", color: "#7B5408" }}>soul food near me&hellip;</span>
          </div>
          <div style={{ display: "flex", gap: "0.6vw", marginBottom: "1.5vw", flexWrap: "wrap" }}>
            <span style={{ background: "#CA922B", borderRadius: "2vw", padding: "0.3vw 0.9vw" }}><span className="font-body" style={{ fontSize: "0.75vw", color: "#1C0E06", fontWeight: 700 }}>Food</span></span>
            <span style={{ background: "rgba(202,146,43,0.12)", borderRadius: "2vw", padding: "0.3vw 0.9vw", border: "1px solid rgba(202,146,43,0.3)" }}><span className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B" }}>Beauty</span></span>
            <span style={{ background: "rgba(202,146,43,0.12)", borderRadius: "2vw", padding: "0.3vw 0.9vw", border: "1px solid rgba(202,146,43,0.3)" }}><span className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B" }}>Health</span></span>
            <span style={{ background: "rgba(202,146,43,0.12)", borderRadius: "2vw", padding: "0.3vw 0.9vw", border: "1px solid rgba(202,146,43,0.3)" }}><span className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B" }}>Legal</span></span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
            <div style={{ background: "rgba(250,246,239,0.06)", borderRadius: "0.6vw", padding: "1vw 1.2vw", border: "1px solid rgba(202,146,43,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FAF6EF" }}>SoulFire Kitchen</div>
                  <div className="font-body" style={{ fontSize: "0.72vw", color: "#7B5408" }}>Soul Food &middot; $$</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 700, color: "#CA922B" }}>★ 4.9</div>
                  <div style={{ background: "#CA922B", borderRadius: "0.3vw", padding: "0.1vw 0.4vw", marginTop: "0.2vw" }}><span className="font-body" style={{ fontSize: "0.6vw", color: "#1C0E06", fontWeight: 700 }}>Verified</span></div>
                </div>
              </div>
              <div className="font-body" style={{ fontSize: "0.7vw", color: "#A87A40", marginTop: "0.4vw" }}>Recommended by 214 community members</div>
            </div>
            <div style={{ background: "rgba(250,246,239,0.04)", borderRadius: "0.6vw", padding: "1vw 1.2vw", border: "1px solid rgba(202,146,43,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FAF6EF" }}>Roots &amp; Remedy Caf&eacute;</div>
                  <div className="font-body" style={{ fontSize: "0.72vw", color: "#7B5408" }}>Healthy Eats &middot; $</div>
                </div>
                <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 700, color: "#CA922B" }}>★ 4.8</div>
              </div>
              <div className="font-body" style={{ fontSize: "0.7vw", color: "#A87A40", marginTop: "0.4vw" }}>Saved by 89 people in your city</div>
            </div>
            <div style={{ background: "rgba(250,246,239,0.04)", borderRadius: "0.6vw", padding: "1vw 1.2vw", border: "1px solid rgba(202,146,43,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FAF6EF" }}>The Gold Spoon</div>
                  <div className="font-body" style={{ fontSize: "0.72vw", color: "#7B5408" }}>Southern Cuisine &middot; $$$</div>
                </div>
                <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 700, color: "#CA922B" }}>★ 4.7</div>
              </div>
              <div className="font-body" style={{ fontSize: "0.7vw", color: "#A87A40", marginTop: "0.4vw" }}>127 five-star reviews from locals</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
