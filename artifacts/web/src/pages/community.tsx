import { useState } from "react";
import { useListCommunityPosts, useCreateCommunityPost, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Heart, Share2, Send, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Community() {
  const { data: auth } = useGetCurrentAuthUser();
  const { data: posts, isLoading } = useListCommunityPosts();
  const createPost = useCreateCommunityPost();
  
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createPost.mutate({ data: { content } }, {
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["listCommunityPosts"] });
        toast({ title: "Posted successfully" });
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
            <Users className="w-3 h-3 text-[#CA922B]" />
            <span className="text-[10px] font-bold tracking-widest text-[#F5EBD8] uppercase">The Kinfolk Feed</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Community Voices</h1>
          <p className="text-[#F5EBD8]/80 text-lg max-w-2xl font-light">
            Share updates, ask for recommendations, and connect with the Melanin Maps network.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
        {/* Create Post Area */}
        {auth?.user ? (
          <div className="bg-white rounded-3xl p-6 border border-[#2B1507]/5 shadow-sm mb-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#CA922B]" />
            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FAF6EF] border border-[#CA922B]/30 flex items-center justify-center shrink-0 text-[#CA922B] font-bold text-lg font-serif">
                  {auth.user.firstName?.[0] || auth.user.email?.[0]?.toUpperCase() || "M"}
                </div>
                <div className="flex-1">
                  <Textarea 
                    placeholder="What's happening in your community?" 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] text-base border-none bg-[#FAF6EF] focus-visible:ring-0 rounded-2xl p-4 placeholder:text-[#3A1F0E]/30 text-[#3A1F0E] resize-none"
                  />
                  <div className="flex justify-end mt-4">
                    <Button type="submit" disabled={!content.trim() || createPost.isPending} className="rounded-full bg-[#2B1507] hover:bg-[#4a260d] text-white px-6">
                      <Send size={16} className="mr-2" /> Share Post
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-[#2B1507]/5 shadow-sm mb-10 text-center flex flex-col items-center">
            <Users size={32} className="text-[#CA922B] mb-4" />
            <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mb-2">Join the Conversation</h3>
            <p className="text-[#3A1F0E]/60 mb-6">Sign in to share your thoughts and connect with the community.</p>
            <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8">Sign In</Button>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#2B1507]/5 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1 pt-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/5" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))
          ) : posts?.length === 0 ? (
            <div className="text-center py-20 text-[#3A1F0E]/40 font-serif text-xl">
              No posts yet. Be the first to speak!
            </div>
          ) : (
            posts?.map((post) => (
              <div key={post.id} className="bg-white rounded-3xl p-6 md:p-8 border border-[#2B1507]/5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#2B1507] text-[#F5EBD8] flex items-center justify-center shrink-0 font-bold text-lg font-serif shadow-sm">
                    {post.authorName?.[0] || "U"}
                  </div>
                  <div>
                    <div className="font-bold text-[#3A1F0E]">{post.authorName || "Community Member"}</div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#3A1F0E]/40 mt-0.5">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Recently'}
                    </div>
                  </div>
                </div>
                
                <div className="pl-16">
                  <p className="text-[#3A1F0E]/80 text-base leading-relaxed whitespace-pre-wrap font-light mb-4">{post.content}</p>
                  
                  {post.imageUrl && (
                    <div className="rounded-2xl overflow-hidden mb-4 border border-[#2B1507]/10">
                      <img src={post.imageUrl} alt="Attachment" className="w-full max-h-96 object-cover" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-6 pt-4 border-t border-[#2B1507]/5 text-[#3A1F0E]/40">
                    <button className="flex items-center gap-2 text-sm font-medium hover:text-[#CA922B] transition-colors group">
                      <Heart size={18} className="group-hover:fill-[#CA922B]" /> 
                      <span>{post.likesCount || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 text-sm font-medium hover:text-[#2B1507] transition-colors">
                      <MessageSquare size={18} /> 
                      <span>{post.commentsCount || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 text-sm font-medium hover:text-[#2B1507] transition-colors ml-auto">
                      <Share2 size={18} />
                    </button>
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
