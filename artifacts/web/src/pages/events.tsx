import { useListEvents, useRsvpEvent, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Events() {
  const { data: auth } = useGetCurrentAuthUser();
  const { data: events, isLoading } = useListEvents();
  const rsvpEvent = useRsvpEvent();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRsvp = (eventId: string) => {
    if (!auth?.user) {
      toast({ title: "Sign in required", description: "Please sign in to RSVP." });
      return;
    }
    rsvpEvent.mutate({ data: { eventId } }, {
      onSuccess: () => {
        toast({ title: "RSVP Confirmed", description: "You are going to this event!" });
        queryClient.invalidateQueries({ queryKey: ["listEvents"] });
      }
    });
  };

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-serif font-bold tracking-tight">Community Events</h1>
        <p className="text-muted-foreground text-lg">Connect, celebrate, and network at local events.</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : events?.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            <p className="text-lg">No upcoming events found.</p>
          </div>
        ) : (
          events?.map((event) => (
            <Card key={event.id} className="overflow-hidden flex flex-col h-full group">
              <div className="h-48 relative bg-muted">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
                    <CalendarIcon size={32} opacity={0.5} />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  {event.isFree && <Badge className="bg-chart-2 text-primary-foreground border-none">Free</Badge>}
                  {event.category && <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">{event.category}</Badge>}
                </div>
              </div>
              
              <CardContent className="p-5 flex flex-col flex-1 gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-xl line-clamp-2">{event.title}</h3>
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground mt-2">
                    {event.startDate && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={14} className="text-primary" />
                        <span>{new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      <span>{event.venue}, {event.city}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Users size={14} />
                    <span>{event.rsvpCount || 0} attending</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleRsvp(event.id)}>RSVP</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
