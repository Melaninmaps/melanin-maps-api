import { useGetCurrentAuthUser, useGetMyProfile, useUpdateMyProfile, useLogoutBrowserSession, useListSavedPlaces, useGetBusiness } from "@workspace/api-client-react";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Save, User, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const { data: profile } = useGetMyProfile({ query: { enabled: !!auth?.user } });
  const { data: savedPlaces } = useListSavedPlaces({ query: { enabled: !!auth?.user } });
  
  const updateProfile = useUpdateMyProfile();
  const logout = useLogoutBrowserSession();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
    }
  }, [profile]);

  if (authLoading) return <div className="p-10"><Skeleton className="h-64 w-full" /></div>;

  if (!auth?.user) {
    return <Redirect to="/login" />;
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ data: { firstName, lastName } }, {
      onSuccess: () => {
        toast({ title: "Profile updated" });
        queryClient.invalidateQueries({ queryKey: ["getMyProfile"] });
        queryClient.invalidateQueries({ queryKey: ["getCurrentAuthUser"] });
      }
    });
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      }
    });
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-serif font-bold tracking-tight">Your Profile</h1>
        <Button variant="outline" onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 border-border/50">
          <CardHeader className="text-center pb-2">
            <Avatar className="w-24 h-24 mx-auto border-2 border-primary/20 mb-4">
              <AvatarImage src={profile?.profileImageUrl || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {profile?.firstName?.[0] || profile?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{profile?.firstName} {profile?.lastName}</CardTitle>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="text-primary" /> Saved Places
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savedPlaces?.businessIds.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                <p>You haven't saved any places yet.</p>
                <Link href="/discover" className="text-primary hover:underline mt-2 inline-block">Explore places</Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {savedPlaces?.businessIds.map(id => (
                  <SavedPlaceCard key={id} id={id} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SavedPlaceCard({ id }: { id: string }) {
  const { data: biz, isLoading } = useGetBusiness(id);

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!biz) return null;

  return (
    <Link href={`/businesses/${id}`}>
      <div className="flex gap-3 p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer bg-card">
        {biz.imageUrl ? (
          <img src={biz.imageUrl} alt={biz.name} className="w-16 h-16 rounded object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0">
            <MapPin size={20} className="text-muted-foreground" />
          </div>
        )}
        <div className="overflow-hidden flex flex-col justify-center">
          <h4 className="font-semibold text-sm truncate">{biz.name}</h4>
          <p className="text-xs text-muted-foreground truncate">{biz.city}, {biz.state}</p>
          <span className="text-xs font-medium text-primary mt-1">{biz.category}</span>
        </div>
      </div>
    </Link>
  );
}
