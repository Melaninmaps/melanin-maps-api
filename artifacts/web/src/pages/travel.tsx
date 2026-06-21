import { useState } from "react";
import { useGetTravelRecommendations } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, MapPin, Sparkles, AlertTriangle, Navigation, Loader2 } from "lucide-react";

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
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-10">
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-2">
          <Plane size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">AI Travel Planner</h1>
        <p className="text-muted-foreground text-lg">
          Plan your next trip with curated recommendations for Black-owned spots, cultural events, and neighborhood safety tips.
        </p>
      </div>

      <Card className="border-primary/20 shadow-md">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handlePlan} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Where to?</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-primary" size={20} />
                <Input 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Atlanta, GA or Paris, France"
                  className="pl-10 h-14 text-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vibe Tags (Optional)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {vibes.map(v => (
                  <Badge key={v} variant="secondary" className="px-3 py-1.5 text-sm gap-1">
                    {v} <button type="button" onClick={() => removeVibe(v)} className="hover:text-destructive text-muted-foreground">×</button>
                  </Badge>
                ))}
              </div>
              <Input 
                value={vibeInput}
                onChange={(e) => setVibeInput(e.target.value)}
                onKeyDown={handleAddVibe}
                placeholder="Type a vibe and press Enter (e.g. foodie, nightlife, historic)"
                className="h-12"
              />
            </div>

            <Button type="submit" size="lg" className="w-full h-14 text-lg" disabled={getRecs.isPending || !destination.trim()}>
              {getRecs.isPending ? <><Loader2 className="mr-2 animate-spin" /> Generating Itinerary...</> : <><Sparkles className="mr-2" /> Generate Recommendations</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {recs && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
            <h2 className="text-2xl font-serif font-bold mb-3 flex items-center gap-2">
              <Navigation className="text-primary" /> Destination: {recs.destination}
            </h2>
            <p className="text-lg leading-relaxed">{recs.summary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-serif font-bold border-b pb-2">Neighborhoods</h3>
              <div className="space-y-4">
                {recs.neighborhoods.map((n, i) => (
                  <Card key={i} className="bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl flex justify-between items-start">
                        {n.name}
                        <Badge variant="outline">{n.vibe}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div><strong className="text-foreground">Highlights:</strong> <span className="text-muted-foreground">{n.highlights.join(", ")}</span></div>
                      <div className="bg-muted p-3 rounded text-muted-foreground border-l-2 border-primary italic">"{n.safetyNote}"</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-serif font-bold border-b pb-2">Must-Visit Spots</h3>
              <div className="space-y-4">
                {recs.businesses.map((b, i) => (
                  <Card key={i}>
                    <CardContent className="p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg">{b.name}</h4>
                        <Badge className="bg-chart-2 text-primary-foreground border-none">{b.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground"><MapPin size={12} className="inline mr-1" />{b.neighborhood}</p>
                      <p className="text-sm">{b.description}</p>
                      <div className="text-sm font-medium text-primary mt-2">✨ Try: {b.mustTry}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {(recs.safetyTips?.length > 0 || recs.localInsights?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-chart-4/30 bg-chart-4/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-chart-4"><AlertTriangle size={20} /> Safety & Travel Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {recs.safetyTips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-accent/30 bg-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent"><Sparkles size={20} /> Local Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {recs.localInsights.map((insight, i) => <li key={i}>{insight}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
