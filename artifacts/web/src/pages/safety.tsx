import { useState } from "react";
import { useListSurveys, useCreateSurvey, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, MapPin, AlertCircle } from "lucide-react";

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
    <div className="p-6 lg:p-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold tracking-tight">Neighborhood Safety</h1>
          <p className="text-muted-foreground text-lg">Community-sourced safety data and neighborhood tips.</p>
        </div>
        
        {auth?.user && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0"><Shield className="mr-2" size={18} /> Submit Survey</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Safety Experience</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Neighborhood</label>
                  <Input value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Safety Score (1-5)</label>
                  <Input type="number" min="1" max="5" value={formData.safetyScore} onChange={(e) => setFormData({...formData, safetyScore: Number(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tips / Details</label>
                  <Textarea value={formData.tips} onChange={(e) => setFormData({...formData, tips: e.target.value})} />
                </div>
                <Button type="submit" className="w-full" disabled={createSurvey.isPending}>Submit</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-4 max-w-sm">
        <Input 
          placeholder="Filter by city..." 
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6 space-y-4"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))
        ) : surveys?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg bg-muted/20">
            <AlertCircle className="mx-auto mb-3 opacity-50" size={32} />
            <p>No safety surveys found for this area yet.</p>
          </div>
        ) : (
          surveys?.map((survey) => (
            <Card key={survey.id} className="border-t-4 border-t-chart-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <div className="text-lg">{survey.neighborhood}</div>
                    <div className="text-sm font-normal text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {survey.city}
                    </div>
                  </div>
                  <div className="bg-chart-2/10 text-chart-2 px-3 py-1 rounded-full text-sm font-bold">
                    {survey.safetyScore || survey.daytimeSafety}/5
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {survey.tips || "No additional tips provided."}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
