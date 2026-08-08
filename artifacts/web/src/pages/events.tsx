import { useListEvents, useRsvpEvent, useGetCurrentAuthUser, type Event as ApiEvent } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, MapPin, Users, Ticket, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Events() {
  const { data: auth } = useGetCurrentAuthUser();
  const { data: eventsData, isLoading } = useListEvents();
  // API returns { events: [...] } at runtime but TS type says Event[] — handle both
  const events = (Array.isArray(eventsData) ? eventsData : (eventsData as unknown as { events: ApiEvent[] })?.events) ?? [];
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
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {/* Dark Hero Header */}
      <section className="bg-[#2B1507] py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay z-0 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
            <CalendarIcon className="w-3 h-3 text-[#CA922B]" />
            <span className="text-[10px] font-bold tracking-widest text-[#F5EBD8] uppercase">Gather & Connect</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Community Events</h1>
          <p className="text-[#F5EBD8]/80 text-lg max-w-2xl font-light">
            Discover networking sessions, cultural festivals, pop-ups, and celebrations in your area.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm h-[450px]">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-6 flex-1 flex flex-col">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3 mt-auto" />
                </div>
              </div>
            ))
          ) : events?.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-[#2B1507]/5">
              <CalendarIcon className="mx-auto text-[#2B1507]/20 w-16 h-16 mb-4" />
              <p className="text-xl text-[#3A1F0E]">No upcoming events found.</p>
            </div>
          ) : (
            events?.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(43,21,7,0.05)] border border-[#2B1507]/5 flex flex-col h-[480px] group relative">
                {/* Image Header */}
                <div className="h-[45%] relative overflow-hidden bg-[#2B1507]/10 shrink-0">
                  {(() => {
                    const categoryImages: Record<string, string> = {
                      Finance: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
                      Beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
                      Cultural: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
                      Music: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
                      Food: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
                      Wellness: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
                      Business: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
                    };
                    const src = event.imageUrl || (event.category ? categoryImages[event.category] : null) || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80";
                    return <img src={src} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />;
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507]/80 to-transparent opacity-60" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {event.isFree ? (
                      <div className="bg-[#2B1507] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Ticket size={12} /> Free
                      </div>
                    ) : (
                      <div className="bg-[#CA922B] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Ticket size={12} /> Ticketed
                      </div>
                    )}
                    {event.category && (
                      <div className="bg-white/90 backdrop-blur text-[#2B1507] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                        {event.category}
                      </div>
                    )}
                  </div>

                  {/* Date Badge */}
                  {event.startDate && (
                    <div className="absolute bottom-4 left-4 bg-white rounded-xl p-2 text-center shadow-lg min-w-[60px] border border-[#2B1507]/5">
                      <div className="text-[10px] uppercase font-bold text-[#CA922B]">
                        {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}
                      </div>
                      <div className="text-xl font-serif font-bold text-[#3A1F0E] leading-none mt-0.5">
                        {new Date(event.startDate).getDate()}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mb-3 line-clamp-2 leading-tight">{event.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#3A1F0E]/70">
                      <MapPin size={14} className="text-[#CA922B] shrink-0" />
                      <span className="truncate">{event.venue ? `${event.venue}, ` : ""}{event.city}</span>
                    </div>
                    {event.startDate && (
                      <div className="flex items-center gap-2 text-sm text-[#3A1F0E]/70">
                        <CalendarIcon size={14} className="text-[#CA922B] shrink-0" />
                        <span>{new Date(event.startDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit'})}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-[#3A1F0E]/60 line-clamp-2 leading-relaxed mb-6 font-light">
                    {event.description || "Join us for this exciting community event."}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-[#2B1507]/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#3A1F0E]/50 uppercase tracking-wider">
                      <Users size={14} className="text-[#CA922B]" />
                      <span>{(event as any).attendees ?? event.rsvpCount ?? 0} Attending</span>
                    </div>
                    <Button 
                      onClick={() => handleRsvp(event.id)}
                      className="rounded-full bg-[#2B1507] hover:bg-[#4a260d] text-white px-5 h-9 text-xs flex items-center gap-1 transition-all"
                    >
                      RSVP <ArrowUpRight size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
