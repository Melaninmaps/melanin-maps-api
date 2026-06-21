import { useRoute } from "wouter";
import { 
  useGetBusiness, 
  useListReviews, 
  useSavePlace, 
  useUnsavePlace, 
  useCreateReview,
  useGetCurrentAuthUser,
  useListSavedPlaces
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Star, Bookmark, BookmarkCheck, Phone, Globe, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function BusinessDetail() {
  const [, params] = useRoute("/businesses/:id");
  const id = params?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: auth } = useGetCurrentAuthUser();
  const { data: business, isLoading: isLoadingBusiness } = useGetBusiness(id);
  const { data: reviews, isLoading: isLoadingReviews } = useListReviews({ businessId: id });
  const { data: savedPlaces } = useListSavedPlaces({ query: { enabled: !!auth?.user } });

  const savePlace = useSavePlace();
  const unsavePlace = useUnsavePlace();
  const createReview = useCreateReview();

  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSaved = savedPlaces?.businessIds.includes(id);

  const handleSaveToggle = () => {
    if (!auth?.user) {
      toast({ title: "Sign in required", description: "Please sign in to save places." });
      return;
    }
    if (isSaved) {
      unsavePlace.mutate(id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listSavedPlaces"] });
          toast({ title: "Removed from saved places" });
        }
      });
    } else {
      savePlace.mutate({ data: { businessId: id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listSavedPlaces"] });
          toast({ title: "Added to saved places" });
        }
      });
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    setIsSubmitting(true);
    createReview.mutate({ data: { businessId: id, text: reviewText, rating } }, {
      onSuccess: () => {
        setReviewText("");
        setRating(5);
        queryClient.invalidateQueries({ queryKey: ["listReviews", { businessId: id }] });
        toast({ title: "Review submitted successfully" });
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  };

  if (isLoadingBusiness) {
    return (
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
        <Skeleton className="w-full h-64 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <h2>Business not found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="w-full h-64 md:h-96 relative bg-muted">
        {business.imageUrl && (
          <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-32 relative z-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Badge variant="secondary">{business.category}</Badge>
              {business.blackOwned && <Badge className="bg-primary text-primary-foreground">Black Owned</Badge>}
            </div>
            <h1 className="text-4xl font-bold font-serif">{business.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              {business.averageRating && (
                <div className="flex items-center gap-1 text-accent font-medium">
                  <Star size={18} fill="currentColor" />
                  <span>{business.averageRating.toFixed(1)} ({business.reviewCount} reviews)</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <MapPin size={18} />
                <span>{business.address}, {business.city}, {business.state}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant={isSaved ? "secondary" : "outline"} onClick={handleSaveToggle} size="lg">
              {isSaved ? <><BookmarkCheck className="mr-2" size={20} /> Saved</> : <><Bookmark className="mr-2" size={20} /> Save</>}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold font-serif">About</h2>
              <p className="text-muted-foreground leading-relaxed">
                {business.description || "No description available."}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold font-serif">Reviews</h2>
              {auth?.user ? (
                <Card>
                  <CardContent className="pt-6">
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Your Rating:</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(r => (
                            <button key={r} type="button" onClick={() => setRating(r)} className={r <= rating ? "text-accent" : "text-muted"}>
                              <Star size={24} fill={r <= rating ? "currentColor" : "none"} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea 
                        placeholder="Share your experience..." 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={3}
                      />
                      <Button type="submit" disabled={isSubmitting}>Submit Review</Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-muted-foreground">Sign in to leave a review</p>
                </div>
              )}

              <div className="space-y-4 mt-6">
                {isLoadingReviews ? (
                  <Skeleton className="h-24 w-full" />
                ) : reviews?.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews?.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{review.authorName || "Anonymous"}</div>
                          <div className="flex text-accent">
                            {Array.from({length: 5}).map((_, i) => (
                              <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm">{review.text}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-muted-foreground" />
                    <span>{business.phone}</span>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-muted-foreground" />
                    <a href={business.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      Visit Website
                    </a>
                  </div>
                )}
                {business.priceRange && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-medium w-[18px] text-center">$</span>
                    <span>Price Range: {business.priceRange}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {business.confidenceScore && business.confidenceScore > 70 && (
              <Card className="bg-chart-2/5 border-chart-2/20">
                <CardContent className="p-5 flex items-start gap-4">
                  <ShieldCheck size={24} className="text-chart-2 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-chart-2">Community Verified</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This business has high community confidence for safety and welcoming atmosphere.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
