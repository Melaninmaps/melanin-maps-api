import { useGetCurrentAuthUser, useGetMyProfile, useUpdateMyProfile, useListSavedPlaces, useGetBusiness } from "@workspace/api-client-react";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Save, MapPin, Map } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { data: auth, isLoading: authLoading } = useGetCurrentAuthUser();
  const { data: profile } = useGetMyProfile({ query: { queryKey: ['getMyProfile'], enabled: !!auth?.user } });
  const { data: savedPlaces } = useListSavedPlaces({ query: { queryKey: ['listSavedPlaces'], enabled: !!auth?.user } });
  
  const updateProfile = useUpdateMyProfile();
  
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

  if (authLoading) return <div className="p-10 bg-[#FAF6EF] min-h-screen"><Skeleton className="h-64 w-full rounded-3xl" /></div>;

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
    window.location.href = "/api/logout";
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      <div className="bg-[#2B1507] h-32 md:h-48 w-full absolute top-0 z-0" />
      
      <div className="container mx-auto px-4 md:px-6 py-12 relative z-10 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight">Your Profile</h1>
          <Button variant="outline" onClick={handleLogout} className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white hover:text-[#2B1507] backdrop-blur h-10">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
            <div className="text-2xl font-serif font-bold text-[#CA922B]">0</div>
            <div className="text-xs text-[#F5EBD8]/70 uppercase tracking-wider font-bold mt-1">Reviews</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
            <div className="text-2xl font-serif font-bold text-[#CA922B]">{savedPlaces?.businessIds?.length ?? 0}</div>
            <div className="text-xs text-[#F5EBD8]/70 uppercase tracking-wider font-bold mt-1">Saved</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
            <div className="text-2xl font-serif font-bold text-[#CA922B]">0</div>
            <div className="text-xs text-[#F5EBD8]/70 uppercase tracking-wider font-bold mt-1">Points</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-8 border border-[#3A1F0E]/5 shadow-sm text-center relative mt-8 md:mt-0">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#FAF6EF] border-4 border-white shadow-lg flex items-center justify-center -mt-16 mb-4 text-[#CA922B] text-3xl font-serif font-bold overflow-hidden">
                {profile?.profileImageUrl ? (
                  <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.firstName?.[0] || profile?.email?.[0]?.toUpperCase() || "M"
                )}
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#3A1F0E]">{profile?.firstName} {profile?.lastName}</h2>
              <p className="text-sm text-[#3A1F0E]/50 mb-8">{profile?.email}</p>
              
              <form onSubmit={handleUpdate} className="space-y-5 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70">First Name</label>
                  <Input className="bg-[#FAF6EF] border-transparent rounded-xl h-12 focus-visible:ring-[#CA922B]" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/70">Last Name</label>
                  <Input className="bg-[#FAF6EF] border-transparent rounded-xl h-12 focus-visible:ring-[#CA922B]" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <Button type="submit" className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-12 mt-4" disabled={updateProfile.isPending}>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </form>
            </div>
          </div>

          {/* Saved Places */}
          <div className="md:col-span-2 space-y-6 mt-8 md:mt-0">
            <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] flex items-center gap-2">
              <BookmarkIcon className="text-[#CA922B] w-6 h-6" /> Saved Places
            </h3>
            
            <div className="bg-white rounded-3xl p-6 border border-[#3A1F0E]/5 shadow-sm min-h-[400px]">
              {(!savedPlaces || savedPlaces.businessIds.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-[#3A1F0E]/40 py-20">
                  <Map size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-serif">You haven't saved any places yet.</p>
                  <Link href="/explore">
                    <Button className="mt-6 rounded-full bg-[#2B1507] hover:bg-[#1a0c04] text-white px-8 h-12">Explore Directory</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {savedPlaces.businessIds.map(id => (
                    <SavedPlaceCard key={id} id={id} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookmarkIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
}

function SavedPlaceCard({ id }: { id: string }) {
  const { data: biz, isLoading } = useGetBusiness(id, { query: { queryKey: ['getBusiness', id], enabled: !!id } });

  if (isLoading) return <Skeleton className="h-28 w-full rounded-2xl" />;
  if (!biz) return null;

  return (
    <Link href={`/businesses/${id}`}>
      <div className="flex gap-4 p-4 border border-[#3A1F0E]/10 rounded-2xl hover:border-[#CA922B] transition-colors cursor-pointer bg-white group">
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#FAF6EF]">
          {biz.imageUrl ? (
            <img src={biz.imageUrl} alt={biz.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin size={24} className="text-[#3A1F0E]/20" />
            </div>
          )}
        </div>
        <div className="overflow-hidden flex flex-col justify-center flex-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#CA922B] mb-1">{biz.category}</span>
          <h4 className="font-serif font-bold text-lg text-[#3A1F0E] truncate leading-tight">{biz.name}</h4>
          <div className="flex items-center gap-1 text-xs text-[#3A1F0E]/50 mt-1">
            <MapPin size={10} />
            <span className="truncate">{biz.city}, {biz.state}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
