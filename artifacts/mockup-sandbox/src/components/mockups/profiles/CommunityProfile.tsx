export function CommunityProfile() {
  return (
    <div className="min-h-screen bg-[#1A0A00] flex flex-col" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Status bar */}
      <div className="flex justify-between items-center px-6 pt-4 pb-1">
        <span className="text-white text-xs font-semibold">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="3" width="3" height="8" rx="1" fill="white" opacity="0.4"/><rect x="4" y="2" width="3" height="9" rx="1" fill="white" opacity="0.6"/><rect x="8" y="0" width="3" height="11" rx="1" fill="white" opacity="0.8"/><rect x="12" y="0" width="3" height="11" rx="1" fill="white"/></svg>
          <div className="w-6 h-3 border border-white/60 rounded-sm relative"><div className="absolute left-0.5 top-0.5 bottom-0.5 w-4 bg-white rounded-sm"/></div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <span className="text-white text-xl font-bold" style={{ fontFamily: "Georgia, serif" }}>Profile</span>
        <div className="w-9 h-9 rounded-full bg-[#2A1800] flex items-center justify-center border border-white/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 pb-24">
        {/* Profile card */}
        <div className="mx-4 mt-4 bg-[#231200] rounded-2xl border border-white/8 p-4 flex items-start gap-4 relative">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#CA922B] flex items-center justify-center">
              <span className="text-white text-xl font-bold">JM</span>
            </div>
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-white font-bold text-base">Jasmine Mitchell</p>
            <p className="text-[#CA922B] text-sm font-medium">@jasmine.m</p>
            <p className="text-white/50 text-xs mt-0.5">Marketing Director · Creative Arts</p>
            <p className="text-white/40 text-xs mt-1 leading-relaxed" style={{ fontStyle: "italic" }}>"Building community one connection at a time."</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#CA922B]/15 border border-[#CA922B]/30">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span className="text-[#CA922B] text-[10px] font-bold">Navigator Member</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
        </div>

        {/* ── POST COMPOSER ── */}
        <div className="mx-4 mt-3 bg-[#231200] rounded-2xl border border-white/8 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#CA922B] flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">JM</span>
            </div>
            <div className="flex-1 bg-[#1A0A00] rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-white/30 text-sm">What's on your mind?</p>
            </div>
          </div>
          {/* Privacy + Post row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
            <div className="flex items-center gap-1.5">
              <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Visible to:</span>
              {/* Privacy pill — selected = Public */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#CA922B]/15 border border-[#CA922B]/30">
                <span className="text-[10px]">🌐</span>
                <span className="text-[#CA922B] text-[10px] font-bold">Public</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-[10px]">👥</span>
                <span className="text-white/40 text-[10px]">Followers</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-[10px]">🔒</span>
                <span className="text-white/40 text-[10px]">Only Me</span>
              </div>
            </div>
            <div className="bg-[#CA922B] px-3 py-1.5 rounded-full">
              <span className="text-white text-xs font-bold">Post</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-4 mt-3 flex bg-[#231200] rounded-2xl border border-white/8 overflow-hidden">
          {[{ label: "Followers", val: "142" }, { label: "Following", val: "89" }, { label: "Points", val: "2,340" }].map((s, i) => (
            <div key={s.label} className={`flex-1 py-3 flex flex-col items-center ${i < 2 ? "border-r border-white/8" : ""}`}>
              <span className="text-[#CA922B] text-lg font-bold">{s.val}</span>
              <span className="text-white/40 text-xs mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* My Posts */}
        <div className="mx-4 mt-3">
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mb-2 px-1">My Posts</p>
          <div className="bg-[#231200] rounded-2xl border border-white/8 overflow-hidden">
            {[
              { text: "Just checked in at The Breakfast Club ATL — the chicken & waffles hit different on a Saturday 🧇🤎", privacy: "🌐", privacyLabel: "Public", ago: "2h ago", likes: 24, comments: 5 },
              { text: "Found the most beautiful Black-owned bookshop in Inman Park today. Adding it to the map — go support them!", privacy: "👥", privacyLabel: "Followers", ago: "1d ago", likes: 38, comments: 9 },
              { text: "Reminder to myself: keep showing up for the community even when it's hard. 💪🏾", privacy: "🔒", privacyLabel: "Only Me", ago: "3d ago", likes: 0, comments: 0 },
            ].map((post, i) => (
              <div key={i} className={`p-4 ${i < 2 ? "border-b border-white/8" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    <span className="text-[10px]">{post.privacy}</span>
                    <span className="text-white/40 text-[10px]">{post.privacyLabel}</span>
                  </div>
                  <span className="text-white/30 text-[10px]">{post.ago}</span>
                </div>
                <p className="text-white/80 text-xs leading-relaxed">{post.text}</p>
                {post.privacy !== "🔒" && (
                  <div className="flex items-center gap-4 mt-2.5">
                    <div className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      <span className="text-white/40 text-[10px]">{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <span className="text-white/40 text-[10px]">{post.comments}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="mx-4 mt-3 bg-[#231200] rounded-2xl border border-white/8 overflow-hidden">
          {[
            { icon: "bookmark", label: "Saved Businesses", sub: "32 saved" },
            { icon: "star", label: "My Reviews", sub: "7 written" },
            { icon: "users", label: "Community Groups", sub: "3 joined" },
          ].map((item, i) => (
            <div key={item.label} className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? "border-b border-white/8" : ""}`}>
              <div className="w-8 h-8 rounded-xl bg-[#CA922B]/15 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2">
                  {item.icon === "bookmark" && <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>}
                  {item.icon === "star" && <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}
                  {item.icon === "users" && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">{item.label}</p>
                <p className="text-white/40 text-xs">{item.sub}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.3"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A0A00] border-t border-white/10 flex items-end justify-around px-2 pb-6 pt-2">
        {[
          { icon: "compass", label: "Discover", active: false },
          { icon: "map", label: "Map", active: false },
          { icon: "book", label: "Library", active: false },
          { icon: "users", label: "Community", active: false },
          { icon: "user", label: "Profile", active: true },
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
