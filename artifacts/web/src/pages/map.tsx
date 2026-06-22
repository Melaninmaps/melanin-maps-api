import { useListBusinesses } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function MapPage() {
  const { data, isLoading } = useListBusinesses({}, { query: { queryKey: ['businesses', 'map'] } });

  return (
    <div className="h-full flex flex-col p-6 lg:p-10 space-y-6 min-h-[100dvh]">
      <div className="space-y-2 shrink-0">
        <h1 className="text-4xl font-serif font-bold tracking-tight">Explore the Map</h1>
        <p className="text-muted-foreground text-lg">Browse Black-owned businesses and community destinations.</p>
      </div>

      <div className="flex-1 bg-muted/30 rounded-xl border p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
             Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-32 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : (
            data?.businesses.map((biz) => (
              <Link key={biz.id} href={`/businesses/${biz.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <div className="h-32 bg-muted relative">
                     {biz.imageUrl && <img src={biz.imageUrl} alt={biz.name} className="w-full h-full object-cover rounded-t-xl" />}
                     <div className="absolute inset-0 bg-black/20" />
                     <Badge className="absolute bottom-2 left-2 bg-background/90 text-foreground">{biz.category}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-1">{biz.name}</h3>
                    <p className="text-sm text-muted-foreground">{biz.city}, {biz.state}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
