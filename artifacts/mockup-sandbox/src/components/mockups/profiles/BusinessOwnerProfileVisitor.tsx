export function BusinessOwnerProfileVisitor() {
  return (
    <div className="min-h-screen bg-[#1A0A00] flex flex-col" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Status bar */}
      <div className="flex justify-between items-center px-6 pt-4 pb-1">
        <span className="text-white text-xs font-semibold">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="3" width="3" height="8" rx="1" fill="white" opacity="0.4"/><rect x="4" y="2" width="3" height="9" rx="1" fill="white" opacity="0.6"/><rect x="8" y="0" width="3" height="11" rx="1" fill="white" opacity="0.8"/><rect x="12" y="0" width="3" height="11" rx="1" fill="white"/></svg>
          <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.4C10.2 2.4 12.2 3.3 13.6 4.8L15 3.4C13.2 1.5 10.7 0.4 8 0.4C5.3 0.4 2.8 1.5 1 3.4L2.4 4.8C3.8 3.3 5.8 2.4 8 2.4Z" fill="white"/><path d="M8 5.6C9.5 5.6 10.8 6.2 11.8 7.2L13.2 5.8C11.8 4.5 9.9 3.6 8 3.6C6.1 3.6 4.2 4.5 2.8 5.8L4.2 7.2C5.2 6.2 6.5 5.6 8 5.6Z" fill="white"/><circle cx="8" cy="10" r="2" fill="white"/></svg>
          <div className="flex items-center"><div className="w-6 h-3 border border-white/60 rounded-sm relative"><div className="absolute left-0.5 top-0.5 bottom-0.5 w-4 bg-white rounded-sm"/><div className="absolute -right-1 top-1 w-0.5 h-1 bg-white/60 rounded-r"/></div></div>
        </div>
      </div>

      {/* Header — back arrow + name */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8">
        <div className="w-9 h-9 rounded-full bg-[#2A1800] flex items-center justify-center border border-white/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </div>
        <span className="text-white text-lg font-bold flex-1" style={{ fontFamily: "Georgia, serif" }}>Deja Williams</span>
        <div className="w-9 h-9 rounded-full bg-[#2A1800] flex items-center justify-center border border-white/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 pb-24">
        {/* Profile card — no edit button */}
        <div className="mx-4 mt-4 bg-[#231200] rounded-2xl border border-white/8 p-4">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#CA922B] to-[#8B5E1A] flex items-center justify-center">
                <span className="text-white text-xl font-bold">DW</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#CA922B] flex items-center justify-center border-2 border-[#1A0A00]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-white font-bold text-base">Deja Williams</p>
              <p className="text-[#CA922B] text-sm font-medium">@dejawilliams</p>
              <p className="text-white/50 text-xs mt-0.5">Business Owner · Food & Beverage</p>
              <p className="text-white/40 text-xs mt-1 leading-relaxed" style={{ fontStyle: "italic" }}>"Soul food rooted in love and community."</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#CA922B]/15 border border-[#CA922B]/30">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="text-[#CA922B] text-[10px] font-bold">Trailblazer Member</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-[#CA922B] rounded-xl py-2.5 flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              <span className="text-white text-xs font-bold">Follow</span>
            </button>
            <button className="flex-1 bg-[#2A1800] border border-white/15 rounded-xl py-2.5 flex items-center justify-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span className="text-[#CA922B] text-xs font-semibold">Message</span>
            </button>
          </div>
        </div>

        {/* Business listing — prominently featured */}
        <div className="mx-4 mt-3 bg-[#1A2E22] rounded-2xl border border-[#2D7A4F]/40 overflow-hidden">
          <div className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2D7A4F]/30 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse"/>
                <span className="text-[#4ADE80] text-[10px] font-bold uppercase tracking-wider">Verified Business</span>
              </div>
              <p className="text-white font-bold text-sm">Deja's Soul Kitchen</p>
              <p className="text-white/50 text-xs">Restaurant · Atlanta, GA</p>
            </div>
            <div className="bg-[#2D7A4F]/30 rounded-full px-3 py-1.5 flex items-center gap-1">
              <span className="text-[#4ADE80] text-xs font-bold">Visit</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
          {/* Quick metrics — read-only for visitors */}
          <div className="flex border-t border-[#2D7A4F]/25">
            {[{ num: "4.8★", label: "Rating" }, { num: "94", label: "Saves" }, { num: "1.2k", label: "Views" }].map((m, i) => (
              <div key={m.label} className={`flex-1 py-3 flex flex-col items-center ${i < 2 ? "border-r border-[#2D7A4F]/25" : ""}`}>
                <span className="text-white font-bold text-sm">{m.num}</span>
                <span className="text-white/40 text-[10px] mt-0.5">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mx-4 mt-3 flex bg-[#231200] rounded-2xl border border-white/8 overflow-hidden">
          {[{ label: "Followers", val: "891" }, { label: "Following", val: "114" }, { label: "Reviews", val: "23" }].map((s, i) => (
            <div key={s.label} className={`flex-1 py-4 flex flex-col items-center ${i < 2 ? "border-r border-white/8" : ""}`}>
              <span className="text-[#CA922B] text-lg font-bold">{s.val}</span>
              <span className="text-white/40 text-xs mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Deja's recent reviews */}
        <div className="mx-4 mt-3">
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mb-2 px-1">Recent Reviews by Deja</p>
          <div className="bg-[#231200] rounded-2xl border border-white/8 overflow-hidden">
            {[
              { biz: "Sweet Auburn BBQ", stars: 5, quote: "Hands down the best brisket in Atlanta. The pit masters here are legends.", ago: "3d ago" },
              { biz: "Café Ritz ATL", stars: 4, quote: "Great ambiance for a business meeting. Espresso was perfect.", ago: "2wk ago" },
            ].map((r, i) => (
              <div key={r.biz} className={`px-4 py-3.5 ${i < 1 ? "border-b border-white/8" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-sm font-semibold">{r.biz}</p>
                  <span className="text-white/30 text-[10px]">{r.ago}</span>
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <svg key={si} width="10" height="10" viewBox="0 0 24 24" fill={si < r.stars ? "#CA922B" : "none"} stroke="#CA922B" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}
                </div>
                <p className="text-white/50 text-xs leading-relaxed">{r.quote}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Community impact — public */}
        <div className="mx-4 mt-3 mb-4 bg-[#3B1F0E] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤎</span>
            <div>
              <p className="text-white font-bold text-sm">Community Impact</p>
              <p className="text-white/50 text-xs">Deja's contributions to the map</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { num: "1.2k", label: "👁️ Profile\nViews" },
              { num: "31", label: "🏪 Businesses\nSupported" },
              { num: "4", label: "🌍 Cities\nExplored" },
              { num: "94", label: "❤️ Times\nSaved" },
            ].map((cell) => (
              <div key={cell.label} className="bg-white/7 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-xl">{cell.num}</p>
                <p className="text-white/50 text-[10px] mt-1 whitespace-pre-line leading-tight">{cell.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A0A00] border-t border-white/10 flex items-end justify-around px-2 pb-6 pt-2">
        {[
          { icon: "compass", label: "Discover", active: false },
          { icon: "map", label: "Map", active: false },
          { icon: "book", label: "Library", active: false },
          { icon: "users", label: "Community", active: true },
          { icon: "user", label: "Profile", active: false },
        ].map((tab) => (
          <div key={tab.label} className="flex flex-col items-center gap-1 px-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={tab.active ? "#CA922B" : "white"} strokeWidth={tab.active ? "2.5" : "1.5"} opacity={tab.active ? 1 : 0.4}>
              {tab.icon === "compass" && <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>}
              {tab.icon === "map" && <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>}
              {tab.icon === "book" && <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>}
              {tab.icon === "users" && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}
              {tab.icon === "user" && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
            </svg>
            <span className={`text-[10px] ${tab.active ? "text-[#CA922B] font-semibold" : "text-white/40"}`}>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
