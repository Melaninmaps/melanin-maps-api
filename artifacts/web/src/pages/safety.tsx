import { useState } from "react";
import { useListSurveys, useCreateSurvey, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, MapPin, AlertCircle, TrendingUp, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Safety() {
  const { data: auth } = useGetCurrentAuthUser();
  const [cityFilter, setCityFilter] = useState("");
  const { data: surveys, isLoading } = useListSurveys({ city: cityFilter || undefined });
  
  const createSurvey = useCreateSurvey();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    city: "",
    neighborhood: "",
    safetyScore: 5,
    tips: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city || !formData.neighborhood) return;

    createSurvey.mutate({
      data: {
        city: formData.city,
        neighborhood: formData.neighborhood,
        daytimeSafety: formData.safetyScore,
        tips: formData.tips
      }
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ city: "", neighborhood: "", safetyScore: 5, tips: "" });
        queryClient.invalidateQueries({ queryKey: ["listSurveys"] });
        toast({ title: "Survey submitted", description: "Thank you for contributing to community safety." });
      }
    });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Dark Hero Header */}
      <section className="bg-[#2B1507] py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay z-0 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
            <Shield className="w-3 h-3 text-[#CA922B]" />
            <span className="text-[10px] font-bold tracking-widest text-[#F5EBD8] uppercase">Safety Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Navigate with Confidence</h1>
          <p className="text-[#F5EBD8]/80 text-lg max-w-2xl mb-8 font-light">
            Community-sourced safety scores and neighborhood intelligence to help you travel securely.
          </p>
          
          {auth?.user ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12 text-base shadow-lg">
                  Submit Safety Survey
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#FAF6EF] border-[#2B1507]/10 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl text-[#3A1F0E]">Share Your Experience</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-[#3A1F0E]/70">City</label>
                    <Input className="bg-white border-[#2B1507]/10 rounded-xl" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required placeholder="e.g. Atlanta" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-[#3A1F0E]/70">Neighborhood</label>
                    <Input className="bg-white border-[#2B1507]/10 rounded-xl" value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} required placeholder="e.g. West End" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-[#3A1F0E]/70">Safety Score (1-5)</label>
                    <Input className="bg-white border-[#2B1507]/10 rounded-xl" type="number" min="1" max="5" value={formData.safetyScore} onChange={(e) => setFormData({...formData, safetyScore: Number(e.target.value)})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-[#3A1F0E]/70">Tips & Details</label>
                    <Textarea className="bg-white border-[#2B1507]/10 rounded-xl resize-none" value={formData.tips} onChange={(e) => setFormData({...formData, tips: e.target.value})} placeholder="What should others know about this area?" rows={3} />
                  </div>
                  <Button type="submit" className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-12" disabled={createSurvey.isPending}>
                    Submit Survey
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="outline" className="rounded-full border-[#CA922B] text-[#CA922B] bg-transparent hover:bg-[#CA922B] hover:text-white px-8 h-12 text-base">
              Sign In to Submit Survey
            </Button>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-3xl font-serif font-bold text-[#3A1F0E]">Recent Surveys</h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Filter by city..." 
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-9 rounded-full border-[#2B1507]/10 bg-white"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#2B1507]/5 shadow-sm">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-6" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ))
          ) : surveys?.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#3A1F0E]/60 bg-white rounded-2xl border border-[#2B1507]/5">
              <AlertCircle className="mx-auto mb-4 opacity-30 w-12 h-12" />
              <p className="text-lg">No safety surveys found for this area yet.</p>
            </div>
          ) : (
            surveys?.map((survey) => {
              const score = survey.safetyScore || survey.daytimeSafety || 0;
              const isHigh = score >= 4;
              
              return (
                <div key={survey.id} className="bg-white rounded-2xl overflow-hidden border border-[#2B1507]/5 shadow-[0_4px_20px_rgba(43,21,7,0.03)] flex flex-col relative group">
                  <div className={`h-2 w-full ${isHigh ? 'bg-[#CA922B]' : 'bg-[#2B1507]/40'}`} />
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-serif font-bold text-xl text-[#3A1F0E]">{survey.neighborhood}</h3>
                        <div className="flex items-center gap-1 text-sm text-[#3A1F0E]/60 mt-1">
                          <MapPin size={12} /> {survey.city}
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border-4 border-[#CA922B] flex items-center justify-center font-bold text-lg text-[#3A1F0E]">
                          {score}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[#3A1F0E]/50 mt-1">Score</span>
                      </div>
                    </div>
                    
                    <div className="bg-[#FAF6EF] p-4 rounded-xl mt-auto">
                      <p className="text-sm text-[#3A1F0E]/80 leading-relaxed font-light italic">
                        "{survey.tips || "Safe and welcoming area for the community."}"
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
