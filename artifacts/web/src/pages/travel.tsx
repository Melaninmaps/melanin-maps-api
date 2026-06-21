import { useState } from "react";
import { useGetTravelRecommendations } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plane, MapPin, Sparkles, AlertTriangle, Navigation, Loader2, Compass } from "lucide-react";

export default function Travel() {
  const [destination, setDestination] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [vibeInput, setVibeInput] = useState("");
  
  const getRecs = useGetTravelRecommendations();
  const recs = getRecs.data;

  const handleAddVibe = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && vibeInput.trim()) {
      e.preventDefault();
      if (!vibes.includes(vibeInput.trim())) {
        setVibes([...vibes, vibeInput.trim()]);
      }
      setVibeInput("");
    }
  };

  const removeVibe = (v: string) => {
    setVibes(vibes.filter(x => x !== v));
  };

  const handlePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    getRecs.mutate({ data: { destination, vibes, neighborVoice: true } });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Dark Hero Header */}
      <section className="bg-[#2B1507] py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay z-0 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
            <Sparkles className="w-3 h-3 text-[#CA922B]" />
            <span className="text-[10px] font-bold tracking-widest text-[#F5EBD8] uppercase">KinfolkAI Travel Planner</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Design Your Journey</h1>
          <p className="text-[#F5EBD8]/80 text-lg max-w-2xl font-light">
            AI-powered itineraries featuring Minority-owned spots, cultural events, and trusted neighborhood advice.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl p-8 border border-[#2B1507]/5 shadow-sm mb-12">
          <form onSubmit={handlePlan} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-[#3A1F0E]/50">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-[#CA922B]" size={24} />
                <Input 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to? (e.g. Atlanta, GA)"
                  className="pl-12 h-16 text-xl bg-[#FAF6EF] border-transparent rounded-2xl focus-visible:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/30"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-[#3A1F0E]/50">Vibe Tags (Optional)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {vibes.map(v => (
                  <div key={v} className="bg-[#2B1507] text-[#F5EBD8] px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    {v} 
                    <button type="button" onClick={() => removeVibe(v)} className="hover:text-[#CA922B] text-white/50">×</button>
                  </div>
                ))}
              </div>
              <Input 
                value={vibeInput}
                onChange={(e) => setVibeInput(e.target.value)}
                onKeyDown={handleAddVibe}
                placeholder="Type a vibe and press Enter (e.g. foodie, history, nightlife)"
                className="h-14 text-base bg-[#FAF6EF] border-transparent rounded-2xl focus-visible:ring-[#CA922B] text-[#3A1F0E] placeholder:text-[#3A1F0E]/30"
              />
            </div>

            <Button type="submit" className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-16 text-lg font-medium shadow-lg" disabled={getRecs.isPending || !destination.trim()}>
              {getRecs.isPending ? <><Loader2 className="mr-2 animate-spin" /> Crafting Itinerary...</> : <><Sparkles className="mr-2" /> Generate Recommendations</>}
            </Button>
          </form>
        </div>

        {recs && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-serif font-bold text-[#3A1F0E]">Your Guide to {recs.destination}</h2>
              <p className="text-lg text-[#3A1F0E]/70 font-light leading-relaxed max-w-3xl mx-auto">{recs.summary}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-serif font-bold text-[#2B1507] flex items-center gap-2 border-b border-[#2B1507]/10 pb-4">
                  <Compass className="text-[#CA922B]" /> Neighborhoods
                </h3>
                <div className="space-y-4">
                  {recs.neighborhoods.map((n, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-[#2B1507]/5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-lg text-[#3A1F0E]">{n.name}</h4>
                        <span className="bg-[#FAF6EF] text-[#CA922B] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-[#CA922B]/20">
                          {n.vibe}
                        </span>
                      </div>
                      <div className="text-sm text-[#3A1F0E]/70 mb-4 font-light">
                        <span className="font-bold text-[#2B1507] uppercase tracking-wider text-xs">Highlights:</span> {n.highlights.join(", ")}
                      </div>
                      <div className="bg-[#FAF6EF] p-4 rounded-xl text-sm text-[#3A1F0E]/80 italic border-l-2 border-[#CA922B]">
                        "{n.safetyNote}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-serif font-bold text-[#2B1507] flex items-center gap-2 border-b border-[#2B1507]/10 pb-4">
                  <MapPin className="text-[#CA922B]" /> Must-Visit Spots
                </h3>
                <div className="space-y-4">
                  {recs.businesses.map((b, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-[#2B1507]/5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#CA922B]" />
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <h4 className="font-bold text-lg text-[#3A1F0E]">{b.name}</h4>
                        <span className="bg-[#2B1507] text-[#F5EBD8] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                          {b.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#3A1F0E]/50 mb-3 pl-2 uppercase font-bold tracking-wider">
                        <MapPin size={12} /> {b.neighborhood}
                      </div>
                      <p className="text-sm text-[#3A1F0E]/70 font-light leading-relaxed mb-4 pl-2">{b.description}</p>
                      <div className="bg-[#FAF6EF] p-3 rounded-lg text-sm text-[#3A1F0E] ml-2 font-medium flex items-start gap-2">
                        <Sparkles size={16} className="text-[#CA922B] shrink-0 mt-0.5" />
                        <span>Try: {b.mustTry}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(recs.safetyTips?.length > 0 || recs.localInsights?.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6 pt-6">
                <div className="bg-white rounded-3xl p-8 border border-[#2B1507]/5 shadow-sm">
                  <h3 className="text-xl font-serif font-bold text-[#2B1507] flex items-center gap-2 mb-6">
                    <AlertTriangle className="text-[#CA922B]" /> Safety & Travel Tips
                  </h3>
                  <ul className="space-y-4">
                    {recs.safetyTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 text-[#3A1F0E]/80 text-sm font-light leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#CA922B] mt-2 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-[#2B1507] rounded-3xl p-8 shadow-sm text-white">
                  <h3 className="text-xl font-serif font-bold text-[#F5EBD8] flex items-center gap-2 mb-6">
                    <Sparkles className="text-[#CA922B]" /> Local Insights
                  </h3>
                  <ul className="space-y-4">
                    {recs.localInsights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-3 text-[#F5EBD8]/80 text-sm font-light leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#CA922B] mt-2 shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
